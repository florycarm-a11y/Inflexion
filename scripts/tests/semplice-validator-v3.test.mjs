/**
 * Tests — extensions v3 du validateur : moyenne intra-dimension pondérée + règle IA-C.
 * Execution : node --test scripts/tests/semplice-validator-v3.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { weightedQuanti, checkIaCyberCoherence } from '../semplice-validator.mjs';

test('quanti pondéré : défaut w=2 partout ≡ moyenne simple', () => {
  const inds = [{ palier: 3 }, { palier: 5 }];
  assert.strictEqual(weightedQuanti(inds), 4);
});

test('quanti pondéré : critique w=3, mineur w=1', () => {
  // (3*7 + 1*1) / 4 = 5.5
  const inds = [{ palier: 7, weight: 3 }, { palier: 1, weight: 1 }];
  assert.strictEqual(weightedQuanti(inds), 5.5);
});

test('règle IA-C : IA<=2 et C>4 → warning', () => {
  assert.strictEqual(checkIaCyberCoherence(1.8, 5.2).ok, false);
  assert.strictEqual(checkIaCyberCoherence(1.8, 3.0).ok, true);
  assert.strictEqual(checkIaCyberCoherence(4.0, 6.0).ok, true); // ne s'applique que si IA<=2
});
