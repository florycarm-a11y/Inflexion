# Tailwind compilé — remplacer le Play CDN par `assets/site.css`

Date : 2026-11-15. Statut : réalisé le 2026-11-15 sur la branche `feat/tailwind-compile` (résultats mesurés dans le plan, Tasks 2 et 7).

## 1. Objet

Aujourd'hui, chacune des 32 pages du site charge `https://cdn.tailwindcss.com` : le visiteur télécharge le compilateur Tailwind (126 Ko), l'exécute, puis seulement voit la page. La documentation de Tailwind réserve ce script au développement. Ce chantier remplace ce script par un fichier CSS fixe, `assets/site.css`, compilé une fois par l'outil en ligne de commande de Tailwind v3, et retire tout ce qui ne servait qu'au CDN (les blocs `tailwind.config` inline).

Origine : audit Inflexion × Starlink du 13 novembre 2026, section 7.1 (niveau « rapide ») et prompt 2 de la section 10. Le niveau « complet » de 7.1 (passer la home sous Vite ou Astro) reste un chantier de l'étape 3, hors périmètre.

Critère de fin : les 32 pages chargent `assets/site.css`, plus aucune référence à `cdn.tailwindcss.com`, le build tourne dans le déploiement GitHub Pages, `npm test` au vert, aucune différence visuelle entre avant et après.

## 2. Ce que le cadrage a établi

Mesures faites sur `main` (commit `7ea1d5ab`) avant toute modification.

| Question | Constat |
| --- | --- |
| Pages concernées | 32 pages chargent le CDN. Seule `og-image.html` ne le charge pas : elle n'est pas touchée. |
| Où le CDN place sa feuille | En **dernier enfant statique du `<head>`**, c'est-à-dire après le `<style>` de la page, après `styles.css` et `assets/design-tokens-v2.css`, mais avant les `<style>` que le JavaScript injecte ensuite (`nav-shared.js`, etc.). Vérifié dans le navigateur sur `index.html` (React) et `commodities.html` (legacy). |
| Blocs `tailwind.config` inline | 30 pages en ont un (toutes sauf `index.html`, `analyses.html`, `og-image.html`). Ce sont **5 variantes**, pas 3 : elles diffèrent par les nuances `brand-*`/`navy-*` et par `fontFamily` (Archivo/Plex ou Baskerville/Inter/JetBrains). |
| Ce qui sert vraiment dans ces configs | **Rien.** Aucun utilitaire `brand-*`, `cool-*`, `navy-*`, `font-display` ni `font-body` n'est employé dans les 32 pages ni dans les JS. Seul `font-data` l'est (77 occurrences), et chaque page qui l'emploie définit aussi sa propre classe `.font-data` dans son `<style>`, avec la même police que sa config (`IBM Plex Mono` partout, `JetBrains Mono` sur `briefing.html`). |
| Classes construites à l'exécution | Toutes les interpolations (`${open?'open':''}`, `anim-d${i+2}`, `category-${a.cat}`, `${bg}`, `tabCls(...)`) assemblent des classes **maison** ou des chaînes Tailwind écrites **en entier** dans le fichier. Le scanner de Tailwind, qui lit le texte des fichiers, les trouve toutes. |
| Fichiers qui portent des classes Tailwind | Les `*.html` racine, les `*.js` racine (`nav-shared.js` injecte l'en-tête) et **`assets/article-shell.js`** (coquille React des 4 dossiers). Le glob `["./*.html", "./*.js"]` du prompt oublie `assets/`. Aucune classe dans `data/*.json`. |
| Le `<style>` de `index.html` | 5,3 Ko, 50 sélecteurs. **15 autres pages définissent les mêmes sélecteurs avec d'autres valeurs** : `.mega-menu`, `.mega-icon`, `h1,h2,h3`, `.hero-glow`, `.article-card:hover`, `.mobile-overlay`, `.anim-fade-up`, `.nav-link::after`. Mis dans une feuille partagée chargée en dernier, le CSS de la home écraserait ces pages. |
| Directives Tailwind dans les pages | Aucun `<style type="text/tailwindcss">`, aucun `@apply`, aucune classe `dark:`. |
| Génération d'articles | Ni `scripts/generate-article.mjs` ni les prompts `.routines/*.md` n'écrivent de `<head>` : aucun gabarit à mettre à jour. |
| CI | `npm ci` sous Node 22 tourne déjà dans 4 workflows (`fetch-data`, `generate-article`, `generate-newsletter`, `generate-unified-briefing`) : l'installation des dépendances racine est éprouvée sur `ubuntu-latest`. |

## 3. Décisions

| Question | Décision | Pourquoi |
| --- | --- | --- |
| Version | `tailwindcss@3.4.19` en `devDependencies`, épinglée (`3.4.19` sans `^`). | Le CDN sert Tailwind 3 ; v4 change la configuration et la syntaxe. Épingler garantit le même CSS sur la machine et en CI. |
| `tailwind.config.js` | `content: ["./*.html", "./*.js", "./assets/*.js"]`, `theme: { extend: {} }`, aucun plugin. | `assets/article-shell.js` porte des classes. Les thèmes inline sont du code mort (§2) : les reprendre figerait cinq palettes périmées dans un fichier de référence. |
| `font-data` | Pas d'utilitaire `font-data` généré. | Chaque page a sa classe `.font-data` dans son `<style>`, identique à ce que son config produisait. Un utilitaire unique imposerait `IBM Plex Mono` à `briefing.html`, qui ne charge pas cette police. |
| `src/input.css` | Les trois directives `@tailwind` et rien d'autre. | Voir la ligne suivante. |
| Le `<style>` de `index.html` | **Reste dans la page.** Écart assumé avec la lettre du prompt 2. | 15 pages définissent les mêmes sélecteurs autrement (§2). Le déplacer dans `site.css` produirait des régressions sur ces pages. Mutualiser le CSS commun des pages est le travail du prompt 3 (typographie et couleurs), qui touchera ces règles de toute façon. |
| Emplacement du `<link>` | `<link rel="stylesheet" href="assets/site.css">` placé en **dernier élément du `<head>`**, pas à la place du `<script>` du CDN. | C'est là que le CDN plaçait sa feuille. Toute autre position change l'ordre de cascade entre les utilitaires, le reset Tailwind (preflight) et `styles.css` : à spécificité égale, c'est la dernière règle qui gagne. |
| Blocs `tailwind.config` inline | Supprimés sur les 30 pages, avec leur `<script>`. | Sans le CDN, `tailwind` n'existe plus : `tailwind.config = …` lèverait une `ReferenceError`. Ils ne configuraient rien d'utilisé. |
| `assets/site.css` | **Commité** dans le dépôt, et **reconstruit** par le déploiement. | Commité : la prévisualisation locale (`python3 -m http.server`) et un clone nu fonctionnent sans étape de build. Reconstruit en CI : un article généré par le pipeline peut introduire une classe nouvelle ; le déploiement, déclenché après ces pipelines, la compile. |
| Script npm | `"build:css": "tailwindcss -i src/input.css -o assets/site.css --minify"`. | Tel que demandé. `--minify` : une dizaine de Ko attendue, contre 126 Ko de compilateur aujourd'hui. |
| Déploiement | Dans `deploy-pages.yml`, avant la copie vers `_site` : `actions/setup-node@v4` (Node 22, cache npm), `npm ci`, `npm run build:css`. Les chemins déclencheurs gagnent `src/**`, `tailwind.config.js`, `package.json`, `package-lock.json`. | Même recette que les 4 workflows existants. |
| Test automatisé | Nouveau `test/site-css.test.mjs`. | Voir §5. |
| `CLAUDE.md` | Les deux phrases de la section 3 qui décrivent le CDN et les variantes de `tailwind.config` sont réécrites, sans faire grossir le fichier (il est déjà à la limite). | Le guide décrit l'architecture réelle ; elle change. |
| `og-image.html` | Non touchée. | Ne charge pas le CDN. |

## 4. Architecture après le chantier

```
package.json            + devDependencies.tailwindcss 3.4.19, + scripts.build:css
tailwind.config.js      content + theme vide
src/input.css           @tailwind base; @tailwind components; @tailwind utilities;
assets/site.css         sortie minifiée, commitée
test/site-css.test.mjs  garde-fous (§5)
.github/workflows/deploy-pages.yml   build avant copie
32 pages HTML           - <script src="https://cdn.tailwindcss.com">
                        - <script>tailwind.config={…}</script>   (30 pages)
                        + <link rel="stylesheet" href="assets/site.css">  en fin de <head>
CLAUDE.md               §3 mise à jour
```

Rien d'autre ne bouge : ni `styles.css`, ni `assets/design-tokens-v2.css`, ni les `<style>` des pages, ni aucune classe dans le balisage.

## 5. Vérification

### 5.1 Couverture des classes (automatisée, une fois)

Avant toute modification, le CSS que le CDN génère réellement a été enregistré pour chaque page, à 1440 px et à 390 px, menu mobile ouvert puis fermé (66 fichiers, hors dépôt). Après compilation, chaque sélecteur de ces fichiers doit exister dans `assets/site.css`. Un sélecteur manquant est une classe que le scanner n'a pas vue : on corrige `content` ou on documente l'exception, jamais de `safelist` ajoutée à l'aveugle.

### 5.2 Comparaison visuelle (automatisée, une fois)

Les 33 pages ont été photographiées en pleine hauteur avant modification, à 1440 px et à 390 px, par Chrome sans fenêtre (animations gelées, défilement complet pour déclencher les apparitions). Les mêmes captures sont refaites après, et comparées pixel à pixel. Attendu : zéro différence, aux contenus dynamiques près (flux de sources, carte Leaflet, images distantes), dont chaque écart est expliqué dans le compte rendu. Outils dans le dossier de notes partagé des sessions, réutilisables pour les prompts 3 à 5.

### 5.3 Garde-fous permanents (`npm test`)

`test/site-css.test.mjs`, sans dépendance, exécuté par le harness existant :

1. aucune page racine ne contient `cdn.tailwindcss.com` ni `tailwind.config` ;
2. chaque page racine sauf `og-image.html` contient un `<link rel="stylesheet" href="assets/site.css">`, et c'est le dernier élément du `<head>` ;
3. `assets/site.css` existe, n'est pas vide, et contient le sélecteur de chaque classe **à valeur arbitraire** (`text-[#C6A996]`, `bg-[var(--editorial-accent)]`, `aspect-[5/3]`, `z-[60]`, avec leurs variantes `hover:`, `md:`…) relevée dans les pages et les JS scannés. C'est la vérification demandée par le prompt, rendue permanente : elle détecte un `content` incomplet et un `site.css` non reconstruit après l'ajout d'une classe.

Le test 3 ne reconstruit pas le CSS (pas de `node_modules` requis pour `npm test`) ; il lit le fichier commité.

### 5.4 Vérification manuelle

Dans le navigateur, sur le serveur local : home, une page legacy (`commodities.html`), `expertise.html` (radars Canvas, onglet actif), `country.html` (Leaflet), un dossier (`analyse-ukraine-…`), `briefing.html`. Console sans erreur, en particulier aucune `ReferenceError: tailwind`.

## 6. Hors périmètre

- Mutualiser le CSS répété dans les `<style>` des pages (prompt 3).
- Héberger les polices, `preconnect` (ligne « Polices » de l'étape 2 du plan d'action).
- Vite ou Astro, HTML pré-rempli (étape 3).
- Toucher aux 226 hex de `styles.css` ou à la moindre couleur.
