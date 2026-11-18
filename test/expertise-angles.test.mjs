// Identité v2 sur expertise.html : angles droits (CLAUDE.md §3, « Angles : rayon 0 »).
// Seule exception admise : les points de donnée (jalons de la frise, pastilles de zone du radar),
// cercles de 50 % sur un carré, comme le point « À la une » de la home.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), 'utf8');

// Chaque déclaration de rayon, avec le style en ligne (entre guillemets) qui la porte.
const declarations = (texte) => [...texte.matchAll(/border-radius:\s*([^;"'}]+)/g)].map((m) => {
  const debut = Math.max(texte.lastIndexOf('"', m.index), texte.lastIndexOf("'", m.index));
  const fin = Math.min(...['"', "'"].map((q) => texte.indexOf(q, m.index)).filter((i) => i >= 0));
  return { valeur: m[1].trim(), style: texte.slice(debut + 1, fin) };
});

test('expertise.html et semplice-radar.js : aucun rayon hors des cercles de 50 % sur un carré', () => {
  for (const fichier of ['expertise.html', 'semplice-radar.js']) {
    const liste = declarations(lire(fichier));
    assert.ok(liste.length > 0, `${fichier} : aucun point de donnée trouvé, le relevé ne mesure plus rien`);
    for (const { valeur, style } of liste) {
      assert.equal(valeur, '50%', `${fichier} : rayon ${valeur} dans « ${style} »`);
      const largeur = style.match(/(?:^|;)\s*width:\s*(\d+)px/)?.[1];
      const hauteur = style.match(/(?:^|;)\s*height:\s*(\d+)px/)?.[1];
      assert.ok(largeur && largeur === hauteur, `${fichier} : 50 % sur une boîte non carrée « ${style} »`);
    }
  }
});

test('expertise.html : aucune classe Tailwind rounded hors rounded-full', () => {
  assert.ok(!/class="[^"]*\brounded(?!-full\b)/.test(lire('expertise.html')));
});

// .premium-cta-btn* sert aussi à premium.html : la règle vaut pour les deux pages.
test('styles.css : les règles affichées sur expertise (.expertise-highlight, .expertise-cta, .premium-cta-btn*) sont sans rayon', () => {
  const css = lire('styles.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const regles = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => /\.(?:expertise-highlight|expertise-cta|premium-cta-btn(?:-secondary)?)(?![\w-])/.test(m[1]));
  assert.ok(regles.length >= 4, 'règles .expertise-highlight / .expertise-cta / .premium-cta-btn* introuvables');
  for (const [, selecteur, corps] of regles) assert.ok(!/border-radius/.test(corps), `${selecteur.trim()} porte un rayon`);
});
