// ============================================
// GéoFinance — Multi-page Application
// Updated: 4 février 2026
// ============================================

// --- News Database (enriched, current) ---
const newsDatabase = {
    geopolitics: [
        { source: 'NBC News', sourceUrl: 'https://www.nbcnews.com', title: 'Tarifs sur le Groenland : Trump menace l\'UE et le Royaume-Uni de sanctions commerciales', description: 'Le président américain exige le soutien européen pour ses ambitions sur le Groenland, déclenchant un plongeon des marchés avec 1 200 milliards de capitalisation effacés en une séance.', tags: ['geopolitics', 'trade'], time: '2 h', impact: 'high' },
        { source: 'Reuters', sourceUrl: 'https://www.reuters.com', title: 'Cour suprême US : la légalité des tarifs IEEPA en question', description: 'La Cour suprême examine le fondement juridique des tarifs imposés par Trump. Un arrêt défavorable pourrait forcer le remboursement des droits déjà perçus.', tags: ['geopolitics', 'politics'], time: '3 h', impact: 'high' },
        { source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', title: 'USA : stockpile stratégique de 12 milliards pour contrer la Chine sur les minéraux', description: 'Washington lance un programme de 12 milliards de dollars pour constituer des réserves de minéraux critiques, réduisant sa dépendance vis-à-vis de Pékin.', tags: ['geopolitics', 'trade'], time: '4 h', impact: 'high' },
        { source: 'Financial Times', sourceUrl: 'https://www.ft.com', title: 'Inde : accords commerciaux successifs avec l\'UE et les USA', description: 'New Delhi signe coup sur coup des accords commerciaux avec Bruxelles et Washington, se positionnant comme pivot stratégique dans la guerre économique sino-américaine.', tags: ['geopolitics', 'trade'], time: '5 h', impact: 'medium' },
        { source: 'Al Jazeera', sourceUrl: 'https://www.aljazeera.com', title: 'Venezuela : implications géopolitiques de l\'opération militaire américaine', description: 'La capture du président Maduro par les forces spéciales américaines redéfinit l\'équilibre géopolitique en Amérique latine. Les marchés du pétrole réagissent.', tags: ['geopolitics', 'conflicts'], time: '6 h', impact: 'high' },
        { source: 'BBC News', sourceUrl: 'https://www.bbc.com/news', title: 'Royaume-Uni : 400 millions de livres de contrats en Éthiopie liés à la migration', description: 'Londres déploie des accords énergétiques en Éthiopie dans le cadre d\'une stratégie diplomatique combinant développement et politique migratoire.', tags: ['geopolitics', 'politics'], time: '7 h', impact: 'medium' },
        { source: 'Le Monde', sourceUrl: 'https://www.lemonde.fr', title: 'WEF 2026 : la confrontation géoéconomique, premier risque mondial', description: 'Le Global Risks Report 2026 du Forum économique mondial classe la confrontation géoéconomique comme le risque numéro un, en hausse de huit positions.', tags: ['geopolitics', 'politics'], time: '8 h', impact: 'high' },
        { source: 'Foreign Affairs', sourceUrl: 'https://www.foreignaffairs.com', title: 'Fragmentation de l\'ordre mondial : analyse structurelle des blocs émergents', description: 'La compétition USA-Chine, le rôle pivot de l\'Inde, et la montée des puissances moyennes redessinent l\'architecture des relations internationales.', tags: ['geopolitics', 'politics'], time: '10 h', impact: 'medium' },
        { source: 'CNBC', sourceUrl: 'https://www.cnbc.com', title: 'Le TACO trade : quand Trump recule, les marchés rebondissent', description: 'Le pattern "Trump Always Chickens Out" se confirme : menace maximale, volatilité, puis désescalade. Les traders exploitent ce cycle à leur avantage.', tags: ['geopolitics', 'trade'], time: '12 h', impact: 'medium' },
        { source: 'The Economist', sourceUrl: 'https://www.economist.com', title: 'Tarifs pharmaceutiques : la prochaine bombe à 200 % de droits de douane', description: 'L\'administration Trump signale des tarifs potentiels allant jusqu\'à 200 % sur les produits pharmaceutiques importés d\'ici fin 2026.', tags: ['geopolitics', 'trade'], time: '14 h', impact: 'high' }
    ],
    markets: [
        { source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', title: 'Wall Street : le S&P 500 perd 1 200 milliards en une séance sur les tarifs Groenland', description: 'Le S&P 500 chute de 2,1 %, le Nasdaq de 2,4 %, le Dow Jones de 870 points. Pire séance depuis octobre sur fond de menaces tarifaires.', tags: ['markets'], time: '1 h', impact: 'high' },
        { source: 'CNBC', sourceUrl: 'https://www.cnbc.com', title: 'Kevin Warsh nommé à la Fed : repricing immédiat des anticipations dollar', description: 'La nomination surprise de Kevin Warsh à la présidence de la Réserve fédérale provoque un ajustement des positions sur le dollar et les taux.', tags: ['markets'], time: '3 h', impact: 'high' },
        { source: 'Wall Street Journal', sourceUrl: 'https://www.wsj.com', title: 'Manufacturing rebound : les PMI remontent à mesure que les craintes tarifaires s\'apaisent', description: 'Les indices manufacturiers rebondissent dans les économies clés. Signal positif tempéré par l\'incertitude persistante de la politique commerciale.', tags: ['markets'], time: '4 h', impact: 'medium' },
        { source: 'Les Échos', sourceUrl: 'https://www.lesechos.fr', title: 'Euro Stoxx 50 : l\'automobile allemande sous pression des tarifs américains', description: 'Goldman Sachs estime qu\'un tarif de 10 % réduirait le PIB réel allemand de 0,2 %. BMW, Mercedes et Volkswagen en première ligne.', tags: ['markets'], time: '5 h', impact: 'medium' },
        { source: 'Financial Times', sourceUrl: 'https://www.ft.com', title: 'Inflation collante : le risque d\'un pivot hawkish de la Fed', description: 'Si la pression inflationniste persiste, un resserrement rapide des conditions financières menacerait les actifs risqués. J.P. Morgan appelle à l\'agilité.', tags: ['markets'], time: '6 h', impact: 'high' },
        { source: 'MarketWatch', sourceUrl: 'https://www.marketwatch.com', title: 'VIX en hausse : la volatilité reprend ses droits après la trêve de janvier', description: 'L\'indice de la peur repasse au-dessus de 20. Les options de couverture sur indices enregistrent des volumes records.', tags: ['markets'], time: '7 h', impact: 'medium' },
        { source: 'Reuters', sourceUrl: 'https://www.reuters.com', title: 'Dollar index : affaiblissement sur fond d\'incertitude politique', description: 'Le DXY recule face à l\'euro et au yen. Les marchés anticipent une politique monétaire moins prévisible sous la nouvelle direction de la Fed.', tags: ['markets'], time: '8 h', impact: 'medium' },
        { source: 'Barron\'s', sourceUrl: 'https://www.barrons.com', title: 'Midterms 2026 : comment les marchés se positionnent', description: 'Historiquement, les marchés gagnent en moyenne 15 % dans les 12 mois suivant les midterms. Mais le contexte géopolitique actuel brouille les repères.', tags: ['markets'], time: '10 h', impact: 'medium' }
    ],
    crypto: [
        { source: 'CoinDesk', sourceUrl: 'https://www.coindesk.com', title: 'Bitcoin sous 73 000 $ : plus bas de 16 mois dans un sell-off massif', description: 'Le BTC touche 72 884 $, en chute de 6 % sur la journée et de 40 % depuis son pic 2025. Liquidations de 2,56 milliards de dollars en 24 heures.', tags: ['crypto'], time: '1 h', impact: 'high' },
        { source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', title: 'Bitcoin sous 80 000 $ : crise de confiance chez les institutionnels', description: 'La cassure du seuil psychologique des 80 000 $ marque un tournant. Bloomberg parle d\'une "nouvelle crise de confiance" dans l\'écosystème crypto.', tags: ['crypto'], time: '2 h', impact: 'high' },
        { source: 'CoinDesk', sourceUrl: 'https://www.coindesk.com', title: 'Bitcoin vs Or : le BTC échoue à rebondir pendant que les métaux précieux explosent', description: 'L\'or frôle les 5 000 $ l\'once pendant que le bitcoin retombe sous 77 000 $. La thèse du "digital gold" mise à mal.', tags: ['crypto'], time: '3 h', impact: 'high' },
        { source: 'CNBC', sourceUrl: 'https://www.cnbc.com', title: 'ETF Bitcoin spot : 1,7 milliard de dollars de sorties en deux semaines', description: 'Deuxième semaine consécutive de flux sortants pour les ETF Bitcoin selon CoinShares. Les institutionnels réduisent leur exposition.', tags: ['crypto'], time: '4 h', impact: 'high' },
        { source: 'Cointelegraph', sourceUrl: 'https://cointelegraph.com', title: 'Bitwise CIO : "Nous sommes en crypto winter depuis janvier 2025"', description: 'Matt Hougan compare la situation actuelle aux bear markets de 2018 et 2022. Il estime que le creux pourrait être atteint dans les prochaines semaines.', tags: ['crypto'], time: '5 h', impact: 'medium' },
        { source: 'The Block', sourceUrl: 'https://www.theblock.co', title: 'Ethereum à 2 200 $, Solana sous 100 $ : contagion baissière généralisée', description: 'L\'ensemble de l\'écosystème crypto souffre. ETH perd 6,5 %, SOL 5,5 %. Les altcoins subissent des corrections à deux chiffres.', tags: ['crypto'], time: '6 h', impact: 'medium' },
        { source: 'Decrypt', sourceUrl: 'https://decrypt.co', title: 'MSTR, COIN, GLXY : les actions crypto en chute libre', description: 'Strategy (MSTR) continue de creuser ses plus bas. Coinbase (COIN) perd 2 %, Galaxy Digital (GLXY) chute de 12 % après des résultats Q4 décevants.', tags: ['crypto'], time: '7 h', impact: 'medium' },
        { source: 'CoinShares', sourceUrl: 'https://coinshares.com', title: 'Standard Chartered revoit son objectif BTC à 150 000 $ (contre 300 000 $ initialement)', description: 'La banque d\'investissement réduit ses prévisions de moitié. La fourchette de volatilité attendue est de 75 000 $ à 150 000 $ pour 2026.', tags: ['crypto'], time: '8 h', impact: 'medium' },
        { source: 'Reuters', sourceUrl: 'https://www.reuters.com', title: 'Stablecoins et tokenisation : les fondamentaux restent solides malgré le bear market', description: 'Malgré la correction, Dragonfly Capital note que les stablecoins et la tokenisation d\'actifs réels continuent de progresser chez les institutionnels.', tags: ['crypto'], time: '10 h', impact: 'low' }
    ],
    commodities: [
        { source: 'CNBC', sourceUrl: 'https://www.cnbc.com', title: 'Or : record historique au-delà de 5 100 $ l\'once', description: 'L\'or spot atteint 5 136 $ l\'once, porté par les achats des banques centrales et la fuite vers les valeurs refuges. +64 % sur un an.', tags: ['commodities'], time: '1 h', impact: 'high' },
        { source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', title: 'Or et Groenland : la menace tarifaire propulse le métal jaune au-delà de 4 800 $', description: 'Les tensions USA-Europe sur le Groenland alimentent un rush vers les valeurs refuges. HSBC voit l\'or à 5 000 $ au premier semestre.', tags: ['commodities'], time: '2 h', impact: 'high' },
        { source: 'Kitco News', sourceUrl: 'https://www.kitco.com', title: 'Argent : le métal blanc suit l\'or dans un rally généralisé des métaux précieux', description: 'L\'argent bénéficie du double attrait de valeur refuge et de demande industrielle (photovoltaïque). Les analystes visent 35 $ l\'once.', tags: ['commodities'], time: '3 h', impact: 'medium' },
        { source: 'Reuters', sourceUrl: 'https://www.reuters.com', title: 'Pétrole : l\'opération Venezuela et les tensions iraniennes soutiennent les cours', description: 'Le brut WTI se maintient au-dessus de 78 $ le baril. Les actions militaires américaines ajoutent une prime de risque géopolitique.', tags: ['commodities'], time: '4 h', impact: 'high' },
        { source: 'Financial Times', sourceUrl: 'https://www.ft.com', title: 'Cuivre : la demande de transition énergétique compense le ralentissement chinois', description: 'Le métal rouge reste soutenu par les investissements massifs dans les renouvelables et les véhicules électriques malgré le freinage économique chinois.', tags: ['commodities'], time: '6 h', impact: 'medium' },
        { source: 'S&P Global', sourceUrl: 'https://www.spglobal.com', title: 'Lithium : stabilisation des prix après la correction de 2025', description: 'Le marché du lithium retrouve un équilibre. La demande des fabricants de batteries reste soutenue, mais l\'offre a rattrapé.', tags: ['commodities'], time: '7 h', impact: 'medium' },
        { source: 'J.P. Morgan', sourceUrl: 'https://www.jpmorgan.com', title: 'Prévisions or 2026 : J.P. Morgan vise 5 055 $ en moyenne au Q4', description: 'La banque prévoit un prix moyen de 5 055 $/oz au dernier trimestre 2026, montant vers 5 400 $ fin 2027. Demande des banques centrales : 585 tonnes/trimestre.', tags: ['commodities'], time: '8 h', impact: 'medium' }
    ],
    etf: [
        { source: 'CoinShares', sourceUrl: 'https://coinshares.com', title: 'ETF Bitcoin spot : deux semaines de sorties consécutives, 1,7 milliard de flux négatifs', description: 'Les ETF Bitcoin spot subissent une hémorragie. Les investisseurs institutionnels réduisent leur exposition au risque crypto.', tags: ['etf'], time: '1 h', impact: 'high' },
        { source: 'Bloomberg', sourceUrl: 'https://www.bloomberg.com', title: 'ETF Or (GLD/IAU) : afflux records sur fond de crise géopolitique', description: 'Les ETF adossés à l\'or enregistrent leurs plus gros flux entrants depuis 2020. L\'or physique reste le refuge numéro un des institutionnels.', tags: ['etf'], time: '2 h', impact: 'high' },
        { source: 'Morningstar', sourceUrl: 'https://www.morningstar.com', title: 'ETF obligataires court terme : la stratégie défensive qui attire les capitaux', description: 'Les ETF obligataires à duration courte captent des flux records. Les investisseurs cherchent du rendement avec un risque de taux limité.', tags: ['etf'], time: '3 h', impact: 'medium' },
        { source: 'ETF.com', sourceUrl: 'https://www.etf.com', title: 'ETF IA : Nvidia pousse les fonds tech malgré la volatilité ambiante', description: 'Les ETF exposés à l\'intelligence artificielle surperforment le marché. NVDA, AMD, AVGO représentent les principales positions.', tags: ['etf'], time: '4 h', impact: 'medium' },
        { source: 'Financial Times', sourceUrl: 'https://www.ft.com', title: 'ETF ESG : flux en hausse en Europe malgré le backlash américain', description: 'Les fonds ESG européens continuent de croître alors que le mouvement anti-ESG prend de l\'ampleur aux États-Unis. Divergence transatlantique.', tags: ['etf'], time: '5 h', impact: 'medium' },
        { source: 'Seeking Alpha', sourceUrl: 'https://seekingalpha.com', title: 'ETF marchés émergents : l\'Inde et le Vietnam en tête des convictions', description: 'Les accords commerciaux de l\'Inde avec l\'UE et les USA renforcent l\'attractivité des ETF émergents. Valorisations attractives.', tags: ['etf'], time: '6 h', impact: 'medium' },
        { source: 'Les Échos', sourceUrl: 'https://www.lesechos.fr', title: 'SPY vs QQQ : la divergence value/growth s\'accentue', description: 'Le SPY (S&P 500) résiste mieux que le QQQ (Nasdaq 100) dans l\'environnement de hausse des taux. La rotation sectorielle se confirme.', tags: ['etf'], time: '8 h', impact: 'medium' }
    ]
};

// Market data (updated Feb 2026)
const marketData = [
    { name: 'Bitcoin', symbol: 'BTC', price: 75420, change: -5.82 },
    { name: 'Ethereum', symbol: 'ETH', price: 2198, change: -6.50 },
    { name: 'Or', symbol: 'XAU', price: 5136, change: 2.30 },
    { name: 'Argent', symbol: 'XAG', price: 32.45, change: 1.85 },
    { name: 'Pétrole WTI', symbol: 'WTI', price: 78.32, change: 1.20 },
    { name: 'S&P 500', symbol: 'SPX', price: 5842, change: -2.10 },
    { name: 'Nasdaq 100', symbol: 'NDX', price: 20456, change: -2.40 },
    { name: 'Dollar Index', symbol: 'DXY', price: 103.45, change: -0.68 }
];

const commodityData = [
    { name: 'Or', price: '$5 136', change: '+2.3%', positive: true },
    { name: 'Argent', price: '$32.45', change: '+1.9%', positive: true },
    { name: 'Pétrole WTI', price: '$78.32', change: '+1.2%', positive: true },
    { name: 'Pétrole Brent', price: '$82.10', change: '+0.9%', positive: true },
    { name: 'Gaz naturel', price: '$3.12', change: '-1.8%', positive: false },
    { name: 'Cuivre', price: '$4.15', change: '+0.7%', positive: true },
    { name: 'Lithium', price: '$14 800', change: '+0.3%', positive: true },
    { name: 'Blé', price: '$645', change: '-0.5%', positive: false }
];

const etfTableData = [
    { ticker: 'GLD', name: 'SPDR Gold Trust', provider: 'SPDR', flow: '+$2.8B' },
    { ticker: 'SPY', name: 'S&P 500 ETF', provider: 'SPDR', flow: '+$1.9B' },
    { ticker: 'QQQ', name: 'NASDAQ 100 ETF', provider: 'Invesco', flow: '-$420M' },
    { ticker: 'IBIT', name: 'iShares Bitcoin ETF', provider: 'BlackRock', flow: '-$850M' },
    { ticker: 'SHY', name: 'iShares 1-3 Year Treasury', provider: 'iShares', flow: '+$1.2B' },
    { ticker: 'BOTZ', name: 'Global Robotics & AI ETF', provider: 'Global X', flow: '+$680M' }
];

const breakingNews = [
    'Or au-dessus de 5 100 $/oz -- Record historique absolu',
    'Bitcoin chute sous 73 000 $, plus bas depuis novembre 2024',
    'Tarifs Trump Groenland : 1 200 milliards effaces du S&P 500',
    'Kevin Warsh nomme a la tete de la Fed',
    'USA : stockpile strategique de 12 milliards de mineraux contre la Chine',
    'Nvidia Q3 2026 : 57 milliards de revenus, +62% sur un an',
    'Inde signe des accords commerciaux avec l\'UE et les USA',
    'WEF 2026 : confrontation geoeconomique, premier risque mondial'
];

// ============================================
// Common
// ============================================

function setCurrentDate() {
    var el = document.getElementById('current-date');
    if (!el) return;
    var now = new Date();
    el.textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function initTicker() {
    var el = document.getElementById('ticker-content');
    if (!el) return;
    var html = breakingNews.map(function(t) { return '<span class="ticker-item">' + t + '</span>'; }).join('<span class="ticker-separator">|</span>');
    el.innerHTML = html + html;
}

function initSearch() {
    var form = document.getElementById('search-form');
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
        // Sort by impact first (high > medium > low), then show top 12
        var impactOrder = { high: 0, medium: 1, low: 2 };
        all.sort(function(a, b) { return (impactOrder[a.impact] || 2) - (impactOrder[b.impact] || 2); });
        all = all.slice(0, 12);
        latestNews.innerHTML = all.map(function(n) {
            return '<article class="news-list-item"><div class="news-list-source"><a href="' + n.sourceUrl + '" target="_blank" class="source-name">' + n.source + '</a><span class="news-time">' + n.time + '</span>' + (n.impact === 'high' ? '<span class="impact-dot"></span>' : '') + '</div><h3><a href="' + n.sourceUrl + '" target="_blank">' + n.title + '</a></h3><p>' + n.description + '</p></article>';
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
        var isPositive = e.flow.indexOf('+') === 0;
        return '<tr><td><strong>' + e.ticker + '</strong></td><td>' + e.name + '</td><td>' + e.provider + '</td><td class="' + (isPositive ? 'positive' : 'negative') + '">' + e.flow + '</td></tr>';
    }).join('') + '</tbody></table>';
}
