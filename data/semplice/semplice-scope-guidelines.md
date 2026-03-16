# SEMPLICE — Regles de scope : sub-national vs national

> **Objectif** : definir quand et comment scorer une entite sub-nationale separement
> d'un pays, et les regles de coherence entre niveaux.
> Inflexion Intelligence — Mars 2026

---

## Principe general

SEMPLICE evalue des **zones geopolitiques**, pas strictement des Etats-nations. Une zone peut etre :
- Un Etat souverain (France, Bresil, Singapour)
- Une entite sub-nationale (Tamil Nadu, Groenland, Xinjiang)
- Une zone transfrontaliere (Sahel = Mali + Niger + Burkina Faso)
- Un espace strategique (Detroit d'Ormuz, Mer de Chine meridionale, Arctique)

Le choix du scope depend de **l'interet analytique**, pas de la souverainete juridique.

---

## Criteres de decouplage sub-national

Une entite sub-nationale merite une evaluation separee si **au moins 3 des 5 criteres** suivants sont remplis :

| # | Critere | Seuil | Exemple |
|---|---------|-------|---------|
| 1 | **Divergence economique** | PIB/hab ou croissance diverge > 50% du national | Tamil Nadu vs Inde (PIB/hab 2x la moyenne nationale) |
| 2 | **Autonomie politique** | Gouvernement regional autonome, politiques propres | Catalogne, Quebec, Hong Kong |
| 3 | **Profil de risque distinct** | >= 2 dimensions avec ecart > 1.5 vs national | Tamil Nadu : S et Ee nettement differents de l'Inde |
| 4 | **Interet strategique propre** | La zone a une importance geopolitique distincte du pays | Groenland (ressources arctiques), Crimee, Taiwan |
| 5 | **Donnees disponibles** | Indicateurs sub-nationaux fiables et a jour | Etats indiens (RBI, NITI Aayog), regions chinoises (NBS) |

### Cas actuels

| Zone | National | Criteres remplis | Justification |
|------|----------|-----------------|---------------|
| Tamil Nadu | Inde | 1, 3, 4 | Economie divergente (hub tech), profil risque distinct, corridor strategique France-Inde |
| Groenland | Danemark | 2, 4, 5 | Autonomie (Naalakkersuisut), interet arctique strategique, donnees separees |
| Sahel | Multi-pays | 3, 4, 5 | Zone transfrontaliere a profil de risque homogene, interet strategique propre |

---

## Regles de coherence inter-niveaux

### R1 — Heritage des dimensions structurelles
Les dimensions **L** (Legal) et **P** (Politique) du sub-national ne peuvent pas etre meilleures de > 2.0 points par rapport au national, sauf si l'entite a une autonomie juridique/politique formelle.

> Exemple : Tamil Nadu L=3.8, Inde L=3.8. Coherent car meme cadre juridique federal.

### R2 — Divergence autorisee sur S, E, Ee
Les dimensions **S** (Social), **E** (Economique), **Ee** (Environnemental) peuvent diverger fortement du national — ce sont souvent les raisons du decouplage.

> Exemple : Tamil Nadu E=2.1 (forte croissance tech), Inde E=2.9. Divergence justifiee.

### R3 — M, I, C : heritage partiel
Les dimensions **M** (Militaire), **I** (Information), **C** (Cyber) sont partiellement heritees du national :
- **M** : le sub-national herite du contexte militaire national sauf conflit localise
- **I** : peut diverger si ecosysteme mediatique regional distinct
- **C** : generalement herite du national (infrastructure partagee)

> Exemple : Tamil Nadu C=3.2, Inde C=3.2. Meme infrastructure cyber nationale.

### R4 — Score composite sub-national vs national
Le composite sub-national doit etre **justifie independamment**, pas derive du national. Mais si l'ecart composite depasse 1.5, une note explicative est requise.

> Exemple : Tamil Nadu composite 3.2, Inde composite 3.9. Ecart 0.7, acceptable sans justification supplementaire.

---

## Regles pour les zones transfrontalières

### R5 — Homogeneite requise
Une zone transfrontaliere (type Sahel) ne peut etre scoree comme un bloc que si les pays composants ont des profils suffisamment homogenes (ecart composite < 1.0 entre eux).

> Exemple : Sahel (Mali 5.9, Niger 5.7, Burkina 5.8) — ecart max 0.2, homogene.

### R6 — Ponderation par population/PIB
Si les composants divergent (ecart 0.5-1.0), le score de la zone doit ponderer par population ou PIB selon la dimension :
- S, P, L : ponderer par population
- E : ponderer par PIB
- M, I, C, Ee : score du composant le plus a risque (max)

---

## Regles pour les espaces strategiques

### R7 — Pas de score S ni Ee direct
Les espaces maritimes/arctiques (Ormuz, Mer de Chine, Arctique) n'ont pas de population residente significative. Les dimensions **S** et **Ee** doivent refleter l'impact sur les populations riveraines, pas la zone elle-meme.

### R8 — Primaute du M et E
Pour les espaces strategiques, les dimensions **M** (projection militaire) et **E** (routes commerciales, ressources) portent l'essentiel du scoring. Documenter explicitement ce biais.

---

## Processus d'ajout d'une nouvelle zone sub-nationale

1. Verifier les 5 criteres de decouplage (minimum 3 remplis)
2. Produire l'evaluation complete (8 dimensions risque + 8 dimensions opportunite)
3. Verifier la coherence avec l'evaluation nationale (R1-R4)
4. Documenter la justification du decouplage dans le champ `flags` de l'evaluation JSON
5. Ajouter dans `semplice-zones-config.js` avec `region` identique au national
6. Ne pas ajouter de GeoJSON si la zone est sub-nationale et deja incluse dans le polygone national (eviter les superpositions)
