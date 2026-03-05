#!/usr/bin/env node
/**
 * validate-article.mjs — Validation qualité de l'article du jour
 *
 * Vérifie la structure, la longueur, la langue et la qualité de l'article
 * avant publication automatique. Exit code 1 = article rejeté (pas de commit).
 *
 * Usage : node scripts/validate-article.mjs [--file path/to/article.json]
 */

import { readFileSync } from 'fs';

const ARTICLE_PATH = process.argv.includes('--file')
  ? process.argv[process.argv.indexOf('--file') + 1]
  : 'data/article-du-jour.json';

// --- Configuration des seuils ---

const MIN_WORDS = 400;
const MAX_WORDS = 1500;
const MIN_TITRE_LENGTH = 20;
const MAX_TITRE_LENGTH = 150;
const MIN_SOURCES = 2;
const MIN_TAGS = 2;
const MIN_POINTS_CLES = 2;
const REQUIRED_SECTIONS = ['Contexte', 'Enjeux', 'Risques', 'Perspectives'];
const VALID_SENTIMENTS = ['haussier', 'baissier', 'neutre', 'mixte'];

// Phrases typiques de contenu non traduit ou générique
const ENGLISH_PATTERNS = [
  /\bthe market\b/i,
  /\binvestors should\b/i,
  /\baccording to\b/i,
  /\bhowever,?\s/i,
  /\bmoreover,?\s/i,
  /\bfurthermore,?\s/i,
  /\bin conclusion\b/i,
  /\bas a result\b/i,
];

// Patterns de contenu dégradé (hallucination, placeholder, erreur)
const DEGRADED_PATTERNS = [
  /\[INSERT/i,
  /\[TODO/i,
  /\[PLACEHOLDER/i,
  /lorem ipsum/i,
  /undefined/,
  /NaN/,
  /null/,
  /Error:/,
  /je suis un modèle/i,
  /je ne peux pas/i,
  /en tant qu'(IA|intelligence artificielle)/i,
];

// --- Fonctions de validation ---

function countWords(text) {
  return text.replace(/[#*_`>\-|]/g, ' ').split(/\s+/).filter(w => w.length > 1).length;
}

function validateStructure(article) {
  const errors = [];

  const requiredFields = ['date', 'titre', 'contenu', 'tags', 'points_cles', 'sources', 'sentiment_global'];
  for (const field of requiredFields) {
    if (article[field] === undefined || article[field] === null) {
      errors.push(`Champ requis manquant : "${field}"`);
    }
  }

  if (typeof article.titre !== 'string') {
    errors.push('Le titre doit être une chaîne de caractères');
  }
  if (typeof article.contenu !== 'string') {
    errors.push('Le contenu doit être une chaîne de caractères');
  }
  if (!Array.isArray(article.tags)) {
    errors.push('Les tags doivent être un tableau');
  }
  if (!Array.isArray(article.points_cles)) {
    errors.push('Les points clés doivent être un tableau');
  }
  if (!Array.isArray(article.sources)) {
    errors.push('Les sources doivent être un tableau');
  }

  return errors;
}

function validateContent(article) {
  const errors = [];
  const warnings = [];

  // Titre
  if (article.titre) {
    if (article.titre.length < MIN_TITRE_LENGTH) {
      errors.push(`Titre trop court (${article.titre.length} car., min ${MIN_TITRE_LENGTH})`);
    }
    if (article.titre.length > MAX_TITRE_LENGTH) {
      warnings.push(`Titre long (${article.titre.length} car., recommandé < ${MAX_TITRE_LENGTH})`);
    }
  }

  // Longueur contenu
  if (article.contenu) {
    const wordCount = countWords(article.contenu);
    if (wordCount < MIN_WORDS) {
      errors.push(`Contenu trop court (${wordCount} mots, min ${MIN_WORDS})`);
    }
    if (wordCount > MAX_WORDS) {
      warnings.push(`Contenu long (${wordCount} mots, recommandé < ${MAX_WORDS})`);
    }

    // Sections obligatoires
    for (const section of REQUIRED_SECTIONS) {
      const regex = new RegExp(`##\\s*${section}`, 'i');
      if (!regex.test(article.contenu)) {
        errors.push(`Section obligatoire manquante : "## ${section}"`);
      }
    }

    // Contenu anglais (signe de non-traduction)
    let englishHits = 0;
    for (const pattern of ENGLISH_PATTERNS) {
      if (pattern.test(article.contenu)) {
        englishHits++;
      }
    }
    if (englishHits >= 3) {
      errors.push(`Contenu possiblement non traduit (${englishHits} patterns anglais détectés)`);
    } else if (englishHits >= 1) {
      warnings.push(`${englishHits} expression(s) anglaise(s) détectée(s) dans le contenu`);
    }

    // Contenu dégradé
    for (const pattern of DEGRADED_PATTERNS) {
      if (pattern.test(article.contenu)) {
        errors.push(`Contenu dégradé détecté : pattern "${pattern.source}"`);
      }
    }
  }

  // Sentiment
  if (article.sentiment_global && !VALID_SENTIMENTS.includes(article.sentiment_global)) {
    errors.push(`Sentiment invalide : "${article.sentiment_global}" (attendu : ${VALID_SENTIMENTS.join(', ')})`);
  }

  // Sources
  if (Array.isArray(article.sources)) {
    if (article.sources.length < MIN_SOURCES) {
      errors.push(`Pas assez de sources (${article.sources.length}, min ${MIN_SOURCES})`);
    }
    for (const src of article.sources) {
      if (!src.titre || !src.url) {
        warnings.push(`Source incomplète : ${JSON.stringify(src)}`);
      }
    }
  }

  // Tags
  if (Array.isArray(article.tags) && article.tags.length < MIN_TAGS) {
    errors.push(`Pas assez de tags (${article.tags.length}, min ${MIN_TAGS})`);
  }

  // Points clés
  if (Array.isArray(article.points_cles) && article.points_cles.length < MIN_POINTS_CLES) {
    errors.push(`Pas assez de points clés (${article.points_cles.length}, min ${MIN_POINTS_CLES})`);
  }

  // Date valide
  if (article.date && !/^\d{4}-\d{2}-\d{2}$/.test(article.date)) {
    errors.push(`Format de date invalide : "${article.date}" (attendu : YYYY-MM-DD)`);
  }

  return { errors, warnings };
}

// --- Exécution ---

function main() {
  console.log(`\n🔍 Validation de l'article : ${ARTICLE_PATH}\n`);

  // 1. Lecture du fichier
  let raw;
  try {
    raw = readFileSync(ARTICLE_PATH, 'utf-8');
  } catch (err) {
    console.error(`❌ Impossible de lire le fichier : ${err.message}`);
    process.exit(1);
  }

  // 2. Parse JSON
  let article;
  try {
    article = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ JSON invalide : ${err.message}`);
    process.exit(1);
  }

  // 3. Validation structure
  const structErrors = validateStructure(article);
  if (structErrors.length > 0) {
    console.error('❌ Erreurs de structure :');
    structErrors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }
  console.log('✅ Structure JSON valide');

  // 4. Validation contenu
  const { errors, warnings } = validateContent(article);

  if (warnings.length > 0) {
    console.log('\n⚠️  Avertissements :');
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  if (errors.length > 0) {
    console.error('\n❌ Erreurs bloquantes :');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error(`\n🚫 Article rejeté (${errors.length} erreur(s)). Pas de publication.`);
    process.exit(1);
  }

  // 5. Résumé
  const wordCount = countWords(article.contenu);
  console.log(`\n✅ Article validé avec succès`);
  console.log(`   📝 Titre : ${article.titre.substring(0, 80)}...`);
  console.log(`   📊 ${wordCount} mots | ${article.tags.length} tags | ${article.sources.length} sources | ${article.points_cles.length} points clés`);
  console.log(`   🎯 Sentiment : ${article.sentiment_global}`);
  console.log(`   📅 Date : ${article.date}`);
  if (warnings.length > 0) {
    console.log(`   ⚠️  ${warnings.length} avertissement(s) (non bloquants)`);
  }
  console.log('');
}

main();
