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

dotenv.config();

class DatabaseService {
  constructor() {
    this.mode = 'local'; // 'mysql' or 'local'
    this.pool = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

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
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });

      // 1. Verify basic connection
      const [rows] = await this.pool.query('SELECT 1 as test');
      if (!rows || rows.length === 0) {
        throw new Error('MySQL connectivity test query returned empty result.');
      }

      this.mode = 'mysql';
      console.log(`[DB] MySQL connection established successfully.`);

      // 2. Run schema migrations in dependency order
      console.log(`[DB] Running database migrations on '${config.database}'...`);
      await runMigrations(this.pool);

      // 3. Run repeatable, idempotent seeding
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

  async find(table, filter = () => true) {
    if (this.mode === 'mysql') {
      const [rows] = await this.pool.query(`SELECT * FROM \`${table}\``);
      if (typeof filter === 'function') {
        return rows.filter(filter);
      }
      if (typeof filter === 'object' && filter !== null) {
        return rows.filter(row => {
          return Object.entries(filter).every(([k, v]) => row[k] === v);
        });
      }
      return rows;
    }

    if (typeof filter === 'object' && filter !== null && typeof filter !== 'function') {
      return localStore.find(table, row => {
        return Object.entries(filter).every(([k, v]) => row[k] === v);
      });
    }
    return localStore.find(table, filter);
  }

  async findOne(table, filter = () => true) {
    const list = await this.find(table, filter);
    return list.length > 0 ? list[0] : null;
  }

  async insert(table, data) {
    const now = new Date().toISOString();
    const row = {
      ...data,
      created_at: data.created_at || now,
      updated_at: data.updated_at || now
    };

    if (this.mode === 'mysql') {
      const keys = Object.keys(row);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(k => {
        const val = row[k];
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      const updateClause = keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ');
      const sql = `INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
      await this.pool.query(sql, values);
      return row;
    }

    return localStore.insert(table, row);
  }

  async update(table, filter, updates) {
    if (this.mode === 'mysql') {
      const existing = await this.find(table, filter);
      for (const item of existing) {
        const updateKeys = Object.keys(updates);
        const setClause = updateKeys.map(k => `\`${k}\` = ?`).join(', ');
        const values = updateKeys.map(k => {
          const val = updates[k];
          if (typeof val === 'object' && val !== null) return JSON.stringify(val);
          return val;
        });
        values.push(item.id);
        await this.pool.query(`UPDATE \`${table}\` SET ${setClause}, updated_at = NOW() WHERE id = ?`, values);
      }
      return existing.map(item => ({ ...item, ...updates }));
    }

    return localStore.update(
      table,
      typeof filter === 'function' ? filter : row => Object.entries(filter).every(([k, v]) => row[k] === v),
      updates
    );
  }

  async delete(table, filter) {
    if (this.mode === 'mysql') {
      const existing = await this.find(table, filter);
      for (const item of existing) {
        await this.pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [item.id]);
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

  /**
   * Helper to perform idempotent inserts across both MySQL and localStore
   */
  async upsertEntity(table, data, primaryKey = 'id') {
    if (this.mode === 'mysql') {
      const keys = Object.keys(data);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(k => {
        const val = data[k];
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      // Do not overwrite passwords or user created dates on duplicate key
      const updateKeys = keys.filter(k => k !== primaryKey && k !== 'password_hash' && k !== 'created_at');
      const updateClause = updateKeys.length > 0 
        ? updateKeys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ')
        : `\`${primaryKey}\` = \`${primaryKey}\``;

      const sql = `INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
      await this.pool.query(sql, values);
    } else {
      const existing = localStore.findOne(table, row => row[primaryKey] === data[primaryKey]);
      if (!existing) {
        localStore.insert(table, data);
      }
    }
  }

  async seedIfEmpty() {
    console.log('[DB] Checking seed state across all core tables...');

    // 1. Users (Idempotent upsert - preserves existing passwords)
    for (const u of SEED_USERS) {
      await this.upsertEntity('users', u, 'id');
    }

    // 2. Customer Profiles
    for (const cp of SEED_CUSTOMER_PROFILES) {
      await this.upsertEntity('customer_profiles', cp, 'id');
    }

    // 3. Customer Preferences
    for (const pref of SEED_CUSTOMER_PREFERENCES) {
      await this.upsertEntity('customer_preferences', pref, 'id');
    }

    // 4. Addresses
    for (const addr of SEED_ADDRESSES) {
      await this.upsertEntity('addresses', addr, 'id');
    }

    // 5. Sellers
    for (const s of SEED_SELLERS) {
      await this.upsertEntity('seller_profiles', s, 'id');
    }

    // 6. Categories
    for (const c of SEED_CATEGORIES) {
      await this.upsertEntity('categories', c, 'id');
    }

    // 7. Customization Options
    for (const opt of SEED_CUSTOMIZATION_OPTIONS) {
      await this.upsertEntity('customization_options', opt, 'id');
    }

    // 8. Meals (62+ dishes)
    for (const m of SEED_MEALS) {
      await this.upsertEntity('meals', m, 'id');
    }

    // 9. Subscription Plans
    for (const sp of SEED_SUBSCRIPTION_PLANS) {
      await this.upsertEntity('subscription_plans', sp, 'id');
    }

    // 10. Coupons
    for (const cpn of SEED_COUPONS) {
      await this.upsertEntity('coupons', cpn, 'id');
    }

    // 11. Daily Rotating Menus for 28 days
    const activeTiffinSellers = ['seller_01', 'seller_03', 'seller_04', 'seller_05'];
    const menus = generateDailyTiffinMenus(activeTiffinSellers, SEED_MEALS);
    for (const m of menus) {
      await this.upsertEntity('daily_tiffin_menus', m, 'id');
    }

    // 12. Sample active subscription for demo customer
    const startDate = new Date().toISOString().split('T')[0];
    const origEndDateObj = new Date();
    origEndDateObj.setDate(origEndDateObj.getDate() + 28);
    const origEndDate = origEndDateObj.toISOString().split('T')[0];

    const sampleSub = {
      id: 'sub_demo_01',
      subscription_number: 'SUB-2026-8801',
      customer_id: 'user_cust_01',
      seller_id: 'seller_01',
      plan_id: 'sub_plan_01',
      address_id: 'addr_01',
      slot: 'both',
      start_date: startDate,
      original_end_date: origEndDate,
      revised_end_date: origEndDate,
      total_meals_purchased: 56, // 28 days x 2 meals
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
    await this.upsertEntity('subscriptions', sampleSub, 'id');

    // 13. Scheduled deliveries for sample subscription (28 days)
    for (let day = 0; day < 28; day++) {
      const dObj = new Date();
      dObj.setDate(dObj.getDate() + day);
      const dStr = dObj.toISOString().split('T')[0];
      const isPast = day < 3;
      const isSkipped = day === 1;

      // Lunch delivery
      await this.upsertEntity('scheduled_deliveries', {
        id: `sched_sub01_${dStr}_lunch`,
        subscription_id: 'sub_demo_01',
        delivery_date: dStr,
        slot: 'lunch',
        scheduled_meal_id: 'meal_006',
        chosen_meal_id: 'meal_006',
        customizations: { base: 'Brown Rice', spice: 'Medium', removals: ['No Garlic'] },
        status: isSkipped ? 'skipped' : (isPast ? 'delivered' : 'scheduled'),
        is_skipped: isSkipped,
        skip_reason: isSkipped ? 'Traveling on Tuesday' : null,
        delivered_at: isPast && !isSkipped ? `${dStr} 13:10:00` : null
      }, 'id');

      // Dinner delivery
      await this.upsertEntity('scheduled_deliveries', {
        id: `sched_sub01_${dStr}_dinner`,
        subscription_id: 'sub_demo_01',
        delivery_date: dStr,
        slot: 'dinner',
        scheduled_meal_id: 'meal_007',
        chosen_meal_id: 'meal_007',
        customizations: { base: 'Multigrain Phulka (3 Pcs)', spice: 'Mild' },
        status: isSkipped ? 'skipped' : (isPast ? 'delivered' : 'scheduled'),
        is_skipped: isSkipped,
        skip_reason: isSkipped ? 'Traveling on Tuesday' : null,
        delivered_at: isPast && !isSkipped ? `${dStr} 20:25:00` : null
      }, 'id');
    }

    // 14. Sample completed order for demo customer
    const sampleOrder1 = {
      id: 'ord_demo_01',
      order_number: 'FB-ORD-9011',
      customer_id: 'user_cust_01',
      seller_id: 'seller_01',
      address_id: 'addr_01',
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
    await this.upsertEntity('orders', sampleOrder1, 'id');

    await this.upsertEntity('order_items', {
      id: 'oi_01',
      order_id: 'ord_demo_01',
      meal_id: 'meal_007',
      meal_name_snapshot: 'Special Paneer Subzi Tiffin Meal',
      meal_image_snapshot: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
      quantity: 2,
      portion_snapshot: 'Standard (4 Phulkas)',
      unit_base_price: 155.00,
      customizations_snapshot: {
        base: 'Brown Rice (+₹20)',
        protein: 'Extra Malai Paneer (+₹45)',
        spice: 'Medium',
        removals: ['No Garlic']
      },
      unit_final_price: 171.50,
      item_total_price: 343.00,
      special_notes: 'Extra fresh phulkas please'
    }, 'id');

    await this.upsertEntity('delivery_tracking_events', {
      id: 'track_01',
      order_id: 'ord_demo_01',
      event_status: 'confirmed',
      title: 'Order Confirmed',
      description: 'Annapurna Homestyle Tiffin Ghar accepted your order.',
      latitude: 12.9716,
      longitude: 77.5946
    }, 'id');

    await this.upsertEntity('delivery_tracking_events', {
      id: 'track_02',
      order_id: 'ord_demo_01',
      event_status: 'preparing',
      title: 'Cooking in Kitchen',
      description: 'Chef is preparing your fresh meal with requested customizations.',
      latitude: 12.9716,
      longitude: 77.5946
    }, 'id');

    await this.upsertEntity('delivery_tracking_events', {
      id: 'track_03',
      order_id: 'ord_demo_01',
      event_status: 'out_for_delivery',
      title: 'Out for Delivery',
      description: 'Rider Vikram Jadhav is on the way with your hot meal in insulated dabba bag.',
      latitude: 12.9780,
      longitude: 77.6350
    }, 'id');

    // 15. Audit Log
    await this.upsertEntity('audit_logs', {
      id: 'audit_01',
      actor_id: 'user_admin_01',
      actor_email: 'admin@fitbite.demo',
      action: 'SYSTEM_BOOTSTRAP',
      entity_type: 'platform',
      entity_id: 'fitbite_core',
      details: { message: 'FitBite system seeded and initialized successfully.' }
    }, 'id');

    console.log('[DB] Seeding verification complete: All seed records confirmed ready.');
  }
}

export const db = new DatabaseService();
