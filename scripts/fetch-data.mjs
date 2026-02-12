#!/usr/bin/env node
/**
 * Inflexion — Script de récupération de données en temps réel
 * Exécuté par GitHub Actions toutes les 6h
 *
 * APIs utilisées (15 sources) :
 * - CoinGecko (gratuit, pas de clé) → crypto + trending
 * - Finnhub (clé gratuite) → indices boursiers + calendrier éco + VIX
 * - GNews (clé gratuite) → actualités multi-catégories
 * - FRED (clé gratuite) → données macroéconomiques US (10 séries)
 * - Alternative.me (gratuit, pas de clé) → Fear & Greed Index crypto
 * - Alpha Vantage (clé gratuite) → forex, secteurs, top gainers/losers
 * - DefiLlama (gratuit, pas de clé) → TVL DeFi, protocoles, yields
 * - metals.dev (gratuit) → cours métaux précieux & industriels
 * - Etherscan (gratuit) → ETH gas tracker
 * - Mempool.space (gratuit) → BTC fees, hashrate, difficulty
 * - ECB Data API (gratuit) → taux directeur BCE, EUR/USD fixing
 * - Messari (clé gratuite) → crypto avancé : dominance, volumes, liquidations
 * - Twelve Data (clé gratuite) → indices européens : CAC 40, DAX, FTSE
 * - World Bank (gratuit, pas de clé) → données macro internationales
 * - NewsAPI (clé gratuite) → complément GNews couverture plus large
 *
 * Flux RSS (gratuit, pas de clé — 97 flux spécialisés) :
 * 🌍 Géopolitique (20) : Le Figaro Intl, France 24, RFI, Courrier Intl, Le Monde Diplo,
 *   BBC, Al Jazeera, Guardian, NYT, Reuters, Politico EU, Foreign Policy, CFR,
 *   Brookings, Carnegie, CSIS, War on the Rocks, Responsible Statecraft,
 *   The Diplomat (Asie), Middle East Eye
 * 📈 Marchés (18) : Le Figaro (éco, conj, soc, flash), Les Echos, BFM, Boursorama,
 *   La Tribune, Capital, MarketWatch, Yahoo Finance, Seeking Alpha, CNBC,
 *   Investing.com, Wolf Street, Calculated Risk, Naked Capitalism, TLDR Fintech
 * ₿ Crypto (14) : CoinTelegraph FR, Cryptoast, Journal du Coin, CoinDesk,
 *   CoinTelegraph EN, The Block, Decrypt, Blockworks, Bitcoin Magazine,
 *   DL News, Unchained, Rekt News, Chainalysis, TLDR Crypto
 * ⛏️ Commodités (13) : OilPrice, Rigzone, Reuters Commod, Natural Gas Intel,
 *   Kitco (Gold + Metals), Mining.com, MetalMiner, S&P Global, AgWeb,
 *   World Grain, Hellenic Shipping, Trading Economics
 * 🤖 IA & Tech (17) : Le Figaro Tech, 01net, Numerama, JDN, TechCrunch,
 *   The Verge, Ars Technica, Wired, Hacker News, VentureBeat AI,
 *   MIT Tech Review, IEEE Spectrum AI, MarkTechPost, The Decoder,
 *   Krebs on Security, BleepingComputer, The Register, TLDR Tech/AI
 *
 * Les données sont écrites en JSON dans /data/
 * Le frontend les lit au chargement de la page
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Support proxy (pour environnements sandboxés) ───────
// Node.js fetch() n'utilise PAS les variables HTTP_PROXY/HTTPS_PROXY nativement.
// On détecte le proxy et on configure undici (bundlé avec Node 22+) si besoin.
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
if (PROXY_URL) {
    try {
        const { ProxyAgent, setGlobalDispatcher } = await import('undici');
        setGlobalDispatcher(new ProxyAgent(PROXY_URL));
        console.log('🔌 Proxy détecté et configuré pour fetch()');
    } catch (e) {
        console.warn('⚠️  Proxy détecté mais undici non disponible:', e.message);
    }
}

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

async function fetchText(url) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Inflexion/1.0 (+https://inflexionhub.com)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.text();
}

// ─── Parsing RSS / Atom ──────────────────────────────────
function stripHTML(str) {
    if (!str) return '';
    return str
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractRSSFields(block) {
    const getTag = (tag) => {
        const m = block.match(new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tag}>`, 'i'));
        return m ? (m[1] || m[2] || '').trim() : null;
    };
    const getLink = () => {
        const m = block.match(/<link[^>]*>(?:<!\[CDATA\[)?\s*(https?:\/\/[^\s<\]]+)/i);
        return m ? m[1].trim() : null;
    };
    const getImage = () => {
        let m = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/i);
        if (m) return m[1];
        m = block.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i);
        if (m) return m[1];
        const desc = getTag('description') || '';
        m = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (m) return m[1];
        return null;
    };
    return {
        title: stripHTML(getTag('title')),
        description: stripHTML(getTag('description') || getTag('content:encoded') || '').slice(0, 300),
        link: getLink() || getTag('link'),
        pubDate: getTag('pubDate') || getTag('dc:date'),
        image: getImage()
    };
}

function extractAtomFields(block) {
    const getTag = (tag) => {
        const m = block.match(new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tag}>`, 'i'));
        return m ? (m[1] || m[2] || '').trim() : null;
    };
    const getLink = () => {
        const m = block.match(/<link[^>]*href=["']([^"']+)["']/i);
        return m ? m[1] : null;
    };
    const getImage = () => {
        const content = getTag('content') || getTag('summary') || '';
        const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
        return m ? m[1] : null;
    };
    return {
        title: stripHTML(getTag('title')),
        description: stripHTML(getTag('summary') || getTag('content') || '').slice(0, 300),
        link: getLink(),
        pubDate: getTag('published') || getTag('updated'),
        image: getImage()
    };
}

function parseRSSItems(xml) {
    const items = [];
    // RSS 2.0 <item> elements
    const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
        const item = extractRSSFields(match[1]);
        if (item.title) items.push(item);
    }
    // Atom <entry> fallback
    if (items.length === 0) {
        const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
        while ((match = entryRegex.exec(xml)) !== null) {
            const item = extractAtomFields(match[1]);
            if (item.title) items.push(item);
        }
    }
    return items;
}

// ─── Sources RSS (gratuit, pas de clé API) ───────────────
// 97 flux ultra-spécialisés couvrant 6 rubriques — mis à jour fév. 2026
const RSS_SOURCES = [

    // ╔══════════════════════════════════════════════════════════╗
    // ║  🌍 GÉOPOLITIQUE — 20 sources                           ║
    // ╚══════════════════════════════════════════════════════════╝

    // 🇫🇷 Presse française — International
    { url: 'https://www.lefigaro.fr/rss/figaro_international.xml',      source: 'Le Figaro',            cats: ['geopolitics'] },
    { url: 'https://www.france24.com/fr/rss',                           source: 'France 24',            cats: ['geopolitics'] },
    { url: 'https://www.rfi.fr/fr/rss',                                 source: 'RFI',                  cats: ['geopolitics'] },
    { url: 'https://www.courrierinternational.com/feed/all/rss.xml',    source: 'Courrier International', cats: ['geopolitics'] },
    { url: 'https://www.monde-diplomatique.fr/export/rss',              source: 'Le Monde Diplomatique', cats: ['geopolitics'] },

    // 🌍 Presse internationale
    { url: 'https://feeds.bbci.co.uk/news/world/rss.xml',              source: 'BBC World',             cats: ['geopolitics'], lang: 'en' },
    { url: 'https://www.aljazeera.com/xml/rss/all.xml',                source: 'Al Jazeera',            cats: ['geopolitics'], lang: 'en' },
    { url: 'https://www.theguardian.com/world/rss',                    source: 'The Guardian',          cats: ['geopolitics'], lang: 'en' },
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',   source: 'New York Times',        cats: ['geopolitics'], lang: 'en' },
    { url: 'https://feeds.reuters.com/Reuters/worldNews',              source: 'Reuters',               cats: ['geopolitics'], lang: 'en' },
    { url: 'https://www.politico.eu/feed/',                            source: 'Politico EU',           cats: ['geopolitics'], lang: 'en' },

    // 🏛️ Think tanks & analyses stratégiques
    { url: 'https://foreignpolicy.com/feed/',                          source: 'Foreign Policy',        cats: ['geopolitics'], lang: 'en' },
    { url: 'https://feeds.cfr.org/all',                                  source: 'CFR',                   cats: ['geopolitics'], lang: 'en' },
    { url: 'https://www.brookings.edu/feed/',                          source: 'Brookings',             cats: ['geopolitics'], lang: 'en' },
    { url: 'https://carnegieendowment.org/rss/solr.xml',              source: 'Carnegie',              cats: ['geopolitics'], lang: 'en' },
    { url: 'https://www.csis.org/rss.xml',                              source: 'CSIS',                  cats: ['geopolitics'], lang: 'en' },
    { url: 'https://responsiblestatecraft.org/feed/',                  source: 'Responsible Statecraft', cats: ['geopolitics'], lang: 'en' },
    { url: 'https://warontherocks.com/feed/',                          source: 'War on the Rocks',      cats: ['geopolitics'], lang: 'en' },

    // 🌏 Sources régionales spécialisées
    { url: 'https://thediplomat.com/feed/',                            source: 'The Diplomat',          cats: ['geopolitics'], lang: 'en' },
    { url: 'https://www.middleeasteye.net/rss',                       source: 'Middle East Eye',       cats: ['geopolitics'], lang: 'en' },

    // ╔══════════════════════════════════════════════════════════╗
    // ║  📈 MARCHÉS & FINANCE — 18 sources                      ║
    // ╚══════════════════════════════════════════════════════════╝

    // 🇫🇷 Presse française — Économie & Finance
    { url: 'https://www.lefigaro.fr/rss/figaro_economie.xml',           source: 'Le Figaro Éco',       cats: ['markets'] },
    { url: 'https://www.lefigaro.fr/rss/figaro_conjoncture.xml',        source: 'Le Figaro',            cats: ['markets', 'commodities'] },
    { url: 'https://www.lefigaro.fr/rss/figaro_societes.xml',           source: 'Le Figaro Sociétés',   cats: ['markets'] },
    { url: 'https://www.lefigaro.fr/rss/figaro_flash-eco.xml',          source: 'Le Figaro Flash Éco',  cats: ['markets'] },
    { url: 'https://syndication.lesechos.fr/rss/rss_une_titres.xml',    source: 'Les Echos',            cats: ['markets'] },
    { url: 'https://www.bfmtv.com/rss/economie/',                       source: 'BFM Business',         cats: ['markets'] },
    { url: 'https://www.zonebourse.com/rss/',                            source: 'Zonebourse',           cats: ['markets'] },
    { url: 'https://www.latribune.fr/feed.xml',                         source: 'La Tribune',           cats: ['markets'] },
    { url: 'https://www.capital.fr/feeds',                              source: 'Capital',              cats: ['markets'] },

    // 🌍 Presse financière internationale
    { url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',  source: 'MarketWatch',       cats: ['markets'],   lang: 'en' },
    { url: 'https://finance.yahoo.com/news/rssindex',                     source: 'Yahoo Finance',     cats: ['markets'],   lang: 'en' },
    { url: 'https://seekingalpha.com/market_currents.xml',                source: 'Seeking Alpha',     cats: ['markets'],   lang: 'en' },
    { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',      source: 'CNBC',              cats: ['markets'],   lang: 'en' },
    { url: 'https://www.investing.com/rss/news.rss',                     source: 'Investing.com',     cats: ['markets'],   lang: 'en' },

    // 📊 Analyse macro & marchés spécialisée
    { url: 'https://wolfstreet.com/feed/',                              source: 'Wolf Street',          cats: ['markets'],   lang: 'en' },
    { url: 'https://www.calculatedriskblog.com/feeds/posts/default?alt=rss', source: 'Calculated Risk', cats: ['markets'],   lang: 'en' },
    { url: 'https://www.nakedcapitalism.com/feed',                     source: 'Naked Capitalism',     cats: ['markets'],   lang: 'en' },

    // 📧 Newsletter finance
    { url: 'https://tldr.tech/api/rss/fintech',                         source: 'TLDR Fintech',         cats: ['markets'],   lang: 'en' },

    // ╔══════════════════════════════════════════════════════════╗
    // ║  ₿ CRYPTO & BLOCKCHAIN — 14 sources                     ║
    // ╚══════════════════════════════════════════════════════════╝

    // 🇫🇷 Crypto françaises
    { url: 'https://fr.cointelegraph.com/rss',                          source: 'CoinTelegraph FR',     cats: ['crypto'] },
    { url: 'https://cryptoast.fr/feed/',                                 source: 'Cryptoast',            cats: ['crypto'] },
    { url: 'https://journalducoin.com/feed/',                           source: 'Journal du Coin',      cats: ['crypto'] },

    // 🌍 Crypto internationale — Actualités
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',           source: 'CoinDesk',             cats: ['crypto'],    lang: 'en' },
    { url: 'https://cointelegraph.com/rss',                             source: 'CoinTelegraph',        cats: ['crypto'],    lang: 'en' },
    { url: 'https://www.theblock.co/rss.xml',                          source: 'The Block',             cats: ['crypto'],    lang: 'en' },
    { url: 'https://decrypt.co/feed',                                  source: 'Decrypt',               cats: ['crypto'],    lang: 'en' },
    { url: 'https://blockworks.co/feed',                               source: 'Blockworks',            cats: ['crypto'],    lang: 'en' },
    { url: 'https://bitcoinmagazine.com/.rss/full/',                   source: 'Bitcoin Magazine',      cats: ['crypto'],    lang: 'en' },

    // 🔬 Crypto spécialisé — DeFi, régulation, analyse on-chain
    { url: 'https://www.thedefiant.io/feed',                            source: 'The Defiant',           cats: ['crypto'],    lang: 'en' },
    { url: 'https://unchainedcrypto.com/feed/',                        source: 'Unchained',            cats: ['crypto'],    lang: 'en' },
    { url: 'https://www.web3isgoinggreat.com/feed.xml',                 source: 'Web3 is Going Great',   cats: ['crypto'],    lang: 'en' },
    { url: 'https://blog.chainalysis.com/feed/',                       source: 'Chainalysis',          cats: ['crypto'],    lang: 'en' },

    // 📧 Newsletter crypto
    { url: 'https://tldr.tech/api/rss/crypto',                          source: 'TLDR Crypto',          cats: ['crypto'],    lang: 'en' },

    // ╔══════════════════════════════════════════════════════════╗
    // ║  ⛏️ MATIÈRES PREMIÈRES — 13 sources                      ║
    // ╚══════════════════════════════════════════════════════════╝

    // 🇫🇷 Conjoncture française (aussi commodités)
    // (Le Figaro Conjoncture est déjà en dual-cat markets+commodities ci-dessus)

    // 🛢️ Énergie & Pétrole
    { url: 'https://oilprice.com/rss/main',                             source: 'OilPrice',             cats: ['commodities'], lang: 'en' },
    { url: 'https://www.rigzone.com/news/rss/rigzone_latest.aspx',     source: 'Rigzone',              cats: ['commodities'], lang: 'en' },
    { url: 'https://www.reuters.com/arc/outboundfeeds/v3/search/section/commodities/?outputType=xml&size=20', source: 'Reuters Commodities', cats: ['commodities'], lang: 'en' },
    { url: 'https://www.naturalgasintel.com/feed/',                    source: 'Natural Gas Intel',     cats: ['commodities'], lang: 'en' },

    // 🥇 Métaux précieux & industriels
    { url: 'https://www.goldprice.org/rss-feeds',                       source: 'GoldPrice.org',          cats: ['commodities'], lang: 'en' },
    { url: 'https://www.mining.com/feed/',                             source: 'Mining.com',            cats: ['commodities'], lang: 'en' },
    { url: 'https://agmetalminer.com/feed/',                           source: 'MetalMiner',            cats: ['commodities'], lang: 'en' },
    { url: 'https://www.spglobal.com/commodityinsights/en/rss-feed/platts-top-250',  source: 'S&P Global',  cats: ['commodities'], lang: 'en' },

    // 🌾 Agriculture & Soft commodities
    { url: 'https://www.feedstuffs.com/rss.xml',                        source: 'Feedstuffs',            cats: ['commodities'], lang: 'en' },
    { url: 'https://www.dtnpf.com/agriculture/web/ag/news/rss',       source: 'DTN Ag News',           cats: ['commodities'], lang: 'en' },

    // 🌐 Analyses transversales commodités
    { url: 'https://www.hellenicshippingnews.com/feed/',               source: 'Hellenic Shipping',     cats: ['commodities'], lang: 'en' },
    { url: 'https://tradingeconomics.com/rss/news.aspx',              source: 'Trading Economics',     cats: ['commodities', 'markets'], lang: 'en' },

    // ╔══════════════════════════════════════════════════════════╗
    // ║  🤖 IA, TECH & CYBERSÉCURITÉ — 17 sources                ║
    // ╚══════════════════════════════════════════════════════════╝

    // 🇫🇷 Tech & IA françaises
    { url: 'https://www.lefigaro.fr/rss/figaro_secteur_high-tech.xml',  source: 'Le Figaro Tech',       cats: ['ai_tech'] },
    { url: 'https://www.01net.com/feed/',                               source: '01net',                cats: ['ai_tech'] },
    { url: 'https://www.numerama.com/feed/',                            source: 'Numerama',             cats: ['ai_tech'] },
    { url: 'https://www.nextinpact.com/feed',                            source: 'Next INpact',           cats: ['ai_tech'] },

    // 🌍 Tech généraliste international
    { url: 'https://techcrunch.com/feed/',                             source: 'TechCrunch',            cats: ['ai_tech'],   lang: 'en' },
    { url: 'https://www.theverge.com/rss/index.xml',                   source: 'The Verge',             cats: ['ai_tech'],   lang: 'en' },
    { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', source: 'Ars Technica',          cats: ['ai_tech'],   lang: 'en' },
    { url: 'https://www.wired.com/feed/rss',                          source: 'Wired',                 cats: ['ai_tech'],   lang: 'en' },
    { url: 'https://hnrss.org/frontpage?count=15',                    source: 'Hacker News',           cats: ['ai_tech'],   lang: 'en' },

    // 🧠 IA & Machine Learning spécialisé
    { url: 'https://venturebeat.com/category/ai/feed/',                source: 'VentureBeat AI',       cats: ['ai_tech'],   lang: 'en' },
    { url: 'https://feeds.technologyreview.com/technologyreview/topnews', source: 'MIT Tech Review',   cats: ['ai_tech'],   lang: 'en' },
    { url: 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss', source: 'IEEE Spectrum AI', cats: ['ai_tech'], lang: 'en' },
    { url: 'https://www.marktechpost.com/feed/',                       source: 'MarkTechPost',          cats: ['ai_tech'],   lang: 'en' },
    { url: 'https://the-decoder.com/feed/',                            source: 'The Decoder',           cats: ['ai_tech'],   lang: 'en' },

    // 🔒 Cybersécurité & IT
    { url: 'https://krebsonsecurity.com/feed/',                        source: 'Krebs on Security',     cats: ['ai_tech'],   lang: 'en' },
    { url: 'https://www.bleepingcomputer.com/feed/',                   source: 'BleepingComputer',      cats: ['ai_tech'],   lang: 'en' },
    { url: 'https://www.theregister.com/headlines.atom',               source: 'The Register',          cats: ['ai_tech'],   lang: 'en' },

    // 📧 Newsletters IA & Tech
    { url: 'https://tldr.tech/api/rss/tech',                            source: 'TLDR Tech',            cats: ['ai_tech'],   lang: 'en' },
    { url: 'https://tldr.tech/api/rss/ai',                              source: 'TLDR AI',              cats: ['ai_tech'],   lang: 'en' },

    // ╔══════════════════════════════════════════════════════════╗
    // ║  🇫🇷 SOURCES FRANCOPHONES COMPLÉMENTAIRES — 6 sources    ║
    // ╚══════════════════════════════════════════════════════════╝

    { url: 'https://www.lemonde.fr/economie/rss_full.xml',              source: 'Le Monde Éco',          cats: ['markets'] },
    { url: 'https://www.challenges.fr/rss.xml',                         source: 'Challenges',            cats: ['markets'] },
    { url: 'https://www.moneyvox.fr/actu/feed/',                        source: 'MoneyVox',              cats: ['markets'] },
    { url: 'https://www.lemonde.fr/international/rss_full.xml',         source: 'Le Monde Intl',         cats: ['geopolitics'] },
    { url: 'https://www.lefigaro.fr/rss/figaro_finances-perso.xml',    source: 'Le Figaro Finances',    cats: ['markets'] },
    { url: 'https://www.latribune.fr/feed/entreprises-finance.xml',    source: 'La Tribune Finance',    cats: ['markets'] },

    // ╔══════════════════════════════════════════════════════════╗
    // ║  🏛️ THINK TANKS MACRO — 6 sources                        ║
    // ╚══════════════════════════════════════════════════════════╝

    { url: 'https://www.bis.org/doclist/rss/speeches.rss',              source: 'BIS (BRI)',             cats: ['markets', 'geopolitics'], lang: 'en' },
    { url: 'https://blogs.imf.org/feed/',                               source: 'IMF Blog',             cats: ['markets', 'geopolitics'], lang: 'en' },
    { url: 'https://www.weforum.org/feed/rss',                          source: 'World Economic Forum', cats: ['markets', 'geopolitics'], lang: 'en' },
    { url: 'https://www.piie.com/rss.xml',                              source: 'PIIE',                 cats: ['markets'],   lang: 'en' },
    { url: 'https://voxeu.org/feed',                                    source: 'VoxEU / CEPR',         cats: ['markets'],   lang: 'en' },
    { url: 'https://www.oecd.org/newsroom/index.xml',                   source: 'OECD',                 cats: ['markets', 'geopolitics'], lang: 'en' },

    // ╔══════════════════════════════════════════════════════════╗
    // ║  ⚡ ÉNERGIE & CLIMAT — 7 sources                         ║
    // ╚══════════════════════════════════════════════════════════╝

    { url: 'https://www.iea.org/rss/news.xml',                          source: 'IEA',                  cats: ['commodities', 'geopolitics'], lang: 'en' },
    { url: 'https://www.irena.org/rss',                                 source: 'IRENA',                cats: ['commodities'], lang: 'en' },
    { url: 'https://www.carbonbrief.org/feed/',                         source: 'Carbon Brief',         cats: ['commodities'], lang: 'en' },
    { url: 'https://cleantechnica.com/feed/',                           source: 'CleanTechnica',        cats: ['commodities', 'ai_tech'], lang: 'en' },
    { url: 'https://www.reuters.com/arc/outboundfeeds/v3/search/section/sustainability/?outputType=xml&size=15', source: 'Reuters Sustainability', cats: ['commodities'], lang: 'en' },
    { url: 'https://www.energymonitor.ai/feed/',                        source: 'Energy Monitor',       cats: ['commodities'], lang: 'en' },
    { url: 'https://www.spglobal.com/commodityinsights/en/rss-feed/energy-transition', source: 'S&P Energy Transition', cats: ['commodities'], lang: 'en' },
];

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

// ─── 3. ACTUALITÉS (GNews + RSS — multi-sources) ─────────
async function fetchNews() {
    console.log('\n📰 Récupération actualités (GNews + RSS)...');

    const allNews = {};
    const categoryKeys = ['geopolitics', 'markets', 'crypto', 'commodities', 'ai_tech'];
    for (const key of categoryKeys) allNews[key] = [];

    // ─── 3a. GNews (clé gratuite, 100 req/jour) ─────────────
    const GNEWS_KEY = process.env.GNEWS_API_KEY;
    if (GNEWS_KEY) {
        console.log('  🔑 GNews API...');
        const categories = [
            { key: 'geopolitics', query: 'géopolitique OR sanctions OR "guerre commerciale" OR "droits de douane" OR diplomatie OR OTAN OR "conflit" OR "tensions" OR BRICS OR "élections"', topic: 'world' },
            { key: 'markets', query: 'bourse OR "marchés financiers" OR "Wall Street" OR "banque centrale" OR "taux directeur" OR résultats OR BCE OR "obligations" OR "récession" OR "inflation"', topic: 'business' },
            { key: 'crypto', query: 'bitcoin OR ethereum OR cryptomonnaie OR stablecoin OR "ETF crypto" OR blockchain OR solana OR DeFi OR "régulation crypto"', topic: 'business' },
            { key: 'commodities', query: '"prix de l\'or" OR "cours du pétrole" OR "matières premières" OR "métaux précieux" OR OPEP OR "gaz naturel" OR cuivre OR lithium OR "terres rares"', topic: 'business' },
            { key: 'ai_tech', query: '"intelligence artificielle" OR Nvidia OR OpenAI OR Anthropic OR "semi-conducteur" OR "puce IA" OR "modèle IA" OR robotique OR quantique OR cybersécurité', topic: 'technology' }
        ];

        const fallbackQueries = {
            geopolitics: 'geopolitics OR tariffs OR trade war OR sanctions OR "foreign policy" OR NATO OR BRICS OR "Middle East" OR "US-China" OR elections',
            markets: 'stock market OR S&P 500 OR Wall Street OR "Federal Reserve" OR earnings OR recession OR "interest rates" OR bonds OR ECB',
            crypto: 'bitcoin OR ethereum OR cryptocurrency OR stablecoin OR "crypto ETF" OR solana OR DeFi OR "crypto regulation" OR "digital assets"',
            commodities: 'gold price OR oil price OR silver OR commodities OR "precious metals" OR "natural gas" OR copper OR lithium OR "rare earths" OR OPEC',
            ai_tech: 'artificial intelligence OR Nvidia OR OpenAI OR Anthropic OR "AI model" OR semiconductor OR robotics OR quantum OR cybersecurity OR "tech stocks"'
        };

        for (const cat of categories) {
            try {
                const data = await fetchJSON(
                    'https://gnews.io/api/v4/search?' + new URLSearchParams({
                        q: cat.query, lang: 'fr', country: 'fr',
                        max: '8', sortby: 'publishedAt', token: GNEWS_KEY
                    })
                );
                allNews[cat.key] = (data.articles || []).map(a => ({
                    title: a.title, description: a.description,
                    source: a.source?.name || 'Inconnu', url: a.url, image: a.image,
                    publishedAt: a.publishedAt, time: formatDate(a.publishedAt), via: 'gnews'
                }));
                console.log(`  ✓ GNews ${cat.key} (FR): ${allNews[cat.key].length} articles`);

                // Fallback EN si < 3 résultats FR
                if (allNews[cat.key].length < 3 && fallbackQueries[cat.key]) {
                    console.log(`  ↻ ${cat.key}: peu de résultats FR, ajout EN...`);
                    await new Promise(r => setTimeout(r, 1000));
                    const enData = await fetchJSON(
                        'https://gnews.io/api/v4/search?' + new URLSearchParams({
                            q: fallbackQueries[cat.key], lang: 'en', country: 'us',
                            max: String(8 - allNews[cat.key].length),
                            sortby: 'publishedAt', token: GNEWS_KEY
                        })
                    );
                    const enArticles = (enData.articles || []).map(a => ({
                        title: a.title, description: a.description,
                        source: a.source?.name || 'Unknown', url: a.url, image: a.image,
                        publishedAt: a.publishedAt, time: formatDate(a.publishedAt),
                        lang: 'en', via: 'gnews'
                    }));
                    allNews[cat.key].push(...enArticles);
                    console.log(`  ✓ GNews ${cat.key} (EN fallback): +${enArticles.length}`);
                }
                await new Promise(r => setTimeout(r, 1000));
            } catch (err) {
                console.warn(`  ⚠ GNews ${cat.key}: ${err.message}`);
            }
        }
    } else {
        console.log('  ⚠️  GNEWS_API_KEY non définie — GNews ignoré (RSS uniquement)');
    }

    // ─── 3b. Flux RSS (gratuit, pas de clé) ─────────────────
    console.log('  📡 Flux RSS...');
    const rssStats = { success: 0, failed: 0, articles: 0 };
    const rssFeedResults = [];

    for (const feed of RSS_SOURCES) {
        try {
            const xml = await fetchText(feed.url);
            const items = parseRSSItems(xml);
            const articles = items.slice(0, 5).map(item => {
                let pubISO;
                try { pubISO = new Date(item.pubDate).toISOString(); }
                catch { pubISO = new Date().toISOString(); }
                return {
                    title: item.title,
                    description: item.description || '',
                    source: feed.source,
                    url: item.link,
                    image: item.image,
                    publishedAt: pubISO,
                    time: formatDate(pubISO),
                    ...(feed.lang === 'en' ? { lang: 'en' } : {}),
                    via: 'rss'
                };
            });

            for (const cat of feed.cats) {
                if (allNews[cat]) allNews[cat].push(...articles);
            }

            rssFeedResults.push({ source: feed.source, url: feed.url, count: articles.length, ok: true });
            rssStats.success++;
            rssStats.articles += articles.length;
            console.log(`  ✓ RSS ${feed.source}: ${articles.length} articles`);

            await new Promise(r => setTimeout(r, 300));
        } catch (err) {
            rssFeedResults.push({ source: feed.source, url: feed.url, count: 0, ok: false, error: err.message });
            rssStats.failed++;
            console.warn(`  ⚠ RSS ${feed.source}: ${err.message}`);
        }
    }

    console.log(`  📡 RSS bilan: ${rssStats.success} OK, ${rssStats.failed} erreurs, ${rssStats.articles} articles`);

    // ─── 3c. Déduplication + tri par date ────────────────────
    for (const key of categoryKeys) {
        const seen = new Set();
        allNews[key] = allNews[key]
            .filter(a => {
                const k = a.title?.toLowerCase().replace(/\s+/g, ' ').trim();
                if (!k || seen.has(k)) return false;
                seen.add(k);
                return true;
            })
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, 30);
    }

    // ─── 3d. Enrichissement rubrique ─────────────────────────
    const rubriqueMap = {
        geopolitics: { rubrique: 'geopolitique', rubrique_label: 'Géopolitique', rubrique_emoji: '🌍' },
        markets:     { rubrique: 'marches', rubrique_label: 'Marchés', rubrique_emoji: '📈' },
        crypto:      { rubrique: 'crypto', rubrique_label: 'Crypto', rubrique_emoji: '₿' },
        commodities: { rubrique: 'matieres_premieres', rubrique_label: 'Matières Premières', rubrique_emoji: '⛏️' },
        ai_tech:     { rubrique: 'ai_tech', rubrique_label: 'IA & Tech', rubrique_emoji: '🤖' }
    };

    for (const [key, articles] of Object.entries(allNews)) {
        const meta = rubriqueMap[key];
        if (meta) {
            for (const article of articles) {
                article.rubrique = meta.rubrique;
                article.rubrique_label = meta.rubrique_label;
                article.rubrique_emoji = meta.rubrique_emoji;
            }
        }
    }

    // ─── 3e. Écriture news.json ──────────────────────────────
    const totalArticles = Object.values(allNews).reduce((sum, arr) => sum + arr.length, 0);
    const newsData = {
        updated: new Date().toISOString(),
        sources: { gnews: !!GNEWS_KEY, rss: rssStats.success },
        categories: allNews,
        total_articles: totalArticles
    };
    writeJSON('news.json', newsData);

    // ─── 3f. Écriture rss-feeds.json (suivi des sources) ────
    writeJSON('rss-feeds.json', {
        updated: new Date().toISOString(),
        feeds: rssFeedResults,
        stats: rssStats
    });

    console.log(`  📰 Total news: ${totalArticles} articles (GNews + RSS combinés)`);
    return true;
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

// ─── 9. COURS MATIÈRES PREMIÈRES (metals.dev — gratuit, pas de clé) ──
async function fetchCommodityPrices() {
    console.log('\n⛏️  Récupération cours matières premières (multi-sources gratuites)...');
    try {
        const commodities = { updated: new Date().toISOString(), metals: {}, energy: {} };

        // Métaux précieux via metals.dev (gratuit, pas de clé)
        try {
            const metalsData = await fetchJSON('https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=toz');
            if (metalsData.metals) {
                const wanted = { gold: 'Or', silver: 'Argent', platinum: 'Platine', palladium: 'Palladium' };
                for (const [key, label] of Object.entries(wanted)) {
                    if (metalsData.metals[key]) {
                        commodities.metals[key] = {
                            label,
                            price_usd: metalsData.metals[key],
                            unit: 'oz troy'
                        };
                    }
                }
                console.log(`  ✓ ${Object.keys(commodities.metals).length} métaux précieux`);
            }
        } catch (err) {
            console.warn('  ⚠ metals.dev:', err.message);
        }

        // Cours énergie via économie gouv / données publiques
        // On complète avec les données déjà dans markets.json (GLD, USO proxies)
        // et les données Kitco via RSS (qualitatives)

        // Métaux industriels via metals.dev
        try {
            const baseData = await fetchJSON('https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=kg');
            if (baseData.metals) {
                const industrial = { copper: 'Cuivre', aluminum: 'Aluminium', nickel: 'Nickel', zinc: 'Zinc', tin: 'Étain' };
                commodities.industrial = {};
                for (const [key, label] of Object.entries(industrial)) {
                    if (baseData.metals[key]) {
                        commodities.industrial[key] = {
                            label,
                            price_usd_kg: baseData.metals[key],
                            unit: 'kg'
                        };
                    }
                }
                console.log(`  ✓ ${Object.keys(commodities.industrial).length} métaux industriels`);
            }
        } catch (err) {
            console.warn('  ⚠ Métaux industriels:', err.message);
        }

        writeJSON('commodities.json', commodities);
        return true;
    } catch (err) {
        console.error('✗ Erreur commodités:', err.message);
        return false;
    }
}

// ─── 10. ETHEREUM GAS & ON-CHAIN (Etherscan — gratuit, pas de clé pour gas) ──
async function fetchOnChainData() {
    console.log('\n⛓️  Récupération données on-chain...');
    try {
        const onchain = { updated: new Date().toISOString() };

        // Ethereum Gas Tracker (Etherscan — gratuit sans clé pour gas oracle)
        try {
            const gasData = await fetchJSON('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
            if (gasData.status === '1' && gasData.result) {
                onchain.eth_gas = {
                    low: parseInt(gasData.result.SafeGasPrice),
                    standard: parseInt(gasData.result.ProposeGasPrice),
                    fast: parseInt(gasData.result.FastGasPrice),
                    base_fee: parseFloat(gasData.result.suggestBaseFee) || null,
                    unit: 'gwei'
                };
                console.log(`  ✓ ETH Gas: ${onchain.eth_gas.standard} gwei (standard)`);
            }
        } catch (err) {
            console.warn('  ⚠ Etherscan gas:', err.message);
        }

        // Bitcoin mempool stats (mempool.space — gratuit, pas de clé)
        try {
            const mempoolFees = await fetchJSON('https://mempool.space/api/v1/fees/recommended');
            onchain.btc_fees = {
                fastest: mempoolFees.fastestFee,
                half_hour: mempoolFees.halfHourFee,
                hour: mempoolFees.hourFee,
                economy: mempoolFees.economyFee,
                minimum: mempoolFees.minimumFee,
                unit: 'sat/vB'
            };
            console.log(`  ✓ BTC Fees: ${onchain.btc_fees.half_hour} sat/vB (30min)`);
        } catch (err) {
            console.warn('  ⚠ Mempool fees:', err.message);
        }

        // Bitcoin hashrate & difficulty (mempool.space)
        try {
            const hashrate = await fetchJSON('https://mempool.space/api/v1/mining/hashrate/1w');
            if (hashrate.currentHashrate) {
                onchain.btc_mining = {
                    hashrate_eh: Math.round(hashrate.currentHashrate / 1e18 * 100) / 100,
                    difficulty: hashrate.currentDifficulty,
                    unit: 'EH/s'
                };
                console.log(`  ✓ BTC Hashrate: ${onchain.btc_mining.hashrate_eh} EH/s`);
            }
        } catch (err) {
            console.warn('  ⚠ Hashrate:', err.message);
        }

        writeJSON('onchain.json', onchain);
        return true;
    } catch (err) {
        console.error('✗ Erreur on-chain:', err.message);
        return false;
    }
}

// ─── 11. DONNÉES MACRO COMPLÉMENTAIRES (APIs publiques gratuites) ──
async function fetchGlobalMacro() {
    console.log('\n🌐 Récupération données macro mondiales (Banque Mondiale + ECB)...');
    try {
        const globalMacro = { updated: new Date().toISOString(), ecb: {}, volatility: {} };

        // Indice VIX via CBOE/Yahoo proxy — gratuit
        try {
            // Le VIX n'est pas directement disponible en API gratuite fiable,
            // on le récupère via Finnhub si la clé est dispo
            const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
            if (FINNHUB_KEY) {
                const vixQuote = await fetchJSON(
                    `https://finnhub.io/api/v1/quote?symbol=VIX&token=${FINNHUB_KEY}`
                );
                if (vixQuote.c && vixQuote.c > 0) {
                    globalMacro.volatility.vix = {
                        value: vixQuote.c,
                        change: vixQuote.dp,
                        label: vixQuote.c < 15 ? 'Faible' : vixQuote.c < 25 ? 'Modérée' : vixQuote.c < 35 ? 'Élevée' : 'Extrême'
                    };
                    console.log(`  ✓ VIX: ${vixQuote.c} (${globalMacro.volatility.vix.label})`);
                }
            }
        } catch (err) {
            console.warn('  ⚠ VIX:', err.message);
        }

        // Taux directeurs ECB via API publique ECB (SDMX — gratuit)
        try {
            const ecbUrl = 'https://data-api.ecb.europa.eu/service/data/FM/D.U2.EUR.4F.KR.MRR_FR.LEV?lastNObservations=5&format=jsondata';
            const ecbData = await fetchJSON(ecbUrl);
            const ecbObs = ecbData?.dataSets?.[0]?.series?.['0:0:0:0:0:0:0']?.observations;
            if (ecbObs) {
                const keys = Object.keys(ecbObs).sort();
                const latest = ecbObs[keys[keys.length - 1]];
                globalMacro.ecb.main_rate = {
                    value: latest[0],
                    label: 'Taux directeur principal BCE',
                    unit: '%'
                };
                console.log(`  ✓ BCE taux directeur: ${latest[0]}%`);
            }
        } catch (err) {
            console.warn('  ⚠ ECB rate:', err.message);
        }

        // EUR/USD historique 90j via ECB (gratuit)
        try {
            const ecbFxUrl = 'https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?lastNObservations=90&format=jsondata';
            const ecbFx = await fetchJSON(ecbFxUrl);
            const fxObs = ecbFx?.dataSets?.[0]?.series?.['0:0:0:0:0']?.observations;
            if (fxObs) {
                const keys = Object.keys(fxObs).sort();
                const latest = fxObs[keys[keys.length - 1]];
                const monthAgo = fxObs[keys[Math.max(0, keys.length - 22)]];
                globalMacro.ecb.eurusd = {
                    rate: latest[0],
                    change_1m: monthAgo ? Math.round((latest[0] - monthAgo[0]) * 10000) / 10000 : null,
                    label: 'EUR/USD (ECB fixing)'
                };
                console.log(`  ✓ EUR/USD (ECB): ${latest[0]}`);
            }
        } catch (err) {
            console.warn('  ⚠ ECB EUR/USD:', err.message);
        }

        writeJSON('global-macro.json', globalMacro);
        return true;
    } catch (err) {
        console.error('✗ Erreur macro mondiale:', err.message);
        return false;
    }
}

// ─── 12. CRYPTO AVANCÉ (Messari — clé gratuite, 20 req/min) ──
async function fetchMessari() {
    const API_KEY = process.env.MESSARI_API_KEY;
    if (!API_KEY) {
        console.log('\n⚠️  MESSARI_API_KEY non définie — données crypto avancées ignorées');
        console.log('   → Clé gratuite sur https://messari.io/api');
        return false;
    }

    console.log('\n🪙 Récupération crypto avancé (Messari)...');
    try {
        const headers = { 'x-messari-api-key': API_KEY };

        // Top assets par market cap avec métriques avancées
        const assetsData = await fetchJSON(
            'https://data.messari.io/api/v2/assets?fields=id,slug,symbol,name,metrics/market_data,metrics/marketcap,metrics/supply&limit=20',
            { headers }
        );

        const assets = (assetsData.data || []).map(a => ({
            id: a.id,
            symbol: a.symbol,
            name: a.name,
            price: a.metrics?.market_data?.price_usd,
            volume_24h: a.metrics?.market_data?.volume_last_24_hours,
            real_volume_24h: a.metrics?.market_data?.real_volume_last_24_hours,
            percent_change_24h: a.metrics?.market_data?.percent_change_usd_last_24_hours,
            market_cap: a.metrics?.marketcap?.current_marketcap_usd,
            market_cap_dominance: a.metrics?.marketcap?.marketcap_dominance_percent,
            supply_circulating: a.metrics?.supply?.circulating,
            supply_max: a.metrics?.supply?.max
        }));

        console.log(`  ✓ ${assets.length} assets crypto (Messari)`);
        await new Promise(r => setTimeout(r, 3500));

        // Données globales du marché
        let globalMetrics = null;
        try {
            const globalData = await fetchJSON(
                'https://data.messari.io/api/v1/global-metrics',
                { headers }
            );
            const gd = globalData.data;
            globalMetrics = {
                btc_dominance: gd?.btc_dominance,
                total_market_cap: gd?.market_cap,
                total_volume_24h: gd?.volume_24h,
                altcoin_market_cap: gd?.altcoin_market_cap,
                defi_market_cap: gd?.defi_market_cap
            };
            console.log(`  ✓ Métriques globales crypto (Messari)`);
        } catch (err) {
            console.warn('  ⚠ Messari global metrics:', err.message);
        }

        const messariData = {
            updated: new Date().toISOString(),
            source: 'Messari',
            assets,
            globalMetrics
        };

        writeJSON('messari.json', messariData);
        return true;
    } catch (err) {
        console.error('✗ Erreur Messari:', err.message);
        return false;
    }
}

// ─── 13. INDICES EUROPÉENS (Twelve Data — clé gratuite, 800 req/jour) ──
async function fetchTwelveData() {
    const API_KEY = process.env.TWELVE_DATA_API_KEY;
    if (!API_KEY) {
        console.log('\n⚠️  TWELVE_DATA_API_KEY non définie — indices européens ignorés');
        console.log('   → Clé gratuite sur https://twelvedata.com/');
        return false;
    }

    console.log('\n🇪🇺 Récupération indices européens (Twelve Data)...');
    try {
        const indices = [
            { symbol: 'CAC 40',  name: 'CAC 40 (Paris)',    country: 'FR' },
            { symbol: 'DAX',     name: 'DAX (Francfort)',   country: 'DE' },
            { symbol: 'FTSE 100',name: 'FTSE 100 (Londres)', country: 'GB' },
            { symbol: 'STOXX50', name: 'Euro Stoxx 50',     country: 'EU' },
            { symbol: 'IBEX 35', name: 'IBEX 35 (Madrid)',  country: 'ES' },
            { symbol: 'FTSEMIB', name: 'FTSE MIB (Milan)',  country: 'IT' }
        ];

        const quotes = [];
        for (const idx of indices) {
            try {
                const data = await fetchJSON(
                    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(idx.symbol)}&apikey=${API_KEY}`
                );
                if (data.close) {
                    quotes.push({
                        symbol: idx.symbol,
                        name: idx.name,
                        country: idx.country,
                        price: parseFloat(data.close),
                        open: parseFloat(data.open) || null,
                        high: parseFloat(data.high) || null,
                        low: parseFloat(data.low) || null,
                        prev_close: parseFloat(data.previous_close) || null,
                        change: data.change ? parseFloat(data.change) : null,
                        change_pct: data.percent_change ? parseFloat(data.percent_change) : null,
                        volume: parseInt(data.volume) || null,
                        exchange: data.exchange || null,
                        datetime: data.datetime || null
                    });
                    console.log(`  ✓ ${idx.name}: ${data.close}`);
                }
                // Rate limit: ~8 req/min for free tier
                await new Promise(r => setTimeout(r, 8000));
            } catch (err) {
                console.warn(`  ⚠ ${idx.name}: ${err.message}`);
            }
        }

        // Forex européen
        const forexPairs = [
            { symbol: 'EUR/GBP', name: 'EUR/GBP' },
            { symbol: 'EUR/CHF', name: 'EUR/CHF' }
        ];

        const forex = [];
        for (const pair of forexPairs) {
            try {
                const data = await fetchJSON(
                    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(pair.symbol)}&apikey=${API_KEY}`
                );
                if (data.close) {
                    forex.push({
                        symbol: pair.symbol,
                        name: pair.name,
                        rate: parseFloat(data.close),
                        change_pct: data.percent_change ? parseFloat(data.percent_change) : null,
                        datetime: data.datetime || null
                    });
                    console.log(`  ✓ ${pair.name}: ${data.close}`);
                }
                await new Promise(r => setTimeout(r, 8000));
            } catch (err) {
                console.warn(`  ⚠ ${pair.name}: ${err.message}`);
            }
        }

        const euroData = {
            updated: new Date().toISOString(),
            source: 'Twelve Data',
            indices: quotes,
            forex,
            summary: {
                total_indices: quotes.length,
                total_forex: forex.length,
                market_open: isEuropeanMarketOpen()
            }
        };

        writeJSON('european-markets.json', euroData);
        return true;
    } catch (err) {
        console.error('✗ Erreur Twelve Data:', err.message);
        return false;
    }
}

function isEuropeanMarketOpen() {
    const now = new Date();
    const parisHour = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const hour = parisHour.getHours();
    const day = parisHour.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}

// ─── 14. DONNÉES MACRO INTERNATIONALES (World Bank — gratuit, pas de clé) ──
async function fetchWorldBank() {
    console.log('\n🌍 Récupération données macro internationales (World Bank + IMF)...');
    try {
        const wbData = { updated: new Date().toISOString(), indicators: [], countries: {} };

        // PIB des principales économies (dernière année disponible)
        const gdpCountries = ['USA', 'CHN', 'JPN', 'DEU', 'GBR', 'FRA', 'IND', 'BRA', 'CAN', 'KOR'];
        try {
            const gdpUrl = `https://api.worldbank.org/v2/country/${gdpCountries.join(';')}/indicator/NY.GDP.MKTP.CD?format=json&per_page=50&date=2022:2024&mrv=1`;
            const [, gdpResults] = await fetchJSON(gdpUrl);
            if (gdpResults) {
                wbData.indicators.push({
                    id: 'NY.GDP.MKTP.CD',
                    label: 'PIB nominal (USD)',
                    data: gdpResults
                        .filter(r => r.value !== null)
                        .map(r => ({
                            country: r.country.value,
                            country_code: r.countryiso3code,
                            value: r.value,
                            year: r.date
                        }))
                        .sort((a, b) => b.value - a.value)
                });
                console.log(`  ✓ PIB: ${gdpResults.filter(r => r.value).length} pays`);
            }
            await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
            console.warn('  ⚠ World Bank GDP:', err.message);
        }

        // Inflation par pays (CPI)
        try {
            const cpiUrl = `https://api.worldbank.org/v2/country/${gdpCountries.join(';')}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=50&mrv=1`;
            const [, cpiResults] = await fetchJSON(cpiUrl);
            if (cpiResults) {
                wbData.indicators.push({
                    id: 'FP.CPI.TOTL.ZG',
                    label: 'Inflation (CPI, % annuel)',
                    data: cpiResults
                        .filter(r => r.value !== null)
                        .map(r => ({
                            country: r.country.value,
                            country_code: r.countryiso3code,
                            value: Math.round(r.value * 100) / 100,
                            year: r.date
                        }))
                });
                console.log(`  ✓ Inflation: ${cpiResults.filter(r => r.value).length} pays`);
            }
            await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
            console.warn('  ⚠ World Bank CPI:', err.message);
        }

        // Taux de chômage
        try {
            const unempUrl = `https://api.worldbank.org/v2/country/${gdpCountries.join(';')}/indicator/SL.UEM.TOTL.ZS?format=json&per_page=50&mrv=1`;
            const [, unempResults] = await fetchJSON(unempUrl);
            if (unempResults) {
                wbData.indicators.push({
                    id: 'SL.UEM.TOTL.ZS',
                    label: 'Chômage (% population active)',
                    data: unempResults
                        .filter(r => r.value !== null)
                        .map(r => ({
                            country: r.country.value,
                            country_code: r.countryiso3code,
                            value: Math.round(r.value * 100) / 100,
                            year: r.date
                        }))
                });
                console.log(`  ✓ Chômage: ${unempResults.filter(r => r.value).length} pays`);
            }
            await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
            console.warn('  ⚠ World Bank Unemployment:', err.message);
        }

        // Dette publique (% du PIB)
        try {
            const debtUrl = `https://api.worldbank.org/v2/country/${gdpCountries.join(';')}/indicator/GC.DOD.TOTL.GD.ZS?format=json&per_page=50&mrv=1`;
            const [, debtResults] = await fetchJSON(debtUrl);
            if (debtResults) {
                wbData.indicators.push({
                    id: 'GC.DOD.TOTL.GD.ZS',
                    label: 'Dette publique (% PIB)',
                    data: debtResults
                        .filter(r => r.value !== null)
                        .map(r => ({
                            country: r.country.value,
                            country_code: r.countryiso3code,
                            value: Math.round(r.value * 100) / 100,
                            year: r.date
                        }))
                });
                console.log(`  ✓ Dette publique: ${debtResults.filter(r => r.value).length} pays`);
            }
        } catch (err) {
            console.warn('  ⚠ World Bank Debt:', err.message);
        }

        writeJSON('world-bank.json', wbData);
        return true;
    } catch (err) {
        console.error('✗ Erreur World Bank:', err.message);
        return false;
    }
}

// ─── 15. ACTUALITÉS COMPLÉMENTAIRES (NewsAPI — clé gratuite, 100 req/jour) ──
async function fetchNewsAPI() {
    const API_KEY = process.env.NEWSAPI_API_KEY;
    if (!API_KEY) {
        console.log('\n⚠️  NEWSAPI_API_KEY non définie — NewsAPI ignoré');
        console.log('   → Clé gratuite sur https://newsapi.org/register');
        return false;
    }

    console.log('\n📰 Récupération actualités complémentaires (NewsAPI)...');
    try {
        const queries = [
            { key: 'geopolitics', q: 'geopolitics OR "trade war" OR sanctions OR NATO OR BRICS', sortBy: 'publishedAt' },
            { key: 'markets',     q: '"stock market" OR "Wall Street" OR "Federal Reserve" OR ECB OR "interest rates"', sortBy: 'publishedAt' },
            { key: 'crypto',      q: 'bitcoin OR ethereum OR cryptocurrency OR "crypto regulation"', sortBy: 'publishedAt' },
            { key: 'commodities', q: '"oil price" OR "gold price" OR commodities OR OPEC OR "natural gas"', sortBy: 'publishedAt' },
            { key: 'ai_tech',     q: '"artificial intelligence" OR OpenAI OR Nvidia OR semiconductor', sortBy: 'publishedAt' }
        ];

        const newsapiArticles = {};
        for (const q of queries) {
            try {
                const data = await fetchJSON(
                    'https://newsapi.org/v2/everything?' + new URLSearchParams({
                        q: q.q,
                        language: 'en',
                        sortBy: q.sortBy,
                        pageSize: '10',
                        apiKey: API_KEY
                    })
                );
                newsapiArticles[q.key] = (data.articles || [])
                    .filter(a => a.title && a.title !== '[Removed]')
                    .map(a => ({
                        title: a.title,
                        description: a.description || '',
                        source: a.source?.name || 'Unknown',
                        url: a.url,
                        image: a.urlToImage,
                        publishedAt: a.publishedAt,
                        time: formatDate(a.publishedAt),
                        lang: 'en',
                        via: 'newsapi'
                    }));
                console.log(`  ✓ NewsAPI ${q.key}: ${newsapiArticles[q.key].length} articles`);
                await new Promise(r => setTimeout(r, 1200));
            } catch (err) {
                console.warn(`  ⚠ NewsAPI ${q.key}: ${err.message}`);
                newsapiArticles[q.key] = [];
            }
        }

        const newsapiData = {
            updated: new Date().toISOString(),
            source: 'NewsAPI',
            categories: newsapiArticles,
            total: Object.values(newsapiArticles).reduce((s, arr) => s + arr.length, 0)
        };

        writeJSON('newsapi.json', newsapiData);
        return true;
    } catch (err) {
        console.error('✗ Erreur NewsAPI:', err.message);
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
        chart: await fetchGoldBitcoinChart(),
        commodities: await fetchCommodityPrices(),
        onchain: await fetchOnChainData(),
        globalMacro: await fetchGlobalMacro(),
        messari: await fetchMessari(),
        europeanMarkets: await fetchTwelveData(),
        worldBank: await fetchWorldBank(),
        newsapi: await fetchNewsAPI()
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
