// Collecte de la couche « lecture de marché » (scripts/marche/).
// Les lecteurs de sources sont vérifiés sur des réponses RÉELLES capturées le 25 novembre 2026
// pour Rocket Lab (test/fixtures/marche/) : FINRA, SEC, Nasdaq. Aucun appel réseau dans les tests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  lireFinra, lireSecChiffreAffaires, lireSecActions, lireNasdaqObjectifs, lireNasdaqPrevisions,
  lireNasdaqCapitalisation, lireNasdaqCours, MODULES,
} from '../scripts/marche/sources.mjs';
import { collecterSociete, appliquerSaisieManuelle } from '../scripts/marche/collecte.mjs';

const fixture = (nom) => JSON.parse(readFileSync(new URL('./fixtures/marche/' + nom, import.meta.url), 'utf8'));
const AUJ = '2026-11-25';
const sourcee = (d) => d.valeur !== null && typeof d.source.nom === 'string' && d.source.url.startsWith('https://') && /^\d{4}-\d{2}-\d{2}$/.test(d.date);

// ── FINRA ─────────────────────────────────────────────────────────────────────

test('FINRA : dernier relevé, relevé précédent lu sur sa propre ligne, jours de couverture', () => {
  const r = lireFinra(fixture('finra-rklb.json'));
  assert.deepEqual([r.position_courte.valeur, r.position_courte.date], [45460649, '2026-11-13']);
  assert.deepEqual([r.position_precedente.valeur, r.position_precedente.date], [46410138, '2026-10-30']);
  assert.deepEqual([r.jours_couverture.valeur, r.jours_couverture.date], [2.09, '2026-11-13']);
  assert.ok(Object.values(r).every(sourcee));
});

test('FINRA : aucun relevé → tout n/d ; un seul relevé → pas de tendance inventée', () => {
  for (const vide of [[], null, undefined, { erreur: true }]) {
    assert.ok(Object.values(lireFinra(vide)).every((d) => d.valeur === null && d.motif));
  }
  const seul = lireFinra(fixture('finra-rklb.json').slice(0, 1));
  assert.ok(seul.position_courte.valeur > 0);
  assert.equal(seul.position_precedente.valeur, null);
});

// ── SEC ───────────────────────────────────────────────────────────────────────

test('SEC : chiffre d’affaires 12 mois = exercice + cumul − cumul précédent, les trois montants gardés', () => {
  const r = lireSecChiffreAffaires(fixture('sec-rklb-chiffre-affaires.json'), 'https://data.sec.gov/x');
  assert.deepEqual(r.detail, { exercice: 601799000, cumul: 702248000, cumul_precedent: 422147000 });
  assert.equal(r.valeur, 601799000 + 702248000 - 422147000);
  assert.equal(r.date, '2026-09-30');
  assert.ok(sourcee(r));
});

test('SEC : s’il manque un des trois montants, le chiffre d’affaires est n/d — rien n’est extrapolé', () => {
  const json = fixture('sec-rklb-chiffre-affaires.json');
  const sansExercice = { units: { USD: json.units.USD.filter((f) => !(f.start === '2025-01-01' && f.end === '2025-12-31')) } };
  assert.equal(lireSecChiffreAffaires(sansExercice, 'u').valeur, null);
  const sansComparatif = { units: { USD: json.units.USD.filter((f) => f.end !== '2025-09-30') } };
  assert.equal(lireSecChiffreAffaires(sansComparatif, 'u').valeur, null);
  assert.equal(lireSecChiffreAffaires({}, 'u').valeur, null);
});

test('SEC : un dernier fait couvrant l’exercice entier est pris tel quel', () => {
  const r = lireSecChiffreAffaires({ units: { USD: [{ start: '2025-01-01', end: '2025-12-31', val: 601799000, filed: '2026-02-26' }] } }, 'u');
  assert.equal(r.valeur, 601799000);
  assert.equal(r.detail, undefined);
});

test('SEC : actions en circulation, dernier fait de page de garde', () => {
  const r = lireSecActions(fixture('sec-rklb-actions.json'), 'https://data.sec.gov/x');
  assert.deepEqual([r.valeur, r.date], [632020915, '2026-11-04']);
  assert.equal(lireSecActions({ units: { shares: [] } }, 'u').valeur, null);
});

// ── Nasdaq ────────────────────────────────────────────────────────────────────

test('Nasdaq : avis du mois, avis de référence trois mois plus tôt, objectifs de cours', () => {
  const r = lireNasdaqObjectifs(fixture('nasdaq-rklb-targetprice.json'), 'RKLB', 3);
  assert.equal(r.avis.date, '2026-11-01');
  assert.equal(r.avis_reference.date, '2026-08-01');
  assert.deepEqual(r.avis_reference.valeur, { achat: 13, conserver: 4, vente: 0 });
  assert.deepEqual(r.objectifs.valeur, { bas: 40, moyen: 92.33, haut: 132 });
  assert.ok([r.avis, r.avis_reference, r.objectifs].every(sourcee));
});

test('Nasdaq : réponse vide ou « Symbol not exists » (hors États-Unis) → n/d', () => {
  for (const vide of [null, {}, { data: null, status: { rCode: 400 } }]) {
    assert.ok(Object.values(lireNasdaqObjectifs(vide, 'ETL', 3)).every((d) => d.valeur === null && d.motif));
    assert.equal(lireNasdaqPrevisions(vide, 'ETL', AUJ).valeur, null);
    assert.equal(lireNasdaqCapitalisation(vide, 'ETL', AUJ).valeur, null);
    assert.ok(Object.values(lireNasdaqCours(vide, 'ETL', AUJ, 7)).every((d) => d.valeur === null));
  }
});

test('Nasdaq : historique trop court → pas d’avis de référence', () => {
  const json = fixture('nasdaq-rklb-targetprice.json');
  json.data.historicalConsensus = json.data.historicalConsensus.slice(-2);
  const r = lireNasdaqObjectifs(json, 'RKLB', 3);
  assert.ok(r.avis.valeur);
  assert.equal(r.avis_reference.valeur, null);
});

test('Nasdaq : BPA attendu du trimestre, daté du jour de collecte', () => {
  const r = lireNasdaqPrevisions(fixture('nasdaq-rklb-earnings-forecast.json'), 'RKLB', AUJ);
  assert.deepEqual(r.valeur, { exercice: 'Dec 2026', consensus: -0.04, bas: -0.06, haut: -0.02, estimations: 2 });
  assert.equal(r.date, AUJ);
});

test('Nasdaq : capitalisation lue ; « N/A » vaut n/d, jamais zéro', () => {
  assert.equal(lireNasdaqCapitalisation(fixture('nasdaq-rklb-summary.json'), 'RKLB', AUJ).valeur, 28226054064);
  const na = { data: { summaryData: { MarketCap: { value: 'N/A' } } } };
  assert.equal(lireNasdaqCapitalisation(na, 'X', AUJ).valeur, null);
});

test('Nasdaq : cours du jour, d’il y a 6 mois et 12 mois — dernière séance à la date visée ou avant', () => {
  const r = lireNasdaqCours(fixture('nasdaq-rklb-historical.json'), 'RKLB', AUJ, 7);
  assert.deepEqual([r.cours.valeur, r.cours.date], [45.98, '2026-11-24']);
  assert.deepEqual([r.cours_6_mois.valeur, r.cours_6_mois.date], [135.76, '2026-05-22']); // le 25 mai 2026 est férié
  assert.deepEqual([r.cours_12_mois.valeur, r.cours_12_mois.date], [42.6, '2025-11-25']);
});

test('Nasdaq : sans séance dans la tolérance, le cours de référence est n/d (société cotée depuis peu)', () => {
  const json = fixture('nasdaq-rklb-historical.json');
  json.data.tradesTable.rows = json.data.tradesTable.rows.filter((r) => r.date.endsWith('/2026') && r.date.startsWith('11/'));
  const r = lireNasdaqCours(json, 'RKLB', AUJ, 7);
  assert.ok(r.cours.valeur > 0);
  assert.equal(r.cours_6_mois.valeur, null);
  assert.equal(r.cours_12_mois.valeur, null);
});

// ── Orchestration ─────────────────────────────────────────────────────────────

const CTX = { aujourdhui: AUJ, config: { attentes: { moisReference: 3 }, valorisation: { toleranceSeance: 7 } }, agentSec: 'essai' };

test('une source en panne met SES champs à n/d, avec le motif ; les autres modules continuent', async () => {
  const requete = async (url) => {
    if (url.includes('api.nasdaq.com')) throw new Error('HTTP 503');
    if (url.includes('finra')) return fixture('finra-rklb.json');
    if (url.includes('SharesOutstanding')) return fixture('sec-rklb-actions.json');
    return fixture('sec-rklb-chiffre-affaires.json');
  };
  const { collecterSec } = await import('../scripts/marche/sources.mjs');
  const ctx = { ...CTX, requete }; ctx.modulesSec = (s) => collecterSec(s.cik, ctx);
  const r = await collecterSociete({ ticker: 'RKLB', cik: 1819994 }, ctx);
  assert.equal(r.flux.position_courte.valeur, 45460649);
  assert.equal(r.valorisation.ca_12_mois.valeur, 881900000);
  for (const champ of ['avis', 'avis_reference', 'objectifs', 'bpa_trimestre']) {
    assert.equal(r.attentes[champ].valeur, null);
    assert.match(r.attentes[champ].motif, /Nasdaq injoignable : HTTP 503/);
  }
  assert.match(r.valorisation.cours.motif, /Nasdaq injoignable/);
});

test('chaque module rend exactement ses champs, y compris ceux sans source en V1', async () => {
  const ctx = { ...CTX, requete: async () => { throw new Error('coupé'); } };
  ctx.modulesSec = async () => { throw new Error('coupé'); };
  const r = await collecterSociete({ ticker: 'X', cik: 1 }, ctx);
  for (const m of MODULES) assert.deepEqual(Object.keys(r[m.cle]).sort(), [...m.champs].sort());
  assert.match(r.attentes.publie_vs_consensus.motif, /aucune source en V1/);
  assert.ok(Object.values(r).every((bloc) => Object.values(bloc).every((d) => d.valeur === null && d.motif)), 'panne générale : tout n/d, rien à zéro');
});

test('saisie manuelle : comble un champ n/d si elle est sourcée et datée, n’écrase jamais une collecte', () => {
  const blocs = { flux: { position_courte: { valeur: null, motif: 'x' }, jours_couverture: { valeur: 3, source: { nom: 'FINRA', url: 'https://f' }, date: AUJ } } };
  const bonne = { valeur: 1000, source: { nom: 'AMF', url: 'https://amf.test' }, date: '2026-11-20' };
  appliquerSaisieManuelle(blocs, { flux: { position_courte: bonne, jours_couverture: { ...bonne, valeur: 99 }, inconnu: bonne } });
  assert.deepEqual(blocs.flux.position_courte, { ...bonne, saisie: 'manuelle' });
  assert.equal(blocs.flux.jours_couverture.valeur, 3);
  assert.ok(!('inconnu' in blocs.flux));

  const sansSource = { flux: { position_courte: { valeur: null, motif: 'x' } } };
  appliquerSaisieManuelle(sansSource, { flux: { position_courte: { valeur: 1000, date: '2026-11-20' } } });
  assert.equal(sansSource.flux.position_courte.valeur, null, 'une saisie sans source est ignorée');
});
