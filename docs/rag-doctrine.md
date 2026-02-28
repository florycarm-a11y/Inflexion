# RAG — Doctrine Technique Inflexion

Source : "RAG : La Verite Derriere la Promesse" — Le SamourAI (Q4 2025)
Adaptation : Inflexion Hub — Fevrier 2026

---

# 1. Le Paradoxe du RAG

Le marche explose.
Mais 80% des projets echouent.

Chez Inflexion, on a fait le choix inverse : construire le RAG **apres** avoir resolu l'ingenierie des donnees.

158 flux RSS. 15 APIs. 500 articles indexes. 5 briefings historiques.
Tout est structure, nettoye, categorise **avant** de toucher un vecteur.

Un RAG n'est pas une feature.
C'est une discipline d'ingenierie des donnees.
Et sur Inflexion, cette discipline etait la depuis le premier commit.

---

# 2. Pourquoi le briefing Inflexion a besoin du RAG

### 2.1 Peremption

Claude Sonnet et Haiku sont statiques.
Ils ignorent le marche d'aujourd'hui, le briefing d'hier, la tendance de la semaine.

**Notre reponse :**
Le pipeline `fetch-data.mjs` recupere 15 APIs + 158 RSS toutes les 6 heures.
Les donnees fraiches sont injectees directement dans le prompt — pas de fine-tuning, pas d'attente.

### 2.2 Hallucinations

Claude predit des tokens plausibles. Pas des cours de bourse.

**Notre reponse :**
Le briefing recoit les donnees chiffrees en PARTIE B (marches temps reel) et les articles sources en PARTIE A.
Le prompt interdit explicitement d'inventer des donnees absentes.
Regle du `DAILY_BRIEFING_SYSTEM_PROMPT` : *"Ne pas inventer de donnees absentes des parties A et B."*

### 2.3 Continuite narrative

Claude ne sait pas que le BTC etait a 63 000 $ hier, ni que le Fear & Greed etait a 8/100.
Sans memoire inter-sessions, chaque briefing est une page blanche.

**Notre reponse :**
Le store RAG (`data/rag/`) conserve 500 articles et 60 briefings (~2 mois).
Chaque matin, le script `generate-daily-briefing.mjs` interroge le store par similarite semantique pour injecter en PARTIE C les precedents historiques pertinents.

---

# 3. Architecture RAG Inflexion

## 3.1 Socle : le pipeline de donnees (deja en place)

```
GitHub Actions (cron 6h)
    |
fetch-data.mjs (15 APIs + 158 RSS)
    |
    +-- Nettoyage : HTML strip, deduplication par URL/titre
    +-- Normalisation : dates ISO, sources uniformisees, langues detectees
    +-- Categorisation : 5 rubriques (geopolitique, marches, crypto, matieres_premieres, ai_tech)
    +-- Traduction : EN->FR automatique (translate-articles.mjs)
    |
data/*.json (20+ fichiers structures)
```

La qualite de cette couche determine tout.
Nos articles portent deja : `title`, `description`, `source`, `publishedAt`, `rubrique`, `lang`, `url`.
Ce sont les metadonnees critiques que 80% des projets RAG n'ont pas.

## 3.2 Couche vectorielle : embeddings locaux

```
rag-index.mjs
    |
    +-- Charge news.json + newsapi.json + daily-briefing.json
    +-- Genere un ID unique par article (hash titre+source)
    +-- Vectorise via all-MiniLM-L6-v2 (384 dimensions, quantifie)
    +-- Stocke dans data/rag/articles.json + data/rag/briefings.json
    |
Zero API externe. Zero cout. ~23 MB de modele en cache.
```

**Choix technique :**
- Modele : `Xenova/all-MiniLM-L6-v2` via `@xenova/transformers` (Node.js natif)
- Dimensions : 384 (compact, suffisant pour la similarite article/article)
- Troncature : 1024 caracteres (titre + description — pas le corps complet)
- Stockage : JSON plat dans `data/rag/` (commite dans git, deploye sur Pages)

## 3.3 Flux : generation augmentee du briefing

```
generate-daily-briefing.mjs
    |
    1. Charger les 13 sources de donnees (news, marches, macro, crypto...)
    2. Selectionner les 20-30 articles les plus importants
    3. Construire le contexte :
       |-- PARTIE A : articles du jour (actualites)
       |-- PARTIE B : donnees de marche temps reel (chiffrees)
       |-- PARTIE C : contexte historique RAG (memoire)
       |      |-- Articles historiques similaires (cosine > 0.35)
       |      +-- Briefings precedents (continuite narrative)
       |-- PARTIE D : briefing de la veille (si mode delta)
    4. Injecter dans le prompt systeme
    5. Claude Sonnet (lundi) ou Haiku (mar-dim) genere le briefing
    6. Le briefing est re-indexe dans le store RAG pour le lendemain
```

**Boucle vertueuse :**
Chaque briefing produit enrichit le store → le briefing suivant dispose de plus de contexte → la continuite narrative s'ameliore au fil des jours.

---

# 4. Principe Fondamental

Fine-tuning = reentrainer un employe.
RAG = lui donner acces a une bibliotheque.

Inflexion ne fine-tune pas Claude.
Inflexion lui fournit :
- 157 sources RSS structurees (la bibliotheque de presse)
- 15 APIs de marche (les donnees chiffrees en temps reel)
- 500 articles vectorises (la memoire editoriale)
- 60 briefings historiques (la continuite analytique)

Le modele sait analyser.
Nos donnees lui disent **quoi** analyser.

---

# 5. Vectorisation : comment ca marche chez nous

Chaque article est transforme en un vecteur de 384 dimensions.

```javascript
// embeddings.mjs — ce qu'on vectorise
const text = `${article.title}. ${article.description}`.trim().slice(0, 512);
const embedding = await embedText(text);  // -> number[384]
```

Deux articles sur le meme sujet (meme en langues differentes) produisent des vecteurs proches :
- "Bitcoin drops below $60K" et "Le BTC passe sous les 60 000 $" → vecteurs proches
- La recherche se fait sur le **sens**, pas sur les mots

**Recherche a la generation :**
```javascript
// generate-daily-briefing.mjs — requete semantique
const todayTopics = topArticles.slice(0, 5).map(a => a.title).join('. ');
const queryEmbedding = await embedText(todayTopics);

const similarArticles = store.searchArticles(queryEmbedding, {
    topK: 5,          // 5 articles les plus similaires
    minScore: 0.35,   // seuil de pertinence (cosine similarity)
    excludeDate: today(), // exclure le jour meme (on veut l'historique)
});
```

---

# 6. Segmentation : notre approche

## Ce qu'on ne fait pas

Decoupage fixe tous les X caracteres.
→ Perte de sens.
→ Articles coupes en plein milieu d'une phrase.

## Ce qu'on fait : chunks semantiques naturels

Nos donnees sont **pre-segmentees par nature** :

| Source | Unite naturelle | Taille typique |
|--------|----------------|----------------|
| Article RSS | titre + description | 100-300 tokens |
| Briefing quotidien | synthese complete | 400-600 tokens |
| Signal du briefing | titre + description + interconnexions | 150-250 tokens |
| Alerte IA | message + severite + contexte | 50-100 tokens |
| Donnee de marche | prix + variation + source | 10-30 tokens |

Pas besoin de chunking artificiel.
Chaque article est deja un chunk semantique coherent.

**Texte indexe :** `titre + description` tronque a 512 caracteres.
**Texte du briefing :** `titre + signaux + risques` tronque a 1024 caracteres.

L'overlap est implicite : les articles sur le meme sujet partagent du vocabulaire commun, ce qui rapproche naturellement leurs vecteurs.

---

# 7. Niveaux de maturite RAG — ou en est Inflexion

| Niveau | Description | Inflexion |
|--------|-------------|-----------|
| 1. Prototype | Documents indexes | **Depasse** — articles + briefings indexes |
| 2. Hybride | Vectoriel + mots-cles | **Actif** — cosine similarity + `SOURCE_TIERS` + `scoreArticle()` |
| 3. Multimodal | Images, tableaux, graphiques | **Partiel** — TradingView widgets + chart-gold-btc.json |
| 4. Agentique | Le RAG pilote des actions autonomes | **En roadmap** — alertes croisees watchlist |

**Controles operationnels en place :**
- Versioning : store RAG commite dans git (historique complet)
- Audit : `_meta.json` + stats RAG affichees a chaque execution
- Mises a jour temps reel : cron 6h pour les donnees, quotidien pour le briefing
- Limites : 500 articles max, 60 briefings max (evite l'explosion de l'index)

---

# 8. Le Vrai Probleme : les donnees (et comment on l'a resolu)

La performance d'un RAG depend de :

### Proprete
- Deduplication par URL et par hash titre+source (`articleId()`)
- Filtrage des articles hors-sujet via `isRelevantForCategory()` avec word boundaries (`\b`)
- Suppression des faux positifs (ex: "or" dans "Chamfort" → corrige avec `\bor\b`)

### Structuration
- 5 rubriques strictes : `geopolitique`, `marches`, `crypto`, `matieres_premieres`, `ai_tech`
- Chaque article porte : `title`, `description`, `source`, `publishedAt`, `rubrique`, `url`, `lang`
- Chaque briefing porte : `date`, `titre`, `contenu`, `signaux`, `risques`, `sentiment`, `tags`

### Metadonnees
Nos metadonnees sont **natives**, pas ajoutees apres coup :

| Metadonnee | Source | Utilisation RAG |
|------------|--------|-----------------|
| `date` | API/RSS `publishedAt` | Tri temporel, exclusion du jour, fenetre de fraicheur |
| `source` | Nom du media/API | Attribution dans le briefing, scoring qualite (`SOURCE_TIERS`) |
| `rubrique` | Classification Claude Haiku | Filtrage par categorie, equilibrage des resultats |
| `url` | Lien original | Tracabilite, deduplication |
| `lang` | Detection automatique | Priorisation du francais dans la curation |
| `sentiment` | Analyse Claude Haiku | Contextualisation du briefing, coloration des signaux |
| `tags` | Generes par le briefing | Recherche thematique, continuite narrative |

Sans ces metadonnees, le systeme confondrait un article de 2026 avec un de 2025.
Chez Inflexion, la date fait partie du modele de donnees depuis le jour 1.

---

# 9. Pieges a eviter — et nos garde-fous

## 9.1 "Perdu au milieu" (Lost in the Middle)

Trop de documents injectes → le modele oublie le centre.

**Notre garde-fou :**
- PARTIE C (RAG) injecte **5 articles + 3 briefings maximum**
- Chaque resultat a un score de similarite minimum (0.35 pour articles, 0.30 pour briefings)
- Le prompt systeme hierarchise : PARTIE A (actualites du jour) > PARTIE B (donnees chiffrees) > PARTIE C (historique)

## 9.2 Explosion des couts

Indexer tout = erreur.
Inflexion indexe ~300-500 articles/jour, mais le store est plafonne a 500.

**Economies realisees :**
- Embeddings locaux (all-MiniLM-L6-v2) → zero cout API
- Store JSON plat → zero base de donnees vectorielle
- Consolidation des appels Claude → 4 appels/jour au lieu de 32 (~82% d'economie)
- Mode delta (Haiku mar-dim) vs complet (Sonnet lundi) → ~50% de tokens en moins
- Budget total estime : ~2,25 $/mois pour l'IA

## 9.3 Fausse confiance

Un mauvais RAG est pire qu'aucun RAG.

**Nos controles :**
- Le RAG est `continue-on-error: true` dans le workflow — si l'indexation echoue, le briefing se genere quand meme (sans PARTIE C)
- Le prompt exige l'attribution des sources : chaque chiffre porte une reference `(CoinGecko, 24h: -4,6%)`
- Les correlations internes sont qualifiees "estimation Inflexion"
- Le briefing porte un disclaimer : *"Ces elements sont des pistes de reflexion et ne constituent pas un conseil en investissement."*
- Mode `--dry-run` disponible pour valider sans appeler Claude

---

# 10. Philosophie Inflexion

Un RAG n'est pas un gadget IA.

C'est :
- **une architecture de connaissance** — 157 sources structurees en 5 rubriques
- **une structuration strategique** — metadonnees natives, scoring qualite, curation editoriale
- **un moteur de credibilite** — chaque donnee sourcee, chaque estimation qualifiee

La question n'est pas :
*"Est-ce que Claude est intelligent ?"*

La question est :
*"Est-ce que nos 157 sources, 15 APIs et 500 articles indexes sont structures pour produire un briefing que le Financial Times ne rougirait pas de publier ?"*

La reponse est dans l'architecture.

---

# 11. Application concrete : le cycle RAG quotidien d'Inflexion

```
06h00 UTC — fetch-data.mjs
    |  15 APIs interrogees
    |  158 flux RSS parses
    |  Deduplication + traduction EN->FR
    |  -> data/*.json
    v
06h30 UTC — rag-index.mjs --articles
    |  Extraction des articles du jour
    |  Vectorisation (all-MiniLM-L6-v2, 384 dim)
    |  Ajout au store (dedup par ID, max 500)
    |  -> data/rag/articles.json
    v
07h00 UTC — generate-daily-briefing.mjs
    |  Charge 13 sources de donnees
    |  Selectionne 20-30 articles cles
    |  Interroge le store RAG (cosine similarity)
    |  Construit PARTIES A + B + C (+ D si delta)
    |  Claude Sonnet/Haiku genere le briefing
    |  -> data/daily-briefing.json
    v
07h05 UTC — rag-index.mjs --briefing
    |  Vectorise le briefing produit
    |  Ajout au store (max 60 briefings)
    |  -> data/rag/briefings.json
    v
Commit automatique + deploy GitHub Pages
    |
    v
data-loader.js (frontend)
    |  Charge daily-briefing.json
    |  Affiche : signal du jour, enjeux, risk radar
    |  Fallback vers article classique si briefing absent
```

Le RAG d'Inflexion n'est pas une "bibliotheque strategique augmentee".
C'est un **systeme nerveux** : il capte (157 sources), memorise (500 articles + 60 briefings), analyse (Claude Sonnet/Haiku) et restitue (briefing quotidien) en boucle continue.

Demain, le briefing saura que le BTC etait a 65 066 $ aujourd'hui.
Que le Fear & Greed etait a 11/100.
Que le S&P 500 rebondissait de +0,73%.

Cette memoire cumulative est ce qui separe un chatbot d'un analyste.

---

# 12. Roadmap RAG — prochaines etapes

| Priorite | Evolution | Impact |
|----------|-----------|--------|
| P1 | Indexer les donnees de marche structurees (prix, variations) | Recherche RAG croisee "Quand le BTC etait a ce niveau, que faisait l'or ?" |
| P1 | Recherche hybride vectorielle + mots-cles (`SOURCE_TIERS` + cosine) | Meilleur recall sur les termes techniques (ETF, OPEC, BCE) |
| P2 | Interface utilisateur de recherche semantique | L'utilisateur pose une question, le RAG repond avec sources |
| P2 | Indexer les signaux individuels du briefing (pas seulement le resume) | Granularite accrue pour la continuite narrative |
| P3 | RAG agentique : alertes croisees automatiques via watchlist | "Votre actif NVDA est mentionne dans 3 articles + 1 alerte IA" |
| P3 | Embeddings multilingues (FR+EN natif) | Eviter la perte de sens lors de la traduction pre-vectorisation |
