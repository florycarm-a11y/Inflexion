# SEMPLICE — Grille de notation Opportunite v2.0

> **Cadre methodologique pour l'evaluation reproductible du potentiel geopolitique**
> Inflexion Intelligence — Mars 2026
> Echelle 1-7 | 66 indicateurs | Mix 60% quanti / 40% quali

---

## Architecture du score

```
Score_quanti_d = moyenne arithmetique simple des paliers (somme / nombre d'indicateurs)
So_d = 0.60 x Score_quanti_d + 0.40 x Score_quali_d
Composite_opp = Sigma (poids_d x So_d) pour d in {So, Eo, Mo, Po, Lo, Io, Co, Eeo}
```

> **Regle** : `Score_quanti` = moyenne arithmetique simple (non ponderee) de tous les paliers de la dimension.

### Echelle 1-7 (sens INVERSE du risque)

| Score | Descripteur | Couleur |
|-------|------------|---------|
| **1** | Minimal / Negligeable | Rouge fonce |
| **2** | Tres faible | Rouge |
| **3** | Faible | Orange |
| **4** | Modere | Jaune |
| **5** | Significatif | Vert clair |
| **6** | Eleve | Vert |
| **7** | Exemplaire / Maximum | Vert fonce |

### Classification composite opportunite

| Score | Niveau |
|-------|--------|
| 1.0 – 2.0 | Minimal |
| 2.1 – 3.0 | Faible |
| 3.1 – 4.0 | Modere |
| 4.1 – 5.0 | Significatif |
| 5.1 – 6.0 | Eleve |
| 6.1 – 7.0 | Exemplaire |

### Relation risque-opportunite

Les scores risque et opportunite sont **independants** : un pays peut avoir un risque eleve ET des opportunites elevees (ex. Inde : risque 3.9, opportunite attendue ~4.0). Le croisement risque/opportunite produit quatre quadrants :

| | Opp faible | Opp elevee |
|---|---|---|
| **Risque faible** | Stable neutre (Singapour) | Pole attractif (Tamil Nadu) |
| **Risque eleve** | Zone de crise (Cuba, Sahel) | Pari a haut potentiel (Bresil, Turquie) |

---

## Ponderation dimensionnelle opportunite

Les poids refletent l'impact relatif de chaque dimension sur le potentiel de developpement et d'investissement.

| Dimension | Poids | Justification |
|-----------|:-----:|---------------|
| **Eo** — Croissance & marche | 17% | Moteur principal de creation de valeur |
| **Io** — Innovation & numerique | 15% | Levier de transformation et de competitivite future |
| **Po** — Gouvernance & reformes | 14% | Environnement institutionnel, capacite de reforme |
| **Lo** — Attractivite juridique | 13% | Securite des investissements, previsibilite |
| **Co** — Maturite technologique | 12% | Infrastructure numerique, maturite |
| **So** — Capital humain | 12% | Qualite de la main-d'oeuvre, potentiel demographique |
| **Eeo** — Durabilite & transition | 10% | Positionnement strategique long terme |
| **Mo** — Securite & alliances | 7% | Pre-requis facilitateur (non-createur direct de valeur) |
| **Total** | **100%** | |

---

## So — Capital humain (8 indicateurs)

Mesure la qualite, la disponibilite et le potentiel de la main-d'oeuvre.

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| So1 | **Taux d'alphabetisation adulte (%)** | UNESCO | < 50% | 50–65% | 65–78% | 78–88% | 88–95% | 95–99% | > 99% |
| So2 | **Score PISA moyen (lecture+maths+sciences)** | OECD | < 380 | 380–420 | 420–460 | 460–490 | 490–520 | 520–550 | > 550 |
| So3 | **Depenses sante / PIB (%)** | OMS | < 2% | 2–3.5% | 3.5–5% | 5–7% | 7–9% | 9–12% | > 12% effectif |
| So4 | **Medecins / 1 000 hab.** | OMS | < 0.3 | 0.3–0.8 | 0.8–1.5 | 1.5–2.5 | 2.5–3.5 | 3.5–4.5 | > 4.5 |
| So5 | **Taux scolarisation tertiaire brut (%)** | UNESCO | < 10% | 10–22% | 22–35% | 35–50% | 50–65% | 65–80% | > 80% |
| So6 | **Indice de mobilite sociale (0-100)** | WEF | < 40 | 40–50 | 50–58 | 58–66 | 66–74 | 74–82 | > 82 |
| So7 | **Population en age de travailler (% 15-64 ans)** | UN DESA | < 50% | 50–55% | 55–60% | 60–64% | 64–68% | 68–72% | > 72% |
| So8 | **Solde migratoire qualifie (solde migration qualifiee)** | OECD / World Bank | Fuite massive | Fuite forte | Fuite moderee | Equilibre | Gain modere | Gain fort | Pole d'attraction mondial |

```
Score_quanti_So = moyenne(So1..So8)
```

---

## Eo — Croissance & marche (10 indicateurs)

Mesure le potentiel de croissance economique et l'attractivite du marche.

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| Eo1 | **Croissance PIB reel tendanciel (moy. 5 ans, %)** | IMF WEO | < 0% | 0–1.5% | 1.5–3% | 3–4.5% | 4.5–6% | 6–8% | > 8% |
| Eo2 | **IDE entrants nets / PIB (%)** | UNCTAD | < 0% | 0–0.5% | 0.5–1.5% | 1.5–3% | 3–5% | 5–8% | > 8% |
| Eo3 | **Taille marche interieur (PIB PPA, Mrd$)** | IMF | < 20 | 20–80 | 80–300 | 300–1000 | 1000–5000 | 5000–15000 | > 15000 |
| Eo4 | **Croissance classe moyenne (% pop., 5 ans)** | World Bank / Brookings | Negatif | 0–2 pts | 2–5 pts | 5–8 pts | 8–12 pts | 12–18 pts | > 18 pts |
| Eo5 | **Diversification economique (HHI inverse exports)** | World Bank / WITS | < 0.05 | 0.05–0.12 | 0.12–0.22 | 0.22–0.35 | 0.35–0.50 | 0.50–0.70 | > 0.70 |
| Eo6 | **Profondeur marche financier (credit prive / PIB)** | World Bank / BIS | < 10% | 10–25% | 25–45% | 45–70% | 70–100% | 100–150% | > 150% |
| Eo7 | **Brevets deposes / million hab.** | WIPO | < 5 | 5–20 | 20–60 | 60–150 | 150–400 | 400–800 | > 800 |
| Eo8 | **Croissance productivite totale (%, 5 ans moy.)** | Conference Board / Penn World | < -1% | -1–0% | 0–0.5% | 0.5–1% | 1–1.8% | 1.8–2.8% | > 2.8% |
| Eo9 | **Accords commerciaux (% commerce couvert par ALE)** | WTO / UNCTAD | < 10% | 10–25% | 25–40% | 40–55% | 55–70% | 70–85% | > 85% |
| Eo10 | **Reserves strategiques (mineraux critiques, nb top-10)** | USGS / BGS | 0 | 1 | 2–3 | 4–5 | 6–8 | 9–12 | > 12 |

```
Score_quanti_Eo = moyenne(Eo1..Eo10)
```

---

## Mo — Securite & alliances (6 indicateurs)

Mesure la stabilite securitaire et la qualite des partenariats de defense.

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| Mo1 | **Alliances defensives actives** | OTAN / OTSC / accords bilateraux | Aucune | 1 partenariat | 2–3 bilateraux | Alliance regionale | Alliance majeure | Alliance majeure + bilateraux | Pilier d'alliance + reseau dense |
| Mo2 | **Exercices conjoints / an** | IISS Military Balance | 0 | 1–2 | 3–5 | 6–10 | 11–18 | 19–30 | > 30 |
| Mo3 | **Stabilite regionale (absence conflits 1000 km)** | ACLED / UCDP | Guerre ouverte zone | 2+ conflits actifs | 1 conflit actif | Tensions elevees | Tensions faibles | Stable, tensions isolees | Zone de paix consolidee |
| Mo4 | **Cooperation defense (accords bilateraux actifs)** | SIPRI / IISS | 0 | 1–2 | 3–5 | 6–10 | 11–18 | 19–30 | > 30 |
| Mo5 | **Controle effectif des frontieres** | OSINT / IOM | Inexistant | Tres faible | Faible | Partiel | Substantiel | Eleve | Total avec cooperation regionale |
| Mo6 | **R&D defense (% budget militaire)** | SIPRI / IISS | < 1% | 1–3% | 3–6% | 6–10% | 10–15% | 15–20% | > 20% |

```
Score_quanti_Mo = moyenne(Mo1..Mo6)
```

---

## Po — Gouvernance & reformes (8 indicateurs)

Mesure la qualite institutionnelle et la capacite de reforme.

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| Po1 | **WGI Government Effectiveness (-2.5 a +2.5)** | World Bank | < -1.5 | -1.5 a -0.8 | -0.8 a -0.2 | -0.2 a +0.3 | +0.3 a +0.8 | +0.8 a +1.5 | > +1.5 |
| Po2 | **V-Dem Participatory Democracy (0-1)** | V-Dem | < 0.15 | 0.15–0.30 | 0.30–0.45 | 0.45–0.58 | 0.58–0.72 | 0.72–0.85 | > 0.85 |
| Po3 | **Reformes structurelles adoptees (3 ans)** | OECD / IMF Art. IV | 0 | 1–2 mineures | 3–5 mineures | 1–2 majeures | 3–4 majeures | 5+ majeures | Programme transformationnel |
| Po4 | **E-Government Development Index (0-1)** | UN DESA | < 0.25 | 0.25–0.40 | 0.40–0.55 | 0.55–0.68 | 0.68–0.80 | 0.80–0.90 | > 0.90 |
| Po5 | **Decentralisation effective** | World Bank / OECD | Centralise rigide | Centralise | Deconcentre | Decentralise partiel | Decentralise effectif | Federal effectif | Federal mature + subsidiarite |
| Po6 | **Transparence budgetaire (Open Budget Index, 0-100)** | IBP | < 15 | 15–30 | 30–45 | 45–58 | 58–72 | 72–85 | > 85 |
| Po7 | **Mecanisme de succession institutionnelle** | OSINT / V-Dem | Aucun | Flou | Informel | Codifie non teste | Codifie teste 1x | Routine etablie | Transition recente reussie |
| Po8 | **Dialogue social (mecanismes actifs)** | ILO / OECD | Inexistant | Facade | Consultatif occasionnel | Consultatif regulier | Negociation sectorielle | Tripartisme actif | Tripartisme + pacte social |

```
Score_quanti_Po = moyenne(Po1..Po8)
```

---

## Lo — Attractivite juridique (8 indicateurs)

Mesure la securite juridique et la facilite d'investissement.

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| Lo1 | **Rule of Law Index (0-1)** | WJP | < 0.30 | 0.30–0.42 | 0.42–0.55 | 0.55–0.65 | 0.65–0.75 | 0.75–0.85 | > 0.85 |
| Lo2 | **Protection investisseurs (OECD FDI Index inverse)** | OECD / World Bank | Tres restrictif | Restrictif | Moderement restrictif | Neutre | Moderement ouvert | Ouvert | Tres ouvert |
| Lo3 | **BIT actifs (traites bilateraux d'investissement)** | UNCTAD IIA | < 5 | 5–15 | 15–30 | 30–45 | 45–60 | 60–80 | > 80 |
| Lo4 | **Acces arbitrage international** | ICSID / CNUDCI | Refus systematique | Refus frequent | Execution incertaine | Membre passif | Membre actif | Membre actif, respecte | Exemplaire + jurisprudence favorable |
| Lo5 | **Indice protection PI (0-100)** | US Chamber GIPC | < 20 | 20–32 | 32–45 | 45–58 | 58–72 | 72–85 | > 85 |
| Lo6 | **Taux effectif d'imposition corporate (%)** | OECD / PwC | > 40% | 32–40% | 26–32% | 20–26% | 15–20% | 10–15% | < 10% + incentives |
| Lo7 | **Zones franches / regimes speciaux** | FIAS / OSINT | Aucun | 1 inactive | 1–2 actives | 3–5 actives | 5–10 etablies | 10+ avec bilan etabli | Pole reconnu (Dubai, Singapour) |
| Lo8 | **Stabilite reglementaire (changements majeurs / 3 ans)** | OSINT / EIU | > 15 | 10–15 | 7–10 | 4–7 | 2–4 | 1 | 0 (environnement previsible) |

```
Score_quanti_Lo = moyenne(Lo1..Lo8)
```

---

## Io — Innovation & numerique (8 indicateurs)

Mesure le dynamisme de l'ecosysteme d'innovation et de transformation digitale.

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| Io1 | **Global Innovation Index (rang /130)** | WIPO | > 110 | 85–110 | 60–85 | 40–60 | 25–40 | 12–25 | Top 12 |
| Io2 | **Depenses R&D / PIB (%)** | UNESCO / OECD | < 0.2% | 0.2–0.5% | 0.5–1.0% | 1.0–1.8% | 1.8–2.8% | 2.8–3.8% | > 3.8% |
| Io3 | **Ecosysteme startups (valorisation totale Mrd$)** | Crunchbase / Dealroom | < 1 | 1–5 | 5–15 | 15–50 | 50–150 | 150–500 | > 500 |
| Io4 | **Penetration internet haut debit (% pop.)** | ITU / DataReportal | < 15% | 15–30% | 30–48% | 48–65% | 65–80% | 80–92% | > 92% |
| Io5 | **Publications IA (% mondial)** | Scopus / arXiv | < 0.1% | 0.1–0.5% | 0.5–1.5% | 1.5–3% | 3–8% | 8–15% | > 15% |
| Io6 | **Capital-risque / PIB (%)** | OECD / NVCA / Invest Europe | < 0.01% | 0.01–0.03% | 0.03–0.08% | 0.08–0.15% | 0.15–0.30% | 0.30–0.50% | > 0.50% |
| Io7 | **Diplomes STEM / 100 000 hab.** | UNESCO / OECD | < 10 | 10–25 | 25–50 | 50–80 | 80–120 | 120–180 | > 180 |
| Io8 | **Adoption IA dans l'industrie (% entreprises)** | OECD / McKinsey | < 5% | 5–12% | 12–22% | 22–35% | 35–50% | 50–65% | > 65% |

```
Score_quanti_Io = moyenne(Io1..Io8)
```

---

## Co — Maturite technologique (8 indicateurs)

Mesure la robustesse des infrastructures numeriques et la maturite technologique.

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| Co1 | **Global Cybersecurity Index (0-100)** | ITU GCI | < 25 | 25–40 | 40–55 | 55–70 | 70–82 | 82–92 | > 92 |
| Co2 | **Indice de maturite cloud** | Asia Cloud Computing / OSINT | Minimal | Basique | En developpement | Modere | Avance | Mature | Leader mondial |
| Co3 | **Couverture 5G + fibre (% pop.)** | GSMA / ITU | < 5% | 5–15% | 15–30% | 30–50% | 50–70% | 70–88% | > 88% |
| Co4 | **Souverainete donnees (cadre juridique)** | OSINT / GDPR tracker | Aucun | Minimal | En cours | Partiel | Cadre solide | Cadre mature | Equivalent RGPD + application effective |
| Co5 | **CERT national (maturite, echelle CMM 1-5)** | GFCE / ITU | Aucun | Start-up (1) | Formative (2) | Established (3) | Strategic (4) | Dynamic (5) | Dynamic + cooperation regionale |
| Co6 | **Workforce cyber (professionnels / 100k hab.)** | ISC2 / ENISA | < 10 | 10–25 | 25–50 | 50–80 | 80–130 | 130–200 | > 200 |
| Co7 | **Commerce en ligne (% commerce de detail)** | eMarketer / Statista | < 2% | 2–5% | 5–10% | 10–18% | 18–28% | 28–40% | > 40% |
| Co8 | **Identite numerique (couverture pop. %)** | World Bank ID4D | < 10% | 10–30% | 30–50% | 50–70% | 70–85% | 85–95% | > 95% |

```
Score_quanti_Co = moyenne(Co1..Co8)
```

---

## Eeo — Durabilite & transition (8 indicateurs)

Mesure le positionnement strategique dans la transition energetique et climatique.

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| Eeo1 | **Part renouvelables (% energie primaire)** | IEA / IRENA | < 5% | 5–12% | 12–22% | 22–35% | 35–50% | 50–65% | > 65% |
| Eeo2 | **Ambition NDC (ecart vs trajectoire 1.5C)** | Climate Action Tracker | Critique | Tres insuffisant | Insuffisant | Modere | Compatible 2C | Compatible 1.5C | Leader + neutralite atteinte |
| Eeo3 | **Obligations vertes emises / PIB (%)** | CBI / Bloomberg | 0% | < 0.1% | 0.1–0.3% | 0.3–0.6% | 0.6–1.2% | 1.2–2.5% | > 2.5% |
| Eeo4 | **ND-GAIN Preparation (0-1)** | Notre Dame | < 0.25 | 0.25–0.35 | 0.35–0.45 | 0.45–0.55 | 0.55–0.65 | 0.65–0.75 | > 0.75 |
| Eeo5 | **Economie circulaire (taux recyclage municipal %)** | OECD / Eurostat | < 5% | 5–12% | 12–22% | 22–35% | 35–48% | 48–60% | > 60% |
| Eeo6 | **Investissements verts (% FBCF totale)** | OECD / IEA | < 2% | 2–5% | 5–10% | 10–16% | 16–24% | 24–35% | > 35% |
| Eeo7 | **Aires protegees (% territoire terrestre + marin)** | IUCN / WDPA | < 3% | 3–8% | 8–14% | 14–22% | 22–30% | 30–40% | > 40% |
| Eeo8 | **Environmental Performance Index (0-100)** | Yale EPI | < 30 | 30–40 | 40–50 | 50–58 | 58–68 | 68–78 | > 78 |

```
Score_quanti_Eeo = moyenne(Eeo1..Eeo8)
```

---

## Recapitulatif

| Dimension opportunite | Dimension risque miroir | Nb indicateurs |
|-----------------------|------------------------|:--------------:|
| So — Capital humain | S — Social | 8 |
| Eo — Croissance & marche | E — Economique | 10 |
| Mo — Securite & alliances | M — Militaire | 6 |
| Po — Gouvernance & reformes | P — Politique | 8 |
| Lo — Attractivite juridique | L — Legal | 8 |
| Io — Innovation & numerique | I — Information | 8 |
| Co — Maturite technologique | C — Cyber | 8 |
| Eeo — Durabilite & transition | Ee — Environnemental | 8 |
| **TOTAL** | | **66** |

---

## Score qualitatif — Grille 1-7

| Score | Descripteur | Criteres |
|-------|------------|----------|
| **1** | Negligeable | Aucun signal positif, economie de survie, infrastructure absente |
| **2** | Marginal | Potentiel theorique non materialise, signaux tres isoles |
| **3** | Emergent | Premiers signaux positifs, 1-2 reformes, investissements pilotes |
| **4** | Modere | Trajectoire positive confirmee par 2+ sources, dynamique naissante |
| **5** | Significatif | Ecosysteme fonctionnel, croissance auto-entretenue, attractivite demontree |
| **6** | Avance | Pole regional reconnu, indicateurs premier quartile, acceleration des flux |
| **7** | Exemplaire | Reference mondiale, benchmark pour les pairs, attractivite maximale |

---

## Amplification de l'opportunite dominante (amplification de pic miroir)

Mecanisme symetrique a l'amplification du risque, pour les profils a opportunite sectorielle isolee.

**Principe** : toute dimension dont le scoreOpp depasse le composite opportunite de base de plus de **1.0 point** recoit une majoration de ponderation proportionnelle a l'ecart.

**Algorithme** (identique au risque) :
1. Calculer le composite pondere de base (poids fixes opportunite)
2. Pour chaque dimension d ou `scoreOpp_d - compositeOppBase > 1.0` :
   - Majoration poids = `0.20 x (scoreOpp_d - compositeOppBase - 1.0)`
3. Renormaliser tous les poids pour somme = 100%
4. Recalculer le composite avec les poids amplifies
5. Plafonner l'effet d'amplification a **+0.3 point** sur le composite

---

## Ponderations opportunite par angle decisionnel

| Dimension | Defaut | Investissement | Supply Chain | Implantation |
|-----------|:------:|:--------------:|:------------:|:------------:|
| So | 12% | 8% | 8% | **18%** |
| Eo | 17% | **22%** | 12% | 10% |
| Mo | 7% | 5% | **12%** | 5% |
| Po | 14% | 12% | 8% | **18%** |
| Lo | 13% | **18%** | 8% | **16%** |
| Io | 15% | 15% | **18%** | 12% |
| Co | 12% | 10% | **22%** | 10% |
| Eeo | 10% | 10% | 12% | 11% |

---

## Articulation risque / opportunite dans les evaluations

Chaque evaluation SEMPLICE v2.0 complete doit inclure :

1. **Scores risque** : 8 dimensions, 95 indicateurs (grille risque v2.0)
2. **Scores opportunite** : 8 dimensions, 66 indicateurs (cette grille)
3. **Composite risque pondere** + classification
4. **Composite opportunite pondere** + classification
5. **Matrice de positionnement** : quadrant risque/opportunite
6. **Delta risque-opportunite** : ecart composite (signal de desequilibre)
   - Delta > 2.0 : zone sous-exploitee (opportunite >> risque) → signal investissement
   - Delta < -2.0 : zone de crise (risque >> opportunite) → signal sortie
   - |Delta| < 1.0 : profil equilibre

---

## Historique des modifications

| Version | Date | Modification |
|---------|------|-------------|
| v2.0 | 2026-03-12 | Creation — 66 indicateurs, echelle 1-7, ponderations specifiques, amplification de pic miroir |
