/**
 * Database Migration Runner
 * Executes SQL migration files in order
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function runMigrations() {
    console.log('Starting database migrations...\n');

    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    if (files.length === 0) {
        console.log('No migration files found.');
        return;
    }

    const client = await pool.connect();

    try {
        for (const file of files) {
            console.log(`Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');

            console.log(`✓ Completed: ${file}\n`);
        }

        console.log('All migrations completed successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error.message);
        console.error('Rolled back transaction.');
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
