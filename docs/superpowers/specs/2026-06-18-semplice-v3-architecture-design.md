# SEMPLICE v3.0 — Architecture complète de la grille (design)

> Inflexion Intelligence — 18 juin 2026
> Spec de design issue du brainstorming « dimension IA + refonte pondération ».
> Référentiel unique : tous les niveaux de calcul, tous les coefficients, toutes les matrices.
> Prérequis : audit `docs/audits/2026-06-18-audit-calculs-semplice.md` (constats + corrections chantier A).

---

## 0. Décisions actées

| # | Décision | Détail |
|---|----------|--------|
| D1 | **I repurposé, pas de 9ᵉ lettre** | La dimension Information devient **I — Intelligence Artificielle** (« IA souveraine & compute »). L'acronyme S-E-M-P-L-I-C-E est préservé. |
| D2 | **Construit IA** | Puissance IA autonome d'un État vs dépendance (compute, puces, modèles, énergie, statecraft). Orthogonal à Cyber (posture réseaux) et à Militaire (systèmes d'armes). |
| D3 | **Redistribution ancien I** | 12 indicateurs relogés : bloc presse/médias → **P** ; censure numérique + manipulation → **C** ; I6 → modificateur contextuel dans C. Aucun comblement, zéro perte. |
| D4 | **Miroir opportunité** | `Io` repurposé « **Innovation & IA souveraine** » : socle innovation conservé + **6 indicateurs IA-opportunité** (Io9–Io14, renforcé sur demande utilisateur). |
| D5 | **Poids risque défaut** | I 12→**13**, L 10→**9** ; M/E/P/S/C/Ee inchangés. Retenue volontaire sur IA (données jeunes) — poids évolutif. |
| D6 | **Amplification** | Conservée et **systématisée** : les composites sont calculés (build/runtime), plus jamais stockés à la main (tranche le point 4 de l'audit). |
| D7 | **Pondération intra-dimension** | Introduite (tags critique/majeur/mineur → 3/2/1), tranche le point 2 de l'audit. |
| D8 | **Corrections de comptage v2.1** | Le total réel v2.1 est **100** indicateurs risque (pas 101/95+6 : les précurseurs P13-15, M13, E16 sont 5) et **64** opportunité (pas 66). Totaux v3 recalculés proprement ci-dessous. |

---

## 1. Vue d'ensemble de la chaîne de calcul

```
NIVEAU 0 — COMPOSITE      Composite = Σ (poids_d × S_d)         [8 dimensions, 4 angles]
NIVEAU 1 — DIMENSION      S_d = 0,60·quanti_d + 0,40·quali_d − Bonif_résilience_d
NIVEAU 2 — QUANTI         quanti_d = Σ(w_i × palier_i) / Σ(w_i)  [w_i ∈ {3,2,1} — NOUVEAU v3]
NIVEAU 3 — INDICATEUR     palier 1-7 par table de seuils à 7 bandes
NIVEAU 3b — SOUS-INDIC.   sous-coefficients explicites (E15, E16, P13, K6 — formalisés v3)
SURCOUCHES                amplification de pic · vélocité (alertes) · module K · pont modalité
```

---

## 2. NIVEAU 0 — Poids dimensionnels (8 matrices)

### 2.1 Risque

| Dimension | Défaut | Investissement | Supply Chain | Implantation |
|-----------|:------:|:--------------:|:------------:|:------------:|
| S — Social | 12 % | 4,5 % | 8 % | 10 % |
| E — Économique | 15 % | **22 %** | 10 % | 10 % |
| M — Militaire | **16 %** | 8 % | 16 % *(18→16)* | 8 % |
| P — Politique | 14 % | 15 % | 8 % | 15 % |
| L — Légal | 9 % *(10→9)* | 12,5 % *(15→12,5)* | 7 % *(8→7)* | **18 %** |
| **I — IA** | **13 %** *(12→13)* | 8 % *(5,5→8)* | 10 % *(7→10)* | 8 % |
| C — Cyber | 11 % | 10 % | **22 %** | 8 % |
| Ee — Environnemental | 10 % | 12 % | 14 % | 8 % |
| K — Culturel (opt.) | 0 % | 8 % | 5 % | 15 % |
| **Total** | **100 %** | **100 %** | **100 %** | **100 %** |

Logique des transferts v3 : la dimension IA gagne là où le compute est décisionnel
(Défaut +1, Investissement +2,5, Supply Chain +3), financé par L (portée réduite, cf. audit)
et marginalement M sur Supply Chain. Implantation inchangée (l'IA y est peu discriminante).

### 2.2 Opportunité

| Dimension | Défaut | Investissement | Supply Chain | Implantation |
|-----------|:------:|:--------------:|:------------:|:------------:|
| So — Capital humain | 12 % | 8 % | 8 % | **18 %** |
| Eo — Croissance & marché | **17 %** | **22 %** | 12 % | 10 % |
| Mo — Sécurité & alliances | 7 % | 5 % | 10 % *(12→10)* | 5 % |
| Po — Gouvernance & réformes | 14 % | 12 % | 8 % | **18 %** |
| Lo — Attractivité juridique | 13 % | 16 % *(18→16)* | 8 % | 16 % |
| **Io — Innovation & IA souveraine** | 15 % | 17 % *(15→17)* | **20 %** *(18→20)* | 12 % |
| Co — Maturité technologique | 12 % | 10 % | **22 %** | 10 % |
| Eeo — Durabilité & transition | 10 % | 10 % | 12 % | 11 % |
| **Total** | **100 %** | **100 %** | **100 %** | **100 %** |

Défaut opportunité inchangé (Io déjà 2ᵉ poids). Bonus Io sur Investissement (+2, pris sur Lo)
et Supply Chain (+2, pris sur Mo).

---

## 3. NIVEAU 1 — Formule de dimension

```
S_d  = 0,60 × Score_quanti_d + 0,40 × Score_quali_d − Bonification_résilience_d   [risque]
So_d = 0,60 × Score_quanti_d + 0,40 × Score_quali_d                               [opportunité]

Bonification_résilience_d = 0,15 × max(0, ScoreRésilience_d − 4)
  → effet max −0,45 (résilience = 7) ; plancher : S_d ≥ 1,0
```

Coefficients 60/40 : **uniformes sur les 8 dimensions**, inchangés v3.
Exigence v3 (point 3 de l'audit) : `quanti` et `quali` sont **stockés séparément** dans les
évaluations publiées, avec justification du quali — condition de reproductibilité.

### Rattachement des 6 facteurs de résilience (risque uniquement)

| Facteur | v2.1 | v3.0 | Note |
|---------|:----:|:----:|------|
| RS1 — Contre-pouvoir société civile | S | S | inchangé |
| RE1 — Capacité de correction monétaire | E | E | inchangé |
| RM1 — Doctrine républicaine de l'armée | M | M | inchangé |
| RP1 — Alternance démocratique | P | P | inchangé |
| **RI1 — Pluralisme médiatique résiduel** | I | **P** | suit le bloc presse (D3). P porte donc 2 facteurs : bonification P = moyenne(RP1, RI1) avant application de la formule |
| RL1 — Autonomie judiciaire effective | L | L | inchangé |

La dimension IA n'a pas de facteur de résilience à ce stade (données trop jeunes) — candidat
futur : « diversification des fournisseurs de compute ».

---

## 4. NIVEAU 2 — Pondération intra-dimension (NOUVEAU v3)

```
Score_quanti_d = Σ (w_i × palier_i) / Σ (w_i)      w_i ∈ {3 = critique, 2 = majeur, 1 = mineur}
```

Défaut : **majeur (w=2)** pour tout indicateur non tagué — la moyenne reste alors strictement
équivalente à la moyenne simple v2.1 (rétrocompatibilité exacte tant qu'aucun tag n'est posé).

### Tags initiaux proposés

| Dimension | Critiques (w=3) | Mineurs (w=1) |
|-----------|-----------------|---------------|
| S | S6 (tensions ethniques), S11 (sécurité alimentaire) | S8 (urbanisation) |
| E | E2 (inflation), E7 (réserves), E16 (indépendance BC) | E13 (économie informelle) |
| M | M2 (conflits actifs), M13 (fiabilité protecteur) | M4 (exercices) |
| P | P5 (risque changement régime), P13 (capture institutionnelle) | P11 (pression démographique) |
| L | L3 (sanctions), L10 (expropriation) | L7 (BIT) |
| **I (IA)** | **IA2 (semi-conducteurs), IA9 (statecraft)** | IA6 (investissement — donnée bruitée) |
| C | C3 (incidents majeurs), C5 (infra critique) | C7 (rançongiciels) |
| Ee | Ee2 (stress hydrique) | Ee6 (CO2/capita), Ee7 (biodiversité) |

Tous les autres : majeur (w=2). Cette table est une proposition de calibration — à valider par
backtest (les 12 crises + 5 cas d'endiguement) avant application aux 18 zones.

---

## 5. NIVEAU 3 — Inventaire des indicateurs par dimension

### 5.1 Récapitulatif des effectifs

| Dimension risque | v2.1 (réel) | v3.0 | Mouvement |
|------------------|:----:|:----:|-----------|
| S — Social | 12 | 12 | — |
| E — Économique | 16 | 16 | — |
| M — Militaire | 13 | 13 | — |
| P — Politique | 15 | **18** | +P16, +P17, +P18 (ex-I) ; P12 élargi (absorbe I10) |
| L — Légal | 10 | 10 | — |
| I — **IA** | 12 (Information) | **9** | IA1–IA9, tous nouveaux |
| C — Cyber & contrôle informationnel | 12 | **14** | +C13, +C14 (consolidations ex-I) + 1 modificateur non scoré |
| Ee — Environnemental | 10 | 10 | — |
| **Total risque** | **100** | **102** | |
| Résilience | 6 | 6 | RI1 rattaché à P |
| K — Culturel (optionnel) | 6 | 6 | — |
| **Total avec K** | 112 | **114** | |

| Dimension opportunité | v2.0 (réel) | v3.0 |
|-----------------------|:----:|:----:|
| So / Eo / Mo / Po / Lo / Co / Eeo | 8+10+6+8+8+8+8 = 56 | 56 (inchangés) |
| Io — Innovation & IA souveraine | 8 | **14** (+Io9 à Io14) |
| **Total opportunité** | **64** | **70** |

### 5.2 Destin des 12 indicateurs de l'ancien I (Information)

| Ancien | Indicateur | Destination v3 | Forme |
|--------|-----------|----------------|-------|
| I1 | Classement RSF | **P16** | fusion I1+I8 → « Liberté & pluralisme de la presse » |
| I8 | Pluralisme médiatique | **P16** | idem (même source RSF) |
| I5 | Contrôle médias d'État | **P17** | « Contrôle étatique des médias » (repris tel quel) |
| I9 | Journalistes emprisonnés | **P18** | « Répression des journalistes » (repris tel quel) |
| I10 | Contrôle narratif diaspora | **P12 élargi** | fusionné dans « Diaspora politique active » |
| I2 | Freedom on the Net | **C13** | fusion I2+I4+I12 → « Censure & contrôle numérique » |
| I4 | Censure internet | **C13** | idem |
| I12 | Usage VPN | **C13** | idem (signal de contournement) |
| I3 | Opérations d'influence | **C14** | fusion I3+I7+I11 → « Opérations d'influence & manipulation IA » |
| I7 | Désinformation IA / deepfakes | **C14** | idem |
| I11 | Comptes coordonnés / bots | **C14** | idem |
| I6 | Pénétration réseaux sociaux | **CM1 (C)** | **modificateur contextuel non scoré** : n'entre pas dans la moyenne de C ; module l'interprétation de C13 (censure plus efficace si pénétration faible en régime autoritaire) |

Seuils de C13/C14 : bandes 1-7 dérivées des seuils sources (I2/I4/I12 et I3/I7/I11), palier =
arrondi de la moyenne des paliers des composantes. Sous-coefficients égaux (1/3 chacune).

### 5.3 Nouvelle dimension I — Intelligence Artificielle (9 indicateurs, risque)

Sens de l'échelle : **7 = dépendance / vulnérabilité maximale**.

| # | Indicateur | Sources | 1 | 4 (médian) | 7 |
|---|-----------|---------|---|---|---|
| IA1 | **Souveraineté du compute** (% capacité data centers sous contrôle national) | Synergy Research / SemiAnalysis / Uptime Institute / Cloudscene | > 80 % | 35–50 % | < 8 % |
| IA2 | **Dépendance semi-conducteurs avancés** (accès puces < 7 nm/HBM, exposition export controls) | BIS Entity List / Georgetown CSET / CSIS / SIA / TechInsights | Production nationale de pointe | Dépendance à un fournisseur unique | Embargo total (retrait de modèles type **Fable 5**) |
| IA3 | **Capacité data centers installée** (W IA / habitant) | IEA Data Centres & Networks / Epoch AI / Uptime Institute / Baxtel | > 40 | 5–10 | < 0,5 |
| IA4 | **Souveraineté des modèles** (modèles de fondation nationaux) | Epoch AI (Notable AI Models) / Stanford HAI AI Index / Artificial Analysis / LMSYS Arena | Modèles frontière nationaux | Dépendance modèles ouverts étrangers | Accès révocable ou révoqué |
| IA5 | **Puissance IA adverse projetable** (domination compute régionale par un rival) | IISS / Georgetown CSET / RAND / OSINT | Aucune | Rival en avance sensible | Rival dominant + IA offensive documentée dirigée vers la zone |
| IA6 | **Investissement IA public + privé** (% PIB) | OECD.AI / Stanford HAI AI Index / Air Street « State of AI » / Dealroom | > 1,5 % | 0,2–0,4 % | < 0,03 % |
| IA7 | **Talent IA** (chercheurs IA / 100k hab. + solde migratoire des talents) | MacroPolo Global AI Talent Tracker / OECD.AI / LinkedIn Economic Graph / Scopus | > 30 et gain net | ~5, équilibre | < 1 ou exode massif |
| IA8 | **Contrainte énergétique du compute** (capacité électrique disponible pour data centers) | IEA / Ember / EPRI / opérateurs de réseau nationaux | Excédent + prix bas | Tension modérée | Incapacité d'alimenter (délestages) |
| IA9 | **Statecraft IA** (capacité de l'État à orienter/financer/restreindre sa puissance IA : allocation de compute, participation aux champions, levier export) | OECD.AI Policy Observatory / Carnegie Endowment / Georgetown CSET / OSINT | Contrôle effectif complet | Leviers partiels | Aucun levier (capture étrangère ou privée totale) |

**Bloc de référence — sources de données tech/IA (v3)**

| Catégorie | Sources primaires | Cadence |
|-----------|-------------------|---------|
| Compute & data centers | IEA Data Centres & Networks, Synergy Research, Uptime Institute, SemiAnalysis, Cloudscene, Baxtel | trimestrielle |
| Semi-conducteurs & export controls | BIS Entity List, Georgetown CSET, CSIS, SIA, TechInsights | événementielle + trimestrielle |
| Modèles & capacités | Epoch AI, Stanford HAI AI Index (annuel), Artificial Analysis, LMSYS, Hugging Face | mensuelle |
| Investissement & écosystème | OECD.AI, Dealroom, CB Insights, Crunchbase, Air Street « State of AI » (annuel), fDi Markets | trimestrielle |
| Talent | MacroPolo Global AI Talent Tracker, LinkedIn Economic Graph, Scopus | annuelle |
| Politique & statecraft | OECD.AI Policy Observatory, Carnegie, RAND, CSET | événementielle |
| Énergie | IEA, Ember, EPRI, opérateurs de réseau | trimestrielle |

Ces sources alimentent aussi la veille continue (`veille-continue.mjs` / Routines) : ajouter les
flux correspondants à la watchlist (thème « IA souveraine ») fait partie du plan d'implémentation.

Bandes complètes 1-7 à calibrer en implémentation (les colonnes 1/4/7 ci-dessus ancrent
l'échelle). Tags intra-dimension : IA2 et IA9 critiques (w=3), IA6 mineur (w=1), reste majeur.

**Frontières anti-double-comptage** :
- vs **M** : systèmes d'armes autonomes restent dans M ; IA5 mesure la domination compute/modèles.
- vs **C** : C11 (cloud *exposure*) = surface d'attaque ; IA3 = puissance installée. Construits distincts.
- vs **L** : IA9 = levier de puissance de l'État sur ses champions ; L = cadre réglementaire général.
- vs **E** : E14 (coût de l'énergie) reste dans E (intrant économie entière) ; IA8 mesure la
  *disponibilité pour le compute* spécifiquement.

**Règle de cohérence nouvelle (validateur)** : remplacer l'ancien check |I−C| ≤ 2 par
« si IA ≤ 2 (puissance souveraine forte) alors C ≤ 4 attendu (un État à compute souverain a
une posture cyber au moins correcte) — sinon justification obligatoire ».

### 5.4 Io — Innovation & IA souveraine (14 indicateurs, opportunité)

Io1–Io8 inchangés (GII, R&D, startups, haut débit, publications IA, VC, STEM, adoption IA). Ajouts :

| # | Indicateur | Sources | 1 | 4 (médian) | 7 |
|---|-----------|---------|---|---|---|
| Io9 | **Capacité compute exportable** (services cloud/IA vendus à l'étranger, % exports services) | Synergy Research / Omdia / OMC / ITU | Nulle | Régionale naissante | Hub mondial (type hyperscaler) |
| Io10 | **Attractivité talents & modèles** (flux entrants de chercheurs IA, adoption internationale des modèles nationaux) | MacroPolo Global AI Talent Tracker / Epoch AI / Hugging Face (téléchargements) | Exode | Équilibre | Pôle d'attraction mondial |
| Io11 | **Investissement IA entrant** (IDE fléché IA/data centers, % PIB) | UNCTAD / fDi Markets / Dealroom | Nul | 0,1–0,3 % | > 1 % |
| Io12 | **Écosystème startups IA** (nb licornes IA + valorisation cumulée, Mrd$) — *sous-ensemble IA de Io3, scoré séparément car dynamique propre* | Dealroom / CB Insights / Crunchbase AI | 0 | 1–2 licornes / 5–15 | > 15 licornes / > 300 |
| Io13 | **Excédent énergétique mobilisable pour le compute** (capacité électrique excédentaire contractualisable pour data centers, GW) — *miroir opportunité de IA8* | IEA / Ember / EPRI | Déficit structurel | Marge faible mais pilotable | Excédent massif + prix compétitifs (atout d'implantation) |
| Io14 | **Partenariats IA internationaux** (accords « sovereign AI » avec hyperscalers/États : accès privilégié compute, modèles, transferts de savoir-faire) | OECD.AI / CSET / OSINT | Aucun | 1–2 accords sectoriels | Réseau dense d'accords stratégiques + clauses de transfert |

### 5.5 Dimensions inchangées

S (S1–S12), E (E1–E16), M (M1–M13), L (L1–L10), Ee (Ee1–Ee10), K (K1–K6), et les 7 blocs
opportunité hors Io : reprendre les tables v2.1 telles quelles (grilles existantes).
P : P1–P15 inchangés + P16/P17/P18 (§5.2), P12 élargi.
C : C1–C12 inchangés + C13/C14 + modificateur CM1.

---

## 6. NIVEAU 3b — Sous-coefficients des indicateurs composites (formalisés v3)

| Indicateur | Formule | Sous-coefficients |
|------------|---------|-------------------|
| E15 — Indice de misère | inflation (%) + chômage (%) | 1 / 1 (somme simple) |
| E16 — Indépendance BC | 5 sous-critères : nomination gouverneur, mandat, historique limogeage, transparence, alignement politique monétaire/fiscal | **1/5 chacun**, palier = arrondi de la moyenne |
| P13 — Capture institutionnelle | comptage institutions contrôlées / 5 (exécutif, judiciaire, BC, armée, médias) | mapping direct comptage → palier (0-1→1 … 5/5→7, table v2.1) |
| C13 — Censure & contrôle numérique | moyenne des paliers (ex-I2, ex-I4, ex-I12) | **1/3 chacun** |
| C14 — Influence & manipulation IA | moyenne des paliers (ex-I3, ex-I7, ex-I11) | **1/3 chacun** |
| K6 — Distance culturelle Kogut-Singh | KS = ¼ × Σᵢ [(Iᵢ,zone − Iᵢ,réf)² / Vᵢ] sur K1–K4 | ¼ par dimension Hofstede, variance Vᵢ de l'échantillon |

---

## 7. Surcouches — paramètres complets

### 7.1 Amplification de pic (risque ET opportunité, désormais systématique)

| Paramètre | Valeur |
|-----------|:------:|
| Seuil de déclenchement (score_d − composite_base) | > 1,0 |
| Facteur de majoration du poids | 0,20 × (écart − 1,0) |
| Renormalisation | Σ poids = 100 % |
| Plafond d'effet sur le composite | +0,3 |

Décision D6 : les composites publiés = **sortie calculée** (base + amplification), jamais saisis.
Le calcul vit dans un module partagé (validateur + build front) — source de vérité unique.

### 7.2 Vélocité (alertes uniquement — n'affecte pas le composite)

| Vélocité (Δ score / trimestre) | Niveau | Action |
|:------------------------------:|--------|--------|
| < 0,15 | Stable | — |
| 0,15 – 0,30 | Accélération | Signal faible |
| 0,30 – 0,50 | Escalade rapide | Alerte, réévaluation recommandée |
| > 0,50 | Crise émergente | Alerte critique (règle R11), réévaluation immédiate |

### 7.3 Pont composite → modalité d'approche (rappel des entrées)

1. Composite risque (1-7) · 2. moyenne L+E (sécurité juridico-financière) · 3. K si actif.
Modulations existantes : I ≥ 5 et C ≥ 5 → à réviser : la modulation « I ≥ 5 » devient
**« IA ≥ 5 » (dépendance IA forte → rétrograder d'un cran les modalités à forte exposition
technologique)** ; L7 ≤ 2 et vélocité > 0,5/trim. inchangés.

### 7.4 Module K (inchangé)

6 indicateurs Hofstede/Hall, pas d'amplification ni vélocité, actif sur 3 angles (8/5/15 %),
référent paramétrable (défaut France).

---

## 8. Impacts d'implémentation (périmètre du plan à venir)

| Artefact | Changement |
|----------|-----------|
| `scripts/semplice-validator.mjs` | `DIMENSION_WEIGHTS` → {M:.16, E:.15, P:.14, I:.13, S:.12, C:.11, Ee:.10, L:.09} ; règles I-C (§5.3) ; SIG référençant I à re-calibrer ; support tags w_i |
| `data/semplice/grille-scoring-quantitative-v2.md` | → v3 : dimension IA, P16-P18, C13-C14+CM1, tags, totaux corrigés (D8) |
| `data/semplice/grille-scoring-opportunite-v2.md` | → v3 : Io 14 indicateurs, poids par angle, total 70 (et correction 66→64 v2) |
| `semplice-zones-config.js` | labels (`Information`→`Intelligence artificielle`, `Innovation`→`Innovation & IA souveraine`) ; **composites calculés, plus stockés** ; rescoring dimension I des 18 zones |
| `semplice-radar.js` / `semplice-country.js` | consommer les composites calculés ; libellés |
| `expertise.html` | section SEMPLICE : présentation dimension IA, tableau comparatif 8 cadres (argument « seul cadre avec axe IA ») |
| `data/semplice/semplice-i-c-interactions.md` | réécrire : interactions IA↔C (le doc actuel décrit l'ancien I) |
| `semplice-history.json` | rupture de série sur I : anno­ter le changement de construit (l'historique Information n'est pas comparable à IA) |
| Backtests | rejouer les 12 crises avec IA : Ukraine 2022 (WhisperGate + dépendance Starlink), embargo puces Chine, cas Fable 5 comme événement fondateur de IA2 |
| `scripts/veille-continue.mjs` / Routines | ajouter le thème « IA souveraine » à la watchlist (22→23 thèmes) + flux des sources du bloc de référence §5.3 |

**Rupture de série assumée** : les scores I historiques (Information) ne sont pas convertibles
en scores IA. `semplice-history.json` garde l'ancienne série sous clé `I_legacy`, la série IA
démarre à la première réévaluation v3.

---

## 9. Récapitulatif chiffré v3.0

| Catégorie | v2.1 (réel, corrigé D8) | v3.0 |
|-----------|:----:|:----:|
| Indicateurs risque | 100 | **102** |
| Indicateurs résilience | 6 | 6 |
| Module K (optionnel) | 6 | 6 |
| Indicateurs opportunité | 64 | **70** |
| **Total général** | 176 | **184** |
| Dimensions | 8 (I = Information) | 8 (**I = Intelligence Artificielle**) |
| Vecteurs de poids | 8 (4 angles × R/O) | 8, re-dérivés (§2), Σ=100 % vérifié |
| Niveaux de coefficients | 1 (dimensions) | **3** (dimensions + tags intra-dimension + sous-coefficients) |
| Mécanismes | amplification (inconsistante), vélocité, résilience, K | amplification **systématique calculée**, vélocité, résilience (RI1→P), K |
