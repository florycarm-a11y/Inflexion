#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// SEMPLICE v2.0 Evaluation Validator
// 3-Layer architecture: Deterministic Rules -> Risk Signatures -> AI Coherence
// Inflexion Intelligence — Mars 2026
//
// Usage:
//   node scripts/semplice-validator.mjs path/to/evaluation.json
//   node scripts/semplice-validator.mjs --all
//   node scripts/semplice-validator.mjs --all --no-ai
//   node scripts/semplice-validator.mjs --all --json
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, basename, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── ANSI Colors ─────────────────────────────────────────────────────────

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
};

const ICON_PASS    = `${C.green}\u2713${C.reset}`;
const ICON_FLAG    = `${C.yellow}\u26A0${C.reset}`;
const ICON_MATCH   = `\uD83D\uDD34`;
const ICON_NOMATCH = `\u26AA`;
const ICON_SKIP    = `${C.dim}-${C.reset}`;

// ─── Constants ───────────────────────────────────────────────────────────

const DIMENSION_KEYS = ['S', 'E', 'M', 'P', 'L', 'I', 'C', 'Ee'];

const DIMENSION_WEIGHTS = {
  M:  0.16,  // Military — direct physical threat, irreversible
  E:  0.15,  // Economic — systemic stability
  P:  0.14,  // Political — governance, regime stability
  S:  0.12,  // Social — population fundamentals
  I:  0.12,  // Information — narrative control, early warning signal
  C:  0.11,  // Cyber — modern threat vector, force multiplier
  Ee: 0.10,  // Environmental — long-term, structural
  L:  0.10,  // Legal — business environment
};

const EVALUATIONS_DIR = resolve(__dirname, '..', 'data', 'semplice', 'evaluations-test-v2');

// ─── Schema Validation (Lightweight, no external deps) ───────────────────

function validateSchema(data) {
  const errors = [];

  function req(obj, field, path) {
    if (obj == null || !(field in obj)) {
      errors.push(`Missing required field: ${path}.${field}`);
      return false;
    }
    return true;
  }

  function checkType(val, type, path) {
    if (type === 'number' && typeof val !== 'number') {
      errors.push(`${path}: expected number, got ${typeof val}`);
      return false;
    }
    if (type === 'string' && typeof val !== 'string') {
      errors.push(`${path}: expected string, got ${typeof val}`);
      return false;
    }
    if (type === 'integer' && !Number.isInteger(val)) {
      errors.push(`${path}: expected integer, got ${val}`);
      return false;
    }
    if (type === 'array' && !Array.isArray(val)) {
      errors.push(`${path}: expected array, got ${typeof val}`);
      return false;
    }
    if (type === 'object' && (typeof val !== 'object' || val === null || Array.isArray(val))) {
      errors.push(`${path}: expected object, got ${typeof val}`);
      return false;
    }
    return true;
  }

  function checkRange(val, min, max, path) {
    if (typeof val === 'number' && (val < min || val > max)) {
      errors.push(`${path}: value ${val} out of range [${min}, ${max}]`);
    }
  }

  // Root required fields
  for (const f of ['zone', 'meta', 'dimensions', 'composite', 'classification', 'signatures', 'flags']) {
    req(data, f, '$');
  }

  // Zone
  if (data.zone && checkType(data.zone, 'object', '$.zone')) {
    for (const f of ['id', 'name', 'region']) req(data.zone, f, '$.zone');
    if (data.zone.id && !/^[a-z0-9-]+$/.test(data.zone.id)) {
      errors.push(`$.zone.id: invalid format "${data.zone.id}" (expected kebab-case)`);
    }
    const validRegions = ['europe', 'asie', 'afrique', 'ameriques', 'moyen-orient', 'oceanie', 'arctique', 'multi-regional'];
    if (data.zone.region && !validRegions.includes(data.zone.region)) {
      errors.push(`$.zone.region: invalid value "${data.zone.region}"`);
    }
  }

  // Meta
  if (data.meta && checkType(data.meta, 'object', '$.meta')) {
    for (const f of ['date', 'version', 'analyst']) req(data.meta, f, '$.meta');
    if (data.meta.version && data.meta.version !== '2.0') {
      errors.push(`$.meta.version: expected "2.0", got "${data.meta.version}"`);
    }
    if (data.meta.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.meta.date)) {
      errors.push(`$.meta.date: invalid date format "${data.meta.date}"`);
    }
  }

  // Composite & Classification
  if (data.composite != null) {
    checkType(data.composite, 'number', '$.composite');
    checkRange(data.composite, 1, 7, '$.composite');
  }
  if (data.classification != null) {
    const valid = ['Tres faible', 'Faible', 'Modere-Faible', 'Modere', 'Modere-Eleve', 'Eleve', 'Tres eleve', 'Critique'];
    if (!valid.includes(data.classification)) {
      errors.push(`$.classification: invalid value "${data.classification}"`);
    }
  }

  // Signatures & Flags (arrays)
  if (data.signatures != null) checkType(data.signatures, 'array', '$.signatures');
  if (data.flags != null) checkType(data.flags, 'array', '$.flags');

  // Dimensions
  if (data.dimensions && checkType(data.dimensions, 'object', '$.dimensions')) {
    for (const dk of DIMENSION_KEYS) {
      if (!req(data.dimensions, dk, '$.dimensions')) continue;
      const dim = data.dimensions[dk];
      if (!checkType(dim, 'object', `$.dimensions.${dk}`)) continue;

      for (const f of ['label', 'indicators', 'scoreQuanti', 'scoreQuali', 'scoreFinal', 'trend']) {
        req(dim, f, `$.dimensions.${dk}`);
      }
      if (dim.scoreQuanti != null) {
        checkType(dim.scoreQuanti, 'number', `$.dimensions.${dk}.scoreQuanti`);
        checkRange(dim.scoreQuanti, 1, 7, `$.dimensions.${dk}.scoreQuanti`);
      }
      if (dim.scoreQuali != null) {
        checkType(dim.scoreQuali, 'integer', `$.dimensions.${dk}.scoreQuali`);
        checkRange(dim.scoreQuali, 1, 7, `$.dimensions.${dk}.scoreQuali`);
      }
      if (dim.scoreFinal != null) {
        checkType(dim.scoreFinal, 'number', `$.dimensions.${dk}.scoreFinal`);
        checkRange(dim.scoreFinal, 1, 7, `$.dimensions.${dk}.scoreFinal`);
      }
      if (dim.trend != null) {
        if (!['up', 'down', 'stable'].includes(dim.trend)) {
          errors.push(`$.dimensions.${dk}.trend: invalid value "${dim.trend}"`);
        }
      }

      // Indicators
      if (dim.indicators && checkType(dim.indicators, 'array', `$.dimensions.${dk}.indicators`)) {
        for (let i = 0; i < dim.indicators.length; i++) {
          const ind = dim.indicators[i];
          const ip = `$.dimensions.${dk}.indicators[${i}]`;
          if (!checkType(ind, 'object', ip)) continue;
          for (const f of ['id', 'label', 'value', 'palier', 'source']) {
            req(ind, f, ip);
          }
          if (ind.id && !/^(S|E|M|P|L|I|C|Ee)\d{1,2}$/.test(ind.id)) {
            errors.push(`${ip}.id: invalid format "${ind.id}"`);
          }
          if (ind.palier != null) {
            checkType(ind.palier, 'integer', `${ip}.palier`);
            checkRange(ind.palier, 1, 7, `${ip}.palier`);
          }
        }
      }
    }
  }

  return errors;
}

// ─── Accessors ───────────────────────────────────────────────────────────

/** Get an indicator's palier by its full ID (e.g. 'E3', 'M7', 'Ee9'). */
function getPalier(data, indicatorId) {
  const match = indicatorId.match(/^(S|E|M|P|L|I|C|Ee)(\d{1,2})$/);
  if (!match) return null;
  const dimKey = match[1];
  const dim = data.dimensions?.[dimKey];
  if (!dim?.indicators) return null;
  const indicator = dim.indicators.find(ind => ind.id === indicatorId);
  return indicator?.palier ?? null;
}

/** Get a dimension's scoreFinal. */
function dimScore(data, dk) {
  return data.dimensions?.[dk]?.scoreFinal ?? null;
}

/** Get a dimension's scoreQuanti. */
function dimQuanti(data, dk) {
  return data.dimensions?.[dk]?.scoreQuanti ?? null;
}

/** Get a dimension's scoreQuali. */
function dimQuali(data, dk) {
  return data.dimensions?.[dk]?.scoreQuali ?? null;
}

// ─── Weighted Composite (v2.0) ──────────────────────────────────────────

/**
 * Compute weighted composite with peak amplification.
 * @param {object} data — full evaluation object
 * @returns {{ baseComposite: number, amplifiedComposite: number, weights: object, amplifications: Array }}
 */
function computeWeightedComposite(data) {
  const scores = {};
  for (const dk of DIMENSION_KEYS) {
    const s = dimScore(data, dk);
    if (s != null) scores[dk] = s;
  }

  // Step 1: base weighted composite
  let weightSum = 0;
  let weightedSum = 0;
  for (const dk of DIMENSION_KEYS) {
    if (scores[dk] == null) continue;
    const w = DIMENSION_WEIGHTS[dk];
    weightedSum += w * scores[dk];
    weightSum += w;
  }
  const baseComposite = weightSum > 0 ? weightedSum / weightSum : 0;

  // Step 2: peak amplification
  const AMPLIFICATION_THRESHOLD = 1.0;
  const AMPLIFICATION_FACTOR = 0.20;
  const MAX_AMPLIFICATION_DELTA = 0.3;

  const amplifiedWeights = {};
  const amplifications = [];
  for (const dk of DIMENSION_KEYS) {
    amplifiedWeights[dk] = DIMENSION_WEIGHTS[dk];
  }

  for (const dk of DIMENSION_KEYS) {
    if (scores[dk] == null) continue;
    const delta = scores[dk] - baseComposite;
    if (delta > AMPLIFICATION_THRESHOLD) {
      const bonus = AMPLIFICATION_FACTOR * (delta - AMPLIFICATION_THRESHOLD);
      amplifiedWeights[dk] += bonus;
      amplifications.push({
        dim: dk,
        base: DIMENSION_WEIGHTS[dk],
        amplified: amplifiedWeights[dk],
        reason: `${dk}=${scores[dk].toFixed(1)} exceeds composite ${baseComposite.toFixed(1)} by ${delta.toFixed(2)}`,
      });
    }
  }

  // Step 3: renormalize weights to sum to 1.0
  const totalAmplifiedWeight = DIMENSION_KEYS.reduce((sum, dk) => sum + (scores[dk] != null ? amplifiedWeights[dk] : 0), 0);
  const finalWeights = {};
  for (const dk of DIMENSION_KEYS) {
    if (scores[dk] != null) {
      finalWeights[dk] = totalAmplifiedWeight > 0 ? amplifiedWeights[dk] / totalAmplifiedWeight : DIMENSION_WEIGHTS[dk];
    }
  }

  // Step 4: recompute with amplified weights
  let amplifiedSum = 0;
  let amplifiedWeightSum = 0;
  for (const dk of DIMENSION_KEYS) {
    if (scores[dk] == null) continue;
    amplifiedSum += finalWeights[dk] * scores[dk];
    amplifiedWeightSum += finalWeights[dk];
  }
  let amplifiedComposite = amplifiedWeightSum > 0 ? amplifiedSum / amplifiedWeightSum : baseComposite;

  // Step 5: cap amplification effect at +0.3
  if (amplifiedComposite - baseComposite > MAX_AMPLIFICATION_DELTA) {
    amplifiedComposite = baseComposite + MAX_AMPLIFICATION_DELTA;
  }

  return {
    baseComposite: Math.round(baseComposite * 100) / 100,
    amplifiedComposite: Math.round(amplifiedComposite * 100) / 100,
    weights: Object.fromEntries(
      Object.entries(finalWeights).map(([k, v]) => [k, Math.round(v * 1000) / 1000])
    ),
    amplifications,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYER 1 — Deterministic Cross-Validation Rules (8 rules)
// ═══════════════════════════════════════════════════════════════════════════

const RULES = [
  // ── R1: Debt False Positive ──
  {
    id: 'R1',
    name: 'Debt False Positive',
    check(data) {
      const e3 = getPalier(data, 'E3');
      const e5 = getPalier(data, 'E5');
      if (e3 == null || e5 == null) return { status: 'skip', detail: 'Missing E3 or E5' };
      if (e3 >= 5 && e5 <= 2) {
        return {
          status: 'flag',
          type: 'false-positive',
          dimension: 'E',
          indicator: 'E3',
          message: `E3 (debt/GDP) palier=${e3} but E5 (sovereign rating) palier=${e5} — sovereign assets likely exceed debt (Singapore-type). E3 is a likely false positive.`,
          detail: `E3=${e3}, E5=${e5}`,
        };
      }
      return { status: 'pass', detail: `E3=${e3}, E5=${e5}` };
    },
  },
  // ── R2: Military Paradox ──
  {
    id: 'R2',
    name: 'Military Paradox',
    check(data) {
      const m1 = getPalier(data, 'M1');
      const m2 = getPalier(data, 'M2');
      if (m1 == null || m2 == null) return { status: 'skip', detail: 'Missing M1 or M2' };
      if (m1 >= 4 && m2 <= 2) {
        return {
          status: 'flag',
          type: 'methodology',
          dimension: 'M',
          indicator: 'M1',
          message: `M1 (defense spending) palier=${m1} but M2 (active conflicts) palier=${m2} — high spending without threat = deterrence posture, not risk.`,
          detail: `M1=${m1}, M2=${m2}`,
        };
      }
      return { status: 'pass', detail: `M1=${m1}, M2=${m2}` };
    },
  },
  // ── R3: Cyber/Infra Mismatch ──
  {
    id: 'R3',
    name: 'Cyber/Infra Mismatch',
    check(data) {
      const c2 = getPalier(data, 'C2');
      const c5 = getPalier(data, 'C5');
      if (c2 == null || c5 == null) return { status: 'skip', detail: 'Missing C2 or C5' };
      if (c2 <= 2 && c5 >= 5) {
        return {
          status: 'flag',
          type: 'data-gap',
          dimension: 'C',
          indicator: 'C5',
          message: `C2 (GCI maturity) palier=${c2} but C5 (infra exposure) palier=${c5} — mature cyber yet high exposure is inconsistent, verify data.`,
          detail: `C2=${c2}, C5=${c5}`,
        };
      }
      return { status: 'pass', detail: `C2=${c2}, C5=${c5}` };
    },
  },
  // ── R4: Press Freedom Paradox ──
  {
    id: 'R4',
    name: 'Press Freedom Paradox',
    check(data) {
      const i1 = getPalier(data, 'I1');
      const i9 = getPalier(data, 'I9');
      const p1 = getPalier(data, 'P1');
      if (i1 == null || i9 == null || p1 == null) return { status: 'skip', detail: 'Missing I1, I9, or P1' };
      if (i1 >= 4 && i9 <= 1 && p1 <= 2) {
        return {
          status: 'flag',
          type: 'methodology',
          dimension: 'I',
          indicator: 'I1',
          message: `I1 (RSF rank) palier=${i1} but I9 (journalists imprisoned) palier=${i9} and P1 (CPI) palier=${p1} — bad press ranking in clean/safe country = RSF methodology artifact.`,
          detail: `I1=${i1}, I9=${i9}, P1=${p1}`,
        };
      }
      return { status: 'pass', detail: `I1=${i1}, I9=${i9}, P1=${p1}` };
    },
  },
  // ── R5: Economic Decoupling ──
  {
    id: 'R5',
    name: 'Economic Decoupling',
    check(data) {
      const e1 = getPalier(data, 'E1');
      const e9 = getPalier(data, 'E9');
      if (e1 == null || e9 == null) return { status: 'skip', detail: 'Missing E1 or E9' };
      if (e1 <= 2 && e9 >= 5) {
        return {
          status: 'flag',
          type: 'data-gap',
          dimension: 'E',
          indicator: 'E9',
          message: `E1 (GDP growth) palier=${e1} but E9 (unemployment) palier=${e9} — growth without employment = structural issue or data lag.`,
          detail: `E1=${e1}, E9=${e9}`,
        };
      }
      return { status: 'pass', detail: `E1=${e1}, E9=${e9}` };
    },
  },
  // ── R6: Democratic Autocracy ──
  {
    id: 'R6',
    name: 'Democratic Autocracy',
    check(data) {
      const p2 = getPalier(data, 'P2');
      const p1 = getPalier(data, 'P1');
      const l1 = getPalier(data, 'L1');
      if (p2 == null || p1 == null || l1 == null) return { status: 'skip', detail: 'Missing P2, P1, or L1' };
      if (p2 >= 4 && p1 <= 2 && l1 <= 2) {
        return {
          status: 'flag',
          type: 'methodology',
          dimension: 'P',
          indicator: 'P2',
          message: `P2 (V-Dem) palier=${p2} but P1 (CPI) palier=${p1} and L1 (rule of law) palier=${l1} — Singapore-type efficient autocracy, V-Dem may overweight democracy dimension.`,
          detail: `P2=${p2}, P1=${p1}, L1=${l1}`,
        };
      }
      return { status: 'pass', detail: `P2=${p2}, P1=${p1}, L1=${l1}` };
    },
  },
  // ── R7: Environmental SIDS ──
  {
    id: 'R7',
    name: 'Environmental SIDS',
    check(data) {
      const ee9 = getPalier(data, 'Ee9');
      const ee2 = getPalier(data, 'Ee2');
      const ee6 = getPalier(data, 'Ee6');
      if (ee9 == null || ee2 == null || ee6 == null) return { status: 'skip', detail: 'Missing Ee9, Ee2, or Ee6' };
      if (ee9 >= 5 && ee2 >= 4 && ee6 <= 2) {
        return {
          status: 'flag',
          type: 'methodology',
          dimension: 'Ee',
          indicator: 'Ee9',
          message: `Ee9 (sea level) palier=${ee9} and Ee2 (water stress) palier=${ee2} but Ee6 (CO2/capita) palier=${ee6} — climate victim, not polluter. Separate vulnerability from responsibility.`,
          detail: `Ee9=${ee9}, Ee2=${ee2}, Ee6=${ee6}`,
        };
      }
      return { status: 'pass', detail: `Ee9=${ee9}, Ee2=${ee2}, Ee6=${ee6}` };
    },
  },
  // ── R8: Quanti/Quali Divergence ──
  {
    id: 'R8',
    name: 'Quanti/Quali Divergence',
    check(data) {
      const flagged = [];
      const allDetails = [];
      for (const dk of DIMENSION_KEYS) {
        const quanti = dimQuanti(data, dk);
        const quali = dimQuali(data, dk);
        if (quanti == null || quali == null) continue;
        const delta = Math.abs(quanti - quali);
        allDetails.push(`${dk}: quanti=${quanti}, quali=${quali} (\u0394=${delta.toFixed(1)})`);
        if (delta > 2.0) {
          flagged.push({ dim: dk, quanti, quali, delta });
        }
      }
      if (flagged.length > 0) {
        const msgs = flagged.map(f =>
          `${f.dim}: quanti=${f.quanti}, quali=${f.quali} (\u0394=${f.delta.toFixed(1)})`
        );
        return {
          status: 'flag',
          type: 'methodology',
          dimension: flagged[0].dim,
          indicator: '-',
          message: `Quanti/Quali divergence > 2.0 in: ${msgs.join('; ')}. Analyst significantly overrides data, justification required.`,
          detail: allDetails.join(' | '),
        };
      }
      const maxDelta = DIMENSION_KEYS.reduce((mx, dk) => {
        const q = dimQuanti(data, dk);
        const ql = dimQuali(data, dk);
        return (q != null && ql != null) ? Math.max(mx, Math.abs(q - ql)) : mx;
      }, 0);
      return { status: 'pass', detail: `Max \u0394=${maxDelta.toFixed(1)}` };
    },
  },
];

function runLayer1(data) {
  return RULES.map(rule => {
    const result = rule.check(data);
    return { id: rule.id, name: rule.name, ...result };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYER 2 — Multi-Dimensional Risk Signatures (8 patterns)
// ═══════════════════════════════════════════════════════════════════════════

const SIGNATURES = [
  {
    id: 'SIG1',
    label: 'Invasion/War',
    description: 'M >= 5.5 AND C >= 5.0 AND I >= 5.0 AND S >= 4.0',
    severity: 'critical',
    conditions: [
      { dim: 'M', min: 5.5, weight: 1.0 },
      { dim: 'C', min: 5.0, weight: 0.8 },
      { dim: 'I', min: 5.0, weight: 0.7 },
      { dim: 'S', min: 4.0, weight: 0.5 },
    ],
    indicators: [],
  },
  {
    id: 'SIG2',
    label: "Coup d'Etat",
    description: 'M >= 4.0 AND P >= 5.0 AND (M7 >= 4 OR M6 >= 3)',
    severity: 'critical',
    conditions: [
      { dim: 'M', min: 4.0, weight: 0.8 },
      { dim: 'P', min: 5.0, weight: 1.0 },
    ],
    indicators: [
      { id: 'M7', minPalier: 4, weight: 0.6 },
      { id: 'M6', minPalier: 3, weight: 0.4 },
    ],
  },
  {
    id: 'SIG3',
    label: 'Revolution/Uprising',
    description: 'S >= 5.0 AND P >= 4.5 AND I >= 4.0',
    severity: 'high',
    conditions: [
      { dim: 'S', min: 5.0, weight: 1.0 },
      { dim: 'P', min: 4.5, weight: 0.9 },
      { dim: 'I', min: 4.0, weight: 0.7 },
    ],
    indicators: [],
  },
  {
    id: 'SIG4',
    label: 'Financial Crisis',
    description: 'E >= 5.0 AND L >= 4.0 AND E3 >= 5 AND E5 >= 5',
    severity: 'high',
    conditions: [
      { dim: 'E', min: 5.0, weight: 1.0 },
      { dim: 'L', min: 4.0, weight: 0.6 },
    ],
    indicators: [
      { id: 'E3', minPalier: 5, weight: 0.5 },
      { id: 'E5', minPalier: 5, weight: 0.5 },
    ],
  },
  {
    id: 'SIG5',
    label: 'Climate Catastrophe',
    description: 'Ee >= 4.5 AND S >= 3.5 AND E >= 3.5',
    severity: 'high',
    conditions: [
      { dim: 'Ee', min: 4.5, weight: 1.0 },
      { dim: 'S',  min: 3.5, weight: 0.6 },
      { dim: 'E',  min: 3.5, weight: 0.5 },
    ],
    indicators: [],
  },
  {
    id: 'SIG6',
    label: 'Cyber War',
    description: 'C >= 5.0 AND M >= 4.0 AND I >= 4.5',
    severity: 'critical',
    conditions: [
      { dim: 'C', min: 5.0, weight: 1.0 },
      { dim: 'M', min: 4.0, weight: 0.7 },
      { dim: 'I', min: 4.5, weight: 0.6 },
    ],
    indicators: [],
  },
  {
    id: 'SIG7',
    label: 'State Capture',
    description: 'P >= 4.5 AND L >= 4.5 AND I >= 4.0 AND P1 (CPI) palier >= 5',
    severity: 'high',
    conditions: [
      { dim: 'P', min: 4.5, weight: 1.0 },
      { dim: 'L', min: 4.5, weight: 0.9 },
      { dim: 'I', min: 4.0, weight: 0.7 },
    ],
    indicators: [
      { id: 'P1', minPalier: 5, weight: 0.6 },
    ],
  },
  {
    id: 'SIG8',
    label: 'Fragile State',
    description: 'ALL dimensions >= 3.5',
    severity: 'critical',
    conditions: DIMENSION_KEYS.map(dk => ({ dim: dk, min: 3.5, weight: 1.0 })),
    indicators: [],
  },
];

/**
 * Compute match percentage for a signature against an evaluation.
 * Returns a score 0-100 representing how well the evaluation fits the pattern.
 */
function computeSignatureMatch(sig, data) {
  let totalWeight = 0;
  let matchedWeight = 0;
  const dimScores = {};

  // Evaluate dimension conditions
  for (const cond of sig.conditions) {
    const score = dimScore(data, cond.dim);
    if (score == null) continue;
    dimScores[cond.dim] = score;
    totalWeight += cond.weight;

    if (score >= cond.min) {
      // Full credit at threshold, bonus for exceeding
      const excess = score - cond.min;
      const range = 7 - cond.min;
      const ratio = range > 0 ? Math.min(1.0, excess / range) : 1.0;
      matchedWeight += cond.weight * (0.6 + 0.4 * ratio);
    } else {
      // Partial credit if within 1.0 point of threshold
      const deficit = cond.min - score;
      if (deficit <= 1.0) {
        matchedWeight += cond.weight * 0.3 * (1 - deficit);
      }
    }
  }

  // Evaluate indicator conditions (bonus criteria)
  for (const indCond of sig.indicators) {
    const palier = getPalier(data, indCond.id);
    if (palier == null) continue;
    totalWeight += indCond.weight;
    if (palier >= indCond.minPalier) {
      matchedWeight += indCond.weight;
    } else if (palier >= indCond.minPalier - 1) {
      matchedWeight += indCond.weight * 0.3;
    }
  }

  const pct = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
  return { pct, dimScores };
}

function runLayer2(data) {
  const results = SIGNATURES.map(sig => {
    const { pct, dimScores } = computeSignatureMatch(sig, data);
    return {
      id: sig.id,
      label: sig.label,
      description: sig.description,
      severity: sig.severity,
      pct,
      isMatch: pct >= 60,
      dimScores,
    };
  });
  // Sort by match percentage descending
  results.sort((a, b) => b.pct - a.pct);
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYER 3 — AI Coherence Check (Claude Haiku, optional)
// ═══════════════════════════════════════════════════════════════════════════

async function runLayer3(data, layer1Results, layer2Results) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { skipped: true, reason: 'ANTHROPIC_API_KEY not set — set the env variable to enable AI coherence check' };
  }

  const l1Flags = layer1Results
    .filter(r => r.status === 'flag')
    .map(r => `${r.id} ${r.name}: ${r.message}`)
    .join('\n') || 'No flags detected.';

  const l2Summary = layer2Results
    .filter(r => r.isMatch)
    .map(r => `${r.id} ${r.label} (${r.pct}%)`)
    .join(', ') || 'No signatures matched.';

  const dimensionSummary = DIMENSION_KEYS.map(dk => {
    const dim = data.dimensions[dk];
    if (!dim) return `${dk}: missing`;
    return `${dk} (${dim.label}): final=${dim.scoreFinal}, quanti=${dim.scoreQuanti}, quali=${dim.scoreQuali}, trend=${dim.trend}`;
  }).join('\n');

  const indicatorSummary = DIMENSION_KEYS.map(dk => {
    const dim = data.dimensions[dk];
    if (!dim?.indicators) return '';
    return dim.indicators.map(ind => `${ind.id}: palier=${ind.palier} "${ind.value}"`).join('\n');
  }).filter(Boolean).join('\n');

  const prompt = `You are a SEMPLICE v2.0 geopolitical risk evaluation auditor for Inflexion Intelligence.
Evaluate the internal coherence of the following evaluation. Respond ONLY with valid JSON.

## Zone
${data.zone.name} (${data.zone.region}) -- ${data.meta.date}
Composite: ${data.composite}/7 -- Classification: ${data.classification}

## Dimension Scores
${dimensionSummary}

## Key Indicators
${indicatorSummary}

## Layer 1 Flags
${l1Flags}

## Layer 2 Signatures
${l2Summary}

## Instructions
1. Verify internal coherence: are dimension scores consistent with each other and with the composite?
2. Identify additional anomalies not caught by the automated rules above
3. Rate your confidence in this evaluation from 1 (very low) to 10 (very high)

Respond with this exact JSON format (no markdown, no explanation, just JSON):
{"confidence":8,"coherent":true,"notes":"2-3 sentences summarizing assessment","anomalies":["anomaly1 if any"]}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20250414',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return { skipped: false, error: `API error ${response.status}: ${body.slice(0, 200)}` };
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '';

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { skipped: false, error: `Could not parse AI response: ${text.slice(0, 200)}` };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      skipped: false,
      confidence: parsed.confidence ?? null,
      coherent: parsed.coherent ?? null,
      notes: parsed.notes ?? '',
      anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
    };
  } catch (err) {
    return { skipped: false, error: `AI check failed: ${err.message}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Structural Integrity Checks
// ═══════════════════════════════════════════════════════════════════════════

function runStructuralChecks(data) {
  const warnings = [];

  // Verify scoreFinal = 0.6 * scoreQuanti + 0.4 * scoreQuali (tolerance 0.15)
  for (const dk of DIMENSION_KEYS) {
    const dim = data.dimensions?.[dk];
    if (!dim || dim.scoreQuanti == null || dim.scoreQuali == null || dim.scoreFinal == null) continue;
    const expected = 0.6 * dim.scoreQuanti + 0.4 * dim.scoreQuali;
    const diff = Math.abs(dim.scoreFinal - expected);
    if (diff > 0.15) {
      warnings.push(
        `${dk}: scoreFinal=${dim.scoreFinal} != 0.6*${dim.scoreQuanti} + 0.4*${dim.scoreQuali} = ${expected.toFixed(2)} (\u0394=${diff.toFixed(2)})`
      );
    }
  }

  // Verify composite = mean(scoreFinal) (tolerance 0.15)
  const finals = DIMENSION_KEYS.map(dk => data.dimensions?.[dk]?.scoreFinal).filter(v => v != null);
  if (finals.length === 8 && data.composite != null) {
    const expected = finals.reduce((a, b) => a + b, 0) / 8;
    const diff = Math.abs(data.composite - expected);
    if (diff > 0.15) {
      warnings.push(
        `Composite=${data.composite} != mean(scoreFinals)=${expected.toFixed(2)} (\u0394=${diff.toFixed(2)})`
      );
    }
  }

  // Verify composite vs weighted composite (informational)
  if (finals.length === 8 && data.composite != null) {
    const wc = computeWeightedComposite(data);
    const simpleAvg = finals.reduce((a, b) => a + b, 0) / 8;
    const diff = Math.abs(data.composite - wc.amplifiedComposite);
    if (diff > 0.3) {
      warnings.push(
        `Weighted composite: ${wc.amplifiedComposite.toFixed(2)} vs declared ${data.composite} (\u0394=${diff.toFixed(2)}). Base weighted=${wc.baseComposite.toFixed(2)}, simple avg=${simpleAvg.toFixed(2)}`
      );
    }
  }

  // Verify scoreQuanti = mean(paliers) (tolerance 0.3)
  for (const dk of DIMENSION_KEYS) {
    const dim = data.dimensions?.[dk];
    if (!dim?.indicators || dim.indicators.length === 0 || dim.scoreQuanti == null) continue;
    const paliers = dim.indicators.map(i => i.palier).filter(p => p != null);
    if (paliers.length === 0) continue;
    const avgPalier = paliers.reduce((a, b) => a + b, 0) / paliers.length;
    const diff = Math.abs(dim.scoreQuanti - avgPalier);
    if (diff > 0.3) {
      warnings.push(
        `${dk}: scoreQuanti=${dim.scoreQuanti} != mean(paliers)=${avgPalier.toFixed(2)} (\u0394=${diff.toFixed(2)})`
      );
    }
  }

  // Verify 60/40 quanti/quali ratio enforcement
  // Each dimension should have enough quantitative indicators (with rawValue)
  // to justify the 60% weight on scoreQuanti. Minimum: 4 quanti indicators.
  const EXPECTED_QUANTI_WEIGHT = 0.60;
  const EXPECTED_QUALI_WEIGHT = 0.40;
  const MIN_QUANTI_INDICATORS = 4;
  const RATIO_TOLERANCE = 0.10; // 10% deviation allowed

  for (const dk of DIMENSION_KEYS) {
    const dim = data.dimensions?.[dk];
    if (!dim?.indicators || dim.indicators.length === 0) continue;

    const quantiCount = dim.indicators.filter(i => i.rawValue != null || (typeof i.value === 'string' && /[\d.]+/.test(i.value))).length;
    const qualiCount = dim.indicators.length - quantiCount;
    const total = dim.indicators.length;

    if (total > 0) {
      const actualQuantiRatio = quantiCount / total;
      const deviation = Math.abs(actualQuantiRatio - EXPECTED_QUANTI_WEIGHT);

      if (quantiCount < MIN_QUANTI_INDICATORS) {
        warnings.push(
          `${dk}: only ${quantiCount}/${total} quantitative indicators (min ${MIN_QUANTI_INDICATORS}). ` +
          `60% quanti weight may be over-reliant on sparse data.`
        );
      }

      if (deviation > RATIO_TOLERANCE && actualQuantiRatio < EXPECTED_QUANTI_WEIGHT) {
        warnings.push(
          `${dk}: quanti/quali ratio ${(actualQuantiRatio * 100).toFixed(0)}%/${((1 - actualQuantiRatio) * 100).toFixed(0)}% ` +
          `deviates from target 60/40 by ${(deviation * 100).toFixed(0)}pp. ` +
          `Consider adding quantitative indicators or adjusting weights.`
        );
      }
    }
  }

  return warnings;
}

// ═══════════════════════════════════════════════════════════════════════════
// Output Formatting
// ═══════════════════════════════════════════════════════════════════════════

function formatConsole(filePath, data, schemaErrors, structWarnings, layer1, layer2, layer3) {
  const lines = [];
  const w = (s) => lines.push(s);

  w('');
  w(`${C.bold}${C.cyan}\u2550\u2550\u2550 SEMPLICE v2.0 Validator \u2550\u2550\u2550${C.reset}`);
  w(`${C.bold}Zone:${C.reset} ${data.zone?.name ?? 'Unknown'} (${data.zone?.region ?? '?'}) \u2014 ${data.meta?.date ?? '?'}`);
  w(`${C.bold}Composite:${C.reset} ${data.composite ?? '?'}/7 [${C.bold}${data.classification ?? '?'}${C.reset}]`);
  w(`${C.dim}File: ${filePath}${C.reset}`);

  // Schema errors
  if (schemaErrors.length > 0) {
    w('');
    w(`${C.bold}${C.red}\u2500\u2500 Schema Errors (${schemaErrors.length}) \u2500\u2500${C.reset}`);
    for (const err of schemaErrors) {
      w(`  ${C.red}\u2717${C.reset} ${err}`);
    }
  }

  // Structural warnings
  if (structWarnings.length > 0) {
    w('');
    w(`${C.bold}${C.yellow}\u2500\u2500 Structural Warnings (${structWarnings.length}) \u2500\u2500${C.reset}`);
    for (const warn of structWarnings) {
      w(`  ${ICON_FLAG} ${warn}`);
    }
  }

  // ── Layer 1 ──
  w('');
  w(`${C.bold}\u2500\u2500 Layer 1: Cross-Validation Rules \u2500\u2500${C.reset}`);
  const l1Flags = layer1.filter(r => r.status === 'flag');
  const l1Skips = layer1.filter(r => r.status === 'skip');
  const l1Checked = layer1.length - l1Skips.length;

  for (const r of layer1) {
    if (r.status === 'pass') {
      w(`${ICON_PASS} ${C.bold}${r.id}${C.reset} ${r.name} \u2014 ${C.green}PASS${C.reset}`);
    } else if (r.status === 'flag') {
      w(`${ICON_FLAG} ${C.bold}${r.id}${C.reset} ${r.name} \u2014 ${C.yellow}FLAG${C.reset}`);
      w(`  ${C.dim}${r.message}${C.reset}`);
    } else {
      w(`${ICON_SKIP} ${C.dim}${r.id} ${r.name} \u2014 SKIP (${r.detail})${C.reset}`);
    }
  }
  w(`  ${C.dim}${l1Checked}/${layer1.length} rules checked, ${l1Flags.length} flag(s)${C.reset}`);

  // ── Layer 2 ──
  w('');
  w(`${C.bold}\u2500\u2500 Layer 2: Risk Signatures \u2500\u2500${C.reset}`);
  const sigMatches = layer2.filter(r => r.isMatch);

  for (const r of layer2) {
    const dimStr = Object.entries(r.dimScores).map(([k, v]) => `${k}=${v}`).join(', ');
    if (r.isMatch) {
      const sevColor = r.severity === 'critical' ? C.red : C.yellow;
      w(`${ICON_MATCH} ${C.bold}${r.id}${C.reset} ${r.label} \u2014 ${sevColor}MATCH ${r.pct}%${C.reset} (${dimStr})`);
    } else {
      w(`${ICON_NOMATCH} ${C.bold}${r.id}${C.reset} ${r.label} \u2014 ${C.dim}NO MATCH ${r.pct}%${C.reset}`);
    }
  }
  w(`  ${C.dim}${sigMatches.length} signature(s) detected${C.reset}`);

  // ── Weighted Composite ──
  if (data.dimensions && typeof data.dimensions === 'object') {
    const wc = computeWeightedComposite(data);
    const simpleAvg = DIMENSION_KEYS.map(dk => dimScore(data, dk)).filter(v => v != null);
    const simpleAvgVal = simpleAvg.length > 0 ? simpleAvg.reduce((a, b) => a + b, 0) / simpleAvg.length : 0;
    w('');
    w(`${C.bold}\u2500\u2500 Weighted Composite \u2500\u2500${C.reset}`);
    const baseWeightStr = DIMENSION_KEYS.map(dk => `${dk}=${Math.round(DIMENSION_WEIGHTS[dk] * 100)}%`).join(', ');
    w(`  Base weights: ${baseWeightStr}`);
    w(`  Base composite: ${wc.baseComposite.toFixed(2)} (vs simple avg: ${simpleAvgVal.toFixed(1)})`);
    if (wc.amplifications.length > 0) {
      const ampStrs = wc.amplifications.map(a =>
        `${a.dim} (${Math.round(a.base * 100)}% \u2192 ${(a.amplified / Object.values(wc.weights).reduce((s, v) => s + v, 0) * 100).toFixed(1)}%, score ${data.dimensions[a.dim]?.scoreFinal?.toFixed(1) ?? '?'} exceeds base by ${(data.dimensions[a.dim]?.scoreFinal - wc.baseComposite).toFixed(2)})`
      );
      w(`  Amplifications: ${ampStrs.join('; ')}`);
    } else {
      w(`  Amplifications: ${C.dim}none (no dimension exceeds base by > 1.5)${C.reset}`);
    }
    w(`  Amplified composite: ${wc.amplifiedComposite.toFixed(2)}`);
    w(`  Delta vs original: ${(wc.amplifiedComposite - simpleAvgVal) >= 0 ? '+' : ''}${(wc.amplifiedComposite - simpleAvgVal).toFixed(2)}`);
  }

  // ── Layer 3 ──
  w('');
  w(`${C.bold}\u2500\u2500 Layer 3: AI Coherence \u2500\u2500${C.reset}`);
  if (layer3.skipped) {
    w(`  ${C.dim}Skipped: ${layer3.reason}${C.reset}`);
  } else if (layer3.error) {
    w(`  ${C.red}Error: ${layer3.error}${C.reset}`);
  } else {
    const confColor = layer3.confidence >= 7 ? C.green : layer3.confidence >= 4 ? C.yellow : C.red;
    const coherentStr = layer3.coherent ? `${C.green}(coherent)${C.reset}` : `${C.red}(incoherent)${C.reset}`;
    w(`  ${C.bold}Confidence:${C.reset} ${confColor}${layer3.confidence}/10${C.reset} ${coherentStr}`);
    if (layer3.notes) {
      w(`  ${C.bold}Notes:${C.reset} "${layer3.notes}"`);
    }
    if (layer3.anomalies?.length > 0) {
      for (const a of layer3.anomalies) {
        w(`  ${ICON_FLAG} ${a}`);
      }
    }
  }

  // ── Summary ──
  w('');
  w(`${C.bold}\u2500\u2500 Summary \u2500\u2500${C.reset}`);
  const confStr = layer3.skipped ? 'N/A' : (layer3.error ? 'ERR' : `${layer3.confidence}/10`);
  const wcSummary = (data.dimensions && typeof data.dimensions === 'object')
    ? computeWeightedComposite(data)
    : null;
  const wcStr = wcSummary ? `Weighted: ${wcSummary.amplifiedComposite.toFixed(2)}` : 'Weighted: N/A';
  const parts = [`Flags: ${l1Flags.length}`, `Signatures: ${sigMatches.length}`, wcStr, `AI Confidence: ${confStr}`];
  if (schemaErrors.length > 0) parts.push(`${C.red}Schema errors: ${schemaErrors.length}${C.reset}`);
  if (structWarnings.length > 0) parts.push(`${C.yellow}Structural warnings: ${structWarnings.length}${C.reset}`);
  w(parts.join(' | '));
  w('');

  return lines.join('\n');
}

function formatJson(filePath, data, schemaErrors, structWarnings, layer1, layer2, layer3) {
  const wc = (data.dimensions && typeof data.dimensions === 'object')
    ? computeWeightedComposite(data)
    : null;

  return {
    file: filePath,
    zone: data.zone ?? null,
    composite: data.composite ?? null,
    classification: data.classification ?? null,
    schemaErrors,
    structuralWarnings: structWarnings,
    layer1: layer1.map(r => ({
      id: r.id,
      name: r.name,
      status: r.status,
      detail: r.detail,
      ...(r.type ? { type: r.type, dimension: r.dimension, indicator: r.indicator, message: r.message } : {}),
    })),
    layer2: layer2.map(r => ({
      id: r.id,
      label: r.label,
      pct: r.pct,
      isMatch: r.isMatch,
      severity: r.severity,
      dimScores: r.dimScores,
    })),
    weightedComposite: wc ? {
      baseComposite: wc.baseComposite,
      amplifiedComposite: wc.amplifiedComposite,
      weights: wc.weights,
      amplifications: wc.amplifications,
    } : null,
    layer3: layer3.skipped
      ? { skipped: true, reason: layer3.reason }
      : layer3.error
        ? { error: layer3.error }
        : { confidence: layer3.confidence, coherent: layer3.coherent, notes: layer3.notes, anomalies: layer3.anomalies },
    summary: {
      flags: layer1.filter(r => r.status === 'flag').length,
      signatures: layer2.filter(r => r.isMatch).length,
      weightedComposite: wc?.amplifiedComposite ?? null,
      aiConfidence: layer3.confidence ?? null,
      schemaErrors: schemaErrors.length,
      structuralWarnings: structWarnings.length,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation Pipeline
// ═══════════════════════════════════════════════════════════════════════════

async function validateFile(filePath, options = {}) {
  const { noAi = false, jsonOutput = false } = options;

  // Read file
  let raw;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch (err) {
    const msg = `Could not read file: ${filePath} (${err.code || err.message})`;
    if (jsonOutput) return { result: { file: filePath, error: msg }, hasCritical: true };
    return { output: `\n${C.red}ERROR:${C.reset} ${msg}\n`, hasCritical: true };
  }

  // Parse JSON
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    const msg = `Malformed JSON in ${basename(filePath)}: ${err.message}`;
    if (jsonOutput) return { result: { file: filePath, error: msg }, hasCritical: true };
    return { output: `\n${C.red}ERROR:${C.reset} ${msg}\n`, hasCritical: true };
  }

  // Schema validation
  const schemaErrors = validateSchema(data);
  const hasDimensions = data.dimensions && typeof data.dimensions === 'object';

  // Structural checks
  const structWarnings = hasDimensions ? runStructuralChecks(data) : [];

  // Layer 1: Deterministic rules
  const layer1 = hasDimensions ? runLayer1(data) : [];

  // Layer 2: Risk signatures
  const layer2 = hasDimensions ? runLayer2(data) : [];

  // Layer 3: AI coherence (optional)
  let layer3;
  if (noAi || !hasDimensions) {
    layer3 = { skipped: true, reason: noAi ? '--no-ai flag set' : 'Dimensions missing' };
  } else {
    layer3 = await runLayer3(data, layer1, layer2);
  }

  // Determine critical status: any flags trigger exit code 1
  const hasCritical = schemaErrors.length > 0 ||
    layer1.some(r => r.status === 'flag');

  if (jsonOutput) {
    return {
      result: formatJson(filePath, data, schemaErrors, structWarnings, layer1, layer2, layer3),
      hasCritical,
    };
  }

  return {
    output: formatConsole(filePath, data, schemaErrors, structWarnings, layer1, layer2, layer3),
    hasCritical,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI Entry Point
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter(a => a.startsWith('--')));
  const positional = args.filter(a => !a.startsWith('--'));

  const isAll      = flags.has('--all');
  const noAi       = flags.has('--no-ai');
  const jsonOutput = flags.has('--json');
  const help       = flags.has('--help') || flags.has('-h');

  if (help || (!isAll && positional.length === 0)) {
    console.log(`
${C.bold}SEMPLICE v2.0 Evaluation Validator${C.reset}
Inflexion Intelligence — 3-Layer validation architecture

${C.bold}Usage:${C.reset}
  node scripts/semplice-validator.mjs <path/to/evaluation.json>    Validate single file
  node scripts/semplice-validator.mjs --all                        Validate all in evaluations-test-v2/
  node scripts/semplice-validator.mjs --all --no-ai                Skip Layer 3 (AI coherence)
  node scripts/semplice-validator.mjs --all --json                 Output as JSON

${C.bold}Layers:${C.reset}
  1. Deterministic cross-validation rules (8 rules: R1-R8)
  2. Multi-dimensional risk signatures (8 patterns: SIG1-SIG8)
  3. AI coherence check (Claude Haiku, requires ANTHROPIC_API_KEY)

${C.bold}Rules:${C.reset}
  R1  Debt False Positive      E3 >= 5, E5 <= 2
  R2  Military Paradox         M1 >= 4, M2 <= 2
  R3  Cyber/Infra Mismatch     C2 <= 2, C5 >= 5
  R4  Press Freedom Paradox    I1 >= 4, I9 <= 1, P1 <= 2
  R5  Economic Decoupling      E1 <= 2, E9 >= 5
  R6  Democratic Autocracy     P2 >= 4, P1 <= 2, L1 <= 2
  R7  Environmental SIDS       Ee9 >= 5, Ee2 >= 4, Ee6 <= 2
  R8  Quanti/Quali Divergence  |quanti - quali| > 2.0 for any dim

${C.bold}Signatures:${C.reset}
  SIG1  Invasion/War           M >= 5.5, C >= 5.0, I >= 5.0, S >= 4.0
  SIG2  Coup d'Etat            M >= 4.0, P >= 5.0, M7 >= 4 or M6 >= 3
  SIG3  Revolution/Uprising    S >= 5.0, P >= 4.5, I >= 4.0
  SIG4  Financial Crisis       E >= 5.0, L >= 4.0, E3 >= 5, E5 >= 5
  SIG5  Climate Catastrophe    Ee >= 4.5, S >= 3.5, E >= 3.5
  SIG6  Cyber War              C >= 5.0, M >= 4.0, I >= 4.5
  SIG7  State Capture          P >= 4.5, L >= 4.5, I >= 4.0, P1 >= 5
  SIG8  Fragile State          ALL dimensions >= 3.5

${C.bold}Exit codes:${C.reset}
  0  No flags found
  1  Flags found or schema errors
`);
    process.exit(0);
  }

  // Resolve file list
  let files = [];
  if (isAll) {
    if (!existsSync(EVALUATIONS_DIR)) {
      console.error(`${C.red}ERROR:${C.reset} Directory not found: ${EVALUATIONS_DIR}`);
      process.exit(1);
    }
    const entries = readdirSync(EVALUATIONS_DIR)
      .filter(f => f.endsWith('.json') && f !== 'index.json' && !f.endsWith('.report.json'))
      .sort();
    if (entries.length === 0) {
      console.error(`${C.yellow}WARNING:${C.reset} No .json files found in ${EVALUATIONS_DIR}`);
      process.exit(0);
    }
    files = entries.map(f => join(EVALUATIONS_DIR, f));
  } else {
    files = positional.map(f => resolve(f));
  }

  // Validate each file
  let anyCritical = false;
  const jsonResults = [];

  for (const file of files) {
    const { output, result, hasCritical } = await validateFile(file, { noAi, jsonOutput });
    if (hasCritical) anyCritical = true;

    if (jsonOutput) {
      jsonResults.push(result);
    } else {
      process.stdout.write(output);
    }
  }

  // JSON output
  if (jsonOutput) {
    const payload = files.length === 1
      ? jsonResults[0]
      : { evaluations: jsonResults, summary: { total: files.length, withFlags: jsonResults.filter(r => r.summary?.flags > 0).length } };
    console.log(JSON.stringify(payload, null, 2));
  }

  process.exit(anyCritical ? 1 : 0);
}

main().catch(err => {
  console.error(`${C.red}Fatal error:${C.reset} ${err.message}`);
  process.exit(1);
});
