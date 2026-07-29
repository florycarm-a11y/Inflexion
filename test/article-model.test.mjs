import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseProbability } from '../assets/article-model.js'

test('parseProbability lit une fourchette et renvoie son milieu arrondi', () => {
  assert.equal(parseProbability('Probabilité : 25-30 %'), 28)
  assert.equal(parseProbability('Probabilité : 45-50 %'), 48)
  assert.equal(parseProbability('Probabilité : 15-20 %'), 18)
})

test('parseProbability accepte une valeur simple', () => {
  assert.equal(parseProbability('40 %'), 40)
})

test('parseProbability tolère l\'espace insécable', () => {
  assert.equal(parseProbability('Probabilité : 25-30 %'), 28)
})

test('parseProbability renvoie null si aucun nombre', () => {
  assert.equal(parseProbability('à déterminer'), null)
})
