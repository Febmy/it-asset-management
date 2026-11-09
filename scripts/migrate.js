/**
 * Database Migration Script for IT Asset Management
 *
 * This script handles idempotent database migrations:
 * 1. Creates _migrations tracking table if it doesn't exist
 * 2. Applies db/schema.sql as baseline migration (001_initial_schema)
 * 3. Applies any additional .sql files from db/migrations/ in alphabetical order
 *
 * Usage: node scripts/migrate.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration from environment variables
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'it_assets',
});

// Migration table name
const MIGRATIONS_TABLE = '_migrations';

// Migration directories
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting database migrations...');

    // 1. Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migrations table ready');

    // 2. Get list of already applied migrations
    const appliedResult = await client.query(
      `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id`
    );
    const appliedMigrations = new Set(appliedResult.rows.map(row => row.name));
    console.log(`📋 Already applied migrations: ${appliedMigrations.size}`);

    // 3. Define migration files in order
    const migrations = [];

    // Baseline migration from schema.sql
    if (fs.existsSync(SCHEMA_PATH)) {
      migrations.push({
        name: '001_initial_schema',
        path: SCHEMA_PATH,
        isBaseline: true
      });
    }

    // Additional migrations from db/migrations/ directory
    if (fs.existsSync(MIGRATIONS_DIR)) {
      const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Alphabetical order for consistent application

      for (const file of migrationFiles) {
        const name = file.replace('.sql', '');
        migrations.push({
          name,
          path: path.join(MIGRATIONS_DIR, file),
          isBaseline: false
        });
      }
    }

    console.log(`📦 Total migrations to process: ${migrations.length}`);

    // 4. Apply each migration if not already applied
    for (const migration of migrations) {
      if (appliedMigrations.has(migration.name)) {
        console.log(`⏭️  Skipping ${migration.name} (already applied)`);
        continue;
      }

      console.log(`🔧 Applying migration: ${migration.name}...`);

      const sql = fs.readFileSync(migration.path, 'utf8').replace(/^\uFEFF/, '');

      // Execute migration in a transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
          [migration.name]
        );
        await client.query('COMMIT');
        console.log(`✅ Applied ${migration.name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Failed to apply migration ${migration.name}: ${error.message}`);
      }
    }

    console.log('🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };