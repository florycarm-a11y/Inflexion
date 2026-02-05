/**
 * Article Model
 * Database operations for articles
 */
const { query } = require('../config/database');

const Article = {
    /**
     * Get all articles with pagination and filters
     */
    async findAll({ category, source, impact, limit = 20, offset = 0, featured } = {}) {
        let sql = `
            SELECT * FROM v_articles_full
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (category) {
            sql += ` AND category_slug = $${paramIndex++}`;
            params.push(category);
        }

        if (source) {
            sql += ` AND source_slug = $${paramIndex++}`;
            params.push(source);
        }

        if (impact) {
            sql += ` AND impact = $${paramIndex++}`;
            params.push(impact);
        }

        if (featured !== undefined) {
            sql += ` AND is_featured = $${paramIndex++}`;
            params.push(featured);
        }

        sql += ` ORDER BY published_at DESC NULLS LAST, created_at DESC`;
        sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        return result.rows;
    },

    /**
     * Get article by ID
     */
    async findById(id) {
        const sql = `SELECT * FROM v_articles_full WHERE id = $1`;
        const result = await query(sql, [id]);
        return result.rows[0];
    },

    /**
     * Get featured articles for homepage
     */
    async getFeatured(limit = 3) {
        const sql = `
            SELECT * FROM v_articles_full
            WHERE is_featured = TRUE
            ORDER BY published_at DESC NULLS LAST
            LIMIT $1
        `;
        const result = await query(sql, [limit]);
        return result.rows;
    },

    /**
     * Get breaking news articles
     */
    async getBreaking(limit = 10) {
        const sql = `
            SELECT * FROM v_articles_full
            WHERE is_breaking = TRUE
            ORDER BY published_at DESC NULLS LAST
            LIMIT $1
        `;
        const result = await query(sql, [limit]);
        return result.rows;
    },

    /**
     * Get latest articles across all categories
     */
    async getLatest(limit = 10) {
        const sql = `
            SELECT * FROM v_articles_full
            ORDER BY
                CASE WHEN impact = 'high' THEN 0 ELSE 1 END,
                published_at DESC NULLS LAST
            LIMIT $1
        `;
        const result = await query(sql, [limit]);
        return result.rows;
    },

    /**
     * Create new article
     */
    async create(articleData) {
        const {
            source_id,
            category_id,
            external_id,
            title,
            description,
            content,
            url,
            image_url,
            author,
            published_at,
            impact = 'medium',
            sentiment,
            is_featured = false,
            is_breaking = false,
            metadata
        } = articleData;

        const sql = `
            INSERT INTO articles (
                source_id, category_id, external_id, title, description,
                content, url, image_url, author, published_at,
                impact, sentiment, is_featured, is_breaking, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (source_id, external_id) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                content = EXCLUDED.content,
                image_url = EXCLUDED.image_url,
                updated_at = NOW()
            RETURNING *
        `;

        const result = await query(sql, [
            source_id, category_id, external_id, title, description,
            content, url, image_url, author, published_at,
            impact, sentiment, is_featured, is_breaking, metadata
        ]);

        return result.rows[0];
    },

    /**
     * Update article
     */
    async update(id, updates) {
        const fields = Object.keys(updates);
        const values = Object.values(updates);

        if (fields.length === 0) return null;

        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        const sql = `UPDATE articles SET ${setClause} WHERE id = $1 RETURNING *`;

        const result = await query(sql, [id, ...values]);
        return result.rows[0];
    },

    /**
     * Delete article
     */
    async delete(id) {
        const sql = `DELETE FROM articles WHERE id = $1 RETURNING id`;
        const result = await query(sql, [id]);
        return result.rowCount > 0;
    },

    /**
     * Add tags to article
     */
    async addTags(articleId, tagIds) {
        const values = tagIds.map((tid, i) => `($1, $${i + 2})`).join(', ');
        const sql = `
            INSERT INTO article_tags (article_id, tag_id)
            VALUES ${values}
            ON CONFLICT DO NOTHING
        `;
        await query(sql, [articleId, ...tagIds]);
    },

    /**
     * Search articles by title/description
     */
    async search(searchTerm, limit = 20) {
        const sql = `
            SELECT * FROM v_articles_full
            WHERE title ILIKE $1 OR description ILIKE $1
            ORDER BY
                CASE WHEN title ILIKE $1 THEN 0 ELSE 1 END,
                published_at DESC
            LIMIT $2
        `;
        const result = await query(sql, [`%${searchTerm}%`, limit]);
        return result.rows;
    },

    /**
     * Get article count by category
     */
    async countByCategory() {
        const sql = `
            SELECT c.slug, c.name, COUNT(a.id) as count
            FROM categories c
            LEFT JOIN articles a ON c.id = a.category_id
            GROUP BY c.id
            ORDER BY c.display_order
        `;
        const result = await query(sql);
        return result.rows;
    }
};

module.exports = Article;
