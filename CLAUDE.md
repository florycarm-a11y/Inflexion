# CLAUDE.md — Inflexion : Architecture & Contexte

> Document de reference pour Claude Code. A mettre a jour a chaque fin de session.
> Derniere MAJ : 2026-02-12 (session `claude/develop-api-automation-OTQZw`)

---

## 1. Qu'est-ce qu'Inflexion ?

Plateforme d'intelligence financiere francophone, entierement automatisee.
Elle agrege **11 APIs + 78 flux RSS**, genere du contenu editorial via **Claude (Haiku 4.5)**, et se deploie sur **GitHub Pages**.

**URL :** `https://florycarm-a11y.github.io/Inflexion/`
**Repo :** `florycarm-a11y/Inflexion`
**Langue :** Francais (traduction automatique EN→FR)
**Version :** 2.0.0 — Vague 9 (Supabase + FRED)

---

## 2. Arborescence du projet

```
Inflexion/
├── index.html                  # Dashboard principal
├── analysis.html               # Analyses & Perspectives
├── commodities.html            # Matieres Premieres
├── crypto.html                 # Crypto & Blockchain
├── markets.html                # Marches financiers
├── etf.html                    # ETF & Fonds
├── geopolitics.html            # Geopolitique
├── cgu.html / confidentialite.html / mentions-legales.html
│
├── styles.css                  # Design system complet (~4700 lignes)
├── app.js                      # Logique frontend (init pages, rendu, filtres)
├── data-loader.js              # Chargement JSON → DOM (cache, fallback)
├── api-client.js               # Client REST optionnel (backend Node)
├── supabase-client.js          # Auth, watchlist, newsletter (Supabase)
│
├── scripts/
│   ├── fetch-data.mjs          # Fetcher principal (11 APIs + 78 RSS)
│   ├── analyze-sentiment.mjs   # Sentiment par categorie (Claude)
│   ├── generate-alerts.mjs     # Alertes mouvements significatifs
│   ├── generate-article.mjs    # Article du jour (Claude)
│   ├── generate-newsletter.mjs # Newsletter hebdo (Claude)
│   ├── generate-macro-analysis.mjs   # Analyse macro (Claude)
│   ├── generate-market-briefing.mjs  # Briefing marche (Claude)
│   ├── translate-articles.mjs  # Traduction EN→FR (Claude)
│   ├── check-french.py         # Audit linguistique
│   ├── lib/
│   │   ├── claude-api.mjs      # Client Claude API (retry, rate limit, cout)
│   │   └── prompts.mjs         # Tous les system prompts centralises
│   └── tests/
│       ├── lib/claude-api.test.mjs  # 35 tests unitaires
│       └── run-tests.sh
│
├── data/                       # Donnees auto-generees (JSON)
│   ├── _meta.json              # Timestamp + status dernier fetch
│   ├── crypto.json             # CoinGecko : prix, caps, variations
│   ├── markets.json            # Finnhub : indices boursiers
│   ├── news.json               # GNews + RSS : articles 5 categories
│   ├── macro.json              # FRED : 10 indicateurs economiques
│   ├── fear-greed.json         # Alternative.me : indice peur/cupidite
│   ├── alpha-vantage.json      # Forex, secteurs US
│   ├── defi.json               # DefiLlama : TVL, protocoles
│   ├── chart-gold-btc.json     # Historique Gold vs BTC
│   ├── rss-feeds.json          # Status des 78 flux
│   ├── sentiment.json          # Scores sentiment (Claude)
│   ├── alerts.json             # Alertes marche
│   ├── macro-analysis.json     # Analyse macro (Claude)
│   ├── market-briefing.json    # Briefing quotidien (Claude)
│   ├── newsletter.json         # Digest hebdo (Claude)
│   ├── commodities.json / onchain.json / global-macro.json
│   └── articles/YYYY-MM-DD.json  # Article du jour
│
├── .github/workflows/
│   ├── fetch-data.yml          # Cron 6h : fetch 11 APIs + RSS
│   ├── analyze-sentiment.yml   # Cron 6h+30min : sentiment + alertes + macro + briefing
│   ├── generate-article.yml    # Cron quotidien 07h : traduction + article
│   ├── generate-newsletter.yml # Cron dimanche 10h : newsletter
│   ├── deploy-pages.yml        # Auto : deploy GitHub Pages
│   ├── ci.yml                  # CI : lint, tests, build, security, frontend
│   └── check-french.yml        # PR : audit linguistique
│
├── backend/                    # API REST optionnelle (Express.js)
│   └── src/
│       ├── server.js           # Express + middleware + routes
│       ├── routes/             # articles, market, sources, search
│       ├── services/           # aggregator (fetch + parse RSS)
│       └── models/             # Article.js (PostgreSQL)
│
├── package.json                # undici (proxy/fetch pour Node 22)
├── .env                        # Cles API (NE PAS COMMIT)
├── .gitignore
├── manifest.json               # PWA
├── robots.txt / sitemap.xml
└── CLAUDE.md                   # CE FICHIER
```

---

## 3. Pipeline d'automatisation

```
TOUTES LES 6H (00h, 06h, 12h, 18h UTC)
│
├─ fetch-data.yml ─→ fetch-data.mjs
│  ├─ CoinGecko (crypto)
│  ├─ Finnhub (indices, VIX)
│  ├─ GNews (news multi-cat)
│  ├─ FRED (macro US)
│  ├─ Alpha Vantage (forex, secteurs)
│  ├─ Alternative.me (Fear & Greed)
│  ├─ DefiLlama (DeFi TVL)
│  ├─ metals.dev, Etherscan, Mempool, BCE
│  └─ 78 flux RSS (5 categories)
│  → Ecrit data/*.json → git commit → deploy
│
├─ +30min ─→ analyze-sentiment.yml
│  ├─ analyze-sentiment.mjs  → data/sentiment.json
│  ├─ generate-alerts.mjs    → data/alerts.json
│  ├─ generate-macro-analysis.mjs → data/macro-analysis.json
│  └─ generate-market-briefing.mjs → data/market-briefing.json
│
├─ QUOTIDIEN 07h ─→ generate-article.yml
│  ├─ translate-articles.mjs → data/news.json (FR)
│  └─ generate-article.mjs  → data/articles/YYYY-MM-DD.json
│
└─ DIMANCHE 10h ─→ generate-newsletter.yml
   └─ generate-newsletter.mjs → data/newsletter.json

CHAQUE COMMIT sur main ─→ deploy-pages.yml ─→ GitHub Pages
```

---

## 4. Flux de donnees frontend

```
Navigateur charge index.html
  │
  ├─ styles.css (design system)
  ├─ data-loader.js
  │    └─ fetch("data/*.json") avec cache 12h + timeout 8s
  │    └─ Fallback → app.js (donnees statiques)
  ├─ app.js
  │    └─ initHomePage() / initCategoryPage()
  │    └─ Rendu DOM : news, marche, sentiment, alertes, article
  ├─ api-client.js (optionnel)
  │    └─ Si backend dispo → /api/* endpoints
  └─ supabase-client.js
       └─ Auth, watchlist, newsletter (Supabase cloud)
```

---

## 5. Design system CSS (styles.css)

### Palette de couleurs (identite verte)

```css
--accent: #105E2D;         /* Vert fonce — couleur primaire */
--accent-dark: #0A4420;    /* Vert plus sombre (hover) */
--accent-light: #EDF5F0;   /* Vert tres leger (fond) */
--navy: #0B3D1E;           /* Secondaire sombre */
--red: #C41E3A;            /* Negatif / alertes urgentes */
--green: #1B7A3D;          /* Positif */
--orange: #B85C38;         /* Warning */
--bg-primary: #F4F4ED;     /* Fond principal */
--text-primary: #1a1a1a;   /* Texte */
```

### Typographie
- Police : **Plus Jakarta Sans** (Google Fonts)
- Echelle : 0.7rem → 2.75rem (8 niveaux)
- Graisses : 400 (normal) → 700 (bold)

### Layout
- `--header-height: 60px` / `--header-height-scrolled: 60px`
- `--content-max-width: 1240px`
- `--sidebar-width: 320px`
- Responsive : breakpoints a 768px, 480px, print

### Composants cles
- Header sticky avec scroll effect (background blur)
- Sidebar sticky (desktop)
- Cards (articles, marches, sentiment)
- Widgets : sentiment-score, alert-item, newsletter-preview
- Badges severity : urgent (rouge), attention (jaune), info (vert)

---

## 6. APIs et sources

### APIs externes (11)

| API | Donnee | Fichier JSON | Cle requise |
|-----|--------|-------------|-------------|
| CoinGecko | Crypto prix/caps | crypto.json | Non |
| Finnhub | Indices, VIX | markets.json | FINNHUB_API_KEY |
| GNews | Actualites | news.json | GNEWS_API_KEY |
| FRED | Macro US (CPI, chomage) | macro.json | FRED_API_KEY |
| Alpha Vantage | Forex, secteurs | alpha-vantage.json | ALPHA_VANTAGE_API_KEY |
| Alternative.me | Fear & Greed | fear-greed.json | Non |
| DefiLlama | DeFi TVL | defi.json | Non |
| metals.dev | Metaux precieux | commodities.json | METALS_API_KEY |
| Etherscan | Gas ETH | onchain.json | ETHERSCAN_API_KEY |
| Mempool.space | Fees BTC | onchain.json | Non |
| BCE (ECB) | Taux EUR/USD | global-macro.json | Non |

### Flux RSS (78 sources, 5 categories)

| Categorie | Nombre | Exemples |
|-----------|--------|----------|
| Geopolitique | 20 | Le Figaro Intl, France 24, BBC, Al Jazeera, Reuters, Foreign Policy |
| Marches | 18 | Les Echos, BFM, Boursorama, MarketWatch, CNBC, Seeking Alpha |
| Crypto | 14 | CoinTelegraph FR/EN, CoinDesk, The Block, Bitcoin Magazine |
| Commodites | 13 | OilPrice, Kitco, Mining.com, S&P Global |
| IA & Tech | 17 | TechCrunch, The Verge, Wired, Hacker News, MIT Tech Review |

### Claude API (Haiku 4.5)
- Modele : `claude-haiku-4-5-20251001`
- Taches : sentiment, alertes, articles, newsletter, macro, briefing, traduction, classification
- Config : retry 3x, backoff exponentiel, rate limit 250ms, timeout 30s
- Prompts centralises dans `scripts/lib/prompts.mjs`

### Supabase
- Auth (email/password)
- Tables : `watchlist`, `newsletter`, `articles`
- RLS (Row Level Security)

---

## 7. Backend optionnel (Express.js)

- Port : 3001
- Routes : `/api/articles`, `/api/market`, `/api/search`, `/api/sources`, `/api/categories`
- Middleware : helmet, CORS, compression, rate-limit (100 req/15min)
- DB : PostgreSQL (optionnel)
- Tests : Jest (70% coverage), ESLint
- Le frontend fonctionne sans le backend (fallback sur JSON statiques)

---

## 8. CI/CD

| Workflow | Declencheur | Actions |
|----------|------------|---------|
| fetch-data | Cron 6h + push main | Fetch APIs + RSS → commit data/ |
| analyze-sentiment | Cron 6h30 + push | Sentiment + alertes + macro + briefing |
| generate-article | Cron 07h + push | Traduction + article du jour |
| generate-newsletter | Dimanche 10h | Newsletter hebdo |
| deploy-pages | Push main | Build _site/ → GitHub Pages |
| ci | Push + PR | Lint, tests (70% coverage), build, security, frontend |
| check-french | PR sur HTML/JS | Audit linguistique (Claude) |

---

## 9. Modifications apportees (session 2026-02-12)

### PR #23 — `claude/develop-api-automation-OTQZw`

#### Couche d'automatisation API Claude
- **`scripts/lib/claude-api.mjs`** : Client Claude API centralise (retry, rate limit, suivi cout)
- **`scripts/lib/prompts.mjs`** : Tous les system prompts (classification, article, sentiment, alertes, newsletter, macro, briefing, traduction)
- **`scripts/tests/lib/claude-api.test.mjs`** : 35 tests unitaires

#### Pipeline end-to-end
- **`scripts/fetch-data.mjs`** : Support proxy (undici), corrections RSS, .gitignore securite
- **`scripts/analyze-sentiment.mjs`** : Analyse sentiment par categorie via Claude
- **`scripts/generate-alerts.mjs`** : Detection seuils + generation alertes
- **`scripts/generate-article.mjs`** : Classification hybride + article quotidien
- **`scripts/generate-newsletter.mjs`** : Digest hebdomadaire
- **`scripts/generate-macro-analysis.mjs`** : Analyse macro-economique
- **`scripts/generate-market-briefing.mjs`** : Briefing marche quotidien
- **`scripts/translate-articles.mjs`** : Traduction batch EN→FR

#### Sources elargies
- **+29 flux RSS** (49 → 78) : RSS internationaux, commodites, on-chain, BCE
- **+3 API Claude** : macro, briefing marche, risque geopolitique

#### Redesign visuel
- **Identite verte** : `--accent` passe de `#C41E3A` (rouge) a `#105E2D` (vert fonce)
- **Header scrolle agrandi** : min-height 48px → 60px, logo 40→44px, liens + gros
- **Widgets** : sentiment-score, alert-item, newsletter-preview

#### Workflows CI
- **Node 22 + npm ci** : Upgrade tous les workflows
- **analyze-sentiment.yml** : Nouveau (sentiment + alertes + macro + briefing)
- **generate-article.yml** : Traduction + article
- **generate-newsletter.yml** : Newsletter hebdo

#### Resolution conflits merge
- 9 fichiers JSON data/ resolus (donnees auto-actualisees, accepte version main)

---

## 10. Points d'attention pour les futures sessions

### Fichiers sensibles
- **`.env`** : contient toutes les cles API — NE JAMAIS commit
- **`data/*.json`** : auto-generes toutes les 6h, conflits frequents lors des merges → toujours accepter la version `main` (donnees les plus recentes)
- **`styles.css`** : ~4700 lignes, avait un doublon complet (lignes 2860-5726 = copie de 1-2859). Nettoye dans cette session

### Architecture a ne pas casser
- Le frontend est **100% statique** (GitHub Pages). Pas de SSR, pas de bundler
- Les scripts `scripts/*.mjs` tournent dans **GitHub Actions**, pas dans le navigateur
- `data-loader.js` attend des JSON avec des structures precises — tout changement de schema dans les scripts doit etre repercute dans data-loader.js
- Le backend Express est **optionnel** — le site fonctionne entierement sans

### Conventions
- **Langue** : interface et contenu en francais, code et commits en anglais ou francais
- **Commits data** : format `Donnees mises a jour — YYYY-MM-DD HH:MM UTC`
- **Pas de bundler** : vanilla JS, pas de npm pour le frontend
- **Tests** : `node --test scripts/tests/` et Jest pour le backend (70% coverage min)

### Prochaines etapes potentielles
- Ajouter de nouvelles sources API (voir Partie C du plan)
- Ameliorer le backend (PostgreSQL, cache Redis)
- Dashboard analytics (metriques de consultation)
- Mode sombre (dark mode)
- PWA complete (service worker, notifications push)
