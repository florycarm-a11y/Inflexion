/**
 * Inflexion — Supabase Client (Frontend)
 *
 * Module IIFE pour l'authentification, watchlist et newsletter.
 * Chargé après le CDN Supabase dans index.html.
 */
;(function () {
    'use strict';

    // ─── CONFIG ─────────────────────────────────────────────────
    var SUPABASE_URL = 'https://pizemouhfrwgvgibitox.supabase.co';
    var SUPABASE_ANON_KEY = 'sb_publishable_5u8lldvoUdA_pKTZIL9jdA_gJb72SZH';

    var supabase = null;
    var currentUser = null;

    // ─── INIT ───────────────────────────────────────────────────
    function init() {
        if (!window.supabase) {
            console.warn('[Inflexion] Supabase CDN non chargé');
            return;
        }

        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Inflexion] Supabase initialisé');

        // Écouter les changements d'auth
        supabase.auth.onAuthStateChange(function (event, session) {
            currentUser = session ? session.user : null;
            updateAuthUI();
            if (currentUser) {
                loadWatchlist();
            }
        });

        // Vérifier la session existante
        supabase.auth.getSession().then(function (result) {
            if (result.data.session) {
                currentUser = result.data.session.user;
                updateAuthUI();
                loadWatchlist();
            }
        });

        // Brancher les événements
        bindAuthEvents();
        bindNewsletterEvents();
    }

    // ─── AUTH UI ────────────────────────────────────────────────

    function updateAuthUI() {
        var authBtn = document.getElementById('auth-btn');
        var authModal = document.getElementById('auth-modal');
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
        // Bouton ouvrir modal
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

        // Fermer modal
        var closeBtn = document.getElementById('auth-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeAuthModal);
        }

        // Toggle login/signup
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

        // Soumission du formulaire
        var authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', function (e) {
                e.preventDefault();
                handleAuth();
            });
        }

        // Déconnexion
        var logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
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

    // ─── WATCHLIST ──────────────────────────────────────────────

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

        renderWatchlist(result.data || []);
    }

    function renderWatchlist(items) {
        var container = document.getElementById('watchlist-items');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = '<p class="watchlist-empty">Aucun actif suivi. Ajoute des actifs ci-dessus.</p>';
            return;
        }

        var categoryIcons = {
            crypto: '₿',
            stock: '📈',
            commodity: '⛏️',
            index: '📊',
            other: '•'
        };

        container.innerHTML = items.map(function (item) {
            var icon = categoryIcons[item.category] || '•';
            return '<div class="watchlist-item" data-id="' + item.id + '">' +
                '<span class="watchlist-icon">' + icon + '</span>' +
                '<span class="watchlist-symbol">' + item.symbol + '</span>' +
                '<span class="watchlist-label">' + (item.label || '') + '</span>' +
                '<button class="watchlist-remove" data-id="' + item.id + '" aria-label="Retirer">✕</button>' +
            '</div>';
        }).join('');

        // Bind remove buttons
        container.querySelectorAll('.watchlist-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
                removeFromWatchlist(parseInt(btn.dataset.id));
            });
        });
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

    // ─── NEWSLETTER ─────────────────────────────────────────────

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

    // ─── WATCHLIST ADD FORM ─────────────────────────────────────

    function bindWatchlistForm() {
        var form = document.getElementById('watchlist-add-form');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var symbolInput = document.getElementById('watchlist-symbol');
            var categorySelect = document.getElementById('watchlist-category');

            var symbol = symbolInput ? symbolInput.value.trim() : '';
            var category = categorySelect ? categorySelect.value : 'other';

            if (symbol) {
                addToWatchlist(symbol, symbol, category);
                if (symbolInput) symbolInput.value = '';
                if (categorySelect) categorySelect.value = 'other';
            }
        });
    }

    // ─── PUBLIC API ─────────────────────────────────────────────

    window.InflexionAuth = {
        init: init,
        addToWatchlist: addToWatchlist,
        loadArticlesArchive: loadArticlesArchive,
        get user() { return currentUser; },
        get isLoggedIn() { return !!currentUser; }
    };

    // Auto-init quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            init();
            bindWatchlistForm();
        });
    } else {
        init();
        bindWatchlistForm();
    }
})();
