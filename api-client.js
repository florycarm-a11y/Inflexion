/**
 * Inflexion API Client — RESTful Data Layer
 *
 * Couche d'accès unifiée aux données Inflexion.
 *
 * Architecture double :
 *   1. Backend API (Node.js) — si disponible (localhost ou serveur)
 *   2. Static Data API — accès direct aux JSON via DataLoader (GitHub Pages)
 *
 * Endpoints REST exposés :
 *   GET /api/articles         — Articles avec filtres (category, source, impact)
 *   GET /api/articles/featured — Articles mis en avant
 *   GET /api/articles/breaking — Breaking news
 *   GET /api/articles/latest  — Derniers articles
 *   GET /api/market           — Données marchés
 *   GET /api/crypto           — Données crypto
 *   GET /api/macro            — Indicateurs macro (FRED + World Bank)
 *   GET /api/sentiment        — Sentiment IA
 *   GET /api/alerts           — Alertes marché
 *   GET /api/briefing         — Briefing stratégique quotidien
 *   GET /api/defi             — DeFi & Yields
 *   GET /api/european-markets — Indices européens
 *   GET /api/commodities      — Matières premières
 *   GET /api/watchlist/:code  — Watchlist partagée (publique)
 *   GET /api/price/:symbol    — Prix live par symbole
 *   GET /api/news/:symbol     — Actualités liées à un symbole
 *   GET /api/search?q=        — Recherche articles
 *   GET /api/sources          — Liste des sources
 *   GET /api/categories       — Catégories disponibles
 *   GET /api/meta             — Métadonnées du pipeline
 */
const InflexionAPI = (function () {
    'use strict';

    var BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'http://localhost:3001/api'
        : '/api';
    var useAPI = false;
    var apiAvailable = false;

    // ─── Backend API check ──────────────────────────────────────

    async function checkAPI() {
        try {
            var response = await fetch(BASE_URL + '/../health', {
                method: 'GET'
            });
            if (response.ok) {
                apiAvailable = true;
                useAPI = true;
                console.log('[InflexionAPI] Backend connecté');
                return true;
            }
        } catch (e) {
            // Backend non disponible
        }
        apiAvailable = false;
        useAPI = false;
        return false;
    }

    async function request(endpoint, options) {
        if (!useAPI) {
            throw new Error('API not available');
        }

        var url = BASE_URL + endpoint;
        var response = await fetch(url, Object.assign({
            headers: { 'Content-Type': 'application/json' }
        }, options || {}));

        if (!response.ok) {
            throw new Error('API error: ' + response.status);
        }

        return response.json();
    }

    // ─── Articles ───────────────────────────────────────────────

    async function getArticles(opts) {
        opts = opts || {};
        // Essayer le backend d'abord
        if (useAPI) {
            var params = new URLSearchParams();
            if (opts.category) params.append('category', opts.category);
            if (opts.source) params.append('source', opts.source);
            if (opts.impact) params.append('impact', opts.impact);
            params.append('limit', opts.limit || 20);
            params.append('offset', opts.offset || 0);
            var result = await request('/articles?' + params);
            return result.data;
        }
        // Fallback : DataLoader
        return _getStaticNews(opts);
    }

    async function getFeatured(limit) {
        if (useAPI) {
            var result = await request('/articles/featured?limit=' + (limit || 3));
            return result.data;
        }
        return _getStaticTopStories(limit || 3);
    }

    async function getBreaking(limit) {
        if (useAPI) {
            var result = await request('/articles/breaking?limit=' + (limit || 10));
            return result.data;
        }
        return _getStaticNews({ limit: limit || 10 });
    }

    async function getLatest(limit) {
        if (useAPI) {
            var result = await request('/articles/latest?limit=' + (limit || 10));
            return result.data;
        }
        return _getStaticNews({ limit: limit || 10 });
    }

    // ─── Données marché ─────────────────────────────────────────

    async function getMarketData() {
        if (useAPI) {
            var result = await request('/market');
            return result.data;
        }
        if (typeof DataLoader !== 'undefined') return DataLoader.getMarkets();
        return null;
    }

    async function getCryptoData() {
        if (useAPI) {
            var result = await request('/crypto');
            return result.data;
        }
        if (typeof DataLoader !== 'undefined') return DataLoader.getCrypto();
        return null;
    }

    async function getMacroData() {
        if (useAPI) {
            var result = await request('/macro');
            return result.data;
        }
        if (typeof DataLoader === 'undefined') return null;
        return {
            fred: DataLoader.getMacro(),
            worldBank: DataLoader.getWorldBank()
        };
    }

    async function getSentiment() {
        if (useAPI) {
            var result = await request('/sentiment');
            return result.data;
        }
        if (typeof DataLoader !== 'undefined') return DataLoader.getSentiment();
        return null;
    }

    async function getAlerts() {
        if (useAPI) {
            var result = await request('/alerts');
            return result.data;
        }
        if (typeof DataLoader !== 'undefined') return DataLoader.getAlerts();
        return null;
    }

    async function getDailyBriefing() {
        if (useAPI) {
            var result = await request('/briefing');
            return result.data;
        }
        if (typeof DataLoader !== 'undefined') return DataLoader.getDailyBriefing();
        return null;
    }

    async function getDefiData() {
        if (useAPI) {
            var result = await request('/defi');
            return result.data;
        }
        if (typeof DataLoader !== 'undefined') return DataLoader.getDefi();
        return null;
    }

    async function getEuropeanMarkets() {
        if (useAPI) {
            var result = await request('/european-markets');
            return result.data;
        }
        if (typeof DataLoader !== 'undefined') return DataLoader.getEuropeanMarkets();
        return null;
    }

    async function getFearGreed() {
        if (useAPI) {
            var result = await request('/fear-greed');
            return result.data;
        }
        if (typeof DataLoader !== 'undefined') return DataLoader.getFearGreed();
        return null;
    }

    // ─── Watchlist & Prix par symbole ───────────────────────────

    /**
     * Récupère le prix live d'un actif par symbole.
     * Utilise le backend si disponible, sinon DataLoader.
     *
     * @param {string} symbol - Symbole (ex: BTC, AAPL, XAU)
     * @param {string} [category] - Catégorie optionnelle
     * @returns {Object|null} { price, change, source }
     */
    async function getPrice(symbol, category) {
        if (useAPI) {
            try {
                var result = await request('/price/' + encodeURIComponent(symbol) + (category ? '?category=' + category : ''));
                return result.data;
            } catch (e) {
                // Fallback
            }
        }
        if (typeof DataLoader !== 'undefined') {
            return DataLoader.getPriceForSymbol(symbol, category);
        }
        return null;
    }

    /**
     * Récupère les actualités liées à un symbole.
     *
     * @param {string} symbol - Symbole
     * @param {string} [label] - Nom complet
     * @returns {Array} Articles
     */
    async function getNewsForSymbol(symbol, label) {
        if (useAPI) {
            try {
                var params = label ? '?label=' + encodeURIComponent(label) : '';
                var result = await request('/news/' + encodeURIComponent(symbol) + params);
                return result.data;
            } catch (e) {
                // Fallback
            }
        }
        if (typeof DataLoader !== 'undefined') {
            return DataLoader.getNewsForSymbol(symbol, label);
        }
        return [];
    }

    /**
     * Charge une watchlist partagée via son code.
     * Délègue à InflexionAuth si disponible, sinon essaie le backend.
     *
     * @param {string} shareCode - Code de partage
     * @returns {Object|null} { name, items[] }
     */
    async function getSharedWatchlist(shareCode) {
        if (useAPI) {
            try {
                var result = await request('/watchlist/' + encodeURIComponent(shareCode));
                return result.data;
            } catch (e) {
                // Fallback
            }
        }
        if (typeof InflexionAuth !== 'undefined') {
            return InflexionAuth.loadSharedWatchlist(shareCode);
        }
        return null;
    }

    // ─── Recherche ──────────────────────────────────────────────

    async function search(query, options) {
        if (useAPI) {
            var params = new URLSearchParams(Object.assign({ q: query }, options || {}));
            var result = await request('/search?' + params);
            return result.data;
        }
        // Recherche locale dans DataLoader
        return _searchStaticNews(query);
    }

    // ─── Métadonnées ────────────────────────────────────────────

    async function getSources() {
        if (useAPI) {
            var result = await request('/sources');
            return result.data;
        }
        return {
            apis: 15,
            rss: 122,
            total: 137,
            list: [
                'Finnhub', 'GNews', 'FRED', 'Alpha Vantage', 'Messari',
                'Twelve Data', 'NewsAPI', 'CoinGecko', 'Alternative.me',
                'DefiLlama', 'metals.dev', 'Etherscan', 'Mempool.space',
                'ECB', 'World Bank'
            ]
        };
    }

    async function getCategories() {
        if (useAPI) {
            var result = await request('/categories');
            return result.data;
        }
        return [
            { id: 'geopolitics', label: 'Géopolitique' },
            { id: 'markets', label: 'Marchés & Finance' },
            { id: 'crypto', label: 'Crypto & Blockchain' },
            { id: 'commodities', label: 'Matières Premières' },
            { id: 'ai_tech', label: 'IA & Tech' }
        ];
    }

    async function getMeta() {
        if (useAPI) {
            var result = await request('/meta');
            return result.data;
        }
        if (typeof DataLoader !== 'undefined') return DataLoader.getMeta();
        return null;
    }

    // ─── Static fallbacks (DataLoader) ──────────────────────────

    function _getStaticNews(opts) {
        if (typeof DataLoader === 'undefined' || !DataLoader.getNews()) return [];
        opts = opts || {};
        var categories = DataLoader.getNews().categories || {};
        var articles = [];

        if (opts.category) {
            articles = categories[opts.category] || [];
        } else {
            Object.values(categories).forEach(function (arr) {
                articles = articles.concat(arr);
            });
        }

        articles.sort(function (a, b) {
            return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
        });

        var offset = opts.offset || 0;
        var limit = opts.limit || 20;
        return articles.slice(offset, offset + limit);
    }

    function _getStaticTopStories(limit) {
        var all = _getStaticNews({ limit: 50 });
        return all.slice(0, limit || 3);
    }

    function _searchStaticNews(query) {
        if (typeof DataLoader === 'undefined' || !DataLoader.getNews()) return [];
        var q = (query || '').toLowerCase();
        if (!q) return [];

        var categories = DataLoader.getNews().categories || {};
        var results = [];

        Object.values(categories).forEach(function (arr) {
            arr.forEach(function (a) {
                var text = ((a.title || '') + ' ' + (a.description || '')).toLowerCase();
                if (text.includes(q)) {
                    results.push(a);
                }
            });
        });

        results.sort(function (a, b) {
            return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
        });

        return results.slice(0, 30);
    }

    // ─── Init ───────────────────────────────────────────────────

    async function init() {
        await checkAPI();
        return apiAvailable;
    }

    function isUsingAPI() {
        return useAPI;
    }

    // ─── Public API ─────────────────────────────────────────────

    return {
        init: init,
        isUsingAPI: isUsingAPI,
        checkAPI: checkAPI,

        // Articles & News
        getArticles: getArticles,
        getFeatured: getFeatured,
        getBreaking: getBreaking,
        getLatest: getLatest,
        search: search,

        // Marchés & Données
        getMarketData: getMarketData,
        getCryptoData: getCryptoData,
        getMacroData: getMacroData,
        getDefiData: getDefiData,
        getEuropeanMarkets: getEuropeanMarkets,
        getFearGreed: getFearGreed,

        // IA & Analyses
        getSentiment: getSentiment,
        getAlerts: getAlerts,
        getDailyBriefing: getDailyBriefing,

        // Watchlist & Prix
        getPrice: getPrice,
        getNewsForSymbol: getNewsForSymbol,
        getSharedWatchlist: getSharedWatchlist,

        // Métadonnées
        getSources: getSources,
        getCategories: getCategories,
        getMeta: getMeta
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InflexionAPI;
}
