# Prompt pour Kimi — propager la refonte aux 9 articles restants

> Copier-coller le bloc ci-dessous tel quel.

---

Tu travailles sur le dépôt **Inflexion**, une plateforme d'intelligence financière et géopolitique dont le site est en HTML/React servi en statique.

**Répertoire** : `/Users/floryanleblanc/Developer/GitHub/Inflexion-delta-computationnel-v2`
**Branche** : `feat/analyses-redesign` (déjà créée, travaille dessus, ne change pas de branche)

Réponds en français.

## Ce qui a déjà été fait

Les pages d'analyse du site viennent d'être refondues selon un modèle appelé **« dossier à deux temps »**. Trois fichiers de référence sont déjà convertis et validés :

- `analyse-ukraine-mer-noire-guerre-attrition.html` — **le modèle de référence, lis-le en entier avant tout**
- `analyse-turquie-erdogan-equilibriste.html` — deuxième exemple abouti
- `analysis-template.html` — le gabarit, avec un commentaire d'en-tête qui documente le format

Un squelette React partagé a été extrait :

- `assets/article-shell.js` — composants `Navigation`, `Cover`, `Section`, `SousTitre`, `P`, `Body`, `Apparatus`, `Footer`, `renderArticle`
- `assets/article-model.js` — logique pure : `parseProbability`, `topDimensions`, `scenarioWidths`
- Tests : `npm test` (30 tests, doivent rester à 0 échec)

**Lis ces fichiers avant de commencer.** Tout ce dont tu as besoin y est.

## Ta mission

Convertir les **9 articles restants** sur le même modèle, un par un :

1. `analyse-corridor-defense-france-inde.html` (17 mentions de sources)
2. `analyse-cuba-crise-perspectives.html` (14)
3. `analyse-fta-ue-inde-traite-fiscal.html` (12)
4. `analyse-madagascar-fragilite-ressources.html` (8)
5. `analyse-mer-chine-taiwan-indopacifique.html` (18)
6. `analyse-petrole-trump-iran-ormuz.html` (17)
7. `analyse-sahel-mali-niger-burkina-crise.html` (13)
8. `analyse-arctique-groenland-grand-jeu-polaire.html` (20) — **cas particulier, voir plus bas**
9. `analyse-cloud-ia-pme-europeennes.html` (1) — **cas particulier, voir plus bas**

Fais les 7 premiers d'abord. Les deux derniers demandent un traitement manuel.

## Le format cible

Chaque article converti se réduit à :

```js
import { h, Section, SousTitre, P, renderArticle } from './assets/article-shell.js'
import { parseProbability } from './assets/article-model.js'

const ARTICLE = {
  categorie, zone, titre, chapo, auteur, date, duree,
  semplice: { risque, palier, tendance, opportunite,
              dimensions: [{cle, nom, risque, opp, tendance}, …] },   // 8 dimensions
  scenarios: [{titre, fourchette, texte, impact}, …],
  chiffres: [{valeur, libelle}, …],
  retenir, lectureScore,
  matrice: [{secteur, niveau, reco}, …],        // niveau ∈ CRITIQUE | ÉLEVÉ | MODÉRÉ | OPPORTUNITÉ
  alertes: [{signal, lecture}, …],
  bibliographie: [{nom, url, note}, …],
  sourcesMeta, sourcesNote, amf,
  articlesLies: [{titre, href, img, cat, catLabel}, …],
}

const SECTIONS = [
  Section({rang:1, romain:null, titre:'…'},
    SousTitre(null, '…'),
    P({sources:['ISW','RUSI']}, 'texte…', h('strong', null, 'gras'), '…'),
    P(null, 'un paragraphe sans source'),
  ),
  …
]

renderArticle(ARTICLE, SECTIONS)
```

## CONTRAINTES ABSOLUES

**1. Aucun contenu éditorial ne doit disparaître.** C'est la contrainte principale. Tu restructures, tu ne réécris jamais. Pas un paragraphe, pas un chiffre, pas une source.

**2. Aucune couleur ne doit être modifiée.** Le site a une identité visuelle stricte. Certaines couleurs encodent de la **donnée** et ne doivent jamais être migrées vers la palette de marque :
- `#006650` — scores SEMPLICE (risque)
- `#5A6178` — scores d'opportunité
- `#DC2626`, `#f59e0b` — paliers de la matrice d'impact
- `#006650` / `#EAB308` / `#DC2626` et leurs fonds `#F0FAF5` / `#FFFBEB` / `#FEF2F2` — échelle de gravité des scénarios

Ces couleurs vivent maintenant dans `assets/article-shell.js` : tu n'as normalement **aucune couleur à écrire**. Si tu en écris une, c'est probablement une erreur.

**3. Ne touche PAS à `assets/`.** Le squelette sert les 11 articles. Si tu penses qu'un composant doit changer, **arrête-toi et signale-le** au lieu de le modifier — une modification pour un cas particulier casserait les dix autres.

**4. Un article à la fois**, vérifié et commité avant de passer au suivant.

## Points de vigilance, appris sur les trois premiers

**La numérotation.** Les titres portent déjà leur numéro romain (« I. Situation militaire », « II. Économie de guerre »). Le composant `Section` ajoute le sien. Passe donc le romain **réel** dans `romain:` et retire-le du `titre`. Les sections qui n'étaient pas numérotées à l'origine (« Thèse centrale », « Évaluation SEMPLICE », « Trois scénarios ») reçoivent `romain:null`.

**Ne renumérote jamais.** Si tu numérotes selon le rang dans le tableau, la partie III devient la IV et toute citation existante de l'article devient fausse.

**Les sources.** Chaque mention `(source : X, Y)` sort du texte et alimente la prop `sources` du paragraphe. Après conversion, `grep -c '(source' <fichier>` doit valoir **0**.

**Ce qui quitte le corps.** Les sections « Évaluation SEMPLICE » et « Trois scénarios », la matrice d'impact, les indicateurs d'alerte, la bibliographie et l'avertissement AMF ne sont plus des sections : ils alimentent `ARTICLE` et sont rendus par `Apparatus`. Ils **disparaissent de `SECTIONS`**.

**Relève toutes les valeurs dans le fichier**, jamais de mémoire. Les scores, probabilités, chiffres et sources doivent être ceux de l'article que tu convertis.

**Les probabilités** passent par `parseProbability(s.fourchette)`, jamais écrites en dur — les fourchettes du type `'25-30 %'` sont converties en leur milieu arrondi.

## Les deux cas particuliers

**`analyse-arctique-groenland-grand-jeu-polaire.html`** — ses 20 mentions de sources ne sont pas du texte mais des **liens React** :

```js
'(source : ',h('a',{href:'https://…',className:'…'},'CNBC'),', ',h('a',{…},'NPR'),')'
```

Aucune extraction automatique n'est possible ici : une regex qui tente de les traiter détruit le code React. Convertis ces 20 mentions **à la main**, en conservant les liens. Si le squelette ne permet pas de rendre des sources cliquables dans la gouttière, **signale-le au lieu de modifier `assets/`**.

**`analyse-cloud-ia-pme-europeennes.html`** — deux particularités :
- il contient l'unique mention du corpus écrite **sans deux-points** : `(source CISA/NIAC)`. À traiter à la main : `sources: ['CISA', 'NIAC']`.
- il porte des composants CSS propres (`.pillar-card`, `.matrix-table`, `.data-row`, `.section-number`) que les autres articles n'ont pas. **Conserve-les tels quels** dans la page ; ils ne passent pas dans le squelette.

## Contrôle de conservation — méthode imposée

Un agent précédent s'est enlisé en cherchant une méthode de contrôle parfaite. **N'improvise pas d'alternative**, applique celle-ci.

Avant conversion :

```bash
python3 - <<'PY' > /tmp/mots-avant.txt
import io,re
from collections import Counter
s=io.open('<FICHIER>',encoding='utf-8').read()
m=re.search(r'<script type="module">(.*?)</script>',s,re.S).group(1)
for mot,n in sorted(Counter(re.findall(r"[A-Za-zÀ-ÿ'’-]{5,}", m)).items()): print(f"{n:4d} {mot}")
PY
```

Après conversion, rejoue vers `/tmp/mots-apres.txt`, puis `diff /tmp/mots-avant.txt /tmp/mots-apres.txt`.

Écarts **acceptables** : mots de code disparus (`ArticleContent`, `className`, `createRoot`…), mots de code apparus (`renderArticle`, `Section`, `SousTitre`, `romain`, `fourchette`…), et `source` dont le compte baisse du nombre de mentions retirées.

Écart **inacceptable** : un mot du vocabulaire éditorial qui disparaît — nom propre, chiffre, terme d'analyse. Cela signifie que tu as perdu du contenu : répare.

Ne passe pas plus de deux itérations sur ce contrôle. S'il reste des écarts inexpliqués, liste-les dans ton rapport plutôt que de continuer à chercher.

## Vérifications, pour chaque article

```bash
# syntaxe du module ES
python3 -c "
import io,re
s=io.open('<FICHIER>',encoding='utf-8').read()
io.open('/tmp/chk.mjs','w',encoding='utf-8').write(re.search(r'<script type=\"module\">(.*?)</script>',s,re.S).group(1))"
node --check /tmp/chk.mjs

grep -c '(source' <FICHIER>              # doit valoir 0
grep -o 'sources:\[' <FICHIER> | wc -l   # doit égaler le nombre de mentions d'origine
grep -c 'renderArticle(' <FICHIER>       # doit valoir 1

npm test                                  # 30 tests, 0 échec

# aucune couleur ajoutée
comm -13 <(git show HEAD:<FICHIER> | grep -oiE '#[0-9a-f]{6}' | tr 'A-F' 'a-f' | sort -u) \
         <(grep -oiE '#[0-9a-f]{6}' <FICHIER> | tr 'A-F' 'a-f' | sort -u)
# doit ne rien afficher
```

Un serveur local tourne sur le port 4399 (sinon : `python3 -m http.server 4399`). Vérifie que la page répond 200.

**Tu ne peux pas exécuter le JavaScript en ligne de commande** : le rendu visuel devra être contrôlé dans un navigateur, page par page. Signale-le dans ton rapport.

## Commits

Un commit par article, message en français, sur le modèle :

```
refactor(analyses): convertir <nom> sur le squelette

N sections, M gouttières sourcées, numérotation d'origine préservée.
Contrôle de conservation : aucun contenu perdu.
```

**Ne pousse pas** sans accord explicite de l'utilisateur.

## Ton rapport final

Pour chaque article : nombre de sections, de paragraphes, de sources rattachées, résultat des vérifications, et tout écart constaté.

Puis, globalement : ce qui a divergé des modèles, ce dont tu n'es pas sûr, et ce qui reste à vérifier visuellement. **Ne tais aucun doute** — un rapport qui cache une approximation coûte plus cher que l'approximation elle-même.

---

## Notes pour toi, Floryan (hors prompt)

- Kimi devra lire trois fichiers de référence avant de commencer. C'est volontaire : c'est ce qui rend le prompt court et le résultat fidèle.
- Les deux cas particuliers (`arctique`, `cloud-ia`) sont ceux qui ont le plus de chances de mal se passer. Garde-les pour la fin et relis-les toi-même.
- Le contrôle qui compte vraiment, c'est le rendu dans le navigateur : les tests ne couvrent que la logique pure, pas l'affichage.
