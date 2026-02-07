/**
 * PostgreSQL Database Configuration
 * Inflexion Backend
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Fallback to individual params if DATABASE_URL not set
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'inflexion',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
    console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
});

/**
 * Execute a query with optional parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV === 'development') {
            console.log('Query executed', { text: text.substring(0, 50), duration, rows: result.rowCount });
        }
        return result;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise} Pool client
 */
const getClient = async () => {
    const client = await pool.connect();
    const originalQuery = client.query.bind(client);
    const originalRelease = client.release.bind(client);

    // Override release to log
    client.release = () => {
        client.query = originalQuery;
        client.release = originalRelease;
        return originalRelease();
    };

    return client;
};

module.exports = {
    pool,
    query,
    getClient
};
