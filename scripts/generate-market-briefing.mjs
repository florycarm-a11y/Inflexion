#!/usr/bin/env node
/**
 * Inflexion — Briefing marché quotidien via Claude
 *
 * Ce script :
 * 1. Agrège toutes les données de marché (crypto, indices, DeFi, FNG, macro, forex)
 * 2. Envoie un snapshot complet à Claude pour synthèse croisée
 * 3. Écrit le résultat dans data/market-briefing.json
 *
 * Exécuté quotidiennement par GitHub Actions (après fetch-data + macro-analysis)
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
import { MARKET_BRIEFING_SYSTEM_PROMPT } from './lib/prompts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Utilitaires ─────────────────────────────────────────────

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

function writeJSON(filepath, data) {
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`  📝 ${filepath.split('/').pop()} sauvegardé`);
}

// ─── Formatage des données sources ──────────────────────────

function formatMarkets(data) {
    if (!data?.quotes?.length) return null;
    return '## Indices boursiers\n' + data.quotes.map(q =>
        `- ${q.name} (${q.symbol}): $${q.price} (${q.change > 0 ? '+' : ''}${q.change.toFixed(2)}%)`
    ).join('\n');
}

function formatCrypto(data) {
    if (!data?.prices?.length) return null;
    const coins = data.prices.slice(0, 10);
    return '## Crypto\n' + coins.map(c =>
        `- ${c.name} (${c.symbol}): $${c.price} (24h: ${c.change_24h > 0 ? '+' : ''}${c.change_24h.toFixed(1)}%, 7j: ${c.change_7d > 0 ? '+' : ''}${c.change_7d.toFixed(1)}%)`
    ).join('\n');
}

function formatFearGreed(data) {
    if (!data?.current?.value) return null;
    const c = data.current;
    const changes = data.changes || {};
    return `## Fear & Greed Index\n- Score actuel : ${c.value}/100 (${c.label})\n- Variation 7j : ${changes.week ?? '?'}\n- Variation 30j : ${changes.month ?? '?'}`;
}

function formatMacro(data) {
    if (!data?.indicators?.length) return null;
    return '## Macro (FRED)\n' + data.indicators.map(i => {
        const change = i.change !== undefined ? ` (${i.change > 0 ? '+' : ''}${i.change}${i.change_type === 'yoy' ? '% YoY' : ''})` : '';
        return `- ${i.label}: ${i.value} ${i.unit}${change}`;
    }).join('\n');
}

function formatDefi(data) {
    if (!data?.totalTVL && !data?.topProtocols?.length) return null;
    let text = '## DeFi';
    if (data.totalTVL) text += `\n- TVL totale : $${(data.totalTVL / 1e9).toFixed(1)}B`;
    if (data.topProtocols?.length) {
        text += '\n- Top protocoles : ' + data.topProtocols.slice(0, 5).map(p =>
            `${p.name} ($${(p.tvl / 1e9).toFixed(1)}B, 24h: ${p.change_1d > 0 ? '+' : ''}${p.change_1d.toFixed(1)}%)`
        ).join(', ');
    }
    return text;
}

function formatAlphaVantage(data) {
    if (!data) return null;
    let text = '';
    if (data.forex?.length) {
        text += '## Forex\n' + data.forex.map(f =>
            `- ${f.pair}: ${f.rate}`
        ).join('\n');
    }
    if (data.sectors?.length) {
        text += '\n\n## Secteurs US\n' + data.sectors.map(s =>
            `- ${s.name}: ${s.performance}`
        ).join('\n');
    }
    if (data.topMovers?.gainers?.length) {
        text += '\n\n## Top Gainers\n' + data.topMovers.gainers.slice(0, 3).map(g =>
            `- ${g.ticker}: +${g.changePct.toFixed(1)}% ($${g.price})`
        ).join('\n');
    }
    if (data.topMovers?.losers?.length) {
        text += '\n\n## Top Losers\n' + data.topMovers.losers.slice(0, 3).map(l =>
            `- ${l.ticker}: ${l.changePct.toFixed(1)}% ($${l.price})`
        ).join('\n');
    }
    return text || null;
}

function formatCommodities(data) {
    if (!data) return null;
    let text = '## Matières premières';
    if (data.metals && Object.keys(data.metals).length) {
        text += '\n### Métaux précieux\n' + Object.values(data.metals).map(m =>
            `- ${m.label}: $${m.price_usd}/${m.unit}`
        ).join('\n');
    }
    if (data.industrial && Object.keys(data.industrial).length) {
        text += '\n### Métaux industriels\n' + Object.values(data.industrial).map(m =>
            `- ${m.label}: $${m.price_usd_kg}/${m.unit}`
        ).join('\n');
    }
    return text.includes('\n') ? text : null;
}

function formatOnChain(data) {
    if (!data) return null;
    let text = '## Données on-chain';
    if (data.eth_gas) {
        text += `\n- ETH Gas: ${data.eth_gas.low}/${data.eth_gas.standard}/${data.eth_gas.fast} gwei (low/std/fast)`;
        if (data.eth_gas.base_fee) text += ` — base fee: ${data.eth_gas.base_fee} gwei`;
    }
    if (data.btc_fees) {
        text += `\n- BTC Fees: ${data.btc_fees.half_hour} sat/vB (30min), ${data.btc_fees.economy} sat/vB (economy)`;
    }
    if (data.btc_mining) {
        text += `\n- BTC Hashrate: ${data.btc_mining.hashrate_eh} EH/s`;
    }
    return text.includes('\n') ? text : null;
}

function formatGlobalMacro(data) {
    if (!data) return null;
    let text = '## Macro mondiale';
    if (data.volatility?.vix) {
        text += `\n- VIX: ${data.volatility.vix.value} (${data.volatility.vix.label}, ${data.volatility.vix.change > 0 ? '+' : ''}${data.volatility.vix.change}%)`;
    }
    if (data.ecb?.main_rate) {
        text += `\n- Taux directeur BCE: ${data.ecb.main_rate.value}%`;
    }
    if (data.ecb?.eurusd) {
        text += `\n- EUR/USD (ECB fixing): ${data.ecb.eurusd.rate}`;
    }
    return text.includes('\n') ? text : null;
}

// ─── Script principal ───────────────────────────────────────

async function main() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  Inflexion — Briefing Marché (Claude)      ║');
    console.log('╚════════════════════════════════════════════╝');
    if (DRY_RUN) console.log('  🏃 Mode dry-run actif\n');

    // 1. Charger toutes les sources
    const sources = {
        markets: loadJSON('markets.json'),
        crypto: loadJSON('crypto.json'),
        fearGreed: loadJSON('fear-greed.json'),
        macro: loadJSON('macro.json'),
        defi: loadJSON('defi.json'),
        alphaVantage: loadJSON('alpha-vantage.json'),
        commodities: loadJSON('commodities.json'),
        onchain: loadJSON('onchain.json'),
        globalMacro: loadJSON('global-macro.json'),
    };

    const availableSources = Object.entries(sources).filter(([, v]) => v !== null).map(([k]) => k);
    console.log(`  📊 Sources chargées : ${availableSources.join(', ')} (${availableSources.length}/9)`);

    if (availableSources.length === 0) {
        console.error('  ❌ Aucune source de données trouvée');
        process.exit(1);
    }

    // 2. Construire le message
    const sections = [
        formatMarkets(sources.markets),
        formatCrypto(sources.crypto),
        formatFearGreed(sources.fearGreed),
        formatMacro(sources.macro),
        formatDefi(sources.defi),
        formatAlphaVantage(sources.alphaVantage),
        formatCommodities(sources.commodities),
        formatOnChain(sources.onchain),
        formatGlobalMacro(sources.globalMacro),
    ].filter(Boolean);

    const today = new Date().toISOString().split('T')[0];
    const userMessage = `# Snapshot des marchés — ${today}

${sections.join('\n\n')}

---

Produis un briefing marché quotidien en identifiant le RÉGIME DE MARCHÉ dominant (risk-on, risk-off, rotation, attentisme).
Croise systématiquement les classes d'actifs entre elles — ne pas commenter chaque segment isolément.
Cite les chiffres précis des données ci-dessus comme preuves de tes analyses.`;

    console.log(`\n  📋 Message : ${userMessage.length} caractères, ${sections.length} sections`);

    // 3. Dry-run
    if (DRY_RUN) {
        console.log('\n  ✅ Dry-run OK — données valides');
        console.log(`  📊 ${availableSources.length} sources prêtes pour le briefing`);
        sections.forEach(s => {
            const title = s.match(/^## (.+)/m)?.[1] || '(section)';
            console.log(`    ✓ ${title}`);
        });
        return;
    }

    // 4. Vérifier la clé API
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('  ❌ ANTHROPIC_API_KEY non définie');
        process.exit(1);
    }

    // 5. Appeler Claude
    console.log('\n  🤖 Appel Claude pour briefing marché...');
    try {
        const briefing = await callClaudeJSON({
            systemPrompt: MARKET_BRIEFING_SYSTEM_PROMPT,
            userMessage,
            maxTokens: 6000,
            timeoutMs: 120_000,
            temperature: 0.4,
            label: 'market-briefing',
            validate: (data) => {
                if (!data.titre) return 'titre manquant';
                if (!data.resume_executif) return 'resume_executif manquant';
                if (!data.sections?.length) return 'sections manquantes';
                return true;
            },
        });

        // 6. Enrichir et sauvegarder
        const output = {
            ...briefing,
            updated: new Date().toISOString(),
            source: 'Claude IA + multi-sources',
            sources_used: availableSources,
        };

        const outputPath = join(DATA_DIR, 'market-briefing.json');
        writeJSON(outputPath, output);

        // 7. Stats
        const stats = getUsageStats();
        console.log('\n  📈 Résultat :');
        console.log(`    Titre : ${briefing.titre}`);
        console.log(`    Sentiment : ${briefing.sentiment_global}`);
        console.log(`    Sections : ${briefing.sections?.length || 0}`);
        console.log(`    Vigilance : ${briefing.vigilance?.length || 0} points`);
        console.log(`\n  💰 Tokens : ${stats.totalInputTokens}in / ${stats.totalOutputTokens}out (~$${stats.estimatedCostUSD})`);

    } catch (err) {
        console.error(`  ❌ Erreur Claude : ${err.message}`);
        process.exit(1);
    }

    console.log('\n  ✅ Briefing marché terminé');
}

main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
