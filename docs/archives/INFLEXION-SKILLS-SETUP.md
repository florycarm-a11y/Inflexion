# INFLEXION — Installation & création de tous les Agent Skills

> **Ce document est un prompt exécutable.** Transmets-le directement à Claude Code ou OpenClaw.
> Il contient tout ce qu'il faut pour : (1) comprendre le format des skills, (2) installer les skills existants, (3) créer les skills custom pour Inflexion.

---

## CONTEXTE PROJET

**Inflexion** (inflexionhub.com) est une plateforme d'intelligence géopolitique et financière ciblant les décideurs PME/ETI français. Stack : HTML/CSS/JS sur GitHub Pages, vibe-codé avec Claude Code. Le projet a besoin d'un écosystème de skills couvrant :

- Analyse géopolitique et financière
- Pipeline éditorial (fact-checking, sourcing, SOURCES.md par article)
- Développement frontend (hero section, navigation, dashboards)
- Génération de documents (rapports, présentations, CV LaTeX)
- Automatisation (briefings quotidiens, agrégation de sources, alertes)

---

## PARTIE 1 — FORMAT D'UN SKILL (référence technique)

### Structure d'un dossier skill

```
nom-du-skill/
├── SKILL.md            # OBLIGATOIRE — instructions en Markdown + frontmatter YAML
├── scripts/            # Optionnel — code exécutable (Python, Bash)
├── references/         # Optionnel — documentation chargée à la demande
└── assets/             # Optionnel — templates, polices, icônes
```

### Règles critiques

- Le fichier DOIT s'appeler exactement `SKILL.md` (sensible à la casse)
- Le dossier DOIT être en kebab-case : `mon-skill` ✅ — `Mon Skill` ❌ — `mon_skill` ❌
- PAS de `README.md` dans le dossier skill
- PAS de balises XML `< >` dans le frontmatter YAML
- PAS de "claude" ou "anthropic" dans le nom du skill

### Format du SKILL.md

```markdown
---
name: nom-du-skill
description: |
  Ce que fait le skill. Utiliser quand l'utilisateur demande [phrases déclencheuses spécifiques].
  Inclure les types de fichiers concernés si pertinent.
  Maximum 1024 caractères.
metadata:
  author: Inflexion
  version: 1.0.0
---

# Nom du Skill

## Instructions

### Étape 1 : [Action]
Description claire de ce que Claude doit faire.

### Étape 2 : [Action]
...

## Exemples

### Exemple 1 : [Scénario courant]
**L'utilisateur dit** : "..."
**Actions** :
1. ...
2. ...
**Résultat** : ...

## Troubleshooting

**Erreur** : [message d'erreur courant]
**Cause** : [pourquoi]
**Solution** : [comment corriger]
```

### Bonnes pratiques pour la description (champ le plus important)

```yaml
# BON — spécifique, avec phrases déclencheuses
description: |
  Analyse des articles géopolitiques et génère un audit éditorial complet.
  Utiliser quand l'utilisateur dit "audit éditorial", "vérifier les sources",
  "fact-check cet article", ou "contrôle qualité éditoriale".

# MAUVAIS — trop vague
description: Aide avec les projets.
```

### Installation

- **Claude Code** : placer le dossier dans `.claude/skills/` à la racine du projet
- **Claude.ai** : Settings > Capabilities > Skills > Upload (zip du dossier)
- **API** : endpoint `/v1/skills`

---

## PARTIE 2 — SKILLS EXISTANTS À INSTALLER

### Instructions pour Claude Code

Crée le dossier `.claude/skills/` à la racine du projet Inflexion s'il n'existe pas, puis clone/télécharge les skills suivants.

### 2.1 Skills officiels Anthropic (repo github.com/anthropics/skills)

```bash
# Cloner le repo officiel
git clone https://github.com/anthropics/skills.git /tmp/anthropic-skills

# Copier les skills pertinents dans le projet
cp -r /tmp/anthropic-skills/skills/frontend-design .claude/skills/
cp -r /tmp/anthropic-skills/skills/skill-creator .claude/skills/
cp -r /tmp/anthropic-skills/skills/theme-factory .claude/skills/
cp -r /tmp/anthropic-skills/skills/canvas-design .claude/skills/
cp -r /tmp/anthropic-skills/skills/internal-comms .claude/skills/
cp -r /tmp/anthropic-skills/skills/mcp-builder .claude/skills/
cp -r /tmp/anthropic-skills/skills/web-artifacts-builder .claude/skills/
```

**Pourquoi ces skills** :
| Skill | Usage Inflexion |
|---|---|
| `frontend-design` | Redesign hero section, navigation, dashboards — évite l'esthétique IA générique |
| `skill-creator` | Créer et itérer les 4 skills custom (Partie 3) |
| `theme-factory` | Identité visuelle Inflexion cohérente sur tous les outputs |
| `canvas-design` | Visuels d'articles, images héro, graphiques distinctifs |
| `internal-comms` | Templates de briefings, rapports, newsletters |
| `mcp-builder` | Construire des connecteurs MCP custom (INSEE, Banque de France…) |
| `web-artifacts-builder` | Artifacts HTML complexes (dashboards interactifs) |

### 2.2 Skills communautaires — Recherche & Finance

```bash
# Deep Research (recherche structurée multi-sources)
git clone https://github.com/Weizhena/Deep-Research-skills.git /tmp/deep-research
cp -r /tmp/deep-research .claude/skills/deep-research

# K-Dense Scientific Skills (250+ intégrations data, FRED, Alpha Vantage, Plotly)
git clone https://github.com/K-Dense-AI/claude-scientific-skills.git /tmp/scientific-skills
# Sélectionner les skills pertinents :
mkdir -p .claude/skills/scientific-data
cp -r /tmp/scientific-skills/skills/fred-economic-data .claude/skills/ 2>/dev/null || true
cp -r /tmp/scientific-skills/skills/alpha-vantage .claude/skills/ 2>/dev/null || true
cp -r /tmp/scientific-skills/skills/plotly-viz .claude/skills/ 2>/dev/null || true

# K-Dense Scientific Writer (rédaction structurée, gestion des citations)
git clone https://github.com/K-Dense-AI/claude-scientific-writer.git /tmp/scientific-writer
mkdir -p .claude/skills/scientific-writer
cp -r /tmp/scientific-writer/skills/market-research-reports .claude/skills/ 2>/dev/null || true
cp -r /tmp/scientific-writer/skills/citation-management .claude/skills/ 2>/dev/null || true

# LaTeX Document Skill (27 templates, CV, rapports)
git clone https://github.com/ndpvt-web/latex-document-skill.git /tmp/latex-skill
cp -r /tmp/latex-skill .claude/skills/latex-document

# Visual Explainer (dashboards Mermaid, Chart.js, CSS Grid)
git clone https://github.com/nicobailon/visual-explainer.git /tmp/visual-explainer
cp -r /tmp/visual-explainer .claude/skills/visual-explainer 2>/dev/null || true
```

### 2.3 Skills communautaires — Automatisation & OSINT

```bash
# Composio Connect Apps (500+ intégrations SaaS)
# Vérifier le repo pour la structure exacte :
git clone https://github.com/ComposioHQ/awesome-claude-skills.git /tmp/composio-skills

# Octagon AI Financial Skills
git clone https://github.com/OctagonAI/skills.git /tmp/octagon-skills
cp -r /tmp/octagon-skills/skills/* .claude/skills/ 2>/dev/null || true

# Alirezarezvani — 237 skills production-ready (sélectionner les pertinents)
git clone https://github.com/alirezarezvani/claude-skills.git /tmp/alireza-skills
# Copier seulement les skills finance/marketing/content :
cp -r /tmp/alireza-skills/skills/financial-analyst .claude/skills/ 2>/dev/null || true
cp -r /tmp/alireza-skills/skills/content-strategist .claude/skills/ 2>/dev/null || true
cp -r /tmp/alireza-skills/skills/market-intelligence .claude/skills/ 2>/dev/null || true
```

### 2.4 Plugins Anthropic pour Knowledge Workers

```bash
# Plugins Cowork pour travailleurs du savoir
git clone https://github.com/anthropics/knowledge-work-plugins.git /tmp/kw-plugins
# Sélectionner les plugins pertinents :
cp -r /tmp/kw-plugins/plugins/content .claude/skills/kw-content 2>/dev/null || true
cp -r /tmp/kw-plugins/plugins/finance-accounting .claude/skills/kw-finance 2>/dev/null || true
cp -r /tmp/kw-plugins/plugins/data-analysis .claude/skills/kw-data-analysis 2>/dev/null || true
```

---

## PARTIE 3 — SKILLS CUSTOM À CRÉER POUR INFLEXION

Utilise le `skill-creator` pour générer ces 4 skills. Pour chacun, le contenu complet du SKILL.md est fourni ci-dessous. Crée le dossier et écris le fichier.

### 3.1 — inflexion-editorial-audit

```bash
mkdir -p .claude/skills/inflexion-editorial-audit
```

Contenu de `.claude/skills/inflexion-editorial-audit/SKILL.md` :

```markdown
---
name: inflexion-editorial-audit
description: |
  Audit éditorial complet des articles Inflexion : vérification des sources,
  fact-checking, cohérence analytique, et génération du fichier SOURCES.md.
  Utiliser quand l'utilisateur dit "audit éditorial", "fact-check",
  "vérifier les sources", "contrôle qualité article", "review éditorial",
  ou "checker cet article". Fonctionne sur des fichiers .md et .html.
metadata:
  author: Inflexion
  version: 1.0.0
  category: editorial
---

# Audit Éditorial Inflexion

## Objectif
Garantir que chaque article publié sur inflexionhub.com respecte les standards
d'intelligence stratégique : sources vérifiables, analyse structurée, pas de
spéculation non étiquetée.

## Instructions

### Étape 1 : Inventaire des affirmations
Parcourir l'article et lister TOUTES les affirmations factuelles (chiffres,
dates, événements, citations, données de marché). Numéroter chaque affirmation.

### Étape 2 : Classification des sources
Pour chaque affirmation, vérifier :
- **Source citée ?** (oui/non)
- **Type de source** : primaire (rapport officiel, données brutes) / secondaire (média, analyse tierce)
- **Fiabilité** : institutionnelle (FMI, BCE, gouvernement) / média majeur (Reuters, FT, Les Échos) / média secondaire / blog-opinion
- **Récence** : < 1 mois / < 6 mois / < 1 an / > 1 an
- **Accès** : URL fonctionnelle / paywall / document offline

### Étape 3 : Fact-checking
Pour chaque affirmation avec source :
- Vérifier que la source dit bien ce que l'article prétend
- Croiser avec au moins une source indépendante si possible
- Signaler les extrapolations ou interprétations non étiquetées

Pour chaque affirmation SANS source :
- Tenter de trouver une source via web search
- Si introuvable, marquer comme "affirmation non sourcée — à retirer ou sourcer"

### Étape 4 : Analyse de la structure argumentative
- L'article suit-il une logique analytique claire ? (thèse → preuves → implications)
- Les scénarios sont-ils étiquetés (optimiste/central/pessimiste) ?
- Les limites de l'analyse sont-elles reconnues ?
- Le ton est-il celui d'un analyste (factuel, mesuré) ou d'un éditorialiste (opinion) ?

### Étape 5 : Génération du SOURCES.md
Créer un fichier `SOURCES.md` structuré ainsi :

```
# Sources — [Titre de l'article]
Date de l'audit : [date]
Auditeur : Claude (audit automatisé)

## Sources primaires
1. [Nom] — [URL] — consulté le [date]

## Sources secondaires
1. [Nom] — [URL] — consulté le [date]

## Affirmations non sourcées
1. "[affirmation]" — ligne [X] — STATUT : à sourcer / à retirer

## Score de qualité
- Affirmations totales : X
- Sourcées : X (X%)
- Sources primaires : X (X%)
- Affirmations non sourcées : X
- Note globale : [A/B/C/D/F]
```

### Étape 6 : Rapport de synthèse
Produire un résumé en 5-10 lignes :
- Points forts de l'article
- Faiblesses éditoriales identifiées
- Actions prioritaires (sourcer telle affirmation, reformuler tel passage)
- Recommandation : publier en l'état / publier après corrections mineures / corrections majeures requises

## Barème de notation
- **A** : >90% sourcé, >50% sources primaires, 0 affirmation non sourcée critique
- **B** : >75% sourcé, >30% sources primaires, ≤2 affirmations non sourcées
- **C** : >60% sourcé, quelques lacunes acceptables
- **D** : <60% sourcé, faiblesses structurelles
- **F** : <40% sourcé ou erreurs factuelles avérées

## Exemples

### Exemple 1 : Article sur la crise Iran-USA
**L'utilisateur dit** : "Fais un audit éditorial de l'article Iran"
**Actions** :
1. Identifier 47 affirmations factuelles
2. Vérifier les 32 sources citées
3. Trouver 8 affirmations non sourcées
4. Générer SOURCES.md avec score B+
**Résultat** : Rapport d'audit + SOURCES.md + 3 corrections prioritaires
```

### 3.2 — inflexion-osint-aggregator

```bash
mkdir -p .claude/skills/inflexion-osint-aggregator
```

Contenu de `.claude/skills/inflexion-osint-aggregator/SKILL.md` :

```markdown
---
name: inflexion-osint-aggregator
description: |
  Agrège des renseignements open-source (OSINT) depuis de multiples sources web,
  flux RSS et publications institutionnelles pour l'analyse géopolitique et financière.
  Utiliser quand l'utilisateur dit "veille OSINT", "agrégation de sources",
  "collecter les infos sur [sujet/pays/secteur]", "sourcing géopolitique",
  "monitoring", ou "flux de renseignement".
metadata:
  author: Inflexion
  version: 1.0.0
  category: intelligence
---

# Agrégateur OSINT Inflexion

## Objectif
Collecte systématique et structurée de renseignements open-source pour alimenter
les analyses Inflexion. Transforme le bruit informationnel en intelligence exploitable.

## Instructions

### Étape 1 : Cadrage de la collecte
Demander ou déduire :
- **Sujet/zone** : pays, région, secteur, entreprise, thématique
- **Horizon temporel** : dernières 24h / semaine / mois
- **Angle** : géopolitique / financier / sectoriel / réglementaire
- **Niveau de profondeur** : flash (survol) / standard / deep-dive

### Étape 2 : Collecte multi-sources
Interroger systématiquement ces catégories de sources :

**Sources institutionnelles** (priorité haute) :
- Organisations internationales : FMI, Banque Mondiale, OCDE, ONU, UE
- Banques centrales : BCE, Fed, Banque de France, BoE, BoJ
- Gouvernements : ministères des finances, affaires étrangères, défense
- Régulateurs : AMF, SEC, ESMA

**Sources média de référence** (priorité moyenne-haute) :
- Agences : Reuters, AFP, Bloomberg, AP
- Presse financière : Financial Times, Wall Street Journal, Les Échos, The Economist
- Presse géopolitique : Foreign Affairs, Foreign Policy, Le Monde Diplomatique

**Sources analytiques** (priorité moyenne) :
- Think tanks : IISS, CSIS, Brookings, IFRI, Fondation Jean Jaurès
- Recherche : RAND, Chatham House, Carnegie
- Ratings : Moody's, S&P, Fitch (communiqués publics)

**Sources marché** (priorité variable) :
- Données temps réel : indices, commodities, devises, spreads CDS
- Earnings / SEC filings (si corporate)
- Données macroéconomiques : INSEE, Eurostat, BLS

### Étape 3 : Structuration des données collectées
Organiser en tableau structuré :

| # | Source | Type | Date | Contenu clé | Fiabilité | URL |
|---|--------|------|------|-------------|-----------|-----|
| 1 | FMI    | Institutionnelle | 2026-03-09 | Révision PIB zone euro... | Haute | [url] |

### Étape 4 : Synthèse analytique
- **Signaux forts** : faits établis, tendances confirmées par 2+ sources
- **Signaux faibles** : indices émergents, une seule source fiable
- **Contradictions** : sources en désaccord — noter les deux positions
- **Lacunes** : zones où l'information manque (angle mort)

### Étape 5 : Livrable
Produire un document structuré :

```
# Collecte OSINT — [Sujet]
Date : [date]
Périmètre : [zone/secteur/thématique]
Horizon : [temporalité]
Sources consultées : [nombre]

## Synthèse exécutive (5 lignes max)
...

## Signaux forts
1. ...

## Signaux faibles
1. ...

## Données marché clés
- [indicateur] : [valeur] ([variation])

## Sources complètes
[tableau structuré]

## Recommandations pour analyse approfondie
- [sujet à creuser] — [pourquoi] — [source suggérée]
```

## Grille de fiabilité des sources
- **A (très fiable)** : institution officielle, données primaires, rapport audité
- **B (fiable)** : agence de presse majeure, média de référence, think tank reconnu
- **C (à vérifier)** : média secondaire, blog expert, réseau social officiel
- **D (prudence)** : source anonyme, blog non vérifié, rumeur de marché
```

### 3.3 — inflexion-geopolitical-risk

```bash
mkdir -p .claude/skills/inflexion-geopolitical-risk
```

Contenu de `.claude/skills/inflexion-geopolitical-risk/SKILL.md` :

```markdown
---
name: inflexion-geopolitical-risk
description: |
  Produit des évaluations structurées de risque géopolitique selon le framework
  SEMPLICE (Social, Économique, Militaire, Politique, Légal, Information/Tech,
  Cyber, Environnemental). Utiliser quand l'utilisateur dit "évaluation de risque",
  "risk assessment", "analyse de risque pays", "risque géopolitique",
  "scénarios géopolitiques", "matrice de risque", ou "SEMPLICE".
metadata:
  author: Inflexion
  version: 1.0.0
  category: analysis
---

# Évaluation de Risque Géopolitique Inflexion

## Objectif
Produire des évaluations de risque standardisées que les décideurs PME/ETI
français peuvent utiliser pour leurs décisions d'investissement, d'approvisionnement
et d'expansion internationale.

## Instructions

### Étape 1 : Cadrage
- **Zone géographique** : pays, région, corridor commercial
- **Horizon** : court terme (0-6 mois) / moyen terme (6-18 mois) / long terme (18+ mois)
- **Angle décisionnel** : investissement / supply chain / implantation / export

### Étape 2 : Analyse SEMPLICE
Évaluer chaque dimension sur une échelle 1-5 (1=faible risque, 5=critique) :

**S — Social** : stabilité sociale, tensions ethniques/religieuses, démographie,
migration, inégalités, mouvements sociaux
Score : [1-5] — Justification : [2-3 phrases sourcées]

**E — Économique** : croissance, inflation, dette, balance commerciale,
dépendances sectorielles, sanctions
Score : [1-5] — Justification : ...

**M — Militaire** : conflits actifs, tensions frontalières, dépenses défense,
alliances, prolifération
Score : [1-5] — Justification : ...

**P — Politique** : stabilité gouvernementale, corruption, qualité institutionnelle,
élections à venir, polarisation
Score : [1-5] — Justification : ...

**L — Légal** : état de droit, protection des investisseurs, arbitraire
réglementaire, sanctions internationales
Score : [1-5] — Justification : ...

**I — Information/Tech** : contrôle de l'information, censure, cybersécurité,
infrastructure numérique, désinformation
Score : [1-5] — Justification : ...

**C — Cyber** : menaces cyber étatiques, infrastructure critique, ransomware,
espionnage industriel
Score : [1-5] — Justification : ...

**E — Environnemental** : risques climatiques, dépendance ressources naturelles,
transition énergétique, catastrophes naturelles
Score : [1-5] — Justification : ...

### Étape 3 : Score composite et catégorie
- Calculer la moyenne pondérée (pondération ajustable selon l'angle décisionnel)
- Catégoriser : Faible (1-2) / Modéré (2-3) / Élevé (3-4) / Critique (4-5)

### Étape 4 : Scénarios
Produire 3 scénarios :
- **Optimiste** (probabilité X%) : [description] → impact sur décision
- **Central** (probabilité X%) : [description] → impact sur décision
- **Pessimiste** (probabilité X%) : [description] → impact sur décision

### Étape 5 : Implications pour les PME/ETI françaises
- Risques spécifiques pour les entreprises françaises (géopolitique bilatérale FR-pays)
- Recommandations opérationnelles concrètes
- Indicateurs à surveiller (early warning)

### Étape 6 : Livrable formaté

```
# Évaluation de Risque — [Zone]
Classification : [Faible/Modéré/Élevé/Critique]
Date : [date] | Horizon : [court/moyen/long terme]
Analyste : Claude (assisté IA) | Supervision : [nom si applicable]

## Score SEMPLICE
| Dimension | Score | Tendance |
|-----------|-------|----------|
| Social | X/5 | ↑↓→ |
| Économique | X/5 | ↑↓→ |
| ... | ... | ... |
| **Composite** | **X/5** | |

## Synthèse exécutive (10 lignes max)
...

## Analyse détaillée par dimension
...

## Scénarios
...

## Recommandations PME/ETI
...

## Sources
...
```
```

### 3.4 — inflexion-daily-brief

```bash
mkdir -p .claude/skills/inflexion-daily-brief
```

Contenu de `.claude/skills/inflexion-daily-brief/SKILL.md` :

```markdown
---
name: inflexion-daily-brief
description: |
  Génère des produits d'intelligence structurés pour Inflexion : briefings quotidiens,
  flash reports, et analyses approfondies. Respecte le format éditorial Inflexion
  et le ton d'analyste stratégique. Utiliser quand l'utilisateur dit "briefing du jour",
  "daily brief", "flash report", "brief matinal", "résumé intelligence",
  "morning note", "point de situation", ou "brief Inflexion".
metadata:
  author: Inflexion
  version: 1.0.0
  category: content-production
---

# Générateur de Briefings Inflexion

## Objectif
Produire des intelligence products cohérents avec la ligne éditoriale Inflexion :
"L'information que les décideurs lisent avant de décider."

## Formats disponibles

### Format 1 : Daily Brief (Briefing matinal)
Longueur : 800-1200 mots
Structure :

```
# Briefing Inflexion — [Date]

## Ce qu'il faut retenir aujourd'hui
[3-5 bullets, une phrase chacun, l'essentiel en gras]

## Géopolitique
### [Titre fait 1]
[2-3 paragraphes : fait → contexte → implication pour les décideurs]
Source(s) : [références]

### [Titre fait 2]
...

## Marchés & Finance
### [Titre]
[Données de marché clés + analyse]
- Indices : [données]
- Devises : [données]
- Commodities : [données]
- Taux : [données]

### Analyse : [titre angle marché]
[2-3 paragraphes]

## Secteurs & Entreprises
### [Titre]
[Mouvements corporate, M&A, résultats, réglementation sectorielle]

## Signal faible du jour
[1 paragraphe sur un événement sous-couvert qui pourrait devenir majeur]

## Agenda
[Événements à venir dans les 48h : publications macro, réunions BC, élections, earnings]

---
*Inflexion — Intelligence géopolitique et financière*
*inflexionhub.com*
```

### Format 2 : Flash Report (alerte)
Longueur : 300-500 mots
Utiliser pour : événement soudain à impact immédiat

```
# FLASH — [Titre]
[Date] | [Heure]

## L'événement
[Paragraphe factuel : quoi, qui, où, quand]

## Contexte immédiat
[Pourquoi c'est important — 2-3 phrases]

## Impact marché
[Réactions immédiates observées ou attendues]

## Scénarios à 48h
- Si [condition A] → [conséquence]
- Si [condition B] → [conséquence]

## À surveiller
[2-3 indicateurs / événements à suivre dans les prochaines heures]

---
*Inflexion Flash Report*
```

### Format 3 : Deep Dive (analyse approfondie)
Longueur : 2000-4000 mots
Utiliser pour : analyse structurée d'une thématique complexe

```
# [Titre analytique]
*Inflexion — Analyse approfondie*
[Date] | Temps de lecture : X min

## Synthèse exécutive
[5-8 lignes — le minimum vital pour un décideur pressé]

## Thèse
[L'argument central en 2-3 phrases]

## Partie 1 : [Diagnostic / État des lieux]
...

## Partie 2 : [Dynamiques / Forces en présence]
...

## Partie 3 : [Scénarios / Implications]
...

## Ce que ça change pour les décideurs
[Recommandations concrètes, actions possibles, risques à couvrir]

## Sources
[Liste complète avec URLs]

---
*Inflexion — L'information que les décideurs lisent avant de décider*
```

## Règles éditoriales Inflexion

### Ton
- Analyste stratégique, jamais journaliste sensationnaliste
- Factuel d'abord, analytique ensuite, prescriptif en dernier
- Reconnaître les incertitudes ("les données disponibles suggèrent" vs "il est certain que")
- Pas de jargon inutile, mais pas de simplification excessive

### Sourcing
- Chaque affirmation factuelle doit avoir une source identifiable
- Privilégier les sources primaires (rapports institutionnels, données officielles)
- Indiquer le degré de confiance quand pertinent
- Toujours générer un SOURCES.md associé (utiliser le skill inflexion-editorial-audit)

### Audience
- Décideurs PME/ETI français : DG, DAF, directeurs stratégie
- Niveau de connaissance : bonne culture économique, pas spécialistes géopolitiques
- Besoin : comprendre les implications business, pas un cours d'histoire
- Langue : français, termes techniques en anglais acceptés si standards (spread, CDS, supply chain)

## Exemples

### Exemple 1 : Briefing matinal
**L'utilisateur dit** : "Brief du jour"
**Actions** :
1. Rechercher les événements des dernières 24h (géopolitique + marchés + corporate)
2. Hiérarchiser par impact sur les décideurs français
3. Rédiger selon le Format 1
4. Générer SOURCES.md associé
**Résultat** : Briefing de 1000 mots + fichier SOURCES.md

### Exemple 2 : Flash sur une crise
**L'utilisateur dit** : "Flash report — sanctions UE contre la Russie"
**Actions** :
1. Collecter les dernières informations sur l'événement
2. Évaluer l'impact marché immédiat
3. Produire 2-3 scénarios à 48h
4. Rédiger selon le Format 2
**Résultat** : Flash report de 400 mots envoyé dans l'heure
```

---

## PARTIE 4 — CONNECTEURS MCP RECOMMANDÉS

Configurer ces connecteurs MCP dans Claude.ai (Settings > Connectors) ou Claude Code pour compléter les skills :

| Connecteur | Usage Inflexion | Priorité |
|---|---|---|
| **Notion** | CMS éditorial — articles, calendrier, base de sources | Haute |
| **Gmail** | Distribution des briefings, correspondance sources | Haute |
| **Slack** | Alertes flash, coordination éditoriale | Moyenne |
| **S&P Global** | Données financières, ratings, recherche macro | Haute |
| **MT Newswires** | Flux d'actualités financières en temps réel | Haute |
| **Moody's** | Ratings souverains, analyse crédit, risque pays | Haute |
| **Zapier** | Automatisation cross-plateforme (RSS → analyse → publication) | Moyenne |
| **Canva** | Visuels réseaux sociaux, infographies | Basse |
| **Linear** | Gestion des tâches éditoriales et dev | Basse |

---

## PARTIE 5 — VÉRIFICATION POST-INSTALLATION

Après installation, tester chaque skill :

```
# Test de déclenchement (dans Claude Code) :
"Fais un audit éditorial de mon dernier article"          → doit déclencher inflexion-editorial-audit
"Collecte les infos OSINT sur la Turquie cette semaine"   → doit déclencher inflexion-osint-aggregator
"Évaluation de risque géopolitique sur le Brésil"         → doit déclencher inflexion-geopolitical-risk
"Brief du jour"                                            → doit déclencher inflexion-daily-brief
"Redesign la hero section du site"                         → doit déclencher frontend-design
"Crée une présentation pour un investisseur"               → doit utiliser les skills pptx intégrés
```

Si un skill ne se déclenche pas, ajuster la `description` dans le frontmatter YAML pour inclure davantage de phrases déclencheuses.

---

## RÉSUMÉ DES ACTIONS

1. **Créer** `.claude/skills/` dans le repo Inflexion
2. **Cloner** les repos listés en Partie 2 et copier les skills pertinents
3. **Créer** les 4 dossiers custom (Partie 3) avec leurs SKILL.md complets
4. **Configurer** les connecteurs MCP (Partie 4)
5. **Tester** chaque skill (Partie 5)
6. **Itérer** avec `skill-creator` pour affiner les descriptions et instructions

Total estimé : ~15 skills installés + 4 skills custom = 19 skills opérationnels.
Temps d'installation : ~30 minutes.
