#!/usr/bin/env node
/**
 * Inflexion — Briefing IA Quotidien Stratégique
 *
 * Ce script est le cœur de la feature "Briefing IA" d'Inflexion.
 * Il produit chaque jour une analyse stratégique qui CROISE les signaux
 * géopolitiques avec les données de marché — c'est le différenciant d'Inflexion.
 *
 * Flux :
 *   1. Charge les 12 fichiers JSON produits par fetch-data.mjs (news, marchés, crypto, macro, etc.)
 *   2. Sélectionne les 20-30 articles les plus importants des dernières 24h
 *   3. Construit un contexte riche en markdown avec toutes les données de marché
 *   4. Envoie le tout à Claude Sonnet pour générer un briefing structuré
 *   5. Sauvegarde dans data/daily-briefing.json (chargé par le frontend)
 *
 * Exécuté quotidiennement par GitHub Actions (08h UTC) ou manuellement :
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-daily-briefing.mjs
 *
 * Options :
 *   --dry-run    Valide les données sans appeler Claude (utile pour tester)
 *
 * @requires ANTHROPIC_API_KEY dans les variables d'environnement
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { callClaudeJSON, getUsageStats } from './lib/claude-api.mjs';
import { DAILY_BRIEFING_SYSTEM_PROMPT } from './lib/prompts.mjs';

// RAG imports chargés dynamiquement dans main() pour ne pas bloquer les tests unitaires
// (les tests n'importent que les fonctions pures et n'ont pas besoin de @xenova/transformers)
let RAGStore, embedText;

// __dirname n'existe pas en ESM, on le reconstruit
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// Mode dry-run : valide les données sans appeler Claude (pas de coût API)
const DRY_RUN = process.argv.includes('--dry-run');

// Modèle utilisé : Sonnet pour la qualité d'analyse stratégique (1 appel/jour)
const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 8500;

// ─── Utilitaires ─────────────────────────────────────────────

/**
 * Charge un fichier JSON depuis le dossier data/.
 * Retourne null si le fichier n'existe pas ou est invalide — le briefing
 * se génère quand même avec les sources disponibles (résilience).
 *
 * @param {string} filename - Nom du fichier (ex: 'news.json')
 * @returns {Object|null} Données parsées ou null
 */
function loadJSON(filename) {
    const filepath = join(DATA_DIR, filename);
    if (!existsSync(filepath)) return null;
    try {
        return JSON.parse(readFileSync(filepath, 'utf-8'));
    } catch (e) {
        console.warn(`  ⚠ Erreur lecture ${filename}: ${e.message}`);
        return null;
    }
}

/**
 * Écrit un fichier JSON avec indentation lisible.
 * @param {string} filepath - Chemin complet du fichier
 * @param {Object} data - Données à écrire
 */
function writeJSON(filepath, data) {
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    const size = JSON.stringify(data).length;
    console.log(`  ✓ ${filepath.split('/').pop()} écrit (${(size / 1024).toFixed(1)} Ko)`);
}

/** Date du jour au format YYYY-MM-DD */
function today() {
    return new Date().toISOString().split('T')[0];
}

// ─── Sélection des articles importants ───────────────────────

/**
 * Sélectionne les 20-30 articles les plus pertinents des dernières 24h.
 *
 * Stratégie de sélection :
 * - Prend les articles les plus récents (triés par date)
 * - Garantit une diversité de rubriques (max 8 par catégorie)
 * - Préfère les articles avec description (plus de contexte pour Claude)
 *
 * @param {Object} newsData - Contenu de news.json
 * @returns {Object[]} Articles sélectionnés avec rubrique
 */
function selectTopArticles(newsData) {
    if (!newsData?.categories) return [];

    const allArticles = [];

    // Collecter tous les articles de toutes les catégories
    for (const [category, articles] of Object.entries(newsData.categories)) {
        for (const article of articles) {
            allArticles.push({
                ...article,
                _category: category // garder la catégorie d'origine
            });
        }
    }

    // Trier par date (plus récents en premier)
    allArticles.sort((a, b) => {
        const dateA = new Date(a.publishedAt || 0);
        const dateB = new Date(b.publishedAt || 0);
        return dateB - dateA;
    });

    // Filtrer : garder seulement les articles des dernières 48h
    // (48h au lieu de 24h pour avoir assez de contenu même le week-end)
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const recent = allArticles.filter(a => {
        const date = new Date(a.publishedAt || 0);
        return date.getTime() > cutoff;
    });

    // Si pas assez d'articles récents, prendre les plus récents disponibles
    const pool = recent.length >= 10 ? recent : allArticles;

    // Garantir la diversité : max 8 articles par catégorie
    const selected = [];
    const countByCategory = {};
    const MAX_PER_CATEGORY = 8;
    const TARGET_TOTAL = 25;

    for (const article of pool) {
        if (selected.length >= TARGET_TOTAL) break;

        const cat = article._category;
        countByCategory[cat] = (countByCategory[cat] || 0) + 1;

        if (countByCategory[cat] <= MAX_PER_CATEGORY) {
            selected.push(article);
        }
    }

    return selected;
}

// ─── Formatage du contexte pour Claude ───────────────────────

/**
 * Formate les articles sélectionnés en texte markdown pour le prompt.
 * Regroupe par rubrique pour que Claude comprenne la structure thématique.
 *
 * @param {Object[]} articles - Articles sélectionnés
 * @returns {string} Contexte markdown
 */
function formatNewsContext(articles) {
    if (articles.length === 0) return '(Aucun article disponible)';

    // Mapper les catégories vers des labels français lisibles
    const categoryLabels = {
        geopolitics: '🌍 Géopolitique',
        geopolitique: '🌍 Géopolitique',
        markets: '📈 Marchés & Finance',
        marches: '📈 Marchés & Finance',
        crypto: '₿ Crypto & Blockchain',
        commodities: '⛏️ Matières Premières & Énergie',
        matieres_premieres: '⛏️ Matières Premières & Énergie',
        ai_tech: '🤖 IA, Tech & Cybersécurité'
    };

    // Regrouper les articles par catégorie
    const grouped = {};
    for (const article of articles) {
        const cat = article.rubrique || article._category || 'other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(article);
    }

    // Construire le markdown
    const sections = [];
    for (const [cat, arts] of Object.entries(grouped)) {
        const label = categoryLabels[cat] || cat;
        const lines = [`## ${label}`];
        for (const a of arts) {
            const source = a.source || 'Source inconnue';
            const desc = a.description
                ? ` : ${a.description.slice(0, 200)}`
                : '';
            lines.push(`- **${a.title}** (${source})${desc}`);
        }
        sections.push(lines.join('\n'));
    }

    return sections.join('\n\n');
}

/**
 * Formate les données de marchés boursiers (Finnhub) en markdown.
 * @param {Object} data - Contenu de markets.json
 * @returns {string|null} Section markdown ou null si données absentes
 */
function formatMarkets(data) {
    if (!data?.quotes?.length) return null;
    const lines = ['## 📊 Indices boursiers (Finnhub)'];
    for (const q of data.quotes) {
        const sign = q.change > 0 ? '+' : '';
        lines.push(`- **${q.name}** (${q.symbol}): $${q.price} (${sign}${q.change.toFixed(2)}%)`);
    }
    return lines.join('\n');
}

/**
 * Formate les données crypto (CoinGecko) en markdown.
 * @param {Object} data - Contenu de crypto.json
 * @returns {string|null} Section markdown ou null si données absentes
 */
function formatCrypto(data) {
    if (!data?.prices?.length) return null;
    const lines = ['## ₿ Crypto (CoinGecko)'];
    for (const c of data.prices.slice(0, 10)) {
        const d = c.change_24h > 0 ? '+' : '';
        const w = c.change_7d > 0 ? '+' : '';
        lines.push(`- **${c.name}** (${c.symbol}): $${c.price} (24h: ${d}${c.change_24h.toFixed(1)}%, 7j: ${w}${c.change_7d.toFixed(1)}%)`);
    }
    // Ajouter les données globales si disponibles
    if (data.global) {
        if (data.global.market_cap_change_24h != null) {
            const sign = data.global.market_cap_change_24h >= 0 ? '+' : '';
            lines.push(`- Market cap total 24h: ${sign}${data.global.market_cap_change_24h.toFixed(2)}%`);
        }
        if (data.global.eth_dominance) {
            lines.push(`- Dominance ETH: ${data.global.eth_dominance.toFixed(1)}%`);
        }
    }
    return lines.join('\n');
}

/**
 * Formate le Fear & Greed Index crypto.
 * Cet indicateur est clé pour détecter les extrêmes de sentiment.
 * @param {Object} data - Contenu de fear-greed.json
 * @returns {string|null} Section markdown ou null
 */
function formatFearGreed(data) {
    if (!data?.current?.value) return null;
    const c = data.current;
    const changes = data.changes || {};
    const lines = [
        '## 😱 Sentiment Crypto (Fear & Greed Index)',
        `- **Score actuel** : ${c.value}/100 (${c.label})`
    ];
    if (changes.week != null) {
        const sign = changes.week >= 0 ? '+' : '';
        lines.push(`- Variation 7j : ${sign}${changes.week} points`);
    }
    if (changes.month != null) {
        const sign = changes.month >= 0 ? '+' : '';
        lines.push(`- Variation 30j : ${sign}${changes.month} points`);
    }
    return lines.join('\n');
}

/**
 * Formate les indicateurs macroéconomiques FRED.
 * Ce sont les indicateurs US de référence (CPI, taux Fed, PIB, chômage, etc.)
 * @param {Object} data - Contenu de macro.json
 * @returns {string|null} Section markdown ou null
 */
function formatMacro(data) {
    if (!data?.indicators?.length) return null;
    const lines = ['## 🏛️ Macro US (FRED)'];
    for (const ind of data.indicators) {
        const changeStr = ind.change != null
            ? ` (${ind.change >= 0 ? '+' : ''}${ind.change.toFixed(2)}${ind.change_type === 'yoy' ? '% a/a' : ''})`
            : '';
        lines.push(`- **${ind.label}** : ${ind.value}${ind.unit === '%' ? '%' : ''} ${changeStr}`);
    }
    return lines.join('\n');
}

/**
 * Formate les données macro mondiales (BCE, VIX).
 * Le VIX est essentiel pour mesurer la peur sur les marchés.
 * @param {Object} data - Contenu de global-macro.json
 * @returns {string|null} Section markdown ou null
 */
function formatGlobalMacro(data) {
    if (!data) return null;
    const lines = ['## 🌐 Macro mondiale (BCE + VIX)'];
    if (data.volatility?.vix) {
        const v = data.volatility.vix;
        const sign = v.change > 0 ? '+' : '';
        lines.push(`- **VIX** : ${v.value} (${v.label}, ${sign}${v.change}%)`);
    }
    if (data.ecb?.main_rate) {
        lines.push(`- **Taux directeur BCE** : ${data.ecb.main_rate.value}%`);
    }
    if (data.ecb?.eurusd) {
        lines.push(`- **EUR/USD** (fixing BCE) : ${data.ecb.eurusd.rate}`);
    }
    return lines.length > 1 ? lines.join('\n') : null;
}

/**
 * Formate les matières premières (metals.dev).
 * L'or, l'argent et le cuivre sont des indicateurs macro importants.
 * @param {Object} data - Contenu de commodities.json
 * @returns {string|null} Section markdown ou null
 */
function formatCommodities(data) {
    if (!data) return null;
    const lines = ['## ⛏️ Matières premières (metals.dev)'];
    if (data.metals && Object.keys(data.metals).length) {
        lines.push('### Métaux précieux');
        for (const m of Object.values(data.metals)) {
            lines.push(`- **${m.label}** : $${m.price_usd}/${m.unit}`);
        }
    }
    if (data.industrial && Object.keys(data.industrial).length) {
        lines.push('### Métaux industriels');
        for (const m of Object.values(data.industrial)) {
            lines.push(`- **${m.label}** : $${m.price_usd_kg}/${m.unit}`);
        }
    }
    return lines.length > 1 ? lines.join('\n') : null;
}

/**
 * Formate les indices européens (Twelve Data).
 * @param {Object} data - Contenu de european-markets.json
 * @returns {string|null} Section markdown ou null
 */
function formatEuropeanMarkets(data) {
    if (!data?.indices?.length) return null;
    const lines = ['## 🇪🇺 Indices européens (Twelve Data)'];
    for (const idx of data.indices) {
        const sign = idx.change >= 0 ? '+' : '';
        lines.push(`- **${idx.name}** : ${idx.close} (${sign}${idx.change_pct.toFixed(2)}%)`);
    }
    return lines.join('\n');
}

/**
 * Formate les données DeFi (DefiLlama).
 * @param {Object} data - Contenu de defi.json
 * @returns {string|null} Section markdown ou null
 */
function formatDefi(data) {
    if (!data?.topProtocols?.length) return null;
    const lines = ['## 🦙 DeFi (DefiLlama)'];
    if (data.summary?.total_tvl_formatted) {
        lines.push(`- TVL totale : ${data.summary.total_tvl_formatted}`);
    }
    for (const p of data.topProtocols.slice(0, 5)) {
        const tvl = p.tvl > 1e9 ? `$${(p.tvl / 1e9).toFixed(1)}B` : `$${(p.tvl / 1e6).toFixed(0)}M`;
        const changeStr = p.change_1d != null
            ? ` (24h: ${p.change_1d > 0 ? '+' : ''}${p.change_1d.toFixed(1)}%)`
            : '';
        lines.push(`- **${p.name}** — TVL ${tvl}${changeStr}`);
    }
    return lines.join('\n');
}

/**
 * Formate les données Forex et secteurs (Alpha Vantage).
 * @param {Object} data - Contenu de alpha-vantage.json
 * @returns {string|null} Section markdown ou null
 */
function formatAlphaVantage(data) {
    if (!data) return null;
    const lines = [];
    if (data.forex?.length) {
        lines.push('## 💱 Forex (Alpha Vantage)');
        for (const fx of data.forex) {
            lines.push(`- **${fx.pair}** : ${fx.rate.toFixed(4)}`);
        }
    }
    if (data.sectors?.length) {
        lines.push('## 📊 Secteurs US');
        for (const s of data.sectors.slice(0, 6)) {
            const sign = s.realtime >= 0 ? '+' : '';
            lines.push(`- ${s.name} : ${sign}${s.realtime.toFixed(2)}%`);
        }
    }
    return lines.length > 0 ? lines.join('\n') : null;
}

/**
 * Formate les données on-chain (Etherscan + Mempool).
 * Gas ETH élevé = activité DeFi. Hashrate BTC = sécurité réseau.
 * @param {Object} data - Contenu de onchain.json
 * @returns {string|null} Section markdown ou null
 */
function formatOnChain(data) {
    if (!data) return null;
    const lines = ['## ⛓️ On-chain (Etherscan + Mempool)'];
    if (data.eth_gas) {
        lines.push(`- **ETH Gas** : ${data.eth_gas.low}/${data.eth_gas.standard}/${data.eth_gas.fast} gwei (low/std/fast)`);
    }
    if (data.btc_fees) {
        lines.push(`- **BTC Fees** : ${data.btc_fees.half_hour} sat/vB (30min)`);
    }
    if (data.btc_mining) {
        lines.push(`- **BTC Hashrate** : ${data.btc_mining.hashrate_eh} EH/s`);
    }
    return lines.length > 1 ? lines.join('\n') : null;
}

/**
 * Formate le sentiment IA existant (si disponible).
 * @param {Object} data - Contenu de sentiment.json
 * @returns {string|null} Section markdown ou null
 */
function formatSentiment(data) {
    if (!data?.categories) return null;
    const lines = ['## 🎯 Sentiment IA (analyse précédente)'];
    for (const [cat, info] of Object.entries(data.categories)) {
        if (info?.score != null) {
            const sign = info.score >= 0 ? '+' : '';
            lines.push(`- **${cat}** : ${sign}${info.score.toFixed(2)} (${info.tendance || 'n/a'})`);
        }
    }
    if (data.global?.score != null) {
        lines.push(`- **Score global** : ${data.global.score.toFixed(2)}`);
    }
    return lines.length > 1 ? lines.join('\n') : null;
}

// ─── Script principal ────────────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  Inflexion — Briefing IA Quotidien Stratégique  ║');
    console.log(`║  ${new Date().toISOString()}              ║`);
    console.log('╚══════════════════════════════════════════════════╝');
    if (DRY_RUN) console.log('  🏃 Mode dry-run actif (pas d\'appel API)\n');

    // Charger les modules RAG dynamiquement (évite de bloquer les tests unitaires)
    const ragMod = await import('./lib/rag-store.mjs');
    const embMod = await import('./lib/embeddings.mjs');
    RAGStore = ragMod.RAGStore;
    embedText = embMod.embedText;

    // ── 1. Charger toutes les sources de données ──────────────
    console.log('\n📂 Chargement des sources de données...');

    const sources = {
        news:             loadJSON('news.json'),
        newsapi:          loadJSON('newsapi.json'),
        markets:          loadJSON('markets.json'),
        crypto:           loadJSON('crypto.json'),
        fearGreed:        loadJSON('fear-greed.json'),
        macro:            loadJSON('macro.json'),
        globalMacro:      loadJSON('global-macro.json'),
        commodities:      loadJSON('commodities.json'),
        europeanMarkets:  loadJSON('european-markets.json'),
        defi:             loadJSON('defi.json'),
        alphaVantage:     loadJSON('alpha-vantage.json'),
        onchain:          loadJSON('onchain.json'),
        sentiment:        loadJSON('sentiment.json'),
    };

    // Afficher quelles sources sont disponibles
    const available = Object.entries(sources)
        .filter(([, v]) => v !== null)
        .map(([k]) => k);
    const missing = Object.entries(sources)
        .filter(([, v]) => v === null)
        .map(([k]) => k);

    console.log(`  ✅ Sources disponibles (${available.length}/13) : ${available.join(', ')}`);
    if (missing.length > 0) {
        console.log(`  ⚠  Sources manquantes (${missing.length}) : ${missing.join(', ')}`);
    }

    // Il faut au minimum les news pour générer le briefing
    if (!sources.news) {
        console.error('\n  ❌ news.json introuvable — exécuter fetch-data.mjs d\'abord');
        process.exit(1);
    }

    // ── 2. Sélectionner les articles les plus importants ──────
    console.log('\n📰 Sélection des articles clés...');
    const topArticles = selectTopArticles(sources.news);
    console.log(`  ✓ ${topArticles.length} articles sélectionnés`);

    // Afficher la répartition par catégorie
    const catCounts = {};
    for (const a of topArticles) {
        const cat = a.rubrique || a._category || 'other';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(catCounts)) {
        console.log(`    ${cat}: ${count} articles`);
    }

    // ── 3. Construire le contexte complet pour Claude ─────────
    console.log('\n🔧 Construction du contexte multi-sources...');

    // Articles d'actualité (la matière première du briefing)
    const newsContext = formatNewsContext(topArticles);

    // Données de marché (les PREUVES chiffrées pour les interconnexions)
    const marketSections = [
        formatMarkets(sources.markets),
        formatEuropeanMarkets(sources.europeanMarkets),
        formatCrypto(sources.crypto),
        formatFearGreed(sources.fearGreed),
        formatMacro(sources.macro),
        formatGlobalMacro(sources.globalMacro),
        formatCommodities(sources.commodities),
        formatDefi(sources.defi),
        formatAlphaVantage(sources.alphaVantage),
        formatOnChain(sources.onchain),
        formatSentiment(sources.sentiment),
    ].filter(Boolean);

    console.log(`  ✓ ${marketSections.length} sections de données de marché`);

    // ── 3b. Récupérer le contexte historique RAG ────────────────
    let ragContext = '';
    const RAG_DIR = join(DATA_DIR, 'rag');
    const store = new RAGStore(RAG_DIR);
    const ragStats = store.getStats();

    if (ragStats.articlesCount > 0 || ragStats.briefingsCount > 0) {
        console.log(`\n🧠 RAG : ${ragStats.articlesCount} articles, ${ragStats.briefingsCount} briefings en mémoire`);

        try {
            // Construire un résumé des sujets du jour pour la recherche sémantique
            const todayTopics = topArticles.slice(0, 5).map(a => a.title).join('. ');
            const queryEmbedding = await embedText(todayTopics);

            // Recherche d'articles historiques similaires
            const similarArticles = store.searchArticles(queryEmbedding, {
                topK: 5,
                minScore: 0.35,
                excludeDate: today(),
            });

            // Recherche de briefings similaires + briefings récents
            const similarBriefings = store.searchBriefings(queryEmbedding, {
                topK: 2,
                minScore: 0.3,
                excludeDate: today(),
            });
            const recentBriefings = store.getRecentBriefings(2, today());

            // Fusionner briefings similaires et récents (dédupliquer)
            const seenBriefingIds = new Set();
            const allBriefings = [];
            for (const b of [...similarBriefings.map(r => r.entry), ...recentBriefings]) {
                if (!seenBriefingIds.has(b.id)) {
                    seenBriefingIds.add(b.id);
                    allBriefings.push(b);
                }
            }

            // Construire le contexte RAG en Markdown
            const ragParts = [];

            if (similarArticles.length > 0) {
                ragParts.push('### Articles historiques similaires');
                for (const { entry, score } of similarArticles) {
                    const meta = entry.metadata || {};
                    ragParts.push(`- **${meta.title || '(sans titre)'}** (${meta.source || '?'}, ${entry.date}) — similarité: ${(score * 100).toFixed(0)}%`);
                }
            }

            if (allBriefings.length > 0) {
                ragParts.push('### Briefings précédents (continuité narrative)');
                for (const b of allBriefings.slice(0, 3)) {
                    const meta = b.metadata || {};
                    ragParts.push(`- **${b.date}** : ${meta.titre || '(sans titre)'}`);
                    if (meta.contenu_preview) {
                        ragParts.push(`  > ${meta.contenu_preview.slice(0, 200)}...`);
                    }
                    if (meta.sentiment) {
                        ragParts.push(`  Sentiment: ${meta.sentiment}. Tags: ${(meta.tags || []).join(', ')}`);
                    }
                }
            }

            if (ragParts.length > 0) {
                ragContext = `\n## PARTIE C : Contexte historique (RAG — mémoire Inflexion)\n\n${ragParts.join('\n')}\n`;
                console.log(`  ✓ RAG: ${similarArticles.length} articles similaires, ${allBriefings.length} briefings récupérés`);
            }
        } catch (err) {
            console.warn(`  ⚠ RAG indisponible: ${err.message}`);
        }
    } else {
        console.log('\n🧠 RAG : store vide (première exécution, le contexte historique sera disponible demain)');
    }

    // Assembler le message complet avec structure claire pour faciliter l'analyse
    const userMessage = `# Briefing stratégique Inflexion — ${today()}

## PARTIE A : Actualités du jour (${topArticles.length} articles sélectionnés parmi 122 sources RSS + 15 APIs)

${newsContext}

## PARTIE B : Données de marché en temps réel

${marketSections.join('\n\n')}
${ragContext}
---

## Consignes de production

Produis le briefing stratégique quotidien en respectant ces priorités :
1. **Identifier le fait le plus structurant** du jour (pas le plus spectaculaire — le plus significatif pour un investisseur)
2. **Croiser les actualités (partie A) avec les données chiffrées (partie B)** pour établir des chaînes de causalité concrètes
3. **Chaque interconnexion doit citer des chiffres** tirés de la partie B comme preuves factuelles
4. **Signaler les divergences** si des indicateurs envoient des signaux contradictoires
5. **Ne pas inventer de données** absentes des parties A et B — si une information manque, le mentionner${ragContext ? '\n6. **Exploiter le contexte historique (partie C)** pour la continuité narrative : signaler les évolutions par rapport aux briefings précédents, identifier les tendances qui se confirment ou s\'inversent' : ''}`;

    console.log(`  📋 Message total : ${(userMessage.length / 1024).toFixed(1)} Ko`);

    // ── 4. Mode dry-run : valider sans appeler Claude ─────────
    if (DRY_RUN) {
        console.log('\n  ✅ Dry-run OK — données valides pour le briefing');
        console.log(`  📰 ${topArticles.length} articles`);
        console.log(`  📊 ${marketSections.length} sections de données`);
        console.log(`  📋 ${(userMessage.length / 1024).toFixed(1)} Ko de contexte`);
        return;
    }

    // ── 5. Vérifier la clé API ────────────────────────────────
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('\n  ❌ ANTHROPIC_API_KEY non définie');
        console.error('  → Ajouter le secret dans GitHub: Settings > Secrets > ANTHROPIC_API_KEY');
        console.error('  → Clé sur https://console.anthropic.com');
        process.exit(1);
    }

    // ── 6. Appeler Claude Sonnet pour le briefing ─────────────
    console.log('\n🤖 Appel Claude Sonnet pour le briefing stratégique...');
    console.log(`  Modèle : ${MODEL}`);
    console.log(`  Max tokens : ${MAX_TOKENS}`);

    try {
        const briefing = await callClaudeJSON({
            systemPrompt: DAILY_BRIEFING_SYSTEM_PROMPT,
            userMessage,
            model: MODEL,
            maxTokens: MAX_TOKENS,
            temperature: 0.3, // Peu de créativité, beaucoup de rigueur
            label: 'daily-briefing',
            timeoutMs: 120_000, // 120s car Sonnet + long contexte + 4096 tokens
            retry: { maxAttempts: 4, initialDelayMs: 5_000, maxDelayMs: 60_000, backoffMultiplier: 2, retryableStatusCodes: [429, 500, 502, 503, 529] },
            validate: (data) => {
                // Valider la structure du briefing
                if (!data.synthese?.titre) return 'synthese.titre manquant';
                if (!data.synthese?.contenu) return 'synthese.contenu manquant';
                if (!data.signaux?.length) return 'signaux manquants (tableau vide)';
                if (!data.risk_radar?.length) return 'risk_radar manquant (tableau vide)';
                // Vérifier que chaque signal a des interconnexions
                for (const s of data.signaux) {
                    if (!s.interconnexions?.length) {
                        return `Signal "${s.titre}" sans interconnexions`;
                    }
                }
                return true;
            },
        });

        // ── 7. Enrichir et sauvegarder ────────────────────────
        const output = {
            date: today(),
            generated_at: new Date().toISOString(),
            model: MODEL,
            sources_count: topArticles.length,
            sources_market: available.filter(s => s !== 'news' && s !== 'newsapi').length,
            ...briefing,
        };

        const outputPath = join(DATA_DIR, 'daily-briefing.json');
        writeJSON(outputPath, output);

        // ── 8. Résumé ─────────────────────────────────────────
        const stats = getUsageStats();
        console.log('\n╔══════════════════════════════════════════════════╗');
        console.log('║  Résumé du briefing                              ║');
        console.log('╚══════════════════════════════════════════════════╝');
        console.log(`  📰 Titre : ${briefing.synthese.titre}`);
        console.log(`  🎯 Sentiment : ${briefing.sentiment_global}`);
        console.log(`  📡 Signaux : ${briefing.signaux.length}`);
        for (const s of briefing.signaux) {
            console.log(`    → ${s.titre} (${s.severite}) — ${s.interconnexions.length} interconnexions`);
        }
        console.log(`  🎯 Risk Radar : ${briefing.risk_radar.length} risques`);
        for (const r of briefing.risk_radar) {
            console.log(`    ⚠ ${r.risque} (${r.severite})`);
        }
        console.log(`  🏷️  Tags : ${briefing.tags?.join(', ')}`);
        console.log(`  💰 Claude API : ${stats.totalInputTokens}in / ${stats.totalOutputTokens}out tokens`);
        console.log(`     Coût estimé : ~$${stats.estimatedCostUSD}`);

    } catch (err) {
        console.error(`\n  ❌ Erreur briefing : ${err.message}`);
        if (err.rawText) {
            console.error(`  Réponse brute : ${err.rawText.slice(0, 300)}...`);
        }
        process.exit(1);
    }

    console.log('\n  ✅ Briefing IA quotidien terminé');
}

// Ne pas lancer main() si importé comme module de test
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
    main().catch(err => { console.error('Erreur fatale:', err); process.exit(1); });
}

// Export pour tests unitaires
export { selectTopArticles, formatNewsContext, formatMarkets, formatCrypto,
         formatFearGreed, formatMacro, formatGlobalMacro, formatCommodities,
         formatEuropeanMarkets, formatDefi, formatAlphaVantage, formatOnChain,
         formatSentiment };
