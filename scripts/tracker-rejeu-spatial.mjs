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

// ═════════════════════════════════════════════════════════════════════════════
// AST SPACEMOBILE (ASTS) — pré-revenus
//
// ARCHÉTYPE FIXÉ AVANT LECTURE (§2, « ils ne changent plus ensuite ») : au tirage de l'univers,
// le 31 janvier 2024, AST n'avait aucun revenu lié à sa thèse. C'est donc un pré-revenus, et il
// le reste quand le chiffre d'affaires apparaît puis atteint 42 millions au T3 2026.
//
// DIX-SEPT 8-K RUBRIQUE 2.02, DOUZE LIGNES. Cinq de ces dépôts ne sont pas des résultats
// trimestriels : quatre annonces de financement (22 janvier 2025, 24 juillet 2025, 21 octobre
// 2025, 15 juillet 2026) et une liste de facteurs de risque (11 février 2026). Précision 2 :
// « une pré-annonce ou un point d'activité publié entre deux publications de résultats ne crée
// pas de ligne ». Vérifié un par un, aucun ne porte de prévision ni de jalon qui ne soit repris
// à la publication de résultats suivante.
//
// LE BARREAU RESTE 2 SUR TOUTE LA SÉRIE, et c'est le résultat le plus instructif de cette
// lecture. AST annonce dans ses communiqués un « 6-year definitive commercial agreement » avec
// AT&T (mai 2024) puis un « definitive commercial agreement through 2034 » avec Vodafone (mars
// 2025), et nomme Verizon, Rakuten et STC comme clients. Mais les huit 8-K rubrique 1.01 déposés
// depuis février 2024 ont été ouverts un par un : ce sont des pactes d'actionnaires (7 juin 2024,
// 7 février 2025), des émissions de titres (5 septembre 2024, 13 mai 2025, 26 juin 2025,
// 7 octobre 2025) et l'acquisition du spectre Ligado, où AST est l'ACHETEUR (7 janvier et
// 24 mars 2025, au moins 80 millions par an versés à Ligado). AUCUN accord côté client n'est
// déposé. §8 : « par défaut, une annonce qui n'a pas donné lieu au dépôt d'un 8-K rubrique 1.01
// ne dépasse pas le barreau 2 ». La méthode refuse donc de créditer un accord « définitif » que
// la société n'a pas déposé comme accord important — et AST ne reçoit AUCUNE Bascule commerciale
// malgré AT&T, Verizon, Vodafone et Rakuten. Hésitation consignée : on pourrait soutenir le
// barreau 3 au T1 2024 (« signé mais suspendu à une licence » — le service attendait la FCC) ;
// §3 impose la lecture la plus neutre, donc le barreau ne monte pas.
//
// D1 N'EST RELEVÉ QUE LORSQUE LE COMMUNIQUÉ ÉNONCE LE COMPTE DU TRIMESTRE. AST ne publie pas de
// décompte régulier de lancements. Deux trimestres l'énoncent sans ambiguïté — cinq Block 1 en
// septembre 2024, trois BlueBird en avril-juin 2026 — et deux autres énoncent explicitement
// zéro. Partout ailleurs : non publié. Reconstituer les comptes manquants par différence de
// constellation serait inventer une série ; `unites: null` dit ce que la société n'a pas dit.
//
// PERTE D'EXPLOITATION = CA − TOTAL DES CHARGES D'EXPLOITATION, les deux balisés dans le 10-Q
// déposé le JOUR MÊME de la publication (précision 4 l'admet, précision 8 est satisfaite puisque
// c'est le document du jour). Source unique pour toute la série, au lieu d'un assemblage : AST a
// cessé de baliser `OperatingIncomeLoss` après 2021, et ses communiqués impriment par endroits
// la perte AVANT IMPÔT, qu'il ne faut pas confondre avec la perte d'exploitation. Contrôle fait :
// les charges comparatives sont identiques d'un dépôt à l'autre (aucun retraitement), et au T4
// 2025 la soustraction donne 54 305 − 126 582 = −72 277, la perte que la société imprime.
// Les trois quatrièmes trimestres viennent de la colonne trimestrielle du communiqué annuel.
//
// LA PRÉCISION 1 MUET D4 SUR SIX LIGNES. Tant que le trimestre comparatif est à zéro de chiffre
// d'affaires, la marge passée n'existe pas ; et au T1 2025 c'est le comparatif lui-même qui est
// non calculable (55 500 de perte pour 500 de chiffre d'affaires, soit cent onze fois).
//
// Montants en milliers de dollars. `cout: undefined` = aucune ligne de coût des ventes présentée
// — c'est le cas jusqu'au T2 2025 inclus ; la ligne apparaît au T3 2025 et le garde-fou de marge
// brute devient applicable en cours de série.
// ═════════════════════════════════════════════════════════════════════════════

const ASTS_SRC = {
  '2024-04-01': src('8-K', '2024-04-01', `${ARCH}/1780312/000095017024039386/asts-ex99_1.htm`),
  '2024-05-15': src('8-K', '2024-05-15', `${ARCH}/1780312/000095017024060494/asts-ex99_1.htm`),
  '2024-08-14': src('8-K', '2024-08-14', `${ARCH}/1780312/000095017024097095/asts-ex99_1.htm`),
  '2024-11-14': src('8-K', '2024-11-14', `${ARCH}/1780312/000095017024127096/asts-ex99_1.htm`),
  '2025-03-04': src('8-K', '2025-03-04', `${ARCH}/1780312/000095017025031954/asts-ex99_1.htm`),
  '2025-05-12': src('8-K', '2025-05-12', `${ARCH}/1780312/000095017025069317/asts-ex99_1.htm`),
  '2025-08-11': src('8-K', '2025-08-11', `${ARCH}/1780312/000095017025106610/asts-ex99_1.htm`),
  '2025-11-10': src('8-K', '2025-11-10', `${ARCH}/1780312/000119312525274360/asts-ex99_1.htm`),
  '2026-03-02': src('8-K', '2026-03-02', `${ARCH}/1780312/000178031226000005/asts-ex99_1.htm`),
  '2026-05-11': src('8-K', '2026-05-11', `${ARCH}/1780312/000119312526216946/asts-ex99_1.htm`),
  '2026-08-10': src('8-K', '2026-08-10', `${ARCH}/1780312/000119312526342540/asts-ex99_1.htm`),
  '2026-11-09': src('8-K', '2026-11-09', `${ARCH}/1780312/000119312526453758/asts-ex99_1.htm`),
};

// guidance : prévision chiffrée, avec la période qu'elle vise. AST chiffre pour la première fois
// le 12 mai 2025 (second semestre 2025), puis l'exercice 2026 le 11 mai 2026. Un changement de
// période donne « nouvelle » (§5). Avant cela, D3 s'appuierait sur un jalon daté — mais aucune
// des cinq premières publications n'annonce de DATE de début de service commercial : D3 est
// non publié, et `statut` le dit.
const ASTS = [
  { date: '2024-04-01', trimestre: 'T4 2023', ca: 0, caAnPasse: 0, cout: undefined, op: -60878, opAnPasse: -42607, unites: null, barreau: 2, statut: 'non-publie' },
  { date: '2024-05-15', trimestre: 'T1 2024', ca: 500, caAnPasse: 0, cout: undefined, op: -55500, opAnPasse: -44500, unites: null, barreau: 2, statut: 'non-publie' },
  // « Zero launches in Q2 2024 ; no operational satellites in orbit as of June 30 » : zéro énoncé.
  { date: '2024-08-14', trimestre: 'T2 2024', ca: 900, caAnPasse: 0, cout: undefined, op: -62993, opAnPasse: -50380, unites: 0, barreau: 2, statut: 'non-publie' },
  // Les cinq premiers Block 1 BlueBird lancés le 12 septembre 2024 : premières livraisons après zéro.
  { date: '2024-11-14', trimestre: 'T3 2024', ca: 1100, caAnPasse: 0, cout: undefined, op: -65546, opAnPasse: null, unites: 5, barreau: 2, statut: 'non-publie' },
  { date: '2025-03-04', trimestre: 'T4 2024', ca: 1918, caAnPasse: 0, cout: undefined, op: -58724, opAnPasse: -60878, unites: null, barreau: 2, statut: 'non-publie' },
  // Première prévision chiffrée : « revenue of $50.0 million to $75.0 million in the second half 2025 ».
  { date: '2025-05-12', trimestre: 'T1 2025', ca: 718, caAnPasse: 500, cout: undefined, op: -62963, opAnPasse: -55500, unites: null, barreau: 2, guidance: g('2025-S2', 50000, 75000) },
  // « No launches occurred during Q2 2025 » : zéro énoncé, mais le trimestre précédent ne l'était pas.
  { date: '2025-08-11', trimestre: 'T2 2025', ca: 1156, caAnPasse: 900, cout: undefined, op: -72797, opAnPasse: -62993, unites: 0, barreau: 2, guidance: g('2025-S2', 50000, 75000) },
  // Une ligne de coût des ventes apparaît ici (5 511) : le garde-fou devient applicable.
  { date: '2025-11-10', trimestre: 'T3 2025', ca: 14739, caAnPasse: 1100, cout: 5511, op: -79676, opAnPasse: -65546, unites: null, barreau: 2, guidance: g('2025-S2', 50000, 75000) },
  // Coût des ventes du trimestre : 35 216 de l'exercice moins 5 511 des neuf mois publiés.
  // Aucune prévision chiffrée pour 2026 (« revenue expected to grow »), aucune date de service : D3 muet.
  { date: '2026-03-02', trimestre: 'T4 2025', ca: 54305, caAnPasse: 1918, cout: 29705, op: -72277, opAnPasse: -58724, unites: null, barreau: 2, statut: 'non-publie' },
  { date: '2026-05-11', trimestre: 'T1 2026', ca: 14735, caAnPasse: 718, cout: 11649, op: -149412, opAnPasse: -62963, unites: 0, barreau: 2, guidance: g(2026, 150000, 200000) },
  // BlueBirds 11, 12 et 13 lancés dans le trimestre, treize engins en orbite à la fin.
  { date: '2026-08-10', trimestre: 'T2 2026', ca: 31500, caAnPasse: 1156, cout: 23567, op: -297597, opAnPasse: -72797, unites: 3, barreau: 2, guidance: g(2026, 150000, 200000) },
  { date: '2026-11-09', trimestre: 'T3 2026', ca: 42321, caAnPasse: 14739, cout: 25314, op: -168705, opAnPasse: -79676, unites: null, barreau: 2, guidance: g(2026, 150000, 200000) },
];

// ═════════════════════════════════════════════════════════════════════════════
// GLOBALSTAR (GSAT) — plateforme
//
// ARCHÉTYPE FIXÉ AVANT LECTURE : au tirage, Globalstar vendait déjà un service récurrent
// (224 millions de dollars en 2023). Plateforme, donc.
//
// CA DE LA THÈSE : le chiffre d'affaires de SERVICE, hors ventes de terminaux — « le segment qui
// porte le récit, hors activités annexes ». La capacité en gros vendue à Apple serait plus pure
// encore, mais elle n'est pas isolée dans chacun des douze communiqués : le retenir aurait
// demandé de reconstituer une série par recoupements. Le chiffre de service, lui, est imprimé
// partout, et c'est la ligne que la société met en avant. Choix de paramètre, consigné (§2).
//
// INDICATEUR DE DEMANDE : le nombre d'abonnés, et c'est le seul choix possible. Globalstar ne
// publie AUCUN carnet de commandes dans ses communiqués — vérifié sur les douze. Il ne publie pas
// non plus d'abonnés en fin de période : seulement des abonnés MOYENS du trimestre, par catégorie
// (Commercial IoT, SPOT, Duplex). Le total des trois est la seule mesure de demande disponible.
// Limite à connaître, qui ne se corrige pas : ces trois catégories sont les produits de détail
// historiques — la capacité en gros qui porte le récit n'y figure pas. D2 mesure donc la base
// d'abonnés héritée, pas la demande de la thèse.
//
// SUSPENSION DES PRÉVISIONS. Au T1 2026, « in connection with the pending Mergers with
// Amazon.com, Inc., Globalstar does not intend to […] provide updates to forward-looking
// guidance ». §3 traite ce cas nommément, par l'exemple ChargePoint : un RETRAIT de prévision
// annuelle vaut « abaissée ». La méthode ne distingue pas les motifs — elle lit le document, pas
// l'intention —, donc une suspension pour cause de fusion se classe comme une coupe. Le retrait
// ne vaut qu'UNE fois : les deux trimestres suivants n'ont plus aucune prévision, D3 y est
// « non publié ».
//
// CA TOTAL ET RÉSULTAT D'EXPLOITATION : balisés dans le 10-Q déposé le jour même (précisions 4
// et 8). Les trois quatrièmes trimestres viennent du communiqué annuel ; contrôle fait, la
// soustraction exercice moins neuf mois redonne exactement les chiffres imprimés (T4 2024 :
// perte d'exploitation de 4 249, CA de 61 177 ; T4 2025 : CA de 71 961).
//
// GARDE-FOU DE MARGE BRUTE : `cout` est le coût des services, comparé au CA TOTAL. L'appariement
// n'est pas exact — Globalstar présente aussi un coût des terminaux, non relevé ici — mais le
// verdict ne dépend pas de l'écart : le chiffre d'affaires de service dépasse à lui seul le coût
// des services d'un facteur trois sur les douze trimestres. La marge est robustement positive.
//
// Montants en milliers de dollars. Abonnés en unités. La ligne du 2 novembre 2023 est HORS SÉRIE
// (précision 7) : elle ne fournit que les valeurs précédentes de la première ligne.
// ═════════════════════════════════════════════════════════════════════════════

const GSAT_SRC = {
  '2023-11-02': src('8-K', '2023-11-02', `${ARCH}/1366868/000136686823000137/gsat20230930-ex991.htm`),
  '2024-02-28': src('8-K', '2024-02-28', `${ARCH}/1366868/000136686824000024/gsat20231231-ex991.htm`),
  '2024-05-08': src('8-K', '2024-05-08', `${ARCH}/1366868/000136686824000067/gsat20240331-ex991.htm`),
  '2024-08-08': src('8-K', '2024-08-08', `${ARCH}/1366868/000136686824000094/gsat20240630-ex991.htm`),
  '2024-11-07': src('8-K', '2024-11-07', `${ARCH}/1366868/000136686824000113/gsat20240930-ex991.htm`),
  '2025-02-27': src('8-K', '2025-02-27', `${ARCH}/1366868/000136686825000030/gsat20241231-ex991.htm`),
  '2025-05-08': src('8-K', '2025-05-08', `${ARCH}/1366868/000136686825000074/gsat20250331-ex991.htm`),
  '2025-08-07': src('8-K', '2025-08-07', `${ARCH}/1366868/000136686825000101/gsat20250630-ex991.htm`),
  '2025-11-06': src('8-K', '2025-11-06', `${ARCH}/1366868/000136686825000111/gsat20250930-ex991.htm`),
  '2026-02-27': src('8-K', '2026-02-27', `${ARCH}/1366868/000136686826000009/gsat20251231-ex991.htm`),
  '2026-05-07': src('8-K', '2026-05-07', `${ARCH}/1366868/000136686826000027/gsat20260331-ex991.htm`),
  '2026-08-06': src('8-K', '2026-08-06', `${ARCH}/1366868/000136686826000037/gsat20260630-ex991.htm`),
  '2026-11-05': src('8-K', '2026-11-05', `${ARCH}/1366868/000136686826000045/gsat20260930-ex991.htm`),
};

// croissanceClients : la croissance sur un an du total des abonnés moyens, calculée sur les
// effectifs publiés (précision 3) — jamais sur un pourcentage imprimé.
const GSAT = [
  { date: '2023-11-02', trimestre: 'T3 2023', caThese: 53643, caTheseAnPasse: 33301, ca: 57683, caAnPasse: null, cout: 13872, op: 2017, opAnPasse: null, croissanceClients: croissance(769706, 762232), guidance: null, horsSerie: true },
  { date: '2024-02-28', trimestre: 'T4 2023', caThese: 48951, caTheseAnPasse: 36375, ca: 52409, caAnPasse: 41306, cout: 15561, op: -11993, opAnPasse: -9320, croissanceClients: croissance(777945, 765285), guidance: g(2024, 225000, 250000) },
  { date: '2024-05-08', trimestre: 'T1 2024', caThese: 53465, caTheseAnPasse: 52954, ca: 56480, caAnPasse: 58644, cout: 16759, op: -4712, opAnPasse: 7191, croissanceClients: croissance(781812, 764760), guidance: g(2024, 225000, 250000) },
  { date: '2024-08-08', trimestre: 'T2 2024', caThese: 57635, caTheseAnPasse: 48648, ca: 60385, caAnPasse: 55072, cout: 18114, op: -1422, opAnPasse: 2620, croissanceClients: croissance(782593, 763317), guidance: g(2024, 235000, 250000) },
  { date: '2024-11-07', trimestre: 'T3 2024', caThese: 68908, caTheseAnPasse: 53643, ca: 72307, caAnPasse: 57683, cout: 19185, op: 9434, opAnPasse: 2017, croissanceClients: croissance(781215, 769706), guidance: g(2024, 245000, 250000) },
  { date: '2025-02-27', trimestre: 'T4 2024', caThese: 57681, caTheseAnPasse: 48951, ca: 61177, caAnPasse: 52409, cout: 19102, op: -4249, opAnPasse: -11993, croissanceClients: croissance(775556, 777945), guidance: g(2025, 260000, 285000) },
  { date: '2025-05-08', trimestre: 'T1 2025', caThese: 57067, caTheseAnPasse: 53465, ca: 60032, caAnPasse: 56480, cout: 18625, op: -8501, opAnPasse: -4712, croissanceClients: croissance(776050, 781812), guidance: g(2025, 260000, 285000) },
  { date: '2025-08-07', trimestre: 'T2 2025', caThese: 63216, caTheseAnPasse: 57635, ca: 67148, caAnPasse: 60385, cout: 19479, op: 6146, opAnPasse: -1422, croissanceClients: croissance(781231, 782593), guidance: g(2025, 260000, 285000) },
  { date: '2025-11-06', trimestre: 'T3 2025', caThese: 69635, caTheseAnPasse: 68908, ca: 73845, caAnPasse: 72307, cout: 22206, op: 10156, opAnPasse: 9434, croissanceClients: croissance(783544, 780929), guidance: g(2025, 260000, 285000) },
  { date: '2026-02-27', trimestre: 'T4 2025', caThese: 67391, caTheseAnPasse: 57681, ca: 71961, caAnPasse: 61177, cout: 22871, op: -371, opAnPasse: -4249, croissanceClients: croissance(786993, 775556), guidance: g(2026, 280000, 305000) },
  // Prévision 2026 RETIRÉE en raison de la fusion Amazon : « abaissée » (§3, exemple ChargePoint).
  { date: '2026-05-07', trimestre: 'T1 2026', caThese: 66701, caTheseAnPasse: 57067, ca: 70064, caAnPasse: 60032, cout: 23433, op: 8170, opAnPasse: -8501, croissanceClients: croissance(793745, 776050), guidance: null, statut: 'abaissee' },
  // Le retrait ne vaut qu'une fois : plus aucune prévision, donc D3 non publié.
  { date: '2026-08-06', trimestre: 'T2 2026', caThese: 59998, caTheseAnPasse: 63216, ca: 64772, caAnPasse: 67148, cout: 23602, op: -4775, opAnPasse: 6146, croissanceClients: croissance(803788, 781231), guidance: null },
  { date: '2026-11-05', trimestre: 'T3 2026', caThese: 65386, caTheseAnPasse: 69635, ca: 70903, caAnPasse: 73845, cout: 24939, op: 7611, opAnPasse: 10156, croissanceClients: croissance(808739, 783544), guidance: null },
];

// ═════════════════════════════════════════════════════════════════════════════
// ECHOSTAR (SATS) — plateforme — première ligne de l'univers (8,391 %)
//
// AUCUN 8-K RUBRIQUE 2.02. EchoStar ne dépose pas ses communiqués de résultats : elle publie et
// dépose le 10-Q ou le 10-K le même jour. La précision 4 l'admet — « un 10-Q ou un 10-K sert s'il
// est déposé au plus tard le jour de la publication » — et la parenthèse de §3 décrit l'usage
// américain, elle ne l'exige pas. La date de chaque ligne est donc celle du dépôt périodique.
// Douze dépôts entre le 1er février 2024 et aujourd'hui, donc douze lignes. Le 10-K/A du
// 30 avril 2026 est un amendement : il ne crée pas de ligne.
//
// SOCIÉTÉ EN RESTRUCTURATION VIOLENTE, et le rejeu ne l'écarte pas pour autant :
//  · Fusion inversée avec DISH au 31 décembre 2023 : DISH est le prédécesseur comptable, donc
//    l'historique présenté passe de 0,4 à 4,1 milliards par trimestre. La publication qui précède
//    la première ligne porte sur une AUTRE entité — comparer sa croissance à celle de la première
//    ligne mesurerait la fusion, pas l'activité. D1 et D2 sont donc non publiés sur la première
//    ligne, faute de valeur précédente comparable (§4, « pas de valeur précédente »).
//  · Dépréciation de 16,6 milliards au T3 2025 (abandon du réseau 5G après la cession du spectre).
//    D4 y lit une marge d'exploitation de −460 % : c'est ce que le document imprime.
//  · Cession de DISH TV en 2026 : au T3 2026 le chiffre d'affaires passe de 3,61 à 1,13 milliard
//    contre un comparatif NON retraité. D1 y lit −69 %. La méthode n'a aucune règle de périmètre
//    et en inventer une au milieu d'un rejeu l'invaliderait : le chiffre est consigné tel quel, et
//    le constat va au bilan du rejeu.
//
// CA DE LA THÈSE : le chiffre d'affaires TOTAL, par le repli de §2 (« à défaut, le chiffre
// d'affaires total »). Le segment satellite ne survit pas à la série : le 10-K de février 2024
// présente quatre segments dont « Broadband and Satellite Services », le 10-Q de novembre 2026
// n'en présente plus qu'UN SEUL. Un segment qui cesse d'être publié ne peut pas porter D1 sur
// douze trimestres, et §2 interdit de remplacer un paramètre en cours de route.
//
// INDICATEUR DE DEMANDE : le total des abonnés de fin de période des trois catégories publiées
// (Pay-TV, sans-fil, haut débit). Aucun carnet n'existe dans une activité d'abonnement. Au
// T3 2026, Pay-TV et haut débit TOMBENT À ZÉRO — cédés — et l'indicateur tel qu'il a été fixé
// cesse d'exister : §2, « la dimension devient non publié à partir de là. On ne le remplace pas ».
//
// LES QUATRIÈMES TRIMESTRES DE 2024 ET 2025 NE SONT PAS PUBLIÉS COMME TRIMESTRES. Vérifié sur les
// trois 10-K : celui de février 2024 porte des colonnes à trois mois (reliquat de la présentation
// de fusion), les deux suivants n'en portent aucune, et le balisage XBRL le confirme — aucun fait
// de 90 jours clos le 31 décembre 2024 ou 2025. Le chiffre serait calculable par soustraction
// (exercice moins neuf mois), mais rien ne permet de le vérifier contre un montant imprimé, à la
// différence de Globalstar et d'AST. Donc : CA, résultat d'exploitation et coût des ventes
// « non publié » sur ces deux lignes, et D1 non publié sur les lignes SUIVANTES, qui n'ont plus
// de croissance précédente. Les abonnés, eux, sont des soldes à une date : ils restent publiés.
//
// D3 EST MUET SUR LES DOUZE LIGNES. EchoStar ne donne aucune prévision chiffrée — contrôlé sur les
// dépôts ; la seule occurrence de « revenue guidance » rencontrée est du jargon comptable
// (ASC 606). La clause du jalon daté de §5 ne vaut que pour un pré-revenus, donc elle ne joue pas.
//
// Montants en milliers de dollars, balisés dans le dépôt du jour. Abonnés en MILLIERS, tels
// qu'imprimés en millions à trois décimales dans la table de chaque dépôt.
// ═════════════════════════════════════════════════════════════════════════════

const SATS_SRC = {
  '2024-02-29': src('10-K', '2024-02-29', `${ARCH}/1415404/000155837024002209/tmb-20231231x10k.htm`),
  '2024-05-08': src('10-Q', '2024-05-08', `${ARCH}/1415404/000155837024007171/tmb-20240331x10q.htm`),
  '2024-08-09': src('10-Q', '2024-08-09', `${ARCH}/1415404/000155837024011672/tmb-20240630x10q.htm`),
  '2024-11-12': src('10-Q', '2024-11-12', `${ARCH}/1415404/000155837024015122/tmb-20240930x10q.htm`),
  '2025-02-27': src('10-K', '2025-02-27', `${ARCH}/1415404/000155837025001663/tmb-20241231x10k.htm`),
  '2025-05-09': src('10-Q', '2025-05-09', `${ARCH}/1415404/000155837025007050/tmb-20250331x10q.htm`),
  '2025-08-01': src('10-Q', '2025-08-01', `${ARCH}/1415404/000155837025009923/tmb-20250630x10q.htm`),
  '2025-11-06': src('10-Q', '2025-11-06', `${ARCH}/1415404/000110465925107277/tmb-20250930x10q.htm`),
  '2026-03-02': src('10-K', '2026-03-02', `${ARCH}/1415404/000110465926021817/tmb-20251231x10k.htm`),
  '2026-05-11': src('10-Q', '2026-05-11', `${ARCH}/1415404/000110465926058150/sats-20260331x10q.htm`),
  '2026-08-03': src('10-Q', '2026-08-03', `${ARCH}/1415404/000110465926089370/sats-20260630x10q.htm`),
  '2026-11-03': src('10-Q', '2026-11-03', `${ARCH}/1415404/000110465926121675/sats-20260930x10q.htm`),
};

// cout = coût des services + coût des ventes de matériel, les deux lignes du compte de résultat.
const SATS = [
  // Prédécesseur comptable changé : aucune valeur précédente comparable (D1 et D2 non publiés).
  { date: '2024-02-29', trimestre: 'T4 2023', ca: 4162596, caAnPasse: 4533017, cout: null, op: -852126, opAnPasse: 427514, croissanceClients: croissance(16908, 18961), guidance: null },
  { date: '2024-05-08', trimestre: 'T1 2024', ca: 4014843, caAnPasse: 4387666, cout: 2920265, op: -15244, opAnPasse: 353338, croissanceClients: croissance(16453, 18288), guidance: null },
  { date: '2024-08-09', trimestre: 'T2 2024', ca: 3952751, caAnPasse: 4356462, cout: 2915571, op: -65369, opAnPasse: 252229, croissanceClients: croissance(16310, 17751), guidance: null },
  { date: '2024-11-12', trimestre: 'T3 2024', ca: 3890984, caAnPasse: 4108874, cout: 2931173, op: -160767, opAnPasse: -31349, croissanceClients: croissance(15927, 17403), guidance: null },
  // 10-K sans colonne trimestrielle : le trimestre n'est pas publié. Les abonnés, eux, le sont.
  { date: '2025-02-27', trimestre: 'T4 2024', ca: null, caAnPasse: null, cout: null, op: null, opAnPasse: null, croissanceClients: croissance(15656, 16908), guidance: null },
  { date: '2025-05-09', trimestre: 'T1 2025', ca: 3869758, caAnPasse: 4014843, cout: 2871706, op: -88132, opAnPasse: -15244, croissanceClients: croissance(15395, 16453), guidance: null },
  { date: '2025-08-01', trimestre: 'T2 2025', ca: 3724959, caAnPasse: 3952751, cout: 2815818, op: -213408, opAnPasse: -65369, croissanceClients: croissance(15284, 16310), guidance: null },
  // Dépréciation de 16,6 milliards : marge d'exploitation de −460 %, telle qu'imprimée.
  { date: '2025-11-06', trimestre: 'T3 2025', ca: 3614258, caAnPasse: 3890984, cout: 2761887, op: -16641875, opAnPasse: -160767, croissanceClients: croissance(15469, 15927), guidance: null },
  { date: '2026-03-02', trimestre: 'T4 2025', ca: null, caAnPasse: null, cout: null, op: null, opAnPasse: null, croissanceClients: croissance(15248, 15656), guidance: null },
  { date: '2026-05-11', trimestre: 'T1 2026', ca: 3667489, caAnPasse: 3869758, cout: 2535175, op: 392847, opAnPasse: -88132, croissanceClients: croissance(14840, 15395), guidance: null },
  { date: '2026-08-03', trimestre: 'T2 2026', ca: 3576164, caAnPasse: 3724959, cout: 2347121, op: 512938, opAnPasse: -213408, croissanceClients: croissance(14388, 15284), guidance: null },
  // Pay-TV et haut débit cédés : l'indicateur de demande cesse d'exister (§2), D2 non publié.
  { date: '2026-11-03', trimestre: 'T3 2026', ca: 1127611, caAnPasse: 3614258, cout: 650839, op: 147750, opAnPasse: -16641875, croissanceClients: null, guidance: null },
];

// ═════════════════════════════════════════════════════════════════════════════
// TRIMBLE (TRMB) — plateforme — exercice 52/53 semaines, clos début janvier
//
// ARCHÉTYPE : plateforme. Au tirage, l'essentiel du chiffre d'affaires de Trimble était déjà du
// logiciel et de l'abonnement (chiffre d'affaires récurrent annualisé de près de 2 milliards sur
// 3,6), et sa stratégie affichée s'appelle « Connect & Scale ». Un fabricant d'antennes GNSS
// serait un industriel ; celui-ci vend surtout des licences.
//
// QUATORZE 8-K RUBRIQUE 2.02, DOUZE LIGNES. Deux dépôts ne sont pas des résultats trimestriels,
// vérifiés : le 12 avril 2024 est un RETRAITEMENT DE SEGMENTS (périodes antérieures recalculées
// sur le nouveau découpage), le 16 septembre 2024 annonce la cession de la télématique transport.
// Précision 2 : ni l'un ni l'autre ne crée de ligne.
//
// LES CHIFFRES VIENNENT DU COMMUNIQUÉ, PAS DU 10-Q. Trimble dépose ses 10-Q APRÈS le communiqué —
// et ceux des trois premiers trimestres de 2024 ont été déposés le 16 janvier 2025, soit des mois
// plus tard, après une revue comptable. Précision 4 : « déposé après, sa donnée est non publié
// pour cette ligne ». Le communiqué du jour fait donc foi partout. Contrôle fait : là où le 10-Q
// existe, ses montants balisés recoupent exactement ceux du communiqué.
//
// CA DE LA THÈSE : le chiffre d'affaires TOTAL, par le repli de §2. Trimble figure dans l'univers
// pour le positionnement par satellite, qui n'est le périmètre d'AUCUN de ses segments ; et ses
// segments ont été redécoupés en 2024, ce qui interdirait de toute façon une série de douze
// trimestres sur l'un d'eux.
//
// D2 EST MUET SUR LES DOUZE LIGNES, et il faut dire pourquoi. Trimble ne publie ni commandes ni
// nombre de clients. Son indicateur phare est le chiffre d'affaires récurrent annualisé, qui
// n'appartient pas à la liste fermée de §2 (« commandes ou carnet de commandes ; à défaut, nombre
// de clients ou d'abonnés ; sinon non publié »). Reste son carnet au sens GAAP, les obligations de
// prestation restantes — mais il n'est publié qu'arrondi : « approximately $1.7 billion ». Pour un
// chiffre d'affaires trimestriel de 0,9 milliard, un arrondi au cent millions déplace le ratio de
// 0,11 quand les seuils valent 0,05 : l'arrondi déciderait de l'alerte. Précision 3 l'interdit.
// Donc troisième branche de §2 : indicateur « non publié ». Trimble ne laisse que trois dimensions
// à la méthode — comme EchoStar, pour une raison toute différente.
//
// Montants en MILLIONS de dollars, à la décimale qu'imprime le communiqué.
// ═════════════════════════════════════════════════════════════════════════════

const TRMB_SRC = {
  '2024-02-12': src('8-K', '2024-02-12', `${ARCH}/864749/000086474924000034/a2023q4-8kex991.htm`),
  '2024-05-03': src('8-K', '2024-05-03', `${ARCH}/864749/000086474924000126/a2024q1-8kex991.htm`),
  '2024-08-06': src('8-K', '2024-08-06', `${ARCH}/864749/000086474924000195/a2024q2-8kex991.htm`),
  '2024-11-06': src('8-K', '2024-11-06', `${ARCH}/864749/000086474924000251/a2024q3-8kex991.htm`),
  '2025-02-19': src('8-K', '2025-02-19', `${ARCH}/864749/000086474925000023/a2024q4-8kex991.htm`),
  '2025-05-07': src('8-K', '2025-05-07', `${ARCH}/864749/000086474925000105/a2025q1-8kex991.htm`),
  '2025-08-06': src('8-K', '2025-08-06', `${ARCH}/864749/000086474925000243/a2025q2-8kex991.htm`),
  '2025-11-05': src('8-K', '2025-11-05', `${ARCH}/864749/000086474925000283/a2025q3-8kex991.htm`),
  '2026-02-10': src('8-K', '2026-02-10', `${ARCH}/864749/000086474926000006/a2025q4-8kex991.htm`),
  '2026-05-06': src('8-K', '2026-05-06', `${ARCH}/864749/000086474926000061/a2026q1-8kex991.htm`),
  '2026-08-12': src('8-K', '2026-08-12', `${ARCH}/864749/000086474926000106/a2026q2-8kex991_00version.htm`),
  '2026-11-04': src('8-K', '2026-11-04', `${ARCH}/864749/000086474926000119/a2026q3-8kex991.htm`),
};

const TRMB = [
  { date: '2024-02-12', trimestre: 'T4 2023', ca: 932.4, caAnPasse: 856.5, cout: 355.1, op: 96.9, opAnPasse: 96.7, carnet: null, guidance: g(2024, 3570, 3670) },
  { date: '2024-05-03', trimestre: 'T1 2024', ca: 953.3, caAnPasse: 915.4, cout: 359.7, op: 109.2, opAnPasse: 137.0, carnet: null, guidance: g(2024, 3570, 3670) },
  { date: '2024-08-06', trimestre: 'T2 2024', ca: 870.8, caAnPasse: 993.6, cout: 324.9, op: 61.6, opAnPasse: 93.6, carnet: null, guidance: g(2024, 3590, 3670) },
  { date: '2024-11-06', trimestre: 'T3 2024', ca: 875.8, caAnPasse: 957.3, cout: 300.2, op: 116.4, opAnPasse: 121.3, carnet: null, guidance: g(2024, 3625, 3665) },
  { date: '2025-02-19', trimestre: 'T4 2024', ca: 983.4, caAnPasse: 932.4, cout: 302.2, op: 173.5, opAnPasse: 96.9, carnet: null, guidance: g(2025, 3370, 3470) },
  { date: '2025-05-07', trimestre: 'T1 2025', ca: 840.6, caAnPasse: 953.3, cout: 279.8, op: 97.5, opAnPasse: 109.2, carnet: null, guidance: g(2025, 3370, 3470) },
  { date: '2025-08-06', trimestre: 'T2 2025', ca: 875.7, caAnPasse: 870.8, cout: 277.8, op: 127.8, opAnPasse: 61.6, carnet: null, guidance: g(2025, 3480, 3560) },
  { date: '2025-11-05', trimestre: 'T3 2025', ca: 901.2, caAnPasse: 875.8, cout: 280.1, op: 150.5, opAnPasse: 116.4, carnet: null, guidance: g(2025, 3545, 3585) },
  { date: '2026-02-10', trimestre: 'T4 2025', ca: 969.8, caAnPasse: 983.4, cout: 271.7, op: 216.2, opAnPasse: 173.5, carnet: null, guidance: g(2026, 3810, 3910) },
  { date: '2026-05-06', trimestre: 'T1 2026', ca: 939.9, caAnPasse: 840.6, cout: 293.6, op: 144.0, opAnPasse: 97.5, carnet: null, guidance: g(2026, 3835, 3915) },
  { date: '2026-08-12', trimestre: 'T2 2026', ca: 972.0, caAnPasse: 875.7, cout: 297.1, op: 132.0, opAnPasse: 127.8, carnet: null, guidance: g(2026, 3900, 3950) },
  { date: '2026-11-04', trimestre: 'T3 2026', ca: 966.8, caAnPasse: 901.2, cout: 307.7, op: 142.0, opAnPasse: 150.5, carnet: null, guidance: g(2026, 3910, 3940) },
];

// ═════════════════════════════════════════════════════════════════════════════
// SIRIUS XM (SIRI) — plateforme
//
// DOUZE 8-K RUBRIQUE 2.02, UN PAR TRIMESTRE, chacun accompagné le MÊME JOUR du 10-Q ou du 10-K.
// Aucun leurre à écarter, et les précisions 4 et 8 sont servies sans effort.
//
// CA DE LA THÈSE : le chiffre d'affaires TOTAL, par le repli de §2, et il faut dire ce qui a été
// écarté. Le segment radio satellitaire porte le récit et pèse environ les trois quarts du
// chiffre d'affaires — mais le COMMUNIQUÉ ne l'imprime qu'à partir de 2026 ; avant, seul le
// consolidé y figure. Le 10-Q du jour le porte bien, dans une note organisée par TYPE de revenu
// et non par segment, d'où une série de douze trimestres impossible à reconstituer sans
// recoupements. Conséquence bénigne ici, contrairement à EchoStar : aucune cession ne vient
// casser le périmètre, donc le consolidé suit de près le segment.
//
// INDICATEUR DE DEMANDE : les abonnés auto-payants de SiriusXM en fin de période, publiés dans
// chaque communiqué avec leur comparatif. Aucun carnet dans une activité d'abonnement.
//
// LE TABLEAU « AJUSTÉ » EST UN PIÈGE. Chaque communiqué de Sirius XM présente DEUX comptes de
// résultat : le GAAP, puis un second d'où « legal settlements and reserves and share-based
// payment expense have been excluded ». Les deux portent les mêmes libellés. Le second donne une
// marge brute de 1 042 là où le GAAP donne 1 136 : §3 est formel, « les résultats ajustés ne
// servent à aucune dimension ». La marge brute retenue ici est donc la marge brute GAAP balisée
// (`us-gaap:GrossProfit`), et `cout` vaut chiffre d'affaires moins marge brute — soustraction de
// deux montants GAAP publiés, pas un chiffre repris d'un tableau ajusté.
//
// LES TROIS QUATRIÈMES TRIMESTRES N'ONT PAS DE MARGE BRUTE. Le 10-K ne balise pas le trimestre et
// le communiqué annuel n'imprime pas de marge brute GAAP trimestrielle : garde-fou non calculable
// sur ces lignes. Le chiffre d'affaires et le résultat d'exploitation du trimestre, eux, sont bien
// imprimés dans le communiqué annuel.
//
// LES COMPARATIFS SONT RETRAITÉS D'UN DÉPÔT À L'AUTRE : le résultat d'exploitation du T1 2024 vaut
// 437 dans le communiqué du jour et 409 dans celui d'un an plus tard ; celui du T4 2023 passe de
// 490 à 455. Chaque ligne lit son propre document (précision 8).
//
// Montants en MILLIONS de dollars. Abonnés en MILLIERS.
// ═════════════════════════════════════════════════════════════════════════════

const SIRI_SRC = {
  '2024-02-01': src('8-K', '2024-02-01', `${ARCH}/908937/000090893724000005/siriq42023earningsrelease.htm`),
  '2024-04-30': src('8-K', '2024-04-30', `${ARCH}/908937/000090893724000013/siriq12024earningsrelease.htm`),
  '2024-08-01': src('8-K', '2024-08-01', `${ARCH}/908937/000090893724000019/siriq22024earningsrelease.htm`),
  '2024-10-31': src('8-K', '2024-10-31', `${ARCH}/908937/000090893724000026/siriq32024earningsreleases.htm`),
  '2025-01-30': src('8-K', '2025-01-30', `${ARCH}/908937/000090893725000004/siriq42024earningsreleases.htm`),
  '2025-05-01': src('8-K', '2025-05-01', `${ARCH}/908937/000090893725000008/siriq12025earningsrelease.htm`),
  '2025-07-31': src('8-K', '2025-07-31', `${ARCH}/908937/000090893725000021/siriq22025earningsrelease.htm`),
  '2025-10-30': src('8-K', '2025-10-30', `${ARCH}/908937/000090893725000028/siriq32025earningsrelease.htm`),
  '2026-02-05': src('8-K', '2026-02-05', `${ARCH}/908937/000090893726000003/siriq42025earningsrelease.htm`),
  '2026-04-30': src('8-K', '2026-04-30', `${ARCH}/908937/000090893726000010/siriq12026earningsrelease.htm`),
  '2026-07-30': src('8-K', '2026-07-30', `${ARCH}/908937/000090893726000020/siriq22026earningsrelease.htm`),
  '2026-10-29': src('8-K', '2026-10-29', `${ARCH}/908937/000090893726000027/siriq32026earningsrelease.htm`),
};

// cout = chiffre d'affaires − marge brute GAAP balisée du dépôt du jour. Les prévisions de Sirius
// XM sont des points, pas des fourchettes : basse = haute.
const SIRI = [
  { date: '2024-02-01', trimestre: 'T4 2023', ca: 2287, caAnPasse: 2283, cout: null, op: 490, opAnPasse: 562, croissanceClients: croissance(31942, 32387), guidance: g(2024, 8750, 8750) },
  { date: '2024-04-30', trimestre: 'T1 2024', ca: 2162, caAnPasse: 2144, cout: 2162 - 1136, op: 437, opAnPasse: 412, croissanceClients: croissance(31583, 32040), guidance: g(2024, 8750, 8750) },
  { date: '2024-08-01', trimestre: 'T2 2024', ca: 2178, caAnPasse: 2250, cout: 2178 - 1166, op: 505, opAnPasse: 479, croissanceClients: croissance(31484, 31907), guidance: g(2024, 8750, 8750) },
  // Dépréciation de Pandora : perte d'exploitation de 2 901 millions sur le trimestre.
  { date: '2024-10-31', trimestre: 'T3 2024', ca: 2171, caAnPasse: 2271, cout: 2171 - 1156, op: -2901, opAnPasse: 528, croissanceClients: croissance(31497, 31811), guidance: g(2024, 8675, 8675) },
  { date: '2025-01-30', trimestre: 'T4 2024', ca: 2188, caAnPasse: 2287, cout: null, op: 506, opAnPasse: 455, croissanceClients: croissance(31646, 31942), guidance: g(2025, 8500, 8500) },
  { date: '2025-05-01', trimestre: 'T1 2025', ca: 2068, caAnPasse: 2162, cout: 2068 - 1076, op: 387, opAnPasse: 409, croissanceClients: croissance(31343, 31583), guidance: g(2025, 8500, 8500) },
  { date: '2025-07-31', trimestre: 'T2 2025', ca: 2138, caAnPasse: 2178, cout: 2138 - 1120, op: 365, opAnPasse: 471, croissanceClients: croissance(31275, 31484), guidance: g(2025, 8500, 8500) },
  { date: '2025-10-30', trimestre: 'T3 2025', ca: 2159, caAnPasse: 2171, cout: 2159 - 1128, op: 493, opAnPasse: -2901, croissanceClients: croissance(31235, 31497), guidance: g(2025, 8525, 8525) },
  { date: '2026-02-05', trimestre: 'T4 2025', ca: 2193, caAnPasse: 2188, cout: null, op: 226, opAnPasse: 506, croissanceClients: croissance(31345, 31646), guidance: g(2026, 8500, 8500) },
  { date: '2026-04-30', trimestre: 'T1 2026', ca: 2091, caAnPasse: 2068, cout: 2091 - 1105, op: 454, opAnPasse: 387, croissanceClients: croissance(31234, 31343), guidance: g(2026, 8500, 8500) },
  { date: '2026-07-30', trimestre: 'T2 2026', ca: 2160, caAnPasse: 2138, cout: 2160 - 1144, op: 472, opAnPasse: 365, croissanceClients: croissance(31255, 31275), guidance: g(2026, 8525, 8525) },
  { date: '2026-10-29', trimestre: 'T3 2026', ca: 2153, caAnPasse: 2159, cout: 2153 - 1136, op: 479, opAnPasse: 493, croissanceClients: croissance(31260, 31235), guidance: g(2026, 8550, 8550) },
];

// ═════════════════════════════════════════════════════════════════════════════
// GARMIN (GRMN) — industriel — exercice 52/53 semaines, clos fin décembre
//
// UN 8-K MAL INDEXÉ, ET IL FALLAIT LE VOIR. Garmin n'a déposé que onze 8-K rubrique 2.02 pour
// douze trimestres : le communiqué du T1 2025, déposé le 30 avril 2025, porte la rubrique 2.01
// (« réalisation d'une acquisition ou d'une cession ») et non 2.02. Son annexe 99.1 est pourtant
// bien le communiqué de résultats du trimestre. Filtrer sur la seule rubrique 2.02 aurait fait
// manquer une publication et décalé toute la série : la liste des dépôts se contrôle, elle ne se
// filtre pas. Douze publications, douze lignes.
//
// CA DE LA THÈSE : le chiffre d'affaires TOTAL, par le repli de §2. Garmin figure dans l'univers
// pour le positionnement par satellite, qui traverse ses cinq segments (forme, plein air,
// aviation, marine, première monte) sans en être aucun.
//
// D2 EST MUET SUR LES DOUZE LIGNES : Garmin ne publie ni commandes, ni carnet, ni nombre de
// clients ou d'abonnés. Troisième branche de §2. Troisième société du rejeu dans ce cas, après
// EchoStar et Trimble.
//
// LES PRÉVISIONS SONT DES POINTS, FORMULÉS DE QUATRE FAÇONS DIFFÉRENTES selon le trimestre :
// « revenue of approximately $X billion », « guidance of approximately $X billion revenue »,
// « expectations for revenue to approximately $X billion », ou une case de tableau. Toutes
// relèvent de §5 à l'identique ; seule l'extraction a dû s'adapter. Un garde-fou de lecture a été
// posé : un chiffre d'affaires annuel de Garmin vaut au moins 5,75 milliards quand un trimestre
// n'a jamais dépassé 2,2 — tout montant sous 4 milliards n'est donc pas une prévision annuelle.
//
// Montants en MILLIERS de dollars, tels qu'imprimés. Les trois trimestres de clôture viennent de
// la colonne trimestrielle du communiqué annuel ; les neuf autres recoupent le 10-Q du jour.
// ═════════════════════════════════════════════════════════════════════════════

const GRMN_SRC = {
  '2024-02-21': src('8-K', '2024-02-21', `${ARCH}/1121788/000095017024017560/grmn-ex99_1.htm`),
  '2024-05-01': src('8-K', '2024-05-01', `${ARCH}/1121788/000095017024050880/grmn-ex99_1.htm`),
  '2024-07-31': src('8-K', '2024-07-31', `${ARCH}/1121788/000095017024088226/grmn-ex99_1.htm`),
  '2024-10-30': src('8-K', '2024-10-30', `${ARCH}/1121788/000095017024118579/grmn-ex99_1.htm`),
  '2025-02-19': src('8-K', '2025-02-19', `${ARCH}/1121788/000095017025022757/grmn-ex99_1.htm`),
  // Rubrique 2.01 au lieu de 2.02 : l'annexe 99.1 est bien le communiqué de résultats du T1 2025.
  '2025-04-30': src('8-K', '2025-04-30', `${ARCH}/1121788/000095017025060551/grmn-ex99_1.htm`),
  '2025-07-30': src('8-K', '2025-07-30', `${ARCH}/1121788/000095017025099874/grmn-ex99_1.htm`),
  '2025-10-29': src('8-K', '2025-10-29', `${ARCH}/1121788/000119312525254600/grmn-ex99_1.htm`),
  '2026-02-18': src('8-K', '2026-02-18', `${ARCH}/1121788/000119312526056025/grmn-ex99_1.htm`),
  '2026-04-29': src('8-K', '2026-04-29', `${ARCH}/1121788/000119312526188907/grmn-ex99_1.htm`),
  '2026-07-29': src('8-K', '2026-07-29', `${ARCH}/1121788/000119312526322113/grmn-ex99_1.htm`),
  '2026-10-28': src('8-K', '2026-10-28', `${ARCH}/1121788/000119312526435066/grmn-ex99_1.htm`),
};

const GRMN = [
  { date: '2024-02-21', trimestre: 'T4 2023', ca: 1482501, caAnPasse: 1306356, cout: 618352, op: 340454, opAnPasse: 267175, guidance: g(2024, 5750, 5750) },
  { date: '2024-05-01', trimestre: 'T1 2024', ca: 1381649, caAnPasse: 1147424, cout: 579510, op: 298410, opAnPasse: 196982, guidance: g(2024, 5750, 5750) },
  { date: '2024-07-31', trimestre: 'T2 2024', ca: 1506671, caAnPasse: 1320795, cout: 643780, op: 342027, opAnPasse: 284355, guidance: g(2024, 5950, 5950) },
  { date: '2024-10-30', trimestre: 'T3 2024', ca: 1586022, caAnPasse: 1277531, cout: 634423, op: 437475, opAnPasse: 270369, guidance: g(2024, 6120, 6120) },
  { date: '2025-02-19', trimestre: 'T4 2024', ca: 1822560, caAnPasse: 1482501, cout: 742634, op: 516082, opAnPasse: 340454, guidance: g(2025, 6800, 6800) },
  { date: '2025-04-30', trimestre: 'T1 2025', ca: 1535099, caAnPasse: 1381649, cout: 650554, op: 332824, opAnPasse: 298410, guidance: g(2025, 6850, 6850) },
  { date: '2025-07-30', trimestre: 'T2 2025', ca: 1814564, caAnPasse: 1506671, cout: 747552, op: 472295, opAnPasse: 342027, guidance: g(2025, 7100, 7100) },
  { date: '2025-10-29', trimestre: 'T3 2025', ca: 1770901, caAnPasse: 1586022, cout: 724414, op: 456803, opAnPasse: 437475, guidance: g(2025, 7100, 7100) },
  { date: '2026-02-18', trimestre: 'T4 2025', ca: 2124955, caAnPasse: 1822560, cout: 866695, op: 614154, opAnPasse: 516082, guidance: g(2026, 7900, 7900) },
  { date: '2026-04-29', trimestre: 'T1 2026', ca: 1753489, caAnPasse: 1535099, cout: 711200, op: 431665, opAnPasse: 332824, guidance: g(2026, 7900, 7900) },
  { date: '2026-07-29', trimestre: 'T2 2026', ca: 2022092, caAnPasse: 1814564, cout: 760070, op: 615508, opAnPasse: 472295, guidance: g(2026, 8050, 8050) },
  { date: '2026-10-28', trimestre: 'T3 2026', ca: 1986076, caAnPasse: 1770901, cout: 728308, op: 611648, opAnPasse: 456803, guidance: g(2026, 8150, 8150) },
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
//  · §4 D2 NE CHANGE PAS DE CHEMIN, LUI. L'indicateur de demande est fixé à l'entrée (§2) :
//    Planet publie un carnet (« backlog ») dès sa première ligne, donc c'est le carnet, et
//    « on ne le remplace pas ». La première ligne n'a pas de carnet précédent — le communiqué
//    du T3 FY2024 ne publiait qu'un ACV — donc D2 y est NON PUBLIÉ, et non pas rabattu sur le
//    nombre de clients. Tentation écartée : §2 interdit de substituer un indicateur à l'autre,
//    et Planet cesse de publier son nombre de clients après le T4 FY2025 de toute façon.
//  · LE CARNET AU 31 JANVIER 2026 N'EST PAS CHIFFRÉ : le communiqué du T4 FY2026 n'imprime que
//    « over $900 Million ». Retenir 900 000 importerait un arrondi de ±50 000 dans une variation
//    de carnet — ce que la précision 3 interdit. Règle d'hésitation de §3, « retenir la plus
//    neutre » : carnet NON PUBLIÉ, et D2 muet sur deux lignes (T4 FY2026 et T1 FY2027).
//  · Le nombre de clients est relevé dans les données ci-dessous mais N'ENTRE DANS AUCUN CALCUL,
//    puisque l'indicateur retenu est le carnet. Il est consigné parce qu'il documente ce que le
//    communiqué publiait, et parce qu'il faudrait le rouvrir si une v1.4 autorisait un repli.
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
  { date: '2023-12-07', trimestre: 'T3 FY2024', ca: 55400, caAnPasse: 49700, cout: 29350, op: -47860, opAnPasse: -42630, carnet: null, clients: 976, guidanceT: [56000, 59000], horsSerie: true },
  // Carnet publié ce jour-là (242 392) mais sans valeur au 31 octobre 2023 : D2 non publié (§2).
  { date: '2024-03-28', trimestre: 'T4 FY2024', ca: 58900, caAnPasse: 53000, cout: 26400, op: -33900, opAnPasse: -42700, carnet: 242392, clients: 1018, guidanceT: [58000, 61000] },
  { date: '2024-06-06', trimestre: 'T1 FY2025', ca: 60400, caAnPasse: 52703, cout: 28757, op: -34571, opAnPasse: -44692, carnet: 219773, clients: 1031, guidanceT: [59000, 63000] },
  { date: '2024-09-05', trimestre: 'T2 FY2025', ca: 61100, caAnPasse: 53761, cout: 28782, op: -39577, opAnPasse: -43280, carnet: 213500, clients: 1012, guidanceT: [61000, 64000] },
  { date: '2024-12-09', trimestre: 'T3 FY2025', ca: 61300, caAnPasse: 55400, cout: 23700, op: -22600, opAnPasse: -47900, carnet: 232100, clients: 1015, guidanceT: [61000, 63000] },
  { date: '2025-03-20', trimestre: 'T4 FY2025', ca: 61600, caAnPasse: 58900, cout: 23300, op: -19400, opAnPasse: -33900, carnet: 498500, clients: null, guidance: g(2026, 260000, 280000) },
  { date: '2025-06-04', trimestre: 'T1 FY2026', ca: 66300, caAnPasse: 60400, cout: 29700, op: -22800, opAnPasse: -34600, carnet: 527000, clients: null, guidance: g(2026, 265000, 280000) },
  { date: '2025-09-08', trimestre: 'T2 FY2026', ca: 73400, caAnPasse: 61100, cout: 31100, op: -18000, opAnPasse: -39600, carnet: 736100, clients: null, guidance: g(2026, 281000, 289000) },
  { date: '2025-12-10', trimestre: 'T3 FY2026', ca: 81300, caAnPasse: 61300, cout: 34700, op: -18300, opAnPasse: -22600, carnet: 734500, clients: null, guidance: g(2026, 297000, 301000) },
  // « over $900 Million » : aucun montant exact → carnet non publié, hésitation consignée.
  { date: '2026-03-19', trimestre: 'T4 FY2026', ca: 86800, caAnPasse: 61600, cout: 39800, op: -36000, opAnPasse: -19400, carnet: null, clients: null, guidance: g(2027, 415000, 440000), hesitation: true },
  { date: '2026-06-04', trimestre: 'T1 FY2027', ca: 94200, caAnPasse: 66300, cout: 43700, op: -34900, opAnPasse: -22800, carnet: 906100, clients: null, guidance: g(2027, 425000, 441000) },
  { date: '2026-09-03', trimestre: 'T2 FY2027', ca: 116100, caAnPasse: 73386, cout: 50420, op: -13509, opAnPasse: -17960, carnet: 814900, clients: null, guidance: g(2027, 430000, 441000) },
];

/**
 * Série « pré-revenus » : D1 par unités livrées, D2 par barreau.
 *
 * D3 suit la hiérarchie de §5 : la prévision chiffrée d'abord, le jalon daté seulement « pour un
 * pré-revenus SANS prévision chiffrée ». Une société qui se met à chiffrer en cours de série
 * change donc de source de D3 ce jour-là — c'est le cas d'AST SpaceMobile.
 */
function seriePreRevenus(lignes, sources) {
  const out = [];
  let unitesPrecedent = null, barreauPrecedent = null, guidancePrecedente = null;
  for (const l of lignes) {
    const statut = (l.guidance != null || l.guidanceT != null)
      ? statutPrevision(l, guidancePrecedente)
      : l.statut;
    if (!l.horsSerie) {
      out.push(publication({
        date: l.date, trimestre: l.trimestre, source: sources[l.date],
        d1: sensUnites(l.unites, unitesPrecedent),
        d2: sensBarreau(l.barreau, barreauPrecedent),
        d4: sensMargeOperationnelle(l.op, l.ca, l.opAnPasse, l.caAnPasse),
        statut, margeBrute: etatMargeBrute(l.ca, l.cout),
        drapeaux: l.hesitation ? [{ code: 'hesitation', source: sources[l.date] }] : [],
      }));
    }
    unitesPrecedent = l.unites;
    barreauPrecedent = l.barreau;
    if (l.guidance != null) guidancePrecedente = l.guidance;
  }
  return out;
}

/** Série d'un industriel ou d'une plateforme. indicateurDemande : §2, fixé à l'entrée. */
function serie(lignes, sources, { caThese = false, indicateurDemande = 'carnet' } = {}) {
  const out = [];
  let croissancePrecedente = null, carnetPrecedent = null, guidancePrecedente = null, clientsPrecedent = null;
  for (const l of lignes) {
    const c = croissance(caThese ? l.caThese : l.ca, caThese ? l.caTheseAnPasse : l.caAnPasse);
    if (!l.horsSerie) {
      out.push(publication({
        date: l.date, trimestre: l.trimestre, source: sources[l.date],
        d1: sensEcart(c, croissancePrecedente),
        d2: sensDemandeEngagee(indicateurDemande, {
          carnet: l.carnet, carnetPrecedent, ca: l.ca,
          croissanceClients: l.croissanceClients, croissanceClientsPrecedente: clientsPrecedent,
        }),
        d4: sensMargeOperationnelle(l.op, l.ca, l.opAnPasse, l.caAnPasse),
        // `statut` écrit à la main l'emporte : §5 classe des situations qu'aucun calcul de
        // milieu de fourchette ne rend, comme le RETRAIT d'une prévision annoncée (§3, exemple
        // ChargePoint). Chaque emploi doit porter son motif en commentaire, à côté de la ligne.
        statut: l.statut ?? statutPrevision(l, guidancePrecedente),
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
    indicateur_demande: { type: 'carnet', valeur: 'Carnet de commandes (« backlog »)', source: PL_SRC['2026-09-03'] },
    publications: serie(PL, PL_SRC, { indicateurDemande: 'carnet' }),
    evenements_commerciaux: [],
  },
  {
    id: 'ast-spacemobile', nom: 'AST SpaceMobile', archetype: 'pre-revenus',
    recit: 'Spatial — réseau cellulaire à large bande depuis l’orbite, directement vers le téléphone',
    ca_these: { valeur: 'Unités livrées — satellites mis en orbite dans le trimestre', source: ASTS_SRC['2026-08-10'] },
    indicateur_demande: { type: 'barreau', valeur: 'Barreau d’engagement (§8), plafonné à 2 faute de 8-K rubrique 1.01 côté client', source: ASTS_SRC['2026-11-09'] },
    publications: seriePreRevenus(ASTS, ASTS_SRC),
    evenements_commerciaux: [],
  },
  {
    id: 'globalstar', nom: 'Globalstar', archetype: 'plateforme',
    recit: 'Spatial — capacité satellitaire en gros et objets connectés',
    ca_these: { valeur: 'Chiffre d’affaires de service, hors ventes de terminaux', source: GSAT_SRC['2026-11-05'] },
    indicateur_demande: { type: 'clients', valeur: 'Abonnés moyens du trimestre, total des trois catégories de détail', source: GSAT_SRC['2026-11-05'] },
    publications: serie(GSAT, GSAT_SRC, { caThese: true, indicateurDemande: 'clients' }),
    evenements_commerciaux: [],
  },
  {
    id: 'echostar', nom: 'EchoStar', archetype: 'plateforme',
    recit: 'Spatial — satellites de télévision et de haut débit, spectre sans fil',
    ca_these: { valeur: 'Chiffre d’affaires total — le segment satellite ne survit pas à la série', source: SATS_SRC['2026-11-03'] },
    indicateur_demande: { type: 'clients', valeur: 'Abonnés de fin de période, total des catégories publiées', source: SATS_SRC['2026-11-03'] },
    publications: serie(SATS, SATS_SRC, { indicateurDemande: 'clients' }),
    evenements_commerciaux: [],
  },
  {
    id: 'trimble', nom: 'Trimble', archetype: 'plateforme',
    recit: 'Spatial — positionnement par satellite et logiciels de terrain',
    ca_these: { valeur: 'Chiffre d’affaires total — aucun segment ne couvre le positionnement', source: TRMB_SRC['2026-11-04'] },
    indicateur_demande: { type: 'non-publie', valeur: 'Ni commandes ni abonnés ; carnet GAAP publié arrondi au cent millions', source: TRMB_SRC['2026-11-04'] },
    publications: serie(TRMB, TRMB_SRC, { indicateurDemande: 'non-publie' }),
    evenements_commerciaux: [],
  },
  {
    id: 'sirius-xm', nom: 'Sirius XM', archetype: 'plateforme',
    recit: 'Spatial — radio par satellite et audio numérique',
    ca_these: { valeur: 'Chiffre d’affaires total — le segment satellitaire n’est imprimé qu’à partir de 2026', source: SIRI_SRC['2026-10-29'] },
    indicateur_demande: { type: 'clients', valeur: 'Abonnés auto-payants SiriusXM, fin de période', source: SIRI_SRC['2026-10-29'] },
    publications: serie(SIRI, SIRI_SRC, { indicateurDemande: 'clients' }),
    evenements_commerciaux: [],
  },
  {
    id: 'garmin', nom: 'Garmin', archetype: 'industriel',
    recit: 'Spatial — appareils de positionnement par satellite',
    ca_these: { valeur: 'Chiffre d’affaires total — le positionnement traverse les cinq segments', source: GRMN_SRC['2026-10-28'] },
    indicateur_demande: { type: 'non-publie', valeur: 'Ni commandes, ni carnet, ni nombre de clients publiés', source: GRMN_SRC['2026-10-28'] },
    publications: serie(GRMN, GRMN_SRC, { indicateurDemande: 'non-publie' }),
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
