import test from 'node:test';
import assert from 'node:assert/strict';
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
} from '../src/db/seedData.js';
import { SEED_MEALS } from '../src/db/mealsSeed.js';
import { generateDailyTiffinMenus } from '../src/db/menusSeed.js';
import { db, validateSeedGraph } from '../src/db/db.js';

test('▶ FitBite Database Seeding & Foreign Key Integrity Suite', async (t) => {

  await t.test('1. Every seller profile fixture references a valid user fixture in SEED_USERS', () => {
    const userIds = new Set(SEED_USERS.map(u => u.id));
    for (const seller of SEED_SELLERS) {
      assert.ok(
        userIds.has(seller.user_id),
        `Seller '${seller.id}' (${seller.business_name}) references user_id '${seller.user_id}' which MUST exist in SEED_USERS.`
      );
    }
  });

  await t.test('2. Every customer profile & address references a valid user in SEED_USERS', () => {
    const userIds = new Set(SEED_USERS.map(u => u.id));
    for (const cp of SEED_CUSTOMER_PROFILES) {
      assert.ok(userIds.has(cp.user_id), `Customer profile '${cp.id}' references non-existent user '${cp.user_id}'`);
    }
    for (const addr of SEED_ADDRESSES) {
      assert.ok(userIds.has(addr.user_id), `Address '${addr.id}' references non-existent user '${addr.user_id}'`);
    }
  });

  await t.test('3. Every meal fixture references a valid seller in SEED_SELLERS and valid category in SEED_CATEGORIES', () => {
    const sellerIds = new Set(SEED_SELLERS.map(s => s.id));
    const catIds = new Set(SEED_CATEGORIES.map(c => c.id));
    for (const m of SEED_MEALS) {
      assert.ok(sellerIds.has(m.seller_id), `Meal '${m.id}' (${m.name}) references unknown seller '${m.seller_id}'`);
      assert.ok(catIds.has(m.category_id), `Meal '${m.id}' (${m.name}) references unknown category '${m.category_id}'`);
    }
  });

  await t.test('4. Rotating Tiffin Menus generate valid seller and meal foreign keys', () => {
    const sellerIds = new Set(SEED_SELLERS.map(s => s.id));
    const mealIds = new Set(SEED_MEALS.map(m => m.id));
    const activeTiffinSellers = ['seller_01', 'seller_03', 'seller_04', 'seller_05'];
    const menus = generateDailyTiffinMenus(activeTiffinSellers, SEED_MEALS);

    assert.ok(menus.length > 0, 'Should generate rotating menu records');
    for (const menu of menus) {
      assert.ok(sellerIds.has(menu.seller_id), `Menu '${menu.id}' references unknown seller '${menu.seller_id}'`);
      assert.ok(mealIds.has(menu.meal_id), `Menu '${menu.id}' references unknown meal '${menu.meal_id}'`);
      if (menu.alternative_meal_id) {
        assert.ok(mealIds.has(menu.alternative_meal_id), `Menu '${menu.id}' references unknown alt meal '${menu.alternative_meal_id}'`);
      }
    }
  });

  await t.test('5. Parent-ID Resolution Simulation: Custom/Pre-existing user IDs resolve dynamically', () => {
    // Simulate pre-existing database state where user_sell_01 exists as UUID-12345
    const mockStoredUsers = [
      { id: 'uuid-cust-999', email: 'customer@fitbite.demo' },
      { id: 'uuid-sell-888', email: 'seller.tiffin@fitbite.demo' },
      { id: 'uuid-sell-777', email: 'seller.pending@fitbite.demo' }
    ];

    const userIdMap = new Map();
    for (const row of mockStoredUsers) {
      userIdMap.set(row.id, row.id);
      userIdMap.set(row.email.toLowerCase(), row.id);
    }
    for (const u of SEED_USERS) {
      const storedId = userIdMap.get(u.email.toLowerCase()) || userIdMap.get(u.id);
      if (storedId) {
        userIdMap.set(u.id, storedId);
      }
    }

    // Assert that fixture user_sell_01 resolves to uuid-sell-888
    assert.equal(userIdMap.get('user_sell_01'), 'uuid-sell-888');
    assert.equal(userIdMap.get('user_cust_01'), 'uuid-cust-999');
    assert.equal(userIdMap.get('user_sell_pending'), 'uuid-sell-777');
  });

  await t.test('6. validateSeedGraph() verifies full fixture relationship graph without throwing errors', () => {
    assert.doesNotThrow(() => {
      validateSeedGraph();
    }, 'validateSeedGraph() must succeed for valid seed fixtures');
  });

  await t.test('7. Database initialization and catalog meal retrieval with active approved sellers', async () => {
    await db.init();
    const approvedSellers = await db.find('seller_profiles', s => s.verification_status === 'approved' && s.is_listed);
    assert.ok(approvedSellers.length >= 8, `Expected at least 8 approved sellers, found ${approvedSellers.length}`);

    const approvedSellerIds = new Set(approvedSellers.map(s => s.id));
    const availableMeals = await db.find('meals', m => approvedSellerIds.has(m.seller_id) && m.is_available);
    assert.ok(availableMeals.length >= 50, `Expected at least 50 available catalog meals, found ${availableMeals.length}`);

    // Verify pending seller is NOT listed/approved
    const pendingSeller = await db.findOne('seller_profiles', s => s.id === 'seller_pending_01' || s.verification_status === 'pending_approval');
    if (pendingSeller) {
      assert.equal(pendingSeller.is_listed, false, 'Pending seller must not be listed in public catalog');
      assert.equal(pendingSeller.verification_status, 'pending_approval');
    }
  });
});
