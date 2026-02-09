#!/usr/bin/env node
/**
 * Inflexion — Script de récupération de données en temps réel
 * Exécuté par GitHub Actions toutes les 6h
 *
 * APIs utilisées :
 * - CoinGecko (gratuit, pas de clé) → crypto
 * - Finnhub (clé gratuite) → indices boursiers
 * - GNews (clé gratuite) → actualités
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
                active_cryptos: global.data.active_cryptocurrencies
            },
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
            summary: {
                total_symbols: quotes.length,
                market_open: isMarketOpen()
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
        // Requêtes pour chaque catégorie
        const categories = [
            {
                key: 'geopolitics',
                query: 'geopolitics OR tariffs OR trade war OR sanctions',
                topic: 'world'
            },
            {
                key: 'markets',
                query: 'stock market OR S&P 500 OR Wall Street OR Federal Reserve OR Nvidia OR AI',
                topic: 'business'
            },
            {
                key: 'crypto',
                query: 'bitcoin OR ethereum OR cryptocurrency OR stablecoin',
                topic: 'business'
            },
            {
                key: 'commodities',
                query: 'gold price OR oil price OR silver OR commodities OR precious metals',
                topic: 'business'
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

// ─── 4. OR vs BITCOIN (pour le graphique) ──────────────────
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
