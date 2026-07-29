import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseProbability, topDimensions, scenarioWidths } from '../assets/article-model.js'

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

const DIMENSIONS = [
  { cle: 'S', nom: 'Social', risque: 5.6 },
  { cle: 'E', nom: 'Économique', risque: 5.7 },
  { cle: 'M', nom: 'Militaire', risque: 6.6 },
  { cle: 'P', nom: 'Politique', risque: 5.4 },
  { cle: 'L', nom: 'Légal', risque: 4.7 },
  { cle: 'I', nom: 'Information', risque: 5.8 },
  { cle: 'C', nom: 'Cyber', risque: 6.3 },
  { cle: 'Ee', nom: 'Environnemental', risque: 4.6 },
]

test('topDimensions renvoie les 3 dimensions au risque le plus élevé, décroissant', () => {
  const top = topDimensions(DIMENSIONS)
  assert.deepEqual(top.map(d => d.nom), ['Militaire', 'Cyber', 'Information'])
})

test('topDimensions accepte un cardinal explicite', () => {
  assert.equal(topDimensions(DIMENSIONS, 2).length, 2)
})

test('topDimensions ne modifie pas le tableau reçu', () => {
  const copie = [...DIMENSIONS]
  topDimensions(DIMENSIONS)
  assert.deepEqual(DIMENSIONS, copie)
})

test('topDimensions tolère moins de dimensions que demandé', () => {
  assert.equal(topDimensions(DIMENSIONS.slice(0, 2), 3).length, 2)
})

test('scenarioWidths normalise les probabilités en pourcentages de largeur', () => {
  const out = scenarioWidths([
    { titre: 'Négociation', proba: 28 },
    { titre: 'Attrition', proba: 48 },
    { titre: 'Escalade', proba: 18 },
  ])
  const total = out.reduce((s, x) => s + x.width, 0)
  assert.ok(Math.abs(total - 100) < 0.01, `somme = ${total}`)
  assert.ok(out[1].width > out[0].width)
  assert.ok(out[0].width > out[2].width)
})

test('scenarioWidths préserve les champs d\'origine', () => {
  const out = scenarioWidths([{ titre: 'A', proba: 50, texte: 'lorem' }])
  assert.equal(out[0].titre, 'A')
  assert.equal(out[0].texte, 'lorem')
  assert.equal(out[0].width, 100)
})

test('scenarioWidths impose une largeur minimale lisible', () => {
  const out = scenarioWidths([
    { titre: 'A', proba: 98 },
    { titre: 'B', proba: 2 },
  ])
  assert.ok(out[1].width >= 12, `largeur minimale non respectée : ${out[1].width}`)
})

test('scenarioWidths renvoie [] pour une entrée vide', () => {
  assert.deepEqual(scenarioWidths([]), [])
})
