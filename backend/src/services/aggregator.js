/**
 * News Aggregator Service
 * Fetches and processes news from 20+ institutional sources
 */
const cron = require('node-cron');
const RSSParser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const { query } = require('../config/database');
const Article = require('../models/Article');

const rssParser = new RSSParser({
    timeout: 10000,
    headers: {
        'User-Agent': 'Inflexion News Aggregator/1.0'
    }
});

// Category mapping for automatic classification
const CATEGORY_KEYWORDS = {
    geopolitics: ['tariff', 'sanction', 'trade war', 'diplomacy', 'geopolit', 'ukraine', 'china', 'russia', 'nato', 'trump', 'biden', 'war', 'conflict', 'military'],
    markets: ['stock', 'nasdaq', 's&p', 'dow', 'earnings', 'fed', 'interest rate', 'inflation', 'gdp', 'employment', 'jobs', 'wall street', 'nvidia', 'ai stocks', 'tech stocks'],
    crypto: ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'btc', 'eth', 'defi', 'nft', 'stablecoin', 'coinbase', 'binance'],
    commodities: ['gold', 'oil', 'silver', 'copper', 'natural gas', 'commodity', 'wti', 'brent', 'precious metal', 'opec'],
    etf: ['etf', 'fund', 'vanguard', 'ishares', 'spdr', 'index fund', 'asset allocation']
};

// Impact keywords for classification
const HIGH_IMPACT_KEYWORDS = ['breaking', 'crisis', 'crash', 'surge', 'plunge', 'record', 'historic', 'emergency', 'collapse', 'soar', 'tumble'];

/**
 * Determine category based on content
 */
function classifyCategory(title, description) {
    const text = `${title} ${description}`.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }

    return 'markets'; // Default category
}

/**
 * Determine impact level based on content
 */
function classifyImpact(title, description) {
    const text = `${title} ${description}`.toLowerCase();

    for (const keyword of HIGH_IMPACT_KEYWORDS) {
        if (text.includes(keyword)) {
            return 'high';
        }
    }

    return 'medium';
}

/**
 * Fetch and parse RSS feed
 */
async function fetchRSS(source) {
    if (!source.rss_url) return [];

    try {
        console.log(`Fetching RSS: ${source.name}`);
        const feed = await rssParser.parseURL(source.rss_url);

        return feed.items.map(item => ({
            source_id: source.id,
            external_id: item.guid || item.link,
            title: item.title?.trim(),
            description: item.contentSnippet?.trim() || item.content?.trim(),
            url: item.link,
            image_url: item.enclosure?.url || extractImage(item.content),
            author: item.creator || item.author,
            published_at: item.pubDate ? new Date(item.pubDate) : null
        }));
    } catch (error) {
        console.error(`RSS fetch error for ${source.name}:`, error.message);
        return [];
    }
}

/**
 * Extract image URL from HTML content
 */
function extractImage(htmlContent) {
    if (!htmlContent) return null;

    try {
        const $ = cheerio.load(htmlContent);
        const img = $('img').first();
        return img.attr('src') || null;
    } catch {
        return null;
    }
}

/**
 * Process and save articles to database
 */
async function processArticles(articles, source) {
    let saved = 0;
    let errors = 0;

    // Get category IDs
    const categoriesResult = await query('SELECT id, slug FROM categories');
    const categories = Object.fromEntries(
        categoriesResult.rows.map(c => [c.slug, c.id])
    );

    for (const article of articles) {
        if (!article.title || !article.url) continue;

        try {
            // Classify category and impact
            const categorySlug = classifyCategory(article.title, article.description || '');
            const impact = classifyImpact(article.title, article.description || '');

            await Article.create({
                ...article,
                category_id: categories[categorySlug],
                impact
            });

            saved++;
        } catch (error) {
            // Likely duplicate, ignore
            if (!error.message.includes('duplicate')) {
                console.error(`Save error:`, error.message);
                errors++;
            }
        }
    }

    return { saved, errors };
}

/**
 * Aggregate news from all active sources
 */
async function aggregateAll() {
    console.log('\n========================================');
    console.log('Starting news aggregation...');
    console.log('Time:', new Date().toISOString());
    console.log('========================================\n');

    // Get all active sources with RSS URLs
    const sourcesResult = await query(`
        SELECT * FROM sources
        WHERE is_active = TRUE AND rss_url IS NOT NULL
    `);

    const sources = sourcesResult.rows;
    console.log(`Found ${sources.length} sources with RSS feeds\n`);

    let totalSaved = 0;
    let totalErrors = 0;

    for (const source of sources) {
        const articles = await fetchRSS(source);

        if (articles.length > 0) {
            const { saved, errors } = await processArticles(articles, source);
            totalSaved += saved;
            totalErrors += errors;
            console.log(`✓ ${source.name}: ${saved} new articles (${articles.length} fetched)`);
        } else {
            console.log(`- ${source.name}: No articles or feed unavailable`);
        }

        // Rate limiting between sources
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n========================================');
    console.log(`Aggregation complete!`);
    console.log(`New articles: ${totalSaved}`);
    console.log(`Errors: ${totalErrors}`);
    console.log('========================================\n');

    return { saved: totalSaved, errors: totalErrors };
}

/**
 * Start the scheduled aggregation
 */
function startScheduler() {
    const schedule = process.env.AGGREGATION_CRON || '*/30 * * * *'; // Every 30 minutes

    console.log(`\nNews aggregation scheduler started`);
    console.log(`Schedule: ${schedule}\n`);

    // Run immediately on startup
    aggregateAll().catch(console.error);

    // Schedule periodic runs
    cron.schedule(schedule, () => {
        aggregateAll().catch(console.error);
    });
}

/**
 * Manual trigger for aggregation
 */
async function triggerAggregation() {
    return await aggregateAll();
}

module.exports = {
    startScheduler,
    triggerAggregation,
    aggregateAll,
    fetchRSS,
    classifyCategory,
    classifyImpact
};
