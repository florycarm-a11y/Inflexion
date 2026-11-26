/**
 * lecture-marche-modele.js — Moteur de règles de la couche « lecture de marché ».
 *
 * Ce que fait ce fichier : à partir de la dernière alerte du tracker et d'un instantané de données
 * de marché (data/marche/instantane.json), il rend UNE étiquette de lecture et ses raisons.
 *
 * Ce qu'il ne fait pas, par construction :
 *  - il ne calcule ni solde ni alerte : il les REÇOIT du moteur du tracker (tracker-modele.js) ;
 *  - il n'écrit rien, ne charge rien, ne touche à aucun fichier : fonctions pures ;
 *  - il n'invente aucun chiffre : une donnée absente, sans source ou périmée vaut « n/d ».
 *
 * Les seuils vivent dans lecture-marche-config.js (MARCHE_CONFIG), jamais ici.
 * Les croisements de la grille sont des hypothèses non backtestées.
 *
 * Globales `var` : chargeable dans le navigateur et dans node:vm (tests), comme tracker-modele.js.
 */
'use strict';

// ── Vocabulaire ───────────────────────────────────────────────────────────────

var MARCHE_ETIQUETTES = {
  'asymetrie-favorable': { libelle: 'Asymétrie favorable' },
  confirmation: { libelle: 'Confirmation' },
  conteste: { libelle: 'Contesté' },
  'deja-dans-le-cours': { libelle: 'Déjà dans le cours ?' },
  'pression-renforcee': { libelle: 'Pression renforcée' },
  'risque-de-revisions': { libelle: 'Risque de révisions' },
  'a-surveiller': { libelle: 'À surveiller' },
  'lecture-incomplete': { libelle: 'Lecture incomplète' },
  // Deux états que la grille de départ ne nomme pas, mais qu'il faut bien afficher :
  'sans-lecture-tranchee': { libelle: 'Sans lecture tranchée' }, // alerte lue, aucun croisement ne s'applique
  'sans-alerte': { libelle: 'Sans alerte' },                     // le tracker n'a émis aucune alerte
};

var MARCHE_JOUR = /^\d{4}-\d{2}-\d{2}$/;

// ── Outils ────────────────────────────────────────────────────────────────────

/** Nombre de jours entre deux jours AAAA-MM-JJ (b − a). */
function marcheJoursEntre(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

/** Nombre à la française : virgule décimale, moins typographique. */
function marcheNombre(n, decimales) {
  var texte = Math.abs(n).toFixed(decimales === undefined ? 1 : decimales).replace('.', ',');
  return (n < 0 ? '−' : '') + texte;
}

/** Variation signée : « +12,3 % », « −4,0 % ». */
function marcheVariation(n, decimales) {
  return (n > 0 ? '+' : '') + marcheNombre(n, decimales) + ' %';
}

/**
 * État d'une donnée de l'instantané. Une donnée est {valeur, source:{nom,url}, date}.
 * Rend { etat: 'ok' | 'nd' | 'perimee', valeur, source, date, age, motif }.
 *  - 'nd'      : valeur absente, ou sans source, ou sans date → elle ne s'affiche pas ;
 *  - 'perimee' : plus vieille que l'âge maximal → affichée, marquée, mais muette pour les règles.
 * ageMax null = la donnée ne se périme pas (cours de référence anciens par construction).
 */
function marcheDonnee(donnee, ageMax, aujourdhui) {
  var nd = function (motif) { return { etat: 'nd', valeur: null, source: null, date: null, age: null, motif: motif }; };
  if (!donnee || typeof donnee !== 'object') return nd('donnée non collectée');
  if (donnee.valeur === null || donnee.valeur === undefined) return nd(donnee.motif || 'non disponible');
  var s = donnee.source;
  if (!s || typeof s.nom !== 'string' || !s.nom || typeof s.url !== 'string' || !s.url) return nd('source absente');
  if (!MARCHE_JOUR.test(donnee.date)) return nd('date absente');
  var age = marcheJoursEntre(donnee.date, aujourdhui);
  var perimee = ageMax !== null && ageMax !== undefined && age > ageMax;
  return { etat: perimee ? 'perimee' : 'ok', valeur: donnee.valeur, source: s, date: donnee.date, age: age,
    motif: perimee ? 'plus de ' + ageMax + ' jours' : null, saisie: donnee.saisie || null };
}

/** Lit toutes les données d'un module d'un coup, avec l'âge maximal de chacune. */
function marcheLireDonnees(bloc, cles, config, aujourdhui) {
  var lues = {};
  cles.forEach(function (cle) { lues[cle] = marcheDonnee(bloc ? bloc[cle] : null, config.fraicheur[cle], aujourdhui); });
  return lues;
}

/** Valeur utilisable par une règle : seulement si la donnée est fraîche. */
function marcheUtile(lue) { return lue.etat === 'ok' ? lue.valeur : null; }

function marcheMesure(cle, libelle, lue, texte) {
  return { cle: cle, libelle: libelle, etat: lue.etat, texte: lue.etat === 'nd' ? 'n/d' : texte,
    source: lue.source, date: lue.date, motif: lue.motif, saisie: lue.saisie || null };
}

/** Défauts d'un module : ce qui manque ou est périmé parmi ses données indispensables. */
function marcheDefauts(lues, indispensables, libelles) {
  return indispensables.filter(function (cle) { return lues[cle].etat !== 'ok'; }).map(function (cle) {
    return libelles[cle] + (lues[cle].etat === 'perimee' ? ' périmé (' + lues[cle].date + ')' : ' n/d');
  });
}

// ── Module A — Flux / short interest ──────────────────────────────────────────

function marcheLireFlux(bloc, societe, config, aujourdhui) {
  var c = config.flux;
  var d = marcheLireDonnees(bloc, ['position_courte', 'position_precedente', 'jours_couverture', 'actions_en_circulation'], config, aujourdhui);
  var position = marcheUtile(d.position_courte), precedente = marcheUtile(d.position_precedente);
  var jours = marcheUtile(d.jours_couverture), actions = marcheUtile(d.actions_en_circulation);

  var pct = position !== null && actions ? position / actions * 100 : null;
  var variation = position !== null && precedente ? (position - precedente) / precedente * 100 : null;
  var tendance = variation === null ? null : variation > c.variationStable ? 'hausse' : variation < -c.variationStable ? 'baisse' : 'stable';

  // Niveau. Le pourcentage, rapporté aux actions en circulation, minore le « % du flottant » : il peut
  // établir un niveau « élevé », jamais un niveau « bas » à lui seul. Les jours de couverture ne
  // dépendent d'aucun dénominateur : « bas » les exige.
  var niveau = null;
  if (pct !== null || jours !== null) {
    var eleve = (pct !== null && pct >= c.pctEleve) || (jours !== null && jours >= c.joursEleves);
    var bas = jours !== null && jours <= c.joursBas && (pct === null || pct <= c.pctBas);
    niveau = eleve ? 'eleve' : bas ? 'bas' : 'intermediaire';
  }

  var morceaux = [];
  if (pct !== null) morceaux.push('SI ' + marcheNombre(pct) + ' % des actions');
  if (jours !== null) morceaux.push(marcheNombre(jours) + ' j de couverture');
  if (tendance) morceaux.push(tendance === 'stable' ? 'stable' : 'en ' + tendance + ' (' + marcheVariation(variation) + ')');

  return {
    cle: 'flux', titre: 'Flux / short interest',
    defauts: marcheDefauts(d, ['position_courte'], { position_courte: 'short interest' }),
    signaux: { niveau: niveau, tendance: tendance },
    resume: morceaux.join(', '),
    mesures: [
      marcheMesure('pct', '% des actions en circulation', pct === null && d.position_courte.etat === 'ok' ? d.actions_en_circulation : d.position_courte,
        pct === null ? 'n/d' : marcheNombre(pct) + ' %'),
      // Le dénominateur a sa propre ligne : sa source et sa date ne sont pas celles de FINRA.
      marcheMesure('actions', 'Actions en circulation (classe cotée)', d.actions_en_circulation,
        marcheNombre((d.actions_en_circulation.valeur || 0) / 1e6) + ' M'),
      marcheMesure('jours', 'Jours de couverture', d.jours_couverture, marcheNombre(d.jours_couverture.valeur || 0) + ' j'),
      marcheMesure('tendance', 'Tendance', d.position_precedente.etat === 'ok' ? d.position_courte : d.position_precedente,
        tendance === null ? 'n/d' : { hausse: 'Hausse', baisse: 'Baisse', stable: 'Stable' }[tendance] + ' (' + marcheVariation(variation) + ' depuis le ' + d.position_precedente.date + ')'),
    ],
  };
}

// ── Module B — Attentes / analystes ───────────────────────────────────────────

function marchePartAchat(avis) {
  if (!avis) return null;
  var total = avis.achat + avis.conserver + avis.vente;
  return total > 0 ? { total: total, part: avis.achat / total * 100 } : { total: 0, part: null };
}

function marcheLireAttentes(bloc, societe, config, aujourdhui) {
  var c = config.attentes;
  var d = marcheLireDonnees(bloc, ['avis', 'avis_reference', 'objectifs', 'ca_trimestre', 'bpa_trimestre', 'publie_vs_consensus'], config, aujourdhui);
  var courant = marchePartAchat(marcheUtile(d.avis)), reference = marchePartAchat(marcheUtile(d.avis_reference));

  var couverture = courant ? courant.total : null;
  var part = courant ? courant.part : null;
  var consensus = part === null ? null : part >= c.partAchatTresHaussiere ? 'tres-haussier' : part <= c.partAchatPrudente ? 'prudent' : 'intermediaire';
  var couvertureFaible = couverture === null ? null : couverture <= c.couvertureFaible;

  // Évolution du consensus : part d'avis acheteurs aujourd'hui contre il y a `moisReference` mois, en points.
  var ecartPoints = part !== null && reference && reference.part !== null ? part - reference.part : null;
  var tendance = ecartPoints === null ? null : ecartPoints > c.variationStable ? 'hausse' : ecartPoints < -c.variationStable ? 'baisse' : 'stable';

  // Dispersion des objectifs de cours : (haut − bas) / moyen. Affichée, sans règle attachée.
  var obj = marcheUtile(d.objectifs);
  var dispersion = obj && obj.moyen > 0 ? (obj.haut - obj.bas) / obj.moyen * 100 : null;

  // Publié contre consensus : seulement si le consensus est DATÉ D'AVANT la publication.
  // Et relevé au plus `consensusAgeMax` jours avant elle : au-delà, ce n'est plus le consensus de la veille.
  var pvc = marcheUtile(d.publie_vs_consensus), surprise = null, ecartPublie = null, motifSurprise = null;
  if (pvc && MARCHE_JOUR.test(pvc.date_consensus) && MARCHE_JOUR.test(pvc.date_publication)
      && pvc.date_consensus < pvc.date_publication && typeof pvc.publie === 'number' && typeof pvc.consensus === 'number' && pvc.consensus !== 0) {
    if (marcheJoursEntre(pvc.date_consensus, pvc.date_publication) > c.consensusAgeMax) {
      motifSurprise = 'consensus relevé plus de ' + c.consensusAgeMax + ' jours avant la publication';
    } else {
      ecartPublie = (pvc.publie - pvc.consensus) / Math.abs(pvc.consensus) * 100;
      surprise = ecartPublie >= c.ecartNet ? 'beat' : ecartPublie <= -c.ecartNet ? 'miss' : 'in-line';
    }
  }
  var grandeur = pvc && pvc.grandeur ? pvc.grandeur : null;

  var morceaux = [];
  if (couverture !== null) morceaux.push(couverture + ' analyste' + (couverture > 1 ? 's' : ''));
  if (part !== null) morceaux.push(marcheNombre(part, 0) + ' % d’avis acheteurs');
  if (tendance && tendance !== 'stable') morceaux.push('en ' + tendance + ' (' + (ecartPoints > 0 ? '+' : '') + marcheNombre(ecartPoints, 0) + ' pts en ' + c.moisReference + ' mois)');
  if (surprise) morceaux.push(surprise + ' ' + marcheVariation(ecartPublie) + (grandeur ? ' sur le ' + grandeur : ''));

  var bpa = d.bpa_trimestre.valeur, ca = d.ca_trimestre.valeur;
  var mesureSurprise = marcheMesure('surprise', 'Publié vs consensus', d.publie_vs_consensus,
    surprise === null ? 'n/d' : { beat: 'Beat', miss: 'Miss', 'in-line': 'In-line' }[surprise]
      + ' (' + (grandeur ? grandeur + ', ' : '') + marcheVariation(ecartPublie) + ', consensus du ' + pvc.date_consensus + ')');
  if (motifSurprise) { mesureSurprise.etat = 'nd'; mesureSurprise.texte = 'n/d'; mesureSurprise.motif = motifSurprise; }
  return {
    cle: 'attentes', titre: 'Attentes / analystes',
    defauts: marcheDefauts(d, ['avis'], { avis: 'consensus des analystes' }),
    signaux: { consensus: consensus, couvertureFaible: couvertureFaible, tendance: tendance, surprise: surprise },
    resume: morceaux.join(', '),
    mesures: [
      marcheMesure('avis', 'Avis', d.avis, d.avis.valeur
        ? d.avis.valeur.achat + ' achat · ' + d.avis.valeur.conserver + ' conserver · ' + d.avis.valeur.vente + ' vente'
          + (part === null ? '' : ' (' + marcheNombre(part, 0) + ' % acheteurs)') : 'n/d'),
      marcheMesure('tendance', 'Évolution', d.avis_reference.etat === 'ok' ? d.avis : d.avis_reference,
        tendance === null ? 'n/d' : { hausse: 'Hausse', baisse: 'Baisse', stable: 'Stable' }[tendance]
          + ' (' + (ecartPoints > 0 ? '+' : '') + marcheNombre(ecartPoints, 0) + ' pts depuis le ' + d.avis_reference.date + ')'),
      marcheMesure('dispersion', 'Objectifs de cours', d.objectifs, d.objectifs.valeur
        ? marcheNombre(d.objectifs.valeur.bas, 0) + ' à ' + marcheNombre(d.objectifs.valeur.haut, 0) + ' $'
          + (dispersion === null ? '' : ' (dispersion ' + marcheNombre(dispersion, 0) + ' %)') : 'n/d'),
      marcheMesure('ca', 'CA attendu', d.ca_trimestre, ca && typeof ca.consensus === 'number'
        ? marcheNombre(ca.consensus / 1e6, 0) + ' M$ · ' + ca.exercice : 'n/d'),
      marcheMesure('bpa', 'BPA attendu', d.bpa_trimestre, bpa
        ? marcheNombre(bpa.consensus, 2) + ' $ · ' + bpa.exercice + ' · ' + bpa.estimations + ' estimation' + (bpa.estimations > 1 ? 's' : '') : 'n/d'),
      mesureSurprise,
    ],
  };
}

// ── Module C — Valorisation ───────────────────────────────────────────────────

function marcheLireValorisation(bloc, societe, config, aujourdhui) {
  var c = config.valorisation;
  var d = marcheLireDonnees(bloc, ['capitalisation', 'ca_12_mois', 'cours', 'cours_6_mois', 'cours_12_mois'], config, aujourdhui);
  var preRevenus = societe.archetype === 'pre-revenus';
  var capi = marcheUtile(d.capitalisation), ca = marcheUtile(d.ca_12_mois), cours = marcheUtile(d.cours);

  // Multiple : P/S, sans objet en pré-revenus (diviser par un chiffre d'affaires symbolique ne dit rien).
  var ps = !preRevenus && capi !== null && ca !== null && ca > 0 ? capi / ca : null;
  var multiple = preRevenus ? 'sans-objet' : ps === null ? null : ps >= c.psEleve ? 'eleve' : ps <= c.psRaisonnable ? 'raisonnable' : 'intermediaire';

  // Les cours de référence ne valent que si le cours du jour est frais.
  var perf = function (lue) { return cours !== null && lue.etat !== 'nd' && lue.valeur > 0 ? (cours / lue.valeur - 1) * 100 : null; };
  var perf6 = perf(d.cours_6_mois), perf12 = perf(d.cours_12_mois);
  var hausseForte = perf6 === null && perf12 === null ? null
    : (perf6 !== null && perf6 >= c.hausseForte6Mois) || (perf12 !== null && perf12 >= c.hausseForte12Mois);

  var morceaux = [];
  if (ps !== null) morceaux.push('P/S ' + marcheNombre(ps) + 'x');
  if (perf6 !== null) morceaux.push(marcheVariation(perf6, 0) + ' en 6 mois');
  if (perf12 !== null) morceaux.push(marcheVariation(perf12, 0) + ' en 12 mois');

  var defauts = [];
  if (!preRevenus && ps === null) {
    defauts = defauts.concat(marcheDefauts(d, ['capitalisation', 'ca_12_mois'], { capitalisation: 'capitalisation', ca_12_mois: 'chiffre d’affaires 12 mois' }));
    if (!defauts.length) defauts.push('multiple non calculable');
  }
  if (hausseForte === null) defauts.push(d.cours.etat === 'perimee' ? 'cours périmé (' + d.cours.date + ')' : 'performance du cours n/d');

  return {
    cle: 'valorisation', titre: 'Valorisation',
    defauts: defauts,
    signaux: { multiple: multiple, hausseForte: hausseForte },
    resume: morceaux.join(', '),
    mesures: [
      preRevenus
        ? { cle: 'ps', libelle: 'P/S', etat: 'ok', texte: 'Sans objet (pré-revenus)', source: null, date: null, motif: null, saisie: null }
        : marcheMesure('ps', 'P/S (12 mois)', d.capitalisation.etat !== 'ok' ? d.capitalisation : d.ca_12_mois, ps === null ? 'n/d' : marcheNombre(ps) + 'x'),
      marcheMesure('perf6', 'Cours sur 6 mois', perf6 === null && d.cours.etat !== 'ok' ? d.cours : d.cours_6_mois, perf6 === null ? 'n/d' : marcheVariation(perf6, 0)),
      marcheMesure('perf12', 'Cours sur 12 mois', perf12 === null && d.cours.etat !== 'ok' ? d.cours : d.cours_12_mois, perf12 === null ? 'n/d' : marcheVariation(perf12, 0)),
    ],
  };
}

// ── Registre des modules ──────────────────────────────────────────────────────
// Ajouter un module = ajouter une ligne ici (et son collecteur dans scripts/marche/sources.mjs).
// Les autres modules n'ont pas à changer. Un module dont `lire` vaut null a son emplacement
// réservé mais n'entre dans aucune règle.

var MARCHE_MODULES = [
  { cle: 'flux', titre: 'Flux / short interest', lire: marcheLireFlux },
  { cle: 'attentes', titre: 'Attentes / analystes', lire: marcheLireAttentes },
  { cle: 'valorisation', titre: 'Valorisation', lire: marcheLireValorisation },
  // Module D — contexte de marché (taux, liquidité, sentiment sectoriel) : hors V1 par société.
  // La page affiche seulement un bandeau commun, lu dans data/macro.json.
  { cle: 'contexte', titre: 'Contexte de marché', lire: null },
];

// ── La grille ─────────────────────────────────────────────────────────────────
// Une règle = { etiquette, famille, modules cités dans les raisons, si(signaux, config) }.
// Pour une famille d'alerte donnée, les règles sont essayées DANS L'ORDRE : la première vraie
// donne l'étiquette. L'ordre est donc lui-même une hypothèse, lisible ici.

var MARCHE_REGLES = [
  // ── Bascule ──
  { etiquette: 'conteste', famille: 'bascule', modules: ['flux'],
    note: 'Squeeze possible ou scepticisme fondé : la couche marché ne tranche pas.',
    si: function (s) { return s.flux.niveau === 'eleve' && s.flux.tendance === 'hausse'; } },
  { etiquette: 'deja-dans-le-cours', famille: 'bascule', modules: ['attentes', 'valorisation'],
    si: function (s, config) {
      var constats = [s.attentes.consensus === 'tres-haussier', s.valorisation.hausseForte === true];
      // En pré-revenus le multiple est sans objet : il ne compte ni pour ni contre.
      if (s.valorisation.multiple !== 'sans-objet') constats.push(s.valorisation.multiple === 'eleve');
      return constats.filter(Boolean).length >= Math.min(config.grille.dejaDansLeCoursMinSignaux, constats.length);
    } },
  { etiquette: 'confirmation', famille: 'bascule', modules: ['attentes'],
    si: function (s) { return s.attentes.surprise === 'beat'; } },
  { etiquette: 'asymetrie-favorable', famille: 'bascule', modules: ['valorisation', 'attentes', 'flux'],
    si: function (s) {
      return s.valorisation.multiple === 'raisonnable'
        && (s.attentes.consensus === 'prudent' || s.attentes.couvertureFaible === true)
        && (s.flux.niveau === 'bas' || s.flux.tendance === 'baisse');
    } },
  // ── Rechute ──
  { etiquette: 'pression-renforcee', famille: 'rechute', modules: ['flux', 'attentes'],
    si: function (s) { return s.flux.tendance === 'hausse' || s.attentes.tendance === 'baisse'; } },
  { etiquette: 'risque-de-revisions', famille: 'rechute', modules: ['attentes'],
    si: function (s) { return s.attentes.consensus === 'tres-haussier'; } },
];

// ── Alerte de référence ───────────────────────────────────────────────────────

/**
 * La dernière alerte ÉMISE par le moteur du tracker sur la série d'une société.
 * `serie` = sortie de moteurDepuisFichier ; `publications` = les publications triées comme elle.
 * Lecture seule : rien n'est recalculé ici. Rend null si aucune alerte n'a jamais été émise.
 */
function marcheAlerteDeReference(serie, publications, config) {
  for (var i = serie.length - 1; i >= 0; i--) {
    var alertes = serie[i].alertes;
    if (!alertes || !alertes.length) continue;
    var code = config.grille.priorite.filter(function (p) { return alertes.indexOf(p) !== -1; })[0] || alertes[0];
    return { code: code, date: serie[i].date, trimestre: publications[i] ? publications[i].trimestre : null,
      solde: serie[i].solde, publicationsDepuis: serie.length - 1 - i };
  }
  return null;
}

// ── Lecture ───────────────────────────────────────────────────────────────────

/**
 * La lecture de marché d'une société.
 * entree = { alerte (sortie de marcheAlerteDeReference, ou null), societe {archetype}, donnees (bloc
 * de l'instantané pour cette société, ou null), config (MARCHE_CONFIG), aujourdhui 'AAAA-MM-JJ' }.
 * Rend { etiquette: {code, libelle}, raisons: [texte…], note, modules: {flux, attentes, valorisation} }.
 */
function lectureMarche(entree) {
  var config = entree.config, donnees = entree.donnees || {};
  var modules = {};
  MARCHE_MODULES.forEach(function (m) {
    if (m.lire) modules[m.cle] = m.lire(donnees[m.cle], entree.societe, config, entree.aujourdhui);
  });
  var cles = Object.keys(modules);
  var signaux = {};
  cles.forEach(function (cle) { signaux[cle] = modules[cle].signaux; });

  // Une alerte ancienne est croisée avec le marché d'AUJOURD'HUI : on le dit, sans changer l'étiquette.
  var anciennete = entree.alerte && entree.alerte.publicationsDepuis > 0
    ? 'Alerte émise il y a ' + entree.alerte.publicationsDepuis + ' publication' + (entree.alerte.publicationsDepuis > 1 ? 's' : '')
      + '\u00a0: elle est croisée avec les données de marché d’aujourd’hui, pas avec celles du jour de l’alerte.'
    : null;
  var rendre = function (code, raisons, note) {
    return { etiquette: { code: code, libelle: MARCHE_ETIQUETTES[code].libelle }, raisons: raisons, note: note || null,
      anciennete: anciennete, modules: modules };
  };
  var resumes = function (liste) {
    return liste.map(function (cle) { return modules[cle].resume; }).filter(Boolean);
  };
  var defauts = [];
  cles.forEach(function (cle) { defauts = defauts.concat(modules[cle].defauts); });

  if (!entree.alerte) return rendre('sans-alerte', ['le tracker n’a émis aucune alerte sur cette société'], 'Pas d’alerte, pas de croisement : les données de marché sont affichées pour information.');

  var famille = config.grille.familles[entree.alerte.code];

  // Un Signal faible reste un signal faible, quelle que soit la lecture — données incomplètes comprises.
  if (famille === 'signal-faible') {
    return rendre('a-surveiller', resumes(cles).concat(defauts),
      'La couche marché ne transforme jamais un Signal faible en conviction.');
  }

  // Toute autre alerte : une donnée indispensable manquante ou périmée suffit à suspendre la lecture.
  if (defauts.length) return rendre('lecture-incomplete', defauts, 'Une donnée manquante ou trop ancienne : aucun croisement n’est tenté.');

  for (var i = 0; i < MARCHE_REGLES.length; i++) {
    var regle = MARCHE_REGLES[i];
    if (regle.famille === famille && regle.si(signaux, config)) return rendre(regle.etiquette, resumes(regle.modules), regle.note);
  }
  return rendre('sans-lecture-tranchee', resumes(cles), 'Aucun croisement de la grille ne s’applique à ces données.');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MARCHE_ETIQUETTES: MARCHE_ETIQUETTES,
    MARCHE_MODULES: MARCHE_MODULES,
    MARCHE_REGLES: MARCHE_REGLES,
    marcheDonnee: marcheDonnee,
    marcheAlerteDeReference: marcheAlerteDeReference,
    lectureMarche: lectureMarche,
  };
}
