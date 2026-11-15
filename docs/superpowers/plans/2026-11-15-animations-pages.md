# Apparitions des pages React (propagation du prompt 4) — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** porter aux 15 pages React et à `assets/article-shell.js` le mécanisme d'apparition de la home (composant `Reveal`, jetons `--motion-*`, délais 0 / 0,15 / 0,3 et + 0,06 par carte, `:hover` sous `@media(hover:hover)`, mouvement réduit respecté, plus de `scroll-reveal.js` ni d'`anim-fade-up`) **sans aucune différence sur l'état « apparu »**. Spec : `docs/superpowers/specs/2026-11-15-animations-pages-design.md`.

**Architecture :** un script de migration unique, piloté par famille de pages (`dossiers`, `articles`, `analyses`, `artifact`, `briefing`), qui n'écrit **que** des chaînes exactes à compte vérifié (jamais de chercher-remplacer global : `CLAUDE.md` §3) et enveloppe les éléments à animer par analyse de parenthèses (l'appel `h(…)` est reconnu par son début, sa fin est trouvée en sautant chaînes, gabarits et commentaires). Tous les comptes de toutes les pages sont vérifiés avant la première écriture. `Reveal` est copié tel quel depuis `index.html` (source unique ; le test de garde compare chaque copie à la home) : exporté par `article-shell.js` pour les 5 dossiers, inséré dans le script des 10 autres pages. Un test de garde paramétré par page rend les six points permanents.

**Tech Stack :** Node 26, `tailwindcss@3.4.19` (`npm run build:css`), `node --test` (`npm test`), Chrome sans fenêtre piloté par CDP + Pillow pour la comparaison visuelle (outils hors dépôt).

**Règles du dépôt :** lire `CLAUDE.md`. Si un compte diffère, **ne pas corriger le compte** : lire la ligne, comprendre, corriger la chaîne. Ne toucher ni `index.html`, ni `scroll-reveal.js`, ni `nav-shared.js`, ni `styles.css`, ni les 16 pages legacy, ni `tailwind.config.js`, ni `CLAUDE.md`. Branche `feat/animations-pages` (worktree `.claude/worktrees/hopeful-lovelace-39a606`), au-dessus de `main` (`5ed84a19`, fusion de la PR #145 ; arbre identique à `f9e295a2`). Commits en français, terminés par `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. **Ne jamais pousser** : push et PR après le « oui » seulement.

---

## Carte des fichiers

| Fichier | Action | Responsabilité |
| --- | --- | --- |
| `test/pages-motion.test.mjs` | créer | garde-fous paramétrés : 15 pages + coquille (Task 1) |
| `assets/article-shell.js` | modifier | `useRef` importé ; `Reveal` + observateur exportés ; `Section` (titre 0, enfants 0,15), `TitreAppareil` (0), appareil critique (textes 0,15 ; tableaux, listes, encadrés, CTA 0,3 ; cartes 0,3 + 0,06) ; `header` en `.site-header` |
| `analysis-template.html`, 4 dossiers | modifier | `<style>` : 13 opérations (durées → jetons, retrait `fade-up`/`anim-d*`, `.reveal`/`.site-header`, blocs `hover:hover` et mouvement réduit) ; balise `scroll-reveal.js` retirée |
| 7 articles React | modifier | idem + script : `Reveal` inséré, en-tête, hero (4 enveloppements) — 19 opérations |
| `analyses.html` | modifier | 29 opérations : style, `useRef`, `Reveal`, en-tête, hero (3), Article du jour (5), pastille `motion-safe:`, grille (4), `.zoom-hover` |
| `artifact-inflexion.html` | modifier | 20 opérations : style (+ `.logo-scroll`), `Reveal`, en-tête, logo, hero (4 + 3 cartes) |
| `briefing.html` | modifier | 37 opérations : style (règles propres, boucles en classes, `.toc-link`), `useInView`/ancien `Reveal` → copie de la home, en-tête, logo, hero (5), 8 blocs |
| `assets/site.css` | régénérer (commité) | `duration-200`, `transition-transform`, `group-hover:scale-105` disparaissent ; `duration-300`/`transition-all` selon les pages legacy |
| `docs/superpowers/plans/…` | compléter | résultats mesurés (fin de ce plan) |

**Outils hors dépôt** (scratchpad de la session, copiés en fin de chantier dans le dossier de notes partagé) : `plan/migrer-pages.mjs` (Task 2), `plan/pages-motion.test.mjs` (Task 1), `plan/verifier-mouvement-pages.mjs` (Task 5), `reveal-source.js` (`index.html` l. 145-192, extrait par `sed -n '145,192p'`), `outils/capturer-reveal.mjs` et `outils/comparer.py` (sessions précédentes), `outils/inventaire-sr.mjs` (cadrage). **Base « avant »** : `avant/1440` et `avant/390`, 18 pages (15 + `index`, `expertise`, `geopolitics`) sur `f9e295a2` (= `main` `5ed84a19`), serveur `python3 -m http.server 3407` lancé **depuis le worktree** (le port 3000 sert le dépôt principal, pas cette branche).

---

### Task 1 : le test de garde (échoue tant que rien n'est fait)

**Files :** Create `test/pages-motion.test.mjs`

- [ ] **Step 1 : écrire le test** (copie de `plan/pages-motion.test.mjs`)

```js
// Garde-fous de la propagation du prompt 4 aux pages React (docs/superpowers/specs/2026-11-15-animations-pages-design.md, §3).
// Dérivé de test/home-motion.test.mjs, paramétré par page. Aucune dépendance : lit les fichiers du dépôt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const RACINE = new URL('../', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, RACINE), 'utf8');
// Les commentaires (/* */ en CSS, // en JS) sont de la prose, pas du code : retirés avant toute analyse.
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
// Un littéral de temps CSS (.22s, 0.6s, 300ms), pas une longueur (16px, 0.18em) ni un nombre (1.1).
const TEMPS = /(?<![\w.-])\d*\.?\d+m?s\b/g;

const DOSSIERS = ['analysis-template.html', 'analyse-ukraine-mer-noire-guerre-attrition.html', 'analyse-turquie-erdogan-equilibriste.html', 'analyse-sahel-mali-niger-burkina-crise.html', 'analyse-mer-chine-taiwan-indopacifique.html'];
const ARTICLES = ['analyse-arctique-groenland-grand-jeu-polaire.html', 'analyse-cloud-ia-pme-europeennes.html', 'analyse-corridor-defense-france-inde.html', 'analyse-cuba-crise-perspectives.html', 'analyse-fta-ue-inde-traite-fiscal.html', 'analyse-madagascar-fragilite-ressources.html', 'analyse-petrole-trump-iran-ormuz.html'];
const AUTONOMES = [...ARTICLES, 'analyses.html', 'artifact-inflexion.html', 'briefing.html']; // embarquent leur propre copie de Reveal
const PAGES = [...DOSSIERS, ...AUTONOMES];
const HERO_DYNAMIQUE = new Set([...DOSSIERS, ...ARTICLES, 'briefing.html']);

function finDeBloc(css, debut) {
  let profondeur = 0;
  for (let j = css.indexOf('{', debut); j < css.length; j++) {
    if (css[j] === '{') profondeur++;
    else if (css[j] === '}' && --profondeur === 0) return j;
  }
  throw new Error('bloc non fermé');
}
// Contenu du premier bloc `@media(<requete>){…}`, ou null. Préfixe : `hover:hover` attrape aussi `@media(hover:hover) and (…)`.
function blocMedia(css, requete) {
  const debut = css.indexOf(`@media(${requete})`);
  return debut === -1 ? null : css.slice(css.indexOf('{', debut) + 1, finDeBloc(css, debut));
}
function sansBlocs(css, requete) {
  let reste = '', i = 0;
  for (;;) {
    const debut = css.indexOf(`@media(${requete})`, i);
    if (debut === -1) return reste + css.slice(i);
    reste += css.slice(i, debut);
    i = finDeBloc(css, debut) + 1;
  }
}
// Une déclaration `animation:` en boucle (`infinite`) peut garder sa durée : hors de l'échelle à trois jetons (spec §3, boucles décoratives).
const sansBoucles = (css) => css.replace(/animation:[^;{}]*\binfinite\b[^;{}]*/g, 'animation:BOUCLE');

function partiesDe(page) {
  const html = lire(page);
  const m1 = html.match(/<style>([\s\S]*?)<\/style>/);
  const m2 = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(m1, `${page} : <style> introuvable`);
  assert.ok(m2, `${page} : <script type="module"> introuvable`);
  return { html, style: sansCommentaires(m1[1]), script: sansCommentaires(m2[1]) };
}

// Le bloc Reveal (observateur partagé + composant) de la home, source unique : chaque copie doit lui être identique.
function blocReveal(code) {
  const debut = code.indexOf('const revealAttente=new Map()');
  const def = code.indexOf('function Reveal(', debut);
  const fin = code.indexOf('\n}\n', def);
  assert.ok(debut !== -1 && def !== -1 && fin !== -1, 'bloc Reveal introuvable');
  return code.slice(debut, fin + 2).replace(/^export /gm, '');
}
const REVEAL_HOME = blocReveal(sansCommentaires(lire('index.html').match(/<script type="module">([\s\S]*?)<\/script>/)[1]));

const SHELL = sansCommentaires(lire('assets/article-shell.js'));

test('article-shell.js : Reveal exporté, identique à la home ; Section et appareil critique le posent ; en-tête en .site-header', () => {
  assert.ok(/^export function Reveal\(/m.test(SHELL), 'Reveal n\'est pas exporté par la coquille');
  assert.equal(blocReveal(SHELL), REVEAL_HOME, 'la copie de Reveal dans article-shell.js diverge de index.html');
  assert.ok(SHELL.includes('useRef'), 'useRef manque à l\'import React de la coquille');
  assert.ok(!/duration-\d/.test(SHELL), 'classe Tailwind de durée dans la coquille');
  assert.ok(SHELL.includes('site-header fixed top-[3px]'), 'l\'en-tête de la coquille ne porte pas .site-header');
  // Section : h2 à 0, chaque enfant hôte à 0,15 ; les enfants non hôtes (null, texte) passent tels quels.
  assert.ok(/children\.map\(\(enfant, i\) => React\.isValidElement\(enfant\) && typeof enfant\.type === 'string' \? h\(Reveal, \{ key: i, delay: 0\.15 \}, enfant\) : enfant\)/.test(SHELL), 'Section ne pose pas Reveal (0,15) sur ses enfants hôtes');
  const usages = [...SHELL.matchAll(/h\(\s*Reveal\s*,\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(usages.length >= 14, `seulement ${usages.length} Reveal dans la coquille : Section (2) et l'appareil critique (≥ 12)`);
  for (const props of usages) {
    const delay = props.match(/\bdelay:\s*([\d.]+)/);
    assert.ok(delay, `Reveal sans delay explicite : {${props}}`);
    assert.ok(['0', '0.15', '0.3'].includes(delay[1]), `delay ${delay[1]} hors du schéma 0 / 0.15 / 0.3 : {${props}}`);
    const stagger = props.match(/\bstagger:\s*([\d.]+)/);
    if (stagger) assert.equal(stagger[1], '0.06', `stagger ${stagger[1]} : les cartes ajoutent 0,06 s`);
  }
  assert.equal(usages.filter((p) => /\bstagger:/.test(p)).length, 2, 'deux grilles portent stagger (scénarios, articles liés)');
});

for (const page of PAGES) {
  const autonome = AUTONOMES.includes(page);

  test(`${page} : aucune durée écrite en dur hors boucle, les trois jetons consommés, aucune durée Tailwind ni inline`, () => {
    const { style, script } = partiesDe(page);
    const litteraux = sansBoucles(style).match(TEMPS) || [];
    assert.deepEqual(litteraux, [], `littéraux de temps dans le <style> : ${litteraux.join(', ')} (utiliser var(--motion-*))`);
    for (const jeton of ['--motion-fast', '--motion-base', '--motion-slow']) {
      assert.ok(style.includes(`var(${jeton})`), `${jeton} n'est consommé nulle part dans le <style>`);
    }
    const durations = (style + script).match(/\bduration-\[?[\w.]+\]?/g) || [];
    assert.deepEqual(durations, [], `classes Tailwind de durée : ${durations.join(', ')}`);
    const inline = script.match(/\b(?:transition|animation)\s*:\s*[`'"][^`'"]*?\d+m?s\b/g) || [];
    assert.deepEqual(inline, [], `durée inline dans le script : ${inline.join(' | ')}`);
    assert.deepEqual(script.match(/\b(?:transition|animation)Duration\s*:/g) || [], [], 'transitionDuration / animationDuration inline');
  });

  test(`${page} : les :hover du <style> sont sous @media(hover:hover), sauf l'ouverture du méga-menu`, () => {
    const { style } = partiesDe(page);
    assert.ok(blocMedia(style, 'hover:hover') !== null, 'aucun bloc @media(hover:hover) dans le <style>');
    const horsBloc = (sansBlocs(style, 'hover:hover').match(/[^{}\n]*:hover[^{]*\{/g) || []).map((s) => s.trim());
    // Exception assumée (spec §2.3) : le méga-menu de ces pages s'ouvre par CSS ; sous hover:hover il serait inaccessible sur tablette.
    assert.deepEqual(horsBloc, ['.mega-trigger:hover .mega-menu,.mega-menu:hover{'], `:hover hors de @media(hover:hover) : ${horsBloc.join(' ; ')}`);
  });

  test(`${page} : un seul mécanisme d'apparition (Reveal), mots morts absents, mouvement réduit complet`, () => {
    const { html, style, script } = partiesDe(page);
    assert.ok(!html.includes('scroll-reveal.js'), 'charge encore scroll-reveal.js');
    for (const mort of ['FadeUp', 'useInView', 'anim-fade-up', 'fade-up', 'anim-d1', 'reveal-section', 'sr-hidden']) {
      assert.ok(!(style + script).includes(mort), `${mort} encore présent`);
    }
    if (autonome) {
      assert.ok(/function Reveal\(/.test(script), 'copie de Reveal absente');
      assert.equal(blocReveal(script), REVEAL_HOME, 'la copie de Reveal diverge de index.html');
      assert.ok(script.includes('site-header fixed top-[3px]'), 'l\'en-tête ne porte pas .site-header');
    } else {
      assert.ok(!/function Reveal\(/.test(script), 'un dossier ne doit pas redéfinir Reveal : il vient d\'article-shell.js');
    }
    assert.ok(style.includes('.reveal{opacity:0;transform:translateY(16px);transition:opacity var(--motion-slow),transform var(--motion-slow)}'), 'règle .reveal absente');
    assert.ok(style.includes('.site-header{transition:all var(--motion-base)}'), 'règle .site-header absente');
    const reduit = blocMedia(style, 'prefers-reduced-motion:reduce');
    assert.ok(reduit, 'bloc @media(prefers-reduced-motion:reduce) introuvable');
    for (const attendu of ['.reveal{opacity:1;transform:none;transition:none}', '.mobile-overlay.open .menu-item{animation:none;opacity:1}']) {
      assert.ok(reduit.includes(attendu), `mouvement réduit : ${attendu} manque`);
    }
    if (HERO_DYNAMIQUE.has(page)) assert.ok(reduit.includes('.hero-dynamic,.hero-dynamic::before{animation-play-state:paused}'), 'hero dynamique non mis en pause');
    const nus = script.match(/(?<![\w:-])animate-pulse\b/g) || [];
    assert.equal(nus.length, 0, `${nus.length} animate-pulse sans motion-safe: (site.css, chargé en dernier, bat le <style>)`);
  });

  if (autonome) {
    test(`${page} : le schéma de délais du prompt 4 (0 / 0,15 / 0,3 ; +0,06 par carte)`, () => {
      const { script } = partiesDe(page);
      const usages = [...script.matchAll(/h\(\s*Reveal\s*,\s*\{([^}]*)\}/g)].map((m) => m[1]);
      assert.ok(usages.length >= 4, `seulement ${usages.length} Reveal : le hero en compte au moins 3`);
      for (const props of usages) {
        const delay = props.match(/\bdelay:\s*([\d.]+)/);
        assert.ok(delay, `Reveal sans delay explicite : {${props}}`);
        assert.ok(['0', '0.15', '0.3'].includes(delay[1]), `delay ${delay[1]} hors du schéma : {${props}}`);
        const stagger = props.match(/\bstagger:\s*([\d.]+)/);
        if (stagger) assert.equal(stagger[1], '0.06', `stagger ${stagger[1]} : les cartes ajoutent 0,06 s`);
      }
    });
  }
}

test('analyses.html : pastille en motion-safe:animate-pulse, zoom des cartes dans la feuille', () => {
  const { style, script } = partiesDe('analyses.html');
  assert.equal((script.match(/motion-safe:animate-pulse\b/g) || []).length, 1, 'la pastille « Article du jour » porte motion-safe:animate-pulse');
  assert.ok(!/group-hover:scale-/.test(script), 'zoom encore en group-hover:scale-* : utiliser .zoom-hover');
  assert.equal((script.match(/\bzoom-hover\b/g) || []).length, 1, 'l\'image des cartes porte zoom-hover');
  assert.ok(blocMedia(style, 'hover:hover) and (prefers-reduced-motion:no-preference')?.includes('.article-card:hover .zoom-hover{transform:scale(1.05)}'), 'zoom hors du bloc hover:hover + no-preference');
  assert.ok(blocMedia(style, 'prefers-reduced-motion:reduce').includes('.zoom-hover{transition:none}'), 'zoom non coupé en mouvement réduit');
  assert.ok(lire('assets/site.css').includes('.motion-safe\\:animate-pulse{'), 'site.css n\'a pas été reconstruit');
});

test('briefing.html : boucles en classes (pulse-live, spin), sommaire en .toc-link, jauge et cartes en jetons', () => {
  const { style, script } = partiesDe('briefing.html');
  assert.ok(script.includes("className:'pulse-live'"), 'pastille LIVE : classe .pulse-live attendue');
  assert.ok(script.includes("className:'spin w-5 h-5"), 'spinner : classe .spin attendue');
  assert.ok(style.includes('@keyframes spin{'), '@keyframes spin manque (le spinner ne tournait pas)');
  assert.ok(style.includes('.toc-link{transition:background-color var(--motion-fast),color var(--motion-fast)}'), 'règle .toc-link attendue');
  assert.ok(script.includes('text-xs toc-link no-underline'), 'les liens du sommaire portent .toc-link');
  assert.ok(style.includes('transition:width var(--motion-slow)'), '.prob-fill en --motion-slow');
  const reduit = blocMedia(style, 'prefers-reduced-motion:reduce');
  for (const attendu of ['.pulse-live{animation-play-state:paused}', '.prob-fill{transition:none}']) assert.ok(reduit.includes(attendu), `mouvement réduit : ${attendu} manque`);
});

test('scroll-reveal.js reste dans le dépôt : nav-shared.js l\'injecte sur les pages legacy', () => {
  assert.ok(lire('scroll-reveal.js').length > 0);
  assert.ok(lire('nav-shared.js').includes("sr.src='scroll-reveal.js'"), 'nav-shared.js n\'injecte plus scroll-reveal.js : vérifier les 16 pages legacy');
});
```

- [ ] **Step 2 : vérifier qu'il échoue**

```bash
node --test test/pages-motion.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail)'
```

Attendu : 59 tests, **58 échecs** (seul `scroll-reveal.js reste dans le dépôt` passe ; relevé exact à noter dans les résultats). Pas de commit : le test est commité avec la première famille migrée (Task 2, `dossiers`).

---

### Task 2 : migration, une famille à la fois

**Files :** Modify les 16 fichiers de la carte, dans l'ordre `dossiers` → `articles` → `analyses` → `artifact` → `briefing`. Test : `test/pages-motion.test.mjs`.

- [ ] **Step 1 : le script de migration** (`<scratchpad>/plan/migrer-pages.mjs`, lit `../reveal-source.js`)

```js
// Propagation du prompt 4 aux 15 pages React + article-shell.js : un fichier à la fois, chaînes exactes à compte vérifié,
// enveloppement des éléments par analyse de parenthèses (jamais de chercher-remplacer global : CLAUDE.md §3).
// Usage : node migrer-pages.mjs [--verifier] [dossiers|articles|analyses|artifact|briefing …]   (défaut : toutes les familles)
// Tous les comptes de toutes les pages demandées sont vérifiés AVANT d'écrire quoi que ce soit ; un seul écart et rien n'est écrit.
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const VERIFIER = args.includes('--verifier');
const FAMILLES = args.filter((a) => !a.startsWith('--'));
// Bloc Reveal de la home (index.html, observateur partagé + composant), copié tel quel.
const REVEAL = readFileSync(new URL('../reveal-source.js', import.meta.url), 'utf8').replace(/\n+$/, '\n');

// ─── Analyse lexicale minimale : fin d'un appel h(…) ─────────────────────────────────────────
function finChaine(src, i) { const q = src[i]; for (i++; i < src.length; i++) { if (src[i] === '\\') { i++; continue; } if (src[i] === q) return i; if (src[i] === '\n') throw new Error('chaîne non fermée'); } throw new Error('chaîne non fermée'); }
function finGabarit(src, i) { for (i++; i < src.length; i++) { if (src[i] === '\\') { i++; continue; } if (src[i] === '`') return i; if (src[i] === '$' && src[i + 1] === '{') i = sauter(src, i + 2, '}'); } throw new Error('gabarit non fermé'); }
// Index du `fermant` non apparié à partir de i (chaînes, gabarits et commentaires ignorés).
function sauter(src, i, fermant) {
  let p = 0, a = 0, c = 0;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === "'" || ch === '"') { i = finChaine(src, i); continue; }
    if (ch === '`') { i = finGabarit(src, i); continue; }
    if (ch === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (ch === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i); if (i < 0) break; i++; continue; }
    if (p === 0 && a === 0 && c === 0 && ch === fermant) return i;
    if (ch === '(') p++; else if (ch === ')') p--; else if (ch === '{') a++; else if (ch === '}') a--; else if (ch === '[') c++; else if (ch === ']') c--;
    if (p < 0 || a < 0 || c < 0) throw new Error(`déséquilibre près de « ${src.slice(Math.max(0, i - 40), i + 1)} »`);
  }
  throw new Error('fin de fichier atteinte');
}

// ─── Opérations (chacune : src → src, lève si le compte diffère) ─────────────────────────────
const compter = (src, s) => src.split(s).length - 1;
const verifier = (src, s, attendu) => { const n = compter(src, s); if (n !== attendu) throw new Error(`${n} occurrence(s) au lieu de ${attendu} : ${JSON.stringify(s.slice(0, 90))}`); };
/** Remplace une chaîne exacte, présente `attendu` fois. */
const remplacer = (avant, apres, attendu = 1) => (src) => { verifier(src, avant, attendu); return src.split(avant).join(apres); };
/** Enveloppe l'appel h(…) qui commence par `marqueur` : `avant` est posé devant (« h(Reveal,{delay:0}, »), `cle` est retirée du
 *  enfant (déjà portée par `avant`), `retirer` sont des sous-chaînes supprimées dans l'appel (classes anim-*). */
const envelopper = ({ marqueur, avant, cle = '', retirer = [], attendu = 1 }) => (src) => {
  verifier(src, marqueur, attendu);
  if (!marqueur.startsWith('h(')) throw new Error(`marqueur sans h( : ${marqueur.slice(0, 60)}`);
  let out = '', i = 0;
  for (;;) {
    const d = src.indexOf(marqueur, i);
    if (d === -1) return out + src.slice(i);
    const fin = sauter(src, d + 2, ')');
    let appel = src.slice(d, fin + 1);
    if (cle) { verifier(appel, cle, 1); appel = appel.replace(cle, ''); }
    for (const r of retirer) { verifier(appel, r, 1); appel = appel.replace(r, ''); }
    out += src.slice(i, d) + avant + appel + ')';
    i = fin + 1;
  }
};
/** Remplace « h(Reveal,null, » par « ( » devant l'appel qui commence par `marqueur`, et la parenthèse fermante de ce Reveal reste :
 *  h(Reveal,null,X) devient (X), une expression parenthésée (pas de « return » suivi d'un saut de ligne). */
const desenvelopper = (marqueur, attendu = 1) => (src) => {
  const ANCIEN = 'h(Reveal,null,';
  verifier(src, marqueur, attendu);
  let out = '', i = 0;
  for (;;) {
    const d = src.indexOf(marqueur, i);
    if (d === -1) return out + src.slice(i);
    if (!marqueur.startsWith(ANCIEN)) throw new Error('marqueur à désenvelopper sans h(Reveal,null,');
    out += src.slice(i, d) + '(';
    i = d + ANCIEN.length;
  }
};
const inserer = (ancre, texte, attendu = 1) => remplacer(ancre, ancre + texte, attendu);

// ─── CSS commun (spec §3) ───────────────────────────────────────────────────────────────────
const CSS_REVEAL = `
/* Apparitions — composant Reveal (prompt 4 de l'audit Starlink) : un élément à la fois, opacité et 16 px, var(--motion-slow).
   Déclaré après les cartes pour que sa transition gagne pendant l'apparition ; Reveal retire la classe ensuite. */
.reveal{opacity:0;transform:translateY(16px);transition:opacity var(--motion-slow),transform var(--motion-slow)}
.reveal.is-visible{opacity:1;transform:none}
/* En-tête au défilement : même valeur que l'ancien utilitaire Tailwind (300 ms). Le prompt 5 restreindra « all » à background-color et border-color. */
.site-header{transition:all var(--motion-base)}
`;
const COMMENTAIRE_HOVER = `/* Survols — pointeur capable de survoler seulement (audit 7.6) : sur tactile un :hover resterait collé après le toucher.
   L'ouverture du méga-menu (.mega-trigger:hover .mega-menu) reste hors de ce bloc : sur tablette, ce :hover émulé au toucher est le seul moyen d'ouvrir le menu. */`;
const HOVER_NAV = (fondItem) => `.nav-link:hover::after{transform:scaleX(1)}\n.mega-item:hover{background:${fondItem}}\n`;
const HOVER_CARTES = `.article-card:hover{box-shadow:0 6px 18px rgba(14,16,18,.10);border-color:var(--border-hairline)}\n.article-card:hover::before{transform:scaleY(1)}\n`;
const COMMENTAIRE_REDUIT = `/* Mouvement réduit (audit 7.5) : contenu affiché sans apparition, entrées du menu visibles, boucles décoratives figées sur leur première image */`;
const REDUIT_COMMUN = `.reveal{opacity:1;transform:none;transition:none}\n.mobile-overlay.open .menu-item{animation:none;opacity:1}\n`;
const REDUIT_HERO = `.hero-dynamic,.hero-dynamic::before{animation-play-state:paused}\n`;

const blocFin = ({ hover, reduit, extra = '' }) => `${CSS_REVEAL}${extra}\n${COMMENTAIRE_HOVER}\n@media(hover:hover){\n${hover}}\n\n${COMMENTAIRE_REDUIT}\n@media(prefers-reduced-motion:reduce){\n${reduit}}\n</style>`;

// Règles de <style> communes aux 14 pages à cartes (12 articles, analyses, artifact) — chaînes exactes, une occurrence chacune.
const STYLE_COMMUN = [
  remplacer("transform:scaleX(0);transition:transform .25s ease}\n.nav-link:hover::after,.nav-link.active::after{transform:scaleX(1)}", "transform:scaleX(0);transition:transform var(--motion-fast)}\n.nav-link.active::after{transform:scaleX(1)}"),
  remplacer("transition:opacity .22s ease,transform .22s ease,visibility .22s;min-width:520px;z-index:60}", "transition:opacity var(--motion-base),transform var(--motion-base),visibility var(--motion-base);min-width:520px;z-index:60}"),
  remplacer("margin:5px 0;transition:all .3s ease}", "margin:5px 0;transition:all var(--motion-base)}"),
  remplacer("transition:opacity .35s cubic-bezier(.4,0,.2,1),visibility .35s", "transition:opacity var(--motion-base),visibility var(--motion-base)"),
  remplacer("animation:menu-item-in .4s ease-out forwards}", "animation:menu-item-in var(--motion-slow) forwards}"),
];
const STYLE_CARTES = [
  remplacer(".mega-item{transition:background .15s ease}\n.mega-item:hover{background:rgba(16,18,20,.06)}\n", ".mega-item{transition:background var(--motion-fast)}\n"),
  remplacer(".article-card{position:relative;transition:box-shadow .18s ease,border-color .18s ease}\n", ".article-card{position:relative;transition:box-shadow var(--motion-fast),border-color var(--motion-fast)}\n"),
  remplacer("transform-origin:top;transition:transform .22s ease;z-index:1}\n.article-card:hover{box-shadow:0 6px 18px rgba(14,16,18,.10);border-color:var(--border-hairline)}\n.article-card:hover::before{transform:scaleY(1)}\n", "transform-origin:top;transition:transform var(--motion-fast);z-index:1}\n"),
];
const FADE_D3 = "@keyframes fade-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}\n.anim-fade-up{animation:fade-up .6s ease-out both}\n.anim-d1{animation-delay:.1s}.anim-d2{animation-delay:.2s}.anim-d3{animation-delay:.3s}\n";
const FADE_D4 = "@keyframes fade-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}\n.anim-fade-up{animation:fade-up .6s ease-out both}\n.anim-d1{animation-delay:.1s}.anim-d2{animation-delay:.2s}.anim-d3{animation-delay:.3s}.anim-d4{animation-delay:.4s}\n";
const BALISE_SR = '<script src="scroll-reveal.js"></script>\n';
const ENTETE = (avant, apres) => remplacer(avant, apres);
const ENTETE_GABARIT = ENTETE("className:`fixed top-[3px] left-0 right-0 z-50 transition-all duration-300 ${scrolled?'nav-scrolled':'bg-transparent'}`", "className:`site-header fixed top-[3px] left-0 right-0 z-50 ${scrolled?'nav-scrolled':'bg-transparent'}`");

// Style des 12 pages articles (7 anciens + 4 dossiers + gabarit)
const STYLE_ARTICLE = [
  remplacer(FADE_D3, ''),
  ...STYLE_COMMUN, ...STYLE_CARTES,
  remplacer("@media(prefers-reduced-motion:reduce){.article-card::before{transition:none}}\n", ''),
  remplacer("transition:transform .3s ease;transform-origin:top}\n.featured-card:hover::before{transform:scaleY(1)}\n", "transition:transform var(--motion-fast);transform-origin:top}\n"),
  remplacer('</style>', blocFin({ hover: HOVER_NAV('rgba(16,18,20,.06)') + HOVER_CARTES + '.featured-card:hover::before{transform:scaleY(1)}\n', reduit: '.article-card::before,.featured-card::before{transition:none}\n' + REDUIT_COMMUN + REDUIT_HERO })),
  remplacer(BALISE_SR, ''),
];

// Hero des 7 anciens articles : badge 0, h1 0, chapo 0,15, méta 0,3 (les marqueurs sont des préfixes : la fin de l'appel est trouvée par analyse).
const HERO_ARTICLE = [
  envelopper({ marqueur: "h('div',{className:'anim-fade-up flex items-center gap-3 mb-6'},", avant: 'h(Reveal,{delay:0},', retirer: ['anim-fade-up '] }),
  envelopper({ marqueur: "h('h1',{className:'anim-fade-up anim-d1 ", avant: 'h(Reveal,{delay:0},', retirer: ['anim-fade-up anim-d1 '] }),
  envelopper({ marqueur: "h('p',{className:'anim-fade-up anim-d2 ", avant: 'h(Reveal,{delay:0.15},', retirer: ['anim-fade-up anim-d2 '] }),
  envelopper({ marqueur: "h('div',{className:'anim-fade-up anim-d3 ", avant: 'h(Reveal,{delay:0.3},', retirer: ['anim-fade-up anim-d3 '] }),
];
const SCRIPT_ARTICLE = [inserer('const h=React.createElement\n', '\n' + REVEAL), ENTETE_GABARIT, ...HERO_ARTICLE];

const PAGES = {
  dossiers: {
    'analysis-template.html': STYLE_ARTICLE,
    'analyse-ukraine-mer-noire-guerre-attrition.html': STYLE_ARTICLE,
    'analyse-turquie-erdogan-equilibriste.html': STYLE_ARTICLE,
    'analyse-sahel-mali-niger-burkina-crise.html': STYLE_ARTICLE,
    'analyse-mer-chine-taiwan-indopacifique.html': STYLE_ARTICLE,
    'assets/article-shell.js': [
      remplacer("import React,{useState,useEffect} from 'https://esm.sh/react@18.2.0'", "import React,{useState,useEffect,useRef} from 'https://esm.sh/react@18.2.0'"),
      inserer('const MEGA_NAV=window.MEGA_NAV\n', '\n' + REVEAL.replace('\nfunction Reveal(', '\nexport function Reveal(')),
      ENTETE_GABARIT,
      // Section : titre à 0, chaque enfant hôte à 0,15
      envelopper({ marqueur: "h('h2', { className: 'text-xl md:text-2xl font-extrabold text-[var(--text-primary)] leading-snug mb-4' },\n      romain", avant: 'h(Reveal, { delay: 0 }, ' }),
      remplacer("    ...children\n  )\n}", "    // Chaque enfant hôte (P, SousTitre, encadré) apparaît 0,15 s après le titre (prompt 4 : titre / texte) ;\n    // un enfant non hôte passe tel quel, Reveal exigeant une balise.\n    ...children.map((enfant, i) => React.isValidElement(enfant) && typeof enfant.type === 'string' ? h(Reveal, { key: i, delay: 0.15 }, enfant) : enfant)\n  )\n}"),
      // Appareil critique : titres 0, textes 0,15, tableaux/listes/encadrés 0,3, cartes 0,3 + rang × 0,06
      remplacer("  return h('h2', { className: 'text-xl md:text-2xl font-extrabold text-[var(--text-primary)] leading-snug mb-4' }, texte)", "  return h(Reveal, { delay: 0 }, h('h2', { className: 'text-xl md:text-2xl font-extrabold text-[var(--text-primary)] leading-snug mb-4' }, texte))"),
      envelopper({ marqueur: "h('div', { className: 'my-6 overflow-x-auto' },", avant: 'h(Reveal, { delay: 0.3 }, ', attendu: 2 }),
      envelopper({ marqueur: "h('p', { className: 'text-base leading-relaxed text-[var(--text-secondary)]' },\n", avant: 'h(Reveal, { delay: 0.15 }, ' }),
      envelopper({ marqueur: "h('div', { key: i, className: 'my-6 overflow-hidden ' + grav(i).carte },", avant: 'h(Reveal, { key: i, delay: 0.3, stagger: 0.06 }, ', cle: 'key: i, ' }),
      remplacer("          SousTitre(null, 'Indicateurs d’alerte à surveiller'),", "          h(Reveal, { delay: 0 }, SousTitre(null, 'Indicateurs d’alerte à surveiller')),"),
      envelopper({ marqueur: "h('div', { className: 'insight-box' },", avant: 'h(Reveal, { delay: 0.3 }, ' }),
      envelopper({ marqueur: "h('p', { className: 'text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)] mb-3', style: { fontFamily: \"'IBM Plex Mono',monospace\" } }, a.sourcesMeta)", avant: 'h(Reveal, { delay: 0.15 }, ' }),
      envelopper({ marqueur: "h('ul', { className: 'space-y-1.5' },", avant: 'h(Reveal, { delay: 0.3 }, ' }),
      envelopper({ marqueur: "h('p', { className: 'mt-3 text-[10px] text-[var(--text-secondary)] italic' }, a.sourcesNote)", avant: 'h(Reveal, { delay: 0.15 }, ' }),
      envelopper({ marqueur: "h('div', { className: 'insight-box gold' },", avant: 'h(Reveal, { delay: 0.3 }, ' }),
      envelopper({ marqueur: "h('div', { className: 'mt-12 text-center' },", avant: 'h(Reveal, { delay: 0.3 }, ' }),
      envelopper({ marqueur: "h('div', { className: 'mt-6 text-center' },", avant: 'h(Reveal, { delay: 0.3 }, ' }),
      envelopper({ marqueur: "h('p', { className: 'text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-4' }, 'Articles liés')", avant: 'h(Reveal, { delay: 0 }, ' }),
      envelopper({ marqueur: "h('a', { key: i, href: r.href, className: 'article-card block overflow-hidden bg-[var(--surface-raised)] border border-[var(--hairline-warm)] no-underline' },", avant: 'h(Reveal, { key: i, delay: 0.3, stagger: 0.06 }, ', cle: 'key: i, ' }),
    ],
  },
  articles: Object.fromEntries(['analyse-arctique-groenland-grand-jeu-polaire.html', 'analyse-cloud-ia-pme-europeennes.html', 'analyse-corridor-defense-france-inde.html', 'analyse-cuba-crise-perspectives.html', 'analyse-fta-ue-inde-traite-fiscal.html', 'analyse-madagascar-fragilite-ressources.html', 'analyse-petrole-trump-iran-ormuz.html'].map((p) => [p, [...STYLE_ARTICLE, ...SCRIPT_ARTICLE]])),
  analyses: {
    'analyses.html': [
      remplacer(FADE_D3, ''),
      ...STYLE_COMMUN, ...STYLE_CARTES,
      remplacer("@media(prefers-reduced-motion:reduce){.animate-pulse{animation:none}.article-card::before{transition:none}}\n", ''),
      remplacer('</style>', blocFin({
        extra: "/* Zoom de l'image des cartes au survol (ex utilitaires Tailwind, 300 ms) : durée en jeton, coupé sur tactile et en mouvement réduit */\n.zoom-hover{transition:transform var(--motion-slow)}\n",
        hover: HOVER_NAV('rgba(16,18,20,.06)') + HOVER_CARTES + "}\n/* Zoom : survol possible ET mouvement non réduit, le motif de Starlink (audit 7.5) */\n@media(hover:hover) and (prefers-reduced-motion:no-preference){\n.article-card:hover .zoom-hover{transform:scale(1.05)}\n",
        reduit: '.article-card::before{transition:none}\n' + REDUIT_COMMUN + '.zoom-hover{transition:none}\n',
      })),
      remplacer(BALISE_SR, ''),
      remplacer("import React,{useState,useEffect} from 'https://esm.sh/react@18.2.0'", "import React,{useState,useEffect,useRef} from 'https://esm.sh/react@18.2.0'"),
      inserer('const h=React.createElement\n', '\n' + REVEAL),
      ENTETE_GABARIT,
      // Hero : kicker 0, h1 0, chapo 0,15
      envelopper({ marqueur: "h('p',{className:'anim-fade-up text-[11px] uppercase tracking-[0.18em]", avant: 'h(Reveal,{delay:0},', retirer: ['anim-fade-up '] }),
      envelopper({ marqueur: "h('h1',{className:'anim-fade-up anim-d1 ", avant: 'h(Reveal,{delay:0},', retirer: ['anim-fade-up anim-d1 '] }),
      envelopper({ marqueur: "h('p',{className:'anim-fade-up anim-d2 ", avant: 'h(Reveal,{delay:0.15},', retirer: ['anim-fade-up anim-d2 '] }),
      // Article du jour : ligne badge 0, h2 0, sous-titre 0,15, points 0,3, étiquettes 0,3 ; pastille en motion-safe:
      envelopper({ marqueur: "h('div',{className:'flex items-center gap-3 mb-4'},", avant: 'h(Reveal,{delay:0},' }),
      envelopper({ marqueur: "h('h2',{className:'text-xl md:text-2xl font-extrabold text-[#101214] leading-snug mb-2'},article.titre)", avant: 'h(Reveal,{delay:0},' }),
      envelopper({ marqueur: "h('p',{className:'text-base text-[#4C5052] leading-relaxed mb-4'},article.sous_titre)", avant: 'h(Reveal,{delay:0.15},' }),
      envelopper({ marqueur: "h('ul',{className:'space-y-2 mb-4'},", avant: 'h(Reveal,{delay:0.3},' }),
      envelopper({ marqueur: "h('div',{className:'flex flex-wrap gap-2'},", avant: 'h(Reveal,{delay:0.3},' }),
      remplacer("bg-[#E8E4D8] animate-pulse'", "bg-[#E8E4D8] motion-safe:animate-pulse'"),
      // Grille : filtres 0, compteur 0,15, cartes 0,3 + rang × 0,06, état vide 0,15 ; zoom de l'image dans la feuille
      envelopper({ marqueur: "h('div',{className:'flex flex-wrap gap-2 mb-8 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0'},", avant: 'h(Reveal,{delay:0},' }),
      envelopper({ marqueur: "h('p',{className:'text-sm text-[#4C5052] mb-8',style:{fontFamily:\"'IBM Plex Mono',monospace\"}},", avant: 'h(Reveal,{delay:0.15},' }),
      envelopper({ marqueur: "h('a',{key:a.id,href:a.href,className:'article-card block overflow-hidden bg-[#FFFFFF] border border-[rgba(76,80,82,.18)] no-underline group'},", avant: 'h(Reveal,{key:a.id,delay:0.3,stagger:0.06},', cle: 'key:a.id,' }),
      envelopper({ marqueur: "h('p',{className:'text-[#4C5052] text-sm'},'Aucune analyse", avant: 'h(Reveal,{delay:0.15},' }),
      remplacer("className:'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'", "className:'w-full h-full object-cover zoom-hover'"),
    ],
  },
  artifact: {
    'artifact-inflexion.html': [
      remplacer('/* Animations */\n' + FADE_D4 + '\n', ''),
      ...STYLE_COMMUN, ...STYLE_CARTES,
      remplacer("@media(prefers-reduced-motion:reduce){.article-card::before{transition:none}}\n", ''),
      remplacer('</style>', blocFin({
        extra: '/* Logo : passe du blanc au naturel quand la page défile (ex transition inline, 300 ms) */\n.logo-scroll{transition:filter var(--motion-base)}\n',
        hover: HOVER_NAV('rgba(16,18,20,.06)') + HOVER_CARTES,
        reduit: '.article-card::before{transition:none}\n' + REDUIT_COMMUN,
      })),
      inserer('const h=React.createElement\n', '\n' + REVEAL),
      ENTETE_GABARIT,
      remplacer("className:'h-10 sm:h-[50px] md:h-[65px] w-auto',style:{filter:scrolled?'none':'brightness(5) saturate(0.3)',transition:'filter 0.3s ease'}", "className:'h-10 sm:h-[50px] md:h-[65px] w-auto logo-scroll',style:{filter:scrolled?'none':'brightness(5) saturate(0.3)'}"),
      // Hero : badge 0, h1 0, chapo 0,15, CTA 0,3, trois cartes 0,3 + rang × 0,06 (étaient 0,2 / 0,3 / 0,4)
      envelopper({ marqueur: "h('div',{className:'anim-fade-up inline-flex items-center gap-2", avant: 'h(Reveal,{delay:0},', retirer: ['anim-fade-up '] }),
      envelopper({ marqueur: "h('h1',{className:'anim-fade-up anim-d1 ", avant: 'h(Reveal,{delay:0},', retirer: ['anim-fade-up anim-d1 '] }),
      envelopper({ marqueur: "h('p',{className:'anim-fade-up anim-d2 ", avant: 'h(Reveal,{delay:0.15},', retirer: ['anim-fade-up anim-d2 '] }),
      envelopper({ marqueur: "h('div',{className:'anim-fade-up anim-d3 mt-10 md:mt-12'},", avant: 'h(Reveal,{delay:0.3},', retirer: ['anim-fade-up anim-d3 '] }),
      envelopper({ marqueur: "h('article',{key:a.id,className:`anim-fade-up anim-d${i+2} article-card", avant: 'h(Reveal,{key:a.id,delay:0.3,stagger:0.06},', cle: 'key:a.id,', retirer: ['anim-fade-up anim-d${i+2} '] }),
      remplacer("className:`article-card overflow-hidden bg-white/10 border border-white/10 backdrop-blur-sm`", "className:'article-card overflow-hidden bg-white/10 border border-white/10 backdrop-blur-sm'"),
    ],
  },
  briefing: {
    'briefing.html': [
      remplacer(FADE_D4, ''),
      ...STYLE_COMMUN,
      remplacer(".mega-item{transition:background .15s ease}\n.mega-item:hover{background:rgba(27,107,74,.06)}\n", ".mega-item{transition:background var(--motion-fast)}\n"),
      remplacer("@keyframes slide-in-left{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}\n@keyframes count-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}\n\n.reveal-section{opacity:0;transform:translateY(32px);transition:opacity .7s cubic-bezier(.4,0,.2,1),transform .7s cubic-bezier(.4,0,.2,1)}\n.reveal-section.visible{opacity:1;transform:translateY(0)}\n",
        "/* Boucles décoratives : hors de l'échelle à trois jetons, figées en mouvement réduit. Le spinner (indicateur d'état) continue de tourner. */\n.pulse-live{animation:pulse-live 2s ease infinite}\n@keyframes spin{to{transform:rotate(360deg)}}\n.spin{animation:spin 1s linear infinite}\n.logo-scroll{transition:filter var(--motion-base)}\n"),
      remplacer("transition:box-shadow .3s cubic-bezier(.4,0,.2,1),border-color .3s ease;\n}\n.briefing-card:hover{\nbox-shadow:0 8px 32px rgba(0,20,15,.06),0 2px 8px rgba(0,20,15,.04);\nborder-color:#D1D5DE;\n}\n", "transition:box-shadow var(--motion-fast),border-color var(--motion-fast);\n}\n"),
      remplacer("transition:width .8s cubic-bezier(.4,0,.2,1)}", "transition:width var(--motion-slow)}"),
      remplacer("background:#fff;transition:all .2s ease;flex-shrink:0}", "background:#fff;transition:all var(--motion-fast);flex-shrink:0}"),
      remplacer(".toc-link{color:#5A6178;transition:color .2s ease}\n.toc-link.active{color:#006650;font-weight:600}\n", ".toc-link{transition:background-color var(--motion-fast),color var(--motion-fast)}\n"),
      remplacer('</style>', blocFin({
        hover: HOVER_NAV('rgba(27,107,74,.06)') + '.briefing-card:hover{box-shadow:0 8px 32px rgba(0,20,15,.06),0 2px 8px rgba(0,20,15,.04);border-color:#D1D5DE}\n',
        reduit: REDUIT_COMMUN + REDUIT_HERO + '.pulse-live{animation-play-state:paused}\n.prob-fill{transition:none}\n',
      })),
      // Script : l'ancien couple useInView + Reveal (div enveloppant) laisse place à la copie de la home
      remplacer("function useInView(opts){\nvar ref=useRef(null)\nvar vis=useState(false)\nvar visible=vis[0],setVisible=vis[1]\nuseEffect(function(){\nif(!ref.current)return\nvar io=new IntersectionObserver(function(entries){\nif(entries[0].isIntersecting){setVisible(true);if(!(opts&&opts.repeat))io.disconnect()}\nelse if(opts&&opts.repeat)setVisible(false)\n},{threshold:(opts&&opts.threshold)||0.12,rootMargin:(opts&&opts.rootMargin)||'0px'})\nio.observe(ref.current)\nreturn function(){io.disconnect()}\n},[])\nreturn[ref,visible]\n}\n\n", ''),
      remplacer("function Reveal(props){\nvar r=useInView({threshold:0.08})\nvar ref=r[0],visible=r[1]\nreturn h('div',{ref:ref,className:'reveal-section'+(visible?' visible':'')+(props.className?' '+props.className:''),style:props.delay?{transitionDelay:props.delay+'s'}:undefined},props.children)\n}\n", REVEAL),
      remplacer("className:'fixed top-[3px] left-0 right-0 z-50 transition-all duration-300 '+(scrolled?'nav-scrolled':'bg-transparent')", "className:'site-header fixed top-[3px] left-0 right-0 z-50 '+(scrolled?'nav-scrolled':'bg-transparent')"),
      remplacer("className:'h-10 sm:h-[50px] md:h-[65px] w-auto',style:{filter:scrolled?'none':'brightness(10) saturate(0) invert(0)',transition:'filter 0.3s ease'}", "className:'h-10 sm:h-[50px] md:h-[65px] w-auto logo-scroll',style:{filter:scrolled?'none':'brightness(10) saturate(0) invert(0)'}"),
      // Hero : badge LIVE 0, h1 0, chapo 0,15 (deux variantes), méta 0,3 ; pastille et spinner en classes
      envelopper({ marqueur: "h('div',{className:'anim-fade-up flex items-center gap-3 mb-8'},", avant: 'h(Reveal,{delay:0},', retirer: ['anim-fade-up '] }),
      envelopper({ marqueur: "h('h1',{className:'anim-fade-up anim-d1 ", avant: 'h(Reveal,{delay:0},', retirer: ['anim-fade-up anim-d1 '] }),
      envelopper({ marqueur: "h('p',{className:'anim-fade-up anim-d2 ", avant: 'h(Reveal,{delay:0.15},', retirer: ['anim-fade-up anim-d2 '], attendu: 2 }),
      envelopper({ marqueur: "h('div',{className:'anim-fade-up anim-d3 mt-10 flex flex-wrap items-center gap-4'},", avant: 'h(Reveal,{delay:0.3},', retirer: ['anim-fade-up anim-d3 '] }),
      remplacer("style:{width:6,height:6,borderRadius:'50%',background:'#33B894',animation:'pulse-live 2s ease infinite',display:'inline-block'}", "className:'pulse-live',style:{width:6,height:6,borderRadius:'50%',background:'#33B894',display:'inline-block'}"),
      remplacer("h('div',{className:'w-5 h-5 border-2 border-[#006650] border-t-transparent rounded-full',style:{animation:'spin 1s linear infinite'}})", "h('div',{className:'spin w-5 h-5 border-2 border-[#006650] border-t-transparent rounded-full'})"),
      remplacer("rounded-lg text-xs transition-all duration-200 no-underline '+", "rounded-lg text-xs toc-link no-underline '+"),
      // Les 8 blocs : barre pipeline 0, signal du jour 0, synthèse 0,15 ; les cinq autres perdent leur enveloppe (h(Reveal,null,X) → (X))
      // et reçoivent Reveal élément par élément : ligne de titre 0, cartes 0,3 + rang × 0,06, carte agenda 0,3, avertissement 0,15, étiquettes 0,3.
      remplacer("h(Reveal,null,\n    h('div',{className:'flex items-center gap-4 mb-10 pb-5 border-b border-[#E2E5EB]'},", "h(Reveal,{delay:0},\n    h('div',{className:'flex items-center gap-4 mb-10 pb-5 border-b border-[#E2E5EB]'},"),
      remplacer("h(Reveal,null,\n    h('div',{id:'signal-du-jour',", "h(Reveal,{delay:0},\n    h('div',{id:'signal-du-jour',"),
      remplacer("h(Reveal,null,\n    h('div',{id:'synthese',className:'mb-12'},", "h(Reveal,{delay:0.15},\n    h('div',{id:'synthese',className:'mb-12'},"),
      desenvelopper("h(Reveal,null,\n    h('div',{id:'enjeux',className:'mb-14'},"),
      desenvelopper("h(Reveal,null,\n    h('div',{id:'risques',className:'mb-14'},"),
      desenvelopper("h(Reveal,null,\n     h('div',{id:'themes',className:'mb-14'},"),
      desenvelopper("h(Reveal,null,\n    h('div',{id:'agenda',className:'mb-12'},"),
      desenvelopper("h(Reveal,null,\n    h('div',{className:'pt-6 border-t border-[#E2E5EB]'},"),
      envelopper({ marqueur: "h('div',{className:'flex items-center gap-3 mb-6'},", avant: 'h(Reveal,{delay:0},', attendu: 4 }),
      // La carte agenda (sans clé) d'abord : une fois leur clé déplacée sur Reveal, les trois autres auraient le même début.
      envelopper({ marqueur: "h('div',{className:'briefing-card'},", avant: 'h(Reveal,{delay:0.3},' }),
      envelopper({ marqueur: "h('div',{key:i,className:'briefing-card'},", avant: 'h(Reveal,{key:i,delay:0.3,stagger:0.06},', cle: 'key:i,', attendu: 3 }),
      envelopper({ marqueur: "h('p',{className:'text-[11px] text-[#5A6178]/50 italic mt-5 leading-relaxed pl-1'},disclaimer)", avant: 'h(Reveal,{delay:0.15},' }),
      envelopper({ marqueur: "h('div',{className:'flex flex-wrap gap-2'},", avant: 'h(Reveal,{delay:0.3},' }),
    ],
  },
};

// ─── Exécution : tout vérifier, puis écrire ──────────────────────────────────────────────────
const familles = FAMILLES.length ? FAMILLES : Object.keys(PAGES);
const resultats = [];
let erreurs = 0;
for (const f of familles) {
  if (!PAGES[f]) { console.error(`famille inconnue : ${f}`); process.exit(1); }
  for (const [fichier, ops] of Object.entries(PAGES[f])) {
    let src = readFileSync(fichier, 'utf8');
    const original = src;
    try {
      for (const op of ops) src = op(src);
      // Garde : aucune trace de l'ancien mécanisme ne doit survivre dans le fichier migré.
      for (const mort of ['anim-fade-up', 'fade-up .6s', 'scroll-reveal.js', 'reveal-section', 'useInView', 'duration-300', 'duration-200']) {
        if (src.includes(mort)) throw new Error(`« ${mort} » subsiste après migration`);
      }
      resultats.push([fichier, src, ops.length, original.length, src.length]);
    } catch (e) { erreurs++; console.error(`✖ ${fichier} : ${e.message}`); }
  }
}
if (erreurs) { console.error(`${erreurs} fichier(s) en écart : rien n'a été écrit.`); process.exit(1); }
for (const [fichier, src, n, avant, apres] of resultats) {
  if (!VERIFIER) writeFileSync(fichier, src);
  console.log(`${VERIFIER ? '(vérifié) ' : '✔ '}${fichier} : ${n} opérations, ${avant} → ${apres} octets`);
}
```

- [ ] **Step 2 : essai à blanc, toutes familles** (déjà fait au cadrage : 16 fichiers, 0 écart)

```bash
node <scratchpad>/plan/migrer-pages.mjs --verifier
```

Attendu : 16 lignes `(vérifié) … : N opérations` (13 × 5 dossiers, 19 coquille, 19 × 7 articles, 29 `analyses`, 20 `artifact`, 37 `briefing`), code de sortie 0. Un écart → corriger la **chaîne**, pas le compte.

- [ ] **Step 3 : famille `dossiers`** (5 pages + coquille)

```bash
node <scratchpad>/plan/migrer-pages.mjs dossiers
node --test --test-name-pattern='article-shell|template|ukraine|turquie|sahel|mer-chine|scroll-reveal' test/pages-motion.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail)'
grep -c 'h(Reveal' assets/article-shell.js      # attendu 17 (Section 2, TitreAppareil 1, appareil critique 14)
```

Contrôle de lecture : `git diff assets/article-shell.js` — chaque `h(Reveal, …)` enveloppe une balise hôte, les `key` sont passées à `Reveal`, aucune parenthèse déplacée ailleurs que là où le plan le dit. Commit :

```bash
git add test/pages-motion.test.mjs assets/article-shell.js analysis-template.html analyse-ukraine-mer-noire-guerre-attrition.html analyse-turquie-erdogan-equilibriste.html analyse-sahel-mali-niger-burkina-crise.html analyse-mer-chine-taiwan-indopacifique.html
git commit -m "Dossiers : Reveal partagé par article-shell.js (titre puis texte par section), durées en jetons, survols sous hover:hover, mouvement réduit, test de garde paramétré

Reveal copié tel quel depuis index.html et exporté par la coquille : Section pose le titre à 0 et chaque enfant hôte à 0,15 ;
l'appareil critique suit le schéma titre / texte / grille (+0,06 par carte). Les cinq pages perdent scroll-reveal.js (il fondait
13 sections entières) et leurs durées écrites en dur ; l'ouverture CSS du méga-menu reste hors de hover:hover (accès tablette).
test/pages-motion.test.mjs échoue encore sur les dix autres pages, migrées aux commits suivants.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 4 : famille `articles`** (7 pages)

```bash
node <scratchpad>/plan/migrer-pages.mjs articles
node --test --test-name-pattern='arctique|cloud|corridor|cuba|fta|madagascar|ormuz' test/pages-motion.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail)'
grep -c 'h(Reveal' analyse-petrole-trump-iran-ormuz.html   # attendu 4 (les quatre éléments du hero)
```

Commit : `Articles React : hero en Reveal (badge, titre, chapo 0,15, méta 0,3), durées en jetons, survols sous hover:hover, mouvement réduit` (corps du message : `scroll-reveal.js` n'y animait rien, mesuré ; hero dynamique mis en pause en mouvement réduit).

- [ ] **Step 5 : famille `analyses`**

```bash
node <scratchpad>/plan/migrer-pages.mjs analyses
node --test --test-name-pattern='analyses' test/pages-motion.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail)'
```

Commit : `Analyses : Reveal (hero, article du jour, grille avec décalage de lot), pastille en motion-safe:animate-pulse, zoom des cartes en jeton, survols sous hover:hover`.

- [ ] **Step 6 : famille `artifact`**

```bash
node <scratchpad>/plan/migrer-pages.mjs artifact
node --test --test-name-pattern='artifact' test/pages-motion.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail)'
```

Commit : `Artifact : hero en Reveal (trois cartes décalées de 0,06 s), logo et en-tête en jetons, survols sous hover:hover`.

- [ ] **Step 7 : famille `briefing`**

```bash
node <scratchpad>/plan/migrer-pages.mjs briefing
node --test --test-name-pattern='briefing' test/pages-motion.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail)'
```

Contrôle de lecture : `git diff briefing.html` — les cinq blocs désenveloppés sont des expressions `( … )` valides ; `return (` reste sur la même ligne que `return`. Commit : `Briefing : Reveal de la home à la place du div enveloppant (titres 0, cartes décalées), boucles en classes, sommaire et jauge en jetons, survols sous hover:hover`.

---

### Task 3 : Tailwind reconstruit, suite complète au vert

- [ ] **Step 1**

```bash
npm run build:css
git diff --stat assets/site.css
grep -o '\.duration-300{\|\.duration-200{\|\.transition-transform{\|\.group:hover \.group-hover\\:scale-105{' assets/site.css | sort | uniq -c
grep -l 'duration-300\|transition-all' *.html *.js assets/*.js | sort     # qui emploie encore ces utilitaires (pages legacy attendues)
```

- [ ] **Step 2**

```bash
npm test 2>&1 | grep -E '^ℹ (tests|pass|fail)'
```

Attendu : **142 / 142** (83 + 59). Commit : `Tailwind : site.css reconstruit après la propagation des apparitions` (ne lister dans le message que les classes réellement disparues).

---

### Task 4 : comparaison visuelle avant / après

- [ ] **Step 1 : captures « après »** (même serveur 3407, mêmes 18 pages, `capturer-reveal.mjs` : repos de 3 s)

```bash
PAGES=index.html,expertise.html,geopolitics.html,analyses.html,analysis-template.html,briefing.html,artifact-inflexion.html,analyse-arctique-groenland-grand-jeu-polaire.html,analyse-cloud-ia-pme-europeennes.html,analyse-corridor-defense-france-inde.html,analyse-cuba-crise-perspectives.html,analyse-fta-ue-inde-traite-fiscal.html,analyse-madagascar-fragilite-ressources.html,analyse-mer-chine-taiwan-indopacifique.html,analyse-petrole-trump-iran-ormuz.html,analyse-sahel-mali-niger-burkina-crise.html,analyse-turquie-erdogan-equilibriste.html,analyse-ukraine-mer-noire-guerre-attrition.html node <scratchpad>/outils/capturer-reveal.mjs <scratchpad>/apres http://127.0.0.1:3407 1440,390
python3 -I <scratchpad>/outils/comparer.py <scratchpad>/avant <scratchpad>/apres <scratchpad>/diff
```

Attendu : **36 captures identiques sur 36**. Toute différence : ouvrir `<scratchpad>/diff/<largeur>/<page>.png`, qualifier (zone dynamique ? régression ?), corriger la cause, ne jamais « accepter » un écart sans l'avoir compris.

---

### Task 5 : contrôle du mouvement (script) et volet navigateur

- [ ] **Step 1 : le script** (`<scratchpad>/plan/verifier-mouvement-pages.mjs`, un représentant par famille)

```js
// Contrôle du mouvement après migration, dans Chrome sans fenêtre (1440 px), sur un représentant par famille.
// Usage : node verifier-mouvement-pages.mjs <dossier de sortie> [base=http://127.0.0.1:3407]
// Mode normal : délais inline attendus, jetons résolus dans les styles calculés, Reveal retiré après apparition, console vide.
// Mode réduit (Emulation.setEmulatedMedia) : aucun .reveal, contenu visible, boucles en pause, pastilles immobiles, zoom coupé.
// Dérivé de verifier-mouvement.mjs (prompt 4) : même tuyau CDP, aucune dépendance npm.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [sortieDir, base = 'http://127.0.0.1:3407'] = process.argv.slice(2);
if (!sortieDir) { console.error('Usage : node verifier-mouvement-pages.mjs <dossier de sortie> [base]'); process.exit(1); }
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
const noter = (page, nom, valeur, attendu) => { const ok = JSON.stringify(valeur) === JSON.stringify(attendu); resultats.push({ page, nom, ok, valeur, attendu }); console.log(`${ok ? 'OK ' : 'KO '} ${page} — ${nom} : ${JSON.stringify(valeur)}${ok ? '' : ` (attendu ${JSON.stringify(attendu)})`}`); };

// Un représentant par famille : A ormuz, B ukraine, C analyses, D artifact, E briefing.
const PAGES = {
  'analyse-petrole-trump-iran-ormuz.html': { hero: '.hero-dynamic', delaisHero: ['0s', '0s', '0.15s', '0.3s'], heroDynamique: true },
  'analyse-ukraine-mer-noire-guerre-attrition.html': { hero: null, heroDynamique: true, section1: true },
  'analyses.html': { hero: 'section:first-of-type', delaisHero: ['0s', '0s', '0.15s'], pastille: true, zoom: true, cartes: true },
  'artifact-inflexion.html': { hero: 'section:first-of-type', delaisHero: ['0s', '0s', '0.15s', '0.3s', '0.3s', '0.36s', '0.42s'] },
  'briefing.html': { hero: '.hero-dynamic', delaisHero: ['0s', '0s', '0.15s', '0.3s'], heroDynamique: true, pulseLive: true },
};

try {
  const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true });
  const page = (m, p) => cdp(m, p, sessionId);
  await page('Runtime.enable'); await page('Page.enable');
  await page('Page.addScriptToEvaluateOnNewDocument', { source: "window.__erreurs=[];addEventListener('error',e=>__erreurs.push(String(e.message)));const _e=console.error;console.error=(...a)=>{__erreurs.push(a.join(' '));_e(...a)}" });
  const evaluer = async (expression) => {
    const r = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const photo = async (nom) => { const { data } = await page('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(sortieDir, nom), Buffer.from(data, 'base64')); };
  await page('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const charger = async (p) => {
    await page('Page.navigate', { url: `${base}/${p}` });
    for (let i = 0; i < 100; i++) { await attendre(100); if (await evaluer(`document.readyState==='complete'&&!!document.querySelector('h1')`).catch(() => false)) break; }
    await attendre(150); // les Reveal du premier écran sont en cours (0,5 s) : leurs délais inline sont lisibles
  };
  const media = (v) => page('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: v }] });

  for (const [p, cfg] of Object.entries(PAGES)) {
    const court = p.replace(/\.html$/, '').replace(/^analyse-/, '').split('-')[0];
    // ── Mode normal ──
    await media('no-preference');
    await charger(p);
    if (cfg.hero) noter(court, 'hero : délais inline', await evaluer(`[...document.querySelectorAll('${cfg.hero} [style*="transition-delay"]')].map(e=>e.style.transitionDelay)`), cfg.delaisHero);
    if (cfg.section1) noter(court, 'section 1 : h2 à 0, enfants à 0,15 (lus avant apparition)', await evaluer(`[...document.querySelectorAll('#section-1 .reveal')].map(e=>e.style.transitionDelay)`), await evaluer(`['0s',...Array(document.querySelectorAll('#section-1 .reveal').length-1).fill('0.15s')]`));
    noter(court, 'jetons : .reveal transition-duration', await evaluer(`(e=>e?getComputedStyle(e).transitionDuration:'aucun .reveal')(document.querySelector('.reveal'))`), '0.5s, 0.5s');
    noter(court, 'jetons : .mega-menu', await evaluer(`getComputedStyle(document.querySelector('.mega-menu')).transitionDuration`), '0.3s, 0.3s, 0.3s');
    noter(court, 'jetons : header (.site-header)', await evaluer(`getComputedStyle(document.querySelector('header')).transitionDuration`), '0.3s');
    if (cfg.zoom) noter(court, 'jetons : .zoom-hover', await evaluer(`getComputedStyle(document.querySelector('.zoom-hover')).transitionDuration`), '0.5s');
    if (cfg.heroDynamique) noter(court, 'normal : hero dynamique animé', await evaluer(`getComputedStyle(document.querySelector('.hero-dynamic')).animationPlayState`), 'running');
    if (cfg.pastille) noter(court, 'normal : pastille animée (motion-safe:animate-pulse)', await evaluer(`getComputedStyle(document.querySelector('[class*="animate-pulse"]')).animationName`), 'pulse');
    if (cfg.pulseLive) noter(court, 'normal : pastille LIVE animée', await evaluer(`getComputedStyle(document.querySelector('.pulse-live')).animationName`), 'pulse-live');
    await attendre(1500);
    if (cfg.hero) noter(court, 'hero : Reveal retiré après apparition', await evaluer(`document.querySelectorAll('${cfg.hero} .reveal').length`), 0);
    if (cfg.cartes) {
      await evaluer(`window.scrollTo(0,document.querySelector('.article-card').offsetTop-700)`);
      await attendre(120);
      noter(court, 'grille : trois premières cartes à 0,3 / 0,36 / 0,42 (décalage par lot)', await evaluer(`[...document.querySelectorAll('.article-card.reveal')].slice(0,3).map(e=>e.style.transitionDelay)`), ['0.3s', '0.36s', '0.42s']);
    }
    await evaluer(`(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}return true})()`);
    await attendre(2500);
    noter(court, 'page entière : aucun Reveal visible restant', await evaluer(`[...document.querySelectorAll('.reveal')].filter(e=>getComputedStyle(e).display!=='none').length`), 0);
    noter(court, 'console : aucune erreur', await evaluer(`(window.__erreurs||[]).filter(e=>!/messari/.test(e))`), []);
    if (cfg.zoom) {
      await evaluer(`window.scrollTo(0,0)`); await attendre(300);
      await evaluer(`window.scrollTo(0,document.querySelector('.article-card').offsetTop-200)`); await attendre(800);
      const r = await evaluer(`(()=>{const r=document.querySelector('.article-card').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()`);
      await page('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x + r.width / 2, y: r.y + r.height / 2 });
      await attendre(800);
      noter(court, 'normal : carte survolée, image zoomée à 1.05', await evaluer(`getComputedStyle(document.querySelector('.article-card .zoom-hover')).transform`), 'matrix(1.05, 0, 0, 1.05, 0, 0)');
      await photo(`${court}-survol-normal.png`);
    }
    // ── Mode réduit ──
    await media('reduce');
    await charger(p);
    noter(court, 'réduit : matchMedia', await evaluer(`matchMedia('(prefers-reduced-motion: reduce)').matches`), true);
    noter(court, 'réduit : aucun élément .reveal', await evaluer(`document.querySelectorAll('.reveal').length`), 0);
    noter(court, 'réduit : h1 visible', await evaluer(`getComputedStyle(document.querySelector('h1')).opacity`), '1');
    if (cfg.heroDynamique) noter(court, 'réduit : hero dynamique en pause', await evaluer(`[getComputedStyle(document.querySelector('.hero-dynamic')).animationPlayState,getComputedStyle(document.querySelector('.hero-dynamic'),'::before').animationPlayState]`), ['paused', 'paused']);
    if (cfg.pastille) noter(court, 'réduit : pastille immobile', await evaluer(`getComputedStyle(document.querySelector('[class*="animate-pulse"]')).animationName`), 'none');
    if (cfg.pulseLive) noter(court, 'réduit : pastille LIVE en pause', await evaluer(`getComputedStyle(document.querySelector('.pulse-live')).animationPlayState`), 'paused');
    if (cfg.zoom) {
      noter(court, 'réduit : zoom sans transition', await evaluer(`getComputedStyle(document.querySelector('.zoom-hover')).transitionDuration`), '0s');
      await evaluer(`window.scrollTo(0,document.querySelector('.article-card').offsetTop-200)`); await attendre(300);
      const r = await evaluer(`(()=>{const r=document.querySelector('.article-card').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()`);
      await page('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x + r.width / 2, y: r.y + r.height / 2 });
      await attendre(300);
      noter(court, 'réduit : carte survolée, image sans zoom', await evaluer(`document.querySelector('.article-card').matches(':hover')&&getComputedStyle(document.querySelector('.article-card .zoom-hover')).transform`), 'none');
    }
    await photo(`${court}-reduit.png`);
  }
  writeFileSync(join(sortieDir, 'resultats.json'), JSON.stringify(resultats, null, 2));
  console.log(`\n${resultats.filter((r) => r.ok).length}/${resultats.length} vérifications passent`);
} catch (e) { console.error(e.message); process.exitCode = 1; }
finally { try { vers.end(); } catch {} chrome.kill(); try { rmSync(profil, { recursive: true, force: true }); } catch {} }
```

```bash
node <scratchpad>/plan/verifier-mouvement-pages.mjs <scratchpad>/mouvement http://127.0.0.1:3407
```

Attendu : toutes les vérifications `OK` (compte exact à noter). Un `KO` est un fait à comprendre avant toute correction (au prompt 4, un KO a révélé la pastille qui pulsait encore).

- [ ] **Step 2 : volet navigateur, onglet actif** (si disponible) : un dossier (titre puis texte à chaque section), `analyses` (cartes décalées, pastille), `briefing` (cartes décalées) ; aucune erreur console.

---

### Task 6 : compte rendu et attente de l'accord

- [ ] Écrire les **résultats mesurés** en fin de ce plan (comptes réels, captures, script, écarts rencontrés) ; mettre la spec en « réalisé ».
- [ ] Copier `plan/*.mjs`, `outils/inventaire-sr.mjs` et une note de passation dans le dossier de notes partagé.
- [ ] Commit docs : `Spec et plan de la propagation des apparitions aux pages React, résultats mesurés`.
- [ ] **Attendre le « oui »**, puis `git push -u origin feat/animations-pages` et PR **vers `main`** (la PR #145 est fusionnée), description reprenant la spec §1 et §3, terminée par `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

---

## Résultats mesurés

_(à compléter à l'exécution)_

---

## Auto-relecture du plan

- **Couverture de la spec** : §2.2 (durées) → `STYLE_COMMUN`, `STYLE_CARTES`, règles propres à `briefing`, en-tête `.site-header`, `.zoom-hover`, `.logo-scroll` ; §2.3 (`:hover`) → `blocFin`, exception `.mega-trigger:hover` (test) ; §2.4 (mouvement réduit) → `blocFin`, `Reveal` ; §2.5 → `scroll-reveal.js` conservé (test) ; §2.6 → enveloppement d'éléments seulement, garde « enfant hôte » dans `Section` ; §2.7 → Task 3 ; §3 (choréographie) → `HERO_ARTICLE`, ops `analyses`/`artifact`/`briefing`, `Section`/`Apparatus` ; §4 → délais vérifiés par le test (0 / 0,15 / 0,3 ; 0,06) ; §6 → Tasks 3 à 5.
- **Cohérence des noms** : `reveal` / `is-visible` / `site-header` / `zoom-hover` / `logo-scroll` / `pulse-live` / `spin` / `toc-link` identiques dans `blocFin`, les ops de script, le test et le script de contrôle.
- **Comptes** : vérifiés à blanc sur les 16 fichiers avant rédaction (0 écart) ; un seul ordre d'opérations a dû être corrigé (`briefing` : la carte agenda avant les cartes à clé).
