import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    checkBriefing, checkFreshness, checkConsistency, checkLabels, checkStructure, collectText,
} from '../scripts/check-briefing.mjs';

const NOW = new Date('2026-11-09T18:00:00Z');

const base = () => ({
    date: '2026-11-09',
    generated_at: '2026-11-09T07:00:00Z',
    signal_du_jour: 'Le <strong>Fear & Greed à 29/100</strong> (Alternative.me).',
    synthese: { titre: 'Repli', sous_titre: 'Fear & Greed à 29/100', contenu: '<p>Treasury 10Y à 4,10 % (FRED).</p>' },
    sources_citees: [{ nom: 'FRED' }, { nom: 'Finnhub' }, { nom: 'Alternative.me' }],
});

test('fraîcheur : un briefing du jour passe, un briefing de 62 jours échoue', () => {
    assert.equal(checkFreshness(base(), NOW, 36).status, 'ok');
    const vieux = { ...base(), generated_at: '2026-09-07T18:12:50Z' };
    const r = checkFreshness(vieux, NOW, 36);
    assert.equal(r.status, 'fail');
    assert.match(r.message, /62 jours/);
});

test('fraîcheur : absence de date = échec', () => {
    assert.equal(checkFreshness({}, NOW, 36).status, 'fail');
});

test('structure : moins de 3 sources = échec', () => {
    assert.equal(checkStructure(base()).status, 'ok');
    assert.equal(checkStructure({ ...base(), sources_citees: [{ nom: 'FRED' }] }).status, 'fail');
});

test('cohérence : 71 dans le signal et 73 dans le sous-titre est détecté', () => {
    const txt = 'Fear & Greed à 71/100 (Greed). … Fear & Greed à 73/100 et dollar en hausse';
    const r = checkConsistency(txt);
    assert.equal(r.status, 'fail');
    assert.match(r.message, /71 vs 73/);
});

test('cohérence : un seuil cité n’est pas une contradiction', () => {
    const txt = 'Fear & Greed à 71/100. Surveiller le Fear & Greed Index crypto (seuil 75 comme zone de surchauffe).';
    assert.equal(checkConsistency(txt).status, 'ok');
});

test('cohérence : EUR/USD BCE vs Alpha Vantage dans la tolérance', () => {
    const txt = 'EUR/USD à 1,1628 (fixing BCE) … l’EUR/USD se maintient à 1,1655 (Alpha Vantage)';
    assert.equal(checkConsistency(txt).status, 'ok');
});

test('libellés : « DXY 118,75 » échoue, « indice dollar large » passe', () => {
    assert.equal(checkLabels('Le dollar repart (DXY 118,75)').status, 'fail');
    assert.equal(checkLabels('dollar index (DXY) repart à la hausse à 118,75').status, 'fail');
    assert.equal(checkLabels('indice dollar large à 118,75 (FRED)').status, 'ok');
    assert.equal(checkLabels('le DXY est un indice ICE').status, 'warn');
});

test('collectText ignore la liste des sources', () => {
    const t = collectText({ a: 'x', sources_citees: [{ donnees_utilisees: 'DXY' }] });
    assert.ok(!t.includes('DXY'));
});

test('briefing sain du jour : publiable ; traçabilité ignorée sans données', () => {
    const r = checkBriefing(base(), { now: NOW });
    assert.equal(r.ok, true);
    assert.equal(r.checks.find(c => c.id === 'tracabilite').status, 'skip');
});

test('briefing périmé : non publiable et traçabilité non tentée', () => {
    const r = checkBriefing({ ...base(), generated_at: '2026-09-07T18:12:50Z' }, { now: NOW, sources: {} });
    assert.equal(r.ok, false);
    assert.match(r.checks.find(c => c.id === 'tracabilite').message, /périmé/);
});
