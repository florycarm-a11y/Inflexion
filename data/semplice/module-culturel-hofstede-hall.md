# SEMPLICE — Module K (Culturel) : Hofstede + Hall

> **Module greffé optionnel** — angle décisionnel « Implantation » prioritairement
> Inflexion Intelligence — Avril 2026
> 6 indicateurs | Échelle 1-7 alignée SEMPLICE | Pondération inter-dimensionnelle dédiée

---

## Raison d'être

Les 8 dimensions S/E/M/P/L/I/C/Ee de SEMPLICE n'instrumentent pas la **culture business** d'une zone. Or, pour une décision d'implantation, la distance culturelle vis-à-vis de l'investisseur conditionne :
- la viabilité d'un management direct vs un partenaire local,
- la modalité d'approche (filiale vs JV vs agent),
- l'effort d'adaptation du marketing-mix,
- le délai et le coût d'acculturation des équipes expatriées.

Le module K apporte ces mesures sans modifier la structure des 8 dimensions historiques. Il est **désactivé par défaut** et activé uniquement sur les angles décisionnels qui en bénéficient (cf. pondérations).

**Référent culturel par défaut** : **France**. Tous les écarts sont calculés vs scores France. Si l'investisseur est non-français, recalibrer les seuils (paramétrable).

---

## Architecture du score

```
Score_quanti_K = moyenne arithmétique simple (K1..K6)
Score_quali_K  = note expert 1-7 (jugement qualitatif structuré)
S_K            = 0.60 × Score_quanti_K + 0.40 × Score_quali_K
```

Pas de bonification de résilience pour K (le concept ne s'applique pas à la culture, qui est structurelle et non corrigeable à court terme).

### Échelle 1-7 (alignée SEMPLICE)

| Score | Descripteur | Friction culturelle |
|-------|-------------|---------------------|
| **1** | Quasi-identique | Distance culturelle minimale, transfert direct possible |
| **2** | Très proche | Adaptations marginales |
| **3** | Proche | Adaptations légères |
| **4** | Modérée | Adaptations significatives requises |
| **5** | Éloignée | Partenaire local recommandé |
| **6** | Très éloignée | Partenaire local indispensable |
| **7** | Antithétique | Risque d'incompréhension structurelle, transfert quasi impossible sans intermédiaire culturel |

---

## Indicateurs (référentiel France)

### K1 — Power Distance (PDI Hofstede 0-100)

**Source** : Hofstede Insights — country comparison tool ([hofstede-insights.com](https://www.hofstede-insights.com/country-comparison-tool/))
**Référence France** : PDI = 68
**Logique** : distance vis-à-vis de la hiérarchie. Écart fort = chocs sur les structures de management (pyramide vs pancake), prise de décision, feedback.

| Δ vs France (\|PDI − 68\|) | Score |
|:-:|:-:|
| < 5 | 1 |
| 5–10 | 2 |
| 10–18 | 3 |
| 18–28 | 4 |
| 28–38 | 5 |
| 38–50 | 6 |
| > 50 | 7 |

### K2 — Uncertainty Avoidance (UAI Hofstede 0-100)

**Source** : Hofstede Insights
**Référence France** : UAI = 86 (très élevé — France parmi les cultures les plus averses à l'incertitude)
**Logique** : tolérance à l'ambiguïté. Écart fort = friction sur les processus, contrats, planification, prise de risque.

| Δ vs France (\|UAI − 86\|) | Score |
|:-:|:-:|
| < 5 | 1 |
| 5–10 | 2 |
| 10–18 | 3 |
| 18–28 | 4 |
| 28–38 | 5 |
| 38–50 | 6 |
| > 50 | 7 |

### K3 — Individualism (IDV Hofstede 0-100)

**Source** : Hofstede Insights
**Référence France** : IDV = 71 (élevé)
**Logique** : individualisme vs collectivisme. Écart fort = chocs sur incentives, gestion de carrière, négociation (face vs contrat), reporting.

| Δ vs France (\|IDV − 71\|) | Score |
|:-:|:-:|
| < 5 | 1 |
| 5–10 | 2 |
| 10–18 | 3 |
| 18–28 | 4 |
| 28–38 | 5 |
| 38–50 | 6 |
| > 50 | 7 |

### K4 — Long-Term Orientation (LTO Hofstede 0-100)

**Source** : Hofstede Insights
**Référence France** : LTO = 63 (modérément long terme)
**Logique** : horizon temporel. Écart fort = chocs sur ROI attendu, persévérance des relations commerciales, vision stratégique.

| Δ vs France (\|LTO − 63\|) | Score |
|:-:|:-:|
| < 5 | 1 |
| 5–10 | 2 |
| 10–18 | 3 |
| 18–28 | 4 |
| 28–38 | 5 |
| 38–50 | 6 |
| > 50 | 7 |

> **Note** : la dimension MAS (Masculinité, France=43) est volontairement écartée du score K. La littérature post-2010 (Minkov, GLOBE) la juge la plus contestée du modèle Hofstede et la moins prédictive en contexte business international. Conserver pour analyse qualitative uniquement.

### K5 — Contexte communicationnel (Hall)

**Source** : littérature Hall (« Beyond Culture », 1976) + grille experte calibrée par pays. Pas de score numérique standard — utiliser les classifications de référence.
**Référence France** : mixte tendant high-context (5 sur l'axe low→high)
**Logique** : explicite (low) vs implicite (high). Écart fort = malentendus contractuels, négociations qui s'enlisent, signaux non lus.

| Profil de la zone | Score (friction vs France) |
|-------------------|:-:|
| High-context proche FR (Italie, Espagne, Brésil) | 1 |
| Mixte tendant high (Mexique, Portugal) | 2 |
| Low-context modéré (UK, Canada, Pologne) | 3 |
| Low-context fort (Allemagne, Suisse, Pays-Bas, Scandinavie) | 4 |
| Low-context extrême (USA, Australie) | 5 |
| High-context fort (Chine, Corée, Inde) | 6 |
| High-context extrême (Japon, pays arabes du Golfe) | 7 |

> **Asymétrie volontaire** : la friction est plus forte vers les cultures high-context extrêmes (Japon, Golfe) que vers les low-context extrêmes (USA), car la France conserve une culture relationnelle et une part d'implicite.

### K6 — Distance culturelle composite (Kogut-Singh vs France)

**Source** : calculé à partir de K1–K4 (PDI, UAI, IDV, LTO).
**Méthode** : indice de Kogut-Singh (1988), formule normalisée :

```
KS = √( Σ_d ( (S_d_pays − S_d_France)² / V_d ) / 4 )

   où d ∈ {PDI, UAI, IDV, LTO}
       V_d = variance de la dimension d sur l'échantillon Hofstede mondial
       (V_PDI ≈ 540, V_UAI ≈ 540, V_IDV ≈ 596, V_LTO ≈ 600)
```

**Seuils calibrés sur ~70 pays témoins** (Hofstede Insights database) :

| KS index | Score | Interprétation |
|:--------:|:-----:|----------------|
| < 0.30 | 1 | Quasi-identique (Belgique, Italie) |
| 0.30–0.60 | 2 | Très proche (Espagne, Portugal) |
| 0.60–1.00 | 3 | Proche (Allemagne, UK) |
| 1.00–1.50 | 4 | Modérée (Brésil, Mexique, Pologne) |
| 1.50–2.20 | 5 | Éloignée (USA, Inde, Russie) |
| 2.20–3.00 | 6 | Très éloignée (Chine, Émirats, Indonésie) |
| > 3.00 | 7 | Antithétique (Arabie saoudite, Vénézuéla, Pakistan) |

**Justification de l'inclusion** : K6 capture la **distance multidimensionnelle agrégée**, alors que K1-K4 mesurent les écarts dimension par dimension. Les deux sont complémentaires : un pays peut être proche sur 3 dimensions et antithétique sur 1 (cas Suède = IDV proche FR mais MAS très éloignée). K6 lisse cette asymétrie.

---

## Pondération inter-dimensionnelle (révision)

Le module K modifie la table de pondération par angle décisionnel. K n'a **aucun poids dans l'angle « Défaut »** (rétrocompatibilité totale).

| Dimension | Défaut | Investissement | Supply Chain | Implantation |
|-----------|:------:|:--------------:|:------------:|:------------:|
| S | 12.5% | 4.5% | 8% | 10% |
| E | 12.5% | 22% | 10% | 10% |
| M | 12.5% | 8% | 18% | 8% |
| P | 12.5% | 15% | 8% | 15% |
| L | 12.5% | 15% | 8% | 18% |
| I | 12.5% | 5.5% | 7% | 8% |
| C | 12.5% | 10% | 22% | 8% |
| Ee | 12.5% | 12% | 14% | 8% |
| **K** | **0%** | **8%** | **5%** | **15%** |
| **Total** | 100% | 100% | 100% | 100% |

**Réajustements vs grille v2.0 :**
- *Investissement* : S 8%→4.5% (-3.5) + I 10%→5.5% (-4.5) ; K=8% → solde nul.
- *Supply Chain* : I 12%→7% (-5) ; K=5% → solde nul.
- *Implantation* : S 18%→10% (-8) + I 15%→8% (-7) ; K=15% → solde nul.

**Logique des transferts** : K subsume une part du poids S (la culture business est une sous-composante du social) et une part du poids I (la communication interculturelle est partiellement informationnelle). C est préservé car la cyber n'est pas culturellement absorbée.

**Justification des poids K :**
- *Implantation 15%* : la culture business est un déterminant de premier ordre (gestion d'équipe locale, négociation, structures de management).
- *Investissement 8%* : poids modéré (gouvernance, conseil d'administration, relations actionnariales).
- *Supply Chain 5%* : poids faible (logistique > relations humaines) mais non nul (négociation fournisseur, contrats).
- *Défaut 0%* : préserve la rétrocompatibilité avec toutes les évaluations historiques.

---

## Règles d'intégration

### RK1 — Activation conditionnelle

Le module K **n'est calculé que si l'angle décisionnel l'exige** (Investissement, Supply Chain, Implantation). En mode « Défaut », le module est ignoré et le composite reste calculé sur les 8 dimensions historiques avec la pondération v2.0 inchangée.

### RK2 — Données manquantes

Si Hofstede Insights ne couvre pas un pays (cas de certaines zones, ex. Sahel agrégé, micro-États) :
- Utiliser le score Hofstede du pays voisin culturellement le plus proche, **avec note explicative dans le champ `flags`**.
- Si aucune approximation crédible n'est possible, **ne pas activer K** et documenter dans le rapport.

### RK3 — Référent investisseur paramétrable

La grille est calibrée vs France par défaut. Pour un investisseur non-français :
- Recalculer les écarts vs scores Hofstede du pays référent.
- Conserver l'échelle 1-7 et les seuils relatifs (\|Δ\| < 5 = 1, etc.).
- Documenter le référent utilisé dans l'évaluation (`evaluation.modulo_K.referent = "DE"` p.ex.).

### RK4 — Pas d'amplification de crête sur K

Contrairement aux 8 dimensions historiques, K ne participe pas au mécanisme d'amplification de crête (cf. grille v2.0). La culture est une variable structurelle, pas une crise émergente — son impact ne doit pas être amplifié dynamiquement.

### RK5 — Pas de vélocité sur K

Pour la même raison, K n'a pas de mécanisme de vélocité. Les dimensions Hofstede évoluent à l'échelle générationnelle (≥ 25 ans), pas trimestrielle.

---

## Cas d'usage type

### Exemple : Inde (référent France)

**Scores Hofstede Inde** (Hofstede Insights) : PDI=77, UAI=40, IDV=48, LTO=51

| Indicateur | Valeur Inde | Δ vs FR | Score K |
|-----------|:-----------:|:-------:|:-------:|
| K1 PDI | 77 | 9 | 2 |
| K2 UAI | 40 | 46 | 6 |
| K3 IDV | 48 | 23 | 4 |
| K4 LTO | 51 | 12 | 3 |
| K5 Hall (high-context fort) | — | — | 6 |
| K6 KS index Inde-FR | ~1.85 | — | 5 |

```
Score_quanti_K = (2 + 6 + 4 + 3 + 6 + 5) / 6 = 4.33
Score_quali_K  = 4.5 (jugement expert : Inde culturellement éloignée FR mais expérience longue)
S_K            = 0.60 × 4.33 + 0.40 × 4.5 = 4.40
```

**Lecture** : friction culturelle modérée-éloignée. Compatible avec une présence directe (filiale, succursale) **uniquement si management indo-compatible** (équipe biculturelle, time zone partagée). Sinon, JV ou agent local recommandé. Cf. [pont-semplice-modalite-approche.md](pont-semplice-modalite-approche.md).

### Exemple : Singapour (référent France)

**Scores Hofstede Singapour** : PDI=74, UAI=8, IDV=20, LTO=72

| Indicateur | Valeur Singapour | Δ vs FR | Score K |
|-----------|:----------------:|:-------:|:-------:|
| K1 PDI | 74 | 6 | 2 |
| K2 UAI | 8 | 78 | 7 |
| K3 IDV | 20 | 51 | 7 |
| K4 LTO | 72 | 9 | 2 |
| K5 Hall (high-context fort) | — | — | 6 |
| K6 KS index Singapour-FR | ~2.45 | — | 6 |

```
Score_quanti_K ≈ 5.00
```

**Lecture** : friction culturelle élevée malgré l'efficacité business de Singapour. Justifie le recours à des managers locaux ou bilingues même en présence directe. Note : le composite SEMPLICE (2.2, très bas) reste cohérent avec une implantation directe — K signale juste une attention RH.

---

## Limites assumées

1. **Hofstede vieillit** : données issues d'enquêtes IBM (1967-1973), réactualisées ponctuellement. Critique récurrente du modèle. Mitigation : croiser avec GLOBE study si disponible.
2. **Cultures non monolithiques** : un pays = plusieurs cultures (Chine Han vs minorités, Inde Nord vs Sud). Mitigation : règle R12 du scope guidelines (héritage par défaut, override sur cas avéré).
3. **Évolution lente non capturée** : les Millennials chinois ne sont plus les baby-boomers d'IBM 1970. Mitigation : ajustement qualitatif via Score_quali_K.
4. **Référent unique** : la grille est asymétrique (calibrée FR). Toute analyse pour investisseur non-FR doit recalibrer.

---

## Historique

| Version | Date | Modification |
|---------|------|-------------|
| v1.0 | 2026-04-30 | Création — 6 indicateurs, intégration angles Investissement/Supply Chain/Implantation |
