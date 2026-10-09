import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { SCHEMA_STATEMENTS, REQUIRED_TABLES } from './schema.js';

dotenv.config();

export function getSanitizedDbUrl(rawUrl) {
  if (!rawUrl) return 'localhost:3306/fitbite_db';
  try {
    const parsed = new URL(rawUrl);
    const auth = parsed.username ? `${parsed.username}:****@` : '';
    return `${parsed.protocol}//${auth}${parsed.host}${parsed.pathname}`;
  } catch {
    return 'via DATABASE_URL (sanitized)';
  }
}

export function getDbConfig() {
  let config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fitbite_db',
    multipleStatements: true,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || (process.env.NODE_ENV === 'production' ? '15000' : '5000'), 10)
  };

  const isSslRequested = 
    process.env.DB_SSL === 'true' || 
    process.env.DB_SSL === '1' ||
    (process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('ssl=') || process.env.DATABASE_URL.includes('ssl-mode=')));

  if (isSslRequested) {
    config.ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
    };

    const caCert = process.env.DB_CA_CERT || process.env.DB_SSL_CA;
    if (caCert) {
      try {
        if (fs.existsSync(caCert)) {
          config.ssl.ca = fs.readFileSync(caCert, 'utf8');
        } else if (caCert.includes('-----BEGIN CERTIFICATE-----')) {
          config.ssl.ca = caCert;
        }
        config.ssl.rejectUnauthorized = true;
      } catch (caErr) {
        console.warn('[Migrate] Warning: Could not read DB_CA_CERT:', caErr.message);
      }
    }
  }

  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      config.host = parsed.hostname;
      config.port = parseInt(parsed.port || '3306', 10);
      config.user = decodeURIComponent(parsed.username);
      config.password = decodeURIComponent(parsed.password);
      config.database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'defaultdb';
    } catch (err) {
      console.warn('[Migrate] Notice: Unable to parse DATABASE_URL as URL, falling back to individual parameters.', err.message);
    }
  }

  return config;
}

export async function runMigrations(existingPoolOrConnection = null) {
  const config = getDbConfig();
  console.log(`[Migrate] Initiating database schema check & migrations...`);
  console.log(`[Migrate] Target database: ${config.database} on ${config.host}:${config.port} (SSL: ${config.ssl ? 'enabled' : 'disabled'})`);

  let connection = existingPoolOrConnection;
  let ownConnection = false;

  try {
    if (!connection) {
      try {
        connection = await mysql.createConnection(config);
        ownConnection = true;
      } catch (connErr) {
        // If the database doesn't exist on local dev (ER_BAD_DB_ERROR), create it
        if (connErr.code === 'ER_BAD_DB_ERROR' || connErr.errno === 1049) {
          console.log(`[Migrate] Database '${config.database}' not found. Attempting to create it...`);
          const rootConfig = { ...config };
          delete rootConfig.database;
          const rootConn = await mysql.createConnection(rootConfig);
          await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
          await rootConn.end();
          connection = await mysql.createConnection(config);
          ownConnection = true;
        } else {
          throw connErr;
        }
      }
    }

    console.log(`[Migrate] Connected to MySQL. Executing ${SCHEMA_STATEMENTS.length} DDL statements in dependency order...`);

    for (let i = 0; i < SCHEMA_STATEMENTS.length; i++) {
      const stmt = SCHEMA_STATEMENTS[i].trim();
      if (!stmt) continue;
      try {
        await connection.query(stmt);
      } catch (stmtErr) {
        console.error(`[Migrate Error] Failed statement ${i + 1}: ${stmtErr.message}`);
        throw new Error(`Migration statement ${i + 1} failed (${stmtErr.code || stmtErr.message})`);
      }
    }

    // Verify all required tables exist in the target database
    const [rows] = await connection.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = ?`,
      [config.database]
    );
    const existingTableNames = new Set(rows.map(r => (r.table_name || r.TABLE_NAME).toLowerCase()));

    const missingTables = REQUIRED_TABLES.filter(t => !existingTableNames.has(t.toLowerCase()));
    if (missingTables.length > 0) {
      throw new Error(`Migration verification failed: Missing tables [${missingTables.join(', ')}] in database '${config.database}'`);
    }

    console.log(`[Migrate] Verification passed: All ${REQUIRED_TABLES.length} tables confirmed ready in '${config.database}'.`);
    return true;
  } catch (err) {
    console.error(`[Migrate Critical] Migration failed:`, err.message);
    throw err;
  } finally {
    if (ownConnection && connection) {
      await connection.end();
    }
  }
}

// Auto-run if executed directly via CLI
if (process.argv[1] && (process.argv[1].endsWith('migrate.js') || process.argv[1].endsWith('migrate'))) {
  (async () => {
    try {
      await runMigrations();
      if (process.argv.includes('--seed')) {
        console.log(`[Migrate] Running seed data...`);
        const { db } = await import('./db.js');
        await db.init();
      }
      console.log(`[Migrate] CLI migration completed successfully.`);
      process.exit(0);
    } catch (e) {
      console.error(`[Migrate] CLI migration aborted:`, e.message);
      process.exit(1);
    }
  })();
}
