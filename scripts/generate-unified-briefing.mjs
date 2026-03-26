#!/usr/bin/env node
/**
 * Inflexion — Pipeline de briefing unifié
 *
 * Orchestre en séquence :
 *   1. Analyse marché (sentiment + alertes + macro + market-briefing) — 2 appels Haiku
 *   2. Archivage du briefing précédent dans data/briefing-history/
 *   3. Briefing stratégique géopolitique + marchés — 1 appel Sonnet (lundi) ou Haiku
 *
 * Remplace les deux pipelines séparés (generate-daily-briefing + analyze-sentiment)
 * en un seul flux quotidien. Le briefing stratégique bénéficie automatiquement
 * du sentiment frais car il lit sentiment.json (écrit en phase 1).
 *
 * Sorties :
 *   - data/sentiment.json
 *   - data/alerts.json
 *   - data/macro-analysis.json
 *   - data/market-briefing.json
 *   - data/daily-briefing.json
 *   - data/briefing-history/briefing-YYYY-MM-DD.json (archive)
 *
 * Options :
 *   --dry-run        Valide les données sans appeler Claude
 *   --skip-market    Ne lance que le briefing stratégique (skip phases 1-2)
 *
 * @requires ANTHROPIC_API_KEY dans les variables d'environnement
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const HISTORY_DIR = join(DATA_DIR, 'briefing-history');
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_MARKET = process.argv.includes('--skip-market');

// Nombre max d'archives conservées (90 jours)
const MAX_ARCHIVE_DAYS = 90;

// ─── Archivage ──────────────────────────────────────────────

function archivePreviousBriefing() {
    const briefingPath = join(DATA_DIR, 'daily-briefing.json');
    if (!existsSync(briefingPath)) {
        console.log('  📦 Pas de briefing précédent à archiver');
        return;
    }

    let existing;
    try {
        existing = JSON.parse(readFileSync(briefingPath, 'utf-8'));
    } catch {
        console.warn('  ⚠ Briefing précédent illisible — archivage ignoré');
        return;
    }

    const dateStr = existing.date || new Date().toISOString().split('T')[0];
    if (!existsSync(HISTORY_DIR)) {
        mkdirSync(HISTORY_DIR, { recursive: true });
    }

    const archivePath = join(HISTORY_DIR, `briefing-${dateStr}.json`);
    if (existsSync(archivePath)) {
        console.log(`  📦 Archive briefing-${dateStr}.json existe déjà — skip`);
        return;
    }

    copyFileSync(briefingPath, archivePath);
    console.log(`  📦 Briefing archivé : briefing-${dateStr}.json`);
}

function cleanupOldArchives() {
    if (!existsSync(HISTORY_DIR)) return;

    try {
        const entries = readdirSync(HISTORY_DIR)
            .filter(f => f.startsWith('briefing-') && f.endsWith('.json'))
            .sort();

        if (entries.length > MAX_ARCHIVE_DAYS) {
            const toDelete = entries.slice(0, entries.length - MAX_ARCHIVE_DAYS);
            for (const f of toDelete) {
                unlinkSync(join(HISTORY_DIR, f));
                console.log(`  🗑️  Archive supprimée : ${f}`);
            }
        }
    } catch (err) {
        console.warn(`  ⚠ Nettoyage archives échoué : ${err.message}`);
    }
}

// ─── Pipeline principal ─────────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  Inflexion — Pipeline de briefing unifié         ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`  📅 ${new Date().toISOString()}`);
    if (DRY_RUN) console.log('  🏃 Mode dry-run actif');
    if (SKIP_MARKET) console.log('  ⏭️  Skip analyse marché (--skip-market)');

    if (!process.env.ANTHROPIC_API_KEY && !DRY_RUN) {
        console.error('❌ ANTHROPIC_API_KEY non définie');
        process.exit(1);
    }

    const startTime = Date.now();

    // ── Phase 1-2 : Analyse marché (sentiment + alertes + macro + briefing) ──
    if (!SKIP_MARKET) {
        console.log('\n' + '═'.repeat(50));
        console.log('  PHASE 1-2 : Analyse de marché consolidée');
        console.log('═'.repeat(50));

        const {
            loadAllSources,
            runSentimentAndAlerts,
            runMacroAndBriefing,
            formatMarketContext,
            detectSignificantChanges,
            runAllEnrichments,
        } = await import('./generate-market-analysis.mjs');

        const sources = loadAllSources();

        if (DRY_RUN) {
            const changes = detectSignificantChanges(sources);
            const enrichments = runAllEnrichments(sources);
            console.log(`\n🔍 [DRY-RUN] ${changes.length} mouvement(s) + ${enrichments.signals.length} signal(aux) enrichi(s)`);
            const sections = formatMarketContext(sources);
            console.log(`🔍 [DRY-RUN] ${sections.length + enrichments.sections.length} sections de marché`);
            console.log(`🔍 [DRY-RUN] Régime : ${enrichments.interconnexion?.regime || 'N/A'}`);
        } else {
            await runSentimentAndAlerts(sources);
            await runMacroAndBriefing(sources);
        }

        console.log('\n  ✅ Analyse marché terminée');
    }

    // ── Phase 2.5 : Archivage du briefing précédent ──
    console.log('\n' + '═'.repeat(50));
    console.log('  ARCHIVAGE du briefing précédent');
    console.log('═'.repeat(50));

    archivePreviousBriefing();
    cleanupOldArchives();

    // ── Phase 3 : Briefing stratégique ──
    console.log('\n' + '═'.repeat(50));
    console.log('  PHASE 3 : Briefing stratégique');
    console.log('═'.repeat(50));

    const { generateStrategicBriefing } = await import('./generate-daily-briefing.mjs');
    await generateStrategicBriefing();

    // ── Résumé final ──
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  Pipeline unifié terminé                          ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`  ⏱️  Durée totale : ${elapsed}s`);
    console.log(`  📁 Fichiers produits :`);
    if (!SKIP_MARKET) {
        console.log('     - data/sentiment.json');
        console.log('     - data/alerts.json');
        console.log('     - data/macro-analysis.json');
        console.log('     - data/market-briefing.json');
    }
    console.log('     - data/daily-briefing.json');
    console.log('     - data/briefing-history/briefing-*.json (archive)');
}

main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
