import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDeliveryDates } from '../src/routes/subscriptionRoutes.js';
import { calculateBill } from '../src/routes/orderRoutes.js';
import { calculateCustomMeal } from '../src/routes/customMealRoutes.js';
import { db } from '../src/db/db.js';

describe('FitBite Business Rules & Integrity Tests', () => {

  test('Student Subscription Plan excludes Saturdays and Sundays', () => {
    // Starting on a Friday (e.g., 2026-10-09)
    const startDate = '2026-10-09';
    const dates = calculateDeliveryDates({ planType: 'student', startDateStr: startDate });

    // Verify all generated dates are Monday to Friday only
    for (const d of dates) {
      const day = new Date(d).getDay();
      assert.notEqual(day, 0, `Date ${d} should not be Sunday`);
      assert.notEqual(day, 6, `Date ${d} should not be Saturday`);
    }

    // Number of weekdays in a 30-day window is between 20 and 23
    assert.ok(dates.length >= 20 && dates.length <= 23, `Student eligible days should be 20-23, got ${dates.length}`);
  });

  test('Working Professional Subscription Plan includes 28 consecutive days', () => {
    const startDate = '2026-10-01';
    const dates = calculateDeliveryDates({ planType: 'working_professional', startDateStr: startDate, cycleDays: 28 });

    assert.equal(dates.length, 28, 'Professional plan must contain exactly 28 days');
    assert.equal(dates[0], '2026-10-01');
    assert.equal(dates[27], '2026-10-28');
  });

  test('Order Pricing & Coupon Calculation with 5% GST', async () => {
    await db.init();

    // Test with FITBITE50 coupon (50% off up to ₹100, min order ₹149)
    const billWithCoupon = await calculateBill({ subtotal: 300.00, couponCode: 'FITBITE50' });

    // 50% of 300 is 150, but max cap is 100
    assert.equal(billWithCoupon.discount_amount, 100.00);
    // Subtotal after discount: 200. Delivery fee for < 499 is 35
    assert.equal(billWithCoupon.delivery_fee, 35.00);
    // 5% tax on 200 is 10.00
    assert.equal(billWithCoupon.tax_amount, 10.00);
    // Total = 200 + 35 + 10 = 245
    assert.equal(billWithCoupon.grand_total, 245.00);

    // Test free delivery above ₹499
    const largeBill = await calculateBill({ subtotal: 600.00 });
    assert.equal(largeBill.delivery_fee, 0.00, 'Orders over ₹499 must have free delivery');
  });

  test('Custom Meal Recalculation accurately updates price and macros', async () => {
    await db.init();
    const meals = await db.find('meals');
    assert.ok(meals.length >= 60, `Catalog must have at least 60 meals, found ${meals.length}`);

    const baseMeal = meals[0];
    const custom = await calculateCustomMeal(baseMeal.id, {
      portion: 'large', // +40
      base_id: 'opt_base_02', // Brown Rice (+20)
      protein_id: 'opt_prot_01', // Paneer (+45)
      removal_ids: ['opt_rem_01'] // No Onion
    });

    const expectedPrice = baseMeal.base_price + 40 + 20 + 45;
    assert.equal(custom.calculated_price, expectedPrice);
    assert.ok(custom.estimated_calories > baseMeal.calories);
    assert.ok(custom.estimated_protein > baseMeal.protein_grams);
    assert.ok(custom.removals.includes('No Onion'));
  });

  test('Role Isolation: Unlisted/pending sellers are excluded from public catalog', async () => {
    await db.init();
    const pendingSellers = await db.find('seller_profiles', { verification_status: 'pending_approval' });
    assert.ok(pendingSellers.length > 0, 'There should be at least 1 demonstration pending seller');

    const pendingSellerId = pendingSellers[0].id;
    const publicSellers = await db.find('seller_profiles', s => s.verification_status === 'approved' && s.is_listed);

    assert.ok(!publicSellers.some(s => s.id === pendingSellerId), 'Pending seller must NEVER be returned in public listing');
  });

});
