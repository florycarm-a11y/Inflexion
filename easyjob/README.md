# 🎓 EasyJob - Job Service TBS Education

Site web professionnel du job service de TBS Education, connectant étudiants et entreprises pour des opportunités d'emploi.

## 📋 À Propos

EasyJob est le job service officiel de **TBS Education** qui facilite la mise en relation entre :
- **Entreprises** : Recherche de talents pour petits boulots, CDD, stages et CDI
- **Étudiants TBS** : Accès à des opportunités professionnelles adaptées à leur profil

**Note importante** : EasyJob n'est PAS une Junior Entreprise. C'est un service dédié exclusivement au recrutement et à la mise en relation employeurs-étudiants.

## ✨ Fonctionnalités

### Pour les Entreprises
- ✅ Dépôt d'offres simplifié via formulaire
- ✅ Accès à un vivier de talents qualifiés de TBS
- ✅ Process de recrutement accompagné
- ✅ Tous types de contrats acceptés

### Pour les Étudiants
- ✅ Catalogue d'offres exclusives TBS
- ✅ Filtres par type de contrat
- ✅ Accompagnement CV et candidature
- ✅ Horaires compatibles avec les études

### Fonctionnalités Techniques
- 📊 Statistiques en temps réel (500+ étudiants, 120+ entreprises)
- 🎨 Interface moderne et responsive
- 📱 Mobile-first design
- ⚡ Navigation fluide avec smooth scroll
- 🔍 Système de filtrage des offres
- 📝 Formulaire de dépôt d'offres validé

## 🚀 Utilisation

### Lancement Local

```bash
# Cloner le projet
cd easyjob

# Option 1 : Ouvrir directement dans le navigateur
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows

# Option 2 : Serveur local simple
python3 -m http.server 8000
# Puis ouvrir http://localhost:8000
```

### Structure du Projet

```
easyjob/
├── index.html       # Structure HTML complète
├── styles.css       # Design responsive et animations
├── app.js           # Interactions et logique métier
└── README.md        # Cette documentation
```

## 🎨 Design & Branding

### Palette de Couleurs (TBS Inspired)

```css
Primaire:    #6366f1 (Bleu indigo)
Secondaire:  #f97316 (Orange TBS)
Accent:      #8b5cf6 (Violet)
Succès:      #10b981 (Vert)
Danger:      #ef4444 (Rouge)
```

### Typographie
- **Police** : Inter (Google Fonts)
- **Hiérarchie** : 8 tailles (XS à 5XL)
- **Poids** : 300-800 pour flexibilité

### Responsive Breakpoints
- **Desktop** : > 1024px
- **Tablet** : 768px - 1024px
- **Mobile** : < 768px

## 🏗️ Architecture Technique

### Technologies
- **HTML5** : Structure sémantique
- **CSS3** : Variables CSS, Grid, Flexbox, Animations
- **JavaScript Vanilla** : Aucune dépendance externe
- **Google Fonts** : Inter font family

### Sections du Site

1. **Hero** - Proposition de valeur + CTA dual (Je recrute / Je cherche)
2. **Entreprises** - Avantages du recrutement TBS + CTA partenariat
3. **Étudiants** - Catégories d'offres + témoignage
4. **Offres** - Grille filtrable avec 9 offres exemples
5. **Partenaires** - Logos entreprises (Airbus, Decathlon, etc.)
6. **Contact** - Coordonnées + formulaire de dépôt d'offre

### Fonctionnalités JavaScript

```javascript
// Navigation active avec Intersection Observer
initNavigation()

// Animation des statistiques au scroll
initStatsAnimation()

// Affichage et filtrage des offres
displayJobs(jobsDatabase)
filterJobs('stage')

// Validation formulaire
handleFormSubmit(event)
```

## 📊 Base de Données des Offres

Les offres sont actuellement stockées dans `app.js` sous forme de tableau :

```javascript
const jobsDatabase = [
    {
        id: 1,
        company: "Airbus",
        title: "Stage Ingénieur Aéronautique",
        type: "stage",
        description: "...",
        location: "Toulouse",
        posted: "Il y a 2h",
        badge: "stage"
    },
    // ... 9 offres au total
]
```

**Types d'offres** : `stage`, `cdd`, `cdi`, `petit-boulot`

## 🔧 Personnalisation

### Ajouter une Offre

Éditez `app.js` et ajoutez dans `jobsDatabase` :

```javascript
{
    id: 10,
    company: "Votre Entreprise",
    title: "Intitulé du poste",
    type: "stage|cdd|cdi|petit-boulot",
    description: "Description complète...",
    location: "Ville",
    posted: "Il y a Xh",
    badge: "type"
}
```

### Modifier les Couleurs

Éditez les variables CSS dans `styles.css` :

```css
:root {
    --primary-color: #6366f1;  /* Votre couleur */
    --secondary-color: #f97316; /* Votre couleur */
}
```

### Changer les Statistiques

Éditez les `data-target` dans `index.html` :

```html
<div class="stat-number" data-target="500">0</div>
```

## 📱 Responsive Design

Le site s'adapte automatiquement à tous les écrans :

- **Desktop** : Grilles multi-colonnes, navigation horizontale
- **Tablet** : Adaptation des grilles 2 colonnes
- **Mobile** : Navigation hamburger, colonnes uniques

## 🎯 Objectifs & Vision

### Court Terme (Version 1.0) ✅
- [x] Site vitrine professionnel
- [x] Formulaire de dépôt d'offres
- [x] Catalogue d'offres filtrable
- [x] Design responsive

### Moyen Terme (Version 2.0)
- [ ] Backend API (Node.js/Express)
- [ ] Base de données (MongoDB/PostgreSQL)
- [ ] Authentification entreprises/étudiants
- [ ] Système de candidature en ligne
- [ ] Dashboard entreprises
- [ ] Notifications email

### Long Terme (Version 3.0)
- [ ] Matching intelligent IA
- [ ] Application mobile (React Native)
- [ ] Intégration calendrier événements
- [ ] Analytics avancés
- [ ] Export CV automatique

## 🚢 Déploiement

### GitHub Pages

```bash
# Le site est prêt pour GitHub Pages
# Settings → Pages → Source: main branch → /easyjob
```

### Netlify

```bash
# Base directory: easyjob
# Build command: (aucune)
# Publish directory: .
```

### Serveur Web Classique

```bash
# Copier tous les fichiers dans votre répertoire web
cp -r easyjob/* /var/www/html/easyjob/
```

## 👥 Équipe de Développement

- **Responsable Communication** : [Votre nom]
- **Design & Développement** : Claude AI Assistant
- **École** : TBS Education, Toulouse

## 📧 Contact

**EasyJob - TBS Education**
- 📍 20 Boulevard Lascrosses, 31000 Toulouse
- 📧 contact@easyjob-tbs.fr
- 📞 05 61 29 49 49
- 🔗 LinkedIn : [À créer]
- 📸 Instagram : [À créer]

## 📝 Licence

Ce projet est développé pour TBS Education. Tous droits réservés.

## 🤝 Contribution

Pour toute amélioration ou suggestion :
1. Contactez l'équipe EasyJob
2. Proposez vos modifications
3. Testez sur tous les appareils

## ⚠️ Notes Importantes

- Les données actuelles (offres, statistiques) sont des **exemples**
- Le formulaire n'envoie pas réellement d'emails (simulation)
- En production, vous devrez :
  - Implémenter un backend
  - Configurer un service d'envoi d'emails
  - Sécuriser les formulaires (CSRF, validation)
  - Ajouter un RGPD compliance
  - Héberger sur un domaine sécurisé (HTTPS)

## 🎓 Ressources

- [Documentation TBS Education](https://www.tbs-education.fr)
- [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [JavaScript ES6+](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

**Développé avec ❤️ pour les étudiants et entreprises de TBS Education**
