# Identité v2 — Migration de `analyses.html` (Lot C, page éditoriale sans instrument)

> **Spec :** `docs/superpowers/specs/2026-07-16-identity-v2-design.md` — ce plan l'**étend**, il ne la contredit pas.
> **Plan amont :** `docs/superpowers/plans/2026-07-16-identity-v2-country-pilot.md` — ce plan est un lot C, § « Lot C — Pages éditoriales et services », première ligne : « `analyses.html` et les articles ».
> **Gouvernance (arbitrée le 2026-07-17) :** `analyses.html` passe **en premier** — c'est le pilote de facto du régime éditorial ; `country.html` reste le pilote du régime instrument et suivra. Préalable unique : la **Phase 0** ci-dessous (resynchronisation de la branche), adaptée du plan variante `variantes/2026-07-17-identity-v2-analyses-madagascar.md` (conservé pour référence : sa moitié madagascar et ses arbitrages éditoriaux — temps de lecture, snapshot SEMPLICE v2.1, sources — restent valables).
> **Arbitrage catégories (2026-07-17) :** les catégories du catalogue restent **colorées** (décision utilisateur). Ce choix prime sur la règle « catégories textuelles et achromatiques » du plan variante pour cette page — la ligne 49 est préservée telle quelle, comme le prévoient les tâches ci-dessous.

**Objectif :** basculer `analyses.html` en identité v2 régime éditorial — chrome sombre achromatique + papier — sans modifier une seule des cinq couleurs qui encodent la rubrique d'un article.

**Architecture :** trois commits ordonnés et indépendamment réversibles. (1) On supprime d'abord le code mort — la `tailwind.config` inline et neuf classes CSS ne sont référencées nulle part sur cette page ; leur suppression retire 21 des 88 hex sans changer un pixel et fait disparaître, pour cette page, le problème des trois variantes divergentes de config Tailwind. (2) On introduit les jetons partagés sous `[data-design-regime="editorial"]`, sans usage, donc sans effet visuel. (3) On applique la palette, chrome puis corps, en laissant intacte la ligne 49 qui porte le codage catégoriel.

**Stack :** HTML statique + React 18 via `esm.sh` en `createElement` (pas de JSX), Tailwind CDN (utilitaires arbitraires `text-[#hex]` uniquement), `nav-config.js`, `scroll-reveal.js`, Google Fonts. Aucun build, aucun test automatisé sur le front : vérification par `grep` + `python3 -m http.server` + inspection visuelle, onglet actif.

## Écarts constatés par rapport au briefing (mesurés, à acter avant de commencer)

| Affirmation du briefing | Mesure réelle | Commande |
|---|---|---|
| `analyses.html` charge `image-catalog.js` | **Faux.** 0 occurrence. Les 14 vignettes sont des URL Unsplash en dur dans `ANALYSES` (lignes 92-248). `image-catalog.js` n'est donc pas dans le périmètre. | `grep -c 'image-catalog' analyses.html` → `0` |
| Scripts chargés | `nav-config.js` (l. 74) et **`scroll-reveal.js` (l. 521)** — ce dernier est partagé par 13 pages et n'était pas listé. | `grep -n '<script' analyses.html` |
| `app.js` (les 6 dégradés catégoriels de hero) | **Non chargé** par `analyses.html`. Hors périmètre. | `grep -c 'app.js' analyses.html` → `0` |
| ~88 hex en dur | **88 exactement**, dont **14 dans la seule `tailwind.config` (l. 10)** et **7 dans du CSS mort**. | `grep -oiE '#[0-9a-f]{6}|#[0-9a-f]{3}\b' analyses.html | wc -l` → `88` |
| « la config Tailwind inline est un 2e site de définition des couleurs » | **Vrai en théorie, mort en pratique sur cette page** : zéro utilitaire `brand-*`/`cool-*`/`font-display`/`font-body` n'est utilisé. Le mot `brand` et le mot `cool` n'apparaissent qu'à la ligne 10. La parade n'est donc pas de faire converger la config : c'est de la supprimer. | `grep -noE 'brand|cool|font-display|font-body' analyses.html` → `10:brand` / `10:cool` |

---

## Périmètre — ce qui est interdit

Aucun fichier de cette liste n'est modifié par ce plan. Un plan mono-page qui les touche n'est plus mono-page.

| Fichier | Raison |
|---|---|
| `nav-config.js` | Chargé par **toutes** les pages. `analyses.html` ne consomme que `window.MEGA_NAV` (l. 252) et le rend en React : aucun style n'en vient. Rien à y changer. |
| `nav-shared.js` | Chargé par 16 pages legacy. **`analyses.html` ne le charge pas** (`grep -c 'nav-shared' analyses.html` → `0`). La parade « surcharger le bloc `<style>` injecté par une classe sur `<body>` » est donc **sans objet ici** : la nav de cette page est du React local. Ne pas l'invoquer. |
| `styles.css` | Non chargé par cette page. Toucher ce fichier casserait les 8 pages legacy. |
| `scroll-reveal.js` | Chargé par 13 pages (`grep -rl 'scroll-reveal.js' . --include='*.html'`). Il injecte son propre `<style>` (`.sr-hidden`/`.sr-visible`) qui ne contient **aucune couleur** — uniquement opacité et translation. Aucun besoin de le toucher, et le toucher casserait 12 autres pages. |
| `app.js`, `data-loader.js`, `image-catalog.js` | Non chargés par cette page. |
| `semplice-zones-config.js`, `semplice-radar.js`, `semplice-country.js` | Non chargés. Aucun instrument sur cette page. |
| `index.html`, `analysis-template.html`, les 11 `analyse-*.html`, `artifact-inflexion.html` | Ils dupliquent la ligne `.category-*` et leurs propres `tailwind.config`. Les faire converger est le Lot A / la suite du Lot C, pas ce plan. |
| `data/article-du-jour.json` | Donnée éditoriale consommée par `fetch` (l. 349). Aucune couleur. |

**Conséquence assumée :** après ce lot, `analyses.html` divergera visuellement de `index.html` et des articles. C'est le régime normal d'une migration par lots ; c'est aussi la raison pour laquelle le Lot C doit enchaîner les articles rapidement.

---

## Couleurs porteuses de sens sur cette page

Établi en lisant `analyses.html` ligne à ligne. **Aucune de ces valeurs n'est remplacée, ni par un jeton, ni par un autre hex.**

| Fichier:ligne | Hex | Ce qu'elle encode |
|---|---|---|
| `analyses.html:49` (`.category-geo`) | `#2563eb` | Rubrique **Géopolitique** — 10 des 14 articles |
| `analyses.html:49` (`.category-marches`) | `#006650` | Rubrique **Marchés** — 2 articles. **Piège n°1 : ce `#006650` n'est pas de la marque.** |
| `analyses.html:49` (`.category-crypto`) | `#f59e0b` | Rubrique **Crypto** |
| `analyses.html:49` (`.category-matieres`) | `#C8955A` | Rubrique **Matières Premières**. **Le bronze est ici catégoriel, pas décoratif.** |
| `analyses.html:49` (`.category-iatech`) | `#8b5cf6` | Rubrique **IA & Tech** — 2 articles |

Ces cinq classes sont appliquées par `cls` dans `CATEGORIES` (l. 84-90) et consommées à la ligne 424 (`className: \`${cat.cls} ...\``). Elles sont dupliquées à l'identique dans 12 autres fichiers HTML — les recolorer ici seul ferait diverger le codage catégoriel du site. **Ligne 49 : intouchable dans ce lot.**

Ce qui **n'est pas** porteur de sens sur cette page, contrairement à ce qu'on pourrait croire :

- `#006650` aux lignes 25, 31, 53-54, 60, 62, 72, 279, 284, 295, 331, 364, 365, 375, 404, 432, 478, 492 : marque pure (soulignés, hovers, CTA, hero, puces, filtre actif). Migrables.
- `#33B894` ligne 334 : label du hero, marque pure. Migrable.
- `#C8955A` ligne 269 : la barre bronze de 3px. Marque pure — à ne pas confondre avec le `#C8955A` de la ligne 49.
- `#a7f3d0`, `#6b7280`, `#D1FAE5`, `#E8F5EE`, `#00997A`, `#007A60`, `#6ee7b7`, `#D1D5DE`, `#F59E0B` de la **ligne 10** : rampe Tailwind **jamais consommée**. Supprimée en Task 2, pas migrée.
- `#6B7280` lignes 431 et 497 : gris de métadonnées (source de l'article, liste des sources en pied). Aucun sens encodé, migrable vers `--text-secondary`.

**Aucun état « données incomplètes » n'est introduit sur cette page.** Spec §6 : « un état visuel n'est appliqué que si sa valeur varie entre les objets affichés ». Les 14 entrées de `ANALYSES` (l. 92-248) portent toutes exactement les mêmes champs (`id, cat, title, summary, source, date, readTime, img, href`). Les jetons `--surface-incomplete` et `--rule-incomplete` ne sont donc **pas** déclarés dans le régime éditorial.

---

## Phase 0 — Resynchroniser la branche avant tout (adaptée du plan variante)

La branche `codex/delta-computationnel-v2` est à **28 commits derrière `origin/main`, 2 devant**. Migrer sur cette base puis rebaser doublerait les conflits. **Fait vérifié le 2026-07-17 qui rend la suite sûre :** `analyses.html`, `scroll-reveal.js`, `nav-config.js` et `data/article-du-jour.json` sont **identiques octet pour octet** entre HEAD et `origin/main` (`git diff --stat HEAD origin/main -- analyses.html` → vide). Toutes les ancres de lignes de ce plan survivent donc au rebase — mais la garde de l'étape 5 le re-vérifie au moment de l'exécution, au cas où `main` aurait encore avancé.

**Files:** aucun fichier de contenu modifié — opérations git uniquement.

- [ ] **Étape 1 : constater l'état et mettre à l'abri les travaux non suivis**
  ```bash
  cd /Users/floryanleblanc/Documents/GitHub/Inflexion-delta-computationnel-v2
  git status --porcelain
  ```
  Attendu : uniquement des lignes `??` (`docs/superpowers/…`, `prototypes/`). S'il y a des modifications suivies non commitées, s'arrêter et demander.
- [ ] **Étape 2 : élargir le sparse-checkout AVANT tout `git add`** — le dépôt ne matérialise que `data`, et **git refuse d'indexer un chemin hors du périmètre sparse** (« matched paths that exist outside of your sparse-checkout definition »). `docs` et `prototypes` doivent y entrer pour être commitables ; `assets` est nécessaire à la Task 3 qui y crée `design-tokens-v2.css`.
  ```bash
  git sparse-checkout add docs prototypes assets scripts .github
  git sparse-checkout list
  ```
  Attendu : la liste contient `data`, `docs`, `prototypes`, `assets`, `scripts`, `.github`.
- [ ] **Étape 3 : commiter la spec, les plans et les prototypes sur une branche dédiée** (les fichiers non suivis survivent à un rebase, mais un travail non commité n'a pas de sauvegarde)
  ```bash
  git switch -c codex/identity-v2-analyses
  git add docs/superpowers/ prototypes/
  git commit -m "docs(identity-v2): spec, plans (analyses + country + variante) et prototypes

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```
- [ ] **Étape 4 : rebaser sur main**
  ```bash
  git fetch origin main
  git rebase origin/main
  ```
  **Conflit constaté à l'exécution (2026-07-17) : `CLAUDE.md`** — `main` l'avait fait évoluer vers SEMPLICE v3 (I = Intelligence artificielle, grilles v3, moteur `semplice-composite.js`) pendant que notre commit corrigeait les faits v2.1. Résolution appliquée, à reproduire si le cas se représente : **fusionner les deux vérités après vérification sur les fichiers de `main`** — prendre les faits v3 de `main` (dimension IA, grilles v3, composites calculés) **et** garder nos corrections mesurées (18 zones, GeoJSON 17 features, backtests v2.0 12/12 en référence + v3 3 cas IA en complément). Ne jamais résoudre en choisissant un camp entier : les deux versions contenaient chacune des erreurs que l'autre corrigeait. Pour les contenus et données (`semplice-zones-config.js`, `data/`) : version de `main`.
  Fait structurel révélé par le rebase, engageant pour le pilote `country` : **les composites sont désormais calculés par `semplice-composite.js`, plus stockés** (Ormuz passe de 6,1 stocké à 5,8 calculé) — tout test qui verrouille des couleurs par composite doit charger `semplice-composite.js` avant `semplice-zones-config.js` et recalculer ses attendus.
- [ ] **Étape 5 : garde post-rebase — re-vérifier les ancres du plan**
  ```bash
  grep -c 'tailwind.config' analyses.html
  grep -oiE '#[0-9a-f]{6}|#[0-9a-f]{3}\b' analyses.html | wc -l
  grep -n '^\.category-geo' analyses.html
  ```
  Attendu : `1`, puis `88`, puis une ligne unique en **ligne 49**. **Si l'un de ces trois chiffres diffère, `main` a modifié la page : s'arrêter et ré-ancrer le plan avant d'exécuter la moindre tâche.**
- [ ] **Étape 6 : re-vérifier que le pilote `country` n'est pas concerné par ce lot** — `semplice-zones-config.js` ayant changé côté main, le plan `country-pilot` devra revalider ses verrous de couleurs après cette Phase 0. Hors périmètre ici ; noter seulement que c'est fait.

---

## Task 1 — Figer la référence visuelle

**Files:** aucun fichier modifié.

- [ ] Lancer le serveur depuis la racine du dépôt :
  ```bash
  cd /Users/floryanleblanc/Documents/GitHub/Inflexion-delta-computationnel-v2
  python3 -m http.server 8765
  ```
  Vérifié : `curl -s -o /dev/null -w '%{http_code}' http://localhost:8765/analyses.html` renvoie `200`.
- [ ] Ouvrir `http://localhost:8765/analyses.html` dans un **onglet au premier plan** et le garder actif : `scroll-reveal.js` déclenche ses scans dans un `setInterval` + `requestAnimationFrame` (`scroll-reveal.js:52-58`), suspendus en arrière-plan. Une capture faite dans un onglet caché montre des sections restées à `opacity:0`.
- [ ] Capturer à 360, 768, 1280 et 1440 px après `document.fonts.ready`, dans `~/Desktop/inflexion-ref-analyses/avant/` (hors dépôt, non versionné) : haut de page non scrollé, page scrollée (nav en état `nav-scrolled`), carte « Article du jour », les 6 boutons de filtre, un filtre actif autre que « Tout », la grille, une carte survolée, le footer, l'overlay mobile ouvert à 360 px.
- [ ] Relever la console. Attendu : aucune erreur. `data/article-du-jour.json` est optionnel — l'échec du `fetch` est avalé (`.catch(()=>{})`, l. 351) et la section ne se rend pas (`if(!article)return null`, l. 353). Noter si la carte est présente ou absente, pour comparer à l'identique après.
- [ ] Enregistrer l'empreinte de départ :
  ```bash
  grep -oiE '#[0-9a-f]{6}|#[0-9a-f]{3}\b' analyses.html | wc -l
  ```
  Sortie attendue : `88`.

---

## Task 2 — Supprimer le code mort (commit neutre, aucun pixel changé)

**Files:**
- Modify: `analyses.html` — suppression des lignes 9-11 (`tailwind.config`), 18 (`.category-label`), 51 (`.font-data`), 53-62 (`.glass`, `.glass-light`, `.hero-dark` ×2, `.section-alt`, `.section-divider`, `.featured-card` ×3, `.hero-glow`).

Preuve que tout ce bloc est mort — `sed '13,69d'` retire le `<style>`, puis on cherche chaque sélecteur dans le reste du fichier :
```bash
for c in category-label font-data glass glass-light hero-dark section-alt section-divider featured-card hero-glow display-text; do
  printf '%-16s %s\n' "$c" "$(sed '13,69d' analyses.html | grep -c -- "$c")"
done
```
Sortie mesurée : `0` pour les dix.

- [ ] Supprimer les lignes 9 à 11, soit exactement :
  ```html
  <script>
  tailwind.config={theme:{extend:{colors:{brand:{900:'#06402A',800:'#006650',700:'#007A60',600:'#008066',500:'#00997A',400:'#33B894',300:'#6ee7b7',200:'#a7f3d0',100:'#d1fae5',50:'#E8F5EE'},cool:{50:'#F7F8FA',100:'#ECEEF2',200:'#E2E5EB',300:'#D1D5DE'}},fontFamily:{display:['Libre Baskerville','Georgia','serif'],body:['Inter','Helvetica Neue','sans-serif'],data:['JetBrains Mono','SF Mono','monospace']}}}}
  </script>
  ```
  Après : ces trois lignes n'existent plus. La ligne 8 (`<script src="https://cdn.tailwindcss.com"></script>`) reste : les utilitaires arbitraires `text-[#101214]`, `max-w-7xl`, `grid-cols-3` etc. en dépendent. Le fichier ne définit alors plus aucune couleur de marque hors de son `<style>` et de ses `className`.
- [ ] Supprimer la ligne 18 :
  ```css
  .category-label{font-family:'Inter',sans-serif;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#006650}
  ```
  Ne pas confondre avec `.category-geo`/`.category-marches`/… de la ligne 49, qui restent.
- [ ] Supprimer la ligne 51 :
  ```css
  .font-data{font-family:'JetBrains Mono','SF Mono',monospace}
  ```
- [ ] Supprimer les lignes 53 à 62, soit exactement :
  ```css
  .glass{background:rgba(0,102,80,.06);backdrop-filter:blur(16px);border:1px solid rgba(0,102,80,.10)}
  .glass-light{background:rgba(0,102,80,.04);backdrop-filter:blur(12px);border:1px solid rgba(0,102,80,.06)}
  .hero-dark{background-color:#006650;color:#FFFFFF}
  .hero-dark h1,.hero-dark h2,.hero-dark .display-text{color:#FFFFFF}
  .section-alt{background-color:#F7F8FA}
  .section-divider{border-top:1px solid #ECEEF2}
  .featured-card{position:relative;overflow:hidden}
  .featured-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:#006650;transform:scaleY(0);transition:transform .3s ease;transform-origin:top}
  .featured-card:hover::before{transform:scaleY(1)}
  .hero-glow{position:absolute;top:-120px;right:-80px;width:500px;height:500px;background:radial-gradient(circle,rgba(0,102,80,.06) 0%,transparent 70%);pointer-events:none}
  ```
- [ ] Dans la ligne 17, retirer `.display-text` du sélecteur, devenu orphelin après la suppression de la ligne 56.
  Avant :
  ```css
  h1,h2,h3,.display-text{font-family:'Libre Baskerville',Georgia,serif;font-weight:700;line-height:1.15;letter-spacing:-0.02em;color:#1A1F2E}
  ```
  Après :
  ```css
  h1,h2,h3{font-family:'Libre Baskerville',Georgia,serif;font-weight:700;line-height:1.15;letter-spacing:-0.02em;color:#1A1F2E}
  ```
- [ ] Vérifier la baisse d'hex :
  ```bash
  grep -oiE '#[0-9a-f]{6}|#[0-9a-f]{3}\b' analyses.html | wc -l
  ```
  Sortie attendue : `67` (88 − 14 de la config − 7 du CSS mort).
- [ ] Vérifier que la config a bien disparu et qu'aucun utilitaire ne la réclamait :
  ```bash
  grep -c 'tailwind.config' analyses.html
  grep -noE 'brand|cool|font-display|font-body|font-data' analyses.html
  ```
  Sortie attendue : `0`, puis aucune ligne.
- [ ] Vérifier qu'aucun `rgba` emerald ne subsiste hors de la nav :
  ```bash
  grep -noE 'rgba?\([^)]*\)' analyses.html
  ```
  Sortie attendue : `27:rgba(0,102,80,.06)` (`.mega-item:hover`), `29:rgba(255,255,255,.92)` et `29:rgba(0,0,0,.04)` (`.nav-scrolled`), `43:rgba(10,22,40,.08)` (`.article-card:hover`). Les numéros tiennent compte des 4 lignes supprimées plus haut dans le fichier (9-11, 18) — vérifié en rejouant les suppressions. Les cinq `rgba(0,102,80,…)` des lignes 53-62 d'origine ont disparu.
- [ ] Recharger dans l'onglet actif aux 4 largeurs et comparer aux captures de la Task 1. Attendu : **pixel pour pixel identique**. Toute différence signifie qu'un sélectif était vivant — annuler et re-mesurer.
- [ ] Commiter :
  ```bash
  git add analyses.html
  git commit -m "$(cat <<'EOF'
  refactor(analyses): supprimer la config Tailwind inline et le CSS morts

  La config Tailwind inline de analyses.html ne definissait que des utilitaires
  brand-*/cool-*/font-display/font-body jamais consommes par la page : 14 hex
  morts, et une troisieme variante divergente de la rampe de marque du depot.
  Neuf classes CSS (.category-label, .font-data, .glass, .glass-light,
  .hero-dark, .section-alt, .section-divider, .featured-card, .hero-glow) ne
  sont referencees nulle part dans la page.

  88 -> 67 litteraux hex, aucun changement visuel.
  Les cinq couleurs categorielles de la ligne .category-* sont conservees.

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 3 — Déclarer le régime éditorial et ses jetons (aucun usage, aucun pixel changé)

**Files:**
- Create: `assets/design-tokens-v2.css` — `assets/` existe et est **vide** (`ls -A assets/` → aucune sortie). Le fichier prévu par la Task 2.1 du plan pilote n'a pas encore atterri sur cette branche.
- Modify: `analyses.html` — ajout d'un `<link>` après la ligne 12, ajout de `data-design-regime="editorial"` sur `<body>` (l. 71 avant Task 2).

> **Si `assets/design-tokens-v2.css` existe déjà** quand ce lot démarre (le pilote a atterri) : ne pas le récrire. N'ajouter que le bloc `[data-design-regime="editorial"]` ci-dessous, à la suite du bloc `instrument`, et laisser les blocs `:root` et `instrument` strictement intacts.

- [ ] Créer `assets/design-tokens-v2.css` avec ce contenu exact :
  ```css
  /* Jetons de fondation — identite v2.
     Source de verite : docs/superpowers/specs/2026-07-16-identity-v2-design.md
     Les jetons de fondation sont volontairement HORS de :root : ils ne doivent pas
     ecraser les variables historiques de styles.css sur les pages restees en v1. */

  [data-design-regime="instrument"] {
    --chrome-ground: #0E1012;
    --chrome-text: #E8E4D8;
    --chrome-dim: #9AA0A4;
    --surface-page: #EDEBE4;
    --surface-raised: #FFFFFF;
    --surface-incomplete: #DFDCD0;
    --rule-incomplete: #9B957A;
    --text-primary: #101214;
    --text-secondary: #4C5052;
    --border-hairline: #4C5052;
  }

  /* Regime editorial — spec section 2.2. Pages sans instrument.
     Memes fondations que le regime instrument : le chrome est une seule couche
     sur tout le site, il ne change pas de couleur selon la page.
     Deux differences assumees :
     - pas de --surface-incomplete / --rule-incomplete : spec section 6, un etat
       n'est affiche que si sa valeur varie entre les objets. Les 14 entrees de
       ANALYSES portent toutes les memes champs.
     - un accent editorial unique, dont le role est nomme ci-dessous. */
  [data-design-regime="editorial"] {
    --chrome-ground: #0E1012;
    --chrome-text: #E8E4D8;
    --chrome-dim: #9AA0A4;
    --surface-page: #EDEBE4;
    --surface-raised: #FFFFFF;
    --text-primary: #101214;
    --text-secondary: #4C5052;
    --border-hairline: #4C5052;

    /* Filet de structure attenue. Meme valeur que --v2-grid-line du prototype
       (prototypes/identity-v2/expertise-v2.css:2). */
    --grid-line: rgba(76, 80, 82, 0.18);

    /* Role unique et exclusif : affordance de lecture d'un article
       (lien « Lire → » et filet de survol de la carte). Aucun autre usage.
       Autorise par la spec section 2.2 : cette page ne rend aucun arbre Delta.
       8,65:1 sur #FFFFFF, 7,25:1 sur #EDEBE4. Interdit dans le chrome. */
    --editorial-accent: #8E2424;
  }
  ```
- [ ] Ajouter le `<link>` dans `analyses.html`, juste après la ligne des Google Fonts (l. 12 dans le fichier d'origine, l. 9 après Task 2).
  Avant :
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
  ```
  Après :
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <link href="assets/design-tokens-v2.css" rel="stylesheet"/>
  <style>
  ```
  L'ordre compte : le `<style>` de la page vient après, il pourra consommer les jetons.
- [ ] Déclarer le régime sur `<body>`.
  Avant :
  ```html
  <body>
  ```
  Après :
  ```html
  <body data-design-regime="editorial">
  ```
- [ ] Vérifier le chargement du fichier :
  ```bash
  python3 -m http.server 8765 &
  sleep 1; curl -s -o /dev/null -w 'tokens -> %{http_code}\n' http://localhost:8765/assets/design-tokens-v2.css
  ```
  Sortie attendue : `tokens -> 200`.
- [ ] Vérifier dans la console de l'onglet actif que les jetons résolvent :
  ```js
  getComputedStyle(document.body).getPropertyValue('--chrome-ground').trim()
  ```
  Sortie attendue : `#0E1012`. Et `getPropertyValue('--surface-incomplete').trim()` doit renvoyer la chaîne vide — c'est le contrôle que le régime éditorial est bien celui qui s'applique, pas le régime instrument.
- [ ] Recharger aux 4 largeurs. Attendu : **identique à la Task 2**. Aucun jeton n'est encore consommé.
- [ ] Commiter :
  ```bash
  git add assets/design-tokens-v2.css analyses.html
  git commit -m "$(cat <<'EOF'
  feat(design): declarer le regime editorial v2 et ses jetons partages

  Ajoute assets/design-tokens-v2.css avec les jetons de fondation de la spec,
  hors de :root pour ne pas ecraser styles.css sur les pages restees en v1.
  Le regime editorial n'embarque ni --surface-incomplete ni --rule-incomplete
  (spec section 6 : aucun champ ne varie entre les 14 analyses) et nomme un
  accent unique --editorial-accent pour l'affordance de lecture d'un article.

  analyses.html declare data-design-regime="editorial" et charge le fichier.
  Aucun jeton n'est encore consomme : aucun changement visuel.

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 4 — Basculer la typographie

**Files:**
- Modify: `analyses.html` — ligne 12 (Google Fonts), 15 (`body`), 17 (`h1,h2,h3`), 72 (`skip-link`), 335, 370, 428 (`style:{fontFamily:...}` inline).

Vérifié : les trois familles sont servies par Google Fonts.
```bash
curl -s -A 'Mozilla/5.0' 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap' | grep -o "font-family: '[^']*'" | sort -u
```
Sortie mesurée : `font-family: 'Archivo'`, `font-family: 'IBM Plex Mono'`, `font-family: 'IBM Plex Sans'` — code HTTP `200`.

> On passe par Google Fonts et **pas** par `delta-v2/assets/fonts/font-NN.woff2`. Spec §4 : ces 14 fichiers ne peuvent pas être publiés tant que les licences OFL et l'identité de chaque fichier ne sont pas versionnées. Le prototype les utilise sous les alias `Archivo V2` / `IBM Plex Sans V2` / `IBM Plex Mono V2` (`prototypes/identity-v2/country-v2.css:1-24`) parce qu'il n'est pas publié. `analyses.html` l'est.

- [ ] Remplacer la ligne des polices.
  Avant :
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  ```
  Après :
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  ```
- [ ] Remplacer le `body`. (La couleur est traitée en Task 6 ; ici on ne touche que la famille, pour garder les commits lisibles — le `background`/`color` reste v1 une étape de plus.)
  Avant :
  ```css
  body{font-family:'Inter','Helvetica Neue',sans-serif;background:#FFFFFF;color:#1A1F2E;overflow-x:hidden}
  ```
  Après :
  ```css
  body{font-family:'IBM Plex Sans','Helvetica Neue',sans-serif;background:#FFFFFF;color:#1A1F2E;overflow-x:hidden}
  ```
- [ ] Remplacer les titres. Spec §4 : Archivo 800, approche serrée.
  Avant :
  ```css
  h1,h2,h3{font-family:'Libre Baskerville',Georgia,serif;font-weight:700;line-height:1.15;letter-spacing:-0.02em;color:#1A1F2E}
  ```
  Après :
  ```css
  h1,h2,h3{font-family:'Archivo',Arial,sans-serif;font-weight:800;line-height:1.1;letter-spacing:-0.035em;color:#1A1F2E}
  ```
- [ ] Remplacer les trois `fontFamily` inline. Ligne 335 (`<h1>` du hero) :
  Avant :
  ```js
  h('h1',{className:'anim-fade-up anim-d1 text-2xl sm:text-3xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight',style:{fontFamily:'Libre Baskerville, Georgia, serif'}},'Nos analyses'),
  ```
  Après :
  ```js
  h('h1',{className:'anim-fade-up anim-d1 text-2xl sm:text-3xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight'},'Nos analyses'),
  ```
  On supprime le `style` : la règle `h1,h2,h3` ci-dessus s'applique déjà et l'inline n'était qu'un doublon de Libre Baskerville. `font-bold` → `font-extrabold` pour rester sur la graisse 800 de la spec.
- [ ] Ligne 370 (`<h2>` Article du jour) :
  Avant :
  ```js
  h('h2',{className:'text-xl md:text-2xl font-bold text-[#1A1F2E] leading-snug mb-2',style:{fontFamily:'Libre Baskerville, Georgia, serif'}},article.titre),
  ```
  Après :
  ```js
  h('h2',{className:'text-xl md:text-2xl font-extrabold text-[#1A1F2E] leading-snug mb-2'},article.titre),
  ```
- [ ] Ligne 428 (`<h3>` titre de carte) :
  Avant :
  ```js
  h('h3',{className:'text-lg font-bold text-[#1A1F2E] leading-snug mb-3',style:{fontFamily:'Libre Baskerville, Georgia, serif'}},a.title),
  ```
  Après :
  ```js
  h('h3',{className:'text-lg font-extrabold text-[#1A1F2E] leading-snug mb-3'},a.title),
  ```
- [ ] Ligne 72, dans le `style` en dur du lien d'évitement, remplacer `font-family:Inter,sans-serif` par `font-family:'IBM Plex Sans',sans-serif`. Le reste du `style` et les deux handlers `onfocus`/`onblur` sont inchangés.
- [ ] Vérifier qu'aucune police v1 ne subsiste :
  ```bash
  grep -noE "Libre Baskerville|Inter'|JetBrains|Plus Jakarta" analyses.html
  ```
  Sortie attendue : aucune ligne.
- [ ] Recharger, onglet actif, après `document.fonts.ready`. Attendu : titres en Archivo 800 serré, corps en IBM Plex Sans, couleurs encore v1 (le hero est toujours emerald). Vérifier qu'aucun titre ne casse sur deux lignes à 360 px : Archivo est plus large que Libre Baskerville à taille égale.
- [ ] Commiter :
  ```bash
  git add analyses.html
  git commit -m "$(cat <<'EOF'
  feat(analyses): passer la typographie a Archivo / IBM Plex

  Spec section 4 : Archivo 800 pour les titres, IBM Plex Sans pour le corps,
  IBM Plex Mono pour les libelles. Les trois familles sont servies par Google
  Fonts et non par delta-v2/assets/fonts, dont les licences OFL ne sont pas
  encore versionnees (spec section 4).

  Les trois fontFamily inline doublonnaient la regle h1,h2,h3 : supprimes.
  Aucune couleur touchee dans ce commit.

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 5 — Chrome sombre achromatique

**Files:**
- Modify: `analyses.html` — lignes 25, 31, 33, 35, 72 (CSS et skip-link), puis 269, 270, 274, 279, 284, 295, 298, 303, 331, 334, 336 (nav + hero React), 465-499 (footer React).

Aucun `#E05A4E` ni aucun rouge n'entre dans le chrome (spec §2.1 et §7 : les états actifs de l'interface utilisent le noir/blanc). `--editorial-accent` est réservé à la Task 6, dans le corps.

### 5a — CSS du chrome

- [ ] Souligné de nav (l. 25).
  Avant :
  ```css
  .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:100%;height:2px;background:#006650;transform:scaleX(0);transition:transform .25s ease}
  ```
  Après :
  ```css
  .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:100%;height:2px;background:var(--chrome-text);transform:scaleX(0);transition:transform .25s ease}
  ```
- [ ] Survol des items du mega menu (l. 31). Le panneau du mega menu reste blanc (l. 280, `bg-white`) — c'est une surface flottante, pas du chrome sombre ; on l'aligne sur `--surface-raised` en Task 6. Ici, on désature seulement le survol.
  Avant :
  ```css
  .mega-item:hover{background:rgba(0,102,80,.06)}
  ```
  Après :
  ```css
  .mega-item:hover{background:rgba(16,18,20,.06)}
  ```
- [ ] Nav scrollée (l. 33). Elle passait du transparent au verre blanc ; le chrome v2 est sombre dans les deux états.
  Avant :
  ```css
  .nav-scrolled{background:rgba(255,255,255,.92);backdrop-filter:blur(16px);border-bottom:1px solid #E2E5EB;box-shadow:0 1px 8px rgba(0,0,0,.04)}
  ```
  Après :
  ```css
  .nav-scrolled{background:rgba(14,16,18,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(232,228,216,.14)}
  ```
  L'ombre disparaît : spec §5, « ombres rares et courtes, uniquement pour un état de survol ou une superposition ». Le filet de 1px suffit à séparer le chrome du papier.
- [ ] Hamburger (l. 35).
  Avant :
  ```css
  .hamburger span{display:block;width:24px;height:2px;background:#1A1F2E;margin:5px 0;transition:all .3s ease}
  ```
  Après :
  ```css
  .hamburger span{display:block;width:24px;height:2px;background:var(--chrome-text);margin:5px 0;transition:all .3s ease}
  ```
- [ ] Ajouter un focus visible — spec §7, « focus clavier visible, contraste minimal 3:1 pour le contour ». Aucune règle de focus n'existe aujourd'hui dans le fichier (`grep -c 'focus-visible' analyses.html` → `0`). Insérer juste après la règle `.hamburger span` :
  ```css
  :focus-visible{outline:2px solid var(--text-primary);outline-offset:2px}
  header :focus-visible,.mobile-overlay :focus-visible,.v2-chrome :focus-visible{outline-color:var(--chrome-text)}
  ```
  Contrastes mesurés : `#101214` sur `#EDEBE4` = 15,74:1 ; `#E8E4D8` sur `#0E1012` = 15,0:1.
- [ ] Lien d'évitement (l. 72) : dans son `style` en dur, remplacer `background:#006650;color:#fff` par `background:#0E1012;color:#E8E4D8`. Les jetons ne sont pas utilisables ici — c'est un attribut `style` sur un élément qui est frère de `<body>`… non : il est enfant de `<body>`, donc `var(--chrome-ground)` résoudrait. Utiliser les jetons :
  Avant (extrait) :
  ```
  padding:8px 16px;background:#006650;color:#fff;font-family:'IBM Plex Sans',sans-serif;
  ```
  Après :
  ```
  padding:8px 16px;background:var(--chrome-ground);color:var(--chrome-text);font-family:'IBM Plex Sans',sans-serif;
  ```

### 5b — Barre haute, header et logo

- [ ] Barre bronze (l. 269). Elle disparaît en tant qu'accent de marque mais **la hauteur de 3px est conservée** : le `<header>` est positionné à `top-[3px]` (l. 270) et le hero à `pt-28` (l. 331). Supprimer l'élément décalerait tout le chrome.
  Avant :
  ```js
  h('div',{className:'fixed top-0 left-0 right-0 z-[51] h-[3px] bg-[#C8955A]'}),
  ```
  Après :
  ```js
  h('div',{className:'fixed top-0 left-0 right-0 z-[51] h-[3px] bg-[#0E1012]'}),
  ```
  Ce `#C8955A`-ci est de la marque. Celui de la ligne 49 (`.category-matieres`) encode « Matières Premières » et n'est pas touché.
- [ ] Header (l. 270). L'état non scrollé reste transparent : le hero derrière lui est désormais `#0E1012`, la continuité est exacte.
  Avant :
  ```js
  h('header',{className:`fixed top-[3px] left-0 right-0 z-50 transition-all duration-300 ${scrolled?'nav-scrolled':'bg-transparent'}`},
  ```
  Après : **inchangé.** Le comportement est porté par `.nav-scrolled`, déjà migré en 5a.
- [ ] Logo (l. 274). Aujourd'hui le filtre blanchit le logo **seulement** quand la nav n'est pas scrollée, parce que la nav scrollée était blanche. Le chrome étant sombre dans les deux états, le logo doit rester blanc en permanence — sinon il devient invisible au scroll.
  Avant :
  ```js
  h('img',{src:'logo-header.png',alt:'Inflexion',className:'h-10 sm:h-[50px] md:h-[65px] w-auto',style:{filter:scrolled?'none':'brightness(10) saturate(0) invert(0)',transition:'filter 0.3s ease'}})
  ```
  Après :
  ```js
  h('img',{src:'logo-header.png',alt:'Inflexion',className:'h-10 sm:h-[50px] md:h-[65px] w-auto',style:{filter:'brightness(10) saturate(0)'}})
  ```
  `invert(0)` était un no-op ; la transition sur `filter` n'a plus d'objet puisque la valeur est constante. Après les éditions de cette tâche, la variable `scrolled` n'a plus qu'un seul consommateur : le `<header>` (l. 270, `${scrolled?'nav-scrolled':'bg-transparent'}`) — les liens et le hamburger deviennent inconditionnels. Ce consommateur suffit : ne pas supprimer le `useState`.
- [ ] Liens de nav (l. 279). Les deux branches deviennent identiques.
  Avant :
  ```js
  h('span',{className:`nav-link px-3 py-2 text-sm font-medium transition-colors cursor-default select-none ${scrolled?'text-gray-500 hover:text-[#006650]':'text-white/70 hover:text-white'}`},cat.label),
  ```
  Après :
  ```js
  h('span',{className:'nav-link px-3 py-2 text-sm font-medium transition-colors cursor-default select-none text-[#9AA0A4] hover:text-[#E8E4D8]'},cat.label),
  ```
  `#9AA0A4` sur `#0E1012` = 7,21:1 (mesuré). L'ancien `text-white/70` reposait sur une opacité, non mesurable de façon stable.
- [ ] Panneau du mega menu (l. 280). Angles droits, filet plutôt qu'ombre douce (spec §5). Une ombre courte est conservée : c'est une superposition, cas explicitement autorisé.
  Avant :
  ```js
  h('div',{className:'mega-menu bg-white rounded-2xl shadow-xl border border-gray-100 p-5'},
  ```
  Après :
  ```js
  h('div',{className:'mega-menu bg-[#FFFFFF] border border-[#4C5052] p-5 shadow-[0_6px_18px_rgba(14,16,18,.18)]'},
  ```
- [ ] Icône de mega menu (l. 284).
  Avant :
  ```js
  h('span',{className:'mega-icon bg-[#006650]/10 text-[#006650]'},item.icon),
  ```
  Après :
  ```js
  h('span',{className:'mega-icon bg-[#EDEBE4] text-[#101214]'},item.icon),
  ```
  Ajouter dans la règle `.mega-icon` (l. 32) : remplacer `border-radius:8px` par `border-radius:0` — spec §5, angles droits par défaut. Ligne complète après :
  ```css
  .mega-icon{width:36px;height:36px;border-radius:0;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px}
  ```
- [ ] Libellé et description des items (l. 286-287) : `text-gray-900` → `text-[#101214]`, `text-gray-500` → `text-[#4C5052]` (`#4C5052` sur blanc = 8,15:1, mesuré).
- [ ] CTA (l. 295). Sur chrome sombre, l'appel à l'action s'inverse ; il ne prend pas l'accent éditorial (spec §7).
  Avant :
  ```js
  h('a',{href:'premium.html',className:'ml-4 px-4 py-2 bg-[#006650] hover:bg-[#06402A] text-white font-semibold text-sm rounded-lg transition-colors'},'Réserver un diagnostic')
  ```
  Après :
  ```js
  h('a',{href:'premium.html',className:'ml-4 px-4 py-2 bg-[#E8E4D8] hover:bg-[#FFFFFF] text-[#0E1012] font-semibold text-sm transition-colors'},'Réserver un diagnostic')
  ```
- [ ] Hamburger React (l. 298) : les trois `style` conditionnels disparaissent, `.hamburger span` est déjà en `--chrome-text`.
  Avant :
  ```js
  h('span',{style:scrolled?{}:{background:'#fff'}}),h('span',{style:scrolled?{}:{background:'#fff'}}),h('span',{style:scrolled?{}:{background:'#fff'}})
  ```
  Après :
  ```js
  h('span'),h('span'),h('span')
  ```
- [ ] Overlay mobile (l. 303).
  Avant :
  ```js
  h('div',{className:`mobile-overlay fixed inset-0 z-[60] flex flex-col ${open?'open':''}`,style:{backgroundColor:'#006650'}},
  ```
  Après :
  ```js
  h('div',{className:`mobile-overlay fixed inset-0 z-[60] flex flex-col ${open?'open':''}`,style:{backgroundColor:'#0E1012'}},
  ```
  Les lignes 306, 312, 314, 322 (`bg-white/10`, `text-white/40`, `border-white/8`, `bg-white/10`) sont déjà achromatiques : inchangées. Seule exception, ligne 322, le bouton du bas passe en angles droits : `rounded-xl` → supprimé.

### 5c — Hero

- [ ] Fond du hero (l. 331).
  Avant :
  ```js
  return h('section',{className:'relative pt-28 pb-14 md:pt-36 md:pb-16',style:{backgroundColor:'#006650'}},
  ```
  Après :
  ```js
  return h('section',{className:'v2-chrome relative pt-28 pb-14 md:pt-36 md:pb-16',style:{backgroundColor:'#0E1012'}},
  ```
  La classe `v2-chrome` sert uniquement à la règle de focus de la 5a.
- [ ] Sur-titre (l. 334). C'est une métadonnée : IBM Plex Mono, approche large (spec §4).
  Avant :
  ```js
  h('p',{className:'anim-fade-up text-xs font-semibold uppercase tracking-wider text-[#33B894] mb-4'},'Décryptages & signaux faibles'),
  ```
  Après :
  ```js
  h('p',{className:'anim-fade-up text-[11px] uppercase tracking-[0.18em] text-[#9AA0A4] mb-4',style:{fontFamily:"'IBM Plex Mono',monospace"}},'Décryptages & signaux faibles'),
  ```
- [ ] Chapô (l. 336). `text-white/50` = ~7,4:1 sur `#0E1012` mais reste une opacité ; on fixe la valeur du jeton.
  Avant :
  ```js
  h('p',{className:'anim-fade-up anim-d2 mt-5 text-base md:text-lg text-white/50 leading-relaxed max-w-lg'},
  ```
  Après :
  ```js
  h('p',{className:'anim-fade-up anim-d2 mt-5 text-base md:text-lg text-[#9AA0A4] leading-relaxed max-w-lg'},
  ```

### 5d — Footer sombre

- [ ] Conteneur (l. 465).
  Avant :
  ```js
  return h('footer',{className:'border-t border-[#E2E5EB] bg-[#F7F8FA] pt-12 sm:pt-16 pb-24 sm:pb-20',role:'contentinfo'},
  ```
  Après :
  ```js
  return h('footer',{className:'v2-chrome bg-[#0E1012] pt-12 sm:pt-16 pb-24 sm:pb-20',role:'contentinfo'},
  ```
  Le filet supérieur disparaît : le papier `#EDEBE4` contre le chrome `#0E1012` se sépare seul (15,98:1).
- [ ] Logo du footer (l. 470) : ajouter le filtre de blanchiment, sinon le logo sombre disparaît sur le fond sombre.
  Avant :
  ```js
  h('img',{src:'logo-header.png',alt:'Inflexion',className:'h-10 w-auto'})
  ```
  Après :
  ```js
  h('img',{src:'logo-header.png',alt:'Inflexion',className:'h-10 w-auto',style:{filter:'brightness(10) saturate(0)'}})
  ```
- [ ] Baseline (l. 472), copyright (l. 496) : `text-[#5A6178]` → `text-[#9AA0A4]`.
- [ ] Titres de colonnes (l. 475, 483, 491) : `text-[#1A1F2E]` → `text-[#E8E4D8]`.
- [ ] Liens des colonnes (l. 478, 486, 492) : `text-[#5A6178] hover:text-[#006650]` → `text-[#9AA0A4] hover:text-[#E8E4D8]`. Trois occurrences, à traiter une par une.
- [ ] Filet de séparation (l. 495) : `border-t border-[#E2E5EB]` → `border-t border-[rgba(232,228,216,.14)]`.
- [ ] Liste des sources (l. 497) : `text-[#6B7280]` → `text-[#9AA0A4]`. Passer en IBM Plex Mono, ce sont des libellés de données (spec §4) : ajouter `style:{fontFamily:"'IBM Plex Mono',monospace"}`.
- [ ] Vérifier qu'aucun emerald/bronze de marque ne subsiste dans le chrome :
  ```bash
  sed -n '250,345p;445,505p' analyses.html | grep -noE '#006650|#06402A|#33B894|#C8955A|#F7F8FA|#1A1F2E|#5A6178|#E2E5EB|#6B7280|text-gray|bg-gray|border-gray'
  ```
  Sortie attendue : aucune ligne. (Les plages couvrent la nav, le hero et le footer ; la ligne 49 et le corps éditorial sont hors plage. La borne basse `445` — et non `460` — compense les ~12 lignes perdues par les tâches 2, 3 et 5a : sinon le haut du conteneur du footer, qui porte `bg-[#F7F8FA]` et `border-[#E2E5EB]`, échapperait au scan et donnerait un faux « propre ». Les lignes 445-450 ne contiennent que `footerLinks`/`sources`, sans couleur.)
- [ ] Vérifier que la ligne catégorielle est intacte :
  ```bash
  grep -n '^\.category-geo' analyses.html
  ```
  Sortie attendue, à l'octet près :
  ```
  .category-geo{background:#2563eb}.category-marches{background:#006650}.category-crypto{background:#f59e0b}.category-matieres{background:#C8955A}.category-iatech{background:#8b5cf6}
  ```
- [ ] Recharger, onglet actif, aux 4 largeurs. Contrôler : haut de page non scrollé (logo blanc lisible), page scrollée (logo **toujours** blanc, liens `#9AA0A4` lisibles sur le verre sombre — c'est la régression la plus probable de cette task), mega menu ouvert, overlay mobile à 360 px, footer. Tabuler du lien d'évitement jusqu'au CTA : le contour doit être visible en clair sur le chrome et en noir sur le papier.
- [ ] Commiter :
  ```bash
  git add analyses.html
  git commit -m "$(cat <<'EOF'
  feat(analyses): passer le chrome en sombre achromatique v2

  Nav, barre haute, mega menu, overlay mobile, hero et footer passent sur
  --chrome-ground / --chrome-text / --chrome-dim. La barre bronze de 3px devient
  #0E1012 : sa hauteur est conservee car le header est positionne a top-[3px].

  Le logo reste blanchi dans les deux etats de la nav : la nav scrollee n'est
  plus blanche, l'ancien filtre conditionnel l'aurait rendu invisible au scroll.

  Ajoute une regle :focus-visible : la page n'en avait aucune (spec section 7).
  Aucun rouge dans le chrome. La ligne .category-* est intacte.

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 6 — Corps éditorial sur papier

**Files:**
- Modify: `analyses.html` — lignes 15 (`body`), 17 (`h1,h2,h3`), 46-47 (`.article-card`), puis 361-382 (Article du jour), 398-440 (grille et filtres).

- [ ] Fond de page et texte (l. 15).
  Avant :
  ```css
  body{font-family:'IBM Plex Sans','Helvetica Neue',sans-serif;background:#FFFFFF;color:#1A1F2E;overflow-x:hidden}
  ```
  Après :
  ```css
  body{font-family:'IBM Plex Sans','Helvetica Neue',sans-serif;background:var(--surface-page);color:var(--text-primary);overflow-x:hidden}
  ```
- [ ] Couleur des titres (l. 17).
  Avant :
  ```css
  h1,h2,h3{font-family:'Archivo',Arial,sans-serif;font-weight:800;line-height:1.1;letter-spacing:-0.035em;color:#1A1F2E}
  ```
  Après :
  ```css
  h1,h2,h3{font-family:'Archivo',Arial,sans-serif;font-weight:800;line-height:1.1;letter-spacing:-0.035em;color:var(--text-primary)}
  ```
- [ ] Survol des cartes (l. 46-47). Le papier `#EDEBE4` et la carte `#FFFFFF` ne sont séparés que par **1,19:1** (mesuré) : le remplissage ne suffit pas, la carte doit porter un filet — c'est exactement la grammaire de la spec §5. Le survol conserve une ombre courte et achromatique, et gagne un filet d'accent : c'est le rôle nommé de `--editorial-accent`.
  Avant :
  ```css
  .article-card{transition:transform .2s ease,box-shadow .2s ease}
  .article-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(10,22,40,.08)}
  ```
  Après :
  ```css
  .article-card{position:relative;transition:box-shadow .18s ease,border-color .18s ease}
  .article-card::before{content:'';position:absolute;top:0;left:0;width:3px;height:100%;background:var(--editorial-accent);transform:scaleY(0);transform-origin:top;transition:transform .22s ease;z-index:1}
  .article-card:hover{box-shadow:0 6px 18px rgba(14,16,18,.10);border-color:var(--border-hairline)}
  .article-card:hover::before{transform:scaleY(1)}
  ```
  Le `translateY(-4px)` disparaît (spec §5 : la carte ne flotte pas). Le motif du filet reprend celui de `.featured-card` supprimé en Task 2 — il est réintroduit ici parce qu'il est enfin utilisé.
- [ ] Carte « Article du jour » (l. 361).
  Avant :
  ```js
  h('div',{className:'rounded-2xl border border-[#E2E5EB] bg-white overflow-hidden shadow-sm'},
  ```
  Après :
  ```js
  h('div',{className:'border border-[#4C5052] bg-[#FFFFFF] overflow-hidden'},
  ```
- [ ] Badge « Article du jour » (l. 364-365). C'est un **état d'interface** (fraîcheur), pas une donnée : achromatique (spec §7).
  Avant :
  ```js
  h('span',{className:'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006650]/10 text-[#006650] text-xs font-semibold uppercase tracking-wider'},
   h('span',{className:'w-2 h-2 rounded-full bg-[#006650] animate-pulse'}),
   'Article du jour'
  ),
  ```
  Après :
  ```js
  h('span',{className:'inline-flex items-center gap-1.5 px-3 py-1 bg-[#0E1012] text-[#E8E4D8] text-[11px] font-semibold uppercase tracking-[0.14em]',style:{fontFamily:"'IBM Plex Mono',monospace"}},
   h('span',{className:'w-2 h-2 rounded-full bg-[#E8E4D8] animate-pulse'}),
   'Article du jour'
  ),
  ```
  La pastille garde `rounded-full` — c'est un point, pas un conteneur. `animate-pulse` est conservé ; il ne dépend pas de la couleur et respecte `prefers-reduced-motion` via Tailwind ? **Non** : `animate-pulse` ne le respecte pas. Ajouter dans le `<style>`, après la règle `.article-card:hover::before` :
  ```css
  @media(prefers-reduced-motion:reduce){.animate-pulse{animation:none}}
  ```
- [ ] Date (l. 368), chapô (l. 371) : `text-[#5A6178]` → `text-[#4C5052]`.
- [ ] Points clés (l. 374-375) : `text-[#1A1F2E]` → `text-[#101214]` ; puce `bg-[#006650]` → `bg-[#101214]`.
- [ ] Tags (l. 382).
  Avant :
  ```js
  h('span',{key:i,className:'px-2.5 py-0.5 rounded-full bg-[#F7F8FA] text-[11px] font-medium text-[#5A6178] border border-[#E2E5EB]'},t)
  ```
  Après :
  ```js
  h('span',{key:i,className:'px-2.5 py-0.5 bg-[#EDEBE4] text-[11px] font-medium text-[#4C5052] border border-[rgba(76,80,82,.18)]'},t)
  ```
- [ ] Filtres (l. 404). L'état actif est un remplissage noir : 15,98:1 contre le papier. L'information ne repose ni sur la couleur seule ni sur le filet — chaque bouton porte son libellé.
  Avant :
  ```js
  h('button',{key:c.id,onClick:()=>setFilter(c.id),className:`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter===c.id?'bg-[#006650] text-white':'bg-[#F7F8FA] text-[#5A6178] hover:text-[#1A1F2E] border border-[#E2E5EB]'}`},c.label)
  ```
  Après :
  ```js
  h('button',{key:c.id,onClick:()=>setFilter(c.id),'aria-pressed':filter===c.id,className:`px-4 py-2 text-sm font-medium transition-colors border ${filter===c.id?'bg-[#0E1012] text-[#EDEBE4] border-[#0E1012]':'bg-[#FFFFFF] text-[#4C5052] hover:text-[#101214] border-[rgba(76,80,82,.18)]'}`},c.label)
  ```
  `aria-pressed` est ajouté : l'état sélectionné n'était annoncé que visuellement.
- [ ] Compteur (l. 409) : `text-[#5A6178]` → `text-[#4C5052]`, et passage en IBM Plex Mono — c'est une donnée : ajouter `style:{fontFamily:"'IBM Plex Mono',monospace"}`.
- [ ] Carte d'article (l. 418).
  Avant :
  ```js
  return h('a',{key:a.id,href:a.href,className:'article-card block rounded-xl overflow-hidden bg-white border border-[#E2E5EB] no-underline group'},
  ```
  Après :
  ```js
  return h('a',{key:a.id,href:a.href,className:'article-card block overflow-hidden bg-[#FFFFFF] border border-[rgba(76,80,82,.18)] no-underline group'},
  ```
- [ ] Badge de rubrique (l. 424) — **la seule ligne du corps où l'on ne change pas la couleur**. On retire seulement `rounded` (spec §5) et on passe en mono ; `cat.cls` reste tel quel et continue de porter `#2563eb`/`#006650`/`#f59e0b`/`#C8955A`/`#8b5cf6`.
  Avant :
  ```js
  h('span',{className:`${cat.cls} text-[10px] font-semibold uppercase tracking-wider text-white px-2 py-0.5 rounded`},cat.label),
  ```
  Après :
  ```js
  h('span',{className:`${cat.cls} text-[10px] font-semibold uppercase tracking-[0.12em] text-white px-2 py-0.5`,style:{fontFamily:"'IBM Plex Mono',monospace"}},cat.label),
  ```
- [ ] Métadonnées de carte (l. 425-426) : `text-[#5A6178]` → `text-[#4C5052]`, deux occurrences, plus IBM Plex Mono sur les deux (`style:{fontFamily:"'IBM Plex Mono',monospace"}`).
- [ ] Résumé (l. 429) : `text-[#5A6178]` → `text-[#4C5052]`.
- [ ] Source et lien de lecture (l. 431-432). C'est ici, et nulle part ailleurs, que `--editorial-accent` apparaît en texte.
  Avant :
  ```js
  h('span',{className:'text-xs text-[#6B7280] font-medium'},a.source),
  h('span',{className:'text-sm font-semibold text-[#006650] group-hover:text-[#008066] transition-colors'},'Lire →')
  ```
  Après :
  ```js
  h('span',{className:'text-xs text-[#4C5052] font-medium',style:{fontFamily:"'IBM Plex Mono',monospace"}},a.source),
  h('span',{className:'text-sm font-semibold text-[#8E2424] group-hover:underline'},'Lire →')
  ```
  `#8E2424` sur `#FFFFFF` = 8,65:1 (mesuré). Le survol passe du changement de teinte au soulignement : `#008066` était un jeton de la config Tailwind supprimée en Task 2 et n'avait plus de justification. `#E05A4E` est écarté : 3,66:1 sur blanc, sous le seuil AA de 4,5:1 pour du texte.
- [ ] État vide (l. 439) : `text-[#5A6178]` → `text-[#4C5052]`.
- [ ] Vérifier qu'il ne reste **que** les cinq hex catégoriels :
  ```bash
  grep -oiE '#[0-9a-f]{6}|#[0-9a-f]{3}\b' analyses.html | tr 'a-f' 'A-F' | sort | uniq -c | sort -rn
  ```
  Sortie attendue : uniquement `#0E1012`, `#E8E4D8`, `#9AA0A4`, `#EDEBE4`, `#FFFFFF`, `#101214`, `#4C5052`, `#8E2424`, plus les cinq de la ligne 49 (`#2563EB`, `#006650`, `#F59E0B`, `#C8955A`, `#8B5CF6`). Aucun `#06402A`, `#33B894`, `#F7F8FA`, `#1A1F2E`, `#5A6178`, `#E2E5EB`, `#ECEEF2`, `#6B7280`, `#008066`.
- [ ] Vérifier que les seuls emerald/bronze restants sont ceux de la ligne 49 :
  ```bash
  grep -n '#006650\|#C8955A' analyses.html
  ```
  Sortie attendue : **une seule ligne**, celle de `.category-geo{...}`.
- [ ] Vérifier qu'aucune classe de gris Tailwind ne subsiste :
  ```bash
  grep -noE 'text-gray-[0-9]+|bg-gray-[0-9]+|border-gray-[0-9]+|text-white/[0-9]+' analyses.html
  ```
  Sortie attendue : uniquement les `text-white/40` de l'overlay mobile (l. 312) — achromatiques et sur chrome, conservés volontairement.
- [ ] Commiter :
  ```bash
  git add analyses.html
  git commit -m "$(cat <<'EOF'
  feat(analyses): passer le corps editorial sur papier v2

  Fond --surface-page, modules --surface-raised, filets plutot que cartes
  flottantes, angles droits, metadonnees en IBM Plex Mono.

  --editorial-accent (#8E2424, 8,65:1 sur blanc) n'apparait qu'aux deux endroits
  qui portent son role nomme : le lien « Lire » et le filet de survol de carte.
  #E05A4E est ecarte : 3,66:1 sur blanc, sous le seuil AA texte.

  Les cinq couleurs de .category-* sont inchangees : elles encodent la rubrique,
  pas la marque. #006650 et #C8955A ne subsistent que sur cette ligne.

  Ajoute aria-pressed sur les filtres et une garde prefers-reduced-motion sur
  animate-pulse.

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 7 — QA

**Files:** aucun fichier modifié.

- [ ] Fonctionnel, onglet actif, à 1280 px : la grille affiche `14 analyses` ; chaque filtre affiche le bon compte (`Tout` 14, `IA & Tech` 2, `Géopolitique` 10, `Marchés` 2, `Crypto` 0, `Matières Premières` 0 — mesuré par `grep -oE "cat:'[a-z]+'" analyses.html | sort | uniq -c`) ; les deux catégories vides affichent bien « Aucune analyse dans cette catégorie pour le moment. » ; les 14 vignettes Unsplash se chargent ; les 14 `href` naviguent.
- [ ] Vérifier les 5 badges de rubrique à l'écran : bleu Géopolitique, vert Marchés, violet IA & Tech. Comparer aux captures de la Task 1 — **le pixel du badge doit être identique**. C'est le critère de non-régression du codage catégoriel.
- [ ] `scroll-reveal.js` : scroller lentement, chaque `section` doit apparaître. Si une section reste à `opacity:0`, l'onglet était en arrière-plan.
- [ ] Responsive à 360, 768, 1280, 1440 px : aucun débordement horizontal (`document.documentElement.scrollWidth <= window.innerWidth` en console), overlay mobile ouvrable et fermable à 360 px, cibles ≥ 44 px (la règle `@media(max-width:768px)` l. 63-68 est conservée intacte).
- [ ] Contraste — valeurs mesurées à re-vérifier au colorimètre sur la page rendue :
  | Paire | Ratio | Seuil |
  |---|---:|---|
  | `#101214` / `#EDEBE4` | 15,74:1 | AA texte |
  | `#4C5052` / `#FFFFFF` | 8,15:1 | AA texte |
  | `#4C5052` / `#EDEBE4` | 6,83:1 | AA texte |
  | `#E8E4D8` / `#0E1012` | 15,0:1 | AA texte |
  | `#9AA0A4` / `#0E1012` | 7,21:1 | AA texte |
  | `#8E2424` / `#FFFFFF` | 8,65:1 | AA texte |
- [ ] **Dette de contraste pré-existante, non corrigée par ce lot, à consigner** : les badges de rubrique en texte blanc sont à `2,15:1` pour Crypto (`#f59e0b`) et `2,66:1` pour Matières Premières (`#C8955A`) — sous AA. Ces deux valeurs sont identiques avant et après ce plan. Les corriger exige de changer une couleur catégorielle sur 13 fichiers : c'est une décision éditoriale, pas graphique. Ouvrir un ticket distinct, ne pas la traiter ici.
- [ ] Clavier, sans souris : `Tab` depuis le haut de page atteint le lien d'évitement, le logo, les 4 déclencheurs de mega menu, le CTA, les 6 filtres (activables à `Espace`/`Entrée`), les 14 cartes, les liens du footer. Contour visible à chaque étape.
- [ ] Console : aucune erreur. `data/article-du-jour.json` doit se comporter comme à la Task 1 — présent ou absent, mais pas différemment.
- [ ] Diff propre : `git diff --check` → aucune sortie.
- [ ] Vérifier qu'aucun fichier partagé n'a été touché :
  ```bash
  git diff --name-only main...HEAD
  ```
  Sortie attendue : `analyses.html` et `assets/design-tokens-v2.css`, et rien d'autre.

**Rollback :** `git revert` du commit de la Task 6, puis de la Task 5. Retirer `data-design-regime="editorial"` ne suffit pas : les hex v2 sont écrits en dur dans les `className` (Tailwind CDN n'accepte pas `text-[var(--x)]` de façon fiable). Les Tasks 2, 3 et 4 sont conservables indépendamment.

---

## Ce que ce plan laisse ouvert

1. **Le rouge éditorial n'est pas arbitré à l'échelle du site.** `--editorial-accent: #8E2424` est autorisé par la spec §2.2 parce que `analyses.html` ne rend aucun arbre Delta. Mais les 14 cartes pointent vers des articles qui, eux, contiendront des évaluations SEMPLICE — et le jour où un article embarque un arbre Delta, le rouge du lien « Lire → » de la page catalogue et le rouge d'horizon de l'article coexisteront à un clic d'intervalle. La spec ne tranche pas ce cas. À poser au Lot C avant de migrer les articles.
2. **La divergence assumée avec `index.html`.** Après ce lot, la page d'accueil garde son chrome emerald et sa barre bronze, `analyses.html` a un chrome noir. Le passage de l'une à l'autre sera visiblement cassé jusqu'au Lot D. Aucun mécanisme ici ne l'atténue.
3. **Le mega menu blanc sur chrome noir n'est pas une composition validée.** Le prototype ne couvre que `country.html` et `expertise.html` — deux pages instrument. Il n'existe **aucun prototype de page éditoriale v2**. Les choix de la Task 6 (carte blanche filetée sur papier, badge de statut noir, filtres à remplissage noir) sont dérivés de la spec, pas d'une maquette approuvée. Ils peuvent être rejetés en revue.
4. **Aucune vérification automatisée.** `scripts/` et `test/` ne sont pas matérialisés dans le cône de sparse-checkout courant (`git sparse-checkout list` → `data`). Il n'y a donc aucun endroit où brancher un test de contrat couleur pour cette page, et `package.json` racine n'a pas de bloc `scripts`. Toute la vérification de ce plan est du `grep` et de l'œil. Un test « la ligne `.category-*` contient exactement ces cinq hex » serait le premier filet utile ; il n'est pas dans ce plan parce qu'il implique de matérialiser un répertoire hors du cône.
5. **Le logo reste `logo-header.png` blanchi par un filtre CSS.** Spec §9, invariant 6 : logo, favicons, manifeste et image OG ne basculent qu'après validation de leurs variantes claire et sombre. `brightness(10) saturate(0)` est un pis-aller — il aplatit tout détail du logo. Le vrai SVG v3 est un livrable du Lot A.
6. **La suppression de la `tailwind.config` de cette page ne résout pas le problème des trois variantes.** Elle en retire un consommateur. Les 23 pages à `brand.900:'#06402A'`, les 9 à `'#006650'` et la rampe d'`analysis-template.html` restent divergentes. Ce plan mesure le problème pour cette page et démontre qu'il y était fantôme ; il ne peut rien affirmer des 31 autres.
7. **La barre de 3px survit à sa raison d'être.** Elle devient un aplat `#0E1012` invisible contre le header, conservé uniquement parce que `top-[3px]` et `pt-28` en dépendent. C'est de la dette, pas du design : à supprimer proprement au Lot D, quand le hero sera recalé.
