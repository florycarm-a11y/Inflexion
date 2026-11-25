/**
 * sonde.mjs — Relevé mécanique d'une société, pour le rejeu de l'univers spatial.
 *
 * Usage : node sonde.mjs <CIK> [depuis]
 *
 * Ne décide rien : donne à lire ce que les dépôts portent, groupé PAR DÉPÔT (précision 8),
 * pour que chaque ligne du rejeu lise son propre document. Aucun appel de modèle.
 */
import https from 'node:https';

const CIK = String(process.argv[2]).padStart(10, '0');
const DEPUIS = process.argv[3] || '2024-02-01';
// La SEC demande aux clients automatisés de s'identifier. Le contact ne s'écrit PAS dans le dépôt :
// il se donne par la variable d'environnement SEC_USER_AGENT, que chacun règle pour soi.
const UA = process.env.SEC_USER_AGENT || 'lecteur-depots/1.0';

const get = (url, brut = false) => new Promise((res, rej) => {
  https.get(url, { headers: { 'User-Agent': UA } }, (r) => {
    if (r.statusCode === 301 || r.statusCode === 302) return get(r.headers.location, brut).then(res, rej);
    let s = '';
    r.on('data', (d) => { s += d; });
    r.on('end', () => { if (brut) return res(r.statusCode === 200 ? s : ''); try { res(JSON.parse(s)); } catch { res(null); } });
  }).on('error', rej);
});

const TAGS = [
  ['ca', 'Revenues'],
  ['ca', 'RevenueFromContractWithCustomerExcludingAssessedTax'],
  ['ca', 'RevenueFromContractWithCustomerIncludingAssessedTax'],
  ['op', 'OperatingIncomeLoss'],
  ['cout', 'CostOfRevenue'],
  ['cout', 'CostOfGoodsAndServicesSold'],
  ['cout', 'CostOfServices'],
  ['cout', 'CostOfGoodsAndServiceExcludingDepreciationDepletionAndAmortization'],
  ['rpo', 'RevenueRemainingPerformanceObligation'],
];

const sub = await get(`https://data.sec.gov/submissions/CIK${CIK}.json`);
console.log(`### ${sub.name} — CIK ${Number(CIK)} — exercice clos le ${sub.fiscalYearEnd}`);

// ── Dépôts qui peuvent porter une ligne ─────────────────────────────────────
const r = sub.filings.recent, pubs = [];
for (let i = 0; i < r.form.length; i++) {
  if (r.filingDate[i] < DEPUIS) continue;
  const items = r.items[i] || '';
  const est202 = r.form[i] === '8-K' && items.includes('2.02');
  const estPer = /^10-[QK]$/.test(r.form[i]);
  if (est202 || estPer) pubs.push({ date: r.filingDate[i], form: r.form[i], accn: r.accessionNumber[i].replace(/-/g, ''), items, rapport: r.reportDate[i] });
}
pubs.sort((a, b) => a.date.localeCompare(b.date));
console.log(`\n## Dépôts (${pubs.filter((p) => p.form === '8-K').length} 8-K 2.02, ${pubs.filter((p) => p.form !== '8-K').length} périodiques)`);
for (const p of pubs) console.log(`  ${p.date}  ${p.form.padEnd(5)} ${p.accn}  période ${p.rapport}  ${p.form === '8-K' ? p.items : ''}`);

// ── Faits XBRL, groupés par dépôt ───────────────────────────────────────────
const parDepot = {};
for (const [role, tag] of TAGS) {
  const j = await get(`https://data.sec.gov/api/xbrl/companyconcept/CIK${CIK}/us-gaap/${tag}.json`);
  if (!j?.units?.USD) continue;
  for (const f of j.units.USD) {
    if (f.filed < DEPUIS || (f.form !== '10-Q' && f.form !== '10-K')) continue;
    const jours = (new Date(f.end) - new Date(f.start)) / 86400000;
    const instant = f.start === undefined;
    if (!instant && (jours < 80 || jours > 100)) continue;
    const cle = `${f.filed}`;
    ((parDepot[cle] ||= {})[f.end] ||= {});
    // premier tag renseigné pour ce rôle : les tags sont listés par ordre de préférence
    if (parDepot[cle][f.end][role] === undefined) { parDepot[cle][f.end][role] = f.val; parDepot[cle][f.end][role + '_tag'] = tag; }
  }
}
console.log('\n## Faits trimestriels, par dépôt — chaque ligne lit son propre document');
for (const d of Object.keys(parDepot).sort()) {
  console.log(`  dépôt du ${d}`);
  for (const p of Object.keys(parDepot[d]).sort()) {
    const v = parDepot[d][p];
    console.log(`     ${p}  CA ${String(v.ca ?? '—').padStart(13)}  expl. ${String(v.op ?? '—').padStart(13)}  coût ${String(v.cout ?? '—').padStart(13)}${v.rpo !== undefined ? `  RPO ${v.rpo}` : ''}`);
  }
}
const tagsVus = new Set();
for (const d of Object.values(parDepot)) for (const v of Object.values(d)) for (const k of ['ca_tag', 'op_tag', 'cout_tag']) if (v[k]) tagsVus.add(`${k.replace('_tag', '')}=${v[k]}`);
console.log('  tags employés :', [...tagsVus].join(' · ') || 'aucun');

// ── Communiqués : carnet, abonnés, prévision ────────────────────────────────
const MOTIFS = [
  /\bbacklog\b/i, /remaining performance obligation/i, /\border intake\b/i, /\bbook[- ]to[- ]bill\b/i,
  /subscribers?,? (?:as of )?(?:period end|end of period)/i, /\bnet (?:additions|adds)\b/i,
  /(?:full[- ]?year|fiscal ?\d{4}|FY ?\d{2,4}|20\d\d)\s+(?:financial\s+)?(?:outlook|guidance)/i,
  /(?:expects?|anticipates?|guidance of|outlook of|revenue of)\s+(?:approximately\s+)?\$[\d.,]+\s*(?:million|billion)?\s*(?:to|–|-)\s*\$?[\d.,]+/i,
  /\breaffirm(?:s|ed|ing)?\b|\brais(?:es|ed|ing)\b.{0,40}(?:outlook|guidance)|\blower(?:s|ed|ing)\b.{0,40}(?:outlook|guidance)/i,
];
const nettoie = (h) => {
  let t = h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  t = t.replace(/<\/t[dh]>/gi, '\t').replace(/<\/tr>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<[^>]+>/g, ' ');
  t = t.replace(/&#160;|&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '’')
       .replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—').replace(/&#\d+;/g, ' ');
  return t.split('\n').map((l) => l.replace(/[  ​]+/g, ' ').replace(/\s*\t\s*/g, '\t').trim());
};

console.log('\n## Communiqués : lignes portant carnet, abonnés ou prévision');
for (const p of pubs) {
  const idx = await get(`https://www.sec.gov/Archives/edgar/data/${Number(CIK)}/${p.accn}/index.json`);
  const fichiers = (idx?.directory?.item || []).map((i) => i.name).filter((n) => /\.htm$/i.test(n));
  const annexes = fichiers.filter((f) => /ex-?99|exhibit99|release|press|earnings/i.test(f));
  const cible = annexes[0] || (p.form !== '8-K' ? fichiers.find((f) => /10[qk]\.htm$/i.test(f)) : null);
  if (!cible) { console.log(`  ${p.date}  ${p.form}  (aucune annexe 99 trouvée)`); continue; }
  const brut = await get(`https://www.sec.gov/Archives/edgar/data/${Number(CIK)}/${p.accn}/${cible}`, true);
  const lignes = nettoie(brut).filter((l) => l.length > 12 && l.length < 400 && /\d/.test(l) && MOTIFS.some((m) => m.test(l)));
  const vues = new Set();
  console.log(`  ${p.date}  ${p.form}  ${cible}  (${annexes.length} annexe(s) 99)`);
  for (const l of lignes.slice(0, 14)) { const k = l.slice(0, 60); if (vues.has(k)) continue; vues.add(k); console.log(`      ${l.slice(0, 230)}`); }
}
