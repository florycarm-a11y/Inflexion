# Animations d'apparition de la home — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** rendre `index.html` conforme aux six points du prompt 4 de l'audit Starlink (trois jetons de durée, composant `Reveal` élément par élément à la place de `FadeUp`, ordre d'apparition 0 / 0,15 / 0,3 s et + 0,06 s par carte, « réduire les animations » respecté partout, `:hover` du CSS sous `@media(hover:hover)`, plus aucune durée écrite en dur) **sans aucune différence sur l'état « apparu »**.

**Architecture :** trois variables CSS ajoutées aux deux régimes de `assets/design-tokens-v2.css` ; dans `index.html`, chaque durée, chaque `:hover` et chaque bloc animé est remplacé **un par un** par un script de remplacement qui vérifie le nombre d'occurrences attendu pour chaque chaîne (jamais de chercher-remplacer global : `CLAUDE.md` §3). `Reveal` clone son enfant unique (pas de `div` enveloppant), un seul `IntersectionObserver` sert tous les `Reveal`, et chaque `Reveal` se retire après sa transition. `assets/site.css` est reconstruit (classes retirées). Un test de garde rend les six points permanents. Spec : `docs/superpowers/specs/2026-11-15-animations-design.md`.

**Tech Stack :** Node 26, `tailwindcss@3.4.19` (`npm run build:css`), `node --test` (`npm test`), Chrome sans fenêtre piloté par CDP + Pillow pour la comparaison visuelle (outils hors dépôt).

**Règles du dépôt :** lire `CLAUDE.md`. Chaque remplacement ci-dessous porte une chaîne complète et un nombre d'occurrences attendu ; si un compte diffère, **ne pas corriger le compte** : lire la ligne dans `index.html`, comprendre, corriger la chaîne. Ne toucher ni `styles.css`, ni les 32 autres pages, ni `tailwind.config.js`, ni `nav-config.js`, ni `CLAUDE.md`. Branche `feat/animations`, travail dans le dossier du dépôt (pas de worktree). Commits en français, terminés par `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Ne jamais pousser.

---

## Carte des fichiers

| Fichier | Action | Responsabilité |
| --- | --- | --- |
| `test/home-motion.test.mjs` | créer | garde-fous : jetons dans les deux régimes ; aucun littéral de temps dans le `<style>`, aucune classe `duration-*`, aucune durée inline dans le script ; chaque `:hover` du `<style>` sous `@media(hover:hover)` ; `Reveal` présent (enfant unique, lit la préférence), `FadeUp`/`fade-up` absents, bloc de mouvement réduit complet ; schéma de délais 0 / 0,15 / 0,3 et `stagger` 0,06 |
| `assets/design-tokens-v2.css` | modifier | `--motion-fast/base/slow` dans `[data-design-regime="instrument"]` et `[data-design-regime="editorial"]` |
| `index.html` | modifier | `<style>` : 13 durées → jetons, retrait `fade-up`/`.anim-*`, `.reveal`, `.zoom-hover`, `.site-header`, bloc `@media(hover:hover)`, bloc mouvement réduit ; script : observateur + `Reveal` (remplacent `useInView` + `FadeUp`), hero (6 éléments), 3 sections (15 éléments), en-tête, 2 `img` |
| `assets/site.css` | régénérer (commité) | `duration-500`, `group-hover:scale-[1.02]`, `group-hover:scale-[1.03]` disparaissent |

Outils hors dépôt (dossier de notes partagé de la session « Tailwind compilé », `…/local_f872b47e-9db8-45a1-94e3-f5e109001d26/visuel/`) : `capturer.mjs`, `comparer.py`. Base « avant » déjà capturée sur `main` (`48765711`) dans le scratchpad de la session : `avant/1440` et `avant/390` pour `index`, `analyses`, `expertise`, `geopolitics` (8 captures).

---

### Task 1 : le test de garde (échoue tant que rien n'est fait)

**Files :**
- Create : `test/home-motion.test.mjs`

- [ ] **Step 1 : écrire le test**

```js
// Garde-fous du prompt 4 de l'audit Starlink (docs/superpowers/specs/2026-11-15-animations-design.md, §3).
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
const code = style + script;
// Un littéral de temps CSS (.22s, 0.6s, 300ms), pas une longueur (16px, 0.18em) ni un nombre (1.1).
const TEMPS = /(?<![\w.-])\d*\.?\d+m?s\b/g;

// Index de l'accolade qui ferme le bloc ouvert juste après `debut` (accolades équilibrées).
function finDeBloc(css, debut) {
  let profondeur = 0;
  for (let j = css.indexOf('{', debut); j < css.length; j++) {
    if (css[j] === '{') profondeur++;
    else if (css[j] === '}' && --profondeur === 0) return j;
  }
  throw new Error('bloc non fermé');
}
// Contenu du premier bloc `@media(<requete>){…}`, ou null. Correspondance de préfixe : `hover:hover` attrape aussi
// `@media(hover:hover) and (…)`. Graphie sans espace obligatoire (sinon le bloc n'est pas vu et le test échoue, bruyamment).
function blocMedia(css, requete) {
  const debut = css.indexOf(`@media(${requete})`);
  return debut === -1 ? null : css.slice(css.indexOf('{', debut) + 1, finDeBloc(css, debut));
}
// La feuille sans ses blocs `@media(<requete>){…}`.
function sansBlocs(css, requete) {
  let reste = '', i = 0;
  for (;;) {
    const debut = css.indexOf(`@media(${requete})`, i);
    if (debut === -1) return reste + css.slice(i);
    reste += css.slice(i, debut);
    i = finDeBloc(css, debut) + 1;
  }
}

test('design-tokens-v2.css : les trois jetons de mouvement dans les deux régimes', () => {
  const css = lire('assets/design-tokens-v2.css');
  for (const regime of ['instrument', 'editorial']) {
    const bloc = css.match(new RegExp(`\\[data-design-regime="${regime}"\\]\\s*\\{([^}]*)\\}`));
    assert.ok(bloc, `régime ${regime} introuvable`);
    assert.match(bloc[1], /--motion-fast:\s*\.15s ease;/, `${regime} : --motion-fast manque`);
    assert.match(bloc[1], /--motion-base:\s*\.3s cubic-bezier\(\.4,0,\.2,1\);/, `${regime} : --motion-base manque`);
    assert.match(bloc[1], /--motion-slow:\s*\.5s ease-out;/, `${regime} : --motion-slow manque`);
  }
});

test('index.html : aucune durée écrite en dur, les trois jetons consommés', () => {
  const litteraux = style.match(TEMPS) || [];
  assert.deepEqual(litteraux, [], `littéraux de temps dans le <style> : ${litteraux.join(', ')} (utiliser var(--motion-*))`);
  for (const jeton of ['--motion-fast', '--motion-base', '--motion-slow']) {
    assert.ok(style.includes(`var(${jeton})`), `${jeton} n'est consommé nulle part dans le <style>`);
  }
  const durations = code.match(/\bduration-\[?[\w.]+\]?/g) || [];
  assert.deepEqual(durations, [], `classes Tailwind de durée : ${durations.join(', ')} (les jetons sont composés, Tailwind ne peut pas les consommer : passer par le <style>)`);
  // Style inline React avec une durée (ex-FadeUp). animationDelay / transitionDelay (des délais) restent permis.
  const inline = script.match(/\b(?:transition|animation)\s*:\s*[`'"][^`'"]*?\d+m?s\b/g) || [];
  assert.deepEqual(inline, [], `durée inline dans le script : ${inline.join(' | ')}`);
  const inlineDuree = script.match(/\b(?:transition|animation)Duration\s*:/g) || [];
  assert.deepEqual(inlineDuree, [], 'transitionDuration / animationDuration inline : les durées viennent des jetons, dans le <style>');
});

test('index.html : tous les :hover du <style> sont sous @media(hover:hover), zoom des images dans la feuille', () => {
  assert.ok(blocMedia(style, 'hover:hover') !== null, 'aucun bloc @media(hover:hover) dans le <style>');
  const horsBloc = (sansBlocs(style, 'hover:hover').match(/[^{}\n]*:hover[^{]*\{/g) || []).map((s) => s.trim());
  assert.deepEqual(horsBloc, [], `:hover hors de @media(hover:hover) : ${horsBloc.join(' ; ')}`);
  assert.ok(!/group-hover:scale-/.test(script), 'zoom d\'image encore en group-hover:scale-* : utiliser .zoom-hover');
  assert.equal((script.match(/\bzoom-hover\b/g) || []).length, 2, 'les deux img zoomables (manchette, cartes Décryptages) portent zoom-hover');
});

test('index.html : Reveal (enfant unique, lit la préférence), FadeUp disparu, bloc de mouvement réduit complet', () => {
  assert.ok(/function Reveal\(/.test(script), 'composant Reveal absent');
  assert.ok(script.includes("matchMedia('(prefers-reduced-motion: reduce)')"), 'Reveal ne lit pas prefers-reduced-motion');
  assert.ok(/React\.Children\.only\(/.test(script) && /React\.cloneElement\(/.test(script), 'Reveal doit cloner un enfant unique (un div enveloppant casserait les grilles)');
  for (const mort of ['FadeUp', 'useInView', 'anim-fade-up', 'fade-up', 'anim-d1']) {
    assert.ok(!code.includes(mort), `${mort} encore présent : un seul mécanisme d'apparition (Reveal)`);
  }
  const reduit = blocMedia(style, 'prefers-reduced-motion:reduce');
  assert.ok(reduit, 'bloc @media(prefers-reduced-motion:reduce) introuvable');
  for (const attendu of [
    '.reveal{opacity:1;transform:none;transition:none}',
    '.zoom-hover{transition:none}',
    '.mobile-overlay.open .menu-item{animation:none;opacity:1}',
  ]) {
    assert.ok(reduit.includes(attendu), `mouvement réduit : ${attendu} manque`);
  }
  // La pastille et les squelettes : site.css (chargé en dernier) bat toute règle .animate-pulse{animation:none} du <style>,
  // seule la variante motion-safe: de Tailwind coupe vraiment l'animation en mouvement réduit.
  const nus = script.match(/(?<![\w:-])animate-pulse\b/g) || [];
  assert.equal(nus.length, 0, `${nus.length} animate-pulse sans motion-safe: (site.css, chargé en dernier, bat le <style>)`);
  assert.equal((script.match(/motion-safe:animate-pulse\b/g) || []).length, 8, 'pastille « À la une » + 7 blocs squelette en motion-safe:animate-pulse');
  // La classe n'existe en ligne que si site.css a été reconstruit (site-css.test.mjs ne vérifie que les valeurs arbitraires).
  assert.ok(lire('assets/site.css').includes('.motion-safe\\:animate-pulse{'), 'site.css n\'a pas été reconstruit : motion-safe:animate-pulse absent');
});

test('index.html : le schéma de délais du prompt 4 (0 / 0,15 / 0,3 ; +0,06 par carte)', () => {
  // Les props de Reveal sont plates (delay, stagger, key) : la capture s'arrête à la première accolade fermante.
  const usages = [...script.matchAll(/h\(Reveal,\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(usages.length >= 20, `seulement ${usages.length} Reveal : le hero et les trois sections en comptent au moins 20`);
  for (const props of usages) {
    const delay = props.match(/\bdelay:([\d.]+)/);
    assert.ok(delay, `Reveal sans delay explicite : {${props}}`);
    assert.ok(['0', '0.15', '0.3'].includes(delay[1]), `delay ${delay[1]} hors du schéma 0 / 0.15 / 0.3 : {${props}}`);
    const stagger = props.match(/\bstagger:([\d.]+)/);
    if (stagger) assert.equal(stagger[1], '0.06', `stagger ${stagger[1]} : les cartes ajoutent 0,06 s`);
  }
  assert.equal(usages.filter((p) => /\bstagger:/.test(p)).length, 2, 'deux grilles de cartes portent stagger (Décryptages, Sources & signaux)');
});
```

- [ ] **Step 2 : vérifier qu'il échoue**

```bash
node --test test/home-motion.test.mjs 2>&1 | grep -E '^(ok|not ok)'
```

Attendu : 5 tests, **5 échecs** (`--motion-fast` manque ; 17 littéraux de temps dans le `<style>` ; aucun bloc `hover:hover` ; `Reveal` absent ; 0 usage de `Reveal`).

Pas de commit à cette étape : le test est commité avec ce qu'il garde (Task 2 et Task 3).

---

### Task 2 : les trois jetons

**Files :**
- Modify : `assets/design-tokens-v2.css` (deux blocs)
- Test : `test/home-motion.test.mjs`

- [ ] **Step 1 : régime `instrument`**

Dans le bloc `[data-design-regime="instrument"] {`, après la ligne `  --chrome-text-3: rgba(245, 237, 230, .55);` (la dernière du bloc) et avant le `}`, ajouter :

```css

  /* Mouvement : trois durees, pas une de plus (audit Starlink 2026-11-13, section 7.4).
     fast survols et couleurs ; base menus, en-tete, onglets ; slow apparitions au defilement.
     Raccourcis composes (duree + courbe) : a consommer dans transition/animation, jamais dans Tailwind duration-*. */
  --motion-fast: .15s ease;
  --motion-base: .3s cubic-bezier(.4,0,.2,1);
  --motion-slow: .5s ease-out;
```

- [ ] **Step 2 : régime `editorial`**

Dans le bloc `[data-design-regime="editorial"] {`, après la ligne `  --chrome-text-3: rgba(245, 237, 230, .55);` (la dernière du bloc) et avant le `}`, ajouter exactement le même fragment :

```css

  /* Mouvement : trois durees, pas une de plus (audit Starlink 2026-11-13, section 7.4).
     fast survols et couleurs ; base menus, en-tete, onglets ; slow apparitions au defilement.
     Raccourcis composes (duree + courbe) : a consommer dans transition/animation, jamais dans Tailwind duration-*. */
  --motion-fast: .15s ease;
  --motion-base: .3s cubic-bezier(.4,0,.2,1);
  --motion-slow: .5s ease-out;
```

(Le fichier est écrit sans accents dans ses commentaires : respecter cette convention.)

- [ ] **Step 3 : vérifier**

```bash
node --test test/home-motion.test.mjs 2>&1 | grep -E '^(ok|not ok)'
```

Attendu : **`ok 1`**, `not ok 2`, `not ok 3`, `not ok 4`, `not ok 5`.

```bash
grep -c 'motion-\(fast\|base\|slow\)' assets/design-tokens-v2.css
```

Attendu : `6`.

- [ ] **Step 4 : commit**

```bash
git add assets/design-tokens-v2.css test/home-motion.test.mjs
git commit -m "Jetons : trois durées de mouvement, test de garde du prompt 4

--motion-fast/base/slow dans les deux régimes de design-tokens-v2.css (audit Starlink §7.4).
Aucun fichier ne les consomme encore ; index.html les adopte au commit suivant.
test/home-motion.test.mjs échoue sur index.html tant que la home n'est pas migrée.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3 : `index.html`, un remplacement à la fois

**Files :**
- Modify : `index.html` (`<style>` lignes 24-105, script lignes 113-661)
- Regenerate : `assets/site.css`
- Test : `test/home-motion.test.mjs`, `test/home-typo.test.mjs`, `test/site-css.test.mjs`

- [ ] **Step 1 : écrire le script de remplacement dans le scratchpad**

Chaque entrée est `[chaîne exacte avant, chaîne exacte après, nombre d'occurrences attendu]`. Le script s'arrête sans écrire si un compte diffère. Écrire ce fichier sous `<scratchpad>/remplacer-index.mjs` (hors dépôt). Les chaînes sont en guillemets doubles parce que le balisage est plein de guillemets simples ; `\n` est un saut de ligne ; `\\'` produit le `\'` du source.

```js
// Remplacements du prompt 4 sur index.html, une chaîne complète à la fois, compte vérifié.
import { readFileSync, writeFileSync } from 'node:fs';
const chemin = process.argv[2] || 'index.html';
let html = readFileSync(chemin, 'utf8');

// Nouveau bloc du script : observateur partagé + Reveal, à la place de useInView + FadeUp.
const ANCIENS_HOOKS = "function useInView(opts={}){\nconst ref=useRef(null)\nconst[visible,setVisible]=useState(false)\nuseEffect(()=>{\nif(!ref.current)return\nconst io=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVisible(true);io.disconnect()}},{threshold:opts.threshold||0.15})\nio.observe(ref.current)\nreturn()=>io.disconnect()\n},[])\nreturn[ref,visible]\n}\n\nfunction FadeUp({children,className='',delay=0}){\nconst[ref,visible]=useInView()\nreturn h('div',{ref,className,style:{opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(24px)',transition:`opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`}},children)\n}";
const NOUVEAUX_HOOKS = `// Apparitions (audit Starlink 7.2-7.5). Un seul IntersectionObserver pour tous les Reveal :
// les éléments qui franchissent le seuil dans la même image forment un lot, et le rang dans le lot
// porte le décalage des grilles (stagger). Un décalage par index cumulerait un retard visible
// sur les cartes hors du premier écran (9e carte de veille : 0,78 s après son entrée dans l'écran).
const revealAttente=new Map() // élément → {stagger, declencher}
let revealIO=null
function observerReveal(el,entree){
if(!revealIO)revealIO=new IntersectionObserver(entries=>{
let rang=0
for(const e of entries){
if(!e.isIntersecting)continue
const a=revealAttente.get(e.target)
if(!a)continue
revealAttente.delete(e.target);revealIO.unobserve(e.target)
a.declencher(a.stagger?rang++:0)
}
},{threshold:0.15})
revealAttente.set(el,entree);revealIO.observe(el)
return()=>{revealAttente.delete(el);revealIO.unobserve(el)}
}
const reduireMouvement=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Anime UN élément (opacity 0→1, translateY 16px→0, var(--motion-slow)) à son entrée dans l'écran.
// delay : secondes avant le départ ; stagger : secondes ajoutées par rang dans le lot (cartes d'une grille).
// L'enfant est cloné, pas enveloppé : un div intermédiaire casserait l'égalisation des hauteurs dans les grilles.
// Une fois la transition finie, l'enfant est rendu tel quel (plus de classe ni de délai) pour ne pas
// interférer avec ses propres transitions (.article-card) et rester identique au pixel à l'original.
function Reveal({delay=0,stagger=0,children}){
const enfant=React.Children.only(children)
const ref=useRef(null)
const[rang,setRang]=useState(-1) // -1 : pas encore entré dans l'écran
const[fini,setFini]=useState(false)
useEffect(()=>{if(ref.current)return observerReveal(ref.current,{stagger,declencher:setRang})},[])
if(fini||reduireMouvement())return enfant
const retard=Math.round((delay+Math.max(rang,0)*stagger)*1000)/1000
return React.cloneElement(enfant,{
ref,
className:\`\${enfant.props.className||''} reveal\${rang>=0?' is-visible':''}\`.trim(),
style:{...enfant.props.style,transitionDelay:\`\${retard}s\`},
onTransitionEnd:e=>{if(e.target===e.currentTarget&&e.propertyName==='opacity')setFini(true)}
})
}`;

const R = [
  // ── <style> : durées → jetons, :hover extraits, blocs nouveaux ──────────────────────────────
  // Animations du hero : supprimées (Reveal les remplace)
  ["/* Animations */\n@keyframes fade-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}\n.anim-fade-up{animation:fade-up .6s ease-out both}\n.anim-d1{animation-delay:.1s}.anim-d2{animation-delay:.2s}.anim-d3{animation-delay:.3s}.anim-d4{animation-delay:.4s}\n\n", "", 1],
  // Souligné du menu : durée, :hover sorti (.active reste)
  ["transform:scaleX(0);transition:transform .25s ease}\n.nav-link:hover::after,.nav-link.active::after{transform:scaleX(1)}", "transform:scaleX(0);transition:transform var(--motion-fast)}\n.nav-link.active::after{transform:scaleX(1)}", 1],
  // Méga-menu : trois durées, :hover sorti (.mega-open reste)
  ["transition:opacity .22s ease,transform .22s ease,visibility .22s;min-width:340px;z-index:60}\n.mega-menu.mega-open,.mega-menu:hover{", "transition:opacity var(--motion-base),transform var(--motion-base),visibility var(--motion-base);min-width:340px;z-index:60}\n.mega-menu.mega-open{", 1],
  // Entrée de méga-menu : durée, :hover sorti
  [".mega-item{transition:background .15s ease}\n.mega-item:hover{background:rgba(142,36,36,.06)}\n", ".mega-item{transition:background var(--motion-fast)}\n", 1],
  // En-tête au défilement : classe de page à la place de transition-all duration-300 (même valeur calculée)
  [".nav-scrolled{background:var(--chrome-scrolled);backdrop-filter:blur(16px);border-bottom:1px solid var(--chrome-border)}\n", ".nav-scrolled{background:var(--chrome-scrolled);backdrop-filter:blur(16px);border-bottom:1px solid var(--chrome-border)}\n/* En-tête au défilement : même valeur que l'ancien utilitaire Tailwind (300 ms). Le prompt 5 restreindra « all » à background-color et border-color. */\n.site-header{transition:all var(--motion-base)}\n", 1],
  // Hamburger
  ["margin:5px 0;transition:all .3s ease}", "margin:5px 0;transition:all var(--motion-base)}", 1],
  // Overlay mobile : deux durées
  ["transition:opacity .35s cubic-bezier(.4,0,.2,1),visibility .35s;height:100vh", "transition:opacity var(--motion-base),visibility var(--motion-base);height:100vh", 1],
  // Entrées du menu mobile (apparition)
  ["animation:menu-item-in .4s ease-out forwards}", "animation:menu-item-in var(--motion-slow) forwards}", 1],
  // Cartes : deux durées
  [".article-card{position:relative;transition:box-shadow .18s ease,border-color .18s ease}\n", ".article-card{position:relative;transition:box-shadow var(--motion-fast),border-color var(--motion-fast)}\n", 1],
  // Filet des cartes : durée ; les deux :hover sortis
  ["transform-origin:top;transition:transform .22s ease;z-index:1}\n.article-card:hover{box-shadow:0 6px 18px rgba(42,18,16,.12);border-color:var(--editorial-accent)}\n.article-card:hover::before{transform:scaleY(1)}\n", "transform-origin:top;transition:transform var(--motion-fast);z-index:1}\n", 1],
  // Après .featured-card : apparitions, zoom, bloc hover, bloc mouvement réduit (remplace l'ancien bloc partiel)
  [".featured-card{position:relative;overflow:hidden}\n\n@media(prefers-reduced-motion:reduce){.animate-pulse{animation:none}.article-card::before{transition:none}.anim-fade-up{animation:none}}\n",
   ".featured-card{position:relative;overflow:hidden}\n\n/* Apparitions — composant Reveal : un élément à la fois, opacité et 16 px, var(--motion-slow) (audit Starlink 7.2-7.4).\n   Déclaré après .article-card pour que sa transition gagne pendant l'apparition ; Reveal retire la classe ensuite. */\n.reveal{opacity:0;transform:translateY(16px);transition:opacity var(--motion-slow),transform var(--motion-slow)}\n.reveal.is-visible{opacity:1;transform:none}\n\n/* Zoom des images au survol (ex utilitaires Tailwind, 500 ms) : durée en jeton, coupé sur tactile et en mouvement réduit */\n.zoom-hover{transition:transform var(--motion-slow)}\n\n/* Survols — seulement pour un pointeur capable de survoler (audit 7.6) : sur tactile un :hover resterait collé après le toucher */\n@media(hover:hover){\n.nav-link:hover::after{transform:scaleX(1)}\n.mega-menu:hover{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}\n.mega-item:hover{background:rgba(142,36,36,.06)}\n.article-card:hover{box-shadow:0 6px 18px rgba(42,18,16,.12);border-color:var(--editorial-accent)}\n.article-card:hover::before{transform:scaleY(1)}\n}\n\n/* Zoom des images : survol possible ET mouvement non réduit, le motif de Starlink (audit 7.5) ; aucun :hover hors des blocs hover:hover */\n@media(hover:hover) and (prefers-reduced-motion:no-preference){\n.article-card:hover .zoom-hover{transform:scale(1.03)}\n.featured-card:hover .zoom-hover{transform:scale(1.02)}\n}\n\n/* Mouvement réduit : contenu affiché sans apparition, pas de zoom, pastille immobile, entrées du menu visibles (audit 7.5) */\n@media(prefers-reduced-motion:reduce){\n.article-card::before{transition:none}\n.reveal{opacity:1;transform:none;transition:none}\n.zoom-hover{transition:none}\n.mobile-overlay.open .menu-item{animation:none;opacity:1}\n}\n", 1],

  // ── Script : observateur + Reveal ───────────────────────────────────────────────────────────
  [ANCIENS_HOOKS, NOUVEAUX_HOOKS, 1],

  // ── En-tête ─────────────────────────────────────────────────────────────────────────────────
  ["className:`fixed top-[3px] left-0 right-0 z-50 transition-all duration-300 ${scrolled?'nav-scrolled':'bg-transparent'}`", "className:`site-header fixed top-[3px] left-0 right-0 z-50 ${scrolled?'nav-scrolled':'bg-transparent'}`", 1],

  // ── Hero : kicker 0, h1 0, filet 0, paragraphe 0.15, boutons 0.3, carte à la une 0.3 ──────────
  ["h('p',{className:'anim-fade-up kicker mb-5',style:{color:'var(--editorial-accent-text)'}},'§ Manchette — Intelligence du jour'),", "h(Reveal,{delay:0},h('p',{className:'kicker mb-5',style:{color:'var(--editorial-accent-text)'}},'§ Manchette — Intelligence du jour')),", 1],
  ["h('h1',{className:'anim-fade-up anim-d1 text-4xl", "h(Reveal,{delay:0},h('h1',{className:'text-4xl", 1],
  ["     'que le bruit dissimule.'\n    ),", "     'que le bruit dissimule.'\n    )),", 1],
  ["h('div',{className:'anim-fade-up anim-d1 mt-5 h-[3px] w-16 bg-[var(--editorial-accent)]'}),", "h(Reveal,{delay:0},h('div',{className:'mt-5 h-[3px] w-16 bg-[var(--editorial-accent)]'})),", 1],
  ["h('p',{className:'anim-fade-up anim-d2 mt-6 lg:mt-8", "h(Reveal,{delay:0.15},h('p',{className:'mt-6 lg:mt-8", 1],
  ["analyse IA.`\n    ),", "analyse IA.`\n    )),", 1],
  ["h('div',{className:'anim-fade-up anim-d3 mt-8 lg:mt-10 flex flex-col sm:flex-row gap-3'},", "h(Reveal,{delay:0.3},h('div',{className:'mt-8 lg:mt-10 flex flex-col sm:flex-row gap-3'},", 1],
  ["'Notre méthodologie')\n    )\n   ),", "'Notre méthodologie')\n    ))\n   ),", 1],
  ["h('a',{href:featured.href,className:'anim-fade-up anim-d2 featured-card block group'},", "h(Reveal,{delay:0.3},h('a',{href:featured.href,className:'featured-card block group'},", 1],
  ["'Score : '+featured.grade)\n      )\n     )\n    )\n", "'Score : '+featured.grade)\n      )\n     )\n    ))\n", 1],
  ["className:'w-full h-full object-cover group-hover:scale-[1.02] transition-all duration-500'", "className:'w-full h-full object-cover zoom-hover'", 1],

  // ── Les trois sections FadeUp redeviennent des sections nues ────────────────────────────────
  ["return h(FadeUp,null,h('section',{className:'py-20 md:py-24'},", "return h('section',{className:'py-20 md:py-24'},", 3],

  // ── Décryptages : kicker 0, h2 0, lien 0.3, cartes 0.3 + rang × 0.06, lien mobile 0.3 ────────
  ["h('p',{className:'kicker mb-3'},'§ Analyses — Décryptages'),", "h(Reveal,{delay:0},h('p',{className:'kicker mb-3'},'§ Analyses — Décryptages')),", 1],
  ["h('h2',{className:'text-3xl md:text-[2.5rem] md:leading-[1.1] font-extrabold text-[#101214]'},'Décryptages approfondis')", "h(Reveal,{delay:0},h('h2',{className:'text-3xl md:text-[2.5rem] md:leading-[1.1] font-extrabold text-[#101214]'},'Décryptages approfondis'))", 1],
  ["h('a',{href:'analyses.html',className:'hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[var(--editorial-accent)] hover:underline'},'Voir toutes les analyses →')", "h(Reveal,{delay:0.3},h('a',{href:'analyses.html',className:'hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[var(--editorial-accent)] hover:underline'},'Voir toutes les analyses →'))", 1],
  ["return h('a',{key:i,href:a.href,className:'article-card group block overflow-hidden bg-[#FFFFFF] border border-[var(--hairline-warm)] no-underline'},", "return h(Reveal,{key:i,delay:0.3,stagger:0.06},h('a',{href:a.href,className:'article-card group block overflow-hidden bg-[#FFFFFF] border border-[var(--hairline-warm)] no-underline'},", 1],
  ["className:'w-full h-full object-cover object-top group-hover:scale-[1.03] transition-all duration-500'", "className:'w-full h-full object-cover object-top zoom-hover'", 1],
  ["'Lire →')\n      )\n     )\n    )\n   })", "'Lire →')\n      )\n     )\n    ))\n   })", 1],
  ["h('a',{href:'analyses.html',className:'sm:hidden flex items-center justify-center gap-1 mt-6 text-sm font-semibold text-[var(--editorial-accent)]'},'Voir toutes les analyses →')\n )\n))\n}", "h(Reveal,{delay:0.3},h('a',{href:'analyses.html',className:'sm:hidden flex items-center justify-center gap-1 mt-6 text-sm font-semibold text-[var(--editorial-accent)]'},'Voir toutes les analyses →'))\n )\n)\n}", 1],

  // ── Sources & signaux : kicker 0, h2 0, sous-titre 0.15, filtres 0.3, cartes 0.3 + rang × 0.06, « Charger plus » 0.3
  ["h('p',{className:'kicker mb-3'},'§ Signaux — Veille continue'),", "h(Reveal,{delay:0},h('p',{className:'kicker mb-3'},'§ Signaux — Veille continue')),", 1],
  ["h('h2',{className:'text-3xl md:text-[2.5rem] md:leading-[1.1] font-extrabold text-[#101214]'},'Sources & signaux'),", "h(Reveal,{delay:0},h('h2',{className:'text-3xl md:text-[2.5rem] md:leading-[1.1] font-extrabold text-[#101214]'},'Sources & signaux')),", 1],
  ["h('p',{className:'text-sm mt-2 text-[#4C5052]',style:{fontFamily:\"'IBM Plex Mono',monospace\"}},`Flux automatisé — ${SOURCES_COUNT} sources, 15 APIs, filtrage IA`)", "h(Reveal,{delay:0.15},h('p',{className:'text-sm mt-2 text-[#4C5052]',style:{fontFamily:\"'IBM Plex Mono',monospace\"}},`Flux automatisé — ${SOURCES_COUNT} sources, 15 APIs, filtrage IA`))", 1],
  ["h('div',{className:'flex flex-wrap gap-2'},\n    h('button',{onClick:()=>{setFilter('all')", "h(Reveal,{delay:0.3},h('div',{className:'flex flex-wrap gap-2'},\n    h('button',{onClick:()=>{setFilter('all')", 1],
  ["},c.label))\n   )\n  ),", "},c.label))\n   ))\n  ),", 1],
  ["return h('a',{key:a.id,href:a.href||'#',target:", "return h(Reveal,{key:a.id,delay:0.3,stagger:0.06},h('a',{href:a.href||'#',target:", 1],
  ["a.source)\n     )\n    )\n   })", "a.source)\n     )\n    ))\n   })", 1],
  ["!loading&&hasMore&&h('div',{className:'text-center mt-10'},", "!loading&&hasMore&&h(Reveal,{delay:0.3},h('div',{className:'text-center mt-10'},", 1],
  ["'Charger plus d\\'articles'\n   )\n  )\n )\n))\n}", "'Charger plus d\\'articles'\n   )\n  ))\n )\n)\n}", 1],

  // ── Explorez notre couverture : kicker 0, h2 0, onglets 0.3, bloc liste + panneau 0.3 ────────
  ["h('p',{className:'kicker mb-3'},'§ Expertises — Couverture'),", "h(Reveal,{delay:0},h('p',{className:'kicker mb-3'},'§ Expertises — Couverture')),", 1],
  ["h('h2',{className:'text-3xl md:text-[2.5rem] md:leading-[1.1] font-extrabold text-[#101214]'},'Explorez notre couverture')", "h(Reveal,{delay:0},h('h2',{className:'text-3xl md:text-[2.5rem] md:leading-[1.1] font-extrabold text-[#101214]'},'Explorez notre couverture'))", 1],
  ["h('div',{className:'flex justify-center gap-2 mb-10'},", "h(Reveal,{delay:0.3},h('div',{className:'flex justify-center gap-2 mb-10'},", 1],
  ["'Géopolitique')\n  ),", "'Géopolitique')\n  )),", 1],
  ["h('div',{className:'flex flex-col md:flex-row gap-6 md:gap-0 border border-[var(--hairline-warm)] overflow-hidden bg-[#FFFFFF]'},", "h(Reveal,{delay:0.3},h('div',{className:'flex flex-col md:flex-row gap-6 md:gap-0 border border-[var(--hairline-warm)] overflow-hidden bg-[#FFFFFF]'},", 1],
  ["'Explorer →')\n   )\n  )\n )\n))\n}", "'Explorer →')\n   )\n  ))\n )\n)\n}", 1],
];

let erreurs = 0;
for (const [avant, , attendu] of R) {
  const n = html.split(avant).length - 1;
  if (n !== attendu) { erreurs++; console.error(`${n} occurrence(s) au lieu de ${attendu} : ${avant.slice(0, 90).replace(/\n/g, '⏎')}`); }
}
if (erreurs) { console.error(`${erreurs} compte(s) inattendu(s) : rien n'a été écrit.`); process.exit(1); }
for (const [avant, apres] of R) html = html.split(avant).join(apres);
writeFileSync(chemin, html);
console.log(`${R.length} règles appliquées, ${R.reduce((s, r) => s + r[2], 0)} remplacements.`);
```

- [ ] **Step 2 : l'exécuter**

```bash
node <scratchpad>/remplacer-index.mjs index.html
```

Attendu : `47 règles appliquées, 49 remplacements.` Si le script signale un compte inattendu, **ne pas corriger le compte** : lire la ligne concernée dans `index.html`, comprendre pourquoi, et corriger la chaîne.

- [ ] **Step 3 : contrôler l'inventaire après**

```bash
sed -n '/<style>/,/<\/style>/p' index.html | grep -oE '(^|[^a-zA-Z0-9.-])[0-9]*\.?[0-9]+m?s\b' | wc -l   # attendu 0
grep -c 'var(--motion-' index.html                        # attendu ≥ 14 (lignes)
grep -o 'FadeUp\|useInView\|anim-fade-up\|fade-up\|anim-d[1-4]\|duration-[0-9]*\|group-hover:scale' index.html | wc -l   # attendu 0
grep -c 'h(Reveal,{' index.html                           # attendu 21 (6 hero + 5 Décryptages + 6 veille + 4 expertises)
grep -o 'stagger:0.06' index.html | wc -l                 # attendu 2 (+ la définition de Reveal ne contient pas ce littéral)
grep -c 'zoom-hover' index.html                           # lignes : 2 img + règles du <style>
grep -c '@media(hover:hover)' index.html                  # attendu 2 (survols ; zoom = survol et mouvement non réduit)
grep -c 'site-header' index.html                          # attendu 2 (règle + className)
git diff --stat index.html                                # un seul fichier
```

- [ ] **Step 3 bis : le test de garde ignore les commentaires**

La version commitée à la Task 2 analysait le texte brut du `<style>` et du script : un commentaire CSS citant `duration-300` ou le mot `:hover` la faisait échouer. Mettre `test/home-motion.test.mjs` à la version de la Task 1 ci-dessus (ajout de `sansCommentaires` et de `code`, trois assertions lisent `code` ou `script` au lieu de `html`). Le diff attendu : 5 lignes modifiées ou ajoutées en tête, 3 assertions changées.

- [ ] **Step 4 : reconstruire `site.css`**

```bash
npm run build:css
grep -c 'duration-500\|group-hover\\:scale' assets/site.css   # attendu 0
grep -o 'duration-300' assets/site.css | head -1               # présent : 13 autres pages l'emploient
git diff --stat assets/site.css                                # modifié (classes retirées)
```

- [ ] **Step 5 : tests**

```bash
npm test 2>&1 | tail -12
```

Attendu : `# pass 83`, `# fail 0` (78 existants + 5 nouveaux). `test/home-typo.test.mjs` doit rester vert : la regex `h('h1',{…className:'…font-extrabold…'})` voit encore le `h1` du hero, désormais enfant de `Reveal`.

- [ ] **Step 6 : commit**

```bash
git add index.html assets/site.css test/home-motion.test.mjs
git commit -m "Home : apparitions élément par élément (Reveal), durées en jetons, survols sous hover:hover, mouvement réduit

Prompt 4 de l'audit Starlink (docs/superpowers/specs/2026-11-15-animations-design.md).
- Reveal clone un enfant unique (opacity 0→1, translateY 16px→0, var(--motion-slow)) et se retire après sa transition ;
  un seul IntersectionObserver, le rang dans le lot d'apparition porte le +0,06 s des cartes
- hero, Décryptages, Sources & signaux, Explorez notre couverture : titre 0, paragraphe 0,15, boutons et grilles 0,3
- <style> : 13 durées → --motion-fast/base/slow, fade-up et .anim-d* retirés, zoom des images dans la feuille,
  7 :hover sous @media(hover:hover), bloc prefers-reduced-motion étendu (reveal, zoom, entrées du menu mobile)
- en-tête : .site-header{transition:all var(--motion-base)} (même valeur que transition-all duration-300)
- assets/site.css reconstruit (duration-500 et group-hover:scale-* disparaissent)
- test de garde : les commentaires sont retirés avant analyse (un /* … */ citant une classe le faisait échouer)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3 bis : la pastille pulse encore en mouvement réduit ; préférence lue au montage ; test durci

Trouvé à la Task 4, Step 3 (vérification par script, mode réduit : `animationName` de la pastille = `pulse`). La règle `.animate-pulse{animation:none}` du bloc `prefers-reduced-motion:reduce` est battue par `site.css` (Tailwind), chargé en dernier élément du `<head>` avec la même spécificité. Elle l'était déjà avant le chantier. Correctif : la variante Tailwind `motion-safe:animate-pulse` (l'animation n'est émise que sous `no-preference`), sur la pastille et les 7 blocs squelette ; la règle morte est retirée ; le test de garde le vérifie.

Deux remarques de la relecture de spec, traitées ici aussi : (1) `Reveal` lisait la préférence à chaque rendu ; un élément rendu nu sous « réduire » n'a pas d'observateur, et si la préférence repassait à « normal » en cours de session, un nouveau rendu du parent (clic de filtre) le mettrait en `.reveal` invisible pour de bon. La préférence est désormais lue **au montage** (`useState(reduireMouvement)`). (2) Le test de garde ne verrait pas un futur `transitionDuration:'300ms'` inline : assertion ajoutée.

**Files :**
- Modify : `index.html` (8 classes, 1 règle du `<style>`, 2 lignes de `Reveal`)
- Modify : `test/home-motion.test.mjs` (version finale de la Task 1 ci-dessus)
- Regenerate : `assets/site.css`

- [ ] **Step 1 : remplacements à compte vérifié** (même méthode : script dans le scratchpad, s'arrête sans écrire si un compte diffère)

```js
// Correctif pastille : motion-safe:animate-pulse, règle morte retirée.
import { readFileSync, writeFileSync } from 'node:fs';
const chemin = process.argv[2] || 'index.html';
let html = readFileSync(chemin, 'utf8');
const R = [
  ["bg-[var(--chrome-text-1)] animate-pulse'", "bg-[var(--chrome-text-1)] motion-safe:animate-pulse'", 1], // pastille « À la une »
  [" animate-pulse ${bg}", " motion-safe:animate-pulse ${bg}", 7],                                       // blocs squelette
  ["@media(prefers-reduced-motion:reduce){\n.animate-pulse{animation:none}\n", "@media(prefers-reduced-motion:reduce){\n", 1], // règle battue par site.css
  // Préférence lue au montage, pas à chaque rendu
  ["const[fini,setFini]=useState(false)\nuseEffect(", "const[fini,setFini]=useState(false)\nconst[reduit]=useState(reduireMouvement) // lu au montage : un élément rendu nu le reste (il n'a pas d'observateur), même si la préférence change ensuite\nuseEffect(", 1],
  ["if(fini||reduireMouvement())return enfant", "if(fini||reduit)return enfant", 1],
];
let erreurs = 0;
for (const [avant, , attendu] of R) { const n = html.split(avant).length - 1; if (n !== attendu) { erreurs++; console.error(`${n} occurrence(s) au lieu de ${attendu} : ${avant}`); } }
if (erreurs) { console.error('rien n\'a été écrit.'); process.exit(1); }
for (const [avant, apres] of R) html = html.split(avant).join(apres);
writeFileSync(chemin, html);
console.log(`${R.length} règles appliquées, ${R.reduce((s, r) => s + r[2], 0)} remplacements.`);
```

Attendu : `5 règles appliquées, 11 remplacements.`

- [ ] **Step 2 : test de garde** : mettre `test/home-motion.test.mjs` à la version finale de la Task 1 (le bloc réduit n'attend plus `.animate-pulse{animation:none}` ; trois assertions nouvelles : aucun `animate-pulse` sans `motion-safe:`, 8 `motion-safe:animate-pulse`, aucun `transitionDuration`/`animationDuration` inline).

- [ ] **Step 3 : reconstruire et tester**

```bash
npm run build:css
grep -o 'prefers-reduced-motion:no-preference)[^}]*motion-safe\\:animate-pulse' assets/site.css | head -1   # la classe, sous no-preference
grep -c 'animate-pulse' index.html        # attendu 8 (lignes), toutes en motion-safe:
npm test 2>&1 | tail -8                   # 83 pass, 0 fail
```

- [ ] **Step 4 : commit**

```bash
git add index.html assets/site.css test/home-motion.test.mjs
git commit -m "Home : pastille et squelettes en motion-safe:animate-pulse, préférence de mouvement lue au montage

Trouvé en vérifiant le mouvement réduit dans Chrome : .animate-pulse{animation:none} du bloc
prefers-reduced-motion est redéfini par site.css, chargé en dernier avec la même spécificité.
La variante Tailwind motion-safe: n'émet l'animation que sous no-preference : rien à battre.
Reveal lit la préférence au montage (useState) et non à chaque rendu : un élément rendu nu
sous « réduire » n'a pas d'observateur et ne doit jamais repasser en .reveal (relecture de spec).
Test de garde : aucun animate-pulse sans motion-safe:, aucune transitionDuration inline,
règle morte retirée, site.css reconstruit.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3 ter : durcissements de la relecture qualité

Relecture qualité (sous-agent, diff `48765711..7fb78412`) : approuvée, aucun point critique. Deux points « importants » et quatre commentaires retenus, plus la règle d'impression (point 11). Non retenu : repli sans `IntersectionObserver` (point 10 : cible navigateurs à décider ; le site exige déjà les modules ES, `dvh`, `backdrop-filter`).

**Files :**
- Modify : `index.html` (`Reveal` : enfant hôte exigé, `onTransitionEnd` chaîné, deux commentaires ; `<style>` : deux commentaires, règle `@media print`)
- Modify : `test/home-motion.test.mjs` (version finale de la Task 1 : extraction explicite, garde `site.css`, deux commentaires)

- [ ] **Step 1 : remplacements à compte vérifié**

```js
// Durcissements de la relecture qualité, comptes vérifiés.
import { readFileSync, writeFileSync } from 'node:fs';
const chemin = process.argv[2] || 'index.html';
let html = readFileSync(chemin, 'utf8');
const R = [
  // <style> : commentaire de l'en-tête sans date, commentaire du bloc réduit exact, règle d'impression
  ["/* En-tête au défilement : même valeur que l'ancien utilitaire Tailwind (300 ms). Le prompt 5 restreindra « all » à background-color et border-color. */",
   "/* En-tête au défilement : « all » hérité de l'ancien utilitaire Tailwind (300 ms) ; à restreindre à background-color et border-color (prompt 5, en-tête et méga-menu). */", 1],
  ["/* Mouvement réduit : contenu affiché sans apparition, pas de zoom, pastille immobile, entrées du menu visibles (audit 7.5) */",
   "/* Mouvement réduit : contenu affiché sans apparition, pas de zoom, entrées du menu visibles (audit 7.5).\n   La pastille et les squelettes sont coupés par la variante motion-safe: de Tailwind (site.css), pas ici : une règle de page serait battue. */", 1],
  [".mobile-overlay.open .menu-item{animation:none;opacity:1}\n}\n", ".mobile-overlay.open .menu-item{animation:none;opacity:1}\n}\n\n/* Impression : rien ne doit rester invisible faute d'avoir défilé */\n@media print{.reveal{opacity:1;transform:none}}\n", 1],
  // Reveal : contrat (enfant hôte), limite connue, assertion, pourquoi de l'arrondi, onTransitionEnd chaîné
  ["// interférer avec ses propres transitions (.article-card) et rester identique au pixel à l'original.\nfunction Reveal({delay=0,stagger=0,children}){\nconst enfant=React.Children.only(children)\n",
   "// interférer avec ses propres transitions (.article-card) et rester identique au pixel à l'original.\n// Enfant hôte (balise) uniquement : la ref doit viser un nœud DOM. Sa ref et son transitionDelay sont remplacés, son onTransitionEnd chaîné.\n// Limite : une transition interrompue (display:none en cours, transitioncancel) n'émet pas transitionend ; l'élément garde alors la classe :\n// visuel identique, seule la transition de survol d'une carte est perdue jusqu'au rechargement (React 18 n'expose pas onTransitionCancel).\nfunction Reveal({delay=0,stagger=0,children}){\nconst enfant=React.Children.only(children)\nif(typeof enfant.type!=='string')throw new Error('Reveal : enfant hôte (balise) requis, la ref doit viser un nœud DOM')\n", 1],
  ["const retard=Math.round((delay+Math.max(rang,0)*stagger)*1000)/1000\n", "const retard=Math.round((delay+Math.max(rang,0)*stagger)*1000)/1000 // évite 0.3+2*0.06 = 0.42000000000000004 dans le DOM\n", 1],
  ["onTransitionEnd:e=>{if(e.target===e.currentTarget&&e.propertyName==='opacity')setFini(true)}", "onTransitionEnd:e=>{enfant.props.onTransitionEnd?.(e);if(e.target===e.currentTarget&&e.propertyName==='opacity')setFini(true)}", 1],
];
let erreurs = 0;
for (const [avant, , attendu] of R) { const n = html.split(avant).length - 1; if (n !== attendu) { erreurs++; console.error(`${n} occurrence(s) au lieu de ${attendu} : ${avant.slice(0, 90)}`); } }
if (erreurs) { console.error('rien n\'a été écrit.'); process.exit(1); }
for (const [avant, apres] of R) html = html.split(avant).join(apres);
writeFileSync(chemin, html);
console.log(`${R.length} règles appliquées, ${R.reduce((s, r) => s + r[2], 0)} remplacements.`);
```

Attendu : `6 règles appliquées, 6 remplacements.`

- [ ] **Step 2 : test de garde** à la version finale de la Task 1 (diff attendu : `extraire` et ses deux usages, commentaire de `blocMedia`, garde `site.css` dans le test 4, commentaire du test 5).

- [ ] **Step 3 : tests et syntaxe**

```bash
sed -n '/<script type="module">/,/<\/script>/p' index.html | sed '1d;$d' > /tmp/essai-index.mjs && node --check /tmp/essai-index.mjs && echo SYNTAX_OK
npm test 2>&1 | tail -8                   # 83 pass, 0 fail
git diff --stat                           # index.html, test/home-motion.test.mjs seulement (site.css inchangé : aucune classe nouvelle)
```

- [ ] **Step 4 : commit**

```bash
git add index.html test/home-motion.test.mjs
git commit -m "Home : Reveal durci (enfant hôte exigé, onTransitionEnd chaîné), garde sur la reconstruction de site.css, impression

Relecture qualité du prompt 4 : un enfant composant recevrait la ref comme prop et resterait invisible
sans bruit ; Reveal exige désormais une balise et chaîne un onTransitionEnd existant. Le test de garde
vérifie que site.css contient motion-safe:animate-pulse (la classe n'existe en ligne que reconstruite).
@media print : un élément pas encore apparu s'imprime. Commentaires du <style> et de Reveal précisés
(pastille coupée par Tailwind, limite de transitionend, pourquoi de l'arrondi, en-tête sans date).

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4 : comparaison visuelle avant / après et navigateur

**Files :** aucun fichier du dépôt. Outils : `<notes>/visuel/capturer.mjs`, `<notes>/visuel/comparer.py` ; base `<scratchpad>/avant` (8 captures). Serveur `python3 -m http.server 3000` déjà actif dans le dossier du dépôt.

- [ ] **Step 1 : captures « après »**

`capturer.mjs` gèle les transitions 600 ms après le défilement : les `Reveal` sont alors encore en cours (jusqu'à ~1,3 s après l'entrée dans l'écran) et composités, ce qui change la rastérisation du texte des sections animées (19 682 px de différence à 1440 pour une page pourtant identique une fois posée : vérifié par une capture après 3 s de repos, 0 px). On capture donc avec une copie, `capturer-reveal.mjs` (dossier de notes partagé de cette session, sous-dossier `visuel/`), qui attend 3 s après le défilement avant d'injecter le gel. Rien d'autre ne change.

```bash
PAGES=index.html,analyses.html,expertise.html,geopolitics.html node "<notes-prompt-4>/visuel/capturer-reveal.mjs" <scratchpad>/apres
```

Attendu : 8 captures ; `index` **5104 px** à 1440 et **9144 px** à 390 (mêmes hauteurs qu'avant : la mise en page ne bouge pas).

- [ ] **Step 2 : diff**

```bash
python3 -I "<notes>/visuel/comparer.py" <scratchpad>/avant <scratchpad>/apres <scratchpad>/diff
```

Attendu : **8 captures identiques sur 8** (0 pixel différent). Le flux de veille est servi localement par le même `data/news.json`, les gravures sont des fichiers du dépôt : rien de dynamique entre les deux captures. Toute zone rouge dans `<scratchpad>/diff/…` est une régression à expliquer ou corriger avant de continuer (`expertise.html` a un Canvas : s'il diffère, vérifier que c'est le radar et pas le chrome).

- [ ] **Step 3 : vérification du mouvement par script (Chrome sans fenêtre, CDP)**

Écrire `<scratchpad>/verifier-mouvement.mjs` (dérivé de `capturer.mjs` : même tuyau CDP, aucune dépendance npm) :

```js
// Vérifie le comportement du prompt 4 sur index.html, dans Chrome sans fenêtre (1440 px).
// Usage : node verifier-mouvement.mjs <dossier de sortie> [base=http://localhost:3000]
// Mode normal : jetons résolus dans les styles calculés, délais inline du hero, Reveal retiré après apparition,
//               séquence de captures de la section « Explorez notre couverture » à 0 / 150 / 300 / 600 / 1000 ms.
// Mode réduit : Emulation.setEmulatedMedia(prefers-reduced-motion: reduce) → aucun .reveal, pastille immobile,
//               zoom sans transition et sans transform sous :hover (souris posée sur la carte à la une).
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [sortieDir, base = 'http://localhost:3000'] = process.argv.slice(2);
if (!sortieDir) { console.error('Usage : node verifier-mouvement.mjs <dossier de sortie> [base]'); process.exit(1); }
mkdirSync(sortieDir, { recursive: true });
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profil = mkdtempSync(join(tmpdir(), 'mouvement-chrome-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-pipe', `--user-data-dir=${profil}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--window-size=1440,900', '--force-device-scale-factor=1', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const vers = chrome.stdio[3], depuis = chrome.stdio[4];
let numero = 0, tampon = '';
const enAttente = new Map();
depuis.setEncoding('utf8');
depuis.on('data', (d) => {
  tampon += d; let fin;
  while ((fin = tampon.indexOf('\0')) >= 0) {
    let m; try { m = JSON.parse(tampon.slice(0, fin)); } catch { m = null; }
    tampon = tampon.slice(fin + 1);
    if (!m || !enAttente.has(m.id)) continue;
    const { ok, ko } = enAttente.get(m.id); enAttente.delete(m.id);
    m.error ? ko(new Error(m.error.message)) : ok(m.result);
  }
});
const cdp = (method, params = {}, sessionId) => new Promise((ok, ko) => {
  const id = ++numero; enAttente.set(id, { ok, ko });
  vers.write(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }) + '\0');
});
const resultats = [];
const noter = (nom, valeur, attendu) => { const ok = JSON.stringify(valeur) === JSON.stringify(attendu); resultats.push({ nom, ok, valeur, attendu }); console.log(`${ok ? 'OK ' : 'KO '} ${nom} : ${JSON.stringify(valeur)}${ok ? '' : ` (attendu ${JSON.stringify(attendu)})`}`); };

try {
  const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true });
  const page = (m, p) => cdp(m, p, sessionId);
  await page('Runtime.enable'); await page('Page.enable');
  // Capteur d'erreurs console et d'exceptions, posé avant tout chargement.
  await page('Page.addScriptToEvaluateOnNewDocument', { source: "window.__erreurs=[];addEventListener('error',e=>__erreurs.push(String(e.message)));const _e=console.error;console.error=(...a)=>{__erreurs.push(a.join(' '));_e(...a)}" });
  const evaluer = async (expression) => {
    const r = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const photo = async (nom) => { const { data } = await page('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(sortieDir, nom), Buffer.from(data, 'base64')); };
  await page('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const charger = async () => {
    await page('Page.navigate', { url: `${base}/index.html` });
    for (let i = 0; i < 100; i++) { await attendre(100); if (await evaluer(`document.readyState==='complete'&&!!document.querySelector('h1')`).catch(() => false)) break; }
    await attendre(150); // les Reveal du premier écran sont en cours (0,5 s) : leurs délais inline sont lisibles
  };

  // ── Mode normal ──
  await page('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await charger();
  // Délais inline du hero relevés avant la fin des transitions (le hero est dans l'écran : lot de la première image).
  noter('hero : délais inline (kicker, h1, filet, p, boutons, carte)', await evaluer(`[...document.querySelectorAll('section:first-of-type [style*="transition-delay"]')].map(e=>e.style.transitionDelay)`), ['0s', '0s', '0s', '0.15s', '0.3s', '0.3s']);
  noter('jetons résolus : .reveal transition-duration', await evaluer(`getComputedStyle(document.querySelector('.reveal')).transitionDuration`), '0.5s, 0.5s');
  noter('jetons résolus : .mega-menu', await evaluer(`getComputedStyle(document.querySelector('.mega-menu')).transitionDuration`), '0.3s, 0.3s, 0.3s');
  noter('jetons résolus : header', await evaluer(`getComputedStyle(document.querySelector('header')).transitionDuration`), '0.3s');
  noter('jetons résolus : .zoom-hover', await evaluer(`getComputedStyle(document.querySelector('.zoom-hover')).transitionDuration`), '0.5s');
  await attendre(1500);
  noter('hero : Reveal retiré après apparition (plus de .reveal dans le premier écran)', await evaluer(`document.querySelectorAll('section:first-of-type .reveal').length`), 0);
  // Séquence d'apparition d'une section encore hors écran.
  await evaluer(`window.scrollTo(0,[...document.querySelectorAll('h2')].find(h=>h.textContent.includes('Explorez')).closest('section').offsetTop-80)`);
  const t0 = Date.now();
  for (const t of [0, 150, 300, 600, 1000]) { const reste = t0 + t - Date.now(); if (reste > 0) await attendre(reste); await photo(`sequence-${String(t).padStart(4, '0')}ms.png`); }
  await attendre(1500);
  noter('section Expertises : tous les Reveal retirés', await evaluer(`[...document.querySelectorAll('h2')].find(h=>h.textContent.includes('Explorez')).closest('section').querySelectorAll('.reveal').length`), 0);
  // Défilement complet puis repos : tous les Reveal visibles se sont retirés, les cartes ont retrouvé leur propre transition.
  await evaluer(`(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}return true})()`);
  await attendre(2500);
  noter('page entière : aucun Reveal visible restant (seul le lien mobile en display:none garde sa classe)', await evaluer(`[...document.querySelectorAll('.reveal')].filter(e=>getComputedStyle(e).display!=='none').length`), 0);
  noter('jetons résolus : .article-card après apparition (sa propre transition, plus celle de .reveal)', await evaluer(`getComputedStyle(document.querySelector('.article-card')).transitionDuration`), '0.15s, 0.15s');
  noter('console : aucune erreur hors 404 préexistant', await evaluer(`(window.__erreurs||[]).filter(e=>!/messari/.test(e))`), []);

  // ── Mode réduit ──
  await page('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await charger();
  noter('réduit : matchMedia', await evaluer(`matchMedia('(prefers-reduced-motion: reduce)').matches`), true);
  noter('réduit : aucun élément .reveal', await evaluer(`document.querySelectorAll('.reveal').length`), 0);
  noter('réduit : hero visible sans transition (opacity du h1)', await evaluer(`getComputedStyle(document.querySelector('h1')).opacity`), '1');
  noter('réduit : pastille « À la une » immobile', await evaluer(`getComputedStyle(document.querySelector('[class*="animate-pulse"]')).animationName`), 'none');
  noter('réduit : zoom sans transition', await evaluer(`getComputedStyle(document.querySelector('.zoom-hover')).transitionDuration`), '0s');
  const { x, y, width, height } = await evaluer(`(()=>{const r=document.querySelector('.featured-card').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()`);
  await page('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + width / 2, y: y + height / 2 });
  await attendre(200);
  noter('réduit : carte survolée, image sans zoom', await evaluer(`document.querySelector('.featured-card').matches(':hover')&&getComputedStyle(document.querySelector('.featured-card .zoom-hover')).transform`), 'none');
  await photo('reduit-survol.png');
  // Contre-épreuve : en mode normal, la même souris posée produit bien le zoom.
  await page('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await charger(); await attendre(1500);
  await page('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + width / 2, y: y + height / 2 });
  await attendre(800);
  noter('normal : carte survolée, image zoomée à 1.02', await evaluer(`getComputedStyle(document.querySelector('.featured-card .zoom-hover')).transform`), 'matrix(1.02, 0, 0, 1.02, 0, 0)');
  noter('normal : pastille « À la une » animée (motion-safe:animate-pulse sous no-preference)', await evaluer(`getComputedStyle(document.querySelector('[class*="animate-pulse"]')).animationName`), 'pulse');
  writeFileSync(join(sortieDir, 'resultats.json'), JSON.stringify(resultats, null, 2));
  console.log(`\n${resultats.filter((r) => r.ok).length}/${resultats.length} vérifications passent`);
} catch (e) { console.error(e.message); process.exitCode = 1; }
finally { try { vers.end(); } catch {} chrome.kill(); try { rmSync(profil, { recursive: true, force: true }); } catch {} }
```

```bash
node <scratchpad>/verifier-mouvement.mjs <scratchpad>/mouvement
```

Attendu : `18/18 vérifications passent`. Regarder `sequence-0000ms.png` → `sequence-1000ms.png` : le titre apparaît d'abord, les onglets et le bloc ensuite (à 300 ms le titre est visible, le bloc encore translucide ; à 1000 ms tout est en place).

- [ ] **Step 4 : navigateur de la session, onglet actif** (`http://localhost:3000/index.html`)

Confirmer à l'œil l'apparition décalée du hero au rechargement et des sections au défilement, vérifier la console (aucune erreur nouvelle ; le 404 `data/messari.json` est préexistant), et survoler une carte « Décryptages » : zoom lent (0,5 s), filet rouge et ombre rapides (0,15 s).

- [ ] **Step 5 : consigner les résultats dans ce plan** (section « Résultats mesurés » ci-dessous), passer le statut de la spec à « réalisé », et commiter le plan et la spec.

```bash
git add docs/superpowers/specs/2026-11-15-animations-design.md docs/superpowers/plans/2026-11-15-animations.md
git commit -m "Spec et plan du prompt 4 (animations de la home), résultats mesurés

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5 : compte rendu et attente de l'accord

- [ ] Écrire la note de passation `2026-11-15-prompt-4-animations.md` dans le dossier de notes partagé de cette session (ce qui est fait, écarts assumés, preuves, suites possibles dont `hoverOnlyWhenSupported`).
- [ ] Rendre compte à la session mère : commits, résultats des 17 vérifications, 8 captures identiques. **Ne pas pousser, ne pas ouvrir la PR** sans le « oui ».

---

## Résultats mesurés (2026-11-15)

- **Task 1-2** : commit `c2d1079f`. Test de garde avant tout : 5 échecs par assertion, le test 2 listant **17** littéraux (le « 18 » du cadrage était une erreur d'addition : 13 durées + 4 délais) ; après les jetons : `ok 1`, 4 échecs ; `npm test` 79/83.
- **Task 3** : commit `c5add94e`. Script : 47 règles, 49 remplacements, aucun compte inattendu (essayé à blanc sur une copie avant). Inventaire après : 0 littéral de temps hors commentaires, 21 `h(Reveal,{`, 2 `stagger:0.06`, 2 blocs `@media(hover:hover)`, `site-header` ×2, 0 `FadeUp`/`fade-up`/`anim-d*`/`duration-*`/`group-hover:scale-[`. `site.css` : `duration-500` et `group-hover:scale-[1.02]/[1.03]` disparus (`duration-300` reste, 13 autres pages ; `group-hover:scale-105` reste, `analyses.html`). `node --check` du script extrait : OK. `npm test` : **83/83**. Deux attendus du plan mal calibrés, corrigés dans le texte : `var(--motion-` compte 13 lignes (18 occurrences), et le `grep` de `site.css` attrapait `scale-105`.
- **Test de garde, premier faux positif** : la version de la Task 1 analysait le texte brut ; deux commentaires du nouveau `<style>` (l'un citant `duration-300`, l'autre le mot `:hover`) la faisaient échouer. Les commentaires sont retirés avant analyse (commit `c5add94e`).
- **Task 4, visuel, premier passage** (`capturer.mjs`, gel 600 ms après le défilement) : `expertise` et `geopolitics` identiques aux deux largeurs ; `analyses` 20 et 8 px ; `index` **19 680 px** à 1440 et **18 345 px** à 390, hauteurs inchangées (5104 / 9144), aucune différence d'amplitude > 128, rouge sur les contours de glyphes des seules sections animées. Expérience : page chargée, défilée, laissée 3 s au repos, puis gelée : **0 px** de différence avec `main`, avec ou sans `translateY(0)` réappliqué aux anciens blocs. Cause : le gel à 600 ms tombe pendant les transitions (éléments encore composités, rastérisation du texte différente). D'où `capturer-reveal.mjs` (copie, repos 3 s avant le gel) : **`index`, `analyses`, `expertise` identiques au pixel aux deux largeurs** ; `geopolitics` 4 px à 1440 et 2 px à 390 (contenu dynamique : identique au premier passage, différent au second, même zone de 90 × 26 px).
- **Task 4, script** (Chrome sans fenêtre, 1440 × 900) : premier passage 14/16. Deux KO : `.article-card` lu à 0,5 s parce que la première carte est sous la ligne de flottaison (contrôle déplacé après défilement complet) ; **pastille « À la une » : `animationName: pulse` sous `reduce`** → cascade de `site.css` (§2.4 de la spec), corrigée par la Task 3 bis. Passage final : **18/18** — délais inline du hero `["0s","0s","0s","0.15s","0.3s","0.3s"]` ; jetons résolus (`.reveal` 0,5 s ×2, `.mega-menu` 0,3 s ×3, `header` 0,3 s, `.zoom-hover` 0,5 s, `.article-card` 0,15 s ×2 après apparition) ; `Reveal` retiré après apparition (hero, section Expertises, page entière hors le lien mobile en `display:none`) ; console vide ; réduit : aucun `.reveal`, `h1` à opacité 1, pastille `none`, zoom `0s` et `transform: none` sous `:hover` ; normal : zoom `matrix(1.02, 0, 0, 1.02, 0, 0)`, pastille `pulse`. Séquence de captures de « Explorez notre couverture » à 0 / 150 / 300 / 600 / 1000 ms : titre d'abord, onglets puis bloc ensuite, tout en place à 1 s.
- **Task 3 bis** : commit `7fb78412` (5 règles, 11 remplacements ; `motion-safe:animate-pulse` émis par Tailwind sous `no-preference` ; `npm test` 83/83).
- **Relecture de conformité à la spec** (sous-agent, diff `48765711..c5add94e`) : **conforme**, 21 `Reveal` vérifiés un à un, 13 durées, cascade, périmètre, `site.css` reconstruit identique octet pour octet. Deux remarques non bloquantes, toutes deux intégrées à la Task 3 bis : préférence lue au montage ; assertion contre `transitionDuration`/`animationDuration` inline.
- **Navigateur de la session** (volet, 1024 × 768, onglet actif) : jetons résolus, durées calculées (`header` 0,3 s, `.mega-menu` 0,3 s, `.zoom-hover` 0,5 s), pastille animée, hero apparu, `IntersectionObserver` et `requestAnimationFrame` actifs, aucune erreur console. La personne a pris la main sur le volet pendant le contrôle (navigation vers `analyses.html`) : le défilement complet n'y a pas été rejoué ; le passage CDP ci-dessus fait foi.
- **Relecture qualité** (sous-agent `superpowers:code-reviewer`, diff `48765711..7fb78412`) : **approuvée**, aucun point critique. Vérifié par le relecteur : règles des hooks, nettoyage de l'observateur, cascade des 61 classes `site.css` portées par les 21 enfants (aucune ne déclare `opacity`/`transform`/`transition`), ordre des blocs `@media`, groupage React 18 des `setRang` d'un lot, sondage des regex du test sur une quinzaine de cas limites, +3 513 octets sur `index.html`. Retenus (Task 3 ter) : garde sur la reconstruction de `site.css` dans le test ; `Reveal` exige un enfant hôte et chaîne un `onTransitionEnd` existant ; quatre commentaires précisés ; `@media print`. Non retenus : repli sans `IntersectionObserver` (cible navigateurs à décider ; le site exige déjà les modules ES, `dvh`, `backdrop-filter`), tolérance aux objets imbriqués dans la regex des usages (props plates, documenté).
- **Task 3 ter** : commit `896e1629` (6 règles, 6 remplacements ; `site.css` inchangé ; `npm test` 83/83). **Passe finale après ce commit** : vérificateur **18/18** ; `index` **identique au pixel** à 1440 et 390 (`capturer-reveal.mjs`).
- **Bilan** : 4 commits au-dessus de `main` (`c2d1079f`, `c5add94e`, `7fb78412`, `896e1629`), `npm test` 83/83, branche non poussée, PR à ouvrir après le « oui ».

## Auto-revue du plan

- **Couverture de la spec** : §2.1 (durées) → Task 3 règles 1 à 11 du `<style>`, en-tête, 2 `img` ; §2.2 (blocs et délais) → Task 3 hero (11 règles), sections (23 règles), hooks ; §2.3 (`:hover`) → Task 3 règles 2, 3, 4, 10, 11 ; §2.4 (mouvement réduit) → règle 11 + `Reveal` ; §2.5 → Task 2 et captures de 3 autres pages (Task 4) ; §2.6 → Task 3 Step 4 ; §2.7 → Task 4 Step 1 ; décisions « test de garde » → Task 1 ; « hoverOnlyWhenSupported » → Task 5 (note) ; vérification §5 → Task 4.
- **Pas de place vide** : chaque remplacement porte sa chaîne complète et son compte ; le script de vérification est complet.
- **Pastille** : la décision « conservé ; déjà coupé » de la première version de la spec était fausse (cascade de `site.css`) ; corrigée par la Task 3 bis et consignée dans la spec §2.4.
- **Aucun `:hover` hors des blocs `hover:hover`** : le bloc de mouvement réduit ne contient plus de sélecteur de survol ; le zoom est neutralisé par la requête combinée `(hover:hover) and (prefers-reduced-motion:no-preference)`, que le test de garde traite comme un bloc `hover:hover` (même préfixe).
- **Cohérence des noms** : `reveal` / `is-visible` / `zoom-hover` / `site-header` identiques dans le `<style>` (règle 11, règle 5), le script React (`NOUVEAUX_HOOKS`, règles d'`img`), le test de garde (Task 1) et le script de vérification (Task 4) ; `delay` / `stagger` identiques dans `Reveal`, les usages et le test.
