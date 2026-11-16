# En-tête à deux états et méga-menu en verre sombre — prompt 5 de l'audit Starlink

Date : 2026-11-16. Statut : réalisé le 2026-11-16 sur la branche `claude/header-mega-menu-c4e31f` (worktree coupé de `main` `409ab302`) ; résultats mesurés dans le plan `docs/superpowers/plans/2026-11-16-en-tete-mega-menu.md`. Deux prémisses corrigées en cours de route et consignées (§3) : `.nav-scrolled` doit être déclaré après `.site-header`, et `md:w-full` est indispensable aux conteneurs de l'overlay.

## 1. Objet

Dernier des cinq prompts de l'audit Inflexion × Starlink (13 novembre 2026, sections 5.7, 5.8, 6.4, 6.8, 7.9 et prompt 5 de la section 10), sur `index.html` seulement. Six points :

1. **En-tête à deux états** : au-delà de 60 px de défilement (`scrolled`, déjà détecté), les quatre rubriques du menu s'effacent et un bouton « Menu » prend leur place ; il ouvre l'overlay plein écran qui servait jusqu'ici au mobile. Logo et « Réserver un diagnostic » restent. Transition `var(--motion-base)` sur `opacity`.
2. **Transition de l'en-tête** : `all` → `background-color` et `border-color` (audit 7.9).
3. **Méga-menu en verre sombre** : fond `rgba(23,16,14,.78)`, `backdrop-filter: blur(24px) saturate(1.4)`, bordure 1 px `var(--chrome-border)`, libellés `var(--chrome-text-1)`, descriptions `var(--chrome-text-2)`, filet rouge du haut conservé (audit 5.7).
4. **Pastilles `.mega-icon` supprimées**, intitulé de groupe en IBM Plex Mono 12 px majuscules en tête de chaque panneau (audit 6.8).
5. **Ouverture et fermeture au clic** sur chaque bouton de menu (audit 6.8).
6. **Logo à 40 px** de haut sur ordinateur (audit 5.8, partie « taille » seulement).

Critère de fin : les six points en place et vérifiés dans le navigateur sur un onglet actif à 1440 et 390 px ; `npm test` au vert avec un nouveau test de garde ; `prefers-reduced-motion: reduce` et les blocs `hover:hover` toujours respectés ; comparaison visuelle avant/après avec base « avant » sur `main`, chaque différence rangée dans un des six points ; PR vers `main` ouverte après le « oui ».

## 2. Ce que le cadrage a établi

Mesures faites sur `main` (`409ab302`), worktree servi sur `http://127.0.0.1:4399` (le port 3000 sert le dépôt principal, pas ce worktree). Numéros de ligne d'`index.html` à ce commit.

### 2.1 L'en-tête aujourd'hui (`Navigation()`, l. 260-334)

- Trois états React : `open` (overlay), `scrolled` (`window.scrollY > 60`, écouteur passif), `megaOpen` (index de la rubrique ouverte, -1 sinon).
- `header.site-header.fixed` (l. 275) : classe `nav-scrolled` ou `bg-transparent` selon `scrolled`. `.site-header{transition:all var(--motion-base)}` (l. 52) ; `.nav-scrolled{background:var(--chrome-scrolled);backdrop-filter:blur(16px);border-bottom:1px solid var(--chrome-border)}` (l. 50). Au repos il n'y a **pas de bordure** : `border-color` n'a rien à animer tant qu'une bordure transparente n'existe pas au repos.
- Logo (l. 279) : `img.h-10.sm:h-[50px].md:h-[65px]` sur `logo-header.png` (PNG 764 × 270, rendu blanc par `filter:brightness(10) saturate(0)`), dans une barre `h-16` (64 px) : 65 px dans 64. Les deux autres logos de la page (overlay l. 311 `h-8`, pied de page l. 655 `h-10`) ne sont pas concernés.
- `nav.hidden.md:flex.items-center.gap-1` (l. 281) : quatre `div.mega-trigger` puis le CTA `a.ml-4` « Réserver un diagnostic ». Rien ne change au défilement, sauf le fond de l'en-tête.
- Hamburger `button.hamburger.md:hidden` (l. 303) : `onClick:()=>setOpen(!open)`. L'overlay `.mobile-overlay.fixed.inset-0.z-[60]` (l. 309-331) n'est **pas** conditionné à la largeur : seul son déclencheur l'est. Il porte trois conteneurs internes (ligne logo + croix l. 310, liste défilante l. 316, bloc CTA l. 327), ses entrées gardent les monogrammes `item.icon` (l. 321) et des intitulés de groupe rouges `text-xs uppercase tracking-[.2em] text-[var(--editorial-accent-text)] font-semibold` (l. 318).
- **Overlay à 1440 px** (ouvert par script, capture dans le navigateur) : il tient (rien ne déborde, la liste défile : 672 px visibles pour 1 087), mais c'est une liste mobile étirée : chaque entrée fait 1 392 px de large, le CTA aussi. Aucune règle `md:` n'y pose de colonne.

### 2.2 Le méga-menu aujourd'hui

- Déclencheur (l. 284) : `onMouseEnter` ouvre, `onMouseLeave` ferme sauf si le focus est dedans, `onFocus` ouvre, `onBlur` ferme si le focus sort, `onKeyDown` Échap ferme **et retire le focus du bouton** (`b.blur()` : le focus tombe sur `body`). Le bouton (l. 285) n'a **pas d'`onClick`** ; `.mega-menu:hover` (l. 102, bloc `hover:hover`) maintient le panneau ouvert sous le pointeur.
- Sur tablette ou mobile large (≥ 768 px, où la `nav` est visible), un toucher émet `mouseover` puis, sur Android, `focus`, puis `click` : aujourd'hui le panneau s'ouvre par l'un des deux premiers et le `click` ne fait rien. Si l'on ajoutait seulement un `onClick` qui bascule, le même toucher ouvrirait (survol ou focus émulés) puis refermerait (clic) : **le point 5 oblige à revoir l'ouverture au survol et au focus**, pas seulement à ajouter un gestionnaire.
- Panneau (l. 286) : `mega-menu … bg-[#FFFFFF] border border-[var(--credibility-band)] p-5 shadow-[0_6px_18px_rgba(42,18,16,.20)]`, `minWidth` 440 px (grille 2 colonnes, Intelligence) ou 340 px. Règles `<style>` : `.mega-menu` (l. 45, position, transition en jetons, `min-width:340px`, `z-index:60`), `.mega-menu.mega-open`, `.mega-menu::before` (filet rouge 2 px, l. 47), `.mega-item{transition:background var(--motion-fast)}`, `.mega-icon` (l. 49), `.mega-item:hover{background:rgba(142,36,36,.06)}` (l. 103 : un rosé à 6 % pensé pour un fond blanc, invisible sur du sombre).
- Entrée (l. 289-295) : `a.mega-item.flex.items-start.gap-3.px-3.py-2.5` > `span.mega-icon.bg-[#F1E7DE].text-[var(--editorial-accent)]` (monogramme) + `span.flex.flex-col.min-w-0` > libellé `text-sm font-semibold text-[#101214]` + description `text-xs text-[#4C5052] mt-0.5`. Le `span` intermédiaire n'existe que pour empiler libellé et description à côté de la pastille.
- Le panneau ne s'ouvre jamais ailleurs que **sur le hero espresso** : le point 1 masque les déclencheurs dès 60 px de défilement. Le fond derrière le verre est donc l'espresso `#17100E`, la lueur `rgba(224,90,78,.12)` et, pour les panneaux Analyses et Intelligence, le haut de l'image gravée de la manchette (assombrie par `.img-gravure`, multiply espresso 55 %).

### 2.3 Contrastes sur le fond composé (WCAG 2.x)

Verre `rgba(23,16,14,.78)` composé sur quatre fonds, puis texte composé sur le verre (opacités des jetons 2 et 3). Calcul dans le plan (Task 0) ; à confirmer par échantillonnage des captures « après ».

| Fond derrière le verre | Verre composé | texte-1 | texte-2 | texte-3 | `#E05A4E` (accent) |
| --- | --- | --- | --- | --- | --- |
| espresso `#17100E` | `#17100E` | 16,24 | 8,28 | 5,51 | 5,14 |
| lueur au maximum | `#1C110F` | 15,86 | 8,16 | 5,47 | 5,02 |
| image gravée, pixel clair | `#27211F` | 13,65 | 7,38 | 5,12 | 4,32 |
| blanc (pire cas théorique) | `#4A4443` | 8,19 | 4,98 | 3,73 | 2,59 |

Lecture : libellés (texte-1) et descriptions (texte-2) passent 4,5:1 **même sur un fond blanc** derrière le verre, ce qui n'arrive jamais sur le hero. Le niveau 3 et l'accent rouge ne tiennent que sur l'espresso et la lueur : ils ne conviennent qu'au haut du panneau (au-dessus de l'image, y < 176 px à 1440), où va justement l'intitulé de groupe. Un intitulé en texte-3 sur l'image passerait sous 4,5 au même endroit : ce n'est pas un argument pour lui.

### 2.4 Tailwind compilé

Classes à valeur arbitraire qui ne vivent que dans `index.html` et disparaissent de `assets/site.css` : `bg-[#F1E7DE]` (pastille) et `shadow-[0_6px_18px_rgba(42,18,16,.20)]` (panneau). Restent, employées ailleurs : `bg-[#FFFFFF]` (11 fichiers), `border-[var(--credibility-band)]` (1 autre fichier), `h-[50px]` et `h-[65px]` (10 pages et `article-shell.js`), `text-[#101214]` et `text-[#4C5052]` (10 pages). Existent déjà : `text-[var(--chrome-text-1)]`, `text-[var(--chrome-text-2)]`. **Nouvelles**, sans valeur arbitraire (donc hors du champ de `test/site-css.test.mjs`) : `md:max-w-2xl`, `md:mx-auto`, `md:w-full` (overlay, §3). `npm run build:css` et le commit de `site.css` sont obligatoires ; le nouveau test vérifie la présence de `md:max-w-2xl`.

### 2.5 Pièges hérités des prompts 2 à 4, qui s'appliquent ici

- `site.css` est le dernier `<link>` du `<head>` : une classe Tailwind `transition-*` sur un élément **écrase** la `transition` d'une règle du `<style>` à même spécificité. Les boutons de rubrique portent `transition-colors` ; l'opacité des deux états doit donc être portée par un conteneur sans classe Tailwind de transition, jamais par les boutons eux-mêmes.
- Aucune durée en dur, tout `:hover` du `<style>` sous `@media(hover:hover)` (`test/home-motion.test.mjs`).
- React 18 rend après l'événement (microtâche) : un script de vérification relit l'état après une courte attente.
- `Page.captureScreenshot` avec `clip` est en coordonnées du **document** : un état défilé se photographie à partir de `scrollY`.
- Captures d'une page animée : laisser 3 s de repos avant le gel (`capturer-reveal.mjs`).

### 2.6 Outils de capture

`capturer-reveal.mjs` (page entière, base « avant » faite sur `main` `409ab302` : `index` à 1440 et 390) et `comparer.py` inchangés. Nouveau `capturer-etats.mjs` (même tuyau CDP) : 8 états par passage — à 1440 `en-tete`, `mega-analyses`, `mega-intelligence`, `en-tete-defile`, `overlay` ; à 390 `en-tete`, `en-tete-defile`, `overlay`. Même arborescence `<largeur>/<etat>.png`, donc comparable avec `comparer.py`. Avant : les 8 captures existent (à 1440 l'`overlay` est « aucun bouton », attendu : le bouton « Menu » n'existe pas encore ; le méga-menu s'ouvre par `mouseover`).

## 3. Décisions

| Question | Décision | Pourquoi |
| --- | --- | --- |
| **Deux états, structure** | Dans la `nav`, un conteneur `div.nav-states{display:grid;justify-items:end;align-items:center}` avec deux enfants `div.nav-state{grid-area:1/1}` : l'état « rubriques » (les quatre `mega-trigger`, `flex items-center gap-1`) et l'état « compact » (le bouton « Menu »). Chacun reçoit `is-hidden` selon `scrolled`. | Les deux états occupent la **même cellule** : sa largeur est celle des rubriques, le bouton « Menu » s'aligne à droite dans cette largeur, et « Réserver un diagnostic » ne bouge pas d'un pixel. Pas de position absolue ni de largeur mesurée. Au repos, l'en-tête est identique à aujourd'hui (le `gap-1` de la `nav` sépare désormais la grille du CTA comme il séparait la dernière rubrique du CTA). |
| **Deux états, transition** | `.nav-state{transition:opacity var(--motion-base),visibility var(--motion-base)}` ; `.nav-state.is-hidden{opacity:0;visibility:hidden;pointer-events:none}`. | Point 1 : opacité en `--motion-base`. `visibility` (discrète : bascule à la fin du fondu de sortie, au début du fondu d'entrée, comme `.mega-menu` déjà) retire l'état masqué de l'ordre de tabulation et de l'arbre d'accessibilité ; `pointer-events` évite qu'il intercepte des clics pendant le fondu. Portée par les `div` conteneurs, pas par les boutons (`transition-colors`, §2.5). |
| **Bouton « Menu »** | `button.nav-link` avec les classes des boutons de rubrique (`px-3 py-2 text-sm transition-colors … text-[var(--chrome-text-2)] hover:text-[var(--chrome-text-1)] …`), texte « Menu », `aria-expanded={open}`, `aria-controls="menu-overlay"` (l'overlay reçoit `id="menu-overlay"`), `onClick` → `setOpen(true)` et mémorise le bouton comme ouvreur. | Même famille visuelle que les rubriques ; l'audit 6.4 veut un bouton « Menu », pas une icône. |
| **Méga-menu ouvert quand on défile** | `useEffect(()=>{if(scrolled)setMegaOpen(-1)},[scrolled])`. | `.mega-menu.mega-open{visibility:visible}` redéclare `visibility` et battrait l'héritage de `.is-hidden` : un panneau ouvert resterait visible sous un déclencheur effacé. |
| **Overlay sur ordinateur** | Les trois conteneurs internes de l'overlay reçoivent `md:max-w-2xl md:mx-auto md:w-full` (colonne de 672 px centrée dès 768 px ; `md:w-full` est indispensable : en colonne flex, les marges automatiques annulent l'étirement et un conteneur sans largeur se rétrécit à son contenu, 248 px constatés en capture). Rien d'autre ne change (monogrammes, intitulés rouges, délais d'animation, CTA). | **Écart assumé** avec la lettre du prompt (« l'overlay existant ») : à 1440 il tient mais s'étire sur 1 392 px (§2.1). Trois classes, aucune règle nouvelle. |
| **Échap et retour du focus sur l'overlay** | Quand `open` est vrai, un écouteur `keydown` sur `document` ferme à Échap ; à la fermeture, le focus revient sur le bouton qui a ouvert (« Menu » ou hamburger, mémorisé dans une ref). | L'overlay devient atteignable au clavier sur ordinateur (il ne l'était que par le hamburger mobile) ; un dialogue plein écran sans Échap ni retour de focus piège l'utilisateur clavier. **Ajout** par rapport au prompt, trois lignes. Pas de piège à focus (focus trap) : laissé en suite. |
| **Transition de l'en-tête** | `.site-header{border-bottom:1px solid transparent;transition:background-color var(--motion-base),border-color var(--motion-base)}` ; `.nav-scrolled{background:var(--chrome-scrolled);backdrop-filter:blur(16px);border-bottom-color:var(--chrome-border)}`, **déclaré après** `.site-header`. | Point 2. À spécificité égale, le raccourci `border-bottom` de `.site-header` écraserait `border-bottom-color` s'il venait après : le filet disparaîtrait au défilement (constaté au pixel à la première passe). La bordure transparente au repos donne à `border-color` quelque chose à animer (sinon la bordure apparaît d'un coup, comme aujourd'hui) ; l'en-tête est `fixed`, ce pixel de plus ne déplace rien et ne se voit pas (transparent sur transparent). `backdrop-filter` n'est plus animé : il s'applique d'un coup au franchissement des 60 px, où l'en-tête ne recouvre que le haut du hero (espresso, lueur) : imperceptible, et c'est précisément le recalcul que l'audit 7.9 veut éviter. |
| **Verre sombre** | Dans la règle `.mega-menu` du `<style>` : `background:rgba(23,16,14,.78);backdrop-filter:blur(24px) saturate(1.4);border:1px solid var(--chrome-border);box-shadow:0 12px 32px rgba(0,0,0,.35)`. Le panneau garde `p-5` et perd `bg-[#FFFFFF] border border-[var(--credibility-band)] shadow-[…]`. `::before` (filet rouge) inchangé. | Point 3, valeurs de l'audit 5.7. L'ombre n'est pas dans la recette : conservée, **adoucie et assombrie**, parce que le verre composé sur l'espresso **est** de l'espresso (`#17100E`, §2.3) et que sans elle le panneau n'aurait pour contour que le filet à 22 %. À retirer si les captures la montrent boueuse. `backdrop-filter` sans préfixe, comme `.nav-scrolled` (Safari ≥ 18 ; avant, un panneau à 78 % sans flou, toujours lisible : §2.3). |
| **Couleurs des entrées** | Libellé `text-sm font-semibold text-[var(--chrome-text-1)]`, description `text-xs text-[var(--chrome-text-2)] mt-0.5`. `.mega-item:hover{background:rgba(245,237,230,.07)}` (texte-1 à 7 %). | Point 3. Le rosé à 6 % était un survol sur blanc ; sur verre sombre, c'est le voile clair qui se lit (texte-1 sur ce voile : 13,9:1). Le contour de focus reste `--editorial-accent-text` (règle `header :focus-visible` existante). |
| **Pastilles et intitulé** | `span.mega-icon` et la règle `.mega-icon` supprimés ; le `span.flex.flex-col.min-w-0` intermédiaire disparaît aussi, l'`a.mega-item` devient lui-même la colonne (`flex flex-col px-3 py-2.5 no-underline`). En tête du panneau, avant la grille : `p.kicker.mb-3.px-3` avec `style:{color:'var(--editorial-accent-text)'}`, texte `cat.label`. | Point 4. `.kicker` est déjà IBM Plex Mono, 12 px, 600, majuscules, interlettrage 0,18 em : la définition exacte du prompt, et la même forme que le kicker du hero sur fond sombre (même `style` inline) et que les intitulés rouges de l'overlay. `cat.label` (Analyses, Expertise, Intelligence, Services) est la source naturelle dans `MEGA_NAV`, qui n'est pas modifié. `px-3` aligne l'intitulé sur le texte des entrées. Le champ `icon` de `nav-config.js` reste : l'overlay et les autres pages s'en servent. |
| **Clic, survol, focus, toucher** | Bouton : `onClick:()=>setMegaOpen(megaOpen===ci?-1:ci)`. Déclencheur : `onPointerEnter` ouvre **seulement si `e.pointerType==='mouse'`** (remplace `onMouseEnter`) ; `onMouseLeave` et `onBlur` inchangés ; **`onFocus` supprimé** ; `onKeyDown` Échap ferme si ce panneau est ouvert et **rend le focus au bouton** (au lieu de `blur()`). Un effet pose, quand un panneau est ouvert, un écouteur `pointerdown` sur `document` qui ferme si la cible n'est pas dans un `.mega-trigger`. | Point 5. Modèle « disclosure » de WAI-ARIA : le clic (souris, toucher, Entrée, Espace) bascule ; Échap ferme ; le survol reste un raccourci pour la souris seule. Sans le filtre `pointerType`, le survol émulé d'un toucher ouvrirait puis le clic refermerait (§2.2) ; sans retirer `onFocus`, le focus posé par un toucher Android ferait de même. **Écart assumé** : un bouton de rubrique focalisé au clavier n'ouvre plus son panneau tout seul, il faut Entrée ; c'est le comportement standard et il évite qu'une tabulation à travers la barre ouvre quatre panneaux. L'écouteur `pointerdown` ferme au toucher hors du panneau sur iOS, où les boutons ne prennent pas le focus (donc jamais d'`onBlur`). Avec une souris, cliquer la rubrique survolée **ferme** son panneau : c'est « fermer au clic », demandé. |
| **Logo** | `className:'h-10 w-auto'` sur le logo de l'en-tête (40 px à toutes les largeurs ; le mobile y était déjà). | Point 6. Le passage en SVG (audit 5.8) n'est pas demandé par le prompt : suite. |
| **`hoverOnlyWhenSupported`** | Toujours **proposé, pas activé**. Ce chantier n'ajoute aucune variante `hover:` nouvelle hors de celles déjà portées par les boutons (le bouton « Menu » copie leurs classes). | Décision globale aux 32 pages, consigne de la session mère depuis le prompt 4 : à trancher à part, avec un essai tactile. |
| **Test de garde** | Nouveau `test/home-header.test.mjs`, 7 tests (plan Task 1). | Rendre les six points permanents et garder les pièges de la cascade (`transition-colors` jamais sur un `.nav-state`, `md:max-w-2xl` présent dans `site.css`). |
| **`CLAUDE.md`** | Non modifié. | 13 499 / 13 500 caractères ; rien d'inexact après ce chantier. |

## 4. Fichiers touchés

```
index.html                     <style> : .site-header (bordure transparente, transition restreinte), .nav-scrolled (border-bottom-color),
                               .mega-menu (verre, bordure, ombre), .mega-icon supprimée, .mega-item:hover (voile clair), .nav-states/.nav-state/.is-hidden ;
                               script : Navigation (deux états, bouton Menu, effets scrolled/megaOpen/open, déclencheurs, panneau, entrées, logo, overlay id + colonne md:)
assets/site.css                reconstruit (− bg-[#F1E7DE], shadow-[…] ; + md:max-w-2xl, md:mx-auto, md:w-full)
test/home-header.test.mjs      nouveau
docs/superpowers/specs/…       cette spec
docs/superpowers/plans/…       le plan, avec résultats mesurés
```

Rien d'autre : ni `nav-config.js`, ni `nav-shared.js`, ni les copies de `Navigation` des autres pages React, ni `styles.css`, ni `assets/design-tokens-v2.css`, ni `tailwind.config.js`, ni `CLAUDE.md`.

## 5. Vérification

1. `npm run build:css` puis `npm test` (142 + 7).
2. Comparaison visuelle (serveur du worktree, port 4399) : page entière avec `capturer-reveal.mjs` et états avec `capturer-etats.mjs`, `comparer.py` contre la base « avant » de `main`. Attendu pour `index` entière : **une seule zone de différence**, le logo de l'en-tête (point 6), aux deux largeurs ; pour les états : `en-tete` logo seul ; `mega-*` panneau entier (points 3 et 4) et logo ; `en-tete-defile` rubriques → « Menu » et logo (point 1) ; `overlay` à 1440 nouveau (point 1) ; à 390, `overlay` identique. Toute autre différence est une régression.
3. Script CDP `verifier-en-tete.mjs` (onglet actif, 1440 × 900 puis 390 × 844) : logo 40 px ; `transition-property` de l'en-tête `background-color, border-color` ; clic ouvre (`aria-expanded`, `.mega-open`), second clic ferme, Échap ferme et rend le focus ; styles calculés du panneau (fond, `backdrop-filter`, bordure), des libellés et descriptions ; aucun `.mega-icon`, premier enfant du panneau `p.kicker` en Plex Mono 12 px majuscules ; après 400 px de défilement les rubriques sont `visibility:hidden`, le panneau fermé, « Menu » visible, fond et bordure de l'en-tête posés ; « Menu » ouvre l'overlay, Échap le ferme et rend le focus ; à 390 le hamburger seul ; sous `prefers-reduced-motion: reduce` l'overlay affiche ses entrées ; console sans erreur nouvelle.
4. Contrastes mesurés sur les captures « après » : fond échantillonné sous les libellés, descriptions et intitulés des panneaux Analyses et Intelligence ; libellés et descriptions ≥ 4,5:1.
5. Volet navigateur de la session : passage manuel à 1440 (survol, clic, Échap, défilement, « Menu », overlay en colonne) et 390.

## 6. Suites (hors périmètre, à consigner)

- Les 14 autres pages React (copies de `Navigation`) et `nav-shared.js` (16 pages legacy) gardent l'ancien en-tête et le méga-menu blanc : propagation sur le modèle de la PR #146.
- Logo en SVG (audit 5.8) ; lien unique pour « Services » (audit 6.8, modifie `nav-config.js`) ; `scroll-behavior: smooth` et `scroll-margin-top` (audit 7.9, second tiret).
- Piège à focus dans l'overlay ; `hoverOnlyWhenSupported`.
