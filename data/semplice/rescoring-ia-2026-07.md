# SEMPLICE v3 — Rescoring dimension I (Intelligence Artificielle)

> **Batchs 1-3 terminés — 18/18 zones scorées, bascule config en attente**
> Inflexion Intelligence — Juillet 2026

---

## Objectif

La v3 du cadre SEMPLICE repurpose la dimension **I** : « Information » devient « **Intelligence
Artificielle** » (construit : *puissance IA souveraine d'un État vs dépendance* — compute, puces,
modèles, énergie, statecraft). L'ancien bloc informationnel est redistribué vers P (P16-P18) et
C (C13-C14 + CM1). Ce document rescore IA1-IA9. **Batch 1/3** : ormuz, sahel, ukraine, cuba,
chine, madagascar. **Batch 2/3** : turquie, inde, bresil, tamil, arctique, ile-maurice.
**Batch 3/3** : **singapour, republique-tcheque, iran, mexique, vietnam, ethiopie**.
Les scores ne sont **pas** encore reportés dans `semplice-zones-config.js` — la bascule
interviendra après validation des 3 batchs.

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

## 7. Turquie (`turquie`)

**Scope** : évaluation nationale. La Turquie illustre le cas de la « moyenne puissance » qui
*gère* sa dépendance IA plutôt que de la subir : statecraft explicite et coordonné (plan
présidentiel, TÜBİTAK), mais plafond structurel imposé par le statut Tier 2 de l'ancien cadre
américain de contrôle export.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 3 | Marché data centers historiquement dominé par les opérateurs télécoms nationaux (Turkcell, Türk Telekom) mais dilution rapide par de nouveaux entrants étrangers (Khazna/G42 : jusqu'à 100 MW près d'Ankara ; Trendyol-Alibaba/Castle Investments : 48 MW à Ankara). Contrôle national estimé 50-65 % (estimation, transition en cours). | GlobalDataCenterHub 2026 ; Arizton 2026 ; Yahoo Finance (Turkey DC Colocation Databook) 2026 |
| IA2 | 5 | Classée Tier 2 du cadre américain « AI Diffusion Rule » (janvier 2025) : plafond de 50 000 puces IA 2025-2027, aucun accès aux Nvidia H100 ; structure maintenue de fait après l'abrogation partielle de mai 2025 (BIS). Dépendance à un fournisseur unique + contrôles renforcés. | RAND « Understanding the AI Diffusion Framework » 2025 ; Introl 2025 |
| IA3 | 6 | Capacité commerciale ~66-140 MW selon le périmètre retenu (sources divergentes) fin 2025, rapportée à ~85 M hab. : ~0,8-1,6 W/hab. Bande 0,5-2 (estimation, fourchette large assumée). | BosphorusBits (Medium) 2026-04 ; Mordor Intelligence 2026 |
| IA4 | 5 | Aucun modèle de fondation turc de rang notable identifié ; dépendance à des modèles étrangers ouverts et propriétaires, malgré les briques souveraineté/défense développées par TÜBİTAK BİLGEM et ASELSAN sur des cas d'usage militaires connexes (hors IA généraliste). | TRT World Research Centre 2026 ; estimation |
| IA5 | 3 | Aucun rival IA unique dominant projeté sur la Turquie de façon coercive ; posture de « moyenne puissance » navigant entre blocs US/Chine/UE sans alignement exclusif documenté. | SETAV / Daily Sabah « Türkiye's 2026 AI Strategy » ; TRT World Research Centre 2026 |
| IA6 | 5 | Mobilisation annoncée de 10 Md$ (majoritairement privée) sur plusieurs années pour data centers/cloud/IA, soit ~0,15-0,2 % du PIB turc (~1 200 Md$) en rythme annualisé — bande basse (estimation sur l'annualisation, pas de donnée OECD.AI dédiée). | Türkiye Today 2026 ; Bazaar Times 2026 |
| IA7 | 5 | 666 sociétés IA recensées, 934 M$ de capital-risque cumulé, mais flux trimestriel modeste (64 M$ sur 39 tours au T1 2026) ; exode de talents qualifiés turcs vers l'UE/US documenté de longue date. Densité et solde migratoire estimés en zone négative légère. | Tracxn 2026 ; KPMG Turquie « Q1 2026 Startup Investments » 2026-06 |
| IA8 | 4 | Centrale nucléaire d'Akkuyu (4,8 GW, 4 réacteurs VVER-1200) proche de la mise en service (unité 1 attendue 2026) mais tension déjà documentée sur le réseau face à la demande data centers émergente. Tension modérée. | Nuclear Business Platform 2026 ; BosphorusBits (Medium) 2026-04 |
| IA9 | 2 | Statecraft explicite et structuré : plan IA présidentiel 2026-2030 à quatre piliers (découverte, usage, production, gouvernance), discours d'Erdoğan cadrant le numérique comme « multiplicateur de force » du statecraft contemporain, TÜBİTAK BiGG transformé en fonds d'amorçage (231 investissements en 2024). L'une des postures étatiques les plus coordonnées du panel. | Türkiye Today « Erdogan launches $10 billion AI plan » 2026 ; TRT World Research Centre 2026 |

**Quanti** : (2×3 + 3×5 + 2×6 + 2×5 + 2×3 + 1×5 + 2×5 + 2×4 + 3×2) / 19 = 78/19 = **4,11**

**Quali : 4,0** — La Turquie présente la cohérence stratégique la plus nette du batch : un
doctrine explicite d'« interdépendance gérée » (indigénisation défense appliquée au numérique,
diversification des partenaires) plutôt qu'une dépendance passive. Le plafond Tier 2 sur les
puces reste une contrainte structurelle dure, mais l'État module activement son exposition — d'où
un quali légèrement inférieur au quanti brut.

**S_I = 0,60 × 4,11 + 0,40 × 4,0 = 2,47 + 1,60 = 4,07 → 4,1**

*Ancien score I (Information) : 5,7 — pour mémoire. La baisse reflète le changement de construit :
l'ancien score capturait un contrôle informationnel domestique fort ; le nouveau intègre une
ambition IA réelle mais bridée par la dépendance aux semi-conducteurs.*

---

## 8. Inde (`inde`)

**Scope** : évaluation nationale (Tamil Nadu traité séparément en zone sub-nationale, section
suivante). L'Inde est le cas le plus net de « rattrapage rapide » du panel : vivier de talent
considérable, ambition de modèle souverain concrète (Sarvam), mais dépendance totale et sans
alternative aux puces américaines.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 3 | Base installée mixte : conglomérats indiens (Reliance Jio, Adani, CtrlS, Yotta) et hyperscalers étrangers (AWS, Google, Microsoft) ; le consortium IndiaAI Mission (GPU subventionnés, 34 000 puces livrées, cible 100 000 fin 2026) est porté par des opérateurs majoritairement indiens. Contrôle national estimé 50-65 % (estimation). | NVIDIA Blog « India Fuels Its AI Mission » 2026 ; abhs.in 2026 ; Business Standard 2026-06-29 |
| IA2 | 4 | « L'Inde n'a pas de puce domestique. Sa base de calcul dépend entièrement de matériel conçu et fabriqué aux États-Unis. » Dépendance à un fournisseur quasi unique (Nvidia), sans sanction ni plafond actif après l'abrogation de la règle AI Diffusion (mai 2025) — mais l'Inde avait été classée en Tier 2 lors de son introduction, frictions documentées. | explainx.ai « India Sovereign AI Status 2026 » ; RAND 2025 |
| IA3 | 6 | Capacité installée ~1,7-2 GW fin 2026 selon les sources les plus citées (Cushman & Wakefield, Vestian) rapportée à ~1,44 Md hab. : ~1,2-1,4 W/hab, bande 0,5-2. D'autres sources (Mordor) avancent 5,45 GW (~3,8 W/hab, bande 2-5) — écart de périmètre non résolu, estimation prudente retenue. | Business Today « India data centre capacity to reach 1.7 GW » 2026 ; Angel One 2026 ; Mordor Intelligence 2026 |
| IA4 | 3 | Sarvam AI, startup pilote de la mission IndiaAI, a lancé Sarvam-30B et Sarvam-105B (février 2026) — modèles ouverts nationaux réels, mais de niche/2e rang plutôt que frontière mondiale. | abhs.in 2026 ; explainx.ai 2026 |
| IA5 | 3 | Aucun rival IA dominant projetant une coercition directe et documentée sur l'Inde ; la Chine constitue un rival régional en avance modérée sur le compute/les modèles sans posture agressive ciblée. | Estimation, cohérente avec l'absence de signal dans les sources consultées |
| IA6 | 4 | Marché IA indien ~7,8 Md$ (2025) sur un PIB ~4 000 Md$ (~0,2 %), complété par le budget public IndiaAI Mission (1,25 Md$) et une dynamique de capex privé en forte hausse — bande 0,2-0,4 % (estimation, sources de flux hétérogènes). | Ellenox « India AI Infrastructure Statistics 2026 » ; PIB « AI@Work » 2026 |
| IA7 | 4 | 2e rang mondial pour les chercheurs/inventeurs IA (50 460, derrière les seuls États-Unis), 16 % du vivier IA mondial, effectif IA/ML ~2,75 M (+55 % en un an) — volume considérable compensant en partie un exode qualifié documenté (Stanford AI Index) vers les États-Unis. | Zeki via vaidsics.com 2026 ; India Skills Report 2026 ; The Print (Stanford AI Index) 2026 |
| IA8 | 4 | ~300 GWh d'électricité propre gaspillés au T1 2026 faute de capacité de transport (goulots de transmission, délais 36-60 mois vs 18-24 mois pour la production) ; tension documentée mais pas de rationnement généralisé. Tension modérée. | IEEFA « India's power-hungry data centre sector at a crossroads » 2026 ; The Week 2026-07-06 |
| IA9 | 3 | IndiaAI Mission (compute subventionné, soutien à Sarvam), India Semiconductor Mission 2.0 (budget 2026-27) : coordination étatique réelle et volontariste, mais fragmentée entre de multiples entités et sans aucun levier sur le point d'étranglement (les puces). | PIB « Digital India » 2026 ; NVIDIA Blog 2026 |

**Quanti** : (2×3 + 3×4 + 2×6 + 2×3 + 2×3 + 1×4 + 2×4 + 2×4 + 3×3) / 19 = 71/19 = **3,74**

**Quali : 4,0** — L'Inde combine le vivier de talent le plus large du panel, une ambition de
modèle souverain déjà concrétisée (Sarvam) et une coordination étatique réelle (IndiaAI Mission),
mais reste chaînée à un fournisseur de puces unique sans alternative domestique et freinée par des
goulots d'étranglement de transport électrique qui retardent la mise en cohérence de son
compute avec ses ambitions.

**S_I = 0,60 × 3,74 + 0,40 × 4,0 = 2,24 + 1,60 = 3,84 → 3,8**

*Ancien score I (Information) : 4,5 — pour mémoire. La légère baisse reflète un profil IA plus
favorable (talent, ambition de modèle souverain) que ne le suggérait l'ancien score informationnel,
malgré une dépendance aux puces qui demeure totale.*

---

## 9. Brésil (`bresil`)

**Scope** : évaluation nationale. Le Brésil combine l'avantage énergétique le plus favorable du
batch sur le papier (mix ~88 % renouvelable) et un écosystème IA réel (premier hub de startups
d'Amérique latine), mais une dépendance totale aux semi-conducteurs et une fiabilité réseau plus
fragile que ne le suggère le chiffre de mix renouvelable.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 4 | Capacité installée ~1 030 MW (2026), dominée par la colocation (83 % des charges installées en 2025) largement portée par des opérateurs internationaux, mais avec un champion domestique réel (Scala Data Centers, fondé au Brésil). Contrôle national estimé 35-50 % (estimation). | Mordor Intelligence « Brazil Data Center Market » 2026 ; GlobeNewswire 2026-05-19 |
| IA2 | 4 | ~50 Md$ de puces importées en 2025, quasi totalité du volume ; le projet PocketFab (microfab USP, 60 M puces/an visées, premières versions attendues avril 2026) cible des chiplets de bas/moyen de gamme, non substituables aux accélérateurs IA de pointe. Dépendance à un fournisseur unique (Nvidia via import), sans restriction active documentée. | ClickPetroleoEGas 2026 ; IndexBox « Data Center Semiconductor Market in Brazil » 2026 |
| IA3 | 5 | Capacité ~1 030 MW / ~216 M hab. : ~4,8 W/hab, bande 2-5. | Mordor Intelligence 2026 |
| IA4 | 4 | Pas de modèle de fondation brésilien de rang mondial, mais un effort national de niche réel (Sabiá, Maritaca AI) ; dépendance dominante à des modèles étrangers ouverts. | Estimation, absence de couverture dans les sources consultées pour Sabiá 2026 |
| IA5 | 2 | Aucun rival IA dominant ne projette de coercition documentée sur le Brésil ; concurrence d'influence US/Chine sur les investissements plutôt qu'antagonisme direct. | Estimation |
| IA6 | 4 | Marché IA ~3 Md$ (2023) en trajectoire vers 11,6 Md$ (2030) sur un PIB ~2 100 Md$ : ratio interpolé ~0,25-0,3 % pour 2025-26, bande 0,2-0,4 % (estimation, trajectoire interpolée). | ISI Markets « Brazil's Digital Agenda » 2026 |
| IA7 | 5 | Premier hub de startups IA d'Amérique latine (~500 sociétés recensées en 2023, ~2 Md R$ levés), mais aucune couverture MacroPolo/Stanford HAI spécifique au Brésil identifiée ; densité et solde migratoire estimés modérés avec exode qualifié partiel vers l'UE/US. | Estimation, absence de couverture des trackers spécialisés |
| IA8 | 3 | Mix ~88,2 % renouvelable (hydroélectricité historique) mais fiabilité réseau sous tension réelle : 22 coupures majeures (≥100 MW) au S1 2025, un black-out national (substation en feu, Paraná) et un paradoxe de curtailment (énergie propre gaspillée faute de transport, jusqu'à 40 000 MW projetés en 2029). Équilibre offre/demande nominal mais fragile en pratique. | Rio Times « Brazil's Blackout » 2026 ; GNPW Group 2026 |
| IA9 | 3 | Plan Brésilien d'IA (PBIA, ~4 Md$ visés d'ici 2028), programme Brasil Semicon (loi 2024), Mission 4 de la Nova Indústria Brasil (186,6 Md BRL visés d'ici 2035) : coordination étatique réelle mais fragmentée entre plusieurs missions et de portée modeste rapportée à l'économie. | ABES 2026 ; gov.br/mcti PBIA 2025 ; ISI Markets 2026 |

**Quanti** : (2×4 + 3×4 + 2×5 + 2×4 + 2×2 + 1×4 + 2×5 + 2×3 + 3×3) / 19 = 71/19 = **3,74**

**Quali : 4,0** — Le Brésil affiche l'avantage énergétique le plus favorable du batch sur le
papier et un écosystème de startups dynamique, mais le récit de l'« abondance renouvelable » est
plus fragile en pratique que le chiffre de mix ne le suggère (black-out documenté, curtailment
massif faute de transport) ; la dépendance aux semi-conducteurs reste par ailleurs totale et sans
alternative de court terme malgré les premiers pas de PocketFab.

**S_I = 0,60 × 3,74 + 0,40 × 4,0 = 2,24 + 1,60 = 3,84 → 3,8**

*Ancien score I (Information) : 3,5 — pour mémoire. Légère hausse : les deux construits sont
proches en valeur par coïncidence, l'ancien reflétant un paysage médiatique relativement
pluraliste, le nouveau une dépendance IA structurelle malgré un écosystème réel.*

---

## 10. Tamil Nadu (`tamil`) — zone sub-national

**Scope** : conformément à `semplice-scope-guidelines.md` (R1-R4), le point de départ est le
score national indien (S_I = 3,8, quanti 3,74, quali 4,0) — pas une évaluation IA construite ex
nihilo. Delta régional appliqué **uniquement** là où un fait documenté justifie un écart :
Chennai concentre ~21 % de la base installée data centers indienne, accueille le premier
« Sovereign AI Park » du pays (MoU Sarvam, 13 janvier 2026) et dispose d'une politique
data centers dédiée (2021) avec incitations propres — un hub réel, pas une divergence générique.
Les indicateurs sans base factuelle de divergence (IA2 : politique douanière fédérale ; IA5 :
exposition géopolitique nationale) restent **hérités à l'identique** du national.

| Ind. | Palier | Delta vs national | Justification du delta | Sources |
|------|:------:|:------------------:|-------------------------|---------|
| IA1 | 3 | = | Même mix d'opérateurs (indiens + hyperscalers étrangers) qu'au niveau national ; pas de divergence structurelle de contrôle identifiée à l'échelle de l'État. | — |
| IA2 | 4 | = | Politique douanière/exportation fédérale, aucune divergence possible au niveau d'un État. | — |
| IA3 | 4 | −2 paliers | Chennai = ~21 % de la base installée nationale (~357-420 MW estimés sur une base nationale de 1,7-2 GW) + 134 MW ajoutés en 2026 seuls, sur une population TN ~72-77 M : ~5-6 W/hab, bande 5-10 (vs bande 0,5-2 nationale). Delta le mieux documenté de la fiche. | theprint.in « Inside Chennai's data centres » 2026 ; CRN Asia (STT GDC 45 MW) 2026 |
| IA4 | 2 | −1 palier | Le Sovereign AI Park de Chennai (MoU Sarvam, 13/01/2026) ancre physiquement dans l'État le cycle complet de la mission IA souveraine indienne (GPU dédiés, LLM indiques/tamouls) — un delta positif documenté, non générique. | Drishti IAS « Tamil Nadu to Establish India's First Sovereign AI Park » 2026 |
| IA5 | 3 | = | Exposition géopolitique régionale (rival Chine) non différenciable à l'échelle d'un État indien. | — |
| IA6 | 3 | −1 palier | Flux de capex concentrés documentés (ex. STT GDC : ₹4 200 crore soit ~500 M$ sur un seul projet) rapportés au PIB de l'État (~310 Md$, donnée `semplice-zones-config.js`) suggèrent un ratio supérieur à la moyenne nationale — estimation, base d'un seul projet extrapolée. | CRN Asia 2026 ; estimation |
| IA7 | 3 | −1 palier | Chennai, avec Bengaluru et Hyderabad, est l'un des trois pôles IT/ingénierie majeurs de l'Inde du Sud — densité de talent supérieure à la moyenne nationale (estimation qualitative, cohérente avec la concentration data centers/tech observée). | Estimation |
| IA8 | 4 | = | Politique data centers TN impose un minimum de 30 % renouvelable, mais l'État reste connecté au réseau national soumis aux mêmes goulots de transport que la moyenne indienne — pas de preuve de fiabilité matériellement différente. | Adani Connex 2026 (politique DC TN) |
| IA9 | 2 | −1 palier | MoU direct État-Sarvam pour le Sovereign AI Park, politique data centers dédiée depuis 2021 avec subventions fiscales — un État indien pilotant directement un accord IA souverain est une posture distincte de la moyenne nationale. | Drishti IAS 2026 |

**Quanti** : (2×3 + 3×4 + 2×4 + 2×2 + 2×3 + 1×3 + 2×3 + 2×4 + 3×2) / 19 = 59/19 = **3,11**

**Quali : 3,5** — Tamil Nadu bénéficie d'un effet de concentration réel (le hub Chennai, le
Sovereign AI Park, une politique d'État proactive depuis 2021) qui améliore son profil par
rapport à la moyenne nationale indienne, mais hérite intégralement de la dépendance structurelle
indienne aux semi-conducteurs (IA2, national) et des mêmes goulots de transport électrique
(IA8, réseau partagé) — aucun État ne peut s'affranchir de ces deux contraintes.

**S_I = 0,60 × 3,11 + 0,40 × 3,5 = 1,87 + 1,40 = 3,27 → 3,3**

*Vérification R4 (`semplice-scope-guidelines.md`)* : écart composite Tamil Nadu (3,3) vs Inde
nationale (3,8) = 0,5, sous le seuil de 1,5 déclenchant une justification obligatoire — l'écart
est documenté ci-dessus par prudence méthodologique, pas par obligation du protocole.

*Ancien score I (Information) : 4,0 — pour mémoire. Baisse cohérente avec la trajectoire
nationale indienne (4,5 → 3,8), Tamil Nadu divergeant légèrement plus favorablement grâce à
l'effet de hub.*

---

## 11. Arctique (`arctique`) — espace stratégique

**Scope — cas non trivial, à signaler explicitement.** La zone SEMPLICE « Arctique » est
définie dans `semplice-zones.geojson` comme Groenland + ZEE, et c'est sur cette entité que les
7 autres dimensions (S, E, M, P, L, C, Ee) sont ancrées. Le cadrage IA fourni pour ce batch
demande cependant de « scorer l'exposition de la zone » en intégrant les riverains nordiques
(Islande, Norvège, Groenland/Danemark) comme terres d'accueil de compute occidental — un
paradoxe réel (hébergement le plus favorable du monde sur le plan climatique/énergétique,
concentré sur des populations minuscules) qui casserait la cohérence inter-dimensionnelle de la
zone si les indicateurs quantitatifs étaient calculés sur la population cumulée des trois pays
(~12 M hab., dont l'essentiel hors Arctique au sens strict pour la Norvège/le Danemark
métropolitain). **Choix méthodologique retenu** : les indicateurs quantitatifs restent ancrés sur
le Groenland/Royaume du Danemark (cohérence avec les 7 autres dimensions déjà publiées) ; le
paradoxe nordique est documenté dans le qualitatif et dans IA1/IA8 (accueil régional), sans
gonfler artificiellement le score par un dénominateur démographique disproportionné. Ce choix est
documenté comme **hypothèse ouverte** dans les préoccupations de livraison — cf. rapport final.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 4 | Le Groenland lui-même n'a quasiment aucune capacité installée (un campus « échelle gigawatt » a été proposé pour Kangerlussuaq, janvier 2026 — projet annoncé, non construit) ; les capacités nordiques voisines réellement opérationnelles (AtNorth : > 200 MW Islande/Suède/Danemark ; Verne : 15 MW GPU en Islande) sont portées par des opérateurs islandais/nordiques mais capitalisés par des fonds internationaux (Apax Partners) et des hyperscalers américains (Microsoft, > 1,5 Md$ investis 2024-2025). Contrôle national/régional estimé 35-50 % (estimation, forte incertitude). | DCD « Iceland's AI data center moment » 2026 ; Environment+Energy Leader 2026 ; Greenland Energy 2026 |
| IA2 | 3 | Islande, Norvège, Danemark : statut allié de premier rang (anciens Tier 1 du cadre AI Diffusion, OTAN/UE), accès aux puces sans restriction mais sans production domestique — fournisseurs alliés diversifiés. | RAND 2025 (référence Tier 1) ; estimation |
| IA3 | 4 | Capacité data centers nordique documentée dépasse 200 MW (AtNorth) sur une population de la zone stricte (Groenland ~57k hab.) quasi nulle pour le compute réel ; la capacité groenlandaise propre est proche de zéro hors le projet pitché de Kangerlussuaq. Estimation prudente à cheval sur les bandes 5-10 et 10-25 selon le périmètre retenu — fourchette large assumée. | Greenland Energy 2026 ; DCD 2026 |
| IA4 | 5 | Aucun modèle de fondation groenlandais, islandais ou norvégien de rang notable ; dépendance totale aux modèles étrangers propriétaires (accès commercial non restreint). | Estimation |
| IA5 | 6 | La puissance dominante qui exerce une pression coercitive sur la zone est, de façon inhabituelle, un allié nominal (OTAN) : campagne de pression documentée des États-Unis sur la souveraineté même du Groenland (menaces tarifaires jusqu'à 25 % contre le Danemark et alliés nordiques, rhétorique d'annexion, « no going back » — janvier 2026), qualifiée par l'OTAN elle-même de facteur déstabilisant dans une région où « Chinois et Russes sont de plus en plus actifs » (Rutte). Illustration extrême, non technologique, de la révocabilité unilatérale documentée ailleurs via Fable 5. | ArcticToday 2026-01 ; Al Jazeera 2026-01-21 ; IISS « The Donroe Doctrine reaches the Arctic » 2026-01 |
| IA6 | 5 | Aucune donnée OECD.AI/Dealroom dédiée au Groenland ; les flux massifs d'investissement (Microsoft 1,5 Md$, AtNorth 300 MW pipeline) financent de l'infrastructure d'accueil plutôt qu'un écosystème IA domestique au sens de l'indicateur — bande basse retenue par prudence (estimation). | Environment+Energy Leader 2026 |
| IA7 | 5 | Aucune couverture MacroPolo/Stanford HAI spécifique au Groenland/Islande ; population minuscule limitant tout volume de recherche IA notable malgré des économies prospères — solde migratoire estimé légèrement négatif vers les hubs IA continentaux. | Estimation |
| IA8 | 1 | Avantage structurel le plus net du batch : froid ambiant + hydroélectricité/géothermie abondante et bon marché, PUE nordique de 1,10-1,15 (vs ~1,5-2 en climat tempéré), explicitement cité comme moteur de la ruée vers l'Arctique des opérateurs IA. Excédent + prix bas. | DCD 2026 ; TechBuzz.ai « AI Labs Push Data Centers to Arctic Circle » 2026 ; Datacenter Knowledge 2026 |
| IA9 | 5 | Le Groenland (gouvernement autonome, Naalakkersuisut) dispose de leviers marginaux sur sa propre trajectoire numérique dans le contexte actuel de pression américaine sur sa souveraineté même ; l'Islande et la Norvège sont structurellement des hôtes/loueurs d'infrastructure plutôt que des orchestrateurs de champions nationaux. | ArcticToday 2026-01 ; estimation |

**Quanti** : (2×4 + 3×3 + 2×4 + 2×5 + 2×6 + 1×5 + 2×5 + 2×1 + 3×5) / 19 = 79/19 = **4,16**

**Quali : 5,0** — La zone concentre le paradoxe IA le plus aigu du panel : l'avantage
énergétique/climatique est réel et documenté (IA8 = 1, le meilleur score du batch), mais il
profite d'abord à des opérateurs et hyperscalers étrangers, tandis que le Groenland — l'entité
politique au cœur de la zone SEMPLICE — n'a quasiment aucune capacité propre et voit sa
souveraineté même contestée par la puissance qui domine par ailleurs son écosystème compute
régional. Le quali est relevé nettement au-dessus du quanti pour capturer ce risque de
contingence géopolitique (campagne de pression américaine active) qu'aucun palier statique ne
capture correctement.

**S_I = 0,60 × 4,16 + 0,40 × 5,0 = 2,50 + 2,00 = 4,50 → 4,5**

*Ancien score I (Information) : 3,1 — pour mémoire. Hausse marquée, illustrant la rupture de
série dans un sens inhabituel : un environnement informationnel ouvert et peu contrôlé (ancien
construit, score bas) coexiste avec une exposition IA structurelle inédite — dépendance
d'infrastructure conjuguée à une menace active sur la souveraineté politique de la zone.*

---

## 12. Île Maurice (`ile-maurice`)

**Scope** : évaluation nationale, micro-État insulaire. Cadrage explicite : « statecraft limité
par la taille » — Maurice articule une ambition numérique réelle et concrète (SEZ de Côte d'Or,
premier pilier budgétaire dédié à l'IA) mais ne dispose d'aucun levier sur les couches structurelles
(puces, modèles, compute) et son réseau électrique reste sous tension documentée malgré une
trajectoire renouvelable active.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 4 | Base de données centers naissante, portée principalement par Mauritius Telecom (opérateur historique à participation étatique, feuille de route de 434 M$ sur 3 ans incluant un « corridor IA/compute » avec clusters GPU et extension Tier IV). Contrôle national estimé 35-50 % via l'opérateur semi-public (estimation, base encore embryonnaire). | Techpoint Africa « Mauritius Telecom's Cloud Transformation » 2026 |
| IA2 | 3 | Aucune production domestique, mais aucune restriction ni sanction visant Maurice — accès de marché ouvert et diversifié (petite économie insérée dans le commerce mondial sans contrainte export control documentée). | Estimation |
| IA3 | 6 | Un rapport sectoriel titre explicitement « Why Mauritius Isn't Ready for Major Data Centre Infrastructure » — base installée actuelle très faible malgré une population minuscule (~1,26 M hab.) qui aurait pu, en théorie, gonfler un ratio W/hab ; l'absence de données MW publiées confirme un stade pré-échelle. Bande 0,5-2 (estimation). | Bramston & Associates 2026 |
| IA4 | 5 | Aucun modèle de fondation mauricien ; dépendance commerciale non restreinte à des modèles étrangers propriétaires. | Estimation |
| IA5 | 2 | Aucun rival IA dominant ne projette de coercition documentée sur Maurice ; concurrence d'influence Inde/Chine/France présente mais non antagoniste sur le plan IA. | Estimation |
| IA6 | 6 | Budget national 2026-27 : 25 M MUR (~523 000 $) alloués à une plateforme nationale d'apprentissage IA et au soutien aux startups IA — ratio < 0,01 % du PIB (~14,8 Md$) pour cette ligne dédiée. La feuille de route Côte d'Or/Mauritius Telecom (~530-434 M$ cumulés sur 3 ans) relève davantage de l'infrastructure numérique générale que de l'« investissement IA » au sens strict de l'indicateur — écart documenté, bande 0,03-0,1 % retenue par prudence plutôt que la ligne budgétaire brute. | EDB Mauritius « Budget 2025-2026: AI » ; Africa AI News 2026 |
| IA7 | 6 | Aucune couverture MacroPolo/Stanford HAI ; vivier bilingue (français/anglais) éduqué mais population minuscule, exode qualifié modéré vers l'UE/Afrique du Sud documenté de longue date pour les profils tech. | Estimation |
| IA8 | 5 | Tension réseau documentée (« Grid Strain Prompts Call for Power Conservation », marge de sécurité qualifiée de « mince ») malgré une trajectoire active (pipeline renouvelable + stockage de 405 MW sur 3 ans, 40 MW de BESS déjà installés, 20 MW supplémentaires attendus juillet 2026). Tension forte actuelle, trajectoire d'amélioration. | African Security Analysis « Mauritius: Grid Strain » 2026 ; TaiyangNews 2026 |
| IA9 | 4 | Architecture politique concrète pour un micro-État : SEZ de Côte d'Or (propriété étrangère à 100 %, tarif électrique dédié, récupération TVA, permis accélérés), IA nommée premier des sept piliers stratégiques du budget 2026-27 — leviers réels mais nécessairement partiels compte tenu de l'absence de toute capacité de production ou de financement à l'échelle des enjeux (puces, modèles). | Lawyard.org 2026 ; Ecofin Agency 2026 |

**Quanti** : (2×4 + 3×3 + 2×6 + 2×5 + 2×2 + 1×6 + 2×6 + 2×5 + 3×4) / 19 = 83/19 = **4,37**

**Quali : 4,5** — Maurice articule une ambition numérique authentique et bien conçue pour sa
taille (SEZ dédiée, priorité budgétaire explicite), mais reste structurellement dépendante sur
toute la chaîne IA sans aucune capacité de production propre, avec un réseau électrique en tension
réelle malgré une trajectoire renouvelable active. Le plafond n'est pas un manque de volonté
politique mais un plafond de taille : aucun micro-État de 1,3 M habitants ne peut construire de
souveraineté IA au sens plein de la grille.

**S_I = 0,60 × 4,37 + 0,40 × 4,5 = 2,62 + 1,80 = 4,42 → 4,4**

*Ancien score I (Information) : 2,4 — pour mémoire. Forte hausse, rupture de série dans le sens
attendu : un environnement médiatique pluraliste de petit État ouvert (ancien construit, score
très bas) coexiste avec une dépendance IA structurelle profonde (nouveau construit) — l'inverse
exact du cas chinois du batch 1.*

---

## 13. Singapour (`singapour`)

**Scope** : évaluation nationale, cité-État. Singapour est le cas de gestion la plus aboutie du
panel : un hub compute majeur d'Asie du Sud-Est, un accès aux puces avancées privilégié malgré les
contrôles américains (au prix d'un scandale de contournement documenté), et un statecraft central
piloté au niveau du Premier ministre — mais aucune souveraineté sur les couches structurelles
(chips, modèles) et une contrainte foncière/énergétique réelle sur une île dense.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 4 | Capacité opérationnelle ~1,4 GW, extension via DC-CFA2 (+200 MW, appel décembre 2025) et projet Jurong Island (jusqu'à 700 MW). Base d'opérateurs mixte : hyperscalers étrangers (Google, Microsoft, AWS, Equinix, Digital Realty) dominants en volume, mais opérateurs nationaux réels et significatifs (ST Telemedia Global Data Centres — Temasek —, Keppel Data Centres) et allocation foncière strictement contrôlée par l'État (EDB/IMDA). Contrôle national estimé 35-50 % (estimation). | Structure Research 2026-06-16 ; Morgan Lewis (DC-CFA2) 2026-03 ; Introl 2026 |
| IA2 | 3 | Accès de facto privilégié aux puces avancées malgré les contrôles américains (statut de hub régional pour Nvidia/hyperscalers) ; mais un scandale de contournement documenté (saisie d'un manoir de 42 M$, quatre personnes inculpées, serveurs Dell/Supermicro/Asus détournés vers la Chine via Singapour, 2025-2026) illustre la fragilité de ce statut et le risque de durcissement futur des contrôles américains. Fournisseurs alliés diversifiés, sans production nationale. | Tom's Hardware 2026 ; TechSpot 2026 ; Fortune 2026-05-13 |
| IA3 | 1 | Capacité ~1,4 GW / ~6,04 M hab. : environ 230 W/hab, très au-dessus du seuil haut de la grille (> 40 W/hab), même avant les extensions DC-CFA2 et Jurong Island. | Structure Research 2026-06-16 |
| IA4 | 3 | Aucun modèle de fondation frontière singapourien, mais un effort national réel de niche : SEA-LION (AI Singapore), famille de modèles ouverts multilingues dédiés à l'Asie du Sud-Est — modèle national compétitif de 2e rang régional plutôt que dépendance pure. | worldngayon.com « Singapore AI Infrastructure 2026 » ; estimation sur le positionnement SEA-LION |
| IA5 | 2 | Aucun rival IA dominant ne projette de coercition documentée sur Singapour ; la cité-État navigue activement entre blocs US/Chine sans alignement exclusif, la présence chinoise (dont le scandale de contournement révèle la profondeur) constituant un rival présent mais non dominant. | Tom's Hardware 2026 ; estimation |
| IA6 | 2 | S$1 Md+ sur 5 ans (NAIRD, 2025-2030) + S$500 M+ (NAIS 2.0) + investissements hyperscalers massifs sur le territoire (Microsoft 5,5 Md$ jusqu'en 2029, soit ~1,1 Md$/an) + RIE 37 Md$ (2025-2030, R&D large incluant l'IA) : flux cumulés plausibles > 1 % du PIB (~397-530 Md$ selon la base retenue). | MDDI (NAIRD) 2026 ; littlebigreddot.com (Microsoft) 2026 ; edb.gov.sg (RIE) 2026 |
| IA7 | 1 | 2e rang mondial pour la densité de chercheurs/développeurs IA (109,5/100k hab., juste derrière la Suisse à 110,5), 1er rang mondial pour la part d'offres d'emploi mentionnant des compétences IA (4,7 %) — solde net positif (pôle d'attraction régional). | Stanford HAI AI Index 2026 ; startupticker.ch 2026 |
| IA8 | 4 | Île dense et sans ressources énergétiques propres, historiquement contrainte (moratorium sur les nouveaux data centers 2019-2022) ; réouverture conditionnée à des exigences vertes strictes (DC-CFA2 : ≥ 50 % renouvelable, meilleure performance énergétique de classe), dépendance structurelle au gaz importé. Tension modérée gérée activement plutôt que crise. | Introl 2026 ; Morgan Lewis 2026-03 |
| IA9 | 2 | Conseil national de l'IA présidé par le Premier ministre Lawrence Wong, coordination interministérielle explicite (recherche, régulation, talent, adoption), allocation foncière des data centers pilotée par appels d'offres étatiques (DC-CFA) — statecraft parmi les plus centralisés et cohérents du panel, seul le verrou structurel des puces/modèles échappant au contrôle de l'État. | dollarsandsense.sg (Budget 2026) ; smartnation.gov.sg |

**Quanti** : (2×4 + 3×3 + 2×1 + 2×3 + 2×2 + 1×2 + 2×1 + 2×4 + 3×2) / 19 = 47/19 = **2,47**

**Quali : 2,5** — Singapour est le cas de statecraft le plus abouti du panel : contrôle étatique
serré de l'allocation foncière et énergétique, attraction nette de talent mondial, capacité
installée par habitant hors norme, et un modèle régional réel (SEA-LION). L'unique fragilité
structurelle — l'absence de toute production de puces ou de modèle frontière propre, et le
scandale de contournement qui rappelle que le statut de hub privilégié reste à la merci d'un
durcissement américain — maintient le score au-dessus de zéro sans l'alourdir.

**S_I = 0,60 × 2,47 + 0,40 × 2,5 = 1,48 + 1,00 = 2,48 → 2,5**

*Ancien score I (Information) : 3,2 — pour mémoire. Légère baisse : contrairement à la majorité
des zones du panel, Singapour ne connaît pas de rupture de série marquée — un environnement
informationnel déjà relativement ouvert (ancien construit) coexiste avec une gestion tout aussi
maîtrisée de la dépendance IA (nouveau construit). C'est, avec la Chine (en sens inverse), l'un
des deux seuls scores sous 3,5 du panel des 18 zones — mais par des voies opposées : gestion de
hub ouvert ici, autonomie souveraine sous embargo côté chinois.*

---

## 14. République tchèque (`republique-tcheque`)

**Scope** : évaluation nationale, membre UE/OTAN. La République tchèque illustre le cas de la
« dépendance douce intra-alliance » : accès au compute européen (EuroHPC, Karolina/KarolAIna),
écosystème IA réel mais modeste (Prague/Brno), socle énergétique nucléaire solide — sans les
frictions Tier 2 subies par la Turquie ni l'isolement des zones sous sanctions.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 3 | Marché data centers commercial modeste (~153-158 MW en 2025-2026) porté majoritairement par des opérateurs domestiques et de colocation régionale, complété par le supercalculateur national IT4Innovations (Karolina, opéré par l'État/EuroHPC). Contrôle national estimé 50-65 % (estimation, marché de colocation internationale encore limité). | Mordor Intelligence « Czechia Data Center Market » 2026 ; IT4Innovations (Karolina) |
| IA2 | 3 | Aucune production nationale de puces IA de pointe, mais accès de marché non restreint via le cadre européen (aucune sanction, aucun statut Tier 2 documenté) — fournisseurs alliés diversifiés, dépendance encadrée par l'appartenance UE/OTAN plutôt que par un régime bilatéral de licences. | RAND « AI Diffusion Framework » 2025 (référence de cadrage) ; estimation |
| IA3 | 3 | Capacité commerciale ~153-158 MW (2026) complétée par KarolAIna (~340 puces IA dédiées, 850 PFlop/s) sur ~10,9 M hab. : ~14-15 W/hab, bande 10-25. | Mordor Intelligence 2026 ; IT4Innovations « KarolAIna » 2026-05 |
| IA4 | 5 | Aucun modèle de fondation tchèque de rang notable identifié ; le Czech AI Factory (lancé mai 2026, campus Prague/Brno) développe des « services IA » et un écosystème d'application plutôt qu'un modèle propre — dépendance à des modèles étrangers ouverts. | it4i.cz (Czech AI Factory) 2026-05 ; estimation |
| IA5 | 2 | Aucun rival IA dominant ne projette de coercition documentée sur la République tchèque ; membre UE/OTAN sans exposition directe à une pression technologique adverse. | Estimation |
| IA6 | 5 | Czech AI Factory : budget total ~40 M€ (CZK 1 Md, moitié EuroHPC / moitié national) ; Stratégie nationale des semi-conducteurs (objectif triplement de la production d'ici 2029, 9 000 spécialistes) engage des montants plus larges mais orientés production plutôt qu'IA au sens strict. Rapporté au PIB (~330 Md$, donnée de configuration) : bande basse 0,1-0,2 % (estimation, écosystème réel mais « petit » selon le cadrage). | it4i.cz 2026-05 ; mpo.gov.cz (Stratégie nationale semi-conducteurs) |
| IA7 | 4 | Pôle technologique réel (Prague CTU/CIIRC, région de Brno en forte croissance liée aux semi-conducteurs), mais aucune couverture MacroPolo/Stanford HAI spécifique ; densité de chercheurs IA modérée, solde migratoire proche de l'équilibre dans le cadre de la libre circulation UE (estimation). | brnotechregion.eu 2026 ; estimation |
| IA8 | 2 | Parc nucléaire solide (6 réacteurs, 32 TWh/an), extension de Dukovany à 2048 MWe (février 2026), nouveaux réacteurs Dukovany 5&6 en développement, cible de 68 % nucléaire d'ici 2040 — excédent structurel et prix modérés pour l'Europe centrale. | World Nuclear News 2026 ; NucNet 2026-04-05 |
| IA9 | 4 | Stratégie nationale des semi-conducteurs adoptée (octobre 2024), Czech AI Factory cofinancé EuroHPC/national, mais coordination explicitement intégrée au cadre européen plutôt que portée par une doctrine nationale autonome — leviers partiels, réels mais modestes à l'échelle du pays. | mpo.gov.cz 2026 ; it4i.cz 2026-05 |

**Quanti** : (2×3 + 3×3 + 2×3 + 2×5 + 2×2 + 1×5 + 2×4 + 2×2 + 3×4) / 19 = 64/19 = **3,37**

**Quali : 3,5** — La République tchèque combine un accès au compute et aux puces sans friction
particulière (cadre UE, aucun statut restrictif à la turque), un socle énergétique nucléaire
parmi les plus solides du panel, et un écosystème IA réel à Prague/Brno — mais reste, comme
l'indique le cadrage, une « dépendance douce » : aucune capacité de production propre, aucun
modèle national, une coordination étatique intégrée à l'échelon européen plutôt que souveraine.

**S_I = 0,60 × 3,37 + 0,40 × 3,5 = 2,02 + 1,40 = 3,42 → 3,4**

*Ancien score I (Information) : 1,6 — pour mémoire. Forte hausse (+1,8), l'une des plus marquées
du panel : un environnement médiatique pluraliste de démocratie européenne (ancien construit,
score très bas) coexiste avec une dépendance IA structurelle réelle bien que non conflictuelle
(nouveau construit) — le même schéma que l'Île Maurice et l'Arctique au batch 2, ici sans aucune
composante d'isolement ou de pression géopolitique.*

---

## 15. Iran (`iran`)

**Scope** : évaluation nationale. Iran cumule l'embargo technologique le plus dur du panel après
Cuba et une crise énergétique aiguë (aggravée par les dégâts de guerre sur le réseau), mais
conserve — à la différence de Cuba — une capacité résiduelle réelle et un statecraft actif :
plateforme IA nationale (Rakhsh AI), feuille de route « top 10 IA mondiale d'ici 2032 », projet de
puces domestiques Sahand. Le cadrage impose de distinguer cette capacité résiduelle de la
dépendance/isolement plutôt que de réduire la zone à un simple palier 7 générique.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 3 | Lecture littérale de l'indicateur, même paradoxe que Cuba : l'embargo total exclut de facto tout hyperscaler occidental, laissant la (faible) capacité existante quasi entièrement étatique/domestique. Contrôle national élevé par défaut — mesure le contrôle, pas la puissance (capturée par IA3/IA6). Estimation, paradoxe assumé. | OFAC (référence sanctions) ; estimation |
| IA2 | 7 | « Les puces IA avancées sont officiellement interdites à l'Iran en raison des sanctions » ; dépendance à des puces de contrebande et solutions de second rang, écart documenté avec les monarchies du Golfe qui accèdent directement à des systèmes de classe Blackwell. Palier 7 de la grille (type retrait Fable 5, régime permanent). | ts2.tech 2025-06-30 ; recordedfuture.com 2026 |
| IA3 | 7 | Aucun data center GPU domestique opérationnel à ce stade (le projet Sahand visait une ouverture « début 2025 », retardée) ; capacité négligeable rapportée à ~92 M hab., < 0,5 W/hab sans ambiguïté. | recordedfuture.com 2026 ; aibusiness.com 2026 |
| IA4 | 3 | Rakhsh AI (chatbot en farsi, génération d'images, optimisé pour l'internet domestique iranien) et plateforme IA nationale annoncée pleinement opérationnelle en 2026 — capacité de niche réelle et documentée, distinguant l'Iran des zones sans aucun produit IA fonctionnel (Sahel, Madagascar). Modèle national de niche. | thenationalnews.com 2025-12-05 ; ts2.tech 2025-06-30 |
| IA5 | 6 | Pression américaine maximale et documentée (sanctions renforcées, menaces de destruction d'infrastructures technologiques formulées par l'Iran lui-même contre 17 entreprises tech US) ; dégâts de guerre directs sur le réseau électrique (40 jours de conflit, 2 000+ points endommagés, -4 200 MW) — rival dominant + posture agressive, sans preuve d'« IA offensive » spécifiquement dirigée contre l'Iran (d'où 6 et non 7). | Tom's Hardware 2026 ; middleeastmonitor.com 2026-06-25 |
| IA6 | 6 | 215 M$ de financement R&D alloué pour 2025, cible cumulée de 8 Md$ d'ici 2032 — sur un PIB ~388 Md$ (donnée de configuration), le flux actuel représente ~0,055 %, bande basse 0,03-0,1 %. | aibusiness.com 2026 ; recordedfuture.com 2026 |
| IA7 | 6 | Base éducative scientifique/ingénierie historiquement solide, mais exode qualifié massif et documenté depuis la crise économique et les mouvements de 2022 — densité résiduelle faible avec exode modéré à sévère (estimation, cohérente avec l'absence de couverture MacroPolo dédiée). | Estimation, cohérente avec le contexte documenté de fuite des cerveaux |
| IA8 | 6 | Rationnement électrique planifié (préavis 48h) depuis mai 2026, déficit de production estimé entre 10 000 et 18 000 MW pour l'été 2026, aggravé par les dégâts de guerre sur le réseau (-4 200 MW) — tension critique avec rationnement organisé, sans effondrement total généralisé comme à Cuba (d'où 6 et non 7). | voiceofemirates.com 2026-07-13 ; iranintl.com 2025-03 ; middleeastmonitor.com 2026-06-25 |
| IA9 | 3 | Feuille de route nationale IA ratifiée (mai 2025, objectif top-10 mondial d'ici 2032, 12 % du PIB, 45 % d'intégration industrielle), Organisation nationale de l'IA sous la présidence, projet Sahand (puces domestiques 9N), 215 M$ de R&D dédiés — coordination étatique réelle et volontariste, plafonnée par l'absence de toute capacité de production effective. Leviers significatifs, non complets. | aibusiness.com 2026 ; recordedfuture.com « Iran's AI Ambitions » 2026 |

**Quanti** : (2×3 + 3×7 + 2×7 + 2×3 + 2×6 + 1×6 + 2×6 + 2×6 + 3×3) / 19 = 98/19 = **5,16**

**Quali : 5,0** — Iran combine l'embargo technologique le plus dur du panel (hors Cuba) avec une
crise énergétique aiguë directement aggravée par la guerre, mais conserve — à la différence de
Cuba ou du Sahel — une capacité résiduelle réelle (Rakhsh AI, Sahand) et un statecraft
volontariste et documenté (feuille de route ratifiée, organisation dédiée). Le quali est
légèrement inférieur au quanti pour refléter cette nuance explicitement demandée par le cadrage :
la dépendance est structurelle, mais elle n'est pas synonyme d'absence de capacité.

**S_I = 0,60 × 5,16 + 0,40 × 5,0 = 3,10 + 2,00 = 5,10 → 5,1**

*Ancien score I (Information) : 5,9 — pour mémoire. Légère baisse : l'ancien construit capturait
un contrôle informationnel domestique quasi total (score très élevé) ; le nouveau intègre une
capacité IA réelle bien que bridée par l'embargo et l'effondrement énergétique — d'où un score
élevé mais inférieur à Cuba/Sahel, qui n'ont ni programme national documenté ni statecraft
comparable.*

---

## 16. Mexique (`mexique`)

**Scope** : évaluation nationale. Le Mexique est le cas le plus net de dépendance « à double
tranchant » du panel : le nearshoring fait de Querétaro l'un des marchés data centers les plus
dynamiques d'Amérique latine, mais cette capacité est financée et possédée presque entièrement
par des acteurs américains, sur un réseau électrique déjà identifié comme le goulot d'étranglement
stratégique de l'ambition IA du pays — sans stratégie IA fédérale aboutie à ce stade.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 6 | ~73 % de la capacité installée mexicaine concentrée à Querétaro, portée quasi exclusivement par des investisseurs américains (CloudHQ 4,8 Md$, AWS/Microsoft/Google 6,3 Md$ combinés) ; participation domestique marginale (utilities locales, foncier). Contrôle national estimé 8-20 % (estimation). | mexicobusiness.news (MEXDC, 82,5 Md$) 2026 ; White & Case 2026 |
| IA2 | 4 | Aucune production nationale de puces IA ; dépendance à un fournisseur quasi unique (chaîne d'approvisionnement américaine via l'USMCA), sans sanction ni contrôle export actif — accès facilité par le statut de partenaire nearshoring plutôt que contraint par un régime de licences. | moderndiplomacy.eu 2025-11-29 ; estimation |
| IA3 | 5 | Le marché mexicain est explicitement décrit comme incapable de soutenir des opérations « à l'échelle IA » (seuil de référence > 250 MW dédiés) ; capacité nationale actuelle estimée dans la fourchette basse des standards régionaux latino-américains rapportée à ~130 M hab. : bande 2-5 W/hab (estimation, absence de chiffre MW national consolidé dans les sources). | mexicobusiness.news (Querétaro) 2026 ; riotimesonline.com 2026 |
| IA4 | 5 | Aucun modèle de fondation mexicain identifié ; Coatlicue (supercalculateur public, 314 PFlop/s, 14 480 GPU) est une infrastructure de calcul mise à disposition des chercheurs, pas encore un modèle propre livré — dépendance à des modèles étrangers propriétaires. | latintimes.com (Coatlicue) 2026 ; sciencealert.com 2026 |
| IA5 | 1 | Aucun rival IA dominant ne projette de coercition sur le Mexique ; les États-Unis sont un partenaire USMCA structurant (asymétrie de dépendance capturée par IA1/IA2/IA9), non un rival adverse au sens de cet indicateur. | Estimation |
| IA6 | 3 | Coatlicue : 327 M$ (investissement ponctuel) ; pipeline data centers 82,5 Md$ sur 2026-2031 (~13,75 Md$/an, majoritairement capex privé étranger mêlant IA et cloud générique) ; part attribuable à l'IA au sens strict estimée bande 0,4-0,8 % du PIB (~1 790 Md$, donnée de configuration), estimation prudente cohérente avec le traitement du Brésil au batch 2. | mexicobusiness.news (MEXDC) 2026 ; latintimes.com 2026 |
| IA7 | 5 | Accord de formation avec le C-DAC indien pour développer une main-d'œuvre spécialisée (signal de déficit domestique de compétences HPC/IA) ; Coatlicue explicitement positionné pour « prévenir la fuite des cerveaux » — base scientifique réelle mais exode structurel documenté vers les États-Unis. Solde négatif léger. | latintimes.com 2026 ; aztecreports.com 2026 |
| IA8 | 5 | « Le réseau national comme frein silencieux » : la capacité, qualité et fiabilité du réseau de transmission de la CFE sont explicitement identifiées comme la contrainte stratégique majeure de l'ambition IA/semi-conducteurs mexicaine ; instabilité du réseau et pénuries d'eau documentées à Querétaro du fait du boom des data centers lui-même. Tension forte. | moderndiplomacy.eu 2025-11-29 ; mexicobusiness.news (Querétaro) 2026 |
| IA9 | 4 | Plan México 2025-2030 positionne la technologie comme axe stratégique de souveraineté scientifique, Coatlicue et consolidation des projets semi-conducteurs sous l'agenda de souveraineté technologique — mais aucune stratégie IA fédérale aboutie à ce stade (cadrage), coordination réelle mais encore partielle. | mexicobusiness.news (Plan México) 2026 ; datagovhub.elliott.gwu.edu 2026 |

**Quanti** : (2×6 + 3×4 + 2×5 + 2×5 + 2×1 + 1×3 + 2×5 + 2×5 + 3×4) / 19 = 81/19 = **4,26**

**Quali : 4,5** — Le Mexique illustre le cas le plus pur de dépendance à double tranchant du
panel : le nearshoring apporte un volume d'investissement considérable et un accès facilité au
compute et aux puces via l'intégration USMCA, mais cette capacité est à plus de 70 % étrangère,
sur un réseau électrique déjà identifié par les analystes comme le goulot d'étranglement
stratégique — et sans stratégie IA fédérale aboutie capable d'orienter cette dynamique. Le quali
est relevé au-dessus du quanti pour capturer le risque de levier américain latent (accès
actuellement ouvert, mais structurellement révocable, écho du précédent Fable 5).

**S_I = 0,60 × 4,26 + 0,40 × 4,5 = 2,56 + 1,80 = 4,36 → 4,4**

*Ancien score I (Information) : 3,3 — pour mémoire. Hausse marquée (+1,1) : un paysage médiatique
relativement pluraliste (ancien construit) coexiste avec une dépendance IA structurelle nouvelle,
portée par un nearshoring dont le Mexique capte les retombées d'investissement sans en détenir la
souveraineté.*

---

## 17. Vietnam (`vietnam`)

**Scope** : évaluation nationale. Le Vietnam est le profil de « rattrapage actif » le plus
documenté du batch : partenariat NVIDIA structurant (centre R&D + data center IA, MoU
décembre 2024, croissance ~90 % de l'activité du centre entre 2025 et 2026), stratégie
semi-conducteurs volontariste (formation, empaquetage, objectifs de fabs), mais un réseau
électrique à dominante charbon déjà sous tension saisonnière — tension que l'expansion des data
centers et de l'IA elle-même contribue à aggraver.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 4 | Le data center IA prévu dans le MoU NVIDIA-gouvernement (décembre 2024) est un partenariat, pas une propriété domestique pleine ; les opérateurs télécoms nationaux (Viettel, VNPT) détiennent une base réelle mais le marché commercial reste jeune. Contrôle national estimé 35-50 % (estimation, transition en cours comparable à la Turquie). | mpi.gov.vn 2024-12 ; technode.global 2026-06-30 |
| IA2 | 4 | Aucune production nationale de puces IA de pointe ; dépendance à un fournisseur quasi unique (Nvidia) sans statut de restriction documenté après l'abrogation de la règle AI Diffusion (mai 2025), mais sans production domestique alternative. Dépendance à un fournisseur unique. | technode.global 2026-06-30 ; RAND 2025 (référence de cadrage) |
| IA3 | 6 | Marché data centers commercial encore modeste par rapport à la population (~100 M hab.), en phase de démarrage malgré le partenariat NVIDIA ; bande basse 0,5-2 W/hab (estimation, absence de chiffre national consolidé publié). | technode.global 2026-06-30 ; b-company.jp (Q1 2026) 2026 |
| IA4 | 4 | Modèle de langue vietnamien construit sur la plateforme NeMo de Nvidia, classé 1er du classement VMLU — capacité réelle mais construite sur une infrastructure et un cadre logiciel étrangers plutôt que souveraine ; dépendance à des modèles ouverts étrangers pour l'essentiel de la pile. | nvidianews.nvidia.com 2026 ; technode.global 2026-06-30 |
| IA5 | 3 | La Chine constitue un rival régional en avance modérée sur le compute/les modèles (tensions plus larges en mer de Chine méridionale) sans coercition IA documentée dirigée spécifiquement contre le Vietnam. | Estimation, cohérente avec le traitement Turquie/Inde du batch 2 |
| IA6 | 4 | Samsung 1,5 Md$ (installation de test dédiée, mai 2026), FPT (usine d'empaquetage/test), objectif de formation 50 000 ingénieurs semi-conducteurs d'ici 2030 — flux réels mais rapportés au PIB (~430 Md$, donnée de configuration) restent dans la bande 0,2-0,4 % (estimation, agrégation hétérogène des annonces). | fptsoftware.com 2026 ; masvn.com (FDI semiconducteurs) 2026 |
| IA7 | 4 | Vivier d'ingénieurs STEM explicitement cité par Nvidia comme motivation de l'implantation du centre R&D ; centre VRDC en croissance ~90 % (2025-2026), contribution directe à des programmes stratégiques Nvidia globaux — dynamique positive mais densité et solde encore modérés à l'échelle nationale (estimation). | nvidianews.nvidia.com 2026 ; technode.global 2026-06-30 |
| IA8 | 5 | Charbon = 59 % du mix électrique, demande en croissance 12-15 %/an, risques de pénurie en saison sèche 2026 explicitement anticipés par l'opérateur national EVN, data centers et expansion de l'IA cités comme facteurs de pression parmi les principaux moteurs de la demande. Tension forte, avec plans de contingence actifs. | vietnamplus.vn (EVN, contingence 2026) 2026 ; powergenadvancement.com 2026 |
| IA9 | 3 | MoU direct gouvernement-Nvidia (ministère du Plan et de l'Investissement), loi IA contraignante (première d'Asie du Sud-Est selon les sources consultées), stratégie semi-conducteurs par phases (100 sociétés de conception, 1 fab, 10 usines d'empaquetage/test visées d'ici 2030) — coordination étatique réelle et volontariste. | mpi.gov.vn 2024-12 ; worldngayon.com (loi IA) 2026 |

**Quanti** : (2×4 + 3×4 + 2×6 + 2×4 + 2×3 + 1×4 + 2×4 + 2×5 + 3×3) / 19 = 77/19 = **4,05**

**Quali : 4,0** — Le Vietnam présente la trajectoire de rattrapage la plus crédible du batch : un
partenariat NVIDIA structurant qui produit déjà un résultat concret (modèle en langue
vietnamienne classé 1er du VMLU), une stratégie semi-conducteurs par étapes avec objectifs de
formation chiffrés, et une loi IA contraignante — mais une dépendance totale aux infrastructures
et puces étrangères, sur un réseau électrique à dominante charbon déjà sous tension saisonnière
que la croissance de l'IA elle-même contribue à aggraver.

**S_I = 0,60 × 4,05 + 0,40 × 4,0 = 2,43 + 1,60 = 4,03 → 4,0**

*Ancien score I (Information) : 5,5 — pour mémoire. Forte baisse (-1,5) : l'ancien construit
capturait un contrôle informationnel domestique élevé ; le nouveau intègre une dynamique de
rattrapage IA réelle et documentée (partenariat NVIDIA, loi IA, stratégie semi-conducteurs) qui
place le Vietnam dans la même fourchette que la Turquie — le profil de « rattrapage géré » de
référence pour ce batch.*

---

## 18. Éthiopie (`ethiopie`)

**Scope** : évaluation nationale. L'Éthiopie combine l'avantage énergétique le plus singulier du
panel — le barrage GERD (5 GW, mis en service septembre 2025, doublant la capacité de génération
nationale) — avec une dépendance IA structurelle sur toutes les autres couches. Conformément au
cadrage, l'« usine IA à 1 Md$ » annoncée est scorée avec prudence : le financement repose
largement sur des engagements externes non confirmés (dont un pledge panafricain émirati) plutôt
que sur du capital domestique engagé.

| Ind. | Palier | Justification courte | Sources |
|------|:------:|----------------------|---------|
| IA1 | 4 | Secteur data centers naissant, dominé par des acteurs semi-publics (Ethio Telecom) sur un marché encore très en retard des pairs continentaux (Kenya, Nigeria, Afrique du Sud captent l'essentiel des investissements data centers africains) ; l'« usine IA » annoncée intègre des partenaires internationaux qui diluent la souveraineté à mesure qu'elle se concrétise. Contrôle national estimé 35-50 % (estimation, base extrêmement réduite). | ecofinagency.com (data centers Afrique) 2026 ; aireports.africa 2026-02-09 |
| IA2 | 4 | Aucune production ni levier sur les puces IA ; dépendance d'importation simple sans sanction ni contrôle export documenté visant l'Éthiopie — marché ouvert, dépendance non aggravée par des contraintes externes (à la différence du Sahel). | Estimation, cohérent avec le traitement Madagascar (batch 1) |
| IA3 | 7 | L'Éthiopie figure parmi un groupe de 7 pays africains attendant un investissement data centers cumulé de seulement 1,36 Md$ d'ici 2031 — capacité actuelle négligeable rapportée à ~128 M hab., < 0,5 W/hab sans ambiguïté. | africadca.org « Data Centres in Africa 2026 » |
| IA4 | 5 | Aucun modèle de fondation éthiopien identifié ; l'Institut éthiopien d'IA (EAII, créé en 2020) est orienté recherche/régulation/application (santé, agriculture, gouvernement) plutôt que développement de modèle compétitif — dépendance à des modèles étrangers ouverts. | undp.org (AI UniPod) 2026 ; unesco.org (Ethiopia AI governance) 2026 |
| IA5 | 3 | Présence technologique chinoise (télécoms, infrastructure) et pledge d'investissement émirati structurants mais non coercitifs ; aucune puissance rivale ne projette de capacité IA hostile vers la zone. Rival présent, avance modérée. | aireports.africa 2026-02-09 |
| IA6 | 6 | L'« usine IA à 1 Md$ » annoncée repose substantiellement sur des engagements externes non garantis (dont une part du pledge panafricain de 1 Md$ des Émirats arabes unis) plutôt que sur du capital domestique confirmé ; les analystes documentent l'absence de base de capital-risque locale et des doutes sur la fiabilité électrique/compétences pour justifier le déploiement annoncé. Flux réellement engagés estimés bande basse 0,03-0,1 % du PIB (~156 Md$, donnée de configuration) — écart annonce/réalité documenté par prudence méthodologique. | aireports.africa 2026-02-09 ; restofworld.org 2025 |
| IA7 | 6 | Pénurie de compétences IA/data science documentée : 101e rang mondial au Coursera Global Skills Report ; l'université IA annoncée (1 000 diplômés/an visés) reste un projet non encore opérationnel. Densité très faible, exode modéré. | thereporterethiopia.com (World Bank AI readiness) 2026 ; nucamp.co 2026 |
| IA8 | 4 | Avantage structurel réel et documenté : GERD (5 GW, mis en service septembre 2025) double la capacité de génération nationale ; accord de transmission de 400 M$ (GridWorks, janvier 2026) pour désenclaver l'éolien/solaire du nord-est ; modernisation du réseau assistée par IA (Ethiopian Electric Utility). Mais l'objectif officiel de 96 % de connexion au réseau d'ici 2030 confirme un accès de base encore incomplet — tension modérée pour toute charge industrielle de grande échelle malgré le potentiel. | africanexponent.com (GERD) 2026 ; tvbrics.com (IA réseau) 2026 |
| IA9 | 4 | Politique nationale d'IA, Stratégie nationale d'IA, Digital Ethiopia 2030, Institut éthiopien d'IA (2020), AI UniPod (UNDP/Addis Ababa University) — architecture institutionnelle réelle et suivie dans la durée pour une économie à bas revenu, mais capacité de financement et d'exécution structurellement limitée face à l'ampleur des annonces. Leviers partiels. | undp.org 2026 ; ifa.gov.et « Silicon Diplomacy » 2026-03 |

**Quanti** : (2×4 + 3×4 + 2×7 + 2×5 + 2×3 + 1×6 + 2×6 + 2×4 + 3×4) / 19 = 88/19 = **4,63**

**Quali : 5,0** — L'Éthiopie présente l'écart annonce/réalité le plus net du batch : un
méga-projet énergétique authentique (GERD) et une architecture de politique IA cohérente et
suivie depuis 2020, mais un secteur data centers encore pré-échelle, une pénurie de compétences
documentée, et un chiffre-phare (« usine IA à 1 Md$ ») qui repose largement sur des engagements
externes non confirmés plutôt que sur du capital domestique engagé. Le quali est relevé au-dessus
du quanti pour capturer ce risque d'écart entre annonce et réalisation, conformément à la demande
explicite du cadrage de scorer honnêtement l'un et l'autre.

**S_I = 0,60 × 4,63 + 0,40 × 5,0 = 2,78 + 2,00 = 4,78 → 4,8**

*Ancien score I (Information) : 4,8 — pour mémoire. Stabilité de façade : les deux construits
sont proches en valeur par coïncidence (l'ancien reflétait un environnement médiatique sous
contrôle partiel, le nouveau une dépendance IA structurelle compensée par un avantage énergétique
réel) — la proximité numérique ne traduit aucune continuité de fond, cohérent avec l'avertissement
de rupture de série en tête de document.*

---

## Récapitulatif final — 18 zones

| Zone (id) | S_I quanti | Quali | **S_I final** | Ancien I (Information) |
|-----------|:----------:|:-----:|:-------------:|:----------------------:|
| ormuz | 4,05 | 4,5 | **4,2** | 6,9 |
| sahel | 5,79 | 6,0 | **5,9** | 5,8 |
| ukraine | 4,63 | 5,0 | **4,8** | 5,8 |
| cuba | 5,79 | 6,0 | **5,9** | 5,6 |
| chine | 2,79 | 3,5 | **3,1** | 6,9 |
| madagascar | 5,42 | 5,5 | **5,5** | 3,5 |
| turquie | 4,11 | 4,0 | **4,1** | 5,7 |
| inde | 3,74 | 4,0 | **3,8** | 4,5 |
| bresil | 3,74 | 4,0 | **3,8** | 3,5 |
| tamil (sub-national) | 3,11 | 3,5 | **3,3** | 4,0 |
| arctique | 4,16 | 5,0 | **4,5** | 3,1 |
| ile-maurice | 4,37 | 4,5 | **4,4** | 2,4 |
| singapour | 2,47 | 2,5 | **2,5** | 3,2 |
| republique-tcheque | 3,37 | 3,5 | **3,4** | 1,6 |
| iran | 5,16 | 5,0 | **5,1** | 5,9 |
| mexique | 4,26 | 4,5 | **4,4** | 3,3 |
| vietnam | 4,05 | 4,0 | **4,0** | 5,5 |
| ethiopie | 4,63 | 5,0 | **4,8** | 4,8 |

**Lecture d'ensemble (batch 2)** : le batch 2 confirme la logique de rupture de série du nouveau
construit et l'affine sur des cas moins tranchés que le batch 1. La Turquie et l'Inde illustrent
le profil « rattrapage géré » — dépendance réelle aux puces, mais statecraft actif et ambition de
modèle souverain qui tirent le quali au-dessus d'une lecture purement mécanique de la dépendance.
Le Brésil confirme qu'un avantage énergétique de façade (mix renouvelable) ne suffit pas à
garantir un score favorable si la fiabilité réseau et la production de puces restent absentes.
Tamil Nadu démontre qu'un hub sub-national documenté (concentration data centers, Sovereign AI
Park) peut justifier un delta favorable de 0,5 point vis-à-vis du national sans rompre la
cohérence R1-R4 de `semplice-scope-guidelines.md`. L'Arctique et l'Île Maurice sont les deux cas
de rupture de série les plus marqués du batch (respectivement +1,4 et +2,0 point vs l'ancien score
Information) : deux profils où un environnement informationnel ouvert masquait une dépendance IA
structurelle profonde — un micro-État sans capacité de production (Maurice) et une zone hôte
climatique/énergétique favorable mais sous souveraineté contestée (Arctique). La règle de
cohérence v3 (« si IA ≤ 2 alors C ≤ 4 attendu ») n'est déclenchée par aucune zone du batch 2
(minimum : tamil à 3,3, bien au-dessus du seuil de déclenchement).

**Lecture d'ensemble (batch 3)** : le batch 3 apporte deux extrêmes inédits au panel. Singapour
(2,5) devient le score le plus bas des 18 zones — un hub compute intégralement géré par un
statecraft centralisé, sans jamais atteindre la souveraineté chinoise sur les puces ou les
modèles. Le Vietnam (4,0) et le Mexique (4,4) confirment, aux côtés de la Turquie (4,1), le profil
« rattrapage géré » déjà identifié au batch 2 : partenariats étrangers structurants (NVIDIA,
nearshoring USMCA) qui contiennent la dépendance sans l'éliminer. L'Iran (5,1) est le cas le plus
nuancé du batch : l'embargo le plus dur du panel après Cuba, aggravé par des dégâts de guerre sur
le réseau électrique, mais une capacité résiduelle documentée (Rakhsh AI, Sahand) et un statecraft
volontariste qui l'écartent nettement du palier Sahel/Cuba malgré un contexte de crise. La
République tchèque confirme, comme l'Île Maurice et l'Arctique au batch 2, le schéma de rupture de
série « démocratie ouverte à ancien score bas / dépendance IA réelle » (+1,8 point), mais sans
aucune composante de pression ou d'isolement géopolitique — la dépendance y est purement
structurelle et intra-alliance. L'Éthiopie referme le panel sur son cas le plus instructif d'écart
annonce/réalité : un méga-projet énergétique authentique (GERD) et une architecture de politique
IA suivie depuis 2020, contrebalancés par un chiffre-phare (« usine IA à 1 Md$ ») documenté comme
largement non engagé. La règle de cohérence v3 n'est déclenchée par aucune zone du batch 3
(minimum : singapour à 2,5, au-dessus du seuil de 2).

## Indicateurs scorés en estimation (donnée publiée introuvable)

| Zone | Indicateurs | Nature de l'estimation |
|------|-------------|------------------------|
| ormuz | IA1, IA3 (bande), IA7 | Répartition du contrôle national du compute ; ratio W/hab de zone ; solde talent agrégé |
| sahel | IA2 (volet contraintes), IA4, IA6, IA7 | Aucune donnée OECD.AI/Dealroom/MacroPolo pour la zone |
| ukraine | IA3 (bande), IA7 (densité) | Capacité résiduelle non publiée ; densité chercheurs IA dérivée du vivier tech |
| cuba | IA1, IA4, IA6, IA7, IA9 | Écosystème non couvert par les trackers ; paradoxe IA1 documenté dans la fiche |
| chine | IA7 (bande par habitant) | Volume documenté, densité/100k interpolée |
| madagascar | IA4, IA6, IA7, IA9 | Écosystème non couvert par les trackers |
| turquie | IA1 (répartition), IA3 (bande, sources divergentes), IA4, IA6 (annualisation), IA7 (solde) | Périmètre data centers non stabilisé entre sources ; aucune donnée OECD.AI dédiée |
| inde | IA1 (répartition), IA3 (bande, écart Cushman & Wakefield vs Mordor), IA5, IA6 (flux hétérogènes) | Écart de méthodologie important entre sources sur la capacité DC totale |
| bresil | IA1 (répartition), IA4 (Sabiá non couvert), IA5, IA6 (trajectoire interpolée), IA7 | Aucune couverture MacroPolo/Stanford HAI spécifique au Brésil |
| tamil | IA3, IA4, IA6, IA7, IA9 (tous les deltas régionaux) | Chiffres régionaux dérivés par extrapolation de la part Chennai/Inde, non publiés en base autonome |
| arctique | IA1, IA3 (fourchette large), IA4, IA6, IA7, IA9 | Aucun tracker ne couvre le Groenland/Islande spécifiquement ; choix de périmètre lui-même documenté comme hypothèse ouverte |
| ile-maurice | IA1, IA3, IA4, IA6 (écart budget IA vs infra), IA7 | Économie trop petite pour une couverture par les trackers internationaux standards |
| singapour | IA1 (répartition), IA6 (agrégation flux hétérogènes) | Part exacte des opérateurs domestiques (STT GDC, Keppel) vs hyperscalers étrangers non consolidée en une seule source ; flux IA vs RIE générique non désagrégés |
| republique-tcheque | IA1, IA4, IA6 (annualisation), IA7 | Marché de colocation internationale encore jeune, aucune donnée OECD.AI dédiée, écosystème Prague/Brno non couvert par MacroPolo |
| iran | IA1 (paradoxe documenté), IA7 (densité/exode) | Écosystème non couvert par les trackers internationaux sous sanctions ; exode qualifié documenté qualitativement, non quantifié |
| mexique | IA3 (bande, absence de chiffre MW national consolidé), IA4, IA6 (part IA du capex data centers générique) | Marché en forte croissance mais mal consolidé statistiquement à l'échelle nationale |
| vietnam | IA1 (répartition), IA3 (bande), IA6 (agrégation annonces), IA7 (densité) | Marché data centers émergent, aucune donnée OECD.AI/MacroPolo dédiée au Vietnam |
| ethiopie | IA1, IA4, IA6 (écart annonce/réalité documenté), IA7, IA9 | Écosystème pré-échelle, non couvert par les trackers ; écart explicite entre chiffres annoncés et capital engagé |

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
(2026) — Madagascar · TRT World Research Centre, SETAV/Daily Sabah, Türkiye Today, RAND «AI
Diffusion Framework», BosphorusBits/Medium, Nuclear Business Platform, Tracxn, KPMG Turquie
(2026) — Turquie · NVIDIA Blog, explainx.ai, Business Standard, abhs.in, PIB India, Zeki via
vaidsics.com, The Print/Stanford AI Index, IEEFA, The Week, Ellenox (2026) — Inde · ABES,
gov.br/mcti (PBIA), ClickPetroleoEGas, IndexBox, ISI Markets, Rio Times, GNPW Group,
Mordor Intelligence, GlobeNewswire (2026) — Brésil · The Print, CRN Asia, Drishti IAS, Adani
Connex (2026) — Tamil Nadu/Chennai · DCD, Environment+Energy Leader, TechBuzz.ai, Datacenter
Knowledge, Greenland Energy, ArcticToday, Al Jazeera, IISS (2026) — Arctique/Groenland ·
Techpoint Africa, Bramston & Associates, EDB Mauritius, Africa AI News, African Security
Analysis, TaiyangNews, Lawyard.org, Ecofin Agency (2026) — Île Maurice · Structure Research
(2026-06-16), Morgan Lewis (DC-CFA2, 2026-03), Introl, MDDI Singapour (NAIRD), Stanford HAI AI
Index 2026, Tom's Hardware/TechSpot/Fortune (contournement puces, 2026) — Singapour · Mordor
Intelligence (Czechia DC Market), IT4Innovations (Karolina/KarolAIna, 2026-05), World Nuclear
News, NucNet (2026-04), mpo.gov.cz (Stratégie nationale semi-conducteurs), brnotechregion.eu —
République tchèque · ts2.tech, The National (2025-12-05), Recorded Future, AI Business,
Tom's Hardware, middleeastmonitor.com, voiceofemirates.com, iranintl.com (2026) — Iran ·
mexicobusiness.news (MEXDC, Plan México, Coatlicue), moderndiplomacy.eu (2025-11-29), White &
Case, latintimes.com, aztecreports.com, riotimesonline.com (2026) — Mexique · NVIDIA
Newsroom/Blog, mpi.gov.vn (2024-12), technode.global (2026-06-30), b-company.jp, worldngayon.com,
vietnamplus.vn (EVN), fptsoftware.com, masvn.com (2026) — Vietnam · africanexponent.com (GERD),
ecofinagency.com, africadca.org (Data Centres in Africa 2026), aireports.africa, undp.org (AI
UniPod), ifa.gov.et, thereporterethiopia.com, tvbrics.com, restofworld.org (2025-2026) —
Éthiopie · Références de la grille v3 : Epoch AI, Stanford HAI, MacroPolo, OECD.AI, IEA,
SemiAnalysis, Georgetown CSET.

## Lecture d'ensemble — 18 zones

**Classement par S_I** (du mieux positionné au plus dépendant) :

| Rang | Zone | S_I | Rang | Zone | S_I |
|:----:|------|:---:|:----:|------|:---:|
| 1 | Singapour | 2,5 | 10 | Mexique | 4,4 |
| 2 | Chine | 3,1 | 10 | Île Maurice | 4,4 |
| 3 | Tamil Nadu | 3,3 | 12 | Arctique | 4,5 |
| 4 | République tchèque | 3,4 | 13 | Ukraine | 4,8 |
| 5 | Inde | 3,8 | 13 | Éthiopie | 4,8 |
| 5 | Brésil | 3,8 | 15 | Iran | 5,1 |
| 7 | Vietnam | 4,0 | 16 | Madagascar | 5,5 |
| 8 | Turquie | 4,1 | 17 | Sahel | 5,9 |
| 9 | Ormuz | 4,2 | 17 | Cuba | 5,9 |

**Observations structurantes** :

1. **Qui possède, par deux voies opposées.** Seules deux zones passent sous 3,5 : la Chine (3,1),
   qui a bâti une souveraineté compute/modèles/énergie réelle sous embargo, et Singapour (2,5),
   qui ne produit rien mais gère sa dépendance avec le statecraft le plus centralisé et le plus
   efficace du panel. Aucune autre zone n'approche ce niveau — même les économies développées du
   panel (République tchèque, Brésil, Inde) restent dépendantes sur au moins deux couches
   structurelles (puces et modèles).
2. **Qui dépend, sans nuance.** Sahel et Cuba ferment le classement ex æquo à 5,9 : embargo ou
   isolement total, effondrement énergétique documenté, aucune capacité de production sur aucune
   couche. L'Iran (5,1), bien que sous un régime de sanctions presque aussi dur, s'en écarte
   nettement grâce à une capacité résiduelle documentée (Rakhsh AI, Sahand) et un statecraft
   volontariste — la différence entre isolement subi et isolement piloté.
3. **Le « rattrapage géré » est le profil médian du panel.** Vietnam (4,0), Turquie (4,1), Ormuz
   (4,2), Mexique (4,4) et Inde (3,8) partagent un même schéma : dépendance réelle aux puces et
   aux modèles étrangers, mais un statecraft actif (MoU structurants, plans nationaux, missions
   dédiées) qui contient — sans l'éliminer — cette dépendance. C'est le groupe le plus dense du
   classement, signe que la « souveraineté IA » est rarement binaire.
4. **Là où le construit diverge le plus de l'ancien score Information.** Dans le sens de la
   hausse : Île Maurice (+2,0), République tchèque (+1,8), Arctique (+1,4) — trois démocraties ou
   quasi-démocraties ouvertes dont l'ancien score bas masquait une dépendance IA structurelle
   réelle, sans lien avec le contrôle informationnel. Dans le sens de la baisse : Chine (-3,8),
   Vietnam (-1,5), Ormuz (-2,7), Turquie (-1,6) — des régimes à contrôle informationnel élevé dont
   le nouveau score révèle, selon les cas, une souveraineté IA réelle (Chine) ou une dynamique de
   rattrapage documentée (Vietnam, Turquie) que l'ancien indicateur ne captait pas.
5. **L'énergie est le swing factor le plus sous-estimé.** Les paliers IA8 séparent nettement les
   zones à dépendance comparable par ailleurs : le GERD éthiopien (IA8=4) et le socle nucléaire
   tchèque (IA8=2) jouent un rôle d'amortisseur documenté, tandis que le réseau électrique
   iranien (IA8=6, aggravé par des dégâts de guerre) et le mix charbon vietnamien sous tension
   saisonnière (IA8=5) tirent le score vers le haut malgré des trajectoires de statecraft par
   ailleurs comparables — l'énergie discrimine plus que le talent ou l'investissement affiché.

---

*Statut : Batchs 1-3 terminés — 18/18 zones scorées (ormuz, sahel, ukraine, cuba, chine,
madagascar, turquie, inde, bresil, tamil, arctique, ile-maurice, singapour, republique-tcheque,
iran, mexique, vietnam, ethiopie), en attente de validation. Bascule `semplice-zones-config.js` :
hors périmètre de ce document.*
