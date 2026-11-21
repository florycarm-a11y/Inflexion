/**
 * tracker-vue.js — Rendu de la fiche société (entreprise.html).
 *
 * La liste des sociétés suivies est rendue par la home (index.html, React) depuis le pivot
 * du 21 novembre 2026 ; cette vue ne porte plus que la fiche. Charge data/tracker/entreprises.json
 * puis data/tracker/<id>.json, et écrit le DOM. Tout passe par tracker-modele.js, chargé AVANT
 * ce fichier : aucune règle de la méthode n'est réécrite ici.
 *
 * Deux règles tenues par le rendu :
 *  - une valeur sans source ne s'affiche pas (valeurSourcee / sensAffichable) ;
 *  - aucune donnée n'entre par innerHTML : tout texte passe par textContent.
 */
'use strict';

(function () {

// ── Fabrique d'éléments ───────────────────────────────────────────────────────

function el(balise, attributs, enfants) {
  var n = document.createElement(balise);
  if (attributs) Object.keys(attributs).forEach(function (k) { n.setAttribute(k, attributs[k]); });
  [].concat(enfants || []).forEach(function (enfant) {
    if (enfant === null || enfant === undefined || enfant === false) return;
    n.appendChild(typeof enfant === 'string' ? document.createTextNode(enfant) : enfant);
  });
  return n;
}

/** Bloc d'état vide : un mot, jamais une teinte seule (--rule-incomplete est « un filet de renfort, jamais preuve unique »). */
function etatVide(titre, precision) {
  return el('div', { class: 'tk-vide' }, [
    el('p', { class: 'tk-vide-titre' }, titre),
    precision ? el('p', { class: 'tk-vide-precision' }, precision) : null,
  ]);
}

/** Lien de source : la preuve est cliquable, et porte le type et le jour du document. */
function lienSource(source) {
  if (!sourceValide(source)) return null;
  return el('a', { class: 'tk-source', href: source.url, rel: 'noopener', target: '_blank' },
    source.type + ' · ' + source.date);
}

/** Pastille de sens. Le libellé porte le sens ; la classe ne fait que renforcer. */
function pastilleSens(code) {
  var sens = TRACKER_SENS[code];
  return el('span', { class: 'tk-sens tk-sens--' + code, title: sens.libelle }, sens.abrege);
}

// ── Chargement ────────────────────────────────────────────────────────────────

function charger(chemin) {
  return fetch(chemin, { cache: 'no-store' }).then(function (r) {
    if (!r.ok) throw new Error(chemin + ' : HTTP ' + r.status);
    return r.json();
  });
}

function signalerErreur(hote, erreur) {
  hote.textContent = '';
  hote.appendChild(etatVide('Données du tracker illisibles', String(erreur && erreur.message ? erreur.message : erreur)));
}

// ── entreprise.html : la fiche d'une société ──────────────────────────────────

function ligneParametre(libelle, champ) {
  var affichable = valeurSourcee(champ);
  return el('div', { class: 'tk-param' }, [
    el('dt', {}, libelle),
    el('dd', {}, affichable
      ? el('span', {}, [affichable.valeur, ' ', lienSource(affichable.source)])
      : el('span', { class: 'tk-np' }, 'Non publié')),
  ]);
}

function rendreIdentite(entreprise) {
  var demande = entreprise.indicateur_demande;
  return el('section', { class: 'tk-bloc' }, [
    el('h2', {}, 'Paramètres de la société'),
    el('p', { class: 'tk-note' }, 'Fixés à l’entrée dans le tracker, avant lecture des chiffres. Ils ne changent plus ensuite.'),
    el('dl', { class: 'tk-params' }, [
      el('div', { class: 'tk-param' }, [el('dt', {}, 'Archétype'), el('dd', {}, TRACKER_ARCHETYPES[entreprise.archetype].libelle)]),
      el('div', { class: 'tk-param' }, [el('dt', {}, 'Récit'), el('dd', {}, entreprise.recit)]),
      ligneParametre('Chiffre d’affaires de la thèse', entreprise.ca_these),
      demande.type === 'non-publie'
        ? el('div', { class: 'tk-param' }, [el('dt', {}, 'Indicateur de demande'), el('dd', {}, el('span', { class: 'tk-np' }, 'Non publié'))])
        : ligneParametre('Indicateur de demande', demande),
    ]),
  ]);
}

/** Marge brute : le garde-fou des Bascules (§6). Les deux états d'absence se marquent comme les autres trous. */
function celluleMargeBrute(marge) {
  var etat = TRACKER_MARGE_BRUTE[marge.etat];
  if (etat.incomplet) return el('span', { class: 'tk-np' }, etat.libelle);
  return sourceValide(marge.source)
    ? el('span', {}, [etat.libelle, ' ', lienSource(marge.source)])
    : el('span', { class: 'tk-np' }, 'Source manquante');
}

function celluleFinancement(financement) {
  var couleur = financement.couleur;
  var libelle = TRACKER_FINANCEMENT[couleur].libelle;
  // §7 : hors du solde, et jamais vert par défaut. Les motifs se lisent à côté de la couleur.
  var motifs = financement.motifs.length ? ' (' + financement.motifs.join(', ') + ')' : '';
  var affiche = couleur === TRACKER_FINANCEMENT_DEFAUT || sourceValide(financement.source);
  return el('td', {}, affiche
    ? el('span', { class: 'tk-fin tk-fin--' + couleur }, libelle + motifs)
    : el('span', { class: 'tk-np' }, 'Source manquante'));
}

function rendrePublications(fichier) {
  if (etatFiche(fichier) === 'sans-publication') {
    return el('section', { class: 'tk-bloc' }, [
      el('h2', {}, 'Publications'),
      etatVide('Aucune publication relevée',
        'La société est suivie mais aucune publication de résultats n’a encore été lue. '
        + 'Une ligne par publication trimestrielle, datée du jour de la publication.'),
    ]);
  }

  var lignes = fichier.publications.map(function (p) {
    var cellulesSens = TRACKER_DIMENSION_CLES.map(function (cle) {
      var code = sensAffichable(p.dimensions[cle]);
      if (code === null) return el('td', { class: 'tk-donnee' }, el('span', { class: 'tk-np' }, 'Source manquante'));
      if (code === 'non-publie') return el('td', { class: 'tk-donnee' }, el('span', { class: 'tk-np' }, TRACKER_SENS['non-publie'].abrege));
      return el('td', { class: 'tk-donnee' }, [pastilleSens(code), ' ', lienSource(p.dimensions[cle].source)]);
    });

    var solde = soldeDe(p);
    var alertes = alertesDe(p);
    var drapeaux = p.drapeaux.filter(function (d) { return sourceValide(d.source); });

    return el('tr', {}, [
      el('th', { scope: 'row', class: 'tk-donnee' }, [p.date, el('br'), el('span', { class: 'tk-trimestre' }, p.trimestre), ' ', lienSource(p.source)]),
    ].concat(cellulesSens).concat([
      el('td', { class: 'tk-donnee' }, solde === null ? el('span', { class: 'tk-np' }, 'Non calculé') : String(solde)),
      el('td', {}, celluleMargeBrute(p.marge_brute)),
      celluleFinancement(p.financement),
      el('td', {}, drapeaux.length
        ? el('ul', { class: 'tk-drapeaux' }, drapeaux.map(function (d) {
          return el('li', {}, [TRACKER_DRAPEAUX[d.code].libelle, ' ', lienSource(d.source)]);
        }))
        : el('span', { class: 'tk-np' }, 'Aucun')),
      el('td', {}, alertes.length
        ? el('ul', { class: 'tk-alertes' }, alertes.map(function (a) { return el('li', {}, a.libelle); }))
        : el('span', { class: 'tk-np' }, 'Aucune alerte')),
    ]));
  });

  return el('section', { class: 'tk-bloc' }, [
    el('h2', {}, 'Publications'),
    el('p', { class: 'tk-note' }, TRACKER_MOTEUR.raison
      + ' Le solde et les alertes se déduisent des sens : ils restent non calculés tant que la méthode n’est pas figée.'),
    el('div', { class: 'tk-table-defile' }, [
      el('table', { class: 'tk-table' }, [
        el('caption', {}, 'Sens relevés à chaque publication de résultats'),
        el('thead', {}, el('tr', {}, [el('th', { scope: 'col' }, 'Publication')]
          .concat(TRACKER_DIMENSIONS.map(function (d) { return el('th', { scope: 'col', title: d.titre }, d.code); }))
          .concat(['Solde', 'Marge brute', 'Financement', 'Drapeaux', 'Alertes']
            .map(function (t) { return el('th', { scope: 'col' }, t); })))),
        el('tbody', {}, lignes),
      ]),
    ]),
  ]);
}

function rendreEvenements(fichier) {
  if (etatEvenements(fichier) === 'aucun') {
    return el('section', { class: 'tk-bloc' }, [
      el('h2', {}, 'Événements commerciaux'),
      etatVide('Aucun événement relevé',
        'L’échelle d’engagement va de l’annonce sans obligation au revenu récurrent. '
        + 'Le classement d’un événement est fait à la main, avec sa source.'),
    ]);
  }
  return el('section', { class: 'tk-bloc' }, [
    el('h2', {}, 'Événements commerciaux'),
    el('ul', { class: 'tk-evenements' }, fichier.evenements_commerciaux.map(function (ev) {
      var barreau = TRACKER_BARREAUX[ev.barreau];
      return el('li', {}, [
        el('span', { class: 'tk-donnee tk-barreau' }, 'Barreau ' + barreau.niveau),
        el('span', { class: 'tk-barreau-libelle' }, barreau.libelle),
        el('span', {}, ev.intitule),
        el('span', { class: 'tk-donnee' }, ev.date),
        lienSource(ev.source),
      ]);
    })),
  ]);
}

function rendreFiche(hote, catalogue, id) {
  hote.textContent = '';

  if (!id) {
    hote.appendChild(etatVide('Aucune société sélectionnée',
      'Cette page affiche la fiche d’une société du tracker. Choisissez-la dans la liste.'));
    hote.appendChild(el('p', {}, el('a', { class: 'tk-lien', href: 'index.html#societes' }, 'Voir les sociétés suivies')));
    return;
  }

  var controle = validerCatalogue(catalogue);
  if (!controle.valide) {
    hote.appendChild(etatVide('Catalogue non conforme au schéma', controle.erreurs.join(' · ')));
    return;
  }

  var entreprise = catalogue.entreprises.filter(function (e) { return e.id === id; })[0];
  if (!entreprise) {
    hote.appendChild(etatVide('Société inconnue',
      'Aucune société de ce nom n’est suivie par le tracker.'));
    hote.appendChild(el('p', {}, el('a', { class: 'tk-lien', href: 'index.html#societes' }, 'Voir les sociétés suivies')));
    return;
  }

  var titre = document.querySelector('.page-title');
  if (titre) titre.textContent = entreprise.nom;
  document.title = entreprise.nom + ' — Tracker d’inflexions — Inflexion';

  hote.appendChild(rendreIdentite(entreprise));

  charger(entreprise.fichier).then(function (fichier) {
    var ctrl = validerFichierSociete(fichier, entreprise.id);
    if (!ctrl.valide) {
      hote.appendChild(etatVide('Fichier de la société non conforme au schéma', ctrl.erreurs.join(' · ')));
      return;
    }
    hote.appendChild(rendrePublications(fichier));
    hote.appendChild(rendreEvenements(fichier));
  }).catch(function (erreur) {
    hote.appendChild(etatVide('Fichier de la société illisible', String(erreur.message || erreur)));
  });
}

// ── Amorçage ──────────────────────────────────────────────────────────────────

var CATALOGUE = 'data/tracker/entreprises.json';

document.addEventListener('DOMContentLoaded', function () {
  var fiche = document.getElementById('tracker-fiche');
  if (!fiche) return;

  charger(CATALOGUE).then(function (catalogue) {
    rendreFiche(fiche, catalogue, new URLSearchParams(window.location.search).get('id'));
  }).catch(function (erreur) {
    signalerErreur(fiche, erreur);
  });
});

})();
