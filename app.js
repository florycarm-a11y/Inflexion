// GéoFinance — v3.0 — Optimized, real URLs, trader-grade content
// Updated: 4 février 2026

const categoryTrends = {
    geopolitics: 'Le risk-off domine. Les tarifs Groenland ont déclenché le pire sell-off depuis octobre sur le S&P 500 (−2,1%). Le TACO pattern (Trump Always Chickens Out) se confirme avec la pause du 22 janvier, mais le taux effectif moyen des tarifs US atteint 10,1% — plus haut depuis 1946. La nomination de Warsh à la Fed ajoute une couche d\'incertitude monétaire. Le WEF classe la confrontation géoéconomique comme risque #1 mondial. Positionnement : long gold, short duration, sous-pondération Europe.',
    markets: 'Régime de volatilité élevée. Le VIX repasse au-dessus de 20. Le S&P 500 a effacé ses gains 2026 en une séance sur les tarifs Groenland avant de rebondir +1,2% sur le framework deal. La nomination Warsh est lue hawkish par le marché : le dollar et les yields courts montent, les anticipations de cuts reculent. Nvidia ($57Mds de CA au Q3, +62% YoY) reste le seul pilier haussier crédible. Le consensus voit un marché range-bound tant que le risque tarifaire persiste.',
    crypto: 'Crypto winter confirmé. Le BTC a touché $72 884 le 3 février, −40% depuis le pic d\'octobre 2025 à $126 000. Liquidations de $2,56Mds en 24h (top 10 historique). Les ETF BTC spot enregistrent $1,7Md de sorties en deux semaines (CoinShares). Le CIO de Bitwise compare la situation aux bear markets de 2018 et 2022. Pendant ce temps, l\'or pulvérise $5 100/oz. La thèse du « digital gold » ne tient plus — le BTC reste un actif risk-on à fort bêta, corrélé au Nasdaq.',
    commodities: 'L\'or est en régime parabolique : $5 136/oz, +64% sur un an, meilleure performance depuis 1979. Les banques centrales achètent 585 tonnes/trimestre (J.P. Morgan). Goldman Sachs relève son objectif à $5 400, UBS vise $6 200. L\'argent franchit $100/oz pour la première fois. Le pétrole WTI tient au-dessus de $78 sur la prime géopolitique Venezuela/Iran. Seul le gaz naturel et les céréales sont en repli. Biais : long métaux précieux, neutre énergie.',
    etf: 'Rotation massive des flux. Les ETF or (GLD, IAU) captent leurs plus gros flux depuis 2020. À l\'inverse, les ETF BTC spot (IBIT, FBTC) subissent $1,7Md de sorties nettes. Les ETF obligataires court terme (SHY) profitent du flight-to-quality. Les ETF IA (BOTZ, SMH) surperforment malgré la volatilité ambiante, portés par Nvidia et Broadcom. Le SPY résiste mieux que le QQQ — la rotation value/growth s\'accentue.'
};

const newsDatabase = {
    geopolitics: [
        { source: 'NBC News', url: 'https://www.nbcnews.com/business/economy/trump-denmark-european-tariffs-greenland-deal-rcna254551', title: 'Tarifs Groenland : Trump impose 10% sur 8 pays européens, escalade à 25% en juin', description: 'Tarifs conditionnés au soutien européen pour l\'acquisition du Groenland. Danemark, France, Allemagne, UK, Norvège, Suède, Pays-Bas et Finlande visés. Le Dow lâche 870 points, le S&P efface ses gains 2026.', tags: ['geopolitics', 'trade'], time: '17 jan.', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-20/wall-street-s-calm-shattered-by-greenland-and-japan-shocks', title: 'Wall Street : le calme brisé par le choc Groenland — S&P 500 −2,1%', description: 'Pire séance depuis octobre. Futures S&P −1,1%, Nasdaq 100 −1,4%. Euro Stoxx 600 au plus bas en 2 mois. Gold franchit $4 660/oz dans la foulée. Le risque tarifaire redevient le driver dominant.', tags: ['geopolitics', 'markets'], time: '20 jan.', impact: 'high' },
        { source: 'NBC News', url: 'https://www.nbcnews.com/business/economy/eu-trade-deal-trump-greenland-tariff-rcna255199', title: 'L\'UE suspend l\'accord commercial avec Washington en représailles', description: 'Le Parlement européen gèle la ratification de l\'accord commercial été 2025. Un paquet de rétorsions de $110Mds est à l\'étude. Bernd Lange : « Nous n\'avons plus d\'alternative. »', tags: ['geopolitics', 'trade'], time: '21 jan.', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-30/trump-picks-a-reinvented-kevin-warsh-to-lead-the-federal-reserve', title: 'Trump nomme Kevin Warsh à la Fed : lecture hawkish, dollar et yields en hausse', description: 'Warsh promet un « changement de régime » : réduction du bilan, focus inflation, productivité IA. Le marché lit hawkish. Treasury yields en hausse, short-dated rallye. Le sénateur Tillis menace de bloquer la confirmation.', tags: ['geopolitics', 'politics'], time: '30 jan.', impact: 'high' },
        { source: 'NBC News', url: 'https://www.nbcnews.com/business/economy/trump-pauses-greenland-tariffs-rcna255270', title: 'Trump suspend les tarifs Groenland — le TACO trade se confirme', description: 'Pause sur les droits de douane après un « framework deal » avec l\'OTAN. S&P rebondit +1,2%, meilleure séance depuis novembre. Pattern récurrent : menace max → volatilité → recul → rally de soulagement.', tags: ['geopolitics', 'trade'], time: '22 jan.', impact: 'high' }
    ],
    markets: [
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-20/asian-stocks-set-to-fall-as-global-selloff-deepens-markets-wrap', title: 'Sell-off global : le S&P 500 efface ses gains 2026, VIX au plus haut depuis novembre', description: 'Les tarifs Groenland déclenchent une vague de ventes coordonnée sur toutes les classes d\'actifs risqués. Le VIX passe au-dessus de 20. Les flux se dirigent vers l\'or (+2,2%), les Treasuries et le yen.', tags: ['markets'], time: '20 jan.', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-30/trump-picks-kevin-warsh-as-fed-chair-wall-street-reacts', title: 'Wall Street réagit à Warsh : choix hawkish, dollar fort, courbe qui se pentifie', description: 'Le consensus sell-side lit la nomination comme une résistance à l\'expansion du bilan et un soutien au dollar. Les anticipations de cuts reculent. Les yields courts rallient sur le soulagement — Trump n\'a pas choisi un dovish extrême.', tags: ['markets'], time: '30 jan.', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-18/trump-tariff-threat-to-weigh-on-risk-sentiment-european-stocks', title: 'Tarifs Trump : l\'automobile allemande en première ligne, Euro Stoxx sous pression', description: 'Goldman estime qu\'un tarif de 10% réduirait le PIB allemand de 0,2%. BMW, Mercedes, VW directement exposés. Le DAX sous-performe le CAC 40. Les credit spreads européens s\'écartent.', tags: ['markets'], time: '18 jan.', impact: 'medium' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2025/11/19/nvidia-nvda-earnings-report-q3-2026.html', title: 'Nvidia Q3 : $57Mds de CA (+62% YoY), guidance Q4 à $65Mds — le seul pilier du marché', description: 'EPS $1,30 vs $1,25 attendu. Data center : $43Mds en compute, $8,2Mds en networking. Backlog de $500Mds sur Blackwell/Rubin. Le titre monte de 4% en after-hours. L\'IA reste le dernier rempart haussier des indices.', tags: ['markets'], time: '19 nov. 2025', impact: 'high' }
    ],
    crypto: [
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/02/03/bitcoin-price-today.html', title: 'Bitcoin casse $73 000 — plus bas de 16 mois, −40% depuis le pic octobre', description: 'BTC touche $72 884, −6% sur la journée, −16% YTD. Rotation massive hors des actifs risk-on. Les données macro US retardées par le shutdown partiel ajoutent à l\'incertitude. Le BTC sort du top 10 des actifs mondiaux par capitalisation.', tags: ['crypto'], time: '3 fév.', impact: 'high' },
        { source: 'CoinDesk', url: 'https://www.coindesk.com/markets/2026/02/01/this-is-absolutely-insane-bitcoin-s-weekend-crash-exposes-the-cracks-beneath-crypto-s-latest-boom', title: 'Crash du weekend : $800Mds de valeur effacés, $2,56Mds de liquidations en 24h', description: 'BTC plonge à $75 700 en thin weekend liquidity. 10e plus gros événement de liquidation de l\'histoire. Tensions Iran, nomination Warsh et dollar fort amplifient le sell-off. ETH −6,5% à $2 200, SOL sous $100.', tags: ['crypto'], time: '1 fév.', impact: 'high' },
        { source: 'CoinShares', url: 'https://coinshares.com/us/insights/research-data/fund-flows-02-02-26/', title: 'Flux ETF crypto : $1,7Md de sorties en deux semaines, sentiment en capitulation', description: 'BTC : −$1,32Md. ETH : −$308M. XRP et SOL aussi en sorties. Les flux YTD basculent en négatif à −$1Md. AuM en recul de $73Mds depuis les highs d\'octobre. Short BTC : +$14,5M d\'inflows — le hedge bearish s\'installe.', tags: ['crypto'], time: '2 fév.', impact: 'high' },
        { source: 'CoinDesk', url: 'https://www.coindesk.com/markets/2026/02/03/bitcoin-bounce-fails-with-price-falling-back-below-usd77-000-while-precious-metals-renew-surge', title: 'Or vs Bitcoin : la divergence s\'accentue — le BTC n\'est pas une valeur refuge', description: 'Le rebond BTC échoue à $77 000 pendant que l\'or reprend sa marche vers $5 000. Les métaux précieux absorbent les flux safe-haven que le BTC ne capte pas. La corrélation BTC-Nasdaq reste élevée, celle avec l\'or est nulle.', tags: ['crypto'], time: '3 fév.', impact: 'medium' }
    ],
    commodities: [
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/26/gold-races-to-5100-record-peak-on-safe-haven-demand.html', title: 'Or : record absolu à $5 110/oz — +64% sur un an, meilleure performance depuis 1979', description: 'Spot gold +2,2% à $5 094 après un pic à $5 110. Goldman relève son objectif à $5 400 (dec. 2026). Achats banques centrales : 60 tonnes/mois vs 17 tonnes pré-2022. UBS vise $6 200 sur les 3 premiers trimestres.', tags: ['commodities'], time: '26 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/12/gold-record-haven-powell-venezuela-iran.html', title: 'Or à $4 600 : enquête Powell + Venezuela + Iran = triple catalyseur safe-haven', description: 'Le métal jaune franchit $4 600 sur la convergence de trois flashpoints. L\'enquête contre le président de la Fed, l\'opération militaire au Venezuela et les tensions iraniennes créent une tempête parfaite pour les métaux précieux.', tags: ['commodities'], time: '12 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/23/gold-prices-ease-on-profit-taking-after-nearing-5000-mark.html', title: 'Argent au-dessus de $100/oz pour la première fois — le métal blanc entre en territoire historique', description: 'L\'argent profite du double moteur refuge + demande industrielle (photovoltaïque, électronique). Le ratio or/argent se compresse. Les analystes visent $120/oz si la dynamique des métaux précieux se maintient.', tags: ['commodities'], time: '23 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/27/gold-silver-rise-to-near-record-highs-on-safe-haven-demand.html', title: 'Métaux précieux : +18% YTD en janvier, la meilleure ouverture d\'année depuis 2008', description: 'L\'or et l\'argent enregistrent leur meilleur mois de janvier depuis la crise financière. Les ETF or captent des flux records. MKS PAMP : « L\'or est un trade séculaire, pas un blow-off top. »', tags: ['commodities'], time: '27 jan.', impact: 'medium' }
    ],
    etf: [
        { source: 'CoinShares', url: 'https://coinshares.com/us/insights/research-data/fund-flows-02-02-26/', title: 'ETF crypto : $1,7Md de sorties nettes — IBIT et FBTC en tête des rachats', description: 'Deuxième semaine de flux négatifs. Les ETF BTC spot US perdent $1,65Md. Les short BTC ETF captent $14,5M. AuM total en recul de $73Mds depuis octobre. Seuls les ETF tokenized precious metals résistent.', tags: ['etf'], time: '2 fév.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/26/gold-races-to-5100-record-peak-on-safe-haven-demand.html', title: 'ETF Or (GLD, IAU) : afflux records — le flight-to-quality en action', description: 'Les ETF adossés à l\'or physique enregistrent leurs plus gros flux entrants depuis mars 2020. Goldman note que les achats institutionnels sont devenus « sticky » — les positions ne sont plus tactiques mais structurelles.', tags: ['etf'], time: '26 jan.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2025/11/19/nvidia-nvda-earnings-report-q3-2026.html', title: 'ETF IA (BOTZ, SMH) : Nvidia tire les fonds tech malgré la volatilité', description: 'Les ETF exposés aux semi-conducteurs et à l\'IA surperforment le marché. NVDA ($57Mds Q3), AMD et AVGO constituent le moteur. Le SMH gagne 8% sur un mois vs −2% pour le SPY.', tags: ['etf'], time: '20 nov. 2025', impact: 'medium' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-30/trump-picks-kevin-warsh-as-fed-chair-wall-street-reacts', title: 'ETF obligataires (SHY, BIL) : la duration courte capte le flight-to-quality', description: 'La nomination Warsh et l\'incertitude tarifaire poussent les capitaux vers les Treasuries court terme. Les ETF SHY et BIL enregistrent des flux entrants records. Le positionnement reflète un marché qui se couvre sans prendre de risque directionnel.', tags: ['etf'], time: '30 jan.', impact: 'medium' }
    ]
};

const marketData = [
    { name: 'S&P 500', price: 5842, change: -2.10 },
    { name: 'Nasdaq 100', price: 20456, change: -2.40 },
    { name: 'Or (XAU)', price: 5136, change: 2.30 },
    { name: 'Bitcoin', price: 75420, change: -5.82 },
    { name: 'Pétrole WTI', price: 78.32, change: 1.20 },
    { name: 'Dollar Index', price: 103.45, change: -0.68 }
];

const commodityData = [
    { name: 'Or', price: '$5 136', change: '+2.3%', up: true },
    { name: 'Argent', price: '$102.40', change: '+1.9%', up: true },
    { name: 'Pétrole WTI', price: '$78.32', change: '+1.2%', up: true },
    { name: 'Pétrole Brent', price: '$82.10', change: '+0.9%', up: true },
    { name: 'Gaz naturel', price: '$3.12', change: '-1.8%', up: false },
    { name: 'Cuivre', price: '$4.15', change: '+0.7%', up: true },
    { name: 'Blé', price: '$645', change: '-0.5%', up: false }
];

const etfTableData = [
    { ticker: 'GLD', name: 'SPDR Gold Trust', provider: 'SPDR', flow: '+$2.8B' },
    { ticker: 'IBIT', name: 'iShares Bitcoin ETF', provider: 'BlackRock', flow: '-$850M' },
    { ticker: 'SHY', name: 'iShares 1-3Y Treasury', provider: 'iShares', flow: '+$1.2B' },
    { ticker: 'SMH', name: 'VanEck Semiconductor', provider: 'VanEck', flow: '+$680M' },
    { ticker: 'SPY', name: 'S&P 500 ETF', provider: 'SPDR', flow: '+$1.9B' },
    { ticker: 'QQQ', name: 'NASDAQ 100 ETF', provider: 'Invesco', flow: '-$420M' }
];

const breakingNews = [
    'Or : record absolu a $5 110/oz sur fond de crise geopolitique',
    'Bitcoin sous $73 000, plus bas depuis novembre 2024',
    'Tarifs Groenland : S&P 500 -2,1% en une seance',
    'Kevin Warsh nomme a la Fed -- lecture hawkish du marche',
    'Nvidia Q3 : $57Mds de CA, le seul pilier haussier',
    'ETF BTC : $1,7Md de sorties en deux semaines'
];

// --- Core functions ---

function setCurrentDate() {
    var el = document.getElementById('current-date');
    if (el) el.textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
        var r = [];
        Object.keys(newsDatabase).forEach(function(k) {
            newsDatabase[k].forEach(function(a) {
                if (a.title.toLowerCase().indexOf(q) !== -1 || a.description.toLowerCase().indexOf(q) !== -1) r.push(a);
            });
        });
        showSearchResults(r, q);
    });
}

function showSearchResults(results, query) {
    var c = document.getElementById('search-results');
    if (!c) { c = document.createElement('div'); c.id = 'search-results'; var m = document.querySelector('.main-content .container'); if (m) m.insertBefore(c, m.firstChild); }
    if (!results.length) { c.innerHTML = '<div class="search-results-header"><h2>Aucun résultat pour « ' + query + ' »</h2><button class="close-search" onclick="this.parentElement.parentElement.remove()">Fermer</button></div>'; return; }
    c.innerHTML = '<div class="search-results-header"><h2>' + results.length + ' résultat' + (results.length > 1 ? 's' : '') + ' pour « ' + query + ' »</h2><button class="close-search" onclick="this.parentElement.parentElement.remove()">Fermer</button></div><div class="news-grid">' + results.map(cardHTML).join('') + '</div>';
    c.scrollIntoView({ behavior: 'smooth' });
}

var tagLabels = { geopolitics: 'Géopolitique', markets: 'Marchés', crypto: 'Crypto', commodities: 'Mat. Premières', etf: 'ETF', conflicts: 'Conflits', trade: 'Commerce', politics: 'Politique' };

function cardHTML(n) {
    var tags = (n.tags || []).map(function(t) { return '<span class="tag ' + t + '">' + (tagLabels[t] || t) + '</span>'; }).join('');
    var dot = n.impact === 'high' ? '<span class="impact-dot"></span>' : '';
    return '<article class="news-card"><div class="news-source"><a href="' + n.url + '" target="_blank" rel="noopener" class="source-name">' + n.source + '</a><span class="news-time">' + n.time + '</span>' + dot + '</div><h3 class="news-title"><a href="' + n.url + '" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">' + n.title + '</a></h3><p class="news-description">' + n.description + '</p><div class="news-footer"><div class="news-tags">' + tags + '</div><a href="' + n.url + '" target="_blank" rel="noopener" class="news-link">Lire</a></div></article>';
}

function initCommon() { setCurrentDate(); initTicker(); initSearch(); }

// --- Home ---

function initHomePage() {
    initCommon();
    var ts = document.getElementById('top-stories');
    if (ts) {
        var f = [newsDatabase.geopolitics[0], newsDatabase.crypto[0], newsDatabase.commodities[0]];
        ts.innerHTML = '<div class="top-stories-grid">' + f.map(function(n, i) {
            return '<article class="top-story' + (i === 0 ? ' top-story-main' : '') + '"><a href="' + n.url + '" target="_blank" rel="noopener" class="source-name">' + n.source + '</a><h3><a href="' + n.url + '" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">' + n.title + '</a></h3><p>' + n.description + '</p><span class="news-time">' + n.time + '</span></article>';
        }).join('') + '</div>';
    }
    var ln = document.getElementById('latest-news');
    if (ln) {
        var all = [];
        Object.keys(newsDatabase).forEach(function(k) { all = all.concat(newsDatabase[k]); });
        all.sort(function(a, b) { return (a.impact === 'high' ? 0 : 1) - (b.impact === 'high' ? 0 : 1); });
        ln.innerHTML = all.slice(0, 10).map(function(n) {
            var dot = n.impact === 'high' ? '<span class="impact-dot"></span>' : '';
            return '<article class="news-list-item"><div class="news-list-source"><a href="' + n.url + '" target="_blank" rel="noopener" class="source-name">' + n.source + '</a><span class="news-time">' + n.time + '</span>' + dot + '</div><h3><a href="' + n.url + '" target="_blank" rel="noopener">' + n.title + '</a></h3><p>' + n.description + '</p></article>';
        }).join('');
    }
    var mt = document.getElementById('market-table');
    if (mt) mt.innerHTML = marketData.map(function(m) {
        var cls = m.change > 0 ? 'positive' : 'negative';
        return '<div class="market-row"><span class="market-row-name">' + m.name + '</span><span class="market-row-price">$' + m.price.toLocaleString('fr-FR') + '</span><span class="market-row-change ' + cls + '">' + (m.change > 0 ? '+' : '') + m.change.toFixed(2) + '%</span></div>';
    }).join('');
}

// --- Category pages ---

function initCategoryPage(cat) {
    initCommon();
    // Render trend paragraph
    var th = document.getElementById('category-trend');
    if (th && categoryTrends[cat]) th.innerHTML = '<p class="analysis-excerpt" style="margin-bottom:2rem;padding:1.25rem;background:var(--bg-secondary);border-left:4px solid var(--pink);border-radius:0 4px 4px 0">' + categoryTrends[cat] + '</p>';
    // Render news
    var c = document.getElementById('page-news');
    if (!c) return;
    var articles = newsDatabase[cat] || [];
    c.innerHTML = articles.map(cardHTML).join('');
    // Filters
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
    el.innerHTML = '<table class="data-table"><thead><tr>' + headers.map(function(h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + data.map(function(r) { return '<tr>' + rowFn(r) + '</tr>'; }).join('') + '</tbody></table>';
}
