// Télécharge les communiqués de résultats du backtest (annexes 99.1 des 8-K) sur EDGAR
// et les enregistre en texte brut dans out/communiques/.
// La SEC demande aux outils automatiques de se déclarer : le User-Agent (nom + adresse de
// contact) est lu dans la variable d'environnement SEC_USER_AGENT, jamais écrit dans le code
// ni dans les journaux. Usage : node scripts/backtest/fetch-sec-communiques.mjs [liste.json] [--dry]
// Trois types d'entrée : communiqué (url directe), 'exhibits' (annexes 99.x d'un 8-K), 'depot' (dépôt complet en texte).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.resolve(ICI, '../../out/communiques');
const PAUSE_MS = 250; // 4 requêtes par seconde, sous la limite de 10 fixée par la SEC

export function htmlVersTexte(html) {
  const nommees = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', bull: '•', reg: '®', trade: '™' };
  return html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(td|th)>/gi, '\t')
    .replace(/<\/(p|div|tr|li|h[1-6]|table)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => nommees[n.toLowerCase()] ?? m)
    .replace(/ /g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/(\t ?){2,}/g, '\t')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const BASE = 'https://www.sec.gov/Archives/edgar/data';
const pause = () => new Promise((res) => setTimeout(res, PAUSE_MS));

async function lire(url, agent) {
  const r = await fetch(url, { headers: { 'User-Agent': agent, 'Accept-Encoding': 'gzip, deflate' } });
  await pause();
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

// Annexes 99.x d'un 8-K : on lit l'index du dépôt, puis chaque annexe (communiqué, lettre aux actionnaires).
async function annexes(d, agent) {
  const dossier = `${BASE}/${d.cik}/${d.accession.replace(/-/g, '')}`;
  const index = JSON.parse(await lire(`${dossier}/index.json`, agent));
  const noms = index.directory.item.map((i) => i.name).filter((n) => /\.(htm|html|txt)$/i.test(n) && !/index|^R\d+\.htm/i.test(n) && n !== d.primaire && n !== `${d.accession}.txt`);
  const retenus = noms.filter((n) => /99|press|earn|letter|release/i.test(n));
  return (retenus.length ? retenus : noms).map((n) => `${dossier}/${n}`);
}

async function main() {
  const liste = process.argv.find((a) => a.endsWith('.json')) ?? path.join(ICI, 'communiques.json');
  const docs = JSON.parse(await readFile(liste, 'utf8'));
  if (process.argv.includes('--dry')) {
    for (const d of docs) console.log(d.ticker, d.fin ?? d.date, d.type ?? 'communique', d.url ?? d.accession);
    return;
  }
  const agent = process.env.SEC_USER_AGENT;
  if (!agent || !agent.includes('@')) {
    console.error('SEC_USER_AGENT est absent ou sans adresse de contact : ajoute le secret dans Settings → Secrets and variables → Actions.');
    process.exit(1);
  }
  await mkdir(SORTIE, { recursive: true });
  const bilan = [];
  for (const d of docs) {
    const cle = `${d.ticker}_${d.fin ?? d.date}`;
    try {
      const urls = d.type === 'exhibits' ? await annexes(d, agent) : [d.url];
      let k = 0;
      for (const url of urls) {
        const brut = await lire(url, agent);
        const texte = /<html|<font|<td|<div/i.test(brut) ? htmlVersTexte(brut) : brut;
        const nom = d.type === 'exhibits' ? `${cle}_${++k}.txt` : d.type === 'depot' ? `${cle}_${d.forme}_${d.accession}.txt` : `${cle}.txt`;
        await writeFile(path.join(SORTIE, nom), `${url}\n${d.ticker} · ${d.trimestre ?? d.forme ?? '8-K'} · ${d.publication ?? d.date}\n\n${texte}\n`);
        bilan.push({ ...d, url, fichier: nom, caracteres: texte.length, ok: true });
        console.log('ok   ', nom, texte.length);
      }
      if (!urls.length) throw new Error('aucune annexe trouvée');
    } catch (e) {
      bilan.push({ ...d, ok: false, erreur: String(e.message) });
      console.log('échec', cle, e.message);
    }
  }
  await writeFile(path.join(SORTIE, 'index.json'), JSON.stringify(bilan, null, 2));
  const rates = bilan.filter((b) => !b.ok).length;
  console.log(`${bilan.length - rates} documents enregistrés, ${rates} échecs`);
  if (rates === bilan.length) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
