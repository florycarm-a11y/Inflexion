/**
 * Tests unitaires — scripts/lib/bibliography-verifier.mjs (vérificateur bibliographique)
 *
 * Execution :  node --test scripts/tests/lib/bibliography-verifier.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zero dependance)
 *
 * Couvre :
 *   A. extractDomain              (extraction domaine depuis URL)
 *   B. buildArticleBibliography   (construction bibliographie articles)
 *   C. buildAPISourceRegistry     (registre sources API)
 *   D. extractSourceReferences    (extraction attributions inline)
 *   E. classifySourceType         (classification type de source)
 *   F. matchReferencesToBibliography (matching références ↔ sources)
 *   G. flattenBriefingText        (extraction texte briefing)
 *   H. generateBibliographyReport (rapport complet bout en bout)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    extractDomain,
    buildArticleBibliography,
    buildAPISourceRegistry,
    extractSourceReferences,
    classifySourceType,
    matchReferencesToBibliography,
    flattenBriefingText,
    generateBibliographyReport,
    MIN_TRACEABILITY_SCORE,
    API_SOURCE_REGISTRY,
} from '../../lib/bibliography-verifier.mjs';


// ─── Fixtures ────────────────────────────────────────────────

function makeArticles() {
    return [
        {
            title: 'Bitcoin Drops Below $60K',
            source: 'CoinDesk',
            url: 'https://www.coindesk.com/bitcoin-drops',
            publishedAt: '2026-03-05T10:00:00Z',
            rubrique: 'crypto',
        },
        {
            title: 'Fed Holds Rates Steady',
            source: 'Reuters',
            url: 'https://www.reuters.com/fed-rates',
            publishedAt: '2026-03-05T08:00:00Z',
            rubrique: 'marches',
        },
        {
            title: 'Gold Hits Record High',
            source: 'Financial Times',
            url: 'https://www.ft.com/gold-record',
            publishedAt: '2026-03-05T07:30:00Z',
            rubrique: 'matieres_premieres',
        },
        {
            title: 'Article sans URL',
            source: 'Blog inconnu',
            publishedAt: '2026-03-05T06:00:00Z',
        },
    ];
}

function makeSources() {
    return {
        markets: {
            quotes: [
                { name: 'S&P 500', symbol: 'SPY', price: 682, change: 1.2 },
            ],
        },
        crypto: {
            prices: [
                { name: 'Bitcoin', symbol: 'BTC', price: 63099, change_24h: -4.6, change_7d: 2.1 },
            ],
        },
        fearGreed: {
            current: { value: 25, label: 'Extreme Fear' },
            changes: { week: -5, month: 12 },
        },
        macro: {
            indicators: [
                { label: 'CPI', value: 3.03, unit: '%', change: 0.1 },
            ],
        },
        globalMacro: {
            ecb: { main_rate: { value: 3.15 }, eurusd: { rate: 1.0825 } },
            volatility: { vix: { value: 22.4, change: 3.5, label: 'Elevated' } },
        },
        commodities: {
            metals: { gold: { label: 'Or', price_usd: 2900, unit: 'oz' } },
        },
        europeanMarkets: {
            indices: [{ name: 'CAC 40', close: 8050, change_pct: -0.3 }],
        },
        defi: {
            topProtocols: [{ name: 'Lido', tvl: 14e9, change_1d: -0.5 }],
        },
        alphaVantage: {
            forex: [{ pair: 'EUR/USD', rate: 1.0830 }],
        },
        onchain: {
            eth_gas: { low: 15, standard: 25, fast: 40 },
            btc_fees: { half_hour: 8 },
            btc_mining: { hashrate_eh: 650 },
        },
        messari: { updated_at: '2026-03-05T06:00:00Z' },
    };
}

function makeBriefing() {
    return {
        signal_du_jour: 'La divergence or/dollar (CoinGecko, FRED) signale un refuge non classique',
        synthese: {
            titre: 'Marchés en tension : rotation défensive confirmée',
            contenu: 'Le BTC recule à 63 099 $ (CoinGecko, 24h: -4,6%) tandis que le VIX monte à 22,4 (Finnhub). Selon Reuters, la Fed maintient ses taux. Le CPI à 3,03% (FRED) reste au-dessus de la cible.',
        },
        signaux: [
            {
                titre: 'Capitulation crypto',
                description: 'Le Fear & Greed Index à 25/100 (Alternative.me) confirme la peur extrême.',
                interconnexions: [
                    { secteur: 'Macro', impact: 'Corrélation avec taux réels', explication: 'estimation Inflexion basée sur 90 jours' },
                ],
                regions: ['Global'],
                severite: 'attention',
            },
        ],
        risk_radar: [
            {
                risque: 'Escalade géopolitique',
                description: 'Selon Al-Monitor, les tensions au Moyen-Orient pourraient impacter le Brent.',
                severite: 'urgent',
                probabilite: 'moyenne',
                impact_marche: 'Brent +5-8%, or +2%',
            },
        ],
        themes_a_surveiller: [
            { actif: 'BTC/USD', details: 'Support à 60 000 $ selon CoinGecko' },
        ],
    };
}


// ─── A. extractDomain ────────────────────────────────────────

describe('A. extractDomain', () => {
    it('extracts domain from standard URL', () => {
        assert.equal(extractDomain('https://www.coindesk.com/bitcoin-drops'), 'coindesk.com');
    });

    it('extracts domain without www prefix', () => {
        assert.equal(extractDomain('https://reuters.com/article/123'), 'reuters.com');
    });

    it('handles URL with subdomain', () => {
        assert.equal(extractDomain('https://data.ecb.europa.eu/rates'), 'data.ecb.europa.eu');
    });

    it('returns empty string for invalid URL', () => {
        assert.equal(extractDomain('not-a-url'), '');
    });

    it('returns empty string for null/undefined', () => {
        assert.equal(extractDomain(null), '');
        assert.equal(extractDomain(undefined), '');
        assert.equal(extractDomain(''), '');
    });
});


// ─── B. buildArticleBibliography ─────────────────────────────

describe('B. buildArticleBibliography', () => {
    it('builds bibliography from articles with URLs', () => {
        const bib = buildArticleBibliography(makeArticles());
        assert.equal(bib.length, 4); // all articles including one without URL
        assert.equal(bib[0].titre, 'Bitcoin Drops Below $60K');
        assert.equal(bib[0].source, 'CoinDesk');
        assert.equal(bib[0].domain, 'coindesk.com');
        assert.equal(bib[0].type, 'article');
    });

    it('handles article without URL', () => {
        const bib = buildArticleBibliography(makeArticles());
        const noUrl = bib.find(b => b.titre === 'Article sans URL');
        assert.ok(noUrl);
        assert.equal(noUrl.url, '');
        assert.equal(noUrl.domain, '');
    });

    it('returns empty array for null/undefined input', () => {
        assert.deepEqual(buildArticleBibliography(null), []);
        assert.deepEqual(buildArticleBibliography(undefined), []);
    });

    it('returns empty array for non-array input', () => {
        assert.deepEqual(buildArticleBibliography('not an array'), []);
    });

    it('preserves category from rubrique field', () => {
        const bib = buildArticleBibliography(makeArticles());
        assert.equal(bib[0].category, 'crypto');
        assert.equal(bib[1].category, 'marches');
    });
});


// ─── C. buildAPISourceRegistry ───────────────────────────────

describe('C. buildAPISourceRegistry', () => {
    it('builds registry with correct API count', () => {
        const reg = buildAPISourceRegistry(makeSources());
        assert.ok(reg.length >= 8); // markets, crypto, fng, macro, ecb, vix, commodities, eu, defi, av, messari, etherscan, mempool
    });

    it('includes Finnhub with indicator symbols', () => {
        const reg = buildAPISourceRegistry(makeSources());
        const finnhub = reg.find(r => r.name === 'Finnhub');
        assert.ok(finnhub);
        assert.ok(finnhub.indicators.includes('SPY'));
        assert.equal(finnhub.domain, 'finnhub.io');
    });

    it('includes CoinGecko with crypto symbols', () => {
        const reg = buildAPISourceRegistry(makeSources());
        const cg = reg.find(r => r.name === 'CoinGecko');
        assert.ok(cg);
        assert.ok(cg.indicators.includes('BTC'));
    });

    it('includes FRED with macro indicators', () => {
        const reg = buildAPISourceRegistry(makeSources());
        const fred = reg.find(r => r.name === 'FRED');
        assert.ok(fred);
        assert.ok(fred.indicators.includes('CPI'));
    });

    it('returns empty array for null sources', () => {
        assert.deepEqual(buildAPISourceRegistry(null), []);
    });

    it('handles partial sources gracefully', () => {
        const reg = buildAPISourceRegistry({ markets: { quotes: [{ symbol: 'SPY', name: 'S&P', price: 680, change: 0.5 }] } });
        assert.equal(reg.length, 1);
        assert.equal(reg[0].name, 'Finnhub');
    });
});


// ─── D. extractSourceReferences ──────────────────────────────

describe('D. extractSourceReferences', () => {
    it('extracts parenthetical API attributions', () => {
        const text = 'BTC à 63 099 $ (CoinGecko, 24h: -4,6%) tandis que le VIX monte à 22,4 (Finnhub)';
        const refs = extractSourceReferences(text);
        const names = refs.map(r => r.name);
        assert.ok(names.includes('CoinGecko'));
        assert.ok(names.includes('Finnhub'));
    });

    it('extracts "selon X" attributions', () => {
        const text = 'Selon Reuters, la Fed maintient ses taux. Selon Al-Monitor, les tensions persistent.';
        const refs = extractSourceReferences(text);
        const names = refs.map(r => r.name);
        assert.ok(names.includes('Reuters'));
        assert.ok(names.includes('Al-Monitor'));
    });

    it('extracts estimation Inflexion references', () => {
        const text = 'La corrélation calculée sur 90 jours (estimation Inflexion) montre une divergence.';
        const refs = extractSourceReferences(text);
        assert.ok(refs.some(r => r.type === 'estimation'));
    });

    it('returns empty array for null/empty input', () => {
        assert.deepEqual(extractSourceReferences(null), []);
        assert.deepEqual(extractSourceReferences(''), []);
    });

    it('filters out common French words (false positives)', () => {
        const text = '(Le marché) rebondit et (La BCE) maintient ses taux';
        const refs = extractSourceReferences(text);
        const names = refs.map(r => r.name);
        assert.ok(!names.includes('Le'));
        assert.ok(!names.includes('La'));
    });

    it('deduplicates references by context', () => {
        const text = 'BTC (CoinGecko) et ETH (CoinGecko)';
        const refs = extractSourceReferences(text);
        // Both CoinGecko refs should appear since they have different contexts
        assert.ok(refs.length >= 1);
    });
});


// ─── E. classifySourceType ───────────────────────────────────

describe('E. classifySourceType', () => {
    it('classifies API sources', () => {
        assert.equal(classifySourceType('CoinGecko'), 'api');
        assert.equal(classifySourceType('Finnhub'), 'api');
        assert.equal(classifySourceType('FRED'), 'api');
    });

    it('classifies institutions', () => {
        assert.equal(classifySourceType('FMI'), 'institution');
        assert.equal(classifySourceType('BCE'), 'institution');
        assert.equal(classifySourceType('OPEC'), 'institution');
    });

    it('classifies think tanks', () => {
        assert.equal(classifySourceType('Brookings'), 'think_tank');
        assert.equal(classifySourceType('IFRI'), 'think_tank');
        assert.equal(classifySourceType('RUSI'), 'think_tank');
    });

    it('classifies press sources', () => {
        assert.equal(classifySourceType('Reuters'), 'presse');
        assert.equal(classifySourceType('Bloomberg'), 'presse');
        assert.equal(classifySourceType('CoinDesk'), 'presse');
    });

    it('classifies estimations', () => {
        assert.equal(classifySourceType('estimation Inflexion'), 'estimation');
        assert.equal(classifySourceType('corrélation calculée'), 'estimation');
    });

    it('returns unknown for unrecognized sources', () => {
        assert.equal(classifySourceType('SomeRandomBlog'), 'unknown');
        assert.equal(classifySourceType(''), 'unknown');
        assert.equal(classifySourceType(null), 'unknown');
    });
});


// ─── F. matchReferencesToBibliography ────────────────────────

describe('F. matchReferencesToBibliography', () => {
    const bibliography = buildArticleBibliography(makeArticles());
    const apiRegistry = buildAPISourceRegistry(makeSources());

    it('matches API references to registry', () => {
        const refs = [{ name: 'CoinGecko', type: 'api', context: 'BTC (CoinGecko)' }];
        const results = matchReferencesToBibliography(refs, bibliography, apiRegistry);
        assert.equal(results.length, 1);
        assert.ok(results[0].matched);
        assert.equal(results[0].matchedSource.type, 'api');
        assert.equal(results[0].matchedSource.name, 'CoinGecko');
    });

    it('matches article references to bibliography', () => {
        const refs = [{ name: 'CoinDesk', type: 'presse', context: 'selon CoinDesk' }];
        const results = matchReferencesToBibliography(refs, bibliography, apiRegistry);
        assert.equal(results.length, 1);
        assert.ok(results[0].matched);
        assert.equal(results[0].matchedSource.type, 'article');
    });

    it('matches known source names', () => {
        const refs = [{ name: 'Bloomberg', type: 'presse', context: 'selon Bloomberg' }];
        const results = matchReferencesToBibliography(refs, bibliography, apiRegistry);
        assert.ok(results[0].matched);
        assert.ok(results[0].matchedSource.recognized);
    });

    it('matches estimation references', () => {
        const refs = [{ name: 'estimation Inflexion', type: 'estimation', context: 'estimation Inflexion' }];
        const results = matchReferencesToBibliography(refs, bibliography, apiRegistry);
        assert.ok(results[0].matched);
        assert.equal(results[0].matchedSource.type, 'estimation');
    });

    it('flags unknown references as unmatched', () => {
        const refs = [{ name: 'RandomBlog42', type: 'unknown', context: 'selon RandomBlog42' }];
        const results = matchReferencesToBibliography(refs, bibliography, apiRegistry);
        assert.ok(!results[0].matched);
        assert.equal(results[0].matchedSource, null);
    });

    it('returns empty array for empty refs', () => {
        assert.deepEqual(matchReferencesToBibliography([], bibliography, apiRegistry), []);
        assert.deepEqual(matchReferencesToBibliography(null, bibliography, apiRegistry), []);
    });
});


// ─── G. flattenBriefingText ──────────────────────────────────

describe('G. flattenBriefingText', () => {
    it('extracts text from all briefing sections', () => {
        const text = flattenBriefingText(makeBriefing());
        assert.ok(text.includes('divergence or/dollar'));
        assert.ok(text.includes('BTC recule'));
        assert.ok(text.includes('Capitulation crypto'));
        assert.ok(text.includes('Escalade géopolitique'));
        assert.ok(text.includes('BTC/USD'));
    });

    it('includes signal_du_jour', () => {
        const text = flattenBriefingText(makeBriefing());
        assert.ok(text.includes('CoinGecko, FRED'));
    });

    it('includes interconnexions', () => {
        const text = flattenBriefingText(makeBriefing());
        assert.ok(text.includes('estimation Inflexion'));
    });

    it('includes risk_radar impact', () => {
        const text = flattenBriefingText(makeBriefing());
        assert.ok(text.includes('Brent +5-8%'));
    });

    it('handles empty briefing gracefully', () => {
        const text = flattenBriefingText({});
        assert.equal(text, '');
    });
});


// ─── H. generateBibliographyReport ──────────────────────────

describe('H. generateBibliographyReport', () => {
    it('generates complete report with correct structure', () => {
        const report = generateBibliographyReport(makeBriefing(), makeArticles(), makeSources());
        assert.ok('score' in report);
        assert.ok('totalRefs' in report);
        assert.ok('matched' in report);
        assert.ok('unmatched' in report);
        assert.ok('pass' in report);
        assert.ok('bibliography' in report);
        assert.ok('apiSources' in report);
        assert.ok('details' in report);
        assert.ok('methodology' in report);
    });

    it('bibliography contains articles with URLs', () => {
        const report = generateBibliographyReport(makeBriefing(), makeArticles(), makeSources());
        assert.ok(report.bibliography.length >= 3); // 3 articles with URLs
        for (const b of report.bibliography) {
            assert.ok(b.url.startsWith('http'));
            assert.ok(b.domain.length > 0);
        }
    });

    it('apiSources reflects available data sources', () => {
        const report = generateBibliographyReport(makeBriefing(), makeArticles(), makeSources());
        assert.ok(report.apiSources.length >= 5);
        const names = report.apiSources.map(a => a.name);
        assert.ok(names.includes('Finnhub'));
        assert.ok(names.includes('CoinGecko'));
        assert.ok(names.includes('FRED'));
    });

    it('detects inline source references', () => {
        const report = generateBibliographyReport(makeBriefing(), makeArticles(), makeSources());
        assert.ok(report.totalRefs > 0, 'should detect at least some references');
    });

    it('matches known sources correctly', () => {
        const report = generateBibliographyReport(makeBriefing(), makeArticles(), makeSources());
        assert.ok(report.matched > 0, 'should match at least some references');
        assert.ok(report.score > 0, 'score should be positive');
    });

    it('includes methodology information', () => {
        const report = generateBibliographyReport(makeBriefing(), makeArticles(), makeSources());
        assert.ok(report.methodology.description.length > 0);
        assert.ok(report.methodology.steps.length >= 3);
        assert.equal(report.methodology.totalArticlesUsed, 4);
        assert.ok(report.methodology.totalAPISources >= 5);
    });

    it('pass flag reflects MIN_TRACEABILITY_SCORE', () => {
        const report = generateBibliographyReport(makeBriefing(), makeArticles(), makeSources());
        assert.equal(report.pass, report.score >= MIN_TRACEABILITY_SCORE);
    });

    it('handles empty briefing', () => {
        const report = generateBibliographyReport({}, makeArticles(), makeSources());
        assert.equal(report.totalRefs, 0);
        assert.equal(report.score, 1); // no refs = nothing to verify = OK
        assert.ok(report.pass);
    });

    it('handles empty articles', () => {
        const report = generateBibliographyReport(makeBriefing(), [], makeSources());
        assert.equal(report.bibliography.length, 0);
        assert.ok(report.apiSources.length > 0); // API sources still present
    });
});


// ─── Configuration constants ─────────────────────────────────

describe('Configuration constants', () => {
    it('MIN_TRACEABILITY_SCORE is between 0 and 1', () => {
        assert.ok(MIN_TRACEABILITY_SCORE >= 0 && MIN_TRACEABILITY_SCORE <= 1);
    });

    it('API_SOURCE_REGISTRY has expected entries', () => {
        assert.ok('CoinGecko' in API_SOURCE_REGISTRY);
        assert.ok('Finnhub' in API_SOURCE_REGISTRY);
        assert.ok('FRED' in API_SOURCE_REGISTRY);
        assert.ok('ECB Data' in API_SOURCE_REGISTRY);
        assert.ok('metals.dev' in API_SOURCE_REGISTRY);
    });

    it('each API entry has required fields', () => {
        for (const [name, entry] of Object.entries(API_SOURCE_REGISTRY)) {
            assert.ok(entry.domain, `${name} missing domain`);
            assert.ok(entry.type, `${name} missing type`);
            assert.ok(entry.url, `${name} missing url`);
            assert.ok(entry.category, `${name} missing category`);
        }
    });
});
