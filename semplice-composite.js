/* semplice-composite.js — Moteur de calcul SEMPLICE (source de vérité unique)
   Chargé en <script> par expertise.html / country.html (globals),
   importé en CommonJS par scripts/semplice-validator.mjs (createRequire).
   Formule : docs/superpowers/specs/2026-06-18-semplice-v3-architecture-design.md §2, §7.1 */

var SEMPLICE_CALC = {
    DIM_KEYS: ['S', 'E', 'M', 'P', 'L', 'I', 'C', 'Ee'],
    OPP_KEYS: ['So', 'Eo', 'Mo', 'Po', 'Lo', 'Io', 'Co', 'Eeo'],

    WEIGHTS_RISK_V21: { M: 0.16, E: 0.15, P: 0.14, S: 0.12, I: 0.12, C: 0.11, Ee: 0.10, L: 0.10 },
    WEIGHTS_RISK_V3:  { M: 0.16, E: 0.15, P: 0.14, I: 0.13, S: 0.12, C: 0.11, Ee: 0.10, L: 0.09 },
    WEIGHTS_OPP:      { Eo: 0.17, Io: 0.15, Po: 0.14, Lo: 0.13, Co: 0.12, So: 0.12, Eeo: 0.10, Mo: 0.07 },

    AMPLIFICATION_THRESHOLD: 1.0,
    AMPLIFICATION_FACTOR: 0.20,
    MAX_AMPLIFICATION_DELTA: 0.3,

    round1: function (x) { return Math.round(x * 10) / 10; },

    /* scores: array aligné sur keys ; retourne {base, amplified, weights} non arrondis.
       Le seuil d'amplification se compare à la base BRUTE (spec §7.1) — parité exigée
       avec l'historique computeWeightedComposite du validateur. Un dépassement infime
       (ex. Singapour : delta 1.003) produit un bonus négligeable, invisible après arrondi. */
    computeComposite: function (scores, weights, keys) {
        var base = 0, i, k;
        for (i = 0; i < keys.length; i++) base += weights[keys[i]] * scores[i];

        var aw = {};
        for (i = 0; i < keys.length; i++) {
            k = keys[i];
            aw[k] = weights[k];
            var delta = scores[i] - base;
            if (delta > this.AMPLIFICATION_THRESHOLD) {
                aw[k] += this.AMPLIFICATION_FACTOR * (delta - this.AMPLIFICATION_THRESHOLD);
            }
        }
        var total = 0;
        for (i = 0; i < keys.length; i++) total += aw[keys[i]];
        var amplified = 0;
        for (i = 0; i < keys.length; i++) amplified += (aw[keys[i]] / total) * scores[i];
        if (amplified - base > this.MAX_AMPLIFICATION_DELTA) amplified = base + this.MAX_AMPLIFICATION_DELTA;

        return { base: base, amplified: amplified, weights: aw };
    },

    /* Bandes : data/semplice/semplice-scoring-boundaries.md (entrée = valeur arrondie à 1 déc.) */
    levelRisk: function (v) {
        if (v <= 2.0) return 'Faible';
        if (v <= 3.0) return 'Modéré-Faible';
        if (v <= 4.0) return 'Modéré';
        if (v <= 5.0) return 'Élevé';
        if (v <= 6.0) return 'Très élevé';
        return 'Critique';
    },
    levelOpp: function (v) {
        if (v <= 2.0) return 'Minimal';
        if (v <= 3.0) return 'Faible';
        if (v <= 4.0) return 'Modéré';
        if (v <= 5.0) return 'Significatif';
        if (v <= 6.0) return 'Élevé';
        return 'Exemplaire';
    }
};

if (typeof module !== 'undefined' && module.exports) { module.exports = SEMPLICE_CALC; }
