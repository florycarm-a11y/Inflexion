// Rend des scènes HTML en WebP : Chrome (sans fenêtre) affiche chaque image et la photographie.
// Aucune dépendance npm, aucun port réseau : Node 22 ou plus parle à Chrome par un tuyau local.
// Usage : node rendre.mjs <taches.json | instrument> <dossier de sortie>
//   taches.json : [{ "scene": "gravure.html", "params": { ... }, "sortie": "nom.webp" }, ...]
//   instrument  : énumère RUBRIQUES × VARIANTES déclarés par scenes/instrument.html
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { once } from 'node:events';

const [entree, sortieDir] = process.argv.slice(2);
if (!entree || !sortieDir) { console.error('Usage : node rendre.mjs <taches.json | instrument> <dossier de sortie>'); process.exit(1); }
if (existsSync(sortieDir)) { console.error(`${sortieDir} existe déjà : un rendu ne s'écrase jamais.`); process.exit(1); }
const SCENES = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'scenes');
// Si CHROME est défini, c'est le seul chemin essayé (permet de forcer un Chrome précis, et de tester l'absence).
const CANDIDATS = process.env.CHROME ? [process.env.CHROME] : [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  join(process.env.HOME || '', 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];
const CHROME = CANDIDATS.find((c) => c && existsSync(c));
if (!CHROME) { console.error('Google Chrome introuvable : installez-le, ou indiquez son chemin dans la variable CHROME.'); process.exit(1); }
let taches = null;
if (entree !== 'instrument') {
  try { taches = JSON.parse(readFileSync(entree, 'utf8')); } catch (e) { console.error(`Fichier de tâches illisible : ${entree} (${e.message})`); process.exit(1); }
}

// 1. Lancer Chrome sans fenêtre, profil jetable, dialogue sur les descripteurs 3 et 4
const profil = mkdtempSync(join(tmpdir(), 'studio-chrome-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-pipe', `--user-data-dir=${profil}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
  '--allow-file-access-from-files', '--window-size=1600,900', '--force-device-scale-factor=1', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
let journal = '';
chrome.stderr.on('data', (d) => { journal = (journal + d).slice(-4000); });
const vers = chrome.stdio[3], depuis = chrome.stdio[4];
let numero = 0, tampon = '';
const enAttente = new Map();
depuis.setEncoding('utf8');
depuis.on('data', (d) => {
  tampon += d; let fin;
  while ((fin = tampon.indexOf('\0')) >= 0) {
    const m = JSON.parse(tampon.slice(0, fin)); tampon = tampon.slice(fin + 1);
    if (!enAttente.has(m.id)) continue;
    const { ok, ko } = enAttente.get(m.id); enAttente.delete(m.id);
    m.error ? ko(new Error(m.error.message)) : ok(m.result);
  }
});
chrome.on('exit', (code) => {
  for (const { ko } of enAttente.values()) ko(new Error(`Chrome s'est arrêté (code ${code}). ${journal.trim().split('\n').pop() || ''}`));
  enAttente.clear();
});
const cdp = (method, params = {}, sessionId) => new Promise((ok, ko) => {
  const id = ++numero;
  const garde = setTimeout(() => { if (enAttente.delete(id)) ko(new Error(`Chrome ne répond pas (${method})`)); }, 10000);
  enAttente.set(id, { ok: (r) => { clearTimeout(garde); ok(r); }, ko: (e) => { clearTimeout(garde); ko(e); } });
  vers.write(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }) + '\0');
});
async function ranger() {
  try { vers.end(); } catch {}
  if (chrome.exitCode === null) { chrome.kill(); await Promise.race([once(chrome, 'exit'), new Promise((r) => setTimeout(r, 5000))]); }
  try { rmSync(profil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch {}
}

try {
  // 2. Un onglet, une session
  const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => cdp(method, params, sessionId);
  const evaluer = async (expression) => {
    const r = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`Erreur dans la scène : ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result.value;
  };
  const ouvrir = async (scene, params) => {
    const url = `${pathToFileURL(join(SCENES, scene)).href}?rendu&${new URLSearchParams(params)}`;
    await page('Page.navigate', { url });
    let pret = false;
    for (let essai = 0; essai < 100 && !pret; essai++) {
      await new Promise((r) => setTimeout(r, 100));
      pret = await evaluer(`document.readyState === 'complete' && typeof window.afficher === 'function' && window.LARGEUR > 0 && window.HAUTEUR > 0`).catch(() => false);
    }
    if (!pret) throw new Error(`${scene} ne déclare pas window.LARGEUR, window.HAUTEUR et window.afficher().`);
  };

  // 3. Énumération (mode instrument) : c'est la scène qui dit quoi rendre
  if (!taches) {
    await ouvrir('instrument.html', {});
    const { rubriques, variantes } = await evaluer(`({ rubriques: window.RUBRIQUES, variantes: window.VARIANTES })`);
    taches = [];
    for (const rubrique of rubriques) for (let v = 1; v <= variantes; v++) taches.push({ scene: 'instrument.html', params: { rubrique, variante: v }, sortie: `${rubrique}-${v}.webp` });
  }
  if (!Array.isArray(taches) || taches.length === 0) throw new Error('Aucune tâche à rendre.');

  // 4. Chaque tâche : ouvrir, dimensionner, afficher, photographier en WebP
  mkdirSync(sortieDir, { recursive: true });
  for (const [i, t] of taches.entries()) {
    await ouvrir(t.scene, t.params || {});
    const { l, h } = await evaluer(`({ l: window.LARGEUR, h: window.HAUTEUR })`);
    await page('Emulation.setDeviceMetricsOverride', { width: l, height: h, deviceScaleFactor: 1, mobile: false });
    await evaluer(`window.afficher().then(() => new Promise((r) => requestAnimationFrame(() => r(true))))`);
    const { data } = await page('Page.captureScreenshot', { format: 'webp', quality: 82, clip: { x: 0, y: 0, width: l, height: h, scale: 1 } });
    writeFileSync(join(sortieDir, t.sortie), Buffer.from(data, 'base64'));
    process.stdout.write(`\rImage ${i + 1} / ${taches.length}  ${t.sortie}        `);
  }
  process.stdout.write('\n');
} catch (e) {
  console.error(e.message);
  await ranger();
  process.exit(1);
}
await ranger();
