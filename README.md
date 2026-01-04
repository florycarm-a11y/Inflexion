# 🌍 Géopolitique & Marchés

Plateforme d'analyse en temps réel des événements géopolitiques et de leur impact sur les marchés financiers mondiaux.

## 📋 Vue d'ensemble

Ce site web agrège et présente les actualités internationales en mettant l'accent sur :
- **Géopolitique** : Événements mondiaux et tensions internationales
- **Marchés Financiers** : Impact sur les bourses et indices
- **Cryptomonnaies** : Bitcoin, Ethereum, et altcoins
- **Matières Premières** : Or, pétrole, métaux, agriculture
- **ETF** : Fonds indiciels et investissements

## ✨ Fonctionnalités

### 📊 Données de Marché en Temps Réel
- Bitcoin (BTC/USD)
- Or (XAU/USD)
- Pétrole Brent (BRN/USD)
- S&P 500 (SPX)
- Mises à jour automatiques toutes les 10 secondes

### 📰 Sources d'Information
Le site agrège des actualités de sources reconnues :
- **International** : Reuters, Bloomberg, Financial Times, BBC News, Al Jazeera, CNBC, MarketWatch
- **France** : Le Monde, Les Échos
- **Crypto** : CoinDesk, Cointelegraph, The Block
- **Investissement** : Morningstar, ETF.com

### 🎨 Interface Moderne
- Design sombre professionnel
- Responsive (mobile, tablette, desktop)
- Animations fluides
- Navigation intuitive

## 🚀 Installation et Utilisation

### Prérequis
Aucun prérequis ! Il s'agit d'un site web statique HTML/CSS/JavaScript.

### Lancement Local
1. Clonez le repository :
```bash
git clone <repository-url>
cd Claude
```

2. Ouvrez `index.html` dans votre navigateur :
```bash
# Sur macOS
open index.html

# Sur Linux
xdg-open index.html

# Ou utilisez un serveur local simple
python3 -m http.server 8000
# Puis ouvrez http://localhost:8000
```

## 📁 Structure du Projet

```
Claude/
├── index.html      # Structure HTML principale
├── styles.css      # Styles et design responsive
├── app.js          # Logique JavaScript et gestion des données
└── README.md       # Documentation
```

## 🔧 Architecture Technique

### Technologies Utilisées
- **HTML5** : Structure sémantique
- **CSS3** : Styles modernes avec variables CSS, Grid, Flexbox
- **JavaScript Vanilla** : Aucune dépendance externe
- **Google Fonts** : Police Inter pour une typographie moderne

### Fonctionnalités JavaScript
- Simulation de données de marché en temps réel
- Agrégation d'actualités par catégorie
- Navigation fluide avec scroll automatique
- Observer API pour détecter les sections actives
- Rafraîchissement périodique des données

## 📱 Responsive Design

Le site s'adapte à tous les écrans :
- **Desktop** : Grilles multi-colonnes, navigation complète
- **Tablette** : Adaptation des grilles, navigation optimisée
- **Mobile** : Colonne unique, navigation simplifiée

## 🎯 Catégories d'Actualités

### 🌍 Géopolitique
Événements internationaux affectant les marchés : tensions régionales, sommets économiques, accords commerciaux, OPEC+, etc.

### 💹 Marchés
Analyses des bourses mondiales : Wall Street, CAC 40, indices asiatiques, secteurs, volatilité.

### ₿ Crypto
Actualités Bitcoin, Ethereum, DeFi, ETF crypto, régulations, altcoins.

### 🛢️ Matières Premières
Or, argent, pétrole, gaz naturel, métaux industriels, agriculture.

### 📈 ETF
Fonds indiciels : Bitcoin ETF, Gold ETF, ESG, technologie, obligataire.

## 🔄 Mises à Jour

### Données de Marché
- Simulation en temps réel avec variations aléatoires
- Mise à jour toutes les 10 secondes
- Affichage des variations en pourcentage
- Code couleur : vert (hausse), rouge (baisse)

### Actualités
- Rafraîchissement toutes les 60 secondes
- Animation d'apparition progressive
- Horodatage relatif (2h, 4h, etc.)
- Tags par catégorie

## 🎨 Personnalisation

### Couleurs (dans styles.css)
Les couleurs sont définies dans les variables CSS :
```css
:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    --danger-color: #ef4444;
    --warning-color: #f59e0b;
    /* ... */
}
```

### Contenu (dans app.js)
Les actualités sont stockées dans l'objet `newsDatabase`. Vous pouvez ajouter/modifier :
```javascript
const newsDatabase = {
    geopolitics: [ /* vos actualités */ ],
    markets: [ /* vos actualités */ ],
    // ...
};
```

## 🚀 Déploiement

### GitHub Pages
1. Push vers GitHub
2. Settings → Pages
3. Source : main branch
4. Le site sera disponible à `https://username.github.io/Claude`

### Netlify / Vercel
1. Connectez votre repository
2. Déploiement automatique à chaque commit

### Serveur Web
Copiez tous les fichiers dans votre répertoire web (`/var/www/html`, etc.)

## 📊 Évolutions Futures

### Version 1.1 (Propositions)
- [ ] Intégration d'APIs réelles (CoinGecko, Alpha Vantage)
- [ ] Backend pour proxy API et éviter CORS
- [ ] Système de favoris utilisateur
- [ ] Notifications push pour événements majeurs
- [ ] Graphiques interactifs (Chart.js)
- [ ] Recherche et filtres avancés
- [ ] Mode clair/sombre toggle
- [ ] Export de données (CSV, PDF)

### Version 2.0 (Vision)
- [ ] Authentification utilisateur
- [ ] Portefeuille virtuel
- [ ] Alertes personnalisées
- [ ] Analyses IA des corrélations géopolitique/marchés
- [ ] Application mobile (React Native)
- [ ] API publique

## ⚠️ Avertissement

**Les informations présentées sont à titre informatif uniquement et ne constituent pas des conseils en investissement.**

Ce site est un projet de démonstration. Les données de marché sont simulées. Pour des décisions d'investissement, consultez des sources officielles et des professionnels qualifiés.

## 📝 Licence

Ce projet est un exemple éducatif. Utilisez-le librement pour apprendre et vous inspirer.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter de nouvelles sources d'actualités
- Améliorer le design

## 📧 Contact

Pour toute question ou suggestion, ouvrez une issue sur GitHub.

---

**Développé avec ❤️ pour suivre l'actualité géopolitique et financière**