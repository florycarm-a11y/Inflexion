// Moteur de règles de la couche « lecture de marché » (lecture-marche-modele.js).
// Chaque ligne de la grille de départ a son test ; les garde-fous aussi (n/d, fraîcheur, Signal
// faible jamais promu, aucune consigne d'achat ou de vente). Aucune dépendance : node:vm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const lire = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const M = vm.createContext({});
vm.runInContext(lire('lecture-marche-config.js'), M);
vm.runInContext(lire('lecture-marche-modele.js'), M);
const brut = (v) => JSON.parse(JSON.stringify(v));
const config = () => brut(M.MARCHE_CONFIG);

const AUJ = '2026-11-25';
const d = (valeur, date = '2026-11-20') => ({ valeur, source: { nom: 'Essai', url: 'https://exemple.test/' }, date });
const nd = (motif = 'essai') => ({ valeur: null, motif });

/** Un jeu de données neutre : rien d'élevé, rien de bas, tout frais. Chaque test n'en change qu'un trait. */
const neutre = () => ({
  flux: { position_courte: d(7e6), position_precedente: d(7e6, '2026-11-05'), jours_couverture: d(5), actions_en_circulation: d(100e6) },
  attentes: { avis: d({ achat: 7, conserver: 3, vente: 0 }, '2026-11-01'), avis_reference: d({ achat: 7, conserver: 3, vente: 0 }, '2026-08-01'),
    objectifs: d({ bas: 40, moyen: 50, haut: 60 }, '2026-11-01'), bpa_trimestre: d({ exercice: 'Dec 2026', consensus: 0.1, bas: 0.05, haut: 0.15, estimations: 6 }),
    publie_vs_consensus: nd() },
  valorisation: { capitalisation: d(10e9), ca_12_mois: d(1e9, '2026-09-30'), cours: d(100), cours_6_mois: d(90, '2026-05-25'), cours_12_mois: d(80, '2025-11-25') },
});
const lecture = (code, donnees, options = {}) => brut(M.lectureMarche({
  alerte: code ? { code, date: '2026-11-09', trimestre: 'T3 2026', solde: 2, publicationsDepuis: 0 } : null,
  societe: { archetype: options.archetype || 'industriel' }, donnees, config: options.config || config(), aujourdhui: options.aujourdhui || AUJ,
}));

// ── Données : source, date, fraîcheur ─────────────────────────────────────────

test('une donnée sans source ou sans date vaut n/d, jamais une valeur nue', () => {
  assert.equal(M.marcheDonnee({ valeur: 12, date: AUJ }, 30, AUJ).etat, 'nd');
  assert.equal(M.marcheDonnee({ valeur: 12, source: { nom: 'X', url: 'https://x.test' } }, 30, AUJ).etat, 'nd');
  assert.equal(M.marcheDonnee(nd('pas publié'), 30, AUJ).motif, 'pas publié');
  assert.equal(M.marcheDonnee(undefined, 30, AUJ).etat, 'nd');
});

test('une donnée plus vieille que son âge maximal est périmée ; à la limite, elle est fraîche', () => {
  assert.equal(M.marcheDonnee(d(1, '2026-10-26'), 30, AUJ).etat, 'ok');      // 30 jours
  assert.equal(M.marcheDonnee(d(1, '2026-10-25'), 30, AUJ).etat, 'perimee'); // 31 jours
  assert.equal(M.marcheDonnee(d(1, '2020-01-01'), null, AUJ).etat, 'ok');    // âge maximal nul : ne se périme pas
});

test('zéro est une valeur, pas une absence : un short interest nul reste affiché', () => {
  assert.equal(M.marcheDonnee(d(0), 30, AUJ).etat, 'ok');
});

// ── La grille, ligne par ligne ────────────────────────────────────────────────

test('Bascule + valorisation raisonnable, consensus prudent, short interest bas → Asymétrie favorable', () => {
  const x = neutre();
  x.valorisation.capitalisation = d(6e9);                               // P/S 6
  x.attentes.avis = d({ achat: 5, conserver: 5, vente: 0 }, '2026-11-01'); // 50 % acheteurs
  x.attentes.avis_reference = d({ achat: 5, conserver: 5, vente: 0 }, '2026-08-01');
  x.flux.position_courte = d(3e6); x.flux.position_precedente = d(3e6, '2026-11-05'); x.flux.jours_couverture = d(2);
  const r = lecture('bascule', x);
  assert.equal(r.etiquette.code, 'asymetrie-favorable');
  assert.ok(r.raisons.some((t) => t.includes('P/S 6,0x')) && r.raisons.some((t) => t.includes('SI 3,0 %')), 'les raisons citent les chiffres');
});

test('Asymétrie favorable : la faible couverture vaut le consensus prudent, le short en baisse vaut le short bas', () => {
  const x = neutre();
  x.valorisation.capitalisation = d(6e9);
  x.attentes.avis = d({ achat: 4, conserver: 0, vente: 0 }, '2026-11-01'); // 4 analystes, 100 % acheteurs
  x.attentes.avis_reference = d({ achat: 4, conserver: 0, vente: 0 }, '2026-08-01');
  x.flux.position_precedente = d(8e6, '2026-11-05');                      // −12,5 % : en baisse
  assert.equal(lecture('bascule', x).etiquette.code, 'asymetrie-favorable');
});

test('Bascule + beat net sur un consensus daté d’avant la publication → Confirmation', () => {
  const x = neutre();
  x.attentes.publie_vs_consensus = d({ grandeur: 'BPA', publie: 0.12, consensus: 0.10, date_consensus: '2026-11-02', date_publication: '2026-11-09' });
  const r = lecture('bascule', x);
  assert.equal(r.etiquette.code, 'confirmation');
  assert.equal(r.modules.attentes.signaux.surprise, 'beat');
});

test('un consensus daté du jour de la publication ou après ne compte pas : pas de Confirmation', () => {
  for (const date_consensus of ['2026-11-09', '2026-11-12']) {
    const x = neutre();
    x.attentes.publie_vs_consensus = d({ grandeur: 'BPA', publie: 0.12, consensus: 0.10, date_consensus, date_publication: '2026-11-09' });
    const r = lecture('bascule', x);
    assert.equal(r.modules.attentes.signaux.surprise, null);
    assert.notEqual(r.etiquette.code, 'confirmation');
  }
});

test('Bascule + short interest élevé et en hausse → Contesté, sans trancher', () => {
  const x = neutre();
  x.flux.position_courte = d(15e6); x.flux.position_precedente = d(12e6, '2026-11-05');
  const r = lecture('bascule', x);
  assert.equal(r.etiquette.code, 'conteste');
  assert.match(r.note, /ne tranche pas/);
});

test('un short interest élevé mais stable ne suffit pas à « Contesté »', () => {
  const x = neutre();
  x.flux.position_courte = d(15e6); x.flux.position_precedente = d(15e6, '2026-11-05');
  assert.notEqual(lecture('bascule', x).etiquette.code, 'conteste');
});

test('Bascule + consensus très haussier, multiple élevé, forte hausse → Déjà dans le cours ?', () => {
  const x = neutre();
  x.attentes.avis = d({ achat: 9, conserver: 1, vente: 0 }, '2026-11-01');
  x.attentes.avis_reference = d({ achat: 9, conserver: 1, vente: 0 }, '2026-08-01');
  x.valorisation.capitalisation = d(20e9);
  x.valorisation.cours_6_mois = d(60, '2026-05-25'); // +67 %
  assert.equal(lecture('bascule', x).etiquette.code, 'deja-dans-le-cours');
});

test('« Déjà dans le cours ? » exige les trois constats ; le nombre requis se règle en configuration', () => {
  const x = neutre();
  x.attentes.avis = d({ achat: 9, conserver: 1, vente: 0 }, '2026-11-01');
  x.attentes.avis_reference = d({ achat: 9, conserver: 1, vente: 0 }, '2026-08-01');
  x.valorisation.capitalisation = d(20e9);
  x.valorisation.cours_6_mois = d(300, '2026-05-25'); // −67 % : deux constats sur trois, le titre a chuté
  assert.notEqual(lecture('bascule', x).etiquette.code, 'deja-dans-le-cours');
  const souple = config(); souple.grille.dejaDansLeCoursMinSignaux = 2;
  assert.equal(lecture('bascule', x, { config: souple }).etiquette.code, 'deja-dans-le-cours');
});

test('« Déjà dans le cours ? » en pré-revenus : le multiple sans objet ne compte ni pour ni contre', () => {
  const x = neutre();
  x.attentes.avis = d({ achat: 9, conserver: 1, vente: 0 }, '2026-11-01');
  x.attentes.avis_reference = d({ achat: 9, conserver: 1, vente: 0 }, '2026-08-01');
  x.valorisation.cours_6_mois = d(60, '2026-05-25');
  assert.equal(lecture('bascule-commerciale', x, { archetype: 'pre-revenus' }).etiquette.code, 'deja-dans-le-cours');
  x.valorisation.cours_6_mois = d(95, '2026-05-25');
  assert.notEqual(lecture('bascule-commerciale', x, { archetype: 'pre-revenus' }).etiquette.code, 'deja-dans-le-cours');
});

test('une alerte ancienne est signalée comme telle, sans changer l’étiquette', () => {
  const entree = (depuis) => ({ alerte: { code: 'bascule', date: '2025-08-07', trimestre: 'T2 2025', solde: 2, publicationsDepuis: depuis },
    societe: { archetype: 'industriel' }, donnees: neutre(), config: config(), aujourdhui: AUJ });
  const recente = M.lectureMarche(entree(0)), ancienne = M.lectureMarche(entree(5));
  assert.equal(recente.anciennete, null);
  assert.match(ancienne.anciennete, /il y a 5 publications/);
  assert.equal(ancienne.etiquette.code, recente.etiquette.code);
});

test('une Bascule commerciale se lit sur la ligne « Bascule » de la grille', () => {
  const x = neutre();
  x.flux.position_courte = d(15e6); x.flux.position_precedente = d(12e6, '2026-11-05');
  assert.equal(lecture('bascule-commerciale', x).etiquette.code, 'conteste');
});

test('Rechute + short interest en hausse → Pression renforcée', () => {
  const x = neutre();
  x.flux.position_precedente = d(6e6, '2026-11-05');
  assert.equal(lecture('rechute', x).etiquette.code, 'pression-renforcee');
});

test('Rechute + part d’avis acheteurs en recul → Pression renforcée', () => {
  const x = neutre();
  x.attentes.avis_reference = d({ achat: 9, conserver: 1, vente: 0 }, '2026-08-01'); // 90 % → 70 %
  assert.equal(lecture('rechute', x).etiquette.code, 'pression-renforcee');
});

test('Rechute + consensus encore très haussier → Risque de révisions', () => {
  const x = neutre();
  x.attentes.avis = d({ achat: 9, conserver: 1, vente: 0 }, '2026-11-01');
  x.attentes.avis_reference = d({ achat: 9, conserver: 1, vente: 0 }, '2026-08-01');
  assert.equal(lecture('rechute', x).etiquette.code, 'risque-de-revisions');
});

test('Signal faible → À surveiller, quelle que soit la lecture', () => {
  const favorable = neutre();
  favorable.valorisation.capitalisation = d(6e9);
  favorable.attentes.avis = d({ achat: 2, conserver: 2, vente: 0 }, '2026-11-01');
  favorable.flux.position_courte = d(1e6); favorable.flux.jours_couverture = d(1);
  for (const x of [neutre(), favorable, { flux: {}, attentes: {}, valorisation: {} }, null]) {
    const r = lecture('signal-faible', x);
    assert.equal(r.etiquette.code, 'a-surveiller');
    assert.match(r.note, /jamais un Signal faible en conviction/);
  }
});

test('Toute alerte + donnée manquante → Lecture incomplète, avec ce qui manque', () => {
  for (const code of ['bascule', 'bascule-commerciale', 'rechute']) {
    const x = neutre();
    x.flux.position_courte = nd('aucun relevé FINRA');
    const r = lecture(code, x);
    assert.equal(r.etiquette.code, 'lecture-incomplete');
    assert.ok(r.raisons.some((t) => t.includes('short interest n/d')));
  }
});

test('Toute alerte + donnée trop ancienne → Lecture incomplète, et la donnée est dite périmée', () => {
  const x = neutre();
  x.attentes.avis = d({ achat: 9, conserver: 1, vente: 0 }, '2026-07-01');
  const r = lecture('rechute', x);
  assert.equal(r.etiquette.code, 'lecture-incomplete');
  assert.ok(r.raisons.some((t) => t.includes('périmé (2026-07-01)')));
  assert.equal(r.modules.attentes.mesures.find((m) => m.cle === 'avis').etat, 'perimee');
});

test('le temps seul périme une lecture : même instantané, lu deux mois plus tard', () => {
  const x = neutre();
  x.flux.position_precedente = d(6e6, '2026-11-05');
  assert.equal(lecture('rechute', x).etiquette.code, 'pression-renforcee');
  assert.equal(lecture('rechute', x, { aujourdhui: '2027-01-25' }).etiquette.code, 'lecture-incomplete');
});

test('aucune alerte du tracker → Sans alerte, aucun croisement tenté', () => {
  const r = lecture(null, neutre());
  assert.equal(r.etiquette.code, 'sans-alerte');
  assert.ok(r.modules.flux.resume.length > 0, 'les données restent lues pour l’affichage');
});

test('alerte lue, aucun croisement vrai → Sans lecture tranchée', () => {
  assert.equal(lecture('bascule', neutre()).etiquette.code, 'sans-lecture-tranchee');
  assert.equal(lecture('rechute', neutre()).etiquette.code, 'sans-lecture-tranchee');
});

// ── Cas particuliers ──────────────────────────────────────────────────────────

test('pré-revenus : le multiple est sans objet, et son absence ne rend pas la lecture incomplète', () => {
  const x = neutre();
  x.valorisation.ca_12_mois = nd('chiffre d’affaires non balisé');
  const r = lecture('bascule-commerciale', x, { archetype: 'pre-revenus' });
  assert.equal(r.modules.valorisation.signaux.multiple, 'sans-objet');
  assert.notEqual(r.etiquette.code, 'lecture-incomplete');
  assert.equal(lecture('bascule', x).etiquette.code, 'lecture-incomplete', 'hors pré-revenus, le même trou suspend la lecture');
});

test('sans actions en circulation, le % est n/d mais les jours de couverture portent le niveau', () => {
  const x = neutre();
  x.flux.actions_en_circulation = nd('plusieurs classes d’actions');
  x.flux.jours_couverture = d(9);
  const flux = lecture('bascule', x).modules.flux;
  assert.equal(flux.mesures.find((m) => m.cle === 'pct').texte, 'n/d');
  assert.equal(flux.signaux.niveau, 'eleve');
});

test('aucun analyste : couverture faible constatée, consensus n/d (pas « 0 % d’acheteurs »)', () => {
  const x = neutre();
  x.attentes.avis = d({ achat: 0, conserver: 0, vente: 0 }, '2026-11-01');
  const s = lecture('bascule', x).modules.attentes.signaux;
  assert.equal(s.couvertureFaible, true);
  assert.equal(s.consensus, null);
});

test('les seuils viennent de la configuration : la logique n’en répète aucun', () => {
  const x = neutre(); // SI 7 %, 5 j : intermédiaire avec les seuils de départ
  x.flux.position_precedente = d(6e6, '2026-11-05');
  assert.equal(lecture('bascule', x).modules.flux.signaux.niveau, 'intermediaire');
  const strict = config(); strict.flux.pctEleve = 6;
  assert.equal(lecture('bascule', x, { config: strict }).etiquette.code, 'conteste');
  // Le modèle lit les seuils de lecture ; le collecteur lit ceux qui règlent la collecte (toleranceSeance).
  const code = (lire('lecture-marche-modele.js') + lire('scripts/marche/sources.mjs')).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for (const seuil of Object.keys(config().flux).concat(Object.keys(config().valorisation))) {
    assert.ok(code.includes('.' + seuil), `seuil de configuration jamais lu par la logique : ${seuil}`);
  }
});

// ── Alerte de référence ───────────────────────────────────────────────────────

test('alerte de référence : la dernière alerte émise, lue dans la sortie du moteur', () => {
  const serie = [
    { date: '2025-05-01', solde: 2, alertes: ['bascule'] },
    { date: '2025-08-01', solde: -2, alertes: ['rechute'] },
    { date: '2025-11-01', solde: 0, alertes: ['signal-faible'] },
    { date: '2026-02-01', solde: 1, alertes: [] },
  ];
  const pubs = serie.map((s, i) => ({ date: s.date, trimestre: 'T' + (i + 1) }));
  const a = brut(M.marcheAlerteDeReference(serie, pubs, config()));
  assert.deepEqual(a, { code: 'signal-faible', date: '2025-11-01', trimestre: 'T3', solde: 0, publicationsDepuis: 1 });
  assert.equal(M.marcheAlerteDeReference([{ date: '2026-01-01', solde: 0, alertes: [] }], [{}], config()), null);
  const double = [{ date: '2026-05-01', solde: 2, alertes: ['bascule-commerciale', 'bascule'] }];
  assert.equal(M.marcheAlerteDeReference(double, [{ trimestre: 'T1' }], config()).code, 'bascule');
});

// ── Garde-fous éditoriaux ─────────────────────────────────────────────────────

test('étiquettes descriptives : aucune consigne d’achat ou de vente', () => {
  const interdits = /achet|vend|acheter|vendre|renforcer|alléger|buy|sell/i;
  for (const [code, e] of Object.entries(brut(M.MARCHE_ETIQUETTES))) {
    assert.ok(!interdits.test(e.libelle), `étiquette prescriptive : ${code} (${e.libelle})`);
  }
  assert.ok(M.MARCHE_ETIQUETTES['deja-dans-le-cours'].libelle.endsWith('?'), '« Déjà dans le cours ? » reste une question');
});

test('chaque règle de la grille rend une étiquette connue et cite au moins un module', () => {
  for (const r of M.MARCHE_REGLES) {
    assert.ok(M.MARCHE_ETIQUETTES[r.etiquette], `étiquette inconnue : ${r.etiquette}`);
    assert.ok(['bascule', 'rechute'].includes(r.famille) && r.modules.length > 0);
  }
});

test('le contexte de marché a son emplacement, sans lecture en V1', () => {
  const contexte = M.MARCHE_MODULES.find((m) => m.cle === 'contexte');
  assert.ok(contexte && contexte.lire === null);
  assert.ok(!('contexte' in lecture('bascule', neutre()).modules));
});
