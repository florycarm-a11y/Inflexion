/**
 * Tests unitaires — scripts/lib/claim-verifier.mjs (évaluateur anti-hallucination)
 *
 * Execution :  node --test scripts/tests/lib/claim-verifier.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zero dependance)
 *
 * Couvre :
 *   A. buildReferenceMap    (construction dictionnaire de référence)
 *   B. extractClaims        (extraction regex des claims numériques)
 *   C. verifyClaims         (matching claims vs référence)
 *   D. flattenBriefingText  (extraction texte du briefing structuré)
 *   E. evaluateBriefing     (évaluation complète bout en bout)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    buildReferenceMap,
    extractClaims,
    verifyClaims,
    flattenBriefingText,
    evaluateBriefing,
    PRICE_TOLERANCE,
    PCT_TOLERANCE,
} from '../../lib/claim-verifier.mjs';


// ─── Fixtures de données sources ────────────────────────────

function makeSources(overrides = {}) {
    return {
        markets: {
            quotes: [
                { name: 'S&P 500', symbol: 'SPY', price: 682.39, change: 1.20 },
                { name: 'Nasdaq', symbol: 'QQQ', price: 601.50, change: -0.50 },
                { name: 'Or (ETF)', symbol: 'GLD', price: 481.28, change: 2.70 },
            ],
        },
        crypto: {
            prices: [
                { name: 'Bitcoin', symbol: 'BTC', price: 63099, change_24h: -4.6, change_7d: 2.1 },
                { name: 'Ethereum', symbol: 'ETH', price: 3450, change_24h: -2.3, change_7d: 5.8 },
            ],
            global: { market_cap_change_24h: -3.2, eth_dominance: 17.2 },
        },
        fearGreed: {
            current: { value: 25, label: 'Extreme Fear' },
            changes: { week: -5, month: 12 },
        },
        macro: {
            indicators: [
                { label: 'Inflation (CPI)', value: 3.2, unit: '%', change: 0.15, change_type: 'yoy' },
                { label: 'Taux Fed', value: 4.5, unit: '%', change: 0, change_type: 'yoy' },
            ],
        },
        globalMacro: {
            volatility: { vix: { value: 25.3, label: 'Elevated', change: 8.5 } },
            ecb: {
                main_rate: { value: 4.0 },
                eurusd: { rate: 1.0845 },
            },
        },
        commodities: {
            metals: {
                gold: { label: 'Or', price_usd: 2948, unit: 'oz' },
                silver: { label: 'Argent', price_usd: 32.5, unit: 'oz' },
            },
            industrial: {
                copper: { label: 'Cuivre', price_usd_kg: 9.2, unit: 'kg' },
            },
        },
        europeanMarkets: {
            indices: [
                { name: 'CAC 40', close: 7850, change_pct: 0.45 },
                { name: 'DAX', close: 18200, change_pct: -0.32 },
            ],
        },
        defi: {
            topProtocols: [
                { name: 'Lido', tvl: 35000000000, change_1d: -1.2 },
                { name: 'AAVE', tvl: 12000000000, change_1d: 0.8 },
            ],
        },
        alphaVantage: {
            forex: [
                { pair: 'USD/JPY', rate: 156.78 },
            ],
        },
        onchain: {
            eth_gas: { low: 15, standard: 25, fast: 40 },
            btc_fees: { half_hour: 12 },
            btc_mining: { hashrate_eh: 650 },
        },
        ...overrides,
    };
}

function makeBriefing(overrides = {}) {
    return {
        synthese: {
            titre: 'Rotation défensive sous tension',
            contenu: 'Le BTC à $63 099 (-4,6% sur 24h) confirme la capitulation crypto. Le VIX à 25,3 points (+8,5%) signale une volatilité élevée. Le S&P 500 progresse de +1,20% tandis que l\'or spot atteint $2 948/oz. Le Fear & Greed Index tombe à 25/100 (Extreme Fear).',
        },
        signaux: [
            {
                titre: 'Capitulation crypto',
                categorie: 'crypto',
                severite: 'élevée',
                description: 'Bitcoin chute à $63 099 (-4,6% en 24h), Ethereum à $3 450 (-2,3%). La dominance ETH reste à 17,2%.',
                interconnexions: [
                    'La chute crypto survient alors que le VIX monte à 25,3, confirmant un risk-off généralisé.',
                    'L\'or profite de ce risk-off avec un spot à $2 948/oz (+2,70%).',
                ],
            },
        ],
        risk_radar: [
            {
                risque: 'Escalade géopolitique',
                severite: 'haute',
                probabilite: '35%',
                description: 'Si les tensions s\'intensifient, le VIX pourrait dépasser 30 points.',
            },
        ],
        sentiment_global: 'bearish',
        tags: ['crypto', 'risk-off', 'volatilité'],
        ...overrides,
    };
}


// ═══════════════════════════════════════════════════════════════
// A. buildReferenceMap — construction du dictionnaire
// ═══════════════════════════════════════════════════════════════

describe('A. buildReferenceMap', () => {
    it('retourne une Map non vide avec des sources complètes', () => {
        const refs = buildReferenceMap(makeSources());
        assert.ok(refs instanceof Map);
        assert.ok(refs.size > 0);
    });

    it('indexe les prix crypto (CoinGecko)', () => {
        const refs = buildReferenceMap(makeSources());
        assert.ok(refs.has('btc_price'));
        assert.equal(refs.get('btc_price').value, 63099);
        assert.equal(refs.get('btc_price').source, 'CoinGecko');
        assert.equal(refs.get('btc_price').type, 'price');
    });

    it('indexe les variations crypto', () => {
        const refs = buildReferenceMap(makeSources());
        assert.ok(refs.has('btc_24h'));
        assert.equal(refs.get('btc_24h').value, -4.6);
        assert.equal(refs.get('btc_24h').type, 'pct');
    });

    it('indexe le VIX', () => {
        const refs = buildReferenceMap(makeSources());
        assert.ok(refs.has('vix_value'));
        assert.equal(refs.get('vix_value').value, 25.3);
    });

    it('indexe l\'or spot (metals.dev)', () => {
        const refs = buildReferenceMap(makeSources());
        assert.ok(refs.has('metal_gold'));
        assert.equal(refs.get('metal_gold').value, 2948);
        assert.equal(refs.get('metal_gold').source, 'metals.dev');
    });

    it('indexe le Fear & Greed Index', () => {
        const refs = buildReferenceMap(makeSources());
        assert.ok(refs.has('fng_value'));
        assert.equal(refs.get('fng_value').value, 25);
    });

    it('indexe les indices européens', () => {
        const refs = buildReferenceMap(makeSources());
        const cacKey = [...refs.keys()].find(k => k.includes('cac'));
        assert.ok(cacKey, 'Devrait avoir une entrée CAC 40');
        assert.equal(refs.get(cacKey).value, 7850);
    });

    it('indexe le forex', () => {
        const refs = buildReferenceMap(makeSources());
        const usdJpyKey = [...refs.keys()].find(k => k.includes('usd') && k.includes('jpy'));
        assert.ok(usdJpyKey, 'Devrait avoir USD/JPY');
        assert.equal(refs.get(usdJpyKey).value, 156.78);
    });

    it('gère les sources partielles (null)', () => {
        const refs = buildReferenceMap({ markets: null, crypto: null });
        assert.ok(refs instanceof Map);
        assert.equal(refs.size, 0);
    });

    it('gère un objet sources vide', () => {
        const refs = buildReferenceMap({});
        assert.ok(refs instanceof Map);
        assert.equal(refs.size, 0);
    });
});


// ═══════════════════════════════════════════════════════════════
// B. extractClaims — extraction de claims numériques
// ═══════════════════════════════════════════════════════════════

describe('B. extractClaims', () => {
    it('retourne un tableau vide pour un texte null/vide', () => {
        assert.deepEqual(extractClaims(null), []);
        assert.deepEqual(extractClaims(''), []);
    });

    it('extrait les prix en dollars ($63 099)', () => {
        const claims = extractClaims('Le BTC à $63 099 confirme la tendance.');
        const prices = claims.filter(c => c.type === 'price');
        assert.ok(prices.length >= 1);
        assert.equal(prices[0].value, 63099);
    });

    it('extrait les prix avec virgule ($2,948)', () => {
        const claims = extractClaims("L'or atteint $2,948 par once.");
        const prices = claims.filter(c => c.type === 'price');
        assert.ok(prices.length >= 1);
        // 2,948 → parser comme 2948 (séparateur milliers)
        assert.equal(prices[0].value, 2948);
    });

    it('extrait les pourcentages positifs et négatifs', () => {
        const claims = extractClaims('SPY +1,20% et BTC -4,6% en 24h');
        const pcts = claims.filter(c => c.type === 'pct');
        assert.ok(pcts.length >= 2);
        const values = pcts.map(c => c.value);
        assert.ok(values.includes(1.2));
        assert.ok(values.includes(-4.6));
    });

    it('extrait les valeurs avec unités (25,3 points)', () => {
        const claims = extractClaims('Le VIX atteint 25,3 points');
        const vals = claims.filter(c => c.type === 'value');
        assert.ok(vals.length >= 1);
        assert.equal(vals[0].value, 25.3);
    });

    it('extrait le score X/100', () => {
        const claims = extractClaims('Fear & Greed à 25/100');
        const vals = claims.filter(c => c.type === 'value');
        assert.ok(vals.length >= 1);
        assert.ok(vals.some(c => c.value === 25));
    });

    it('extrait les gwei (gas)', () => {
        const claims = extractClaims('ETH gas à 25 gwei');
        const vals = claims.filter(c => c.type === 'value');
        assert.ok(vals.some(c => c.value === 25));
    });

    it('fournit le contexte autour de chaque claim', () => {
        const claims = extractClaims('Le prix du Bitcoin est de $63 099 ce matin.');
        assert.ok(claims[0].context.length > 0);
        assert.ok(claims[0].context.includes('63'));
    });
});


// ═══════════════════════════════════════════════════════════════
// C. verifyClaims — matching claims vs référence
// ═══════════════════════════════════════════════════════════════

describe('C. verifyClaims', () => {
    it('vérifie un prix exact', () => {
        const claims = [{ raw: '$63 099', value: 63099, type: 'price', context: '' }];
        const refs = buildReferenceMap(makeSources());
        const results = verifyClaims(claims, refs);
        assert.equal(results[0].status, 'verified');
        assert.equal(results[0].match.source, 'CoinGecko');
    });

    it('vérifie un prix approché (dans la tolérance de 1%)', () => {
        // 63099 * 1.01 = 63729.99 → juste à la limite
        const claims = [{ raw: '$63 200', value: 63200, type: 'price', context: '' }];
        const refs = buildReferenceMap(makeSources());
        const results = verifyClaims(claims, refs);
        assert.ok(results[0].status === 'verified' || results[0].status === 'approximate');
    });

    it('rejette un prix inventé', () => {
        const claims = [{ raw: '$99 999', value: 99999, type: 'price', context: '' }];
        const refs = buildReferenceMap(makeSources());
        const results = verifyClaims(claims, refs);
        assert.equal(results[0].status, 'unverified');
    });

    it('vérifie un pourcentage exact', () => {
        const claims = [{ raw: '-4,6%', value: -4.6, type: 'pct', context: '' }];
        const refs = buildReferenceMap(makeSources());
        const results = verifyClaims(claims, refs);
        assert.ok(results[0].status === 'verified' || results[0].status === 'approximate');
    });

    it('rejette un pourcentage inventé', () => {
        const claims = [{ raw: '+42%', value: 42, type: 'pct', context: '' }];
        const refs = buildReferenceMap(makeSources());
        const results = verifyClaims(claims, refs);
        assert.equal(results[0].status, 'unverified');
    });

    it('vérifie une valeur FNG', () => {
        const claims = [{ raw: '25/100', value: 25, type: 'value', context: '' }];
        const refs = buildReferenceMap(makeSources());
        const results = verifyClaims(claims, refs);
        assert.ok(results[0].status === 'verified' || results[0].status === 'approximate');
    });

    it('retourne un tableau vide si pas de claims', () => {
        const refs = buildReferenceMap(makeSources());
        const results = verifyClaims([], refs);
        assert.deepEqual(results, []);
    });
});


// ═══════════════════════════════════════════════════════════════
// D. flattenBriefingText — extraction texte
// ═══════════════════════════════════════════════════════════════

describe('D. flattenBriefingText', () => {
    it('concatène synthese, signaux et risk_radar', () => {
        const text = flattenBriefingText(makeBriefing());
        assert.ok(text.includes('63 099'));
        assert.ok(text.includes('Capitulation crypto'));
        assert.ok(text.includes('Escalade géopolitique'));
    });

    it('inclut les interconnexions', () => {
        const text = flattenBriefingText(makeBriefing());
        assert.ok(text.includes('VIX monte'));
    });

    it('gère un briefing minimal', () => {
        const text = flattenBriefingText({ synthese: { contenu: 'test' } });
        assert.equal(text, 'test');
    });

    it('gère un briefing vide', () => {
        const text = flattenBriefingText({});
        assert.equal(text, '');
    });
});


// ═══════════════════════════════════════════════════════════════
// E. evaluateBriefing — évaluation complète
// ═══════════════════════════════════════════════════════════════

describe('E. evaluateBriefing', () => {
    it('donne un score élevé pour un briefing fidèle aux sources', () => {
        const result = evaluateBriefing(makeBriefing(), makeSources());
        assert.ok(result.score >= 0.5, `Score ${result.score} devrait être >= 0.5`);
        assert.ok(result.totalClaims > 0);
        assert.ok(result.verified > 0);
        assert.ok(result.pass);
    });

    it('donne un score faible pour un briefing inventé', () => {
        const fakeBriefing = makeBriefing({
            synthese: {
                titre: 'Faux briefing',
                contenu: 'Le BTC à $999 999 (+99%). Le VIX à 500 points. L\'or à $50 000/oz.',
            },
            signaux: [{
                titre: 'Signal inventé',
                description: 'Tout est faux : $888 888 et +75%.',
                interconnexions: ['Le pétrole à $999/baril (+88%).'],
                categorie: 'test',
                severite: 'test',
            }],
            risk_radar: [{
                risque: 'Risque inventé',
                description: 'Probabilité 99%, impact $777 777.',
                severite: 'test',
                probabilite: '99%',
            }],
        });
        const result = evaluateBriefing(fakeBriefing, makeSources());
        assert.ok(result.score < 0.5, `Score ${result.score} devrait être < 0.5 pour données inventées`);
        assert.ok(result.unverified > 0);
        assert.equal(result.pass, false);
    });

    it('retourne pass=true si aucune claim (texte narratif pur)', () => {
        const narrativeBriefing = makeBriefing({
            synthese: {
                titre: 'Analyse géopolitique',
                contenu: 'Les tensions montent en mer Rouge, impactant les routes maritimes.',
            },
            signaux: [{
                titre: 'Mer Rouge',
                description: 'Les houthis continuent de cibler les navires.',
                interconnexions: ['Impact sur le fret maritime.'],
                categorie: 'geopolitics',
                severite: 'haute',
            }],
            risk_radar: [{
                risque: 'Fermeture du détroit',
                description: 'Risque de perturbation majeure.',
                severite: 'haute',
                probabilite: 'modérée',
            }],
        });
        const result = evaluateBriefing(narrativeBriefing, makeSources());
        assert.equal(result.pass, true);
        assert.equal(result.score, 1);
    });

    it('retourne le détail de chaque claim', () => {
        const result = evaluateBriefing(makeBriefing(), makeSources());
        assert.ok(Array.isArray(result.details));
        assert.ok(result.details.length === result.totalClaims);
        // Chaque détail a la structure attendue
        for (const d of result.details) {
            assert.ok(['verified', 'approximate', 'unverified'].includes(d.status));
            assert.ok(d.claim);
            assert.ok(d.claim.raw);
        }
    });

    it('retourne le nombre de références', () => {
        const result = evaluateBriefing(makeBriefing(), makeSources());
        assert.ok(result.referenceCount > 10, `${result.referenceCount} références, devrait être > 10`);
    });
});
