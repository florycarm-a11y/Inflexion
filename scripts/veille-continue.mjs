#!/usr/bin/env node
/**
 * Inflexion — Veille continue & détection de signaux faibles
 *
 * Surveille des thématiques définies (watchlist), détecte les signaux faibles
 * et les ruptures narratives dans le flux d'actualité.
 *
 * Fonctions :
 * 1. Watchlist thématique — sujets prioritaires à surveiller
 * 2. Détection de signaux faibles — apparition soudaine d'un thème peu couvert
 * 3. Rupture narrative — changement de ton/angle sur un sujet donné
 * 4. Croisement de signaux — corrélation entre catégories différentes
 *
 * Sortie : data/signals.json (alertes et signaux détectés)
 *
 * @requires ANTHROPIC_API_KEY
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { callClaudeJSON, getUsageStats } from './lib/claude-api.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// ─── Watchlist thématique ───────────────────────────────────
// Chaque entrée définit un sujet à surveiller avec ses mots-clés
// et un seuil de sensibilité (plus bas = plus d'alertes)

const WATCHLIST = [
    // Géopolitique
    { id: 'ormuz', label: 'Détroit d\'Ormuz', keywords: ['ormuz', 'hormuz', 'strait', 'détroit', 'iran.*naval', 'iran.*blocus'], category: 'geopolitique', priority: 'critical' },
    { id: 'taiwan', label: 'Tension Taiwan', keywords: ['taiwan', 'tsmc.*sanction', 'chine.*taiwan', 'china.*taiwan', 'détroit.*formose'], category: 'geopolitique', priority: 'critical' },
    { id: 'sanctions-russie', label: 'Sanctions Russie', keywords: ['sanction.*russ', 'russia.*sanction', 'swift.*russ', 'gazprom', 'rosneft'], category: 'geopolitique', priority: 'high' },
    { id: 'trump-tarifs', label: 'Tarifs douaniers Trump', keywords: ['tariff', 'tarif.*douane', 'droit.*douane', 'trade war', 'guerre.*commercial'], category: 'geopolitique', priority: 'high' },
    { id: 'brics', label: 'Expansion BRICS', keywords: ['brics', 'de-dollarisation', 'dedollarization', 'new development bank'], category: 'geopolitique', priority: 'medium' },

    // Marchés
    { id: 'fed-pivot', label: 'Pivot Fed', keywords: ['fed.*cut', 'fed.*baisse', 'fed.*pivot', 'powell.*rate', 'fomc', 'taux.*directeur'], category: 'marches', priority: 'critical' },
    { id: 'recession', label: 'Signaux récession', keywords: ['recession', 'récession', 'yield.*curve.*invert', 'courbe.*taux.*invers', 'contraction.*pib'], category: 'marches', priority: 'critical' },
    { id: 'vix-spike', label: 'VIX > 30', keywords: ['vix.*spike', 'vix.*surge', 'volatilité.*marché', 'market.*panic'], category: 'marches', priority: 'high' },
    { id: 'ipo-majeure', label: 'IPO majeure', keywords: ['ipo', 'introduction.*bourse', 'direct.*listing', 'spac'], category: 'marches', priority: 'medium' },

    // Crypto
    { id: 'btc-etf', label: 'Bitcoin ETF', keywords: ['bitcoin.*etf', 'btc.*etf', 'spot.*bitcoin', 'sec.*bitcoin', 'etf.*crypto'], category: 'crypto', priority: 'high' },
    { id: 'stablecoin-depeg', label: 'Stablecoin depeg', keywords: ['depeg', 'usdt.*peg', 'usdc.*peg', 'stablecoin.*crisis', 'tether.*reserv'], category: 'crypto', priority: 'critical' },
    { id: 'defi-exploit', label: 'DeFi exploit/hack', keywords: ['exploit', 'hack.*defi', 'bridge.*hack', 'rug.*pull', 'flash.*loan.*attack', 'stolen.*crypto'], category: 'crypto', priority: 'high' },
    { id: 'cbdc', label: 'CBDC / Euro numérique', keywords: ['cbdc', 'euro.*numérique', 'digital.*euro', 'digital.*dollar', 'e-yuan', 'digital.*currency'], category: 'crypto', priority: 'medium' },

    // Matières premières
    { id: 'petrole-choc', label: 'Choc pétrolier', keywords: ['oil.*spike', 'brent.*surge', 'pétrole.*flambée', 'opec.*cut', 'oil.*embargo'], category: 'matieres', priority: 'critical' },
    { id: 'or-record', label: 'Or record', keywords: ['gold.*record', 'gold.*high', 'or.*record', 'xau.*record', 'gold.*2[5-9]00', 'gold.*3000'], category: 'matieres', priority: 'high' },
    { id: 'lithium-supply', label: 'Supply chain lithium', keywords: ['lithium.*shortage', 'lithium.*pénurie', 'lithium.*supply', 'cobalt.*congo', 'rare.*earth.*china'], category: 'matieres', priority: 'medium' },
    { id: 'crise-alimentaire', label: 'Crise alimentaire', keywords: ['food.*crisis', 'crise.*alimentaire', 'wheat.*export.*ban', 'famine', 'drought.*crop'], category: 'matieres', priority: 'high' },

    // IA & Tech
    { id: 'ia-regulation', label: 'Régulation IA', keywords: ['ai.*act', 'ai.*regulation', 'ai.*ban', 'ia.*régulation', 'ia.*interdiction', 'ai.*executive.*order'], category: 'iatech', priority: 'high' },
    { id: 'ia-breakthrough', label: 'Percée IA', keywords: ['agi', 'artificial.*general', 'breakthrough.*ai', 'percée.*ia', 'frontier.*model', 'gpt-5', 'claude-4'], category: 'iatech', priority: 'high' },
    { id: 'semiconductor-war', label: 'Guerre des puces', keywords: ['chip.*war', 'semiconductor.*ban', 'asml.*china', 'tsmc.*restriction', 'puce.*embargo'], category: 'iatech', priority: 'critical' },
    { id: 'souverainete-cloud', label: 'Souveraineté cloud', keywords: ['cloud.*souverain', 'sovereign.*cloud', 'gaia-x', 'data.*localization', 'cloud.*act'], category: 'iatech', priority: 'medium' },
];

// ─── Catégorie map ──────────────────────────────────────────

const CAT_MAP = {
    'geopolitics': 'geopolitique',
    'markets': 'marches',
    'crypto': 'crypto',
    'commodities': 'matieres',
    'ai_tech': 'iatech'
};

// ─── Détection de signaux ───────────────────────────────────

function detectWatchlistHits(newsData) {
    const hits = []; // {watchId, label, priority, articles: [{title, source}]}

    const allArticles = [];
    for (const [cat, articles] of Object.entries(newsData.categories || {})) {
        for (const a of articles) {
            allArticles.push({ ...a, _cat: CAT_MAP[cat] || cat });
        }
    }

    for (const watch of WATCHLIST) {
        const matching = [];
        for (const a of allArticles) {
            const text = `${a.title} ${a.description || ''}`.toLowerCase();
            for (const kw of watch.keywords) {
                const regex = new RegExp(kw, 'i');
                if (regex.test(text)) {
                    matching.push({ title: a.title, source: a.source || '', url: a.url || '' });
                    break;
                }
            }
        }

        if (matching.length > 0) {
            hits.push({
                watchId: watch.id,
                label: watch.label,
                category: watch.category,
                priority: watch.priority,
                count: matching.length,
                articles: matching.slice(0, 5) // Max 5 par signal
            });
        }
    }

    // Trier : critical > high > medium, puis par count desc
    const priorityOrder = { critical: 0, high: 1, medium: 2 };
    hits.sort((a, b) => (priorityOrder[a.priority] - priorityOrder[b.priority]) || (b.count - a.count));

    return hits;
}

// ─── Détection de signaux faibles ───────────────────────────
// Un "signal faible" = thème qui apparaît soudainement dans ≥2 sources
// indépendantes sans être un sujet mainstream connu

async function detectWeakSignals(newsData) {
    if (!process.env.ANTHROPIC_API_KEY) return [];

    // Collecter tous les titres
    const titles = [];
    for (const [, articles] of Object.entries(newsData.categories || {})) {
        for (const a of articles.slice(0, 10)) {
            titles.push(a.title);
        }
    }

    if (titles.length < 5) return [];

    const result = await callClaudeJSON({
        systemPrompt: `Tu es un analyste de veille stratégique. Tu identifies les SIGNAUX FAIBLES dans un flux d'actualité.

Un signal faible est :
- Un thème émergent qui apparaît dans 2+ articles sans être le sujet dominant
- Une connexion inattendue entre deux événements de catégories différentes
- Un indicateur avancé d'un changement de régime (économique, géopolitique, technologique)
- Un acteur/pays/entreprise qui apparaît dans un contexte inhabituel

NE PAS signaler :
- Les sujets mainstream déjà bien couverts (Bitcoin, Fed, Trump trade war)
- Les simples mises à jour de cours ou données
- Les événements passés sans implication prospective`,
        userMessage: `Analyse ces ${titles.length} titres du jour et identifie les signaux faibles (max 5).

Pour chaque signal :
- theme: nom court du signal (3-5 mots)
- description: explication en 1-2 phrases
- articles_indices: indices des titres concernés (0-based)
- force: "emergent" (1-2 mentions), "confirmé" (3+ mentions), "rupture" (changement de narrative)
- implication: conséquence potentielle pour les marchés/géopolitique

JSON : {"signals": [{"theme": "...", "description": "...", "articles_indices": [0,3], "force": "emergent", "implication": "..."}]}

Titres :
${titles.map((t, i) => `[${i}] ${t}`).join('\n')}`,
        maxTokens: 1024,
        temperature: 0.3,
        label: 'weak-signals',
        model: 'claude-haiku-4-5-20251001',
        validate: (data) => {
            if (!Array.isArray(data.signals)) return 'signals manquant';
            return true;
        },
    });

    return (result.signals || []).map(s => ({
        ...s,
        articles: (s.articles_indices || []).map(i => titles[i]).filter(Boolean)
    }));
}

// ─── Croisement de signaux (cross-category) ─────────────────

function detectCrossSignals(watchlistHits) {
    const crossSignals = [];

    // Chercher des sujets qui apparaissent dans 2+ catégories
    const hitsByCategory = {};
    for (const hit of watchlistHits) {
        if (!hitsByCategory[hit.category]) hitsByCategory[hit.category] = [];
        hitsByCategory[hit.category].push(hit);
    }

    const categories = Object.keys(hitsByCategory);
    for (let i = 0; i < categories.length; i++) {
        for (let j = i + 1; j < categories.length; j++) {
            const cat1 = categories[i];
            const cat2 = categories[j];
            // Chercher des keywords communs entre les articles des deux catégories
            const titles1 = hitsByCategory[cat1].flatMap(h => h.articles.map(a => a.title.toLowerCase()));
            const titles2 = hitsByCategory[cat2].flatMap(h => h.articles.map(a => a.title.toLowerCase()));

            const commonWords = findCommonThemes(titles1, titles2);
            if (commonWords.length > 0) {
                crossSignals.push({
                    categories: [cat1, cat2],
                    themes: commonWords,
                    description: `Signal croisé ${cat1}×${cat2} : ${commonWords.join(', ')}`
                });
            }
        }
    }

    return crossSignals;
}

function findCommonThemes(titles1, titles2) {
    const STOP_WORDS = new Set(['the', 'les', 'des', 'une', 'and', 'pour', 'dans', 'sur', 'par', 'que', 'qui', 'est', 'avec', 'plus', 'pas']);
    const words1 = new Set();
    const words2 = new Set();

    for (const t of titles1) {
        for (const w of t.split(/\s+/)) {
            if (w.length > 4 && !STOP_WORDS.has(w)) words1.add(w);
        }
    }
    for (const t of titles2) {
        for (const w of t.split(/\s+/)) {
            if (w.length > 4 && !STOP_WORDS.has(w)) words2.add(w);
        }
    }

    const common = [];
    for (const w of words1) {
        if (words2.has(w)) common.push(w);
    }
    return common.slice(0, 5);
}

// ─── Chargement de l'historique ─────────────────────────────

function loadHistory() {
    const histPath = join(DATA_DIR, 'signals-history.json');
    if (existsSync(histPath)) {
        try {
            return JSON.parse(readFileSync(histPath, 'utf-8'));
        } catch { /* ignore */ }
    }
    return { entries: [] };
}

function saveHistory(history) {
    // Garder les 30 derniers jours
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    history.entries = history.entries.filter(e => new Date(e.date).getTime() > cutoff);
    writeFileSync(join(DATA_DIR, 'signals-history.json'), JSON.stringify(history, null, 2), 'utf-8');
}

// ─── Pipeline principal ─────────────────────────────────────

async function main() {
    console.log('📡 Veille continue — Inflexion\n');

    // 1. Charger les données
    const newsPath = join(DATA_DIR, 'news.json');
    if (!existsSync(newsPath)) {
        console.error('❌ data/news.json introuvable');
        process.exit(1);
    }
    const newsData = JSON.parse(readFileSync(newsPath, 'utf-8'));

    // Charger données complémentaires si disponibles
    let sentimentData = null;
    let alertsData = null;
    try { sentimentData = JSON.parse(readFileSync(join(DATA_DIR, 'sentiment.json'), 'utf-8')); } catch {}
    try { alertsData = JSON.parse(readFileSync(join(DATA_DIR, 'alerts.json'), 'utf-8')); } catch {}

    // 2. Détection watchlist
    console.log('🎯 Scan watchlist thématique...');
    const watchlistHits = detectWatchlistHits(newsData);
    console.log(`   ${watchlistHits.length} sujets détectés sur ${WATCHLIST.length} surveillés`);

    for (const hit of watchlistHits) {
        const icon = hit.priority === 'critical' ? '🔴' : hit.priority === 'high' ? '🟠' : '🟡';
        console.log(`   ${icon} ${hit.label} — ${hit.count} article(s)`);
    }

    // 3. Détection signaux faibles (Claude)
    console.log('\n🔮 Détection de signaux faibles...');
    const weakSignals = await detectWeakSignals(newsData);
    console.log(`   ${weakSignals.length} signal(aux) faible(s) détecté(s)`);

    for (const sig of weakSignals) {
        const icon = sig.force === 'rupture' ? '⚡' : sig.force === 'confirmé' ? '📌' : '🌱';
        console.log(`   ${icon} ${sig.theme} (${sig.force}) — ${sig.description}`);
    }

    // 4. Croisement de signaux
    console.log('\n🔗 Croisement inter-catégories...');
    const crossSignals = detectCrossSignals(watchlistHits);
    console.log(`   ${crossSignals.length} croisement(s) détecté(s)`);

    for (const cs of crossSignals) {
        console.log(`   ↔ ${cs.categories.join(' × ')} : ${cs.themes.join(', ')}`);
    }

    // 5. Construire la sortie
    const output = {
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        summary: {
            watchlist_active: watchlistHits.length,
            watchlist_critical: watchlistHits.filter(h => h.priority === 'critical').length,
            weak_signals: weakSignals.length,
            cross_signals: crossSignals.length,
            sentiment_global: sentimentData?.global?.score || null,
            alerts_urgentes: alertsData?.stats?.urgent || 0
        },
        watchlist: watchlistHits,
        weak_signals: weakSignals,
        cross_signals: crossSignals,
        context: {
            sentiment: sentimentData?.global || null,
            alert_count: alertsData?.stats || null
        }
    };

    writeFileSync(join(DATA_DIR, 'signals.json'), JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n✓ signals.json écrit`);

    // 6. Mettre à jour l'historique
    const history = loadHistory();
    history.entries.push({
        date: output.date,
        timestamp: output.timestamp,
        watchlist_active: output.summary.watchlist_active,
        critical: watchlistHits.filter(h => h.priority === 'critical').map(h => h.label),
        weak_signals: weakSignals.map(s => s.theme),
        cross_count: crossSignals.length
    });
    saveHistory(history);
    console.log('✓ signals-history.json mis à jour');

    // 7. Rapport final
    const usage = getUsageStats();
    if (usage.totalCalls > 0) {
        console.log(`\n💰 Coût API : ~$${usage.estimatedCostUSD.toFixed(4)} (${usage.totalCalls} appel(s))`);
    }

    // Code de sortie basé sur la criticité
    if (watchlistHits.some(h => h.priority === 'critical')) {
        console.log('\n🔴 ALERTE : Signal(aux) CRITIQUE(S) détecté(s)');
    }
}

main().catch(err => {
    console.error('❌ Erreur fatale :', err.message);
    process.exit(1);
});
