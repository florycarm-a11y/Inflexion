# En-tête à deux états et méga-menu en verre sombre : propagation aux 31 autres pages — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** donner aux 15 pages React et aux 16 pages legacy le même en-tête qu'`index.html` depuis le prompt 5 (deux états, transition restreinte, verre sombre, intitulé de groupe sans pastilles, modèle disclosure, logo 40 px, overlay en dialogue) **sans copie divergente** et **sans autre différence visible** que celles que cet en-tête implique. Spec : `docs/superpowers/specs/2026-11-16-en-tete-pages-design.md`.

**Architecture :** deux fichiers partagés copiés tels quels depuis la home, qui reste la source de vérité : `assets/header-shell.js` (le composant `Navigation`, importé par les 10 pages React autonomes et par `assets/article-shell.js`) et `assets/header-shell.css` (les règles d'en-tête, liées par les 31 pages avant leur `<style>` et avant `site.css`). Les 15 `<style>` React perdent leurs règles d'en-tête ; `nav-shared.js` émet le même DOM que la home (mêmes classes) avec la même logique d'état écrite en vanilla, et n'injecte plus de CSS d'en-tête. Chaque écriture dans une page est un remplacement de chaîne complète **à compte vérifié** (essai à blanc d'abord, jamais de chercher-remplacer global : `CLAUDE.md` §3). Un test de garde paramétré par page compare les fichiers partagés à la home et vérifie chaque page.

**Tech Stack :** Node 25/26, `tailwindcss@3.4.19` (`npm run build:css`), `node --test` (`npm test`), Chrome sans fenêtre piloté par CDP + Pillow (outils du dossier de notes partagé, hors dépôt). Serveur du worktree : `python3 -m http.server 4401 --bind 127.0.0.1`, toujours `http://127.0.0.1:4401` (3000 et 4400 servent d'autres arbres).

---

## Carte des fichiers

| Fichier | Rôle | Tâche |
| --- | --- | --- |
| `test/pages-header.test.mjs` (nouveau) | garde-fous : fichiers partagés identiques à la home, chaque page liée et sans copie, `nav-shared.js`, `styles.css`, `site.css` | 1 |
| `test/pages-motion.test.mjs` | 4 assertions adaptées (exception `:hover`, `.site-header`, bloc réduit, jetons) | 1 |
| `assets/header-shell.js` (nouveau) | `Navigation` de la home, exportée | 2 |
| `assets/header-shell.css` (nouveau) | règles d'en-tête de la home | 2 |
| 10 pages React autonomes, 5 dossiers, `assets/article-shell.js` | lien, import, copies et règles retirées, focus aligné, jetons de `briefing` | 3 |
| `nav-shared.js`, 16 pages legacy, `styles.css` | DOM et logique de la home en vanilla, lien, `.hamburger` scopé | 4 |
| `assets/site.css` | reconstruit | 5 |
| docs, note de passation, mémoire | résultats mesurés | 7 |

Outils (dossier de notes `<notes>/outils/`, copiés en fin de chantier) : `cadrage.mjs`, `inventaire-en-tete.mjs`, `capturer-etats-pages.mjs`, `compter-en-tete.mjs` (essai à blanc), `migrer-en-tete.mjs` (Task 3), `migrer-nav-shared.mjs` (Task 4), `verifier-en-tete-pages.mjs` (Task 6).

---

### Task 0 : cadrage (fait, consigné dans la spec §2)

- [x] Relevé statique des 33 pages (`cadrage.mjs`) : familles, variantes de `Navigation`, règles d'en-tête, jetons, conflits `styles.css`.
- [x] Branche `feat/header-pages` coupée d'`origin/main` `0b6cae1a` dans le worktree ; serveur `127.0.0.1:4401`.
- [ ] Relevé dynamique « avant » (`inventaire-en-tete.mjs` → `inventaire-avant.jsonl`) et base « avant » : `capturer-reveal.mjs` (33 pages × 1440/390) et `capturer-etats-pages.mjs` (32 pages × 8 états) dans le scratchpad. Résultats : section « Résultats mesurés ».

---

### Task 1 : le test de garde (échoue tant que rien n'est fait)

**Files :**
- Create : `test/pages-header.test.mjs`
- Modify : `test/pages-motion.test.mjs`

- [ ] **Step 1 : écrire `test/pages-header.test.mjs`**

```js
// Garde-fous de la propagation du prompt 5 aux 31 pages (docs/superpowers/specs/2026-11-16-en-tete-pages-design.md, §3).
// Source de vérité : la Navigation et les règles d'en-tête d'index.html ; les fichiers partagés doivent leur être identiques.
// Aucune dépendance : lit les fichiers du dépôt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const RACINE = new URL('../', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, RACINE), 'utf8');
// Les commentaires (/* */ en CSS, // en JS) sont de la prose, pas du code : retirés avant toute analyse.
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

const DOSSIERS = ['analysis-template.html', 'analyse-ukraine-mer-noire-guerre-attrition.html', 'analyse-turquie-erdogan-equilibriste.html', 'analyse-sahel-mali-niger-burkina-crise.html', 'analyse-mer-chine-taiwan-indopacifique.html'];
const ARTICLES = ['analyse-arctique-groenland-grand-jeu-polaire.html', 'analyse-cloud-ia-pme-europeennes.html', 'analyse-corridor-defense-france-inde.html', 'analyse-cuba-crise-perspectives.html', 'analyse-fta-ue-inde-traite-fiscal.html', 'analyse-madagascar-fragilite-ressources.html', 'analyse-petrole-trump-iran-ormuz.html'];
const AUTONOMES = [...ARTICLES, 'analyses.html', 'artifact-inflexion.html', 'briefing.html']; // importent Navigation elles-mêmes
const REACT = [...DOSSIERS, ...AUTONOMES];
const TOUTES = readdirSync(RACINE).filter((f) => f.endsWith('.html')).sort();
const LEGACY = TOUTES.filter((f) => lire(f).includes('<script src="nav-shared.js"></script>'));
const LIEN = '<link rel="stylesheet" href="assets/header-shell.css">';

function finDeBloc(css, debut) {
  let profondeur = 0;
  for (let j = css.indexOf('{', debut); j < css.length; j++) {
    if (css[j] === '{') profondeur++;
    else if (css[j] === '}' && --profondeur === 0) return j;
  }
  throw new Error('bloc non fermé');
}
// Contenu du premier bloc `@media(<requete>){…}` (graphie sans espace, comme home-header.test.mjs), ou null.
function blocMedia(css, requete) {
  const debut = css.indexOf(`@media(${requete})`);
  return debut === -1 ? null : css.slice(css.indexOf('{', debut) + 1, finDeBloc(css, debut));
}
// Le CSS sans ses blocs @media et @keyframes : les règles de premier niveau seules.
function sansArobase(css) {
  let reste = '', i = 0;
  for (;;) {
    const debut = css.indexOf('@', i);
    if (debut === -1) return reste + css.slice(i);
    reste += css.slice(i, debut);
    i = finDeBloc(css, debut) + 1;
  }
}
// Corps de la première règle dont le sélecteur est exactement `selecteur`.
function regle(css, selecteur) {
  const m = css.match(new RegExp(`(?:^|[\\n}])${selecteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\{([^}]*)\\}`));
  return m ? m[1] : null;
}
const partiesDe = (page) => {
  const html = lire(page);
  const m1 = html.match(/<style>([\s\S]*?)<\/style>/), m2 = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(m1 && m2, `${page} : <style> ou <script type="module"> introuvable`);
  return { html, style: sansCommentaires(m1[1]), script: sansCommentaires(m2[1]) };
};

// ── La home, source de vérité ──
const home = partiesDe('index.html');
const HOME_NAV = home.script.slice(home.script.indexOf('function Navigation('), home.script.indexOf('function Hero(')).trimEnd();
assert.ok(HOME_NAV.startsWith('function Navigation(){') && HOME_NAV.endsWith('\n}'), 'Navigation de la home mal délimitée');
const SHELL_JS = sansCommentaires(lire('assets/header-shell.js'));
const SHELL_CSS = sansCommentaires(lire('assets/header-shell.css'));
const COQUILLE = sansCommentaires(lire('assets/article-shell.js'));
// Sélecteurs d'en-tête de la home, dans l'ordre de son <style> (la règle de focus perd .v2-chrome, classe de page : voir plus bas).
const SELECTEURS = ['.kicker', '.nav-link', '.nav-link::after', '.nav-link.active::after', '.mega-trigger', '.mega-menu', '.mega-menu.mega-open', '.mega-menu::before', '.mega-item', '.site-header', '.nav-scrolled', '.nav-states', '.nav-state', '.nav-state.is-hidden', '.hamburger span', '.hamburger.open span:nth-child(1)', '.hamburger.open span:nth-child(2)', '.hamburger.open span:nth-child(3)', '.mobile-overlay', '.mobile-overlay.open', '.menu-item', '.mobile-overlay.open .menu-item', 'body.menu-open'];
const FOCUS_FEUILLE = 'header :focus-visible,.mobile-overlay :focus-visible';
const FOCUS_HOME = 'header :focus-visible,.mobile-overlay :focus-visible,.v2-chrome :focus-visible';

test('assets/header-shell.js : la Navigation de la home, telle quelle, dans un module qui importe le même React', () => {
  const debut = SHELL_JS.indexOf('export function Navigation(){');
  assert.ok(debut !== -1, 'export function Navigation(){ introuvable');
  const avant = SHELL_JS.slice(0, debut).split('\n').map((l) => l.trimEnd()).filter(Boolean);
  assert.deepEqual(avant, ["import React,{useState,useEffect,useRef} from 'https://esm.sh/react@18.2.0'", 'const h=React.createElement', 'const MEGA_NAV=window.MEGA_NAV'], 'le module ne doit contenir que l\'import, h, MEGA_NAV et Navigation');
  assert.equal(SHELL_JS.slice(debut + 'export '.length).trimEnd(), HOME_NAV, 'la Navigation du module diverge de celle d\'index.html');
  assert.ok(home.script.includes("import React,{useState,useEffect,useRef} from 'https://esm.sh/react@18.2.0'"), 'la home n\'importe plus la même URL React');
});

test('assets/header-shell.css : chaque règle identique à la règle homonyme du <style> de la home, rien de plus', () => {
  for (const s of SELECTEURS) {
    assert.ok(regle(home.style, s) !== null, `home : ${s} introuvable`);
    assert.equal(regle(SHELL_CSS, s), regle(home.style, s), `${s} diverge de la home`);
  }
  assert.equal(regle(SHELL_CSS, FOCUS_FEUILLE), regle(home.style, FOCUS_HOME), 'règle de focus du chrome');
  const kf = (css) => css.match(/@keyframes menu-item-in\{[\s\S]*?\}\}/)?.[0];
  assert.equal(kf(SHELL_CSS), kf(home.style), '@keyframes menu-item-in');
  const survolFeuille = blocMedia(SHELL_CSS, 'hover:hover'), survolHome = blocMedia(home.style, 'hover:hover');
  for (const s of ['.nav-link:hover::after', '.mega-item:hover']) assert.equal(regle(survolFeuille, s), regle(survolHome, s), `${s} (bloc hover:hover)`);
  assert.equal(regle(blocMedia(SHELL_CSS, 'prefers-reduced-motion:reduce'), '.mobile-overlay.open .menu-item'), regle(blocMedia(home.style, 'prefers-reduced-motion:reduce'), '.mobile-overlay.open .menu-item'), 'mouvement réduit');
  // Rien d'autre : la liste exacte des sélecteurs de premier niveau, dans l'ordre de la home.
  const selecteurs = [...sansArobase(SHELL_CSS).matchAll(/(?:^|})\s*([^{}]+?)\s*\{/g)].map((m) => m[1].trim());
  const attendus = [...SELECTEURS]; attendus.splice(attendus.indexOf('.hamburger span'), 0, FOCUS_FEUILLE);
  assert.deepEqual(selecteurs, attendus);
  assert.ok(SHELL_CSS.indexOf('.site-header{') < SHELL_CSS.indexOf('.nav-scrolled{'), '.nav-scrolled doit suivre .site-header');
  assert.ok(!/\.mega-menu:hover|mega-icon|transition:all/.test(SHELL_CSS), 'règle proscrite dans la feuille');
});

test('assets/article-shell.js : Navigation importée de header-shell.js et ré-exportée, plus de définition locale', () => {
  assert.ok(COQUILLE.includes("import { Navigation } from './header-shell.js'"), 'import absent');
  assert.ok(COQUILLE.includes('export { h, createRoot, Navigation }'), 'ré-export absent (API publique de la coquille)');
  assert.ok(!/function Navigation\(/.test(COQUILLE), 'définition locale encore présente');
  assert.ok(COQUILLE.includes('h(Navigation)'), 'renderArticle ne rend plus Navigation');
});

for (const page of REACT) {
  test(`${page} : en-tête partagé (lien, import, plus de copie ni de règle locale)`, () => {
    const { html, style, script } = partiesDe(page);
    assert.equal(html.split(LIEN).length - 1, 1, `${LIEN} doit apparaître exactement une fois`);
    const precedent = page === 'briefing.html' ? '<link rel="stylesheet" href="styles.css"/>' : '<link href="assets/design-tokens-v2.css" rel="stylesheet"/>';
    assert.ok(html.includes(precedent) && html.indexOf(precedent) < html.indexOf(LIEN), `le lien doit suivre ${precedent}`);
    assert.ok(html.indexOf(LIEN) < html.indexOf('<style>'), 'le lien doit précéder le <style> de la page');
    const locaux = [...style.matchAll(/(?:^|[}\n])((?:\.nav-link|\.mega-|\.nav-scrolled|\.site-header|\.hamburger|\.mobile-overlay|\.menu-item|body\.menu-open|\.nav-state|\.kicker|header :focus-visible|\.logo-scroll|@keyframes menu-item-in)[^{\n]*)\{/g)].map((m) => m[1]);
    assert.deepEqual(locaux, [], `règles d'en-tête encore dans le <style> : ${locaux.join(' ; ')}`);
    assert.ok(!/function Navigation\(/.test(script), 'copie locale de Navigation encore présente');
    if (AUTONOMES.includes(page)) {
      assert.ok(script.includes("import { Navigation } from './assets/header-shell.js'"), 'import de Navigation absent');
      assert.ok(script.includes(' h(Navigation),'), 'Navigation n\'est plus rendue');
    } else {
      assert.ok(!/\bNavigation\b/.test(script), 'un dossier ne manipule pas Navigation : renderArticle (coquille) la rend');
    }
    if (page !== 'briefing.html') assert.ok(style.includes('.v2-chrome :focus-visible{outline-color:var(--editorial-accent-text)}'), 'focus des sections sombres aligné sur la home');
    for (const ancien of ['mega-icon', 'h-[65px]', 'h-[50px]', 'logo-scroll', 'nav-link px-3 py-2 text-sm font-medium', 'mega-trigger:hover', 'mega-menu bg-']) assert.ok(!html.includes(ancien), `${ancien} encore présent`);
  });
}

test('briefing.html : les 8 jetons de chrome consommés par l\'en-tête, posés localement, identiques au fichier de jetons', () => {
  const { style } = partiesDe('briefing.html');
  const jetons = lire('assets/design-tokens-v2.css').match(/\[data-design-regime="editorial"\]\s*\{([^}]*)\}/)[1];
  for (const j of ['--chrome-ground', '--chrome-scrolled', '--chrome-border', '--chrome-text', '--chrome-text-1', '--chrome-text-2', '--editorial-accent', '--editorial-accent-text']) {
    const ref = jetons.match(new RegExp(`${j}:\\s*([^;]+);`))[1].trim();
    const local = style.match(new RegExp(`${j}:\\s*([^;}]+)`));
    assert.ok(local, `${j} non posé localement (la page ne charge pas design-tokens-v2.css)`);
    assert.equal(local[1].trim(), ref, `${j} local diverge du fichier de jetons`);
  }
});

test('16 pages legacy', () => assert.equal(LEGACY.length, 16, LEGACY.join(', ')));
for (const page of LEGACY) {
  test(`${page} : header-shell.css lié entre design-tokens-v2.css et site.css`, () => {
    const html = lire(page);
    assert.equal(html.split(LIEN).length - 1, 1, `${LIEN} doit apparaître exactement une fois`);
    const i = html.indexOf(LIEN);
    assert.ok(html.indexOf('href="assets/design-tokens-v2.css"') < i && i < html.indexOf('href="assets/site.css"'), 'ordre des feuilles');
  });
}

test('nav-shared.js : même DOM que la Navigation de la home (classes), logique disclosure, plus de CSS d\'en-tête injecté', () => {
  const ns = sansCommentaires(lire('nav-shared.js'));
  // Toute chaîne className statique de la Navigation de la home doit se retrouver dans le balisage émis par nav-shared.js.
  const classes = [...HOME_NAV.matchAll(/className:'([^']+)'/g)].map((m) => m[1]);
  assert.ok(classes.length >= 12, `${classes.length} classes extraites de la home`);
  for (const c of classes) assert.ok(ns.includes(c), `classe de la home absente de nav-shared.js : ${c}`);
  for (const c of ['site-header fixed top-[3px] left-0 right-0 z-50 bg-transparent', 'nav-state flex items-center gap-1', 'nav-state is-hidden', 'hamburger md:hidden p-2', 'mobile-overlay fixed inset-0 z-[60] flex flex-col', 'mega-menu p-5', 'aria-label="Navigation principale"', 'id="mega-panel-', "pointerType==='mouse'", "closest('.mega-trigger')", 'window.scrollY>60', "'Escape'", "setAttribute('role','dialog')", "setAttribute('aria-modal','true')", "setAttribute('aria-label','Menu')", "classList.add('menu-open')"]) {
    assert.ok(ns.includes(c), `${c} absent de nav-shared.js`);
  }
  assert.equal(ns.split('aria-controls="menu-overlay"').length - 1, 2, '« Menu » et le hamburger pointent l\'overlay');
  assert.equal(ns.split('md:max-w-2xl md:mx-auto md:w-full').length - 1, 3, 'trois conteneurs de l\'overlay en colonne');
  for (const mort of ['.mega-menu{', 'mega-cat-header', 'mega-footer', 'mega-arrow', 'mega-icon', 'mega-item-reveal', '#nav-logo', 'md-show', 'md-hide', 'nav-link-new', 'nav-scrolled-mode', 'transition-all', 'duration-300', 'modern-header', 'mobile-nav-link', 'ns-menu-item-in', 'headerScrolledBg', 'megaPanelBg', 'hamburger-wrapper', 'MEGA_FOOTERS']) {
    assert.ok(!ns.includes(mort), `${mort} encore dans nav-shared.js`);
  }
  assert.ok(ns.includes("sr.src='scroll-reveal.js'"), 'nav-shared.js doit toujours injecter scroll-reveal.js (apparitions legacy, chantier à part)');
  assert.ok(ns.includes('header.header,nav.nav-overlay,button.back-to-top{display:none!important}'), 'l\'ancien balisage doit rester masqué');
  // La région de l'en-tête (construction et logique) ne porte aucune durée en dur ; les animation-delay (ordre d'apparition des entrées, comme la home) sont exclus.
  const debut = ns.indexOf('var bronzeBar='), finConstruction = ns.indexOf('var oldPageHeader='), debutLogique = ns.indexOf('var etats='), fin = ns.indexOf("if(!document.querySelector('script[src*=\"scroll-reveal\"]'))");
  assert.ok(debut !== -1 && finConstruction > debut && debutLogique > finConstruction && fin > debutLogique, 'régions de l\'en-tête introuvables');
  const region = (ns.slice(debut, finConstruction) + ns.slice(debutLogique, fin)).replace(/animation-delay:[^;"']*/g, '');
  assert.deepEqual(region.match(/(?<![\w.-])\d*\.?\d+m?s\b/g) || [], [], 'durée en dur dans l\'en-tête legacy');
});

test('styles.css : .hamburger et .hamburger-bar de l\'ancien en-tête scopés sous .menu-trigger', () => {
  const css = lire('styles.css');
  assert.ok(css.includes('.menu-trigger .hamburger {') && css.includes('.menu-trigger .hamburger-bar {'), 'règles scopées absentes');
  assert.ok(!/^\.hamburger\s*\{/m.test(css) && !/^\.hamburger-bar\s*\{/m.test(css), '.hamburger nu encore dans styles.css : il déformerait le bouton de la home sous 768 px');
});

test('assets/site.css reconstruit : classes de l\'ancienne carte disparues, classes de l\'overlay présentes', () => {
  const site = lire('assets/site.css');
  for (const c of ['.h-\\[65px\\]', '.h-\\[50px\\]', '.border-\\[\\#4C5052\\]', '.shadow-\\[0_6px_18px_rgba\\(14\\2c 16\\2c 18\\2c \\.18\\)\\]', '.duration-300', '.transition-all']) {
    assert.ok(!site.includes(c), `${c} encore dans site.css : lancer npm run build:css`);
  }
  for (const c of ['.md\\:w-full{', '.md\\:max-w-2xl{', '.no-underline{']) assert.ok(site.includes(c), `${c} absent de site.css`);
});
```

- [ ] **Step 2 : adapter `test/pages-motion.test.mjs`** (quatre remplacements de chaîne exacte, un à la fois, `node --test test/pages-motion.test.mjs` après chacun pour voir la suite évoluer) :

1. Après `const RACINE…lire`, ajouter : `const LIEN_ENTETE = '<link rel="stylesheet" href="assets/header-shell.css">';` et `const ENTETE = sansCommentaires(lire('assets/header-shell.css'));` (juste après la définition de `sansCommentaires`).
2. Dans le test « aucune durée… trois jetons consommés » : remplacer
   `assert.ok(style.includes(\`var(${jeton})\`), \`${jeton} n'est consommé nulle part dans le <style>\`);`
   par
   `assert.ok((style + (html.includes(LIEN_ENTETE) ? ENTETE : '')).includes(\`var(${jeton})\`), \`${jeton} n'est consommé ni par le <style> ni par header-shell.css (que la page doit lier)\`);`
   et `const { style, script } = partiesDe(page);` de ce test par `const { html, style, script } = partiesDe(page);`.
3. Test des `:hover` : titre `… sauf l'ouverture du méga-menu` → `… (le méga-menu s'ouvre au clic : header-shell.js)` ; les deux lignes
   `// Exception assumée (spec §2.3) : …` et `assert.deepEqual(horsBloc, ['.mega-trigger:hover .mega-menu,.mega-menu:hover{'], …)` → `assert.deepEqual(horsBloc, [], \`:hover hors de @media(hover:hover) : ${horsBloc.join(' ; ')}\`);`.
4. Test « un seul mécanisme » : retirer `assert.ok(script.includes('site-header fixed top-[3px]'), 'l\'en-tête ne porte pas .site-header');` et `assert.ok(style.includes('.site-header{transition:all var(--motion-base)}'), 'règle .site-header absente');` ; la liste du bloc réduit `['.reveal{opacity:1;transform:none;transition:none}', '.mobile-overlay.open .menu-item{animation:none;opacity:1}']` → `['.reveal{opacity:1;transform:none;transition:none}']`. Test de la coquille : retirer `assert.ok(SHELL.includes('site-header fixed top-[3px]'), …)`. Commentaire d'en-tête du fichier : `, sauf l'ouverture du méga-menu` n'y figure pas ; rien à changer.

- [ ] **Step 3 : lancer et constater l'échec**

Run : `node --test test/pages-header.test.mjs 2>&1 | tail -5` → attendu : échec dès le chargement (`assets/header-shell.js` absent : `ENOENT`). `npm test` : `pages-motion` passe encore (les pages portent toujours leurs règles ; l'exception `.mega-trigger:hover` fait échouer 15 tests : attendu).

- [ ] **Step 4 : commit** `git add test/pages-header.test.mjs test/pages-motion.test.mjs && git commit -m "Test de garde de la propagation de l'en-tête aux 31 pages (échoue tant que rien n'est fait)"` (+ `Co-Authored-By`).

---

### Task 2 : les deux fichiers partagés, copiés depuis la home

**Files :**
- Create : `assets/header-shell.js`, `assets/header-shell.css`

- [ ] **Step 1 : `assets/header-shell.js`** — en-tête du module puis les lignes `function Navigation(){` … `}` d'`index.html` (l. 267-366 à `0b6cae1a`, commentaires compris), préfixées d'`export ` :

```js
/* En-tête du site : la Navigation d'index.html, telle quelle (deux états, méga-menu en verre en modèle disclosure, overlay dialogue).
   index.html reste la source de vérité et garde sa copie ; test/pages-header.test.mjs exige l'identité des deux textes.
   Les règles CSS vivent dans assets/header-shell.css, liée par chaque page avant son <style>. Lire window.MEGA_NAV (nav-config.js). */
import React,{useState,useEffect,useRef} from 'https://esm.sh/react@18.2.0'
const h=React.createElement
const MEGA_NAV=window.MEGA_NAV

export function Navigation(){
… (corps copié d'index.html, inchangé)
}
```

Copie par script, pas à la main : `node -e "const s=require('fs').readFileSync('index.html','utf8');const a=s.indexOf('function Navigation(){');const b=s.indexOf('\n}\n',s.indexOf('},[open])',a))+3;process.stdout.write(s.slice(a,b))"` → vérifier que le texte commence par `function Navigation(){` et finit par `)\n}\n` (la fonction contient une ligne `}` seule à l. 298 : le repère est `},[open])`, après lequel vient la fin du `return`). Puis `node --check assets/header-shell.js`.

- [ ] **Step 2 : `assets/header-shell.css`** — les règles de la home, dans l'ordre de son `<style>`, commentaires de la home conservés (la règle de focus perd `.v2-chrome`) :

```css
/* En-tête du site (prompt 5 de l'audit Starlink) : règles copiées telles quelles depuis le <style> d'index.html, source de vérité.
   Liée par chaque page APRÈS assets/design-tokens-v2.css (jetons --chrome-*, --editorial-*, --motion-*) et AVANT le <style> de la page
   et assets/site.css (dernier). test/pages-header.test.mjs exige l'identité de chaque règle avec la home. */

/* Kicker éditorial « § … » — rouge sur surfaces claires (override inline sur sombre) ; intitulé de groupe du méga-menu */
.kicker{font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;color:var(--editorial-accent)}

/* Nav links */
.nav-link{position:relative}
.nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:100%;height:2px;background:var(--editorial-accent-text);transform:scaleX(0);transition:transform var(--motion-fast)}
.nav-link.active::after{transform:scaleX(1)}

/* Méga-menu — verre sombre sur le hero espresso (audit Starlink 5.7), filet rouge en tête. Il ne s'ouvre qu'au repos : au défilement les rubriques s'effacent (.nav-state). */
.mega-trigger{position:relative}
.mega-menu{…copie…}
.mega-menu.mega-open{…copie…}
.mega-menu::before{…copie…}
.mega-item{transition:background var(--motion-fast)}
/* En-tête : seules la couleur de fond et celle du filet bas sont animées (audit 7.9) … */
.site-header{border-bottom:1px solid transparent;transition:background-color var(--motion-base),border-color var(--motion-base)}
/* Déclaré après .site-header : à spécificité égale, son raccourci border-bottom écraserait border-bottom-color. */
.nav-scrolled{background:var(--chrome-scrolled);backdrop-filter:blur(16px);border-bottom-color:var(--chrome-border)}
/* Deux états (audit 6.4) … */
.nav-states{display:grid;justify-items:end;align-items:center}
.nav-state{grid-area:1/1;transition:opacity var(--motion-base),visibility var(--motion-base)}
.nav-state.is-hidden{opacity:0;visibility:hidden;pointer-events:none}

/* Focus dans le chrome (la home ajoute .v2-chrome, classe de page : chaque page garde sa règle .v2-chrome :focus-visible) */
header :focus-visible,.mobile-overlay :focus-visible{outline-color:var(--editorial-accent-text)}

/* Hamburger */
.hamburger span{…copie…}
.hamburger.open span:nth-child(1){…}
.hamburger.open span:nth-child(2){opacity:0}
.hamburger.open span:nth-child(3){…}

/* Mobile overlay */
.mobile-overlay{…copie…}
/* À l'ouverture, seule l'opacité est animée … */
.mobile-overlay.open{opacity:1;visibility:visible;transition:opacity var(--motion-base)}
@keyframes menu-item-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
.menu-item{opacity:0}
.mobile-overlay.open .menu-item{animation:menu-item-in var(--motion-slow) forwards}
body.menu-open{overflow:hidden}

/* Survols — seulement pour un pointeur capable de survoler (audit 7.6) */
@media(hover:hover){
.nav-link:hover::after{transform:scaleX(1)}
.mega-item:hover{background:rgba(245,237,230,.07)}
}

/* Mouvement réduit : entrées du menu visibles sans animation (audit 7.5) */
@media(prefers-reduced-motion:reduce){
.mobile-overlay.open .menu-item{animation:none;opacity:1}
}
```

Les `…copie…` sont les lignes exactes d'`index.html` (l. 45-47, 65, 71-75 du `<style>`) : les coller depuis le fichier, puis `node --test test/pages-header.test.mjs` : les deux premiers tests passent (identité) ; les autres échouent encore.

- [ ] **Step 3 : commit** `git add assets/header-shell.js assets/header-shell.css && git commit -m "En-tête partagé : Navigation et règles d'en-tête de la home extraites dans assets/header-shell.js et .css"`.

---

### Task 3 : migration des 15 pages React et de la coquille, par script à comptes vérifiés

**Files :**
- Modify : 10 pages autonomes, 5 dossiers, `assets/article-shell.js`
- Tool : `<notes>/outils/migrer-en-tete.mjs` (hors dépôt)

- [ ] **Step 1 : écrire `migrer-en-tete.mjs`** (essai à blanc par défaut, `--ecrire` pour appliquer). Principe : pour chaque page, une liste de règles `{ cherche, remplace, attendu }` ; le script compte `cherche` dans le fichier, **refuse d'écrire si un compte diffère d'`attendu` sur une page quelconque** (tous les comptes de toutes les pages sont vérifiés avant la première écriture), puis remplace. Chaînes exactes (chaque règle CSS avec son `\n` final) :

```js
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const ECRIRE = process.argv.includes('--ecrire');
const md5 = (s) => createHash('md5').update(s).digest('hex').slice(0, 8);
const LIEN = '<link rel="stylesheet" href="assets/header-shell.css">\n';
const ARTICLES = ['analyse-arctique-groenland-grand-jeu-polaire.html', 'analyse-corridor-defense-france-inde.html', 'analyse-cuba-crise-perspectives.html', 'analyse-fta-ue-inde-traite-fiscal.html', 'analyse-madagascar-fragilite-ressources.html', 'analyse-petrole-trump-iran-ormuz.html'];
const DOSSIERS = ['analysis-template.html', 'analyse-ukraine-mer-noire-guerre-attrition.html', 'analyse-turquie-erdogan-equilibriste.html', 'analyse-sahel-mali-niger-burkina-crise.html', 'analyse-mer-chine-taiwan-indopacifique.html'];

// Règles CSS communes aux 14 pages (hors briefing) : retirées (remplace = '').
const CSS_COMMUN = [
  ".nav-link{position:relative}\n",
  ".nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:100%;height:2px;background:var(--chrome-text);transform:scaleX(0);transition:transform var(--motion-fast)}\n",
  ".nav-link.active::after{transform:scaleX(1)}\n",
  ".mega-trigger{position:relative}\n",
  ".mega-menu{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(8px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity var(--motion-base),transform var(--motion-base),visibility var(--motion-base);min-width:520px;z-index:60}\n",
  ".mega-trigger:hover .mega-menu,.mega-menu:hover{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}\n",
  ".mega-item{transition:background var(--motion-fast)}\n",
  ".mega-icon{width:36px;height:36px;border-radius:0;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px}\n",
  ".nav-scrolled{background:var(--chrome-scrolled);backdrop-filter:blur(16px);border-bottom:1px solid var(--chrome-border)}\n",
  ".hamburger span{display:block;width:24px;height:2px;background:var(--chrome-text);margin:5px 0;transition:all var(--motion-base)}\n",
  ".hamburger.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}\n",
  ".hamburger.open span:nth-child(2){opacity:0}\n",
  ".hamburger.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}\n",
  ".mobile-overlay.open{opacity:1;visibility:visible}\n",
  "@keyframes menu-item-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}\n",
  ".menu-item{opacity:0}\n",
  ".mobile-overlay.open .menu-item{animation:menu-item-in var(--motion-slow) forwards}\n",
  "/* En-tête au défilement : même valeur que l'ancien utilitaire Tailwind (300 ms). Le prompt 5 restreindra « all » à background-color et border-color. */\n.site-header{transition:all var(--motion-base)}\n",
  ".mobile-overlay.open .menu-item{animation:none;opacity:1}\n",
];
const OVERLAY = ".mobile-overlay{opacity:0;visibility:hidden;transition:opacity var(--motion-base),visibility var(--motion-base);height:100dvh}\n";
const OVERLAY_SANS_HAUTEUR = ".mobile-overlay{opacity:0;visibility:hidden;transition:opacity var(--motion-base),visibility var(--motion-base)}\n"; // artifact, cloud-ia
const BODY_OPEN = "body.menu-open{overflow:hidden}\n";
const INERTE = ".mobile-overlay .menu-item a{min-height:48px;display:flex;align-items:center}\n"; // règle inerte du bloc max-width (le .menu-item est lui-même le lien)
const FOCUS = { cherche: "header :focus-visible,.mobile-overlay :focus-visible,.v2-chrome :focus-visible{outline-color:var(--chrome-text)}\n", remplace: ".v2-chrome :focus-visible{outline-color:var(--editorial-accent-text)}\n" };
const SURVOL = { cherche: "/* Survols — pointeur capable de survoler seulement (audit 7.6) : sur tactile un :hover resterait collé après le toucher.\n   L'ouverture du méga-menu (.mega-trigger:hover .mega-menu) reste hors de ce bloc : sur tablette, ce :hover émulé au toucher est le seul moyen d'ouvrir le menu. */\n@media(hover:hover){\n.nav-link:hover::after{transform:scaleX(1)}\n.mega-item:hover{background:rgba(16,18,20,.06)}\n", remplace: "/* Survols — pointeur capable de survoler seulement (audit 7.6) : sur tactile un :hover resterait collé après le toucher. */\n@media(hover:hover){\n" };
const LIEN_JETONS = { cherche: '<link href="assets/design-tokens-v2.css" rel="stylesheet"/>\n', remplace: '<link href="assets/design-tokens-v2.css" rel="stylesheet"/>\n' + LIEN };
const IMPORT = { cherche: "import{createRoot}from 'https://esm.sh/react-dom@18.2.0/client'\n", remplace: "import{createRoot}from 'https://esm.sh/react-dom@18.2.0/client'\nimport { Navigation } from './assets/header-shell.js'\n" };
const TITRE_NAV = /^\/\/ ─── NAVIGATION ─+\n\n?/m; // ligne décorative avant la fonction (absente d'artifact) : comptée comme les autres
const retirer = (s) => ({ cherche: s, remplace: '', attendu: 1 });

// Fonction Navigation : de "\nfunction Navigation(){\n" à la première ligne "}" seule ; l'empreinte du bloc retiré doit être connue.
const EMPREINTES = { cd3f41e0: '6 articles', '809732a8': 'cloud-ia', d982bd42: 'analyses', '2bbcfcdd': 'artifact', b2eac77b: 'briefing' }; // md5 des 8 premiers caractères du texte sans espaces (cadrage.mjs)
function retirerNavigation(texte, page) {
  const debut = texte.indexOf('\nfunction Navigation(){\n');
  if (debut === -1) throw new Error(`${page} : function Navigation introuvable`);
  const fin = texte.indexOf('\n}\n', debut) + 3;
  const bloc = texte.slice(debut + 1, fin);
  const empreinte = md5(bloc.replace(/\s+/g, ' '));
  if (!EMPREINTES[empreinte]) throw new Error(`${page} : copie de Navigation inconnue (${empreinte})`);
  if ((bloc.match(/function /g) || []).length !== 1) throw new Error(`${page} : le bloc retiré contient une autre fonction`);
  return { texte: texte.slice(0, debut + 1) + texte.slice(fin), variante: EMPREINTES[empreinte] };
}

const PLANS = {};
for (const p of ARTICLES) PLANS[p] = [...CSS_COMMUN.map(retirer), retirer(OVERLAY), retirer(BODY_OPEN), retirer(INERTE), { ...FOCUS, attendu: 1 }, { ...SURVOL, attendu: 1 }, { ...LIEN_JETONS, attendu: 1 }, { ...IMPORT, attendu: 1 }, { cherche: TITRE_NAV, remplace: '', attendu: 1 }, { navigation: true }];
PLANS['analyse-cloud-ia-pme-europeennes.html'] = [...CSS_COMMUN.map(retirer), retirer(OVERLAY_SANS_HAUTEUR), retirer(BODY_OPEN), retirer(INERTE), { ...FOCUS, attendu: 1 }, { ...SURVOL, attendu: 1 }, { ...LIEN_JETONS, attendu: 1 }, { ...IMPORT, attendu: 1 }, { cherche: TITRE_NAV, remplace: '', attendu: 1 }, { navigation: true }];
PLANS['analyses.html'] = [...CSS_COMMUN.map(retirer), retirer(OVERLAY), retirer(BODY_OPEN), retirer(INERTE), { ...FOCUS, attendu: 1 }, { ...SURVOL, attendu: 1 }, { ...LIEN_JETONS, attendu: 1 }, { ...IMPORT, attendu: 1 }, { cherche: TITRE_NAV, remplace: '', attendu: 1 }, { navigation: true }];
PLANS['artifact-inflexion.html'] = [...CSS_COMMUN.map(retirer), retirer(OVERLAY_SANS_HAUTEUR), retirer("/* Logo : passe du blanc au naturel quand la page défile (ex transition inline, 300 ms) */\n.logo-scroll{transition:filter var(--motion-base)}\n"), { ...FOCUS, attendu: 1 }, { ...SURVOL, attendu: 1 }, { ...LIEN_JETONS, attendu: 1 }, { ...IMPORT, attendu: 1 }, { navigation: true }];
PLANS['briefing.html'] = [
  ...CSS_COMMUN.filter((s) => !/^\.nav-link::after|^\.mega-icon|^\.nav-scrolled|^\.hamburger span/.test(s)).map(retirer),
  retirer(".nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:100%;height:2px;background:#006650;transform:scaleX(0);transition:transform var(--motion-fast)}\n"),
  retirer(".mega-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px}\n"),
  retirer(".nav-scrolled{background:rgba(255,255,255,.92);backdrop-filter:blur(16px);border-bottom:1px solid #E2E5EB;box-shadow:0 1px 8px rgba(0,0,0,.04)}\n"),
  retirer(".hamburger span{display:block;width:24px;height:2px;background:#1A1F2E;margin:5px 0;transition:all var(--motion-base)}\n"),
  retirer(OVERLAY), retirer(BODY_OPEN), retirer(INERTE), retirer(".logo-scroll{transition:filter var(--motion-base)}\n"),
  { cherche: SURVOL.cherche.replace('rgba(16,18,20,.06)', 'rgba(27,107,74,.06)'), remplace: SURVOL.remplace, attendu: 1 },
  { cherche: '<link rel="stylesheet" href="styles.css"/>\n', remplace: '<link rel="stylesheet" href="styles.css"/>\n' + LIEN, attendu: 1 },
  { cherche: "/* Jetons de mouvement : briefing.html ne charge pas encore assets/design-tokens-v2.css (identité ancienne, aucun régime v2 : chantier à part ;\n   poser data-design-regime sur le body déclencherait les surcharges de styles.css et changerait la page). Mêmes valeurs que le fichier\n   de jetons, identité vérifiée par test/pages-motion.test.mjs ; à retirer quand la page passera en régime editorial. */\n:root{--motion-fast:.15s ease;--motion-base:.3s cubic-bezier(.4,0,.2,1);--motion-slow:.5s ease-out}\n",
    remplace: "/* Jetons de mouvement et de chrome : briefing.html ne charge pas encore assets/design-tokens-v2.css (identité ancienne, aucun régime v2 : chantier à part ;\n   poser data-design-regime sur le body déclencherait les surcharges de styles.css et changerait la page). Mêmes valeurs que le fichier\n   de jetons, identité vérifiée par test/pages-motion.test.mjs (mouvement) et test/pages-header.test.mjs (chrome de l'en-tête partagé) ;\n   à retirer quand la page passera en régime editorial. */\n:root{--motion-fast:.15s ease;--motion-base:.3s cubic-bezier(.4,0,.2,1);--motion-slow:.5s ease-out;\n--chrome-ground:#17100E;--chrome-scrolled:rgba(23, 16, 14, 0.94);--chrome-border:rgba(200, 149, 90, 0.22);--chrome-text:#E8E4D8;--chrome-text-1:#F5EDE6;--chrome-text-2:rgba(245, 237, 230, .70);--editorial-accent:#8E2424;--editorial-accent-text:#E05A4E}\n", attendu: 1 },
  { ...IMPORT, attendu: 1 }, { cherche: TITRE_NAV, remplace: '', attendu: 1 }, { navigation: true },
];
for (const p of DOSSIERS) PLANS[p] = [...CSS_COMMUN.map(retirer), retirer(OVERLAY), retirer(BODY_OPEN), retirer(INERTE), { ...FOCUS, attendu: 1 }, { ...SURVOL, attendu: 1 }, { ...LIEN_JETONS, attendu: 1 }];
PLANS['assets/article-shell.js'] = [
  { cherche: "import { topDimensions, scenarioWidths } from './article-model.js'\n", remplace: "import { topDimensions, scenarioWidths } from './article-model.js'\nimport { Navigation } from './header-shell.js'\n", attendu: 1 },
  { cherche: 'export { h, createRoot }\n', remplace: 'export { h, createRoot, Navigation }\n', attendu: 1 },
  { cherche: '// ─── NAVIGATION ──────────────────────────────────────────────────────────────\n\nexport function Navigation(){\n', remplace: '// ─── NAVIGATION : assets/header-shell.js (la Navigation de la home, importée et ré-exportée) ──\n\nexport function Navigation(){\n', attendu: 1 },
  { navigation: true, export: true },
];

// 1. Essai à blanc : tous les comptes, toutes les pages.
const textes = {}; let erreurs = 0;
for (const [page, regles] of Object.entries(PLANS)) {
  let t = readFileSync(page, 'utf8');
  for (const r of regles) {
    if (r.navigation) { try { const res = retirerNavigation(r.export ? t.replace('\nexport function Navigation(){\n', '\nfunction Navigation(){\n') : t, page); t = res.texte; console.log(`${page}  Navigation retirée (${res.variante})`); } catch (e) { console.error('KO ' + e.message); erreurs++; } continue; }
    const n = typeof r.cherche === 'string' ? t.split(r.cherche).length - 1 : (t.match(r.cherche) || []).length;
    if (n !== r.attendu) { console.error(`KO ${page} : ${n} ≠ ${r.attendu} pour ${String(r.cherche).slice(0, 70)}`); erreurs++; continue; }
    t = typeof r.cherche === 'string' ? t.split(r.cherche).join(r.remplace) : t.replace(r.cherche, r.remplace);
  }
  textes[page] = t;
}
if (erreurs) { console.error(`${erreurs} compte(s) inattendu(s) : rien n'est écrit.`); process.exit(1); }
console.log(`Comptes vérifiés sur ${Object.keys(PLANS).length} fichiers.`);
if (ECRIRE) { for (const [page, t] of Object.entries(textes)) writeFileSync(page, t); console.log('Écrit.'); }
```

Les valeurs des jetons de chrome dans la règle de `briefing` sont **copiées depuis `assets/design-tokens-v2.css`** (espaces compris : `rgba(23, 16, 14, 0.94)`), le test exige l'identité. Les empreintes `EMPREINTES` viennent de `cadrage.mjs` (colonne `navHash`) : les recalculer avec la même formule avant de lancer si le dépôt a bougé.

- [ ] **Step 2 : essai à blanc** : `node <notes>/outils/migrer-en-tete.mjs` depuis la racine du worktree → attendu : 16 fichiers, `Comptes vérifiés`, 11 lignes `Navigation retirée` (6 articles, cloud-ia, analyses, artifact, briefing, coquille). Tout compte inattendu : corriger le script (une chaîne de la page diffère), jamais la page.

- [ ] **Step 3 : appliquer** : `node <notes>/outils/migrer-en-tete.mjs --ecrire`.

- [ ] **Step 4 : syntaxe** : `node --check assets/article-shell.js assets/header-shell.js` ; pour chaque page, extraire le `<script type="module">` dans un `.mjs` temporaire du scratchpad et `node --check` (`for p in …; do node -e "…slice du script…" > /tmp/…/$p.mjs; node --check …; done`). Attendu : aucun message.

- [ ] **Step 5 : tests** : `node --test test/pages-header.test.mjs` → tests React, coquille et briefing passent ; legacy, nav-shared, styles.css, site.css échouent encore. `npm test` : `pages-motion` passe (exception disparue, règles parties).

- [ ] **Step 6 : commit** `git add analyses.html artifact-inflexion.html briefing.html analysis-template.html analyse-*.html assets/article-shell.js && git commit -m "Pages React : en-tête partagé (header-shell.js/.css), copies de Navigation et règles d'en-tête retirées, jetons de chrome de briefing"` (ne pas ajouter les trois `analyse-*.html` legacy : `git add` les listera inchangées, vérifier `git status` avant).

---

### Task 4 : pages legacy — `nav-shared.js`, 16 liens, `styles.css`

**Files :**
- Modify : `nav-shared.js` (régions l. 1-9, 11-40, 43-97, 114-190, 286-344), 16 pages legacy (`grep -l 'src="nav-shared.js"' *.html`), `styles.css` (l. 272, 279)
- Tool : `<notes>/outils/migrer-nav-shared.mjs`

- [ ] **Step 1 : les quatre régions de `nav-shared.js`**, remplacées chacune par une chaîne exacte à compte 1 (le script vérifie les quatre comptes avant d'écrire, comme en Task 3).

Région A — commentaire d'en-tête (l. 1-6) :
```js
/**
 * nav-shared.js — Coquille de navigation des pages legacy (sans React).
 * Émet le MÊME DOM que la Navigation de la home (assets/header-shell.js : mêmes classes, mêmes id, mêmes aria-*),
 * stylé par assets/header-shell.css (liée par la page) et assets/site.css ; la logique d'état (défilement, méga-menu
 * « disclosure », overlay dialogue) est réécrite ici en vanilla. Construit aussi le hero et le pied de page (thème T).
 * Include AFTER app.js and data-loader.js, et après nav-config.js (window.MEGA_NAV).
 */
```

Région B — `var THEMES={…};` (l. 11-40) : seules les clés du hero et du pied restent.
```js
var THEMES={
  v1:{
    accent:'#006650',
    heroBg:'#006650', heroLabel:'#33B894', heroTitle:'#fff', heroSub:'rgba(255,255,255,.5)',
    footerBg:'#F7F8FA', footerBorder:'#E2E5EB', footerText:'#5A6178', footerTitle:'#1A1F2E', footerTag:'rgba(90,97,120,.4)',
    fontDisplay:'Libre Baskerville,Georgia,serif', fontBody:'Inter,sans-serif'
  },
  v2:{
    accent:'#8E2424',
    heroBg:'#17100E', heroLabel:'#9AA0A4', heroTitle:'#E8E4D8', heroSub:'rgba(232,228,216,.55)',
    footerBg:'#17100E', footerBorder:'rgba(232,228,216,.12)', footerText:'#9AA0A4', footerTitle:'#E8E4D8', footerTag:'rgba(154,160,164,.6)',
    fontDisplay:'Archivo,Georgia,serif', fontBody:'IBM Plex Sans,Inter,sans-serif'
  }
};
```

Région C — CSS injecté (l. 43-97, de `// ── Inject required CSS` à `document.head.appendChild(css);`) :
```js
// ── CSS du hero et du pied de page (l'en-tête et l'overlay sont stylés par assets/header-shell.css, liée par la page) ──
var css=document.createElement('style');
css.textContent=
'.ns-footer-link:hover{color:'+T.accent+'!important}\n'+
'@keyframes ns-fade-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}\n'+
'.ns-anim{animation:ns-fade-up .6s ease-out both}\n'+
'.ns-anim-d1{animation-delay:.1s}.ns-anim-d2{animation-delay:.2s}\n'+
'/* Hide old elements */\n'+
'header.header,nav.nav-overlay,button.back-to-top{display:none!important}\n';
document.head.appendChild(css);
```

Région D — construction (l. 114-190, de `// ── Build Bronze Top Bar ──` à `header.after(overlay);`) :
```js
// ── Barre rouge, en-tête à deux états, méga-menu, overlay : même DOM que la Navigation de la home ──
var bronzeBar=document.createElement('div');
bronzeBar.className='fixed top-0 left-0 right-0 z-[51] h-[3px] bg-[var(--editorial-accent)]';
document.body.insertBefore(bronzeBar,document.body.firstChild);

var LOGO='<img src="logo-header.png" alt="Inflexion" class="h-10 w-auto" style="filter:brightness(10) saturate(0)"/>';
var BOUTON='nav-link px-3 py-2 text-sm transition-colors select-none text-[var(--chrome-text-2)] hover:text-[var(--chrome-text-1)] focus-visible:text-[var(--chrome-text-1)] bg-transparent border-0 cursor-pointer';
var megaHTML=MEGA_NAV.map(function(cat,ci){
var isWide=cat.children.length>3;
var entrees=cat.children.map(function(item){
return '<a href="'+item.href+'" class="mega-item flex flex-col px-3 py-2.5 no-underline">'+
'<span class="text-sm font-semibold text-[var(--chrome-text-1)]">'+item.label+'</span>'+
'<span class="text-xs text-[var(--chrome-text-2)] mt-0.5">'+item.desc+'</span></a>';
}).join('');
return '<div class="mega-trigger">'+
'<button type="button" aria-expanded="false" aria-controls="mega-panel-'+ci+'" class="'+BOUTON+'">'+cat.label+'</button>'+
'<div id="mega-panel-'+ci+'" class="mega-menu p-5" style="min-width:'+(isWide?'440px':'340px')+'">'+
'<p class="kicker mb-3 px-3" style="color:var(--editorial-accent-text)">'+cat.label+'</p>'+
'<div class="'+(isWide?'grid grid-cols-2 gap-1':'grid gap-1')+'">'+entrees+'</div></div></div>';
}).join('');

var header=document.createElement('header');
header.className='site-header fixed top-[3px] left-0 right-0 z-50 bg-transparent';
header.innerHTML=
'<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="flex items-center justify-between h-16">'+
'<a href="index.html" class="flex items-center gap-2">'+LOGO+'</a>'+
'<nav class="hidden md:flex items-center gap-1" aria-label="Navigation principale">'+
'<div class="nav-states"><div class="nav-state flex items-center gap-1">'+megaHTML+'</div>'+
'<div class="nav-state is-hidden"><button type="button" aria-expanded="false" aria-controls="menu-overlay" class="'+BOUTON+'">Menu</button></div></div>'+
'<a href="premium.html" class="ml-4 px-4 py-2 bg-[var(--editorial-accent)] hover:bg-[#6E1B1B] text-[var(--chrome-text-1)] font-semibold text-sm transition-colors">Réserver un diagnostic</a>'+
'</nav>'+
'<button class="hamburger md:hidden p-2" aria-label="Menu" aria-expanded="false" aria-controls="menu-overlay"><span></span><span></span><span></span></button>'+
'</div></div>';
document.body.insertBefore(header,bronzeBar.nextSibling);

var overlay=document.createElement('div');
overlay.id='menu-overlay';
overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Menu');
overlay.className='mobile-overlay fixed inset-0 z-[60] flex flex-col';
overlay.style.backgroundColor='var(--chrome-ground)';
var liensOverlay=MEGA_NAV.map(function(cat,ci){
return '<p class="menu-item text-xs uppercase tracking-[.2em] text-[var(--editorial-accent-text)] font-semibold mb-3'+(ci>0?' mt-8':'')+'" style="animation-delay:'+(0.05+ci*0.18)+'s">'+cat.label+'</p>'+
cat.children.map(function(item,ii){
return '<a href="'+item.href+'" class="menu-item flex items-center gap-3 py-3 text-white/90 hover:text-white transition-colors border-b border-white/8" style="animation-delay:'+(0.08+ci*0.18+ii*0.05)+'s">'+
'<span class="w-8 h-8 bg-white/10 flex items-center justify-center text-xs font-semibold text-white/70" style="font-family:\'IBM Plex Mono\',monospace">'+item.icon+'</span>'+
'<span class="text-base sm:text-lg md:text-[20px]">'+item.label+'</span></a>';
}).join('');
}).join('');
overlay.innerHTML=
'<div class="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0 md:max-w-2xl md:mx-auto md:w-full">'+
'<img src="logo-header.png" alt="Inflexion" class="h-8 w-auto" style="filter:brightness(10) saturate(0)"/>'+
'<button class="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="Fermer">'+
'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="text-white"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>'+
'<div class="flex-1 overflow-y-auto px-6 pt-2 pb-4 md:max-w-2xl md:mx-auto md:w-full">'+liensOverlay+'</div>'+
'<div class="px-6 pt-4 pb-20 flex flex-col gap-3 flex-shrink-0 md:max-w-2xl md:mx-auto md:w-full">'+
'<a href="premium.html" class="menu-item block w-full text-center px-6 py-3.5 bg-[var(--editorial-accent)] hover:bg-[#6E1B1B] text-[var(--chrome-text-1)] font-semibold transition-colors text-base" style="animation-delay:0.8s">Réserver un diagnostic</a></div>';
header.after(overlay);
```

Région E — logique (l. 286-344, de `// ── Scroll Handler ──` à la ligne `overlay.querySelectorAll('a').forEach(…toggleMobile(false)…);`) :
```js
// ── Logique d'état : la même que la Navigation de la home, en vanilla ──
var etats=header.querySelectorAll('.nav-state');
var triggers=[].slice.call(header.querySelectorAll('.mega-trigger'));
var boutonMenu=etats[1].querySelector('button');
var hamburger=header.querySelector('button.hamburger');
var croix=overlay.querySelector('button');
var megaOpen=-1, scrolled=false, overlayOuvert=false, ouvreur=null;

// Méga-menu « disclosure » : le clic bascule (souris, toucher, Entrée, Espace), Échap ferme et rend le focus ; le survol n'ouvre que pour une vraie souris.
function fermerDehors(e){if(!(e.target.closest&&e.target.closest('.mega-trigger')))setMegaOpen(-1);}
function echapDocument(e){if(e.key==='Escape')setMegaOpen(-1);}
function setMegaOpen(i){
if(i===megaOpen)return;
var avant=megaOpen;megaOpen=i;
triggers.forEach(function(t,ci){
t.querySelector('button').setAttribute('aria-expanded',ci===i?'true':'false');
t.querySelector('.mega-menu').classList.toggle('mega-open',ci===i);
});
if(avant<0&&i>=0){document.addEventListener('pointerdown',fermerDehors);document.addEventListener('keydown',echapDocument);}
if(avant>=0&&i<0){document.removeEventListener('pointerdown',fermerDehors);document.removeEventListener('keydown',echapDocument);}
}
triggers.forEach(function(t,ci){
var b=t.querySelector('button');
b.addEventListener('click',function(){setMegaOpen(megaOpen===ci?-1:ci);});
t.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')setMegaOpen(ci);});
t.addEventListener('mouseleave',function(){if(!t.contains(document.activeElement))setMegaOpen(-1);});
t.addEventListener('focusout',function(e){if(!t.contains(e.relatedTarget))setMegaOpen(-1);});
t.addEventListener('keydown',function(e){if(e.key==='Escape'&&megaOpen===ci){setMegaOpen(-1);b.focus();}});
});

// Deux états : au-delà de 60 px, les rubriques s'effacent et « Menu » prend leur place ; un panneau ouvert se ferme.
function onScroll(){
var s=window.scrollY>60;
if(s===scrolled)return;
scrolled=s;
header.classList.toggle('nav-scrolled',s);header.classList.toggle('bg-transparent',!s);
etats[0].classList.toggle('is-hidden',s);etats[1].classList.toggle('is-hidden',!s);
if(s)setMegaOpen(-1);
}
window.addEventListener('scroll',onScroll,{passive:true});
onScroll();

// Overlay : dialogue plein écran ; le focus entre sur la croix, Échap ferme, le focus revient à l'ouvreur (repli : le logo).
function echapOverlay(e){if(e.key==='Escape')setOpen(false);}
function setOpen(o){
if(o===overlayOuvert)return;
overlayOuvert=o;
overlay.classList.toggle('open',o);hamburger.classList.toggle('open',o);
hamburger.setAttribute('aria-expanded',o?'true':'false');boutonMenu.setAttribute('aria-expanded',o?'true':'false');
if(o){
document.body.classList.add('menu-open');document.addEventListener('keydown',echapOverlay);
croix.focus();
}else{
document.body.classList.remove('menu-open');document.removeEventListener('keydown',echapOverlay);
if(ouvreur)ouvreur.focus();
if(document.activeElement!==ouvreur)header.querySelector('a').focus();
}
}
boutonMenu.addEventListener('click',function(){ouvreur=boutonMenu;setOpen(true);});
hamburger.addEventListener('click',function(){ouvreur=hamburger;setOpen(!overlayOuvert);});
croix.addEventListener('click',function(){setOpen(false);});
[].forEach.call(overlay.querySelectorAll('a'),function(a){a.addEventListener('click',function(){setOpen(false);});});
```

Le script `migrer-nav-shared.mjs` lit `nav-shared.js`, vérifie que chacune des cinq chaînes « cherche » (le texte exact actuel des régions A à E, copié depuis le fichier) apparaît une fois, remplace, écrit, puis `node --check nav-shared.js`. Les régions hero (l. 192-237) et pied (l. 238-284) et l'injection de `scroll-reveal.js` (l. 346-349) ne sont pas touchées.

- [ ] **Step 2 : les 16 pages legacy** : dans le même script, pour chaque page listée par `grep -l 'src="nav-shared.js"' *.html`, remplacer `    <link rel="stylesheet" href="assets/design-tokens-v2.css">\n` (compte 1 chacune) par la même ligne suivie de `    <link rel="stylesheet" href="assets/header-shell.css">\n`.

- [ ] **Step 3 : `styles.css`** : remplacer `\n.hamburger {\n` par `\n.menu-trigger .hamburger {\n` et `\n.hamburger-bar {\n` par `\n.menu-trigger .hamburger-bar {\n` (compte 1 chacun ; le commentaire `/* Hamburger icon - always visible */` reste).

- [ ] **Step 4 : tests** : `node --test test/pages-header.test.mjs` → tout passe sauf `site.css` (reconstruit en Task 5). `node --check nav-shared.js`.

- [ ] **Step 5 : commit** `git add nav-shared.js styles.css a-propos.html ai-tech.html cgu.html commodities.html confidentialite.html country.html crypto.html etf.html expertise.html geopolitics.html markets.html mentions-legales.html premium.html analyse-droits-douane-trump-groenland.html analyse-ia-rempart-marches.html analyse-or-bitcoin-divergence.html && git commit -m "Pages legacy : nav-shared.js émet l'en-tête de la home (DOM, disclosure, overlay dialogue), header-shell.css liée, .hamburger de styles.css scopé"`.

---

### Task 5 : Tailwind reconstruit, suite complète au vert

- [ ] **Step 1** : `npm run build:css` ; `git diff --stat assets/site.css` ; vérifier les classes disparues (`grep -c 'h-\\\[65px\\\]' assets/site.css` → 0 ; `duration-300`, `transition-all` → 0) et présentes (`md\:w-full`, `no-underline`). Relever dans la section « Résultats mesurés » la liste exacte des classes retirées (`diff <(grep -o '\.[a-zA-Z0-9\\:_\[\]#().,%/-]*{' avant) <(… après)`), et ajuster la liste du dernier test de `pages-header` si une classe prévue survit ailleurs (`text-[#9AA0A4]` vit dans le corps d'`artifact` : non listée, exprès).
- [ ] **Step 2** : `npm test` → attendu : 149 anciens (dont `pages-motion` adapté) + nouveaux, 0 échec. Le nouveau test **doit échouer sur `main`** : `git stash` interdit (pile partagée) → `git worktree` interdit (disque) → vérifier à la place sur une copie : `mkdir -p /tmp/…/main && git archive origin/main | tar -x -C /tmp/…/main && cp test/pages-header.test.mjs /tmp/…/main/test/ && (cd /tmp/…/main && node --test test/pages-header.test.mjs 2>&1 | tail -3)` → échecs attendus.
- [ ] **Step 3 : commit** `git add assets/site.css test/pages-header.test.mjs && git commit -m "Tailwind reconstruit : classes de l'ancienne carte du méga-menu disparues"`.

---

### Task 6 : vérification visuelle, contrôle CDP, contrastes, volet navigateur

- [ ] **Step 1 : captures « après »** (serveur `127.0.0.1:4401`, même arbre) : `REPO=$PWD node <notes>/visuel/capturer-reveal.mjs <scratch>/captures/apres-pages http://127.0.0.1:4401` (33 pages × 2) et `REPO=$PWD node <notes>/outils/capturer-etats-pages.mjs <scratch>/captures/apres-etats http://127.0.0.1:4401` (32 × 8). Puis `python3 -I <notes>/visuel/comparer.py avant-pages apres-pages diff-pages` et idem pour les états. **Attendu** : `index` et `og-image` **0 px** aux deux largeurs ; chaque autre page entière : boîte de différence **contenue dans y ≤ 67 px** (bande de l'en-tête) ; états : `en-tete` idem ; `mega-*` : en-tête + panneau ; `en-tete-defile` : en-tête ; `overlay` 1440 : « aucun bouton » avant → ouvert après ; `overlay` 390 : couleurs, monogrammes, colonne. Toute boîte qui descend sous 67 px sur une page entière est une régression à expliquer ou corriger. Mesurer sur un `mega-analyses` legacy et sur celui de la home la hauteur du panneau (interlignage du kicker, spec §2.5).
- [ ] **Step 2 : contrôle CDP** : `verifier-en-tete-pages.mjs` = `verifier-en-tete.mjs` où `index.html` devient le paramètre `page` (`node verifier-en-tete-pages.mjs <page> [base]`), même 41 vérifications. Lancer sur `analyses.html`, `analyse-petrole-trump-iran-ormuz.html`, `briefing.html`, `artifact-inflexion.html`, `analyse-ukraine-mer-noire-guerre-attrition.html`, `geopolitics.html`, `expertise.html`, `premium.html`, `cgu.html`, `analyse-droits-douane-trump-groenland.html`. Attendu : 41/41 chacune (sur `briefing`, le fond derrière le verre n'est pas espresso : les vérifications de couleur de l'en-tête défilé lisent les jetons locaux, mêmes valeurs). Console : aucune erreur nouvelle.
- [ ] **Step 3 : contrastes** : `python3 -I <notes>/visuel/contrastes.py <apres-etats>/1440/<page>--mega-analyses.png x0 y0 x1 y1` sur `geopolitics`, `analyse-petrole-trump-iran-ormuz`, `analyse-ukraine…`, `briefing` (panneaux Analyses et Intelligence ; rectangle lu dans la capture). Attendu : libellés et descriptions ≥ 4,5:1 partout.
- [ ] **Step 4 : volet navigateur** (onglet actif, `fetch(url,{cache:'reload'})` d'abord) : `geopolitics.html` et `analyse-petrole-trump-iran-ormuz.html` à 1440 × 900 : survol, clic, Échap (anneau de focus), défilement → « Menu », overlay en colonne, Échap ; `analyse-ukraine…` : idem rapide ; 375 × 812 : hamburger, overlay, Échap. `prefers-reduced-motion: reduce` émulé (CDP, Step 2 le couvre).
- [ ] **Step 5** : toute régression → correction par remplacement à compte vérifié, test durci, captures rejouées (Task 2 bis à ouvrir dans ce plan).

---

### Task 7 : relectures, documentation, note, mémoire, attente du « oui »

- [ ] **Step 1 : relectures** par sous-agent : conformité à la spec §3 (diff `origin/main..HEAD`, périmètre : ni `index.html`, ni `home-header.test.mjs`, ni `nav-config.js`, ni les jetons, ni hero/pied de `nav-shared.js`) ; qualité (`superpowers:code-reviewer`) sur `nav-shared.js` et `pages-header.test.mjs`. Corrections éventuelles en Task 2 bis.
- [ ] **Step 2 : docs** : spec (statut, écarts constatés, §2.9 → résultats), plan (« Résultats mesurés » : comptes, diffs, CDP, contrastes, `site.css`), commit « Spec et plan de la propagation de l'en-tête : résultats mesurés ».
- [ ] **Step 3 : note de passation** `<notes>/2026-11-16-en-tete-pages.md` (fait, écarts, pièges trouvés, preuves, outils copiés dans `<notes>/outils/`) ; mémoire `project_audit_starlink.md` (propagation faite, branche, PR) ; captures du scratchpad supprimées après comparaison (disque).
- [ ] **Step 4 : message à la personne** : compte des pages, écarts assumés (`briefing` en chrome v2 sur corps ancien, CTA d'`artifact`, kicker legacy, `CLAUDE.md` §4), suites. **Attendre le « oui »** avant `git push -u origin feat/header-pages` et `gh pr create --base main` (description en français, `🤖 Generated with [Claude Code](https://claude.com/claude-code)`).

---

## Résultats mesurés (2026-11-16)

(rempli au fil de l'exécution)
