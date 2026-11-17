// Télécharge les communiqués de résultats du backtest (annexes 99.1 des 8-K) sur EDGAR
// et les enregistre en texte brut dans out/communiques/.
// La SEC demande aux outils automatiques de se déclarer : le User-Agent (nom + adresse de
// contact) est lu dans la variable d'environnement SEC_USER_AGENT, jamais écrit dans le code
// ni dans les journaux. Usage : node scripts/backtest/fetch-sec-communiques.mjs [--dry]
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

async function main() {
  const docs = JSON.parse(await readFile(path.join(ICI, 'communiques.json'), 'utf8'));
  if (process.argv.includes('--dry')) {
    for (const d of docs) console.log(d.ticker, d.fin, d.url);
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
    const nom = `${d.ticker}_${d.fin}.txt`;
    try {
      const r = await fetch(d.url, { headers: { 'User-Agent': agent, 'Accept-Encoding': 'gzip, deflate' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const texte = htmlVersTexte(await r.text());
      await writeFile(path.join(SORTIE, nom), `${d.url}\n${d.ticker} · ${d.trimestre} · publié le ${d.publication}\n\n${texte}\n`);
      bilan.push({ ...d, fichier: nom, caracteres: texte.length, ok: true });
      console.log('ok   ', nom, texte.length);
    } catch (e) {
      bilan.push({ ...d, ok: false, erreur: String(e.message) });
      console.log('échec', nom, e.message);
    }
    await new Promise((res) => setTimeout(res, PAUSE_MS));
  }
  await writeFile(path.join(SORTIE, 'index.json'), JSON.stringify(bilan, null, 2));
  const rates = bilan.filter((b) => !b.ok).length;
  console.log(`${bilan.length - rates} communiqués enregistrés, ${rates} échecs`);
  if (rates === bilan.length) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
