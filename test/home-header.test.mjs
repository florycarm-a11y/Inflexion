// Garde-fous du prompt 5 de l'audit Starlink (docs/superpowers/specs/2026-11-16-en-tete-mega-menu-design.md, §3).
// Aucune dépendance : lit les fichiers du dépôt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const RACINE = new URL('../', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, RACINE), 'utf8');
const html = lire('index.html');
const extraire = (regex, nom) => { const m = html.match(regex); if (!m) throw new Error(`${nom} introuvable dans index.html`); return m[1]; };
// Les commentaires (/* */ en CSS, // en JS) sont de la prose, pas du code : retirés avant toute analyse.
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const style = sansCommentaires(extraire(/<style>([\s\S]*?)<\/style>/, 'le <style>'));
const script = sansCommentaires(extraire(/<script type="module">([\s\S]*?)<\/script>/, 'le <script type="module">'));
// Le composant Navigation seul : les mêmes classes (bg-[#FFFFFF], item.icon…) sont légitimes ailleurs dans la page.
const debutNav = script.indexOf('function Navigation(');
const finNav = script.indexOf('function Hero(');
if (debutNav === -1 || finNav === -1) throw new Error('Navigation() ou Hero() introuvable');
const navigation = script.slice(debutNav, finNav);
const site = lire('assets/site.css');

// Index de l'accolade qui ferme le bloc ouvert juste après `debut` (accolades équilibrées).
function finDeBloc(css, debut) {
  let profondeur = 0;
  for (let j = css.indexOf('{', debut); j < css.length; j++) {
    if (css[j] === '{') profondeur++;
    else if (css[j] === '}' && --profondeur === 0) return j;
  }
  throw new Error('bloc non fermé');
}
// Contenu du premier bloc `@media(<requete>){…}` (graphie sans espace, comme home-motion.test.mjs), ou null.
function blocMedia(css, requete) {
  const debut = css.indexOf(`@media(${requete})`);
  return debut === -1 ? null : css.slice(css.indexOf('{', debut) + 1, finDeBloc(css, debut));
}
// Corps de la première règle dont le sélecteur est exactement `selecteur` (hors blocs @media imbriqués : on cherche `selecteur{`).
function regle(css, selecteur) {
  const m = css.match(new RegExp(`(?:^|[\\n}])${selecteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\{([^}]*)\\}`));
  return m ? m[1] : null;
}

test('en-tête : transition limitée à background-color et border-color, bordure transparente au repos', () => {
  const header = regle(style, '.site-header');
  assert.ok(header, '.site-header introuvable');
  assert.equal(header, 'border-bottom:1px solid transparent;transition:background-color var(--motion-base),border-color var(--motion-base)');
  assert.ok(!/\.site-header\{[^}]*transition:all/.test(style), 'transition:all encore sur .site-header');
  const defile = regle(style, '.nav-scrolled');
  assert.ok(defile, '.nav-scrolled introuvable');
  assert.ok(defile.includes('border-bottom-color:var(--chrome-border)'), '.nav-scrolled doit ne changer que la couleur du filet (border-bottom-color)');
  assert.ok(!defile.includes('border-bottom:1px solid'), '.nav-scrolled ne doit plus créer la bordure : elle existe au repos, transparente');
  // Même spécificité : le raccourci border-bottom de .site-header écraserait border-bottom-color s'il venait après (filet perdu au défilement, vu au pixel).
  assert.ok(style.indexOf('.site-header{') < style.indexOf('.nav-scrolled{'), '.nav-scrolled doit être déclaré après .site-header');
});

test('en-tête : deux états superposés (rubriques, bouton Menu), opacité en --motion-base, jamais de transition Tailwind sur un état', () => {
  assert.equal(regle(style, '.nav-states'), 'display:grid;justify-items:end;align-items:center');
  assert.equal(regle(style, '.nav-state'), 'grid-area:1/1;transition:opacity var(--motion-base),visibility var(--motion-base)');
  assert.equal(regle(style, '.nav-state.is-hidden'), 'opacity:0;visibility:hidden;pointer-events:none');
  assert.ok(navigation.includes("className:'nav-state flex items-center gap-1'+(scrolled?' is-hidden':'')"), 'état « rubriques » masqué quand scrolled');
  assert.ok(navigation.includes("className:'nav-state'+(scrolled?'':' is-hidden')"), 'état « compact » masqué au repos');
  const menu = navigation.match(/h\('button',\{([^}]*\}[^}]*)\},'Menu'\)/);
  assert.ok(menu, 'bouton « Menu » introuvable');
  assert.ok(menu[1].includes('setOpen(true)'), 'le bouton « Menu » doit ouvrir l\'overlay');
  assert.ok(menu[1].includes("'aria-expanded':open") && menu[1].includes("'aria-controls':'menu-overlay'"), 'aria-expanded / aria-controls du bouton « Menu »');
  assert.ok(navigation.includes("id:'menu-overlay'"), 'l\'overlay doit porter id="menu-overlay"');
  assert.ok(navigation.includes('window.scrollY>60'), 'le seuil de 60 px doit rester');
  assert.ok(navigation.includes('if(scrolled)setMegaOpen(-1)'), 'un panneau ouvert doit se fermer quand les rubriques s\'effacent (visibility:visible du panneau battrait l\'héritage)');
  // site.css (dernier <link>) : une classe transition-* sur un .nav-state écraserait la transition d'opacité du <style>.
  const etats = navigation.match(/className:'nav-state(?:\s[^']*)?'/g) || []; // pas nav-states (le conteneur)
  assert.equal(etats.length, 2, `deux éléments .nav-state attendus, ${etats.length} trouvés`);
  for (const e of etats) assert.ok(!/\btransition-/.test(e), `classe Tailwind transition-* sur un état : ${e}`);
});

test('méga-menu : verre sombre, bordure 1 px, filet rouge conservé, libellés texte-1, descriptions texte-2', () => {
  const panneau = regle(style, '.mega-menu');
  assert.ok(panneau, '.mega-menu introuvable');
  for (const attendu of ['background:rgba(23,16,14,.78)', 'backdrop-filter:blur(24px) saturate(1.4)', 'border:1px solid var(--chrome-border)', 'min-width:340px', 'z-index:60']) {
    assert.ok(panneau.includes(attendu), `.mega-menu : ${attendu} manque`);
  }
  assert.ok(/\.mega-menu::before\{[^}]*height:2px;[^}]*background:var\(--editorial-accent\)/.test(style), 'filet rouge du haut (.mega-menu::before) perdu');
  assert.ok(navigation.includes("className:'mega-menu '+(megaOpen===ci?'mega-open ':'')+'p-5'"), 'le panneau ne doit plus porter que p-5 (fond, bordure et ombre viennent du <style>)');
  for (const ancien of ['bg-[#FFFFFF]', 'shadow-[', 'border-[var(--credibility-band)]', 'text-[#101214]', 'text-[#4C5052]', 'bg-[#F1E7DE]']) {
    assert.ok(!navigation.includes(ancien), `${ancien} encore dans Navigation (carte blanche)`);
  }
  assert.ok(navigation.includes("className:'text-sm font-semibold text-[var(--chrome-text-1)]'},item.label)"), 'libellé en --chrome-text-1');
  assert.ok(navigation.includes("className:'text-xs text-[var(--chrome-text-2)] mt-0.5'},item.desc)"), 'description en --chrome-text-2');
  const survol = blocMedia(style, 'hover:hover');
  assert.ok(survol && survol.includes('.mega-item:hover{background:rgba(245,237,230,.07)}'), 'survol d\'une entrée : voile clair (le rosé à 6 % était pensé pour un fond blanc)');
});

test('méga-menu : plus de pastilles, un intitulé de groupe en Plex Mono 12 px majuscules en tête de chaque panneau', () => {
  assert.ok(!(style + script).includes('mega-icon'), 'mega-icon encore présent (règle ou span)');
  const titre = "h('p',{className:'kicker mb-3 px-3',style:{color:'var(--editorial-accent-text)'}},cat.label)";
  assert.ok(navigation.includes(titre), 'intitulé de groupe (kicker, cat.label) absent');
  assert.ok(navigation.indexOf(titre) < navigation.indexOf("isWide?'grid grid-cols-2 gap-1'"), 'l\'intitulé doit précéder la grille des entrées');
  const kicker = regle(style, '.kicker');
  assert.ok(kicker, '.kicker introuvable');
  for (const attendu of ["font-family:'IBM Plex Mono'", 'font-size:12px', 'text-transform:uppercase']) {
    assert.ok(kicker.includes(attendu), `.kicker : ${attendu} manque`);
  }
  assert.ok(navigation.includes("className:'mega-item flex flex-col px-3 py-2.5 no-underline'"), 'l\'entrée est elle-même la colonne libellé + description');
  assert.ok(navigation.includes('item.icon'), 'item.icon doit rester consommé par l\'overlay (le champ de nav-config.js sert aux autres pages)');
});

test('méga-menu : clic bascule, Échap ferme et rend le focus, survol souris seule, pas d\'ouverture au focus, clic hors du panneau ferme', () => {
  assert.ok(navigation.includes('onClick:()=>setMegaOpen(megaOpen===ci?-1:ci)'), 'onClick de bascule absent sur les boutons de rubrique');
  assert.ok(navigation.includes("onPointerEnter:(e)=>{if(e.pointerType==='mouse')setMegaOpen(ci)}"), 'survol : onPointerEnter filtré sur pointerType mouse');
  assert.ok(!navigation.includes('onMouseEnter:'), 'onMouseEnter doit disparaître (survol émulé d\'un toucher)');
  assert.ok(!navigation.includes('onFocus:'), 'onFocus doit disparaître (focus posé par un toucher Android, puis clic : ouvre puis ferme)');
  assert.ok(navigation.includes("if(e.key==='Escape'&&megaOpen===ci){setMegaOpen(-1);e.currentTarget.querySelector('button').focus()}"), 'Échap : ferme ce panneau et rend le focus au bouton');
  assert.ok(!navigation.includes('.blur()'), 'plus de blur() : le focus ne doit pas tomber sur body');
  assert.ok(navigation.includes("document.addEventListener('pointerdown',fn)") && navigation.includes("closest?.('.mega-trigger')"), 'écouteur pointerdown hors du panneau absent');
});

test('logo à 40 px, overlay : Échap, retour du focus, colonne centrée sur ordinateur', () => {
  const logos = navigation.match(/src:'logo-header\.png',alt:'Inflexion',className:'([^']*)'/g) || [];
  assert.equal(logos.length, 2, 'deux logos dans Navigation (en-tête, overlay)');
  assert.ok(logos[0].endsWith("className:'h-10 w-auto'"), `logo de l'en-tête : h-10 w-auto attendu, trouvé ${logos[0]}`);
  assert.ok(!html.includes('h-[65px]') && !html.includes('h-[50px]'), 'anciennes hauteurs du logo encore présentes');
  assert.ok(navigation.includes("if(e.key==='Escape')setOpen(false)"), 'Échap ne ferme pas l\'overlay');
  assert.ok(navigation.includes('ouvreur.current?.focus()'), 'le focus doit revenir au bouton qui a ouvert l\'overlay');
  // md:w-full obligatoire : en colonne flex, les marges automatiques annulent l'étirement et le conteneur se rétrécit au contenu (248 px vu en capture).
  assert.equal((navigation.match(/md:max-w-2xl md:mx-auto md:w-full/g) || []).length, 3, 'les trois conteneurs de l\'overlay forment une colonne de 672 px sur ordinateur');
});

test('assets/site.css reconstruit : classes nouvelles présentes, classes de la carte blanche disparues', () => {
  assert.ok(site.includes('.md\\:max-w-2xl{'), 'md:max-w-2xl absent de site.css : lancer npm run build:css');
  assert.ok(site.includes('.md\\:mx-auto{'), 'md:mx-auto absent de site.css : lancer npm run build:css');
  assert.ok(site.includes('.md\\:w-full{'), 'md:w-full absent de site.css : lancer npm run build:css');
  assert.ok(!site.includes('.bg-\\[\\#F1E7DE\\]'), 'bg-[#F1E7DE] (pastille) encore dans site.css : lancer npm run build:css');
  assert.ok(!site.includes('.shadow-\\[0_6px_18px_rgba\\(42\\2c 18\\2c 16\\2c \\.20\\)\\]'), 'ombre de la carte blanche encore dans site.css : lancer npm run build:css');
});
