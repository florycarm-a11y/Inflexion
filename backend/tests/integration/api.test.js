/**
 * API Integration Tests
 * Tests all API endpoints using supertest
 */

const request = require('supertest');

// Mock database before importing app
jest.mock('../../src/config/database', () => require('../mocks/database'));

const express = require('express');
const { mockQuery } = require('../mocks/database');

// Create a minimal test app
const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // Mount routes
    app.use('/api/articles', require('../../src/routes/articles'));
    app.use('/api/sources', require('../../src/routes/sources'));
    app.use('/api/categories', require('../../src/routes/categories'));
    app.use('/api/market', require('../../src/routes/market'));
    app.use('/api/search', require('../../src/routes/search'));

    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    // Error handler
    app.use((err, req, res, next) => {
        res.status(err.status || 500).json({ error: err.message });
    });

    return app;
};

describe('API Endpoints', () => {
    let app;

    beforeAll(() => {
        app = createTestApp();
    });

    describe('Health Check', () => {
        it('GET /health should return ok status', async () => {
            const res = await request(app).get('/health');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
        });
    });

    describe('Articles API', () => {
        it('GET /api/articles should return articles list', async () => {
            const res = await request(app).get('/api/articles');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('GET /api/articles should accept query params', async () => {
            const res = await request(app)
                .get('/api/articles')
                .query({ category: 'markets', limit: 10 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles should filter by impact', async () => {
            const res = await request(app)
                .get('/api/articles')
                .query({ impact: 'high' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles should filter by source', async () => {
            const res = await request(app)
                .get('/api/articles')
                .query({ source: 'bloomberg' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
        it('GET /api/articles should filter by featured=true', async () => {
            const res = await request(app)
                .get('/api/articles')
                .query({ featured: 'true' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles should filter by featured=false', async () => {
            const res = await request(app)
                .get('/api/articles')
                .query({ featured: 'false' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles should accept offset', async () => {
            const res = await request(app)
                .get('/api/articles')
                .query({ offset: 10 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles/featured should return featured articles', async () => {
            const res = await request(app).get('/api/articles/featured');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('GET /api/articles/featured should accept custom limit', async () => {
            const res = await request(app)
                .get('/api/articles/featured')
                .query({ limit: 5 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles/breaking should return breaking news', async () => {
            const res = await request(app).get('/api/articles/breaking');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles/breaking should accept custom limit', async () => {
            const res = await request(app)
                .get('/api/articles/breaking')
                .query({ limit: 5 });

            expect(res.status).toBe(200);
        });

        it('GET /api/articles/latest should return latest articles', async () => {
            const res = await request(app).get('/api/articles/latest');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles/latest should accept custom limit', async () => {
            const res = await request(app)
                .get('/api/articles/latest')
                .query({ limit: 3 });

            expect(res.status).toBe(200);
        });

        it('GET /api/articles/stats should return category stats', async () => {
            const res = await request(app).get('/api/articles/stats');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles/:id should return article when found', async () => {
            const res = await request(app)
                .get('/api/articles/550e8400-e29b-41d4-a716-446655440001');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles/:id should return 404 when not found', async () => {
            mockQuery.mockImplementationOnce(() =>
                Promise.resolve({ rows: [], rowCount: 0 })
            );

            const res = await request(app)
                .get('/api/articles/nonexistent-id');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('not found');
        });

        it('POST /api/articles should create an article', async () => {
            const res = await request(app)
                .post('/api/articles')
                .send({
                    source_id: 1,
                    category_id: 1,
                    title: 'New Test Article',
                    url: 'https://example.com/new'
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('PUT /api/articles/:id should update article', async () => {
            // Mock UPDATE query to return updated article
            mockQuery.mockImplementationOnce(() =>
                Promise.resolve({ rows: [{ id: '550e8400-e29b-41d4-a716-446655440001', title: 'Updated Title' }], rowCount: 1 })
            );

            const res = await request(app)
                .put('/api/articles/550e8400-e29b-41d4-a716-446655440001')
                .send({ title: 'Updated Title' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
        it('PUT /api/articles/:id should return 404 when not found', async () => {
            mockQuery.mockImplementationOnce(() =>
                Promise.resolve({ rows: [], rowCount: 0 })
            );

            const res = await request(app)
                .put('/api/articles/nonexistent-id')
                .send({ title: 'Updated' });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('DELETE /api/articles/:id should delete article', async () => {
            mockQuery.mockImplementationOnce(() =>
                Promise.resolve({ rows: [{ id: 'test' }], rowCount: 1 })
            );

            const res = await request(app)
                .delete('/api/articles/550e8400-e29b-41d4-a716-446655440001');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('deleted');
        });

        it('DELETE /api/articles/:id should return 404 when not found', async () => {
            mockQuery.mockImplementationOnce(() =>
                Promise.resolve({ rows: [], rowCount: 0 })
            );

            const res = await request(app)
                .delete('/api/articles/nonexistent-id');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Sources API', () => {
        it('GET /api/sources should return sources list', async () => {
            const res = await request(app).get('/api/sources');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('GET /api/sources/:slug should return source details', async () => {
            const res = await request(app).get('/api/sources/bloomberg');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/sources/:slug should return 404 for unknown source', async () => {
            mockQuery.mockImplementationOnce(() =>
                Promise.resolve({ rows: [], rowCount: 0 })
            );

            const res = await request(app).get('/api/sources/unknown-source');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('GET /api/sources/:slug/articles should return source articles', async () => {
            const res = await request(app).get('/api/sources/bloomberg/articles');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/sources/:slug/articles should accept pagination', async () => {
            const res = await request(app)
                .get('/api/sources/bloomberg/articles')
                .query({ limit: 5, offset: 10 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('Categories API', () => {
        it('GET /api/categories should return categories list', async () => {
            const res = await request(app).get('/api/categories');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('GET /api/categories/:slug should return category details', async () => {
            const res = await request(app).get('/api/categories/markets');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/categories/:slug should return 404 for unknown category', async () => {
            mockQuery.mockImplementationOnce(() =>
                Promise.resolve({ rows: [], rowCount: 0 })
            );

            const res = await request(app).get('/api/categories/unknown-cat');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('GET /api/categories/:slug/articles should return category articles', async () => {
            const res = await request(app)
                .get('/api/categories/markets/articles')
                .query({ limit: 5 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/categories/:slug/articles should filter by impact', async () => {
            const res = await request(app)
                .get('/api/categories/markets/articles')
                .query({ impact: 'high', limit: 5 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/categories/:slug/articles should accept offset', async () => {
            const res = await request(app)
                .get('/api/categories/crypto/articles')
                .query({ offset: 10 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
    describe('Market API', () => {
        it('GET /api/market should return market data', async () => {
            const res = await request(app).get('/api/market');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('GET /api/market/:symbol should return specific symbol', async () => {
            const res = await request(app).get('/api/market/SPX');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/market/:symbol should handle lowercase', async () => {
            const res = await request(app).get('/api/market/spx');

            expect(res.status).toBe(200);
        });

        it('GET /api/market/:symbol should return 404 for unknown symbol', async () => {
            mockQuery.mockImplementationOnce(() =>
                Promise.resolve({ rows: [], rowCount: 0 })
            );

            const res = await request(app).get('/api/market/UNKNOWN');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });

        it('GET /api/market/category/:category should return category data', async () => {
            const res = await request(app).get('/api/market/category/index');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('PUT /api/market/:symbol should update market data', async () => {
            // Mock UPDATE query to return updated market data
            mockQuery.mockImplementationOnce(() =>
                Promise.resolve({ rows: [{ symbol: 'SPX', price: 5900.00, change_percent: 1.5 }], rowCount: 1 })
            );

            const res = await request(app)
                .put('/api/market/SPX')
                .send({ price: 5900.00, change_percent: 1.5 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('PUT /api/market/:symbol should return 404 for unknown symbol', async () => {
            mockQuery.mockImplementationOnce(() =>
                Promise.resolve({ rows: [], rowCount: 0 })
            );

            const res = await request(app)
                .put('/api/market/UNKNOWN')
                .send({ price: 100 });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Search API', () => {
        it('GET /api/search should require query parameter', async () => {
            const res = await request(app).get('/api/search');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('GET /api/search should reject short queries', async () => {
            const res = await request(app)
                .get('/api/search')
                .query({ q: 'a' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('at least 2 characters');
        });

        it('GET /api/search should reject empty query', async () => {
            const res = await request(app)
                .get('/api/search')
                .query({ q: '' });

            expect(res.status).toBe(400);
        });

        it('GET /api/search should return results for valid query', async () => {
            const res = await request(app)
                .get('/api/search')
                .query({ q: 'bitcoin' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.query).toBe('bitcoin');
        });

        it('GET /api/search should accept category filter', async () => {
            const res = await request(app)
                .get('/api/search')
                .query({ q: 'bitcoin', category: 'crypto' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/search should accept source filter', async () => {
            const res = await request(app)
                .get('/api/search')
                .query({ q: 'bitcoin', source: 'coindesk' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/search should accept both category and source filters', async () => {
            const res = await request(app)
                .get('/api/search')
                .query({ q: 'test', category: 'markets', source: 'bloomberg' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/search should accept custom limit', async () => {
            const res = await request(app)
                .get('/api/search')
                .query({ q: 'markets', limit: 5 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/search/suggest should return suggestions', async () => {
            const res = await request(app)
                .get('/api/search/suggest')
                .query({ q: 'bit' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.suggestions)).toBe(true);
        });

        it('GET /api/search/suggest should return empty for short query', async () => {
            const res = await request(app)
                .get('/api/search/suggest')
                .query({ q: 'a' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.suggestions).toEqual([]);
        });

        it('GET /api/search/suggest should return empty for no query', async () => {
            const res = await request(app)
                .get('/api/search/suggest');

            expect(res.status).toBe(200);
            expect(res.body.suggestions).toEqual([]);
        });
    });
});

describe('Error Handling', () => {
    let app;

    beforeAll(() => {
        app = createTestApp();
    });

    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/unknown');

        expect(res.status).toBe(404);
    });

    it('should handle invalid JSON gracefully', async () => {
        const res = await request(app)
            .post('/api/articles')
            .set('Content-Type', 'application/json')
            .send('invalid json');

        expect(res.status).toBe(400);
    });

    it('should handle database errors in articles route', async () => {
        mockQuery.mockImplementationOnce(() =>
            Promise.reject(new Error('Database connection failed'))
        );

        const res = await request(app).get('/api/articles');

        expect(res.status).toBe(500);
    });

    it('should handle database errors in sources route', async () => {
        mockQuery.mockImplementationOnce(() =>
            Promise.reject(new Error('Database connection failed'))
        );

        const res = await request(app).get('/api/sources');

        expect(res.status).toBe(500);
    });

    it('should handle database errors in categories route', async () => {
        mockQuery.mockImplementationOnce(() =>
            Promise.reject(new Error('Database connection failed'))
        );

        const res = await request(app).get('/api/categories');

        expect(res.status).toBe(500);
    });

    it('should handle database errors in market route', async () => {
        mockQuery.mockImplementationOnce(() =>
            Promise.reject(new Error('Database connection failed'))
        );

        const res = await request(app).get('/api/market');

        expect(res.status).toBe(500);
    });

    it('should handle database errors in search route', async () => {
        mockQuery.mockImplementationOnce(() =>
            Promise.reject(new Error('Database connection failed'))
        );

        const res = await request(app)
            .get('/api/search')
            .query({ q: 'test query' });

        expect(res.status).toBe(500);
    });
});
