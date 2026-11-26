# Carnet de bord

**À lire avant de travailler, et à compléter en fin de session.**

Ce fichier porte ce qu'aucun autre ne dit : les décisions qui **engagent les sessions suivantes**, l'état réel des branches, le travail laissé en cours, et les pièges déjà payés. Il ne double pas le dépôt — le code dit ce que le code fait, `git log` dit ce qui a changé, `CLAUDE.md` dit comment le projet est bâti. Le carnet dit **pourquoi on ne revient pas en arrière**.

### Ce qui va dans une entrée

Une décision qui contraint la suite · une règle d'hygiène engagée · l'état d'une branche non fusionnée · un travail interrompu et son point de reprise · un piège qui a coûté du temps · un constat à verser à un bilan ultérieur.

### Ce qui n'y va pas

Le détail de ce qui a été codé (c'est `git log`), la structure du dépôt (c'est `CLAUDE.md`), une référence stable (c'est `docs/`), ce qui n'a compté que pendant la conversation.

### Forme

Entrées **les plus récentes en premier**. Titre = dates réelles de la session. Les dates sont absolues, jamais « hier » ni « la semaine dernière ».

---

## 2026-11-26 — Lecture de marché : essai depuis GitHub, dénominateur, publié vs consensus

**Branche `feat/lecture-marche` POUSSÉE sur `origin` (pas `main`), non fusionnée, sans PR.** Décisions de Flo du 26 novembre, appliquées dans l'ordre 3A, 2A, 1A.

### Décisions qui engagent

- **La mesure s'appelle « % des actions en circulation », jamais « % du flottant »**, sur la page comme dans la méthode (testé). Dénominateur : la seule classe cotée, page de garde du dernier rapport trimestriel, sourcée, datée, périmée à 200 jours comme le reste.
- **Seuils du short interest recalibrés : 8 % et 4 %** (les repères 10 % et 5 % du flottant, abaissés d'un cinquième). C'est une convention écrite en commentaire, pas une mesure. **« Bas » exige des jours de couverture bas** ; un pourcentage bas ne suffit jamais seul, puisqu'il minore la réalité.
- **Publié vs consensus : uniquement à partir de nos instantanés** (pas de table de surprises d'un fournisseur). Consensus = dernier instantané daté strictement avant la publication, relevé au plus `consensusAgeMax` jours (7) avant elle, sinon n/d. Chiffre d'affaires d'abord, BPA ensuite (`grandeursPublie`). La date de publication est LUE dans la fiche du tracker.
- **La saisie manuelle remplace aussi une donnée collectée plus ancienne qu'elle**, jamais une plus récente. Un consensus de chiffre d'affaires n'entre que par saisie sourcée et datée, au cas par cas.
- **Le BPA est retiré de la comparaison** (`grandeursPublie: ['CA']`) ; son consensus reste archivé chaque jour.
- **L'évolution du consensus n'entre plus dans aucune règle.** « Pression renforcée » repose sur la seule hausse du short interest. L'évolution reste affichée avec la mention « indicatif, non utilisé dans l'étiquette », et n'est plus exposée dans les signaux du module. Si elle revient un jour : seuil en **nombre d'analystes ayant changé d'avis**, pas en points, calculé sur `attentes.avis_du_jour`, archivé chaque jour depuis le 26 novembre.
- **« Faible couverture » : 3 analystes au plus**, sur le décompte du Nasdaq (le repère de 5 valait pour des décomptes larges). Seule Agility Robotics l'est aujourd'hui.
- **Finnhub n'a aucun rôle dans la V1** : il n'a jamais été branché sur la collecte, seulement interrogé pour la comparaison.
- **Flo fusionne lui-même**, après avoir vu la page. PR ouverte, non fusionnée.

### Sources — ce qui a été vérifié, pour ne pas le refaire

- **FINRA, SEC et Nasdaq répondent depuis GitHub Actions** (essai à blanc du 26 novembre, mêmes résultats qu'en local : 20, 11 et 53 valeurs).
- **Finnhub, offre gratuite, testée depuis GitHub Actions** : `/stock/recommendation` et `/stock/earnings` répondent ; `/stock/price-target`, `/stock/revenue-estimate` et `/stock/eps-estimate` répondent **403**. Rien pour Agility Robotics.
- **Aucune source gratuite de consensus de chiffre d'affaires** : ni Nasdaq (aucun point d'accès), ni Finnhub (403). Le champ `ca_trimestre` existe, il est n/d sauf saisie.
- **Nasdaq contre Finnhub, avis d'analystes** : le NIVEAU concorde (part d'avis acheteurs à 3 points près sur cinq sociétés, 10 points sur IonQ), le NOMBRE d'analystes non (Finnhub en compte 1,4 à 2,3 fois plus), et **l'ÉVOLUTION sur trois mois diverge sur quatre sociétés sur six** (Oklo : +13 points chez Nasdaq, −2 chez Finnhub ; Vertiv : −7 contre 0). Le signal « évolution du consensus » est donc fragile.
- **Le BPA publié de Centrus au T3 2026 est bien 1,41 $ dilué** (SEC), comme chez Nasdaq. Finnhub affiche −0,66 : faux. Les deux consensus concordent en revanche (−0,36 et −0,39) : l'écart de 491 % est réel en comptable, et vient d'une base différente entre consensus et publié. SentinelOne : Nasdaq compare en comptable (−0,18), Finnhub en ajusté (+0,08).

### Pièges déjà payés

- **`dei/EntityCommonStockSharesOutstanding` rend pour Centrus un chiffre de 2022**, pas un 404 : une saisie qui ne comblerait que les n/d ne le corrigeait pas.
- **Un workflow poussé sur une branche ne se lance à la main que s'il existe sur la branche par défaut.** Pour un essai, un fichier séparé déclenché par `push` sur la branche, en `contents: read`, puis supprimé.
- **Le fait trimestriel de la SEC n'existe pas pour un quatrième trimestre** (seul l'exercice est balisé), et le rapport peut être déposé après le communiqué : dans les deux cas « publié vs consensus » est n/d, rien n'est reconstitué.

### Reste à faire

- **Fusionner pour que la collecte quotidienne tourne** : sans elle, aucun instantané ne précédera les prochaines publications, et « Confirmation » ne pourra jamais s'afficher.
- Relever les actions de classe A de Centrus et SentinelOne à chaque rapport trimestriel (`data/marche/saisie-manuelle.json`), sinon la donnée se périme et la ligne passe en « Lecture incomplète ».
- **Le décompte du jour du Nasdaq diffère parfois de sa série mensuelle** (26 novembre : Vertiv 14/3/1 contre 14/1/1, Agility 2/1/0 contre 0/1/0). Les règles lisent la série mensuelle ; à trancher quand l'archive quotidienne aura quelques semaines.
- Après fusion : les commits de données du workflow n'entraînent PAS de déploiement à eux seuls (jeton `GITHUB_TOKEN`) ; la page publie les données au déploiement suivant, déclenché par le pipeline de 06h et 18h UTC.

---

## 2026-11-25 — Couche « lecture de marché », à côté du tracker

**Branche `feat/lecture-marche`, depuis `main` (`3cc90137`), NON POUSSÉE, non fusionnée.** Worktree : `.claude/worktrees/lecture-marche`. Le rejeu spatial reste à 11 sociétés sur 18 : cette session ne l'a pas touché.

### Décisions qui engagent

- **Le flux est à sens unique, et c'est la structure qui le tient.** La couche marché appelle `moteurDepuisFichier` et lit sa sortie ; aucun de ses fichiers n'écrit dans `data/tracker/`, et aucun fichier du tracker ne la mentionne. `test/marche-etancheite.test.mjs` le vérifie, dont une référence des soldes et alertes figée **avant** le premier changement (`test/fixtures/marche/tracker-reference.json`). Cette référence ne se régénère que si le tracker lui-même est corrigé.
- **Rien de calculé n'est stocké, là non plus.** `data/marche/instantane.json` ne porte que des valeurs brutes sourcées et datées ; P/S, tendances, fraîcheur et étiquette se dérivent à l'affichage. Le test refuse les clés `etiquette`, `solde`, `alertes` dans l'instantané.
- **La couche marché est hors du protocole de test et hors du rejeu.** Elle ne lit que le catalogue public : aucune société de l'univers spatial n'y entre avant la fin du rejeu, par construction. Ne jamais citer une étiquette de lecture dans le bilan du rejeu.
- **Tous les seuils dans `lecture-marche-config.js`**, hypothèses de départ non backtestées. La logique n'en répète aucun (testé).
- **« Publié vs consensus » reste n/d tant que nos propres instantanés ne couvrent pas une publication.** La table de surprises de Nasdaq existe mais n'est pas lue : BPA seulement, consensus non daté.

### Sources — ce qui a été vérifié, pour ne pas le refaire

- **Yahoo Finance / yfinance : HTTP 429 partout**, avec ou sans cookie. Écartée.
- **FINRA** (`api.finra.org/data/group/otcMarket/name/consolidatedShortInterest`) : publique, sans clé, POST. **Le tri est refusé** sans filtre d'égalité sur `settlementDate` : filtrer par plage de dates et trier soi-même.
- **API de nasdaq.com** : non documentée, exige un en-tête de navigateur, **4 appels sur 25 sans réponse**. Ses deux comptages d'analystes se contredisent (`ratings` : 3 sur Centrus, 0 sur Oklo ; `targetprice` : 17 et 15) — ne lire que la série mensuelle de `targetprice`.
- **SEC XBRL** : `dei/EntityCommonStockSharesOutstanding` est **absent (404) ou vieux de quatre ans** pour les sociétés à plusieurs classes d'actions (SentinelOne, Centrus). Le pourcentage de short interest y est donc n/d ; les jours de couverture portent le niveau.
- **Finnhub non vérifiée** : la clé n'existe que dans les secrets GitHub.

### Pièges déjà payés

- **Une règle « 2 constats sur 3 » a étiqueté « Déjà dans le cours ? » un titre à −66 % en six mois** (Rocket Lab). La grille de départ écrit les trois constats ensemble : réglage ramené à 3, et le cas est un test.
- **Une alerte ancienne se croise avec le marché d'aujourd'hui.** La Bascule de Rocket Lab a cinq publications. La page le signale ligne par ligne ; aucune règle ne périme l'alerte — question ouverte pour la V2.
- **`test/pages-header.test.mjs` compte les pages legacy** : toute nouvelle page à `nav-shared.js` oblige à relever le compte (19 depuis `marche.html`).

### Reste à faire

- Flo doit **relire la grille et les seuils** : ce sont ses hypothèses, transcrites.
- Le workflow `marche-collecte.yml` n'agit qu'une fois dans `main`. À vérifier alors : FINRA et Nasdaq répondent-ils depuis les adresses de GitHub Actions ?
- V2 : publié vs consensus à partir de l'historique ; flottant ; ancienneté de l'alerte ; Finnhub en second fournisseur.

---

## 2026-11-21 → 2026-11-23 — Tracker d’inflexions : pivot, méthode figée, moteur, rejeu

**`feat/rejeu-spatial-lot1` FUSIONNÉE dans `main` le 2026-11-24** — PR #166, merge `2a0f5c43`. Le lot de huit sociétés, l'outillage de méthode et ce carnet sont dans `main`. Branche en cours depuis : **`feat/rejeu-spatial-lot2`** (fusionnée le 2026-11-25, PR #167 : `methode.html` refaite, Viasat, outillage `scripts/rejeu/`), puis **`feat/rejeu-spatial-lot3`** depuis Iridium.

### Décisions qui engagent

- **Le tracker d'inflexions est ce que le site est**, pas une rubrique. Décidé par Flo le 2026-11-21, exécuté (PR #160) : `index.html` refondu autour du tracker, nav resserrée Tracker · Méthode · Expertise · Services, `tracker.html` réduit à une redirection.
- **La méthode est figée en v1.3 depuis le 2026-11-21** (`docs/tracker-methode.md`). Elle ne se modifie pas pour accommoder un cas rencontré — et **surtout pas pendant un rejeu**, ce qui l'invaliderait. Les constats vont au bilan, pas dans le texte.
- **Le solde et les alertes sont calculés à l'affichage, jamais saisis.** Le validateur refuse les clés `solde`, `alertes`, `score`, `phase` dans une publication. Moteur : `moteurAlertes` dans `tracker-modele.js`, transcription littérale du pseudo-code §6.
- **La production automatique de contenus IA est arrêtée** (PR #159) : plus de briefing, d'article du jour, de newsletter ni de Routines. Les JSON de contenu sont **figés** — ne jamais les présenter comme frais. Seul `fetch-data.yml` survit (données de marché, zéro token Anthropic). Les anciennes Routines claude.ai doivent rester désactivées.
- **Corriger le script, jamais les JSON.** `data/tracker/` est engendré par `scripts/tracker-collecte-2026-11-21.mjs` à partir des montants bruts, reproductible à l'empreinte près. Toute retouche directe d'un JSON est une régression.
- **Une valeur sans source ne s'affiche pas.** Règle éditoriale du tracker, vérifiée par les tests.

### Règle d'hygiène engagée — le rejeu

`docs/tracker-univers-spatial.md` est l'**enregistrement préalable** d'un rejeu : univers, filtres et règles de mesure publiés **avant toute lecture**, datés par git. Source : N-PORT du Procure Space ETF (UFO), période du **31 janvier 2024** → **18 sociétés**, 15 exclusions nommées.

> **Aucune société de cet univers n'entre dans le tracker public avant la fin du rejeu.** Seule exception, inscrite au protocole : Rocket Lab, entrée la veille du tirage. Les fiches du rejeu vivent dans `data/rejeu-spatial/` avec `publie: false` ; le site ne lit pas ce dossier.

Ce qui invaliderait le rejeu, et donc ce qu'il ne faut pas faire : changer un filtre après avoir commencé à lire · prendre la composition du fonds à une autre date · écarter une société sans la nommer · publier la fiche d'une société de l'univers avant la fin.

### Travail en cours, et son point de reprise

**11 sociétés lues sur 18, 130 publications.** Engendrées par `scripts/tracker-rejeu-spatial.mjs`.

| Société | Poids | Archétype | Lignes | Résultat |
|---|---:|---|---:|---|
| EchoStar | 8,391 % | plateforme | 12 | 2 Signaux faibles, aucune Bascule |
| Trimble | 5,280 % | plateforme | 12 | Rechute, Signal faible, Bascule, Rechute |
| Globalstar | 5,249 % | plateforme | 12 | 6 alertes, 5 changements de régime |
| Sirius XM | 5,245 % | plateforme | 12 | Rechute (T3 2024), Bascule (T3 2025) |
| Garmin | 4,662 % | industriel | 12 | 2 Bascules (T1 2024, T2 2025) |
| Viasat | 4,611 % | plateforme | 12 | 1 Bascule (2025-02-06) |
| Iridium | 4,426 % | plateforme | 12 | Rechute (2025-02-13), Signal faible (2026-04-23) |
| RTX | 2,713 % | industriel | 11 | Bascule (2024-10-22), Rechute (2025-01-28), Bascule (2025-07-22) |
| Virgin Galactic | 3,874 % | pré-revenus | 12 | aucune alerte |
| Planet Labs | 2,642 % | plateforme | 11 | 1 Bascule (2025-06-04) |
| AST SpaceMobile | 1,605 % | pré-revenus | 12 | Bascule (T4 2025) + **Bascule commerciale** (T1 2026) |

**Lecture dans l'ordre des poids du dépôt** — aucune règle ne l'impose, mais l'ordre publié met la lecture à l'abri de tout soupçon de tri. **Reste 6 sociétés** : Comcast, L3Harris, Honeywell, Lockheed Martin, Northrop Grumman, Boeing.

**CADENCE RÉELLE, mesurée sur huit sociétés : une demi-session à une session par société.** Le travail n'est pas la lecture des chiffres — le balisage XBRL et deux passes de texte les donnent presque gratuitement — mais trois choses qui ne s'automatisent pas : fixer les paramètres de §2 (archétype, CA de la thèse, indicateur de demande) en justifiant ce qu'on écarte ; retrouver la formulation propre à chaque société, qui change d'un trimestre à l'autre chez la même ; et trancher les cas de précision 3 et 4. Annoncer les neuf restantes en une session serait reproduire l'erreur de lecture rapide que la relecture d'AST a mise au jour. Rocket Lab compte comme lue (sa fiche publique porte sa série). Ordre de grandeur annoncé au protocole : 150 à 200 communiqués en tout.

**Outillage rodé, dans le bac à sable de session** : `sonde.mjs <CIK>` (dépôts, faits XBRL groupés par dépôt, lignes de communiqué portant carnet/abonnés/prévision), `tab.py` et `txt.py` (les deux passes d'extraction), un extracteur par société, `moteur.mjs <id>` pour dérouler le moteur sur une fiche. Les huit premières sociétés ont été lues **sans aucun appel de lecture de modèle sur les communiqués**. S'il a disparu, le réécrire à partir de cette entrée : le gain est considérable.

Le bilan du rejeu — précision et rappel de la Bascule et de la Rechute, sociétés sans aucune alerte — ne s'écrit **qu'à la fin**, et se publie même s'il est mauvais.

### Pièges déjà payés

- **Précision 8 : grouper les faits XBRL par DÉPÔT, jamais par période.** Chez une société qui retraite son historique (EchoStar en retraite trois fois), prendre « la dernière valeur connue » d'un trimestre revient à lire une base de données au lieu des comptes. L'API `companyconcept` porte `accn` et `filed` : s'en servir.
- **Les communiqués impriment par endroits la perte AVANT IMPÔT** là où D4 exige la perte d'exploitation (AST SpaceMobile, Globalstar). Reconstituer par `CA − total des charges d'exploitation` balisés dans le 10-Q du jour, et **contrôler la dérivation** contre un montant imprimé ailleurs.
- **Travailler au millier exact, jamais au million arrondi.** Quatre lignes du rejeu franchissent le seuil d'un point à moins de 0,05 près.
- **ARRONDI PAR LA SOCIÉTÉ ≠ MONTANT ÉCARTABLE.** La précision 3 interdit d'ARRONDIR soi-même ; elle n'autorise pas à jeter un montant que la société publie arrondi. Le carnet de Trimble (« approximately $1.7 billion ») avait été écarté à ce titre : à tort. Le bon réflexe est de calculer, puis de vérifier si l'arrondi décide d'une alerte — chez Trimble il n'en décidait aucune. À distinguer du cas « over $900 Million » ci-dessous, où aucun montant n'est donné, seulement une borne.
- **Un montant imprimé « over $900 Million » est non publié** (Planet Labs, carnet au 31/01/2026) : la précision 3 interdit l'arrondi intermédiaire dans une variation.
- **UN RÉSUMÉ N'EST PAS UNE LECTURE, ET UN NOM DE FICHIER N'EST PAS UN CLASSEMENT.** Relire AST SpaceMobile au mécanique a déplacé sa Bascule de trois trimestres : un résumé avait attribué au T2 2026 trois lancements que le communiqué qualifie de « recent » au 10 août, soit après la clôture du 30 juin, sans répartir les six satellites concernés. Et quatre des huit 8-K rubrique 1.01 avaient été classés d'après leurs annexes (1.1 et 5.1 = placement d'actions) sans être ouverts — classement juste au fond, faux sur l'un des quatre. Là où une alerte se joue, ouvrir la pièce.
- **Une date de lancement POSTÉRIEURE à la clôture fixe le compte du trimestre à zéro** aussi sûrement qu'un lancement accompli le fixe à un. Quatre lignes d'AST étaient muettes à tort pour avoir cherché un décompte là où une date suffisait.
- **§2 et §5 n'ont pas le même grain.** §5 écrit « aux publications **où** » → décision par ligne. §2 écrit « fixés **quand** la société entre […] on ne le remplace pas » → paramètre par société. Avoir codé D2 en hiérarchie par ligne fut une erreur, corrigée.
- **Lire sans appels de lecture de modèle, quand c'est possible** : API XBRL pour les agrégats, `FilingSummary.xml` → fichiers `R*.htm` (petits et tabulaires) pour les notes de segment et les comptes de résultat, regex sur le texte du dépôt pour les tables d'abonnés.
- **Précision 4 : un dépôt tardif est muet SUR SA LIGNE mais sert de valeur précédente à la suivante.** Deux états, pas un. Le carnet de Trimble n'est balisé que dans ses 10-Q, déposés après le communiqué — jusqu'à onze mois après en 2024 — d'où le drapeau `carnetTardif` dans `serie()`. Sans lui, on perd soit la ligne, soit la valeur précédente.
- **JAMAIS D'ADRESSE NI DE NOM DE PROJET DANS UNE REQUÊTE OU UN FICHIER SUIVI.** Jusqu'au 2026-11-25, l'adresse personnelle de Flo partait dans le `User-Agent` de chaque requête à la SEC, sans qu'il l'ait demandé, et figurait dans deux outils committés (jamais poussés ; commits reconstruits). Désormais : les outils lisent `SEC_USER_AGENT`, que Flo a réglée lui-même dans `~/.zshenv` avec une adresse dédiée. `data.sec.gov` accepte un client générique ; `www.sec.gov/Archives` répond 403 sans contact déclaré. Ne jamais écrire le contact dans une commande : écrire `$SEC_USER_AGENT`.
- **La liste des dépôts se CONTRÔLE, elle ne se filtre pas.** Garmin a déposé le communiqué de résultats du T1 2025 sous la rubrique **2.01** et non 2.02. Filtrer sur la seule rubrique 2.02 aurait fait manquer une publication et décalé toute la série, croissances précédentes comprises. Compter les dépôts contre le nombre de trimestres attendus, et ouvrir tout écart.
- **Deux comptes de résultat dans le même communiqué, aux mêmes libellés.** Sirius XM imprime le GAAP puis un tableau « ajusté » d'où sont exclus les règlements juridiques et la rémunération en actions. Prendre la première occurrence d'un libellé y ramène le chiffre ajusté — que §3 interdit (« les résultats ajustés ne servent à aucune dimension »). Vérifier contre le balisage XBRL, qui est toujours GAAP.
- **Espaces insécables à l'intérieur des nombres** : les communiqués écrivent `$3,670\xa0million`, ce qui fait échouer toute regex sur `\d+ million`. Normaliser `[^\S\t]` avant de chercher.
- **Les cellules de tableau contiennent des `<div>`** : couper aux balises de bloc casse les lignes de tableau. D'où deux passes — une pour la prose, une qui ne coupe qu'aux fins de ligne de tableau. Certains rendus (Garmin) vont plus loin et mettent **une valeur par ligne** : extraction positionnelle.
- **Un quatrième trimestre n'est pas toujours publié comme trimestre.** Garmin, Globalstar, AST et Sirius XM impriment une colonne trimestrielle dans leur communiqué annuel ; EchoStar non, et son 10-K ne balise aucun fait de 90 jours clos le 31 décembre. Règle tenue : lire le trimestre imprimé, ne le dériver que si un montant imprimé permet de vérifier la dérivation.
- **`npm test` n'est lancé par aucun workflow.** Le lancer à la main avant chaque PR, et vérifier visuellement, **onglet actif** (les Canvas ne se dessinent pas en arrière-plan).

### Constats à verser au bilan — candidats à une v1.4, pas des correctifs

- **Deux sociétés sur dix portent une « abaissée » due à leur RACHAT** : Globalstar (Amazon, T1 2026) et Iridium (Rocket Lab, T2 2026) suspendent leurs prévisions pendant la transaction. §3 classe le retrait d'une prévision « abaissée » sans distinguer les motifs. Appliqué tel quel, une fois par société ; à discuter pour une v1.4.
- **Un comparatif exceptionnel fabrique deux alertes.** RTX, T3 2024 : le trimestre d'il y a un an portait la charge des poudres métalliques (ventes de 13,5 milliards au lieu de 18, perte d'exploitation). D1 et D4 passent en hausse et la Bascule part avec un solde de +4 ; un trimestre plus tard, la base redevient normale, D1 retombe et une Rechute suit. Les deux alertes viennent du même événement de 2023, pas de 2024. La méthode lit les comparatifs imprimés (précision 8) et n'a pas de règle pour les éléments exceptionnels.
- **Globalstar bat la mesure** : une alerte tous les deux trimestres, cinq changements de régime en douze. CA en gros reconnu par à-coups, marge d'exploitation qui change de signe. Question d'hystérésis des régimes.
- **DEUX SOCIÉTÉS SUR HUIT NE LAISSENT QUE TROIS DIMENSIONS À LA MÉTHODE**, pour des raisons opposées — révisé le 2026-11-24, après vérification des trois cas (c'était « trois sur huit »). **EchoStar** ne donne aucun chiffre prospectif, d'aucune grandeur : vérifié sur les douze dépôts, la récolte est un calendrier de dette et une note comptable (D3 muette). **Garmin** ne contractualise pas sa demande : aucun carnet, aucune commande, aucun compte de clients au balisage ; sa demande se lit en rayon (D2 muette). **Trimble sort de la liste** : son carnet GAAP, écarté à tort parce qu'imprimé arrondi, parle sur cinq lignes. Or une Bascule exige +2 : avec trois dimensions, il faut deux hausses nettes sans aucune baisse. **La méthode reste moins sensible chez les sociétés qui publient peu** — à mesurer au bilan.
- **D2 peut être muette par RÉGULARITÉ, pas seulement par absence.** Les abonnés de Sirius XM s'érodent de −1,4 % à 0 % par an sans jamais accélérer ni ralentir de plus d'un point. Or D2 mesure une croissance DE croissance : sur une série qui décline régulièrement, elle ne bouge jamais. Onze lignes « stable » d'affilée.
- **La méthode n'a aucune règle de périmètre.** La cession de DISH TV fait lire −69 % à D1 pour une raison qui n'est pas la thèse.
- **Ambiguïté D1/D2 relevée le 2026-11-21** : D1 parle du « CA de la thèse », D2 du « CA du trimestre » sans qualificatif. D2 et le garde-fou sont calculés sur les totaux, D1 sur le segment.
- **Le plafond par défaut de §8 ne vaut que pour les ANNONCES, pas pour les comptes.** Relevé le 2026-11-23 après une mise en cause de Flo. Les accords commerciaux d'AST annoncés sans 8-K 1.01 restent au barreau 2 ; mais le 10-K porte « $42.0 million of contract liabilities […] for advance payments received » et une obligation d'achat d'AT&T suspendue à une licence — les deux membres du barreau 3, mot pour mot. Puis la FCC autorise le service commercial au T1 2026 : la condition tombe, barreau 4, **Bascule commerciale**. Un chiffre inscrit au bilan n'est pas une annonce, et le plafond ne le touche pas.

### Deux choix pris faute de réponse, faciles à défaire

La condition de financement (§7) figure à côté de chaque ligne, « non déterminée » par défaut. Seuls les trois drapeaux de calcul ont un emplacement, pas les cinq drapeaux éditoriaux de §10. Le score et la phase de §9 sont écartés — leurs poids sont « un choix raisonné, pas un réglage mesuré ».

---

## Avant ce carnet — faits durables rescapés

- **Plafond de `CLAUDE.md` relevé le 2026-07-30** à 4 500 tokens (~13 500 caractères) : l'ancien seuil de 2 000 était dépassé de 70 % et n'alertait donc plus.
- **Chemin canonique des dépôts depuis le 2026-07-19 : `~/Developer/GitHub/`** (migrés hors iCloud, qui évinçait les fichiers `.git` et provoquait des blocages de git).
- **Identité v2 « chaude » dans `main` depuis le 2026-07-30.** Six couleurs font double emploi, marque **et** donnée : aucun chercher-remplacer global de couleur n'est possible. Détail en §3 de `CLAUDE.md`.
