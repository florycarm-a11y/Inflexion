# Inflexion — Géopolitique & Marchés Financiers

Plateforme d'intelligence financière automatisée combinant analyses géopolitiques et données de marché en temps réel. Agrège 15 APIs, 122 flux RSS et génère des synthèses IA quotidiennes via Claude pour les investisseurs francophones.

**Production** : [florycarm-a11y.github.io/Inflexion](https://florycarm-a11y.github.io/Inflexion/)

## Architecture & Stack

- **Frontend** : HTML5, CSS3, JavaScript Vanilla — déployé via GitHub Pages
- **Backend** : Supabase (auth, PostgreSQL, RLS) + Express.js API (rate limiting, compression, Helmet)
- **Automatisation** : 8 workflows GitHub Actions — fetch données (4x/jour), briefing IA quotidien, article quotidien, analyse de sentiment (4x/jour), newsletter hebdomadaire, traduction, RAG indexation, CI/CD
- **IA** : API Claude (Haiku pour le quotidien, Sonnet pour les briefings complets du lundi) via module centralisé avec retry exponentiel, rate limiting et suivi des coûts

## Sources de données

**15 APIs temps réel :**
- CoinGecko (crypto, trending, stablecoins, historique 90j)
- Finnhub (indices US, VIX, calendrier économique)
- FRED (10 séries macroéconomiques US)
- Alpha Vantage (forex, secteurs, top gainers/losers)
- DefiLlama (TVL DeFi, protocoles, yields stablecoins)
- Alternative.me (Fear & Greed Index crypto, historique 31j)
- GNews (actualités multi-catégories FR/EN)
- metals.dev (métaux précieux & industriels)
- Etherscan (ETH gas tracker)
- Mempool.space (BTC fees, hashrate, difficulté)
- ECB Data API (taux directeur BCE, EUR/USD fixing 90j)
- Messari (crypto avancé : dominance BTC, volumes, métriques globales)
- Twelve Data (indices européens : CAC 40, DAX, FTSE 100, Euro Stoxx 50, IBEX 35, FTSE MIB)
- World Bank (PIB, inflation, chômage, dette — 10 économies majeures)
- NewsAPI (actualités EN complémentaires, 5 catégories)

**122 flux RSS spécialisés :**
- Géopolitique (21) : Le Figaro, France 24, BBC World, Al Jazeera, Reuters, CFR, Brookings, Carnegie, CSIS, IFRI, Chatham House, SIPRI, Crisis Group...
- Marchés & Finance (25) : Les Echos, BFM Business, MarketWatch, CNBC, Wolf Street, BIS, IMF Blog, OECD, L'AGEFI, BCE, Banque de France...
- Crypto & Blockchain (14) : CoinDesk, CoinTelegraph, The Block, Decrypt, Blockworks, Chainalysis, The Defiant...
- Matières Premières & Énergie (19) : OilPrice, Mining.com, OPEC, IEA, IRENA, Carbon Brief, S&P Global...
- IA, Tech & Cybersécurité (18) : TechCrunch, MIT Tech Review, Krebs on Security, Hacker News, VentureBeat AI...

## Automatisations IA

- **Briefing stratégique quotidien** : croisement signaux géopolitiques × données marché via Claude. Cycle hebdomadaire : Sonnet le lundi (briefing complet), Haiku du mardi au dimanche (briefing delta). Enrichi par contexte RAG historique.
- **Article d'analyse quotidien** : rédaction automatisée avec contextualisation chiffrée, classification par rubrique et traduction EN→FR.
- **Analyse de sentiment** : scoring par rubrique toutes les 6h, génération d'alertes marché et analyse macro. Historique 30 jours.
- **Newsletter hebdomadaire** : synthèse automatique chaque dimanche (10h UTC), couvrant les faits marquants de la semaine.
- **Traduction automatique** EN→FR de tous les articles via Claude Haiku.
- **Classification d'articles** par rubrique (géopolitique, marchés, crypto, matières premières, IA/tech) via Claude.

## RAG (Retrieval-Augmented Generation)

- Embeddings locaux avec `all-MiniLM-L6-v2` (transformers.js, 384 dimensions, zéro API externe)
- Vector store JSON (articles + briefings) avec limite configurable (500 articles, 60 briefings)
- Recherche par similarité cosinus pour enrichir le contexte des briefings quotidiens
- Indexation automatique post-fetch et post-briefing via GitHub Actions (workflow `generate-daily-briefing.yml`)

## Base de données Supabase

- **Profils utilisateurs** : auth Supabase + trigger automatique `handle_new_user`
- **Watchlists personnalisées** : suivi d'actifs avec enrichissement live (prix, variation 24h), alertes croisées (watchlist × 122 sources RSS × alertes Claude), partage via lien public (code 12 caractères)
- **Annotations collaboratives** sur actifs (auteur, date, texte)
- **Archive** des articles IA et newsletters
- **Row Level Security (RLS)** sur toutes les tables : chaque utilisateur ne voit/modifie que ses propres données

Tables : `profiles`, `watchlist`, `articles`, `newsletter`, `shared_watchlists`, `watchlist_annotations`

## Frontend

- **Dashboard temps réel** avec 16+ widgets (indices, macro, crypto, DeFi, sentiment IA, alertes, briefing, Fear & Greed, forex, calendrier économique)
- **Pages dédiées** : marchés, crypto, commodités, ETF, géopolitique, macro par pays (10 économies)
- **Pages d'analyse** : droits de douane Trump/Groenland, IA et marchés, divergence or/bitcoin
- **Curation qualitative** : algorithme de scoring multi-critères (autorité source, qualité titre/description, fraîcheur, langue) — sélection de 12 articles/jour équilibrés entre rubriques
- **Watchlist avancée** : données live, alertes croisées, partage, annotations, génération de rapports HTML
- **TradingView widgets** intégrés pour graphiques temps réel
- **Responsive mobile-first** (breakpoints 480/768/1024px)
- **Accessibilité** : ARIA labels, navigation clavier, contrastes WCAG
- **SEO** : sitemap.xml, robots.txt, manifest.json
- **Pages légales** : CGU, politique de confidentialité, mentions légales

## Tests & CI/CD

**Pipeline CI** (`ci.yml`) : lint ESLint + tests unitaires + tests d'intégration + coverage (Codecov, seuil 70%)

**Tests backend** (Jest + Supertest) :
- Modèle Article, agrégateur, base de données, API REST

**Tests scripts** (Node.js native test runner) :
- fetch-data, data-loader, api-client, supabase-client, generate-daily-briefing, app

## Installation

```bash
# Cloner le repo
git clone https://github.com/florycarm-a11y/Inflexion.git
cd Inflexion

# Installer les dépendances
npm install
cd backend && npm install && cd ..

# Serveur local
npx serve .

# Lancer les tests
npm test
cd backend && npm test
```

### Variables d'environnement

Les clés API sont configurées dans GitHub Secrets pour les workflows CI/CD :

```
FINNHUB_API_KEY          # Finnhub (indices, VIX)
GNEWS_API_KEY            # GNews (actualités)
FRED_API_KEY             # FRED (macro US)
ALPHA_VANTAGE_API_KEY    # Alpha Vantage (forex, secteurs)
MESSARI_API_KEY          # Messari (crypto avancé)
TWELVE_DATA_API_KEY      # Twelve Data (indices européens)
NEWSAPI_API_KEY          # NewsAPI (news complémentaires)
ANTHROPIC_API_KEY        # Claude (synthèses IA)
PAT_TOKEN                # GitHub PAT (commit auto)
```

## Avertissement

Les informations présentées sur ce site sont fournies à titre informatif uniquement et ne constituent en aucun cas des conseils en investissement. Les performances passées ne garantissent pas les performances futures. Tout investissement comporte des risques de perte en capital.

## Licence

MIT License

## Contributions

Les contributions sont les bienvenues :
- Signaler des bugs
- Proposer de nouvelles sources
- Améliorer les traductions
