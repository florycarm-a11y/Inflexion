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

// ─── Similarité cosinus (inline pour éviter la dépendance @xenova/transformers) ─
/**
 * Calcule la similarité cosinus entre deux vecteurs.
 * @param {number[]} a — Vecteur A
 * @param {number[]} b — Vecteur B
 * @returns {number} — Score entre -1 et 1 (1 = identique)
 */
function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}

// ─── Configuration ──────────────────────────────────────────

const MAX_ARTICLES = 500;   // Garder les 500 derniers articles indexés
const MAX_BRIEFINGS = 60;   // Garder les 60 derniers briefings (~2 mois)

// ─── Recherche hybride : pondération vectoriel / lexical ────
// score_final = (cosinus * VECTOR_WEIGHT) + (lexical * KEYWORD_WEIGHT)
// Ajuster ces constantes pour calibrer l'importance relative.
export const VECTOR_WEIGHT = 0.7;
export const KEYWORD_WEIGHT = 0.3;

// ─── Stopwords FR + EN ──────────────────────────────────────
// Mots de liaison ignorés lors de l'extraction de mots-clés.
const STOPWORDS = new Set([
    // Français
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'ce', 'cette', 'ces',
    'et', 'ou', 'mais', 'donc', 'ni', 'car', 'que', 'qui', 'dont', 'où',
    'dans', 'sur', 'sous', 'pour', 'par', 'avec', 'sans', 'entre', 'vers',
    'est', 'sont', 'être', 'etre', 'avoir', 'fait', 'plus', 'très', 'tres',
    'pas', 'ne', 'se', 'son', 'sa', 'ses', 'leur', 'leurs', 'aux', 'au',
    'en', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
    // Anglais
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'after',
    'it', 'its', 'he', 'she', 'they', 'we', 'you', 'that', 'this',
    'which', 'who', 'whom', 'what', 'how', 'when', 'where', 'why',
    'not', 'no', 'but', 'or', 'and', 'if', 'then', 'so', 'than',
]);

// ─── Fonctions de scoring lexical ───────────────────────────

/**
 * Extrait les mots-clés significatifs d'un texte (sans stopwords).
 * @param {string} text — Texte brut (requête ou document)
 * @returns {string[]} — Mots-clés en minuscules, dédupliqués
 */
export function extractKeywords(text) {
    if (!text || typeof text !== 'string') return [];
    return [...new Set(
        text
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // retirer accents
            .split(/[^a-z0-9àâäéèêëïîôùûüçæœ&$/%-]+/i)
            .map(w => w.trim())
            .filter(w => w.length >= 2 && !STOPWORDS.has(w))
    )];
}

/**
 * Calcule un score lexical (0-1) entre mots-clés de la requête et le texte d'un document.
 * Utilise des word boundaries (\b) pour les mots courts (≤4 car.) afin d'éviter
 * les faux positifs (ex: "or" ne matche pas "Chamfort").
 *
 * @param {string[]} queryKeywords — Mots-clés extraits de la requête
 * @param {string} docText — Texte brut du document (title + description)
 * @returns {number} — Score entre 0 et 1
 */
export function keywordScore(queryKeywords, docText) {
    if (!queryKeywords.length || !docText) return 0;

    const normalizedDoc = docText
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    let matches = 0;
    for (const kw of queryKeywords) {
        if (kw.length <= 4) {
            // Word boundary pour les mots courts — évite les faux positifs
            const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(normalizedDoc)) matches++;
        } else {
            // Substring matching suffit pour les mots longs (>4 car.)
            if (normalizedDoc.includes(kw)) matches++;
        }
    }

    return matches / queryKeywords.length;
}

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
     * Mode hybride : si queryText est fourni, combine score vectoriel
     * et score lexical (mots-clés) pour mieux remonter les acronymes,
     * tickers et noms propres.
     *
     * @param {number[]} queryEmbedding — Vecteur de recherche
     * @param {Object} [options]
     * @param {number} [options.topK=5] — Nombre de résultats
     * @param {number} [options.minScore=0.3] — Score minimum de similarité
     * @param {string} [options.excludeDate] — Exclure les articles de cette date
     * @param {string} [options.queryText] — Texte brut de la requête (active le scoring hybride)
     * @returns {Array<{entry: Object, score: number}>}
     */
    searchArticles(queryEmbedding, options = {}) {
        const { topK = 5, minScore = 0.3, excludeDate = null, queryText = null } = options;
        const articles = this.loadArticles();
        const qKeywords = queryText ? extractKeywords(queryText) : [];

        const scored = articles
            .filter(a => !excludeDate || a.date !== excludeDate)
            .map(entry => {
                const vectorScore = cosineSimilarity(queryEmbedding, entry.embedding);
                if (!qKeywords.length) {
                    return { entry, score: vectorScore };
                }
                const kwScore = keywordScore(qKeywords, entry.text);
                return {
                    entry,
                    score: (vectorScore * VECTOR_WEIGHT) + (kwScore * KEYWORD_WEIGHT),
                };
            })
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
     * Mode hybride : si queryText est fourni, combine score vectoriel
     * et score lexical.
     *
     * @param {number[]} queryEmbedding — Vecteur de recherche
     * @param {Object} [options]
     * @param {number} [options.topK=3] — Nombre de résultats
     * @param {number} [options.minScore=0.25] — Score minimum
     * @param {string} [options.excludeDate] — Exclure le briefing de cette date
     * @param {string} [options.queryText] — Texte brut de la requête (active le scoring hybride)
     * @returns {Array<{entry: Object, score: number}>}
     */
    searchBriefings(queryEmbedding, options = {}) {
        const { topK = 3, minScore = 0.25, excludeDate = null, queryText = null } = options;
        const briefings = this.loadBriefings();
        const qKeywords = queryText ? extractKeywords(queryText) : [];

        const scored = briefings
            .filter(b => !excludeDate || b.date !== excludeDate)
            .map(entry => {
                const vectorScore = cosineSimilarity(queryEmbedding, entry.embedding);
                if (!qKeywords.length) {
                    return { entry, score: vectorScore };
                }
                const kwScore = keywordScore(qKeywords, entry.text);
                return {
                    entry,
                    score: (vectorScore * VECTOR_WEIGHT) + (kwScore * KEYWORD_WEIGHT),
                };
            })
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
