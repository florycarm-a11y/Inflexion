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

// ---- familles : on évalue le script jusqu'à `const q = new URLSearchParams` avec un faux DOM ----
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
const source = script.slice(0, script.indexOf('const q = new URLSearchParams'))
const fauxDocument = {
  createElementNS: () => ({
    attrs: {}, children: [],
    setAttribute(k, v) { this.attrs[k] = v },
    appendChild(c) { this.children.push(c); return c },
    set textContent(v) { this.attrs.text = v },
  }),
}
const ctx = { document: fauxDocument, window: {}, addEventListener: () => {} }
const { FAMILLES, graine: graineScene, RUBRIQUES } = vm.runInNewContext(
  source + ';({ FAMILLES, graine, RUBRIQUES: window.RUBRIQUES })', ctx)
const compter = (e) => e.children.reduce((t, c) => t + 1 + compter(c), 0)

test('les 30 combinaisons donnent un signal dans la marge et une figure non vide', () => {
  for (const [i, rubrique] of RUBRIQUES.entries()) for (let v = 1; v <= 6; v++) {
    const g = fauxDocument.createElementNS('', 'g')
    const s = FAMILLES[rubrique](graineScene(v * 100 + i), g)
    assert.ok(s.x >= 60 && s.x <= 940 && s.y >= 60 && s.y <= 540, `${rubrique} v${v} : signal hors marge (${s.x}, ${s.y})`)
    const n = compter(g)
    assert.ok(n > 0 && n < 250, `${rubrique} v${v} : ${n} éléments`)
    if (rubrique === 'crypto') assert.ok(g.children[0].children.length >= 1, `crypto v${v} : aucun lien`)
  }
})
