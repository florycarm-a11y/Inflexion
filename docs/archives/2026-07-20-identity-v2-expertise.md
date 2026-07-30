# Migration identité v2 — expertise.html (chrome à la source) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe case à cocher (`- [ ]`) pour le suivi.

**Goal:** Migrer `expertise.html` vers l'identité v2 « composition 02 hybride » — chrome sombre achromatique + corps éditorial sur papier — en migrant le chrome **à sa source** (`nav-shared.js`), sans qu'aucune des 15 autres pages legacy ne change d'un pixel.

**Architecture:** `expertise.html` est une page **legacy** : son chrome visible (bandeau bronze, header/menu, hero, footer) n'est pas dans le fichier — il est injecté à l'exécution par `nav-shared.js`, un script **partagé par les 16 pages legacy**. On rend `nav-shared.js` *theme-aware* : un dictionnaire de thème sélectionné sur `document.body.dataset.chrome`. Le thème `v1` reproduit **à l'identique** les valeurs actuelles (défaut → les 15 autres pages sont inchangées) ; le thème `v2` (opt-in via `<body data-chrome="v2">`) porte le chrome sombre. Le **corps** de la page (radar SEMPLICE, scoreboard, tableaux, cartes) est local à `expertise.html` et migré comme le fut analyses.html, en épargnant les couleurs qui encodent de la donnée.

**Tech Stack:** HTML statique + Tailwind CDN + `nav-shared.js`/`nav-config.js` (vanilla, IIFE), `semplice-*.js` (Canvas), Google Fonts (Archivo / IBM Plex), `assets/design-tokens-v2.css` (réutilisé d'analyses.html). Aucun test/CI front : **vérification visuelle obligatoire** (captures headless + comparaison pixel).

---

## Arbitrages figés (ne pas rouvrir)

- **Option 3 retenue par l'utilisateur (2026-07-20) : chrome migré à la source dans `nav-shared.js`.** Écartées : « cœur SEMPLICE seul » (page hybride) et « override local fragile ». Conséquence assumée : on touche un fichier partagé par 16 pages.
- **Invariant de sûreté central : les 15 autres pages legacy ne changent pas d'un pixel.** Garanti par un thème `v1` qui reproduit exactement les littéraux actuels de `nav-shared.js`. Toute dérive de couleur sur une page témoin non migrée = échec de tâche, on s'arrête.
- **Règle absolue projet : aucun chercher-remplacer global de couleur.** Six couleurs font double emploi marque **et** donnée : `#006650`, `#33B894`, `#C8955A`, `#a7f3d0`, `#6b7280`, `#D1FAE5`. Dans le radar SEMPLICE, `#006650` = palier risque faible **et** série Tamil Nadu **et** palier opportunité élevé ; `#C8955A` = série Sahel **et** palier ; `#33B894` = palier opportunité. Intouchables dans les données.
- **Le radar est isolé du CSS** (aucun pont `getComputedStyle`/`var()` → Canvas). Migrer le chrome ne le re-teint pas ; réciproquement, son propre chrome interne (grille/axes/labels) ne suit pas automatiquement — Task 6 le traite explicitement.
- **Accent éditorial unique `--editorial-accent:#8E2424`** (8,65:1 sur blanc). `#E05A4E` reste écarté (3,66:1, sous AA). Pas d'emerald ni de bronze introduits dans le chrome v2.

---

## Cartographie de référence (établie 2026-07-20)

### A. `expertise.html` — 1644 lignes, AUCUN bloc `<style>`
Tout le corps est en **styles inline** + classes Tailwind + un `tailwind.config` inline (ligne 47). Header (l.55) et footer (l.1581) sont des placeholders legacy **masqués/remplacés** par `nav-shared.js` — ils ne portent aucune couleur hex propre. Scripts en pied : l.1636-1642 (`semplice-composite.js` → `semplice-zones-config.js` → `semplice-radar.js` → `app.js` → `nav-config.js` → `nav-shared.js`). Canvas radar : l.453.

**Couleurs de CHROME dans le corps (migrable, n'entre en collision avec aucune donnée) :**
| Hex | Occ. | Rôle | Cible v2 |
|---|---|---|---|
| `#1a1f2e` | 120 | texte primaire | `#101214` (sur papier) |
| `#5a6178` | 159 | texte secondaire | `#4C5052` |
| `#e2e5eb` | 118 | bordures | `#E2E5EB`→ garder clair OU `rgba(76,80,82,.18)` (voir Task 5) |
| `#f7f8fa` | 85 | fonds de section/carte | `#EDEBE4` (papier) |
| `#06402a` | 10 | emerald sombre (gradients CTA, en-tête table) | co-occurrent de `#006650` — **NE PAS toucher isolément** (Task 5) |
| `#ffffff` | 1 (l.1051) | fond de carte pays | `#FFFFFF` (garder) |
| `rgba(0,101,80,.08/.04)` | 2 | ombres/tint dérivés de `#006650` | décision Task 5 |

**Couleurs de DONNÉE (intouchables)** — échelle risque 1-7 : `1`=`#006650` · `2`=`#15803d` · `3`=`#33b894` · `4`=`#c8955a` · `5`=`#f59e0b` · `6`=`#dc2626` · `7`=`#991b1b`. Tiers de score (cellules mono, couleur = fonction de la valeur) : `#006650 #33b894 #c8955a #f59e0b #ea580c #dc2626 #7c2d12`. « Oui/Non » de la table de comparaison (`#006650`/`#33b894` vs `#dc2626`). Encarts double-lecture : rouge `#fef2f2`/`#fecaca`, vert `#ecfdf5`/`#a7f3d0`. Catégorie scénario `#8b5cf6`. Niveau « ÉLEVÉ » `#ea580c`.
**Cas piège tranché :** `#1a1f2e` en cellules mono l.499-541 (« 12 », « 15 » = poids) reste **constant** quelle que soit la valeur → texte neutre = CHROME (migrable), à distinguer des cellules de score où la couleur varie.
**Polices :** Libre Baskerville / Inter / JetBrains Mono. Archivo/IBM Plex absents (Task 4 les ajoute).

### B. `nav-shared.js` — source du chrome (partagé, 16 pages)
CSS injecté l.11-63 ; header inline l.87-132 ; overlay mobile l.135-157 ; hero `buildHero` l.165-176 ; footer l.206-251 ; **scroll handler l.253-288** (repeint header/nav-links/logo/hamburger selon `scrollY>60`). Le hero d'expertise passe par `buildHero('Méthodologie & rigueur', …)` (l.197-203), déclenché par `.expertise-hero`.

### C. Radar (`semplice-radar.js` + `semplice-zones-config.js`)
100 % couleurs en dur, **aucune** lecture CSS→Canvas. Données intouchables : 18 couleurs de série (`semplice-zones-config.js` l.11-79), paliers risque/opportunité (`semplice-radar.js` l.33-34), couleurs de mode (l.114/124/128). **Chrome interne du radar (migrable, Task 6)** : grille `#D1D5DE`/`#E2E5EB` (l.78), axes `#E2E5EB` (l.87), label d'axe au repos `#1A1F2E` (l.94), labels d'anneaux `#5A6178` (l.101).

---

## Phase 0 — Préparation & filet de non-régression

**Files:**
- Branche : `codex/identity-v2-expertise` (déjà créée depuis `origin/main`).
- Référence : `~/Desktop/inflexion-ref-expertise/`

- [ ] **Step 1 : Se placer dans le worktree et sur la branche**

Run :
```bash
cd /Users/floryanleblanc/Developer/GitHub/Inflexion-delta-computationnel-v2
git checkout codex/identity-v2-expertise
git status --short   # doit être propre
```
Expected : branche `codex/identity-v2-expertise`, working tree propre.

- [ ] **Step 2 : Matérialiser les fichiers hors sparse-checkout si besoin**

Run :
```bash
git sparse-checkout list 2>/dev/null || echo "pas de sparse-checkout"
ls nav-shared.js nav-config.js semplice-radar.js semplice-zones-config.js expertise.html assets/design-tokens-v2.css
```
Expected : les 6 fichiers présents. Si `design-tokens-v2.css` absent, le récupérer depuis `origin/main` (`git checkout origin/main -- assets/design-tokens-v2.css`).

- [ ] **Step 3 : Serveur local**

Run :
```bash
python3 -m http.server 4399 >/dev/null 2>&1 &
```

- [ ] **Step 4 : Captures de RÉFÉRENCE des pages témoins (AVANT toute modification)**

Ces captures prouveront la non-régression après qu'on aura touché `nav-shared.js`. Témoins : 5 pages legacy représentatives (thématique, marché, radar pays, éditoriale, + la cible expertise).

Run :
```bash
mkdir -p ~/Desktop/inflexion-ref-expertise/avant
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for p in geopolitics markets country a-propos expertise; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1280,9000 --virtual-time-budget=8000 \
    --screenshot="$HOME/Desktop/inflexion-ref-expertise/avant/$p-1280.png" \
    "http://localhost:4399/$p.html"
done
ls -la ~/Desktop/inflexion-ref-expertise/avant/
```
Expected : 5 PNG non vides. **Onglet actif requis pour le Canvas** — si `country`/`expertise` ont un radar vide, recapturer via un onglet Chrome au premier plan (le radar n'est pas au cœur de la non-régression du chrome, mais vérifier qu'il n'a pas disparu).

- [ ] **Step 5 : Gardes d'inventaire initiales (baseline)**

Run :
```bash
echo "== nav-shared.js : littéraux de couleur (baseline) =="
grep -oiE '#[0-9a-f]{6}|#[0-9a-f]{3}\b|rgba?\([0-9., ]+\)' nav-shared.js | sort | uniq -c | sort -rn
echo "== expertise.html : le radar canvas est présent =="
grep -c 'id="semplice-radar"' expertise.html   # attendu : 1
echo "== expertise.html : ordre des scripts semplice =="
grep -n 'semplice-composite.js\|semplice-zones-config.js\|semplice-radar.js' expertise.html
echo "== expertise.html : tag body actuel =="
grep -n '<body' expertise.html
```
Expected : inventaire affiché (sert de référence Task 1) ; `1` pour le canvas ; composite avant zones-config avant radar ; un seul `<body`.

- [ ] **Step 6 : Commit de préparation**

```bash
git add docs/superpowers/plans/2026-07-20-identity-v2-expertise.md
git commit -m "docs(plan): plan de migration identité v2 pour expertise.html (chrome à la source)"
```

---

## Task 1 — Rendre `nav-shared.js` theme-aware (dictionnaire + thème v1 fidèle)

**Objectif :** introduire un dictionnaire de thème `T`, sélectionné sur `document.body.dataset.chrome`, et remplacer chaque **littéral de couleur de chrome** par une entrée `T.*`. À cette étape, **seul le thème `v1` est défini**, avec les valeurs **strictement égales** aux littéraux actuels. Résultat attendu : **aucune** page ne change (pixel-identiques), y compris expertise (pas encore opt-in). C'est la tâche qui porte tout le risque : on prouve que la refactorisation est neutre avant d'introduire la moindre couleur v2.

**Files:**
- Modify: `nav-shared.js`

- [ ] **Step 1 : Insérer le bloc dictionnaire de thème après `'use strict';` (l.8)**

Ajouter, juste après la ligne `'use strict';` :
```javascript
// ── Thème du chrome (v1 = identité actuelle ; v2 = identité sombre, opt-in via <body data-chrome="v2">) ──
var THEMES={
  v1:{
    // Accents de marque
    accent:'#006650', accentDark:'#06402A', bronze:'#C8955A', bronzeGlow:'rgba(200,149,90,.06)',
    // Mega menu (panneau clair)
    megaPanelBg:'#fff', megaBorder:'#F0F1F4', megaHover:'#F8FAF9', megaHoverBorder:'#E8EDE9',
    megaLabel:'#1A1F2E', megaDesc:'#6B7280', megaFooterBg:'#F9FAFB', megaFooterText:'#A0A8B8',
    // Header / nav (au-dessus du hero, non scrollé)
    ctaBg:'#006650', ctaHover:'#06402A', navLinkTop:'rgba(255,255,255,.7)', navLinkScrolled:'#6b7280',
    logoFilterTop:'brightness(10) saturate(0)', logoFilterScrolled:'none',
    hamburgerTop:'#fff', hamburgerScrolled:'#1A1F2E', bronzeBar:'#C8955A',
    // Header scrollé
    headerScrolledBg:'rgba(255,255,255,.92)', headerScrolledBorder:'#E2E5EB', headerScrolledShadow:'0 1px 8px rgba(0,0,0,.04)',
    // Hero
    heroBg:'#006650', heroLabel:'#33B894', heroTitle:'#fff', heroSub:'rgba(255,255,255,.5)',
    // Overlay mobile
    overlayBg:'#006650', overlayLink:'rgba(255,255,255,.9)', overlayLabel:'rgba(255,255,255,.4)',
    overlayIconBg:'rgba(255,255,255,.1)', overlayIconText:'rgba(255,255,255,.7)', overlayBorder:'rgba(255,255,255,.08)',
    // Footer
    footerBg:'#F7F8FA', footerBorder:'#E2E5EB', footerText:'#5A6178', footerTitle:'#1A1F2E', footerTag:'rgba(90,97,120,.4)'
  }
};
var T=THEMES[(document.body&&document.body.dataset&&document.body.dataset.chrome)]||THEMES.v1;
```
> Note : le CSS injecté (l.11-63) est une **chaîne concaténée**, on peut y interpoler `T.*`. Le bloc `document.head.appendChild(css)` reste, mais `css.textContent=` devient une concaténation utilisant `T.*`.

- [ ] **Step 2 : Remplacer les littéraux dans le CSS injecté (l.13-63) par des interpolations `T.*`**

Table de correspondance exhaustive (chaque occurrence → token). Remplacer `'…#hex…'` par `'…'+T.token+'…'` en découpant la chaîne :

| Ligne | Littéral actuel | Token |
|---|---|---|
| 15 | `#06402A` | `T.accentDark` |
| 18 | `#006650` | `T.accent` |
| 20 | `#006650` | `T.accent` |
| 25 | `#C8955A` (×2 dans le gradient) | `T.bronze` |
| 26 | `rgba(200,149,90,.06)` | `T.bronzeGlow` |
| 27 | `#C8955A` | `T.bronze` |
| 27 | `#F0F1F4` | `T.megaBorder` |
| 28 | `#C8955A` | `T.bronze` |
| 32 | `#006650` | `T.accent` |
| 33 | `#F8FAF9` | `T.megaHover` |
| 33 | `#E8EDE9` | `T.megaHoverBorder` |
| 35 | `rgba(0,102,80,.05)` / `rgba(0,102,80,.1)` / `rgba(0,102,80,.1)` | garder tels quels (dérivés fixes de l'icône ; en v1 identiques — ils seront ré-exprimés en v2 via un token dédié `iconBg` seulement si Task 2 le requiert) |
| 36 | `#006650` / `#06402A` | `T.accent` / `T.accentDark` |
| 36 | `rgba(0,102,80,.18)` | garder (ombre icône) |
| 37 | `#1A1F2E` | `T.megaLabel` |
| 39 | `#6B7280` | `T.megaDesc` |
| 40 | `#6B7280` | `T.megaDesc` |
| 41 | `#006650` | `T.accent` |
| 50 | `#F9FAFB` | `T.megaFooterBg` |
| 50 | `#F0F1F4` | `T.megaBorder` |
| 50 | `#A0A8B8` | `T.megaFooterText` |
| 51 | `#C8955A` | `T.bronze` |
| 61 | `#006650` | `T.accent` |

> Les `rgba(0,102,80,…)` des icônes mega (l.35-36) et `rgba(255,255,255,.2/.15)` (l.16-17, overlays génériques) restent littéraux en v1. Task 2 décidera s'ils prennent un token v2 (ils sont peu visibles ; défaut : token `iconBg`/`iconBgHover` introduit en Task 2 si nécessaire, sinon laissés neutres).

Exemple de découpe (ligne 15) — AVANT :
```javascript
'.ns-btn-cta:hover{background:#06402A!important}\n'+
```
APRÈS :
```javascript
'.ns-btn-cta:hover{background:'+T.accentDark+'!important}\n'+
```

- [ ] **Step 3 : Remplacer les littéraux inline (header/hero/overlay/footer) par `T.*`**

| Ligne(s) | Élément | Littéral | Token |
|---|---|---|---|
| 83 | bronzeBar | `#C8955A` | `T.bronzeBar` |
| 105 | nav-link couleur initiale | `rgba(255,255,255,.7)` | `T.navLinkTop` |
| 106 | mega-menu panel bg | `#fff` | `T.megaPanelBg` |
| 117 | logo filter | `brightness(10) saturate(0)` | `T.logoFilterTop` |
| 119 | CTA bg | `#006650` | `T.ctaBg` |
| 122-124 | hamburger bars ×3 | `#fff` | `T.hamburgerTop` |
| 137 | overlay bg | `#006650` | `T.overlayBg` |
| 141 | mobile link couleur | `rgba(255,255,255,.9)` | `T.overlayLink` |
| 141 | mobile link border | `rgba(255,255,255,.08)` | `T.overlayBorder` |
| 142 | icône bg | `rgba(255,255,255,.1)` | `T.overlayIconBg` |
| 142 | icône texte | `rgba(255,255,255,.7)` | `T.overlayIconText` |
| 145 | label section | `rgba(255,255,255,.4)` | `T.overlayLabel` |
| 150 | logo overlay filter | `brightness(10) saturate(0)` | `T.logoFilterTop` |
| 167 | hero bg | `#006650` | `T.heroBg` |
| 171 | hero label | `#33B894` | `T.heroLabel` |
| 172 | hero titre | `#fff` | `T.heroTitle` |
| 173 | hero sous-titre | `rgba(255,255,255,.5)` | `T.heroSub` |
| 210 | footer border + bg | `#E2E5EB` / `#F7F8FA` | `T.footerBorder` / `T.footerBg` |
| 212 | footer tag | `rgba(90,97,120,.4)` | `T.footerTag` |
| 220,224-236 | footer liens/texte | `#5A6178` | `T.footerText` |
| 222,231 | footer titres colonnes | `#1A1F2E` | `T.footerTitle` |
| 240 | footer bottom border | `#E2E5EB` | `T.footerBorder` |
| 241 | footer copyright | `#5A6178` | `T.footerText` |

> Les `rgba(255,255,255,.2/.15)` des hovers `.ns-close-btn`/`.ns-mobile-cta` (l.16-17) et le CTA hover `#06402A` (via classe `.ns-btn-cta:hover` déjà fait Step 2) restent cohérents.

- [ ] **Step 4 : Remplacer les littéraux du scroll handler (l.259-285) par `T.*`**

| Ligne | Littéral | Token |
|---|---|---|
| 260 | `rgba(255,255,255,.92)` | `T.headerScrolledBg` |
| 263 | `#E2E5EB` | `T.headerScrolledBorder` |
| 264 | `0 1px 8px rgba(0,0,0,.04)` | `T.headerScrolledShadow` |
| 277 | `'#6b7280'` (scrolled) / `'rgba(255,255,255,.7)'` (top) | `T.navLinkScrolled` / `T.navLinkTop` |
| 281 | `'none'` (scrolled) / `'brightness(10) saturate(0)'` (top) | `T.logoFilterScrolled` / `T.logoFilterTop` |
| 284 | `'#1A1F2E'` (scrolled) / `'#fff'` (top) | `T.hamburgerScrolled` / `T.hamburgerTop` |

Exemple (l.277) — AVANT :
```javascript
el.style.color=scrolled?'#6b7280':'rgba(255,255,255,.7)';
```
APRÈS :
```javascript
el.style.color=scrolled?T.navLinkScrolled:T.navLinkTop;
```

- [ ] **Step 5 : Garde de neutralité — page témoin IDENTIQUE au pixel**

C'est LA vérification critique de la tâche : `geopolitics.html` (sans `data-chrome`) doit être **exactement** comme sa capture de référence Phase 0.

Run :
```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1280,9000 --virtual-time-budget=8000 \
  --screenshot="$HOME/Desktop/inflexion-ref-expertise/task1-geopolitics.png" \
  "http://localhost:4399/geopolitics.html?v=task1"
python3 - <<'PY'
from PIL import Image, ImageChops
a=Image.open("/Users/floryanleblanc/Desktop/inflexion-ref-expertise/avant/geopolitics-1280.png").convert("RGB")
b=Image.open("/Users/floryanleblanc/Desktop/inflexion-ref-expertise/task1-geopolitics.png").convert("RGB")
if a.size!=b.size:
    print("TAILLES DIFFÉRENTES", a.size, b.size); raise SystemExit
diff=ImageChops.difference(a,b); bbox=diff.getbbox()
print("bbox de différence:", bbox)  # attendu : None (ou bruit de capture ~<120px, même bbox sur ré-run)
PY
```
Expected : `bbox de différence: None`. Si non-None, tester l'hypothèse nulle (deux captures du même code diffèrent-elles ? bruit ~60-120px) ; si la différence est réelle et structurée → **un littéral v1 ne correspond pas à l'original**, corriger avant d'avancer. **Ne pas continuer tant que la neutralité n'est pas prouvée.**

- [ ] **Step 6 : Console propre**

Run : ouvrir `http://localhost:4399/geopolitics.html` dans un onglet actif, vérifier la console (aucune `ReferenceError` sur `T` / `THEMES`, menu déroulant et scroll fonctionnels).

- [ ] **Step 7 : Commit**

```bash
git add nav-shared.js
git commit -m "refactor(nav): rendre nav-shared.js theme-aware — thème v1 fidèle à l'octet"
```

---

## Task 2 — Définir le thème `v2` (chrome sombre) & l'activer sur expertise

**Objectif :** ajouter l'entrée `v2` au dictionnaire `THEMES` et faire opter `expertise.html` via `<body data-chrome="v2">`. À l'issue : le chrome d'expertise est sombre/achromatique ; les 15 autres pages restent en v1.

**Files:**
- Modify: `nav-shared.js` (ajout du bloc `v2`)
- Modify: `expertise.html` (attribut `data-chrome` sur `<body>`)

- [ ] **Step 1 : Ajouter le thème `v2` dans `THEMES` (après le bloc `v1`)**

Mapping v2 (chrome sombre achromatique + papier ; dérivé de `design-tokens-v2.css`). Le chrome est sombre en haut ET scrollé (pas de bascule vers blanc), le logo reste blanchi partout, le footer devient sombre.
```javascript
  ,v2:{
    accent:'#8E2424', accentDark:'#6E1B1B', bronze:'#8E2424', bronzeGlow:'rgba(142,36,36,.06)',
    megaPanelBg:'#101214', megaBorder:'rgba(232,228,216,.12)', megaHover:'#17191C', megaHoverBorder:'rgba(232,228,216,.16)',
    megaLabel:'#E8E4D8', megaDesc:'#9AA0A4', megaFooterBg:'#0E1012', megaFooterText:'#9AA0A4',
    ctaBg:'#8E2424', ctaHover:'#6E1B1B', navLinkTop:'rgba(232,228,216,.72)', navLinkScrolled:'#9AA0A4',
    logoFilterTop:'brightness(10) saturate(0)', logoFilterScrolled:'brightness(10) saturate(0)',
    hamburgerTop:'#E8E4D8', hamburgerScrolled:'#E8E4D8', bronzeBar:'#8E2424',
    headerScrolledBg:'rgba(14,16,18,.92)', headerScrolledBorder:'rgba(232,228,216,.12)', headerScrolledShadow:'0 1px 8px rgba(0,0,0,.30)',
    heroBg:'#0E1012', heroLabel:'#9AA0A4', heroTitle:'#E8E4D8', heroSub:'rgba(232,228,216,.55)',
    overlayBg:'#0E1012', overlayLink:'rgba(232,228,216,.9)', overlayLabel:'rgba(232,228,216,.4)',
    overlayIconBg:'rgba(232,228,216,.1)', overlayIconText:'rgba(232,228,216,.7)', overlayBorder:'rgba(232,228,216,.08)',
    footerBg:'#0E1012', footerBorder:'rgba(232,228,216,.12)', footerText:'#9AA0A4', footerTitle:'#E8E4D8', footerTag:'rgba(154,160,164,.6)'
  }
```
> `logoFilterScrolled` passe de `none` (v1) à `brightness(10) saturate(0)` (v2) : le header scrollé restant sombre, le logo doit rester blanc. C'est la seule divergence de comportement du scroll handler entre thèmes, et elle est portée par un token — pas par du code conditionnel.

- [ ] **Step 2 : Faire opter expertise.html**

Repérer le `<body …>` d'expertise.html (Phase 0 Step 5) et lui ajouter `data-chrome="v2"`.
AVANT (exemple) :
```html
<body class="…">
```
APRÈS :
```html
<body class="…" data-chrome="v2">
```
> `nav-shared.js` s'exécute en fin de body : `document.body` existe, `dataset.chrome` vaut `"v2"` → `T=THEMES.v2`.

- [ ] **Step 3 : Vérifier le chrome sombre sur expertise (onglet actif)**

Ouvrir `http://localhost:4399/expertise.html?v=task2` dans un onglet **au premier plan** (Canvas). Contrôler visuellement : bandeau haut `#8E2424`, header transparent sur hero sombre `#0E1012`, titre `#E8E4D8`, menu déroulant sombre, footer sombre, logo blanc au repos ET après scroll, hamburger clair en mobile. Le **corps** (scoreboard/tableaux) est encore en couleurs v1 — normal, Task 5.

- [ ] **Step 4 : Garde de non-régression sur les 4 témoins non migrés**

Run :
```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for p in geopolitics markets country a-propos; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1280,9000 --virtual-time-budget=8000 \
    --screenshot="$HOME/Desktop/inflexion-ref-expertise/task2-$p.png" \
    "http://localhost:4399/$p.html?v=task2"
done
python3 - <<'PY'
from PIL import Image, ImageChops
for p in ["geopolitics","markets","country","a-propos"]:
    a=Image.open(f"/Users/floryanleblanc/Desktop/inflexion-ref-expertise/avant/{p}-1280.png").convert("RGB")
    b=Image.open(f"/Users/floryanleblanc/Desktop/inflexion-ref-expertise/task2-{p}.png").convert("RGB")
    bbox=ImageChops.difference(a,b).getbbox() if a.size==b.size else "TAILLE!="
    print(f"{p}: {bbox}")
PY
```
Expected : `None` (ou bruit de capture caractérisé) pour les 4 pages. Une différence structurée = le thème v2 a fui hors d'expertise → échec, on s'arrête. (`country` a un radar Canvas : si sa seule différence est dans la zone du radar par onglet d'arrière-plan, recapturer en onglet actif pour lever le doute.)

- [ ] **Step 5 : Commit**

```bash
git add nav-shared.js expertise.html
git commit -m "feat(expertise): activer le chrome v2 sombre via data-chrome, thème opt-in"
```

---

## Task 3 — Jetons partagés & régime éditorial sur expertise.html

**Objectif :** réutiliser `assets/design-tokens-v2.css` (créé pour analyses.html — **ne pas le réécrire**) et poser le régime éditorial sur la page pour que le corps dispose des mêmes variables.

**Files:**
- Modify: `expertise.html` (`<head>` : lien CSS ; `<body>`/conteneur : `data-design-regime`)

- [ ] **Step 1 : Lier la feuille de jetons dans le `<head>`**

Après le lien `styles.css` (l.51) :
```html
<link rel="stylesheet" href="assets/design-tokens-v2.css">
```

- [ ] **Step 2 : Poser le régime éditorial**

Sur le `<body>` (déjà porteur de `data-chrome="v2"`), ajouter `data-design-regime="editorial"` :
```html
<body class="…" data-chrome="v2" data-design-regime="editorial">
```

- [ ] **Step 3 : Vérifier que les jetons sont disponibles (console)**

Onglet actif → console :
```javascript
getComputedStyle(document.body).getPropertyValue('--surface-page')
// attendu : " #EDEBE4" (régime editorial actif)
```
Expected : la variable résout. Aucun changement visuel encore (Task 5 consomme les jetons).

- [ ] **Step 4 : Commit**

```bash
git add expertise.html
git commit -m "feat(expertise): lier les jetons v2 et déclarer le régime éditorial"
```

---

## Task 4 — Typographie Archivo / IBM Plex sur expertise.html

**Objectif :** aligner la typographie sur l'identité v2 (comme analyses.html), sans casser les usages `JetBrains Mono` des **données** (valeurs de score) — on ajoute IBM Plex Mono pour le chrome/labels, on **conserve** JetBrains Mono là où il sert aux chiffres de données.

**Files:**
- Modify: `expertise.html` (lien Google Fonts l.48 ; `tailwind.config` l.47)

- [ ] **Step 1 : Ajouter les familles v2 au lien Google Fonts (l.48)**

Étendre l'URL `fonts.googleapis.com/css2` avec `Archivo:wght@400;600;800` et `IBM+Plex+Sans:wght@400;500;600;700` et `IBM+Plex+Mono:wght@400;500`, en **gardant** les familles existantes (Libre Baskerville, Inter, JetBrains Mono) tant que le corps n'est pas entièrement rebasculé. (But : ne pas provoquer de FOUT/fallback silencieux pendant la migration progressive du corps.)

- [ ] **Step 2 : Mettre à jour `tailwind.config` (l.47)**

Dans `theme.extend.fontFamily`, faire pointer `display` vers `['Archivo','Georgia','serif']` et `body` vers `['IBM Plex Sans','Inter','sans-serif']`. **Conserver** `data:['JetBrains Mono','SF Mono','monospace']` (les cellules de score en dépendent). 
> Piège : ce `tailwind.config` mélange tokens marque et data protégées (`brand.400=#33B894`, `brand.200=#a7f3d0`…). **Ne toucher que `fontFamily`** ici ; ne pas éditer la palette `brand/navy/cool` (Task 5 traite les couleurs, ciblé).

- [ ] **Step 3 : Vérifier le rendu typographique (onglet actif)**

Ouvrir expertise, vérifier que les titres passent en Archivo, le corps en IBM Plex Sans, et que **les valeurs de score restent en JetBrains Mono**. Aucune famille en fallback (inspecter un titre : `font-family` effective = Archivo).

- [ ] **Step 4 : Commit**

```bash
git add expertise.html
git commit -m "feat(expertise): typographie Archivo / IBM Plex (JetBrains Mono conservé pour les données)"
```

---

## Task 5 — Migrer le corps d'expertise.html (chrome legacy → v2, données épargnées)

**Objectif :** remplacer, **dans le corps de la page uniquement**, les couleurs de chrome legacy par les cibles v2, en laissant **strictement intactes** les couleurs qui encodent une donnée. C'est la tâche la plus volumineuse (styles inline répétés) et la plus exposée au risque de recolorer une donnée. On procède **couleur par couleur, avec garde après chaque**, jamais par chercher-remplacer global.

**Files:**
- Modify: `expertise.html`

**Principe de séparation (rappel) :** une couleur de chrome n'apparaît JAMAIS comme palier de risque/score. Les 4 couleurs de chrome à haut volume — `#1a1f2e`, `#5a6178`, `#e2e5eb`, `#f7f8fa` — n'entrent en collision avec aucune donnée et sont remplaçables globalement **dans ce fichier**. En revanche `#006650`, `#33b894`, `#c8955a`, `#a7f3d0`, `#d1fae5`, `#06402a`, ainsi que `#15803d/#991b1b/#dc2626/#f59e0b/#ea580c/#7c2d12/#8b5cf6` sont **interdites** de remplacement (données, ou double emploi).

- [ ] **Step 1 : Migrer le texte primaire `#1a1f2e` → `#101214`**

Vérifier d'abord qu'aucune occurrence de `#1a1f2e` n'est une donnée (cartographie : cellules mono l.499-541 = poids neutres, donc chrome — OK à migrer ; le tooltip radar l.454 fond `#1a1f2e` est du chrome du composant).
Run (remplacement ciblé, casse insensible, dans expertise.html seul) :
```bash
perl -i -pe 's/#1A1F2E/#101214/gi' expertise.html
grep -ic '#1a1f2e' expertise.html   # attendu : 0
grep -ic '#101214' expertise.html   # attendu : ~120
```

- [ ] **Step 2 : Garde données après Step 1**

Run :
```bash
echo "paliers risque intacts (chacun doit rester présent) :"
for c in '#15803d' '#33b894' '#c8955a' '#f59e0b' '#dc2626' '#991b1b' '#006650' '#7c2d12' '#ea580c' '#8b5cf6'; do
  printf "%s : " "$c"; grep -ic "$c" expertise.html
done
```
Expected : tous > 0, inchangés vs baseline. (`#1a1f2e` n'était pas un palier, donc aucun de ces compteurs ne doit bouger.)

- [ ] **Step 3 : Migrer le texte secondaire `#5a6178` → `#4C5052`**

```bash
perl -i -pe 's/#5A6178/#4C5052/gi' expertise.html
grep -ic '#5a6178' expertise.html   # attendu : 0
```

- [ ] **Step 4 : Migrer les fonds `#f7f8fa` → `#EDEBE4`**

```bash
perl -i -pe 's/#F7F8FA/#EDEBE4/gi' expertise.html
grep -ic '#f7f8fa' expertise.html   # attendu : 0
```

- [ ] **Step 5 : Bordures `#e2e5eb` — décision & migration**

Sur surface papier (`#EDEBE4`/`#FFFFFF`), le filet v2 est `#4C5052` à faible opacité. Deux options : (a) conserver `#E2E5EB` (bordure claire neutre, cohérente sur papier) ; (b) passer à `rgba(76,80,82,.18)` (`--grid-line`). **Recommandation : (b)** pour aligner sur analyses.html.
```bash
perl -i -pe 's/#E2E5EB/rgba(76,80,82,.18)/gi' expertise.html
grep -ic '#e2e5eb' expertise.html   # attendu : 0
```
> Vérifier qu'aucune bordure `#E2E5EB` n'était sémantique (cartographie : c'est du séparateur de tableau = chrome). OK.

- [ ] **Step 6 : Cas des dérivés emerald du chrome (`#06402a`, `rgba(0,101,80,…)`)**

`#06402a` (10×) co-occurre avec `#006650` dans les gradients CTA (l.1052,1326) et la bordure d'en-tête de table (l.148-154). Comme `#006650` est **intouchable** (donnée), ces gradients sont un **cas mixte marque/chrome**. **Décision : ne pas migrer les gradients CTA emerald dans cette tâche** (ils restent emerald), pour ne pas casser la cohérence avec `#006650` qu'on ne peut pas déplacer. Documenter comme dette : « CTA du corps encore emerald, à revoir si un bouton v2 accent est souhaité ». Idem `rgba(0,101,80,.08/.04)` (ombres/tint) → laisser.
> Aucune commande : cette étape est une **décision consignée**, pas une édition.

- [ ] **Step 7 : Vérifications visuelles & données (onglet actif)**

Run captures + garde données complète :
```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1280,9000 --virtual-time-budget=8000 \
  --screenshot="$HOME/Desktop/inflexion-ref-expertise/task5-expertise.png" \
  "http://localhost:4399/expertise.html?v=task5"
echo "== données (paliers + tiers de score) — compteurs inchangés vs baseline =="
for c in '#006650' '#15803d' '#33b894' '#c8955a' '#f59e0b' '#dc2626' '#991b1b' '#7c2d12' '#ea580c' '#8b5cf6' '#a7f3d0' '#d1fae5' '#fef2f2' '#fecaca' '#ecfdf5'; do
  printf "%s : " "$c"; grep -ic "$c" expertise.html
done
echo "== chrome legacy éliminé du corps =="
for c in '#1a1f2e' '#5a6178' '#f7f8fa' '#e2e5eb'; do printf "%s : " "$c"; grep -ic "$c" expertise.html; done  # attendus : 0 0 0 0
```
Expected : chrome legacy à 0 ; **toutes** les couleurs de données à leur compte baseline. Contrôle visuel onglet actif : radar dessiné, scoreboard lisible, échelles de risque toujours colorées correctement, encarts double-lecture intacts.

- [ ] **Step 8 : Contraste — vérifier la lisibilité sur papier**

Les textes `#101214`/`#4C5052` sur `#EDEBE4` : `#101214` sur `#EDEBE4` ≈ 15:1 (OK), `#4C5052` sur `#EDEBE4` ≈ 7:1 (OK AA). Les valeurs de score (couleurs de données) sur fond papier : vérifier visuellement que les tiers clairs (`#33b894`, `#c8955a`) restent lisibles ; si un tier passe sous AA sur `#EDEBE4`, **consigner en dette** (décision éditoriale, ne pas recolorer une donnée).

- [ ] **Step 9 : Commit**

```bash
git add expertise.html
git commit -m "feat(expertise): migrer le corps sur papier v2 (chrome legacy remplacé, données épargnées)"
```

---

## Task 6 — Chrome interne du radar (`semplice-radar.js`) [décision]

**Objectif :** décider et appliquer le traitement du chrome du radar (grille, axes, labels d'anneaux) — les seules couleurs *non-donnée* du Canvas. `semplice-radar.js` est utilisé par **expertise.html uniquement** (country.html utilise `semplice-country.js`), donc le modifier n'affecte pas d'autre page.

**Files:**
- Modify (conditionnel): `semplice-radar.js`

- [ ] **Step 1 : Décision — le radar reste-t-il sur surface claire ?**

Le radar est dans le corps, désormais sur papier `#EDEBE4`/blanc. Son chrome interne actuel (`#D1D5DE`/`#E2E5EB` grille, `#1A1F2E` label, `#5A6178` anneaux) reste **cohérent sur clair**. **Recommandation : migration minimale** — n'aligner que le label d'axe `#1A1F2E`→`#101214` et les anneaux `#5A6178`→`#4C5052` pour l'homogénéité typographique, **laisser la grille** (`#D1D5DE`/`#E2E5EB`) telle quelle (repères neutres). Ne **jamais** toucher aux paliers (l.33-34), couleurs de série (zones-config), ni couleurs de mode (l.114/124/128).

- [ ] **Step 2 : Appliquer la migration minimale**

```bash
perl -i -pe 's/#1A1F2E/#101214/g' semplice-radar.js   # label d'axe (l.94)
perl -i -pe 's/#5A6178/#4C5052/g' semplice-radar.js   # labels d'anneaux (l.101)
echo "paliers & modes intacts :"
grep -nc '#006650\|#33B894\|#C8955A\|#DC2626' semplice-radar.js   # inchangé vs baseline
```
> Vérifier que `#1A1F2E`/`#5A6178` n'apparaissent QUE aux lignes 94/101 (chrome). S'ils apparaissent ailleurs comme donnée, cibler par ligne plutôt que globalement.

- [ ] **Step 3 : Vérifier le radar (onglet actif OBLIGATOIRE)**

Ouvrir expertise en onglet au premier plan. Survoler un axe, changer de mode (Risque/Opportunité/Combiné), vérifier que : les séries de zones gardent leurs couleurs, les paliers sont corrects, seuls les labels/anneaux ont suivi la typographie. Le Canvas n'est pas dessiné en onglet d'arrière-plan (`requestAnimationFrame` suspendu).

- [ ] **Step 4 : Commit**

```bash
git add semplice-radar.js
git commit -m "feat(expertise): aligner le chrome typographique du radar (données intactes)"
```

---

## Task 7 — Vérification finale & non-régression des 15 pages legacy

**Objectif :** prouver que la migration a atteint expertise **et seulement** expertise côté chrome partagé, et que la page est saine (responsive, clavier, console).

**Files:** aucun (vérification) — sauf correctifs éventuels.

- [ ] **Step 1 : Non-régression sur l'ensemble des pages legacy témoins**

Recapturer les 4 témoins non migrés + comparer au pixel (comme Task 2 Step 4) — plus, par prudence, 2 pages legacy supplémentaires (`crypto`, `commodities`).
```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for p in geopolitics markets country a-propos crypto commodities; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1280,9000 --virtual-time-budget=8000 \
    --screenshot="$HOME/Desktop/inflexion-ref-expertise/final-$p.png" \
    "http://localhost:4399/$p.html?v=final"
done
```
Comparer `crypto`/`commodities` à une capture de référence prise maintenant sur `origin/main` (elles n'avaient pas de baseline Phase 0) via un worktree `origin/main` si besoin. `geopolitics/markets/country/a-propos` : comparer aux `avant/`. Expected : identiques (bruit de capture toléré).

- [ ] **Step 2 : Responsive expertise (360 / 768 / 1280 / 1440)**

Capturer expertise aux 4 largeurs, vérifier l'absence de débordement horizontal du body (le débordement 360px est une dette préexistante v1 — vérifier qu'on ne l'aggrave pas).

- [ ] **Step 3 : Accessibilité clavier & overlay mobile**

Tabuler dans le header v2 (liens visibles, focus visible), ouvrir/fermer l'overlay mobile (`data-chrome=v2` → overlay sombre), vérifier `aria-expanded`. Console sans erreur.

- [ ] **Step 4 : Périmètre du diff**

```bash
git diff --name-only origin/main...HEAD
```
Expected exact :
```
docs/superpowers/plans/2026-07-20-identity-v2-expertise.md
nav-shared.js
expertise.html
semplice-radar.js
assets/design-tokens-v2.css   # uniquement s'il a fallu le rematérialiser depuis main (sinon absent)
```
Aucun autre fichier. En particulier : `nav-config.js`, `styles.css`, `semplice-zones-config.js`, `semplice-composite.js`, `semplice-country.js` et les autres pages HTML **ne doivent pas** apparaître.

- [ ] **Step 5 : Bilan & handoff**

Rédiger le récapitulatif : ce qui a changé, la preuve de non-régression (bbox `None` sur les témoins), les dettes consignées (gradients CTA emerald du corps non migrés Task 5 Step 6 ; contraste éventuel de tiers de score sur papier Task 5 Step 8 ; débordement 360px préexistant). Proposer : ouvrir une PR vers `main`, ou enchaîner sur la migration des autres pages legacy (le mécanisme `data-chrome` est désormais disponible pour toutes).

---

## Notes laissées ouvertes (hors périmètre de ce plan)

- **Les 15 autres pages legacy peuvent désormais opter pour v2** en ajoutant `data-chrome="v2"` — mais chacune a son propre corps à migrer. À planifier page par page (ce plan livre l'infrastructure + expertise comme pilote).
- **Bandeau bronze → accent `#8E2424` en v2** : choix esthétique retenu (garde une signature colorée fine). Réversible via le token `bronzeBar`.
- **`index.html` (source de vérité visuelle)** n'est pas legacy (React) et n'est pas concerné par `nav-shared.js` ; sa refonte est un chantier distinct (cf. travail Codex remisé).
- **Radar : grille laissée claire** (Task 6) — si un fond sombre était un jour souhaité pour le radar, revoir grille/axes ensemble.
