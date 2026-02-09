// Inflexion — v5.0 — Données dynamiques prioritaires + fallback léger
// Updated: 9 février 2026
// Note : les données statiques sont désormais minimales.
// Le DataLoader (data-loader.js) charge les données live depuis /data/*.json

const categoryTrends = {
    geopolitics: 'Analyse géopolitique en chargement...',
    markets: 'Analyse marchés en chargement...',
    crypto: 'Analyse crypto en chargement...',
    commodities: 'Analyse matières premières en chargement...',
    etf: 'Analyse ETF en chargement...'
};

// Fallback minimal — les données live sont chargées par DataLoader depuis /data/*.json
const newsDatabase = {
    geopolitics: [{ source: 'Inflexion', url: '#', title: 'Chargement des actualités géopolitiques...', description: 'Les données live seront disponibles sous peu.', tags: ['geopolitics'], time: '', impact: 'high' }],
    markets: [{ source: 'Inflexion', url: '#', title: 'Chargement des actualités marchés...', description: 'Les données live seront disponibles sous peu.', tags: ['markets'], time: '', impact: 'high' }],
    crypto: [{ source: 'Inflexion', url: '#', title: 'Chargement des actualités crypto...', description: 'Les données live seront disponibles sous peu.', tags: ['crypto'], time: '', impact: 'high' }],
    commodities: [{ source: 'Inflexion', url: '#', title: 'Chargement des actualités matières premières...', description: 'Les données live seront disponibles sous peu.', tags: ['commodities'], time: '', impact: 'high' }],
    etf: [{ source: 'Inflexion', url: '#', title: 'Chargement des actualités ETF...', description: 'Les données live seront disponibles sous peu.', tags: ['etf'], time: '', impact: 'high' }]
};

const marketData = [
    { name: 'S&P 500', price: 0, change: 0 },
    { name: 'Nasdaq 100', price: 0, change: 0 },
    { name: 'Or (XAU)', price: 0, change: 0 },
    { name: 'Nvidia', price: 0, change: 0 },
    { name: 'Pétrole WTI', price: 0, change: 0 },
    { name: 'Dollar Index', price: 0, change: 0 }
];

const commodityData = [
    { name: 'Or', price: '—', change: '—', up: true },
    { name: 'Argent', price: '—', change: '—', up: true },
    { name: 'Pétrole WTI', price: '—', change: '—', up: true },
    { name: 'Pétrole Brent', price: '—', change: '—', up: true },
    { name: 'Gaz naturel', price: '—', change: '—', up: false },
    { name: 'Cuivre', price: '—', change: '—', up: true },
    { name: 'Blé', price: '—', change: '—', up: false }
];

const etfTableData = [
    { ticker: '—', name: 'Chargement...', provider: '—', flow: '—' }
];

const breakingNews = [
    'Inflexion — Chargement des dernières actualités...'
];

// --- Core functions ---

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function initTicker() {
    var el = document.getElementById('ticker-content');
    if (!el) return;
    var h = breakingNews.map(function(t) { return '<span class="ticker-item">' + t + '</span>'; }).join('<span class="ticker-separator">|</span>');
    el.innerHTML = h + h;
}

function initSearch() {
    var f = document.getElementById('search-form');
    if (!f) return;
    f.addEventListener('submit', function(e) {
        e.preventDefault();
        var q = document.getElementById('search-input').value.trim().toLowerCase();
        if (!q) return;
        // Persist search in URL
        if (window.history.replaceState) {
            var url = new URL(window.location);
            url.searchParams.set('q', q);
            window.history.replaceState({}, '', url);
        }
        var r = [];
        Object.keys(newsDatabase).forEach(function(k) {
            newsDatabase[k].forEach(function(a) {
                if (a.title.toLowerCase().indexOf(q) !== -1 || a.description.toLowerCase().indexOf(q) !== -1) r.push(a);
            });
        });
        showSearchResults(r, q);
    });
    // Restore search from URL on page load
    var params = new URLSearchParams(window.location.search);
    var savedQ = params.get('q');
    if (savedQ) {
        var input = document.getElementById('search-input');
        if (input) { input.value = savedQ; f.dispatchEvent(new Event('submit')); }
    }
}

function showSearchResults(results, query) {
    var c = document.getElementById('search-results');
    if (!c) { c = document.createElement('div'); c.id = 'search-results'; var m = document.querySelector('.main-content .container'); if (m) m.insertBefore(c, m.firstChild); }
    if (!results.length) { c.innerHTML = '<div class="search-results-header"><h2>Aucun résultat pour « ' + escapeHTML(query) + ' »</h2><button class="close-search" onclick="this.parentElement.parentElement.remove()">Fermer</button></div>'; return; }
    c.innerHTML = '<div class="search-results-header"><h2>' + results.length + ' résultat' + (results.length > 1 ? 's' : '') + ' pour « ' + escapeHTML(query) + ' »</h2><button class="close-search" onclick="this.parentElement.parentElement.remove()">Fermer</button></div><div class="news-grid">' + results.map(cardHTML).join('') + '</div>';
    c.scrollIntoView({ behavior: 'smooth' });
}

var tagLabels = { geopolitics: 'Géopolitique', markets: 'Marchés', crypto: 'Crypto', commodities: 'Mat. Premières', etf: 'ETF', conflicts: 'Conflits', trade: 'Commerce', politics: 'Politique' };

function parseTimeToDatetime(timeStr) {
    var months = { 'jan.': '01', 'fév.': '02', 'mars': '03', 'avr.': '04', 'mai': '05', 'juin': '06', 'juil.': '07', 'août': '08', 'sept.': '09', 'oct.': '10', 'nov.': '11', 'déc.': '12' };
    var parts = timeStr.trim().split(' ');
    if (parts.length >= 2) {
        var day = parts[0].replace(/\D/g, '').padStart(2, '0');
        var monthKey = parts[1].toLowerCase();
        var year = parts.length >= 3 ? parts[2] : '2026';
        var month = months[monthKey] || '01';
        return year + '-' + month + '-' + day;
    }
    return '2026-01-01';
}

function cardHTML(n) {
    var tags = (n.tags || []).map(function(t) { return '<span class="tag ' + t + '">' + (tagLabels[t] || t) + '</span>'; }).join('');
    var dot = n.impact === 'high' ? '<span class="impact-dot"></span>' : '';
    var datetime = parseTimeToDatetime(n.time);
    return '<article class="news-card"><div class="news-source"><a href="' + n.url + '" target="_blank" rel="noopener noreferrer" class="source-name">' + n.source + '</a><time class="news-time" datetime="' + datetime + '">' + n.time + '</time>' + dot + '</div><h3 class="news-title"><a href="' + n.url + '" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">' + n.title + '</a></h3><p class="news-description">' + n.description + '</p><div class="news-footer"><div class="news-tags">' + tags + '</div><a href="' + n.url + '" target="_blank" rel="noopener noreferrer" class="news-link">Lire</a></div></article>';
}

function initCommon() { initUI(); initTicker(); initSearch(); }

// --- Menu overlay navigation ---
function initMenuOverlay() {
    var menuTrigger = document.querySelector('.menu-trigger');
    var nav = document.getElementById('main-nav');
    var navClose = document.querySelector('.nav-close');
    if (!menuTrigger || !nav) return;

    function openMenu() {
        menuTrigger.setAttribute('aria-expanded', 'true');
        menuTrigger.setAttribute('aria-label', 'Fermer le menu de navigation');
        nav.classList.add('nav-open');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        menuTrigger.setAttribute('aria-expanded', 'false');
        menuTrigger.setAttribute('aria-label', 'Ouvrir le menu de navigation');
        nav.classList.remove('nav-open');
        document.body.style.overflow = '';
    }

    menuTrigger.addEventListener('click', function() {
        var isOpen = menuTrigger.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    if (navClose) {
        navClose.addEventListener('click', closeMenu);
    }

    // Close nav when a link is clicked
    nav.querySelectorAll('.nav-overlay-link').forEach(function(link) {
        link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
            closeMenu();
            menuTrigger.focus();
        }
    });

    // Close drawer on backdrop click (desktop)
    nav.addEventListener('click', function(e) {
        if (e.target === nav) {
            closeMenu();
        }
    });
}

// --- Home ---

function initHomePage() {
    initCommon();
    var ts = document.getElementById('top-stories');
    if (ts) {
        var f = [
            newsDatabase.markets && newsDatabase.markets[0],
            newsDatabase.markets && newsDatabase.markets[1],
            newsDatabase.commodities && newsDatabase.commodities[0]
        ].filter(Boolean);
        if (f.length === 0) { ts.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">Actualités en cours de chargement...</p>'; return; }
        ts.innerHTML = '<div class="top-stories-grid">' + f.map(function(n, i) {
            var dt = parseTimeToDatetime(n.time);
            return '<article class="top-story' + (i === 0 ? ' top-story-main' : '') + '"><a href="' + n.url + '" target="_blank" rel="noopener noreferrer" class="source-name">' + n.source + '</a><h3><a href="' + n.url + '" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">' + n.title + '</a></h3><p>' + n.description + '</p><time class="news-time" datetime="' + dt + '">' + n.time + '</time></article>';
        }).join('') + '</div>';
    }
    var ln = document.getElementById('latest-news');
    if (ln) {
        var all = [];
        Object.keys(newsDatabase).forEach(function(k) { all = all.concat(newsDatabase[k]); });
        all.sort(function(a, b) { return (a.impact === 'high' ? 0 : 1) - (b.impact === 'high' ? 0 : 1); });
        ln.innerHTML = all.slice(0, 10).map(function(n) {
            var dot = n.impact === 'high' ? '<span class="impact-dot"></span>' : '';
            var dt = parseTimeToDatetime(n.time);
            return '<article class="news-list-item"><div class="news-list-source"><a href="' + n.url + '" target="_blank" rel="noopener noreferrer" class="source-name">' + n.source + '</a><time class="news-time" datetime="' + dt + '">' + n.time + '</time>' + dot + '</div><h3><a href="' + n.url + '" target="_blank" rel="noopener noreferrer">' + n.title + '</a></h3><p>' + n.description + '</p></article>';
        }).join('');
    }
    var mt = document.getElementById('market-table');
    if (mt) mt.innerHTML = marketData.map(function(m) {
        var cls = m.change > 0 ? 'positive' : 'negative';
        return '<div class="market-row"><span class="market-row-name">' + m.name + '</span><span class="market-row-price">$' + m.price.toLocaleString('fr-FR') + '</span><span class="market-row-change ' + cls + '">' + (m.change > 0 ? '+' : '') + m.change.toFixed(2) + '%</span></div>';
    }).join('');

    // Initialize divergence chart
    initDivergenceChart();
}

// --- Divergence Chart: Gold vs Bitcoin YTD ---

function initDivergenceChart() {
    var ctx = document.getElementById('divergenceChart');
    if (!ctx || typeof Chart === 'undefined') return;

    // YTD 2026 data points (weekly)
    var labels = ['1 jan', '8 jan', '15 jan', '22 jan', '29 jan', '5 fév'];
    var goldData = [0, 3.2, 7.8, 12.4, 15.1, 18.2];      // Or: +18.2% YTD
    var btcData = [0, -2.1, -8.5, -12.3, -14.8, -16.4];  // BTC: -16.4% YTD

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Or (XAU/USD)',
                    data: goldData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#f59e0b'
                },
                {
                    label: 'Bitcoin (BTC/USD)',
                    data: btcData,
                    borderColor: '#f7931a',
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#f7931a',
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 15, 26, 0.95)',
                    titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13 },
                    bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                    padding: 12,
                    cornerRadius: 6,
                    callbacks: {
                        label: function(context) {
                            var value = context.parsed.y;
                            return context.dataset.label + ': ' + (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                        color: '#64748b'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(100, 116, 139, 0.1)'
                    },
                    ticks: {
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                        color: '#64748b',
                        callback: function(value) {
                            return (value >= 0 ? '+' : '') + value + '%';
                        }
                    }
                }
            }
        }
    });
}

// --- Category pages ---

function initCategoryPage(cat) {
    initCommon();
    var th = document.getElementById('category-trend');
    if (th && categoryTrends[cat]) th.innerHTML = '<p class="analysis-excerpt" style="margin-bottom:2rem;padding:1.25rem;background:var(--bg-secondary);border-left:4px solid var(--pink);border-radius:0 4px 4px 0">' + categoryTrends[cat] + '</p>';
    var c = document.getElementById('page-news');
    if (!c) return;
    var articles = newsDatabase[cat] || [];
    c.innerHTML = articles.map(cardHTML).join('');
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var f = btn.getAttribute('data-filter');
            var list = f === 'all' ? articles : articles.filter(function(a) { return a.tags.indexOf(f) !== -1; });
            c.innerHTML = list.length ? list.map(cardHTML).join('') : '<p class="no-results">Aucun article dans cette catégorie.</p>';
        });
    });
    if (cat === 'commodities') renderTable('commodity-table', ['Matière première', 'Prix', 'Variation'], commodityData, function(r) { return '<td>' + r.name + '</td><td>' + r.price + '</td><td class="' + (r.up ? 'positive' : 'negative') + '">' + r.change + '</td>'; });
    if (cat === 'etf') renderTable('etf-table', ['Ticker', 'Nom', 'Fournisseur', 'Flux'], etfTableData, function(r) { return '<td><strong>' + r.ticker + '</strong></td><td>' + r.name + '</td><td>' + r.provider + '</td><td class="' + (r.flow[0] === '+' ? 'positive' : 'negative') + '">' + r.flow + '</td>'; });
}

function renderTable(id, headers, data, rowFn) {
    var el = document.getElementById(id);
    if (!el) return;
    var sortState = { col: -1, asc: true };
    var keys = Object.keys(data[0] || {});
    function render(d) {
        el.innerHTML = '<table class="data-table"><thead><tr>' + headers.map(function(h, i) {
            var cls = 'sortable';
            if (i === sortState.col) cls += sortState.asc ? ' sort-asc' : ' sort-desc';
            return '<th class="' + cls + '" data-col="' + i + '">' + h + '</th>';
        }).join('') + '</tr></thead><tbody>' + d.map(function(r) { return '<tr>' + rowFn(r) + '</tr>'; }).join('') + '</tbody></table>';
        el.querySelectorAll('th.sortable').forEach(function(th) {
            th.addEventListener('click', function() {
                var col = parseInt(th.getAttribute('data-col'));
                if (sortState.col === col) { sortState.asc = !sortState.asc; } else { sortState.col = col; sortState.asc = true; }
                var key = keys[col];
                var sorted = data.slice().sort(function(a, b) {
                    var va = (a[key] || '').toString(), vb = (b[key] || '').toString();
                    var na = parseFloat(va.replace(/[^0-9.\-]/g, '')), nb = parseFloat(vb.replace(/[^0-9.\-]/g, ''));
                    if (!isNaN(na) && !isNaN(nb)) return sortState.asc ? na - nb : nb - na;
                    return sortState.asc ? va.localeCompare(vb) : vb.localeCompare(va);
                });
                render(sorted);
            });
        });
    }
    render(data);
}

// --- Back to Top ---

// --- Sticky Header on Scroll ---
function initStickyHeader() {
    var header = document.querySelector('.header');
    if (!header) return;
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });
}


// --- Load More News Button ---
function initLoadMore() {
    var btn = document.getElementById('load-more-news');
    if (!btn) return;
    var container = document.getElementById('latest-news');
    if (!container) return;

    var VISIBLE_COUNT = 5;
    var INCREMENT = 5;

    function applyVisibility() {
        var items = container.querySelectorAll('.news-item');
        if (items.length === 0) return;
        var shown = 0;
        items.forEach(function(item, i) {
            if (i < VISIBLE_COUNT) {
                item.style.display = '';
                shown++;
            } else {
                item.style.display = 'none';
            }
        });
        btn.style.display = (shown >= items.length) ? 'none' : '';
    }

    btn.addEventListener('click', function() {
        VISIBLE_COUNT += INCREMENT;
        applyVisibility();
    });

    // Wait for news items to be loaded (async), then apply
    var observer = new MutationObserver(function() {
        var items = container.querySelectorAll('.news-item');
        if (items.length > 0) {
            applyVisibility();
        }
    });
    observer.observe(container, { childList: true, subtree: true });
}

function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function() {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
    btn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// --- Market Status ---
function initMarketStatus() {
    var el = document.querySelector('.market-status');
    if (!el) return;
    updateMarketStatus(el);
    setInterval(function() { updateMarketStatus(el); }, 60000);
}

function updateMarketStatus(el) {
    var now = new Date();
    var nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    var day = nyTime.getDay();
    var hour = nyTime.getHours();
    var minute = nyTime.getMinutes();
    var time = hour + minute / 60;

    var status, text;
    if (day === 0 || day === 6) {
        status = 'closed';
        text = 'Fermé (week-end)';
    } else if (time >= 9.5 && time < 16) {
        status = 'open';
        text = 'Marchés ouverts';
    } else if (time >= 4 && time < 9.5) {
        status = 'pre-market';
        text = 'Pré-ouverture';
    } else if (time >= 16 && time < 20) {
        status = 'after-hours';
        text = 'Après-bourse';
    } else {
        status = 'closed';
        text = 'Fermé';
    }

    el.className = 'market-status ' + status;
    el.querySelector('.market-status-text').textContent = text;
}

// --- Newsletter ---
function initNewsletter() {
    var form = document.getElementById('newsletter-form');
    if (!form) return;
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('newsletter-email');
        if (!email || !email.value.trim()) return;
        // Demo only: stores email locally in browser — no data is sent to any server
        var subscribers = JSON.parse(localStorage.getItem('inflexion_subscribers') || '[]');
        if (subscribers.indexOf(email.value.trim()) === -1) {
            subscribers.push(email.value.trim());
            localStorage.setItem('inflexion_subscribers', JSON.stringify(subscribers));
        }
        form.hidden = true;
        var success = document.getElementById('newsletter-success');
        if (success) {
            success.hidden = false;
            success.setAttribute('role', 'status');
        }
    });
}

// Initialize all UI enhancements
function initUI() {
    initMenuOverlay();
    initStickyHeader();
    initBackToTop();
    initMarketStatus();
    initNewsletter();
    initLoadMore();
}
