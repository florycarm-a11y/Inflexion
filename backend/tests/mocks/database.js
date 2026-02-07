/**
 * Database Mock for Testing
 * Provides mock implementations for database operations
 */

const mockArticles = [
    {
        id: '550e8400-e29b-41d4-a716-446655440001',
        source_id: 1,
        category_id: 1,
        title: 'Test Article: Geopolitical Tensions Rise',
        description: 'A test article about geopolitical events.',
        url: 'https://example.com/article1',
        impact: 'high',
        published_at: new Date('2026-02-01'),
        source_name: 'Bloomberg',
        source_slug: 'bloomberg',
        source_color: '#000000',
        source_initial: 'B',
        category_name: 'Géopolitique',
        category_slug: 'geopolitics',
        tags: ['trade', 'politics']
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440002',
        source_id: 2,
        category_id: 2,
        title: 'Test Article: Markets Rally on Tech Earnings',
        description: 'A test article about market movements.',
        url: 'https://example.com/article2',
        impact: 'medium',
        published_at: new Date('2026-02-02'),
        source_name: 'CNBC',
        source_slug: 'cnbc',
        source_color: '#005594',
        source_initial: 'CN',
        category_name: 'Marchés',
        category_slug: 'markets',
        tags: ['markets', 'tech']
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440003',
        source_id: 3,
        category_id: 3,
        title: 'Test Article: Bitcoin Drops Below $70K',
        description: 'A test article about cryptocurrency.',
        url: 'https://example.com/article3',
        impact: 'high',
        published_at: new Date('2026-02-03'),
        source_name: 'CoinDesk',
        source_slug: 'coindesk',
        source_color: '#000000',
        source_initial: 'CD',
        category_name: 'Crypto & Blockchain',
        category_slug: 'crypto',
        tags: ['bitcoin', 'crypto']
    }
];

const mockSources = [
    { id: 1, name: 'Bloomberg', slug: 'bloomberg', url: 'https://bloomberg.com', color: '#000000', initial: 'B', type: 'financial', reliability_score: 0.95 },
    { id: 2, name: 'CNBC', slug: 'cnbc', url: 'https://cnbc.com', color: '#005594', initial: 'CN', type: 'financial', reliability_score: 0.90 },
    { id: 3, name: 'CoinDesk', slug: 'coindesk', url: 'https://coindesk.com', color: '#000000', initial: 'CD', type: 'crypto', reliability_score: 0.85 }
];

const mockCategories = [
    { id: 1, slug: 'geopolitics', name: 'Géopolitique', article_count: 10 },
    { id: 2, slug: 'markets', name: 'Marchés', article_count: 15 },
    { id: 3, slug: 'crypto', name: 'Crypto & Blockchain', article_count: 5 },
    { id: 4, slug: 'commodities', name: 'Matières Premières', article_count: 8 },
    { id: 5, slug: 'etf', name: 'ETF & Fonds', article_count: 4 }
];

const mockMarketData = [
    { symbol: 'SPX', name: 'S&P 500', price: 5842.00, change_percent: -2.10, category: 'index' },
    { symbol: 'NDX', name: 'Nasdaq 100', price: 20456.00, change_percent: -2.40, category: 'index' },
    { symbol: 'XAU', name: 'Or (XAU/USD)', price: 5136.00, change_percent: 2.30, category: 'commodity' },
    { symbol: 'BTC', name: 'Bitcoin', price: 73000.00, change_percent: -16.40, category: 'crypto' }
];

// Mock query function
const mockQuery = jest.fn((sql, params) => {
    // Return appropriate mock data based on query
    if (sql.includes('v_articles_full') || sql.includes('FROM articles')) {
        return Promise.resolve({ rows: mockArticles, rowCount: mockArticles.length });
    }
    if (sql.includes('FROM sources')) {
        return Promise.resolve({ rows: mockSources, rowCount: mockSources.length });
    }
    if (sql.includes('FROM categories')) {
        return Promise.resolve({ rows: mockCategories, rowCount: mockCategories.length });
    }
    if (sql.includes('FROM market_data')) {
        return Promise.resolve({ rows: mockMarketData, rowCount: mockMarketData.length });
    }
    return Promise.resolve({ rows: [], rowCount: 0 });
});

// Mock pool
const mockPool = {
    connect: jest.fn(() => Promise.resolve({
        query: mockQuery,
        release: jest.fn()
    })),
    query: mockQuery,
    end: jest.fn(() => Promise.resolve())
};

module.exports = {
    mockArticles,
    mockSources,
    mockCategories,
    mockMarketData,
    mockQuery,
    mockPool,
    query: mockQuery,
    pool: mockPool,
    getClient: jest.fn(() => Promise.resolve({
        query: mockQuery,
        release: jest.fn()
    }))
};
