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
