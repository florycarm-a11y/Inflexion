// test/instrument-pour.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const src = readFileSync(new URL('../instrument-pour.js', import.meta.url), 'utf8')
const { instrumentPour, hachageFnv1a } = vm.runInNewContext(src + ';({ instrumentPour, hachageFnv1a })', {})

test('même URL, même variante', () => {
  const a = { cat: 'crypto', href: 'https://exemple.test/a' }
  assert.equal(instrumentPour(a), instrumentPour({ ...a }))
})

test('cinq URL se répartissent sur au moins trois variantes', () => {
  const urls = ['https://a.test/1', 'https://b.test/2', 'https://c.test/3', 'https://d.test/4', 'https://e.test/5']
  const variantes = new Set(urls.map((href) => instrumentPour({ cat: 'marches', href })))
  assert.ok(variantes.size >= 3, `seulement ${variantes.size} variante(s)`)
})

test('URL vide ou « # » donne la variante 1 sans erreur', () => {
  assert.equal(instrumentPour({ cat: 'geopolitique', href: '' }), 'assets/img/instrument/geopolitique-1.webp')
  assert.equal(instrumentPour({ cat: 'geopolitique', href: '#' }), 'assets/img/instrument/geopolitique-1.webp')
  assert.equal(instrumentPour({ cat: 'geopolitique' }), 'assets/img/instrument/geopolitique-1.webp')
})

test('rubrique inconnue retombe sur marches', () => {
  assert.match(instrumentPour({ cat: 'inconnue', href: 'https://x.test' }), /^assets\/img\/instrument\/marches-[1-6]\.webp$/)
})

test('le chemin est toujours bien formé', () => {
  for (const cat of ['geopolitique', 'marches', 'crypto', 'matieres', 'iatech']) {
    assert.match(instrumentPour({ cat, href: 'https://x.test/' + cat }), new RegExp(`^assets/img/instrument/${cat}-[1-6]\\.webp$`))
  }
})

test('hachageFnv1a est stable et sur 32 bits', () => {
  assert.equal(hachageFnv1a(''), 0x811c9dc5)
  assert.equal(hachageFnv1a('a'), 0xe40c292c)
  assert.ok(hachageFnv1a('inflexion') <= 0xffffffff)
})
