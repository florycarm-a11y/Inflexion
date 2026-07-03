# SEMPLICE — Pont composite → modalité d'approche export/implantation

> **Cadre opérationnel** : transformer un score SEMPLICE en recommandation actionnable
> Inflexion Intelligence — Avril 2026

---

## Raison d'être

SEMPLICE produit un score (composite + scores dimensionnels), mais s'arrête au diagnostic. Le **pont** ajoute la couche de recommandation : quelle **modalité d'approche** est compatible avec le profil de risque, et quel **mode de paiement** sécuriser les transactions ?

Trois axes décisionnels combinés :
1. **Composite SEMPLICE** (1-7) : niveau de risque global
2. **L (Légal) + E (Économique)** : sécurité juridico-financière → seuil de contrôle direct possible
3. **K (Culturel)** : si module activé → arbitrage présence directe vs partenaire local

Le pont est **descriptif**, pas prescriptif : il fournit un point de départ basé sur 12 cas types validés. Tout cas réel doit être contextualisé par le secteur, la taille de l'entreprise et son expérience internationale antérieure.

---

## Rappel — Les 3 typologies d'approche internationale

| Typologie | Principe | Exemples de modalités |
|-----------|----------|----------------------|
| **Contrôlée** | Maîtrise complète de la commercialisation | Vente directe, Représentant salarié, Bureau de représentation, Succursale, **Filiale**, Agent commercial |
| **Concertée** | Coopération avec un partenaire local | Franchise, **Joint-Venture**, Portage commercial, Groupement d'exportateurs |
| **Sous-traitée** | Délégation à un intermédiaire | Importateur/Distributeur, Centrale d'achat, SCI (Société de Commerce International) |

Axe engagement-contrôle : `SCI < Importateur/Distributeur < Concessionnaire < Agent < Bureau rep / Succursale < Filiale`.

---

## Matrice de recommandation

### Logique de lecture

- **Composite SEMPLICE** filtre le niveau global de risque pays.
- **L+E moyenne** = (S_L + S_E) / 2. Si la sécurité juridique ET la stabilité économique sont solides, la modalité contrôlée devient envisageable même quand le composite n'est pas excellent.
- **K** (si module actif) module la décision : à composite égal, une friction culturelle élevée pousse vers le partenaire local.

### Matrice (référent investisseur : France/EU)

| Composite | L+E moyenne | K (si actif) | Modalité recommandée | Exemples calibrants |
|:---------:|:-----------:|:------------:|----------------------|---------------------|
| ≤ 2.5 | ≤ 2.5 | ≤ 3 | **Contrôlée — Filiale ou vente directe** | Singapour (composite 2.2, L=2.0, E=2.4, K=5.0) ⇒ filiale OK mais voir K7 |
| ≤ 2.5 | ≤ 2.5 | 4–5 | **Contrôlée — Agent commercial / Bureau de représentation** | Allemagne, Pays-Bas, Suisse |
| ≤ 2.5 | ≤ 2.5 | 6–7 | **Contrôlée — Agent local + Succursale légère** | Japon, Corée du Sud |
| 2.5 – 4 | ≤ 3.5 | ≤ 4 | **Contrôlée — Succursale ou agent salarié** | Brésil, Mexique, Inde Sud, Pologne |
| 2.5 – 4 | ≤ 3.5 | 5–7 | **Concertée — JV ou Franchise** | Chine côtière, Émirats arabes unis |
| 2.5 – 4 | > 3.5 | toutes | **Concertée — JV avec partenaire institutionnel** | Vietnam, Maroc, Turquie |
| 4 – 5.5 | 3.5 – 5 | toutes | **Concertée — JV majoritaire-locale + Portage** | Indonésie, Nigeria, Égypte |
| 4 – 5.5 | > 5 | toutes | **Sous-traitée — Importateur ou centrale d'achat** | Algérie, Pakistan, Iran |
| > 5.5 | toutes | toutes | **Sous-traitée stricte ou abstention** | Sahel, Venezuela, Yémen, Syrie |

### Règles de modulation complémentaires

**K7 — Décote pour I (Information) élevé**
Si I ≥ 5 (presse muselée, opérations d'influence, censure), pousser d'un cran vers la concertée même si le composite est bon. Exemple : Singapour composite 2.2 mais I=3.2 → conserver Contrôlée mais avec présence locale forte (compliance, communication interne).

**K8 — Décote pour C (Cyber) élevé**
Si C ≥ 5 et l'activité est sensible aux données (tech, finance, défense), pousser vers la concertée avec partenaire local de confiance pour l'hébergement/le routage.

**K9 — Bonus pour traités d'investissement bilatéraux**
Si L7 (BIT actifs) ≤ 2 (≥ 50 traités actifs), maintenir une modalité plus contrôlée que ne le suggère le composite, car le recours à l'arbitrage international (CIRDI) sécurise les actifs directs.

**K10 — Velocity-aware**
Si la vélocité d'au moins une dimension critique est > 0.5/trimestre (cf. R11), **rétrograder d'un cran** la modalité (moins d'engagement, plus de réversibilité). Exemple : si Turquie en escalade E rapide, ne pas créer de filiale neuve, basculer vers JV ou agent.

---

## Mode de paiement par défaut associé

Échelle de sécurisation des paiements internationaux, du moins risqué au plus risqué pour le vendeur.

| Modalité d'approche | Mode de paiement par défaut | Mode dégradé acceptable |
|---------------------|----------------------------|-------------------------|
| Contrôlée — Filiale | Virement / open account (transactions intra-groupe) | Compte courant filiale |
| Contrôlée — Succursale, Bureau, Agent salarié | Virement avec couverture change | Crédoc notifié |
| Contrôlée — Agent commercial | Crédoc notifié ou Stand-by LC notifiée | Remise documentaire |
| Concertée — JV / Franchise / Portage | **Crédoc confirmé** ou Stand-by LC confirmée | — |
| Sous-traitée — Importateur / Centrale d'achat | **Crédoc confirmé** + assurance crédit (Coface) | 50% à la commande + 50% crédoc confirmé |
| Sous-traitée stricte / zone à risque > 5.5 | **100 % paiement d'avance à la commande** | Crédoc confirmé + RC vendeur étendue |

**Principes opérationnels :**
- Crédoc CONFIRMÉ ≠ Crédoc NOTIFIÉ. Confirmé = la banque du vendeur s'engage à payer (sécurité maximale). Notifié = la banque transmet sans engagement.
- DDP (Delivered Duty Paid) = risque MAXIMAL pour le vendeur. À éviter sur zones composite > 4.
- 100 % paiement d'avance = sécurité maximale mais friction commerciale élevée. Réservé aux zones critiques ou aux primo-relations.

---

## Algorithme de décision (pseudocode)

```python
def recommander_modalite(eval_semplice):
    composite = eval_semplice.composite
    L = eval_semplice.dimensions["L"].score_final
    E = eval_semplice.dimensions["E"].score_final
    LE_moy = (L + E) / 2
    K = eval_semplice.modulo_K.score_final if eval_semplice.modulo_K.actif else None
    I = eval_semplice.dimensions["I"].score_final
    C = eval_semplice.dimensions["C"].score_final
    velocite_critique = any(d.velocite > 0.5 for d in eval_semplice.dimensions.values())

    # Couche 1 : modalité de base (matrice)
    if composite <= 2.5 and LE_moy <= 2.5:
        if K is None or K <= 3:
            modalite = "Controlee — Filiale ou vente directe"
        elif K <= 5:
            modalite = "Controlee — Agent commercial / Bureau de representation"
        else:
            modalite = "Controlee — Agent local + Succursale legere"
    elif 2.5 < composite <= 4 and LE_moy <= 3.5:
        if K is None or K <= 4:
            modalite = "Controlee — Succursale ou agent salarie"
        else:
            modalite = "Concertee — JV ou Franchise"
    elif 2.5 < composite <= 4 and LE_moy > 3.5:
        modalite = "Concertee — JV avec partenaire institutionnel"
    elif 4 < composite <= 5.5 and LE_moy <= 5:
        modalite = "Concertee — JV majoritaire-locale + Portage"
    elif 4 < composite <= 5.5 and LE_moy > 5:
        modalite = "Sous-traitee — Importateur ou centrale d'achat"
    else:  # composite > 5.5
        modalite = "Sous-traitee stricte ou abstention"

    # Couche 2 : modulations
    flags = []
    if I >= 5:
        flags.append("I-eleve : renforcer compliance et communication locale")
    if C >= 5:
        flags.append("C-eleve : heberger donnees sensibles localement, partenaire cyber de confiance")
    if eval_semplice.dimensions["L"].indicateurs["L7"].palier <= 2:
        flags.append("BIT-protection : modalite plus engagee envisageable, arbitrage CIRDI accessible")
    if velocite_critique:
        flags.append("velocite-critique : retrograder d'un cran, privilegier reversibilite")
        modalite = retrograder(modalite)  # filiale -> succursale -> agent -> JV -> importateur

    # Couche 3 : paiement
    paiement = mapper_paiement(modalite)

    return {
        "modalite_approche": modalite,
        "mode_paiement_defaut": paiement,
        "flags": flags,
    }
```

---

## Cas types validés

### Cas 1 — Singapour (composite 2.2)
- **Inputs** : composite=2.2, L=2.0, E=2.4 (LE_moy=2.2), K=5.0, I=3.2, C=2.0
- **Application matrice** : composite ≤ 2.5, LE_moy ≤ 2.5, K=5 → **Contrôlée — Agent commercial / Bureau de représentation**
- **Modulations** : I=3.2 < 5 (pas de flag I), C=2.0 (pas de flag C), pas de vélocité
- **Recommandation finale** : Contrôlée — Agent + Bureau de représentation. Filiale viable dans un second temps si l'expérience locale est consolidée. Mode paiement : crédoc notifié ou Stand-by LC notifiée.

### Cas 2 — Inde (composite 3.9)
- **Inputs** : composite=3.9, L=3.8, E=3.0 (LE_moy=3.4), K=4.4 (Inde Sud) à 5.5 (Inde Nord), I=3.5, C=3.2
- **Application matrice** : composite 2.5-4, LE_moy ≤ 3.5
  - Inde Sud (Tamil Nadu, Kerala) : K=4 → **Contrôlée — Succursale ou agent salarié**
  - Inde Nord (UP, Bihar) : K=5 → **Concertée — JV ou Franchise**
- **Modulations** : pas de flag I/C critique
- **Recommandation finale** :
  - Inde Sud (corridor tech, Bangalore-Chennai) : succursale + agent salarié. Crédoc notifié.
  - Inde Nord : JV avec groupe industriel local. Crédoc confirmé impératif.

### Cas 3 — Sahel (composite 5.8 agrégé)
- **Inputs** : composite=5.8, L=5.5, E=5.8 (LE_moy=5.65), K non applicable (R12 : écart-type K composants > 1.0 sur la zone), M=6.5
- **Application matrice** : composite > 5.5 → **Sous-traitée stricte ou abstention**
- **Modulations** : pas de flags additionnels nécessaires (déjà au plafond risque)
- **Recommandation finale** : Sous-traitée stricte — Importateur basé hors zone (ex. Côte d'Ivoire pour le Sahel ouest). 100 % paiement d'avance ou crédoc confirmé via banque internationale + assurance Coface si éligible. Présence physique = abstention.

### Cas 4 — Chine côtière (cas type, hors backtest formel)
- **Inputs estimés** : composite ~3.8, L=4.5, E=2.8 (LE_moy=3.65), K=6.0, I=6.5, C=5.5
- **Application matrice** : composite 2.5-4, LE_moy > 3.5 → **Concertée — JV avec partenaire institutionnel**
- **Modulations** : I=6.5 → flag I (compliance + communication locale renforcée), C=5.5 → flag C (héberger données sensibles en Chine)
- **Recommandation finale** : JV majoritaire chinoise (souvent imposée), partenaire industriel ou ETI privée préférable à un SOE. Crédoc confirmé via banque hong-kongaise ou singapourienne.

### Cas 5 — Brésil (cas type)
- **Inputs estimés** : composite ~3.5, L=4.0, E=3.5 (LE_moy=3.75), K=4.0, I=3.0, C=3.5
- **Application matrice** : composite 2.5-4, LE_moy > 3.5 → **Concertée — JV avec partenaire institutionnel**
- **Recommandation finale** : JV avec groupe brésilien établi (familial ou coté). Crédoc confirmé. À noter : la complexité fiscale brésilienne (Custo Brasil) rend le partenaire local particulièrement utile.

### Cas 6 — Émirats arabes unis (cas type)
- **Inputs estimés** : composite ~3.0, L=3.0, E=2.5 (LE_moy=2.75), K=6.0, I=5.5, C=3.5
- **Application matrice** : composite 2.5-4, LE_moy ≤ 3.5, K=6 → **Concertée — JV ou Franchise**
- **Modulations** : I=5.5 → flag I
- **Recommandation finale** : JV ou Free Zone (présence directe via DIFC, ADGM, JAFZA). Le statut Free Zone est une modalité hybride : Contrôlée juridiquement mais avec friction culturelle gérée par l'écosystème expat. Crédoc notifié suffit dans les Free Zones.

### Cas 7 — Allemagne (cas type)
- **Inputs estimés** : composite ~1.8, L=1.5, E=2.0 (LE_moy=1.75), K=3.0
- **Application matrice** : composite ≤ 2.5, LE_moy ≤ 2.5, K=3 → **Contrôlée — Filiale ou vente directe**
- **Recommandation finale** : Filiale GmbH ou vente directe selon le secteur. Open account.

---

## Limites assumées

1. **Granularité sectorielle absente** : la matrice ne distingue pas les secteurs (B2B services vs B2C retail vs industrie lourde). Une recommandation matrice doit toujours être contextualisée par le secteur. Ex. retail B2C en Inde Sud = JV obligatoire (réglementation FDI Multi-Brand Retail), même si le composite SEMPLICE permettrait une succursale.
2. **Taille d'entreprise non modélisée** : une PME primo-exportatrice doit reculer d'un cran (moins d'engagement) qu'un grand groupe expérimenté.
3. **Référent France/EU** : la matrice est calibrée pour un investisseur européen. Investisseur chinois/indien/US = recalibrer K et ajuster la lecture L (sanctions extraterritoriales US).
4. **Pas de pondération de l'opportunité** : la matrice évalue la modalité d'approche du point de vue du risque. Le côté opportunité (cf. [grille-scoring-opportunite-v2.md](grille-scoring-opportunite-v2.md)) doit être croisé séparément.

---

## Historique

| Version | Date | Modification |
|---------|------|-------------|
| v1.0 | 2026-04-30 | Création — matrice 7 lignes × 3 colonnes, 7 cas calibrants, algorithme pseudocode, mode de paiement associé. Synthèse de la littérature sur les modes d'entrée à l'international (Root 1994, Hill et al. 1990, Brouthers 2002) et sur la sécurisation des transactions internationales (CCI Incoterms 2020, ISP98). |
