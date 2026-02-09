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
            chart:   'chart-gold-btc.json',
            meta:    '_meta.json'
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

    // ─── Chargement des données ────────────────────────────

    /**
     * Initialise le DataLoader — charge tous les fichiers JSON
     * @returns {Promise<boolean>} true si au moins une source de données live est disponible
     */
    async function init() {
        console.log('[DataLoader] Initialisation...');

        // Charger tous les fichiers en parallèle
        const [crypto, markets, news, chart, meta] = await Promise.all([
            loadJSON(CONFIG.FILES.crypto),
            loadJSON(CONFIG.FILES.markets),
            loadJSON(CONFIG.FILES.news),
            loadJSON(CONFIG.FILES.chart),
            loadJSON(CONFIG.FILES.meta)
        ]);

        _cache = { crypto, markets, news, chart, meta };
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

        const sidebar = document.querySelector('.sidebar-markets') ||
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
                const priceEl = row.querySelector('.price, .market-price, td:nth-child(2)');
                const changeEl = row.querySelector('.change, .market-change, td:nth-child(3)');

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

    /**
     * Applique toutes les mises à jour au DOM
     */
    function updateDOM() {
        if (!_initialized || !_usingLiveData) return;

        console.log('[DataLoader] Mise à jour du DOM...');
        updateMarketSidebar();
        updateCryptoSection();
        updateGoldBitcoinChart();
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
        getChart:   () => _cache.chart,
        getMeta:    () => _cache.meta,

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
    // Attendre que app.js ait fini d'initialiser le DOM statique
    await new Promise(r => setTimeout(r, 500));

    const hasLiveData = await DataLoader.init();
    if (hasLiveData) {
        DataLoader.updateDOM();
    }
});

// Export pour module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}
