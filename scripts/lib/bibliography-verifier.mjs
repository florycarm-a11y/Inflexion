/**
 * Inflexion — Vérificateur bibliographique
 *
 * Module de traçabilité des sources pour le briefing stratégique quotidien.
 * Applique la méthodologie de vérification bibliographique par recoupement
 * multi-sources, adaptée au contexte de veille financière/géopolitique.
 *
 * Architecture :
 *   1. buildArticleBibliography(articles)   → bibliographie structurée des articles RSS/API
 *   2. buildAPISourceRegistry(sources)      → registre des sources API avec métadonnées
 *   3. extractSourceReferences(text)        → extraction des attributions inline du briefing
 *   4. matchReferencesToBibliography(refs, bib) → matching refs ↔ sources réelles
 *   5. generateBibliographyReport(briefing, articles, sources) → rapport complet
 *
 * Intégration : étape post-génération dans generate-daily-briefing.mjs,
 * entre claim-verifier (Sprint 2) et sauvegarde du JSON.
 */

// ─── Configuration ──────────────────────────────────────────

/** Score minimum de traçabilité (0-1). En dessous, le briefing est flaggé. */
export const MIN_TRACEABILITY_SCORE = 0.5;

/** Sources API connues avec métadonnées de traçabilité */
export const API_SOURCE_REGISTRY = {
    'CoinGecko':     { domain: 'coingecko.com',      type: 'api', category: 'crypto',    url: 'https://www.coingecko.com', free: true },
    'Finnhub':       { domain: 'finnhub.io',          type: 'api', category: 'markets',   url: 'https://finnhub.io',       free: true },
    'FRED':          { domain: 'fred.stlouisfed.org', type: 'api', category: 'macro',     url: 'https://fred.stlouisfed.org', free: true },
    'ECB':           { domain: 'data.ecb.europa.eu',  type: 'api', category: 'macro',     url: 'https://data.ecb.europa.eu', free: true },
    'ECB Data':      { domain: 'data.ecb.europa.eu',  type: 'api', category: 'macro',     url: 'https://data.ecb.europa.eu', free: true },
    'metals.dev':    { domain: 'metals.dev',          type: 'api', category: 'commodities', url: 'https://metals.dev', free: true },
    'DefiLlama':     { domain: 'defillama.com',       type: 'api', category: 'defi',      url: 'https://defillama.com', free: true },
    'Twelve Data':   { domain: 'twelvedata.com',      type: 'api', category: 'markets',   url: 'https://twelvedata.com', free: true },
    'Alpha Vantage': { domain: 'alphavantage.co',     type: 'api', category: 'markets',   url: 'https://www.alphavantage.co', free: true },
    'Messari':       { domain: 'messari.io',          type: 'api', category: 'crypto',    url: 'https://messari.io', free: true },
    'Etherscan':     { domain: 'etherscan.io',        type: 'api', category: 'onchain',   url: 'https://etherscan.io', free: true },
    'Mempool':       { domain: 'mempool.space',       type: 'api', category: 'onchain',   url: 'https://mempool.space', free: true },
    'Alternative.me':{ domain: 'alternative.me',      type: 'api', category: 'crypto',    url: 'https://alternative.me/crypto/fear-and-greed-index/', free: true },
    'CBOE':          { domain: 'cboe.com',            type: 'api', category: 'markets',   url: 'https://www.cboe.com/tradable_products/vix/', free: true },
    'GNews':         { domain: 'gnews.io',            type: 'api', category: 'news',      url: 'https://gnews.io', free: true },
    'NewsAPI':       { domain: 'newsapi.org',         type: 'api', category: 'news',      url: 'https://newsapi.org', free: true },
    'World Bank':    { domain: 'worldbank.org',       type: 'api', category: 'macro',     url: 'https://data.worldbank.org', free: true },
};

// ─── 1. Bibliographie des articles RSS/API ──────────────────

/**
 * Construit une bibliographie structurée à partir des articles utilisés
 * pour générer le briefing. Chaque entrée suit un format inspiré APA 7
 * adapté au contexte presse/veille.
 *
 * @param {Object[]} articles - Articles sélectionnés (avec url, source, publishedAt)
 * @returns {Object[]} Bibliographie structurée [{titre, source, url, domain, date, category, type}]
 */
export function buildArticleBibliography(articles) {
    if (!articles || !Array.isArray(articles)) return [];

    return articles
        .filter(a => a.title || a.titre)
        .map(a => {
            const url = a.url || a.link || '';
            const domain = extractDomain(url);
            return {
                titre: a.title || a.titre || '',
                source: a.source || 'Source inconnue',
                url,
                domain,
                date: a.publishedAt || a.date || '',
                category: a.rubrique || a._category || 'other',
                type: 'article',
            };
        });
}

/**
 * Extrait le domaine d'une URL.
 * @param {string} url
 * @returns {string} Domaine ou chaîne vide
 */
export function extractDomain(url) {
    if (!url || typeof url !== 'string') return '';
    try {
        const u = new URL(url);
        return u.hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}

// ─── 2. Registre des sources API ────────────────────────────

/**
 * Construit le registre des sources API effectivement utilisées,
 * enrichi avec les indicateurs disponibles.
 *
 * @param {Object} sources - Sources chargées par generate-daily-briefing
 * @returns {Object[]} [{name, domain, url, category, indicators[], lastUpdate}]
 */
export function buildAPISourceRegistry(sources) {
    if (!sources) return [];

    const registry = [];

    // Marchés (Finnhub)
    if (sources.markets?.quotes?.length) {
        registry.push({
            name: 'Finnhub',
            ...API_SOURCE_REGISTRY['Finnhub'],
            indicators: sources.markets.quotes.map(q => q.symbol).filter(Boolean),
            lastUpdate: sources.markets.updated_at || sources.markets.timestamp || '',
        });
    }

    // Crypto (CoinGecko)
    if (sources.crypto?.prices?.length) {
        registry.push({
            name: 'CoinGecko',
            ...API_SOURCE_REGISTRY['CoinGecko'],
            indicators: sources.crypto.prices.slice(0, 10).map(c => c.symbol).filter(Boolean),
            lastUpdate: sources.crypto.updated_at || sources.crypto.timestamp || '',
        });
    }

    // Fear & Greed
    if (sources.fearGreed?.current) {
        registry.push({
            name: 'Alternative.me',
            ...API_SOURCE_REGISTRY['Alternative.me'],
            indicators: ['Fear & Greed Index'],
            lastUpdate: sources.fearGreed.updated_at || '',
        });
    }

    // Macro US (FRED)
    if (sources.macro?.indicators?.length) {
        registry.push({
            name: 'FRED',
            ...API_SOURCE_REGISTRY['FRED'],
            indicators: sources.macro.indicators.map(i => i.label).filter(Boolean),
            lastUpdate: sources.macro.updated_at || '',
        });
    }

    // Global Macro (BCE + VIX)
    if (sources.globalMacro) {
        if (sources.globalMacro.ecb) {
            registry.push({
                name: 'ECB Data',
                ...API_SOURCE_REGISTRY['ECB Data'],
                indicators: ['Taux directeur', 'EUR/USD'].filter((_, i) =>
                    i === 0 ? sources.globalMacro.ecb.main_rate : sources.globalMacro.ecb.eurusd
                ),
                lastUpdate: sources.globalMacro.ecb?.updated_at || '',
            });
        }
        if (sources.globalMacro.volatility?.vix) {
            registry.push({
                name: 'CBOE',
                ...API_SOURCE_REGISTRY['CBOE'],
                indicators: ['VIX'],
                lastUpdate: '',
            });
        }
    }

    // Commodités (metals.dev)
    if (sources.commodities?.metals) {
        registry.push({
            name: 'metals.dev',
            ...API_SOURCE_REGISTRY['metals.dev'],
            indicators: Object.values(sources.commodities.metals).map(m => m.label).filter(Boolean),
            lastUpdate: sources.commodities.updated_at || '',
        });
    }

    // Indices EU (Twelve Data)
    if (sources.europeanMarkets?.indices?.length) {
        registry.push({
            name: 'Twelve Data',
            ...API_SOURCE_REGISTRY['Twelve Data'],
            indicators: sources.europeanMarkets.indices.map(i => i.name).filter(Boolean),
            lastUpdate: sources.europeanMarkets.updated_at || '',
        });
    }

    // DeFi (DefiLlama)
    if (sources.defi?.topProtocols?.length) {
        registry.push({
            name: 'DefiLlama',
            ...API_SOURCE_REGISTRY['DefiLlama'],
            indicators: sources.defi.topProtocols.slice(0, 5).map(p => p.name).filter(Boolean),
            lastUpdate: sources.defi.updated_at || '',
        });
    }

    // Forex (Alpha Vantage)
    if (sources.alphaVantage?.forex?.length) {
        registry.push({
            name: 'Alpha Vantage',
            ...API_SOURCE_REGISTRY['Alpha Vantage'],
            indicators: sources.alphaVantage.forex.map(f => f.pair).filter(Boolean),
            lastUpdate: sources.alphaVantage.updated_at || '',
        });
    }

    // Messari
    if (sources.messari) {
        registry.push({
            name: 'Messari',
            ...API_SOURCE_REGISTRY['Messari'],
            indicators: ['Dominance BTC', 'Market cap', 'Volumes'],
            lastUpdate: sources.messari.updated_at || '',
        });
    }

    // On-chain
    if (sources.onchain) {
        if (sources.onchain.eth_gas) {
            registry.push({
                name: 'Etherscan',
                ...API_SOURCE_REGISTRY['Etherscan'],
                indicators: ['ETH Gas'],
                lastUpdate: '',
            });
        }
        if (sources.onchain.btc_fees || sources.onchain.btc_mining) {
            registry.push({
                name: 'Mempool',
                ...API_SOURCE_REGISTRY['Mempool'],
                indicators: ['BTC Fees', 'BTC Hashrate'].filter((ind, i) =>
                    i === 0 ? sources.onchain.btc_fees : sources.onchain.btc_mining
                ),
                lastUpdate: '',
            });
        }
    }

    return registry;
}

// ─── 3. Extraction des références inline ────────────────────

/**
 * Patterns pour détecter les attributions de sources dans le texte du briefing.
 * Le prompt demande : "BTC à 63 099 $ (CoinGecko, 24h: -4,6%)"
 */
const SOURCE_ATTRIBUTION_PATTERNS = [
    // (CoinGecko), (FRED, janvier 2026), (Finnhub), (ECB Data)
    /\(([A-Z][A-Za-zÀ-ÿ.'\s]+?)(?:,\s*[^)]+)?\)/g,
    // "selon Al-Monitor", "selon Reuters", "Selon Reuters"
    /\bselon\s+([A-Z][A-Za-zÀ-ÿ\s'-]+?)(?:\.|,|\s+(?:qui|et|le|la|les|un|une|des|que|ce|cette|a|aurait))/gi,
    // "(Reuters rapporte que...)", "(Bloomberg indique que...)"
    /\(([A-Z][A-Za-zÀ-ÿ\s'-]+?)\s+(?:rapporte|indique|estime|note|relève|souligne|signale|analyse|observe)/gi,
    // "estimation Inflexion", "corrélation calculée"
    /\b(estimation\s+Inflexion|corr[ée]lation\s+calcul[ée]e)/gi,
];

/**
 * Noms connus de sources (APIs + presse majeure) pour filtrer les faux positifs.
 */
const KNOWN_SOURCE_NAMES = new Set([
    // APIs
    'CoinGecko', 'Finnhub', 'FRED', 'ECB', 'ECB Data', 'metals.dev', 'DefiLlama',
    'Twelve Data', 'Alpha Vantage', 'Messari', 'Etherscan', 'Mempool', 'Alternative.me',
    'CBOE', 'World Bank',
    // Presse majeure
    'Reuters', 'Bloomberg', 'Financial Times', 'FT', 'Wall Street Journal', 'WSJ',
    'Les Echos', 'Le Monde', 'Le Figaro', 'La Tribune', 'BFM Business',
    'Al Jazeera', 'Al-Monitor', 'France 24', 'RFI', 'BBC',
    'CNBC', 'MarketWatch', 'Seeking Alpha', 'Yahoo Finance',
    'CoinDesk', 'CoinTelegraph', 'The Block', 'Decrypt', 'Blockworks',
    // Think tanks
    'CFR', 'Brookings', 'Carnegie', 'CSIS', 'IFRI', 'IRIS', 'Chatham House',
    'RUSI', 'RAND', 'CNAS', 'Bruegel', 'CEPS', 'ECFR',
    'Bellingcat', 'Crisis Group', 'SIPRI', 'ACLED',
    // Institutions
    'FMI', 'IMF', 'BCE', 'Fed', 'BRI', 'BIS', 'OCDE', 'OECD', 'OPEC',
    // Estimation interne
    'Inflexion',
]);

/**
 * Extrait les références de sources du texte du briefing.
 *
 * @param {string} text - Texte brut du briefing
 * @returns {Object[]} [{name, context, type: 'api'|'presse'|'institution'|'estimation'}]
 */
export function extractSourceReferences(text) {
    if (!text || typeof text !== 'string') return [];

    const refs = [];
    const seenContexts = new Set();

    for (const pattern of SOURCE_ATTRIBUTION_PATTERNS) {
        // Reset lastIndex for global regex
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        while ((match = regex.exec(text)) !== null) {
            const name = match[1].trim();

            // Filter out false positives (common words that look like source names)
            if (name.length < 2 || name.length > 40) continue;
            if (/^(Le|La|Les|Un|Une|Des|Ce|Cette|Que|Si|En|Au|Du|Par|Avec|Sur|Et|Ou|Mais|Donc)$/i.test(name)) continue;

            // Extract context
            const start = Math.max(0, match.index - 30);
            const end = Math.min(text.length, match.index + match[0].length + 30);
            const context = text.slice(start, end).trim();

            // Deduplicate by context
            if (seenContexts.has(context)) continue;
            seenContexts.add(context);

            // Classify the reference type
            const type = classifySourceType(name);

            refs.push({ name, context, type });
        }
    }

    return refs;
}

/**
 * Classifie le type d'une source.
 * @param {string} name - Nom de la source
 * @returns {'api'|'presse'|'institution'|'think_tank'|'estimation'|'unknown'}
 */
export function classifySourceType(name) {
    if (!name) return 'unknown';
    const n = name.trim();

    if (API_SOURCE_REGISTRY[n]) return 'api';
    if (/estimation\s+Inflexion|corr[ée]lation\s+calcul/i.test(n)) return 'estimation';
    if (/FMI|IMF|BCE|Fed|BRI|BIS|OCDE|OECD|OPEC|World Bank/i.test(n)) return 'institution';
    if (/\b(?:CFR|Brookings|Carnegie|CSIS|IFRI|IRIS|Chatham|RUSI|RAND|CNAS|Bruegel|CEPS|ECFR|Bellingcat|SIPRI|ACLED)\b/i.test(n)) return 'think_tank';
    if (KNOWN_SOURCE_NAMES.has(n)) return 'presse';

    return 'unknown';
}

// ─── 4. Matching références ↔ bibliographie ─────────────────

/**
 * Tente de lier chaque référence inline à une entrée de la bibliographie
 * ou du registre API. C'est le cœur de la vérification bibliographique.
 *
 * @param {Object[]} refs - Références extraites du briefing
 * @param {Object[]} bibliography - Bibliographie des articles
 * @param {Object[]} apiRegistry - Registre des sources API
 * @returns {Object[]} [{ref, matched: true/false, matchedSource: {...}|null}]
 */
export function matchReferencesToBibliography(refs, bibliography, apiRegistry) {
    if (!refs?.length) return [];

    const results = [];

    for (const ref of refs) {
        let matched = false;
        let matchedSource = null;

        // 1. Check API registry
        const apiMatch = apiRegistry.find(api =>
            api.name.toLowerCase() === ref.name.toLowerCase() ||
            (API_SOURCE_REGISTRY[ref.name] && API_SOURCE_REGISTRY[ref.name].domain === api.domain)
        );
        if (apiMatch) {
            matched = true;
            matchedSource = {
                type: 'api',
                name: apiMatch.name,
                url: apiMatch.url,
                domain: apiMatch.domain,
                indicators: apiMatch.indicators,
            };
        }

        // 2. Check article bibliography (fuzzy match on source name)
        if (!matched) {
            const bibMatch = bibliography.find(b =>
                b.source.toLowerCase().includes(ref.name.toLowerCase()) ||
                ref.name.toLowerCase().includes(b.source.toLowerCase()) ||
                (b.domain && ref.name.toLowerCase().includes(b.domain.split('.')[0]))
            );
            if (bibMatch) {
                matched = true;
                matchedSource = {
                    type: 'article',
                    titre: bibMatch.titre,
                    source: bibMatch.source,
                    url: bibMatch.url,
                    domain: bibMatch.domain,
                    date: bibMatch.date,
                };
            }
        }

        // 3. Check known source names (no URL but recognized)
        if (!matched && KNOWN_SOURCE_NAMES.has(ref.name)) {
            matched = true;
            matchedSource = {
                type: ref.type,
                name: ref.name,
                url: API_SOURCE_REGISTRY[ref.name]?.url || '',
                recognized: true,
            };
        }

        // 4. Estimation Inflexion — always valid
        if (!matched && ref.type === 'estimation') {
            matched = true;
            matchedSource = { type: 'estimation', name: 'Inflexion' };
        }

        results.push({ ref, matched, matchedSource });
    }

    return results;
}

// ─── 5. Rapport bibliographique complet ─────────────────────

/**
 * Extrait tout le texte analysable du briefing structuré (même logique
 * que flattenBriefingText dans claim-verifier.mjs).
 *
 * @param {Object} briefing - Briefing JSON
 * @returns {string}
 */
export function flattenBriefingText(briefing) {
    const parts = [];
    if (briefing.signal_du_jour) parts.push(briefing.signal_du_jour);
    if (briefing.synthese?.contenu) parts.push(briefing.synthese.contenu);
    if (briefing.synthese?.titre) parts.push(briefing.synthese.titre);
    if (briefing.signaux) {
        for (const s of briefing.signaux) {
            if (s.titre) parts.push(s.titre);
            if (s.description) parts.push(s.description);
            if (s.interconnexions) {
                for (const ic of s.interconnexions) {
                    parts.push(typeof ic === 'string' ? ic : `${ic.secteur || ''} ${ic.impact || ''} ${ic.explication || ''}`);
                }
            }
        }
    }
    if (briefing.risk_radar) {
        for (const r of briefing.risk_radar) {
            if (r.risque) parts.push(r.risque);
            if (r.description) parts.push(r.description);
            if (r.impact_marche) parts.push(r.impact_marche);
        }
    }
    if (briefing.themes_a_surveiller) {
        for (const t of briefing.themes_a_surveiller) {
            if (t.actif) parts.push(t.actif);
            if (t.details) parts.push(t.details);
        }
    }
    return parts.join('\n');
}

/**
 * Génère un rapport bibliographique complet pour le briefing.
 *
 * @param {Object} briefing - Briefing JSON généré par Claude
 * @param {Object[]} articles - Articles sélectionnés (avec URL)
 * @param {Object} sources - Données sources API
 * @returns {{
 *   score: number,                — Score de traçabilité (0-1)
 *   totalRefs: number,            — Nombre de références détectées
 *   matched: number,              — Références liées à une source
 *   unmatched: number,            — Références non traçables
 *   pass: boolean,                — true si score >= MIN_TRACEABILITY_SCORE
 *   bibliography: Object[],       — Bibliographie articles (titre, source, url, date)
 *   apiSources: Object[],         — Sources API utilisées (name, url, indicators)
 *   details: Object[],            — Détail du matching par référence
 *   methodology: Object           — Méthodologie appliquée
 * }}
 */
export function generateBibliographyReport(briefing, articles, sources) {
    // 1. Build bibliography & API registry
    const bibliography = buildArticleBibliography(articles);
    const apiRegistry = buildAPISourceRegistry(sources);

    // 2. Extract references from briefing text
    const fullText = flattenBriefingText(briefing);
    const refs = extractSourceReferences(fullText);

    // 3. Match references to bibliography
    const matchResults = matchReferencesToBibliography(refs, bibliography, apiRegistry);

    // 4. Compute score
    const matched = matchResults.filter(r => r.matched).length;
    const unmatched = matchResults.filter(r => !r.matched).length;
    const total = matchResults.length;
    const score = total > 0 ? matched / total : 1;

    // 5. Build deduplicated bibliography for output (only articles with URLs)
    const seenUrls = new Set();
    const uniqueBibliography = bibliography
        .filter(b => b.url && !seenUrls.has(b.url) && seenUrls.add(b.url))
        .map(b => ({
            titre: b.titre,
            source: b.source,
            url: b.url,
            domain: b.domain,
            date: b.date,
            category: b.category,
        }));

    // 6. Build API sources summary for output
    const apiSources = apiRegistry.map(api => ({
        name: api.name,
        url: api.url,
        domain: api.domain,
        category: api.category,
        indicators: api.indicators,
    }));

    return {
        score,
        totalRefs: total,
        matched,
        unmatched,
        pass: score >= MIN_TRACEABILITY_SCORE,
        bibliography: uniqueBibliography,
        apiSources,
        details: matchResults.map(r => ({
            name: r.ref.name,
            type: r.ref.type,
            matched: r.matched,
            matchedSource: r.matchedSource ? {
                type: r.matchedSource.type,
                name: r.matchedSource.name || r.matchedSource.source || '',
                url: r.matchedSource.url || '',
            } : null,
        })),
        methodology: {
            description: 'Vérification bibliographique par recoupement multi-sources',
            steps: [
                'Extraction des références de sources dans le texte du briefing',
                'Recoupement avec la bibliographie des articles RSS/API utilisés',
                'Vérification croisée avec le registre des 15 sources API',
                'Classification des sources (API, presse, institution, think tank, estimation)',
            ],
            totalArticlesUsed: articles?.length || 0,
            totalAPISources: apiRegistry.length,
            standardApplied: 'Adaptation APA 7 pour veille financière/géopolitique',
        },
    };
}
