import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_PATH = path.resolve(__dirname, '../../../database/seeds/seed_data.sql');

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "\\'")}'`;
  return `'${String(val).replace(/'/g, "\\'")}'`;
}

let sql = `-- =====================================================================
-- FitBite Complete Production & Demo Seed Data (MySQL 8.0)
-- 62 Distinct Meals across 8 Kitchens, Categories, Plans, and Users
-- =====================================================================

USE fitbite_db;

`;

// 1. Users
sql += `-- 1. Users\n`;
for (const u of SEED_USERS) {
  sql += `INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active) VALUES (${esc(u.id)}, ${esc(u.email)}, ${esc(u.password_hash)}, ${esc(u.role)}, ${esc(u.full_name)}, ${esc(u.phone)}, ${esc(u.is_active)}) ON DUPLICATE KEY UPDATE email=email;\n`;
}

// 2. Customer profiles
sql += `\n-- 2. Customer Profiles\n`;
for (const cp of SEED_CUSTOMER_PROFILES) {
  sql += `INSERT INTO customer_profiles (id, user_id, living_situation, routine_type, primary_interest, default_delivery_slot, onboarding_completed) VALUES (${esc(cp.id)}, ${esc(cp.user_id)}, ${esc(cp.living_situation)}, ${esc(cp.routine_type)}, ${esc(cp.primary_interest)}, ${esc(cp.default_delivery_slot)}, ${esc(cp.onboarding_completed)}) ON DUPLICATE KEY UPDATE id=id;\n`;
}

// 3. Customer preferences
sql += `\n-- 3. Customer Preferences\n`;
for (const p of SEED_CUSTOMER_PREFERENCES) {
  sql += `INSERT INTO customer_preferences (id, customer_id, goal, dietary_preference, allergies, avoid_ingredients, preferred_cuisines, spice_preference, budget_per_meal, preferred_portion, age, height_cm, weight_kg, activity_level, notes) VALUES (${esc(p.id)}, ${esc(p.customer_id)}, ${esc(p.goal)}, ${esc(p.dietary_preference)}, ${esc(p.allergies)}, ${esc(p.avoid_ingredients)}, ${esc(p.preferred_cuisines)}, ${esc(p.spice_preference)}, ${esc(p.budget_per_meal)}, ${esc(p.preferred_portion)}, ${esc(p.age)}, ${esc(p.height_cm)}, ${esc(p.weight_kg)}, ${esc(p.activity_level)}, ${esc(p.notes)}) ON DUPLICATE KEY UPDATE id=id;\n`;
}

// 4. Addresses
sql += `\n-- 4. Addresses\n`;
for (const a of SEED_ADDRESSES) {
  sql += `INSERT INTO addresses (id, user_id, label, recipient_name, phone, street_address, landmark, area, city, pincode, is_default, leave_at_doorstep, exchange_steel_dabba, delivery_instructions) VALUES (${esc(a.id)}, ${esc(a.user_id)}, ${esc(a.label)}, ${esc(a.recipient_name)}, ${esc(a.phone)}, ${esc(a.street_address)}, ${esc(a.landmark)}, ${esc(a.area)}, ${esc(a.city)}, ${esc(a.pincode)}, ${esc(a.is_default)}, ${esc(a.leave_at_doorstep)}, ${esc(a.exchange_steel_dabba)}, ${esc(a.delivery_instructions)}) ON DUPLICATE KEY UPDATE id=id;\n`;
}

// 5. Sellers
sql += `\n-- 5. Sellers\n`;
for (const s of SEED_SELLERS) {
  sql += `INSERT INTO seller_profiles (id, user_id, business_name, owner_name, kitchen_type, delivery_model, operating_address, area, city, pincodes_served, delivery_radius_km, cuisine_specializations, operating_hours, fssai_number, fssai_expiry_date, fssai_certificate_url, verification_status, rejection_reason, rating, rating_count, preparation_cutoff_lunch_time, preparation_cutoff_dinner_time, is_listed) VALUES (${esc(s.id)}, ${esc(s.user_id)}, ${esc(s.business_name)}, ${esc(s.owner_name)}, ${esc(s.kitchen_type)}, ${esc(s.delivery_model)}, ${esc(s.operating_address)}, ${esc(s.area)}, ${esc(s.city)}, ${esc(s.pincodes_served)}, ${esc(s.delivery_radius_km)}, ${esc(s.cuisine_specializations)}, ${esc(s.operating_hours)}, ${esc(s.fssai_number)}, ${esc(s.fssai_expiry_date)}, ${esc(s.fssai_certificate_url)}, ${esc(s.verification_status)}, ${esc(s.rejection_reason)}, ${esc(s.rating)}, ${esc(s.rating_count)}, ${esc(s.preparation_cutoff_lunch_time)}, ${esc(s.preparation_cutoff_dinner_time)}, ${esc(s.is_listed)}) ON DUPLICATE KEY UPDATE id=id;\n`;
}

// 6. Categories
sql += `\n-- 6. Categories\n`;
for (const c of SEED_CATEGORIES) {
  sql += `INSERT INTO categories (id, name, slug, description, icon_name, display_order) VALUES (${esc(c.id)}, ${esc(c.name)}, ${esc(c.slug)}, ${esc(c.description)}, ${esc(c.icon_name)}, ${esc(c.display_order)}) ON DUPLICATE KEY UPDATE id=id;\n`;
}

// 7. Customization options
sql += `\n-- 7. Customization Options\n`;
for (const opt of SEED_CUSTOMIZATION_OPTIONS) {
  sql += `INSERT INTO customization_options (id, name, group_type, item_choice, price_delta, calorie_delta, protein_delta, carbs_delta, fat_delta, is_default, display_order) VALUES (${esc(opt.id)}, ${esc(opt.name)}, ${esc(opt.group_type)}, ${esc(opt.item_choice)}, ${esc(opt.price_delta)}, ${esc(opt.calorie_delta)}, ${esc(opt.protein_delta)}, ${esc(opt.carbs_delta)}, ${esc(opt.fat_delta)}, ${esc(opt.is_default)}, ${esc(opt.display_order)}) ON DUPLICATE KEY UPDATE id=id;\n`;
}

// 8. Meals
sql += `\n-- 8. Meals (62+ Distinct Meals)\n`;
for (const m of SEED_MEALS) {
  sql += `INSERT INTO meals (id, seller_id, category_id, name, slug, description, cuisine, base_price, portion_choices, ingredients, allergens, dietary_tags, is_available, is_featured, is_tiffin_eligible, prep_time_minutes, calories, protein_grams, carbs_grams, fat_grams, image_url, rating, rating_count) VALUES (${esc(m.id)}, ${esc(m.seller_id)}, ${esc(m.category_id)}, ${esc(m.name)}, ${esc(m.slug)}, ${esc(m.description)}, ${esc(m.cuisine)}, ${esc(m.base_price)}, ${esc(m.portion_choices)}, ${esc(m.ingredients)}, ${esc(m.allergens)}, ${esc(m.dietary_tags)}, ${esc(m.is_available)}, ${esc(m.is_featured)}, ${esc(m.is_tiffin_eligible)}, ${esc(m.prep_time_minutes)}, ${esc(m.calories)}, ${esc(m.protein_grams)}, ${esc(m.carbs_grams)}, ${esc(m.fat_grams)}, ${esc(m.image_url)}, ${esc(m.rating)}, ${esc(m.rating_count)}) ON DUPLICATE KEY UPDATE id=id;\n`;
}

// 9. Subscription plans
sql += `\n-- 9. Subscription Plans\n`;
for (const sp of SEED_SUBSCRIPTION_PLANS) {
  sql += `INSERT INTO subscription_plans (id, seller_id, plan_type, name, description, cycle_days, delivery_frequency, supported_slots, base_price_per_meal, plan_discount_percent, max_skips_allowed, is_active) VALUES (${esc(sp.id)}, ${esc(sp.seller_id)}, ${esc(sp.plan_type)}, ${esc(sp.name)}, ${esc(sp.description)}, ${esc(sp.cycle_days)}, ${esc(sp.delivery_frequency)}, ${esc(sp.supported_slots)}, ${esc(sp.base_price_per_meal)}, ${esc(sp.plan_discount_percent)}, ${esc(sp.max_skips_allowed)}, ${esc(sp.is_active)}) ON DUPLICATE KEY UPDATE id=id;\n`;
}

// 10. Coupons
sql += `\n-- 10. Coupons\n`;
for (const cpn of SEED_COUPONS) {
  sql += `INSERT INTO coupons (id, code, description, discount_type, discount_value, max_discount_cap, min_order_amount, valid_from, valid_until, usage_limit_total, usage_limit_per_user, is_active) VALUES (${esc(cpn.id)}, ${esc(cpn.code)}, ${esc(cpn.description)}, ${esc(cpn.discount_type)}, ${esc(cpn.discount_value)}, ${esc(cpn.max_discount_cap)}, ${esc(cpn.min_order_amount)}, ${esc(cpn.valid_from)}, ${esc(cpn.valid_until)}, ${esc(cpn.usage_limit_total)}, ${esc(cpn.usage_limit_per_user)}, ${esc(cpn.is_active)}) ON DUPLICATE KEY UPDATE id=id;\n`;
}

fs.writeFileSync(SQL_PATH, sql, 'utf-8');
console.log('Successfully wrote', SQL_PATH, 'bytes:', sql.length);
