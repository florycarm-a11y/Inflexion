/**
 * Search API Routes
 * /api/search
 */
const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { query } = require('../config/database');

/**
 * GET /api/search
 * Full-text search across articles
 */
router.get('/', async (req, res, next) => {
    try {
        const { q, category, source, limit = 20 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Search query must be at least 2 characters'
            });
        }

        let sql = `
            SELECT
                a.*,
                s.name as source_name,
                s.slug as source_slug,
                s.color as source_color,
                s.initial as source_initial,
                c.name as category_name,
                c.slug as category_slug,
                ts_rank(
                    to_tsvector('french', COALESCE(a.title, '') || ' ' || COALESCE(a.description, '')),
                    plainto_tsquery('french', $1)
                ) as rank
            FROM articles a
            LEFT JOIN sources s ON a.source_id = s.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE (
                a.title ILIKE $2
                OR a.description ILIKE $2
            )
        `;
        const params = [q, `%${q}%`];
        let paramIndex = 3;

        if (category) {
            sql += ` AND c.slug = $${paramIndex++}`;
            params.push(category);
        }

        if (source) {
            sql += ` AND s.slug = $${paramIndex++}`;
            params.push(source);
        }

        sql += ` ORDER BY rank DESC, a.published_at DESC NULLS LAST LIMIT $${paramIndex}`;
        params.push(parseInt(limit));

        const result = await query(sql, params);

        res.json({
            success: true,
            query: q,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/search/suggest
 * Autocomplete suggestions
 */
router.get('/suggest', async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                success: true,
                suggestions: []
            });
        }

        const sql = `
            SELECT DISTINCT title
            FROM articles
            WHERE title ILIKE $1
            ORDER BY title
            LIMIT 5
        `;
        const result = await query(sql, [`%${q}%`]);

        res.json({
            success: true,
            suggestions: result.rows.map(r => r.title)
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
