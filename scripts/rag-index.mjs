#!/usr/bin/env node
/**
 * Inflexion — RAG Indexation
 *
 * Ce script :
 * 1. Charge les articles récents (data/news.json + data/newsapi.json)
 * 2. Charge le dernier briefing (data/daily-briefing.json)
 * 3. Génère des embeddings locaux (all-MiniLM-L6-v2 via transformers.js)
 * 4. Stocke les vecteurs dans data/rag/ (articles.json + briefings.json)
 *
 * Exécuté après fetch-data.mjs et après generate-daily-briefing.mjs
 * par GitHub Actions.
 *
 * Options :
 *   --dry-run    Valider sans générer d'embeddings
 *   --articles   Indexer uniquement les articles
 *   --briefing   Indexer uniquement le briefing
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { embedText, embedBatch, initEmbeddingsCache, saveEmbeddingsCache, getCacheStats } from './lib/embeddings.mjs';
import { RAGStore } from './lib/rag-store.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const RAG_DIR = join(DATA_DIR, 'rag');
const CACHE_PATH = join(DATA_DIR, 'embeddings-cache.json');

const DRY_RUN = process.argv.includes('--dry-run');
const ONLY_ARTICLES = process.argv.includes('--articles');
const ONLY_BRIEFING = process.argv.includes('--briefing');

// ─── Utilitaires ────────────────────────────────────────────

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
 * Génère un ID unique pour un article basé sur son titre + source.
 */
function articleId(article) {
    const base = `${article.title || ''}_${article.source || ''}`.toLowerCase().replace(/\s+/g, '_');
    // Hash simple pour garder des IDs courts
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
        hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
    }
    return `art_${Math.abs(hash).toString(36)}`;
}

// ─── 1. Extraction des articles ─────────────────────────────

function extractArticles() {
    console.log('\n📰 Extraction des articles...');
    const articles = [];
    const todayStr = today();

    // Charger news.json
    const news = loadJSON('news.json');
    if (news?.categories) {
        for (const [category, items] of Object.entries(news.categories)) {
            for (const item of items) {
                articles.push({
                    id: articleId(item),
                    title: item.title || '',
                    description: item.description || '',
                    source: item.source || '',
                    category,
                    rubrique: item.rubrique || category,
                    date: item.publishedAt?.split('T')[0] || todayStr,
                    url: item.url || '',
                });
            }
        }
    }

    // Charger newsapi.json
    const newsapi = loadJSON('newsapi.json');
    if (newsapi?.categories) {
        for (const [category, items] of Object.entries(newsapi.categories)) {
            for (const item of items) {
                articles.push({
                    id: articleId(item),
                    title: item.title || '',
                    description: item.description || '',
                    source: item.source || '',
                    category,
                    rubrique: item.rubrique || category,
                    date: item.publishedAt?.split('T')[0] || todayStr,
                    url: item.url || '',
                });
            }
        }
    }

    // Dédupliquer par ID
    const seen = new Set();
    const unique = articles.filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
    });

    console.log(`  ✓ ${unique.length} articles extraits (${articles.length - unique.length} doublons supprimés)`);
    return unique;
}

// ─── 2. Extraction du briefing ──────────────────────────────

function extractBriefing() {
    console.log('\n📋 Extraction du briefing...');

    const briefing = loadJSON('daily-briefing.json');
    if (!briefing?.synthese?.contenu) {
        console.log('  ⚠ Aucun briefing disponible (daily-briefing.json manquant ou invalide)');
        return null;
    }

    const todayStr = briefing.date || today();
    const signaux = briefing.signaux?.map(s => s.titre).join('. ') || '';
    const risques = briefing.risk_radar?.map(r => r.risque).join('. ') || '';

    return {
        id: `briefing_${todayStr}`,
        date: todayStr,
        titre: briefing.synthese.titre || '',
        contenu: briefing.synthese.contenu || '',
        signaux,
        risques,
        sentiment: briefing.sentiment_global || '',
        tags: briefing.tags || [],
    };
}

// ─── 3. Indexation des articles ─────────────────────────────

async function indexArticles(store) {
    const articles = extractArticles();
    if (articles.length === 0) {
        console.log('  ⚠ Aucun article à indexer');
        return 0;
    }

    // Préparer les textes pour l'embedding
    // On combine titre + description pour un embedding plus riche
    const texts = articles.map(a =>
        `${a.title}. ${a.description}`.trim().slice(0, 512)
    );

    console.log(`\n🔢 Génération des embeddings pour ${texts.length} articles...`);

    if (DRY_RUN) {
        console.log(`  [DRY-RUN] ${texts.length} embeddings seraient générés`);
        return 0;
    }

    const embeddings = await embedBatch(texts, {
        onProgress: (i, total) => {
            console.log(`  ⏳ ${i}/${total} articles vectorisés...`);
        },
    });

    // Construire les entrées pour le store
    const entries = articles.map((article, i) => ({
        id: article.id,
        text: texts[i],
        embedding: embeddings[i],
        metadata: {
            title: article.title,
            source: article.source,
            category: article.category,
            rubrique: article.rubrique,
            url: article.url,
        },
        date: article.date,
    }));

    return store.addArticles(entries);
}

// ─── 4. Indexation du briefing ──────────────────────────────

async function indexBriefing(store) {
    const briefing = extractBriefing();
    if (!briefing) return false;

    // Embedding sur le titre + signaux + risques (résumé dense du briefing)
    const text = `${briefing.titre}. ${briefing.signaux}. ${briefing.risques}`.trim().slice(0, 1024);

    console.log(`\n🔢 Génération de l'embedding pour le briefing du ${briefing.date}...`);

    if (DRY_RUN) {
        console.log(`  [DRY-RUN] Embedding du briefing serait généré`);
        return false;
    }

    const embedding = await embedText(text);

    store.addBriefing({
        id: briefing.id,
        text,
        embedding,
        metadata: {
            titre: briefing.titre,
            sentiment: briefing.sentiment,
            tags: briefing.tags,
            contenu_preview: briefing.contenu.slice(0, 300),
        },
        date: briefing.date,
    });

    console.log(`  ✓ Briefing du ${briefing.date} indexé`);
    return true;
}

// ─── Exécution principale ───────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  Inflexion — RAG Indexation');
    console.log(`  ${new Date().toISOString()}`);
    if (DRY_RUN) console.log('  [MODE DRY-RUN]');
    console.log('═══════════════════════════════════════');

    const totalStart = Date.now();

    // Initialiser le cache d'embeddings (Sprint 4)
    if (!DRY_RUN) {
        initEmbeddingsCache(CACHE_PATH);
    }

    const store = new RAGStore(RAG_DIR);

    // Afficher les stats initiales
    const statsBefore = store.getStats();
    console.log(`\n📊 Store RAG : ${statsBefore.articlesCount} articles, ${statsBefore.briefingsCount} briefings`);

    let articlesAdded = 0;
    let briefingIndexed = false;

    // Indexer les articles (sauf si --briefing seulement)
    if (!ONLY_BRIEFING) {
        const articlesStart = Date.now();
        articlesAdded = await indexArticles(store);
        const articlesElapsed = ((Date.now() - articlesStart) / 1000).toFixed(1);
        console.log(`  ⏱ Indexation articles: ${articlesElapsed}s`);
    }

    // Indexer le briefing (sauf si --articles seulement)
    if (!ONLY_ARTICLES) {
        const briefingStart = Date.now();
        briefingIndexed = await indexBriefing(store);
        const briefingElapsed = ((Date.now() - briefingStart) / 1000).toFixed(1);
        console.log(`  ⏱ Indexation briefing: ${briefingElapsed}s`);
    }

    // Sauvegarder le cache d'embeddings
    if (!DRY_RUN) {
        saveEmbeddingsCache();
    }

    // Résumé
    const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);
    const statsAfter = store.getStats();
    const cacheStats = getCacheStats();
    console.log('\n═══════════════════════════════════════');
    console.log('  Résumé :');
    console.log(`  📚 Articles: ${statsAfter.articlesCount} (${articlesAdded > 0 ? '+' + articlesAdded : 'inchangé'})`);
    console.log(`  📋 Briefings: ${statsAfter.briefingsCount} (${briefingIndexed ? '+1' : 'inchangé'})`);
    if (statsAfter.newestArticle) {
        console.log(`  📅 Articles: ${statsAfter.oldestArticle} → ${statsAfter.newestArticle}`);
    }
    if (statsAfter.newestBriefing) {
        console.log(`  📅 Briefings: ${statsAfter.oldestBriefing} → ${statsAfter.newestBriefing}`);
    }
    console.log(`  💾 Cache: ${cacheStats.entries} entrées, ${cacheStats.hitRate} hit rate (${cacheStats.hits} hits, ${cacheStats.misses} misses)`);
    console.log(`  ⏱ Temps total: ${totalElapsed}s`);
    console.log('═══════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
