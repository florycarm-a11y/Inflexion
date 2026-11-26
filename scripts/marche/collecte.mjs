#!/usr/bin/env node
// Collecte de la couche « lecture de marché » — les trois modules en une passe.
//
//   node scripts/marche/collecte.mjs            collecte et écrit data/marche/
//   node scripts/marche/collecte.mjs --dry-run  collecte et affiche, sans rien écrire
//
// FLUX À SENS UNIQUE. Ce script LIT data/tracker/ (la liste des sociétés et la date de leur
// dernière publication) et n'écrit QUE dans data/marche/ : instantane.json (le dernier relevé, lu par la page) et
// historique/AAAA-MM-JJ.json (un instantané daté par jour de collecte, jamais réécrit par un
// autre jour). Il ne touche à aucun fichier du tracker — test/marche-etancheite.test.mjs le vérifie.
//
// Aucune clé d'API. Seule variable lue : SEC_USER_AGENT (contact déclaré à la SEC), facultative.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { MODULES, MOTIF_SANS_COLLECTEUR } from './sources.mjs';

const RACINE = new URL('../../', import.meta.url);
const { MARCHE_CONFIG } = createRequire(import.meta.url)('../../lecture-marche-config.js');

const lireJSON = (chemin, racine = RACINE) => JSON.parse(readFileSync(new URL(chemin, racine), 'utf8'));
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Requête JSON avec délai maximal et nouveaux essais. Une erreur porte son statut HTTP (`statut`). */
export async function requeteJSON(url, options = {}, { essais = 3, delai = 20000, attente = 1500 } = {}) {
  let derniere;
  for (let i = 0; i < essais; i++) {
    try {
      const reponse = await fetch(url, { ...options, signal: AbortSignal.timeout(delai) });
      if (!reponse.ok) {
        const erreur = new Error('HTTP ' + reponse.status);
        erreur.statut = reponse.status;
        // Un 4xx (hors 429) ne changera pas au deuxième essai.
        if (reponse.status < 500 && reponse.status !== 429) throw Object.assign(erreur, { definitive: true });
        throw erreur;
      }
      return await reponse.json();
    } catch (erreur) {
      derniere = erreur;
      if (erreur.definitive) break;
      if (i < essais - 1) await pause(attente * (i + 1));
    }
  }
  throw derniere;
}

const donneeValide = (d) => d && d.valeur !== null && d.valeur !== undefined
  && d.source && typeof d.source.nom === 'string' && typeof d.source.url === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date || '');

/**
 * Collecte une société : chaque collecteur de chaque module, isolément.
 * Un collecteur qui échoue met SES champs à n/d avec le motif ; rien d'autre n'est affecté.
 */
export async function collecterSociete(societe, ctx) {
  // La SEC sert deux modules : une seule série d'appels par société.
  let comptes;
  const contexte = { ...ctx, sec: (s) => (comptes ??= ctx.modulesSec(s)) };
  const sortie = {};
  for (const module of MODULES) {
    const bloc = Object.fromEntries(module.champs.map((c) => [c, { valeur: null, motif: MOTIF_SANS_COLLECTEUR }]));
    for (const collecteur of module.collecteurs) {
      let recu;
      try { recu = await collecteur.lancer(societe, contexte); }
      catch (erreur) { recu = Object.fromEntries(collecteur.champs.map((c) => [c, { valeur: null, motif: `${collecteur.nom} injoignable : ${erreur.message}` }])); }
      for (const champ of collecteur.champs) if (recu[champ]) bloc[champ] = recu[champ];
    }
    sortie[module.cle] = bloc;
  }
  return sortie;
}

/**
 * Saisie manuelle, sourcée et datée. Elle comble un champ resté n/d, ou remplace une donnée collectée
 * PLUS ANCIENNE qu'elle (cas d'une source qui ne rend plus qu'un vieux chiffre). Jamais une plus récente.
 */
export function appliquerSaisieManuelle(blocs, saisie) {
  for (const [module, champs] of Object.entries(saisie || {})) {
    if (!blocs[module]) continue;
    for (const [champ, d] of Object.entries(champs)) {
      if (!(champ in blocs[module]) || !donneeValide(d)) continue;
      const collectee = blocs[module][champ];
      if (collectee.valeur === null || collectee.date < d.date) blocs[module][champ] = { ...d, saisie: 'manuelle' };
    }
  }
  return blocs;
}

/** Les instantanés déjà conservés (les 150 derniers suffisent : une publication se compare à sa veille). */
function lireHistorique(racine) {
  const dossier = new URL('data/marche/historique/', racine);
  const index = new URL('index.json', dossier);
  if (!existsSync(index)) return [];
  return JSON.parse(readFileSync(index, 'utf8')).instantanes.sort().slice(-150)
    .map((j) => new URL(j + '.json', dossier)).filter(existsSync).map((f) => JSON.parse(readFileSync(f, 'utf8')));
}

/** Dernière publication d'une société, LUE dans sa fiche du tracker (jamais écrite). */
function dernierePublication(id, racine) {
  try {
    const dates = lireJSON('data/tracker/' + id + '.json', racine).publications.map((p) => p.date).filter(Boolean).sort();
    return dates.length ? { date: dates[dates.length - 1] } : null;
  } catch { return null; }
}

export async function collecter({ aujourdhui, requete = requeteJSON, racine = RACINE, journal = console.log, rythme = 400 } = {}) {
  const catalogue = lireJSON('data/tracker/entreprises.json', racine); // LECTURE SEULE
  const identites = lireJSON('data/marche/societes.json', racine).societes;
  const saisie = lireJSON('data/marche/saisie-manuelle.json', racine).societes || {};
  const { collecterSec } = await import('./sources.mjs');
  // « data.sec.gov accepte un client générique » (carnet de bord) : jamais de contact écrit en dur.
  const agentSec = process.env.SEC_USER_AGENT || 'collecte-donnees/1.0';
  const ctx = {
    requete: async (...args) => { await pause(rythme); return requete(...args); },
    aujourdhui, config: MARCHE_CONFIG, agentSec, historique: lireHistorique(racine),
  };
  ctx.modulesSec = (s) => collecterSec(s.cik, ctx);

  const societes = {};
  for (const e of catalogue.entreprises) {
    const identite = identites[e.id];
    if (!identite || !identite.ticker) {
      journal(`· ${e.id} : pas de ticker dans data/marche/societes.json — tout en n/d`);
      const motif = 'société absente de data/marche/societes.json';
      societes[e.id] = { ticker: null, ...Object.fromEntries(MODULES.map((m) => [m.cle, Object.fromEntries(m.champs.map((c) => [c, { valeur: null, motif }]))])) };
    } else {
      const blocs = await collecterSociete({ ...identite, id: e.id, publication: dernierePublication(e.id, racine) }, ctx);
      societes[e.id] = { ticker: identite.ticker, ...blocs };
    }
    appliquerSaisieManuelle(societes[e.id], saisie[e.id]);
    const bilan = MODULES.map((m) => {
      const champs = Object.values(societes[e.id][m.cle]);
      return `${m.cle} ${champs.filter((d) => d.valeur !== null).length}/${champs.length}`;
    }).join(' · ');
    journal(`· ${e.id} (${societes[e.id].ticker || '—'}) : ${bilan}`);
  }
  return { schema: 1, collecte: aujourdhui, config_version: MARCHE_CONFIG.version, societes };
}

export function ecrire(instantane, racine = RACINE) {
  const dossier = new URL('data/marche/historique/', racine);
  mkdirSync(dossier, { recursive: true });
  const texte = JSON.stringify(instantane, null, 2) + '\n';
  writeFileSync(new URL('data/marche/instantane.json', racine), texte);
  writeFileSync(new URL(instantane.collecte + '.json', dossier), texte);
  // L'index permet à une page statique de connaître les instantanés sans lister le dossier.
  const cheminIndex = new URL('index.json', dossier);
  const jours = existsSync(cheminIndex) ? JSON.parse(readFileSync(cheminIndex, 'utf8')).instantanes : [];
  if (!jours.includes(instantane.collecte)) jours.push(instantane.collecte);
  writeFileSync(cheminIndex, JSON.stringify({ instantanes: jours.sort() }, null, 2) + '\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const aSec = process.argv.includes('--dry-run');
  const aujourdhui = new Date().toISOString().slice(0, 10);
  console.log(`Lecture de marché — collecte du ${aujourdhui}${aSec ? ' (à blanc)' : ''}`);
  const instantane = await collecter({ aujourdhui });
  if (aSec) console.log(JSON.stringify(instantane, null, 2));
  else { ecrire(instantane); console.log('Écrit : data/marche/instantane.json et data/marche/historique/' + aujourdhui + '.json'); }
}
