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

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const ARTICLES_DIR = join(DATA_DIR, 'articles');

// Créer les dossiers si nécessaire
if (!existsSync(ARTICLES_DIR)) mkdirSync(ARTICLES_DIR, { recursive: true });

// ─── Configuration ──────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const TAVILY_API_URL = 'https://api.tavily.com/search';
const MODEL = 'claude-haiku-4-5-20251001'; // Haiku : rapide et économique
const MAX_TOKENS_ARTICLE = 2048;
const MAX_TOKENS_CLASSIFY = 256;

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
    }
};

// Mapping des catégories GNews vers rubriques (fallback direct)
const CATEGORY_MAP = {
    'geopolitics': 'geopolitique',
    'markets': 'marches',
    'crypto': 'crypto',
    'commodities': 'matieres_premieres'
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

/**
 * Appelle l'API Claude (Messages API)
 */
async function callClaude(systemPrompt, userMessage, maxTokens = MAX_TOKENS_ARTICLE) {
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) throw new Error('ANTHROPIC_API_KEY non définie');

    const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }]
        }),
        signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Claude API ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.content[0].text;
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
 * Classifie un article via Claude API (étape 2 — pour les cas ambigus)
 */
async function classifyWithClaude(title, description) {
    const systemPrompt = `Tu es un classifieur d'articles de presse financière.
Réponds UNIQUEMENT par l'un de ces 4 mots (sans explication) :
- geopolitique
- marches
- crypto
- matieres_premieres`;

    const userMessage = `Classe cet article dans la rubrique la plus pertinente.

Titre : ${title}
Description : ${description}

Rubrique :`;

    try {
        const result = await callClaude(systemPrompt, userMessage, MAX_TOKENS_CLASSIFY);
        const rubrique = result.trim().toLowerCase().replace(/[^a-z_]/g, '');

        // Vérifier que la réponse est valide
        if (RUBRIQUES[rubrique]) return rubrique;

        // Sinon fallback
        console.warn(`  ⚠ Classification Claude invalide: "${result}" → fallback`);
        return null;
    } catch (err) {
        console.warn(`  ⚠ Classification Claude échouée: ${err.message}`);
        return null;
    }
}

/**
 * Classifie tous les articles avec l'approche hybride
 */
async function classifyAllArticles(newsData) {
    console.log('\n🏷️  Classification des articles (hybride)...');

    let keywordCount = 0;
    let claudeCount = 0;
    let fallbackCount = 0;
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    for (const [category, articles] of Object.entries(newsData.categories)) {
        for (const article of articles) {
            // Étape 1 : mots-clés
            let rubrique = classifyByKeywords(article.title, article.description || '');

            if (rubrique) {
                keywordCount++;
            } else if (hasApiKey) {
                // Étape 2 : Claude pour les cas ambigus
                rubrique = await classifyWithClaude(article.title, article.description || '');
                if (rubrique) {
                    claudeCount++;
                }
                // Rate limit
                await new Promise(r => setTimeout(r, 200));
            }

            // Fallback : utiliser la catégorie GNews d'origine
            if (!rubrique) {
                rubrique = CATEGORY_MAP[category] || 'marches';
                fallbackCount++;
            }

            // Enrichir l'article
            article.rubrique = rubrique;
            article.rubrique_label = RUBRIQUES[rubrique].label;
            article.rubrique_emoji = RUBRIQUES[rubrique].emoji;
        }
    }

    console.log(`  ✓ ${keywordCount} par mots-clés, ${claudeCount} par Claude, ${fallbackCount} par fallback`);
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
async function generateDailyArticle(newsData, tavilyResults = [], macroData = null, fngData = null) {
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

    // Ajouter le contexte Tavily si disponible
    const tavilyContext = formatTavilyContext(tavilyResults);

    // Extraire les sources Tavily pour les citer
    const sourcesList = tavilyResults
        .filter((r, i, arr) => arr.findIndex(x => x.url === r.url) === i)
        .slice(0, 5)
        .map(r => ({ titre: r.title, url: r.url, domaine: new URL(r.url).hostname }));

    const systemPrompt = `Tu es le rédacteur en chef d'Inflexion, une plateforme française d'intelligence financière qui analyse les signaux géopolitiques, technologiques et financiers.

Ton style éditorial :
- Ton analytique et direct, style éditorial financier haut de gamme (Bloomberg, Financial Times)
- Tu relies toujours les événements entre eux (géopolitique ↔ marchés ↔ tech)
- Tu donnes des chiffres précis et des analyses concrètes
- Tu écris en FRANÇAIS
- Tu ne fais AUCUNE recommandation d'investissement
- Tu structures ton article avec un titre accrocheur, une introduction percutante, 2-3 sections thématiques, et une conclusion prospective
- Longueur cible : 400-600 mots
- Si des sources web complémentaires sont fournies, utilise-les pour approfondir ton analyse et citer des données précises

Format de réponse (JSON strict) :
{
  "titre": "Titre accrocheur de l'article",
  "sous_titre": "Sous-titre contextuel",
  "contenu": "Le corps de l'article en Markdown (## pour les sections)",
  "tags": ["tag1", "tag2", "tag3"],
  "points_cles": ["Point clé 1", "Point clé 2", "Point clé 3"],
  "sources": [{"titre": "...", "url": "...", "domaine": "..."}]
}`;

    const userMessage = `Voici les actualités du jour (${today()}) collectées par nos sources. Rédige l'article de synthèse quotidien d'Inflexion.

${context.join('\n')}
${tavilyContext}

${sourcesList.length > 0 ? `\nSources disponibles pour citation :\n${sourcesList.map(s => `- ${s.titre} (${s.domaine}) : ${s.url}`).join('\n')}` : ''}

Réponds UNIQUEMENT en JSON valide, sans commentaire avant ou après.`;

    try {
        const result = await callClaude(systemPrompt, userMessage, MAX_TOKENS_ARTICLE);

        // Parser le JSON (Claude peut parfois entourer de ```json```)
        let jsonStr = result.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        }

        const article = JSON.parse(jsonStr);

        // Valider la structure
        if (!article.titre || !article.contenu) {
            throw new Error('Structure article invalide (manque titre ou contenu)');
        }

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

    const totalArticles = Object.values(newsData.categories)
        .reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n📰 ${totalArticles} articles trouvés dans news.json`);

    // 1. Classifier les articles
    newsData = await classifyAllArticles(newsData);
    saveEnrichedNews(newsData);

    // 2. Enrichir via Tavily (recherche web temps réel)
    const topics = extractTopics(newsData);
    const tavilyResults = await searchTavily(topics);

    // 3. Générer l'article du jour (avec contexte Tavily + macro FRED + Fear & Greed)
    const article = await generateDailyArticle(newsData, tavilyResults, macroData, fngData);
    const articleSaved = saveArticle(article);

    // Résumé
    console.log('\n═══════════════════════════════════════');
    console.log('  Résumé :');
    console.log(`  ${newsData ? '✅' : '⚠️ '} Classification des articles`);
    console.log(`  ${tavilyResults.length > 0 ? '✅' : '⚠️ '} Enrichissement Tavily (${tavilyResults.length} sources)`);
    console.log(`  ${articleSaved ? '✅' : '⚠️ '} Article du jour`);
    console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
