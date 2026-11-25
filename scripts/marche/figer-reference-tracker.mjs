// Fige les soldes et alertes du tracker dans test/fixtures/marche/tracker-reference.json.
// Sert de témoin au test d'étanchéité (test/marche-etancheite.test.mjs) : la couche « lecture de
// marché » ne doit changer aucune de ces lignes. À ne relancer que si le TRACKER lui-même a été
// corrigé (script de collecte du tracker), jamais pour faire passer un test de la couche marché.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const racine = new URL('../../', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, racine), 'utf8');

const M = vm.createContext({});
vm.runInContext(lire('tracker-modele.js'), M);

const catalogue = JSON.parse(lire('data/tracker/entreprises.json'));
const reference = {};
for (const e of catalogue.entreprises) {
  const fichier = JSON.parse(lire(e.fichier));
  const serie = JSON.parse(JSON.stringify(M.moteurDepuisFichier(e, fichier)));
  reference[e.id] = serie.map((r) => ({ date: r.date, solde: r.solde, alertes: r.alertes, regime: r.regime }));
}
writeFileSync(new URL('test/fixtures/marche/tracker-reference.json', racine), JSON.stringify(reference, null, 2) + '\n');
console.log('Référence figée :', Object.entries(reference).map(([id, s]) => `${id} ${s.length}`).join(' · '));
