// marche.html, sa section dans methode.html et son entrée de navigation : ce que la page doit
// dire et dans quel ordre elle charge ses scripts. Aucun navigateur : lecture des fichiers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const lire = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const PAGE = lire('marche.html');
const MAIN = PAGE.slice(PAGE.indexOf('<main'), PAGE.indexOf('</main>'));
const M = vm.createContext({});
vm.runInContext(lire('lecture-marche-config.js'), M);
vm.runInContext(lire('lecture-marche-modele.js'), M);

test('marche.html : coquille legacy conforme, comme les autres pages du tracker', () => {
  assert.ok(PAGE.startsWith('<!DOCTYPE html>') && PAGE.includes('<html lang="fr">'));
  assert.ok(PAGE.includes('data-chrome="v2"') && PAGE.includes('data-design-regime="editorial"'));
  assert.ok(PAGE.indexOf('nav-config.js') < PAGE.indexOf('nav-shared.js'));
  const rang = (f) => PAGE.indexOf(`href="assets/${f}"`);
  assert.ok(rang('header-shell.css') < rang('tracker.css') && rang('tracker.css') < rang('lecture-marche.css') && rang('lecture-marche.css') < rang('site.css'));
});

test('marche.html charge le moteur du tracker, puis les seuils, puis le modèle, puis la vue', () => {
  const ordre = ['tracker-modele.js', 'lecture-marche-config.js', 'lecture-marche-modele.js', 'lecture-marche-vue.js'].map((f) => PAGE.indexOf(`<script src="${f}"></script>`));
  assert.ok(ordre.every((i) => i !== -1), 'un script manque');
  assert.deepEqual(ordre, [...ordre].sort((a, b) => a - b));
  assert.ok(!PAGE.includes('tracker-vue.js'), 'la vue du tracker n’a rien à faire sur cette page');
  for (const id of ['lecture-marche', 'lecture-marche-seuils', 'lecture-marche-contexte']) assert.ok(PAGE.includes(`id="${id}"`), `conteneur absent : ${id}`);
});

test('marche.html dit son statut : hypothèses non backtestées, hors protocole, pas un conseil', () => {
  for (const mention of ['Hypothèses non backtestées', 'hors du protocole de test', 'Outil de lecture, pas un conseil en investissement', 'ni d’acheter ni de vendre', 'jamais zéro']) {
    assert.ok(MAIN.includes(mention), `mention absente : ${mention}`);
  }
  assert.ok(MAIN.includes('class="tk-amf"'), 'avertissement absent de <main> (nav-shared.js remplace le pied de page)');
  for (const refus of ['ne constituent en aucun cas un conseil en investissement', 'recommandation d’achat ou de vente', 'objectif de cours', 'n’est pas une prévision']) {
    assert.ok(MAIN.includes(refus), `l’avertissement ne refuse pas « ${refus} »`);
  }
});

test('la page nomme la mesure « % des actions en circulation » et dit que « Confirmation » ne peut pas encore s’afficher', () => {
  const visibles = ['marche.html', 'methode.html', 'lecture-marche-vue.js'].map(lire).join('\n');
  assert.ok(!/flottant/i.test(visibles), 'la mesure ne se nomme jamais « % du flottant »');
  assert.match(lire('marche.html'), /% des actions en circulation/);
  assert.match(lire('marche.html'), /« Confirmation » ne peut pas encore s’afficher/);
});

test('la grille publiée sur la page nomme chaque étiquette du modèle', () => {
  for (const [code, e] of Object.entries(JSON.parse(JSON.stringify(M.MARCHE_ETIQUETTES)))) {
    assert.ok(MAIN.includes(e.libelle), `étiquette absente de la grille publiée : ${code} (${e.libelle})`);
  }
});

test('methode.html explique la couche marché, sa séparation et ses limites', () => {
  const methode = lire('methode.html');
  const debut = methode.indexOf('id="lecture-marche"');
  assert.notEqual(debut, -1, 'section absente');
  const section = methode.slice(debut, methode.indexOf('</section>', debut));
  for (const mention of ['à sens unique', 'hors du protocole de test', 'test de non-régression', 'Elle n’est pas backtestée', 'jamais zéro',
    'Elle ne promeut jamais un Signal faible', 'pas un conseil en investissement', 'deux fois par mois', 'hors des États-Unis', 'structurellement vers l’achat', 'href="marche.html"']) {
    assert.ok(section.includes(mention), `mention absente de la section : ${mention}`);
  }
  // La section s'ajoute : elle ne retire rien à ce que la méthode dit d'elle-même.
  assert.ok(methode.includes('ni cours de Bourse, ni presse, ni note d’analyste'));
});

test('la navigation mène à marche.html', () => {
  assert.ok(lire('nav-config.js').includes("href:'marche.html'"));
});
