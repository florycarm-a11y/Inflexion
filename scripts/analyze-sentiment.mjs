#!/usr/bin/env node
/**
 * Inflexion — Analyse de sentiment par IA
 *
 * Ce script :
 * 1. Lit les titres d'actualités depuis data/news.json
 * 2. Envoie les titres par rubrique à Claude pour analyse de sentiment
 * 3. Calcule un score global pondéré par la confidence
 * 4. Gère un historique (30 jours max)
 * 5. Écrit le résultat dans data/sentiment.json
 *
 * Exécuté toutes les 6h par GitHub Actions (30min après fetch-data)
 *
 * @requires ANTHROPIC_API_KEY dans les variables d'environnement
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { callClaudeJSON, getUsageStats } from './lib/claude-api.mjs';
import { SENTIMENT_SYSTEM_PROMPT } from './lib/prompts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DRY_RUN = process.argv.includes('--dry-run');

/** Max titres envoyés par rubrique à Claude */
const MAX_TITLES_PER_CATEGORY = 20;

/** Nombre max de jours d'historique conservés */
const MAX_HISTORY_DAYS = 30;

/** Mapping des catégories news.json → rubriques Inflexion */
const CATEGORY_MAP = {
    geopolitics: 'geopolitique',
    markets: 'marches',
    crypto: 'crypto',
    commodities: 'matieres_premieres',
    ai_tech: 'ai_tech',
};

// ─── Utilitaires ─────────────────────────────────────────────

function writeJSON(filepath, data) {
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`  📝 ${filepath.split('/').pop()} sauvegardé`);
}

function today() {
    return new Date().toISOString().split('T')[0];
}

// ─── Analyse de sentiment par rubrique ───────────────────────

/**
 * Analyse le sentiment pour une rubrique donnée.
 * @param {string} rubrique - Nom de la rubrique
 * @param {Array<Object>} articles - Articles de la rubrique
 * @returns {Promise<Object>} { score, confidence, tendance, resume, signaux_cles }
 */
async function analyzeSentimentForCategory(rubrique, articles) {
    const titles = articles
        .slice(0, MAX_TITLES_PER_CATEGORY)
        .map(a => `- ${a.title}`)
        .join('\n');

    const userMessage = `Rubrique : ${rubrique}
Date : ${today()}
Nombre d'articles : ${articles.length}

Titres :
${titles}

Analyse de sentiment (JSON) :`;

    return callClaudeJSON({
        systemPrompt: SENTIMENT_SYSTEM_PROMPT,
        userMessage,
        maxTokens: 512,
        temperature: 0.3,
        label: `sentiment-${rubrique}`,
        validate: (data) => {
            if (typeof data.score !== 'number' || data.score < -1 || data.score > 1)
                return 'Score invalide (doit être entre -1 et 1)';
            if (!data.tendance)
                return 'Champ "tendance" manquant';
            return true;
        },
    });
}

// ─── Calcul du score global ──────────────────────────────────

/**
 * Calcule le score global à partir des scores par catégorie.
 * Moyenne pondérée par la confidence de chaque catégorie.
 * @param {Object} categories - { rubrique: { score, confidence, ... } }
 * @returns {Object} { score, tendance, resume }
 */
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
        // Vérifier si mixte (certaines catégories haussières, d'autres baissières)
        const scores = Object.values(categories).map(c => c.score);
        const hasPositive = scores.some(s => s > 0.2);
        const hasNegative = scores.some(s => s < -0.2);
        if (hasPositive && hasNegative) tendance = 'mixte';
    }

    // Résumé des catégories dominantes
    const sorted = Object.entries(categories)
        .sort(([, a], [, b]) => Math.abs(b.score) - Math.abs(a.score));
    const dominant = sorted[0];
    const resume = dominant
        ? `Le sentiment global est ${tendance} (${globalScore > 0 ? '+' : ''}${globalScore}), dominé par la rubrique ${dominant[0]} (${dominant[1].tendance}).`
        : 'Données insuffisantes pour une analyse globale.';

    return { score: globalScore, tendance, resume };
}

// ─── Gestion de l'historique ─────────────────────────────────

/**
 * Ajoute l'entrée du jour à l'historique et tronque à MAX_HISTORY_DAYS.
 * @param {Array} existingHistory - Historique existant
 * @param {number} globalScore - Score global du jour
 * @param {Object} categories - Scores par catégorie
 * @returns {Array} Historique mis à jour
 */
function updateHistory(existingHistory, globalScore, categories) {
    const todayStr = today();
    const entry = {
        date: todayStr,
        global: globalScore,
    };

    for (const [rubrique, data] of Object.entries(categories)) {
        entry[rubrique] = data.score;
    }

    // Supprimer l'entrée du jour si elle existe déjà
    const history = (existingHistory || []).filter(h => h.date !== todayStr);
    history.push(entry);

    // Tronquer à MAX_HISTORY_DAYS
    return history.slice(-MAX_HISTORY_DAYS);
}

// ─── Exécution principale ────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  Inflexion — Analyse de sentiment');
    console.log(`  ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════');

    // Vérifier la clé API (sauf en dry-run)
    if (!process.env.ANTHROPIC_API_KEY && !DRY_RUN) {
        console.log('⚠ ANTHROPIC_API_KEY non définie — analyse ignorée');
        return;
    }

    // Lire news.json
    const newsPath = join(DATA_DIR, 'news.json');
    if (!existsSync(newsPath)) {
        console.log('⚠ data/news.json introuvable — rien à analyser');
        return;
    }

    let newsData;
    try {
        newsData = JSON.parse(readFileSync(newsPath, 'utf-8'));
    } catch (err) {
        console.error(`✗ Erreur lecture news.json: ${err.message}`);
        process.exit(1);
    }

    // Lire l'historique existant
    const sentimentPath = join(DATA_DIR, 'sentiment.json');
    let existingData = null;
    if (existsSync(sentimentPath)) {
        try {
            existingData = JSON.parse(readFileSync(sentimentPath, 'utf-8'));
        } catch { /* ignorer */ }
    }

    // Collecter les articles par rubrique
    const articlesByRubrique = {};
    for (const [category, articles] of Object.entries(newsData.categories || {})) {
        const rubrique = CATEGORY_MAP[category];
        if (!rubrique) continue;
        if (!articlesByRubrique[rubrique]) articlesByRubrique[rubrique] = [];
        articlesByRubrique[rubrique].push(...articles);
    }

    if (DRY_RUN) {
        console.log('\n🔍 [DRY-RUN] Rubriques qui seraient analysées :');
        for (const [rubrique, articles] of Object.entries(articlesByRubrique)) {
            console.log(`  • ${rubrique}: ${articles.length} articles (${articles.slice(0, 3).map(a => a.title.slice(0, 50)).join(', ')}...)`);
        }
        console.log(`\n✓ [DRY-RUN] ${Object.keys(articlesByRubrique).length} rubrique(s) — aucun appel API ni fichier écrit`);
        return;
    }

    // Analyser le sentiment par rubrique
    const categories = {};
    let analyzedCount = 0;

    for (const [rubrique, articles] of Object.entries(articlesByRubrique)) {
        if (articles.length === 0) continue;

        console.log(`\n📊 ${rubrique} (${articles.length} articles)...`);

        try {
            const result = await analyzeSentimentForCategory(rubrique, articles);
            categories[rubrique] = result;
            analyzedCount++;

            const arrow = result.score > 0 ? '↑' : result.score < 0 ? '↓' : '→';
            console.log(`  ${arrow} Score: ${result.score > 0 ? '+' : ''}${result.score} (${result.tendance})`);
        } catch (err) {
            console.error(`  ✗ Erreur ${rubrique}: ${err.message}`);
        }
    }

    if (analyzedCount === 0) {
        console.log('\n⚠ Aucune rubrique analysée — abandon');
        return;
    }

    // Calculer le score global
    const global = computeGlobalScore(categories);
    console.log(`\n🎯 Score global: ${global.score > 0 ? '+' : ''}${global.score} (${global.tendance})`);

    // Mettre à jour l'historique
    const historique = updateHistory(
        existingData?.historique,
        global.score,
        categories
    );

    // Construire et sauvegarder le résultat
    const sentimentData = {
        updated: new Date().toISOString(),
        date: today(),
        global,
        categories,
        historique,
        model: 'claude-haiku-4-5-20251001',
        usage: getUsageStats(),
    };

    writeJSON(sentimentPath, sentimentData);

    // Résumé
    const stats = getUsageStats();
    console.log('\n═══════════════════════════════════════');
    console.log('  Résumé :');
    console.log(`  ✅ ${analyzedCount} rubriques analysées`);
    console.log(`  📈 Score global: ${global.score > 0 ? '+' : ''}${global.score} (${global.tendance})`);
    console.log(`  📚 ${historique.length} jours d'historique`);
    console.log(`  💰 Claude API : ${stats.totalCalls} appels, ~$${stats.estimatedCostUSD}`);
    console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
