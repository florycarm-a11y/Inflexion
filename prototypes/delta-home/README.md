# Prototype — Home « Le Delta »

Instantané **préservé** de la refonte de `index.html` par Codex, direction artistique « Le Delta » (une de journal éditoriale : Manchette / Analyses / Signaux / Archives, avec le *delta-tree* comme élément signature).

## Provenance

- Conçu par Codex le **2026-07-13** (« Home "Le Delta" et Signaux filtrables »), sauvegardé le **2026-07-20**.
- Snapshot créé le **2026-07-22** à partir de :
  - `~/Desktop/codex-refonte-index-SAUVEGARDE-2026-07-20/` (index.html + favicon.svg) ;
  - `assets/` (styles.css, tree.js, fonts) qui n'existaient **qu'en untracked** dans le clone `~/Developer/GitHub/Inflexion` — d'où cette préservation.

## Statut : maquette, PAS une home fonctionnelle

Contenu **placeholder/fictif** (bylines, dépêches, statistiques inventées). Codex l'indique lui-même : *« Remplacer les contenus et dates statiques par les contenus réels lorsqu'ils seront disponibles. »*

Cette maquette **ne charge pas** : le mega-menu réel (`nav-config.js`), les données live (`data-loader.js`), les images (`image-catalog.js`), ni aucun lien vers les ~30 pages du site. Ce n'est **pas** compatible en l'état avec l'identité v2 déployée sur les 16 pages legacy (chrome sombre achromatique) : le Delta est ici **tout-clair**.

## Décision (2026-07-22) : ADAPTER

Direction retenue : **adapter** (ni adopter tel quel, ni jeter). Reconstruire la home dans l'esprit Delta en **recâblant** nav réelle, données, images, liens et contenu réel — chantier à fusionner avec la migration des pages React. Ce dossier sert de **référence visuelle et de réserve d'assets** pour ce chantier.

## Lancer le prototype

```bash
python3 -m http.server 8080 --directory prototypes/delta-home
# puis http://localhost:8080/  (hard reload Cmd+Shift+R si assets en cache)
```

## Identité Delta (`assets/styles.css`)

- Papier `#f4f1ea` · encre `#0a0a0a` · métadonnées `#6e6a62` · archives `#3e5c3a`.
- Delta-tree (branches rouges par génération) : `#ff2d00` → `#c42300` → `#8a1800` → `#521000`.
- Typo : Archivo (display), IBM Plex Sans (corps), IBM Plex Mono (mono) — auto-hébergées dans `assets/fonts/`.
