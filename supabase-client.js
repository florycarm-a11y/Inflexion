/**
 * Inflexion — Supabase Client (Frontend)
 *
 * Module IIFE pour l'authentification, watchlist avancée, alertes croisées,
 * watchlists partagées, annotations équipe et rapports automatisés.
 * Chargé après le CDN Supabase et data-loader.js dans index.html.
 *
 * Tables Supabase utilisées :
 *   - watchlist          : actifs suivis par utilisateur
 *   - shared_watchlists  : liens de partage de watchlists
 *   - watchlist_annotations : notes/commentaires sur les actifs
 *   - newsletter         : inscriptions newsletter
 *   - articles           : archive articles IA
 */
;(function () {
    'use strict';

    // ─── CONFIG ─────────────────────────────────────────────────
    var SUPABASE_URL = 'https://pizemouhfrwgvgibitox.supabase.co';
    var SUPABASE_ANON_KEY = 'sb_publishable_5u8lldvoUdA_pKTZIL9jdA_gJb72SZH';

    var supabase = null;
    var currentUser = null;
    var _watchlistItems = [];
    var _crossAlerts = [];
    var _refreshInterval = null;

    // Icônes SVG par catégorie d'actif
    var CATEGORY_ICONS = {
        crypto: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
        stock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        commodity: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4m4 0h4m4 0h4M7 16v3h10v-3"/></svg>',
        index: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
        other: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/></svg>'
    };

    // ─── INIT ───────────────────────────────────────────────────
    function init() {
        if (!window.supabase) {
            console.warn('[Inflexion] Supabase CDN non chargé');
            return;
        }

        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Inflexion] Supabase initialisé');

        supabase.auth.onAuthStateChange(function (event, session) {
            currentUser = session ? session.user : null;
            updateAuthUI();
            if (currentUser) {
                loadWatchlist();
            } else {
                _watchlistItems = [];
                _crossAlerts = [];
            }
        });

        supabase.auth.getSession().then(function (result) {
            if (result.data.session) {
                currentUser = result.data.session.user;
                updateAuthUI();
                loadWatchlist();
            }
        });

        bindAuthEvents();
        bindNewsletterEvents();
        checkSharedWatchlistURL();

        // Rafraîchir les données live toutes les 5 min
        _refreshInterval = setInterval(function () {
            if (currentUser && _watchlistItems.length > 0) {
                refreshLiveData();
            }
        }, 5 * 60 * 1000);
    }

    // ─── AUTH UI ────────────────────────────────────────────────

    function updateAuthUI() {
        var authBtn = document.getElementById('auth-btn');
        var userMenu = document.getElementById('user-menu');
        var userName = document.getElementById('user-name');
        var watchlistSection = document.getElementById('watchlist-section');

        if (!authBtn) return;

        if (currentUser) {
            authBtn.textContent = currentUser.email.split('@')[0];
            authBtn.classList.add('logged-in');
            if (userMenu) userMenu.style.display = 'block';
            if (watchlistSection) watchlistSection.style.display = 'block';
            if (userName) userName.textContent = currentUser.email.split('@')[0];
        } else {
            authBtn.textContent = 'Se connecter';
            authBtn.classList.remove('logged-in');
            if (userMenu) userMenu.style.display = 'none';
            if (watchlistSection) watchlistSection.style.display = 'none';
        }
    }

    function bindAuthEvents() {
        var authBtn = document.getElementById('auth-btn');
        if (authBtn) {
            authBtn.addEventListener('click', function () {
                if (currentUser) {
                    toggleUserMenu();
                } else {
                    openAuthModal();
                }
            });
        }

        var closeBtn = document.getElementById('auth-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeAuthModal);
        }

        var toggleBtn = document.getElementById('auth-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                var form = document.getElementById('auth-form');
                var title = document.getElementById('auth-modal-title');
                var submitBtn = document.getElementById('auth-submit');
                var isLogin = form.dataset.mode === 'login';

                form.dataset.mode = isLogin ? 'signup' : 'login';
                title.textContent = isLogin ? 'Créer un compte' : 'Se connecter';
                submitBtn.textContent = isLogin ? "S'inscrire" : 'Connexion';
                toggleBtn.textContent = isLogin
                    ? 'Déjà un compte ? Se connecter'
                    : 'Pas de compte ? Créer un compte';
            });
        }

        var authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', function (e) {
                e.preventDefault();
                handleAuth();
            });
        }

        var logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Close auth modal on backdrop click
        var authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.addEventListener('click', function (e) {
                if (e.target === authModal) {
                    closeAuthModal();
                }
            });
        }

        // Close auth modal on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                var modal = document.getElementById('auth-modal');
                if (modal && modal.classList.contains('active')) {
                    closeAuthModal();
                }
                var dropdown = document.getElementById('user-dropdown');
                if (dropdown && dropdown.classList.contains('active')) {
                    dropdown.classList.remove('active');
                }
            }
        });

        // Close user dropdown on outside click
        document.addEventListener('click', function (e) {
            var dropdown = document.getElementById('user-dropdown');
            var authBtnEl = document.getElementById('auth-btn');
            if (dropdown && dropdown.classList.contains('active')) {
                if (!dropdown.contains(e.target) && e.target !== authBtnEl) {
                    dropdown.classList.remove('active');
                }
            }
        });
    }

    function openAuthModal() {
        var modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeAuthModal() {
        var modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        clearAuthError();
    }

    function toggleUserMenu() {
        var menu = document.getElementById('user-dropdown');
        if (menu) {
            menu.classList.toggle('active');
        }
    }

    async function handleAuth() {
        var email = document.getElementById('auth-email').value.trim();
        var password = document.getElementById('auth-password').value;
        var form = document.getElementById('auth-form');
        var isLogin = form.dataset.mode === 'login';
        var submitBtn = document.getElementById('auth-submit');

        if (!email || !password) {
            showAuthError('Remplis tous les champs');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Chargement...';
        clearAuthError();

        try {
            var result;
            if (isLogin) {
                result = await supabase.auth.signInWithPassword({ email: email, password: password });
            } else {
                result = await supabase.auth.signUp({ email: email, password: password });
            }

            if (result.error) {
                showAuthError(result.error.message);
            } else {
                closeAuthModal();
                if (!isLogin) {
                    showToast('Compte créé ! Vérifie tes emails pour confirmer.');
                } else {
                    showToast('Connecté ✓');
                }
            }
        } catch (err) {
            showAuthError('Erreur de connexion');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isLogin ? 'Connexion' : "S'inscrire";
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        currentUser = null;
        _watchlistItems = [];
        _crossAlerts = [];
        updateAuthUI();
        showToast('Déconnecté');
        var dropdown = document.getElementById('user-dropdown');
        if (dropdown) dropdown.classList.remove('active');
    }

    function showAuthError(msg) {
        var el = document.getElementById('auth-error');
        if (el) {
            el.textContent = msg;
            el.style.display = 'block';
        }
    }

    function clearAuthError() {
        var el = document.getElementById('auth-error');
        if (el) {
            el.textContent = '';
            el.style.display = 'none';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // WATCHLIST AVANCÉE — Données live + Alertes croisées
    // ═══════════════════════════════════════════════════════════════

    async function loadWatchlist() {
        if (!currentUser || !supabase) return;

        var result = await supabase
            .from('watchlist')
            .select('*')
            .order('added_at', { ascending: false });

        if (result.error) {
            console.warn('[Inflexion] Erreur watchlist:', result.error.message);
            return;
        }

        _watchlistItems = result.data || [];
        enrichWatchlistWithLiveData();
        computeCrossAlerts();
        renderWatchlist(_watchlistItems);
        renderCrossAlerts();
        updateAlertsBadge();
        loadAnnotations();
    }

    /**
     * Enrichit chaque item de la watchlist avec les données de prix live
     * depuis DataLoader (crypto, marchés, indices, commodités)
     */
    function enrichWatchlistWithLiveData() {
        if (typeof DataLoader === 'undefined' || !DataLoader.isInitialized()) return;

        _watchlistItems.forEach(function (item) {
            var priceData = DataLoader.getPriceForSymbol(item.symbol, item.category);
            if (priceData) {
                item._price = priceData.price;
                item._change = priceData.change;
                item._source = priceData.source;
            } else {
                item._price = null;
                item._change = null;
                item._source = null;
            }
        });
    }

    /**
     * Rafraîchit les données live sans recharger depuis Supabase
     */
    function refreshLiveData() {
        enrichWatchlistWithLiveData();
        computeCrossAlerts();
        renderWatchlist(_watchlistItems);
        renderCrossAlerts();
        updateAlertsBadge();
    }

    /**
     * Calcule les alertes croisées : détecte quand une actualité ou une alerte IA
     * mentionne un actif de la watchlist de l'utilisateur.
     */
    function computeCrossAlerts() {
        if (typeof DataLoader === 'undefined' || !DataLoader.isInitialized()) return;

        _crossAlerts = [];
        var seen = new Set();

        _watchlistItems.forEach(function (item) {
            // Alertes IA qui mentionnent l'actif
            var symbolAlerts = DataLoader.getAlertsForSymbol(item.symbol);
            symbolAlerts.forEach(function (a) {
                var key = 'alert-' + item.symbol + '-' + (a.titre || '').slice(0, 30);
                if (!seen.has(key)) {
                    seen.add(key);
                    _crossAlerts.push({
                        type: 'alert',
                        symbol: item.symbol,
                        category: item.category,
                        severity: a.severite || 'info',
                        title: a.titre,
                        text: a.texte,
                        source: 'Claude IA'
                    });
                }
            });

            // Actualités qui mentionnent l'actif
            var symbolNews = DataLoader.getNewsForSymbol(item.symbol, item.label);
            symbolNews.slice(0, 2).forEach(function (n) {
                var key = 'news-' + item.symbol + '-' + (n.title || '').slice(0, 30);
                if (!seen.has(key)) {
                    seen.add(key);
                    _crossAlerts.push({
                        type: 'news',
                        symbol: item.symbol,
                        category: item.category,
                        severity: 'info',
                        title: n.title,
                        text: n.description ? n.description.slice(0, 120) + '...' : '',
                        url: n.url,
                        source: n.source || 'RSS',
                        time: n.time || ''
                    });
                }
            });
        });

        // Trier : alertes urgentes d'abord, puis attention, puis info
        var severityOrder = { urgent: 0, attention: 1, info: 2 };
        _crossAlerts.sort(function (a, b) {
            return (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
        });
    }

    /**
     * Rendu de la watchlist enrichie avec prix live, variations et actions
     */
    function renderWatchlist(items) {
        var container = document.getElementById('watchlist-items');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = '<p class="watchlist-empty">Aucun actif suivi. Ajoute des actifs ci-dessus.</p>';
            return;
        }

        container.innerHTML = items.map(function (item) {
            var icon = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.other;

            // Prix et variation live
            var priceHTML = '';
            if (item._price !== null && item._price !== undefined) {
                var fmtPrice = typeof DataLoader !== 'undefined'
                    ? DataLoader.formatUSD(item._price)
                    : '$' + Number(item._price).toFixed(2);
                priceHTML = '<span class="wl-price">' + fmtPrice + '</span>';
            }

            var changeHTML = '';
            if (item._change !== null && item._change !== undefined) {
                var isUp = item._change >= 0;
                var sign = isUp ? '+' : '';
                var changeClass = isUp ? 'wl-change-up' : 'wl-change-down';
                changeHTML = '<span class="wl-change ' + changeClass + '">' +
                    sign + item._change.toFixed(2) + '%</span>';
            }

            var sourceHTML = item._source
                ? '<span class="wl-source">' + item._source + '</span>'
                : '';

            // Indicateur d'alertes croisées pour cet actif
            var alertCount = _crossAlerts.filter(function (a) { return a.symbol === item.symbol; }).length;
            var alertBadge = alertCount > 0
                ? '<span class="wl-alert-badge" title="' + alertCount + ' alerte(s) pour ' + item.symbol + '">' + alertCount + '</span>'
                : '';

            return '<div class="watchlist-item" data-id="' + item.id + '" data-symbol="' + item.symbol + '">' +
                '<div class="wl-item-left">' +
                    '<span class="watchlist-icon">' + icon + '</span>' +
                    '<div class="wl-item-info">' +
                        '<span class="watchlist-symbol">' + item.symbol + '</span>' +
                        '<span class="watchlist-label">' + (item.label || '') + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="wl-item-center">' +
                    priceHTML +
                    changeHTML +
                '</div>' +
                '<div class="wl-item-right">' +
                    alertBadge +
                    sourceHTML +
                    '<button class="wl-annotate-btn" data-id="' + item.id + '" data-symbol="' + item.symbol + '" title="Annoter" aria-label="Ajouter une note">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                    '</button>' +
                    '<button class="watchlist-remove" data-id="' + item.id + '" aria-label="Retirer">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');

        // Bind remove buttons
        container.querySelectorAll('.watchlist-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
                removeFromWatchlist(parseInt(btn.dataset.id));
            });
        });

        // Bind annotate buttons
        container.querySelectorAll('.wl-annotate-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openAnnotationPanel(parseInt(btn.dataset.id), btn.dataset.symbol);
            });
        });
    }

    /**
     * Rendu des alertes croisées watchlist × actualités/alertes IA
     */
    function renderCrossAlerts() {
        var container = document.getElementById('watchlist-cross-alerts');
        if (!container) return;

        if (_crossAlerts.length === 0) {
            container.innerHTML = '<p class="wl-no-alerts">Aucune alerte liée à tes actifs suivis.</p>';
            return;
        }

        container.innerHTML =
            '<div class="wl-alerts-header">' +
                '<h4>Alertes croisées</h4>' +
                '<span class="wl-alerts-count">' + _crossAlerts.length + ' alerte(s)</span>' +
            '</div>' +
            '<div class="wl-alerts-list">' +
            _crossAlerts.slice(0, 10).map(function (alert) {
                var severityClass = 'wl-alert-' + alert.severity;
                var typeIcon = alert.type === 'alert'
                    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2"/></svg>';

                var linkStart = alert.url ? '<a href="' + alert.url + '" target="_blank" rel="noopener">' : '';
                var linkEnd = alert.url ? '</a>' : '';

                return '<div class="wl-alert-item ' + severityClass + '">' +
                    '<div class="wl-alert-item-header">' +
                        '<span class="wl-alert-type-icon">' + typeIcon + '</span>' +
                        '<span class="wl-alert-symbol">' + alert.symbol + '</span>' +
                        '<span class="wl-alert-severity-badge">' + alert.severity + '</span>' +
                        (alert.time ? '<span class="wl-alert-time">' + alert.time + '</span>' : '') +
                    '</div>' +
                    linkStart +
                    '<strong class="wl-alert-title">' + (alert.title || '') + '</strong>' +
                    linkEnd +
                    (alert.text ? '<p class="wl-alert-text">' + alert.text + '</p>' : '') +
                    '<span class="wl-alert-source">Source : ' + alert.source + '</span>' +
                '</div>';
            }).join('') +
            '</div>';
    }

    /**
     * Met à jour le badge de notification sur le bouton watchlist
     */
    function updateAlertsBadge() {
        var badge = document.getElementById('watchlist-alerts-badge');
        if (!badge) return;

        var urgentCount = _crossAlerts.filter(function (a) {
            return a.severity === 'urgent' || a.severity === 'attention';
        }).length;

        if (urgentCount > 0) {
            badge.textContent = urgentCount;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }

    async function addToWatchlist(symbol, label, category) {
        if (!currentUser || !supabase) {
            showToast('Connecte-toi pour ajouter à ta watchlist');
            return;
        }

        var result = await supabase
            .from('watchlist')
            .insert({
                user_id: currentUser.id,
                symbol: symbol.toUpperCase(),
                label: label || symbol,
                category: category || 'other'
            });

        if (result.error) {
            if (result.error.code === '23505') {
                showToast('Déjà dans ta watchlist');
            } else {
                showToast('Erreur : ' + result.error.message);
            }
            return;
        }

        showToast(symbol + ' ajouté ✓');
        loadWatchlist();
    }

    async function removeFromWatchlist(id) {
        if (!supabase) return;

        var result = await supabase
            .from('watchlist')
            .delete()
            .eq('id', id);

        if (!result.error) {
            loadWatchlist();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // WATCHLISTS PARTAGÉES
    // ═══════════════════════════════════════════════════════════════

    /**
     * Génère un code de partage unique pour la watchlist courante
     */
    async function shareWatchlist(name) {
        if (!currentUser || !supabase) {
            showToast('Connecte-toi pour partager ta watchlist');
            return null;
        }

        var shareCode = generateShareCode();
        var result = await supabase
            .from('shared_watchlists')
            .insert({
                owner_id: currentUser.id,
                share_code: shareCode,
                name: name || 'Watchlist de ' + currentUser.email.split('@')[0],
                is_public: true
            });

        if (result.error) {
            console.warn('[Inflexion] Erreur partage:', result.error.message);
            showToast('Erreur lors du partage');
            return null;
        }

        var shareURL = window.location.origin + window.location.pathname + '?watchlist=' + shareCode;
        showToast('Watchlist partagée ✓');
        return shareURL;
    }

    /**
     * Charge une watchlist partagée par son code
     */
    async function loadSharedWatchlist(shareCode) {
        if (!supabase) return null;

        // 1. Récupérer les infos de partage
        var shareResult = await supabase
            .from('shared_watchlists')
            .select('*')
            .eq('share_code', shareCode)
            .eq('is_public', true)
            .single();

        if (shareResult.error || !shareResult.data) {
            console.warn('[Inflexion] Watchlist partagée introuvable');
            return null;
        }

        var shared = shareResult.data;

        // 2. Charger les items de la watchlist de l'owner
        var itemsResult = await supabase
            .from('watchlist')
            .select('*')
            .eq('user_id', shared.owner_id)
            .order('added_at', { ascending: false });

        if (itemsResult.error) return null;

        var items = itemsResult.data || [];

        // 3. Enrichir avec données live
        if (typeof DataLoader !== 'undefined' && DataLoader.isInitialized()) {
            items.forEach(function (item) {
                var priceData = DataLoader.getPriceForSymbol(item.symbol, item.category);
                if (priceData) {
                    item._price = priceData.price;
                    item._change = priceData.change;
                    item._source = priceData.source;
                }
            });
        }

        return {
            name: shared.name,
            owner: shared.owner_id,
            created: shared.created_at,
            items: items
        };
    }

    /**
     * Affiche une watchlist partagée en lecture seule
     */
    function renderSharedWatchlist(data) {
        var container = document.getElementById('shared-watchlist-view');
        if (!container || !data) return;

        container.style.display = 'block';

        var itemsHTML = data.items.map(function (item) {
            var icon = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.other;
            var priceHTML = '';
            if (item._price != null) {
                var fmtPrice = typeof DataLoader !== 'undefined'
                    ? DataLoader.formatUSD(item._price)
                    : '$' + Number(item._price).toFixed(2);
                priceHTML = '<span class="wl-price">' + fmtPrice + '</span>';
            }
            var changeHTML = '';
            if (item._change != null) {
                var isUp = item._change >= 0;
                var changeClass = isUp ? 'wl-change-up' : 'wl-change-down';
                changeHTML = '<span class="wl-change ' + changeClass + '">' +
                    (isUp ? '+' : '') + item._change.toFixed(2) + '%</span>';
            }

            return '<div class="watchlist-item wl-shared-item">' +
                '<div class="wl-item-left">' +
                    '<span class="watchlist-icon">' + icon + '</span>' +
                    '<div class="wl-item-info">' +
                        '<span class="watchlist-symbol">' + item.symbol + '</span>' +
                        '<span class="watchlist-label">' + (item.label || '') + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="wl-item-center">' + priceHTML + changeHTML + '</div>' +
            '</div>';
        }).join('');

        container.innerHTML =
            '<div class="wl-shared-header">' +
                '<h3>' + escapeHTML(data.name) + '</h3>' +
                '<span class="wl-shared-meta">' + data.items.length + ' actifs</span>' +
                '<button class="wl-shared-close" id="close-shared-watchlist" aria-label="Fermer">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                '</button>' +
            '</div>' +
            '<div class="wl-shared-items">' + itemsHTML + '</div>' +
            (currentUser
                ? '<button class="wl-copy-all-btn" id="copy-shared-watchlist">Copier dans ma watchlist</button>'
                : '<p class="wl-shared-login-hint">Connecte-toi pour copier cette watchlist</p>');

        // Bind close
        var closeBtn = document.getElementById('close-shared-watchlist');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                container.style.display = 'none';
                // Nettoyer l'URL
                var url = new URL(window.location);
                url.searchParams.delete('watchlist');
                window.history.replaceState({}, '', url);
            });
        }

        // Bind copy all
        var copyBtn = document.getElementById('copy-shared-watchlist');
        if (copyBtn) {
            copyBtn.addEventListener('click', async function () {
                var added = 0;
                for (var i = 0; i < data.items.length; i++) {
                    var it = data.items[i];
                    var res = await supabase
                        .from('watchlist')
                        .insert({
                            user_id: currentUser.id,
                            symbol: it.symbol,
                            label: it.label || it.symbol,
                            category: it.category || 'other'
                        });
                    if (!res.error) added++;
                }
                showToast(added + ' actif(s) copiés dans ta watchlist ✓');
                loadWatchlist();
            });
        }
    }

    /**
     * Vérifie si l'URL contient un paramètre de watchlist partagée
     */
    function checkSharedWatchlistURL() {
        var params = new URLSearchParams(window.location.search);
        var code = params.get('watchlist');
        if (code) {
            loadSharedWatchlist(code).then(function (data) {
                if (data) renderSharedWatchlist(data);
            });
        }
    }

    function generateShareCode() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var code = '';
        for (var i = 0; i < 12; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // ═══════════════════════════════════════════════════════════════
    // ANNOTATIONS ÉQUIPE
    // ═══════════════════════════════════════════════════════════════

    var _activeAnnotationItemId = null;

    /**
     * Charge les annotations pour tous les items de la watchlist
     */
    async function loadAnnotations() {
        if (!currentUser || !supabase || _watchlistItems.length === 0) return;

        var itemIds = _watchlistItems.map(function (item) { return item.id; });

        var result = await supabase
            .from('watchlist_annotations')
            .select('*')
            .in('watchlist_item_id', itemIds)
            .order('created_at', { ascending: false });

        if (result.error) {
            // La table peut ne pas exister encore
            console.info('[Inflexion] Annotations non disponibles');
            return;
        }

        var annotations = result.data || [];

        // Afficher le compteur d'annotations sur chaque item
        _watchlistItems.forEach(function (item) {
            var count = annotations.filter(function (a) { return a.watchlist_item_id === item.id; }).length;
            var annotBtn = document.querySelector('.wl-annotate-btn[data-id="' + item.id + '"]');
            if (annotBtn && count > 0) {
                annotBtn.classList.add('has-annotations');
                annotBtn.title = count + ' note(s)';
            }
        });

        // Si un panel est ouvert, le rafraîchir
        if (_activeAnnotationItemId) {
            renderAnnotationsPanel(_activeAnnotationItemId, annotations.filter(function (a) {
                return a.watchlist_item_id === _activeAnnotationItemId;
            }));
        }
    }

    /**
     * Ouvre le panneau d'annotations pour un actif
     */
    async function openAnnotationPanel(itemId, symbol) {
        _activeAnnotationItemId = itemId;

        var panel = document.getElementById('annotation-panel');
        if (!panel) return;

        panel.style.display = 'block';
        panel.innerHTML =
            '<div class="annot-header">' +
                '<h4>Notes — ' + escapeHTML(symbol) + '</h4>' +
                '<button class="annot-close" id="close-annotations" aria-label="Fermer">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                '</button>' +
            '</div>' +
            '<div class="annot-list" id="annot-list"><p class="annot-loading">Chargement...</p></div>' +
            '<form class="annot-form" id="annot-form">' +
                '<textarea class="annot-input" id="annot-text" placeholder="Ajouter une note..." rows="2" required></textarea>' +
                '<button type="submit" class="annot-submit">Publier</button>' +
            '</form>';

        // Bind close
        document.getElementById('close-annotations').addEventListener('click', function () {
            panel.style.display = 'none';
            _activeAnnotationItemId = null;
        });

        // Bind form
        document.getElementById('annot-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            var textInput = document.getElementById('annot-text');
            var text = textInput.value.trim();
            if (!text) return;

            await addAnnotation(itemId, text);
            textInput.value = '';
        });

        // Charger les annotations existantes
        if (!supabase) return;
        var result = await supabase
            .from('watchlist_annotations')
            .select('*')
            .eq('watchlist_item_id', itemId)
            .order('created_at', { ascending: false });

        if (result.error) {
            document.getElementById('annot-list').innerHTML = '<p class="annot-empty">Service non disponible</p>';
            return;
        }

        renderAnnotationsPanel(itemId, result.data || []);
    }

    function renderAnnotationsPanel(itemId, annotations) {
        var list = document.getElementById('annot-list');
        if (!list) return;

        if (annotations.length === 0) {
            list.innerHTML = '<p class="annot-empty">Aucune note pour le moment.</p>';
            return;
        }

        list.innerHTML = annotations.map(function (a) {
            var date = new Date(a.created_at);
            var dateStr = date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            var isOwn = currentUser && a.user_id === currentUser.id;

            return '<div class="annot-item' + (isOwn ? ' annot-own' : '') + '">' +
                '<div class="annot-item-header">' +
                    '<span class="annot-author">' + (a.author_name || 'Utilisateur') + '</span>' +
                    '<span class="annot-date">' + dateStr + '</span>' +
                    (isOwn ? '<button class="annot-delete" data-annot-id="' + a.id + '" aria-label="Supprimer">' +
                        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
                    '</button>' : '') +
                '</div>' +
                '<p class="annot-text">' + escapeHTML(a.text) + '</p>' +
            '</div>';
        }).join('');

        // Bind delete buttons
        list.querySelectorAll('.annot-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                deleteAnnotation(parseInt(btn.dataset.annotId), itemId);
            });
        });
    }

    async function addAnnotation(itemId, text) {
        if (!currentUser || !supabase) return;

        var result = await supabase
            .from('watchlist_annotations')
            .insert({
                watchlist_item_id: itemId,
                user_id: currentUser.id,
                author_name: currentUser.email.split('@')[0],
                text: text
            });

        if (result.error) {
            showToast('Erreur : ' + result.error.message);
            return;
        }

        showToast('Note ajoutée ✓');
        openAnnotationPanel(itemId, getSymbolForId(itemId));
    }

    async function deleteAnnotation(annotId, itemId) {
        if (!supabase) return;

        await supabase
            .from('watchlist_annotations')
            .delete()
            .eq('id', annotId);

        openAnnotationPanel(itemId, getSymbolForId(itemId));
    }

    function getSymbolForId(itemId) {
        var item = _watchlistItems.find(function (i) { return i.id === itemId; });
        return item ? item.symbol : '';
    }

    // ═══════════════════════════════════════════════════════════════
    // RAPPORTS AUTOMATISÉS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Génère un rapport HTML de la watchlist avec données de marché et alertes
     */
    function generateReport() {
        if (!currentUser || _watchlistItems.length === 0) {
            showToast('Ajoute des actifs à ta watchlist pour générer un rapport');
            return;
        }

        var now = new Date();
        var dateStr = now.toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        var timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        // Résumé du portfolio
        var totalUp = 0;
        var totalDown = 0;
        var withData = 0;

        _watchlistItems.forEach(function (item) {
            if (item._change !== null && item._change !== undefined) {
                withData++;
                if (item._change >= 0) totalUp++;
                else totalDown++;
            }
        });

        var sentiment = totalUp > totalDown ? 'Haussier' : totalUp < totalDown ? 'Baissier' : 'Neutre';
        var sentimentColor = totalUp > totalDown ? '#16a34a' : totalUp < totalDown ? '#dc2626' : '#eab308';

        // Construire le rapport
        var reportHTML =
            '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Inflexion — ' + dateStr + '</title>' +
            '<style>' +
                'body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;max-width:800px;margin:0 auto;padding:2rem;color:#1a1a2e;background:#fafafa;}' +
                'h1{color:#064E3B;border-bottom:3px solid #10b981;padding-bottom:0.5rem;}' +
                'h2{color:#065F46;margin-top:2rem;}' +
                '.meta{color:#6b7280;font-size:0.9rem;margin-bottom:2rem;}' +
                '.summary{display:flex;gap:1rem;margin:1rem 0;flex-wrap:wrap;}' +
                '.summary-card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;flex:1;min-width:120px;text-align:center;}' +
                '.summary-card strong{display:block;font-size:1.5rem;margin-bottom:0.3rem;}' +
                '.up{color:#16a34a;} .down{color:#dc2626;} .neutral{color:#eab308;}' +
                'table{width:100%;border-collapse:collapse;margin:1rem 0;}' +
                'th,td{padding:0.6rem 0.8rem;text-align:left;border-bottom:1px solid #e5e7eb;}' +
                'th{background:#f3f4f6;font-weight:600;font-size:0.85rem;}' +
                'td{font-size:0.85rem;}' +
                '.alert-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:600;}' +
                '.alert-urgent{background:#fef2f2;color:#dc2626;}' +
                '.alert-attention{background:#fffbeb;color:#d97706;}' +
                '.alert-info{background:#eff6ff;color:#3b82f6;}' +
                '.footer{margin-top:2rem;padding-top:1rem;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:0.8rem;text-align:center;}' +
            '</style></head><body>' +
            '<h1>Rapport Watchlist — Inflexion</h1>' +
            '<p class="meta">Généré le ' + dateStr + ' à ' + timeStr + '</p>' +

            '<div class="summary">' +
                '<div class="summary-card"><strong>' + _watchlistItems.length + '</strong>Actifs suivis</div>' +
                '<div class="summary-card"><strong class="up">' + totalUp + '</strong>En hausse</div>' +
                '<div class="summary-card"><strong class="down">' + totalDown + '</strong>En baisse</div>' +
                '<div class="summary-card"><strong style="color:' + sentimentColor + '">' + sentiment + '</strong>Tendance</div>' +
            '</div>' +

            '<h2>Détail des actifs</h2>' +
            '<table><thead><tr><th>Symbole</th><th>Catégorie</th><th>Prix</th><th>Variation 24h</th><th>Source</th></tr></thead><tbody>' +
            _watchlistItems.map(function (item) {
                var price = item._price != null
                    ? (typeof DataLoader !== 'undefined' ? DataLoader.formatUSD(item._price) : '$' + item._price.toFixed(2))
                    : 'N/A';
                var change = item._change != null
                    ? '<span class="' + (item._change >= 0 ? 'up' : 'down') + '">' + (item._change >= 0 ? '+' : '') + item._change.toFixed(2) + '%</span>'
                    : 'N/A';
                return '<tr><td><strong>' + item.symbol + '</strong><br><small>' + (item.label || '') + '</small></td>' +
                    '<td>' + (item.category || '') + '</td>' +
                    '<td>' + price + '</td>' +
                    '<td>' + change + '</td>' +
                    '<td>' + (item._source || '-') + '</td></tr>';
            }).join('') +
            '</tbody></table>';

        // Alertes croisées dans le rapport
        if (_crossAlerts.length > 0) {
            reportHTML += '<h2>Alertes croisées (' + _crossAlerts.length + ')</h2>' +
                '<table><thead><tr><th>Actif</th><th>Type</th><th>Sévérité</th><th>Titre</th><th>Source</th></tr></thead><tbody>' +
                _crossAlerts.map(function (a) {
                    return '<tr><td><strong>' + a.symbol + '</strong></td>' +
                        '<td>' + a.type + '</td>' +
                        '<td><span class="alert-badge alert-' + a.severity + '">' + a.severity + '</span></td>' +
                        '<td>' + escapeHTML(a.title || '') + '</td>' +
                        '<td>' + a.source + '</td></tr>';
                }).join('') +
                '</tbody></table>';
        }

        // Contexte marché si disponible
        if (typeof DataLoader !== 'undefined') {
            var sentiment_data = DataLoader.getSentiment();
            if (sentiment_data?.global) {
                reportHTML += '<h2>Contexte marché</h2>' +
                    '<p><strong>Sentiment global :</strong> ' + (sentiment_data.global.tendance || 'N/A') +
                    ' (score ' + (sentiment_data.global.score || 0).toFixed(2) + ')</p>' +
                    '<p>' + (sentiment_data.global.resume || '') + '</p>';
            }
            var fng = DataLoader.getFearGreed();
            if (fng?.current) {
                reportHTML += '<p><strong>Fear & Greed :</strong> ' + fng.current.value + '/100 (' + fng.current.label + ')</p>';
            }
        }

        reportHTML +=
            '<div class="footer">' +
                '<p>Rapport généré automatiquement par Inflexion — Plateforme d\'intelligence géopolitique et financière</p>' +
                '<p>15 APIs · 158 sources · IA Claude</p>' +
            '</div>' +
            '</body></html>';

        // Ouvrir dans un nouvel onglet
        var blob = new Blob([reportHTML], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        showToast('Rapport généré ✓');
    }

    // ═══════════════════════════════════════════════════════════════
    // NEWSLETTER
    // ═══════════════════════════════════════════════════════════════

    function bindNewsletterEvents() {
        var form = document.getElementById('newsletter-form');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            var input = form.querySelector('input[type="email"]');
            var email = input ? input.value.trim() : '';

            if (!email) return;

            if (!supabase) {
                showToast('Service indisponible');
                return;
            }

            var result = await supabase
                .from('newsletter')
                .insert({ email: email });

            if (result.error) {
                if (result.error.code === '23505') {
                    showToast('Déjà inscrit(e) !');
                } else {
                    showToast('Erreur inscription');
                }
            } else {
                showToast('Inscrit(e) à la newsletter ✓');
                if (input) input.value = '';
            }
        });
    }

    // ─── ARTICLES ARCHIVE ───────────────────────────────────────

    async function loadArticlesArchive(limit) {
        if (!supabase) return [];

        var result = await supabase
            .from('articles')
            .select('date, titre, sous_titre, tags, points_cles')
            .order('date', { ascending: false })
            .limit(limit || 10);

        return result.data || [];
    }

    // ─── TOAST NOTIFICATIONS ────────────────────────────────────

    function showToast(message) {
        var existing = document.querySelector('.inflexion-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'inflexion-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add('show');
        });

        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 300);
        }, 3000);
    }

    // ─── UTILITIES ──────────────────────────────────────────────

    function escapeHTML(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str || ''));
        return div.innerHTML;
    }

    // ─── WATCHLIST ADD FORM + ACTIONS ───────────────────────────

    function bindWatchlistForm() {
        var form = document.getElementById('watchlist-add-form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var symbolInput = document.getElementById('watchlist-symbol');
                var categorySelect = document.getElementById('watchlist-category');

                var symbol = symbolInput ? symbolInput.value.trim() : '';
                var category = categorySelect ? categorySelect.value : 'other';

                if (symbol) {
                    addToWatchlist(symbol, symbol, category);
                    if (symbolInput) symbolInput.value = '';
                    if (categorySelect) categorySelect.selectedIndex = 0;
                }
            });
        }

        // Bouton partager
        var shareBtn = document.getElementById('watchlist-share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async function () {
                var url = await shareWatchlist();
                if (url) {
                    // Copier dans le presse-papier
                    try {
                        await navigator.clipboard.writeText(url);
                        showToast('Lien copié dans le presse-papier ✓');
                    } catch (e) {
                        // Fallback
                        prompt('Copie ce lien pour partager ta watchlist :', url);
                    }
                }
            });
        }

        // Bouton rapport
        var reportBtn = document.getElementById('watchlist-report-btn');
        if (reportBtn) {
            reportBtn.addEventListener('click', generateReport);
        }
    }

    // ─── PUBLIC API ─────────────────────────────────────────────

    window.InflexionAuth = {
        init: init,
        addToWatchlist: addToWatchlist,
        removeFromWatchlist: removeFromWatchlist,
        shareWatchlist: shareWatchlist,
        loadSharedWatchlist: loadSharedWatchlist,
        generateReport: generateReport,
        loadArticlesArchive: loadArticlesArchive,
        get user() { return currentUser; },
        get isLoggedIn() { return !!currentUser; },
        get watchlistItems() { return _watchlistItems; },
        get crossAlerts() { return _crossAlerts; },
        // Expose internals pour tests unitaires
        _internals: {
            generateShareCode: generateShareCode,
            computeCrossAlerts: computeCrossAlerts,
            enrichWatchlistWithLiveData: enrichWatchlistWithLiveData,
            generateReport: generateReport,
            _setWatchlistItems: function (items) { _watchlistItems = items; },
            _setCrossAlerts: function (alerts) { _crossAlerts = alerts; },
            _setCurrentUser: function (user) { currentUser = user; },
            _getWatchlistItems: function () { return _watchlistItems; },
            _getCrossAlerts: function () { return _crossAlerts; },
        }
    };

    // Auto-init quand le DOM est prêt
    if (typeof document !== 'undefined' && document.readyState) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                init();
                bindWatchlistForm();
            });
        } else {
            init();
            bindWatchlistForm();
        }
    }

    // Export pour tests unitaires (Node.js)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = window.InflexionAuth;
    }
})();
