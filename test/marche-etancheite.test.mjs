// NON-RÉGRESSION ET ÉTANCHÉITÉ — la couche « lecture de marché » ne change rien au tracker.
//
// Le flux de données est à sens unique : la couche marché LIT les alertes du tracker ; elle ne
// modifie ni le solde, ni les alertes, ni leurs fichiers. Ce fichier le prouve de cinq façons :
//   1. les soldes et alertes d'aujourd'hui sont ceux figés AVANT l'ajout de la couche marché ;
//   2. charger et exécuter la couche marché ne touche à aucune globale du tracker ;
//   3. dérouler la lecture sur tout le catalogue laisse la sortie du moteur identique ;
//   4. une collecte complète n'écrit que dans data/marche/ ;
//   5. le code du tracker ignore jusqu'à l'existence de la couche marché.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, mkdirSync, cpSync, rmSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { collecter, ecrire } from '../scripts/marche/collecte.mjs';

const RACINE = new URL('../', import.meta.url);
const lire = (f) => readFileSync(new URL(f, RACINE), 'utf8');
const json = (f) => JSON.parse(lire(f));
const brut = (v) => JSON.parse(JSON.stringify(v));

const catalogue = json('data/tracker/entreprises.json');
const fichiers = Object.fromEntries(catalogue.entreprises.map((e) => [e.id, json(e.fichier)]));
const trier = (f) => f.publications.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

/** Sortie du moteur du tracker sur tout le catalogue, dans le contexte donné. */
const moteurSurCatalogue = (contexte) => Object.fromEntries(catalogue.entreprises.map((e) => [
  e.id, brut(contexte.moteurDepuisFichier(e, fichiers[e.id])).map((r) => ({ date: r.date, solde: r.solde, alertes: r.alertes, regime: r.regime })),
]));

const trackerSeul = () => { const c = vm.createContext({}); vm.runInContext(lire('tracker-modele.js'), c); return c; };
const trackerEtMarche = () => {
  const c = trackerSeul();
  vm.runInContext(lire('lecture-marche-config.js'), c);
  vm.runInContext(lire('lecture-marche-modele.js'), c);
  return c;
};

// ── 1. Référence figée avant le travail ───────────────────────────────────────

test('soldes et alertes du tracker identiques à la référence figée avant la couche marché', () => {
  const reference = json('test/fixtures/marche/tracker-reference.json');
  const actuel = moteurSurCatalogue(trackerSeul());
  assert.ok(Object.keys(reference).length >= 7, 'la référence couvre les sept sociétés du 25 novembre 2026');
  let lignes = 0;
  for (const [id, serie] of Object.entries(reference)) {
    assert.ok(actuel[id], `société disparue du tracker : ${id}`);
    for (const attendu of serie) {
      // Comparaison par date de publication : une publication AJOUTÉE plus tard ne casse rien,
      // une ligne passée qui CHANGE casse tout.
      assert.deepEqual(actuel[id].find((r) => r.date === attendu.date), attendu, `${id} · ${attendu.date}`);
      lignes++;
    }
  }
  assert.ok(lignes >= 35, `35 publications figées attendues, ${lignes} comparées`);
});

// ── 2. Aucune globale du tracker touchée ──────────────────────────────────────

test('charger la couche marché ne redéfinit ni ne modifie aucune globale du tracker', () => {
  const seul = trackerSeul();
  const noms = Object.keys(seul);
  const empreinte = (c) => Object.fromEntries(noms.map((n) => [n, typeof c[n] === 'function' ? c[n].toString() : JSON.stringify(c[n])]));
  const avant = empreinte(seul);
  const ensemble = trackerEtMarche();
  assert.deepEqual(empreinte(ensemble), avant);
  const ajoutees = Object.keys(ensemble).filter((n) => !noms.includes(n));
  assert.ok(ajoutees.length > 0 && ajoutees.every((n) => /^(MARCHE_|marche|lectureMarche$)/.test(n)),
    'la couche marché ne pose que des globales à son nom : ' + ajoutees.join(', '));
});

// ── 3. Le moteur rend la même chose avant, pendant et après la lecture ────────

test('dérouler la lecture de marché sur tout le catalogue laisse soldes et alertes identiques', () => {
  const C = trackerEtMarche();
  const instantane = json('data/marche/instantane.json');
  const avant = moteurSurCatalogue(C);
  const fichiersAvant = JSON.stringify(fichiers), catalogueAvant = JSON.stringify(catalogue);

  let lectures = 0;
  for (const e of catalogue.entreprises) {
    const serie = C.moteurDepuisFichier(e, fichiers[e.id]);
    const serieAvant = JSON.stringify(serie);
    const alerte = C.marcheAlerteDeReference(serie, trier(fichiers[e.id]), C.MARCHE_CONFIG);
    const lecture = C.lectureMarche({ alerte, societe: e, donnees: instantane.societes[e.id], config: C.MARCHE_CONFIG, aujourdhui: instantane.collecte });
    assert.ok(C.MARCHE_ETIQUETTES[lecture.etiquette.code], `${e.id} : étiquette inconnue`);
    assert.ok(lecture.raisons.length > 0, `${e.id} : une étiquette affiche toujours ses raisons`);
    assert.equal(JSON.stringify(serie), serieAvant, `${e.id} : la sortie du moteur a été modifiée par la lecture`);
    lectures++;
  }
  assert.equal(lectures, catalogue.entreprises.length);
  assert.deepEqual(moteurSurCatalogue(C), avant);
  assert.deepEqual(moteurSurCatalogue(trackerSeul()), avant, 'avec ou sans couche marché chargée : même moteur, même sortie');
  assert.equal(JSON.stringify(fichiers), fichiersAvant, 'les fiches du tracker n’ont pas été modifiées en mémoire');
  assert.equal(JSON.stringify(catalogue), catalogueAvant);
});

// ── 4. La collecte n'écrit que dans data/marche/ ──────────────────────────────

const empreinteDossier = (dossier) => {
  const sortie = {};
  const parcourir = (d, prefixe) => {
    for (const nom of readdirSync(d).sort()) {
      const chemin = join(d, nom);
      if (statSync(chemin).isDirectory()) parcourir(chemin, prefixe + nom + '/');
      else sortie[prefixe + nom] = createHash('sha256').update(readFileSync(chemin)).digest('hex');
    }
  };
  parcourir(dossier, '');
  return sortie;
};

test('une collecte complète, écriture comprise, laisse data/tracker/ intact à l’octet près', async () => {
  const bac = mkdtempSync(join(tmpdir(), 'marche-etancheite-'));
  try {
    mkdirSync(join(bac, 'data/marche'), { recursive: true });
    cpSync(new URL('data/tracker', RACINE), join(bac, 'data/tracker'), { recursive: true });
    for (const f of ['societes.json', 'saisie-manuelle.json']) cpSync(new URL('data/marche/' + f, RACINE), join(bac, 'data/marche', f));
    const racine = pathToFileURL(bac + '/');
    const avant = empreinteDossier(join(bac, 'data/tracker'));

    const fixture = (n) => json('test/fixtures/marche/' + n);
    const requete = async (url) => {
      if (url.includes('finra')) return fixture('finra-rklb.json');
      if (url.includes('targetprice')) return fixture('nasdaq-rklb-targetprice.json');
      if (url.includes('earnings-forecast')) return fixture('nasdaq-rklb-earnings-forecast.json');
      if (url.includes('historical')) return fixture('nasdaq-rklb-historical.json');
      if (url.includes('summary')) return fixture('nasdaq-rklb-summary.json');
      if (url.includes('SharesOutstanding')) return fixture('sec-rklb-actions.json');
      return fixture('sec-rklb-chiffre-affaires.json');
    };
    const instantane = await collecter({ aujourdhui: '2026-11-25', requete, racine, journal: () => {}, rythme: 0 });
    ecrire(instantane, racine);

    assert.deepEqual(empreinteDossier(join(bac, 'data/tracker')), avant, 'data/tracker/ a changé pendant la collecte');
    assert.deepEqual(Object.keys(empreinteDossier(join(bac, 'data'))).filter((f) => !f.startsWith('tracker/')).sort(),
      ['marche/historique/2026-11-25.json', 'marche/historique/index.json', 'marche/instantane.json', 'marche/saisie-manuelle.json', 'marche/societes.json']);
    assert.deepEqual(Object.keys(instantane.societes), catalogue.entreprises.map((e) => e.id), 'une entrée par société du tracker, ni plus ni moins');
  } finally { rmSync(bac, { recursive: true, force: true }); }
});

// ── 5. Sens unique, lu dans le code ───────────────────────────────────────────

test('le tracker ignore la couche marché : aucun de ses fichiers ne la charge ni ne la lit', () => {
  for (const f of ['tracker-modele.js', 'tracker-vue.js', 'entreprise.html', 'index.html', 'scripts/tracker-collecte-2026-11-21.mjs', 'scripts/lib/tracker-sens.mjs']) {
    const texte = lire(f);
    for (const trace of ['lecture-marche', 'data/marche', 'MARCHE_', 'lectureMarche']) {
      assert.ok(!texte.includes(trace), `${f} mentionne « ${trace} » : le flux doit rester à sens unique`);
    }
  }
});

test('la couche marché n’écrit que dans data/marche/, et un seul fichier écrit', () => {
  const sources = ['lecture-marche-config.js', 'lecture-marche-modele.js', 'lecture-marche-vue.js', 'scripts/marche/sources.mjs', 'scripts/marche/collecte.mjs'];
  const ecrivains = sources.filter((f) => /writeFileSync|appendFileSync|rmSync|unlinkSync|renameSync/.test(lire(f)));
  assert.deepEqual(ecrivains, ['scripts/marche/collecte.mjs']);
  const collecte = lire('scripts/marche/collecte.mjs');
  // Tous les chemins de données cités par le collecteur, commentaires exclus.
  const code = collecte.replace(/^\s*\/\/.*$/gm, '');
  const chemins = [...code.matchAll(/'(data\/[^']*)'/g)].map((m) => m[1]);
  const horsTracker = chemins.filter((c) => !c.startsWith('data/tracker/'));
  assert.ok(horsTracker.length > 0 && horsTracker.every((c) => c.startsWith('data/marche/')), 'chemins hors data/marche : ' + horsTracker.join(', '));
  // Le tracker est LU deux fois : son catalogue, et la fiche d'une société (date de sa dernière publication).
  assert.deepEqual(chemins.filter((c) => c.startsWith('data/tracker/')), ['data/tracker/', 'data/tracker/entreprises.json']);
  assert.ok(!/writeFileSync\([^)]*tracker/.test(code) && /lireJSON\('data\/tracker\/entreprises\.json'/.test(code) && /lireJSON\('data\/tracker\/' \+ id/.test(code));
  for (const m of code.matchAll(/writeFileSync\(new URL\('([^']*)'/g)) assert.ok(m[1].startsWith('data/marche/'), 'écriture hors data/marche : ' + m[1]);
});

// ── L'instantané publié tient les garde-fous ──────────────────────────────────

test('instantané : chaque valeur porte sa source et sa date ; chaque absence porte son motif', () => {
  const instantane = json('data/marche/instantane.json');
  assert.match(instantane.collecte, /^\d{4}-\d{2}-\d{2}$/);
  let valeurs = 0, absences = 0;
  for (const [id, societe] of Object.entries(instantane.societes)) {
    for (const module of ['flux', 'attentes', 'valorisation']) {
      for (const [champ, d] of Object.entries(societe[module])) {
        const ou = `${id}.${module}.${champ}`;
        if (d.valeur === null) { assert.ok(typeof d.motif === 'string' && d.motif, `${ou} : absence sans motif`); absences++; continue; }
        assert.ok(d.source && d.source.nom && /^https:\/\//.test(d.source.url), `${ou} : valeur sans source`);
        assert.match(d.date, /^\d{4}-\d{2}-\d{2}$/, `${ou} : valeur sans date`);
        assert.ok(d.date <= instantane.collecte, `${ou} : donnée datée après la collecte`);
        valeurs++;
      }
    }
  }
  assert.ok(valeurs > 0 && absences > 0);
});

test('instantané : aucune étiquette, aucun solde, aucune alerte stockés — tout se calcule à l’affichage', () => {
  const texte = lire('data/marche/instantane.json');
  for (const cle of ['"etiquette"', '"lecture"', '"solde"', '"alertes"', '"alerte"', '"regime"', '"score"']) {
    assert.ok(!texte.includes(cle), `clé interdite dans l’instantané : ${cle}`);
  }
  const index = json('data/marche/historique/index.json');
  assert.ok(index.instantanes.includes(json('data/marche/instantane.json').collecte), 'chaque collecte est historisée');
});
