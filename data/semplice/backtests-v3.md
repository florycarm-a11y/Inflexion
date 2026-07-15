# SEMPLICE — Backtests dimension IA (v3)

> **3 cas ciblés — décision utilisateur 2026-07-06 : pas de rejeu des 12 crises historiques.**
> [backtests-v2.md](backtests-v2.md) reste la référence des 12 crises historiques (dimension
> Information, valide pour v2). Ce document ne les rejoue pas.
> Inflexion Intelligence — Juillet 2026
> Grille de référence : `grille-scoring-quantitative-v3.md`, section « I — Intelligence
> Artificielle » (IA1-IA9). Données de zone : `rescoring-ia-2026-07.md` (18 zones, juillet 2026).

---

## Objectif

La dimension IA (Intelligence Artificielle, ex-Information) est trop récente pour disposer d'un
historique de scores propre — elle démarre à la première réévaluation v3 (rupture de série
assumée, cf. `rescoring-ia-2026-07.md` §Avertissement). On ne peut donc pas la « backtester » au
sens classique (rejouer 12 crises avec un historique de scores). On peut en revanche évaluer sa
**valeur prédictive rétrospective** sur 3 cas choisis pour leur pertinence structurelle :

1. **Ukraine 2022** — la dimension IA aurait-elle vu venir la dépendance de guerre au compute et
   aux réseaux occidentaux, en amont de l'invasion ?
2. **Embargo semi-conducteurs Chine (2022-2026)** — IA2 comme signal précoce d'une rupture
   structurelle étalée sur 4 ans, plutôt qu'un choc ponctuel.
3. **Retrait Fable 5 (2026)** — le cas fondateur du palier 7 de IA2 : que capture (et que ne
   capture pas) un cadre d'évaluation face à la révocation unilatérale d'un accès IA jusque-là
   licite ?

Le fil conducteur : **IA est un signal lent et structurel, complémentaire de la vélocité — pas
un concurrent**. Là où C (Cyber) excelle à détecter l'accélération des semaines précédant une
crise (WhisperGate, 15 janvier 2022, cf. `backtests-v2.md`), IA excelle à détecter des
vulnérabilités de dépendance qui se construisent sur des années et se révèlent brutalement au
moment où l'accès est coupé.

---

## 1. Ukraine 2022 — dépendance Starlink/compute occidental

### Ce que WhisperGate (C) capturait déjà

Le backtest v2 (`backtests-v2.md`) établit que la dimension Cyber a détecté un signal
pré-cinétique fort : WhisperGate, wiper déguisé en rançongiciel, déployé le 15 janvier 2022 contre
les ministères et ONG ukrainiens (Microsoft MSTIC), suivi de HermeticWiper le 23 février — un
horodatage de compilation au 28 décembre 2021 prouvant une planification préalable. C'est un
signal **rapide** : semaines, pas années.

### Scoring rétrospectif IA2 / IA4 / IA5 — fin 2021 (avant l'invasion)

| Indicateur | Palier rétrospectif (fin 2021) | Justification | Limite méthodologique |
|---|:---:|---|---|
| **IA5** — Puissance IA adverse projetable | **5-6** | La Russie dispose d'une capacité offensive cyber/EW documentée et déjà projetée contre l'Ukraine depuis des années : attaque BlackEnergy contre le réseau électrique ukrainien (décembre 2015, première coupure de courant confirmée causée par une cyberattaque), puis NotPetya (juin 2017, propagé via le logiciel fiscal ukrainien M.E.Doc, ~10 Md$ de dégâts mondiaux). Ce palier n'est pas un signal nouveau fin 2021 : il est **déjà établi depuis 2015-2017**. | Aucune — c'est le point fort du cas : IA5 aurait été élevé bien avant la fenêtre pré-cinétique captée par C. |
| **IA2** — Dépendance semi-conducteurs avancés | **~3** | Ukraine sans production nationale, mais approvisionnement normal via les circuits mondiaux (pas encore de rupture de guerre). Comparable au palier 2026 post-invasion (3, « fournisseurs alliés diversifiés » — cf. `rescoring-ia-2026-07.md` §3) : cet indicateur ne bouge quasiment pas entre les deux dates, ce n'est **pas** le signal discriminant de ce cas. | — |
| **IA4** — Souveraineté des modèles | **non applicable de façon fiable** | Le construit « dépendance aux modèles de fondation étrangers » présuppose l'existence d'un marché de modèles de fondation significatif. Fin 2021, ce marché n'existait pas sous sa forme actuelle (ChatGPT n'est lancé qu'en novembre 2022). Noter la limite plutôt que forcer un palier rétrospectif non ancrable dans une donnée de l'époque. | **Honnêteté méthodologique** : IA4 est anachronique pour une évaluation fin 2021 — le contexte du marché des modèles change trop vite pour rejouer cet indicateur de façon crédible sur cette fenêtre. |

### Ce que ce cas montre — et sa limite honnête

**Signal capturé** : IA5 aurait correctement identifié la Russie comme puissance IA/cyber
adverse dominante dès 2017, soit **5 ans avant l'invasion** — un signal structurel bien plus
lent que le signal C pré-cinétique de janvier 2022, mais présent bien plus tôt dans le temps.

**Signal manqué** : la dépendance Starlink — aujourd'hui au cœur du score IA1 actuel de la zone
(6/7, « l'architecture de combat s'effondrerait en quelques jours » en cas de coupure — CircleID,
cité dans `rescoring-ia-2026-07.md` §3) — **n'existait pas** fin 2021. SpaceX n'active le service
en Ukraine que le 26 février 2022, deux jours après l'invasion, à la demande du ministre Mykhailo
Fedorov ; les États-Unis, la Pologne et d'autres financent depuis l'essentiel des terminaux et de
la connectivité (~85 % des terminaux, ~30 % de la connectivité selon les chiffres communiqués par
SpaceX). Cette dépendance est une **création de guerre**, pas une vulnérabilité pré-existante
détectable en amont.

**Conclusion du cas** : IA détecte les dépendances structurelles anciennes (IA5, rival établi
depuis des années) mais ne peut pas anticiper une dépendance créée *pendant* la crise elle-même
(IA1 Starlink). C'est cohérent avec la nature de la dimension : un signal lent sur des tendances
de fond, pas un capteur d'événements soudains — rôle que jouent M et C.

Sources : Wikipedia « Starlink in the Russo-Ukrainian war » ; Belfer Center, « Starlink and the
Russia-Ukraine War » ; `backtests-v2.md` (WhisperGate) ; `rescoring-ia-2026-07.md` §3.

---

## 2. Embargo semi-conducteurs Chine (2022-2026) — IA2 comme signal précoce structurel

### Trajectoire du palier IA2 chinois

| Période | Événement | Palier IA2 estimé | Nature du signal |
|---|---|:---:|---|
| 2022 T3 (avant le 7 oct.) | Accès globalement diversifié, pas de contrôle spécifique majeur | **~3** | Base |
| 2022 T4 (7 oct. 2022) | BIS impose des contrôles massifs sur le calcul avancé et les équipements de fabrication de semi-conducteurs vers la Chine (Federal Register 2022-21658) ; premières inscriptions à l'Entity List | **~5** | **Rupture structurelle brutale** — Δ ≈ 2 points en un trimestre |
| 2023 T4 (règles du 17 oct. 2023, effectives 17 nov. 2023) | BIS resserre les règles pour « fermer les failles » du texte de 2022 (Secrétaire Raimondo) ; mise à jour annoncée comme récurrente (« au moins annuelle ») | **~5-6** | Escalade continue |
| 2024-2025 | Règles supplémentaires (avril 2024, déc. 2024) ; 140 nouvelles entités ajoutées à l'Entity List (Chine, Japon, Corée du Sud, Singapour — lien direct avec le scandale de contournement singapourien documenté dans `rescoring-ia-2026-07.md` §13) | **~6** | Plateau de tension maximale |
| 2026 T1 (licences H200 « cas par cas », janv. 2026, prélèvement de 25 % des revenus) | Assouplissement conditionnel et réversible, pas une levée | **5** (score actuel, `rescoring-ia-2026-07.md` §5) | Détente partielle, sous conditions politiques |

### Ce que la vélocité IA aurait montré

Le choc initial (2022 T3 → T4, Δ ≈ 2 points en un trimestre) **aurait immédiatement déclenché**
la règle de vélocité R11 du validateur (seuil « crise émergente » à Δ &gt; 0,5/trimestre,
cf. `docs/superpowers/specs/2026-06-18-semplice-v3-architecture-design.md` §7.2) — la vélocité
IA n'est donc pas aveugle aux chocs ponctuels.

Mais l'essentiel de la valeur du cas n'est **pas** dans ce pic initial : c'est dans la **lecture
de niveau** sur 4 ans (2022-2026) qui montre une économie construisant méthodiquement sa réponse
structurelle — la Chine compense partiellement l'embargo par une production domestique
(SMIC 7 nm, Huawei Ascend) qui borne le palier IA2 à 5 plutôt que de le laisser dériver vers 7,
tout en atteignant une souveraineté quasi maximale sur le compute (IA1=1) et les modèles
(IA4=1, DeepSeek/Qwen) — un profil qu'aucune vélocité trimestrielle isolée ne peut résumer. C'est
la différence entre une alerte de crise (vélocité, régime de C/M) et une lecture de trajectoire
industrielle (niveau IA, sur plusieurs années).

Sources : BIS, communiqué « Commerce Strengthens Export Controls… » ; Federal Register
2022-21658 et 2023-23049 ; Skadden, « BIS Updates October 2022 Semiconductor Export Control
Rules » (2023) ; Holland & Knight, « U.S. Strengthens Export Controls… » (déc. 2024) ;
`rescoring-ia-2026-07.md` §5 (Mer de Chine).

---

## 3. Retrait Fable 5 (2026) — cas fondateur du palier 7 de IA2

### Le cas

Un fournisseur IA étranger jusque-là licite révoque, sur amendement du gouvernement américain
(2026), l'accès à un modèle frontière — le modèle **Fable 5** — y compris pour des utilisateurs
qui n'étaient pas eux-mêmes sous sanction. C'est l'événement d'ancrage explicite du **palier 7**
de IA2 dans la grille v3 (« Embargo total (retrait de modèles type Fable 5) »,
`grille-scoring-quantitative-v3.md` ligne IA2 ; repris comme cas d'ancrage dans
`rescoring-ia-2026-07.md` §Objectif).

### Qui était exposé

Toute zone dont le score IA4 (souveraineté des modèles) est déjà dégradé — dépendance à des
modèles propriétaires étrangers sans alternative nationale — était structurellement exposée.
Dans le panel des 18 zones rescorées, les cas les plus proches de cette exposition sont ceux où
IA4 est élevé *et* IA1 (compute) est également externalisé : Ukraine (IA4=5, IA1=6 — dépendance
cloud et modèles américains pour l'IA militaire de type Swarmer, « le précédent Fable 5 rappelle
que cet accès est politiquement révocable, même pour un allié », `rescoring-ia-2026-07.md` §3) et
Golfe/Ormuz (IA4=4, IA1=4 — Falcon TII est une lignée nationale de second rang, insuffisante pour
couvrir une révocation totale d'accès aux modèles américains).

### Comment IA2 / IA4 le capturent

- **IA2** capture directement l'événement : c'est littéralement l'ancre du palier 7 (« embargo
  total »). Toute zone scorée à IA2=7 porte, par construction, le risque de ce scénario.
- **IA4** capture la vulnérabilité en amont : une zone à IA4 élevé (dépendance à des modèles
  étrangers propriétaires, sans alternative nationale ni même ouverte) est structurellement
  exposée à *tout* futur événement de ce type, avant même qu'il ne survienne — c'est un
  indicateur prédictif de la classe de risque, pas seulement un enregistrement de l'événement une
  fois survenu.

### Pourquoi aucun autre cadre ne l'aurait vu

PESTEL, SWOT, FSI, PMESII-PT, S&P, EIU et Coface n'ont pas d'axe dédié à la dépendance IA
(cf. tableau de comparaison, `expertise.html#semplice`). Un cas comme le retrait Fable 5 relèverait
au mieux, dans ces cadres, d'une note qualitative diffuse sous « risque réglementaire » (S&P,
Coface) ou « risque technologique » générique (EIU) — sans indicateur quantifié, sans seuil, sans
antériorité permettant de dire *avant* l'événement quelles zones étaient les plus exposées. C'est
précisément l'argument différenciant de la dimension IA : elle transforme un risque diffus
(« dépendance technologique ») en un indicateur scoré, comparable entre zones, avec un palier 7
explicitement ancré sur ce type d'événement.

---

## Conclusion — valeur prédictive de la dimension IA

Les trois cas convergent vers la même lecture : **IA est un signal lent et structurel,
complémentaire de la vélocité — pas un concurrent**.

- **Ukraine** : IA5 aurait signalé la Russie comme puissance IA/cyber adverse dès 2017 (5 ans
  d'avance), mais ne pouvait pas anticiper la dépendance Starlink créée pendant la guerre
  elle-même — les dépendances nées *dans* la crise restent du ressort de C et M.
- **Embargo Chine** : le choc initial (oct. 2022) aurait déclenché une alerte de vélocité comme
  n'importe quelle dimension, mais la valeur ajoutée réelle de IA est dans la lecture de
  trajectoire sur 4 ans — capacité de réponse structurelle d'un État (souveraineté compute/modèles
  chinoise construite *malgré* l'embargo), invisible à un instantané ou une simple alerte
  ponctuelle.
- **Fable 5** : IA2/IA4 transforment un risque diffus (« dépendance technologique ») en un
  indicateur scoré et comparable, avec un palier explicitement ancré sur ce type d'événement —
  un service qu'aucun cadre concurrent ne rend actuellement.

En résumé : IA ne remplace ni la vélocité (alertes rapides, R11) ni Cyber (signal pré-cinétique
rapide, cf. WhisperGate dans `backtests-v2.md`) — elle documente la **profondeur** et
l'**ancienneté** d'une dépendance technologique, un axe temporel que les autres dimensions ne
couvrent pas.
