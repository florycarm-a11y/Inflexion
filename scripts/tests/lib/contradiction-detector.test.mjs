/**
 * Tests unitaires — scripts/lib/contradiction-detector.mjs
 *
 * Execution :  node --test scripts/tests/lib/contradiction-detector.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zero dependance)
 *
 * Couvre :
 *   A. pctDivergence          (calcul de divergence en %)
 *   B. checkCryptoContradictions  (CoinGecko vs Messari)
 *   C. checkForexContradictions   (Alpha Vantage vs ECB)
 *   D. checkETFSelfConsistency    (Finnhub self-check)
 *   E. checkEUIndexSelfConsistency (Twelve Data self-check)
 *   F. detectContradictions       (orchestrateur)
 *   G. formatContradictionsForPrompt (formatage prompt)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    pctDivergence,
    checkCryptoContradictions,
    checkForexContradictions,
    checkETFSelfConsistency,
    checkEUIndexSelfConsistency,
    detectContradictions,
    formatContradictionsForPrompt,
    TOLERANCES,
} from '../../lib/contradiction-detector.mjs';


// ═══════════════════════════════════════════════════════════════
// A. pctDivergence
// ═══════════════════════════════════════════════════════════════

describe('A. pctDivergence', () => {
    it('retourne 0 pour deux valeurs identiques', () => {
        assert.equal(pctDivergence(100, 100), 0);
    });

    it('retourne 0 pour deux zéros', () => {
        assert.equal(pctDivergence(0, 0), 0);
    });

    it('calcule correctement une divergence de 10%', () => {
        const div = pctDivergence(110, 100);
        assert.ok(Math.abs(div - 9.09) < 0.1, `${div} devrait être ~9.09%`);
    });

    it('est symétrique (ordre des arguments ne change pas le résultat)', () => {
        const d1 = pctDivergence(105, 100);
        const d2 = pctDivergence(100, 105);
        assert.ok(Math.abs(d1 - d2) < 0.01);
    });

    it('gère les valeurs négatives', () => {
        const div = pctDivergence(-100, -110);
        assert.ok(div > 0);
    });

    it('retourne 0 si une valeur est 0 et l\'autre aussi', () => {
        assert.equal(pctDivergence(0, 0), 0);
    });
});


// ═══════════════════════════════════════════════════════════════
// B. checkCryptoContradictions — CoinGecko vs Messari
// ═══════════════════════════════════════════════════════════════

describe('B. checkCryptoContradictions', () => {
    it('retourne un tableau vide si crypto est null', () => {
        assert.deepEqual(checkCryptoContradictions(null, { assets: [] }), []);
    });

    it('retourne un tableau vide si messari est null', () => {
        assert.deepEqual(checkCryptoContradictions({ prices: [] }, null), []);
    });

    it('retourne un tableau vide si les prix sont dans la tolérance', () => {
        const crypto = {
            prices: [
                { symbol: 'BTC', price: 68000, change_24h: 2.5 },
                { symbol: 'ETH', price: 3500, change_24h: 1.2 },
            ],
        };
        const messari = {
            assets: [
                { symbol: 'BTC', price: 68100 }, // 0.15% divergence
                { symbol: 'ETH', price: 3510 },  // 0.29% divergence
            ],
        };

        const result = checkCryptoContradictions(crypto, messari);
        assert.equal(result.length, 0);
    });

    it('détecte une divergence crypto au-delà de la tolérance', () => {
        const crypto = {
            prices: [
                { symbol: 'BTC', price: 68000, change_24h: 2.5 },
            ],
        };
        const messari = {
            assets: [
                { symbol: 'BTC', price: 70000 }, // ~2.9% divergence > 2%
            ],
        };

        const result = checkCryptoContradictions(crypto, messari);
        assert.equal(result.length, 1);
        assert.equal(result[0].indicator, 'BTC prix');
        assert.equal(result[0].source1.name, 'CoinGecko');
        assert.equal(result[0].source2.name, 'Messari');
        assert.ok(result[0].divergence_pct > TOLERANCES.crypto);
    });

    it('ne compare que les assets présents dans les deux sources', () => {
        const crypto = {
            prices: [
                { symbol: 'BTC', price: 68000 },
                { symbol: 'DOGE', price: 0.15 }, // Pas dans Messari
            ],
        };
        const messari = {
            assets: [
                { symbol: 'BTC', price: 68100 },
                { symbol: 'ADA', price: 0.45 }, // Pas dans CoinGecko
            ],
        };

        const result = checkCryptoContradictions(crypto, messari);
        assert.equal(result.length, 0); // BTC dans la tolérance, DOGE/ADA ignorés
    });

    it('est insensible à la casse des symboles', () => {
        const crypto = {
            prices: [{ symbol: 'btc', price: 68000 }],
        };
        const messari = {
            assets: [{ symbol: 'BTC', price: 72000 }], // ~5.6% divergence
        };

        const result = checkCryptoContradictions(crypto, messari);
        assert.equal(result.length, 1);
    });

    it('ignore les assets sans prix', () => {
        const crypto = {
            prices: [{ symbol: 'BTC', price: null }],
        };
        const messari = {
            assets: [{ symbol: 'BTC', price: 68000 }],
        };

        const result = checkCryptoContradictions(crypto, messari);
        assert.equal(result.length, 0);
    });
});


// ═══════════════════════════════════════════════════════════════
// C. checkForexContradictions — Alpha Vantage vs ECB
// ═══════════════════════════════════════════════════════════════

describe('C. checkForexContradictions', () => {
    it('retourne un tableau vide si alphaVantage est null', () => {
        assert.deepEqual(checkForexContradictions(null, { ecb: { eurusd: { rate: 1.08 } } }), []);
    });

    it('retourne un tableau vide si globalMacro.ecb.eurusd est absent', () => {
        assert.deepEqual(checkForexContradictions({ forex: [{ pair: 'EUR/USD', rate: 1.08 }] }, {}), []);
    });

    it('retourne un tableau vide si les taux sont dans la tolérance', () => {
        const av = { forex: [{ pair: 'EUR/USD', rate: 1.0850 }] };
        const gm = { ecb: { eurusd: { rate: 1.0830 } } }; // 0.18% divergence

        const result = checkForexContradictions(av, gm);
        assert.equal(result.length, 0);
    });

    it('détecte une divergence EUR/USD au-delà de la tolérance', () => {
        const av = { forex: [{ pair: 'EUR/USD', rate: 1.1825 }] };
        const gm = { ecb: { eurusd: { rate: 1.1554 } } }; // ~2.3% divergence

        const result = checkForexContradictions(av, gm);
        assert.equal(result.length, 1);
        assert.equal(result[0].indicator, 'EUR/USD');
        assert.equal(result[0].source1.name, 'Alpha Vantage');
        assert.equal(result[0].source2.name, 'ECB Data');
        assert.ok(result[0].divergence_pct > TOLERANCES.forex);
    });

    it('reconnaît la variante EURUSD (sans slash)', () => {
        const av = { forex: [{ pair: 'EURUSD', rate: 1.20 }] };
        const gm = { ecb: { eurusd: { rate: 1.08 } } }; // ~10% divergence

        const result = checkForexContradictions(av, gm);
        assert.equal(result.length, 1);
    });

    it('ignore si EUR/USD absent dans alphaVantage', () => {
        const av = { forex: [{ pair: 'GBP/USD', rate: 1.27 }] };
        const gm = { ecb: { eurusd: { rate: 1.08 } } };

        const result = checkForexContradictions(av, gm);
        assert.equal(result.length, 0);
    });
});


// ═══════════════════════════════════════════════════════════════
// D. checkETFSelfConsistency — Finnhub self-check
// ═══════════════════════════════════════════════════════════════

describe('D. checkETFSelfConsistency', () => {
    it('retourne un tableau vide si markets est null', () => {
        assert.deepEqual(checkETFSelfConsistency(null), []);
    });

    it('retourne un tableau vide si les données sont cohérentes', () => {
        const markets = {
            quotes: [
                { symbol: 'SPY', price: 693.15, prev_close: 690.00, change: 3.15 },
                { symbol: 'QQQ', price: 601.50, prev_close: 600.00, change: 1.50 },
            ],
        };

        const result = checkETFSelfConsistency(markets);
        assert.equal(result.length, 0);
    });

    it('détecte une incohérence prix vs prev_close + change', () => {
        const markets = {
            quotes: [
                { symbol: 'SPY', price: 693.15, prev_close: 690.00, change: 10.00 },
                // expected = 700.00, actual = 693.15 → ~1% divergence > 0.5%
            ],
        };

        const result = checkETFSelfConsistency(markets);
        assert.equal(result.length, 1);
        assert.ok(result[0].indicator.includes('SPY'));
        assert.ok(result[0].divergence_pct > TOLERANCES.etfSelf);
    });

    it('ignore les quotes sans prev_close ou change', () => {
        const markets = {
            quotes: [
                { symbol: 'SPY', price: 693.15, prev_close: null, change: 3.15 },
                { symbol: 'QQQ', price: 601.50, prev_close: 600.00, change: null },
            ],
        };

        const result = checkETFSelfConsistency(markets);
        assert.equal(result.length, 0);
    });

    it('ignore les quotes avec prev_close à 0', () => {
        const markets = {
            quotes: [
                { symbol: 'SPY', price: 693.15, prev_close: 0, change: 3.15 },
            ],
        };

        const result = checkETFSelfConsistency(markets);
        assert.equal(result.length, 0);
    });
});


// ═══════════════════════════════════════════════════════════════
// E. checkEUIndexSelfConsistency — Twelve Data self-check
// ═══════════════════════════════════════════════════════════════

describe('E. checkEUIndexSelfConsistency', () => {
    it('retourne un tableau vide si europeanMarkets est null', () => {
        assert.deepEqual(checkEUIndexSelfConsistency(null), []);
    });

    it('retourne un tableau vide si les données sont cohérentes', () => {
        const em = {
            indices: [
                { symbol: 'CAC 40', price: 7450.50, prev_close: 7430.00, change: 20.50 },
                { symbol: 'DAX', price: 18200.00, prev_close: 18180.00, change: 20.00 },
            ],
        };

        const result = checkEUIndexSelfConsistency(em);
        assert.equal(result.length, 0);
    });

    it('détecte une incohérence index', () => {
        const em = {
            indices: [
                { symbol: 'DAX', price: 18200.00, prev_close: 18000.00, change: 300.00 },
                // expected = 18300, actual = 18200 → ~0.55% > 0.3%
            ],
        };

        const result = checkEUIndexSelfConsistency(em);
        assert.equal(result.length, 1);
        assert.ok(result[0].indicator.includes('DAX'));
    });

    it('tolère une petite divergence (<0.3%)', () => {
        const em = {
            indices: [
                { symbol: 'FTSE', price: 8000.00, prev_close: 7990.00, change: 10.10 },
                // expected = 8000.10, actual = 8000.00 → ~0.001%
            ],
        };

        const result = checkEUIndexSelfConsistency(em);
        assert.equal(result.length, 0);
    });
});


// ═══════════════════════════════════════════════════════════════
// F. detectContradictions — orchestrateur
// ═══════════════════════════════════════════════════════════════

describe('F. detectContradictions', () => {
    it('retourne aucune contradiction si toutes les sources sont null', () => {
        const result = detectContradictions({});
        assert.equal(result.contradictions.length, 0);
        assert.ok(result.summary.includes('Aucune'));
    });

    it('agrège les contradictions de toutes les vérifications', () => {
        const sources = {
            crypto: {
                prices: [{ symbol: 'BTC', price: 68000 }],
            },
            messari: {
                assets: [{ symbol: 'BTC', price: 72000 }], // >2% divergence
            },
            alphaVantage: {
                forex: [{ pair: 'EUR/USD', rate: 1.20 }],
            },
            globalMacro: {
                ecb: { eurusd: { rate: 1.08 } }, // >0.7% divergence
            },
            markets: { quotes: [] },
            europeanMarkets: { indices: [] },
        };

        const result = detectContradictions(sources);
        assert.equal(result.contradictions.length, 2);
        // Vérifie qu'on a bien une crypto et une forex
        const types = result.contradictions.map(c => c.type);
        assert.ok(types.includes('crypto'));
        assert.ok(types.includes('forex'));
    });

    it('inclut un summary lisible quand il y a des contradictions', () => {
        const sources = {
            crypto: { prices: [{ symbol: 'ETH', price: 3500 }] },
            messari: { assets: [{ symbol: 'ETH', price: 3700 }] },
        };

        const result = detectContradictions(sources);
        assert.ok(result.summary.includes('ETH'));
        assert.ok(result.summary.includes('⚠'));
    });
});


// ═══════════════════════════════════════════════════════════════
// G. formatContradictionsForPrompt
// ═══════════════════════════════════════════════════════════════

describe('G. formatContradictionsForPrompt', () => {
    it('retourne une chaîne vide si aucune contradiction', () => {
        assert.equal(formatContradictionsForPrompt([]), '');
        assert.equal(formatContradictionsForPrompt(null), '');
    });

    it('formate les contradictions en Markdown avec header et note', () => {
        const contradictions = [
            {
                indicator: 'BTC prix',
                source1: { name: 'CoinGecko', value: 68000 },
                source2: { name: 'Messari', value: 72000 },
                divergence_pct: 5.56,
                type: 'crypto',
                note: 'Divergence BTC : CoinGecko 68000 vs Messari 72000 (5.6%).',
            },
        ];

        const result = formatContradictionsForPrompt(contradictions);
        assert.ok(result.includes('Divergences détectées'));
        assert.ok(result.includes('BTC prix'));
        assert.ok(result.includes('CoinGecko'));
        assert.ok(result.includes('Messari'));
    });

    it('liste toutes les contradictions', () => {
        const contradictions = [
            { indicator: 'BTC', note: 'Note BTC' },
            { indicator: 'EUR/USD', note: 'Note EUR' },
        ];

        const result = formatContradictionsForPrompt(contradictions);
        assert.ok(result.includes('BTC'));
        assert.ok(result.includes('EUR/USD'));
    });
});


// ═══════════════════════════════════════════════════════════════
// H. Constantes de tolérance
// ═══════════════════════════════════════════════════════════════

describe('H. Constantes TOLERANCES', () => {
    it('crypto = 2.0%', () => assert.equal(TOLERANCES.crypto, 2.0));
    it('forex = 0.7%', () => assert.equal(TOLERANCES.forex, 0.7));
    it('etfSelf = 0.5%', () => assert.equal(TOLERANCES.etfSelf, 0.5));
    it('indexSelf = 0.3%', () => assert.equal(TOLERANCES.indexSelf, 0.3));
});
