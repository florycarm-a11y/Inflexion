/**
 * scripts/tracker-collecte-2026-11-21.mjs — Génère data/tracker/ à partir des MONTANTS BRUTS
 * relevés sur EDGAR le 21 novembre 2026, en appliquant la méthode v1.3 (docs/tracker-methode.md).
 *
 * Pourquoi un script plutôt que des JSON écrits à la main : les sens de §4 se DÉDUISENT des
 * montants (croissances, marges, ratios). Les écrire à la main, c'est recopier un calcul sans
 * laisser de trace. Ici, chaque montant est celui qu'imprime le communiqué cité en source, et
 * chaque sens est calculé devant vous — relancer le script reproduit les fichiers à l'identique.
 *
 * Règles appliquées, et seulement elles :
 *   §4 D1  croissance sur un an du CA de la thèse, comparée à la même croissance à la publication
 *          précédente ; écart strictement supérieur à 1,0 point ; calcul sur les MONTANTS (précision 3).
 *   §4 D1 pré-revenus : unités livrées ; zéro puis zéro vaut « stable ».
 *   §4 D2  carnet : commandes = variation du carnet sur le trimestre + chiffre d'affaires du trimestre ;
 *          ratio commandes / chiffre d'affaires ; > 1,05 hausse, < 0,95 baisse.
 *   §4 D2 pré-revenus : barreau le plus haut atteint et réservations.
 *   §4 D4  marge opérationnelle GAAP du trimestre contre le même trimestre un an plus tôt ;
 *          seuil 2 points, ou 5 points si la marge du trimestre est négative.
 *   §4 précision 1 : marge non calculable si le CA est nul ou négatif, ou si la perte
 *          opérationnelle dépasse cent fois ce CA. Même critère pour D4 et pour la marge brute.
 *   §5     statut de prévision ; règle du trimestre seul (±2 %) pour qui ne guide pas l'année.
 *   §6     marge brute = (CA − coût des ventes) / CA.
 *
 * Lancer : node scripts/tracker-collecte-2026-11-21.mjs
 */
import { writeFileSync } from 'node:fs';

const RACINE = new URL('../', import.meta.url);
const JOUR = '2026-11-21'; // jour de la collecte : entrée des sociétés dans le tracker

// ── Outils de calcul (§4) ────────────────────────────────────────────────────

/** Croissance sur un an, calculée sur les montants publiés (précision 3). null si incalculable. */
const croissance = (courant, anPasse) =>
  (courant === null || anPasse === null || anPasse === 0) ? null : (courant - anPasse) / anPasse * 100;

/** Marge, en % — non calculable si CA nul/négatif ou si la perte dépasse cent fois le CA (précision 1). */
function marge(resultat, ca) {
  if (ca === null || resultat === null || ca <= 0) return null;
  if (resultat < 0 && Math.abs(resultat) > 100 * ca) return null;
  return resultat / ca * 100;
}

/** D1 et D2-clients : écart de croissance, seuil strict d'un point. */
function sensEcart(courante, precedente) {
  if (courante === null || precedente === null) return 'non-publie';
  const ecart = courante - precedente;
  if (ecart > 1) return 'hausse';
  if (ecart < -1) return 'baisse';
  return 'stable';
}

/** D2 carnet : ratio commandes / chiffre d'affaires du trimestre. */
function sensCarnet(carnet, carnetPrecedent, caTrimestre) {
  if (carnet === null || carnetPrecedent === null || caTrimestre === null || caTrimestre <= 0) return 'non-publie';
  const commandes = (carnet - carnetPrecedent) + caTrimestre;
  const ratio = commandes / caTrimestre;
  return ratio > 1.05 ? 'hausse' : ratio < 0.95 ? 'baisse' : 'stable';
}

/** D4 : marge opérationnelle du trimestre contre le même trimestre un an plus tôt. */
function sensMargeOperationnelle(op, ca, opAnPasse, caAnPasse) {
  const m = marge(op, ca), mPrecedente = marge(opAnPasse, caAnPasse);
  if (m === null || mPrecedente === null) return 'non-publie';
  const seuil = m < 0 ? 5 : 2; // « ou de plus de 5 points si la marge du trimestre est négative »
  const ecart = m - mPrecedente;
  if (ecart > seuil) return 'hausse';
  if (ecart < -seuil) return 'baisse';
  return 'stable';
}

/** §6 : marge brute, et son état tel que le schéma le nomme. */
function etatMargeBrute(ca, coutDesVentes) {
  if (coutDesVentes === null) return 'sans-objet'; // aucune ligne de coût des ventes présentée
  const mb = marge(ca - coutDesVentes, ca);
  if (mb === null) return 'non-calculable';
  return mb > 0 ? 'positive' : mb < 0 ? 'negative' : 'nulle';
}

/** §5, règle du trimestre seul : milieu de la fourchette du trimestre suivant contre le CA publié. */
function statutTrimestreSeul(basse, haute, caPublie) {
  const milieu = (basse + haute) / 2;
  const ecart = (milieu - caPublie) / caPublie * 100;
  return ecart > 2 ? 'relevee' : ecart < -2 ? 'abaissee' : 'maintenue';
}

/** §5 : relevée / abaissée / maintenue d'après le milieu de fourchette annuelle. */
function statutAnnuel(basse, haute, basseePrecedente, hautePrecedente) {
  if (basseePrecedente === null) return 'nouvelle';
  const milieu = (basse + haute) / 2, precedent = (basseePrecedente + hautePrecedente) / 2;
  return milieu > precedent ? 'relevee' : milieu < precedent ? 'abaissee' : 'maintenue';
}

const SENS_DU_STATUT = { relevee: 'hausse', abaissee: 'baisse', manquee: 'baisse', maintenue: 'stable', nouvelle: 'stable', 'non-publie': 'non-publie' };

// ── Sources : un document par publication, cité tel qu'il est déposé ─────────

const ARCH = 'https://www.sec.gov/Archives/edgar/data';
const src = (type, date, url) => ({ type, date, url });

// ─────────────────────────────────────────────────────────────────────────────
// CENTRUS ENERGY (LEU) — uranium et cycle du combustible — industriel
// CA de la thèse : segment LEU. Indicateur de demande : carnet de commandes.
// Montants en millions de dollars, tels qu'imprimés dans l'annexe 99.1 de chaque 8-K.
// ─────────────────────────────────────────────────────────────────────────────

const CENTRUS_SRC = {
  '2025-11-05': src('8-K', '2025-11-05', `${ARCH}/1065059/000162828025049679/ex991-10q2025_11x05.htm`),
  '2026-02-10': src('8-K', '2026-02-10', `${ARCH}/1065059/000162828026006909/ex991-10k2026_02x10.htm`),
  '2026-05-05': src('8-K', '2026-05-05', `${ARCH}/1065059/000162828026030674/ex991-10q2026_05x05.htm`),
  '2026-08-05': src('8-K', '2026-08-05', `${ARCH}/1065059/000162828026053433/ex991-10q2026_08x05.htm`),
  '2026-11-04': src('8-K', '2026-11-04', `${ARCH}/1065059/000162828026070229/ex991-10q2026_11x04.htm`),
};

// caThese / caTheseAnPasse : segment LEU du trimestre (null quand le communiqué ne le ventile pas).
// carnet : carnet de commandes TOTAL publié à la date de clôture du trimestre, en millions.
const CENTRUS = [
  { date: '2025-11-05', trimestre: 'T3 2025', caThese: 44.8, caTheseAnPasse: 34.8, ca: 74.9, caAnPasse: 57.7, cout: 79.2, op: -16.6, opAnPasse: -7.6, carnet: 3900, guidance: null, horsSerie: true },
  { date: '2026-02-10', trimestre: 'T4 2025', caThese: null, caTheseAnPasse: null, ca: 146.2, caAnPasse: 151.6, cout: 111.2, op: 12.8, opAnPasse: 45.1, carnet: 3800, guidance: [425, 475] },
  { date: '2026-05-05', trimestre: 'T1 2026', caThese: 44.6, caTheseAnPasse: 51.3, ca: 76.7, caAnPasse: 73.1, cout: 45.2, op: 0.8, opAnPasse: 20.5, carnet: 3900, guidance: [450, 500] },
  { date: '2026-08-05', trimestre: 'T2 2026', caThese: 153.4, caTheseAnPasse: 125.7, ca: 176.1, caAnPasse: 154.5, cout: 126.2, op: 10.4, opAnPasse: 33.5, carnet: 4500, guidance: [450, 500] },
  { date: '2026-11-04', trimestre: 'T3 2026', caThese: 31.8, caTheseAnPasse: 44.8, ca: 55.5, caAnPasse: 74.9, cout: 66.1, op: -29.7, opAnPasse: -16.6, carnet: 7000, guidance: [450, 500] },
];

// ─────────────────────────────────────────────────────────────────────────────
// ROCKET LAB (RKLB) — spatial — industriel
// CA de la thèse : chiffre d'affaires total (toute la société porte le récit spatial).
// Ne guide qu'un trimestre à la fois : §5, règle du trimestre seul.
// Montants en milliers de dollars, tels qu'imprimés ; carnet en millions.
// ─────────────────────────────────────────────────────────────────────────────

const RKLB_SRC = {
  '2025-11-10': src('8-K', '2025-11-10', `${ARCH}/1819994/000181999425000020/rklb-11102025ex991.htm`),
  '2026-02-26': src('8-K', '2026-02-26', `${ARCH}/1819994/000181999426000012/rklb-02262026ex991.htm`),
  '2026-05-07': src('8-K', '2026-05-07', `${ARCH}/1819994/000181999426000027/rklb-05072026ex991.htm`),
  '2026-08-10': src('8-K', '2026-08-10', `${ARCH}/1819994/000181999426000061/rklb-08102026ex991.htm`),
  '2026-11-09': src('8-K', '2026-11-09', `${ARCH}/1819994/000181999426000073/rklb-11092026ex991.htm`),
};

const RKLB = [
  { date: '2025-11-10', trimestre: 'T3 2025', ca: 155080, caAnPasse: 104808, cout: null, op: null, opAnPasse: null, carnet: null, guidanceT: [170000, 180000], horsSerie: true },
  { date: '2026-02-26', trimestre: 'T4 2025', ca: 179652, caAnPasse: 132388, cout: 111420, op: -51042, opAnPasse: -51549, carnet: 1850000, guidanceT: [185000, 200000] },
  { date: '2026-05-07', trimestre: 'T1 2026', ca: 200348, caAnPasse: 122569, cout: 123855, op: -55969, opAnPasse: -59188, carnet: 2200000, guidanceT: [225000, 240000] },
  { date: '2026-08-10', trimestre: 'T2 2026', ca: 234066, caAnPasse: 144498, cout: 149490, op: -57514, opAnPasse: -59639, carnet: 2360000, guidanceT: [250000, 265000] },
  { date: '2026-11-09', trimestre: 'T3 2026', ca: 267834, caAnPasse: 155080, cout: 177763, op: -79189, opAnPasse: -58969, carnet: 3570000, guidanceT: [270000, 290000] },
];

// ─────────────────────────────────────────────────────────────────────────────
// IONQ (IONQ) — quantique — industriel
// CA de la thèse : chiffre d'affaires total. Indicateur de demande : obligations de
// prestation restantes (RPO), publiées de façon irrégulière — d'où des D2 non publiés.
// Montants en milliers de dollars ; RPO en milliers.
// ─────────────────────────────────────────────────────────────────────────────

const IONQ_SRC = {
  '2026-02-25': src('8-K', '2026-02-25', `${ARCH}/1824920/000119312526071520/ionq-ex99_1.htm`),
  '2026-05-06': src('8-K', '2026-05-06', `${ARCH}/1824920/000119312526208923/ionq-ex99_1.htm`),
  '2026-08-05': src('8-K', '2026-08-05', `${ARCH}/1824920/000119312526335040/ionq-ex99_1.htm`),
  '2026-11-05': src('8-K', '2026-11-05', `${ARCH}/1824920/000119312526449779/ionq-ex99_1.htm`),
};

const IONQ = [
  { date: '2026-02-25', trimestre: 'T4 2025', ca: 61890, caAnPasse: 11710, cout: null, op: null, opAnPasse: null, carnet: null, guidance: [225000, 245000], horsSerie: true },
  { date: '2026-05-06', trimestre: 'T1 2026', ca: 64668, caAnPasse: 7566, cout: 49254, op: -271507, opAnPasse: -75679, carnet: 470000, guidance: [260000, 270000] },
  { date: '2026-08-05', trimestre: 'T2 2026', ca: 80050, caAnPasse: 20694, cout: 60110, op: -337243, opAnPasse: -160592, carnet: null, guidance: [280000, 290000] },
  { date: '2026-11-05', trimestre: 'T3 2026', ca: 173831, caAnPasse: 39866, cout: 135804, op: -433075, opAnPasse: -168813, carnet: 1200000, guidance: [505000, 515000] },
];

// ─────────────────────────────────────────────────────────────────────────────
// OKLO (OKLO) — petits réacteurs — pré-revenus
// Ne dépose plus de 8-K de résultats : la publication est le 10-Q lui-même.
// D1 = unités livrées (aucune) ; D2 = barreau d'engagement et réservations.
// Barreau 2 : les accords clients (Switch, Meta) n'ont pas donné lieu à un 8-K rubrique 1.01
// — les seuls 8-K 1.01 d'Oklo sont des accords de distribution d'actions — et §8 plafonne
// alors au barreau 2. Montants en milliers de dollars.
// ─────────────────────────────────────────────────────────────────────────────

const OKLO_SRC = {
  '2026-08-07': src('10-Q', '2026-08-07', `${ARCH}/1849056/000162828026054571/oklo-20260630.htm`),
  '2026-11-06': src('10-Q', '2026-11-06', `${ARCH}/1849056/000162828026071319/oklo-20260930.htm`),
};

const OKLO = [
  { date: '2026-08-07', trimestre: 'T2 2026', ca: 1210, caAnPasse: 0, cout: 721, op: -73190, opAnPasse: -28015, unites: 0, unitesPrecedent: null, barreau: 2, barreauPrecedent: null, jalon: 'maintenue', hesitation: true },
  { date: '2026-11-06', trimestre: 'T3 2026', ca: 1861, caAnPasse: 0, cout: 1089, op: -71017, opAnPasse: -36309, unites: 0, unitesPrecedent: 0, barreau: 2, barreauPrecedent: 2, jalon: 'non-publie' },
];

// ── Construction des publications ────────────────────────────────────────────

const dim = (sens, source) => (sens === 'non-publie' ? { sens } : { sens, source });

function publication({ date, trimestre, source, d1, d2, d4, statut, margeBrute, drapeaux = [] }) {
  return {
    date,
    trimestre,
    source,
    // D3 n'est pas saisi : il découle du statut de prévision (§5), seule lecture consignée.
    dimensions: { d1: dim(d1, source), d2: dim(d2, source), d3: dim(SENS_DU_STATUT[statut], source), d4: dim(d4, source) },
    statut_prevision: statut,
    marge_brute: (margeBrute === 'non-calculable' || margeBrute === 'sans-objet') ? { etat: margeBrute } : { etat: margeBrute, source },
    // §7 : les quatre mesures de financement n'ont pas été relevées — « si une mesure manque,
    // la couleur est non déterminée, pas verte ».
    financement: { couleur: 'non-determinee', motifs: [] },
    drapeaux,
  };
}

/** Série « carnet » (Centrus, Rocket Lab, IonQ) : D1 par croissance, D2 par carnet. */
function serieCarnet(lignes, sources, { caThese = false, trimestreSeul = false }) {
  const out = [];
  let croissancePrecedente = null, carnetPrecedent = null, guidancePrecedente = null;
  for (const l of lignes) {
    const courant = caThese ? l.caThese : l.ca;
    const anPasse = caThese ? l.caTheseAnPasse : l.caAnPasse;
    const c = croissance(courant, anPasse);
    const d1 = sensEcart(c, croissancePrecedente);
    const d2 = sensCarnet(l.carnet, carnetPrecedent, l.ca);
    const statut = trimestreSeul
      ? statutTrimestreSeul(l.guidanceT[0], l.guidanceT[1], l.ca)
      : (l.guidance === null ? 'non-publie'
        : statutAnnuel(l.guidance[0], l.guidance[1], guidancePrecedente?.[0] ?? null, guidancePrecedente?.[1] ?? null));
    const d4 = sensMargeOperationnelle(l.op, l.ca, l.opAnPasse, l.caAnPasse);
    if (!l.horsSerie) {
      out.push(publication({
        date: l.date, trimestre: l.trimestre, source: sources[l.date],
        d1, d2, d4, statut, margeBrute: etatMargeBrute(l.ca, l.cout),
      }));
    }
    croissancePrecedente = c;
    carnetPrecedent = l.carnet;
    if (!trimestreSeul && l.guidance !== null) guidancePrecedente = l.guidance;
  }
  return out;
}

/** Série « pré-revenus » (Oklo) : D1 par unités livrées, D2 par barreau. */
function seriePreRevenus(lignes, sources) {
  return lignes.map((l) => {
    // §4 : « Zéro livraison puis zéro livraison vaut stable » ; sans trimestre précédent, non publié.
    const d1 = l.unitesPrecedent === null ? 'non-publie'
      : (l.unites === 0 && l.unitesPrecedent === 0) ? 'stable'
        : l.unites > l.unitesPrecedent * 1.05 ? 'hausse' : l.unites < l.unitesPrecedent * 0.95 ? 'baisse' : 'stable';
    // §4 : barreau gagné → hausse, barreau perdu → baisse ; sans publication précédente, non publié.
    const d2 = l.barreauPrecedent === null ? 'non-publie'
      : l.barreau > l.barreauPrecedent ? 'hausse' : l.barreau < l.barreauPrecedent ? 'baisse' : 'stable';
    const drapeaux = l.hesitation
      // §3 : entre deux lectures, la plus neutre, inscrite au journal. Le jalon « 2028 » est
      // publié, mais la publication précédente n'a pas été lue : « avancé » et « repoussé » ne
      // sont pas exclus, et « maintenue » est la lecture neutre.
      ? [{ code: 'hesitation', source: sources[l.date] }]
      : [];
    return publication({
      date: l.date, trimestre: l.trimestre, source: sources[l.date],
      d1, d2, d4: sensMargeOperationnelle(l.op, l.ca, l.opAnPasse, l.caAnPasse),
      statut: l.jalon, margeBrute: etatMargeBrute(l.ca, l.cout), drapeaux,
    });
  });
}

// ── Catalogue ────────────────────────────────────────────────────────────────

const ENTREPRISES = [
  {
    id: 'centrus-energy', nom: 'Centrus Energy', recit: 'Uranium et cycle du combustible — enrichissement américain, dont le HALEU', archetype: 'industriel',
    ca_these: { valeur: 'Chiffre d’affaires du segment LEU (uranium faiblement enrichi)', source: CENTRUS_SRC['2026-11-04'] },
    indicateur_demande: { type: 'carnet', valeur: 'Carnet de commandes publié à chaque trimestre', source: CENTRUS_SRC['2026-11-04'] },
  },
  {
    id: 'rocket-lab', nom: 'Rocket Lab', recit: 'Spatial — lanceurs et systèmes spatiaux', archetype: 'industriel',
    ca_these: { valeur: 'Chiffre d’affaires total (lancement et systèmes spatiaux)', source: RKLB_SRC['2026-11-09'] },
    indicateur_demande: { type: 'carnet', valeur: 'Carnet de commandes publié à chaque trimestre', source: RKLB_SRC['2026-11-09'] },
  },
  {
    id: 'ionq', nom: 'IonQ', recit: 'Informatique quantique — systèmes à ions piégés et accès infonuagique', archetype: 'industriel',
    ca_these: { valeur: 'Chiffre d’affaires total (informatique quantique)', source: IONQ_SRC['2026-11-05'] },
    indicateur_demande: { type: 'carnet', valeur: 'Obligations de prestation restantes (RPO), publiées de façon irrégulière', source: IONQ_SRC['2026-11-05'] },
  },
  {
    id: 'oklo', nom: 'Oklo', recit: 'Petits réacteurs nucléaires — centrale Aurora', archetype: 'pre-revenus',
    ca_these: { valeur: 'Unités livrées — aucun réacteur mis en service à ce jour', source: OKLO_SRC['2026-11-06'] },
    indicateur_demande: { type: 'barreau-reservations', valeur: 'Barreau d’engagement et réservations', source: OKLO_SRC['2026-11-06'] },
  },
  {
    id: 'agility-robotics', nom: 'Agility Robotics', recit: 'Robotique humanoïde — robot Digit pour la logistique', archetype: 'pre-revenus',
    ca_these: { valeur: 'Unités livrées — aucune publication de résultats propre à ce jour', source: src('10-Q', '2026-11-13', `${ARCH}/2074973/000121390026119801/ea0311936-10q_agility.htm`) },
    // Aucun indicateur de demande publié : la société n'a pas encore publié de résultats en propre.
    indicateur_demande: { type: 'non-publie' },
  },
];

const FICHIERS = {
  'centrus-energy': { publications: serieCarnet(CENTRUS, CENTRUS_SRC, { caThese: true }), evenements_commerciaux: [] },
  'rocket-lab': { publications: serieCarnet(RKLB, RKLB_SRC, { trimestreSeul: true }), evenements_commerciaux: [] },
  ionq: { publications: serieCarnet(IONQ, IONQ_SRC, {}), evenements_commerciaux: [] },
  // Les engagements d'Oklo (Switch, Meta) sont décrits dans les 10-Q mais leurs dates de signature
  // exactes ne figurent pas dans les documents lus : aucun événement n'est daté ici plutôt que d'en
  // inventer la date. Le barreau 2 qu'ils établissent est sous le seuil de la Bascule commerciale (4).
  oklo: { publications: seriePreRevenus(OKLO, OKLO_SRC), evenements_commerciaux: [] },
  // Agility : le 10-Q du 13 novembre 2026 couvre la SPAC d'avant fusion (clôture le 4 novembre 2026),
  // pas Agility Robotics. Aucune publication de résultats propre à lire à ce jour.
  'agility-robotics': { publications: [], evenements_commerciaux: [] },
};

// ── Écriture ─────────────────────────────────────────────────────────────────

const catalogue = {
  methode_version: '1.3',
  methode_document: 'docs/tracker-methode.md',
  entreprises: ENTREPRISES.map((e) => ({ ...e, entree_tracker: JOUR, fichier: `data/tracker/${e.id}.json` })),
};
writeFileSync(new URL('data/tracker/entreprises.json', RACINE), JSON.stringify(catalogue, null, 2) + '\n');

for (const e of ENTREPRISES) {
  const f = FICHIERS[e.id];
  writeFileSync(new URL(`data/tracker/${e.id}.json`, RACINE),
    JSON.stringify({ entreprise: e.id, methode_version: '1.3', ...f }, null, 2) + '\n');
}

console.log(`${ENTREPRISES.length} sociétés écrites dans data/tracker/`);
for (const e of ENTREPRISES) console.log(`  ${e.id.padEnd(18)} ${String(FICHIERS[e.id].publications.length).padStart(2)} publication(s)`);
