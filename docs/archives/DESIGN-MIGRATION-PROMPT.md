# Instruction Claude Code — Migration Design Inflexion

## Objectif

Appliquer le design system de `index.html` (source de vérité) à **toutes les autres pages HTML** du repo connectées à inflexionhub.com. Le résultat final : chaque page doit être visuellement indiscernable d'index.html en termes de navigation, hero, footer, typographie, palette de couleurs et layout.

---

## Pages cibles

### Pages legacy (styles.css + app.js + data-loader.js)
- `geopolitics.html`
- `markets.html`
- `crypto.html`
- `commodities.html`
- `etf.html`
- `premium.html`
- `expertise.html`
- `country.html`

### Pages React/Tailwind autonomes
- `analyses.html`
- `analyse-petrole-trump-iran-ormuz.html`
- `analyse-cuba-crise-perspectives.html`
- `analyse-cloud-ia-pme-europeennes.html`
- `analyse-or-bitcoin-divergence.html`
- `analyse-droits-douane-trump-groenland.html`
- `analyse-ia-rempart-marches.html`
- `ai-tech.html`

### Pages légales (simples)
- `cgu.html`
- `mentions-legales.html`
- `confidentialite.html`

### Exclure
- `index.html` (source de vérité, ne pas toucher)
- `index-old.html`, `og-image.html`, `artifact-inflexion.html`, `analysis-template.html`
- Tout ce qui est dans `.claude/skills/`
- Tout ce qui est dans `data/analyses/` (duplicats)

---

## Design System — Source de vérité (index.html)

### Palette de couleurs — 100% VERT, AUCUN BLEU NAVY

```
Emerald primary:     #006650   ← couleur dominante (hero, nav, overlays, fonds sombres)
Emerald sombre:      #06402A   ← hover, variantes dark, dégradés
Emerald lighter:     #008066
Emerald light:       #33B894   ← labels, accents clairs
Emerald bg tint:     #E8F5EE

Bronze accent:       #C8955A   ← top bar, accents secondaires

Background primary:  #FFFFFF
Background alt:      #F7F8FA
Background tertiary: #ECEEF2

Text primary:        #1A1F2E
Text secondary:      #5A6178
Text muted:          #8A93A8

Border:              #E2E5EB
Border light:        #ECEEF2
```

**IMPORTANT : Plus aucun dark navy (#0A1628, #0F2035, #162A45). Tous remplacés par #006650 ou #06402A.**

### Typographie

```
Titres (h1, h2, h3): Libre Baskerville, Georgia, serif — font-weight: 700, line-height: 1.15, letter-spacing: -0.02em
Corps:               Inter, Helvetica Neue, sans-serif
Données/monospace:   JetBrains Mono, SF Mono, monospace
Labels catégorie:    Inter, 0.75rem, font-weight: 600, uppercase, letter-spacing: 0.1em, color: #006650
```

Google Fonts link :
```html
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
```

### Tailwind Config

```javascript
tailwind.config={theme:{extend:{colors:{brand:{900:'#06402A',800:'#006650',700:'#007A60',600:'#008066',500:'#00997A',400:'#33B894',300:'#6ee7b7',200:'#a7f3d0',100:'#d1fae5',50:'#E8F5EE'},cool:{50:'#F7F8FA',100:'#ECEEF2',200:'#E2E5EB',300:'#D1D5DE'}},fontFamily:{display:['Libre Baskerville','Georgia','serif'],body:['Inter','Helvetica Neue','sans-serif'],data:['JetBrains Mono','SF Mono','monospace']}}}}
```

### Éléments structurels

1. **Bronze top bar** : `position:fixed; top:0; height:3px; background:#C8955A; z-index:51`

2. **Header/Nav** : fixé sous le bronze bar (top:3px), transparent sur fond hero sombre, glass effect au scroll (`rgba(255,255,255,.92)` + blur 16px), mega menu dropdown avec icônes emoji

3. **Hero section** : fond `#006650` (emerald), catégorie label en `#33B894` uppercase, titre en blanc `Libre Baskerville`, sous-titre en `rgba(255,255,255,.5)`, padding `7rem 0 3.5rem`

4. **Footer** : fond `#F7F8FA`, border-top `#E2E5EB`, grille 4 colonnes desktop / 2 mobile, liens couleur `#5A6178` hover `#006650`, tags sources en bas

5. **Body** : `background: #FFFFFF`, pas de beige/crème

6. **Mobile overlay** : fond `#006650` (emerald), pas navy

---

## Architecture technique

### Pages legacy (styles.css)

Ces pages utilisent `styles.css` pour le style. Le fichier `styles.css` contient des variables CSS `:root` qui doivent être alignées sur la nouvelle palette. **Les variables sont déjà mises à jour** dans `:root` :

```css
--accent: #006650;
--accent-dark: #06402A;
--accent-light: #E8F5EE;
--navy: #006650;
--navy-light: #06402A;
--bg-primary: #FFFFFF;
--bg-secondary: #F7F8FA;
--bg-tertiary: #ECEEF2;
--text-primary: #1A1F2E;
--text-secondary: #5A6178;
--text-muted: #8A93A8;
--border-color: #E2E5EB;
--border-light: #ECEEF2;
--font-serif: 'Libre Baskerville', Georgia, serif;
--font-sans: 'Inter', 'Helvetica Neue', sans-serif;
--red: #C8955A;
```

**Le fichier `nav-shared.js`** remplace automatiquement le header, la nav, le hero et le footer sur ces pages. Il est chargé en dernier script.

#### Ce qui manque potentiellement sur les pages legacy :

1. **Tailwind CDN + config** dans le `<head>` (pour les classes utilitaires)
2. **Google Fonts** link (Libre Baskerville, Inter, JetBrains Mono)
3. **`nav-shared.js`** chargé en dernier `<script>`
4. **Suppression** de l'ancien lien `Plus Jakarta Sans`
5. **Vérification** que styles.css ne contient plus de couleurs hardcodées anciennes
6. **Vérification** que le contenu `<main>` ne hardcode pas d'anciennes couleurs dans des `style=""` inline

### Pages React/Tailwind autonomes (analyses, articles)

Ces pages ont leur propre `<style>` inline et n'utilisent pas styles.css. Elles doivent :

1. Avoir le Tailwind CDN + config identique à index.html
2. Avoir le Google Fonts link
3. Utiliser les bonnes couleurs dans leur `<style>` et composants React
4. Avoir la même navigation (soit React embarquée comme index.html, soit nav-shared.js)
5. Avoir le même footer
6. Avoir le bronze top bar (3px #C8955A)
7. Fond body `#FFFFFF`, pas autre chose

---

## Checklist par page

Pour **chaque page** à migrer, vérifier :

- [ ] `<link>` Google Fonts (Libre Baskerville, Inter, JetBrains Mono) — présent
- [ ] `<script src="https://cdn.tailwindcss.com">` — présent
- [ ] `tailwind.config` — identique à index.html (sans clé `navy`)
- [ ] Pas de lien `Plus Jakarta Sans` — supprimé
- [ ] `nav-shared.js` chargé en dernier (pages legacy uniquement)
- [ ] Body background = `#FFFFFF` (pas beige, pas gris)
- [ ] Aucune couleur ancienne hardcodée :
  - `#0B3D1E`, `#072A14`, `#14713A`, `#EDE8DC`, `#C41E3A`, `#8CBF9E`
  - `#0A1628`, `#0F2035`, `#162A45` (anciennes navy → interdites)
- [ ] Remplacements couleurs faits si trouvées :
  - `#0B3D1E` → `#006650`
  - `#072A14` → `#06402A`
  - `#14713A` → `#33B894`
  - `#EDE8DC` → `#FFFFFF`
  - `#C41E3A` → `#C8955A`
  - `#8CBF9E` → `#33B894`
  - `#1B6B4A` → `#006650`
  - `#155A3D` → `#06402A`
  - `#EDF5F0` → `#E8F5EE`
  - `#0A1628` → `#006650`
  - `#0F2035` → `#06402A`
  - `#162A45` → `#06402A`
  - `Plus Jakarta Sans` → `Inter`
- [ ] Hero section : fond `#006650` (emerald), label vert `#33B894`, titre blanc Libre Baskerville
- [ ] Footer moderne (via nav-shared.js ou inline) — fond `#F7F8FA`
- [ ] Bronze bar 3px `#C8955A` en haut
- [ ] Mega menu navigation fonctionnel (desktop + mobile)
- [ ] Mobile overlay fond `#006650` (pas navy)
- [ ] Responsive correct (pas d'overflow-x)

---

## Commandes de vérification

```bash
# Chercher les anciennes couleurs dans TOUS les HTML (inclut les navy interdites)
grep -rn '#0B3D1E\|#072A14\|#14713A\|#EDE8DC\|#C41E3A\|#8CBF9E\|#1B6B4A\|#155A3D\|#0A1628\|#0F2035\|#162A45' *.html

# Chercher Plus Jakarta Sans
grep -rn 'Plus Jakarta' *.html styles.css

# Vérifier que nav-shared.js est chargé sur les pages legacy
for f in geopolitics markets crypto commodities etf premium expertise country; do
  grep -l 'nav-shared.js' ${f}.html || echo "MANQUE: ${f}.html"
done

# Vérifier Google Fonts
for f in geopolitics markets crypto commodities etf premium expertise country analyses; do
  grep -l 'Libre+Baskerville' ${f}.html || echo "MANQUE FONTS: ${f}.html"
done
```

---

## Fichiers clés de référence

| Fichier | Rôle |
|---------|------|
| `index.html` | **Source de vérité** — ne pas modifier |
| `styles.css` | CSS des pages legacy, variables `:root` déjà migrées |
| `nav-shared.js` | Script qui remplace header/nav/hero/footer sur pages legacy |
| `app.js` | Logique JS pages legacy (navigation desktop/mobile — remplacée par nav-shared.js) |
| `data-loader.js` | Charge les JSON dans le DOM des pages legacy |

---

## Priorité d'exécution

1. **D'abord** : vérifier `styles.css` (couleurs hardcodées restantes au-delà de `:root`)
2. **Ensuite** : pages legacy (geopolitics → markets → crypto → commodities → etf → premium → expertise → country) — ajouter Tailwind/fonts/nav-shared.js si manquant
3. **Puis** : pages articles (analyse-*.html) — aligner couleurs et structure
4. **Puis** : analyses.html — aligner si pas déjà fait
5. **Enfin** : pages légales (cgu, mentions, confidentialité) — version minimale

---

## Contraintes

- **Ne pas modifier le contenu éditorial** (textes, données, articles)
- **Ne pas modifier index.html**
- **Préserver les fonctionnalités JS existantes** (TradingView widgets, data-loader, filtres, etc.)
- **Ne pas casser le responsive mobile** existant
- **Ne pas ajouter de nouvelles dépendances** (tout est vanilla JS + Tailwind CDN)
- **Garder les `<main>` intacts** — ne modifier que les styles, pas la structure du contenu
- **ZÉRO bleu navy** — tout fond sombre = emerald (#006650) ou emerald sombre (#06402A)
