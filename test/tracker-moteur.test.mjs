// Moteur d'alertes du tracker d'inflexions — vérifié contre les TROIS suites de référence de
// docs/tracker-methode.md §13 (rejeu corrigé du 18 novembre 2026), transcrites intégralement :
// CrowdStrike (19 publications), Plug Power (20), Fisker (13). Ces suites testent la logique des
// alertes à partir des sens ; elles ne testent pas la lecture des communiqués.
//
// Le pseudo-code de §6 fait foi. Chaque ligne attendue porte : sens, état de marge brute, solde,
// alertes émises, alertes retenues (garde-fou de marge brute), drapeaux du moteur, régime APRÈS
// la publication — les annotations « le régime se ferme » des suites se vérifient par ce dernier.
// Aucune dépendance : charge tracker-modele.js dans node:vm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const M = vm.createContext({});
vm.runInContext(readFileSync(new URL('../tracker-modele.js', import.meta.url), 'utf8'), M);

// Un contexte vm a ses propres intrinsèques : repasser par JSON avant deepEqual.
const brut = (v) => JSON.parse(JSON.stringify(v));

// ── Transcription des suites : [date, d1, d2, d3, d4, margeBrute, solde, alertes, retenues, drapeaux, régime] ──
// Sens : '+' = hausse, '0' = stable, '-' = baisse, '.' = non publié (n.p. dans la méthode).
const SENS = { '+': 'hausse', 0: 'stable', '-': 'baisse', '.': 'non-publie' };
const ligne = ([date, d1, d2, d3, d4, mb, solde, alertes, retenues, drapeaux, regime]) => ({
  entree: { date, sens: { d1: SENS[d1], d2: SENS[d2], d3: SENS[d3], d4: SENS[d4] }, margeBrute: mb },
  attendu: { date, solde, alertes, retenues, drapeaux, regime },
});

// §13 — CrowdStrike (plateforme). Marge brute positive sur toute la série (+69,5 % à +75,6 %).
const CROWDSTRIKE = [
  ['2019-07-18', '.', '.', 0, '+', 'positive', 1, [], [], [], 'aucun'], // aucune (première ligne)
  ['2019-09-05', '-', '.', '+', '+', 'positive', 1, [], [], [], 'aucun'],
  ['2019-12-05', 0, '.', '+', '+', 'positive', 2, ['bascule'], [], [], 'bascule'],
  ['2020-03-19', '-', '+', 0, '+', 'positive', 1, [], [], [], 'bascule'],
  ['2020-06-02', '-', '-', '+', '+', 'positive', 0, [], [], [], 'bascule'],
  ['2020-09-02', 0, '-', '+', '+', 'positive', 1, [], [], [], 'bascule'],
  ['2020-12-02', '-', '-', '+', '+', 'positive', 0, [], [], [], 'bascule'],
  ['2021-03-16', '-', '-', 0, '+', 'positive', -1, [], [], [], 'aucun'], // le régime de bascule se ferme
  ['2021-06-03', '-', 0, '+', 0, 'positive', 0, ['signal-faible'], [], [], 'aucun'],
  ['2021-08-31', '-', 0, '+', 0, 'positive', 0, [], [], [], 'aucun'],
  ['2021-12-01', '-', '-', '+', 0, 'positive', -1, [], [], [], 'aucun'],
  ['2022-03-09', '-', '-', 0, 0, 'positive', -2, ['rechute'], [], [], 'rechute'],
  ['2022-06-02', '-', '-', '+', '+', 'positive', 0, ['signal-faible'], [], [], 'rechute'],
  ['2022-08-30', '-', '-', '+', '+', 'positive', 0, [], [], [], 'aucun'], // le régime de rechute se ferme
  ['2022-11-29', '-', '-', 0, 0, 'positive', -2, ['rechute'], [], [], 'rechute'],
  ['2023-03-07', '-', '-', 0, 0, 'positive', -2, [], [], [], 'rechute'], // régime de rechute
  ['2023-05-31', '-', '.', '+', 0, 'positive', 0, ['signal-faible'], [], [], 'rechute'],
  ['2023-08-30', '-', '.', '+', '+', 'positive', 1, [], [], [], 'aucun'], // le régime de rechute se ferme
  ['2023-11-28', '-', '.', '+', '+', 'positive', 1, [], [], [], 'aucun'],
].map(ligne);

// §13 — Plug Power (industriel).
const PLUG_POWER = [
  ['2020-03-05', '+', '.', 0, '+', 'positive', 2, [], [], [], 'aucun'], // aucune (première ligne), même à +2
  ['2020-05-07', '+', '.', 0, '+', 'negative', 2, [], ['bascule'], ['vend-a-perte'], 'aucun'], // Bascule retenue, « vend à perte »
  ['2020-08-06', '-', '.', 0, '-', 'positive', -2, ['rechute'], [], [], 'rechute'],
  ['2020-11-09', '+', '.', '+', '-', 'negative', 1, ['signal-faible'], [], [], 'rechute'],
  ['2021-02-25', '.', '.', 0, '.', 'non-calculable', 0, [], [], [], 'aucun'], // le régime de rechute se ferme
  ['2021-06-22', '.', '.', 0, 0, 'negative', 0, [], [], [], 'aucun'],
  ['2021-08-05', '+', '.', '+', '-', 'negative', 1, ['signal-faible'], [], [], 'aucun'],
  ['2021-11-09', '-', '.', '+', '-', 'negative', -1, [], [], [], 'aucun'],
  ['2022-03-01', '.', '.', 0, '.', 'negative', 0, [], [], [], 'aucun'],
  ['2022-05-09', '.', '.', 0, '-', 'negative', -1, [], [], [], 'aucun'],
  ['2022-08-09', '-', '.', 0, '-', 'negative', -2, ['rechute'], [], [], 'rechute'],
  ['2022-11-08', '+', '.', '-', '-', 'negative', -1, [], [], [], 'rechute'],
  ['2023-03-01', '+', '.', 0, '+', 'negative', 2, [], ['bascule'], ['vend-a-perte'], 'rechute'], // retenue, régime inchangé
  ['2023-05-09', '+', '.', 0, 0, 'negative', 1, [], [], [], 'aucun'], // le régime de rechute se ferme
  ['2023-08-09', '+', '.', '-', '+', 'negative', 1, [], [], [], 'aucun'],
  ['2023-11-09', '-', '.', '.', '-', 'negative', -2, ['rechute'], [], [], 'rechute'],
  ['2024-03-01', '-', '.', '.', '-', 'negative', -2, [], [], [], 'rechute'], // régime de rechute
  ['2024-05-09', '-', '.', '.', '-', 'negative', -2, [], [], [], 'rechute'],
  ['2024-08-08', '-', '.', 0, '-', 'negative', -2, [], [], [], 'rechute'],
  ['2024-11-12', '+', '.', '-', '+', 'negative', 1, [], [], [], 'rechute'], // solde précédent −2 : le régime ne se ferme pas
].map(ligne);

// §13 — Fisker (pré-revenus). Barreau 3 jusqu'au 9 mai 2023 (réservations avec acompte),
// barreau 5 à partir du 4 août 2023 (premières livraisons). La Bascule commerciale est retenue
// trois fois par le garde-fou de marge brute (précision 1) et ne part jamais.
const FISKER = [
  ['2021-02-25', '.', '.', 0, '.', 'non-calculable', 0, [], [], [], 'aucun'], // aucune (première ligne)
  ['2021-05-17', 0, '+', 0, '.', 'non-calculable', 1, [], [], [], 'aucun'], // D2 précédent n.p. : pas de Signal faible
  ['2021-08-05', 0, '+', 0, '.', 'non-calculable', 1, [], [], [], 'aucun'],
  ['2021-11-03', 0, '+', 0, '.', 'non-calculable', 1, [], [], [], 'aucun'],
  ['2022-02-16', 0, '+', 0, '.', 'non-calculable', 1, [], [], [], 'aucun'],
  ['2022-05-04', 0, '+', 0, '.', 'non-calculable', 1, [], [], [], 'aucun'],
  ['2022-08-03', 0, '+', 0, '.', 'non-calculable', 1, [], [], [], 'aucun'],
  ['2022-11-02', 0, '+', 0, '.', 'non-calculable', 1, [], [], [], 'aucun'],
  ['2023-02-27', 0, '+', 0, '.', 'non-calculable', 1, [], [], [], 'aucun'],
  ['2023-05-09', 0, 0, '-', '.', 'non-calculable', -1, [], [], [], 'aucun'],
  ['2023-08-04', '+', '+', '-', '.', 'non-calculable', 1, ['signal-faible'], ['bascule-commerciale'], [], 'aucun'],
  ['2023-11-13', '+', 0, '.', '.', 'negative', 1, [], ['bascule-commerciale'], [], 'aucun'],
  ['2024-02-29', '+', 0, 0, '.', 'negative', 1, [], ['bascule-commerciale'], [], 'aucun'],
].map(ligne);

const BARREAUX_FISKER = (date) => (date >= '2023-08-04' ? 5 : 3);

function verifierSuite(nom, archetype, suite, barreauDe) {
  const lignes = suite.map((l) => ({ ...l.entree, barreau: barreauDe ? barreauDe(l.entree.date) : null }));
  const resultats = brut(M.moteurAlertes({ archetype, lignes }));
  assert.equal(resultats.length, suite.length, `${nom} : ${suite.length} publications attendues`);
  suite.forEach((l, i) => {
    assert.deepEqual(resultats[i], l.attendu, `${nom} ${l.attendu.date} (ligne ${i + 1})`);
  });
}

test('suite de référence §13 — CrowdStrike (plateforme, 19 publications)', () => {
  verifierSuite('CrowdStrike', 'plateforme', CROWDSTRIKE, null);
});

test('suite de référence §13 — Plug Power (industriel, 20 publications)', () => {
  verifierSuite('Plug Power', 'industriel', PLUG_POWER, null);
});

test('suite de référence §13 — Fisker (pré-revenus, 13 publications, Bascule commerciale retenue)', () => {
  verifierSuite('Fisker', 'pre-revenus', FISKER, BARREAUX_FISKER);
});

// ─────────────────────────────────────────────────────────────────────────────
// Cas que les suites ne couvrent pas, tirés du texte de §6
// ─────────────────────────────────────────────────────────────────────────────

const L = (sens, mb, barreau) => ({ sens: { d1: SENS[sens[0]], d2: SENS[sens[1]], d3: SENS[sens[2]], d4: SENS[sens[3]] }, margeBrute: mb, barreau: barreau === undefined ? null : barreau });

test('Bascule commerciale : possible dès la première publication, une seule par société', () => {
  const r = brut(M.moteurAlertes({ archetype: 'pre-revenus', lignes: [L('+.00', 'positive', 4), L('+.00', 'positive', 5)] }));
  assert.deepEqual(r[0].alertes, ['bascule-commerciale'], 'barreau 4 + marge brute positive dès la première ligne');
  assert.deepEqual(r[1].alertes, [], 'une seule Bascule commerciale par société');
});

test('Bascule commerciale : jamais pour une plateforme ou un industriel', () => {
  for (const archetype of ['plateforme', 'industriel']) {
    const r = brut(M.moteurAlertes({ archetype, lignes: [L('+.00', 'positive', 5)] }));
    assert.deepEqual(r[0].alertes, [], `${archetype} : pré-revenus seulement`);
    assert.deepEqual(r[0].retenues, [], `${archetype} : pas même retenue`);
  }
});

test('Bascule commerciale retenue : non consommée, elle part à la première marge brute positive', () => {
  const r = brut(M.moteurAlertes({ archetype: 'pre-revenus', lignes: [L('0.00', 'negative', 4), L('0.00', 'positive', 4)] }));
  assert.deepEqual(r[0].retenues, ['bascule-commerciale']);
  assert.deepEqual(r[0].drapeaux, [], 'le drapeau « vend à perte » appartient à la branche Bascule, pas à la commerciale');
  assert.deepEqual(r[1].alertes, ['bascule-commerciale'], 'l’alerte part quand les conditions sont réunies');
});

test('garde-fou sans objet : pas de ligne de coût des ventes, la Bascule passe', () => {
  const r = brut(M.moteurAlertes({ archetype: 'industriel', lignes: [L('0.00', 'sans-objet'), L('++0.', 'sans-objet')] }));
  assert.deepEqual(r[1].alertes, ['bascule'], 'mb_ok vaut vrai quand le garde-fou est sans objet');
});

test('marge brute nulle : la Bascule est retenue (« négative, nulle ou non calculable »)', () => {
  const r = brut(M.moteurAlertes({ archetype: 'plateforme', lignes: [L('0.00', 'positive'), L('++0.', 'nulle')] }));
  assert.deepEqual(r[1].alertes, []);
  assert.deepEqual(r[1].retenues, ['bascule']);
  assert.deepEqual(r[1].drapeaux, ['vend-a-perte']);
  assert.equal(r[1].regime, 'aucun', 'régime inchangé quand la Bascule est retenue');
});

test('passage direct du régime de rechute au régime de bascule', () => {
  const r = brut(M.moteurAlertes({ archetype: 'plateforme', lignes: [L('0.00', 'positive'), L('--0-', 'positive'), L('++0+', 'positive')] }));
  assert.deepEqual(r[1].alertes, ['rechute']);
  assert.deepEqual(r[2].alertes, ['bascule']);
  assert.equal(r[2].regime, 'bascule');
});

test('un sens précédent non publié ne déclenche pas de Signal faible (§6)', () => {
  const r = brut(M.moteurAlertes({ archetype: 'plateforme', lignes: [L('0..0', 'positive'), L('0+.0', 'positive')] }));
  assert.deepEqual(r[1].alertes, [], 'D2 passe de n.p. à hausse : n.p. ne vaut ni 0 ni −1');
});

test('le moteur refuse un archétype ou un sens hors méthode', () => {
  assert.throws(() => M.moteurAlertes({ archetype: 'licorne', lignes: [] }), /archetype/);
  assert.throws(() => M.moteurAlertes({ archetype: 'plateforme', lignes: [{ sens: { d1: 'tiede', d2: 'stable', d3: 'stable', d4: 'stable' }, margeBrute: 'positive', barreau: null }] }), /sens/);
  assert.throws(() => M.moteurAlertes({ archetype: 'plateforme', lignes: [{ sens: { d1: 'stable', d2: 'stable', d3: 'stable', d4: 'stable' }, margeBrute: 'bonne', barreau: null }] }), /marge/);
});

// ─────────────────────────────────────────────────────────────────────────────
// L'adaptateur depuis le schéma data/tracker/
// ─────────────────────────────────────────────────────────────────────────────

const SOURCE = { type: '8-K', date: '2026-01-01', url: 'https://exemple.test/depot' };
const pub = (date, sens, mb) => ({
  date, trimestre: 'T', source: SOURCE,
  dimensions: {
    d1: sens[0] === '.' ? { sens: 'non-publie' } : { sens: SENS[sens[0]], source: SOURCE },
    d2: sens[1] === '.' ? { sens: 'non-publie' } : { sens: SENS[sens[1]], source: SOURCE },
    d3: sens[2] === '.' ? { sens: 'non-publie' } : { sens: SENS[sens[2]], source: SOURCE },
    d4: sens[3] === '.' ? { sens: 'non-publie' } : { sens: SENS[sens[3]], source: SOURCE },
  },
  statut_prevision: 'non-publie',
  marge_brute: mb === 'non-calculable' || mb === 'sans-objet' ? { etat: mb } : { etat: mb, source: SOURCE },
  financement: { couleur: 'non-determinee', motifs: [] },
  drapeaux: [],
});

test('moteurDepuisFichier : trie par date, dérive le barreau des événements commerciaux (date ≤ publication)', () => {
  const fichier = {
    entreprise: 'societe-a', methode_version: '1.3',
    // Volontairement désordonnées : le moteur lit de la plus ancienne à la plus récente.
    publications: [pub('2026-08-01', '0.00', 'positive'), pub('2026-02-01', '0.00', 'negative'), pub('2026-05-01', '0.00', 'positive')],
    evenements_commerciaux: [
      { date: '2026-04-30', barreau: 4, intitule: 'Contrat ferme', source: SOURCE },
      { date: '2026-08-01', barreau: 5, intitule: 'Premières livraisons', source: SOURCE },
    ],
  };
  const r = brut(M.moteurDepuisFichier({ archetype: 'pre-revenus' }, fichier));
  assert.deepEqual(r.map((x) => x.date), ['2026-02-01', '2026-05-01', '2026-08-01'], 'ordre chronologique');
  assert.deepEqual(r[0].alertes, [], 'barreau nul avant le premier événement, et marge brute négative');
  assert.deepEqual(r[1].alertes, ['bascule-commerciale'], 'barreau 4 au 30 avril ≤ 1er mai, marge brute positive');
  assert.deepEqual(r[2].alertes, [], 'une seule Bascule commerciale (l’événement du jour même comptait déjà)');
});

test('soldeDe : le solde d’une publication du schéma, « non publié » ne comptant pas', () => {
  assert.equal(M.soldeDe(pub('2026-02-01', '+-.0', 'positive')), 0, '+1 −1 n.p. 0 → 0');
  assert.equal(M.soldeDe(pub('2026-02-01', '++.+', 'positive')), 3);
  assert.equal(M.soldeDe(pub('2026-02-01', '....', 'positive')), 0, 'toutes non publiées : somme vide, 0');
  assert.equal(M.soldeDe(null), null);
  assert.equal(M.soldeDe({ dimensions: { d1: { sens: 'hausse' } } }), null, 'dimensions incomplètes');
});

test('le moteur est déclaré présent, implémenté le 21 novembre 2026', () => {
  assert.equal(M.TRACKER_MOTEUR.present, true);
  assert.equal(M.TRACKER_MOTEUR.implemente, '2026-11-21');
  assert.ok(String(M.TRACKER_MOTEUR.etat).includes('§6'), 'l’état nomme la règle qui fait foi');
});
