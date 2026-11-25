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

## 2026-11-21 → 2026-11-23 — Tracker d’inflexions : pivot, méthode figée, moteur, rejeu

**`feat/rejeu-spatial-lot1` FUSIONNÉE dans `main` le 2026-11-24** — PR #166, merge `2a0f5c43`. Le lot de huit sociétés, l'outillage de méthode et ce carnet sont dans `main`. Branche en cours depuis : **`feat/rejeu-spatial-lot2`**, pour les neuf dernières sociétés.

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

**8 sociétés lues sur 18, 95 publications.** Engendrées par `scripts/tracker-rejeu-spatial.mjs`.

| Société | Poids | Archétype | Lignes | Résultat |
|---|---:|---|---:|---|
| EchoStar | 8,391 % | plateforme | 12 | 2 Signaux faibles, aucune Bascule |
| Trimble | 5,280 % | plateforme | 12 | Rechute, Signal faible, Bascule, Rechute |
| Globalstar | 5,249 % | plateforme | 12 | 6 alertes, 5 changements de régime |
| Sirius XM | 5,245 % | plateforme | 12 | Rechute (T3 2024), Bascule (T3 2025) |
| Garmin | 4,662 % | industriel | 12 | 2 Bascules (T1 2024, T2 2025) |
| Virgin Galactic | 3,874 % | pré-revenus | 12 | aucune alerte |
| Planet Labs | 2,642 % | plateforme | 11 | 1 Bascule (2025-06-04) |
| AST SpaceMobile | 1,605 % | pré-revenus | 12 | Bascule (T4 2025) + **Bascule commerciale** (T1 2026) |

**Lecture dans l'ordre des poids du dépôt** — aucune règle ne l'impose, mais l'ordre publié met la lecture à l'abri de tout soupçon de tri. **Reste 9 sociétés** : Viasat (en cours, voir `scripts/rejeu/README.md`), Iridium, RTX, Comcast, L3Harris, Honeywell, Lockheed Martin, Northrop Grumman, Boeing.

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
- **La liste des dépôts se CONTRÔLE, elle ne se filtre pas.** Garmin a déposé le communiqué de résultats du T1 2025 sous la rubrique **2.01** et non 2.02. Filtrer sur la seule rubrique 2.02 aurait fait manquer une publication et décalé toute la série, croissances précédentes comprises. Compter les dépôts contre le nombre de trimestres attendus, et ouvrir tout écart.
- **Deux comptes de résultat dans le même communiqué, aux mêmes libellés.** Sirius XM imprime le GAAP puis un tableau « ajusté » d'où sont exclus les règlements juridiques et la rémunération en actions. Prendre la première occurrence d'un libellé y ramène le chiffre ajusté — que §3 interdit (« les résultats ajustés ne servent à aucune dimension »). Vérifier contre le balisage XBRL, qui est toujours GAAP.
- **Espaces insécables à l'intérieur des nombres** : les communiqués écrivent `$3,670\xa0million`, ce qui fait échouer toute regex sur `\d+ million`. Normaliser `[^\S\t]` avant de chercher.
- **Les cellules de tableau contiennent des `<div>`** : couper aux balises de bloc casse les lignes de tableau. D'où deux passes — une pour la prose, une qui ne coupe qu'aux fins de ligne de tableau. Certains rendus (Garmin) vont plus loin et mettent **une valeur par ligne** : extraction positionnelle.
- **Un quatrième trimestre n'est pas toujours publié comme trimestre.** Garmin, Globalstar, AST et Sirius XM impriment une colonne trimestrielle dans leur communiqué annuel ; EchoStar non, et son 10-K ne balise aucun fait de 90 jours clos le 31 décembre. Règle tenue : lire le trimestre imprimé, ne le dériver que si un montant imprimé permet de vérifier la dérivation.
- **`npm test` n'est lancé par aucun workflow.** Le lancer à la main avant chaque PR, et vérifier visuellement, **onglet actif** (les Canvas ne se dessinent pas en arrière-plan).

### Constats à verser au bilan — candidats à une v1.4, pas des correctifs

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
