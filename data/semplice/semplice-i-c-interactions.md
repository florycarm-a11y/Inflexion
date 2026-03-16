# SEMPLICE — Interactions Information (I) / Cyber (C)

> **Objectif** : documenter les mecanismes causaux entre les dimensions Information et Cyber,
> actuellement scorees independamment mais causalement liees.
> Inflexion Intelligence — Mars 2026

---

## Pourquoi documenter ces interactions ?

Les dimensions I (Information) et C (Cyber) sont les deux ajouts exclusifs de SEMPLICE par rapport a PESTEL/SWOT/FSI. Elles sont scorees de maniere independante dans la grille, mais dans la realite, elles interagissent fortement :

- Une campagne de desinformation (I) peut preparer ou accompagner une cyberattaque (C)
- Un piratage massif (C) peut alimenter des operations d'influence (I)
- Le controle de l'information (I) depend souvent de capacites de surveillance cyber (C)

Le scoring independant reste methodologiquement correct (evite la double comptabilisation), mais les analystes doivent documenter ces interactions dans leurs evaluations.

---

## 10 scenarios croises I <-> C

### Scenario 1 : Desinformation preparatoire a cyberattaque
**Direction** : I -> C
**Mecanisme** : Une campagne de desinformation coordonnee (I >= 5) precede et accompagne une cyberattaque majeure, en creant de la confusion et en retardant la reponse.
**Cas reel** : Ukraine 2022 — campagnes de desinformation russes (narratif "denazification") quelques jours avant les cyberattaques WhisperGate/HermeticWiper sur les systemes gouvernementaux.
**Zones concernees** : Ukraine, Taiwan (scenario), Etats baltes
**Impact scoring** : Si I >= 5 et C >= 4, considerer un risque d'escalade coordonnee. Le score composite devrait refleter la synergie (pas la somme).

### Scenario 2 : Data leak → campagne d'influence
**Direction** : C -> I
**Mecanisme** : Un piratage (C) exfiltre des donnees sensibles, ensuite utilisees dans une campagne d'influence (I) pour destabiliser un gouvernement ou une election.
**Cas reel** : Macron Leaks 2017 — piratage APT28 des emails de campagne, diffusion via WikiLeaks a 48h du scrutin.
**Zones concernees** : Toute democratie en periode electorale
**Impact scoring** : Un score C eleve (piratage etatique) devrait alerter sur un risque I latent. Verifier si les donnees exfiltrees ont un potentiel de weaponization informationnelle.

### Scenario 3 : Censure Internet = controle informationnel + surveillance
**Direction** : C <-> I (bidirectionnel)
**Mecanisme** : Le controle de l'information (I) s'appuie sur des capacites de surveillance et de filtrage cyber (C). Inversement, la maturite cyber permet un controle informationnel plus fin.
**Cas reel** : Chine — Grand Firewall (C) + censure algorithmique des reseaux sociaux (I). Le score C est eleve non pas a cause de vulnerabilites mais d'un usage offensif interne.
**Zones concernees** : Chine, Iran, Russie, Turquie (dans une moindre mesure)
**Impact scoring** : Dans les regimes autoritaires, un score I eleve implique presque toujours un appareil cyber sophistique. Verifier la coherence C >= I - 1.

### Scenario 4 : Cyberattaque sur medias = blackout informationnel
**Direction** : C -> I
**Mecanisme** : Une attaque sur l'infrastructure mediatique (sites d'information, serveurs DNS, reseaux telco) cree un vide informationnel exploitable.
**Cas reel** : Sahel — coupures Internet ordonnees par les juntes (Mali, Burkina Faso) lors de coups d'Etat, combinant controle physique (C) et narrative (I).
**Zones concernees** : Sahel, Myanmar, Soudan
**Impact scoring** : Si C >= 5 avec attaque sur infrastructure telco, le score I devrait refleter la degradation de l'ecosysteme informationnel resultante.

### Scenario 5 : Manipulation algorithmique = arme informationnelle cyber-deployee
**Direction** : C -> I
**Mecanisme** : Des reseaux de bots et de faux comptes (capacite C) amplifient des narratifs de desinformation (impact I). La frontiere entre cyber et information s'efface.
**Cas reel** : Internet Research Agency (Russie) — fermes a trolls utilisant des infrastructures cyber sophistiquees pour des operations d'influence sur les elections US 2016/2020.
**Zones concernees** : Cibles occidentales, operateurs russes/chinois/iraniens
**Impact scoring** : Les indicateurs I (desinformation) et C (bots/infrastructure) mesurent des facettes du meme phenomene. Risque de sous-estimation si scores en silo.

### Scenario 6 : Ransomware sur infrastructure critique → panique informationnelle
**Direction** : C -> I
**Mecanisme** : Un ransomware paralyse une infrastructure critique (hopital, pipeline, reseau electrique). La panique resultante cree un vide informationnel comble par des rumeurs et de la desinformation.
**Cas reel** : Colonial Pipeline (US, 2021) — ransomware DarkSide, panique aux stations-service, fausses informations sur les penuries amplifiant la crise.
**Zones concernees** : Toute zone avec infrastructure numerisee et ecosysteme informationnel fragile
**Impact scoring** : Un score C >= 5 (attaque infrastructure) devrait trigger une verification du score I (capacite de gestion de crise informationnelle).

### Scenario 7 : Espionnage cyber → avantage negociation → manipulation narrative
**Direction** : C -> I (chaine)
**Mecanisme** : L'espionnage cyber (C) fournit un avantage informationnel strategique (I) dans les negociations diplomatiques ou commerciales. L'information volee est utilisee pour manipuler les narratifs.
**Cas reel** : Chine — espionnage cyber massif (APT groups) sur entreprises et gouvernements occidentaux, informations utilisees pour des negociations commerciales et des contre-narratifs (ex: "double standard" sur la cybersecurite).
**Zones concernees** : Chine, Russie, Coree du Nord, Iran (offensif) ; cibles OCDE (defensif)
**Impact scoring** : Les zones offensives (C eleve en capacite) ont un I artificiellement bas (controlee) ; les zones cibles ont un I degrade sans que C ne l'explique directement.

### Scenario 8 : Election interference = convergence I+C
**Direction** : I <-> C (convergent)
**Mecanisme** : L'interference electorale combine systematiquement des capacites cyber (piratage, DDoS sur systemes de vote) et informationnelles (desinformation, microtargeting). Les deux dimensions convergent vers un objectif unique.
**Cas reel** : Multiples — US 2016/2020, France 2017, Brexit, Bresil 2022. Chaque cas implique une combinaison piratage + influence.
**Zones concernees** : Toute democratie avec vote electronique ou campagne numerisee
**Impact scoring** : En periode electorale, le risque I+C combine devrait etre signale comme un pattern (cf. SIG6 Cyber War dans le validateur, mais la couverture electorale manque).

### Scenario 9 : Whistleblowing secure = renforcement mutuel positif
**Direction** : C -> I (positif)
**Mecanisme** : Des plateformes de communication securisees (capacite C defensive) permettent un meilleur ecosysteme informationnel (I defensive). Les lanceurs d'alerte et journalistes sont mieux proteges.
**Cas reel** : Estonie — maturite cyber elevee + ecosysteme informationnel resilient. Signal/SecureDrop utilises par les medias dans les zones a risque.
**Zones concernees** : Zones a haut C defensif et I libre (Estonie, Scandinavie, Israel)
**Impact scoring** : Un C bas (bonne posture) peut renforcer un I bas (information libre). La correlation positive est un signal de resilience.

### Scenario 10 : Deepfakes = nouvelle frontiere I/C
**Direction** : C -> I (emergent)
**Mecanisme** : Les capacites de generation de deepfakes (technologie C) creent un nouveau vecteur de desinformation (impact I). La detection depend aussi de capacites C.
**Cas reel** : Emergent — deepfakes utilises dans des arnaques financieres et des tentatives de manipulation politique. Pas encore de cas geopolitique majeur, mais le precurseur est clair.
**Zones concernees** : Global — risque proportionnel a la penetration Internet et inversement proportionnel a la litteratie numerique
**Impact scoring** : Futur indicateur a integrer dans les grilles I et C. Pour l'instant, verifier manuellement si des incidents deepfake sont signales dans la zone evaluee.

---

## Recommandations pour les analystes

1. **Toujours verifier la coherence I/C** : si |I - C| > 2.0, justifier explicitement pourquoi les deux dimensions divergent.
2. **Documenter les interactions** : dans la section "flags" de l'evaluation JSON, ajouter un flag "I-C interaction" quand un scenario croise est identifie.
3. **Periode electorale** : augmenter la vigilance I+C de +0.5 pendant les 6 mois precedant une election majeure.
4. **Regimes autoritaires** : verifier que C >= I - 1 (le controle informationnel implique des capacites cyber).
5. **Ne pas double-compter** : le meme evenement (ex: hack + leak) ne doit etre compte qu'une fois dans le composite. Le scorer dans la dimension primaire et documenter l'interaction dans l'autre.
