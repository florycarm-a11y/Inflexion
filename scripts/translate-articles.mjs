#!/usr/bin/env node
/**
 * Inflexion — Traduction automatique EN→FR des articles
 *
 * Ce script :
 * 1. Lit data/news.json
 * 2. Identifie les articles en anglais (lang === 'en' et non traduits)
 * 3. Les traduit par lots via Claude API
 * 4. Sauvegarde les originaux dans title_en/description_en
 * 5. Réécrit data/news.json avec les traductions
 *
 * Exécuté quotidiennement par GitHub Actions avant la génération d'article
 *
 * @requires ANTHROPIC_API_KEY dans les variables d'environnement
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { callClaudeJSON, getUsageStats } from './lib/claude-api.mjs';
import { TRANSLATION_SYSTEM_PROMPT } from './lib/prompts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DRY_RUN = process.argv.includes('--dry-run');

/** Nombre d'articles par lot (batch) envoyé à Claude */
const BATCH_SIZE = 6;

// ─── Utilitaires ─────────────────────────────────────────────

function writeJSON(filepath, data) {
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`  📝 ${filepath.split('/').pop()} sauvegardé`);
}

// ─── Traduction par lot ──────────────────────────────────────

/**
 * Traduit un lot d'articles EN→FR via Claude.
 * @param {Array<{index: number, title: string, description: string}>} batch
 * @returns {Promise<Array<{index: number, title_fr: string, description_fr: string}>>}
 */
async function translateBatch(batch) {
    const articlesText = batch
        .map(a => `[${a.index}] Titre: ${a.title}\nDescription: ${a.description || 'N/A'}`)
        .join('\n\n');

    const userMessage = `Traduis ces ${batch.length} articles de l'anglais vers le français :\n\n${articlesText}`;

    const result = await callClaudeJSON({
        systemPrompt: TRANSLATION_SYSTEM_PROMPT,
        userMessage,
        maxTokens: 1500,
        temperature: 0.3,
        label: 'translate',
        validate: (data) => {
            if (!Array.isArray(data.traductions)) return 'Champ "traductions" manquant ou invalide';
            return true;
        },
    });

    return result.traductions;
}

// ─── Exécution principale ────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  Inflexion — Traduction EN→FR');
    console.log(`  ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════');

    // Vérifier la clé API (sauf en dry-run)
    if (!process.env.ANTHROPIC_API_KEY && !DRY_RUN) {
        console.log('⚠ ANTHROPIC_API_KEY non définie — traduction ignorée');
        return;
    }

    // Lire news.json
    const newsPath = join(DATA_DIR, 'news.json');
    if (!existsSync(newsPath)) {
        console.log('⚠ data/news.json introuvable — rien à traduire');
        return;
    }

    let newsData;
    try {
        newsData = JSON.parse(readFileSync(newsPath, 'utf-8'));
    } catch (err) {
        console.error(`✗ Erreur lecture news.json: ${err.message}`);
        process.exit(1);
    }

    // Charger aussi newsapi.json si disponible
    const newsapiPath = join(DATA_DIR, 'newsapi.json');
    let newsapiData = null;
    if (existsSync(newsapiPath)) {
        try {
            newsapiData = JSON.parse(readFileSync(newsapiPath, 'utf-8'));
        } catch (err) {
            console.warn(`  ⚠ Erreur lecture newsapi.json: ${err.message}`);
        }
    }

    // Collecter les articles en anglais non traduits (news.json + newsapi.json)
    const articlesToTranslate = [];
    const articleRefs = []; // Références vers les objets originaux pour mise à jour

    for (const [category, articles] of Object.entries(newsData.categories || {})) {
        for (const article of articles) {
            if (article.lang === 'en' && !article.translated) {
                const index = articlesToTranslate.length;
                articlesToTranslate.push({
                    index,
                    title: article.title,
                    description: article.description || '',
                });
                articleRefs.push(article);
            }
        }
    }

    // Ajouter les articles NewsAPI (tous en anglais)
    if (newsapiData?.categories) {
        for (const [category, articles] of Object.entries(newsapiData.categories)) {
            for (const article of articles) {
                if (!article.translated) {
                    const index = articlesToTranslate.length;
                    articlesToTranslate.push({
                        index,
                        title: article.title,
                        description: article.description || '',
                    });
                    articleRefs.push(article);
                }
            }
        }
    }

    if (articlesToTranslate.length === 0) {
        console.log('\n✓ Aucun article en anglais à traduire');
        return;
    }

    console.log(`\n🌐 ${articlesToTranslate.length} articles en anglais à traduire`);

    if (DRY_RUN) {
        console.log('\n🔍 [DRY-RUN] Articles qui seraient traduits :');
        for (const a of articlesToTranslate) {
            console.log(`  [${a.index}] ${a.title.slice(0, 80)}`);
        }
        console.log(`\n✓ [DRY-RUN] ${articlesToTranslate.length} article(s) — aucune traduction effectuée`);
        return;
    }

    // Traduction par lots
    let translatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < articlesToTranslate.length; i += BATCH_SIZE) {
        const batch = articlesToTranslate.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(articlesToTranslate.length / BATCH_SIZE);

        console.log(`  📦 Lot ${batchNum}/${totalBatches} (${batch.length} articles)...`);

        try {
            const translations = await translateBatch(batch);

            // Appliquer les traductions
            for (const t of translations) {
                if (t.index >= 0 && t.index < articleRefs.length) {
                    const article = articleRefs[t.index];

                    // Sauvegarder l'original
                    article.title_en = article.title;
                    article.description_en = article.description;

                    // Appliquer la traduction
                    if (t.title_fr) article.title = t.title_fr;
                    if (t.description_fr) article.description = t.description_fr;

                    // Marquer comme traduit
                    article.lang = 'fr';
                    article.translated = true;
                    translatedCount++;
                }
            }
        } catch (err) {
            console.error(`  ✗ Erreur lot ${batchNum}: ${err.message}`);
            errorCount += batch.length;
        }
    }

    // Backup avant écriture (protection contre corruption)
    const backupPath = newsPath.replace('.json', '.backup.json');
    writeJSON(backupPath, JSON.parse(readFileSync(newsPath, 'utf-8')));

    // Sauvegarder news.json mis à jour
    writeJSON(newsPath, newsData);

    // Sauvegarder newsapi.json si modifié
    if (newsapiData) {
        writeJSON(newsapiPath, newsapiData);
    }

    // Résumé
    const stats = getUsageStats();
    console.log('\n═══════════════════════════════════════');
    console.log('  Résumé :');
    console.log(`  ✅ ${translatedCount} articles traduits`);
    if (errorCount > 0) console.log(`  ⚠️  ${errorCount} articles en erreur`);
    console.log(`  💰 Claude API : ${stats.totalCalls} appels, ~$${stats.estimatedCostUSD}`);
    console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
