// test/instrument-graine.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const html = readFileSync(new URL('../studio/scenes/instrument.html', import.meta.url), 'utf8')
const bloc = html.match(/\/\* graine:debut \*\/([\s\S]*?)\/\* graine:fin \*\//)
assert.ok(bloc, 'instrument.html doit contenir le bloc /* graine:debut */ … /* graine:fin */')
const { graine } = vm.runInNewContext(bloc[1] + ';({ graine })', {})

const suite = (n, k = 8) => { const r = graine(n); return Array.from({ length: k }, () => r()) }

test('même graine, même suite', () => {
  assert.deepEqual(suite(3), suite(3))
})

test('graines 1 à 6 donnent six suites distinctes', () => {
  const suites = new Set([1, 2, 3, 4, 5, 6].map((n) => JSON.stringify(suite(n))))
  assert.equal(suites.size, 6)
})

test('les valeurs sont dans [0, 1)', () => {
  for (const v of suite(42, 200)) assert.ok(v >= 0 && v < 1)
})

test('la scène déclare cinq rubriques et six variantes', () => {
  assert.match(html, /window\.RUBRIQUES\s*=\s*\['geopolitique',\s*'marches',\s*'crypto',\s*'matieres',\s*'iatech'\]/)
  assert.match(html, /window\.VARIANTES\s*=\s*6\b/)
})
