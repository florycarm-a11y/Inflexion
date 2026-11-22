# Univers par règle — spatial, tirage du 31 janvier 2024

> **Publié le 22 novembre 2026, avant toute lecture de communiqué.**
> Ce document est l'enregistrement préalable du rejeu de la piste 1 (document de refondation
> « Inflexion 2.0 »). Il fixe l'univers, les exclusions et les règles de mesure **avant** que la
> moindre publication de ces sociétés ne soit lue. L'historique de git le date : toute modification
> ultérieure de la liste est visible, et invalide le rejeu si elle n'est pas motivée ici.

## Pourquoi ce rejeu

La section 12 de `tracker-methode.md` le reconnaît : les dix cas hors échantillon du backtest **ont été choisis en connaissant leur sort**, à parts égales entre succès et échecs. On connaît donc le **rappel** de la Bascule — elle apparaît chez les cinq succès — mais pas sa **précision** : quelle part des Bascules finit en succès. Dans la réalité, les échecs sont bien plus nombreux que les succès, et la Bascule est déjà apparue chez trois des cinq échecs.

Un univers que personne n'a choisi est le seul moyen de le savoir.

## La source

| | |
|---|---|
| Fonds | **Procure Space ETF (UFO)**, série du Procure ETF Trust II |
| Document | Dépôt **N-PORT**, accession `0001145549-24-018379` |
| Période de référence | **31 janvier 2024** |
| Lignes au dépôt | 33 |
| Témoin sectoriel | UFO lui-même, la société jugée en étant exclue |

**Pourquoi un N-PORT, et pourquoi cette date.** Un N-PORT est une pièce publique, datée et immuable : personne ne peut la retoucher après coup, et elle ne demande aucune source tierce. Surtout, la composition **au 31 janvier 2024 ne connaît pas la suite** : elle contient les sociétés qui ont coulé après cette date. Prendre la composition d'aujourd'hui ferait entrer le biais de survivance par la fenêtre, puisque les fonds purgent leurs morts.

**Pourquoi UFO et non ARKX.** Le protocole écrit le 21 novembre désignait ARKX. Son exécution l'a écarté pour deux raisons structurelles, constatées avant de regarder le moindre cours : la composition d'ARKX au 31 janvier 2024 porte Trimble, Teradyne, Synopsys, ANSYS, Deere, Amazon, Alphabet et Honeywell — un panier d'innovation large, dont une ligne à 5 % est **un autre ETF** — et ARKX est à **gestion discrétionnaire**, alors que le protocole exige une règle extérieure : le jugement d'un gérant reste un jugement. UFO suit un indice réglé.

**Pourquoi le 31 janvier et non le 31 décembre.** Les exercices des fonds ne suivent pas l'année civile : ARK et Procure clôturent au 31 janvier, 30 avril, 31 juillet et 31 octobre. **Aucun N-PORT n'existe au 31 décembre 2023.** Le tirage se fait à la période la plus proche de la date annoncée — 31 janvier 2024, à trente et un jours, contre soixante et un pour le 31 octobre 2023.

## Les filtres, et il n'y en a pas d'autres

1. Toute ligne pesant **1 % ou plus** de l'actif net au 31 janvier 2024 entre dans l'univers.
2. Sont écartées les sociétés qui ne déposent **ni 10-K ni 10-Q** : la méthode ne sait pas lire les régimes 20-F et 40-F, ni les sociétés sans dépôt SEC.
3. Sont écartées les sociétés **radiées ou acquises avant leur première publication de la période**.
4. Sont écartées les lignes qui **ne sont pas des sociétés d'exploitation** (autre fonds, instrument monétaire).

**Aucun filtre de « pureté de la thèse ».** Boeing, Comcast, Honeywell, Lockheed Martin, Northrop Grumman, RTX, L3Harris, Sirius XM, Garmin et Trimble restent dans l'univers bien que le spatial n'y soit qu'une division. Trois raisons : les écarter demanderait le jugement que le protocole bannit ; la section 2 de la méthode sait déjà lire un segment (« le segment qui porte le récit, hors activités annexes ») ; et surtout, **si la méthode produit des Bascules sur Comcast, c'est un résultat sur la méthode**, pas un défaut de l'univers. Le filtrer reviendrait à protéger la méthode de son propre test.

## L'univers : dix-huit sociétés

Dans l'ordre des poids du dépôt. Les publications lues seront celles déposées à partir du **1er février 2024**.

| # | Société | Poids au 31/01/2024 | CIK |
|---:|---|---:|---|
| 1 | EchoStar Corp | 8,391 % | 0001415404 |
| 2 | Trimble Inc | 5,280 % | 0000864749 |
| 3 | Globalstar Inc | 5,249 % | 0001366868 |
| 4 | Sirius XM Holdings Inc | 5,245 % | 0000908937 |
| 5 | Rocket Lab | 5,008 % | 0001819994 |
| 6 | Garmin Ltd | 4,662 % | 0001121788 |
| 7 | Viasat Inc | 4,611 % | 0000797721 |
| 8 | Iridium Communications Inc | 4,426 % | 0001418819 |
| 9 | Virgin Galactic Holdings Inc | 3,874 % | 0001706946 |
| 10 | RTX Corp | 2,713 % | 0000101829 |
| 11 | Comcast Corp | 2,678 % | 0001166691 |
| 12 | Planet Labs PBC | 2,642 % | 0001836833 |
| 13 | L3Harris Technologies Inc | 2,571 % | 0000202058 |
| 14 | Honeywell International Inc | 2,381 % | 0000773840 |
| 15 | Lockheed Martin Corp | 2,332 % | 0000936468 |
| 16 | Northrop Grumman Corp | 2,271 % | 0001133421 |
| 17 | Boeing Co | 2,158 % | 0000012927 |
| 18 | AST SpaceMobile Inc | 1,605 % | 0001780312 |

**Rocket Lab appartient à cet univers et figure déjà dans le tracker public.** Elle y est entrée le 21 novembre 2026, avant que cet univers ne soit tiré. Sa fiche publique reste ; mais la règle d'hygiène vaut pour les dix-sept autres : **aucune ne sera publiée avant la fin du rejeu**. Rocket Lab est aussi l'un des dix cas hors échantillon du backtest — son verdict y est noté « provisoire ».

## Les exclusions, nommées

### Écartées par le régime de dépôt (filtre 2) — 8 sociétés

| Société | Poids | Motif |
|---|---:|---|
| SES SA | 5,184 % | Aucun dépôt SEC (Luxembourg) |
| SKY Perfect JSAT Holdings Inc | 5,117 % | Régime étranger, aucun 10-K (Japon) |
| MDA Ltd | 4,758 % | Aucun dépôt SEC (Canada, cotée à Toronto) |
| Eutelsat Communications SACA | 3,994 % | Aucun dépôt SEC (France) |
| TomTom NV | 3,313 % | Aucun dépôt SEC (Pays-Bas) |
| Airbus SE | 2,239 % | Aucun dépôt SEC (Pays-Bas / France) |
| ispace Inc | 1,978 % | Aucun dépôt SEC (Japon) |
| Weathernews Inc | 1,360 % | Aucun dépôt SEC (Japon) |

### Écartées par le seuil de poids (filtre 1) — 7 lignes

Telesat Corp (0,838 %), Terran Orbital Corp (0,809 %), Comtech Telecommunications Corp (0,712 %), Ball Corp (0,672 %), Thales SA (0,406 %), First American Government Obligations Fund (0,279 %), Leonardo SpA (0,189 %).

La dernière ligne est un fonds monétaire : elle tombe aussi sous le filtre 4. **Terran Orbital a été acquise par Lockheed Martin en octobre 2024** — un cas que le rejeu aurait aimé lire, mais son poids est sous le seuil et le seuil a été fixé d'avance. La règle est la règle.

## Ce qui sera mesuré, et publié même si c'est mauvais

- La **précision** de la Bascule : part des Bascules suivies d'un succès.
- Le **rappel** : part des sociétés à succès ayant reçu une Bascule — la seule chose que le backtest actuel sait dire.
- Les deux mêmes mesures pour la **Rechute**, en sens inverse.
- Le nombre de sociétés de l'univers **qui n'ont reçu aucune alerte**, et ce qu'elles sont devenues.

**Le succès**, fixé d'avance : rendement total sur **12 mois à compter de la date de publication qui porte l'alerte**, supérieur à celui du S&P 500 **et** à celui du témoin sectoriel. Une alerte dont la fenêtre n'est pas close, ou dont les cours manquent, est « non mesurable » et comptée comme telle — jamais écartée en silence.

## Ce qui invaliderait ce rejeu

Avoir changé un filtre après avoir commencé à lire. Avoir pris la composition du fonds à une autre date que celle annoncée ici. Avoir écarté une société sans la nommer. Avoir publié la fiche d'une société de l'univers avant la fin du rejeu.

## Ce que ça coûte

Dix-huit sociétés, de huit à douze publications chacune entre février 2024 et novembre 2026 : **de cent cinquante à deux cents communiqués à lire à la main** — l'ordre de grandeur des 146 lignes du backtest actuel, pour un univers qui, lui, n'aura pas été choisi. Il n'y a pas de raccourci : la lecture des communiqués est le travail.
