/**
 * instrument-pour.js — choisit l'image « instrument » d'une carte du flux.
 * Chargé par une balise <script> classique : instrumentPour est exposée comme globale.
 * Globales var pour rester chargeable dans node:vm (voir test/instrument-pour.test.mjs).
 * Même article → même image : hachage FNV-1a de son URL, modulo le nombre de variantes.
 */
var INSTRUMENT_RUBRIQUES = ['geopolitique', 'marches', 'crypto', 'matieres', 'iatech'];
var INSTRUMENT_VARIANTES = 6;

function hachageFnv1a(texte) {
  var h = 0x811c9dc5;
  for (var i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function instrumentPour(article) {
  var cat = article && INSTRUMENT_RUBRIQUES.indexOf(article.cat) >= 0 ? article.cat : 'marches';
  var href = article && typeof article.href === 'string' && article.href !== '#' ? article.href : '';
  var n = href ? (hachageFnv1a(href) % INSTRUMENT_VARIANTES) + 1 : 1;
  return 'assets/img/instrument/' + cat + '-' + n + '.webp';
}
