# SEMPLICE v3 — Plan d'implémentation (dimension IA + moteur de calcul)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter la spec `docs/superpowers/specs/2026-06-18-semplice-v3-architecture-design.md` : moteur de calcul unique (composites calculés, plus jamais stockés), puis bascule de la dimension I vers « Intelligence Artificielle » avec rescoring des 18 zones.

**Architecture:** Un module partagé `semplice-composite.js` (script global navigateur + export CommonJS gardé) devient l'unique implémentation du composite pondéré + amplification. `semplice-zones-config.js` calcule ses composites au chargement ; le validateur importe le même module via `createRequire`. La bascule v3 (poids, labels, scores IA) n'intervient qu'en Phase B, une fois le moteur prouvé à l'identique sur les données v2.1.

**Tech Stack:** Vanilla JS (pages legacy, pattern `var` globals), Node 20 natif (`node:test`, `node:assert`), zéro dépendance nouvelle.

**Référence obligatoire :** la spec (`docs/superpowers/specs/2026-06-18-semplice-v3-architecture-design.md`) contient toutes les tables (poids §2, indicateurs IA §5.3, Io §5.4, redistribution §5.2, sous-coefficients §6). Le plan y renvoie par numéro de section — les tables NE sont PAS re-copiées ici.

---

## Structure de fichiers

| Fichier | Rôle | Sort |
|---------|------|------|
| `semplice-composite.js` | **Créer** — module de calcul unique (poids, composite, amplification, libellés) | Phase A |
| `scripts/tests/semplice-composite.test.mjs` | **Créer** — tests du module | Phase A |
| `semplice-zones-config.js` | Modifier — supprime composites stockés, calcule au chargement | Phase A |
| `expertise.html`, `country.html` | Modifier — balise `<script>` du module + contenu section SEMPLICE | Phases A & B |
| `scripts/semplice-validator.mjs` | Modifier — consomme le module, poids par version, quanti pondéré, règle IA-C | Phases A & B |
| `data/semplice/grille-scoring-quantitative-v3.md` | **Créer** — grille risque v3 (102 indicateurs) | Phase B |
| `data/semplice/grille-scoring-opportunite-v3.md` | **Créer** — grille opportunité v3 (70 indicateurs) | Phase B |
| `data/semplice/rescoring-ia-2026-06.md` | **Créer** — justification du rescoring IA des 18 zones | Phase B |
| `data/semplice/semplice-ia-c-interactions.md` | **Créer** — remplace `semplice-i-c-interactions.md` | Phase B |
| `data/semplice/backtests-v3.md` | **Créer** — 3 backtests IA ciblés (Ukraine 2022, embargo puces Chine, retrait Fable 5) | Phase B |
| `data/semplice-history.json` (vérifier le chemin exact en Task 9) | Modifier — série I → `I_legacy` | Phase B |
| `scripts/veille-continue.mjs` | Modifier — thème watchlist « IA souveraine » | Phase B |
| `CLAUDE.md` | Modifier — section SEMPLICE (I = IA, totaux) | Phase B |

---

# PHASE A — Moteur de calcul (composites calculés)

### Task 1 : Module partagé `semplice-composite.js`

**Files:**
- Create: `semplice-composite.js`
- Test: `scripts/tests/semplice-composite.test.mjs`
- Modify: `scripts/tests/run-tests.sh`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `scripts/tests/semplice-composite.test.mjs` :

```js
/**
 * Tests unitaires — semplice-composite.js (moteur de calcul SEMPLICE)
 * Execution :  node --test scripts/tests/semplice-composite.test.mjs
 * Framework :  node:test + node:assert (Node.js 20 natif, zero dependance)
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../../semplice-composite.js');

test('les 3 jeux de poids somment à 1.0', () => {
  for (const name of ['WEIGHTS_RISK_V21', 'WEIGHTS_RISK_V3', 'WEIGHTS_OPP']) {
    const sum = Object.values(C[name]).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 1e-9, `${name} somme à ${sum}`);
  }
});

test('poids v3 : I=0.13, L=0.09', () => {
  assert.strictEqual(C.WEIGHTS_RISK_V3.I, 0.13);
  assert.strictEqual(C.WEIGHTS_RISK_V3.L, 0.09);
});

test('composite base = moyenne pondérée (Ormuz v2.1)', () => {
  // scores ordre [S,E,M,P,L,I,C,Ee]
  const r = C.computeComposite([4.4, 5.7, 6.2, 6.7, 6.9, 6.9, 6.5, 5.2], C.WEIGHTS_RISK_V21, C.DIM_KEYS);
  assert.strictEqual(C.round1(r.base), 6.1);
});

test('profil uniforme : amplified === base (Singapour)', () => {
  const r = C.computeComposite([2.2, 1.4, 2.7, 1.9, 1.2, 3.2, 2.1, 2.9], C.WEIGHTS_RISK_V21, C.DIM_KEYS);
  assert.ok(Math.abs(r.amplified - r.base) < 1e-9);
});

test('pic isolé : amplification bornée à +0.3', () => {
  const r = C.computeComposite([2, 2, 2, 2, 2, 2, 2, 7], C.WEIGHTS_RISK_V21, C.DIM_KEYS);
  assert.ok(r.amplified > r.base, 'le pic doit amplifier');
  assert.ok(r.amplified - r.base <= 0.3 + 1e-9, 'plafond +0.3');
});

test('libellés risque et opportunité aux bornes', () => {
  assert.strictEqual(C.levelRisk(2.0), 'Faible');
  assert.strictEqual(C.levelRisk(2.1), 'Modéré-Faible');
  assert.strictEqual(C.levelRisk(6.1), 'Critique');
  assert.strictEqual(C.levelOpp(5.0), 'Significatif');
  assert.strictEqual(C.levelOpp(5.1), 'Élevé');
  assert.strictEqual(C.levelOpp(6.1), 'Exemplaire');
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run : `node --test scripts/tests/semplice-composite.test.mjs`
Attendu : ÉCHEC — `Cannot find module '../../semplice-composite.js'`

- [ ] **Step 3 : Implémenter le module**

Créer `semplice-composite.js` :

```js
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

    /* scores: array aligné sur keys ; retourne {base, amplified, weights} non arrondis */
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
```

- [ ] **Step 4 : Vérifier le passage**

Run : `node --test scripts/tests/semplice-composite.test.mjs`
Attendu : PASS (6 tests)

- [ ] **Step 5 : Enregistrer dans le runner**

Dans `scripts/tests/run-tests.sh`, après la ligne `node --test scripts/tests/lib/claude-api.test.mjs`, ajouter :

```bash
node --test scripts/tests/semplice-composite.test.mjs
```

- [ ] **Step 6 : Commit**

```bash
git add semplice-composite.js scripts/tests/semplice-composite.test.mjs scripts/tests/run-tests.sh
git commit -m "feat(semplice): module de calcul partagé (composite + amplification + libellés)"
```

---

### Task 2 : `semplice-zones-config.js` calcule ses composites

**Files:**
- Modify: `semplice-zones-config.js`
- Modify: `expertise.html:1638` (balise script), `country.html:328` (balise script)
- Test: `scripts/tests/semplice-zones-config.test.mjs` (créer)

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `scripts/tests/semplice-zones-config.test.mjs` :

```js
/**
 * Tests — semplice-zones-config.js : les composites sont CALCULÉS, plus stockés.
 * Execution : node --test scripts/tests/semplice-zones-config.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CALC = require('../../semplice-composite.js');

// Simule le chargement navigateur : composite.js définit le global, puis zones-config l'utilise.
const src = readFileSync(new URL('../../semplice-zones-config.js', import.meta.url), 'utf8');
const load = new Function('SEMPLICE_CALC', src + '\nreturn SEMPLICE_ZONES;');
const ZONES = load(CALC);

test('18 zones chargées', () => { assert.strictEqual(ZONES.length, 18); });

test('aucun composite stocké en dur dans le source', () => {
  assert.ok(!/composite\s*:\s*\d/.test(src), 'composite:<n> trouvé — doit être calculé');
  assert.ok(!/oppComposite\s*:\s*\d/.test(src), 'oppComposite:<n> trouvé — doit être calculé');
});

test('chaque zone : composite = amplifié arrondi, libellé cohérent, bornes [1,7]', () => {
  for (const z of ZONES) {
    const r = CALC.computeComposite(z.scores, CALC.WEIGHTS_RISK_V21, CALC.DIM_KEYS);
    assert.strictEqual(z.composite, CALC.round1(r.amplified), z.id + ' risque');
    assert.strictEqual(z.level, CALC.levelRisk(z.composite), z.id + ' libellé risque');
    const o = CALC.computeComposite(z.opp, CALC.WEIGHTS_OPP, CALC.OPP_KEYS);
    assert.strictEqual(z.oppComposite, CALC.round1(o.amplified), z.id + ' opp');
    assert.strictEqual(z.oppLevel, CALC.levelOpp(z.oppComposite), z.id + ' libellé opp');
    assert.ok(z.composite >= 1 && z.composite <= 7 && z.oppComposite >= 1 && z.oppComposite <= 7);
  }
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run : `node --test scripts/tests/semplice-zones-config.test.mjs`
Attendu : ÉCHEC sur « aucun composite stocké en dur »

- [ ] **Step 3 : Modifier `semplice-zones-config.js`**

(a) Supprimer, dans **chacune des 18 zones**, les 4 champs `composite:…`, `level:'…'`, `oppComposite:…`, `oppLevel:'…'` (garder `scores` et `opp` intacts).

(b) Ajouter en **fin de fichier** :

```js
/* Composites calculés au chargement — source de vérité : semplice-composite.js (D6, spec v3 §7.1).
   Phase A : poids v2.1 (les scores I sont encore des scores Information). */
(function () {
    for (var i = 0; i < SEMPLICE_ZONES.length; i++) {
        var z = SEMPLICE_ZONES[i];
        var r = SEMPLICE_CALC.computeComposite(z.scores, SEMPLICE_CALC.WEIGHTS_RISK_V21, SEMPLICE_CALC.DIM_KEYS);
        z.composite = SEMPLICE_CALC.round1(r.amplified);
        z.level = SEMPLICE_CALC.levelRisk(z.composite);
        var o = SEMPLICE_CALC.computeComposite(z.opp, SEMPLICE_CALC.WEIGHTS_OPP, SEMPLICE_CALC.OPP_KEYS);
        z.oppComposite = SEMPLICE_CALC.round1(o.amplified);
        z.oppLevel = SEMPLICE_CALC.levelOpp(z.oppComposite);
    }
})();
```

(c) Dans `expertise.html` (ligne ~1638) et `country.html` (ligne ~328), **avant** la balise `semplice-zones-config.js`, ajouter :

```html
<script src="semplice-composite.js"></script>
```

- [ ] **Step 4 : Vérifier le passage + documenter les valeurs qui bougent**

Run : `node --test scripts/tests/semplice-zones-config.test.mjs`
Attendu : PASS.

L'amplification systématique (décision D6) fait légitimement bouger certaines valeurs par rapport
au stocké (qui était la base sans amplification). Zones attendues en hausse côté risque :
cuba 4.8→4.9, chine 4.6→4.9, madagascar 4.6→4.7, turquie 4.3→4.4, arctique 3.1→3.2,
île-maurice 2.4→2.5, vietnam 3.8→4.0, ukraine 5.7 (inchangé après arrondi).
Générer la table exacte (risque + opportunité) pour le commit :

```bash
node -e "
const { createRequire } = require('node:module');
const C = require('./semplice-composite.js');
const src = require('fs').readFileSync('./semplice-zones-config.js','utf8');
const Z = new Function('SEMPLICE_CALC', src + '\nreturn SEMPLICE_ZONES;')(C);
for (const z of Z) console.log(z.id, 'R', z.composite, z.level, '| O', z.oppComposite, z.oppLevel);
"
```

Copier la sortie dans le message de commit (traçabilité du changement de données).

- [ ] **Step 5 : Vérification navigateur**

Lancer le serveur local (`npx serve .`), ouvrir `country.html` : le tableau, le scatter et les mini
radars affichent des composites non vides ; ouvrir `expertise.html#semplice` : radar et scoreboard OK.
(Sous Claude Code : `preview_start` + `preview_snapshot` sur les deux pages.)

- [ ] **Step 6 : Commit**

```bash
git add semplice-zones-config.js expertise.html country.html scripts/tests/semplice-zones-config.test.mjs
git commit -m "feat(semplice): composites calculés au chargement (amplification systématique, D6)"
```

Ajouter la table de l'étape 4 dans le corps du message.

---

### Task 3 : Le validateur consomme le module partagé

**Files:**
- Modify: `scripts/semplice-validator.mjs:44-55` (poids), `:233-309` (computeWeightedComposite)

- [ ] **Step 1 : Brancher l'import**

En tête de `scripts/semplice-validator.mjs` (après les imports existants) :

```js
import { createRequire } from 'node:module';
const _require = createRequire(import.meta.url);
const CALC = _require('../semplice-composite.js');
```

- [ ] **Step 2 : Remplacer les poids et le calcul**

(a) Supprimer le bloc `const DIMENSION_WEIGHTS = { … }` (lignes ~46-55) et le remplacer par :

```js
// Poids sélectionnés par version d'évaluation (spec v3 §2.1) — source : semplice-composite.js
function weightsFor(data) {
  const v = parseFloat(data?.meta?.version ?? '2.1');
  return v >= 3 ? CALC.WEIGHTS_RISK_V3 : CALC.WEIGHTS_RISK_V21;
}
```

(b) Dans `computeWeightedComposite(data)` (lignes ~233-309), remplacer **tout le corps** par un appel
au module (mêmes clés de retour qu'avant — ne pas casser les consommateurs) :

```js
function computeWeightedComposite(data) {
  const W = weightsFor(data);
  const keys = [], arr = [];
  for (const dk of DIMENSION_KEYS) {
    const s = dimScore(data, dk);
    if (s != null) { keys.push(dk); arr.push(s); }
  }
  const r = CALC.computeComposite(arr, W, keys);
  return {
    baseComposite: Math.round(r.base * 100) / 100,
    amplifiedComposite: Math.round(r.amplified * 100) / 100,
    weights: Object.fromEntries(keys.map((k) => {
      const total = keys.reduce((s, kk) => s + r.weights[kk], 0);
      return [k, Math.round((r.weights[k] / total) * 1000) / 1000];
    })),
    amplifications: keys
      .filter((k) => r.weights[k] > W[k])
      .map((k) => ({ dim: k, base: W[k], amplified: r.weights[k] })),
  };
}
```

Attention : les autres usages de `DIMENSION_WEIGHTS` dans le fichier (chercher avec
`grep -n DIMENSION_WEIGHTS scripts/semplice-validator.mjs`) doivent être remplacés par `weightsFor(data)`
ou `CALC.WEIGHTS_RISK_V21` selon le contexte — inspecter chaque occurrence.

- [ ] **Step 3 : Smoke test sur les évaluations existantes**

```bash
ls data/semplice/evaluations-test-v2/ && node scripts/semplice-validator.mjs 2>&1 | tail -20
```

Attendu : même verdict qu'avant modification pour chaque évaluation v2 (comparer avec une exécution
`git stash` / `git stash pop` si doute). Si le répertoire n'existe pas, exécuter l'aide du script
(`node scripts/semplice-validator.mjs --help`) et adapter.

- [ ] **Step 4 : Suite complète + commit**

```bash
node --test scripts/tests/semplice-composite.test.mjs scripts/tests/semplice-zones-config.test.mjs
git add scripts/semplice-validator.mjs
git commit -m "refactor(semplice): le validateur consomme le module de calcul partagé"
```

---

# PHASE B — Bascule v3 (dimension IA)

### Task 4 : Grille risque v3 (`grille-scoring-quantitative-v3.md`)

**Files:**
- Create: `data/semplice/grille-scoring-quantitative-v3.md`
- Modify: `data/semplice/grille-scoring-quantitative-v2.md` (bandeau de dépréciation)

- [ ] **Step 1 : Créer la grille v3**

Partir de la v2 (`cp data/semplice/grille-scoring-quantitative-v2.md data/semplice/grille-scoring-quantitative-v3.md`) puis appliquer, section par section :

1. En-tête : « v3.0 | Échelle 1-7 | **102 indicateurs risque + 6 résilience** (+6 K optionnel) » — corriger l'ancien comptage (spec D8).
2. Section « I — Information » → remplacer intégralement par « **I — Intelligence Artificielle (9 indicateurs) — EXCLUSIVE SEMPLICE** » : copier la table IA1–IA9 **avec les colonnes sources complètes** depuis la spec §5.3, et le bloc de référence sources tech/IA.
3. Section P : ajouter P16, P17, P18 et la note « P12 élargi (absorbe I10) » — table de correspondance depuis la spec §5.2.
4. Section C : renommer « C — Cyber & contrôle informationnel », ajouter C13, C14 (sous-coefficients 1/3, spec §6) et le modificateur CM1 (ex-I6, non scoré).
5. Table des poids : remplacer par la matrice risque complète de la spec §2.1 (Défaut I=13 %, L=9 %).
6. Nouvelle section « Pondération intra-dimension » : formule et table des tags depuis la spec §4.
7. Résilience : RI1 rattaché à P, bonification P = moyenne(RP1, RI1) (spec §3).
8. Récapitulatif : totaux v3 (102 / 6 / 6 / 114) depuis la spec §9. Historique des modifications : ajouter la ligne v3.0.

- [ ] **Step 2 : Vérifier les comptages**

```bash
grep -c '^| IA[0-9]' data/semplice/grille-scoring-quantitative-v3.md   # attendu : 9
grep -c '^| P1[6-8]' data/semplice/grille-scoring-quantitative-v3.md   # attendu : 3
grep -c '^| C1[34]' data/semplice/grille-scoring-quantitative-v3.md    # attendu : 2
grep -n 'I1 \|I2 \|Information (12' data/semplice/grille-scoring-quantitative-v3.md  # attendu : rien
```

- [ ] **Step 3 : Déprécier la v2**

En tête de `grille-scoring-quantitative-v2.md`, sous le titre, ajouter :

```markdown
> ⚠️ **DÉPRÉCIÉE** — remplacée par [grille-scoring-quantitative-v3.md](grille-scoring-quantitative-v3.md)
> (dimension I = Intelligence Artificielle). Conservée pour l'historique des évaluations ≤ v2.1.
```

- [ ] **Step 4 : Commit**

```bash
git add data/semplice/grille-scoring-quantitative-v3.md data/semplice/grille-scoring-quantitative-v2.md
git commit -m "docs(semplice): grille risque v3 — dimension IA, P16-P18, C13-C14, tags intra-dimension"
```

---

### Task 5 : Grille opportunité v3 (`grille-scoring-opportunite-v3.md`)

**Files:**
- Create: `data/semplice/grille-scoring-opportunite-v3.md`
- Modify: `data/semplice/grille-scoring-opportunite-v2.md` (bandeau de dépréciation)

- [ ] **Step 1 : Créer la grille v3**

Copier la v2 puis : en-tête « v3.0 | **70 indicateurs** » (corriger le 66→64 de la v2, spec D8) ;
section Io renommée « **Io — Innovation & IA souveraine (14 indicateurs)** » avec Io9–Io14 copiés
depuis la spec §5.4 (sources complètes) ; matrice de poids opportunité de la spec §2.2 ; récapitulatif
70. Historique : ligne v3.0.

- [ ] **Step 2 : Vérifier**

```bash
grep -c '^| Io[0-9]' data/semplice/grille-scoring-opportunite-v3.md   # attendu : 14
```

- [ ] **Step 3 : Déprécier la v2** (même bandeau que Task 4, lien vers la v3 opportunité)

- [ ] **Step 4 : Commit**

```bash
git add data/semplice/grille-scoring-opportunite-v*.md
git commit -m "docs(semplice): grille opportunité v3 — Io 14 indicateurs (IA souveraine), total 70"
```

---

### Task 6 : Validateur v3 — quanti pondéré + règle IA-C

**Files:**
- Modify: `scripts/semplice-validator.mjs`
- Test: `scripts/tests/semplice-validator-v3.test.mjs` (créer)

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `scripts/tests/semplice-validator-v3.test.mjs` :

```js
/**
 * Tests — extensions v3 du validateur : moyenne intra-dimension pondérée + règle IA-C.
 * Execution : node --test scripts/tests/semplice-validator-v3.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { weightedQuanti, checkIaCyberCoherence } from '../semplice-validator.mjs';

test('quanti pondéré : défaut w=2 partout ≡ moyenne simple', () => {
  const inds = [{ palier: 3 }, { palier: 5 }];
  assert.strictEqual(weightedQuanti(inds), 4);
});

test('quanti pondéré : critique w=3, mineur w=1', () => {
  // (3*7 + 1*1) / 4 = 5.5
  const inds = [{ palier: 7, weight: 3 }, { palier: 1, weight: 1 }];
  assert.strictEqual(weightedQuanti(inds), 5.5);
});

test('règle IA-C : IA<=2 et C>4 → warning', () => {
  assert.strictEqual(checkIaCyberCoherence(1.8, 5.2).ok, false);
  assert.strictEqual(checkIaCyberCoherence(1.8, 3.0).ok, true);
  assert.strictEqual(checkIaCyberCoherence(4.0, 6.0).ok, true); // ne s'applique que si IA<=2
});
```

- [ ] **Step 2 : Vérifier l'échec**

Run : `node --test scripts/tests/semplice-validator-v3.test.mjs`
Attendu : ÉCHEC — exports absents.

- [ ] **Step 3 : Implémenter dans le validateur**

Ajouter dans `scripts/semplice-validator.mjs` (zone des utilitaires, avant Layer 1) et **exporter** :

```js
/* v3 — moyenne intra-dimension pondérée (spec §4) : w ∈ {3 critique, 2 majeur, 1 mineur}, défaut 2 */
export function weightedQuanti(indicators) {
  let num = 0, den = 0;
  for (const ind of indicators) {
    const w = ind.weight ?? 2;
    num += w * ind.palier;
    den += w;
  }
  return den > 0 ? num / den : 0;
}

/* v3 — règle de cohérence IA-C (spec §5.3) : un État à compute souverain fort (IA<=2)
   doit avoir une posture cyber au moins correcte (C<=4), sinon justification requise. */
export function checkIaCyberCoherence(iaScore, cScore) {
  if (iaScore <= 2 && cScore > 4) {
    return { ok: false, message: `IA=${iaScore} (souveraineté forte) mais C=${cScore} — incohérence à justifier` };
  }
  return { ok: true };
}
```

Puis brancher : (a) `weightedQuanti` utilisé par le calcul de `Score_quanti_d` quand l'évaluation
est v3 (`meta.version >= 3`) ; (b) `checkIaCyberCoherence` remplace l'ancienne vérification
`|I − C| > 2` (chercher `grep -n "I - C\|I-C\|Math.abs" scripts/semplice-validator.mjs` et adapter la
règle existante, en conservant son id de règle) ; (c) signature SIG6 « cyber war » : supprimer la
composante `{ dim: 'I', min: 5.0, weight: 0.7 }` (l'influence est désormais dans C via C14) et passer
le poids de la composante C de 0.8 à 1.1 (lignes ~524-527).

- [ ] **Step 4 : Vérifier le passage + non-régression**

```bash
node --test scripts/tests/semplice-validator-v3.test.mjs   # PASS
node scripts/semplice-validator.mjs 2>&1 | tail -5          # évaluations v2 : verdicts inchangés
```

- [ ] **Step 5 : Ajouter au runner + commit**

Ajouter `node --test scripts/tests/semplice-validator-v3.test.mjs` à `scripts/tests/run-tests.sh`, puis :

```bash
git add scripts/semplice-validator.mjs scripts/tests/semplice-validator-v3.test.mjs scripts/tests/run-tests.sh
git commit -m "feat(semplice): validateur v3 — quanti intra-pondéré, règle IA-C, SIG6 recalibrée"
```

---

### Task 7 : Rescoring IA des 18 zones (analytique)

**Files:**
- Create: `data/semplice/rescoring-ia-2026-06.md`
- Modify: `semplice-zones-config.js` (scores[5], opp[5], labels, bascule poids v3)

**Nature de la tâche :** travail d'analyste, pas de TDD. L'exécutant score IA1–IA9 (risque) et
l'impact Io9–Io14 sur `opp[5]` pour chaque zone, en suivant la grille v3 (Task 4) et ses sources.
Rappels de scoring : IA2 et IA9 sont critiques (w=3), IA6 mineur (w=1) ; échelle 7 = dépendance
maximale ; l'évaluation Ukraine doit intégrer la dépendance Starlink/compute occidental, la Chine
son embargo puces (IA2 élevé) MAIS sa puissance souveraine (IA1/IA4 bas) ; le retrait Fable 5
est le cas d'ancrage du palier 7 de IA2.

- [ ] **Step 1 : Batch 1 — 6 zones (ormuz, sahel, ukraine, cuba, chine, madagascar)**

Pour chaque zone : paliers IA1–IA9 avec ≥ 2 sources par indicateur (bloc sources spec §5.3),
`Score_quanti_I = weightedQuanti(...)` (w : IA2=3, IA9=3, IA6=1, reste 2), quali 1-7 justifié,
`S_I = 0.6·quanti + 0.4·quali`. Consigner dans `data/semplice/rescoring-ia-2026-06.md`
(une section par zone : table des 9 paliers + sources + quali + S_I final arrondi à 1 déc.).

- [ ] **Step 2 : Batch 2 — 6 zones (turquie, inde, bresil, tamil, arctique, ile-maurice)** (même protocole)

- [ ] **Step 3 : Batch 3 — 6 zones (singapour, republique-tcheque, iran, mexique, vietnam, ethiopie)** (même protocole)

- [ ] **Step 4 : Basculer la config en v3**

Dans `semplice-zones-config.js` :

(a) Labels :

```js
var SEMPLICE_DIM_LABELS=['Social','Économique','Militaire','Politique','Légal','Intelligence artificielle','Cyber','Environnemental'];
var SEMPLICE_OPP_LABELS=['Capital humain','Croissance','Sécurité','Gouvernance','Attract. juridique','Innovation & IA souveraine','Maturité tech','Durabilité'];
```

(b) Remplacer `scores[5]` (6ᵉ valeur) de chaque zone par le S_I du rescoring ; ajuster `opp[5]` si le
rescoring Io le justifie (documenter chaque ajustement dans le md).

(c) Dans le bloc de calcul de fin de fichier : `WEIGHTS_RISK_V21` → `WEIGHTS_RISK_V3` et mettre à
jour le commentaire (« Phase B : poids v3, scores I = Intelligence artificielle »).

- [ ] **Step 5 : Vérifier**

```bash
node --test scripts/tests/semplice-zones-config.test.mjs
```

⚠️ Ce test référence `WEIGHTS_RISK_V21` (Task 2) : le mettre à jour vers `WEIGHTS_RISK_V3` dans le
même commit. Générer la table avant/après composites (script de Task 2 Step 4) et la mettre dans le
message de commit.

- [ ] **Step 6 : Commit**

```bash
git add semplice-zones-config.js data/semplice/rescoring-ia-2026-06.md scripts/tests/semplice-zones-config.test.mjs
git commit -m "feat(semplice): rescoring IA des 18 zones + bascule poids v3 + labels"
```

---

### Task 8 : Historique — rupture de série I

**Files:**
- Modify: le fichier d'historique (localiser : `ls data/*history* data/semplice/*history*`)

- [ ] **Step 1 : Inspecter la structure**

```bash
ls data/*history* data/semplice/*history* 2>/dev/null
node -e "const h=require('./data/semplice-history.json'); console.log(JSON.stringify(Object.keys(h), null, 1)); " 2>/dev/null || echo "adapter le chemin"
```

- [ ] **Step 2 : Transformer**

Écrire un script one-shot (dans le scratchpad, pas dans le repo) qui, pour chaque zone : renomme la
série de la dimension `I` en `I_legacy` (l'historique Information n'est **pas** comparable à IA —
spec §8 « rupture de série ») et ajoute un point initial `I` daté du jour du rescoring avec la valeur
S_I de Task 7. Ajouter en tête du JSON (ou dans son champ meta si présent) :
`"note": "2026-06 : I repurposé Information→Intelligence artificielle (v3). Série Information archivée sous I_legacy."`.

- [ ] **Step 3 : Valider le JSON et l'affichage**

```bash
node -e "JSON.parse(require('fs').readFileSync('./data/semplice-history.json','utf8')); console.log('JSON OK')"
```

Puis vérifier dans le navigateur que les graphiques d'historique (expertise.html/country.html, s'ils
consomment ce fichier — `grep -rn 'history' semplice-*.js` pour le confirmer) ne cassent pas sur
`I_legacy` : adapter le code de lecture si nécessaire (ignorer les clés `*_legacy`).

- [ ] **Step 4 : Commit**

```bash
git add data/semplice-history.json semplice-radar.js semplice-country.js 2>/dev/null; git commit -m "feat(semplice): rupture de série I — Information archivée en I_legacy, série IA démarrée"
```

---

### Task 9 : Contenus éditoriaux (expertise.html, interactions IA-C, backtests)

**Files:**
- Modify: `expertise.html` (section `#semplice`)
- Create: `data/semplice/semplice-ia-c-interactions.md`
- Modify: `data/semplice/semplice-i-c-interactions.md` (dépréciation)
- Create: `data/semplice/backtests-v3.md`

- [ ] **Step 1 : expertise.html**

Dans la section `#semplice` : remplacer la présentation de la dimension Information par Intelligence
Artificielle (« IA souveraine & compute » — définition courte tirée de la spec D2) ; mettre à jour la
liste des dimensions exclusives (« IA et Cyber — aucun cadre concurrent n'a d'axe IA ») ; vérifier la
table de comparaison des 8 cadres (ligne critère Information → Intelligence artificielle). Chercher les
occurrences : `grep -n 'Information' expertise.html | grep -iv 'meta\|og:'`.

- [ ] **Step 2 : Interactions IA↔C**

Créer `data/semplice/semplice-ia-c-interactions.md` sur le modèle du doc I/C existant (structure :
objectif, mécanismes, scénarios, recommandations analystes) avec 5 scénarios :
(1) choc export control → dégradation posture cyber (dépendance logicielle) ; (2) dépendance compute
étranger → exposition surveillance/exfiltration ; (3) concentration data centers = cible cyber
stratégique (IA3 élevé ↔ C5) ; (4) IA adverse (IA5) alimente les capacités cyber offensives (C4) et
la manipulation (C14) ; (5) souveraineté forte (IA≤2) → posture cyber renforcée (corrélation positive,
cf. règle de cohérence Task 6). Chaque scénario : direction, mécanisme, cas réel, impact scoring.
Ajouter le bandeau de dépréciation sur `semplice-i-c-interactions.md` (pointer le nouveau doc).

- [ ] **Step 3 : Pont modalité**

Dans `data/semplice/pont-semplice-modalite-approche.md`, remplacer la modulation « I ≥ 5 » par
« **IA ≥ 5** : dépendance IA forte → rétrograder d'un cran les modalités à forte exposition
technologique » (spec §7.3). Les modulations C ≥ 5, L7 ≤ 2 et vélocité restent inchangées.
Ajouter ce fichier au `git add` du Step 5.

- [ ] **Step 4 : Backtests v3**

Créer `data/semplice/backtests-v3.md` : **3 cas seulement** (décision utilisateur 2026-07-06 — ne PAS
rejouer les 12 crises) : (1) Ukraine 2022 (dépendance Starlink/compute occidental, WhisperGate déjà
couvert par C), (2) embargo semi-conducteurs Chine (IA2 comme signal précoce), (3) **retrait Fable 5
2026 comme cas fondateur du palier 7 de IA2** (un fournisseur étranger révoque l'accès à un modèle
frontière sur décision gouvernementale). Conclure sur la valeur prédictive attendue de IA
(signal lent/structurel vs vélocité). `backtests-v2.md` reste la référence des 12 crises historiques
(non déprécié : il documente la dimension Information de l'époque, toujours valide pour v2).

- [ ] **Step 5 : Vérification navigateur + commit**

Vérifier expertise.html dans le navigateur (section SEMPLICE, radar, labels tooltips), puis :

```bash
git add expertise.html data/semplice/semplice-ia-c-interactions.md data/semplice/semplice-i-c-interactions.md data/semplice/backtests-v3.md data/semplice/pont-semplice-modalite-approche.md
git commit -m "docs(semplice): contenus v3 — dimension IA sur expertise, interactions IA-C, pont modalité, backtests"
```

---

### Task 10 : Veille + documentation projet

**Files:**
- Modify: `scripts/veille-continue.mjs` (watchlist)
- Modify: `CLAUDE.md` (section SEMPLICE)

- [ ] **Step 1 : Watchlist « IA souveraine »**

Localiser la structure : `grep -n 'watchlist\|WATCHLIST\|themes' scripts/veille-continue.mjs | head`.
Ajouter un 23ᵉ thème calqué sur le format existant :

- nom : `IA souveraine`
- priorité : 2 (haute — même niveau que les thèmes géopolitiques chauds, à ajuster selon l'échelle constatée)
- mots-clés (respecter la règle CLAUDE.md : word boundaries pour les mots ≤ 4 caractères) :
  `export controls`, `data center`, `semi-conducteurs`, `\bGPU\b`, `\bHBM\b`, `sovereign AI`,
  `IA souveraine`, `compute`, `puces IA`, `modèle de fondation`

- [ ] **Step 2 : Test veille**

```bash
node scripts/veille-continue.mjs --help 2>/dev/null || node -c scripts/veille-continue.mjs 2>/dev/null || node --check scripts/veille-continue.mjs
```

Attendu : syntaxe valide ; si le script a un mode dry-run, l'exécuter et vérifier que le thème apparaît.

- [ ] **Step 3 : CLAUDE.md**

Section « SEMPLICE — Cadre d'évaluation géopolitique » : remplacer « Information (I) » par
« Intelligence Artificielle (I) » dans les dimensions, mettre à jour la ligne dimensions exclusives
(« IA (I) et Cyber (C) »), la ligne grille scoring (pointer v3, 102+6 indicateurs), et ajouter une
ligne « Moteur de calcul : `semplice-composite.js` (composites calculés, jamais stockés) ».
Respecter la contrainte ≤ 2 000 tokens du fichier (remplacer, ne pas ajouter).

- [ ] **Step 4 : Suite complète finale + commit**

```bash
bash scripts/tests/run-tests.sh
git add scripts/veille-continue.mjs CLAUDE.md
git commit -m "feat(veille): thème watchlist IA souveraine + doc projet SEMPLICE v3"
```

---

## Ordre d'exécution et jalons

```
Phase A (moteur)   : Task 1 → 2 → 3     — jalon : composites reproductibles, site inchangé sémantiquement
Phase B (bascule)  : Task 4 → 5 → 6     — jalon : référentiel v3 documenté + validateur prêt
                     Task 7              — jalon : LA bascule (scores IA + poids v3) — le plus gros risque,
                                           relire le rescoring avant commit
                     Task 8 → 9 → 10     — jalon : cohérence site + veille + doc
```

Chaque tâche est committée séparément. En cas de doute sur le rescoring (Task 7), s'arrêter après le
Batch 1 et faire valider les 6 premières zones par l'utilisateur avant de continuer.
