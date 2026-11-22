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
  croissance, sensEcart, sensCarnet, sensMargeOperationnelle, sensUnites, sensBarreau,
  etatMargeBrute, statutAnnuel, src, publication,
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

/** Série d'un industriel ou d'une plateforme. d2 : 'carnet' | 'clients'. */
function serie(lignes, sources, { caThese = false, d2 = 'carnet' } = {}) {
  const out = [];
  let croissancePrecedente = null, carnetPrecedent = null, guidancePrecedente = null, clientsPrecedent = null;
  for (const l of lignes) {
    const c = croissance(caThese ? l.caThese : l.ca, caThese ? l.caTheseAnPasse : l.caAnPasse);
    if (!l.horsSerie) {
      out.push(publication({
        date: l.date, trimestre: l.trimestre, source: sources[l.date],
        d1: sensEcart(c, croissancePrecedente),
        d2: d2 === 'clients' ? sensEcart(l.croissanceClients, clientsPrecedent) : sensCarnet(l.carnet, carnetPrecedent, l.ca),
        d4: sensMargeOperationnelle(l.op, l.ca, l.opAnPasse, l.caAnPasse),
        statut: statutAnnuel(l.guidance, guidancePrecedente),
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
