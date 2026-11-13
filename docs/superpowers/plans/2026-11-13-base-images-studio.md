# Base d'images Inflexion — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fabriquer en code, dans l'identité v2, une base d'images pour la page d'accueil (3 gravures 16:9 pour les analyses à la une, 30 instruments 5:3 pour le flux) et la brancher dans `index.html` avec un traitement CSS commun des miniatures.

**Architecture:** Un harnais `studio/` isolé (fiche de poste, deux scènes HTML autonomes, script Node qui pilote Chrome sans fenêtre par tuyau local et capture en WebP, planche de contrôle Pillow). Les rendus validés sont copiés dans `assets/img/`. Le site choisit un instrument par hachage stable de l'URL de l'article et applique une classe CSS aux miniatures de sources.

**Tech Stack:** HTML/SVG/CSS sans bibliothèque, Node 22+ (`node:child_process`, protocole DevTools par `--remote-debugging-pipe`), Google Chrome, Python 3 + Pillow (planche), `node --test` pour les tests.

Spec de référence : `docs/superpowers/specs/2026-11-13-base-images-studio-design.md`.

---

## Carte des fichiers

| Fichier | Rôle |
| --- | --- |
| `studio/CLAUDE.md` | Fiche de poste : charte, règles, contrat, relecture, règles apprises |
| `studio/sources/CREDITS.md` | Crédit de chaque image source |
| `studio/sources/<nom>.jpg` | Images choisies à la main (3 pour commencer) |
| `studio/scenes/gravure.html` | Scène gravure bichrome (une source → une image) |
| `studio/scenes/instrument.html` | Scène instrument (rubrique + variante → une image) |
| `studio/outils/rendre.mjs` | Pilote Chrome, capture WebP, énumère les instruments |
| `studio/outils/rendre.sh` | Vérifications, numérotation, appel de `rendre.mjs` puis `planche.py` |
| `studio/outils/planche.py` | Planche de contrôle |
| `studio/rendu/` | Sorties numérotées, ignorées par git |
| `assets/fonts/font-02.woff2`, `font-03.woff2`, `font-07.woff2`, `font-08.woff2` | Archivo 800 et IBM Plex Mono 400 (latin et latin étendu), aujourd'hui non suivis |
| `instrument-pour.js` | `instrumentPour(article)` : choix déterministe de l'instrument |
| `test/instrument-pour.test.mjs`, `test/instrument-graine.test.mjs`, `test/studio-rendre.test.mjs` | Tests |
| `assets/img/une/*.webp`, `assets/img/instrument/*.webp`, `assets/img/CREDITS.md` | Fichiers servis par le site |
| `index.html` | Branchement : chemins des unes, classe `.img-gravure`, repli en cascade |

Conventions du dépôt : tests dans `test/*.test.mjs` avec `node:test` et `node:assert/strict`, lancés par `npm test` (`node --test 'test/**/*.test.mjs'`). Scripts navigateur en globales `var`, chargeables dans `node:vm`. Messages de commit en français, terminés par `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Pas de push sans accord.

---

### Task 1 : Harnais, fiche de poste et polices

**Files:**
- Create: `studio/CLAUDE.md`, `studio/sources/CREDITS.md`, `studio/rendu/.gitkeep`
- Modify: `.gitignore`
- Add to git: `assets/fonts/font-02.woff2`, `assets/fonts/font-03.woff2`, `assets/fonts/font-07.woff2`, `assets/fonts/font-08.woff2`

- [ ] **Step 1 : Créer les dossiers et ignorer `rendu/`**

```bash
mkdir -p studio/sources studio/scenes studio/outils studio/rendu
touch studio/rendu/.gitkeep
printf '\n# Rendus du studio d'"'"'images (seuls les fichiers validés vont dans assets/img)\nstudio/rendu/*\n!studio/rendu/.gitkeep\n' >> .gitignore
```

- [ ] **Step 2 : Écrire la fiche de poste `studio/CLAUDE.md`**

```markdown
# Studio d'images Inflexion : fiche de poste

Vous êtes un graphiste éditorial qui dessine en code. Vous fabriquez des images fixes pour inflexionhub.com :
une page HTML dessine l'image, Chrome sans fenêtre la photographie en WebP. Vous vouvoyez la personne.

## Les formats (ne les changez pas sans qu'on vous le demande)

- `16x9` : 1600 × 900, pour l'analyse à la une du hero.
- `5x3` : 1000 × 600, pour les cartes du flux « Sources & signaux ».
- Sortie : WebP, qualité 82, écrite directement par Chrome.

## La charte (valeurs des jetons assets/design-tokens-v2.css ; ne les multipliez pas)

- Fond espresso `#17100E`. Crème `#EDEBE4`. Texte clair `#F5EDE6` à trois opacités : 100 % (kickers),
  70 % (texte), 55 % (légendes). Rouge aplat `#8E2424`. Rouge texte et signal `#E05A4E`. Brun `#42301E`.
  Rien d'autre.
- Archivo 800 pour tout titre. IBM Plex Mono 400 pour kickers et légendes. Les deux sont chargées depuis
  `../../assets/fonts/` par `@font-face` dans chaque scène, jamais depuis Internet.

## Les règles de composition

1. Un kicker « § RUBRIQUE » en Plex Mono, capitales, espacement 0,18 em, toujours à la même position pour un
   format donné.
2. Un filet rouge `#8E2424` de 40 × 3 px, sous le kicker ou sous la légende, jamais les deux.
3. Marge de sécurité de 6 % de la largeur : rien ne touche les bords, sauf un aplat volontaire.
4. Un seul point rouge `#E05A4E` par image : c'est le signal.
5. Aucun dégradé coloré, aucune ombre portée, aucun flou. Le relief vient du grain et de la bichromie.
   Seule exception : un dégradé d'une couleur de la charte vers la transparence.
6. Aucun texte au-delà du kicker et d'une ligne de légende : le titre est porté par la carte du site.

## Comment une scène est faite

- Une scène = un seul fichier HTML dans `scenes/`, CSS et JavaScript dedans. Aucune bibliothèque, aucune
  ressource distante. Seules ressources locales autorisées : les polices de `assets/fonts/` et, pour la
  gravure, l'image de `sources/`.
- La scène lit ses paramètres dans l'adresse (`?rendu&...`), déclare `window.LARGEUR` et `window.HAUTEUR`,
  et une fonction `window.afficher()` qui dessine et renvoie une promesse résolue quand tout est chargé.
- Tout est déterministe : mêmes paramètres, même image. Le hasard vient d'un générateur à graine
  (mulberry32). Pas de `Math.random()`, pas de `Date.now()`, pas de `transition` ni d'`animation` CSS.
- `instrument.html` déclare aussi `window.RUBRIQUES` et `window.VARIANTES` : c'est elle qui sait ce qu'il
  faut rendre, pas le script.
- Sans `?rendu`, la page s'affiche à l'échelle de la fenêtre avec des contrôles pour itérer à l'œil.

## Rendre et vérifier

- `bash studio/outils/rendre.sh instrument` rend toutes les variantes de toutes les rubriques dans
  `studio/rendu/instrument-vN/`.
- `bash studio/outils/rendre.sh gravure <nom> <format> [focal] [kicker] [legende]` rend une gravure dans
  `studio/rendu/gravure-<nom>-vN/`.
- Un rendu ne s'écrase jamais : chaque appel prend le prochain numéro libre.
- Chaque rendu fabrique `planche.jpg` à côté des WebP. Avant de dire que c'est bon, ouvrez-la et regardez-la
  vraiment : kicker tronqué, point rouge sur le bord, deux variantes trop semblables, source mal recadrée,
  légende illisible, élément hors marge.
- Les fichiers validés sont copiés à la main dans `assets/img/une/` ou `assets/img/instrument/`.
- Quand un défaut ne doit plus revenir, proposez `/retenir-une-regle` : la règle s'ajoute ci-dessous.

## Les règles apprises

(ajoutées une par une par /retenir-une-regle ; la numérotation continue celle des règles de composition)
```

- [ ] **Step 3 : Écrire `studio/sources/CREDITS.md`**

```markdown
# Crédits des images sources

| Fichier | Source | Licence |
| --- | --- | --- |
| `ukraine-mer-noire.jpg` | NASA Terra/MODIS, « Satellite picture of Crimea, 05-16-2015 », via Wikimedia Commons | Domaine public |
```

- [ ] **Step 4 : Suivre les quatre polices**

```bash
git add -f assets/fonts/font-02.woff2 assets/fonts/font-03.woff2 assets/fonts/font-07.woff2 assets/fonts/font-08.woff2
git status --short assets/fonts
```

Attendu : quatre lignes `A  assets/fonts/font-0X.woff2`.

- [ ] **Step 5 : Commit**

```bash
git add .gitignore studio/CLAUDE.md studio/sources/CREDITS.md studio/rendu/.gitkeep
git commit -m "Studio d'images : harnais, fiche de poste et polices locales

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2 : `instrument-pour.js` et son test

**Files:**
- Create: `instrument-pour.js`, `test/instrument-pour.test.mjs`

- [ ] **Step 1 : Écrire le test qui échoue**

```js
// test/instrument-pour.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const src = readFileSync(new URL('../instrument-pour.js', import.meta.url), 'utf8')
const { instrumentPour, hachageFnv1a } = vm.runInNewContext(src + ';({ instrumentPour, hachageFnv1a })', {})

test('même URL, même variante', () => {
  const a = { cat: 'crypto', href: 'https://exemple.test/a' }
  assert.equal(instrumentPour(a), instrumentPour({ ...a }))
})

test('cinq URL se répartissent sur au moins trois variantes', () => {
  const urls = ['https://a.test/1', 'https://b.test/2', 'https://c.test/3', 'https://d.test/4', 'https://e.test/5']
  const variantes = new Set(urls.map((href) => instrumentPour({ cat: 'marches', href })))
  assert.ok(variantes.size >= 3, `seulement ${variantes.size} variante(s)`)
})

test('URL vide ou « # » donne la variante 1 sans erreur', () => {
  assert.equal(instrumentPour({ cat: 'geopolitique', href: '' }), 'assets/img/instrument/geopolitique-1.webp')
  assert.equal(instrumentPour({ cat: 'geopolitique', href: '#' }), 'assets/img/instrument/geopolitique-1.webp')
  assert.equal(instrumentPour({ cat: 'geopolitique' }), 'assets/img/instrument/geopolitique-1.webp')
})

test('rubrique inconnue retombe sur marches', () => {
  assert.match(instrumentPour({ cat: 'inconnue', href: 'https://x.test' }), /^assets\/img\/instrument\/marches-[1-6]\.webp$/)
})

test('le chemin est toujours bien formé', () => {
  for (const cat of ['geopolitique', 'marches', 'crypto', 'matieres', 'iatech']) {
    assert.match(instrumentPour({ cat, href: 'https://x.test/' + cat }), new RegExp(`^assets/img/instrument/${cat}-[1-6]\\.webp$`))
  }
})

test('hachageFnv1a est stable et sur 32 bits', () => {
  assert.equal(hachageFnv1a(''), 0x811c9dc5)
  assert.equal(hachageFnv1a('a'), 0xe40c292c)
  assert.ok(hachageFnv1a('inflexion') <= 0xffffffff)
})
```

- [ ] **Step 2 : Vérifier qu'il échoue**

Run : `node --test test/instrument-pour.test.mjs`
Attendu : échec, `ENOENT ... instrument-pour.js`.

- [ ] **Step 3 : Écrire `instrument-pour.js`**

```js
/**
 * instrument-pour.js — choisit l'image « instrument » d'une carte du flux.
 * Globales var pour être chargeable dans node:vm (voir test/instrument-pour.test.mjs).
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
  var n = (hachageFnv1a(href) % INSTRUMENT_VARIANTES) + 1;
  return 'assets/img/instrument/' + cat + '-' + n + '.webp';
}

if (typeof window !== 'undefined') { window.instrumentPour = instrumentPour; }
```

- [ ] **Step 4 : Vérifier que le test passe**

Run : `node --test test/instrument-pour.test.mjs`
Attendu : `# pass 6`.

- [ ] **Step 5 : Commit**

```bash
git add instrument-pour.js test/instrument-pour.test.mjs
git commit -m "Flux : instrumentPour(), choix déterministe de l'image par hachage de l'URL

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3 : Scène `instrument.html`

**Files:**
- Create: `studio/scenes/instrument.html`, `test/instrument-graine.test.mjs`

- [ ] **Step 1 : Écrire le test du générateur à graine (qui échoue)**

```js
// test/instrument-graine.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const html = readFileSync(new URL('../studio/scenes/instrument.html', import.meta.url), 'utf8')
const bloc = html.match(/\/\* graine:debut \*\/([\s\S]*?)\/\* graine:fin \*\//)
assert.ok(bloc, 'instrument.html doit contenir le bloc /* graine:debut */ … /* graine:fin */')
const { graine } = vm.runInNewContext(bloc[1] + ';({ graine })', {})

const suite = (n, k = 8) => { const r = graine(n); return Array.from({ length: k }, () => r()) }

test('même graine, même suite', () => {
  assert.deepEqual(suite(3), suite(3))
})

test('graines 1 à 6 donnent six suites distinctes', () => {
  const suites = new Set([1, 2, 3, 4, 5, 6].map((n) => JSON.stringify(suite(n))))
  assert.equal(suites.size, 6)
})

test('les valeurs sont dans [0, 1)', () => {
  for (const v of suite(42, 200)) assert.ok(v >= 0 && v < 1)
})

test('la scène déclare cinq rubriques et six variantes', () => {
  assert.match(html, /window\.RUBRIQUES\s*=\s*\['geopolitique',\s*'marches',\s*'crypto',\s*'matieres',\s*'iatech'\]/)
  assert.match(html, /window\.VARIANTES\s*=\s*6\b/)
})
```

- [ ] **Step 2 : Vérifier qu'il échoue**

Run : `node --test test/instrument-graine.test.mjs`
Attendu : échec, fichier introuvable.

- [ ] **Step 3 : Écrire `studio/scenes/instrument.html`**

```html
<!doctype html>
<html lang="fr"><meta charset="utf-8"><title>Instrument</title>
<style>
  @font-face { font-family: 'Archivo'; font-weight: 800; src: url("../../assets/fonts/font-03.woff2") format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC; }
  @font-face { font-family: 'Archivo'; font-weight: 800; src: url("../../assets/fonts/font-02.woff2") format('woff2'); unicode-range: U+0100-02BA, U+1E00-1E9F; }
  @font-face { font-family: 'IBM Plex Mono'; font-weight: 400; src: url("../../assets/fonts/font-08.woff2") format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC; }
  @font-face { font-family: 'IBM Plex Mono'; font-weight: 400; src: url("../../assets/fonts/font-07.woff2") format('woff2'); unicode-range: U+0100-02BA, U+1E00-1E9F; }
  html, body { margin: 0; background: #17100E; overflow: hidden; }
  #scene { position: relative; width: 1000px; height: 600px; transform-origin: 0 0; }
  svg { display: block; width: 1000px; height: 600px; }
  .kicker { font-family: 'IBM Plex Mono', monospace; font-size: 18px; letter-spacing: 0.18em; fill: #E05A4E; }
  .legende { font-family: 'IBM Plex Mono', monospace; font-size: 15px; letter-spacing: 0.1em; fill: rgba(245,237,230,.55); }
  .structure { fill: none; stroke: rgba(237,235,228,.16); stroke-width: 1.2; }
  .figure { fill: none; stroke: #EDEBE4; stroke-width: 2.2; stroke-linejoin: round; stroke-linecap: round; }
  #controles { position: fixed; left: 12px; bottom: 12px; font: 13px system-ui; color: #EDEBE4; background: rgba(0,0,0,.5); padding: 8px 10px; }
  #controles select, #controles input { margin-left: 6px; }
</style>
<div id="scene"><svg id="svg" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg"></svg></div>
<div id="controles" hidden>
  Rubrique <select id="c-rubrique"></select>
  Variante <input id="c-variante" type="number" min="1" max="6" value="1">
</div>
<script>
  window.LARGEUR = 1000;
  window.HAUTEUR = 600;
  window.RUBRIQUES = ['geopolitique', 'marches', 'crypto', 'matieres', 'iatech'];
  window.VARIANTES = 6;
  const LIBELLES = { geopolitique: 'GÉOPOLITIQUE', marches: 'MARCHÉS', crypto: 'CRYPTO', matieres: 'MATIÈRES PREMIÈRES', iatech: 'IA & TECH' };
  const W = 1000, H = 600, MARGE = 60; // 6 % de la largeur

  /* graine:debut */
  // mulberry32 : générateur déterministe, une suite par entier de graine
  function graine(n) {
    var a = (n * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* graine:fin */

  const NS = 'http://www.w3.org/2000/svg';
  const el = (nom, attrs, texte) => {
    const e = document.createElementNS(NS, nom);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    if (texte != null) e.textContent = texte;
    return e;
  };
  const entre = (r, a, b) => a + r() * (b - a);

  // ---------- les cinq familles : chacune reçoit (r, g) et renvoie {x, y} du signal ----------
  const FAMILLES = {
    geopolitique(r, g) {
      const cx = entre(r, 560, 700), cy = entre(r, 260, 340), R = entre(r, 300, 380);
      const rot = entre(r, -25, 25);
      const grp = el('g', { transform: `rotate(${rot.toFixed(1)} ${cx} ${cy})`, class: 'structure' });
      for (let i = 1; i <= 4; i++) grp.appendChild(el('ellipse', { cx, cy, rx: (R * i / 4).toFixed(1), ry: R }));
      for (let i = -3; i <= 3; i++) {
        const y = cy + R * i / 4, k = Math.sqrt(1 - (i / 4) ** 2);
        grp.appendChild(el('path', { d: `M${(cx - R * k).toFixed(1)} ${y.toFixed(1)}Q${cx} ${(y + (i < 0 ? -1 : 1) * 10).toFixed(1)} ${(cx + R * k).toFixed(1)} ${y.toFixed(1)}` }));
      }
      grp.appendChild(el('line', { x1: cx, y1: cy - R, x2: cx, y2: cy + R }));
      g.appendChild(grp);
      // silhouette d'une zone : polygone irrégulier
      const px = entre(r, 480, 620), py = entre(r, 230, 330), n = 9 + Math.floor(r() * 4);
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, d = entre(r, 55, 95);
        pts.push(`${(px + Math.cos(a) * d * 1.3).toFixed(1)} ${(py + Math.sin(a) * d).toFixed(1)}`);
      }
      g.appendChild(el('path', { class: 'figure', d: `M${pts.join('L')}Z` }));
      return { x: px + entre(r, -30, 30), y: py + entre(r, -20, 20) };
    },
    marches(r, g) {
      const x0 = MARGE, x1 = W - MARGE, y0 = 120, y1 = H - 110;
      const grille = el('g', { class: 'structure' });
      for (let i = 0; i <= 5; i++) grille.appendChild(el('line', { x1: x0, y1: y0 + (y1 - y0) * i / 5, x2: x1, y2: y0 + (y1 - y0) * i / 5 }));
      for (let i = 0; i <= 8; i++) grille.appendChild(el('line', { x1: x0 + (x1 - x0) * i / 8, y1: y0, x2: x0 + (x1 - x0) * i / 8, y2: y1 }));
      g.appendChild(grille);
      const n = 14, tendance = entre(r, -0.5, 0.9), vol = entre(r, 20, 60), rupture = 5 + Math.floor(r() * 7);
      const pts = []; let y = entre(r, 300, 420);
      for (let i = 0; i < n; i++) {
        const x = x0 + (x1 - x0) * i / (n - 1);
        y += -tendance * 18 + entre(r, -vol, vol) + (i === rupture ? -entre(r, 40, 90) : 0);
        y = Math.max(y0 + 20, Math.min(y1 - 10, y));
        pts.push([x, y]);
      }
      const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
      const defs = el('defs'); const lg = el('linearGradient', { id: 'sous', x1: 0, y1: 0, x2: 0, y2: 1 });
      lg.appendChild(el('stop', { offset: 0, 'stop-color': '#8E2424', 'stop-opacity': .55 }));
      lg.appendChild(el('stop', { offset: 1, 'stop-color': '#8E2424', 'stop-opacity': 0 }));
      defs.appendChild(lg); g.appendChild(defs);
      g.appendChild(el('path', { d: `${d}L${x1} ${y1}L${x0} ${y1}Z`, fill: 'url(#sous)' }));
      g.appendChild(el('path', { class: 'figure', d }));
      const [sx, sy] = pts[rupture];
      g.appendChild(el('line', { x1: sx, y1: sy, x2: sx, y2: y1, stroke: '#E05A4E', 'stroke-width': 1, 'stroke-dasharray': '3 5' }));
      return { x: sx, y: sy };
    },
    crypto(r, g) {
      const n = 8 + Math.floor(r() * 7), noeuds = [];
      for (let i = 0; i < n; i++) noeuds.push([entre(r, MARGE + 60, W - MARGE - 60), entre(r, 140, H - 130)]);
      const densite = entre(r, 0.25, 0.5), liens = el('g', { class: 'structure' });
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (r() < densite)
        liens.appendChild(el('line', { x1: noeuds[i][0], y1: noeuds[i][1], x2: noeuds[j][0], y2: noeuds[j][1] }));
      g.appendChild(liens);
      const actif = Math.floor(r() * n);
      noeuds.forEach(([x, y], i) => g.appendChild(el('circle', { class: 'figure', cx: x.toFixed(1), cy: y.toFixed(1), r: i === actif ? 14 : entre(r, 5, 9).toFixed(1) })));
      return { x: noeuds[actif][0], y: noeuds[actif][1] };
    },
    matieres(r, g) {
      const couches = 5 + Math.floor(r() * 5), amp = entre(r, 10, 34), marquee = Math.floor(r() * couches);
      let signal = { x: 0, y: 0 };
      for (let c = 0; c < couches; c++) {
        const yb = 150 + (H - 260) * c / (couches - 1), seg = 12, pts = [];
        for (let i = 0; i <= seg; i++) {
          const x = MARGE + (W - 2 * MARGE) * i / seg;
          pts.push(`${x.toFixed(1)} ${(yb + Math.sin(i * 0.9 + c * 1.3) * amp + entre(r, -4, 4)).toFixed(1)}`);
        }
        g.appendChild(el('path', { class: c === marquee ? 'figure' : 'structure', d: `M${pts.join('L')}` }));
        if (c === marquee) { const k = 3 + Math.floor(r() * 7); const [x, y] = pts[k].split(' ').map(Number); signal = { x, y }; }
      }
      return signal;
    },
    iatech(r, g) {
      const pas = [40, 50, 60][Math.floor(r() * 3)], cols = Math.floor((W - 2 * MARGE) / pas), lignes = Math.floor((H - 240) / pas);
      const ox = MARGE + ((W - 2 * MARGE) - cols * pas) / 2 + pas / 2, oy = 130 + pas / 2;
      const diag = Math.floor(r() * (cols + lignes)), sens = r() < 0.5 ? 1 : -1;
      let signal = { x: ox, y: oy }; const cellule = Math.floor(r() * Math.min(cols, lignes));
      for (let i = 0; i < cols; i++) for (let j = 0; j < lignes; j++) {
        const allume = (sens > 0 ? i + j : i - j + lignes) === diag;
        const x = ox + i * pas, y = oy + j * pas;
        g.appendChild(el('circle', { cx: x, cy: y, r: allume ? 5 : 2.2, fill: allume ? '#EDEBE4' : 'rgba(237,235,228,.22)' }));
        if (allume && j === cellule) signal = { x, y };
      }
      return signal;
    },
  };

  // ---------- cadre commun ----------
  function dessiner(rubrique, variante) {
    const svg = document.getElementById('svg');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const r = graine(variante * 100 + window.RUBRIQUES.indexOf(rubrique));
    svg.appendChild(el('rect', { width: W, height: H, fill: '#17100E' }));
    const g = el('g'); svg.appendChild(g);
    const signal = FAMILLES[rubrique](r, g);
    // le signal : un seul point rouge
    svg.appendChild(el('circle', { cx: signal.x.toFixed(1), cy: signal.y.toFixed(1), r: 7, fill: '#E05A4E' }));
    svg.appendChild(el('circle', { cx: signal.x.toFixed(1), cy: signal.y.toFixed(1), r: 18, fill: 'none', stroke: '#E05A4E', 'stroke-width': 1.2, opacity: .55 }));
    // kicker, filet, légende
    svg.appendChild(el('text', { class: 'kicker', x: MARGE, y: MARGE + 14 }, `§ ${LIBELLES[rubrique]}`));
    svg.appendChild(el('rect', { x: MARGE, y: H - MARGE - 44, width: 40, height: 3, fill: '#8E2424' }));
    const lat = entre(r, -60, 70), lon = entre(r, -180, 180);
    const legendes = {
      geopolitique: `${Math.abs(lat).toFixed(1)}°${lat < 0 ? 'S' : 'N'} ${Math.abs(lon).toFixed(1)}°${lon < 0 ? 'O' : 'E'}`,
      marches: `SÉRIE ${String(variante).padStart(2, '0')} · ${(entre(r, -4, 6)).toFixed(2).replace('.', ',')} %`,
      crypto: `BLOC ${Math.floor(entre(r, 800000, 999999))}`,
      matieres: `STRATE ${variante} · ${Math.floor(entre(r, 120, 980))} M`,
      iatech: `MATRICE ${variante} · ${Math.floor(entre(r, 1000, 9999))}`,
    };
    svg.appendChild(el('text', { class: 'legende', x: MARGE, y: H - MARGE }, legendes[rubrique]));
  }

  const q = new URLSearchParams(location.search);
  window.afficher = async () => {
    const rubrique = window.RUBRIQUES.includes(q.get('rubrique')) ? q.get('rubrique') : 'marches';
    const variante = Math.min(window.VARIANTES, Math.max(1, parseInt(q.get('variante') || '1', 10)));
    dessiner(rubrique, variante);
    await document.fonts.ready;
  };

  if (!q.has('rendu')) {
    // aperçu : à l'échelle de la fenêtre, avec les contrôles
    const s = document.getElementById('scene');
    const ajuster = () => { s.style.transform = `scale(${Math.min(innerWidth / W, innerHeight / H)})`; };
    addEventListener('resize', ajuster); ajuster();
    const c = document.getElementById('controles'); c.hidden = false;
    const sel = document.getElementById('c-rubrique');
    for (const rb of window.RUBRIQUES) { const o = document.createElement('option'); o.value = rb; o.textContent = rb; sel.appendChild(o); }
    sel.value = q.get('rubrique') || 'geopolitique';
    const inp = document.getElementById('c-variante'); inp.value = q.get('variante') || '1';
    const maj = () => dessiner(sel.value, Math.min(window.VARIANTES, Math.max(1, parseInt(inp.value || '1', 10))));
    sel.onchange = maj; inp.oninput = maj; maj();
  }
</script>
</html>
```

- [ ] **Step 4 : Vérifier que le test passe**

Run : `node --test test/instrument-graine.test.mjs`
Attendu : `# pass 4`.

- [ ] **Step 5 : Vérifier à l'œil dans le navigateur**

Ouvrir `studio/scenes/instrument.html` dans Chrome (double-clic ou `open studio/scenes/instrument.html`). Changer rubrique et variante avec les contrôles. Attendu : fond espresso, kicker rouge en haut à gauche, une figure crème, un seul point rouge, légende en bas à gauche, polices Archivo et Plex Mono chargées (vérifier dans l'inspecteur : `document.fonts.check("18px 'IBM Plex Mono'")` renvoie `true`).

- [ ] **Step 6 : Commit**

```bash
git add studio/scenes/instrument.html test/instrument-graine.test.mjs
git commit -m "Studio : scène instrument, cinq familles par rubrique, six variantes déterministes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4 : Scène `gravure.html`

**Files:**
- Create: `studio/scenes/gravure.html`
- Move: `assets/img/ukraine-mer-noire.webp` → convertir en `studio/sources/ukraine-mer-noire.jpg`

- [ ] **Step 1 : Déposer la source Ukraine**

La source doit être l'original NASA (1817 × 1198), pas le WebP recadré. Le retélécharger :

```bash
curl -sS -A "ImageSearchScript/1.0" -o studio/sources/ukraine-mer-noire.jpg \
  'https://upload.wikimedia.org/wikipedia/commons/a/ad/Satellite_picture_of_Crimea%2C_Terra-MODIS%2C_05-16-2015.jpg'
file studio/sources/ukraine-mer-noire.jpg
```

Attendu : `JPEG image data`, 1817x1198.

- [ ] **Step 2 : Écrire `studio/scenes/gravure.html`**

```html
<!doctype html>
<html lang="fr"><meta charset="utf-8"><title>Gravure</title>
<style>
  @font-face { font-family: 'IBM Plex Mono'; font-weight: 400; src: url("../../assets/fonts/font-08.woff2") format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC; }
  @font-face { font-family: 'IBM Plex Mono'; font-weight: 400; src: url("../../assets/fonts/font-07.woff2") format('woff2'); unicode-range: U+0100-02BA, U+1E00-1E9F; }
  html, body { margin: 0; background: #17100E; overflow: hidden; }
  #scene { position: relative; background: #17100E; transform-origin: 0 0; overflow: hidden; }
  #cadre { position: absolute; left: 0; top: 0; overflow: hidden; }
  #photo { width: 100%; height: 100%; object-fit: cover; display: block; filter: url(#bichrome); }
  #grain { position: absolute; inset: 0; mix-blend-mode: multiply; opacity: .28;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='1' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.09 0 0 0 0 0.06 0 0 0 0 0.055 0 0 0 0.9 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>"); }
  .kicker { position: absolute; font-family: 'IBM Plex Mono', monospace; text-transform: uppercase; letter-spacing: .18em; color: #E05A4E; }
  .filet { position: absolute; width: 40px; height: 3px; background: #8E2424; }
  .legende { position: absolute; font-family: 'IBM Plex Mono', monospace; letter-spacing: .1em; color: rgba(245,237,230,.55); white-space: nowrap; }
  #erreur { position: absolute; inset: 24px; border: 4px solid #E05A4E; color: #E05A4E; font: 700 40px system-ui; display: none; align-items: center; justify-content: center; }
  #controles { position: fixed; left: 12px; bottom: 12px; font: 13px system-ui; color: #EDEBE4; background: rgba(0,0,0,.5); padding: 8px 10px; }
</style>
<svg width="0" height="0" style="position:absolute">
  <filter id="bichrome" color-interpolation-filters="sRGB">
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0.09 0.93"/>
      <feFuncG type="table" tableValues="0.063 0.92"/>
      <feFuncB type="table" tableValues="0.055 0.89"/>
    </feComponentTransfer>
  </filter>
</svg>
<div id="scene">
  <div id="cadre"><img id="photo" alt=""><div id="grain"></div></div>
  <div class="kicker" id="kicker"></div>
  <div class="filet" id="filet"></div>
  <div class="legende" id="legende"></div>
  <div id="erreur">source manquante</div>
</div>
<div id="controles" hidden>Aperçu : modifiez les paramètres dans l'adresse (source, format, focal, kicker, legende).</div>
<script>
  const FORMATS = { '16x9': [1600, 900], '5x3': [1000, 600] };
  const q = new URLSearchParams(location.search);
  const format = FORMATS[q.get('format')] ? q.get('format') : '16x9';
  const [W, H] = FORMATS[format];
  window.LARGEUR = W; window.HAUTEUR = H;
  const MARGE = Math.round(W * 0.06);

  function hachage(texte) { let h = 0x811c9dc5; for (const c of texte) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  function graine(n) { let a = (n * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // bord déchiré : polygone en dents irrégulières (amplitude 4 à 6 px), sur le bas en 16:9, à droite en 5:3
  function bordDechire(r, longueur, cote) {
    const pas = 14, pts = [];
    for (let p = 0; p <= longueur; p += pas) pts.push([p, 4 + r() * 2 * (p % (2 * pas) ? 1 : -1)]);
    if (cote === 'bas') return `polygon(0 0, 100% 0, ${pts.map(([x, d]) => `${x}px calc(100% - ${d.toFixed(1)}px)`).reverse().join(', ')}, 0 100%)`;
    return `polygon(0 0, ${pts.map(([y, d]) => `calc(100% - ${d.toFixed(1)}px) ${y}px`).join(', ')}, 0 100%)`;
  }

  function composer() {
    const scene = document.getElementById('scene'), cadre = document.getElementById('cadre');
    scene.style.width = W + 'px'; scene.style.height = H + 'px';
    const r = graine(hachage(q.get('source') || ''));
    if (format === '16x9') {           // image en haut (78 %), bandeau en bas
      cadre.style.width = W + 'px'; cadre.style.height = Math.round(H * 0.78) + 'px';
      cadre.style.clipPath = bordDechire(r, W, 'bas');
      place('kicker', MARGE, H - MARGE - 46, 22); place('filet', MARGE, H - MARGE - 14, 0); place('legende', W - MARGE, H - MARGE - 46, 17, 'droite');
    } else {                           // image à gauche (70 %), bandeau à droite
      cadre.style.width = Math.round(W * 0.70) + 'px'; cadre.style.height = H + 'px';
      cadre.style.clipPath = bordDechire(r, H, 'droite');
      const x = Math.round(W * 0.70) + 32;
      place('kicker', x, MARGE, 15); place('filet', x, MARGE + 34, 0); place('legende', x, H - MARGE - 16, 13);
    }
    const [fx, fy] = (q.get('focal') || '50,50').split(',').map(Number);
    const photo = document.getElementById('photo');
    photo.style.objectPosition = `${fx}% ${fy}%`;
    document.getElementById('kicker').textContent = `§ ${q.get('kicker') || 'Analyse'}`;
    document.getElementById('legende').textContent = q.get('legende') || '';
    return new Promise((ok, ko) => {
      photo.onload = () => ok();
      photo.onerror = () => { document.getElementById('erreur').style.display = 'flex'; ko(new Error(`source manquante : ${q.get('source')}`)); };
      photo.src = q.get('source') || '';
    });
  }
  function place(id, x, y, taille, ancre) {
    const e = document.getElementById(id);
    if (ancre === 'droite') { e.style.right = (W - x) + 'px'; } else { e.style.left = x + 'px'; }
    e.style.top = y + 'px'; if (taille) e.style.fontSize = taille + 'px';
  }

  window.afficher = async () => { await composer(); await document.fonts.ready; };

  if (!q.has('rendu')) {
    const s = document.getElementById('scene');
    const ajuster = () => { s.style.transform = `scale(${Math.min(innerWidth / W, innerHeight / H)})`; };
    addEventListener('resize', ajuster); ajuster();
    document.getElementById('controles').hidden = false;
    window.afficher().catch((e) => console.error(e.message));
  }
</script>
</html>
```

- [ ] **Step 3 : Vérifier à l'œil**

```bash
open "studio/scenes/gravure.html?source=../sources/ukraine-mer-noire.jpg&format=16x9&focal=55,45&kicker=Géopolitique&legende=Mer Noire · 2026"
```

Attendu : image en bichromie espresso et crème avec grain, bord déchiré en bas, kicker rouge et légende dans la bande inférieure. Puis ouvrir avec `source=../sources/inexistant.jpg` : cadre rouge « source manquante » et erreur dans la console.

- [ ] **Step 4 : Commit**

```bash
git add studio/scenes/gravure.html studio/sources/ukraine-mer-noire.jpg
git commit -m "Studio : scène gravure bichrome et source Ukraine

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5 : `rendre.mjs` et son test

**Files:**
- Create: `studio/outils/rendre.mjs`, `test/studio-rendre.test.mjs`

- [ ] **Step 1 : Écrire le test (qui échoue)**

Le test n'a pas besoin de Chrome : il vérifie les refus avant tout lancement, en exécutant le script avec `node` et en lisant le code de sortie et stderr.

```js
// test/studio-rendre.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const script = new URL('../studio/outils/rendre.mjs', import.meta.url).pathname
const lancer = (...args) => spawnSync('node', [script, ...args], { encoding: 'utf8', env: { ...process.env, CHROME: '/chemin/inexistant' } })

test('sans argument : usage et code 1', () => {
  const r = lancer()
  assert.equal(r.status, 1)
  assert.match(r.stderr, /Usage/)
})

test('refuse un dossier de rendu existant', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rendu-'))
  const taches = join(dir, 'taches.json')
  writeFileSync(taches, '[]')
  const r = lancer(taches, dir)
  assert.equal(r.status, 1)
  assert.match(r.stderr, /existe déjà/)
})

test('signale Chrome introuvable avant toute écriture', () => {
  const base = mkdtempSync(join(tmpdir(), 'rendu-'))
  const taches = join(base, 'taches.json')
  writeFileSync(taches, JSON.stringify([{ scene: 'instrument.html', params: { rubrique: 'crypto', variante: 1 }, sortie: 'x.webp' }]))
  const r = lancer(taches, join(base, 'sortie'))
  assert.equal(r.status, 1)
  assert.match(r.stderr, /Chrome introuvable/)
})
```

- [ ] **Step 2 : Vérifier qu'il échoue**

Run : `node --test test/studio-rendre.test.mjs`
Attendu : 3 échecs (script introuvable).

- [ ] **Step 3 : Écrire `studio/outils/rendre.mjs`**

```js
// Rend des scènes HTML en WebP : Chrome (sans fenêtre) affiche chaque image et la photographie.
// Aucune dépendance npm, aucun port réseau : Node 22 ou plus parle à Chrome par un tuyau local.
// Usage : node rendre.mjs <taches.json | instrument> <dossier de sortie>
//   taches.json : [{ "scene": "gravure.html", "params": { ... }, "sortie": "nom.webp" }, ...]
//   instrument  : énumère RUBRIQUES × VARIANTES déclarés par scenes/instrument.html
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { once } from 'node:events';

const [entree, sortieDir] = process.argv.slice(2);
if (!entree || !sortieDir) { console.error('Usage : node rendre.mjs <taches.json | instrument> <dossier de sortie>'); process.exit(1); }
if (existsSync(sortieDir)) { console.error(`${sortieDir} existe déjà : un rendu ne s'écrase jamais.`); process.exit(1); }
const SCENES = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'scenes');
const CHROME = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  join(process.env.HOME || '', 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].find((c) => c && existsSync(c));
if (!CHROME) { console.error('Google Chrome introuvable : installez-le, ou indiquez son chemin dans la variable CHROME.'); process.exit(1); }
let taches = null;
if (entree !== 'instrument') {
  try { taches = JSON.parse(readFileSync(entree, 'utf8')); } catch (e) { console.error(`Fichier de tâches illisible : ${entree} (${e.message})`); process.exit(1); }
}

// 1. Lancer Chrome sans fenêtre, profil jetable, dialogue sur les descripteurs 3 et 4
const profil = mkdtempSync(join(tmpdir(), 'studio-chrome-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-pipe', `--user-data-dir=${profil}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
  '--allow-file-access-from-files', '--window-size=1600,900', '--force-device-scale-factor=1', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
let journal = '';
chrome.stderr.on('data', (d) => { journal = (journal + d).slice(-4000); });
const vers = chrome.stdio[3], depuis = chrome.stdio[4];
let numero = 0, tampon = '';
const enAttente = new Map();
depuis.setEncoding('utf8');
depuis.on('data', (d) => {
  tampon += d; let fin;
  while ((fin = tampon.indexOf('\0')) >= 0) {
    const m = JSON.parse(tampon.slice(0, fin)); tampon = tampon.slice(fin + 1);
    if (!enAttente.has(m.id)) continue;
    const { ok, ko } = enAttente.get(m.id); enAttente.delete(m.id);
    m.error ? ko(new Error(m.error.message)) : ok(m.result);
  }
});
chrome.on('exit', (code) => {
  for (const { ko } of enAttente.values()) ko(new Error(`Chrome s'est arrêté (code ${code}). ${journal.trim().split('\n').pop() || ''}`));
  enAttente.clear();
});
const cdp = (method, params = {}, sessionId) => new Promise((ok, ko) => {
  const id = ++numero;
  const garde = setTimeout(() => { if (enAttente.delete(id)) ko(new Error(`Chrome ne répond pas (${method})`)); }, 10000);
  enAttente.set(id, { ok: (r) => { clearTimeout(garde); ok(r); }, ko: (e) => { clearTimeout(garde); ko(e); } });
  vers.write(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }) + '\0');
});
async function ranger() {
  try { vers.end(); } catch {}
  if (chrome.exitCode === null) { chrome.kill(); await Promise.race([once(chrome, 'exit'), new Promise((r) => setTimeout(r, 5000))]); }
  try { rmSync(profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch {}
}

try {
  // 2. Un onglet, une session
  const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => cdp(method, params, sessionId);
  const evaluer = async (expression) => {
    const r = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`Erreur dans la scène : ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result.value;
  };
  const ouvrir = async (scene, params) => {
    const url = `${pathToFileURL(join(SCENES, scene)).href}?rendu&${new URLSearchParams(params)}`;
    await page('Page.navigate', { url });
    let pret = false;
    for (let essai = 0; essai < 100 && !pret; essai++) {
      await new Promise((r) => setTimeout(r, 100));
      pret = await evaluer(`document.readyState === 'complete' && typeof window.afficher === 'function' && window.LARGEUR > 0 && window.HAUTEUR > 0`).catch(() => false);
    }
    if (!pret) throw new Error(`${scene} ne déclare pas window.LARGEUR, window.HAUTEUR et window.afficher().`);
  };

  // 3. Énumération (mode instrument) : c'est la scène qui dit quoi rendre
  if (!taches) {
    await ouvrir('instrument.html', {});
    const { rubriques, variantes } = await evaluer(`({ rubriques: window.RUBRIQUES, variantes: window.VARIANTES })`);
    taches = [];
    for (const rubrique of rubriques) for (let v = 1; v <= variantes; v++) taches.push({ scene: 'instrument.html', params: { rubrique, variante: v }, sortie: `${rubrique}-${v}.webp` });
  }
  if (!Array.isArray(taches) || taches.length === 0) throw new Error('Aucune tâche à rendre.');

  // 4. Chaque tâche : ouvrir, dimensionner, afficher, photographier en WebP
  mkdirSync(sortieDir, { recursive: true });
  for (const [i, t] of taches.entries()) {
    await ouvrir(t.scene, t.params || {});
    const { l, h } = await evaluer(`({ l: window.LARGEUR, h: window.HAUTEUR })`);
    await page('Emulation.setDeviceMetricsOverride', { width: l, height: h, deviceScaleFactor: 1, mobile: false });
    await evaluer(`window.afficher().then(() => new Promise((r) => requestAnimationFrame(() => r(true))))`);
    const { data } = await page('Page.captureScreenshot', { format: 'webp', quality: 82, clip: { x: 0, y: 0, width: l, height: h, scale: 1 } });
    writeFileSync(join(sortieDir, t.sortie), Buffer.from(data, 'base64'));
    process.stdout.write(`\rImage ${i + 1} / ${taches.length}  ${t.sortie}        `);
  }
  process.stdout.write('\n');
} catch (e) {
  console.error(e.message);
  await ranger();
  process.exit(1);
}
await ranger();
```

- [ ] **Step 4 : Vérifier que le test passe**

Run : `node --test test/studio-rendre.test.mjs`
Attendu : `# pass 3`.

- [ ] **Step 5 : Premier rendu réel**

```bash
mkdir -p studio/rendu && node studio/outils/rendre.mjs instrument studio/rendu/essai-instrument
ls studio/rendu/essai-instrument | wc -l
```

Attendu : `Image 30 / 30` puis `30`. Ouvrir trois fichiers au hasard avec l'outil de lecture d'image et vérifier qu'ils correspondent à l'aperçu de la Task 3. Si les polices tombent en repli (texte en police système), vérifier le chemin `../../assets/fonts/` depuis `studio/scenes/`. Supprimer `studio/rendu/essai-instrument` ensuite (c'est un dossier d'essai, pas un rendu numéroté).

- [ ] **Step 6 : Commit**

```bash
git add studio/outils/rendre.mjs test/studio-rendre.test.mjs
git commit -m "Studio : rendre.mjs, Chrome sans fenêtre par tuyau local, capture WebP

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6 : `planche.py` et `rendre.sh`

**Files:**
- Create: `studio/outils/planche.py`, `studio/outils/rendre.sh`

- [ ] **Step 1 : Écrire `studio/outils/planche.py`**

```python
#!/usr/bin/env python3
"""Planche de contrôle : tous les WebP d'un dossier de rendu en une grille, avec le nom sous chaque vignette.
Usage : python3 studio/outils/planche.py studio/rendu/<dossier>   → <dossier>/planche.jpg
Pillow uniquement. Ne s'écrase jamais."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

COLONNES, LARGEUR_VIGNETTE, MARGE, LEGENDE = 4, 320, 16, 22
FOND, ENCRE = (237, 235, 228), (16, 18, 20)

def main():
    if len(sys.argv) != 2:
        sys.exit("Usage : planche.py <dossier de rendu>")
    dossier = Path(sys.argv[1])
    sortie = dossier / "planche.jpg"
    if sortie.exists():
        sys.exit(f"{sortie} existe déjà : une planche ne s'écrase jamais.")
    fichiers = sorted(dossier.glob("*.webp"))
    if not fichiers:
        sys.exit(f"Aucun WebP dans {dossier}")
    vignettes = []
    for f in fichiers:
        im = Image.open(f).convert("RGB")
        h = round(im.height * LARGEUR_VIGNETTE / im.width)
        vignettes.append((f.name, im.resize((LARGEUR_VIGNETTE, h), Image.LANCZOS)))
    hauteur_case = max(v.height for _, v in vignettes) + LEGENDE
    lignes = -(-len(vignettes) // COLONNES)
    planche = Image.new("RGB", (COLONNES * (LARGEUR_VIGNETTE + MARGE) + MARGE, lignes * (hauteur_case + MARGE) + MARGE), FOND)
    dessin = ImageDraw.Draw(planche)
    for i, (nom, v) in enumerate(vignettes):
        x = MARGE + (i % COLONNES) * (LARGEUR_VIGNETTE + MARGE)
        y = MARGE + (i // COLONNES) * (hauteur_case + MARGE)
        planche.paste(v, (x, y))
        dessin.text((x, y + v.height + 4), nom, fill=ENCRE)
    planche.save(sortie, quality=85)
    print(f"Planche : {sortie}")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2 : Écrire `studio/outils/rendre.sh`**

```bash
#!/bin/bash
# Rend les instruments ou une gravure dans studio/rendu/, au prochain numéro libre, puis fabrique la planche.
# N'écrase jamais un rendu. N'installe rien. N'envoie rien sur Internet.
#
# Usage (depuis la racine du dépôt) :
#   bash studio/outils/rendre.sh instrument
#   bash studio/outils/rendre.sh gravure <nom> <16x9|5x3> [focal "50,50"] [kicker] [legende]
set -u
ICI="$(cd "$(dirname "$0")" && pwd)"
STUDIO="$(dirname "$ICI")"
[ $# -ge 1 ] || { echo "Usage : $0 instrument | gravure <nom> <16x9|5x3> [focal] [kicker] [legende]" >&2; exit 1; }

# ---------- les outils ----------
command -v node >/dev/null 2>&1 || { echo "Il manque Node.js 22 ou plus (nodejs.org)." >&2; exit 1; }
MAJEURE=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)
[ "${MAJEURE:-0}" -ge 22 ] || { echo "Node.js $(node --version) est trop ancien : il faut la version 22 ou plus." >&2; exit 1; }
PY=$(command -v python3) ; [ -n "$PY" ] || { echo "Il manque python3 (avec Pillow) pour la planche." >&2; exit 1; }
"$PY" -c 'import PIL' 2>/dev/null || { echo "Il manque Pillow : $PY -m pip install pillow" >&2; exit 1; }
CHROME_OK=0
for c in "${CHROME:-}" "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
  [ -n "$c" ] && [ -x "$c" ] && { CHROME_OK=1; break; }
done
[ "$CHROME_OK" -eq 1 ] || { echo "Il manque Google Chrome, ou indiquez son chemin dans la variable CHROME." >&2; exit 1; }

# ---------- la tâche ----------
MODE="$1"
case "$MODE" in
  instrument)
    BASE="instrument"; ENTREE="instrument" ;;
  gravure)
    [ $# -ge 3 ] || { echo "Usage : $0 gravure <nom> <16x9|5x3> [focal] [kicker] [legende]" >&2; exit 1; }
    NOM="$2"; FORMAT="$3"; FOCAL="${4:-50,50}"; KICKER="${5:-Analyse}"; LEGENDE="${6:-}"
    case "$FORMAT" in 16x9|5x3) ;; *) echo "Format inconnu : $FORMAT (16x9 ou 5x3)" >&2; exit 1 ;; esac
    SOURCE=""
    for ext in jpg jpeg png webp; do [ -f "$STUDIO/sources/$NOM.$ext" ] && { SOURCE="../sources/$NOM.$ext"; break; }; done
    [ -n "$SOURCE" ] || { echo "Source introuvable : studio/sources/$NOM.(jpg|jpeg|png|webp)" >&2; exit 1; }
    BASE="gravure-$NOM"
    ENTREE=$(mktemp "${TMPDIR:-/tmp}/taches-XXXXXX.json")
    node -e '
      const [source, format, focal, kicker, legende, nom] = process.argv.slice(1);
      console.log(JSON.stringify([{ scene: "gravure.html", params: { source, format, focal, kicker, legende }, sortie: `${nom}-${format}.webp` }]));
    ' "$SOURCE" "$FORMAT" "$FOCAL" "$KICKER" "$LEGENDE" "$NOM" > "$ENTREE" ;;
  *) echo "Mode inconnu : $MODE (instrument ou gravure)" >&2; exit 1 ;;
esac

# ---------- le numéro ----------
N=1
while [ -e "$STUDIO/rendu/$BASE-v$N" ]; do N=$((N+1)); done
SORTIE="$STUDIO/rendu/$BASE-v$N"

# ---------- le rendu et la planche ----------
DEBUT=$(date +%s)
node "$ICI/rendre.mjs" "$ENTREE" "$SORTIE" || { echo "Le rendu a échoué." >&2; exit 1; }
[ "$MODE" = "gravure" ] && rm -f "$ENTREE"
echo "Rendu en $(( $(date +%s) - DEBUT )) s : $SORTIE"
"$PY" "$ICI/planche.py" "$SORTIE"
exit 0
```

- [ ] **Step 3 : Rendre les instruments et regarder la planche**

```bash
bash studio/outils/rendre.sh instrument
```

Attendu : `Image 30 / 30`, `Rendu en N s : .../studio/rendu/instrument-v1`, `Planche : .../instrument-v1/planche.jpg`. Ouvrir `planche.jpg` avec l'outil de lecture d'image et la regarder vraiment : kicker tronqué, point rouge sur le bord, deux variantes trop semblables, légende illisible, élément hors marge. Corriger la scène si besoin, relancer (`-v2`).

- [ ] **Step 4 : Rendre la gravure Ukraine et regarder**

```bash
bash studio/outils/rendre.sh gravure ukraine-mer-noire 16x9 "55,45" "Géopolitique" "Mer Noire · 2026"
```

Attendu : `studio/rendu/gravure-ukraine-mer-noire-v1/ukraine-mer-noire-16x9.webp` et sa planche. Regarder : la Crimée reconnaissable, bichromie, grain visible mais pas bruyant, bord déchiré en bas, kicker et légende lisibles.

- [ ] **Step 5 : Commit**

```bash
git add studio/outils/planche.py studio/outils/rendre.sh
git commit -m "Studio : rendre.sh (numérotation, vérifications) et planche de contrôle Pillow

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7 : Sources Sahel et mer de Chine

**Files:**
- Create: `studio/sources/sahel.jpg`, `studio/sources/mer-de-chine.jpg`
- Modify: `studio/sources/CREDITS.md`

- [ ] **Step 1 : Chercher des candidates libres sur Wikimedia Commons**

Script de recherche (domaine public ou CC BY de préférence, largeur ≥ 1600 px) :

```bash
cat > /tmp/commons.py <<'EOF'
import json, sys, urllib.parse, urllib.request
q = sys.argv[1]
params = {"action":"query","generator":"search","gsrsearch":q+" filetype:bitmap","gsrnamespace":"6","gsrlimit":"10",
          "prop":"imageinfo","iiprop":"url|size|extmetadata","iiurlwidth":"800","format":"json"}
req = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params), headers={"User-Agent":"ImageSearchScript/1.0"})
d = json.load(urllib.request.urlopen(req, timeout=20))
for p in sorted(d.get("query",{}).get("pages",{}).values(), key=lambda p: p.get("index",0)):
    ii = p["imageinfo"][0]; lic = ii.get("extmetadata",{}).get("LicenseShortName",{}).get("value","?")
    print(f'{p["title"][5:75]:75} | {ii.get("width")}x{ii.get("height")} | {lic} | {ii.get("url")}')
EOF
python3 -I /tmp/commons.py "Sahel satellite Niger river"
python3 -I /tmp/commons.py "Taiwan Strait satellite"
```

Candidates attendues (à confirmer) : pour le Sahel, une image satellite NASA du delta intérieur du Niger ou du lac Tchad (domaine public) ; pour la mer de Chine, une image satellite NASA du détroit de Taïwan (domaine public). Télécharger 2 ou 3 aperçus (`iiurlwidth=800`) dans un dossier vide, les regarder avec l'outil de lecture d'image, montrer les candidates à la personne et attendre son choix avant de télécharger l'original.

- [ ] **Step 2 : Déposer les originaux et compléter les crédits**

```bash
curl -sS -A "ImageSearchScript/1.0" -o studio/sources/sahel.jpg "<url de l'original choisi>"
curl -sS -A "ImageSearchScript/1.0" -o studio/sources/mer-de-chine.jpg "<url de l'original choisi>"
file studio/sources/sahel.jpg studio/sources/mer-de-chine.jpg
```

Ajouter deux lignes au tableau de `studio/sources/CREDITS.md` (fichier, source avec le titre Commons, licence).

- [ ] **Step 3 : Rendre les deux gravures et regarder les planches**

```bash
bash studio/outils/rendre.sh gravure sahel 16x9 "50,50" "Géopolitique" "Sahel · 2026"
bash studio/outils/rendre.sh gravure mer-de-chine 16x9 "50,50" "Géopolitique" "Détroit de Taïwan · 2026"
```

Ajuster `focal` si le sujet est coupé, relancer (nouveau numéro).

- [ ] **Step 4 : Commit**

```bash
git add studio/sources/sahel.jpg studio/sources/mer-de-chine.jpg studio/sources/CREDITS.md
git commit -m "Studio : sources Sahel et mer de Chine (Wikimedia Commons)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8 : Publier les rendus validés dans `assets/img/`

**Files:**
- Create: `assets/img/une/ukraine-mer-noire.webp`, `assets/img/une/sahel.webp`, `assets/img/une/mer-de-chine.webp`, `assets/img/instrument/<rubrique>-<n>.webp` (30)
- Modify: `assets/img/CREDITS.md`
- Delete: `assets/img/ukraine-mer-noire.webp` (remplacé par `une/`)

- [ ] **Step 1 : Copier les derniers rendus validés**

```bash
mkdir -p assets/img/une assets/img/instrument
cp "$(ls -d studio/rendu/instrument-v* | sort -V | tail -1)"/*.webp assets/img/instrument/
cp "$(ls -d studio/rendu/gravure-ukraine-mer-noire-v* | sort -V | tail -1)"/ukraine-mer-noire-16x9.webp assets/img/une/ukraine-mer-noire.webp
cp "$(ls -d studio/rendu/gravure-sahel-v* | sort -V | tail -1)"/sahel-16x9.webp assets/img/une/sahel.webp
cp "$(ls -d studio/rendu/gravure-mer-de-chine-v* | sort -V | tail -1)"/mer-de-chine-16x9.webp assets/img/une/mer-de-chine.webp
git rm -q assets/img/ukraine-mer-noire.webp
ls assets/img/instrument | wc -l ; du -sh assets/img/instrument assets/img/une
```

Attendu : `30`, instruments autour de 1 Mo au total, unes autour de 150 Ko chacune. Si un instrument dépasse 60 Ko, baisser la qualité à 75 dans `rendre.mjs` et relancer.

- [ ] **Step 2 : Mettre à jour `assets/img/CREDITS.md`**

```markdown
# Crédits des images hébergées

Les images sont produites par `studio/` (voir `studio/CLAUDE.md`). Sources des gravures : `studio/sources/CREDITS.md`.

| Dossier | Contenu | Source |
| --- | --- | --- |
| `une/` | Gravures bichromes 16:9 des analyses à la une | Images de `studio/sources/` (domaine public ou CC BY, crédits dans ce dossier) |
| `instrument/` | 30 figures 5:3 dessinées par code, 6 par rubrique | Aucune source externe |
```

- [ ] **Step 3 : Commit**

```bash
git add assets/img
git commit -m "Base d'images : 3 gravures à la une et 30 instruments par rubrique

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9 : Brancher `index.html`

**Files:**
- Modify: `index.html` (lignes repérées sur la version actuelle : `<script src="image-catalog.js">` l. 101, `FEATURED_ANALYSES` l. 152-156, `mapNewsToArticles` l. 160-182, carte du flux l. 418-421, bloc `<style>` l. 21-96)

- [ ] **Step 1 : Charger `instrument-pour.js` à la place du catalogue**

Remplacer `<script src="image-catalog.js"></script>` par `<script src="instrument-pour.js"></script>`.

- [ ] **Step 2 : Chemins des analyses à la une**

Dans `FEATURED_ANALYSES`, remplacer les trois valeurs `img:` :

```js
img:'assets/img/une/ukraine-mer-noire.webp'},
img:'assets/img/une/sahel.webp'},
img:'assets/img/une/mer-de-chine.webp'},
```

- [ ] **Step 3 : Plus de catalogue dans `mapNewsToArticles`**

Remplacer `img:item.image||window.matchImage(title,cat)` par `img:item.image||null`.

- [ ] **Step 4 : La carte du flux décide et replie**

Remplacer le bloc image de la carte (actuellement `h('div',{className:'aspect-[5/3] overflow-hidden'}, h('img',{src:a.img,...,onError:e=>{e.target.style.display='none'}}))`) par :

```js
     h('div',{className:'aspect-[5/3] overflow-hidden bg-[var(--chrome-ground)]'+(a.img?' img-gravure':'')},
      h('img',{src:a.img||instrumentPour(a),alt:'',className:'w-full h-full object-cover',loading:'lazy',width:1000,height:600,
       onError:e=>{
        const img=e.target
        if(img.dataset.repli!=='1'){img.dataset.repli='1';img.src=instrumentPour(a);img.parentElement.classList.remove('img-gravure')}
        else{img.style.display='none'}
       }})
     ),
```

`alt` passe à vide : l'image est décorative, le titre est déjà dans le `h3` de la carte (l'ancien `alt:a.title` faisait lire le titre deux fois aux lecteurs d'écran).

- [ ] **Step 5 : La classe `.img-gravure` dans le `<style>`**

Ajouter après le bloc `/* Article cards — filet de lecture rouge */` :

```css
/* Miniatures de sources : traitement gravure commun (sans flou ni bruit, bon marché sur mobile) */
.img-gravure{position:relative}
.img-gravure img{filter:grayscale(1) contrast(1.1) brightness(.95)}
.img-gravure::before{content:'';position:absolute;inset:0;background:#17100E;mix-blend-mode:multiply;opacity:.55;pointer-events:none}
.img-gravure::after{content:'';position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(180deg,rgba(23,16,14,0),rgba(23,16,14,.85));pointer-events:none}
```

- [ ] **Step 6 : Lancer les tests**

Run : `npm test`
Attendu : tous les tests passent (les anciens plus les 13 nouveaux).

- [ ] **Step 7 : Vérifier dans le navigateur**

Serveur local (`python3 -m http.server 3000` ou le preview `inflexion`), ouvrir `http://localhost:3000/`, puis :

- Hero : la gravure Ukraine s'affiche (requête `assets/img/une/ukraine-mer-noire.webp` en 200).
- Flux « Tout » : 9 cartes, chacune avec soit une miniature traitée (classe `img-gravure`, image assombrie), soit un instrument de sa rubrique ; vérifier dans la console :

```js
[...document.querySelectorAll('.article-card img')].map(i=>({src:i.getAttribute('src').slice(-32),gravure:i.parentElement.classList.contains('img-gravure')}))
```

- Deux cartes voisines de même rubrique n'affichent pas le même instrument.
- Aucune requête 404 vers `assets/img/` ; aucune requête vers `images.unsplash.com` depuis le flux.
- Capture d'écran du hero et du flux pour la personne.

- [ ] **Step 8 : Commit**

```bash
git add index.html
git commit -m "Home : gravures à la une, instruments par rubrique et miniatures traitées dans le flux

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10 : Mémoire, relecture finale et proposition de push

- [ ] **Step 1 : Relire la spec contre le résultat**

Parcourir `docs/superpowers/specs/2026-11-13-base-images-studio-design.md` section par section et vérifier : formats (3.3, 3.4), six règles de composition dans `CLAUDE.md` (3.1), contrat (3.2), énumération par la scène (3.5), refus d'écrasement (3.5, 3.6, 3.7), cascade de repli (4.4), tests (5.1). Noter tout écart dans le compte rendu.

- [ ] **Step 2 : Mettre à jour la mémoire de projet**

Dans `~/.claude/projects/-Users-floryanleblanc-Developer-GitHub-Inflexion/memory/project_audit_starlink.md`, ajouter une ligne : base d'images livrée (date, commit), studio dans `studio/`, geste de rendu, ce qui reste hors périmètre (21:9, OG, onze analyses, pages legacy).

- [ ] **Step 3 : Compte rendu et push**

Compte rendu en cinq lignes : ce qui est en ligne localement, les captures, les tests, ce qui n'est pas vérifié. Proposer le push ; ne pousser qu'après un « oui ».

---

## Auto-revue du plan

**Couverture de la spec.** 2 (décisions) → Tasks 3, 4, 8, 9. 3.1 → Task 1. 3.2 → Tasks 3, 4. 3.3 → Task 4. 3.4 → Task 3. 3.5 → Task 5. 3.6 et 3.7 → Task 6. 4.1 → Task 8. 4.2 → Tasks 2, 9. 4.3 et 4.4 → Task 9. 5.1 → Tasks 2, 3, 5. 5.2 → Tasks 6, 9. 5.3 → Tasks 4, 5, 6, 9. 6 (hors périmètre) → rien, volontairement.

**Écarts assumés par rapport à la spec.** IBM Plex Mono n'existe en local qu'en graisse 400 : kickers et légendes sont en 400 (la spec disait 400 et 600). La taille du point rouge et des textes est fixée dans les scènes, pas dans la spec.

**Cohérence des noms.** `instrumentPour`, `hachageFnv1a`, `INSTRUMENT_VARIANTES` (Task 2, 9) ; `graine`, `window.RUBRIQUES`, `window.VARIANTES`, `window.afficher`, `window.LARGEUR`, `window.HAUTEUR` (Tasks 3, 4, 5) ; `rendre.mjs <taches.json | instrument> <dossier>` (Tasks 5, 6) ; `planche.py <dossier>` (Task 6) ; formats `16x9` et `5x3` (Tasks 4, 6, 7) ; chemins `assets/img/une/<nom>.webp` et `assets/img/instrument/<rubrique>-<n>.webp` (Tasks 2, 8, 9).
