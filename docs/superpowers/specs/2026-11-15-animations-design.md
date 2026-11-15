# Animations d'apparition de la home — prompt 4 de l'audit Starlink

Date : 2026-11-15. Statut : réalisé le 2026-11-15 sur la branche `feat/animations` (quatre commits ; résultats mesurés dans le plan). Deux prémisses du cadrage corrigées en cours de route et consignées : la pastille n'était pas coupée en mouvement réduit (§2.4), et la préférence est lue au montage (§3).

## 1. Objet

Refaire les animations d'apparition d'`index.html` : trois jetons de durée dans `assets/design-tokens-v2.css`, un composant `Reveal` qui anime un seul élément à la fois (à la place de `FadeUp`, qui fondait des sections entières), un ordre d'apparition fixe par section (titre 0 s, paragraphe 0,15 s, bouton ou grille 0,3 s, + 0,06 s par carte), le réglage « réduire les animations » respecté partout (apparitions, zoom des images, pastille), tous les `:hover` du CSS de la page sous `@media (hover: hover)`, et plus aucune durée écrite en dur.

Origine : audit Inflexion × Starlink du 13 novembre 2026, sections 7.2 à 7.6 et prompt 4 de la section 10. Troisième chantier de l'étape 2, après Tailwind compilé (PR #143) et typographie et couleurs (PR #144). Suivra le prompt 5 (en-tête et méga-menu), dans sa propre session.

Critère de fin : `index.html` conforme aux six points du prompt 4, `assets/site.css` reconstruit et commité, un test de garde qui rend les six points permanents, `npm test` au vert, état « apparu » identique au pixel à l'état actuel (le chantier change le mouvement, pas la mise en page), comportement « réduire les animations » vérifié dans le navigateur, PR ouverte après le « oui ».

## 2. Ce que le cadrage a établi

Mesures faites sur `main` (commit `48765711`) avant toute modification.

### 2.1 Les durées écrites en dur, une par une

Le `<style>` d'`index.html` (lignes 24 à 105) contient **17 littéraux de temps** : 13 durées et 4 délais (`.anim-d1` à `.anim-d4`). Le script React en ajoute 2 dans le style inline de `FadeUp` et 3 par classes Tailwind (`duration-300`, `duration-500` ×2). Chaque occurrence est qualifiée ci-dessous : règle, valeur, nature, jeton de destination.

| Emplacement | Règle | Aujourd'hui | Nature | Devient |
| --- | --- | --- | --- | --- |
| `<style>` | `@keyframes fade-up` + `.anim-fade-up` | `.6s ease-out`, translateY 24 px | apparition au chargement (hero) | **supprimé** : le hero passe par `Reveal` (§2.2) |
| `<style>` | `.anim-d1` … `.anim-d4` | délais `.1s` à `.4s` | délais du hero | **supprimés** : portés par la prop `delay` |
| `<style>` | `.nav-link::after` | `transform .25s ease` | survol (souligné du menu) | `var(--motion-fast)` |
| `<style>` | `.mega-menu` | `opacity .22s ease, transform .22s ease, visibility .22s` | menu | `var(--motion-base)` ×3 |
| `<style>` | `.mega-item` | `background .15s ease` | survol | `var(--motion-fast)` |
| `<style>` | `.hamburger span` | `all .3s ease` | icône d'état (menu) | `var(--motion-base)` |
| `<style>` | `.mobile-overlay` | `opacity .35s cubic-bezier(.4,0,.2,1), visibility .35s` | menu | `var(--motion-base)` ×2 |
| `<style>` | `.mobile-overlay.open .menu-item` | `menu-item-in .4s ease-out` | apparition (entrées du menu mobile) | `var(--motion-slow)` |
| `<style>` | `.article-card` | `box-shadow .18s ease, border-color .18s ease` | survol | `var(--motion-fast)` ×2 |
| `<style>` | `.article-card::before` | `transform .22s ease` | survol (filet rouge) | `var(--motion-fast)` |
| React | `FadeUp`, style inline | `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` | apparition au défilement (3 sections) | **supprimé** : `Reveal` + `.reveal` en CSS, `var(--motion-slow)` |
| React | `header` | `transition-all duration-300` (Tailwind : `all 300ms cubic-bezier(.4,0,.2,1)`) | en-tête au défilement | classe `.site-header{transition:all var(--motion-base)}` : **valeur identique** ; le prompt 5 limitera la propriété à `background-color` et `border-color` |
| React | `img` de la manchette | `group-hover:scale-[1.02] transition-all duration-500` | survol (zoom) | classe `.zoom-hover`, `transform var(--motion-slow)` |
| React | `img` des deux cartes « Décryptages » | `group-hover:scale-[1.03] transition-all duration-500` | survol (zoom) | classe `.zoom-hover`, `transform var(--motion-slow)` |
| React | `.transition-colors` (21 occurrences) | Tailwind : `150ms cubic-bezier(.4,0,.2,1)` sur couleur, fond, bordure | survol, changements de couleur | **conservé** (décision §3) |
| React | `.animate-pulse` (1 pastille + 7 blocs squelette) | Tailwind : `pulse 2s cubic-bezier(.4,0,.6,1) infinite` | boucle, pas une apparition | **conservé**, en variante `motion-safe:animate-pulse` (§2.4) |
| React | `animationDelay` inline des entrées du menu mobile (`0.08+ci*0.18+ii*0.05`, `0.8s`) | délais | délais, pas durées | conservés |

Lecture : les 13 durées du `<style>` tombent sur les trois jetons selon leur nature (survol → `fast`, menu et en-tête → `base`, apparition → `slow`), et non selon leur valeur la plus proche. Deux cas sont tranchés en §3 : le zoom des images (un survol, mais un `transform` continu de 0,5 s) et `transition-colors`.

Les jetons sont des **raccourcis composés** (`durée fonction`) : ils se consomment dans les raccourcis `transition` et `animation` (`transition: opacity var(--motion-slow)`, `animation: menu-item-in var(--motion-slow) forwards`). Ils ne peuvent **pas** alimenter les utilitaires Tailwind `duration-*` (qui n'acceptent qu'une durée) : c'est pourquoi le zoom et l'en-tête passent dans le `<style>` de la page.

### 2.2 Les blocs animés et leur ordre d'apparition

Quatre blocs sont animés aujourd'hui, par deux mécanismes différents (audit 7.3 : en garder un seul) :

- **Hero** : six éléments en `.anim-fade-up` au **chargement** (animation CSS, pas d'observateur) : kicker 0 s, `h1` 0,1 s, filet 0,1 s, paragraphe 0,2 s, boutons 0,3 s, carte à la une 0,2 s.
- **Décryptages**, **Sources & signaux**, **Explorez notre couverture** : la section entière dans un `div` `FadeUp` (`IntersectionObserver`, seuil 0,15, `opacity`/`translateY(24px)`, 0,6 s).

Ne sont **pas** animés : le bandeau de chiffres, la newsletter, le pied de page. Ils le restent (décision §3).

Après le chantier, chaque élément porte son propre `Reveal` :

| Section | Élément | Aujourd'hui | `delay` |
| --- | --- | --- | --- |
| Hero | kicker « § Manchette » | 0 | **0** |
| | `h1` | 0,1 | **0** |
| | filet rouge (`div` 3 px) | 0,1 | **0** |
| | paragraphe | 0,2 | **0,15** |
| | `div` des deux boutons | 0,3 | **0,3** |
| | carte à la une (`a.featured-card`) | 0,2 | **0,3** (c'est la « grille » du hero) |
| Décryptages | kicker | section | **0** |
| | `h2` | section | **0** |
| | lien « Voir toutes les analyses → » (desktop) | section | **0,3** |
| | 2 cartes `a.article-card` | section | **0,3** + rang × 0,06 |
| | lien « Voir toutes les analyses → » (mobile) | section | **0,3** |
| Sources & signaux | kicker | section | **0** |
| | `h2` | section | **0** |
| | sous-titre « Flux automatisé — … » | section | **0,15** |
| | `div` des boutons de filtre | section | **0,3** |
| | jusqu'à 9 cartes `a.article-card` (puis +9 par « Charger plus ») | section | **0,3** + rang × 0,06 |
| | `div` du bouton « Charger plus d'articles » | section | **0,3** |
| Explorez notre couverture | kicker | section | **0** |
| | `h2` | section | **0** |
| | `div` des deux onglets | section | **0,3** |
| | bloc liste + panneau (`div.flex`) | section | **0,3** (c'est la « grille » de la section) |

**Règle de placement** : `Reveal` ne se pose jamais sur un élément qui porte déjà une classe Tailwind `transition-*` (boutons, liens avec `transition-colors`), parce que `site.css` est chargé en dernier et que sa `transition-property` (couleurs) écraserait celle de `.reveal` (opacité, transform) : l'élément n'apparaîtrait pas. On enveloppe alors leur conteneur (le `div` des boutons du hero, des filtres, des onglets, de « Charger plus »). Les cartes `a.article-card` portent une `transition` dans le `<style>` de la page : `.reveal` est déclaré **après** `.article-card` dans la feuille pour gagner pendant l'apparition, et `Reveal` se retire ensuite (§3).

**Conséquences de comportement, voulues** : les cartes de veille qui apparaissent après un changement de filtre ou un « Charger plus » entrent avec le décalage de grille (aujourd'hui elles apparaissaient d'un bloc, la section étant déjà fondue) ; une carte déjà affichée et conservée par le filtre (même `key`) ne rejoue pas son apparition.

### 2.3 Les `:hover`

Dans le `<style>` : **5 règles** — `.nav-link:hover::after` (souligné du menu), `.mega-menu:hover` (le panneau reste ouvert sous le pointeur), `.mega-item:hover` (fond rosé), `.article-card:hover` (ombre et bordure rouge), `.article-card:hover::before` (filet rouge). Les cinq vont dans un bloc `@media(hover:hover)` ; les sélecteurs qui partageaient leur règle (`.nav-link.active::after`, `.mega-menu.mega-open`) restent hors du bloc. Les deux zooms d'image qui migrent depuis Tailwind (§2.1) vont dans un second bloc, `@media(hover:hover) and (prefers-reduced-motion:no-preference)` : c'est le motif de Starlink (audit 7.5), et il règle le mouvement réduit sans `!important` ni `:hover` hors d'un bloc `hover:hover`.

Dans le balisage React : **20 variantes `hover:`** et **4 `group-hover:`** Tailwind (couleurs de texte, de fond, de bordure, soulignés). Tailwind 3.4 ne les enveloppe que globalement (`future.hoverOnlyWhenSupported` dans `tailwind.config.js`, qui produit `@media (hover: hover) and (pointer: fine)`), et `site.css` sert les 32 pages : l'option changerait le comportement tactile de tout le site. Le méga-menu s'ouvre au `onMouseEnter`/`onFocus` du déclencheur (JS), pas par `:hover` : envelopper `.mega-menu:hover` ne change rien au clavier ni au toucher.

### 2.4 Le réglage « réduire les animations »

Aujourd'hui, le bloc `@media(prefers-reduced-motion:reduce)` du `<style>` coupe `.animate-pulse`, la transition du filet `.article-card::before` et `.anim-fade-up`. Il **ignore** : les trois sections `FadeUp` (le style inline React ne lit pas la préférence), le zoom des images, et les entrées du menu mobile (`.menu-item{opacity:0}` + animation : si on coupait l'animation sans forcer `opacity:1`, les entrées resteraient invisibles).

Et sa règle `.animate-pulse{animation:none}` est **sans effet** : `site.css` (Tailwind), chargé en dernier élément du `<head>`, redéfinit `.animate-pulse` avec la même spécificité et gagne. Constaté au prompt 4 dans Chrome sans fenêtre, préférence émulée : la pastille « À la une » pulsait encore (`animationName: pulse`). La forme correcte est la variante Tailwind `motion-safe:animate-pulse`, dont l'animation n'est émise que sous `@media (prefers-reduced-motion: no-preference)` : aucune règle à battre.

### 2.5 Jetons

`assets/design-tokens-v2.css` est chargé par les 32 pages ; aucun fichier du dépôt n'emploie `--motion-fast`, `--motion-base` ni `--motion-slow` (grep sur `*.html`, `*.js`, `*.css`). Trois variables inemployées ne peuvent rien changer ailleurs ; on le prouve par captures de `analyses.html`, `expertise.html` et `geopolitics.html` (une React, deux legacy).

### 2.6 Tailwind compilé

`duration-500` et `group-hover:scale-[1.02]`/`[1.03]` ne sont employés que par `index.html` : ils disparaissent de `site.css` à la reconstruction. `duration-300` (13 autres pages) et `transition-all` (12 autres fichiers) y restent. Une classe nouvelle, `motion-safe:animate-pulse` (sans valeur arbitraire : `test/site-css.test.mjs` ne la vérifie pas, mais elle n'existe en ligne que si `site.css` est reconstruit) : `npm run build:css` et le commit de `site.css` sont obligatoires.

### 2.7 Outils de capture

Le CSS « GEL » de `capturer.mjs` force l'état final de `.anim-fade-up,.reveal,.scroll-reveal,[data-reveal]` : la classe `reveal` est déjà couverte, aucune copie modifiée n'est nécessaire. Le défilement complet avant capture déclenche l'observateur ; le gel coupe les transitions avant la photo.

## 3. Décisions

| Question | Décision | Pourquoi |
| --- | --- | --- |
| Jetons | `--motion-fast: .15s ease`, `--motion-base: .3s cubic-bezier(.4,0,.2,1)`, `--motion-slow: .5s ease-out`, dans les **deux** régimes de `design-tokens-v2.css`, commentaire sans accents (convention du fichier). | Tel que demandé ; le mouvement est une couche unique sur tout le site, comme le chrome. |
| Forme de `Reveal` | `Reveal({delay=0,stagger=0,children})` : **un enfant unique**, rendu par `React.cloneElement` avec `ref`, classes `reveal` puis `reveal is-visible`, `transitionDelay` inline. | Un `div` enveloppant casserait l'égalisation des hauteurs dans les grilles (les cartes sont des enfants directs étirés) et changerait la structure. Le balisage des enfants reste intact, donc le test de garde du prompt 3 (`h('h1',{className:…})`) garde sa portée. |
| Retrait après apparition | Sur `transitionend` (propriété `opacity`, cible = élément), `Reveal` rend l'enfant **tel quel** : plus de classe, plus de `transitionDelay`. | Les cartes ont leur propre `transition` (ombre, bordure) : laisser `.reveal` et le délai inline en place retarderait leurs survols de 0,3 à 0,8 s. Et l'élément redevient exactement ce qu'il était : état final identique au pixel. Limite connue : si la transition est interrompue (onglet caché pendant l'apparition), la classe reste ; l'état visuel est le même, seule la transition de survol de la carte est perdue jusqu'au rechargement. |
| Observateur | **Un seul** `IntersectionObserver` (seuil 0,15, comme aujourd'hui) pour tous les `Reveal`. Les éléments qui franchissent le seuil **dans la même image** forment un lot ; le rang dans le lot (parmi ceux qui ont `stagger`) multiplie `stagger`. | Avec `delay: 0.3 + i × 0.06` par index, la 9ᵉ carte de veille attend 0,78 s après être entrée dans l'écran (une colonne sur mobile), et jusqu'à 1,32 s après « Charger plus » : un trou visible. Le lot restitue la sémantique de Starlink (les cartes d'une même rangée se suivent de 0,06 s) sans lag cumulé. L'ordre des entrées d'un lot suit l'ordre d'observation, donc l'ordre du DOM (les effets React s'exécutent dans l'ordre des frères). **Écart assumé** avec la lettre du prompt. |
| Délais | Tableau §2.2 : 0 / 0,15 / 0,3, `stagger: 0.06` sur les cartes. Toujours un objet de props explicite (`h(Reveal,{delay:0},…)`). | Tel que demandé ; l'objet explicite rend le schéma lisible et vérifiable par le test de garde. |
| Hero | Migré vers `Reveal` (le `@keyframes fade-up`, `.anim-fade-up`, `.anim-d*` disparaissent). | Audit 7.3 : un seul mécanisme. Un élément déjà dans l'écran est signalé par l'observateur à la première image : l'apparition au chargement est conservée. Le translateY passe de 24 à 16 px, la durée de 0,6 à 0,5 s (jeton). |
| Bandeau, newsletter, pied de page | Non animés, comme aujourd'hui. | Le prompt remplace le fondu existant ; ajouter des apparitions là où il n'y en avait pas est une décision de design à prendre à part. |
| Mouvement réduit | `Reveal` lit `window.matchMedia('(prefers-reduced-motion: reduce)').matches` **au montage** (état initial d'un `useState`) et rend l'enfant tel quel, définitivement. Lire à chaque rendu laisserait un élément rendu nu sous « réduire » (donc jamais observé) repasser en `.reveal` invisible si la préférence change en cours de session (trouvé en relecture de spec). Le bloc CSS couvre en plus : `.reveal` (ceinture), `.zoom-hover` (transition ; le transform n'existe que sous `no-preference`), `.mobile-overlay.open .menu-item` (`animation:none;opacity:1`), et garde `.article-card::before`. La pastille et les 7 blocs squelette passent de `animate-pulse` à `motion-safe:animate-pulse` ; la règle `.animate-pulse{animation:none}` du bloc, battue par `site.css` (§2.4), est retirée. | Point 4 du prompt pour `Reveal`, le zoom et la pastille ; audit 7.5 (« entièrement ») pour les entrées du menu mobile, seule autre animation à déplacement (18 px). Les fondus d'état (méga-menu 8 px, overlay, hamburger) restent : ce sont des changements d'état, pas des mouvements. |
| Zoom des images | Classe `.zoom-hover{transition:transform var(--motion-slow)}` ; `.article-card:hover .zoom-hover{transform:scale(1.03)}` et `.featured-card:hover .zoom-hover{transform:scale(1.02)}` dans un bloc `@media(hover:hover) and (prefers-reduced-motion:no-preference)`. | Seule façon d'avoir à la fois une durée en jeton, le `hover:hover` et le mouvement réduit. Jeton `slow` et non `fast` : c'est un `transform` continu de 0,5 s aujourd'hui ; à 0,15 s un zoom de 2 à 3 % se lit comme un saut. Les « survols » du tableau 7.4 sont les changements de couleur et de filet, qui vont bien à `fast`. La courbe passe de `cubic-bezier(.4,0,.2,1)` à `ease-out` (jeton). |
| `transition-colors` | **Conservé** (21 occurrences). | Même durée que `--motion-fast` (150 ms) ; seule la courbe diffère (`cubic-bezier(.4,0,.2,1)` contre `ease`), imperceptible sur 150 ms. Le remplacer par une classe de page ferait diverger la home des 31 autres pages pour rien, et Tailwind ne peut pas consommer un jeton composé. **Écart assumé** : le point 6 du prompt porte sur les durées écrites ; `transition-colors` n'en écrit aucune. |
| `animate-pulse` | **Conservé** (2 s, boucle), sous la variante `motion-safe:`. | Hors de l'échelle à trois jetons (une pulsation à 0,5 s serait frénétique). Coupé en mouvement réduit par Tailwind lui-même, puisque la règle du `<style>` ne le coupait pas (§2.4). |
| En-tête | `.site-header{transition:all var(--motion-base)}` à la place de `transition-all duration-300`. | Même valeur calculée ; la propriété `all` est laissée au prompt 5, qui la restreindra. |
| `:hover` du `<style>` | Un bloc `@media(hover:hover)` pour les 5 règles existantes, un bloc `@media(hover:hover) and (prefers-reduced-motion:no-preference)` pour les 2 zooms, tous deux avant le bloc de mouvement réduit. `.nav-link.active::after` et `.mega-menu.mega-open` restent hors des blocs. | Point 5 du prompt ; deux blocs sont plus simples à lire et à vérifier qu'un enveloppement par règle, et le bloc de mouvement réduit ne porte ainsi aucun `:hover`. |
| Variantes `hover:` Tailwind | **Non enveloppées**. `future: { hoverOnlyWhenSupported: true }` est **proposé, pas activé** : il modifie les 32 pages et ne se vérifie pas par captures sur ordinateur (le media query y est vrai). | Consigne de la session mère : ne pas trancher seul un effet qui dépasse la home. À activer dans un chantier dédié, avec un essai sur écran tactile. |
| Test de garde | Nouveau `test/home-motion.test.mjs`. | Rendre permanents les six points : jetons dans les deux régimes ; aucun littéral de temps dans le `<style>` d'`index.html`, aucune classe `duration-*`, aucune `transition:`/`animation:` inline avec une durée dans le script ; chaque `:hover` du `<style>` dans un bloc `@media(hover:hover)` ; `Reveal` présent et lit la préférence, `FadeUp`/`anim-fade-up` absents, bloc de mouvement réduit couvrant `.reveal`, `.zoom-hover` et les entrées du menu mobile ; aucun `animate-pulse` sans `motion-safe:` ; `delay` ∈ {0, 0.15, 0.3} et `stagger` = 0.06 ; plus de `group-hover:scale-`. |
| `assets/site.css` | Reconstruit, commité. | Classes retirées (§2.6) ; le fichier commité doit rester égal à la reconstruction du déploiement. |
| `CLAUDE.md` | Non modifié. | 13 499 caractères pour 13 500. Rien d'inexact dedans après ce chantier. |

## 4. Fichiers touchés

```
assets/design-tokens-v2.css    + 3 jetons × 2 régimes
index.html                     <style> : 13 durées → jetons, retrait fade-up/anim-d*, règles .reveal/.zoom-hover/.site-header,
                               blocs @media(hover:hover) et (hover:hover) and (prefers-reduced-motion:no-preference), bloc mouvement réduit étendu ;
                               script : observateur partagé + Reveal (remplacent useInView + FadeUp), hero (6), 3 sections, en-tête, 2 img,
                               8 animate-pulse → motion-safe:animate-pulse
assets/site.css                reconstruit
test/home-motion.test.mjs      nouveau
docs/superpowers/specs/…       cette spec
docs/superpowers/plans/…       le plan, avec résultats mesurés
```

Rien d'autre : ni `styles.css`, ni les 32 autres pages, ni `tailwind.config.js`, ni `nav-config.js`, ni `CLAUDE.md`.

## 5. Vérification

1. `npm run build:css` puis `npm test` (78 + nouveaux tests).
2. Comparaison visuelle avant/après à 1440 et 390 px (outils du dossier de notes partagé, base « avant » faite sur `main` `48765711` avant toute modification) : `index.html` attendu **identique au pixel** (le contenu du flux est servi localement par le même `data/news.json`) ; `analyses.html`, `expertise.html`, `geopolitics.html` identiques (preuve que les jetons n'altèrent rien ailleurs). Toute différence est une régression.
3. Dans le navigateur, onglet actif :
   - au chargement, le hero apparaît en trois temps (titre, paragraphe, boutons et carte) ; au défilement, chaque section apparaît titre puis paragraphe puis grille, les cartes d'une rangée décalées de 0,06 s ; un `MutationObserver` ou un relevé des `transitionDelay` inline confirme les valeurs ;
   - `getComputedStyle` : `.reveal` a `transitionDuration` `0.5s, 0.5s` ; `.mega-menu` `0.3s` ; `.article-card` `0.15s` ; `.zoom-hover` `0.5s` ; `header` `0.3s` (les jetons se résolvent bien dans les raccourcis) ;
   - après apparition, les éléments n'ont plus ni classe `reveal` ni `transitionDelay` ;
   - émulation `prefers-reduced-motion: reduce` : rechargement, tout le contenu affiché sans transition (aucun élément `.reveal`), aucun zoom au survol d'une carte, pastille « À la une » immobile, entrées du menu mobile visibles ;
   - aucune erreur console nouvelle (le 404 `data/messari.json` est préexistant).
