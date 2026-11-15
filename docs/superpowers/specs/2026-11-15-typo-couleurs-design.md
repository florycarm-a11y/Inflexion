# Typographie et couleurs de la home — prompt 3 de l'audit Starlink

Date : 2026-11-15. Statut : réalisé le 2026-11-15 sur la branche `feat/typo-couleurs` (résultats mesurés dans le plan).

## 1. Objet

Harmoniser la typographie et les couleurs de `index.html` : des titres de section plus grands, plus aucune taille de texte sous 12 px, trois jetons de texte clair à la place de sept beiges codés en dur sur les fonds sombres, et cinq graisses de police chargées au lieu de dix.

Origine : audit Inflexion × Starlink du 13 novembre 2026, sections 5.1 à 5.4 et prompt 3 de la section 10. Deuxième chantier de l'étape 2, après Tailwind compilé (PR #143). Suivront les prompts 4 (animations) et 5 (en-tête et méga-menu).

Critère de fin : `index.html` conforme aux six points du prompt 3, liste des couples texte/fond qui échouent au contraste 4,5:1 fournie, `assets/site.css` reconstruit et commité, `npm test` au vert, aucune différence visuelle non prévue, PR ouverte après le « oui ».

## 2. Ce que le cadrage a établi

Mesures faites sur `main` (commit `a499c4ad`) avant toute modification.

### 2.1 Les sept beiges, occurrence par occurrence

Le prompt interdit le chercher-remplacer global (`CLAUDE.md` §3). Chaque occurrence a donc été qualifiée : élément, fond réel, rôle. **Toutes sont du texte (ou une encre) posé sur un fond sombre** : aucune n'est une donnée, une bordure ni un fond de surface.

| Hex | Ligne(s) | Élément | Fond réel | Rôle | Devient |
| --- | --- | --- | --- | --- | --- |
| `#F5EDE6` | 107 | lien d'évitement (`style` inline `color:`) | `--editorial-accent` | texte sur bouton | `--chrome-text-1` |
| | 225 (×2) | nav desktop, `hover:` et `focus-visible:` | `--chrome-ground` / `nav-scrolled` | texte interactif | `--chrome-text-1` |
| | 241, 268, 294 | CTA « Réserver un diagnostic » (×2), « Explorer les analyses » | `--editorial-accent` | texte sur bouton | `--chrome-text-1` |
| | 306 | badge « À la une » | `--editorial-accent` | texte sur badge | `--chrome-text-1` |
| | 307 | **point clignotant** du badge (`bg-[#F5EDE6]`) | `--editorial-accent` | **encre** du badge (glyphe, pas une surface) : même couleur que les lettres voisines, doit bouger avec elles | `--chrome-text-1` |
| | 427, 494 | bouton de filtre / onglet actif (`btnCls`, `tabCls`) | `--editorial-accent` | texte sur bouton | `--chrome-text-1` |
| | 464 | « Charger plus d'articles », `hover:` | `--editorial-accent` au survol | texte sur bouton | `--chrome-text-1` |
| | 560 | lien « politique de confidentialité », `hover:` | `--chrome-ground` | texte interactif | `--chrome-text-1` |
| `#F3E9DD` | 382 | valeur des chiffres du bandeau | `--credibility-band` | titre | `--chrome-text-1` |
| `#E8D9C8` | 295 | CTA secondaire « Notre méthodologie » | `--chrome-ground` | texte sur bouton détouré | `--chrome-text-1` |
| | 312 | titre de la manchette, `group-hover:` (blanc → beige) | `--chrome-ground` | titre | `--chrome-text-1` |
| | 600, 608, 616, 620 | en-têtes des colonnes du pied de page | `--chrome-ground` | libellé | `--chrome-text-1` |
| `#C6A996` | 225 | nav desktop, couleur de repos | `--chrome-ground` | texte interactif | `--chrome-text-2` |
| | 290 | paragraphe du hero | `--chrome-ground` | paragraphe | `--chrome-text-2` |
| | 313, 314 | résumé et ligne de métadonnées de la manchette | `--chrome-ground` | paragraphe / métadonnées | `--chrome-text-2` (le prompt associe ce hex au niveau 2, pas au 3) |
| | 597, 603, 611, 617, 623, 629 | paragraphe, liens et copyright du pied de page | `--chrome-ground` | paragraphe / liens | `--chrome-text-2` |
| `#D8B9AE` | 550 | paragraphe de la newsletter | `--chrome-ground` | paragraphe | `--chrome-text-2` |
| `#D6B896` | 383 | libellés des chiffres du bandeau | `--credibility-band` | légende | `--chrome-text-2` |
| `#A88A72` | 560 | mention de consentement | `--chrome-ground` | métadonnées | `--chrome-text-3` |
| | 630 | liste des sources du pied de page | `--chrome-ground` | métadonnées | `--chrome-text-3` |

Restent **volontairement inchangés** sur fond sombre : `text-white` (h1 du hero, titre de la manchette, h2 de la newsletter, badge de catégorie sur image), le kicker de la newsletter `#E8A996` (huitième beige de la section 5.3 de l'audit, mais **absent du prompt 3** : c'est un accent rosé, pas un neutre de texte ; à trancher au prompt 5 ou dans un chantier d'accents), `--editorial-accent-text` (#E05A4E), `--chrome-text` (#E8E4D8, trait du hamburger) et les `text-white/…` du menu mobile. Les occurrences de `#4C5052` à 11 px (lignes 350, 354, 458) sont sur fond clair : seule leur taille change.

### 2.2 Tailles sous 12 px

| Classe | Occurrences | Lignes | Fond |
| --- | --- | --- | --- |
| `text-[10px]` | 5 | 306, 308, 349, 451, 630 | badges (sombre et clair), sources du pied de page |
| `text-[11px]` | 6 | 258, 314, 350, 354, 383, 458 | libellés du menu mobile, métadonnées, légendes du bandeau |
| `.kicker{font-size:11px}` (`<style>`) | 1 règle, 6 usages | 34 | kickers « § … » |

Toutes passent à 12 px : les onze classes deviennent `text-xs`, la règle `.kicker` passe à `font-size:12px`. La section 5.2 de l'audit nomme explicitement les kickers parmi les textes à remonter ; le prompt ne parle que des classes parce qu'il ignore le `<style>` de la page. `text-xs` fixe aussi `line-height:1rem` (16 px) là où les valeurs arbitraires laissaient l'interligne hérité (~16,5 px) : les badges `py-0.5` grandissent d'un à trois pixels. Différence voulue.

### 2.3 Titres de section

Quatre `h2` de section portent `text-2xl md:text-3xl font-extrabold` (lignes 337, 433, 500 et 549, la newsletter). Le titre de la manchette (ligne 312, `text-xl lg:text-2xl`) est un titre de carte : il ne bouge pas.

**Piège d'interligne** : `text-3xl` fixe `line-height:2.25rem` (36 px). `md:text-[2.5rem]` ne change que la taille : à 40 px, l'interligne resterait 36 px et deux lignes se chevaucheraient. Deux titres passent sur deux lignes à certaines largeurs (« Recevez nos signaux faibles chaque semaine » dans `max-w-2xl` ; « Décryptages approfondis » à 768 px, à côté du lien « Voir toutes les analyses »). La syntaxe `text-[2.5rem/1.1]` ne compile pas en Tailwind 3.4 (testé : produit `color: 2.5rem/1.1`). On ajoute donc `md:leading-[1.1]`, l'interligne que la page fixe elle-même pour ses titres (`h1,h2,h3{line-height:1.1}`), soit 44 px. **Écart assumé avec la lettre du prompt**, qui n'anticipait pas ce piège.

### 2.4 Graisses

| Famille | Chargées aujourd'hui | Employées sur la page | Chargées après |
| --- | --- | --- | --- |
| Archivo | 400, 600, 700, 800 | 800 (`h1,h2,h3`, `font-extrabold`), **700** (`font-bold` sur le h3 des cartes de veille, ligne 456 : la classe `.font-bold` bat le sélecteur `h3`) | 800 |
| IBM Plex Sans | 400, 500, 600, 700 | 400 (corps), **500** (`font-medium` ×6), 600 (`font-semibold`) | 400, 600 |
| IBM Plex Mono | 400, 500 | 400, **500** (`font-medium` ×3), **600** (`.kicker`, `.mega-icon`, badges `font-semibold` : graisse **non chargée** aujourd'hui, imitée par le navigateur) | 400, 600 |

Les neuf `font-medium` et l'unique `font-bold` doivent être réglés sur une graisse chargée. Règle de répartition, par rôle :

- **texte courant, lecture, métadonnées → 400** (on retire la classe : 400 est la graisse héritée du `body`) ;
- **contrôles (boutons, onglets, filtres) et libellés capitales mono qui qualifient un contenu (légendes de chiffres) → 600** (`font-semibold`, comme les autres boutons et badges de la page) ;
- **titres Archivo → 800** (`font-extrabold`).

| Ligne | Élément | Police | Graisse | Décision |
| --- | --- | --- | --- | --- |
| 225 | libellés de la nav desktop | Sans 14 px | 500 | **400** (chrome discret, le CTA rouge garde la saillance) |
| 262 | entrées du menu mobile | Sans 20 px | 500 | **400** (lecture, grande taille) |
| 295 | CTA secondaire du hero | Sans 14 px | 500 | **600** (contrôle ; la hiérarchie avec le CTA primaire tient par aplat contre détour) |
| 383 | légendes du bandeau de chiffres | Mono capitales 12 px | 500 | **600** (libellé qualifiant, comme les badges) |
| 437, 438 | boutons de filtre de la veille | Sans 12 px | 500 | **600** (contrôles ; les onglets voisins sont déjà `font-semibold`) |
| 458 | nom de la source d'une carte | Mono 12 px | 500 | **400** (métadonnée) |
| 552 | message de confirmation newsletter | Sans 14 px | 500 | **400** (lecture) |
| 630 | liste des sources du pied de page | Mono capitales 12 px | 500 | **400** (métadonnée, niveau 3) |
| 456 | titre des cartes de veille (`h3`) | Archivo 15 px | 700 | **800** (`font-extrabold`) |
| 382 | valeur des chiffres du bandeau (`div`) | **IBM Plex Sans** 44 px, `font-extrabold` | 800 → rendu 700 avant (graisse la plus proche chargée), **600 après** | **Archivo 800** par la classe `display-text`, déjà définie par la page pour les textes d'affichage hors titre et inemployée. Écart relevé en relecture : un `div` échappe au sélecteur `h1,h2,h3`, et aucune famille autre qu'Archivo n'est chargée en 800. La couleur reste le jeton 1 (la classe Tailwind bat `.display-text`, `site.css` étant chargé en dernier). |

### 2.5 Jetons

`assets/design-tokens-v2.css` est chargé par les 32 pages ; aucun fichier du dépôt n'emploie encore `--chrome-text-1/2/3` (vérifié par grep sur `*.html`, `*.js`, `*.css`). Ajouter trois variables inemployées ne peut rien changer ailleurs. Le jeton historique `--chrome-text` (#E8E4D8, trait du hamburger) est distinct et reste.

### 2.6 Tailwind compilé

`text-[var(--chrome-text-1)]`, `bg-[var(--chrome-text-1)]` et leurs variantes `hover:`, `focus-visible:`, `group-hover:` compilent bien en couleur (testé sur Tailwind 3.4.19, comme les `text-[var(--editorial-accent)]` déjà présents). `md:text-[2.5rem]` et `md:leading-[1.1]` sont de nouvelles classes : `npm run build:css` obligatoire, sinon `test/site-css.test.mjs` échoue et la classe n'existe pas en ligne.

### 2.7 Contraste (WCAG 2.x, texte rgba composé sur son fond)

Couples **réellement présents** sur la page après le chantier :

| Texte | Fond | Composé | Ratio | Verdict |
| --- | --- | --- | --- | --- |
| `--chrome-text-1` | `--chrome-ground` #17100E | #F5EDE6 | 16,24:1 | OK |
| `--chrome-text-1` | `--credibility-band` #42301E | #F5EDE6 | 10,84:1 | OK |
| `--chrome-text-1` | `--editorial-accent` #8E2424 | #F5EDE6 | 7,47:1 | OK |
| `--chrome-text-1` | survol #6E1B1B | #F5EDE6 | 9,88:1 | OK |
| `--chrome-text-2` | `--chrome-ground` | #B2ABA5 | 8,29:1 | OK |
| `--chrome-text-2` | `--credibility-band` | #BFB4AA | 6,17:1 | OK |
| `--chrome-text-3` | `--chrome-ground` | #918A85 | 5,53:1 | OK |
| `--editorial-accent-text` #E05A4E (inchangé) | `--chrome-ground` | — | 5,14:1 | OK |
| kicker #E8A996 (inchangé) | `--chrome-ground` | — | 9,44:1 | OK |

**Aucun couple employé n'échoue.** Couples qui échoueraient si on les introduisait (à ne pas créer) : `--chrome-text-3` sur `--credibility-band` (4,45:1), `--chrome-text-2` sur `--editorial-accent` (4,42:1), `--chrome-text-3` sur `--editorial-accent` (3,29:1), `--editorial-accent-text` sur `--credibility-band` (3,43:1) ou sur `--editorial-accent` (2,36:1). Pour mémoire, l'ancien `#A88A72` échouait déjà sur `--editorial-accent` (2,69:1), mais n'y était pas employé.

## 3. Décisions

| Question | Décision | Pourquoi |
| --- | --- | --- |
| Jetons | `--chrome-text-1: #F5EDE6`, `--chrome-text-2: rgba(245,237,230,.70)`, `--chrome-text-3: rgba(245,237,230,.55)`, dans les **deux** régimes de `design-tokens-v2.css`. | Tel que demandé ; le chrome est une seule couche sur tout le site. |
| Forme des remplacements | Classes `text-[var(--chrome-text-N)]` dans le balisage React, `color:var(--chrome-text-1)` dans le `style` inline du lien d'évitement. | Même forme que les jetons déjà consommés (`text-[var(--editorial-accent)]`). |
| Point clignotant du badge | `bg-[var(--chrome-text-1)]`. | C'est l'encre du badge, pas une surface : laisser un hex figé à côté d'un texte en jeton créerait une dérive à la première retouche du jeton. Rendu identique au pixel. |
| `#E8A996` | Inchangé. | Hors du prompt 3 ; accent, pas neutre. Signalé dans la note de passation. |
| `h2` de section | `text-3xl md:text-[2.5rem] md:leading-[1.1] font-extrabold` sur les 4 titres de section. | §2.3 : sans `md:leading-[1.1]`, interligne de 36 px pour 40 px de corps. |
| Tailles | 11 classes → `text-xs` ; `.kicker` → 12 px. | §2.2. |
| Polices | `family=Archivo:wght@800&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;600&display=swap`, précédé de `<link rel="preconnect" href="https://fonts.googleapis.com">` et `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`. | Tel que demandé. `index.html` seulement : les 32 autres pages gardent leur lien (hors périmètre). |
| Graisses | Tableau §2.4. | Règle par rôle, revue possible ligne à ligne dans le diff. |
| `assets/site.css` | Reconstruit, commité. | Nouvelles classes. |
| Test de garde | Nouveau `test/home-typo.test.mjs` (3 tests). | Rendre permanents les six points : plus de taille sous 12 px ni de beige codé en dur dans `index.html` ; jetons présents dans les deux régimes ; lien Google Fonts aux cinq graisses, précédé des deux `preconnect`, aucune classe de graisse non chargée, et `font-extrabold` seulement sur `h1`/`h2`/`h3` ou avec `display-text` (seule Archivo est chargée en 800). |
| `CLAUDE.md` | Non modifié. | À 13 499 caractères pour 13 500. Sa §3 reste exacte (« Archivo 800, IBM Plex Sans, IBM Plex Mono », jetons dans `design-tokens-v2.css`). |

## 4. Fichiers touchés

```
assets/design-tokens-v2.css    + 3 jetons × 2 régimes
index.html                     <head> : 2 preconnect + lien Google Fonts ; <style> : .kicker 12px ;
                               balisage : 33 remplacements de couleur, 11 tailles, 4 h2, 10 graisses
assets/site.css                reconstruit
test/home-typo.test.mjs        nouveau
docs/superpowers/specs/…       cette spec
docs/superpowers/plans/…       le plan, avec résultats mesurés
```

Rien d'autre : ni `styles.css`, ni les 32 autres pages, ni `nav-config.js`.

## 5. Vérification

1. `npm run build:css` puis `npm test` (75 + 3 tests).
2. Comparaison visuelle avant/après de `index.html` à 1440 et 390 px (outils du dossier de notes partagé, base « avant » faite sur `main` avant toute modification), plus `analyses.html` et `expertise.html` pour prouver que les jetons n'altèrent rien ailleurs (attendu : identiques, aux contenus dynamiques près). Chaque zone différente de la home est qualifiée : titres, badges, nuances, graisses ; toute différence hors de cette liste est une régression.
3. Dans le navigateur : les cinq fichiers de police demandés (onglet réseau), aucune requête de graisse 500 ou 700, `.kicker` rendu en IBM Plex Mono 600 réel, aucune erreur console nouvelle.
