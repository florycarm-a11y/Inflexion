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

// En deca de ce seuil le libelle du bloc devient illisible : la largeur
// cesse alors d'etre proportionnelle a la probabilite et sature a
// LARGEUR_MIN. Deux scenarios sous le seuil sont donc legitimement
// egalises (voir le test qui verrouille ce comportement) : on ne peut pas
// representer fidelement 13 % et 2 % quand le plus petit bloc lisible vaut
// 12 %. La probabilite exacte reste lisible dans le libelle du bloc ; seule
// la largeur sature.
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

  return scenarios.map((s, i) => ({ ...s, width: largeurs[i] }))
}
