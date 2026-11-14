// test/studio-rendre.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, chmodSync } from 'node:fs'
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

// Faux Chrome : un script shell exécutable à la place du vrai
const avecFauxChrome = (corps, verifier) => {
  const base = mkdtempSync(join(tmpdir(), 'rendu-faux-'))
  const faux = join(base, 'chrome.sh')
  writeFileSync(faux, `#!/bin/sh\n${corps}\n`)
  chmodSync(faux, 0o755)
  const taches = join(base, 'taches.json')
  writeFileSync(taches, JSON.stringify([{ scene: 'instrument.html', params: { rubrique: 'crypto', variante: 1 }, sortie: 'x.webp' }]))
  const debut = Date.now()
  try {
    const r = spawnSync('node', [script, taches, join(base, 'sortie')], { encoding: 'utf8', env: { ...process.env, CHROME: faux, RENDRE_GARDE_MS: '500' } })
    verifier(r, Date.now() - debut)
  } finally {
    spawnSync('pkill', ['-f', '^sleep 300$'])
  }
}

test('Chrome muet : échoue vite avec « ne répond pas » et ne laisse aucun processus', () => {
  avecFauxChrome('exec sleep 300', (r, duree) => {
    assert.equal(r.status, 1)
    assert.match(r.stderr, /Chrome ne répond pas/)
    assert.ok(duree < 15000, `trop long : ${duree} ms`)
    assert.notEqual(spawnSync('pgrep', ['-f', '^sleep 300$']).status, 0, 'processus orphelin')
  })
})

test('Chrome qui s\'arrête aussitôt : échoue vite avec « s\'est arrêté »', () => {
  avecFauxChrome('exit 0', (r, duree) => {
    assert.equal(r.status, 1)
    assert.match(r.stderr, /Chrome s'est arrêté/)
    assert.ok(duree < 15000, `trop long : ${duree} ms`)
  })
})
