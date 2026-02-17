/**
 * Inflexion — RAG Vector Store (JSON-based)
 *
 * Store vectoriel léger basé sur des fichiers JSON.
 * Stocke les embeddings d'articles et de briefings pour permettre
 * la recherche par similarité sémantique.
 *
 * Architecture :
 *   data/rag/articles.json    — Embeddings des articles (news, RSS)
 *   data/rag/briefings.json   — Embeddings des briefings quotidiens
 *
 * Chaque entrée contient :
 *   { id, text, embedding, metadata, date }
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { cosineSimilarity } from './embeddings.mjs';

// ─── Configuration ──────────────────────────────────────────

const MAX_ARTICLES = 500;   // Garder les 500 derniers articles indexés
const MAX_BRIEFINGS = 60;   // Garder les 60 derniers briefings (~2 mois)

// ─── Utilitaires I/O ────────────────────────────────────────

function loadStore(filepath) {
    if (!existsSync(filepath)) return [];
    try {
        return JSON.parse(readFileSync(filepath, 'utf-8'));
    } catch {
        console.warn(`  ⚠ Fichier RAG corrompu: ${filepath}, réinitialisation`);
        return [];
    }
}

function saveStore(filepath, entries) {
    const dir = join(filepath, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(filepath, JSON.stringify(entries), 'utf-8');
}

// ─── RAGStore class ─────────────────────────────────────────

export class RAGStore {
    /**
     * @param {string} ragDir — Chemin vers le dossier data/rag/
     */
    constructor(ragDir) {
        this.ragDir = ragDir;
        this.articlesPath = join(ragDir, 'articles.json');
        this.briefingsPath = join(ragDir, 'briefings.json');

        // Créer le dossier si nécessaire
        if (!existsSync(ragDir)) {
            mkdirSync(ragDir, { recursive: true });
        }
    }

    // ─── Articles ───────────────────────────────────────────

    /**
     * Charge les articles indexés.
     * @returns {Array}
     */
    loadArticles() {
        return loadStore(this.articlesPath);
    }

    /**
     * Ajoute des articles au store (dédupliqués par ID).
     * @param {Array<{id: string, text: string, embedding: number[], metadata: Object, date: string}>} newEntries
     */
    addArticles(newEntries) {
        const existing = this.loadArticles();
        const existingIds = new Set(existing.map(e => e.id));

        let added = 0;
        for (const entry of newEntries) {
            if (!existingIds.has(entry.id)) {
                existing.push(entry);
                existingIds.add(entry.id);
                added++;
            }
        }

        // Trier par date décroissante et garder les N plus récents
        existing.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        const trimmed = existing.slice(0, MAX_ARTICLES);

        saveStore(this.articlesPath, trimmed);
        console.log(`  📚 Articles RAG: +${added} ajoutés, ${trimmed.length} total (max ${MAX_ARTICLES})`);
        return added;
    }

    /**
     * Recherche les articles les plus similaires à un vecteur query.
     * @param {number[]} queryEmbedding — Vecteur de recherche
     * @param {Object} [options]
     * @param {number} [options.topK=5] — Nombre de résultats
     * @param {number} [options.minScore=0.3] — Score minimum de similarité
     * @param {string} [options.excludeDate] — Exclure les articles de cette date
     * @returns {Array<{entry: Object, score: number}>}
     */
    searchArticles(queryEmbedding, options = {}) {
        const { topK = 5, minScore = 0.3, excludeDate = null } = options;
        const articles = this.loadArticles();

        const scored = articles
            .filter(a => !excludeDate || a.date !== excludeDate)
            .map(entry => ({
                entry,
                score: cosineSimilarity(queryEmbedding, entry.embedding),
            }))
            .filter(r => r.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        return scored;
    }

    // ─── Briefings ──────────────────────────────────────────

    /**
     * Charge les briefings indexés.
     * @returns {Array}
     */
    loadBriefings() {
        return loadStore(this.briefingsPath);
    }

    /**
     * Ajoute un briefing au store.
     * @param {{id: string, text: string, embedding: number[], metadata: Object, date: string}} entry
     */
    addBriefing(entry) {
        const existing = this.loadBriefings();
        const existingIds = new Set(existing.map(e => e.id));

        if (existingIds.has(entry.id)) {
            // Mettre à jour l'existant
            const idx = existing.findIndex(e => e.id === entry.id);
            existing[idx] = entry;
        } else {
            existing.push(entry);
        }

        // Trier par date et garder les N plus récents
        existing.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        const trimmed = existing.slice(0, MAX_BRIEFINGS);

        saveStore(this.briefingsPath, trimmed);
        return true;
    }

    /**
     * Recherche les briefings les plus similaires à un vecteur query.
     * @param {number[]} queryEmbedding — Vecteur de recherche
     * @param {Object} [options]
     * @param {number} [options.topK=3] — Nombre de résultats
     * @param {number} [options.minScore=0.25] — Score minimum
     * @param {string} [options.excludeDate] — Exclure le briefing de cette date
     * @returns {Array<{entry: Object, score: number}>}
     */
    searchBriefings(queryEmbedding, options = {}) {
        const { topK = 3, minScore = 0.25, excludeDate = null } = options;
        const briefings = this.loadBriefings();

        const scored = briefings
            .filter(b => !excludeDate || b.date !== excludeDate)
            .map(entry => ({
                entry,
                score: cosineSimilarity(queryEmbedding, entry.embedding),
            }))
            .filter(r => r.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        return scored;
    }

    /**
     * Retourne les N derniers briefings (par date, sans similarité).
     * @param {number} [n=3] — Nombre de briefings récents
     * @param {string} [excludeDate] — Date à exclure
     * @returns {Array}
     */
    getRecentBriefings(n = 3, excludeDate = null) {
        const briefings = this.loadBriefings();
        return briefings
            .filter(b => !excludeDate || b.date !== excludeDate)
            .slice(0, n);
    }

    // ─── Stats ──────────────────────────────────────────────

    /**
     * Retourne les statistiques du store.
     */
    getStats() {
        const articles = this.loadArticles();
        const briefings = this.loadBriefings();
        return {
            articlesCount: articles.length,
            briefingsCount: briefings.length,
            oldestArticle: articles[articles.length - 1]?.date || null,
            newestArticle: articles[0]?.date || null,
            oldestBriefing: briefings[briefings.length - 1]?.date || null,
            newestBriefing: briefings[0]?.date || null,
        };
    }
}
