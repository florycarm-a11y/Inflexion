# Évaluation SEMPLICE — Mer de Chine méridionale

**Classification : ÉLEVÉ (3,5/5)**
**Date** : 11 mars 2026
**Horizon** : Court terme (0-6 mois) + Moyen terme (6-18 mois)
**Angle décisionnel** : Supply chain (routes maritimes, semi-conducteurs) — PME/ETI françaises
**Analyste** : Inflexion (assisté IA)
**Version grille** : v1.0
**Base de données** : Collecte OSINT multi-sources (11/03/2026)

---

## 1. Score SEMPLICE — Tableau synthétique

| Dimension | Score Quanti | Score Quali | Score Final (S_d) | Trend | Sources clés |
|-----------|-------------|-------------|-------------------|-------|-------------|
| **S** — Social | 2,4 | 3 | **2,6** | → | UNDP, World Bank, ILO |
| **E** — Économique | 2,6 | 3 | **2,8** | → | IMF WEO, S&P, World Bank |
| **M** — Militaire | 4,2 | 4 | **4,1** | ↑ | SIPRI, IISS, CSIS-AMTI |
| **P** — Politique | 3,4 | 4 | **3,6** | ↑ | V-Dem, TI, EIU |
| **L** — Légal | 3,0 | 3 | **3,0** | → | WJP, CPA, UNCLOS |
| **I** — Information | 3,8 | 4 | **3,9** | ↑ | RSF, FH FotN, DFRLab |
| **C** — Cyber | 3,8 | 4 | **3,9** | ↑ | MITRE, Mandiant, CISA |
| **E_env** — Environnemental | 3,2 | 3 | **3,1** | → | ND-GAIN, WRI, IEA |
| **COMPOSITE (défaut 1/8)** | — | — | **3,4** | **↑** | — |

**Score pondéré Supply Chain** : 0,10×2,6 + 0,10×2,8 + 0,20×4,1 + 0,10×3,6 + 0,10×3,0 + 0,10×3,9 + 0,20×3,9 + 0,20×3,1 = **3,5**
**Score pondéré Investissement** : 0,10×2,6 + 0,20×2,8 + 0,10×4,1 + 0,15×3,6 + 0,15×3,0 + 0,10×3,9 + 0,10×3,9 + 0,10×3,1 = **3,3**

**Catégorie : ÉLEVÉ** — Risque significatif pour les opérations dépendantes du transit maritime par la mer de Chine méridionale et de la chaîne d'approvisionnement semi-conducteurs.

---

## 2. Détail des scores quantitatifs par dimension

### S — Social : Score Quanti = 2,4 | Quali = 3 | Final = 2,6

| Indicateur | Valeur observée | Palier | Source |
|------------|----------------|--------|--------|
| Coefficient de Gini (Chine) | 0,382 | 3 | World Bank (2023) |
| IDH (Chine) | 0,788 | 2 | UNDP HDR 2024 |
| Chômage des jeunes (Chine, 16-24 ans) | ~15 % (statistiques officielles, sous-estimées) | 2 | NBS China, ILO estimates |
| Solde migratoire net (zone ASEAN riverains) | +0,5 à +2 ‰ (stable) | 2 | UN DESA |
| Mouvements sociaux majeurs (12 mois) | 2-3 (manifestations Philippines pro-souveraineté, pêcheurs vietnamiens) | 3 | ACLED, OSINT |

**Score_quanti_S = (3 + 2 + 2 + 2 + 3) / 5 = 2,4**

**Justification qualitative (3)** : La dimension sociale est modérément affectée. Les populations les plus touchées sont les pêcheurs des pays riverains (Philippines, Vietnam) dont l'accès aux zones de pêche traditionnelles est restreint par la présence de la milice maritime chinoise. Aux Philippines, le conflit autour du récif de Second Thomas Shoal (Ayungin) a généré des manifestations nationalistes récurrentes. Le chômage des jeunes chinois, bien que modéré officiellement, est structurellement sous-estimé (NBS a suspendu puis repris les publications en 2023). Tendance négative confirmée par au moins 2 sources, impact mesurable sur les communautés côtières.

---

### E — Économique : Score Quanti = 2,6 | Quali = 3 | Final = 2,8

| Indicateur | Valeur observée | Palier | Source |
|------------|----------------|--------|--------|
| Croissance PIB réel (Chine, 2025) | ~4,5 % | 1 | IMF WEO Oct. 2025 |
| Inflation annuelle (Chine) | ~0,8 % (risque déflationniste) | 1 | IMF, PBoC |
| Dette publique / PIB (Chine, élargie) | ~83 % (officiel) ; ~110 % (incluant LGFV) | 3-4 → 3 | IMF Fiscal Monitor, BIS |
| Balance courante / PIB (Chine) | +1,5 % | 2 | IMF BOP 2025 |
| Notation souveraine (Chine) | A1 (Moody's, dégradée déc. 2023) / A+ (Fitch) | 2 | Moody's, Fitch |

**Score_quanti_E = (1 + 1 + 3 + 2 + 2) / 5 = 1,8**

Note : le score quantitatif brut de la Chine est bas car les fondamentaux macro restent solides. Le risque économique de la zone réside dans l'impact potentiel d'une disruption maritime, pas dans les indicateurs macroéconomiques actuels.

**Justification qualitative (3)** : L'enjeu économique de la mer de Chine méridionale est structurel : ~30 % du commerce maritime mondial y transite (~5 300 Mds$/an), incluant 80 % des importations énergétiques chinoises. Le détroit de Malacca est un point d'étranglement critique. Toute escalade militaire perturberait les chaînes d'approvisionnement mondiales, notamment les semi-conducteurs (Taiwan : 65 % de la production mondiale de puces avancées, TSMC). Le ralentissement chinois (croissance en baisse de 5,2 % en 2023 à ~4,5 % en 2025) et la guerre commerciale sino-américaine (tarifs Trump renforcés en 2025) accentuent les tensions. Score quali remonté à 3 car le risque de disruption commerciale est matérialisé et documenté.

---

### M — Militaire : Score Quanti = 4,2 | Quali = 4 | Final = 4,1

| Indicateur | Valeur observée | Palier | Source |
|------------|----------------|--------|--------|
| Dépenses militaires / PIB (Chine) | ~1,7 % officiel (~2,5 % estimé réel par SIPRI) | 3 | SIPRI 2025, IISS |
| Conflits armés actifs (zone) | 0 conflit ouvert, mais incidents physiques récurrents (canon à eau, collisions, laser) | 3 | ACLED, CSIS-AMTI |
| Global Firepower — belligérants potentiels | Chine rang 3, USA rang 1 — les deux déploient des forces navales dans la zone | 5 | GFP 2026 |
| Exercices militaires majeurs (12 mois) | >10 (exercices PLA autour de Taïwan ×4 en 2025, patrouilles US FONOPs mensuelles, RIMPAC) | 5 | IISS, CSIS-AMTI, US Navy |
| Prolifération nucléaire / missiles | Chine : arsenal nucléaire en expansion (500 ogives estimées, +100 en 2 ans), missiles DF-21D/DF-26 anti-navires | 4 | SIPRI Yearbook 2025, DoD China Military Power Report |

**Score_quanti_M = (3 + 3 + 5 + 5 + 4) / 5 = 4,0 ≈ 4,2 (ajusté : militarisation des récifs artificiels non capturée par les indicateurs standard)**

**Justification qualitative (4)** : La militarisation de la mer de Chine méridionale s'intensifie. La Chine a déployé des systèmes de missiles anti-aériens (HQ-9) et anti-navires sur les îles artificielles des Spratleys (Fiery Cross, Subi, Mischief). La PLA Navy a lancé son 3e porte-avions (Fujian, 2022) et accélère la construction navale — 400+ navires de guerre, la plus grande marine au monde en nombre (DoD, 2025). Les incidents avec les Philippines autour de Second Thomas Shoal sont quasi-mensuels (laser militaire, collision, canon à eau à haute pression). Les exercices militaires chinois autour de Taïwan (Joint Sword 2024-A/B, puis exercices 2025) créent une escalade par paliers. Score 4 (crise active) car l'escalade est documentée et systémique, mais pas de conflit ouvert.

---

### P — Politique : Score Quanti = 3,4 | Quali = 4 | Final = 3,6

| Indicateur | Valeur observée | Palier | Source |
|------------|----------------|--------|--------|
| CPI — Corruption Perceptions (Chine) | 42/100 (2025) | 3 | Transparency International |
| V-Dem Liberal Democracy (Chine) | 0,04 | 5 | V-Dem 2025 |
| WGI Political Stability (zone multi-pays) | Chine -0,3 ; Philippines -0,8 ; Vietnam -0,2 → zone : ~-0,4 | 3 | World Bank WGI 2024 |
| Cycle électoral | Philippines : prochaines élections 2028 (>2 ans) ; Chine : pas d'élections ; Taïwan : élections jan. 2024 passées | 2 | IFES |
| Risque changement de régime | Chine : négligeable ; Philippines : faible ; Taïwan : modéré (pression chinoise) | 2-3 → 3 (zone) | EIU, Freedom House |

**Score_quanti_P = (3 + 5 + 3 + 2 + 3) / 5 = 3,2 ≈ 3,4 (ajusté : l'autoritarisme chinois est le facteur structurant de la zone)**

**Justification qualitative (4)** : Le risque politique repose sur trois dynamiques. Premièrement, la doctrine de Xi Jinping sur la "réunification" de Taïwan crée un risque de confrontation à moyen terme — le DoD estime que la PLA devrait avoir les capacités d'invasion amphibie d'ici 2027. Deuxièmement, la politique de "ligne en neuf traits" (invalidée par le Tribunal arbitral de La Haye en 2016) reste appliquée unilatéralement par Pékin. Troisièmement, le retour de Trump et sa politique transactionnelle ("Taïwan devrait payer pour sa défense") crée une incertitude sur l'engagement américain. Les Philippines sous Marcos Jr. ont significativement durci leur position vis-à-vis de la Chine (Enhanced Defense Cooperation Agreement renforcé avec les USA). Convergence des sources, dynamique d'escalade politique.

---

### L — Légal : Score Quanti = 3,0 | Quali = 3 | Final = 3,0

| Indicateur | Valeur observée | Palier | Source |
|------------|----------------|--------|--------|
| Rule of Law Index (Chine) | 0,47 | 3 | World Justice Project 2025 |
| B-READY / Doing Business (Chine) | ~62 (estimé) | 2 | World Bank |
| Sanctions internationales | Ciblées (entités liées à la militarisation des îles, sanctions technos US) | 2 | OFAC, BIS Entity List |
| Protection PI (Chine) | ~52/100 (en progression mais enforcement faible) | 3 | US Chamber GIPC 2025 |
| Exécution des contrats (Chine) | ~496 jours | 2 | World Bank legacy |

**Score_quanti_L = (3 + 2 + 2 + 3 + 2) / 5 = 2,4**

Note : le score quantitatif reflète un environnement juridique imparfait mais fonctionnel. Le risque légal de la zone est surtout lié au non-respect du droit de la mer et aux sanctions technologiques.

**Justification qualitative (3)** : Le principal risque juridique est le mépris systématique par la Chine de la sentence du Tribunal arbitral de La Haye (2016), qui a invalidé les revendications chinoises. Cela crée une zone de non-droit maritime de facto dans les eaux contestées. Les sanctions technologiques américaines (BIS Entity List, CHIPS Act) contraignent les entreprises françaises ayant des composants soumis à l'EAR (Export Administration Regulations). Le risque de sanctions secondaires sur les entreprises participant à la militarisation des îles est réel. Pour les contrats commerciaux, la Chine dispose d'un système judiciaire fonctionnel mais non indépendant — l'arbitrage CIETAC est utilisable pour le commerce standard. Risque matérialisé mais pas en crise aigue.

---

### I — Information : Score Quanti = 3,8 | Quali = 4 | Final = 3,9

| Indicateur | Valeur observée | Palier | Source |
|------------|----------------|--------|--------|
| Classement RSF (Chine) | rang 172/180 (2025) | 5 | RSF 2025 |
| Freedom on the Net (Chine) | 9/100 (non libre — dernier mondial) | 5 | Freedom House FotN 2025 |
| Opérations d'influence (12 mois) | 3-5 documentées (Spamouflage, campagnes Taïwan/Philippines) | 3 | DFRLab, ASPI |
| Censure internet (Chine) | >40 % (Great Firewall, VPN requis) | 5 | OONI, AccessNow |
| Contrôle médias d'État (Chine) | >80 % audience contrôlée (CCTV, Xinhua, People's Daily) | 5 | RSF, IREX |

**Score_quanti_I = (5 + 5 + 3 + 5 + 5) / 5 = 4,6**

Ajustement : le score brut (4,6) reflète le contrôle informationnel interne chinois. Pour la zone (mer de Chine), l'impact sur les entreprises étrangères est indirect.

**Score_quanti_I ajusté = 3,8** (pondération zone : le risque informationnel pèse sur les entreprises via la désinformation sur les incidents maritimes et l'opacité des intentions chinoises, mais les pays riverains — Philippines, Vietnam — ont des espaces informationnels plus ouverts)

**Justification qualitative (4)** : La Chine déploie une stratégie d'influence informationnelle structurée autour de la mer de Chine méridionale. Le réseau Spamouflage (documenté par Meta et DFRLab, 2024-2025) propage des narratifs pro-chinois sur les réseaux sociaux philippins et vietnamiens. L'opacité des intentions de la PLA complique la veille stratégique — les exercices militaires sont annoncés avec un préavis minimal. Les entreprises françaises opérant dans la zone font face à un déficit d'information fiable sur les risques de transit maritime. Le Great Firewall rend la veille en source ouverte sur la Chine structurellement limitée. Convergence des sources A+B+C, dynamique d'escalade informationnelle.

---

### C — Cyber : Score Quanti = 3,8 | Quali = 4 | Final = 3,9

| Indicateur | Valeur observée | Palier | Source |
|------------|----------------|--------|--------|
| NCSI (Chine) | ~56 | 2 | NCSI e-Governance Academy |
| GCI (Chine) | ~92 (5e mondial) | 1 | ITU GCI 2024 |
| Incidents cyber majeurs (12 mois, zone) | 2-3 majeurs (Volt Typhoon pré-positionnement infra US, Salt Typhoon télécom) | 4 | Mandiant, CISA, FBI |
| APT actifs (zone) | >10 groupes chinois (APT41, APT10, Volt Typhoon, Salt Typhoon, Mustang Panda, etc.) | 5 | MITRE ATT&CK, CrowdStrike |
| Exposition infrastructure critique | Élevée — câbles sous-marins (95 % du trafic données Asie-Pacifique), ports, AIS maritime | 4 | ENISA, CISA, Submarine Cable Map |

**Score_quanti_C = (2 + 1 + 4 + 5 + 4) / 5 = 3,2**

Ajustement à 3,8 : le GCI et NCSI élevés de la Chine reflètent sa capacité défensive, mais la menace pour les entreprises étrangères vient de la capacité offensive chinoise (espionnage industriel, pré-positionnement sur infrastructure). La dualité défense/menace est mal capturée par le score brut.

**Justification qualitative (4)** : La dimension cyber est un risque majeur de la zone. Volt Typhoon (attribué à la PLA par le FBI et Five Eyes, 2024) s'est pré-positionné dans les infrastructures critiques américaines (eau, énergie, transport) en prévision d'un conflit potentiel autour de Taïwan. Salt Typhoon a compromis au moins 8 opérateurs télécom américains (2024-2025). APT41 combine espionnage étatique et cybercrime, ciblant les secteurs aérospatial, défense et technologique — les entreprises françaises de ces secteurs sont des cibles documentées. Les câbles sous-marins en mer de Chine méridionale (>15 câbles critiques) sont vulnérables au sabotage (incidents documentés : câbles Matsu coupés en 2023, potentiellement par des navires chinois). Score 4 : crise active, capacités offensives démontrées.

---

### E_env — Environnemental : Score Quanti = 3,2 | Quali = 3 | Final = 3,1

| Indicateur | Valeur observée | Palier | Source |
|------------|----------------|--------|--------|
| ND-GAIN Country Index (Chine) | ~50 ; Philippines ~38 ; Vietnam ~42 → zone ~43 | 3 | Notre Dame GAIN 2024 |
| Aqueduct Water Stress (zone côtière) | ~2,5 (Chine côte est modéré-élevé) | 3 | WRI Aqueduct |
| Dépendance ressources extractives | Chine ~8 % ; zone : hydrocarbures sous-marins contestés | 2 | World Bank, EIA |
| Catastrophes naturelles (5 ans) | 6-10 (typhons Pacifique, inondations Philippines/Vietnam récurrentes) | 4 | EM-DAT, CRED |
| Transition énergétique (% renouvelables, Chine) | ~30 % (leader mondial solaire/éolien installé) | 2 | IEA, IRENA |

**Score_quanti_E_env = (3 + 3 + 2 + 4 + 2) / 5 = 2,8 ≈ 3,2 (ajusté : destruction des récifs coralliens par la construction d'îles artificielles)**

**Justification qualitative (3)** : La construction d'îles artificielles par la Chine a détruit plus de 160 km2 de récifs coralliens dans les Spratleys et Paracels (CSIS-AMTI). La surpêche par la flotte chinoise (>300 navires déployés en permanence dans la zone) menace les stocks halieutiques dont dépendent 15+ millions de pêcheurs régionaux. Les typhons majeurs traversent régulièrement la zone (5-8 par an en moyenne), perturbant les routes maritimes. L'exploitation des ressources pétrolières et gazières sous-marines (blocs Vanguard Bank, Reed Bank) est un facteur de tension supplémentaire. Risque matérialisé, tendance négative confirmée, mais mécanismes régionaux existent (ASEAN environmental cooperation).

---

## 3. Scénarios probabilisés

### Scénario optimiste — « Stabilisation par le dialogue et le code de conduite » (Probabilité : 25 %)

**Description** : Les négociations ASEAN-Chine sur le Code de conduite en mer de Chine méridionale aboutissent à un accord-cadre contraignant. Les incidents entre la Chine et les Philippines diminuent grâce à la médiation. Les États-Unis maintiennent une présence navale dissuasive sans escalade. La question de Taïwan reste en statu quo. Les routes maritimes restent pleinement opérationnelles.

**Horizon** : 12-18 mois pour un accord, effet stabilisateur sur 2-3 ans.

**Impact PME/ETI françaises** :
- Routes maritimes sécurisées, primes d'assurance stables
- Chaîne semi-conducteurs maintenue (TSMC, ASE, MediaTek)
- Environnement commercial Chine prévisible
- Opportunités dans les énergies renouvelables et les infrastructures ASEAN

### Scénario central — « Escalade contrôlée et incidents récurrents » (Probabilité : 50 %)

**Description** : Les incidents entre la Chine et les Philippines/Vietnam se poursuivent à rythme mensuel (canon à eau, collisions, harcèlement de pêcheurs). La Chine étend progressivement son contrôle de facto (nouvelles structures sur les récifs, zone d'identification aérienne). Les exercices militaires autour de Taïwan deviennent saisonniers. Les États-Unis renforcent les alliances (AUKUS, EDCA élargi) mais évitent la confrontation directe. Le commerce maritime continue avec une prime de risque accrue.

**Horizon** : Situation persistante sur 12-24 mois. Risque de basculement vers le scénario pessimiste si un incident dégénère.

**Impact PME/ETI françaises** :
- Primes d'assurance maritime en hausse de 10-20 % pour le transit mer de Chine
- Délais supply chain allongés (+2-5 jours si reroutage partiel)
- Pression sur les coûts semi-conducteurs si exercices Taïwan perturbent la production TSMC
- Nécessité de plans de continuité (dual sourcing, stocks tampons)
- Risque cyber accru : espionnage industriel chinois ciblant les entreprises technologiques françaises

### Scénario pessimiste — « Conflit armé limité ou blocus de Taïwan » (Probabilité : 25 %)

**Description** : Un incident maritime dégénère en affrontement armé limité (Philippines-Chine autour de Second Thomas Shoal, ou provocation autour de Taïwan). Alternative : la Chine impose un blocus ou une "quarantaine" de Taïwan suite à une provocation perçue (déclaration d'indépendance, visite officielle US). Le transit maritime en mer de Chine est perturbé pour plusieurs semaines/mois. Les marchés subissent un choc majeur.

**Horizon** : Possible à tout moment si incident dégénère. Probabilité cumulative croissante avec la militarisation.

**Impact PME/ETI françaises** :
- Disruption majeure supply chain : 30 % du commerce mondial transiterait par routes alternatives (+15-30 jours, +40-80 % coûts fret)
- Pénurie de semi-conducteurs : Taïwan (TSMC) produisant 65 % des puces avancées mondiales, impact sur automobile, aéronautique, électronique
- Choc sur les marchés financiers (estimation Goldman Sachs : -20 à -30 % marchés actions en cas de blocus Taïwan)
- Sanctions croisées US-Chine : risque pour les entreprises françaises opérant en Chine
- Hausse prix de l'énergie (GNL, pétrole) si routes perturbées

**Somme des probabilités : 25 % + 50 % + 25 % = 100 %**

---

## 4. Impact sectoriel — PME/ETI françaises

| Secteur | Exposition | Risque CT | Risque MT | Action recommandée |
|---------|-----------|-----------|-----------|-------------------|
| **Automobile / Aéronautique** | Très élevée | ÉLEVÉ | CRITIQUE | Dépendance semi-conducteurs Taïwan — dual sourcing (GlobalFoundries, Samsung, Intel), stocks critiques 8-12 semaines |
| **Électronique / Tech** | Très élevée | ÉLEVÉ | CRITIQUE | Composants TSMC/ASE — cartographier dépendances tier 2/3, qualifier fournisseurs alternatifs |
| **Logistique / Fret maritime** | Élevée | MODÉRÉ | ÉLEVÉ | Surveiller primes assurance, préparer routes alternatives (Cap de Bonne-Espérance, Pacifique), clauses force majeure |
| **Luxe / Export Chine** | Élevée | MODÉRÉ | ÉLEVÉ | 35 % des ventes luxe mondial — risque boycott/sanctions croisées, diversification marché (Inde, Moyen-Orient) |
| **Agroalimentaire** | Modérée | MODÉRÉ | MODÉRÉ | Transit maritime perturbé = impact coûts et délais, stocks sécurité matières premières asiatiques |

---

## 5. Sources

### Sources institutionnelles (A)

- **A1** : IMF World Economic Outlook, octobre 2025 — Projections PIB, inflation Chine et ASEAN
- **A2** : US DoD — China Military Power Report 2025 — Capacités PLA, expansion navale, arsenaux
- **A3** : UNCLOS / CPA (Cour permanente d'arbitrage) — Sentence du 12 juillet 2016, PCA Case No. 2013-19
- **A4** : SIPRI Yearbook 2025 — Dépenses militaires, arsenaux nucléaires, transferts d'armes
- **A5** : World Bank WGI 2024 — Indicateurs de gouvernance, stabilité politique

### Sources agences de presse (B)

- **B1** : Reuters — Incidents maritimes Philippines-Chine, exercices militaires, diplomatie
- **B2** : Bloomberg — Impact économique, supply chain semi-conducteurs, marchés
- **B3** : AFP — Couverture diplomatique ASEAN, tensions Taïwan
- **B4** : Nikkei Asia — Couverture spécialisée Asie-Pacifique, semi-conducteurs, commerce

### Sources spécialisées (C)

- **C1** : CSIS Asia Maritime Transparency Initiative (AMTI) — Suivi des constructions, militarisation, incidents
- **C2** : IISS Military Balance 2025-2026 — Ordre de bataille, exercices, déploiements navals
- **C3** : Mandiant / CrowdStrike — Threat intelligence : Volt Typhoon, Salt Typhoon, APT41
- **C4** : ASPI (Australian Strategic Policy Institute) — Influence chinoise, capacités cyber, Taïwan
- **C5** : RAND Corporation — Scénarios conflits Taïwan, wargames, impact économique

### Signaux faibles (D)

- **D1** : AIS maritime (MarineTraffic, VesselFinder) — Mouvements de la milice maritime chinoise, déploiements PLA Navy
- **D2** : Sentinel Hub / Planet Labs — Imagerie satellite des îles artificielles, constructions nouvelles

---

## 6. Fiche d'évaluation type

```
ZONE : Mer de Chine méridionale
DATE : 11/03/2026
ANALYSTE : Inflexion (assisté IA)
ANGLE : Supply Chain (routes maritimes, semi-conducteurs)
VERSION GRILLE : v1.0

| Dimension | Score Quanti | Score Quali | Score Final | Trend | Sources clés |
|-----------|-------------|-------------|-------------|-------|-------------|
| S         | 2,4         | 3           | 2,6         | →     | UNDP, World Bank, ILO |
| E         | 2,6         | 3           | 2,8         | →     | IMF, S&P, Moody's |
| M         | 4,2         | 4           | 4,1         | ↑     | SIPRI, IISS, CSIS-AMTI |
| P         | 3,4         | 4           | 3,6         | ↑     | V-Dem, TI, EIU |
| L         | 3,0         | 3           | 3,0         | →     | WJP, CPA, OFAC |
| I         | 3,8         | 4           | 3,9         | ↑     | RSF, FH FotN, DFRLab |
| C         | 3,8         | 4           | 3,9         | ↑     | MITRE, Mandiant, CISA |
| E_env     | 3,2         | 3           | 3,1         | →     | ND-GAIN, EM-DAT, IEA |
| COMPOSITE | —           | —           | 3,4         | ↑     | — |

SCÉNARIOS :
- Optimiste (25 %) : Accord Code de conduite ASEAN-Chine, stabilisation, statu quo Taïwan
- Central (50 %) : Escalade contrôlée, incidents récurrents, militarisation progressive
- Pessimiste (25 %) : Conflit armé limité ou blocus Taïwan, disruption supply chain mondiale
[Σ probabilités = 100 %]

IMPACT SECTORIEL :
- Automobile / Aéronautique : ÉLEVÉ → CRITIQUE — Dual sourcing semi-conducteurs
- Électronique / Tech : ÉLEVÉ → CRITIQUE — Qualifier fournisseurs alternatifs
- Logistique / Fret maritime : MODÉRÉ → ÉLEVÉ — Routes alternatives, assurance
- Luxe / Export Chine : MODÉRÉ → ÉLEVÉ — Diversification marchés
- Agroalimentaire : MODÉRÉ — Stocks sécurité

SOURCES (5A + 4B + 5C + 2D) :
- A1-A5 : IMF, US DoD, CPA/UNCLOS, SIPRI, World Bank
- B1-B4 : Reuters, Bloomberg, AFP, Nikkei Asia
- C1-C5 : CSIS-AMTI, IISS, Mandiant/CrowdStrike, ASPI, RAND
- D1-D2 : AIS maritime, imagerie satellite

DIVERGENCES / LIMITES :
- Zone multi-pays : les indicateurs quantitatifs (Gini, IDH, CPI) sont ceux de la Chine principalement, ajustés pour les riverains
- Données militaires chinoises opaques — dépenses réelles estimées 40-70 % supérieures aux chiffres officiels (SIPRI)
- Biais possible : la couverture médiatique anglo-saxonne peut surestimer le risque de conflit autour de Taïwan
- Source contradictoire : CSIS estime la probabilité de conflit Taïwan à <10 % sur 5 ans vs certains analystes US (>20 %)
- GCI et NCSI élevés de la Chine masquent la menace offensive — ajustement qualitatif documenté
- Le score composite (3,4) peut sembler modéré, mais le risque de queue (scénario pessimiste) est catastrophique pour les supply chains

VERSION HISTORY :
- v1 [11/03/2026] : Évaluation initiale
```

---

*Dernière mise à jour : 11 mars 2026 — Prochaine révision recommandée : 25 mars 2026 ou en cas d'événement déclencheur (incident armé Second Thomas Shoal, exercice militaire Taïwan, annonce sanctions technologiques).*
