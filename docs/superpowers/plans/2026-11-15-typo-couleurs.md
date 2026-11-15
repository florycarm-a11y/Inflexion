# Typographie et couleurs de la home — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** rendre `index.html` conforme aux six points du prompt 3 de l'audit Starlink (titres de section à 30/40 px, plus aucune taille sous 12 px, trois jetons de texte clair à la place de sept beiges codés en dur, cinq graisses de police chargées) sans aucune différence visuelle non prévue.

**Architecture :** trois variables CSS ajoutées aux deux régimes de `assets/design-tokens-v2.css` ; dans `index.html`, chaque occurrence de couleur, de taille et de graisse est remplacée **une par une** par un script de remplacement qui vérifie le nombre d'occurrences attendu pour chaque chaîne (jamais de chercher-remplacer global : `CLAUDE.md` §3). `assets/site.css` est reconstruit car des classes nouvelles apparaissent. Un test de garde rend les six points permanents. Spec : `docs/superpowers/specs/2026-11-15-typo-couleurs-design.md`.

**Tech Stack :** Node 26, `tailwindcss@3.4.19` (`npm run build:css`), `node --test` (harness existant, `npm test`), Chrome sans fenêtre + Pillow pour la comparaison visuelle (outils hors dépôt).

**Règles du dépôt :** lire `CLAUDE.md`. Aucun chercher-remplacer de couleur : chaque remplacement ci-dessous porte une chaîne complète et un nombre d'occurrences attendu. Ne toucher ni `styles.css`, ni les 32 autres pages, ni `nav-config.js`, ni `CLAUDE.md`. Branche `feat/typo-couleurs`, travail dans le dossier du dépôt (pas de worktree). Commits en français, terminés par `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Ne jamais pousser.

---

## Carte des fichiers

| Fichier | Action | Responsabilité |
| --- | --- | --- |
| `test/home-typo.test.mjs` | créer | garde-fous : pas de taille sous 12 px ni de beige codé en dur dans `index.html` ; jetons dans les deux régimes ; lien Google Fonts aux cinq graisses précédé des deux `preconnect` ; aucune classe de graisse non chargée |
| `assets/design-tokens-v2.css` | modifier | `--chrome-text-1/2/3` dans `[data-design-regime="instrument"]` et `[data-design-regime="editorial"]` |
| `index.html` | modifier | `<head>` (preconnect, lien Google Fonts), `<style>` (`.kicker` 12 px), balisage React (33 couleurs, 11 tailles, 4 `h2`, 10 graisses) |
| `assets/site.css` | régénérer (commité) | nouvelles classes `text-[var(--chrome-text-N)]`, `bg-[var(--chrome-text-1)]`, `md:text-[2.5rem]`, `md:leading-[1.1]` |

Outils hors dépôt (dossier de notes partagé de la session mère, sous-dossier `visuel/`) : `capturer.mjs`, `comparer.py`. Base « avant » déjà capturée sur `main` (`a499c4ad`) dans le scratchpad de la session : `avant/1440` et `avant/390` pour `index`, `analyses`, `expertise`.

---

### Task 1 : le test de garde (échoue tant que rien n'est fait)

**Files :**
- Create : `test/home-typo.test.mjs`

- [ ] **Step 1 : écrire le test**

```js
// Garde-fous du prompt 3 de l'audit Starlink (docs/superpowers/specs/2026-11-15-typo-couleurs-design.md, §3).
// Aucune dépendance : lit les fichiers du dépôt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const RACINE = new URL('../', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, RACINE), 'utf8');

// Les sept beiges remplacés par --chrome-text-1/2/3. #E8A996 (kicker de la newsletter) est hors du prompt 3.
const BEIGES = ['#F5EDE6', '#F3E9DD', '#E8D9C8', '#C6A996', '#D8B9AE', '#D6B896', '#A88A72'];
const LIEN_FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wght@800&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;600&display=swap';
const PRECONNECT = ['<link rel="preconnect" href="https://fonts.googleapis.com">', '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'];

test('index.html : aucune taille sous 12 px, aucun beige codé en dur sur le chrome', () => {
  const html = lire('index.html');
  const petites = html.match(/text-\[1[01]px\]/g) || [];
  assert.equal(petites.length, 0, `tailles sous 12 px encore présentes : ${petites.join(', ')} (utiliser text-xs)`);
  assert.ok(!/\.kicker\{[^}]*font-size:1[01]px/.test(html), '.kicker est encore sous 12 px');
  for (const hex of BEIGES) {
    assert.ok(!new RegExp(hex, 'i').test(html), `${hex} encore codé en dur : utiliser --chrome-text-1/2/3`);
  }
});

test('design-tokens-v2.css : les trois jetons de texte clair dans les deux régimes', () => {
  const css = lire('assets/design-tokens-v2.css');
  for (const regime of ['instrument', 'editorial']) {
    const bloc = css.match(new RegExp(`\\[data-design-regime="${regime}"\\]\\s*\\{([^}]*)\\}`));
    assert.ok(bloc, `régime ${regime} introuvable`);
    assert.match(bloc[1], /--chrome-text-1:\s*#F5EDE6;/, `${regime} : --chrome-text-1 manque`);
    assert.match(bloc[1], /--chrome-text-2:\s*rgba\(245,\s*237,\s*230,\s*\.70\);/, `${regime} : --chrome-text-2 manque`);
    assert.match(bloc[1], /--chrome-text-3:\s*rgba\(245,\s*237,\s*230,\s*\.55\);/, `${regime} : --chrome-text-3 manque`);
  }
});

test('index.html : cinq graisses Google Fonts, deux preconnect avant le lien, aucune classe de graisse non chargée', () => {
  const html = lire('index.html');
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)[1];
  const iLien = head.indexOf(LIEN_FONTS);
  assert.ok(iLien > -1, 'le lien Google Fonts ne demande pas exactement Archivo 800, Plex Sans 400/600, Plex Mono 400/600');
  for (const p of PRECONNECT) {
    const i = head.indexOf(p);
    assert.ok(i > -1 && i < iLien, `${p} manque ou n'est pas avant le lien Google Fonts`);
  }
  // Graisses chargées : 400 (héritée du body, aucune classe), 600 (font-semibold), 800 (font-extrabold).
  const classes = new Set(html.match(/\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g));
  assert.deepEqual([...classes].sort(), ['font-extrabold', 'font-semibold'], 'classe de graisse non chargée (font-medium, font-bold…)');
  for (const [, poids] of html.matchAll(/font-weight:\s*(\d+)/g)) {
    assert.ok(['400', '600', '800'].includes(poids), `font-weight:${poids} dans le <style> : graisse non chargée`);
  }
});
```

- [ ] **Step 2 : vérifier qu'il échoue**

```bash
node --test test/home-typo.test.mjs
```

Attendu : 3 tests, **3 échecs** (`text-[10px]` présents ; `--chrome-text-1` manque dans `instrument` ; le lien Google Fonts actuel demande d'autres graisses).

Pas de commit à cette étape : le test est commité avec ce qu'il garde (Task 2 et Task 3).

---

### Task 2 : les trois jetons

**Files :**
- Modify : `assets/design-tokens-v2.css` (deux blocs)
- Test : `test/home-typo.test.mjs`

- [ ] **Step 1 : régime `instrument`**

Dans le bloc `[data-design-regime="instrument"] {`, après la ligne `  --hairline-warm: rgba(94, 74, 58, 0.22);` et avant le `}`, ajouter :

```css

  /* Texte sur le chrome sombre : une seule couleur, trois opacites (audit Starlink 2026-11-13, section 5.3).
     1 titres et libelles, 2 paragraphes, 3 metadonnees. Contrastes sur #17100E : 16,2 / 8,3 / 5,5 :1. */
  --chrome-text-1: #F5EDE6;
  --chrome-text-2: rgba(245, 237, 230, .70);
  --chrome-text-3: rgba(245, 237, 230, .55);
```

- [ ] **Step 2 : régime `editorial`**

Dans le bloc `[data-design-regime="editorial"] {`, après les deux lignes `  --badge-bg: #EAE1D4;` / `  --badge-text: #8E2424;` et avant le `}`, ajouter :

```css

  /* Texte sur le chrome sombre : une seule couleur, trois opacites (audit Starlink 2026-11-13, section 5.3).
     1 titres et libelles, 2 paragraphes, 3 metadonnees. Contrastes sur #17100E : 16,2 / 8,3 / 5,5 :1 ;
     niveau 3 reserve a #17100E (4,45:1 seulement sur --credibility-band). */
  --chrome-text-1: #F5EDE6;
  --chrome-text-2: rgba(245, 237, 230, .70);
  --chrome-text-3: rgba(245, 237, 230, .55);
```

(Le fichier est écrit sans accents dans ses commentaires : respecter cette convention.)

- [ ] **Step 3 : vérifier**

```bash
node --test test/home-typo.test.mjs 2>&1 | grep -E '^(ok|not ok)'
```

Attendu : `not ok 1`, **`ok 2`**, `not ok 3`.

```bash
grep -c 'chrome-text-[123]' assets/design-tokens-v2.css
```

Attendu : `6`.

- [ ] **Step 4 : commit**

```bash
git add assets/design-tokens-v2.css test/home-typo.test.mjs
git commit -m "Jetons : trois niveaux de texte clair sur le chrome sombre, test de garde du prompt 3

--chrome-text-1/2/3 dans les deux régimes de design-tokens-v2.css (audit Starlink §5.3).
Aucun fichier ne les consomme encore ; index.html les adopte au commit suivant.
test/home-typo.test.mjs échoue sur index.html tant que la home n'est pas migrée.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3 : `index.html`, un remplacement à la fois

**Files :**
- Modify : `index.html`
- Regenerate : `assets/site.css`
- Test : `test/home-typo.test.mjs`, `test/site-css.test.mjs`

- [ ] **Step 1 : écrire le script de remplacement dans le scratchpad**

Chaque entrée est `[chaîne exacte avant, chaîne exacte après, nombre d'occurrences attendu]`. Le script s'arrête sans écrire si un compte diffère. Écrire ce fichier sous `<scratchpad>/remplacer-index.mjs` (hors dépôt).

```js
// Remplacements du prompt 3 sur index.html, une chaîne complète à la fois, compte vérifié.
import { readFileSync, writeFileSync } from 'node:fs';
const chemin = process.argv[2] || 'index.html';
let html = readFileSync(chemin, 'utf8');
const T1 = 'text-[var(--chrome-text-1)]', T2 = 'text-[var(--chrome-text-2)]', T3 = 'text-[var(--chrome-text-3)]';
const H2 = 'text-3xl md:text-[2.5rem] md:leading-[1.1] font-extrabold';
const R = [
  // <head> : preconnect + cinq graisses
  ['<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>',
   '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@800&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet"/>', 1],
  // <style> : kicker à 12 px
  [".kicker{font-family:'IBM Plex Mono',monospace;font-size:11px;", ".kicker{font-family:'IBM Plex Mono',monospace;font-size:12px;", 1],
  // Lien d'évitement (style inline)
  ['background:var(--editorial-accent);color:#F5EDE6;', 'background:var(--editorial-accent);color:var(--chrome-text-1);', 1],
  // Nav desktop : couleur de repos, survol, focus ; graisse 500 → 400
  ['text-sm font-medium transition-colors select-none text-[#C6A996] hover:text-[#F5EDE6] focus-visible:text-[#F5EDE6]',
   `text-sm transition-colors select-none ${T2} hover:${T1} focus-visible:${T1}`, 1],
  // CTA « Réserver un diagnostic » (desktop + menu mobile), « Explorer les analyses »
  ['hover:bg-[#6E1B1B] text-[#F5EDE6] font-semibold', `hover:bg-[#6E1B1B] ${T1} font-semibold`, 3],
  // Menu mobile : libellés de groupe 11 → 12 px ; entrées 500 → 400
  ["menu-item text-[11px] uppercase tracking-[.2em]", "menu-item text-xs uppercase tracking-[.2em]", 1],
  ["'text-base sm:text-lg md:text-[20px] font-medium'", "'text-base sm:text-lg md:text-[20px]'", 1],
  // Hero : paragraphe, CTA secondaire (500 → 600)
  ['text-base lg:text-lg text-[#C6A996] max-w-lg', `text-base lg:text-lg ${T2} max-w-lg`, 1],
  ['hover:border-[var(--editorial-accent-text)] text-[#E8D9C8] font-medium transition-colors text-sm',
   `hover:border-[var(--editorial-accent-text)] ${T1} font-semibold transition-colors text-sm`, 1],
  // Manchette : badge « À la une » (texte + point), badge catégorie, titre au survol, résumé, métadonnées
  ['bg-[var(--editorial-accent)] text-[#F5EDE6] text-[10px] font-semibold', `bg-[var(--editorial-accent)] ${T1} text-xs font-semibold`, 1],
  ['rounded-full bg-[#F5EDE6] animate-pulse', 'rounded-full bg-[var(--chrome-text-1)] animate-pulse', 1],
  ['backdrop-blur-sm text-white text-[10px] font-semibold', 'backdrop-blur-sm text-white text-xs font-semibold', 1],
  ['group-hover:text-[#E8D9C8] transition-colors', `group-hover:${T1} transition-colors`, 1],
  ['mt-3 text-sm text-[#C6A996] leading-relaxed line-clamp-2', `mt-3 text-sm ${T2} leading-relaxed line-clamp-2`, 1],
  ['gap-x-4 gap-y-2 text-[11px] text-[#C6A996]', `gap-x-4 gap-y-2 text-xs ${T2}`, 1],
  // Quatre titres de section
  ["'text-2xl md:text-3xl font-extrabold text-[#101214]'", `'${H2} text-[#101214]'`, 3],
  ["'text-2xl md:text-3xl font-extrabold text-white mb-4'", `'${H2} text-white mb-4'`, 1],
  // Cartes « Décryptages » et veille : badges et métadonnées sur fond clair (taille seulement)
  ['text-[var(--badge-text)] text-[10px] font-semibold', 'text-[var(--badge-text)] text-xs font-semibold', 2],
  ["'text-[11px] text-[#4C5052]'", "'text-xs text-[#4C5052]'", 1],
  ['gap-x-4 gap-y-2 text-[11px] text-[#4C5052]', 'gap-x-4 gap-y-2 text-xs text-[#4C5052]', 1],
  // Bandeau crédibilité : valeur, légende (500 → 600)
  ["font-extrabold text-[#F3E9DD]'", `font-extrabold ${T1}'`, 1],
  ["'mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D6B896]'", `'mt-2 text-xs font-semibold uppercase tracking-[0.14em] ${T2}'`, 1],
  // Boutons actifs (filtres de veille + onglets d'expertise), filtres (500 → 600)
  ["'bg-[var(--editorial-accent)] text-[#F5EDE6] border-[var(--editorial-accent)]'", `'bg-[var(--editorial-accent)] ${T1} border-[var(--editorial-accent)]'`, 2],
  ['text-xs font-medium transition-colors border ${btnCls', 'text-xs font-semibold transition-colors border ${btnCls', 2],
  // Cartes de veille : titre Archivo 700 → 800, source 500 → 400
  ["'text-[0.95rem] font-bold leading-snug", "'text-[0.95rem] font-extrabold leading-snug", 1],
  ["'mt-3 text-[11px] font-medium text-[#4C5052]'", "'mt-3 text-xs text-[#4C5052]'", 1],
  // « Charger plus d'articles » au survol
  ['hover:text-[#F5EDE6] border border-[var(--editorial-accent)]', `hover:${T1} border border-[var(--editorial-accent)]`, 1],
  // Newsletter : paragraphe, confirmation (500 → 400), consentement + lien
  ['text-sm md:text-base text-[#D8B9AE] leading-relaxed', `text-sm md:text-base ${T2} leading-relaxed`, 1],
  ["text-[#7BE0B0] text-sm font-medium'", "text-[#7BE0B0] text-sm'", 1],
  ["'mt-4 text-xs text-[#A88A72] leading-relaxed'", `'mt-4 text-xs ${T3} leading-relaxed'`, 1],
  ["'underline hover:text-[#F5EDE6] transition-colors'", `'underline hover:${T1} transition-colors'`, 1],
  // Pied de page : paragraphe, en-têtes de colonne, liens, copyright, sources (10 → 12 px, 500 → 400)
  ["'text-sm text-[#C6A996] leading-relaxed'", `'text-sm ${T2} leading-relaxed'`, 1],
  ['uppercase tracking-wider text-[#E8D9C8] mb-4', `uppercase tracking-wider ${T1} mb-4`, 4],
  ["'text-sm text-[#C6A996] hover:text-[var(--editorial-accent-text)] transition-colors'", `'text-sm ${T2} hover:text-[var(--editorial-accent-text)] transition-colors'`, 4],
  ["'text-sm text-[#C6A996]'},'©", `'text-sm ${T2}'},'©`, 1],
  ["gap-3 text-[10px] uppercase tracking-wider text-[#A88A72] font-medium'", `gap-3 text-xs uppercase tracking-wider ${T3}'`, 1],
];
let erreurs = 0;
for (const [avant, apres, attendu] of R) {
  const n = html.split(avant).length - 1;
  if (n !== attendu) { erreurs++; console.error(`${n} occurrence(s) au lieu de ${attendu} : ${avant.slice(0, 90)}`); }
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

Attendu : `36 règles appliquées, 49 remplacements.` Si le script signale un compte inattendu, **ne pas corriger le compte** : lire la ligne concernée dans `index.html`, comprendre pourquoi, et corriger la chaîne.

- [ ] **Step 3 : contrôler l'inventaire après**

```bash
grep -oiE '#(F5EDE6|F3E9DD|E8D9C8|C6A996|D8B9AE|D6B896|A88A72)' index.html | wc -l   # attendu 0
grep -oE 'text-\[1[01]px\]' index.html | wc -l                                    # attendu 0
grep -oE 'font-(medium|bold)\b' index.html | wc -l                                 # attendu 0
grep -c 'md:text-\[2.5rem\] md:leading-\[1.1\]' index.html                         # attendu 4
grep -c 'chrome-text-' index.html                                                  # attendu 32 (lignes)
grep -c '#E8A996' index.html                                                       # attendu 1 (inchangé, hors prompt)
git diff --stat index.html                                                         # un seul fichier, ~50 lignes
```

- [ ] **Step 4 : reconstruire `site.css`**

```bash
npm run build:css
grep -c 'chrome-text-1' assets/site.css        # ≥ 1
grep -o 'md\\:text-\\\[2\\.5rem\\\]' assets/site.css | head -1
grep -o 'md\\:leading-\\\[1\\.1\\\]' assets/site.css | head -1
```

Attendu : les trois classes présentes (`site.css` est minifié : les points et crochets sont échappés).

- [ ] **Step 5 : tests**

```bash
npm test 2>&1 | tail -12
```

Attendu : `# pass 78`, `# fail 0` (75 existants + 3 nouveaux).

- [ ] **Step 6 : commit**

```bash
git add index.html assets/site.css
git commit -m "Home : titres de section 30/40 px, aucun texte sous 12 px, texte clair en jetons, cinq graisses

Prompt 3 de l'audit Starlink (docs/superpowers/specs/2026-11-15-typo-couleurs-design.md).
- h2 de section : text-3xl md:text-[2.5rem] md:leading-[1.1] (sans leading, interligne de 36 px pour 40 px de corps)
- text-[10px]/text-[11px] → text-xs (11 classes), .kicker 11 → 12 px
- 33 beiges codés en dur → --chrome-text-1/2/3, une occurrence à la fois (aucun chercher-remplacer global)
- Google Fonts : Archivo 800, Plex Sans 400/600, Plex Mono 400/600, deux preconnect ; font-medium/font-bold réglés par rôle
- assets/site.css reconstruit

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4 : comparaison visuelle avant / après et navigateur

**Files :** aucun fichier du dépôt. Outils : `<notes>/visuel/capturer.mjs`, `<notes>/visuel/comparer.py` ; base `<scratchpad>/avant`.

- [ ] **Step 1 : captures « après »** (serveur `python3 -m http.server 3000` déjà actif dans le dossier du dépôt)

```bash
PAGES=index.html,analyses.html,expertise.html node "<notes>/visuel/capturer.mjs" <scratchpad>/apres
```

Attendu : 6 captures.

- [ ] **Step 2 : diff**

```bash
python3 -I "<notes>/visuel/comparer.py" <scratchpad>/avant <scratchpad>/apres <scratchpad>/diff
```

Attendu : `analyses` et `expertise` identiques (ou différences expliquées par un contenu dynamique : flux, Canvas) ; `index` différent aux deux largeurs. Regarder `<scratchpad>/diff/1440/index.png` et `diff/390/index.png` et qualifier **chaque** zone rouge dans l'une de ces catégories : (a) titre de section plus grand, (b) badge/métadonnée passée à 12 px, (c) nuance de texte clair, (d) graisse 500 → 400/600 ou 700 → 800, (e) contenu dynamique (flux de veille). Toute zone hors de ces cinq catégories est une régression à corriger avant de continuer. Les hauteurs de page peuvent changer de quelques pixels (titres plus hauts) : le comparateur rogne à la hauteur commune, lire la note `taille`.

- [ ] **Step 3 : navigateur**

Ouvrir `http://localhost:3000/index.html` dans le navigateur de la session et vérifier :
- onglet réseau : requêtes `fonts.gstatic.com` pour cinq fichiers de police exactement, aucune `wght@500` ni `700` ;
- `getComputedStyle(document.querySelector('.kicker')).fontWeight` = `600` et la police rendue (`document.fonts.check("600 12px 'IBM Plex Mono'")`) = `true` ;
- `getComputedStyle(document.querySelector('h2')).fontSize` = `40px` à 1440 px pour un h2 de section (le premier `h2` de la page est celui de la manchette : prendre `document.querySelectorAll('section h2')[1]`) ;
- console : aucune erreur nouvelle (le 404 `data/messari.json` est préexistant).

- [ ] **Step 4 : consigner les résultats dans ce plan** (section « Résultats mesurés » ci-dessous) et commiter le plan et la spec.

```bash
git add docs/superpowers/specs/2026-11-15-typo-couleurs-design.md docs/superpowers/plans/2026-11-15-typo-couleurs.md
git commit -m "Spec et plan du prompt 3 (typographie et couleurs de la home), résultats mesurés

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5 : compte rendu et attente de l'accord

- [ ] Écrire la note de passation `2026-11-15-prompt-3-typo-couleurs.md` dans le dossier de notes partagé (ce qui est fait, écarts assumés, preuves, suites possibles), et lister les couples de contraste.
- [ ] Rendre compte à la session mère : commits, liste des couples de contraste, différences visuelles qualifiées. **Ne pas pousser, ne pas ouvrir la PR** sans le « oui ».

---

## Résultats mesurés (2026-11-15)

- **Task 1-2** : commit `c4a96f66`. Test de garde : `not ok 1`, `ok 2`, `not ok 3` avant migration ; `npm test` 76/78.
- **Task 3** : commit `a7183d28`. Script : 36 règles, 49 remplacements, aucun compte inattendu. Inventaire après : 0 beige, 0 taille sous 12 px, 0 `font-medium`/`font-bold`, 4 `h2` à `md:text-[2.5rem] md:leading-[1.1]`, `#E8A996` intact. `assets/site.css` reconstruit (les trois classes nouvelles présentes). `npm test` : **78/78**.
- **Task 4, visuel** (Chrome sans fenêtre, 1440 et 390 px, base « avant » prise sur `main` `a499c4ad`) : `analyses.html` et `expertise.html` **identiques au pixel** aux deux largeurs (les jetons ajoutés n'altèrent rien ailleurs). `index.html` : hauteur 5056 → 5104 px à 1440, 9075 → 9144 px à 390 ; la page entière décale sous le premier titre agrandi, le diff pixel n'est donc lisible qu'en bandes côte à côte. Bandes relues une à une : chaque zone différente appartient à l'une des quatre catégories prévues — (a) quatre titres de section à 40 px (« Recevez nos signaux faibles chaque semaine » passe sur deux lignes à 1440 avec l'interligne de 44 px, sans chevauchement), (b) badges, dates, légendes du bandeau et sources à 12 px (les légendes du bandeau se replient différemment à 390), (c) nuances du chrome (nav, paragraphes du hero et de la newsletter, pied de page), (d) nav et entrées du menu mobile à 400, CTA secondaire, filtres et légendes à 600, titres des cartes de veille à 800. **Aucune différence hors de ces catégories.**
- **Relecture** (sous-agent, spec puis qualité) : conformité 33/33 couleurs, 11/11 tailles, 4/4 `h2`, graisses conformes au tableau, périmètre respecté, ratios de contraste recalculés exacts. **Un écart non prévu par la spec** : la valeur des chiffres du bandeau est un `div` en IBM Plex Sans demandant `font-extrabold` ; Plex Sans n'étant plus chargée qu'en 400/600, le navigateur rendait 600 (700 avant le chantier). Corrigé au commit `c2161c4c` par la classe `display-text` (Archivo 800), vérifié dans le navigateur ; le test de garde vérifie désormais le couple famille/graisse (il échouait sur ce `div` avant le correctif). Remarques mineures non traitées : le test ne détecte pas `text-[9px]`, `fontSize` inline ni `font-[500]` (formes absentes de la page).
- **Task 4, navigateur** (1440 px) : `document.fonts` chargées = exactement `Archivo 800`, `IBM Plex Mono 400`, `IBM Plex Mono 600`, `IBM Plex Sans 400`, `IBM Plex Sans 600` ; lien Google Fonts demandé avec les cinq graisses ; `.kicker` : 12 px, 600, `IBM Plex Mono` ; `h2` de section : 40 px / 44 px (manchette inchangée : 24 px) ; nav : 400, `rgba(245, 237, 230, 0.7)` ; aucune erreur console.

## Auto-revue du plan

- **Couverture de la spec** : §2.1 (33 couleurs) → Task 3 règles 3 à 5, 8 à 15, 19, 22, 25, 27 à 36 ; §2.2 (11 tailles + kicker) → Task 3 règles 2, 6, 10, 12, 15, 17 à 20, 24, 36 ; §2.3 (4 h2 avec interligne) → règles 16 et 17 ; §2.4 (graisses) → règles 1, 4, 7, 9, 20, 23, 24, 26, 28, 36 ; §2.5 → Task 2 ; §2.6 → Task 3 Step 4 ; §2.7 → spec, repris dans la note (Task 5) ; test de garde → Task 1 ; vérification visuelle → Task 4.
- **Pas de place vide** : chaque remplacement porte sa chaîne complète et son compte.
- **Cohérence** : les noms `--chrome-text-1/2/3` sont identiques dans le test (Task 1), les jetons (Task 2) et le script (Task 3) ; le lien Google Fonts et les deux `preconnect` sont, au caractère près, les mêmes dans le test et dans le script.
