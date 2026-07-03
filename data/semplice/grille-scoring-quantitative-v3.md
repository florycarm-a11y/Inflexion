# SEMPLICE — Grille de notation quantitative v3.0

> **Cadre methodologique pour l'evaluation reproductible des risques geopolitiques**
> Inflexion Intelligence — Juillet 2026
> v3.0 | Echelle 1-7 | **102 indicateurs risque + 6 resilience** (+6 K optionnel)
> Correction de comptage : le "107" annonce en v2.1 etait errone (les precurseurs P13-15/M13/E16
> sont 5 indicateurs, pas 6 ; le total reel v2.1 etait **100** indicateurs risque, cf. audit 2026-06-18).

---

## Architecture du score

```
Score_quanti_d = Sigma(w_i x palier_i) / Sigma(w_i)   w_i ∈ {3=critique, 2=majeur, 1=mineur}
                 (v3.0 : ponderation intra-dimension par tags, cf. section dediee ;
                 equivaut a la moyenne arithmetique simple v2.1 tant qu'aucun tag n'est pose)
Score_quali_d  = note expert 1-7 (jugement qualitatif structure)
S_d            = 0.60 x Score_quanti_d + 0.40 x Score_quali_d - Bonification_resilience_d
Score_composite = Sigma (poids_d x S_d)   [ponderation inter-dimensionnelle, cf. section dediee]
```

> **Regle de calcul (v3.0)** : `Score_quanti` est une **moyenne ponderee par tags** (critique w=3,
> majeur w=2 par defaut, mineur w=1) au sein d'une dimension — voir « Pondération intra-dimension
> (v3, nouveau) ». Tant qu'aucun tag n'est pose, elle est strictement equivalente a la moyenne
> arithmetique simple v2.1. La ponderation inter-dimensionnelle (composite) reste independante.

### Echelle 1-7

| Score | Descripteur | Couleur |
|-------|------------|---------|
| **1** | Minimal / Exemplaire | Vert fonce |
| **2** | Tres faible | Vert |
| **3** | Faible | Vert clair |
| **4** | Modere | Jaune |
| **5** | Eleve | Orange |
| **6** | Tres eleve | Rouge |
| **7** | Critique / Extreme | Rouge fonce |

### Classification composite

| Score | Niveau |
|-------|--------|
| 1.0 – 2.0 | Faible |
| 2.1 – 3.0 | Modere-Faible |
| 3.1 – 4.0 | Modere |
| 4.1 – 5.0 | Eleve |
| 5.1 – 6.0 | Tres eleve |
| 6.1 – 7.0 | Critique |

---

## S — Social (12 indicateurs)

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| S1 | **Coefficient de Gini** | World Bank | < 0.25 | 0.25–0.28 | 0.29–0.34 | 0.35–0.40 | 0.41–0.46 | 0.47–0.52 | > 0.52 |
| S2 | **IDH** | UNDP | > 0.90 | 0.85–0.90 | 0.78–0.85 | 0.70–0.78 | 0.60–0.70 | 0.50–0.60 | < 0.50 |
| S3 | **Chomage des jeunes (15-24 ans)** | ILO | < 8% | 8–14% | 14–20% | 20–28% | 28–38% | 38–50% | > 50% |
| S4 | **Solde migratoire net (pour mille pop.)** | UN DESA | > +5 | +3 a +5 | +1 a +3 | -1 a +1 | -5 a -1 | -10 a -5 | < -10 |
| S5 | **Mouvements sociaux majeurs (12 mois)** | ACLED | 0 | 1 | 2 | 3–4 | 5–7 | 8–12 | > 12 |
| S6 | **Tensions ethniques / communautaires** | Minorities at Risk / ACLED | Aucune | Isolees | Recurrentes | Frequentes | Violences intercommunautaires | Conflit ethnique | Nettoyage ethnique / genocide |
| S7 | **Acces sante (lits hopital / 1000 hab.)** | OMS | > 6 | 4–6 | 3–4 | 2–3 | 1–2 | 0.5–1 | < 0.5 |
| S8 | **Taux d'urbanisation rapide (% croissance urbaine/an)** | UN Habitat | < 0.5% | 0.5–1% | 1–2% | 2–3% | 3–4% | 4–5% | > 5% |
| S9 | **Indice d'inegalite de genre (GII)** | UNDP | < 0.10 | 0.10–0.20 | 0.20–0.35 | 0.35–0.50 | 0.50–0.65 | 0.65–0.80 | > 0.80 |
| S10 | **Esperance de vie a la naissance** | World Bank | > 80 | 76–80 | 72–76 | 66–72 | 58–66 | 50–58 | < 50 |
| S11 | **Securite alimentaire (% population sous-alimentee)** | FAO / WFP | < 2.5% | 2.5–5% | 5–10% | 10–20% | 20–35% | 35–50% | > 50% |
| S12 | **Acces education secondaire (taux net %)** | UNESCO | > 95% | 88–95% | 78–88% | 65–78% | 50–65% | 35–50% | < 35% |

```
Score_quanti_S = moyenne(S1..S12)
```

---

## E — Economique (15 indicateurs)

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| E1 | **Croissance PIB reel (%)** | IMF WEO | > 5% | 3.5–5% | 2–3.5% | 0.5–2% | -2 a 0.5% | -5 a -2% | < -5% |
| E2 | **Inflation annuelle (%)** | IMF | < 2% | 2–4% | 4–7% | 7–15% | 15–30% | 30–80% | > 80% |
| E3 | **Dette publique / PIB** | IMF Fiscal Monitor | < 30% | 30–45% | 45–60% | 60–80% | 80–100% | 100–130% | > 130% |
| E4 | **Balance courante / PIB** | IMF BOP | > +5% | +3 a +5% | +1 a +3% | -2 a +1% | -5 a -2% | -8 a -5% | < -8% |
| E5 | **Notation souveraine** | Fitch/S&P/Moody's | AAA–AA | AA- a A | A- a BBB | BBB- a BB+ | BB a B+ | B a CCC+ | CCC et < |
| E6 | **Ancrage artificiel / controle capitaux** | IMF AREAER | Flottant libre | Flottant gere transparent | Flottant gere opaque | Ancrage glissant | Ancrage fixe | Ancrage + controles partiels | Ancrage artificiel + controles stricts |
| E7 | **Reserves de change (mois d'importations)** | IMF / BC | > 12 | 8–12 | 6–8 | 4–6 | 2–4 | 1–2 | < 1 |
| E8 | **IDE entrants nets (% PIB)** | World Bank / UNCTAD | > 5% | 3–5% | 1.5–3% | 0.5–1.5% | 0–0.5% | Negatif | Fuite massive |
| E9 | **Chomage total (%)** | ILO | < 3% | 3–5% | 5–8% | 8–12% | 12–18% | 18–25% | > 25% |
| E10 | **Dette privee / PIB** | BIS / IMF | < 50% | 50–80% | 80–120% | 120–160% | 160–200% | 200–250% | > 250% |
| E11 | **Concentration exports (top 3 produits, % total)** | World Bank / WITS | < 15% | 15–25% | 25–40% | 40–55% | 55–70% | 70–85% | > 85% |
| E12 | **Croissance du credit (% annuel)** | BIS / BC | 2–8% | 8–12% | 0–2% ou 12–18% | 18–25% | 25–35% ou negatif | 35–50% | > 50% ou contraction du credit |
| E13 | **Shadow banking / economie informelle (% PIB est.)** | IMF / World Bank | < 10% | 10–18% | 18–28% | 28–40% | 40–55% | 55–70% | > 70% |
| E14 | **Cout de l'energie ($/MWh equivalent)** | IEA / Ember | < 50 | 50–80 | 80–120 | 120–170 | 170–250 | 250–400 | > 400 ou penuries |
| E15 | **Indice de misere (inflation + chomage)** | Calcule | < 6 | 6–10 | 10–16 | 16–24 | 24–40 | 40–60 | > 60 |

```
Score_quanti_E = moyenne(E1..E15)
```

---

## M — Militaire (12 indicateurs)

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| M1 | **Depenses militaires / PIB** | SIPRI | < 1% | 1–1.8% | 1.8–2.5% | 2.5–3.5% | 3.5–5% | 5–8% | > 8% |
| M2 | **Conflits armes actifs (zone 500 km)** | ACLED / UCDP | 0 | 0 (tensions diplomatiques) | 1 basse intensite | 1 haute intensite | 2 simultanes | 2+ haute intensite | Guerre ouverte multi-fronts |
| M3 | **Global Firepower Index (rang)** | GFP | > 100e | 60–100e | 30–60e | 15–30e | 5–15e implique | Top 5 implique | Top 3 engages directement |
| M4 | **Exercices militaires majeurs (12 mois)** | IISS | 0 | 1–2 | 3–4 | 5–7 | 8–12 | 13–20 | > 20 ou mobilisation |
| M5 | **Proliferation nucleaire / missiles** | SIPRI / IAEA | Aucun | Zone NWFZ | Voisinage nucleaire | Programme civil sensible | Programme suspect | Arsenal non declare | Arsenal deploye + test recent |
| M6 | **Coups militaires regionaux (1500 km, 5 ans)** | ACLED | 0 | 1 | 2 | 3 | 4–5 | 6–8 | > 8 |
| M7 | **Subordination armee au pouvoir civil** | V-Dem (v2x_civmil) | > 0.90 | 0.80–0.90 | 0.65–0.80 | 0.50–0.65 | 0.35–0.50 | 0.20–0.35 | < 0.20 |
| M8 | **Transferts d'armes majeurs (5 ans, TIV SIPRI)** | SIPRI Arms Transfers | < 100 | 100–500 | 500–1500 | 1500–5000 | 5000–15000 | 15000–30000 | > 30000 |
| M9 | **Bases militaires etrangeres (zone 1000 km)** | IISS Military Balance | 0 | 1–2 alliees | 3–5 alliees | 1+ rivale | 2+ rivales | Multiples rivales | Confrontation directe |
| M10 | **Milices / PMC actives dans la zone** | ACLED / UN Panel | Aucune | 1 inactive | 1–2 actives faible | 3–5 actives | 5–10 actives | > 10 ou PMC etrangeres | PMC + milices + forces irregulieres |
| M11 | **Traites de defense collective** | OTAN / OCS / OTSC | Membre alliance defensive | Partenariat majeur | Accord bilateral | Neutre | Non-aligne isole | Alliance contestee | Ennemi designe d'alliance |
| M12 | **Depenses R&D defense (% budget mil.)** | SIPRI / IISS | > 15% | 10–15% | 6–10% | 3–6% | 1–3% | < 1% | 0% + dependance import totale |

```
Score_quanti_M = moyenne(M1..M12)
```

---

## P — Politique (12 indicateurs)

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| P1 | **Corruption Perceptions Index (0-100)** | Transparency Intl | > 80 | 70–80 | 58–70 | 45–58 | 32–45 | 20–32 | < 20 |
| P2 | **V-Dem Liberal Democracy Index (0-1)** | V-Dem | > 0.82 | 0.70–0.82 | 0.55–0.70 | 0.40–0.55 | 0.25–0.40 | 0.12–0.25 | < 0.12 |
| P3 | **WGI — Political Stability (-2.5 a +2.5)** | World Bank | > +1.0 | +0.5 a +1.0 | 0 a +0.5 | -0.5 a 0 | -1.0 a -0.5 | -1.8 a -1.0 | < -1.8 |
| P4 | **Cycle electoral (prochaine echeance)** | IFES | > 4 ans | 3–4 ans | 2–3 ans | 1–2 ans | < 1 an (ordonnee) | < 1 an (contestee) | Imminent ou reportee |
| P5 | **Risque changement de regime (12 mois)** | EIU / Freedom House | Negligeable | Tres faible | Faible | Modere | Eleve | Tres eleve | Imminent / en cours |
| P6 | **Indice de polarisation politique** | V-Dem (v2cacamps) | < 0.2 | 0.2–0.4 | 0.4–0.6 | 0.6–0.75 | 0.75–0.85 | 0.85–0.95 | > 0.95 |
| P7 | **Libertes civiles (Freedom House, 0-60)** | Freedom House | > 52 | 42–52 | 32–42 | 22–32 | 12–22 | 5–12 | < 5 |
| P8 | **Risque successoral / concentration du pouvoir** | OSINT structure | Succession institutionnelle | Succession planifiee | Succession incertaine | Leader > 70 ans ou > 20 ans | Pas de successeur clair | Crise successorale | Autocratie sans mecanisme |
| P9 | **Autonomie regionale / risque secession** | ACLED / OSINT | Aucun | Tensions mineures | Mouvement politique | Mouvement actif | Referendums / greves | Violence separatiste | Guerre de secession |
| P10 | **Opposition organisee** | V-Dem / OSINT | Opposition libre forte | Opposition libre | Opposition restreinte | Opposition harcelee | Opposition emprisonnee | Opposition exilee | Opposition eliminee |
| P11 | **Pression demographique (croissance pop. %)** | UN DESA | 0.5–1.5% | 0–0.5% ou 1.5–2% | 2–2.5% | 2.5–3% ou negatif | 3–3.5% ou < -0.5% | > 3.5% ou < -1% | > 4% ou < -1.5% |
| P12 | **Diaspora politique active** | OSINT | Negligeable | Faible | Communautaire | Groupe de pression organise | Financement opposition | Gouvernement en exil | Insurrection soutenue depuis l'etranger |

```
Score_quanti_P = moyenne(P1..P12)
```

---

## L — Legal (10 indicateurs)

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| L1 | **Rule of Law Index (0-1)** | WJP | > 0.80 | 0.70–0.80 | 0.58–0.70 | 0.45–0.58 | 0.35–0.45 | 0.25–0.35 | < 0.25 |
| L2 | **B-READY score (0-100)** | World Bank | > 82 | 72–82 | 60–72 | 48–60 | 36–48 | 24–36 | < 24 |
| L3 | **Regime de sanctions internationales** | OFAC / EU / UN | Aucune | Ciblees (individus) | Ciblees (entites) | Sectorielles limitees | Sectorielles larges | Embargo partiel | Embargo total + extraterritorial |
| L4 | **Protection PI (IP Index, 0-100)** | US Chamber GIPC | > 80 | 68–80 | 55–68 | 42–55 | 30–42 | 18–30 | < 18 |
| L5 | **Execution des contrats (delai jours)** | World Bank | < 250 | 250–400 | 400–550 | 550–750 | 750–1000 | 1000–1500 | > 1500 ou inexecutable |
| L6 | **Independance judiciaire** | WJP / V-Dem | Tres elevee | Elevee | Moderee | Faible | Tres faible | Instrumentalisee | Justice politique |
| L7 | **Traites bilateraux d'investissement (BIT actifs)** | UNCTAD IIA | > 70 | 50–70 | 35–50 | 20–35 | 10–20 | 5–10 | < 5 ou denonces |
| L8 | **Efficacite anti-corruption** | GRECO / OECD / UNCAC | Tres efficace | Efficace | Moderee | Faible | Tres faible | Facade | Inexistante |
| L9 | **Acces arbitrage international (ICSID)** | ICSID / CNUDCI | Membre actif, respecte | Membre actif | Membre, execution partielle | Non-membre mais respecte | Execution incertaine | Refus d'execution | Refus + expropriation |
| L10 | **Risque expropriation / nationalisation** | EIU / MIGA | Negligeable | Tres faible | Faible | Modere | Eleve (precedents) | Tres eleve (recent) | En cours / systematique |

```
Score_quanti_L = moyenne(L1..L10)
```

---

## I — Intelligence Artificielle (9 indicateurs) — EXCLUSIVE SEMPLICE

Sens de l'echelle : **7 = dependance / vulnerabilite maximale**. Construit : puissance IA autonome
d'un Etat vs dependance (compute, puces, modeles, energie, statecraft). Orthogonal a Cyber
(posture reseaux) et a Militaire (systemes d'armes).

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| IA1 | **Souverainete du compute (% capacite data centers sous controle national)** | Synergy Research / SemiAnalysis / Uptime Institute / Cloudscene | > 80% | 65–80% | 50–65% | 35–50% | 20–35% | 8–20% | < 8% |
| IA2 | **Dependance semi-conducteurs avances (acces puces < 7 nm/HBM, exposition export controls)** | BIS Entity List / Georgetown CSET / CSIS / SIA / TechInsights | Production nationale de pointe | Production nationale partielle | Fournisseurs allies diversifies | Dependance a un fournisseur unique | Dependance + controles renforces | Dependance + sanctions partielles | Embargo total (retrait de modeles type **Fable 5**) |
| IA3 | **Capacite data centers installee (W IA / habitant)** | IEA Data Centres & Networks / Epoch AI / Uptime Institute / Baxtel | > 40 | 25–40 | 10–25 | 5–10 | 2–5 | 0.5–2 | < 0.5 |
| IA4 | **Souverainete des modeles (modeles de fondation nationaux)** | Epoch AI (Notable AI Models) / Stanford HAI AI Index / Artificial Analysis / LMSYS Arena | Modeles frontiere nationaux | Modeles nationaux compétitifs (2e rang) | Modeles nationaux de niche | Dependance modeles ouverts etrangers | Dependance modeles proprietaires etrangers | Acces restreint / partiel | Acces revocable ou revoque |
| IA5 | **Puissance IA adverse projetable (domination compute regionale par un rival)** | IISS / Georgetown CSET / RAND / OSINT | Aucune | Rival present, non dominant | Rival en avance moderee | Rival en avance sensible | Rival dominant regional | Rival dominant + posture agressive | Rival dominant + IA offensive documentee dirigee vers la zone |
| IA6 | **Investissement IA public + prive (% PIB)** | OECD.AI / Stanford HAI AI Index / Air Street « State of AI » / Dealroom | > 1.5% | 0.8–1.5% | 0.4–0.8% | 0.2–0.4% | 0.1–0.2% | 0.03–0.1% | < 0.03% |
| IA7 | **Talent IA (chercheurs IA / 100k hab. + solde migratoire des talents)** | MacroPolo Global AI Talent Tracker / OECD.AI / LinkedIn Economic Graph / Scopus | > 30 et gain net | 15–30, gain net | 8–15, equilibre | ~5, equilibre | 2–5, solde negatif leger | 1–2, exode modere | < 1 ou exode massif |
| IA8 | **Contrainte energetique du compute (capacite electrique disponible pour data centers)** | IEA / Ember / EPRI / operateurs de reseau nationaux | Excedent + prix bas | Excedent + prix moderes | Equilibre offre/demande | Tension moderee | Tension forte (délestages ponctuels) | Tension critique (rationnement) | Incapacite d'alimenter (delestages) |
| IA9 | **Statecraft IA (capacite de l'Etat a orienter/financer/restreindre sa puissance IA : allocation de compute, participation aux champions, levier export)** | OECD.AI Policy Observatory / Carnegie Endowment / Georgetown CSET / OSINT | Controle effectif complet | Controle fort, leviers multiples | Leviers significatifs | Leviers partiels | Leviers limites | Leviers marginaux | Aucun levier (capture etrangere ou privee totale) |

```
Score_quanti_I = ponderation intra-dimension : IA2 et IA9 (w=3, critiques), IA6 (w=1, mineur), reste w=2
                 = Sigma(w_i x palier_i) / Sigma(w_i)  sur IA1..IA9
```

Bandes 1-7 completes : les colonnes 1/4/7 de la spec sont des ancres ; les paliers 2/3/5/6
sont interpoles de facon monotone et coherente avec le style des autres tables de la grille.

**Bloc de reference — sources de donnees tech/IA (v3)**

| Categorie | Sources primaires | Cadence |
|-----------|-------------------|---------|
| Compute & data centers | IEA Data Centres & Networks, Synergy Research, Uptime Institute, SemiAnalysis, Cloudscene, Baxtel | trimestrielle |
| Semi-conducteurs & export controls | BIS Entity List, Georgetown CSET, CSIS, SIA, TechInsights | evenementielle + trimestrielle |
| Modeles & capacites | Epoch AI, Stanford HAI AI Index (annuel), Artificial Analysis, LMSYS, Hugging Face | mensuelle |
| Investissement & ecosysteme | OECD.AI, Dealroom, CB Insights, Crunchbase, Air Street « State of AI » (annuel), fDi Markets | trimestrielle |
| Talent | MacroPolo Global AI Talent Tracker, LinkedIn Economic Graph, Scopus | annuelle |
| Politique & statecraft | OECD.AI Policy Observatory, Carnegie, RAND, CSET | evenementielle |
| Energie | IEA, Ember, EPRI, operateurs de reseau | trimestrielle |

Ces sources alimentent aussi la veille continue (`veille-continue.mjs` / Routines) : ajouter les
flux correspondants a la watchlist (theme « IA souveraine ») fait partie du plan d'implementation.

**Frontieres anti-double-comptage** :
- vs **M** : systemes d'armes autonomes restent dans M ; IA5 mesure la domination compute/modeles.
- vs **C** : C11 (cloud *exposure*) = surface d'attaque ; IA3 = puissance installee. Construits distincts.
- vs **L** : IA9 = levier de puissance de l'Etat sur ses champions ; L = cadre reglementaire general.
- vs **E** : E14 (cout de l'energie) reste dans E (intrant economie entiere) ; IA8 mesure la
  *disponibilite pour le compute* specifiquement.

**Regle de coherence (validateur)** : remplace l'ancien check |I−C| ≤ 2 par « si IA ≤ 2 (puissance
souveraine forte) alors C ≤ 4 attendu (un Etat a compute souverain a une posture cyber au moins
correcte) — sinon justification obligatoire ».

Note : la dimension IA n'a pas de facteur de resilience a ce stade (donnees trop jeunes) —
candidat futur : « diversification des fournisseurs de compute ».

---

## C — Cyber & controle informationnel (14 indicateurs) — EXCLUSIVE SEMPLICE

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| C1 | **National Cyber Security Index (0-100)** | NCSI / e-GA | > 82 | 70–82 | 58–70 | 45–58 | 32–45 | 20–32 | < 20 |
| C2 | **Global Cybersecurity Index (0-100)** | ITU GCI | > 92 | 80–92 | 65–80 | 50–65 | 35–50 | 20–35 | < 20 |
| C3 | **Incidents cyber majeurs (12 mois)** | Mandiant / CrowdStrike | 0 | 1 mineur | 2–3 mineurs | 1 majeur | 2–3 majeurs | 4–6 majeurs | > 6 ou cyberguerre |
| C4 | **Capacite offensive etatique (APT actifs)** | MITRE ATT&CK | 0 | 1–2 surveillance | 3–5 espionnage | 6–10 actifs | 11–20 destructifs | 21–40 | > 40 ou cyber-ops offensives |
| C5 | **Exposition infrastructure critique** | ENISA / CISA | Resiliente | Faible | Moderee | Significative | Elevee | Tres elevee | Critique (SCADA exposes) |
| C6 | **Budget cyberdefense (% budget defense)** | IISS / OSINT | > 8% | 5–8% | 3–5% | 1.5–3% | 0.5–1.5% | 0.1–0.5% | < 0.1% ou inconnu |
| C7 | **Rancongiciel (incidents 12 mois, zone) (12 mois, zone)** | Chainalysis / ENISA | 0 | 1–5 | 6–15 | 16–40 | 41–100 | 101–250 | > 250 |
| C8 | **Attaques chaine d'approvisionnement (12 mois)** | Mandiant / SolarWinds tracker | 0 | 1 | 2–3 | 4–6 | 7–12 | 13–25 | > 25 |
| C9 | **Workforce cyber (professionnels / 100k hab.)** | ISC2 / ENISA | > 200 | 120–200 | 70–120 | 40–70 | 20–40 | 8–20 | < 8 |
| C10 | **Legislation souverainete donnees** | OSINT / GDPR tracker | Cadre mature (GDPR-equiv) | Cadre solide | En cours | Partiel | Minimal | Aucun | Surveillance d'Etat active |
| C11 | **Cloud infrastructure exposure** | Shodan / Censys | Tres faible | Faible | Moderee | Significative | Elevee | Tres elevee | Critique |
| C12 | **Zero-day market exposure** | Zerodium / Google TAG | Negligeable | Faible | Moderee | Significative | Elevee | Tres elevee | Cible prioritaire |
| C13 | **Censure & controle numerique (fusion ex-I2 Freedom on the Net + ex-I4 censure internet + ex-I12 usage VPN)** | Freedom House / OONI / AccessNow / Top10VPN | Aucune censure, internet libre | Censure marginale | Censure ciblee limitee | Censure sectorielle | Censure large + contournement repandu | Censure systematique | Coupures / verrouillage total |
| C14 | **Operations d'influence & manipulation IA (fusion ex-I3 operations d'influence + ex-I7 desinformation IA/deepfakes + ex-I11 comptes coordonnes)** | EU DisinfoLab / DFRLab / VIGINUM / Stanford IO | Aucune operation identifiee | Operations isolees | Operations recurrentes limitees | Operations frequentes | Operations coordonnees a grande echelle | Operations systemiques multi-vecteurs | Guerre cognitive / manipulation IA generalisee |

```
Score_quanti_C = moyenne(C1..C14) [14 indicateurs, CM1 exclu]
```

**Sous-coefficients** : C13 = moyenne des paliers (ex-I2, ex-I4, ex-I12), 1/3 chacun, palier =
arrondi de la moyenne des paliers des composantes. C14 = moyenne des paliers (ex-I3, ex-I7,
ex-I11), 1/3 chacun, meme regle d'arrondi.

**CM1 — Modificateur contextuel (ex-I6 penetration reseaux sociaux)** : **non score**, n'entre
pas dans la moyenne de C. Module l'interpretation de C13 : un score faible de penetration dans
un pays autoritaire amplifie l'efficacite de la censure (C13) ; un score faible dans un pays
democratique pauvre est neutre.

---

## E_env — Environnemental (10 indicateurs)

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| Ee1 | **ND-GAIN Country Index (0-100)** | Notre Dame | > 70 | 60–70 | 52–60 | 44–52 | 36–44 | 28–36 | < 28 |
| Ee2 | **Aqueduct Water Stress (0-5)** | WRI | < 0.8 | 0.8–1.5 | 1.5–2.2 | 2.2–3.0 | 3.0–3.8 | 3.8–4.5 | > 4.5 |
| Ee3 | **Dependance ressources extractives (% exports)** | World Bank / EITI | < 8% | 8–18% | 18–30% | 30–45% | 45–60% | 60–80% | > 80% |
| Ee4 | **Catastrophes naturelles majeures (5 ans)** | EM-DAT / CRED | 0 | 1–2 | 3–5 | 6–9 | 10–15 | 16–25 | > 25 |
| Ee5 | **Transition energetique (% renouvelables)** | IEA / IRENA | > 60% | 45–60% | 30–45% | 18–30% | 8–18% | 3–8% | < 3% |
| Ee6 | **Emissions CO2 / capita (tonnes)** | Global Carbon Project | < 2 | 2–4 | 4–7 | 7–10 | 10–15 | 15–25 | > 25 |
| Ee7 | **Biodiversite menacee (% especes IUCN Red List)** | IUCN | < 5% | 5–10% | 10–18% | 18–28% | 28–40% | 40–55% | > 55% |
| Ee8 | **Deforestation (% perte couvert forestier / an)** | Global Forest Watch | < 0.1% | 0.1–0.3% | 0.3–0.6% | 0.6–1% | 1–2% | 2–4% | > 4% |
| Ee9 | **Exposition montee des eaux (% pop. zone < 5m)** | Climate Central | < 1% | 1–3% | 3–6% | 6–12% | 12–20% | 20–35% | > 35% |
| Ee10 | **Pollution air urbain (PM2.5 ug/m3)** | OMS / IQAir | < 10 | 10–18 | 18–30 | 30–45 | 45–70 | 70–100 | > 100 |

```
Score_quanti_Ee = moyenne(Ee1..Ee10)
```

---

## K — Culturel (module optionnel, 6 indicateurs)

> **Module greffe** active sur les angles Investissement / Supply Chain / Implantation uniquement.
> Detail complet et seuils : [module-culturel-hofstede-hall.md](module-culturel-hofstede-hall.md).

| # | Indicateur | Source | Reference France |
|---|-----------|--------|-----------------|
| K1 | **Power Distance (PDI)** | Hofstede Insights | 68 |
| K2 | **Uncertainty Avoidance (UAI)** | Hofstede Insights | 86 |
| K3 | **Individualism (IDV)** | Hofstede Insights | 71 |
| K4 | **Long-Term Orientation (LTO)** | Hofstede Insights | 63 |
| K5 | **Contexte communicationnel (low/high context Hall)** | Litterature Hall + grille experte | mixte tendant high (5) |
| K6 | **Distance culturelle composite (Kogut-Singh vs France)** | Calcule a partir de K1-K4 | 0 par definition |

```
Score_quanti_K = moyenne(K1..K6)
S_K = 0.60 x Score_quanti_K + 0.40 x Score_quali_K
```

**Particularites** :
- Calibrage par defaut vs **France** (referent parametrable, cf. RK3 du module).
- Pas d'amplification de crete ni de velocite (RK4, RK5) — la culture est structurelle.
- Desactive sur l'angle Defaut (rétrocompatibilite v2.0).

---

## Recapitulatif

| Dimension | Nb indicateurs v1.1 | Nb indicateurs v2.0 (base) | Nb indicateurs v3.0 | Evolution v1.1→v3.0 |
|-----------|---------------------|---------------------|---------------------|-----------|
| S — Social | 5 | 12 | **12** | +140% |
| E — Economique | 6 | 15 | **16** *(+E16 precurseur)* | +167% |
| M — Militaire | 7 | 12 | **13** *(+M13 precurseur)* | +86% |
| P — Politique | 5 | 12 | **18** *(+P13-15 precurseurs, +P16-18 ex-I)* | +260% |
| L — Legal | 5 | 10 | **10** | +100% |
| I — Intelligence Artificielle *(ex-Information)* | 5 | 12 | **9** *(repurpose IA1-IA9)* | +80% |
| C — Cyber & controle informationnel | 5 | 12 | **14** *(+C13-14 ex-I)* | +180% |
| Ee — Environnemental | 5 | 10 | **10** | +100% |
| **TOTAL risque** | **43** | **95 (base)** | **102** | **+137%** |

Ce tableau donne le comptage de base par dimension. Le total 95 (v2.0 base) devient 100 avec les
6 precurseurs v2.1 (P13-15, M13, E16), puis 102 en v3.0 avec la redistribution de l'ancien I
(voir « Récapitulatif v3.0 » en fin de document pour le detail complet, K et resilience inclus).

---

## Ponderations par angle decisionnel (v3.0)

> Depuis avril 2026, le module optionnel **K — Culturel** ([detail](module-culturel-hofstede-hall.md))
> peut etre active sur les angles Investissement / Supply Chain / Implantation.
> Il reste desactive (poids 0%) sur l'angle Defaut pour preserver la retrocompatibilite v2.0.

> **Colonne Défaut = source de vérité `scripts/semplice-validator.mjs` (`DIMENSION_WEIGHTS`).**
> Les poids par défaut sont **différenciés** (cf. section « Pondération dimensionnelle » ci-dessous),
> et non uniformes. L'ancienne valeur 12,5 % (équipondération) n'a jamais été appliquée par le code.

| Dimension | Defaut | Investissement | Supply Chain | Implantation |
|-----------|--------|---------------|--------------|-------------|
| S | 12% | 4.5% | 8% | 10% |
| E | 15% | **22%** | 10% | 10% |
| M | **16%** | 8% | **16%** | 8% |
| P | 14% | 15% | 8% | 15% |
| L | 9% | 12.5% | 7% | **18%** |
| **I — IA** | **13%** | 8% | 10% | 8% |
| C | 11% | 10% | **22%** | 8% |
| Ee | 10% | 12% | 14% | 8% |
| **K** (optionnel) | **0%** | **8%** | **5%** | **15%** |
| **Total** | 100% | 100% | 100% | 100% |

**Reajustements v2.1 → v3.0** : la dimension IA gagne la ou le compute est decisionnel (Defaut
+1 pt, Investissement +2,5 pts, Supply Chain +3 pts), finance par L (portee reduite, cf. audit
2026-06-18) et marginalement M sur Supply Chain (18%→16%). L'angle Implantation reste inchange
(l'IA y est peu discriminante).

**Logique des transferts K (v2.1+K, conservee)** : K subsume une part du poids S (la culture
business est une sous-composante du social) et une part de l'ancien poids I informationnel. C
est preserve car la cyber n'est pas culturellement absorbee.

---

## Pondération dimensionnelle

### Poids fixes par dimension

Le composite SEMPLICE v3.0 utilise une moyenne pondérée (et non arithmétique) des 8 dimensions. Les poids reflètent l'impact relatif de chaque dimension sur le risque géopolitique global.

| Dimension | Poids | Justification |
|-----------|:-----:|---------------|
| **M** — Militaire | 16% | Menace physique directe, conséquences irréversibles |
| **E** — Économique | 15% | Stabilité systémique, impact sur toutes les autres dimensions |
| **P** — Politique | 14% | Gouvernance, stabilité du régime, capacité de réponse |
| **I** — Intelligence Artificielle | 13% | Dimension exclusive SEMPLICE, enjeu de pouvoir IA (souverainete du compute, dependance technologique, statecraft) |
| **S** — Social | 12% | Fondamentaux de la population, cohésion sociale |
| **C** — Cyber | 11% | Vecteur de menace moderne, multiplicateur de force, dimension exclusive SEMPLICE |
| **Ee** — Environnemental | 10% | Risque structurel de long terme |
| **L** — Légal | 9% | Environnement des affaires, cadre institutionnel — portée réduite sur l'angle Défaut, cf. audit 2026-06-18 (financement du transfert vers I) |
| **Total** | **100%** | |

**Formule** : `Composite = Σ (poids_d × scoreFinal_d)` pour d ∈ {S, E, M, P, L, I, C, Ee} (I = Intelligence Artificielle)

### Pondération intra-dimension (v3, nouveau)

Jusqu'en v2.1, `Score_quanti_d` etait toujours une moyenne arithmetique simple des paliers d'une
dimension (aucun indicateur n'avait plus de poids qu'un autre). La v3.0 introduit une
ponderation intra-dimension optionnelle par tags **critique / majeur / mineur**.

```
Score_quanti_d = Σ (w_i × palier_i) / Σ (w_i)      w_i ∈ {3 = critique, 2 = majeur, 1 = mineur}
```

**Defaut** : tout indicateur non tague est considere **majeur (w=2)** — la moyenne ponderee reste
alors strictement equivalente a la moyenne simple v2.1 (retrocompatibilite exacte tant qu'aucun
tag n'est pose).

**Table des tags initiaux** :

| Dimension | Critiques (w=3) | Mineurs (w=1) |
|-----------|-----------------|----------------|
| S | S6 (tensions ethniques), S11 (securite alimentaire) | S8 (urbanisation) |
| E | E2 (inflation), E7 (reserves), E16 (independance BC) | E13 (economie informelle) |
| M | M2 (conflits actifs), M13 (fiabilite protecteur) | M4 (exercices) |
| P | P5 (risque changement regime), P13 (capture institutionnelle) | P11 (pression demographique) |
| L | L3 (sanctions), L10 (expropriation) | L7 (BIT) |
| I (IA) | IA2 (semi-conducteurs), IA9 (statecraft) | IA6 (investissement — donnee bruitee) |
| C | C3 (incidents majeurs), C5 (infra critique) | C7 (rancongiciels) |
| Ee | Ee2 (stress hydrique) | Ee6 (CO2/capita), Ee7 (biodiversite) |

Tous les autres indicateurs : majeur (w=2). Cette table est une **proposition de calibration** —
a valider par backtest (les 12 crises + 5 cas d'endiguement) avant application aux 18 zones.

### Amplification du risque dominant (amplification de pic)

Mécanisme adaptatif pour les profils asymétriques où une dimension critique est diluée par la moyenne.

**Principe** : toute dimension dont le scoreFinal dépasse le composite pondéré de base de plus de **1.0 point** reçoit une majoration de pondération proportionnelle à l'écart.

**Algorithme** :
1. Calculer le composite pondéré de base (poids fixes)
2. Pour chaque dimension d où `scoreFinal_d - compositeBase > 1.0` :
   - Majoration poids = `0.20 × (scoreFinal_d - compositeBase - 1.0)`
3. Renormaliser tous les poids pour que la somme = 100%
4. Recalculer le composite avec les poids amplifiés
5. Plafond d'amplification : **+0.3 point** maximum sur le composite

**Exemples de calibration** (évaluations test v2.0) :

| Zone | Simple avg | Pondéré | Amplifié | Δ | Dimensions amplifiées |
|------|:---------:|:-------:|:--------:|:-:|----------------------|
| Île Maurice | 2.5 | 2.37 | 2.49 | +0.12 | Ee (3.8, Δ=+1.43) |
| Inde | 3.9 | 3.86 | 3.87 | +0.01 | Ee (4.9, Δ=+1.04) |
| Singapour | 2.2 | 2.20 | 2.20 | 0.00 | I (3.2, Δ=+1.00, seuil) |
| Ukraine | 5.6 | 5.66 | 5.66 | 0.00 | Aucune (profil uniforme) |

**Interprétation** : L'amplification corrige le biais de la moyenne sur les profils PEID (petits États insulaires) et les pays à risque sectoriel isolé. Elle n'a pas d'effet sur les profils uniformément élevés (Ukraine) ou uniformément faibles (Singapour).

---

## Évaluation sub-nationale (v2.1 — pilote)

Pour les grands pays fédéralistes ou à forte hétérogénéité régionale, SEMPLICE propose une évaluation sub-nationale en complément du score pays.

### Critères d'éligibilité

Un pays est éligible à l'évaluation sub-nationale si :
- Population > 100M habitants, OU
- Structure fédérale/décentralisée, OU
- Écart-type intra-national > 1.5 points sur au moins 3 dimensions

**Pays candidats** : Inde, Brésil, Russie, Nigeria, Indonésie, Pakistan, États-Unis, Chine

### Modèle hybride héritage/réévaluation

| Dimension | Niveau | Méthode |
|-----------|--------|---------|
| **S** Social | Régional | Réévaluation complète (IDH, chômage, santé, éducation varient fortement) |
| **E** Économique | Mixte | PIB régional + héritage national (dette, rating, politique monétaire) |
| **M** Militaire | Régional | Réévaluation (zones de conflit localisées) |
| **P** Politique | Régional | Réévaluation (gouvernance locale, séparatisme, tensions) |
| **L** Légal | National hérité | Cadre fédéral unique, delta possible (efficacité justice locale) |
| **I** Intelligence Artificielle *(v3.0 — note : le bloc presse/médias, ex-composante I, est désormais dans P16-P18)* | National hérité | Infrastructure compute et politique IA typiquement nationales (data centers, statecraft) |
| **C** Cyber | National hérité | Infrastructure nationale, CERT central |
| **Ee** Environnemental | Régional | Réévaluation complète (eau, pollution, climat très géographiques) |

**Dimensions réévaluées** (4) : S, M, P, Ee — forte variance intra-nationale
**Dimensions héritées** (3, v3.0) : L, C, I — cadre national dominant
**Dimensions mixtes** (1, v3.0) : E — composante nationale + delta régional

> Note v3.0 : la redistribution de l'ancien I (presse/médias vers P16-P18) fait de P une dimension
> "Mixte" à la fois pour ses composantes historiques (gouvernance locale) et pour le bloc presse
> hérité. La classification P reste "Régional" par défaut (poids dominant gouvernance/séparatisme).

### Score sub-national

`ScoreRégion_d = ScoreNational_d + DeltaRégional_d` (pour dimensions mixtes/héritées)
`ScoreRégion_d = évaluation locale` (pour dimensions réévaluées)

Le **score national** peut être recalculé comme moyenne pondérée par population des scores régionaux :
`ScoreNational_d = Σ (pop_r / pop_total × ScoreRégion_r_d)`

### Macro-régions Inde (pilote, 6 régions)

| # | Macro-région | États principaux | Profil de risque attendu |
|---|-------------|-----------------|-------------------------|
| 1 | Nord-Ouest | Cachemire, Punjab, Rajasthan | M dominant (conflit actif Cachemire) |
| 2 | Indo-Gangétique | UP, Bihar, MP | S dominant (pauvreté, densité, sous-développement) |
| 3 | Nord-Est | Assam, Manipur, Nagaland | M+P (insurgences, isolement, tensions ethniques) |
| 4 | Ouest | Gujarat, Maharashtra, Goa | Pole economique, risque modere |
| 5 | Sud | Tamil Nadu, Kerala, Karnataka, AP | S+E forts, Ee en hausse (montée des eaux) |
| 6 | Est | Odisha, Jharkhand, Bengal | Ee+S (naxalisme résiduel, cyclones, pauvreté) |

---

## Indicateurs precurseurs — Schemas pre-crise recurrents (v2.1)

Indicateurs structurels a haute valeur predictive, identifies par analyse des 12 backtests. Chaque indicateur est present dans 4+ crises historiques. Ils sont integres dans les dimensions existantes et participent au score quanti de la dimension.

### P — Ajouts (6 indicateurs : 3 precurseurs v2.1 + 3 redistribues de l'ex-I v3.0)

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| P13 | **Capture institutionnelle (nb institutions cles controlees par le clan/parti dominant sur 5 : executif, judiciaire, BC, armee, medias)** | V-Dem / OSINT | 0-1 | 1 | 2 | 2-3 | 3-4 | 4 | 5/5 (capture totale) |
| P14 | **Chocs politiques auto-infliges (12 mois) : decisions radicales contraires au consensus expert** | OSINT / IMF Art. IV | 0 | 1 mineure | 1 majeure | 2 majeures | 3+ majeures | Cascades en cours | Politique etat de siege |
| P15 | **Fenetres d'action critiques (12 mois) : deadlines non-electorales forcant l'action (retraite militaire, expiration accord, succession sanitaire)** | OSINT | 0 | 1 lointaine | 1 proche | 2+ convergentes | Imminente + acteur pret | Imminente + mobilisation | Deadline passee, action en cours |
| P16 | **Liberte & pluralisme de la presse (fusion ex-I1 classement RSF + ex-I8 pluralisme mediatique)** | RSF | 1–20 (rang) / > 75 (pluralisme) | 21–45 / 60–75 | 46–80 / 45–60 | 81–120 / 30–45 | 121–150 / 18–30 | 151–170 / 8–18 | 171–180 / < 8 |
| P17 | **Controle etatique des medias (% audience)** *(ex-I5, repris tel quel)* | RSF / IREX MSI | < 10% | 10–20% | 20–35% | 35–50% | 50–70% | 70–90% | > 90% ou monopole |
| P18 | **Repression des journalistes (journalistes emprisonnes)** *(ex-I9, repris tel quel)* | RSF / CPJ | 0 | 1–3 | 4–10 | 11–25 | 26–50 | 51–100 | > 100 |

**Crises validees (precurseurs v2.1)** :
- P13 : Sri Lanka (Rajapaksa x6), Tunisie (Ben Ali/Trabelsi), Egypte (Moubarak 30 ans), Syrie (Assad 54 ans), Venezuela (chavisme), Myanmar (Tatmadaw), Bangladesh (Hasina/Awami) — **7/12**
- P14 : Sri Lanka (ban engrais), Turquie (baisses taux), Venezuela (ANC), Bangladesh (quotas 1971) — **4/12**
- P15 : Myanmar (retraite Min Aung Hlaing juil. 2021), Soudan (deadline integration RSF), Niger (accountability), Egypte (sante Moubarak) — **4/12**

**Note P12 elargi** : P12 (« Diaspora politique active ») absorbe l'ex-I10 (« Controle narratif
diaspora ») — la fusion est integree directement dans les paliers de P12, sans creation d'un
indicateur supplementaire (redistribution v3, cf. spec §5.2).

**Sous-coefficient P16** : paliers derives des seuils RSF des ex-indicateurs I1 (classement) et
I8 (composante pluralisme), moyenne des deux composantes, arrondi au palier le plus proche.

```
Score_quanti_P = moyenne(P1..P18) [18 indicateurs]
```

### M — Ajout (1 indicateur)

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| M13 | **Fiabilite du protecteur exterieur (engagement operationnel effectif vs theorique)** | IISS / OSINT | Protecteur engage, deploye | Protecteur credible | Engagement conditionnel | Engagement reduit | Redesengagement en cours | Retrait annonce | Protecteur absent ou redirige |

**Crises validees** : Syrie (Russie → Ukraine + Iran affaibli), Niger (retrait France), Liban (desengagement saoudien), Soudan (echec mediation), Egypte (hesitation US) — **5/12**

```
Score_quanti_M = moyenne(M1..M13) [13 indicateurs]
```

### E — Ajout (1 indicateur)

| # | Indicateur | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|--------|---|---|---|---|---|---|---|
| E16 | **Independance de la banque centrale (score composite : nomination gouverneur, mandat, historique limogeage, transparence, alignment politique monetaire/fiscal)** | IMF / OSINT / BIS | Pleine independance (type BCE/Fed) | Independance forte | Independance moderee | Autonomie reduite | Sous pression politique | Gouverneur limoge/soumis | BC instrumentalisee (impression, Ponzi) |

**Crises validees** : Turquie (3 gouverneurs limogés), Venezuela (BC imprime), Liban (BDL Ponzi), Sri Lanka (BC sous Rajapaksa), Bangladesh (gestion reserves opaque) — **5/12**

```
Score_quanti_E = moyenne(E1..E16) [16 indicateurs]
```

### Total indicateurs v3.0 : S12 + E16 + M13 + P18 + L10 + I9 + C14 + Ee10 = **102 indicateurs risque**

---

## Facteurs de resilience — Schemas d'endiguement recurrents (v2.1)

Indicateurs identifies par analyse des crises evitees (Turquie post-2023, Bresil post-jan 2023, Singapour, Ile Maurice) et des 7 deescalation events dans semplice-history.json. Chaque facteur est present dans 3+ cas d'endiguement.

### Architecture

Les facteurs de resilience sont des **modificateurs negatifs** : scores 1-7 ou **1 = aucune resilience** et **7 = resilience maximale**. Ils sont integres dans les dimensions existantes avec une **notation inverse** : un score de resilience eleve REDUIT le score final de la dimension.

**Formule modifiee** :
```
S_d = 0.60 x Score_quanti_risque + 0.40 x Score_quali - Bonification_resilience_d
Bonification_resilience_d = 0.15 x max(0, ScoreResilience_d - 4)
```

Interpretation : un facteur de resilience au-dessus de 4 (modere) commence a reduire le score de la dimension. Effet maximal : -0.45 points (quand resilience = 7). L'effet est **plafonné** : le score final ne peut pas descendre en dessous de 1.0.

### Indicateurs de resilience (6)

| # | Indicateur | Dimension | Source | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|-----------|-----------|--------|---|---|---|---|---|---|---|
| RS1 | **Contre-pouvoir societe civile (syndicats, ONG, universites comme force de rappel)** | S | V-Dem / CIVICUS | Inexistant | Reprime | Tolere | Actif mais faible | Actif structure | Force de mediation | Pilier institutionnel (UGTT Tunisie, CGT France) |
| RE1 | **Capacite de correction monetaire (acces FMI, pivots BC possibles, swap lines)** | E | IMF / OSINT | Aucune | Tres limitee | Limitee | Moderee | Acces programmes FMI | Pivot credible recent | Filet complet (swap lines + reserves + FMI) |
| RM1 | **Doctrine republicaine de l'armee (historique non-intervention dans la politique)** | M | V-Dem / OSINT | Armee au pouvoir | Interventions frequentes | 1 intervention recente (<10 ans) | Neutre (pas de doctrine claire) | Doctrine non-intervention | Non-intervention testee et respectee | Refus documente de coup (Bresil 2023, Tunisie 2011) |
| RP1 | **Alternance democratique fonctionnelle (election credible avec changement effectif dans les 10 dernieres annees)** | P | V-Dem / IFES | Aucune alternance | Alternance >20 ans | Alternance 10-20 ans | Alternance <10 ans contestee | Alternance <10 ans ordonnee | Alternance reguliere + locale | Alternance recente reussie + locale (Turquie CHP 2024, Bresil Lula 2022) |
| RI1 | **Pluralisme mediatique residuel (existence d'au moins 1 media independant credible a audience significative)** | **P** *(v3.0 — rattache a P, ex-I en v2.1)* | RSF / IREX MSI | Aucun | 1 en exil | 1 local marginal | 1-2 locaux <10% audience | 2-3 locaux 10-25% audience | Pluralisme reel 25-50% | Ecosysteme pluraliste >50% |
| RL1 | **Autonomie judiciaire effective (capacite demontree a bloquer l'executif)** | L | WJP / V-Dem / OSINT | Justice captive | Justice soumise | Independance theorique | 1 blocage mineur (<5 ans) | Blocages reguliers | Annulation decision majeure (Bresil STF) | Tradition constitutionnelle etablie (Cour supreme type US/DE) |

**Rattachement RI1 → P (v3.0)** : RI1 suit le bloc presse (P16-P18) dans la redistribution de
l'ancien I. La dimension P porte donc **2 facteurs de resilience** (RP1 et RI1) :

```
Bonification_P = 0.15 x max(0, moyenne(RP1, RI1) - 4)
```

Toutes les autres dimensions (S, E, M, L) continuent de porter un seul facteur de resilience,
formule standard `Bonification_d = 0.15 x max(0, ScoreResilience_d - 4)`. La dimension IA n'a
aucun facteur de resilience (cf. section I ci-dessus).

### Validation sur cas d'endiguement

| Facteur | Turquie post-2023 | Bresil post-2023 | Singapour | Ile Maurice | Tunisie 2011-2014 |
|---------|:-:|:-:|:-:|:-:|:-:|
| RS1 Societe civile | 3 | 5 | 2 | 4 | **6** (UGTT) |
| RE1 Correction monetaire | **6** (pivot TCMB) | 4 | 7 | 4 | 3 |
| RM1 Doctrine republicaine | 3 | **6** (refus coup) | 6 | 7 (pas d'armee) | **6** (armee neutre) |
| RP1 Alternance democratique | **6** (CHP 2024) | **6** (Lula 2022) | 2 | **6** (alternance reguliere) | 5 (elections 2011/2014) |
| RI1 Pluralisme mediatique | 3 | 5 | 2 | 5 | 4 |
| RL1 Autonomie judiciaire | 3 | **7** (STF) | 5 | 5 | 4 |

### Crises ou l'absence de resilience est le facteur determinant

| Crise | RS1 | RE1 | RM1 | RP1 | RI1 | RL1 | Facteur absent decisif |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|----------------------|
| Myanmar 2021 | 2 | 2 | **1** | 2 | 2 | 1 | RM1 : armee constitutionnellement au pouvoir |
| Soudan 2023 | 2 | 1 | **1** | 1 | 1 | 1 | RM1+RL1 : dualite SAF/RSF + pas de justice |
| Venezuela 2017 | 2 | 1 | 2 | 1 | 2 | **1** | RL1 : TSJ instrumentalise |
| Syrie 2024 | 1 | 1 | 1 | 1 | 1 | 1 | Tout absent — effondrement total |
| Bangladesh 2024 | 3 | 3 | 4 | **1** | 1 | 2 | RP1+RI1 : election boycottee + blackout |
| Niger 2023 | 2 | 2 | **1** | 3 | 2 | 2 | RM1 : contagion coups + pas de doctrine |

**Schema cle** : quand RM1 (doctrine republicaine) + RL1 (autonomie judiciaire) sont tous deux ≤ 2, le risque de coup ou d'effondrement institutionnel est quasi-certain si P ≥ 5.0. C'est la **signature d'absence de garde-fou**.

---

## Mecanisme de velocite (v2.1)

### Principe

Les 101 indicateurs mesurent des **niveaux** (instantanes). La velocite mesure la **derivee premiere** — la vitesse de changement par trimestre. La velocite est souvent plus predictive que le niveau absolu.

### Calcul

Pour chaque dimension d, entre deux evaluations espacees de Δt trimestres :

```
Velocite_d = (scoreFinal_d(t) - scoreFinal_d(t-1)) / Δt
```

### Seuils d'alerte

| Velocite (Δ/trimestre) | Niveau | Action |
|:-:|--------|--------|
| < 0.15 | Stable | Pas d'alerte |
| 0.15 – 0.30 | Acceleration | Signal faible — surveiller |
| 0.30 – 0.50 | Escalade rapide | Alerte — reevaluation recommandee |
| > 0.50 | Crise emergente | Alerte critique — reevaluation immediate |

### Validation sur backtests

| Crise | Dimension | Δ absolu | Periode | Velocite/trim. | Seuil |
|-------|-----------|:--------:|:-------:|:-:|:-:|
| Ukraine (WhisperGate) | C | +1.6 | 3 mois (1 trim) | **+1.6** | CRITIQUE |
| Turquie (lira) | E | +1.0 | 2 mois (<1 trim) | **>2.0** | CRITIQUE |
| Liban (effondrement) | E | +1.5 | 8 mois (2.7 trim) | **+0.56** | CRITIQUE |
| Bangladesh (quotas) | S | +0.8 | 2 mois (<1 trim) | **>1.0** | CRITIQUE |
| Syrie (HTS offensive) | M | +1.0 | 3 mois (1 trim) | **+1.0** | CRITIQUE |
| Soudan (guerre) | M | +0.8 | 3 mois (1 trim) | **+0.8** | CRITIQUE |

Le mecanisme de velocite aurait genere une alerte critique dans **6/12 crises** avec une avance de 0-3 mois sur l'evenement cinetique. C'est complementaire au score de niveau : la velocite detecte l'**acceleration terminale**.

### Integration dans le composite

La velocite ne modifie pas le composite directement. Elle genere des **alertes** dans le rapport de validation (Layer 1 du validateur, nouvelle regle R9).

---

## Regles de validation supplementaires (v2.1)

### R9 — Facade economique

**Declencheur** : E1 (croissance PIB) ≤ palier 3 ET (E3 ≥ 5 OU E7 ≥ 5 OU E12 ≥ 5)
**Signification** : la croissance headline masque une fragilite structurelle (dette, reserves, credit)
**Crises validees** : Bangladesh (PIB +5.8% / reserves en chute), Turquie (PIB +7.3% / bulle credit), Liban (inflation 3% / Ponzi), Sri Lanka (croissance / reserves negatives) — **4/12**
**Action** : signal "facade-economique" + recommandation de majorer le score quali E de +1

### R10 — Absence de garde-fou

**Declencheur** : RM1 ≤ 2 ET RL1 ≤ 2 ET P ≥ 5.0
**Signification** : ni l'armee ni la justice ne peuvent freiner une derive du pouvoir
**Crises validees** : Myanmar (RM1=1, RL1=1, P=6.5), Soudan (1,1,6.3), Venezuela (2,1,6.5), Syrie (1,1,6.5), Niger (1,2,4.5) — **5/12**
**Action** : signal "absence-garde-fou" + signature automatique "regime collapse" si P ≥ 6.0

### R11 — Velocite critique

**Declencheur** : Velocite_d > 0.50 pour au moins 1 dimension d
**Signification** : acceleration terminale en cours, la crise est probablement imminente
**Crises validees** : Ukraine C(+1.6), Turquie E(>2.0), Liban E(+0.56), Bangladesh S(>1.0), Syrie M(+1.0), Soudan M(+0.8) — **6/12**
**Action** : alerte "velocite-critique" + recommandation de reevaluation immediate

---

## Recapitulatif v2.1 (corrige) et v3.0

> **Correction de comptage (D8, audit 2026-06-18)** : le total v2.1 annonce a l'origine (107) etait
> errone. Les precurseurs P13-15, M13, E16 sont **5 indicateurs, pas 6** — le total reel v2.1 est
> **100** indicateurs risque (95 base + 5 precurseurs), soit **106** avec resilience (et 112 avec K).

| Categorie | v2.0 | v2.1 (reel, corrige) | v2.1 + K (reel) | v3.0 |
|-----------|:----:|:----:|:--------:|:----:|
| Indicateurs risque | 95 | **100** | 100 | **102** |
| Indicateurs resilience | 0 | **6** | 6 | 6 (RI1 rattache a P) |
| Indicateurs culturels (module optionnel) | 0 | 0 | **6** | 6 |
| **Total indicateurs** | **95** | **106** | **112** | **114** |
| Regles validateur | R1-R8 | R1-R11 | R1-R11 | R1-R11 (regle I-C remplacee par regle IA-C) |
| Mecanismes | Amplification de crete | Amplification de crete + Velocite + Modificateur resilience | + module K | + **ponderation intra-dimension** (tags 3/2/1) ; amplification **systematisee** (calculee, jamais saisie a la main) |
| Signatures | 6 | 6 + absence-garde-fou | 6 + absence-garde-fou | 6 + absence-garde-fou (SIG referencant I a recalibrer sur IA) |
| Dimensions | 8 (I = Information) | 8 (I = Information) | 8 (I = Information) | 8 (**I = Intelligence Artificielle**) |

---

## Recommandation operationnelle — Pont SEMPLICE → modalite d'approche

> Une fois le score SEMPLICE calcule, le **pont composite → modalite** convertit le diagnostic
> en recommandation actionnable (modalite d'export/implantation + mode de paiement).
>
> Detail complet, matrice de decision, algorithme et cas types : [pont-semplice-modalite-approche.md](pont-semplice-modalite-approche.md).

**Lecture rapide** : trois axes combines determinent la modalite recommandee :
1. **Composite SEMPLICE** (1-7) — niveau de risque global
2. **L+E moyenne** — securite juridico-financiere
3. **K** (si module actif) — friction culturelle

Modalites possibles, du plus engage au moins engage :
- **Controlee** (Filiale, Vente directe, Succursale, Bureau de representation, Agent salarie, Agent commercial)
- **Concertee** (JV, Franchise, Portage, Free Zone)
- **Sous-traitee** (Importateur, Centrale d'achat, SCI)
- **Abstention** (composite > 5.5 sur zones critiques)

Le pont integre des modulations pour **IA (>= 5)** *(anciennement « I >= 5 » ; devient « dependance
IA forte → retrograder d'un cran les modalites a forte exposition technologique »)*, C (>= 5),
traites bilateraux d'investissement (L7 <= 2) et velocite critique (rétrograder d'un cran si une
dimension d depasse +0.5/trimestre).

---

## Score qualitatif — Grille 1-7

| Score | Descripteur | Criteres |
|-------|------------|----------|
| **1** | Stable / Exemplaire | Trajectoire positive confirmee, aucun signal negatif, sources A+B convergentes |
| **2** | Tensions marginales | Signaux tres isoles, pas de tendance, contexte favorable |
| **3** | Risque latent | Signaux faibles identifies mais non materialises, 1 source B |
| **4** | Risque materialise | Tendance negative confirmee par 2+ sources, impact mesurable mais contenu |
| **5** | Crise emergente | Convergence sources A+B+C, dynamique d'escalade, impact significatif |
| **6** | Crise active | Impact severe, mecanismes de correction insuffisants, deterioration rapide |
| **7** | Rupture / Effondrement | Consensus des sources, irreversibilite a horizon 12 mois, pas de correction visible |

---

## Historique des modifications

| Version | Date | Modification |
|---------|------|-------------|
| v1.0 | 2026-03-11 | Creation — 40 indicateurs, echelle 1-5 |
| v1.1 | 2026-03-11 | +3 indicateurs (43 total), corrections backtests |
| v2.0 | 2026-03-12 | Echelle 1-7, 95 indicateurs, seuils recalibres, 4 pays tests (Ukraine, Singapour, Ile Maurice, Inde) |
| v2.1 | 2026-03-12 | +6 indicateurs precurseurs (P13-15, M13, E16), +6 resilience (RS1, RE1, RM1, RP1, RI1, RL1), +3 regles validateur (R9-R11), mecanisme velocite, 107 indicateurs total |
| v2.1 + K v1.0 | 2026-04-30 | Module optionnel **K — Culturel** (6 indicateurs Hofstede + Hall + Kogut-Singh 1988). Recalibrage des ponderations Investissement/Supply Chain/Implantation pour integrer K (poids 8% / 5% / 15%). |
| v3.0 | 2026-07-03 | I repurpose Intelligence Artificielle (9 indicateurs IA1-IA9), redistribution ancien I vers P (P16-P18) et C (C13-C14+CM1), poids Defaut I13/L9, ponderation intra-dimension (tags 3/2/1), RI1→P, corrections de comptage (v2.1 reel = 100, pas 107) |
