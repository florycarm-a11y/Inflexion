# SEMPLICE — Interactions Intelligence Artificielle (IA) / Cyber (C)

> **Objectif** : documenter les mecanismes causaux entre les dimensions Intelligence Artificielle
> et Cyber, actuellement scorees independamment mais causalement liees.
> Remplace [semplice-i-c-interactions.md](semplice-i-c-interactions.md) (v2, I = Information).
> Inflexion Intelligence — Juillet 2026

---

## Pourquoi documenter ces interactions ?

Les dimensions IA (Intelligence Artificielle) et C (Cyber) sont les deux ajouts exclusifs de
SEMPLICE v3 par rapport a PESTEL/SWOT/FSI/PMESII-PT. Elles sont scorees de maniere independante
dans la grille (`grille-scoring-quantitative-v3.md`, sections I et C), mais dans la realite elles
interagissent fortement :

- Un durcissement des controles a l'exportation (semi-conducteurs, logiciels, cloud) peut couper
  l'acces aux correctifs de securite et degrader la posture cyber d'une zone (IA2 -> C).
- Une dependance au compute ou aux modeles etrangers (IA1/IA4 eleves) expose a la juridiction
  extraterritoriale du fournisseur — surveillance, exfiltration facilitee (IA1/IA2 -> C10/C11).
- La concentration geographique de capacite data center (IA3) cree des cibles cyber strategiques
  de premier plan (IA3 <-> C5).
- Une puissance IA adverse projetable (IA5) est aussi une capacite cyber offensive et une capacite
  de manipulation informationnelle (IA5 -> C4, C14).
- Une souverainete IA forte (IA bas) correle avec une posture cyber plus solide (IA <-> C, base
  de la regle R12 du validateur).

Le scoring independant reste methodologiquement correct (evite la double comptabilisation), mais
les analystes doivent documenter ces interactions dans leurs evaluations — au meme titre que
l'ancien document traitait les interactions I(Information)/C.

---

## 5 scenarios croises IA <-> C

### Scenario 1 : Choc export control -> degradation de la posture cyber (dependance logicielle/patches)

**Direction** : IA2 -> C
**Mecanisme** : Un durcissement soudain des controles a l'exportation — semi-conducteurs, mais
aussi logiciels de securite, cloud, mises a jour — coupe l'acces aux correctifs, a la telemetrie
et au support des fournisseurs etrangers. La dette de securite s'accumule silencieusement : les
systemes ne recoivent plus de patchs, les detections de menace perdent en fraicheur, les
integrateurs locaux improvisent des contournements moins surs.
**Cas d'ancrage** : retrait du modele **Fable 5** par amendement du gouvernement americain
(2026) — un fournisseur IA revoque l'acces a un modele frontiere sur decision politique
unilaterale, y compris pour des utilisateurs jusque-la licites (cf. `rescoring-ia-2026-07.md`,
palier 7 de IA2). L'evenement demontre que la coupure d'acces logiciel/IA peut survenir sans
preavis meme pour des acteurs non sanctionnes au depart.
**Cas reels documentes** : le retrait des Google Mobile Services et des mises a jour de securite
Android pour Huawei apres son ajout a l'Entity List americaine (2019) a degrade durablement le
cycle de correctifs de millions d'appareils ; le retrait des vendeurs occidentaux de cybersecurite
de Russie apres 2022 (partage de renseignement sur les menaces coupe, mises a jour Microsoft
Defender et EDR occidentaux suspendues pour de nombreux clients) a mesurablement affaibli la
detection sur le marche russe, documente par plusieurs rapports de threat intelligence 2022-2023.
**Zones concernees** : Cuba (IA2=7, embargo permanent — cf. `rescoring-ia-2026-07.md` §4), Iran
et rive nord d'Ormuz (IA2=6, embargo total + marche gris), Chine (IA2=5, controles BIS maintenus
sur le < 7 nm malgre les licences H200 au cas par cas).
**Impact scoring** : quand IA2 franchit un palier vers l'embargo/la sanction, verifier une hausse
correlee des composantes de C liees a la dette de correctifs et a la surface d'attaque dans le
trimestre suivant. L'absence de hausse doit etre documentee explicitement (bascule reussie vers un
ecosysteme alternatif — ex. Huawei HarmonyOS, modeles ouverts chinois — plutot que degradation
subie).

### Scenario 2 : Dependance compute etranger -> exposition surveillance/exfiltration

**Direction** : IA1 / IA2 -> C10/C11
**Mecanisme** : Heberger ses donnees et ses modeles sur du compute etranger (hyperscaler) expose
a la juridiction extraterritoriale du fournisseur — acces legal aux donnees (type CLOUD Act),
portes derobees potentielles, exfiltration facilitee par la proximite avec la pile technique du
fournisseur. Plus IA1 (souverainete du compute) et IA2 (dependance semi-conducteurs) sont eleves,
plus la surface d'exposition C10 (cloud exposure) et C11 grandit mecaniquement.
**Cas reels documentes** : les revelations Snowden/PRISM (2013) ont demontre l'acces des services
de renseignement americains aux donnees hebergees chez des hyperscalers americains ; l'arret
Schrems II de la Cour de justice de l'UE (2020) a invalide le Privacy Shield UE-Etats-Unis
precisement sur ce risque d'acces extraterritorial, forcant une refonte des transferts de donnees
transatlantiques.
**Zones concernees** : Ukraine (IA1=6 — apres destruction des data centers domestiques, donnees
gouvernementales migrees vers AWS/Azure/Google, cf. `rescoring-ia-2026-07.md` §3) ; Golfe/Ormuz
(IA1=4 — data centers operes par des nationaux, Khazna/G42, mais sur stack Azure/Oracle
americaine, Stargate UAE).
**Impact scoring** : IA1/IA2 eleves (dependance compute etranger) doivent declencher une
verification explicite de C10/C11 (exposition cloud, souverainete des donnees) — une correlation
positive est attendue ; un ecart notable (dependance IA elevee mais C10/C11 bas) doit etre justifie
par des garanties contractuelles ou juridictionnelles specifiques (ex. clauses de residence des
donnees, statut de hub allie).

### Scenario 3 : Concentration des data centers = cible cyber strategique

**Direction** : IA3 <-> C5
**Mecanisme** : Une forte concentration de capacite data center dans peu de sites (hub regional)
cree un point de defaillance unique dont la valeur strategique — et donc l'attractivite comme
cible d'une cyberattaque, d'un sabotage physique ou d'une operation d'espionnage industriel —
croit avec le degre de concentration. Un IA3 tres bas (forte capacite installee par habitant,
donc concentree) est un signal a croiser avec C5 (infrastructure critique).
**Cas reel documente** : Singapour (IA3=1, ~230 W/habitant, hub compute majeur d'Asie du
Sud-Est) a connu en 2025-2026 un scandale de contournement documente des controles a
l'exportation — saisie d'un manoir de 42 M$, quatre personnes inculpees, des serveurs Dell/
Supermicro/Asus detournes vers la Chine via la cite-Etat (cf. `rescoring-ia-2026-07.md` §13,
Tom's Hardware 2026, Fortune 2026-05-13) — illustrant comment un hub compute concentre devient un
point de passage convoite, y compris pour des flux illicites plutot que des cyberattaques
classiques.
**Zones concernees** : Singapour (compute concentre + statut de hub), zone Ormuz/Golfe (projet
Stargate UAE, cible d'1 GW concentree sur un site).
**Impact scoring** : un IA3 tres bas doit alerter sur une exposition C5 potentiellement
sous-evaluee si la maturite cyber de la zone n'est pas proportionnee a la valeur de l'actif
concentre. A Singapour, la coherence est bonne (C=2,1, statecraft centralise sous le Premier
ministre Lawrence Wong) ; une zone combinant IA3 bas et C eleve constituerait un signal d'alerte
de sous-protection d'un actif strategique majeur.

### Scenario 4 : IA adverse projetable (IA5) alimente les capacites cyber offensives (C4) et la manipulation (C14)

**Direction** : IA5 -> C4 / C14
**Mecanisme** : Un rival regional dominant en IA peut retourner cette puissance de calcul et de
modeles contre la zone evaluee : automatisation de la reconnaissance et du spear-phishing
generatif (C4, capacites offensives etatiques), production de deepfakes et de campagnes de
manipulation a grande echelle (C14, fusion ex-I3/I7/I11 — operations d'influence et manipulation
IA).
**Cas reel documente** : l'usage documente de capacites IA russes dans les frappes et la guerre
electronique dirigees vers l'Ukraine (IA5=6, cf. `rescoring-ia-2026-07.md` §3, CSIS 2026, Fortune
2026-05-31) illustre la conversion directe d'une domination compute regionale en levier militaire
et cyber-electronique projete sur la zone cible. La generation de deepfakes assistee par IA dans
des campagnes de manipulation electorale est documentee dans plusieurs contextes depuis 2023-2024
(pre-cinetique dans le cas ukrainien : videos pre-enregistrees des dirigeants DNR/LPR, janvier
2022, capturees dans le backtest v2 — cf. `backtests-v2.md`).
**Zones concernees** : Ukraine (IA5=6, Russie rival dominant + posture agressive documentee) ;
zone Ormuz (IA5=5, IA militaire iranienne — drones — projetable dans le detroit) ; Chine/Mer de
Chine (IA5=6, Etats-Unis identifies comme puissance coercitive dominante dirigee vers la zone,
symetrie inverse au cas ukrainien).
**Impact scoring** : un IA5 eleve doit systematiquement etre croise avec C4 (capacites
offensives etatiques du rival identifie) et C14 (desinformation/manipulation). Si les deux
montent ensemble, documenter la convergence comme un risque combine (synergie) plutot que la
simple somme des deux dimensions — meme logique que le Scenario 1 de l'ancien document
`semplice-i-c-interactions.md` (desinformation preparatoire a cyberattaque), transposee au
registre de la puissance IA adverse plutot que de la campagne informationnelle isolee.

### Scenario 5 : Souverainete IA forte (IA <= 2) -> posture cyber renforcee (correlation positive, base de la regle R12)

**Direction** : IA <-> C (correlation positive attendue)
**Mecanisme** : Un Etat disposant d'une souverainete IA forte (compute, modeles, energie
maitrises — IA1/IA4/IA8 bas) maitrise generalement sa chaine technologique de bout en bout,
reduisant la surface d'attaque exposee via des tiers, et dispose des moyens (statecraft IA9 eleve)
pour financer une cyberdefense de niveau comparable. C'est la logique derriere la **regle R12** du
validateur (`scripts/semplice-validator.mjs`) : si IA &le; 2, C &le; 4 est attendu ; un ecart
exige une justification explicite dans l'evaluation. Cette regle remplace l'ancien garde-fou
methodologique |I&minus;C| &le; 2 du document v2 (jamais implemente comme regle automatisee).
**Cas reels (18 zones rescorees, juillet 2026)** :
- **Singapour** (IA=2,5, C=2,1) — cas conforme : statecraft le plus centralise du panel (Conseil
  national de l'IA preside par le Premier ministre), coherence forte entre gestion souveraine de
  l'allocation compute/energie et posture cyber maitrisee.
- **Republique tcheque** (IA=3,4, C=2,8) — proche de la coherence attendue, ancree dans
  l'ecosysteme europeen de cyberdefense.
- **Chine** (IA=3,1, C=5,0) — cas de nuance methodologique important : la Chine cumule une
  souverainete compute/modeles quasi maximale (IA1=1, IA4=1, IA9=1) mais un IA2 penalise par
  l'embargo americain sur les puces avancees, ce qui tire le composite IA au-dessus du seuil de 2
  et exclut formellement l'application de la regle R12. Le C=5,0 chinois ne traduit pas une
  vulnerabilite mais, en partie, une **capacite cyber offensive et de controle interne** deployee
  par un Etat autoritaire disposant des moyens de son ambition — une lecture que la regle R12,
  centree sur la vulnerabilite/dependance, ne capture pas et que l'analyste doit documenter en
  quali.
**Zones concernees** : Singapour et Republique tcheque (cas conformes a R12) ; Chine (cas
d'exception a documenter systematiquement, hors perimetre strict de R12 puisque IA &gt; 2).
**Impact scoring** : base directe de la regle R12 du validateur. Toute zone avec IA &le; 2 et
C &gt; 4 doit porter une justification explicite (ex. capacite cyber offensive deliberee d'un
regime autoritaire plutot que vulnerabilite subie ; ou inversement, retard reel de cyberdefense
malgre la souverainete IA).

---

## Recommandations pour les analystes

1. **Toujours verifier la coherence IA/C** : appliquer la regle R12 du validateur (IA &le; 2 =>
   C &le; 4 attendu) ; documenter explicitement tout ecart, en particulier les cas d'Etats
   autoritaires ou un C eleve reflete une capacite offensive/de controle plutot qu'une
   vulnerabilite (cf. Scenario 5, cas chinois).
2. **Documenter les interactions** : dans la section « flags » de l'evaluation, ajouter un flag
   « IA-C interaction » quand un des 5 scenarios ci-dessus est identifie, avec reference au
   scenario numerote.
3. **Choc export control** : toute degradation de palier IA2 (Scenario 1) doit declencher une
   verification de la posture cyber du trimestre suivant (dette de correctifs, perte de
   telemetrie fournisseur).
4. **Concentration compute** : tout IA3 tres bas (Scenario 3) doit etre croise avec C5
   (infrastructure critique) pour verifier la proportionnalite de la protection a la valeur de
   l'actif concentre.
5. **IA adverse projetable** : tout IA5 eleve (Scenario 4) doit etre croise avec C4 et C14 du
   rival identifie — signaler la convergence comme synergie, pas comme somme simple.
6. **Ne pas double-compter** : le meme evenement (ex. embargo semi-conducteurs + degradation
   cyber consecutive) ne doit etre compte qu'une fois dans le composite. Le scorer dans la
   dimension primaire (IA ou C selon la nature premiere de l'evenement) et documenter
   l'interaction dans l'autre.
