# CLAUDE.md — Inflexion Guide Technique

## 0. Gestion du contexte (APPLIQUER SYSTÉMATIQUEMENT)

- **Ce fichier doit rester ≤ 2 000 tokens.** Ne jamais l'alourdir.
- **Plan mode** : activer pour tout refactoring, audit de code ou analyse multi-fichiers (÷2 tokens).
- **Sub-agents** : déléguer lectures de gros fichiers, grep exploratoires, et tests à des sub-agents isolés. Ne pas polluer la session principale.
- **Compaction manuelle** : lancer `/compact` à chaque point d'arrêt logique (feature terminée, bug fixé). Ne pas attendre l'auto-compaction.
- **Sessions séparées** : 1 session = 1 domaine (éditorial / front-end / pipeline / debug). Ne pas mélanger.
- **Compact Instructions** : lors de la compaction, préserver : chemins fichiers modifiés, messages d'erreur, décisions d'architecture, état du bug en cours.
- **MCP** : le Tool Search auto gère la charge MCP. Si overhead MCP > 10% du contexte, désactiver les serveurs non utilisés.
- **Seuil d'alerte** : si `/context` montre > 70% d'utilisation, compacter immédiatement avant de continuer.

## 1. Vue d'ensemble

**Inflexion** est une plateforme d'intelligence financière automatisée combinant analyses géopolitiques et données de marché en temps réel. Le système agrège **15 APIs**, **158 flux RSS** et utilise **Claude Sonnet** (briefing stratégique) + **Claude Haiku** (classification, alertes).

**URL de production** : https://florycarm-a11y.github.io/Inflexion/

## 2. Structure des fichiers

```
Inflexion/
├── index.html              # Page principale — SOURCE DE VÉRITÉ design
├── analyses.html           # Page analyses approfondies (React/Tailwind)
├── commodities.html        # Page matières premières
├── crypto.html             # Page crypto & blockchain
├── etf.html                # Page ETF & fonds
├── geopolitics.html        # Page géopolitique
├── markets.html            # Page marchés & finance
├── premium.html            # Page services premium
├── expertise.html          # Page méthodologie & approche
├── country.html            # Page macro par pays (World Bank)
├── ai-tech.html            # Page IA & Tech
├── analyse-*.html          # Articles d'analyse thématique
├── cgu.html / mentions-legales.html / confidentialite.html
├── styles.css              # CSS pages legacy (variables `:root` migrées)
├── nav-shared.js           # Navigation moderne injectée sur pages legacy
├── app.js                  # Logique JS principale
├── data-loader.js          # Charge les JSON → met à jour le DOM
├── data/                   # Fichiers JSON générés par le pipeline
├── scripts/                # Pipeline Node.js (fetch, briefing, RAG, tests)
├── .github/workflows/      # CI/CD (fetch, briefing, article, sentiment, deploy)
└── DESIGN-MIGRATION-PROMPT.md  # Spécifications complètes design system
```

## 3. Design System (OBLIGATOIRE)

**Source de vérité : `index.html`** — Toute page doit être visuellement cohérente avec index.html.
**Spécifications détaillées : `DESIGN-MIGRATION-PROMPT.md`** — Lire ce fichier pour la palette complète, checklist et table de correspondance des couleurs.

### Palette

| Rôle | Hex |
|------|-----|
| Emerald primary | `#006650` |
| Emerald hover | `#06402A` |
| Emerald light | `#33B894` |
| Bronze accent | `#C8955A` |
| Emerald sombre | `#06402A` |
| Background | `#FFFFFF` |
| Background alt | `#F7F8FA` |
| Text primary | `#1A1F2E` |
| Text secondary | `#5A6178` |
| Border | `#E2E5EB` |

### Typo
- **Titres** : Libre Baskerville, 700, line-height 1.15
- **Corps** : Inter
- **Données** : JetBrains Mono

### Éléments structurels
1. **Bronze top bar** : 3px `#C8955A` fixe en haut
2. **Nav** : mega menu, transparent → glass au scroll
3. **Hero** : fond `#006650` (emerald), label `#33B894`, titre blanc
4. **Footer** : fond `#F7F8FA`, border `#E2E5EB`

### Architecture double
- **Pages legacy** (geopolitics, markets, crypto, commodities, etf, premium, expertise, country) : `styles.css` + `nav-shared.js` (dernier script)
- **Pages React** (index, analyses, analyse-*.html) : Tailwind CDN + styles inline

### Couleurs interdites (anciennes)
`#0B3D1E`, `#072A14`, `#14713A`, `#EDE8DC`, `#C41E3A`, `#8CBF9E`, `#1B6B4A`, `#155A3D`, `#0A1628`, `#0F2035`, `#162A45`, `Plus Jakarta Sans`

### Migration effectuée (état actuel)

**Fait :**
- `index.html` : badge "Mis à jour" supprimé, couverture "Marchés" remplacée par "IA & Tech" (4 sous-items : IA générative, Cloud & Souveraineté, Régulation Tech, Cybersécurité)
- `nav-shared.js` : entièrement réécrit — injecte bronze bar, header mega menu, hero navy, footer moderne, mobile overlay, scroll handler
- `styles.css` : toutes les variables `:root` migrées (--accent→#006650, --navy→#006650, --bg-primary→#FFFFFF, --font-sans→Inter, --font-serif→Libre Baskerville, --red→#C8955A) + 2 couleurs hardcodées corrigées
- `analyses.html` : couleurs migrées (#1B6B4A→#006650, etc.), bronze bar ajoutée
- 8 pages legacy (geopolitics, markets, crypto, commodities, etf, premium, expertise, country) : Tailwind CDN + config ajoutés, Google Fonts ajoutées, nav-shared.js ajouté, Plus Jakarta Sans supprimée

**Reste à faire :**
- Vérifier que chaque page legacy n'a plus de couleurs inline anciennes dans `<main>`
- Migrer les articles `analyse-*.html` (couleurs inline dans styles React)
- Migrer les pages légales (cgu, mentions-legales, confidentialite)
- Test visuel complet desktop + mobile sur chaque page

## 4. Navigation frontend

- **Desktop (≥768px)** : mega menu dropdown avec icônes emoji, CTA "Réserver un diagnostic"
- **Mobile (<768px)** : hamburger → overlay plein écran navy `#006650`, animations décalées
- **`nav-shared.js`** : remplace automatiquement header/nav/hero/footer sur pages legacy

## 5. Pipeline de données

```
GitHub Actions (cron 2x/jour : 06h + 18h UTC)
  → scripts/fetch-data.mjs (15 APIs + 158 RSS)
  → data/*.json (commit auto) → GitHub Pages (deploy auto)
  → data-loader.js (frontend)
```

### Flux IA
- **Briefing** : Claude Sonnet + RAG | **Analyses** : Claude Haiku 2x/jour | **Article + Newsletter** : Haiku quotidien

## 6. APIs (15)

**Avec clé** : Finnhub, GNews, FRED, Alpha Vantage, Messari, Twelve Data, NewsAPI
**Sans clé** : CoinGecko, Alternative.me, DefiLlama, metals.dev, Etherscan, Mempool.space, ECB Data, World Bank

## 7. Commandes utiles

```bash
npm test                                              # ~188 tests
npx serve .                                           # Serveur local
node scripts/fetch-data.mjs                           # Pipeline données
node scripts/generate-daily-briefing.mjs --dry-run    # Test briefing
grep -rn '#0B3D1E\|#072A14\|#EDE8DC' *.html styles.css  # Audit anciennes couleurs
```

## 8. Règles importantes

- **Pas de Markdown brut dans le HTML** : utiliser `<strong>`, `<em>` etc.
- **Pas de conseil en investissement** : disclaimer AMF obligatoire
- **ETF vs indices** : Finnhub retourne des prix ETF (SPY, QQQ), pas des niveaux d'indice
- **Anti-redondance briefing** : chaque donnée chiffrée UNE SEULE FOIS
- **Sourcing** : chaque donnée porte une attribution (source API ou presse)
- **Mots-clés courts (≤4 car.)** : `\b` (word boundary) dans les regex, pas `includes()`
- **Design** : toujours vérifier la cohérence avec index.html avant de modifier une page
