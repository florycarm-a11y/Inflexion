// Garde-fous du Tailwind compilé (docs/superpowers/specs/2026-11-15-tailwind-compile-design.md, §5.3).
// Aucune dépendance : lit les fichiers du dépôt, ne reconstruit pas le CSS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const RACINE = new URL('../', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, RACINE), 'utf8');
const PAGES = readdirSync(RACINE).filter((f) => f.endsWith('.html')).sort();
const SANS_TAILWIND = new Set(['og-image.html']); // n'a jamais chargé le CDN
const LIEN = '<link rel="stylesheet" href="assets/site.css">';
const CHEMIN_SITE = new URL('assets/site.css', RACINE);

test('les pages ne chargent plus le Play CDN et ne portent plus de tailwind.config inline', () => {
  for (const page of PAGES) {
    const html = lire(page);
    assert.ok(!html.includes('cdn.tailwindcss.com'), `${page} charge encore cdn.tailwindcss.com`);
    assert.ok(!/\btailwind\.config\b/.test(html), `${page} porte encore un tailwind.config inline`);
  }
});

test('chaque page charge assets/site.css une fois, en dernier élément du <head>', () => {
  for (const page of PAGES) {
    if (SANS_TAILWIND.has(page)) continue;
    const html = lire(page);
    assert.equal(html.split(LIEN).length - 1, 1, `${page} : ${LIEN} doit apparaître exactement une fois`);
    const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    assert.ok(head, `${page} : <head> introuvable`);
    const contenu = head[1].replace(/<!--[\s\S]*?-->/g, '').trim();
    // Le CDN injectait sa feuille en dernier enfant du <head> : le <link> doit occuper la même place,
    // sinon l'ordre de cascade avec styles.css et les <style> des pages change.
    assert.ok(contenu.endsWith(LIEN), `${page} : ${LIEN} doit être le dernier élément du <head>`);
  }
});

test('assets/site.css existe et contient chaque classe à valeur arbitraire employée', () => {
  assert.ok(existsSync(CHEMIN_SITE), 'assets/site.css manque : lancer npm run build:css');
  const site = readFileSync(CHEMIN_SITE, 'utf8');
  assert.ok(site.length > 5000, 'assets/site.css est anormalement petit');
  // Mêmes sources que le content de tailwind.config.js (HTML racine, JS racine, assets/*.js),
  // moins og-image.html, qui ne charge pas site.css : le test est au plus aussi strict que le scanner.
  const sources = [
    ...PAGES.filter((p) => !SANS_TAILWIND.has(p)),
    ...readdirSync(RACINE).filter((f) => f.endsWith('.js')),
    ...readdirSync(new URL('assets/', RACINE)).filter((f) => f.endsWith('.js')).map((f) => `assets/${f}`),
  ];
  // Candidats : utilitaire-[valeur], avec variantes (hover:, md:…) et signe négatif éventuel.
  // Limites connues (aucune de ces formes n'existe dans les sources au 2026-11-15) : un modificateur
  // d'opacité après le crochet (`border-[#DC2626]/30`) n'est vérifié que par son radical ; les variantes
  // arbitraires (`[&>*]:`, `min-[…]:`), le préfixe `!` et les propriétés arbitraires `[prop:val]` sont ignorés.
  const CANDIDAT = /(?<![\w\-\[.#/\\])((?:[a-z][a-z0-9-]*:)*-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*-\[[^\]\s"'`]+\])/g;
  // Échappement CSS tel que Tailwind l'écrit : tout ce qui n'est pas [a-zA-Z0-9_-] est précédé d'un antislash,
  // sauf la virgule, écrite `\2c ` (escapeCommas de Tailwind 3, contournement d'un bug navigateur) :
  // `bg-[rgba(94,74,58,.08)]` devient `.bg-\[rgba\(94\2c 74\2c 58\2c \.08\)\]`.
  const echapper = (c) => c.replace(/[^a-zA-Z0-9_-]/g, (ch) => (ch === ',' ? '\\2c ' : `\\${ch}`));
  const manquants = new Map();
  let total = 0;
  for (const source of sources) {
    const texte = lire(source);
    for (const [, candidat] of texte.matchAll(CANDIDAT)) {
      total++;
      if (!site.includes(`.${echapper(candidat)}`)) manquants.set(candidat, source);
    }
  }
  assert.ok(total > 100, `seulement ${total} candidats trouvés : la détection est cassée`);
  const detail = [...manquants].map(([c, s]) => `  ${c}  (${s})`).join('\n');
  assert.equal(manquants.size, 0, `classes absentes de assets/site.css — relancer npm run build:css ou corriger content dans tailwind.config.js :\n${detail}`);
});
