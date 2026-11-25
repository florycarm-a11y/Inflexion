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
| `vsat.py` | Viasat, en cours | Extracteur dédié (voir plus bas) |

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

## État de `vsat.py` — lecture interrompue

Viasat, CIK 797721, exercice clos le 31 mars. Douze 8-K rubrique 2.02, un par trimestre, chacun
suivi du 10-Q ou du 10-K **un à huit jours plus tard** — précision 4 : le communiqué du jour fait
foi, le dépôt périodique ne sert que de valeur précédente.

**Acquis sur les douze lignes** : chiffre d'affaires total et son comparatif, coût des ventes
(somme des coûts de service et de produits) et son comparatif, résultat d'exploitation GAAP
(« Income (loss) from operations ») et son comparatif. Les comparatifs à 650 millions des deux
premières lignes sont corrects : l'acquisition d'Inmarsat a clos en mai 2023.

**Reste à relever** :
1. **Les commandes de cinq trimestres** (T1 FY2025, T3 FY2025, T2 FY2026, T4 FY2026, T1 FY2027).
   Viasat publie des « awards » par trimestre — la PREMIÈRE branche de §2, meilleure qu'un carnet —
   mais sa formulation change à chaque communiqué : « new contract awards in Q2 FY2027 decreased
   24% YoY to $1.1 billion », « $1.2 billion of awards during the quarter », « Awards for the
   quarter were $1.2 billion », ou, au T1 FY2025, **seulement par segment** (« Communication
   Services […] awards increased 60% YoY to $811 million » et 351 millions pour la défense, dont
   la somme vaut le total). Quatre motifs sont déjà encodés ; il en manque.
2. **La prévision annuelle.** Viasat ne guide pas son chiffre d'affaires en montant : elle annonce
   une croissance qualitative (« DAT mid-teens or better revenue growth ») et une cible de
   COMMANDES (« our current fiscal year 2027 plan anticipates about $2.0 billion of awards »).
   §5 accepte « la prévision annuelle qu'elle place en premier » — reste à trancher si une cible
   de commandes en relève, et à relever la série.

**Difficulté de précision, à traiter explicitement.** Les commandes sont tantôt au million
(par segment), tantôt arrondies au dixième de milliard. Un arrondi de ±50 millions sur un trimestre
de 1 180 millions déplace le ratio commandes/chiffre d'affaires de ±0,042, pour des seuils à ±0,05 :
**l'arrondi peut décider de l'alerte**. La règle retenue, déjà appliquée au « +13 % » de clients de
Planet Labs : un montant arrondi donne un **intervalle**, et le sens n'est publié que si tout
l'intervalle tombe dans une seule bande. Sinon, §3 — la lecture la plus neutre, « stable ».

## S'identifier auprès de la SEC — jamais dans le dépôt

La SEC demande aux clients automatisés un en-tête `User-Agent` qui les identifie. Les outils le
lisent dans la variable d'environnement `SEC_USER_AGENT` et retombent sur un nom générique
(`inflexion-rejeu/1.0`) si elle est absente. **Aucune adresse de contact ne s'écrit dans un
fichier suivi** : qui veut donner la sienne la règle dans son propre environnement, par exemple
`export SEC_USER_AGENT="Nom contact@exemple.org"` dans son terminal, avant de lancer la sonde.
