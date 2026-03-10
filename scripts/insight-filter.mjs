#!/usr/bin/env node
/**
 * Inflexion — Filtre d'insight intelligent
 *
 * Score chaque article (1-10) sur sa valeur d'insight via Claude Haiku.
 * Ne conserve que les articles qui apportent une information actionnable,
 * un angle nouveau ou un signal faible — élimine le bruit (reformulations,
 * commodity news, titres clickbait sans substance).
 *
 * Pipeline : fetch-data.mjs → insight-filter.mjs → generate-article.mjs
 *
 * Sortie : data/insights.json (articles scorés et filtrés)
 *
 * @requires ANTHROPIC_API_KEY
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { callClaudeJSON, getUsageStats } from './lib/claude-api.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// ─── Configuration ──────────────────────────────────────────

const INSIGHT_THRESHOLD = 6;        // Score minimum pour passer (1-10)
const MAX_ARTICLES_PER_CAT = 15;    // Max articles analysés par catégorie
const BATCH_SIZE = 20;              // Articles par appel Claude
const MODEL = 'claude-haiku-4-5-20251001';

const INSIGHT_SYSTEM_PROMPT = `Tu es un analyste senior chez Inflexion, cabinet d'intelligence financière et géopolitique.

Ta mission : évaluer la VALEUR D'INSIGHT de chaque article sur une échelle de 1 à 10.

## Critères de scoring

**9-10 — Signal fort / Exclusif**
- Donnée chiffrée inédite ou contre-intuitive
- Changement de régime (politique monétaire, alliance géopolitique, disruption technologique)
- Information de première main (rapport officiel, déclaration majeure)

**7-8 — Insight actionnable**
- Analyse avec angle original, pas une reformulation
- Données fraîches permettant de prendre une décision
- Connexion entre deux événements que peu font
- Signal faible avant qu'il devienne mainstream

**5-6 — Information utile mais générique**
- Couverture factuelle standard d'un événement important
- Mise à jour de données déjà connues (cours, indices)
- Bon résumé sans angle nouveau

**3-4 — Bruit éditorial**
- Reformulation d'une news déjà largement couverte
- Opinion sans données à l'appui
- Titre sensationnaliste, contenu creux
- "Marchés en hausse/baisse" sans explication structurelle

**1-2 — Bruit pur**
- Clickbait, contenu promotionnel déguisé
- Hors sujet (sport, people, divertissement infiltré)
- Information périmée ou redondante

## Règles
- Sois SÉVÈRE : la majorité des articles d'actualité sont du bruit (score 3-5)
- Un vrai insight est RARE (score ≥7 = max 20-30% des articles)
- Privilégie les données chiffrées sur les opinions
- Un article court mais avec une donnée clé > article long sans substance
- Dédoublonne mentalement : si 3 articles couvrent le même sujet, seul le meilleur a un score élevé

Réponds UNIQUEMENT en JSON valide.`;

// ─── Scoring par batch ──────────────────────────────────────

async function scoreBatch(articles) {
    const articlesText = articles
        .map((a, i) => `[${i}] ${a.title}\n    ${(a.description || '').slice(0, 200)}`)
        .join('\n\n');

    const result = await callClaudeJSON({
        systemPrompt: INSIGHT_SYSTEM_PROMPT,
        userMessage: `Score chaque article de 1 à 10 selon sa valeur d'insight.
Pour chaque article, donne : score (int 1-10), raison (1 phrase max, 15 mots max).

JSON attendu : {"scores": [{"index": 0, "score": 7, "raison": "..."}, ...]}

Articles à évaluer :

${articlesText}`,
        maxTokens: 1024,
        temperature: 0,
        label: 'insight-scoring',
        model: MODEL,
        validate: (data) => {
            if (!Array.isArray(data.scores)) return 'scores manquant';
            return true;
        },
    });

    return result.scores || [];
}

// ─── Déduplication sémantique ───────────────────────────────

function deduplicateTitles(articles) {
    const seen = new Map(); // normalized title → article
    const result = [];

    for (const a of articles) {
        const norm = (a.title || '')
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Check si un titre très similaire existe déjà
        let isDupe = false;
        for (const [seenNorm] of seen) {
            if (similarity(norm, seenNorm) > 0.7) {
                isDupe = true;
                break;
            }
        }

        if (!isDupe) {
            seen.set(norm, a);
            result.push(a);
        }
    }

    return result;
}

/** Similarité Jaccard sur les mots */
function similarity(a, b) {
    const setA = new Set(a.split(' ').filter(w => w.length > 2));
    const setB = new Set(b.split(' ').filter(w => w.length > 2));
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const w of setA) { if (setB.has(w)) intersection++; }
    return intersection / Math.max(setA.size, setB.size);
}

// ─── Pipeline principal ─────────────────────────────────────

async function main() {
    console.log('🔬 Filtre d\'insight — Inflexion\n');

    // 1. Charger les news
    const newsPath = join(DATA_DIR, 'news.json');
    if (!existsSync(newsPath)) {
        console.error('❌ data/news.json introuvable — lancer fetch-data.mjs d\'abord');
        process.exit(1);
    }

    const newsData = JSON.parse(readFileSync(newsPath, 'utf-8'));
    const categories = newsData.categories || {};

    // 2. Collecter et dédupliquer
    let totalArticles = 0;
    let totalAfterDedup = 0;
    const allArticles = []; // {category, article, originalIndex}

    for (const [cat, articles] of Object.entries(categories)) {
        const limited = articles.slice(0, MAX_ARTICLES_PER_CAT);
        totalArticles += limited.length;

        const deduped = deduplicateTitles(limited);
        totalAfterDedup += deduped.length;

        for (const a of deduped) {
            allArticles.push({ category: cat, article: a });
        }
    }

    console.log(`📥 ${totalArticles} articles chargés → ${totalAfterDedup} après dédup sémantique`);

    if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⚠ ANTHROPIC_API_KEY non définie — écriture sans scoring');
        // Sans API key, on passe tout avec score=5
        const output = {
            timestamp: new Date().toISOString(),
            threshold: INSIGHT_THRESHOLD,
            total_analyzed: totalAfterDedup,
            total_retained: totalAfterDedup,
            categories: {}
        };
        for (const { category, article } of allArticles) {
            if (!output.categories[category]) output.categories[category] = [];
            output.categories[category].push({ ...article, insight_score: 5, insight_raison: 'non scoré (pas de clé API)' });
        }
        writeJSON(join(DATA_DIR, 'insights.json'), output);
        return;
    }

    // 3. Scorer par batch
    console.log(`\n🤖 Scoring insight via Claude Haiku (${Math.ceil(allArticles.length / BATCH_SIZE)} batch(es))...\n`);

    const scoredArticles = [];
    for (let i = 0; i < allArticles.length; i += BATCH_SIZE) {
        const batch = allArticles.slice(i, i + BATCH_SIZE);
        const batchArticles = batch.map(b => b.article);

        try {
            const scores = await scoreBatch(batchArticles);
            for (const s of scores) {
                if (s.index >= 0 && s.index < batch.length) {
                    scoredArticles.push({
                        category: batch[s.index].category,
                        article: {
                            ...batch[s.index].article,
                            insight_score: s.score,
                            insight_raison: s.raison || ''
                        }
                    });
                }
            }
            console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1} : ${scores.length} articles scorés`);
        } catch (err) {
            console.warn(`  ⚠ Batch échoué : ${err.message}`);
            // Fallback : score 5 pour le batch
            for (const b of batch) {
                scoredArticles.push({
                    category: b.category,
                    article: { ...b.article, insight_score: 5, insight_raison: 'scoring échoué' }
                });
            }
        }

        // Rate limit entre les batches
        if (i + BATCH_SIZE < allArticles.length) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    // 4. Filtrer par seuil
    const retained = scoredArticles.filter(s => s.article.insight_score >= INSIGHT_THRESHOLD);
    const rejected = scoredArticles.filter(s => s.article.insight_score < INSIGHT_THRESHOLD);

    // 5. Construire la sortie
    const output = {
        timestamp: new Date().toISOString(),
        threshold: INSIGHT_THRESHOLD,
        total_analyzed: scoredArticles.length,
        total_retained: retained.length,
        total_rejected: rejected.length,
        avg_score: +(scoredArticles.reduce((s, a) => s + a.article.insight_score, 0) / scoredArticles.length).toFixed(1),
        categories: {},
        score_distribution: {}
    };

    // Distribution des scores
    for (let s = 1; s <= 10; s++) {
        output.score_distribution[s] = scoredArticles.filter(a => a.article.insight_score === s).length;
    }

    // Articles retenus par catégorie (triés par score desc)
    for (const { category, article } of retained) {
        if (!output.categories[category]) output.categories[category] = [];
        output.categories[category].push(article);
    }
    for (const cat of Object.keys(output.categories)) {
        output.categories[cat].sort((a, b) => b.insight_score - a.insight_score);
    }

    // Top rejetés (pour debug)
    output.top_rejected = rejected
        .sort((a, b) => b.article.insight_score - a.article.insight_score)
        .slice(0, 5)
        .map(r => ({
            title: r.article.title,
            score: r.article.insight_score,
            raison: r.article.insight_raison
        }));

    writeJSON(join(DATA_DIR, 'insights.json'), output);

    // 6. Rapport
    console.log('\n📊 Rapport insight :');
    console.log(`   Analysés : ${scoredArticles.length}`);
    console.log(`   Retenus  : ${retained.length} (seuil ≥ ${INSIGHT_THRESHOLD})`);
    console.log(`   Rejetés  : ${rejected.length}`);
    console.log(`   Score moyen : ${output.avg_score}/10`);
    console.log(`   Distribution : ${JSON.stringify(output.score_distribution)}`);

    const usage = getUsageStats();
    if (usage.totalCalls > 0) {
        console.log(`\n💰 Coût API : ~$${usage.estimatedCostUSD.toFixed(4)} (${usage.totalCalls} appels, ${usage.totalInputTokens + usage.totalOutputTokens} tokens)`);
    }
}

function writeJSON(filepath, data) {
    writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    const size = JSON.stringify(data).length;
    console.log(`\n✓ ${filepath.split('/').pop()} écrit (${(size / 1024).toFixed(1)} Ko)`);
}

main().catch(err => {
    console.error('❌ Erreur fatale :', err.message);
    process.exit(1);
});
