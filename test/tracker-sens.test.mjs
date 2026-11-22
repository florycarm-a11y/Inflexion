/**
 * test/tracker-sens.test.mjs — Les calculateurs de §4, §5 et §6 de la méthode v1.3.
 *
 * Pourquoi ces tests existent : `test/tracker-moteur.test.mjs` éprouve le moteur d'alertes (§6)
 * à partir de sens DONNÉS. La couche qui transforme les MONTANTS d'un communiqué en sens n'avait
 * aucun test — c'est pourtant là que vivent les seuils, les règles de non-calculabilité et les
 * deux hiérarchies (le chemin de D2, la règle de §5). Une erreur d'un point de seuil y passe
 * inaperçue et fausse une série entière.
 *
 * Les cas nommés « Planet Labs » viennent de la lecture réelle du 22 novembre 2026 : ils ancrent
 * les règles sur des chiffres déposés, pas sur des exemples inventés.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  croissance, marge, sensEcart, sensCarnet, sensDemandeEngagee, sensMargeOperationnelle,
  sensUnites, sensBarreau, etatMargeBrute, statutTrimestreSeul, statutAnnuel, statutPrevision,
  SENS_DU_STATUT, g,
} from '../scripts/lib/tracker-sens.mjs';

// ── §4, précision 3 : croissance sur les montants publiés ───────────────────

test('croissance : calculée sur les montants, sans arrondi intermédiaire', () => {
  assert.equal(croissance(94200, 66300), (94200 - 66300) / 66300 * 100);
  assert.equal(croissance(null, 100), null);
  assert.equal(croissance(100, null), null);
  assert.equal(croissance(100, 0), null, 'un comparatif nul ne donne pas une croissance infinie');
});

test('précision 3 : « plus d’un point » est un seuil STRICT', () => {
  assert.equal(sensEcart(14.0, 13.0), 'stable', 'un écart de 1,0 pile ne suffit pas');
  assert.equal(sensEcart(14.01, 13.0), 'hausse');
  assert.equal(sensEcart(13.0, 14.0), 'stable');
  assert.equal(sensEcart(12.99, 14.0), 'baisse');
});

test('sensEcart : sans valeur précédente, « non publié » — jamais « stable »', () => {
  assert.equal(sensEcart(12, null), 'non-publie');
  assert.equal(sensEcart(null, 12), 'non-publie');
  assert.equal(sensEcart(12, undefined), 'non-publie');
});

test('Planet Labs T1 FY2027 : écart de 1,17 point, hausse de justesse', () => {
  const avant = croissance(86800, 61600);  // T4 FY2026 : 40,909 %
  const apres = croissance(94200, 66300);  // T1 FY2027 : 42,081 %
  assert.ok(apres - avant > 1 && apres - avant < 1.2, `écart attendu ~1,17 ; obtenu ${apres - avant}`);
  assert.equal(sensEcart(apres, avant), 'hausse');
});

// ── §4, précision 1 : marge non calculable ──────────────────────────────────

test('précision 1 : marge non calculable si le CA est nul ou négatif', () => {
  assert.equal(marge(-50, 0), null);
  assert.equal(marge(-50, -10), null);
});

test('précision 1 : « dépasse cent fois » est un seuil strict', () => {
  assert.equal(marge(-100, 1), -10000, 'exactement cent fois reste calculable');
  assert.equal(marge(-101, 1), null, 'au-delà de cent fois, non calculable');
});

test('précision 1 : un bénéfice n’est jamais rendu non calculable par son ampleur', () => {
  assert.equal(marge(100000, 1), 10000000);
});

// ── §4, D4 : deux seuils selon le signe de la marge ─────────────────────────

test('D4 : seuil de 2 points quand la marge du trimestre est positive', () => {
  assert.equal(sensMargeOperationnelle(50, 1000, 30, 1000), 'stable', '+2,0 points pile');
  assert.equal(sensMargeOperationnelle(55, 1000, 30, 1000), 'hausse');
  assert.equal(sensMargeOperationnelle(30, 1000, 55, 1000), 'baisse');
});

test('D4 : seuil de 5 points quand la marge du trimestre est négative', () => {
  assert.equal(sensMargeOperationnelle(-100, 1000, -150, 1000), 'stable', '+5,0 points pile');
  assert.equal(sensMargeOperationnelle(-100, 1000, -160, 1000), 'hausse');
  assert.equal(sensMargeOperationnelle(-160, 1000, -100, 1000), 'baisse');
});

test('D4 : une marge non calculable, présente ou passée, rend le sens non publié', () => {
  assert.equal(sensMargeOperationnelle(-5000, 1, -10, 1000), 'non-publie');
  assert.equal(sensMargeOperationnelle(-10, 1000, -5000, 1), 'non-publie');
});

test('Planet Labs T4 FY2026 : marge négative qui se dégrade de 10 points, baisse', () => {
  assert.equal(sensMargeOperationnelle(-36000, 86800, -19400, 61600), 'baisse');
});

test('Planet Labs T1 FY2027 : −2,66 points sur une marge négative, stable', () => {
  assert.equal(sensMargeOperationnelle(-34900, 94200, -22800, 66300), 'stable');
});

// ── §4, D2 : le carnet, et la hiérarchie des deux chemins ───────────────────

test('D2 carnet : ratio commandes / CA, seuils 1,05 et 0,95 stricts', () => {
  assert.equal(sensCarnet(1050, 1000, 1000), 'stable', 'ratio de 1,05 pile');
  assert.equal(sensCarnet(1051, 1000, 1000), 'hausse');
  assert.equal(sensCarnet(950, 1000, 1000), 'stable', 'ratio de 0,95 pile');
  assert.equal(sensCarnet(949, 1000, 1000), 'baisse');
});

test('D2 carnet : non publié si le carnet manque, est absent de la ligne, ou n’a pas de précédent', () => {
  assert.equal(sensCarnet(null, 1000, 1000), 'non-publie');
  assert.equal(sensCarnet(1000, null, 1000), 'non-publie');
  assert.equal(sensCarnet(undefined, 1000, 1000), 'non-publie', 'une clé absente ne doit pas valoir « stable »');
  assert.equal(sensCarnet(1000, 1000, 0), 'non-publie', 'un CA nul ne donne pas un ratio');
});

test('§4 : le carnet est le chemin PRINCIPAL de D2, les clients ne sont qu’un repli', () => {
  // Carnet calculable ET clients en hausse : c'est le carnet qui tranche, et il dit baisse.
  const sens = sensDemandeEngagee({
    carnet: 900, carnetPrecedent: 1000, ca: 1000,
    croissanceClients: 30, croissanceClientsPrecedente: 10,
  });
  assert.equal(sens, 'baisse', 'un carnet qui se vide l’emporte sur des clients qui affluent');
});

test('§4 : « à défaut de commandes », D2 passe par le nombre de clients', () => {
  assert.equal(sensDemandeEngagee({
    carnet: null, carnetPrecedent: null, ca: 1000,
    croissanceClients: 15, croissanceClientsPrecedente: 13,
  }), 'hausse');
});

test('§4 : un carnet sans valeur précédente retombe aussi sur les clients', () => {
  // Cas de la première ligne de Planet Labs : le carnet existe, son précédent n'a jamais été publié.
  assert.equal(sensDemandeEngagee({
    carnet: 242392, carnetPrecedent: null, ca: 58900,
    croissanceClients: croissance(1018, 886), croissanceClientsPrecedente: 13,
  }), 'hausse');
});

test('§4 : sans carnet ni clients, D2 est non publié', () => {
  assert.equal(sensDemandeEngagee({
    carnet: null, carnetPrecedent: null, ca: 1000,
    croissanceClients: null, croissanceClientsPrecedente: null,
  }), 'non-publie');
});

test('Planet Labs T2 FY2026 : carnet de 527 à 736 millions, ratio 3,85, hausse', () => {
  assert.equal(sensCarnet(736100, 527000, 73400), 'hausse');
});

// ── §4, pré-revenus ─────────────────────────────────────────────────────────

test('D1 pré-revenus : zéro livraison puis zéro livraison vaut « stable »', () => {
  assert.equal(sensUnites(0, 0), 'stable');
});

test('D1 pré-revenus : seuil de 5 %, et premières livraisons après zéro', () => {
  assert.equal(sensUnites(106, 100), 'hausse');
  assert.equal(sensUnites(105, 100), 'stable', '+5 % pile');
  assert.equal(sensUnites(94, 100), 'baisse');
  assert.equal(sensUnites(1, 0), 'hausse', 'premières livraisons après zéro');
  assert.equal(sensUnites(5, null), 'non-publie');
});

test('D2 pré-revenus : barreau gagné, barreau perdu, barreau tenu', () => {
  assert.equal(sensBarreau(4, 3), 'hausse');
  assert.equal(sensBarreau(3, 4), 'baisse');
  assert.equal(sensBarreau(3, 3), 'stable');
  assert.equal(sensBarreau(3, null), 'non-publie');
});

// ── §6 : garde-fou de marge brute ───────────────────────────────────────────

test('§6 : sans AUCUNE ligne de coût des ventes, le garde-fou est sans objet', () => {
  assert.equal(etatMargeBrute(1000, undefined), 'sans-objet');
});

test('§6 : coût des ventes attendu mais non publié ce jour-là → non calculable', () => {
  assert.equal(etatMargeBrute(1000, null), 'non-calculable');
  assert.equal(etatMargeBrute(null, 500), 'non-calculable');
});

test('§6 : positive, nulle, négative', () => {
  assert.equal(etatMargeBrute(1000, 400), 'positive');
  assert.equal(etatMargeBrute(1000, 1000), 'nulle');
  assert.equal(etatMargeBrute(1000, 1400), 'negative');
});

test('Planet Labs T1 FY2026 : marge brute de 55 %, la Bascule n’est pas retenue', () => {
  assert.equal(etatMargeBrute(66300, 29700), 'positive');
});

// ── §5 : statut de prévision ────────────────────────────────────────────────

test('§5 règle du trimestre seul : milieu de fourchette contre le CA publié, ±2 %', () => {
  assert.equal(statutTrimestreSeul(102, 102, 100), 'maintenue', '+2,0 % pile');
  assert.equal(statutTrimestreSeul(103, 103, 100), 'relevee');
  assert.equal(statutTrimestreSeul(98, 98, 100), 'maintenue', '−2,0 % pile');
  assert.equal(statutTrimestreSeul(97, 97, 100), 'abaissee');
});

test('§5 : une prévision portant sur un AUTRE exercice est « nouvelle »', () => {
  assert.equal(statutAnnuel(g(2027, 415000, 440000), g(2026, 297000, 301000)), 'nouvelle');
  assert.equal(statutAnnuel(g(2026, 260000, 280000), null), 'nouvelle', 'la première de la série');
});

test('§5 : à exercice égal, on compare les milieux de fourchette', () => {
  assert.equal(statutAnnuel(g(2026, 265000, 280000), g(2026, 260000, 280000)), 'relevee');
  assert.equal(statutAnnuel(g(2026, 250000, 270000), g(2026, 260000, 280000)), 'abaissee');
  assert.equal(statutAnnuel(g(2026, 255000, 285000), g(2026, 260000, 280000)), 'maintenue',
    'fourchette élargie, milieu inchangé');
});

test('§5 : la règle du trimestre seul est une décision par LIGNE, pas par société', () => {
  // Planet Labs ne guide que le trimestre jusqu'au T3 FY2025…
  assert.equal(statutPrevision({ guidanceT: [61000, 64000], ca: 61100 }, null), 'relevee');
  // …puis guide l'exercice à partir du T4 FY2025 : la règle change ce jour-là.
  assert.equal(statutPrevision({ guidance: g(2026, 260000, 280000), ca: 61600 }, null), 'nouvelle');
  assert.equal(statutPrevision({ guidance: g(2026, 265000, 280000), ca: 66300 },
    g(2026, 260000, 280000)), 'relevee');
});

test('§5 : la prévision annuelle l’emporte sur celle du trimestre quand les deux existent', () => {
  const statut = statutPrevision(
    { guidance: g(2026, 260000, 280000), guidanceT: [50000, 50000], ca: 61600 }, g(2026, 300000, 300000));
  assert.equal(statut, 'abaissee', 'lue sur l’exercice, pas sur le trimestre');
});

test('§5 : aucune prévision chiffrée → non publié', () => {
  assert.equal(statutPrevision({ ca: 1000 }, null), 'non-publie');
  assert.equal(statutPrevision({ guidance: null, guidanceT: null, ca: 1000 }, null), 'non-publie');
});

test('§5 : le sens que donne chaque statut, « manquée » comprise', () => {
  assert.deepEqual(SENS_DU_STATUT, {
    relevee: 'hausse', abaissee: 'baisse', manquee: 'baisse',
    maintenue: 'stable', nouvelle: 'stable', 'non-publie': 'non-publie',
  });
});
