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

      // 3. Run repeatable, parent-resolved idempotent seeding
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

  async seedIfEmpty() {
    console.log('[DB] Running resilient, parent-resolved seed state verification...');

    // 1. Users: Seed all users and resolve dynamic Map of fixtureId -> storedId (and email -> storedId)
    const userIdMap = new Map(); // fixtureId -> storedId
    const emailToUserIdMap = new Map(); // email -> storedId

    for (const u of SEED_USERS) {
      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`users\` (id, email, password_hash, role, full_name, phone, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone = VALUES(phone), is_active = VALUES(is_active)`;
        await this.pool.query(sql, [u.id, u.email, u.password_hash, u.role, u.full_name, u.phone, u.is_active]);

        const [rows] = await this.pool.query('SELECT id, email FROM `users` WHERE email = ?', [u.email]);
        if (rows && rows.length > 0) {
          const realId = rows[0].id;
          userIdMap.set(u.id, realId);
          emailToUserIdMap.set(u.email, realId);
        }
      } else {
        const existing = localStore.findOne('users', r => r.email === u.email || r.id === u.id);
        if (!existing) {
          localStore.insert('users', u);
          userIdMap.set(u.id, u.id);
          emailToUserIdMap.set(u.email, u.id);
        } else {
          userIdMap.set(u.id, existing.id);
          emailToUserIdMap.set(u.email, existing.id);
        }
      }
    }

    // 2. Customer Profiles
    const cpIdMap = new Map(); // fixtureCpId -> storedCpId
    for (const cp of SEED_CUSTOMER_PROFILES) {
      const realUserId = userIdMap.get(cp.user_id) || cp.user_id;
      if (!realUserId) continue;

      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`customer_profiles\` (id, user_id, living_situation, routine_type, primary_interest, default_delivery_slot, onboarding_completed)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE default_delivery_slot = VALUES(default_delivery_slot), onboarding_completed = VALUES(onboarding_completed)`;
        await this.pool.query(sql, [cp.id, realUserId, cp.living_situation, cp.routine_type, cp.primary_interest, cp.default_delivery_slot, cp.onboarding_completed]);

        const [rows] = await this.pool.query('SELECT id FROM `customer_profiles` WHERE user_id = ?', [realUserId]);
        if (rows && rows.length > 0) {
          cpIdMap.set(cp.id, rows[0].id);
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
      if (!realCpId) continue;

      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`customer_preferences\` (id, customer_id, goal, dietary_preference, allergies, avoid_ingredients, preferred_cuisines, spice_preference, budget_per_meal, preferred_portion, age, height_cm, weight_kg, activity_level, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE goal = VALUES(goal), dietary_preference = VALUES(dietary_preference)`;
        await this.pool.query(sql, [
          pref.id,
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
      const realUserId = userIdMap.get(addr.user_id) || addr.user_id;
      if (!realUserId) continue;

      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`addresses\` (id, user_id, label, recipient_name, phone, street_address, landmark, area, city, pincode, is_default, leave_at_doorstep, exchange_steel_dabba, delivery_instructions)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE recipient_name = VALUES(recipient_name), phone = VALUES(phone)`;
        await this.pool.query(sql, [
          addr.id,
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
        } else {
          addrIdMap.set(addr.id, addr.id);
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
      const realUserId = userIdMap.get(s.user_id) || s.user_id;
      if (!realUserId) {
        console.warn(`[DB Seed Warning] Skipping seller ${s.id} (${s.business_name}): user_id ${s.user_id} not resolved.`);
        continue;
      }

      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`seller_profiles\` (id, user_id, business_name, owner_name, kitchen_type, delivery_model, operating_address, area, city, pincodes_served, delivery_radius_km, cuisine_specializations, operating_hours, fssai_number, fssai_expiry_date, fssai_certificate_url, verification_status, rejection_reason, rating, rating_count, preparation_cutoff_lunch_time, preparation_cutoff_dinner_time, is_listed)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE business_name = VALUES(business_name), is_listed = VALUES(is_listed), verification_status = VALUES(verification_status)`;
        await this.pool.query(sql, [
          s.id,
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
        } else {
          sellerIdMap.set(s.id, s.id);
        }
      } else {
        const existing = localStore.findOne('seller_profiles', r => r.user_id === realUserId);
        if (!existing) {
          const inserted = { ...s, user_id: realUserId };
          localStore.insert('seller_profiles', inserted);
          sellerIdMap.set(s.id, inserted.id);
        } else {
          sellerIdMap.set(s.id, existing.id);
        }
      }
    }

    // 6. Categories
    const catIdMap = new Map(); // fixtureCatId -> storedCatId
    for (const c of SEED_CATEGORIES) {
      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`categories\` (id, name, slug, description, icon_name, image_url, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`;
        await this.pool.query(sql, [c.id, c.name, c.slug, c.description, c.icon_name, c.image_url, c.display_order]);

        const [rows] = await this.pool.query('SELECT id FROM `categories` WHERE slug = ?', [c.slug]);
        if (rows && rows.length > 0) {
          catIdMap.set(c.id, rows[0].id);
        } else {
          catIdMap.set(c.id, c.id);
        }
      } else {
        const existing = localStore.findOne('categories', r => r.slug === c.slug || r.id === c.id);
        if (!existing) {
          localStore.insert('categories', c);
          catIdMap.set(c.id, c.id);
        } else {
          catIdMap.set(c.id, existing.id);
        }
      }
    }

    // 7. Customization Options
    const optIdMap = new Map();
    for (const opt of SEED_CUSTOMIZATION_OPTIONS) {
      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`customization_options\` (id, name, group_type, item_choice, price_delta, calorie_delta, protein_delta, carbs_delta, fat_delta, is_default, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name)`;
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
    const mealIdMap = new Map(); // fixtureMealId -> storedMealId
    for (const m of SEED_MEALS) {
      const realSellerId = sellerIdMap.get(m.seller_id) || m.seller_id;
      const realCatId = catIdMap.get(m.category_id) || m.category_id;
      if (!realSellerId || !realCatId) continue;

      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`meals\` (id, seller_id, category_id, name, slug, description, cuisine, base_price, portion_choices, ingredients, allergens, dietary_tags, is_available, is_featured, is_tiffin_eligible, prep_time_minutes, calories, protein_grams, carbs_grams, fat_grams, image_url, rating, rating_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name), base_price = VALUES(base_price), is_available = VALUES(is_available), image_url = VALUES(image_url)`;
        await this.pool.query(sql, [
          m.id,
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
        } else {
          mealIdMap.set(m.id, m.id);
        }
      } else {
        const existing = localStore.findOne('meals', r => r.slug === m.slug || r.id === m.id);
        if (!existing) {
          const inserted = { ...m, seller_id: realSellerId, category_id: realCatId };
          localStore.insert('meals', inserted);
          mealIdMap.set(m.id, inserted.id);
        } else {
          mealIdMap.set(m.id, existing.id);
        }
      }
    }

    // 9. Subscription Plans
    const planIdMap = new Map();
    for (const sp of SEED_SUBSCRIPTION_PLANS) {
      const realSellerId = sellerIdMap.get(sp.seller_id) || sp.seller_id;
      if (!realSellerId) continue;

      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`subscription_plans\` (id, seller_id, plan_type, name, description, cycle_days, delivery_frequency, supported_slots, base_price_per_meal, plan_discount_percent, max_skips_allowed, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name), base_price_per_meal = VALUES(base_price_per_meal)`;
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
        }
        planIdMap.set(sp.id, sp.id);
      }
    }

    // 10. Coupons
    for (const cpn of SEED_COUPONS) {
      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`coupons\` (id, code, description, discount_type, discount_value, max_discount_cap, min_order_amount, valid_from, valid_until, usage_limit_total, usage_limit_per_user, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE description = VALUES(description)`;
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
    const resolvedTiffinSellers = activeTiffinSellers.map(sId => sellerIdMap.get(sId) || sId);
    const menus = generateDailyTiffinMenus(resolvedTiffinSellers, SEED_MEALS);

    for (const m of menus) {
      const realSellerId = sellerIdMap.get(m.seller_id) || m.seller_id;
      const realMealId = mealIdMap.get(m.meal_id) || m.meal_id;
      const realAltId = m.alternative_meal_id ? (mealIdMap.get(m.alternative_meal_id) || m.alternative_meal_id) : null;
      if (!realSellerId || !realMealId) continue;

      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`daily_tiffin_menus\` (id, seller_id, menu_date, slot, meal_id, alternative_meal_id, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE meal_id = VALUES(meal_id), alternative_meal_id = VALUES(alternative_meal_id)`;
        await this.pool.query(sql, [m.id, realSellerId, m.menu_date, m.slot, realMealId, realAltId, m.notes]);
      } else {
        const existing = localStore.findOne('daily_tiffin_menus', r => r.seller_id === realSellerId && r.menu_date === m.menu_date && r.slot === m.slot);
        if (!existing) {
          localStore.insert('daily_tiffin_menus', { ...m, seller_id: realSellerId, meal_id: realMealId, alternative_meal_id: realAltId });
        }
      }
    }

    // 12. Sample active subscription & scheduled deliveries
    const realCustId = userIdMap.get('user_cust_01') || 'user_cust_01';
    const realSeller01 = sellerIdMap.get('seller_01') || 'seller_01';
    const realPlan01 = planIdMap.get('sub_plan_01') || 'sub_plan_01';
    const realAddr01 = addrIdMap.get('addr_01') || 'addr_01';

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
    } else {
      const existing = localStore.findOne('subscriptions', r => r.subscription_number === sampleSub.subscription_number);
      if (!existing) {
        localStore.insert('subscriptions', sampleSub);
      } else {
        storedSubId = existing.id;
      }
    }

    // 13. Scheduled deliveries
    const meal006Id = mealIdMap.get('meal_006') || 'meal_006';
    const meal007Id = mealIdMap.get('meal_007') || 'meal_007';

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

      if (this.mode === 'mysql') {
        const sql = `INSERT INTO \`scheduled_deliveries\` (id, subscription_id, delivery_date, slot, scheduled_meal_id, chosen_meal_id, customizations, status, is_skipped, skip_reason, delivered_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE status = VALUES(status)`;
        await this.pool.query(sql, [
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
        await this.pool.query(sql, [
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
      } else {
        const exLunch = localStore.findOne('scheduled_deliveries', r => r.subscription_id === storedSubId && r.delivery_date === dStr && r.slot === 'lunch');
        if (!exLunch) localStore.insert('scheduled_deliveries', lunchDelivery);
        const exDinner = localStore.findOne('scheduled_deliveries', r => r.subscription_id === storedSubId && r.delivery_date === dStr && r.slot === 'dinner');
        if (!exDinner) localStore.insert('scheduled_deliveries', dinnerDelivery);
      }
    }

    // 14. Demo orders
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
    } else {
      const existing = localStore.findOne('orders', r => r.order_number === sampleOrder1.order_number);
      if (!existing) {
        localStore.insert('orders', sampleOrder1);
      } else {
        storedOrderId = existing.id;
      }
    }

    if (this.mode === 'mysql') {
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

      const sqlTrack = `INSERT INTO \`delivery_tracking_events\` (id, order_id, event_status, title, description, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title = VALUES(title)`;
      await this.pool.query(sqlTrack, ['track_01', storedOrderId, 'confirmed', 'Order Confirmed', 'Annapurna Homestyle Tiffin Ghar accepted your order.', 12.9716, 77.5946]);
      await this.pool.query(sqlTrack, ['track_02', storedOrderId, 'preparing', 'Cooking in Kitchen', 'Chef is preparing your fresh meal with requested customizations.', 12.9716, 77.5946]);
      await this.pool.query(sqlTrack, ['track_03', storedOrderId, 'out_for_delivery', 'Out for Delivery', 'Rider Vikram Jadhav is on the way with your hot meal in insulated dabba bag.', 12.9780, 77.6350]);
    } else {
      const exItem = localStore.findOne('order_items', r => r.id === 'oi_01');
      if (!exItem) {
        localStore.insert('order_items', {
          id: 'oi_01',
          order_id: storedOrderId,
          meal_id: meal007Id,
          meal_name_snapshot: 'Special Paneer Subzi Tiffin Meal',
          meal_image_snapshot: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
          quantity: 2,
          portion_snapshot: 'Standard (4 Phulkas)',
          unit_base_price: 155.00,
          customizations_snapshot: { base: 'Brown Rice (+₹20)', protein: 'Extra Malai Paneer (+₹45)', spice: 'Medium', removals: ['No Garlic'] },
          unit_final_price: 171.50,
          item_total_price: 343.00,
          special_notes: 'Extra fresh phulkas please'
        });
      }
      const exTrack = localStore.findOne('delivery_tracking_events', r => r.id === 'track_01');
      if (!exTrack) {
        localStore.insert('delivery_tracking_events', { id: 'track_01', order_id: storedOrderId, event_status: 'confirmed', title: 'Order Confirmed', description: 'Annapurna Homestyle Tiffin Ghar accepted your order.', latitude: 12.9716, longitude: 77.5946 });
        localStore.insert('delivery_tracking_events', { id: 'track_02', order_id: storedOrderId, event_status: 'preparing', title: 'Cooking in Kitchen', description: 'Chef is preparing your fresh meal with requested customizations.', latitude: 12.9716, longitude: 77.5946 });
        localStore.insert('delivery_tracking_events', { id: 'track_03', order_id: storedOrderId, event_status: 'out_for_delivery', title: 'Out for Delivery', description: 'Rider Vikram Jadhav is on the way with your hot meal in insulated dabba bag.', latitude: 12.9780, longitude: 77.6350 });
      }
    }

    // 15. Audit Log
    const realAdminId = userIdMap.get('user_admin_01') || 'user_admin_01';
    if (this.mode === 'mysql') {
      const sqlAudit = `INSERT INTO \`audit_logs\` (id, actor_id, actor_email, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE action = VALUES(action)`;
      await this.pool.query(sqlAudit, ['audit_01', realAdminId, 'admin@fitbite.demo', 'SYSTEM_BOOTSTRAP', 'platform', 'fitbite_core', JSON.stringify({ message: 'FitBite system seeded and initialized successfully.' })]);
    } else {
      const exAudit = localStore.findOne('audit_logs', r => r.id === 'audit_01');
      if (!exAudit) {
        localStore.insert('audit_logs', { id: 'audit_01', actor_id: realAdminId, actor_email: 'admin@fitbite.demo', action: 'SYSTEM_BOOTSTRAP', entity_type: 'platform', entity_id: 'fitbite_core', details: { message: 'FitBite system seeded and initialized successfully.' } });
      }
    }

    console.log('[DB] Resilient seeding verification complete: All seed records confirmed ready.');
  }
}

export const db = new DatabaseService();
