// ============================================
// GéoFinance — Multi-page Application
// ============================================

// --- News Database ---
const newsDatabase = {
    geopolitics: [
        { source: 'Reuters', sourceUrl: 'https://www.reuters.com', title: 'Tensions au Moyen-Orient : les marchés pétroliers sous pression', description: 'Les derniers développements dans la région du Golfe entraînent une volatilité accrue sur les cours du brut. Les investisseurs surveillent de près les déclarations diplomatiques.', tags: ['geopolitics', 'conflicts'], time: '45 min', impact: 'high' },
        { source: 'Financial Times', sourceUrl: 'https://www.ft.com', title: 'G7 : nouvelles sanctions économiques et impact sur les marchés', description: 'Les leaders du G7 annoncent un nouveau paquet de sanctions qui pourrait affecter les chaînes d\'approvisionnement mondiales et les flux de capitaux.', tags: ['geopolitics', 'trade'], time: '1 h', impact: 'high' },
        { source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', title: 'Relations USA-Chine : négociations commerciales en cours', description: 'Les discussions commerciales entre Washington et Pékin reprennent. Les marchés asiatiques réagissent positivement aux premiers signaux.', tags: ['geopolitics', 'trade'], time: '2 h', impact: 'medium' },
        { source: 'BBC News', sourceUrl: 'https://www.bbc.com/news', title: 'Europe : crise énergétique et stratégies de diversification', description: 'L\'Union européenne accélère ses plans de diversification énergétique. Impact sur les prix du gaz et les investissements dans les renouvelables.', tags: ['geopolitics', 'politics'], time: '3 h', impact: 'medium' },
        { source: 'Al Jazeera', sourceUrl: 'https://www.aljazeera.com', title: 'OPEP+ : réunion cruciale sur les quotas de production', description: 'Les pays producteurs de pétrole se réunissent pour discuter des niveaux de production. Anticipations de volatilité sur les marchés de l\'énergie.', tags: ['geopolitics', 'politics'], time: '4 h', impact: 'high' },
        { source: 'Le Monde', sourceUrl: 'https://www.lemonde.fr', title: 'Zone euro : BCE et politique monétaire face aux tensions', description: 'Christine Lagarde annonce les orientations de la politique monétaire européenne. Les marchés obligataires réagissent aux nouvelles projections.', tags: ['geopolitics', 'politics'], time: '5 h', impact: 'medium' },
        { source: 'Wall Street Journal', sourceUrl: 'https://www.wsj.com', title: 'Amérique latine : instabilité politique et marchés émergents', description: 'Les changements politiques en Amérique du Sud affectent les flux d\'investissements. Analyse des risques pour les portefeuilles exposés.', tags: ['geopolitics', 'politics'], time: '6 h', impact: 'medium' },
        { source: 'France 24', sourceUrl: 'https://www.france24.com', title: 'Afrique : ressources stratégiques et nouveaux partenariats', description: 'Les pays africains négocient de nouveaux accords sur les métaux rares. Implications pour la transition énergétique mondiale.', tags: ['geopolitics', 'trade'], time: '7 h', impact: 'medium' }
    ],
    markets: [
        { source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', title: 'Wall Street : nouveaux records historiques pour les indices', description: 'Le S&P 500 et le Nasdaq atteignent de nouveaux sommets. Les valeurs technologiques mènent la hausse avec des résultats supérieurs aux attentes.', tags: ['markets'], time: '30 min', impact: 'high' },
        { source: 'CNBC', sourceUrl: 'https://www.cnbc.com', title: 'Fed : pause dans le cycle de resserrement monétaire', description: 'La Réserve fédérale maintient ses taux. Jerome Powell signale une approche prudente face à l\'évolution de l\'inflation.', tags: ['markets'], time: '1 h', impact: 'high' },
        { source: 'Les Échos', sourceUrl: 'https://www.lesechos.fr', title: 'CAC 40 : le luxe et la tech portent l\'indice parisien', description: 'Les valeurs du luxe français continuent leur progression. LVMH et Hermès affichent des performances exceptionnelles.', tags: ['markets'], time: '2 h', impact: 'medium' },
        { source: 'Financial Times', sourceUrl: 'https://www.ft.com', title: 'Marchés asiatiques : Tokyo en hausse, Shanghai stabilisée', description: 'Le Nikkei 225 progresse sur fond d\'optimisme économique. Les marchés chinois montrent des signes de stabilisation.', tags: ['markets'], time: '3 h', impact: 'medium' },
        { source: 'MarketWatch', sourceUrl: 'https://www.marketwatch.com', title: 'VIX : l\'indice de la peur reste à des niveaux modérés', description: 'Malgré les incertitudes géopolitiques, la volatilité implicite reste contenue. Les investisseurs maintiennent leur appétit pour le risque.', tags: ['markets'], time: '4 h', impact: 'low' },
        { source: 'Reuters', sourceUrl: 'https://www.reuters.com', title: 'Devises : le dollar recule face à l\'euro et au yen', description: 'L\'indice DXY perd du terrain. Les traders ajustent leurs positions en anticipation des prochaines décisions de politique monétaire.', tags: ['markets'], time: '5 h', impact: 'medium' },
        { source: 'The Economist', sourceUrl: 'https://www.economist.com', title: 'Obligations : les rendements sous surveillance', description: 'Les taux des bons du Trésor américain évoluent dans une fourchette étroite. Focus sur la courbe des taux et ses implications.', tags: ['markets'], time: '6 h', impact: 'medium' }
    ],
    crypto: [
        { source: 'CoinDesk', sourceUrl: 'https://www.coindesk.com', title: 'Bitcoin franchit les 100 000 $ : nouvel ATH historique', description: 'La principale cryptomonnaie établit un nouveau record absolu. L\'adoption institutionnelle et les flux ETF propulsent le cours.', tags: ['crypto'], time: '15 min', impact: 'high' },
        { source: 'Cointelegraph', sourceUrl: 'https://cointelegraph.com', title: 'ETF Bitcoin spot : afflux record de capitaux institutionnels', description: 'BlackRock et Fidelity enregistrent des entrées massives. Plus de 1,5 milliard de dollars de flux nets cette semaine.', tags: ['crypto'], time: '45 min', impact: 'high' },
        { source: 'The Block', sourceUrl: 'https://www.theblock.co', title: 'Ethereum : mise à jour Dencun et impact sur les Layer 2', description: 'La dernière mise à jour réduit considérablement les frais sur les solutions de scalabilité. Arbitrum et Optimism en bénéficient.', tags: ['crypto'], time: '2 h', impact: 'medium' },
        { source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', title: 'Solana : performance exceptionnelle et adoption croissante', description: 'L\'écosystème Solana attire de nouveaux projets DeFi et NFT. Le SOL surperforme le marché cette semaine.', tags: ['crypto'], time: '3 h', impact: 'medium' },
        { source: 'Decrypt', sourceUrl: 'https://decrypt.co', title: 'Régulation MiCA : l\'Europe finalise son cadre crypto', description: 'Les nouvelles régulations européennes entrent en vigueur. Clarification pour les exchanges et les stablecoins.', tags: ['crypto'], time: '4 h', impact: 'high' },
        { source: 'CoinDesk', sourceUrl: 'https://www.coindesk.com', title: 'DeFi : la TVL atteint 150 milliards de dollars', description: 'La finance décentralisée continue sa croissance. Aave et Lido dominent les protocoles de lending et staking.', tags: ['crypto'], time: '5 h', impact: 'medium' },
        { source: 'Reuters', sourceUrl: 'https://www.reuters.com', title: 'Banques centrales : l\'exploration des CBDC s\'accélère', description: 'La BCE et la Fed avancent sur leurs projets de monnaies numériques. Implications pour le secteur crypto.', tags: ['crypto'], time: '6 h', impact: 'medium' },
        { source: 'Cointelegraph', sourceUrl: 'https://cointelegraph.com', title: 'NFT : renaissance du marché avec nouveaux cas d\'usage', description: 'Le secteur NFT rebondit avec des applications dans le gaming et la tokenisation d\'actifs réels.', tags: ['crypto'], time: '7 h', impact: 'low' }
    ],
    commodities: [
        { source: 'Reuters', sourceUrl: 'https://www.reuters.com', title: 'Or : record historique face aux incertitudes géopolitiques', description: 'Le métal précieux atteint 2 100 $/oz. Les banques centrales continuent leurs achats massifs.', tags: ['commodities'], time: '1 h', impact: 'high' },
        { source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', title: 'Pétrole Brent : volatilité sur fond de tensions OPEP+', description: 'Les cours du brut fluctuent après les annonces de l\'Arabie saoudite. Surveillance des stocks stratégiques américains.', tags: ['commodities'], time: '2 h', impact: 'high' },
        { source: 'Financial Times', sourceUrl: 'https://www.ft.com', title: 'Cuivre : demande en hausse pour la transition énergétique', description: 'Le métal rouge profite des investissements dans les renouvelables et les véhicules électriques.', tags: ['commodities'], time: '3 h', impact: 'medium' },
        { source: 'Les Échos', sourceUrl: 'https://www.lesechos.fr', title: 'Gaz naturel : l\'Europe sécurise ses approvisionnements', description: 'Les stocks européens atteignent des niveaux confortables. Les prix se stabilisent.', tags: ['commodities'], time: '4 h', impact: 'medium' },
        { source: 'Reuters', sourceUrl: 'https://www.reuters.com', title: 'Lithium : marché en équilibre après la correction', description: 'Les prix du lithium se stabilisent. La demande des constructeurs de batteries reste soutenue.', tags: ['commodities'], time: '5 h', impact: 'medium' },
        { source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', title: 'Blé : impact des conditions climatiques sur les récoltes', description: 'Les prévisions météorologiques affectent les prix des céréales. Surveillance des exportations ukrainiennes.', tags: ['commodities'], time: '6 h', impact: 'medium' },
        { source: 'Financial Times', sourceUrl: 'https://www.ft.com', title: 'Argent : double attrait industriel et valeur refuge', description: 'Le métal blanc bénéficie de la demande du secteur photovoltaïque et de son statut de valeur refuge.', tags: ['commodities'], time: '7 h', impact: 'low' }
    ],
    etf: [
        { source: 'Morningstar', sourceUrl: 'https://www.morningstar.com', title: 'ETF Bitcoin spot (IBIT) : 50 milliards d\'actifs sous gestion', description: 'Le fonds iShares Bitcoin Trust devient l\'un des ETF à la croissance la plus rapide de l\'histoire.', tags: ['etf'], time: '1 h', impact: 'high' },
        { source: 'ETF.com', sourceUrl: 'https://www.etf.com', title: 'ETF Or (GLD) : flux entrants record face à l\'incertitude', description: 'Les investisseurs se tournent vers l\'or papier pour sécuriser leurs portefeuilles. 890 M$ de flux nets ce mois.', tags: ['etf'], time: '2 h', impact: 'medium' },
        { source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', title: 'ETF IA : Nvidia pousse les fonds technologiques', description: 'Les ETF exposés à l\'intelligence artificielle surperforment. Focus sur les semi-conducteurs et le cloud.', tags: ['etf'], time: '3 h', impact: 'high' },
        { source: 'Financial Times', sourceUrl: 'https://www.ft.com', title: 'ETF ESG : croissance malgré les débats sur le greenwashing', description: 'Les fonds durables continuent d\'attirer des capitaux en Europe. Nouvelles réglementations SFDR.', tags: ['etf'], time: '4 h', impact: 'medium' },
        { source: 'Les Échos', sourceUrl: 'https://www.lesechos.fr', title: 'ETF obligataires : rendements attractifs', description: 'Les fonds obligataires retrouvent de l\'intérêt avec les rendements élevés. Stratégies de duration à surveiller.', tags: ['etf'], time: '5 h', impact: 'medium' },
        { source: 'Seeking Alpha', sourceUrl: 'https://seekingalpha.com', title: 'ETF émergents : valorisations attractives pour 2026', description: 'Les marchés émergents offrent des opportunités de diversification. Focus sur l\'Inde et le Vietnam.', tags: ['etf'], time: '6 h', impact: 'medium' },
        { source: 'Morningstar', sourceUrl: 'https://www.morningstar.com', title: 'ETF dividendes : stratégies de rendement', description: 'Les fonds axés sur les dividendes attirent les investisseurs en quête de revenus réguliers.', tags: ['etf'], time: '7 h', impact: 'low' }
    ]
};

const marketData = [
    { name: 'Bitcoin', symbol: 'BTC', price: 102456.78, change: 3.24 },
    { name: 'Ethereum', symbol: 'ETH', price: 3456.12, change: 2.15 },
    { name: 'Or', symbol: 'XAU', price: 2087.43, change: 0.67 },
    { name: 'Pétrole WTI', symbol: 'WTI', price: 72.45, change: 1.80 },
    { name: 'S&P 500', symbol: 'SPX', price: 4783.23, change: 0.89 },
    { name: 'Argent', symbol: 'XAG', price: 24.56, change: -0.34 }
];

const commodityData = [
    { name: 'Pétrole WTI', price: '$72.45', change: '+1.8%', positive: true },
    { name: 'Gaz naturel', price: '$2.89', change: '-2.3%', positive: false },
    { name: 'Or', price: '$2 087', change: '+0.5%', positive: true },
    { name: 'Argent', price: '$24.56', change: '-0.3%', positive: false },
    { name: 'Cuivre', price: '$3.89', change: '+1.2%', positive: true },
    { name: 'Blé', price: '$612', change: '+0.8%', positive: true },
    { name: 'Lithium', price: '$15 200', change: '+0.4%', positive: true }
];

const etfTableData = [
    { ticker: 'IBIT', name: 'iShares Bitcoin ETF', provider: 'BlackRock', flow: '+$1.2B' },
    { ticker: 'GLD', name: 'SPDR Gold Trust', provider: 'SPDR', flow: '+$890M' },
    { ticker: 'SPY', name: 'S&P 500 ETF', provider: 'SPDR', flow: '+$2.1B' },
    { ticker: 'QQQ', name: 'NASDAQ 100 ETF', provider: 'Invesco', flow: '+$1.5B' }
];

const breakingNews = [
    'Bitcoin depasse les 100 000 $ — Adoption institutionnelle en hausse',
    'Petrole : tensions au Moyen-Orient impactent les cours',
    'Fed : pause dans le cycle de hausse des taux anticipee',
    'Or : nouveau record historique a 2 100 $',
    'ETF Bitcoin : flux record de 1,5 milliard cette semaine',
    'G7 : nouvelles mesures economiques annoncees',
    'BCE : Christine Lagarde s\'exprime sur la politique monetaire'
];

// ============================================
// Common
// ============================================

function setCurrentDate() {
    const el = document.getElementById('current-date');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function initTicker() {
    const el = document.getElementById('ticker-content');
    if (!el) return;
    const html = breakingNews.map(t => '<span class="ticker-item">' + t + '</span>').join('<span class="ticker-separator">|</span>');
    el.innerHTML = html + html;
}

function initSearch() {
    const form = document.getElementById('search-form');
    if (!form) return;
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var query = document.getElementById('search-input').value.trim().toLowerCase();
        if (!query) return;
        var results = [];
        Object.keys(newsDatabase).forEach(function(cat) {
            newsDatabase[cat].forEach(function(article) {
                if (article.title.toLowerCase().indexOf(query) !== -1 || article.description.toLowerCase().indexOf(query) !== -1) {
                    results.push(article);
                }
            });
        });
        displaySearchResults(results, query);
    });
}

function displaySearchResults(results, query) {
    var container = document.getElementById('search-results');
    if (!container) {
        container = document.createElement('div');
        container.id = 'search-results';
        var main = document.querySelector('.main-content .container');
        if (main) main.insertBefore(container, main.firstChild);
    }
    if (results.length === 0) {
        container.innerHTML = '<div class="search-results-header"><h2>Aucun résultat pour « ' + query + ' »</h2><button class="close-search" onclick="this.parentElement.parentElement.remove()">Fermer</button></div>';
        return;
    }
    var html = '<div class="search-results-header"><h2>' + results.length + ' résultat' + (results.length > 1 ? 's' : '') + ' pour « ' + query + ' »</h2><button class="close-search" onclick="this.parentElement.parentElement.remove()">Fermer</button></div><div class="news-grid">';
    results.forEach(function(n) { html += createNewsCardHTML(n); });
    html += '</div>';
    container.innerHTML = html;
    container.scrollIntoView({ behavior: 'smooth' });
}

function createNewsCardHTML(news) {
    var tagLabels = { geopolitics: 'Géopolitique', markets: 'Marchés', crypto: 'Crypto', commodities: 'Mat. Premières', etf: 'ETF', conflicts: 'Conflits', trade: 'Commerce', politics: 'Politique' };
    var tags = (news.tags || []).map(function(t) { return '<span class="tag ' + t + '">' + (tagLabels[t] || t) + '</span>'; }).join('');
    return '<article class="news-card"><div class="news-source"><a href="' + news.sourceUrl + '" target="_blank" class="source-name">' + news.source + '</a><span class="news-time">' + news.time + '</span>' + (news.impact === 'high' ? '<span class="impact-dot"></span>' : '') + '</div><h3 class="news-title">' + news.title + '</h3><p class="news-description">' + news.description + '</p><div class="news-footer"><div class="news-tags">' + tags + '</div><a href="' + news.sourceUrl + '" target="_blank" class="news-link">Lire</a></div></article>';
}

function initCommon() {
    setCurrentDate();
    initTicker();
    initSearch();
}

// ============================================
// Home Page
// ============================================

function initHomePage() {
    initCommon();

    var topStories = document.getElementById('top-stories');
    if (topStories) {
        var featured = [newsDatabase.geopolitics[0], newsDatabase.crypto[0], newsDatabase.commodities[0]];
        topStories.innerHTML = '<div class="top-stories-grid">' + featured.map(function(n, i) {
            return '<article class="top-story' + (i === 0 ? ' top-story-main' : '') + '"><a href="' + n.sourceUrl + '" target="_blank" class="source-name">' + n.source + '</a><h3>' + n.title + '</h3><p>' + n.description + '</p><span class="news-time">' + n.time + '</span></article>';
        }).join('') + '</div>';
    }

    var latestNews = document.getElementById('latest-news');
    if (latestNews) {
        var all = [];
        Object.keys(newsDatabase).forEach(function(k) { all = all.concat(newsDatabase[k]); });
        all.sort(function() { return 0.5 - Math.random(); });
        all = all.slice(0, 10);
        latestNews.innerHTML = all.map(function(n) {
            return '<article class="news-list-item"><div class="news-list-source"><a href="' + n.sourceUrl + '" target="_blank" class="source-name">' + n.source + '</a><span class="news-time">' + n.time + '</span></div><h3><a href="' + n.sourceUrl + '" target="_blank">' + n.title + '</a></h3><p>' + n.description + '</p></article>';
        }).join('');
    }

    renderMarketTable();
}

function renderMarketTable() {
    var table = document.getElementById('market-table');
    if (!table) return;
    table.innerHTML = marketData.map(function(m) {
        return '<div class="market-row"><span class="market-row-name">' + m.name + '</span><span class="market-row-price">$' + m.price.toLocaleString('fr-FR') + '</span><span class="market-row-change ' + (m.change > 0 ? 'positive' : 'negative') + '">' + (m.change > 0 ? '+' : '') + m.change.toFixed(2) + '%</span></div>';
    }).join('');
}

// ============================================
// Category Pages
// ============================================

function initCategoryPage(category) {
    initCommon();
    var container = document.getElementById('page-news');
    if (!container) return;
    var articles = newsDatabase[category] || [];
    container.innerHTML = articles.map(function(n) { return createNewsCardHTML(n); }).join('');
    initFilters(container, articles);
    if (category === 'commodities') renderCommodityTable();
    if (category === 'etf') renderETFTable();
}

function initFilters(container, articles) {
    var btns = document.querySelectorAll('.filter-btn');
    if (!btns.length) return;
    btns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            btns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var filter = btn.getAttribute('data-filter');
            if (filter === 'all') {
                container.innerHTML = articles.map(function(n) { return createNewsCardHTML(n); }).join('');
            } else {
                var filtered = articles.filter(function(n) { return n.tags.indexOf(filter) !== -1; });
                container.innerHTML = filtered.length ? filtered.map(function(n) { return createNewsCardHTML(n); }).join('') : '<p class="no-results">Aucun article dans cette catégorie.</p>';
            }
        });
    });
}

function renderCommodityTable() {
    var table = document.getElementById('commodity-table');
    if (!table) return;
    table.innerHTML = '<table class="data-table"><thead><tr><th>Matière première</th><th>Prix</th><th>Variation</th></tr></thead><tbody>' + commodityData.map(function(c) {
        return '<tr><td>' + c.name + '</td><td>' + c.price + '</td><td class="' + (c.positive ? 'positive' : 'negative') + '">' + c.change + '</td></tr>';
    }).join('') + '</tbody></table>';
}

function renderETFTable() {
    var table = document.getElementById('etf-table');
    if (!table) return;
    table.innerHTML = '<table class="data-table"><thead><tr><th>Ticker</th><th>Nom</th><th>Fournisseur</th><th>Flux</th></tr></thead><tbody>' + etfTableData.map(function(e) {
        return '<tr><td><strong>' + e.ticker + '</strong></td><td>' + e.name + '</td><td>' + e.provider + '</td><td class="positive">' + e.flow + '</td></tr>';
    }).join('') + '</tbody></table>';
}
