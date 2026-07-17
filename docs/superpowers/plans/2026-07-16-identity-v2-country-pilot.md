# Identité v2 — Plan d'implémentation du pilote Radar Pays

> **Objectif :** valider la composition 02 hybride sur `country.html`, puis migrer l'identité du site sans altérer l'encodage analytique.
> **Spec :** `docs/superpowers/specs/2026-07-16-identity-v2-design.md`
> **Prototype visuel :** `prototypes/identity-v2/country.html`, `country-v2.css` et `country-v2-runtime.js`
> **Portée :** plan exécutable du pilote + séquençage global. Chaque lot de migration globale recevra son propre plan après validation du pilote.

## Architecture

La migration est volontairement séparée en trois couches :

1. **Sémantique** — nommer les couleurs de risque, opportunité, horizons, archives et séries sans changer leurs valeurs.
2. **Identité** — appliquer le chrome sombre et les surfaces papier via des jetons partagés.
3. **Déploiement** — migrer les pages par familles après validation visuelle et fonctionnelle du pilote.

Cette séparation empêche un changement de marque de recolorer silencieusement une donnée. Aucun remplacement global de `#006650`, `#33B894`, `#C8955A` ou `#DC2626` n'est autorisé.

## Périmètre

### Inclus

- spec DA v2 versionnée ;
- prototype isolé de Radar Pays ;
- extraction des couleurs sémantiques SEMPLICE ;
- migration réelle de `country.html` après validation du prototype ;
- filet de QA visuelle et fonctionnelle ;
- séquençage de la migration globale ;
- actifs de marque, licences et documentation nécessaires à la publication.

### Exclus du pilote

- modification des scores, poids ou seuils SEMPLICE ;
- harmonisation immédiate des échelles à 4 et 6 paliers ;
- branchement de nouvelles données ;
- fusion du prototype `delta-v2/` dans la production ;
- migration de `index.html` avant validation des pages instrumentées.
- publication du prototype dans l'artefact GitHub Pages.

## État initial et garde-fous

- La branche `codex/delta-computationnel-v2` est basée sur `2019253` et a 28 commits de retard sur `main` au 16 juillet 2026.
- `main` contient SEMPLICE v3 alors que le prototype Delta annonce encore v2.1. La migration réelle doit partir d'une branche resynchronisée.
- Sur `main`, `semplice-zones-config.js` dépend de `semplice-composite.js` : son chargement doit être ajouté au prototype lors de la resynchronisation.
- `country.html` charge Tailwind CDN, `styles.css`, des hex inline et `nav-shared.js`.
- `semplice-country.js` contient une échelle risque à 6 paliers et une échelle opportunité à 4 paliers.
- `semplice-radar.js` utilise deux échelles à 4 paliers.
- Le premier polygone de la feature GeoJSON `mexique` possède un niveau de tableau superflu. Leaflet lève une exception et interrompt aujourd'hui l'initialisation de `country.html`.
- La CI actuelle ne constitue pas un test visuel du front et n'est pas déclenchée par `codex/*`.
- `npm test` n'existe pas dans le `package.json` racine de cette branche : utiliser les commandes ciblées ci-dessous.

---

## Phase 0 — Repartir d'une base actuelle

### Task 0.1 — Préserver le prototype et resynchroniser la branche d'implémentation

**But :** ne pas implémenter la production sur le snapshot SEMPLICE obsolète.

- [ ] Vérifier que `prototypes/identity-v2/`, la spec et ce plan sont commités ou sauvegardés.
- [ ] Récupérer `main` puis rebaser une branche dédiée `codex/identity-v2-country-pilot`.
- [ ] Matérialiser les dossiers suivis nécessaires avant toute lecture ou modification : `git sparse-checkout add scripts .github` — et les autres chemins manquants révélés par le rebase — afin de ne pas recréer des fichiers existants hors du cône courant.
- [ ] Résoudre les éventuels changements SEMPLICE en préservant les données de `main`.
- [ ] Charger `semplice-composite.js` avant `semplice-zones-config.js` dans le prototype si la dépendance existe après rebase.
- [ ] Recompter les dimensions, zones et scripts réellement chargés par `country.html`.
- [ ] Aligner les libellés de filtres statiques du prototype sur `SEMPLICE_DIM_LABELS` après rebase — notamment remplacer `Information` par `Intelligence artificielle` si la nomenclature v3 de `main` est conservée — puis générer ces options depuis cette source unique lors du passage en production.
- [ ] Vérifier que le workflow Pages ne copie pas `prototypes/`.

Commandes de contrôle :

```bash
git status --short
git rev-list --left-right --count main...HEAD
git diff --check
```

Attendu : base actuelle, aucune suppression de données, prototype toujours isolé.

---

## Phase 1 — Figer une référence visuelle

### Task 1.1 — Captures de l'existant

**Fichiers :** aucun fichier de production modifié.

- [ ] Servir le dépôt avec `npx serve .` ou un serveur HTTP local équivalent.
- [ ] Capturer `country.html` aux quatre largeurs de référence : 360, 768, 1280 et 1440 px.
- [ ] Capturer les deux modes de carte, une fiche survolée, le scatter, la timeline et le tableau.
- [ ] Capturer aussi le radar d'`expertise.html` à 360 et 1440 px avant de modifier `semplice-radar.js`.
- [ ] Noter les erreurs console et les requêtes JSON/CDN en échec.

Attendu : un dossier de référence non versionné ou des snapshots de test explicitement versionnés.

### Task 1.2 — Valider le prototype `prototypes/identity-v2/country.html`

- [ ] Comparer le prototype à la composition 02 de l'artefact.
- [ ] Valider la séparation chrome/papier, la densité, les angles droits et la typographie.
- [ ] Recueillir l'arbitrage utilisateur : approuvé, approuvé avec corrections, ou rejeté.

Le travail de production s'arrête ici tant que la direction visuelle n'est pas approuvée.

---

## Phase 2 — Extraire les couleurs sémantiques sans changer un pixel

### Task 2.1 — Créer les jetons partagés

**Fichiers :**

- Create: `assets/design-tokens-v2.css`
- Modify: `country.html`
- Modify: `expertise.html`

- [ ] Définir les jetons de fondation et les jetons SEMPLICE de la spec.
- [ ] Charger le fichier après `styles.css`, avant les styles propres à la page.
- [ ] Ne remplacer dans cette tâche que les couleurs dont le rôle est certain.

Structure minimale :

```css
:root {
  --country-risk-1: #006650;
  --country-risk-2: #33B894;
  --country-risk-3: #F59E0B;
  --country-risk-4: #EA580C;
  --country-risk-5: #DC2626;
  --country-risk-6: #991B1B;
  --country-opportunity-na: #D1D5DB;
  --country-opportunity-3: #A7F3D0;
  --country-opportunity-4: #33B894;
  --country-opportunity-5: #006650;

  --radar-risk-low: #006650;
  --radar-risk-mid: #C8955A;
  --radar-risk-high: #F59E0B;
  --radar-risk-critical: #DC2626;
  --radar-opportunity-low: #DC2626;
  --radar-opportunity-mid: #C8955A;
  --radar-opportunity-positive: #33B894;
  --radar-opportunity-high: #006650;
}

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
```

Attendu : aucun changement visuel à ce stade.

### Task 2.2 — Faire consommer les jetons CSS par les Canvas et Leaflet

**Fichiers :**

- Modify: `semplice-country.js`
- Modify: `semplice-radar.js`
- Test: `scripts/tests/semplice-color-contract.test.mjs`

- [ ] Ajouter un helper local qui lit une variable CSS et échoue explicitement si elle est vide.
- [ ] Construire une palette en mémoire au début de l'initialisation.
- [ ] Remplacer les littéraux des échelles risque/opportunité par les deux contrats distincts `country-*` et `radar-*`.
- [ ] Remplacer les couleurs de lignes risque/opportunité des Canvas par les jetons correspondants.
- [ ] Conserver séparément `zone.color`, qui identifie une série et non un niveau de risque.
- [ ] Préserver volontairement l'échelle 6/4 de Radar Pays et les deux échelles 4 paliers du radar de méthodologie ; ouvrir une tâche analytique distincte si elles doivent être harmonisées.

Helper attendu :

```js
function cssToken(name) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!value) throw new Error('Jeton CSS manquant : ' + name);
    return value;
}
```

### Task 2.3 — Prouver la neutralité de l'extraction

- [ ] Exécuter `node --check semplice-country.js` et `node --check semplice-radar.js`.
- [ ] Comparer côte à côte les captures avant/après dans le même navigateur, aux mêmes largeurs 360/768/1280/1440, après `document.fonts.ready`.
- [ ] Exclure les tuiles Leaflet et les contenus API datés de la comparaison ; contrôler la carte par ses couches, sa légende et ses interactions.
- [ ] Comparer aussi le radar d'`expertise.html` à 360 et 1440 px.
- [ ] Tester les bascules risque/opportunité et les légendes.
- [ ] Vérifier qu'aucun littéral sémantique interdit ne subsiste hors du fichier de jetons, des données de séries et des tests.

Commandes :

```bash
node --check semplice-country.js
node --check semplice-radar.js
node --test scripts/tests/semplice-color-contract.test.mjs
git diff --check
```

Attendu : mêmes couleurs et mêmes interactions qu'avant l'extraction.

### Task 2.4 — Raccorder le contrat aux lanceurs de tests

**Fichiers :**

- Modify: `scripts/tests/run-tests.sh`
- Modify: `.github/workflows/ci.yml`

- [ ] Ajouter `node --test scripts/tests/semplice-color-contract.test.mjs` au runner local.
- [ ] Ajouter la même commande au job `test-scripts` de la CI.
- [ ] Faire vérifier par le test les seuils et valeurs des deux contrats, ainsi que l'absence de littéraux correspondants dans les deux helpers JS.
- [ ] Ajouter `node --test scripts/tests/semplice-geojson.test.mjs` aux deux lanceurs dès la Task 3.4.

---

## Phase 3 — Transformer Radar Pays en vrai pilote

### Task 3.1 — Déclarer le régime de la page

**Fichiers :**

- Modify: `country.html`
- Modify: `nav-shared.js`
- Create: `assets/country-identity-v2.css`

- [ ] Ajouter `data-design-regime="instrument"` au `<body>` de `country.html`.
- [ ] Faire lire ce régime à `nav-shared.js`.
- [ ] Rendre le chrome sombre/achromatique sans affecter les pages restées en v1.
- [ ] Remplacer le logo par la variante claire validée, ou conserver temporairement le wordmark typographique.
- [ ] Éviter les styles inline supplémentaires ; déplacer les règles du pilote dans le CSS dédié.

Attendu : seule `country.html` bascule en identité v2.

### Task 3.2 — Appliquer la grammaire du prototype

- [ ] Hero sombre, métadonnées mono et titre Archivo.
- [ ] Fond papier `#EDEBE4` et modules blancs.
- [ ] Grille, filets graphite, angles droits et ombres réduites.
- [ ] Contrôles actifs achromatiques.
- [ ] Titres de section indexés sans modifier la structure accessible.
- [ ] Footer sombre avec disclaimer AMF et sources.
- [ ] Aucun accent emerald ou bronze dans le chrome.

### Task 3.3 — Corriger les incohérences révélées, pas les masquer

- [ ] Remplacer les styles inline purement identitaires de `country.html` par des classes.
- [ ] Laisser les couleurs analytiques dans les jetons dédiés.
- [ ] Documenter les couleurs de séries dans `semplice-zones-config.js`.
- [ ] Ne pas harmoniser les seuils risque/opportunité sans décision analytique.

### Task 3.4 — Réparer la géométrie Mexique dans un commit séparé

**Fichiers :**

- Modify: `data/semplice-zones.geojson`
- Create: `scripts/tests/semplice-geojson.test.mjs`
- Remove after fix: `prototypes/identity-v2/country-v2-runtime.js`

- [ ] Retirer exactement un niveau de tableau autour de `features[14].geometry.coordinates[0]` (`zone = mexique`).
- [ ] Vérifier que le MultiPolygon contient toujours deux polygones, un anneau chacun, avec 75 et 64 points.
- [ ] Valider la profondeur de toutes les géométries Polygon et MultiPolygon.
- [ ] Tester que chaque anneau est fermé et que chaque position contient deux nombres finis.
- [ ] Supprimer le shim du prototype lorsque le GeoJSON partagé est réparé.

Cette correction est fonctionnelle et non graphique : elle doit rester distincte du commit de design.

---

## Phase 4 — QA du pilote

### Task 4.1 — Validation fonctionnelle

Tester au minimum :

- [ ] chargement du GeoJSON et des tuiles Leaflet ;
- [ ] bascule Risque / Opportunité ;
- [ ] survol et clic d'une zone ;
- [ ] synchronisation carte, fiche, scatter et timeline ;
- [ ] filtres région, risque maximal et dimension ;
- [ ] mode composite / 8 dimensions de la timeline ;
- [ ] tri des sept colonnes du tableau ;
- [ ] sélection et retour d'un pays macro ;
- [ ] liens vers les analyses ;
- [ ] navigation clavier et focus visible ;
- [ ] absence d'erreur console.

### Task 4.2 — Validation responsive

Viewports obligatoires :

| Largeur | Points à contrôler |
|---:|---|
| 360 px | navigation, ordre du hero, boutons, cartes, tableaux scrollables |
| 768 px | bascule tablette, grilles, taille des Canvas |
| 1280 px | densité éditoriale et alignements |
| 1440 px | largeur maximale et équilibre chrome/instrument |

### Task 4.3 — Accessibilité et contraste

- [ ] Contraste texte/fond conforme WCAG AA.
- [ ] Éléments graphiques porteurs de sens à 3:1 minimum ; lorsque le remplissage historique est sous 3:1, ajouter un contour conforme et un libellé direct.
- [ ] Vérifier explicitement `#33B894`, `#F59E0B`, `#A7F3D0` et `#D1D5DB`, tous sous 3:1 sur blanc.
- [ ] Légendes textuelles pour chaque code couleur.
- [ ] Ordre des titres cohérent.
- [ ] Cibles tactiles suffisantes.
- [ ] Dans `semplice-country.js`, lire `matchMedia('(prefers-reduced-motion: reduce)')` : durée `flyTo` à 0 et `scrollIntoView` en mode `auto` lorsque demandé.
- [ ] Ajouter la même garde aux animations du radar de méthodologie si elles sont introduites.
- [ ] Test sans souris pour toutes les actions disponibles au clavier.

### Task 4.4 — Critère de sortie

Le pilote est terminé seulement si :

- [ ] l'utilisateur approuve la direction ;
- [ ] aucun encodage analytique n'a changé ;
- [ ] aucune régression fonctionnelle critique n'est ouverte ;
- [ ] les captures desktop/mobile sont annexées au compte rendu ;
- [ ] un rollback en un commit est possible.

---

## Phase 5 — Stabiliser Delta computationnel

### Task 5.1 — Appliquer la composition 02 au prototype Delta

**Fichiers :**

- Modify: `delta-v2/assets/styles.css`
- Modify: `delta-v2/assets/tree.js`
- Modify: `delta-v2/README.md`

- [ ] Appliquer ensemble les jetons CSS et la constante `COLORS`.
- [ ] Ajouter l'état de zone incomplète au niveau de la zone, jamais sur les onze cartes de scénarios actuelles.
- [ ] Ajouter la ligne textuelle listant les blocs absents.
- [ ] Conserver le fond clair derrière les quatre horizons rouges.
- [ ] Revalider le contrat sur les données SEMPLICE de `main` avant toute publication.

### Task 5.2 — Régler les dettes de publication

- [ ] Ajouter les licences OFL et identifier les 14 fichiers de police.
- [ ] Remplacer ou versionner proprement le snapshot embarqué.
- [ ] Corriger le parsing des horizons qui interprète mal une année.
- [ ] Ajouter des tests de normalisation des scénarios.
- [ ] Garder l'onglet actif lors de la vérification visuelle de l'arbre, rendu dans `requestAnimationFrame`.

---

## Phase 6 — Séquençage de la migration identitaire

La migration globale commence uniquement après la validation du pilote. Cette phase fixe l'ordre, pas le détail d'exécution : avant chaque lot, produire un plan dédié qui énumère tous les fichiers, les tests, les captures et le rollback. Ne pas lancer un lot depuis les seules cases ci-dessous.

### Lot A — Fondations partagées

- [ ] Inventorier les 32 configurations Tailwind et les pages qui consomment `styles.css`/`nav-shared.js`.
- [ ] Rédiger le plan exécutable du lot A à partir de cet inventaire.
- [ ] `assets/design-tokens-v2.css` devient la source de vérité.
- [ ] `nav-shared.js` gère explicitement les régimes `instrument` et `editorial`.
- [ ] Les trois configurations Tailwind inline convergent vers une seule configuration ou disparaissent.
- [ ] Le nouveau logo v3 est fourni en SVG et variantes clair/sombre.
- [ ] Favicons, `manifest.json` et `og-image.png` sont préparés mais non activés.

### Lot B — Pages instrumentées

Ordre recommandé :

1. `country.html` — pilote validé ;
2. `expertise.html` — radar SEMPLICE et forte dette d'hex ;
3. `delta-v2/` ou sa destination produit ;
4. pages comportant des graphiques de marché.

Chaque page doit démontrer que ses couleurs de données sont indépendantes de la marque.

- [ ] Rédiger un plan exécutable par instrument avec ses couleurs réservées, ses données et ses tests.

### Lot C — Pages éditoriales et services

- [ ] Rédiger le plan exécutable du lot C avec la liste exacte des pages et des variantes Tailwind.
- [ ] `analyses.html` et les articles ;
- [ ] rubriques legacy ;
- [ ] `premium.html`, `a-propos.html` et pages légales ;
- [ ] vérifier la règle du brun rouge : aucun arbre sur la page.

### Lot D — Accueil et actifs globaux

- [ ] Rédiger le plan exécutable du lot D après les retours des lots A à C.
- [ ] Migrer `index.html` en dernier : il devient alors la nouvelle source de vérité visuelle.
- [ ] Activer logo, favicons, manifeste et image Open Graph.
- [ ] Marquer `DESIGN-MIGRATION-PROMPT.md` comme obsolète ou l'archiver.
- [ ] Mettre à jour `AGENTS.md`/`CLAUDE.md` sans dépasser leur budget de contexte.

---

## Stratégie de commits

Commits petits et réversibles :

1. `docs(design): versionner la direction artistique v2`
2. `test(design): figer les couleurs semantiques SEMPLICE`
3. `refactor(design): extraire les jetons de donnees sans changement visuel`
4. `feat(design): ajouter le pilote Radar Pays v2`
5. `test(design): ajouter la QA visuelle du pilote`
6. `feat(delta): appliquer la composition hybride validee`

Ne pas mélanger une modification de score SEMPLICE avec un commit de design.

## Rollback

- Le prototype isolé se retire en supprimant `prototypes/identity-v2/` ; ce dossier n'est pas copié dans l'artefact Pages.
- Le pilote réel se retire par revert du commit du pilote. Retirer seulement `data-design-regime="instrument"` ne suffit pas si le HTML a aussi changé.
- Les valeurs des jetons sémantiques restent identiques pendant l'extraction, ce qui permet un retour sans conversion de données.
- Les actifs globaux ne basculent qu'au dernier lot.

## Définition de terminé

- La spec et le plan sont versionnés.
- Le pilote a été approuvé sur desktop et mobile.
- Les couleurs de marque et de donnée ont des jetons distincts.
- Les interactions Radar Pays ont été testées.
- Delta respecte la composition hybride et l'état incomplet nommé.
- Une stratégie de migration et de rollback est documentée.
- `index.html` n'est déclaré nouvelle source de vérité qu'après la migration globale.
