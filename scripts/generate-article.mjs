#!/usr/bin/env node
/**
 * Inflexion — Vague 8 : Rédaction IA & Classification automatique
 *
 * Ce script :
 * 1. Lit les articles GNews du jour (data/news.json)
 * 2. Classifie chaque article dans une rubrique (approche hybride : mots-clés + Claude)
 * 3. Recherche du contexte approfondi via Tavily (web search temps réel)
 * 4. Génère un article de synthèse éditorial quotidien via Claude API (Haiku)
 * 5. Écrit le résultat dans data/articles/YYYY-MM-DD.json
 * 6. Met à jour data/news.json avec le champ "rubrique" enrichi
 *
 * Exécuté quotidiennement par GitHub Actions à 07h UTC
 *
 * @requires ANTHROPIC_API_KEY dans les variables d'environnement
 * @requires TAVILY_API_KEY dans les variables d'environnement (optionnel, enrichit les articles)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { callClaudeJSON, getUsageStats } from './lib/claude-api.mjs';
import { CLASSIFICATION_SYSTEM_PROMPT, ARTICLE_GENERATION_SYSTEM_PROMPT } from './lib/prompts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const ARTICLES_DIR = join(DATA_DIR, 'articles');

// Créer les dossiers si nécessaire
if (!existsSync(ARTICLES_DIR)) mkdirSync(ARTICLES_DIR, { recursive: true });

// ─── Configuration ──────────────────────────────────────────

const TAVILY_API_URL = 'https://api.tavily.com/search';
const MODEL = 'claude-haiku-4-5-20251001'; // Haiku : rapide et économique
const MAX_TOKENS_ARTICLE = 4096;

// ─── Rubriques et mots-clés (classification hybride) ────────

const RUBRIQUES = {
    geopolitique: {
        label: 'Géopolitique',
        emoji: '🌍',
        keywords: [
            'geopolitic', 'tariff', 'sanction', 'trade war', 'diplomacy',
            'nato', 'eu ', 'european union', 'china', 'russia', 'ukraine',
            'iran', 'military', 'war', 'conflict', 'treaty', 'embassy',
            'sovereignty', 'border', 'immigration', 'refugee', 'g7', 'g20',
            'united nations', 'foreign policy', 'coup', 'election',
            'groenland', 'greenland', 'droit de douane', 'customs',
            'geopolitical', 'geopolitics', 'regime', 'occupation'
        ]
    },
    marches: {
        label: 'Marchés',
        emoji: '📈',
        keywords: [
            'stock market', 's&p 500', 'wall street', 'federal reserve',
            'nasdaq', 'dow jones', 'earnings', 'revenue', 'profit',
            'ipo', 'merger', 'acquisition', 'employment', 'labor',
            'interest rate', 'yield', 'bond', 'treasury', 'gdp',
            'inflation', 'recession', 'vix', 'etf', 'hedge fund',
            'nvidia', 'apple', 'microsoft', 'google', 'tesla', 'amazon',
            'ai stocks', 'tech stocks', 'layoff', 'hiring', 'jobs',
            'semiconductor', 'quarterly', 'forecast', 'rally', 'selloff',
            'bull market', 'bear market', 'correction', 'valuation',
            'warsh', 'powell', 'central bank rate', 'fomc'
        ]
    },
    crypto: {
        label: 'Crypto',
        emoji: '₿',
        keywords: [
            'bitcoin', 'ethereum', 'crypto', 'blockchain', 'stablecoin',
            'defi', 'nft', 'token', 'altcoin', 'mining', 'wallet',
            'exchange', 'binance', 'coinbase', 'btc', 'eth', 'solana',
            'ripple', 'xrp', 'dogecoin', 'memecoin', 'web3',
            'smart contract', 'decentralized', 'tether', 'usdc', 'usdt',
            'crypto etf', 'spot etf', 'halving', 'whale', 'hodl'
        ]
    },
    matieres_premieres: {
        label: 'Matières Premières',
        emoji: '⛏️',
        keywords: [
            'gold', 'oil', 'silver', 'commodit', 'precious metal',
            'copper', 'wheat', 'corn', 'natural gas', 'crude',
            'brent', 'wti', 'opec', 'mining', 'ore', 'platinum',
            'palladium', 'lithium', 'cobalt', 'rare earth', 'uranium',
            'coal', 'iron', 'steel', 'aluminum', 'nickel',
            'or ', 'pétrole', 'argent', 'matières premières',
            'barrel', 'ounce', 'troy', 'xau', 'commodity'
        ]
    },
    ai_tech: {
        label: 'IA & Tech',
        emoji: '🤖',
        keywords: [
            'artificial intelligence', 'machine learning', 'deep learning',
            'large language model', 'llm', 'chatgpt', 'openai', 'anthropic',
            'claude', 'gemini', 'nvidia', 'semiconductor', 'chip', 'gpu',
            'data center', 'compute', 'inference', 'training', 'ai model',
            'generative ai', 'foundation model', 'transformer', 'diffusion',
            'ai regulation', 'ai safety', 'ai governance', 'robotics',
            'autonomous', 'tsmc', 'intel', 'amd', 'broadcom', 'asml',
            'huawei', 'ai agent', 'copilot', 'ai startup', 'ai funding',
            'quantum computing', 'neuromorphic', 'edge ai', 'mlops',
            'intelligence artificielle', 'puce', 'semi-conducteur'
        ]
    }
};

// Mapping des catégories GNews vers rubriques (fallback direct)
const CATEGORY_MAP = {
    'geopolitics': 'geopolitique',
    'markets': 'marches',
    'crypto': 'crypto',
    'commodities': 'matieres_premieres',
    'ai_tech': 'ai_tech'
};

// ─── Utilitaires ────────────────────────────────────────────

function writeJSON(filepath, data) {
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    const size = JSON.stringify(data).length;
    console.log(`✓ ${filepath.split('/').pop()} écrit (${size} octets)`);
}

function today() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

// ─── 1. CLASSIFICATION HYBRIDE ──────────────────────────────

/**
 * Classifie un article par mots-clés (étape 1 — gratuit et rapide)
 * @returns {string|null} rubrique ou null si ambigu
 */
function classifyByKeywords(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const scores = {};

    for (const [rubrique, config] of Object.entries(RUBRIQUES)) {
        scores[rubrique] = 0;
        for (const keyword of config.keywords) {
            if (text.includes(keyword.toLowerCase())) {
                scores[rubrique]++;
            }
        }
    }

    // Trouver la rubrique avec le score le plus élevé
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topScore = sorted[0][1];
    const secondScore = sorted[1]?.[1] || 0;

    // Si le score est 0, pas de match
    if (topScore === 0) return null;

    // Si l'écart est suffisant (>= 2 mots-clés d'avance), c'est clair
    if (topScore - secondScore >= 2) return sorted[0][0];

    // Si le top score est >= 3, on est assez confiant
    if (topScore >= 3) return sorted[0][0];

    // Sinon, ambigu → fallback Claude
    return null;
}

/**
 * Classifie un lot d'articles via un SEUL appel Claude (batch).
 * Remplace les appels individuels classifyText() par un callClaudeJSON groupé.
 * @param {Array<{index: number, title: string, description: string}>} batch
 * @returns {Promise<Object<number, string>>} map index → rubrique
 */
async function classifyBatchWithClaude(batch) {
    const categories = Object.keys(RUBRIQUES);
    const articlesText = batch
        .map(a => `[${a.index}] ${a.title} — ${a.description || ''}`)
        .join('\n');

    const result = await callClaudeJSON({
        systemPrompt: CLASSIFICATION_SYSTEM_PROMPT,
        userMessage: `Classe chaque article dans UNE des catégories suivantes : ${categories.join(', ')}

Réponds en JSON : {"classifications": [{"index": 0, "rubrique": "..."}, ...]}

Articles :
${articlesText}`,
        maxTokens: 512,
        temperature: 0,
        label: 'classification-batch',
        validate: (data) => {
            if (!Array.isArray(data.classifications)) return 'classifications manquant';
            return true;
        },
    });

    const map = {};
    for (const item of result.classifications) {
        if (categories.includes(item.rubrique)) {
            map[item.index] = item.rubrique;
        }
    }
    return map;
}

/** Taille des lots pour la classification Claude */
const CLASSIFY_BATCH_SIZE = 15;

/**
 * Classifie tous les articles avec l'approche hybride.
 * Étape 1 : mots-clés (gratuit). Étape 2 : Claude en batch (1 appel pour N articles).
 */
async function classifyAllArticles(newsData) {
    console.log('\n🏷️  Classification des articles (hybride)...');

    let keywordCount = 0;
    let claudeCount = 0;
    let fallbackCount = 0;
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    // Phase 1 : mots-clés pour tous les articles, collecter les ambigus
    const ambiguous = []; // {category, articleIndex, article}
    for (const [category, articles] of Object.entries(newsData.categories)) {
        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            const rubrique = classifyByKeywords(article.title, article.description || '');
            if (rubrique) {
                article.rubrique = rubrique;
                article.rubrique_label = RUBRIQUES[rubrique].label;
                article.rubrique_emoji = RUBRIQUES[rubrique].emoji;
                keywordCount++;
            } else {
                ambiguous.push({ category, articleIndex: i, article });
            }
        }
    }

    // Phase 2 : classifier les ambigus par batch Claude (1 appel pour ~15 articles)
    if (hasApiKey && ambiguous.length > 0) {
        console.log(`  🤖 ${ambiguous.length} articles ambigus → classification Claude par batch...`);
        for (let start = 0; start < ambiguous.length; start += CLASSIFY_BATCH_SIZE) {
            const batchItems = ambiguous.slice(start, start + CLASSIFY_BATCH_SIZE);
            const batch = batchItems.map((item, idx) => ({
                index: idx,
                title: item.article.title,
                description: item.article.description || '',
            }));

            try {
                const results = await classifyBatchWithClaude(batch);
                for (let j = 0; j < batchItems.length; j++) {
                    const rubrique = results[j];
                    if (rubrique) {
                        batchItems[j].article.rubrique = rubrique;
                        batchItems[j].article.rubrique_label = RUBRIQUES[rubrique].label;
                        batchItems[j].article.rubrique_emoji = RUBRIQUES[rubrique].emoji;
                        claudeCount++;
                    }
                }
            } catch (err) {
                console.warn(`  ⚠ Batch classification échouée: ${err.message}`);
            }
        }
    }

    // Phase 3 : fallback pour les articles non classifiés
    for (const item of ambiguous) {
        if (!item.article.rubrique) {
            const rubrique = CATEGORY_MAP[item.category] || 'marches';
            item.article.rubrique = rubrique;
            item.article.rubrique_label = RUBRIQUES[rubrique].label;
            item.article.rubrique_emoji = RUBRIQUES[rubrique].emoji;
            fallbackCount++;
        }
    }

    console.log(`  ✓ ${keywordCount} par mots-clés, ${claudeCount} par Claude (batch), ${fallbackCount} par fallback`);
    return newsData;
}

// ─── 2. RECHERCHE WEB TAVILY (enrichissement) ──────────────

/**
 * Recherche web via Tavily pour enrichir le contexte de l'article
 * @param {string[]} topics - sujets à rechercher
 * @returns {object[]} résultats Tavily formatés
 */
async function searchTavily(topics) {
    const TAVILY_KEY = process.env.TAVILY_API_KEY;
    if (!TAVILY_KEY) {
        console.log('  ⚠ TAVILY_API_KEY non définie — enrichissement web ignoré');
        return [];
    }

    console.log('\n🔍 Recherche Tavily (contexte web temps réel)...');
    const allResults = [];

    for (const topic of topics) {
        try {
            const response = await fetch(TAVILY_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TAVILY_KEY}`
                },
                body: JSON.stringify({
                    query: topic,
                    search_depth: 'basic',
                    topic: 'finance',
                    time_range: 'day',
                    max_results: 3,
                    include_answer: false,
                    include_raw_content: false
                }),
                signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) {
                const err = await response.text();
                console.warn(`  ⚠ Tavily ${response.status} pour "${topic}": ${err}`);
                continue;
            }

            const data = await response.json();
            const results = (data.results || []).map(r => ({
                title: r.title,
                url: r.url,
                content: r.content?.slice(0, 300) || '', // Limiter la taille
                score: r.score,
                query: topic
            }));

            allResults.push(...results);
            console.log(`  ✓ "${topic}" → ${results.length} résultats`);

            // Rate limit (plan gratuit)
            await new Promise(r => setTimeout(r, 300));

        } catch (err) {
            console.warn(`  ⚠ Tavily échoué pour "${topic}": ${err.message}`);
        }
    }

    console.log(`  📊 Total : ${allResults.length} sources web collectées`);
    return allResults;
}

/**
 * Extrait les sujets-clés des news pour alimenter Tavily
 */
function extractTopics(newsData) {
    const topics = [];

    for (const [category, articles] of Object.entries(newsData.categories)) {
        if (articles.length === 0) continue;

        // Prendre les 2 premiers titres par catégorie comme requêtes
        for (const a of articles.slice(0, 2)) {
            // Nettoyer le titre pour en faire une bonne requête
            const clean = a.title
                .replace(/[""'']/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            if (clean.length > 10) {
                topics.push(clean);
            }
        }
    }

    // Limiter à 6 requêtes max (6 crédits Tavily = 0.6% du quota gratuit mensuel)
    return topics.slice(0, 6);
}

/**
 * Formate les résultats Tavily en contexte pour le prompt
 */
function formatTavilyContext(results) {
    if (results.length === 0) return '';

    const lines = ['\n## 🔍 Sources web complémentaires (Tavily)\n'];
    const seen = new Set(); // Dédupliquer par URL

    for (const r of results) {
        if (seen.has(r.url)) continue;
        seen.add(r.url);
        lines.push(`- **${r.title}** [${new URL(r.url).hostname}]`);
        if (r.content) {
            lines.push(`  > ${r.content.slice(0, 200)}...`);
        }
    }

    return lines.join('\n');
}

// ─── 3. GÉNÉRATION D'ARTICLE ────────────────────────────────

/**
 * Génère un article de synthèse éditorial à partir des news du jour
 */
async function generateDailyArticle(newsData, tavilyResults = [], macroData = null, fngData = null, cryptoData = null, marketsData = null, defiData = null, avData = null) {
    console.log('\n✍️  Génération de l\'article du jour...');

    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) {
        console.log('  ⚠ ANTHROPIC_API_KEY non définie — article ignoré');
        console.log('  → Ajouter le secret dans GitHub: Settings > Secrets > ANTHROPIC_API_KEY');
        console.log('  → Clé sur https://console.anthropic.com');
        return null;
    }

    // Préparer le contexte : résumé des articles du jour par rubrique
    const context = [];
    for (const [category, articles] of Object.entries(newsData.categories)) {
        if (articles.length === 0) continue;
        const rubriqueLabel = RUBRIQUES[CATEGORY_MAP[category]]?.label || category;
        context.push(`## ${rubriqueLabel}`);
        for (const a of articles.slice(0, 5)) { // Max 5 par catégorie
            context.push(`- **${a.title}** (${a.source}) : ${a.description || ''}`);
        }
        context.push('');
    }

    // Ajouter les données macroéconomiques FRED si disponibles
    if (macroData?.indicators?.length > 0) {
        context.push('## 🏛️ Données macroéconomiques (FRED)');
        for (const ind of macroData.indicators) {
            const changeStr = ind.change !== null
                ? ` (${ind.change >= 0 ? '+' : ''}${ind.change.toFixed(2)}${ind.change_type === 'yoy' ? '% a/a' : ''})`
                : '';
            context.push(`- **${ind.label}** : ${ind.value}${ind.unit === '%' ? '%' : ''} ${changeStr} [${ind.date}]`);
        }
        context.push('');
        console.log(`  📊 ${macroData.indicators.length} indicateurs macro injectés dans le contexte`);
    }

    // Ajouter le Fear & Greed Index si disponible
    if (fngData?.current) {
        context.push('## 😱 Sentiment Crypto (Fear & Greed Index)');
        context.push(`- **Score actuel** : ${fngData.current.value}/100 (${fngData.current.label})`);
        if (fngData.changes.week !== null) {
            context.push(`- **Variation 7j** : ${fngData.changes.week >= 0 ? '+' : ''}${fngData.changes.week} points`);
        }
        if (fngData.changes.month !== null) {
            context.push(`- **Variation 30j** : ${fngData.changes.month >= 0 ? '+' : ''}${fngData.changes.month} points`);
        }
        context.push('');
        console.log(`  😱 Fear & Greed injecté dans le contexte (${fngData.current.value}/100)`);
    }

    // Ajouter les trending coins si disponibles
    if (cryptoData?.trending?.length > 0) {
        context.push('## 🔥 Crypto Trending (CoinGecko)');
        for (const coin of cryptoData.trending.slice(0, 5)) {
            context.push(`- **${coin.name}** (${coin.symbol}) — Rang MCap: #${coin.market_cap_rank || 'N/A'}`);
        }
        if (cryptoData.global) {
            if (cryptoData.global.eth_dominance) context.push(`- Dominance ETH: ${cryptoData.global.eth_dominance.toFixed(1)}%`);
            if (cryptoData.global.market_cap_change_24h != null) context.push(`- MCap 24h: ${cryptoData.global.market_cap_change_24h >= 0 ? '+' : ''}${cryptoData.global.market_cap_change_24h.toFixed(2)}%`);
        }
        context.push('');
        console.log(`  🔥 ${cryptoData.trending.length} trending coins injectés dans le contexte`);
    }

    // Ajouter le calendrier économique si disponible
    if (marketsData?.economicCalendar?.length > 0) {
        context.push('## 📅 Calendrier économique (Finnhub)');
        for (const evt of marketsData.economicCalendar.slice(0, 6)) {
            const valStr = evt.actual != null ? `Réel: ${evt.actual}${evt.unit || ''}` :
                          evt.estimate != null ? `Est: ${evt.estimate}${evt.unit || ''}` : '';
            context.push(`- **${evt.event}** (${evt.country}, ${evt.date}) — Impact ${evt.impact} ${valStr ? '— ' + valStr : ''}`);
        }
        context.push('');
        console.log(`  📅 ${marketsData.economicCalendar.length} événements éco injectés dans le contexte`);
    }

    // Ajouter les données DeFi si disponibles
    if (defiData?.topProtocols?.length > 0) {
        context.push('## 🦙 DeFi (DefiLlama)');
        context.push(`- TVL Total: ${defiData.summary?.total_tvl_formatted || 'N/A'} (${defiData.summary?.total_protocols || 0} protocoles)`);
        for (const p of defiData.topProtocols.slice(0, 5)) {
            const tvlStr = p.tvl > 1e9 ? `$${(p.tvl/1e9).toFixed(1)}B` : `$${(p.tvl/1e6).toFixed(0)}M`;
            const changeStr = p.change_1d != null ? ` (24h: ${p.change_1d > 0 ? '+' : ''}${p.change_1d.toFixed(1)}%)` : '';
            context.push(`- **${p.name}** — TVL ${tvlStr}${changeStr} [${p.category || ''}]`);
        }
        context.push('');
        console.log(`  🦙 Top 5 DeFi protocoles injectés dans le contexte`);
    }

    // Ajouter les données Forex si disponibles
    if (avData?.forex?.length > 0) {
        context.push('## 💱 Forex (Alpha Vantage)');
        for (const fx of avData.forex) {
            context.push(`- **${fx.pair}**: ${fx.rate.toFixed(4)}`);
        }
        if (avData.sectors?.length > 0) {
            context.push('### Secteurs US (temps réel)');
            for (const s of avData.sectors.slice(0, 5)) {
                context.push(`- ${s.name}: ${s.realtime >= 0 ? '+' : ''}${s.realtime.toFixed(2)}%`);
            }
        }
        context.push('');
        console.log(`  💱 Forex + secteurs injectés dans le contexte`);
    }

    // Ajouter le contexte Tavily si disponible
    const tavilyContext = formatTavilyContext(tavilyResults);

    // Extraire les sources Tavily pour les citer
    const sourcesList = tavilyResults
        .filter((r, i, arr) => arr.findIndex(x => x.url === r.url) === i)
        .slice(0, 5)
        .map(r => ({ titre: r.title, url: r.url, domaine: new URL(r.url).hostname }));

    const userMessage = `Voici les actualités du jour (${today()}) collectées par nos sources. Rédige l'article de synthèse quotidien d'Inflexion.

${context.join('\n')}
${tavilyContext}

${sourcesList.length > 0 ? `\nSources disponibles pour citation :\n${sourcesList.map(s => `- ${s.titre} (${s.domaine}) : ${s.url}`).join('\n')}` : ''}

Réponds UNIQUEMENT en JSON valide, sans commentaire avant ou après.`;

    try {
        const article = await callClaudeJSON({
            systemPrompt: ARTICLE_GENERATION_SYSTEM_PROMPT,
            userMessage,
            maxTokens: MAX_TOKENS_ARTICLE,
            label: 'article-du-jour',
            validate: (data) => {
                if (!data.titre || !data.contenu) return 'Structure article invalide (manque titre ou contenu)';
                return true;
            },
        });

        // Ajouter les sources Tavily même si Claude ne les a pas retournées
        if (!article.sources && sourcesList.length > 0) {
            article.sources = sourcesList;
        }

        console.log(`  ✓ Article généré : "${article.titre}"`);
        if (article.sources?.length) {
            console.log(`  📎 ${article.sources.length} sources citées`);
        }
        return article;

    } catch (err) {
        console.error(`  ✗ Erreur génération article: ${err.message}`);
        return null;
    }
}

// ─── 3. SAUVEGARDE ──────────────────────────────────────────

function saveArticle(article) {
    if (!article) return false;

    const date = today();
    const articleData = {
        date,
        generated_at: new Date().toISOString(),
        model: MODEL,
        ...article
    };

    const filepath = join(ARTICLES_DIR, `${date}.json`);
    writeJSON(filepath, articleData);

    // Aussi sauvegarder le "dernier article" pour le frontend
    const latestPath = join(DATA_DIR, 'article-du-jour.json');
    writeJSON(latestPath, articleData);

    return true;
}

function saveEnrichedNews(newsData) {
    const filepath = join(DATA_DIR, 'news.json');
    writeJSON(filepath, newsData);
}

// ─── Exécution principale ───────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  Inflexion — Vague 8 : IA & Classification');
    console.log(`  ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════');

    // Lire les news existantes
    const newsPath = join(DATA_DIR, 'news.json');
    if (!existsSync(newsPath)) {
        console.error('✗ data/news.json introuvable — exécuter fetch-data.mjs d\'abord');
        process.exit(1);
    }

    let newsData;
    try {
        newsData = JSON.parse(readFileSync(newsPath, 'utf-8'));
    } catch (err) {
        console.error(`✗ Erreur lecture news.json: ${err.message}`);
        process.exit(1);
    }

    // Lire les données macro (FRED) si disponibles
    let macroData = null;
    const macroPath = join(DATA_DIR, 'macro.json');
    if (existsSync(macroPath)) {
        try {
            macroData = JSON.parse(readFileSync(macroPath, 'utf-8'));
            console.log(`📊 ${macroData.indicators?.length || 0} indicateurs macro disponibles`);
        } catch (err) {
            console.warn(`⚠ Erreur lecture macro.json: ${err.message}`);
        }
    }

    // Lire le Fear & Greed Index si disponible
    let fngData = null;
    const fngPath = join(DATA_DIR, 'fear-greed.json');
    if (existsSync(fngPath)) {
        try {
            fngData = JSON.parse(readFileSync(fngPath, 'utf-8'));
            console.log(`😱 Fear & Greed: ${fngData.current?.value} (${fngData.current?.label})`);
        } catch (err) {
            console.warn(`⚠ Erreur lecture fear-greed.json: ${err.message}`);
        }
    }

    // Lire les données crypto (trending coins) si disponibles
    let cryptoData = null;
    const cryptoPath = join(DATA_DIR, 'crypto.json');
    if (existsSync(cryptoPath)) {
        try {
            cryptoData = JSON.parse(readFileSync(cryptoPath, 'utf-8'));
            console.log(`🔥 ${cryptoData.trending?.length || 0} trending coins disponibles`);
        } catch (err) {
            console.warn(`⚠ Erreur lecture crypto.json: ${err.message}`);
        }
    }

    // Lire les données marchés (calendrier économique) si disponibles
    let marketsData = null;
    const marketsPath = join(DATA_DIR, 'markets.json');
    if (existsSync(marketsPath)) {
        try {
            marketsData = JSON.parse(readFileSync(marketsPath, 'utf-8'));
            console.log(`📅 ${marketsData.economicCalendar?.length || 0} événements éco disponibles`);
        } catch (err) {
            console.warn(`⚠ Erreur lecture markets.json: ${err.message}`);
        }
    }

    // Lire les données DeFi (DefiLlama) si disponibles
    let defiData = null;
    const defiPath = join(DATA_DIR, 'defi.json');
    if (existsSync(defiPath)) {
        try {
            defiData = JSON.parse(readFileSync(defiPath, 'utf-8'));
            console.log(`🦙 DeFi: TVL ${defiData.summary?.total_tvl_formatted}, ${defiData.topProtocols?.length || 0} protocoles`);
        } catch (err) {
            console.warn(`⚠ Erreur lecture defi.json: ${err.message}`);
        }
    }

    // Lire les données Alpha Vantage si disponibles
    let avData = null;
    const avPath = join(DATA_DIR, 'alpha-vantage.json');
    if (existsSync(avPath)) {
        try {
            avData = JSON.parse(readFileSync(avPath, 'utf-8'));
            console.log(`💱 Forex: ${avData.forex?.length || 0} paires, Secteurs: ${avData.sectors?.length || 0}`);
        } catch (err) {
            console.warn(`⚠ Erreur lecture alpha-vantage.json: ${err.message}`);
        }
    }

    const totalArticles = Object.values(newsData.categories)
        .reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n📰 ${totalArticles} articles trouvés dans news.json`);

    // 1. Classifier les articles
    newsData = await classifyAllArticles(newsData);
    saveEnrichedNews(newsData);

    // 2. Enrichir via Tavily (recherche web temps réel)
    const topics = extractTopics(newsData);
    const tavilyResults = await searchTavily(topics);

    // 3. Générer l'article du jour (avec contexte Tavily + macro + FNG + trending + calendrier + DeFi + forex)
    const article = await generateDailyArticle(newsData, tavilyResults, macroData, fngData, cryptoData, marketsData, defiData, avData);
    const articleSaved = saveArticle(article);

    // Résumé
    const stats = getUsageStats();
    console.log('\n═══════════════════════════════════════');
    console.log('  Résumé :');
    console.log(`  ${newsData ? '✅' : '⚠️ '} Classification des articles`);
    console.log(`  ${tavilyResults.length > 0 ? '✅' : '⚠️ '} Enrichissement Tavily (${tavilyResults.length} sources)`);
    console.log(`  ${articleSaved ? '✅' : '⚠️ '} Article du jour`);
    console.log(`  💰 Claude API : ${stats.totalCalls} appels, ${stats.totalInputTokens}in/${stats.totalOutputTokens}out tokens, ~$${stats.estimatedCostUSD}`);
    console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
