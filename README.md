# Inflexion - Géopolitique & Marchés Financiers

Plateforme d'intelligence financière combinant analyses géopolitiques et données de marché en temps réel pour des décisions d'investissement éclairées.

## Aperçu

Inflexion est une application web qui agrège et présente les actualités géopolitiques mondiales et leur impact sur les marchés financiers, incluant:

- **Bitcoin & Cryptomonnaies** - Suivi en temps réel des principales cryptos
- **Matières Premières** - Or, pétrole, gaz, métaux industriels
- **ETF & Fonds** - Analyse des flux et performances
- **Indices Boursiers** - S&P 500, CAC 40, NASDAQ, etc.

## Fonctionnalités

### Données en Temps Réel
- Widgets TradingView intégrés pour les cotations live
- Mise à jour automatique des prix toutes les 10 secondes
- Ticker d'actualités en continu (breaking news)
- Indicateurs d'impact sur les marchés

### Sources Médias (25+)

**Internationaux:**
- Reuters, Bloomberg, Financial Times, BBC News
- Al Jazeera, CNBC, Wall Street Journal, New York Times
- The Guardian, The Economist

**Francophones:**
- Le Monde, Les Échos, Le Figaro, France 24
- RFI, La Tribune, BFM Business, Capital

**Crypto & Finance:**
- CoinDesk, Cointelegraph, The Block, Decrypt
- MarketWatch, Morningstar, ETF.com, Seeking Alpha

### Catégories d'Actualités

1. **Géopolitique** - Tensions internationales, sanctions, diplomatie
2. **Marchés** - Analyses boursières, politique monétaire
3. **Crypto** - Bitcoin, Ethereum, DeFi, régulations
4. **Matières Premières** - Énergie, métaux, agriculture
5. **ETF** - Fonds indiciels, flux de capitaux
6. **Analyses** - Perspectives et études approfondies

## Technologies

- **HTML5** - Structure sémantique
- **CSS3** - Design responsive, animations fluides, thème sombre
- **JavaScript Vanilla** - Aucune dépendance externe
- **TradingView Widgets** - Graphiques et cotations en temps réel
- **Google Fonts (Inter)** - Typographie moderne

## Installation

### Option 1: Ouvrir directement
```bash
# Cloner le repo
git clone https://github.com/votre-repo/geofinance.git
cd geofinance

# Ouvrir index.html dans un navigateur
open index.html       # macOS
xdg-open index.html   # Linux
start index.html      # Windows
```

### Option 2: Serveur local
```bash
# Avec Python 3
python -m http.server 8000

# Avec Node.js
npx serve .

# Avec PHP
php -S localhost:8000
```

Puis accéder à `http://localhost:8000`

## Structure du Projet

```
geofinance/
├── index.html      # Page principale avec widgets TradingView
├── styles.css      # Styles, animations et design responsive
├── app.js          # Logique JavaScript et base de données news
└── README.md       # Documentation
```

## Caractéristiques Techniques

### Performance
- Chargement asynchrone des widgets TradingView
- Animations CSS optimisées (transform, opacity)
- Pas de frameworks JavaScript lourds
- Temps de chargement minimal

### Design
- Thème sombre professionnel
- Glassmorphisme et effets de blur
- Dégradés et ombres subtiles
- Indicateurs visuels d'impact (high/medium/low)

### Accessibilité
- Navigation au clavier complète
- Contrastes WCAG conformes
- Labels ARIA pour les lecteurs d'écran
- Focus visible sur tous les éléments interactifs

### Responsive Design
- Mobile-first approach
- Breakpoints: 480px, 768px, 1024px
- Menu hamburger sur mobile
- Grilles adaptatives

## Personnalisation

### Modifier les couleurs
Éditez les variables CSS dans `styles.css`:
```css
:root {
    --primary-color: #3b82f6;
    --success-color: #10b981;
    --danger-color: #ef4444;
    --warning-color: #f59e0b;
    --dark-bg: #0a0f1a;
    /* ... */
}
```

### Ajouter des sources
Ajoutez des entrées dans `newsDatabase` dans `app.js`:
```javascript
{
    source: 'NouvelleSource',
    sourceUrl: 'https://example.com',
    title: 'Titre de l\'article',
    description: 'Description...',
    tags: ['geopolitics', 'markets'],
    time: '1h',
    impact: 'high'  // high, medium, low
}
```

### Modifier les styles de sources
Personnalisez l'apparence des logos dans `sourceStyles`:
```javascript
const sourceStyles = {
    'NouvelleSource': { color: '#ff0000', initial: 'NS' }
};
```

## Déploiement

### GitHub Pages
1. Push vers votre repo GitHub
2. Settings > Pages > Source: main branch
3. Accès via `https://username.github.io/repo-name`

### Netlify / Vercel
1. Connectez votre repo
2. Déploiement automatique à chaque commit
3. SSL gratuit inclus

### Hébergement traditionnel
Uploadez les 3 fichiers (index.html, styles.css, app.js) sur votre serveur.

## Évolutions Futures

### Propositions v2.0
- [ ] Intégration d'APIs réelles (CoinGecko, Alpha Vantage, NewsAPI)
- [ ] Backend pour agrégation de news en temps réel
- [ ] Système de favoris et alertes utilisateur
- [ ] Notifications push pour événements majeurs
- [ ] Mode clair/sombre avec toggle
- [ ] Recherche et filtres avancés
- [ ] Export de données (CSV, PDF)
- [ ] Application mobile (PWA)
- [ ] Analyses IA des corrélations géopolitique/marchés

## Avertissement

**Les informations présentées sur ce site sont fournies à titre informatif uniquement et ne constituent en aucun cas des conseils en investissement.** Les performances passées ne garantissent pas les performances futures. Tout investissement comporte des risques de perte en capital. Pour des décisions d'investissement, consultez des professionnels qualifiés.

## Licence

MIT License - Libre d'utilisation et de modification.

## Contributions

Les contributions sont les bienvenues! N'hésitez pas à:
- Signaler des bugs
- Proposer des améliorations
- Ajouter de nouvelles sources médias
- Améliorer les traductions

---

Développé pour les investisseurs et analystes francophones souhaitant suivre l'impact de la géopolitique sur les marchés financiers.
