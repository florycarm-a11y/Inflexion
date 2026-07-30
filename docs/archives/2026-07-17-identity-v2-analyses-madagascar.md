# Identité v2 — Plan d’implémentation du catalogue Analyses et de l’article Madagascar

> Date : 17 juillet 2026
> Objectif : appliquer la composition 02 hybride à analyses.html et analyse-madagascar-fragilite-ressources.html sans altérer le contenu analytique ni la signification des données SEMPLICE.
> Référence visuelle : https://claude.ai/code/artifact/c4219514-c155-4407-a98f-6262e198ff62
> Pages de référence :
> - https://inflexionhub.com/analyses.html
> - https://inflexionhub.com/analyse-madagascar-fragilite-ressources.html
> Spec à étendre : docs/superpowers/specs/2026-07-16-identity-v2-design.md

## 1. Résultat attendu

Le lot doit produire deux pages différentes mais visuellement parentes :

- analyses.html devient la référence du régime éditorial v2 ;
- l’article Madagascar réutilise cette grammaire éditoriale, mais adopte le régime instrument parce qu’il affiche des scores SEMPLICE ;
- le chrome de marque est sombre et strictement achromatique ;
- les contenus sont posés sur un papier chaud, structurés par une grille et des filets fins ;
- les angles droits remplacent les grandes cartes arrondies, les ombres diffuses, le verre et les vagues décoratives ;
- les états actifs sont noir/blanc ;
- les couleurs risque/opportunité ne servent qu’aux données SEMPLICE et restent accompagnées d’un libellé textuel.

Ce lot ne migre ni la chaîne React/Tailwind, ni les autres articles, ni le reste du site. Il crée toutefois les primitives partagées nécessaires à leur migration ultérieure.

## 2. Décisions d’architecture

### 2.1 Régimes visuels

| Page | Attribut | Motif |
|---|---|---|
| analyses.html | data-design-regime="editorial" | catalogue sans visualisation sémantique |
| analyse-madagascar-fragilite-ressources.html | data-design-regime="instrument" | contenu éditorial et mesures SEMPLICE sur la même page |

Les jetons de fondation sont déclarés sous les deux sélecteurs, jamais globalement dans :root. Les jetons SEMPLICE gardent leur contrat sémantique indépendant.

### 2.2 Palette

Fondations communes :

| Rôle | Valeur |
|---|---|
| Chrome | #0E1012 |
| Texte principal sur chrome | #E8E4D8 |
| Texte secondaire sur chrome | #9AA0A4 |
| Papier | #EDEBE4 |
| Module relevé | #FFFFFF |
| Texte principal | #101214 |
| Texte secondaire | #4C5052 |
| Filet | #4C5052 |

Règles :

- aucun vert emerald ni bronze ne reste une couleur de marque sur ces deux pages ;
- aucun remplacement global de littéraux hexadécimaux ;
- les catégories du catalogue sont textuelles et achromatiques dans ce lot ;
- un accent éditorial éventuel doit avoir un rôle nommé dans la spec avant emploi ;
- sur Madagascar, les niveaux de risque consomment uniquement --radar-risk-low, --radar-risk-mid, --radar-risk-high et --radar-risk-critical ;
- les opportunités consomment uniquement --radar-opportunity-low, --radar-opportunity-mid, --radar-opportunity-positive et --radar-opportunity-high ;
- --surface-incomplete et --rule-incomplete restent des fondations d’état sur papier : ils ne sont ni interdits, ni assimilés à une couleur de risque.

### 2.3 Typographie

- Titres et wordmark : Archivo 800.
- Corps : IBM Plex Sans 400/500/600.
- Données et métadonnées : IBM Plex Mono 400/500.

Ne pas publier les fichiers anonymisés de delta-v2/assets/fonts. Avant la production, identifier les polices, versionner leurs licences OFL et leur donner des noms explicites. Si ce contrôle n’est pas terminé, conserver une pile de secours système et ne pas simuler la police avec un fichier non identifié.

### 2.4 Partage de code

Créer uniquement les éléments réellement communs :

- assets/design-tokens-v2.css : jetons de fondation et contrats sémantiques ;
- assets/editorial-shell-v2.css : chrome, navigation, héros générique, footer, focus et responsive ;
- assets/analyses-v2.css : article du jour, filtres et grille du catalogue ;
- assets/article-v2.css : prose, métriques, tableaux, encadrés, sources et rail associé.

Conserver les composants React dans leur page :

- Navigation, Footer, PageHero, ArticleDuJour, les cartes et la logique de filtrage du catalogue ;
- Navigation, Footer, ArticleHero, ArticleContent, les cartes liées et le snapshot SEMPLICE de Madagascar.

Les deux pages utilisent les mêmes noms de classes et le même contrat CSS pour le shell, mais aucune nouvelle abstraction JavaScript n’est introduite dans ce lot. Une extraction React ne devient utile qu’à partir d’une troisième page migrée.

Ne pas copier country-v2.css en production et ne pas utiliser nav-shared.js sur ces deux pages React.

## 3. Invariants éditoriaux et fonctionnels

### analyses.html

- 14 analyses, dans le même ordre, avec les mêmes titres, résumés, images, catégories, dates, auteurs et destinations ;
- 6 filtres : Tout, IA & Tech, Géopolitique, Marchés, Crypto et Matières Premières ;
- 14 résultats pour Tout, 10 pour Géopolitique, 2 pour Marchés, 2 pour IA & Tech, 0 pour Crypto et 0 pour Matières Premières ;
- le lien Madagascar reste analyse-madagascar-fragilite-ressources.html ;
- l’ancre cas-usage, actuellement visée par plusieurs pages du site, doit être ajoutée à la section catalogue ;
- data/article-du-jour.json continue d’alimenter le module quotidien ;
- aucune fausse destination ne doit être inventée lorsque le JSON quotidien ne fournit pas d’URL.

### Article Madagascar

- métadonnées du héros, quatre chiffres clés, synthèse, thèse centrale, cinq chapitres, matrice d’impact, recommandations à trois horizons, tableaux risque et opportunité, alertes, disclaimer AMF, sources et articles liés ;
- texte, chiffres, sources et disclaimer inchangés pendant le lot visuel, hors corrections explicitement arbitrées dans ce plan ;
- 8 dimensions risque plus le composite 4,6/7 ;
- 8 dimensions opportunité plus le composite 2,0/7 ;
- 20 liens de sources visibles, tous ouverts avec noopener noreferrer ;
- 3 articles liés et le lien retour vers analyses.html ;
- aucune information portée uniquement par une couleur ou une flèche.

## 4. Arbitrages à figer avant la migration réelle

### 4.1 Temps de lecture

Le catalogue annonce actuellement 11 minutes et l’article 18 minutes.

Décision recommandée : considérer l’article comme canonique et aligner la carte du catalogue sur 18 minutes. Cette correction doit être isolée dans le journal des changements éditoriaux, pas dissimulée dans un remplacement de styles.

### 4.2 Snapshot SEMPLICE

L’article publié est un instantané v2.1 daté de mars 2026 :

- Information : 3,5/7 ;
- composite risque : 4,6/7 ;
- composite opportunité : 2,0/7.

La configuration SEMPLICE courante de main utilise désormais Intelligence artificielle à 5,5/7 et produit environ 4,9/7 avec les poids v3.

Décision recommandée :

- garder l’article comme snapshot historique v2.1 ;
- ne pas le brancher sur semplice-zones-config.js ;
- ajouter dans le code une métadonnée explicite de version et de date ;
- vérifier ses valeurs contre data/semplice/evaluations-test-v2/madagascar-v2.json ;
- traiter une éventuelle mise à jour v3 comme une révision éditoriale distincte.

### 4.3 Scénarios et sources

La règle projet demande des scénarios SEMPLICE complets, mais l’article n’en contient pas. Le titre annonce aussi 35+ sources alors que 20 liens sont affichés et plusieurs mènent à des pages d’accueil génériques.

Ces écarts sont des dettes éditoriales, pas des décisions graphiques. Les consigner dans un ticket séparé. Ne pas inventer de scénarios, de sources ou de chiffres pendant le redesign.

### 4.4 Liste fermée des deltas d’entretien

Avant de figer le manifeste de contenu, Codex présente cette liste au commanditaire et consigne la décision. La liste maximale recommandée est :

1. temps de lecture Madagascar : 11 vers 18 minutes dans le catalogue ;
2. lien Sahel : analyses.html vers analyse-sahel-mali-niger-burkina-crise.html ;
3. retrait ou neutralisation des liens sociaux et Contact factices dans les deux footers ;
4. correction analysis.html vers analyses.html dans sitemap.xml et scripts/check-french.py, puis ajout de l’article Madagascar.

Si un delta est refusé, le code et le test gardent la valeur actuelle. Aucun autre changement du corpus éditorial analytique — titres, chapô, corps, chiffres, scores, sources, nomenclature et destinations — n’est autorisé dans ce lot.

Les seuls ajouts de texte d’interface autorisés sont inventoriés séparément :

- métadonnée SEMPLICE v2.1 · snapshot mars 2026 ;
- libellés de tendance Hausse et Stable associés aux flèches ;
- captions et intitulés accessibles des tableaux ;
- états Chargement, Indisponible et Données invalides du module Article du jour ;
- contenu de secours de #app, textes alternatifs d’images et libellés ARIA nécessaires.

---

## Phase 0 — Repartir d’une base propre et actuelle

### Task 0.1 — Préserver les travaux v2 et resynchroniser la branche

État observé le 17 juillet 2026 :

- branche codex/delta-computationnel-v2 ;
- 28 commits derrière main et 2 commits devant ;
- spec, plan Radar Pays et prototypes encore non suivis ;
- checkout sparse ne matérialisant pas scripts, .github et assets.

Actions :

- [ ] Vérifier git status et ne pas écraser les modifications de l’utilisateur.
- [ ] Créer une branche dédiée codex/identity-v2-analyses-madagascar.
- [ ] Sauvegarder ou commiter sur cette branche la spec, le plan Radar Pays et prototypes/ avant tout rebase.
- [ ] Matérialiser scripts, .github et assets avec le sparse checkout.
- [ ] Récupérer main puis rebaser la branche dédiée.
- [ ] Résoudre les conflits en conservant les contenus et données de main.
- [ ] Refaire l’inventaire des 14 cartes et des scores Madagascar après rebase.

Contrôles :

~~~bash
git status --short
git switch -c codex/identity-v2-analyses-madagascar
git rev-list --left-right --count main...HEAD
git sparse-checkout add scripts .github assets
git diff --check
~~~

Ne pas démarrer le redesign sur le snapshot actuel tant que cette phase n’est pas terminée.

### Task 0.2 — Capturer l’existant

- [ ] Servir le dépôt en HTTP local.
- [ ] Capturer les deux pages locales et les deux pages de production à 360, 768, 1280 et 1440 px.
- [ ] Pour analyses.html, capturer le héros, l’article du jour, Tout, Marchés, un filtre vide et le menu mobile.
- [ ] Pour Madagascar, capturer le héros, les quatre métriques, une section longue, la matrice, les deux tableaux SEMPLICE, le disclaimer, les sources et les articles liés.
- [ ] Noter les erreurs console, les images cassées et les ressources CDN en échec.
- [ ] Conserver les captures hors de l’artefact GitHub Pages ou dans un dossier de preuve explicitement exclu du déploiement.

Référence observée en production :

- le filtre Marchés affiche correctement 2 analyses et Tout en affiche 14 ;
- le héros et le chrome sont encore emerald/bronze ;
- le premier article lié de Madagascar présente actuellement une image cassée ;
- le tableau SEMPLICE tient dans la page mobile grâce à un conteneur défilable, mais le rail associé disparaît entièrement.

### Task 0.3 — Appliquer les deltas d’entretien approuvés

Fichiers possibles :

- Modify: analyses.html
- Modify: analyse-madagascar-fragilite-ressources.html
- Modify: sitemap.xml
- Modify: scripts/check-french.py

Actions :

- [ ] Appliquer uniquement les éléments acceptés de la liste fermée.
- [ ] Regrouper ces changements dans un commit d’entretien distinct du redesign.
- [ ] Vérifier manuellement chaque ancienne et nouvelle valeur.
- [ ] Ne changer aucune classe visuelle dans ce commit.

### Task 0.4 — Figer un manifeste de contenu après arbitrage

Fichiers :

- Create: scripts/tests/fixtures/analyses-madagascar-content-contract.json
- Create: scripts/tests/analyses-page.test.mjs
- Create: scripts/tests/madagascar-article.test.mjs
- Modify: scripts/tests/run-tests.sh

Créer avant le changement visuel une fixture JSON unique qui enregistre l’état attendu après application des seuls deltas approuvés :

- les 14 identifiants du catalogue et leurs champs importants ;
- les 6 filtres et leurs comptes ;
- les 4 chiffres clés Madagascar ;
- les 8 scores risque, le composite et les tendances ;
- les 8 scores opportunité et le composite ;
- le texte exact du disclaimer ;
- les 20 URL de sources ;
- les 3 destinations d’articles liés ;
- la liste des ajouts de texte d’interface autorisés.

La fixture contient aussi sa version de schéma, la liste exacte des deltas approuvés et leur valeur avant/après. Les deux tests lisent cette fixture ; ils ne recopient pas ses valeurs dans leur code.

Dans le même commit d’entretien :

- [ ] ajouter les deux tests de contenu au runner ;
- [ ] exécuter les deux tests ciblés et le runner ;
- [ ] faire échouer tout changement du corpus analytique absent de la fixture.

Contrôles minimaux de ce commit :

~~~bash
node --test scripts/tests/analyses-page.test.mjs
node --test scripts/tests/madagascar-article.test.mjs
bash scripts/tests/run-tests.sh
~~~

---

## Phase 1 — Étendre la spec et créer les fondations

### Task 1.1 — Étendre la spec aux pages éditoriales

Fichier à modifier :

- docs/superpowers/specs/2026-07-16-identity-v2-design.md

Actions :

- [ ] Remplacer la règle limitant les fondations au seul régime instrument par une portée commune aux régimes editorial et instrument.
- [ ] Confirmer que les jetons SEMPLICE restent un contrat distinct.
- [ ] Nommer les éventuels rôles d’accent éditorial.
- [ ] Inscrire que les catégories du catalogue restent achromatiques dans ce lot.
- [ ] Ajouter les primitives éditoriales : héros, carte, métadonnées, métriques, callouts, tableaux, sources et rail lié.
- [ ] Documenter la règle du snapshot historique pour les articles datés.

Structure attendue :

~~~css
[data-design-regime="editorial"],
[data-design-regime="instrument"] {
  --chrome-ground: #0E1012;
  --chrome-text: #E8E4D8;
  --chrome-dim: #9AA0A4;
  --surface-page: #EDEBE4;
  --surface-raised: #FFFFFF;
  --surface-incomplete: #DFDCD0;
  --rule-incomplete: #9B957A;
  --text-primary: #101214;
  --text-secondary: #4C5052;
  --border-hairline: #4C5052;
}
~~~

### Task 1.2 — Versionner les polices et licences

Fichiers à créer ou compléter :

- assets/fonts/README.md
- assets/fonts/OFL-Archivo.txt
- assets/fonts/OFL-IBMPlex.txt
- fichiers WOFF2 nommés explicitement

Actions :

- [ ] Identifier chaque fichier par ses métadonnées.
- [ ] Vérifier la licence de redistribution.
- [ ] Conserver uniquement les graisses réellement utilisées.
- [ ] Déclarer font-display: swap.
- [ ] Prévoir une pile de secours lisible.

Critère d’arrêt : aucun fichier font-03, font-08 ou font-14 anonymisé ne part en production.

### Task 1.3 — Créer les feuilles partagées

Fichiers :

- Create or Modify: assets/design-tokens-v2.css
- Create: assets/editorial-shell-v2.css
- Create: assets/analyses-v2.css
- Create: assets/article-v2.css

Actions :

- [ ] Extraire tous les littéraux de palette v2 dans design-tokens-v2.css.
- [ ] Garder les jetons de fondation hors de :root.
- [ ] Définir ou réutiliser dans :root les contrats SEMPLICE existants --radar-* sans changer leurs valeurs ; si le pilote Radar Pays les a déjà créés, ne pas les dupliquer.
- [ ] Définir une grille 12 colonnes, un conteneur partagé et des filets à 1 px.
- [ ] Définir des états focus visibles à au moins 3:1.
- [ ] Définir une réduction de mouvement complète.
- [ ] Éviter les rayons décoratifs, les grandes ombres et les gradients de marque.
- [ ] Ne laisser dans le JSX que les classes structurelles indispensables ; aucune couleur arbitraire Tailwind ne doit rester la source de vérité visuelle.

---

## Phase 2 — Prototyper avant de toucher la production

### Task 2.1 — Prototype du catalogue

Fichiers :

- Create: prototypes/identity-v2/analyses.html

Le prototype charge directement ../../assets/design-tokens-v2.css, ../../assets/editorial-shell-v2.css et ../../assets/analyses-v2.css. Il ne maintient pas une copie de ces feuilles.

Composition attendue :

1. chrome noir compact avec wordmark clair ;
2. héros noir asymétrique, kicker mono et titre NOS ANALYSES massif ;
3. module Article du jour posé entre chrome et papier ;
4. barre de filtres noire/blanche avec compteur ;
5. grille éditoriale 3 colonnes desktop, 2 tablette, 1 mobile ;
6. cartes rectangulaires, images recadrées, filets et métadonnées mono ;
7. états vides rédigés, sans couleur de catégorie décorative ;
8. footer papier séparé par un filet.

Le prototype doit employer un échantillon représentatif mais ne doit pas recopier toute la logique de production.

### Task 2.2 — Prototype de l’article Madagascar

Fichiers :

- Create: prototypes/identity-v2/madagascar.html

Le prototype charge directement ../../assets/design-tokens-v2.css, ../../assets/editorial-shell-v2.css et ../../assets/article-v2.css. Il ne maintient pas une copie de ces feuilles.

Composition attendue :

1. héros noir sans vague ni parallax ;
2. catégorie, région, date, auteur, version SEMPLICE et temps de lecture en mono ;
3. titre massif mais lisible à 360 px ;
4. bandeau de quatre métriques à filets, sans tuiles emerald ;
5. colonne de lecture de 68 à 75 caractères ;
6. chapitres numérotés et ancres stables ;
7. callouts risk, strategic et neutral clairement nommés ;
8. bloc SEMPLICE blanc, distinct du papier, avec couleurs sémantiques réservées aux scores ;
9. sommaire et articles liés dans un rail desktop, puis après l’article sur mobile ;
10. disclaimer et sources inchangés.

### Task 2.3 — Gate de validation

- [ ] Capturer les deux prototypes à 360, 768, 1280 et 1440 px.
- [ ] Comparer avec la composition 02 de l’artefact.
- [ ] Valider la séparation chrome/papier/donnée.
- [ ] Vérifier que les pages ressemblent à la même marque sans transformer l’article en tableau de bord.
- [ ] Obtenir l’état approuvé, approuvé avec corrections ou rejeté.

La production ne change pas avant validation des deux prototypes.

---

## Phase 3 — Appliquer le shell CSS partagé

### Task 3.1 — Raccorder les deux pages aux fondations

Fichiers :

- Modify: analyses.html
- Modify: analyse-madagascar-fragilite-ressources.html

Actions :

- [ ] Charger design-tokens-v2.css et editorial-shell-v2.css avant la feuille propre à la page.
- [ ] Ajouter l’attribut de régime sur body.
- [ ] Conserver les composants React locaux et leur donner le même balisage sémantique et les mêmes classes de shell.
- [ ] Garder Navigation, Footer et les cartes dans chaque fichier pour limiter le risque de régression.
- [ ] Garder les métadonnées SEO, le logo, les favicons et les URL publiques.
- [ ] Ajouter un contenu de secours visible dans #app si React ou un CDN ne se charge pas.
- [ ] Conserver le skip link et le rendre visible au focus.
- [ ] Vérifier que les deux footers reflètent les décisions de la liste d’entretien et ne réintroduisent aucun href="#" retiré.

Ne pas migrer vers Vite, npm ou un rendu serveur dans ce lot.

### Task 3.2 — Mettre les deux navigations au même niveau fonctionnel

- [ ] Fournir une navigation directe de secours si window.MEGA_NAV est absent ou invalide.
- [ ] Utiliser de vrais boutons pour ouvrir les mega menus.
- [ ] Gérer hover, focus, clic, Échap et aria-expanded.
- [ ] Piéger le focus dans le menu mobile et le rendre au bouton à la fermeture.
- [ ] Restaurer proprement le scroll du body.
- [ ] Fermer le menu lors d’un changement de largeur ou d’une navigation.
- [ ] Appliquer exactement le même comportement sur les deux copies locales.

---

## Phase 4 — Migrer analyses.html

### Task 4.1 — Recomposer le héros et le catalogue

Fichiers :

- Modify: analyses.html
- Modify: assets/analyses-v2.css

Actions :

- [ ] Remplacer le héros emerald par le héros noir validé.
- [ ] Supprimer le filet bronze supérieur.
- [ ] Utiliser Archivo pour le titre et IBM Plex Mono pour le kicker.
- [ ] Afficher dynamiquement le nombre total d’analyses et le nombre d’univers, sans dupliquer 14 dans le HTML.
- [ ] Ajouter id="cas-usage" à la section catalogue.
- [ ] Transformer les cartes en modules rectangulaires à filets.
- [ ] Préserver l’ordre, les images, les titres et les href.
- [ ] Ajouter une image de repli neutre en cas d’échec réseau.
- [ ] Garder les catégories sous forme de texte, sans badges multicolores.
- [ ] Utiliser un hover sobre qui ne déplace pas fortement la mise en page.

### Task 4.2 — Rendre les filtres accessibles

- [ ] Utiliser un groupe de boutons avec libellé accessible.
- [ ] Ajouter aria-pressed sur chaque filtre.
- [ ] Ajouter aria-live="polite" au compteur.
- [ ] Conserver un état vide explicite pour Crypto et Matières Premières.
- [ ] Garantir une cible tactile de 44 px.
- [ ] À 360 px, autoriser le retour à la ligne ou un défilement horizontal annoncé, sans débordement du body.
- [ ] Ne pas remettre le filtre à Tout lors d’un simple rerender.

### Task 4.3 — Fiabiliser ArticleDuJour

États à rendre :

- chargement ;
- succès ;
- indisponible ;
- JSON invalide ou incomplet.

Actions :

- [ ] Vérifier la forme du JSON avant rendu.
- [ ] Ne plus faire disparaître silencieusement toute la section.
- [ ] Parser YYYY-MM-DD sans décalage de fuseau horaire.
- [ ] Limiter visuellement les points clés et tags comme aujourd’hui.
- [ ] Ne rendre un CTA que si une URL valide est réellement fournie.
- [ ] Conserver un message neutre et non bloquant si la donnée manque.

### Task 4.4 — Corriger les métadonnées couplées

- [ ] Vérifier que le temps de lecture Madagascar correspond à la décision d’entretien.
- [ ] Vérifier que la carte Madagascar ouvre le bon article.
- [ ] Préserver toutes les métadonnées des 13 autres cartes.

---

## Phase 5 — Migrer l’article Madagascar

### Task 5.1 — Recomposer le héros et les métriques

Fichiers :

- Modify: analyse-madagascar-fragilite-ressources.html
- Modify: assets/article-v2.css

Actions :

- [ ] Remplacer le héros emerald, son gradient et ses vagues par un chrome noir stable.
- [ ] Supprimer le parallax de défilement ; si un mouvement résiduel est conservé, le couper aussi en JavaScript avec prefers-reduced-motion.
- [ ] Conserver le titre, le chapô et les métadonnées.
- [ ] Afficher explicitement SEMPLICE v2.1 · snapshot mars 2026.
- [ ] Rendre les quatre chiffres clés en bandeau à filets sur papier ou blanc.
- [ ] Garder les trois mesures non SEMPLICE achromatiques.
- [ ] Appliquer au score 4,6/7 le contrat de risque et le libellé Élevé.

### Task 5.2 — Structurer la lecture longue

- [ ] Limiter la colonne principale à 68–75 caractères.
- [ ] Donner un id stable à chaque chapitre et sous-section structurante.
- [ ] Générer un sommaire depuis une liste déclarative locale, pas en parcourant le DOM après rendu.
- [ ] Garder le rail sticky sous la navigation sur desktop.
- [ ] Afficher le sommaire puis les articles liés après le contenu sur mobile.
- [ ] Préserver les cinq chapitres et leur ordre.
- [ ] Transformer les encadrés existants en variantes nommées risk, strategic et neutral.
- [ ] Garder la matrice d’impact comme tableau sémantique.
- [ ] Présenter les recommandations en trois blocs temporels lisibles.

### Task 5.3 — Rendre le bloc SEMPLICE conforme

- [ ] Garder les scores v2.1 dans une constante locale versionnée.
- [ ] Ajouter date, version et source du snapshot à proximité du titre du bloc.
- [ ] Rendre les tableaux depuis cette constante pour éviter la duplication des valeurs.
- [ ] Ajouter caption et scope aux tableaux.
- [ ] Remplacer les flèches seules par Hausse ou Stable, avec flèche décorative aria-hidden.
- [ ] Appliquer les classes risk-low, risk-mid, risk-high, risk-critical et les classes opportunité correspondantes en consommant exclusivement les jetons --radar-*.
- [ ] Afficher les classifications en texte.
- [ ] Ne pas utiliser une couleur éditoriale dans le module SEMPLICE.
- [ ] Garder les tableaux navigables et lisibles à 360 px.

Ne pas recalculer le snapshot avec les poids v3 pendant cette tâche.

### Task 5.4 — Fiabiliser les sources et les articles liés

- [ ] Conserver le disclaimer AMF mot pour mot.
- [ ] Vérifier target="_blank" et rel="noopener noreferrer" sur les 20 sources.
- [ ] Ne pas remplacer les URL génériques sans revue éditoriale sourcée.
- [ ] Vérifier la destination Sahel attendue après le commit d’entretien.
- [ ] Ajouter une solution de repli aux images liées.
- [ ] Donner un texte alternatif utile aux images informatives ; conserver alt vide seulement si l’image est réellement décorative.
- [ ] Rendre les trois articles liés accessibles aussi sur mobile.
- [ ] Vérifier qu’aucun lien social ou Contact factice retiré dans le commit d’entretien n’est réintroduit.

---

## Phase 6 — Tests automatisés et QA

### Task 6.1 — Ajouter les tests de contrat

Fichiers :

- Create: scripts/tests/editorial-v2-contract.test.mjs
- Modify: scripts/tests/analyses-page.test.mjs
- Modify: scripts/tests/madagascar-article.test.mjs
- Modify: scripts/tests/run-tests.sh
- Modify if needed: .github/workflows/ci.yml

État observé avant le travail :

- scripts/tests/run-tests.sh ne lance qu’un seul fichier de test ;
- le job test-scripts de la CI énumère ses fichiers un par un et n’appelle pas ce runner.

La Task 0.4 raccorde déjà les deux contrats de contenu au runner, mais celui-ci reste partiel. Dans cette phase :

- [ ] faire du runner la source unique du lot scripts avec node --test scripts/tests/*.test.mjs scripts/tests/lib/*.test.mjs ;
- [ ] remplacer la liste du job test-scripts par bash scripts/tests/run-tests.sh ;
- [ ] vérifier que les tests historiques et les trois nouveaux contrats sont tous découverts ;
- [ ] adapter ces actions si main a déjà corrigé cette architecture pendant le rebase, sans dupliquer les commandes.

editorial-v2-contract.test.mjs doit vérifier :

- fondations sous editorial et instrument, pas dans :root ;
- valeurs exactes de la palette ;
- absence des anciens verts/bronzes dans les seuls sélecteurs de chrome, de héros, de footer et de contrôles actifs ; les contrats SEMPLICE sont explicitement exclus de ce contrôle ;
- présence de reduced-motion et focus-visible ;
- absence de dépendance à country-v2.css.

analyses-page.test.mjs doit vérifier :

- les entrées, filtres et comptes attendus en lisant la fixture de contenu ;
- présence de cas-usage ;
- destination Madagascar ;
- états ArticleDuJour ;
- aria-pressed, aria-live et fallback React ;
- temps de lecture Madagascar conforme à la fixture approuvée ;
- aucune destination interne manquante.

madagascar-article.test.mjs doit vérifier :

- chiffres clés, dimensions, composites, version, date, disclaimer, sources et articles liés en lisant la même fixture ;
- attributs de sécurité des liens externes ;
- destination Sahel conforme à la décision enregistrée ;
- traitement des href="#" conforme à la décision d’entretien ;
- captions, scopes et libellés de tendance.

### Task 6.2 — Vérifier les fichiers de découverte

Fichiers :

- Modify: sitemap.xml
- Modify: scripts/check-french.py

Actions :

- [ ] Confirmer qu’analysis.html a été remplacé par analyses.html dans le sitemap et la liste d’audit si ce delta a été approuvé.
- [ ] Confirmer que l’article Madagascar figure dans le sitemap si ce delta a été approuvé.
- [ ] Confirmer qu’analyses.html et l’article Madagascar figurent dans la liste d’audit linguistique si ce delta a été approuvé.
- [ ] Vérifier que toutes les URL internes existent.

### Task 6.3 — QA manuelle proportionnée

Largeurs :

- 360 px ;
- 768 px ;
- 1280 px ;
- 1440 px.

Scénarios communs :

- [ ] aucun débordement horizontal du body ;
- [ ] navigation clavier complète ;
- [ ] mega menus utilisables au clavier et à la souris ;
- [ ] menu mobile : ouverture, fermeture, Échap, focus et scroll ;
- [ ] cibles tactiles de 44 px ;
- [ ] contraste AA pour le texte et 3:1 pour les éléments graphiques significatifs ;
- [ ] aucune erreur ou alerte console ;
- [ ] comportement correct sans animation ;
- [ ] images chargées ou fallback visible ;
- [ ] aucun vert/bronze utilisé comme couleur de marque.

Scénarios analyses :

- [ ] Tout = 14 ;
- [ ] Géopolitique = 10 ;
- [ ] Marchés = 2 ;
- [ ] IA & Tech = 2 ;
- [ ] Crypto = 0 ;
- [ ] Matières Premières = 0 ;
- [ ] JSON quotidien valide, absent et invalide ;
- [ ] ancre analyses.html#cas-usage fonctionnelle.

Scénarios Madagascar :

- [ ] quatre métriques ;
- [ ] cinq chapitres ;
- [ ] sommaire et rail sticky ;
- [ ] trois tableaux utilisables sur mobile ;
- [ ] scores et classifications inchangés ;
- [ ] disclaimer et 20 sources ;
- [ ] articles liés visibles sur mobile ;
- [ ] couleur jamais seule porteuse d’un niveau.

Commandes :

~~~bash
node --test scripts/tests/editorial-v2-contract.test.mjs
node --test scripts/tests/analyses-page.test.mjs
node --test scripts/tests/madagascar-article.test.mjs
python3 scripts/check-french.py --file analyses.html
python3 scripts/check-french.py --file analyse-madagascar-fragilite-ressources.html
bash scripts/tests/run-tests.sh
git diff --check
~~~

L’audit linguistique peut s’ignorer proprement si sa clé API n’est pas disponible ; les tests statiques et bash scripts/tests/run-tests.sh sont obligatoires.

---

## Phase 7 — Déploiement, vérification et rollback

### Task 7.1 — Découper les commits

Ordre recommandé :

1. deltas d’entretien approuvés et manifeste de contenu ;
2. spec, fontes, jetons et CSS partagés ;
3. prototypes validés ;
4. redesign analyses.html ;
5. redesign Madagascar ;
6. tests finaux et raccord CI si nécessaire.

Chaque commit doit être autonome et passer ses tests ciblés.

### Task 7.2 — Vérifier après déploiement

- [ ] Ouvrir les deux URL publiques sans cache.
- [ ] Vérifier les ressources CSS, JS, fontes, images et JSON dans le réseau.
- [ ] Rejouer Tout, Marchés, un filtre vide et le menu mobile.
- [ ] Vérifier le bloc SEMPLICE, le disclaimer et les liens externes.
- [ ] Vérifier analyses.html#cas-usage depuis au moins une page legacy.
- [ ] Contrôler la console sur desktop et mobile.
- [ ] Comparer les captures de production aux prototypes approuvés.

### Task 7.3 — Rollback

Le rollback d’une page se fait par revert de son commit dédié :

- revert du commit analyses pour restaurer uniquement le catalogue ;
- revert du commit Madagascar pour restaurer uniquement l’article ;
- conserver les fondations partagées si l’autre page les consomme ;
- ne pas tenter un rollback en supprimant seulement data-design-regime.

Les modifications de scores, de sources ou de nomenclature SEMPLICE ne doivent jamais être incluses dans un rollback graphique.

## 8. Definition of Done

Le lot est terminé lorsque :

- les deux prototypes ont été validés ;
- les deux pages utilisent la composition 02 hybride ;
- analyses.html est le pilote éditorial v2 et Madagascar le pilote article instrumenté ;
- les 14 cartes, les filtres et ArticleDuJour fonctionnent dans tous leurs états ;
- le contenu Madagascar, son snapshot v2.1, ses sources et son disclaimer sont préservés ;
- les écarts 11/18 min et Sahel ont reçu une décision explicite ;
- navigation, focus, mobile et reduced-motion sont conformes ;
- les contrastes et débordements sont validés aux quatre largeurs ;
- les tests ciblés et le runner complet passent ;
- sitemap.xml ne référence plus analysis.html si ce delta d’entretien a été approuvé ;
- aucune couleur v1 ne reste une couleur de marque sur ces deux pages ;
- aucun changement éditorial ou SEMPLICE non approuvé n’est caché dans le diff.
