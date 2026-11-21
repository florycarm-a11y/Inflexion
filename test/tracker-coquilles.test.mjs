// Garde-fous du tracker d'inflexions : index.html (la home EST le tracker depuis le pivot du
// 21 novembre 2026), entreprise.html, methode.html, tracker.html (pure redirection),
// tracker-modele.js, tracker-vue.js, assets/tracker.css, nav-config.js et data/tracker/.
//
// Méthode de référence : docs/tracker-methode.md (v1.3 proposée, non figée). Ces tests ne vérifient
// AUCUN calcul — il n'y a pas de moteur — mais trois promesses :
//   1. une valeur sans source ne s'affiche pas ;
//   2. le solde, les alertes, le score et la phase ne sont jamais saisis ;
//   3. aucune recommandation, aucun chiffre inventé, aucune société fictive.
// Aucune dépendance : lit les fichiers du dépôt, charge le modèle dans node:vm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const RACINE = new URL('../', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, RACINE), 'utf8');
const lireJson = (chemin) => JSON.parse(lire(chemin));

const PAGES_LEGACY = ['entreprise.html', 'methode.html']; // coquilles legacy du tracker
const INDEX = lire('index.html');
const SCRIPT_INDEX = INDEX.match(/<script type="module">([\s\S]*?)<\/script>/)[1];

// ── Le modèle, chargé hors navigateur (CLAUDE.md §8 : globales `var` dans node:vm) ──
const M = vm.createContext({});
vm.runInContext(lire('tracker-modele.js'), M);

// Jeu d'essai minimal : une source valide, jamais une société. Les fichiers du dépôt restent vides.
const SOURCE = { type: '8-K', date: '2026-01-01', url: 'https://exemple.test/depot' };

// Un contexte vm a ses propres intrinsèques : un tableau rendu par le modèle porte le Array.prototype
// de l'invité, et deepStrictEqual compare les prototypes. Tout ce qui sort de M repasse donc par ces
// deux passerelles avant comparaison.
const rapatrier = (tableau) => Array.from(tableau);
const conforme = (resultat, message) => {
  assert.deepEqual(rapatrier(resultat.erreurs), [], message);
  assert.equal(resultat.valide, true, message);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. La navigation porte le tracker (pivot confirmé le 21 novembre 2026)
// ─────────────────────────────────────────────────────────────────────────────

test('nav-config.js : les rubriques Tracker et Méthode existent, la veille est sortie', () => {
  const nav = lire('nav-config.js');
  for (const attendu of ["label:'Tracker'", "label:'Méthode'", "href:'index.html#societes'", "href:'index.html#alertes'", "href:'methode.html'", "href:'methode.html#backtest'"]) {
    assert.ok(nav.includes(attendu), `nav-config.js : ${attendu} absent — la nav doit porter le tracker`);
  }
  // Les pages de veille sont conservées dans le dépôt mais hors navigation.
  for (const veille of ['geopolitics.html', 'markets.html', 'crypto.html', 'commodities.html', 'etf.html', 'briefing.html', 'ai-tech.html']) {
    assert.ok(!nav.includes(veille), `nav-config.js : ${veille} encore dans la navigation`);
  }
  assert.ok(!nav.includes('MEGA_FOOTERS'), 'MEGA_FOOTERS est mort (aucun consommateur) : supprimé de nav-config.js');
  // L'archive reste accessible depuis la nav.
  assert.ok(nav.includes("href:'analyses.html'"), 'analyses.html (archives) doit rester joignable depuis la nav');
});

test('nav-shared.js : le pied de page legacy ne porte plus les liens de veille', () => {
  const ns = lire('nav-shared.js');
  for (const veille of ['geopolitics.html', 'markets.html', 'crypto.html', 'commodities.html', 'etf.html']) {
    assert.ok(!ns.includes(veille), `nav-shared.js : ${veille} encore dans le pied de page`);
  }
  for (const attendu of ['index.html#societes', 'methode.html']) {
    assert.ok(ns.includes(attendu), `nav-shared.js : ${attendu} absent du pied de page`);
  }
  assert.ok(ns.includes("tracker:'Tracker d’inflexions'"), 'CATEGORY_LABELS doit nommer le hero des pages du tracker');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. tracker.html : une pure redirection vers la home
// ─────────────────────────────────────────────────────────────────────────────

test('tracker.html : redirection minimale vers index.html#societes, noindex, hors des seaux de pages', () => {
  const html = lire('tracker.html');
  assert.ok(html.startsWith('<!DOCTYPE html>'), 'DOCTYPE absent');
  assert.ok(html.includes('<html lang="fr">'), 'lang="fr" absent');
  assert.ok(html.includes('<meta name="robots" content="noindex">'), 'noindex requis : la page ne doit plus être indexée');
  assert.ok(/<meta http-equiv="refresh" content="0;url=index\.html#societes">/.test(html), 'meta refresh 0 vers index.html#societes attendu');
  assert.ok(/<a href="index\.html#societes">/.test(html), 'lien de secours requis pour les navigateurs sans refresh');
  // Hors des seaux : ni legacy (nav-shared), ni React, ni Tailwind (SANS_TAILWIND dans site-css.test.mjs).
  assert.ok(!html.includes('nav-shared.js'), 'une redirection ne charge pas la coquille de navigation');
  assert.ok(!html.includes('site.css'), 'une redirection ne charge pas site.css (exemptée via SANS_TAILWIND)');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Les pages legacy du tracker : coquille conforme
// ─────────────────────────────────────────────────────────────────────────────

test('entreprise.html et methode.html : pages legacy complètes (DOCTYPE, langue, nav partagée)', () => {
  for (const page of PAGES_LEGACY) {
    const html = lire(page);
    assert.ok(html.startsWith('<!DOCTYPE html>'), `${page} : DOCTYPE absent`);
    assert.ok(html.includes('<html lang="fr">'), `${page} : lang="fr" absent`);
    assert.ok(html.includes('<script src="nav-shared.js"></script>'), `${page} : nav-shared.js absent (seau legacy)`);
    assert.ok(html.includes('<script src="nav-config.js"></script>'), `${page} : nav-config.js absent`);
    assert.ok(html.indexOf('nav-config.js') < html.indexOf('nav-shared.js'), `${page} : nav-config.js doit précéder nav-shared.js`);
    assert.ok(html.includes('data-chrome="v2"'), `${page} : chrome v2 absent`);
    assert.ok(html.includes('data-design-regime="editorial"'), `${page} : régime editorial absent`);
    // Le régime instrument ne déclare pas --editorial-accent, que la barre et le méga-menu de nav-shared.js consomment.
    assert.ok(!html.includes('data-design-regime="instrument"'), `${page} : le régime instrument priverait le chrome de --editorial-accent`);
    // Pages officielles depuis le pivot : plus de noindex.
    assert.ok(!html.includes('noindex'), `${page} : noindex à retirer, la page est officielle depuis le pivot`);
  }
});

test('assets/tracker.css liée au bon rang sur les trois pages qui la consomment', () => {
  for (const page of PAGES_LEGACY) {
    const html = lire(page);
    const tracker = html.indexOf('href="assets/tracker.css"');
    const shell = html.indexOf('href="assets/header-shell.css"');
    const site = html.indexOf('href="assets/site.css"');
    assert.notEqual(tracker, -1, `${page} : assets/tracker.css non liée`);
    assert.equal(html.split('href="assets/tracker.css"').length - 1, 1, `${page} : assets/tracker.css liée plus d'une fois`);
    assert.ok(shell < tracker && tracker < site, `${page} : ordre attendu header-shell.css, tracker.css, site.css`);
  }
  // La home : tracker.css avant site.css (elle ne lie pas header-shell.css, elle en est la source).
  const iTracker = INDEX.indexOf('href="assets/tracker.css"');
  const iSite = INDEX.indexOf('href="assets/site.css"');
  assert.ok(iTracker !== -1 && iTracker < iSite, 'index.html : tracker.css doit précéder site.css');
  assert.equal(INDEX.split('href="assets/tracker.css"').length - 1, 1, 'index.html : tracker.css liée plus d\'une fois');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Avertissement AMF et interdits éditoriaux — home comprise
// ─────────────────────────────────────────────────────────────────────────────

test('l’avertissement AMF est dans <main> sur les pages legacy et dans la home, et refuse les trois choses', () => {
  for (const page of PAGES_LEGACY) {
    const html = lire(page);
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    assert.ok(main.includes('class="tk-amf"'), `${page} : avertissement absent de <main> (nav-shared.js remplace footer.footer en entier, .footer-disclaimer disparaît à l’exécution)`);
    for (const refus of ['ne constituent en aucun cas un conseil en investissement', 'recommandation d’achat ou de vente', 'objectif de cours']) {
      assert.ok(main.includes(refus), `${page} : l’avertissement ne refuse pas « ${refus} »`);
    }
    assert.ok(main.includes('n’est pas une prévision'), `${page} : une alerte doit être dite non prévisionnelle`);
  }
  // La home rend son <main> en React : l'avertissement vit dans le script, composant Avertissement.
  assert.ok(SCRIPT_INDEX.includes("className:'tk-amf'"), 'index.html : avertissement tk-amf absent du script');
  for (const refus of ['ne constituent en aucun cas un conseil en investissement', 'recommandation d\\\'achat ou de vente', 'objectif de cours', 'n\\\'est pas une prévision']) {
    assert.ok(SCRIPT_INDEX.includes(refus), `index.html : l’avertissement ne porte pas « ${refus.replace(/\\\\/g, '')} »`);
  }
});

test('aucune page du tracker ne formule de recommandation — home comprise', () => {
  const INTERDITS = [
    'nous recommandons', 'nous conseillons', 'à acheter', 'à vendre', 'conseil d’achat', 'conseil de vente',
    'cours cible', 'objectif de cours de', 'potentiel de hausse', 'sous-évalué', 'surévalué', 'valeur à suivre',
  ];
  for (const page of ['index.html', ...PAGES_LEGACY, 'tracker.html', 'tracker-vue.js', 'tracker-modele.js', 'assets/tracker.css', 'data/tracker/README.md', 'nav-config.js']) {
    const texte = lire(page).toLowerCase();
    for (const mot of INTERDITS) assert.ok(!texte.includes(mot), `${page} : « ${mot} »`);
  }
});

test('la home n’invente rien : pas de solde affiché, pas d’alerte fabriquée, états vides nommés', () => {
  // Le solde et les alertes sont calculés par un moteur qui n'existe pas : la home ne doit en afficher aucun.
  for (const etat of ['Aucune société suivie', 'Aucune Rechute relevée', 'Aucune alerte relevée']) {
    assert.ok(SCRIPT_INDEX.includes(etat), `index.html : état vide absent : ${etat}`);
  }
  assert.ok(SCRIPT_INDEX.includes('TRACKER_MOTEUR.raison'), 'index.html : l’absence de moteur doit venir du modèle, pas d’une chaîne locale');
  // La home consomme le modèle, elle ne réécrit aucune règle.
  for (const appel of ['validerCatalogue(', 'etatCatalogue(']) {
    assert.ok(SCRIPT_INDEX.includes(appel), `index.html : la home doit passer par ${appel})`);
  }
  assert.ok(INDEX.includes('<script src="tracker-modele.js"></script>'), 'index.html : tracker-modele.js doit être chargé avant le module');
  assert.ok(INDEX.indexOf('tracker-modele.js') < INDEX.indexOf('<script type="module">'), 'index.html : le modèle se charge avant le module React');
  // Les deux ancres de navigation existent.
  assert.ok(SCRIPT_INDEX.includes("id:'societes'"), 'index.html : ancre #societes absente');
  assert.ok(SCRIPT_INDEX.includes("id:'alertes'"), 'index.html : ancre #alertes absente');
  // Les chiffres du backtest affichés sont ceux de la méthode §12, échecs compris.
  for (const chiffre of ["'17'", "'146'", "'5/5'", "'3/5'"]) {
    assert.ok(SCRIPT_INDEX.includes(chiffre), `index.html : chiffre du backtest absent : ${chiffre}`);
  }
  assert.ok(SCRIPT_INDEX.includes('échecs compris'), 'index.html : la bande du backtest doit assumer les échecs');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Identité v2 : angles droits, palette, rôles de couleur
// ─────────────────────────────────────────────────────────────────────────────

test('angles droits : aucun rayon dans la feuille ni dans les pages legacy du tracker', () => {
  const css = lire('assets/tracker.css');
  assert.deepEqual(css.match(/border-radius/g) || [], [], 'assets/tracker.css porte un rayon');
  for (const page of PAGES_LEGACY) {
    const html = lire(page);
    assert.deepEqual(html.match(/border-radius/g) || [], [], `${page} porte un rayon en ligne`);
    assert.ok(!/class="[^"]*\brounded(?!-full\b)/.test(html), `${page} : classe rounded`);
  }
});

test('aucune couleur périmée ou interdite (CLAUDE.md §3) — home comprise', () => {
  const PROSCRITES = [
    '#0B3D1E', '#072A14', '#14713A', '#EDE8DC', '#C41E3A', '#8CBF9E', '#1B6B4A', '#155A3D', '#0A1628', '#0F2035', '#162A45',
    '#F7F8FA', '#1A1F2E', '#E2E5EB',
  ];
  const POLICES = ['Plus Jakarta Sans', 'Libre Baskerville', 'JetBrains Mono'];
  for (const fichier of ['index.html', ...PAGES_LEGACY, 'assets/tracker.css', 'tracker-vue.js', 'nav-config.js']) {
    const texte = lire(fichier);
    const hauts = texte.toUpperCase();
    for (const hex of PROSCRITES) assert.ok(!hauts.includes(hex), `${fichier} : couleur proscrite ${hex}`);
    for (const police of POLICES) assert.ok(!texte.includes(police), `${fichier} : police périmée ${police}`);
  }
});

test('les couleurs de donnée ne sont déclarées qu’une fois, dans un jeton nommé --tk-', () => {
  const css = lire('assets/tracker.css');
  const corps = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const hex of ['#006650', '#C8955A', '#DC2626', '#6b7280', '#DFDCD0', '#9B957A']) {
    const lignes = corps.split('\n').filter((l) => l.includes(hex));
    assert.ok(lignes.length > 0, `${hex} : plus employée, le relevé ne mesure plus rien`);
    for (const ligne of lignes) assert.match(ligne.trim(), /^--tk-[\w-]+:/, `assets/tracker.css : ${hex} hors d’un jeton --tk- → « ${ligne.trim()} »`);
  }
  for (const page of ['index.html', ...PAGES_LEGACY]) {
    const html = lire(page);
    for (const hex of ['#006650', '#C8955A', '#DC2626', '#DFDCD0', '#9B957A']) {
      assert.ok(!html.toUpperCase().includes(hex.toUpperCase()), `${page} : couleur de donnée ${hex} écrite dans la page`);
    }
  }
});

test('les deux jetons de donnée incomplète, posés localement, n’ont pas dérivé du fichier de jetons', () => {
  const instrument = lire('assets/design-tokens-v2.css').match(/\[data-design-regime="instrument"\]\s*\{([^}]*)\}/)[1];
  const css = lire('assets/tracker.css');
  for (const [jeton, local] of [['--surface-incomplete', '--tk-incomplete-fond'], ['--rule-incomplete', '--tk-incomplete-filet']]) {
    const reference = instrument.match(new RegExp(`${jeton}:\\s*([^;]+);`));
    assert.ok(reference, `${jeton} absent du régime instrument`);
    const pose = css.match(new RegExp(`${local}:\\s*([^;]+);`));
    assert.ok(pose, `${local} non posé dans assets/tracker.css`);
    assert.equal(pose[1].trim(), reference[1].trim(), `${local} diverge de ${jeton}`);
  }
});

test('les trois couleurs de financement sont des aplats, pas du texte coloré', () => {
  const css = lire('assets/tracker.css');
  for (const couleur of ['vert', 'orange', 'rouge']) {
    const regle = css.match(new RegExp(`\\.tk-fin--${couleur}\\s*\\{([^}]*)\\}`));
    assert.ok(regle, `.tk-fin--${couleur} introuvable`);
    assert.match(regle[1], /background:\s*var\(--tk-fin-/, `.tk-fin--${couleur} : la couleur de donnée doit être le fond`);
    assert.match(regle[1], /color:\s*(#FFFFFF|var\(--text-primary\))/, `.tk-fin--${couleur} : texte noir ou blanc attendu`);
  }
});

test('pas de Markdown brut dans le HTML (CLAUDE.md §9)', () => {
  for (const page of PAGES_LEGACY) {
    const html = lire(page);
    assert.ok(!/\*\*[^*\n]+\*\*/.test(html), `${page} : gras en Markdown`);
    assert.ok(!/^#{1,6} /m.test(html), `${page} : titre en Markdown`);
    assert.ok(!/\[[^\]\n]+\]\([^)\n]+\)/.test(html), `${page} : lien en Markdown`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Le modèle : une valeur sans source ne s'affiche pas
// ─────────────────────────────────────────────────────────────────────────────

test('le modèle se charge dans node:vm et expose le vocabulaire de la méthode', () => {
  assert.equal(M.TRACKER_METHODE.version, '1.3');
  assert.equal(M.TRACKER_METHODE.fige, false, 'la v1.3 n’est pas figée');
  assert.equal(M.TRACKER_METHODE.document, 'docs/tracker-methode.md');
  assert.deepEqual(rapatrier(M.TRACKER_DIMENSIONS).map((d) => d.code), ['D1', 'D2', 'D3', 'D4']);
  assert.deepEqual(rapatrier(M.TRACKER_ALERTES).map((a) => a.libelle), ['Bascule', 'Bascule commerciale', 'Signal faible', 'Rechute']);
  assert.deepEqual(Object.keys(M.TRACKER_ARCHETYPES), ['pre-revenus', 'plateforme', 'industriel']);
  assert.equal(M.TRACKER_BARREAUX.length, 6, 'l’échelle d’engagement va de 0 à 5');
  assert.deepEqual(rapatrier(M.TRACKER_BARREAUX).map((b) => b.niveau), [0, 1, 2, 3, 4, 5]);
  // « non publié » ne compte pas dans le solde : signe null, et non 0.
  assert.equal(M.TRACKER_SENS['non-publie'].signe, null);
  assert.equal(M.TRACKER_SENS.stable.signe, 0);
  // Aucun code de schéma ne doit atteindre l'écran : chaque état a son libellé français.
  assert.deepEqual(Object.keys(M.TRACKER_MARGE_BRUTE), ['positive', 'nulle', 'negative', 'non-calculable', 'sans-objet']);
  assert.equal(M.TRACKER_MARGE_BRUTE.negative.libelle, 'Négative');
  assert.equal(M.TRACKER_MARGE_BRUTE['sans-objet'].incomplet, true, 'un garde-fou sans objet est une absence');
  assert.equal(M.TRACKER_MARGE_BRUTE.positive.incomplet, false);
});

test('une source exige son type, son jour et son adresse', () => {
  assert.equal(M.sourceValide(SOURCE), true);
  assert.equal(M.sourceValide(null), false);
  assert.equal(M.sourceValide({ ...SOURCE, url: '' }), false, 'sans adresse');
  assert.equal(M.sourceValide({ ...SOURCE, date: '2026-1-1' }), false, 'jour mal formé');
  assert.equal(M.sourceValide({ ...SOURCE, type: 'tweet' }), false, 'type hors méthode');
});

test('une valeur sans source ne s’affiche pas', () => {
  assert.deepEqual(M.valeurSourcee({ valeur: 'Segment réacteurs', source: SOURCE }), { valeur: 'Segment réacteurs', source: SOURCE });
  assert.equal(M.valeurSourcee({ valeur: 'Segment réacteurs' }), null, 'valeur nue');
  assert.equal(M.valeurSourcee({ valeur: 'Segment réacteurs', source: { type: '8-K' } }), null, 'source incomplète');
  assert.equal(M.valeurSourcee({ source: SOURCE }), null, 'source sans valeur');
  assert.equal(M.valeurSourcee(null), null);
});

test('« non publié » se passe de source ; tout autre sens exige la sienne', () => {
  assert.equal(M.sensAffichable({ sens: 'non-publie' }), 'non-publie');
  assert.equal(M.sensAffichable({ sens: 'hausse', source: SOURCE }), 'hausse');
  // Un sens publié sans source ne devient PAS « non publié » : il ne s’affiche pas du tout.
  assert.equal(M.sensAffichable({ sens: 'hausse' }), null);
  assert.equal(M.sensAffichable({ sens: 'baisse', source: { type: '8-K', date: '2026-01-01' } }), null);
  assert.equal(M.sensAffichable({ sens: 'tiede', source: SOURCE }), null, 'sens hors méthode');
});

test('le solde et les alertes restent non calculés : aucun moteur dans le dépôt', () => {
  assert.equal(M.TRACKER_MOTEUR.present, false);
  assert.equal(M.soldeDe({}), null, 'un solde deviné serait un chiffre inventé');
  assert.deepEqual(rapatrier(M.alertesDe({})), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Le schéma : les fichiers du dépôt sont vides et valides
// ─────────────────────────────────────────────────────────────────────────────

test('data/tracker/entreprises.json est vide et valide', () => {
  const catalogue = lireJson('data/tracker/entreprises.json');
  conforme(M.validerCatalogue(catalogue));
  assert.deepEqual(catalogue.entreprises, [], 'aucune société : une coquille vide est le résultat attendu');
  assert.equal(M.etatCatalogue(catalogue), 'aucune-entreprise');
});

test('data/tracker/_modele.json est un gabarit vide et valide', () => {
  const gabarit = lireJson('data/tracker/_modele.json');
  conforme(M.validerFichierSociete(gabarit));
  assert.equal(gabarit.entreprise, null, 'le gabarit n’appartient à aucune société');
  assert.deepEqual(gabarit.publications, []);
  assert.deepEqual(gabarit.evenements_commerciaux, []);
  assert.equal(M.etatFiche(gabarit), 'sans-publication');
  assert.equal(M.etatEvenements(gabarit), 'aucun');
});

test('aucune société fictive ni donnée de démonstration dans data/tracker/', () => {
  const catalogue = lire('data/tracker/entreprises.json');
  const gabarit = lire('data/tracker/_modele.json');
  for (const [nom, texte] of [['entreprises.json', catalogue], ['_modele.json', gabarit]]) {
    const chiffres = texte.replace(/"methode_version":\s*"1\.3"/, '').match(/\d/g) || [];
    assert.deepEqual(chiffres, [], `${nom} : chiffre hors du numéro de version`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Le validateur refuse ce que la méthode interdit
// ─────────────────────────────────────────────────────────────────────────────

const entreprise = (extra) => ({
  methode_version: '1.3',
  methode_document: 'docs/tracker-methode.md',
  entreprises: [{
    id: 'societe-a', nom: 'Société A', recit: 'Récit', archetype: 'plateforme',
    ca_these: { valeur: 'Chiffre d’affaires total', source: SOURCE },
    indicateur_demande: { type: 'commandes', valeur: 'Commandes', source: SOURCE },
    entree_tracker: '2026-01-01', fichier: 'data/tracker/societe-a.json',
    ...extra,
  }],
});

const publication = (extra) => ({
  entreprise: 'societe-a',
  methode_version: '1.3',
  publications: [{
    date: '2026-02-01', trimestre: 'T4 2025', source: SOURCE,
    dimensions: {
      d1: { sens: 'hausse', source: SOURCE },
      d2: { sens: 'non-publie' },
      d3: { sens: 'stable', source: SOURCE },
      d4: { sens: 'baisse', source: SOURCE },
    },
    statut_prevision: 'maintenue',
    marge_brute: { etat: 'positive', source: SOURCE },
    financement: { couleur: 'non-determinee', motifs: [] },
    drapeaux: [],
    ...extra,
  }],
  evenements_commerciaux: [],
});

const premiereErreur = (resultat) => { assert.equal(resultat.valide, false, 'le fichier aurait dû être refusé'); return resultat.erreurs.join(' | '); };

test('le catalogue : paramètres de §2 exigés, identifiant et chemin de fichier cohérents', () => {
  assert.equal(M.validerCatalogue(entreprise()).valide, true);
  assert.match(premiereErreur(M.validerCatalogue(entreprise({ archetype: 'licorne' }))), /archetype/);
  assert.match(premiereErreur(M.validerCatalogue(entreprise({ id: 'Societe A' }))), /id/);
  assert.match(premiereErreur(M.validerCatalogue(entreprise({ fichier: 'data/tracker/autre.json' }))), /fichier/);
  assert.match(premiereErreur(M.validerCatalogue(entreprise({ ca_these: { valeur: 'Segment' } }))), /ca_these\.source/);
  assert.match(premiereErreur(M.validerCatalogue(entreprise({ indicateur_demande: { type: 'carnet', valeur: 'Carnet' } }))), /indicateur_demande\.source/);
  assert.equal(M.validerCatalogue(entreprise({ indicateur_demande: { type: 'non-publie' } })).valide, true);
  const double = entreprise();
  double.entreprises.push({ ...double.entreprises[0] });
  assert.match(premiereErreur(M.validerCatalogue(double)), /en double/);
  assert.match(premiereErreur(M.validerCatalogue({ ...entreprise(), methode_version: '1.2' })), /methode_version/);
});

test('une publication : un sens publié sans source rend le fichier invalide', () => {
  assert.equal(M.validerFichierSociete(publication()).valide, true);
  const sansSource = publication();
  sansSource.publications[0].dimensions.d1 = { sens: 'hausse' };
  assert.match(premiereErreur(M.validerFichierSociete(sansSource)), /dimensions\.d1\.source/);
});

test('une publication : solde, alertes, score et phase sont calculés, jamais saisis', () => {
  for (const interdit of ['solde', 'alertes', 'score', 'phase']) {
    const triche = publication({ [interdit]: interdit === 'alertes' ? ['bascule'] : 2 });
    assert.match(premiereErreur(M.validerFichierSociete(triche)), new RegExp(`${interdit}.*calculé, jamais saisi`));
  }
});

test('une publication : le statut de prévision doit s’accorder avec le sens de D3', () => {
  const desaccord = publication({ statut_prevision: 'relevee' });
  assert.match(premiereErreur(M.validerFichierSociete(desaccord)), /statut_prevision/);
  const accord = publication({ statut_prevision: 'relevee' });
  accord.publications[0].dimensions.d3 = { sens: 'hausse', source: SOURCE };
  assert.equal(M.validerFichierSociete(accord).valide, true);
  const manquee = publication({ statut_prevision: 'manquee' });
  manquee.publications[0].dimensions.d3 = { sens: 'baisse', source: SOURCE };
  assert.equal(M.validerFichierSociete(manquee).valide, true);
});

test('une publication : le financement n’est jamais vert par défaut, et une couleur affirmée porte sa source', () => {
  assert.equal(M.TRACKER_FINANCEMENT_DEFAUT, 'non-determinee');
  assert.equal(M.validerFichierSociete(publication()).valide, true, '« non déterminée » se passe de source');
  const vertSansSource = publication();
  vertSansSource.publications[0].financement = { couleur: 'vert', motifs: [] };
  assert.match(premiereErreur(M.validerFichierSociete(vertSansSource)), /financement\.source/);
  const motifInconnu = publication();
  motifInconnu.publications[0].financement = { couleur: 'non-determinee', motifs: ['intuition'] };
  assert.match(premiereErreur(M.validerFichierSociete(motifInconnu)), /motifs/);
});

test('une publication : les trois drapeaux de calcul seulement, chacun avec sa source', () => {
  assert.deepEqual(Object.keys(M.TRACKER_DRAPEAUX), ['vend-a-perte', 'remuneration-actions', 'hesitation']);
  const avecDrapeau = publication();
  avecDrapeau.publications[0].drapeaux = [{ code: 'vend-a-perte', source: SOURCE }];
  assert.equal(M.validerFichierSociete(avecDrapeau).valide, true);
  const sansSource = publication();
  sansSource.publications[0].drapeaux = [{ code: 'hesitation' }];
  assert.match(premiereErreur(M.validerFichierSociete(sansSource)), /drapeaux\[0\]\.source/);
  const editorial = publication();
  editorial.publications[0].drapeaux = [{ code: 'concentration-clients', source: SOURCE }];
  assert.match(premiereErreur(M.validerFichierSociete(editorial)), /drapeaux\[0\]\.code/);
});

test('un événement commercial : barreau de 0 à 5, et jamais de barreau sans source', () => {
  const avec = (ev) => { const f = publication(); f.evenements_commerciaux = [ev]; return f; };
  assert.equal(M.validerFichierSociete(avec({ date: '2026-03-01', barreau: 4, intitule: 'Contrat ferme', source: SOURCE })).valide, true);
  assert.match(premiereErreur(M.validerFichierSociete(avec({ date: '2026-03-01', barreau: 6, intitule: 'Hors échelle', source: SOURCE }))), /barreau/);
  assert.match(premiereErreur(M.validerFichierSociete(avec({ date: '2026-03-01', barreau: 2, intitule: 'Accord-cadre' }))), /source/);
});

test('une publication : seules les quatre dimensions de la méthode', () => {
  const cinquieme = publication();
  cinquieme.publications[0].dimensions.d5 = { sens: 'hausse', source: SOURCE };
  assert.match(premiereErreur(M.validerFichierSociete(cinquieme)), /clé inconnue d5/);
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. La vue (fiche société) : états vides nommés, aucune donnée par innerHTML
// ─────────────────────────────────────────────────────────────────────────────

test('la vue de la fiche nomme ses états vides ; la liste vit sur la home', () => {
  const vue = lire('tracker-vue.js');
  for (const etat of ['Aucune publication relevée', 'Aucune alerte', 'Aucun événement relevé', 'Aucune société sélectionnée', 'Société inconnue']) {
    assert.ok(vue.includes(etat), `état vide absent : ${etat}`);
  }
  // La liste est rendue par la home depuis le pivot : plus de rendreListe ici.
  assert.ok(!vue.includes('rendreListe'), 'rendreListe est mort : la liste vit sur index.html');
  assert.ok(!vue.includes('tracker-liste'), 'le conteneur de liste n’existe plus');
  assert.ok(vue.includes("TRACKER_SENS['non-publie'].libelle") || vue.includes("TRACKER_SENS['non-publie'].abrege"), 'le libellé « non publié » doit venir du modèle');
});

test('la vue n’injecte aucune donnée par innerHTML', () => {
  const vue = lire('tracker-vue.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
  assert.deepEqual(vue.match(/innerHTML/g) || [], [], 'innerHTML dans tracker-vue.js');
  assert.ok(vue.includes("hote.textContent = ''"), 'le conteneur doit se vider par textContent');
});

test('la vue ne réécrit aucune règle de la méthode : elle passe par le modèle', () => {
  const vue = lire('tracker-vue.js');
  for (const appel of ['valeurSourcee', 'sensAffichable', 'sourceValide', 'soldeDe', 'alertesDe', 'etatFiche', 'etatEvenements', 'validerCatalogue', 'validerFichierSociete']) {
    assert.ok(vue.includes(appel + '('), `tracker-vue.js n’appelle pas ${appel}()`);
    assert.ok(!new RegExp(`function\\s+${appel}\\s*\\(`).test(vue), `tracker-vue.js redéfinit ${appel}`);
  }
  for (const seuil of ['1.05', '0.95', '>= +2', '<= -2']) {
    assert.ok(!vue.includes(seuil), `tracker-vue.js porte le seuil ${seuil} : il appartient au moteur, qui n’existe pas`);
  }
});

test('entreprise.html charge le modèle avant la vue, et son conteneur existe', () => {
  const html = lire('entreprise.html');
  const modele = html.indexOf('src="tracker-modele.js"');
  const vue = html.indexOf('src="tracker-vue.js"');
  assert.ok(modele !== -1 && vue !== -1, 'entreprise.html : scripts du tracker absents');
  assert.ok(modele < vue, 'entreprise.html : tracker-modele.js doit précéder tracker-vue.js');
  assert.ok(html.includes('id="tracker-fiche"'), 'entreprise.html : conteneur de fiche absent');
  // methode.html est du texte : elle n'a pas besoin de la vue.
  assert.ok(!lire('methode.html').includes('tracker-vue.js'), 'methode.html ne doit pas charger la vue');
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. methode.html reprend docs/tracker-methode.md, §12 en entier
// ─────────────────────────────────────────────────────────────────────────────

const METHODE = lire('methode.html');

test('methode.html annonce le statut non figé de la v1.3', () => {
  for (const mention of ['v1.3', 'non figée', 'huit précisions', 'docs/tracker-methode.md']) {
    assert.ok(METHODE.includes(mention), `mention absente : ${mention}`);
  }
  assert.ok(/Aucun moteur de calcul n’est dans le dépôt/.test(METHODE), 'l’absence de moteur doit être dite');
});

test('methode.html porte les quatre dimensions et les quatre alertes', () => {
  for (const d of ['D1 · Revenus de la thèse', 'D2 · Demande engagée', 'D3 · Prévision et jalons', 'D4 · Rentabilité']) {
    assert.ok(METHODE.includes(d), `dimension absente : ${d}`);
  }
  for (const a of M.TRACKER_ALERTES) {
    assert.ok(METHODE.includes('>' + a.libelle + '<'), `alerte absente d’une cellule : ${a.libelle}`);
  }
  for (const v of ['D1 · pré-revenus', 'D2 · pré-revenus', 'D2 · à défaut de commandes']) {
    assert.ok(METHODE.includes(v), `variante absente : ${v}`);
  }
  for (const r of ['vend à perte', 'régime de bascule', 'régime de rechute']) {
    assert.ok(METHODE.includes(r), `règle d’alerte absente : ${r}`);
  }
});

test('methode.html reprend la section 12 en entier, échecs compris', () => {
  const CONSTRUCTION = ['Palantir', 'Nvidia', 'Vertiv', 'Tesla', 'Nikola', 'WeWork', 'Cisco'];
  const TEST = ['AppLovin', 'ChargePoint', 'Constellation Energy', 'CrowdStrike', 'Fisker', 'GE Vernova', 'Peloton', 'Plug Power', 'Rocket Lab', 'SunPower'];
  for (const cas of [...CONSTRUCTION, ...TEST]) assert.ok(METHODE.includes(cas), `cas du backtest absent : ${cas}`);

  for (const chiffre of ['146 publications', '34 alertes', '11 Bascules', '10 Rechutes', '13 Signaux faibles']) {
    assert.ok(METHODE.includes(chiffre), `décompte absent : ${chiffre}`);
  }

  for (const constat of ['5 sur 5', '3 sur 5', '6 sur 10 mesurables', '5 sur 10 mesurables', '6 sur 8 mesurables', '90 % des sens']) {
    assert.ok(METHODE.includes(constat), `constat absent : ${constat}`);
  }
  assert.ok(METHODE.includes('4 sur 5 si le garde-fou est lu à la lettre de la v1.2'), 'la lecture alternative du garde-fou (Fisker) doit figurer');

  for (const lecon of [
    'La Bascule ne trie pas les gagnants',
    'La Rechute est le signal le plus fiable',
    'Deux des trois règles ajoutées en v1.2 n’ont rien montré',
    'Les limites',
  ]) assert.ok(METHODE.includes(lecon), `enseignement absent : ${lecon}`);

  for (const limite of [
    'dressée de mémoire, en connaissant le sort des sociétés',
    'La prévision se lit à la main',
    'Les cours de Fisker et de SunPower manquent',
    'Les verdicts de GE Vernova et de Rocket Lab sont provisoires',
  ]) assert.ok(METHODE.includes(limite), `limite absente : ${limite}`);

  assert.ok(METHODE.includes('296 points de mieux') && METHODE.includes('102 points de moins'), 'les deux suites du garde-fou doivent figurer');
  assert.ok(METHODE.includes('Les engagements nets n’ont changé aucune couleur'), 'règle v1.2 sans effet absente');
  assert.ok(METHODE.includes('La première prévision de bénéfice net ne s’est jamais déclenchée'), 'règle v1.2 jamais déclenchée absente');

  assert.ok(METHODE.includes('Ce que le site peut écrire') && METHODE.includes('Ce qu’il ne peut pas écrire'), 'les deux encadrés de §12 sont exigés');
  assert.ok(METHODE.includes('Qu’une Bascule annonce une réussite, ni aucune promesse de performance'), 'l’interdit de §12 doit être écrit');
});

test('methode.html dit ce que la méthode ne fait pas', () => {
  assert.ok(METHODE.includes('ni cours de Bourse, ni presse, ni note d’analyste'), 'les sources exclues doivent être dites');
  assert.ok(METHODE.includes('température du récit') && METHODE.includes('ne fait pas partie de la v1.3'), 'le statut de la température du récit doit être dit');
  assert.ok(METHODE.includes('Elles ne sont pas affichées sur les fiches'), 'le sort du score de §9 doit être dit');
  assert.ok(!lire('entreprise.html').includes('Phase') && !lire('entreprise.html').includes('Score'), 'la fiche ne doit porter ni score ni phase');
  assert.ok(!lire('tracker-vue.js').includes('phase') && !lire('tracker-vue.js').includes('score'), 'la vue ne doit calculer ni score ni phase');
});
