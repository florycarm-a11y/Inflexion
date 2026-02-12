/**
 * Inflexion — Main Application
 * Core JavaScript for the Inflexion financial news platform
 *
 * @version 2.0.0 — Vague 9 (Supabase + FRED)
 */

/* ============================================
   Static Data (fallback if live JSON unavailable)
   ============================================ */

var breakingNews = [
    "Or à 2 890 $/oz (+18,2% YTD) — les banques centrales achètent massivement",
    "Bitcoin sous 80 000 $ — les ETF crypto enregistrent 1,7 Md$ de sorties",
    "Fed : taux maintenus à 4,25–4,50% — Powell reste prudent sur les baisses",
    "Nvidia dépasse les 3 000 Md$ de capitalisation — IA en pleine euphorie",
    "Pétrole WTI à 73 $ — tensions au Moyen-Orient et coupes OPEP+",
    "EUR/USD à 1,04 — le dollar reste fort face à l'incertitude politique européenne",
    "S&P 500 à +4,2% YTD — la tech tire le marché américain",
    "Inflation US à 2,9% — au-dessus de l'objectif de la Fed",
    "Chômage US à 4,0% — le marché du travail reste résilient",
    "Treasury 10Y à 4,49% — les taux longs restent élevés"
];

var marketData = [
    { name: "S&P 500", price: 6025.99, change: 0.61 },
    { name: "Nasdaq 100", price: 21580.00, change: 0.85 },
    { name: "Or (XAU)", price: 2891.50, change: 0.32 },
    { name: "Nvidia", price: 129.84, change: 2.15 },
    { name: "Pétrole WTI", price: 73.21, change: -0.45 },
    { name: "Dollar Index", price: 108.05, change: 0.12 }
];

var newsDatabase = [
    // Géopolitique
    { category: "geopolitics", title: "Tensions en mer de Chine : Taïwan renforce ses défenses", source: "Foreign Policy", time: "Il y a 2h", url: "#", description: "Taipei annonce un budget militaire record face aux manœuvres chinoises répétées dans le détroit." },
    { category: "geopolitics", title: "Sommet UE-Afrique : nouveaux accords sur les terres rares", source: "Atlantic Council", time: "Il y a 4h", url: "#", description: "L'Europe cherche à sécuriser ses approvisionnements en minerais critiques pour la transition énergétique." },
    { category: "geopolitics", title: "Iran : négociations nucléaires au point mort", source: "CFR", time: "Il y a 6h", url: "#", description: "Les pourparlers de Vienne stagnent alors que Téhéran enrichit l'uranium à 60%." },
    // Marchés
    { category: "markets", title: "Wall Street : le S&P 500 enchaîne un 5e record consécutif", source: "CNBC", time: "Il y a 1h", url: "#", description: "Les valeurs technologiques continuent de tirer le marché américain vers de nouveaux sommets." },
    { category: "markets", title: "BCE : Lagarde signale une possible baisse des taux en mars", source: "Bloomberg", time: "Il y a 3h", url: "#", description: "L'inflation en zone euro ralentit plus vite que prévu, ouvrant la porte à un assouplissement monétaire." },
    { category: "markets", title: "Résultats Nvidia : le chiffre d'affaires double grâce à l'IA", source: "CNBC", time: "Il y a 5h", url: "#", description: "Le géant des GPU affiche des résultats stratosphériques portés par la demande en puces IA." },
    { category: "markets", title: "Obligations : le 10 ans US franchit les 4,50%", source: "Bloomberg", time: "Il y a 7h", url: "#", description: "Les taux longs remontent face aux craintes d'inflation persistante et de déficit budgétaire." },
    // Crypto
    { category: "crypto", title: "Bitcoin sous 80 000 $ : les ETF perdent 1,7 Md$ en sorties", source: "CoinDesk", time: "Il y a 2h", url: "#", description: "Le marché crypto subit des pressions vendeuses alors que les investisseurs institutionnels se désengagent." },
    { category: "crypto", title: "Ethereum 2.0 : le staking atteint 32 millions d'ETH", source: "CoinDesk", time: "Il y a 5h", url: "#", description: "La sécurité du réseau Ethereum se renforce avec un nombre record de validateurs." },
    // Matières premières
    { category: "commodities", title: "Or à 2 890 $ : les banques centrales achètent 585 tonnes/trimestre", source: "World Gold Council", time: "Il y a 3h", url: "#", description: "La demande institutionnelle pour l'or atteint des niveaux historiques en ce début 2026." },
    { category: "commodities", title: "Pétrole : l'OPEP+ maintient ses coupes malgré la pression US", source: "Bloomberg", time: "Il y a 6h", url: "#", description: "L'Arabie saoudite refuse d'augmenter sa production malgré les appels de Washington." },
    { category: "commodities", title: "Cuivre à 9 400 $/t — la demande chinoise repart", source: "Bloomberg", time: "Il y a 8h", url: "#", description: "Le métal rouge profite du plan de relance de Pékin pour les infrastructures vertes." },
];

/* ============================================
   Utility Functions
   ============================================ */

function escapeHTML(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str).replace(/[&<>"']/g, c => map[c]);
}

function cardHTML(article) {
    if (!article) return '';
    const source = escapeHTML(article.source || '');
    const title = escapeHTML(article.title || '');
    const desc = escapeHTML(article.description || '');
    const time = escapeHTML(article.time || '');
    const url = article.url || '#';
    const cat = escapeHTML(article.category || '');
    const image = article.image || '';

    const imgHTML = image
        ? `<img src="${escapeHTML(image)}" alt="" class="story-image" loading="lazy" onerror="this.remove()">`
        : '';

    return `<article class="top-story" data-category="${cat}">
        ${imgHTML}
        <div class="story-content">
            <span class="story-source">${source}</span>
            <h3 class="story-title"><a href="${url}" target="_blank" rel="noopener">${title}</a></h3>
            <p class="story-excerpt">${desc}</p>
            <div class="story-footer">
                <time class="story-time">${time}</time>
                <a href="${url}" target="_blank" rel="noopener" class="story-link">Lire →</a>
            </div>
        </div>
    </article>`;
}

/* ============================================
   Init Functions
   ============================================ */

function initHomePage() {
    initCommon();
    initTopStories();
    initLatestNews();
    initMarketTable();
    initDivergenceChart();
    initLoadMore();

    // Set loading timeout for sidebar widgets — fallback after 10s
    setupLoadingFallbacks();
}

function initCategoryPage(category) {
    initCommon();

    // Initialiser le graphique Or vs Bitcoin si le canvas est présent
    if (document.getElementById('divergenceChart') && typeof initDivergenceChart === 'function') {
        initDivergenceChart();
    }

    const container = document.getElementById('page-news');
    if (!container) return;

    // Mapping pour les catégories qui peuvent couvrir plusieurs clés
    const catExpand = {
        etf: ['markets', 'ai_tech']
    };
    const cats = catExpand[category] || [category];

    const filtered = newsDatabase.filter(n => cats.includes(n.category));
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun article disponible dans cette rubrique pour le moment.</p>';
        return;
    }
    container.innerHTML = filtered.map(n => cardHTML(n)).join('');
}

function initCommon() {
    initUI();
    initTicker();
    initSearch();
}

function initUI() {
    initMenuOverlay();
    initStickyHeader();
    initBackToTop();
    initMarketStatus();
}

/* ============================================
   Ticker (Breaking News)
   ============================================ */

function initTicker() {
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;

    const items = breakingNews.map(text =>
        `<span class="ticker-item">${escapeHTML(text)}</span><span class="ticker-separator">·</span>`
    ).join('');

    // Duplicate for seamless loop
    ticker.innerHTML = items + items;
}

/* ============================================
   Search
   ============================================ */

function initSearch() {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    if (!form || !input) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = input.value.trim().toLowerCase();
        if (!query) return;

        const results = newsDatabase.filter(n =>
            (n.title && n.title.toLowerCase().includes(query)) ||
            (n.description && n.description.toLowerCase().includes(query)) ||
            (n.source && n.source.toLowerCase().includes(query)) ||
            (n.category && n.category.toLowerCase().includes(query))
        );

        const newsContainer = document.getElementById('latest-news');
        if (!newsContainer) return;

        if (results.length === 0) {
            newsContainer.innerHTML = `<p class="empty-state">Aucun résultat pour « ${escapeHTML(query)} »</p>`;
        } else {
            newsContainer.innerHTML = results.map(n => newsListItemHTML(n)).join('');
        }
    });
}

/* ============================================
   Menu Overlay (hamburger)
   ============================================ */

function initMenuOverlay() {
    const trigger = document.querySelector('.menu-trigger');
    const nav = document.getElementById('main-nav');
    const closeBtn = nav ? nav.querySelector('.nav-close') : null;

    if (!trigger || !nav) return;

    function openMenu() {
        nav.classList.add('nav-open');
        trigger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        if (closeBtn) closeBtn.focus();
    }

    function closeMenu() {
        nav.classList.remove('nav-open');
        trigger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        trigger.focus();
    }

    trigger.addEventListener('click', function() {
        const isOpen = nav.classList.contains('nav-open');
        isOpen ? closeMenu() : openMenu();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // Close on backdrop click
    nav.addEventListener('click', function(e) {
        if (e.target === nav) closeMenu();
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
            closeMenu();
        }
    });

    // Close on link click
    nav.querySelectorAll('.nav-overlay-link').forEach(function(link) {
        link.addEventListener('click', closeMenu);
    });
}

/* ============================================
   Sticky Header
   ============================================ */

function initStickyHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                header.classList.toggle('scrolled', window.scrollY > 50);
                ticking = false;
            });
            ticking = true;
        }
    });
}

/* ============================================
   Top Stories (3 featured cards)
   ============================================ */

function initTopStories() {
    const container = document.getElementById('top-stories');
    if (!container) return;

    const featured = newsDatabase.slice(0, 3);
    if (featured.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun article à la une.</p>';
        return;
    }

    container.innerHTML = featured.map((article, i) => {
        const cls = i === 0 ? 'top-story top-story-main' : 'top-story';
        const source = escapeHTML(article.source || '');
        const title = escapeHTML(article.title || '');
        const desc = escapeHTML(article.description || '');
        const time = escapeHTML(article.time || '');
        const url = article.url || '#';
        const image = article.image || '';

        const imgHTML = image
            ? `<img src="${escapeHTML(image)}" alt="" class="story-image" loading="lazy" onerror="this.remove()">`
            : '';

        return `<article class="${cls}">
            ${imgHTML}
            <div class="story-content">
                <span class="story-source">${source}</span>
                <h3 class="story-title"><a href="${url}" target="_blank" rel="noopener">${title}</a></h3>
                <p class="story-excerpt">${desc}</p>
                <div class="story-footer">
                    <time class="story-time">${time}</time>
                    <a href="${url}" target="_blank" rel="noopener" class="story-link">Lire →</a>
                </div>
            </div>
        </article>`;
    }).join('');
}

/* ============================================
   Latest News (list)
   ============================================ */

let _newsOffset = 0;
const NEWS_PER_PAGE = 5;

// Map English category keys to French rubrique identifiers matching filter buttons
const _categoryToRubrique = {
    geopolitics: 'geopolitique',
    markets: 'marches',
    crypto: 'crypto',
    commodities: 'matieres_premieres',
    ai_tech: 'ai_tech'
};

function newsListItemHTML(article) {
    const source = escapeHTML(article.source || '');
    const title = escapeHTML(article.title || '');
    const desc = escapeHTML(article.description || '');
    const time = escapeHTML(article.time || '');
    const url = article.url || '#';
    const rawCat = article.category || article.rubrique || '';
    const rubrique = escapeHTML(_categoryToRubrique[rawCat] || rawCat);
    const image = article.image || '';

    const hasThumb = image ? ' has-thumb' : '';
    const thumbHTML = image
        ? `<img src="${escapeHTML(image)}" alt="" class="news-list-thumb" loading="lazy" onerror="this.parentElement.classList.remove('has-thumb');this.remove()">`
        : '';

    return `<article class="news-list-item${hasThumb}" data-rubrique="${rubrique}">
        <div class="news-list-body">
            <div class="news-list-source">
                <a href="${url}" target="_blank" rel="noopener noreferrer" class="source-name">${source}</a>
                <time class="news-time">${time}</time>
            </div>
            <h3><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
            <p>${desc}</p>
        </div>
        ${thumbHTML}
    </article>`;
}

function initLatestNews() {
    const container = document.getElementById('latest-news');
    if (!container) return;

    _newsOffset = 0;
    const batch = newsDatabase.slice(0, NEWS_PER_PAGE);
    if (batch.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune actualité disponible.</p>';
        return;
    }
    container.innerHTML = batch.map(n => newsListItemHTML(n)).join('');
    _newsOffset = batch.length;
}

function initLoadMore() {
    const btn = document.getElementById('load-more-news');
    if (!btn) return;

    btn.addEventListener('click', function() {
        const container = document.getElementById('latest-news');
        if (!container) return;

        const batch = newsDatabase.slice(_newsOffset, _newsOffset + NEWS_PER_PAGE);
        if (batch.length === 0) {
            btn.textContent = 'Aucun article supplémentaire';
            btn.disabled = true;
            return;
        }

        batch.forEach(n => {
            container.insertAdjacentHTML('beforeend', newsListItemHTML(n));
        });
        _newsOffset += batch.length;

        if (_newsOffset >= newsDatabase.length) {
            btn.textContent = 'Tous les articles affichés';
            btn.disabled = true;
        }
    });
}

/* ============================================
   Market Table (sidebar)
   ============================================ */

function initMarketTable() {
    const container = document.getElementById('market-table');
    if (!container) return;

    if (!marketData || marketData.length === 0) {
        container.innerHTML = '<p class="sidebar-empty">Données marchés indisponibles.</p>';
        return;
    }

    container.innerHTML = marketData.map(m => {
        const isPositive = m.change >= 0;
        const sign = isPositive ? '+' : '';
        const colorClass = isPositive ? 'positive' : 'negative';
        const arrow = isPositive ? '▲' : '▼';

        return `<div class="market-row">
            <span class="market-name">${escapeHTML(m.name)}</span>
            <span class="market-price">${m.price.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            <span class="market-change ${colorClass}">${arrow} ${sign}${m.change.toFixed(2)}%</span>
        </div>`;
    }).join('');
}

/* ============================================
   Divergence Chart — Gold vs Bitcoin (Chart.js)
   BUG FIX: Added comprehensive data guard
   ============================================ */

function initDivergenceChart() {
    const canvas = document.getElementById('divergenceChart');
    if (!canvas) return;

    // ═══ DATA GUARD ═══
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('[Inflexion] Chart.js non chargé — graphique désactivé');
        showChartFallback(canvas, 'Bibliothèque graphique non disponible');
        return;
    }

    // Try to get live data first, fall back to static
    const liveData = (typeof DataLoader !== 'undefined' && DataLoader.isInitialized())
        ? DataLoader.getChart()
        : null;

    let goldData, btcData, labels;

    if (liveData && Array.isArray(liveData.gold) && Array.isArray(liveData.bitcoin) && liveData.gold.length > 0) {
        // Use live data from API (chart-gold-btc.json uses 'price' field)
        // Normalize to base-100 index for comparable visualization
        const rawGold = liveData.gold.map(d => d && typeof d.price === 'number' ? d.price : null);
        const rawBtc = liveData.bitcoin.map(d => d && typeof d.price === 'number' ? d.price : null);
        const goldBase = rawGold.find(v => v !== null) || 1;
        const btcBase = rawBtc.find(v => v !== null) || 1;
        goldData = rawGold.map(v => v !== null ? (v / goldBase) * 100 : null).filter(v => v !== null);
        btcData = rawBtc.map(v => v !== null ? (v / btcBase) * 100 : null).filter(v => v !== null);
        labels = liveData.gold.map(d => {
            if (!d || !d.date) return '';
            const date = new Date(d.date);
            return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        });
    } else {
        // Static fallback data (simplified 90-day trend)
        console.info('[Inflexion] Données chart live indisponibles — utilisation du fallback statique');
        const points = 30;
        labels = [];
        goldData = [];
        btcData = [];
        const now = new Date();
        for (let i = points; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i * 3);
            labels.push(d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
            // Gold trending up ~18%
            goldData.push(100 + (points - i) * 0.6 + (Math.random() - 0.3) * 2);
            // Bitcoin trending down ~16%
            btcData.push(100 - (points - i) * 0.5 + (Math.random() - 0.5) * 3);
        }
    }

    // ═══ FINAL GUARD ═══
    if (!goldData.length || !btcData.length || !labels.length) {
        console.warn('[Inflexion] Données insuffisantes pour le graphique');
        showChartFallback(canvas, 'Données insuffisantes pour afficher le graphique');
        return;
    }

    try {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            showChartFallback(canvas, 'Canvas non supporté');
            return;
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Or (XAU/USD)',
                        data: goldData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        borderWidth: 2.5,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Bitcoin (BTC/USD)',
                        data: btcData,
                        borderColor: '#f7931a',
                        backgroundColor: 'rgba(247, 147, 26, 0.05)',
                        borderWidth: 2.5,
                        borderDash: [6, 3],
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        tension: 0.3,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleColor: '#fff',
                        bodyColor: '#ccc',
                        padding: 12,
                        cornerRadius: 6,
                        displayColors: true
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            maxTicksLimit: 8,
                            font: { size: 11, family: "'Plus Jakarta Sans'" },
                            color: '#6b6b6b'
                        }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: {
                            font: { size: 11, family: "'Plus Jakarta Sans'" },
                            color: '#6b6b6b'
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error('[Inflexion] Erreur Chart.js:', err);
        showChartFallback(canvas, 'Erreur lors du rendu du graphique');
    }
}

function showChartFallback(canvas, message) {
    const container = canvas.parentElement;
    if (container) {
        container.innerHTML = `<div class="chart-fallback">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 5-6"/></svg>
            <p>${escapeHTML(message)}</p>
        </div>`;
    }
}

// Listen for live data ready event from DataLoader
document.addEventListener('inflexion:chartDataReady', function(e) {
    if (!e.detail) return;
    const canvas = document.getElementById('divergenceChart');
    if (!canvas) return;
    // Destroy existing chart and reinitialize with live data
    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    initDivergenceChart();
});

/* ============================================
   Back to Top
   ============================================ */

function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function() {
        btn.classList.toggle('visible', window.scrollY > 400);
    });

    btn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ============================================
   Market Status (NYSE open/closed)
   ============================================ */

function initMarketStatus() {
    const status = document.querySelector('.market-status');
    if (!status) return;

    function update() {
        const now = new Date();
        const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const day = ny.getDay();
        const hour = ny.getHours();
        const min = ny.getMinutes();
        const time = hour * 60 + min;

        // NYSE: Mon-Fri 9:30-16:00 ET
        const isOpen = day >= 1 && day <= 5 && time >= 570 && time < 960;

        const dot = status.querySelector('.market-status-dot');
        const text = status.querySelector('.market-status-text');

        if (isOpen) {
            status.className = 'market-status open';
            if (text) text.textContent = 'NYSE Ouvert';
        } else {
            status.className = 'market-status closed';
            if (day === 0 || day === 6) {
                if (text) text.textContent = 'Fermé (week-end)';
            } else {
                if (text) text.textContent = 'Fermé';
            }
        }
    }

    update();
    setInterval(update, 60000);
}

/* ============================================
   Loading Fallbacks — BUG FIX #2
   After 10s, replace "Chargement..." with fallback messages
   ============================================ */

function setupLoadingFallbacks() {
    setTimeout(function() {
        // Find all loading spinners still present
        document.querySelectorAll('.loading').forEach(function(loader) {
            const parent = loader.parentElement;
            if (!parent) return;

            // Determine fallback message based on container
            let message = 'Données indisponibles pour le moment.';
            const id = parent.id || '';

            if (id === 'top-stories') {
                message = 'Articles à la une indisponibles.';
            } else if (id === 'latest-news') {
                message = 'Actualités indisponibles.';
            } else if (id === 'market-table') {
                message = 'Données marchés indisponibles.';
            }

            loader.innerHTML = `<p class="sidebar-empty">${message}</p>`;
            loader.classList.remove('loading');
            loader.classList.add('loading-fallback');
        });

        // Handle macro indicators still showing placeholder
        const macroContainer = document.getElementById('macro-indicators');
        if (macroContainer) {
            const placeholder = macroContainer.querySelector('.macro-placeholder');
            if (placeholder) {
                placeholder.textContent = 'Indicateurs macro indisponibles.';
            }
        }

        // Hide empty sections
        hideEmptySections();
    }, 10000);
}

/**
 * Hide sections that have no content
 */
function hideEmptySections() {
    // Hide "Article du jour" if empty
    const articleSection = document.getElementById('article-du-jour-section');
    if (articleSection) {
        const placeholder = articleSection.querySelector('.article-du-jour-placeholder');
        if (placeholder) {
            articleSection.style.display = 'none';
        }
    }

    // Hide "Marchés" sidebar if empty
    const marketTable = document.getElementById('market-table');
    if (marketTable && marketTable.children.length === 0) {
        const sidebarBlock = marketTable.closest('.sidebar-block');
        if (sidebarBlock) sidebarBlock.style.display = 'none';
    }
}

/* ============================================
   Newsletter (basic — enhanced by supabase-client.js)
   ============================================ */

function initNewsletter() {
    // Basic newsletter handler (supabase-client.js overrides this)
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('newsletter-email');
        const success = document.getElementById('newsletter-success');
        if (email && email.value && success) {
            form.style.display = 'none';
            success.hidden = false;
        }
    });
}

/* ============================================
   Initialize on DOM ready
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // initHomePage is called from the inline script in index.html
    // Category pages call initCategoryPage() instead
});
