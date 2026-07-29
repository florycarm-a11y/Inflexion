/* Sort les mentions "(source : X, Y)" du corps des articles pour les
   rattacher a la marge laterale. L'espace avant les deux-points peut prendre
   deux formes :
   - un vrai espace insecable (U+00A0), comme le veut la typographie francaise ;
   - ou, dans les fichiers analyse-*.html, la sequence echappee litterale a six
     caracteres (backslash, u, 0, 0, a, 0) telle qu'elle apparait dans le texte
     source des chaines JS avant evaluation.
   Les deux formes doivent etre reconnues comme un meme separateur. */

const SEPARATEUR = '(?:\\\\u00a0|\\s)'
const MENTION = new RegExp(
  `\\s*\\((?:source|sources)${SEPARATEUR}*:${SEPARATEUR}*([^)]+)\\)`,
  'gi'
)

/**
 * @param {string} texte
 * @returns {{text: string, sources: string[]}} texte nettoye + sources dedoublonnees
 */
export function extractSources (texte) {
  if (typeof texte !== 'string') return { text: '', sources: [] }
  const trouvees = []
  const nettoye = texte.replace(MENTION, (_, liste) => {
    liste
      .replace(/ /g, ' ')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(s => { if (!trouvees.includes(s)) trouvees.push(s) })
    return ''
  })
  return { text: nettoye, sources: trouvees }
}
