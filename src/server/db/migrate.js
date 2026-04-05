import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'moneytracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Running database migrations...');

    // Get all migration files
    const migrationsDir = join(__dirname, 'migrations');
    const migrationFiles = ['001_init.sql'];

    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      console.log(`Executing: ${file}`);

      const sql = readFileSync(filePath, 'utf8');

      // Split by semicolon for multiple statements, filter empty
      const statements = sql
        .split(/;(?=\s*(?:CREATE|INSERT|DROP|ALTER|COPY|GRANT|USER|CONNECT|GRANT)\b)/i)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.length === 0) continue;
        try {
          await client.query(statement);
          console.log(`  ✓ Executed: ${statement.substring(0, 60)}...`);
        } catch (err) {
          // Ignore "already exists" errors for idempotent migrations
          if (err.code === '42P07' || // duplicate_table
              err.code === '42710' || // duplicate_object
              err.code === '23505' || // unique_violation
              err.message.includes('already exists')) {
            console.log(`  ⊘ Skipped (already exists): ${statement.substring(0, 60)}...`);
          } else {
            throw err;
          }
        }
      }
    }

    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
