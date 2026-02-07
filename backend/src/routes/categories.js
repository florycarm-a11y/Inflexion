/**
 * Categories API Routes
 * /api/categories
 */
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/categories
 * Get all categories with article counts
 */
router.get('/', async (req, res, next) => {
    try {
        const sql = `
            SELECT c.*, COUNT(a.id) as article_count
            FROM categories c
            LEFT JOIN articles a ON c.id = a.category_id
            GROUP BY c.id
            ORDER BY c.display_order
        `;
        const result = await query(sql);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/categories/:slug
 * Get category by slug with trend data
 */
router.get('/:slug', async (req, res, next) => {
    try {
        const sql = `
            SELECT c.*, COUNT(a.id) as article_count
            FROM categories c
            LEFT JOIN articles a ON c.id = a.category_id
            WHERE c.slug = $1
            GROUP BY c.id
        `;
        const result = await query(sql, [req.params.slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
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
 * GET /api/categories/:slug/articles
 * Get articles for a specific category
 */
router.get('/:slug/articles', async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const impact = req.query.impact;

        let sql = `
            SELECT a.*, s.name as source_name, s.slug as source_slug, s.color as source_color, s.initial as source_initial
            FROM articles a
            JOIN categories c ON a.category_id = c.id
            LEFT JOIN sources s ON a.source_id = s.id
            WHERE c.slug = $1
        `;
        const params = [req.params.slug];
        let paramIndex = 2;

        if (impact) {
            sql += ` AND a.impact = $${paramIndex++}`;
            params.push(impact);
        }

        sql += ` ORDER BY a.published_at DESC NULLS LAST LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        const result = await query(sql, params);

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
