import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractSources } from '../scripts/extract-sources.mjs'

test('extractSources sort une mention simple et nettoie le texte', () => {
  const r = extractSources('Les gains russes sont marginaux (source : ISW, RUSI).')
  assert.deepEqual(r.sources, ['ISW', 'RUSI'])
  assert.equal(r.text, 'Les gains russes sont marginaux.')
})

test('extractSources tolère l\'espace insécable avant les deux-points', () => {
  const r = extractSources('Texte (source : Mandiant, Google TAG).')
  assert.deepEqual(r.sources, ['Mandiant', 'Google TAG'])
  assert.equal(r.text, 'Texte.')
})

test('extractSources gère plusieurs mentions dans un même paragraphe', () => {
  const r = extractSources('Un fait (source : A). Un autre (source : B, C).')
  assert.deepEqual(r.sources, ['A', 'B', 'C'])
  assert.equal(r.text, 'Un fait. Un autre.')
})

test('extractSources dédoublonne en conservant l\'ordre', () => {
  const r = extractSources('X (source : A, B). Y (source : B, A).')
  assert.deepEqual(r.sources, ['A', 'B'])
})

test('extractSources laisse intact un texte sans mention', () => {
  const r = extractSources('Aucune source ici.')
  assert.deepEqual(r.sources, [])
  assert.equal(r.text, 'Aucune source ici.')
})

test('extractSources gère la forme échappée telle qu\'elle apparaît dans les fichiers source', () => {
  // '\\u00a0' en source JS = les 6 caractères \ u 0 0 a 0, pas un NBSP
  const r = extractSources('Les gains russes (source\\u00a0: ISW, RUSI).')
  assert.deepEqual(r.sources, ['ISW', 'RUSI'])
  assert.equal(r.text, 'Les gains russes.')
})
