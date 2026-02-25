/**
 * Inflexion — Module d'embeddings locaux (transformers.js)
 *
 * Génère des embeddings vectoriels à partir de texte en utilisant
 * le modèle all-MiniLM-L6-v2 (384 dimensions) directement en Node.js.
 * Zéro API externe, zéro coût.
 *
 * Sprint 4 : Intégration du cache de persistance (embeddings-cache.mjs)
 * pour éviter le recalcul des embeddings d'articles déjà traités.
 *
 * @requires @xenova/transformers
 */

import { pipeline, env } from '@xenova/transformers';
import {
    getCachedEmbedding,
    setCachedEmbedding,
    getCacheStats,
} from './embeddings-cache.mjs';

// Re-exporter les fonctions du cache pour usage par les scripts appelants
export {
    hashText,
    initEmbeddingsCache,
    saveEmbeddingsCache,
    getCacheStats,
    resetEmbeddingsCache,
    CACHE_TTL_MS,
} from './embeddings-cache.mjs';

// Désactiver le téléchargement de modèles à distance si déjà en cache
// Le modèle sera téléchargé au premier usage puis mis en cache
env.cacheDir = './.cache/transformers';

// ─── Configuration ──────────────────────────────────────────

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIM = 384;

let embedder = null;

// ─── Initialisation (lazy) ──────────────────────────────────

/**
 * Initialise le pipeline d'embeddings (télécharge le modèle au premier appel).
 * Les appels suivants réutilisent l'instance en cache.
 * @returns {Promise<Function>}
 */
async function getEmbedder() {
    if (!embedder) {
        console.log(`  🔄 Chargement du modèle ${MODEL_NAME}...`);
        const start = Date.now();
        embedder = await pipeline('feature-extraction', MODEL_NAME, {
            quantized: true, // Modèle quantifié pour réduire la taille (~23MB vs ~90MB)
        });
        console.log(`  ✓ Modèle chargé en ${((Date.now() - start) / 1000).toFixed(1)}s`);
    }
    return embedder;
}

// ─── API publique ───────────────────────────────────────────

/**
 * Génère un embedding (vecteur 384D) pour un texte donné.
 * Utilise le cache si disponible (initEmbeddingsCache appelé au préalable).
 *
 * @param {string} text — Le texte à vectoriser
 * @returns {Promise<number[]>} — Vecteur de 384 dimensions (normalisé)
 */
export async function embedText(text) {
    if (!text || typeof text !== 'string') {
        return new Array(EMBEDDING_DIM).fill(0);
    }

    // Tronquer à ~256 tokens (~1024 caractères) pour rester dans les limites du modèle
    const truncated = text.slice(0, 1024);

    // Vérifier le cache
    const cached = getCachedEmbedding(truncated);
    if (cached) {
        return cached;
    }

    // Cache miss — calculer l'embedding
    const embed = await getEmbedder();

    const output = await embed(truncated, {
        pooling: 'mean',
        normalize: true,
    });

    const embedding = Array.from(output.data);

    // Stocker dans le cache
    setCachedEmbedding(truncated, embedding);

    return embedding;
}

/**
 * Génère des embeddings pour un batch de textes.
 * Affiche les statistiques de cache et le temps écoulé.
 *
 * @param {string[]} texts — Les textes à vectoriser
 * @param {Object} [options]
 * @param {Function} [options.onProgress] — Callback (index, total)
 * @returns {Promise<number[][]>} — Tableau de vecteurs 384D
 */
export async function embedBatch(texts, options = {}) {
    const { onProgress } = options;
    const start = Date.now();
    const results = [];

    for (let i = 0; i < texts.length; i++) {
        const vec = await embedText(texts[i]);
        results.push(vec);

        if (onProgress && i % 10 === 0) {
            onProgress(i, texts.length);
        }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const stats = getCacheStats();
    if (stats.entries > 0 || stats.hits > 0 || stats.misses > 0) {
        console.log(`  ⏱ Batch embedding: ${texts.length} textes en ${elapsed}s (cache: ${stats.hits} hits, ${stats.misses} misses, ${stats.hitRate} hit rate)`);
    } else {
        console.log(`  ⏱ Batch embedding: ${texts.length} textes en ${elapsed}s (pas de cache)`);
    }

    return results;
}

/**
 * Calcule la similarité cosinus entre deux vecteurs.
 * @param {number[]} a — Vecteur A
 * @param {number[]} b — Vecteur B
 * @returns {number} — Score entre -1 et 1 (1 = identique)
 */
export function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}

/**
 * Dimension des embeddings générés.
 */
export const DIMENSION = EMBEDDING_DIM;
