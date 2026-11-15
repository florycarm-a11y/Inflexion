// test/gravure-dechirure.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const html = readFileSync(new URL('../studio/scenes/gravure.html', import.meta.url), 'utf8')
const bloc = html.match(/\/\* dechirure:debut \*\/([\s\S]*?)\/\* dechirure:fin \*\//)
assert.ok(bloc, 'gravure.html doit contenir le bloc /* dechirure:debut */ … /* dechirure:fin */')
const { hachage, graine, bordDechire } = vm.runInNewContext(bloc[1] + ';({ hachage, graine, bordDechire })', {})

const polygone = (nom, longueur, cote) => bordDechire(graine(hachage(nom)), longueur, cote)

// coordonnées du bord déchiré, dans l'ordre du tracé (le long du bord)
const coordonnees = (chaine, cote) => {
  const re = cote === 'bas' ? /([\d.]+)px calc\(100% - [\d.]+px\)/g : /calc\(100% - [\d.]+px\) ([\d.]+)px/g
  return [...chaine.matchAll(re)].map((m) => Number(m[1]))
}

for (const cote of ['bas', 'droite']) {
  for (const longueur of [900, 1600]) {
    test(`${cote} ${longueur} : polygone fermé, bord de 0 à longueur`, () => {
      const p = polygone('ukraine-mer-noire.jpg', longueur, cote)
      assert.ok(p.startsWith('polygon(0 0'))
      assert.ok(p.endsWith('0 100%)'))
      const c = coordonnees(p, cote)
      // « bas » est tracé de droite à gauche, « droite » de haut en bas
      const [premier, dernier] = cote === 'bas' ? [c[c.length - 1], c[0]] : [c[0], c[c.length - 1]]
      assert.equal(premier, 0)
      assert.equal(dernier, longueur)
    })

    test(`${cote} ${longueur} : amplitudes entre 4 et 6 px`, () => {
      const p = polygone('ukraine-mer-noire.jpg', longueur, cote)
      const amplitudes = [...p.matchAll(/calc\(100% - ([\d.]+)px\)/g)].map((m) => Number(m[1]))
      assert.ok(amplitudes.length > 10)
      for (const a of amplitudes) assert.ok(a >= 4 && a <= 6, `amplitude ${a}`)
    })
  }
}

test('même source, même polygone', () => {
  assert.equal(polygone('a.jpg', 1600, 'bas'), polygone('a.jpg', 1600, 'bas'))
})

test('sources différentes, polygones différents', () => {
  assert.notEqual(polygone('a.jpg', 1600, 'bas'), polygone('b.jpg', 1600, 'bas'))
})
