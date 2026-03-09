# CLAUDE.md — Inflexion Guide Technique

## 1. Vue d'ensemble

**Inflexion** est une plateforme d'intelligence financière automatisée combinant analyses géopolitiques et données de marché en temps réel. Le système agrège **15 APIs**, **158 flux RSS** et utilise **Claude Sonnet** (briefing stratégique) + **Claude Haiku** (classification, alertes).

**URL de production** : https://florycarm-a11y.github.io/Inflexion/

## 2. Structure des fichiers

```
Inflexion/
├── index.html              # Page principale (widgets, sidebar, news)
├── analysis.html           # Page analyses approfondies
├── commodities.html        # Page matières premières
├── crypto.html             # Page crypto & blockchain
├── etf.html                # Page ETF & fonds
├── geopolitics.html        # Page géopolitique
├── markets.html            # Page marchés & finance
├── premium.html            # Page services premium
├── expertise.html          # Page méthodologie & approche
├── country.html            # Page macro par pays (World Bank)
├── cgu.html / mentions-legales.html / confidentialite.html
├── analyse-*.html          # Articles d'analyse thématique
├── styles.css              # CSS complet (design vert, responsive)
├── app.js                  # Logique JS principale + navigation desktop/mobile
├── data-loader.js          # Charge les JSON → met à jour le DOM
├── api-client.js           # Client API frontend (18 endpoints RESTful)
├── supabase-client.js      # Client Supabase (watchlist, partage, annotations)
├── data/                   # Fichiers JSON générés par le pipeline
├── scripts/                # Pipeline Node.js (fetch, briefing, RAG, tests)
│   ├── fetch-data.mjs      # Pipeline principal (15 APIs + 158 RSS)
│   ├── generate-daily-briefing.mjs  # Briefing stratégique (Claude Sonnet + RAG)
│   ├── generate-market-analysis.mjs # Consolidé : sentiment + alertes + macro + briefing
│   ├── lib/                # Modules partagés (claude-api, prompts, RAG, cache, etc.)
│   └── tests/              # Tests unitaires (~188 tests)
├── .github/workflows/      # CI/CD (fetch, briefing, article, sentiment, deploy)
└── package.json
```

## 3. Navigation frontend

- **Desktop (≥769px)** : barre de navigation horizontale sticky (`desktop-nav`) générée par JS (`initDesktopNav` dans `app.js`), avec indicateur de page active et CTA.
- **Mobile (<769px)** : menu hamburger ouvrant un overlay plein écran vert avec animations d'entrée décalées, groupes "Veille" et "Conseil", et CTA.

## 4. Design & CSS

- Couleur principale : vert (#0B3D1E)
- Responsive : breakpoints 480/768/1024px
- Style : glassmorphisme
- Zero dépendance externe (JS Vanilla)
- TradingView Widgets pour graphiques temps réel

## 5. Pipeline de données

```
GitHub Actions (cron 2x/jour : 06h + 18h UTC)
  → scripts/fetch-data.mjs (15 APIs + 158 RSS)
  → data/*.json (commit auto)
  → GitHub Pages (deploy auto)
  → data-loader.js (frontend, avec fallback vers app.js)
```

### Flux IA
- **Briefing stratégique** : Claude Sonnet + RAG (après fetch-data)
- **Analyses consolidées** : Claude Haiku 2x/jour (sentiment + alertes + macro + briefing)
- **Article du jour + Newsletter** : Claude Haiku quotidien

## 6. APIs (15)

**Avec clé** : Finnhub, GNews, FRED, Alpha Vantage, Messari, Twelve Data, NewsAPI
**Sans clé** : CoinGecko, Alternative.me, DefiLlama, metals.dev, Etherscan, Mempool.space, ECB Data, World Bank

## 7. Commandes utiles

```bash
npm test              # Lancer les tests (~188 tests)
npx serve .           # Serveur local
node scripts/fetch-data.mjs          # Pipeline données (nécessite clés API)
node scripts/generate-daily-briefing.mjs --dry-run  # Test briefing sans appel Claude
```

## 8. Règles importantes

- **Pas de Markdown brut dans le HTML** : utiliser `<strong>`, `<em>` etc.
- **Pas de conseil en investissement** : section "Thèmes à surveiller" avec disclaimer AMF obligatoire
- **ETF vs indices** : Finnhub retourne des prix ETF (SPY, QQQ), pas des niveaux d'indice en points. Ne jamais mélanger.
- **Anti-redondance briefing** : chaque donnée chiffrée apparaît UNE SEULE FOIS dans le briefing
- **Sourcing** : chaque donnée porte une attribution (source API ou presse)
- **Mots-clés courts (≤4 car.)** : utiliser `\b` (word boundary) dans les regex, pas `includes()`
