# SEMPLICE — Grille de Scoring Quantitative v1.0

> **Cadre méthodologique pour l'évaluation reproductible des risques géopolitiques**
> Inflexion Intelligence — Mars 2026

---

## Principes fondamentaux

### Objectif
Permettre à deux analystes indépendants d'arriver au même score (±0.5) sur la même zone, en ancrant chaque palier sur des indicateurs mesurables et des seuils explicites.

### Architecture du score

Chaque dimension reçoit un score **S_d** composé de :

```
S_d = 0.60 × Score_quanti + 0.40 × Score_quali
```

- **Score quantitatif (60%)** : moyenne des indicateurs normalisés sur l'échelle 1-5 selon les seuils ci-dessous
- **Score qualitatif (40%)** : évaluation OSINT structurée selon la grille d'appréciation (section finale)

### Score composite

```
Score_composite = (1/8) × Σ S_d    [pondération égale par défaut]
```

Pondération ajustable selon l'angle décisionnel (investissement, supply chain, implantation) — cf. section Pondérations.

---

## S — Social

### Indicateurs quantitatifs

| Indicateur | Source | Palier 1 | Palier 2 | Palier 3 | Palier 4 | Palier 5 |
|------------|--------|----------|----------|----------|----------|----------|
| **Coefficient de Gini** | World Bank | < 0.28 | 0.28–0.34 | 0.35–0.42 | 0.43–0.50 | > 0.50 |
| **IDH (Indice de Développement Humain)** | UNDP | > 0.85 | 0.75–0.85 | 0.65–0.75 | 0.50–0.65 | < 0.50 |
| **Chômage des jeunes (15-24 ans)** | ILO / World Bank | < 10% | 10–18% | 18–28% | 28–40% | > 40% |
| **Solde migratoire net (‰ pop.)** | UN DESA | > +3 | 0 à +3 | -3 à 0 | -10 à -3 | < -10 |
| **Mouvements sociaux majeurs (12 mois)** | ACLED / OSINT | 0 | 1 | 2–3 | 4–6 | > 6 |

### Calcul

```
Score_quanti_S = moyenne(Gini_norm, IDH_norm, Chômage_jeunes_norm, Migration_norm, Mouvements_norm)
```

Chaque indicateur est normalisé : la valeur observée est classée dans le palier correspondant (1 à 5). Si la valeur tombe entre deux seuils, arrondir au palier le plus proche.

### Validation rétrospective

- **Cuba** : Gini ~0.41→3, IDH 0.764→2, Chômage jeunes ~30%→4, Migration -23‰→5, Mouvements >6→5. Score_quanti = 3.8. Score_quali = 5 (crise systémique). **S = 0.6×3.8 + 0.4×5 = 4.3** ≈ score publié (5 — conservatisme justifié par la gravité du terrain)
- **Tamil Nadu** : Gini ~0.36→3, IDH 0.68→3, Chômage jeunes ~18%→2, Migration +1‰→2, Mouvements 0→1. Score_quanti = 2.2. Score_quali = 2. **S = 0.6×2.2 + 0.4×2 = 2.1** ≈ score publié (2)

---

## E — Économique

### Indicateurs quantitatifs

| Indicateur | Source | Palier 1 | Palier 2 | Palier 3 | Palier 4 | Palier 5 |
|------------|--------|----------|----------|----------|----------|----------|
| **Croissance PIB réel (%)** | IMF WEO / World Bank | > 3.5% | 1.5–3.5% | 0–1.5% | -3–0% | < -3% |
| **Inflation annuelle (%)** | IMF / Banque centrale | < 3% | 3–6% | 6–15% | 15–50% | > 50% |
| **Dette publique / PIB** | IMF Fiscal Monitor | < 40% | 40–60% | 60–90% | 90–120% | > 120% |
| **Balance courante / PIB** | IMF BOP | > +3% | 0 à +3% | -3 à 0% | -6 à -3% | < -6% |
| **Notation souveraine (Fitch/S&P/Moody's)** | Agences | AA+ à AAA | A- à AA | BBB- à BBB+ | BB+ à B- | CCC+ et < |

### Calcul

```
Score_quanti_E = moyenne(PIB_norm, Inflation_norm, Dette_norm, Balance_norm, Rating_norm)
```

### Note méthodologique

Pour les pays sous sanctions (Cuba, Iran, DPRK), certains indicateurs officiels sont indisponibles ou peu fiables. Dans ce cas :
- Utiliser les estimations IMF Article IV ou CIA World Factbook
- Signaler la source alternative dans la fiche d'évaluation
- Augmenter le poids qualitatif à 50/50 (documenté)

### Validation rétrospective

- **Cuba** : PIB -4%→5, Inflation >40%→4, Dette ~80%→3, Balance -6%→4, Rating Caa2→5. Score_quanti = 4.2. Score_quali = 5. **E = 0.6×4.2 + 0.4×5 = 4.5** ≈ score publié (5)
- **Ormuz** (zone multi-pays, pondérée Iran 50%, Golfe 30%, global 20%) : Choc Brent +65%→5, Inflation choc→4, Routes maritimes→5, Balance perturbée→4, Rating Iran CCC→5. Score_quanti = 4.6. Score_quali = 5. **E = 4.8** ≈ score publié (5)

---

## M — Militaire

### Indicateurs quantitatifs

| Indicateur | Source | Palier 1 | Palier 2 | Palier 3 | Palier 4 | Palier 5 |
|------------|--------|----------|----------|----------|----------|----------|
| **Dépenses militaires / PIB** | SIPRI | < 1.5% | 1.5–2.5% | 2.5–4% | 4–6% | > 6% |
| **Conflits armés actifs (zone 500 km)** | ACLED / UCDP | 0 | 0 (tensions) | 1 (basse intensité) | 1–2 (haute intensité) | > 2 ou conflit ouvert |
| **Global Firepower Index (rang)** | GFP | > 80e | 40–80e | 15–40e | 5–15e | Top 5 impliqué |
| **Exercices militaires majeurs (12 mois, zone)** | IISS / OTAN | 0 | 1–2 | 3–5 | 6–10 | > 10 ou mobilisation |
| **Prolifération nucléaire / missiles balistiques** | SIPRI / IAEA | Aucun risque | Zone NWFZ | Voisinage nucléaire | Programme suspect | Arsenal déployé / test récent |

### Calcul

```
Score_quanti_M = moyenne(Dépenses_norm, Conflits_norm, GFP_norm, Exercices_norm, Prolifération_norm)
```

### Note méthodologique

Le GFP Index mesure la capacité, pas la menace. Un rang élevé (Top 5) ne signifie risque 5 que si la puissance est **impliquée** dans la zone évaluée. Un pays top 5 non belligérant dans la zone = palier 1-2.

### Validation rétrospective

- **Ormuz** : Dépenses Iran 2.5%→3, Conflit actif→5, GFP USA(1)+Iran(14) impliqués→5, Exercices >10→5, Prolifération missiles Iran→4. Score_quanti = 4.4. Score_quali = 5. **M = 4.6** ≈ score publié (5)
- **Arctique** : Dépenses Russie ~4%→4, Tensions sans conflit→2, GFP Russie(2) présent→4, Exercices 5-8→4, Nucléaire Russie arsenaux→4. Score_quanti = 3.6. Score_quali = 4. **M = 3.8** ≈ score publié (4)

---

## P — Politique

### Indicateurs quantitatifs

| Indicateur | Source | Palier 1 | Palier 2 | Palier 3 | Palier 4 | Palier 5 |
|------------|--------|----------|----------|----------|----------|----------|
| **Corruption Perceptions Index (0-100)** | Transparency International | > 70 | 55–70 | 40–55 | 25–40 | < 25 |
| **V-Dem Liberal Democracy Index (0-1)** | V-Dem Institute | > 0.75 | 0.55–0.75 | 0.35–0.55 | 0.15–0.35 | < 0.15 |
| **Worldwide Governance Indicators — Political Stability** | World Bank WGI | > +0.8 | +0.2 à +0.8 | -0.5 à +0.2 | -1.5 à -0.5 | < -1.5 |
| **Cycle électoral (prochaine échéance)** | IFES / OSINT | > 3 ans | 2–3 ans | 1–2 ans | < 1 an (transition ordonnée) | Imminent ou contesté |
| **Risque de changement de régime (12 mois)** | EIU / Freedom House | Négligeable | Faible | Modéré | Élevé | Imminent / en cours |

### Calcul

```
Score_quanti_P = moyenne(CPI_norm, VDem_norm, WGI_norm, Cycle_norm, Régime_norm)
```

### Validation rétrospective

- **Cuba** : CPI 42→3, V-Dem 0.06→5, WGI -0.7→4, Cycle (pas d'élections libres)→5, Régime (crise légitimité)→4. Score_quanti = 4.2. Score_quali = 5. **P = 4.5** ≈ score publié (5)

---

## L — Légal

### Indicateurs quantitatifs

| Indicateur | Source | Palier 1 | Palier 2 | Palier 3 | Palier 4 | Palier 5 |
|------------|--------|----------|----------|----------|----------|----------|
| **Rule of Law Index (0-1)** | World Justice Project | > 0.75 | 0.60–0.75 | 0.45–0.60 | 0.30–0.45 | < 0.30 |
| **Doing Business / B-READY score** | World Bank | > 75 | 60–75 | 45–60 | 30–45 | < 30 |
| **Régime de sanctions internationales** | OFAC / EU / UN | Aucune | Ciblées (individus) | Sectorielles | Larges (embargo partiel) | Embargo total / extraterritorial |
| **Protection PI (IP Index, 0-100)** | US Chamber / GIPC | > 75 | 55–75 | 40–55 | 25–40 | < 25 |
| **Exécution des contrats (délai, jours)** | World Bank legacy | < 300 | 300–500 | 500–700 | 700–1000 | > 1000 ou inexécutable |

### Calcul

```
Score_quanti_L = moyenne(RoL_norm, Business_norm, Sanctions_norm, PI_norm, Contrats_norm)
```

### Validation rétrospective

- **Cuba** : RoL ~0.35→4, Business N/A (embargo)→5, Sanctions Helms-Burton extraterritorial→5, PI <25→5, Contrats inexécutables→5. Score_quanti = 4.8. Score_quali = 5. **L = 4.9** ≈ score publié (5)

---

## I — Information (EXCLUSIVE SEMPLICE)

### Indicateurs quantitatifs

| Indicateur | Source | Palier 1 | Palier 2 | Palier 3 | Palier 4 | Palier 5 |
|------------|--------|----------|----------|----------|----------|----------|
| **Classement RSF (rang /180)** | Reporters sans Frontières | 1–30 | 31–70 | 71–120 | 121–160 | 161–180 |
| **Freedom on the Net (0-100)** | Freedom House | > 70 (libre) | 55–70 | 40–55 (partiellement libre) | 25–40 | < 25 (non libre) |
| **Opérations d'influence documentées (12 mois)** | EU DisinfoLab / DFRLab / VIGINUM | 0 | 1–2 isolées | 3–5 | 6–10 systématiques | > 10 ou guerre cognitive active |
| **Censure internet (% sites bloqués estimé)** | OONI / AccessNow | < 1% | 1–5% | 5–15% | 15–40% | > 40% ou coupures totales |
| **Contrôle médias d'État (% audience)** | RSF / IREX MSI | < 15% | 15–30% | 30–50% | 50–80% | > 80% ou monopole |

### Calcul

```
Score_quanti_I = moyenne(RSF_norm, FotN_norm, Influence_norm, Censure_norm, Médias_norm)
```

### Note méthodologique

La dimension Information est **exclusive à SEMPLICE**. Elle capture la guerre cognitive et informationnelle absente de PESTEL (qui subsume l'information sous "Technologique") et du FSI (qui ne traite que de la presse). Les opérations d'influence comptent même si elles émanent d'acteurs **extérieurs** à la zone évaluée.

### Validation rétrospective

- **Cuba** : RSF rang 168→5, FotN 22→5, Influence (contrôle total)→4, Censure >40% + coupures→5, Médias >90%→5. Score_quanti = 4.8. Score_quali = 4 (dissidence numérique croissante tempère). **I = 0.6×4.8 + 0.4×4 = 4.5** ≈ score publié (5 — ajusté par gravité infrastructure)

---

## C — Cyber (EXCLUSIVE SEMPLICE)

### Indicateurs quantitatifs

| Indicateur | Source | Palier 1 | Palier 2 | Palier 3 | Palier 4 | Palier 5 |
|------------|--------|----------|----------|----------|----------|----------|
| **National Cyber Security Index (0-100)** | e-Governance Academy (NCSI) | > 75 | 55–75 | 40–55 | 25–40 | < 25 |
| **Global Cybersecurity Index (0-100)** | ITU (GCI) | > 85 | 65–85 | 45–65 | 25–45 | < 25 |
| **Incidents cyber majeurs (12 mois, zone)** | Mandiant / CrowdStrike / ANSSI | 0 | 1–2 mineurs | 1 majeur ou 3+ mineurs | 2–3 majeurs | > 3 majeurs ou cyberguerre |
| **Capacité offensive étatique (APT groups actifs)** | MITRE ATT&CK / Mandiant | Aucun actif | 1–2 (surveillance) | 3–5 (espionnage) | 6–10 (destructif) | > 10 ou cyber opérations offensives actives |
| **Exposition infrastructure critique** | ENISA / CISA / national CERT | Résiliente | Faible exposition | Modérée | Élevée | Critique (SCADA/ICS exposés) |

### Calcul

```
Score_quanti_C = moyenne(NCSI_norm, GCI_norm, Incidents_norm, APT_norm, Infra_norm)
```

### Note méthodologique

La dimension Cyber est **exclusive à SEMPLICE**. Le scoring capture à la fois :
- La **résilience** de la zone (NCSI, GCI) — capacité à encaisser
- La **menace** pesant sur la zone (APT, incidents) — probabilité d'attaque
- L'**exposition** des infrastructures critiques — impact potentiel

Un pays avec un NCSI élevé mais faisant face à de nombreux APT hostiles peut avoir un score élevé (ex : Estonie, NCSI 90 mais exposition géopolitique Russie → score 2-3, pas 1).

### Validation rétrospective

- **Ormuz** : NCSI Iran ~35→4, GCI Iran ~40→3, Incidents APT33/35 actifs→4, APT Iran offensif→4, Infra pétrolière SCADA→5. Score_quanti = 4.0. Score_quali = 5 (Shamoon precedent + conflit actif). **C = 0.6×4.0 + 0.4×5 = 4.4** ≈ score publié (4.5)

---

## E — Environnemental

### Indicateurs quantitatifs

| Indicateur | Source | Palier 1 | Palier 2 | Palier 3 | Palier 4 | Palier 5 |
|------------|--------|----------|----------|----------|----------|----------|
| **ND-GAIN Country Index (0-100)** | Notre Dame GAIN | > 65 | 50–65 | 40–50 | 30–40 | < 30 |
| **Aqueduct Water Stress (0-5)** | WRI Aqueduct | < 1.0 | 1.0–2.0 | 2.0–3.0 | 3.0–4.0 | > 4.0 |
| **Dépendance ressources extractives (% exports)** | World Bank / EITI | < 10% | 10–25% | 25–45% | 45–70% | > 70% |
| **Catastrophes naturelles majeures (5 ans, zone)** | EM-DAT / CRED | 0 | 1–2 | 3–5 | 6–10 | > 10 |
| **Progression transition énergétique** | IEA / IRENA (% renouvelables) | > 50% | 30–50% | 15–30% | 5–15% | < 5% |

### Calcul

```
Score_quanti_E = moyenne(NDGAIN_norm, Water_norm, Ressources_norm, Catastrophes_norm, Transition_norm)
```

### Validation rétrospective

- **Cuba** : ND-GAIN ~42→3, Water stress modéré→2, Dépendance pétrole importé→4, Ouragans fréquents→4, Transition <5%→5. Score_quanti = 3.6. Score_quali = 4. **E_env = 3.8** ≈ score publié (4)

---

## Score qualitatif — Grille d'appréciation structurée

Le score qualitatif (40%) est attribué selon une grille OSINT structurée. L'analyste documente **obligatoirement** :

### Sources requises (minimum par dimension)

| Qualité | Type | Minimum requis |
|---------|------|---------------|
| **A** | Institutionnelle (ONU, FMI, Banque Mondiale, agence gouvernementale) | 1 source |
| **B** | Agence de presse (Reuters, AFP, AP, Bloomberg) | 1 source |
| **C** | Média spécialisé (Jane's, IISS, Stratfor, Flashpoint, Mandiant) | 1 source |
| **D** | Signal faible (réseaux sociaux vérifiés, publications locales, leaks) | 0 (optionnel mais valorisé) |

### Grille d'appréciation qualitative

| Score | Descripteur | Critères |
|-------|------------|----------|
| **1** | Stable / Favorable | Aucun signal négatif, trajectoire positive confirmée par sources A+B |
| **2** | Tensions mineures | Signaux isolés, pas de tendance systémique, sources divergentes |
| **3** | Risque matérialisé | Tendance négative confirmée par ≥2 sources indépendantes, impact mesurable |
| **4** | Crise active | Convergence des sources A+B+C, impact sévère, dynamique d'escalade |
| **5** | Rupture / Effondrement | Consensus des sources, pas de mécanisme de correction visible, irréversibilité à horizon 12 mois |

### Règles anti-biais

1. **Biais de récence** : l'événement le plus récent ne doit pas dominer. Évaluer la tendance sur 12 mois minimum.
2. **Biais de confirmation** : documenter au moins 1 source contradictoire par dimension (si elle existe).
3. **Ancrage** : ne pas consulter le score précédent de la zone avant de scorer. Scorer "à l'aveugle" puis comparer.
4. **Divergence inter-analystes** : si l'écart entre deux analystes dépasse 1.0 sur une dimension, arbitrage obligatoire avec documentation.

---

## Pondérations par angle décisionnel

### Pondération par défaut

```
Composite = (1/8) × (S + E + M + P + L + I + C + E_env)
```

### Pondérations ajustées

| Dimension | Défaut | Investissement | Supply Chain | Implantation |
|-----------|--------|---------------|--------------|-------------|
| S — Social | 12.5% | 10% | 10% | **20%** |
| E — Économique | 12.5% | **20%** | 10% | 10% |
| M — Militaire | 12.5% | 10% | **20%** | 10% |
| P — Politique | 12.5% | **15%** | 10% | 15% |
| L — Légal | 12.5% | **15%** | 10% | **20%** |
| I — Information | 12.5% | 10% | 10% | **15%** |
| C — Cyber | 12.5% | 10% | **20%** | 5% |
| E — Environnemental | 12.5% | 10% | **20%** | 5% |
| **Total** | **100%** | **100%** | **100%** | **100%** |

L'analyste **doit justifier** le choix de pondération dans la fiche d'évaluation. La pondération par défaut (égale) est utilisée pour le score affiché au scoreboard.

---

## Fiche d'évaluation type

Chaque évaluation SEMPLICE publiée doit contenir :

```
ZONE : [Nom]
DATE : [JJ/MM/AAAA]
ANALYSTE : [Nom ou pseudonyme]
ANGLE : [Défaut / Investissement / Supply Chain / Implantation]
VERSION GRILLE : v1.0

| Dimension | Score Quanti | Score Quali | Score Final | Trend | Sources clés |
|-----------|-------------|-------------|-------------|-------|-------------|
| S         |             |             |             |       |             |
| E         |             |             |             |       |             |
| M         |             |             |             |       |             |
| P         |             |             |             |       |             |
| L         |             |             |             |       |             |
| I         |             |             |             |       |             |
| C         |             |             |             |       |             |
| E_env     |             |             |             |       |             |
| COMPOSITE |             |             |             |       |             |

SCÉNARIOS :
- Optimiste (X%) : ...
- Central (X%) : ...
- Pessimiste (X%) : ...
[Σ probabilités = 100%]

IMPACT SECTORIEL :
- [Secteur 1] : [Niveau risque] — [Action recommandée]
- [Secteur 2] : ...

SOURCES (minimum 3A + 3B + 3C par évaluation) :
- A1 : ...
- B1 : ...
- C1 : ...

DIVERGENCES / LIMITES :
- [Données manquantes, biais identifiés, source contradictoire]

VERSION HISTORY :
- v1 [date] : Évaluation initiale
- v2 [date] : Mise à jour [raison]
```

---

## Annexe — Table des sources par dimension

| Dim. | Indicateur | Source | URL | Fréquence | Accès |
|------|-----------|--------|-----|-----------|-------|
| S | Gini | World Bank | data.worldbank.org | Annuel | Gratuit |
| S | IDH | UNDP | hdr.undp.org | Annuel | Gratuit |
| S | Chômage jeunes | ILO / World Bank | ilostat.ilo.org | Annuel | Gratuit |
| S | Migration nette | UN DESA | population.un.org | Bisannuel | Gratuit |
| S | Mouvements sociaux | ACLED | acleddata.com | Temps réel | Freemium |
| E | PIB réel | IMF WEO | imf.org/weo | Semestriel | Gratuit |
| E | Inflation | IMF / BC nationales | imf.org | Mensuel | Gratuit |
| E | Dette/PIB | IMF Fiscal Monitor | imf.org | Semestriel | Gratuit |
| E | Balance courante | IMF BOP | imf.org | Trimestriel | Gratuit |
| E | Rating souverain | Fitch / S&P / Moody's | fitchratings.com | Ad hoc | Payant* |
| M | Dépenses mil. | SIPRI | sipri.org | Annuel | Gratuit |
| M | Conflits | ACLED / UCDP | ucdp.uu.se | Temps réel | Gratuit |
| M | Global Firepower | GFP | globalfirepower.com | Annuel | Gratuit |
| M | Exercices | IISS Military Balance | iiss.org | Annuel | Payant |
| M | Prolifération | SIPRI / IAEA | sipri.org | Annuel | Gratuit |
| P | CPI | Transparency Intl | transparency.org | Annuel | Gratuit |
| P | V-Dem | V-Dem Institute | v-dem.net | Annuel | Gratuit |
| P | WGI | World Bank | info.worldbank.org/governance | Annuel | Gratuit |
| P | Élections | IFES | electionguide.org | Continu | Gratuit |
| P | Risque régime | EIU / Freedom House | freedomhouse.org | Annuel | Freemium |
| L | Rule of Law | World Justice Project | worldjusticeproject.org | Annuel | Gratuit |
| L | B-READY | World Bank | worldbank.org | Annuel | Gratuit |
| L | Sanctions | OFAC / EU / UN | treasury.gov/ofac | Continu | Gratuit |
| L | IP Index | US Chamber GIPC | uschamber.com | Annuel | Gratuit |
| L | Contrats | World Bank legacy | worldbank.org | Archivé | Gratuit |
| I | Classement RSF | Reporters sans Frontières | rsf.org | Annuel | Gratuit |
| I | Freedom on the Net | Freedom House | freedomhouse.org | Annuel | Gratuit |
| I | Opérations influence | EU DisinfoLab / DFRLab | disinfo.eu | Continu | Gratuit |
| I | Censure internet | OONI | ooni.org | Temps réel | Gratuit |
| I | Contrôle médias | RSF / IREX MSI | irex.org | Annuel | Gratuit |
| C | NCSI | e-Governance Academy | ncsi.ega.ee | Trimestriel | Gratuit |
| C | GCI | ITU | itu.int | Bisannuel | Gratuit |
| C | Incidents cyber | Mandiant / CrowdStrike | mandiant.com | Continu | Payant* |
| C | APT actifs | MITRE ATT&CK | attack.mitre.org | Continu | Gratuit |
| C | Infra critique | ENISA / CISA | enisa.europa.eu | Annuel | Gratuit |
| E | ND-GAIN | Notre Dame | gain.nd.edu | Annuel | Gratuit |
| E | Water Stress | WRI Aqueduct | wri.org/aqueduct | Annuel | Gratuit |
| E | Dépendance extractive | World Bank / EITI | eiti.org | Annuel | Gratuit |
| E | Catastrophes | EM-DAT / CRED | emdat.be | Temps réel | Gratuit |
| E | Transition énergie | IEA / IRENA | iea.org | Annuel | Gratuit |

\* Les sources payantes ont des alternatives gratuites partielles documentées dans les notes méthodologiques.

---

## Changelog

| Version | Date | Modification |
|---------|------|-------------|
| v1.0 | 2026-03-11 | Création — 8 dimensions, 40 indicateurs, seuils, validations rétrospectives |
