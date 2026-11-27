/**
 * lecture-marche-vue.js — Rendu de marche.html : une ligne par société du tracker.
 *
 * Sens unique : cette vue charge le catalogue et les fiches du tracker EN LECTURE, fait tourner
 * le moteur du tracker tel quel (moteurDepuisFichier), puis passe sa sortie au modèle de la couche
 * marché (lectureMarche) avec l'instantané data/marche/instantane.json. Rien n'est renvoyé vers
 * le tracker, et aucune règle de l'un ou l'autre modèle n'est réécrite ici.
 *
 * Ordre de chargement : tracker-modele.js, lecture-marche-config.js, lecture-marche-modele.js, puis ce fichier.
 * Comme tracker-vue.js : aucune donnée n'entre par innerHTML, tout texte passe par textContent.
 */
'use strict';

(function () {

function el(balise, attributs, enfants) {
  var n = document.createElement(balise);
  if (attributs) Object.keys(attributs).forEach(function (k) { n.setAttribute(k, attributs[k]); });
  [].concat(enfants || []).forEach(function (enfant) {
    if (enfant === null || enfant === undefined || enfant === false) return;
    n.appendChild(typeof enfant === 'string' ? document.createTextNode(enfant) : enfant);
  });
  return n;
}

function charger(chemin) {
  return fetch(chemin, { cache: 'no-store' }).then(function (r) {
    if (!r.ok) throw new Error(chemin + ' : HTTP ' + r.status);
    return r.json();
  });
}

function etatVide(titre, precision) {
  return el('div', { class: 'tk-vide' }, [el('p', { class: 'tk-vide-titre' }, titre), precision ? el('p', { class: 'tk-vide-precision' }, precision) : null]);
}

/** La source d'une donnée de marché : son nom et son jour, cliquables. */
function lienSourceMarche(source, date) {
  if (!source) return null;
  return el('a', { class: 'tk-source', href: source.url, rel: 'noopener', target: '_blank' }, source.nom + ' · ' + date);
}

function libelleAlerte(code) {
  for (var i = 0; i < TRACKER_ALERTES.length; i++) if (TRACKER_ALERTES[i].code === code) return TRACKER_ALERTES[i].libelle;
  return code;
}

// ── Cellules ──────────────────────────────────────────────────────────────────

/** La colonne du tracker : la dernière alerte émise par le moteur, telle quelle. */
function celluleAlerte(alerte, fichier) {
  if (!fichier || !fichier.publications.length) return el('td', { class: 'lm-col-tracker' }, el('span', { class: 'tk-np' }, 'Aucune publication'));
  if (!alerte) return el('td', { class: 'lm-col-tracker' }, el('span', { class: 'tk-np' }, 'Aucune alerte'));
  var solde = alerte.solde > 0 ? '+' + alerte.solde : alerte.solde < 0 ? '−' + (-alerte.solde) : '0';
  var depuis = alerte.publicationsDepuis === 0 ? 'dernière publication'
    : alerte.publicationsDepuis + ' publication' + (alerte.publicationsDepuis > 1 ? 's' : '') + ' depuis';
  return el('td', { class: 'lm-col-tracker' }, [
    el('span', { class: 'lm-alerte' }, libelleAlerte(alerte.code)),
    el('span', { class: 'lm-alerte-detail tk-donnee' }, alerte.trimestre + ' · ' + alerte.date),
    el('span', { class: 'lm-alerte-detail' }, 'solde ' + solde + ' · ' + depuis),
  ]);
}

function celluleLecture(lecture) {
  return el('td', {}, [
    el('span', { class: 'lm-etiquette lm-etiquette--' + lecture.etiquette.code }, lecture.etiquette.libelle),
    el('p', { class: 'lm-pourquoi' }, [el('strong', {}, 'Pourquoi : '), lecture.raisons.join(' · ')]),
    lecture.note ? el('p', { class: 'lm-note' }, lecture.note) : null,
    lecture.anciennete ? el('p', { class: 'lm-note' }, lecture.anciennete) : null,
  ]);
}

/** Un module : ses mesures, chacune avec sa source et sa date ; « n/d » et « périmée » en toutes lettres. */
function celluleModule(module) {
  return el('td', {}, el('ul', { class: 'lm-mesures' }, module.mesures.map(function (m) {
    return el('li', {}, [
      el('span', { class: 'lm-mesure-libelle' }, m.libelle),
      m.etat === 'nd' || m.texte === 'n/d' ? el('span', { class: 'tk-np' }, 'n/d') : el('span', { class: 'tk-donnee' }, m.texte),
      m.etat === 'perimee' ? el('span', { class: 'tk-np lm-perimee' }, 'périmée') : null,
      m.saisie ? el('span', { class: 'tk-np lm-perimee' }, 'saisie manuelle') : null,
      ' ', lienSourceMarche(m.source, m.date),
      m.etat === 'nd' && m.motif ? el('span', { class: 'lm-motif' }, m.motif) : null,
    ]);
  })));
}

function celluleFraicheur(lecture, collecte) {
  var nd = 0, perimees = 0;
  Object.keys(lecture.modules).forEach(function (cle) {
    lecture.modules[cle].mesures.forEach(function (m) {
      if (m.etat === 'perimee') perimees++;
      else if (m.etat === 'nd' || m.texte === 'n/d') nd++;
    });
  });
  return el('td', { class: 'lm-fraicheur' }, [
    el('span', { class: 'tk-donnee' }, 'Collecte ' + collecte),
    el('span', {}, nd ? nd + ' mesure' + (nd > 1 ? 's' : '') + ' n/d' : 'Aucune mesure n/d'),
    el('span', {}, perimees ? perimees + ' périmée' + (perimees > 1 ? 's' : '') : 'Aucune périmée'),
  ]);
}

// ── Tableau ───────────────────────────────────────────────────────────────────

var MODULES_AFFICHES = MARCHE_MODULES.filter(function (m) { return m.lire; });

function rendreTableau(catalogue, fichiers, instantane, aujourdhui) {
  var lignes = catalogue.entreprises.map(function (e) {
    var fichier = fichiers[e.id], alerte = null;
    if (fichier && fichier.publications.length) {
      var publications = fichier.publications.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
      alerte = marcheAlerteDeReference(moteurDepuisFichier(e, fichier), publications, MARCHE_CONFIG);
    }
    var donnees = instantane.societes[e.id] || null;
    var lecture = lectureMarche({ alerte: alerte, societe: e, donnees: donnees, config: MARCHE_CONFIG, aujourdhui: aujourdhui });
    return el('tr', {}, [
      el('th', { scope: 'row' }, [
        el('a', { class: 'tk-lien lm-societe-nom', href: 'entreprise.html?id=' + encodeURIComponent(e.id) }, e.nom),
        el('span', { class: 'lm-ticker tk-donnee' }, (donnees && donnees.ticker ? donnees.ticker + ' · ' : '') + TRACKER_ARCHETYPES[e.archetype].libelle),
      ]),
      celluleAlerte(alerte, fichier),
      celluleLecture(lecture),
    ].concat(MODULES_AFFICHES.map(function (m) { return celluleModule(lecture.modules[m.cle]); }))
      .concat([celluleFraicheur(lecture, instantane.collecte)]));
  });

  return el('div', { class: 'tk-table-defile' }, el('table', { class: 'tk-table lm-table' }, [
    el('caption', {}, 'Alerte du tracker et lecture de marché, société par société'),
    el('thead', {}, [
      el('tr', {}, [
        el('th', { scope: 'col', rowspan: '2' }, 'Société'),
        el('th', { scope: 'colgroup', class: 'lm-groupe lm-col-tracker' }, 'Tracker · méthode figée v' + TRACKER_METHODE.version),
        el('th', { scope: 'colgroup', class: 'lm-groupe lm-groupe--marche', colspan: String(2 + MODULES_AFFICHES.length) }, 'Couche marché · hypothèses non backtestées'),
      ]),
      el('tr', {}, [el('th', { scope: 'col', class: 'lm-col-tracker' }, 'Dernière alerte'), el('th', { scope: 'col' }, 'Lecture')]
        .concat(MODULES_AFFICHES.map(function (m) { return el('th', { scope: 'col' }, m.titre); }))
        .concat([el('th', { scope: 'col' }, 'Fraîcheur')])),
    ]),
    el('tbody', {}, lignes),
  ]));
}

// ── Bandeau de contexte (module D : emplacement, sans règle) ──────────────────
// Lit data/macro.json, que fetch-data.yml collecte déjà (FRED). Aucune de ces valeurs n'entre
// dans une étiquette. Le libellé est écrit ici : FRED DTWEXBGS n'est pas le DXY, on ne l'affiche pas.

var CONTEXTE = [
  { id: 'DGS10', libelle: 'Taux américain à 10 ans' },
  { id: 'DFF', libelle: 'Taux directeur de la Fed' },
  { id: 'T10Y2Y', libelle: 'Pente 10 ans − 2 ans' },
  { id: 'WALCL', libelle: 'Bilan de la Fed', millions: true },
];

function rendreContexte(macro) {
  var parId = {};
  (macro && macro.indicators || []).forEach(function (i) { parId[i.id] = i; });
  var paires = [];
  CONTEXTE.forEach(function (c) {
    var i = parId[c.id];
    var ok = i && typeof i.value === 'number' && /^\d{4}-\d{2}-\d{2}$/.test(i.date || '');
    paires.push(el('div', {}, [
      el('dt', {}, c.libelle),
      el('dd', {}, ok
        ? [el('span', { class: 'tk-donnee' }, c.millions ? marcheNombre(i.value / 1000, 0) + ' Md$' : marcheNombre(i.value, 2) + ' %'), ' ',
          el('a', { class: 'tk-source', href: 'https://fred.stlouisfed.org/series/' + c.id, rel: 'noopener', target: '_blank' }, 'FRED · ' + i.date)]
        : el('span', { class: 'tk-np' }, 'n/d')),
    ]));
  });
  return el('dl', { class: 'lm-contexte' }, [
    el('p', { class: 'lm-contexte-titre' }, 'Contexte de marché — pour information, hors de toute étiquette'),
  ].concat(paires));
}

// ── Seuils en vigueur, lus dans la configuration (jamais recopiés à la main) ──

function rendreSeuils() {
  var c = MARCHE_CONFIG;
  var n = function (v) { return marcheNombre(v, 0); };
  return el('ul', { class: 'lm-seuils' }, [
    'Short interest « élevé » : au moins ' + n(c.flux.pctEleve) + ' % des actions en circulation ou ' + n(c.flux.joursEleves) + ' jours de couverture ; « bas » : au plus ' + n(c.flux.joursBas) + ' jours de couverture, et au plus ' + n(c.flux.pctBas) + ' % quand le pourcentage est connu. Un pourcentage bas ne suffit jamais seul.',
    'Publié contre consensus : « beat » ou « miss » au-delà de ' + n(c.attentes.ecartNet) + ' % d’écart, sur le consensus du dernier instantané daté strictement avant la publication et relevé au plus ' + c.attentes.consensusAgeMax + ' jours avant elle. Grandeurs comparées, dans l’ordre : ' + c.attentes.grandeursPublie.join(', ') + '.',
    'Tendance du short interest : hausse ou baisse au-delà de ' + n(c.flux.variationStable) + ' % entre deux relevés ; « stable » en deçà.',
    'Consensus « très haussier » : au moins ' + n(c.attentes.partAchatTresHaussiere) + ' % d’avis acheteurs ; « prudent » : au plus ' + n(c.attentes.partAchatPrudente) + ' %. Évolution de la part d’avis acheteurs sur ' + c.attentes.moisReference + ' mois : affichée à titre indicatif, elle n’entre dans aucune étiquette.',
    '« Faible couverture » : au plus ' + c.attentes.couvertureFaible + ' analystes, dans le décompte du Nasdaq.',
    'Multiple « élevé » : P/S d’au moins ' + n(c.valorisation.psEleve) + ' fois ; « raisonnable » : au plus ' + n(c.valorisation.psRaisonnable) + ' fois. Sans objet en pré-revenus.',
    '« Forte hausse » : au moins +' + n(c.valorisation.hausseForte6Mois) + ' % en six mois ou +' + n(c.valorisation.hausseForte12Mois) + ' % en douze mois.',
    '« Déjà dans le cours ? » : ' + c.grille.dejaDansLeCoursMinSignaux + ' constats requis sur trois (consensus très haussier, multiple élevé, forte hausse). En pré-revenus, le multiple est sans objet : les deux autres suffisent.',
    'Fraîcheur : short interest ' + c.fraicheur.position_courte + ' jours, avis d’analystes ' + c.fraicheur.avis + ' jours, cours ' + c.fraicheur.cours + ' jours, chiffre d’affaires ' + c.fraicheur.ca_12_mois + ' jours. Au-delà, la donnée est « périmée ».',
  ].map(function (t) { return el('li', {}, t); }));
}

// ── Amorçage ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  var hote = document.getElementById('lecture-marche');
  if (!hote) return;
  var seuils = document.getElementById('lecture-marche-seuils');
  if (seuils) { seuils.textContent = ''; seuils.appendChild(rendreSeuils()); }
  var contexte = document.getElementById('lecture-marche-contexte');
  if (contexte) {
    charger('data/macro.json').then(function (macro) { contexte.textContent = ''; contexte.appendChild(rendreContexte(macro)); })
      .catch(function () { contexte.textContent = ''; contexte.appendChild(rendreContexte(null)); });
  }

  var aujourdhui = new Date().toISOString().slice(0, 10);
  Promise.all([charger('data/tracker/entreprises.json'), charger('data/marche/instantane.json')]).then(function (recus) {
    var catalogue = recus[0], instantane = recus[1];
    var controle = validerCatalogue(catalogue);
    if (!controle.valide) throw new Error('catalogue du tracker non conforme : ' + controle.erreurs.join(' · '));
    return Promise.all(catalogue.entreprises.map(function (e) {
      return charger(e.fichier).then(function (f) { return [e.id, validerFichierSociete(f, e.id).valide ? f : null]; }, function () { return [e.id, null]; });
    })).then(function (paires) {
      var fichiers = {};
      paires.forEach(function (p) { fichiers[p[0]] = p[1]; });
      hote.textContent = '';
      hote.appendChild(rendreTableau(catalogue, fichiers, instantane, aujourdhui));
    });
  }).catch(function (erreur) {
    hote.textContent = '';
    hote.appendChild(etatVide('Lecture de marché indisponible', String(erreur && erreur.message ? erreur.message : erreur)));
  });
});

})();
