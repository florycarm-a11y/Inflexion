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
├── image-catalog.js        # ~120 images Unsplash par sous-thème + matchImage()
├── app.js                  # Logique JS principale
├── data-loader.js          # Charge les JSON → met à jour le DOM (utilise matchImage)
├── data/                   # Fichiers JSON générés par le pipeline
├── scripts/                # Pipeline Node.js (fetch, insight, veille, briefing, RAG, tests)
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

### Migration effectuée (TERMINÉE)

- **22 fichiers** migrés vers palette emerald (commit `3d6b38e`)
- `index.html` : Tailwind config, couleurs inline, hero dark, glass effects migrés
- `nav-shared.js` : bronze bar, mega menu, mobile overlay emerald, scroll handler
- `styles.css` : variables `:root` + couleurs hardcodées migrées
- `analyses.html` + 5 articles `analyse-*.html` : couleurs, bronze bar, hero gradient 3D
- 8 pages legacy : Tailwind CDN + config, Google Fonts, nav-shared.js
- 3 pages légales (cgu, mentions-legales, confidentialite) : migrées
- Articles React : hero gradient dynamique (CSS keyframes + parallax scroll via useRef)

### Images éditoriales

- `image-catalog.js` : ~120 images Unsplash classées par 60+ sous-thèmes (pétrole, bitcoin, Fed, IA, etc.)
- `matchImage(title, category, w, h)` : matching titre → mots-clés → image contextuelle
- Fallback : sous-thème → catégorie générique → géopolitique par défaut
- Branché sur `index.html` (React) et `data-loader.js` (legacy) — 11 pages au total
- Pour ajouter un thème : ajouter une entrée dans `CATALOG` de `image-catalog.js`

## 4. Navigation frontend

- **Desktop (≥768px)** : mega menu dropdown avec icônes emoji, CTA "Réserver un diagnostic"
- **Mobile (<768px)** : hamburger → overlay plein écran emerald `#006650`, animations décalées
- **`nav-shared.js`** : remplace automatiquement header/nav/hero/footer sur pages legacy

## 5. Pipeline de données

```
GitHub Actions (cron 2x/jour : 06h + 18h UTC)
  → fetch-data.mjs (15 APIs + 158 RSS)
  → insight-filter.mjs (scoring 1-10, seuil ≥6, dédup sémantique)
  → veille-continue.mjs (watchlist 22 thèmes + signaux faibles Claude)
  → generate-article.mjs (synthèse depuis insights.json + signaux)
  → validate-article.mjs (structure + anti-hallucination)
  → data/*.json → GitHub Pages (deploy auto)
```

### Flux IA
- **Insight filter** : Claude Haiku, score 1-10, ~2-3 appels batch/jour
- **Veille continue** : Watchlist (22 thèmes, 4 priorités) + signaux faibles Claude
- **Briefing** : Claude Sonnet + RAG | **Article** : Haiku quotidien (source : insights filtrés)
- Sorties : `insights.json`, `signals.json`, `signals-history.json` (30j)

## 6. APIs (15)

**Avec clé** : Finnhub, GNews, FRED, Alpha Vantage, Messari, Twelve Data, NewsAPI
**Sans clé** : CoinGecko, Alternative.me, DefiLlama, metals.dev, Etherscan, Mempool.space, ECB Data, World Bank

## 7. Commandes utiles

```bash
npm test                                              # ~188 tests
npx serve .                                           # Serveur local
node scripts/fetch-data.mjs                           # Pipeline données
node scripts/insight-filter.mjs                       # Scoring insight (nécessite ANTHROPIC_API_KEY)
node scripts/veille-continue.mjs                      # Watchlist + signaux faibles
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
