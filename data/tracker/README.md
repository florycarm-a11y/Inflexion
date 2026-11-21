# Schéma des données du tracker d'inflexions

Source de vérité du calcul : [`docs/tracker-methode.md`](../../docs/tracker-methode.md) — **v1.3 figée le 21 novembre 2026**. Si ce fichier dit autre chose que la méthode, la méthode fait foi.

La validation exécutable est dans [`tracker-modele.js`](../../tracker-modele.js) (`validerCatalogue`, `validerFichierSociete`), couverte par `test/tracker-coquilles.test.mjs`. Ce document explique le schéma ; le validateur l'applique.

## Trois règles qui gouvernent tout le schéma

1. **Une valeur sans source ne s'affiche pas.** Tout champ porteur d'une valeur lue dans un document porte sa `source`. Un sens autre que `non-publie` sans source rend le fichier **invalide** — il n'est pas dégradé en silence vers « non publié ».
2. **Le solde, les alertes, le score et la phase sont calculés, jamais saisis.** Les clés `solde`, `alertes`, `score` et `phase` sont **interdites** dans une publication. Le moteur (`moteurAlertes`/`moteurDepuisFichier` dans `tracker-modele.js`, pseudo-code §6 faisant foi) les calcule à l'affichage, vérifié contre les trois suites de référence de §13 (`test/tracker-moteur.test.mjs`). Les données d'entrée du backtest restent hors dépôt.
3. **`non-publie` est l'absence constatée.** Elle se passe de source, ne compte pas dans le solde, et s'affiche toujours avec un mot — jamais par une teinte seule (`--rule-incomplete` est « un filet de renfort, jamais preuve unique »).

## Fichiers

| Fichier | Rôle |
|---|---|
| `entreprises.json` | Catalogue des sociétés suivies. Seul point d'entrée des pages. |
| `<id>.json` | Un par société : ses publications et ses événements commerciaux. |
| `_modele.json` | Gabarit d'un fichier société, vide et valide. Le préfixe `_` le sort du balayage des sociétés (même convention que `data/_meta.json`). |

## La collecte du 21 novembre 2026

Sept sociétés, sept thèmes, **35 publications** lues sur EDGAR. Les fichiers sont **engendrés** par [`scripts/tracker-collecte-2026-11-21.mjs`](../../scripts/tracker-collecte-2026-11-21.mjs), qui porte les montants bruts de chaque communiqué et calcule les sens devant vous : relancer le script reproduit les fichiers à l'identique (vérifié). Ne pas éditer les JSON à la main — corriger le script, puis le relancer.

| Société | Thème | Archétype | Publications | Ce que le moteur en tire |
|---|---|---|---|---|
| Centrus Energy | Uranium et cycle du combustible | industriel | 8 (T4 2024 → T3 2026) | Bascule T1 2025, **Rechute T4 2025**, Signal faible T1 2026 |
| Rocket Lab | Spatial | industriel | 7 (T1 2025 → T3 2026) | Bascule T2 2025, régime tenu six trimestres |
| IonQ | Quantique | industriel | 6 (T2 2025 → T3 2026) | Bascule T3 2025, régime tenu |
| Vertiv | Refroidissement liquide | industriel | 5 (T3 2025 → T3 2026) | Bascule T1 2026 |
| SentinelOne | Cybersécurité | **plateforme** | 5 (T2 FY2026 → T2 FY2027) | Bascule T3 FY2026 |
| Oklo | Petits réacteurs | pré-revenus | 4 (T4 2025 → T3 2026) | Aucune alerte (soldes nuls) |
| Agility Robotics | Robotique humanoïde | pré-revenus | 0 | Aucune publication relevée |

Les trois archétypes et les trois chemins de D2 (commandes/carnet, nombre de clients, barreau) sont désormais exercés.

### Ce que les documents imposent, société par société

- **Centrus ne ventile pas son segment LEU au quatrième trimestre** : D1 y est « non publié », et la ligne suivante perd sa valeur précédente. Deux `n.p.` d'affilée sur la dimension qui porte la thèse — ce que la société publie, pas un trou de collecte. Elle ne donne par ailleurs aucune prévision annuelle avant février 2026 : D3 reste muet sur quatre lignes.
- **Rocket Lab ne guide qu'un trimestre à la fois** : c'est la règle de §5 (milieu de la fourchette du trimestre suivant contre le chiffre d'affaires publié, seuil ±2 %) qui donne D3. Et son carnet n'apparaît dans les communiqués qu'à partir du quatrième trimestre 2025 : D2 est muet avant.
- **IonQ ne publie ses obligations de prestation restantes qu'épisodiquement** : D2 est « non publié » sur cinq lignes sur six.
- **Vertiv publie ses commandes en pourcentage de croissance, jamais en montant**, et son carnet par intermittence — ni dans ses communiqués de 2026, ni dans les 10-Q déposés le même jour (vérifié). D2 ne peut rien en faire après le quatrième trimestre 2025. C'est l'argument le plus net en faveur de la piste 4 du document de refondation (qualité du carnet).
- **SentinelOne ne publie ni commandes ni carnet** : l'indicateur de demande est donc le **nombre de clients à plus de 100 000 dollars d'ARR**, troisième chemin prévu par §2. Sa croissance passe de 23 % à 13 % en cinq trimestres — D2 y est trois fois en baisse pendant que le solde reste positif.
- **Oklo ne dépose plus de 8-K rubrique 2.02** : sa publication de résultats est le 10-Q (ou le 10-K) lui-même. Et ses seuls 8-K rubrique 1.01 sont des accords de distribution d'actions, pas des accords clients : §8 plafonne donc ses engagements (Switch, prépaiement Meta) au **barreau 2**, sous le seuil de la Bascule commerciale.
- **Agility Robotics** entre au catalogue sans publication : le 10-Q du 13 novembre 2026 couvre la SPAC d'avant fusion (clôture le 4 novembre 2026), pas Agility. Sa première publication en propre reste à venir.

### Une lecture à trancher

D1 dit « chiffre d'affaires **de la thèse** », D2 dit « chiffre d'affaires **du trimestre** » sans ce qualificatif : D2 est donc calculé ici sur le **chiffre d'affaires et le carnet totaux**, D1 sur le segment de la thèse. C'est la lecture littérale, appliquée uniformément — mais elle gagnerait à devenir une précision de la méthode.

## Objet `source`

Présent partout où une valeur est affirmée. Les trois champs sont obligatoires ; sans eux, la source ne prouve rien.

```json
{ "type": "8-K", "date": "2026-01-01", "url": "https://…" }
```

| Champ | Valeurs |
|---|---|
| `type` | `8-K`, `10-Q`, `10-K`, `communique`, `lettre-actionnaires`, `presentation` |
| `date` | Jour du document, `AAAA-MM-JJ` |
| `url` | Adresse du document d'origine |

Rappels de la méthode (§3) : un `10-Q`/`10-K` ne sert que s'il est déposé **au plus tard** le jour de la publication (précision 4) ; une `presentation` peut fournir un chiffre absent du texte mais **ne change pas à elle seule** un statut de prévision (précision 5).

## `entreprises.json`

```json
{
  "methode_version": "1.3",
  "methode_document": "docs/tracker-methode.md",
  "entreprises": []
}
```

Chaque entrée d'`entreprises` :

| Champ | Règle |
|---|---|
| `id` | Minuscules et tirets. Donne le nom du fichier société et l'URL `entreprise.html?id=…` |
| `nom` | Nom de la société |
| `recit` | Le récit porté (petits réacteurs nucléaires, IA, robotique…) |
| `archetype` | `pre-revenus`, `plateforme` ou `industriel` (méthode §2) |
| `ca_these` | `{ "valeur": "…", "source": {…} }` — le segment qui porte le récit ; à défaut, le chiffre d'affaires total ; pré-revenus : les unités livrées |
| `indicateur_demande` | `{ "type": …, "valeur": "…", "source": {…} }`. `type` parmi `commandes`, `carnet`, `clients`, `abonnes`, `barreau-reservations`, `non-publie`, **dans cet ordre de préférence**. Pour `non-publie`, ni `valeur` ni `source` |
| `entree_tracker` | Jour d'entrée dans le tracker, `AAAA-MM-JJ` |
| `fichier` | Doit valoir exactement `data/tracker/<id>.json` |

Ces paramètres sont **fixés avant de lire les chiffres de la société** et ne changent plus ensuite, même si un autre choix donnerait un meilleur résultat (méthode §2). Si la société cesse de publier son indicateur de demande, `type` passe à `non-publie` et on ne le remplace pas.

## `<id>.json`

```json
{
  "entreprise": null,
  "methode_version": "1.3",
  "publications": [],
  "evenements_commerciaux": []
}
```

`entreprise` reprend l'`id` du catalogue. `null` est réservé au gabarit `_modele.json`.

### Une entrée de `publications`

Une ligne par publication de résultats trimestriels, datée du jour de la publication (aux États-Unis, le 8-K rubrique 2.02). **Une pré-annonce ne crée pas de ligne** (précision 2) : ce qu'elle annonce se lit à la publication suivante.

| Champ | Règle |
|---|---|
| `date` | Jour de la publication, `AAAA-MM-JJ` |
| `trimestre` | Trimestre publié, tel que la société le nomme |
| `source` | Le document de résultats lui-même |
| `dimensions` | Exactement les quatre clés `d1`, `d2`, `d3`, `d4`. Aucune autre |
| `statut_prevision` | `relevee`, `abaissee`, `manquee`, `maintenue`, `nouvelle` ou `non-publie` (méthode §5) |
| `marge_brute` | `{ "etat": …, "source": {…} }` |
| `financement` | `{ "couleur": …, "motifs": […], "source": {…} }` |
| `drapeaux` | Tableau, possiblement vide |

**`dimensions.d1` … `d4`** : `{ "sens": …, "source": {…} }`, `sens` parmi `hausse`, `stable`, `baisse`, `non-publie`. La `source` est obligatoire sauf pour `non-publie`.

**`statut_prevision` doit s'accorder avec `dimensions.d3.sens`** — le validateur le vérifie : `relevee` → `hausse` ; `abaissee` et `manquee` → `baisse` ; `maintenue` et `nouvelle` → `stable` ; `non-publie` → `non-publie`. La révision prime : on ne teste `manquee` que si la prévision annuelle n'a pas bougé.

**`marge_brute.etat`** : `positive`, `nulle`, `negative`, `non-calculable` ou `sans-objet`. C'est le garde-fou des Bascules (méthode §6) : tant que la marge brute n'est pas positive, pas de Bascule, et la ligne porte le drapeau `vend-a-perte`. `non-calculable` suit la précision 1 (chiffre d'affaires nul ou négatif, ou perte opérationnelle supérieure à cent fois ce chiffre d'affaires) ; `sans-objet` quand la société ne présente aucune ligne de coût des ventes. Ces deux états se passent de source : ils constatent une absence.

**`financement.couleur`** : `vert`, `orange`, `rouge` ou `non-determinee`. La condition de financement (méthode §7) s'affiche à côté de chaque ligne et **n'entre pas dans le solde** : elle ne déclenche ni ne bloque aucune alerte. `non-determinee` est la valeur par défaut, y compris quand une seule mesure manque — **jamais `vert` par défaut**. `motifs` : sous-ensemble de `autonomie`, `dilution`, `engagements`, noté à côté de la couleur. Une couleur affirmée exige sa source.

**`drapeaux[]`** : `{ "code": …, "source": {…} }`, `code` parmi les trois drapeaux que la méthode produit (§10) :

| Code | Origine |
|---|---|
| `vend-a-perte` | Garde-fou de marge brute (§6) |
| `remuneration-actions` | Garde-fou de D4 : marge GAAP en baisse, marge avant rémunération en actions en hausse |
| `hesitation` | Deux lectures possibles ; la plus neutre a été retenue |

Les **cinq drapeaux éditoriaux** de §10 (revenus hors thèse, trésorerie sans traction, concentration des clients, dépendance à une décision publique, banalisation de la technologie) se saisissent à la main et **ne sont pas dans ce schéma** : ils attendent une session de contenu.

### Une entrée de `evenements_commerciaux`

L'échelle d'engagement (méthode §8) sert à D2 pour les pré-revenus.

| Champ | Règle |
|---|---|
| `date` | `AAAA-MM-JJ` |
| `barreau` | Entier de 0 à 5 |
| `intitule` | L'événement, en clair |
| `source` | Obligatoire : « le classement d'un événement est fait à la main, avec sa source » |

| Barreau | Définition |
|---|---|
| 0 | Annonce — partenariat ou « collaboration », sans chiffre ni obligation |
| 1 | Intention — protocole d'accord ou lettre d'intention, non contraignants |
| 2 | Accord-cadre — volumes ou prix indicatifs, sélection comme fournisseur |
| 3 | Accord définitif sous conditions — signé mais suspendu ; prépaiement ; réservations avec acompte |
| 4 | Contrat ferme — obligation d'achat ou paiement engagé |
| 5 | Revenu récurrent — chiffre d'affaires reconnu, lié à la thèse, chez plusieurs clients |

Par défaut, une annonce sans dépôt d'un 8-K rubrique 1.01 **ne dépasse pas le barreau 2**.

## Ce que le schéma ne couvre pas, et pourquoi

| Absent | Raison |
|---|---|
| `solde`, `alertes` | Dérivés des sens par le moteur §6 à l'affichage — jamais stockés dans les fichiers |
| `score`, `phase`, notes de niveau (§9) | §9 le dit : rejouées sur les sept premiers cas seulement, poids « un choix raisonné, pas un réglage mesuré ». Un score affiché se lirait comme une note de qualité |
| Température du récit, liens de filière, badge de ventes à découvert | Prévus par la feuille de route, aucune règle validée. La température n'est pas définie dans la méthode et ne fait pas partie de la v1.3 |
| Cours de Bourse, presse, notes d'analystes | La méthode ne lit que des documents publiés par la société |
| Les cinq drapeaux éditoriaux (§10) | Saisie manuelle, session de contenu à part |
