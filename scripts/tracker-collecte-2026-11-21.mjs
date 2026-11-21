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
 *   §4 D2  à défaut de commandes : croissance sur un an du nombre de clients, comparée à la
 *          publication précédente (même seuil d'un point).
 *   §4 D2 pré-revenus : barreau le plus haut atteint et réservations.
 *   §4 D4  marge opérationnelle GAAP du trimestre contre le même trimestre un an plus tôt ;
 *          seuil 2 points, ou 5 points si la marge du trimestre est négative.
 *   §4 précision 1 : marge non calculable si le CA est nul ou négatif, ou si la perte
 *          opérationnelle dépasse cent fois ce CA. Même critère pour D4 et pour la marge brute.
 *   §5     statut de prévision. Une prévision qui porte sur un AUTRE exercice que la précédente est
 *          « nouvelle » : « elle ne se compare pas à celle de l'exercice précédent ».
 *          Règle du trimestre seul (±2 %) pour qui ne guide pas l'année.
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

/** D1, et D2 par le nombre de clients : écart de croissance, seuil strict d'un point. */
function sensEcart(courante, precedente) {
  if (courante === null || precedente === null || courante === undefined || precedente === undefined) return 'non-publie';
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

/** §6 : marge brute, et son état tel que le schéma le nomme.
 *  coutDesVentes === undefined : la société ne présente AUCUNE ligne de coût des ventes → garde-fou sans objet. */
function etatMargeBrute(ca, coutDesVentes) {
  if (coutDesVentes === undefined) return 'sans-objet';
  if (coutDesVentes === null || ca === null) return 'non-calculable';
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

/** §5 : d'après le milieu de la fourchette annuelle. Un changement d'exercice donne « nouvelle ». */
function statutAnnuel(guidance, precedente) {
  if (guidance === null) return 'non-publie';
  if (precedente === null || guidance.exercice !== precedente.exercice) return 'nouvelle';
  const milieu = (guidance.basse + guidance.haute) / 2;
  const avant = (precedente.basse + precedente.haute) / 2;
  return milieu > avant ? 'relevee' : milieu < avant ? 'abaissee' : 'maintenue';
}

const SENS_DU_STATUT = { relevee: 'hausse', abaissee: 'baisse', manquee: 'baisse', maintenue: 'stable', nouvelle: 'stable', 'non-publie': 'non-publie' };

// ── Sources : un document par publication, cité tel qu'il est déposé ─────────

const ARCH = 'https://www.sec.gov/Archives/edgar/data';
const src = (type, date, url) => ({ type, date, url });
const g = (exercice, basse, haute) => ({ exercice, basse, haute });

// ─────────────────────────────────────────────────────────────────────────────
// CENTRUS ENERGY (LEU) — uranium et cycle du combustible — industriel
// CA de la thèse : segment LEU. Indicateur de demande : carnet de commandes.
// Montants en millions de dollars ; carnet total en millions.
// Centrus ne ventile pas son segment LEU au quatrième trimestre : D1 y est non publié.
// ─────────────────────────────────────────────────────────────────────────────

const CENTRUS_SRC = {
  '2024-10-28': src('8-K', '2024-10-28', `${ARCH}/1065059/000106505924000086/ex991-10q2024_10x28.htm`),
  '2025-02-06': src('8-K', '2025-02-06', `${ARCH}/1065059/000106505925000004/ex991-10k2025_02x06.htm`),
  '2025-05-07': src('8-K', '2025-05-07', `${ARCH}/1065059/000106505925000022/ex991-10q2025_05x07.htm`),
  '2025-08-05': src('8-K', '2025-08-05', `${ARCH}/1065059/000106505925000056/ex991-10q2025_08x05.htm`),
  '2025-11-05': src('8-K', '2025-11-05', `${ARCH}/1065059/000162828025049679/ex991-10q2025_11x05.htm`),
  '2026-02-10': src('8-K', '2026-02-10', `${ARCH}/1065059/000162828026006909/ex991-10k2026_02x10.htm`),
  '2026-05-05': src('8-K', '2026-05-05', `${ARCH}/1065059/000162828026030674/ex991-10q2026_05x05.htm`),
  '2026-08-05': src('8-K', '2026-08-05', `${ARCH}/1065059/000162828026053433/ex991-10q2026_08x05.htm`),
  '2026-11-04': src('8-K', '2026-11-04', `${ARCH}/1065059/000162828026070229/ex991-10q2026_11x04.htm`),
};

const CENTRUS = [
  { date: '2024-10-28', trimestre: 'T3 2024', caThese: 34.8, caTheseAnPasse: 40.5, ca: 57.7, caAnPasse: 51.3, cout: 48.8, op: -7.6, opAnPasse: null, carnet: 3800, guidance: null, horsSerie: true },
  { date: '2025-02-06', trimestre: 'T4 2024', caThese: null, caTheseAnPasse: null, ca: 151.6, caAnPasse: 103.6, cout: 89.8, op: 45.1, opAnPasse: 32.6, carnet: 3700, guidance: null },
  { date: '2025-05-07', trimestre: 'T1 2025', caThese: 51.3, caTheseAnPasse: 23.6, ca: 73.1, caAnPasse: 43.7, cout: 40.2, op: 20.5, opAnPasse: -10.6, carnet: 3800, guidance: null },
  { date: '2025-08-05', trimestre: 'T2 2025', caThese: 125.7, caTheseAnPasse: 169.6, ca: 154.5, caAnPasse: 189.0, cout: 100.6, op: 33.5, opAnPasse: 21.1, carnet: 3600, guidance: null },
  { date: '2025-11-05', trimestre: 'T3 2025', caThese: 44.8, caTheseAnPasse: 34.8, ca: 74.9, caAnPasse: 57.7, cout: 79.2, op: -16.6, opAnPasse: -7.6, carnet: 3900, guidance: null },
  { date: '2026-02-10', trimestre: 'T4 2025', caThese: null, caTheseAnPasse: null, ca: 146.2, caAnPasse: 151.6, cout: 111.2, op: 12.8, opAnPasse: 45.1, carnet: 3800, guidance: g(2026, 425, 475) },
  { date: '2026-05-05', trimestre: 'T1 2026', caThese: 44.6, caTheseAnPasse: 51.3, ca: 76.7, caAnPasse: 73.1, cout: 45.2, op: 0.8, opAnPasse: 20.5, carnet: 3900, guidance: g(2026, 450, 500) },
  { date: '2026-08-05', trimestre: 'T2 2026', caThese: 153.4, caTheseAnPasse: 125.7, ca: 176.1, caAnPasse: 154.5, cout: 126.2, op: 10.4, opAnPasse: 33.5, carnet: 4500, guidance: g(2026, 450, 500) },
  { date: '2026-11-04', trimestre: 'T3 2026', caThese: 31.8, caTheseAnPasse: 44.8, ca: 55.5, caAnPasse: 74.9, cout: 66.1, op: -29.7, opAnPasse: -16.6, carnet: 7000, guidance: g(2026, 450, 500) },
];

// ─────────────────────────────────────────────────────────────────────────────
// ROCKET LAB (RKLB) — spatial — industriel
// CA de la thèse : chiffre d'affaires total. Ne guide qu'un trimestre : §5, règle du trimestre seul.
// Le carnet n'apparaît dans les communiqués qu'à partir du T4 2025 : D2 muet avant.
// Montants en milliers de dollars ; carnet en milliers.
// ─────────────────────────────────────────────────────────────────────────────

const RKLB_SRC = {
  '2025-02-27': src('8-K', '2025-02-27', `${ARCH}/1819994/000162828025008658/rklb-ex99_1.htm`),
  '2025-05-08': src('8-K', '2025-05-08', `${ARCH}/1819994/000162828025023816/rklb-05082025ex991.htm`),
  '2025-08-07': src('8-K', '2025-08-07', `${ARCH}/1819994/000162828025038900/rklb-08072025ex991.htm`),
  '2025-11-10': src('8-K', '2025-11-10', `${ARCH}/1819994/000181999425000020/rklb-11102025ex991.htm`),
  '2026-02-26': src('8-K', '2026-02-26', `${ARCH}/1819994/000181999426000012/rklb-02262026ex991.htm`),
  '2026-05-07': src('8-K', '2026-05-07', `${ARCH}/1819994/000181999426000027/rklb-05072026ex991.htm`),
  '2026-08-10': src('8-K', '2026-08-10', `${ARCH}/1819994/000181999426000061/rklb-08102026ex991.htm`),
  '2026-11-09': src('8-K', '2026-11-09', `${ARCH}/1819994/000181999426000073/rklb-11092026ex991.htm`),
};

const RKLB = [
  { date: '2025-02-27', trimestre: 'T4 2024', ca: 132388, caAnPasse: 59991, cout: 95571, op: -51549, opAnPasse: -47883, carnet: null, guidanceT: [117000, 123000], horsSerie: true },
  { date: '2025-05-08', trimestre: 'T1 2025', ca: 122569, caAnPasse: 92767, cout: 87322, op: -59188, opAnPasse: -43079, carnet: null, guidanceT: [130000, 140000] },
  { date: '2025-08-07', trimestre: 'T2 2025', ca: 144498, caAnPasse: 106251, cout: 98110, op: -59639, opAnPasse: -43274, carnet: null, guidanceT: [145000, 155000] },
  { date: '2025-11-10', trimestre: 'T3 2025', ca: 155080, caAnPasse: 104808, cout: 97766, op: -58969, opAnPasse: -51899, carnet: null, guidanceT: [170000, 180000] },
  { date: '2026-02-26', trimestre: 'T4 2025', ca: 179652, caAnPasse: 132388, cout: 111420, op: -51042, opAnPasse: -51549, carnet: 1850000, guidanceT: [185000, 200000] },
  { date: '2026-05-07', trimestre: 'T1 2026', ca: 200348, caAnPasse: 122569, cout: 123855, op: -55969, opAnPasse: -59188, carnet: 2200000, guidanceT: [225000, 240000] },
  { date: '2026-08-10', trimestre: 'T2 2026', ca: 234066, caAnPasse: 144498, cout: 149490, op: -57514, opAnPasse: -59639, carnet: 2360000, guidanceT: [250000, 265000] },
  { date: '2026-11-09', trimestre: 'T3 2026', ca: 267834, caAnPasse: 155080, cout: 177763, op: -79189, opAnPasse: -58969, carnet: 3570000, guidanceT: [270000, 290000] },
];

// ─────────────────────────────────────────────────────────────────────────────
// IONQ (IONQ) — quantique — industriel
// Indicateur de demande : obligations de prestation restantes (RPO), publiées de façon
// irrégulière — d'où des D2 non publiés. Montants en milliers de dollars.
// ─────────────────────────────────────────────────────────────────────────────

const IONQ_SRC = {
  '2025-05-07': src('8-K', '2025-05-07', `${ARCH}/1824920/000095017025065685/ionq-ex99_1.htm`),
  '2025-08-06': src('8-K', '2025-08-06', `${ARCH}/1824920/000095017025104021/ionq-ex99_1.htm`),
  '2025-11-05': src('8-K', '2025-11-05', `${ARCH}/1824920/000119312525266878/ionq-ex99_1.htm`),
  '2026-02-25': src('8-K', '2026-02-25', `${ARCH}/1824920/000119312526071520/ionq-ex99_1.htm`),
  '2026-05-06': src('8-K', '2026-05-06', `${ARCH}/1824920/000119312526208923/ionq-ex99_1.htm`),
  '2026-08-05': src('8-K', '2026-08-05', `${ARCH}/1824920/000119312526335040/ionq-ex99_1.htm`),
  '2026-11-05': src('8-K', '2026-11-05', `${ARCH}/1824920/000119312526449779/ionq-ex99_1.htm`),
};

const IONQ = [
  { date: '2025-05-07', trimestre: 'T1 2025', ca: 7566, caAnPasse: 7582, cout: 4315, op: -75679, opAnPasse: -52876, carnet: null, guidance: g(2025, 75000, 95000), horsSerie: true },
  { date: '2025-08-06', trimestre: 'T2 2025', ca: 20694, caAnPasse: 11381, cout: 8327, op: -160592, opAnPasse: -48941, carnet: null, guidance: g(2025, 82000, 100000) },
  { date: '2025-11-05', trimestre: 'T3 2025', ca: 39866, caAnPasse: 12400, cout: 21253, op: -168813, opAnPasse: -53135, carnet: null, guidance: g(2025, 106000, 110000) },
  { date: '2026-02-25', trimestre: 'T4 2025', ca: 61890, caAnPasse: 11710, cout: 43593, op: -228631, opAnPasse: -77503, carnet: null, guidance: g(2026, 225000, 245000) },
  { date: '2026-05-06', trimestre: 'T1 2026', ca: 64668, caAnPasse: 7566, cout: 49254, op: -271507, opAnPasse: -75679, carnet: 470000, guidance: g(2026, 260000, 270000) },
  { date: '2026-08-05', trimestre: 'T2 2026', ca: 80050, caAnPasse: 20694, cout: 60110, op: -337243, opAnPasse: -160592, carnet: null, guidance: g(2026, 280000, 290000) },
  { date: '2026-11-05', trimestre: 'T3 2026', ca: 173831, caAnPasse: 39866, cout: 135804, op: -433075, opAnPasse: -168813, carnet: 1200000, guidance: g(2026, 505000, 515000) },
];

// ─────────────────────────────────────────────────────────────────────────────
// VERTIV (VRT) — refroidissement liquide et infrastructure de centre de données — industriel
// Vertiv publie ses COMMANDES en pourcentage de croissance, jamais en montant, et son carnet
// seulement par intermittence (ni dans les communiqués de 2026, ni dans les 10-Q du même jour) :
// D2 reste muet dès que la variation du carnet n'est pas calculable. Montants en millions.
// ─────────────────────────────────────────────────────────────────────────────

const VRT_SRC = {
  '2025-07-30': src('8-K', '2025-07-30', `${ARCH}/1674101/000167410125000006/q22025exhibit991vrt7302025.htm`),
  '2025-10-22': src('8-K', '2025-10-22', `${ARCH}/1674101/000167410125000020/q32025exhibit991vrt10222025.htm`),
  '2026-02-11': src('8-K', '2026-02-11', `${ARCH}/1674101/000167410126000006/exhibit991vrt02112026.htm`),
  '2026-04-22': src('8-K', '2026-04-22', `${ARCH}/1674101/000162828026026379/q12026exhibit991vrt04222026.htm`),
  '2026-07-29': src('8-K', '2026-07-29', `${ARCH}/1674101/000162828026050323/q22026exhibit991vrt07292026.htm`),
  '2026-10-28': src('8-K', '2026-10-28', `${ARCH}/1674101/000162828026067707/q32026exhibit991vrt10282026.htm`),
};

const VRT = [
  { date: '2025-07-30', trimestre: 'T2 2025', ca: 2638.1, caAnPasse: 1952.8, cout: 1741.5, op: 442.4, opAnPasse: 336.0, carnet: 8500, guidance: g(2025, 9925, 10075), horsSerie: true },
  { date: '2025-10-22', trimestre: 'T3 2025', ca: 2676, caAnPasse: 2073.5, cout: 1665.1, op: 517, opAnPasse: 371.6, carnet: 9500, guidance: g(2025, 10160, 10240) },
  { date: '2026-02-11', trimestre: 'T4 2025', ca: 2880.0, caAnPasse: 2346.4, cout: 1758.6, op: 579.9, opAnPasse: 457.2, carnet: 15000, guidance: g(2026, 13250, 13750) },
  { date: '2026-04-22', trimestre: 'T1 2026', ca: 2650, caAnPasse: 2036.0, cout: 1649.8, op: 440.1, opAnPasse: 290.7, carnet: null, guidance: g(2026, 13500, 14000) },
  { date: '2026-07-29', trimestre: 'T2 2026', ca: 3274, caAnPasse: 2638, cout: 2039, op: 638, opAnPasse: 442, carnet: null, guidance: g(2026, 13800, 14200) },
  { date: '2026-10-28', trimestre: 'T3 2026', ca: 4312.8, caAnPasse: 2675.8, cout: 2669.4, op: 983.8, opAnPasse: 516.7, carnet: null, guidance: g(2026, 14450, 14850) },
];

// ─────────────────────────────────────────────────────────────────────────────
// SENTINELONE (S) — cybersécurité — plateforme
// Ni commandes ni carnet publiés : l'indicateur de demande est le NOMBRE DE CLIENTS à plus de
// 100 000 $ d'ARR, dont la société imprime la croissance sur un an (§2, ordre de préférence).
// Exercice fiscal décalé : l'exercice 2027 s'achève le 31 janvier 2027.
// Montants en millions de dollars ; coût des ventes et résultat opérationnel en milliers.
// ─────────────────────────────────────────────────────────────────────────────

const S_SRC = {
  '2025-05-28': src('8-K', '2025-05-28', `${ARCH}/1583708/000158370825000104/sentineloneq126exhibit991.htm`),
  '2025-08-28': src('8-K', '2025-08-28', `${ARCH}/1583708/000158370825000146/sentineloneq226exhibit991.htm`),
  '2025-12-04': src('8-K', '2025-12-04', `${ARCH}/1583708/000158370825000157/sentineloneq326exhibit991.htm`),
  '2026-03-12': src('8-K', '2026-03-12', `${ARCH}/1583708/000158370826000014/sentineloneq426exhibit991.htm`),
  '2026-05-28': src('8-K', '2026-05-28', `${ARCH}/1583708/000158370826000039/sentineloneq127exhibit991.htm`),
  '2026-08-27': src('8-K', '2026-08-27', `${ARCH}/1583708/000158370826000052/sentineloneq227exhibit991.htm`),
};

// croissanceClients : croissance du nombre de clients à plus de 100 000 $ d'ARR, en %, telle qu'imprimée.
const SENTINELONE = [
  { date: '2025-05-28', trimestre: 'T1 FY2026', ca: 229.0, caAnPasse: 186.4, cout: null, op: null, opAnPasse: null, croissanceClients: 22, guidance: g(2026, 996, 1001), horsSerie: true },
  { date: '2025-08-28', trimestre: 'T2 FY2026', ca: 242.2, caAnPasse: 198.9, cout: 60.474, op: -80.618, opAnPasse: -79.381, croissanceClients: 23, guidance: g(2026, 998, 1002) },
  { date: '2025-12-04', trimestre: 'T3 FY2026', ca: 258.9, caAnPasse: 210.6, cout: 67.851, op: -73.311, opAnPasse: -89.120, croissanceClients: 20, guidance: g(2026, 1001, 1001) },
  { date: '2026-03-12', trimestre: 'T4 FY2026', ca: 271.2, caAnPasse: 225.5, cout: 74.320, op: -79.897, opAnPasse: -80.258, croissanceClients: 18, guidance: g(2027, 1195, 1205) },
  { date: '2026-05-28', trimestre: 'T1 FY2027', ca: 276.657, caAnPasse: 229.029, cout: 77.965, op: -79.718, opAnPasse: -87.483, croissanceClients: 17, guidance: g(2027, 1195, 1205) },
  { date: '2026-08-27', trimestre: 'T2 FY2027', ca: 292.0, caAnPasse: 242.2, cout: 81.563, op: -90.761, opAnPasse: -80.618, croissanceClients: 13, guidance: g(2027, 1202, 1207) },
];

// ─────────────────────────────────────────────────────────────────────────────
// OKLO (OKLO) — petits réacteurs — pré-revenus
// Ne dépose plus de 8-K de résultats : la publication est le 10-Q (ou le 10-K) lui-même.
// Barreau 2 : les accords clients (Switch, Meta) n'ont pas donné lieu à un 8-K rubrique 1.01
// — les seuls 8-K 1.01 d'Oklo sont des accords de distribution d'actions — et §8 plafonne alors
// au barreau 2. Montants en milliers de dollars ; `cout: undefined` = aucune ligne de coût des ventes.
// ─────────────────────────────────────────────────────────────────────────────

const OKLO_SRC = {
  '2025-11-12': src('10-Q', '2025-11-12', `${ARCH}/1849056/000162828025051349/oklo-20250930.htm`),
  '2026-03-17': src('10-K', '2026-03-17', `${ARCH}/1849056/000162828026018698/oklo-20251231.htm`),
  '2026-05-12': src('10-Q', '2026-05-12', `${ARCH}/1849056/000162828026034095/oklo-20260331.htm`),
  '2026-08-07': src('10-Q', '2026-08-07', `${ARCH}/1849056/000162828026054571/oklo-20260630.htm`),
  '2026-11-06': src('10-Q', '2026-11-06', `${ARCH}/1849056/000162828026071319/oklo-20260930.htm`),
};

const OKLO = [
  { date: '2025-11-12', trimestre: 'T3 2025', ca: 0, caAnPasse: 0, cout: undefined, op: -36300, opAnPasse: -12300, unites: 0, barreau: 2, jalon: 'maintenue', horsSerie: true },
  { date: '2026-03-17', trimestre: 'T4 2025', ca: 0, caAnPasse: 0, cout: undefined, op: null, opAnPasse: null, unites: 0, barreau: 2, jalon: 'maintenue' },
  { date: '2026-05-12', trimestre: 'T1 2026', ca: 0, caAnPasse: 0, cout: undefined, op: -51200, opAnPasse: -17900, unites: 0, barreau: 2, jalon: 'maintenue' },
  { date: '2026-08-07', trimestre: 'T2 2026', ca: 1210, caAnPasse: 0, cout: 721, op: -73190, opAnPasse: -28015, unites: 0, barreau: 2, jalon: 'maintenue' },
  // Le jalon « 2028 » n'a pas été retrouvé dans ce 10-Q alors qu'il figure dans les quatre
  // publications précédentes : §3, entre deux lectures on retient la plus neutre (« maintenue »)
  // et on inscrit l'hésitation au journal.
  { date: '2026-11-06', trimestre: 'T3 2026', ca: 1861, caAnPasse: 0, cout: 1089, op: -71017, opAnPasse: -36309, unites: 0, barreau: 2, jalon: 'maintenue', hesitation: true },
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

/** Série d'un industriel ou d'une plateforme. d2 : 'carnet' | 'clients'. */
function serie(lignes, sources, { caThese = false, trimestreSeul = false, d2 = 'carnet' }) {
  const out = [];
  let croissancePrecedente = null, carnetPrecedent = null, guidancePrecedente = null, clientsPrecedent = null;
  for (const l of lignes) {
    const c = croissance(caThese ? l.caThese : l.ca, caThese ? l.caTheseAnPasse : l.caAnPasse);
    const sensD1 = sensEcart(c, croissancePrecedente);
    const sensD2 = d2 === 'clients'
      ? sensEcart(l.croissanceClients, clientsPrecedent)
      : sensCarnet(l.carnet, carnetPrecedent, l.ca);
    const statut = trimestreSeul
      ? statutTrimestreSeul(l.guidanceT[0], l.guidanceT[1], l.ca)
      : statutAnnuel(l.guidance, guidancePrecedente);
    if (!l.horsSerie) {
      out.push(publication({
        date: l.date, trimestre: l.trimestre, source: sources[l.date],
        d1: sensD1, d2: sensD2, d4: sensMargeOperationnelle(l.op, l.ca, l.opAnPasse, l.caAnPasse),
        statut, margeBrute: etatMargeBrute(l.ca, l.cout),
      }));
    }
    croissancePrecedente = c;
    carnetPrecedent = l.carnet;
    clientsPrecedent = l.croissanceClients;
    if (!trimestreSeul && l.guidance !== null) guidancePrecedente = l.guidance;
  }
  return out;
}

/** Série « pré-revenus » : D1 par unités livrées, D2 par barreau. */
function seriePreRevenus(lignes, sources) {
  const out = [];
  let unitesPrecedent = null, barreauPrecedent = null;
  for (const l of lignes) {
    // §4 : « Zéro livraison puis zéro livraison vaut stable » ; sans trimestre précédent, non publié.
    const d1 = unitesPrecedent === null ? 'non-publie'
      : (l.unites === 0 && unitesPrecedent === 0) ? 'stable'
        : l.unites > unitesPrecedent * 1.05 ? 'hausse' : l.unites < unitesPrecedent * 0.95 ? 'baisse' : 'stable';
    // §4 : barreau gagné → hausse, barreau perdu → baisse ; sans publication précédente, non publié.
    const d2 = barreauPrecedent === null ? 'non-publie'
      : l.barreau > barreauPrecedent ? 'hausse' : l.barreau < barreauPrecedent ? 'baisse' : 'stable';
    if (!l.horsSerie) {
      out.push(publication({
        date: l.date, trimestre: l.trimestre, source: sources[l.date],
        d1, d2, d4: sensMargeOperationnelle(l.op, l.ca, l.opAnPasse, l.caAnPasse),
        statut: l.jalon, margeBrute: etatMargeBrute(l.ca, l.cout),
        drapeaux: l.hesitation ? [{ code: 'hesitation', source: sources[l.date] }] : [],
      }));
    }
    unitesPrecedent = l.unites;
    barreauPrecedent = l.barreau;
  }
  return out;
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
    indicateur_demande: { type: 'carnet', valeur: 'Carnet de commandes, publié depuis le quatrième trimestre 2025', source: RKLB_SRC['2026-11-09'] },
  },
  {
    id: 'ionq', nom: 'IonQ', recit: 'Informatique quantique — systèmes à ions piégés et accès infonuagique', archetype: 'industriel',
    ca_these: { valeur: 'Chiffre d’affaires total (informatique quantique)', source: IONQ_SRC['2026-11-05'] },
    indicateur_demande: { type: 'carnet', valeur: 'Obligations de prestation restantes (RPO), publiées de façon irrégulière', source: IONQ_SRC['2026-11-05'] },
  },
  {
    id: 'vertiv', nom: 'Vertiv', recit: 'Refroidissement liquide et infrastructure de centre de données', archetype: 'industriel',
    ca_these: { valeur: 'Chiffre d’affaires total (infrastructure de centre de données)', source: VRT_SRC['2026-10-28'] },
    indicateur_demande: { type: 'carnet', valeur: 'Carnet de commandes, publié par intermittence ; les commandes ne le sont qu’en croissance', source: VRT_SRC['2026-02-11'] },
  },
  {
    id: 'sentinelone', nom: 'SentinelOne', recit: 'Cybersécurité — protection des terminaux pilotée par l’IA', archetype: 'plateforme',
    ca_these: { valeur: 'Chiffre d’affaires total (plateforme Singularity)', source: S_SRC['2026-08-27'] },
    indicateur_demande: { type: 'clients', valeur: 'Nombre de clients à plus de 100 000 dollars d’ARR', source: S_SRC['2026-08-27'] },
  },
  {
    id: 'oklo', nom: 'Oklo', recit: 'Petits réacteurs nucléaires — centrale Aurora', archetype: 'pre-revenus',
    ca_these: { valeur: 'Unités livrées — aucun réacteur mis en service à ce jour', source: OKLO_SRC['2026-11-06'] },
    indicateur_demande: { type: 'barreau-reservations', valeur: 'Barreau d’engagement et réservations', source: OKLO_SRC['2026-11-06'] },
  },
  {
    id: 'agility-robotics', nom: 'Agility Robotics', recit: 'Robotique humanoïde — robot Digit pour la logistique', archetype: 'pre-revenus',
    ca_these: { valeur: 'Unités livrées — aucune publication de résultats propre à ce jour', source: src('10-Q', '2026-11-13', `${ARCH}/2074973/000121390026119801/ea0311936-10q_agility.htm`) },
    indicateur_demande: { type: 'non-publie' },
  },
];

const FICHIERS = {
  'centrus-energy': { publications: serie(CENTRUS, CENTRUS_SRC, { caThese: true }), evenements_commerciaux: [] },
  'rocket-lab': { publications: serie(RKLB, RKLB_SRC, { trimestreSeul: true }), evenements_commerciaux: [] },
  ionq: { publications: serie(IONQ, IONQ_SRC, {}), evenements_commerciaux: [] },
  vertiv: { publications: serie(VRT, VRT_SRC, {}), evenements_commerciaux: [] },
  sentinelone: { publications: serie(SENTINELONE, S_SRC, { d2: 'clients' }), evenements_commerciaux: [] },
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

const total = ENTREPRISES.reduce((n, e) => n + FICHIERS[e.id].publications.length, 0);
console.log(`${ENTREPRISES.length} sociétés, ${total} publications écrites dans data/tracker/`);
for (const e of ENTREPRISES) console.log(`  ${e.id.padEnd(18)} ${String(FICHIERS[e.id].publications.length).padStart(2)} publication(s)`);
