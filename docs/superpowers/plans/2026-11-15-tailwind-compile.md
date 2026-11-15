# Tailwind compilé — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** remplacer, sur les 32 pages, le Play CDN de Tailwind par un fichier `assets/site.css` compilé une fois, sans aucune différence visuelle.

**Architecture :** Tailwind v3 en ligne de commande lit `src/input.css` (trois directives) et scanne les HTML racine, les JS racine et `assets/*.js` pour n'émettre que les classes employées. Le fichier produit est commité et reconstruit par le déploiement GitHub Pages. Les pages perdent le `<script>` du CDN et leur `tailwind.config` inline (code mort) et gagnent un `<link>` en **dernier élément du `<head>`**, là où le CDN plaçait sa feuille — c'est ce qui préserve l'ordre de cascade. Spec : `docs/superpowers/specs/2026-11-15-tailwind-compile-design.md`.

**Tech Stack :** Node 22+, `tailwindcss@3.4.19` (devDependency), `node --test` (harness existant), Chrome sans fenêtre + Pillow pour la comparaison visuelle (outils hors dépôt).

**Règles du dépôt :** lire `CLAUDE.md`. Aucun chercher-remplacer de couleur. Ne modifier aucune classe dans le balisage, aucun `<style>`, ni `styles.css`. Branche `feat/tailwind-compile`, travail dans le dossier du dépôt (pas de worktree). Commits en français, terminés par `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Ne jamais pousser.

---

## Carte des fichiers

| Fichier | Action | Responsabilité |
| --- | --- | --- |
| `package.json` | modifier | `devDependencies.tailwindcss`, script `build:css` |
| `package-lock.json` | modifier (par npm) | verrou |
| `tailwind.config.js` | créer | `content` ; thème vide |
| `src/input.css` | créer | les trois directives `@tailwind` |
| `assets/site.css` | créer (généré, commité) | CSS Tailwind minifié du site |
| `test/site-css.test.mjs` | créer | garde-fous : plus de CDN, `<link>` en fin de `<head>`, classes à valeur arbitraire présentes dans `site.css` |
| 32 × `*.html` racine (toutes sauf `og-image.html`) | modifier | retirer le CDN et le config inline, ajouter le `<link>` |
| `.github/workflows/deploy-pages.yml` | modifier | build avant copie ; chemins déclencheurs |
| `CLAUDE.md` | modifier (§3, deux phrases) | décrire l'architecture réelle |

Outils hors dépôt (dossier de notes partagé des sessions, sous-dossier `visuel/`) : `capturer.mjs`, `comparer.py`, `extraire-cdn.mjs`, et les captures « avant » déjà faites sur `main` (`avant/1440`, `avant/390`, `cdn-css/`).

---

### Task 1 : Tailwind installé, configuré, `assets/site.css` produit

**Files :**
- Modify : `package.json`
- Create : `tailwind.config.js`, `src/input.css`, `assets/site.css`

- [ ] **Step 1 : installer Tailwind v3 épinglé**

```bash
npm install --save-dev --save-exact tailwindcss@3.4.19
```

Attendu : `package.json` gagne `"devDependencies": { "tailwindcss": "3.4.19" }` (sans `^`) ; `package-lock.json` mis à jour ; aucune autre dépendance modifiée (`git diff --stat package.json package-lock.json`).

- [ ] **Step 2 : créer `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
// Source unique de la configuration Tailwind du site (remplace les tailwind.config inline des pages,
// dont aucun utilitaire personnalisé n'était employé — voir docs/superpowers/specs/2026-11-15-tailwind-compile-design.md).
module.exports = {
  // assets/article-shell.js porte des classes : la coquille React des dossiers d'analyse.
  content: ['./*.html', './*.js', './assets/*.js'],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 3 : créer `src/input.css`**

```css
/* Entrée du build Tailwind : npm run build:css → assets/site.css (minifié, commité).
   Rien d'autre ici : le CSS propre à chaque page reste dans son <style>, styles.css et
   assets/design-tokens-v2.css restent chargés par les pages. */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4 : ajouter le script npm**

Dans `package.json`, bloc `scripts` :

```json
"scripts": {
  "test": "node --test 'test/**/*.test.mjs'",
  "build:css": "tailwindcss -i src/input.css -o assets/site.css --minify"
},
```

- [ ] **Step 5 : construire et mesurer**

```bash
npm run build:css && wc -c assets/site.css && grep -o 'text-\\\[\\#C6A996\\\]\|bg-\\\[var(--editorial-accent)\\\]\|aspect-\\\[5\\/3\\\]' assets/site.css | sort -u
```

Attendu : build sans avertissement « No utility classes were detected » ; taille entre 20 et 60 Ko ; les trois sélecteurs trouvés (dans le CSS minifié ils s'écrivent `.text-\[\#C6A996\]`, `.bg-\[var\(--editorial-accent\)\]`, `.aspect-\[5\/3\]`).

- [ ] **Step 6 : commit**

```bash
git add package.json package-lock.json tailwind.config.js src/input.css assets/site.css
git commit -m "Tailwind : build en ligne de commande vers assets/site.css

tailwindcss 3.4.19 en dépendance de développement, tailwind.config.js (content :
HTML et JS racine, assets/*.js), src/input.css et script npm build:css. Le fichier
produit est commité ; les pages passent au <link> dans le commit suivant.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2 : Prouver que `site.css` couvre tout ce que le CDN générait

Vérification unique, hors dépôt. Les 66 fichiers `cdn-css/<largeur>-<page>.css` contiennent le CSS que le CDN a réellement produit sur `main`, page par page, menu mobile ouvert puis fermé.

**Files :**
- Create (hors dépôt) : `<notes>/visuel/couverture.mjs`

- [ ] **Step 1 : écrire le comparateur de sélecteurs**

```js
// Usage : node couverture.mjs <dossier cdn-css> <chemin de assets/site.css>
// Pour chaque sélecteur de classe des feuilles du CDN, vérifie qu'il existe dans site.css.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const [dossier, siteCss] = process.argv.slice(2);
const site = readFileSync(siteCss, 'utf8');
const selecteurs = (css) => {
  const sans = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Set();
  for (const m of sans.matchAll(/(^|})\s*([^{}]+?)\s*\{/g)) {
    for (const s of m[2].split(',')) { const t = s.trim(); if (t.startsWith('.')) out.add(t); }
  }
  return out;
};
const manquants = new Map();
for (const f of readdirSync(dossier).filter((f) => f.endsWith('.css')).sort()) {
  for (const sel of selecteurs(readFileSync(join(dossier, f), 'utf8'))) {
    // on compare le sélecteur sans ses pseudo-classes/éléments : le CDN et la CLI les écrivent pareil
    if (!site.includes(sel)) manquants.set(sel, [...(manquants.get(sel) || []), f]);
  }
}
if (manquants.size === 0) { console.log('Couverture complète : tous les sélecteurs du CDN sont dans site.css'); process.exit(0); }
for (const [sel, pages] of manquants) console.log(`${sel}\n    ${pages.join(', ')}`);
console.log(`\n${manquants.size} sélecteur(s) manquant(s)`);
process.exit(1);
```

- [ ] **Step 2 : lancer**

```bash
node <notes>/visuel/couverture.mjs <notes>/visuel/cdn-css assets/site.css
```

Attendu : « Couverture complète ». Si un sélecteur manque : identifier le fichier source qui porte la classe (`grep -rl` dans la racine et `assets/`), corriger `content` dans `tailwind.config.js` ou comprendre pourquoi le texte source ne contient pas la classe entière ; relancer `npm run build:css` ; **jamais de `safelist` ajoutée sans comprendre**. Le CDN peut émettre quelques sélecteurs pour des classes présentes seulement dans le DOM à l'exécution (sans source texte) : les documenter nommément dans le compte rendu.

- [ ] **Step 3 : si `tailwind.config.js` ou `site.css` a changé, amender le commit de la Task 1**

```bash
git add tailwind.config.js assets/site.css && git commit --amend --no-edit
```

---

### Task 3 : Le test de garde (échoue tant que les pages ne sont pas migrées)

**Files :**
- Create : `test/site-css.test.mjs`

- [ ] **Step 1 : écrire le test**

```js
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
  // Mêmes sources que tailwind.config.js : HTML racine, JS racine, assets/*.js
  const sources = [
    ...PAGES.filter((p) => !SANS_TAILWIND.has(p)),
    ...readdirSync(RACINE).filter((f) => f.endsWith('.js')),
    ...readdirSync(new URL('assets/', RACINE)).filter((f) => f.endsWith('.js')).map((f) => `assets/${f}`),
  ];
  // Candidats : utilitaire-[valeur], avec variantes (hover:, md:…) et signe négatif éventuel.
  const CANDIDAT = /(?<![\w\-\[.#/\\])((?:[a-z][a-z0-9-]*:)*-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*-\[[^\]\s"'`]+\])/g;
  // Échappement CSS tel que Tailwind l'écrit : tout ce qui n'est pas [a-zA-Z0-9_-] est précédé d'un antislash.
  const echapper = (c) => c.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
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
```

- [ ] **Step 2 : vérifier qu'il échoue pour la bonne raison**

```bash
node --test test/site-css.test.mjs
```

Attendu : test 1 ÉCHOUE (« charge encore cdn.tailwindcss.com »), test 2 ÉCHOUE (« doit apparaître exactement une fois »), test 3 PASSE si la Task 1 est faite. Si le test 3 échoue en listant des candidats qui ne sont pas des classes Tailwind (texte libre, expression régulière dans un script…), resserrer `CANDIDAT` ou ajouter une liste `EXCLUS` nommée et commentée dans le test ; ne pas élargir `site.css`.

- [ ] **Step 3 : commit (test rouge, attendu)**

```bash
git add test/site-css.test.mjs
git commit -m "Test : garde-fous du Tailwind compilé (CDN absent, <link> en fin de head, classes arbitraires)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4 : Migrer les 32 pages

Édition mécanique, faite par un script jetable hors dépôt (pas d'édition à la main : 32 fichiers, trois formes d'indentation).

**Files :**
- Modify : les 32 `*.html` racine sauf `og-image.html`
- Create (hors dépôt) : `<notes>/visuel/migrer-pages.mjs`

Les trois formes rencontrées :

```html
<!-- React (index, analyses, articles, briefing) : colonne 0, config sur 3 lignes -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config={theme:{extend:{…}}}
</script>

<!-- Legacy (thématiques, légales, 3 articles legacy) : 4 espaces, config sur 1 ligne -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config={theme:{extend:{…}}}</script>

<!-- index.html et analyses.html : CDN seul, pas de config -->
```

- [ ] **Step 1 : écrire le script**

```js
// Usage : node migrer-pages.mjs <racine du dépôt>
// Retire le Play CDN et le tailwind.config inline, ajoute le <link> en dernier élément du <head>.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const racine = process.argv[2];
const CDN = /^([ \t]*)<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>[ \t]*\r?\n/m;
const CONFIG = /^[ \t]*<script>\s*tailwind\.config\s*=[\s\S]*?<\/script>[ \t]*\r?\n/m;
const FIN_HEAD = /^([ \t]*)<\/head>/m;
let faites = 0;
for (const f of readdirSync(racine).filter((f) => f.endsWith('.html')).sort()) {
  const chemin = join(racine, f);
  const avant = readFileSync(chemin, 'utf8');
  const cdn = avant.match(CDN);
  if (!cdn) { console.log(`—  ${f} (pas de CDN)`); continue; }
  const indent = cdn[1];
  let html = avant.replace(CDN, '');
  const nbConfig = (html.match(/tailwind\.config/g) || []).length;
  if (nbConfig > 1) throw new Error(`${f} : ${nbConfig} occurrences de tailwind.config, vérifier à la main`);
  if (nbConfig === 1) { html = html.replace(CONFIG, ''); if (/tailwind\.config/.test(html)) throw new Error(`${f} : tailwind.config non retiré`); }
  if (!FIN_HEAD.test(html)) throw new Error(`${f} : </head> introuvable`);
  html = html.replace(FIN_HEAD, (tout, indentHead) => `${indent}<link rel="stylesheet" href="assets/site.css">\n${indentHead}</head>`);
  writeFileSync(chemin, html);
  faites++;
  console.log(`✓  ${f}${nbConfig ? ' (CDN + config)' : ' (CDN seul)'}`);
}
console.log(`${faites} pages migrées`);
```

- [ ] **Step 2 : lancer, puis lire le diff d'une page de chaque forme**

```bash
node <notes>/visuel/migrer-pages.mjs . && git diff --stat | tail -1 && git diff index.html commodities.html analyse-ukraine-mer-noire-guerre-attrition.html a-propos.html briefing.html
```

Attendu : « 32 pages migrées » ; `og-image.html` signalée « pas de CDN » ; dans chaque diff, uniquement des lignes supprimées (`<script src=…cdn…>`, `<script>…tailwind.config…</script>`) et une ligne ajoutée juste avant `</head>`, avec l'indentation de la page. Rien d'autre ne doit bouger : `git diff --stat` doit montrer 32 fichiers, et pour chacun 1 insertion.

- [ ] **Step 3 : vérifier les tests**

```bash
npm test
```

Attendu : tous verts, dont les 3 de `test/site-css.test.mjs`.

- [ ] **Step 4 : contrôle dans le navigateur**

Serveur local (`python3 -m http.server 3000`, ou la configuration `inflexion` de `.claude/launch.json`). Ouvrir `index.html`, `commodities.html`, `expertise.html` (onglet actif : les radars Canvas), `country.html`, `analyse-ukraine-mer-noire-guerre-attrition.html`, `briefing.html`. Pour chacune : console sans erreur (en particulier aucune `ReferenceError: tailwind`), aucune requête vers `cdn.tailwindcss.com`, une requête `assets/site.css` en 200, et le dernier enfant de `document.head` qui n'est pas un `<style>` injecté par JS est bien ce `<link>`.

- [ ] **Step 5 : commit**

```bash
git add *.html
git commit -m "Pages : assets/site.css à la place du Play CDN de Tailwind

Sur les 32 pages : retrait du <script> cdn.tailwindcss.com et du tailwind.config inline
(cinq variantes, aucun utilitaire personnalisé employé), ajout du <link> en dernier
élément du <head>, là où le CDN injectait sa feuille, pour garder l'ordre de cascade.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5 : Le déploiement reconstruit `site.css`

**Files :**
- Modify : `.github/workflows/deploy-pages.yml`

- [ ] **Step 1 : chemins déclencheurs**

Dans le bloc `on.push.paths`, ajouter après `'sitemap.xml'` :

```yaml
      - 'src/**'
      - 'tailwind.config.js'
      - 'package.json'
      - 'package-lock.json'
```

- [ ] **Step 2 : étapes de build, entre « Setup Pages » et « Build site »**

```yaml
      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Tailwind CSS
        run: npm run build:css
```

Même recette que `fetch-data.yml`. L'étape « Build site » copie ensuite `assets/` tel quel : `site.css` fraîchement construit part dans `_site`. Garder `cp -r *.css _site/` (il copie `styles.css`).

- [ ] **Step 3 : valider la syntaxe YAML**

```bash
node -e "const y=require('fs').readFileSync('.github/workflows/deploy-pages.yml','utf8');console.log(y.split('\n').length,'lignes');process.exit(/Build Tailwind CSS/.test(y)&&/npm ci/.test(y)?0:1)"
```

(`js-yaml` n'est pas installé ; relire le diff à la main, indentation à 6 espaces sous `steps:`.)

- [ ] **Step 4 : commit**

```bash
git add .github/workflows/deploy-pages.yml
git commit -m "Déploiement Pages : construire assets/site.css avant la copie

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6 : `CLAUDE.md` décrit l'architecture réelle

**Files :**
- Modify : `CLAUDE.md:40` et `CLAUDE.md:46`

Le fichier est à 13 526 caractères pour un plafond de 13 500 : la modification doit **réduire** sa taille.

- [ ] **Step 1 : remplacer la ligne 40**

Avant :

```
**Tailwind CDN + `tailwind.config` inline sont sur les 32 pages** : ce n'est pas un discriminant. Le critère est `nav-shared.js` + `styles.css` (legacy) vs runtime React.
```

Après :

```
**Tailwind est compilé** : `npm run build:css` (source `src/input.css`, config `tailwind.config.js`) produit `assets/site.css`, commité et reconstruit au déploiement ; chaque page le charge en **dernier élément du `<head>`** (ordre de cascade). Plus aucun CDN ni `tailwind.config` inline (`test/site-css.test.mjs`). Le critère legacy/React est `nav-shared.js` + `styles.css` vs runtime React.
```

- [ ] **Step 2 : remplacer la ligne 46**

Avant :

```
`styles.css` contient **226 hex en dur** qui contournent ses variables `:root`, et il existe **3 variantes divergentes** du `tailwind.config` inline. Sur les articles React, le bloc `colors` de ce `tailwind.config` est **du code mort** (aucun utilitaire `brand-*`/`cool-*` n'est utilisé) : ne pas y toucher, seul `fontFamily` agit.
```

Après :

```
`styles.css` contient **226 hex en dur** qui contournent ses variables `:root`. Les anciens `tailwind.config` inline ne définissaient aucun utilitaire employé ; `font-data` vient du `<style>` de chaque page.
```

- [ ] **Step 3 : mesurer et commiter**

```bash
wc -c CLAUDE.md
git add CLAUDE.md
git commit -m "CLAUDE.md : Tailwind compilé, plus de CDN ni de config inline

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Attendu : moins de 13 500 caractères.

---

### Task 7 : Comparaison visuelle avant / après

Hors dépôt. Les captures « avant » existent déjà (faites sur `main` avant toute modification).

- [ ] **Step 1 : capturer « après »** (serveur local sur le port 3000, dépôt sur `feat/tailwind-compile`)

```bash
node <notes>/visuel/capturer.mjs <notes>/visuel/apres http://localhost:3000 1440,390
```

- [ ] **Step 2 : comparer**

```bash
python3 -I <notes>/visuel/comparer.py <notes>/visuel/avant <notes>/visuel/apres <notes>/visuel/diff
```

Attendu : 66 lignes ; différences nulles sauf contenus dynamiques. Pour chaque page non identique : ouvrir `diff/<largeur>/<page>.png` (pixels différents en rouge sur fond assombri) et qualifier l'écart — flux de sources (heure de publication, image distante), carte Leaflet, radar Canvas, horodatage — ou **régression**, auquel cas chercher la cause dans l'ordre de cascade (voir spec §3) avant toute autre hypothèse. Noter chaque écart et sa cause dans le compte rendu final.

- [ ] **Step 3 : relecture**

Relecture par un sous-agent (`superpowers:code-reviewer` ou `code-reviewer`) du diff complet `main...feat/tailwind-compile` contre la spec : pas de modification hors carte des fichiers, `<link>` en fin de `<head>` partout, `og-image.html` intacte, CLAUDE.md sous le plafond.

---

### Task 8 : Compte rendu et attente de l'accord

- [ ] **Step 1 : `npm test`** — tout vert (72 tests existants + 3).
- [ ] **Step 2 : `git log --oneline main..` ** — 5 commits (build, test, pages, déploiement, CLAUDE.md) plus celui de la spec et du plan.
- [ ] **Step 3 : écrire le compte rendu** : taille de `site.css` contre les 126 Ko du CDN, résultat de la couverture (Task 2), résultat visuel (Task 7) avec chaque écart expliqué, écarts assumés avec le prompt 2 (le `<style>` de la home reste en place ; `<link>` en fin de `<head>` ; `assets/*.js` ajouté au `content`).
- [ ] **Step 4 : ne pas pousser.** Proposer `git push -u origin feat/tailwind-compile` et l'ouverture de la PR ; attendre le « oui ».

---

## Auto-revue du plan

- Spec §3 « Version, config, input.css, script » → Task 1. « font-data » → Task 1 (thème vide) et Task 2 (le CDN produisait `.font-data` : sélecteur attendu manquant, à documenter — chaque page porte sa propre classe `.font-data`, résultat identique). « `<style>` de la home » → aucune tâche, c'est voulu. « `<link>` en fin de head », « configs inline supprimés » → Task 4. « site.css commité et reconstruit » → Tasks 1 et 5. « Test » → Task 3. « CLAUDE.md » → Task 6. Spec §5.1 → Task 2 ; §5.2 → Task 7 ; §5.3 → Task 3 ; §5.4 → Task 4 Step 4.
- Noms cohérents : `LIEN` et `SANS_TAILWIND` dans le test ; `CDN`, `CONFIG`, `FIN_HEAD` dans le script de migration ; `build:css` partout.
