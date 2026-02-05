/**
 * Sources API Routes
 * /api/sources
 */
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/sources
 * Get all active sources
 */
router.get('/', async (req, res, next) => {
    try {
        const sql = `
            SELECT id, name, slug, url, logo_url, color, initial, type, reliability_score
            FROM sources
            WHERE is_active = TRUE
            ORDER BY name
        `;
        const result = await query(sql);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/sources/:slug
 * Get source by slug
 */
router.get('/:slug', async (req, res, next) => {
    try {
        const sql = `
            SELECT s.*, COUNT(a.id) as article_count
            FROM sources s
            LEFT JOIN articles a ON s.id = a.source_id
            WHERE s.slug = $1
            GROUP BY s.id
        `;
        const result = await query(sql, [req.params.slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Source not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/sources/:slug/articles
 * Get articles from a specific source
 */
router.get('/:slug/articles', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const sql = `
            SELECT a.*, c.name as category_name, c.slug as category_slug
            FROM articles a
            JOIN sources s ON a.source_id = s.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE s.slug = $1
            ORDER BY a.published_at DESC NULLS LAST
            LIMIT $2 OFFSET $3
        `;
        const result = await query(sql, [req.params.slug, limit, offset]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
