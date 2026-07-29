/* Logique pure des pages d'analyse. Aucun import React : ce module doit
   pouvoir tourner sous node --test comme dans le navigateur. */

// Ancre sur le signe % : sans lui, une virgule de phrase ("Scenario 2 -")
// ou une annee ("en 2026") se melerait au calcul de la moyenne.
const PROBABILITE = /(\d+(?:[.,]\d+)?)\s*(?:[-–]\s*(\d+(?:[.,]\d+)?)\s*)?%/

/** Lit une probabilite de scenario. Une fourchette renvoie son milieu arrondi.
 * Ancree sur le signe % et bornee a [0, 100] : sinon null. */
export function parseProbability (str) {
  if (typeof str !== 'string') return null
  const trouve = str.match(PROBABILITE)
  if (!trouve) return null
  const valeurs = [trouve[1], trouve[2]]
    .filter(v => v !== undefined)
    .map(n => parseFloat(n.replace(',', '.')))
  const somme = valeurs.reduce((a, b) => a + b, 0)
  const arrondi = Math.round(somme / valeurs.length)
  return (arrondi >= 0 && arrondi <= 100) ? arrondi : null
}

/** Les n dimensions au risque le plus eleve, triees decroissant. Ne mute pas l'entree.
 * n negatif renvoie [] ; une dimension sans risque se classe en dernier. */
export function topDimensions (dimensions, n = 3) {
  if (!Array.isArray(dimensions)) return []
  return [...dimensions]
    .sort((a, b) => (b.risque ?? -Infinity) - (a.risque ?? -Infinity))
    .slice(0, Math.max(0, n))
}

/** Largeur minimale d'un bloc scenario, en % - en deca le libelle devient illisible. */
const LARGEUR_MIN = 12

/** Convertit les probabilites en largeurs sommant a 100, sans bloc illisible. */
export function scenarioWidths (scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return []
  const total = scenarios.reduce((s, x) => s + (x.proba || 0), 0)
  if (total <= 0) {
    const part = 100 / scenarios.length
    return scenarios.map(s => ({ ...s, width: part }))
  }
  const largeurs = scenarios.map(s => ((s.proba || 0) / total) * 100)
  // Verrouiller les blocs sous le seuil peut faire passer un donneur sous le
  // seuil a son tour (cas a 3+ scenarios desequilibres) : on itere jusqu'a ce
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

  // Le point fixe ci-dessus verrouille tout bloc sous le seuil a EXACTEMENT
  // LARGEUR_MIN : deux scenarios de probabilite differente qui tombent tous
  // deux sous le seuil se retrouvent a egalite, ce qui inverserait l'ordre
  // visuel qu'ils sont censes representer. On brise l'egalite au minimum,
  // en preservant l'ordre des probabilites, et on preleve l'ajustement sur
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
