import vm from 'node:vm'; import fs from 'node:fs';
const id = process.argv[2];
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('tracker-modele.js', 'utf8'), ctx);
const f = JSON.parse(fs.readFileSync(`data/rejeu-spatial/${id}.json`, 'utf8'));
const idx = JSON.parse(fs.readFileSync('data/rejeu-spatial/index.json', 'utf8'));
const ent = idx.societes.find((s) => s.id === id);
const S = { hausse: '+1', stable: ' 0', baisse: '-1', 'non-publie': 'np' };
const r = Array.from(ctx.moteurDepuisFichier(ent, f));
console.log(`\n${ent.nom} — ${ent.archetype}`);
console.log('date        trimestre  D1 D2 D3 D4  solde  marge brute      prévision    alertes / régime');
f.publications.forEach((p, i) => {
  const d = p.dimensions, x = r[i];
  console.log([p.date, p.trimestre.padEnd(9), S[d.d1.sens], S[d.d2.sens], S[d.d3.sens], S[d.d4.sens],
    String(x.solde).padStart(5), p.marge_brute.etat.padEnd(16), p.statut_prevision.padEnd(12),
    (x.alertes.join(',') || '—') + (x.regime !== 'aucun' ? `  [${x.regime}]` : '')].join(' '));
});
const e = Array.from(ctx.validerFichierSociete(f));
console.log('validation :', e.join(' | ') || 'valide');
