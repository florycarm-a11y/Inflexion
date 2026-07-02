# Audit de la mécanique de calcul SEMPLICE

> Inflexion Intelligence — 18 juin 2026
> Périmètre : chaîne de calcul risque + opportunité (v2.1), du palier d'indicateur au composite pondéré.
> Statut : constats figés avant correction. Aucune modification de scoring appliquée par cet audit.

---

## 1. Objectif

Clarifier l'intégralité des calculs opérés par SEMPLICE (proportions, matrices, coefficients à chaque
niveau), vérifier leur justesse, et documenter les anomalies avant toute correction. Ce document sert
de référence pour :
- la correction des anomalies factuelles (chantier A) ;
- la refonte de la pondération dans le cadre de l'ajout d'une 9ᵉ dimension (chantier B).

---

## 2. Hiérarchie de calcul réelle (4 niveaux)

```
NIVEAU 0 — COMPOSITE      Composite = Σ (poids_d × S_d)   sur 8 dimensions
  Coefficients = POIDS DIMENSIONNELS, variables selon 4 angles décisionnels.
  Risque défaut : M16 E15 P14 S12 I12 C11 Ee10 L10   (=100 %)
  Oppor. défaut : Eo17 Io15 Po14 Lo13 Co12 So12 Eeo10 Mo7 (=100 %)

NIVEAU 1 — DIMENSION      S_d = 0,60·quanti_d + 0,40·quali_d − résilience_d
  Coefficients = 60/40 UNIFORME (identique pour les 8 dimensions).
  résilience_d = 0,15 × max(0, R_d − 4)   [risque uniquement, plancher 1,0]

NIVEAU 2 — QUANTI         quanti_d = moyenne ARITHMÉTIQUE SIMPLE des paliers
  Coefficients = AUCUN. Chaque indicateur pèse 1/n. Pas de hiérarchie interne.

NIVEAU 3 — INDICATEUR     palier 1-7 par lecture de seuils (table à 7 bandes)

NIVEAU 3b — « SOUS-SOUS » Indicateurs eux-mêmes composites : E15 (misère),
  E16 (indépendance BC, 5 sous-critères), P13 (capture, comptage /5),
  K6 (Kogut-Singh depuis K1-K4). Sous-coefficients NON formalisés.
```

Surcouches : **amplification de pic** (poids majoré si score_d − composite > 1,0 ; facteur 0,20 ;
plafond +0,3) ; **vélocité** (alertes uniquement, n'affecte pas le composite) ; **module K** (optionnel,
repondère 3 angles).

**Constat structurel** : il n'existe de coefficient qu'au niveau 0. Aux niveaux 1 et 2, tout est uniforme.
Conséquences : (a) un indicateur critique pèse autant qu'un indicateur mineur ; (b) une dimension riche en
indicateurs (E = 16) dilue chaque signal davantage qu'une dimension pauvre (L = 10).

---

## 3. Ce qui est correct

- **Moyenne pondérée de base** : correcte. Poids somment à 1,0 (risque = 100 %, opp = 100 %, vérifié).
- **Algorithme d'amplification** (`scripts/semplice-validator.mjs:233-308`) : logique interne saine
  (boost du poids du pic → renormalisation → plafond +0,3). Borné.
- **Bonification résilience** : cohérente (−0,45 max, plancher 1,0).

---

## 4. Anomalies confirmées

### A. Contradiction de documentation — deux schémas de poids « par défaut »

`data/semplice/grille-scoring-quantitative-v2.md` contient à la fois :
- les poids différenciés (M16, E15, P14, S12, I12, C11, Ee10, L10), section « Pondération dimensionnelle » ;
- une table « Pondérations par angle décisionnel » dont la colonne **Défaut = 12,5 % uniforme**.

Le code (`scripts/semplice-validator.mjs:46-55`) applique les **poids différenciés**. La colonne 12,5 %
est un vestige mort et trompeur. → À supprimer/corriger.

### B. Composites publiés non reproductibles

Les composites sont stockés en dur dans `semplice-zones-config.js` ; le front-end (`semplice-radar.js`,
`semplice-country.js`) ne les recalcule jamais. Recalcul des 18 zones depuis leurs propres scores
dimensionnels : **4/18 (risque)** et **6/18 (opportunité)** dérivent au-delà de la tolérance d'arrondi (±0,05).

Cas nets (non explicables par l'arrondi ni par un mécanisme documenté) :

| Zone | Publié | Base recalc. | Amplifié | Écart | Verdict |
|---|:--:|:--:|:--:|:--:|---|
| Mer de Chine (opp) | 5,4 | 4,99 | ~5,29 max | +0,41 | surévalué (dépasse le plafond d'amplification) |
| Cuba (risque) | 5,0 | 4,80 | 4,87 | +0,20 | surévalué |
| Ukraine (opp) | 3,2 | 3,40 | — | −0,20 | sous-évalué |
| Ormuz (risque) | 6,2 | 6,07 | 6,07 | +0,13 | surévalué (aucune amplification possible) |
| Sahel (opp) | 2,6 | 2,47 | — | +0,13 | surévalué |
| Éthiopie (opp) | 2,8 | 2,69 | — | +0,11 | surévalué |

Les autres écarts (±0,02 à 0,06) relèvent de l'arrondi des scores dimensionnels à 1 décimale et ne sont
pas des erreurs.

### C. Amplification appliquée de façon incohérente

En comparant les composites publiés aux valeurs *base* vs *amplifiée* :
- Île Maurice suit la valeur amplifiée (2,49 → 2,5) — amplification appliquée ;
- Arctique (base 3,12 / ampli 3,21 → publié 3,1), Vietnam (ampli 4,0 → publié 3,8), Turquie suivent la base
  — amplification ignorée.

Un mécanisme méthodologique majeur est donc appliqué à certaines zones et pas à d'autres. Cause probable :
saisie manuelle à des dates différentes.

### D. Absence de source de vérité unique à l'exécution

Le validateur calcule proprement ; le site affiche des nombres saisis à la main. Cette double piste garantit
la dérive constatée en B et C.

---

## 5. Faiblesses structurelles (axes d'amélioration)

Par impact décroissant :

1. **Recalculer les composites, ne plus les stocker.** Dériver `composite`/`oppComposite` depuis `scores`
   + poids (build-step ou runtime). Élimine mécaniquement les anomalies B et C. Faible risque.
2. **Pondération intra-dimension.** Introduire des coefficients au niveau 2 (ex. tags critique/majeur/mineur
   → 3/2/1), ou normaliser le nombre d'indicateurs par dimension.
3. **Tracer le quali (40 %).** Aujourd'hui 40 % de chaque score est un jugement expert non décomposé et
   absent de la donnée publiée — cause racine de la non-reproductibilité. Stocker `quanti` et `quali`
   séparément.
4. **Trancher sur l'amplification** : l'appliquer systématiquement, ou la retirer de la doc. L'état actuel
   (documentée, à moitié appliquée) est le pire.
5. **Formaliser les indicateurs composites** (E15, E16, P13, K6) avec des sous-coefficients explicites.

---

## 6. Implication pour la 9ᵉ dimension (IA)

Ajouter un axe IA impose de re-dériver 8 vecteurs de poids (4 angles × risque/opportunité), chacun devant
re-sommer à 100 %. Si les composites restent saisis à la main, le nombre d'occasions de dérive est multiplié.
**Recommandation : traiter les points 1 et 2 avant d'introduire la 9ᵉ dimension.**

---

## Suivi des corrections (chantier A — 18 juin 2026)

Corrections factuelles appliquées après le gel des constats. Convention retenue : **moyenne pondérée
de base** (amplification non appliquée — décision renvoyée au chantier B).

**`semplice-zones-config.js`** — composites réalignés sur la formule de base (recalcul vérifié, 0 anomalie
résiduelle) :
- Risque : ormuz 6,2→6,1 · ukraine 5,6→5,7 · cuba 5,0→4,8 · chine 4,8→4,6 · île-maurice 2,5→2,4
- Opportunité : sahel 2,6→2,5 · ukraine 3,2→3,4 · chine 5,4→5,0 · brésil 4,2→4,3 · singapour 5,5→5,4 · éthiopie 2,8→2,7
- Libellés d'opportunité invalides corrigés (utilisaient les descripteurs de l'échelle risque « Très élevé »
  ou la mauvaise bande) : chine, brésil, tamil, rép. tchèque → « Significatif » ; arctique, singapour → « Élevé ».
  *(Anomalie systématique non détectée au premier passage, centré sur les nombres.)*

**`data/semplice/grille-scoring-quantitative-v2.md`** — colonne « Défaut » de la table par angle : 12,5 %
uniforme → poids différenciés réels (M16 E15 P14 S12 I12 C11 Ee10 L10) + note désignant le validateur
comme source de vérité.

**Restant (chantier B)** : points 1 (calcul à l'exécution plutôt que valeurs stockées), 2 (pondération
intra-dimension), 3 (traçage du quali), 4 (décision amplification), 5 (indicateurs composites).

---

## 7. Annexe — méthode de vérification

Recalcul indépendant des 18 zones via un script Node reproduisant la formule du validateur
(base pondérée + amplification + plafond +0,3), avec les poids `M16 E15 P14 S12 I12 C11 Ee10 L10` (risque)
et `Eo17 Io15 Po14 Lo13 Co12 So12 Eeo10 Mo7` (opportunité), ordre des tableaux `scores`/`opp` =
`[S,E,M,P,L,I,C,Ee]` / `[So,Eo,Mo,Po,Lo,Io,Co,Eeo]`. Résultat : 4/18 anomalies risque, 6/18 anomalies
opportunité (seuil ±0,05).
