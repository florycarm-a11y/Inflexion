/**
 * Inflexion — Data Loader
 * Charge les données dynamiques depuis les fichiers JSON (générés par GitHub Actions)
 * Fallback gracieux vers les données statiques de app.js si les JSON ne sont pas encore disponibles
 *
 * Architecture :
 *   GitHub Actions (cron 6h) → scripts/fetch-data.mjs → data/*.json
 *   Frontend → data-loader.js → lit JSON → met à jour le DOM
 *   Fallback → app.js (données statiques hardcodées)
 *
 * @version 1.0.0
 * @author Inflexion
 */
const DataLoader = (function () {
    'use strict';

    // ─── Configuration ─────────────────────────────────────
    const CONFIG = {
        BASE_PATH: './data',
        FILES: {
            crypto:  'crypto.json',
            markets: 'markets.json',
            news:    'news.json',
            macro:   'macro.json',
            fearGreed: 'fear-greed.json',
            chart:   'chart-gold-btc.json',
            alphaVantage: 'alpha-vantage.json',
            defi:    'defi.json',
            meta:    '_meta.json',
            articleDuJour: 'article-du-jour.json',
            sentiment: 'sentiment.json',
            alerts:  'alerts.json',
            newsletter: 'newsletter.json',
            macroAnalysis: 'macro-analysis.json',
            marketBriefing: 'market-briefing.json',
            messari: 'messari.json',
            europeanMarkets: 'european-markets.json',
            worldBank: 'world-bank.json',
            newsapi: 'newsapi.json',
            dailyBriefing: 'daily-briefing.json'
        },
        // Durée max avant de considérer les données comme périmées (12h)
        STALE_THRESHOLD_MS: 12 * 60 * 60 * 1000,
        // Timeout pour les requêtes fetch
        FETCH_TIMEOUT_MS: 8000
    };

    // Cache local des données chargées
    let _cache = {};
    let _initialized = false;
    let _usingLiveData = false;

    // ─── Filtre de pertinence (filet de sécurité frontend) ──
    // Exclut les articles manifestement hors-sujet pour chaque rubrique.
    // Le filtre principal est côté pipeline (fetch-data.mjs), celui-ci
    // rattrape les articles hors-sujet dans les données déjà en cache.

    var IRRELEVANT_PATTERNS = {
        // Patterns à exclure de TOUTES les rubriques (sport, divertissement, etc.)
        _global: [
            /\bjo\s+(?:20\d\d|d[eu]|olympi)/i,
            /\bjeux\s+olympi/i,
            /\bolympi(?:que|c|cs|ad)/i,
            /\bcoupe\s+d(?:u|e)\s+mond/i,
            /\bworld\s+cup\b/i,
            /\bfootball\b.*\b(?:but|goal|match|victoire|defaite)/i,
            /\bman\s+utd\b/i, /\bman\s+united\b/i, /\bman\s+city\b/i,
            /\bchampions\s+league\b/i, /\bpremier\s+league\b/i,
            /\bligue\s+1\b/i, /\bliga\b/i, /\bserie\s+a\b/i,
            /\bballon\s+d'or\b/i,
            /\bmedaille\s+d'or\b/i, /\bgold\s+medal\b/i,
            /\bpatinage\b/i, /\bice\s+danc/i, /\bskeleto/i, /\bbiathlon\b/i,
            /\bski\s+(?:alpin|fond|cross)/i, /\bsnowboard/i, /\bbobsleigh/i,
            /\bmascotte/i, /\bmascot\b/i
        ],
        // Patterns spécifiques à exclure par rubrique
        geopolitics: [
            /\bnégligence\s+médical/i, /\bmedical\s+negligen/i,
            /\bhôpital\b.*\bgroupe\s+électrogène/i,
            /\btest\s+(?:du|de|le)\b/i,
            /\brecette\b/i, /\bcuisine\b/i
        ],
        markets: [
            /\bon\s+a\s+testé\b/i, /\btest\s+(?:du|de|le)\b.*(?:suv|voiture|auto)/i,
            /\bshoah\b/i, /\bholocaust\b/i,
            /\bfast[- ]?fashion\b/i,
            /\bfilmer\s+ses\s+matinales\b/i,
            /\bsonia\s+mabrouk\b/i, /\ble\s+cri\b.*\bbolloré/i,
            /\bbolloré\b.*\bchrétien/i, /\bchrétien\b.*\bbolloré/i,
            /\bémission\s+(?:tv|télé)\b/i, /\btv\s+show\b/i,
            /\bmagazine\s+chrétien/i, /\brecrutement\s+médiatique/i,
            /\bpensez\s+aux\s+enfants\b/i,
            /\bliberté\s+d['']internet\b/i,
            /\bcesu\b.*\bchèque/i, /\bchèque\s+emploi/i,
            /\bfait\s+divers\b/i, /\bastrolog/i
        ],
        ai_tech: [
            /\bpéage\b/i, /\btoll\b.*\bpayment/i, /\bbadge\s+liber/i,
            /\bpower\s+bank/i, /\bmagsafe\b.*\bpower/i,
            /\bvoiture\s+électrique/i, /\belectric\s+car/i,
            /\bcompteur\s+vélo\b/i, /\bcycling\s+gps/i,
            /\bpass\s+navigo\b/i, /\bcovoiturage\b/i,
            /\brecovery\s+tech\b.*\bboot/i, /\bjetboots/i,
            /\bastronaut/i, /\biss\b.*\bstation/i, /\bspace\s+ops/i,
            /\bnasa\b.*\bswift\b/i,
            /\bréduction\s+sur\b/i, /\b\d+\s*€\s+de\s+réduction/i,
            /\bice\s+is\s+pushing\b/i, /\bimmigration\s+raids?\b/i
        ],
        commodities: [
            /\btesla\b.*\b(?:sales?|ventes?|down|up)\b.*\b(?:uk|norway|netherlands)/i,
            /\bev\s+retreat\b/i, /\blegacy\s+ev\b/i,
            /\bactions?\s+australien/i, /\baustralian\s+stocks?\b/i,
            /\bhuman\s+health\s+matter/i
        ],
        crypto: [
            /\bcac\s+40\b/i, /\bbourse\b.*\brecord\b/i,
            /\bwhatsapp\b.*\bblock/i, /\bsurveillance\s+app/i
        ]
    };

    /**
     * Vérifie si un article est pertinent pour sa rubrique.
     * @param {Object} article - L'article avec title, description, rubrique
     * @returns {boolean} true si pertinent (à garder)
     */
    function isArticleRelevant(article) {
        var text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
        // Vérifier les patterns globaux (sport, etc.)
        for (var i = 0; i < IRRELEVANT_PATTERNS._global.length; i++) {
            if (IRRELEVANT_PATTERNS._global[i].test(text)) return false;
        }
        // Vérifier les patterns spécifiques à la rubrique
        var catKey = article.rubrique || '';
        // Mapper rubrique FR → clé interne
        var rubriqueToKey = {
            'geopolitique': 'geopolitics',
            'marches': 'markets',
            'crypto': 'crypto',
            'matieres_premieres': 'commodities',
            'ai_tech': 'ai_tech'
        };
        var key = rubriqueToKey[catKey] || catKey;
        var patterns = IRRELEVANT_PATTERNS[key];
        if (patterns) {
            for (var j = 0; j < patterns.length; j++) {
                if (patterns[j].test(text)) return false;
            }
        }
        return true;
    }

    // ─── Utilitaires ───────────────────────────────────────

    /**
     * Fetch un fichier JSON avec timeout et gestion d'erreur
     * @param {string} filename - Nom du fichier dans /data/
     * @returns {Promise<Object|null>} Les données ou null si erreur
     */
    async function loadJSON(filename) {
        const url = `${CONFIG.BASE_PATH}/${filename}?t=${Date.now()}`;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT_MS);

            const response = await fetch(url, {
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timeout);

            if (!response.ok) {
                if (response.status === 404) {
                    console.info(`[DataLoader] ${filename} non trouvé (normal si pas encore généré)`);
                } else {
                    console.warn(`[DataLoader] Erreur ${response.status} pour ${filename}`);
                }
                return null;
            }

            const data = await response.json();
            return data;
        } catch (err) {
            if (err.name === 'AbortError') {
                console.warn(`[DataLoader] Timeout pour ${filename}`);
            } else {
                console.info(`[DataLoader] ${filename} indisponible: ${err.message}`);
            }
            return null;
        }
    }

    /**
     * Vérifie si les données sont encore fraîches
     * @param {string} updatedISO - Date ISO de dernière mise à jour
     * @returns {boolean}
     */
    function isFresh(updatedISO) {
        if (!updatedISO) return false;
        const age = Date.now() - new Date(updatedISO).getTime();
        return age < CONFIG.STALE_THRESHOLD_MS;
    }

    /**
     * Formate un prix en USD avec conventions françaises
     * (virgule décimale, espace séparateur de milliers, symbole $ après le nombre)
     * @param {number} value
     * @param {number} decimals
     * @returns {string}
     */
    function formatUSD(value, decimals = 2) {
        if (value >= 1e12) return `${(value / 1e12).toFixed(1).replace('.', ',')} T$`;
        if (value >= 1e9)  return `${(value / 1e9).toFixed(1).replace('.', ',')} Mrd $`;
        if (value >= 1e6)  return `${(value / 1e6).toFixed(1).replace('.', ',')} M $`;
        return `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} $`;
    }

    /**
     * Formate un pourcentage avec signe et couleur
     * @param {number} pct
     * @returns {{ text: string, positive: boolean }}
     */
    function formatPercent(pct) {
        if (pct == null || isNaN(pct)) return { text: 'N/A', positive: false };
        const sign = pct >= 0 ? '+' : '';
        return {
            text: `${sign}${pct.toFixed(2).replace('.', ',')}%`,
            positive: pct >= 0
        };
    }

    /**
     * Traduit les catégories DeFi anglaises en français
     */
    function translateDefiCategory(category) {
        var translations = {
            'Liquid Staking': 'Staking liquide',
            'Lending': 'Prêt',
            'Bridge': 'Pont',
            'Restaking': 'Restaking',
            'DEX': 'DEX',
            'CDP': 'CDP',
            'Yield': 'Rendement',
            'Derivatives': 'Dérivés',
            'RWA': 'Actifs réels (RWA)',
            'Staking': 'Staking',
            'Services': 'Services',
            'Algo-Stables': 'Stables algo.',
            'Insurance': 'Assurance',
            'Launchpad': 'Lancement',
            'NFT Marketplace': 'Place de marché NFT',
            'Prediction Market': 'Marché prédictif',
            'Privacy': 'Confidentialité',
            'Synthetics': 'Synthétiques',
            'Farm': 'Agriculture DeFi',
            'Yield Aggregator': 'Agrégateur de rendement',
            'Cross Chain': 'Inter-chaînes',
            'Options': 'Options',
            'Indexes': 'Indices',
            'Leveraged Farming': 'Agriculture à effet de levier'
        };
        return translations[category] || category;
    }

    // ─── Chargement des données ────────────────────────────

    /**
     * Initialise le DataLoader — charge tous les fichiers JSON
     * @returns {Promise<boolean>} true si au moins une source de données live est disponible
     */
    async function init() {
        console.log('[DataLoader] Initialisation...');

        // Charger tous les fichiers en parallèle
        const [crypto, markets, news, macro, fearGreed, chart, meta, articleDuJour, alphaVantage, defi, sentiment, alerts, newsletter, macroAnalysis, marketBriefing, messari, europeanMarkets, worldBank, newsapi, dailyBriefing] = await Promise.all([
            loadJSON(CONFIG.FILES.crypto),
            loadJSON(CONFIG.FILES.markets),
            loadJSON(CONFIG.FILES.news),
            loadJSON(CONFIG.FILES.macro),
            loadJSON(CONFIG.FILES.fearGreed),
            loadJSON(CONFIG.FILES.chart),
            loadJSON(CONFIG.FILES.meta),
            loadJSON(CONFIG.FILES.articleDuJour),
            loadJSON(CONFIG.FILES.alphaVantage),
            loadJSON(CONFIG.FILES.defi),
            loadJSON(CONFIG.FILES.sentiment),
            loadJSON(CONFIG.FILES.alerts),
            loadJSON(CONFIG.FILES.newsletter),
            loadJSON(CONFIG.FILES.macroAnalysis),
            loadJSON(CONFIG.FILES.marketBriefing),
            loadJSON(CONFIG.FILES.messari),
            loadJSON(CONFIG.FILES.europeanMarkets),
            loadJSON(CONFIG.FILES.worldBank),
            loadJSON(CONFIG.FILES.newsapi),
            loadJSON(CONFIG.FILES.dailyBriefing)
        ]);

        _cache = { crypto, markets, news, macro, fearGreed, chart, meta, articleDuJour, alphaVantage, defi, sentiment, alerts, newsletter, macroAnalysis, marketBriefing, messari, europeanMarkets, worldBank, newsapi, dailyBriefing };
        _initialized = true;

        // Déterminer si on utilise des données live
        const hasLiveData = Object.values(_cache).some(d => d !== null);
        _usingLiveData = hasLiveData;

        if (hasLiveData) {
            const freshness = meta?.last_update
                ? `(dernière MàJ: ${new Date(meta.last_update).toLocaleString('fr-FR')})`
                : '';
            console.log(`[DataLoader] ✓ Données live chargées ${freshness}`);
        } else {
            console.log('[DataLoader] ⚠ Aucune donnée live — utilisation des données statiques');
        }

        return hasLiveData;
    }

    // ─── Mise à jour du DOM ────────────────────────────────

    /**
     * Met à jour la sidebar "Marchés" avec les données live.
     * Inclut les indices US + européens (Twelve Data) dans un seul widget unifié.
     */
    // Mapping noms affichés → symboles TradingView
    var TRADINGVIEW_SYMBOLS = {
        'S&P 500': 'SPX', 'Nasdaq 100': 'NDX', 'Or (XAU)': 'GOLD',
        'Nvidia': 'NVDA', 'P\u00e9trole WTI': 'USOIL',
        'CAC 40': 'CAC40', 'DAX': 'DEU40', 'FTSE 100': 'UKX',
        'Euro Stoxx 50': 'SX5E', 'IBEX 35': 'IBEX35', 'FTSE MIB': 'FTSEMIB'
    };

    function makeTradingViewLink(displayName) {
        var sym = TRADINGVIEW_SYMBOLS[displayName];
        if (!sym) return null;
        return 'https://www.tradingview.com/symbols/' + sym + '/';
    }

    function buildMarketRow(displayName, priceStr, pct) {
        var link = makeTradingViewLink(displayName);
        var inner = '<span class="market-row-name">' + displayName + '</span>' +
            '<span class="market-row-price">' + priceStr + '</span>' +
            '<span class="market-row-change" style="color:' + (pct.positive ? 'var(--green, #16a34a)' : 'var(--red, #dc2626)') + '">' + pct.text + '</span>';

        if (link) {
            return '<div class="market-row"><a href="' + link + '" target="_blank" rel="noopener noreferrer" class="market-row-link">' + inner + '</a></div>';
        }
        return '<div class="market-row">' + inner + '</div>';
    }

    function updateMarketSidebar() {
        if (!_cache.markets?.quotes?.length) return;

        const sidebar = document.getElementById('market-table') ||
                       document.querySelector('.sidebar-markets') ||
                       document.querySelector('.market-data');
        if (!sidebar) return;

        const quotes = _cache.markets.quotes;

        // Mapping des noms pour correspondre au DOM existant
        const nameMap = {
            'S&P 500': ['SPY', 'S&P 500', 'S&P500'],
            'Nasdaq 100': ['QQQ', 'Nasdaq 100', 'Nasdaq'],
            'Or (XAU)': ['GLD', 'Or (ETF)', 'Gold', 'Or'],
            'Nvidia': ['NVDA', 'Nvidia'],
            'Pétrole WTI': ['USO', 'Pétrole (ETF)', 'Oil', 'Pétrole']
        };

        // Construire les lignes du tableau marchés
        var rows = [];

        // Ajouter les quotes US
        quotes.forEach(function(q) {
            for (var displayName in nameMap) {
                var aliases = nameMap[displayName];
                if (aliases.indexOf(q.name) !== -1 || aliases.indexOf(q.symbol) !== -1) {
                    var pct = formatPercent(q.change);
                    rows.push(buildMarketRow(displayName, formatUSD(q.price), pct));
                    break;
                }
            }
        });

        // Ajouter les indices européens (Twelve Data) directement dans le widget Marchés
        var EU_INDEX_MIN_PRICE = {
            'CAC 40': 4000, 'DAX': 10000, 'FTSE 100': 4000,
            'Euro Stoxx 50': 2500, 'IBEX 35': 5000, 'FTSE MIB': 15000
        };
        if (_cache.europeanMarkets?.indices?.length) {
            rows.push('<div class="market-row market-row-separator"><span class="market-row-name market-section-label">Indices europ\u00e9ens</span></div>');
            _cache.europeanMarkets.indices.forEach(function(idx) {
                var pct = formatPercent(idx.change_pct);
                var minPrice = EU_INDEX_MIN_PRICE[idx.name] || 100;
                var priceValid = idx.price && idx.price >= minPrice;
                var priceStr = priceValid
                    ? idx.price.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0})
                    : '\u2014';
                if (!priceValid) pct = { text: '', positive: true };
                rows.push(buildMarketRow(idx.name, priceStr, pct));
            });
        }

        if (rows.length > 0) {
            sidebar.innerHTML = rows.join('');
        }

        // Ajouter indicateur de fraîcheur
        addFreshnessIndicator(sidebar, _cache.markets.updated);
    }

    /**
     * Met à jour une ligne de marché dans le DOM
     */
    function updateMarketRow(container, name, price, changePct) {
        const rows = container.querySelectorAll('.market-row, .market-item, tr');
        for (const row of rows) {
            if (row.textContent.includes(name)) {
                const priceEl = row.querySelector('.price, .market-price, .market-row-price, td:nth-child(2)');
                const changeEl = row.querySelector('.change, .market-change, .market-row-change, td:nth-child(3)');

                if (priceEl) priceEl.textContent = formatUSD(price);
                if (changeEl) {
                    const pct = formatPercent(changePct);
                    changeEl.textContent = pct.text;
                    changeEl.className = changeEl.className.replace(/positive|negative|up|down/g, '');
                    changeEl.classList.add(pct.positive ? 'positive' : 'negative');
                    changeEl.style.color = pct.positive ? 'var(--green, #16a34a)' : 'var(--red, #dc2626)';
                }
                break;
            }
        }
    }

    /**
     * Met à jour les données crypto dans la page
     */
    function updateCryptoSection() {
        if (!_cache.crypto?.prices?.length) return;

        const btc = _cache.crypto.prices.find(c => c.id === 'bitcoin');
        const eth = _cache.crypto.prices.find(c => c.id === 'ethereum');

        if (!btc) return;

        // Mettre à jour les éléments qui affichent le prix BTC
        document.querySelectorAll('[data-crypto="btc"], .btc-price').forEach(el => {
            el.textContent = formatUSD(btc.price, 0);
        });

        document.querySelectorAll('[data-crypto="btc-change"], .btc-change').forEach(el => {
            const pct = formatPercent(btc.change_24h);
            el.textContent = pct.text;
            el.style.color = pct.positive ? 'var(--green, #16a34a)' : 'var(--red, #dc2626)';
        });

        // Mettre à jour le marketData si la variable globale existe
        if (typeof window.marketData !== 'undefined' && Array.isArray(window.marketData)) {
            const btcEntry = window.marketData.find(m =>
                m.name.toLowerCase().includes('bitcoin') || m.name.includes('BTC')
            );
            if (btcEntry && btc) {
                btcEntry.price = btc.price;
                btcEntry.change = btc.change_24h;
            }
        }
    }

    /**
     * Met à jour le graphique Or vs Bitcoin si Chart.js est disponible
     */
    function updateGoldBitcoinChart() {
        if (!_cache.chart?.bitcoin?.length) return;

        // Chercher l'instance de graphique existante
        const chartCanvas = document.querySelector('#gold-btc-chart, .chart-canvas, canvas');
        if (!chartCanvas) return;

        // Émettre un événement personnalisé pour que app.js puisse mettre à jour le graphique
        const event = new CustomEvent('inflexion:chartDataReady', {
            detail: {
                bitcoin: _cache.chart.bitcoin,
                gold: _cache.chart.gold,
                period: _cache.chart.period
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Ajoute un petit indicateur de fraîcheur des données
     */
    function addFreshnessIndicator(container, updatedISO) {
        if (!updatedISO) return;

        // Supprimer l'ancien indicateur s'il existe
        const old = container.querySelector('.data-freshness');
        if (old) old.remove();

        const age = Date.now() - new Date(updatedISO).getTime();
        const minutes = Math.floor(age / 60000);
        const hours = Math.floor(minutes / 60);

        let timeText;
        if (minutes < 60) timeText = `il y a ${minutes}min`;
        else if (hours < 24) timeText = `il y a ${hours}h`;
        else timeText = `il y a ${Math.floor(hours / 24)}j`;

        const badge = document.createElement('div');
        badge.className = 'data-freshness';
        badge.setAttribute('data-updated', updatedISO);
        badge.style.cssText = `
            font-size: 10px;
            color: ${isFresh(updatedISO) ? '#16a34a' : '#d97706'};
            opacity: 0.8;
            margin-top: 8px;
            text-align: right;
        `;
        badge.innerHTML = `
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;
                  background:${isFresh(updatedISO) ? '#16a34a' : '#d97706'};
                  margin-right:4px;vertical-align:middle;"></span>
            Données ${isFresh(updatedISO) ? 'à jour' : 'anciennes'} — ${timeText}
        `;
        container.appendChild(badge);
    }

    // ─── Indicateurs macroéconomiques (FRED) ──────────────

    /**
     * Affiche les indicateurs macroéconomiques FRED
     */
    function updateMacroIndicators() {
        if (!_cache.macro?.indicators?.length) return;

        var container = document.getElementById('macro-indicators');
        if (!container) return;

        var indicators = _cache.macro.indicators;

        // Icônes SVG par série (remplace les emojis)
        var icons = {
            'CPIAUCSL': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
            'DFF':      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
            'GDP':      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
            'UNRATE':   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
            'DGS10':    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
            'DTWEXBGS': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
        };
        var defaultIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>';

        container.innerHTML = indicators.map(function(ind) {
            var icon = icons[ind.id] || defaultIcon;
            var displayValue;

            // Franciser les labels macroéconomiques
            var labelFR = {
                'Fed Funds Rate': 'Taux directeur Fed',
                'Treasury 10 ans': 'Bon du Trésor US 10 ans',
                'Spread 10Y-2Y': 'Écart de taux 10A-2A',
                'CPI YoY': 'IPC (glissement annuel)',
                'Dollar Index (broad)': 'Indice Dollar (large)',
                'Bilan Fed (actifs)': 'Bilan de la Réserve fédérale',
                'M2 Money Supply': 'Masse monétaire M2',
                'Unemployment Rate': 'Taux de chômage'
            };
            var displayLabel = labelFR[ind.label] || ind.label;

            // Formater la valeur selon le type (format français)
            if (ind.unit === '%') {
                displayValue = ind.value.toFixed(2).replace('.', ',') + ' %';
            } else if (ind.unit === 'Mrd $') {
                displayValue = (ind.value / 1000).toFixed(1).replace('.', ',') + ' T$';
            } else if (ind.unit === 'index') {
                displayValue = ind.value.toFixed(1).replace('.', ',');
            } else {
                displayValue = ind.value.toFixed(2).replace('.', ',');
            }

            // Variation
            var changeHTML = '';
            if (ind.change !== null) {
                var isPositive = ind.change >= 0;
                var changeSign = isPositive ? '+' : '';
                var changeLabel = ind.change_type === 'yoy' ? ' a/a' : '';

                // Pour l'inflation et le chômage, une hausse est "négative" (mauvaise)
                var invertColor = (ind.id === 'CPIAUCSL' || ind.id === 'UNRATE');
                var colorClass = invertColor
                    ? (isPositive ? 'macro-change-negative' : 'macro-change-positive')
                    : (isPositive ? 'macro-change-positive' : 'macro-change-negative');

                changeHTML = '<span class="macro-change ' + colorClass + '">' +
                    changeSign + ind.change.toFixed(2).replace('.', ',') +
                    (ind.change_type === 'yoy' ? ' %' : '') +
                    changeLabel + '</span>';
            }

            return '<div class="macro-card">' +
                '<div class="macro-card-icon">' + icon + '</div>' +
                '<div class="macro-card-body">' +
                    '<span class="macro-card-label">' + displayLabel + '</span>' +
                    '<span class="macro-card-value">' + displayValue + '</span>' +
                    changeHTML +
                '</div>' +
            '</div>';
        }).join('');

        // Ajouter indicateur de fraîcheur
        var macroSection = document.getElementById('macro-section');
        if (macroSection) {
            addFreshnessIndicator(macroSection, _cache.macro.updated);
        }
    }

    // ─── Fear & Greed Index ──────────────────────────────

    /**
     * Affiche le widget Fear & Greed Index avec jauge animée
     */
    function updateFearGreedWidget() {
        if (!_cache.fearGreed?.current) return;

        var fng = _cache.fearGreed;
        var score = fng.current.value;
        var label = fng.current.label;

        // Traduire le label en français
        var labelFR = {
            'Extreme Fear': 'Peur extrême',
            'Fear': 'Peur',
            'Neutral': 'Neutre',
            'Greed': 'Avidité',
            'Extreme Greed': 'Avidité extrême'
        };

        // Mettre à jour le score et le label
        var scoreEl = document.getElementById('fng-score');
        var labelEl = document.getElementById('fng-label');
        if (scoreEl) scoreEl.textContent = score;
        if (labelEl) {
            labelEl.textContent = labelFR[label] || label;
            // Couleur selon la zone
            if (score <= 25) labelEl.style.color = '#dc2626';
            else if (score <= 45) labelEl.style.color = '#f97316';
            else if (score <= 55) labelEl.style.color = '#eab308';
            else if (score <= 75) labelEl.style.color = '#84cc16';
            else labelEl.style.color = '#16a34a';
        }

        // Positionner l'aiguille de la jauge (0-100 → angle -90° à +90°)
        var needle = document.getElementById('fng-needle');
        if (needle) {
            var angle = -90 + (score / 100) * 180; // -90° (gauche) à +90° (droite)
            needle.setAttribute('transform', 'rotate(' + angle + ', 100, 100)');
        }

        // Variations 7j et 30j
        var weekEl = document.getElementById('fng-change-week');
        var monthEl = document.getElementById('fng-change-month');

        if (weekEl && fng.changes.week !== null) {
            var w = fng.changes.week;
            weekEl.textContent = (w >= 0 ? '+' : '') + w + ' pts';
            weekEl.style.color = w >= 0 ? '#16a34a' : '#dc2626';
        }
        if (monthEl && fng.changes.month !== null) {
            var m = fng.changes.month;
            monthEl.textContent = (m >= 0 ? '+' : '') + m + ' pts';
            monthEl.style.color = m >= 0 ? '#16a34a' : '#dc2626';
        }

        // Ajouter indicateur de fraîcheur
        var fngSection = document.getElementById('fng-section');
        if (fngSection) {
            addFreshnessIndicator(fngSection, fng.updated);
        }
    }

    // ─── Article du jour / Briefing stratégique ───────────

    /**
     * Affiche le briefing stratégique IA (prioritaire) ou l'article du jour (fallback).
     *
     * Le briefing stratégique (daily-briefing.json) est le produit phare d'Inflexion :
     * il croise signaux géopolitiques et données de marché avec interconnexions.
     * Si le briefing n'est pas disponible, on affiche l'article classique.
     */
    function updateArticleDuJour() {
        var container = document.getElementById('article-du-jour');
        if (!container) return;

        // Priorité au briefing stratégique (le produit différenciant d'Inflexion)
        var briefing = _cache.dailyBriefing;
        if (briefing && briefing.synthese && briefing.synthese.titre) {
            renderDailyBriefing(container, briefing);
            return;
        }

        // Fallback : article du jour classique
        var article = _cache.articleDuJour;
        if (article && article.titre) {
            renderClassicArticle(container, article);
            return;
        }

        // Aucun contenu disponible — laisser le placeholder
    }

    /**
     * Affiche le briefing stratégique avec signaux, interconnexions et risk radar.
     * C'est LE format qui distingue Inflexion des autres plateformes d'info financière.
     *
     * @param {HTMLElement} container - Élément DOM #article-du-jour
     * @param {Object} briefing - Données de daily-briefing.json
     */
    function renderDailyBriefing(container, briefing) {
        // Révéler la section (masquée par défaut ou par hideEmptySections)
        var section = document.getElementById('article-du-jour-section');
        if (section) {
            section.classList.remove('section-empty');
            section.style.display = '';
        }

        var s = briefing.synthese;

        // ── Convertir le Markdown de la synthèse en HTML ──
        var contenuHTML = markdownToHTML(s.contenu || '');

        // ── Signaux géopolitiques avec interconnexions ──
        var signauxHTML = '';
        if (briefing.signaux && briefing.signaux.length > 0) {
            var signauxCards = briefing.signaux.map(function(signal) {
                // Badge de sévérité avec couleur
                var severiteClass = signal.severite === 'urgent' ? 'severity-urgent' :
                    signal.severite === 'attention' ? 'severity-attention' : 'severity-info';

                // Emoji de catégorie
                var catEmoji = '';

                // Interconnexions (la valeur ajoutée !)
                var interHTML = '';
                if (signal.interconnexions && signal.interconnexions.length > 0) {
                    interHTML = '<div class="signal-interconnexions">' +
                        '<span class="inter-label">Interconnexions :</span>' +
                        signal.interconnexions.map(function(inter) {
                            return '<div class="inter-item">' +
                                '<span class="inter-arrow">→</span>' +
                                '<strong>' + inter.secteur + '</strong> ' +
                                '<span class="inter-impact">' + inter.impact + '</span>' +
                                (inter.explication ? '<span class="inter-explication"> — ' + inter.explication + '</span>' : '') +
                            '</div>';
                        }).join('') +
                    '</div>';
                }

                // Régions impactées
                var regionsHTML = '';
                if (signal.regions && signal.regions.length > 0) {
                    regionsHTML = '<div class="signal-regions">' +
                        signal.regions.map(function(r) {
                            return '<span class="region-tag">' + r + '</span>';
                        }).join('') +
                    '</div>';
                }

                return '<div class="signal-card ' + severiteClass + '">' +
                    '<div class="signal-header">' +
                        '<span class="signal-emoji">' + catEmoji + '</span>' +
                        '<h4 class="signal-title">' + signal.titre + '</h4>' +
                        '<span class="signal-severity-badge ' + severiteClass + '">' + signal.severite + '</span>' +
                    '</div>' +
                    '<p class="signal-description">' + signal.description + '</p>' +
                    interHTML +
                    regionsHTML +
                '</div>';
            }).join('');

            signauxHTML = '<div class="briefing-signaux">' +
                '<h3 class="briefing-section-title">Signaux clés du jour</h3>' +
                signauxCards +
            '</div>';
        }

        // ── Risk Radar ──
        var riskHTML = '';
        if (briefing.risk_radar && briefing.risk_radar.length > 0) {
            var riskItems = briefing.risk_radar.map(function(risk) {
                var severiteClass = risk.severite === 'urgent' ? 'severity-urgent' :
                    risk.severite === 'attention' ? 'severity-attention' : 'severity-info';
                var probaLabel = risk.probabilite === 'elevee' ? 'Probabilité élevée' :
                    risk.probabilite === 'moyenne' ? 'Probabilité moyenne' : 'Probabilité faible';

                return '<div class="risk-item ' + severiteClass + '">' +
                    '<div class="risk-header">' +
                        '<span class="risk-icon"></span>' +
                        '<strong class="risk-title">' + risk.risque + '</strong>' +
                        '<span class="risk-severity-badge ' + severiteClass + '">' + risk.severite + '</span>' +
                    '</div>' +
                    '<p class="risk-description">' + risk.description + '</p>' +
                    '<div class="risk-meta">' +
                        '<span class="risk-proba">' + probaLabel + '</span>' +
                        '<span class="risk-impact">Impact : ' + risk.impact_marche + '</span>' +
                    '</div>' +
                '</div>';
            }).join('');

            riskHTML = '<div class="briefing-risk-radar">' +
                '<h3 class="briefing-section-title">Radar des Risques</h3>' +
                riskItems +
            '</div>';
        }

        // ── Tags ──
        var tagsHTML = '';
        if (briefing.tags && briefing.tags.length > 0) {
            tagsHTML = '<div class="article-du-jour-tags">' +
                briefing.tags.map(function(t) {
                    return '<span class="article-tag">' + t + '</span>';
                }).join('') +
            '</div>';
        }

        // ── Sentiment global ──
        var sentimentColor = briefing.sentiment_global === 'haussier' ? '#16a34a' :
            briefing.sentiment_global === 'baissier' ? '#dc2626' :
            briefing.sentiment_global === 'mixte' ? '#eab308' : '#94a3b8';

        // ── Assemblage final ──
        container.innerHTML = '' +
            '<div class="article-du-jour-header">' +
                '<div class="article-du-jour-badge briefing-badge">Briefing Stratégique</div>' +
                '<time class="article-du-jour-date">' + formatArticleDate(briefing.date) + '</time>' +
                '<span class="briefing-sentiment-indicator" style="color:' + sentimentColor + '">' +
                    (briefing.sentiment_global || 'neutre') +
                '</span>' +
            '</div>' +
            '<h2 class="article-du-jour-title">' + s.titre + '</h2>' +
            (s.sous_titre ? '<p class="article-du-jour-subtitle">' + s.sous_titre + '</p>' : '') +
            '<div class="article-du-jour-content">' + contenuHTML + '</div>' +
            signauxHTML +
            riskHTML;
    }

    /**
     * Affiche l'article du jour classique (fallback si pas de briefing).
     * Conservé pour rétro-compatibilité avec article-du-jour.json existant.
     *
     * @param {HTMLElement} container - Élément DOM #article-du-jour
     * @param {Object} article - Données de article-du-jour.json
     */
    function renderClassicArticle(container, article) {
        var section = document.getElementById('article-du-jour-section');
        if (section) {
            section.classList.remove('section-empty');
            section.style.display = '';
        }

        var contenuHTML = markdownToHTML(article.contenu || '');

        var tagsHTML = (article.tags || [])
            .map(function(t) { return '<span class="article-tag">' + t + '</span>'; })
            .join('');

        var pointsClesHTML = (article.points_cles || [])
            .map(function(p) { return '<li>' + p + '</li>'; })
            .join('');

        var sourcesHTML = '';
        if (article.sources && article.sources.length > 0) {
            sourcesHTML = '<div class="article-du-jour-sources"><h4>Sources</h4><ul>' +
                article.sources.map(function(s) {
                    return '<li><a href="' + s.url + '" target="_blank" rel="noopener">' +
                        (s.titre || s.domaine) + '</a> <span class="source-domain">(' + s.domaine + ')</span></li>';
                }).join('') + '</ul></div>';
        }

        var sourcesLabel = article.sources && article.sources.length > 0
            ? 'GNews + Tavily (' + article.sources.length + ' sources)'
            : 'GNews';

        container.innerHTML = '' +
            '<div class="article-du-jour-header">' +
                '<div class="article-du-jour-badge">Synthese IA</div>' +
                '<time class="article-du-jour-date">' + formatArticleDate(article.date) + '</time>' +
            '</div>' +
            '<h2 class="article-du-jour-title">' + article.titre + '</h2>' +
            (article.sous_titre ? '<p class="article-du-jour-subtitle">' + article.sous_titre + '</p>' : '') +
            (pointsClesHTML ? '<div class="article-du-jour-points-cles"><h4>Points clés</h4><ul>' + pointsClesHTML + '</ul></div>' : '') +
            '<div class="article-du-jour-content">' + contenuHTML + '</div>' +
            sourcesHTML;
    }

    /**
     * Convertit du Markdown basique en HTML.
     * Gère : ## titres, **gras**, paragraphes, sauts de ligne.
     *
     * @param {string} md - Texte Markdown
     * @returns {string} HTML
     */
    function markdownToHTML(md) {
        var html = md
            .replace(/## (.+)/g, '<h3 class="article-section-title">$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        return '<p>' + html + '</p>';
    }

    function formatArticleDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr + 'T00:00:00');
        var months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    // ─── Filtrage par rubrique ──────────────────────────────

    /**
     * Initialise les boutons de filtrage par rubrique
     */
    function initRubriqueFilters() {
        var filtersContainer = document.getElementById('rubrique-filters');
        if (!filtersContainer) return;

        var buttons = filtersContainer.querySelectorAll('.rubrique-filter');
        buttons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                // Mettre à jour l'état actif
                buttons.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');

                // Filtrer les articles
                var rubrique = btn.getAttribute('data-rubrique');
                filterNewsByRubrique(rubrique);
            });
        });
    }

    /**
     * Filtre les articles affichés par rubrique
     */
    function filterNewsByRubrique(rubrique) {
        var newsItems = document.querySelectorAll('#latest-news .news-list-item');
        newsItems.forEach(function(item) {
            if (rubrique === 'all') {
                item.style.display = '';
            } else {
                var itemRubrique = item.getAttribute('data-rubrique');
                item.style.display = (itemRubrique === rubrique) ? '' : 'none';
            }
        });
    }

    // ─── Curation qualitative des articles ──────────────────

    /**
     * Tiers de sources : 1 = premium (think tanks, grandes rédactions),
     * 2 = bonne qualité (presse spécialisée), 3 = standard (agrégateurs, blogs)
     */
    var SOURCE_TIERS = {
        // Tier 1 — Grandes rédactions & think tanks
        'Reuters': 1, 'Financial Times': 1, 'Bloomberg': 1, 'The Economist': 1,
        'Le Monde': 1, 'Les Echos': 1, 'Le Figaro': 1, 'France 24': 1,
        'BBC': 1, 'BBC World': 1, 'The Guardian': 1, 'NYT': 1, 'New York Times': 1,
        'Wall Street Journal': 1, 'WSJ': 1, 'Politico': 1, 'Politico EU': 1,
        'Foreign Policy': 1, 'CFR': 1, 'Brookings': 1, 'Carnegie': 1, 'CSIS': 1,
        'Chatham House': 1, 'IISS': 1, 'IFRI': 1, 'IRIS': 1,
        'Al Jazeera': 1, 'RFI': 1, 'Courrier International': 1,
        'FMI': 1, 'IMF Blog': 1, 'BIS': 1, 'BCE': 1, 'ECB': 1, 'OECD': 1,
        'SIPRI': 1, 'Crisis Group': 1, 'Nikkei Asia': 1, "L'AGEFI": 1,
        // Tier 2 — Presse spécialisée reconnue
        'MarketWatch': 2, 'CNBC': 2, 'Seeking Alpha': 2, 'Investing.com': 2,
        'BFM Business': 2, 'La Tribune': 2, 'Capital': 2, 'Challenges': 2,
        'Zonebourse': 2, 'MoneyVox': 2,
        'CoinDesk': 2, 'CoinTelegraph': 2, 'The Block': 2, 'Decrypt': 2,
        'CoinTelegraph FR': 2, 'Cryptoast': 2, 'Journal du Coin': 2,
        'TechCrunch': 2, 'The Verge': 2, 'Ars Technica': 2, 'Wired': 2,
        'MIT Tech Review': 2, 'VentureBeat': 2, 'IEEE Spectrum': 2,
        'OilPrice': 2, 'Mining.com': 2, 'S&P Global': 2, 'MetalMiner': 2,
        'IEA': 2, 'IRENA': 2, 'Carbon Brief': 2, 'OPEC': 2,
        'Wolf Street': 2, 'Calculated Risk': 2, 'Naked Capitalism': 2,
        'Responsible Statecraft': 2, 'War on the Rocks': 2,
        'The Diplomat': 2, 'Middle East Eye': 2, 'Al-Monitor': 2,
        'Krebs on Security': 2, 'BleepingComputer': 2,
        'Blockworks': 2, 'Bitcoin Magazine': 2, 'The Defiant': 2,
        // Tier 3 — Tout le reste (agrégateurs, newsletters, etc.)
        'GNews': 3, 'NewsAPI': 3, 'Yahoo Finance': 3,
        '01net': 3, 'Numerama': 3, 'Next INpact': 3,
        'Hacker News': 3, 'The Register': 3,
        'CleanTechnica': 3, 'Rigzone': 3
    };

    /**
     * Score de qualité d'un article (0-100).
     * Critères : autorité source, qualité titre, qualité description,
     * fraîcheur, présence image, langue.
     *
     * @param {Object} article
     * @returns {number} Score 0-100
     */
    function scoreArticle(article) {
        var score = 0;

        // 1. Autorité de la source (0-35 pts)
        var src = (article.source || '').trim();
        var tier = SOURCE_TIERS[src] || 3;
        if (tier === 1) score += 35;
        else if (tier === 2) score += 22;
        else score += 10;

        // 2. Qualité du titre (0-20 pts)
        var title = article.title || '';
        if (title.length >= 30 && title.length <= 120) score += 12;
        else if (title.length >= 20) score += 6;
        // Bonus si pas de clickbait patterns
        var clickbait = /^(BREAKING|URGENT|EXCLU|FLASH|WOW|OMG|\d+\s+raisons?|vous ne|incroyable)/i;
        if (!clickbait.test(title)) score += 5;
        // Bonus si contient des chiffres concrets (données, cours)
        if (/\d+[\.,]?\d*\s*(%|\$|€|Mrd|milliard|billion|trillion)/i.test(title)) score += 3;

        // 3. Qualité de la description (0-20 pts)
        var desc = article.description || '';
        if (desc.length >= 80 && !isSummaryRedundant(title, desc)) score += 15;
        else if (desc.length >= 40) score += 8;
        else if (desc.length > 0) score += 3;
        // Bonus si description apporte de l'info complémentaire
        if (desc.length >= 50 && !isSummaryRedundant(title, desc)) score += 5;

        // 4. Fraîcheur (0-15 pts) — articles des dernières 24h privilégiés
        if (article.publishedAt) {
            var ageH = (Date.now() - new Date(article.publishedAt).getTime()) / 3600000;
            if (ageH <= 6) score += 15;
            else if (ageH <= 12) score += 12;
            else if (ageH <= 24) score += 8;
            else if (ageH <= 48) score += 3;
        }

        // 5. Présence image (0-5 pts)
        if (article.image) score += 5;

        // 6. Langue FR privilégiée (0-5 pts)
        if (article.lang === 'fr' || article.translated) score += 5;
        else if (!article.lang) score += 3; // Probablement FR

        return Math.min(score, 100);
    }

    /**
     * Sélectionne les meilleurs articles avec distribution équilibrée entre rubriques.
     * Objectif : 10-12 articles, 2-3 par rubrique, score qualité maximal.
     *
     * @param {Array} allArticles - Tous les articles filtrés
     * @param {number} targetTotal - Nombre total d'articles visé (défaut 12)
     * @returns {Array} Articles curatés et triés
     */
    function curateArticles(allArticles, targetTotal) {
        targetTotal = targetTotal || 12;

        // Regrouper par rubrique
        var byRubrique = {};
        var RUBRIQUES = ['geopolitique', 'marches', 'crypto', 'matieres_premieres', 'ai_tech'];
        RUBRIQUES.forEach(function(r) { byRubrique[r] = []; });

        allArticles.forEach(function(a) {
            var rub = a.rubrique || 'marches'; // Default
            if (!byRubrique[rub]) byRubrique[rub] = [];
            a._qualityScore = scoreArticle(a);
            byRubrique[rub].push(a);
        });

        // Trier chaque rubrique par score décroissant
        RUBRIQUES.forEach(function(r) {
            byRubrique[r].sort(function(a, b) { return b._qualityScore - a._qualityScore; });
        });

        // Phase 1 : garantir 2 articles par rubrique (si disponibles)
        var selected = [];
        var selectedUrls = new Set();
        var minPerRubrique = 2;

        RUBRIQUES.forEach(function(r) {
            var count = 0;
            for (var i = 0; i < byRubrique[r].length && count < minPerRubrique; i++) {
                var a = byRubrique[r][i];
                if (!selectedUrls.has(a.url)) {
                    selected.push(a);
                    selectedUrls.add(a.url);
                    count++;
                }
            }
        });

        // Phase 2 : compléter jusqu'à targetTotal avec les meilleurs restants
        var remaining = [];
        RUBRIQUES.forEach(function(r) {
            byRubrique[r].forEach(function(a) {
                if (!selectedUrls.has(a.url)) {
                    remaining.push(a);
                }
            });
        });
        remaining.sort(function(a, b) { return b._qualityScore - a._qualityScore; });

        // Compléter en limitant à max 3 par rubrique
        var rubriqueCount = {};
        selected.forEach(function(a) {
            var r = a.rubrique || 'marches';
            rubriqueCount[r] = (rubriqueCount[r] || 0) + 1;
        });

        for (var i = 0; i < remaining.length && selected.length < targetTotal; i++) {
            var a = remaining[i];
            var r = a.rubrique || 'marches';
            if ((rubriqueCount[r] || 0) < 3) {
                selected.push(a);
                selectedUrls.add(a.url);
                rubriqueCount[r] = (rubriqueCount[r] || 0) + 1;
            }
        }

        // Si toujours pas assez, accepter un 4e article des rubriques les plus riches
        if (selected.length < targetTotal) {
            for (var j = 0; j < remaining.length && selected.length < targetTotal; j++) {
                if (!selectedUrls.has(remaining[j].url)) {
                    selected.push(remaining[j]);
                    selectedUrls.add(remaining[j].url);
                }
            }
        }

        // Tri final par score décroissant (les meilleurs articles en premier)
        selected.sort(function(a, b) { return b._qualityScore - a._qualityScore; });

        return selected;
    }

    // ─── Helpers nettoyage articles ──────────────────────────
    var MAX_TITLE_LEN = 120;

    /**
     * Tronque un titre au dernier mot complet avant maxLen
     */
    function truncateTitle(title, maxLen) {
        if (!title || title.length <= maxLen) return title;
        var cut = title.lastIndexOf(' ', maxLen);
        if (cut < maxLen * 0.6) cut = maxLen; // pas de mot-frontière raisonnable
        return title.slice(0, cut) + '\u2026';
    }

    /**
     * Détecte si le résumé est redondant avec le titre
     * (inclusion, ou >60% des mots du titre présents dans le résumé)
     */
    function isSummaryRedundant(title, summary) {
        if (!title || !summary) return false;
        var t = title.toLowerCase().replace(/[^a-zàâäéèêëïîôùûüÿçœæ0-9 ]/g, '');
        var s = summary.toLowerCase().replace(/[^a-zàâäéèêëïîôùûüÿçœæ0-9 ]/g, '');
        // Cas 1 : le résumé commence pareil que le titre
        if (s.indexOf(t.slice(0, Math.min(50, t.length))) === 0) return true;
        // Cas 2 : le titre est contenu dans le résumé
        if (s.indexOf(t) !== -1) return true;
        // Cas 3 : >60% des mots du titre se retrouvent dans le résumé
        var titleWords = t.split(/\s+/).filter(function(w) { return w.length > 3; });
        if (titleWords.length === 0) return false;
        var matchCount = titleWords.filter(function(w) { return s.indexOf(w) !== -1; }).length;
        return (matchCount / titleWords.length) > 0.6;
    }

    /**
     * Met à jour la section "Dernières actualités" avec les articles curatés.
     * Sélection qualitative : 10-12 articles, distribués entre les 5 rubriques,
     * triés par score de qualité (source, contenu, fraîcheur).
     */
    function updateLatestNewsWithRubriques() {
        if (!_cache.news?.categories) return;

        var ln = document.getElementById('latest-news');
        if (!ln) return;

        // Collecter tous les articles avec leur rubrique (FR uniquement, avec titre, pertinents)
        var allArticles = [];
        Object.keys(_cache.news.categories).forEach(function(cat) {
            var articles = _cache.news.categories[cat];
            articles.forEach(function(a) {
                // Exclure articles EN non traduits
                if (a.lang === 'en' && !a.translated) return;
                // Exclure articles sans titre
                if (!a.title || a.title.length < 5) return;
                // Exclure articles hors-sujet pour leur rubrique
                if (!isArticleRelevant(a)) return;
                allArticles.push(a);
            });
        });

        // Curation qualitative : sélectionner 12 articles de qualité, répartis entre rubriques
        var curated = curateArticles(allArticles, 12);

        // Générer le HTML
        ln.innerHTML = curated.map(function(n) {
            var rubriqueAttr = n.rubrique || '';
            // Normaliser le label de rubrique
            var label = normalizeRubriqueLabel(rubriqueAttr, n.rubrique_label);
            var rubriqueTag = label
                ? '<span class="rubrique-badge" data-rubrique="' + rubriqueAttr + '">' + label + '</span>'
                : '';

            var hasThumb = n.image ? ' has-thumb' : '';
            var thumbHTML = n.image
                ? '<img src="' + n.image + '" alt="" class="news-list-thumb" loading="lazy" onerror="this.parentElement.classList.remove(\'has-thumb\');this.remove()">'
                : '';

            // Titre tronqué si trop long
            var displayTitle = truncateTitle(n.title || '', MAX_TITLE_LEN);

            // Résumé : masquer si N/A, redondant ou vide
            var desc = n.description || '';
            if (isDescriptionEmpty(desc)) desc = '';
            if (desc && isSummaryRedundant(n.title || '', desc)) desc = '';
            if (desc.length > 150) desc = desc.slice(0, 147) + '...';
            var summaryHTML = desc
                ? '<p class="news-list-summary">' + desc + '</p>'
                : '';

            return '<article class="news-list-item' + hasThumb + '" data-rubrique="' + rubriqueAttr + '">' +
                thumbHTML +
                '<div class="news-list-body">' +
                    '<div class="news-list-source">' +
                        '<a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer" class="source-name">' + (n.source || '') + '</a>' +
                        '<time class="news-time">' + (n.time || '') + '</time>' +
                        rubriqueTag +
                    '</div>' +
                    '<h3><a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer">' + displayTitle + '</a></h3>' +
                    summaryHTML +
                '</div>' +
            '</article>';
        }).join('');
    }

    /**
     * Analyses Inflexion statiques affichées sur la homepage
     */
    var INFLEXION_ANALYSES = [
        {
            titre: 'Droits de douane Trump sur le Groenland : quand la géopolitique efface 1 200 milliards de Wall Street en une séance',
            resume: 'Le président américain a relancé la guerre commerciale contre l\'UE en conditionnant la levée de droits de douane au soutien européen sur le Groenland. S&P 500 −2,1 %, VIX au-dessus de 20.',
            url: 'analyse-droits-douane-trump-groenland.html',
            date: '4 fév. 2026',
            categorie: 'geopolitique',
            gradient: 'linear-gradient(135deg, #064E3B 0%, #059669 100%)',
            icon: '',
            label: 'Geopolitique'
        },
        {
            titre: 'Or à 5 100 $, Bitcoin à 73 000 $ : la grande divergence des valeurs refuges',
            resume: 'L\'or pulvérise ses records (+64 % YTD) pendant que le bitcoin plonge (−40 % depuis octobre). Corrélation or-BTC tombée à zéro. Le narratif du « digital gold » est mort.',
            url: 'analyse-or-bitcoin-divergence.html',
            date: '3 fév. 2026',
            categorie: 'macro',
            gradient: 'linear-gradient(135deg, #052E16 0%, #10b981 100%)',
            icon: '',
            label: 'Macro'
        },
        {
            titre: 'L\'IA, dernier rempart des marchés face au chaos géopolitique',
            resume: 'Nvidia : 57 Mds $ de revenus trimestriels, backlog de 500 Mds $, architecture Vera Rubin. Mais la concentration des Mag 7 (30 % du S&P 500) est un risque systémique.',
            url: 'analyse-ia-rempart-marches.html',
            date: '1er fév. 2026',
            categorie: 'sectorielle',
            gradient: 'linear-gradient(135deg, #065F46 0%, #34D399 100%)',
            icon: '',
            label: 'IA & Tech'
        },
        {
            titre: 'SpaceX + xAI : quand Musk crée le premier conglomérat IA-aérospatial à 1 250 milliards',
            resume: 'La plus grande fusion de l\'histoire crée une entité à 1 250 Mds $. Centres de données orbitaux, constellation de 1 million de satellites, IPO prévue mi-2026.',
            url: 'analysis.html',
            date: '5 fév. 2026',
            categorie: 'sectorielle',
            gradient: 'linear-gradient(135deg, #1E3A5F 0%, #3B82F6 100%)',
            icon: '',
            label: 'Strategie'
        },
        {
            titre: 'Stablecoins : la vraie allocation défensive en crypto (et pourquoi le « digital gold » est mort)',
            resume: '33 000 Mds $ de transactions en 2025, croissance de 50 %. Les stablecoins sont devenus le seul refuge dans un écosystème où tout baisse avec le BTC.',
            url: 'analysis.html',
            date: '5 fév. 2026',
            categorie: 'crypto',
            gradient: 'linear-gradient(135deg, #312E81 0%, #7C3AED 100%)',
            icon: '',
            label: 'Crypto'
        },
        {
            titre: 'Or, argent, pétrole : le supercycle des matières premières face à la dédollarisation',
            resume: 'Or à 5 100 $, argent au-dessus de 100 $ pour la première fois. Les banques centrales achètent 60 tonnes/mois. L\'OPEC+ maintient ses coupes face à la demande chinoise incertaine.',
            url: 'analysis.html',
            date: '6 fév. 2026',
            categorie: 'commodities',
            gradient: 'linear-gradient(135deg, #78350F 0%, #F59E0B 100%)',
            icon: '',
            label: 'Commodities'
        }
    ];

    /**
     * Met à jour la section "Analyses" (#top-stories) avec les analyses Inflexion
     */
    function updateTopStories() {
        var ts = document.getElementById('top-stories');
        if (!ts) return;

        ts.innerHTML = '<div class="top-stories-grid">' + INFLEXION_ANALYSES.map(function(a) {
            var bannerHTML = '<div class="analysis-banner" style="background: ' + a.gradient + ';">' +
                '<span class="analysis-banner-icon">' + a.icon + '</span>' +
                '<span class="analysis-banner-label">' + a.label + '</span>' +
            '</div>';

            return '<article class="top-story">' +
                '<a href="' + a.url + '" class="top-story-link">' +
                    bannerHTML +
                    '<div class="story-body">' +
                        '<div class="story-meta">' +
                            '<span class="source-name">Inflexion</span>' +
                            '<time class="news-time">' + a.date + '</time>' +
                        '</div>' +
                        '<h3>' + a.titre + '</h3>' +
                        '<p class="story-summary">' + a.resume + '</p>' +
                    '</div>' +
                '</a>' +
            '</article>';
        }).join('') + '</div>';
    }

    // ─── Trending Coins Widget ──────────────────────────────

    /**
     * Affiche les cryptos tendance (CoinGecko trending)
     */
    function updateTrendingCoins() {
        if (!_cache.crypto?.trending?.length) return;

        var container = document.getElementById('trending-coins');
        if (!container) return;

        var coins = _cache.crypto.trending;
        container.innerHTML = coins.map(function(coin) {
            var rankBadge = coin.market_cap_rank
                ? '<span class="trending-rank">#' + coin.market_cap_rank + '</span>'
                : '';
            return '<div class="trending-coin">' +
                (coin.thumb ? '<img src="' + coin.thumb + '" alt="' + coin.symbol + '" class="trending-coin-icon" width="24" height="24" loading="lazy">' : '') +
                '<div class="trending-coin-info">' +
                    '<span class="trending-coin-name">' + coin.name + ' <small>' + coin.symbol.toUpperCase() + '</small></span>' +
                    rankBadge +
                '</div>' +
            '</div>';
        }).join('');

        // Ajouter les données globales enrichies
        var globalContainer = document.getElementById('crypto-global-stats');
        if (globalContainer && _cache.crypto.global) {
            var g = _cache.crypto.global;
            var statsHTML = '';
            if (g.eth_dominance) statsHTML += '<span class="global-stat">Dominance ETH : ' + g.eth_dominance.toFixed(1).replace('.', ',') + ' %</span>';
            if (g.markets) statsHTML += '<span class="global-stat">Marchés : ' + g.markets.toLocaleString('fr-FR') + '</span>';
            if (g.market_cap_change_24h != null) {
                var isUp = g.market_cap_change_24h >= 0;
                statsHTML += '<span class="global-stat ' + (isUp ? 'positive' : 'negative') + '">Capitalisation 24h : ' + (isUp ? '+' : '') + g.market_cap_change_24h.toFixed(2).replace('.', ',') + ' %</span>';
            }
            if (statsHTML) globalContainer.innerHTML = statsHTML;
        }
    }

    // ─── Calendrier Économique ──────────────────────────────

    /**
     * Affiche les prochains événements économiques (Finnhub)
     */
    function updateEconomicCalendar() {
        if (!_cache.markets?.economicCalendar?.length) {
            // Garder le calendrier masqué s'il n'y a pas d'événements
            return;
        }

        var container = document.getElementById('economic-calendar');
        if (!container) return;

        // Afficher la section calendrier uniquement quand il y a des événements
        var calendarSection = document.getElementById('calendar-section');
        if (calendarSection) calendarSection.style.display = '';

        var events = _cache.markets.economicCalendar.slice(0, 8);
        container.innerHTML = events.map(function(evt) {
            var impactClass = evt.impact === 'high' ? 'impact-high' : 'impact-medium';
            var impactDot = '<span class="cal-impact ' + impactClass + '"></span>';

            // Formater la date
            var dateStr = evt.date || '';
            var timeStr = evt.time || '';
            var dateDisplay = '';
            if (dateStr) {
                var d = new Date(dateStr);
                var months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
                dateDisplay = d.getDate() + ' ' + months[d.getMonth()];
                if (timeStr) dateDisplay += ' · ' + timeStr;
            }

            // Valeurs
            var valuesHTML = '';
            if (evt.estimate != null) valuesHTML += '<span class="cal-val">Est: ' + evt.estimate + (evt.unit || '') + '</span>';
            if (evt.previous != null) valuesHTML += '<span class="cal-val">Préc: ' + evt.previous + (evt.unit || '') + '</span>';
            if (evt.actual != null) valuesHTML += '<span class="cal-val cal-actual">Act: ' + evt.actual + (evt.unit || '') + '</span>';

            return '<div class="cal-event">' +
                '<div class="cal-event-header">' +
                    impactDot +
                    '<span class="cal-country">' + (evt.country || '') + '</span>' +
                    '<span class="cal-date">' + dateDisplay + '</span>' +
                '</div>' +
                '<div class="cal-event-name">' + (evt.event || '') + '</div>' +
                (valuesHTML ? '<div class="cal-values">' + valuesHTML + '</div>' : '') +
            '</div>';
        }).join('');
    }

    // ─── Mise à jour des données globales (pour la recherche) ─

    /**
     * Met à jour les variables globales de app.js avec les données live
     * pour que la recherche fonctionne avec les données fraîches
     */
    function syncGlobalData() {
        // Mettre à jour newsDatabase globale avec les données live
        // newsDatabase est un Array — on le remplace entièrement
        if (_cache.news?.categories && typeof window.newsDatabase !== 'undefined') {
            var catMapping = {
                geopolitics: 'geopolitics',
                markets: 'markets',
                crypto: 'crypto',
                commodities: 'commodities',
                ai_tech: 'markets' // Fusionner les news IA/tech dans marchés
            };

            var allLiveArticles = [];
            Object.keys(_cache.news.categories).forEach(function(cat) {
                var targetCat = catMapping[cat] || cat;
                var articles = _cache.news.categories[cat].map(function(a) {
                    return {
                        category: targetCat,
                        source: a.source || '',
                        url: a.url || '#',
                        title: a.title || '',
                        description: a.description || '',
                        tags: [targetCat],
                        time: a.time || '',
                        impact: 'high'
                    };
                });
                allLiveArticles = allLiveArticles.concat(articles);
            });
            if (allLiveArticles.length > 0) {
                window.newsDatabase = allLiveArticles;
            }
        }

        // Mettre à jour marketData globale
        if (_cache.markets?.quotes && typeof window.marketData !== 'undefined') {
            _cache.markets.quotes.forEach(function(q) {
                var entry = window.marketData.find(function(m) {
                    return m.name === q.name || m.name.includes(q.symbol);
                });
                if (entry) {
                    entry.price = q.price;
                    entry.change = q.change;
                }
            });
        }

        // Mettre à jour breakingNews à partir des titres live
        if (_cache.news?.categories && typeof window.breakingNews !== 'undefined') {
            var headlines = [];
            Object.values(_cache.news.categories).forEach(function(articles) {
                articles.slice(0, 2).forEach(function(a) {
                    if (a.title) headlines.push(a.title + ' (' + (a.source || 'Inflexion') + ')');
                });
            });
            if (headlines.length > 0) {
                window.breakingNews = headlines.slice(0, 10);
            }
        }
    }

    /**
     * Met à jour le bloc « tendance » sur les pages catégorie (#category-trend)
     * avec un résumé des derniers titres live de la rubrique
     */
    function updateCategoryTrend() {
        if (!_cache.news?.categories) return;

        var trendEl = document.getElementById('category-trend');
        if (!trendEl) return;

        // Détecter la catégorie de la page courante
        var pageHeader = document.querySelector('[data-category]');
        if (!pageHeader) return;
        var pageCat = pageHeader.getAttribute('data-category');

        // Mapping catégorie page → catégorie JSON (les clés dans news.json sont en anglais)
        var catMap = {
            geopolitics: 'geopolitics',
            markets: 'markets',
            crypto: 'crypto',
            commodities: 'commodities',
            etf: 'markets'
        };

        var newsCat = catMap[pageCat];
        if (!newsCat || !_cache.news.categories[newsCat]) return;

        var articles = _cache.news.categories[newsCat].filter(function(a) {
            return !(a.lang === 'en' && !a.translated) && a.title && a.title.length >= 5;
        }).slice(0, 6);
        if (articles.length === 0) return;

        // Construire les items du ticker
        var items = articles.map(function(a) {
            var title = truncateTitle(a.title || '', 80);
            return '<a class="ticker-item" href="' + (a.url || '#') + '" target="_blank" rel="noopener noreferrer">' +
                '<span class="ticker-source">' + (a.source || '') + '</span>' +
                '<span class="ticker-headline">' + title + '</span>' +
            '</a>' +
            '<span class="ticker-sep">\u2022</span>';
        }).join('');

        // Dupliquer le contenu pour boucle infinie CSS
        trendEl.innerHTML = '<div class="ticker-wrapper">' +
            '<div class="ticker-track">' +
                items + items +
            '</div>' +
        '</div>';
    }

    /**
     * Remplace un placeholder "Chargement..." par un message fallback
     */
    function showFallback(elementId, message) {
        var el = document.getElementById(elementId);
        if (!el) return;
        // Ne remplacer que s'il contient encore un placeholder
        var placeholder = el.querySelector('[class*="placeholder"], .loading');
        if (placeholder || el.textContent.includes('Chargement')) {
            el.innerHTML = '<p class="widget-fallback">' + (message || 'Données non disponibles') + '</p>';
        }
    }

    /**
     * Masque les sections sidebar vides et affiche un fallback pour les widgets sans données
     */
    function handleEmptyWidgets() {
        var widgetChecks = [
            { data: _cache.crypto?.trending?.length, el: 'trending-coins', section: 'trending-section', msg: 'Aucune tendance disponible' },
            { data: _cache.alphaVantage?.forex?.length, el: 'forex-rates', section: 'forex-section', msg: 'Taux indisponibles' },
            { data: _cache.alphaVantage?.sectors?.length, el: 'sector-performance', section: 'sectors-section', msg: 'Données sectorielles indisponibles' },
            { data: _cache.alphaVantage?.topMovers, el: 'top-movers', section: 'movers-section', msg: 'Données indisponibles' },
            { data: _cache.defi?.topProtocols?.length, el: 'defi-protocols', section: 'defi-section', msg: 'Protocoles indisponibles' },
            { data: _cache.defi?.topYields?.length, el: 'defi-yields', section: 'yields-section', msg: 'Rendements indisponibles' },
            { data: _cache.macro?.indicators?.length, el: 'macro-indicators', section: 'macro-section', msg: 'Indicateurs indisponibles' },
            { data: _cache.fearGreed?.current, el: null, section: 'fng-section', msg: null },
            { data: _cache.messari?.assets?.length, el: 'messari-widget', section: 'messari-section', msg: 'Données crypto avancées indisponibles' },
            { data: _cache.markets?.economicCalendar?.length, el: 'economic-calendar', section: 'calendar-section', msg: 'Calendrier indisponible' }
        ];

        widgetChecks.forEach(function(check) {
            if (!check.data) {
                // Retirer la section vide du DOM au lieu de simplement la cacher
                var section = document.getElementById(check.section);
                if (section) {
                    section.remove();
                }
            }
        });

        // Masquer "Article du jour" si pas d'article
        if (!_cache.articleDuJour?.titre) {
            var articleSection = document.getElementById('article-du-jour-section');
            if (articleSection) articleSection.classList.add('section-empty');
        }
    }

    // ─── Pages catégorie (#page-news) ──────────────────────────

    /**
     * Peuple la grille d'articles sur les pages catégorie (geopolitics.html, markets.html, etc.)
     * Utilise les données live de news.json pour remplacer le contenu statique
     */
    // Nombre initial d'articles affichés par page catégorie
    var CATEGORY_PAGE_INITIAL = 12;

    // Normalisation des labels de rubrique (accents + casse correcte)
    var RUBRIQUE_LABELS = {
        'geopolitique': 'G\u00e9opolitique',
        'marches': 'March\u00e9s',
        'crypto': 'Crypto',
        'matieres_premieres': 'Mati\u00e8res Premi\u00e8res',
        'ai_tech': 'IA & Tech'
    };

    function normalizeRubriqueLabel(rubrique, rawLabel) {
        return RUBRIQUE_LABELS[rubrique] || rawLabel || '';
    }

    /**
     * Vérifie si une description est vide ou sans valeur affichable
     */
    function isDescriptionEmpty(desc) {
        if (!desc) return true;
        var trimmed = desc.trim();
        if (trimmed.length === 0) return true;
        // Filtrer "N/A", "n/a", "NA", "undefined", etc.
        if (/^(N\/?A|n\/?a|NA|undefined|null|-)$/i.test(trimmed)) return true;
        // Filtrer les descriptions trop courtes pour être utiles
        if (trimmed.length < 15) return true;
        return false;
    }

    // ─── Sous-catégories marchés ──────────────────────────

    var MARKETS_SUBCATEGORIES = [
        {
            key: 'actions_resultats',
            label: 'Actions & R\u00e9sultats',
            keywords: [
                'bpa', 'bénéfice', 'benefice', 'dividende', 'résultats q', 'resultats q',
                'résultats trimestriel', 'resultats trimestriel', 'earnings',
                'chiffre d\'affaires', 'relèvement', 'relevement', 'abaissement',
                'note d\'analyste', 'objectif de cours', 'rachat d\'actions',
                'introduction en bourse', 'ipo', 'profit', 'perte nette',
                'marge opérationnelle', 'marge operationnelle', 'prévisions',
                'previsions', 'guidance', 'buyback', 'action', 'capitalisation',
                'publication des résultats', 'publication des resultats',
                'surperformance', 'sous-performance', 'consensus', 'analyste',
                'recommandation', 'upgrade', 'downgrade', 'quarterly',
                'trimestriel', 'annuel', 'semestriel', 'revenue'
            ]
        },
        {
            key: 'geopolitique_marches',
            label: 'G\u00e9opolitique & March\u00e9s',
            keywords: [
                'trump', 'sanctions', 'tarifs', 'tarif douanier', 'droits de douane',
                'guerre commerciale', 'embargo', 'conflit', 'géopolitique',
                'geopolitique', 'otan', 'nato', 'ukraine', 'russie', 'chine',
                'taiwan', 'iran', 'corée du nord', 'coree du nord', 'pétrole',
                'petrole', 'opep', 'opec', 'sanctions économiques',
                'sanctions economiques', 'tensions', 'souveraineté',
                'souverainete', 'protectionnisme', 'relocalisation',
                'nearshoring', 'friendshoring', 'découplage', 'decouplage',
                'sécurité nationale', 'securite nationale', 'exportation',
                'importation', 'blocus', 'représailles', 'represailles'
            ]
        },
        {
            key: 'finance_personnelle',
            label: 'Finance personnelle',
            keywords: [
                'épargne', 'epargne', 'immobilier', 'retraite', 'assurance vie',
                'livret a', 'pel', 'investisseur particulier', 'patrimoine',
                'placement', 'per', 'pea', 'portefeuille personnel',
                'investissement personnel', 'finances personnelles',
                'budget', 'impôt', 'impot', 'fiscalité', 'fiscalite',
                'succession', 'donation', 'scpi', 'crédit immobilier',
                'credit immobilier', 'prêt', 'pret', 'taux d\'emprunt',
                'stratégie personnelle', 'strategie personnelle',
                'diversification', 'gestion de patrimoine', 'défiscalisation',
                'defiscalisation', 'héritage', 'heritage'
            ]
        },
        {
            key: 'industrie_secteurs',
            label: 'Industrie & Secteurs',
            keywords: [
                'aéronautique', 'aeronautique', 'défense', 'defense',
                'automobile', 'pharma', 'pharmaceutique', 'biotech',
                'luxe', 'retail', 'distribution', 'énergie', 'energie',
                'renouvelable', 'nucléaire', 'nucleaire', 'semi-conducteur',
                'chip', 'puces', 'semiconducteur', 'cloud', 'saas',
                'télécoms', 'telecoms', 'transport', 'logistique',
                'agroalimentaire', 'agri', 'construction', 'btp',
                'immobilier commercial', 'hôtellerie', 'hotellerie',
                'tourisme', 'compagnie aérienne', 'compagnie aerienne',
                'sidérurgie', 'siderurgie', 'chimie', 'minière', 'miniere',
                'secteur', 'industrie', 'branche', 'filière', 'filiere',
                'nvidia', 'apple', 'microsoft', 'tesla', 'google',
                'amazon', 'meta', 'boeing', 'airbus', 'lvmh'
            ]
        },
        {
            key: 'macro_conjoncture',
            label: 'Macro & Conjoncture',
            keywords: [] // Catégorie par défaut — pas besoin de mots-clés
        }
    ];

    var MARKETS_SUBCAT_VISIBLE = 6;

    /**
     * Classe un article dans une sous-catégorie marchés
     * en analysant son titre et sa description via mots-clés
     */
    function classifyMarketArticle(article) {
        var text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();

        // Tester chaque sous-catégorie sauf la dernière (défaut)
        for (var i = 0; i < MARKETS_SUBCATEGORIES.length - 1; i++) {
            var subcat = MARKETS_SUBCATEGORIES[i];
            for (var j = 0; j < subcat.keywords.length; j++) {
                if (text.indexOf(subcat.keywords[j]) !== -1) {
                    return subcat.key;
                }
            }
        }

        // Par défaut : Macro & Conjoncture
        return 'macro_conjoncture';
    }

    /**
     * Rend les sous-catégories marchés en sections séparées
     */
    /**
     * Rend un article en carte vedette (featured card) pleine largeur
     */
    function renderFeaturedCard(n) {
        var label = normalizeRubriqueLabel(n.rubrique, n.rubrique_label);
        var rubriqueTag = label
            ? '<span class="rubrique-badge" data-rubrique="' + (n.rubrique || '') + '">' + label + '</span>'
            : '';

        var hasImage = !!n.image;
        var imgHTML = hasImage
            ? '<div class="featured-image"><img src="' + n.image + '" alt="" loading="lazy" onerror="this.parentElement.classList.add(\'no-image\')"></div>'
            : '<div class="featured-image no-image"></div>';

        var displayTitle = truncateTitle(n.title || '', 120);

        var desc = n.description || '';
        if (isDescriptionEmpty(desc)) desc = '';
        if (desc && isSummaryRedundant(n.title || '', desc)) desc = '';
        if (desc.length > 250) desc = desc.slice(0, 247) + '...';
        var excerptHTML = desc
            ? '<p class="featured-excerpt">' + desc + '</p>'
            : '';

        return '<article class="top-story--featured">' +
            imgHTML +
            '<div class="featured-content">' +
                '<div class="news-list-source">' +
                    '<a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer" class="source-name">' + (n.source || '') + '</a>' +
                    '<time class="news-time">' + (n.time || '') + '</time>' +
                    rubriqueTag +
                '</div>' +
                '<h3 class="featured-title"><a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer">' + displayTitle + '</a></h3>' +
                excerptHTML +
            '</div>' +
        '</article>';
    }

    /**
     * Détermine si une source est tier3 (basse qualité / agrégateur)
     */
    function isSourceTier3(source) {
        var src = (source || '').trim();
        // Si la source est explicitement tier3 dans SOURCE_TIERS
        if (SOURCE_TIERS[src] === 3) return true;
        // Sources connues comme agrégateurs de brèves (TheFly, etc.)
        var lowSrc = src.toLowerCase();
        if (/thefly|fly\.com|thestreet|benzinga|tipranks/i.test(lowSrc)) return true;
        return false;
    }

    function renderMarketsSubcategories(articles) {
        // Séparer articles principaux et brèves (tier3)
        var mainArticles = [];
        var flashArticles = [];
        articles.forEach(function(article) {
            if (isSourceTier3(article.source)) {
                flashArticles.push(article);
            } else {
                mainArticles.push(article);
            }
        });

        // Classer les articles principaux en sous-catégories
        var buckets = {};
        MARKETS_SUBCATEGORIES.forEach(function(sc) { buckets[sc.key] = []; });

        mainArticles.forEach(function(article) {
            var key = classifyMarketArticle(article);
            buckets[key].push(article);
        });

        var html = '';
        MARKETS_SUBCATEGORIES.forEach(function(sc) {
            var items = buckets[sc.key];
            if (items.length === 0) return;

            html += '<section class="markets-subcategory" data-subcat="' + sc.key + '">';
            html += '<h3 class="markets-subcat-title">' + sc.label + '</h3>';

            // Premier article en carte vedette (pleine largeur)
            var featured = items[0];
            html += renderFeaturedCard(featured);

            // Articles suivants dans la grille classique
            var gridItems = items.slice(1, MARKETS_SUBCAT_VISIBLE);
            if (gridItems.length > 0) {
                html += '<div class="news-grid">';
                html += renderCategoryArticles(gridItems);
                html += '</div>';
            }

            var hasMore = items.length > MARKETS_SUBCAT_VISIBLE;
            if (hasMore) {
                html += '<div class="news-grid markets-subcat-hidden" data-subcat-hidden="' + sc.key + '" style="display:none;">';
                html += renderCategoryArticles(items.slice(MARKETS_SUBCAT_VISIBLE));
                html += '</div>';
                html += '<button class="markets-subcat-toggle" data-subcat-toggle="' + sc.key + '">';
                html += 'Voir tout (' + items.length + ') \u2192';
                html += '</button>';
            }

            html += '</section>';
        });

        // Section "Flash marchés" pour les brèves tier3
        if (flashArticles.length > 0) {
            var flashVisible = flashArticles.slice(0, 8);
            html += '<section class="markets-flash-section">';
            html += '<h3 class="markets-flash-title"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Flash march\u00e9s</h3>';
            html += '<ul class="flash-list">';
            flashVisible.forEach(function(n) {
                var displayTitle = truncateTitle(n.title || '', 100);
                html += '<li class="flash-item">';
                html += '<span class="flash-source">' + (n.source || '') + '</span>';
                html += '<a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer" class="flash-headline">' + displayTitle + '</a>';
                html += '<time class="flash-time">' + (n.time || '') + '</time>';
                html += '</li>';
            });
            html += '</ul>';
            if (flashArticles.length > 8) {
                html += '<p class="flash-more">' + (flashArticles.length - 8) + ' autres br\u00e8ves non affich\u00e9es</p>';
            }
            html += '</section>';
        }

        return html;
    }

    /**
     * Attache les event listeners des boutons "Voir tout" des sous-catégories
     */
    function initSubcatToggles(container) {
        var toggles = container.querySelectorAll('.markets-subcat-toggle');
        toggles.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var key = btn.getAttribute('data-subcat-toggle');
                var hidden = container.querySelector('[data-subcat-hidden="' + key + '"]');
                if (!hidden) return;

                if (hidden.style.display === 'none') {
                    hidden.style.display = '';
                    btn.textContent = 'R\u00e9duire \u2190';
                } else {
                    hidden.style.display = 'none';
                    var section = btn.closest('.markets-subcategory');
                    var total = (section.querySelectorAll('.top-story').length);
                    btn.textContent = 'Voir tout (' + total + ') \u2192';
                }
            });
        });
    }

    function updateCategoryPageNews() {
        if (!_cache.news?.categories) return;

        var pageNews = document.getElementById('page-news');
        if (!pageNews) return;

        // Détecter la catégorie depuis le data-attribute de la page
        var pageHeader = document.querySelector('[data-category]');
        if (!pageHeader) return;
        var pageCat = pageHeader.getAttribute('data-category');

        // Mapping catégorie page → catégorie(s) dans news.json
        var catMap = {
            geopolitics: ['geopolitics'],
            markets: ['markets'],
            crypto: ['crypto'],
            commodities: ['commodities'],
            etf: ['markets', 'ai_tech'] // ETFs couvrent marchés + tech
        };

        var targetCats = catMap[pageCat];
        if (!targetCats) return;

        // Collecter les articles des catégories correspondantes (FR uniquement, pertinents)
        var articles = [];
        targetCats.forEach(function(cat) {
            var catArticles = _cache.news.categories[cat] || [];
            catArticles.forEach(function(a) {
                // Exclure articles EN non traduits
                if (a.lang === 'en' && !a.translated) return;
                // Exclure articles sans titre
                if (!a.title || a.title.length < 5) return;
                // Exclure articles hors-sujet pour leur rubrique
                if (!isArticleRelevant(a)) return;
                articles.push(a);
            });
        });

        // Trier par date (plus récent d'abord)
        articles.sort(function(a, b) {
            return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
        });

        if (articles.length === 0) {
            pageNews.innerHTML = '<p class="empty-state">Aucun article disponible dans cette rubrique pour le moment.</p>';
            return;
        }

        // Mettre à jour le compteur dans l'onglet actif
        updateTabCounts();

        // ─── Mode sous-catégories pour la page Marchés ───
        if (pageCat === 'markets') {
            pageNews.innerHTML = renderMarketsSubcategories(articles);
            initSubcatToggles(pageNews);
            return;
        }

        // ─── Mode classique pour les autres pages ───
        pageNews._allArticles = articles;
        var totalCount = articles.length;

        // Afficher les premiers articles seulement
        var visibleArticles = articles.slice(0, CATEGORY_PAGE_INITIAL);

        // Générer le HTML des articles
        pageNews.innerHTML = renderCategoryArticles(visibleArticles);

        // Ajouter le bouton "Voir plus" si nécessaire
        if (totalCount > CATEGORY_PAGE_INITIAL) {
            var remaining = totalCount - CATEGORY_PAGE_INITIAL;
            var loadMoreHTML = '<div class="load-more-container">' +
                '<button class="load-more-btn" id="category-load-more">' +
                    'Voir plus d\u2019articles (' + remaining + ' restants)' +
                '</button></div>';
            pageNews.insertAdjacentHTML('afterend', loadMoreHTML);

            var loadMoreBtn = document.getElementById('category-load-more');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', function() {
                    var allCards = renderCategoryArticles(articles);
                    pageNews.innerHTML = allCards;
                    var container = loadMoreBtn.parentElement;
                    if (container) container.remove();
                });
            }
        }
    }

    function renderCategoryArticles(articles) {
        return articles.map(function(n) {
            // Normaliser le label de rubrique
            var label = normalizeRubriqueLabel(n.rubrique, n.rubrique_label);
            var rubriqueTag = label
                ? '<span class="rubrique-badge" data-rubrique="' + (n.rubrique || '') + '">' + label + '</span>'
                : '';

            var hasImage = !!n.image;
            var imgHTML = hasImage
                ? '<img src="' + n.image + '" alt="" class="story-image" loading="lazy" onerror="this.parentElement.classList.add(\'no-image\')">'
                : '';

            // Titre tronqué si trop long
            var displayTitle = truncateTitle(n.title || '', MAX_TITLE_LEN);

            // Résumé : masquer si N/A, redondant ou vide
            var desc = n.description || '';
            if (isDescriptionEmpty(desc)) desc = '';
            if (desc && isSummaryRedundant(n.title || '', desc)) desc = '';
            if (desc.length > 150) desc = desc.slice(0, 147) + '...';
            var excerptHTML = desc
                ? '<p class="story-excerpt">' + desc + '</p>'
                : '';

            return '<article class="top-story' + (hasImage ? '' : ' no-image') + '" data-rubrique="' + (n.rubrique || '') + '">' +
                imgHTML +
                '<div class="story-content">' +
                    '<div class="news-list-source">' +
                        '<a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer" class="source-name">' + (n.source || '') + '</a>' +
                        '<time class="news-time">' + (n.time || '') + '</time>' +
                        rubriqueTag +
                    '</div>' +
                    '<h3 class="story-title"><a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer">' + displayTitle + '</a></h3>' +
                    excerptHTML +
                '</div>' +
            '</article>';
        }).join('');
    }

    /**
     * Met à jour les compteurs d'articles dans les onglets de la page marchés
     */
    function updateTabCounts() {
        if (!_cache.news?.categories) return;
        var tabs = document.querySelectorAll('#markets-tabs .page-tab');
        if (!tabs.length) return;

        var countMap = {
            marches: 0,
            etf: 0,
            commodities: 0
        };

        // Compter les articles par onglet
        var marketArticles = (_cache.news.categories['markets'] || []).filter(function(a) {
            return !(a.lang === 'en' && !a.translated) && a.title && a.title.length >= 5 && isArticleRelevant(a);
        });
        countMap.marches = marketArticles.length;

        var etfArticles = ['markets', 'ai_tech'].reduce(function(acc, cat) {
            return acc.concat((_cache.news.categories[cat] || []).filter(function(a) {
                return !(a.lang === 'en' && !a.translated) && a.title && a.title.length >= 5 && isArticleRelevant(a);
            }));
        }, []);
        countMap.etf = etfArticles.length;

        var commArticles = ['commodities', 'matieres_premieres'].reduce(function(acc, cat) {
            return acc.concat((_cache.news.categories[cat] || []).filter(function(a) {
                return !(a.lang === 'en' && !a.translated) && a.title && a.title.length >= 5 && isArticleRelevant(a);
            }));
        }, []);
        countMap.commodities = commArticles.length;

        tabs.forEach(function(tab) {
            var tabKey = tab.dataset.tab;
            var count = countMap[tabKey];
            if (count !== undefined && count > 0) {
                // Supprimer un ancien compteur s'il existe
                var existing = tab.querySelector('.tab-count');
                if (existing) existing.remove();
                tab.insertAdjacentHTML('beforeend', ' <span class="tab-count">' + count + '</span>');
            }
        });
    }

    /**
     * Applique toutes les mises à jour au DOM
     */
    // ─── Forex & Secteurs (Alpha Vantage) ────────────────────
    function updateForexSectors() {
        const av = _cache.alphaVantage;
        if (!av) return;

        // Forex rates
        const forexEl = document.getElementById('forex-rates');
        if (forexEl && av.forex && av.forex.length > 0) {
            forexEl.innerHTML = av.forex.map(fx => `
                <div class="forex-pair">
                    <span class="forex-pair-name">${fx.pair}</span>
                    <span class="forex-pair-rate">${fx.rate.toFixed(4)}</span>
                </div>
            `).join('');
        }

        // Sector Performance
        const sectorEl = document.getElementById('sector-performance');
        if (sectorEl && av.sectors && av.sectors.length > 0) {
            sectorEl.innerHTML = av.sectors.map(s => {
                const pct = s.realtime;
                const cls = pct >= 0 ? 'up' : 'down';
                const sign = pct >= 0 ? '+' : '';
                return `
                    <div class="sector-bar">
                        <span class="sector-name">${s.name}</span>
                        <div class="sector-bar-track">
                            <div class="sector-bar-fill ${cls}" style="width:${Math.min(Math.abs(pct) * 10, 100)}%"></div>
                        </div>
                        <span class="sector-pct ${cls}">${sign}${pct.toFixed(2)}%</span>
                    </div>
                `;
            }).join('');
        }

        // Top Movers
        const moversEl = document.getElementById('top-movers');
        if (moversEl && av.topMovers) {
            const { gainers, losers } = av.topMovers;
            let html = '<div class="movers-columns">';
            html += '<div class="movers-col"><h4 class="movers-col-title gainer-title">▲ Hausse</h4>';
            html += (gainers || []).map(g => `
                <div class="mover-item gainer">
                    <span class="mover-ticker">${g.ticker}</span>
                    <span class="mover-pct">+${g.changePct.toFixed(1)}%</span>
                </div>
            `).join('');
            html += '</div>';
            html += '<div class="movers-col"><h4 class="movers-col-title loser-title">▼ Baisse</h4>';
            html += (losers || []).map(l => `
                <div class="mover-item loser">
                    <span class="mover-ticker">${l.ticker}</span>
                    <span class="mover-pct">${l.changePct.toFixed(1)}%</span>
                </div>
            `).join('');
            html += '</div></div>';
            moversEl.innerHTML = html;
        }
    }

    // ─── DeFi (DefiLlama) ──────────────────────────────────
    function updateDefiSection() {
        const defi = _cache.defi;
        if (!defi) return;

        // DeFi Summary
        const summaryEl = document.getElementById('defi-summary');
        if (summaryEl && defi.summary) {
            summaryEl.innerHTML = `
                <div class="defi-stat-row">
                    <span class="defi-stat-chip" title="Valeur totale verrouillée">TVL totale <strong>${defi.summary.total_tvl_formatted}</strong></span>
                    <span class="defi-stat-chip">${defi.summary.total_protocols} protocoles</span>
                    <span class="defi-stat-chip">${defi.summary.total_chains} chaînes</span>
                </div>
            `;
        }

        // Top Protocols
        const protocolsEl = document.getElementById('defi-protocols');
        if (protocolsEl && defi.topProtocols && defi.topProtocols.length > 0) {
            protocolsEl.innerHTML = defi.topProtocols.slice(0, 10).map((p, i) => {
                const tvlStr = p.tvl > 1e9
                    ? `${(p.tvl / 1e9).toFixed(2).replace('.', ',')} Mrd $`
                    : `${(p.tvl / 1e6).toFixed(0)} M $`;
                const change1d = p.change_1d;
                const changeCls = change1d > 0 ? 'up' : change1d < 0 ? 'down' : '';
                const changeStr = change1d != null
                    ? `<span class="defi-proto-change ${changeCls}">${change1d > 0 ? '+' : ''}${change1d.toFixed(1).replace('.', ',')} %</span>`
                    : '';
                return `
                    <div class="defi-protocol-row">
                        <span class="defi-proto-rank">${i + 1}</span>
                        ${p.logo ? `<img src="${p.logo}" class="defi-proto-logo" alt="${p.name}" onerror="this.style.display='none'">` : '<span class="defi-proto-logo-placeholder"></span>'}
                        <div class="defi-proto-info">
                            <span class="defi-proto-name">${p.name}</span>
                            <span class="defi-proto-category">${translateDefiCategory(p.category || '')}</span>
                        </div>
                        <div class="defi-proto-tvl">
                            <span class="defi-proto-value">${tvlStr}</span>
                            ${changeStr}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Top Yields (stablecoins)
        const yieldsEl = document.getElementById('defi-yields');
        if (yieldsEl && defi.topYields && defi.topYields.length > 0) {
            yieldsEl.innerHTML = defi.topYields.slice(0, 8).map(y => {
                const tvlStr = y.tvl > 1e9
                    ? `${(y.tvl / 1e9).toFixed(1).replace('.', ',')} Mrd $`
                    : `${(y.tvl / 1e6).toFixed(0)} M $`;
                return `
                    <div class="yield-row">
                        <div class="yield-info">
                            <span class="yield-project">${y.project}</span>
                            <span class="yield-detail">${y.symbol} · ${y.chain}</span>
                        </div>
                        <div class="yield-data">
                            <span class="yield-apy">${y.apy.toFixed(2).replace('.', ',')} %</span>
                            <span class="yield-tvl">${tvlStr}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // ─── Sentiment Widget ──────────────────────────────────────

    /**
     * Affiche le widget de sentiment global
     */
    function updateSentimentWidget() {
        if (!_cache.sentiment?.global) return;

        var container = document.getElementById('sentiment-widget');
        if (!container) return;

        var s = _cache.sentiment;
        var global = s.global;
        var scoreColor = global.score > 0.2 ? '#16a34a' : global.score < -0.2 ? '#dc2626' : '#eab308';
        var arrow = global.score > 0 ? '↑' : global.score < 0 ? '↓' : '→';
        var tendanceLabel = {
            'haussier': 'Haussier', 'baissier': 'Baissier',
            'neutre': 'Neutre', 'mixte': 'Mixte'
        };

        // Mapping des noms de rubriques internes → labels français propres
        var rubriqueLabelMap = {
            'geopolitique': 'Géopolitique',
            'marches': 'Marchés',
            'crypto': 'Crypto',
            'matieres_premieres': 'Matières premières',
            'ai_tech': 'IA & Tech',
            'commodities': 'Matières premières',
            'geopolitics': 'Géopolitique',
            'markets': 'Marchés'
        };

        var categoriesHTML = '';
        if (s.categories) {
            categoriesHTML = '<div class="sentiment-categories">' +
                Object.entries(s.categories).map(function(entry) {
                    var rubrique = entry[0];
                    var data = entry[1];
                    var catColor = data.score > 0.2 ? '#16a34a' : data.score < -0.2 ? '#dc2626' : '#eab308';
                    var displayName = rubriqueLabelMap[rubrique] || rubrique;
                    return '<div class="sentiment-cat">' +
                        '<span class="sentiment-cat-name">' + displayName + '</span>' +
                        '<span class="sentiment-cat-score" style="color:' + catColor + '">' +
                        (data.score > 0 ? '+' : '') + data.score.toFixed(1).replace('.', ',') +
                        '</span></div>';
                }).join('') + '</div>';
        }

        container.innerHTML =
            '<div class="sentiment-header">' +
                '<span class="sentiment-score" style="color:' + scoreColor + '">' +
                    arrow + ' ' + (global.score > 0 ? '+' : '') + global.score.toFixed(2).replace('.', ',') +
                '</span>' +
                '<span class="sentiment-label">' + (tendanceLabel[global.tendance] || global.tendance) + '</span>' +
            '</div>' +
            '<p class="sentiment-resume">' + (global.resume || '') + '</p>' +
            categoriesHTML;

        addFreshnessIndicator(container, s.updated);
    }

    // ─── Alertes Widget ──────────────────────────────────────

    /**
     * Affiche les alertes de marché actives
     */
    function updateAlertsWidget() {
        if (!_cache.alerts?.alertes?.length) return;

        var container = document.getElementById('alerts-widget');
        if (!container) return;

        var alertes = _cache.alerts.alertes.slice(0, 5);
        container.innerHTML = alertes.map(function(a) {
            return '<div class="alert-item alert-' + (a.severite || 'info') + '">' +
                '<div class="alert-content">' +
                    '<strong class="alert-titre">' + (a.titre || '') + '</strong>' +
                    '<p class="alert-texte">' + (a.texte || '') + '</p>' +
                '</div>' +
            '</div>';
        }).join('');

        addFreshnessIndicator(container, _cache.alerts.updated);
    }

    // ─── Newsletter Section ──────────────────────────────────

    /**
     * Affiche la dernière newsletter hebdomadaire
     */
    function updateNewsletterSection() {
        if (!_cache.newsletter?.titre_semaine) return;

        var container = document.getElementById('newsletter-content');
        if (!container) return;

        var nl = _cache.newsletter;

        var faitsHTML = (nl.faits_marquants || []).map(function(f) {
            return '<li><strong>' + f.titre + '</strong> — ' + f.description + '</li>';
        }).join('');

        var editorialHTML = (nl.editorial || '')
            .replace(/## (.+)/g, '<h4>$1</h4>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        container.innerHTML =
            '<div class="newsletter-header">' +
                '<span class="newsletter-badge">Newsletter</span>' +
                '<span class="newsletter-semaine">' + (nl.semaine || '') + '</span>' +
            '</div>' +
            '<h3 class="newsletter-title">' + nl.titre_semaine + '</h3>' +
            (nl.sous_titre ? '<p class="newsletter-subtitle">' + nl.sous_titre + '</p>' : '') +
            '<div class="newsletter-editorial"><p>' + editorialHTML + '</p></div>' +
            (faitsHTML ? '<div class="newsletter-faits"><h4>Faits marquants</h4><ul>' + faitsHTML + '</ul></div>' : '') +
            (nl.perspectives ? '<div class="newsletter-perspectives"><h4>Perspectives</h4><p>' + nl.perspectives + '</p></div>' : '');

        // Afficher la section si masquée
        var section = document.getElementById('newsletter-section');
        if (section) section.classList.remove('section-empty');
    }

    // ─── Macro Analysis Widget ────────────────────────────────

    /**
     * Affiche l'analyse macroéconomique IA
     */
    function updateMacroAnalysisWidget() {
        if (!_cache.macroAnalysis?.titre) return;

        var container = document.getElementById('macro-analysis-widget');
        if (!container) return;

        var ma = _cache.macroAnalysis;
        var riskColor = ma.score_risque > 6 ? '#dc2626' : ma.score_risque > 3 ? '#eab308' : '#16a34a';

        var indicateursHTML = '';
        if (ma.indicateurs_cles?.length) {
            indicateursHTML = '<div class="macro-analysis-indicators">' +
                ma.indicateurs_cles.map(function(ind) {
                    var signalColor = ind.signal === 'haussier' ? '#16a34a' : ind.signal === 'baissier' ? '#dc2626' : '#eab308';
                    return '<div class="macro-ind">' +
                        '<span class="macro-ind-name">' + ind.nom + '</span>' +
                        '<span class="macro-ind-val" style="color:' + signalColor + '">' + ind.valeur + '</span>' +
                    '</div>';
                }).join('') + '</div>';
        }

        container.innerHTML =
            '<div class="macro-analysis-header">' +
                '<span class="macro-analysis-risk" style="color:' + riskColor + '">Risque ' + ma.score_risque + '/10</span>' +
                '<span class="macro-analysis-phase">' + (ma.phase_cycle || '') + '</span>' +
            '</div>' +
            '<h4 class="macro-analysis-title">' + ma.titre + '</h4>' +
            indicateursHTML +
            (ma.perspectives ? '<p class="macro-analysis-perspectives">' + ma.perspectives + '</p>' : '');

        addFreshnessIndicator(container, ma.updated);
    }

    // ─── Market Briefing Widget ───────────────────────────────

    /**
     * Affiche le briefing marché quotidien
     */
    function updateMarketBriefingWidget() {
        if (!_cache.marketBriefing?.titre) return;

        var container = document.getElementById('market-briefing-widget');
        if (!container) return;

        var mb = _cache.marketBriefing;
        var sentimentColor = mb.sentiment_global === 'haussier' ? '#16a34a' :
            mb.sentiment_global === 'baissier' ? '#dc2626' : '#eab308';

        var vigilanceHTML = '';
        if (mb.vigilance?.length) {
            vigilanceHTML = '<div class="briefing-vigilance">' +
                mb.vigilance.map(function(v) {
                    return '<span class="briefing-vigilance-item">' + v + '</span>';
                }).join('') + '</div>';
        }

        container.innerHTML =
            '<div class="briefing-header">' +
                '<span class="briefing-sentiment" style="color:' + sentimentColor + '">' +
                    (mb.sentiment_global || 'neutre') +
                '</span>' +
                '<span class="briefing-date">' + (mb.date || '') + '</span>' +
            '</div>' +
            '<h4 class="briefing-title">' + mb.titre + '</h4>' +
            '<p class="briefing-resume">' + (mb.resume_executif || '') + '</p>' +
            vigilanceHTML;

        addFreshnessIndicator(container, mb.updated);
    }

    // ─── Indices européens (Twelve Data) ──────────────────

    /**
     * Affiche les indices européens dans le widget dédié
     */
    function updateEuropeanMarketsWidget() {
        if (!_cache.europeanMarkets?.indices?.length) return;

        var container = document.getElementById('european-markets-widget');
        if (!container) return;

        var indices = _cache.europeanMarkets.indices;

        container.innerHTML =
            '<div class="euro-markets-header">' +
                '<h4>Indices Européens</h4>' +
                '<span class="euro-market-status">' +
                    (_cache.europeanMarkets.summary?.market_open ? 'Ouvert' : 'Fermé') +
                '</span>' +
            '</div>' +
            '<div class="euro-markets-grid">' +
            indices.map(function(idx) {
                var pct = formatPercent(idx.change_pct);
                return '<div class="euro-market-item">' +
                    '<span class="euro-market-flag">' + getFlagEmoji(idx.country) + '</span>' +
                    '<div class="euro-market-info">' +
                        '<span class="euro-market-name">' + idx.name + '</span>' +
                        '<span class="euro-market-price">' + (idx.price ? idx.price.toLocaleString('fr-FR', {minimumFractionDigits: 0, maximumFractionDigits: 0}) : 'N/A') + '</span>' +
                    '</div>' +
                    '<span class="euro-market-change" style="color:' + (pct.positive ? 'var(--green, #16a34a)' : 'var(--red, #dc2626)') + '">' + pct.text + '</span>' +
                '</div>';
            }).join('') +
            '</div>';

        addFreshnessIndicator(container, _cache.europeanMarkets.updated);
    }

    function getFlagEmoji(countryCode) {
        var flags = { FR: 'FR', DE: 'DE', GB: 'GB', EU: 'EU', ES: 'ES', IT: 'IT' };
        return flags[countryCode] || '--';
    }

    // ─── Données macro internationales (World Bank) ──────

    /**
     * Affiche les données macro internationales dans le widget
     */
    function updateWorldBankWidget() {
        if (!_cache.worldBank?.indicators?.length) return;

        var container = document.getElementById('world-bank-widget');
        if (!container) return;

        var indicators = _cache.worldBank.indicators;

        container.innerHTML =
            '<h4>Macro internationale</h4>' +
            indicators.map(function(ind) {
                if (!ind.data || ind.data.length === 0) return '';
                return '<div class="wb-indicator">' +
                    '<h5 class="wb-indicator-label">' + ind.label + '</h5>' +
                    '<div class="wb-indicator-grid">' +
                    ind.data.slice(0, 5).map(function(d) {
                        var displayVal = ind.id === 'NY.GDP.MKTP.CD'
                            ? formatUSD(d.value, 0)
                            : d.value.toFixed(1) + '%';
                        return '<div class="wb-country-item">' +
                            '<span class="wb-country-name">' + d.country_code + '</span>' +
                            '<span class="wb-country-value">' + displayVal + '</span>' +
                        '</div>';
                    }).join('') +
                    '<a href="country.html?indicator=' + encodeURIComponent(ind.id) + '" class="wb-country-item wb-more-link" title="Voir tous les pays">' +
                        '<span class="wb-country-name">Autre</span>' +
                        '<span class="wb-country-value wb-more-arrow">&rsaquo;</span>' +
                    '</a>' +
                    '</div>' +
                '</div>';
            }).join('');

        addFreshnessIndicator(container, _cache.worldBank.updated);
    }

    // ─── Crypto avancé (Messari) ─────────────────────────

    /**
     * Affiche les métriques crypto avancées dans le widget dédié
     */
    function updateMessariWidget() {
        if (!_cache.messari?.assets?.length) return;

        var container = document.getElementById('messari-widget');
        if (!container) return;

        var gm = _cache.messari.globalMetrics;
        var assets = _cache.messari.assets;

        var globalHTML = '';
        if (gm) {
            globalHTML = '<div class="messari-global">' +
                (gm.btc_dominance ? '<span>Dominance BTC : ' + gm.btc_dominance.toFixed(1).replace('.', ',') + ' %</span>' : '') +
                (gm.total_market_cap ? '<span>Capitalisation : ' + formatUSD(gm.total_market_cap, 0) + '</span>' : '') +
                (gm.total_volume_24h ? '<span>Volume 24h : ' + formatUSD(gm.total_volume_24h, 0) + '</span>' : '') +
            '</div>';
        }

        container.innerHTML =
            '<h4>Crypto avancé (Messari)</h4>' +
            globalHTML +
            '<div class="messari-assets">' +
            assets.slice(0, 10).map(function(a) {
                var pct = formatPercent(a.percent_change_24h);
                return '<div class="messari-asset-row">' +
                    '<span class="messari-symbol">' + (a.symbol || '') + '</span>' +
                    '<span class="messari-price">' + (a.price ? formatUSD(a.price) : 'N/A') + '</span>' +
                    '<span class="messari-dominance">' + (a.market_cap_dominance ? a.market_cap_dominance.toFixed(1).replace('.', ',') + ' %' : '') + '</span>' +
                    '<span class="messari-change" style="color:' + (pct.positive ? 'var(--green, #16a34a)' : 'var(--red, #dc2626)') + '">' + pct.text + '</span>' +
                '</div>';
            }).join('') +
            '</div>';

        addFreshnessIndicator(container, _cache.messari.updated);
    }

    // ─── Intégration NewsAPI dans le flux news ───────────

    /**
     * Fusionne les articles NewsAPI dans les news existantes
     */
    function mergeNewsAPIArticles() {
        if (!_cache.newsapi?.categories || !_cache.news?.categories) return;

        var categories = _cache.news.categories;
        var newsapiCats = _cache.newsapi.categories;

        var rubriqueMap = {
            geopolitics: { rubrique: 'geopolitique', rubrique_label: 'G\u00e9opolitique', rubrique_emoji: '' },
            markets:     { rubrique: 'marches', rubrique_label: 'March\u00e9s', rubrique_emoji: '' },
            crypto:      { rubrique: 'crypto', rubrique_label: 'Crypto', rubrique_emoji: '' },
            commodities: { rubrique: 'matieres_premieres', rubrique_label: 'Mati\u00e8res Premi\u00e8res', rubrique_emoji: '' },
            ai_tech:     { rubrique: 'ai_tech', rubrique_label: 'IA & Tech', rubrique_emoji: '' }
        };

        Object.keys(newsapiCats).forEach(function(cat) {
            if (!categories[cat]) return;
            var existing = new Set(categories[cat].map(function(a) {
                return a.title?.toLowerCase().replace(/\s+/g, ' ').trim();
            }));

            var meta = rubriqueMap[cat];
            newsapiCats[cat].forEach(function(a) {
                var key = a.title?.toLowerCase().replace(/\s+/g, ' ').trim();
                if (key && !existing.has(key)) {
                    if (meta) {
                        a.rubrique = meta.rubrique;
                        a.rubrique_label = meta.rubrique_label;
                        a.rubrique_emoji = meta.rubrique_emoji;
                    }
                    // Vérifier la pertinence avant d'ajouter
                    if (!isArticleRelevant(a)) return;
                    categories[cat].push(a);
                    existing.add(key);
                }
            });

            // Re-sort and limit
            categories[cat].sort(function(a, b) {
                return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
            });
            categories[cat] = categories[cat].slice(0, 40);
        });
    }

    // ─── Widget Interactivity (TACHE 3) ─────────────────────

    /**
     * IntersectionObserver pour animer les widgets au scroll
     */
    function initWidgetAnimations() {
        if (typeof IntersectionObserver === 'undefined') {
            // Fallback: make all widgets visible immediately
            document.querySelectorAll('.sidebar-card').forEach(function(card) {
                card.classList.add('widget-visible');
            });
            return;
        }

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('widget-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });

        document.querySelectorAll('.sidebar-card').forEach(function(card) {
            observer.observe(card);
        });

        // Also animate article-du-jour and main sections
        document.querySelectorAll('.article-du-jour-section, .section').forEach(function(section) {
            observer.observe(section);
        });
    }

    function updateDOM() {
        if (!_initialized || !_usingLiveData) return;

        console.log('[DataLoader] Mise à jour du DOM...');
        syncGlobalData();
        mergeNewsAPIArticles(); // Fusionner NewsAPI AVANT le rendu des news
        updateMarketSidebar();
        updateCryptoSection();
        updateTrendingCoins();
        updateMacroIndicators();
        updateFearGreedWidget();
        updateEconomicCalendar();
        updateForexSectors();
        updateDefiSection();
        updateGoldBitcoinChart();
        updateArticleDuJour();
        updateTopStories();
        updateCategoryTrend();
        updateCategoryPageNews();
        updateLatestNewsWithRubriques();
        updateSentimentWidget();
        updateAlertsWidget();
        updateNewsletterSection();
        updateMacroAnalysisWidget();
        updateMarketBriefingWidget();
        updateWorldBankWidget();
        updateMessariWidget();
        initRubriqueFilters();
        handleEmptyWidgets();
        initWidgetAnimations();
        startFreshnessRefresh();
        console.log('[DataLoader] ✓ DOM mis à jour');
    }

    /**
     * Auto-refresh des indicateurs de fraîcheur toutes les 60s
     */
    var _freshnessInterval = null;
    function startFreshnessRefresh() {
        if (_freshnessInterval) return; // déjà actif
        _freshnessInterval = setInterval(function() {
            document.querySelectorAll('.data-freshness').forEach(function(badge) {
                var container = badge.parentElement;
                if (!container) return;
                // Retrouver l'ISO depuis le data-attribute
                var iso = badge.getAttribute('data-updated');
                if (iso) {
                    addFreshnessIndicator(container, iso);
                }
            });
        }, 60000);
    }

    // ─── Lookup de prix par symbole (pour enrichir la watchlist) ──

    /**
     * Recherche le prix live d'un actif par symbole dans toutes les sources de données.
     * Utilisé par la watchlist pour afficher les données temps réel.
     *
     * @param {string} symbol - Symbole de l'actif (ex: BTC, AAPL, XAU)
     * @param {string} category - Catégorie de l'actif (crypto, stock, commodity, index)
     * @returns {Object|null} { price, change, source } ou null si introuvable
     */
    function getPriceForSymbol(symbol, category) {
        if (!_initialized) return null;
        var sym = (symbol || '').toUpperCase();

        // 1. Crypto — CoinGecko + Messari
        if (category === 'crypto' || !category) {
            var cryptoMap = {
                'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin',
                'SOL': 'solana', 'XRP': 'ripple', 'ADA': 'cardano',
                'DOGE': 'dogecoin', 'DOT': 'polkadot', 'AVAX': 'avalanche-2',
                'MATIC': 'matic-network', 'LINK': 'chainlink', 'UNI': 'uniswap',
                'ATOM': 'cosmos', 'LTC': 'litecoin', 'SHIB': 'shiba-inu'
            };
            if (_cache.crypto?.prices) {
                var cgId = cryptoMap[sym] || sym.toLowerCase();
                var coin = _cache.crypto.prices.find(function(c) {
                    return c.id === cgId || (c.symbol && c.symbol.toUpperCase() === sym);
                });
                if (coin) return { price: coin.price, change: coin.change_24h, source: 'CoinGecko' };
            }
            if (_cache.messari?.assets) {
                var mAsset = _cache.messari.assets.find(function(a) {
                    return a.symbol && a.symbol.toUpperCase() === sym;
                });
                if (mAsset) return { price: mAsset.price, change: mAsset.percent_change_24h, source: 'Messari' };
            }
            if (category === 'crypto') return null;
        }

        // 2. Actions / Indices US — Finnhub
        if (category === 'stock' || category === 'index' || !category) {
            if (_cache.markets?.quotes) {
                var quote = _cache.markets.quotes.find(function(q) {
                    return q.symbol === sym || q.name === sym;
                });
                if (quote) return { price: quote.price, change: quote.change, source: 'Finnhub' };
            }
            // Alpha Vantage top movers
            if (_cache.alphaVantage?.topMovers) {
                var allMovers = (_cache.alphaVantage.topMovers.gainers || [])
                    .concat(_cache.alphaVantage.topMovers.losers || []);
                var mover = allMovers.find(function(m) { return m.ticker === sym; });
                if (mover) return { price: mover.price, change: mover.changePct, source: 'Alpha Vantage' };
            }
        }

        // 3. Indices européens — Twelve Data
        if (category === 'index' || !category) {
            if (_cache.europeanMarkets?.indices) {
                var euIdx = _cache.europeanMarkets.indices.find(function(idx) {
                    return idx.symbol === sym || idx.name.toUpperCase().includes(sym);
                });
                if (euIdx) return { price: euIdx.price, change: euIdx.change_pct, source: 'Twelve Data' };
            }
        }

        // 4. Matières premières — Forex (Alpha Vantage) et or/pétrole dans marchés
        if (category === 'commodity' || !category) {
            if (_cache.alphaVantage?.forex) {
                var fxPair = _cache.alphaVantage.forex.find(function(fx) {
                    return fx.pair && fx.pair.includes(sym);
                });
                if (fxPair) return { price: fxPair.rate, change: null, source: 'Alpha Vantage' };
            }
            // Chercher dans les quotes marchés (GLD, USO, etc.)
            if (_cache.markets?.quotes) {
                var commQuote = _cache.markets.quotes.find(function(q) {
                    return q.symbol === sym;
                });
                if (commQuote) return { price: commQuote.price, change: commQuote.change, source: 'Finnhub' };
            }
        }

        return null;
    }

    /**
     * Recherche les articles d'actualité mentionnant un symbole ou son nom.
     * Utilisé pour les alertes croisées watchlist × événements.
     *
     * @param {string} symbol - Symbole de l'actif (ex: BTC, NVIDIA)
     * @param {string} label - Nom complet ou label de l'actif
     * @returns {Array} Articles correspondants (max 5)
     */
    function getNewsForSymbol(symbol, label) {
        if (!_initialized || !_cache.news?.categories) return [];

        var sym = (symbol || '').toUpperCase();
        var lbl = (label || '').toLowerCase();

        // Mots-clés de recherche étendus
        var keywords = [sym];
        if (lbl && lbl !== sym.toLowerCase()) keywords.push(lbl);

        // Mapping symboles → noms alternatifs pour meilleur matching
        var aliasMap = {
            'BTC': ['bitcoin', 'btc'],
            'ETH': ['ethereum', 'eth', 'ether'],
            'XAU': ['or', 'gold', 'xau'],
            'XAG': ['argent', 'silver'],
            'AAPL': ['apple'],
            'MSFT': ['microsoft'],
            'NVDA': ['nvidia'],
            'GOOG': ['google', 'alphabet'],
            'GOOGL': ['google', 'alphabet'],
            'AMZN': ['amazon'],
            'TSLA': ['tesla'],
            'META': ['meta', 'facebook'],
            'WTI': ['petrole', 'oil', 'wti', 'crude'],
            'USO': ['petrole', 'oil'],
            'GLD': ['or', 'gold'],
            'SPY': ['s&p 500', 's&p500'],
            'QQQ': ['nasdaq'],
            'SOL': ['solana'],
            'XRP': ['ripple', 'xrp'],
            'ADA': ['cardano'],
            'DOT': ['polkadot'],
            'AVAX': ['avalanche'],
            'LINK': ['chainlink'],
            'UNI': ['uniswap']
        };
        var aliases = aliasMap[sym] || [];
        keywords = keywords.concat(aliases);

        var results = [];
        var seen = new Set();

        Object.values(_cache.news.categories).forEach(function(articles) {
            articles.forEach(function(a) {
                if (seen.has(a.url)) return;
                var text = ((a.title || '') + ' ' + (a.description || '')).toLowerCase();
                var matched = keywords.some(function(kw) {
                    return text.includes(kw.toLowerCase());
                });
                if (matched) {
                    seen.add(a.url);
                    results.push(a);
                }
            });
        });

        // Trier par date récente et limiter
        results.sort(function(a, b) {
            return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
        });

        return results.slice(0, 5);
    }

    /**
     * Recherche les alertes IA qui mentionnent un symbole.
     *
     * @param {string} symbol - Symbole de l'actif
     * @returns {Array} Alertes correspondantes
     */
    function getAlertsForSymbol(symbol) {
        if (!_initialized || !_cache.alerts?.alertes) return [];
        var sym = (symbol || '').toUpperCase();
        return _cache.alerts.alertes.filter(function(a) {
            var text = ((a.titre || '') + ' ' + (a.texte || '')).toUpperCase();
            return text.includes(sym);
        });
    }

    // ─── API publique ──────────────────────────────────────
    return {
        init,
        updateDOM,

        // Getters pour les données brutes
        getCrypto:  () => _cache.crypto,
        getMarkets: () => _cache.markets,
        getNews:    () => _cache.news,
        getMacro:   () => _cache.macro,
        getFearGreed: () => _cache.fearGreed,
        getChart:   () => _cache.chart,
        getAlphaVantage: () => _cache.alphaVantage,
        getDefi:    () => _cache.defi,
        getMeta:    () => _cache.meta,
        getArticleDuJour: () => _cache.articleDuJour,
        getSentiment: () => _cache.sentiment,
        getAlerts:  () => _cache.alerts,
        getNewsletter: () => _cache.newsletter,
        getMessari: () => _cache.messari,
        getEuropeanMarkets: () => _cache.europeanMarkets,
        getWorldBank: () => _cache.worldBank,
        getNewsAPI: () => _cache.newsapi,
        getDailyBriefing: () => _cache.dailyBriefing,

        // Watchlist data helpers
        getPriceForSymbol,
        getNewsForSymbol,
        getAlertsForSymbol,

        // État
        isInitialized: () => _initialized,
        isUsingLiveData: () => _usingLiveData,

        // Utilitaires exportés
        formatUSD,
        formatPercent,
        isFresh,

        // Internals exposés pour tests unitaires uniquement
        _internals: {
            scoreArticle,
            curateArticles,
            truncateTitle,
            isSummaryRedundant,
            isArticleRelevant,
            SOURCE_TIERS,
            IRRELEVANT_PATTERNS,
            _setCache: function(key, val) { _cache[key] = val; },
            _setInitialized: function(v) { _initialized = v; },
            _resetCache: function() { _cache = {}; _initialized = false; }
        }
    };
})();

// ─── Initialisation automatique au chargement ──────────────
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async function () {
        // Pas de délai artificiel — DOMContentLoaded se déclenche après
        // l'exécution de tous les scripts synchrones (app.js inclus)
        const hasLiveData = await DataLoader.init();
        if (hasLiveData) {
            DataLoader.updateDOM();
        }
    });
}

// Export pour module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}
