// Garde-fous du prompt 4 de l'audit Starlink (docs/superpowers/specs/2026-11-15-animations-design.md, §3).
// Aucune dépendance : lit les fichiers du dépôt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const RACINE = new URL('../', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, RACINE), 'utf8');
const html = lire('index.html');
// Les commentaires (/* */ en CSS, // en JS) sont de la prose, pas du code : retirés avant toute analyse.
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const style = sansCommentaires(html.match(/<style>([\s\S]*?)<\/style>/)[1]);
const script = sansCommentaires(html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]);
const code = style + script;
// Un littéral de temps CSS (.22s, 0.6s, 300ms), pas une longueur (16px, 0.18em) ni un nombre (1.1).
const TEMPS = /(?<![\w.-])\d*\.?\d+m?s\b/g;

// Index de l'accolade qui ferme le bloc ouvert juste après `debut` (accolades équilibrées).
function finDeBloc(css, debut) {
  let profondeur = 0;
  for (let j = css.indexOf('{', debut); j < css.length; j++) {
    if (css[j] === '{') profondeur++;
    else if (css[j] === '}' && --profondeur === 0) return j;
  }
  throw new Error('bloc non fermé');
}
// Contenu du premier bloc `@media(<requete>){…}`, ou null.
function blocMedia(css, requete) {
  const debut = css.indexOf(`@media(${requete})`);
  return debut === -1 ? null : css.slice(css.indexOf('{', debut) + 1, finDeBloc(css, debut));
}
// La feuille sans ses blocs `@media(<requete>){…}`.
function sansBlocs(css, requete) {
  let reste = '', i = 0;
  for (;;) {
    const debut = css.indexOf(`@media(${requete})`, i);
    if (debut === -1) return reste + css.slice(i);
    reste += css.slice(i, debut);
    i = finDeBloc(css, debut) + 1;
  }
}

test('design-tokens-v2.css : les trois jetons de mouvement dans les deux régimes', () => {
  const css = lire('assets/design-tokens-v2.css');
  for (const regime of ['instrument', 'editorial']) {
    const bloc = css.match(new RegExp(`\\[data-design-regime="${regime}"\\]\\s*\\{([^}]*)\\}`));
    assert.ok(bloc, `régime ${regime} introuvable`);
    assert.match(bloc[1], /--motion-fast:\s*\.15s ease;/, `${regime} : --motion-fast manque`);
    assert.match(bloc[1], /--motion-base:\s*\.3s cubic-bezier\(\.4,0,\.2,1\);/, `${regime} : --motion-base manque`);
    assert.match(bloc[1], /--motion-slow:\s*\.5s ease-out;/, `${regime} : --motion-slow manque`);
  }
});

test('index.html : aucune durée écrite en dur, les trois jetons consommés', () => {
  const litteraux = style.match(TEMPS) || [];
  assert.deepEqual(litteraux, [], `littéraux de temps dans le <style> : ${litteraux.join(', ')} (utiliser var(--motion-*))`);
  for (const jeton of ['--motion-fast', '--motion-base', '--motion-slow']) {
    assert.ok(style.includes(`var(${jeton})`), `${jeton} n'est consommé nulle part dans le <style>`);
  }
  const durations = code.match(/\bduration-\[?[\w.]+\]?/g) || [];
  assert.deepEqual(durations, [], `classes Tailwind de durée : ${durations.join(', ')} (les jetons sont composés, Tailwind ne peut pas les consommer : passer par le <style>)`);
  // Style inline React avec une durée (ex-FadeUp). animationDelay / transitionDelay (des délais) restent permis.
  const inline = script.match(/\b(?:transition|animation)\s*:\s*[`'"][^`'"]*?\d+m?s\b/g) || [];
  assert.deepEqual(inline, [], `durée inline dans le script : ${inline.join(' | ')}`);
});

test('index.html : tous les :hover du <style> sont sous @media(hover:hover), zoom des images dans la feuille', () => {
  assert.ok(blocMedia(style, 'hover:hover') !== null, 'aucun bloc @media(hover:hover) dans le <style>');
  const horsBloc = (sansBlocs(style, 'hover:hover').match(/[^{}\n]*:hover[^{]*\{/g) || []).map((s) => s.trim());
  assert.deepEqual(horsBloc, [], `:hover hors de @media(hover:hover) : ${horsBloc.join(' ; ')}`);
  assert.ok(!/group-hover:scale-/.test(script), 'zoom d\'image encore en group-hover:scale-* : utiliser .zoom-hover');
  assert.equal((script.match(/\bzoom-hover\b/g) || []).length, 2, 'les deux img zoomables (manchette, cartes Décryptages) portent zoom-hover');
});

test('index.html : Reveal (enfant unique, lit la préférence), FadeUp disparu, bloc de mouvement réduit complet', () => {
  assert.ok(/function Reveal\(/.test(script), 'composant Reveal absent');
  assert.ok(script.includes("matchMedia('(prefers-reduced-motion: reduce)')"), 'Reveal ne lit pas prefers-reduced-motion');
  assert.ok(/React\.Children\.only\(/.test(script) && /React\.cloneElement\(/.test(script), 'Reveal doit cloner un enfant unique (un div enveloppant casserait les grilles)');
  for (const mort of ['FadeUp', 'useInView', 'anim-fade-up', 'fade-up', 'anim-d1']) {
    assert.ok(!code.includes(mort), `${mort} encore présent : un seul mécanisme d'apparition (Reveal)`);
  }
  const reduit = blocMedia(style, 'prefers-reduced-motion:reduce');
  assert.ok(reduit, 'bloc @media(prefers-reduced-motion:reduce) introuvable');
  for (const attendu of [
    '.animate-pulse{animation:none}',
    '.reveal{opacity:1;transform:none;transition:none}',
    '.zoom-hover{transition:none}',
    '.mobile-overlay.open .menu-item{animation:none;opacity:1}',
  ]) {
    assert.ok(reduit.includes(attendu), `mouvement réduit : ${attendu} manque`);
  }
});

test('index.html : le schéma de délais du prompt 4 (0 / 0,15 / 0,3 ; +0,06 par carte)', () => {
  const usages = [...script.matchAll(/h\(Reveal,\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(usages.length >= 20, `seulement ${usages.length} Reveal : le hero et les trois sections en comptent au moins 20`);
  for (const props of usages) {
    const delay = props.match(/\bdelay:([\d.]+)/);
    assert.ok(delay, `Reveal sans delay explicite : {${props}}`);
    assert.ok(['0', '0.15', '0.3'].includes(delay[1]), `delay ${delay[1]} hors du schéma 0 / 0.15 / 0.3 : {${props}}`);
    const stagger = props.match(/\bstagger:([\d.]+)/);
    if (stagger) assert.equal(stagger[1], '0.06', `stagger ${stagger[1]} : les cartes ajoutent 0,06 s`);
  }
  assert.equal(usages.filter((p) => /\bstagger:/.test(p)).length, 2, 'deux grilles de cartes portent stagger (Décryptages, Sources & signaux)');
});
