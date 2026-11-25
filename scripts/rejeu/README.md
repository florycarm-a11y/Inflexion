# Outillage de lecture du rejeu

Ces outils servent à **relever** ce que les dépôts SEC portent, pour alimenter
`scripts/tracker-rejeu-spatial.mjs`. Ils ne décident rien : aucun n'applique la méthode, aucun
n'écrit dans `data/`. Leur seul mérite est d'avoir permis de lire huit sociétés sans un seul appel
de lecture de modèle sur les communiqués.

| Outil | Usage | Ce qu'il donne |
|---|---|---|
| `sonde.mjs <CIK> [depuis]` | Première approche d'une société | Liste des dépôts (8-K 2.02 et périodiques), faits XBRL **groupés par dépôt** (précision 8), et les lignes de communiqué portant carnet, abonnés ou prévision |
| `tab.py '<motif>'` | Sur l'entrée standard | Les lignes de **tableau** : ne coupe qu'aux fins de ligne de tableau |
| `txt.py '<motif>'` | Sur l'entrée standard | Les lignes de **prose** : coupe aussi aux balises de bloc |
| `moteur.mjs <id>` | Après génération | Déroule le moteur §6 sur une fiche de `data/rejeu-spatial/` et valide le fichier |
| `vsat.py` | Viasat | Extracteur dédié des comptes (voir plus bas) |

## Pourquoi deux passes de texte

Les cellules de tableau des dépôts SEC contiennent des `<div>`. Couper aux balises de bloc casse
les lignes de tableau ; ne couper qu'aux fins de ligne colle la prose en un seul bloc. D'où
`tab.py` **et** `txt.py`. Certains rendus (Garmin, Viasat) vont plus loin et mettent **une valeur
par ligne** : il faut alors balayer les lignes suivant un libellé, en sautant les cellules vides
et celles qui ne portent qu'une parenthèse de signe.

## Pièges encodés dans ces outils

- **Espaces insécables à l'intérieur des nombres** (`$3,670\xa0million`) : normaliser `[^\S\t]`
  avant toute recherche, sinon aucune regex sur `\d+ million` ne trouve rien.
- **Groupement par dépôt, jamais par période** : une société qui retraite son historique
  (EchoStar le fait trois fois) n'a pas « une » valeur par trimestre. L'API `companyconcept` porte
  `accn` et `filed` ; `sonde.mjs` s'en sert.
- **L'annexe la plus volumineuse** est le communiqué. Chez Viasat, l'annexe 99.1 fait 6 ko et
  l'annexe 99.2 en fait 354 : c'est la seconde qui porte les comptes.
- **Le nom du fichier ne dit pas ce qu'il contient** : `siriq12026earningsrelease.htm` ne contient
  pas « ex99 ». Chercher aussi `release|press|earnings`, et résoudre par `index.json`.

## Viasat — lecture terminée, et ce qu'elle a appris à l'outillage

`vsat.py` relève chiffre d'affaires, coût des ventes et résultat d'exploitation des douze
communiqués. Les commandes et les prévisions ont été lues à part, et trois choses valent pour les
sociétés suivantes :

- **Chercher un graphique chiffré avant de se contenter de la prose.** Les lettres aux actionnaires
  portent des graphiques dont les valeurs survivent dans le texte (« AWARDS $ in millions $1,275
  $1,078 $1,170 $1,183 $1,498 Q2 FY25 … »). La prose arrondissait au dixième de milliard ; le
  graphique donnait le million.
- **Un graphique n'est exploitable que si l'ordre des valeurs est lisible.** Certains rendus
  mélangent trois séries dans le désordre : ne pas deviner, retomber sur la prose et traiter
  l'arrondi comme un intervalle (`sensCommandes` accepte `[basse, haute]`).
- **Une regex qui s'arrête au point coupe « $1.3 billion » en « $1 ».** Autoriser le point
  décimal dans le motif du montant.

## S'identifier auprès de la SEC — jamais dans le dépôt

La SEC demande aux clients automatisés un en-tête `User-Agent` qui les identifie. Les outils le
lisent dans la variable d'environnement `SEC_USER_AGENT` et retombent sur un nom générique
(`lecteur-depots/1.0`) si elle est absente. **Aucune adresse de contact ne s'écrit dans un
fichier suivi** : qui veut donner la sienne la règle dans son propre environnement, par exemple
`export SEC_USER_AGENT="Nom contact@exemple.org"` dans son terminal, avant de lancer la sonde.
