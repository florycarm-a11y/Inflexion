# Inflexion

Lire les preuves, pas le récit.

Inflexion est un tracker d'inflexions. Il suit des sociétés portées par un récit — petits réacteurs, quantique, spatial, robotique — et lit uniquement leurs publications de résultats. À chaque trimestre, quatre dimensions reçoivent un sens. Leur somme est le solde. Le solde déclenche quatre alertes.

**En ligne** : [inflexionhub.com](https://inflexionhub.com/)

Le pivot date du 21 novembre 2026 ([#160](https://github.com/florycarm-a11y/Inflexion/pull/160)) : la page d'accueil est le tracker. La navigation est Tracker, Méthode, Expertise, Services.

## Ce que le tracker mesure

Quatre dimensions, lues dans les documents de la société (8-K, 10-Q, 10-K). Ni cours de Bourse, ni presse, ni note d'analyste.

| Dimension | Ce qu'elle lit |
|---|---|
| D1 Revenus de la thèse | La croissance du segment qui porte le récit |
| D2 Demande engagée | Commandes, carnet, clients, ou barreau d'engagement |
| D3 Prévision | Relevée, maintenue, abaissée, manquée |
| D4 Rentabilité | La marge opérationnelle GAAP, sur un an |

Chaque sens vaut hausse, stable, baisse, ou « non publié ». Le « non publié » ne compte pas dans le solde, et il s'affiche avec un mot. Une valeur sans source ne s'affiche pas. Le solde, les alertes, le score et la phase sont calculés, jamais saisis dans les fichiers.

| Alerte | Ce qu'elle dit |
|---|---|
| Bascule | Les preuves s'améliorent : solde à +2 ou plus, hors régime déjà ouvert, marge brute positive |
| Bascule commerciale | Pré-revenus seulement : premier barreau d'engagement haut, marge brute positive. Une seule par société |
| Signal faible | La demande ou la prévision passe en hausse, alors que le solde reste sous +2 |
| Rechute | Les preuves se dégradent : solde à −2 ou moins |

Une alerte décrit des publications passées. Elle ne dit pas que le récit aboutira. Sur les dix cas hors échantillon, la Bascule est apparue chez les cinq succès boursiers et chez trois des cinq échecs. La Rechute est le signal le plus fiable du backtest : elle passe en premier sur la page d'accueil.

La source de vérité du calcul est [`docs/tracker-methode.md`](docs/tracker-methode.md), **v1.3 figée le 21 novembre 2026**. Le pseudo-code de la section 6 l'emporte sur toute autre phrase. La page publique est [`methode.html`](methode.html).

## Ce que le site montre

- **Accueil** (`index.html`) — le manifeste, la liste des sociétés, les alertes (Rechutes puis Bascules), la bande du backtest.
- **Fiche** (`entreprise.html?id=`) — une société, ses publications, ses sens sourcés.
- **Méthode** (`methode.html`) — les règles en clair, et le bilan du backtest, échecs compris.
- **Lecture de marché** (`marche.html`) — une couche à côté du tracker : short interest, attentes, valorisation, croisés avec la dernière alerte. Elle lit le tracker et n'écrit jamais dans `data/tracker/`. Les objectifs d'analystes viennent d'un accès Nasdaq non documenté ; les conditions du site en limitent la capture automatisée. FINRA et la SEC, elles, sont publiques.
- **Archives** — les analyses déjà publiées, sous Tracker dans le menu. Elles ne portent plus le site.

Le catalogue public est `data/tracker/entreprises.json` : Centrus Energy, Rocket Lab, IonQ, Vertiv, SentinelOne, Oklo, Agility Robotics. Sept sociétés, lues sur EDGAR. Agility entre sans publication : sa première en propre n'est pas encore déposée.

SEMPLICE reste le cadre géopolitique du site, sous Expertise (`expertise.html`, radar pays sur `country.html`). Les pages de veille (géopolitique, marchés, crypto, matières premières, ETF, briefing) sont sorties du menu. Elles restent accessibles par leur adresse. La production automatique de briefings, d'articles et de newsletters est arrêtée ([#159](https://github.com/florycarm-a11y/Inflexion/pull/159)).

## Où c'est dans le dépôt

| Rôle | Fichier |
|---|---|
| Règles du calcul | `docs/tracker-methode.md` |
| Schéma des fichiers | `data/tracker/README.md` |
| Vocabulaire et validation | `tracker-modele.js` |
| Rendu de la fiche | `tracker-vue.js` |
| Catalogue et fiches | `data/tracker/` |
| Moteur d'alertes | `tracker-modele.js`, vérifié sur les suites de la section 13 |
| Lecture de marché | `marche.html`, `data/marche/`, `scripts/marche/` |
| Univers du rejeu spatial | `docs/tracker-univers-spatial.md` |
| Décisions qui engagent | `docs/carnet-de-bord.md` |
| Carte technique | `CLAUDE.md` |

Le rejeu spatial fixe dix-huit sociétés avant toute lecture (composition du fonds UFO au 31 janvier 2024). Il sert à mesurer la précision de la Bascule sur un univers que personne n'a choisi. Il ne se mélange pas au catalogue public.

## Lancer en local

```bash
git clone https://github.com/florycarm-a11y/Inflexion.git
cd Inflexion
python3 -m http.server 4399
```

Ouvrir `http://localhost:4399`. Les JSON déjà dans `data/tracker/` suffisent.

```bash
npm test            # tests du tracker, de la home et des pages
npm run build:css   # src/input.css → assets/site.css
```

## Par où entrer

1. [`docs/tracker-methode.md`](docs/tracker-methode.md) — la méthode, section 1 puis section 6.
2. [`index.html`](index.html) — la vitrine.
3. [`data/tracker/README.md`](data/tracker/README.md) — ce qu'un fichier de société a le droit de contenir.
4. [`docs/carnet-de-bord.md`](docs/carnet-de-bord.md) — les décisions à ne pas rejouer.

## Avertissement

Les informations du site sont fournies à titre informatif. Une alerte n'est pas un conseil en investissement, ni une prévision. Tout investissement comporte un risque de perte en capital.

## Licence

MIT
