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
  const largeurs = scenarios.map(s => ((s.proba || 0) / total) * 100)
  // Verrouiller les blocs sous le seuil peut faire passer un donneur sous le
  // seuil à son tour (cas à 3+ scénarios déséquilibrés) : on itère jusqu'à ce
  // que plus aucun donneur ne bascule.
  const verrouilles = new Array(largeurs.length).fill(false)
  for (let garde = 0; garde < largeurs.length; garde++) {
    const donneurs = []
    let masseDonneurs = 0
    let deficit = 0
    for (let i = 0; i < largeurs.length; i++) {
      if (verrouilles[i]) continue
      if (largeurs[i] < LARGEUR_MIN) {
        deficit += LARGEUR_MIN - largeurs[i]
        largeurs[i] = LARGEUR_MIN
        verrouilles[i] = true
      } else {
        donneurs.push(i)
        masseDonneurs += largeurs[i]
      }
    }
    if (deficit === 0) break
    for (const i of donneurs) largeurs[i] -= deficit * (largeurs[i] / masseDonneurs)
  }

  // Le point fixe ci-dessus verrouille tout bloc sous le seuil à EXACTEMENT
  // LARGEUR_MIN : deux scénarios de probabilité différente qui tombent tous
  // deux sous le seuil se retrouvent à égalité, ce qui inverserait l'ordre
  // visuel qu'ils sont censés représenter. On brise l'égalité au minimum,
  // en préservant l'ordre des probabilités, et on prélève l'ajustement sur
  // le plus grand bloc pour que la somme reste 100.
  const EPSILON = 1e-6
  const verrouillesTries = largeurs
    .map((_, i) => i)
    .filter(i => verrouilles[i])
    .sort((a, b) => (scenarios[a].proba || 0) - (scenarios[b].proba || 0))
  let ajustementTotal = 0
  let rang = 0
  let probaPrecedente = null
  for (const i of verrouillesTries) {
    const proba = scenarios[i].proba || 0
    if (probaPrecedente === null || proba > probaPrecedente) {
      rang++
      probaPrecedente = proba
    }
    const cible = LARGEUR_MIN + (rang - 1) * EPSILON
    ajustementTotal += cible - largeurs[i]
    largeurs[i] = cible
  }
  if (ajustementTotal > 0) {
    const plusGrand = largeurs.reduce((iMax, w, i) => (w > largeurs[iMax] ? i : iMax), 0)
    largeurs[plusGrand] -= ajustementTotal
  }

  return scenarios.map((s, i) => ({ ...s, width: largeurs[i] }))
}
