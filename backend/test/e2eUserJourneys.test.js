import { test, describe, before } from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

describe('FitBite Complete End-to-End User Journeys', () => {
  let customerToken = '';
  let sellerToken = '';
  let adminToken = '';
  let createdOrderId = '';
  let createdSubId = '';
  let testAddressId = '';

  before(async () => {
    const probeHealth = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/health');
        return res.ok;
      } catch {
        return false;
      }
    };

    if (!(await probeHealth())) {
      await import('../src/server.js');
      for (let i = 0; i < 25; i++) {
        if (await probeHealth()) break;
        await new Promise(r => setTimeout(r, 200));
      }
    }
  });

  test('Journey 1: Public Guest Browsing', async () => {
    const catRes = await fetch(`${BASE_URL}/catalog/categories`);
    assert.strictEqual(catRes.status, 200);
    const categories = await catRes.json();
    assert.ok(categories.length >= 10, 'Expected at least 10 categories');

    const mealsRes = await fetch(`${BASE_URL}/catalog/meals`);
    assert.strictEqual(mealsRes.status, 200);
    const meals = await mealsRes.json();
    assert.ok(meals.length >= 60, 'Expected at least 60 distinct meals');

    const sellersRes = await fetch(`${BASE_URL}/catalog/sellers`);
    assert.strictEqual(sellersRes.status, 200);
    const sellers = await sellersRes.json();
    assert.ok(sellers.length >= 5, 'Expected active approved sellers');
  });

  test('Journey 2: Customer Login & Profile Fetch', async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@fitbite.demo', password: 'FitBite@2026' })
    });
    assert.strictEqual(loginRes.status, 200);
    const data = await loginRes.json();
    assert.ok(data.token, 'Token must be returned');
    assert.strictEqual(data.user.role, 'customer');
    customerToken = data.token;

    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.strictEqual(meRes.status, 200);
  });

  test('Journey 3: Onboarding Status & Step Progression', async () => {
    const statusRes = await fetch(`${BASE_URL}/onboarding/status`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.strictEqual(statusRes.status, 200);

    const stepRes = await fetch(`${BASE_URL}/onboarding/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        living_situation: 'solo_bachelor',
        routine_type: 'wellness_focused',
        primary_interest: 'tiffin_subscriptions'
      })
    });
    assert.strictEqual(stepRes.status, 200);
  });

  test('Journey 4: Build Your Own Meal Server-Side Recalculation', async () => {
    const customRes = await fetch(`${BASE_URL}/custom-meals/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meal_id: 'meal_004',
        selections: {
          portion: 'large'
        }
      })
    });
    assert.strictEqual(customRes.status, 200);
    const calc = await customRes.json();
    assert.ok(calc.calculated_price > 150, 'Price must include large portion charge');
    assert.ok(calc.estimated_protein > 20, 'Protein must reflect nutritional estimate');
  });

  test('Journey 5: Single-Kitchen Cart & Conflict Rule', async () => {
    // 1. Clear cart
    await fetch(`${BASE_URL}/cart`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    // 2. Add meal from Kitchen 1 (seller_01)
    const addRes = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        meal_id: 'meal_004',
        quantity: 2,
        portion: 'standard'
      })
    });
    assert.strictEqual(addRes.status, 201);

    // 3. Attempt adding meal from Kitchen 2 (seller_03) -> Must return 409 Conflict!
    const conflictRes = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        meal_id: 'meal_001',
        quantity: 1
      })
    });
    assert.strictEqual(conflictRes.status, 409, 'Adding food from another kitchen must trigger 409 conflict');
    const conflictData = await conflictRes.json();
    assert.strictEqual(conflictData.conflict, true);
  });

  test('Journey 6: Order Checkout, 5% GST, and Payment Verification', async () => {
    // Ensure address exists
    const addrRes = await fetch(`${BASE_URL}/users/addresses`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    let addresses = await addrRes.json();
    if (!addresses || addresses.length === 0) {
      const createAddrRes = await fetch(`${BASE_URL}/users/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          address_line1: 'Flat 101, Sunshine Heights, Bandra West',
          city: 'Mumbai',
          pincode: '400050',
          address_type: 'Home'
        })
      });
      const newAddr = await createAddrRes.json();
      testAddressId = newAddr.id;
    } else {
      testAddressId = addresses[0].id;
    }

    const checkoutRes = await fetch(`${BASE_URL}/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        address_id: testAddressId,
        payment_method: 'demo_upi',
        coupon_code: 'WELCOME50',
        delivery_slot: 'Instant Delivery (30-40 mins)',
        leave_at_doorstep: true,
        exchange_steel_dabba: true,
        delivery_instructions: 'Gate 2 security'
      })
    });

    assert.strictEqual(checkoutRes.status, 201);
    const checkoutData = await checkoutRes.json();
    assert.ok(checkoutData.order.id, 'Order ID must be generated');
    assert.strictEqual(checkoutData.order.payment_status, 'paid');
    assert.strictEqual(checkoutData.order.exchange_steel_dabba, true);
    createdOrderId = checkoutData.order.id;
  });

  test('Journey 7: Real-Time Order Tracking & Milestone Simulation', async () => {
    assert.ok(createdOrderId);
    const trackRes = await fetch(`${BASE_URL}/tracking/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.strictEqual(trackRes.status, 200);
    const trackData = await trackRes.json();
    assert.strictEqual(trackData.status, 'confirmed');
    assert.ok(trackData.delivery_partner.name);

    // Simulate advancing milestone
    const simRes = await fetch(`${BASE_URL}/tracking/simulate-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({ order_id: createdOrderId })
    });
    assert.strictEqual(simRes.status, 200);
    const simData = await simRes.json();
    assert.strictEqual(simData.status, 'preparing');
  });

  test('Journey 8: Tiffin Subscriptions Calculation (Student M-F vs Professional 28-day)', async () => {
    const plansRes = await fetch(`${BASE_URL}/subscriptions/plans`);
    const plans = await plansRes.json();
    assert.ok(plans.length >= 2);

    const profPlan = plans.find(p => p.plan_type === 'working_professional');
    const studentPlan = plans.find(p => p.plan_type === 'student');

    // Calculate Student Plan
    const studentCalcRes = await fetch(`${BASE_URL}/subscriptions/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: studentPlan.id,
        slot: 'lunch',
        start_date: '2026-11-01'
      })
    });
    assert.strictEqual(studentCalcRes.status, 200);
    const studentCalc = await studentCalcRes.json();
    assert.ok(studentCalc.delivery_days_count >= 20 && studentCalc.delivery_days_count <= 22, 'Student plan must only count M-F weekdays');

    // Calculate Professional Plan
    const profCalcRes = await fetch(`${BASE_URL}/subscriptions/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: profPlan.id,
        slot: 'both',
        start_date: '2026-11-01'
      })
    });
    assert.strictEqual(profCalcRes.status, 200);
    const profCalc = await profCalcRes.json();
    assert.strictEqual(profCalc.delivery_days_count, 28, 'Professional plan must be 28 consecutive days');
    assert.strictEqual(profCalc.total_meals_purchased, 56, 'Both lunch & dinner = 56 meals');
  });

  test('Journey 9: Tiffin Subscription Activation & Skip Request', async () => {
    const plansRes = await fetch(`${BASE_URL}/subscriptions/plans`);
    const plans = await plansRes.json();
    const profPlan = plans.find(p => p.plan_type === 'working_professional');

    const subRes = await fetch(`${BASE_URL}/subscriptions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        plan_id: profPlan.id,
        address_id: testAddressId,
        slot: 'lunch',
        start_date: '2026-11-01'
      })
    });
    assert.strictEqual(subRes.status, 201);
    const subData = await subRes.json();
    createdSubId = subData.subscription.id;

    // Fetch calendar
    const calRes = await fetch(`${BASE_URL}/subscriptions/${createdSubId}/calendar`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.strictEqual(calRes.status, 200);
    const calData = await calRes.json();
    assert.strictEqual(calData.deliveries.length, 28);

    // Request skip on future delivery
    const targetDelivery = calData.deliveries[5];
    const skipRes = await fetch(`${BASE_URL}/subscriptions/${createdSubId}/skip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        delivery_id: targetDelivery.id,
        reason: 'Out of town on business'
      })
    });
    assert.strictEqual(skipRes.status, 200);
    const skipData = await skipRes.json();
    assert.ok(skipData.revised_end_date > calData.subscription.original_end_date, 'End date must be extended by skip');
  });

  test('Journey 10: Kitchen Partner Operations Terminal', async () => {
    // Login as seller
    const sellerLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'seller.tiffin@fitbite.demo', password: 'FitBite@2026' })
    });
    const sellerData = await sellerLogin.json();
    sellerToken = sellerData.token;

    // Overview stats
    const ovRes = await fetch(`${BASE_URL}/seller/overview`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    assert.strictEqual(ovRes.status, 200);

    // Batch manifest
    const manRes = await fetch(`${BASE_URL}/seller/batch-manifest?slot=lunch`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    assert.strictEqual(manRes.status, 200);
  });

  test('Journey 11: Admin Control Plane & FSSAI Verification Desk', async () => {
    // Login as admin
    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fitbite.demo', password: 'FitBite@Admin2026' })
    });
    const adminData = await adminLogin.json();
    adminToken = adminData.token;

    // Platform metrics
    const metRes = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(metRes.status, 200);
    const metrics = await metRes.json();
    assert.ok(metrics.total_orders_count > 0);
    assert.ok(metrics.platform_gross_merchandise_value_inr > 0);

    // Audit logs
    const logsRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(logsRes.status, 200);
    const logs = await logsRes.json();
    assert.ok(logs.length >= 1, 'Audit trail must record sensitive actions');
  });
});
