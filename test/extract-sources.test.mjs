import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractSources } from '../scripts/extract-sources.mjs'

test('extractSources sort une mention simple et nettoie le texte', () => {
  const r = extractSources('Les gains russes sont marginaux (source : ISW, RUSI).')
  assert.deepEqual(r.sources, ['ISW', 'RUSI'])
  assert.equal(r.text, 'Les gains russes sont marginaux.')
  assert.deepEqual(r.ignorees, [])
})

test('extractSources tolère l\'espace insécable avant les deux-points', () => {
  const r = extractSources('Texte (source : Mandiant, Google TAG).')
  assert.deepEqual(r.sources, ['Mandiant', 'Google TAG'])
  assert.equal(r.text, 'Texte.')
  assert.deepEqual(r.ignorees, [])
})

test('extractSources gère plusieurs mentions dans un même paragraphe', () => {
  const r = extractSources('Un fait (source : A). Un autre (source : B, C).')
  assert.deepEqual(r.sources, ['A', 'B', 'C'])
  assert.equal(r.text, 'Un fait. Un autre.')
  assert.deepEqual(r.ignorees, [])
})

test('extractSources dédoublonne en conservant l\'ordre', () => {
  const r = extractSources('X (source : A, B). Y (source : B, A).')
  assert.deepEqual(r.sources, ['A', 'B'])
  assert.deepEqual(r.ignorees, [])
})

test('extractSources laisse intact un texte sans mention', () => {
  const r = extractSources('Aucune source ici.')
  assert.deepEqual(r.sources, [])
  assert.equal(r.text, 'Aucune source ici.')
  assert.deepEqual(r.ignorees, [])
})

test('extractSources gère la forme échappée telle qu\'elle apparaît dans les fichiers source', () => {
  // '\\u00a0' en source JS = les 6 caractères \ u 0 0 a 0, pas un NBSP
  const r = extractSources('Les gains russes (source\\u00a0: ISW, RUSI).')
  assert.deepEqual(r.sources, ['ISW', 'RUSI'])
  assert.equal(r.text, 'Les gains russes.')
  assert.deepEqual(r.ignorees, [])
})

// Fixture copiée telle quelle depuis analyse-arctique-groenland-grand-jeu-polaire.html :
// dans cet article, les sources sont des liens React (hyperscript), pas du texte.
test('extractSources laisse intacte une mention hyperscript au lieu de la corrompre', () => {
  const brut = "la force militaire (source\\u00a0: ',h('a',{href:'https://www.cnbc.com/2026/01/07/why-trump-wants-greenland-and-what-makes-it-so-important-for-security.html',target:'_blank',className:'text-[var(--editorial-accent)] hover:underline'},'CNBC')"
  const r = extractSources(brut)
  assert.equal(r.text, brut, 'le texte doit être rendu inchangé')
  assert.deepEqual(r.sources, [])
  assert.equal(r.ignorees.length, 1, 'la mention doit être signalée comme non traitée')
})
