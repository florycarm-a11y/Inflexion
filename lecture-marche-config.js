/**
 * lecture-marche-config.js — Tous les seuils de la couche « lecture de marché ».
 *
 * C'est LE fichier à modifier pour régler la grille : aucune valeur ci-dessous n'est répétée dans
 * la logique (lecture-marche-modele.js), qui ne fait que les lire.
 *
 * Statut des valeurs : HYPOTHÈSES DE DÉPART, NON BACKTESTÉES. Aucun de ces seuils n'a été mesuré
 * sur un historique. La couche marché est hors du protocole de test de la méthode du tracker
 * (docs/tracker-methode.md, v1.3 figée) et ne la modifie en rien.
 *
 * Globale `var` : le fichier se charge dans le navigateur et dans node:vm pour les tests.
 */
'use strict';

var MARCHE_CONFIG = {
  version: 1,

  // ── Fraîcheur ───────────────────────────────────────────────────────────────
  // Âge maximal d'une donnée, en jours, compté depuis LA DATE DE LA DONNÉE (et non depuis la
  // collecte). Au-delà, la donnée est « périmée » : elle reste affichée, marquée comme telle,
  // mais ne nourrit plus aucune règle, et l'étiquette bascule en « Lecture incomplète ».
  fraicheur: {
    // FINRA publie deux relevés par mois, une dizaine de jours après la date de règlement :
    // un relevé « frais » a donc couramment 10 à 25 jours.
    position_courte: 35,
    position_precedente: 55,
    jours_couverture: 35,
    // Fait de page de garde du dernier 10-Q ou 10-K : un trimestre, plus le délai de dépôt.
    actions_en_circulation: 200,
    // Série mensuelle, datée du premier du mois.
    avis: 45,
    avis_reference: 150,
    objectifs: 45,
    bpa_trimestre: 45,
    // Dérivé des instantanés : valable jusqu'à la publication suivante (un trimestre).
    publie_vs_consensus: 120,
    capitalisation: 7,
    cours: 7,
    // Cours d'il y a 6 et 12 mois : leur date EST ancienne par construction. La fraîcheur se juge
    // sur le cours du jour ; ces deux-là ne se périment pas.
    cours_6_mois: null,
    cours_12_mois: null,
    // Date de clôture de la dernière période publiée : un trimestre, plus le délai de dépôt,
    // plus le trimestre en cours.
    ca_12_mois: 200,
  },

  // ── Module A — Flux / short interest ────────────────────────────────────────
  flux: {
    // Position courte en % des ACTIONS EN CIRCULATION (et non du flottant : aucune source gratuite
    // vérifiée ne publie le flottant). Le flottant étant plus petit, ce pourcentage MINORE le
    // « % du flottant » que citent les sites financiers.
    pctEleve: 10,   // « élevé » à partir de 10 %
    pctBas: 5,      // « bas » jusqu'à 5 %
    // Jours de couverture = position courte / volume quotidien moyen (calculé par FINRA).
    joursEleves: 7, // « élevé » à partir de 7 jours
    joursBas: 3,    // « bas » jusqu'à 3 jours
    // Variation de la position entre deux relevés, en % : en deçà, la tendance est « stable ».
    variationStable: 5,
  },

  // ── Module B — Attentes / analystes ─────────────────────────────────────────
  attentes: {
    couvertureFaible: 5,        // « faible couverture » jusqu'à 5 analystes
    partAchatTresHaussiere: 80, // consensus « très haussier » à partir de 80 % d'avis acheteurs
    partAchatPrudente: 60,      // consensus « prudent » jusqu'à 60 %
    // Évolution de la part d'avis acheteurs sur `moisReference` mois, en points : en deçà, « stable ».
    variationStable: 5,
    moisReference: 3,
    // Publié contre consensus, en % d'écart : « beat net » / « miss net » au-delà, « in-line » en deçà.
    ecartNet: 5,
  },

  // ── Module C — Valorisation ─────────────────────────────────────────────────
  valorisation: {
    // Multiple retenu : P/S = capitalisation / chiffre d'affaires des douze derniers mois.
    // Sans objet pour l'archétype « pré-revenus » (chiffre d'affaires nul ou symbolique).
    psEleve: 15,      // « élevé » à partir de 15 fois
    psRaisonnable: 8, // « raisonnable » jusqu'à 8 fois
    // « Le titre a déjà beaucoup monté » : l'un OU l'autre des deux seuils suffit.
    hausseForte6Mois: 50,   // + 50 % en six mois
    hausseForte12Mois: 100, // + 100 % en douze mois
    // Tolérance, en jours, pour retrouver une séance autour de la date visée (jours fériés).
    toleranceSeance: 7,
  },

  // ── Grille ──────────────────────────────────────────────────────────────────
  grille: {
    // « Déjà dans le cours ? » : nombre de constats à réunir parmi les trois (consensus très
    // haussier, multiple élevé, forte hausse récente). 3 = les trois ensemble, comme l'écrit la
    // grille de départ. À 2, un titre qui a perdu les deux tiers de sa valeur en six mois recevait
    // l'étiquette (Rocket Lab, collecte du 25 novembre 2026) : d'où le réglage strict.
    // En pré-revenus, le multiple est sans objet : les deux autres constats suffisent.
    dejaDansLeCoursMinSignaux: 3,
    // À quelle ligne de la grille se rattache chaque alerte du tracker. La Bascule commerciale
    // (pré-revenus) est lue comme une Bascule : c'est un choix de cette couche, pas de la méthode.
    familles: {
      bascule: 'bascule',
      'bascule-commerciale': 'bascule',
      rechute: 'rechute',
      'signal-faible': 'signal-faible',
    },
    // Si une même publication porte plusieurs alertes, laquelle sert de référence.
    priorite: ['rechute', 'bascule', 'bascule-commerciale', 'signal-faible'],
  },
};

if (typeof module !== 'undefined' && module.exports) module.exports = { MARCHE_CONFIG: MARCHE_CONFIG };
