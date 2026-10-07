import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { localStore } from './localStore.js';
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

    localStore.init();

    // Check if MySQL connection is available
    let host = process.env.DB_HOST || 'localhost';
    let port = parseInt(process.env.DB_PORT || '3306', 10);
    let user = process.env.DB_USER || 'root';
    let password = process.env.DB_PASSWORD || '';
    let database = process.env.DB_NAME || 'fitbite_db';
    let ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

    if (process.env.DATABASE_URL) {
      try {
        const parsed = new URL(process.env.DATABASE_URL);
        host = parsed.hostname;
        port = parseInt(parsed.port || '3306', 10);
        user = decodeURIComponent(parsed.username);
        password = decodeURIComponent(parsed.password);
        database = parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'fitbite_db';
        if (parsed.searchParams.get('ssl') === 'true' || parsed.searchParams.get('ssl-mode') || process.env.DB_SSL === 'true') {
          ssl = { rejectUnauthorized: false };
        }
      } catch (err) {
        console.warn('[DB] Failed to parse DATABASE_URL, using individual parameters:', err.message);
      }
    }

    try {
      // Connect and verify database exists
      const connectTimeout = parseInt(process.env.DB_CONNECT_TIMEOUT || (process.env.NODE_ENV === 'production' ? '10000' : '2000'), 10);
      try {
        const connection = await mysql.createConnection({
          host,
          port,
          user,
          password,
          ssl,
          connectTimeout
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await connection.end();
      } catch (dbCreateErr) {
        // Some managed databases (e.g. Railway, PlanetScale, AWS RDS restricted users) disallow CREATE DATABASE
        // This is safe to ignore if the database already exists
      }

      this.pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        ssl,
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });

      // Test connection
      const [rows] = await this.pool.query('SELECT 1 as test');
      if (rows && rows.length > 0) {
        this.mode = 'mysql';
        console.log(`[DB] Successfully connected to MySQL at ${host}:${port}/${database}`);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'production' && process.env.ENABLE_LOCAL_JSON_FALLBACK !== 'true') {
        console.error(`[DB CRITICAL] Production database connection failed to ${host}:${port}/${database}:`, err.message);
        throw new Error(`Production database connection failed (${err.code || err.message}). Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, or DATABASE_URL.`);
      }

      this.mode = 'local';
      console.log(`[DB] Notice: MySQL server not connected (${err.code || err.message}).`);
      console.log(`[DB] Seamlessly using persistent local relational store (backend/data/fitbite_store.json). Zero configuration needed for local dev!`);
    }

    await this.seedIfEmpty();
    this.isInitialized = true;
  }

  getMode() {
    return this.mode;
  }

  async find(table, filter = () => true) {
    if (this.mode === 'mysql') {
      try {
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
      } catch (err) {
        console.error(`[DB MySQL Error] find in ${table}:`, err.message);
        return localStore.find(table, filter);
      }
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
      try {
        const keys = Object.keys(row);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map(k => {
          const val = row[k];
          if (typeof val === 'object' && val !== null) {
            return JSON.stringify(val);
          }
          return val;
        });
        const sql = `INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders})`;
        await this.pool.query(sql, values);
        // Also keep localStore in sync
        localStore.insert(table, row);
        return row;
      } catch (err) {
        console.error(`[DB MySQL Error] insert into ${table}:`, err.message);
        return localStore.insert(table, row);
      }
    }

    return localStore.insert(table, row);
  }

  async update(table, filter, updates) {
    if (this.mode === 'mysql') {
      try {
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
        return localStore.update(
          table,
          typeof filter === 'function' ? filter : row => Object.entries(filter).every(([k, v]) => row[k] === v),
          updates
        );
      } catch (err) {
        console.error(`[DB MySQL Error] update ${table}:`, err.message);
        return localStore.update(
          table,
          typeof filter === 'function' ? filter : row => Object.entries(filter).every(([k, v]) => row[k] === v),
          updates
        );
      }
    }

    return localStore.update(
      table,
      typeof filter === 'function' ? filter : row => Object.entries(filter).every(([k, v]) => row[k] === v),
      updates
    );
  }

  async delete(table, filter) {
    if (this.mode === 'mysql') {
      try {
        const existing = await this.find(table, filter);
        for (const item of existing) {
          await this.pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [item.id]);
        }
        return localStore.delete(
          table,
          typeof filter === 'function' ? filter : row => Object.entries(filter).every(([k, v]) => row[k] === v)
        );
      } catch (err) {
        console.error(`[DB MySQL Error] delete from ${table}:`, err.message);
        return localStore.delete(
          table,
          typeof filter === 'function' ? filter : row => Object.entries(filter).every(([k, v]) => row[k] === v)
        );
      }
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
    const userCount = await this.count('users');
    if (userCount > 0) {
      console.log(`[DB] Database already contains ${userCount} users. Skipping seed.`);
      return;
    }

    console.log('[DB] Seeding database with initial FitBite demonstration data...');

    // 1. Users
    for (const u of SEED_USERS) {
      await this.insert('users', u);
    }

    // 2. Customer Profiles
    for (const cp of SEED_CUSTOMER_PROFILES) {
      await this.insert('customer_profiles', cp);
    }

    // 3. Customer Preferences
    for (const pref of SEED_CUSTOMER_PREFERENCES) {
      await this.insert('customer_preferences', pref);
    }

    // 4. Addresses
    for (const addr of SEED_ADDRESSES) {
      await this.insert('addresses', addr);
    }

    // 5. Sellers
    for (const s of SEED_SELLERS) {
      await this.insert('seller_profiles', s);
    }

    // 6. Categories
    for (const c of SEED_CATEGORIES) {
      await this.insert('categories', c);
    }

    // 7. Customization Options
    for (const opt of SEED_CUSTOMIZATION_OPTIONS) {
      await this.insert('customization_options', opt);
    }

    // 8. Meals (62+ dishes)
    for (const m of SEED_MEALS) {
      await this.insert('meals', m);
    }

    // 9. Subscription Plans
    for (const sp of SEED_SUBSCRIPTION_PLANS) {
      await this.insert('subscription_plans', sp);
    }

    // 10. Coupons
    for (const cpn of SEED_COUPONS) {
      await this.insert('coupons', cpn);
    }

    // 11. Daily Rotating Menus for 28 days
    const activeTiffinSellers = ['seller_01', 'seller_03', 'seller_04', 'seller_05'];
    const menus = generateDailyTiffinMenus(activeTiffinSellers, SEED_MEALS);
    for (const m of menus) {
      await this.insert('daily_tiffin_menus', m);
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
      price_per_meal: 106.25, // discounted
      subtotal: 5950.00,
      discount_amount: 1050.00,
      delivery_fee: 0.00,
      tax_amount: 245.00,
      grand_total: 5145.00,
      status: 'active',
      payment_status: 'paid'
    };
    await this.insert('subscriptions', sampleSub);

    // 13. Scheduled deliveries for sample subscription (28 days)
    for (let day = 0; day < 28; day++) {
      const dObj = new Date();
      dObj.setDate(dObj.getDate() + day);
      const dStr = dObj.toISOString().split('T')[0];
      const isPast = day < 3;
      const isSkipped = day === 1;

      // Lunch delivery
      await this.insert('scheduled_deliveries', {
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
      });

      // Dinner delivery
      await this.insert('scheduled_deliveries', {
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
      });
    }

    // 14. Sample completed and live orders for customer
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
    await this.insert('orders', sampleOrder1);

    await this.insert('order_items', {
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
    });

    await this.insert('delivery_tracking_events', {
      id: 'track_01',
      order_id: 'ord_demo_01',
      event_status: 'confirmed',
      title: 'Order Confirmed',
      description: 'Annapurna Homestyle Tiffin Ghar accepted your order.',
      latitude: 12.9716,
      longitude: 77.5946
    });

    await this.insert('delivery_tracking_events', {
      id: 'track_02',
      order_id: 'ord_demo_01',
      event_status: 'preparing',
      title: 'Cooking in Kitchen',
      description: 'Chef is preparing your fresh meal with requested customizations.',
      latitude: 12.9716,
      longitude: 77.5946
    });

    await this.insert('delivery_tracking_events', {
      id: 'track_03',
      order_id: 'ord_demo_01',
      event_status: 'out_for_delivery',
      title: 'Out for Delivery',
      description: 'Rider Vikram Jadhav is on the way with your hot meal in insulated dabba bag.',
      latitude: 12.9780,
      longitude: 77.6350
    });

    // 15. Audit Log
    await this.insert('audit_logs', {
      id: 'audit_01',
      actor_id: 'user_admin_01',
      actor_email: 'admin@fitbite.demo',
      action: 'SYSTEM_BOOTSTRAP',
      entity_type: 'platform',
      entity_id: 'fitbite_core',
      details: { message: 'FitBite system seeded and initialized successfully.' }
    });

    console.log('[DB] Seeding completed successfully! 62 meals, 8 kitchens, 20 categories, demo accounts created.');
  }
}

export const db = new DatabaseService();
