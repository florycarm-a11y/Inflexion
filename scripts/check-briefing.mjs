#!/usr/bin/env node
/**
 * check-briefing.mjs — Contrôle qualité du briefing publié (data/daily-briefing.json)
 *
 * Quel que soit le générateur (script Sonnet, Routine Master, script ponctuel),
 * le briefing affiché sur briefing.html doit passer ces contrôles avant publication :
 *
 *   1. fraicheur   — le briefing date de moins de N heures (défaut 36 h)
 *   2. structure   — synthèse présente, au moins 3 sources citées
 *   3. coherence   — un même indicateur n'a pas deux valeurs différentes dans le texte
 *                    (ex. Fear & Greed à 71 dans le signal du jour, 73 dans le sous-titre)
 *   4. libelles    — pas de « DXY » chiffré : le pipeline ne fournit que FRED DTWEXBGS,
 *                    l'indice dollar LARGE (~120), pas le DXY d'ICE (~100)
 *   5. tracabilite — les chiffres du texte se retrouvent dans data/*.json
 *                    (réutilise lib/claim-verifier.mjs ; seulement si le briefing est frais,
 *                    sinon les données ont bougé depuis et la comparaison n'a pas de sens)
 *
 * Usage :
 *   node scripts/check-briefing.mjs [--file data/daily-briefing.json] [--max-age-hours 36] [--json]
 *
 * Code de sortie : 0 si aucun échec (les avertissements ne bloquent pas), 1 sinon.
 * Sous GitHub Actions, chaque échec/avertissement est aussi émis en annotation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateBriefing, MIN_ACCEPTABLE_SCORE } from './lib/claim-verifier.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'data');

export const DEFAULT_MAX_AGE_HOURS = 36;
export const MIN_SOURCES = 3;

/**
 * Indicateurs surveillés pour la cohérence interne.
 * `tol` : écart toléré entre deux mentions (absolu, ou relatif si `relative`).
 * EUR/USD a une tolérance non nulle car le briefing cite légitimement deux sources
 * (fixing BCE de la veille et cotation Alpha Vantage intraday).
 */
export const INDICATORS = [
    { id: 'fear_greed', label: 'Fear & Greed', re: /Fear\s*(?:&amp;|&)\s*Greed[^0-9<]{0,25}?(\d{1,3})(?![\d.,])/gi, tol: 0 },
    { id: 'vix', label: 'VIX', re: /\bVIX\b[^0-9<]{0,20}?(\d{1,2}(?:[.,]\d{1,2})?)(?![\d])/g, tol: 0.5 },
    { id: 'treasury_10y', label: 'Treasury 10Y', re: /Treasury\s*(?:US\s*)?10\s*(?:Y|ans)\b[^0-9<]{0,25}?(\d(?:[.,]\d{1,2})?)\s*%/gi, tol: 0.05 },
    { id: 'eurusd', label: 'EUR/USD', re: /EUR\/USD[^0-9<]{0,30}?(\d[.,]\d{2,4})/g, tol: 0.01, relative: true },
];

const toNumber = (s) => Number(String(s).replace(',', '.'));

/**
 * Un chiffre précédé de ces marqueurs est un seuil, un scénario, une prévision ou un
 * point de départ (« VIX > 30 », « consensus ~3,9 % », « passe de 65 »), pas la valeur du jour.
 */
const THRESHOLD_WORDS = /[<>≥≤~]|\b(?:seuil|au-dessus|au-dessous|en dessous|sous|franchi\w*|passe de|de|consensus|attendu\w*|pr[ée]vu\w*|pr[ée]vision|objectif|cible)\b/i;

/** Un écart qui traverse une fin de phrase ou de proposition rattache le chiffre à autre chose. */
const CLAUSE_BREAK = /[.;:]\s/;

/**
 * Concatène toutes les chaînes du briefing, hors métadonnées : liste des sources et
 * clés internes préfixées « _ » (ex. `_contradictions`, où le pipeline consigne lui-même
 * les écarts entre sources — ces notes ne sont pas affichées et citent deux valeurs exprès).
 */
export function collectText(node, skipKeys = new Set(['sources_citees', 'model', 'type'])) {
    if (node == null) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(n => collectText(n, skipKeys)).join('\n');
    if (typeof node === 'object') {
        return Object.entries(node)
            .filter(([k]) => !skipKeys.has(k) && !k.startsWith('_'))
            .map(([, v]) => collectText(v, skipKeys))
            .join('\n');
    }
    return '';
}

// ─── Contrôles unitaires ────────────────────────────────────

export function checkFreshness(briefing, now, maxAgeHours) {
    const stamp = briefing.generated_at || briefing.date;
    const t = stamp ? new Date(stamp).getTime() : NaN;
    if (Number.isNaN(t)) {
        return { id: 'fraicheur', status: 'fail', message: 'aucune date exploitable (generated_at / date)' };
    }
    const ageH = (now.getTime() - t) / 3_600_000;
    const ageTxt = ageH >= 48 ? `${Math.floor(ageH / 24)} jours` : `${Math.round(ageH)} h`;
    if (ageH > maxAgeHours) {
        return { id: 'fraicheur', status: 'fail', ageHours: ageH,
            message: `briefing du ${stamp} — vieux de ${ageTxt} (max ${maxAgeHours} h). Le générateur ne tourne plus.` };
    }
    return { id: 'fraicheur', status: 'ok', ageHours: ageH, message: `briefing du ${stamp} (${ageTxt})` };
}

export function checkStructure(briefing) {
    const problems = [];
    if (!briefing.synthese?.contenu) problems.push('synthese.contenu absent');
    const n = Array.isArray(briefing.sources_citees) ? briefing.sources_citees.length : 0;
    if (n < MIN_SOURCES) problems.push(`${n} source(s) citée(s) < ${MIN_SOURCES}`);
    return problems.length
        ? { id: 'structure', status: 'fail', message: problems.join(' ; ') }
        : { id: 'structure', status: 'ok', message: `synthèse présente, ${n} sources citées` };
}

export function checkConsistency(text) {
    const conflicts = [];
    for (const ind of INDICATORS) {
        const values = [...text.matchAll(ind.re)]
            .filter(m => !THRESHOLD_WORDS.test(m[0]) && !CLAUSE_BREAK.test(m[0]))
            .map(m => toNumber(m[1]))
            .filter(Number.isFinite);
        if (values.length < 2) continue;
        const min = Math.min(...values), max = Math.max(...values);
        const gap = ind.relative ? (max - min) / min : max - min;
        if (gap > ind.tol) {
            const distinct = [...new Set(values.map(v => String(v).replace('.', ',')))];
            conflicts.push(`${ind.label} : ${distinct.join(' vs ')}`);
        }
    }
    return conflicts.length
        ? { id: 'coherence', status: 'fail', message: `valeurs contradictoires — ${conflicts.join(' ; ')}` }
        : { id: 'coherence', status: 'ok', message: 'aucune valeur contradictoire détectée' };
}

export function checkLabels(text) {
    const chiffre = text.match(/\bDXY\b[^0-9<]{0,30}?\d{2,3}(?:[.,]\d+)?/);
    if (chiffre) {
        return { id: 'libelles', status: 'fail',
            message: `« ${chiffre[0].replace(/\s+/g, ' ')} » : aucune source ne fournit le DXY (ICE). `
                + 'La série FRED DTWEXBGS est l’indice dollar large — écrire « indice dollar large ».' };
    }
    if (/\bDXY\b/.test(text)) {
        return { id: 'libelles', status: 'warn', message: 'mention de « DXY » sans chiffre : vérifier qu’il ne désigne pas DTWEXBGS' };
    }
    return { id: 'libelles', status: 'ok', message: 'aucun libellé DXY trompeur' };
}

export function checkTraceability(briefing, sources, fresh) {
    if (!fresh) {
        return { id: 'tracabilite', status: 'skip', message: 'briefing périmé : les données ont bougé depuis, comparaison impossible' };
    }
    if (!sources) {
        return { id: 'tracabilite', status: 'skip', message: 'données sources non chargées' };
    }
    const ev = evaluateBriefing(briefing, sources);
    const pct = Math.round(ev.score * 100);
    const exemples = ev.details.filter(d => d.status === 'unverified').slice(0, 5)
        .map(d => d.claim?.raw ?? d.raw).filter(Boolean);
    const suffix = exemples.length ? ` — non retrouvés : ${exemples.join(', ')}` : '';
    return {
        id: 'tracabilite',
        status: ev.pass ? 'ok' : 'fail',
        score: ev.score,
        message: `${ev.verified}/${ev.totalClaims} chiffres retrouvés dans data/ (${pct} %, seuil ${Math.round(MIN_ACCEPTABLE_SCORE * 100)} %)${ev.pass ? '' : suffix}`,
    };
}

// ─── Orchestration ──────────────────────────────────────────

export function checkBriefing(briefing, { now = new Date(), maxAgeHours = DEFAULT_MAX_AGE_HOURS, sources = null } = {}) {
    const text = collectText(briefing);
    const freshness = checkFreshness(briefing, now, maxAgeHours);
    const checks = [
        freshness,
        checkStructure(briefing),
        checkConsistency(text),
        checkLabels(text),
        checkTraceability(briefing, sources, freshness.status === 'ok'),
    ];
    return { ok: checks.every(c => c.status !== 'fail'), checks };
}

export function loadSources(dir = DATA_DIR) {
    const load = (f) => {
        const p = join(dir, f);
        if (!existsSync(p)) return null;
        try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
    };
    return {
        markets: load('markets.json'),
        crypto: load('crypto.json'),
        fearGreed: load('fear-greed.json'),
        macro: load('macro.json'),
        globalMacro: load('global-macro.json'),
        commodities: load('commodities.json'),
        europeanMarkets: load('european-markets.json'),
        defi: load('defi.json'),
        alphaVantage: load('alpha-vantage.json'),
        onchain: load('onchain.json'),
    };
}

// ─── CLI ────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
    const arg = (name, def) => {
        const i = process.argv.indexOf(name);
        return i > -1 ? process.argv[i + 1] : def;
    };
    const file = arg('--file', join(DATA_DIR, 'daily-briefing.json'));
    const maxAgeHours = Number(arg('--max-age-hours', DEFAULT_MAX_AGE_HOURS));

    let briefing;
    try {
        briefing = JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
        console.error(`❌ Lecture impossible de ${file} : ${e.message}`);
        process.exit(1);
    }

    const result = checkBriefing(briefing, { maxAgeHours, sources: loadSources() });

    if (process.argv.includes('--json')) {
        console.log(JSON.stringify(result, null, 2));
    } else {
        const icon = { ok: '✅', warn: '⚠️ ', fail: '❌', skip: '⏭ ' };
        console.log(`Contrôle du briefing — ${file}`);
        for (const c of result.checks) console.log(`  ${icon[c.status]} ${c.id.padEnd(12)} ${c.message}`);
        console.log(result.ok ? '\n✅ Briefing publiable' : '\n❌ Briefing NON publiable');
    }

    if (process.env.GITHUB_ACTIONS) {
        for (const c of result.checks) {
            if (c.status === 'fail') console.log(`::error title=Briefing — ${c.id}::${c.message}`);
            if (c.status === 'warn') console.log(`::warning title=Briefing — ${c.id}::${c.message}`);
        }
    }

    process.exit(result.ok ? 0 : 1);
}
