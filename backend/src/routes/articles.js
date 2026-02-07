/**
 * Articles API Routes
 * /api/articles
 */
const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

/**
 * GET /api/articles
 * Get all articles with optional filters
 */
router.get('/', async (req, res, next) => {
    try {
        const { category, source, impact, limit, offset, featured } = req.query;

        const articles = await Article.findAll({
            category,
            source,
            impact,
            limit: parseInt(limit) || 20,
            offset: parseInt(offset) || 0,
            featured: featured === 'true' ? true : featured === 'false' ? false : undefined
        });

        res.json({
            success: true,
            count: articles.length,
            data: articles
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/articles/featured
 * Get featured articles for homepage
 */
router.get('/featured', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 3;
        const articles = await Article.getFeatured(limit);

        res.json({
            success: true,
            data: articles
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/articles/breaking
 * Get breaking news
 */
router.get('/breaking', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const articles = await Article.getBreaking(limit);

        res.json({
            success: true,
            data: articles
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/articles/latest
 * Get latest articles
 */
router.get('/latest', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const articles = await Article.getLatest(limit);

        res.json({
            success: true,
            data: articles
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/articles/stats
 * Get article statistics
 */
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await Article.countByCategory();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/articles/:id
 * Get single article by ID
 */
router.get('/:id', async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'Article not found'
            });
        }

        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/articles
 * Create new article (internal use)
 */
router.post('/', async (req, res, next) => {
    try {
        const article = await Article.create(req.body);

        res.status(201).json({
            success: true,
            data: article
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/articles/:id
 * Update article
 */
router.put('/:id', async (req, res, next) => {
    try {
        const article = await Article.update(req.params.id, req.body);

        if (!article) {
            return res.status(404).json({
                success: false,
                error: 'Article not found'
            });
        }

        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/articles/:id
 * Delete article
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const deleted = await Article.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Article not found'
            });
        }

        res.json({
            success: true,
            message: 'Article deleted'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
