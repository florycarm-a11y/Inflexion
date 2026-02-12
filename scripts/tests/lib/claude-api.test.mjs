/**
 * Tests unitaires — scripts/lib/claude-api.mjs
 *
 * Exécution :  node --test scripts/tests/lib/claude-api.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zéro dépendance)
 */

import { describe, it, before, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Supprimer les logs du module pendant les tests
process.env.CLAUDE_LOG_LEVEL = 'silent';

import {
    ClaudeAPIError,
    ClaudeRateLimitError,
    ClaudeTimeoutError,
    ClaudeJSONParseError,
    DEFAULT_CONFIG,
    callClaude,
    callClaudeJSON,
    classifyText,
    getUsageStats,
    resetUsageStats,
} from '../../lib/claude-api.mjs';

// ─── Helpers ─────────────────────────────────────────────────

const originalFetch = globalThis.fetch;

/** Sauvegarde et restauration de l'état global */
function saveEnv() {
    return {
        apiKey: process.env.ANTHROPIC_API_KEY,
        fetch: globalThis.fetch,
        minDelay: DEFAULT_CONFIG.rateLimiter.minDelayBetweenCallsMs,
        retry: { ...DEFAULT_CONFIG.retry },
    };
}

function restoreEnv(saved) {
    if (saved.apiKey === undefined) {
        delete process.env.ANTHROPIC_API_KEY;
    } else {
        process.env.ANTHROPIC_API_KEY = saved.apiKey;
    }
    globalThis.fetch = saved.fetch;
    DEFAULT_CONFIG.rateLimiter.minDelayBetweenCallsMs = saved.minDelay;
    Object.assign(DEFAULT_CONFIG.retry, saved.retry);
}

/**
 * Crée une réponse API Claude succès standard.
 * @param {string} text - Texte de la réponse
 * @param {Object} [usage] - Tokens utilisés
 */
function makeSuccessBody(text, usage = { input_tokens: 100, output_tokens: 50 }) {
    return {
        content: [{ type: 'text', text }],
        usage,
        model: DEFAULT_CONFIG.model,
    };
}

/**
 * Mock globalThis.fetch avec une séquence de réponses.
 * Chaque réponse : { status, body, headers? }
 * Enregistre les appels dans calls[].
 */
function mockFetch(responses) {
    const calls = [];
    let callIndex = 0;
    globalThis.fetch = async (url, opts) => {
        calls.push({ url, opts, body: opts?.body ? JSON.parse(opts.body) : null });
        const resp = responses[Math.min(callIndex++, responses.length - 1)];
        const headersMap = new Map(Object.entries(resp.headers || {}));
        return {
            ok: resp.status >= 200 && resp.status < 300,
            status: resp.status,
            headers: { get: (k) => headersMap.get(k) ?? null },
            text: async () => typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body),
            json: async () => typeof resp.body === 'string' ? JSON.parse(resp.body) : resp.body,
        };
    };
    return calls;
}

/** Options rapides pour les tests de retry (délais minimes) */
const FAST_RETRY = { maxAttempts: 3, initialDelayMs: 1, maxDelayMs: 10, backoffMultiplier: 2 };

/** Options de base pour callClaude */
function baseOpts(overrides = {}) {
    return {
        systemPrompt: 'Tu es un assistant.',
        userMessage: 'Bonjour',
        label: 'test',
        retry: FAST_RETRY,
        ...overrides,
    };
}

// ═══════════════════════════════════════════════════════════════
// A. Classes d'erreur
// ═══════════════════════════════════════════════════════════════

describe('ClaudeAPIError', () => {
    it('hérite de Error avec les propriétés correctes', () => {
        const err = new ClaudeAPIError('test error', 500, '{"error":"internal"}');
        assert.ok(err instanceof Error);
        assert.equal(err.name, 'ClaudeAPIError');
        assert.equal(err.message, 'test error');
        assert.equal(err.statusCode, 500);
        assert.equal(err.responseBody, '{"error":"internal"}');
    });

    it('accepte des valeurs par défaut null', () => {
        const err = new ClaudeAPIError('minimal');
        assert.equal(err.statusCode, null);
        assert.equal(err.responseBody, null);
    });
});

describe('ClaudeRateLimitError', () => {
    it('hérite de ClaudeAPIError avec statusCode 429', () => {
        const err = new ClaudeRateLimitError(5000, 'rate limited');
        assert.ok(err instanceof ClaudeAPIError);
        assert.ok(err instanceof Error);
        assert.equal(err.name, 'ClaudeRateLimitError');
        assert.equal(err.statusCode, 429);
        assert.equal(err.retryAfterMs, 5000);
        assert.equal(err.responseBody, 'rate limited');
        assert.ok(err.message.includes('5000ms'));
    });

    it('fonctionne sans retryAfterMs', () => {
        const err = new ClaudeRateLimitError();
        assert.equal(err.retryAfterMs, null);
        assert.equal(err.statusCode, 429);
        assert.ok(!err.message.includes('réessai dans'));
    });
});

describe('ClaudeTimeoutError', () => {
    it('stocke timeoutMs et formate le message', () => {
        const err = new ClaudeTimeoutError(30000);
        assert.ok(err instanceof ClaudeAPIError);
        assert.equal(err.name, 'ClaudeTimeoutError');
        assert.equal(err.timeoutMs, 30000);
        assert.ok(err.message.includes('30000ms'));
    });
});

describe('ClaudeJSONParseError', () => {
    it('conserve rawText et parseError', () => {
        const parseErr = new SyntaxError('Unexpected token');
        const err = new ClaudeJSONParseError('not json', parseErr);
        assert.ok(err instanceof ClaudeAPIError);
        assert.equal(err.name, 'ClaudeJSONParseError');
        assert.equal(err.rawText, 'not json');
        assert.equal(err.parseError, parseErr);
        assert.ok(err.message.includes('Unexpected token'));
    });
});

// ═══════════════════════════════════════════════════════════════
// B. getUsageStats / resetUsageStats
// ═══════════════════════════════════════════════════════════════

describe('getUsageStats / resetUsageStats', () => {
    let saved;

    beforeEach(() => {
        saved = saveEnv();
        process.env.ANTHROPIC_API_KEY = 'test-key';
        DEFAULT_CONFIG.rateLimiter.minDelayBetweenCallsMs = 0;
        resetUsageStats();
    });

    afterEach(() => {
        restoreEnv(saved);
    });

    it('retourne la structure initiale correcte', () => {
        const stats = getUsageStats();
        assert.equal(stats.totalInputTokens, 0);
        assert.equal(stats.totalOutputTokens, 0);
        assert.equal(stats.totalCalls, 0);
        assert.deepEqual(stats.callsByLabel, {});
        assert.equal(stats.estimatedCostUSD, 0);
        assert.equal(stats.model, DEFAULT_CONFIG.model);
    });

    it('accumule les tokens après un appel réussi', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('ok', { input_tokens: 200, output_tokens: 100 }) }]);
        await callClaude(baseOpts());
        const stats = getUsageStats();
        assert.equal(stats.totalInputTokens, 200);
        assert.equal(stats.totalOutputTokens, 100);
        assert.equal(stats.totalCalls, 1);
        assert.equal(stats.callsByLabel.test.calls, 1);
    });

    it('calcule le coût estimé correctement', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('ok', { input_tokens: 1_000_000, output_tokens: 1_000_000 }) }]);
        await callClaude(baseOpts());
        const stats = getUsageStats();
        // Coût = (1M / 1M) * 0.80 + (1M / 1M) * 4.00 = 4.80
        assert.equal(stats.estimatedCostUSD, 4.8);
    });

    it('resetUsageStats remet tout à zéro', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('ok') }]);
        await callClaude(baseOpts());
        resetUsageStats();
        const stats = getUsageStats();
        assert.equal(stats.totalCalls, 0);
        assert.equal(stats.totalInputTokens, 0);
        assert.equal(stats.totalOutputTokens, 0);
        assert.deepEqual(stats.callsByLabel, {});
    });
});

// ═══════════════════════════════════════════════════════════════
// C. callClaude
// ═══════════════════════════════════════════════════════════════

describe('callClaude', () => {
    let saved;

    beforeEach(() => {
        saved = saveEnv();
        process.env.ANTHROPIC_API_KEY = 'test-key-123';
        DEFAULT_CONFIG.rateLimiter.minDelayBetweenCallsMs = 0;
        resetUsageStats();
    });

    afterEach(() => {
        restoreEnv(saved);
    });

    it('lève ClaudeAPIError si ANTHROPIC_API_KEY absente', async () => {
        delete process.env.ANTHROPIC_API_KEY;
        await assert.rejects(
            () => callClaude(baseOpts()),
            (err) => {
                assert.ok(err instanceof ClaudeAPIError);
                assert.ok(err.message.includes('ANTHROPIC_API_KEY'));
                return true;
            }
        );
    });

    it('envoie les bons headers', async () => {
        const calls = mockFetch([{ status: 200, body: makeSuccessBody('ok') }]);
        await callClaude(baseOpts());

        assert.equal(calls.length, 1);
        const headers = calls[0].opts.headers;
        assert.equal(headers['Content-Type'], 'application/json');
        assert.equal(headers['x-api-key'], 'test-key-123');
        assert.equal(headers['anthropic-version'], DEFAULT_CONFIG.apiVersion);
    });

    it('envoie le bon body avec model, max_tokens, system, messages', async () => {
        const calls = mockFetch([{ status: 200, body: makeSuccessBody('ok') }]);
        await callClaude(baseOpts({ systemPrompt: 'Sys', userMessage: 'Msg' }));

        const body = calls[0].body;
        assert.equal(body.model, DEFAULT_CONFIG.model);
        assert.equal(body.max_tokens, DEFAULT_CONFIG.maxTokens);
        assert.equal(body.system, 'Sys');
        assert.deepEqual(body.messages, [{ role: 'user', content: 'Msg' }]);
    });

    it('inclut temperature uniquement si spécifiée', async () => {
        const calls = mockFetch([
            { status: 200, body: makeSuccessBody('a') },
            { status: 200, body: makeSuccessBody('b') },
        ]);

        await callClaude(baseOpts());
        assert.equal(calls[0].body.temperature, undefined);

        await callClaude(baseOpts({ temperature: 0.5 }));
        assert.equal(calls[1].body.temperature, 0.5);
    });

    it('retourne le texte de content[0].text', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('Hello Inflexion') }]);
        const result = await callClaude(baseOpts());
        assert.equal(result, 'Hello Inflexion');
    });

    it('accepte les surcharges model, maxTokens', async () => {
        const calls = mockFetch([{ status: 200, body: makeSuccessBody('ok') }]);
        await callClaude(baseOpts({ model: 'custom-model', maxTokens: 512 }));

        assert.equal(calls[0].body.model, 'custom-model');
        assert.equal(calls[0].body.max_tokens, 512);
    });

    it('lève ClaudeAPIError sur réponse vide (pas de content)', async () => {
        mockFetch([{ status: 200, body: { content: [], usage: { input_tokens: 10, output_tokens: 0 } } }]);
        await assert.rejects(
            () => callClaude(baseOpts()),
            (err) => {
                assert.ok(err instanceof ClaudeAPIError);
                assert.ok(err.message.includes('vide'));
                return true;
            }
        );
    });

    it('lève ClaudeAPIError sur erreur HTTP non retryable (400)', async () => {
        mockFetch([{ status: 400, body: 'Bad request' }]);
        await assert.rejects(
            () => callClaude(baseOpts()),
            (err) => {
                assert.ok(err instanceof ClaudeAPIError);
                assert.equal(err.statusCode, 400);
                return true;
            }
        );
    });

    it('ne retry pas sur 401/403', async () => {
        const calls = mockFetch([{ status: 401, body: 'Unauthorized' }]);
        await assert.rejects(() => callClaude(baseOpts()));
        assert.equal(calls.length, 1); // Un seul appel, pas de retry
    });

    it('retry sur 429 puis réussit', async () => {
        const calls = mockFetch([
            { status: 429, body: 'rate limited' },
            { status: 200, body: makeSuccessBody('retried ok') },
        ]);
        const result = await callClaude(baseOpts());
        assert.equal(result, 'retried ok');
        assert.equal(calls.length, 2);
    });

    it('retry sur 500/502/503/529 puis réussit', async () => {
        for (const status of [500, 502, 503, 529]) {
            resetUsageStats();
            const calls = mockFetch([
                { status, body: 'server error' },
                { status: 200, body: makeSuccessBody(`ok after ${status}`) },
            ]);
            const result = await callClaude(baseOpts());
            assert.equal(result, `ok after ${status}`);
            assert.equal(calls.length, 2);
        }
    });

    it('lève après épuisement des tentatives de retry', async () => {
        mockFetch([
            { status: 500, body: 'err1' },
            { status: 500, body: 'err2' },
            { status: 500, body: 'err3' },
        ]);
        await assert.rejects(
            () => callClaude(baseOpts()),
            (err) => {
                assert.ok(err instanceof ClaudeAPIError);
                assert.equal(err.statusCode, 500);
                return true;
            }
        );
    });

    it('respecte le header retry-after sur 429', async () => {
        const calls = mockFetch([
            { status: 429, body: 'rate limited', headers: { 'retry-after': '1' } },
            { status: 200, body: makeSuccessBody('ok') },
        ]);
        await callClaude(baseOpts());
        // Vérifie que le retry a lieu et que la réponse finale est correcte
        assert.equal(calls.length, 2);
    });

    it('envoie vers la bonne URL (DEFAULT_CONFIG.apiUrl)', async () => {
        const calls = mockFetch([{ status: 200, body: makeSuccessBody('ok') }]);
        await callClaude(baseOpts());
        assert.equal(calls[0].url, DEFAULT_CONFIG.apiUrl);
    });
});

// ═══════════════════════════════════════════════════════════════
// D. callClaudeJSON
// ═══════════════════════════════════════════════════════════════

describe('callClaudeJSON', () => {
    let saved;

    beforeEach(() => {
        saved = saveEnv();
        process.env.ANTHROPIC_API_KEY = 'test-key';
        DEFAULT_CONFIG.rateLimiter.minDelayBetweenCallsMs = 0;
        resetUsageStats();
    });

    afterEach(() => {
        restoreEnv(saved);
    });

    it('parse du JSON valide', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('{"titre":"Test","score":42}') }]);
        const result = await callClaudeJSON(baseOpts());
        assert.deepEqual(result, { titre: 'Test', score: 42 });
    });

    it('strip les marqueurs ```json ```', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('```json\n{"a":1}\n```') }]);
        const result = await callClaudeJSON(baseOpts());
        assert.deepEqual(result, { a: 1 });
    });

    it('strip les marqueurs ``` ``` sans json', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('```\n{"b":2}\n```') }]);
        const result = await callClaudeJSON(baseOpts());
        assert.deepEqual(result, { b: 2 });
    });

    it('lève ClaudeJSONParseError sur JSON invalide', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('ceci n\'est pas du JSON') }]);
        await assert.rejects(
            () => callClaudeJSON(baseOpts()),
            (err) => {
                assert.ok(err instanceof ClaudeJSONParseError);
                assert.equal(err.rawText, 'ceci n\'est pas du JSON');
                assert.ok(err.parseError instanceof SyntaxError);
                return true;
            }
        );
    });

    it('appelle validate() et retourne si valide (true)', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('{"titre":"OK"}') }]);
        const result = await callClaudeJSON(baseOpts({
            validate: (data) => {
                if (!data.titre) return 'Champ titre manquant';
                return true;
            },
        }));
        assert.deepEqual(result, { titre: 'OK' });
    });

    it('lève ClaudeAPIError si validate() retourne un message d\'erreur', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('{"foo":"bar"}') }]);
        await assert.rejects(
            () => callClaudeJSON(baseOpts({
                validate: (data) => {
                    if (!data.titre) return 'Champ titre manquant';
                    return true;
                },
            })),
            (err) => {
                assert.ok(err instanceof ClaudeAPIError);
                assert.ok(err.message.includes('Champ titre manquant'));
                return true;
            }
        );
    });
});

// ═══════════════════════════════════════════════════════════════
// E. classifyText
// ═══════════════════════════════════════════════════════════════

describe('classifyText', () => {
    let saved;

    beforeEach(() => {
        saved = saveEnv();
        process.env.ANTHROPIC_API_KEY = 'test-key';
        DEFAULT_CONFIG.rateLimiter.minDelayBetweenCallsMs = 0;
        // classifyText uses DEFAULT_CONFIG.retry internally, make it fast
        Object.assign(DEFAULT_CONFIG.retry, FAST_RETRY);
        resetUsageStats();
    });

    afterEach(() => {
        restoreEnv(saved);
    });

    const categories = ['crypto', 'marches', 'geopolitique'];

    it('retourne la catégorie correspondante (normalisée)', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('  Crypto  ') }]);
        const result = await classifyText('Bitcoin monte', categories);
        assert.equal(result, 'crypto');
    });

    it('retourne null si la réponse ne correspond à aucune catégorie', async () => {
        mockFetch([{ status: 200, body: makeSuccessBody('sport') }]);
        const result = await classifyText('Match de foot', categories);
        assert.equal(result, null);
    });

    it('retourne null en cas d\'erreur API', async () => {
        mockFetch([{ status: 500, body: 'error' }]);
        const result = await classifyText('Test', categories, {
            label: 'classify-test',
        });
        assert.equal(result, null);
    });

    it('utilise le systemPrompt personnalisé si fourni', async () => {
        const calls = mockFetch([{ status: 200, body: makeSuccessBody('marches') }]);
        await classifyText('Test', categories, {
            systemPrompt: 'Custom prompt',
        });
        assert.equal(calls[0].body.system, 'Custom prompt');
    });

    it('utilise temperature: 0 et maxTokens: 64', async () => {
        const calls = mockFetch([{ status: 200, body: makeSuccessBody('geopolitique') }]);
        await classifyText('Guerre en Ukraine', categories);
        assert.equal(calls[0].body.temperature, 0);
        assert.equal(calls[0].body.max_tokens, 64);
    });
});
