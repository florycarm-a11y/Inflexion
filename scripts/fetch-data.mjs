#!/usr/bin/env node
/**
 * Inflexion — Script de récupération de données en temps réel
 * Exécuté par GitHub Actions toutes les 6h
 *
 * APIs utilisées :
 * - CoinGecko (gratuit, pas de clé) → crypto + trending
 * - Finnhub (clé gratuite) → indices boursiers + calendrier économique
 * - GNews (clé gratuite) → actualités multi-catégories
 * - FRED (clé gratuite) → données macroéconomiques (10 séries)
 * - Alternative.me (gratuit, pas de clé) → Fear & Greed Index crypto
 * - Alpha Vantage (clé gratuite) → forex, secteurs, top gainers/losers
 * - DefiLlama (gratuit, pas de clé) → TVL DeFi, protocoles, yields
 *
 * Les données sont écrites en JSON dans /data/
 * Le frontend les lit au chargement de la page
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// Créer le dossier data s'il n'existe pas
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// ─── Utilitaires ───────────────────────────────────────────
function writeJSON(filename, data) {
    const path = join(DATA_DIR, filename);
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✓ ${filename} écrit (${JSON.stringify(data).length} octets)`);
}

async function fetchJSON(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Accept': 'application/json', ...options.headers },
        signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
}

// ─── 1. CRYPTO (CoinGecko — gratuit, pas de clé) ──────────
async function fetchCrypto() {
    console.log('\n📊 Récupération crypto (CoinGecko)...');
    try {
        // Prix des principales cryptos
        const prices = await fetchJSON(
            'https://api.coingecko.com/api/v3/coins/markets?' + new URLSearchParams({
                vs_currency: 'usd',
                ids: 'bitcoin,ethereum,solana,ripple,cardano,dogecoin',
                order: 'market_cap_desc',
                per_page: '10',
                page: '1',
                sparkline: 'false',
                price_change_percentage: '24h,7d,30d'
            })
        );

        // Données globales du marché crypto
        const global = await fetchJSON('https://api.coingecko.com/api/v3/global');

        // Données stablecoins
        const stablecoins = await fetchJSON(
            'https://api.coingecko.com/api/v3/coins/markets?' + new URLSearchParams({
                vs_currency: 'usd',
                ids: 'tether,usd-coin,dai',
                order: 'market_cap_desc',
                per_page: '5',
                page: '1',
                sparkline: 'false'
            })
        );

        // Trending coins (top recherches — gratuit, pas de clé)
        let trending = [];
        try {
            const trendData = await fetchJSON('https://api.coingecko.com/api/v3/search/trending');
            trending = (trendData.coins || []).slice(0, 7).map(t => ({
                id: t.item.id,
                name: t.item.name,
                symbol: t.item.symbol,
                market_cap_rank: t.item.market_cap_rank,
                thumb: t.item.thumb,
                price_btc: t.item.price_btc,
                score: t.item.score
            }));
            console.log(`  ✓ ${trending.length} trending coins récupérées`);
        } catch (err) {
            console.warn('  ⚠ Trending coins non disponible:', err.message);
        }

        const cryptoData = {
            updated: new Date().toISOString(),
            prices: prices.map(c => ({
                id: c.id,
                name: c.name,
                symbol: c.symbol.toUpperCase(),
                price: c.current_price,
                change_24h: c.price_change_percentage_24h,
                change_7d: c.price_change_percentage_7d_in_currency,
                change_30d: c.price_change_percentage_30d_in_currency,
                market_cap: c.market_cap,
                volume_24h: c.total_volume,
                high_24h: c.high_24h,
                low_24h: c.low_24h,
                image: c.image
            })),
            global: {
                total_market_cap: global.data.total_market_cap?.usd,
                total_volume: global.data.total_volume?.usd,
                btc_dominance: global.data.market_cap_percentage?.btc,
                eth_dominance: global.data.market_cap_percentage?.eth,
                active_cryptos: global.data.active_cryptocurrencies,
                markets: global.data.markets,
                market_cap_change_24h: global.data.market_cap_change_percentage_24h_usd
            },
            trending,
            stablecoins: stablecoins.map(s => ({
                name: s.name,
                symbol: s.symbol.toUpperCase(),
                market_cap: s.market_cap,
                price: s.current_price
            }))
        };

        writeJSON('crypto.json', cryptoData);
        return true;
    } catch (err) {
        console.error('✗ Erreur crypto:', err.message);
        return false;
    }
}

// ─── 2. MARCHÉS (Finnhub — clé gratuite) ──────────────────
async function fetchMarkets() {
    const API_KEY = process.env.FINNHUB_API_KEY;
    if (!API_KEY) {
        console.log('\n⚠️  FINNHUB_API_KEY non définie — marchés ignorés');
        console.log('   → Ajouter le secret dans GitHub: Settings > Secrets > FINNHUB_API_KEY');
        console.log('   → Clé gratuite sur https://finnhub.io/register');
        return false;
    }

    console.log('\n📈 Récupération marchés (Finnhub)...');
    try {
        // Symboles à récupérer (indices via ETF/proxies)
        const symbols = [
            { symbol: 'SPY',  name: 'S&P 500',       proxy: true },
            { symbol: 'QQQ',  name: 'Nasdaq 100',     proxy: true },
            { symbol: 'DIA',  name: 'Dow Jones',      proxy: true },
            { symbol: 'GLD',  name: 'Or (ETF)',        proxy: true },
            { symbol: 'USO',  name: 'Pétrole (ETF)',   proxy: true },
            { symbol: 'NVDA', name: 'Nvidia',          proxy: false },
            { symbol: 'AAPL', name: 'Apple',           proxy: false },
            { symbol: 'MSFT', name: 'Microsoft',       proxy: false },
            { symbol: 'GOOGL',name: 'Alphabet',        proxy: false },
            { symbol: 'TSLA', name: 'Tesla',           proxy: false }
        ];

        const quotes = [];
        for (const s of symbols) {
            try {
                const q = await fetchJSON(
                    `https://finnhub.io/api/v1/quote?symbol=${s.symbol}&token=${API_KEY}`
                );
                if (q.c && q.c > 0) {
                    quotes.push({
                        symbol: s.symbol,
                        name: s.name,
                        price: q.c,           // current price
                        change: q.dp,         // percent change
                        change_abs: q.d,      // absolute change
                        high: q.h,            // day high
                        low: q.l,             // day low
                        open: q.o,            // open
                        prev_close: q.pc,     // previous close
                        is_proxy: s.proxy
                    });
                }
                // Rate limit: 60 calls/min sur Finnhub gratuit
                await new Promise(r => setTimeout(r, 250));
            } catch (err) {
                console.warn(`  ⚠ ${s.symbol}: ${err.message}`);
            }
        }

        // Calendrier économique (7 prochains jours)
        let economicCalendar = [];
        try {
            const from = new Date().toISOString().split('T')[0];
            const toDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
            const calData = await fetchJSON(
                `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${toDate}&token=${API_KEY}`
            );
            economicCalendar = (calData.economicCalendar || [])
                .filter(e => e.impact === 'high' || e.impact === 'medium')
                .slice(0, 20)
                .map(e => ({
                    date: e.date,
                    time: e.time,
                    country: e.country,
                    event: e.event,
                    impact: e.impact,
                    actual: e.actual,
                    estimate: e.estimate,
                    previous: e.prev,
                    unit: e.unit
                }));
            console.log(`  ✓ ${economicCalendar.length} événements économiques récupérés`);
            await new Promise(r => setTimeout(r, 250));
        } catch (err) {
            console.warn('  ⚠ Calendrier économique:', err.message);
        }

        // Récupérer les indices forex
        const forexPairs = [
            { symbol: 'OANDA:EUR_USD', name: 'EUR/USD' },
            { symbol: 'OANDA:USD_JPY', name: 'USD/JPY' }
        ];

        for (const fx of forexPairs) {
            try {
                const q = await fetchJSON(
                    `https://finnhub.io/api/v1/quote?symbol=${fx.symbol}&token=${API_KEY}`
                );
                if (q.c && q.c > 0) {
                    quotes.push({
                        symbol: fx.symbol,
                        name: fx.name,
                        price: q.c,
                        change: q.dp,
                        change_abs: q.d,
                        is_forex: true
                    });
                }
                await new Promise(r => setTimeout(r, 250));
            } catch (err) {
                console.warn(`  ⚠ ${fx.symbol}: ${err.message}`);
            }
        }

        const marketData = {
            updated: new Date().toISOString(),
            quotes,
            economicCalendar,
            summary: {
                total_symbols: quotes.length,
                market_open: isMarketOpen(),
                calendar_events: economicCalendar.length
            }
        };

        writeJSON('markets.json', marketData);
        return true;
    } catch (err) {
        console.error('✗ Erreur marchés:', err.message);
        return false;
    }
}

function isMarketOpen() {
    const now = new Date();
    const nyHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hour = nyHour.getHours();
    const day = nyHour.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
}

// ─── 3. ACTUALITÉS (GNews — clé gratuite, 100 req/jour) ───
async function fetchNews() {
    const API_KEY = process.env.GNEWS_API_KEY;
    if (!API_KEY) {
        console.log('\n⚠️  GNEWS_API_KEY non définie — actualités ignorées');
        console.log('   → Ajouter le secret dans GitHub: Settings > Secrets > GNEWS_API_KEY');
        console.log('   → Clé gratuite sur https://gnews.io/register');
        return false;
    }

    console.log('\n📰 Récupération actualités (GNews)...');
    try {
        // Requêtes pour chaque catégorie (optimisées avec mots-clés FR + IA)
        const categories = [
            {
                key: 'geopolitics',
                query: 'geopolitics OR tariffs OR trade war OR sanctions OR "foreign policy"',
                topic: 'world'
            },
            {
                key: 'markets',
                query: 'stock market OR S&P 500 OR Wall Street OR Federal Reserve OR earnings OR IPO',
                topic: 'business'
            },
            {
                key: 'crypto',
                query: 'bitcoin OR ethereum OR cryptocurrency OR stablecoin OR "crypto ETF"',
                topic: 'business'
            },
            {
                key: 'commodities',
                query: 'gold price OR oil price OR silver OR commodities OR precious metals',
                topic: 'business'
            },
            {
                key: 'ai_tech',
                query: 'artificial intelligence OR Nvidia OR OpenAI OR Anthropic OR "AI model" OR semiconductor',
                topic: 'technology'
            }
        ];

        const allNews = {};

        for (const cat of categories) {
            try {
                const data = await fetchJSON(
                    'https://gnews.io/api/v4/search?' + new URLSearchParams({
                        q: cat.query,
                        lang: 'en',
                        country: 'us',
                        max: '8',
                        sortby: 'publishedAt',
                        token: API_KEY
                    })
                );

                allNews[cat.key] = (data.articles || []).map(a => ({
                    title: a.title,
                    description: a.description,
                    source: a.source?.name || 'Unknown',
                    url: a.url,
                    image: a.image,
                    publishedAt: a.publishedAt,
                    time: formatDate(a.publishedAt)
                }));

                // Rate limit
                await new Promise(r => setTimeout(r, 1000));
            } catch (err) {
                console.warn(`  ⚠ ${cat.key}: ${err.message}`);
                allNews[cat.key] = [];
            }
        }

        const newsData = {
            updated: new Date().toISOString(),
            categories: allNews,
            total_articles: Object.values(allNews).reduce((sum, arr) => sum + arr.length, 0)
        };

        writeJSON('news.json', newsData);
        return true;
    } catch (err) {
        console.error('✗ Erreur actualités:', err.message);
        return false;
    }
}

function formatDate(isoDate) {
    const d = new Date(isoDate);
    const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
}

// ─── 4. DONNÉES MACRO (FRED — clé gratuite, 120 req/min) ───
async function fetchFRED() {
    const API_KEY = process.env.FRED_API_KEY;
    if (!API_KEY) {
        console.log('\n⚠️  FRED_API_KEY non définie — données macro ignorées');
        console.log('   → Ajouter le secret dans GitHub: Settings > Secrets > FRED_API_KEY');
        console.log('   → Clé gratuite sur https://fredaccount.stlouisfed.org/');
        return false;
    }

    console.log('\n🏛️  Récupération données macro (FRED)...');

    // Séries à récupérer (toutes gratuites, 120 req/min)
    const series = [
        { id: 'CPIAUCSL',     label: 'Inflation (CPI)',             unit: 'index',   format: 'yoy' },
        { id: 'DFF',          label: 'Taux directeur (Fed Funds)',   unit: '%',       format: 'last' },
        { id: 'GDP',          label: 'PIB (trimestriel)',            unit: 'Mrd $',   format: 'last' },
        { id: 'UNRATE',       label: 'Chômage',                     unit: '%',       format: 'last' },
        { id: 'DGS10',        label: 'Treasury 10 ans',             unit: '%',       format: 'last' },
        { id: 'DTWEXBGS',     label: 'Dollar Index (broad)',        unit: 'index',   format: 'last' },
        // ─── Nouvelles séries (Vague 10.2) ───
        { id: 'T10Y2Y',       label: 'Spread 10Y-2Y',              unit: '%',       format: 'last' },
        { id: 'M2SL',         label: 'Masse monétaire M2',         unit: 'Mrd $',   format: 'last' },
        { id: 'WALCL',        label: 'Bilan Fed (actifs)',          unit: 'M $',     format: 'last' },
        { id: 'MORTGAGE30US', label: 'Taux hypothécaire 30 ans',   unit: '%',       format: 'last' }
    ];

    const indicators = [];

    for (const s of series) {
        try {
            // Récupérer les 14 dernières observations (pour calculer les variations)
            const url = `https://api.stlouisfed.org/fred/series/observations?` +
                new URLSearchParams({
                    series_id: s.id,
                    api_key: API_KEY,
                    file_type: 'json',
                    sort_order: 'desc',
                    limit: '14'
                });

            const data = await fetchJSON(url);
            const obs = (data.observations || [])
                .filter(o => o.value !== '.')  // FRED utilise '.' pour les données manquantes
                .map(o => ({ date: o.date, value: parseFloat(o.value) }));

            if (obs.length === 0) {
                console.warn(`  ⚠ ${s.id}: aucune donnée`);
                continue;
            }

            const latest = obs[0];
            const previous = obs[1] || null;

            // Calculer la variation
            let change = null;
            let changeType = 'abs'; // absolute

            if (s.format === 'yoy' && obs.length >= 13) {
                // Year-over-Year pour le CPI
                const yearAgo = obs[12] || obs[obs.length - 1];
                change = ((latest.value - yearAgo.value) / yearAgo.value * 100);
                changeType = 'yoy';
            } else if (previous) {
                change = latest.value - previous.value;
            }

            indicators.push({
                id: s.id,
                label: s.label,
                value: latest.value,
                date: latest.date,
                unit: s.unit,
                change: change !== null ? Math.round(change * 100) / 100 : null,
                change_type: changeType,
                previous: previous ? { value: previous.value, date: previous.date } : null
            });

            console.log(`  ✓ ${s.label}: ${latest.value} (${latest.date})`);

            // Rate limit (plan gratuit: 120 req/min)
            await new Promise(r => setTimeout(r, 600));

        } catch (err) {
            console.warn(`  ⚠ ${s.id}: ${err.message}`);
        }
    }

    if (indicators.length === 0) {
        console.warn('  ✗ Aucun indicateur macro récupéré');
        return false;
    }

    const macroData = {
        updated: new Date().toISOString(),
        source: 'FRED (Federal Reserve Economic Data)',
        indicators
    };

    writeJSON('macro.json', macroData);
    return true;
}

// ─── 5. FEAR & GREED INDEX (alternative.me — gratuit, pas de clé) ──
async function fetchFearGreed() {
    console.log('\n😱 Récupération Fear & Greed Index (alternative.me)...');
    try {
        // Valeur actuelle + historique 30 jours
        const data = await fetchJSON(
            'https://api.alternative.me/fng/?limit=31&format=json'
        );

        if (!data.data || data.data.length === 0) {
            console.warn('  ⚠ Aucune donnée Fear & Greed');
            return false;
        }

        const current = data.data[0];
        const history = data.data.map(d => ({
            value: parseInt(d.value),
            label: d.value_classification,
            timestamp: parseInt(d.timestamp),
            date: new Date(parseInt(d.timestamp) * 1000).toISOString().split('T')[0]
        }));

        // Calculer la variation sur 7j et 30j
        const now = parseInt(current.value);
        const weekAgo = data.data[7] ? parseInt(data.data[7].value) : null;
        const monthAgo = data.data[30] ? parseInt(data.data[30].value) : null;

        const fngData = {
            updated: new Date().toISOString(),
            source: 'Alternative.me Crypto Fear & Greed Index',
            current: {
                value: now,
                label: current.value_classification,
                timestamp: parseInt(current.timestamp)
            },
            changes: {
                week: weekAgo !== null ? now - weekAgo : null,
                month: monthAgo !== null ? now - monthAgo : null
            },
            history
        };

        writeJSON('fear-greed.json', fngData);
        console.log(`  ✓ Fear & Greed: ${now} (${current.value_classification})`);
        return true;
    } catch (err) {
        console.error('✗ Erreur Fear & Greed:', err.message);
        return false;
    }
}

// ─── 6. ALPHA VANTAGE (forex, secteurs, gainers/losers — clé gratuite, 25 req/jour) ──
async function fetchAlphaVantage() {
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (!API_KEY) {
        console.log('\n⚠️  ALPHA_VANTAGE_API_KEY non définie — données AV ignorées');
        console.log('   → Clé gratuite sur https://www.alphavantage.co/support/#api-key');
        return false;
    }

    console.log('\n💱 Récupération Alpha Vantage (forex + secteurs + movers)...');
    try {
        // Forex : EUR/USD, GBP/USD, USD/JPY
        const forexPairs = [
            { from: 'EUR', to: 'USD' },
            { from: 'GBP', to: 'USD' },
            { from: 'USD', to: 'JPY' }
        ];

        const forex = [];
        for (const pair of forexPairs) {
            try {
                const data = await fetchJSON(
                    `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.from}&to_currency=${pair.to}&apikey=${API_KEY}`
                );
                const rate = data['Realtime Currency Exchange Rate'];
                if (rate) {
                    forex.push({
                        pair: `${pair.from}/${pair.to}`,
                        rate: parseFloat(rate['5. Exchange Rate']),
                        bid: parseFloat(rate['8. Bid Price']),
                        ask: parseFloat(rate['9. Ask Price']),
                        updated: rate['6. Last Refreshed']
                    });
                    console.log(`  ✓ ${pair.from}/${pair.to}: ${rate['5. Exchange Rate']}`);
                }
                await new Promise(r => setTimeout(r, 1500)); // 5 req/min max
            } catch (err) {
                console.warn(`  ⚠ ${pair.from}/${pair.to}: ${err.message}`);
            }
        }

        // Sector Performance (1 appel = performances de tous les secteurs)
        let sectors = null;
        try {
            const sectorData = await fetchJSON(
                `https://www.alphavantage.co/query?function=SECTOR&apikey=${API_KEY}`
            );
            // Extraire les performances temps réel
            const rtPerf = sectorData['Rank A: Real-Time Performance'] || {};
            const dayPerf = sectorData['Rank B: 1 Day Performance'] || {};
            const weekPerf = sectorData['Rank C: 5 Day Performance'] || {};
            const monthPerf = sectorData['Rank D: 1 Month Performance'] || {};

            sectors = Object.keys(rtPerf).map(sector => ({
                name: sector,
                realtime: parseFloat(rtPerf[sector]) || 0,
                day: parseFloat(dayPerf[sector]) || 0,
                week: parseFloat(weekPerf[sector]) || 0,
                month: parseFloat(monthPerf[sector]) || 0
            })).sort((a, b) => b.realtime - a.realtime);

            console.log(`  ✓ ${sectors.length} secteurs récupérés`);
            await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
            console.warn('  ⚠ Sector Performance:', err.message);
        }

        // Top Gainers / Losers / Most Active
        let topMovers = null;
        try {
            const moversData = await fetchJSON(
                `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${API_KEY}`
            );
            const mapMover = m => ({
                ticker: m.ticker,
                price: parseFloat(m.price),
                change: parseFloat(m.change_amount),
                changePct: parseFloat(m.change_percentage?.replace('%', '')),
                volume: parseInt(m.volume)
            });
            topMovers = {
                gainers: (moversData.top_gainers || []).slice(0, 5).map(mapMover),
                losers: (moversData.top_losers || []).slice(0, 5).map(mapMover),
                mostActive: (moversData.most_actively_traded || []).slice(0, 5).map(mapMover)
            };
            console.log(`  ✓ Top movers: ${topMovers.gainers.length}G / ${topMovers.losers.length}L / ${topMovers.mostActive.length}A`);
        } catch (err) {
            console.warn('  ⚠ Top Gainers/Losers:', err.message);
        }

        const avData = {
            updated: new Date().toISOString(),
            source: 'Alpha Vantage',
            forex,
            sectors,
            topMovers
        };

        writeJSON('alpha-vantage.json', avData);
        return true;
    } catch (err) {
        console.error('✗ Erreur Alpha Vantage:', err.message);
        return false;
    }
}

// ─── 7. DEFI LLAMA (TVL, protocoles, yields — gratuit, pas de clé) ──
async function fetchDefiLlama() {
    console.log('\n🦙 Récupération DeFi (DefiLlama)...');
    try {
        // Top protocoles par TVL (gros payload, on filtre côté client)
        const protocols = await fetchJSON('https://api.llama.fi/protocols');
        const topProtocols = protocols
            .filter(p => p.tvl > 0)
            .sort((a, b) => b.tvl - a.tvl)
            .slice(0, 20)
            .map(p => ({
                name: p.name,
                symbol: p.symbol || null,
                tvl: p.tvl,
                change_1d: p.change_1d || null,
                change_7d: p.change_7d || null,
                category: p.category,
                chains: (p.chains || []).slice(0, 5),
                logo: p.logo || null,
                url: p.url || null
            }));

        console.log(`  ✓ ${topProtocols.length} top protocoles DeFi`);

        // TVL par blockchain
        await new Promise(r => setTimeout(r, 500));
        const chains = await fetchJSON('https://api.llama.fi/v2/chains');
        const topChains = chains
            .sort((a, b) => b.tvl - a.tvl)
            .slice(0, 15)
            .map(c => ({
                name: c.name,
                gecko_id: c.gecko_id || null,
                tvl: c.tvl,
                tokenSymbol: c.tokenSymbol || null
            }));

        console.log(`  ✓ ${topChains.length} blockchains par TVL`);

        // Top yields (APY) — gros endpoint, on filtre fortement
        let topYields = [];
        try {
            await new Promise(r => setTimeout(r, 500));
            const yieldsData = await fetchJSON('https://yields.llama.fi/pools');
            topYields = (yieldsData.data || [])
                .filter(y => y.tvlUsd > 10_000_000 && y.apy > 0 && y.stablecoin === true)
                .sort((a, b) => b.tvlUsd - a.tvlUsd)
                .slice(0, 15)
                .map(y => ({
                    pool: y.pool,
                    project: y.project,
                    chain: y.chain,
                    symbol: y.symbol,
                    tvl: y.tvlUsd,
                    apy: Math.round(y.apy * 100) / 100,
                    apyBase: y.apyBase ? Math.round(y.apyBase * 100) / 100 : null,
                    apyReward: y.apyReward ? Math.round(y.apyReward * 100) / 100 : null,
                    stablecoin: y.stablecoin
                }));
            console.log(`  ✓ ${topYields.length} top yields stablecoins`);
        } catch (err) {
            console.warn('  ⚠ Yields:', err.message);
        }

        // TVL total (somme des protocoles)
        const totalTVL = protocols.reduce((sum, p) => sum + (p.tvl || 0), 0);

        const defiData = {
            updated: new Date().toISOString(),
            source: 'DefiLlama',
            totalTVL,
            topProtocols,
            topChains,
            topYields,
            summary: {
                total_protocols: protocols.length,
                total_chains: chains.length,
                total_tvl_formatted: totalTVL > 1e12
                    ? `${(totalTVL / 1e12).toFixed(2)}T`
                    : `${(totalTVL / 1e9).toFixed(2)}B`
            }
        };

        writeJSON('defi.json', defiData);
        return true;
    } catch (err) {
        console.error('✗ Erreur DefiLlama:', err.message);
        return false;
    }
}

// ─── 8. OR vs BITCOIN (pour le graphique) ──────────────────
async function fetchGoldBitcoinChart() {
    console.log('\n📉 Récupération données graphique Or vs Bitcoin...');
    try {
        // Historique BTC sur 90 jours (CoinGecko gratuit)
        const btcHistory = await fetchJSON(
            'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?' + new URLSearchParams({
                vs_currency: 'usd',
                days: '90',
                interval: 'daily'
            })
        );

        // Pour l'or, on utilise les données CoinGecko du gold-backed token PAX Gold comme proxy
        // ou on calcule à partir des données Finnhub si disponible
        let goldHistory = null;
        try {
            goldHistory = await fetchJSON(
                'https://api.coingecko.com/api/v3/coins/pax-gold/market_chart?' + new URLSearchParams({
                    vs_currency: 'usd',
                    days: '90',
                    interval: 'daily'
                })
            );
        } catch (err) {
            console.warn('  ⚠ PAX Gold non disponible, or ignoré pour le graphique');
        }

        const chartData = {
            updated: new Date().toISOString(),
            bitcoin: btcHistory.prices.map(([timestamp, price]) => ({
                date: new Date(timestamp).toISOString().split('T')[0],
                price: Math.round(price * 100) / 100
            })),
            gold: goldHistory ? goldHistory.prices.map(([timestamp, price]) => ({
                date: new Date(timestamp).toISOString().split('T')[0],
                price: Math.round(price * 100) / 100
            })) : null,
            period: '90d'
        };

        writeJSON('chart-gold-btc.json', chartData);
        return true;
    } catch (err) {
        console.error('✗ Erreur graphique:', err.message);
        return false;
    }
}

// ─── Exécution principale ──────────────────────────────────
async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  Inflexion — Mise à jour des données');
    console.log(`  ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════');

    const results = {
        crypto: await fetchCrypto(),
        markets: await fetchMarkets(),
        news: await fetchNews(),
        macro: await fetchFRED(),
        fearGreed: await fetchFearGreed(),
        alphaVantage: await fetchAlphaVantage(),
        defi: await fetchDefiLlama(),
        chart: await fetchGoldBitcoinChart()
    };

    // Écrire un fichier de métadonnées
    writeJSON('_meta.json', {
        last_update: new Date().toISOString(),
        results,
        next_update: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
    });

    console.log('\n═══════════════════════════════════════');
    console.log('  Résumé :');
    Object.entries(results).forEach(([k, v]) => {
        console.log(`  ${v ? '✅' : '⚠️ '} ${k}`);
    });
    console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
