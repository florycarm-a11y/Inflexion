# En-tête à deux états et méga-menu en verre sombre — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** rendre `index.html` conforme aux six points du prompt 5 de l'audit Starlink (en-tête à deux états avec bouton « Menu » après 60 px, transition de l'en-tête limitée à `background-color` et `border-color`, méga-menu en verre sombre, pastilles supprimées et intitulé de groupe, ouverture et fermeture au clic, logo à 40 px) **sans autre différence visible** que celles que ces six points impliquent.

**Architecture :** tout vit dans `index.html` (son `<style>` et son composant `Navigation`). Chaque modification est un remplacement de chaîne complète **à compte vérifié** (jamais de chercher-remplacer global : `CLAUDE.md` §3). Les deux états de l'en-tête sont deux `div.nav-state` superposés dans une cellule de grille (`.nav-states`), ce qui fige la position du CTA ; le méga-menu passe en modèle « disclosure » (clic bascule, Échap ferme et rend le focus, survol souris seule, clic hors du panneau ferme). `assets/site.css` est reconstruit. Un test de garde rend les six points permanents. Spec : `docs/superpowers/specs/2026-11-16-en-tete-mega-menu-design.md`.

**Tech Stack :** Node 25, `tailwindcss@3.4.19` (`npm run build:css`), `node --test` (`npm test`), Chrome sans fenêtre piloté par CDP + Pillow pour la comparaison visuelle (outils hors dépôt, dossier de notes partagé de la session).

**Règles du dépôt :** lire `CLAUDE.md`. Chaque remplacement ci-dessous porte une chaîne complète et un nombre d'occurrences attendu ; si un compte diffère, **ne pas corriger le compte** : lire la ligne dans `index.html`, comprendre, corriger la chaîne. Ne toucher ni `nav-config.js`, ni `nav-shared.js`, ni les autres pages, ni `styles.css`, ni `assets/design-tokens-v2.css`, ni `tailwind.config.js`, ni `CLAUDE.md`. Branche `claude/header-mega-menu-c4e31f` dans le worktree `.claude/worktrees/hopeful-lovelace-39a606` (coupé de `main` `409ab302`). Serveur local **depuis le worktree** : `python3 -m http.server 4399 --bind 127.0.0.1` (le port 3000 sert le dépôt principal). Commits en français, terminés par `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Ne pousser et n'ouvrir la PR qu'après le « oui ».

---

## Carte des fichiers

| Fichier | Action | Responsabilité |
| --- | --- | --- |
| `test/home-header.test.mjs` | créer | garde-fous des six points + pièges de cascade (`transition-colors` jamais sur un `.nav-state`, `md:max-w-2xl` dans `site.css`) |
| `index.html` | modifier | `<style>` : 5 remplacements (+ 1 déplacement, Task 2 bis) ; script `Navigation` : 10 remplacements |
| `assets/site.css` | régénérer (commité) | `bg-[#F1E7DE]` et `shadow-[0_6px_18px_rgba(42,18,16,.20)]` disparaissent ; `md:max-w-2xl`, `md:mx-auto`, `md:w-full` apparaissent |

Outils hors dépôt, dans `<notes>/visuel/` (dossier de notes partagé de cette session) : `capturer-reveal.mjs` (page entière), `capturer-etats.mjs` (8 états de l'en-tête), `comparer.py`, `verifier-en-tete.mjs` (contrôle CDP), `contrastes.py` (échantillonnage des captures). Base « avant » sur `main` `409ab302` : `<scratchpad>/avant` (2 captures) et `<scratchpad>/avant-etats` (8 captures).

---

### Task 0 : cadrage (fait, consigné dans la spec §2)

Contrastes calculés par ce script (composition alpha puis WCAG 2.x) — reproductible :

```python
def lin(c):
    c=c/255
    return c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
def L(rgb): r,g,b=rgb; return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b)
def ratio(a,b):
    la,lb=L(a),L(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
def comp(fg,a,bg): return tuple(fg[i]*a+bg[i]*(1-a) for i in range(3))
ESP=(23,16,14); T1=(245,237,230); ACC=(224,90,78)
for nom,bg in {'espresso':ESP,'lueur':comp((224,90,78),.12,ESP),'image gravée claire':comp(ESP,.55,(190,190,190)),'blanc':(255,255,255)}.items():
    verre=comp(ESP,.78,bg)
    print(nom, round(ratio(T1,verre),2), round(ratio(comp(T1,.70,verre),verre),2), round(ratio(comp(T1,.55,verre),verre),2), round(ratio(ACC,verre),2))
```

Résultat : tableau de la spec §2.3 (texte-1 ≥ 8,19, texte-2 ≥ 4,98 même sur blanc).

---

### Task 1 : le test de garde (échoue tant que rien n'est fait)

**Files :**
- Create : `test/home-header.test.mjs`

- [ ] **Step 1 : écrire le test**

```js
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
```

- [ ] **Step 2 : le lancer, il doit échouer sur les sept tests**

Run : `node --test test/home-header.test.mjs 2>&1 | grep -E '^(✔|✖|ℹ (pass|fail))'`
Expected : 7 `✖`, `pass 0`, `fail 7`.

- [ ] **Step 3 : commit**

```bash
git add test/home-header.test.mjs
git commit -m "Test de garde du prompt 5 (en-tête à deux états, méga-menu en verre) : échoue tant que rien n'est fait"
```

---

### Task 2 : `index.html`, un remplacement à la fois

**Files :**
- Modify : `index.html` (`<style>` l. 44-52 et 103 ; `Navigation()` l. 260-334)

- [ ] **Step 1 : écrire le script de remplacement** (`<scratchpad>/appliquer-prompt5.mjs`), chaque règle = `[ancien, nouveau, compte]` ; le script s'arrête au premier compte inattendu sans rien écrire.

```js
import { readFileSync, writeFileSync } from 'node:fs';
const chemin = process.argv[2] || 'index.html';
let html = readFileSync(chemin, 'utf8');
const compter = (s, a) => s.split(a).length - 1;
const REGLES = [
// ── <style> ──────────────────────────────────────────────────────────────────
['/* Mega menu — carte claire, filet rouge */\n.mega-trigger{position:relative}\n.mega-menu{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(8px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity var(--motion-base),transform var(--motion-base),visibility var(--motion-base);min-width:340px;z-index:60}',
 "/* Méga-menu — verre sombre sur le hero espresso (audit Starlink 5.7), filet rouge en tête. Il ne s'ouvre qu'au repos : au défilement les rubriques s'effacent (.nav-state). */\n.mega-trigger{position:relative}\n.mega-menu{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(8px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity var(--motion-base),transform var(--motion-base),visibility var(--motion-base);min-width:340px;z-index:60;background:rgba(23,16,14,.78);backdrop-filter:blur(24px) saturate(1.4);border:1px solid var(--chrome-border);box-shadow:0 12px 32px rgba(0,0,0,.35)}", 1],
[".mega-icon{width:36px;height:36px;border-radius:0;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;font-weight:600;font-family:'IBM Plex Mono',monospace}\n", '', 1],
['.nav-scrolled{background:var(--chrome-scrolled);backdrop-filter:blur(16px);border-bottom:1px solid var(--chrome-border)}',
 '.nav-scrolled{background:var(--chrome-scrolled);backdrop-filter:blur(16px);border-bottom-color:var(--chrome-border)}', 1],
['/* En-tête au défilement : « all » hérité de l\'ancien utilitaire Tailwind (300 ms) ; à restreindre à background-color et border-color (prompt 5, en-tête et méga-menu). */\n.site-header{transition:all var(--motion-base)}',
 "/* En-tête : seules la couleur de fond et celle du filet bas sont animées (audit 7.9) ; la bordure transparente au repos donne à border-color un point de départ. backdrop-filter n'est pas animé. */\n.site-header{border-bottom:1px solid transparent;transition:background-color var(--motion-base),border-color var(--motion-base)}\n/* Deux états (audit 6.4) : rubriques au repos, bouton « Menu » après 60 px. Les deux occupent la même cellule de grille, alignés à droite :\n   la cellule garde la largeur des rubriques et le CTA ne bouge pas. Opacité animée ; visibility sort l'état masqué du focus, pointer-events du clic.\n   Portée par ces div, jamais par les boutons : leur transition-colors (site.css, chargé en dernier) écraserait la transition d'opacité. */\n.nav-states{display:grid;justify-items:end;align-items:center}\n.nav-state{grid-area:1/1;transition:opacity var(--motion-base),visibility var(--motion-base)}\n.nav-state.is-hidden{opacity:0;visibility:hidden;pointer-events:none}", 1],
['.mega-item:hover{background:rgba(142,36,36,.06)}', '.mega-item:hover{background:rgba(245,237,230,.07)}', 1],
// ── script : Navigation ──────────────────────────────────────────────────────
["const[megaOpen,setMegaOpen]=useState(-1)\n", "const[megaOpen,setMegaOpen]=useState(-1)\nconst ouvreur=useRef(null) // bouton qui a ouvert l'overlay : le focus lui revient à la fermeture\n", 1],
["useEffect(()=>{\nif(open){document.body.classList.add('menu-open')}else{document.body.classList.remove('menu-open')}\nreturn()=>document.body.classList.remove('menu-open')\n},[open])",
 "useEffect(()=>{\nif(scrolled)setMegaOpen(-1) // un panneau ouvert garderait visibility:visible sous des rubriques effacées\n},[scrolled])\n// Panneau ouvert : un toucher ou un clic hors de tout déclencheur le ferme (iOS ne donne pas le focus aux boutons : onBlur n'y suffit pas)\nuseEffect(()=>{\nif(megaOpen<0)return\nconst fn=e=>{if(!e.target.closest?.('.mega-trigger'))setMegaOpen(-1)}\ndocument.addEventListener('pointerdown',fn)\nreturn()=>document.removeEventListener('pointerdown',fn)\n},[megaOpen])\nuseEffect(()=>{\ndocument.body.classList.toggle('menu-open',open)\nif(!open)return\nconst fn=e=>{if(e.key==='Escape')setOpen(false)}\ndocument.addEventListener('keydown',fn)\nreturn()=>{document.body.classList.remove('menu-open');document.removeEventListener('keydown',fn);ouvreur.current?.focus()}\n},[open])", 1],
["className:'h-10 sm:h-[50px] md:h-[65px] w-auto'", "className:'h-10 w-auto'", 1],
["    h('nav',{className:'hidden md:flex items-center gap-1','aria-label':'Navigation principale'},\n     ...MEGA_NAV.map((cat,ci)=>{\n      const isWide=cat.children.length>3\n      return h('div',{key:ci,className:'mega-trigger',onMouseEnter:()=>setMegaOpen(ci),onMouseLeave:(e)=>{if(!e.currentTarget.contains(document.activeElement))setMegaOpen(-1)},onFocus:()=>setMegaOpen(ci),onBlur:(e)=>{if(!e.currentTarget.contains(e.relatedTarget))setMegaOpen(-1)},onKeyDown:(e)=>{if(e.key==='Escape'){setMegaOpen(-1);const b=e.currentTarget.querySelector('button');if(b)b.blur()}}},\n       h('button',{type:'button','aria-haspopup':'true','aria-expanded':megaOpen===ci,className:",
 "    h('nav',{className:'hidden md:flex items-center gap-1','aria-label':'Navigation principale'},\n     h('div',{className:'nav-states'},\n      h('div',{className:'nav-state flex items-center gap-1'+(scrolled?' is-hidden':'')},\n     ...MEGA_NAV.map((cat,ci)=>{\n      const isWide=cat.children.length>3\n      // Modèle « disclosure » : le clic bascule (souris, toucher, Entrée, Espace), Échap ferme et rend le focus ; le survol n'ouvre que pour une vraie souris\n      // (le survol émulé d'un toucher, suivi du clic, ouvrirait puis refermerait). Pas d'ouverture au focus : tabuler le long de la barre n'ouvre rien.\n      return h('div',{key:ci,className:'mega-trigger',onPointerEnter:(e)=>{if(e.pointerType==='mouse')setMegaOpen(ci)},onMouseLeave:(e)=>{if(!e.currentTarget.contains(document.activeElement))setMegaOpen(-1)},onBlur:(e)=>{if(!e.currentTarget.contains(e.relatedTarget))setMegaOpen(-1)},onKeyDown:(e)=>{if(e.key==='Escape'&&megaOpen===ci){setMegaOpen(-1);e.currentTarget.querySelector('button').focus()}}},\n       h('button',{type:'button','aria-haspopup':'true','aria-expanded':megaOpen===ci,onClick:()=>setMegaOpen(megaOpen===ci?-1:ci),className:", 1],
["       h('div',{className:'mega-menu '+(megaOpen===ci?'mega-open ':'')+'bg-[#FFFFFF] border border-[var(--credibility-band)] p-5 shadow-[0_6px_18px_rgba(42,18,16,.20)]',style:{minWidth:isWide?'440px':'340px'}},\n        h('div',{className:isWide?'grid grid-cols-2 gap-1':'grid gap-1'},\n         ...cat.children.map((item,ii)=>\n          h('a',{key:ii,href:item.href,className:'mega-item flex items-start gap-3 px-3 py-2.5 no-underline'},\n           h('span',{className:'mega-icon bg-[#F1E7DE] text-[var(--editorial-accent)]'},item.icon),\n           h('span',{className:'flex flex-col min-w-0'},\n            h('span',{className:'text-sm font-semibold text-[#101214]'},item.label),\n            h('span',{className:'text-xs text-[#4C5052] mt-0.5'},item.desc)\n           )\n          )\n         )\n        )\n       )\n      )}\n     ),\n     h('a',{href:'premium.html',",
 "       h('div',{className:'mega-menu '+(megaOpen===ci?'mega-open ':'')+'p-5',style:{minWidth:isWide?'440px':'340px'}},\n        h('p',{className:'kicker mb-3 px-3',style:{color:'var(--editorial-accent-text)'}},cat.label),\n        h('div',{className:isWide?'grid grid-cols-2 gap-1':'grid gap-1'},\n         ...cat.children.map((item,ii)=>\n          h('a',{key:ii,href:item.href,className:'mega-item flex flex-col px-3 py-2.5 no-underline'},\n           h('span',{className:'text-sm font-semibold text-[var(--chrome-text-1)]'},item.label),\n           h('span',{className:'text-xs text-[var(--chrome-text-2)] mt-0.5'},item.desc)\n          )\n         )\n        )\n       )\n      )}\n      )\n      ),\n      h('div',{className:'nav-state'+(scrolled?'':' is-hidden')},\n       h('button',{type:'button',onClick:(e)=>{ouvreur.current=e.currentTarget;setOpen(true)},'aria-expanded':open,'aria-controls':'menu-overlay',className:'nav-link px-3 py-2 text-sm transition-colors select-none text-[var(--chrome-text-2)] hover:text-[var(--chrome-text-1)] focus-visible:text-[var(--chrome-text-1)] bg-transparent border-0 cursor-pointer'},'Menu')\n      )\n     ),\n     h('a',{href:'premium.html',", 1],
["onClick:()=>setOpen(!open),'aria-label':'Menu','aria-expanded':open}", "onClick:(e)=>{ouvreur.current=e.currentTarget;setOpen(!open)},'aria-label':'Menu','aria-expanded':open}", 1],
[" h('div',{className:`mobile-overlay fixed inset-0 z-[60] flex flex-col ${open?'open':''}`,style:{backgroundColor:'var(--chrome-ground)'}},", " h('div',{id:'menu-overlay',className:`mobile-overlay fixed inset-0 z-[60] flex flex-col ${open?'open':''}`,style:{backgroundColor:'var(--chrome-ground)'}},", 1],
["className:'flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0'}", "className:'flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0 md:max-w-2xl md:mx-auto md:w-full'}", 1],
["className:'flex-1 overflow-y-auto px-6 pt-2 pb-4'}", "className:'flex-1 overflow-y-auto px-6 pt-2 pb-4 md:max-w-2xl md:mx-auto md:w-full'}", 1],
["className:'px-6 pt-4 pb-20 flex flex-col gap-3 flex-shrink-0'}", "className:'px-6 pt-4 pb-20 flex flex-col gap-3 flex-shrink-0 md:max-w-2xl md:mx-auto md:w-full'}", 1],
];
let total = 0;
for (const [ancien, nouveau, attendu] of REGLES) {
  const n = compter(html, ancien);
  if (n !== attendu) { console.error(`Compte inattendu (${n} au lieu de ${attendu}) pour :\n${ancien.slice(0, 160)}…`); process.exit(1); }
  html = html.split(ancien).join(nouveau); total += n;
}
if (process.argv.includes('--verifier')) { console.log(`${REGLES.length} règles, ${total} remplacements : comptes conformes (rien écrit)`); process.exit(0); }
writeFileSync(chemin, html);
console.log(`${REGLES.length} règles, ${total} remplacements écrits dans ${chemin}`);
```

- [ ] **Step 2 : essai à blanc, puis application**

Run : `node <scratchpad>/appliquer-prompt5.mjs index.html --verifier` puis sans `--verifier`.
Expected : `15 règles, 15 remplacements`.

- [ ] **Step 3 : inventaire après**

Run :
```bash
grep -c 'mega-icon' index.html            # 0
grep -o 'nav-state[^ \x27]*' index.html | sort | uniq -c   # nav-state ×3 (règles + 2 usages), nav-states ×2
grep -c "onClick:()=>setMegaOpen" index.html   # 1
grep -c 'h-\[65px\]' index.html           # 0
node --check <(sed -n '/<script type="module">/,/<\/script>/p' index.html | sed '1d;$d')   # syntaxe du module
```

- [ ] **Step 4 : reconstruire `site.css`, lancer les tests**

Run : `npm run build:css && npm test 2>&1 | grep -E '^ℹ (pass|fail)'`
Expected : `pass 149`, `fail 0`.

- [ ] **Step 5 : commit**

```bash
git add index.html assets/site.css
git commit -m "Home : en-tête à deux états et méga-menu en verre sombre (prompt 5 de l'audit Starlink)"
```

---

### Task 2 bis : deux écarts vus à la comparaison au pixel (Task 3, première passe)

**Files :**
- Modify : `index.html` (`<style>`, ordre de `.nav-scrolled` ; trois conteneurs de l'overlay), `test/home-header.test.mjs`, `assets/site.css`

- [ ] **Step 1 : le filet bas de l'en-tête défilé avait disparu** (`en-tete-defile` à 390 : une ligne de 390 px à y = 67, pixel (63,45,31) → (24,16,14)). Cause : `.nav-scrolled` (l. 49) précédait `.site-header` (l. 51) ; à spécificité égale, le raccourci `border-bottom:1px solid transparent` de `.site-header` écrasait `border-bottom-color:var(--chrome-border)`. Correctif : déplacer la règle `.nav-scrolled` juste **après** `.site-header`, avec le commentaire `/* Déclaré après .site-header : à spécificité égale, son raccourci border-bottom écraserait border-bottom-color. */`.

- [ ] **Step 2 : l'overlay à 1440 se rétrécissait à 248 px** au lieu de 672 : en colonne flex, `mx-auto` annule l'étirement (`align-self: stretch`) et le conteneur prend sa largeur de contenu. Correctif : `md:w-full` rétabli sur les trois conteneurs (règles 13 à 15 ci-dessus, déjà corrigées dans leur texte).

- [ ] **Step 3 : test durci** : `.site-header{` doit précéder `.nav-scrolled{` ; les trois conteneurs portent `md:max-w-2xl md:mx-auto md:w-full` ; `site.css` contient `.md\:w-full{`. Puis `npm run build:css && npm test` → `pass 149`.

- [ ] **Step 4 : commit, re-captures** : `en-tete-defile` à 390 doit redevenir identique (0 px) ; à 1440 sa boîte ne doit plus couvrir toute la largeur.

```bash
git add index.html assets/site.css test/home-header.test.mjs
git commit -m "Prompt 5 : filet bas de l'en-tête défilé rétabli, overlay en vraie colonne de 672 px"
```

---

### Task 3 : comparaison visuelle avant / après

**Files :** aucun fichier du dépôt. Outils : `<notes>/visuel/capturer-reveal.mjs`, `capturer-etats.mjs`, `comparer.py`. Base : `<scratchpad>/avant`, `<scratchpad>/avant-etats`. Serveur du worktree actif sur 4399.

- [ ] **Step 1 : captures « après »**

```bash
PAGES=index.html node <notes>/visuel/capturer-reveal.mjs <scratchpad>/apres http://127.0.0.1:4399 1440,390
node <notes>/visuel/capturer-etats.mjs <scratchpad>/apres-etats http://127.0.0.1:4399 1440,390
python3 -I <notes>/visuel/comparer.py <scratchpad>/avant <scratchpad>/apres <scratchpad>/diff
python3 -I <notes>/visuel/comparer.py <scratchpad>/avant-etats <scratchpad>/apres-etats <scratchpad>/diff-etats
```

- [ ] **Step 2 : ranger chaque différence**

Attendu, page entière : une seule boîte englobante par largeur, celle du logo (haut gauche, ≤ 65 px de haut à 1440, ≤ 40 px à 390 — à 390 le logo était déjà `h-10` : **0 px** attendu). États : `en-tete` logo seul (0 px à 390) ; `mega-analyses`, `mega-intelligence` : logo + panneau ; `en-tete-defile` à 1440 : logo + zone des rubriques ; à 390 : 0 px ; `overlay` à 1440 : nouveau (avant = page sans overlay) ; à 390 : 0 px. **Toute autre zone est une régression** à comprendre avant d'aller plus loin.

- [ ] **Step 3 : contrastes mesurés** (`<notes>/visuel/contrastes.py`) : pour `mega-analyses` et `mega-intelligence` à 1440, échantillonner le fond du panneau (pixels du verre entre les lignes de texte) et calculer le ratio des trois encres (texte-1, texte-2 composée, accent). Attendu : libellés et descriptions ≥ 4,5:1.

---

### Task 4 : contrôle dans le navigateur (onglet actif) et script CDP

**Files :** `<notes>/visuel/verifier-en-tete.mjs` (hors dépôt).

- [ ] **Step 1 : script CDP** (même tuyau que `capturer-etats.mjs`) — à 1440 × 900 : logo 40 px ; `transition-property` de `header` = `background-color, border-color` ; état repos : rubriques `visibility:visible`, « Menu » `hidden` ; clic « Analyses » → `aria-expanded=true`, `.mega-open`, styles calculés (`background-color: rgba(23, 16, 14, 0.78)`, `backdrop-filter: blur(24px) saturate(1.4)`, `border: 1px solid rgba(200, 149, 90, 0.22)`), libellé `rgb(245, 237, 230)`, description `rgba(245, 237, 230, 0.7)`, aucun `.mega-icon`, premier enfant `p.kicker` (texte « Analyses », Plex Mono, 12 px, uppercase) ; second clic → fermé ; clic → ouvert, Échap → fermé et `document.activeElement` = le bouton ; `pointerdown` sur `body` → fermé ; défilement à 400 px + 400 ms → rubriques `hidden`, « Menu » `visible`, `.mega-open` absent, `header` fond `rgba(23, 16, 14, 0.94)`, `border-bottom-color` = chrome-border ; clic « Menu » → `.mobile-overlay.open`, `body.menu-open` ; Échap → fermé, focus sur « Menu » ; largeur des trois conteneurs de l'overlay = 672 px. À 390 × 844 : `nav` `display:none`, hamburger visible, logo 40 px, overlay ouvert par le hamburger, conteneurs 390 px. Émulation `prefers-reduced-motion: reduce` : overlay ouvert → `.menu-item` opacité 1. Console : aucune erreur nouvelle (404 `data/messari.json` préexistant).

- [ ] **Step 2 : volet navigateur de la session** : même parcours à la main (survol, clic, Échap, défilement, « Menu », overlay), captures d'écran.

---

### Task 5 : relectures et corrections

- [ ] **Step 1 : relecture de conformité** (sous-agent) : diff `409ab302..HEAD` contre la spec §3, point par point.
- [ ] **Step 2 : relecture qualité** (sous-agent `superpowers:code-reviewer`) : hooks, cascade, accessibilité, test.
- [ ] **Step 3 : corrections retenues** → commit(s), `npm test`, re-captures si le rendu change.

---

### Task 6 : compte rendu et attente de l'accord

- [ ] Spec mise à jour (statut, écarts constatés), plan complété de « Résultats mesurés », commit des docs.
- [ ] Note de passation dans le dossier de notes partagé ; outils copiés dans `<notes>/visuel/`.
- [ ] Mémoire : `project_audit_starlink.md` (prompt 5 fait, branche, état de la PR).
- [ ] Message à la personne : six points, écarts assumés (overlay en colonne, Échap et focus sur l'overlay, plus d'ouverture au focus, ombre du verre), `hoverOnlyWhenSupported` toujours à trancher, suites (autres pages, `nav-shared.js`, logo SVG, lien « Services »). **Attendre le « oui »** avant `git push` et `gh pr create`.

---

### Task 7 : suite de la relecture qualité (après fusion de la PR #147)

**Files :**
- Modify : `index.html` (`<style>` : `.mega-menu:hover`, `.mega-menu::before`, `.mobile-overlay.open` ; script : `scrolled`, effets `megaOpen` et `open`, boutons, panneau, hamburger, overlay), `test/home-header.test.mjs`

Branche `claude/header-mega-menu-suite` coupée d'`origin/main` (`038d11fb`). Script `<notes>/visuel/appliquer-suite.mjs` : 10 règles à compte vérifié (essai à blanc d'abord), puis `node --check` du module extrait.

- [ ] **Step 1 : le bloquant.** Supprimer `.mega-menu:hover{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}` du bloc `@media(hover:hover)`.
- [ ] **Step 2 : focus dans l'overlay.** Effet `open` : `if(!open)return` ; `document.body.classList.add('menu-open')` ; écouteur Échap ; `document.getElementById('menu-overlay').querySelector('button').focus()` ; nettoyage : retrait de la classe et de l'écouteur, `const o=ouvreur.current;o?.focus()` puis `if(document.activeElement!==o)document.querySelector('header a')?.focus()`. Overlay : `role:'dialog','aria-modal':'true','aria-label':'Menu'`. CSS : `.mobile-overlay.open{opacity:1;visibility:visible;transition:opacity var(--motion-base)}`.
- [ ] **Step 3 : suggestions retenues.** `useState(()=>window.scrollY>60)` ; effet `megaOpen` : `fermer` (pointerdown) + `echap` (keydown) ; bouton : `'aria-expanded':megaOpen===ci,'aria-controls':'mega-panel-'+ci,onClick:()=>setMegaOpen(m=>m===ci?-1:ci)` ; panneau `id:'mega-panel-'+ci` ; hamburger `'aria-controls':'menu-overlay'` ; `::before` `top:-1px;left:-1px;right:-1px`.
- [ ] **Step 4 : test durci** : `sansCommentaires` retire aussi ` // …` en fin de ligne ; assertions : plus de `.mega-menu:hover`, `::before` sur le bord, `useState(()=>window.scrollY>60)`, deux `ouvreur.current=e.currentTarget`, bascule fonctionnelle, `aria-controls`/`id` du panneau, plus d'`aria-haspopup`, écouteur `keydown` Échap du méga-menu, écouteur Échap de l'overlay, focus sur la croix, repli sur le logo, rôle dialogue, deux `aria-controls:'menu-overlay'`, `.mobile-overlay.open` n'anime que l'opacité ; `h-[65px]` cherché dans `Navigation` seulement.
- [ ] **Step 5** : `npm run build:css` (aucune classe nouvelle : `site.css` inchangé), `npm test` 149/149, le test durci **doit échouer** sur l'`index.html` de `main` (copie dans un arbre temporaire) ; contrôle CDP enrichi (souris réelle via `Input.dispatchMouseEvent` : survol, pointeur dans le panneau, défilement, `elementFromPoint` ; focus sur la croix ; Échap sans focus ; ARIA) ; captures contre l'état fusionné.

---

## Résultats mesurés (2026-11-16)

- **Base « avant »** (sur `main` `409ab302`, worktree servi sur 4399) : `index` entière à 1440 et 390 (`capturer-reveal.mjs`), 8 états (`capturer-etats.mjs`). Deux pièges du script corrigés avant la base : le `clip` de `Page.captureScreenshot` est en coordonnées du document (états défilés photographiés depuis `scrollY`), et React 18 rend après l'événement (états relus après 80 ms).
- **Task 1** : commit `6d981a01`. Test avant tout : 7 échecs.
- **Task 2** : commit `537417b2`. Script : 15 règles, 15 remplacements, aucun compte inattendu (essai à blanc d'abord). **Le `node --check` du module extrait a attrapé une erreur de la règle 9** (parenthèse manquante après `MEGA_NAV.map(` : l'état compact tombait dans le `div` des rubriques) : corrigée dans `index.html`, le plan et le script avant tout rendu. Puis le test comptait `nav-states` comme un état (regex `nav-state[^']*` → `nav-state(?:\s[^']*)?`). `npm run build:css` : `site.css` +`md:max-w-2xl`, +`md:mx-auto`, −`bg-[#F1E7DE]`, −`shadow-[0_6px_18px_rgba(42,18,16,.20)]` (le `shadow-[0_6px_18px_rgba(14,16,18,.18)]` qui reste vient des articles). `npm test` : **149/149**.
- **Task 3, première passe** : page entière 1440 : **2 891 px, boîte (114, 6, 288, 65) = le logo seul** (point 6) ; 390 : **0 px**. États : `mega-analyses` (114, 6, 987, 314) et `mega-intelligence` (114, 6, 1218, 361) = logo + panneau (points 3, 4, 6) ; `overlay` 1440 nouveau (point 1) ; `en-tete` 390 et `overlay` 390 : 0 px. **Deux régressions** : `en-tete-defile` à 390 différait d'une ligne de 390 px à y = 67 (filet bas (63,45,31) devenu (24,16,14)) ; et l'overlay à 1440 montrait trois conteneurs de 248 px au lieu de 672. Causes et correctifs : Task 2 bis (ordre `.site-header` / `.nav-scrolled` ; `md:w-full`), commit `87943b87`, `npm test` 149/149.
- **Task 3, seconde passe** : page entière inchangée (logo seul à 1440, 0 px à 390). États : `en-tete-defile` 390 **0 px** (filet (63,45,31) retrouvé) ; `en-tete-defile` 1440 : 4 264 px, boîte (114, 6, 1116, 65) = logo + rubriques → « Menu » (points 1 et 6), plus aucune ligne pleine largeur ; `en-tete` 1440 : logo seul ; `mega-*` et `overlay` comme à la première passe. **Toute différence rangée dans un des six points.**
- **Contrastes mesurés** (`contrastes.py`, fond = médiane des 40 % de pixels les plus sombres par bande de 8 px, pire bande retenue) : panneau Analyses : libellés **14,66:1**, descriptions **7,76:1**, intitulé rouge **4,64:1** ; panneau Intelligence : 14,35 / 7,64 / 4,54 ; sa moitié basse, qui recouvre l'image de la manchette : 14,50 / 7,70 / 4,59. Fond échantillonné `#251A15` à `#271C16`.
- **Task 4, script CDP** (`verifier-en-tete.mjs`) : **34/34** après correction de deux sondes (`getComputedStyle` sans `::before` ; sélecteur du CTA qui attrapait « Diagnostic stratégique » du panneau Services). Vérifié : logo 40 px ; `transition-property: background-color, border-color` (0,3 s) ; `.nav-state` `opacity, visibility` 0,3 s ; repos : bordure et fond transparents, rubriques visibles, « Menu » `hidden` ; clic : `aria-expanded`, fond `rgba(23, 16, 14, 0.78)`, `blur(24px) saturate(1.4)`, `1px solid rgba(200, 149, 90, 0.22)`, filet `2px rgb(142, 36, 36)`, `p.kicker « Analyses »` Plex Mono 12 px uppercase `rgb(224, 90, 78)`, libellé `rgb(245, 237, 230)`, description `rgba(245, 237, 230, 0.7)` ; second clic ferme, troisième rouvre ; Échap ferme et `activeElement` = bouton ; `pointerdown` sur `body` ferme ; `pointerover` souris ouvre, toucher n'ouvre pas, `mouseout` ferme, `focus()` seul n'ouvre pas ; défilement 400 px : panneau ouvert refermé, rubriques `hidden`/0, « Menu » `visible`/1, fond `rgba(23, 16, 14, 0.94)`, filet chrome-border 1 px, flou 16 px, « Menu » à gauche du CTA ; « Menu » ouvre l'overlay (`open`, `body.menu-open`, aria), trois conteneurs de 672 px, Échap ferme et rend le focus ; `prefers-reduced-motion: reduce` : overlay ouvert, entrées opacité 1 sans animation, aucun `.reveal` ; 390 : nav `none`, hamburger `block`, logo 40 px, overlay à 390 px, Échap rend le focus au hamburger, filet au défilement ; console : aucune erreur nouvelle.
- **Task 4, volet navigateur** (onglet actif, 1440 × 900 puis 375 × 812) : première ouverture servie **depuis le cache** (ancienne page : le serveur Python n'envoie pas d'en-tête de cache, fraîcheur heuristique) → `fetch(…, {cache:'reload'})` sur `index.html` et `site.css` puis rechargement. Ensuite : survol « Analyses » → verre ; clic « Expertise » → panneau 2 colonnes ; Échap → fermé, anneau de focus sur « Expertise » ; défilement → logo, « Menu », CTA ; clic « Menu » → overlay en colonne centrée ; Échap → fermé, anneau sur « Menu ». Mobile : hamburger → overlay plein écran, Échap → fermé, anneau sur le hamburger.
- **Relecture de conformité** (sous-agent, `409ab302..87943b87`) : **conforme**, 15 lignes du §3 vérifiées une à une, périmètre exact, six diffs vides pour les fichiers à ne pas toucher, `site.css` conforme ; liste d'aspects non gardés par le test (ouvreur mémorisé par les deux boutons, écouteur Échap de l'overlay…), repris en Task 7.
- **PR #147** ouverte le 2026-11-16 sur le « oui » (`main` toujours à `409ab302`, fusion à blanc propre), prévisualisation Netlify vérifiée (nouvelle page servie), CI 14 contrôles passés, **fusionnée** sur demande (« Fusionne la PR une fois la CI verte ») : merge `038d11fb`, arbre identique à l'arbre testé ; déploiement Pages réussi, **prod vérifiée** (`inflexionhub.com/index.html` : `nav-states` ×2, 0 `mega-icon`, `site.css` avec `md:w-full`).
- **Relecture qualité** (sous-agent `superpowers:code-reviewer`, arrivée après la fusion) : **à reprendre**. Bloquant reproduit : panneau fantôme cliquable après défilement (`.mega-menu:hover` × `.is-hidden`). À corriger : focus qui n'entre pas dans l'overlay (Tab parcourt l'en-tête invisible, le lien d'évitement fait défiler sous l'overlay) ; retour de focus perdu quand l'ouvreur est masqué. Suggestions : Échap sans focus, `scrolled` initial, ARIA (`aria-haspopup` → `aria-controls`, hamburger), effet `open` redondant, forme fonctionnelle, `::before` sous la bordure, test (`sansCommentaires` et commentaires de fin de ligne, `h-[65px]` sur toute la page). Hooks : rien à signaler.
- **Task 7** (branche `claude/header-mega-menu-suite`, commit `d4ed92a5`) : 10 règles, 10 remplacements ; `site.css` inchangé ; `npm test` **149/149** ; le test durci échoue sur l'`index.html` de `main` (4 tests sur 7). **Trouvé en vérifiant** : le `focus()` de l'effet était refusé parce qu'en transition `visibility` vaut encore `hidden` à p = 0 (sonde : `+0 BODY vis=hidden`, `+50 BODY vis=visible`, le focus n'étant jamais réessayé) → `.mobile-overlay.open{…;transition:opacity var(--motion-base)}` ; après : `+0 croix vis=visible`. Contrôle CDP **41/41** (souris réelle : survol ouvre, pointeur dans le panneau, défilement à 500 px → panneau fermé, `hidden`, `pointer-events:none`, `elementFromPoint` = un `div` hors du panneau ; focus sur la croix, `dialog/true/Menu`, retour à « Menu » ; Échap sans focus ferme ; `aria-controls` ↔ `id` sur les quatre panneaux ; hamburger `aria-controls`). Le rechargement avec défilement restauré n'est pas testable en Chrome sans fenêtre (`scrollY` 0 après `Page.reload`) : assertion statique seulement.
- **Captures de la suite contre l'état fusionné** : page entière **identique** (0 px aux deux largeurs) ; états : `mega-analyses` 680 px et `mega-intelligence` 880 px dans une bande de 3 px à y = 53-56 (le filet rouge remonté d'un pixel sur le bord), `overlay` 432 px à 1440 et à 390 dans le carré de la croix (anneau de focus : le focus entre dans le dialogue ; sous une vraie souris `:focus-visible` ne le dessine pas), `en-tete` et `en-tete-defile` identiques aux deux largeurs.
