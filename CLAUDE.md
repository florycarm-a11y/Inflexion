# CLAUDE.md — Inflexion Guide Technique

## 0. Gestion du contexte

- **Ce fichier doit rester ≤ 2 000 tokens.** Ne jamais l'alourdir.
- Plan mode pour tout refactoring ou audit multi-fichiers ; sub-agents pour lectures de gros fichiers et grep exploratoires ; `/compact` à chaque point d'arrêt logique (préserver : chemins modifiés, erreurs, décisions, bug en cours) ; 1 session = 1 domaine.

## 1. Vue d'ensemble

**Inflexion** : plateforme d'intelligence financière automatisée (analyses géopolitiques + données de marché). Agrège **15 APIs**, **163 flux RSS** ; Claude Sonnet (briefing) + Claude Haiku (classification, alertes).
**Production** : https://inflexionhub.com/

## 2. Structure

- **32 pages HTML** à la racine : thématiques (geopolitics, markets, crypto, commodities, etf, ai-tech, premium…), `expertise.html` (#semplice), `country.html` (Radar Pays), `briefing.html`, `analyses.html`, articles `analyse-*.html`, pages légales.
- **JS racine** : `styles.css`, `nav-shared.js` + `nav-config.js` (nav injectée), `app.js`, `data-loader.js`, `image-catalog.js` (~120 images Unsplash, `matchImage()`), `semplice-zones-config.js`, `semplice-radar.js`, `semplice-country.js`.
- `data/` (JSON du pipeline + `semplice-zones.geojson` 17 zones), `scripts/` (pipeline Node), `bot/` (Polymarket, Python), `.github/workflows/`.
- Spécifications design détaillées : `DESIGN-MIGRATION-PROMPT.md`.

## 3. Design System (OBLIGATOIRE)

> **⚠ Identité v2 « chaude » — migration terminée sur les 31 pages (2026-07-25), mais PAS ENCORE DANS `main`.** Elle vit sur une chaîne de branches empilées : `feat/identity-v2-cohorte-b` (#136) → `feat/identity-v2-propagation` (#135) → `feat/identity-v2-home` (#134) → `main`. **Vérifier la branche avant de juger l'état d'une page.** Dans `main` : v2 « froide » (chrome achromatique `#0E1012`), polices déjà Archivo/IBM Plex. Spec : `docs/superpowers/specs/2026-07-16-identity-v2-design.md`.
>
> **Règle absolue : aucun chercher-remplacer global de couleur.** Six couleurs font double emploi — marque **et** donnée : `#006650`, `#33B894`, `#C8955A`, `#a7f3d0`, `#6b7280`, `#D1FAE5`. Remplacer `#006650` recolorerait le palier « risque faible », le palier « opportunité élevée » et l'indicateur O/R ≥ 1. Séparer le sens de l'identité **avant** de toucher à la palette.
>
> **Aucun correctif global n'est possible sur les 13 pages articles** (11 `analyse-*.html` React, `analysis-template.html`, `artifact-inflexion.html`) : chacune embarque son propre `<style>` et son propre arbre React. Traiter page par page. Auditer une couleur **par dominante de teinte sur tous les hex**, jamais par liste : les badges de catégorie des heros sont codés en dur (`bg-[#2563eb]`…), pas via `.category-*`.

**Source de vérité couleurs : `assets/design-tokens-v2.css`** (régime `editorial`), consommé via `<body data-design-regime="editorial">`. Source de vérité visuelle : `index.html` (home) et `analyses.html` (pages React).

### Palette v2 chaude — IDENTITÉ

Chrome espresso `#17100E` · rouge éditorial `#8E2424` (topbar, filets, hover, CTA) · rouge sur fond sombre `#E05A4E` · brun crédibilité `#42301E` · papier `#EDEBE4` / surface `#FFFFFF` · text `#101214` / secondary `#4C5052` · badges `#EAE1D4` fond + `#8E2424` lettres. **Angles : rayon 0.**

**Typo** : Archivo 800 (titres), IBM Plex Sans (corps), IBM Plex Mono (données).
**Emerald = DONNÉE uniquement** : scores SEMPLICE, badges de palier (`CRITIQUE`, `OPPORTUNITÉ`, `NEUTRE`…), échelles de scénario. Jamais du chrome.
**Couleurs interdites (anciennes)** : `#0B3D1E`, `#072A14`, `#14713A`, `#EDE8DC`, `#C41E3A`, `#8CBF9E`, `#1B6B4A`, `#155A3D`, `#0A1628`, `#0F2035`, `#162A45`, `Plus Jakarta Sans`. **Périmées comme identité** (encore valides comme donnée) : `#006650`, `Libre Baskerville`, `Inter`, `JetBrains Mono`, `#F7F8FA`, `#1A1F2E`, `#E2E5EB`.

### Architecture réelle des pages

**Tailwind CDN + `tailwind.config` inline sont sur les 32 pages** : ce n'est pas un discriminant. Le critère est `nav-shared.js` + `styles.css` (legacy) vs runtime React.

- **Legacy — 16 pages** : thématiques, légales, `expertise`, `country`, `a-propos`, `ai-tech`, et **3 articles** (`analyse-droits-douane-trump-groenland`, `analyse-ia-rempart-marches`, `analyse-or-bitcoin-divergence`).
- **React — 12 pages** : `index`, `analyses`, `analysis-template`, `artifact-inflexion`, + 8 `analyse-*`.
- **Hybride** : `briefing.html` (React + `styles.css`, sans nav-shared). **Ni l'un ni l'autre** : `og-image.html`.

`styles.css` contient **226 hex en dur** qui contournent ses variables `:root`, et il existe **3 variantes divergentes** du `tailwind.config` inline. Sur les articles React, le bloc `colors` de ce `tailwind.config` est **du code mort** (aucun utilitaire `brand-*`/`cool-*` n'est utilisé) : ne pas y toucher, seul `fontFamily` agit.

**Piège de spécificité** : `.prose strong` (0,1,1) écrase les classes Tailwind `text-[#…]` (0,1,0). Un score coloré dans un `<strong>` ne s'affiche pas — comportement d'origine, pas une régression de la migration.

### Articles d'analyse — coquille mutualisée (juillet 2026)

**4 articles** (`ukraine`, `turquie`, `sahel`, `mer-chine`) sont refondus au format **« dossier à deux temps »** : page de garde (verdict SEMPLICE, scénarios dont la **largeur porte la probabilité**, chiffres clés) → corps avec **rail de progression** et **gouttière de sources** en marge → **appareil critique** puis CTA. Gabarit : `analysis-template.html`.

- `assets/article-shell.js` — coquille React partagée (`Navigation`, `Cover`, `Section`, `SousTitre`, `P`, `Body`, `Apparatus`, `Footer`, `renderArticle`). **Elle sert plusieurs articles : ne jamais l'ajuster pour un cas particulier.**
- `assets/article-model.js` — logique pure, testée. **`npm test`** (30 tests) : premier harness front du dépôt, `node --test 'test/**/*.test.mjs'` (le glob quoté est obligatoire sous Node 25).
- Un article converti ne porte plus que son objet `ARTICLE` + son corps en `Section`/`P` + `renderArticle`. Les sources vivent dans la prop `sources` des paragraphes, **plus dans le texte**.
- **Tout ce qui varie d'un article à l'autre doit venir de `ARTICLE`, jamais du squelette** : horizon des scénarios (`horizonScenarios`), séparateur décimal (`separateurDecimal`), couleur des paliers de matrice (`matrice[].style`). Trois régressions ont été causées par des valeurs écrites en dur — dont un horizon faux affiché en ligne et une échelle de gravité décalée.
- **`Section` porte le romain RÉEL de l'article** (`romain:'III'`), pas son rang dans le tableau ; `null` pour les sections jamais numérotées. Renuméroter casserait les citations existantes.
- Les 7 autres articles restent à l'ancienne structure (voir le tableau §SEMPLICE) : ils n'ont pas la matière du format.

### SEMPLICE — Cadre d'évaluation géopolitique

- **Référence** : `expertise.html#semplice` (radar Canvas dual Risk/Opportunité/Combiné, scoreboard, comparaison de 8 cadres).
- **Framework v3** : 8 dimensions (S, E, M, P, L, I, C, Ee), **scores 1-7**. Depuis v3, **I = Intelligence artificielle** (ex-Information). Dimensions exclusives vs PESTEL/SWOT : IA et Cyber.
- **18 zones** évaluées — source unique `semplice-zones-config.js`, chargé par `expertise.html` **et** `country.html` (le modifier affecte les deux). **Dépend de `semplice-composite.js`, à charger avant lui** : les composites sont **calculés, jamais stockés**.
- **Moteur de calcul** : `semplice-composite.js` (source unique des poids v3 et du composite).
- **Backtests** : v2.0 (`data/semplice/backtests-v2.md`), 12 crises, 12/12 détections — référence historique. Complément v3 (`backtests-v3.md`) : 3 cas ciblés dimension IA, sans rejeu des 12 (décision 2026-07-06).
- **Grilles v3** : `data/semplice/grille-scoring-quantitative-v3.md` (102 risque + 6 résilience, 60 % quanti / 40 % quali) + `grille-scoring-opportunite-v3.md` (70). `grille-scoring-quantitative.md` (sans suffixe) est **périmée**.
- **Radar Pays** (`country.html`) : Leaflet (CartoDB Positron) + scatter risque/opportunité + tableau triable + mini radars Canvas.
- **GeoJSON** : `data/semplice-zones.geojson`, **17 features** (et non 18 : l'Inde n'a pas de polygone, évaluation infra-nationale Tamil Nadu). Zone IDs alignés entre `ZONES[].id` et `properties.zone`.
- **Règle éditoriale** : toute **nouvelle** analyse inclut une évaluation SEMPLICE (8 dimensions **sur /7**, scores + scénarios), ajoutée au scoreboard (`expertise.html`) et au catalogue (`analyses.html`).
- **⚠ Le corpus existant ne respecte PAS cette règle** (relevé 2026-07-30, mesuré sur les 11 articles React) :

| Structure | Articles | Conséquence |
|---|---|---|
| SEMPLICE **/7** + 3 scénarios | `ukraine`, `turquie`, `sahel`, `mer-chine` | seuls convertibles au format « dossier » |
| SEMPLICE /7, **aucun scénario** | `madagascar` | — |
| SEMPLICE **/5** (pré-v3) | `cuba` (4,3/5), `arctique` (3,1/5) | scores dans une unité que le site n'emploie plus |
| **Aucun tableau dimensionnel** | `fta-ue-inde`, `petrole-ormuz`, `corridor-defense`, `cloud-ia` | — |

  Ne jamais présumer qu'un article porte une évaluation SEMPLICE : **le vérifier dans le fichier**. Ne jamais convertir un article en fabriquant les scores manquants. Les deux articles en /5 ne sont pas comparables aux autres tant qu'ils n'ont pas été réévalués.
- Le séparateur décimal des scores diffère selon les articles (point pour `ukraine`/`turquie`/`sahel`, virgule pour `mer-chine`) : le respecter, ne pas uniformiser d'office.

## 4. Navigation

Mega menu desktop (monogrammes, CTA « Réserver un diagnostic ») ; mobile : overlay plein écran emerald. `nav-shared.js` remplace header/nav/footer sur les pages legacy ; source des entrées : `nav-config.js`.

## 5. Pipeline de données

GitHub Actions (cron 2×/jour 06h+18h UTC) : `fetch-data.mjs` → `insight-filter.mjs` (Haiku, scoring 1-10, seuil ≥6) → `veille-continue.mjs` (watchlist 22 thèmes + signaux faibles) → `generate-article.mjs` → `validate-article.mjs` → `data/*.json` → GitHub Pages. Briefing : Sonnet + RAG. Sorties : `insights.json`, `signals.json`, `signals-history.json`.

## 6. Bot Polymarket (`bot/`)

Python, Signal Engine v2, intelligence SEMPLICE, Kelly/2. Gamma API : DNS bypass DoH, camelCase. Commandes : `python bot/main.py --mock | --local | --backtest | --compare | --scan | --watch | --live`. Tests : `python -m pytest bot/test_bot.py` (102). Détail : docstrings de `bot/`.

## 7. APIs (15)

**Avec clé** : Finnhub, GNews, FRED, Alpha Vantage, Messari, Twelve Data, NewsAPI. **Sans clé** : CoinGecko, Alternative.me, DefiLlama, metals.dev, Etherscan, Mempool.space, ECB Data, World Bank.

## 8. Commandes & environnement

> **Sparse-checkout actif** (`git sparse-checkout list` → `data`) : `scripts/`, `bot/`, `.github/`, `docs/` **existent dans le dépôt mais pas forcément sur le disque**. Matérialiser avec `git sparse-checkout add <chemin>` ; leur absence n'est pas une suppression.

```bash
python3 -m http.server 4399                        # Serveur local
node scripts/fetch-data.mjs                        # Pipeline données
node scripts/generate-daily-briefing.mjs --dry-run # Test briefing
python bot/main.py --mock                          # Bot (simulation)
```

### Tests — ce qui existe vraiment

- **Front-end : aucun test, aucune CI.** Pas de bloc `scripts` dans `package.json` racine (`npm test` échoue). `ci.yml` ne couvre que `backend/` et ne se déclenche pas sur les branches `codex/*`. **Vérification visuelle manuelle obligatoire.**
- Les scripts navigateur en globales `var` se chargent dans `node:vm` : testables sans dépendance.
- Node 25 : `node --test <dir>` échoue — utiliser `node --test 'test/**/*.test.mjs'`.
- Canvas non dessinés en onglet d'arrière-plan (`requestAnimationFrame` suspendu) : vérifier **onglet actif**.

## 9. Règles importantes

- Pas de Markdown brut dans le HTML (`<strong>`, `<em>`…).
- Pas de conseil en investissement : disclaimer AMF obligatoire.
- ETF vs indices : Finnhub retourne des prix ETF (SPY, QQQ), pas des niveaux d'indice.
- Anti-redondance briefing : chaque donnée chiffrée une seule fois ; chaque donnée porte une attribution.
- Mots-clés courts (≤4 car.) : `\b` dans les regex, pas `includes()`.
- Design : vérifier la cohérence avec `index.html` **et** l'encart identité v2 (§3) avant de modifier une page.

## 10. Claude Code Routines (pipeline IA)

4 Routines (Master, Inspector, Newsletter, SEMPLICE Validator) orchestrent briefing/article/veille — quota 15/jour, prompts dans `.routines/*.md`, scripts `.mjs` conservés en fallback. Spec : `docs/superpowers/specs/2026-04-23-routines-migration-design.md` ; plan : `docs/superpowers/plans/2026-04-23-routines-migration.md` ; rollback : décommenter `on: schedule:` dans les workflows `generate-*.yml` puis désactiver les Routines sur claude.ai/code.
