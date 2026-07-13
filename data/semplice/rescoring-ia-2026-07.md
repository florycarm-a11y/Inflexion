# SEMPLICE v3 — Rescoring dimension I (Intelligence Artificielle)

> **Batch 1/3 — 6 zones, en attente de validation**
> Inflexion Intelligence — Juillet 2026

---

## Objectif

La v3 du cadre SEMPLICE repurpose la dimension **I** : « Information » devient « **Intelligence
Artificielle** » (construit : *puissance IA souveraine d'un État vs dépendance* — compute, puces,
modèles, énergie, statecraft). L'ancien bloc informationnel est redistribué vers P (P16-P18) et
C (C13-C14 + CM1). Ce document rescore IA1-IA9 pour les 6 premières zones (batch 1/3) :
**ormuz, sahel, ukraine, cuba, chine, madagascar**. Les scores ne sont **pas** encore reportés
dans `semplice-zones-config.js` — la bascule interviendra après validation des 3 batchs.

## Avertissement — rupture de série

**I (Information, v2.1) et I (Intelligence Artificielle, v3) ne mesurent pas la même chose.**
Aucune continuité n'est attendue entre l'ancien et le nouveau score I : une zone à fort contrôle
informationnel (ex-I élevé) peut être une puissance IA souveraine (nouveau I bas), et
inversement. Les comparaisons ancien/nouveau fournies ici le sont *pour mémoire uniquement*.

## Méthodologie

1. **Grille de référence** : `grille-scoring-quantitative-v3.md`, section « I — Intelligence
   Artificielle » (9 indicateurs IA1-IA9, bandes 1-7, **7 = dépendance/vulnérabilité maximale**).
2. **Ancrage factuel** : recherche web (juillet 2026) pour IA1, IA2, IA3, IA6 au minimum ;
   ≥ 2 sources par indicateur quand la donnée existe. Les paliers non ancrables dans une donnée
   publiée sont marqués **(estimation)** avec la logique explicitée — aucun chiffre inventé.
3. **Quanti pondéré** : `Score_quanti_I = Σ(w×palier)/Σw` avec **IA2 et IA9 : w=3 (critiques) ;
   IA6 : w=1 (mineur) ; IA1, IA3, IA4, IA5, IA7, IA8 : w=2 (majeurs)**.
   **Σw = 19** (note : le plan d'implémentation annonçait Σw=21, erreur arithmétique —
   3+3+1+6×2 = 19 ; la formule normalisée Σ(w×palier)/Σw est appliquée telle quelle).
4. **Quali 1-7** : jugement structuré sur la cohérence d'ensemble (asymétries, revocabilité de
   l'accès, exposition stratégique).
5. **Score final** : `S_I = 0,60 × quanti + 0,40 × quali`, arrondi à 1 décimale.
6. **Règles de scope** : Ormuz et Mer de Chine sont des espaces stratégiques (R7-R8 de
   `semplice-scope-guidelines.md`) — l'IA des riverains pertinents est scorée ; Sahel est
   transfrontalier (R5-R6).

Cas d'ancrage du palier 7 de IA2 : le retrait du modèle **Fable 5** par amendement du
gouvernement américain (2026) — démonstration que l'accès aux modèles de pointe est révocable
par décision politique unilatérale, y compris pour des utilisateurs jusque-là licites.

---

## 1. Détroit d'Ormuz (`ormuz`) — espace stratégique

**Scope** : exposition IA des riverains pertinents — Iran (rive nord) et monarchies du Golfe
(EAU, Arabie saoudite, Oman, rive sud) — plus la dimension « IA adverse projetable » dans le
détroit. Zone structurellement **asymétrique** : un Iran sous embargo total face à des
monarchies hyperfinancées mais dépendantes des licences américaines.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 4 | Data centers du Golfe opérés par des nationaux (Khazna/G42) mais sur stack Azure/Oracle américain (Stargate UAE : OpenAI, Oracle, Nvidia) ; compute souverain iranien marginal. Contrôle national effectif estimé 35-50 % à l'échelle des riverains (estimation). | Microsoft Source EMEA 2025-11 ; DCD 2025-11 ; Introl 2025 |
| IA2 | 6 | Iran : embargo total sur les puces avancées, marché gris à 3× le prix mondial (palier 7 pris isolément) ; Golfe : accès conditionné aux licences BIS et aux accords bilatéraux US, révocables (palier 5). Profil de zone tiré par la double dépendance. | Recorded Future 2025 ; The National 2025-12 ; MEI « AI, the Gulf, and the US » 2026 |
| IA3 | 4 | EAU : > 376 MW live fin 2025 (~37 W/hab), expansion Microsoft-G42 +200 MW d'ici fin 2026, Stargate UAE cible 1 GW ; mais l'Iran (~90 M hab, capacité négligeable) dilue le ratio de zone à ~5-10 W IA/hab (estimation sur fourchette). | DCD 2025-11 ; Capacity 2025 ; Introl 2025 |
| IA4 | 4 | Falcon (TII, Abou Dhabi) : lignée de modèles ouverts compétitifs de 2e rang, pas frontière ; Iran et Oman dépendants de modèles étrangers ouverts. Moyenne de zone : dépendance à des modèles étrangers avec une capacité nationale de niche. | PDP Spectra « Sovereign AI 2026 » ; Stanford HAI AI Index (référence grille) |
| IA5 | 5 | Puissance compute américaine dominante dans la région (alliée du Golfe, adverse pour l'Iran) ; systèmes IA militaires iraniens (drones) projetables dans le détroit. Rival dominant régional, sans IA offensive documentée dirigée contre la zone entière. | MEI 2026 ; Recorded Future 2025 ; americanbazaaronline 2026-02 |
| IA6 | 2 | HUMAIN (PIF) : 100 Md$, partenariat 200 000 GPU Nvidia (2025-11) ; MGX : fonds IA de 49 Md$ ; Microsoft : 15,2 Md$ aux EAU d'ici 2029. Rapporté aux PIB saoudien et émirien, l'effort dépasse 0,8 % PIB/an côté Golfe ; Iran quasi nul — palier 2 en moyenne de zone. | Forbes 2026-07-03 ; vision2030.ai ; Microsoft 2025-11 |
| IA7 | 4 | Golfe : import massif de talents (solde positif) ; Iran : exode qualifié documenté. Solde de zone proche de l'équilibre, densité de chercheurs modérée (estimation). | MacroPolo Global AI Talent Tracker (référence grille) ; Recorded Future 2025 |
| IA8 | 3 | Golfe : énergie excédentaire bon marché, atout structurel des data centers ; Iran : pénuries électriques chroniques, incapable d'alimenter du compute à grande échelle. Équilibre de zone : correct côté sud, critique côté nord. | Introl 2025 ; The National 2025-12 |
| IA9 | 3 | Statecraft fort côté Golfe (PIF/HUMAIN, MGX, G42 = véhicules d'État) et côté iranien (stratégie top-10 IA 2032, projet Sahand) ; mais levier ultime détenu par Washington via les licences puces — leviers significatifs, non complets. | vision2030.ai ; Recorded Future 2025 ; Crowell & Moring 2026 |

**Quanti** : (2×4 + 3×6 + 2×4 + 2×4 + 2×5 + 1×2 + 2×4 + 2×3 + 3×3) / 19 = 77/19 = **4,05**

**Quali : 4,5** — Le détroit concentre une asymétrie IA majeure : la puissance compute du Golfe
est réelle mais *louée* (chips sous licence US, stack hyperscaler américain, précédent Fable 5
démontrant la révocabilité), tandis que l'Iran compense son exclusion par le marché gris et une
IA militaire frugale projetable dans le détroit. En scénario de crise, les deux rives sont
vulnérables : l'une à la coupure d'accès, l'autre à l'embargo déjà en place.

**S_I = 0,60 × 4,05 + 0,40 × 4,5 = 2,43 + 1,80 = 4,23 → 4,2**

*Ancien score I (Information) : 6,9 — pour mémoire. La baisse reflète le changement de construit :
l'ancien score capturait le verrouillage informationnel iranien ; le nouveau intègre la puissance
compute du Golfe.*

---

## 2. Sahel (`sahel`) — zone transfrontalière (Mali + Niger + Burkina Faso)

**Scope** : profils homogènes (R5), dépendance quasi totale, avec deux nuances imposées par le
cadrage : IA5 (présence tech de puissances externes — Russie, Chine, Turquie) et IA8 (réseau
électrique très contraint).

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 5 | Data center Tier III étatique inauguré à Bamako (hébergement souverain des données gouvernementales AES), mini data centers au Burkina, projets au Niger — mais l'essentiel des services numériques reste hébergé à l'étranger ou sur infrastructures Orange/Huawei. Contrôle national estimé 20-35 % (estimation). | DCD 2026 ; Ecofin Agency 2026-02 ; Georgetown Africa-China Initiative |
| IA2 | 5 | Aucune production, dépendance d'importation totale (équipements Huawei/chinois majoritaires) ; sanctions financières et isolement CEDEAO/occidental des régimes AES compliquant l'accès aux financements et fournisseurs — dépendance + contraintes renforcées de fait. | Georgetown Africa-China Initiative ; Military Africa 2025-12 (estimation sur le volet contraintes) |
| IA3 | 7 | Capacité data centers rapportée à ~75 M hab : très en dessous de 0,5 W IA/hab, même après le DC de Bamako (quelques MW au plus). | DCD 2026 ; Africa DCA « Data Centres in Africa » 2026 |
| IA4 | 5 | Aucun modèle national ; usage dépendant de modèles étrangers, ouverts ou propriétaires, sans levier. | Stanford HAI AI Index (référence grille) ; estimation |
| IA5 | 5 | Présence technologique externe structurante : accord satellites télécom/surveillance avec Roscosmos (Russie), équipements et data centers Huawei (Chine), drones turcs. Puissances externes dominantes dans la couche numérique de la zone, posture non adverse envers les régimes mais dépendance stratégique totale. | Military Africa 2025-12 ; Georgetown Africa-China Initiative ; Data Centre Magazine 2026 |
| IA6 | 7 | Aucun investissement IA mesurable ; < 0,03 % PIB (estimation, aucune donnée OECD.AI/Dealroom pour la zone). | OECD.AI (absence de données) ; Air Street State of AI (non couvert) |
| IA7 | 7 | Densité de chercheurs IA < 1/100k hab, exode massif des qualifiés vers la côte et l'Europe (estimation qualitative, cohérente avec MacroPolo qui ne trace aucun hub sahélien). | MacroPolo Global AI Talent Tracker ; estimation |
| IA8 | 6 | Accès à l'électricité parmi les plus bas au monde (Niger < 20 %), délestages chroniques, réseaux non interconnectés — tension critique pour toute charge de calcul, sans atteindre l'effondrement total type Cuba. | Banque mondiale / AFDB Mission 300 ; IEA (référence grille) |
| IA9 | 6 | Rhétorique de souveraineté numérique AES (hébergement local, satellites russes) mais leviers marginaux : pas de compute, pas de champions, pas de capacité de financement — l'État oriente un écosystème quasi inexistant. | Ecofin Agency 2026-02 ; Military Africa 2025-12 |

**Quanti** : (2×5 + 3×5 + 2×7 + 2×5 + 2×5 + 1×7 + 2×7 + 2×6 + 3×6) / 19 = 110/19 = **5,79**

**Quali : 6,0** — Dépendance quasi totale sur toute la chaîne (matériel, modèles, énergie,
talent), aggravée par l'isolement diplomatique des juntes. Les initiatives souveraines (DC de
Bamako, satellites russes) sont réelles mais substituent une dépendance (occidentale) par une
autre (russo-chinoise) sans créer de capacité propre.

**S_I = 0,60 × 5,79 + 0,40 × 6,0 = 3,47 + 2,40 = 5,87 → 5,9**

*Ancien score I (Information) : 5,8 — pour mémoire. Quasi-stabilité de façade : les construits
diffèrent (contrôle informationnel vs dépendance IA), la proximité des valeurs est fortuite.*

---

## 3. Ukraine / Mer Noire (`ukraine`)

**Scope** : les systèmes d'armes autonomes restent dans M (frontière anti-double-comptage de la
grille v3) ; I mesure la couche compute/modèles/énergie/statecraft. Le paradoxe ukrainien :
écosystème IA appliquée parmi les plus dynamiques au monde, sur une base d'infrastructure presque
entièrement étrangère.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 6 | Après destruction/exposition des data centers domestiques, l'État et l'économie reposent sur le cloud occidental (AWS/Azure/Google, données gouvernementales migrées hors du pays) ; le projet de compute souverain Kyivstar + ministère de l'Économie (3-5 MW) est naissant. Contrôle national 8-20 %. | Atlantic Council « The coming compute war in Ukraine » 2026 ; Mobile World Live 2026-06 ; CSIS « Data Is Now the Front Line of Warfare » |
| IA2 | 3 | Accès aux puces via fournisseurs alliés diversifiés (statut de partenaire occidental prioritaire) ; pas de production nationale, mais pas de restriction — dépendance encadrée par l'alliance. | CSIS 2026 ; Atlantic Council 2026 |
| IA3 | 6 | Capacité IA installée très faible (data centers détruits ou vulnérables aux frappes) ; projet Kyivstar de 3-5 MW = ~0,1 W/hab. Fourchette 0,5-2 W/hab (estimation). | Mobile World Live 2026-06 ; News.az 2026 |
| IA4 | 5 | Aucun modèle de fondation national ; l'IA militaire (Swarmer, 200+ sociétés defense-AI) est construite sur des modèles et outils étrangers, majoritairement propriétaires américains. Le précédent Fable 5 rappelle que cet accès est politiquement révocable, même pour un allié. | Odessa Journal 2026 ; Atlantic Council 2026 ; Startup Genome 2026 |
| IA5 | 6 | Russie : rival dominant en volume face au compute propre de l'Ukraine, posture agressive, usage documenté d'IA dans les frappes/EW dirigées vers la zone — sans domination compute absolue (contrebalancée par le soutien occidental), d'où 6 et non 7. | CSIS 2026 ; Fortune 2026-05-31 ; IISS (référence grille) |
| IA6 | 4 | Startups IA : ~302 M$ levés en 2025 (×3 vs hors-IA) ; defense tech : 105 M$ en 2025 + 129 M$ au T1 2026 ; rapporté au PIB (~180 Md$) : ~0,2-0,4 % PIB en incluant l'effort d'État (Brave1). | Startup Genome GSER 2026 ; AIN.ua 2026-05 ; defensetechforukraine.org |
| IA7 | 4 | 300 000+ spécialistes tech, 6,45 Md$ d'exports IT (2024), hub Kyiv (Brave1) ; émigration de guerre compensée par l'aimant defense-tech — densité IA estimée ~5/100k, équilibre fragile (estimation). | Startup Genome 2026 ; digitalstate.gov.ua 2026 |
| IA8 | 6 | Réseau électrique cible systématique des frappes russes, délestages récurrents — tension critique pour toute charge de calcul stationnaire ; c'est un motif explicite du dimensionnement modeste du projet Kyivstar. | Atlantic Council 2026 ; Mobile World Live 2026-06 |
| IA9 | 3 | Statecraft parmi les plus actifs au monde à ressources égales : Brave1, ministère de la Transformation numérique, orientation de l'écosystème vers l'IA militaire, IPO Swarmer (Nasdaq 2026-03) — leviers significatifs, limités par la dépendance d'infrastructure. | digitalstate.gov.ua 2026 ; Odessa Journal 2026 ; Atlantic Council 2026 |

**Quanti** : (2×6 + 3×3 + 2×6 + 2×5 + 2×6 + 1×4 + 2×4 + 2×6 + 3×3) / 19 = 88/19 = **4,63**

**Quali : 5,0** — Le talent et le statecraft sont réels, mais la structure est celle d'un
point de défaillance unique : la connectivité militaire dépend de Starlink (« l'architecture de
combat s'effondrerait en quelques jours » en cas de coupure — CircleID 2025), le cloud est
étranger, l'énergie est sous le feu. La capacité IA ukrainienne existe *par* la dépendance, pas
malgré elle.

**S_I = 0,60 × 4,63 + 0,40 × 5,0 = 2,78 + 2,00 = 4,78 → 4,8**

*Ancien score I (Information) : 5,8 — pour mémoire (guerre informationnelle active dans l'ancien
construit ; capacité IA réelle mais dépendante dans le nouveau).*

---

## 4. Cuba (`cuba`)

**Scope** : embargo total (accès puces/cloud quasi nul), énergie en effondrement, statecraft
fort sur un écosystème minuscule.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 3 | Lecture littérale de l'indicateur : la (minuscule) capacité existante est ~100 % étatique (ETECSA/UCI), l'embargo interdisant de fait le cloud américain — « contrôle national » élevé par défaut. **Paradoxe assumé et documenté** : ce palier mesure le contrôle, pas la puissance (capturée par IA3/IA6). Estimation. | Wikipedia « 2024-2026 Cuba blackouts » (contexte infra) ; Electric Choice 2026 ; estimation |
| IA2 | 7 | Embargo américain total + extraterritorial sur les technologies avancées ; aucune voie légale d'accès aux puces < 7 nm ni aux accélérateurs IA. Palier 7 de la grille (type retrait Fable 5, ici en régime permanent). | OFAC / BIS (référence grille) ; CNN 2026-03 (contexte du durcissement des sanctions) |
| IA3 | 7 | Capacité data centers IA négligeable, < 0,5 W/hab — le réseau ne fournit même plus la demande domestique de base (935 MW disponibles pour 3 100 MW de demande). | TechTimes 2026-07-11 ; Al Jazeera 2026-07-07 |
| IA4 | 6 | Modèles propriétaires américains inaccessibles (blocage sanctions par les fournisseurs) ; recours possible aux modèles ouverts chinois — accès restreint/partiel plutôt que révoqué. | OFAC (régime de sanctions) ; estimation sur les pratiques des fournisseurs |
| IA5 | 6 | Les États-Unis, puissance compute dominante mondiale, exercent une pression maximale documentée sur la zone (sanctions renforcées 2026, coupure des approvisionnements) — rival dominant + posture agressive, sans IA offensive documentée dirigée contre Cuba. | CNN 2026-03-18 ; CNN 2026-07-06 |
| IA6 | 7 | Aucun investissement IA mesurable, économie en survie ; < 0,03 % PIB (estimation, aucune donnée OECD.AI/Dealroom). | OECD.AI (absence de données) ; estimation |
| IA7 | 6 | Base éducative réelle (UCI — Universidad de las Ciencias Informáticas, tradition biotech/informatique) mais exode massif des qualifiés depuis 2021-2026 ; densité résiduelle 1-2/100k avec exode (estimation). | MacroPolo (non couvert) ; estimation sur flux migratoires documentés |
| IA8 | 7 | 4 effondrements totaux du réseau national en 2026 (9 depuis fin 2024), délestages ≥ 18 h/jour, réserve de carburant épuisée — incapacité structurelle d'alimenter le moindre compute. Palier 7 sans ambiguïté. | Al Jazeera 2026-07-07 ; TechTimes 2026-07-11 ; CNN 2026-07-06 ; NPR 2026-05-14 |
| IA9 | 4 | Contrôle étatique complet sur l'écosystème numérique (ETECSA monopolistique) mais capacité d'orientation réelle quasi nulle : rien à financer, rien à allouer — leviers partiels sur un objet vide. | Electric Choice 2026 ; estimation |

**Quanti** : (2×3 + 3×7 + 2×7 + 2×6 + 2×6 + 1×7 + 2×6 + 2×7 + 3×4) / 19 = 110/19 = **5,79**

**Quali : 6,0** — Cuba cumule l'embargo technologique permanent le plus complet du panel et un
effondrement énergétique qui rend toute ambition compute théorique. Les seuls amortisseurs sont
le contrôle étatique intégral (pas de dépendance cloud à couper : elle n'existe pas) et une base
éducative résiduelle. La vulnérabilité IA est totale mais *statique* — il n'y a presque rien à
perdre de plus.

**S_I = 0,60 × 5,79 + 0,40 × 6,0 = 3,47 + 2,40 = 5,87 → 5,9**

*Ancien score I (Information) : 5,6 — pour mémoire.*

---

## 5. Mer de Chine (`chine`) — espace stratégique

**Scope** : espace centré sur la Chine et Taïwan. La Chine est le cas d'école du construit v3 :
**embargo puces (IA2 élevé) MAIS souveraineté compute/modèles forte (IA1/IA4 bas)**. TSMC est
l'enjeu IA5/IA2 régional majeur : ~92 % des puces logiques les plus avancées (< 5 nm) sont
produites à Taïwan — à la fois force du camp taïwanais et point de rupture systémique mondial en
scénario de conflit.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 1 | Compute chinois massivement souverain : opérateurs nationaux (Alibaba, Tencent, opérateurs d'État), 215 EFLOPS de capacité IA en 2025 (+40 %/an, > 330 EFLOPS attendus fin 2026), plan de 295 Md$ imposant les puces domestiques dans les nouveaux data centers. Taïwan également souverain. > 80 % sous contrôle national. | Global Times 2026-06 ; Bloomberg 2026-06-09 ; TechTimes 2026-06-22 |
| IA2 | 5 | Contrôles américains maintenus sur < 7 nm (équipement, Entity List : Huawei, YMTC, Naura ; FDP rules) ; H200 admis au cas par cas depuis janvier 2026 avec prélèvement de 25 % des revenus — accès conditionnel et politiquement réversible. Compensé par une production nationale partielle réelle (SMIC 7 nm, Huawei Ascend) qui borne le palier à 5 plutôt que 6. | Morgan Lewis 2026-01 ; CRS R48642 ; Consumer Electronics Daily 2026 |
| IA3 | 3 | Capacité data centers chinoise ~10-25 W/hab (capacité nationale en dizaines de GW pour 1,4 Md hab., 60 GW visés en 2030) ; Taïwan nettement au-dessus. | Rystad Energy via Al Jazeera 2026-05-28 ; Goldman Sachs 2026 ; NextBigFuture 2025-10 |
| IA4 | 1 | Modèles de fondation nationaux à la frontière ou à son contact immédiat (DeepSeek, Qwen…), écosystème open-weights chinois dominant hors États-Unis. Souveraineté des modèles acquise. | Epoch AI / Stanford HAI (référence grille) ; Axis Intelligence 2026 |
| IA5 | 6 | Les États-Unis, puissance compute dominante mondiale, mènent une politique technologique explicitement coercitive dirigée vers la zone (export controls, Entity List, pression sur TSMC) ; posture agressive documentée, sans « IA offensive » militaire avérée dirigée contre la zone — 6 et non 7. | CSIS 2026 ; Morgan Lewis 2026-01 ; EE Times Asia 2026 |
| IA6 | 3 | Capex IA chinois ~98 Md$ en 2025 (~0,5 % du PIB), fonds d'État (8,2 Md$ AI Industry Fund + 138 Md$ National VC Guidance Fund), plan data centers de 295 Md$/5 ans — bande 0,4-0,8 % PIB. | Axis Intelligence 2026 ; Bloomberg 2026-06-09 ; Goldman Sachs 2026 |
| IA7 | 3 | Premier producteur mondial de chercheurs IA d'élite en volume (MacroPolo : ~la moitié des top-tier issus de Chine), rétention en hausse ; densité par 100k hab. modérée du fait de la population — 8-15/100k, équilibre (estimation sur bande). | MacroPolo Global AI Talent Tracker ; Stanford HAI AI Index |
| IA8 | 2 | Énergie abondante et bon marché, explicitement identifiée comme l'avantage comparatif chinois dans la course au compute (« secret weapon ») ; intégration réseau financée dans le plan à 740 Md$ (grid inclus). | Al Jazeera 2026-05-28 ; Bloomberg 2026-06-09 |
| IA9 | 1 | Contrôle effectif complet de l'État sur sa puissance IA : allocation du compute, mandat de puces domestiques (exclusion Nvidia des nouveaux DC subventionnés), champions nationaux dirigés, levier export. Cas limite de la bande 1. | Bloomberg 2026-06-09 ; TechTimes 2026-06-22 ; Carnegie (référence grille) |

**Quanti** : (2×1 + 3×5 + 2×3 + 2×1 + 2×6 + 1×3 + 2×3 + 2×2 + 3×1) / 19 = 53/19 = **2,79**

**Quali : 3,5** — La zone est l'épicentre de la confrontation IA mondiale : la Chine a bâti la
seule puissance IA quasi souveraine hors États-Unis (compute, modèles, énergie, statecraft),
mais reste exposée sur le nœud des puces avancées — et la concentration TSMC (~92 % du < 5 nm
mondial, recherche de pointe maintenue à Taïwan) fait de tout scénario de conflit dans le détroit
un événement de rupture pour la zone elle-même comme pour le système mondial. Le quali est relevé
au-dessus du quanti pour capturer ce risque de contingence que les paliers statiques lissent.

**S_I = 0,60 × 2,79 + 0,40 × 3,5 = 1,67 + 1,40 = 3,07 → 3,1**

*Ancien score I (Information) : 6,9 — pour mémoire. La chute illustre la rupture de série :
l'ancien construit mesurait le monopole informationnel d'État (maximal en Chine), le nouveau
mesure la dépendance IA (faible en Chine). C'est le comportement attendu de la v3.*

---

## 6. Madagascar (`madagascar`)

**Scope** : dépendance structurelle, capacité quasi nulle — mais scorée indicateur par
indicateur : l'absence d'exposition stratégique (pas d'embargo, pas de rival projetant de l'IA
adverse) distingue Madagascar de Cuba ou du Sahel et interdit les 6-7 réflexes.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 6 | Data centers locaux embryonnaires (opérateurs télécoms nationaux, briefing marché D4D juillet 2025 : marché naissant), déploiement de nœuds cloud étrangers (Zadara) ; l'essentiel des services numériques hébergé hors du pays. Contrôle national 8-20 % (estimation). | D4D Hub « Madagascar Data Center Market Briefing » 2025-07 ; DCD (tag Madagascar) ; Africa DCA 2026 |
| IA2 | 4 | Aucune production ni levier, dépendance d'importation totale (équipementiers dominants : Huawei/fournisseurs uniques par segment) ; mais aucun contrôle export ni sanction ne vise le pays — dépendance simple, marché ouvert. | Georgetown Africa-China Initiative ; BIS Entity List (non concerné) |
| IA3 | 7 | Capacité data centers rapportée à ~30 M hab : < 0,5 W IA/hab sans ambiguïté. | D4D Hub 2025-07 ; Africa DCA 2026 |
| IA4 | 5 | Aucun modèle national ; dépendance aux modèles étrangers, y compris propriétaires — accès commercial non restreint. | Stanford HAI AI Index (référence grille) ; estimation |
| IA5 | 3 | Présence tech étrangère (Huawei, Orange, nœuds cloud) structurante mais non adverse : aucune puissance rivale ne projette de capacité IA hostile vers la zone. Rival présent, avance modérée. | Data Centre Magazine 2026 ; Georgetown Africa-China Initiative |
| IA6 | 7 | Aucun investissement IA mesurable ; < 0,03 % PIB (estimation, non couvert par OECD.AI/Dealroom). | OECD.AI (absence de données) ; estimation |
| IA7 | 6 | Vivier IT réel mais étroit (BPO francophone), densité de chercheurs IA 1-2/100k au mieux, exode modéré des qualifiés (estimation). | MacroPolo (non couvert) ; estimation |
| IA8 | 6 | Accès à l'électricité ~36 % (7 % en rural), JIRAMA en crise structurelle (déficit ~250 M$/an, arriérés 400 M$, trois réseaux non interconnectés, ~400 km de lignes HT), délestages chroniques — tension critique pour toute charge de calcul. | IMF Selected Issues 2025 ; Banque mondiale 2025-02 ; energynews.pro |
| IA9 | 6 | Leviers étatiques marginaux : pas de stratégie IA dotée, pas de champions, capacité de financement nulle ; la couche numérique du pays est orientée par les opérateurs et bailleurs étrangers. | D4D Hub 2025-07 ; estimation |

**Quanti** : (2×6 + 3×4 + 2×7 + 2×5 + 2×3 + 1×7 + 2×6 + 2×6 + 3×6) / 19 = 103/19 = **5,42**

**Quali : 5,5** — Dépendance structurelle profonde sur toute la chaîne, aggravée par la crise
énergétique — mais sans surexposition géopolitique : Madagascar subit une *absence* de puissance
IA, pas une coercition. Le profil est celui d'un pays spectateur de la course au compute, dont la
marge de manœuvre dépend entièrement des bailleurs et opérateurs étrangers.

**S_I = 0,60 × 5,42 + 0,40 × 5,5 = 3,25 + 2,20 = 5,45 → 5,5**

*Ancien score I (Information) : 3,5 — pour mémoire. La hausse illustre la rupture de série dans
l'autre sens : un écosystème médiatique relativement pluraliste (ancien construit) coexiste avec
une dépendance IA structurelle (nouveau construit).*

---

## Récapitulatif Batch 1

| Zone (id) | S_I quanti | Quali | **S_I final** | Ancien I (Information) |
|-----------|:----------:|:-----:|:-------------:|:----------------------:|
| ormuz | 4,05 | 4,5 | **4,2** | 6,9 |
| sahel | 5,79 | 6,0 | **5,9** | 5,8 |
| ukraine | 4,63 | 5,0 | **4,8** | 5,8 |
| cuba | 5,79 | 6,0 | **5,9** | 5,6 |
| chine | 2,79 | 3,5 | **3,1** | 6,9 |
| madagascar | 5,42 | 5,5 | **5,5** | 3,5 |

**Lecture d'ensemble** : le nouveau construit discrimine correctement — la Chine (puissance IA
quasi souveraine) décroche vers le bas, Madagascar (dépendance sans capacité) remonte, les zones
sous embargo ou en guerre (Cuba, Sahel, Ukraine) restent hautes pour des raisons désormais
*technologiques* et non plus informationnelles. La règle de cohérence v3 (« si IA ≤ 2 alors
C ≤ 4 attendu ») n'est déclenchée par aucune zone du batch (minimum : chine à 3,1).

## Indicateurs scorés en estimation (donnée publiée introuvable)

| Zone | Indicateurs | Nature de l'estimation |
|------|-------------|------------------------|
| ormuz | IA1, IA3 (bande), IA7 | Répartition du contrôle national du compute ; ratio W/hab de zone ; solde talent agrégé |
| sahel | IA2 (volet contraintes), IA4, IA6, IA7 | Aucune donnée OECD.AI/Dealroom/MacroPolo pour la zone |
| ukraine | IA3 (bande), IA7 (densité) | Capacité résiduelle non publiée ; densité chercheurs IA dérivée du vivier tech |
| cuba | IA1, IA4, IA6, IA7, IA9 | Écosystème non couvert par les trackers ; paradoxe IA1 documenté dans la fiche |
| chine | IA7 (bande par habitant) | Volume documenté, densité/100k interpolée |
| madagascar | IA4, IA6, IA7, IA9 | Écosystème non couvert par les trackers |

## Sources principales

Microsoft/G42 (Source EMEA, 2025-11), DCD, Capacity, Introl (2025) — data centers Golfe ·
Forbes (2026-07-03), vision2030.ai, MEI, Crowell & Moring (2026) — HUMAIN, MGX, statecraft Golfe ·
Recorded Future (2025), The National (2025-12) — IA iranienne sous sanctions ·
Bloomberg (2026-06-09), Al Jazeera (2026-05-28), Goldman Sachs, Global Times (2026-06), Axis
Intelligence — compute et investissement chinois · Morgan Lewis (2026-01), CRS R48642, CSIS —
export controls · EE Times Asia, byteiota (2026) — TSMC · Atlantic Council, CSIS, CircleID,
Mobile World Live (2026-06) — compute et Starlink Ukraine · Startup Genome GSER 2026, AIN.ua,
Odessa Journal, digitalstate.gov.ua — écosystème IA ukrainien · CNN (2026-03/07), Al Jazeera
(2026-07-07), TechTimes (2026-07-11), NPR (2026-05-14) — effondrement électrique cubain ·
DCD/Ecofin (2026-02), Military Africa (2025-12), Georgetown Africa-China Initiative — numérique
sahélien · D4D Hub (2025-07), IMF Selected Issues (2025), Banque mondiale (2025-02), Africa DCA
(2026) — Madagascar · Références de la grille v3 : Epoch AI, Stanford HAI, MacroPolo, OECD.AI,
IEA, SemiAnalysis, Georgetown CSET.

---

*Statut : Batch 1/3 — 6 zones scorées, en attente de validation. Batchs 2-3 (12 zones
restantes) et bascule `semplice-zones-config.js` : hors périmètre de ce document.*
