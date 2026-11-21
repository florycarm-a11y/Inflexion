# Schéma des données du tracker d'inflexions

Source de vérité du calcul : [`docs/tracker-methode.md`](../../docs/tracker-methode.md) — **v1.3 proposée le 19 novembre 2026, non figée**. Si ce fichier dit autre chose que la méthode, la méthode fait foi.

La validation exécutable est dans [`tracker-modele.js`](../../tracker-modele.js) (`validerCatalogue`, `validerFichierSociete`), couverte par `test/tracker-coquilles.test.mjs`. Ce document explique le schéma ; le validateur l'applique.

## Trois règles qui gouvernent tout le schéma

1. **Une valeur sans source ne s'affiche pas.** Tout champ porteur d'une valeur lue dans un document porte sa `source`. Un sens autre que `non-publie` sans source rend le fichier **invalide** — il n'est pas dégradé en silence vers « non publié ».
2. **Le solde, les alertes, le score et la phase sont calculés, jamais saisis.** Les clés `solde`, `alertes`, `score` et `phase` sont **interdites** dans une publication. Aucun moteur n'existe encore (v1.3 non validée, données d'entrée du backtest hors dépôt) : les pages affichent « non calculé » et « aucune alerte ».
3. **`non-publie` est l'absence constatée.** Elle se passe de source, ne compte pas dans le solde, et s'affiche toujours avec un mot — jamais par une teinte seule (`--rule-incomplete` est « un filet de renfort, jamais preuve unique »).

## Fichiers

| Fichier | Rôle |
|---|---|
| `entreprises.json` | Catalogue des sociétés suivies. Seul point d'entrée des pages. |
| `<id>.json` | Un par société : ses publications et ses événements commerciaux. |
| `_modele.json` | Gabarit d'un fichier société, vide et valide. Le préfixe `_` le sort du balayage des sociétés (même convention que `data/_meta.json`). |

Au 21 novembre 2026, `entreprises.json` est **vide** et aucun fichier société n'existe : le tracker est une coquille.

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
| `solde`, `alertes` | Dérivés des sens ; aucun moteur dans le dépôt tant que la v1.3 n'est pas validée |
| `score`, `phase`, notes de niveau (§9) | §9 le dit : rejouées sur les sept premiers cas seulement, poids « un choix raisonné, pas un réglage mesuré ». Un score affiché se lirait comme une note de qualité |
| Température du récit, liens de filière, badge de ventes à découvert | Prévus par la feuille de route, aucune règle validée. La température n'est pas définie dans la méthode et ne fait pas partie de la v1.3 |
| Cours de Bourse, presse, notes d'analystes | La méthode ne lit que des documents publiés par la société |
| Les cinq drapeaux éditoriaux (§10) | Saisie manuelle, session de contenu à part |
