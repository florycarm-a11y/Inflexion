# Inflexion Backend API

![CI/CD](https://github.com/florycarm-a11y/Claude/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-70%25-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

Backend Node.js + PostgreSQL pour l'agrégation de 20+ sources institutionnelles.

## Stack Technique

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de données**: PostgreSQL 14+
- **Agrégation**: RSS Parser, Cheerio, Axios
- **Scheduler**: node-cron

## Installation

### 1. Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 2. Configuration

```bash
# Cloner et installer
cd backend
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL
```

### 3. Base de données

```bash
# Créer la base de données
createdb inflexion

# Exécuter les migrations
npm run migrate

# (Optionnel) Peupler avec les données existantes
npm run seed
```

### 4. Lancement

```bash
# Développement (avec hot reload)
npm run dev

# Production
npm start
```

Le serveur démarre sur `http://localhost:3001`

## API Endpoints

### Articles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/articles` | Liste des articles (pagination) |
| GET | `/api/articles/featured` | Articles à la une |
| GET | `/api/articles/breaking` | Breaking news |
| GET | `/api/articles/latest` | Derniers articles |
| GET | `/api/articles/:id` | Article par ID |
| POST | `/api/articles` | Créer un article |

**Query params**:
- `category`: Filtrer par catégorie (geopolitics, markets, crypto, commodities, etf)
- `source`: Filtrer par source
- `impact`: Filtrer par impact (high, medium, low)
- `limit`: Nombre de résultats (défaut: 20)
- `offset`: Pagination offset

### Sources

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/sources` | Liste des 20+ sources |
| GET | `/api/sources/:slug` | Source par slug |
| GET | `/api/sources/:slug/articles` | Articles d'une source |

### Catégories

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/categories` | Liste des catégories |
| GET | `/api/categories/:slug` | Catégorie par slug |
| GET | `/api/categories/:slug/articles` | Articles d'une catégorie |

### Marchés

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/market` | Données de marché temps réel |
| GET | `/api/market/:symbol` | Donnée par symbole |
| PUT | `/api/market/:symbol` | Mettre à jour (interne) |

### Recherche

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/search?q=` | Recherche full-text |
| GET | `/api/search/suggest?q=` | Autocomplétion |

## Sources Institutionnelles (20+)

### News Financier
- Bloomberg, CNBC, Reuters, Financial Times, WSJ, The Economist

### Think Tanks
- Atlantic Council, CFR, Foreign Policy, IMF, WEF, BCG, McKinsey

### Commodités
- World Gold Council, J.P. Morgan

### Crypto
- CoinDesk, CoinShares, The Block

### Tech
- Nvidia, SpaceX, Anthropic

### Français
- Les Échos, Le Monde

## Agrégation Automatique

Le système agrège automatiquement les news toutes les 30 minutes via les flux RSS.

```javascript
// Cron schedule (configurable dans .env)
AGGREGATION_CRON=*/30 * * * *
```

### Classification Automatique

Les articles sont automatiquement classifiés par:
- **Catégorie**: basée sur les mots-clés (tariff → geopolitics, bitcoin → crypto, etc.)
- **Impact**: high/medium/low selon les termes utilisés (crash, surge, record → high)

## Architecture

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # Configuration PostgreSQL
│   ├── models/
│   │   └── Article.js        # Modèle Article
│   ├── routes/
│   │   ├── articles.js       # Routes articles
│   │   ├── sources.js        # Routes sources
│   │   ├── categories.js     # Routes catégories
│   │   ├── market.js         # Routes données de marché
│   │   └── search.js         # Routes recherche
│   ├── services/
│   │   └── aggregator.js     # Service d'agrégation RSS
│   ├── utils/
│   │   └── seed.js           # Script de peuplement
│   └── server.js             # Point d'entrée Express
├── migrations/
│   ├── 001_initial_schema.sql
│   └── run.js
├── .env.example
├── package.json
└── README.md
```

## Schéma Base de Données

### Tables principales

- **articles**: Articles agrégés avec métadonnées
- **sources**: 20+ sources institutionnelles
- **categories**: 5 catégories (geopolitics, markets, crypto, commodities, etf)
- **tags**: Tags pour classification fine
- **market_data**: Données de marché temps réel
- **breaking_news**: Alertes et breaking news

### Index de performance

- Index sur category_id, source_id, published_at
- Index trigram pour recherche full-text
- Vue matérialisée pour les articles complets

## Sécurité

- **Helmet**: Headers de sécurité
- **CORS**: Origines contrôlées
- **Rate Limiting**: 100 requêtes / 15 min
- **Compression**: gzip activé

## Tests

### Exécuter les tests

```bash
# Tous les tests
npm test

# Avec couverture
npm run test:coverage

# Mode watch
npm run test:watch

# CI mode (pour GitHub Actions)
npm run test:ci
```

### Structure des tests

```
tests/
├── setup.js              # Configuration Jest
├── mocks/
│   └── database.js       # Mock PostgreSQL
├── unit/
│   └── aggregator.test.js  # Tests unitaires
└── integration/
    └── api.test.js       # Tests d'intégration API
```

### Couverture

| Fichier | Lignes | Fonctions | Branches |
|---------|--------|-----------|----------|
| routes/ | >80% | >80% | >70% |
| services/ | >70% | >70% | >70% |
| models/ | >70% | >70% | >70% |

## CI/CD

Pipeline GitHub Actions automatisé :

1. **Lint** : ESLint sur le code
2. **Test** : Jest avec couverture
3. **Build** : Vérification démarrage serveur
4. **Security** : npm audit
5. **Deploy** : Notification (branche main)

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches: [main, develop, 'feature/*']
  pull_request:
    branches: [main]
```

## Développement CV

Ce backend démontre les compétences suivantes:

- ✅ Architecture REST API professionnelle
- ✅ PostgreSQL avec migrations et triggers
- ✅ Agrégation de données multi-sources
- ✅ Classification automatique par ML-like rules
- ✅ Scheduler pour tâches asynchrones
- ✅ Sécurité (rate limiting, CORS, helmet)
- ✅ Documentation API complète
- ✅ Tests Jest (unit + integration)
- ✅ CI/CD GitHub Actions
- ✅ Coverage reporting

## Évolutions Futures

- [ ] Intégration NewsAPI / Alpha Vantage pour données temps réel
- [ ] WebSockets pour push notifications
- [ ] Analyse de sentiment NLP
- [ ] Cache Redis pour performance
- [ ] Docker containerization
- [ ] Kubernetes deployment

## Licence

MIT
