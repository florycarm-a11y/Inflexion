/* Sort les mentions « (source : X, Y) » du corps des articles pour les
   rattacher à la gouttière. La mention peut employer un espace insécable
   (U+00A0) avant les deux-points, comme le veut la typographie française. */

const MENTION = /\s*\((?:source|sources)\s*[: ]\s*([^)]+)\)/gi

/**
 * @param {string} texte
 * @returns {{text: string, sources: string[]}} texte nettoyé + sources dédoublonnées
 */
export function extractSources (texte) {
  if (typeof texte !== 'string') return { text: '', sources: [] }
  const trouvees = []
  const nettoye = texte.replace(MENTION, (_, liste) => {
    liste
      .replace(/ /g, ' ')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(s => { if (!trouvees.includes(s)) trouvees.push(s) })
    return ''
  })
  return { text: nettoye, sources: trouvees }
}
