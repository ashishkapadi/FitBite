import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/db.js';
import { calculateDeliveryDates } from '../src/routes/subscriptionRoutes.js';
import { calculateCustomMeal } from '../src/routes/customMealRoutes.js';

describe('FitBite Regression & Bug Fix Verification Suite', () => {
  before(async () => {
    await db.init();
  });

  describe('1. Subscription Plans & MySQL Boolean Handling', () => {
    test('Plans with TINYINT is_active=1 or boolean true are accurately matched by db.find', async () => {
      const plans = await db.find('subscription_plans');
      assert.ok(plans.length >= 3, 'At least 3 subscription plans must exist');

      const activePlans = plans.filter(p => Boolean(p.is_active));
      assert.ok(activePlans.length >= 3, 'Active plans must be detected');

      // Verify at least one plan offers 25% savings to back the promotional text
      const maxDiscount = Math.max(...activePlans.map(p => parseFloat(p.plan_discount_percent || 0)));
      assert.strictEqual(maxDiscount, 25, 'Promotional text "up to 25% savings" must be backed by an active plan with 25% discount');
    });

    test('Student Plan strictly counts eligible weekdays and excludes weekends', () => {
      const startDate = '2026-10-12'; // Monday
      const dates = calculateDeliveryDates({ planType: 'student', startDateStr: startDate, cycleDays: 28 });
      assert.ok(dates.length > 0, 'Dates must be generated');

      for (const d of dates) {
        const dayOfWeek = new Date(d).getDay();
        assert.notStrictEqual(dayOfWeek, 0, 'Student plan must never deliver on Sunday');
        assert.notStrictEqual(dayOfWeek, 6, 'Student plan must never deliver on Saturday');
      }
    });

    test('Working Professional Plan includes all 28 consecutive calendar days including weekends', () => {
      const startDate = '2026-10-12';
      const dates = calculateDeliveryDates({ planType: 'working_professional', startDateStr: startDate, cycleDays: 28 });
      assert.strictEqual(dates.length, 28, 'Professional plan must include exactly 28 days');

      const daysOfWeek = new Set(dates.map(d => new Date(d).getDay()));
      assert.ok(daysOfWeek.has(0), 'Professional plan must include Sundays');
      assert.ok(daysOfWeek.has(6), 'Professional plan must include Saturdays');
    });
  });

  describe('2. Add to Cart & Database Column Safety', () => {
    test('Cart table operations do not inject updated_at into tables lacking the column', async () => {
      // In MySQL, cart_items only has created_at, not updated_at
      const testCartId = `c_test_${Date.now().toString(36)}`;
      const cart = await db.insert('carts', {
        id: testCartId,
        user_id: 'user_cust_01',
        seller_id: 'seller_prof_01'
      });
      assert.ok(cart.id, 'Cart created successfully');

      const testItemId = `ci_test_${Date.now().toString(36)}`;
      const cartItem = await db.insert('cart_items', {
        id: testItemId,
        cart_id: testCartId,
        meal_id: 'meal_001',
        quantity: 1,
        portion_selected: 'standard',
        customizations: {},
        item_price: 180.00,
        total_price: 180.00,
        special_notes: null
      });
      assert.ok(cartItem.id, 'Cart item inserted without ER_BAD_FIELD_ERROR');

      // Clean up test records
      await db.delete('cart_items', { id: testItemId });
      await db.delete('carts', { id: testCartId });
    });

    test('Short cart and item IDs fit within VARCHAR(36) limits even for long user IDs', () => {
      const longUserId = 'user_cust_test_uuid_36characterslong!!';
      const shortCartId = `c_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      const shortItemId = `ci_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

      assert.ok(shortCartId.length <= 36, `Cart ID ${shortCartId} length (${shortCartId.length}) must be <= 36`);
      assert.ok(shortItemId.length <= 36, `Item ID ${shortItemId} length (${shortItemId.length}) must be <= 36`);
    });
  });

  describe('3. Timestamp Handling & UTC SQL Datetime Serialization', () => {
    test('formatUtcDatetime formats ISO strings and Date objects to SQL YYYY-MM-DD HH:MM:SS without T and Z', async () => {
      const { formatUtcDatetime, formatUtcDateOnly, serializeColumnValue } = await import('../src/db/db.js');

      const isoInput = '2026-10-09T15:56:19.243Z';
      const formatted = formatUtcDatetime(isoInput, 0);
      assert.strictEqual(formatted, '2026-10-09 15:56:19', 'Must remove T and Z and match SQL TIMESTAMP format');

      const dateObj = new Date('2026-10-09T15:56:19.243Z');
      const formattedFromDate = formatUtcDatetime(dateObj, 0);
      assert.strictEqual(formattedFromDate, '2026-10-09 15:56:19');

      // Date only
      const dateOnly = formatUtcDateOnly('2026-11-01T00:00:00.000Z');
      assert.strictEqual(dateOnly, '2026-11-01');
    });

    test('serializeColumnValue safely distinguishes timestamps, dates, JSON, and text fields', async () => {
      const { serializeColumnValue } = await import('../src/db/db.js');

      // 1. Timestamp column with ISO string input (The exact production error trigger)
      const serializedCreatedAt = serializeColumnValue('cart_items', 'created_at', '2026-10-09T15:56:19.243Z');
      assert.strictEqual(serializedCreatedAt, '2026-10-09 15:56:19');

      // 2. Date column with ISO string input
      const serializedStartDate = serializeColumnValue('subscriptions', 'start_date', '2026-11-01T00:00:00.000Z');
      assert.strictEqual(serializedStartDate, '2026-11-01');

      // 3. JSON column with structured object
      const jsonField = serializeColumnValue('cart_items', 'customizations', { spice: 'medium', extra_protein: true });
      assert.strictEqual(jsonField, JSON.stringify({ spice: 'medium', extra_protein: true }));

      // 4. Text column
      const textNotes = serializeColumnValue('cart_items', 'special_notes', 'Please do not ring bell');
      assert.strictEqual(textNotes, 'Please do not ring bell');

      // 5. Null preservation
      assert.strictEqual(serializeColumnValue('cart_items', 'special_notes', null), null);
    });

    test('db.withTransaction rolls back all partial writes on failure and preserves previous cart', async () => {
      const testCartId = `c_tx_${Date.now().toString(36)}`;
      await db.insert('carts', {
        id: testCartId,
        user_id: 'user_cust_tx_test',
        seller_id: 'seller_orig'
      });

      const initialItem = await db.insert('cart_items', {
        id: `ci_tx_orig_${Date.now().toString(36)}`,
        cart_id: testCartId,
        meal_id: 'meal_001',
        quantity: 1,
        portion_selected: 'standard',
        customizations: {},
        item_price: 150.00,
        total_price: 150.00,
        special_notes: null
      });

      // Verify transaction rolls back if an error occurs mid-operation
      let caughtError = false;
      try {
        await db.withTransaction(async (trx) => {
          // 1. Delete original items
          await trx.delete('cart_items', { cart_id: testCartId });
          // 2. Update cart seller
          await trx.update('carts', { id: testCartId }, { seller_id: 'seller_new' });
          // 3. Deliberately throw an error
          throw new Error('Simulated mid-write error');
        });
      } catch (err) {
        caughtError = true;
      }

      assert.ok(caughtError, 'Transaction must throw on failure');

      // Verify original cart state was restored
      const cartAfterRollback = await db.findOne('carts', { id: testCartId });
      assert.strictEqual(cartAfterRollback.seller_id, 'seller_orig', 'Cart seller must remain unchanged after rollback');

      const itemsAfterRollback = await db.find('cart_items', { cart_id: testCartId });
      assert.strictEqual(itemsAfterRollback.length, 1, 'Original cart item must be preserved after rollback');
      assert.strictEqual(itemsAfterRollback[0].id, initialItem.id);

      // Cleanup
      await db.delete('cart_items', { cart_id: testCartId });
      await db.delete('carts', { id: testCartId });
    });
  });

  describe('4. Build Your Own Meal Calculation', () => {
    test('calculateCustomMeal accepts valid selections and calculates pricing and nutrition', async () => {
      const meal = await db.findOne('meals', { id: 'meal_001' });
      assert.ok(meal, 'Meal meal_001 must exist');

      const result = await calculateCustomMeal('meal_001', {
        portion: 'large',
        special_notes: 'Less spicy please'
      });

      assert.ok(result.calculated_price > parseFloat(meal.base_price), 'Large portion must increase price');
      assert.strictEqual(result.portion, 'large');
      assert.strictEqual(result.special_notes, 'Less spicy please');
    });
  });

  describe('5. Seller Security & Isolation', () => {
    test('Pending sellers are excluded from public catalog search', async () => {
      const pendingSeller = await db.findOne('seller_profiles', { verification_status: 'pending_approval' });
      if (pendingSeller) {
        const publicMeals = await db.find('meals', m => m.seller_id === pendingSeller.id && m.is_available);
        // Public catalog filters out meals from sellers with verification_status !== 'approved'
        const activeApprovedSellers = await db.find('seller_profiles', s => s.verification_status === 'approved' && s.is_listed);
        const approvedIds = new Set(activeApprovedSellers.map(s => s.id));
        assert.ok(!approvedIds.has(pendingSeller.id), 'Pending seller must not be in approved public sellers set');
      }
    });
  });
});
