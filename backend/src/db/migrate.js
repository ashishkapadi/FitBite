import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getDbConfig() {
  let config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fitbite_db',
    multipleStatements: true,
    connectTimeout: 10000
  };

  if (process.env.DB_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }

  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      config.host = parsed.hostname;
      config.port = parseInt(parsed.port || '3306', 10);
      config.user = decodeURIComponent(parsed.username);
      config.password = decodeURIComponent(parsed.password);
      config.database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'fitbite_db';
      if (parsed.searchParams.get('ssl') === 'true' || parsed.searchParams.get('ssl-mode') || process.env.DB_SSL === 'true') {
        config.ssl = { rejectUnauthorized: false };
      }
    } catch (err) {
      console.warn('[Migrate] Notice: Unable to parse DATABASE_URL as URL, falling back to individual parameters.', err.message);
    }
  }

  return config;
}

export async function runMigrations() {
  const config = getDbConfig();
  console.log(`[Migrate] Starting database migration for FitBite...`);
  console.log(`[Migrate] Target host: ${config.host}:${config.port}, database: ${config.database}`);

  let connection;
  try {
    // First try connecting directly to the specified database
    try {
      connection = await mysql.createConnection(config);
    } catch (dbErr) {
      // If error is database doesn't exist (ER_BAD_DB_ERROR), try connecting without database and create it
      if (dbErr.code === 'ER_BAD_DB_ERROR' || dbErr.errno === 1049) {
        console.log(`[Migrate] Database '${config.database}' not found. Attempting to create it...`);
        const rootConfig = { ...config };
        delete rootConfig.database;
        const rootConn = await mysql.createConnection(rootConfig);
        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await rootConn.end();
        connection = await mysql.createConnection(config);
      } else {
        throw dbErr;
      }
    }

    console.log(`[Migrate] Connected to MySQL successfully.`);

    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const rawSql = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL into individual statements, removing CREATE DATABASE / USE to be safe across hosted providers
    const statements = rawSql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        if (!s) return false;
        const upper = s.toUpperCase();
        if (upper.startsWith('CREATE DATABASE') || upper.startsWith('USE ')) {
          return false;
        }
        return true;
      });

    console.log(`[Migrate] Executing ${statements.length} DDL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await connection.query(stmt);
      } catch (stmtErr) {
        // Log warning for non-fatal statement errors
        console.warn(`[Migrate] Statement ${i + 1} warning: ${stmtErr.message}`);
      }
    }

    console.log(`[Migrate] All table migrations applied successfully!`);

    // Check if --seed flag passed
    const args = process.argv.slice(2);
    if (args.includes('--seed')) {
      console.log(`[Migrate] Seeding initial data...`);
      const { db } = await import('./db.js');
      await db.init();
      await db.seedIfEmpty();
    }

    console.log(`[Migrate] Migration process finished.`);
  } catch (err) {
    console.error(`[Migrate Error] Migration failed (${err.code || 'UNKNOWN'}):`, err.message || err);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations();
}
