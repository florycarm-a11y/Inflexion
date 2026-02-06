// Market Data Simulation
const marketData = {
    bitcoin: { price: 97234.56, change: 2.34 },
    gold: { price: 2087.43, change: -0.67 },
    oil: { price: 77.82, change: 1.23 },
    sp500: { price: 4783.23, change: 0.89 }
};

// News Database - Simulating real news from international sources
const newsDatabase = {
    geopolitics: [
        {
            source: 'Reuters',
            title: 'Tensions géopolitiques au Moyen-Orient : Impact sur les cours du pétrole',
            description: 'Les derniers développements dans la région entraînent une hausse des prix de l\'énergie et une volatilité accrue sur les marchés mondiaux.',
            tags: ['geopolitics', 'commodities'],
            time: '2h',
            url: '#'
        },
        {
            source: 'BBC News',
            title: 'Sommet économique G20 : Nouvelles régulations financières à l\'horizon',
            description: 'Les leaders mondiaux discutent de nouvelles régulations pour les cryptomonnaies et les marchés financiers internationaux.',
            tags: ['geopolitics', 'markets'],
            time: '4h',
            url: '#'
        },
        {
            source: 'Le Monde',
            title: 'Zone Euro : Perspectives économiques face aux défis géopolitiques',
            description: 'La BCE analyse l\'impact des tensions internationales sur la croissance européenne et les marchés financiers.',
            tags: ['geopolitics', 'markets'],
            time: '5h',
            url: '#'
        },
        {
            source: 'Financial Times',
            title: 'Relations commerciales USA-Chine : Implications pour les marchés',
            description: 'Les négociations commerciales entre les deux superpuissances affectent les bourses mondiales et les chaînes d\'approvisionnement.',
            tags: ['geopolitics', 'markets'],
            time: '6h',
            url: '#'
        },
        {
            source: 'Bloomberg',
            title: 'Instabilité politique en Amérique Latine et marchés émergents',
            description: 'Les investisseurs réévaluent leurs positions sur les marchés émergents face aux changements politiques régionaux.',
            tags: ['geopolitics', 'markets'],
            time: '7h',
            url: '#'
        },
        {
            source: 'Al Jazeera',
            title: 'OPEC+ : Décision sur la production pétrolière impacte les marchés',
            description: 'Les pays producteurs de pétrole ajustent leur stratégie de production, influençant les prix mondiaux de l\'énergie.',
            tags: ['geopolitics', 'commodities'],
            time: '8h',
            url: '#'
        }
    ],
    markets: [
        {
            source: 'Bloomberg',
            title: 'Wall Street termine en hausse malgré les tensions géopolitiques',
            description: 'Les indices américains résistent grâce à des résultats d\'entreprises solides et des perspectives économiques encourageantes.',
            tags: ['markets'],
            time: '1h',
            url: '#'
        },
        {
            source: 'Les Échos',
            title: 'CAC 40 : Les valeurs bancaires profitent de la hausse des taux',
            description: 'Le secteur financier européen bénéficie de l\'environnement de taux d\'intérêt élevés, portant l\'indice parisien.',
            tags: ['markets'],
            time: '3h',
            url: '#'
        },
        {
            source: 'Financial Times',
            title: 'Marchés asiatiques en ordre dispersé face aux données économiques',
            description: 'Tokyo en hausse tandis que Hong Kong recule, les investisseurs analysent les derniers indicateurs macroéconomiques.',
            tags: ['markets'],
            time: '5h',
            url: '#'
        },
        {
            source: 'CNBC',
            title: 'Fed : Les marchés anticipent une pause dans le cycle de hausse',
            description: 'Les investisseurs ajustent leurs positions en prévision des prochaines décisions de politique monétaire américaine.',
            tags: ['markets'],
            time: '6h',
            url: '#'
        },
        {
            source: 'Reuters',
            title: 'Secteur technologique : Rebond après la correction récente',
            description: 'Les valeurs tech retrouvent de la vigueur avec des prises de bénéfices et un regain d\'optimisme des investisseurs.',
            tags: ['markets'],
            time: '7h',
            url: '#'
        },
        {
            source: 'MarketWatch',
            title: 'Volatilité des marchés : Le VIX reste sous surveillance',
            description: 'L\'indice de la peur maintient des niveaux modérés malgré l\'incertitude géopolitique persistante.',
            tags: ['markets'],
            time: '9h',
            url: '#'
        }
    ],
    crypto: [
        {
            source: 'CoinDesk',
            title: 'Bitcoin franchit les 97 000$ : Nouvel élan haussier',
            description: 'La principale cryptomonnaie continue sa progression, soutenue par l\'adoption institutionnelle et les flux d\'ETF positifs.',
            tags: ['crypto', 'markets'],
            time: '30min',
            url: '#'
        },
        {
            source: 'Cointelegraph',
            title: 'Ethereum 2.0 : Les performances post-fusion séduisent les investisseurs',
            description: 'La blockchain Ethereum montre une efficacité accrue, attirant de nouveaux capitaux institutionnels.',
            tags: ['crypto'],
            time: '2h',
            url: '#'
        },
        {
            source: 'Bloomberg Crypto',
            title: 'ETF Bitcoin : Flux record de capitaux institutionnels',
            description: 'Les fonds indiciels Bitcoin attirent des milliards de dollars, marquant une nouvelle phase d\'adoption.',
            tags: ['crypto', 'markets'],
            time: '4h',
            url: '#'
        },
        {
            source: 'The Block',
            title: 'DeFi : Croissance de la TVL malgré la volatilité du marché',
            description: 'La finance décentralisée continue d\'attirer des capitaux avec une valeur totale verrouillée en hausse.',
            tags: ['crypto'],
            time: '5h',
            url: '#'
        },
        {
            source: 'Reuters',
            title: 'Régulation crypto : L\'Europe finalise son cadre MiCA',
            description: 'Les nouvelles régulations européennes apportent plus de clarté au marché des cryptomonnaies.',
            tags: ['crypto', 'geopolitics'],
            time: '6h',
            url: '#'
        },
        {
            source: 'CoinDesk',
            title: 'Altcoins : Solana et Cardano en forte progression',
            description: 'Les cryptomonnaies alternatives connaissent un regain d\'intérêt avec des développements techniques majeurs.',
            tags: ['crypto'],
            time: '8h',
            url: '#'
        }
    ],
    commodities: [
        {
            source: 'Reuters',
            title: 'Or : Valeur refuge face aux incertitudes géopolitiques',
            description: 'Le métal précieux maintient des niveaux élevés alors que les investisseurs cherchent à se protéger.',
            tags: ['commodities', 'geopolitics'],
            time: '2h',
            url: '#'
        },
        {
            source: 'Bloomberg',
            title: 'Pétrole Brent : Hausse sur fond de réduction de production OPEC+',
            description: 'Les prix du brut progressent suite aux annonces de limitation de l\'offre par les pays producteurs.',
            tags: ['commodities', 'geopolitics'],
            time: '3h',
            url: '#'
        },
        {
            source: 'Financial Times',
            title: 'Métaux industriels : Le cuivre profite de la demande en transition énergétique',
            description: 'La demande pour les énergies renouvelables soutient les cours des métaux essentiels à la transition.',
            tags: ['commodities'],
            time: '4h',
            url: '#'
        },
        {
            source: 'Les Échos',
            title: 'Argent : Le métal blanc suit la tendance haussière de l\'or',
            description: 'L\'argent bénéficie à la fois de sa valeur refuge et de ses applications industrielles croissantes.',
            tags: ['commodities'],
            time: '5h',
            url: '#'
        },
        {
            source: 'Reuters',
            title: 'Gaz naturel : Tensions en Europe sur les approvisionnements',
            description: 'Les prix du gaz restent volatils avec les préoccupations sur la sécurité énergétique européenne.',
            tags: ['commodities', 'geopolitics'],
            time: '6h',
            url: '#'
        },
        {
            source: 'Bloomberg',
            title: 'Agriculture : Les céréales sous pression climatique',
            description: 'Les conditions météorologiques impactent les récoltes mondiales et influencent les prix alimentaires.',
            tags: ['commodities'],
            time: '7h',
            url: '#'
        }
    ],
    etf: [
        {
            source: 'Morningstar',
            title: 'ETF Bitcoin : Performance exceptionnelle en début d\'année',
            description: 'Les fonds indiciels crypto surperforment les ETF traditionnels avec des rendements à deux chiffres.',
            tags: ['crypto', 'markets'],
            time: '3h',
            url: '#'
        },
        {
            source: 'Bloomberg',
            title: 'ETF Gold : Flux entrants record face à l\'incertitude',
            description: 'Les investisseurs se tournent massivement vers les ETF or pour sécuriser leurs portefeuilles.',
            tags: ['commodities', 'markets'],
            time: '4h',
            url: '#'
        },
        {
            source: 'Financial Times',
            title: 'ETF ESG : Croissance continue de l\'investissement responsable',
            description: 'Les fonds durables attirent de plus en plus de capitaux malgré la volatilité des marchés.',
            tags: ['markets'],
            time: '5h',
            url: '#'
        },
        {
            source: 'Les Échos',
            title: 'ETF technologie : Rebond après la correction sectorielle',
            description: 'Les fonds indiciels tech retrouvent des couleurs avec la reprise des valeurs de croissance.',
            tags: ['markets'],
            time: '6h',
            url: '#'
        },
        {
            source: 'ETF.com',
            title: 'Nouveaux ETF thématiques : Intelligence artificielle et cybersécurité',
            description: 'Le marché voit l\'arrivée de nouveaux fonds ciblant les technologies émergentes.',
            tags: ['markets'],
            time: '7h',
            url: '#'
        },
        {
            source: 'Reuters',
            title: 'ETF obligataires : Ajustement face aux variations de taux',
            description: 'Les fonds obligataires s\'adaptent à l\'environnement de taux d\'intérêt changeant.',
            tags: ['markets'],
            time: '8h',
            url: '#'
        }
    ]
};

// Initialize market prices
function initializeMarkets() {
    updateMarketCard('btc', marketData.bitcoin);
    updateMarketCard('gold', marketData.gold);
    updateMarketCard('oil', marketData.oil);
    updateMarketCard('sp500', marketData.sp500);

    // Simulate real-time updates
    setInterval(() => {
        simulateMarketUpdates();
    }, 10000); // Update every 10 seconds
}

// Update market card with directional arrow for colorblind accessibility
function updateMarketCard(id, data) {
    const priceElement = document.getElementById(`${id}-price`);
    const changeElement = document.getElementById(`${id}-change`);

    if (priceElement && changeElement) {
        priceElement.textContent = `$${data.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const arrow = data.change > 0 ? '\u25B2' : '\u25BC';
        const changeText = `${arrow} ${data.change > 0 ? '+' : ''}${data.change.toFixed(2)}%`;
        changeElement.textContent = changeText;
        changeElement.className = `market-change ${data.change > 0 ? 'positive' : 'negative'}`;
    }
}

// Simulate market updates
function simulateMarketUpdates() {
    Object.keys(marketData).forEach(key => {
        const randomChange = (Math.random() - 0.5) * 0.5;
        marketData[key].change = parseFloat((marketData[key].change + randomChange).toFixed(2));
        marketData[key].price = parseFloat((marketData[key].price * (1 + randomChange / 100)).toFixed(2));
    });

    updateMarketCard('btc', marketData.bitcoin);
    updateMarketCard('gold', marketData.gold);
    updateMarketCard('oil', marketData.oil);
    updateMarketCard('sp500', marketData.sp500);

    // Update stats
    const marketUpdates = document.getElementById('market-updates');
    if (marketUpdates) {
        const currentCount = parseInt(marketUpdates.textContent) || 0;
        marketUpdates.textContent = currentCount + 1;
    }
}

// Create news card with accessible link context
function createNewsCard(news) {
    const card = document.createElement('article');
    card.className = 'news-card';

    const sourceInitial = news.source.substring(0, 1).toUpperCase();

    const tagsHTML = news.tags.map(tag =>
        `<span class="tag ${tag}">${tag}</span>`
    ).join('');

    card.innerHTML = `
        <div class="news-source">
            <div class="source-logo" aria-hidden="true">${sourceInitial}</div>
            <span class="source-name">${news.source}</span>
            <span class="news-time"><span class="sr-only">Publié il y a </span>${news.time}</span>
        </div>
        <h3 class="news-title">${news.title}</h3>
        <p class="news-description">${news.description}</p>
        <div class="news-tags" aria-label="Tags">${tagsHTML}</div>
        <a href="${news.url}" class="news-link" aria-label="Lire l'article : ${news.title}">Lire l'article</a>
    `;

    return card;
}

// Load news for a section
function loadNews(sectionId, newsArray) {
    const container = document.getElementById(`${sectionId}-news`);
    if (!container) return;

    container.innerHTML = '';

    newsArray.forEach((news, index) => {
        setTimeout(() => {
            const card = createNewsCard(news);
            container.appendChild(card);
        }, index * 100); // Stagger the animation
    });

    // Update news count
    const newsCount = document.getElementById('news-count');
    if (newsCount) {
        const totalNews = Object.values(newsDatabase).reduce((sum, arr) => sum + arr.length, 0);
        newsCount.textContent = totalNews;
    }
}

// Initialize all sections
function initializeNews() {
    loadNews('geopolitics', newsDatabase.geopolitics);
    loadNews('markets', newsDatabase.markets);
    loadNews('crypto', newsDatabase.crypto);
    loadNews('commodities', newsDatabase.commodities);
    loadNews('etf', newsDatabase.etf);
}

// Smooth scroll for navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Refresh news periodically
function startNewsRefresh() {
    setInterval(() => {
        // Simulate new news by shuffling
        Object.keys(newsDatabase).forEach(category => {
            newsDatabase[category] = newsDatabase[category].sort(() => Math.random() - 0.5);
        });
        initializeNews();
    }, 60000); // Refresh every minute
}

// Mobile navigation toggle
function initializeMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Ouvrir le menu de navigation' : 'Fermer le menu de navigation');
        nav.classList.toggle('nav-open', !isOpen);
    });

    // Close nav when a link is clicked on mobile
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Ouvrir le menu de navigation');
            nav.classList.remove('nav-open');
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌍 Géopolitique & Marchés - Initialisation...');

    initializeMarkets();
    initializeNews();
    initializeNavigation();
    initializeMobileNav();
    startNewsRefresh();

    // Highlight active section based on scroll position
    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px',
        threshold: 0
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });

    console.log('✅ Application chargée avec succès!');
});
