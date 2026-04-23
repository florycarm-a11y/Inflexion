# Design — Migration du pipeline Inflexion vers Claude Code Routines

**Date :** 2026-04-23
**Auteur :** Claude (brainstorming session avec Floryan Leblanc)
**Statut :** Validé par l'utilisateur, prêt pour planification d'implémentation
**Objectif principal :** Réduire les coûts variables de l'API Anthropic en migrant les workflows IA vers les Routines Claude Code

---

## 1. Contexte et motivation

### État actuel
Inflexion opère un pipeline d'intelligence automatisé composé de :
- **8 workflows GitHub Actions**
- **13 scripts Node.js / Python** consommant l'API Anthropic
- Cron `2x/jour (06h + 18h UTC)` déclenchant la chaîne `fetch → filter → briefing → article → deploy`
- Coût API Anthropic actuel : ~$15-21/mois (tokens variables)
- Subscription Claude Code Max 5x déjà active : $100/mois (quota 15 Routines/jour)

### Motivation
L'utilisateur a choisi l'objectif **B (réduction des coûts)** : basculer du modèle token-par-token à la subscription fixe Max 5x déjà payée. Le coût marginal des Routines étant de $0, on économise les ~$15-21/mois d'API tokens. Bénéfice secondaire : simplification architecturale (suppression de `ANTHROPIC_API_KEY` des scripts IA et consolidation des 13 prompts en prompts Routines maintenables).

### Contraintes utilisateur validées
- **Subscription** : Max 5x ($100/mois, quota 15 Routines/jour)
- **Consolidation** : agressive — 1 Master Routine orchestrant toute la pipeline IA
- **Scripts existants** : conservés comme utilitaires bash ET filet de sécurité
- **Workflows GHA IA** : désactivés (schedule commenté) mais pas supprimés — réactivation rapide possible
- **GHA conservés** : `fetch-data`, `polymarket-scan`, `ci`, `deploy-pages` (rien de non-IA ne migre)
- **Stratégie de commit** : commit direct sur `main` avec validation pre-commit dans la Routine
- **Observabilité** : via Inspector Routine qui vérifie la production et crée des issues GitHub

---

## 2. Architecture cible

### Diagramme global

```
┌─────────────────────────────────────────────────────────────────┐
│                     GITHUB ACTIONS (conservé)                    │
│                                                                  │
│  fetch-data.yml (cron 06h/18h UTC)                               │
│    ↓ (succès)                                                    │
│    ├─→ commit data/*.json (news, macro, crypto, etf, commodities)│
│    └─→ POST https://api.claude.com/routines/{master_id}/trigger  │
│         (avec token auth stocké en GHA secret)                   │
│                                                                  │
│  polymarket-scan.yml (après unified briefing)                    │
│  ci.yml + deploy-pages.yml (inchangés)                           │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ↓ trigger HTTP
┌─────────────────────────────────────────────────────────────────┐
│               CLAUDE CODE ROUTINES (Anthropic infra)             │
│                                                                  │
│  Routine 1 — Master (2x/jour, API + schedule fallback)          │
│  Routine 2 — Inspector (2x/jour, schedule Master +30min)        │
│  Routine 3 — Newsletter (1x/semaine, dimanche 10h UTC)          │
│  Routine 4 — SEMPLICE Validator (1x/semaine, samedi 22h UTC)    │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ↓ git push
┌─────────────────────────────────────────────────────────────────┐
│  deploy-pages.yml (GHA, inchangé) → https://inflexionhub.com/   │
└─────────────────────────────────────────────────────────────────┘
```

### Consommation quota (pire jour = dimanche)
- Master × 2 + Inspector × 2 + Newsletter × 1 = **5 routines sur 15 disponibles**
- Jours normaux : 4/15
- Jour avec SEMPLICE (samedi) : 5/15
- **Marge confortable pour ajouts futurs**

---

## 3. Les 4 Routines en détail

### 3.1 Routine Master

**Responsabilité :** Orchestrer toute la génération IA quotidienne (briefing stratégique, article, alertes, signaux, indexation RAG).

**Triggers :**
- **Primaire** : webhook API déclenché par `fetch-data.yml` GHA en fin de job (POST avec auth token)
- **Fallback** : schedule `30 6,18 * * *` UTC (30 min après cron GHA), avec garde d'idempotence (abort si `data/daily-briefing.json` mis à jour il y a moins de 4h)

**Outils activés :** `Bash`, `Read`, `Write`, `Edit`, `Grep`, `Glob`, `WebFetch`

**Flux d'exécution :**
1. **Vérification fraîcheur data** : bash check `data/news.json` mtime < 2h, sinon abort
2. **Filtrage (bash)** : `node scripts/insight-filter.mjs`
3. **Analyse marché (bash)** : `node scripts/generate-market-analysis.mjs` (déjà consolidé, 2 appels Haiku)
4. **Briefing stratégique (langage naturel)** :
   - Lecture de 12 JSON sources (sentiment, alerts, macro, market-briefing, insights, signals, historical)
   - Détection deltas vs 7 derniers jours (`data/briefing-history/`)
   - Production `data/daily-briefing.json` conforme au schéma existant
   - Contraintes : disclaimer AMF, sourcing chaque donnée, pas de redondance chiffrée, ton analytique factuel
   - Lundi : mode Sonnet étendu pour analyse hebdomadaire consolidée
5. **Article quotidien (langage naturel)** :
   - Sélection du thème le plus saillant des insights
   - Écriture `analyse-[thème]-[date].html` selon template `analyse-petrole-trump-iran-ormuz.html` (React createElement, Tailwind CDN, pas de JSX)
   - Inclusion évaluation SEMPLICE si zone concernée
   - `matchImage()` de `image-catalog.js` pour l'image hero
6. **Veille + RAG (bash)** : `node scripts/veille-continue.mjs` puis `node scripts/rag-index.mjs --briefing --articles`
7. **Validation pre-commit (langage naturel + bash)** :
   - `node scripts/validate-article.mjs [nouveau_article].html`
   - Vérification de `data/daily-briefing.json` : JSON valide, pas de placeholder `TBD`, disclaimer présent, sources citées
   - Si échec : abort, création d'une issue GitHub via `gh`, sortie sans push
8. **Commit (bash)** : `git pull --rebase` + `git add` + `git commit -m "🧠 Pipeline Routine — [timestamp]"` + `git push` (retry 3x)

**Circuit breaker :** au démarrage, la Routine lit `.routine-failure-count`. Si > 3 échecs en 24h, elle abort immédiatement et crée une issue — protection contre les boucles consommant le quota.

---

### 3.2 Routine Inspector

**Responsabilité :** Vérifier que le site en production reflète correctement le dernier déploiement. Seule source d'observabilité.

**Trigger :** schedule `0 7,19 * * *` UTC (environ 30 min après Master, après déploiement GitHub Pages)

**Outils activés :** `WebFetch`, `Read`, `Bash` (pour `gh` CLI)

**Vérifications :**
1. `WebFetch https://inflexionhub.com/data/daily-briefing.json` → JSON valide, date du jour, contenu > 500 chars
2. `WebFetch https://inflexionhub.com/` → status 200, palette emerald présente (`#006650`), bronze bar visible, pas de `undefined` ou `[object Object]`
3. Identification du dernier article créé (`git log --name-only -1`) → `WebFetch` de sa page → status 200, structure HTML valide
4. `WebFetch https://inflexionhub.com/expertise.html#semplice` → `data/semplice-history.json` accessible, 18 zones présentes
5. Échantillon 3 images Unsplash référencées dans `image-catalog.js` → HTTP 200

**Actions :**
- Si toutes vérifications OK : log `✅ Inspection passée`, sortie sans commit
- Si au moins un échec : `gh issue create --title "🚨 Régression prod [date] [composant]" --body "[détails + logs WebFetch]" --label bug,prod`

---

### 3.3 Routine Newsletter

**Responsabilité :** Générer la newsletter hebdomadaire de synthèse.

**Trigger :** schedule `0 10 * * 0` UTC (dimanche 10h UTC)

**Outils activés :** `Read`, `Write`, `Bash`

**Flux :**
1. Lecture `data/briefing-history/*.json` des 7 derniers jours
2. Identification : 3-5 événements majeurs, thèmes récurrents, signaux faibles remontés en signaux forts, évolutions SEMPLICE
3. Rédaction (langage naturel) selon template interne : édito 200 mots, 5 points clés avec sources, focus SEMPLICE sur zone ayant évolué, à surveiller semaine suivante
4. Écriture `data/newsletter-[YYYY-MM-DD].json`
5. Validation inline par la Routine : JSON valide, édito ≥ 150 mots, au moins 3 sources citées, pas de placeholder (`validate-newsletter.mjs` pourra être créé ultérieurement pour mutualiser avec la CI si nécessaire)
6. `git commit` + `git push`

---

### 3.4 Routine SEMPLICE Validator

**Responsabilité :** Mettre à jour les évaluations du cadre SEMPLICE (18 zones, 8 dimensions) selon les nouveaux indicateurs collectés dans la semaine.

**Trigger :** schedule `0 22 * * 6` UTC (samedi 22h UTC — précède le briefing dimanche matin)

**Outils activés :** `Read`, `Write`, `Bash`

**Flux :**
1. Lecture `data/semplice-history.json` (18 zones, historique)
2. Lecture `data/semplice/grille-scoring-quantitative-v2.md` (107 indicateurs risque) et `data/semplice/grille-scoring-opportunite-v2.md` (66 indicateurs)
3. Pour chaque zone : lecture des insights de la semaine (`data/insights.json` + `briefing-history/`) qui la concernent
4. Application de la validation 3 couches : R1-R8 (règles risque), SIG1-SIG8 (signaux), Layer 3 (validation sémantique Sonnet)
5. Recalcul des scores si indicateurs ont significativement bougé (variation > 0.3 sur une dimension)
6. Mise à jour `data/semplice-history.json` avec nouveaux scores + timestamp + sources
7. Si une zone franchit un seuil critique (ex. score risque > 6.0), écriture dans `data/semplice-alerts.json` pour ingestion par le Master du lendemain
8. `git commit` + `git push`

---

## 4. Flux de données, secrets et authentification

### Secrets

| Secret | Rôle |
|--------|------|
| `ANTHROPIC_API_KEY` (GHA) | Conservé pour scripts `.mjs` legacy (fallback si Routines désactivées) |
| 7 clés API data (Finnhub, GNews, FRED, Alpha Vantage, Messari, Twelve Data, NewsAPI) | Inchangées, seul `fetch-data.mjs` les utilise |
| `ROUTINE_WEBHOOK_TOKEN` | **NOUVEAU** GHA secret, permet à `fetch-data.yml` de déclencher Master via API |
| `ROUTINE_MASTER_URL` | **NOUVEAU** GHA secret, endpoint webhook de la Routine Master |
| `GITHUB_TOKEN` | Fourni nativement par Routines (repo access intégré) |

### Modification de `fetch-data.yml`

Ajout d'une étape finale après le commit `data/*.json` :

```yaml
- name: Trigger Master Routine
  if: success()
  env:
    ROUTINE_WEBHOOK_TOKEN: ${{ secrets.ROUTINE_WEBHOOK_TOKEN }}
    ROUTINE_MASTER_URL: ${{ secrets.ROUTINE_MASTER_URL }}
  run: |
    curl -X POST "$ROUTINE_MASTER_URL" \
      -H "Authorization: Bearer $ROUTINE_WEBHOOK_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"trigger_source": "fetch-data-success", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' \
      --fail --retry 3 --retry-delay 10 || echo "⚠️ Routine trigger failed, fallback schedule will handle"
```

Le `|| echo` garantit que GHA ne fail pas si la Routine API est momentanément down — le schedule fallback (+30 min) prendra le relais.

### Journée type (chronologie)

```
06:00 UTC  fetch-data.yml cron démarre
06:03 UTC  data/*.json mis à jour, commit, POST webhook Routine Master
06:05 UTC  Routine Master démarre sur Anthropic infra
06:12 UTC  Master termine, git push sur main
06:15 UTC  deploy-pages.yml trigger auto, GitHub Pages déploie
06:45 UTC  Inspector Routine démarre (schedule)
06:47 UTC  Inspector termine (OK ou issue créée)
07:00 UTC  polymarket-scan.yml déclenché (inchangé)

Même cycle à 18:00 UTC
```

---

## 5. Gestion des erreurs et rollback

### Matrice des pannes et réponses

| Panne | Réponse automatique | Action humaine |
|-------|---------------------|----------------|
| `fetch-data` échoue | Pas de trigger Routine, pas de briefing obsolète | Revoir logs GHA |
| Webhook Master non reçu | Fallback schedule déclenche Master +30min | Aucune |
| Conflit `git pull` dans Master | Master abort, issue créée | Résoudre conflit |
| `validate-article.mjs` échoue | Master abort AVANT push, issue créée | Inspecter et corriger |
| JSON malformé généré | Retry 1x avec feedback, sinon abort | Affiner prompt |
| `git push` rejeté | `git pull --rebase` + retry, max 3 | Aucune si succès |
| Inspector détecte régression | Issue GitHub auto-créée | Trier et corriger |
| Routines API d'Anthropic down | **Réactiver workflows GHA** (décommenter) | Décommenter `on: schedule:` dans 3 YAML, push |
| Quota 15/jour atteint | Routine suivante skip | Upgrade ou désactiver SEMPLICE |

### Plan de rollback (3 niveaux)

**Niveau 1 — Bug mineur dans output Routine**
- `git revert` sur le dernier commit Master, push → site restauré en ~2 minutes

**Niveau 2 — Routines dysfonctionnent répétitivement**
- Décommenter `on: schedule:` dans `generate-unified-briefing.yml`, `generate-article.yml`, `generate-newsletter.yml`
- Push → pipeline legacy GHA IA reprend immédiatement
- Désactiver les Routines dans claude.ai/code

**Niveau 3 — Maintenance prolongée Inflexion IA**
- Site conserve derniers JSON valides servis par GitHub Pages
- Bannière "Mise à jour suspendue" à ajouter manuellement dans `index.html`

### Retry strategy par étape

| Étape | Retry policy |
|-------|--------------|
| `git pull` | 3x avec backoff 5s/10s/20s |
| Scripts bash (insight-filter, etc.) | 2x puis abort |
| Appel Claude naturel (briefing, article) | 1x retry avec feedback "fix JSON/format", puis abort |
| `validate-article.mjs` | 0 retry (bloquant) |
| `git push` | 3x avec `git pull --rebase` entre chaque |

---

## 6. Tests et validation

### Stratégie en 4 phases (4 semaines)

**Phase A — Tests locaux (semaine 1)**
- `npm test` → 188/188 doivent passer
- `node scripts/generate-daily-briefing.mjs --dry-run` → output identique au legacy

**Phase B — Routine Master en dry-run (semaine 2)**
- Routine créée avec clause "pas de `git push`", écrit dans branche `routine-dryrun`
- Comparaison manuelle quotidienne : Routine vs GHA
- Critère de passage : 3 runs consécutifs sans divergence significative

**Phase C — Bascule progressive (semaine 3)**
- Activation `git push` dans Master
- Désactivation (commentaire `on: schedule:`) de `generate-unified-briefing.yml` et `generate-article.yml`
- `generate-newsletter.yml` conservé en GHA pendant cette phase
- 5-7 jours de surveillance : Inspector ne doit créer aucune issue

**Phase D — Bascule totale (semaine 4)**
- Activation Newsletter, SEMPLICE, Inspector
- Désactivation de tous workflows IA GHA (sauf fetch-data, polymarket, ci, deploy)

### Tests de régression à ajouter

```
scripts/
├── test-routine-output.mjs       # Compare Routine vs GHA output (diff structurel JSON)
├── test-production-health.mjs    # Utilitaire pour Inspector
└── validate-routine-prompt.mjs   # Lint du prompt Master (longueur, sections obligatoires)
```

`test-routine-output.mjs` vérifie sur `data/daily-briefing.json` :
- Schéma JSON conforme (clés obligatoires)
- Longueur contenu > 500 chars
- Sources citées (pattern `source:` ou `selon`)
- Disclaimer AMF présent
- Absence de placeholders (`TBD`, `[NAME]`, `undefined`)

Appelé par `ci.yml` après chaque commit Routine.

### Checklists par phase

**Avant Phase B :**
- [ ] Secrets `ROUTINE_WEBHOOK_TOKEN` + `ROUTINE_MASTER_URL` créés
- [ ] Backup complet `data/` sur tag `pre-routine-migration-v0`
- [ ] Prompt Master relu par l'utilisateur pour cohérence avec `CLAUDE.md`
- [ ] Test `curl` manuel vers endpoint Routine → 200

**Avant Phase C :**
- [ ] 3 runs dry-run consécutifs validés
- [ ] Tag `pre-routine-production-v1`
- [ ] README mis à jour avec procédure rollback

**Avant Phase D :**
- [ ] 7 jours sans incident en Phase C
- [ ] Inspector : 0 issue produite
- [ ] Coût API Anthropic réel < $5/semaine

### Métriques post-go-live

| Métrique | Seuil vert | Seuil rouge |
|----------|-----------|-------------|
| Taux de succès Master | > 95% | < 80% |
| Issues Inspector / semaine | < 2 | > 5 |
| Latence fetch → deploy | < 20 min | > 45 min |
| Consommation quota / jour | < 8/15 | > 12/15 |
| Coût API résiduel | < $5/mois | > $20/mois |

---

## 7. Plan de migration détaillé (4 semaines)

### Semaine 1 — Préparation (zéro risque)

- **J1-J2** : Setup Anthropic (compte admin Routines, connexion repo, vérification Max 5x), tag `pre-routine-migration-v0`
- **J3-J4** : Rédaction de `.routines/master-prompt.md` consolidant les responsabilités des 13 scripts IA (cf. Section 3.1)
- **J5** : Tests locaux de non-régression (`npm test`, simulation dry-run du prompt via Claude Code interactif)

### Semaine 2 — Phase B (dry-run)

- **J6-J7** : Création Routine Master `[DRY-RUN]` sur claude.ai/code, récupération endpoint + token, ajout secrets GHA
- **J8-J10** : Déclenchements manuels via `curl`, comparaison branche `routine-dryrun` vs `main`, validation 3 runs consécutifs

### Semaine 3 — Phase C (bascule progressive)

- **J11** : Ajout étape `curl POST` dans `fetch-data.yml`, tag `pre-routine-production-v1`
- **J12** : Activation Routine Master en prod, commentaire `on: schedule:` dans 2 YAML IA
- **J13-J17** : Surveillance intensive (5 jours), check quotidien visuel du site

### Semaine 4 — Phase D (bascule totale)

- **J18** : Création Inspector Routine, premier run lendemain matin
- **J19** : Création Newsletter Routine, désactivation `generate-newsletter.yml`
- **J20** : Création SEMPLICE Validator Routine
- **J21** : Validation finale (dashboard Anthropic < 8/15, billing API < $2/mois), tag `routines-v1-stable`, mise à jour `README.md` avec procédure rollback

### Livrables finaux

```
Inflexion/
├── .routines/
│   ├── master-prompt.md
│   ├── inspector-prompt.md
│   ├── newsletter-prompt.md
│   ├── semplice-validator-prompt.md
│   └── README.md
├── scripts/
│   └── test-routine-output.mjs       # NOUVEAU
├── .github/workflows/
│   ├── fetch-data.yml                # MODIFIÉ (trigger curl)
│   ├── polymarket-scan.yml           # Inchangé
│   ├── ci.yml                        # MODIFIÉ (test-routine-output)
│   ├── deploy-pages.yml              # Inchangé
│   ├── generate-article.yml          # DÉSACTIVÉ (commenté)
│   ├── generate-unified-briefing.yml # DÉSACTIVÉ
│   └── generate-newsletter.yml       # DÉSACTIVÉ
└── CLAUDE.md                         # MODIFIÉ (section Routines)
```

---

## 8. Budget et effort

| Poste | Avant | Après | Économie mensuelle |
|-------|-------|-------|-------------------|
| Max 5x subscription | $100/mois | $100/mois | $0 |
| Anthropic API tokens | ~$15-21/mois | ~$0-2/mois | **~$15-19/mois** |
| GHA minutes (runs IA) | ~300 min/mois | ~60 min/mois | Dans quota free |
| **Total net** | — | — | **~$180-228/an** |

**Effort humain :** 20-30h d'ingénierie réparties sur 4 semaines calendaires (dont ~60% de temps d'observation en production).

---

## 9. Décisions architecturales clés (ADR-style)

### 9.1 Pourquoi conserver les scripts `.mjs` ?
- **Filet de sécurité** : si Anthropic a une panne prolongée sur Routines, les workflows GHA peuvent être réactivés en 30 secondes
- **Utilitaires** : `insight-filter`, `generate-market-analysis`, `veille-continue`, `rag-index`, `validate-article` sont invoqués en bash par la Routine — pas de réécriture
- **Tests** : les 188 tests existants restent valides

### 9.2 Pourquoi Master ne chaîne pas directement vers Inspector ?
- `git push` → GitHub Pages prend 30-60s à déployer. Si Inspector tournait dans Master, il vérifierait une version non encore en ligne
- Séparation en Routine dédiée avec schedule +30min garantit un déploiement complet avant inspection
- Coût quota identique (1 Routine Master + 1 Inspector = 2 slots, vs 1 slot combiné — mais plus fiable)

### 9.3 Pourquoi SEMPLICE tourne le samedi avant le dimanche ?
- Chaînage intelligent via le filesystem : SEMPLICE Validator (samedi 22h UTC) produit `data/semplice-alerts.json` que le Master du dimanche 06h30 UTC peut lire et intégrer au briefing stratégique
- Découplage asynchrone propre entre Routines, sans dépendance runtime

### 9.4 Pourquoi Inspector utilise WebFetch plutôt que lire le filesystem ?
- On veut vérifier **la production réelle** telle qu'un utilisateur la voit — pas juste le repo
- Détection de régressions liées au déploiement (GitHub Pages CDN, cache, 404 sur images) qu'un test filesystem ne verrait pas
- Inspector devient ainsi un "utilisateur synthétique" — la meilleure source d'observabilité

### 9.5 Pourquoi consolider avec 1 Master plutôt que 4-5 Routines IA distinctes ?
- Quota 15/jour : 4-5 Routines × 2 runs/jour = 8-10 slots — gaspillage
- Intelligence contextuelle : Master a tout le contexte en mémoire (briefing → article bénéficient du même contexte)
- Maintenance : 1 prompt à maintenir au lieu de 5

---

## 10. Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| Dérive éditoriale LLM (ton, qualité) | Moyenne | Moyen | Phase B dry-run + Inspector continu + métrique "qualité subjective" hebdo |
| Panne Routines API Anthropic | Faible | Élevé | Fallback GHA réactivable en 30s |
| Dépassement quota 15/jour | Faible | Moyen | Circuit breaker + monitoring Anthropic dashboard |
| Conflit git simultané (utilisateur + Routine) | Faible | Faible | `git pull --rebase` + retry + issue si conflit non-résolu |
| Régression CSS détectée tardivement | Moyenne | Moyen | Inspector vérifie palette emerald + bronze bar à chaque run |
| Newsletter qualité dégradée (hebdo) | Moyenne | Faible | Validation manuelle des 3 premières newsletters produites en Phase D |

---

## Annexes

### A. Liens utiles
- [Blog post Anthropic Routines](https://claude.com/blog/introducing-routines-in-claude-code)
- `CLAUDE.md` (racine repo) — règles projet, design system, contraintes
- `/Users/floryanleblanc/.claude/projects/-Users-floryanleblanc-Documents-GitHub-Inflexion/memory/MEMORY.md` — mémoire persistante

### B. Scripts impactés
- **Remplacés par langage naturel dans Master Routine** : `generate-daily-briefing.mjs`, `generate-article.mjs`, `generate-newsletter.mjs`
- **Invoqués en bash par Master Routine** : `insight-filter.mjs`, `generate-market-analysis.mjs`, `veille-continue.mjs`, `rag-index.mjs`, `validate-article.mjs`
- **Invoqués en bash par SEMPLICE Validator Routine** : `semplice-validator.mjs`
- **Intacts (non-IA)** : `fetch-data.mjs`
