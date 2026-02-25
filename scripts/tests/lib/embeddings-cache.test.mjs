/**
 * Tests unitaires — scripts/lib/embeddings-cache.mjs (Sprint 4)
 *
 * Execution :  node --test scripts/tests/lib/embeddings-cache.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zero dependance)
 *
 * Couvre :
 *   A. hashText             (SHA-256 hashing)
 *   B. initEmbeddingsCache  (chargement, pruning TTL, fichier corrompu)
 *   C. getCachedEmbedding   (cache hits et misses)
 *   D. setCachedEmbedding   (écriture dans le cache)
 *   E. saveEmbeddingsCache  (persistance sur disque)
 *   F. getCacheStats        (statistiques hits/misses)
 *   G. resetEmbeddingsCache (nettoyage pour tests)
 *   H. CACHE_TTL_MS         (constante exportée)
 *
 * Note : ces tests importent embeddings-cache.mjs (pas embeddings.mjs)
 * pour éviter la dépendance @xenova/transformers qui n'est pas installée
 * dans l'environnement de test.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';

import {
    hashText,
    initEmbeddingsCache,
    saveEmbeddingsCache,
    getCacheStats,
    resetEmbeddingsCache,
    getCachedEmbedding,
    setCachedEmbedding,
    CACHE_TTL_MS,
} from '../../lib/embeddings-cache.mjs';


// ─── Helpers ────────────────────────────────────────────────

/** Crée un faux embedding 384D */
function fakeEmbedding(seed = 0) {
    const vec = new Array(384);
    for (let i = 0; i < 384; i++) {
        vec[i] = Math.sin(seed * 100 + i) * 0.1;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return norm > 0 ? vec.map(v => v / norm) : vec;
}

/** Crée un dossier temp unique pour les tests */
function createTempDir() {
    const dir = join(tmpdir(), `inflexion-emb-cache-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    return dir;
}

/** Calcule le hash SHA-256 d'un texte (pour comparaison) */
function expectedHash(text) {
    return createHash('sha256').update(text, 'utf-8').digest('hex');
}


// ═══════════════════════════════════════════════════════════════
// A. hashText — SHA-256 hashing
// ═══════════════════════════════════════════════════════════════

describe('A. hashText', () => {
    it('retourne un hash SHA-256 hexadécimal de 64 caractères', () => {
        const hash = hashText('test');
        assert.equal(hash.length, 64);
        assert.match(hash, /^[a-f0-9]{64}$/);
    });

    it('produit le même hash pour le même texte', () => {
        assert.equal(hashText('BCE taux directeurs'), hashText('BCE taux directeurs'));
    });

    it('produit des hashes différents pour des textes différents', () => {
        assert.notEqual(hashText('BCE taux'), hashText('Fed taux'));
    });

    it('correspond au hash crypto.createHash standard', () => {
        const text = 'Bitcoin en hausse';
        assert.equal(hashText(text), expectedHash(text));
    });

    it('gère les caractères unicode (accents, emojis)', () => {
        const hash = hashText('Géopolitique des marchés européens');
        assert.equal(hash.length, 64);
        assert.match(hash, /^[a-f0-9]{64}$/);
    });

    it('gère les textes longs', () => {
        const longText = 'a'.repeat(10000);
        const hash = hashText(longText);
        assert.equal(hash.length, 64);
    });
});


// ═══════════════════════════════════════════════════════════════
// B. initEmbeddingsCache — chargement et TTL
// ═══════════════════════════════════════════════════════════════

describe('B. initEmbeddingsCache', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = createTempDir();
        resetEmbeddingsCache();
    });

    afterEach(() => {
        resetEmbeddingsCache();
        if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
    });

    it('initialise un cache vide quand le fichier n\'existe pas', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);
        const stats = getCacheStats();
        assert.equal(stats.entries, 0);
        assert.equal(stats.hits, 0);
        assert.equal(stats.misses, 0);
    });

    it('charge un cache existant depuis un fichier JSON', () => {
        const cachePath = join(tempDir, 'cache.json');
        const hash = expectedHash('test text');
        const cacheData = {
            [hash]: { embedding: fakeEmbedding(1), timestamp: Date.now() },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        const stats = getCacheStats();
        assert.equal(stats.entries, 1);
    });

    it('charge un cache avec plusieurs entrées', () => {
        const cachePath = join(tempDir, 'cache.json');
        const cacheData = {};
        for (let i = 0; i < 5; i++) {
            cacheData[expectedHash(`text-${i}`)] = {
                embedding: fakeEmbedding(i),
                timestamp: Date.now(),
            };
        }
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        assert.equal(getCacheStats().entries, 5);
    });

    it('supprime les entrées expirées au chargement', () => {
        const cachePath = join(tempDir, 'cache.json');
        const cacheData = {
            [expectedHash('fresh')]: { embedding: fakeEmbedding(1), timestamp: Date.now() },
            [expectedHash('expired')]: { embedding: fakeEmbedding(2), timestamp: Date.now() - CACHE_TTL_MS - 1000 },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        const stats = getCacheStats();
        assert.equal(stats.entries, 1, 'Seule l\'entrée fraîche doit rester');
    });

    it('supprime toutes les entrées si toutes sont expirées', () => {
        const cachePath = join(tempDir, 'cache.json');
        const cacheData = {
            [expectedHash('old1')]: { embedding: fakeEmbedding(1), timestamp: Date.now() - CACHE_TTL_MS - 1000 },
            [expectedHash('old2')]: { embedding: fakeEmbedding(2), timestamp: Date.now() - CACHE_TTL_MS - 2000 },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        assert.equal(getCacheStats().entries, 0);
    });

    it('gère un fichier cache corrompu (JSON invalide)', () => {
        const cachePath = join(tempDir, 'cache.json');
        writeFileSync(cachePath, 'not valid json{{{', 'utf-8');

        initEmbeddingsCache(cachePath);
        const stats = getCacheStats();
        assert.equal(stats.entries, 0, 'Cache réinitialisé après corruption');
    });

    it('réinitialise les compteurs hits/misses à chaque init', () => {
        const cachePath = join(tempDir, 'cache.json');

        // Premier init avec une entrée
        const cacheData = {
            [expectedHash('text')]: { embedding: fakeEmbedding(1), timestamp: Date.now() },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');
        initEmbeddingsCache(cachePath);

        // Faire un cache hit
        getCachedEmbedding('text');
        assert.equal(getCacheStats().hits, 1);

        // Réinitialiser
        initEmbeddingsCache(cachePath);
        assert.equal(getCacheStats().hits, 0);
        assert.equal(getCacheStats().misses, 0);
    });
});


// ═══════════════════════════════════════════════════════════════
// C. getCachedEmbedding — cache hits et misses
// ═══════════════════════════════════════════════════════════════

describe('C. getCachedEmbedding', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = createTempDir();
        resetEmbeddingsCache();
    });

    afterEach(() => {
        resetEmbeddingsCache();
        if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
    });

    it('retourne null quand le cache n\'est pas initialisé', () => {
        assert.equal(getCachedEmbedding('test'), null);
    });

    it('retourne null pour un texte non caché', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);
        assert.equal(getCachedEmbedding('texte inconnu'), null);
    });

    it('retourne l\'embedding pour un texte caché', () => {
        const cachePath = join(tempDir, 'cache.json');
        const text = 'BCE augmente les taux directeurs';
        const emb = fakeEmbedding(42);
        const cacheData = {
            [expectedHash(text)]: { embedding: emb, timestamp: Date.now() },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        const result = getCachedEmbedding(text);
        assert.deepEqual(result, emb);
    });

    it('incrémente le compteur de hits', () => {
        const cachePath = join(tempDir, 'cache.json');
        const cacheData = {
            [expectedHash('a')]: { embedding: fakeEmbedding(1), timestamp: Date.now() },
            [expectedHash('b')]: { embedding: fakeEmbedding(2), timestamp: Date.now() },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        getCachedEmbedding('a');
        getCachedEmbedding('b');
        getCachedEmbedding('a');

        assert.equal(getCacheStats().hits, 3);
    });

    it('ne retourne pas un embedding expiré même si présent', () => {
        const cachePath = join(tempDir, 'cache.json');
        const text = 'article expiré';
        // L'entrée a un timestamp juste au-dessus du TTL
        // Note: pruneExpired est appelé dans initEmbeddingsCache,
        // donc on crée une entrée qui expire APRÈS le chargement
        const cacheData = {
            [expectedHash(text)]: {
                embedding: fakeEmbedding(99),
                // Timestamp juste à la limite du TTL — sera encore valide au init
                // mais on teste avec une entrée clairement expirée qui sera purgée
                timestamp: Date.now() - CACHE_TTL_MS - 1,
            },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        // L'entrée a été purgée par pruneExpired
        const result = getCachedEmbedding(text);
        assert.equal(result, null);
    });

    it('retourne le bon embedding pour chaque texte différent', () => {
        const cachePath = join(tempDir, 'cache.json');
        const emb1 = fakeEmbedding(1);
        const emb2 = fakeEmbedding(2);
        const cacheData = {
            [expectedHash('alpha')]: { embedding: emb1, timestamp: Date.now() },
            [expectedHash('beta')]: { embedding: emb2, timestamp: Date.now() },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        assert.deepEqual(getCachedEmbedding('alpha'), emb1);
        assert.deepEqual(getCachedEmbedding('beta'), emb2);
    });
});


// ═══════════════════════════════════════════════════════════════
// D. setCachedEmbedding — écriture dans le cache
// ═══════════════════════════════════════════════════════════════

describe('D. setCachedEmbedding', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = createTempDir();
        resetEmbeddingsCache();
    });

    afterEach(() => {
        resetEmbeddingsCache();
        if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
    });

    it('ne fait rien si le cache n\'est pas initialisé', () => {
        setCachedEmbedding('test', fakeEmbedding(1));
        // Pas d'erreur, juste ignoré
        assert.equal(getCacheStats().entries, 0);
    });

    it('ajoute une entrée au cache', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);

        const emb = fakeEmbedding(5);
        setCachedEmbedding('nouveau texte', emb);

        assert.equal(getCacheStats().entries, 1);
        assert.deepEqual(getCachedEmbedding('nouveau texte'), emb);
    });

    it('incrémente le compteur de misses', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);

        setCachedEmbedding('text1', fakeEmbedding(1));
        setCachedEmbedding('text2', fakeEmbedding(2));

        assert.equal(getCacheStats().misses, 2);
    });

    it('écrase une entrée existante avec le même hash', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);

        const emb1 = fakeEmbedding(1);
        const emb2 = fakeEmbedding(2);
        setCachedEmbedding('same text', emb1);
        setCachedEmbedding('same text', emb2);

        assert.deepEqual(getCachedEmbedding('same text'), emb2);
        assert.equal(getCacheStats().entries, 1);
    });

    it('l\'entrée ajoutée est récupérable par getCachedEmbedding', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);

        const texts = ['Alpha', 'Beta', 'Gamma'];
        for (let i = 0; i < texts.length; i++) {
            setCachedEmbedding(texts[i], fakeEmbedding(i));
        }

        for (let i = 0; i < texts.length; i++) {
            assert.deepEqual(getCachedEmbedding(texts[i]), fakeEmbedding(i));
        }
    });
});


// ═══════════════════════════════════════════════════════════════
// E. saveEmbeddingsCache — persistance sur disque
// ═══════════════════════════════════════════════════════════════

describe('E. saveEmbeddingsCache', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = createTempDir();
        resetEmbeddingsCache();
    });

    afterEach(() => {
        resetEmbeddingsCache();
        if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
    });

    it('ne crée pas de fichier si le cache n\'a pas été modifié', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);
        saveEmbeddingsCache();
        assert.equal(existsSync(cachePath), false);
    });

    it('sauvegarde le cache après un ajout (dirty flag)', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);

        setCachedEmbedding('test', fakeEmbedding(1));
        saveEmbeddingsCache();

        assert.ok(existsSync(cachePath));
        const saved = JSON.parse(readFileSync(cachePath, 'utf-8'));
        assert.equal(Object.keys(saved).length, 1);
    });

    it('sauvegarde le cache après pruning (dirty flag)', () => {
        const cachePath = join(tempDir, 'cache.json');
        const cacheData = {
            [expectedHash('fresh')]: { embedding: fakeEmbedding(1), timestamp: Date.now() },
            [expectedHash('old')]: { embedding: fakeEmbedding(2), timestamp: Date.now() - CACHE_TTL_MS - 1000 },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        saveEmbeddingsCache();

        const saved = JSON.parse(readFileSync(cachePath, 'utf-8'));
        assert.equal(Object.keys(saved).length, 1, 'Seule l\'entrée fraîche doit être sauvegardée');
        assert.ok(saved[expectedHash('fresh')]);
    });

    it('le fichier sauvegardé est rechargeable par initEmbeddingsCache', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);

        const emb = fakeEmbedding(42);
        setCachedEmbedding('persistent text', emb);
        saveEmbeddingsCache();

        // Recharger
        resetEmbeddingsCache();
        initEmbeddingsCache(cachePath);

        assert.equal(getCacheStats().entries, 1);
        assert.deepEqual(getCachedEmbedding('persistent text'), emb);
    });

    it('ne sauvegarde pas une deuxième fois sans modification', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);

        setCachedEmbedding('test', fakeEmbedding(1));
        saveEmbeddingsCache();

        // Modifier le fichier manuellement pour vérifier qu'il ne sera pas écrasé
        writeFileSync(cachePath, '{"marker": true}', 'utf-8');
        saveEmbeddingsCache(); // Ne doit rien faire (dirty=false)

        const content = readFileSync(cachePath, 'utf-8');
        assert.ok(content.includes('marker'), 'Le fichier ne doit pas être ré-écrit');
    });
});


// ═══════════════════════════════════════════════════════════════
// F. getCacheStats — statistiques
// ═══════════════════════════════════════════════════════════════

describe('F. getCacheStats', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = createTempDir();
        resetEmbeddingsCache();
    });

    afterEach(() => {
        resetEmbeddingsCache();
        if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
    });

    it('retourne 0 entrées quand le cache n\'est pas initialisé', () => {
        const stats = getCacheStats();
        assert.equal(stats.entries, 0);
        assert.equal(stats.hits, 0);
        assert.equal(stats.misses, 0);
        assert.equal(stats.hitRate, 'N/A');
    });

    it('retourne le nombre correct d\'entrées', () => {
        const cachePath = join(tempDir, 'cache.json');
        const cacheData = {};
        for (let i = 0; i < 3; i++) {
            cacheData[expectedHash(`text-${i}`)] = {
                embedding: fakeEmbedding(i),
                timestamp: Date.now(),
            };
        }
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        assert.equal(getCacheStats().entries, 3);
    });

    it('calcule le hit rate à 100% quand tout est en cache', () => {
        const cachePath = join(tempDir, 'cache.json');
        const cacheData = {
            [expectedHash('a')]: { embedding: fakeEmbedding(1), timestamp: Date.now() },
            [expectedHash('b')]: { embedding: fakeEmbedding(2), timestamp: Date.now() },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        getCachedEmbedding('a');
        getCachedEmbedding('b');

        assert.equal(getCacheStats().hitRate, '100.0%');
    });

    it('calcule le hit rate à 0% quand tout est miss', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);

        setCachedEmbedding('x', fakeEmbedding(1));
        setCachedEmbedding('y', fakeEmbedding(2));

        assert.equal(getCacheStats().hitRate, '0.0%');
    });

    it('calcule un hit rate mixte correctement', () => {
        const cachePath = join(tempDir, 'cache.json');
        const cacheData = {
            [expectedHash('cached')]: { embedding: fakeEmbedding(1), timestamp: Date.now() },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        getCachedEmbedding('cached'); // hit
        setCachedEmbedding('new', fakeEmbedding(2)); // miss

        const stats = getCacheStats();
        assert.equal(stats.hits, 1);
        assert.equal(stats.misses, 1);
        assert.equal(stats.hitRate, '50.0%');
    });
});


// ═══════════════════════════════════════════════════════════════
// G. resetEmbeddingsCache — nettoyage
// ═══════════════════════════════════════════════════════════════

describe('G. resetEmbeddingsCache', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = createTempDir();
    });

    afterEach(() => {
        resetEmbeddingsCache();
        if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
    });

    it('réinitialise tous les compteurs et le cache', () => {
        const cachePath = join(tempDir, 'cache.json');
        const cacheData = {
            [expectedHash('test')]: { embedding: fakeEmbedding(1), timestamp: Date.now() },
        };
        writeFileSync(cachePath, JSON.stringify(cacheData), 'utf-8');

        initEmbeddingsCache(cachePath);
        getCachedEmbedding('test');
        assert.equal(getCacheStats().entries, 1);
        assert.equal(getCacheStats().hits, 1);

        resetEmbeddingsCache();
        assert.equal(getCacheStats().entries, 0);
        assert.equal(getCacheStats().hits, 0);
        assert.equal(getCacheStats().misses, 0);
        assert.equal(getCacheStats().hitRate, 'N/A');
    });

    it('après reset, getCachedEmbedding retourne null', () => {
        const cachePath = join(tempDir, 'cache.json');
        initEmbeddingsCache(cachePath);
        setCachedEmbedding('test', fakeEmbedding(1));

        resetEmbeddingsCache();
        assert.equal(getCachedEmbedding('test'), null);
    });
});


// ═══════════════════════════════════════════════════════════════
// H. CACHE_TTL_MS — constante exportée
// ═══════════════════════════════════════════════════════════════

describe('H. CACHE_TTL_MS', () => {
    it('vaut 7 jours en millisecondes', () => {
        assert.equal(CACHE_TTL_MS, 7 * 24 * 60 * 60 * 1000);
        assert.equal(CACHE_TTL_MS, 604800000);
    });
});
