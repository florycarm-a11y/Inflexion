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
  // Dans l'autre sens : une règle d'en-tête ajoutée au <style> de la home doit être reportée dans la feuille (sinon les 31 pages divergent en silence).
  const enTeteHome = [...sansArobase(home.style).matchAll(/(?:^|})\s*([^{}]+?)\s*\{/g)].map((m) => m[1].trim()).filter((sel) => /^(\.nav-link|\.mega-|\.site-header|\.nav-scrolled|\.nav-state|\.hamburger|\.mobile-overlay|\.menu-item|body\.menu-open|header :focus-visible|\.kicker)/.test(sel));
  assert.deepEqual(enTeteHome, [...SELECTEURS.slice(0, SELECTEURS.indexOf('.hamburger span')), FOCUS_HOME, ...SELECTEURS.slice(SELECTEURS.indexOf('.hamburger span'))], 'règles d\'en-tête de la home ≠ liste copiée dans header-shell.css');
  // Blocs @ : exactement un @media(hover:hover) à deux règles, un @media(prefers-reduced-motion:reduce) à une règle, un @keyframes ; aucune durée en dur.
  assert.deepEqual([...SHELL_CSS.matchAll(/@[\w-]+(?:\([^)]*\))?(?: [\w-]+)?/g)].map((m) => m[0]), ['@keyframes menu-item-in', '@media(hover:hover)', '@media(prefers-reduced-motion:reduce)']);
  assert.deepEqual(survolFeuille.trim().split('\n'), ['.nav-link:hover::after{transform:scaleX(1)}', '.mega-item:hover{background:rgba(245,237,230,.07)}']);
  assert.equal(blocMedia(SHELL_CSS, 'prefers-reduced-motion:reduce').trim(), '.mobile-overlay.open .menu-item{animation:none;opacity:1}');
  assert.deepEqual(SHELL_CSS.match(/(?<![\w.-])\d*\.?\d+m?s\b/g) || [], [], 'durée en dur dans header-shell.css');
  assert.ok(!/\.mega-menu:hover|mega-icon/.test(SHELL_CSS), 'règle proscrite dans la feuille (panneau fantôme, pastilles)'); // .hamburger span garde son transition:all (home)
});

test('assets/article-shell.js : Navigation importée de header-shell.js et ré-exportée, plus de définition locale', () => {
  assert.ok(COQUILLE.includes("import { Navigation } from './header-shell.js'"), 'import absent');
  assert.ok(COQUILLE.includes('export { h, createRoot, Navigation }'), 'ré-export absent (API publique de la coquille)');
  assert.ok(!/function Navigation\(/.test(COQUILLE), 'définition locale encore présente');
  assert.ok(COQUILLE.includes('h(Navigation)'), 'renderArticle ne rend plus Navigation');
  for (const [, url] of COQUILLE.matchAll(/from\s*'(https:\/\/esm\.sh\/react[^']*)'/g)) assert.ok(/^https:\/\/esm\.sh\/react(?:-dom)?@18\.2\.0(?:\/client)?$/.test(url), `${url} : même version que header-shell.js attendue`);
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
    // header-shell.js importe react@18.2.0 : une autre version dans la page donnerait deux instances de React et des hooks invalides.
    for (const [, url] of script.matchAll(/from\s*'(https:\/\/esm\.sh\/react[^']*)'/g)) assert.ok(/^https:\/\/esm\.sh\/react(?:-dom)?@18\.2\.0(?:\/client)?$/.test(url), `${url} : même version que header-shell.js attendue`);
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
    const jetons = html.indexOf('href="assets/design-tokens-v2.css"'), site = html.indexOf('href="assets/site.css"');
    assert.ok(jetons !== -1 && site !== -1, 'design-tokens-v2.css et site.css doivent être liées');
    assert.ok(jetons < i && i < site, 'ordre des feuilles : jetons, header-shell.css, site.css');
  });
}

test('nav-shared.js : même DOM que la Navigation de la home (classes), logique disclosure, plus de CSS d\'en-tête injecté', () => {
  const ns = sansCommentaires(lire('nav-shared.js'));
  // Toute chaîne className statique de la Navigation de la home doit se retrouver dans le balisage émis par nav-shared.js.
  // Chaîne délimitée des deux côtés : class="…" (balisage), className='…' (createElement) ou BOUTON='…' ; si la home concatène un suffixe dynamique
  // (className:'…'+(…)), la suite est libre (elle dépend de l'état), sinon la chaîne doit se fermer aussitôt.
  const classes = [...HOME_NAV.matchAll(/className:'([^']+)'(\+?)/g)].map((m) => ({ c: m[1], dynamique: m[2] === '+' }));
  assert.ok(classes.length >= 12, `${classes.length} classes extraites de la home`);
  const echapper = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const { c, dynamique } of classes) {
    const fin = dynamique ? '' : `(?:"|')`;
    assert.ok(new RegExp(`(?:class="|className='|BOUTON=')${echapper(c)}${fin}`).test(ns), `classe de la home absente de nav-shared.js ou complétée : ${c}`);
  }
  for (const c of ['site-header fixed top-[3px] left-0 right-0 z-50 bg-transparent', 'nav-state flex items-center gap-1', 'nav-state is-hidden', 'hamburger md:hidden p-2', 'mobile-overlay fixed inset-0 z-[60] flex flex-col', 'mega-menu p-5', 'aria-label="Navigation principale"', 'id="mega-panel-', "pointerType==='mouse'", "closest('.mega-trigger')", 'window.scrollY>60', "'Escape'", "setAttribute('role','dialog')", "setAttribute('aria-modal','true')", "setAttribute('aria-label','Menu')", "classList.add('menu-open')"]) {
    assert.ok(ns.includes(c), `${c} absent de nav-shared.js`);
  }
  // Entrée et sortie du survol calculées comme React (onPointerEnter/onMouseLeave de la home) : pointerover/mouseout + relatedTarget.
  // pointerenter/mouseleave natifs ne partent que d'un vrai déplacement et divergeraient de la home (contrôle CDP : 2 échecs sur 5 pages legacy).
  assert.ok(ns.includes("addEventListener('pointerover',function(e){if(e.pointerType==='mouse'&&!t.contains(e.relatedTarget))setMegaOpen(ci);})"), 'entrée du survol : pointerover filtré sur la souris et sur relatedTarget');
  assert.ok(ns.includes("addEventListener('mouseout',function(e){if(!t.contains(e.relatedTarget)&&!t.contains(document.activeElement))setMegaOpen(-1);})"), 'sortie du survol : mouseout d\'après relatedTarget, sauf si le focus est dedans');
  assert.ok(!/'pointerenter'|'mouseleave'/.test(ns), 'pointerenter/mouseleave natifs : sémantique différente de la home');
  assert.equal(ns.split('aria-controls="menu-overlay"').length - 1, 2, '« Menu » et le hamburger pointent l\'overlay');
  assert.equal(ns.split('md:max-w-2xl md:mx-auto md:w-full').length - 1, 3, 'trois conteneurs de l\'overlay en colonne');
  for (const mort of [':hover .mega-menu', '.mega-menu:hover', 'transition:all', '.mega-menu{', 'mega-cat-header', 'mega-footer', 'mega-arrow', 'mega-icon', 'mega-item-reveal', '#nav-logo', 'md-show', 'md-hide', 'nav-link-new', 'nav-scrolled-mode', 'transition-all', 'duration-300', 'modern-header', 'mobile-nav-link', 'ns-menu-item-in', 'headerScrolledBg', 'megaPanelBg', 'hamburger-wrapper', 'MEGA_FOOTERS']) {
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
  // Mesuré à la reconstruction : classes propres aux anciennes copies de Navigation (logo et carte blanche). Les utilitaires génériques retirés
  // (transition-all, duration-300, z-40, shadow-xl…) ne sont pas gardés : un autre contenu peut légitimement les réemployer.
  for (const c of ['.md\\:h-\\[65px\\]{', '.sm\\:h-\\[50px\\]{', '.shadow-\\[0_6px_18px_rgba\\(14\\2c 16\\2c 18\\2c \\.18\\)\\]']) {
    assert.ok(!site.includes(c), `${c} encore dans site.css : lancer npm run build:css`);
  }
  for (const c of ['.md\\:w-full{', '.md\\:max-w-2xl{', '.no-underline{']) assert.ok(site.includes(c), `${c} absent de site.css`);
});
