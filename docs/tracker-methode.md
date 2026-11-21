# Méthode Inflexion — v1.3

> **Statut : figée le 21 novembre 2026.** Proposée le 19 novembre 2026 — la v1.2, figée le 17 novembre 2026, plus huit précisions de texte (section 11) — et validée par Flo le 21 novembre 2026, les huit précisions comprises, dont les trois vrais choix (1, 2 et 6). Aucun seuil, aucun poids et aucune alerte ne change par rapport à la v1.2. L'état de test reste celui de la section 11 : la v1.3 n'a pas de rejeu propre.
>
> **Ce fichier est la seule source de vérité du calcul.** Si une page, un script ou un autre document dit autre chose, ce fichier fait foi. En cas de doute sur une phrase, le pseudo-code de la section 6 l'emporte.
>
> La méthode décrit des publications passées. Elle ne constitue pas un conseil en investissement.

## 1. Ce que la méthode mesure

Inflexion lit les publications de résultats trimestriels d'une société portée par un récit (petits réacteurs nucléaires, IA, robotique). À chaque publication, quatre dimensions reçoivent un **sens** : hausse, stable, baisse ou « non publié ». Leur somme est le **solde**. Le solde déclenche quatre alertes : Bascule, Bascule commerciale, Signal faible, Rechute.

La méthode ne lit que des documents publiés par la société. Elle n'utilise ni cours de Bourse, ni presse, ni note d'analyste.

**Ce qu'une alerte dit.** Une Bascule dit que, ce trimestre-là, les preuves s'améliorent sur au moins deux dimensions de plus qu'elles ne se dégradent. Une Rechute dit l'inverse.

**Ce qu'une alerte ne dit pas.** Elle ne dit pas que le récit aboutira. Sur dix sociétés hors échantillon, la Bascule est apparue chez les cinq succès boursiers et chez trois des cinq échecs (section 12). Aucune page ne doit présenter une alerte comme une prévision.

## 2. Paramètres d'une société

Ils sont fixés quand la société entre dans le tracker, avant de lire ses chiffres. Ils ne changent plus ensuite, même si un autre choix donnerait un meilleur résultat.

| Paramètre | Règle |
|---|---|
| Archétype | Pré-revenus, plateforme ou industriel (tableau suivant) |
| Chiffre d'affaires de la thèse | Le segment qui porte le récit, hors activités annexes ; à défaut, le chiffre d'affaires total. Pré-revenus : les unités livrées |
| Indicateur de demande | Dans cet ordre : commandes ou carnet de commandes ; à défaut, nombre de clients ou d'abonnés ; sinon « non publié ». Pré-revenus : barreau d'engagement et réservations |

| Archétype | Ce qui le définit | Exemples |
|---|---|---|
| Pré-revenus | Aucun revenu lié à la thèse, ou presque | Oklo, NuScale, Fisker |
| Plateforme | Logiciel ou service déjà vendu, revenus récurrents | Palantir, CrowdStrike, AppLovin |
| Industriel | Fabricant qui a déjà des ventes ; la thèse passe par les commandes | Vertiv, GE Vernova, Rocket Lab |

Si la société cesse de publier son indicateur de demande, la dimension devient « non publié » à partir de là. On ne le remplace pas.

## 3. Sources et date d'une ligne

- **Une ligne par publication de résultats trimestriels**, datée du jour de la publication (aux États-Unis, le 8-K rubrique 2.02). Chaque ligne n'utilise que ce qui était public ce jour-là.
- **Pré-annonce (précision 2).** Une pré-annonce ou un point d'activité publié entre deux publications de résultats ne crée pas de ligne. Ce qu'il annonce se lit à la publication de résultats suivante. Exemple : ChargePoint retire sa prévision annuelle le 16 novembre 2023 ; le statut « abaissée » est porté par la ligne du 6 décembre 2023.
- **Ce qui compte comme « le communiqué » (précision 5).** Toutes les annexes en texte du 8-K de résultats : le communiqué (annexe 99.1), la lettre aux actionnaires, un second communiqué joint. Une présentation en diapositives peut fournir un chiffre absent du texte (carnet, nombre de clients). Elle ne change pas à elle seule un statut de prévision : si le communiqué « réaffirme » et qu'une diapositive montre un scénario plus bas, le statut reste « maintenue » et l'hésitation est notée.
- **Rapports trimestriels et annuels (précision 4).** Un 10-Q ou un 10-K sert s'il est déposé au plus tard le jour de la publication. Déposé après, sa donnée est « non publié » pour cette ligne ; elle sert seulement de valeur précédente à la ligne suivante.
- **Comparatifs (précision 8).** Le trimestre d'il y a un an se lit dans le communiqué du jour, tel qu'il l'imprime. Pas dans une base de données ni dans un dépôt retraité plus tard. L'API XBRL de la SEC reste admise pour collecter, à condition de vérifier que le chiffre vient du dépôt d'origine.
- **Engagements.** Les 8-K rubrique 1.01 (accord important et contraignant) servent à l'échelle d'engagement.
- **GAAP.** Les comptes aux normes américaines, sans les retraitements de la société. Les résultats « ajustés » ne servent à aucune dimension.
- **Hésitation.** Entre deux lectures, retenir la plus neutre (« maintenue », « stable ») et l'inscrire dans un journal avec les deux lectures possibles.
- **Document introuvable.** Garder la ligne, la marquer, sens « non publié ».

## 4. Les quatre dimensions

Chaque dimension reçoit un sens : hausse (+1), stable (0), baisse (−1), ou « non publié », qui ne compte pas dans le solde.

| Dimension | Ce qu'on mesure | Hausse (+1) | Baisse (−1) | Non publié |
|---|---|---|---|---|
| D1 Revenus de la thèse | Croissance sur un an du chiffre d'affaires de la thèse, comparée à cette même croissance à la publication précédente. Si la société publie une croissance organique, c'est elle qu'on prend | Plus d'un point au-dessus | Plus d'un point en dessous | Croissance non calculable, ou pas de valeur précédente |
| D1, pré-revenus | Unités livrées dans le trimestre, comparées au trimestre précédent | Hausse de plus de 5 %, ou premières livraisons après zéro | Baisse de plus de 5 % | Pas de trimestre précédent publié |
| D2 Demande engagée, hors pré-revenus | Ratio commandes / chiffre d'affaires du trimestre. Sans commandes publiées mais avec un carnet : commandes = variation du carnet sur le trimestre + chiffre d'affaires du trimestre | Ratio au-dessus de 1,05 | Ratio sous 0,95 | Ni commandes ni carnet : ligne suivante |
| D2, à défaut de commandes | Croissance sur un an du nombre de clients ou d'abonnés, comparée à la publication précédente | Plus d'un point au-dessus | Plus d'un point en dessous | Nombre non publié, ou pas de valeur précédente |
| D2, pré-revenus | Barreau d'engagement le plus haut atteint (section 8) et nombre de réservations | Barreau gagné, ou réservations en hausse | Barreau perdu, ou réservations en baisse | Pas de publication précédente |
| D3 Prévision et jalons | Statut de la prévision principale (section 5) | Relevée | Abaissée ou manquée | Aucune prévision chiffrée ni jalon daté |
| D4 Rentabilité | Marge opérationnelle GAAP du trimestre (résultat opérationnel / chiffre d'affaires), comparée au même trimestre un an plus tôt | Hausse de plus de 2 points, ou de plus de 5 points si la marge du trimestre est négative | Baisse de même ampleur | Pas de trimestre comparable, ou marge non calculable pour le trimestre ou pour son comparatif |

Règles d'application :

- **Croissance calculée sur les montants (précision 3).** Une croissance se calcule à partir des deux montants publiés, sans arrondi intermédiaire. Un pourcentage imprimé ne sert que s'il n'est pas recalculable ; c'est le cas de la croissance organique. Les seuils sont stricts : « plus d'un point » veut dire un écart supérieur à 1,0.
- **Marge non calculable (précision 1).** Une marge, opérationnelle ou brute, est non calculable quand le chiffre d'affaires du trimestre est nul ou négatif, ou quand la perte opérationnelle dépasse cent fois ce chiffre d'affaires. Le critère est le même pour D4 et pour le garde-fou de marge brute (section 6).
- **Première ligne d'une société (précision 7).** Elle se calcule comme les autres : les valeurs précédentes (croissance, nombre de clients, prévision) se lisent dans le communiqué précédent. S'il n'existe pas, parce que la société vient d'être cotée, on prend les comparatifs imprimés dans le premier communiqué : la marge du même trimestre un an plus tôt donne D4 dès la première ligne, et la croissance de la première ligne sert de valeur précédente à la deuxième. Ce qui manque encore est « non publié ». La première ligne ne porte aucune alerte, sauf une Bascule commerciale.
- **D1 pré-revenus.** Zéro livraison puis zéro livraison vaut « stable ».
- **D2 pré-revenus.** Si le barreau monte et que les réservations baissent, la hausse l'emporte.
- **D4, garde-fou rémunération en actions.** Si la marge GAAP baisse mais que la marge avant rémunération en actions monte sur un an, le sens est « stable » et la ligne porte le drapeau « rémunération en actions ».

## 5. Prévision : classer le statut (D3)

La prévision principale est la prévision annuelle de chiffre d'affaires. Si la société n'en donne pas, c'est la prévision annuelle qu'elle place en premier (livraisons, résultat, bénéfice par action). Pour un pré-revenus sans prévision chiffrée, c'est le jalon daté qu'elle annonce : début de production, premières livraisons.

| Statut | Quand | Sens |
|---|---|---|
| Relevée | Le milieu de la fourchette dépasse celui de la publication précédente, pour le même exercice. Un jalon avancé compte aussi | +1 |
| Abaissée | Le milieu passe sous celui de la publication précédente, y compris quand la coupe a été annoncée entre deux publications. Un jalon repoussé ou vidé de sa substance compte aussi | −1 |
| Manquée | La prévision annuelle n'a pas bougé, mais le trimestre publié ressort sous le bas de la fourchette donnée pour ce trimestre | −1 |
| Maintenue | Prévision reconduite, ou milieu inchangé. Un trimestre au-dessus de sa fourchette, sans relèvement de l'année, reste « maintenue ». Un jalon simplement répété reste « maintenue » | 0 |
| Nouvelle | Première prévision d'un exercice : elle ne se compare pas à celle de l'exercice précédent | 0 |
| Non publié | Aucune prévision chiffrée ni jalon daté dans le communiqué | ne compte pas |

La révision prime : on ne teste « manquée » que si la prévision annuelle n'a pas bougé.

**Quand la société publie plusieurs prévisions (précision 6).**

1. Seules comptent les prévisions de l'exercice en cours et de l'exercice suivant. Les objectifs plus lointains (« objectifs 2024 » donnés en 2020) ne donnent jamais le statut.
2. On lit d'abord l'exercice en cours. S'il est révisé, son statut s'applique.
3. S'il est inchangé ou absent, et que la prévision de l'exercice suivant est révisée par rapport à la publication précédente, cette révision donne le statut.
4. Deux révisions de sens contraire : l'exercice en cours l'emporte, et la ligne va au journal des hésitations.
5. Un indicateur rebaptisé (« facturations brutes » devenu « chiffre d'affaires ») continue la même série si la société présente elle-même le chiffre comme relevé, abaissé ou réaffirmé. Sinon, le statut est « nouvelle ».

**Société qui ne guide qu'un trimestre à la fois.** Comparer la prévision de chiffre d'affaires du trimestre suivant au chiffre d'affaires qui vient d'être publié. Plus de 2 % au-dessus : relevée. Plus de 2 % en dessous : abaissée. Entre les deux : maintenue. Cette règle ne s'applique qu'aux publications où la société ne donne aucune prévision annuelle.

**Première prévision de bénéfice net.** Une société dont le résultat net GAAP des quatre derniers trimestres est négatif annonce pour la première fois, dans un communiqué de résultats, un bénéfice net GAAP positif pour un trimestre ou un exercice à venir. Le statut compte alors comme « relevée » s'il valait « maintenue » ou « nouvelle ». La règle ne joue qu'une fois par société. Une prévision de résultat ajusté, d'EBITDA ajusté ou de flux de trésorerie ne la déclenche pas.

Quatre exemples de classement :

- Fourchette annuelle de chiffre d'affaires passée de 3,35–3,50 à 3,40–3,50 milliards : le milieu monte, statut « relevée ».
- Prévision annuelle coupée début octobre par un communiqué séparé, puis confirmée fin octobre avec les résultats : statut « abaissée » à la publication de fin octobre.
- « Premières livraisons aux clients au quatrième trimestre » devenu « camions de pré-série » : jalon vidé de sa substance, statut « abaissée ».
- 48 unités livrées pour une fourchette trimestrielle de 50 à 60, sans révision de l'année : statut « manquée ».

## 6. Solde, alertes et régimes

Le solde d'une publication est la somme des sens publiés. Il va de −4 à +4. Une dimension « non publié » ne compte pas.

| Alerte | Condition |
|---|---|
| Bascule | Le solde atteint +2 ou plus, hors régime de bascule, et la marge brute du trimestre est positive |
| Bascule commerciale | Pré-revenus seulement : première publication où le barreau vaut 4 ou 5 et où la marge brute est positive. Une seule par société |
| Signal faible | La demande (D2) ou la prévision (D3) passe en hausse alors qu'elle était stable ou en baisse à la publication précédente, le solde précédent était nul ou négatif, et le solde reste sous +2 |
| Rechute | Le solde tombe à −2 ou moins, hors régime de rechute |

**Garde-fou marge brute.** Marge brute = (chiffre d'affaires − coût des ventes) / chiffre d'affaires du trimestre, avec le coût des ventes tel que la société le présente dans son compte de résultat. Tant qu'elle est négative, nulle ou non calculable (précision 1, section 4), il n'y a ni Bascule ni Bascule commerciale, quel que soit l'archétype : la ligne porte le drapeau « vend à perte ». L'alerte part à la première publication où ses conditions sont réunies avec une marge brute positive. Si la société ne présente aucune ligne de coût des ventes, le garde-fou est sans objet et on le note.

**Régimes.** Une Bascule ouvre un régime de bascule : pas de nouvelle Bascule tant qu'il dure. Il se ferme quand le solde est nul ou négatif deux publications de suite. Une Rechute ouvre un régime de rechute, fermé quand le solde est nul ou positif deux publications de suite. Un Signal faible n'ouvre aucun régime et peut se répéter.

Aucune alerte à la première publication d'une société, sauf la Bascule commerciale. Un sens précédent « non publié » ne vaut ni 0 ni −1 : il ne peut pas déclencher un Signal faible.

Le pseudo-code fait foi :

```text
régime = aucun ; bascule_commerciale_émise = non
pour chaque publication, de la plus ancienne à la plus récente :
    mb_ok = (marge brute calculable et > 0) ou (garde-fou sans objet)
    si pré-revenus et barreau >= 4 et non bascule_commerciale_émise et mb_ok :
        alerte "Bascule commerciale" ; bascule_commerciale_émise = oui
    si ce n'est pas la première publication de la société :
        si solde >= +2 et régime != bascule :
            si mb_ok : alerte "Bascule" ; régime = bascule
            sinon    : drapeau "vend à perte", aucune alerte, régime inchangé
        sinon si solde <= -2 et régime != rechute :
            alerte "Rechute" ; régime = rechute
        sinon si régime != bascule et solde < +2 et solde précédent <= 0
                et (   (D2 = +1 et D2 précédent vaut 0 ou -1)
                    ou (D3 = +1 et D3 précédent vaut 0 ou -1) ) :
            alerte "Signal faible"
        si régime = bascule et solde <= 0 et solde précédent <= 0 : régime = aucun
        si régime = rechute et solde >= 0 et solde précédent >= 0 : régime = aucun
```

## 7. Condition de financement

Elle s'affiche à côté de chaque ligne et n'entre pas dans le solde : elle ne déclenche ni ne bloque aucune alerte. Quatre mesures, prises dans les derniers comptes publiés à la date de la ligne :

- **Flux de trésorerie libre sur 12 mois** : flux d'exploitation moins investissements corporels, sur les quatre derniers trimestres.
- **Autonomie** : trésorerie et placements courants, divisés par la consommation annuelle (le flux libre négatif, en valeur absolue). En années.
- **Dilution** : hausse du nombre d'actions sur 12 mois, en %.
- **Engagements nets** : dette financière (emprunts, obligations, convertibles, parts courante et non courante) plus dettes de loyers inscrites au bilan, moins trésorerie et placements courants. On les compare au chiffre d'affaires des 12 derniers mois.

| Flux libre 12 mois | Autres conditions | Couleur |
|---|---|---|
| Positif | Dilution de 20 % au plus, engagements nets inférieurs ou égaux au chiffre d'affaires 12 mois | Vert |
| Positif | Engagements nets supérieurs au chiffre d'affaires 12 mois | Orange |
| Négatif ou nul | Autonomie d'au moins 2 ans, dilution de 20 % au plus, engagements nets inférieurs ou égaux au chiffre d'affaires 12 mois | Orange |
| Négatif ou nul | Autonomie de moins de 2 ans, ou engagements nets supérieurs au chiffre d'affaires 12 mois | Rouge |
| Tous | Dilution de plus de 20 % | Rouge |

Noter le ou les motifs à côté de la couleur : autonomie, dilution, engagements. Si les dettes de loyers ne figurent pas au bilan (comptes antérieurs à 2019), compter zéro et le signaler. Si une mesure manque, la couleur est « non déterminée », pas verte.

## 8. L'échelle d'engagement (pré-revenus)

| Barreau | Définition |
|---|---|
| 0 · Annonce | Partenariat ou « collaboration », sans chiffre ni obligation |
| 1 · Intention | Protocole d'accord ou lettre d'intention, non contraignants |
| 2 · Accord-cadre | Volumes ou prix indicatifs, sélection comme fournisseur, commandes annoncées sans contrat déposé |
| 3 · Accord définitif sous conditions | Signé mais suspendu à un financement, une licence ou une décision d'investissement ; prépaiement ; réservations de particuliers avec acompte |
| 4 · Contrat ferme | Obligation d'achat ou paiement engagé |
| 5 · Revenu récurrent | Chiffre d'affaires reconnu, lié à la thèse, chez plusieurs clients |

Par défaut, une annonce qui n'a pas donné lieu au dépôt d'un 8-K rubrique 1.01 ne dépasse pas le barreau 2. Le classement d'un événement est fait à la main, avec sa source.

## 9. Notes de niveau, score et phase (affichage seulement)

Chaque dimension reçoit aussi une note de niveau de 0 à 5. Les notes donnent un score pondéré et une phase. **Elles ne déclenchent aucune alerte.** Elles n'ont été rejouées que sur les sept premiers cas ; les poids sont un choix raisonné, pas un réglage mesuré.

| Dimension | Note de 0 à 5 |
|---|---|
| D1 Revenus de la thèse | 0 si la croissance est nulle ou négative ; 1 sous le quart du seuil ; 2 sous la moitié ; 3 sous le seuil ; 4 au-dessus ; 5 au-dessus et en accélération deux publications de suite. Seuil : 40 % (plateforme et pré-revenus), 25 % (industriel). Pré-revenus : 0 sans livraison, 1 aux premières livraisons, puis de 3 à 5 selon le même barème |
| D2 Demande engagée | Ratio commandes / chiffre d'affaires : 5 à partir de 1,2 ; 4 à partir de 1,1 ; 3 à partir de 1,0 ; 2 à partir de 0,9 ; 1 à partir de 0,8 ; 0 en dessous. Nombre de clients : barème de D1. Pré-revenus : le barreau |
| D3 Prévision et jalons | Relevée : 4, puis 5 si relevée deux fois de suite. Maintenue ou nouvelle : 3. Abaissée ou manquée : 2, puis 1 deux fois de suite, 0 trois fois de suite |
| D4 Rentabilité | Marge positive : 5 si en hausse de plus de 2 points sur un an, 4 si stable, 3 si en baisse. Marge entre 0 et −10 % : 3 si en hausse d'au moins 5 points, sinon 2. Entre −10 et −20 % : 2 ou 1 selon le même test. En dessous : 1 ou 0. Marge non calculable : 0 |

| Archétype | D1 | D2 | D3 | D4 |
|---|---|---|---|---|
| Plateforme | 30 % | 20 % | 20 % | 30 % |
| Industriel | 20 % | 25 % | 20 % | 35 % |
| Pré-revenus | 15 % | 45 % | 25 % | 15 % |

Le score est la moyenne pondérée des notes publiées ; une dimension non publiée est écartée et son poids réparti sur les autres. Phases : Récit sous 1,55 ; Pré-commercial sous 2,55 ; Accélération sous 3,85 ; Maturité au-delà. Les scores sont calculés, jamais saisis.

## 10. Drapeaux, et ce qui reste hors du calcul

Trois drapeaux sortent du calcul : « vend à perte » (garde-fou de marge brute), « rémunération en actions » (garde-fou de D4) et « hésitation » (lecture neutre retenue).

Les drapeaux suivants sont éditoriaux. Ils se saisissent à la main, chacun avec sa source, et s'affichent à côté de la fiche, jamais dans le solde : revenus hors thèse, trésorerie sans traction, concentration des clients, dépendance à une décision publique, banalisation de la technologie.

La matrice récit/réalité du document de refondation croise le solde avec une « température du récit » (valorisation, écart au plus haut). Cette température n'est pas définie ici et n'a pas été testée : elle ne fait pas partie de la v1.3.

## 11. Les huit précisions de la v1.3

Elles viennent de la comparaison de deux rejeux indépendants de la v1.2 sur dix cas, le 18 novembre 2026. Chacune tranche un point que la v1.2 laissait ouvert et que les deux lecteurs avaient lu différemment.

| N° | Précision | Ce que disait la v1.2 | Cas qui l'a montrée | Effet |
|---|---|---|---|---|
| 1 | Une marge est non calculable si le chiffre d'affaires est nul ou négatif, ou si la perte opérationnelle dépasse cent fois ce chiffre d'affaires. Même critère pour D4 et pour la marge brute | « Non calculable faute de ventes », sans seuil pour la marge brute | Fisker, deuxième trimestre 2023 : 825 000 dollars de ventes, marge brute de +7,5 %, perte opérationnelle de 87,9 millions | Avec la précision, la Bascule commerciale est retenue. À la lettre de la v1.2, elle partait le 4 août 2023, dix mois avant la faillite |
| 2 | Une pré-annonce ne crée pas de ligne | « Une ligne par publication de résultats trimestriels » | Huit pré-annonces (ChargePoint, Peloton, Plug Power, Rocket Lab, SunPower) comptées comme des lignes par le second rejeu | Cinq lignes définitives y perdaient leur comparaison ; une Rechute de SunPower glissait d'un trimestre |
| 3 | La croissance se calcule sur les montants publiés | Rien | CrowdStrike, mars 2022 : 67 % puis 66 % en arrondi, 67,2 % puis 65,7 % sur les montants | Une Rechute de plus, le 9 mars 2022 |
| 4 | Un rapport ne sert que s'il est déposé au plus tard le jour de la publication | Rapports « déjà déposés à cette date », cités pour le bilan et les flux | Rocket Lab : carnet de fin d'année lu dans le rapport annuel, déposé sept jours puis un jour après | La seconde Bascule passe du 27 février au 6 mai 2024 |
| 5 | Toutes les annexes en texte du 8-K comptent ; une diapositive ne change pas seule un statut de prévision | « Le communiqué (annexe 99.1) » | Constellation (prévision 2024 dans un second communiqué), AppLovin (lettre aux actionnaires), Plug Power en mai 2023 (cas bas dans les diapositives) | Aucune alerte changée |
| 6 | Ordre entre plusieurs prévisions : exercice en cours, puis exercice suivant ; jamais les objectifs lointains ; série continuée si la société parle elle-même de relèvement | « La prévision annuelle de chiffre d'affaires » | Plug Power, de 2020 à 2023 | Décide d'une Rechute : 6 août 2020 dans un rejeu, 9 novembre 2021 dans l'autre |
| 7 | Sans communiqué précédent, la première ligne prend les comparatifs imprimés dans le premier communiqué | « Si ce communiqué n'existe pas, le sens est non publié » | ChargePoint et Rocket Lab, tout juste cotées | Un Signal faible de Rocket Lab (15 novembre 2021) en dépend |
| 8 | Les comparatifs sont ceux du communiqué du jour | Rien | Plug Power, 9 novembre 2020 : −17,0 % imprimé pour le troisième trimestre 2019, −23,3 % dans la base | Une Bascule « retenue » en moins |

**Les trois vrais choix.**

- **Précision 1.** Elle a été écrite après avoir vu le cas Fisker. Fisker ne compte donc plus comme preuve hors échantillon du garde-fou de marge brute.
- **Précision 2.** Le choix inverse se défend pour un outil en direct : une ligne à la pré-annonce aurait signalé la coupe de ChargePoint vingt jours plus tôt. Il n'a pas été testé, et il faudrait écrire comment la ligne définitive se compare.
- **Précision 6.** Elle fixe une lecture parmi plusieurs possibles. Chez Plug Power, sept des dix lignes en désaccord entre les deux lecteurs venaient de la prévision.

**État de test.** La v1.3 n'a pas de rejeu propre. Les précisions 3, 4, 5, 6 et 8 sont appliquées dans le rejeu corrigé du 18 novembre 2026, aux lignes où la comparaison a montré un écart ; elles n'ont pas été revérifiées sur les 146 lignes. Les précisions 1 et 2 décrivent ce que ce rejeu faisait déjà. La précision 7 n'a pas été rejouée. Aucune n'a été rejouée sur les sept premiers cas.

## 12. Ce que le backtest a montré

Dix-sept cas. Sept ont servi à construire la méthode : Palantir, Nvidia, Vertiv, Tesla (réussites), Nikola, WeWork, Cisco (échecs). Dix ont servi à la tester, règles figées : AppLovin, ChargePoint, Constellation Energy, CrowdStrike, Fisker, GE Vernova, Peloton, Plug Power, Rocket Lab, SunPower.

Sur les dix cas hors échantillon (146 publications, rejeu corrigé) : 34 alertes, soit 11 Bascules, 10 Rechutes et 13 Signaux faibles.

| Constat | Chiffre |
|---|---|
| Succès boursiers ayant reçu une Bascule | 5 sur 5 |
| Échecs boursiers ayant reçu une Bascule | 3 sur 5 (ChargePoint, Peloton, SunPower) ; 4 sur 5 si le garde-fou est lu à la lettre de la v1.2 (Fisker) |
| Bascules suivies d'un rendement supérieur au S&P 500 à 12 mois | 6 sur 10 mesurables |
| Bascules qui font mieux qu'une date de publication quelconque de la même société | 5 sur 10 mesurables |
| Rechutes suivies d'un rendement inférieur au S&P 500 à 12 mois | 6 sur 8 mesurables |
| Accord entre deux lecteurs indépendants, à l'aveugle | 90 % des sens ; 10 Bascules sur 11 à la même date ; 7 Rechutes et 7 Signaux faibles en commun |

Ce qu'il faut en retenir :

- **La Bascule ne trie pas les gagnants.** Elle signale une amélioration des preuves. Elle apparaît chez tous les succès, et chez la majorité des échecs.
- **La Rechute est le signal le plus fiable.** La Bascule se reproduit d'un lecteur à l'autre (10 dates sur 11). La Rechute moins bien (7 en commun, pour 9 et 11). Le Signal faible dépend du lecteur (7 en commun, pour 11 et 8).
- **Deux des trois règles ajoutées en v1.2 n'ont rien montré.** Les engagements nets n'ont changé aucune couleur sur 146 publications. La première prévision de bénéfice net ne s'est jamais déclenchée. Le garde-fou de marge brute a retenu deux Bascules chez Plug Power, l'une suivie de 296 points de mieux que le S&P 500 en douze mois (7 mai 2020), l'autre de 102 points de moins (1er mars 2023).
- **Les limites.** La liste des dix a été dressée de mémoire, en connaissant le sort des sociétés. La prévision se lit à la main. Les cours de Fisker et de SunPower manquent. Les verdicts de GE Vernova et de Rocket Lab sont provisoires.

**Ce que le site peut écrire :** « les preuves s'améliorent » ou « se dégradent », avec la source de chaque chiffre, et le bilan complet du backtest, échecs compris. **Ce qu'il ne peut pas écrire :** qu'une Bascule annonce une réussite, ni aucune promesse de performance.

## 13. Suites de référence

Trois suites tirées du rejeu corrigé. Elles servent à tester la logique des alertes à partir des sens : elles ne testent pas la lecture des communiqués. Les données d'entrée des dix-sept cas ne sont pas dans le dépôt.

n.p. = non publié.

### CrowdStrike (plateforme)

| Publication | D1 | D2 | D3 | D4 | Solde | Marge brute | Alerte |
|---|---|---|---|---|---|---|---|
| 2019-07-18 | n.p. | n.p. | 0 | +1 | +1 | +69,5 % | aucune (première ligne) |
| 2019-09-05 | −1 | n.p. | +1 | +1 | +1 | +70,8 % | aucune |
| 2019-12-05 | 0 | n.p. | +1 | +1 | +2 | +70,1 % | Bascule |
| 2020-03-19 | −1 | +1 | 0 | +1 | +1 | +71,5 % | aucune |
| 2020-06-02 | −1 | −1 | +1 | +1 | 0 | +73,7 % | aucune |
| 2020-09-02 | 0 | −1 | +1 | +1 | +1 | +72,7 % | aucune |
| 2020-12-02 | −1 | −1 | +1 | +1 | 0 | +73,5 % | aucune |
| 2021-03-16 | −1 | −1 | 0 | +1 | −1 | +74,8 % | aucune (le régime de bascule se ferme) |
| 2021-06-03 | −1 | 0 | +1 | 0 | 0 | +74,1 % | Signal faible |
| 2021-08-31 | −1 | 0 | +1 | 0 | 0 | +73,2 % | aucune |
| 2021-12-01 | −1 | −1 | +1 | 0 | −1 | +73,2 % | aucune |
| 2022-03-09 | −1 | −1 | 0 | 0 | −2 | +73,9 % | Rechute |
| 2022-06-02 | −1 | −1 | +1 | +1 | 0 | +74,0 % | Signal faible |
| 2022-08-30 | −1 | −1 | +1 | +1 | 0 | +73,7 % | aucune (le régime de rechute se ferme) |
| 2022-11-29 | −1 | −1 | 0 | 0 | −2 | +72,8 % | Rechute |
| 2023-03-07 | −1 | −1 | 0 | 0 | −2 | +72,4 % | aucune (régime de rechute) |
| 2023-05-31 | −1 | n.p. | +1 | 0 | 0 | +75,6 % | Signal faible |
| 2023-08-30 | −1 | n.p. | +1 | +1 | +1 | +75,0 % | aucune (le régime de rechute se ferme) |
| 2023-11-28 | −1 | n.p. | +1 | +1 | +1 | +75,2 % | aucune |

### Plug Power (industriel)

| Publication | D1 | D2 | D3 | D4 | Solde | Marge brute | Alerte |
|---|---|---|---|---|---|---|---|
| 2020-03-05 | +1 | n.p. | 0 | +1 | +2 | +14,0 % | aucune (première ligne) |
| 2020-05-07 | +1 | n.p. | 0 | +1 | +2 | −11,0 % | aucune : Bascule retenue, « vend à perte » |
| 2020-08-06 | −1 | n.p. | 0 | −1 | −2 | +7,5 % | Rechute |
| 2020-11-09 | +1 | n.p. | +1 | −1 | +1 | −1,2 % | Signal faible |
| 2021-02-25 | n.p. | n.p. | 0 | n.p. | 0 | non calculable | aucune (le régime de rechute se ferme) |
| 2021-06-22 | n.p. | n.p. | 0 | 0 | 0 | −16,9 % | aucune |
| 2021-08-05 | +1 | n.p. | +1 | −1 | +1 | −32,4 % | Signal faible |
| 2021-11-09 | −1 | n.p. | +1 | −1 | −1 | −21,6 % | aucune |
| 2022-03-01 | n.p. | n.p. | 0 | n.p. | 0 | −54,2 % | aucune |
| 2022-05-09 | n.p. | n.p. | 0 | −1 | −1 | −25,1 % | aucune |
| 2022-08-09 | −1 | n.p. | 0 | −1 | −2 | −21,5 % | Rechute |
| 2022-11-08 | +1 | n.p. | −1 | −1 | −1 | −24,4 % | aucune |
| 2023-03-01 | +1 | n.p. | 0 | +1 | +2 | −36,5 % | aucune : Bascule retenue, « vend à perte » |
| 2023-05-09 | +1 | n.p. | 0 | 0 | +1 | −33,0 % | aucune (le régime de rechute se ferme) |
| 2023-08-09 | +1 | n.p. | −1 | +1 | +1 | −30,0 % | aucune |
| 2023-11-09 | −1 | n.p. | n.p. | −1 | −2 | −69,4 % | Rechute |
| 2024-03-01 | −1 | n.p. | n.p. | −1 | −2 | −100,1 % | aucune (régime de rechute) |
| 2024-05-09 | −1 | n.p. | n.p. | −1 | −2 | −132,3 % | aucune (régime de rechute) |
| 2024-08-08 | −1 | n.p. | 0 | −1 | −2 | −91,6 % | aucune (régime de rechute) |
| 2024-11-12 | +1 | n.p. | −1 | +1 | +1 | −57,6 % | aucune |

### Fisker (pré-revenus)

Barreau 3 jusqu'au 9 mai 2023 (réservations avec acompte), barreau 5 à partir du 4 août 2023 (premières livraisons).

| Publication | D1 | D2 | D3 | D4 | Solde | Marge brute | Alerte |
|---|---|---|---|---|---|---|---|
| 2021-02-25 | n.p. | n.p. | 0 | n.p. | 0 | non calculable | aucune (première ligne) |
| 2021-05-17 | 0 | +1 | 0 | n.p. | +1 | non calculable | aucune |
| 2021-08-05 | 0 | +1 | 0 | n.p. | +1 | non calculable | aucune |
| 2021-11-03 | 0 | +1 | 0 | n.p. | +1 | non calculable | aucune |
| 2022-02-16 | 0 | +1 | 0 | n.p. | +1 | non calculable | aucune |
| 2022-05-04 | 0 | +1 | 0 | n.p. | +1 | non calculable | aucune |
| 2022-08-03 | 0 | +1 | 0 | n.p. | +1 | non calculable | aucune |
| 2022-11-02 | 0 | +1 | 0 | n.p. | +1 | non calculable | aucune |
| 2023-02-27 | 0 | +1 | 0 | n.p. | +1 | non calculable | aucune |
| 2023-05-09 | 0 | 0 | −1 | n.p. | −1 | non calculable | aucune |
| 2023-08-04 | +1 | +1 | −1 | n.p. | +1 | non calculable (précision 1) | Signal faible ; Bascule commerciale retenue |
| 2023-11-13 | +1 | 0 | n.p. | n.p. | +1 | −16,9 % | aucune ; Bascule commerciale retenue |
| 2024-02-29 | +1 | 0 | 0 | n.p. | +1 | −35,0 % | aucune ; Bascule commerciale retenue |
