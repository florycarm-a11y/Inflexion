/**
 * Tests unitaires — supabase-client.js (logique metier watchlist)
 *
 * Execution :  node --test scripts/tests/supabase-client.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zero dependance)
 *
 * Couvre :
 *   A. generateShareCode       (generation code alphanumerique)
 *   B. enrichWatchlistWithLiveData (enrichissement prix live)
 *   C. computeCrossAlerts      (croisement watchlist x news x alertes)
 *   D. generateReport          (generation rapport HTML)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// ─── Mocks browser globals ──────────────────────────────────

// Mock DataLoader (meme pattern que api-client.test.mjs)
globalThis.DataLoader = {
    isInitialized: () => true,
    getPriceForSymbol: (sym) => {
        const prices = {
            BTC: { price: 73000, change: -2.5, source: 'CoinGecko' },
            ETH: { price: 3200, change: 1.8, source: 'CoinGecko' },
            AAPL: { price: 185, change: 0.45, source: 'Finnhub' },
        };
        return prices[sym] || null;
    },
    getNewsForSymbol: (sym) => {
        if (sym === 'BTC') return [
            { title: 'Bitcoin depasse 73k', description: 'Le BTC remonte.', url: 'https://a.com/btc', source: 'CoinDesk', time: 'Il y a 2h' },
        ];
        if (sym === 'ETH') return [
            { title: 'Ethereum staking record', description: 'Le staking ETH atteint des sommets.', url: 'https://a.com/eth', source: 'The Block', time: 'Il y a 3h' },
        ];
        return [];
    },
    getAlertsForSymbol: (sym) => {
        if (sym === 'BTC') return [
            { titre: 'Support BTC casse', texte: 'Le support a 72k a ete casse', severite: 'urgent' },
        ];
        return [];
    },
    getSentiment: () => ({ global: { tendance: 'neutre', score: 0.12, resume: 'Marche stable' } }),
    getFearGreed: () => ({ current: { value: 42, label: 'Fear' } }),
    formatUSD: (n) => '$' + n.toFixed(2),
};

// Mock document minimal
globalThis.document = {
    readyState: null, // empeche auto-init
    getElementById: () => null,
    querySelector: () => null,
    createElement: (tag) => {
        let _html = '';
        return {
            className: '',
            textContent: '',
            classList: { add: () => {}, remove: () => {} },
            appendChild: (child) => {
                if (child && child._text != null) {
                    _html = child._text
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
                }
            },
            get innerHTML() { return _html; },
            remove: () => {},
        };
    },
    createTextNode: (text) => ({ _text: String(text || '') }),
    body: { appendChild: () => {} },
    addEventListener: () => {},
};

// Mock window
globalThis.window = globalThis.window || {};
globalThis.window.location = { hostname: 'localhost', origin: 'http://localhost', pathname: '/', search: '' };
globalThis.window.open = () => {};

// Mock Blob et URL pour generateReport
let _lastBlobContent = '';
globalThis.Blob = class Blob {
    constructor(parts) { _lastBlobContent = parts.join(''); }
};
globalThis.URL = { createObjectURL: () => 'blob:test' };
globalThis.requestAnimationFrame = (fn) => fn();

const require = createRequire(import.meta.url);
const InflexionAuth = require('../../supabase-client.js');

const {
    generateShareCode,
    computeCrossAlerts,
    enrichWatchlistWithLiveData,
    generateReport,
    _setWatchlistItems,
    _setCrossAlerts,
    _setCurrentUser,
    _getWatchlistItems,
    _getCrossAlerts,
} = InflexionAuth._internals;


// ═══════════════════════════════════════════════════════════════
// A. generateShareCode — generation code alphanumerique
// ═══════════════════════════════════════════════════════════════

describe('A. generateShareCode', () => {
    it('genere un code de 12 caracteres', () => {
        const code = generateShareCode();
        assert.equal(code.length, 12);
    });

    it('genere uniquement des caracteres alphanumeriques', () => {
        const code = generateShareCode();
        assert.match(code, /^[A-Za-z0-9]{12}$/);
    });

    it('genere des codes uniques sur 100 generations', () => {
        const codes = new Set();
        for (let i = 0; i < 100; i++) {
            codes.add(generateShareCode());
        }
        // Avec 62^12 combinaisons, aucun doublon sur 100
        assert.equal(codes.size, 100);
    });

    it('genere des codes differents a chaque appel', () => {
        const code1 = generateShareCode();
        const code2 = generateShareCode();
        assert.notEqual(code1, code2);
    });
});


// ═══════════════════════════════════════════════════════════════
// B. enrichWatchlistWithLiveData — enrichissement prix live
// ═══════════════════════════════════════════════════════════════

describe('B. enrichWatchlistWithLiveData', () => {
    beforeEach(() => {
        _setWatchlistItems([]);
        _setCrossAlerts([]);
    });

    it('enrichit un actif crypto avec prix et variation', () => {
        _setWatchlistItems([{ symbol: 'BTC', category: 'crypto' }]);
        enrichWatchlistWithLiveData();
        const items = _getWatchlistItems();
        assert.equal(items[0]._price, 73000);
        assert.equal(items[0]._change, -2.5);
        assert.equal(items[0]._source, 'CoinGecko');
    });

    it('enrichit un actif action avec prix', () => {
        _setWatchlistItems([{ symbol: 'AAPL', category: 'stock' }]);
        enrichWatchlistWithLiveData();
        const items = _getWatchlistItems();
        assert.equal(items[0]._price, 185);
        assert.equal(items[0]._source, 'Finnhub');
    });

    it('met null quand le prix est introuvable', () => {
        _setWatchlistItems([{ symbol: 'UNKNOWN', category: 'other' }]);
        enrichWatchlistWithLiveData();
        const items = _getWatchlistItems();
        assert.equal(items[0]._price, null);
        assert.equal(items[0]._change, null);
        assert.equal(items[0]._source, null);
    });

    it('enrichit plusieurs actifs en une passe', () => {
        _setWatchlistItems([
            { symbol: 'BTC', category: 'crypto' },
            { symbol: 'ETH', category: 'crypto' },
            { symbol: 'UNKNOWN', category: 'other' },
        ]);
        enrichWatchlistWithLiveData();
        const items = _getWatchlistItems();
        assert.equal(items[0]._price, 73000);
        assert.equal(items[1]._price, 3200);
        assert.equal(items[2]._price, null);
    });

    it('ne crash pas avec une watchlist vide', () => {
        _setWatchlistItems([]);
        enrichWatchlistWithLiveData();
        assert.equal(_getWatchlistItems().length, 0);
    });
});


// ═══════════════════════════════════════════════════════════════
// C. computeCrossAlerts — croisement watchlist x news x alertes
// ═══════════════════════════════════════════════════════════════

describe('C. computeCrossAlerts', () => {
    beforeEach(() => {
        _setWatchlistItems([]);
        _setCrossAlerts([]);
    });

    it('detecte une alerte IA pour un actif suivi', () => {
        _setWatchlistItems([{ symbol: 'BTC', category: 'crypto' }]);
        computeCrossAlerts();
        const alerts = _getCrossAlerts();
        const iaAlert = alerts.find(a => a.type === 'alert' && a.symbol === 'BTC');
        assert.ok(iaAlert);
        assert.equal(iaAlert.title, 'Support BTC casse');
        assert.equal(iaAlert.severity, 'urgent');
        assert.equal(iaAlert.source, 'Claude IA');
    });

    it('detecte une actualite pour un actif suivi', () => {
        _setWatchlistItems([{ symbol: 'BTC', category: 'crypto', label: 'Bitcoin' }]);
        computeCrossAlerts();
        const alerts = _getCrossAlerts();
        const newsAlert = alerts.find(a => a.type === 'news' && a.symbol === 'BTC');
        assert.ok(newsAlert);
        assert.equal(newsAlert.source, 'CoinDesk');
    });

    it('trie les alertes par severite (urgent en premier)', () => {
        _setWatchlistItems([
            { symbol: 'BTC', category: 'crypto', label: 'Bitcoin' },
            { symbol: 'ETH', category: 'crypto', label: 'Ethereum' },
        ]);
        computeCrossAlerts();
        const alerts = _getCrossAlerts();
        // BTC a une alerte urgent, les news sont info
        assert.ok(alerts.length > 0);
        assert.equal(alerts[0].severity, 'urgent');
    });

    it('ne produit pas de doublons', () => {
        _setWatchlistItems([{ symbol: 'BTC', category: 'crypto', label: 'Bitcoin' }]);
        computeCrossAlerts();
        const alerts = _getCrossAlerts();
        const titles = alerts.map(a => a.title);
        const uniqueTitles = [...new Set(titles)];
        assert.equal(titles.length, uniqueTitles.length);
    });

    it('retourne zero alertes pour un actif sans mentions', () => {
        _setWatchlistItems([{ symbol: 'UNKNOWN', category: 'other', label: 'Inconnu' }]);
        computeCrossAlerts();
        assert.equal(_getCrossAlerts().length, 0);
    });

    it('ne crash pas avec une watchlist vide', () => {
        _setWatchlistItems([]);
        computeCrossAlerts();
        assert.equal(_getCrossAlerts().length, 0);
    });

    it('croise plusieurs actifs en une passe', () => {
        _setWatchlistItems([
            { symbol: 'BTC', category: 'crypto', label: 'Bitcoin' },
            { symbol: 'ETH', category: 'crypto', label: 'Ethereum' },
        ]);
        computeCrossAlerts();
        const alerts = _getCrossAlerts();
        const btcAlerts = alerts.filter(a => a.symbol === 'BTC');
        const ethAlerts = alerts.filter(a => a.symbol === 'ETH');
        assert.ok(btcAlerts.length > 0);
        assert.ok(ethAlerts.length > 0);
    });
});


// ═══════════════════════════════════════════════════════════════
// D. generateReport — generation rapport HTML
// ═══════════════════════════════════════════════════════════════

describe('D. generateReport', () => {
    beforeEach(() => {
        _lastBlobContent = '';
        _setCurrentUser({ id: '123', email: 'test@example.com' });
    });

    it('genere un rapport HTML contenant les actifs', () => {
        _setWatchlistItems([
            { symbol: 'BTC', category: 'crypto', label: 'Bitcoin', _price: 73000, _change: -2.5, _source: 'CoinGecko' },
        ]);
        _setCrossAlerts([]);
        generateReport();
        assert.ok(_lastBlobContent.includes('BTC'));
        assert.ok(_lastBlobContent.includes('Rapport Watchlist'));
    });

    it('inclut le resume portfolio (hausse/baisse)', () => {
        _setWatchlistItems([
            { symbol: 'BTC', category: 'crypto', _price: 73000, _change: -2.5, _source: 'CoinGecko' },
            { symbol: 'ETH', category: 'crypto', _price: 3200, _change: 1.8, _source: 'CoinGecko' },
            { symbol: 'AAPL', category: 'stock', _price: 185, _change: 0.45, _source: 'Finnhub' },
        ]);
        _setCrossAlerts([]);
        generateReport();
        assert.ok(_lastBlobContent.includes('En hausse'));
        assert.ok(_lastBlobContent.includes('En baisse'));
    });

    it('inclut les alertes croisees dans le rapport', () => {
        _setWatchlistItems([
            { symbol: 'BTC', category: 'crypto', _price: 73000, _change: -2.5, _source: 'CoinGecko' },
        ]);
        _setCrossAlerts([
            { type: 'alert', symbol: 'BTC', category: 'crypto', severity: 'urgent', title: 'Support casse', source: 'Claude IA' },
        ]);
        generateReport();
        assert.ok(_lastBlobContent.includes('Alertes crois'));
        assert.ok(_lastBlobContent.includes('Support casse'));
    });

    it('inclut le contexte marche (sentiment + Fear & Greed)', () => {
        _setWatchlistItems([
            { symbol: 'BTC', category: 'crypto', _price: 73000, _change: -2.5, _source: 'CoinGecko' },
        ]);
        _setCrossAlerts([]);
        generateReport();
        assert.ok(_lastBlobContent.includes('Contexte march'));
        assert.ok(_lastBlobContent.includes('Fear'));
    });

    it('ne genere rien si watchlist vide', () => {
        _setWatchlistItems([]);
        _setCrossAlerts([]);
        _lastBlobContent = '';
        generateReport();
        // showToast est appele, pas de rapport genere
        assert.equal(_lastBlobContent, '');
    });

    it('detecte la tendance haussiere', () => {
        _setWatchlistItems([
            { symbol: 'ETH', category: 'crypto', _price: 3200, _change: 1.8, _source: 'CoinGecko' },
            { symbol: 'AAPL', category: 'stock', _price: 185, _change: 0.45, _source: 'Finnhub' },
        ]);
        _setCrossAlerts([]);
        generateReport();
        assert.ok(_lastBlobContent.includes('Haussier'));
    });
});
