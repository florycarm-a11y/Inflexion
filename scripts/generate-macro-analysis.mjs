#!/usr/bin/env node
/**
 * Inflexion — Analyse macroéconomique via Claude
 *
 * Ce script :
 * 1. Lit les données macro FRED (data/macro.json) : CPI, taux Fed, PIB, chômage, etc.
 * 2. Envoie les indicateurs à Claude pour une analyse croisée
 * 3. Écrit le résultat dans data/macro-analysis.json
 *
 * Exécuté quotidiennement par GitHub Actions (après fetch-data)
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
import { MACRO_ANALYSIS_SYSTEM_PROMPT } from './lib/prompts.mjs';

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

// ─── Formatage des indicateurs ──────────────────────────────

function formatIndicator(ind) {
    const change = ind.change !== undefined ? ind.change : null;
    const changeStr = change !== null
        ? `${change > 0 ? '+' : ''}${change}${ind.change_type === 'yoy' ? '% YoY' : ind.change_type === 'pct' ? '%' : ''}`
        : '';
    return `- ${ind.label}: ${ind.value} ${ind.unit}${changeStr ? ` (${changeStr})` : ''} [${ind.date}]`;
}

// ─── Script principal ───────────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║  Inflexion — Analyse Macro (Claude)  ║');
    console.log('╚══════════════════════════════════════╝');
    if (DRY_RUN) console.log('  🏃 Mode dry-run actif\n');

    // 1. Charger les données macro
    const macroData = loadJSON('macro.json');
    if (!macroData?.indicators?.length) {
        console.error('  ❌ Aucune donnée macro trouvée (data/macro.json manquant ou vide)');
        process.exit(1);
    }

    console.log(`  📊 ${macroData.indicators.length} indicateurs FRED chargés`);
    console.log(`  📅 Dernière mise à jour : ${macroData.updated}`);

    // 2. Préparer le message utilisateur
    const indicatorsText = macroData.indicators.map(formatIndicator).join('\n');
    const userMessage = `Voici les derniers indicateurs macroéconomiques US (source: FRED, Federal Reserve Economic Data) :

${indicatorsText}

Date de mise à jour : ${macroData.updated}

Analyse ces indicateurs et produis un briefing macroéconomique structuré.`;

    console.log('\n  📋 Indicateurs envoyés :');
    console.log(indicatorsText.split('\n').map(l => '    ' + l).join('\n'));

    // 3. Dry-run : valider et sortir
    if (DRY_RUN) {
        console.log('\n  ✅ Dry-run OK — données valides, Claude non appelé');
        console.log(`  📊 ${macroData.indicators.length} indicateurs prêts pour l'analyse`);
        return;
    }

    // 4. Vérifier la clé API
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('  ❌ ANTHROPIC_API_KEY non définie');
        process.exit(1);
    }

    // 5. Appeler Claude
    console.log('\n  🤖 Appel Claude pour analyse macro...');
    try {
        const analysis = await callClaudeJSON({
            systemPrompt: MACRO_ANALYSIS_SYSTEM_PROMPT,
            userMessage,
            maxTokens: 4096,
            temperature: 0.3,
            label: 'macro-analysis',
            validate: (data) => {
                if (!data.titre) return 'titre manquant';
                if (!data.analyse) return 'analyse manquante';
                if (data.score_risque === undefined) return 'score_risque manquant';
                return true;
            },
        });

        // 6. Enrichir et sauvegarder
        const output = {
            ...analysis,
            updated: new Date().toISOString(),
            source: 'Claude IA + FRED',
            indicators_count: macroData.indicators.length,
        };

        const outputPath = join(DATA_DIR, 'macro-analysis.json');
        writeJSON(outputPath, output);

        // 7. Stats
        const stats = getUsageStats();
        console.log('\n  📈 Résultat :');
        console.log(`    Phase cycle : ${analysis.phase_cycle}`);
        console.log(`    Politique monétaire : ${analysis.politique_monetaire}`);
        console.log(`    Tendance inflation : ${analysis.tendance_inflation}`);
        console.log(`    Score risque : ${analysis.score_risque}/10`);
        console.log(`\n  💰 Tokens : ${stats.totalInputTokens}in / ${stats.totalOutputTokens}out (~$${stats.estimatedCostUSD})`);

    } catch (err) {
        console.error(`  ❌ Erreur Claude : ${err.message}`);
        process.exit(1);
    }

    console.log('\n  ✅ Analyse macro terminée');
}

main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
