/**
 * Tests — semplice-zones-config.js : les composites sont CALCULÉS, plus stockés.
 * Execution : node --test scripts/tests/semplice-zones-config.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CALC = require('../../semplice-composite.js');

// Simule le chargement navigateur : composite.js définit le global, puis zones-config l'utilise.
const src = readFileSync(new URL('../../semplice-zones-config.js', import.meta.url), 'utf8');
const load = new Function('SEMPLICE_CALC', src + '\nreturn SEMPLICE_ZONES;');
const ZONES = load(CALC);

test('18 zones chargées', () => { assert.strictEqual(ZONES.length, 18); });

test('aucun composite stocké en dur dans le source', () => {
  assert.ok(!/composite\s*:\s*\d/.test(src), 'composite:<n> trouvé — doit être calculé');
  assert.ok(!/oppComposite\s*:\s*\d/.test(src), 'oppComposite:<n> trouvé — doit être calculé');
});

test('chaque zone : composite = amplifié arrondi, libellé cohérent, bornes [1,7]', () => {
  for (const z of ZONES) {
    const r = CALC.computeComposite(z.scores, CALC.WEIGHTS_RISK_V21, CALC.DIM_KEYS);
    assert.strictEqual(z.composite, CALC.round1(r.amplified), z.id + ' risque');
    assert.strictEqual(z.level, CALC.levelRisk(z.composite), z.id + ' libellé risque');
    const o = CALC.computeComposite(z.opp, CALC.WEIGHTS_OPP, CALC.OPP_KEYS);
    assert.strictEqual(z.oppComposite, CALC.round1(o.amplified), z.id + ' opp');
    assert.strictEqual(z.oppLevel, CALC.levelOpp(z.oppComposite), z.id + ' libellé opp');
    assert.ok(z.composite >= 1 && z.composite <= 7 && z.oppComposite >= 1 && z.oppComposite <= 7);
  }
});
