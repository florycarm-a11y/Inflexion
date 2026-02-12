# CLAUDE.md — Inflexion Architecture & Guide Technique

## 1. Vue d'ensemble

**Inflexion** est une plateforme d'intelligence financiere automatisee combinant analyses geopolitiques et donnees de marche en temps reel. Le systeme agrege **15 APIs**, **122 flux RSS** et utilise **Claude Haiku** pour generer des syntheses IA quotidiennes.

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

### Flux IA (Claude Haiku)
```
GitHub Actions (cron quotidien)
    ↓
scripts/generate-article.mjs     → data/article-du-jour.json
scripts/analyze-sentiment.mjs    → data/sentiment.json
scripts/generate-alerts.mjs      → data/alerts.json
scripts/generate-newsletter.mjs  → data/newsletter.json
scripts/generate-macro-analysis.mjs → data/macro-analysis.json
scripts/generate-market-briefing.mjs → data/market-briefing.json
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

### PRs precedentes

**PR #23 (mergee)** : Redesign vert + widgets IA + 78 RSS + automatisation Claude
- Redesign identite verte (#10b981)
- Widgets sentiment, alertes, newsletter (Claude Haiku)
- 49 → 78 flux RSS (+29 sources ultra-specialisees)
- Pipeline fetch-data.mjs (11 APIs)
- Tests unitaires (35 tests)

**PR #22** : Setup initial RSS feeds
- Ajout premiers flux RSS (Le Figaro, TLDR, Les Echos, BFM, CoinTelegraph, etc.)
