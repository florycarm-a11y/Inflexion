/**
 * Tests unitaires — scripts/generate-daily-briefing.mjs (selection articles + formatters)
 *
 * Execution :  node --test scripts/tests/generate-daily-briefing.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zero dependance)
 *
 * Couvre :
 *   A. selectTopArticles    (selection 20-30 articles pertinents)
 *   B. formatNewsContext     (formatage articles → markdown)
 *   C. formatMarkets         (indices boursiers → markdown)
 *   D. formatCrypto          (crypto → markdown)
 *   E. formatFearGreed       (sentiment crypto → markdown)
 *   F. formatMacro           (indicateurs FRED → markdown)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    selectTopArticles, formatNewsContext, formatMarkets, formatCrypto,
    formatFearGreed, formatMacro
} from '../../scripts/generate-daily-briefing.mjs';


// ─── Helpers pour creer des donnees de test ─────────────────

function makeArticle(title, category, hoursAgo = 1) {
    return {
        title,
        description: 'Description de ' + title,
        source: 'Test Source',
        publishedAt: new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString(),
        url: 'https://example.com/' + title.replace(/\s+/g, '-'),
    };
}

function makeNewsData(articlesPerCategory) {
    const categories = {};
    for (const [cat, articles] of Object.entries(articlesPerCategory)) {
        categories[cat] = articles;
    }
    return { categories };
}


// ═══════════════════════════════════════════════════════════════
// A. selectTopArticles — selection des articles les plus importants
// ═══════════════════════════════════════════════════════════════

describe('A. selectTopArticles', () => {
    it('selectionne des articles depuis un newsData valide', () => {
        const newsData = makeNewsData({
            markets: [makeArticle('Fed maintient taux', 'markets', 2)],
            crypto: [makeArticle('Bitcoin monte', 'crypto', 1)],
        });
        const result = selectTopArticles(newsData);
        assert.ok(result.length > 0);
        assert.ok(result.length <= 25);
    });

    it('retourne un tableau vide si newsData est null', () => {
        assert.deepEqual(selectTopArticles(null), []);
    });

    it('retourne un tableau vide si categories absentes', () => {
        assert.deepEqual(selectTopArticles({}), []);
        assert.deepEqual(selectTopArticles({ categories: null }), []);
    });

    it('respecte le max de 8 articles par categorie', () => {
        const articles = [];
        for (let i = 0; i < 15; i++) {
            articles.push(makeArticle('Article markets ' + i, 'markets', i));
        }
        const newsData = makeNewsData({ markets: articles });
        const result = selectTopArticles(newsData);
        const marketCount = result.filter(a => a._category === 'markets').length;
        assert.ok(marketCount <= 8);
    });

    it('respecte le max total de 25 articles', () => {
        const newsData = makeNewsData({
            markets: Array.from({ length: 10 }, (_, i) => makeArticle('M' + i, 'markets', i)),
            crypto: Array.from({ length: 10 }, (_, i) => makeArticle('C' + i, 'crypto', i)),
            geopolitics: Array.from({ length: 10 }, (_, i) => makeArticle('G' + i, 'geopolitics', i)),
            commodities: Array.from({ length: 10 }, (_, i) => makeArticle('Co' + i, 'commodities', i)),
        });
        const result = selectTopArticles(newsData);
        assert.ok(result.length <= 25);
    });

    it('filtre les articles de plus de 48h', () => {
        const newsData = makeNewsData({
            markets: [
                makeArticle('Recent', 'markets', 1),
                makeArticle('Recent2', 'markets', 2),
                makeArticle('Recent3', 'markets', 3),
                makeArticle('Recent4', 'markets', 4),
                makeArticle('Recent5', 'markets', 5),
                makeArticle('Recent6', 'markets', 10),
                makeArticle('Recent7', 'markets', 12),
                makeArticle('Recent8', 'markets', 20),
                makeArticle('Recent9', 'markets', 24),
                makeArticle('Recent10', 'markets', 30),
                makeArticle('Ancien', 'markets', 72), // > 48h
            ],
        });
        const result = selectTopArticles(newsData);
        const hasAncien = result.some(a => a.title === 'Ancien');
        assert.equal(hasAncien, false);
    });

    it('ajoute _category sur chaque article selectionne', () => {
        const newsData = makeNewsData({
            crypto: [makeArticle('ETH news', 'crypto', 1)],
        });
        const result = selectTopArticles(newsData);
        assert.ok(result.length > 0);
        assert.equal(result[0]._category, 'crypto');
    });

    it('utilise le pool complet si moins de 10 articles recents', () => {
        // Tous les articles sont vieux (>48h) mais il n'y en a que 3
        const newsData = makeNewsData({
            markets: [
                makeArticle('Vieux1', 'markets', 72),
                makeArticle('Vieux2', 'markets', 96),
                makeArticle('Vieux3', 'markets', 120),
            ],
        });
        const result = selectTopArticles(newsData);
        // Comme recent < 10, utilise le pool complet
        assert.ok(result.length > 0);
    });
});


// ═══════════════════════════════════════════════════════════════
// B. formatNewsContext — articles → markdown
// ═══════════════════════════════════════════════════════════════

describe('B. formatNewsContext', () => {
    it('retourne un message par defaut si aucun article', () => {
        assert.equal(formatNewsContext([]), '(Aucun article disponible)');
    });

    it('formate les articles en sections markdown', () => {
        const articles = [
            { title: 'Fed maintient taux', source: 'Reuters', description: 'La Fed decide.', _category: 'markets' },
            { title: 'Bitcoin monte', source: 'CoinDesk', description: 'BTC en hausse.', _category: 'crypto' },
        ];
        const result = formatNewsContext(articles);
        assert.ok(result.includes('## '));
        assert.ok(result.includes('**Fed maintient taux**'));
        assert.ok(result.includes('(Reuters)'));
        assert.ok(result.includes('**Bitcoin monte**'));
    });

    it('regroupe les articles par categorie', () => {
        const articles = [
            { title: 'A1', source: 'S1', _category: 'markets' },
            { title: 'A2', source: 'S2', _category: 'markets' },
            { title: 'A3', source: 'S3', _category: 'crypto' },
        ];
        const result = formatNewsContext(articles);
        // Doit contenir 2 sections distinctes
        assert.ok(result.includes('March'));
        assert.ok(result.includes('Crypto'));
    });

    it('tronque les descriptions longues a 200 caracteres', () => {
        const articles = [
            { title: 'Long', source: 'S', description: 'A'.repeat(300), _category: 'markets' },
        ];
        const result = formatNewsContext(articles);
        // La description dans le markdown doit etre tronquee
        const descMatch = result.match(/: (A+)/);
        assert.ok(descMatch);
        assert.ok(descMatch[1].length <= 200);
    });
});


// ═══════════════════════════════════════════════════════════════
// C. formatMarkets — indices boursiers → markdown
// ═══════════════════════════════════════════════════════════════

describe('C. formatMarkets', () => {
    it('retourne null si donnees absentes', () => {
        assert.equal(formatMarkets(null), null);
        assert.equal(formatMarkets({}), null);
        assert.equal(formatMarkets({ quotes: [] }), null);
    });

    it('formate les indices boursiers en markdown', () => {
        const data = {
            quotes: [
                { name: 'S&P 500', symbol: 'SPY', price: 5100, change: 1.2 },
                { name: 'Nasdaq', symbol: 'QQQ', price: 18000, change: -0.5 },
            ]
        };
        const result = formatMarkets(data);
        assert.ok(result.includes('Indices boursiers'));
        assert.ok(result.includes('S&P 500'));
        assert.ok(result.includes('+1.20%'));
        assert.ok(result.includes('Nasdaq'));
    });

    it('affiche le signe + pour les variations positives', () => {
        const data = { quotes: [{ name: 'Test', symbol: 'T', price: 100, change: 2.5 }] };
        const result = formatMarkets(data);
        assert.ok(result.includes('+2.50%'));
    });
});


// ═══════════════════════════════════════════════════════════════
// D. formatCrypto — crypto → markdown
// ═══════════════════════════════════════════════════════════════

describe('D. formatCrypto', () => {
    it('retourne null si donnees absentes', () => {
        assert.equal(formatCrypto(null), null);
        assert.equal(formatCrypto({}), null);
        assert.equal(formatCrypto({ prices: [] }), null);
    });

    it('formate les cryptos avec variations 24h et 7j', () => {
        const data = {
            prices: [
                { name: 'Bitcoin', symbol: 'BTC', price: 73000, change_24h: -2.5, change_7d: 5.3 },
            ]
        };
        const result = formatCrypto(data);
        assert.ok(result.includes('Crypto'));
        assert.ok(result.includes('Bitcoin'));
        assert.ok(result.includes('-2.5%'));
        assert.ok(result.includes('+5.3%'));
    });

    it('affiche les donnees globales si disponibles', () => {
        const data = {
            prices: [{ name: 'BTC', symbol: 'BTC', price: 73000, change_24h: 1, change_7d: 2 }],
            global: { market_cap_change_24h: -1.5, eth_dominance: 17.2 }
        };
        const result = formatCrypto(data);
        assert.ok(result.includes('Market cap total'));
        assert.ok(result.includes('-1.5'));
        assert.ok(result.includes('Dominance ETH'));
        assert.ok(result.includes('17.2'));
    });

    it('limite a 10 cryptos maximum', () => {
        const prices = Array.from({ length: 15 }, (_, i) => ({
            name: 'Coin' + i, symbol: 'C' + i, price: 100 + i, change_24h: 0.1, change_7d: 0.2,
        }));
        const data = { prices };
        const result = formatCrypto(data);
        const coinMatches = result.match(/\*\*Coin/g);
        assert.ok(coinMatches.length <= 10);
    });
});


// ═══════════════════════════════════════════════════════════════
// E. formatFearGreed — sentiment crypto → markdown
// ═══════════════════════════════════════════════════════════════

describe('E. formatFearGreed', () => {
    it('retourne null si donnees absentes', () => {
        assert.equal(formatFearGreed(null), null);
        assert.equal(formatFearGreed({}), null);
        assert.equal(formatFearGreed({ current: {} }), null);
    });

    it('formate le score actuel avec label', () => {
        const data = {
            current: { value: 25, label: 'Extreme Fear' },
            changes: {}
        };
        const result = formatFearGreed(data);
        assert.ok(result.includes('25/100'));
        assert.ok(result.includes('Extreme Fear'));
    });

    it('inclut les variations hebdo et mensuelle', () => {
        const data = {
            current: { value: 50, label: 'Neutral' },
            changes: { week: -5, month: 12 }
        };
        const result = formatFearGreed(data);
        assert.ok(result.includes('-5 points'));
        assert.ok(result.includes('+12 points'));
    });
});


// ═══════════════════════════════════════════════════════════════
// F. formatMacro — indicateurs FRED → markdown
// ═══════════════════════════════════════════════════════════════

describe('F. formatMacro', () => {
    it('retourne null si donnees absentes', () => {
        assert.equal(formatMacro(null), null);
        assert.equal(formatMacro({}), null);
        assert.equal(formatMacro({ indicators: [] }), null);
    });

    it('formate les indicateurs avec label et valeur', () => {
        const data = {
            indicators: [
                { label: 'Inflation (CPI)', value: 3.2, unit: '%', change: 0.15, change_type: 'yoy' },
                { label: 'Taux Fed', value: 4.5, unit: '%', change: 0, change_type: 'yoy' },
            ]
        };
        const result = formatMacro(data);
        assert.ok(result.includes('Macro US'));
        assert.ok(result.includes('Inflation (CPI)'));
        assert.ok(result.includes('3.2'));
        assert.ok(result.includes('Taux Fed'));
    });

    it('affiche le signe + pour les variations positives', () => {
        const data = {
            indicators: [
                { label: 'GDP', value: 2.8, unit: '%', change: 0.3, change_type: 'yoy' },
            ]
        };
        const result = formatMacro(data);
        assert.ok(result.includes('+0.30'));
    });

    it('gere un indicateur sans change', () => {
        const data = {
            indicators: [
                { label: 'Test', value: 100, unit: 'index' },
            ]
        };
        const result = formatMacro(data);
        assert.ok(result.includes('Test'));
        assert.ok(result.includes('100'));
    });
});
