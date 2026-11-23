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

## 2026-11-21 → 2026-11-23 — Tracker d'inflexions : pivot, méthode figée, moteur, rejeu

Branche de travail à la fin de la session : **`feat/rejeu-spatial-lot1`**, 6 commits, **non fusionnée**.

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

**5 sociétés lues sur 18, 59 publications.** Engendrées par `scripts/tracker-rejeu-spatial.mjs`.

| Société | Archétype | Lignes | Résultat |
|---|---|---:|---|
| Virgin Galactic | pré-revenus | 12 | aucune alerte |
| Planet Labs | plateforme | 11 | 1 Bascule (2025-06-04) |
| AST SpaceMobile | pré-revenus | 12 | 1 Bascule (2026-08-10), aucune Bascule commerciale |
| Globalstar | plateforme | 12 | 6 alertes, 5 changements de régime |
| EchoStar | plateforme | 12 | 2 Signaux faibles, aucune Bascule |

**Reste 12 sociétés**, à lire dans l'ordre des poids du dépôt : Trimble, Sirius XM, Garmin, Viasat, Iridium, RTX, Comcast, L3Harris, Honeywell, Lockheed Martin, Northrop Grumman, Boeing. Rocket Lab compte comme lue (sa fiche publique porte sa série). Ordre de grandeur annoncé au protocole : 150 à 200 communiqués en tout.

Le bilan du rejeu — précision et rappel de la Bascule et de la Rechute, sociétés sans aucune alerte — ne s'écrit **qu'à la fin**, et se publie même s'il est mauvais.

### Pièges déjà payés

- **Précision 8 : grouper les faits XBRL par DÉPÔT, jamais par période.** Chez une société qui retraite son historique (EchoStar en retraite trois fois), prendre « la dernière valeur connue » d'un trimestre revient à lire une base de données au lieu des comptes. L'API `companyconcept` porte `accn` et `filed` : s'en servir.
- **Les communiqués impriment par endroits la perte AVANT IMPÔT** là où D4 exige la perte d'exploitation (AST SpaceMobile, Globalstar). Reconstituer par `CA − total des charges d'exploitation` balisés dans le 10-Q du jour, et **contrôler la dérivation** contre un montant imprimé ailleurs.
- **Travailler au millier exact, jamais au million arrondi.** Quatre lignes du rejeu franchissent le seuil d'un point à moins de 0,05 près.
- **Un montant imprimé « over $900 Million » est non publié** (Planet Labs, carnet au 31/01/2026) : la précision 3 interdit l'arrondi intermédiaire dans une variation.
- **§2 et §5 n'ont pas le même grain.** §5 écrit « aux publications **où** » → décision par ligne. §2 écrit « fixés **quand** la société entre […] on ne le remplace pas » → paramètre par société. Avoir codé D2 en hiérarchie par ligne fut une erreur, corrigée.
- **Lire sans appels de lecture de modèle, quand c'est possible** : API XBRL pour les agrégats, `FilingSummary.xml` → fichiers `R*.htm` (petits et tabulaires) pour les notes de segment et les comptes de résultat, regex sur le texte du dépôt pour les tables d'abonnés. Méthode rodée sur EchoStar, applicable aux douze restantes.
- **`npm test` n'est lancé par aucun workflow.** Le lancer à la main avant chaque PR, et vérifier visuellement, **onglet actif** (les Canvas ne se dessinent pas en arrière-plan).

### Constats à verser au bilan — candidats à une v1.4, pas des correctifs

- **Globalstar bat la mesure** : une alerte tous les deux trimestres, cinq changements de régime en douze. CA en gros reconnu par à-coups, marge d'exploitation qui change de signe. Question d'hystérésis des régimes.
- **EchoStar ne guide pas, donc D3 est muette sur douze lignes** : la société joue à trois dimensions sur quatre et une Bascule devient presque inatteignable. **La méthode est structurellement moins sensible chez les sociétés qui ne guident pas** — un biais que seul un univers non choisi pouvait révéler.
- **La méthode n'a aucune règle de périmètre.** La cession de DISH TV fait lire −69 % à D1 pour une raison qui n'est pas la thèse.
- **Ambiguïté D1/D2 relevée le 2026-11-21** : D1 parle du « CA de la thèse », D2 du « CA du trimestre » sans qualificatif. D2 et le garde-fou sont calculés sur les totaux, D1 sur le segment.
- **§8 refuse de créditer un accord « définitif » non déposé** (AST : AT&T, Vodafone, Verizon, Rakuten annoncés, aucun 8-K 1.01 côté client → barreau plafonné à 2). C'est un résultat, pas un défaut.

### Deux choix pris faute de réponse, faciles à défaire

La condition de financement (§7) figure à côté de chaque ligne, « non déterminée » par défaut. Seuls les trois drapeaux de calcul ont un emplacement, pas les cinq drapeaux éditoriaux de §10. Le score et la phase de §9 sont écartés — leurs poids sont « un choix raisonné, pas un réglage mesuré ».

---

## Avant ce carnet — faits durables rescapés

- **Plafond de `CLAUDE.md` relevé le 2026-07-30** à 4 500 tokens (~13 500 caractères) : l'ancien seuil de 2 000 était dépassé de 70 % et n'alertait donc plus.
- **Chemin canonique des dépôts depuis le 2026-07-19 : `~/Developer/GitHub/`** (migrés hors iCloud, qui évinçait les fichiers `.git` et provoquait des blocages de git).
- **Identité v2 « chaude » dans `main` depuis le 2026-07-30.** Six couleurs font double emploi, marque **et** donnée : aucun chercher-remplacer global de couleur n'est possible. Détail en §3 de `CLAUDE.md`.
