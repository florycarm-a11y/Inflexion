/**
 * Market Data API Routes
 * /api/market
 */
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/market
 * Get all market data
 */
router.get('/', async (req, res, next) => {
    try {
        const sql = `
            SELECT * FROM market_data
            ORDER BY
                CASE category
                    WHEN 'index' THEN 1
                    WHEN 'stock' THEN 2
                    WHEN 'commodity' THEN 3
                    WHEN 'forex' THEN 4
                    WHEN 'crypto' THEN 5
                    ELSE 6
                END,
                name
        `;
        const result = await query(sql);

        res.json({
            success: true,
            data: result.rows,
            updated_at: result.rows[0]?.updated_at || new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/market/:symbol
 * Get specific market data by symbol
 */
router.get('/:symbol', async (req, res, next) => {
    try {
        const sql = `SELECT * FROM market_data WHERE symbol = $1`;
        const result = await query(sql, [req.params.symbol.toUpperCase()]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Symbol not found'
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
 * GET /api/market/category/:category
 * Get market data by category
 */
router.get('/category/:category', async (req, res, next) => {
    try {
        const sql = `
            SELECT * FROM market_data
            WHERE category = $1
            ORDER BY name
        `;
        const result = await query(sql, [req.params.category]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/market/:symbol
 * Update market data (internal use)
 */
router.put('/:symbol', async (req, res, next) => {
    try {
        const { price, change_percent, change_value, volume, market_cap } = req.body;

        const sql = `
            UPDATE market_data
            SET price = COALESCE($2, price),
                change_percent = COALESCE($3, change_percent),
                change_value = COALESCE($4, change_value),
                volume = COALESCE($5, volume),
                market_cap = COALESCE($6, market_cap),
                updated_at = NOW()
            WHERE symbol = $1
            RETURNING *
        `;
        const result = await query(sql, [
            req.params.symbol.toUpperCase(),
            price,
            change_percent,
            change_value,
            volume,
            market_cap
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Symbol not found'
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

module.exports = router;
