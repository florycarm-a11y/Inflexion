-- Inflexion Database Schema
-- Version: 1.0.0
-- PostgreSQL 14+

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS article_tags CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS sources CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS market_data CASCADE;
DROP TABLE IF EXISTS breaking_news CASCADE;

-- ============================================
-- Categories Table
-- ============================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#C41E3A',
    icon VARCHAR(50),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (slug, name, description, display_order) VALUES
    ('geopolitics', 'Géopolitique', 'Tensions internationales, sanctions, diplomatie', 1),
    ('markets', 'Marchés', 'Analyses boursières, politique monétaire', 2),
    ('crypto', 'Crypto & Blockchain', 'Bitcoin, Ethereum, DeFi, régulations', 3),
    ('commodities', 'Matières Premières', 'Or, pétrole, métaux, agriculture', 4),
    ('etf', 'ETF & Fonds', 'Fonds indiciels, flux de capitaux', 5);

-- ============================================
-- Sources Table (20+ institutional sources)
-- ============================================
CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    url VARCHAR(500) NOT NULL,
    rss_url VARCHAR(500),
    logo_url VARCHAR(500),
    color VARCHAR(7) DEFAULT '#333333',
    initial VARCHAR(5),
    type VARCHAR(50) DEFAULT 'news',
    reliability_score DECIMAL(3,2) DEFAULT 0.80,
    is_active BOOLEAN DEFAULT TRUE,
    scrape_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed 20+ institutional sources
INSERT INTO sources (name, slug, url, rss_url, color, initial, type, reliability_score) VALUES
    -- International News
    ('Bloomberg', 'bloomberg', 'https://www.bloomberg.com', 'https://www.bloomberg.com/feed/podcast/etf-report.xml', '#000000', 'B', 'financial', 0.95),
    ('CNBC', 'cnbc', 'https://www.cnbc.com', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', '#005594', 'CN', 'financial', 0.90),
    ('Reuters', 'reuters', 'https://www.reuters.com', 'https://www.reutersagency.com/feed/', '#FF8000', 'R', 'news', 0.95),
    ('Financial Times', 'ft', 'https://www.ft.com', NULL, '#FCD0B1', 'FT', 'financial', 0.95),
    ('Wall Street Journal', 'wsj', 'https://www.wsj.com', 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', '#0274B6', 'WSJ', 'financial', 0.95),
    ('The Economist', 'economist', 'https://www.economist.com', NULL, '#E3120B', 'E', 'analysis', 0.95),

    -- Institutional / Think Tanks
    ('Atlantic Council', 'atlantic-council', 'https://www.atlanticcouncil.org', 'https://www.atlanticcouncil.org/feed/', '#004B87', 'AC', 'think_tank', 0.90),
    ('Council on Foreign Relations', 'cfr', 'https://www.cfr.org', 'https://www.cfr.org/rss.xml', '#002868', 'CFR', 'think_tank', 0.95),
    ('Foreign Policy', 'foreign-policy', 'https://foreignpolicy.com', 'https://foreignpolicy.com/feed/', '#1A1A1A', 'FP', 'analysis', 0.90),
    ('IMF', 'imf', 'https://www.imf.org', 'https://www.imf.org/en/News/RSS', '#004C97', 'IMF', 'institution', 0.98),
    ('World Economic Forum', 'wef', 'https://www.weforum.org', 'https://www.weforum.org/feed/', '#0072C6', 'WEF', 'institution', 0.90),
    ('BCG', 'bcg', 'https://www.bcg.com', NULL, '#1DB954', 'BCG', 'consulting', 0.88),
    ('McKinsey', 'mckinsey', 'https://www.mckinsey.com', NULL, '#0033A0', 'Mc', 'consulting', 0.88),

    -- Commodity / Gold
    ('World Gold Council', 'wgc', 'https://www.gold.org', NULL, '#CFB53B', 'WGC', 'commodity', 0.95),
    ('J.P. Morgan', 'jpmorgan', 'https://www.jpmorgan.com', NULL, '#000000', 'JPM', 'bank', 0.92),

    -- Crypto
    ('CoinDesk', 'coindesk', 'https://www.coindesk.com', 'https://www.coindesk.com/arc/outboundfeeds/rss/', '#000000', 'CD', 'crypto', 0.85),
    ('CoinShares', 'coinshares', 'https://coinshares.com', NULL, '#00D4AA', 'CS', 'crypto', 0.88),
    ('The Block', 'the-block', 'https://www.theblock.co', 'https://www.theblock.co/rss.xml', '#1A1A1A', 'TB', 'crypto', 0.85),

    -- Tech / AI
    ('Nvidia', 'nvidia', 'https://nvidianews.nvidia.com', NULL, '#76B900', 'NV', 'tech', 0.95),
    ('SpaceX', 'spacex', 'https://www.spacex.com', NULL, '#005288', 'SX', 'tech', 0.95),
    ('Anthropic', 'anthropic', 'https://www.anthropic.com', NULL, '#D4A574', 'A', 'tech', 0.95),

    -- Français
    ('Les Echos', 'les-echos', 'https://www.lesechos.fr', 'https://www.lesechos.fr/rss/rss_une.xml', '#0066CC', 'LE', 'french', 0.88),
    ('Le Monde', 'le-monde', 'https://www.lemonde.fr', 'https://www.lemonde.fr/economie/rss_full.xml', '#1A1A1A', 'LM', 'french', 0.90);

-- ============================================
-- Tags Table
-- ============================================
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed common tags
INSERT INTO tags (name, slug) VALUES
    ('Trade', 'trade'),
    ('Politics', 'politics'),
    ('AI', 'ai'),
    ('Gold', 'gold'),
    ('Oil', 'oil'),
    ('Bitcoin', 'bitcoin'),
    ('Ethereum', 'ethereum'),
    ('Fed', 'fed'),
    ('ECB', 'ecb'),
    ('China', 'china'),
    ('USA', 'usa'),
    ('Europe', 'europe'),
    ('Employment', 'employment'),
    ('Inflation', 'inflation'),
    ('Interest Rates', 'interest-rates');

-- ============================================
-- Articles Table
-- ============================================
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id INT REFERENCES sources(id) ON DELETE SET NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    external_id VARCHAR(500),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    url VARCHAR(1000) NOT NULL,
    image_url VARCHAR(1000),
    author VARCHAR(200),
    published_at TIMESTAMP WITH TIME ZONE,
    impact VARCHAR(20) DEFAULT 'medium' CHECK (impact IN ('high', 'medium', 'low')),
    sentiment DECIMAL(3,2),
    view_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_breaking BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_id, external_id)
);

-- ============================================
-- Article Tags Junction Table
-- ============================================
CREATE TABLE article_tags (
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- ============================================
-- Market Data Table (for sidebar)
-- ============================================
CREATE TABLE market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(15,4),
    change_percent DECIMAL(8,4),
    change_value DECIMAL(15,4),
    volume BIGINT,
    market_cap BIGINT,
    category VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed market data
INSERT INTO market_data (symbol, name, price, change_percent, category) VALUES
    ('SPX', 'S&P 500', 5842.00, -2.10, 'index'),
    ('NDX', 'Nasdaq 100', 20456.00, -2.40, 'index'),
    ('NVDA', 'Nvidia', 236.50, 4.10, 'stock'),
    ('XAU', 'Or (XAU/USD)', 5136.00, 2.30, 'commodity'),
    ('WTI', 'Pétrole WTI', 78.32, 1.20, 'commodity'),
    ('DXY', 'Dollar Index', 103.45, -0.68, 'forex'),
    ('BTC', 'Bitcoin', 73000.00, -16.40, 'crypto'),
    ('ETH', 'Ethereum', 2450.00, -12.30, 'crypto');

-- ============================================
-- Breaking News Table
-- ============================================
CREATE TABLE breaking_news (
    id SERIAL PRIMARY KEY,
    headline VARCHAR(500) NOT NULL,
    source VARCHAR(100),
    url VARCHAR(1000),
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_source ON articles(source_id);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_impact ON articles(impact);
CREATE INDEX idx_articles_featured ON articles(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_articles_breaking ON articles(is_breaking) WHERE is_breaking = TRUE;
CREATE INDEX idx_articles_title_trgm ON articles USING gin(title gin_trgm_ops);
CREATE INDEX idx_sources_active ON sources(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_market_data_category ON market_data(category);

-- ============================================
-- Updated_at Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at
    BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views for API
-- ============================================
CREATE OR REPLACE VIEW v_articles_full AS
SELECT
    a.*,
    s.name as source_name,
    s.slug as source_slug,
    s.color as source_color,
    s.initial as source_initial,
    c.name as category_name,
    c.slug as category_slug,
    ARRAY_AGG(DISTINCT t.slug) FILTER (WHERE t.slug IS NOT NULL) as tags
FROM articles a
LEFT JOIN sources s ON a.source_id = s.id
LEFT JOIN categories c ON a.category_id = c.id
LEFT JOIN article_tags at ON a.id = at.article_id
LEFT JOIN tags t ON at.tag_id = t.id
GROUP BY a.id, s.name, s.slug, s.color, s.initial, c.name, c.slug;

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO inflexion_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO inflexion_user;
