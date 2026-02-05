/**
 * Database Seeder
 * Populates initial data from existing app.js newsDatabase
 */
require('dotenv').config();
const { query, pool } = require('../config/database');

// Import existing news data from frontend
const newsData = {
    geopolitics: [
        { source: 'NBC News', url: 'https://www.nbcnews.com/business/economy/trump-denmark-european-tariffs-greenland-deal-rcna254551', title: 'Tarifs Groenland : Trump impose 10% sur 8 pays européens, escalade à 25% en juin', description: 'Tarifs conditionnés au soutien européen pour l\'acquisition du Groenland. Danemark, France, Allemagne, UK, Norvège, Suède, Pays-Bas et Finlande visés.', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-20/wall-street-s-calm-shattered-by-greenland-and-japan-shocks', title: 'Wall Street : le calme brisé par le choc Groenland — S&P 500 −2,1%', description: 'Pire séance depuis octobre. Gold franchit $4 660/oz. Le risque tarifaire redevient le driver dominant.', impact: 'high' },
        { source: 'Atlantic Council', url: 'https://www.atlanticcouncil.org/dispatches/eight-ways-ai-will-shape-geopolitics-in-2026/', title: 'Guerre des puces IA : les USA contrôlent 74% du compute mondial', description: 'Les restrictions d\'export Nvidia restent imprévisibles. Huawei vise 50% du marché chinois des puces IA.', impact: 'high' },
        { source: 'CFR', url: 'https://www.cfr.org/articles/visualizing-2026-five-foreign-policy-trends-watch', title: 'Council on Foreign Relations : cinq tendances géopolitiques clés pour 2026', description: 'Le CFR identifie cinq forces qui façonnent 2026 : bipolarité USA-Chine, érosion de l\'ordre multilatéral.', impact: 'high' }
    ],
    markets: [
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/02/03/musk-xai-spacex-biggest-merger-ever.html', title: 'SpaceX + xAI : la plus grande fusion de l\'histoire à $1 250 milliards', description: 'SpaceX acquiert xAI pour créer une entité valorisée $1,25T — la plus grande fusion jamais réalisée.', impact: 'high' },
        { source: 'HBR', url: 'https://hbr.org/2026/01/companies-are-laying-off-workers-because-of-ais-potential-not-its-performance', title: 'HBR : les entreprises licencient pour le potentiel de l\'IA, pas ses performances', description: 'Les licenciements liés à l\'IA ont été multipliés par 12 en deux ans (55 000 en 2025).', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2025/11/19/nvidia-nvda-earnings-report-q3-2026.html', title: 'Nvidia Q3 : $57Mds de CA (+62% YoY), guidance Q4 à $65Mds', description: 'Data center : $43Mds en compute. Backlog de $500Mds sur Blackwell/Rubin.', impact: 'high' },
        { source: 'FMI', url: 'https://www.imf.org/en/blogs/articles/2026/01/14/new-skills-and-ai-are-reshaping-the-future-of-work', title: 'FMI : l\'IA frappe le marché du travail « comme un tsunami »', description: 'Près de 40% des emplois mondiaux sont exposés à l\'IA.', impact: 'high' }
    ],
    crypto: [
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-08/stablecoin-transactions-rose-to-record-33-trillion-led-by-usdc', title: 'Stablecoins : record de $33 000 milliards de transactions en 2025', description: 'USDC mène avec $18,3T de transactions, USDT suit avec $13,3T.', impact: 'high' },
        { source: 'CoinDesk', url: 'https://www.coindesk.com/markets/2026/02/02/bitcoin-s-crash-exposes-painful-truth-crypto-market-still-dances-to-btc-s-tune', title: 'Oubliez le « digital gold » : les traders fuient vers les stablecoins', description: 'L\'action des prix 2026 démontre que le marché évolue toujours au rythme du BTC.', impact: 'high' },
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/02/03/bitcoin-price-today.html', title: 'Bitcoin à $73 000 — plus bas de 16 mois, −40% depuis octobre', description: 'BTC touche $72 884, −16% YTD. Rotation massive hors des actifs risk-on.', impact: 'high' }
    ],
    commodities: [
        { source: 'CNBC', url: 'https://www.cnbc.com/2026/01/26/gold-races-to-5100-record-peak-on-safe-haven-demand.html', title: 'Or : record absolu à $5 110/oz — +64% sur un an', description: 'Goldman relève son objectif à $5 400. UBS vise $6 200.', impact: 'high' },
        { source: 'World Gold Council', url: 'https://www.gold.org/goldhub/research/gold-demand-trends/gold-demand-trends-full-year-2025', title: 'World Gold Council : 863 tonnes achetées par les banques centrales en 2025', description: 'La Pologne premier acheteur mondial (102t). Achats « opaques » non déclarés : 57% du total.', impact: 'high' },
        { source: 'J.P. Morgan', url: 'https://www.jpmorgan.com/insights/global-research/commodities/gold-prices', title: 'J.P. Morgan : objectif or à $5 400', description: 'La part des banques centrales dans la demande totale est passée de 12% à 25%.', impact: 'high' }
    ],
    etf: [
        { source: 'CNBC', url: 'https://www.cnbc.com/2025/11/19/nvidia-nvda-earnings-report-q3-2026.html', title: 'ETF IA (SMH, BOTZ) : Nvidia tire les fonds semi-conducteurs', description: 'Les ETF exposés à l\'IA surperforment massivement le marché. SMH +10% vs SPY −2%.', impact: 'high' },
        { source: 'Bloomberg', url: 'https://www.bloomberg.com/news/articles/2026-01-30/trump-picks-kevin-warsh-as-fed-chair-wall-street-reacts', title: 'ETF obligataires (SHY, BIL) : la duration courte capte le flight-to-quality', description: 'Flux entrants records pour SHY et BIL sur l\'incertitude Warsh.', impact: 'medium' }
    ]
};

async function seed() {
    console.log('Starting database seeding...\n');

    try {
        // Get source name to ID mapping
        const sourcesResult = await query('SELECT id, name FROM sources');
        const sourceMap = {};
        sourcesResult.rows.forEach(s => {
            sourceMap[s.name.toLowerCase()] = s.id;
            // Also map common variations
            if (s.name === 'Council on Foreign Relations') sourceMap['cfr'] = s.id;
            if (s.name === 'IMF') sourceMap['fmi'] = s.id;
        });

        // Get category slug to ID mapping
        const categoriesResult = await query('SELECT id, slug FROM categories');
        const categoryMap = {};
        categoriesResult.rows.forEach(c => {
            categoryMap[c.slug] = c.id;
        });

        let totalInserted = 0;

        for (const [category, articles] of Object.entries(newsData)) {
            console.log(`Seeding ${category}...`);

            for (const article of articles) {
                const sourceName = article.source.toLowerCase();
                const sourceId = sourceMap[sourceName] ||
                                sourceMap[sourceName.split(' ')[0]] ||
                                null;

                const sql = `
                    INSERT INTO articles (
                        source_id, category_id, external_id, title,
                        description, url, impact, published_at, is_featured
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - interval '1 day' * random() * 30, $8)
                    ON CONFLICT (source_id, external_id) DO NOTHING
                `;

                await query(sql, [
                    sourceId,
                    categoryMap[category],
                    article.url,
                    article.title,
                    article.description,
                    article.url,
                    article.impact || 'medium',
                    category === 'markets' || category === 'commodities'
                ]);

                totalInserted++;
            }
        }

        console.log(`\n✓ Seeded ${totalInserted} articles`);

        // Seed breaking news
        const breakingNews = [
            'xAI rejoint SpaceX : Musk fusionne IA et aérospatiale',
            'Or : record absolu à $5 110/oz — banques centrales : 863 tonnes en 2025',
            'FMI : l\'IA frappe le marché du travail comme un tsunami'
        ];

        for (const headline of breakingNews) {
            await query(`
                INSERT INTO breaking_news (headline, is_active, priority)
                VALUES ($1, TRUE, 1)
                ON CONFLICT DO NOTHING
            `, [headline]);
        }

        console.log('✓ Seeded breaking news\n');
        console.log('Database seeding complete!');

    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await pool.end();
    }
}

seed();
