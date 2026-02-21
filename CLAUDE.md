# CLAUDE.md — Inflexion Architecture & Guide Technique

## 1. Vue d'ensemble

**Inflexion** est une plateforme d'intelligence financiere automatisee combinant analyses geopolitiques et donnees de marche en temps reel. Le systeme agrege **15 APIs**, **122 flux RSS** et utilise **Claude Sonnet** (briefing strategique) + **Claude Haiku** (classification, alertes) pour generer des syntheses IA quotidiennes.

**URL de production** : https://florycarm-a11y.github.io/Inflexion/

## 2. Architecture technique

```
Inflexion/
├── index.html              # Page principale (widgets, sidebar, news)
├── analysis.html           # Page analyses approfondies
├── commodities.html        # Page matieres premieres
├── crypto.html             # Page crypto & blockchain
├── etf.html                # Page ETF & fonds
├── geopolitics.html        # Page geopolitique
├── markets.html            # Page marches & finance
├── premium.html            # Page services premium (roadmap monetisation)
├── styles.css              # CSS complet (design vert, responsive)
├── app.js                  # Logique JS principale + donnees statiques fallback
├── data-loader.js          # Charge les JSON dynamiques → met a jour le DOM
├── api-client.js           # Client API frontend
├── supabase-client.js      # Client Supabase (backend optionnel)
├── data/                   # Fichiers JSON generes par le pipeline
│   ├── crypto.json          # CoinGecko: prix, trending, stablecoins
│   ├── markets.json         # Finnhub: indices US, forex, calendrier eco
│   ├── european-markets.json # Twelve Data: CAC 40, DAX, FTSE, Euro Stoxx 50
│   ├── news.json            # GNews + RSS: actualites multi-categories
│   ├── newsapi.json         # NewsAPI: actualites complementaires EN
│   ├── rss-feeds.json       # Suivi des 97 flux RSS
│   ├── macro.json           # FRED: 10 indicateurs macro US
│   ├── global-macro.json    # ECB + VIX: taux BCE, EUR/USD, volatilite
│   ├── world-bank.json      # World Bank: PIB, inflation, chomage, dette (10 pays)
│   ├── fear-greed.json      # Alternative.me: indice peur/avidite crypto
│   ├── alpha-vantage.json   # Alpha Vantage: forex, secteurs, top movers
│   ├── defi.json            # DefiLlama: TVL, protocoles, yields
│   ├── messari.json         # Messari: crypto avance, dominance, metriques
│   ├── chart-gold-btc.json  # CoinGecko: historique or vs BTC 90j
│   ├── commodities.json     # metals.dev: metaux precieux & industriels
│   ├── onchain.json         # Etherscan + Mempool: gas ETH, fees BTC, hashrate
│   ├── sentiment.json       # Claude IA: analyse de sentiment
│   ├── alerts.json          # Claude IA: alertes marche
│   ├── newsletter.json      # Claude IA: newsletter quotidienne
│   ├── macro-analysis.json  # Claude IA: analyse macro
│   ├── market-briefing.json # Claude IA: briefing marche
│   └── _meta.json           # Metadonnees du pipeline
├── scripts/
│   ├── fetch-data.mjs       # Pipeline principal (15 APIs + 97 RSS)
│   ├── analyze-sentiment.mjs # Analyse de sentiment (Claude Haiku)
│   ├── generate-article.mjs  # Article du jour (Claude Haiku)
│   ├── generate-alerts.mjs   # Alertes marche (Claude Haiku)
│   ├── generate-newsletter.mjs # Newsletter (Claude Haiku)
│   ├── generate-macro-analysis.mjs # Analyse macro (Claude Haiku)
│   ├── generate-market-briefing.mjs # Briefing marche (Claude Haiku)
│   ├── translate-articles.mjs # Traduction EN→FR
│   ├── check-french.py       # Verification qualite francais
│   ├── lib/                   # Modules partages
│   └── tests/                 # Tests unitaires (35 tests)
├── backend/                   # Backend Node.js (optionnel)
│   └── .env.example           # Template variables d'environnement
├── .github/workflows/
│   ├── fetch-data.yml         # Cron 6h: recuperation donnees
│   ├── generate-article.yml   # Cron quotidien: article IA
│   ├── analyze-sentiment.yml  # Cron: analyse sentiment
│   ├── generate-newsletter.yml # Cron: newsletter
│   ├── deploy-pages.yml       # Deploy GitHub Pages
│   ├── ci.yml                 # Tests CI
│   └── check-french.yml       # Verification francais
└── package.json
```

## 3. Pipeline de donnees

### Flux principal
```
GitHub Actions (cron toutes les 6h)
    ↓
scripts/fetch-data.mjs
    ├── 15 APIs temps reel
    ├── 97 flux RSS (5 sec delai entre chaque)
    └── Deduplication + tri par date
    ↓
data/*.json (commites automatiquement)
    ↓
GitHub Pages (deploiement auto)
    ↓
data-loader.js (frontend)
    ├── Charge tous les JSON en parallele
    ├── Met a jour le DOM (widgets, news, graphiques)
    └── Fallback vers app.js si JSON indisponibles
```

### Flux IA (Claude Haiku + Sonnet)
```
GitHub Actions (cron quotidien)
    ↓
scripts/generate-daily-briefing.mjs → data/daily-briefing.json  (Claude Sonnet — briefing strategique)
scripts/generate-article.mjs     → data/article-du-jour.json    (Claude Haiku — article synthese)
scripts/analyze-sentiment.mjs    → data/sentiment.json           (Claude Haiku — sentiment)
scripts/generate-alerts.mjs      → data/alerts.json              (Claude Haiku — alertes)
scripts/generate-newsletter.mjs  → data/newsletter.json          (Claude Haiku — newsletter)
scripts/generate-macro-analysis.mjs → data/macro-analysis.json   (Claude Haiku — macro)
scripts/generate-market-briefing.mjs → data/market-briefing.json (Claude Haiku — briefing marche)
```

## 4. Sources API (15)

### Avec cle API (7)
| API | Cle env | Tier | Limite | Donnees |
|-----|---------|------|--------|---------|
| Finnhub | `FINNHUB_API_KEY` | Gratuit | 60 req/min | Indices US, VIX, calendrier eco |
| GNews | `GNEWS_API_KEY` | Gratuit | 100 req/jour | Actualites FR/EN multi-categories |
| FRED | `FRED_API_KEY` | Gratuit | 120 req/min | 10 series macro US |
| Alpha Vantage | `ALPHA_VANTAGE_API_KEY` | Gratuit | 25 req/jour | Forex, secteurs, top movers |
| Messari | `MESSARI_API_KEY` | Gratuit | 20 req/min | Crypto avance, dominance, metriques globales |
| Twelve Data | `TWELVE_DATA_API_KEY` | Gratuit | 800 req/jour | CAC 40, DAX, FTSE, Euro Stoxx 50, IBEX 35, FTSE MIB |
| NewsAPI | `NEWSAPI_API_KEY` | Gratuit | 100 req/jour | Actualites EN complementaires (5 categories) |

### Sans cle (8)
| API | Donnees |
|-----|---------|
| CoinGecko | Crypto: prix, trending, stablecoins, historique 90j |
| Alternative.me | Fear & Greed Index crypto (31j historique) |
| DefiLlama | TVL DeFi, top protocoles, yields stablecoins |
| metals.dev | Metaux precieux (or, argent, platine) + industriels |
| Etherscan | ETH gas tracker (low/standard/fast) |
| Mempool.space | BTC fees, hashrate, difficulty |
| ECB Data API | Taux directeur BCE, EUR/USD fixing 90j |
| World Bank | PIB, inflation, chomage, dette (10 economies majeures) |

## 5. Sources RSS (97)

### Geopolitique (21 sources)
- **FR** : Le Figaro Intl, France 24, RFI, Courrier Intl, Le Monde Diplomatique, Le Monde Intl
- **Intl** : BBC World, Al Jazeera, The Guardian, NYT, Reuters, Politico EU
- **Think tanks** : Foreign Policy, CFR, Brookings, Carnegie, CSIS, Responsible Statecraft, War on the Rocks
- **Regional** : The Diplomat (Asie), Middle East Eye (MENA)

### Marches & Finance (25 sources)
- **FR** : Le Figaro (Eco, Conj, Societes, Flash Eco, Finances), Les Echos, BFM Business, Zonebourse, La Tribune (general + finance), Capital, Le Monde Eco, Challenges, MoneyVox
- **Intl** : MarketWatch, Yahoo Finance, Seeking Alpha, CNBC, Investing.com
- **Macro specialise** : Wolf Street, Calculated Risk, Naked Capitalism, TLDR Fintech
- **Think tanks macro** : BIS (BRI), IMF Blog, World Economic Forum, PIIE, VoxEU/CEPR, OECD

### Crypto & Blockchain (14 sources)
- **FR** : CoinTelegraph FR, Cryptoast, Journal du Coin
- **Actualites** : CoinDesk, CoinTelegraph EN, The Block, Decrypt, Blockworks, Bitcoin Magazine
- **Specialise** : The Defiant, Unchained, Web3 is Going Great, Chainalysis, TLDR Crypto

### Matieres Premieres & Energie (19 sources)
- **Energie** : OilPrice, Rigzone, Natural Gas Intel, Reuters Commodities
- **Metaux** : GoldPrice.org, Mining.com, MetalMiner, S&P Global
- **Agriculture** : Feedstuffs, DTN Ag News
- **Transversal** : Hellenic Shipping, Trading Economics
- **Energie & climat** : IEA, IRENA, Carbon Brief, CleanTechnica, Reuters Sustainability, Energy Monitor, S&P Energy Transition

### IA, Tech & Cybersecurite (18 sources)
- **FR** : Le Figaro Tech, 01net, Numerama, Next INpact
- **Tech** : TechCrunch, The Verge, Ars Technica, Wired, Hacker News
- **IA** : VentureBeat AI, MIT Tech Review, IEEE Spectrum AI, MarkTechPost, The Decoder
- **Cybersecurite** : Krebs on Security, BleepingComputer, The Register
- **Newsletters** : TLDR Tech, TLDR AI

## 6. Frontend

### Architecture
- **HTML5** semantique, pages separees par rubrique
- **CSS3** : design vert (#10b981), responsive (480/768/1024px), glassmorphisme
- **JavaScript Vanilla** : zero dependance externe
- **TradingView Widgets** : graphiques temps reel integres
- **data-loader.js** : IIFE `DataLoader` avec cache, fallback gracieux, freshness indicators

### Widgets dynamiques (sidebar index.html)
1. Marches US (Finnhub)
2. Indicateurs macro (FRED)
3. Fear & Greed Index (Alternative.me)
4. Sentiment IA (Claude Haiku)
5. Alertes marche (Claude Haiku)
6. Briefing marche (Claude Haiku)
7. Analyse macro (Claude Haiku)
8. **Indices europeens (Twelve Data)** — NOUVEAU
9. **Macro internationale (World Bank)** — NOUVEAU
10. **Crypto avance (Messari)** — NOUVEAU
11. Crypto & tendances (CoinGecko)
12. DeFi & yields (DefiLlama)
13. Calendrier economique (Finnhub)
14. Forex & secteurs (Alpha Vantage)
15. Article du jour (Claude Haiku)
16. News par rubrique (GNews + RSS + NewsAPI)

## 7. Cles API et secrets GitHub

Les cles sont stockees dans **GitHub Settings > Secrets and variables > Actions** :

```
FINNHUB_API_KEY          # Finnhub (indices, VIX)
GNEWS_API_KEY            # GNews (actualites)
FRED_API_KEY             # FRED (macro US)
ALPHA_VANTAGE_API_KEY    # Alpha Vantage (forex, secteurs)
MESSARI_API_KEY          # Messari (crypto avance)
TWELVE_DATA_API_KEY      # Twelve Data (indices europeens)
NEWSAPI_API_KEY          # NewsAPI (news complementaires)
ANTHROPIC_API_KEY        # Claude Haiku (syntheses IA)
PAT_TOKEN                # GitHub PAT (pour commit auto)
```

## 8. Commandes utiles

```bash
# Lancer le pipeline de donnees localement
FINNHUB_API_KEY=xxx GNEWS_API_KEY=xxx node scripts/fetch-data.mjs

# Lancer les tests
npm test

# Serveur local
npx serve .

# Verifier la qualite du francais
python scripts/check-french.py
```

## 9. Historique des modifications

### Session 2026-02-12 — Elargissement sources API (Partie C)

**Nouvelles APIs integrees (4) :** 11 → 15 sources
- **Messari** (`fetchMessari`) : metriques crypto avancees — dominance BTC, market cap, volumes reels, supply par asset. Ecrit `messari.json`.
- **Twelve Data** (`fetchTwelveData`) : indices europeens — CAC 40, DAX, FTSE 100, Euro Stoxx 50, IBEX 35, FTSE MIB + forex EUR/GBP, EUR/CHF. Ecrit `european-markets.json`.
- **World Bank** (`fetchWorldBank`) : donnees macro internationales — PIB, inflation, chomage, dette publique pour 10 economies majeures (USA, CHN, JPN, DEU, GBR, FRA, IND, BRA, CAN, KOR). Ecrit `world-bank.json`.
- **NewsAPI** (`fetchNewsAPI`) : actualites EN complementaires (5 categories) pour enrichir le flux GNews + RSS. Ecrit `newsapi.json`. Les articles sont fusionnes dans le flux principal via `mergeNewsAPIArticles()` dans data-loader.js.

**Nouveaux flux RSS (19) :** 78 → 97 sources
- *Sources francophones (6)* : Le Monde Eco, Le Monde Intl, Challenges, MoneyVox, Le Figaro Finances, La Tribune Finance
- *Think tanks macro (6)* : BIS (BRI), IMF Blog, World Economic Forum, PIIE, VoxEU/CEPR, OECD
- *Energie & climat (7)* : IEA, IRENA, Carbon Brief, CleanTechnica, Reuters Sustainability, Energy Monitor, S&P Energy Transition

**Fichiers modifies :**
- `scripts/fetch-data.mjs` : +4 fonctions API, +19 entrees RSS, mise a jour main()
- `data-loader.js` : +4 fichiers JSON dans CONFIG.FILES, +4 widgets (european markets, world bank, messari, newsapi merge), +4 getters publics
- `index.html` : +3 blocs sidebar (indices europeens, macro internationale, crypto avance)
- `.github/workflows/fetch-data.yml` : +3 secrets env (MESSARI, TWELVE_DATA, NEWSAPI), timeout 10→15min
- `backend/.env.example` : documentation des nouvelles cles API
- `CLAUDE.md` : creation du fichier (ce document)

### Session 2026-02-12 (2) — Fix affichage news + traduction immediate

**Problemes corriges :**
- Traduction EN→FR maintenant executee a chaque cycle fetch (toutes les 6h) et non plus 1x/jour
- `translate-articles.mjs` traite aussi `newsapi.json` (plus seulement `news.json`)
- Layout articles : photo en haut, titre en dessous, resume bref (150 car. max) sous le titre
- Filtrage rubriques : mapping `geopolitics→geopolitique`, `markets→marches` dans app.js
- Ajout bouton filtre "IA & Tech" + badge CSS violet
- CSS manquants ajoutes : `.news-list`, `.news-list-body`, `.news-list-thumb`, `.has-thumb`, `.news-list-summary`
- Suppression bloc `.news-list-item !important` duplique
- Display limits augmentes : homepage 15→30 articles, pagination 5→10

**Fichiers modifies :**
- `styles.css` : layout cards (photo top, summary bottom), +CSS widgets EU/WB/Messari
- `app.js` : mapping rubrique, layout photo+resume, NEWS_PER_PAGE 5→10
- `data-loader.js` : layout articles, slice 15→30, resume 150 car.
- `index.html` : bouton filtre "IA & Tech"
- `.github/workflows/fetch-data.yml` : ajout step traduction EN→FR apres fetch
- `scripts/translate-articles.mjs` : ajout traitement newsapi.json

### Session 2026-02-12 (3) — Analyse UX, page Premium, +25 RSS

**Contexte :** Analyse approfondie de l'UX du point de vue du public cible (investisseur francophone actif). Identification des services premium a monetiser et des sources manquantes.

**Nouveaux flux RSS (25) :** 97 → 122 sources
- *Think tanks geopolitiques FR (4)* : IFRI, IRIS, FRS (Fondation pour la recherche strategique), GRIP (Bruxelles)
- *Think tanks internationaux (4)* : Chatham House, IISS, Al-Monitor, Middle East Institute
- *Donnees geopolitiques (2)* : SIPRI (armement), Crisis Group (conflits)
- *Presse financiere internationale (3)* : Financial Times, Nikkei Asia, L'AGEFI
- *Banques centrales (2)* : BCE (communiques), Banque de France
- *Energie/commodites (4)* : OPEC, Wood Mackenzie, Kpler Energy, Argus Media
- *IA & Tech premium (3)* : Stratechery, The Information, Simon Willison

**Nouvelle page :** `premium.html`
- Presentation de 6 services premium envisages : briefing IA strategique, alertes contextuelles, dashboard risque geopolitique, rapports thematiques, screener cross-asset, API entreprises
- Cartographie des 122 sources par categorie
- CTA vers inscription newsletter (early-adopter)

**Ameliorations UX :**
- Fallback messages contextualises pour chaque widget IA (au lieu de "Chargement..." generique)
- Footer source tags elargis : CFR, IFRI, SIPRI, Chatham House, FMI, BCE, FRED, Finnhub, CoinGecko, DefiLlama, Messari, OPEC
- Hero eyebrow mis a jour : "122 sources · 15 APIs · IA Claude"
- Lien "Premium" ajoute dans la navigation de toutes les pages

**Fichiers modifies :**
- `scripts/fetch-data.mjs` : +25 entrees RSS, mise a jour commentaires (97→122)
- `premium.html` : nouvelle page services premium
- `styles.css` : +CSS premium page (grid, cards, sources, CTA, responsive)
- `index.html` : nav premium, footer elargi, hero eyebrow, fallback article du jour
- `app.js` : fallback messages contextualises par widget
- `geopolitics.html`, `markets.html`, `crypto.html`, `commodities.html`, `etf.html`, `analysis.html`, `cgu.html`, `mentions-legales.html`, `confidentialite.html` : nav premium + footer sources
- `CLAUDE.md` : documentation session

### Session 2026-02-12 (4) — Briefing IA Quotidien Strategique

**Contexte :** Nouvelle feature phare d'Inflexion — un briefing strategique quotidien qui croise signaux geopolitiques et donnees de marche avec interconnexions et risk radar. Utilise Claude Sonnet (vs Haiku pour les autres taches) pour la qualite d'analyse.

**Nouveau script :** `scripts/generate-daily-briefing.mjs`
- Charge 12 sources de donnees (news, marches, crypto, macro, commodities, etc.)
- Selectionne les 20-30 articles les plus importants (diversite par rubrique)
- Construit un contexte multi-sources en markdown
- Appelle Claude Sonnet (`claude-sonnet-4-5-20250929`) avec prompt strategique
- Produit : synthese 300-500 mots, 3-5 signaux avec interconnexions, 3 risques (risk radar)
- Sortie : `data/daily-briefing.json`
- Mode `--dry-run` pour valider sans appeler Claude

**Nouveau workflow :** `.github/workflows/generate-daily-briefing.yml`
- Cron quotidien 08h UTC (apres fetch-data 06h et article 07h)
- Declenchement manuel (workflow_dispatch)
- Commit automatique du briefing

**Nouveau prompt :** `DAILY_BRIEFING_SYSTEM_PROMPT` dans `scripts/lib/prompts.mjs`
- Ton "analyste senior" (Economist/FT/Stratfor)
- Structure : synthese + signaux + interconnexions + risk radar
- Regles d'interconnexion : chaque signal DOIT avoir 2+ liens vers d'autres secteurs

**Frontend :** Section "Article du jour" transformee en "Briefing Strategique IA"
- Priorite au briefing (`daily-briefing.json`) avec fallback vers article classique
- Cartes de signaux avec badges de severite et interconnexions visuelles
- Risk radar avec indicateurs de probabilite et impact
- Tags et sentiment global colore
- Responsive mobile

**Fichiers modifies :**
- `scripts/lib/claude-api.mjs` : ajout couts Sonnet dans TOKEN_COSTS
- `scripts/lib/prompts.mjs` : +1 prompt (DAILY_BRIEFING_SYSTEM_PROMPT)
- `data-loader.js` : chargement daily-briefing.json, nouveau rendu briefing, getter public
- `index.html` : section "Briefing Strategique IA" (titre, sous-titre, placeholder)
- `styles.css` : +CSS briefing (signal-card, interconnexions, risk-radar, severity badges, responsive)
- `CLAUDE.md` : documentation session

**Fichiers crees :**
- `scripts/generate-daily-briefing.mjs` : script principal de generation
- `.github/workflows/generate-daily-briefing.yml` : workflow CI/CD

### Session 2026-02-17 — Watchlist Avancee (Gratuit)

**Contexte :** Implementation complete des fonctionnalites avancees de la watchlist, initialement prevues en premium, desormais 100% gratuites. Comprend alertes croisees, donnees live, partage, annotations equipe, rapports automatises et API RESTful.

**Nouvelles fonctionnalites :**

1. **Donnees live sur la watchlist** — Enrichissement automatique de chaque actif suivi avec prix et variation 24h en temps reel. Cross-reference entre les sources : CoinGecko, Messari (crypto), Finnhub, Alpha Vantage (actions), Twelve Data (indices EU), etc. Rafraichissement automatique toutes les 5 minutes.

2. **Alertes croisees** — Detection automatique quand une actualite ou une alerte IA mentionne un actif de la watchlist utilisateur. Croisement watchlist x 122 sources RSS x alertes Claude. Badge de notification par actif et panneau d'alertes croisees avec severite (urgent/attention/info).

3. **Watchlists partagees** — Generation de lien de partage unique (code 12 caracteres). Vue lecture seule avec donnees live. Copie en un clic dans sa propre watchlist. Table Supabase `shared_watchlists`.

4. **Annotations equipe** — Notes collaboratives sur chaque actif de la watchlist. Panneau slide-in avec formulaire, auteur, date, suppression. Table Supabase `watchlist_annotations`.

5. **Rapports automatises** — Generation de rapport HTML complet en un clic : resume portfolio (hausse/baisse/tendance), detail de chaque actif (prix, variation, source), alertes croisees, contexte marche (sentiment IA, Fear & Greed). Ouverture dans un nouvel onglet pour impression/PDF.

6. **API RESTful** — 18 endpoints couvrant toutes les donnees Inflexion. Architecture double : backend Node.js si disponible, fallback vers DataLoader (JSON statiques) sur GitHub Pages. Endpoints : articles, marche, crypto, macro, sentiment, alertes, briefing, DeFi, indices EU, prix par symbole, news par symbole, watchlist partagee, recherche, sources, categories, meta.

**Helpers DataLoader :**
- `getPriceForSymbol(symbol, category)` — Recherche le prix live dans toutes les sources
- `getNewsForSymbol(symbol, label)` — Recherche les articles mentionnant un actif (avec alias : BTC→bitcoin, NVDA→nvidia, etc.)
- `getAlertsForSymbol(symbol)` — Recherche les alertes IA mentionnant un actif

**API Publique elargie (`window.InflexionAuth`) :**
- `addToWatchlist()`, `removeFromWatchlist()`, `shareWatchlist()`, `loadSharedWatchlist()`
- `generateReport()`
- `watchlistItems` (getter), `crossAlerts` (getter)

**Fichiers modifies :**
- `data-loader.js` : +3 helpers (getPriceForSymbol, getNewsForSymbol, getAlertsForSymbol), +3 exports publics
- `supabase-client.js` : refonte complete — enrichissement live, alertes croisees, partage, annotations, rapports, icones SVG par categorie
- `index.html` : section watchlist elargie (toolbar, alertes croisees, annotations, watchlist partagee)
- `styles.css` : refonte CSS watchlist (toolbar, items enrichis, alertes croisees, partage, annotations, responsive 4 breakpoints)
- `api-client.js` : expansion en API RESTful complete (18 endpoints, fallback DataLoader)
- `premium.html` : services 2 et 6 marques "Gratuit", CTA mis a jour
- `CLAUDE.md` : documentation session

**Tables Supabase ajoutees :**
- `shared_watchlists` : `id`, `owner_id`, `share_code`, `name`, `is_public`, `created_at`
- `watchlist_annotations` : `id`, `watchlist_item_id`, `user_id`, `author_name`, `text`, `created_at`

### Session 2026-02-17 (2) — Curation qualitative des articles

**Contexte :** L'affichage "Dernieres actualites" montrait 30 articles bruts tries par date, sans filtrage qualitatif ni distribution equilibree entre rubriques. L'utilisateur souhaitait 8-12 articles/jour de haute qualite, bien repartis entre les 5 thematiques d'Inflexion.

**Nouveau systeme de curation (`data-loader.js`) :**
- `SOURCE_TIERS` : classification de 70+ sources en 3 niveaux de qualite (think tanks/grandes redactions → presse specialisee → agregateurs)
- `scoreArticle(article)` : algorithme de scoring 0-100 multi-criteres (autorite source 35pts, qualite titre 20pts, qualite description 20pts, fraicheur 15pts, image 5pts, langue 5pts)
- `curateArticles(allArticles, targetTotal)` : selection equilibree en 2 phases — garantir 2 articles/rubrique puis completer avec les meilleurs restants (max 3/rubrique)
- `updateLatestNewsWithRubriques()` : utilise desormais `curateArticles(allArticles, 12)` au lieu de `allArticles.slice(0, 30)`

**Fix ordre DOM :** `mergeNewsAPIArticles()` deplace AVANT le rendu des news (etait appele apres, les articles NewsAPI n'apparaissaient pas dans la selection)

**Modifications UI :**
- Section "Dernieres actualites" renommee "Selection du jour" avec sous-titre explicatif
- Bouton "Voir plus d'actualites" remplace par lien "Explorer toutes les rubriques"
- CSS `.section-subtitle` ajoute

**Fichiers modifies :**
- `data-loader.js` : +SOURCE_TIERS, +scoreArticle(), +curateArticles(), refacto updateLatestNewsWithRubriques(), fix ordre mergeNewsAPIArticles
- `index.html` : titre section, sous-titre, bouton → lien
- `styles.css` : +.section-subtitle
- `CLAUDE.md` : documentation session

### Session 2026-02-18 — Fix timeouts API Claude (workflows CI)

**Contexte :** Trois workflows GitHub Actions echouaient systematiquement avec l'erreur "The operation was aborted due to timeout" lors des appels a l'API Claude. Le timeout HTTP par defaut (30s) etait insuffisant pour les completions complexes (4000-6000 tokens), et le workflow `generate-article.yml` avait un timeout global de seulement 5 minutes.

**Probleme racine :** Le module `claude-api.mjs` utilisait un timeout de 30 secondes par requete avec 3 retries (delay 1s → 2s). Pour les scripts generant des reponses longues (macro-analysis, market-briefing, newsletter), l'API Anthropic peut prendre 60+ secondes, causant des echecs en cascade.

**Corrections apportees :**

1. **Client API Claude (`scripts/lib/claude-api.mjs`)** — Augmentation des parametres par defaut :
   - `timeoutMs` : 30s → 90s
   - `retry.maxAttempts` : 3 → 4
   - `retry.initialDelayMs` : 1s → 2s
   - `retry.maxDelayMs` : 30s → 60s

2. **Scripts lourds — timeout explicite 120s** :
   - `generate-macro-analysis.mjs` : +`timeoutMs: 120_000` (maxTokens: 4096)
   - `generate-market-briefing.mjs` : +`timeoutMs: 120_000` (maxTokens: 6000)
   - `generate-newsletter.mjs` : +`timeoutMs: 120_000` (maxTokens: 6000)

3. **Workflows GitHub Actions — timeout global augmente** :
   - `generate-article.yml` : 5min → 15min (traduction + classification + generation)
   - `analyze-sentiment.yml` : 10min → 15min (4 appels Claude sequentiels)
   - `generate-daily-briefing.yml` : 10min → 15min (Claude Sonnet + RAG)

**Fichiers modifies :**
- `scripts/lib/claude-api.mjs` : DEFAULT_CONFIG timeout et retry
- `scripts/generate-macro-analysis.mjs` : +timeoutMs explicite
- `scripts/generate-market-briefing.mjs` : +timeoutMs explicite
- `scripts/generate-newsletter.mjs` : +timeoutMs explicite
- `.github/workflows/generate-article.yml` : timeout 5→15min
- `.github/workflows/analyze-sentiment.yml` : timeout 10→15min
- `.github/workflows/generate-daily-briefing.yml` : timeout 10→15min
- `CLAUDE.md` : documentation session

### Session 2026-02-21 — Consolidation des appels Claude (reduction tokens ~75%)

**Contexte :** La limite de tokens API Anthropic a ete atteinte le 21 fevrier 2026. L'analyse a revele une consommation de ~2.87M tokens/mois, causee par 4 scripts Claude executes separement (8 appels par execution) 4 fois par jour (32 appels/jour). Les principaux consommateurs : `generate-market-briefing` (38%), `generate-macro-analysis` (21%), `analyze-sentiment` (17%), `generate-alerts` (8%).

**Solution : fusion des 4 scripts en 1 script consolide avec 2 appels Claude**

**Nouveau script :** `scripts/generate-market-analysis.mjs`
- Charge toutes les donnees UNE SEULE FOIS (news, marches, crypto, FNG, macro, commodites, DeFi, forex, on-chain)
- **Appel 1** : Sentiment multi-rubriques + alertes de marche (1 appel au lieu de 6)
- **Appel 2** : Analyse macro + briefing marche (1 appel au lieu de 2)
- Ecrit les 4 fichiers JSON existants (zero impact frontend) : `sentiment.json`, `alerts.json`, `macro-analysis.json`, `market-briefing.json`
- Mode `--dry-run` pour valider sans appeler Claude

**Nouveaux prompts consolides :** `scripts/lib/prompts.mjs`
- `CONSOLIDATED_SENTIMENT_ALERTS_PROMPT` : combine sentiment par rubrique + alertes en un seul prompt
- `CONSOLIDATED_MACRO_BRIEFING_PROMPT` : combine analyse macro + briefing marche en un seul prompt

**Economies realisees :**
- Appels Claude par execution : 8 → 2 (reduction 75%)
- Frequence : 4x/jour → 2x/jour (06h30, 18h30 UTC)
- System prompts repetes : ~4 000 tokens economises par execution
- Contexte marche duplique : ~6 000 tokens economises par execution
- **Estimation mensuelle : ~2.87M → ~500K tokens/mois (reduction ~82%)**

| Metrique | Avant | Apres |
|----------|-------|-------|
| Appels Claude/jour | 32 | 4 |
| Tokens/jour | ~95 000 | ~17 000 |
| Tokens/mois | ~2 870 000 | ~510 000 |
| Cout estime/mois | ~$12.50 | ~$2.25 |

**Fichiers modifies :**
- `scripts/lib/prompts.mjs` : +2 prompts consolides (CONSOLIDATED_SENTIMENT_ALERTS_PROMPT, CONSOLIDATED_MACRO_BRIEFING_PROMPT)
- `.github/workflows/analyze-sentiment.yml` : 1 step consolide au lieu de 4, cron 4x→2x/jour, timeout 15→10min
- `CLAUDE.md` : documentation session

**Fichiers crees :**
- `scripts/generate-market-analysis.mjs` : script consolide (remplace les 4 scripts individuels dans le workflow)

**Note :** Les scripts individuels (`analyze-sentiment.mjs`, `generate-alerts.mjs`, `generate-macro-analysis.mjs`, `generate-market-briefing.mjs`) sont conserves pour execution manuelle ou debug individuel.

### PRs precedentes

**PR #23 (mergee)** : Redesign vert + widgets IA + 78 RSS + automatisation Claude
- Redesign identite verte (#10b981)
- Widgets sentiment, alertes, newsletter (Claude Haiku)
- 49 → 78 flux RSS (+29 sources ultra-specialisees)
- Pipeline fetch-data.mjs (11 APIs)
- Tests unitaires (35 tests)

**PR #22** : Setup initial RSS feeds
- Ajout premiers flux RSS (Le Figaro, TLDR, Les Echos, BFM, CoinTelegraph, etc.)
