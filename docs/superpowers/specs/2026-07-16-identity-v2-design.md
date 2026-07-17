# Inflexion — Identité visuelle v2

> Date : 16 juillet 2026
> Statut : direction artistique validée, pilote à valider
> Référence visuelle : [Delta — palette v2](https://claude.ai/code/artifact/c4219514-c155-4407-a98f-6262e198ff62)

## 1. Décision

La composition retenue est la **composition 02 hybride** :

- le chrome de marque — navigation, utilitaires, grands marqueurs éditoriaux — est sombre et strictement achromatique ;
- les surfaces qui portent une mesure restent claires, proches du papier ;
- la couleur est d'abord réservée à l'information et ne sert pas à décorer le chrome ;
- la frontière entre marque et donnée doit rester visible dans la structure de la page.

Cette direction remplace à terme le système emerald/bronze. Elle ne l'écrase pas tant que le pilote `country.html` n'a pas été validé.

## 2. Deux régimes, un même système

### 2.1 Pages avec instrument

Exemples : Radar Pays, radar SEMPLICE, Delta computationnel, graphiques de marché.

- Chrome `#0E1012`.
- Texte du chrome `#E8E4D8`.
- Surface de page `#EDEBE4`.
- Modules de mesure `#FFFFFF`.
- Rouge, vert, sable et couleurs de séries sont réservés aux données.
- `#E05A4E` est interdit dans le chrome lorsqu'un arbre Delta est rendu.

### 2.2 Pages éditoriales sans instrument

Exemples : accueil, analyses, articles, services et pages légales sans visualisation sémantique.

- Le noir monolithique reste la base de marque.
- Les accents `#8E2424` et `#E05A4E` peuvent être utilisés si leur rôle est nommé.
- L'olive `#505538` et le mocca `#594A3C` sont disponibles pour les contenus éditoriaux.
- Le brun rouge `#663B30` n'est permis que si la page ne rend aucun arbre Delta.

Une page qui mélange contenu éditorial et instrument utilise le régime instrument pour son chrome. Les accents éditoriaux restent confinés aux blocs sans ambiguïté avec les données.

## 3. Jetons de fondation

### 3.1 Chrome et surfaces

| Jeton | Valeur | Rôle |
|---|---:|---|
| `--chrome-ground` | `#0E1012` | navigation et chrome sombre |
| `--chrome-text` | `#E8E4D8` | texte principal sur le chrome |
| `--chrome-dim` | `#9AA0A4` | métadonnées sur le chrome |
| `--surface-page` | `#EDEBE4` | papier de fond |
| `--surface-raised` | `#FFFFFF` | modules et cartes |
| `--surface-incomplete` | `#DFDCD0` | donnée incomplète, teinte faible |
| `--rule-incomplete` | `#9B957A` | filet de renfort, jamais preuve unique |
| `--text-primary` | `#101214` | texte principal sur surface claire |
| `--text-secondary` | `#4C5052` | métadonnées et texte secondaire |
| `--border-hairline` | `#4C5052` | filets porteurs de structure |

En production, ces jetons sont déclarés sous `[data-design-regime="instrument"]`, pas dans `:root`. Ils ne doivent pas écraser les variables historiques de `styles.css` sur les pages qui restent en v1.

### 3.2 Couleurs sémantiques Delta

| Jeton | Valeur | Rôle exclusif |
|---|---:|---|
| `--horizon-1` | `#FF2D00` | horizon jusqu'à 6 mois |
| `--horizon-2` | `#C42300` | horizon jusqu'à 18 mois |
| `--horizon-3` | `#8A1800` | horizon jusqu'à 36 mois |
| `--horizon-4` | `#521000` | horizon supérieur à 36 mois |
| `--series-observed` | `#3E5C3A` | archives et trajectoires observées |

Les quatre rouges restent sur fond clair : `#8A1800` et `#521000` tombent respectivement à environ 2,14:1 et 1,39:1 sur le noir de la DA, sous le seuil graphique de 3:1.

### 3.3 Échelles SEMPLICE existantes

Les valeurs des échelles risque/opportunité ne changent pas pendant leur extraction. Les deux implémentations actuelles sont différentes et conservent donc deux contrats nommés.

Ces jetons sémantiques aux noms uniques peuvent vivre dans `:root` afin de rester accessibles à `country.html` et `expertise.html`. Seuls les jetons de fondation de l'identité v2 restent limités à `[data-design-regime="instrument"]` pendant la migration.

**Radar Pays — `semplice-country.js`**

```css
--country-risk-1: #006650; /* score < 2 */
--country-risk-2: #33B894; /* score >= 2 */
--country-risk-3: #F59E0B; /* score >= 3 */
--country-risk-4: #EA580C; /* score >= 4 */
--country-risk-5: #DC2626; /* score >= 5 */
--country-risk-6: #991B1B; /* score >= 6 */

--country-opportunity-na: #D1D5DB; /* score < 3 */
--country-opportunity-3: #A7F3D0; /* score >= 3 */
--country-opportunity-4: #33B894; /* score >= 4 */
--country-opportunity-5: #006650; /* score >= 5 */
```

**Radar de méthodologie — `semplice-radar.js`**

```css
--radar-risk-low: #006650; /* score < 2,5 */
--radar-risk-mid: #C8955A; /* score >= 2,5 */
--radar-risk-high: #F59E0B; /* score >= 4 */
--radar-risk-critical: #DC2626; /* score >= 5,5 */

--radar-opportunity-low: #DC2626; /* score < 2 */
--radar-opportunity-mid: #C8955A; /* score >= 2 */
--radar-opportunity-positive: #33B894; /* score >= 3,5 */
--radar-opportunity-high: #006650; /* score >= 5 */
```

Le fait que certaines valeurs soient identiques aux anciennes couleurs de marque est acceptable après séparation des rôles. Une évolution future de l'identité ne devra plus pouvoir modifier une échelle analytique.

Les couleurs de séries propres aux zones restent des données et ne deviennent jamais des jetons de marque.

Les teintes claires `#33B894`, `#F59E0B`, `#A7F3D0` et `#D1D5DB` sont sous 3:1 sur blanc. Elles peuvent rester comme remplissages uniquement si un contour conforme, une position sur l'échelle et un libellé direct portent aussi l'information.

## 4. Typographie

- **Titres et wordmark** : Archivo, graisse 800.
- **Corps** : IBM Plex Sans, graisse 400.
- **Données, statuts et libellés** : IBM Plex Mono, graisse 400.
- Les titres peuvent être en capitales, avec une approche serrée.
- Les métadonnées utilisent une approche large et une taille réduite ; elles ne remplacent pas une hiérarchie de titres accessible.

Les fichiers de police présents dans `delta-v2/assets/fonts/` ne peuvent pas être publiés plus largement tant que les licences OFL et l'identité exacte de chaque fichier ne sont pas versionnées.

## 5. Grammaire de mise en page

- Grille visible et filets fins plutôt que cartes flottantes.
- Angles droits par défaut ; les rayons sont réservés aux contrôles qui en ont besoin.
- Ombres rares et courtes, uniquement pour un état de survol ou une superposition.
- Le chrome peut être dense ; l'instrument conserve de l'air et une lecture tabulaire.
- Les grands titres sont asymétriques mais le contenu analytique reste aligné sur une grille stable.
- Les numéros de section (`01 / CARTE`, `02 / ZONES`) aident à naviguer, sans être la seule structure sémantique.

## 6. État « données incomplètes »

Un état visuel n'est appliqué que si sa valeur varie entre les objets affichés.

- Ne pas marquer les onze scénarios actuels : les mêmes champs leur manquent à tous.
- Marquer la carte de zone lorsque des blocs attendus manquent réellement à cette zone.
- Traitement retenu : fond `--surface-incomplete`, filet `--rule-incomplete` et ligne textuelle explicite.
- Exemple : `DONNÉES INCOMPLÈTES · AMPLIFICATION DE PIC, RÉSILIENCE ET OPPORTUNITÉ NON SÉRIALISÉES`.
- La couleur seule ne porte jamais l'information.

## 7. Interactions

- Les états actifs de l'interface utilisent le noir/blanc, pas une couleur sémantique de donnée.
- Le rouge et le vert ne doivent pas signifier simultanément « actif », « succès », « risque » ou « opportunité ».
- Focus clavier visible, contraste minimal 3:1 pour le contour.
- Cibles tactiles de 44 px lorsque possible.
- Respect de `prefers-reduced-motion` dans le CSS et dans le JavaScript : durée Leaflet nulle et défilement automatique lorsque la réduction de mouvement est demandée.
- Les graphiques conservent une légende textuelle ; aucune distinction ne repose uniquement sur la couleur.

## 8. Source de vérité transitoire

Pendant le pilote :

- cette spec est la source de vérité de la DA v2 ;
- `prototypes/identity-v2/country.html`, son CSS et son shim GeoJSON sont une prévisualisation isolée ;
- le dossier `prototypes/` reste hors du périmètre copié par le workflow GitHub Pages ;
- `index.html` reste la source de vérité de la production actuelle ;
- `DESIGN-MIGRATION-PROMPT.md` reste applicable à la production actuelle, mais doit être marqué obsolète au moment de la bascule globale.

Après validation du pilote, les jetons partagés versionnés deviendront la source de vérité. Aucun fichier HTML ne devra embarquer sa propre variante de palette.

## 9. Invariants de migration

1. Aucun remplacement global d'un littéral hex.
2. L'extraction des couleurs sémantiques doit être visuellement neutre.
3. Le pilote ne modifie ni les scores, ni les seuils, ni les calculs SEMPLICE.
4. Une divergence entre les échelles de `semplice-country.js` et `semplice-radar.js` est documentée avant d'être harmonisée ; elle n'est pas corrigée silencieusement pendant la migration graphique.
5. `delta-v2/assets/styles.css` et la constante `COLORS` de `delta-v2/assets/tree.js` évoluent ensemble.
6. Le logo, les favicons, le manifeste et l'image Open Graph ne basculent qu'après validation de leurs variantes claires et sombres.
7. Toute page garde le disclaimer AMF et les attributions de source.

## 10. Critères de validation du pilote

- Le chrome et l'instrument sont perçus comme deux couches cohérentes.
- Les échelles risque/opportunité restent immédiatement lisibles et inchangées.
- La page fonctionne à 360, 768, 1280 et 1440 px.
- Carte, bascules, fiches, scatter, timeline, tableau triable et macro-données restent utilisables.
- Aucun ancien vert ou bronze n'apparaît comme couleur de marque dans le chrome du pilote.
- Le prototype est clairement identifié comme non publié et reste exclu de l'artefact GitHub Pages.
