# ✨ EasyJob - Job Service TBS Education

**Design System "Connexions"** — Minimaliste • Épuré • Premium

Site web du job service de TBS Education, connectant étudiants et entreprises avec une interface radicalement épurée et professionnelle.

---

## 📋 À Propos

EasyJob est le job service officiel de **TBS Education** qui facilite la mise en relation entre :
- **Entreprises** : Recherche de talents pour petits boulots, CDD, stages et CDI
- **Étudiants TBS** : Accès à des opportunités professionnelles exclusives

**Philosophie Design** : Moins c'est plus. Interface minimaliste où chaque élément a sa raison d'être. Rose TBS utilisé avec parcimonie pour un impact maximal.

---

## 🎨 Design System "Connexions"

### Concept

Le design "Connexions" s'inspire de l'idée de mise en relation avec une esthétique minimaliste très épurée. Lignes fines, espaces négatifs assumés, typographie contrastée. Inspiré du design suisse et du Bauhaus moderne.

### Palette de Couleurs

```
Monochromes (90% de l'interface)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Noir principal    #0A0A0A
Gris foncé        #3A3A3A
Gris moyen        #7A7A7A
Gris clair        #D4D4D4
Blanc cassé       #FAFAFA
Blanc pur         #FFFFFF

Accents (10% de l'interface)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rose TBS          #EA5256  ← CTAs, compteurs
Violet rare       #8b5cf6  ← Badges stage uniquement
```

### Typographie

```
Famille : Inter (Google Fonts)
Monospace : JetBrains Mono (pour compteurs)

Hiérarchie
━━━━━━━━━━━━━━
Hero titre        64px / 300 light
Section titre     48px / 300 light
Card titre        24px / 300 light
Corps de texte    16px / 400 regular
CTAs              14px / 600 semibold uppercase

Tracking
━━━━━━━━
Titres      -0.02em (serré)
CTAs        +0.05em (large)
```

### Principes de Design

1. **Espaces négatifs extrêmes** : Padding 48-96px, marges latérales 10%
2. **Bordures ultra-fines** : 0.5px partout, jamais plus
3. **Radius uniforme** : 12px sur tous les composants
4. **Grille stricte 8px** : Baseline grid respectée au pixel près
5. **Monochrome + accent** : 90% noir/blanc/gris, 10% rose TBS
6. **Typographie contrastée** : Poids 300 (light) vs 600 (semibold)

---

## ⚡ Fonctionnalités

### Interface
- ✅ Navigation sticky minimaliste avec détection scroll
- ✅ Compteurs animés (count-up effect) en JetBrains Mono
- ✅ Lignes connecteurs animées (SVG stroke-dasharray)
- ✅ Scroll reveal sur les cards (stagger 80ms)
- ✅ Hover states subtils (2px lift, border noir)
- ✅ Menu hamburger responsive

### Contenu
- 📊 Statistiques en temps réel (347 offres, 892 étudiants, 45 entreprises)
- 💼 6 offres d'emploi exemples (Airbus, Capgemini, BNP Paribas, etc.)
- 🎯 Section "Le processus" en 3 étapes
- 🤝 CTA recruteurs avec card épurée

---

## 🚀 Utilisation

### Lancement Local

```bash
cd easyjob

# Option 1 : Ouvrir directement
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows

# Option 2 : Serveur local
python3 -m http.server 8000
# Puis ouvrir http://localhost:8000
```

### Structure

```
easyjob/
├── index.html       # Structure HTML épurée
├── styles.css       # Design system complet
├── app.js           # Interactions & animations
├── README.md        # Cette documentation
└── CLAUDE.MD        # Contexte technique AI
```

---

## 🏗️ Architecture Technique

### Technologies

- **HTML5** : Structure sémantique minimaliste
- **CSS3** : Variables CSS, Grid, Flexbox, SVG animations
- **JavaScript Vanilla** : Intersection Observer, count-up, scroll reveal
- **Fonts** : Inter (300, 400, 500, 600) + JetBrains Mono
- **Aucune dépendance externe**

### Tokens CSS

Tous les tokens sont définis dans `:root` :

```css
/* Espacements (grille 8px) */
--space-1: 8px
--space-12: 96px

/* Typographie */
--text-xs: 12px
--text-4xl: 64px

/* Couleurs */
--noir: #0A0A0A
--rose-tbs: #EA5256

/* Bordures */
--border-thin: 0.5px solid var(--gris-clair)
--radius: 12px

/* Ombres */
--shadow-subtle: 0 2px 8px rgba(10, 10, 10, 0.04)
```

### Composants Clés

**Bouton Primaire**
- Fond rose TBS, texte blanc
- Padding 18px 48px, radius 12px
- Hover : lift -2px, shadow forte
- Uppercase 14px, tracking +0.05em

**Card Offre**
- Fond blanc, border 0.5px gris clair
- Padding 32px, radius 12px
- Hover : border noir, lift -4px
- Scroll reveal avec stagger

**Point de Connexion**
- Cercle plein 4px rose TBS
- Outline 12px border 1px
- Utilisé comme marqueur visuel

**Ligne Connecteur**
- SVG 1px, stroke rose 20% opacité
- Animation stroke-dasharray 600ms
- Angle 30-60°, jamais horizontal/vertical

---

## 📱 Responsive

### Desktop (> 1024px)
- Grille 3 colonnes pour cards
- Marges latérales 10% (140px sur 1400px)
- Hero titre 64px
- Navigation horizontale

### Tablet (768px - 1024px)
- Grille 2 colonnes
- Marges latérales adaptées
- Hero titre 48px
- Process en 1 colonne

### Mobile (< 768px)
- Grille 1 colonne
- Marges latérales 5%
- Hero titre 32px
- Menu hamburger
- Boutons pleine largeur

---

## 🎯 Personnalisation

### Ajouter une Offre

Éditer `app.js` :

```javascript
const jobsDatabase = [
    {
        id: 7,
        company: "Votre Entreprise",
        title: "Titre du Poste",
        type: "stage",  // ou "cdd", "cdi", "petit-boulot"
        description: "Description courte et impactante.",
        location: "Ville",
        posted: "Il y a Xh"
    }
];
```

### Modifier les Couleurs

Éditer les tokens dans `styles.css` :

```css
:root {
    --rose-tbs: #EA5256;  /* Rose TBS */
    --noir: #0A0A0A;      /* Noir principal */
}
```

⚠️ **Important** : Le design "Connexions" repose sur la parcimonie. Ne pas ajouter plus de 2-3 couleurs accent.

### Changer les Statistiques

Éditer les attributs `data-target` dans `index.html` :

```html
<div class="stat-number" data-target="500">0</div>
```

---

## 🎬 Animations

### Compteurs
- Trigger : Intersection Observer (50% visible)
- Duration : 1200ms
- Easing : Ease-out
- Font : JetBrains Mono

### Lignes Connecteurs
- SVG stroke-dasharray animation
- Duration : 600ms hero, 800ms process
- Delay : 200ms (process)

### Cards Reveal
- Opacity 0 → 1, translateY 24px → 0
- Duration : 300ms ease-out
- Stagger : 80ms entre chaque card

### Hovers
- Duration : 200ms ease-out
- Cards : lift -4px + border noir
- Boutons : lift -2px + shadow forte

---

## 📐 Grille & Espacements

### Baseline Grid 8px

Tous les espacements sont multiples de 8px :
- 8px (space-1) : gaps internes
- 16px (space-2) : spacing éléments proches
- 32px (space-4) : padding cards
- 96px (space-12) : padding sections

### Conteneurs

```css
Max-width : 1400px
Padding latéral : 10% de la viewport
Sections : padding vertical 96px
Gap entre sections : 80px
```

---

## 🚢 Déploiement

### GitHub Pages

Le site est prêt pour être déployé :
```bash
# Settings → Pages → Source: main branch
# URL : https://username.github.io/easyjob
```

### Netlify / Vercel

Déploiement automatique à chaque push :
- Base directory : `easyjob`
- Build command : (aucune)
- Publish directory : `.`

---

## 🎓 Philosophie "Connexions"

> **"Connecter talents et opportunités"**

Le design "Connexions" traduit visuellement l'essence du job service :
- **Lignes connecteurs** : Symbolisent les liens créés entre étudiants et entreprises
- **Points de connexion** : Marquent les moments clés du parcours utilisateur
- **Espaces négatifs** : Donnent de l'air, mettent en valeur le contenu essentiel
- **Monochrome** : Projette professionnalisme et sérieux (important pour B2B)
- **Rose TBS** : Utilisé avec parcimonie pour guider l'œil vers les actions clés

---

## ⚠️ Contraintes & Limites

### Actuellement
- Données statiques (offres hardcodées dans JS)
- Pas de backend (formulaire non fonctionnel)
- Pas d'authentification utilisateur
- Pas de système de candidature

### Pour Production
- [ ] Backend API (Node.js/Express)
- [ ] Base de données (PostgreSQL)
- [ ] Envoi d'emails automatisés
- [ ] Système de candidature en ligne
- [ ] Dashboard entreprises
- [ ] Analytics et tracking

---

## 📚 Ressources

- [Inter Font](https://fonts.google.com/specimen/Inter)
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

---

## 👥 Équipe

- **Design System** : "Connexions" (Minimaliste Épuré)
- **École** : TBS Education, Toulouse
- **Contact** : contact@easyjob-tbs.fr

---

## 📝 Licence

© 2026 EasyJob — TBS Education. Tous droits réservés.

---

**Développé avec une obsession du détail pour les étudiants et entreprises de TBS Education**
