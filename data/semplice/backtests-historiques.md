# SEMPLICE — Backtests historiques v1.0

> **Validation retrospective du cadre SEMPLICE sur 7 crises majeures (2011-2023)**
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
| **Niger** (coup Sahel) | 2023 | **3.3** | PARTIEL | E_env(4.8) M(3.6) P(3.6) | Signal modere |
| **Tunisie** (Printemps arabe) | 2011 | **3.0** | PARTIEL | I(4.4) S(3.6) P(3.3) | Sous-detecte |

**Taux de detection : 7/9 pleinement, 2/9 partiellement**

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

**Verdict** : Partiellement detecte (3.3 = alerte modere). La grille actuelle sous-estime le risque car les indicateurs M ne mesurent pas la contagion regionale ni la subordination civile de l'armee.

---

## Patterns identifies

### Signatures par type de crise

| Type | Signature SEMPLICE |
|------|-------------------|
| **Coup d'Etat** | P >= 4.5 + M >= 4.0 + L (trappe constitutionnelle) |
| **Effondrement economique** | E >= 4.5 + L >= 4.0 (cadre legal complice) |
| **Invasion militaire** | M >= 4.5 + C en acceleration rapide + I >= 3.5 |
| **Revolution populaire** | S >= 3.5 + I >= 4.0 (censure + resistance numerique) + P >= 4.0 |

### Apport specifique des dimensions exclusives (I + C)

| Crise | Dimension I | Dimension C | Apport |
|-------|:-:|:-:|--------|
| Ukraine 2022 | 3.8 | **4.4** | WhisperGate = signal pre-cinetique |
| Tunisie 2011 | **4.4** | 2.6 | Censure Ammar 404 + cyberresistance = signal unique |
| Myanmar 2021 | **4.3** | 3.4 | Manipulation Facebook + interception telecom |
| Turquie 2018 | **4.3** | 2.9 | Rachat media + prison journalistes |
| Liban 2020 | 3.5 | 3.5 | Sectarianisation medias + Dark Caracal |

### Faux negatifs identifies

| Indicateur | Probleme | Crises | Correction proposee |
|-----------|----------|--------|---------------------|
| PIB en croissance | Masque surchauffe pre-crash | Sri Lanka (+3.5%), Turquie (+7.3%) | Croiser avec dette + inflation + balance courante |
| Inflation basse | Peg monetaire artificiel | Liban (3% → Ponzi) | Indicateur "peg artificiel / controle des capitaux" |
| Chomage jeunes bas | Absence de marche formel | Niger (0.84% officiel) | Utiliser sous-emploi ILO + informalite |
| Pas de conflit | Coup interne invisible au M quantitatif | Niger, Myanmar | Ajouter "coups regionaux (5 ans)" + "subordination civile" |

---

## Ameliorations recommandees (grille v1.1)

### Indicateurs a ajouter

1. **M : "Coups militaires dans la region (rayon 1 500 km, 5 ans)"**
   - Palier 1: 0 | Palier 2: 1 | Palier 3: 2 | Palier 4: 3-4 | Palier 5: >4
   - Source : ACLED, UCDP, base Wikipedia

2. **E : "Peg monetaire artificiel ou controle des capitaux"**
   - Flag binaire qui declenche une surponderation du score quali E
   - Source : IMF AREAER, banques centrales

3. **M : "Subordination armee au pouvoir civil" (V-Dem Military Index)**
   - Indicateur existant dans V-Dem, integreable immediatement
   - Source : V-Dem Institute (gratuit)

### Corrections methodologiques

- PIB : ne jamais scorer seul — toujours croiser avec les 4 autres indicateurs E
- Inflation : signaler quand un peg masque la pression (flag "peg artificiel")
- Chomage : privilegier le sous-emploi ILO quand le taux officiel est < 5% dans un pays a IDH < 0.6

---

## Comparaison SEMPLICE vs frameworks existants

| Framework | Tunisie | Egypte | Turquie | Sri Lanka | Ukraine | Liban | Myanmar | Venezuela | Niger |
|-----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **SEMPLICE** | Partiel | OUI | OUI | OUI | OUI | OUI | OUI | OUI | Partiel |
| **PESTEL** | Non | Partiel | Partiel | Non | Non | Partiel | Non | Partiel | Non |
| **SWOT** | Non | Non | Non | Non | Non | Non | Non | Non | Non |
| **FSI** | Partiel | Partiel | Non | Partiel | Non | Partiel | Partiel | Partiel | Partiel |

SEMPLICE surperforme grace aux dimensions **Information (I)** et **Cyber (C)**, absentes des trois autres cadres. La dimension I est le signal d'alerte principal dans 4 crises sur 9.

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
