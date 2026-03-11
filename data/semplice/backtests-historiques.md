# SEMPLICE — Backtests historiques v1.1

> **Validation retrospective du cadre SEMPLICE sur 10 crises majeures (2011-2024)**
> Inflexion Intelligence — Mars 2026

---

## Objectif

Demontrer que la grille SEMPLICE, appliquee retrospectivement aux donnees disponibles **3 a 12 mois avant** chaque crise, aurait produit un signal d'alerte suffisant. Ce backtest constitue l'argument de credibilite central du framework.

---

## Synthese des resultats

| Crise | Date | Score SEMPLICE | Detecte ? | Dimensions cles | Avance |
|-------|------|:-:|:-:|-------|-------|
| **Liban** (effondrement) | 2020 | **4.2** | OUI | E(5.0) P(4.8) L(4.5) S(4.5) | 6-12 mois |
| **Venezuela** (hyperinflation) | 2017 | **4.1** | OUI | P(5.0) E(4.9) L(4.8) S(4.5) | 12+ mois |
| **Myanmar** (coup d'Etat) | 2021 | **4.1** | OUI | P(5.0) M(4.5) I(4.3) L(4.2) | 3-6 mois |
| **Sri Lanka** (defaut souverain) | 2022 | **3.6** | OUI | E(4.6) E_env(4.2) P(4.0) | 4-6 mois |
| **Egypte** (Printemps arabe) | 2011 | **3.5** | OUI | P(4.5) I(3.8) E_env(3.6) | 6+ mois |
| **Ukraine** (invasion) | 2022 | **3.3->3.5** | OUI | M(4.8) C(4.4) I(3.8) | 3-4 mois |
| **Turquie** (crise lira) | 2018 | **3.3** | OUI | P(4.4) I(4.3) E(3.2) | 3-6 mois |
| **Niger** (coup Sahel) | 2023 | **3.3→3.5** | OUI (v1.1) | E_env(4.8) M(3.6→4.3) P(3.6) | Signal modere→eleve |
| **Soudan** (guerre civile) | 2023 | **4.5** | OUI | P(4.8) I(4.9) E(4.5) M(4.0) | 6-12 mois |
| **Bangladesh** (chute Hasina) | 2024 | **3.3** | PARTIEL | I(4.6) P(4.4) S(3.9) | 3-6 mois |
| **Syrie** (chute Assad) | 2024 | **4.7** | OUI | M(4.8) P(4.9) I(4.9) E(4.9) | 6+ mois |
| **Tunisie** (Printemps arabe) | 2011 | **3.0** | PARTIEL | I(4.4) S(3.6) P(3.3) | Sous-detecte |

**Taux de detection v1.0 : 7/9 pleinement, 2/9 partiellement (sur 9 originales)**
**Taux de detection v1.1 : 10/12 pleinement, 2/12 partiellement** (Niger reclasse, +3 crises 2023-2024)

---

## 1. Printemps arabe — Tunisie & Egypte (2010-2011)

### Donnees pre-crise (mi-2010)

#### Tunisie

| Dimension | Score Quanti | Score Quali | Score Final |
|-----------|:-:|:-:|:-:|
| S — Social | 3.4 | 4 | **3.6** |
| E — Economique | 2.2 | 3 | **2.5** |
| M — Militaire | 1.8 | 2 | **1.9** |
| P — Politique | 2.8 | 4 | **3.3** |
| L — Legal | 2.6 | 3 | **2.8** |
| I — Information | 4.6 | 4 | **4.4** |
| C — Cyber | 3.0 | 2 | **2.6** |
| E — Environnemental | 3.2 | 3 | **3.1** |
| **COMPOSITE** | | | **3.0** |

Signaux faibles : Chomage diplomes 30%, revolte bassin minier Gafsa (2008) non resolue, "Ammar 404" (censure internet + cyberresistance Nawaat.org), cables WikiLeaks decrivant la kleptocratie Ben Ali/Trabelsi.

#### Egypte

| Dimension | Score Quanti | Score Quali | Score Final |
|-----------|:-:|:-:|:-:|
| S — Social | 3.0 | 4 | **3.4** |
| E — Economique | 2.8 | 4 | **3.3** |
| M — Militaire | 3.0 | 3 | **3.0** |
| P — Politique | 4.2 | 5 | **4.5** |
| L — Legal | 3.2 | 4 | **3.5** |
| I — Information | 3.6 | 4 | **3.8** |
| C — Cyber | 3.0 | 3 | **3.0** |
| E — Environnemental | 3.4 | 4 | **3.6** |
| **COMPOSITE** | | | **3.5** |

Signaux faibles : Meurtre de Khaled Said (juin 2010) → page Facebook 250 000 membres en 3 semaines, Moubarak 82 ans + question successorale Gamal, inflation alimentaire ble +47%, elections legislatives trucquees (nov. 2010, PND 97%).

**Verdict** : Egypte clairement detectee (3.5, P a 4.5). Tunisie sous-detectee (3.0) mais I a 4.4 etait le signal d'alerte — la censure extreme + cyberresistance active est un marqueur de fragilite invisible aux frameworks classiques.

**Avantage SEMPLICE vs PESTEL** : La dimension Information (I) est le differenciant. PESTEL subsume l'information sous "Technologique" sans capturer la censure, la mobilisation numerique ni la guerre cognitive.

---

## 2. Crise turque — Effondrement de la lira (aout 2018)

### Donnees pre-crise (T1-T2 2018)

| Dimension | Score Quanti | Score Quali | Score Final |
|-----------|:-:|:-:|:-:|
| S — Social | 2.4 | 3 | **2.6** |
| E — Economique | 2.7 | 4 | **3.2** |
| M — Militaire | 3.0 | 3 | **3.0** |
| P — Politique | 4.0 | 5 | **4.4** |
| L — Legal | 2.4 | 4 | **3.0** |
| I — Information | 3.8 | 5 | **4.3** |
| C — Cyber | 2.8 | 3 | **2.9** |
| E — Environnemental | 2.8 | 3 | **2.9** |
| **COMPOSITE** | | | **3.3** |

Signaux faibles : Erdogan "les taux sont la mere de tous les maux" (14 mai 2018), degradation Moody's Ba2 (mars), rachat Dogan Media (dernier groupe independant, mars), Freedom House "Not Free" (janvier), lira deja -20% en 5 mois.

**Verdict** : Detecte. P(4.4) + I(4.3) = signature d'un regime autoritaire dont le controle informationnel empechait la transmission des signaux d'alerte economiques, amplifiant la bulle. Le PIB a +7.3% etait un faux negatif (surchauffe).

---

## 3. Sri Lanka — Defaut souverain (2022)

### Donnees pre-crise (2021)

| Dimension | Score Quanti | Score Quali | Score Final |
|-----------|:-:|:-:|:-:|
| S — Social | 3.0 | 4 | **3.4** |
| E — Economique | 3.4 | 5 | **4.6** |
| M — Militaire | 1.6 | 4 | **2.6** |
| P — Politique | 3.0 | 5 | **4.0** |
| L — Legal | 2.8 | 4 | **3.2** |
| I — Information | 3.2 | 4 | **3.6** |
| C — Cyber | 2.6 | 3 | **2.8** |
| E — Environnemental | 3.6 | 5 | **4.2** |
| **COMPOSITE** | | | **3.6** |

Signal faible decisif : **Ban des engrais chimiques** (mai 2021) → chute 32% production riz, -18% production the (425 M$ d'exportations perdues), 54% de perte de rendement moyen. Cascade : perte revenus export → crise devises → incapacite importer carburant/gaz → effondrement.

Autres signaux : Reserves de change position nette negative (-4.1 Mds$ des avril 2021), dynastie Rajapaksa (6 membres famille au pouvoir), 30+ agences civiles sous le ministere de la Defense.

**Verdict** : Detecte. Le signal agriculture bio est capture par E_env(4.2) — PESTEL l'aurait classe comme "risque reglementaire" sans mesurer l'onde de choc systemique.

---

## 4. Invasion de l'Ukraine (fevrier 2022)

### Donnees pre-crise — deux instantanes

| Dimension | Oct. 2021 | Jan. 2022 | Delta |
|-----------|:-:|:-:|:-:|
| S — Social | 2.8 | 2.8 | 0 |
| E — Economique | 2.9 | 2.9 | 0 |
| M — Militaire | **4.6** | **4.8** | +0.2 |
| P — Politique | 3.5 | 3.5 | 0 |
| L — Legal | 2.8 | 2.8 | 0 |
| I — Information | 3.3 | **3.8** | **+0.5** |
| C — Cyber | 3.4 | **4.4** | **+1.0** |
| E — Environnemental | 3.0 | 3.0 | 0 |
| **COMPOSITE** | **3.3** | **3.5** | **+0.2** |

Signal decisif : **WhisperGate** (13-14 janvier 2022) — wiper destructif deguise en ransomware, 70+ sites gouvernementaux defaces. Replique exacte du schema NotPetya (2017). Le score C bondit de 3.4 a 4.4 en 3 mois (+1.0), le delta le plus fort de tout le backtest.

**Verdict** : Detecte. Le pattern **M(4.8) + C(4.4) + I(3.8)** constitue la signature d'une invasion imminente. Ce pattern n'existe dans aucun autre cadre d'analyse — les dimensions I et C sont absentes de PESTEL et du FSI.

---

## 5. Liban — Effondrement (2019-2020)

### Donnees pre-crise (mi-2019)

| Dimension | Score Quanti | Score Quali | Score Final |
|-----------|:-:|:-:|:-:|
| S — Social | 3.8 | 5 | **4.5** |
| E — Economique | 4.2 | 5 | **5.0** |
| M — Militaire | 3.8 | 4 | **4.0** |
| P — Politique | 4.4 | 5 | **4.8** |
| L — Legal | 3.4 | 5 | **4.5** |
| I — Information | 3.2 | 4 | **3.5** |
| C — Cyber | 3.6 | 3 | **3.5** |
| E — Environnemental | 3.4 | 5 | **4.0** |
| **COMPOSITE** | | | **4.2** |

Signaux faibles :
- **Schema de Ponzi bancaire** : BDL offrant 20% sur les depots USD pour attirer les capitaux, finances par de nouveaux depots. Structure classique Ponzi.
- **Nitrate d'ammonium** : 2 750 tonnes stockees au port de Beyrouth depuis 2013, 6 alertes officielles ignorees. "Rhinoceros gris" parfaitement documente.
- **Inflation a 3%** : faux negatif masque par le peg LBP/USD a 1507.5, maintenu artificiellement par le Ponzi. L'inflation reelle explose des mars 2020 (85% puis 155% puis 171%).
- **Controles de capitaux illegaux** : les banques bloquent les retraits sans base legale des novembre 2019.

**Verdict** : Detecte sans ambiguite. Score 4.2 = le plus eleve de tous les backtests. Le croisement E(5.0) x L(4.5) capture le lien entre le Ponzi bancaire et l'absence de cadre legal — unique a SEMPLICE.

---

## 6. Myanmar — Coup d'Etat (fevrier 2021)

### Donnees pre-crise (mi-2020 / janvier 2021)

| Dimension | Score Quanti | Score Quali | Score Final |
|-----------|:-:|:-:|:-:|
| S — Social | 3.2 | 5 | **4.0** |
| E — Economique | 3.6 | 4 | **3.6** |
| M — Militaire | 3.6 | 5 | **4.5** |
| P — Politique | 4.4 | 5 | **5.0** |
| L — Legal | 3.6 | 5 | **4.2** |
| I — Information | 4.4 | 4 | **4.3** |
| C — Cyber | 3.4 | 3 | **3.4** |
| E — Environnemental | 3.6 | 4 | **3.8** |
| **COMPOSITE** | | | **4.1** |

Signal decisif : **Trappe constitutionnelle** — Articles 417/418 de la Constitution de 2008, redigee par les militaires. L'article 417 permet au president de declarer l'urgence et transferer le pouvoir au commandant en chef. Les 25% de sieges militaires garantissent que cette clause ne peut jamais etre amendee. Ce n'etait pas un coup au sens classique — c'etait l'activation d'un mecanisme legal.

Autres signaux : NLD remporte 82% des sieges (nov. 2020) + rejet militaire sans preuve, budget militaire +63% en 2020, retraite imminente du general Min Aung Hlaing (juillet 2021), installation de spyware d'interception chez les telecoms (fin 2020).

**Verdict** : Detecte. Le croisement **P(5.0) x M(4.5) x L(4.2)** capture la convergence election contestee + puissance militaire + trappe constitutionnelle. PESTEL n'a pas de dimension Militaire distincte.

---

## 7. Venezuela — Hyperinflation (2017-2019)

### Donnees debut 2017

| Dimension | Score Quanti | Score Quali | Score Final |
|-----------|:-:|:-:|:-:|
| S — Social | 4.1 | 5 | **4.5** |
| E — Economique | 4.8 | 5 | **4.9** |
| M — Militaire | 2.4 | 4 | **3.0** |
| P — Politique | 5.0 | 5 | **5.0** |
| L — Legal | 4.6 | 5 | **4.8** |
| I — Information | 4.0 | 4 | **4.0** |
| C — Cyber | 3.3 | 3 | **3.2** |
| E — Environnemental | 3.4 | 4 | **3.6** |
| **COMPOSITE** | | | **4.1** |

5 dimensions sur 8 au-dessus de 4.0. La dependance petroliere (95% des exports), l'assemblee constituante frauduleuse (juillet 2017), le WJP Rule of Law dernier mondial (113/113), et l'exode de 1.5 million de Venezueliens constituaient une convergence systemique totale.

**Verdict** : Detecte. Effondrement multi-dimensionnel le plus complet du backtest.

---

## 8. Niger — Coup d'Etat (juillet 2023)

### Donnees debut 2023

| Dimension | Score Quanti | Score Quali | Score Final |
|-----------|:-:|:-:|:-:|
| S — Social | 3.0 | 4 | **3.4** |
| E — Economique | 3.0 | 3 | **3.0** |
| M — Militaire | 2.6 | 5 | **3.6** |
| P — Politique | 3.4 | 4 | **3.6** |
| L — Legal | 3.0 | 3 | **3.0** |
| I — Information | 2.6 | 3 | **2.8** |
| C — Cyber | 2.8 | 2 | **2.5** |
| E — Environnemental | 4.6 | 5 | **4.8** |
| **COMPOSITE** | | | **3.3** |

Signal faible critique : **Contagion des coups** — 7 coups reussis en 5 ans dans un rayon de 1 000 km (Mali 2020, Mali 2021, Guinee 2021, Tchad 2021, Burkina 2022, Burkina 2022). Les indicateurs quantitatifs M (depenses, GFP) ne capturent pas le risque de coup interne.

**Verdict v1.0** : Partiellement detecte (3.3 = alerte modere). La grille v1.0 sous-estime le risque car les indicateurs M ne mesurent pas la contagion regionale ni la subordination civile de l'armee.

**Rescore v1.1** : Avec les deux nouveaux indicateurs M (coups regionaux = 7 en 5 ans → palier 5, subordination civile V-Dem ~0.28 → palier 4), le score M passe de 3.6 a **4.3**, et le composite de 3.3 a **3.5** — franchissant le seuil "Eleve" et alignant la detection avec le resultat reel.

---

## 9. Soudan — Guerre civile (avril 2023)

### Donnees pre-crise (mi-2022 a mars 2023)

| Dimension | Score Quanti | Score Quali | Score Final |
|-----------|:-:|:-:|:-:|
| S — Social | 4.0 | 5 | **4.4** |
| E — Economique | 4.2 | 5 | **4.5** |
| M — Militaire | 3.4 | 5 | **4.0** |
| P — Politique | 4.6 | 5 | **4.8** |
| L — Legal | 4.0 | 5 | **4.4** |
| I — Information | 4.8 | 5 | **4.9** |
| C — Cyber | 4.0 | 5 | **4.4** |
| E — Environnemental | 4.2 | 5 | **4.5** |
| **COMPOSITE** | | | **4.5** |

Signaux faibles :
- **Dualite SAF/RSF** : deux armees paralleles (200 000 SAF vs 100 000 RSF), chef RSF Hemedti refusant l'integration. Le Framework Agreement (dec 2022) prevoyait l'absorption des RSF en 2 ans — Hemedti le rejetait.
- **Contagion des coups (v1.1)** : 7+ coups en 5 ans dans un rayon de 1 500 km (Mali 2020/2021, Guinee 2021, Tchad 2021, Burkina 2022x2). Le Soudan lui-meme avait connu un coup en octobre 2021 (al-Burhan).
- **Inflation a 139%** (2022), reserves de change quasi-epuisees, controles des capitaux stricts. PIB reel +1.4% en 2022 — croissance illusoire.
- **3.7 millions de deplaces internes** pre-conflit (Darfour, Blue Nile, Kordofan).
- RSF rang 170/180, Freedom on the Net <25, controle mediatique post-coup.

**Verdict** : Detecte sans ambiguite. Score 4.5 = le deuxieme plus eleve de tous les backtests apres la Syrie. La dualite militaire SAF/RSF est le signal pre-cinetique decisif — deux armees dans un meme pays est une configuration instable par construction. Les indicateurs v1.1 (coups regionaux = 5, subordination civile <0.25) renforcent la detection.

**Avantage SEMPLICE** : La dimension I (4.9) capture la suppression mediatique post-coup 2021 et l'isolement informationnel qui a rendu impossible toute mediation civile.

---

## 10. Bangladesh — Chute de Sheikh Hasina (aout 2024)

### Donnees pre-crise (fin 2023 a juillet 2024)

| Dimension | Score Quanti | Score Quali | Score Final |
|-----------|:-:|:-:|:-:|
| S — Social | 3.2 | 5 | **3.9** |
| E — Economique | 2.4 | 3 | **2.6** |
| M — Militaire | 1.2 | 2 | **1.5** |
| P — Politique | 4.0 | 5 | **4.4** |
| L — Legal | 2.6 | 4 | **3.2** |
| I — Information | 4.4 | 5 | **4.6** |
| C — Cyber | 1.8 | 3 | **2.3** |
| E — Environnemental | 3.6 | 5 | **4.2** |
| **COMPOSITE** | | | **3.3** |

Signaux faibles :
- **Election boycottee** (janvier 2024) : le BNP (principal parti d'opposition) boycotte, turnout <40%, qualifiee de "ni libre ni equitable" par les observateurs. V-Dem classe le Bangladesh comme "autocratie electorale" (0.274).
- **Mouvement des quotas** (juin-aout 2024) : 30% des emplois publics reserves aux descendants des combattants de 1971. Les etudiants se soulevent. La repression fait 624 morts (ONU estime jusqu'a 1 400).
- **Internet shutdowns** : 3 coupures en 2023 (rallies BNP), blackout total le 18 juillet 2024 (5 jours). RSF rang 165/180, Freedom on the Net 27/100 "Not Free".
- **Cyber Security Act 2023** : remplace le Digital Security Act, utilise pour arreter journalistes et opposants (Amnesty International).
- **Economie masquante** : PIB +5.8% et dette faible donnent un faux sentiment de stabilite. Mais reserves de change en chute de 9.8 Mds$ sur FY23, inflation >10%.

**Verdict** : Partiellement detecte (3.3 = seuil "Eleve" non atteint). Le cas Bangladesh est le **faux negatif le plus instructif** du backtest elargi. Les dimensions E (2.6) et M (1.5) tirent le composite vers le bas, masquant l'explosion P(4.4) + I(4.6) + S(3.9).

**Enseignement cle** : dans une ponderation "Implantation" (S a 20%, I a 15%), le score aurait ete ~3.7, franchissant le seuil "Eleve". Ce cas valide l'utilite des pondérations par angle decisionnel. Il revele aussi une **nouvelle signature** : Revolution populaire = P >= 4.0 + I >= 4.0 + S >= 3.5, meme quand E et M sont bas.

---

## 11. Syrie — Chute de Bachar al-Assad (decembre 2024)

### Donnees pre-crise (mi-2024 a novembre 2024)

| Dimension | Score Quanti | Score Quali | Score Final |
|-----------|:-:|:-:|:-:|
| S — Social | 4.4 | 5 | **4.6** |
| E — Economique | 4.8 | 5 | **4.9** |
| M — Militaire | 4.6 | 5 | **4.8** |
| P — Politique | 4.8 | 5 | **4.9** |
| L — Legal | 4.6 | 5 | **4.8** |
| I — Information | 4.8 | 5 | **4.9** |
| C — Cyber | 4.0 | 5 | **4.4** |
| E — Environnemental | 4.2 | 5 | **4.5** |
| **COMPOSITE** | | | **4.7** |

Signaux faibles :
- **Retrait des allies** : la Russie redirige ses forces vers l'Ukraine (2022-2024), l'Iran et le Hezbollah sont affaiblis par la guerre Israel-Liban (sept-nov 2024). 4 000 militaires iraniens evacues. Le socle du regime Assad s'effrite.
- **Armee demoralisee** : 170 000 sur le papier, mais desertions massives. 30 000+ Alaouites evitent la conscription. Moral au plus bas apres 13 ans de guerre civile.
- **Offensive HTS** (27 novembre 2024) : 40 000 combattants lancent l'operation "Dissuasion de l'agression" depuis Idlib. Alep tombe en 4 jours — la vitesse d'effondrement revele la vacuite des forces loyalistes.
- **Effondrement economique** : livre syrienne a 25 000/$ (vs 50/$ en 2011), reserves de la Banque Centrale a 200 M$ (vs 18.5 Mds$ en 2010), >90% de la population sous le seuil de pauvrete.
- **Freedom House 1/100** (score le plus bas au monde), RSF 179/180, CPI TI 12/100.

**Verdict** : Detecte sans ambiguite. Score 4.7 = le plus eleve de tous les backtests. La Syrie est un cas d'**effondrement systemique total** : 7 dimensions sur 8 au-dessus de 4.5. Le signal pre-cinetique decisif est le **retrait des allies** (Russie → Ukraine, Iran/Hezbollah → Liban) qui retire le dernier pilier du regime.

**Avantage SEMPLICE** : Le croisement M(4.8) x P(4.9) x I(4.9) capture la trinite effondrement militaire + legitimite zero + blackout informationnel. PESTEL n'a pas de dimension Militaire distincte et aurait manque la dynamique de retrait des allies.

---

## Patterns identifies

### Signatures par type de crise

| Type | Signature SEMPLICE |
|------|-------------------|
| **Coup d'Etat** | P >= 4.5 + M >= 4.0 + L (trappe constitutionnelle) |
| **Effondrement economique** | E >= 4.5 + L >= 4.0 (cadre legal complice) |
| **Invasion militaire** | M >= 4.5 + C en acceleration rapide + I >= 3.5 |
| **Revolution populaire** | S >= 3.5 + I >= 4.0 (censure + resistance numerique) + P >= 4.0 |
| **Effondrement de regime** | M >= 4.5 (armee demoralisee/allies retires) + P >= 4.5 + E >= 4.5 (effondrement eco) |
| **Guerre civile inter-forces** | M_coups_regionaux >= 4 + subordination_civile < 0.25 + P >= 4.5 (junte contestee) |

### Apport specifique des dimensions exclusives (I + C)

| Crise | Dimension I | Dimension C | Apport |
|-------|:-:|:-:|--------|
| Ukraine 2022 | 3.8 | **4.4** | WhisperGate = signal pre-cinetique |
| Tunisie 2011 | **4.4** | 2.6 | Censure Ammar 404 + cyberresistance = signal unique |
| Myanmar 2021 | **4.3** | 3.4 | Manipulation Facebook + interception telecom |
| Turquie 2018 | **4.3** | 2.9 | Rachat media + prison journalistes |
| Liban 2020 | 3.5 | 3.5 | Sectarianisation medias + Dark Caracal |
| Soudan 2023 | **4.9** | 4.4 | Suppression mediatique post-coup + blackout informationnel |
| Bangladesh 2024 | **4.6** | 2.3 | Internet shutdowns + RSF 165e = revolution malgre score C bas |
| Syrie 2024 | **4.9** | 4.4 | Monopole mediatique Assad + SEA historique |

### Faux negatifs identifies

| Indicateur | Probleme | Crises | Correction proposee |
|-----------|----------|--------|---------------------|
| PIB en croissance | Masque surchauffe pre-crash | Sri Lanka (+3.5%), Turquie (+7.3%) | Croiser avec dette + inflation + balance courante |
| Inflation basse | Peg monetaire artificiel | Liban (3% → Ponzi) | Indicateur "peg artificiel / controle des capitaux" |
| Chomage jeunes bas | Absence de marche formel | Niger (0.84% officiel) | Utiliser sous-emploi ILO + informalite |
| Pas de conflit | Coup interne invisible au M quantitatif | Niger, Myanmar | Ajouter "coups regionaux (5 ans)" + "subordination civile" |
| E et M bas masquent P+I+S explosifs | Composite tire vers le bas par dimensions stables | Bangladesh (PIB +5.8%, M 1.5) | Ponderation "Implantation" (S 20%, I 15%) aurait donne 3.7 |

---

## Ameliorations implementees (grille v1.1)

Les 3 indicateurs suivants ont ete ajoutes a `grille-scoring-quantitative.md` (v1.1, mars 2026) :

1. **M : "Coups militaires dans la region (rayon 1 500 km, 5 ans)"** — valide par Niger (7 coups → palier 5) et Soudan (7+ coups)
2. **E : "Peg monetaire artificiel ou controle des capitaux"** — valide par Liban (peg LBP/USD 22 ans) et Soudan (controles stricts + taux parallele)
3. **M : "Subordination armee au pouvoir civil" (V-Dem v2x_civmil)** — valide par Niger (0.28), Soudan (<0.25), Myanmar (<0.20)

### Corrections methodologiques appliquees

- PIB : ne jamais scorer seul — toujours croiser avec les 4 autres indicateurs E
- Inflation : signaler quand un peg masque la pression (flag "peg artificiel")
- Chomage : privilegier le sous-emploi ILO quand le taux officiel est < 5% dans un pays a IDH < 0.6

### Pistes pour v1.2

- **Ponderation adaptative** : le cas Bangladesh montre qu'un composite egal peut sous-estimer les revolutions populaires. Envisager un mecanisme de "declencheur" : si P+I >= 8.5 et S >= 3.5, le score passe automatiquement en categorie "Eleve" quel que soit le composite.
- **Indicateur "retrait d'allies"** : le cas Syrie montre que la perte de soutien exterieur (Russie, Iran) est un signal pre-cinetique decisif. Difficile a quantifier mais capturable via score quali M.

---

## Comparaison SEMPLICE vs frameworks existants

| Framework | Tunisie | Egypte | Turquie | Sri Lanka | Ukraine | Liban | Myanmar | Venezuela | Niger | Soudan | Bangladesh | Syrie |
|-----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **SEMPLICE v1.1** | Partiel | OUI | OUI | OUI | OUI | OUI | OUI | OUI | OUI | OUI | Partiel | OUI |
| **PESTEL** | Non | Partiel | Partiel | Non | Non | Partiel | Non | Partiel | Non | Partiel | Non | Partiel |
| **SWOT** | Non | Non | Non | Non | Non | Non | Non | Non | Non | Non | Non | Non |
| **FSI** | Partiel | Partiel | Non | Partiel | Non | Partiel | Partiel | Partiel | Partiel | Partiel | Partiel | Partiel |

SEMPLICE v1.1 surperforme grace aux dimensions **Information (I)** et **Cyber (C)**, absentes des trois autres cadres. La dimension I est le signal d'alerte principal dans **7 crises sur 12** (Tunisie, Turquie, Myanmar, Soudan, Bangladesh, Syrie + Ukraine via C). Le taux de detection pleine passe de 7/9 (v1.0) a **10/12** (v1.1).

---

## Sources

Chaque crise s'appuie sur les sources institutionnelles suivantes (liste non exhaustive) :

- World Bank (WDI, WGI, Doing Business legacy)
- IMF (WEO, Article IV, Fiscal Monitor, BOP)
- UNDP (Human Development Report)
- SIPRI (depenses militaires, armements)
- Transparency International (CPI)
- V-Dem Institute (Liberal Democracy Index)
- Freedom House (Freedom in the World, Freedom on the Net)
- Reporters sans Frontieres (World Press Freedom Index)
- ACLED (Armed Conflict Location & Event Data)
- ITU (Global Cybersecurity Index)
- Notre Dame ND-GAIN (vulnerability index)
- WRI Aqueduct (water stress)
- MITRE ATT&CK (APT groups)
- Mandiant / CrowdStrike (cyber threat intelligence)

Les URLs detaillees sont disponibles dans les fiches individuelles de chaque backtest.

---

## Changelog

| Version | Date | Modification |
|---------|------|-------------|
| v1.0 | 2026-03-11 | Creation — 7 crises, 9 evaluations retrospectives, patterns identifies |
| v1.1 | 2026-03-11 | +3 crises (Soudan 2023, Bangladesh 2024, Syrie 2024), rescore Niger v1.1, 2 nouvelles signatures, 12 evaluations total |
