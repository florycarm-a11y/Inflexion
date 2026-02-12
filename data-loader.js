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
     * Formate un prix en USD
     * @param {number} value
     * @param {number} decimals
     * @returns {string}
     */
    function formatUSD(value, decimals = 2) {
        if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
        if (value >= 1e9)  return `$${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6)  return `$${(value / 1e6).toFixed(1)}M`;
        return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
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
            text: `${sign}${pct.toFixed(2)}%`,
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
     * Met à jour la sidebar "Marchés" avec les données live
     */
    function updateMarketSidebar() {
        if (!_cache.markets?.quotes?.length) return;

        const sidebar = document.getElementById('market-table') ||
                       document.querySelector('.sidebar-markets') ||
                       document.querySelector('.market-data');
        if (!sidebar) return;

        const quotes = _cache.markets.quotes;

        // Trouver les éléments de marché existants et les mettre à jour
        const marketRows = sidebar.querySelectorAll('.market-row, .market-item, tr');
        if (marketRows.length === 0) return;

        // Mapping des noms pour correspondre au DOM existant
        const nameMap = {
            'S&P 500': ['SPY', 'S&P 500', 'S&P500'],
            'Nasdaq 100': ['QQQ', 'Nasdaq 100', 'Nasdaq'],
            'Or (XAU)': ['GLD', 'Or (ETF)', 'Gold', 'Or'],
            'Nvidia': ['NVDA', 'Nvidia'],
            'Pétrole WTI': ['USO', 'Pétrole (ETF)', 'Oil', 'Pétrole']
        };

        quotes.forEach(q => {
            // Chercher l'élément DOM correspondant
            for (const [displayName, aliases] of Object.entries(nameMap)) {
                if (aliases.includes(q.name) || aliases.includes(q.symbol)) {
                    updateMarketRow(sidebar, displayName, q.price, q.change);
                    break;
                }
            }
        });

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

            // Formater la valeur selon le type
            if (ind.unit === '%') {
                displayValue = ind.value.toFixed(2) + '%';
            } else if (ind.unit === 'Mrd $') {
                displayValue = '$' + (ind.value / 1000).toFixed(1) + 'T';
            } else if (ind.unit === 'index') {
                displayValue = ind.value.toFixed(1);
            } else {
                displayValue = ind.value.toFixed(2);
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
                    changeSign + ind.change.toFixed(2) +
                    (ind.change_type === 'yoy' ? '%' : '') +
                    changeLabel + '</span>';
            }

            return '<div class="macro-card">' +
                '<div class="macro-card-icon">' + icon + '</div>' +
                '<div class="macro-card-body">' +
                    '<span class="macro-card-label">' + ind.label + '</span>' +
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
        // Révéler la section (masquée par défaut)
        var section = document.getElementById('article-du-jour-section');
        if (section) section.classList.remove('section-empty');

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
                var catEmojis = {
                    geopolitique: '🌍', marches: '📈', crypto: '₿',
                    matieres_premieres: '⛏️', ai_tech: '🤖', macro: '🏛️'
                };
                var catEmoji = catEmojis[signal.categorie] || '📡';

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
                        '<span class="risk-icon">⚠</span>' +
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
                '<h3 class="briefing-section-title">Risk Radar</h3>' +
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
                '<div class="article-du-jour-badge briefing-badge">🧠 Briefing Stratégique IA</div>' +
                '<time class="article-du-jour-date">' + formatArticleDate(briefing.date) + '</time>' +
                '<span class="briefing-sentiment-indicator" style="color:' + sentimentColor + '">' +
                    (briefing.sentiment_global || 'neutre') +
                '</span>' +
            '</div>' +
            '<h2 class="article-du-jour-title">' + s.titre + '</h2>' +
            (s.sous_titre ? '<p class="article-du-jour-subtitle">' + s.sous_titre + '</p>' : '') +
            '<div class="article-du-jour-content">' + contenuHTML + '</div>' +
            signauxHTML +
            riskHTML +
            tagsHTML +
            '<div class="article-du-jour-footer">' +
                '<span class="article-du-jour-model">' +
                    'Généré par Claude (Sonnet) · ' + (briefing.sources_count || '?') + ' sources analysées · ' +
                    (briefing.sources_market || '?') + ' sources de marché' +
                '</span>' +
            '</div>';
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
        if (section) section.classList.remove('section-empty');

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
                '<div class="article-du-jour-badge">✍️ Synthèse IA</div>' +
                '<time class="article-du-jour-date">' + formatArticleDate(article.date) + '</time>' +
            '</div>' +
            '<h2 class="article-du-jour-title">' + article.titre + '</h2>' +
            (article.sous_titre ? '<p class="article-du-jour-subtitle">' + article.sous_titre + '</p>' : '') +
            (pointsClesHTML ? '<div class="article-du-jour-points-cles"><h4>Points clés</h4><ul>' + pointsClesHTML + '</ul></div>' : '') +
            '<div class="article-du-jour-content">' + contenuHTML + '</div>' +
            sourcesHTML +
            (tagsHTML ? '<div class="article-du-jour-tags">' + tagsHTML + '</div>' : '') +
            '<div class="article-du-jour-footer">' +
                '<span class="article-du-jour-model">Généré par Claude (Haiku) · Sources : ' + sourcesLabel + '</span>' +
            '</div>';
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

    /**
     * Met à jour la section "Dernières actualités" avec les données enrichies (rubriques)
     */
    function updateLatestNewsWithRubriques() {
        if (!_cache.news?.categories) return;

        var ln = document.getElementById('latest-news');
        if (!ln) return;

        // Collecter tous les articles avec leur rubrique
        var allArticles = [];
        Object.keys(_cache.news.categories).forEach(function(cat) {
            var articles = _cache.news.categories[cat];
            articles.forEach(function(a) {
                allArticles.push(a);
            });
        });

        // Trier par date de publication (plus récent en premier)
        allArticles.sort(function(a, b) {
            return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
        });

        // Générer le HTML
        ln.innerHTML = allArticles.slice(0, 30).map(function(n) {
            var rubriqueAttr = n.rubrique || '';
            var rubriqueLabel = n.rubrique_label || '';
            var rubriqueEmoji = n.rubrique_emoji || '';
            var rubriqueTag = rubriqueLabel
                ? '<span class="rubrique-badge rubrique-' + rubriqueAttr + '">' + rubriqueEmoji + ' ' + rubriqueLabel + '</span>'
                : '';

            var hasThumb = n.image ? ' has-thumb' : '';
            var thumbHTML = n.image
                ? '<img src="' + n.image + '" alt="" class="news-list-thumb" loading="lazy" onerror="this.parentElement.classList.remove(\'has-thumb\');this.remove()">'
                : '';

            // Résumé concret sous la photo (max 150 car.)
            var desc = n.description || '';
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
                    '<h3><a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer">' + (n.title || '') + '</a></h3>' +
                    summaryHTML +
                '</div>' +
            '</article>';
        }).join('');
    }

    /**
     * Met à jour la section "À la une" (#top-stories) avec les données live
     */
    function updateTopStories() {
        if (!_cache.news?.categories) return;

        var ts = document.getElementById('top-stories');
        if (!ts) return;

        // Prendre le 1er article de chaque rubrique (toutes les rubriques)
        var stories = [];
        var categoryKeys = ['markets', 'geopolitics', 'crypto', 'commodities', 'ai_tech'];

        categoryKeys.forEach(function(cat) {
            var articles = _cache.news.categories[cat] || [];
            if (articles.length > 0) {
                stories.push(articles[0]);
            }
        });

        // Trier par date (plus récent d'abord) et prendre les 3 premiers
        stories.sort(function(a, b) {
            return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
        });
        stories = stories.slice(0, 3);

        if (stories.length === 0) return;

        ts.innerHTML = '<div class="top-stories-grid">' + stories.map(function(n, i) {
            var imgHTML = n.image
                ? '<img src="' + n.image + '" alt="" class="story-image" loading="lazy" onerror="this.remove()">'
                : '';
            var rubriqueAttr = n.rubrique || '';
            var rubriqueLabel = n.rubrique_label || '';
            var rubriqueEmoji = n.rubrique_emoji || '';
            var rubriqueTag = rubriqueLabel
                ? '<span class="rubrique-badge rubrique-' + rubriqueAttr + '">' + rubriqueEmoji + ' ' + rubriqueLabel + '</span>'
                : '';

            var desc = n.description || '';
            if (desc.length > 150) desc = desc.slice(0, 147) + '...';
            var summaryHTML = desc
                ? '<p class="story-summary">' + desc + '</p>'
                : '';

            return '<article class="top-story' + (i === 0 ? ' top-story-main' : '') + '">' +
                imgHTML +
                '<div class="story-body">' +
                    '<div class="story-meta">' +
                        '<a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer" class="source-name">' + (n.source || '') + '</a>' +
                        '<time class="news-time">' + (n.time || '') + '</time>' +
                        rubriqueTag +
                    '</div>' +
                    '<h3><a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer">' + (n.title || '') + '</a></h3>' +
                    summaryHTML +
                '</div>' +
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
            if (g.eth_dominance) statsHTML += '<span class="global-stat">ETH Dom: ' + g.eth_dominance.toFixed(1) + '%</span>';
            if (g.markets) statsHTML += '<span class="global-stat">Marchés: ' + g.markets.toLocaleString('fr-FR') + '</span>';
            if (g.market_cap_change_24h != null) {
                var isUp = g.market_cap_change_24h >= 0;
                statsHTML += '<span class="global-stat ' + (isUp ? 'positive' : 'negative') + '">MCap 24h: ' + (isUp ? '+' : '') + g.market_cap_change_24h.toFixed(2) + '%</span>';
            }
            if (statsHTML) globalContainer.innerHTML = statsHTML;
        }
    }

    // ─── Calendrier Économique ──────────────────────────────

    /**
     * Affiche les prochains événements économiques (Finnhub)
     */
    function updateEconomicCalendar() {
        if (!_cache.markets?.economicCalendar?.length) return;

        var container = document.getElementById('economic-calendar');
        if (!container) return;

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
                // Re-initialiser le ticker avec les nouvelles données
                if (typeof initTicker === 'function') initTicker();
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
            etf: 'markets' // Pas de rubrique ETF dans news.json, on utilise marchés
        };

        var newsCat = catMap[pageCat];
        if (!newsCat || !_cache.news.categories[newsCat]) return;

        var articles = _cache.news.categories[newsCat].slice(0, 3);
        if (articles.length === 0) return;

        // Construire le résumé en français
        var titres = articles.map(function(a) {
            return '<strong>' + (a.title || '') + '</strong> <span style="color:var(--text-muted)">(' + (a.source || '') + ')</span>';
        });

        trendEl.innerHTML = '<div class="analysis-excerpt" style="margin-bottom:2rem;padding:1.25rem;background:var(--bg-secondary);border-left:4px solid var(--pink);border-radius:0 4px 4px 0">' +
            '<strong style="display:block;margin-bottom:0.5rem">Dernières actualités de la rubrique</strong>' +
            '<ul style="margin:0;padding-left:1.2rem;list-style:disc">' +
            titres.map(function(t) { return '<li style="margin-bottom:0.3rem">' + t + '</li>'; }).join('') +
            '</ul></div>';
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
            { data: _cache.markets?.economicCalendar?.length, el: 'economic-calendar', section: 'calendar-section', msg: 'Aucun événement à venir' },
            { data: _cache.alphaVantage?.forex?.length, el: 'forex-rates', section: 'forex-section', msg: 'Taux indisponibles' },
            { data: _cache.alphaVantage?.sectors?.length, el: 'sector-performance', section: 'sectors-section', msg: 'Données sectorielles indisponibles' },
            { data: _cache.alphaVantage?.topMovers, el: 'top-movers', section: 'movers-section', msg: 'Données indisponibles' },
            { data: _cache.defi?.topProtocols?.length, el: 'defi-protocols', section: 'defi-section', msg: 'Protocoles indisponibles' },
            { data: _cache.defi?.topYields?.length, el: 'defi-yields', section: 'yields-section', msg: 'Rendements indisponibles' },
            { data: _cache.macro?.indicators?.length, el: 'macro-indicators', section: 'macro-section', msg: 'Indicateurs indisponibles' },
            { data: _cache.fearGreed?.current, el: null, section: 'fng-section', msg: null }
        ];

        widgetChecks.forEach(function(check) {
            if (!check.data) {
                if (check.el) showFallback(check.el, check.msg);
                // Masquer la section entière si pas de données
                var section = document.getElementById(check.section);
                if (section && !check.data) {
                    section.classList.add('widget-empty');
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

        // Collecter les articles des catégories correspondantes
        var articles = [];
        targetCats.forEach(function(cat) {
            var catArticles = _cache.news.categories[cat] || [];
            catArticles.forEach(function(a) {
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

        // Générer le HTML
        pageNews.innerHTML = articles.map(function(n) {
            var rubriqueTag = n.rubrique_label
                ? '<span class="rubrique-badge rubrique-' + (n.rubrique || '') + '">' + (n.rubrique_emoji || '') + ' ' + n.rubrique_label + '</span>'
                : '';

            var imgHTML = n.image
                ? '<img src="' + n.image + '" alt="" class="story-image" loading="lazy" onerror="this.remove()">'
                : '';

            return '<article class="top-story" data-rubrique="' + (n.rubrique || '') + '">' +
                imgHTML +
                '<div class="story-content">' +
                    '<div class="news-list-source">' +
                        '<a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer" class="source-name">' + (n.source || '') + '</a>' +
                        '<time class="news-time">' + (n.time || '') + '</time>' +
                        rubriqueTag +
                    '</div>' +
                    '<h3 class="story-title"><a href="' + (n.url || '#') + '" target="_blank" rel="noopener noreferrer">' + (n.title || '') + '</a></h3>' +
                    '<p class="story-excerpt">' + (n.description || '') + '</p>' +
                '</div>' +
            '</article>';
        }).join('');
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
                    <span class="defi-stat-chip">TVL Total <strong>${defi.summary.total_tvl_formatted}</strong></span>
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
                    ? `$${(p.tvl / 1e9).toFixed(2)}B`
                    : `$${(p.tvl / 1e6).toFixed(0)}M`;
                const change1d = p.change_1d;
                const changeCls = change1d > 0 ? 'up' : change1d < 0 ? 'down' : '';
                const changeStr = change1d != null
                    ? `<span class="defi-proto-change ${changeCls}">${change1d > 0 ? '+' : ''}${change1d.toFixed(1)}%</span>`
                    : '';
                return `
                    <div class="defi-protocol-row">
                        <span class="defi-proto-rank">${i + 1}</span>
                        ${p.logo ? `<img src="${p.logo}" class="defi-proto-logo" alt="${p.name}" onerror="this.style.display='none'">` : '<span class="defi-proto-logo-placeholder">🔷</span>'}
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
                    ? `$${(y.tvl / 1e9).toFixed(1)}B`
                    : `$${(y.tvl / 1e6).toFixed(0)}M`;
                return `
                    <div class="yield-row">
                        <div class="yield-info">
                            <span class="yield-project">${y.project}</span>
                            <span class="yield-detail">${y.symbol} · ${y.chain}</span>
                        </div>
                        <div class="yield-data">
                            <span class="yield-apy">${y.apy.toFixed(2)}%</span>
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

        var categoriesHTML = '';
        if (s.categories) {
            categoriesHTML = '<div class="sentiment-categories">' +
                Object.entries(s.categories).map(function(entry) {
                    var rubrique = entry[0];
                    var data = entry[1];
                    var catColor = data.score > 0.2 ? '#16a34a' : data.score < -0.2 ? '#dc2626' : '#eab308';
                    return '<div class="sentiment-cat">' +
                        '<span class="sentiment-cat-name">' + rubrique + '</span>' +
                        '<span class="sentiment-cat-score" style="color:' + catColor + '">' +
                        (data.score > 0 ? '+' : '') + data.score.toFixed(1) +
                        '</span></div>';
                }).join('') + '</div>';
        }

        container.innerHTML =
            '<div class="sentiment-header">' +
                '<span class="sentiment-score" style="color:' + scoreColor + '">' +
                    arrow + ' ' + (global.score > 0 ? '+' : '') + global.score.toFixed(2) +
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
        var severityIcon = { urgent: '🔴', attention: '🟡', info: '🔵' };

        container.innerHTML = alertes.map(function(a) {
            return '<div class="alert-item alert-' + (a.severite || 'info') + '">' +
                '<span class="alert-icon">' + (severityIcon[a.severite] || '🔵') + '</span>' +
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
                '<span class="newsletter-badge">📰 Newsletter</span>' +
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
                    return '<span class="briefing-vigilance-item">⚠ ' + v + '</span>';
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
        var flags = { FR: '🇫🇷', DE: '🇩🇪', GB: '🇬🇧', EU: '🇪🇺', ES: '🇪🇸', IT: '🇮🇹' };
        return flags[countryCode] || '🏳️';
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
            '<h4>Macro Internationale</h4>' +
            indicators.map(function(ind) {
                if (!ind.data || ind.data.length === 0) return '';
                return '<div class="wb-indicator">' +
                    '<h5 class="wb-indicator-label">' + ind.label + '</h5>' +
                    '<div class="wb-indicator-grid">' +
                    ind.data.slice(0, 6).map(function(d) {
                        var displayVal = ind.id === 'NY.GDP.MKTP.CD'
                            ? formatUSD(d.value, 0)
                            : d.value.toFixed(1) + '%';
                        return '<div class="wb-country-item">' +
                            '<span class="wb-country-name">' + d.country_code + '</span>' +
                            '<span class="wb-country-value">' + displayVal + '</span>' +
                        '</div>';
                    }).join('') +
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
                (gm.btc_dominance ? '<span>BTC Dom: ' + gm.btc_dominance.toFixed(1) + '%</span>' : '') +
                (gm.total_market_cap ? '<span>MCap: ' + formatUSD(gm.total_market_cap, 0) + '</span>' : '') +
                (gm.total_volume_24h ? '<span>Vol 24h: ' + formatUSD(gm.total_volume_24h, 0) + '</span>' : '') +
            '</div>';
        }

        container.innerHTML =
            '<h4>Crypto Avancé (Messari)</h4>' +
            globalHTML +
            '<div class="messari-assets">' +
            assets.slice(0, 10).map(function(a) {
                var pct = formatPercent(a.percent_change_24h);
                return '<div class="messari-asset-row">' +
                    '<span class="messari-symbol">' + (a.symbol || '') + '</span>' +
                    '<span class="messari-price">' + (a.price ? formatUSD(a.price) : 'N/A') + '</span>' +
                    '<span class="messari-dominance">' + (a.market_cap_dominance ? a.market_cap_dominance.toFixed(1) + '%' : '') + '</span>' +
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
            geopolitics: { rubrique: 'geopolitique', rubrique_label: 'Géopolitique', rubrique_emoji: '🌍' },
            markets:     { rubrique: 'marches', rubrique_label: 'Marchés', rubrique_emoji: '📈' },
            crypto:      { rubrique: 'crypto', rubrique_label: 'Crypto', rubrique_emoji: '₿' },
            commodities: { rubrique: 'matieres_premieres', rubrique_label: 'Matières Premières', rubrique_emoji: '⛏️' },
            ai_tech:     { rubrique: 'ai_tech', rubrique_label: 'IA & Tech', rubrique_emoji: '🤖' }
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

    function updateDOM() {
        if (!_initialized || !_usingLiveData) return;

        console.log('[DataLoader] Mise à jour du DOM...');
        syncGlobalData();
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
        updateEuropeanMarketsWidget();
        updateWorldBankWidget();
        updateMessariWidget();
        mergeNewsAPIArticles();
        initRubriqueFilters();
        handleEmptyWidgets();
        console.log('[DataLoader] ✓ DOM mis à jour');
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

        // État
        isInitialized: () => _initialized,
        isUsingLiveData: () => _usingLiveData,

        // Utilitaires exportés
        formatUSD,
        formatPercent,
        isFresh
    };
})();

// ─── Initialisation automatique au chargement ──────────────
document.addEventListener('DOMContentLoaded', async function () {
    // Pas de délai artificiel — DOMContentLoaded se déclenche après
    // l'exécution de tous les scripts synchrones (app.js inclus)
    const hasLiveData = await DataLoader.init();
    if (hasLiveData) {
        DataLoader.updateDOM();
    }
});

// Export pour module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}
