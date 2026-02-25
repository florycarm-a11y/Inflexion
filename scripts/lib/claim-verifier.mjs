/**
 * Inflexion — Évaluateur anti-hallucination (Sprint 2)
 *
 * Vérifie que les claims factuelles (prix, %, indicateurs) du briefing
 * stratégique sont traçables dans les données sources. Aucun appel API,
 * aucune dépendance externe — logique purement locale.
 *
 * Architecture :
 *   1. buildReferenceMap(sources)     → dictionnaire de toutes les valeurs connues
 *   2. extractClaims(text)            → extraction regex des claims numériques
 *   3. verifyClaims(claims, refMap)   → matching avec tolérance
 *   4. evaluateBriefing(briefing, sources) → rapport complet
 */

// ─── Configuration ──────────────────────────────────────────

/** Tolérance relative pour le matching des prix (1% = 0.01) */
export const PRICE_TOLERANCE = 0.01;

/** Tolérance absolue pour le matching des pourcentages (en points) */
export const PCT_TOLERANCE = 0.5;

/** Score minimum acceptable (0-1). En dessous, le briefing est flaggé. */
export const MIN_ACCEPTABLE_SCORE = 0.6;

// ─── 1. Construction du dictionnaire de référence ───────────

/**
 * Construit un dictionnaire plat de toutes les valeurs numériques traçables
 * depuis les sources de données Inflexion.
 *
 * Chaque entrée : { value: number, label: string, source: string, type: 'price'|'pct'|'value' }
 *
 * @param {Object} sources — Les fichiers JSON chargés par generate-daily-briefing
 * @returns {Map<string, {value: number, label: string, source: string, type: string}>}
 */
export function buildReferenceMap(sources) {
    const refs = new Map();

    function add(key, value, label, source, type = 'value') {
        if (value == null || isNaN(value)) return;
        refs.set(key, { value: Number(value), label, source, type });
    }

    // ── Markets (Finnhub ETF proxies) ─────────────────────
    if (sources.markets?.quotes) {
        for (const q of sources.markets.quotes) {
            const sym = q.symbol?.toLowerCase();
            if (sym) {
                add(`${sym}_price`, q.price, `${q.name} (${q.symbol})`, 'Finnhub', 'price');
                add(`${sym}_change`, q.change, `${q.name} variation`, 'Finnhub', 'pct');
            }
        }
    }

    // ── Crypto (CoinGecko) ────────────────────────────────
    if (sources.crypto?.prices) {
        for (const c of sources.crypto.prices) {
            const sym = c.symbol?.toLowerCase();
            if (sym) {
                add(`${sym}_price`, c.price, `${c.name} (${c.symbol})`, 'CoinGecko', 'price');
                add(`${sym}_24h`, c.change_24h, `${c.name} 24h`, 'CoinGecko', 'pct');
                add(`${sym}_7d`, c.change_7d, `${c.name} 7j`, 'CoinGecko', 'pct');
            }
        }
        if (sources.crypto.global) {
            const g = sources.crypto.global;
            if (g.market_cap_change_24h != null) {
                add('crypto_mcap_24h', g.market_cap_change_24h, 'Market cap crypto 24h', 'CoinGecko', 'pct');
            }
            if (g.eth_dominance != null) {
                add('eth_dominance', g.eth_dominance, 'Dominance ETH', 'CoinGecko', 'pct');
            }
        }
    }

    // ── Fear & Greed ──────────────────────────────────────
    if (sources.fearGreed?.current) {
        add('fng_value', sources.fearGreed.current.value, 'Fear & Greed Index', 'Alternative.me', 'value');
        if (sources.fearGreed.changes) {
            add('fng_week', sources.fearGreed.changes.week, 'FNG var. 7j', 'Alternative.me', 'value');
            add('fng_month', sources.fearGreed.changes.month, 'FNG var. 30j', 'Alternative.me', 'value');
        }
    }

    // ── Macro US (FRED) ───────────────────────────────────
    if (sources.macro?.indicators) {
        for (const ind of sources.macro.indicators) {
            const key = ind.label?.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (key) {
                add(`fred_${key}`, ind.value, ind.label, 'FRED', ind.unit === '%' ? 'pct' : 'value');
                if (ind.change != null) {
                    add(`fred_${key}_change`, ind.change, `${ind.label} variation`, 'FRED', 'pct');
                }
            }
        }
    }

    // ── Global Macro (BCE + VIX) ──────────────────────────
    if (sources.globalMacro) {
        const gm = sources.globalMacro;
        if (gm.volatility?.vix) {
            add('vix_value', gm.volatility.vix.value, 'VIX', 'CBOE', 'value');
            add('vix_change', gm.volatility.vix.change, 'VIX variation', 'CBOE', 'pct');
        }
        if (gm.ecb?.main_rate) {
            add('ecb_rate', gm.ecb.main_rate.value, 'Taux directeur BCE', 'ECB', 'pct');
        }
        if (gm.ecb?.eurusd) {
            add('eurusd', gm.ecb.eurusd.rate, 'EUR/USD', 'ECB', 'price');
        }
    }

    // ── Commodités (metals.dev) ───────────────────────────
    if (sources.commodities) {
        if (sources.commodities.metals) {
            for (const [key, m] of Object.entries(sources.commodities.metals)) {
                add(`metal_${key}`, m.price_usd, m.label, 'metals.dev', 'price');
            }
        }
        if (sources.commodities.industrial) {
            for (const [key, m] of Object.entries(sources.commodities.industrial)) {
                add(`industrial_${key}`, m.price_usd_kg, m.label, 'metals.dev', 'price');
            }
        }
    }

    // ── Indices européens (Twelve Data) ───────────────────
    if (sources.europeanMarkets?.indices) {
        for (const idx of sources.europeanMarkets.indices) {
            const key = idx.name?.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (key) {
                add(`eu_${key}`, idx.close, idx.name, 'Twelve Data', 'price');
                add(`eu_${key}_change`, idx.change_pct, `${idx.name} variation`, 'Twelve Data', 'pct');
            }
        }
    }

    // ── DeFi (DefiLlama) ──────────────────────────────────
    if (sources.defi?.topProtocols) {
        for (const p of sources.defi.topProtocols.slice(0, 10)) {
            const key = p.name?.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (key) {
                add(`defi_${key}_tvl`, p.tvl, `${p.name} TVL`, 'DefiLlama', 'price');
                if (p.change_1d != null) {
                    add(`defi_${key}_change`, p.change_1d, `${p.name} 24h`, 'DefiLlama', 'pct');
                }
            }
        }
    }

    // ── Forex (Alpha Vantage) ─────────────────────────────
    if (sources.alphaVantage?.forex) {
        for (const fx of sources.alphaVantage.forex) {
            const key = fx.pair?.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (key) {
                add(`fx_${key}`, fx.rate, fx.pair, 'Alpha Vantage', 'price');
            }
        }
    }

    // ── On-chain (Etherscan + Mempool) ────────────────────
    if (sources.onchain) {
        if (sources.onchain.eth_gas) {
            add('eth_gas_low', sources.onchain.eth_gas.low, 'ETH Gas (low)', 'Etherscan', 'value');
            add('eth_gas_standard', sources.onchain.eth_gas.standard, 'ETH Gas (standard)', 'Etherscan', 'value');
            add('eth_gas_fast', sources.onchain.eth_gas.fast, 'ETH Gas (fast)', 'Etherscan', 'value');
        }
        if (sources.onchain.btc_fees) {
            add('btc_fee_30min', sources.onchain.btc_fees.half_hour, 'BTC Fee 30min', 'Mempool', 'value');
        }
        if (sources.onchain.btc_mining) {
            add('btc_hashrate', sources.onchain.btc_mining.hashrate_eh, 'BTC Hashrate', 'Mempool', 'value');
        }
    }

    return refs;
}

// ─── 2. Extraction des claims numériques ────────────────────

/**
 * Extrait les claims factuelles (nombres avec contexte) du texte du briefing.
 * Gère les formats FR et EN : $63 000, 63.000$, +2,5%, 25,3 points, etc.
 *
 * @param {string} text — Texte brut du briefing (synthèse + signaux + risques)
 * @returns {Array<{raw: string, value: number, type: string, context: string}>}
 */
export function extractClaims(text) {
    if (!text || typeof text !== 'string') return [];

    const claims = [];
    // Normaliser les espaces insécables et narrow no-break spaces
    const normalized = text.replace(/[\u00A0\u202F]/g, ' ');

    // Pattern 1 : Prix en dollars — $63 000, $2 948/oz, $63,000
    const priceRegex = /\$\s?([\d]+(?:[\s,.][\d]{3})*(?:[.,]\d{1,2})?)\s?(?:\/\w+)?/g;
    let match;
    while ((match = priceRegex.exec(normalized)) !== null) {
        const raw = match[0].trim();
        const numStr = match[1].replace(/[\s,]/g, '').replace(',', '.');
        const value = parseFloat(numStr);
        if (!isNaN(value) && value > 0) {
            const start = Math.max(0, match.index - 40);
            const end = Math.min(normalized.length, match.index + match[0].length + 40);
            claims.push({ raw, value, type: 'price', context: normalized.slice(start, end).trim() });
        }
    }

    // Pattern 2 : Pourcentages — +2,5%, -0.8%, 17.2%
    const pctRegex = /([+-]?\d+(?:[.,]\d{1,2})?)\s?%/g;
    while ((match = pctRegex.exec(normalized)) !== null) {
        const raw = match[0].trim();
        const numStr = match[1].replace(',', '.');
        const value = parseFloat(numStr);
        if (!isNaN(value)) {
            const start = Math.max(0, match.index - 40);
            const end = Math.min(normalized.length, match.index + match[0].length + 40);
            claims.push({ raw, value, type: 'pct', context: normalized.slice(start, end).trim() });
        }
    }

    // Pattern 3 : Valeurs avec unités — 25,3 points, 4.08 gwei, 650 EH/s
    const unitRegex = /(\d+(?:[.,]\d{1,2})?)\s*(?:points?|gwei|sat\/vB|EH\/s|pts)/gi;
    while ((match = unitRegex.exec(normalized)) !== null) {
        const raw = match[0].trim();
        const numStr = match[1].replace(',', '.');
        const value = parseFloat(numStr);
        if (!isNaN(value)) {
            const start = Math.max(0, match.index - 40);
            const end = Math.min(normalized.length, match.index + match[0].length + 40);
            claims.push({ raw, value, type: 'value', context: normalized.slice(start, end).trim() });
        }
    }

    // Pattern 4 : Score X/100 — 25/100
    const scoreRegex = /(\d+)\/100/g;
    while ((match = scoreRegex.exec(normalized)) !== null) {
        const raw = match[0];
        const value = parseInt(match[1], 10);
        if (!isNaN(value)) {
            const start = Math.max(0, match.index - 40);
            const end = Math.min(normalized.length, match.index + match[0].length + 40);
            claims.push({ raw, value, type: 'value', context: normalized.slice(start, end).trim() });
        }
    }

    return claims;
}

// ─── 3. Vérification des claims ─────────────────────────────

/**
 * Vérifie chaque claim contre le dictionnaire de référence.
 * Matching par valeur avec tolérance, pas par clé — le briefing
 * peut reformuler "Bitcoin" en "BTC" ou "l'or" en "gold".
 *
 * @param {Array} claims — Claims extraites du briefing
 * @param {Map} refMap — Dictionnaire de référence
 * @returns {Array<{claim: Object, status: 'verified'|'unverified'|'approximate', match: Object|null, delta: number|null}>}
 */
export function verifyClaims(claims, refMap) {
    const results = [];

    for (const claim of claims) {
        let bestMatch = null;
        let bestDelta = Infinity;
        let bestStatus = 'unverified';

        for (const [, ref] of refMap) {
            // Matching par type compatible
            if (claim.type === 'price' && ref.type !== 'price') continue;
            if (claim.type === 'pct' && ref.type !== 'pct') continue;

            const delta = Math.abs(claim.value - ref.value);
            const tolerance = claim.type === 'pct'
                ? PCT_TOLERANCE
                : Math.max(ref.value * PRICE_TOLERANCE, 0.5); // Au moins 0.5 d'écart absolu

            if (delta < bestDelta) {
                bestDelta = delta;
                if (delta <= tolerance) {
                    bestMatch = ref;
                    bestStatus = delta === 0 ? 'verified' : 'approximate';
                } else if (delta <= tolerance * 3 && bestMatch === null) {
                    // Matching souple — pas assez proche pour valider, mais on note la référence
                    bestMatch = ref;
                    bestStatus = 'unverified';
                }
            }
        }

        // Pour les claims de type 'value', matcher aussi contre les prix et %
        if (bestStatus === 'unverified' && claim.type === 'value') {
            for (const [, ref] of refMap) {
                const delta = Math.abs(claim.value - ref.value);
                const tolerance = ref.type === 'pct'
                    ? PCT_TOLERANCE
                    : Math.max(ref.value * PRICE_TOLERANCE, 0.5);

                if (delta <= tolerance && delta < bestDelta) {
                    bestDelta = delta;
                    bestMatch = ref;
                    bestStatus = delta === 0 ? 'verified' : 'approximate';
                }
            }
        }

        results.push({
            claim,
            status: bestStatus,
            match: bestMatch,
            delta: bestMatch ? bestDelta : null,
        });
    }

    return results;
}

// ─── 4. Évaluation complète du briefing ─────────────────────

/**
 * Extrait tout le texte analysable du briefing structuré.
 * @param {Object} briefing — Briefing JSON généré par Claude
 * @returns {string} Texte concaténé
 */
export function flattenBriefingText(briefing) {
    const parts = [];

    if (briefing.synthese?.contenu) parts.push(briefing.synthese.contenu);
    if (briefing.synthese?.titre) parts.push(briefing.synthese.titre);

    if (briefing.signaux) {
        for (const s of briefing.signaux) {
            if (s.titre) parts.push(s.titre);
            if (s.description) parts.push(s.description);
            if (s.interconnexions) {
                for (const ic of s.interconnexions) {
                    parts.push(typeof ic === 'string' ? ic : ic.description || '');
                }
            }
        }
    }

    if (briefing.risk_radar) {
        for (const r of briefing.risk_radar) {
            if (r.risque) parts.push(r.risque);
            if (r.description) parts.push(r.description);
        }
    }

    return parts.join('\n');
}

/**
 * Évalue un briefing contre ses sources de données.
 *
 * @param {Object} briefing — Briefing JSON (sortie Claude)
 * @param {Object} sources — Données sources (même format que generate-daily-briefing)
 * @returns {{
 *   score: number,           — Score de vérifiabilité (0-1)
 *   totalClaims: number,     — Nombre total de claims extraites
 *   verified: number,        — Claims vérifiées (exact ou approché)
 *   unverified: number,      — Claims non traçables
 *   pass: boolean,           — true si score >= MIN_ACCEPTABLE_SCORE
 *   details: Array            — Détail par claim
 * }}
 */
export function evaluateBriefing(briefing, sources) {
    const refMap = buildReferenceMap(sources);
    const text = flattenBriefingText(briefing);
    const claims = extractClaims(text);
    const results = verifyClaims(claims, refMap);

    const verified = results.filter(r => r.status === 'verified' || r.status === 'approximate').length;
    const unverified = results.filter(r => r.status === 'unverified').length;
    const total = results.length;
    const score = total > 0 ? verified / total : 1; // Pas de claims = rien à vérifier = OK

    return {
        score,
        totalClaims: total,
        verified,
        unverified,
        pass: score >= MIN_ACCEPTABLE_SCORE,
        referenceCount: refMap.size,
        details: results,
    };
}
