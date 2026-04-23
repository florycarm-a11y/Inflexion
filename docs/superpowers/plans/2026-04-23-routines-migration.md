# Migration pipeline IA Inflexion vers Claude Code Routines — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer les workflows IA Inflexion (briefing, article, newsletter, SEMPLICE) depuis des appels API Anthropic directs en GitHub Actions vers 4 Claude Code Routines, en conservant les scripts `.mjs` comme filet de sécurité.

**Architecture:** 1 Routine Master (orchestrateur quotidien, trigger webhook GHA + schedule fallback) + 1 Inspector (vérif production post-deploy) + 1 Newsletter hebdo + 1 SEMPLICE Validator hebdo. Les scripts mécaniques (`insight-filter`, `generate-market-analysis`, `veille-continue`, `rag-index`, `validate-article`) sont invoqués en bash par les Routines ; la génération éditoriale (briefing, article, newsletter) est faite en langage naturel par Claude.

**Tech Stack:** Claude Code Routines (infra Anthropic), GitHub Actions, Node.js 22, bash, `gh` CLI, curl.

**Référence** : [Design spec](../specs/2026-04-23-routines-migration-design.md)

---

## Structure de fichiers

### Créés
- `.routines/README.md` — doc setup + rollback
- `.routines/master-prompt.md` — prompt système Routine Master
- `.routines/inspector-prompt.md` — prompt Inspector
- `.routines/newsletter-prompt.md` — prompt Newsletter
- `.routines/semplice-validator-prompt.md` — prompt SEMPLICE
- `scripts/test-routine-output.mjs` — test de régression du JSON produit par Master
- `scripts/tests/test-routine-output.test.mjs` — tests unitaires du script ci-dessus

### Modifiés
- `.github/workflows/fetch-data.yml` — ajout étape `curl POST` pour déclencher Master
- `.github/workflows/ci.yml` — ajout `test-routine-output` dans `test-scripts`
- `.github/workflows/generate-article.yml` — commenter `on: schedule:` (phase C)
- `.github/workflows/generate-unified-briefing.yml` — commenter `on: schedule:` (phase C)
- `.github/workflows/generate-newsletter.yml` — commenter `on: schedule:` (phase D)
- `CLAUDE.md` — ajouter section "Claude Code Routines"

### Inchangés (filet de sécurité)
- `scripts/insight-filter.mjs`, `scripts/generate-market-analysis.mjs`, `scripts/generate-daily-briefing.mjs`, `scripts/generate-article.mjs`, `scripts/generate-newsletter.mjs`, `scripts/veille-continue.mjs`, `scripts/rag-index.mjs`, `scripts/validate-article.mjs`, `scripts/semplice-validator.mjs`

---

# PHASE 1 — Artefacts code (semaine 1)

## Task 1 : Créer le répertoire `.routines/` et son README

**Files:**
- Create: `.routines/README.md`

- [ ] **Step 1 : Créer le fichier README**

Créer `.routines/README.md` avec le contenu suivant :

```markdown
# Claude Code Routines — Inflexion

Ce répertoire contient les prompts système des 4 Routines Claude Code qui orchestrent le pipeline IA d'Inflexion.

## Routines

| Fichier | Routine | Trigger | Fréquence |
|---------|---------|---------|-----------|
| `master-prompt.md` | Inflexion Master Pipeline | API webhook (fetch-data) + schedule `30 6,18 * * *` | 2x/jour |
| `inspector-prompt.md` | Inflexion Production Inspector | schedule `0 7,19 * * *` | 2x/jour (Master +30min) |
| `newsletter-prompt.md` | Inflexion Weekly Newsletter | schedule `0 10 * * 0` | dimanche 10h UTC |
| `semplice-validator-prompt.md` | Inflexion SEMPLICE Weekly Validator | schedule `0 22 * * 6` | samedi 22h UTC |

## Setup initial

1. Créer chaque Routine sur https://claude.ai/code via `/schedule`
2. Copier-coller le contenu du fichier `.md` correspondant dans le prompt système
3. Connecter le repository `Inflexion`
4. Configurer triggers (API pour Master, schedule pour tous)
5. Pour Master : récupérer l'endpoint URL et le token, ajouter en secrets GHA :
   - `ROUTINE_WEBHOOK_TOKEN`
   - `ROUTINE_MASTER_URL`

## Rollback

Si les Routines dysfonctionnent de manière répétée :

1. Décommenter `on: schedule:` dans :
   - `.github/workflows/generate-article.yml`
   - `.github/workflows/generate-unified-briefing.yml`
   - `.github/workflows/generate-newsletter.yml`
2. Désactiver les 4 Routines sur claude.ai/code
3. Push → le pipeline GHA legacy reprend

## Références

- Design spec : `docs/superpowers/specs/2026-04-23-routines-migration-design.md`
- Plan d'implémentation : `docs/superpowers/plans/2026-04-23-routines-migration.md`
- Blog Anthropic : https://claude.com/blog/introducing-routines-in-claude-code
```

- [ ] **Step 2 : Vérifier que le fichier est bien créé**

Run:
```bash
ls -la .routines/README.md
```
Expected: fichier existe, taille > 1 Ko

- [ ] **Step 3 : Commit**

```bash
git add .routines/README.md
git commit -m "📁 .routines/ — squelette initial + README doc migration"
```

---

## Task 2 : Écrire `master-prompt.md`

**Files:**
- Create: `.routines/master-prompt.md`

- [ ] **Step 1 : Créer le fichier master-prompt.md**

Créer `.routines/master-prompt.md` avec le contenu suivant :

````markdown
# Inflexion Master Pipeline — System Prompt

Tu es le pipeline d'intelligence quotidien d'Inflexion (https://inflexionhub.com/).

## Contexte obligatoire à charger avant toute action

1. Lis `CLAUDE.md` à la racine — règles projet, design system, contraintes éditoriales, SEMPLICE
2. Lis `.routines/master-prompt.md` (ce fichier) dans son intégralité
3. Vérifie la date : `date -u +%Y-%m-%d`

## Circuit breaker — AVANT TOUT

1. Lis `.routine-failure-count` (s'il existe)
2. Si le fichier contient un nombre > 3 avec timestamp < 24h :
   - N'effectue AUCUNE action
   - Crée une issue : `gh issue create --title "🔴 Circuit breaker Master — 3+ échecs 24h" --label bug,routine --body "Vérification manuelle requise. Voir .routine-failure-count."`
   - Sors immédiatement (pas d'incrément de quota)
3. Sinon, continue

## Garde d'idempotence (schedule fallback)

1. Si tu as été déclenché par le trigger `schedule` (pas le webhook) :
   - Lis `data/daily-briefing.json`
   - Si son champ `generated_at` est < 4h, le Master de ce cycle a déjà tourné
   - Sors sans rien faire

## Pipeline d'exécution

### Étape 1 — Fraîcheur des données
```bash
test $(($(date +%s) - $(stat -c %Y data/news.json))) -lt 7200 || exit 1
```
Si échec : abort, crée issue "⚠️ Master : data/news.json non frais", incrémente `.routine-failure-count`.

### Étape 2 — Sync repo
```bash
git config user.name "Inflexion Routine Master"
git config user.email "routine-master@inflexionhub.com"
git pull --rebase origin main
```

### Étape 3 — Filtrage (bash)
```bash
node scripts/insight-filter.mjs
```
Retry 2x avec backoff 10s si exit != 0.

### Étape 4 — Analyse marché consolidée (bash)
```bash
node scripts/generate-market-analysis.mjs
```
Ce script produit : `data/sentiment.json`, `data/alerts.json`, `data/macro-analysis.json`, `data/market-briefing.json`.

### Étape 5 — Briefing stratégique (langage naturel)

Lis les fichiers suivants :
- `data/sentiment.json`
- `data/alerts.json`
- `data/macro-analysis.json`
- `data/market-briefing.json`
- `data/insights.json`
- `data/signals.json`
- `data/semplice-alerts.json` (s'il existe, produit par SEMPLICE Validator)
- Les 7 derniers fichiers dans `data/briefing-history/` pour détecter les deltas

Produis `data/daily-briefing.json` avec la structure du dernier briefing archivé. Contraintes absolues :
- **Disclaimer AMF** présent : "Les informations ci-dessus ne constituent pas un conseil en investissement."
- **Sourcing** : chaque donnée chiffrée doit porter une attribution explicite (source API ou nom de média)
- **Anti-redondance** : chaque chiffre UNE SEULE FOIS dans le document
- **Ton** : analytique, factuel, sans sensationnalisme (règle utilisateur stricte)
- **Mots-clés courts (≤4 caractères)** : utiliser regex `\b` (word boundary) dans toute recherche textuelle, jamais `includes()`
- **Lundi** : inclure une section "Synthèse hebdomadaire" (analyse consolidée des 7 derniers jours)

### Étape 6 — Article quotidien (langage naturel)

1. Analyse `data/insights.json` : identifie le thème le plus saillant (plus haut score agrégé sur les 24 dernières heures)
2. Détermine si le thème correspond à une zone SEMPLICE (lis `data/semplice-history.json` — 18 zones)
3. Lis `analyse-petrole-trump-iran-ormuz.html` comme template de référence (React createElement, Tailwind CDN, PAS de JSX)
4. Lis `image-catalog.js` et utilise `matchImage()` pour l'image hero
5. Écris `analyse-[thème-kebab-case]-[YYYY-MM-DD].html` au même format
6. Si zone SEMPLICE concernée : inclure une section "Évaluation SEMPLICE" avec scores des 8 dimensions et brève justification

### Étape 7 — Veille + indexation RAG (bash)
```bash
node scripts/veille-continue.mjs
node scripts/rag-index.mjs --briefing --articles
```
Retry 1x chacun si échec.

### Étape 8 — Validation pre-commit (OBLIGATOIRE — bloquant)

1. Identifie le nouveau fichier HTML créé à l'étape 6 :
   ```bash
   NEW_ARTICLE=$(git diff --name-only --diff-filter=A | grep '^analyse-.*\.html$' | head -1)
   ```
2. Valide l'article :
   ```bash
   node scripts/validate-article.mjs "$NEW_ARTICLE"
   ```
3. Valide `data/daily-briefing.json` :
   - JSON valide (`jq empty data/daily-briefing.json`)
   - Pas de placeholder : `grep -E '\bTBD\b|\b\[NAME\]\b|\bundefined\b' data/daily-briefing.json` doit retourner 0 match
   - Disclaimer présent : `grep -i 'conseil en investissement' data/daily-briefing.json` doit retourner ≥1 match
   - Au moins 3 sources citées : `grep -c -iE 'source[[:space:]]*:|selon' data/daily-briefing.json` ≥ 3
4. Si UN SEUL check échoue :
   - `gh issue create --title "🛑 Master : validation pre-commit échouée" --label bug,routine --body "[détails de l'échec]"`
   - Incrémente `.routine-failure-count` avec timestamp
   - N'effectue PAS le commit, sors

### Étape 9 — Commit et push
```bash
git add data/ analyse-*.html
git commit -m "🧠 Pipeline Routine — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
for i in 1 2 3; do
  git pull --rebase origin main && git push origin main && break
  sleep $((i * 5))
done
```
Si après 3 tentatives le push échoue : créer issue "⚠️ Master : git push échoué 3x", incrémenter `.routine-failure-count`.

### Étape 10 — Succès : reset failure count
```bash
rm -f .routine-failure-count
git add .routine-failure-count 2>/dev/null || true
git commit --allow-empty -m "✅ Master success — reset failure counter" 2>/dev/null || true
```

## Règles transverses

- **Jamais** modifier un fichier HTML existant (sauf les nouveaux articles créés)
- **Jamais** écrire `console.log` dans le code généré
- **Jamais** pousser sur une branche autre que `main`
- **Toujours** utiliser `git pull --rebase` avant `git push`
- En cas d'exception Python/Node : capture stderr, inclure dans le body de l'issue GitHub
````

- [ ] **Step 2 : Vérifier la taille et la cohérence**

Run:
```bash
wc -l .routines/master-prompt.md
grep -c "^###" .routines/master-prompt.md
```
Expected: > 120 lignes, 10+ sections `###` (Étape 1 à Étape 10)

- [ ] **Step 3 : Commit**

```bash
git add .routines/master-prompt.md
git commit -m "📝 Master Routine — prompt système (10 étapes, validation pre-commit)"
```

---

## Task 3 : Écrire `inspector-prompt.md`

**Files:**
- Create: `.routines/inspector-prompt.md`

- [ ] **Step 1 : Créer le fichier inspector-prompt.md**

Créer `.routines/inspector-prompt.md` avec le contenu suivant :

````markdown
# Inflexion Production Inspector — System Prompt

Tu es l'inspecteur qualité en production pour https://inflexionhub.com/.

Ton unique rôle : vérifier que le dernier déploiement GitHub Pages a produit un site fonctionnel et conforme au design system Inflexion. Tu ne modifies **jamais** le code. Ton seul effet de bord possible est la création d'issues GitHub.

## Contexte

- Source de vérité design : `index.html` (palette emerald #006650, bronze #C8955A)
- Design system : lire `CLAUDE.md` section 3
- 18 zones SEMPLICE attendues dans `data/semplice-history.json`

## Pipeline de vérification

### Check 1 — Briefing JSON
WebFetch `https://inflexionhub.com/data/daily-briefing.json` :
- Status 200 ?
- Body est JSON valide ?
- Champ `generated_at` existe et correspond à la date du jour (YYYY-MM-DD) ?
- `JSON.stringify(body).length > 500` ?

### Check 2 — Page d'accueil
WebFetch `https://inflexionhub.com/` :
- Status 200 ?
- Contient `#006650` (palette emerald) ?
- Contient la barre bronze (chercher `#C8955A` ou classe CSS associée) ?
- Absence de `undefined` et `[object Object]` dans le HTML ?
- Pas de placeholder `TBD` visible ?

### Check 3 — Dernier article
```bash
LATEST_ARTICLE=$(git log --name-only --pretty=format: -1 | grep '^analyse-.*\.html$' | head -1)
```
WebFetch `https://inflexionhub.com/$LATEST_ARTICLE` :
- Status 200 ?
- HTML bien formé (présence de `<!DOCTYPE html>`, `</html>`) ?
- Contient au moins une section `<h1>` ou `<h2>` ?

### Check 4 — Radar SEMPLICE
WebFetch `https://inflexionhub.com/expertise.html#semplice` :
- Status 200 ?
WebFetch `https://inflexionhub.com/data/semplice-history.json` :
- Status 200 ?
- JSON valide avec ≥ 18 zones ?

### Check 5 — Images Unsplash (échantillon 3)
Extrais 3 URLs d'images au hasard depuis `image-catalog.js`. Pour chacune :
- WebFetch → status 200 ?
- Content-Type commence par `image/` ?

## Décision finale

Compte le nombre d'échecs.

### Si 0 échec
```bash
echo "✅ Inspection passée — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```
Sors. Pas de commit, pas d'issue.

### Si ≥ 1 échec
Rassemble tous les échecs dans un body markdown structuré :

```markdown
## Régressions détectées

### Check X — [nom du check]
- **URL** : [url]
- **Attendu** : [critère]
- **Obtenu** : [valeur réelle]
- **Extrait** : [snippet pertinent]

### Check Y — ...

## Informations système
- Date inspection : [timestamp UTC]
- Dernier commit main : `git log -1 --oneline`
- Dernier article : [nom fichier]
```

Puis :
```bash
gh issue create \
  --title "🚨 Régression prod [date] — $N_FAILURES check(s) échoué(s)" \
  --label bug,prod \
  --body "$BODY"
```

## Règles strictes

- Tu n'effectues JAMAIS de `git commit`, `git push`, ou modification de fichier
- Tu n'ouvres PAS de PR
- Si l'accès à la prod échoue complètement (timeout > 30s sur la page d'accueil), crée UNE SEULE issue "🚨 Prod injoignable" et sors
- Un seul `gh issue create` par run (pas de spam)
````

- [ ] **Step 2 : Vérifier**

Run:
```bash
wc -l .routines/inspector-prompt.md
grep -c "^### Check" .routines/inspector-prompt.md
```
Expected: > 60 lignes, exactement 5 checks

- [ ] **Step 3 : Commit**

```bash
git add .routines/inspector-prompt.md
git commit -m "📝 Inspector Routine — prompt système (5 checks prod)"
```

---

## Task 4 : Écrire `newsletter-prompt.md`

**Files:**
- Create: `.routines/newsletter-prompt.md`

- [ ] **Step 1 : Créer le fichier newsletter-prompt.md**

Créer `.routines/newsletter-prompt.md` avec le contenu suivant :

````markdown
# Inflexion Weekly Newsletter — System Prompt

Tu es le rédacteur de la newsletter hebdomadaire Inflexion. Tu tournes tous les dimanches à 10h UTC.

## Contexte

- Lis `CLAUDE.md` pour les règles éditoriales (ton, sourcing, disclaimer AMF)
- Ton = analytique factuel, pas de sensationnalisme (règle utilisateur)
- Langue = français (règle utilisateur)

## Pipeline

### Étape 1 — Sync repo
```bash
git config user.name "Inflexion Routine Newsletter"
git config user.email "routine-newsletter@inflexionhub.com"
git pull --rebase origin main
```

### Étape 2 — Collecte des 7 derniers jours

Lis les fichiers de la dernière semaine dans `data/briefing-history/` :
```bash
find data/briefing-history -name "briefing-*.json" -mtime -7 | sort
```

Lis aussi `data/semplice-history.json` pour détecter les zones dont le score risque ou opportunité a varié de > 0.3 dans la semaine.

### Étape 3 — Rédaction (langage naturel)

Produis `data/newsletter-[YYYY-MM-DD].json` avec la structure suivante (YYYY-MM-DD = date du dimanche courant) :

```json
{
  "type": "weekly_newsletter",
  "date": "YYYY-MM-DD",
  "generated_at": "ISO-8601 timestamp",
  "edito": "...",
  "key_points": [
    {"title": "...", "summary": "...", "sources": ["..."]}
  ],
  "semplice_focus": {
    "zone": "...",
    "change_summary": "...",
    "scores_delta": {"risk": 0.0, "opportunity": 0.0}
  },
  "to_watch_next_week": ["..."],
  "disclaimer": "Les informations ci-dessus ne constituent pas un conseil en investissement."
}
```

Contraintes :
- `edito` : 150-250 mots, ton analytique, résume les forces structurantes de la semaine
- `key_points` : exactement 5 points, chacun avec ≥ 1 source
- `semplice_focus` : 1 seule zone (celle dont les scores ont le plus évolué)
- `to_watch_next_week` : 3-5 thèmes concrets à surveiller
- `disclaimer` : exactement la chaîne ci-dessus (AMF compliance)

### Étape 4 — Validation inline (bloquant)

Vérifie sur le JSON produit :
- `jq empty data/newsletter-[date].json` → doit passer
- `jq '.edito | length' data/newsletter-[date].json` ≥ 500 (≈150 mots)
- `jq '.key_points | length' data/newsletter-[date].json` == 5
- Chaque point a ≥ 1 source : `jq '.key_points[] | select(.sources | length == 0)' data/newsletter-[date].json` doit retourner vide
- `jq -r '.disclaimer' data/newsletter-[date].json` contient "conseil en investissement"
- Absence de placeholder : `grep -E '\bTBD\b|\bundefined\b' data/newsletter-[date].json` → 0 match

Si UN SEUL check échoue :
- `gh issue create --title "🛑 Newsletter : validation échouée" --label bug,routine --body "[détails]"`
- Ne commit pas, sors

### Étape 5 — Commit et push

```bash
git add data/newsletter-*.json
git commit -m "📰 Newsletter hebdomadaire — $(date -u +%Y-%m-%d)"
for i in 1 2 3; do
  git pull --rebase origin main && git push origin main && break
  sleep $((i * 5))
done
```

## Règles

- 1 seule newsletter par dimanche (garde d'idempotence : si `data/newsletter-$(date +%Y-%m-%d).json` existe déjà, sors)
- Jamais modifier les briefings archivés
- Jamais toucher aux articles HTML
````

- [ ] **Step 2 : Vérifier**

Run:
```bash
wc -l .routines/newsletter-prompt.md
grep -c "^### Étape" .routines/newsletter-prompt.md
```
Expected: > 50 lignes, 5 étapes

- [ ] **Step 3 : Commit**

```bash
git add .routines/newsletter-prompt.md
git commit -m "📝 Newsletter Routine — prompt système (5 étapes + validation inline)"
```

---

## Task 5 : Écrire `semplice-validator-prompt.md`

**Files:**
- Create: `.routines/semplice-validator-prompt.md`

- [ ] **Step 1 : Créer le fichier semplice-validator-prompt.md**

Créer `.routines/semplice-validator-prompt.md` avec le contenu suivant :

````markdown
# Inflexion SEMPLICE Weekly Validator — System Prompt

Tu es le validateur hebdomadaire du cadre SEMPLICE (évaluation géopolitique Inflexion). Tu tournes tous les samedis à 22h UTC, avant le Master du dimanche matin.

## Contexte obligatoire

1. Lis `CLAUDE.md` section SEMPLICE (bloc principal)
2. Lis `data/semplice/grille-scoring-quantitative-v2.md` (107 indicateurs risque, échelle 1-7)
3. Lis `data/semplice/grille-scoring-opportunite-v2.md` (66 indicateurs opportunité, échelle 1-7)
4. Lis `data/semplice-history.json` (18 zones actuelles)
5. Pondération risque : M=16%, E=15%, P=14%, S=12%, I=12%, C=11%, Ee=10%, L=10%
6. Pondération opportunité : Eo=17%, Io=15%, Po=14%, Lo=13%, Co=12%, So=12%, Eeo=10%, Mo=7%

## Pipeline

### Étape 1 — Sync repo
```bash
git config user.name "Inflexion Routine SEMPLICE"
git config user.email "routine-semplice@inflexionhub.com"
git pull --rebase origin main
```

### Étape 2 — Délégation au validateur Node (couches 1 et 2)

```bash
node scripts/semplice-validator.mjs --weekly
```

Ce script exécute les règles R1-R8 (validation risque) et SIG1-SIG8 (détection signaux) sur les 18 zones à partir de `data/insights.json` + les briefings de la semaine. Il ne modifie pas `data/semplice-history.json` — il produit `data/semplice-candidates.json` (propositions d'ajustement).

Si exit != 0, retry 1x. Si toujours en échec :
- `gh issue create --title "🛑 SEMPLICE : semplice-validator.mjs échoué" --label bug,routine --body "[stderr]"`
- Sors

### Étape 3 — Validation sémantique (Layer 3, langage naturel)

Lis `data/semplice-candidates.json`. Pour chaque proposition d'ajustement (zone + dimension + delta) :

1. Lis les 3-5 insights les plus pertinents (source du signal)
2. Vérifie la plausibilité : le delta proposé est-il cohérent avec les données sourcées ?
3. Applique les critères Layer 3 :
   - **Plausibilité narrative** : le changement est-il justifié par des événements documentés ?
   - **Absence de biais de surréaction** : un événement ponctuel ne doit pas faire bouger un score de > 0.5 en une semaine
   - **Cohérence avec l'historique** : le trend correspond-il à la trajectoire récente ?
4. Si validée : marque la proposition comme `approved: true` et ajoute `layer3_rationale: "..."`
5. Si rejetée : `approved: false` et `rejection_reason: "..."`

Écris le résultat dans `data/semplice-candidates-reviewed.json`.

### Étape 4 — Application des ajustements approuvés

Pour chaque proposition `approved: true` :
1. Lis `data/semplice-history.json`
2. Met à jour le score de la zone/dimension concernée
3. Ajoute une entrée historique avec : nouveau score, timestamp, source_insights (IDs), layer3_rationale
4. Si le nouveau score risque > 6.0 OU opportunité > 6.0 pour une zone : ajoute à `data/semplice-alerts.json` (sera ingéré par Master du lendemain)

### Étape 5 — Validation finale (bloquant)

```bash
jq empty data/semplice-history.json
jq '. | length' data/semplice-history.json
```
Si exit != 0 OU le nombre de zones a changé (18 attendues) :
- `gh issue create --title "🛑 SEMPLICE : semplice-history.json invalide après update" --label bug,routine`
- `git checkout data/semplice-history.json` (rollback des changements)
- Sors

### Étape 6 — Commit et push

```bash
git add data/semplice-history.json data/semplice-alerts.json data/semplice-candidates*.json
git commit -m "🌍 SEMPLICE validator hebdo — $(date -u +%Y-%m-%d)"
for i in 1 2 3; do
  git pull --rebase origin main && git push origin main && break
  sleep $((i * 5))
done
```

## Règles

- Ne JAMAIS modifier une zone qui n'est pas listée dans `data/semplice-history.json` (pas de création de nouvelle zone automatique)
- Ne JAMAIS appliquer un delta > 0.8 en une semaine sans justification explicite Layer 3
- Si `data/semplice-candidates.json` est vide : commit empty avec message "🌍 SEMPLICE : aucun ajustement requis cette semaine" et sortir proprement
````

- [ ] **Step 2 : Vérifier**

Run:
```bash
wc -l .routines/semplice-validator-prompt.md
grep -c "^### Étape" .routines/semplice-validator-prompt.md
```
Expected: > 70 lignes, 6 étapes

- [ ] **Step 3 : Commit**

```bash
git add .routines/semplice-validator-prompt.md
git commit -m "📝 SEMPLICE Validator Routine — prompt système (6 étapes, layer 3)"
```

---

## Task 6 : Créer `scripts/test-routine-output.mjs` (TDD)

**Files:**
- Create: `scripts/test-routine-output.mjs`
- Test: `scripts/tests/test-routine-output.test.mjs`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `scripts/tests/test-routine-output.test.mjs` :

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateBriefing } from '../test-routine-output.mjs';

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'routine-test-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('validateBriefing accepte un briefing conforme', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    const good = {
      generated_at: new Date().toISOString(),
      summary: 'Un briefing factuel qui décrit la situation des marchés. '.repeat(20),
      sources: [
        { name: 'Reuters', url: 'https://reuters.com/x' },
        { name: 'FT', url: 'https://ft.com/x' },
        { name: 'Bloomberg', url: 'https://bloomberg.com/x' },
      ],
      disclaimer: 'Les informations ci-dessus ne constituent pas un conseil en investissement.',
    };
    writeFileSync(path, JSON.stringify(good));
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, true);
    assert.deepStrictEqual(result.errors, []);
  });
});

test('validateBriefing rejette un JSON malformé', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    writeFileSync(path, '{"invalid": ');
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('JSON invalide')));
  });
});

test('validateBriefing rejette un contenu < 500 chars', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    writeFileSync(path, JSON.stringify({ summary: 'court', sources: [], disclaimer: '' }));
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('contenu trop court')));
  });
});

test('validateBriefing rejette un disclaimer AMF manquant', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    const bad = {
      summary: 'Contenu valide et suffisamment long. '.repeat(20),
      sources: [{ name: 'X', url: 'y' }, { name: 'Y', url: 'z' }, { name: 'Z', url: 'w' }],
      disclaimer: 'Autre texte sans mention conseil',
    };
    writeFileSync(path, JSON.stringify(bad));
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('disclaimer AMF')));
  });
});

test('validateBriefing rejette < 3 sources', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    const bad = {
      summary: 'Contenu valide et suffisamment long. '.repeat(20),
      sources: [{ name: 'X', url: 'y' }],
      disclaimer: 'Les informations ci-dessus ne constituent pas un conseil en investissement.',
    };
    writeFileSync(path, JSON.stringify(bad));
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('sources')));
  });
});

test('validateBriefing rejette la présence de placeholders TBD/undefined', () => {
  withTempDir((dir) => {
    const path = join(dir, 'briefing.json');
    const bad = {
      summary: 'Contenu avec TBD au milieu. '.repeat(20),
      sources: [{ name: 'X', url: 'y' }, { name: 'Y', url: 'z' }, { name: 'Z', url: 'w' }],
      disclaimer: 'Les informations ci-dessus ne constituent pas un conseil en investissement.',
    };
    writeFileSync(path, JSON.stringify(bad));
    const result = validateBriefing(path);
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('placeholder')));
  });
});
```

- [ ] **Step 2 : Lancer le test pour confirmer qu'il échoue**

Run:
```bash
node --test scripts/tests/test-routine-output.test.mjs
```
Expected: ÉCHEC avec message `Cannot find module '../test-routine-output.mjs'` ou équivalent.

- [ ] **Step 3 : Écrire l'implémentation minimale**

Créer `scripts/test-routine-output.mjs` :

```javascript
#!/usr/bin/env node
// Valide qu'un briefing JSON produit par la Routine Master respecte
// les contraintes éditoriales : sourcing, disclaimer AMF, pas de placeholder.

import { readFileSync, existsSync } from 'node:fs';

const PLACEHOLDER_RE = /\bTBD\b|\b\[NAME\]\b|\bundefined\b/;
const AMF_DISCLAIMER_RE = /conseil\s+en\s+investissement/i;
const MIN_CONTENT_CHARS = 500;
const MIN_SOURCES = 3;

export function validateBriefing(filePath) {
  const errors = [];

  if (!existsSync(filePath)) {
    return { ok: false, errors: [`Fichier introuvable : ${filePath}`] };
  }

  const raw = readFileSync(filePath, 'utf8');

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return { ok: false, errors: [`JSON invalide : ${e.message}`] };
  }

  // Longueur contenu (taille totale du JSON stringifié)
  if (raw.length < MIN_CONTENT_CHARS) {
    errors.push(`contenu trop court (${raw.length} < ${MIN_CONTENT_CHARS} chars)`);
  }

  // Sources
  const sources = Array.isArray(data.sources) ? data.sources : [];
  if (sources.length < MIN_SOURCES) {
    errors.push(`sources insuffisantes (${sources.length} < ${MIN_SOURCES})`);
  }

  // Disclaimer AMF
  const disclaimer = typeof data.disclaimer === 'string' ? data.disclaimer : '';
  if (!AMF_DISCLAIMER_RE.test(disclaimer)) {
    errors.push(`disclaimer AMF manquant ou non conforme`);
  }

  // Placeholders
  if (PLACEHOLDER_RE.test(raw)) {
    errors.push(`placeholder détecté (TBD/[NAME]/undefined)`);
  }

  return { ok: errors.length === 0, errors };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2] || 'data/daily-briefing.json';
  const result = validateBriefing(target);
  if (result.ok) {
    console.log(`✅ ${target} — validation OK`);
    process.exit(0);
  } else {
    console.error(`❌ ${target} — échecs :`);
    for (const err of result.errors) console.error(`  - ${err}`);
    process.exit(1);
  }
}
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

Run:
```bash
node --test scripts/tests/test-routine-output.test.mjs
```
Expected: 6 tests, 6 passent.

- [ ] **Step 5 : Tester la CLI sur le briefing actuel**

Run:
```bash
node scripts/test-routine-output.mjs data/daily-briefing.json
```
Expected: soit `✅ ... validation OK`, soit `❌ ... échecs : ...` — dans les deux cas, exit code cohérent.

- [ ] **Step 6 : Commit**

```bash
git add scripts/test-routine-output.mjs scripts/tests/test-routine-output.test.mjs
git commit -m "✅ test-routine-output.mjs — validation briefing Routine (6 tests)"
```

---

## Task 7 : Intégrer `test-routine-output` dans `ci.yml`

**Files:**
- Modify: `.github/workflows/ci.yml:112-123`

- [ ] **Step 1 : Éditer ci.yml pour ajouter le test**

Ouvre `.github/workflows/ci.yml`, trouve la section `Run scripts unit tests` (autour de la ligne 110) et ajoute une ligne `node --test scripts/tests/test-routine-output.test.mjs \\` à la suite des autres tests.

Exact edit:

old_string:
```
      - name: Run scripts unit tests
        run: |
          node --test scripts/tests/lib/claude-api.test.mjs
          node --test scripts/tests/data-loader.test.mjs
          node --test scripts/tests/api-client.test.mjs
          node --test scripts/tests/fetch-data.test.mjs
          node --test scripts/tests/app.test.mjs
          node --test scripts/tests/supabase-client.test.mjs
          node --test scripts/tests/generate-daily-briefing.test.mjs
          node --test scripts/tests/lib/rag-store.test.mjs
          node --test scripts/tests/lib/claim-verifier.test.mjs
          node --test scripts/tests/sanitizer.test.mjs
          node --test scripts/tests/lib/embeddings-cache.test.mjs
          node --test scripts/tests/lib/contradiction-detector.test.mjs
```

new_string:
```
      - name: Run scripts unit tests
        run: |
          node --test scripts/tests/lib/claude-api.test.mjs
          node --test scripts/tests/data-loader.test.mjs
          node --test scripts/tests/api-client.test.mjs
          node --test scripts/tests/fetch-data.test.mjs
          node --test scripts/tests/app.test.mjs
          node --test scripts/tests/supabase-client.test.mjs
          node --test scripts/tests/generate-daily-briefing.test.mjs
          node --test scripts/tests/lib/rag-store.test.mjs
          node --test scripts/tests/lib/claim-verifier.test.mjs
          node --test scripts/tests/sanitizer.test.mjs
          node --test scripts/tests/lib/embeddings-cache.test.mjs
          node --test scripts/tests/lib/contradiction-detector.test.mjs
          node --test scripts/tests/test-routine-output.test.mjs
```

- [ ] **Step 2 : Vérifier localement**

Run:
```bash
grep -c "test-routine-output.test.mjs" .github/workflows/ci.yml
```
Expected: 1

- [ ] **Step 3 : Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "🔧 ci.yml — ajout test-routine-output dans test-scripts"
```

---

## Task 8 : Ajouter trigger webhook dans `fetch-data.yml`

**Files:**
- Modify: `.github/workflows/fetch-data.yml:110-112`

- [ ] **Step 1 : Éditer fetch-data.yml**

Ouvre `.github/workflows/fetch-data.yml`. Trouve le bloc de l'étape `"📝 Commit et push des données"` (autour ligne 92-111). Juste après `git push` (ligne 111), ajoute une nouvelle étape :

old_string:
```
          git push

      - name: "🚨 Alerte d'échec"
```

new_string:
```
          git push

      - name: "🚀 Trigger Master Routine"
        if: success()
        env:
          ROUTINE_WEBHOOK_TOKEN: ${{ secrets.ROUTINE_WEBHOOK_TOKEN }}
          ROUTINE_MASTER_URL: ${{ secrets.ROUTINE_MASTER_URL }}
        run: |
          if [ -z "$ROUTINE_WEBHOOK_TOKEN" ] || [ -z "$ROUTINE_MASTER_URL" ]; then
            echo "⚠️ ROUTINE_WEBHOOK_TOKEN ou ROUTINE_MASTER_URL non défini — skip trigger (fallback schedule gère)"
            exit 0
          fi
          curl -X POST "$ROUTINE_MASTER_URL" \
            -H "Authorization: Bearer $ROUTINE_WEBHOOK_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"trigger_source\":\"fetch-data-success\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
            --fail --retry 3 --retry-delay 10 \
            || echo "⚠️ Routine trigger failed, fallback schedule will handle"

      - name: "🚨 Alerte d'échec"
```

- [ ] **Step 2 : Vérifier**

Run:
```bash
grep -c "Trigger Master Routine" .github/workflows/fetch-data.yml
grep -c "ROUTINE_WEBHOOK_TOKEN" .github/workflows/fetch-data.yml
```
Expected: 1 et 2 (1 dans le titre, 2 dans env + check)

- [ ] **Step 3 : Validation YAML**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/fetch-data.yml'))" && echo "YAML valide"
```
Expected: `YAML valide`

- [ ] **Step 4 : Commit**

```bash
git add .github/workflows/fetch-data.yml
git commit -m "🚀 fetch-data.yml — trigger webhook Routine Master (fallback safe)"
```

---

## Task 9 : Documenter Routines dans `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md` (ajout section à la fin)

- [ ] **Step 1 : Lire CLAUDE.md pour identifier la position d'insertion**

Run:
```bash
tail -20 CLAUDE.md
```
Noter la dernière section (devrait être section 9 — "Règles importantes").

- [ ] **Step 2 : Ajouter la section 10 "Claude Code Routines"**

Appending à la fin de `CLAUDE.md` :

```markdown

## 10. Claude Code Routines (migration IA)

Le pipeline IA est orchestré par 4 Routines Claude Code (infra Anthropic, Max 5x, quota 15/jour) :

| Routine | Trigger | Rôle |
|---------|---------|------|
| Master | webhook fetch-data + schedule `30 6,18 * * *` | Briefing quotidien + article + alertes + signaux + RAG |
| Inspector | schedule `0 7,19 * * *` | Vérif prod post-deploy, crée issues si régression |
| Newsletter | schedule `0 10 * * 0` | Newsletter hebdo (dimanche 10h UTC) |
| SEMPLICE Validator | schedule `0 22 * * 6` | Mise à jour scores SEMPLICE (samedi 22h UTC) |

- **Prompts système** : `.routines/*.md` (versionnés dans le repo)
- **Scripts `.mjs` conservés** : fallback si Routines désactivées (rollback 30s)
- **Design spec** : `docs/superpowers/specs/2026-04-23-routines-migration-design.md`
- **Plan d'implémentation** : `docs/superpowers/plans/2026-04-23-routines-migration.md`
- **Rollback** : décommenter `on: schedule:` dans `generate-article.yml`, `generate-unified-briefing.yml`, `generate-newsletter.yml`, puis désactiver les Routines sur claude.ai/code
```

- [ ] **Step 3 : Vérifier la taille du CLAUDE.md**

Run:
```bash
wc -w CLAUDE.md
```
Expected: < 3000 mots (contrainte ≤ 2000 tokens ≈ 1500 mots stricts, 3000 acceptable en souple). Si > 3000, condenser la nouvelle section.

- [ ] **Step 4 : Commit**

```bash
git add CLAUDE.md
git commit -m "📚 CLAUDE.md — section 10 Claude Code Routines (doc migration)"
```

---

# PHASE 2 — Setup opérationnel & dry-run (semaine 2)

## Task 10 : Préparation Anthropic & tag de sauvegarde

**Files:** aucun changement code — tâches opérationnelles.

- [ ] **Step 1 : Vérifier subscription Max 5x**

Aller sur https://claude.ai/settings/billing. Confirmer :
- Plan actif = Max 5x
- Renouvellement OK
- Quota Routines/jour = 15

Si pas en Max 5x : upgrader avant de continuer.

- [ ] **Step 2 : Créer tag git de sauvegarde**

Run:
```bash
git tag -a pre-routine-migration-v0 -m "Sauvegarde avant migration Routines — état pipeline GHA 100%"
git push origin pre-routine-migration-v0
```

- [ ] **Step 3 : Vérifier le tag**

Run:
```bash
git describe --tags pre-routine-migration-v0
```
Expected: `pre-routine-migration-v0`

- [ ] **Step 4 : Push des tâches Phase 1 sur main**

Run:
```bash
git push origin main
```

Critère de passage à Task 11 : tous les commits de la Phase 1 sont sur `main`, tag `pre-routine-migration-v0` pushé.

---

## Task 11 : Créer la Routine Master en mode dry-run

**Files:** aucun — configuration sur claude.ai/code.

- [ ] **Step 1 : Créer la Routine sur claude.ai/code**

1. Aller sur https://claude.ai/code
2. Ouvrir le panneau `/schedule` (ou équivalent UI)
3. Cliquer "Nouvelle Routine"
4. Paramètres :
   - **Nom** : `Inflexion Master Pipeline [DRY-RUN]`
   - **Repository** : connecter `floryanleblanc/Inflexion`
   - **Triggers** : cocher **API** ET **Scheduled**
     - Cron : `30 6,18 * * *` (UTC)
   - **Outils** : activer `Bash`, `Read`, `Write`, `Edit`, `Grep`, `Glob`, `WebFetch`
5. **System prompt** : copier tout le contenu de `.routines/master-prompt.md` PUIS ajouter en fin de prompt :

```
## MODE DRY-RUN ACTIF (PHASE B)

Override temporaire pour toutes les étapes suivantes :
- Étape 9 : NE PAS FAIRE `git push`. À la place :
  `git checkout -b routine-dryrun-$(date +%Y-%m-%d-%H%M) && git push -u origin "$(git branch --show-current)"`
- Étape 10 : skip (pas de reset failure count)
- Ne crée PAS d'issue sur les checks Inspector (ce rôle ne s'applique pas à cette Routine)
```

6. Sauvegarder

- [ ] **Step 2 : Récupérer endpoint + token**

Dans l'UI de la Routine créée :
- Copier l'**API endpoint URL** (ex. `https://api.claude.com/routines/xxx-yyy/trigger`)
- Générer et copier le **webhook token**

- [ ] **Step 3 : Ajouter les secrets GHA**

1. Aller sur https://github.com/floryanleblanc/Inflexion/settings/secrets/actions
2. Créer :
   - `ROUTINE_WEBHOOK_TOKEN` = le token
   - `ROUTINE_MASTER_URL` = l'endpoint URL

- [ ] **Step 4 : Vérifier via déclenchement manuel**

Run localement (avec les valeurs réelles) :
```bash
ROUTINE_WEBHOOK_TOKEN="<token>"
ROUTINE_MASTER_URL="<url>"
curl -X POST "$ROUTINE_MASTER_URL" \
  -H "Authorization: Bearer $ROUTINE_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"trigger_source":"manual-test","timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' \
  --fail
```
Expected: status 2xx, body contenant un ID de run ou équivalent.

Si erreur : vérifier config Routine, token, format JSON. Ne pas continuer tant que le curl ne passe pas.

**Critère de passage à Task 12 : curl manuel OK, secrets GHA configurés, Routine créée en dry-run.**

---

## Task 12 : Exécuter 3 runs dry-run consécutifs

**Files:** aucun — observation.

- [ ] **Step 1 : Attendre le premier run scheduled**

Le prochain déclenchement scheduled est à 06:30 UTC ou 18:30 UTC prochain. Attendre ce moment.

- [ ] **Step 2 : Observer le run 1**

1. Aller sur claude.ai/code → Routines → voir les logs du run en cours
2. Vérifier :
   - Le run a démarré à 06:30 ou 18:30 UTC (±5 min)
   - La Routine a lu `CLAUDE.md` et `.routines/master-prompt.md`
   - Les étapes 1-9 sont visibles dans le log
   - Une branche `routine-dryrun-YYYY-MM-DD-HHMM` a été créée et pushée
3. `git fetch && git log origin/routine-dryrun-* --oneline -5` pour voir les commits produits

- [ ] **Step 3 : Comparer run 1 vs main**

Run:
```bash
DRYRUN_BRANCH=$(git branch -r | grep 'origin/routine-dryrun' | sort -r | head -1 | tr -d ' ')
git diff main..$DRYRUN_BRANCH -- data/daily-briefing.json | head -50
git diff main..$DRYRUN_BRANCH -- 'analyse-*.html' | head -50
```

Vérifier manuellement :
- [ ] `data/daily-briefing.json` : contenu factuel, disclaimer AMF, sources citées, pas de placeholder
- [ ] `analyse-*.html` : design conforme (palette emerald, bronze), ton analytique, SEMPLICE si zone concernée
- [ ] Pas de régression visuelle vs dernier briefing `main`

- [ ] **Step 4 : Valider runs 2 et 3**

Répéter steps 1-3 pour les 2 runs suivants (2 runs/jour). Durée : 2 jours calendaires.

- [ ] **Step 5 : Décision GO/NO-GO**

Critères GO :
- 3 runs consécutifs sans crash de la Routine
- 0 régression significative détectée manuellement
- Pas de placeholder `TBD`/`undefined` dans les outputs
- Disclaimer AMF présent dans chaque briefing

Si NO-GO : identifier l'étape qui a dérivé, ajuster `.routines/master-prompt.md`, recommit, repush, refaire 3 runs.

Si GO : passer à Task 13.

---

## Task 13 : Nettoyer les branches dry-run

**Files:** repo distant.

- [ ] **Step 1 : Lister les branches dry-run**

Run:
```bash
git fetch origin --prune
git branch -r | grep 'origin/routine-dryrun'
```

- [ ] **Step 2 : Supprimer les branches dry-run distantes**

Pour chaque branche listée :
```bash
git push origin --delete routine-dryrun-YYYY-MM-DD-HHMM
```

- [ ] **Step 3 : Vérifier**

Run:
```bash
git branch -r | grep 'origin/routine-dryrun' | wc -l
```
Expected: `0`

---

# PHASE 3 — Bascule progressive (semaine 3)

## Task 14 : Activer Master en prod + désactiver workflows IA GHA

**Files:**
- Modify: `.github/workflows/generate-article.yml` (commenter cron)
- Modify: `.github/workflows/generate-unified-briefing.yml` (commenter cron)
- Config Routine Master : retirer le mode dry-run

- [ ] **Step 1 : Retirer le mode dry-run de la Routine Master**

Sur claude.ai/code → Routine Master → éditer le prompt système :
1. Supprimer le bloc `## MODE DRY-RUN ACTIF (PHASE B)` ajouté à la Task 11
2. Renommer la Routine : `Inflexion Master Pipeline` (retirer `[DRY-RUN]`)
3. Sauvegarder

- [ ] **Step 2 : Tag de sécurité avant bascule**

Run:
```bash
git tag -a pre-routine-production-v1 -m "Avant bascule Master en prod — filet de sécurité GHA encore actif"
git push origin pre-routine-production-v1
```

- [ ] **Step 3 : Commenter le cron de generate-article.yml**

Lire d'abord le fichier pour identifier la ligne exacte :

Run:
```bash
grep -n "cron:" .github/workflows/generate-article.yml
```

Pour chaque ligne `cron: ...`, remplacer :

old_string (exemple générique — adapter à la ligne réelle) :
```
  schedule:
    - cron: '0 6,18 * * *'
```

new_string :
```
  # DÉSACTIVÉ — migration vers Routine Master (2026-04-23)
  # Pour rollback : décommenter le schedule ci-dessous
  # schedule:
  #   - cron: '0 6,18 * * *'
```

- [ ] **Step 4 : Idem pour generate-unified-briefing.yml**

Run:
```bash
grep -n "cron:" .github/workflows/generate-unified-briefing.yml
```

Appliquer la même transformation : commenter le bloc `schedule:` en ajoutant un commentaire de référence.

- [ ] **Step 5 : Valider que le workflow reste déclenchable manuellement**

Vérifier que `workflow_dispatch:` est toujours présent dans les deux YAMLs (pour rollback manuel) :

Run:
```bash
grep "workflow_dispatch" .github/workflows/generate-article.yml
grep "workflow_dispatch" .github/workflows/generate-unified-briefing.yml
```
Expected: chaque grep doit retourner au moins 1 ligne.

- [ ] **Step 6 : Commit et push**

```bash
git add .github/workflows/generate-article.yml .github/workflows/generate-unified-briefing.yml
git commit -m "🔕 Désactiver cron generate-article + generate-unified-briefing (bascule Routine)"
git push origin main
```

- [ ] **Step 7 : Déclencher fetch-data manuellement pour valider la chaîne**

1. Aller sur https://github.com/floryanleblanc/Inflexion/actions/workflows/fetch-data.yml
2. Cliquer "Run workflow" → branche main → "Run workflow"
3. Observer :
   - fetch-data s'exécute normalement
   - L'étape "🚀 Trigger Master Routine" affiche un statut 2xx
   - Sur claude.ai/code, le Master Routine démarre
   - Après ~10 min, un commit `🧠 Pipeline Routine — ...` apparaît sur main
   - deploy-pages se déclenche automatiquement

**Si la chaîne fonctionne bout en bout : passer à Task 15. Sinon : identifier le point d'échec, corriger, retester.**

---

## Task 15 : Surveillance intensive 5-7 jours

**Files:** aucun — observation.

- [ ] **Step 1 : Check quotidien du site prod**

Chaque jour pendant 5-7 jours, vérifier manuellement sur https://inflexionhub.com/ :
- [ ] Page d'accueil charge normalement
- [ ] Date du briefing du jour visible
- [ ] Nouvel article quotidien présent et bien formé
- [ ] Radar SEMPLICE fonctionnel
- [ ] Pas d'élément `undefined` ou placeholder visible

Noter dans un journal privé les anomalies.

- [ ] **Step 2 : Check quotidien des logs Routine**

Sur claude.ai/code → Routine Master → historique :
- [ ] Chaque run a un statut "Success"
- [ ] Temps d'exécution < 15 min
- [ ] Pas d'erreur dans les étapes de validation pre-commit

- [ ] **Step 3 : Check GitHub issues**

Run:
```bash
gh issue list --label routine --state open
gh issue list --label prod --state open
```
Expected: 0 issue (ou toute issue a été triée et résolue).

- [ ] **Step 4 : Décision GO/NO-GO Phase D**

Critères GO après 5 jours :
- 10 runs Master consécutifs OK (2/jour)
- 0 issue `label:prod` non résolue
- 0 régression visuelle détectée
- Latence fetch-data → deploy < 30 min

Si GO : passer à Task 16. Sinon : identifier la cause, patcher le prompt Master ou les scripts, recommencer l'observation.

---

# PHASE 4 — Bascule totale (semaine 4)

## Task 16 : Créer Inspector Routine

**Files:** aucun code — configuration claude.ai/code.

- [ ] **Step 1 : Créer la Routine Inspector**

Sur claude.ai/code → `/schedule` → "Nouvelle Routine" :
- **Nom** : `Inflexion Production Inspector`
- **Repository** : `floryanleblanc/Inflexion`
- **Triggers** : **Scheduled** uniquement, cron `0 7,19 * * *` (UTC)
- **Outils** : `WebFetch`, `Read`, `Bash`
- **System prompt** : copier tout le contenu de `.routines/inspector-prompt.md`
- Sauvegarder

- [ ] **Step 2 : Observer le premier run**

Attendre le prochain 07:00 ou 19:00 UTC. Sur claude.ai/code, vérifier :
- Le run démarre à l'heure prévue
- Les 5 checks sont exécutés
- Statut final : `✅ Inspection passée` OU `gh issue create` sur au moins 1 régression

- [ ] **Step 3 : Vérifier la création d'issue en cas de régression (simulation optionnelle)**

Pour tester la création d'issue : introduire temporairement une régression (ex. remplacer `#006650` par `#FF00FF` dans `index.html`, commit, push, attendre que deploy-pages propage, puis attendre le prochain run Inspector).

Si Inspector crée bien une issue `🚨 Régression prod ...` : OK, revert la régression.

---

## Task 17 : Créer Newsletter Routine

**Files:**
- Modify: `.github/workflows/generate-newsletter.yml` (commenter cron)

- [ ] **Step 1 : Créer la Routine Newsletter**

Sur claude.ai/code → "Nouvelle Routine" :
- **Nom** : `Inflexion Weekly Newsletter`
- **Repository** : `floryanleblanc/Inflexion`
- **Triggers** : **Scheduled**, cron `0 10 * * 0`
- **Outils** : `Read`, `Write`, `Bash`
- **System prompt** : contenu de `.routines/newsletter-prompt.md`
- Sauvegarder

- [ ] **Step 2 : Commenter le cron de generate-newsletter.yml**

Run:
```bash
grep -n "cron:" .github/workflows/generate-newsletter.yml
```

Pour chaque ligne `cron: ...`, appliquer la même transformation qu'en Task 14.3 :

Remplacer :
```
  schedule:
    - cron: '0 10 * * 0'
```
Par :
```
  # DÉSACTIVÉ — migration vers Routine Newsletter (2026-04-23)
  # Pour rollback : décommenter le schedule ci-dessous
  # schedule:
  #   - cron: '0 10 * * 0'
```

- [ ] **Step 3 : Commit**

```bash
git add .github/workflows/generate-newsletter.yml
git commit -m "🔕 Désactiver cron generate-newsletter (bascule Routine)"
git push origin main
```

- [ ] **Step 4 : Observer la première newsletter**

Attendre le dimanche 10:00 UTC suivant. Vérifier :
- Routine démarre
- `data/newsletter-[date].json` créé et poussé sur main
- Contenu validé manuellement : édito analytique, 5 key points sourcés, focus SEMPLICE pertinent, disclaimer présent

---

## Task 18 : Créer SEMPLICE Validator Routine

**Files:** aucun — configuration.

- [ ] **Step 1 : Créer la Routine**

Sur claude.ai/code :
- **Nom** : `Inflexion SEMPLICE Weekly Validator`
- **Repository** : `floryanleblanc/Inflexion`
- **Triggers** : **Scheduled**, cron `0 22 * * 6`
- **Outils** : `Read`, `Write`, `Bash`
- **System prompt** : contenu de `.routines/semplice-validator-prompt.md`
- Sauvegarder

- [ ] **Step 2 : Observer le premier run**

Attendre le samedi 22:00 UTC suivant. Vérifier :
- Routine démarre
- `scripts/semplice-validator.mjs` s'exécute
- `data/semplice-candidates-reviewed.json` est créé (ou pas, si aucun ajustement)
- Si ajustements : `data/semplice-history.json` mis à jour avec timestamps cohérents
- Commit poussé avec message `🌍 SEMPLICE validator hebdo — ...`

---

## Task 19 : Validation finale et tag de stabilité

**Files:** aucun — métriques et documentation.

- [ ] **Step 1 : Vérifier les métriques Anthropic dashboard**

Aller sur https://claude.ai (dashboard usage) :
- [ ] Consommation quota moyenne < 8/15 par jour
- [ ] Aucune erreur 429 sur les 7 derniers jours

- [ ] **Step 2 : Vérifier le coût API Anthropic résiduel**

Aller sur https://console.anthropic.com/billing :
- [ ] Coût API tokens des 7 derniers jours < $2 (scripts legacy si réactivés ponctuellement)

- [ ] **Step 3 : Vérifier taux de succès des Routines**

Sur claude.ai/code, pour chacune des 4 Routines, filtrer les runs des 7 derniers jours :
- [ ] Master : ≥ 13/14 runs réussis (> 95%)
- [ ] Inspector : ≥ 13/14 runs réussis
- [ ] Newsletter : 1/1 run réussi (si applicable)
- [ ] SEMPLICE : 1/1 run réussi (si applicable)

- [ ] **Step 4 : Vérifier absence d'issues prod ouvertes**

Run:
```bash
gh issue list --label prod --state open
gh issue list --label routine --state open
```
Expected: 0 issue (ou toutes triées/résolues).

- [ ] **Step 5 : Créer tag de stabilité**

Run:
```bash
git tag -a routines-v1-stable -m "Migration pipeline IA vers Routines complète et stable (7 jours sans incident)"
git push origin routines-v1-stable
```

- [ ] **Step 6 : Mettre à jour README.md (racine) avec procédure rollback**

Éditer `README.md` pour ajouter une section brève :

```markdown
## Pipeline IA — Claude Code Routines

Le pipeline IA est orchestré par 4 Claude Code Routines. Voir `.routines/README.md` pour le détail.

### Rollback rapide

En cas de panne Routines prolongée :

1. Éditer `.github/workflows/generate-article.yml`, `.github/workflows/generate-unified-briefing.yml`, `.github/workflows/generate-newsletter.yml`
2. Décommenter les blocs `schedule:` marqués `# DÉSACTIVÉ — migration vers Routine...`
3. Push → les workflows GHA legacy reprennent
4. Désactiver les 4 Routines sur claude.ai/code
```

- [ ] **Step 7 : Commit final**

```bash
git add README.md
git commit -m "📚 README — documentation Routines + procédure rollback"
git push origin main
```

---

# Annexe — Critères de succès finaux du plan

Après Task 19 :
- [ ] 4 Routines actives sur claude.ai/code
- [ ] 4 workflows GHA IA désactivés (cron commenté, réactivables)
- [ ] `ANTHROPIC_API_KEY` inutilisé en prod (mais conservé comme secret GHA pour rollback)
- [ ] Tests CI passent : `npm test` + `node --test scripts/tests/test-routine-output.test.mjs`
- [ ] 0 issue `label:prod` ou `label:routine` ouverte
- [ ] Tag `routines-v1-stable` créé
- [ ] Coût API Anthropic mensuel < $5 (vs ~$15-21 avant)

# Annexe — Résumé des gardes-fous

| Garde-fou | Mécanisme |
|-----------|-----------|
| Circuit breaker | `.routine-failure-count` lu en début de Master, abort si > 3 échecs en 24h |
| Idempotence | Master schedule fallback abort si briefing < 4h |
| Validation pre-commit | Étape 8 de Master bloque le push si invalide |
| Retry git push | 3x avec `pull --rebase` entre chaque |
| Observabilité | Inspector crée issues auto, 2x/jour |
| Rollback rapide | `on: schedule:` commentés mais pas supprimés |
| Filet de sécurité | Scripts `.mjs` inchangés, 188 tests passent toujours |
| Alertes quota | Dashboard Anthropic surveillé manuellement lors de Task 19 |
