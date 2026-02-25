/**
 * Tests unitaires — scripts/lib/rag-store.mjs (recherche hybride)
 *
 * Execution :  node --test scripts/tests/lib/rag-store.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zero dependance)
 *
 * Couvre :
 *   A. extractKeywords   (extraction mots-clés, stopwords FR/EN)
 *   B. keywordScore       (scoring lexical avec word boundaries)
 *   C. searchArticles     (recherche hybride vectorielle + lexicale)
 *   D. searchBriefings    (recherche hybride briefings)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import {
    extractKeywords,
    keywordScore,
    VECTOR_WEIGHT,
    KEYWORD_WEIGHT,
} from '../../lib/rag-store.mjs';
import { RAGStore } from '../../lib/rag-store.mjs';


// ─── Helpers ────────────────────────────────────────────────

/** Crée un faux embedding 384D (valeurs déterministes pour tests) */
function fakeEmbedding(seed = 0) {
    const vec = new Array(384);
    for (let i = 0; i < 384; i++) {
        vec[i] = Math.sin(seed * 100 + i) * 0.1;
    }
    // Normaliser L2
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return norm > 0 ? vec.map(v => v / norm) : vec;
}

/** Crée une entrée article pour le store */
function makeEntry(id, text, date = '2026-02-20', seed = 0) {
    return {
        id,
        text,
        embedding: fakeEmbedding(seed),
        metadata: { title: text.split('.')[0], source: 'Test', category: 'markets' },
        date,
    };
}

/** Crée un dossier temp pour les tests RAGStore */
function createTempRagDir() {
    const dir = join(tmpdir(), `inflexion-rag-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    return dir;
}


// ═══════════════════════════════════════════════════════════════
// A. extractKeywords — extraction de mots-clés
// ═══════════════════════════════════════════════════════════════

describe('A. extractKeywords', () => {
    it('retourne un tableau vide pour une entrée null/vide', () => {
        assert.deepEqual(extractKeywords(null), []);
        assert.deepEqual(extractKeywords(''), []);
        assert.deepEqual(extractKeywords(undefined), []);
    });

    it('extrait les mots significatifs et ignore les stopwords FR', () => {
        const kw = extractKeywords('La BCE maintient les taux directeurs');
        assert.ok(kw.includes('bce'));
        assert.ok(kw.includes('maintient'));
        assert.ok(kw.includes('taux'));
        assert.ok(kw.includes('directeurs'));
        // Stopwords exclus
        assert.ok(!kw.includes('la'));
        assert.ok(!kw.includes('les'));
    });

    it('extrait les mots significatifs et ignore les stopwords EN', () => {
        const kw = extractKeywords('The Fed is raising interest rates for the economy');
        assert.ok(kw.includes('fed'));
        assert.ok(kw.includes('raising'));
        assert.ok(kw.includes('interest'));
        assert.ok(kw.includes('rates'));
        // Stopwords exclus
        assert.ok(!kw.includes('the'));
        assert.ok(!kw.includes('is'));
        assert.ok(!kw.includes('for'));
    });

    it('conserve les acronymes et tickers (>=2 car.)', () => {
        const kw = extractKeywords('Le VIX monte, BTC en baisse et BCE prudente');
        assert.ok(kw.includes('vix'));
        assert.ok(kw.includes('btc'));
        assert.ok(kw.includes('bce'));
    });

    it('déduplique les mots-clés', () => {
        const kw = extractKeywords('BCE monte BCE baisse BCE stable');
        const bceCount = kw.filter(w => w === 'bce').length;
        assert.equal(bceCount, 1);
    });

    it('retire les accents pour normaliser', () => {
        const kw = extractKeywords('Géopolitique des marchés européens');
        assert.ok(kw.includes('geopolitique'));
        assert.ok(kw.includes('marches'));
        assert.ok(kw.includes('europeens'));
    });

    it('filtre les mots de moins de 2 caractères', () => {
        const kw = extractKeywords('a b c de or BCE');
        // 'a', 'b', 'c' < 2 car → exclus
        // 'de' est stopword → exclu
        // 'or' est stopword → exclu
        assert.ok(!kw.includes('a'));
        assert.ok(!kw.includes('b'));
        assert.ok(!kw.includes('c'));
        assert.ok(kw.includes('bce'));
    });
});


// ═══════════════════════════════════════════════════════════════
// B. keywordScore — scoring lexical
// ═══════════════════════════════════════════════════════════════

describe('B. keywordScore', () => {
    it('retourne 0 si aucun mot-clé ou texte vide', () => {
        assert.equal(keywordScore([], 'du texte'), 0);
        assert.equal(keywordScore(['bce'], ''), 0);
        assert.equal(keywordScore(['bce'], null), 0);
    });

    it('retourne 1.0 quand tous les mots-clés matchent', () => {
        const score = keywordScore(['bce', 'taux', 'inflation'], 'La BCE augmente les taux face à l\'inflation');
        assert.equal(score, 1.0);
    });

    it('retourne un score partiel quand seuls certains mots matchent', () => {
        const score = keywordScore(['bce', 'taux', 'recession'], 'La BCE augmente les taux');
        assert.ok(Math.abs(score - 2 / 3) < 0.01);
    });

    it('retourne 0 quand aucun mot ne matche', () => {
        const score = keywordScore(['bitcoin', 'ethereum'], 'La Fed augmente les taux directeurs');
        assert.equal(score, 0);
    });

    it('utilise word boundary pour les mots courts (<=4 car.)', () => {
        // "or" (gold) ne doit PAS matcher dans "Chamfort" ou "encore"
        const score = keywordScore(['or'], 'Alain Chamfort revient encore sur scène');
        assert.equal(score, 0);

        // "or" DOIT matcher dans "l\'or monte"
        const score2 = keywordScore(['or'], "Le cours de l'or monte fortement");
        assert.equal(score2, 1.0);
    });

    it('utilise substring pour les mots longs (>4 car.)', () => {
        const score = keywordScore(['inflation'], 'La désinflation se confirme');
        // "inflation" est dans "désinflation" en substring
        assert.equal(score, 1.0);
    });

    it('est insensible à la casse', () => {
        const score = keywordScore(['bce'], 'La BCE maintient ses taux');
        assert.equal(score, 1.0);
    });

    it('gère les accents dans le document', () => {
        const score = keywordScore(['geopolitique'], 'Analyse géopolitique des tensions');
        assert.equal(score, 1.0);
    });
});


// ═══════════════════════════════════════════════════════════════
// C. searchArticles — recherche hybride
// ═══════════════════════════════════════════════════════════════

describe('C. searchArticles (hybride)', () => {
    let store;
    let ragDir;

    beforeEach(() => {
        ragDir = createTempRagDir();
        store = new RAGStore(ragDir);

        // Pré-remplir le store avec des articles de test
        const articles = [
            makeEntry('art_bce', 'BCE augmente taux directeurs zone euro. Politique monétaire restrictive.', '2026-02-20', 1),
            makeEntry('art_vix', 'VIX en hausse : volatilité record sur les marchés US. S&P 500 en baisse.', '2026-02-19', 2),
            makeEntry('art_btc', 'Bitcoin BTC franchit les 100 000 dollars. Ethereum ETH suit la tendance.', '2026-02-20', 3),
            makeEntry('art_fed', 'La Fed maintient ses taux. Pas de pivot monétaire attendu.', '2026-02-18', 4),
            makeEntry('art_opec', 'OPEC réduit la production pétrolière. Le baril de Brent monte.', '2026-02-19', 5),
        ];
        writeFileSync(join(ragDir, 'articles.json'), JSON.stringify(articles), 'utf-8');
    });

    it('fonctionne en mode pur vectoriel quand queryText est absent', () => {
        const queryVec = fakeEmbedding(1); // Similaire à art_bce (seed=1)
        const results = store.searchArticles(queryVec, { topK: 3, minScore: 0 });
        assert.ok(results.length > 0);
        // Premier résultat devrait être art_bce (même seed)
        assert.equal(results[0].entry.id, 'art_bce');
    });

    it('booste les résultats contenant des acronymes quand queryText est fourni', () => {
        // Embedding qui ne favorise pas spécialement art_vix
        const queryVec = fakeEmbedding(99);
        // Sans queryText — résultats purement vectoriels
        const pureResults = store.searchArticles(queryVec, { topK: 5, minScore: 0 });

        // Avec queryText mentionnant "VIX" — le boost lexical doit remonter art_vix
        const hybridResults = store.searchArticles(queryVec, {
            topK: 5,
            minScore: 0,
            queryText: 'VIX volatilité marchés',
        });

        // Trouver la position de art_vix dans chaque liste
        const pureIdx = pureResults.findIndex(r => r.entry.id === 'art_vix');
        const hybridIdx = hybridResults.findIndex(r => r.entry.id === 'art_vix');

        // art_vix devrait être mieux classé (ou avoir un score plus élevé) en mode hybride
        const hybridVixScore = hybridResults.find(r => r.entry.id === 'art_vix')?.score || 0;
        const pureVixScore = pureResults.find(r => r.entry.id === 'art_vix')?.score || 0;
        assert.ok(hybridVixScore > pureVixScore, `Hybrid (${hybridVixScore}) devrait > Pure (${pureVixScore})`);
    });

    it('respecte le filtre excludeDate en mode hybride', () => {
        const queryVec = fakeEmbedding(1);
        const results = store.searchArticles(queryVec, {
            topK: 5,
            minScore: 0,
            queryText: 'BCE taux',
            excludeDate: '2026-02-20',
        });
        // art_bce est du 2026-02-20, il doit être exclu
        const hasBce = results.some(r => r.entry.id === 'art_bce');
        assert.equal(hasBce, false);
    });

    it('respecte topK en mode hybride', () => {
        const queryVec = fakeEmbedding(0);
        const results = store.searchArticles(queryVec, {
            topK: 2,
            minScore: 0,
            queryText: 'BCE VIX BTC Fed OPEC',
        });
        assert.ok(results.length <= 2);
    });

    it('le score hybride combine bien les deux poids', () => {
        // Art_bce a seed=1, queryVec aussi → score vectoriel ~1.0
        const queryVec = fakeEmbedding(1);
        const results = store.searchArticles(queryVec, {
            topK: 1,
            minScore: 0,
            queryText: 'BCE taux directeurs',
        });
        // Score = (cosinus * 0.7) + (keyword * 0.3)
        // cosinus ≈ 1.0, keyword ≈ 1.0 (BCE + taux + directeurs tous présents)
        // → score ≈ 0.7 + 0.3 = 1.0
        assert.ok(results[0].score > 0.9, `Score ${results[0].score} devrait être > 0.9`);
    });
});


// ═══════════════════════════════════════════════════════════════
// D. searchBriefings — recherche hybride
// ═══════════════════════════════════════════════════════════════

describe('D. searchBriefings (hybride)', () => {
    let store;
    let ragDir;

    beforeEach(() => {
        ragDir = createTempRagDir();
        store = new RAGStore(ragDir);

        const briefings = [
            makeEntry('briefing_2026-02-20', 'Tensions géopolitiques en mer Rouge. Impact sur le pétrole et les routes maritimes.', '2026-02-20', 10),
            makeEntry('briefing_2026-02-19', 'BCE hawkish, VIX en hausse, rotation defensive sur les marchés européens.', '2026-02-19', 11),
        ];
        writeFileSync(join(ragDir, 'briefings.json'), JSON.stringify(briefings), 'utf-8');
    });

    it('fonctionne en mode hybride sur les briefings', () => {
        const queryVec = fakeEmbedding(99);
        const results = store.searchBriefings(queryVec, {
            topK: 2,
            minScore: -1, // Aucun filtrage pour tester le ranking
            queryText: 'VIX BCE rotation marchés',
        });

        assert.ok(results.length > 0);
        // Le briefing mentionnant VIX et BCE devrait être en tête grâce au boost lexical
        assert.equal(results[0].entry.id, 'briefing_2026-02-19');
    });

    it('le boost lexical améliore le score du briefing pertinent', () => {
        const queryVec = fakeEmbedding(99);
        const pureResults = store.searchBriefings(queryVec, { topK: 2, minScore: -1 });
        const hybridResults = store.searchBriefings(queryVec, {
            topK: 2,
            minScore: -1,
            queryText: 'VIX BCE rotation',
        });

        const pureScore19 = pureResults.find(r => r.entry.id === 'briefing_2026-02-19')?.score || 0;
        const hybridScore19 = hybridResults.find(r => r.entry.id === 'briefing_2026-02-19')?.score || 0;
        assert.ok(hybridScore19 > pureScore19, `Hybrid (${hybridScore19}) devrait > Pure (${pureScore19})`);
    });

    it('fonctionne en mode pur vectoriel sans queryText', () => {
        const queryVec = fakeEmbedding(10);
        const results = store.searchBriefings(queryVec, { topK: 2, minScore: -1 });
        assert.ok(results.length > 0);
        assert.equal(results[0].entry.id, 'briefing_2026-02-20');
    });
});
