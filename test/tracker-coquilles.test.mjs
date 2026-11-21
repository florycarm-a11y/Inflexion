// Garde-fous des coquilles du tracker d'inflexions : tracker.html, entreprise.html, methode.html,
// tracker-modele.js, tracker-vue.js, assets/tracker.css et data/tracker/.
//
// Méthode de référence : docs/tracker-methode.md (v1.3 proposée, non figée). Ces tests ne vérifient
// AUCUN calcul — il n'y a pas de moteur — mais trois promesses de la coquille :
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

const PAGES = ['tracker.html', 'entreprise.html', 'methode.html'];
const PAGES_INSTRUMENT = ['tracker.html', 'entreprise.html']; // celles qui rendent des données

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
// 1. Les trois pages : coquille legacy conforme
// ─────────────────────────────────────────────────────────────────────────────

test('les trois pages sont des pages legacy complètes (DOCTYPE, langue, nav partagée)', () => {
  for (const page of PAGES) {
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
  }
});

test('les trois pages lient assets/tracker.css entre header-shell.css et site.css', () => {
  for (const page of PAGES) {
    const html = lire(page);
    const tracker = html.indexOf('href="assets/tracker.css"');
    const shell = html.indexOf('href="assets/header-shell.css"');
    const site = html.indexOf('href="assets/site.css"');
    assert.notEqual(tracker, -1, `${page} : assets/tracker.css non liée`);
    assert.equal(html.split('href="assets/tracker.css"').length - 1, 1, `${page} : assets/tracker.css liée plus d'une fois`);
    assert.ok(shell < tracker && tracker < site, `${page} : ordre attendu header-shell.css, tracker.css, site.css`);
  }
});

test('les trois pages restent hors navigation : aucune n’est ajoutée à nav-config.js', () => {
  const nav = lire('nav-config.js');
  for (const page of PAGES) {
    assert.ok(!nav.includes(page), `${page} est entrée dans nav-config.js : le pivot de la vitrine n’est pas confirmé`);
  }
  // Et aucune page existante ne pointe vers elles.
  const index = lire('index.html');
  for (const page of PAGES) assert.ok(!index.includes(page), `index.html pointe vers ${page}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Avertissement AMF : dans <main>, car nav-shared.js remplace le pied de page
// ─────────────────────────────────────────────────────────────────────────────

test('l’avertissement AMF est dans <main> sur les trois pages, et refuse les trois choses', () => {
  for (const page of PAGES) {
    const html = lire(page);
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    assert.ok(main.includes('class="tk-amf"'), `${page} : avertissement absent de <main> (nav-shared.js remplace footer.footer en entier, .footer-disclaimer disparaît à l’exécution)`);
    for (const refus of ['ne constituent en aucun cas un conseil en investissement', 'recommandation d’achat ou de vente', 'objectif de cours']) {
      assert.ok(main.includes(refus), `${page} : l’avertissement ne refuse pas « ${refus} »`);
    }
    assert.ok(main.includes('n’est pas une prévision'), `${page} : une alerte doit être dite non prévisionnelle`);
  }
});

test('aucune page ne formule de recommandation', () => {
  // Mots-clés assertifs, pas des sous-chaînes : « coût des ventes » et « recommandation d’achat ou de vente »
  // (dans l’avertissement, qui les refuse) ne doivent pas déclencher.
  const INTERDITS = [
    'nous recommandons', 'nous conseillons', 'à acheter', 'à vendre', 'conseil d’achat', 'conseil de vente',
    'cours cible', 'objectif de cours de', 'potentiel de hausse', 'sous-évalué', 'surévalué', 'valeur à suivre',
  ];
  for (const page of [...PAGES, 'tracker-vue.js', 'tracker-modele.js', 'assets/tracker.css', 'data/tracker/README.md']) {
    const texte = lire(page).toLowerCase();
    for (const mot of INTERDITS) assert.ok(!texte.includes(mot), `${page} : « ${mot} »`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Identité v2 : angles droits, palette, rôles de couleur
// ─────────────────────────────────────────────────────────────────────────────

test('angles droits : aucun rayon dans la feuille ni dans les pages du tracker', () => {
  const css = lire('assets/tracker.css');
  assert.deepEqual(css.match(/border-radius/g) || [], [], 'assets/tracker.css porte un rayon');
  for (const page of PAGES) {
    const html = lire(page);
    assert.deepEqual(html.match(/border-radius/g) || [], [], `${page} porte un rayon en ligne`);
    assert.ok(!/class="[^"]*\brounded(?!-full\b)/.test(html), `${page} : classe rounded`);
  }
});

test('aucune couleur périmée ou interdite (CLAUDE.md §3)', () => {
  // Interdites comme identité ET comme donnée, puis périmées comme identité (encore valides comme donnée,
  // mais aucune n’a de rôle ici) : le tracker n’emploie ni l’une ni l’autre.
  const PROSCRITES = [
    '#0B3D1E', '#072A14', '#14713A', '#EDE8DC', '#C41E3A', '#8CBF9E', '#1B6B4A', '#155A3D', '#0A1628', '#0F2035', '#162A45',
    '#F7F8FA', '#1A1F2E', '#E2E5EB',
  ];
  const POLICES = ['Plus Jakarta Sans', 'Libre Baskerville', 'JetBrains Mono'];
  for (const fichier of [...PAGES, 'assets/tracker.css', 'tracker-vue.js']) {
    const texte = lire(fichier);
    const hauts = texte.toUpperCase();
    for (const hex of PROSCRITES) assert.ok(!hauts.includes(hex), `${fichier} : couleur proscrite ${hex}`);
    for (const police of POLICES) assert.ok(!texte.includes(police), `${fichier} : police périmée ${police}`);
  }
});

test('les couleurs de donnée ne sont déclarées qu’une fois, dans un jeton nommé --tk-', () => {
  // Règle de CLAUDE.md §3 : emerald et compagnie sont de la DONNÉE. Aucune ne doit habiller le chrome
  // ou la mise en page du tracker : chaque occurrence appartient à une déclaration de rôle explicite.
  const css = lire('assets/tracker.css');
  const corps = css.replace(/\/\*[\s\S]*?\*\//g, ''); // les commentaires sont de la prose
  for (const hex of ['#006650', '#C8955A', '#DC2626', '#6b7280', '#DFDCD0', '#9B957A']) {
    const lignes = corps.split('\n').filter((l) => l.includes(hex));
    assert.ok(lignes.length > 0, `${hex} : plus employée, le relevé ne mesure plus rien`);
    for (const ligne of lignes) assert.match(ligne.trim(), /^--tk-[\w-]+:/, `assets/tracker.css : ${hex} hors d’un jeton --tk- → « ${ligne.trim()} »`);
  }
  // Aucune couleur de donnée dans les pages elles-mêmes : elles passent par les classes de la feuille.
  for (const page of PAGES) {
    const html = lire(page);
    for (const hex of ['#006650', '#C8955A', '#DC2626', '#DFDCD0', '#9B957A']) {
      assert.ok(!html.toUpperCase().includes(hex.toUpperCase()), `${page} : couleur de donnée ${hex} écrite dans la page`);
    }
  }
});

test('les deux jetons de donnée incomplète, posés localement, n’ont pas dérivé du fichier de jetons', () => {
  // --surface-incomplete et --rule-incomplete n’existent que sous le régime « instrument » de
  // assets/design-tokens-v2.css ; les pages du tracker sont en « editorial » et les reposent localement,
  // comme briefing.html pose ses jetons de chrome. Même garde-fou que test/pages-header.test.mjs.
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
  // Le sable #C8955A en texte sur blanc plafonne à 2,4:1 (seuil WCAG AA : 4,5:1). Les trois couleurs
  // passent donc en fond, avec un texte noir ou blanc selon le contraste.
  const css = lire('assets/tracker.css');
  for (const couleur of ['vert', 'orange', 'rouge']) {
    const regle = css.match(new RegExp(`\\.tk-fin--${couleur}\\s*\\{([^}]*)\\}`));
    assert.ok(regle, `.tk-fin--${couleur} introuvable`);
    assert.match(regle[1], /background:\s*var\(--tk-fin-/, `.tk-fin--${couleur} : la couleur de donnée doit être le fond`);
    assert.match(regle[1], /color:\s*(#FFFFFF|var\(--text-primary\))/, `.tk-fin--${couleur} : texte noir ou blanc attendu`);
  }
});

test('pas de Markdown brut dans le HTML (CLAUDE.md §9)', () => {
  for (const page of PAGES) {
    const html = lire(page);
    assert.ok(!/\*\*[^*\n]+\*\*/.test(html), `${page} : gras en Markdown`);
    assert.ok(!/^#{1,6} /m.test(html), `${page} : titre en Markdown`);
    assert.ok(!/\[[^\]\n]+\]\([^)\n]+\)/.test(html), `${page} : lien en Markdown`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Le modèle : une valeur sans source ne s'affiche pas
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
// 5. Le schéma : les fichiers du dépôt sont vides et valides
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
  // Un chiffre ne doit apparaître que dans le numéro de version de la méthode.
  for (const [nom, texte] of [['entreprises.json', catalogue], ['_modele.json', gabarit]]) {
    const chiffres = texte.replace(/"methode_version":\s*"1\.3"/, '').match(/\d/g) || [];
    assert.deepEqual(chiffres, [], `${nom} : chiffre hors du numéro de version`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Le validateur refuse ce que la méthode interdit
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
  // Un paramètre affirmé sans source : refusé.
  assert.match(premiereErreur(M.validerCatalogue(entreprise({ ca_these: { valeur: 'Segment' } }))), /ca_these\.source/);
  assert.match(premiereErreur(M.validerCatalogue(entreprise({ indicateur_demande: { type: 'carnet', valeur: 'Carnet' } }))), /indicateur_demande\.source/);
  // Sauf « non publié », qui est l’absence constatée : ni libellé ni source.
  assert.equal(M.validerCatalogue(entreprise({ indicateur_demande: { type: 'non-publie' } })).valide, true);
  // Deux fois le même identifiant : la fiche serait ambiguë.
  const double = entreprise();
  double.entreprises.push({ ...double.entreprises[0] });
  assert.match(premiereErreur(M.validerCatalogue(double)), /en double/);
  // Une version de méthode autre que celle du modèle : refusée, pour que le schéma suive la méthode.
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
  // « Relevée » donne +1 : elle ne peut pas cohabiter avec un D3 stable.
  const desaccord = publication({ statut_prevision: 'relevee' });
  assert.match(premiereErreur(M.validerFichierSociete(desaccord)), /statut_prevision/);
  const accord = publication({ statut_prevision: 'relevee' });
  accord.publications[0].dimensions.d3 = { sens: 'hausse', source: SOURCE };
  assert.equal(M.validerFichierSociete(accord).valide, true);
  // « Manquée » donne −1, comme « abaissée ».
  const manquee = publication({ statut_prevision: 'manquee' });
  manquee.publications[0].dimensions.d3 = { sens: 'baisse', source: SOURCE };
  assert.equal(M.validerFichierSociete(manquee).valide, true);
});

test('une publication : le financement n’est jamais vert par défaut, et une couleur affirmée porte sa source', () => {
  // §7 : « si une mesure manque, la couleur est non déterminée, pas verte ».
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
  // Les cinq drapeaux éditoriaux de §10 se saisissent à la main : ils ne sont pas de ce schéma.
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
// 7. La vue : états vides nommés, aucune donnée par innerHTML
// ─────────────────────────────────────────────────────────────────────────────

test('la vue nomme les quatre états vides exigés', () => {
  const vue = lire('tracker-vue.js');
  for (const etat of ['Aucune société suivie', 'Aucune publication relevée', 'Aucune alerte', 'Aucun événement relevé', 'Aucune société sélectionnée', 'Société inconnue']) {
    assert.ok(vue.includes(etat), `état vide absent : ${etat}`);
  }
  // « non publié » vient du modèle, jamais d’une chaîne écrite en double dans la vue.
  assert.ok(vue.includes("TRACKER_SENS['non-publie'].libelle") || vue.includes("TRACKER_SENS['non-publie'].abrege"), 'le libellé « non publié » doit venir du modèle');
});

test('la vue n’injecte aucune donnée par innerHTML', () => {
  // Les commentaires sont de la prose (la consigne « aucune donnée n'entre par innerHTML » en parle) :
  // retirés avant analyse, comme dans test/pages-header.test.mjs.
  const vue = lire('tracker-vue.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
  assert.deepEqual(vue.match(/innerHTML/g) || [], [], 'innerHTML dans tracker-vue.js');
  // Les deux hôtes se vident par textContent, pas par innerHTML.
  assert.ok(vue.includes("hote.textContent = ''"), 'le conteneur doit se vider par textContent');
});

test('la vue ne réécrit aucune règle de la méthode : elle passe par le modèle', () => {
  const vue = lire('tracker-vue.js');
  for (const appel of ['valeurSourcee', 'sensAffichable', 'sourceValide', 'soldeDe', 'alertesDe', 'etatCatalogue', 'etatFiche', 'etatEvenements', 'validerCatalogue', 'validerFichierSociete']) {
    assert.ok(vue.includes(appel + '('), `tracker-vue.js n’appelle pas ${appel}()`);
    assert.ok(!new RegExp(`function\\s+${appel}\\s*\\(`).test(vue), `tracker-vue.js redéfinit ${appel}`);
  }
  // Aucun seuil de la méthode ne doit être écrit dans la vue (ni ailleurs que dans la méthode).
  for (const seuil of ['1.05', '0.95', '>= +2', '<= -2']) {
    assert.ok(!vue.includes(seuil), `tracker-vue.js porte le seuil ${seuil} : il appartient au moteur, qui n’existe pas`);
  }
});

test('les pages de données chargent le modèle avant la vue', () => {
  for (const page of PAGES_INSTRUMENT) {
    const html = lire(page);
    const modele = html.indexOf('src="tracker-modele.js"');
    const vue = html.indexOf('src="tracker-vue.js"');
    assert.ok(modele !== -1 && vue !== -1, `${page} : scripts du tracker absents`);
    assert.ok(modele < vue, `${page} : tracker-modele.js doit précéder tracker-vue.js`);
  }
  // methode.html est du texte : elle n’a pas besoin de la vue.
  assert.ok(!lire('methode.html').includes('tracker-vue.js'), 'methode.html ne doit pas charger la vue');
});

test('les deux conteneurs attendus par la vue existent dans les pages', () => {
  assert.ok(lire('tracker.html').includes('id="tracker-liste"'), 'tracker.html : conteneur de liste absent');
  assert.ok(lire('entreprise.html').includes('id="tracker-fiche"'), 'entreprise.html : conteneur de fiche absent');
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. methode.html reprend docs/tracker-methode.md, §12 en entier
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
  // Les variantes par archétype font partie des dimensions.
  for (const v of ['D1 · pré-revenus', 'D2 · pré-revenus', 'D2 · à défaut de commandes']) {
    assert.ok(METHODE.includes(v), `variante absente : ${v}`);
  }
  // Le garde-fou et les régimes commandent les alertes : ils doivent y être.
  for (const r of ['vend à perte', 'régime de bascule', 'régime de rechute']) {
    assert.ok(METHODE.includes(r), `règle d’alerte absente : ${r}`);
  }
});

test('methode.html reprend la section 12 en entier, échecs compris', () => {
  // Les dix-sept cas, nommés.
  const CONSTRUCTION = ['Palantir', 'Nvidia', 'Vertiv', 'Tesla', 'Nikola', 'WeWork', 'Cisco'];
  const TEST = ['AppLovin', 'ChargePoint', 'Constellation Energy', 'CrowdStrike', 'Fisker', 'GE Vernova', 'Peloton', 'Plug Power', 'Rocket Lab', 'SunPower'];
  for (const cas of [...CONSTRUCTION, ...TEST]) assert.ok(METHODE.includes(cas), `cas du backtest absent : ${cas}`);

  // Le décompte des alertes.
  for (const chiffre of ['146 publications', '34 alertes', '11 Bascules', '10 Rechutes', '13 Signaux faibles']) {
    assert.ok(METHODE.includes(chiffre), `décompte absent : ${chiffre}`);
  }

  // Les six constats, avec leur chiffre — y compris les deux qui sont des échecs.
  for (const constat of ['5 sur 5', '3 sur 5', '6 sur 10 mesurables', '5 sur 10 mesurables', '6 sur 8 mesurables', '90 % des sens']) {
    assert.ok(METHODE.includes(constat), `constat absent : ${constat}`);
  }
  assert.ok(METHODE.includes('4 sur 5 si le garde-fou est lu à la lettre de la v1.2'), 'la lecture alternative du garde-fou (Fisker) doit figurer');

  // Les quatre enseignements, dont les limites.
  for (const lecon of [
    'La Bascule ne trie pas les gagnants',
    'La Rechute est le signal le plus fiable',
    'Deux des trois règles ajoutées en v1.2 n’ont rien montré',
    'Les limites',
  ]) assert.ok(METHODE.includes(lecon), `enseignement absent : ${lecon}`);

  // Le détail des limites, sans adoucissement.
  for (const limite of [
    'dressée de mémoire, en connaissant le sort des sociétés',
    'La prévision se lit à la main',
    'Les cours de Fisker et de SunPower manquent',
    'Les verdicts de GE Vernova et de Rocket Lab sont provisoires',
  ]) assert.ok(METHODE.includes(limite), `limite absente : ${limite}`);

  // Les deux Bascules retenues chez Plug Power, et leurs deux suites opposées.
  assert.ok(METHODE.includes('296 points de mieux') && METHODE.includes('102 points de moins'), 'les deux suites du garde-fou doivent figurer');
  assert.ok(METHODE.includes('Les engagements nets n’ont changé aucune couleur'), 'règle v1.2 sans effet absente');
  assert.ok(METHODE.includes('La première prévision de bénéfice net ne s’est jamais déclenchée'), 'règle v1.2 jamais déclenchée absente');

  // Ce que le site peut écrire, et ce qu'il ne peut pas.
  assert.ok(METHODE.includes('Ce que le site peut écrire') && METHODE.includes('Ce qu’il ne peut pas écrire'), 'les deux encadrés de §12 sont exigés');
  assert.ok(METHODE.includes('Qu’une Bascule annonce une réussite, ni aucune promesse de performance'), 'l’interdit de §12 doit être écrit');
});

test('methode.html dit ce que la méthode ne fait pas', () => {
  assert.ok(METHODE.includes('ni cours de Bourse, ni presse, ni note d’analyste'), 'les sources exclues doivent être dites');
  // La température du récit n'est pas de la v1.3 : la page doit le dire plutôt que l'afficher.
  assert.ok(METHODE.includes('température du récit') && METHODE.includes('ne fait pas partie de la v1.3'), 'le statut de la température du récit doit être dit');
  // Le score et la phase de §9 ne sont pas affichés sur les fiches.
  assert.ok(METHODE.includes('Elles ne sont pas affichées sur les fiches'), 'le sort du score de §9 doit être dit');
  assert.ok(!lire('entreprise.html').includes('Phase') && !lire('entreprise.html').includes('Score'), 'la fiche ne doit porter ni score ni phase');
  assert.ok(!lire('tracker-vue.js').includes('phase') && !lire('tracker-vue.js').includes('score'), 'la vue ne doit calculer ni score ni phase');
});
