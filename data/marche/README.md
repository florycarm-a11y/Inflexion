# Couche « lecture de marché » — données, sources, limites

Une couche **à côté** du tracker d'inflexions, qui aide à juger si un signal est déjà dans le cours. Page : [`marche.html`](../../marche.html). Explication publique : [`methode.html#lecture-marche`](../../methode.html).

**Statut : hypothèses non backtestées.** Cette couche est hors du protocole de test de la méthode (`docs/tracker-methode.md`, v1.3 figée) et hors du rejeu en cours. Outil de lecture, pas un conseil en investissement.

## La règle d'or : un flux à sens unique

```
data/tracker/*.json ──► moteur du tracker (tracker-modele.js) ──► dernière alerte ─┐
                                                                                   ├─► lectureMarche() ──► étiquette + raisons
FINRA · SEC · Nasdaq ──► scripts/marche/collecte.mjs ──► data/marche/instantane.json ─┘
```

La couche marché **lit** la sortie du moteur. Elle ne modifie ni un solde, ni une alerte, ni un fichier de `data/tracker/`. Le tracker, lui, ignore jusqu'à son existence. `test/marche-etancheite.test.mjs` le vérifie de cinq façons, dont une référence des soldes et alertes figée avant l'ajout de la couche (`test/fixtures/marche/tracker-reference.json`).

Comme dans le tracker, **rien de calculé n'est stocké** : l'instantané ne porte que des valeurs brutes sourcées. Le P/S, les tendances, la fraîcheur et l'étiquette sont dérivés à l'affichage. Changer un seuil ne demande donc aucune nouvelle collecte.

## Fichiers

| Fichier | Rôle |
|---|---|
| `lecture-marche-config.js` | **Tous les seuils**, commentés. Le seul fichier à modifier pour régler la grille |
| `lecture-marche-modele.js` | Moteur de règles, pur : trois lecteurs de module, la grille (`MARCHE_REGLES`), `lectureMarche()` |
| `lecture-marche-vue.js`, `marche.html`, `assets/lecture-marche.css` | L'affichage |
| `scripts/marche/sources.mjs` | Un lecteur par source, et le registre des modules de collecte |
| `scripts/marche/collecte.mjs` | L'orchestrateur : `node scripts/marche/collecte.mjs` (`--dry-run` pour ne rien écrire) |
| `data/marche/societes.json` | Ticker et CIK de chaque société — le catalogue du tracker n'en porte pas |
| `data/marche/instantane.json` | Le dernier relevé, lu par la page |
| `data/marche/historique/AAAA-MM-JJ.json` | Un instantané daté par jour de collecte, plus `index.json` |
| `data/marche/saisie-manuelle.json` | Donnée saisie à la main, source et date obligatoires : comble un champ n/d ou remplace une donnée collectée plus ancienne. Porte les actions de classe A de Centrus et SentinelOne, à relever à chaque rapport trimestriel |
| `.github/workflows/marche-collecte.yml` | Collecte du lundi au vendredi, 22h30 UTC |

## Forme d'une donnée

```json
{ "valeur": 45460649, "source": { "nom": "FINRA", "url": "https://…" }, "date": "2026-11-13" }
{ "valeur": null, "motif": "non balisé en un seul fait (plusieurs classes d’actions)" }
```

`date` est le jour **de la donnée** (date de règlement du relevé, séance du cours, clôture de la période comptable), pas celui de la collecte. Une valeur sans source ou sans date s'affiche « n/d ». Une donnée plus vieille que son âge maximal (`MARCHE_CONFIG.fraicheur`) est « périmée » : affichée, marquée, muette pour les règles — et l'étiquette devient « Lecture incomplète ».

## Ce que chaque source donne vraiment (vérifié les 25 et 26 novembre 2026)

Sondé sur les sept sociétés du tracker, et sur Eutelsat pour le cas non américain — le tracker n'en compte aucun.

| Source | Accès | Ce qu'on y lit | Ce qu'elle ne donne pas |
|---|---|---|---|
| **FINRA**, short interest consolidé | API publique, sans clé | Position courte, relevé précédent, jours de couverture, par date de règlement | Le flottant. Rien pour un titre non coté aux États-Unis (mais les lignes OTC d'un titre étranger y figurent) |
| **SEC**, API XBRL | Publique, sans clé | Chiffre d'affaires par période ; actions en circulation (page de garde) | Les actions en circulation des sociétés à plusieurs classes (Centrus, SentinelOne : fait ventilé, absent de l'API) |
| **Nasdaq**, API du site | **Non documentée** | Avis achat/conserver/vente sur 13 mois, objectifs de cours, BPA attendu, capitalisation, cours quotidiens | Tout titre hors États-Unis (« Symbol not exists »). Aucun consensus de chiffre d'affaires. Aucune liste d'upgrades/downgrades (champ toujours vide) |
| ~~Yahoo Finance / yfinance~~ | — | **Écartée** : HTTP 429 sur tous les points d'accès, avec ou sans cookie | — |
| Finnhub, offre gratuite | Clé dans les secrets GitHub, testée le 26 novembre 2026 depuis GitHub Actions | Avis mensuels (`/stock/recommendation`), surprises de BPA (`/stock/earnings`). **Non branchée** : sert de point de comparaison | Objectifs de cours, consensus de chiffre d'affaires et de BPA (403). BPA publié parfois faux (Centrus T3 2026 : −0,66 contre 1,41 à la SEC) |

### Limites à connaître avant de lire une ligne

- **La mesure est un « % des actions en circulation » de la classe cotée**, relevées en page de garde du dernier rapport trimestriel (SEC ; saisie manuelle pour Centrus et SentinelOne, dont le fait est ventilé par classe). Ce n'est pas un « % du flottant » : aucune source gratuite vérifiée ne publie le flottant, et la mesure retenue est donc plus basse que celle des sites financiers. Les seuils (8 % et 4 %) sont les repères d'usage abaissés d'un cinquième : une convention, pas une mesure. Les jours de couverture, qui ne dépendent d'aucun dénominateur, servent de second critère : « bas » les exige.
- **Le short interest a toujours du retard** : deux relevés par mois, publiés une dizaine de jours après la date de règlement.
- **Les deux comptages d'analystes de Nasdaq se contredisent.** Le point d'accès `ratings` annonce 3 analystes sur Centrus et 0 sur Oklo ; `targetprice` en compte 17 et 15. Seule la série mensuelle de `targetprice` est lue, pour ne pas fabriquer une tendance entre deux comptages.
- **Biais haussier structurel.** Six des sept sociétés ont entre 58 % et 91 % d'avis acheteurs (la septième, Agility Robotics, n'a qu'un analyste) ; aucune n'a plus d'un avis vendeur.
- **« Publié vs consensus » est n/d partout, et « Confirmation » ne peut pas encore s'afficher.** Le collecteur compare le chiffre publié (SEC, fait trimestriel balisé) au consensus du dernier instantané daté strictement avant la publication (date lue dans la fiche du tracker), s'il porte sur le même trimestre ; le moteur le refuse s'il a été relevé plus de `consensusAgeMax` jours avant. Seul le chiffre d'affaires est comparé (`grandeursPublie`) ; le BPA a été retiré le 26 novembre 2026, son consensus reste archivé. Aucun instantané ne précède encore une publication. **Aucune source gratuite ne donne le consensus de chiffre d'affaires** (`ca_trimestre` : n/d sauf saisie). Raison du retrait du BPA : le publié est le BPA dilué comptable alors que le consensus peut être ajusté. Un quatrième trimestre n'est pas balisé seul : n/d.
- **Nasdaq et Finnhub ne comptent pas les mêmes analystes** (comparaison du 26 novembre 2026). La part d'avis acheteurs concorde à 3 points près sur cinq sociétés (10 sur IonQ) ; le nombre d'analystes va du simple au double ; l'évolution sur trois mois diverge sur quatre sociétés sur six. Le niveau du consensus est robuste, son évolution ne l'est pas : elle est affichée « à titre indicatif » et n'entre plus dans aucune règle. Le décompte du jour (`attentes.avis_du_jour`) est archivé à chaque collecte pour calculer plus tard notre propre évolution, à source constante ; un futur seuil s'exprimerait en nombre d'analystes ayant changé d'avis. « Faible couverture » est calibrée sur le décompte du Nasdaq (3 analystes au plus).
- **L'API Nasdaq flanche** : 4 appels sur 25 sans réponse le jour du sondage. Le collecteur réessaie trois fois, puis écrit n/d avec le motif.
- **Cours non ajustés des dividendes**, et aucun contrôle de division du nominal : après un split, les performances à 6 et 12 mois seraient fausses jusqu'à ce que la source ajuste son historique.
- **Chiffre d'affaires des douze derniers mois : dérivé, pas estimé.** Dernier exercice + cumul en cours − même cumul un an plus tôt ; les trois montants balisés sont conservés dans `detail`. S'il en manque un, n/d.
- **Une alerte ancienne est croisée avec le marché d'aujourd'hui.** La Bascule de Rocket Lab date d'août 2025 : la page le signale, sans changer l'étiquette.

## La grille

Une société reçoit **une** étiquette, toujours avec ses raisons. Pour une alerte donnée, les règles de `MARCHE_REGLES` sont essayées dans l'ordre ; la première vraie l'emporte.

| Alerte du tracker | Lecture de marché | Étiquette |
|---|---|---|
| Signal faible | Quelle que soit la lecture | À surveiller |
| Bascule, Bascule commerciale, Rechute | Donnée indispensable manquante ou périmée | Lecture incomplète |
| Bascule | Short interest élevé **et** en hausse | Contesté |
| Bascule | Consensus très haussier, multiple élevé **et** forte hausse | Déjà dans le cours ? |
| Bascule | Beat net sur un consensus daté d'avant la publication | Confirmation |
| Bascule | Multiple raisonnable **et** (consensus prudent ou faible couverture) **et** (short interest bas ou en baisse) | Asymétrie favorable |
| Rechute | Short interest en hausse | Pression renforcée |
| Rechute | Consensus encore très haussier | Risque de révisions |
| Bascule ou Rechute | Aucune ligne ne s'applique | Sans lecture tranchée |
| Aucune alerte | — | Sans alerte |

Choix pris par cette couche, faciles à défaire : la **Bascule commerciale** se lit sur les lignes « Bascule » (`grille.familles`) ; l'**alerte de référence** est la dernière émise, quelle que soit son ancienneté ; en **pré-revenus**, le multiple est sans objet et son absence ne rend pas la lecture incomplète ; les données **indispensables** sont la position courte, les avis d'analystes, le multiple (hors pré-revenus) et la performance du cours.

## Ajouter un module (le contexte de marché, par exemple)

1. Un collecteur et une entrée dans `MODULES` (`scripts/marche/sources.mjs`).
2. Un lecteur `marcheLire…()` et une entrée dans `MARCHE_MODULES` (`lecture-marche-modele.js`) — l'emplacement « contexte » y est déjà, avec `lire: null`.
3. Ses seuils dans `lecture-marche-config.js`, et, s'il doit peser, ses règles dans `MARCHE_REGLES`.

Les trois modules existants n'ont pas à changer ; la page ajoute la colonne d'elle-même. En V1, le contexte n'est qu'un bandeau commun (taux, pente, bilan de la Fed) lu dans `data/macro.json`, que `fetch-data.yml` collecte déjà.

## Si le tracker change

La référence `test/fixtures/marche/tracker-reference.json` se compare **par date de publication** : ajouter une publication ne casse rien. Elle ne se régénère (`node scripts/marche/figer-reference-tracker.mjs`) que si le tracker lui-même a été corrigé — jamais pour faire passer un test de la couche marché.
