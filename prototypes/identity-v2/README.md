# Prototypes identité v2

Prévisualisations isolées de la composition 02 hybride : chrome sombre achromatique, surface papier claire et couleurs réservées aux données.

## Ouvrir le prototype

Depuis la racine du dépôt :

```bash
python3 -m http.server 4173
```

Puis ouvrir :

```text
http://127.0.0.1:4173/prototypes/identity-v2/country.html
http://127.0.0.1:4173/prototypes/identity-v2/expertise.html
```

Le dossier `prototypes/` n'est pas copié par le workflow GitHub Pages actuel. Les prototypes ne modifient ni `country.html` ni `expertise.html`.

## Fichiers

- `country.html` : shell et structure complète du Radar Pays.
- `country-v2.css` : jetons, typographie et mise en page du prototype.
- `country-v2-runtime.js` : contournement local du premier polygone Mexique mal imbriqué dans le GeoJSON actuel.
- `expertise.html` : démonstrateur éditorial autonome du cadre SEMPLICE.
- `expertise-v2.css` : mise en page des dimensions, du radar, de la méthode et des évaluations.
- `expertise-v2-runtime.js` : accessibilité des contrôles générés et tableau dérivé de `SEMPLICE_ZONES`.

## Dépendances

Les prototypes réutilisent les scripts, données et polices de la branche courante. Après resynchronisation avec `main`, ajouter `semplice-composite.js` avant `semplice-zones-config.js` si cette dépendance est toujours requise.

Le filtre statique `Information > 3` reflète la nomenclature de la branche courante. Après rebase sur SEMPLICE v3, l'option doit suivre `SEMPLICE_DIM_LABELS` (`Intelligence artificielle`) avant toute intégration en production.

Les polices de `delta-v2/assets/fonts/` restent réservées au prototype tant que leurs licences OFL et leur identité exacte ne sont pas versionnées.

La correction de production du GeoJSON est documentée séparément dans le plan. Une fois cette correction appliquée, supprimer le shim du prototype.
