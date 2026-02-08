# Inflexion — Guide Consultant

> Reproduire ce projet en 30 minutes avec un Mac et Claude.
> Applicable à tout secteur : finance, immobilier, santé, juridique, RH, logistique.

---

## 1. Ce que fait Inflexion

Un **tableau de bord de veille sectorielle** — zéro backend, zéro base de données, déployable en 5 minutes sur GitHub Pages (gratuit).

| Ce que vous voyez | Ce que c'est techniquement |
|---|---|
| Articles avec sources vérifiées | Données JSON dans `app.js` |
| Cours en temps réel | Widgets TradingView (embed gratuit) |
| Ticker d'actualités | Animation CSS pure |
| Tableau matières premières/ETF | HTML généré par JS, triable |
| Newsletter | localStorage (démo) |
| SEO complet | Schema.org JSON-LD + meta OG/Twitter |

---

## 2. Sources de données actuelles

### Données éditoriales (manuelles)
Les articles sont **codés en dur** dans `app.js` :
```
const newsDatabase = {
    geopolitics: [ { source: 'Bloomberg', title: '...', description: '...', url: '...' } ],
    markets: [ ... ],
    crypto: [ ... ],
    commodities: [ ... ],
    etf: [ ... ]
};
```

**Sources citées** : Bloomberg, CNBC, Reuters, FMI, Atlantic Council, CFR, J.P. Morgan, Goldman Sachs, CoinDesk, CoinShares, HBR, BCG, Financial Times, Rabobank, Tax Foundation, WEF.

### Données temps réel (widgets)
- **TradingView** : widgets embed gratuits pour cours, graphiques, heatmaps
  - Utilisés sur `markets.html`, `crypto.html`
  - Aucune API key nécessaire
  - Limité aux données TradingView affiche (pas d'export)

### Données de présentation
- **Chart.js** : graphique comparatif or/BTC sur `index.html`
  - Données codées en dur dans l'HTML

---

## 3. Comment étendre la base de données

### Option A : APIs gratuites (sans clé ou clé gratuite)

| API | Données | Limite gratuite | Intégration |
|-----|---------|-----------------|-------------|
| **Alpha Vantage** | Actions, forex, crypto | 25 requêtes/jour | `fetch('https://www.alphavantage.co/query?...')` |
| **CoinGecko** | Crypto (prix, volumes, MCap) | 30 requêtes/min | `fetch('https://api.coingecko.com/api/v3/...')` |
| **NewsAPI** | Actualités multi-sources | 100 requêtes/jour | `fetch('https://newsapi.org/v2/everything?...')` |
| **Exchange Rates API** | Taux de change | Illimité | `fetch('https://open.er-api.com/v6/latest/USD')` |
| **FRED (Fed Reserve)** | Données macro US | Illimité | `fetch('https://api.stlouisfed.org/fred/...')` |
| **World Bank API** | PIB, inflation, emploi | Illimité | `fetch('https://api.worldbank.org/v2/...')` |

### Option B : RSS Feeds (actualités en temps réel, zéro API)

```javascript
// Utiliser un proxy CORS gratuit pour parser les RSS
async function fetchRSS(url) {
    const resp = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(url));
    const data = await resp.json();
    return data.items; // [{title, link, description, pubDate}]
}

// Sources RSS gratuites :
// - Bloomberg: https://feeds.bloomberg.com/markets/news.rss
// - Reuters: https://www.reutersagency.com/feed/
// - CNBC: https://www.cnbc.com/id/100003114/device/rss/rss.html
// - CoinDesk: https://www.coindesk.com/arc/outboundfeeds/rss/
```

### Option C : Claude comme rédacteur (le plus puissant)

Demander à Claude de générer les données `newsDatabase` à partir de sources web :

```
Prompt: "Recherche les 10 dernières actualités géopolitiques majeures impactant
les marchés financiers. Pour chacune, donne-moi : source, URL, titre en français,
description (2 phrases), tags, date. Formate en JSON compatible avec ce format :
{ source: '...', url: '...', title: '...', description: '...', tags: [...], time: '...' }"
```

**Workflow optimal :**
1. Chaque lundi, demander à Claude de mettre à jour `app.js`
2. Claude recherche le web, rédige les synthèses, formate en JSON
3. Commit + push → le site est à jour

---

## 4. Architecture technique

```
Inflexion/
├── index.html              ← Page d'accueil (hero + news + chart + newsletter)
├── geopolitics.html        ← Catégorie : articles géopolitiques
├── markets.html            ← Catégorie : marchés + widget TradingView
├── crypto.html             ← Catégorie : crypto + widget TradingView
├── commodities.html        ← Catégorie : matières premières + tableau triable
├── etf.html                ← Catégorie : ETF + tableau triable
├── analysis.html           ← Articles longs (analyses approfondies)
├── mentions-legales.html   ← Mentions légales
├── confidentialite.html    ← RGPD / confidentialité
├── cgu.html                ← Conditions d'utilisation
├── styles.css              ← Tout le design (2250+ lignes)
├── app.js                  ← Toute la logique + données (460+ lignes)
├── api-client.js           ← Client API (fallback local si pas de backend)
├── logos/                  ← Variantes du logo SVG
├── logo-header.svg         ← Logo header (icône + texte)
├── favicon.svg             ← Favicon
├── manifest.json           ← PWA manifest
├── sitemap.xml             ← Sitemap SEO
├── robots.txt              ← Instructions crawlers
└── backend/                ← Serveur Node.js optionnel
    ├── server.js
    └── package.json
```

---

## 5. Reproduire ce projet pour un AUTRE secteur

### Exemple : Veille immobilière

1. **Dupliquer le repo** :
   ```bash
   git clone https://github.com/florycarm-a11y/Inflexion.git MonProjet
   cd MonProjet && rm -rf .git && git init
   ```

2. **Adapter les catégories** dans `app.js` :
   ```javascript
   const newsDatabase = {
       residential: [ /* actualités résidentiel */ ],
       commercial:  [ /* actualités commercial */ ],
       reits:       [ /* actualités REITs/SCPI */ ],
       rates:       [ /* actualités taux/crédit */ ],
       regulations: [ /* actualités réglementaires */ ]
   };
   ```

3. **Adapter les pages HTML** :
   - `geopolitics.html` → `residential.html`
   - `markets.html` → `commercial.html`
   - etc.

4. **Changer les couleurs** dans `styles.css` :
   ```css
   :root {
       --accent: #2563EB;  /* Bleu immobilier */
       --navy: #1E293B;
   }
   ```

5. **Déployer** :
   ```bash
   git add -A && git commit -m "Init" && git push -u origin main
   ```
   Activer GitHub Pages dans Settings → Pages → main → Save.

### Autres exemples sectoriels

| Secteur | Catégories | Widgets possibles |
|---------|-----------|-------------------|
| **Santé** | Pharma, Biotech, Régulation, Essais cliniques, Devices | TradingView (pharma stocks) |
| **Juridique** | Droit fiscal, Social, Immobilier, Numérique, UE | Pas de widget — articles seuls |
| **RH** | Recrutement, Formation, Tendances, IA & emploi, Légal | Chart.js (stats emploi) |
| **Logistique** | Maritime, Aérien, Ferroviaire, Supply Chain, Douanes | MarineTraffic widgets |
| **Énergie** | Pétrole, Gaz, Renouvelables, Nucléaire, Réglementation | TradingView (commodities) |

---

## 6. Compatibilité navigateurs

### Testé et compatible

| Plateforme | Navigateurs | Status |
|-----------|------------|--------|
| **Mac** | Safari 17+, Chrome 120+, Firefox 120+ | OK |
| **Windows** | Chrome, Edge, Firefox | OK |
| **iPhone** | Safari iOS 17+, Chrome iOS | OK |
| **Android** | Chrome, Samsung Internet, Firefox | OK |

### Fonctionnalités responsive

- **Desktop (>1024px)** : Layout 2 colonnes, sidebar visible, ticker complet
- **Tablet (768-1024px)** : Layout 1 colonne, sidebar sous le contenu
- **Mobile (<768px)** : Menu hamburger, recherche inline, cards empilées
- **Mobile petit (<480px)** : Espacement réduit, police adaptée

### Accessibilité (WCAG 2.1 AA)

- Skip-to-content link (navigation clavier)
- Focus visible sur tous les éléments interactifs
- `aria-expanded`, `aria-controls`, `aria-live`
- `prefers-reduced-motion` respecté (animations désactivées)
- Contrastes couleur conformes (accent rouge sur blanc = 5.9:1)
- `noscript` fallback si JavaScript désactivé
- Labels `sr-only` pour lecteurs d'écran
- Print stylesheet inclus

---

## 7. Workflow consultant : Mac + Claude

### Mise à jour hebdomadaire (15 min)

```
1. Ouvrir Claude Code dans le terminal
2. Dire : "Mets à jour les articles de Inflexion avec les dernières
   actualités de la semaine. Recherche Bloomberg, CNBC, Reuters."
3. Claude met à jour app.js, commit, push
4. Le site est à jour en 2 minutes
```

### Ajout d'une nouvelle rubrique (30 min)

```
1. Dire : "Ajoute une rubrique 'Régulation' avec 5 articles récents
   sur les nouvelles réglementations financières. Crée la page HTML,
   ajoute-la à la navigation et au sitemap."
2. Claude crée le fichier, modifie la nav, ajoute le schema SEO
3. Commit + push
```

### Personnalisation design (10 min)

```
1. Dire : "Change les couleurs en bleu marine + or. Remplace le logo
   par 'MonCabinet' et adapte le tagline."
2. Claude modifie styles.css + les SVG + les meta tags
3. Commit + push
```

---

## 8. Plugins et connecteurs disponibles

### Déjà intégrés
- **TradingView** — widgets cours temps réel (gratuit, sans clé)
- **Chart.js** — graphiques interactifs (CDN)
- **Google Fonts** — typographie professionnelle
- **Schema.org** — données structurées SEO
- **Open Graph / Twitter Cards** — partage social optimisé
- **PWA Manifest** — installable comme app

### Ajout possible en 5 minutes
- **Google Analytics 4** — ajouter le snippet dans le `<head>`
- **Plausible** — analytics respectueux RGPD (script inline)
- **Disqus / Giscus** — commentaires sous les articles
- **RSS auto** — générer un feed RSS depuis les données JS
- **Mailchimp / Buttondown** — newsletter réelle (remplacer localStorage)
- **Algolia DocSearch** — recherche avancée (gratuit open-source)

---

## 9. Coût total

| Élément | Coût |
|---------|------|
| Hébergement GitHub Pages | **Gratuit** |
| Domaine personnalisé (.com) | ~12€/an (optionnel) |
| TradingView widgets | **Gratuit** |
| Google Fonts | **Gratuit** |
| Chart.js | **Gratuit** |
| Claude (mise à jour contenu) | Abonnement Claude Pro |
| **Total** | **0€ — 12€/an** |

---

*Dernière mise à jour : 8 février 2026*
