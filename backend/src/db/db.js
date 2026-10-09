import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { localStore } from './localStore.js';
import { runMigrations, getDbConfig, getSanitizedDbUrl } from './migrate.js';
import {
  SEED_USERS,
  SEED_CUSTOMER_PROFILES,
  SEED_CUSTOMER_PREFERENCES,
  SEED_ADDRESSES,
  SEED_SELLERS,
  SEED_CATEGORIES,
  SEED_CUSTOMIZATION_OPTIONS,
  SEED_SUBSCRIPTION_PLANS,
  SEED_COUPONS
} from './seedData.js';
import { SEED_MEALS } from './mealsSeed.js';
import { generateDailyTiffinMenus } from './menusSeed.js';

export function validateSeedGraph() {
  const userIds = new Set(SEED_USERS.map(u => u.id));
  const userEmails = new Set(SEED_USERS.map(u => u.email.toLowerCase()));
  const cpIds = new Set(SEED_CUSTOMER_PROFILES.map(cp => cp.id));
  const sellerIds = new Set(SEED_SELLERS.map(s => s.id));
  const catIds = new Set(SEED_CATEGORIES.map(c => c.id));

  // 1. Verify Customer Profiles
  for (const cp of SEED_CUSTOMER_PROFILES) {
    if (!userIds.has(cp.user_id) && (!cp.user_email || !userEmails.has(cp.user_email.toLowerCase()))) {
      throw new Error(`[DB CRITICAL] Seed graph validation error: Customer profile '${cp.id}' references non-existent user '${cp.user_id}'.`);
    }
  }

  // 2. Verify Customer Preferences
  for (const pref of SEED_CUSTOMER_PREFERENCES) {
    if (!cpIds.has(pref.customer_id)) {
      throw new Error(`[DB CRITICAL] Seed graph validation error: Customer preference '${pref.id}' references non-existent customer profile '${pref.customer_id}'.`);
    }
  }

  // 3. Verify Addresses
  for (const addr of SEED_ADDRESSES) {
    if (!userIds.has(addr.user_id) && (!addr.user_email || !userEmails.has(addr.user_email.toLowerCase()))) {
      throw new Error(`[DB CRITICAL] Seed graph validation error: Address '${addr.id}' references non-existent user '${addr.user_id}'.`);
    }
  }

  // 4. Verify Sellers
  for (const s of SEED_SELLERS) {
    if (!userIds.has(s.user_id) && (!s.user_email || !userEmails.has(s.user_email.toLowerCase()))) {
      throw new Error(`[DB CRITICAL] Seed graph validation error: Seller '${s.id}' (${s.business_name}) references non-existent user '${s.user_id}'.`);
    }
  }

  // 5. Verify Meals
  for (const m of SEED_MEALS) {
    if (!sellerIds.has(m.seller_id)) {
      throw new Error(`[DB CRITICAL] Seed graph validation error: Meal '${m.id}' (${m.name}) references non-existent seller '${m.seller_id}'.`);
    }
    if (!catIds.has(m.category_id)) {
      throw new Error(`[DB CRITICAL] Seed graph validation error: Meal '${m.id}' (${m.name}) references non-existent category '${m.category_id}'.`);
    }
  }

  // 6. Verify Subscription Plans
  for (const sp of SEED_SUBSCRIPTION_PLANS) {
    if (!sellerIds.has(sp.seller_id)) {
      throw new Error(`[DB CRITICAL] Seed graph validation error: Subscription plan '${sp.id}' references non-existent seller '${sp.seller_id}'.`);
    }
  }
}

export const STATIC_SCHEMA_METADATA = {
  users: {
    id: { dataType: 'varchar' },
    email: { dataType: 'varchar' },
    password_hash: { dataType: 'varchar' },
    role: { dataType: 'varchar' },
    full_name: { dataType: 'varchar' },
    phone: { dataType: 'varchar' },
    is_active: { dataType: 'boolean' },
    created_at: { dataType: 'timestamp', precision: 0 },
    updated_at: { dataType: 'timestamp', precision: 0 }
  },
  customer_profiles: {
    id: { dataType: 'varchar' },
    user_id: { dataType: 'varchar' },
    onboarding_completed: { dataType: 'boolean' },
    created_at: { dataType: 'timestamp', precision: 0 },
    updated_at: { dataType: 'timestamp', precision: 0 }
  },
  customer_preferences: {
    allergies: { dataType: 'json' },
    avoid_ingredients: { dataType: 'json' },
    preferred_cuisines: { dataType: 'json' },
    updated_at: { dataType: 'timestamp', precision: 0 }
  },
  addresses: {
    id: { dataType: 'varchar' },
    user_id: { dataType: 'varchar' },
    created_at: { dataType: 'timestamp', precision: 0 }
  },
  seller_profiles: {
    id: { dataType: 'varchar' },
    user_id: { dataType: 'varchar' },
    pincodes_served: { dataType: 'json' },
    cuisine_specializations: { dataType: 'json' },
    fssai_expiry_date: { dataType: 'date' },
    is_listed: { dataType: 'boolean' },
    created_at: { dataType: 'timestamp', precision: 0 },
    updated_at: { dataType: 'timestamp', precision: 0 }
  },
  seller_verification_documents: {
    uploaded_at: { dataType: 'timestamp', precision: 0 }
  },
  categories: {
    id: { dataType: 'varchar' },
    name: { dataType: 'varchar' },
    slug: { dataType: 'varchar' }
  },
  meals: {
    portion_choices: { dataType: 'json' },
    ingredients: { dataType: 'json' },
    allergens: { dataType: 'json' },
    dietary_tags: { dataType: 'json' },
    is_available: { dataType: 'boolean' },
    is_featured: { dataType: 'boolean' },
    is_tiffin_eligible: { dataType: 'boolean' },
    created_at: { dataType: 'timestamp', precision: 0 },
    updated_at: { dataType: 'timestamp', precision: 0 }
  },
  customization_options: {},
  meal_customization_mappings: {},
  carts: {
    id: { dataType: 'varchar' },
    user_id: { dataType: 'varchar' },
    seller_id: { dataType: 'varchar' },
    created_at: { dataType: 'timestamp', precision: 0 },
    updated_at: { dataType: 'timestamp', precision: 0 }
  },
  cart_items: {
    id: { dataType: 'varchar' },
    cart_id: { dataType: 'varchar' },
    meal_id: { dataType: 'varchar' },
    customizations: { dataType: 'json' },
    created_at: { dataType: 'timestamp', precision: 0 }
  },
  coupons: {
    valid_from: { dataType: 'datetime', precision: 0 },
    valid_until: { dataType: 'datetime', precision: 0 },
    is_active: { dataType: 'boolean' },
    created_at: { dataType: 'timestamp', precision: 0 }
  },
  orders: {
    created_at: { dataType: 'timestamp', precision: 0 },
    updated_at: { dataType: 'timestamp', precision: 0 }
  },
  order_items: {
    customizations: { dataType: 'json' }
  },
  payments: {
    raw_gateway_response: { dataType: 'json' },
    created_at: { dataType: 'timestamp', precision: 0 },
    updated_at: { dataType: 'timestamp', precision: 0 }
  },
  refunds: {
    created_at: { dataType: 'timestamp', precision: 0 }
  },
  subscriptions: {
    delivery_days: { dataType: 'json' },
    dietary_preferences: { dataType: 'json' },
    start_date: { dataType: 'date' },
    original_end_date: { dataType: 'date' },
    revised_end_date: { dataType: 'date' },
    cancelled_at: { dataType: 'datetime', precision: 0 },
    created_at: { dataType: 'timestamp', precision: 0 },
    updated_at: { dataType: 'timestamp', precision: 0 }
  },
  daily_tiffin_menus: {
    meal_ids: { dataType: 'json' },
    menu_date: { dataType: 'date' },
    created_at: { dataType: 'timestamp', precision: 0 }
  },
  scheduled_deliveries: {
    delivery_date: { dataType: 'date' },
    created_at: { dataType: 'timestamp', precision: 0 },
    updated_at: { dataType: 'timestamp', precision: 0 }
  },
  saved_custom_meals: {
    selections: { dataType: 'json' },
    created_at: { dataType: 'timestamp', precision: 0 }
  },
  delivery_tracking_events: {
    event_timestamp: { dataType: 'datetime', precision: 0 },
    created_at: { dataType: 'timestamp', precision: 0 }
  },
  reviews: {
    created_at: { dataType: 'timestamp', precision: 0 }
  },
  audit_logs: {
    metadata: { dataType: 'json' },
    created_at: { dataType: 'timestamp', precision: 0 }
  }
};

const TABLES_WITH_UPDATED_AT = new Set([
  'users',
  'customer_profiles',
  'customer_preferences',
  'seller_profiles',
  'meals',
  'carts',
  'orders',
  'subscriptions'
]);

const TABLES_WITH_CREATED_AT = new Set([
  'users',
  'customer_profiles',
  'customer_preferences',
  'addresses',
  'seller_profiles',
  'meals',
  'carts',
  'cart_items',
  'coupons',
  'orders',
  'payments',
  'refunds',
  'subscriptions',
  'daily_tiffin_menus',
  'scheduled_deliveries',
  'saved_custom_meals',
  'delivery_tracking_events',
  'reviews',
  'audit_logs'
]);

/**
 * Formats a Date or timestamp into a SQL-compliant UTC string (YYYY-MM-DD HH:MM:SS[.fractional]).
 * Avoids ISO-8601 'T' and 'Z' characters which cause MySQL 1292 Incorrect datetime value.
 */
export function formatUtcDatetime(dateOrString, precision = 0) {
  if (!dateOrString) return null;
  const d = dateOrString instanceof Date ? dateOrString : new Date(dateOrString);
  if (isNaN(d.getTime())) return dateOrString;

  const pad = n => String(n).padStart(2, '0');
  const YYYY = d.getUTCFullYear();
  const MM = pad(d.getUTCMonth() + 1);
  const DD = pad(d.getUTCDate());
  const HH = pad(d.getUTCHours());
  const mm = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  let res = `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
  if (precision > 0) {
    const ms = String(d.getUTCMilliseconds()).padStart(3, '0');
    res += `.${ms.padEnd(precision, '0').slice(0, precision)}`;
  }
  return res;
}

/**
 * Formats a Date into a SQL-compliant date-only string (YYYY-MM-DD).
 */
export function formatUtcDateOnly(dateOrString) {
  if (!dateOrString) return null;
  if (typeof dateOrString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrString)) {
    return dateOrString;
  }
  const d = dateOrString instanceof Date ? dateOrString : new Date(dateOrString);
  if (isNaN(d.getTime())) return dateOrString;

  const pad = n => String(n).padStart(2, '0');
  const YYYY = d.getUTCFullYear();
  const MM = pad(d.getUTCMonth() + 1);
  const DD = pad(d.getUTCDate());
  return `${YYYY}-${MM}-${DD}`;
}

/**
 * Schema-aware serializer for column values.
 * Handles UTC datetime conversions, DATE-only formatting, JSON serialization, and primitive preservation.
 */
export function serializeColumnValue(table, col, val, colMeta = null) {
  if (val === null || val === undefined) {
    return null;
  }

  const meta = colMeta || STATIC_SCHEMA_METADATA[table]?.[col];
  const dataType = meta?.dataType?.toLowerCase();
  const precision = meta?.precision ?? 0;

  // 1. TIMESTAMP or DATETIME columns
  if (
    dataType === 'timestamp' ||
    dataType === 'datetime' ||
    col === 'created_at' ||
    col === 'updated_at' ||
    col.endsWith('_at') ||
    col.endsWith('_timestamp')
  ) {
    return formatUtcDatetime(val, precision);
  }

  // 2. DATE columns
  if (dataType === 'date' || col.endsWith('_date') || col === 'date') {
    return formatUtcDateOnly(val);
  }

  // 3. JSON columns or structured object values (excluding Date instances)
  if (dataType === 'json' || (typeof val === 'object' && !(val instanceof Date))) {
    return typeof val === 'object' ? JSON.stringify(val) : val;
  }

  // 4. Boolean values for MySQL TINYINT columns
  if (typeof val === 'boolean' && (dataType === 'tinyint' || dataType === 'boolean')) {
    return val ? 1 : 0;
  }

  // 5. Preserved primitives (strings, numbers, etc.)
  return val;
}

/**
 * Scoped database client passed into withTransaction() callback.
 * Routes all queries through a dedicated, transaction-bound MySQL connection.
 */
class ScopedDatabaseService {
  constructor(parent, connection) {
    this.parent = parent;
    this.connection = connection;
    this.mode = 'mysql';
  }

  async find(table, filter = () => true) {
    const [rows] = await this.connection.query(`SELECT * FROM \`${table}\``);
    if (typeof filter === 'function') {
      return rows.filter(filter);
    }
    if (typeof filter === 'object' && filter !== null) {
      return rows.filter(row => {
        return Object.entries(filter).every(([k, v]) => {
          const rowVal = row[k];
          if (typeof v === 'boolean') return Boolean(rowVal) === v;
          if (typeof v === 'number' && typeof rowVal === 'string') return Number(rowVal) === v;
          if (typeof v === 'string' && typeof rowVal === 'number') return String(rowVal) === v;
          return rowVal === v;
        });
      });
    }
    return rows;
  }

  async findOne(table, filter = () => true) {
    const list = await this.find(table, filter);
    return list.length > 0 ? list[0] : null;
  }

  async insert(table, data) {
    return this.parent.insert(table, data, this.connection);
  }

  async update(table, filter, updates) {
    return this.parent.update(table, filter, updates, this.connection);
  }

  async delete(table, filter) {
    return this.parent.delete(table, filter, this.connection);
  }

  async count(table, filter = () => true) {
    const list = await this.find(table, filter);
    return list.length;
  }
}

class DatabaseService {
  constructor() {
    this.mode = 'local'; // 'mysql' or 'local'
    this.pool = null;
    this.isInitialized = false;
    this.schemaColumns = new Map();
    this.schemaColumnMetadata = new Map();
  }

  async init() {
    if (this.isInitialized) return;

    // Validate in-memory fixture relationship graph upfront
    validateSeedGraph();

    const config = getDbConfig();
    const fallbackExplicitlyDisabled = process.env.ENABLE_LOCAL_JSON_FALLBACK === 'false' || process.env.ENABLE_LOCAL_JSON_FALLBACK === '0';
    const isProduction = process.env.NODE_ENV === 'production';
    const allowFallback = !fallbackExplicitlyDisabled && (process.env.ENABLE_LOCAL_JSON_FALLBACK === 'true' || !isProduction);

    try {
      console.log(`[DB] Connecting to MySQL at ${config.host}:${config.port}/${config.database} (SSL: ${config.ssl ? 'enabled' : 'disabled'})...`);

      this.pool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        ssl: config.ssl,
        timezone: 'Z', // Treat JavaScript dates explicitly as UTC
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });

      // 1. Verify basic connection and set session timezone to UTC
      const [rows] = await this.pool.query('SELECT 1 as test');
      if (!rows || rows.length === 0) {
        throw new Error('MySQL connectivity test query returned empty result.');
      }
      await this.pool.query("SET time_zone = '+00:00'");

      this.mode = 'mysql';
      console.log(`[DB] MySQL connection established successfully with UTC session timezone.`);

      // 2. Run schema migrations in dependency order
      console.log(`[DB] Running database migrations on '${config.database}'...`);
      await runMigrations(this.pool);

      // 3. Introspect schema column names and types for type-safe, column-safe writes
      try {
        const [colRows] = await this.pool.query(
          "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, DATETIME_PRECISION FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE()"
        );
        this.schemaColumns = new Map();
        this.schemaColumnMetadata = new Map();
        for (const r of colRows) {
          if (!this.schemaColumns.has(r.TABLE_NAME)) {
            this.schemaColumns.set(r.TABLE_NAME, new Set());
            this.schemaColumnMetadata.set(r.TABLE_NAME, new Map());
          }
          this.schemaColumns.get(r.TABLE_NAME).add(r.COLUMN_NAME);
          this.schemaColumnMetadata.get(r.TABLE_NAME).set(r.COLUMN_NAME, {
            dataType: (r.DATA_TYPE || '').toLowerCase(),
            precision: r.DATETIME_PRECISION !== null ? parseInt(r.DATETIME_PRECISION, 10) : 0
          });
        }
      } catch (colErr) {
        console.warn('[DB] Notice: Could not inspect INFORMATION_SCHEMA.COLUMNS, using static whitelist.');
      }

      // 4. Run repeatable, parent-resolved idempotent seeding
      await this.seedIfEmpty();

      this.isInitialized = true;
      console.log(`[DB] Database initialization complete in MYSQL mode.`);
    } catch (err) {
      if (!allowFallback) {
        console.error(`[DB CRITICAL] Database initialization failed on ${config.host}:${config.port}/${config.database}:`, err.message);
        throw new Error(`[DB CRITICAL] MySQL initialization failed: ${err.message}. ENABLE_LOCAL_JSON_FALLBACK is false. Server refusing to start without real database.`);
      }

      console.warn(`[DB] Notice: MySQL server connection/migration not available (${err.code || err.message}).`);
      console.log(`[DB] Using local JSON storage fallback (ENABLE_LOCAL_JSON_FALLBACK=true for offline local development).`);

      this.mode = 'local';
      localStore.init();
      await this.seedIfEmpty();
      this.isInitialized = true;
    }
  }

  getMode() {
    return this.mode;
  }

  getColumnMeta(table, col) {
    const fromSchema = this.schemaColumnMetadata?.get(table)?.get(col);
    if (fromSchema) return fromSchema;
    return STATIC_SCHEMA_METADATA[table]?.[col] || null;
  }

  hasColumn(table, col) {
    if (this.schemaColumns?.has(table)) {
      return this.schemaColumns.get(table).has(col);
    }
    if (STATIC_SCHEMA_METADATA[table]?.[col] !== undefined) {
      return true;
    }
    if (col === 'created_at') return TABLES_WITH_CREATED_AT.has(table);
    if (col === 'updated_at') return TABLES_WITH_UPDATED_AT.has(table);
    return true;
  }

  getColumnPrecision(table, col) {
    const meta = this.getColumnMeta(table, col);
    return meta?.precision ?? 0;
  }

  /**
   * Executes workFn inside a transaction.
   * On error, all changes within workFn are automatically rolled back.
   */
  async withTransaction(workFn) {
    if (this.mode === 'mysql') {
      const connection = await this.pool.getConnection();
      try {
        await connection.beginTransaction();
        const scoped = new ScopedDatabaseService(this, connection);
        const result = await workFn(scoped);
        await connection.commit();
        return result;
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    }

    // Local in-memory transaction: snapshot data and restore on error
    const snapshot = JSON.parse(JSON.stringify(localStore.data));
    try {
      const result = await workFn(this);
      return result;
    } catch (err) {
      localStore.data = snapshot;
      localStore.save();
      throw err;
    }
  }

  async find(table, filter = () => true) {
    if (this.mode === 'mysql') {
      const [rows] = await this.pool.query(`SELECT * FROM \`${table}\``);
      if (typeof filter === 'function') {
        return rows.filter(filter);
      }
      if (typeof filter === 'object' && filter !== null) {
        return rows.filter(row => {
          return Object.entries(filter).every(([k, v]) => {
            const rowVal = row[k];
            if (typeof v === 'boolean') {
              return Boolean(rowVal) === v;
            }
            if (typeof v === 'number' && typeof rowVal === 'string') {
              return Number(rowVal) === v;
            }
            if (typeof v === 'string' && typeof rowVal === 'number') {
              return String(rowVal) === v;
            }
            return rowVal === v;
          });
        });
      }
      return rows;
    }

    if (typeof filter === 'object' && filter !== null && typeof filter !== 'function') {
      return localStore.find(table, row => {
        return Object.entries(filter).every(([k, v]) => {
          const rowVal = row[k];
          if (typeof v === 'boolean') return Boolean(rowVal) === v;
          if (typeof v === 'number' && typeof rowVal === 'string') return Number(rowVal) === v;
          if (typeof v === 'string' && typeof rowVal === 'number') return String(rowVal) === v;
          return rowVal === v;
        });
      });
    }
    return localStore.find(table, filter);
  }

  async findOne(table, filter = () => true) {
    const list = await this.find(table, filter);
    return list.length > 0 ? list[0] : null;
  }

  async insert(table, data, conn = null) {
    const row = { ...data };
    const hasCreatedAt = this.hasColumn(table, 'created_at');
    const hasUpdatedAt = this.hasColumn(table, 'updated_at');

    if (hasCreatedAt && row.created_at === undefined) {
      row.created_at = formatUtcDatetime(new Date(), this.getColumnPrecision(table, 'created_at'));
    } else if (hasCreatedAt && row.created_at !== undefined) {
      row.created_at = serializeColumnValue(table, 'created_at', row.created_at, this.getColumnMeta(table, 'created_at'));
    }

    if (hasUpdatedAt && row.updated_at === undefined) {
      row.updated_at = formatUtcDatetime(new Date(), this.getColumnPrecision(table, 'updated_at'));
    } else if (hasUpdatedAt && row.updated_at !== undefined) {
      row.updated_at = serializeColumnValue(table, 'updated_at', row.updated_at, this.getColumnMeta(table, 'updated_at'));
    }

    if (this.mode === 'mysql') {
      const runner = conn || this.pool;
      const tableCols = this.schemaColumns?.get(table);
      const validKeys = tableCols ? Object.keys(row).filter(k => tableCols.has(k)) : Object.keys(row);
      const placeholders = validKeys.map(() => '?').join(', ');
      const values = validKeys.map(k => {
        return serializeColumnValue(table, k, row[k], this.getColumnMeta(table, k));
      });
      const updateClause = validKeys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ');
      const sql = `INSERT INTO \`${table}\` (${validKeys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
      await runner.query(sql, values);
      return row;
    }

    return localStore.insert(table, row);
  }

  async update(table, filter, updates, conn = null) {
    if (this.mode === 'mysql') {
      const runner = conn || this.pool;
      const existing = await (conn ? new ScopedDatabaseService(this, conn).find(table, filter) : this.find(table, filter));
      const hasUpdatedAt = this.hasColumn(table, 'updated_at');
      const tableCols = this.schemaColumns?.get(table);

      for (const item of existing) {
        let updateKeys = Object.keys(updates);
        if (tableCols) {
          updateKeys = updateKeys.filter(k => tableCols.has(k));
        }
        if (updateKeys.length === 0) continue;

        let setClause = updateKeys.map(k => `\`${k}\` = ?`).join(', ');
        const values = updateKeys.map(k => {
          return serializeColumnValue(table, k, updates[k], this.getColumnMeta(table, k));
        });

        if (hasUpdatedAt && !updateKeys.includes('updated_at')) {
          setClause += ', `updated_at` = ?';
          values.push(formatUtcDatetime(new Date(), this.getColumnPrecision(table, 'updated_at')));
        }

        values.push(item.id);
        await runner.query(`UPDATE \`${table}\` SET ${setClause} WHERE id = ?`, values);
      }
      return existing.map(item => ({ ...item, ...updates }));
    }

    return localStore.update(
      table,
      typeof filter === 'function' ? filter : row => Object.entries(filter).every(([k, v]) => row[k] === v),
      updates
    );
  }

  async delete(table, filter, conn = null) {
    if (this.mode === 'mysql') {
      const runner = conn || this.pool;
      const existing = await (conn ? new ScopedDatabaseService(this, conn).find(table, filter) : this.find(table, filter));
      for (const item of existing) {
        await runner.query(`DELETE FROM \`${table}\` WHERE id = ?`, [item.id]);
      }
      return existing;
    }

    return localStore.delete(
      table,
      typeof filter === 'function' ? filter : row => Object.entries(filter).every(([k, v]) => row[k] === v)
    );
  }

  async count(table, filter = () => true) {
    const list = await this.find(table, filter);
    return list.length;
  }


  async seedIfEmpty() {
    console.log('[DB] Running resilient, parent-resolved seed state verification...');

    // 1. Users: Seed/upsert all users and resolve dynamic Map of fixtureId -> storedId, email -> storedId
    const userIdMap = new Map(); // fixtureId / storedId / email -> storedId

    if (this.mode === 'mysql') {
      for (const u of SEED_USERS) {
        const sql = `INSERT INTO \`users\` (id, email, password_hash, role, full_name, phone, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone = VALUES(phone), is_active = VALUES(is_active)`;
        await this.pool.query(sql, [u.id, u.email, u.password_hash, u.role, u.full_name, u.phone, u.is_active]);
      }

      // Query all users from MySQL to populate complete ID map
      const [allUserRows] = await this.pool.query('SELECT id, email FROM `users`');
      for (const row of allUserRows) {
        userIdMap.set(row.id, row.id);
        if (row.email) {
          userIdMap.set(row.email.toLowerCase(), row.id);
        }
      }
      // Associate fixture IDs with actual stored IDs
      for (const u of SEED_USERS) {
        const storedId = userIdMap.get(u.email.toLowerCase()) || userIdMap.get(u.id);
        if (storedId) {
          userIdMap.set(u.id, storedId);
        }
      }
    } else {
      for (const u of SEED_USERS) {
        const existing = localStore.findOne('users', r => r.email === u.email || r.id === u.id);
        if (!existing) {
          localStore.insert('users', u);
          userIdMap.set(u.id, u.id);
          userIdMap.set(u.email.toLowerCase(), u.id);
        } else {
          userIdMap.set(u.id, existing.id);
          userIdMap.set(u.email.toLowerCase(), existing.id);
        }
      }
    }

    // 2. Customer Profiles
    const cpIdMap = new Map(); // fixtureCpId -> storedCpId
    for (const cp of SEED_CUSTOMER_PROFILES) {
      const realUserId = userIdMap.get(cp.user_id) || userIdMap.get(cp.user_email?.toLowerCase()) || cp.user_id;
      if (!realUserId) {
        throw new Error(`[DB CRITICAL] Seed initialization error: Customer profile fixture '${cp.id}' user_id '${cp.user_id}' could not be resolved.`);
      }

      if (this.mode === 'mysql') {
        // Pre-write verification
        const [uCheck] = await this.pool.query('SELECT id FROM `users` WHERE id = ?', [realUserId]);
        if (!uCheck || uCheck.length === 0) {
          throw new Error(`[DB CRITICAL] Customer profile fixture '${cp.id}' initialization error: Parent user_id '${realUserId}' (resolved from fixture '${cp.user_id}') does not exist in users table.`);
        }

        const [existingCp] = await this.pool.query('SELECT id FROM `customer_profiles` WHERE user_id = ?', [realUserId]);
        const targetCpId = (existingCp && existingCp.length > 0) ? existingCp[0].id : cp.id;

        const sql = `INSERT INTO \`customer_profiles\` (id, user_id, living_situation, routine_type, primary_interest, default_delivery_slot, onboarding_completed)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE default_delivery_slot = VALUES(default_delivery_slot), onboarding_completed = VALUES(onboarding_completed)`;
        await this.pool.query(sql, [targetCpId, realUserId, cp.living_situation, cp.routine_type, cp.primary_interest, cp.default_delivery_slot, cp.onboarding_completed]);

        const [rows] = await this.pool.query('SELECT id FROM `customer_profiles` WHERE user_id = ?', [realUserId]);
        if (rows && rows.length > 0) {
          cpIdMap.set(cp.id, rows[0].id);
          cpIdMap.set(rows[0].id, rows[0].id);
        }
      } else {
        const existing = localStore.findOne('customer_profiles', r => r.user_id === realUserId);
        if (!existing) {
          const inserted = { ...cp, user_id: realUserId };
          localStore.insert('customer_profiles', inserted);
          cpIdMap.set(cp.id, inserted.id);
        } else {
          cpIdMap.set(cp.id, existing.id);
        }
      }
    }

    // 3. Customer Preferences
    for (const pref of SEED_CUSTOMER_PREFERENCES) {
      const realCpId = cpIdMap.get(pref.customer_id) || pref.customer_id;
      if (!realCpId) {
        throw new Error(`[DB CRITICAL] Seed initialization error: Customer preference fixture '${pref.id}' customer_id '${pref.customer_id}' could not be resolved.`);
      }

      if (this.mode === 'mysql') {
        const [cpCheck] = await this.pool.query('SELECT id FROM `customer_profiles` WHERE id = ?', [realCpId]);
        if (!cpCheck || cpCheck.length === 0) {
          throw new Error(`[DB CRITICAL] Customer preferences fixture '${pref.id}' initialization error: customer_profile '${realCpId}' (resolved from fixture '${pref.customer_id}') does not exist in customer_profiles table.`);
        }

        const [existingPref] = await this.pool.query('SELECT id FROM `customer_preferences` WHERE customer_id = ?', [realCpId]);
        const targetPrefId = (existingPref && existingPref.length > 0) ? existingPref[0].id : pref.id;

        const sql = `INSERT INTO \`customer_preferences\` (id, customer_id, goal, dietary_preference, allergies, avoid_ingredients, preferred_cuisines, spice_preference, budget_per_meal, preferred_portion, age, height_cm, weight_kg, activity_level, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE goal = VALUES(goal), dietary_preference = VALUES(dietary_preference), allergies = VALUES(allergies), avoid_ingredients = VALUES(avoid_ingredients), preferred_cuisines = VALUES(preferred_cuisines), spice_preference = VALUES(spice_preference), budget_per_meal = VALUES(budget_per_meal), preferred_portion = VALUES(preferred_portion), age = VALUES(age), height_cm = VALUES(height_cm), weight_kg = VALUES(weight_kg), activity_level = VALUES(activity_level), notes = VALUES(notes)`;
        await this.pool.query(sql, [
          targetPrefId,
          realCpId,
          pref.goal,
          pref.dietary_preference,
          JSON.stringify(pref.allergies || []),
          JSON.stringify(pref.avoid_ingredients || []),
          JSON.stringify(pref.preferred_cuisines || []),
          pref.spice_preference,
          pref.budget_per_meal,
          pref.preferred_portion,
          pref.age,
          pref.height_cm,
          pref.weight_kg,
          pref.activity_level,
          pref.notes
        ]);
      } else {
        const existing = localStore.findOne('customer_preferences', r => r.customer_id === realCpId);
        if (!existing) {
          localStore.insert('customer_preferences', { ...pref, customer_id: realCpId });
        }
      }
    }

    // 4. Addresses
    const addrIdMap = new Map(); // fixtureAddrId -> storedAddrId
    for (const addr of SEED_ADDRESSES) {
      const realUserId = userIdMap.get(addr.user_id) || userIdMap.get(addr.user_email?.toLowerCase()) || addr.user_id;
      if (!realUserId) {
        throw new Error(`[DB CRITICAL] Seed initialization error: Address fixture '${addr.id}' user_id '${addr.user_id}' could not be resolved.`);
      }

      if (this.mode === 'mysql') {
        const [uCheck] = await this.pool.query('SELECT id FROM `users` WHERE id = ?', [realUserId]);
        if (!uCheck || uCheck.length === 0) {
          throw new Error(`[DB CRITICAL] Address fixture '${addr.id}' initialization error: Parent user_id '${realUserId}' (resolved from fixture '${addr.user_id}') does not exist in users table.`);
        }

        const [existingAddr] = await this.pool.query('SELECT id FROM `addresses` WHERE user_id = ? AND label = ?', [realUserId, addr.label]);
        const targetAddrId = (existingAddr && existingAddr.length > 0) ? existingAddr[0].id : addr.id;

        const sql = `INSERT INTO \`addresses\` (id, user_id, label, recipient_name, phone, street_address, landmark, area, city, pincode, is_default, leave_at_doorstep, exchange_steel_dabba, delivery_instructions)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE recipient_name = VALUES(recipient_name), phone = VALUES(phone), street_address = VALUES(street_address), landmark = VALUES(landmark), area = VALUES(area), city = VALUES(city), pincode = VALUES(pincode), is_default = VALUES(is_default), leave_at_doorstep = VALUES(leave_at_doorstep), exchange_steel_dabba = VALUES(exchange_steel_dabba), delivery_instructions = VALUES(delivery_instructions)`;
        await this.pool.query(sql, [
          targetAddrId,
          realUserId,
          addr.label,
          addr.recipient_name,
          addr.phone,
          addr.street_address,
          addr.landmark,
          addr.area,
          addr.city,
          addr.pincode,
          addr.is_default,
          addr.leave_at_doorstep,
          addr.exchange_steel_dabba,
          addr.delivery_instructions
        ]);

        const [rows] = await this.pool.query('SELECT id FROM `addresses` WHERE user_id = ? AND label = ?', [realUserId, addr.label]);
        if (rows && rows.length > 0) {
          addrIdMap.set(addr.id, rows[0].id);
          addrIdMap.set(rows[0].id, rows[0].id);
        }
      } else {
        const existing = localStore.findOne('addresses', r => r.user_id === realUserId && r.label === addr.label);
        if (!existing) {
          const inserted = { ...addr, user_id: realUserId };
          localStore.insert('addresses', inserted);
          addrIdMap.set(addr.id, inserted.id);
        } else {
          addrIdMap.set(addr.id, existing.id);
        }
      }
    }

    // 5. Sellers
    const sellerIdMap = new Map(); // fixtureSellerId -> storedSellerId
    for (const s of SEED_SELLERS) {
      const realUserId = userIdMap.get(s.user_id) || userIdMap.get(s.user_email?.toLowerCase()) || s.user_id;
      if (!realUserId) {
        throw new Error(`[DB CRITICAL] Seed initialization error: Seller fixture '${s.id}' user_id '${s.user_id}' could not be resolved.`);
      }

      if (this.mode === 'mysql') {
        // Step 2 & 4: Explicit Pre-Write Parent Verification
        const [userCheck] = await this.pool.query('SELECT id FROM `users` WHERE id = ?', [realUserId]);
        if (!userCheck || userCheck.length === 0) {
          throw new Error(`[DB CRITICAL] Seller profile fixture '${s.id}' (${s.business_name}) initialization error: Parent user_id '${realUserId}' (resolved from fixture '${s.user_id}') does not exist in users table.`);
        }

        const [existingSeller] = await this.pool.query('SELECT id FROM `seller_profiles` WHERE user_id = ?', [realUserId]);
        const targetSellerId = (existingSeller && existingSeller.length > 0) ? existingSeller[0].id : s.id;

        const sql = `INSERT INTO \`seller_profiles\` (id, user_id, business_name, owner_name, kitchen_type, delivery_model, operating_address, area, city, pincodes_served, delivery_radius_km, cuisine_specializations, operating_hours, fssai_number, fssai_expiry_date, fssai_certificate_url, verification_status, rejection_reason, rating, rating_count, preparation_cutoff_lunch_time, preparation_cutoff_dinner_time, is_listed)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            business_name = VALUES(business_name),
            owner_name = VALUES(owner_name),
            kitchen_type = VALUES(kitchen_type),
            delivery_model = VALUES(delivery_model),
            operating_address = VALUES(operating_address),
            area = VALUES(area),
            city = VALUES(city),
            pincodes_served = VALUES(pincodes_served),
            delivery_radius_km = VALUES(delivery_radius_km),
            cuisine_specializations = VALUES(cuisine_specializations),
            operating_hours = VALUES(operating_hours),
            fssai_number = VALUES(fssai_number),
            fssai_expiry_date = VALUES(fssai_expiry_date),
            fssai_certificate_url = VALUES(fssai_certificate_url),
            verification_status = VALUES(verification_status),
            rejection_reason = VALUES(rejection_reason),
            rating = VALUES(rating),
            rating_count = VALUES(rating_count),
            preparation_cutoff_lunch_time = VALUES(preparation_cutoff_lunch_time),
            preparation_cutoff_dinner_time = VALUES(preparation_cutoff_dinner_time),
            is_listed = VALUES(is_listed)`;
        await this.pool.query(sql, [
          targetSellerId,
          realUserId,
          s.business_name,
          s.owner_name,
          s.kitchen_type,
          s.delivery_model,
          s.operating_address,
          s.area,
          s.city,
          JSON.stringify(s.pincodes_served || []),
          s.delivery_radius_km,
          JSON.stringify(s.cuisine_specializations || []),
          s.operating_hours,
          s.fssai_number,
          s.fssai_expiry_date,
          s.fssai_certificate_url,
          s.verification_status,
          s.rejection_reason,
          s.rating,
          s.rating_count,
          s.preparation_cutoff_lunch_time,
          s.preparation_cutoff_dinner_time,
          s.is_listed
        ]);

        const [rows] = await this.pool.query('SELECT id FROM `seller_profiles` WHERE user_id = ?', [realUserId]);
        if (rows && rows.length > 0) {
          sellerIdMap.set(s.id, rows[0].id);
          sellerIdMap.set(rows[0].id, rows[0].id);
          sellerIdMap.set(s.business_name, rows[0].id);
        }
      } else {
        const existing = localStore.findOne('seller_profiles', r => r.user_id === realUserId);
        if (!existing) {
          const inserted = { ...s, user_id: realUserId };
          localStore.insert('seller_profiles', inserted);
          sellerIdMap.set(s.id, inserted.id);
          sellerIdMap.set(inserted.id, inserted.id);
          sellerIdMap.set(s.business_name, inserted.id);
        } else {
          localStore.update('seller_profiles', r => r.id === existing.id, { ...s, user_id: realUserId });
          sellerIdMap.set(s.id, existing.id);
          sellerIdMap.set(existing.id, existing.id);
          sellerIdMap.set(s.business_name, existing.id);
        }
      }
    }

    // 6. Categories
    const catIdMap = new Map(); // fixtureCatId / slug / name -> storedCatId
    for (const c of SEED_CATEGORIES) {
      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`categories\` (id, name, slug, description, icon_name, image_url, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), icon_name = VALUES(icon_name), image_url = VALUES(image_url), display_order = VALUES(display_order)`;
        await this.pool.query(sql, [c.id, c.name, c.slug, c.description, c.icon_name, c.image_url, c.display_order]);

        const [rows] = await this.pool.query('SELECT id FROM `categories` WHERE slug = ?', [c.slug]);
        if (rows && rows.length > 0) {
          catIdMap.set(c.id, rows[0].id);
          catIdMap.set(c.slug, rows[0].id);
          catIdMap.set(c.name, rows[0].id);
        }
      } else {
        const existing = localStore.findOne('categories', r => r.slug === c.slug || r.id === c.id);
        if (!existing) {
          localStore.insert('categories', c);
          catIdMap.set(c.id, c.id);
          catIdMap.set(c.slug, c.id);
          catIdMap.set(c.name, c.id);
        } else {
          catIdMap.set(c.id, existing.id);
          catIdMap.set(c.slug, existing.id);
          catIdMap.set(c.name, existing.id);
        }
      }
    }

    // 7. Customization Options
    const optIdMap = new Map();
    for (const opt of SEED_CUSTOMIZATION_OPTIONS) {
      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`customization_options\` (id, name, group_type, item_choice, price_delta, calorie_delta, protein_delta, carbs_delta, fat_delta, is_default, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name), price_delta = VALUES(price_delta), calorie_delta = VALUES(calorie_delta), protein_delta = VALUES(protein_delta), carbs_delta = VALUES(carbs_delta), fat_delta = VALUES(fat_delta), is_default = VALUES(is_default), display_order = VALUES(display_order)`;
        await this.pool.query(sql, [
          opt.id,
          opt.name,
          opt.group_type,
          opt.item_choice,
          opt.price_delta,
          opt.calorie_delta,
          opt.protein_delta,
          opt.carbs_delta,
          opt.fat_delta,
          opt.is_default,
          opt.display_order
        ]);
        optIdMap.set(opt.id, opt.id);
      } else {
        const existing = localStore.findOne('customization_options', r => r.id === opt.id);
        if (!existing) localStore.insert('customization_options', opt);
        optIdMap.set(opt.id, opt.id);
      }
    }

    // 8. Meals (62+ dishes)
    const mealIdMap = new Map(); // fixtureMealId / slug -> storedMealId
    for (const m of SEED_MEALS) {
      const realSellerId = sellerIdMap.get(m.seller_id) || m.seller_id;
      const realCatId = catIdMap.get(m.category_id) || m.category_id;
      if (!realSellerId) {
        throw new Error(`[DB CRITICAL] Seed initialization error: Meal fixture '${m.id}' (${m.name}) seller_id '${m.seller_id}' could not be resolved.`);
      }
      if (!realCatId) {
        throw new Error(`[DB CRITICAL] Seed initialization error: Meal fixture '${m.id}' (${m.name}) category_id '${m.category_id}' could not be resolved.`);
      }

      if (this.mode === 'mysql') {
        // Pre-write verification
        const [sellerCheck] = await this.pool.query('SELECT id FROM `seller_profiles` WHERE id = ?', [realSellerId]);
        if (!sellerCheck || sellerCheck.length === 0) {
          throw new Error(`[DB CRITICAL] Meal fixture '${m.id}' (${m.name}) initialization error: Parent seller '${realSellerId}' (resolved from fixture '${m.seller_id}') does not exist in seller_profiles table.`);
        }
        const [catCheck] = await this.pool.query('SELECT id FROM `categories` WHERE id = ?', [realCatId]);
        if (!catCheck || catCheck.length === 0) {
          throw new Error(`[DB CRITICAL] Meal fixture '${m.id}' (${m.name}) initialization error: Category '${realCatId}' (resolved from fixture '${m.category_id}') does not exist in categories table.`);
        }

        const [existingMeal] = await this.pool.query('SELECT id FROM `meals` WHERE slug = ?', [m.slug]);
        const targetMealId = (existingMeal && existingMeal.length > 0) ? existingMeal[0].id : m.id;

        const sql = `INSERT INTO \`meals\` (id, seller_id, category_id, name, slug, description, cuisine, base_price, portion_choices, ingredients, allergens, dietary_tags, is_available, is_featured, is_tiffin_eligible, prep_time_minutes, calories, protein_grams, carbs_grams, fat_grams, image_url, rating, rating_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            seller_id = VALUES(seller_id),
            category_id = VALUES(category_id),
            name = VALUES(name),
            description = VALUES(description),
            cuisine = VALUES(cuisine),
            base_price = VALUES(base_price),
            portion_choices = VALUES(portion_choices),
            ingredients = VALUES(ingredients),
            allergens = VALUES(allergens),
            dietary_tags = VALUES(dietary_tags),
            is_available = VALUES(is_available),
            is_featured = VALUES(is_featured),
            is_tiffin_eligible = VALUES(is_tiffin_eligible),
            prep_time_minutes = VALUES(prep_time_minutes),
            calories = VALUES(calories),
            protein_grams = VALUES(protein_grams),
            carbs_grams = VALUES(carbs_grams),
            fat_grams = VALUES(fat_grams),
            image_url = VALUES(image_url),
            rating = VALUES(rating),
            rating_count = VALUES(rating_count)`;
        await this.pool.query(sql, [
          targetMealId,
          realSellerId,
          realCatId,
          m.name,
          m.slug,
          m.description,
          m.cuisine,
          m.base_price,
          JSON.stringify(m.portion_choices || []),
          JSON.stringify(m.ingredients || []),
          JSON.stringify(m.allergens || []),
          JSON.stringify(m.dietary_tags || []),
          m.is_available,
          m.is_featured,
          m.is_tiffin_eligible,
          m.prep_time_minutes,
          m.calories,
          m.protein_grams,
          m.carbs_grams,
          m.fat_grams,
          m.image_url,
          m.rating,
          m.rating_count
        ]);

        const [rows] = await this.pool.query('SELECT id FROM `meals` WHERE slug = ?', [m.slug]);
        if (rows && rows.length > 0) {
          mealIdMap.set(m.id, rows[0].id);
          mealIdMap.set(rows[0].id, rows[0].id);
          mealIdMap.set(m.slug, rows[0].id);
        }
      } else {
        const existing = localStore.findOne('meals', r => r.slug === m.slug || r.id === m.id);
        if (!existing) {
          const inserted = { ...m, seller_id: realSellerId, category_id: realCatId };
          localStore.insert('meals', inserted);
          mealIdMap.set(m.id, inserted.id);
          mealIdMap.set(inserted.id, inserted.id);
        } else {
          mealIdMap.set(m.id, existing.id);
          mealIdMap.set(existing.id, existing.id);
        }
      }
    }

    // 9. Subscription Plans
    const planIdMap = new Map();
    for (const sp of SEED_SUBSCRIPTION_PLANS) {
      const realSellerId = sellerIdMap.get(sp.seller_id) || sp.seller_id;
      if (!realSellerId) {
        throw new Error(`[DB CRITICAL] Seed initialization error: Subscription plan fixture '${sp.id}' (${sp.name}) seller_id '${sp.seller_id}' could not be resolved.`);
      }

      if (this.mode === 'mysql') {
        const [sCheck] = await this.pool.query('SELECT id FROM `seller_profiles` WHERE id = ?', [realSellerId]);
        if (!sCheck || sCheck.length === 0) {
          throw new Error(`[DB CRITICAL] Subscription plan fixture '${sp.id}' (${sp.name}) initialization error: Parent seller '${realSellerId}' (resolved from fixture '${sp.seller_id}') does not exist in seller_profiles table.`);
        }

        const sql = `INSERT INTO \`subscription_plans\` (id, seller_id, plan_type, name, description, cycle_days, delivery_frequency, supported_slots, base_price_per_meal, plan_discount_percent, max_skips_allowed, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            seller_id = VALUES(seller_id),
            plan_type = VALUES(plan_type),
            name = VALUES(name), 
            description = VALUES(description), 
            cycle_days = VALUES(cycle_days),
            delivery_frequency = VALUES(delivery_frequency),
            supported_slots = VALUES(supported_slots),
            base_price_per_meal = VALUES(base_price_per_meal), 
            plan_discount_percent = VALUES(plan_discount_percent), 
            max_skips_allowed = VALUES(max_skips_allowed),
            is_active = VALUES(is_active)`;
        await this.pool.query(sql, [
          sp.id,
          realSellerId,
          sp.plan_type,
          sp.name,
          sp.description,
          sp.cycle_days,
          sp.delivery_frequency,
          JSON.stringify(sp.supported_slots || []),
          sp.base_price_per_meal,
          sp.plan_discount_percent,
          sp.max_skips_allowed,
          sp.is_active
        ]);

        planIdMap.set(sp.id, sp.id);
      } else {
        const existing = localStore.findOne('subscription_plans', r => r.id === sp.id);
        if (!existing) {
          localStore.insert('subscription_plans', { ...sp, seller_id: realSellerId });
        } else {
          localStore.update('subscription_plans', r => r.id === sp.id, { ...sp, seller_id: realSellerId });
        }
        planIdMap.set(sp.id, sp.id);
      }
    }

    // 10. Coupons
    for (const cpn of SEED_COUPONS) {
      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`coupons\` (id, code, description, discount_type, discount_value, max_discount_cap, min_order_amount, valid_from, valid_until, usage_limit_total, usage_limit_per_user, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE description = VALUES(description), discount_value = VALUES(discount_value), is_active = VALUES(is_active)`;
        await this.pool.query(sql, [
          cpn.id,
          cpn.code,
          cpn.description,
          cpn.discount_type,
          cpn.discount_value,
          cpn.max_discount_cap,
          cpn.min_order_amount,
          cpn.valid_from,
          cpn.valid_until,
          cpn.usage_limit_total,
          cpn.usage_limit_per_user,
          cpn.is_active
        ]);
      } else {
        const existing = localStore.findOne('coupons', r => r.code === cpn.code);
        if (!existing) localStore.insert('coupons', cpn);
      }
    }

    // 11. Daily Rotating Menus
    const activeTiffinSellers = ['seller_01', 'seller_03', 'seller_04', 'seller_05'];
    const resolvedTiffinSellers = activeTiffinSellers
      .map(sId => sellerIdMap.get(sId) || sId)
      .filter(sId => sellerIdMap.has(sId));
    
    if (resolvedTiffinSellers.length > 0) {
      const menus = generateDailyTiffinMenus(resolvedTiffinSellers, SEED_MEALS);

      for (const m of menus) {
        const realSellerId = sellerIdMap.get(m.seller_id) || m.seller_id;
        const realMealId = mealIdMap.get(m.meal_id) || m.meal_id;
        const realAltId = m.alternative_meal_id ? (mealIdMap.get(m.alternative_meal_id) || m.alternative_meal_id) : null;
        if (!realSellerId) {
          throw new Error(`[DB CRITICAL] Daily tiffin menu '${m.id}' initialization error: Seller '${m.seller_id}' could not be resolved.`);
        }
        if (!realMealId) {
          throw new Error(`[DB CRITICAL] Daily tiffin menu '${m.id}' initialization error: Meal '${m.meal_id}' could not be resolved.`);
        }

        if (this.mode === 'mysql') {
          const [sCheck] = await this.pool.query('SELECT id FROM `seller_profiles` WHERE id = ?', [realSellerId]);
          if (!sCheck || sCheck.length === 0) {
            throw new Error(`[DB CRITICAL] Daily tiffin menu '${m.id}' initialization error: Seller '${realSellerId}' not found in seller_profiles table.`);
          }
          const [mCheck] = await this.pool.query('SELECT id FROM `meals` WHERE id = ?', [realMealId]);
          if (!mCheck || mCheck.length === 0) {
            throw new Error(`[DB CRITICAL] Daily tiffin menu '${m.id}' initialization error: Meal '${realMealId}' not found in meals table.`);
          }

          let validAltId = null;
          if (realAltId) {
            const [altCheck] = await this.pool.query('SELECT id FROM `meals` WHERE id = ?', [realAltId]);
            if (!altCheck || altCheck.length === 0) {
              throw new Error(`[DB CRITICAL] Daily tiffin menu '${m.id}' initialization error: Alternative meal '${realAltId}' not found in meals table.`);
            }
            validAltId = realAltId;
          }

          const sql = `INSERT INTO \`daily_tiffin_menus\` (id, seller_id, menu_date, slot, meal_id, alternative_meal_id, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE meal_id = VALUES(meal_id), alternative_meal_id = VALUES(alternative_meal_id)`;
          await this.pool.query(sql, [m.id, realSellerId, m.menu_date, m.slot, realMealId, validAltId, m.notes]);
        } else {
          const existing = localStore.findOne('daily_tiffin_menus', r => r.seller_id === realSellerId && r.menu_date === m.menu_date && r.slot === m.slot);
          if (!existing) {
            localStore.insert('daily_tiffin_menus', { ...m, seller_id: realSellerId, meal_id: realMealId, alternative_meal_id: realAltId });
          }
        }
      }
    }

    // 12. Sample active subscription & scheduled deliveries
    const realCustId = userIdMap.get('user_cust_01');
    const realSeller01 = sellerIdMap.get('seller_01');
    const realPlan01 = planIdMap.get('sub_plan_01') || 'sub_plan_01';
    const realAddr01 = addrIdMap.get('addr_01') || 'addr_01';

    if (realCustId && realSeller01) {
      const startDate = new Date().toISOString().split('T')[0];
      const origEndDateObj = new Date();
      origEndDateObj.setDate(origEndDateObj.getDate() + 28);
      const origEndDate = origEndDateObj.toISOString().split('T')[0];

      const sampleSub = {
        id: 'sub_demo_01',
        subscription_number: 'SUB-2026-8801',
        customer_id: realCustId,
        seller_id: realSeller01,
        plan_id: realPlan01,
        address_id: realAddr01,
        slot: 'both',
        start_date: startDate,
        original_end_date: origEndDate,
        revised_end_date: origEndDate,
        total_meals_purchased: 56,
        meals_delivered_count: 6,
        meals_skipped_count: 1,
        max_skips_allowed: 2,
        price_per_meal: 106.25,
        subtotal: 5950.00,
        discount_amount: 1050.00,
        delivery_fee: 0.00,
        tax_amount: 245.00,
        grand_total: 5145.00,
        status: 'active',
        payment_status: 'paid'
      };

      let storedSubId = sampleSub.id;
      if (this.mode === 'mysql') {
        const [cCheck] = await this.pool.query('SELECT id FROM `users` WHERE id = ?', [realCustId]);
        const [sCheck] = await this.pool.query('SELECT id FROM `seller_profiles` WHERE id = ?', [realSeller01]);
        const [pCheck] = await this.pool.query('SELECT id FROM `subscription_plans` WHERE id = ?', [realPlan01]);
        const [aCheck] = await this.pool.query('SELECT id FROM `addresses` WHERE id = ?', [realAddr01]);

        if (cCheck?.length && sCheck?.length && pCheck?.length && aCheck?.length) {
          const sql = `INSERT INTO \`subscriptions\` (id, subscription_number, customer_id, seller_id, plan_id, address_id, slot, start_date, original_end_date, revised_end_date, total_meals_purchased, meals_delivered_count, meals_skipped_count, max_skips_allowed, price_per_meal, subtotal, discount_amount, delivery_fee, tax_amount, grand_total, status, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status), payment_status = VALUES(payment_status)`;
          await this.pool.query(sql, [
            sampleSub.id,
            sampleSub.subscription_number,
            sampleSub.customer_id,
            sampleSub.seller_id,
            sampleSub.plan_id,
            sampleSub.address_id,
            sampleSub.slot,
            sampleSub.start_date,
            sampleSub.original_end_date,
            sampleSub.revised_end_date,
            sampleSub.total_meals_purchased,
            sampleSub.meals_delivered_count,
            sampleSub.meals_skipped_count,
            sampleSub.max_skips_allowed,
            sampleSub.price_per_meal,
            sampleSub.subtotal,
            sampleSub.discount_amount,
            sampleSub.delivery_fee,
            sampleSub.tax_amount,
            sampleSub.grand_total,
            sampleSub.status,
            sampleSub.payment_status
          ]);

          const [rows] = await this.pool.query('SELECT id FROM `subscriptions` WHERE subscription_number = ?', [sampleSub.subscription_number]);
          if (rows && rows.length > 0) storedSubId = rows[0].id;

          // 13. Scheduled deliveries
          const meal006Id = mealIdMap.get('meal_006');
          const meal007Id = mealIdMap.get('meal_007');

          if (meal006Id && meal007Id) {
            for (let day = 0; day < 28; day++) {
              const dObj = new Date();
              dObj.setDate(dObj.getDate() + day);
              const dStr = dObj.toISOString().split('T')[0];
              const isPast = day < 3;
              const isSkipped = day === 1;

              const lunchDelivery = {
                id: `sched_${storedSubId}_${dStr}_lunch`,
                subscription_id: storedSubId,
                delivery_date: dStr,
                slot: 'lunch',
                scheduled_meal_id: meal006Id,
                chosen_meal_id: meal006Id,
                customizations: { base: 'Brown Rice', spice: 'Medium', removals: ['No Garlic'] },
                status: isSkipped ? 'skipped' : (isPast ? 'delivered' : 'scheduled'),
                is_skipped: isSkipped,
                skip_reason: isSkipped ? 'Traveling on Tuesday' : null,
                delivered_at: isPast && !isSkipped ? `${dStr} 13:10:00` : null
              };

              const dinnerDelivery = {
                id: `sched_${storedSubId}_${dStr}_dinner`,
                subscription_id: storedSubId,
                delivery_date: dStr,
                slot: 'dinner',
                scheduled_meal_id: meal007Id,
                chosen_meal_id: meal007Id,
                customizations: { base: 'Multigrain Phulka (3 Pcs)', spice: 'Mild' },
                status: isSkipped ? 'skipped' : (isPast ? 'delivered' : 'scheduled'),
                is_skipped: isSkipped,
                skip_reason: isSkipped ? 'Traveling on Tuesday' : null,
                delivered_at: isPast && !isSkipped ? `${dStr} 20:25:00` : null
              };

              const sqlDeliv = `INSERT INTO \`scheduled_deliveries\` (id, subscription_id, delivery_date, slot, scheduled_meal_id, chosen_meal_id, customizations, status, is_skipped, skip_reason, delivered_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status = VALUES(status)`;
              await this.pool.query(sqlDeliv, [
                lunchDelivery.id,
                lunchDelivery.subscription_id,
                lunchDelivery.delivery_date,
                lunchDelivery.slot,
                lunchDelivery.scheduled_meal_id,
                lunchDelivery.chosen_meal_id,
                JSON.stringify(lunchDelivery.customizations),
                lunchDelivery.status,
                lunchDelivery.is_skipped,
                lunchDelivery.skip_reason,
                lunchDelivery.delivered_at
              ]);
              await this.pool.query(sqlDeliv, [
                dinnerDelivery.id,
                dinnerDelivery.subscription_id,
                dinnerDelivery.delivery_date,
                dinnerDelivery.slot,
                dinnerDelivery.scheduled_meal_id,
                dinnerDelivery.chosen_meal_id,
                JSON.stringify(dinnerDelivery.customizations),
                dinnerDelivery.status,
                dinnerDelivery.is_skipped,
                dinnerDelivery.skip_reason,
                dinnerDelivery.delivered_at
              ]);
            }
          }
        }
      } else {
        const existing = localStore.findOne('subscriptions', r => r.subscription_number === sampleSub.subscription_number);
        if (!existing) {
          localStore.insert('subscriptions', sampleSub);
        } else {
          storedSubId = existing.id;
        }
      }
    }

    // 14. Demo orders
    if (realCustId && realSeller01) {
      const sampleOrder1 = {
        id: 'ord_demo_01',
        order_number: 'FB-ORD-9011',
        customer_id: realCustId,
        seller_id: realSeller01,
        address_id: realAddr01,
        order_type: 'instant_restaurant',
        status: 'out_for_delivery',
        subtotal: 298.00,
        customization_total: 45.00,
        discount_amount: 50.00,
        coupon_code: 'FITBITE50',
        delivery_fee: 35.00,
        tax_amount: 16.40,
        grand_total: 344.40,
        payment_status: 'paid',
        payment_method: 'demo_upi',
        payment_transaction_id: 'TXN_UPI_DEMO_99881',
        delivery_slot: 'Instant Delivery',
        leave_at_doorstep: false,
        exchange_steel_dabba: true,
        delivery_instructions: 'Ring bell once. Please place box on doorstep hook.'
      };

      let storedOrderId = sampleOrder1.id;
      if (this.mode === 'mysql') {
        const [cCheck] = await this.pool.query('SELECT id FROM `users` WHERE id = ?', [realCustId]);
        const [sCheck] = await this.pool.query('SELECT id FROM `seller_profiles` WHERE id = ?', [realSeller01]);
        const [aCheck] = await this.pool.query('SELECT id FROM `addresses` WHERE id = ?', [realAddr01]);

        if (cCheck?.length && sCheck?.length && aCheck?.length) {
          const sql = `INSERT INTO \`orders\` (id, order_number, customer_id, seller_id, address_id, order_type, status, subtotal, customization_total, discount_amount, coupon_code, delivery_fee, tax_amount, grand_total, payment_status, payment_method, payment_transaction_id, delivery_slot, leave_at_doorstep, exchange_steel_dabba, delivery_instructions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status)`;
          await this.pool.query(sql, [
            sampleOrder1.id,
            sampleOrder1.order_number,
            sampleOrder1.customer_id,
            sampleOrder1.seller_id,
            sampleOrder1.address_id,
            sampleOrder1.order_type,
            sampleOrder1.status,
            sampleOrder1.subtotal,
            sampleOrder1.customization_total,
            sampleOrder1.discount_amount,
            sampleOrder1.coupon_code,
            sampleOrder1.delivery_fee,
            sampleOrder1.tax_amount,
            sampleOrder1.grand_total,
            sampleOrder1.payment_status,
            sampleOrder1.payment_method,
            sampleOrder1.payment_transaction_id,
            sampleOrder1.delivery_slot,
            sampleOrder1.leave_at_doorstep,
            sampleOrder1.exchange_steel_dabba,
            sampleOrder1.delivery_instructions
          ]);

          const [rows] = await this.pool.query('SELECT id FROM `orders` WHERE order_number = ?', [sampleOrder1.order_number]);
          if (rows && rows.length > 0) storedOrderId = rows[0].id;

          const meal007Id = mealIdMap.get('meal_007');
          if (meal007Id) {
            const sqlItem = `INSERT INTO \`order_items\` (id, order_id, meal_id, meal_name_snapshot, meal_image_snapshot, quantity, portion_snapshot, unit_base_price, customizations_snapshot, unit_final_price, item_total_price, special_notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`;
            await this.pool.query(sqlItem, [
              'oi_01',
              storedOrderId,
              meal007Id,
              'Special Paneer Subzi Tiffin Meal',
              'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
              2,
              'Standard (4 Phulkas)',
              155.00,
              JSON.stringify({ base: 'Brown Rice (+₹20)', protein: 'Extra Malai Paneer (+₹45)', spice: 'Medium', removals: ['No Garlic'] }),
              171.50,
              343.00,
              'Extra fresh phulkas please'
            ]);
          }

          const sqlTrack = `INSERT INTO \`delivery_tracking_events\` (id, order_id, event_status, title, description, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE title = VALUES(title)`;
          await this.pool.query(sqlTrack, ['track_01', storedOrderId, 'confirmed', 'Order Confirmed', 'Annapurna Homestyle Tiffin Ghar accepted your order.', 12.9716, 77.5946]);
          await this.pool.query(sqlTrack, ['track_02', storedOrderId, 'preparing', 'Cooking in Kitchen', 'Chef is preparing your fresh meal with requested customizations.', 12.9716, 77.5946]);
          await this.pool.query(sqlTrack, ['track_03', storedOrderId, 'out_for_delivery', 'Out for Delivery', 'Rider Vikram Jadhav is on the way with your hot meal in insulated dabba bag.', 12.9780, 77.6350]);
        }
      } else {
        const existing = localStore.findOne('orders', r => r.order_number === sampleOrder1.order_number);
        if (!existing) {
          localStore.insert('orders', sampleOrder1);
        } else {
          storedOrderId = existing.id;
        }
      }
    }

    // 15. Audit Log
    const realAdminId = userIdMap.get('user_admin_01');
    if (realAdminId) {
      if (this.mode === 'mysql') {
        const [uCheck] = await this.pool.query('SELECT id FROM `users` WHERE id = ?', [realAdminId]);
        if (uCheck && uCheck.length > 0) {
          const sqlAudit = `INSERT INTO \`audit_logs\` (id, actor_id, actor_email, action, entity_type, entity_id, details)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE action = VALUES(action)`;
          await this.pool.query(sqlAudit, ['audit_01', realAdminId, 'admin@fitbite.demo', 'SYSTEM_BOOTSTRAP', 'platform', 'fitbite_core', JSON.stringify({ message: 'FitBite system seeded and initialized successfully.' })]);
        }
      } else {
        const exAudit = localStore.findOne('audit_logs', r => r.id === 'audit_01');
        if (!exAudit) {
          localStore.insert('audit_logs', { id: 'audit_01', actor_id: realAdminId, actor_email: 'admin@fitbite.demo', action: 'SYSTEM_BOOTSTRAP', entity_type: 'platform', entity_id: 'fitbite_core', details: { message: 'FitBite system seeded and initialized successfully.' } });
        }
      }
    }

    console.log('[DB] Resilient seeding verification complete: All seed records confirmed ready.');
  }
}

export const db = new DatabaseService();
