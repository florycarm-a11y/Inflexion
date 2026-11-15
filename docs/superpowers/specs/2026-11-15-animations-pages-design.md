# Apparitions des pages React : propagation du prompt 4 — audit Starlink

Date : 2026-11-15. Statut : cadrage mesuré, en attente de validation. Suite directe du prompt 4 (`docs/superpowers/specs/2026-11-15-animations-design.md`, PR #145 fusionnée dans `main` le 2026-11-15, merge `5ed84a19`) : branche `feat/animations-pages` au-dessus de `main`.

## 1. Objet

Porter aux **15 pages React** qui gardent l'ancien mécanisme ce que la home a reçu au prompt 4 : le composant `Reveal` (un élément à la fois, un seul `IntersectionObserver`, retrait après `transitionend`, préférence « réduire les animations » lue au montage), les trois jetons `--motion-fast/base/slow`, l'ordre d'apparition 0 / 0,15 / 0,3 s et + 0,06 s par carte, les `:hover` du CSS de page sous `@media(hover:hover)`, et plus aucune durée écrite en dur.

Pages : `analyses.html`, `analysis-template.html`, `briefing.html`, `artifact-inflexion.html`, et les 11 articles React (`analyse-*.html` hors les trois legacy `droits-douane`, `ia-rempart`, `or-bitcoin`). Plus la coquille partagée `assets/article-shell.js`, qui rend la navigation, la page de garde, le corps et l'appareil critique de 5 de ces pages.

Critère de fin : plus aucune des 15 pages ne charge `scroll-reveal.js` ni ne définit `FadeUp`, `useInView`, `anim-fade-up` ou `reveal-section` ; durées en jetons ; `:hover` sous `@media(hover:hover)` (une exception assumée, §3) ; mouvement réduit respecté, dont la pastille d'`analyses.html` ; `assets/site.css` reconstruit ; `npm test` au vert avec un test de garde paramétré par page ; état « apparu » **identique au pixel** à la base « avant » pour les 15 pages et 3 témoins ; PR ouverte après le « oui ».

## 2. Ce que le cadrage a établi

Mesures faites sur `feat/animations` (`f9e295a2`, arbre identique à `main` `5ed84a19` après fusion de la PR #145) avant toute modification : relevé statique (`grep`, extraction des `<style>`), et relevé dynamique dans Chrome sans fenêtre (script CDP `inventaire-sr.mjs`, dossier de notes partagé : pour chaque page, éléments `.sr-hidden` avant défilement, `.anim-fade-up`, `.reveal-section`, puis après défilement complet et 3 s de repos, `.sr-visible` et `.sr-hidden` restants, erreurs console), à 1440 et 390 px.

### 2.1 Inventaire par page

| Page | Famille | `<style>` : littéraux de temps | `:hover` (règles) | Apparition au chargement | Apparition au défilement (mesurée) | Autres |
| --- | --- | --- | --- | --- | --- | --- |
| 7 articles React « ancienne structure » (`arctique`, `cloud-ia`, `corridor-defense`, `cuba`, `fta-ue-inde`, `madagascar`, `petrole-ormuz`) | A | **19** (dont `12s` et `8s` du hero dynamique) | 6 | hero : 4 `.anim-fade-up` (badge, `h1`, chapo, méta) | **aucune** : `scroll-reveal.js` est chargé mais ne cible rien (le corps est un `article.prose`, pas de `section` hors le hero déjà à l'écran) — 0 élément `.sr-*` à 1440 et 390 | en-tête `transition-all duration-300` ; `.featured-card` définie, inemployée |
| 4 dossiers (`ukraine`, `turquie`, `sahel`, `mer-chine`) + `analysis-template` | B | **19** (idem) | 6 | **aucune** : `.anim-fade-up` définie, jamais posée (la page de garde vient d'`article-shell.js`) | **13 sections entières** (6 `Section` + 7 de l'appareil critique ; 10 pour le gabarit) en `.sr-hidden` → `.sr-visible`, `.6s`, 20 px ; la plus haute mesure 2 376 px à 390 | en-tête dans `article-shell.js` |
| `analyses.html` | C | **16** | 5 | hero : 3 (kicker, `h1`, chapo) | à 1440 : **rien** (tout est à l'écran au premier scan) ; à 390 : la section grille entière (3 679 px) | `animate-pulse` nu (pastille « Article du jour ») ; `group-hover:scale-105 transition-transform duration-300` sur l'image des cartes ; en-tête `duration-300` |
| `artifact-inflexion.html` | D | **17** | 5 | hero : 7 (badge, `h1`, chapo, CTA, 3 cartes `anim-d2/3/4`) | aucune (ne charge pas `scroll-reveal.js`) | en-tête `duration-300` ; `transition:'filter 0.3s ease'` inline sur le logo |
| `briefing.html` | E | **23** | 4 | hero : 4 (badge LIVE, `h1`, chapo, méta) | **son propre `Reveal`** : `div.reveal-section` enveloppant (`.7s`, 32 px, seuil 0,08, `useInView`) sur 8 blocs (5 rendus avec les données locales) | identité **ancienne** (Libre Baskerville, Inter, `#006650`) ; `briefing-card .3s` ; `prob-fill .8s` ; `toc-dot/.toc-link .2s` (règles mortes) ; `transition-all duration-200` (sommaire) ; `filter 0.3s` inline ; `pulse-live 2s` inline ; `spin 1s` inline **sans `@keyframes spin`** (le spinner ne tourne pas) ; `slide-in-left` et `count-up` définis, inemployés |

Aucune erreur console sur les 15 pages. Les `<style>` des 12 pages articles sont identiques à 4 variantes près (commentaire, ligne vide, tailles de `.prose`, règles `.pillar-card`/`.matrix-table` de `cloud-ia`) : **leurs règles de mouvement sont les mêmes partout**, ce qui permet un remplacement par chaînes exactes à compte vérifié, page par page.

### 2.2 Les durées écrites en dur, par règle

Même lecture qu'au prompt 4 : chaque durée tombe sur un jeton **selon sa nature**, pas selon sa valeur la plus proche.

| Règle | Aujourd'hui | Nature | Devient | Pages |
| --- | --- | --- | --- | --- |
| `@keyframes fade-up`, `.anim-fade-up`, `.anim-d1…d3` (`d4` : `briefing`, `artifact`) | `.6s`, délais `.1`–`.4s` | apparition au chargement (hero) | **supprimés** : `Reveal` | 15 |
| `.nav-link::after` | `transform .25s ease` | survol | `var(--motion-fast)` | 15 |
| `.mega-menu` | `.22s` ×3 | menu | `var(--motion-base)` ×3 | 15 |
| `.mega-item` | `background .15s ease` | survol | `var(--motion-fast)` | 15 |
| `.hamburger span` | `all .3s ease` | icône d'état | `var(--motion-base)` | 15 |
| `.mobile-overlay` | `.35s` ×2 | menu | `var(--motion-base)` ×2 | 15 |
| `.mobile-overlay.open .menu-item` | `menu-item-in .4s ease-out` | apparition | `var(--motion-slow)` | 15 |
| `.article-card`, `.article-card::before` | `.18s` ×2, `.22s` | survol | `var(--motion-fast)` ×3 | 14 (pas `briefing`) |
| `.featured-card::before` | `transform .3s ease` | survol (règle inemployée) | `var(--motion-fast)` | 12 articles |
| `.hero-dynamic`, `.hero-dynamic::before` | `12s` et `8s`, `infinite` | **boucles décoratives** | **conservées** (hors échelle, comme `animate-pulse` au prompt 4), **mises en pause** en mouvement réduit | 12 articles, `briefing` |
| en-tête React `transition-all duration-300` | 300 ms | état au défilement | classe `.site-header{transition:all var(--motion-base)}`, même valeur | 10 pages + `article-shell.js` |
| `analyses` : `img` des cartes `group-hover:scale-105 transition-transform duration-300` | 300 ms | survol (zoom) | classe `.zoom-hover`, `transform var(--motion-slow)` (nature = zoom de la home, 500 ms) | `analyses` |
| `briefing` : `.reveal-section` | `.7s` ×2, 32 px | apparition au défilement | **supprimée** : `.reveal`, `var(--motion-slow)`, 16 px | `briefing` |
| `briefing` : `.briefing-card` | `box-shadow .3s`, `border-color .3s` | survol | `var(--motion-fast)` ×2 | `briefing` |
| `briefing` : `.prob-fill` | `width .8s` | révélation d'une donnée | `var(--motion-slow)` | `briefing` |
| `briefing` : `.toc-dot`, `.toc-link` | `.2s` ×2 (règles mortes : la classe `toc-link` n'est posée nulle part) | état actif | `.toc-link{transition:background-color var(--motion-fast),color var(--motion-fast)}`, posée sur les liens du sommaire à la place de `transition-all duration-200` ; `.toc-dot` → `var(--motion-fast)` | `briefing` |
| `briefing`, `artifact` : logo `transition:'filter 0.3s ease'` inline | 300 ms | état au défilement | classe `.logo-scroll{transition:filter var(--motion-base)}` | 2 |
| `briefing` : `animation:'pulse-live 2s ease infinite'` inline | boucle | pastille LIVE | classe `.pulse-live`, durée conservée (boucle), pause en mouvement réduit | `briefing` |
| `briefing` : `animation:'spin 1s linear infinite'` inline | boucle **inerte** (`@keyframes spin` absent de la page et de `site.css`) | indicateur de chargement | classe `.spin` + `@keyframes spin` : le spinner tourne enfin ; **non** mis en pause en mouvement réduit (indicateur d'état essentiel, WCAG 2.3.3) | `briefing` |
| `briefing` : `@keyframes slide-in-left`, `count-up` | définis, inemployés | — | supprimés | `briefing` |
| `.transition-colors` Tailwind | 150 ms | survol | **conservé** (décision du prompt 4) | 15 |

### 2.3 Les `:hover`

Dans chaque `<style>` : `.nav-link:hover::after`, `.mega-trigger:hover .mega-menu,.mega-menu:hover`, `.mega-item:hover`, `.article-card:hover`, `.article-card:hover::before` (+ `.featured-card:hover::before` sur les 12 articles ; `briefing` : `.briefing-card:hover` à la place des deux `.article-card`).

**Différence décisive avec la home** : ici le méga-menu s'ouvre **par CSS** (`.mega-trigger:hover .mega-menu`), pas par JS (`onMouseEnter`/`onFocus` → `.mega-open` sur la home). Sur une tablette (≥ 768 px, nav de bureau affichée, `hover:none`), ce `:hover` émulé au toucher est **le seul moyen d'ouvrir le menu**. Le mettre sous `@media(hover:hover)` rendrait le méga-menu inaccessible sur iPad : c'est l'exception assumée du §3.

Variantes `hover:` Tailwind du balisage : non enveloppées (`hoverOnlyWhenSupported` est global aux 32 pages ; décision du prompt 4 maintenue).

### 2.4 Le réglage « réduire les animations »

Aujourd'hui : `scroll-reveal.js` s'abstient sous `reduce` (correct) ; le bloc `@media(prefers-reduced-motion:reduce)` des pages ne coupe que `.article-card::before` ; `analyses.html` y ajoute `.animate-pulse{animation:none}`, **sans effet** (battue par `site.css`, même piège qu'à la home : la pastille « Article du jour » pulse encore). Ignorés partout : le hero `.anim-fade-up`, les entrées du menu mobile, le hero dynamique (orbe qui se déplace de 30 px, dégradé qui dérive), le `Reveal` de `briefing` (style inline), le zoom des images d'`analyses`, la pastille LIVE et la jauge de `briefing`.

### 2.5 Ce qui ne doit pas disparaître

`scroll-reveal.js` est aussi **injecté dynamiquement par `nav-shared.js` (l. 347-348)** sur les 16 pages legacy quand aucune balise ne le charge. Le fichier reste donc dans le dépôt ; seules les 13 balises `<script src="scroll-reveal.js">` des pages React sont retirées. La migration des pages legacy est un chantier à part (§7).

### 2.6 Contraintes de `Reveal`

- **Seuil 0,15** : un élément observé n'apparaît que si 15 % de sa hauteur sont visibles. Un bloc plus haut que 6,6 fois la fenêtre (5 626 px à 390) ne se déclencherait **jamais** et resterait invisible. Les blocs les plus hauts mesurés sont la section 6 de `mer-chine` (2 376 px) et les blocs `enjeux`/`risques` de `briefing` (2 876 px) : sous la limite, mais c'est la raison pour laquelle `Reveal` se pose sur des éléments, jamais sur une section ou une colonne entière.
- **Enfant hôte unique** (`React.Children.only`, `typeof type === 'string'`). Dans les dossiers, les enfants directs de `Section` sont `P(…)` (`div`), `SousTitre(…)` (`h3`), `h('div', insight-box)`, `h('p')` : tous hôtes (vérifié sur les 5 pages).
- **Jamais sur un élément portant `transition-*` Tailwind** (`site.css`, chargé en dernier, écraserait la `transition-property` de `.reveal`) : on enveloppe leur conteneur. Les cartes `.article-card`/`.briefing-card` portent leur `transition` dans le `<style>` de la page : `.reveal` est déclaré **après** elles.

### 2.7 Tailwind compilé

Après migration : `duration-300` et `transition-all` ne restent employés que si des pages legacy les portent (à relever à la reconstruction) ; `duration-200`, `transition-transform`, `group-hover:scale-105` disparaissent (`analyses`, `briefing` seules). `motion-safe:animate-pulse` existe déjà (home). `npm run build:css` et le commit de `site.css` sont obligatoires.

### 2.8 Outils

Base « avant » faite sur `f9e295a2` (= `main` `5ed84a19`, arbre identique) avec `capturer-reveal.mjs` (repos de 3 s) : 15 pages + 3 témoins (`index`, `expertise`, `geopolitics`) × 1440 et 390 = 36 captures. Le GEL force `.anim-fade-up,.reveal,…{opacity:1}` : `.sr-visible` (animation `forwards`, durée gelée à 0) et `.reveal-section.visible` tombent sur leur état final sans règle supplémentaire.

## 3. Décisions

| Question | Décision | Pourquoi |
| --- | --- | --- |
| Où vit `Reveal` | **Copié tel quel** depuis `index.html` (version durcie : enfant hôte exigé, `onTransitionEnd` chaîné, préférence lue au montage) : **exporté par `assets/article-shell.js`** pour les 5 dossiers ; **une copie par page** pour les 10 autres (7 articles, `analyses`, `artifact`, `briefing`). | Consigne de la session mère. Chaque page React embarque son arbre : une copie locale respecte cette architecture et ne crée aucune dépendance entre pages. Un module partagé `assets/reveal.js` (toutes les pages importent la même URL `react@18.2.0`, donc la même instance) est **possible plus tard** ; il toucherait aussi la home et son test, hors périmètre. |
| Observateur | Un seul par page (dans `article-shell.js`, un seul par module, donc par page). Seuil 0,15, décalage par lot. | Comme la home. |
| **Famille A** (7 articles) | Hero : badge **0**, `h1` **0**, chapo **0,15**, méta **0,3**. Corps : **rien** (ne bougeait pas). Balise `scroll-reveal.js` retirée. | Mesuré : `scroll-reveal.js` n'y animait rien. Ajouter des apparitions au corps serait une décision de design à part (règle du prompt 4). |
| **Famille B** (dossiers), page de garde | **Non animée**, comme aujourd'hui. | Même règle. Alternative, si la personne la préfère : les 4 lignes de texte (kicker 0, `h1` 0, chapo 0,15, ligne méta 0,3) comme les autres heros du corpus ; les blocs de données restent statiques. |
| Famille B, corps (`Section`) | `h2` **0** ; chaque enfant direct (`P`, `SousTitre`, `insight-box`, `p`) **0,15**, sans décalage de lot (ce sont des blocs de texte, pas des cartes). Posé par `Section` dans `article-shell.js`. | Remplace le fondu de la section entière par la choréographie du prompt 4 (titre puis texte). Les blocs restent petits : jamais de `Reveal` sur une section (§2.6). Alternative : `Reveal` sur la section entière (ce que faisait `scroll-reveal.js`) — refusée : c'est le « fondu de section » que l'audit 7.2 écarte, et les sections de 2 000 px frôlent la limite du seuil. |
| Famille B, appareil critique | Titres **0** ; `p` d'introduction **0,15** ; tableaux, listes, encadrés **0,3** ; cartes de scénario et « Articles liés » **0,3 + rang × 0,06** ; les deux CTA **0,3**. | Même schéma : titre / texte / grille. |
| **Famille C** (`analyses`) | Hero : kicker 0, `h1` 0, chapo 0,15. « Article du jour » : ligne badge 0, `h2` 0, sous-titre 0,15, liste et étiquettes 0,3. Grille : filtres **0**, compteur **0,15**, cartes **0,3 + rang × 0,06**. Pastille → `motion-safe:animate-pulse` (règle morte retirée). Image des cartes → `.zoom-hover` (`var(--motion-slow)`, `scale(1.05)` sous `(hover:hover) and (prefers-reduced-motion:no-preference)`). | La grille n'était fondue qu'à 390 et d'un bloc ; les cartes gagnent le décalage de grille comme sur la home. Zoom en `slow` par nature (celle de la home), 300 → 500 ms : **écart assumé**, la durée change, pas l'état. |
| **Famille D** (`artifact`) | Hero : badge 0, `h1` 0, chapo 0,15, CTA 0,3, 3 cartes **0,3 + rang × 0,06** (étaient 0,2 / 0,3 / 0,4). | Les cartes sont une grille. |
| **Famille E** (`briefing`) | Hero : badge 0, `h1` 0, chapo 0,15, méta 0,3. Ses 8 blocs : la ligne de titre (`h3` + filet) **0**, le texte d'intro **0,15**, les cartes **0,3 + rang × 0,06** (`enjeux`, `risques`, `thèmes`), la carte agenda et les étiquettes **0,3** ; la barre « Pipeline IA » et le « Signal du jour » **0** (blocs sans titre). `useInView`, l'ancien `Reveal`, `.reveal-section` supprimés. Identité ancienne **non touchée** (seul le mouvement). | Même schéma ; la page reste à migrer en identité v2 par ailleurs. |
| Méga-menu `:hover` | `.mega-trigger:hover .mega-menu,.mega-menu:hover` **reste hors** du bloc `hover:hover` ; les 4 ou 5 autres règles y vont. **Exception assumée**, inscrite dans le test de garde avec sa raison. | §2.3 : ouverture du menu, pas effet de survol ; la mettre sous `hover:hover` rendrait le menu inaccessible sur tablette. La vraie correction (ouverture JS comme la home) relève du prompt 5 (en-tête et méga-menu). |
| Boucles décoratives | `hero-gradient-shift 12s`, `hero-orb-float 8s`, `pulse-live 2s`, `spin 1s` : durées **conservées**, hors de l'échelle à trois jetons ; `animation-play-state:paused` en mouvement réduit (sauf `spin`). Le test de garde ne tolère un littéral de temps que sur une déclaration `animation` en `infinite`. | Comme `animate-pulse` au prompt 4 : une boucle de 12 s à 0,5 s serait absurde. `paused` plutôt que `none` : l'état figé est la première image-clé, exactement celle du GEL des captures, donc aucun écart visuel. |
| Mouvement réduit | Bloc par page : `.article-card::before` (et `.featured-card::before`) `transition:none` ; `.reveal{opacity:1;transform:none;transition:none}` ; `.mobile-overlay.open .menu-item{animation:none;opacity:1}` ; `.hero-dynamic,.hero-dynamic::before{animation-play-state:paused}` où le hero dynamique existe ; `analyses` : `.zoom-hover{transition:none}` ; `briefing` : `.pulse-live{animation-play-state:paused}`, `.prob-fill{transition:none}`. `Reveal` lit la préférence au montage. | Point 4 du prompt, audit 7.5 (« entièrement »). |
| En-tête | `.site-header{transition:all var(--motion-base)}` dans chaque `<style>` ; classe posée sur le `header` (10 pages + `article-shell.js`). | Même valeur calculée ; `all` sera restreint au prompt 5. |
| `scroll-reveal.js` | 13 balises retirées ; **fichier conservé** pour les 16 pages legacy (§2.5). | Le supprimer casserait `expertise`, `geopolitics`, etc. |
| Test de garde | Nouveau `test/pages-motion.test.mjs`, dérivé de `test/home-motion.test.mjs`, **paramétré** sur les 15 pages + `article-shell.js` : aucun littéral hors boucle `infinite`, trois jetons consommés, aucune classe `duration-*`, aucune durée inline, `:hover` hors bloc = exactement l'ouverture du méga-menu, `Reveal` présent (copie ou import), mots morts absents (`FadeUp`, `useInView`, `anim-fade-up`, `fade-up`, `reveal-section`, `scroll-reveal.js`, `sr-hidden`), bloc de mouvement réduit complet, `animate-pulse` toujours en `motion-safe:`, délais ∈ {0, 0,15, 0,3} et `stagger` = 0,06, `site.css` reconstruit. | Rendre permanents les six points sur 16 fichiers. |
| `assets/site.css` | Reconstruit, commité. | §2.7. |
| `CLAUDE.md` | Non modifié (13 499 / 13 500). | Rien d'inexact après ce chantier. |
| Pages legacy | Hors périmètre : leur apparition vient de `nav-shared.js` → `scroll-reveal.js`. | Autre mécanisme, autre chantier (§7). |

## 4. Choréographie par page

Toujours un objet de props explicite : `h(Reveal,{delay:0},…)`. Les éléments qui portent `transition-colors` ne reçoivent jamais `Reveal` directement.

**A — 7 articles** (`AnalysisHero`) : `div` badge + rubrique **0** ; `h1` **0** ; `p` chapo **0,15** ; `div` méta (filet, auteur, date, durée) **0,3**.

**B — `article-shell.js`** : `Section` → `h2` **0**, enfants directs **0,15** (clé = rang dans la section). `Apparatus` → « Évaluation SEMPLICE » : `h2` 0, `div` du tableau 0,3, `p` lecture du score 0,15 ; scénarios : `h2` 0, cartes 0,3 + 0,06 ; matrice : `h2` 0, `div` du tableau 0,3 ; alertes : `h3` 0, `insight-box` 0,3 ; sources : `h2` 0, `p` méta 0,15, `ul` 0,3, `p` note 0,15 ; AMF : `insight-box` 0,3 ; CTA : les deux `div` 0,3 ; articles liés : `p` libellé 0, cartes 0,3 + 0,06. `Cover` : rien. `Navigation` : classe `site-header`.

**C — `analyses.html`** : `PageHero` 3 éléments (0 / 0 / 0,15) ; `ArticleDuJour` : `div` ligne badge + date 0, `h2` 0, `p` sous-titre 0,15, `ul` points 0,3, `div` étiquettes 0,3 ; `AnalysesGrid` : `div` filtres 0, `p` compteur 0,15, cartes `a.article-card` 0,3 + 0,06 (clé `a.id`), état vide (`p`) 0,15.

**D — `artifact-inflexion.html`** : `Hero` : badge 0, `h1` 0, `p` 0,15, `div` CTA 0,3, 3 `article` 0,3 + 0,06.

**E — `briefing.html`** : `BriefingHero` : 4 éléments (0 / 0 / 0,15 / 0,3) ; `BriefingContent` : barre pipeline `div` 0 ; signal du jour `div` 0 ; synthèse `div.prose-container` 0,15 ; enjeux : `div` titre 0, cartes 0,3 + 0,06 ; radar : `div` titre 0, cartes 0,3 + 0,06 ; thèmes : `div` titre 0, cartes 0,3 + 0,06, `p` avertissement 0,15 ; agenda : `div` titre 0, `div.briefing-card` 0,3 ; étiquettes : `div.flex` 0,3.

## 5. Fichiers touchés

```
assets/article-shell.js        import useRef ; observateur + Reveal exportés ; Section, Apparatus posent Reveal ; header .site-header
analysis-template.html, 4 dossiers   <style> : durées → jetons, retrait fade-up/anim-d*, .reveal/.site-header, blocs hover et mouvement réduit ; balise scroll-reveal retirée
7 articles React               idem + script : Reveal copié, hero (4), header .site-header
analyses.html                  idem + ArticleDuJour, grille, pastille motion-safe, .zoom-hover
artifact-inflexion.html        idem + hero (7), .logo-scroll
briefing.html                  idem + useInView/Reveal/reveal-section remplacés, 8 blocs, .briefing-card/.prob-fill/.toc-*/.pulse-live/.spin, .logo-scroll
assets/site.css                reconstruit
test/pages-motion.test.mjs     nouveau
docs/superpowers/specs/…       cette spec ; docs/superpowers/plans/… le plan, avec résultats mesurés
```

Rien d'autre : ni `index.html`, ni `scroll-reveal.js`, ni `nav-shared.js`, ni `styles.css`, ni les 16 pages legacy, ni `tailwind.config.js`, ni `CLAUDE.md`.

## 6. Vérification

1. `npm run build:css` puis `npm test` (83 + nouveaux).
2. Captures « après » des 18 mêmes pages à 1440 et 390 (`capturer-reveal.mjs`, même serveur), `comparer.py` : les 15 pages et les 3 témoins attendus **identiques au pixel** (contenu servi localement : `data/*.json` du dépôt). Toute différence est une régression, sauf zone dynamique documentée (horodatages).
3. Script CDP de contrôle du mouvement sur un représentant par famille (`ormuz`, `ukraine`, `analyses`, `artifact`, `briefing`) : délais inline attendus sur le hero ; jetons résolus (`getComputedStyle`) ; plus aucun `.reveal` après apparition ; sous `reduce` émulé : aucun `.reveal`, pastilles immobiles, hero dynamique en pause, aucun zoom ; console vide.
4. Volet navigateur, onglet actif : un dossier (sections titre puis texte), `analyses` (cartes décalées, pastille), `briefing` (cartes décalées, sommaire).

## 7. Suites possibles (hors périmètre)

- Pages legacy (16) : `nav-shared.js` injecte `scroll-reveal.js` ; à remplacer par un équivalent sans React ou par `Reveal` quand elles passeront en React.
- Méga-menu des 15 pages : ouverture JS comme la home (prompt 5), ce qui permettrait de ranger `.mega-trigger:hover` sous `hover:hover`.
- `assets/reveal.js` partagé (home comprise) si les copies divergent.
- `briefing.html` : identité v2 (typo, couleurs), chantier distinct.
- `hoverOnlyWhenSupported` : décision globale, essai tactile.
