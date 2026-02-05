/**
 * API Integration Tests
 * Tests all API endpoints using supertest
 */

const request = require('supertest');

// Mock database before importing app
jest.mock('../../src/config/database', () => require('../mocks/database'));

const express = require('express');

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

        it('GET /api/articles/featured should return featured articles', async () => {
            const res = await request(app).get('/api/articles/featured');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('GET /api/articles/breaking should return breaking news', async () => {
            const res = await request(app).get('/api/articles/breaking');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles/latest should return latest articles', async () => {
            const res = await request(app).get('/api/articles/latest');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/articles/stats should return category stats', async () => {
            const res = await request(app).get('/api/articles/stats');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
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

        it('GET /api/sources/:slug/articles should return source articles', async () => {
            const res = await request(app).get('/api/sources/bloomberg/articles');

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

        it('GET /api/categories/:slug/articles should return category articles', async () => {
            const res = await request(app)
                .get('/api/categories/markets/articles')
                .query({ limit: 5 });

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

        it('GET /api/search should return results for valid query', async () => {
            const res = await request(app)
                .get('/api/search')
                .query({ q: 'bitcoin' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.query).toBe('bitcoin');
        });

        it('GET /api/search/suggest should return suggestions', async () => {
            const res = await request(app)
                .get('/api/search/suggest')
                .query({ q: 'bit' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.suggestions)).toBe(true);
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
});
