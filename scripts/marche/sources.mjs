// Sources de la couche « lecture de marché » — une section par source, deux étages par section :
//
//   lire…()      fonctions PURES : reçoivent la réponse brute d'une source, rendent des données
//                {valeur, source:{nom,url}, date} ou {valeur:null, motif}. Testées sur des réponses
//                réelles capturées le 25 novembre 2026 (test/fixtures/marche/).
//   collecter…() font l'appel réseau, puis passent la réponse à lire…().
//
// Règle tenue partout : aucun chiffre inventé, estimé ou interpolé. Ce qu'une source ne donne pas
// vaut {valeur:null, motif:'…'} — « n/d » à l'écran, jamais zéro.
//
// Sources retenues après vérification (détail et limites : data/marche/README.md) :
//   FINRA    API publique, sans clé    position courte, jours de couverture (officiel, bimensuel)
//   SEC      API XBRL, sans clé        chiffre d'affaires, actions en circulation (officiel)
//   Nasdaq   API du site, NON DOCUMENTÉE  avis d'analystes, objectifs, BPA attendu, cours, capitalisation
// Écartée : Yahoo Finance / yfinance (HTTP 429 sur tous les points d'accès le jour du sondage).

const ND = (motif) => ({ valeur: null, motif });
const donnee = (valeur, nom, url, date) => ({ valeur, source: { nom, url }, date });

const JOUR_MS = 86400000;
const jour = (d) => new Date(d).toISOString().slice(0, 10);
const joursEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / JOUR_MS);
/** « 11/13/2026 » → « 2026-11-13 » */
const jourUS = (texte) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(texte).trim());
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null;
};
/** « $45.98 », « 28,226,054,064 » → nombre ; tout le reste (« N/A », vide) → null */
const nombreUS = (texte) => {
  const propre = String(texte ?? '').replace(/[$,\s]/g, '');
  return /^-?\d+(\.\d+)?$/.test(propre) ? Number(propre) : null;
};
/** Le même jour, n mois plus tôt. */
const moisAvant = (aujourdhui, n) => {
  const d = new Date(aujourdhui + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() - n);
  return jour(d);
};

// ═══ FINRA — short interest consolidé ═════════════════════════════════════════

const FINRA_API = 'https://api.finra.org/data/group/otcMarket/name/consolidatedShortInterest';
const FINRA_PAGE = 'https://www.finra.org/finra-data/browse-catalog/equity-short-interest/data';

/** rows = réponse de l'API (un objet par date de règlement). */
export function lireFinra(rows) {
  const vide = { position_courte: ND('aucun relevé FINRA'), position_precedente: ND('aucun relevé FINRA'), jours_couverture: ND('aucun relevé FINRA') };
  if (!Array.isArray(rows) || !rows.length) return vide;
  const tries = rows.filter((r) => r && /^\d{4}-\d{2}-\d{2}$/.test(r.settlementDate) && Number.isFinite(r.currentShortPositionQuantity))
    .sort((a, b) => (a.settlementDate < b.settlementDate ? 1 : -1));
  if (!tries.length) return vide;
  const [dernier, avant] = tries;
  return {
    position_courte: donnee(dernier.currentShortPositionQuantity, 'FINRA', FINRA_PAGE, dernier.settlementDate),
    // Le relevé précédent est lu sur SA ligne, avec sa propre date — pas dans le champ
    // « previous » du dernier relevé, qui ne porte pas de date.
    position_precedente: avant
      ? donnee(avant.currentShortPositionQuantity, 'FINRA', FINRA_PAGE, avant.settlementDate)
      : ND('un seul relevé FINRA disponible'),
    jours_couverture: Number.isFinite(dernier.daysToCoverQuantity)
      ? donnee(dernier.daysToCoverQuantity, 'FINRA', FINRA_PAGE, dernier.settlementDate)
      : ND('jours de couverture non publiés'),
  };
}

export async function collecterFinra(ticker, { requete, aujourdhui }) {
  const rows = await requete(FINRA_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      compareFilters: [{ compareType: 'EQUAL', fieldName: 'symbolCode', fieldValue: ticker }],
      dateRangeFilters: [{ fieldName: 'settlementDate', startDate: moisAvant(aujourdhui, 3), endDate: aujourdhui }],
      limit: 50,
    }),
  });
  return lireFinra(rows);
}

// ═══ SEC — API XBRL (faits balisés des 10-Q et 10-K) ══════════════════════════

const SEC_API = 'https://data.sec.gov/api/xbrl/companyconcept';
const secUrl = (cik, taxonomie, concept) => `${SEC_API}/CIK${String(cik).padStart(10, '0')}/${taxonomie}/${concept}.json`;
// Les deux concepts sous lesquels les sociétés balisent leur chiffre d'affaires, dans l'ordre d'essai.
export const SEC_CONCEPTS_CA = ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues'];

/**
 * Chiffre d'affaires des douze derniers mois, à partir des faits d'UN concept.
 * Aucune société ne balise ce total : il se DÉRIVE de trois montants publiés —
 *   dernier exercice complet + cumul de l'exercice en cours − même cumul un an plus tôt.
 * Si le dernier fait couvre déjà un exercice entier, c'est lui. Si l'un des trois montants
 * manque, le résultat est n/d : rien n'est extrapolé.
 */
export function lireSecChiffreAffaires(json, url) {
  const faits = (json?.units?.USD || []).filter((f) => f.start && f.end && Number.isFinite(f.val));
  if (!faits.length) return ND('chiffre d’affaires non balisé');
  const duree = (f) => joursEntre(f.start, f.end) + 1;
  // Un même fait est répété de dépôt en dépôt : garder la version du dépôt le plus récent.
  const recents = [...faits].sort((a, b) => (a.filed < b.filed ? 1 : -1));
  const fin = faits.reduce((max, f) => (f.end > max ? f.end : max), '');
  const cumul = recents.filter((f) => f.end === fin).sort((a, b) => duree(b) - duree(a))[0];
  if (duree(cumul) >= 350) return donnee(cumul.val, 'SEC (XBRL)', url, fin);

  const veille = jour(Date.parse(cumul.start) - JOUR_MS);
  const exercice = recents.find((f) => duree(f) >= 350 && Math.abs(joursEntre(f.end, veille)) <= 3);
  const unAnAvant = moisAvant(fin, 12);
  const cumulPrecedent = recents.find((f) => Math.abs(joursEntre(f.end, unAnAvant)) <= 7 && Math.abs(duree(f) - duree(cumul)) <= 7);
  if (!exercice || !cumulPrecedent) return ND('douze mois non reconstituables à partir des faits balisés');
  return {
    ...donnee(exercice.val + cumul.val - cumulPrecedent.val, 'SEC (XBRL)', url, fin),
    detail: { exercice: exercice.val, cumul: cumul.val, cumul_precedent: cumulPrecedent.val },
  };
}

/** Actions en circulation : fait de page de garde du dernier 10-Q ou 10-K. */
export function lireSecActions(json, url) {
  const faits = (json?.units?.shares || []).filter((f) => f.end && Number.isFinite(f.val) && f.val > 0);
  if (!faits.length) return ND('actions en circulation non balisées');
  const dernier = faits.sort((a, b) => (a.end < b.end ? 1 : -1))[0];
  return donnee(dernier.val, 'SEC (XBRL)', url, dernier.end);
}

export async function collecterSec(cik, { requete, agentSec }) {
  const entetes = { headers: { 'User-Agent': agentSec, Accept: 'application/json' } };
  const sortie = {};

  // Sociétés à plusieurs classes d'actions : le fait de page de garde est ventilé par classe et
  // l'API ne le rend pas (404). On le dit, on ne l'additionne pas à la main.
  const urlActions = secUrl(cik, 'dei', 'EntityCommonStockSharesOutstanding');
  try { sortie.actions_en_circulation = lireSecActions(await requete(urlActions, entetes), urlActions); }
  catch (e) {
    sortie.actions_en_circulation = ND(e.statut === 404 ? 'non balisé en un seul fait (plusieurs classes d’actions)' : 'source injoignable : ' + e.message);
  }

  // Le concept retenu est celui dont la dernière période est la plus récente.
  let meilleur = ND('chiffre d’affaires non balisé');
  for (const concept of SEC_CONCEPTS_CA) {
    const url = secUrl(cik, 'us-gaap', concept);
    let lu;
    try { lu = lireSecChiffreAffaires(await requete(url, entetes), url); }
    catch (e) { if (e.statut !== 404 && meilleur.valeur === null) meilleur = ND('source injoignable : ' + e.message); continue; }
    if (lu.valeur !== null ? (meilleur.valeur === null || lu.date > meilleur.date) : meilleur.valeur === null) meilleur = lu;
  }
  sortie.ca_12_mois = meilleur;
  return sortie;
}

// ═══ Nasdaq — API du site nasdaq.com (NON DOCUMENTÉE : peut changer ou se fermer) ═════════

const NASDAQ_API = 'https://api.nasdaq.com/api';
const nasdaqPage = (ticker, page) => `https://www.nasdaq.com/market-activity/stocks/${ticker.toLowerCase()}/${page}`;
// L'API refuse les clients sans en-tête de navigateur.
const NASDAQ_ENTETES = { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' } };

/**
 * Avis et objectifs de cours (point d'accès « targetprice »).
 * On ne lit QUE la série mensuelle `historicalConsensus` pour les avis : le point d'accès voisin
 * « ratings » compte autrement (3 analystes sur Centrus là où celui-ci en compte 17, 0 sur Oklo
 * contre 15). Une seule série, pour ne pas fabriquer une tendance entre deux comptages.
 */
export function lireNasdaqObjectifs(json, ticker, moisReference) {
  const url = nasdaqPage(ticker, 'analyst-research');
  const sortie = { avis: ND('avis d’analystes non disponibles'), avis_reference: ND('historique des avis non disponible'), objectifs: ND('objectifs de cours non disponibles') };
  const data = json?.data;
  if (!data) return sortie;

  const serie = (data.historicalConsensus || [])
    .map((p) => ({ date: jourUS(p?.z?.date), achat: p?.z?.buy, conserver: p?.z?.hold, vente: p?.z?.sell }))
    .filter((p) => p.date && [p.achat, p.conserver, p.vente].every(Number.isInteger))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const avis = (p) => donnee({ achat: p.achat, conserver: p.conserver, vente: p.vente }, 'Nasdaq', url, p.date);
  if (serie.length) {
    sortie.avis = avis(serie[serie.length - 1]);
    const reference = serie[serie.length - 1 - moisReference];
    if (reference) sortie.avis_reference = avis(reference);
  }

  const o = data.consensusOverview;
  if (o && [o.lowPriceTarget, o.priceTarget, o.highPriceTarget].every((v) => Number.isFinite(v) && v > 0) && serie.length) {
    // L'aperçu n'est pas daté : il porte la date du dernier point mensuel de la même réponse.
    sortie.objectifs = donnee({ bas: o.lowPriceTarget, moyen: o.priceTarget, haut: o.highPriceTarget }, 'Nasdaq', url, serie[serie.length - 1].date);
  }
  return sortie;
}

/** BPA attendu du trimestre en cours (point d'accès « earnings-forecast »). Sert aux instantanés :
 *  c'est ce consensus, daté du jour de collecte, qui permettra plus tard un vrai « publié vs consensus ». */
export function lireNasdaqPrevisions(json, ticker, aujourdhui) {
  const ligne = json?.data?.quarterlyForecast?.rows?.[0];
  if (!ligne || !Number.isFinite(ligne.consensusEPSForecast) || !Number.isInteger(ligne.noOfEstimates)) return ND('BPA attendu non disponible');
  return donnee({
    exercice: ligne.fiscalEnd, consensus: ligne.consensusEPSForecast,
    bas: ligne.lowEPSForecast, haut: ligne.highEPSForecast, estimations: ligne.noOfEstimates,
  }, 'Nasdaq', nasdaqPage(ticker, 'earnings'), aujourdhui);
}

/** Capitalisation (point d'accès « summary »). Non datée par la source : datée du jour de collecte. */
export function lireNasdaqCapitalisation(json, ticker, aujourdhui) {
  const valeur = nombreUS(json?.data?.summaryData?.MarketCap?.value);
  return valeur && valeur > 0 ? donnee(valeur, 'Nasdaq', nasdaqPage(ticker, ''), aujourdhui) : ND('capitalisation non disponible');
}

/**
 * Cours de clôture du jour, d'il y a 6 mois et d'il y a 12 mois (point d'accès « historical »).
 * Pour une date visée, on prend la dernière séance à cette date ou avant, à `tolerance` jours près.
 * Clôtures telles que publiées : non ajustées des dividendes (limite documentée).
 */
export function lireNasdaqCours(json, ticker, aujourdhui, tolerance) {
  const url = nasdaqPage(ticker, 'historical');
  const seances = (json?.data?.tradesTable?.rows || [])
    .map((r) => ({ date: jourUS(r.date), cours: nombreUS(r.close) }))
    .filter((s) => s.date && s.cours > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // la plus récente d'abord
  const autour = (cible) => {
    const s = seances.find((x) => x.date <= cible);
    return s && joursEntre(s.date, cible) <= tolerance ? donnee(s.cours, 'Nasdaq', url, s.date) : ND('aucune séance autour du ' + cible);
  };
  if (!seances.length) return { cours: ND('cours non disponibles'), cours_6_mois: ND('cours non disponibles'), cours_12_mois: ND('cours non disponibles') };
  return { cours: autour(aujourdhui), cours_6_mois: autour(moisAvant(aujourdhui, 6)), cours_12_mois: autour(moisAvant(aujourdhui, 12)) };
}

const nasdaq = (requete, chemin) => requete(`${NASDAQ_API}/${chemin}`, NASDAQ_ENTETES);

export async function collecterNasdaqAnalystes(ticker, { requete, aujourdhui, config }) {
  const sortie = lireNasdaqObjectifs(await nasdaq(requete, `analyst/${ticker}/targetprice`), ticker, config.attentes.moisReference);
  try { sortie.bpa_trimestre = lireNasdaqPrevisions(await nasdaq(requete, `analyst/${ticker}/earnings-forecast`), ticker, aujourdhui); }
  catch (e) { sortie.bpa_trimestre = ND('source injoignable : ' + e.message); }
  return sortie;
}

export async function collecterNasdaqCours(ticker, { requete, aujourdhui, config }) {
  const debut = jour(Date.parse(moisAvant(aujourdhui, 12)) - 10 * JOUR_MS);
  const sortie = lireNasdaqCours(
    await nasdaq(requete, `quote/${ticker}/historical?assetclass=stocks&fromdate=${debut}&todate=${aujourdhui}&limit=400`),
    ticker, aujourdhui, config.valorisation.toleranceSeance);
  try { sortie.capitalisation = lireNasdaqCapitalisation(await nasdaq(requete, `quote/${ticker}/summary?assetclass=stocks`), ticker, aujourdhui); }
  catch (e) { sortie.capitalisation = ND('source injoignable : ' + e.message); }
  return sortie;
}

// ═══ Registre des modules ═════════════════════════════════════════════════════
// Un module = sa clé, les champs qu'il doit rendre, et la liste de ses collecteurs.
// Chaque collecteur est isolé : s'il échoue, SES champs passent à n/d avec le motif, et les
// autres continuent. Ajouter un module (contexte de marché…) = ajouter une entrée ici,
// et sa lecture dans MARCHE_MODULES (lecture-marche-modele.js).

export const MODULES = [
  { cle: 'flux',
    champs: ['position_courte', 'position_precedente', 'jours_couverture', 'actions_en_circulation'],
    collecteurs: [
      { nom: 'FINRA', champs: ['position_courte', 'position_precedente', 'jours_couverture'], lancer: (s, ctx) => collecterFinra(s.ticker, ctx) },
      { nom: 'SEC', champs: ['actions_en_circulation'], lancer: async (s, ctx) => ({ actions_en_circulation: (await ctx.sec(s)).actions_en_circulation }) },
    ] },
  { cle: 'attentes',
    // publie_vs_consensus : aucun collecteur en V1. Il faudra un consensus daté d'AVANT la
    // publication, que seuls nos propres instantanés (data/marche/historique/) pourront fournir.
    champs: ['avis', 'avis_reference', 'objectifs', 'bpa_trimestre', 'publie_vs_consensus'],
    collecteurs: [
      { nom: 'Nasdaq', champs: ['avis', 'avis_reference', 'objectifs', 'bpa_trimestre'], lancer: (s, ctx) => collecterNasdaqAnalystes(s.ticker, ctx) },
    ] },
  { cle: 'valorisation',
    champs: ['capitalisation', 'ca_12_mois', 'cours', 'cours_6_mois', 'cours_12_mois'],
    collecteurs: [
      { nom: 'Nasdaq', champs: ['capitalisation', 'cours', 'cours_6_mois', 'cours_12_mois'], lancer: (s, ctx) => collecterNasdaqCours(s.ticker, ctx) },
      { nom: 'SEC', champs: ['ca_12_mois'], lancer: async (s, ctx) => ({ ca_12_mois: (await ctx.sec(s)).ca_12_mois }) },
    ] },
];

export const MOTIF_SANS_COLLECTEUR = 'aucune source en V1';
