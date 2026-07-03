/**
 * Tests unitaires — semplice-composite.js (moteur de calcul SEMPLICE)
 * Execution :  node --test scripts/tests/semplice-composite.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zero dependance)
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../../semplice-composite.js');

test('les 3 jeux de poids somment à 1.0', () => {
  for (const name of ['WEIGHTS_RISK_V21', 'WEIGHTS_RISK_V3', 'WEIGHTS_OPP']) {
    const sum = Object.values(C[name]).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 1e-9, `${name} somme à ${sum}`);
  }
});

test('poids v3 : I=0.13, L=0.09', () => {
  assert.strictEqual(C.WEIGHTS_RISK_V3.I, 0.13);
  assert.strictEqual(C.WEIGHTS_RISK_V3.L, 0.09);
});

test('composite base = moyenne pondérée (Ormuz v2.1)', () => {
  // scores ordre [S,E,M,P,L,I,C,Ee]
  const r = C.computeComposite([4.4, 5.7, 6.2, 6.7, 6.9, 6.9, 6.5, 5.2], C.WEIGHTS_RISK_V21, C.DIM_KEYS);
  assert.strictEqual(C.round1(r.base), 6.1);
});

test('profil uniforme : amplified === base (Singapour)', () => {
  const r = C.computeComposite([2.2, 1.4, 2.7, 1.9, 1.2, 3.2, 2.1, 2.9], C.WEIGHTS_RISK_V21, C.DIM_KEYS);
  assert.ok(Math.abs(r.amplified - r.base) < 1e-9);
});

test('pic isolé : amplification bornée à +0.3', () => {
  const r = C.computeComposite([2, 2, 2, 2, 2, 2, 2, 7], C.WEIGHTS_RISK_V21, C.DIM_KEYS);
  assert.ok(r.amplified > r.base, 'le pic doit amplifier');
  assert.ok(r.amplified - r.base <= 0.3 + 1e-9, 'plafond +0.3');
});

test('libellés risque et opportunité aux bornes', () => {
  assert.strictEqual(C.levelRisk(2.0), 'Faible');
  assert.strictEqual(C.levelRisk(2.1), 'Modéré-Faible');
  assert.strictEqual(C.levelRisk(6.1), 'Critique');
  assert.strictEqual(C.levelOpp(5.0), 'Significatif');
  assert.strictEqual(C.levelOpp(5.1), 'Élevé');
  assert.strictEqual(C.levelOpp(6.1), 'Exemplaire');
});
