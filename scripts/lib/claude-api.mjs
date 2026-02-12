/**
 * Inflexion — Module API Claude centralisé
 *
 * Fournit des fonctions réutilisables pour appeler l'API Claude (Anthropic Messages API)
 * avec retry automatique, rate limiting, gestion d'erreurs et suivi des coûts.
 *
 * Usage :
 *   import { callClaude, callClaudeJSON, classifyText, getUsageStats } from './lib/claude-api.mjs';
 *
 * @requires ANTHROPIC_API_KEY dans les variables d'environnement
 */

// ─── Classes d'erreur ────────────────────────────────────────

/**
 * Erreur générique de l'API Claude.
 */
export class ClaudeAPIError extends Error {
    /**
     * @param {string} message
     * @param {number|null} statusCode - Code HTTP (null si pas de réponse)
     * @param {string|null} responseBody - Corps de la réponse brut
     */
    constructor(message, statusCode = null, responseBody = null) {
        super(message);
        this.name = 'ClaudeAPIError';
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }
}

/**
 * Erreur de dépassement de limite de débit (HTTP 429).
 */
export class ClaudeRateLimitError extends ClaudeAPIError {
    /**
     * @param {number|null} retryAfterMs - Délai avant réessai (ms), null si inconnu
     * @param {string|null} responseBody
     */
    constructor(retryAfterMs = null, responseBody = null) {
        super(
            `Limite de débit Claude atteinte${retryAfterMs ? ` (réessai dans ${retryAfterMs}ms)` : ''}`,
            429,
            responseBody
        );
        this.name = 'ClaudeRateLimitError';
        this.retryAfterMs = retryAfterMs;
    }
}

/**
 * Erreur de timeout de l'API Claude.
 */
export class ClaudeTimeoutError extends ClaudeAPIError {
    /**
     * @param {number} timeoutMs - Timeout en millisecondes
     */
    constructor(timeoutMs) {
        super(`Timeout Claude API après ${timeoutMs}ms`);
        this.name = 'ClaudeTimeoutError';
        this.timeoutMs = timeoutMs;
    }
}

/**
 * Erreur de parsing JSON de la réponse Claude.
 */
export class ClaudeJSONParseError extends ClaudeAPIError {
    /**
     * @param {string} rawText - Texte brut de la réponse
     * @param {Error} parseError - Erreur de parsing originale
     */
    constructor(rawText, parseError) {
        super(`Réponse Claude invalide (JSON attendu) : ${parseError.message}`);
        this.name = 'ClaudeJSONParseError';
        this.rawText = rawText;
        this.parseError = parseError;
    }
}

// ─── Configuration ───────────────────────────────────────────

/**
 * Configuration par défaut du module.
 * Peut être surchargée via les options de chaque appel.
 */
export const DEFAULT_CONFIG = {
    apiUrl: 'https://api.anthropic.com/v1/messages',
    apiVersion: '2023-06-01',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 2048,
    timeoutMs: 30_000,
    retry: {
        maxAttempts: 3,
        initialDelayMs: 1_000,
        maxDelayMs: 30_000,
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 529],
    },
    rateLimiter: {
        minDelayBetweenCallsMs: 250,
    },
    logging: {
        level: process.env.CLAUDE_LOG_LEVEL || 'info',
    },
};

// ─── Logger ──────────────────────────────────────────────────

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

/**
 * Crée un logger avec le niveau configuré.
 * @param {Object} config - Configuration contenant logging.level
 * @returns {Object} Logger avec méthodes debug/info/warn/error
 */
function createLogger(config) {
    const level = LOG_LEVELS[config?.logging?.level] ?? LOG_LEVELS.info;
    return {
        debug: (...args) => { if (level <= 0) console.debug('[Claude:DEBUG]', ...args); },
        info:  (...args) => { if (level <= 1) console.log('[Claude:INFO]', ...args); },
        warn:  (...args) => { if (level <= 2) console.warn('[Claude:WARN]', ...args); },
        error: (...args) => { if (level <= 3) console.error('[Claude:ERROR]', ...args); },
    };
}

// Logger par défaut (utilisé par les fonctions internes)
const log = createLogger(DEFAULT_CONFIG);

// ─── Rate Limiter ────────────────────────────────────────────

/** Timestamp du dernier appel API (module-level) */
let _lastCallTimestamp = 0;

/**
 * Impose un délai minimum entre chaque appel API.
 * @param {number} minDelayMs - Délai minimum en ms
 */
async function rateLimitDelay(minDelayMs) {
    const now = Date.now();
    const elapsed = now - _lastCallTimestamp;
    if (elapsed < minDelayMs) {
        const waitMs = minDelayMs - elapsed;
        await new Promise(r => setTimeout(r, waitMs));
    }
    _lastCallTimestamp = Date.now();
}

// ─── Suivi des coûts ─────────────────────────────────────────

/** Coûts approximatifs par million de tokens (USD) */
const TOKEN_COSTS = {
    'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },
    'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
};

/** Statistiques d'utilisation cumulées pour la session en cours */
const _usageStats = {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCalls: 0,
    callsByLabel: {},
};

/**
 * Enregistre l'utilisation de tokens pour un appel.
 * @param {Object} usage - Objet usage de la réponse API { input_tokens, output_tokens }
 * @param {string} model - Modèle utilisé
 * @param {string} label - Label de l'appel (pour le suivi)
 */
function _trackUsage(usage, model, label) {
    _usageStats.totalInputTokens += usage.input_tokens || 0;
    _usageStats.totalOutputTokens += usage.output_tokens || 0;
    _usageStats.totalCalls++;

    if (!_usageStats.callsByLabel[label]) {
        _usageStats.callsByLabel[label] = { calls: 0, inputTokens: 0, outputTokens: 0 };
    }
    _usageStats.callsByLabel[label].calls++;
    _usageStats.callsByLabel[label].inputTokens += usage.input_tokens || 0;
    _usageStats.callsByLabel[label].outputTokens += usage.output_tokens || 0;
}

/**
 * Retourne les statistiques d'utilisation de la session.
 * @returns {Object} Stats incluant tokens, appels, et coût estimé
 */
export function getUsageStats() {
    const model = DEFAULT_CONFIG.model;
    const costs = TOKEN_COSTS[model] || TOKEN_COSTS['claude-haiku-4-5-20251001'];
    const estimatedCost =
        (_usageStats.totalInputTokens / 1_000_000) * costs.input +
        (_usageStats.totalOutputTokens / 1_000_000) * costs.output;

    return {
        ...structuredClone(_usageStats),
        estimatedCostUSD: Math.round(estimatedCost * 10_000) / 10_000,
        model,
    };
}

/**
 * Remet les statistiques d'utilisation à zéro.
 */
export function resetUsageStats() {
    _usageStats.totalInputTokens = 0;
    _usageStats.totalOutputTokens = 0;
    _usageStats.totalCalls = 0;
    _usageStats.callsByLabel = {};
}

// ─── Fonction principale : callClaude ────────────────────────

/**
 * Appelle l'API Claude (Messages API) avec retry automatique et gestion d'erreurs.
 *
 * @param {Object} options
 * @param {string} options.systemPrompt - Prompt système
 * @param {string} options.userMessage - Message utilisateur
 * @param {number} [options.maxTokens] - Max tokens de réponse (défaut: 2048)
 * @param {number} [options.temperature] - Température (0-1, omis = défaut Anthropic)
 * @param {string} [options.model] - Modèle à utiliser
 * @param {number} [options.timeoutMs] - Timeout en ms (défaut: 30000)
 * @param {Object} [options.retry] - Config retry (surcharge DEFAULT_CONFIG.retry)
 * @param {string} [options.label] - Label pour les logs (ex: 'classification')
 * @returns {Promise<string>} Texte de la réponse Claude
 * @throws {ClaudeAPIError|ClaudeRateLimitError|ClaudeTimeoutError}
 */
export async function callClaude(options) {
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) {
        throw new ClaudeAPIError('ANTHROPIC_API_KEY non définie dans les variables d\'environnement');
    }

    const model = options.model ?? DEFAULT_CONFIG.model;
    const maxTokens = options.maxTokens ?? DEFAULT_CONFIG.maxTokens;
    const timeoutMs = options.timeoutMs ?? DEFAULT_CONFIG.timeoutMs;
    const label = options.label || 'call';
    const retryConfig = { ...DEFAULT_CONFIG.retry, ...(options.retry || {}) };
    const minDelay = DEFAULT_CONFIG.rateLimiter.minDelayBetweenCallsMs;

    let lastError = null;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
        try {
            // Rate limit entre les appels
            await rateLimitDelay(minDelay);

            log.debug(`[${label}] Tentative ${attempt}/${retryConfig.maxAttempts}`);

            // Construire le body de la requête
            const body = {
                model,
                max_tokens: maxTokens,
                system: options.systemPrompt,
                messages: [{ role: 'user', content: options.userMessage }],
            };
            if (options.temperature !== undefined) {
                body.temperature = options.temperature;
            }

            const response = await fetch(DEFAULT_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY,
                    'anthropic-version': DEFAULT_CONFIG.apiVersion,
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(timeoutMs),
            });

            // Gestion des erreurs HTTP
            if (!response.ok) {
                const responseText = await response.text();

                if (response.status === 429) {
                    const retryAfterHeader = response.headers.get('retry-after');
                    const retryAfterMs = retryAfterHeader
                        ? parseInt(retryAfterHeader, 10) * 1000
                        : null;
                    throw new ClaudeRateLimitError(retryAfterMs, responseText);
                }

                throw new ClaudeAPIError(
                    `Claude API ${response.status}: ${responseText.slice(0, 200)}`,
                    response.status,
                    responseText
                );
            }

            const data = await response.json();

            // Suivi des tokens
            if (data.usage) {
                _trackUsage(data.usage, model, label);
            }

            // Extraire le texte de la réponse
            const text = data.content?.[0]?.text;
            if (!text) {
                throw new ClaudeAPIError('Réponse Claude vide (pas de content[0].text)');
            }

            log.info(`[${label}] OK (${data.usage?.input_tokens ?? '?'}in/${data.usage?.output_tokens ?? '?'}out tokens)`);
            return text;

        } catch (err) {
            lastError = err;

            // Déterminer si l'erreur est retryable
            const isRetryable =
                err instanceof ClaudeRateLimitError ||
                (err instanceof ClaudeAPIError &&
                    retryConfig.retryableStatusCodes.includes(err.statusCode)) ||
                err.name === 'AbortError' ||
                err.name === 'TimeoutError';

            if (!isRetryable || attempt >= retryConfig.maxAttempts) {
                log.error(`[${label}] Échec définitif après ${attempt} tentative(s): ${err.message}`);
                throw err;
            }

            // Calcul du délai de backoff exponentiel
            let delayMs;
            if (err instanceof ClaudeRateLimitError && err.retryAfterMs) {
                delayMs = err.retryAfterMs;
            } else {
                delayMs = Math.min(
                    retryConfig.initialDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
                    retryConfig.maxDelayMs
                );
            }

            log.warn(`[${label}] Tentative ${attempt} échouée (${err.message}), retry dans ${delayMs}ms...`);
            await new Promise(r => setTimeout(r, delayMs));
        }
    }

    throw lastError;
}

// ─── Variante JSON : callClaudeJSON ──────────────────────────

/**
 * Appelle Claude et parse la réponse en JSON.
 * Gère automatiquement le stripping des marqueurs ```json```.
 *
 * @param {Object} options - Mêmes options que callClaude()
 * @param {Function} [options.validate] - Fonction de validation (data) => true|string
 *   Retourne true si valide, ou un message d'erreur (string) si invalide.
 * @returns {Promise<Object>} Objet JSON parsé
 * @throws {ClaudeJSONParseError} Si la réponse n'est pas du JSON valide
 */
export async function callClaudeJSON(options) {
    const rawText = await callClaude(options);

    // Strip les marqueurs de code Markdown
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '');
    }

    // Parser le JSON
    let parsed;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
        throw new ClaudeJSONParseError(rawText, parseErr);
    }

    // Validation optionnelle
    if (options.validate) {
        const validationResult = options.validate(parsed);
        if (validationResult !== true && validationResult !== undefined) {
            const msg = typeof validationResult === 'string'
                ? validationResult
                : 'Validation JSON échouée';
            throw new ClaudeAPIError(
                `${msg} — données: ${JSON.stringify(parsed).slice(0, 200)}`
            );
        }
    }

    return parsed;
}

// ─── Classification générique : classifyText ─────────────────

/**
 * Classifie un texte dans l'une des catégories fournies via Claude.
 *
 * @param {string} text - Texte à classifier
 * @param {string[]} categories - Liste des catégories possibles
 * @param {Object} [options]
 * @param {string} [options.context] - Contexte supplémentaire pour le prompt
 * @param {string} [options.label] - Label pour les logs (défaut: 'classify')
 * @param {string} [options.systemPrompt] - Prompt système personnalisé (optionnel)
 * @returns {Promise<string|null>} Catégorie choisie ou null si échec
 */
export async function classifyText(text, categories, options = {}) {
    const categoriesList = categories.join('\n- ');

    const systemPrompt = options.systemPrompt || `Tu es un classifieur de texte spécialisé en finance et géopolitique.
Réponds UNIQUEMENT par l'un de ces mots (sans explication, sans ponctuation) :
- ${categoriesList}`;

    const userMessage = `${options.context ? options.context + '\n\n' : ''}Classe ce texte dans la catégorie la plus pertinente.

Texte : ${text}

Catégorie :`;

    try {
        const result = await callClaude({
            systemPrompt,
            userMessage,
            maxTokens: 64,
            temperature: 0,
            label: options.label || 'classify',
        });

        const normalized = result.trim().toLowerCase().replace(/[^a-z_]/g, '');
        if (categories.includes(normalized)) {
            return normalized;
        }

        log.warn(`Classification invalide: "${result}" (attendu: ${categories.join(', ')})`);
        return null;
    } catch (err) {
        log.warn(`Classification échouée: ${err.message}`);
        return null;
    }
}
