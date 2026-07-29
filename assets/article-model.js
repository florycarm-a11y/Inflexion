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
