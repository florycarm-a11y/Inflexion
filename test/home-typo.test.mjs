// Garde-fous du prompt 3 de l'audit Starlink (docs/superpowers/specs/2026-11-15-typo-couleurs-design.md, §3).
// Aucune dépendance : lit les fichiers du dépôt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const RACINE = new URL('../', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, RACINE), 'utf8');

// Les sept beiges remplacés par --chrome-text-1/2/3. #E8A996 (kicker de la newsletter) est hors du prompt 3.
const BEIGES = ['#F5EDE6', '#F3E9DD', '#E8D9C8', '#C6A996', '#D8B9AE', '#D6B896', '#A88A72'];
const LIEN_FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wght@800&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;600&display=swap';
const PRECONNECT = ['<link rel="preconnect" href="https://fonts.googleapis.com">', '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'];

test('index.html : aucune taille sous 12 px, aucun beige codé en dur sur le chrome', () => {
  const html = lire('index.html');
  const petites = html.match(/text-\[1[01]px\]/g) || [];
  assert.equal(petites.length, 0, `tailles sous 12 px encore présentes : ${petites.join(', ')} (utiliser text-xs)`);
  assert.ok(!/\.kicker\{[^}]*font-size:1[01]px/.test(html), '.kicker est encore sous 12 px');
  for (const hex of BEIGES) {
    assert.ok(!new RegExp(hex, 'i').test(html), `${hex} encore codé en dur : utiliser --chrome-text-1/2/3`);
  }
});

test('design-tokens-v2.css : les trois jetons de texte clair dans les deux régimes', () => {
  const css = lire('assets/design-tokens-v2.css');
  for (const regime of ['instrument', 'editorial']) {
    const bloc = css.match(new RegExp(`\\[data-design-regime="${regime}"\\]\\s*\\{([^}]*)\\}`));
    assert.ok(bloc, `régime ${regime} introuvable`);
    assert.match(bloc[1], /--chrome-text-1:\s*#F5EDE6;/, `${regime} : --chrome-text-1 manque`);
    assert.match(bloc[1], /--chrome-text-2:\s*rgba\(245,\s*237,\s*230,\s*\.70\);/, `${regime} : --chrome-text-2 manque`);
    assert.match(bloc[1], /--chrome-text-3:\s*rgba\(245,\s*237,\s*230,\s*\.55\);/, `${regime} : --chrome-text-3 manque`);
  }
});

test('index.html : cinq graisses Google Fonts, deux preconnect avant le lien, aucune classe de graisse non chargée', () => {
  const html = lire('index.html');
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)[1];
  const iLien = head.indexOf(LIEN_FONTS);
  assert.ok(iLien > -1, 'le lien Google Fonts ne demande pas exactement Archivo 800, Plex Sans 400/600, Plex Mono 400/600');
  for (const p of PRECONNECT) {
    const i = head.indexOf(p);
    assert.ok(i > -1 && i < iLien, `${p} manque ou n'est pas avant le lien Google Fonts`);
  }
  // Graisses chargées : 400 (héritée du body, aucune classe), 600 (font-semibold), 800 (font-extrabold).
  const classes = new Set(html.match(/\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g));
  assert.deepEqual([...classes].sort(), ['font-extrabold', 'font-semibold'], 'classe de graisse non chargée (font-medium, font-bold…)');
  for (const [, poids] of html.matchAll(/font-weight:\s*(\d+)/g)) {
    assert.ok(['400', '600', '800'].includes(poids), `font-weight:${poids} dans le <style> : graisse non chargée`);
  }
});
