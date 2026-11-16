// Garde-fous de la propagation du prompt 4 aux pages React (docs/superpowers/specs/2026-11-15-animations-pages-design.md, §3).
// Dérivé de test/home-motion.test.mjs, paramétré par page. Aucune dépendance : lit les fichiers du dépôt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const RACINE = new URL('../', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, RACINE), 'utf8');
// Les commentaires (/* */ en CSS, // en JS) sont de la prose, pas du code : retirés avant toute analyse.
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
// Un littéral de temps CSS (.22s, 0.6s, 300ms), pas une longueur (16px, 0.18em) ni un nombre (1.1).
const TEMPS = /(?<![\w.-])\d*\.?\d+m?s\b/g;

const DOSSIERS = ['analysis-template.html', 'analyse-ukraine-mer-noire-guerre-attrition.html', 'analyse-turquie-erdogan-equilibriste.html', 'analyse-sahel-mali-niger-burkina-crise.html', 'analyse-mer-chine-taiwan-indopacifique.html'];
const ARTICLES = ['analyse-arctique-groenland-grand-jeu-polaire.html', 'analyse-cloud-ia-pme-europeennes.html', 'analyse-corridor-defense-france-inde.html', 'analyse-cuba-crise-perspectives.html', 'analyse-fta-ue-inde-traite-fiscal.html', 'analyse-madagascar-fragilite-ressources.html', 'analyse-petrole-trump-iran-ormuz.html'];
const AUTONOMES = [...ARTICLES, 'analyses.html', 'artifact-inflexion.html', 'briefing.html']; // embarquent leur propre copie de Reveal
const PAGES = [...DOSSIERS, ...AUTONOMES];
const HERO_DYNAMIQUE = new Set([...DOSSIERS, ...ARTICLES, 'briefing.html']);

function finDeBloc(css, debut) {
  let profondeur = 0;
  for (let j = css.indexOf('{', debut); j < css.length; j++) {
    if (css[j] === '{') profondeur++;
    else if (css[j] === '}' && --profondeur === 0) return j;
  }
  throw new Error('bloc non fermé');
}
// Contenu du premier bloc `@media(<requete>){…}`, ou null. Préfixe : `hover:hover` attrape aussi `@media(hover:hover) and (…)`.
function blocMedia(css, requete) {
  const debut = css.indexOf(`@media(${requete})`);
  return debut === -1 ? null : css.slice(css.indexOf('{', debut) + 1, finDeBloc(css, debut));
}
function sansBlocs(css, requete) {
  let reste = '', i = 0;
  for (;;) {
    const debut = css.indexOf(`@media(${requete})`, i);
    if (debut === -1) return reste + css.slice(i);
    reste += css.slice(i, debut);
    i = finDeBloc(css, debut) + 1;
  }
}
// Une déclaration `animation:` en boucle (`infinite`) peut garder sa durée : hors de l'échelle à trois jetons (spec §3, boucles décoratives).
// Une déclaration de jeton (`--motion-*: …`) n'est pas une durée écrite en dur : c'est le jeton lui-même (briefing.html, sans régime v2, les pose localement).
const sansBoucles = (css) => css.replace(/animation:[^;{}]*\binfinite\b[^;{}]*/g, 'animation:BOUCLE').replace(/--motion-(?:fast|base|slow):[^;}]*/g, '--motion-JETON');

function partiesDe(page) {
  const html = lire(page);
  const m1 = html.match(/<style>([\s\S]*?)<\/style>/);
  const m2 = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(m1, `${page} : <style> introuvable`);
  assert.ok(m2, `${page} : <script type="module"> introuvable`);
  return { html, style: sansCommentaires(m1[1]), script: sansCommentaires(m2[1]) };
}

// Le bloc Reveal (observateur partagé + composant) de la home, source unique : chaque copie doit lui être identique.
function blocReveal(code) {
  const debut = code.indexOf('const revealAttente=new Map()');
  const def = code.indexOf('function Reveal(', debut);
  const fin = code.indexOf('\n}\n', def);
  assert.ok(debut !== -1 && def !== -1 && fin !== -1, 'bloc Reveal introuvable');
  return code.slice(debut, fin + 2).replace(/^export /gm, '');
}
const REVEAL_HOME = blocReveal(sansCommentaires(lire('index.html').match(/<script type="module">([\s\S]*?)<\/script>/)[1]));

const SHELL = sansCommentaires(lire('assets/article-shell.js'));

test('article-shell.js : Reveal exporté, identique à la home ; Section et appareil critique le posent ; en-tête en .site-header', () => {
  assert.ok(/^export function Reveal\(/m.test(SHELL), 'Reveal n\'est pas exporté par la coquille');
  assert.equal(blocReveal(SHELL), REVEAL_HOME, 'la copie de Reveal dans article-shell.js diverge de index.html');
  assert.ok(SHELL.includes('useRef'), 'useRef manque à l\'import React de la coquille');
  assert.ok(!/duration-\d/.test(SHELL), 'classe Tailwind de durée dans la coquille');
  assert.ok(SHELL.includes('site-header fixed top-[3px]'), 'l\'en-tête de la coquille ne porte pas .site-header');
  // Section : h2 à 0, chaque enfant hôte à 0,15 ; les enfants non hôtes (null, texte) passent tels quels.
  assert.ok(/children\.map\(\(enfant, i\) => React\.isValidElement\(enfant\) && typeof enfant\.type === 'string' \? h\(Reveal, \{ key: i, delay: 0\.15 \}, enfant\) : enfant\)/.test(SHELL), 'Section ne pose pas Reveal (0,15) sur ses enfants hôtes');
  const usages = [...SHELL.matchAll(/h\(\s*Reveal\s*,\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(usages.length >= 14, `seulement ${usages.length} Reveal dans la coquille : Section (2) et l'appareil critique (≥ 12)`);
  for (const props of usages) {
    const delay = props.match(/\bdelay:\s*([\d.]+)/);
    assert.ok(delay, `Reveal sans delay explicite : {${props}}`);
    assert.ok(['0', '0.15', '0.3'].includes(delay[1]), `delay ${delay[1]} hors du schéma 0 / 0.15 / 0.3 : {${props}}`);
    const stagger = props.match(/\bstagger:\s*([\d.]+)/);
    if (stagger) assert.equal(stagger[1], '0.06', `stagger ${stagger[1]} : les cartes ajoutent 0,06 s`);
  }
  assert.equal(usages.filter((p) => /\bstagger:/.test(p)).length, 2, 'deux grilles portent stagger (scénarios, articles liés)');
});

for (const page of PAGES) {
  const autonome = AUTONOMES.includes(page);

  test(`${page} : aucune durée écrite en dur hors boucle, les trois jetons consommés, aucune durée Tailwind ni inline`, () => {
    const { style, script } = partiesDe(page);
    const litteraux = sansBoucles(style).match(TEMPS) || [];
    assert.deepEqual(litteraux, [], `littéraux de temps dans le <style> : ${litteraux.join(', ')} (utiliser var(--motion-*))`);
    for (const jeton of ['--motion-fast', '--motion-base', '--motion-slow']) {
      assert.ok(style.includes(`var(${jeton})`), `${jeton} n'est consommé nulle part dans le <style>`);
    }
    const durations = (style + script).match(/\bduration-\[?[\w.]+\]?/g) || [];
    assert.deepEqual(durations, [], `classes Tailwind de durée : ${durations.join(', ')}`);
    const inline = script.match(/\b(?:transition|animation)\s*:\s*[`'"][^`'"]*?\d+m?s\b/g) || [];
    assert.deepEqual(inline, [], `durée inline dans le script : ${inline.join(' | ')}`);
    assert.deepEqual(script.match(/\b(?:transition|animation)Duration\s*:/g) || [], [], 'transitionDuration / animationDuration inline');
  });

  test(`${page} : les :hover du <style> sont sous @media(hover:hover), sauf l'ouverture du méga-menu`, () => {
    const { style } = partiesDe(page);
    assert.ok(blocMedia(style, 'hover:hover') !== null, 'aucun bloc @media(hover:hover) dans le <style>');
    const horsBloc = (sansBlocs(style, 'hover:hover').match(/[^{}\n]*:hover[^{]*\{/g) || []).map((s) => s.trim());
    // Exception assumée (spec §2.3) : le méga-menu de ces pages s'ouvre par CSS ; sous hover:hover il serait inaccessible sur tablette.
    assert.deepEqual(horsBloc, ['.mega-trigger:hover .mega-menu,.mega-menu:hover{'], `:hover hors de @media(hover:hover) : ${horsBloc.join(' ; ')}`);
  });

  test(`${page} : un seul mécanisme d'apparition (Reveal), mots morts absents, mouvement réduit complet`, () => {
    const { html, style, script } = partiesDe(page);
    assert.ok(!html.includes('scroll-reveal.js'), 'charge encore scroll-reveal.js');
    for (const mort of ['FadeUp', 'useInView', 'anim-fade-up', 'fade-up', 'anim-d1', 'reveal-section', 'sr-hidden']) {
      assert.ok(!(style + script).includes(mort), `${mort} encore présent`);
    }
    if (autonome) {
      assert.ok(/function Reveal\(/.test(script), 'copie de Reveal absente');
      assert.equal(blocReveal(script), REVEAL_HOME, 'la copie de Reveal diverge de index.html');
      assert.ok(script.includes('site-header fixed top-[3px]'), 'l\'en-tête ne porte pas .site-header');
    } else {
      assert.ok(!/function Reveal\(/.test(script), 'un dossier ne doit pas redéfinir Reveal : il vient d\'article-shell.js');
    }
    assert.ok(style.includes('.reveal{opacity:0;transform:translateY(16px);transition:opacity var(--motion-slow),transform var(--motion-slow)}'), 'règle .reveal absente');
    assert.ok(style.includes('.site-header{transition:all var(--motion-base)}'), 'règle .site-header absente');
    const reduit = blocMedia(style, 'prefers-reduced-motion:reduce');
    assert.ok(reduit, 'bloc @media(prefers-reduced-motion:reduce) introuvable');
    for (const attendu of ['.reveal{opacity:1;transform:none;transition:none}', '.mobile-overlay.open .menu-item{animation:none;opacity:1}']) {
      assert.ok(reduit.includes(attendu), `mouvement réduit : ${attendu} manque`);
    }
    if (HERO_DYNAMIQUE.has(page)) assert.ok(reduit.includes('.hero-dynamic,.hero-dynamic::before{animation-play-state:paused}'), 'hero dynamique non mis en pause');
    const nus = script.match(/(?<![\w:-])animate-pulse\b/g) || [];
    assert.equal(nus.length, 0, `${nus.length} animate-pulse sans motion-safe: (site.css, chargé en dernier, bat le <style>)`);
  });

  if (autonome) {
    test(`${page} : le schéma de délais du prompt 4 (0 / 0,15 / 0,3 ; +0,06 par carte)`, () => {
      const { script } = partiesDe(page);
      const usages = [...script.matchAll(/h\(\s*Reveal\s*,\s*\{([^}]*)\}/g)].map((m) => m[1]);
      assert.ok(usages.length >= 4, `seulement ${usages.length} Reveal : le hero en compte au moins 3`);
      for (const props of usages) {
        const delay = props.match(/\bdelay:\s*([\d.]+)/);
        assert.ok(delay, `Reveal sans delay explicite : {${props}}`);
        assert.ok(['0', '0.15', '0.3'].includes(delay[1]), `delay ${delay[1]} hors du schéma : {${props}}`);
        const stagger = props.match(/\bstagger:\s*([\d.]+)/);
        if (stagger) assert.equal(stagger[1], '0.06', `stagger ${stagger[1]} : les cartes ajoutent 0,06 s`);
      }
    });
  }
}

test('analyses.html : pastille en motion-safe:animate-pulse, zoom des cartes dans la feuille', () => {
  const { style, script } = partiesDe('analyses.html');
  assert.equal((script.match(/motion-safe:animate-pulse\b/g) || []).length, 1, 'la pastille « Article du jour » porte motion-safe:animate-pulse');
  assert.ok(!/group-hover:scale-/.test(script), 'zoom encore en group-hover:scale-* : utiliser .zoom-hover');
  assert.equal((script.match(/\bzoom-hover\b/g) || []).length, 1, 'l\'image des cartes porte zoom-hover');
  assert.ok(blocMedia(style, 'hover:hover) and (prefers-reduced-motion:no-preference')?.includes('.article-card:hover .zoom-hover{transform:scale(1.05)}'), 'zoom hors du bloc hover:hover + no-preference');
  assert.ok(blocMedia(style, 'prefers-reduced-motion:reduce').includes('.zoom-hover{transition:none}'), 'zoom non coupé en mouvement réduit');
  assert.ok(lire('assets/site.css').includes('.motion-safe\\:animate-pulse{'), 'site.css n\'a pas été reconstruit');
});

test('briefing.html : boucles en classes (pulse-live, spin), sommaire en .toc-link, jauge et cartes en jetons', () => {
  const { style, script } = partiesDe('briefing.html');
  // Sans régime v2, la page ne reçoit pas assets/design-tokens-v2.css : ses jetons locaux doivent rester identiques au fichier de jetons.
  const jetons = lire('assets/design-tokens-v2.css').match(/\[data-design-regime="editorial"\]\s*\{([^}]*)\}/)[1];
  for (const jeton of ['--motion-fast', '--motion-base', '--motion-slow']) {
    const ref = jetons.match(new RegExp(`${jeton}:\\s*([^;]+);`))[1].trim();
    const local = style.match(new RegExp(`${jeton}:\\s*([^;}]+)`));
    assert.ok(local, `${jeton} non posé localement dans briefing.html (la page ne charge pas design-tokens-v2.css)`);
    assert.equal(local[1].trim(), ref, `${jeton} local diverge du fichier de jetons`);
  }
  assert.ok(script.includes("className:'pulse-live'"), 'pastille LIVE : classe .pulse-live attendue');
  assert.ok(script.includes("className:'spin w-5 h-5"), 'spinner : classe .spin attendue');
  assert.ok(style.includes('@keyframes spin{'), '@keyframes spin manque (le spinner ne tournait pas)');
  assert.ok(style.includes('.toc-link{transition:background-color var(--motion-fast),color var(--motion-fast)}'), 'règle .toc-link attendue');
  assert.ok(script.includes('text-xs toc-link no-underline'), 'les liens du sommaire portent .toc-link');
  assert.ok(style.includes('transition:width var(--motion-slow)'), '.prob-fill en --motion-slow');
  const reduit = blocMedia(style, 'prefers-reduced-motion:reduce');
  for (const attendu of ['.pulse-live{animation-play-state:paused}', '.prob-fill{transition:none}']) assert.ok(reduit.includes(attendu), `mouvement réduit : ${attendu} manque`);
});

test('scroll-reveal.js reste dans le dépôt : nav-shared.js l\'injecte sur les pages legacy', () => {
  assert.ok(lire('scroll-reveal.js').length > 0);
  assert.ok(lire('nav-shared.js').includes("sr.src='scroll-reveal.js'"), 'nav-shared.js n\'injecte plus scroll-reveal.js : vérifier les 16 pages legacy');
});
