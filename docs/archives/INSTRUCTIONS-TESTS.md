# Fiche d'instructions — Session tests Inflexion

## Contexte

Inflexion est une plateforme d'intelligence financiere (15 APIs, 122 RSS, IA Claude). Le code est en **JavaScript vanilla** (zero framework frontend, Node.js pour les scripts). Les tests utilisent `node:test` + `node:assert/strict` (zero dependance externe).

**Branche** : `claude/inflexion-watchlist-status-oiaVG`
**Dernier commit** : `30e5937` — Ajouter 97 tests unitaires pour data-loader.js et api-client.js

## Etat actuel des tests

**132 tests, 0 failures** repartis en 3 fichiers :

| Fichier test | Module teste | Tests | Couvre |
|---|---|---|---|
| `scripts/tests/lib/claude-api.test.mjs` | `scripts/lib/claude-api.mjs` | 35 | Erreurs, retry, JSON parsing, usage stats, classifyText |
| `scripts/tests/data-loader.test.mjs` | `data-loader.js` | 69 | formatUSD, formatPercent, isFresh, scoreArticle, curateArticles, truncateTitle, isSummaryRedundant, isArticleRelevant, getPriceForSymbol, getNewsForSymbol, getAlertsForSymbol, SOURCE_TIERS |
| `scripts/tests/api-client.test.mjs` | `api-client.js` | 28 | checkAPI, fallbacks DataLoader (11 endpoints), static news helpers, construction URLs backend, fallback gracieux |

**CI** : `.github/workflows/ci.yml` execute les 3 fichiers de tests (job `test-scripts`).

## Ce qui reste a tester — par priorite

### Priorite 1 : `scripts/fetch-data.mjs` — Parsing RSS/HTML (CRITIQUE)

**Pourquoi** : Toute la qualite des donnees depend de ces fonctions. Un bug dans `stripHTML` ou `extractRSSFields` casse l'affichage de 122 sources.

**Fonctions a tester** (pures, sans effet de bord) :

| Fonction | Ligne | Description |
|---|---|---|
| `stripHTML(str)` | L103 | Nettoie les tags HTML, unescappe les entites (&amp; → &, etc.) |
| `extractRSSFields(block)` | L113 | Parse un bloc XML RSS → {title, description, link, pubDate, image} |
| `extractAtomFields(block)` | L141 | Idem pour Atom 1.0 |
| `parseRSSItems(xml)` | L164 | Decoupe le XML en blocs `<item>` ou `<entry>`, appelle extractRSS/Atom |
| `isRelevantForCategory(article, categoryKey, sourceName)` | L378 | Filtre les articles hors-sujet par rubrique |
| `formatDate(isoDate)` | L1024 | Normalise les dates en ISO |
| `isMarketOpen()` | L834 | Verifie si le marche US est ouvert |
| `isEuropeanMarketOpen()` | L1796 | Verifie si le marche EU est ouvert |

**Prerequis** : Ces fonctions ne sont **pas exportees**. Il faut :
1. Ajouter un bloc d'export en fin de fichier (meme pattern que data-loader.js) :
```javascript
// Export pour tests unitaires
export { stripHTML, extractRSSFields, extractAtomFields, parseRSSItems,
         isRelevantForCategory, formatDate, isMarketOpen, isEuropeanMarketOpen };
```
2. Le fichier fait `main().catch(...)` en fin — l'import ES6 va l'executer. Garder l'appel `main()` derriere un guard :
```javascript
// Ne pas lancer main() si importe comme module de test
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
    main().catch(err => { console.error('Erreur fatale:', err); process.exit(1); });
}
```
3. Creer `scripts/tests/fetch-data.test.mjs` avec `import { stripHTML, ... } from '../../scripts/fetch-data.mjs'`

**Tests a ecrire** (~30 tests) :
- `stripHTML` : tags simples, imbriques, entites HTML (&amp; &lt; &gt; &quot;), texte vide, null
- `extractRSSFields` : bloc RSS complet, champs manquants, CDATA, image dans enclosure vs media:content
- `extractAtomFields` : bloc Atom complet, link rel="alternate", content vs summary
- `parseRSSItems` : XML RSS valide, XML Atom valide, XML vide, XML malformed
- `isRelevantForCategory` : article finance dans 'markets' (ok), article sport dans 'markets' (rejet), tier-based filtering
- `formatDate` : ISO valide, format RFC-822, null
- `isMarketOpen/isEuropeanMarketOpen` : mocker `Date.now()` pour tester horaires

### Priorite 2 : `app.js` — escapeHTML (SECURITE)

**Pourquoi** : Prevention XSS. La fonction est utilisee partout dans le rendu HTML.

**Fonction** : `escapeHTML(str)` a la ligne 57.

**Prerequis** : `app.js` est un script browser sans `module.exports`. Il faut :
1. Ajouter en fin de fichier :
```javascript
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHTML, cardHTML };
}
```
2. `app.js` utilise `document` — garder les appels DOM derriere `typeof document !== 'undefined'`

**Tests a ecrire** (~8 tests) :
- Caracteres de base : `<`, `>`, `&`, `"`, `'`
- Vecteurs XSS : `<script>alert(1)</script>`, `" onmouseover="alert(1)`, `javascript:alert(1)`
- Cas limites : string vide, null/undefined, texte sans caracteres speciaux

### Priorite 3 : `supabase-client.js` — Logique metier watchlist

**Pourquoi** : Features phares (alertes croisees, partage, rapports) sans aucun test.

**Fonctions a tester** :

| Fonction | Ligne | Description |
|---|---|---|
| `generateShareCode()` | L730 | Genere un code alphanumerique 12 chars |
| `computeCrossAlerts()` | L305 | Croise watchlist x news x alertes IA |
| `generateReport()` | L919 | Genere un rapport HTML portfolio |
| `enrichWatchlistWithLiveData()` | L273 | Enrichit chaque actif avec prix live |
| `shareWatchlist(name)` | L552 | Cree un partage (DB + code) |
| `loadSharedWatchlist(shareCode)` | L582 | Charge une watchlist partagee |

**Prerequis** : `supabase-client.js` est un IIFE qui accede a `window.InflexionAuth` et `document`. Il faut :
1. Exposer les fonctions pures dans `window.InflexionAuth._internals` (meme pattern que `DataLoader._internals`)
2. Mocker `window`, `document`, et le client Supabase
3. Mocker `DataLoader` (deja fait dans api-client.test.mjs — reutiliser le pattern)

**Tests a ecrire** (~25 tests) :
- `generateShareCode` : longueur 12, alphanumerique, unicite sur 1000 generations
- `computeCrossAlerts` : match exact symbole, match via alias, pas de faux positifs, severite correcte
- `generateReport` : contenu HTML, resume portfolio (hausse/baisse), alertes incluses
- `enrichWatchlistWithLiveData` : prix trouves, prix manquants (graceful), sources variees

### Priorite 4 : `scripts/generate-daily-briefing.mjs` — Selection articles

**Pourquoi** : La qualite du briefing strategique depend de `selectTopArticles`.

**Fonctions** (aucune exportee, meme prerequis que fetch-data.mjs) :

| Fonction | Ligne | Description |
|---|---|---|
| `selectTopArticles(newsData)` | L92 | Selectionne 20-30 articles (max 48h, max 8/categorie) |
| `formatNewsContext(articles)` | L154 | Groupe par categorie → markdown |
| `formatMarkets(data)` | L200 | Quotes Finnhub → markdown |
| `formatCrypto(data)` | L215 | CoinGecko → markdown |
| `formatFearGreed(data)` | L242 | Fear & Greed → markdown |
| `formatMacro(data)` | L267 | FRED → markdown |

**Tests a ecrire** (~20 tests) :
- `selectTopArticles` : max articles/categorie, filtre >48h, descriptions privilegiees, donnees vides
- Formatters : sortie markdown valide, donnees manquantes, valeurs extremes

## Patterns de test a suivre

### Framework
```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
```

### Import IIFE (browser modules avec CommonJS fallback)
```javascript
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Module = require('../../module-name.js');
```

### Import ES modules (.mjs)
```javascript
import { functionName } from '../../scripts/some-script.mjs';
```

### Mock fetch
```javascript
function mockFetch(responses) {
    let idx = 0;
    globalThis.fetch = async (url, opts) => {
        const resp = responses[Math.min(idx++, responses.length - 1)];
        return {
            ok: resp.status >= 200 && resp.status < 300,
            status: resp.status,
            json: async () => resp.body,
            text: async () => JSON.stringify(resp.body),
        };
    };
}
```

### Mock DataLoader (pour tests supabase-client)
```javascript
globalThis.DataLoader = {
    getPriceForSymbol: (sym) => sym === 'BTC' ? { price: 73000, change: -2.5, source: 'CoinGecko' } : null,
    getNewsForSymbol: (sym) => sym === 'BTC' ? [{ title: 'BTC news', url: 'https://a.com/btc' }] : [],
    getAlertsForSymbol: (sym) => sym === 'BTC' ? [{ titre: 'Alerte BTC', texte: 'Support casse' }] : [],
    getSentiment: () => ({ global: 'neutre' }),
    getFearGreed: () => ({ value: 42 }),
};
```

### Convention de nommage
- Fichier : `scripts/tests/<module-name>.test.mjs`
- Suites : lettres alphabetiques `describe('A. nomSuite', ...)`
- Tests en francais : `it('trouve un prix crypto dans CoinGecko', ...)`

## Commandes

```bash
# Lancer tous les tests
node --test scripts/tests/lib/claude-api.test.mjs scripts/tests/data-loader.test.mjs scripts/tests/api-client.test.mjs

# Lancer un fichier specifique
node --test scripts/tests/fetch-data.test.mjs

# Verifier le total
node --test scripts/tests/**/*.test.mjs scripts/tests/*.test.mjs 2>&1 | grep -E "^# (tests|pass|fail)"
```

## Rappels importants

- **Zero dependance externe** : pas de Jest, Vitest, jsdom. Uniquement `node:test` + `node:assert/strict`
- **Ne pas casser les 132 tests existants** : toujours lancer la suite complete avant de commit
- **Exposer les internals proprement** : utiliser `_internals` (data-loader pattern) ou `export` (ES modules)
- **Garder les appels `main()` derriere un guard** quand on ajoute des exports a des scripts CLI
- **CI** : les nouveaux fichiers de test doivent etre ajoutes dans `.github/workflows/ci.yml` (job `test-scripts`)
- Le fichier `data-loader.js` a deja ete modifie pour exposer `_internals` et garder `document.addEventListener` — ne pas reverter
