# Refonte structurelle des pages d'analyse — « dossier à deux temps »

**Date** : 2026-07-25
**Périmètre** : les 11 articles `analyse-*.html` React + `analysis-template.html`
**Hors périmètre** : les couleurs, le catalogue `analyses.html`, les 3 articles legacy

---

## 1. Pourquoi

Les articles font **2 300 à 3 000 mots** (15 à 22 min de lecture), portent 5 à 8 sections, 4 à 6 encadrés, 1 à 3 tableaux et jusqu'à 46 sources. C'est du format « rapport », servi dans une mise en page d'article de blog. Six frictions structurelles en découlent :

1. Aucune navigation interne sur 20 minutes de lecture — ni sommaire, ni ancres, ni repère de progression.
2. **L'évaluation SEMPLICE est enterrée à ~85 % de la page**, alors que c'est le différenciateur de la marque.
3. La sidebar de 220 px porte trois vignettes puis reste vide sur 80 % de la hauteur.
4. Les chiffres clés sont présentés en tête puis jamais rappelés.
5. Les trois scénarios sont empilés verticalement : impossible de les comparer.
6. Une seule densité de lecture — rien pour qui dispose de deux minutes plutôt que vingt.

**Rôle assigné à la page** (arbitré avec l'utilisateur) : *vitrine de crédibilité* d'abord, *note de recherche* ensuite. La page doit **démontrer** la rigueur en la faisant lire — pas l'afficher sous forme de widgets. Cela exclut le tableau de bord, les filtres et tout dispositif de consultation.

## 2. Ce qui est décidé

| Sujet | Décision |
|---|---|
| Direction | « Dossier à deux temps » : page de garde condensée, puis corps long |
| Gouttière | Colonne de marge permanente, réservée aux **sources**, en regard du passage concerné |
| Mentions de sources | **Sorties du texte** et déplacées dans la marge |
| Mise en œuvre | Squelette partagé, **précédé d'une page pilote** |
| Couleurs | Aucune modification — l'identité v2 chaude reste telle quelle |

## 3. Anatomie cible

### 3.1 Temps 1 — la page de garde

Tient dans un écran, avant tout défilement. De haut en bas :

- **Kicker** (catégorie · zone), **titre**, **chapô**, ligne de méta enrichie : `auteur · date · durée · N sources`.
- **Verdict SEMPLICE** : composite risque en grand, mention du palier et de la tendance, composite opportunité en second. À droite, les **trois dimensions dominantes** en barres proportionnelles. Les huit dimensions renvoient au tableau complet de l'appareil.
- **Trois scénarios comparables** : blocs horizontaux dont **la largeur porte la probabilité**. C'est le point qui règle la friction 5.
- **« Ce qu'il faut retenir »** : bloc à filet, qui **absorbe l'actuelle synthèse exécutive**.
- **Chiffres clés** : les quatre valeurs existantes, en ligne, sous un filet.
- Amorce de défilement.

### 3.2 Temps 2 — le corps

Trois colonnes :

- **Rail de progression** (~26 px, gauche) : numéros de section en chiffres romains, la section courante en évidence. Ancres cliquables. Règle la friction 1.
- **Colonne de lecture** (~680 px) : titres, paragraphes, encadrés — inchangés dans leur nature.
- **Gouttière** (~200 px, droite) : les sources du passage en regard, et le rappel de la dimension SEMPLICE dont traite la section.

### 3.3 Temps 3 — l'appareil

Après le corps, dans l'ordre : tableau SEMPLICE complet (8 dimensions + composite), scénarios développés, matrice d'impact sectoriel, indicateurs d'alerte, bibliographie complète, avertissement AMF, **puis le CTA diagnostic**, puis les articles liés.

## 4. Les six décisions structurelles

1. **La synthèse exécutive est absorbée** par le bloc « ce qu'il faut retenir ». Elle ne subsiste pas en double.
2. **Les scénarios apparaissent à deux densités** : comparables en garde, développés dans l'appareil. Volontaire.
3. **Le tableau SEMPLICE complet reste dans l'appareil.** La garde n'expose que le composite et les trois dimensions dominantes.
4. **Les articles liés quittent la lecture** et descendent en fin de page. La gouttière est rendue aux sources.
5. **Le CTA diagnostic se place en sortie de lecture**, après l'appareil critique — au moment où la démonstration vient d'être faite.
6. **Sur mobile** (< 900 px) : la gouttière se replie en notes de fin de section, le rail de progression disparaît, les scénarios passent en pile en conservant l'étiquette de probabilité.

## 5. Architecture technique

### 5.1 Problème actuel

Chaque article embarque sa propre copie de `Navigation`, `ArticleHero`, `ArticleContent` et `Footer`. La migration d'identité v2 a démontré le coût : un oubli devait être rattrapé onze fois, et l'a été (badges de hero codés en dur).

### 5.2 Cible

Un module ES partagé, `assets/article-shell.js`, exportant :

| Export | Rôle |
|---|---|
| `Navigation()` | Chrome de navigation (identique à l'actuel) |
| `Cover(article)` | Page de garde — section 3.1 |
| `Body(article, children)` | Rail + colonne de lecture + gouttière |
| `Section({num, title, dimension}, ...children)` | Une section du corps ; alimente le rail et la gouttière |
| `P({sources, note}, ...children)` | Un paragraphe ; ses sources vont dans la marge |
| `Apparatus(article)` | Tableau SEMPLICE, scénarios développés, matrice d'impact, indicateurs d'alerte, bibliographie, AMF |
| `Footer()` | Pied de page (identique à l'actuel) |
| `renderArticle(article, body)` | Assemble le tout et monte dans `#app` |

Chaque `analyse-*.html` se réduit alors à : un objet `ARTICLE` (métadonnées, verdict, scénarios, chiffres, bibliographie), le corps rédactionnel en appels `Section`/`P`, et un appel à `renderArticle`.

### 5.3 Modèle de données

```js
const ARTICLE = {
  categorie: 'GÉOPOLITIQUE',
  zone: 'Europe de l\'Est & Mer Noire',
  titre: '…', chapo: '…',
  auteur: 'Inflexion Research', date: '15 mars 2026', duree: '22 min',
  semplice: {
    risque: 5.6, palier: 'Très élevé', tendance: '↑', opportunite: 3.2,
    dimensions: [ {cle:'M', nom:'Militaire', risque:6.6, opp:1, tendance:'↑'}, … ],
  },
  scenarios: [ {titre:'Négociation sous pression', proba:28, texte:'…'}, … ],
  chiffres: [ {valeur:'1 000+', libelle:'jours de guerre'}, … ],
  retenir: '…',
  matrice: [ {secteur:'Défense', niveau:'CRITIQUE', reco:'…'}, … ],
  alertes: [ {signal:'Réduction aide US > 50 %', lecture:'basculement stratégique'}, … ],
  bibliographie: [ {nom:'ISW', url:'…', note:'…'}, … ],
  amf: '…',
  articlesLies: [ {titre:'…', href:'…', img:'…', cat:'Géopolitique'}, … ],
}
```

Les articles ne portent pas tous les mêmes blocs : `matrice` et `alertes` sont facultatifs et `Apparatus()` omet la section correspondante quand la clé est absente. Les onze articles n'ont pas non plus le même nombre de scénarios ni de dimensions renseignées — le squelette ne présume d'aucun cardinal.

**Contrainte absolue** : les valeurs SEMPLICE restent des données. Leur rendu conserve l'emerald `#006650` et les paliers existants, conformément à la règle de séparation identité/donnée du `CLAUDE.md`.

### 5.4 Extraction des sources

Les mentions sont déjà en clair dans le texte : `(source : ISW, RUSI)`, `(source : Mandiant, Google TAG)`. Un script de conversion les extrait vers la prop `sources` de `P()` et les retire du corps du texte. La transformation est mécanique et vérifiable : le nombre de sources extraites doit égaler le nombre de mentions supprimées, article par article.

## 6. Séquence de mise en œuvre

1. **Pilote** — `analyse-ukraine-mer-noire-guerre-attrition.html` refondu de bout en bout, avec `article-shell.js` écrit au fil de l'eau. Validation visuelle.
2. **Mutualisation** — extraction définitive du squelette, le pilote devient le premier consommateur.
3. **Conversion** — les 10 autres articles, un par un, avec le script d'extraction des sources.
4. **Gabarit** — `analysis-template.html` réécrit sur le squelette, pour que les futurs articles naissent conformes.

## 7. Vérification

Aucun test front n'existe sur ce dépôt (pas de bloc `scripts` dans `package.json`, `ci.yml` ne couvre que `backend/`). La vérification est donc :

- **Syntaxe** : `node --check` sur le module ES extrait de chaque page.
- **Conservation du contenu** : pour chaque article, comparer le texte rendu avant/après refonte — aucun paragraphe, chiffre ou source ne doit disparaître. Contrôle automatisable par extraction du texte.
- **Données SEMPLICE** : contrôle par `getComputedStyle` que les scores, paliers et échelles conservent leurs couleurs d'origine.
- **Visuel** : capture desktop de chaque page. Le rendu mobile est vérifié par styles calculés — `resize_window` est inopérant dans cet environnement (cf. mémoire projet).

## 8. Hors périmètre

- Les couleurs et l'identité v2 — aucune modification.
- Le catalogue `analyses.html` et les 3 articles legacy.
- La direction « fil annoté » complète (annotation au paragraphe des dimensions SEMPLICE) : l'ossature retenue ne la ferme pas, elle reste possible ultérieurement.
