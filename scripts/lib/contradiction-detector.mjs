/**
 * Inflexion — Détection de contradictions cross-sources (Sprint 6)
 *
 * Compare les valeurs entre sources pour les mêmes indicateurs.
 * Si deux sources divergent au-delà d'une tolérance définie,
 * un flag est remonté pour avertir Claude dans le prompt.
 *
 * Sources comparables :
 *   - Crypto : CoinGecko vs Messari (BTC, ETH, SOL, XRP)
 *   - Forex  : Alpha Vantage vs ECB Data (EUR/USD)
 *   - ETF    : Finnhub self-consistency (price vs prev_close + change)
 *   - Indices EU : Twelve Data self-consistency
 */

// ─── Tolérances par type d'indicateur ───────────────────────
export const TOLERANCES = {
    crypto: 2.0,      // ±2% — agrégations différentes entre exchanges
    forex: 0.7,       // ±0.7% — Alpha Vantage intraday vs ECB overnight fixing
    etfSelf: 0.5,     // ±0.5% — vérification interne prix vs prev_close + change
    indexSelf: 0.3,   // ±0.3% — vérification interne indices européens
};

// ─── Helpers ────────────────────────────────────────────────

/**
 * Calcule la divergence en pourcentage entre deux valeurs.
 * @param {number} v1
 * @param {number} v2
 * @returns {number} — Divergence en % (toujours positive)
 */
export function pctDivergence(v1, v2) {
    if (!v1 && !v2) return 0;
    const ref = Math.abs(v1) > Math.abs(v2) ? v1 : v2;
    if (ref === 0) return 0;
    return Math.abs((v1 - v2) / ref) * 100;
}

/**
 * Crée un objet contradiction structuré.
 */
function makeContradiction(indicator, source1, value1, source2, value2, divergencePct, type, note = '') {
    return {
        indicator,
        source1: { name: source1, value: value1 },
        source2: { name: source2, value: value2 },
        divergence_pct: Math.round(divergencePct * 100) / 100,
        type,
        note,
    };
}

// ─── Vérifications cross-sources ────────────────────────────

/**
 * Compare les prix crypto entre CoinGecko et Messari.
 * @param {Object|null} crypto — data/crypto.json
 * @param {Object|null} messari — data/messari.json
 * @returns {Array} contradictions
 */
export function checkCryptoContradictions(crypto, messari) {
    const contradictions = [];
    if (!crypto?.prices?.length || !messari?.assets?.length) return contradictions;

    // Normaliser les symboles Messari pour le matching
    const messariMap = new Map();
    for (const asset of messari.assets) {
        if (asset.symbol && asset.price) {
            messariMap.set(asset.symbol.toUpperCase(), asset);
        }
    }

    for (const coin of crypto.prices) {
        if (!coin.symbol || !coin.price) continue;
        const symbol = coin.symbol.toUpperCase();
        const messariAsset = messariMap.get(symbol);
        if (!messariAsset) continue;

        const div = pctDivergence(coin.price, messariAsset.price);
        if (div > TOLERANCES.crypto) {
            contradictions.push(makeContradiction(
                `${symbol} prix`,
                'CoinGecko', coin.price,
                'Messari', messariAsset.price,
                div,
                'crypto',
                `Divergence ${symbol} : CoinGecko ${coin.price} vs Messari ${messariAsset.price} (${div.toFixed(1)}%). Possible décalage temporel ou agrégation différente.`
            ));
        }
    }

    return contradictions;
}

/**
 * Compare EUR/USD entre Alpha Vantage et ECB Data.
 * @param {Object|null} alphaVantage — data/alpha-vantage.json
 * @param {Object|null} globalMacro — data/global-macro.json
 * @returns {Array} contradictions
 */
export function checkForexContradictions(alphaVantage, globalMacro) {
    const contradictions = [];
    if (!alphaVantage?.forex?.length || !globalMacro?.ecb?.eurusd) return contradictions;

    const eurusdAV = alphaVantage.forex.find(f =>
        f.pair === 'EUR/USD' || f.pair === 'EURUSD'
    );
    const eurusdECB = globalMacro.ecb.eurusd;

    if (eurusdAV?.rate && eurusdECB?.rate) {
        const div = pctDivergence(eurusdAV.rate, eurusdECB.rate);
        if (div > TOLERANCES.forex) {
            contradictions.push(makeContradiction(
                'EUR/USD',
                'Alpha Vantage', eurusdAV.rate,
                'ECB Data', eurusdECB.rate,
                div,
                'forex',
                `EUR/USD : Alpha Vantage ${eurusdAV.rate} (intraday) vs ECB ${eurusdECB.rate} (fixing overnight). Utiliser ECB pour référence officielle, Alpha Vantage pour tendance intraday.`
            ));
        }
    }

    return contradictions;
}

/**
 * Vérifie la cohérence interne des ETF Finnhub : price ≈ prev_close + change.
 * @param {Object|null} markets — data/markets.json
 * @returns {Array} contradictions
 */
export function checkETFSelfConsistency(markets) {
    const contradictions = [];
    if (!markets?.quotes?.length) return contradictions;

    for (const q of markets.quotes) {
        if (!q.symbol || q.price == null || q.prev_close == null || q.change == null) continue;
        if (q.prev_close === 0) continue;

        const expectedPrice = q.prev_close + q.change;
        const div = pctDivergence(q.price, expectedPrice);

        if (div > TOLERANCES.etfSelf) {
            contradictions.push(makeContradiction(
                `${q.symbol} (ETF self-check)`,
                'prix actuel', q.price,
                'prev_close + change', expectedPrice,
                div,
                'etf_self',
                `${q.symbol} : prix ${q.price} ≠ prev_close (${q.prev_close}) + change (${q.change}) = ${expectedPrice.toFixed(2)}. Possible donnée corrompue.`
            ));
        }
    }

    return contradictions;
}

/**
 * Vérifie la cohérence interne des indices européens Twelve Data.
 * @param {Object|null} europeanMarkets — data/european-markets.json
 * @returns {Array} contradictions
 */
export function checkEUIndexSelfConsistency(europeanMarkets) {
    const contradictions = [];
    if (!europeanMarkets?.indices?.length) return contradictions;

    for (const idx of europeanMarkets.indices) {
        if (!idx.symbol || idx.price == null || idx.prev_close == null || idx.change == null) continue;
        if (idx.prev_close === 0) continue;

        const expectedPrice = idx.prev_close + idx.change;
        const div = pctDivergence(idx.price, expectedPrice);

        if (div > TOLERANCES.indexSelf) {
            contradictions.push(makeContradiction(
                `${idx.symbol} (index self-check)`,
                'prix actuel', idx.price,
                'prev_close + change', expectedPrice,
                div,
                'index_self',
                `${idx.symbol} : prix ${idx.price} ≠ prev_close (${idx.prev_close}) + change (${idx.change}) = ${expectedPrice.toFixed(2)}.`
            ));
        }
    }

    return contradictions;
}

// ─── Orchestrateur principal ────────────────────────────────

/**
 * Exécute toutes les vérifications de contradictions cross-sources.
 * @param {Object} sources — Objet contenant toutes les données chargées
 * @returns {{ contradictions: Array, summary: string }}
 */
export function detectContradictions(sources) {
    const contradictions = [
        ...checkCryptoContradictions(sources.crypto, sources.messari),
        ...checkForexContradictions(sources.alphaVantage, sources.globalMacro),
        ...checkETFSelfConsistency(sources.markets),
        ...checkEUIndexSelfConsistency(sources.europeanMarkets),
    ];

    if (contradictions.length === 0) {
        return {
            contradictions: [],
            summary: 'Aucune divergence détectée entre les sources.',
        };
    }

    const summary = contradictions
        .map(c => `⚠ ${c.indicator} : ${c.source1.name} (${c.source1.value}) vs ${c.source2.name} (${c.source2.value}) — divergence ${c.divergence_pct}%`)
        .join('\n');

    return { contradictions, summary };
}

/**
 * Formate les contradictions en contexte injecté dans le prompt Claude.
 * @param {Array} contradictions — Liste de contradictions détectées
 * @returns {string} — Bloc markdown à injecter dans le prompt, ou chaîne vide si aucune
 */
export function formatContradictionsForPrompt(contradictions) {
    if (!contradictions || contradictions.length === 0) return '';

    const lines = contradictions.map(c => `- **${c.indicator}** : ${c.note}`);

    return `\n## ⚠ Divergences détectées entre sources\nAttention : les divergences suivantes ont été détectées entre sources de données. Mentionne la source utilisée quand tu cites ces indicateurs, et signale la divergence si elle est significative.\n\n${lines.join('\n')}\n`;
}
