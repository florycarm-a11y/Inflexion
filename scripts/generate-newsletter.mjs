#!/usr/bin/env node
/**
 * Inflexion — Génération de la newsletter hebdomadaire
 *
 * Ce script :
 * 1. Charge les articles des 7 derniers jours (data/articles/YYYY-MM-DD.json)
 * 2. Charge les données contextuelles (sentiment, crypto, marchés, macro)
 * 3. Génère une newsletter de synthèse hebdomadaire via Claude
 * 4. Écrit le résultat dans data/newsletter.json
 *
 * Exécuté chaque dimanche à 10h UTC par GitHub Actions
 *
 * @requires ANTHROPIC_API_KEY dans les variables d'environnement
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { callClaudeJSON, getUsageStats } from './lib/claude-api.mjs';
import { NEWSLETTER_SYSTEM_PROMPT } from './lib/prompts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const ARTICLES_DIR = join(DATA_DIR, 'articles');

// ─── Utilitaires ─────────────────────────────────────────────

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

/**
 * Retourne le numéro de semaine ISO (YYYY-Www).
 * @param {Date} date
 * @returns {string}
 */
function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ─── Chargement des articles de la semaine ───────────────────

/**
 * Charge les articles des N derniers jours.
 * @param {number} days - Nombre de jours à couvrir
 * @returns {Array<{date: string, article: Object}>}
 */
function loadRecentArticles(days = 7) {
    if (!existsSync(ARTICLES_DIR)) return [];

    const files = readdirSync(ARTICLES_DIR)
        .filter(f => f.endsWith('.json') && f !== '.gitkeep')
        .sort()
        .reverse()
        .slice(0, days);

    return files.map(f => {
        try {
            const article = JSON.parse(readFileSync(join(ARTICLES_DIR, f), 'utf-8'));
            return { date: f.replace('.json', ''), article };
        } catch {
            return null;
        }
    }).filter(Boolean);
}

// ─── Construction du contexte ────────────────────────────────

/**
 * Construit le message utilisateur avec tout le contexte de la semaine.
 * @param {Array} articles - Articles de la semaine
 * @param {Object} contextData - Données contextuelles (sentiment, crypto, etc.)
 * @returns {string}
 */
function buildUserMessage(articles, contextData) {
    const parts = [];

    // Résumé des articles quotidiens
    parts.push(`## Articles de la semaine (${articles.length} jour(s))\n`);
    for (const { date, article } of articles) {
        parts.push(`### ${date}`);
        parts.push(`**${article.titre}**`);
        if (article.sous_titre) parts.push(article.sous_titre);
        if (article.points_cles?.length) {
            parts.push('Points clés :');
            for (const p of article.points_cles) {
                parts.push(`- ${p}`);
            }
        }
        parts.push('');
    }

    // Données de sentiment
    if (contextData.sentiment?.global) {
        const s = contextData.sentiment;
        parts.push(`\n## Sentiment de marché`);
        parts.push(`Score global : ${s.global.score > 0 ? '+' : ''}${s.global.score} (${s.global.tendance})`);
        if (s.categories) {
            for (const [rubrique, data] of Object.entries(s.categories)) {
                parts.push(`- ${rubrique}: ${data.score > 0 ? '+' : ''}${data.score} (${data.tendance})`);
            }
        }
        parts.push('');
    }

    // Données crypto
    if (contextData.crypto?.prices?.length) {
        parts.push(`\n## Données crypto`);
        const top5 = contextData.crypto.prices.slice(0, 5);
        for (const coin of top5) {
            parts.push(`- ${coin.name} (${coin.symbol}): $${coin.price.toLocaleString('en-US')} (24h: ${coin.change_24h > 0 ? '+' : ''}${coin.change_24h?.toFixed(2)}%, 7j: ${coin.change_7d > 0 ? '+' : ''}${coin.change_7d?.toFixed(2)}%)`);
        }
        parts.push('');
    }

    // Données marchés
    if (contextData.markets?.quotes?.length) {
        parts.push(`\n## Données marchés`);
        for (const q of contextData.markets.quotes) {
            parts.push(`- ${q.name} (${q.symbol}): $${q.price?.toFixed(2)} (${q.change > 0 ? '+' : ''}${q.change?.toFixed(2)}%)`);
        }
        parts.push('');
    }

    // Données macro
    if (contextData.macro?.indicators?.length) {
        parts.push(`\n## Indicateurs macroéconomiques`);
        for (const ind of contextData.macro.indicators.slice(0, 6)) {
            parts.push(`- ${ind.label}: ${ind.value} ${ind.unit} (variation: ${ind.change > 0 ? '+' : ''}${ind.change})`);
        }
        parts.push('');
    }

    // Fear & Greed
    if (contextData.fearGreed?.current) {
        const fng = contextData.fearGreed;
        parts.push(`\n## Fear & Greed Index`);
        parts.push(`Score actuel: ${fng.current.value} (${fng.current.label})`);
        if (fng.changes?.week) parts.push(`Variation 7j: ${fng.changes.week > 0 ? '+' : ''}${fng.changes.week} pts`);
        parts.push('');
    }

    parts.push(`\nRédige la newsletter hebdomadaire d'Inflexion pour la semaine se terminant le ${today()}.`);
    parts.push('Réponds UNIQUEMENT en JSON valide, sans commentaire avant ou après.');

    return parts.join('\n');
}

// ─── Exécution principale ────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  Inflexion — Newsletter hebdomadaire');
    console.log(`  ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════');

    // Vérifier la clé API
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⚠ ANTHROPIC_API_KEY non définie — newsletter ignorée');
        return;
    }

    // Charger les articles de la semaine
    const articles = loadRecentArticles(7);
    console.log(`\n📰 ${articles.length} article(s) quotidien(s) trouvé(s)`);

    if (articles.length === 0) {
        console.log('⚠ Aucun article disponible — newsletter impossible');
        return;
    }

    // Charger les données contextuelles
    const contextData = {
        sentiment: loadJSON('sentiment.json'),
        crypto: loadJSON('crypto.json'),
        markets: loadJSON('markets.json'),
        macro: loadJSON('macro.json'),
        fearGreed: loadJSON('fear-greed.json'),
    };

    console.log(`📊 Contexte : sentiment=${contextData.sentiment ? '✓' : '✗'} crypto=${contextData.crypto ? '✓' : '✗'} marchés=${contextData.markets ? '✓' : '✗'} macro=${contextData.macro ? '✓' : '✗'} FNG=${contextData.fearGreed ? '✓' : '✗'}`);

    // Construire le message
    const userMessage = buildUserMessage(articles, contextData);

    // Générer la newsletter
    console.log('\n✍️  Génération de la newsletter...');

    try {
        const newsletter = await callClaudeJSON({
            systemPrompt: NEWSLETTER_SYSTEM_PROMPT,
            userMessage,
            maxTokens: 3000,
            label: 'newsletter',
            validate: (data) => {
                if (!data.titre_semaine) return 'Champ "titre_semaine" manquant';
                if (!data.editorial) return 'Champ "editorial" manquant';
                return true;
            },
        });

        // Calculer la période
        const dates = articles.map(a => a.date).sort();
        const periode = {
            debut: dates[0],
            fin: dates[dates.length - 1],
        };

        // Construire l'objet final
        const newsletterData = {
            updated: new Date().toISOString(),
            semaine: getISOWeek(new Date()),
            periode,
            ...newsletter,
            articles_source: dates,
            model: 'claude-haiku-4-5-20251001',
            usage: getUsageStats(),
        };

        writeJSON(join(DATA_DIR, 'newsletter.json'), newsletterData);

        console.log(`\n✅ Newsletter générée : "${newsletter.titre_semaine}"`);
        if (newsletter.faits_marquants?.length) {
            console.log(`  📌 ${newsletter.faits_marquants.length} fait(s) marquant(s)`);
        }
    } catch (err) {
        console.error(`\n✗ Erreur génération newsletter: ${err.message}`);
        process.exit(1);
    }

    // Résumé
    const stats = getUsageStats();
    console.log('\n═══════════════════════════════════════');
    console.log('  Résumé :');
    console.log(`  ✅ Newsletter générée`);
    console.log(`  📰 Basée sur ${articles.length} article(s) quotidien(s)`);
    console.log(`  💰 Claude API : ${stats.totalCalls} appels, ~$${stats.estimatedCostUSD}`);
    console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
