# Refonte des pages d'analyse — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre les 11 articles `analyse-*.html` en « dossier à deux temps » (page de garde condensée + corps avec gouttière de sources), en extrayant un squelette partagé qui supprime la duplication de coquille.

**Architecture:** Trois modules. `assets/article-model.js` porte la logique pure (tri des dimensions, largeurs de scénarios, index des sources) — sans React, testable en Node. `assets/article-shell.js` porte les composants React et consomme le modèle. `scripts/extract-sources.mjs` convertit le contenu existant en sortant les mentions `(source : …)` du texte. Séquence : pilote Ukraine, puis mutualisation, puis les 10 autres, puis le gabarit.

**Tech Stack:** Modules ES natifs, React 18 via esm.sh, Tailwind CDN, `node --test` (Node 25).

**Spec:** `docs/superpowers/specs/2026-07-25-analyses-redesign-design.md`

---

## Contraintes non négociables

- **Aucune modification de couleur.** L'identité v2 chaude et les couleurs-donnée SEMPLICE (`#006650`, paliers, échelles de scénario) restent strictement intactes. Voir `CLAUDE.md` §3.
- **Aucun contenu éditorial ne doit disparaître.** Chaque conversion est suivie d'un contrôle de conservation du texte.
- Node 25 : `node --test <dir>` échoue. Toujours utiliser le glob quoté : `node --test 'test/**/*.test.mjs'`.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `assets/article-model.js` (créer) | Logique pure : parsing des probabilités, dimensions dominantes, largeurs de scénarios, index des sources. Aucun import React. |
| `assets/article-shell.js` (créer) | Composants React : `Navigation`, `Cover`, `Section`, `P`, `Body`, `Apparatus`, `Footer`, `renderArticle`. |
| `scripts/extract-sources.mjs` (créer) | Outil de conversion : sort les mentions `(source : …)` du texte d'un article. |
| `test/article-model.test.mjs` (créer) | Tests de la logique pure. |
| `test/extract-sources.test.mjs` (créer) | Tests de l'extraction. |
| `package.json` (modifier) | Ajout du bloc `scripts`. |
| `analyse-*.html` (modifier ×11) | Réduits à leurs données + corps rédactionnel + appel au squelette. |
| `analysis-template.html` (modifier) | Gabarit réécrit sur le squelette. |

---

### Task 1 : Harness de test

**Files:**
- Modify: `package.json`
- Create: `test/harness.test.mjs`

- [ ] **Step 1 : Écrire le test de fumée**

Créer `test/harness.test.mjs` :

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('le harness de test fonctionne', () => {
  assert.equal(1 + 1, 2)
})
```

- [ ] **Step 2 : Vérifier qu'il échoue faute de script**

Run: `npm test`
Expected: échec — `npm error Missing script: "test"`

- [ ] **Step 3 : Ajouter le bloc scripts**

Dans `package.json`, ajouter avant `"dependencies"` :

```json
  "scripts": {
    "test": "node --test 'test/**/*.test.mjs'"
  },
```

- [ ] **Step 4 : Vérifier que le test passe**

Run: `npm test`
Expected: `# pass 1`, `# fail 0`

- [ ] **Step 5 : Commit**

```bash
git add package.json test/harness.test.mjs
git commit -m "test: ajouter un harness node:test pour le front"
```

---

### Task 2 : `parseProbability` — lire les probabilités de scénario

Les articles écrivent les probabilités en fourchettes : `'Probabilité : 25-30 %'`. Le modèle a besoin d'un nombre.

**Files:**
- Create: `assets/article-model.js`
- Test: `test/article-model.test.mjs`

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `test/article-model.test.mjs` :

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseProbability } from '../assets/article-model.js'

test('parseProbability lit une fourchette et renvoie son milieu arrondi', () => {
  assert.equal(parseProbability('Probabilité : 25-30 %'), 28)
  assert.equal(parseProbability('Probabilité : 45-50 %'), 48)
  assert.equal(parseProbability('Probabilité : 15-20 %'), 18)
})

test('parseProbability accepte une valeur simple', () => {
  assert.equal(parseProbability('40 %'), 40)
})

test('parseProbability tolère l\'espace insécable', () => {
  assert.equal(parseProbability('Probabilité : 25-30 %'), 28)
})

test('parseProbability renvoie null si aucun nombre', () => {
  assert.equal(parseProbability('à déterminer'), null)
})
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `Cannot find module '../assets/article-model.js'`

- [ ] **Step 3 : Implémenter**

Créer `assets/article-model.js` :

```js
/* Logique pure des pages d'analyse. Aucun import React : ce module doit
   pouvoir tourner sous node --test comme dans le navigateur. */

/** Lit une probabilité de scénario. Une fourchette renvoie son milieu arrondi. */
export function parseProbability (str) {
  if (typeof str !== 'string') return null
  const nombres = str.replace(/ /g, ' ').match(/\d+(?:[.,]\d+)?/g)
  if (!nombres || nombres.length === 0) return null
  const valeurs = nombres.map(n => parseFloat(n.replace(',', '.')))
  const somme = valeurs.reduce((a, b) => a + b, 0)
  return Math.round(somme / valeurs.length)
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

Run: `npm test`
Expected: `# pass 5`, `# fail 0`

- [ ] **Step 5 : Commit**

```bash
git add assets/article-model.js test/article-model.test.mjs
git commit -m "feat(analyses): parseProbability pour les scénarios"
```

---

### Task 3 : `topDimensions` — les dimensions dominantes de la page de garde

**Files:**
- Modify: `assets/article-model.js`
- Test: `test/article-model.test.mjs`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter à `test/article-model.test.mjs` (importer aussi `topDimensions` en tête de fichier) :

```js
const DIMENSIONS = [
  { cle: 'S', nom: 'Social', risque: 5.6 },
  { cle: 'E', nom: 'Économique', risque: 5.7 },
  { cle: 'M', nom: 'Militaire', risque: 6.6 },
  { cle: 'P', nom: 'Politique', risque: 5.4 },
  { cle: 'L', nom: 'Légal', risque: 4.7 },
  { cle: 'I', nom: 'Information', risque: 5.8 },
  { cle: 'C', nom: 'Cyber', risque: 6.3 },
  { cle: 'Ee', nom: 'Environnemental', risque: 4.6 },
]

test('topDimensions renvoie les 3 dimensions au risque le plus élevé, décroissant', () => {
  const top = topDimensions(DIMENSIONS)
  assert.deepEqual(top.map(d => d.nom), ['Militaire', 'Cyber', 'Information'])
})

test('topDimensions accepte un cardinal explicite', () => {
  assert.equal(topDimensions(DIMENSIONS, 2).length, 2)
})

test('topDimensions ne modifie pas le tableau reçu', () => {
  const copie = [...DIMENSIONS]
  topDimensions(DIMENSIONS)
  assert.deepEqual(DIMENSIONS, copie)
})

test('topDimensions tolère moins de dimensions que demandé', () => {
  assert.equal(topDimensions(DIMENSIONS.slice(0, 2), 3).length, 2)
})
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `topDimensions is not a function`

- [ ] **Step 3 : Implémenter**

Ajouter à `assets/article-model.js` :

```js
/** Les n dimensions au risque le plus élevé, triées décroissant. Ne mute pas l'entrée. */
export function topDimensions (dimensions, n = 3) {
  if (!Array.isArray(dimensions)) return []
  return [...dimensions].sort((a, b) => b.risque - a.risque).slice(0, n)
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

Run: `npm test`
Expected: `# pass 9`, `# fail 0`

- [ ] **Step 5 : Commit**

```bash
git add assets/article-model.js test/article-model.test.mjs
git commit -m "feat(analyses): topDimensions pour la page de garde"
```

---

### Task 4 : `scenarioWidths` — la largeur porte la probabilité

C'est le geste qui règle la friction « scénarios incomparables ». Les largeurs sont normalisées pour occuper toute la ligne même si les probabilités ne somment pas à 100.

**Files:**
- Modify: `assets/article-model.js`
- Test: `test/article-model.test.mjs`

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter à `test/article-model.test.mjs` (importer `scenarioWidths`) :

```js
test('scenarioWidths normalise les probabilités en pourcentages de largeur', () => {
  const out = scenarioWidths([
    { titre: 'Négociation', proba: 28 },
    { titre: 'Attrition', proba: 48 },
    { titre: 'Escalade', proba: 18 },
  ])
  const total = out.reduce((s, x) => s + x.width, 0)
  assert.ok(Math.abs(total - 100) < 0.01, `somme = ${total}`)
  assert.ok(out[1].width > out[0].width)
  assert.ok(out[0].width > out[2].width)
})

test('scenarioWidths préserve les champs d\'origine', () => {
  const out = scenarioWidths([{ titre: 'A', proba: 50, texte: 'lorem' }])
  assert.equal(out[0].titre, 'A')
  assert.equal(out[0].texte, 'lorem')
  assert.equal(out[0].width, 100)
})

test('scenarioWidths impose une largeur minimale lisible', () => {
  const out = scenarioWidths([
    { titre: 'A', proba: 98 },
    { titre: 'B', proba: 2 },
  ])
  assert.ok(out[1].width >= 12, `largeur minimale non respectée : ${out[1].width}`)
})

test('scenarioWidths renvoie [] pour une entrée vide', () => {
  assert.deepEqual(scenarioWidths([]), [])
})
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `scenarioWidths is not a function`

- [ ] **Step 3 : Implémenter**

Ajouter à `assets/article-model.js` :

```js
/** Largeur minimale d'un bloc scénario, en % — en deçà le libellé devient illisible. */
const LARGEUR_MIN = 12

/** Convertit les probabilités en largeurs sommant à 100, sans bloc illisible. */
export function scenarioWidths (scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return []
  const total = scenarios.reduce((s, x) => s + (x.proba || 0), 0)
  if (total <= 0) {
    const part = 100 / scenarios.length
    return scenarios.map(s => ({ ...s, width: part }))
  }
  const brutes = scenarios.map(s => ({ ...s, width: ((s.proba || 0) / total) * 100 }))

  // Relever les blocs sous le minimum, puis reprendre le déficit sur les autres
  const sous = brutes.filter(b => b.width < LARGEUR_MIN)
  if (sous.length === 0) return brutes
  const deficit = sous.reduce((s, b) => s + (LARGEUR_MIN - b.width), 0)
  const donneurs = brutes.filter(b => b.width >= LARGEUR_MIN)
  const masseDonneurs = donneurs.reduce((s, b) => s + b.width, 0)
  return brutes.map(b =>
    b.width < LARGEUR_MIN
      ? { ...b, width: LARGEUR_MIN }
      : { ...b, width: b.width - deficit * (b.width / masseDonneurs) }
  )
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

Run: `npm test`
Expected: `# pass 13`, `# fail 0`

- [ ] **Step 5 : Commit**

```bash
git add assets/article-model.js test/article-model.test.mjs
git commit -m "feat(analyses): scenarioWidths, la largeur porte la probabilité"
```

---

### Task 5 : `extractSources` — sortir les mentions du texte

Les articles portent les mentions en clair : `(source : ISW, RUSI)`. Il faut les retirer du texte et les renvoyer séparément, pour alimenter la gouttière.

**Files:**
- Create: `scripts/extract-sources.mjs`
- Test: `test/extract-sources.test.mjs`

- [ ] **Step 1 : Écrire les tests qui échouent**

Créer `test/extract-sources.test.mjs` :

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractSources } from '../scripts/extract-sources.mjs'

test('extractSources sort une mention simple et nettoie le texte', () => {
  const r = extractSources('Les gains russes sont marginaux (source : ISW, RUSI).')
  assert.deepEqual(r.sources, ['ISW', 'RUSI'])
  assert.equal(r.text, 'Les gains russes sont marginaux.')
})

test('extractSources tolère l\'espace insécable avant les deux-points', () => {
  const r = extractSources('Texte (source : Mandiant, Google TAG).')
  assert.deepEqual(r.sources, ['Mandiant', 'Google TAG'])
  assert.equal(r.text, 'Texte.')
})

test('extractSources gère plusieurs mentions dans un même paragraphe', () => {
  const r = extractSources('Un fait (source : A). Un autre (source : B, C).')
  assert.deepEqual(r.sources, ['A', 'B', 'C'])
  assert.equal(r.text, 'Un fait. Un autre.')
})

test('extractSources dédoublonne en conservant l\'ordre', () => {
  const r = extractSources('X (source : A, B). Y (source : B, A).')
  assert.deepEqual(r.sources, ['A', 'B'])
})

test('extractSources laisse intact un texte sans mention', () => {
  const r = extractSources('Aucune source ici.')
  assert.deepEqual(r.sources, [])
  assert.equal(r.text, 'Aucune source ici.')
})
```

- [ ] **Step 2 : Vérifier l'échec**

Run: `npm test`
Expected: FAIL — `Cannot find module '../scripts/extract-sources.mjs'`

- [ ] **Step 3 : Implémenter**

Créer `scripts/extract-sources.mjs` :

```js
/* Sort les mentions « (source : X, Y) » du corps des articles pour les
   rattacher à la gouttière. La mention peut employer un espace insécable. */

const MENTION = /\s*\((?:source|sources)\s*[: ]\s*([^)]+)\)/gi

/**
 * @param {string} texte
 * @returns {{text: string, sources: string[]}} texte nettoyé + sources dédoublonnées
 */
export function extractSources (texte) {
  if (typeof texte !== 'string') return { text: '', sources: [] }
  const trouvees = []
  const nettoye = texte.replace(MENTION, (_, liste) => {
    liste
      .replace(/ /g, ' ')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(s => { if (!trouvees.includes(s)) trouvees.push(s) })
    return ''
  })
  return { text: nettoye, sources: trouvees }
}
```

> Note : la regex absorbe l'espace qui précède la parenthèse, ce qui produit `…marginaux.` et non `…marginaux .`.

- [ ] **Step 4 : Vérifier que les tests passent**

Run: `npm test`
Expected: `# pass 18`, `# fail 0`

- [ ] **Step 5 : Commit**

```bash
git add scripts/extract-sources.mjs test/extract-sources.test.mjs
git commit -m "feat(analyses): extractSources pour alimenter la gouttière"
```

---

### Task 6 : `article-shell.js` — squelette et page de garde

Le rendu React n'est pas testable sous `node --test` (React vient d'esm.sh). Il se vérifie dans le navigateur, aux étapes 4 et 5.

**Files:**
- Create: `assets/article-shell.js`
- Modify: `analyse-ukraine-mer-noire-guerre-attrition.html`

- [ ] **Step 0 : Déplacer `Navigation` et `Footer` dans le squelette**

Ces deux composants existent déjà, à l'identique, dans les 11 articles. Les couper depuis `analyse-ukraine-mer-noire-guerre-attrition.html` (fonctions `Navigation()` et `Footer()` complètes, y compris `MEGA_NAV = window.MEGA_NAV`) et les coller dans `assets/article-shell.js`, en ajoutant `export` devant chacune. **N'en modifier aucune ligne** : elles sont déjà conformes à l'identité v2 chaude. Elles dépendent de `nav-config.js`, qui reste chargé par chaque page avant le module.

- [ ] **Step 1 : Créer le squelette avec la page de garde**

Créer `assets/article-shell.js` — les composants du Step 0 viennent s'y ajouter :

```js
import React from 'https://esm.sh/react@18.2.0'
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client'
import { topDimensions, scenarioWidths } from './article-model.js'

const h = React.createElement
export { h }

const MEGA_NAV = window.MEGA_NAV
// export function Navigation () { … }   ← collé au Step 0
// export function Footer () { … }       ← collé au Step 0

/** Page de garde — temps 1 du dossier. */
export function Cover (a) {
  const top = topDimensions(a.semplice.dimensions)
  const scenarios = scenarioWidths(a.scenarios)
  return h('section', { className: 'v2-chrome pt-28 pb-12 md:pt-36 md:pb-14', style: { backgroundColor: 'var(--chrome-ground)' } },
    h('div', { className: 'max-w-4xl mx-auto px-4 sm:px-6' },

      h('p', { className: 'text-[11px] uppercase tracking-[0.18em] text-[var(--editorial-accent-text)] mb-4', style: { fontFamily: "'IBM Plex Mono',monospace" } },
        a.categorie + ' · ' + a.zone),
      h('h1', { className: 'text-2xl sm:text-3xl md:text-[2.75rem] font-extrabold text-white leading-[1.15] tracking-tight', style: { fontFamily: "'Archivo',Arial,sans-serif" } }, a.titre),
      h('p', { className: 'mt-5 text-base md:text-lg text-white/60 leading-relaxed' }, a.chapo),
      h('p', { className: 'mt-6 text-xs text-white/40', style: { fontFamily: "'IBM Plex Mono',monospace" } },
        [a.auteur, a.date, a.duree, a.bibliographie.length + ' sources'].join('  ·  ')),

      h('div', { className: 'mt-8 pt-8 border-t border-[rgba(232,228,216,.14)] grid md:grid-cols-[minmax(0,30%)_1fr] gap-8' },
        // verdict
        h('div', null,
          h('p', { className: 'text-[11px] uppercase tracking-[0.14em] text-white/40 mb-2', style: { fontFamily: "'IBM Plex Mono',monospace" } }, 'Verdict SEMPLICE'),
          h('p', { className: 'text-5xl font-extrabold text-[#006650] leading-none', style: { fontFamily: "'IBM Plex Mono',monospace" } },
            a.semplice.risque, h('span', { className: 'text-xl text-white/40' }, '/7')),
          h('p', { className: 'mt-2 text-sm text-white/70' }, a.semplice.palier + ' · ' + a.semplice.tendance),
          h('p', { className: 'text-sm text-white/50' }, 'Opportunité ' + a.semplice.opportunite + '/7')
        ),
        // dimensions dominantes
        h('div', null,
          h('p', { className: 'text-[11px] uppercase tracking-[0.14em] text-white/40 mb-3', style: { fontFamily: "'IBM Plex Mono',monospace" } }, 'Dimensions dominantes'),
          ...top.map(d =>
            h('div', { key: d.cle, className: 'flex items-center gap-3 mb-2' },
              h('span', { className: 'w-24 text-xs text-white/70' }, d.nom),
              h('span', { className: 'flex-1 h-1.5 bg-white/10' },
                h('span', { className: 'block h-1.5 bg-[#006650]', style: { width: (d.risque / 7 * 100) + '%' } })),
              h('span', { className: 'w-10 text-xs text-white/70 text-right', style: { fontFamily: "'IBM Plex Mono',monospace" } }, d.risque)
            )
          ),
          h('p', { className: 'mt-2 text-[11px] text-white/35' }, 'Les 8 dimensions : tableau complet en fin de dossier.')
        )
      ),

      // scenarios comparables
      h('div', { className: 'mt-8' },
        h('p', { className: 'text-[11px] uppercase tracking-[0.14em] text-white/40 mb-3', style: { fontFamily: "'IBM Plex Mono',monospace" } }, 'Trois scénarios à 12-24 mois'),
        h('div', { className: 'flex gap-1.5' },
          ...scenarios.map((s, i) =>
            h('div', { key: i, className: 'border border-[rgba(232,228,216,.22)] px-3 py-2.5 min-w-0', style: { width: s.width + '%' } },
              h('p', { className: 'text-lg font-bold text-white', style: { fontFamily: "'IBM Plex Mono',monospace" } }, s.proba + ' %'),
              h('p', { className: 'text-[11px] text-white/60 leading-tight' }, s.titre)
            )
          )
        )
      ),

      // ce qu'il faut retenir
      h('div', { className: 'mt-8 border-l-[3px] border-[var(--editorial-accent-text)] pl-4' },
        h('p', { className: 'text-[11px] uppercase tracking-[0.14em] text-white/40 mb-2', style: { fontFamily: "'IBM Plex Mono',monospace" } }, 'Ce qu\'il faut retenir'),
        h('p', { className: 'text-[15px] text-white/80 leading-relaxed' }, a.retenir)
      ),

      // chiffres cles
      h('div', { className: 'mt-8 pt-6 border-t border-[rgba(232,228,216,.14)] grid grid-cols-2 md:grid-cols-4 gap-5' },
        ...a.chiffres.map((c, i) =>
          h('div', { key: i },
            h('p', { className: 'text-xl font-bold text-white', style: { fontFamily: "'IBM Plex Mono',monospace" } }, c.valeur),
            h('p', { className: 'text-[11px] text-white/50 leading-tight mt-1' }, c.libelle)
          )
        )
      )
    )
  )
}
```

- [ ] **Step 2 : Câbler le pilote sur la page de garde**

Dans `analyse-ukraine-mer-noire-guerre-attrition.html`, remplacer l'import React en tête du module par :

```js
import { h, Cover } from './assets/article-shell.js'
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client'
```

puis déclarer l'objet `ARTICLE`. Toutes les valeurs ci-dessous sont reprises telles quelles de la page actuelle — tableau SEMPLICE, cartes de scénario, key-figures, synthèse exécutive, liste de sources :

```js
import { parseProbability } from './assets/article-model.js'

const ARTICLE = {
  categorie: 'GÉOPOLITIQUE',
  zone: 'Europe de l\'Est & Mer Noire',
  titre: 'Ukraine / Mer Noire — Guerre d\'attrition et recomposition stratégique',
  chapo: 'Plus de mille jours de guerre. Le front est stabilisé mais la guerre d\'attrition se poursuit sur tous les axes — militaire, économique, cyber, informationnel.',
  auteur: 'Inflexion Research',
  date: '15 mars 2026',
  duree: '22 min de lecture',
  semplice: {
    risque: 5.6, palier: 'Très élevé', tendance: 'en hausse ↑', opportunite: 3.2,
    dimensions: [
      { cle: 'S',  nom: 'Social',          risque: 5.6, opp: 4, tendance: '↑' },
      { cle: 'E',  nom: 'Économique',      risque: 5.7, opp: 3, tendance: '↑' },
      { cle: 'M',  nom: 'Militaire',       risque: 6.6, opp: 1, tendance: '↑' },
      { cle: 'P',  nom: 'Politique',       risque: 5.4, opp: 3, tendance: '↑' },
      { cle: 'L',  nom: 'Légal',           risque: 4.7, opp: 3, tendance: '→' },
      { cle: 'I',  nom: 'Information',     risque: 5.8, opp: 5, tendance: '↑' },
      { cle: 'C',  nom: 'Cyber',           risque: 6.3, opp: 4, tendance: '↑' },
      { cle: 'Ee', nom: 'Environnemental', risque: 4.6, opp: 3, tendance: '→' },
    ],
  },
  // parseProbability lit les fourchettes telles qu'elles sont écrites aujourd'hui
  scenarios: [
    { titre: 'Négociation sous pression', proba: parseProbability('25-30 %'), texte: 'Sous pression américaine, un cessez-le-feu est négocié avec gel de la ligne de contact…' },
    { titre: 'Attrition prolongée',       proba: parseProbability('45-50 %'), texte: 'Le statu quo perdure. Le front reste figé, les frappes mutuelles se poursuivent…' },
    { titre: 'Escalade et débordement',   proba: parseProbability('15-20 %'), texte: 'Escalade non contrôlée : frappe russe sur un convoi OTAN, cyberattaque massive…' },
  ],
  chiffres: [
    { valeur: '1 000+',    libelle: 'jours de guerre' },
    { valeur: '~180 Mrd$', libelle: 'PIB (vs 200 Mrd$ pré-guerre)' },
    { valeur: '90 %',      libelle: 'dette publique / PIB' },
    { valeur: '486 Mrd$',  libelle: 'besoins de reconstruction' },
  ],
  retenir: 'L\'Ukraine entre dans sa troisième année de guerre d\'attrition. Le front terrestre est largement stabilisé, mais le conflit s\'est déplacé sur des axes asymétriques — cyber-offensives, guerre informationnelle, frappes sur les infrastructures énergétiques.',
  matrice: [
    { secteur: 'Défense',        niveau: 'CRITIQUE',    reco: 'Accélérer programmes drones/IA, adapter doctrine RETEX Ukraine' },
    { secteur: 'Énergie',        niveau: 'ÉLEVÉ',       reco: 'Diversification gaz poursuivie, stockage stratégique, résilience réseau' },
    { secteur: 'Agroalimentaire', niveau: 'MODÉRÉ',     reco: 'Corridors céréaliers alternatifs, veille prix blé/maïs' },
    { secteur: 'Cyber',          niveau: 'CRITIQUE',    reco: 'Renforcer ANSSI, doctrine cyber offensive, partage renseignement' },
    { secteur: 'Reconstruction', niveau: 'OPPORTUNITÉ', reco: 'Positionnement BTP/infra français, Vinci/Bouygues/EDF' },
  ],
  alertes: [
    { signal: 'Réduction aide US > 50 %',                lecture: 'signal de basculement stratégique' },
    { signal: 'Cessez-le-feu imposé sans garanties',     lecture: 'risque de conflit gelé défavorable' },
    { signal: 'Attaque cyber majeure sur infra UE',      lecture: 'escalade hors zone de conflit' },
    { signal: 'Mobilisation générale russe déclarée',    lecture: 'signal d\'intensification militaire' },
    { signal: 'Rupture corridor céréalier mer Noire',    lecture: 'choc alimentaire global' },
    { signal: 'Défaut souverain ukrainien post-2027',    lecture: 'crise de confiance créanciers' },
  ],
  bibliographie: [
    { nom: 'International Crisis Group (ICG)', url: 'https://www.crisisgroup.org/', note: 'Ukraine : conflict tracker, analyses stratégiques' },
    { nom: 'IISS', url: 'https://www.iiss.org/', note: 'The Military Balance 2026' },
    // … reprendre les 14 entrées de la liste actuelle
  ],
  amf: 'Cette analyse est fournie à titre informatif et ne constitue en aucun cas un conseil en investissement, une recommandation personnalisée ou une incitation à acheter ou vendre des instruments financiers. Les performances passées ne préjugent pas des performances futures. Tout investissement comporte des risques de perte en capital. Les évaluations de risque SEMPLICE reflètent une appréciation à date et ne constituent pas une garantie.',
  articlesLies: [
    { titre: 'Pétrole à 119 $ : Trump, Iran et le détroit d\'Ormuz', href: 'analyse-petrole-trump-iran-ormuz.html', img: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=300&h=200&fit=crop', cat: 'Géopolitique' },
    { titre: 'Arctique / Groenland : le grand jeu polaire', href: 'analyse-arctique-groenland-grand-jeu-polaire.html', img: 'https://images.unsplash.com/photo-1517783999520-f068d7431571?w=300&h=200&fit=crop', cat: 'Géopolitique' },
    { titre: 'Cuba — La crise de trop', href: 'analyse-cuba-crise-perspectives.html', img: 'https://images.unsplash.com/photo-1570299437488-d430e1e677c7?w=300&h=200&fit=crop', cat: 'Géopolitique' },
  ],
}
```

- [ ] **Step 3 : Vérifier la syntaxe du module**

```bash
python3 -c "
import io,re
s=io.open('analyse-ukraine-mer-noire-guerre-attrition.html',encoding='utf-8').read()
io.open('/tmp/chk.mjs','w',encoding='utf-8').write(re.search(r'<script type=\"module\">(.*?)</script>',s,re.S).group(1))"
node --check /tmp/chk.mjs
```
Expected: aucune sortie (succès)

- [ ] **Step 4 : Vérifier le rendu dans le navigateur**

Servir : `python3 -m http.server 4399 --directory .`
Ouvrir `http://localhost:4399/analyse-ukraine-mer-noire-guerre-attrition.html`, **hard reload `cmd+shift+r`** (indispensable : `http.server` n'envoie pas de `no-cache`).

Contrôles attendus, via la console :

```js
document.querySelectorAll('section .flex.gap-1\\.5 > div').length   // 3 scénarios
getComputedStyle(document.querySelector('section')).backgroundColor // rgb(23, 16, 14)
```

- [ ] **Step 5 : Vérifier que la donnée SEMPLICE a conservé sa couleur**

```js
getComputedStyle([...document.querySelectorAll('p')].find(p => p.textContent.startsWith('5.6'))).color
```
Expected: `rgb(0, 102, 80)` — l'emerald des scores est une couleur-donnée, elle ne doit pas avoir bougé.

- [ ] **Step 6 : Commit**

```bash
git add assets/article-shell.js analyse-ukraine-mer-noire-guerre-attrition.html
git commit -m "feat(analyses): page de garde du dossier à deux temps"
```

---

### Task 7 : `Body` — rail de progression, colonne de lecture, gouttière

**Files:**
- Modify: `assets/article-shell.js`
- Modify: `analyse-ukraine-mer-noire-guerre-attrition.html`

- [ ] **Step 1 : Ajouter `Section`, `P` et `Body`**

Ajouter à `assets/article-shell.js` :

```js
const ROMAINS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

/** Une section du corps. `sources` agrège celles de ses paragraphes pour la gouttière. */
export function Section (props, ...children) {
  const { num, titre, dimension } = props
  return h('section', { key: num, id: 'section-' + num, className: 'mb-12 scroll-mt-24', 'data-section': num },
    h('h2', { className: 'text-xl md:text-2xl font-extrabold text-[var(--text-primary)] leading-snug mb-4' },
      h('span', { className: 'text-[var(--editorial-accent)] mr-3', style: { fontFamily: "'IBM Plex Mono',monospace" } }, ROMAINS[num - 1]),
      titre),
    ...children,
    dimension ? h('p', { className: 'sr-only' }, 'Dimension SEMPLICE : ' + dimension) : null
  )
}

/** Un paragraphe. Ses sources vont dans la gouttière, en regard. */
export function P (props, ...children) {
  const sources = props && props.sources ? props.sources : []
  return h('div', { className: 'md:grid md:grid-cols-[1fr_200px] md:gap-8 mb-5' },
    h('p', { className: 'text-base leading-relaxed text-[var(--text-secondary)]' }, ...children),
    h('aside', { className: 'mt-2 md:mt-0 text-[11px] leading-snug text-[var(--text-secondary)] md:border-l md:border-[var(--hairline-warm)] md:pl-4' },
      sources.length
        ? [
            h('span', { key: 'l', className: 'block uppercase tracking-[0.12em] text-[var(--editorial-accent)] mb-1', style: { fontFamily: "'IBM Plex Mono',monospace" } }, 'Source'),
            h('span', { key: 's' }, sources.join(' · ')),
          ]
        : null
    )
  )
}

/** Corps du dossier : rail de progression + sections. */
export function Body (article, sections) {
  return h('div', { className: 'max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16' },
    h('div', { className: 'md:grid md:grid-cols-[40px_1fr] md:gap-6' },
      h('nav', { className: 'hidden md:block', 'aria-label': 'Sections' },
        h('ol', { className: 'sticky top-24 space-y-3 text-[11px] text-right pr-3 border-r border-[var(--hairline-warm)]', style: { fontFamily: "'IBM Plex Mono',monospace" } },
          ...sections.map((s, i) =>
            h('li', { key: i },
              h('a', { href: '#section-' + (i + 1), className: 'text-[var(--text-secondary)] hover:text-[var(--editorial-accent)] transition-colors' }, ROMAINS[i]))
          )
        )
      ),
      h('div', { className: 'min-w-0' }, ...sections)
    )
  )
}
```

- [ ] **Step 2 : Convertir le corps du pilote**

Remplacer les `h('h2',null,…)` / `h('p',null,…)` du pilote par des appels `Section` / `P`, en déplaçant chaque mention `(source : …)` du texte vers la prop `sources`. Exemple de conversion :

```js
// AVANT
h('p', null, 'L’ISW estime que les gains russes représentent ',
  h('strong', null, 'moins de 0,5 %'), ' du territoire (source : ISW, RUSI).'),

// APRÈS
P({ sources: ['ISW', 'RUSI'] },
  'L’ISW estime que les gains russes représentent ',
  h('strong', null, 'moins de 0,5 %'), ' du territoire.'),
```

- [ ] **Step 3 : Contrôler la conservation des mentions**

```bash
git stash && grep -o "source.u00a0:" analyse-ukraine-mer-noire-guerre-attrition.html | wc -l && git stash pop
grep -o "sources: \[" analyse-ukraine-mer-noire-guerre-attrition.html | wc -l
```
Expected: le second nombre est égal au premier (16 pour cet article). Une différence signale une mention perdue.

- [ ] **Step 4 : Vérifier la syntaxe et le rendu**

```bash
python3 -c "
import io,re
s=io.open('analyse-ukraine-mer-noire-guerre-attrition.html',encoding='utf-8').read()
io.open('/tmp/chk.mjs','w',encoding='utf-8').write(re.search(r'<script type=\"module\">(.*?)</script>',s,re.S).group(1))"
node --check /tmp/chk.mjs
```

Puis dans le navigateur, après hard reload :

```js
document.querySelectorAll('[data-section]').length        // = nombre de sections
document.querySelectorAll('aside').length                 // = nombre de paragraphes
document.body.innerText.includes('(source')               // false : plus aucune mention dans le texte
```

- [ ] **Step 5 : Commit**

```bash
git add assets/article-shell.js analyse-ukraine-mer-noire-guerre-attrition.html
git commit -m "feat(analyses): corps à gouttière et rail de progression"
```

---

### Task 8 : `Apparatus` — l'appareil critique

**Files:**
- Modify: `assets/article-shell.js`
- Modify: `analyse-ukraine-mer-noire-guerre-attrition.html`

- [ ] **Step 1 : Ajouter `Apparatus`**

Ajouter à `assets/article-shell.js`. Les blocs facultatifs (`matrice`, `alertes`) sont omis quand la clé est absente — tous les articles ne les portent pas.

```js
/* Paliers de la matrice d'impact. Ces couleurs encodent une DONNÉE (niveau de
   risque / opportunité) : elles sont reprises telles quelles de la page actuelle
   et ne doivent pas être migrées vers la palette d'identité. */
const NIVEAUX = {
  'CRITIQUE':    { backgroundColor: '#DC2626', color: '#FFFFFF' },
  'ÉLEVÉ':       { backgroundColor: '#f59e0b', color: '#FFFFFF' },
  'MODÉRÉ':      { backgroundColor: '#f59e0b', color: '#FFFFFF' },
  'OPPORTUNITÉ': { backgroundColor: 'rgba(0,102,80,.1)', color: '#006650' },
  'NEUTRE':      { backgroundColor: '#E2E5EB', color: '#1A1F2E' },
  'EXCLU':       { backgroundColor: '#E2E5EB', color: '#1A1F2E' },
}

/** Appareil critique : SEMPLICE complet, scénarios développés, matrice, alertes, sources, AMF, CTA, articles liés. */
export function Apparatus (a) {
  return h('div', { className: 'max-w-3xl mx-auto px-4 sm:px-6 pb-16' },

    h('h2', { className: 'text-xl font-extrabold text-[var(--text-primary)] mb-4' }, 'Évaluation SEMPLICE'),
    h('table', { className: 'w-full text-sm border-collapse mb-12' },
      h('thead', null,
        h('tr', { className: 'bg-[rgba(94,74,58,.08)]' },
          ...['Dimension', 'Risque', 'Opportunité', 'Tendance'].map(t =>
            h('th', { key: t, className: 'text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--hairline-warm)]' }, t))
        )
      ),
      h('tbody', null,
        ...a.semplice.dimensions.map(d =>
          h('tr', { key: d.cle, className: 'border-b border-[var(--hairline-warm)]' },
            h('td', { className: 'px-3 py-2.5 font-medium text-[var(--text-primary)]' }, d.nom),
            h('td', { className: 'px-3 py-2.5 font-data font-semibold text-[#006650]' }, d.risque + '/7'),
            h('td', { className: 'px-3 py-2.5 font-data text-[#5A6178]' }, d.opp + '/7'),
            h('td', { className: 'px-3 py-2.5' }, d.tendance)
          )
        )
      )
    ),

    // Scénarios développés — les couleurs ci-dessous encodent une échelle de gravité :
    // les reprendre à l'identique de la page actuelle, ne rien recolorer.
    h('h2', { className: 'text-xl font-extrabold text-[var(--text-primary)] mb-4' }, 'Trois scénarios à 12-24 mois'),
    h('div', { className: 'mb-12' },
      ...a.scenarios.map((s, i) => {
        const teintes = [
          { bord: '#006650', fond: '#F0FAF5', texte: '#006650' },
          { bord: '#EAB308', fond: '#FFFBEB', texte: '#92400E' },
          { bord: '#DC2626', fond: '#FEF2F2', texte: '#991B1B' },
        ][i] || { bord: '#006650', fond: '#F0FAF5', texte: '#006650' }
        return h('div', { key: i, className: 'not-prose my-6 overflow-hidden border', style: { borderColor: teintes.bord, backgroundColor: teintes.fond } },
          h('div', { className: 'px-5 py-3 flex items-center justify-between border-b', style: { borderColor: teintes.bord } },
            h('span', { className: 'text-sm font-bold', style: { color: teintes.texte } }, 'Scénario ' + (i + 1) + ' — ' + s.titre),
            h('span', { className: 'text-xs font-semibold px-2 py-1', style: { color: teintes.texte } }, 'Probabilité : ' + s.proba + ' %')
          ),
          h('div', { className: 'px-5 py-4' },
            h('p', { className: 'text-sm text-[var(--text-secondary)] leading-relaxed' }, s.texte))
        )
      })
    ),

    // Matrice d'impact — facultative : tous les articles n'en portent pas
    a.matrice ? h('h2', { className: 'text-xl font-extrabold text-[var(--text-primary)] mb-4' }, 'Impact sectoriel') : null,
    a.matrice ? h('table', { className: 'w-full text-sm border-collapse mb-12' },
      h('thead', null,
        h('tr', { className: 'bg-[rgba(94,74,58,.08)]' },
          ...['Secteur', 'Niveau', 'Recommandation'].map(t =>
            h('th', { key: t, className: 'text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--hairline-warm)]' }, t))
        )
      ),
      h('tbody', null,
        ...a.matrice.map((m, i) =>
          h('tr', { key: i, className: 'border-b border-[var(--hairline-warm)]' },
            h('td', { className: 'px-3 py-2.5 font-medium text-[var(--text-primary)]' }, m.secteur),
            h('td', { className: 'px-3 py-2.5' }, h('span', { className: 'text-xs font-semibold px-2 py-0.5', style: NIVEAUX[m.niveau] }, m.niveau)),
            h('td', { className: 'px-3 py-2.5 text-[var(--text-secondary)]' }, m.reco)
          )
        )
      )
    ) : null,

    // Indicateurs d'alerte — facultatifs
    a.alertes ? h('div', { className: 'insight-box not-prose mb-12' },
      h('div', { className: 'text-[11px] font-semibold uppercase tracking-wider text-[var(--editorial-accent)] mb-2' }, 'Indicateurs d\'alerte à surveiller'),
      h('ul', { className: 'space-y-1.5 text-sm text-[var(--text-secondary)]' },
        ...a.alertes.map((al, i) =>
          h('li', { key: i }, h('strong', null, al.signal), ' — ' + al.lecture))
      )
    ) : null,

    h('h2', { className: 'text-xl font-extrabold text-[var(--text-primary)] mb-4' }, 'Sources'),
    h('ul', { className: 'space-y-1.5 mb-12' },
      ...a.bibliographie.map((s, i) =>
        h('li', { key: i },
          h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', className: 'text-xs text-[var(--editorial-accent)] hover:underline' },
            s.nom + (s.note ? ' — ' + s.note : ''))
        )
      )
    ),

    h('div', { className: 'insight-box gold not-prose mb-12' },
      h('div', { className: 'text-[11px] font-semibold uppercase tracking-wider text-[#9A7506] mb-2' }, 'Avertissement AMF'),
      h('p', { className: 'text-xs text-[var(--text-secondary)] leading-relaxed' }, a.amf)
    ),

    // CTA en sortie de lecture — décision 5 de la spec
    h('div', { className: 'text-center mb-16' },
      h('a', { href: 'premium.html', className: 'inline-block px-7 py-3.5 bg-[var(--editorial-accent)] hover:bg-[#6E1B1B] text-[#F5EDE6] font-semibold text-sm transition-colors' },
        'Réserver un diagnostic')
    ),

    // Articles liés — sortis de la lecture, décision 4 de la spec
    h('div', { className: 'pt-10 border-t border-[var(--hairline-warm)]' },
      h('p', { className: 'text-[11px] font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-5', style: { fontFamily: "'IBM Plex Mono',monospace" } }, 'Articles liés'),
      h('div', { className: 'grid grid-cols-1 sm:grid-cols-3 gap-6' },
        ...a.articlesLies.map((r, i) =>
          h('a', { key: i, href: r.href, className: 'article-card block overflow-hidden bg-[var(--surface-raised)] border border-[var(--hairline-warm)] no-underline' },
            h('div', { className: 'aspect-[16/9] overflow-hidden' },
              h('img', { src: r.img, alt: '', className: 'w-full h-full object-cover', loading: 'lazy' })),
            h('div', { className: 'p-4' },
              h('span', { className: 'category-geo text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5', style: { fontFamily: "'IBM Plex Mono',monospace" } }, r.cat),
              h('p', { className: 'mt-2 text-sm font-semibold text-[var(--text-primary)] leading-snug' }, r.titre)
            )
          )
        )
      )
    )
  )
}

/** Monte l'article complet dans #app. */
export function renderArticle (article, sections) {
  createRoot(document.getElementById('app')).render(
    h('div', null,
      h(Navigation),
      h('main', { id: 'main-content' }, Cover(article), Body(article, sections), Apparatus(article)),
      h(Footer)
    )
  )
}
```

> `Navigation` et `Footer` sont repris **à l'identique** de `analyse-ukraine-mer-noire-guerre-attrition.html` (état actuel après migration v2) et déplacés dans ce module. Ne rien y changer : ils sont déjà conformes à l'identité chaude.

- [ ] **Step 2 : Basculer le pilote sur `renderArticle`**

Remplacer la fin du module du pilote par :

```js
renderArticle(ARTICLE, SECTIONS)
```

- [ ] **Step 3 : Vérifier la conservation du contenu**

```bash
git stash
python3 - <<'PY' > /tmp/avant.txt
import io,re
s=io.open('analyse-ukraine-mer-noire-guerre-attrition.html',encoding='utf-8').read()
print('\n'.join(sorted(set(re.findall(r"'([^']{60,})'", s)))))
PY
git stash pop
python3 - <<'PY' > /tmp/apres.txt
import io,re
s=io.open('analyse-ukraine-mer-noire-guerre-attrition.html',encoding='utf-8').read()
print('\n'.join(sorted(set(re.findall(r"'([^']{60,})'", s)))))
PY
diff /tmp/avant.txt /tmp/apres.txt | grep '^<' | head -20
```
Expected: seules des lignes contenant `(source` apparaissent en suppression. Tout autre paragraphe disparu est une régression à corriger.

- [ ] **Step 4 : Vérifier le rendu et les couleurs-donnée**

Dans le navigateur, après hard reload :

```js
document.querySelectorAll('table tbody tr').length   // 8 dimensions
getComputedStyle(document.querySelector('table tbody td:nth-child(2)')).color  // rgb(0, 102, 80)
```

- [ ] **Step 5 : Commit**

```bash
git add assets/article-shell.js analyse-ukraine-mer-noire-guerre-attrition.html
git commit -m "feat(analyses): appareil critique et montage complet du pilote"
```

---

### Task 9 : Validation visuelle du pilote

**Files:** aucun (étape de contrôle)

- [ ] **Step 1 : Capturer la page complète**

Serveur lancé, hard reload, puis captures à 1440 px : page de garde, corps avec gouttière, appareil.

- [ ] **Step 2 : Vérifier le repli mobile**

`resize_window` est inopérant dans cet environnement (cf. mémoire projet). Contrôler par styles calculés que la gouttière passe sous le texte :

```js
getComputedStyle(document.querySelector('.md\\:grid')).gridTemplateColumns
```
En dessous de 768 px la valeur doit être une colonne unique.

- [ ] **Step 3 : Faire valider par l'utilisateur avant propagation**

Ne pas convertir les 10 autres articles avant accord explicite. C'est la méthode qui a fonctionné pour la migration d'identité v2.

---

### Task 10 : Propager aux 10 autres articles

**Files:**
- Modify: les 10 `analyse-*.html` restants

- [ ] **Step 1 : Convertir un article**

Pour chaque article, dans cet ordre — `arctique-groenland-grand-jeu-polaire`, `cloud-ia-pme-europeennes`, `corridor-defense-france-inde`, `cuba-crise-perspectives`, `fta-ue-inde-traite-fiscal`, `madagascar-fragilite-ressources`, `mer-chine-taiwan-indopacifique`, `petrole-trump-iran-ormuz`, `sahel-mali-niger-burkina-crise`, `turquie-erdogan-equilibriste` — appliquer la même conversion qu'au pilote : objet `ARTICLE`, corps en `Section`/`P`, appel `renderArticle`.

`cloud-ia-pme-europeennes` diverge : il porte `.pillar-card`, `.matrix-table`, `.data-row` et `.section-number` que les autres n'ont pas. Conserver ces composants tels quels dans la page ; ils ne passent pas dans le squelette.

- [ ] **Step 2 : Contrôler la conservation, article par article**

Même contrôle qu'à la Task 8, Step 3. Le nombre de `sources: [` doit égaler le nombre de mentions d'origine.

- [ ] **Step 3 : Vérifier la syntaxe**

```bash
for f in analyse-*.html; do
  python3 -c "
import io,re,sys
s=io.open('$f',encoding='utf-8').read()
m=re.search(r'<script type=\"module\">(.*?)</script>',s,re.S)
if m: io.open('/tmp/chk.mjs','w',encoding='utf-8').write(m.group(1))"
  node --check /tmp/chk.mjs 2>/dev/null && echo "  OK   $f" || echo "  FAIL $f"
done
```
Expected: `OK` pour les 11 articles refondus. Les 3 articles legacy (`droits-douane`, `ia-rempart`, `or-bitcoin`) n'ont pas de module ES et sont hors périmètre.

- [ ] **Step 4 : Commit par lot de trois articles**

```bash
git add analyse-arctique-groenland-grand-jeu-polaire.html analyse-cloud-ia-pme-europeennes.html analyse-corridor-defense-france-inde.html
git commit -m "refactor(analyses): convertir 3 articles sur le squelette partagé"
```

---

### Task 11 : Réécrire le gabarit

**Files:**
- Modify: `analysis-template.html`

- [ ] **Step 1 : Réduire le gabarit au squelette**

Remplacer le module du gabarit par un `ARTICLE` d'exemple complet (toutes les clés renseignées avec des valeurs manifestement fictives), un `SECTIONS` de deux sections dont une avec `sources`, et l'appel `renderArticle`. Le gabarit doit montrer la forme attendue, pas du contenu réel.

- [ ] **Step 2 : Vérifier que le gabarit rend**

Ouvrir `http://localhost:4399/analysis-template.html` après hard reload. La page de garde, le rail, la gouttière et l'appareil doivent s'afficher avec les valeurs d'exemple.

- [ ] **Step 3 : Documenter le format dans le CLAUDE.md**

Ajouter en §3, après le bloc « Architecture réelle des pages » :

```markdown
**Articles d'analyse** : coquille mutualisée dans `assets/article-shell.js` (+ logique pure dans `assets/article-model.js`, testée par `npm test`). Chaque `analyse-*.html` ne porte plus que son objet `ARTICLE`, son corps en `Section`/`P`, et un appel `renderArticle`. Les sources vivent dans la prop `sources` des paragraphes, plus dans le texte. Gabarit : `analysis-template.html`.
```

- [ ] **Step 4 : Lancer la suite de tests complète**

Run: `npm test`
Expected: `# fail 0`

- [ ] **Step 5 : Commit**

```bash
git add analysis-template.html CLAUDE.md
git commit -m "refactor(analyses): gabarit sur le squelette partagé"
```

---

## Vérification finale

- [ ] `npm test` — `# fail 0`
- [ ] `node --check` passe sur les 11 modules d'articles
- [ ] Aucune mention `(source` ne subsiste dans le texte rendu des 11 articles
- [ ] Les scores SEMPLICE rendent en `rgb(0, 102, 80)` — couleur-donnée préservée
- [ ] Aucun paragraphe perdu à la conversion (contrôle de diff textuel sur les 11)
- [ ] Captures desktop des 11 articles + du gabarit
