// test/studio-rendre.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const script = new URL('../studio/outils/rendre.mjs', import.meta.url).pathname
const lancer = (...args) => spawnSync('node', [script, ...args], { encoding: 'utf8', env: { ...process.env, CHROME: '/chemin/inexistant', HOME: '/chemin/inexistant' } })

test('sans argument : usage et code 1', () => {
  const r = lancer()
  assert.equal(r.status, 1)
  assert.match(r.stderr, /Usage/)
})

test('refuse un dossier de rendu existant', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rendu-'))
  const taches = join(dir, 'taches.json')
  writeFileSync(taches, '[]')
  const r = lancer(taches, dir)
  assert.equal(r.status, 1)
  assert.match(r.stderr, /existe déjà/)
})

test('signale Chrome introuvable avant toute écriture', () => {
  const base = mkdtempSync(join(tmpdir(), 'rendu-'))
  const taches = join(base, 'taches.json')
  writeFileSync(taches, JSON.stringify([{ scene: 'instrument.html', params: { rubrique: 'crypto', variante: 1 }, sortie: 'x.webp' }]))
  const r = lancer(taches, join(base, 'sortie'))
  assert.equal(r.status, 1)
  assert.match(r.stderr, /Chrome introuvable/)
})
