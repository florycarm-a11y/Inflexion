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

test('600 URL se répartissent sur les six variantes, chacune entre 10 % et 25 %', () => {
  const comptes = new Map()
  for (let i = 0; i < 600; i++) {
    const chemin = instrumentPour({ cat: 'marches', href: 'https://x.test/article-' + i })
    const n = Number(chemin.match(/marches-(\d)\.webp$/)[1])
    assert.ok(n >= 1 && n <= 6, `variante hors de 1..6 : ${chemin}`)
    comptes.set(n, (comptes.get(n) || 0) + 1)
  }
  assert.equal(comptes.size, 6, 'les six variantes doivent apparaître')
  for (const [n, c] of comptes) assert.ok(c >= 60 && c <= 150, `variante ${n} : ${c} sur 600`)
})

test('URL vide ou « # » donne la variante 1 sans erreur', () => {
  assert.equal(instrumentPour({ cat: 'geopolitique', href: '' }), 'assets/img/instrument/geopolitique-1.webp')
  assert.equal(instrumentPour({ cat: 'geopolitique', href: '#' }), 'assets/img/instrument/geopolitique-1.webp')
  assert.equal(instrumentPour({ cat: 'geopolitique' }), 'assets/img/instrument/geopolitique-1.webp')
})

test("article nul ou href non chaîne : pas d'erreur, variante 1", () => {
  assert.equal(instrumentPour(null), 'assets/img/instrument/marches-1.webp')
  assert.equal(instrumentPour({ cat: 'crypto', href: 42 }), 'assets/img/instrument/crypto-1.webp')
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
