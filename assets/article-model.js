/* Logique pure des pages d'analyse. Aucun import React : ce module doit
   pouvoir tourner sous node --test comme dans le navigateur. */

/** Lit une probabilité de scénario. Une fourchette renvoie son milieu arrondi. */
export function parseProbability (str) {
  if (typeof str !== 'string') return null
  const nombres = str.replace(/ /g, ' ').match(/\d+(?:[.,]\d+)?/g)
  if (!nombres || nombres.length === 0) return null
  const valeurs = nombres.map(n => parseFloat(n.replace(',', '.')))
  const somme = valeurs.reduce((a, b) => a + b, 0)
  return Math.round(somme / valeurs.length)
}

/** Les n dimensions au risque le plus élevé, triées décroissant. Ne mute pas l'entrée. */
export function topDimensions (dimensions, n = 3) {
  if (!Array.isArray(dimensions)) return []
  return [...dimensions].sort((a, b) => b.risque - a.risque).slice(0, n)
}

/** Largeur minimale d'un bloc scénario, en % — en deçà le libellé devient illisible. */
const LARGEUR_MIN = 12

/** Convertit les probabilités en largeurs sommant à 100, sans bloc illisible. */
export function scenarioWidths (scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return []
  const total = scenarios.reduce((s, x) => s + (x.proba || 0), 0)
  if (total <= 0) {
    const part = 100 / scenarios.length
    return scenarios.map(s => ({ ...s, width: part }))
  }
  const brutes = scenarios.map(s => ({ ...s, width: ((s.proba || 0) / total) * 100 }))

  const sous = brutes.filter(b => b.width < LARGEUR_MIN)
  if (sous.length === 0) return brutes
  const deficit = sous.reduce((s, b) => s + (LARGEUR_MIN - b.width), 0)
  const donneurs = brutes.filter(b => b.width >= LARGEUR_MIN)
  const masseDonneurs = donneurs.reduce((s, b) => s + b.width, 0)
  return brutes.map(b =>
    b.width < LARGEUR_MIN
      ? { ...b, width: LARGEUR_MIN }
      : { ...b, width: b.width - deficit * (b.width / masseDonneurs) }
  )
}
