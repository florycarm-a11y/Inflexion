#!/usr/bin/env node
/**
 * Inflexion — Analyse de marché consolidée
 *
 * Fusionne 4 scripts (sentiment + alertes + macro + briefing) en 2 appels Claude.
 * Réduit la consommation de tokens de ~75% en éliminant :
 *   - 6 appels Claude redondants (8 → 2)
 *   - La répétition des system prompts (~4 000 tokens économisés)
 *   - La duplication du contexte marché (~6 000 tokens économisés)
 *
 * Sorties (identiques aux scripts individuels) :
 *   - data/sentiment.json
 *   - data/alerts.json
 *   - data/macro-analysis.json
 *   - data/market-briefing.json
 *
 * Exécuté 2x/jour par GitHub Actions (30min après fetch-data)
 *
 * Options :
 *   --dry-run  Valide les données sans appeler Claude
 *
 * @requires ANTHROPIC_API_KEY dans les variables d'environnement
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { callClaudeJSON, getUsageStats } from './lib/claude-api.mjs';
import {
    CONSOLIDATED_SENTIMENT_ALERTS_PROMPT,
    CONSOLIDATED_MACRO_BRIEFING_PROMPT,
} from './lib/prompts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Configuration ──────────────────────────────────────────

/** Max titres envoyés par rubrique */
const MAX_TITLES_PER_CATEGORY = 20;

/** Nombre max de jours d'historique sentiment */
const MAX_HISTORY_DAYS = 30;

/** Mapping catégories news.json → rubriques Inflexion */
const CATEGORY_MAP = {
    geopolitics: 'geopolitique',
    markets: 'marches',
    crypto: 'crypto',
    commodities: 'matieres_premieres',
    ai_tech: 'ai_tech',
};

/** Seuils de détection pour alertes */
const THRESHOLDS = {
    crypto_change_24h_pct: 5.0,
    crypto_change_7d_pct: 10.0,
    market_change_pct: 2.0,
    fear_greed_extreme_low: 15,
    fear_greed_extreme_high: 85,
    fear_greed_change_points: 10,
};

// ─── Utilitaires ────────────────────────────────────────────

function writeJSON(filepath, data) {
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`  📝 ${filepath.split('/').pop()} sauvegardé`);
}

function loadJSON(filename) {
    const filepath = join(DATA_DIR, filename);
    if (!existsSync(filepath)) return null;
    try {
        return JSON.parse(readFileSync(filepath, 'utf-8'));
    } catch {
        return null;
    }
}

function today() {
    return new Date().toISOString().split('T')[0];
}

// ─── Chargement centralisé des données ──────────────────────

function loadAllSources() {
    const sources = {
        news: loadJSON('news.json'),
        newsapi: loadJSON('newsapi.json'),
        markets: loadJSON('markets.json'),
        crypto: loadJSON('crypto.json'),
        fearGreed: loadJSON('fear-greed.json'),
        macro: loadJSON('macro.json'),
        globalMacro: loadJSON('global-macro.json'),
        commodities: loadJSON('commodities.json'),
        defi: loadJSON('defi.json'),
        alphaVantage: loadJSON('alpha-vantage.json'),
        onchain: loadJSON('onchain.json'),
    };

    const available = Object.entries(sources)
        .filter(([, v]) => v !== null)
        .map(([k]) => k);

    console.log(`📊 Sources chargées : ${available.join(', ')} (${available.length}/${Object.keys(sources).length})`);
    return sources;
}

// ─── Détection des mouvements significatifs ──────────────────

function detectSignificantChanges(sources) {
    const changes = [];

    // Crypto
    if (sources.crypto?.prices?.length) {
        for (const coin of sources.crypto.prices) {
            if (Math.abs(coin.change_24h) >= THRESHOLDS.crypto_change_24h_pct) {
                changes.push({
                    type: 'crypto_24h',
                    categorie: 'crypto',
                    severite: Math.abs(coin.change_24h) >= 10 ? 'urgent' : 'attention',
                    description: `${coin.name} (${coin.symbol}) : ${coin.change_24h > 0 ? '+' : ''}${coin.change_24h.toFixed(2)}% sur 24h (prix: $${coin.price.toLocaleString('fr-FR')})`,
                    donnees: { symbole: coin.symbol, nom: coin.name, prix: coin.price, variation_24h: Math.round(coin.change_24h * 100) / 100 },
                });
            }
            if (coin.change_7d && Math.abs(coin.change_7d) >= THRESHOLDS.crypto_change_7d_pct) {
                changes.push({
                    type: 'crypto_7d',
                    categorie: 'crypto',
                    severite: Math.abs(coin.change_7d) >= 20 ? 'urgent' : 'attention',
                    description: `${coin.name} (${coin.symbol}) : ${coin.change_7d > 0 ? '+' : ''}${coin.change_7d.toFixed(2)}% sur 7 jours`,
                    donnees: { symbole: coin.symbol, nom: coin.name, prix: coin.price, variation_7d: Math.round(coin.change_7d * 100) / 100 },
                });
            }
        }
    }

    // Marchés
    if (sources.markets?.quotes?.length) {
        for (const quote of sources.markets.quotes) {
            if (Math.abs(quote.change) >= THRESHOLDS.market_change_pct) {
                changes.push({
                    type: 'market',
                    categorie: 'marches',
                    severite: Math.abs(quote.change) >= 3 ? 'urgent' : 'attention',
                    description: `${quote.name} (${quote.symbol}) : ${quote.change > 0 ? '+' : ''}${quote.change.toFixed(2)}% (prix: $${quote.price.toFixed(2)})`,
                    donnees: { symbole: quote.symbol, nom: quote.name, prix: quote.price, variation: Math.round(quote.change * 100) / 100 },
                });
            }
        }
    }

    // Fear & Greed
    if (sources.fearGreed?.current) {
        const score = sources.fearGreed.current.value;
        const weekChange = sources.fearGreed.changes?.week;

        if (score <= THRESHOLDS.fear_greed_extreme_low || score >= THRESHOLDS.fear_greed_extreme_high) {
            changes.push({
                type: 'fng_extreme',
                categorie: 'macro',
                severite: score <= 10 || score >= 90 ? 'urgent' : 'attention',
                description: `Fear & Greed Index à ${score} (${sources.fearGreed.current.label})`,
                donnees: { score, label: sources.fearGreed.current.label, variation_7j: weekChange },
            });
        }
        if (weekChange && Math.abs(weekChange) >= THRESHOLDS.fear_greed_change_points) {
            changes.push({
                type: 'fng_change',
                categorie: 'macro',
                severite: 'info',
                description: `Fear & Greed : variation de ${weekChange > 0 ? '+' : ''}${weekChange} pts sur 7 jours (actuellement ${score})`,
                donnees: { score, label: sources.fearGreed.current.label, variation_7j: weekChange },
            });
        }
    }

    return changes;
}

// ─── Formatage du contexte marché ────────────────────────────

function formatMarketContext(sources) {
    const sections = [];

    // Indices
    if (sources.markets?.quotes?.length) {
        sections.push('## Indices boursiers\n' + sources.markets.quotes.map(q =>
            `- ${q.name} (${q.symbol}): $${q.price} (${q.change > 0 ? '+' : ''}${q.change.toFixed(2)}%)`
        ).join('\n'));
    }

    // Crypto
    if (sources.crypto?.prices?.length) {
        const coins = sources.crypto.prices.slice(0, 10);
        sections.push('## Crypto\n' + coins.map(c =>
            `- ${c.name} (${c.symbol}): $${c.price} (24h: ${c.change_24h > 0 ? '+' : ''}${c.change_24h.toFixed(1)}%, 7j: ${c.change_7d > 0 ? '+' : ''}${c.change_7d.toFixed(1)}%)`
        ).join('\n'));
    }

    // Fear & Greed
    if (sources.fearGreed?.current?.value) {
        const c = sources.fearGreed.current;
        const ch = sources.fearGreed.changes || {};
        sections.push(`## Fear & Greed Index\n- Score actuel : ${c.value}/100 (${c.label})\n- Variation 7j : ${ch.week ?? '?'}\n- Variation 30j : ${ch.month ?? '?'}`);
    }

    // Macro FRED
    if (sources.macro?.indicators?.length) {
        sections.push('## Macro (FRED)\n' + sources.macro.indicators.map(i => {
            const change = i.change !== undefined ? ` (${i.change > 0 ? '+' : ''}${i.change}${i.change_type === 'yoy' ? '% YoY' : ''})` : '';
            return `- ${i.label}: ${i.value} ${i.unit}${change}`;
        }).join('\n'));
    }

    // Global Macro (BCE, VIX)
    if (sources.globalMacro) {
        let text = '## Macro mondiale';
        if (sources.globalMacro.volatility?.vix)
            text += `\n- VIX: ${sources.globalMacro.volatility.vix.value} (${sources.globalMacro.volatility.vix.label}, ${sources.globalMacro.volatility.vix.change > 0 ? '+' : ''}${sources.globalMacro.volatility.vix.change}%)`;
        if (sources.globalMacro.ecb?.main_rate)
            text += `\n- Taux directeur BCE: ${sources.globalMacro.ecb.main_rate.value}%`;
        if (sources.globalMacro.ecb?.eurusd)
            text += `\n- EUR/USD (ECB fixing): ${sources.globalMacro.ecb.eurusd.rate}`;
        if (text.includes('\n')) sections.push(text);
    }

    // Commodités
    if (sources.commodities) {
        let text = '## Matières premières';
        if (sources.commodities.metals && Object.keys(sources.commodities.metals).length)
            text += '\n### Métaux précieux\n' + Object.values(sources.commodities.metals).map(m => `- ${m.label}: $${m.price_usd}/${m.unit}`).join('\n');
        if (sources.commodities.industrial && Object.keys(sources.commodities.industrial).length)
            text += '\n### Métaux industriels\n' + Object.values(sources.commodities.industrial).map(m => `- ${m.label}: $${m.price_usd_kg}/${m.unit}`).join('\n');
        if (text.includes('\n')) sections.push(text);
    }

    // DeFi
    if (sources.defi) {
        let text = '## DeFi';
        if (sources.defi.totalTVL) text += `\n- TVL totale : $${(sources.defi.totalTVL / 1e9).toFixed(1)}B`;
        if (sources.defi.topProtocols?.length) {
            text += '\n- Top protocoles : ' + sources.defi.topProtocols.slice(0, 5).map(p =>
                `${p.name} ($${(p.tvl / 1e9).toFixed(1)}B, 24h: ${p.change_1d > 0 ? '+' : ''}${p.change_1d.toFixed(1)}%)`
            ).join(', ');
        }
        if (text.includes('\n')) sections.push(text);
    }

    // Alpha Vantage (Forex, Secteurs)
    if (sources.alphaVantage) {
        let text = '';
        if (sources.alphaVantage.forex?.length) {
            text += '## Forex\n' + sources.alphaVantage.forex.map(f => `- ${f.pair}: ${f.rate}`).join('\n');
        }
        if (sources.alphaVantage.sectors?.length) {
            text += '\n\n## Secteurs US\n' + sources.alphaVantage.sectors.map(s => `- ${s.name}: ${s.performance}`).join('\n');
        }
        if (sources.alphaVantage.topMovers?.gainers?.length) {
            text += '\n\n## Top Gainers\n' + sources.alphaVantage.topMovers.gainers.slice(0, 3).map(g => `- ${g.ticker}: +${g.changePct.toFixed(1)}% ($${g.price})`).join('\n');
        }
        if (sources.alphaVantage.topMovers?.losers?.length) {
            text += '\n\n## Top Losers\n' + sources.alphaVantage.topMovers.losers.slice(0, 3).map(l => `- ${l.ticker}: ${l.changePct.toFixed(1)}% ($${l.price})`).join('\n');
        }
        if (text) sections.push(text);
    }

    // On-chain
    if (sources.onchain) {
        let text = '## Données on-chain';
        if (sources.onchain.eth_gas)
            text += `\n- ETH Gas: ${sources.onchain.eth_gas.low}/${sources.onchain.eth_gas.standard}/${sources.onchain.eth_gas.fast} gwei (low/std/fast)`;
        if (sources.onchain.btc_fees)
            text += `\n- BTC Fees: ${sources.onchain.btc_fees.half_hour} sat/vB (30min)`;
        if (sources.onchain.btc_mining)
            text += `\n- BTC Hashrate: ${sources.onchain.btc_mining.hashrate_eh} EH/s`;
        if (text.includes('\n')) sections.push(text);
    }

    return sections;
}

// ─── APPEL 1 : Sentiment + Alertes consolidés ───────────────

async function runSentimentAndAlerts(sources) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📊 Appel 1/2 : Sentiment + Alertes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Collecter les articles par rubrique
    const articlesByRubrique = {};
    if (sources.news?.categories) {
        for (const [category, articles] of Object.entries(sources.news.categories)) {
            const rubrique = CATEGORY_MAP[category];
            if (!rubrique) continue;
            if (!articlesByRubrique[rubrique]) articlesByRubrique[rubrique] = [];
            articlesByRubrique[rubrique].push(...articles);
        }
    }

    const rubriques = Object.keys(articlesByRubrique);
    if (rubriques.length === 0) {
        console.log('  ⚠ Aucune rubrique disponible — sentiment ignoré');
        return { sentiment: null, alerts: null };
    }

    // Construire le message : titres par rubrique + mouvements détectés
    let userMessage = `Date : ${today()}\n\n`;

    // PARTIE 1 : titres par rubrique
    userMessage += '# TITRES D\'ACTUALITÉS PAR RUBRIQUE\n\n';
    for (const [rubrique, articles] of Object.entries(articlesByRubrique)) {
        const titles = articles
            .slice(0, MAX_TITLES_PER_CATEGORY)
            .map(a => `- ${a.title}`)
            .join('\n');
        userMessage += `## ${rubrique} (${articles.length} articles)\n${titles}\n\n`;
    }

    // PARTIE 2 : mouvements significatifs pour les alertes
    const changes = detectSignificantChanges(sources);
    userMessage += '# MOUVEMENTS DE MARCHÉ SIGNIFICATIFS\n\n';
    if (changes.length > 0) {
        userMessage += changes.map((c, i) => `[${i + 1}] ${c.description}`).join('\n');
    } else {
        userMessage += 'Aucun mouvement significatif détecté. Retourne un tableau "alertes" vide.';
    }

    userMessage += '\n\nProduis le JSON consolidé sentiment + alertes.';

    console.log(`  📋 ${rubriques.length} rubriques, ${changes.length} mouvement(s) détecté(s)`);
    console.log(`  📋 Message : ${(userMessage.length / 1024).toFixed(1)} Ko`);

    const result = await callClaudeJSON({
        systemPrompt: CONSOLIDATED_SENTIMENT_ALERTS_PROMPT,
        userMessage,
        maxTokens: 3000,
        temperature: 0.3,
        timeoutMs: 120_000,
        label: 'consolidated-sentiment-alerts',
        validate: (data) => {
            if (!data.sentiment?.categories) return 'sentiment.categories manquant';
            if (!Array.isArray(data.alertes)) return 'alertes manquant';
            return true;
        },
    });

    // ── Écrire sentiment.json ──
    const categories = result.sentiment.categories;
    const global = computeGlobalScore(categories);

    // Historique
    const sentimentPath = join(DATA_DIR, 'sentiment.json');
    let existingData = null;
    if (existsSync(sentimentPath)) {
        try { existingData = JSON.parse(readFileSync(sentimentPath, 'utf-8')); } catch { /* ignore */ }
    }
    const historique = updateHistory(existingData?.historique, global.score, categories);

    const sentimentData = {
        updated: new Date().toISOString(),
        date: today(),
        global,
        categories,
        historique,
        model: 'claude-haiku-4-5-20251001',
        mode: 'consolidated',
    };
    writeJSON(sentimentPath, sentimentData);

    const arrow = global.score > 0 ? '↑' : global.score < 0 ? '↓' : '→';
    console.log(`  ${arrow} Sentiment global: ${global.score > 0 ? '+' : ''}${global.score} (${global.tendance})`);

    // ── Écrire alerts.json ──
    const dateStr = new Date().toISOString();
    const alertes = result.alertes.map((alerte, i) => ({
        id: `alert-${today()}-${String(i + 1).padStart(3, '0')}`,
        ...alerte,
        horodatage: dateStr,
        donnees: changes[i]?.donnees || {},
    }));

    const alertStats = {
        total: alertes.length,
        urgent: alertes.filter(a => a.severite === 'urgent').length,
        attention: alertes.filter(a => a.severite === 'attention').length,
        info: alertes.filter(a => a.severite === 'info').length,
    };

    const alertsData = {
        updated: dateStr,
        alertes,
        stats: alertStats,
        model: 'claude-haiku-4-5-20251001',
        mode: 'consolidated',
    };
    writeJSON(join(DATA_DIR, 'alerts.json'), alertsData);

    console.log(`  🚨 ${alertes.length} alerte(s) générée(s)`);

    return { sentiment: sentimentData, alerts: alertsData };
}

// ─── APPEL 2 : Macro + Briefing consolidés ──────────────────

async function runMacroAndBriefing(sources) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📈 Appel 2/2 : Macro + Briefing');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Construire le contexte marché (une seule fois pour les deux analyses)
    const sections = formatMarketContext(sources);

    if (sections.length === 0) {
        console.log('  ⚠ Aucune donnée de marché disponible — macro+briefing ignoré');
        return { macro: null, briefing: null };
    }

    const todayStr = today();
    const userMessage = `# Snapshot des marchés — ${todayStr}

${sections.join('\n\n')}

---

Produis le JSON consolidé avec :
1. **macro** : analyse macroéconomique (phase du cycle, politique monétaire, inflation, risques)
2. **briefing** : briefing marché quotidien (régime de marché, cross-asset, perspectives 48h)

Croise systématiquement les classes d'actifs entre elles — ne pas commenter chaque segment isolément.
Cite les chiffres précis des données ci-dessus comme preuves.`;

    console.log(`  📋 ${sections.length} sections de données de marché`);
    console.log(`  📋 Message : ${(userMessage.length / 1024).toFixed(1)} Ko`);

    const result = await callClaudeJSON({
        systemPrompt: CONSOLIDATED_MACRO_BRIEFING_PROMPT,
        userMessage,
        maxTokens: 4000,
        timeoutMs: 120_000,
        temperature: 0.4,
        label: 'consolidated-macro-briefing',
        validate: (data) => {
            if (!data.macro?.titre) return 'macro.titre manquant';
            if (!data.macro?.analyse) return 'macro.analyse manquant';
            if (!data.briefing?.titre) return 'briefing.titre manquant';
            if (!data.briefing?.resume_executif) return 'briefing.resume_executif manquant';
            return true;
        },
    });

    // ── Écrire macro-analysis.json ──
    const macroOutput = {
        ...result.macro,
        updated: new Date().toISOString(),
        source: 'Claude IA + FRED + BCE + commodités',
        indicators_count: sources.macro?.indicators?.length || 0,
        mode: 'consolidated',
    };
    writeJSON(join(DATA_DIR, 'macro-analysis.json'), macroOutput);

    console.log(`  🏦 Macro : ${result.macro.titre}`);
    console.log(`    Phase cycle : ${result.macro.phase_cycle}`);
    console.log(`    Score risque : ${result.macro.score_risque}/10`);

    // ── Écrire market-briefing.json ──
    const availableSources = Object.entries(sources)
        .filter(([, v]) => v !== null)
        .map(([k]) => k);

    const briefingOutput = {
        ...result.briefing,
        updated: new Date().toISOString(),
        source: 'Claude IA + multi-sources',
        sources_used: availableSources,
        mode: 'consolidated',
    };
    writeJSON(join(DATA_DIR, 'market-briefing.json'), briefingOutput);

    console.log(`  📈 Briefing : ${result.briefing.titre}`);
    console.log(`    Sentiment : ${result.briefing.sentiment_global}`);

    return { macro: macroOutput, briefing: briefingOutput };
}

// ─── Helpers sentiment ──────────────────────────────────────

function computeGlobalScore(categories) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const cat of Object.values(categories)) {
        const weight = cat.confidence || 0.5;
        weightedSum += cat.score * weight;
        totalWeight += weight;
    }

    const globalScore = totalWeight > 0
        ? Math.round((weightedSum / totalWeight) * 100) / 100
        : 0;

    let tendance = 'neutre';
    if (globalScore > 0.2) tendance = 'haussier';
    else if (globalScore < -0.2) tendance = 'baissier';
    else if (Math.abs(globalScore) <= 0.2 && Object.keys(categories).length > 1) {
        const scores = Object.values(categories).map(c => c.score);
        const hasPositive = scores.some(s => s > 0.2);
        const hasNegative = scores.some(s => s < -0.2);
        if (hasPositive && hasNegative) tendance = 'mixte';
    }

    const sorted = Object.entries(categories)
        .sort(([, a], [, b]) => Math.abs(b.score) - Math.abs(a.score));
    const dominant = sorted[0];
    const resume = dominant
        ? `Le sentiment global est ${tendance} (${globalScore > 0 ? '+' : ''}${globalScore}), dominé par la rubrique ${dominant[0]} (${dominant[1].tendance}).`
        : 'Données insuffisantes pour une analyse globale.';

    return { score: globalScore, tendance, resume };
}

function updateHistory(existingHistory, globalScore, categories) {
    const todayStr = today();
    const entry = { date: todayStr, global: globalScore };

    for (const [rubrique, data] of Object.entries(categories)) {
        entry[rubrique] = data.score;
    }

    const history = (existingHistory || []).filter(h => h.date !== todayStr);
    history.push(entry);
    return history.slice(-MAX_HISTORY_DAYS);
}

// ─── Exécution principale ───────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  Inflexion — Analyse de marché consolidée    ║');
    console.log('║  (sentiment + alertes + macro + briefing)    ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`  📅 ${new Date().toISOString()}`);
    if (DRY_RUN) console.log('  🏃 Mode dry-run actif\n');

    // Vérifier la clé API
    if (!process.env.ANTHROPIC_API_KEY && !DRY_RUN) {
        console.error('❌ ANTHROPIC_API_KEY non définie');
        process.exit(1);
    }

    // Charger toutes les données UNE SEULE FOIS
    const sources = loadAllSources();

    if (DRY_RUN) {
        const changes = detectSignificantChanges(sources);
        console.log(`\n🔍 [DRY-RUN] ${changes.length} mouvement(s) significatif(s) détecté(s)`);
        const sections = formatMarketContext(sources);
        console.log(`🔍 [DRY-RUN] ${sections.length} sections de marché prêtes`);
        console.log('\n✅ [DRY-RUN] Données valides, aucun appel API effectué');
        return;
    }

    // Appel 1 : Sentiment + Alertes
    const { sentiment } = await runSentimentAndAlerts(sources);

    // Appel 2 : Macro + Briefing
    const { macro, briefing } = await runMacroAndBriefing(sources);

    // Résumé final
    const stats = getUsageStats();
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  Résumé de l\'analyse consolidée               ║');
    console.log('╚══════════════════════════════════════════════╝');
    if (sentiment) {
        console.log(`  📊 Sentiment : ${sentiment.global.score > 0 ? '+' : ''}${sentiment.global.score} (${sentiment.global.tendance})`);
    }
    if (macro) {
        console.log(`  🏦 Macro : ${macro.phase_cycle}, risque ${macro.score_risque}/10`);
    }
    if (briefing) {
        console.log(`  📈 Briefing : ${briefing.sentiment_global}`);
    }
    console.log(`  💰 Claude API : ${stats.totalCalls} appels, ${stats.totalInputTokens}in/${stats.totalOutputTokens}out tokens`);
    console.log(`  💰 Coût estimé : ~$${stats.estimatedCostUSD}`);
    console.log(`  📉 Économie vs 8 appels séparés : ~75% de tokens en moins`);
    console.log('═══════════════════════════════════════════════\n');
}

// Ne pas lancer main() si importé comme module
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
    main().catch(err => { console.error('Erreur fatale:', err); process.exit(1); });
}

// Exports pour réutilisation par le pipeline unifié
export {
    loadAllSources, formatMarketContext, detectSignificantChanges,
    runSentimentAndAlerts, runMacroAndBriefing,
    loadJSON, writeJSON, today,
};
