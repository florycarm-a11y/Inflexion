# SEMPLICE v3 — Rescoring dimension I (Intelligence Artificielle)

> **Batch 2/3 terminé — 12 zones scorées, batch 3 restant**
> Inflexion Intelligence — Juillet 2026

---

## Objectif

La v3 du cadre SEMPLICE repurpose la dimension **I** : « Information » devient « **Intelligence
Artificielle** » (construit : *puissance IA souveraine d'un État vs dépendance* — compute, puces,
modèles, énergie, statecraft). L'ancien bloc informationnel est redistribué vers P (P16-P18) et
C (C13-C14 + CM1). Ce document rescore IA1-IA9. **Batch 1/3** : ormuz, sahel, ukraine, cuba,
chine, madagascar. **Batch 2/3** : **turquie, inde, bresil, tamil, arctique, ile-maurice**.
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

## Récapitulatif Batch 1 + 2

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
Analysis, TaiyangNews, Lawyard.org, Ecofin Agency (2026) — Île Maurice · Références de la grille
v3 : Epoch AI, Stanford HAI, MacroPolo, OECD.AI, IEA, SemiAnalysis, Georgetown CSET.

---

*Statut : Batch 2/3 terminé — 12 zones scorées (ormuz, sahel, ukraine, cuba, chine, madagascar,
turquie, inde, bresil, tamil, arctique, ile-maurice), en attente de validation. Batch 3 (zones
restantes) et bascule `semplice-zones-config.js` : hors périmètre de ce document.*
