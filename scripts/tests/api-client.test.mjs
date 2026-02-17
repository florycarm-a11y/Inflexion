/**
 * Tests unitaires — api-client.js
 *
 * Exécution :  node --test scripts/tests/api-client.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zéro dépendance)
 *
 * Couvre :
 *   A. checkAPI — détection backend disponible / indisponible
 *   B. Fallbacks statiques — getSources, getCategories sans backend
 *   C. Static news helpers — _getStaticNews, _searchStaticNews
 *   D. Endpoints avec backend — request construction, réponse
 *   E. Fallback DataLoader — méthodes quand useAPI = false
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Simuler un DataLoader minimal en global avant de charger api-client
globalThis.DataLoader = {
    getMarkets: () => ({ quotes: [{ symbol: 'SPY', price: 5100 }] }),
    getCrypto: () => ({ prices: [{ id: 'bitcoin', price: 73000 }] }),
    getMacro: () => ({ series: [{ id: 'GDP', value: 25 }] }),
    getWorldBank: () => ({ countries: [] }),
    getNews: () => ({
        categories: {
            markets: [
                { title: 'Fed maintient taux', description: 'La Fed décide.', url: 'https://a.com/1', publishedAt: '2026-02-17T10:00:00Z' },
                { title: 'CAC 40 en hausse', description: 'Bourse de Paris.', url: 'https://a.com/2', publishedAt: '2026-02-17T09:00:00Z' },
            ],
            crypto: [
                { title: 'Bitcoin chute', description: 'BTC sous 73k.', url: 'https://a.com/3', publishedAt: '2026-02-17T08:00:00Z' },
            ],
        },
    }),
    getSentiment: () => ({ global: 'neutre' }),
    getAlerts: () => ({ alertes: [] }),
    getDailyBriefing: () => null,
    getDefi: () => null,
    getEuropeanMarkets: () => ({ indices: [] }),
    getFearGreed: () => ({ value: 42 }),
    getMeta: () => ({ updated: '2026-02-17T06:00:00Z' }),
    getPriceForSymbol: (sym) => {
        if (sym === 'BTC') return { price: 73000, change: -2.5, source: 'CoinGecko' };
        return null;
    },
    getNewsForSymbol: (sym) => {
        if (sym === 'BTC') return [{ title: 'BTC news', url: 'https://a.com/btc' }];
        return [];
    },
};

// Mock window pour éviter l'erreur window.location
globalThis.window = {
    location: { hostname: 'localhost' },
};

const require = createRequire(import.meta.url);
const InflexionAPI = require('../../api-client.js');

// ─── Helpers mock fetch ──────────────────────────────────────

let fetchCalls = [];
const originalFetch = globalThis.fetch;

function mockFetch(responses) {
    fetchCalls = [];
    let idx = 0;
    globalThis.fetch = async (url, opts) => {
        fetchCalls.push({ url, opts });
        const resp = responses[Math.min(idx++, responses.length - 1)];
        return {
            ok: resp.status >= 200 && resp.status < 300,
            status: resp.status,
            json: async () => resp.body,
            text: async () => JSON.stringify(resp.body),
        };
    };
}

function restoreFetch() {
    globalThis.fetch = originalFetch;
    fetchCalls = [];
}


// ═══════════════════════════════════════════════════════════════
// A. checkAPI — Détection backend
// ═══════════════════════════════════════════════════════════════

describe('A. checkAPI', () => {
    afterEach(() => restoreFetch());

    it('retourne true quand le backend est disponible', async () => {
        mockFetch([{ status: 200, body: { status: 'ok' } }]);
        const result = await InflexionAPI.checkAPI();
        assert.equal(result, true);
        assert.equal(InflexionAPI.isUsingAPI(), true);
    });

    it('retourne false quand le backend est indisponible', async () => {
        mockFetch([{ status: 500, body: {} }]);
        const result = await InflexionAPI.checkAPI();
        assert.equal(result, false);
        assert.equal(InflexionAPI.isUsingAPI(), false);
    });

    it('retourne false quand fetch échoue (network error)', async () => {
        globalThis.fetch = async () => { throw new Error('Network error'); };
        const result = await InflexionAPI.checkAPI();
        assert.equal(result, false);
        assert.equal(InflexionAPI.isUsingAPI(), false);
    });
});


// ═══════════════════════════════════════════════════════════════
// B. Fallbacks statiques — sans backend
// ═══════════════════════════════════════════════════════════════

describe('B. Fallbacks statiques (sans backend)', () => {
    beforeEach(async () => {
        // S'assurer qu'on est en mode fallback
        globalThis.fetch = async () => { throw new Error('No backend'); };
        await InflexionAPI.checkAPI();
    });

    afterEach(() => restoreFetch());

    it('getSources retourne la liste des 15 APIs', async () => {
        const sources = await InflexionAPI.getSources();
        assert.equal(sources.apis, 15);
        assert.equal(sources.rss, 122);
        assert.equal(sources.total, 137);
        assert.ok(sources.list.includes('Finnhub'));
        assert.ok(sources.list.includes('CoinGecko'));
    });

    it('getCategories retourne les 5 rubriques', async () => {
        const cats = await InflexionAPI.getCategories();
        assert.equal(cats.length, 5);
        const ids = cats.map(c => c.id);
        assert.ok(ids.includes('geopolitics'));
        assert.ok(ids.includes('markets'));
        assert.ok(ids.includes('crypto'));
        assert.ok(ids.includes('commodities'));
        assert.ok(ids.includes('ai_tech'));
    });

    it('getMarketData délègue à DataLoader', async () => {
        const data = await InflexionAPI.getMarketData();
        assert.ok(data.quotes);
        assert.equal(data.quotes[0].symbol, 'SPY');
    });

    it('getCryptoData délègue à DataLoader', async () => {
        const data = await InflexionAPI.getCryptoData();
        assert.ok(data.prices);
        assert.equal(data.prices[0].id, 'bitcoin');
    });

    it('getMacroData combine FRED + World Bank', async () => {
        const data = await InflexionAPI.getMacroData();
        assert.ok(data.fred);
        assert.ok(data.worldBank);
    });

    it('getSentiment délègue à DataLoader', async () => {
        const data = await InflexionAPI.getSentiment();
        assert.equal(data.global, 'neutre');
    });

    it('getAlerts délègue à DataLoader', async () => {
        const data = await InflexionAPI.getAlerts();
        assert.deepEqual(data.alertes, []);
    });

    it('getMeta délègue à DataLoader', async () => {
        const data = await InflexionAPI.getMeta();
        assert.ok(data.updated);
    });

    it('getPrice délègue à DataLoader.getPriceForSymbol', async () => {
        const data = await InflexionAPI.getPrice('BTC', 'crypto');
        assert.deepEqual(data, { price: 73000, change: -2.5, source: 'CoinGecko' });
    });

    it('getPrice retourne null pour symbole inconnu', async () => {
        const data = await InflexionAPI.getPrice('XXXYZ');
        assert.equal(data, null);
    });

    it('getNewsForSymbol délègue à DataLoader', async () => {
        const data = await InflexionAPI.getNewsForSymbol('BTC');
        assert.equal(data.length, 1);
        assert.equal(data[0].title, 'BTC news');
    });
});


// ═══════════════════════════════════════════════════════════════
// C. Static news helpers
// ═══════════════════════════════════════════════════════════════

describe('C. Static news fallbacks', () => {
    beforeEach(async () => {
        globalThis.fetch = async () => { throw new Error('No backend'); };
        await InflexionAPI.checkAPI();
    });

    afterEach(() => restoreFetch());

    it('getArticles retourne tous les articles triés par date', async () => {
        const articles = await InflexionAPI.getArticles();
        assert.equal(articles.length, 3); // 2 markets + 1 crypto
        // Premier article doit être le plus récent
        assert.ok(new Date(articles[0].publishedAt) >= new Date(articles[1].publishedAt));
    });

    it('getArticles filtre par catégorie', async () => {
        const articles = await InflexionAPI.getArticles({ category: 'crypto' });
        assert.equal(articles.length, 1);
        assert.ok(articles[0].title.includes('Bitcoin'));
    });

    it('getArticles respecte limit et offset', async () => {
        const articles = await InflexionAPI.getArticles({ limit: 1, offset: 1 });
        assert.equal(articles.length, 1);
    });

    it('getLatest retourne les N derniers articles', async () => {
        const articles = await InflexionAPI.getLatest(2);
        assert.equal(articles.length, 2);
    });

    it('search trouve les articles correspondants', async () => {
        const results = await InflexionAPI.search('bitcoin');
        assert.equal(results.length, 1);
        assert.ok(results[0].title.toLowerCase().includes('bitcoin'));
    });

    it('search retourne un tableau vide pour une requête vide', async () => {
        const results = await InflexionAPI.search('');
        assert.deepEqual(results, []);
    });

    it('search retourne un tableau vide pour un terme introuvable', async () => {
        const results = await InflexionAPI.search('xyznonexistent');
        assert.deepEqual(results, []);
    });
});


// ═══════════════════════════════════════════════════════════════
// D. Endpoints avec backend actif
// ═══════════════════════════════════════════════════════════════

describe('D. Endpoints avec backend', () => {
    beforeEach(async () => {
        // D'abord activer le backend
        mockFetch([{ status: 200, body: { status: 'ok' } }]);
        await InflexionAPI.checkAPI();
        assert.equal(InflexionAPI.isUsingAPI(), true);
    });

    afterEach(() => restoreFetch());

    it('getMarketData appelle /market', async () => {
        mockFetch([{ status: 200, body: { data: { indices: [] } } }]);
        const data = await InflexionAPI.getMarketData();
        assert.ok(fetchCalls.some(c => c.url.includes('/market')));
    });

    it('getArticles construit les query params', async () => {
        mockFetch([{ status: 200, body: { data: [] } }]);
        await InflexionAPI.getArticles({ category: 'crypto', limit: 5 });
        const call = fetchCalls.find(c => c.url.includes('/articles'));
        assert.ok(call, 'Devrait appeler /articles');
        assert.ok(call.url.includes('category=crypto'));
        assert.ok(call.url.includes('limit=5'));
    });

    it('getPrice appelle /price/:symbol', async () => {
        mockFetch([{ status: 200, body: { data: { price: 73000 } } }]);
        await InflexionAPI.getPrice('BTC', 'crypto');
        const call = fetchCalls.find(c => c.url.includes('/price/BTC'));
        assert.ok(call, 'Devrait appeler /price/BTC');
        assert.ok(call.url.includes('category=crypto'));
    });

    it('search appelle /search avec query', async () => {
        mockFetch([{ status: 200, body: { data: [] } }]);
        await InflexionAPI.search('bitcoin');
        const call = fetchCalls.find(c => c.url.includes('/search'));
        assert.ok(call, 'Devrait appeler /search');
        assert.ok(call.url.includes('q=bitcoin'));
    });

    it('gère une erreur API (status 500)', async () => {
        mockFetch([{ status: 500, body: {} }]);
        await assert.rejects(
            () => InflexionAPI.getMarketData(),
            (err) => {
                assert.ok(err.message.includes('500'));
                return true;
            }
        );
    });
});


// ═══════════════════════════════════════════════════════════════
// E. Fallback DataLoader quand getPrice backend échoue
// ═══════════════════════════════════════════════════════════════

describe('E. Fallback gracieux', () => {
    afterEach(() => restoreFetch());

    it('getPrice fallback vers DataLoader si backend échoue', async () => {
        // Active le backend
        mockFetch([{ status: 200, body: { status: 'ok' } }]);
        await InflexionAPI.checkAPI();

        // Puis simule une erreur sur /price
        mockFetch([{ status: 500, body: {} }]);
        const data = await InflexionAPI.getPrice('BTC', 'crypto');
        // Doit tomber sur DataLoader mock
        assert.deepEqual(data, { price: 73000, change: -2.5, source: 'CoinGecko' });
    });

    it('getNewsForSymbol fallback vers DataLoader si backend échoue', async () => {
        mockFetch([{ status: 200, body: { status: 'ok' } }]);
        await InflexionAPI.checkAPI();

        mockFetch([{ status: 500, body: {} }]);
        const data = await InflexionAPI.getNewsForSymbol('BTC');
        assert.equal(data.length, 1);
        assert.equal(data[0].title, 'BTC news');
    });
});
