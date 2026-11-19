// Identité v2 sur expertise.html et premium.html : angles droits (CLAUDE.md §3, « Angles : rayon 0 »).
// Seule exception admise : les points (jalons de la frise, pastilles de zone du radar, puces de liste),
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

// Un point : 50 % sur une boîte de largeur égale à sa hauteur, en px.
const estUnPoint = (valeur, declarationsCss) => {
  const largeur = declarationsCss.match(/(?:^|[;{\s])width:\s*(\d+)px/)?.[1];
  const hauteur = declarationsCss.match(/(?:^|[;{\s])height:\s*(\d+)px/)?.[1];
  return valeur === '50%' && Boolean(largeur) && largeur === hauteur;
};

test('expertise.html et semplice-radar.js : aucun rayon hors des cercles de 50 % sur un carré', () => {
  for (const fichier of ['expertise.html', 'semplice-radar.js']) {
    const liste = declarations(lire(fichier));
    assert.ok(liste.length > 0, `${fichier} : aucun point de donnée trouvé, le relevé ne mesure plus rien`);
    for (const { valeur, style } of liste) assert.ok(estUnPoint(valeur, style), `${fichier} : rayon ${valeur} dans « ${style} »`);
  }
});

test('expertise.html et premium.html : aucun rayon en ligne hors des points, aucune classe rounded hors rounded-full', () => {
  for (const page of ['expertise.html', 'premium.html']) {
    const html = lire(page);
    for (const { valeur, style } of declarations(html)) assert.ok(estUnPoint(valeur, style), `${page} : rayon ${valeur} dans « ${style} »`);
    assert.ok(!/class="[^"]*\brounded(?!-full\b)/.test(html), `${page} : classe rounded`);
  }
});

// Classes de styles.css affichées sur ces deux pages et sur aucune autre.
// .premium-cta-btn* sert à expertise.html et premium.html ; les autres classes premium-* et service-card-cta*, à premium.html seule.
const PROPRES = /\.(?:expertise-highlight|expertise-cta|premium-[\w-]+|service-card-cta(?:-outline)?)(?![\w-])/;

test('styles.css : les règles propres à expertise et premium sont sans rayon, hors puces rondes', () => {
  const css = lire('styles.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const regles = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => PROPRES.test(m[1]));
  assert.ok(regles.length >= 20, `seulement ${regles.length} règles propres trouvées : le relevé ne mesure plus rien`);
  for (const [, selecteur, corps] of regles) {
    const rayon = corps.match(/border-radius:\s*([^;]+)/)?.[1].trim();
    if (rayon) assert.ok(estUnPoint(rayon, corps), `${selecteur.trim()} porte un rayon de ${rayon}`);
  }
});
