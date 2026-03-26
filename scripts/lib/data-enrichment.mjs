/**
 * Inflexion — Module d'enrichissement de données
 *
 * Croise les sources existantes pour extraire des signaux plus fins :
 *   1. DeFi TVL crash detection (change_1d < -5% sur protocoles majeurs)
 *   2. Tech vs Commodities divergence (NVDA/AAPL vs GLD/USO)
 *   3. World Bank → contexte géopolitique (PIB, chômage, dette)
 *   4. DeFi TVL archivage quotidien (snapshots pour tendances)
 *   5. Interconnexion Index (corrélation cross-assets → régime marché)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');

function loadJSON(filename) {
    const path = join(DATA_DIR, filename);
    if (!existsSync(path)) return null;
    try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}

// ─── 1. DeFi TVL Crash Detection ────────────────────────────

const DEFI_CRASH_THRESHOLD_1D = -5;   // % change 1 jour
const DEFI_CRASH_THRESHOLD_7D = -10;  // % change 7 jours
const DEFI_MIN_TVL = 1e9;             // $1B minimum pour être significatif

export function detectDefiStress(sources) {
    const signals = [];
    if (!sources.defi?.topProtocols?.length) return signals;

    const majors = sources.defi.topProtocols
        .filter(p => p.tvl >= DEFI_MIN_TVL && p.category !== 'CEX');

    for (const p of majors) {
        if (p.change_1d <= DEFI_CRASH_THRESHOLD_1D) {
            signals.push({
                type: 'defi_tvl_crash',
                categorie: 'crypto',
                severite: p.change_1d <= -10 ? 'urgent' : 'attention',
                description: `${p.name} TVL chute de ${p.change_1d.toFixed(1)}% en 24h ($${(p.tvl / 1e9).toFixed(1)}B)`,
                donnees: { protocole: p.name, tvl_b: +(p.tvl / 1e9).toFixed(1), change_1d: +p.change_1d.toFixed(1), categorie: p.category },
            });
        }
        if (p.change_7d && p.change_7d <= DEFI_CRASH_THRESHOLD_7D) {
            signals.push({
                type: 'defi_tvl_bleed',
                categorie: 'crypto',
                severite: 'attention',
                description: `${p.name} TVL en baisse prolongée : ${p.change_7d.toFixed(1)}% sur 7j ($${(p.tvl / 1e9).toFixed(1)}B)`,
                donnees: { protocole: p.name, tvl_b: +(p.tvl / 1e9).toFixed(1), change_7d: +p.change_7d.toFixed(1) },
            });
        }
    }

    // Signal agrégé si TVL totale chute significativement
    const avgChange1d = majors.reduce((s, p) => s + (p.change_1d || 0), 0) / (majors.length || 1);
    if (avgChange1d <= -3) {
        signals.push({
            type: 'defi_systemic_stress',
            categorie: 'crypto',
            severite: 'urgent',
            description: `Stress systémique DeFi : TVL moyenne des protocoles majeurs ${avgChange1d.toFixed(1)}% en 24h`,
            donnees: { avg_change_1d: +avgChange1d.toFixed(1), nb_protocoles: majors.length },
        });
    }

    return signals;
}

// ─── 2. Tech vs Commodities Divergence ──────────────────────

export function detectAssetDivergence(sources) {
    const signals = [];
    if (!sources.markets?.quotes?.length) return signals;

    const quotes = sources.markets.quotes;
    const bySymbol = Object.fromEntries(quotes.map(q => [q.symbol, q]));

    // Tech basket : NVDA, AAPL, MSFT, GOOGL
    const techSymbols = ['NVDA', 'AAPL', 'MSFT', 'GOOGL'];
    const techQuotes = techSymbols.map(s => bySymbol[s]).filter(Boolean);
    const techAvg = techQuotes.length ? techQuotes.reduce((s, q) => s + q.change, 0) / techQuotes.length : null;

    // Commodities basket : GLD (or), USO (pétrole)
    const commSymbols = ['GLD', 'USO'];
    const commQuotes = commSymbols.map(s => bySymbol[s]).filter(Boolean);
    const commAvg = commQuotes.length ? commQuotes.reduce((s, q) => s + q.change, 0) / commQuotes.length : null;

    // Indices : QQQ (tech-heavy), DIA (industrials)
    const qqq = bySymbol['QQQ'];
    const dia = bySymbol['DIA'];

    if (techAvg !== null && commAvg !== null) {
        const spread = techAvg - commAvg;

        // Divergence > 2% = rotation significative
        if (Math.abs(spread) >= 2) {
            const direction = spread > 0 ? 'tech surperforme commodities' : 'commodities surperforment tech';
            const regime = spread > 0 ? 'risk-on / croissance' : 'risk-off / inflation';
            signals.push({
                type: 'tech_vs_commodities',
                categorie: 'marches',
                severite: Math.abs(spread) >= 4 ? 'urgent' : 'attention',
                description: `Divergence ${direction} (spread: ${spread > 0 ? '+' : ''}${spread.toFixed(1)}pp) → signal ${regime}`,
                donnees: { tech_avg: +techAvg.toFixed(2), comm_avg: +commAvg.toFixed(2), spread: +spread.toFixed(2), regime },
            });
        }
    }

    // QQQ vs DIA divergence (tech vs industrie)
    if (qqq && dia) {
        const qqq_dia_spread = qqq.change - dia.change;
        if (Math.abs(qqq_dia_spread) >= 1.5) {
            signals.push({
                type: 'qqq_vs_dia',
                categorie: 'marches',
                severite: 'info',
                description: `QQQ ${qqq.change > 0 ? '+' : ''}${qqq.change.toFixed(1)}% vs DIA ${dia.change > 0 ? '+' : ''}${dia.change.toFixed(1)}% → ${qqq_dia_spread > 0 ? 'rotation vers tech' : 'rotation vers value'}`,
                donnees: { qqq: +qqq.change.toFixed(2), dia: +dia.change.toFixed(2), spread: +qqq_dia_spread.toFixed(2) },
            });
        }
    }

    return signals;
}

// ─── 3. World Bank → Contexte géopolitique ──────────────────

// Mapping pays World Bank → zones géopolitiques du briefing
const COUNTRY_TO_GEO = {
    'USA': ['États-Unis', 'Fed', 'tarifs', 'dollar'],
    'CHN': ['Chine', 'Beijing', 'Pékin', 'taïwan', 'mer de Chine'],
    'DEU': ['Allemagne', 'Berlin', 'UE', 'Europe'],
    'JPN': ['Japon', 'Tokyo', 'yen'],
    'IND': ['Inde', 'Modi', 'Tamil Nadu', 'New Delhi'],
    'GBR': ['Royaume-Uni', 'Londres', 'Brexit'],
    'FRA': ['France', 'Paris', 'Macron'],
    'BRA': ['Brésil', 'Lula', 'Brasília'],
    'KOR': ['Corée du Sud', 'Séoul'],
    'CAN': ['Canada', 'Ottawa'],
    'RUS': ['Russie', 'Moscou', 'Poutine', 'Ukraine'],
    'TUR': ['Turquie', 'Erdogan', 'Ankara'],
    'IRN': ['Iran', 'Téhéran', 'Ormuz'],
};

export function buildWorldBankContext() {
    const wb = loadJSON('world-bank.json');
    if (!wb?.indicators?.length) return null;

    const countryProfiles = {};

    for (const indicator of wb.indicators) {
        for (const entry of indicator.data) {
            const code = entry.country_code;
            if (!countryProfiles[code]) {
                countryProfiles[code] = { country: entry.country, code, keywords: COUNTRY_TO_GEO[code] || [] };
            }
            const key = indicator.id === 'NY.GDP.MKTP.CD' ? 'pib_usd'
                : indicator.id === 'SL.UEM.TOTL.ZS' ? 'chomage_pct'
                : indicator.id === 'GC.DOD.TOTL.GD.ZS' ? 'dette_pib_pct'
                : indicator.id;
            countryProfiles[code][key] = { value: entry.value, year: entry.year };
        }
    }

    return countryProfiles;
}

export function formatWorldBankSection(countryProfiles) {
    if (!countryProfiles) return '';

    const lines = ['## Contexte macro par pays (World Bank)'];
    for (const [code, profile] of Object.entries(countryProfiles)) {
        const parts = [`**${profile.country}**`];
        if (profile.pib_usd) parts.push(`PIB $${(profile.pib_usd.value / 1e12).toFixed(1)}T (${profile.pib_usd.year})`);
        if (profile.chomage_pct) parts.push(`Chômage ${profile.chomage_pct.value}% (${profile.chomage_pct.year})`);
        if (profile.dette_pib_pct) parts.push(`Dette ${profile.dette_pib_pct.value}% PIB (${profile.dette_pib_pct.year})`);
        if (parts.length > 1) lines.push(`- ${parts.join(' | ')}`);
    }

    return lines.length > 1 ? lines.join('\n') : '';
}

// ─── 4. DeFi TVL Archivage ──────────────────────────────────

const DEFI_HISTORY_FILE = join(DATA_DIR, 'defi-history.json');
const DEFI_HISTORY_DAYS = 30;

export function archiveDefiSnapshot(sources) {
    if (!sources.defi?.totalTVL) return;

    let history = [];
    if (existsSync(DEFI_HISTORY_FILE)) {
        try { history = JSON.parse(readFileSync(DEFI_HISTORY_FILE, 'utf-8')); } catch { history = []; }
    }

    const today = new Date().toISOString().split('T')[0];

    // Ne pas dupliquer si déjà archivé aujourd'hui
    if (history.some(h => h.date === today)) return;

    const snapshot = {
        date: today,
        totalTVL: sources.defi.totalTVL,
        topProtocols: (sources.defi.topProtocols || [])
            .filter(p => p.category !== 'CEX')
            .slice(0, 10)
            .map(p => ({ name: p.name, tvl: p.tvl, change_1d: p.change_1d, change_7d: p.change_7d, category: p.category })),
    };

    history.push(snapshot);

    // Garder les N derniers jours
    if (history.length > DEFI_HISTORY_DAYS) {
        history = history.slice(-DEFI_HISTORY_DAYS);
    }

    writeFileSync(DEFI_HISTORY_FILE, JSON.stringify(history, null, 2));
    console.log(`  📊 DeFi snapshot archivé (${today}, TVL: $${(snapshot.totalTVL / 1e9).toFixed(0)}B)`);
}

export function detectDefiTrend() {
    if (!existsSync(DEFI_HISTORY_FILE)) return [];

    let history;
    try { history = JSON.parse(readFileSync(DEFI_HISTORY_FILE, 'utf-8')); } catch { return []; }

    if (history.length < 3) return [];

    const signals = [];
    const recent = history.slice(-7);
    const firstTVL = recent[0].totalTVL;
    const lastTVL = recent[recent.length - 1].totalTVL;
    const weekChange = ((lastTVL - firstTVL) / firstTVL) * 100;

    if (weekChange <= -5) {
        signals.push({
            type: 'defi_tvl_trend',
            categorie: 'crypto',
            severite: weekChange <= -10 ? 'urgent' : 'attention',
            description: `TVL DeFi en baisse de ${weekChange.toFixed(1)}% sur ${recent.length}j ($${(lastTVL / 1e9).toFixed(0)}B → signal de stress)`,
            donnees: { tvl_start_b: +(firstTVL / 1e9).toFixed(0), tvl_end_b: +(lastTVL / 1e9).toFixed(0), change_pct: +weekChange.toFixed(1), days: recent.length },
        });
    }

    return signals;
}

// ─── 5. Interconnexion Index ────────────────────────────────

export function computeInterconnexionIndex(sources) {
    const assets = [];

    // Marchés
    if (sources.markets?.quotes?.length) {
        for (const q of sources.markets.quotes) {
            assets.push({ name: q.name, symbol: q.symbol, classe: q.is_proxy ? 'etf' : 'action', change: q.change });
        }
    }

    // Crypto (top 5)
    if (sources.crypto?.prices?.length) {
        for (const c of sources.crypto.prices.slice(0, 5)) {
            assets.push({ name: c.name, symbol: c.symbol, classe: 'crypto', change: c.change_24h });
        }
    }

    // European markets
    if (sources.europeanMarkets?.indices?.length) {
        for (const idx of sources.europeanMarkets.indices) {
            assets.push({ name: idx.name, symbol: idx.symbol, classe: 'indice_eu', change: idx.change_pct });
        }
    }

    if (assets.length < 4) return null;

    // Calcul : compter combien d'actifs vont dans la même direction
    const up = assets.filter(a => a.change > 0).length;
    const down = assets.filter(a => a.change < 0).length;
    const total = assets.length;

    // Consensus = % d'actifs dans la direction dominante
    const consensus = Math.max(up, down) / total;

    // Amplitude moyenne
    const avgChange = assets.reduce((s, a) => s + Math.abs(a.change), 0) / total;

    // Déterminer le régime
    let regime;
    if (consensus >= 0.75 && up > down) regime = 'risk-on généralisé';
    else if (consensus >= 0.75 && down > up) regime = 'risk-off généralisé';
    else if (consensus < 0.6) regime = 'marché fragmenté';
    else regime = up > down ? 'tendance haussière modérée' : 'tendance baissière modérée';

    // Grouper par classe pour voir les divergences
    const byClasse = {};
    for (const a of assets) {
        if (!byClasse[a.classe]) byClasse[a.classe] = [];
        byClasse[a.classe].push(a);
    }

    const classeAvg = {};
    for (const [classe, items] of Object.entries(byClasse)) {
        classeAvg[classe] = +(items.reduce((s, a) => s + a.change, 0) / items.length).toFixed(2);
    }

    return {
        regime,
        consensus: +(consensus * 100).toFixed(0),
        amplitude_moyenne: +avgChange.toFixed(2),
        direction_dominante: up >= down ? 'hausse' : 'baisse',
        actifs_hausse: up,
        actifs_baisse: down,
        total_actifs: total,
        par_classe: classeAvg,
    };
}

export function formatInterconnexionSection(index) {
    if (!index) return '';

    const lines = [
        `## Interconnexion Index`,
        `- Régime : **${index.regime}** (consensus ${index.consensus}%)`,
        `- Direction : ${index.direction_dominante} (${index.actifs_hausse}↑ / ${index.actifs_baisse}↓ sur ${index.total_actifs} actifs)`,
        `- Amplitude moyenne : ${index.amplitude_moyenne}%`,
    ];

    const classeLabels = { etf: 'Indices US', action: 'Tech US', crypto: 'Crypto', indice_eu: 'Europe' };
    const classeEntries = Object.entries(index.par_classe);
    if (classeEntries.length > 1) {
        lines.push('- Par classe : ' + classeEntries
            .map(([c, avg]) => `${classeLabels[c] || c} ${avg > 0 ? '+' : ''}${avg}%`)
            .join(' | '));
    }

    return lines.join('\n');
}

// ─── Export agrégé ──────────────────────────────────────────

export function runAllEnrichments(sources) {
    const enrichments = {
        signals: [],
        sections: [],
        interconnexion: null,
        worldBank: null,
    };

    // 1. DeFi stress detection
    enrichments.signals.push(...detectDefiStress(sources));

    // 2. Tech vs Commodities divergence
    enrichments.signals.push(...detectAssetDivergence(sources));

    // 3. World Bank context
    enrichments.worldBank = buildWorldBankContext();
    const wbSection = formatWorldBankSection(enrichments.worldBank);
    if (wbSection) enrichments.sections.push(wbSection);

    // 4. DeFi archivage + trend
    archiveDefiSnapshot(sources);
    enrichments.signals.push(...detectDefiTrend());

    // 5. Interconnexion Index
    const europeanMarkets = loadJSON('european-markets.json');
    const enrichedSources = { ...sources, europeanMarkets };
    enrichments.interconnexion = computeInterconnexionIndex(enrichedSources);
    const ixSection = formatInterconnexionSection(enrichments.interconnexion);
    if (ixSection) enrichments.sections.push(ixSection);

    console.log(`  🔗 Enrichissement : ${enrichments.signals.length} signaux, ${enrichments.sections.length} sections, régime: ${enrichments.interconnexion?.regime || 'N/A'}`);

    return enrichments;
}
