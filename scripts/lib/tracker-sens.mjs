/**
 * scripts/lib/tracker-sens.mjs — Les calculateurs de sens de la méthode v1.3.
 *
 * Source de vérité : docs/tracker-methode.md. Ce module traduit §4, §5 et §6 en fonctions
 * pures, et RIEN d'autre : il ne lit aucun fichier, ne connaît aucune société.
 *
 * Il est partagé par la collecte publique (scripts/tracker-collecte-2026-11-21.mjs) et par le
 * rejeu de l'univers spatial (scripts/tracker-rejeu-spatial.mjs). Les deux doivent appliquer
 * exactement les mêmes règles : une seconde copie de ces calculs dériverait tôt ou tard, et le
 * rejeu ne mesurerait plus la méthode que le tracker applique.
 */

/** Croissance sur un an, calculée sur les montants publiés (précision 3). null si incalculable. */
export const croissance = (courant, anPasse) =>
  (courant === null || anPasse === null || anPasse === 0) ? null : (courant - anPasse) / anPasse * 100;

/** Marge, en % — non calculable si CA nul/négatif ou si la perte dépasse cent fois le CA (précision 1). */
export function marge(resultat, ca) {
  if (ca === null || resultat === null || ca <= 0) return null;
  if (resultat < 0 && Math.abs(resultat) > 100 * ca) return null;
  return resultat / ca * 100;
}

/** D1, et D2 par le nombre de clients : écart de croissance, seuil strict d'un point. */
export function sensEcart(courante, precedente) {
  if (courante === null || precedente === null || courante === undefined || precedente === undefined) return 'non-publie';
  const ecart = courante - precedente;
  if (ecart > 1) return 'hausse';
  if (ecart < -1) return 'baisse';
  return 'stable';
}

/** D2 carnet : commandes = variation du carnet + CA du trimestre ; ratio sur le CA du trimestre. */
export function sensCarnet(carnet, carnetPrecedent, caTrimestre) {
  if (carnet === null || carnetPrecedent === null || caTrimestre === null || caTrimestre <= 0) return 'non-publie';
  const ratio = ((carnet - carnetPrecedent) + caTrimestre) / caTrimestre;
  return ratio > 1.05 ? 'hausse' : ratio < 0.95 ? 'baisse' : 'stable';
}

/** D4 : marge opérationnelle du trimestre contre le même trimestre un an plus tôt. */
export function sensMargeOperationnelle(op, ca, opAnPasse, caAnPasse) {
  const m = marge(op, ca), mPrecedente = marge(opAnPasse, caAnPasse);
  if (m === null || mPrecedente === null) return 'non-publie';
  const seuil = m < 0 ? 5 : 2; // « ou de plus de 5 points si la marge du trimestre est négative »
  const ecart = m - mPrecedente;
  if (ecart > seuil) return 'hausse';
  if (ecart < -seuil) return 'baisse';
  return 'stable';
}

/** D1 pré-revenus : unités livrées, comparées au trimestre précédent. Zéro puis zéro vaut « stable ». */
export function sensUnites(unites, unitesPrecedent) {
  if (unitesPrecedent === null || unites === null) return 'non-publie';
  if (unites === 0 && unitesPrecedent === 0) return 'stable';
  if (unites > unitesPrecedent * 1.05) return 'hausse';
  if (unites < unitesPrecedent * 0.95) return 'baisse';
  return 'stable';
}

/** D2 pré-revenus : barreau le plus haut atteint (§8). Barreau gagné → hausse, perdu → baisse. */
export function sensBarreau(barreau, barreauPrecedent) {
  if (barreauPrecedent === null || barreau === null) return 'non-publie';
  return barreau > barreauPrecedent ? 'hausse' : barreau < barreauPrecedent ? 'baisse' : 'stable';
}

/**
 * §6 : état de la marge brute tel que le schéma le nomme.
 * coutDesVentes === undefined : la société ne présente AUCUNE ligne de coût des ventes
 * → « le garde-fou est sans objet et on le note ».
 */
export function etatMargeBrute(ca, coutDesVentes) {
  if (coutDesVentes === undefined) return 'sans-objet';
  if (coutDesVentes === null || ca === null) return 'non-calculable';
  const mb = marge(ca - coutDesVentes, ca);
  if (mb === null) return 'non-calculable';
  return mb > 0 ? 'positive' : mb < 0 ? 'negative' : 'nulle';
}

/** §5, règle du trimestre seul : milieu de la fourchette du trimestre suivant contre le CA publié. */
export function statutTrimestreSeul(basse, haute, caPublie) {
  const ecart = ((basse + haute) / 2 - caPublie) / caPublie * 100;
  return ecart > 2 ? 'relevee' : ecart < -2 ? 'abaissee' : 'maintenue';
}

/** §5 : d'après le milieu de la fourchette annuelle. Un changement d'exercice donne « nouvelle ». */
export function statutAnnuel(guidance, precedente) {
  if (guidance === null) return 'non-publie';
  if (precedente === null || guidance.exercice !== precedente.exercice) return 'nouvelle';
  const milieu = (guidance.basse + guidance.haute) / 2;
  const avant = (precedente.basse + precedente.haute) / 2;
  return milieu > avant ? 'relevee' : milieu < avant ? 'abaissee' : 'maintenue';
}

/** §5 : le sens que donne chaque statut de prévision. */
export const SENS_DU_STATUT = {
  relevee: 'hausse', abaissee: 'baisse', manquee: 'baisse',
  maintenue: 'stable', nouvelle: 'stable', 'non-publie': 'non-publie',
};

/** Une source telle que le schéma l'exige : type, jour, adresse. */
export const src = (type, date, url) => ({ type, date, url });
/** Une fourchette de prévision annuelle, avec l'exercice qu'elle vise (§5). */
export const g = (exercice, basse, haute) => ({ exercice, basse, haute });

/** Une dimension : « non publié » se passe de source, tout autre sens exige la sienne. */
export const dim = (sens, source) => (sens === 'non-publie' ? { sens } : { sens, source });

/** Une publication au format du schéma data/tracker (voir data/tracker/README.md). */
export function publication({ date, trimestre, source, d1, d2, d4, statut, margeBrute, drapeaux = [] }) {
  return {
    date,
    trimestre,
    source,
    // D3 n'est pas saisi : il découle du statut de prévision (§5), seule lecture consignée.
    dimensions: { d1: dim(d1, source), d2: dim(d2, source), d3: dim(SENS_DU_STATUT[statut], source), d4: dim(d4, source) },
    statut_prevision: statut,
    marge_brute: (margeBrute === 'non-calculable' || margeBrute === 'sans-objet') ? { etat: margeBrute } : { etat: margeBrute, source },
    // §7 : les quatre mesures de financement ne sont pas relevées — « si une mesure manque,
    // la couleur est non déterminée, pas verte ».
    financement: { couleur: 'non-determinee', motifs: [] },
    drapeaux,
  };
}
