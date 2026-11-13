# Base d'images Inflexion — studio de rendu en code

Date : 2026-11-13. Statut : validé en cadrage, à planifier.

## 1. Objet

Fabriquer une base d'images propres à Inflexion, dans l'identité v2, sans service externe, et l'utiliser sur la page d'accueil :

- pour l'analyse à la une du hero (format 16:9) ;
- pour les cartes du flux « Sources & signaux » (format 5:3) quand la source ne fournit pas d'image ou que celle-ci ne charge pas.

Les miniatures fournies par les sources restent affichées, mais passent par un traitement visuel commun appliqué en CSS, pour que tout le flux partage une seule famille visuelle.

Origine : audit Inflexion × Starlink du 13 novembre 2026 (sections 5.5 et 7.7) et méthode « clip motion » (pages HTML photographiées par Chrome sans fenêtre, harnais avec règles numérotées, rendus jamais écrasés, planche de contrôle).

## 2. Décisions prises en cadrage

| Question | Décision |
| --- | --- |
| Méthode de fabrication | Pages HTML autonomes photographiées par Chrome sans fenêtre, pilotées par Node via un tuyau local. Aucun générateur d'images IA, aucun paquet npm, aucun port ouvert. |
| Formats couverts | 5:3 en 1000 × 600 (flux) et 16:9 en 1600 × 900 (hero). Les formats 21:9 et Open Graph sont hors périmètre. |
| Grammaires visuelles | **Gravure bichrome** (vraie image convertie en espresso et crème, grain, bord déchiré, bandeau) pour les analyses à la une. **Instrument** (figure dessinée par code, une famille par rubrique) pour le flux. Le monolithe typographique n'est pas retenu. |
| Quand le flux utilise la base | Miniature de la source traitée en CSS si elle existe et charge ; instrument de la rubrique sinon ; aplat espresso en dernier recours. |
| Architecture | Harnais `studio/` dans le dépôt, fichiers statiques validés copiés dans `assets/img/`. Pas de génération à la volée côté client, pas de génération en CI. |
| Variantes | Six instruments par rubrique, cinq rubriques, soit 30 fichiers. Un article prend sa variante par hachage stable de son URL. |
| Premiers sujets gravés | Les trois analyses à la une : Ukraine / mer Noire, Sahel, mer de Chine. |

## 3. Le harnais `studio/`

```
studio/
  CLAUDE.md          fiche de poste : rôle, format, charte, règles, contrat de scène, règles apprises
  sources/           images choisies à la main pour les gravures + CREDITS.md
  scenes/
    gravure.html
    instrument.html
  outils/
    rendre.mjs       Chrome sans fenêtre, capture WebP
    rendre.sh        vérifications, numérotation, appel de rendre.mjs puis planche.py
    planche.py       planche de contrôle (Pillow)
  rendu/             dossiers numérotés, ignorés par git
```

`rendu/` est ajouté au `.gitignore`. Le studio n'écrit jamais ailleurs que dans `rendu/`. Il ne modifie jamais `index.html` ; le site ne dépend de lui que par les fichiers déposés dans `assets/img/`.

### 3.1 Fiche de poste `studio/CLAUDE.md`

Même structure que la fiche de poste clip-motion : rôle (graphiste éditorial qui dessine en code, vouvoiement), format, charte, règles de composition, contrat de scène, procédure de rendu et de relecture, règles apprises.

**Charte** (valeurs des jetons `assets/design-tokens-v2.css`, écrites une fois) :

- Fond `#17100E` (espresso). Crème `#EDEBE4`. Texte clair `#F5EDE6` à trois opacités : 100 % (titres et kickers), 70 % (texte), 55 % (légendes).
- Rouge aplat `#8E2424`, rouge texte et signal `#E05A4E`, brun `#42301E`.
- Archivo 800 pour tout titre ; IBM Plex Mono 400 et 600 pour kickers et légendes. Polices chargées depuis `assets/fonts/` en local (`@font-face` dans chaque scène), jamais depuis Internet.
- Rien d'autre : pas d'autre couleur, pas d'autre police.

**Règles de composition de départ :**

1. Un kicker « § RUBRIQUE » en Plex Mono 600, capitales, espacement 0,18 em, toujours à la même position pour un format donné.
2. Un filet rouge `#8E2424` de 40 × 3 px, sous le kicker ou sous la légende, jamais les deux.
3. Marge de sécurité de 6 % de la largeur : rien ne touche les bords sauf un aplat volontaire.
4. Un seul point rouge `#E05A4E` par image : c'est le signal.
5. Aucun dégradé coloré, aucune ombre portée, aucun flou. Le relief vient du grain et de la bichromie.
6. Aucun texte au-delà du kicker et d'une ligne de légende : le titre est porté par la carte HTML du site.

**Règles apprises** : liste numérotée à la suite, qui ne grandit que par le geste `/retenir-une-regle` du dossier clip-motion, avec l'accord de la personne. Aucune règle n'est jamais retirée.

**Relecture** : avant de déclarer un rendu bon, ouvrir la planche et chercher : kicker tronqué, point rouge sur le bord, deux variantes trop semblables, image source mal recadrée, légende illisible, élément hors marge.

### 3.2 Contrat de scène

Une scène est un fichier HTML autonome dans `studio/scenes/` : CSS et JavaScript inclus, aucune bibliothèque, aucune ressource distante. Les seules ressources externes autorisées sont les polices de `assets/fonts/` et, pour la gravure, l'image de `studio/sources/`, chargées par chemin relatif (`file://` vers `file://`, qui fonctionne pour `<img>` et `@font-face` mais pas pour `fetch`).

- La scène lit ses paramètres dans l'adresse (`?rendu&...`).
- Elle déclare `window.LARGEUR` et `window.HAUTEUR` en pixels, et une fonction `window.afficher()` qui dessine l'image et renvoie une promesse résolue quand polices et image source sont chargées.
- Tout est déterministe : mêmes paramètres, même image. Le hasard vient d'un générateur à graine (mulberry32) initialisé avec le numéro de variante. `Math.random()`, `Date.now()`, transitions et animations CSS sont interdits.
- Sans `?rendu`, la page s'affiche à l'échelle de la fenêtre avec des contrôles minimaux (rubrique, variante, format, source) pour itérer à l'œil.
- Pour l'énumération, `instrument.html` déclare aussi `window.RUBRIQUES` (tableau d'identifiants) et `window.VARIANTES` (entier). Le script de rendu n'énumère rien de lui-même.

### 3.3 `gravure.html`

Paramètres : `source` (chemin relatif vers `../sources/<nom>.jpg`), `format` (`16x9` → 1600 × 900, `5x3` → 1000 × 600), `focal` (point focal en pourcentages, `60,40` par défaut `50,50`), `kicker`, `legende`.

Traitement, dans l'ordre :

1. Recadrage `object-fit: cover` au format, centré sur le point focal.
2. Filtre bichrome SVG : saturation à zéro, puis `feComponentTransfer` à table de transfert qui envoie les noirs vers `#17100E` et les blancs vers `#EDEBE4`.
3. Grain de gravure : bruit fractal (`feTurbulence`, fréquence de base 1,4) en mode multiplication, opacité 25 à 30 %.
4. Bord déchiré : `clip-path` polygonal sur le bas en 16:9, sur le côté droit en 5:3, amplitude 4 à 6 px, dessiné à partir d'une graine dérivée du nom de la source pour ne pas être identique d'une image à l'autre.
5. Bandeau : kicker, filet rouge, légende en Plex Mono 400 à 55 %.

Si l'image source est introuvable, la scène affiche un cadre rouge « source manquante » et `afficher()` rejette sa promesse : le rendu échoue en le disant.

### 3.4 `instrument.html`

Paramètres : `rubrique` (`geopolitique`, `marches`, `crypto`, `matieres`, `iatech`), `variante` (1 à 6). Format fixe 5:3, 1000 × 600.

Constantes communes : fond espresso, kicker « § RUBRIQUE » en haut à gauche, filet rouge, une ligne de légende en bas à gauche (coordonnées, valeur ou identifiant plausible mais non factuel, dérivé de la graine), un seul point rouge marquant le signal, traits crème à 16 % pour les structures et à 100 % pour la figure principale.

| Rubrique | Figure | Ce que la graine fait varier |
| --- | --- | --- |
| Géopolitique | Graticule sphérique et silhouette polygonale d'une zone | Rotation du globe, forme du polygone, position du signal |
| Marchés | Courbe sur grille, zone sous la courbe en rouge dégradé vers transparent | Tendance, volatilité, point de rupture |
| Crypto | Réseau de nœuds reliés | Nombre de nœuds (8 à 14), densité des liens, nœud actif |
| Matières premières | Strates horizontales ondulées | Nombre de couches (5 à 9), amplitude, couche marquée |
| IA & Tech | Matrice de points, une diagonale allumée | Pas de la grille, diagonale, cellule active |

Le dégradé rouge sous la courbe des marchés est la seule exception admise à la règle 5 : il va d'une couleur de la charte vers la transparence, il n'introduit pas de couleur.

Les familles et le nombre de variantes vivent dans la scène. Ajouter une rubrique ne touche qu'à ce fichier.

### 3.5 `outils/rendre.mjs`

Repris du `rendre.mjs` de clip-motion (Chrome sans fenêtre, profil jetable, `--remote-debugging-pipe`, protocole DevTools aplati, rangement du profil en fin de course), avec ces différences :

- Entrée : soit un fichier de tâches JSON (liste d'objets `{ scene, params, sortie }`), soit le mot `instrument` : le script ouvre alors `instrument.html` une première fois, lit `RUBRIQUES` et `VARIANTES`, et construit la liste lui-même (`<rubrique>-<n>.webp`).
- Par tâche : navigation vers `file://…/scenes/<scene>.html?rendu&<params>`, attente de `document.readyState === 'complete'`, lecture de `LARGEUR` et `HAUTEUR`, `Emulation.setDeviceMetricsOverride` à ces dimensions avec facteur d'échelle 1, attente de `document.fonts.ready` puis de la promesse de `afficher()`, un `requestAnimationFrame`, puis `Page.captureScreenshot` au format `webp`, qualité 82. Délai maximal de 10 s par tâche, puis échec explicite.
- Sortie : les WebP écrits dans le dossier de rendu indiqué. Le script refuse un dossier qui existe déjà.
- Chrome démarre une seule fois pour toute la liste.

### 3.6 `outils/rendre.sh`

Usage : `bash studio/outils/rendre.sh instrument` ou `bash studio/outils/rendre.sh gravure <nom> <format> [focal] [kicker] [legende]`.

1. Vérifie Node 22 ou plus et Google Chrome (chemins standards ou variable `CHROME`), avec les messages en clair de clip-motion.
2. Prend le prochain numéro libre : `rendu/instrument-v1/`, `rendu/gravure-<nom>-v1/`, etc.
3. Appelle `rendre.mjs` (mot `instrument`, ou fichier de tâches d'une seule gravure écrit dans le dossier de rendu), puis `planche.py` sur le dossier produit.
4. Affiche le chemin du dossier et celui de la planche.

Il n'installe rien, n'écrit que dans `rendu/`, n'écrase jamais un rendu.

### 3.7 `outils/planche.py`

Assemble tous les WebP d'un dossier de rendu en une grille de 4 colonnes sur fond crème, chaque vignette réduite à 320 px de large avec son nom de fichier en légende, dans `planche.jpg` à côté. Pillow uniquement (déjà installé, `ffmpeg` n'est pas utilisé). Refuse d'écraser une planche existante.

## 4. Intégration dans `index.html`

### 4.1 Fichiers

```
assets/img/
  une/ukraine-mer-noire.webp   une/sahel.webp   une/mer-de-chine.webp     (16:9, gravure)
  instrument/<rubrique>-<n>.webp                                           (5:3, 30 fichiers)
  CREDITS.md
```

`FEATURED_ANALYSES[*].img` pointe vers `assets/img/une/<nom>.webp`. Le fichier actuel `assets/img/ukraine-mer-noire.webp` (satellite brut) est déplacé dans `studio/sources/` comme source de la gravure, et remplacé par sa version gravée dans `une/`.

### 4.2 Choix de l'instrument

Une fonction `instrumentPour(article)` dans `index.html` :

- calcule un hachage FNV-1a 32 bits de `article.href` (chaîne vide ou `#` → hachage de la chaîne vide, sans erreur) ;
- renvoie `assets/img/instrument/<rubrique>-<(hachage mod 6) + 1>.webp`.

Même article, même image à chaque visite ; deux voisins de même rubrique ont cinq chances sur six d'être différents. Elle est écrite en `var` globale dans un petit fichier `instrument-pour.js` chargé par `index.html`, pour être testable dans `node:vm` comme les autres scripts navigateur du projet.

Dans `mapNewsToArticles`, `img: item.image || window.matchImage(title, cat)` devient `img: item.image || null`, et la carte décide : image présente → miniature traitée ; sinon → `instrumentPour(article)`. `image-catalog.js` n'est plus chargé par `index.html` (il reste pour les pages legacy, hors périmètre).

### 4.3 Traitement des miniatures

Classe `.img-gravure` sur le conteneur d'image de la carte du flux, dans le `<style>` de `index.html` :

- sur l'`<img>` : `filter: grayscale(1) contrast(1.1) brightness(.95)` ;
- un calque `::before` en `#17100E`, `mix-blend-mode: multiply`, opacité 0,55 ;
- un calque `::after` en dégradé vertical de transparent à `rgba(23,16,14,.85)` sur le tiers inférieur.

Pas de flou ni de bruit en CSS. Le zoom au survol existant passe derrière `@media (hover: hover)`.

### 4.4 Repli en cascade

1. `item.image` absent → instrument.
2. `item.image` présent mais en erreur de chargement → le gestionnaire `onError` remplace `src` par l'instrument (au lieu de masquer l'image) et retire la classe `.img-gravure`.
3. Instrument lui-même en erreur → l'image est masquée, l'aplat espresso du conteneur reste (comportement actuel du hero).

Aucune carte ne montre jamais l'icône d'image cassée du navigateur.

### 4.5 Ce qui ne change pas

Le pipeline de données, `news.json`, `data-loader.js`, les pages de rubrique et les autres pages React. La modification du site tient dans `index.html` (une classe CSS, l'appel dans `mapNewsToArticles`, le `onError`, les chemins de `FEATURED_ANALYSES`) et le nouveau fichier `instrument-pour.js`.

## 5. Vérification

### 5.1 Tests en code (`node --test 'test/**/*.test.mjs'`)

- `instrument-pour.js` : même URL → même variante ; cinq URL de test réparties sur au moins trois variantes ; URL vide ou `#` → variante 1 sans erreur ; rubrique inconnue → chemin de la rubrique `marches` (même repli que `catKeys`).
- Générateur à graine de `instrument.html` (extrait dans un bloc chargeable par `node:vm`) : même graine → même suite ; graines 1 à 6 → six suites distinctes.
- `rendre.mjs` : refuse un dossier de rendu existant ; échoue avec un message clair sur une scène sans `LARGEUR`, `HAUTEUR` ou `afficher` ; signale Chrome ou Node manquant en clair.

### 5.2 Vérification à l'œil

- Chaque rendu produit sa planche ; un rendu n'est déclaré bon qu'après l'avoir regardée, selon la liste de défauts de `CLAUDE.md`.
- Home en local : les 9 cartes de « Tout » affichent soit une miniature traitée, soit un instrument de la bonne rubrique ; deux cartes voisines de même rubrique ne montrent pas la même variante ; le hero affiche la gravure. Capture d'écran à l'appui.
- Contrastes : kicker `#E05A4E` sur `#17100E` = 5,2:1 ; légende `#F5EDE6` à 55 % sur `#17100E` reste au-dessus de 4,5:1. Vérifiés sur la planche.

### 5.3 Erreurs prévues

| Situation | Comportement |
| --- | --- |
| Chrome absent ou Node < 22 | Message en clair, arrêt, rien d'écrit |
| Image source introuvable | Cadre rouge « source manquante » dans la scène, rendu en échec explicite |
| Polices non chargées en 10 s | Échec explicite de la tâche, pas de capture |
| Dossier de rendu existant | Refus |
| Côté site : image de source en erreur | Instrument, puis aplat espresso |

## 6. Hors périmètre

Formats 21:9 et Open Graph ; les onze autres analyses publiées ; les pages de rubrique legacy et `image-catalog.js` ; la génération en CI ; toute animation.
