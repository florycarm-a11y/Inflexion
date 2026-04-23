#!/usr/bin/env node
// Valide qu'un briefing JSON produit par la Routine Master respecte
// les contraintes éditoriales : sourcing, disclaimer AMF, pas de placeholder.

import { readFileSync, existsSync } from 'node:fs';

const PLACEHOLDER_RE = /\bTBD\b|\b\[NAME\]\b|\bundefined\b/;
const AMF_DISCLAIMER_RE = /conseil\s+en\s+investissement/i;
const MIN_CONTENT_CHARS = 500;
const MIN_SOURCES = 3;

export function validateBriefing(filePath) {
  const errors = [];

  if (!existsSync(filePath)) {
    return { ok: false, errors: [`Fichier introuvable : ${filePath}`] };
  }

  const raw = readFileSync(filePath, 'utf8');

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return { ok: false, errors: [`JSON invalide : ${e.message}`] };
  }

  // Longueur contenu (taille totale du JSON stringifié)
  if (raw.length < MIN_CONTENT_CHARS) {
    errors.push(`contenu trop court (${raw.length} < ${MIN_CONTENT_CHARS} chars)`);
  }

  // Sources
  const sources = Array.isArray(data.sources) ? data.sources : [];
  if (sources.length < MIN_SOURCES) {
    errors.push(`sources insuffisantes (${sources.length} < ${MIN_SOURCES})`);
  }

  // Disclaimer AMF
  const disclaimer = typeof data.disclaimer === 'string' ? data.disclaimer : '';
  if (!AMF_DISCLAIMER_RE.test(disclaimer)) {
    errors.push(`disclaimer AMF manquant ou non conforme`);
  }

  // Placeholders
  if (PLACEHOLDER_RE.test(raw)) {
    errors.push(`placeholder détecté (TBD/[NAME]/undefined)`);
  }

  return { ok: errors.length === 0, errors };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2] || 'data/daily-briefing.json';
  const result = validateBriefing(target);
  if (result.ok) {
    console.log(`✅ ${target} — validation OK`);
    process.exit(0);
  } else {
    console.error(`❌ ${target} — échecs :`);
    for (const err of result.errors) console.error(`  - ${err}`);
    process.exit(1);
  }
}
