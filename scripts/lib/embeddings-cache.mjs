/**
 * Inflexion — Cache de persistance des embeddings (Sprint 4)
 *
 * Module indépendant de @xenova/transformers pour permettre les tests unitaires
 * sans charger le modèle. Le cache stocke les embeddings déjà calculés
 * dans un fichier JSON, indexé par hash SHA-256 du texte source.
 *
 * Architecture :
 *   data/embeddings-cache.json — { [sha256]: { embedding: number[], timestamp: number } }
 *
 * Gains :
 *   - Évite de recalculer les embeddings d'articles déjà traités
 *   - TTL de 7 jours (les articles anciens ne servent plus au RAG)
 *   - Target : ~15s → ~3s pour une ré-indexation sans nouveaux articles
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// ─── Configuration ──────────────────────────────────────────

/** TTL du cache : 7 jours en millisecondes */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ─── État interne ───────────────────────────────────────────

/** @type {string|null} Chemin vers le fichier cache */
let cachePath = null;

/** @type {Object<string, {embedding: number[], timestamp: number}>|null} */
let cache = null;

let cacheHits = 0;
let cacheMisses = 0;
let cacheDirty = false;

// ─── Fonctions utilitaires ──────────────────────────────────

/**
 * Calcule le hash SHA-256 d'un texte (clé de cache).
 * @param {string} text — Texte à hasher
 * @returns {string} — Hash hexadécimal 64 caractères
 */
export function hashText(text) {
    return createHash('sha256').update(text, 'utf-8').digest('hex');
}

/**
 * Supprime les entrées du cache dont le TTL est dépassé.
 * @returns {number} — Nombre d'entrées supprimées
 */
function pruneExpired() {
    if (!cache) return 0;
    const now = Date.now();
    let pruned = 0;
    for (const hash of Object.keys(cache)) {
        if (now - cache[hash].timestamp > CACHE_TTL_MS) {
            delete cache[hash];
            pruned++;
        }
    }
    if (pruned > 0) {
        cacheDirty = true;
    }
    return pruned;
}

// ─── API publique ───────────────────────────────────────────

/**
 * Initialise le cache d'embeddings depuis un fichier JSON.
 * Charge le cache existant et supprime les entrées expirées.
 *
 * @param {string} path — Chemin vers le fichier cache (ex: data/embeddings-cache.json)
 */
export function initEmbeddingsCache(path) {
    cachePath = path;
    cacheHits = 0;
    cacheMisses = 0;
    cacheDirty = false;

    if (existsSync(path)) {
        try {
            cache = JSON.parse(readFileSync(path, 'utf-8'));
            const entriesBefore = Object.keys(cache).length;
            const pruned = pruneExpired();
            console.log(`  💾 Cache embeddings chargé: ${entriesBefore} entrées` +
                (pruned > 0 ? ` (${pruned} expirées supprimées)` : ''));
        } catch {
            console.warn(`  ⚠ Cache embeddings corrompu: ${path}, réinitialisation`);
            cache = {};
        }
    } else {
        cache = {};
        console.log('  💾 Cache embeddings: nouveau (aucun fichier existant)');
    }
}

/**
 * Cherche un embedding dans le cache.
 * @param {string} text — Texte tronqué (max 1024 car.)
 * @returns {number[]|null} — Embedding si trouvé et non expiré, null sinon
 */
export function getCachedEmbedding(text) {
    if (!cache) return null;
    const hash = hashText(text);
    const entry = cache[hash];
    if (entry && Date.now() - entry.timestamp <= CACHE_TTL_MS) {
        cacheHits++;
        return entry.embedding;
    }
    return null;
}

/**
 * Stocke un embedding dans le cache.
 * @param {string} text — Texte tronqué (max 1024 car.)
 * @param {number[]} embedding — Vecteur 384D
 */
export function setCachedEmbedding(text, embedding) {
    if (!cache) return;
    const hash = hashText(text);
    cache[hash] = { embedding, timestamp: Date.now() };
    cacheDirty = true;
    cacheMisses++;
}

/**
 * Sauvegarde le cache sur disque (si modifié).
 */
export function saveEmbeddingsCache() {
    if (!cachePath || !cache || !cacheDirty) return;

    const dir = dirname(cachePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(cachePath, JSON.stringify(cache), 'utf-8');
    cacheDirty = false;
    console.log(`  💾 Cache embeddings sauvegardé: ${Object.keys(cache).length} entrées`);
}

/**
 * Retourne les statistiques du cache (hits, misses, taille).
 * @returns {{ entries: number, hits: number, misses: number, hitRate: string }}
 */
export function getCacheStats() {
    const total = cacheHits + cacheMisses;
    return {
        entries: cache ? Object.keys(cache).length : 0,
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: total > 0
            ? (cacheHits / total * 100).toFixed(1) + '%'
            : 'N/A',
    };
}

/**
 * Réinitialise le cache (utile pour les tests).
 */
export function resetEmbeddingsCache() {
    cache = null;
    cachePath = null;
    cacheHits = 0;
    cacheMisses = 0;
    cacheDirty = false;
}
