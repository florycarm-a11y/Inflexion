# Delta computationnel — démonstration V2

Cette démonstration est isolée dans `delta-v2/`. Elle ne remplace aucune page du site et ne modifie ni `data-loader.js`, ni `api-client.js`, ni `supabase-client.js`, ni le pipeline `data/`.

## Encodage de l’arbre

Le SVG est unique, couvre toute la page et est régénéré depuis la structure JavaScript `scenarios[]`.

- L’épaisseur d’une branche vaut `1.25 + probabilité × 10` pixels. Les évaluations utilisées publient toutes une probabilité ; la confiance reste `null` lorsqu’elle n’existe pas dans la source.
- L’obscurité vient de la borne haute de l’horizon publié : jusqu’à 6 mois `#FF2D00`, jusqu’à 18 mois `#C42300`, jusqu’à 36 mois `#8A1800`, au-delà `#521000`.
- Les carrés matérialisent les bifurcations calculées. Les étiquettes mono répètent la probabilité et l’horizon : l’information ne dépend donc pas seulement de la couleur.
- Les liaisons sont des courbes de Bézier cubiques à tangentes contrôlées. Leur tension diminue avec la profondeur et l’espacement des cartes tient compte du nombre de feuilles de chaque sous-arbre.
- Les branches vertes `#3E5C3A` sont réservées aux instantanés de `data/semplice-history.json`. Elles ne sont pas mélangées à l’arbre prospectif.
- La confiance n’altère pas l’épaisseur : elle est affichée comme métadonnée afin de ne pas confondre confiance analytique et probabilité de trajectoire.

La topologie vient exclusivement des relations `parentId` / `enfants[]`. La position des cartes ne décide jamais quels scénarios sont liés.

Au pointeur, une branche ou un carré gagne 3 pixels et ouvre une infobulle. Au toucher, une cible invisible de 44 pixels autour du nœud terminal épingle l’infobulle ; un second toucher, un toucher extérieur ou Échap la ferme. Au clavier, les mêmes informations sont accessibles en donnant le focus à la carte correspondante. L’infobulle reprend le libellé, la probabilité, l’horizon, la confiance, le statut, le stade, les déclencheurs et le point de bascule ; tout champ absent vaut explicitement « non renseigné ». Les zones y ajoutent un profil en barres des huit dimensions réelles.

## Données utilisées

La démo charge directement :

- `data/semplice/evaluations-test-v2/ormuz-v2.json`
- `data/semplice/evaluations-test-v2/mer-de-chine-v2.json`
- `data/semplice/evaluations-test-v2/vietnam-v2.json`
- `data/semplice-history.json`
- `data/daily-briefing.json`
- `data/signals.json`
- `data/sentiment.json`

Un instantané embarqué reprend uniquement les champs affichés de ces fichiers. Il permet d’ouvrir la page sans serveur ; l’indicateur en haut précise alors qu’il ne s’agit pas des flux chargés depuis le dépôt.

En HTTP, chaque JSON réel est prioritaire. Le snapshot est appliqué uniquement au fichier dont le chargement échoue : ses champs ne sont jamais fusionnés dans un JSON chargé avec succès.

Les zones exposent également les huit scores dimensionnels réellement présents dans les évaluations. Les poids de base viennent de la méthodologie SEMPLICE v2.1 documentée dans `expertise.html` : M 16 %, E 15 %, P 14 %, S 12 %, I 12 %, C 11 %, Ee 10 %, L 10 %. Les dimensions signalées par `peakAmplification.dimensionsTrigger` sont indiquées dans l’infobulle. Les poids finaux après amplification ne sont pas affichés car ils ne sont pas sérialisés dans les évaluations actuelles.

## Schémas réels constatés

Les trois évaluations ont en commun `zone`, `meta`, les huit dimensions `S/E/M/P/L/I/C/Ee`, `composite`, `classification`, `opportunity`, `quadrant`, `resilience`, `velocite`, `scenarios`, `signatures` et `flags`.

| Évaluation | Conteneur de scénarios | Champs d’un scénario | Particularités |
| --- | --- | --- | --- |
| Ormuz | tableau, 4 entrées | `label`, `probabilite` numérique, `impact`, `horizon` | `peakAmplification`, `resilienceScore`, opportunité à plat |
| Mer de Chine | tableau, 4 entrées | `label`, `probabilite` numérique, `impact`, `horizon` | même schéma qu’Ormuz |
| Vietnam | objet `base/upside/downside` | `label`, `probability` en pourcentage texte, `description`, `horizon` | `compositeMethod`, `delta`, opportunité imbriquée ; pas de `peakAmplification` ni `resilienceScore` |

Dans les onze scénarios réels, aucun champ `id`, confiance, stade, déclencheur, point de bascule, `horizonMois` ou sous-scénario n’est publié. Le normaliseur crée des identifiants techniques pour le DOM ; ils ne constituent pas des identifiants analytiques de source.

`signals.json` contient une `watchlist[]` identifiée par `watchId`, mais `weak_signals[]` et `cross_signals[]` n’ont aucun identifiant. `daily-briefing.json` ne donne pas non plus d’identifiant à `signaux[]` ou `risk_radar[]`. La correspondance `zone.id = "ormuz"` / `watchlist.watchId = "ormuz"` relie une zone à un sujet de veille, jamais un scénario à un signal.

## Branchement futur sur SEMPLICE

Le normaliseur accepte les scénarios sous forme de tableau ou d’objet, les clés `probabilite` / `probability`, les nombres décimaux ou les pourcentages texte, ainsi que des `enfants` / `children` imbriqués. Il reconnaît aussi `confiance` / `confidence`, `declencheurs` / `triggers`, `stade` / `stade_materialisation` / `materializationStage` et `point_bascule` / `pointBascule` / `tippingPoint`.

Pour des évaluations SEMPLICE brutes, utiliser :

```js
window.InflexionDeltaV2.setEvaluations([ormuz, merDeChine, vietnam]);
```

`setEvaluations()` accepte une évaluation brute unique, un tableau, ou un objet indexé. Il réutilise `normalizeEvaluation()` puis relance le rendu. Pour une structure déjà normalisée avec `enfants[]`, l’API historique reste disponible :

```js
window.InflexionDeltaV2.setScenarios(scenarios);
```

Le SVG se recalcule au `resize`, après chargement des fontes et lors des changements de contenu observés. Toutes les cartes sont mesurées une fois par frame, puis le SVG est remplacé en une seule écriture. L’API `rebuild()` permet aussi de déclencher explicitement le calcul après une mise à jour asynchrone.

## Points restant à câbler

- Stabiliser le contrat de production de SEMPLICE au-delà des deux variantes actuellement normalisées.
- Ajouter un identifiant analytique stable aux scénarios et aux signaux, puis une relation explicite. Contrat minimal : `scenarioId`, `signalId` et `scenario.signalRefs[]`, ou une table `relations[]` contenant `{ scenarioId, signalId, relationType, sourceVersion }`. La résolution devra rester une jointure exacte par identifiant, sans repli sur les labels, titres, régions ou thèmes. Le connecteur reste désactivé tant que ce contrat est absent.
- Fournir un champ de stade de matérialisation par scénario. La démo rend déjà un, deux ou trois ticks pour « émergent », « en cours » et « matérialisé », uniquement lorsqu’un stade est présent dans la donnée.
- Sérialiser les poids contextuels finaux calculés après amplification de pic. L’infobulle expose actuellement les poids de base et les axes amplifiés, sans reconstituer un calcul absent du JSON.
- Sérialiser la confiance au niveau du scénario si elle doit coexister avec la probabilité. La stratégie retenue reste : probabilité = épaisseur, confiance = valeur mono dans la carte et l’infobulle.
