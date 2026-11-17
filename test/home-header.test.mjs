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
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
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
  assert.ok(navigation.includes('useState(()=>window.scrollY>60)'), 'scrolled lu au montage (rechargement avec défilement restauré)');
  assert.equal((navigation.match(/ouvreur\.current=e\.currentTarget/g) || []).length, 2, '« Menu » et le hamburger mémorisent l\'ouvreur');
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
  assert.ok(/\.mega-menu::before\{[^}]*top:-1px;left:-1px;right:-1px;height:2px;[^}]*background:var\(--editorial-accent\)/.test(style), 'filet rouge du haut (.mega-menu::before) perdu ou replacé sous la bordure');
  assert.ok(navigation.includes("className:'mega-menu '+(megaOpen===ci?'mega-open ':'')+'p-5'"), 'le panneau ne doit plus porter que p-5 (fond, bordure et ombre viennent du <style>)');
  for (const ancien of ['bg-[#FFFFFF]', 'shadow-[', 'border-[var(--credibility-band)]', 'text-[#101214]', 'text-[#4C5052]', 'bg-[#F1E7DE]']) {
    assert.ok(!navigation.includes(ancien), `${ancien} encore dans Navigation (carte blanche)`);
  }
  assert.ok(navigation.includes("className:'text-sm font-semibold text-[var(--chrome-text-1)]'},item.label)"), 'libellé en --chrome-text-1');
  assert.ok(navigation.includes("className:'text-xs text-[var(--chrome-text-2)] mt-0.5'},item.desc)"), 'description en --chrome-text-2');
  // Bloquant vu en relecture : .mega-menu:hover (déclaration propre à l'élément) battait l'héritage de visibility/pointer-events
  // de .is-hidden et laissait un panneau invisible cliquable sous le curseur après un défilement.
  assert.ok(!/\.mega-menu:hover/.test(style), '.mega-menu:hover doit disparaître (panneau fantôme cliquable après défilement)');
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
  assert.ok(navigation.includes('onClick:()=>{survol.current=-1;setMegaOpen(m=>m===ci?-1:ci)}'), 'onClick de bascule absent sur les boutons de rubrique (et il efface la provenance « survol »)');
  assert.ok(navigation.includes("'aria-controls':'mega-panel-'+ci") && navigation.includes("id:'mega-panel-'+ci"), 'aria-controls du bouton vers l\'id du panneau');
  assert.ok(!navigation.includes('aria-haspopup'), 'aria-haspopup annonce un rôle menu : modèle disclosure, aria-expanded + aria-controls');
  assert.ok(navigation.includes("onPointerEnter:(e)=>{if(e.pointerType==='mouse'){survol.current=ci;setMegaOpen(ci)}}"), 'survol : onPointerEnter filtré sur pointerType mouse, qui note la rubrique ouverte au survol');
  assert.ok(!navigation.includes('onMouseEnter:'), 'onMouseEnter doit disparaître (survol émulé d\'un toucher)');
  assert.ok(!navigation.includes('onFocus:'), 'onFocus doit disparaître (focus posé par un toucher Android, puis clic : ouvre puis ferme)');
  assert.ok(navigation.includes("if(e.key==='Escape'&&megaOpen===ci){setMegaOpen(-1);e.currentTarget.querySelector('button').focus()}"), 'Échap : ferme ce panneau et rend le focus au bouton');
  assert.ok(!navigation.includes('.blur()'), 'plus de blur() : le focus ne doit pas tomber sur body');
  assert.ok(navigation.includes("document.addEventListener('pointerdown',fermer)") && navigation.includes("closest?.('.mega-trigger')"), 'écouteur pointerdown hors du panneau absent');
  assert.ok(navigation.includes("const echap=e=>{if(e.key==='Escape')setMegaOpen(-1)}") && navigation.includes("document.addEventListener('keydown',echap)"), 'Échap doit fermer un panneau ouvert au survol (rien n\'a le focus)');
  // Une rubrique ne ferme que SON panneau. En Chrome, l'entrée dans la rubrique voisine (onPointerEnter) part avant la sortie de la rubrique
  // quittée (onMouseLeave) : une fermeture sans condition refermait la voisine, et glisser d'une rubrique à l'autre fermait tout. La perte de
  // focus d'une rubrique fermait de même le panneau d'une autre, au moment où l'on appuyait sur un de ses liens : le clic était perdu.
  // Forme fonctionnelle obligatoire : l'ouverture de la voisine n'est pas encore rendue quand la sortie arrive (megaOpen de la fermeture serait périmé).
  // Sortie du pointeur : un panneau ouvert AU SURVOL se referme même si le bouton a gardé le focus d'un clic antérieur (panneau « collant »,
  // reproduit en prod) ; ouvert au clic ou au clavier, il reste ouvert tant que le focus est dans sa rubrique.
  assert.ok(navigation.includes("const survol=useRef(-1)"), 'la rubrique ouverte au survol doit être mémorisée (ref)');
  assert.ok(navigation.includes("onMouseLeave:(e)=>{if(survol.current===ci||!e.currentTarget.contains(document.activeElement))setMegaOpen(m=>m===ci?-1:m)}"), 'sortie de rubrique : ne ferme que son propre panneau (forme fonctionnelle), toujours s\'il a été ouvert au survol');
  // Perte de focus : seulement vers un élément précis hors de la rubrique. Vers rien (relatedTarget nul : clic sur une zone non focalisable,
  // ou sur un lien sous Safari) on ne ferme pas, sinon le panneau disparaît sous le clic. La perte de focus de la fenêtre ferme par ailleurs.
  assert.ok(navigation.includes("onBlur:(e)=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget))setMegaOpen(m=>m===ci?-1:m)}"), 'perte de focus d\'une rubrique : vers un élément précis hors de la rubrique, et seulement son propre panneau');
  assert.ok(navigation.includes("const quitter=()=>setMegaOpen(-1)") && navigation.includes("window.addEventListener('blur',quitter)") && navigation.includes("window.removeEventListener('blur',quitter)"), 'la perte de focus de la fenêtre doit fermer le panneau ouvert (écouteur posé et retiré avec le panneau)');
  // Liste fermée : tous les appels à setMegaOpen dans la région des rubriques (déclencheur, bouton, panneau), dans l'ordre, quelle que soit leur forme.
  // Une fermeture déplacée sur le bouton ou le panneau, ou une garde réécrite avec la valeur capturée megaOpen===ci, fait échouer ce test.
  const debutRubriques = navigation.indexOf('...MEGA_NAV.map((cat,ci)=>{'), finRubriques = navigation.indexOf("h('div',{className:'nav-state'+(scrolled?'':' is-hidden')}");
  assert.ok(debutRubriques !== -1 && finRubriques > debutRubriques, 'région des rubriques introuvable');
  const region = navigation.slice(debutRubriques, finRubriques);
  const appels = [];
  for (let i = region.indexOf('setMegaOpen('); i !== -1; i = region.indexOf('setMegaOpen(', i + 1)) {
    let j = i + 'setMegaOpen('.length, profondeur = 1;
    for (; profondeur > 0; j++) { if (region[j] === '(') profondeur++; else if (region[j] === ')') profondeur--; }
    appels.push(region.slice(i + 'setMegaOpen('.length, j - 1));
  }
  assert.deepEqual(appels, ['ci', 'm=>m===ci?-1:m', 'm=>m===ci?-1:m', '-1', 'm=>m===ci?-1:ci'], 'appels à setMegaOpen sur une rubrique : survol, sortie, perte de focus, Échap (gardé par megaOpen===ci), clic');
  assert.ok(region.includes("if(e.key==='Escape'&&megaOpen===ci){setMegaOpen(-1)"), 'la seule fermeture directe est celle d\'Échap, gardée par megaOpen===ci');
});

test('logo à 40 px, overlay : Échap, retour du focus, colonne centrée sur ordinateur', () => {
  const logos = navigation.match(/src:'logo-header\.png',alt:'Inflexion',className:'([^']*)'/g) || [];
  assert.equal(logos.length, 2, 'deux logos dans Navigation (en-tête, overlay)');
  assert.ok(logos[0].endsWith("className:'h-10 w-auto'"), `logo de l'en-tête : h-10 w-auto attendu, trouvé ${logos[0]}`);
  assert.ok(!navigation.includes('h-[65px]') && !navigation.includes('h-[50px]'), 'anciennes hauteurs du logo encore présentes dans Navigation');
  assert.ok(navigation.includes("if(e.key==='Escape')setOpen(false)"), 'Échap ne ferme pas l\'overlay');
  assert.ok(navigation.includes("document.addEventListener('keydown',fn)"), 'l\'écouteur Échap de l\'overlay doit être posé sur document');
  assert.ok(navigation.includes("document.getElementById('menu-overlay').querySelector('button').focus()"), 'le focus doit entrer dans l\'overlay (la croix) à l\'ouverture');
  // En transition, visibility vaut encore hidden à p = 0 : le focus() de l'effet serait refusé si l'ouverture transitionnait visibility.
  assert.equal(regle(style, '.mobile-overlay.open'), 'opacity:1;visibility:visible;transition:opacity var(--motion-base)', 'à l\'ouverture de l\'overlay, seule l\'opacité est animée');
  assert.ok(navigation.includes('const o=ouvreur.current;o?.focus()') && navigation.includes("if(document.activeElement!==o)document.querySelector('header a')?.focus()"), 'retour du focus à l\'ouvreur, repli sur le logo s\'il est masqué');
  assert.ok(navigation.includes("role:'dialog','aria-modal':'true','aria-label':'Menu'"), 'l\'overlay doit être un dialogue modal');
  assert.equal((navigation.match(/'aria-controls':'menu-overlay'/g) || []).length, 2, '« Menu » et le hamburger pointent l\'overlay');
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
