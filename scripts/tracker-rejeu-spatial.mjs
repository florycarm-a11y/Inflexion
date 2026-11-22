/**
 * scripts/tracker-rejeu-spatial.mjs — Rejeu de l'univers spatial tiré par règle.
 *
 * Univers, filtres et règles de mesure : docs/tracker-univers-spatial.md, publié le 22 novembre
 * 2026 AVANT toute lecture. Méthode appliquée : v1.3 figée (docs/tracker-methode.md), par les
 * mêmes calculateurs que la collecte publique (scripts/lib/tracker-sens.mjs).
 *
 * CES FICHES NE SONT PAS PUBLIÉES. Elles vivent dans data/rejeu-spatial/, que le site ne lit pas.
 * La règle d'hygiène du protocole l'exige : publier une société de l'univers parce qu'elle a bonne
 * mine reviendrait à choisir ses cas en connaissant leur sort — le défaut même qu'on corrige.
 * Seule exception, inscrite au protocole : Rocket Lab, entrée au tracker la veille du tirage.
 *
 * Lancer : node scripts/tracker-rejeu-spatial.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  croissance, sensEcart, sensDemandeEngagee, sensMargeOperationnelle, sensUnites, sensBarreau,
  etatMargeBrute, statutPrevision, src, g, publication,
} from './lib/tracker-sens.mjs';

const RACINE = new URL('../', import.meta.url);
const ARCH = 'https://www.sec.gov/Archives/edgar/data';

// ═════════════════════════════════════════════════════════════════════════════
// VIRGIN GALACTIC (SPCE) — pré-revenus
//
// Ce que la société publie, et ce qu'elle ne publie pas — constaté sur douze publications :
//  · AUCUNE ligne de coût des ventes au compte de résultat → garde-fou de marge brute SANS OBJET
//    sur toute la série (§6, « si la société ne présente aucune ligne de coût des ventes »).
//  · Aucun décompte trimestriel de vols spatiaux. Le seul chiffre publié est annuel
//    (« six vols en six mois en 2023 ») → D1, qui compte les unités livrées, reste muet partout.
//  · Aucun nombre de réservations ni de futurs astronautes, jusqu'au T3 2026 (« 100+ astronautes »,
//    réouverture des ventes à 850 000 dollars le siège) → D2 ne bouge que par le barreau.
//  · Le barreau reste 3 sur toute la série : des particuliers ont versé des acomptes et la société
//    les mentionne à chaque communiqué (« membership fees » puis « access fees related to future
//    astronauts »). §8, barreau 3 : « réservations de particuliers avec acompte ». Les ventes ont
//    été fermées puis rouvertes, mais le barreau est « le plus haut atteint » : il ne redescend pas.
//  · D3 porte donc presque seule la série, par le jalon daté du premier vol commercial.
//
// Montants en milliers de dollars, tels qu'imprimés dans l'annexe 99.1 de chaque 8-K.
// `cout: undefined` = aucune ligne de coût des ventes présentée.
// ═════════════════════════════════════════════════════════════════════════════

const SPCE_SRC = {
  '2023-11-08': src('8-K', '2023-11-08', `${ARCH}/1706946/000170694623000133/spce-2023q3_8kprexhibit991.htm`),
  '2024-02-27': src('8-K', '2024-02-27', `${ARCH}/1706946/000170694624000036/spce-20231231_991pressrele.htm`),
  '2024-05-07': src('8-K', '2024-05-07', `${ARCH}/1706946/000170694624000102/spce-2024q1_8kprexhibit991.htm`),
  '2024-08-07': src('8-K', '2024-08-07', `${ARCH}/1706946/000170694624000173/spce-2024q2_8kprexhibit991.htm`),
  '2024-11-06': src('8-K', '2024-11-06', `${ARCH}/1706946/000170694624000234/spce-2024q3_8kprexhibit991.htm`),
  '2025-02-26': src('8-K', '2025-02-26', `${ARCH}/1706946/000170694625000036/spce-20241231_991pressrele.htm`),
  '2025-05-15': src('8-K', '2025-05-15', `${ARCH}/1706946/000170694625000077/spce-2025q1_8kprexhibit991.htm`),
  '2025-08-06': src('8-K', '2025-08-06', `${ARCH}/1706946/000170694625000130/spce-2025q2_8kprexhibit991.htm`),
  '2025-11-13': src('8-K', '2025-11-13', `${ARCH}/1706946/000170694625000149/spce-2025q3_8kprexhibit991.htm`),
  '2026-03-30': src('8-K', '2026-03-30', `${ARCH}/1706946/000170694626000017/spce-20251231_991pressrele.htm`),
  '2026-05-14': src('8-K', '2026-05-14', `${ARCH}/1706946/000170694626000067/spce-2026q1_8kprexhibit991.htm`),
  '2026-08-12': src('8-K', '2026-08-12', `${ARCH}/1706946/000170694626000126/spce-2026q2_8kprexhibit991.htm`),
  '2026-11-12': src('8-K', '2026-11-12', `${ARCH}/1706946/000119312526458580/d183696dex991.htm`),
};

// jalon : la date annoncée pour le premier vol commercial, telle qu'imprimée.
// statut : le statut de prévision qui en découle (§5) — un jalon repoussé vaut « abaissée ».
const SPCE = [
  { date: '2023-11-08', trimestre: 'T3 2023', ca: 1700, caAnPasse: 800, cout: undefined, op: -114272, opAnPasse: -145561, unites: null, barreau: 3, jalon: '2026', statut: 'maintenue', horsSerie: true },
  { date: '2024-02-27', trimestre: 'T4 2023', ca: 2809, caAnPasse: 869, cout: undefined, op: -114265, opAnPasse: -153311, unites: null, barreau: 3, jalon: '2026', statut: 'maintenue' },
  { date: '2024-05-07', trimestre: 'T1 2024', ca: 1985, caAnPasse: 392, cout: undefined, op: -111158, opAnPasse: -163406, unites: null, barreau: 3, jalon: '2026', statut: 'maintenue' },
  { date: '2024-08-07', trimestre: 'T2 2024', ca: 4220, caAnPasse: 1871, cout: undefined, op: -101790, opAnPasse: -139566, unites: null, barreau: 3, jalon: '2026', statut: 'maintenue' },
  { date: '2024-11-06', trimestre: 'T3 2024', ca: 402, caAnPasse: 1728, cout: undefined, op: -81728, opAnPasse: -114272, unites: null, barreau: 3, jalon: '2026', statut: 'maintenue' },
  { date: '2025-02-26', trimestre: 'T4 2024', ca: 400, caAnPasse: 2800, cout: undefined, op: -81953, opAnPasse: -114265, unites: null, barreau: 3, jalon: '2026', statut: 'maintenue' },
  // « Summer 2026 » précise l'année sans la repousser : un jalon précisé n'est pas un jalon avancé.
  { date: '2025-05-15', trimestre: 'T1 2025', ca: 500, caAnPasse: 2000, cout: undefined, op: -88448, opAnPasse: -111158, unites: null, barreau: 3, jalon: 'été 2026', statut: 'maintenue' },
  // « Fall of 2026 » après « Summer 2026 » : jalon repoussé, sans ambiguïté.
  { date: '2025-08-06', trimestre: 'T2 2025', ca: 400, caAnPasse: 4200, cout: undefined, op: -69942, opAnPasse: -101790, unites: null, barreau: 3, jalon: 'automne 2026', statut: 'abaissee' },
  // « Q4 2026 » après « fall of 2026 » : l'automne commence le 22 septembre, le quatrième trimestre
  // le 1er octobre. Les deux lectures — repoussé de quelques jours, ou simplement reformulé — se
  // défendent. §3 : on retient la plus neutre, et la ligne porte le drapeau « hésitation ».
  { date: '2025-11-13', trimestre: 'T3 2025', ca: 400, caAnPasse: 400, cout: undefined, op: -66166, opAnPasse: -81728, unites: null, barreau: 3, jalon: 'T4 2026', statut: 'maintenue', hesitation: true },
  { date: '2026-03-30', trimestre: 'T4 2025', ca: 300, caAnPasse: 400, cout: undefined, op: -60787, opAnPasse: -81953, unites: null, barreau: 3, jalon: 'T4 2026', statut: 'maintenue' },
  { date: '2026-05-14', trimestre: 'T1 2026', ca: 227, caAnPasse: 461, cout: undefined, op: -65592, opAnPasse: -88448, unites: null, barreau: 3, jalon: 'T4 2026', statut: 'maintenue' },
  // « February 2027 rather than the fourth quarter of 2026 » : la société dit elle-même le report.
  { date: '2026-08-12', trimestre: 'T2 2026', ca: 100, caAnPasse: 400, cout: undefined, op: -64926, opAnPasse: -69942, unites: null, barreau: 3, jalon: 'février 2027', statut: 'abaissee' },
  { date: '2026-11-12', trimestre: 'T3 2026', ca: 427, caAnPasse: 365, cout: undefined, op: -58994, opAnPasse: -66166, unites: null, barreau: 3, jalon: 'début T2 2027', statut: 'abaissee' },
];

// ── Séries ───────────────────────────────────────────────────────────────────

// ═════════════════════════════════════════════════════════════════════════════
// PLANET LABS (PL) — plateforme — exercice clos le 31 janvier
//
// Ce que la lecture des onze publications a imposé, et qu'aucune règle n'a eu à changer :
//  · §5 CHANGE DE RÈGLE EN COURS DE SÉRIE. Jusqu'au T3 FY2025 Planet ne guide que le trimestre
//    suivant : règle du trimestre seul, ±2 % contre le CA publié. À partir du T4 FY2025
//    (20 mars 2025) elle guide l'exercice : on compare les milieux de fourchette. Le texte le
//    prévoit — la règle du trimestre seul « ne s'applique qu'aux publications où la société ne
//    donne aucune prévision annuelle ». C'est une décision par ligne, pas par société.
//  · §4 D2 CHANGE DE CHEMIN EN COURS DE SÉRIE. Le carnet (« backlog ») n'apparaît qu'au
//    communiqué du T4 FY2024 ; avant, Planet ne publie qu'un ACV. La première ligne n'a donc
//    pas de carnet précédent et retombe sur le nombre de clients — « à défaut de commandes ».
//    Ensuite le carnet porte D2 seul, ce qui est heureux : Planet ARRÊTE de publier son nombre
//    de clients après le T4 FY2025, là où la série devient intéressante.
//  · LE CARNET AU 31 JANVIER 2026 N'EST PAS CHIFFRÉ : le communiqué du T4 FY2026 n'imprime que
//    « over $900 Million ». Retenir 900 000 importerait un arrondi de ±50 000 dans une variation
//    de carnet — ce que la précision 3 interdit. Règle d'hésitation de §3, « retenir la plus
//    neutre » : carnet NON PUBLIÉ, et D2 muet sur deux lignes (T4 FY2026 et T1 FY2027).
//  · Le comparatif du nombre de clients du T3 FY2024 n'est pas imprimé, seul « +13 % » l'est :
//    précision 3, « un pourcentage imprimé ne sert que s'il n'est pas recalculable ». La borne
//    suffit de toute façon — 13 % arrondi vient de [12,5 ; 13,5 %), donc l'écart avec les
//    14,898 % du T4 FY2024 tombe dans (1,40 ; 2,40] : hausse quel que soit le chiffre exact.
//
// Montants en milliers de dollars, à la précision qu'imprime le communiqué du jour (précision 8).
// La ligne du 7 décembre 2023 est HORS SÉRIE : hors de la fenêtre de lecture du protocole, elle
// ne sert qu'à fournir les valeurs précédentes de la première ligne (précision 7).
// ═════════════════════════════════════════════════════════════════════════════

const PL_SRC = {
  '2023-12-07': src('8-K', '2023-12-07', `${ARCH}/1836833/000183683323000107/exhibit991q32024.htm`),
  '2024-03-28': src('8-K', '2024-03-28', `${ARCH}/1836833/000183683324000030/exhibit991q42024.htm`),
  '2024-06-06': src('8-K', '2024-06-06', `${ARCH}/1836833/000183683324000061/exhibit991q12025.htm`),
  '2024-09-05': src('8-K', '2024-09-05', `${ARCH}/1836833/000183683324000101/exhibit991q22025.htm`),
  '2024-12-09': src('8-K', '2024-12-09', `${ARCH}/1836833/000183683324000117/exhibit991q32025.htm`),
  '2025-03-20': src('8-K', '2025-03-20', `${ARCH}/1836833/000183683325000039/exhibit991q42025.htm`),
  '2025-06-04': src('8-K', '2025-06-04', `${ARCH}/1836833/000183683325000062/exhibit991q12026.htm`),
  '2025-09-08': src('8-K', '2025-09-08', `${ARCH}/1836833/000183683325000103/exhibit991q22026.htm`),
  '2025-12-10': src('8-K', '2025-12-10', `${ARCH}/1836833/000119312525314160/pl-ex99_1.htm`),
  '2026-03-19': src('8-K', '2026-03-19', `${ARCH}/1836833/000119312526115951/pl-ex99_1.htm`),
  '2026-06-04': src('8-K', '2026-06-04', `${ARCH}/1836833/000119312526257401/pl-ex99_1.htm`),
  '2026-09-03': src('8-K', '2026-09-03', `${ARCH}/1836833/000119312526381874/pl-ex99_1.htm`),
};

const PL = [
  // Hors série (précision 7) : ne porte aucune ligne, fournit les valeurs précédentes.
  // croissanceClients : 13 % imprimé, comparatif absolu absent du communiqué (précision 3).
  { date: '2023-12-07', trimestre: 'T3 FY2024', ca: 55400, caAnPasse: 49700, cout: 29350, op: -47860, opAnPasse: -42630, carnet: null, croissanceClients: 13, guidanceT: [56000, 59000], horsSerie: true },
  { date: '2024-03-28', trimestre: 'T4 FY2024', ca: 58900, caAnPasse: 53000, cout: 26400, op: -33900, opAnPasse: -42700, carnet: 242392, croissanceClients: croissance(1018, 886), guidanceT: [58000, 61000] },
  { date: '2024-06-06', trimestre: 'T1 FY2025', ca: 60400, caAnPasse: 52703, cout: 28757, op: -34571, opAnPasse: -44692, carnet: 219773, croissanceClients: 14, guidanceT: [59000, 63000] },
  { date: '2024-09-05', trimestre: 'T2 FY2025', ca: 61100, caAnPasse: 53761, cout: 28782, op: -39577, opAnPasse: -43280, carnet: 213500, croissanceClients: 7, guidanceT: [61000, 64000] },
  { date: '2024-12-09', trimestre: 'T3 FY2025', ca: 61300, caAnPasse: 55400, cout: 23700, op: -22600, opAnPasse: -47900, carnet: 232100, croissanceClients: 4, guidanceT: [61000, 63000] },
  { date: '2025-03-20', trimestre: 'T4 FY2025', ca: 61600, caAnPasse: 58900, cout: 23300, op: -19400, opAnPasse: -33900, carnet: 498500, croissanceClients: null, guidance: g(2026, 260000, 280000) },
  { date: '2025-06-04', trimestre: 'T1 FY2026', ca: 66300, caAnPasse: 60400, cout: 29700, op: -22800, opAnPasse: -34600, carnet: 527000, croissanceClients: null, guidance: g(2026, 265000, 280000) },
  { date: '2025-09-08', trimestre: 'T2 FY2026', ca: 73400, caAnPasse: 61100, cout: 31100, op: -18000, opAnPasse: -39600, carnet: 736100, croissanceClients: null, guidance: g(2026, 281000, 289000) },
  { date: '2025-12-10', trimestre: 'T3 FY2026', ca: 81300, caAnPasse: 61300, cout: 34700, op: -18300, opAnPasse: -22600, carnet: 734500, croissanceClients: null, guidance: g(2026, 297000, 301000) },
  // « over $900 Million » : aucun montant exact → carnet non publié, hésitation consignée.
  { date: '2026-03-19', trimestre: 'T4 FY2026', ca: 86800, caAnPasse: 61600, cout: 39800, op: -36000, opAnPasse: -19400, carnet: null, croissanceClients: null, guidance: g(2027, 415000, 440000), hesitation: true },
  { date: '2026-06-04', trimestre: 'T1 FY2027', ca: 94200, caAnPasse: 66300, cout: 43700, op: -34900, opAnPasse: -22800, carnet: 906100, croissanceClients: null, guidance: g(2027, 425000, 441000) },
  { date: '2026-09-03', trimestre: 'T2 FY2027', ca: 116100, caAnPasse: 73386, cout: 50420, op: -13509, opAnPasse: -17960, carnet: 814900, croissanceClients: null, guidance: g(2027, 430000, 441000) },
];

/** Série « pré-revenus » : D1 par unités livrées, D2 par barreau, D3 par jalon daté. */
function seriePreRevenus(lignes, sources) {
  const out = [];
  let unitesPrecedent = null, barreauPrecedent = null;
  for (const l of lignes) {
    if (!l.horsSerie) {
      out.push(publication({
        date: l.date, trimestre: l.trimestre, source: sources[l.date],
        d1: sensUnites(l.unites, unitesPrecedent),
        d2: sensBarreau(l.barreau, barreauPrecedent),
        d4: sensMargeOperationnelle(l.op, l.ca, l.opAnPasse, l.caAnPasse),
        statut: l.statut, margeBrute: etatMargeBrute(l.ca, l.cout),
        drapeaux: l.hesitation ? [{ code: 'hesitation', source: sources[l.date] }] : [],
      }));
    }
    unitesPrecedent = l.unites;
    barreauPrecedent = l.barreau;
  }
  return out;
}

/** Série d'un industriel ou d'une plateforme. D2 et le statut de prévision suivent la ligne. */
function serie(lignes, sources, { caThese = false } = {}) {
  const out = [];
  let croissancePrecedente = null, carnetPrecedent = null, guidancePrecedente = null, clientsPrecedent = null;
  for (const l of lignes) {
    const c = croissance(caThese ? l.caThese : l.ca, caThese ? l.caTheseAnPasse : l.caAnPasse);
    if (!l.horsSerie) {
      out.push(publication({
        date: l.date, trimestre: l.trimestre, source: sources[l.date],
        d1: sensEcart(c, croissancePrecedente),
        d2: sensDemandeEngagee({
          carnet: l.carnet, carnetPrecedent, ca: l.ca,
          croissanceClients: l.croissanceClients, croissanceClientsPrecedente: clientsPrecedent,
        }),
        d4: sensMargeOperationnelle(l.op, l.ca, l.opAnPasse, l.caAnPasse),
        statut: statutPrevision(l, guidancePrecedente),
        margeBrute: etatMargeBrute(l.ca, l.cout),
        drapeaux: l.hesitation ? [{ code: 'hesitation', source: sources[l.date] }] : [],
      }));
    }
    croissancePrecedente = c;
    carnetPrecedent = l.carnet;
    clientsPrecedent = l.croissanceClients;
    if (l.guidance != null) guidancePrecedente = l.guidance;
  }
  return out;
}

// ── Les sociétés lues à ce jour ──────────────────────────────────────────────
// L'univers en compte dix-huit (docs/tracker-univers-spatial.md). Celles qui ne figurent pas
// encore ici restent à lire : leur absence est un état d'avancement, pas une exclusion.

const LUES = [
  {
    id: 'virgin-galactic', nom: 'Virgin Galactic', archetype: 'pre-revenus',
    recit: 'Spatial — vols suborbitaux habités, vaisseaux Delta',
    ca_these: { valeur: 'Unités livrées — vols spatiaux commerciaux effectués', source: SPCE_SRC['2026-11-12'] },
    indicateur_demande: { type: 'barreau-reservations', valeur: 'Barreau d’engagement et réservations de futurs astronautes', source: SPCE_SRC['2026-11-12'] },
    publications: seriePreRevenus(SPCE, SPCE_SRC),
    evenements_commerciaux: [],
  },
  {
    id: 'planet-labs', nom: 'Planet Labs', archetype: 'plateforme',
    recit: 'Spatial — imagerie quotidienne de la Terre vendue par abonnement',
    ca_these: { valeur: 'Chiffre d’affaires total — Planet ne publie qu’un seul segment', source: PL_SRC['2026-09-03'] },
    indicateur_demande: { type: 'carnet', valeur: 'Carnet de commandes (« backlog »), à défaut nombre de clients', source: PL_SRC['2026-09-03'] },
    publications: serie(PL, PL_SRC),
    evenements_commerciaux: [],
  },
];

// ── Écriture ─────────────────────────────────────────────────────────────────

mkdirSync(new URL('data/rejeu-spatial/', RACINE), { recursive: true });

const index = {
  rejeu: 'univers spatial tiré par règle',
  protocole: 'docs/tracker-univers-spatial.md',
  methode_version: '1.3',
  univers_total: 18,
  lues: LUES.length,
  publie: false, // règle d'hygiène : rien de ce jeu n'entre dans le tracker avant la fin du rejeu
  societes: LUES.map((e) => ({
    id: e.id, nom: e.nom, archetype: e.archetype, recit: e.recit,
    ca_these: e.ca_these, indicateur_demande: e.indicateur_demande,
    publications: e.publications.length, fichier: `data/rejeu-spatial/${e.id}.json`,
  })),
};
writeFileSync(new URL('data/rejeu-spatial/index.json', RACINE), JSON.stringify(index, null, 2) + '\n');

for (const e of LUES) {
  writeFileSync(new URL(`data/rejeu-spatial/${e.id}.json`, RACINE),
    JSON.stringify({ entreprise: e.id, methode_version: '1.3', publications: e.publications, evenements_commerciaux: e.evenements_commerciaux }, null, 2) + '\n');
}

const total = LUES.reduce((n, e) => n + e.publications.length, 0);
console.log(`rejeu spatial : ${LUES.length}/18 sociétés lues, ${total} publications`);
for (const e of LUES) console.log(`  ${e.id.padEnd(18)} ${String(e.publications.length).padStart(2)} publication(s)`);
