/**
 * tracker-modele.js — Vocabulaire et validation du tracker d'inflexions.
 *
 * Source de vérité du calcul : docs/tracker-methode.md (v1.3 figée le 21 novembre 2026).
 * Ce fichier ne calcule RIEN : il nomme ce que la méthode nomme, il valide la forme des fichiers
 * de data/tracker/ et il dit quel état vide afficher. Le solde et les alertes sont dérivés des sens
 * par un moteur qui n'existe pas encore (v1.3 non validée, données de référence du backtest hors dépôt) :
 * soldeDe() et alertesDe() le disent au lieu de deviner.
 *
 * Globales `var` et déclarations de fonctions : le fichier se charge dans node:vm pour les tests
 * (CLAUDE.md §8), sans dépendance ni navigateur.
 */
'use strict';

// ── Méthode de référence ──────────────────────────────────────────────────────

var TRACKER_METHODE = {
  version: '1.3',
  statut: 'figée',
  fige: true,
  // Validée par Flo le 21 novembre 2026, les huit précisions de §11 comprises (dont les trois vrais choix 1, 2 et 6).
  dateFige: '2026-11-21',
  document: 'docs/tracker-methode.md',
  precisionsEnAttente: 0,
};

// Le moteur d'alertes est implémenté (moteurAlertes, plus bas) : transcription littérale du
// pseudo-code de §6, qui fait foi, vérifiée contre les trois suites de référence de §13
// (test/tracker-moteur.test.mjs : CrowdStrike, Plug Power, Fisker — 52 publications).
var TRACKER_MOTEUR = {
  present: true,
  version: '1.3',
  implemente: '2026-11-21',
  regle: 'docs/tracker-methode.md §6 (pseudo-code faisant foi)',
  etat: 'Le moteur de la v1.3 (§6) est implémenté et vérifié contre les suites de référence de §13 : le solde et les alertes se calculent dès qu’une publication est saisie.',
};

// ── Les quatre sens (§4) ──────────────────────────────────────────────────────
// « non-publie » ne compte pas dans le solde : signe null, et non 0.

var TRACKER_SENS = {
  hausse: { signe: 1, libelle: 'Hausse', abrege: '+1' },
  stable: { signe: 0, libelle: 'Stable', abrege: '0' },
  baisse: { signe: -1, libelle: 'Baisse', abrege: '−1' },
  'non-publie': { signe: null, libelle: 'Non publié', abrege: 'n.p.' },
};

var TRACKER_SENS_CODES = Object.keys(TRACKER_SENS);

// ── Les quatre dimensions (§4) ────────────────────────────────────────────────

var TRACKER_DIMENSIONS = [
  { cle: 'd1', code: 'D1', titre: 'Revenus de la thèse' },
  { cle: 'd2', code: 'D2', titre: 'Demande engagée' },
  { cle: 'd3', code: 'D3', titre: 'Prévision et jalons' },
  { cle: 'd4', code: 'D4', titre: 'Rentabilité' },
];

var TRACKER_DIMENSION_CLES = TRACKER_DIMENSIONS.map(function (d) { return d.cle; });

// ── Les quatre alertes (§6) ───────────────────────────────────────────────────

var TRACKER_ALERTES = [
  { code: 'bascule', libelle: 'Bascule' },
  { code: 'bascule-commerciale', libelle: 'Bascule commerciale' },
  { code: 'signal-faible', libelle: 'Signal faible' },
  { code: 'rechute', libelle: 'Rechute' },
];

var TRACKER_ALERTE_CODES = TRACKER_ALERTES.map(function (a) { return a.code; });

// ── Archétypes (§2) ───────────────────────────────────────────────────────────

var TRACKER_ARCHETYPES = {
  'pre-revenus': { libelle: 'Pré-revenus' },
  plateforme: { libelle: 'Plateforme' },
  industriel: { libelle: 'Industriel' },
};

var TRACKER_ARCHETYPE_CODES = Object.keys(TRACKER_ARCHETYPES);

// ── Indicateur de demande (§2), dans l'ordre de préférence de la méthode ──────

var TRACKER_INDICATEURS_DEMANDE = ['commandes', 'carnet', 'clients', 'abonnes', 'barreau-reservations', 'non-publie'];

// ── Statuts de prévision (§5) ─────────────────────────────────────────────────

var TRACKER_STATUTS_PREVISION = {
  relevee: { libelle: 'Relevée', sens: 'hausse' },
  abaissee: { libelle: 'Abaissée', sens: 'baisse' },
  manquee: { libelle: 'Manquée', sens: 'baisse' },
  maintenue: { libelle: 'Maintenue', sens: 'stable' },
  nouvelle: { libelle: 'Nouvelle', sens: 'stable' },
  'non-publie': { libelle: 'Non publié', sens: 'non-publie' },
};

var TRACKER_STATUT_PREVISION_CODES = Object.keys(TRACKER_STATUTS_PREVISION);

// ── Marge brute : garde-fou des Bascules (§6) ─────────────────────────────────
// « sans-objet » : la société ne présente aucune ligne de coût des ventes ; le garde-fou ne joue pas, et on le note.
// Les deux derniers états constatent une absence : ils s'affichent comme les autres états incomplets.

var TRACKER_MARGE_BRUTE = {
  positive: { libelle: 'Positive', incomplet: false },
  nulle: { libelle: 'Nulle', incomplet: false },
  negative: { libelle: 'Négative', incomplet: false },
  'non-calculable': { libelle: 'Non calculable', incomplet: true },
  'sans-objet': { libelle: 'Garde-fou sans objet', incomplet: true },
};

var TRACKER_ETATS_MARGE_BRUTE = Object.keys(TRACKER_MARGE_BRUTE);

// ── Condition de financement (§7) ─────────────────────────────────────────────
// Hors du solde : ne déclenche ni ne bloque aucune alerte. « Si une mesure manque, la couleur est
// non déterminée, pas verte » : c'est la valeur par défaut, jamais le vert.

var TRACKER_FINANCEMENT = {
  vert: { libelle: 'Vert' },
  orange: { libelle: 'Orange' },
  rouge: { libelle: 'Rouge' },
  'non-determinee': { libelle: 'Non déterminée' },
};

var TRACKER_FINANCEMENT_CODES = Object.keys(TRACKER_FINANCEMENT);
var TRACKER_FINANCEMENT_DEFAUT = 'non-determinee';
var TRACKER_FINANCEMENT_MOTIFS = ['autonomie', 'dilution', 'engagements'];

// ── Drapeaux de calcul (§10) ──────────────────────────────────────────────────
// Les trois que la méthode produit. Les cinq drapeaux éditoriaux de §10 se saisissent à la main
// et ne sont pas de cette session : aucun emplacement ne leur est réservé ici.

var TRACKER_DRAPEAUX = {
  'vend-a-perte': { libelle: 'Vend à perte' },
  'remuneration-actions': { libelle: 'Rémunération en actions' },
  hesitation: { libelle: 'Hésitation' },
};

var TRACKER_DRAPEAU_CODES = Object.keys(TRACKER_DRAPEAUX);

// ── Échelle d'engagement, pré-revenus (§8) ────────────────────────────────────

var TRACKER_BARREAUX = [
  { niveau: 0, libelle: 'Annonce' },
  { niveau: 1, libelle: 'Intention' },
  { niveau: 2, libelle: 'Accord-cadre' },
  { niveau: 3, libelle: 'Accord définitif sous conditions' },
  { niveau: 4, libelle: 'Contrat ferme' },
  { niveau: 5, libelle: 'Revenu récurrent' },
];

// ── Sources (§3) ──────────────────────────────────────────────────────────────

var TRACKER_TYPES_SOURCE = ['8-K', '10-Q', '10-K', 'communique', 'lettre-actionnaires', 'presentation'];

var JOUR = /^\d{4}-\d{2}-\d{2}$/;
var IDENTIFIANT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Une source est valide si elle nomme son type, son jour et son adresse. Sans les trois, elle ne prouve rien. */
function sourceValide(source) {
  return Boolean(source)
    && typeof source === 'object'
    && TRACKER_TYPES_SOURCE.indexOf(source.type) !== -1
    && JOUR.test(source.date)
    && typeof source.url === 'string'
    && source.url.length > 0;
}

/**
 * Règle d'affichage du tracker : une valeur sans source ne s'affiche pas.
 * Rend le champ {valeur, source} tel quel s'il est affichable, sinon null — jamais une valeur nue.
 */
function valeurSourcee(champ) {
  if (!champ || typeof champ !== 'object') return null;
  if (champ.valeur === undefined || champ.valeur === null || champ.valeur === '') return null;
  return sourceValide(champ.source) ? champ : null;
}

/**
 * Sens affichable d'une dimension. « non publié » est l'absence constatée : il se passe de source.
 * Tout autre sens exige la sienne ; sans elle, rien ne s'affiche (la ligne est par ailleurs invalide).
 */
function sensAffichable(dimension) {
  if (!dimension || typeof dimension !== 'object') return null;
  if (TRACKER_SENS_CODES.indexOf(dimension.sens) === -1) return null;
  if (dimension.sens === 'non-publie') return 'non-publie';
  return sourceValide(dimension.source) ? dimension.sens : null;
}

// ── Moteur d'alertes (§6 — le pseudo-code fait foi) ──────────────────────────
// Transcription littérale, dans l'ordre exact du pseudo-code : Bascule commerciale d'abord
// (possible dès la première publication), puis — hors première publication — la chaîne
// Bascule / Rechute / Signal faible, puis les deux fermetures de régime.

/** Somme des sens publiés (« non publié » ne compte pas). null si un sens manque ou sort de la méthode. */
function soldeDesSens(sens) {
  if (!sens || typeof sens !== 'object') return null;
  var solde = 0;
  for (var i = 0; i < TRACKER_DIMENSION_CLES.length; i++) {
    var code = sens[TRACKER_DIMENSION_CLES[i]];
    if (TRACKER_SENS_CODES.indexOf(code) === -1) return null;
    var signe = TRACKER_SENS[code].signe;
    if (signe !== null) solde += signe;
  }
  return solde;
}

/** Solde d'une publication du schéma data/tracker (§6 : de −4 à +4). null si la publication est malformée. */
function soldeDe(publication) {
  if (!publication || typeof publication !== 'object' || !publication.dimensions) return null;
  var sens = {};
  for (var i = 0; i < TRACKER_DIMENSION_CLES.length; i++) {
    var d = publication.dimensions[TRACKER_DIMENSION_CLES[i]];
    if (!d || typeof d !== 'object') return null;
    sens[TRACKER_DIMENSION_CLES[i]] = d.sens;
  }
  return soldeDesSens(sens);
}

/** Signal faible, condition de transition : D2 ou D3 passe en hausse depuis un sens PUBLIÉ stable ou baisse.
 *  Un « non publié » précédent ne vaut ni 0 ni −1 : il ne déclenche rien (§6). */
function transitionHausse(sensPrecedents, sensCourants) {
  for (var i = 0; i < 2; i++) {
    var cle = ['d2', 'd3'][i];
    if (sensCourants[cle] === 'hausse' && (sensPrecedents[cle] === 'stable' || sensPrecedents[cle] === 'baisse')) return true;
  }
  return false;
}

/**
 * Le moteur (§6). entree = { archetype, lignes: [{date?, sens:{d1..d4}, margeBrute, barreau}] },
 * lignes de la plus ancienne à la plus récente. Rend, par publication :
 * { date, solde, alertes, retenues, drapeaux, regime } — `retenues` : alertes dont toutes les
 * conditions sont réunies sauf la marge brute (le garde-fou les retient) ; `drapeaux` : « vend à
 * perte », émis par la branche Bascule seulement, comme le pseudo-code l'écrit ; `regime` : l'état
 * APRÈS la publication (aucun | bascule | rechute).
 */
function moteurAlertes(entree) {
  if (!entree || TRACKER_ARCHETYPE_CODES.indexOf(entree.archetype) === -1) {
    throw new Error('moteurAlertes : archetype attendu parmi ' + TRACKER_ARCHETYPE_CODES.join(', '));
  }
  if (!Array.isArray(entree.lignes)) throw new Error('moteurAlertes : lignes attendues en tableau');
  var preRevenus = entree.archetype === 'pre-revenus';
  var regime = 'aucun';
  var basculeCommercialeEmise = false;
  var soldePrecedent = null;
  var sensPrecedents = null;
  var resultats = [];

  entree.lignes.forEach(function (ligne, i) {
    var solde = soldeDesSens(ligne.sens);
    if (solde === null) throw new Error('moteurAlertes : sens invalide à la publication ' + (i + 1));
    if (TRACKER_ETATS_MARGE_BRUTE.indexOf(ligne.margeBrute) === -1) {
      throw new Error('moteurAlertes : marge brute invalide à la publication ' + (i + 1));
    }
    // mb_ok = (marge brute calculable et > 0) ou (garde-fou sans objet)
    var mbOk = ligne.margeBrute === 'positive' || ligne.margeBrute === 'sans-objet';
    var alertes = [];
    var retenues = [];
    var drapeaux = [];

    // si pré-revenus et barreau >= 4 et non bascule_commerciale_émise et mb_ok : alerte, émise = oui
    if (preRevenus && typeof ligne.barreau === 'number' && ligne.barreau >= 4 && !basculeCommercialeEmise) {
      if (mbOk) { alertes.push('bascule-commerciale'); basculeCommercialeEmise = true; }
      else retenues.push('bascule-commerciale'); // non consommée : elle part à la première marge brute positive
    }

    // si ce n'est pas la première publication de la société :
    if (i > 0) {
      if (solde >= 2 && regime !== 'bascule') {
        if (mbOk) { alertes.push('bascule'); regime = 'bascule'; }
        else { retenues.push('bascule'); drapeaux.push('vend-a-perte'); } // aucune alerte, régime inchangé
      } else if (solde <= -2 && regime !== 'rechute') {
        alertes.push('rechute'); regime = 'rechute';
      } else if (regime !== 'bascule' && solde < 2 && soldePrecedent <= 0 && transitionHausse(sensPrecedents, ligne.sens)) {
        alertes.push('signal-faible');
      }
      if (regime === 'bascule' && solde <= 0 && soldePrecedent <= 0) regime = 'aucun';
      if (regime === 'rechute' && solde >= 0 && soldePrecedent >= 0) regime = 'aucun';
    }

    resultats.push({
      date: ligne.date === undefined ? null : ligne.date,
      solde: solde,
      alertes: alertes,
      retenues: retenues,
      drapeaux: drapeaux,
      regime: regime,
    });
    soldePrecedent = solde;
    sensPrecedents = ligne.sens;
  });
  return resultats;
}

/**
 * Adaptateur depuis le schéma data/tracker : trie les publications par date, dérive le barreau
 * de chaque ligne (le plus haut atteint par les événements commerciaux datés au plus tard du jour
 * de la publication, §4 et §8), puis déroule le moteur. Le fichier doit avoir été validé
 * (validerFichierSociete) ; l'entrée de catalogue fournit l'archétype.
 */
function moteurDepuisFichier(entreprise, fichier) {
  if (!entreprise || TRACKER_ARCHETYPE_CODES.indexOf(entreprise.archetype) === -1) {
    throw new Error('moteurDepuisFichier : entrée de catalogue avec archetype attendue');
  }
  if (!fichier || !Array.isArray(fichier.publications)) throw new Error('moteurDepuisFichier : fichier société attendu');
  var tri = function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; };
  var publications = fichier.publications.slice().sort(tri);
  var evenements = (fichier.evenements_commerciaux || []).slice();
  var lignes = publications.map(function (p) {
    var sens = {};
    TRACKER_DIMENSION_CLES.forEach(function (cle) { sens[cle] = p.dimensions[cle].sens; });
    var barreau = null;
    evenements.forEach(function (ev) {
      if (ev.date <= p.date && (barreau === null || ev.barreau > barreau)) barreau = ev.barreau;
    });
    return { date: p.date, sens: sens, margeBrute: p.marge_brute.etat, barreau: barreau };
  });
  return moteurAlertes({ archetype: entreprise.archetype, lignes: lignes });
}

// ── États vides ───────────────────────────────────────────────────────────────

/** 'aucune-entreprise' quand le tracker ne suit encore personne, 'ok' sinon. */
function etatCatalogue(catalogue) {
  if (!catalogue || !Array.isArray(catalogue.entreprises)) return 'catalogue-illisible';
  return catalogue.entreprises.length === 0 ? 'aucune-entreprise' : 'ok';
}

/** 'sans-publication' quand la société est suivie mais n'a encore aucune ligne, 'ok' sinon. */
function etatFiche(fichier) {
  if (!fichier || !Array.isArray(fichier.publications)) return 'fiche-illisible';
  return fichier.publications.length === 0 ? 'sans-publication' : 'ok';
}

/** 'aucun' quand aucun événement commercial n'est relevé. */
function etatEvenements(fichier) {
  if (!fichier || !Array.isArray(fichier.evenements_commerciaux)) return 'evenements-illisibles';
  return fichier.evenements_commerciaux.length === 0 ? 'aucun' : 'ok';
}

// ── Validation de la forme des fichiers ───────────────────────────────────────

function exigerSource(source, chemin, erreurs) {
  if (!sourceValide(source)) erreurs.push(chemin + ' : source absente ou incomplète (type, date, url)');
}

function exigerChaine(valeur, chemin, erreurs) {
  if (typeof valeur !== 'string' || valeur.length === 0) erreurs.push(chemin + ' : chaîne non vide attendue');
}

function exigerJour(valeur, chemin, erreurs) {
  if (!JOUR.test(valeur)) erreurs.push(chemin + ' : jour AAAA-MM-JJ attendu');
}

/** data/tracker/entreprises.json — le catalogue des sociétés suivies. */
function validerCatalogue(json) {
  var erreurs = [];
  if (!json || typeof json !== 'object') return { valide: false, erreurs: ['catalogue : objet attendu'] };
  if (json.methode_version !== TRACKER_METHODE.version) {
    erreurs.push('methode_version : ' + TRACKER_METHODE.version + ' attendu');
  }
  if (json.methode_document !== TRACKER_METHODE.document) {
    erreurs.push('methode_document : ' + TRACKER_METHODE.document + ' attendu');
  }
  if (!Array.isArray(json.entreprises)) {
    erreurs.push('entreprises : tableau attendu');
    return { valide: false, erreurs: erreurs };
  }
  var vus = {};
  json.entreprises.forEach(function (e, i) {
    var c = 'entreprises[' + i + ']';
    if (!e || typeof e !== 'object') { erreurs.push(c + ' : objet attendu'); return; }
    if (!IDENTIFIANT.test(e.id)) erreurs.push(c + '.id : identifiant en minuscules et tirets attendu');
    else if (vus[e.id]) erreurs.push(c + '.id : ' + e.id + ' en double');
    else vus[e.id] = true;
    exigerChaine(e.nom, c + '.nom', erreurs);
    exigerChaine(e.recit, c + '.recit', erreurs);
    exigerJour(e.entree_tracker, c + '.entree_tracker', erreurs);
    if (TRACKER_ARCHETYPE_CODES.indexOf(e.archetype) === -1) {
      erreurs.push(c + '.archetype : ' + TRACKER_ARCHETYPE_CODES.join(', ') + ' attendu');
    }
    // Les paramètres de §2 sont fixés à l'entrée dans le tracker et portent chacun leur source.
    if (!e.ca_these || typeof e.ca_these !== 'object') erreurs.push(c + '.ca_these : objet {valeur, source} attendu');
    else { exigerChaine(e.ca_these.valeur, c + '.ca_these.valeur', erreurs); exigerSource(e.ca_these.source, c + '.ca_these.source', erreurs); }
    if (!e.indicateur_demande || typeof e.indicateur_demande !== 'object') {
      erreurs.push(c + '.indicateur_demande : objet {type, valeur, source} attendu');
    } else {
      if (TRACKER_INDICATEURS_DEMANDE.indexOf(e.indicateur_demande.type) === -1) {
        erreurs.push(c + '.indicateur_demande.type : ' + TRACKER_INDICATEURS_DEMANDE.join(', ') + ' attendu');
      }
      // « non-publie » est l'absence constatée : ni libellé ni source à produire.
      if (e.indicateur_demande.type !== 'non-publie') {
        exigerChaine(e.indicateur_demande.valeur, c + '.indicateur_demande.valeur', erreurs);
        exigerSource(e.indicateur_demande.source, c + '.indicateur_demande.source', erreurs);
      }
    }
    if (e.fichier !== 'data/tracker/' + e.id + '.json') {
      erreurs.push(c + '.fichier : data/tracker/' + e.id + '.json attendu');
    }
  });
  return { valide: erreurs.length === 0, erreurs: erreurs };
}

/** data/tracker/<id>.json — publications et événements commerciaux d'une société. */
function validerFichierSociete(json, idAttendu) {
  var erreurs = [];
  if (!json || typeof json !== 'object') return { valide: false, erreurs: ['fichier : objet attendu'] };
  // Le gabarit data/tracker/_modele.json n'appartient à aucune société : entreprise valant null.
  var gabarit = json.entreprise === null;
  if (!gabarit) {
    if (!IDENTIFIANT.test(json.entreprise)) erreurs.push('entreprise : identifiant attendu, ou null pour le gabarit');
    else if (idAttendu && json.entreprise !== idAttendu) erreurs.push('entreprise : ' + idAttendu + ' attendu');
  }
  if (json.methode_version !== TRACKER_METHODE.version) erreurs.push('methode_version : ' + TRACKER_METHODE.version + ' attendu');

  if (!Array.isArray(json.publications)) erreurs.push('publications : tableau attendu');
  else json.publications.forEach(function (p, i) { validerPublication(p, 'publications[' + i + ']', erreurs); });

  if (!Array.isArray(json.evenements_commerciaux)) erreurs.push('evenements_commerciaux : tableau attendu');
  else json.evenements_commerciaux.forEach(function (ev, i) { validerEvenement(ev, 'evenements_commerciaux[' + i + ']', erreurs); });

  return { valide: erreurs.length === 0, erreurs: erreurs };
}

function validerPublication(p, c, erreurs) {
  if (!p || typeof p !== 'object') { erreurs.push(c + ' : objet attendu'); return; }
  // §3 : une ligne par publication de résultats, datée du jour de la publication, avec sa source.
  exigerJour(p.date, c + '.date', erreurs);
  exigerChaine(p.trimestre, c + '.trimestre', erreurs);
  exigerSource(p.source, c + '.source', erreurs);

  if (!p.dimensions || typeof p.dimensions !== 'object') {
    erreurs.push(c + '.dimensions : objet à quatre clés (d1 à d4) attendu');
  } else {
    TRACKER_DIMENSION_CLES.forEach(function (cle) {
      var d = p.dimensions[cle], cd = c + '.dimensions.' + cle;
      if (!d || typeof d !== 'object') { erreurs.push(cd + ' : objet {sens, source} attendu'); return; }
      if (TRACKER_SENS_CODES.indexOf(d.sens) === -1) { erreurs.push(cd + '.sens : ' + TRACKER_SENS_CODES.join(', ') + ' attendu'); return; }
      // Une valeur sans source ne s'affiche pas : un sens publié sans source rend le fichier invalide.
      if (d.sens !== 'non-publie') exigerSource(d.source, cd + '.source', erreurs);
    });
    var inconnues = Object.keys(p.dimensions).filter(function (k) { return TRACKER_DIMENSION_CLES.indexOf(k) === -1; });
    if (inconnues.length) erreurs.push(c + '.dimensions : clé inconnue ' + inconnues.join(', '));
  }

  // §5 : le statut de prévision explique D3 ; il doit s'accorder avec le sens porté par d3.
  if (TRACKER_STATUT_PREVISION_CODES.indexOf(p.statut_prevision) === -1) {
    erreurs.push(c + '.statut_prevision : ' + TRACKER_STATUT_PREVISION_CODES.join(', ') + ' attendu');
  } else if (p.dimensions && p.dimensions.d3 && TRACKER_STATUTS_PREVISION[p.statut_prevision].sens !== p.dimensions.d3.sens) {
    erreurs.push(c + '.statut_prevision : ' + p.statut_prevision + ' donne le sens '
      + TRACKER_STATUTS_PREVISION[p.statut_prevision].sens + ', d3 porte ' + p.dimensions.d3.sens);
  }

  if (!p.marge_brute || typeof p.marge_brute !== 'object') {
    erreurs.push(c + '.marge_brute : objet {etat, source} attendu');
  } else {
    if (TRACKER_ETATS_MARGE_BRUTE.indexOf(p.marge_brute.etat) === -1) {
      erreurs.push(c + '.marge_brute.etat : ' + TRACKER_ETATS_MARGE_BRUTE.join(', ') + ' attendu');
    } else if (!TRACKER_MARGE_BRUTE[p.marge_brute.etat].incomplet) {
      exigerSource(p.marge_brute.source, c + '.marge_brute.source', erreurs);
    }
  }

  if (!p.financement || typeof p.financement !== 'object') {
    erreurs.push(c + '.financement : objet {couleur, motifs, source} attendu');
  } else {
    if (TRACKER_FINANCEMENT_CODES.indexOf(p.financement.couleur) === -1) {
      erreurs.push(c + '.financement.couleur : ' + TRACKER_FINANCEMENT_CODES.join(', ') + ' attendu');
    } else if (p.financement.couleur !== TRACKER_FINANCEMENT_DEFAUT) {
      // Une couleur affirmée repose sur des comptes : sans source, elle ne s'affiche pas.
      exigerSource(p.financement.source, c + '.financement.source', erreurs);
    }
    if (!Array.isArray(p.financement.motifs)) erreurs.push(c + '.financement.motifs : tableau attendu');
    else p.financement.motifs.forEach(function (m, j) {
      if (TRACKER_FINANCEMENT_MOTIFS.indexOf(m) === -1) erreurs.push(c + '.financement.motifs[' + j + '] : ' + TRACKER_FINANCEMENT_MOTIFS.join(', ') + ' attendu');
    });
  }

  if (!Array.isArray(p.drapeaux)) erreurs.push(c + '.drapeaux : tableau attendu');
  else p.drapeaux.forEach(function (d, j) {
    var cd = c + '.drapeaux[' + j + ']';
    if (!d || typeof d !== 'object') { erreurs.push(cd + ' : objet {code, source} attendu'); return; }
    if (TRACKER_DRAPEAU_CODES.indexOf(d.code) === -1) erreurs.push(cd + '.code : ' + TRACKER_DRAPEAU_CODES.join(', ') + ' attendu');
    exigerSource(d.source, cd + '.source', erreurs);
  });

  // Le solde et les alertes se calculent : les saisir serait les figer à la main.
  ['solde', 'alertes', 'score', 'phase'].forEach(function (interdit) {
    if (interdit in p) erreurs.push(c + '.' + interdit + ' : calculé, jamais saisi');
  });
}

function validerEvenement(ev, c, erreurs) {
  if (!ev || typeof ev !== 'object') { erreurs.push(c + ' : objet attendu'); return; }
  exigerJour(ev.date, c + '.date', erreurs);
  exigerChaine(ev.intitule, c + '.intitule', erreurs);
  // §8 : « le classement d'un événement est fait à la main, avec sa source ». Pas de barreau sans source.
  exigerSource(ev.source, c + '.source', erreurs);
  if (!Number.isInteger(ev.barreau) || ev.barreau < 0 || ev.barreau > 5) {
    erreurs.push(c + '.barreau : entier de 0 à 5 attendu');
  }
}

// Export CommonJS pour les tests qui préfèrent require() ; le navigateur ignore la branche.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TRACKER_METHODE: TRACKER_METHODE,
    TRACKER_MOTEUR: TRACKER_MOTEUR,
    TRACKER_SENS: TRACKER_SENS,
    TRACKER_DIMENSIONS: TRACKER_DIMENSIONS,
    TRACKER_ALERTES: TRACKER_ALERTES,
    TRACKER_ARCHETYPES: TRACKER_ARCHETYPES,
    TRACKER_STATUTS_PREVISION: TRACKER_STATUTS_PREVISION,
    TRACKER_MARGE_BRUTE: TRACKER_MARGE_BRUTE,
    TRACKER_FINANCEMENT: TRACKER_FINANCEMENT,
    TRACKER_DRAPEAUX: TRACKER_DRAPEAUX,
    TRACKER_BARREAUX: TRACKER_BARREAUX,
    sourceValide: sourceValide,
    valeurSourcee: valeurSourcee,
    sensAffichable: sensAffichable,
    soldeDe: soldeDe,
    moteurAlertes: moteurAlertes,
    moteurDepuisFichier: moteurDepuisFichier,
    etatCatalogue: etatCatalogue,
    etatFiche: etatFiche,
    etatEvenements: etatEvenements,
    validerCatalogue: validerCatalogue,
    validerFichierSociete: validerFichierSociete,
  };
}
