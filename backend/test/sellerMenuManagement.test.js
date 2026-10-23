import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/db.js';

const BASE_URL = 'http://localhost:5000/api';

describe('Seller Menu Management, Archiving & Financial Integrity Suite', () => {
  let seller1Token = '';
  let seller1User = null;
  let seller1Profile = null;

  let seller2Token = '';
  let seller2User = null;
  let seller2Profile = null;

  let customerToken = '';
  let customerUser = null;

  let testMealId = '';
  let serverInstance = null;

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
      const serverMod = await import('../src/server.js');
      serverInstance = serverMod.server;
      for (let i = 0; i < 25; i++) {
        if (await probeHealth()) break;
        await new Promise(r => setTimeout(r, 200));
      }
    }
    await db.init();

    // 1. Authenticate Seller 1 (Annapurna Homestyle Tiffin Ghar)
    const s1Res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'seller.tiffin@fitbite.demo', password: 'FitBite@2026', requested_role: 'seller' })
    });
    const s1Data = await s1Res.json();
    assert.ok(s1Data.token, 'Seller 1 token must be returned');
    seller1Token = s1Data.token;
    seller1User = s1Data.user;
    seller1Profile = s1Data.seller;

    // 2. Register Seller 2 (Brand New Seller with zero transactions)
    const newSellerEmail = `seller.fresh.${Date.now()}@fitbite.demo`;
    const s2Res = await fetch(`${BASE_URL}/auth/register-seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newSellerEmail,
        password: 'Password@123',
        full_name: 'Chef Rajesh Sharma',
        business_name: 'Rajesh Shahi Kitchen',
        kitchen_type: 'commercial_tiffin',
        fssai_number: '12345678901234',
        city: 'Mumbai',
        pincode: '400050'
      })
    });
    const s2Data = await s2Res.json();
    assert.ok(s2Data.token, 'Seller 2 token must be returned');
    seller2Token = s2Data.token;
    seller2User = s2Data.user;
    seller2Profile = s2Data.seller;

    // 3. Authenticate Customer
    const custRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@fitbite.demo', password: 'FitBite@2026', requested_role: 'customer' })
    });
    const custData = await custRes.json();
    customerToken = custData.token;
    customerUser = custData.user;

    // 4. Create a dedicated test meal for Seller 1 to edit and archive
    const createMealRes = await fetch(`${BASE_URL}/seller/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller1Token}`
      },
      body: JSON.stringify({
        name: 'Royal Shahi Paneer Thali',
        category_id: 'cat_north_indian',
        base_price: 240,
        cuisine: 'North Indian',
        description: 'Slow simmered cottage cheese in rich cashew gravy.',
        calories: 620,
        protein_grams: 22,
        carbs_grams: 58,
        fat_grams: 18,
        is_tiffin_eligible: true
      })
    });
    const createMealData = await createMealRes.json();
    assert.equal(createMealRes.status, 201);
    testMealId = createMealData.meal?.id || createMealData.id;
  });

  after(async () => {
    if (serverInstance && typeof serverInstance.close === 'function') {
      await new Promise(r => serverInstance.close(r));
    }
  });

  // --- REQUIREMENT 3: ACCURATE AMOUNTS STARTING AT ₹0 FOR NEW SELLERS ---
  test('Requirement 3: New seller shows ₹0.00 across all financial summaries with no artificial fallbacks', async () => {
    const res = await fetch(`${BASE_URL}/seller/earnings`, {
      headers: { 'Authorization': `Bearer ${seller2Token}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.summary, 'Earnings summary object must exist');
    assert.equal(Number(data.summary.gross_revenue), 0, 'New seller gross revenue must be 0');
    assert.equal(Number(data.summary.today_earnings), 0, 'New seller today earnings must be 0');
    assert.equal(Number(data.summary.available_balance), 0, 'New seller available balance must be 0');
    assert.equal(Number(data.summary.pending_payouts), 0, 'New seller pending payouts must be 0');
    assert.equal(Number(data.summary.net_payout), 0, 'New seller net payout must be 0');
    assert.equal(Number(data.summary.platform_fee_amount), 0, 'New seller fee amount must be 0');
    assert.equal(Number(data.summary.refunds_amount), 0, 'New seller refunds must be 0');

    // Also check seller overview
    const overviewRes = await fetch(`${BASE_URL}/seller/overview`, {
      headers: { 'Authorization': `Bearer ${seller2Token}` }
    });
    assert.equal(overviewRes.status, 200);
    const overviewData = await overviewRes.json();
    assert.equal(Number(overviewData.stats.total_revenue_inr), 0, 'Overview gross revenue must be 0');
    assert.equal(Number(overviewData.stats.active_subscriptions_count), 0, 'Subscribers must be 0');
    assert.equal(Number(overviewData.stats.today_orders_count), 0, 'Today orders must be 0');
    assert.equal(Number(overviewData.stats.active_kitchen_tickets), 0, 'Active tickets must be 0');
  });

  test('Active subscribers expose the owning customer details and subscribed plan only to that seller', async () => {
    const sellerRes = await fetch(`${BASE_URL}/seller/subscriptions`, {
      headers: { 'Authorization': `Bearer ${seller1Token}` }
    });
    assert.equal(sellerRes.status, 200);
    const subscribers = await sellerRes.json();
    assert.ok(Array.isArray(subscribers));
    assert.ok(subscribers.length > 0, 'Seeded seller should have active subscribers');

    const subscriber = subscribers[0];
    assert.ok(subscriber.customer?.full_name, 'Customer name must be available to the subscription seller');
    assert.ok(subscriber.plan?.name, 'Subscribed plan name must be available');
    assert.ok(subscriber.subscription_number, 'Subscription reference must be available');
    assert.equal(subscriber.status, 'active');

    const otherSellerRes = await fetch(`${BASE_URL}/seller/subscriptions`, {
      headers: { 'Authorization': `Bearer ${seller2Token}` }
    });
    assert.equal(otherSellerRes.status, 200);
    assert.deepEqual(await otherSellerRes.json(), [], 'A different seller must not see another kitchen’s subscribers');
  });

  // --- REQUIREMENT 1: EDIT AND MODIFY EXISTING MEALS ---
  test('Requirement 1: Seller can fetch meal details and prefill form', async () => {
    const res = await fetch(`${BASE_URL}/seller/meals/${testMealId}`, {
      headers: { 'Authorization': `Bearer ${seller1Token}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.id, testMealId);
    assert.equal(data.name, 'Royal Shahi Paneer Thali');
    assert.equal(Number(data.base_price), 240);
    assert.ok(Array.isArray(data.customization_option_ids));
  });

  test('Requirement 1 & 4: Field validation rejects non-positive price and empty name', async () => {
    // Empty name
    const res1 = await fetch(`${BASE_URL}/seller/meals/${testMealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller1Token}`
      },
      body: JSON.stringify({
        name: '   ',
        base_price: 200
      })
    });
    assert.equal(res1.status, 400);

    // Negative / zero price
    const res2 = await fetch(`${BASE_URL}/seller/meals/${testMealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller1Token}`
      },
      body: JSON.stringify({
        name: 'Valid Name',
        base_price: -50
      })
    });
    assert.equal(res2.status, 400);

    // Prep time < 5
    const res3 = await fetch(`${BASE_URL}/seller/meals/${testMealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller1Token}`
      },
      body: JSON.stringify({
        name: 'Valid Name',
        base_price: 200,
        prep_time_minutes: 2
      })
    });
    assert.equal(res3.status, 400);
  });

  test('Requirement 1 & 4: Stale concurrent edit detection rejects outdated updates', async () => {
    // Pass client_last_updated from the past (2020)
    const res = await fetch(`${BASE_URL}/seller/meals/${testMealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller1Token}`
      },
      body: JSON.stringify({
        name: 'Concurrent Collision Attempt',
        base_price: 260,
        client_last_updated: '2020-01-01T00:00:00.000Z'
      })
    });
    assert.equal(res.status, 409, 'Outdated timestamp should return 409 Conflict');
    const data = await res.json();
    assert.ok(data.error.includes('modified by another session'));
  });

  test('Requirement 1: Save Changes updates meal, preserves meal ID, and customer catalog reflects it', async () => {
    const updatedPayload = {
      name: 'Royal Shahi Paneer Special Thali',
      description: 'Signature North Indian thali with paneer, dal makhani, jeera rice, and 3 tawa rotis.',
      category_id: 'cat_north_indian',
      cuisine: 'North Indian',
      base_price: 280,
      portion_choices: ['Standard Thali', 'Mini Thali', 'Deluxe Thali'],
      ingredients: ['Malai Paneer', 'Fresh Cream', 'Cashews', 'Tomatoes', 'Shahi Garam Masala'],
      allergens: ['Dairy', 'Nuts'],
      dietary_tags: ['Vegetarian', 'High-Protein'],
      prep_time_minutes: 30,
      calories: 680,
      protein_grams: 24.5,
      carbs_grams: 62.0,
      fat_grams: 20.0,
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800',
      is_available: true,
      is_tiffin_eligible: true,
      customization_option_ids: ['opt_base_01', 'opt_spice_02']
    };

    const res = await fetch(`${BASE_URL}/seller/meals/${testMealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller1Token}`
      },
      body: JSON.stringify(updatedPayload)
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.meal.id, testMealId, 'Meal ID must be strictly preserved');
    assert.equal(data.meal.name, updatedPayload.name);
    assert.equal(Number(data.meal.base_price), 280);

    // Verify Customer Catalog reflects the change immediately
    const catalogRes = await fetch(`${BASE_URL}/catalog/meals/${testMealId}`);
    assert.equal(catalogRes.status, 200);
    const catalogData = await catalogRes.json();
    assert.equal(catalogData.name, updatedPayload.name);
    assert.equal(Number(catalogData.base_price), 280);
    assert.equal(catalogData.description, updatedPayload.description);
  });

  // --- REQUIREMENT 4: AUTHORIZATION & CROSS-SELLER ISOLATION ---
  test('Requirement 4: Seller 2 cannot edit or delete Seller 1 meal (IDOR prevention)', async () => {
    // Seller 2 attempts to edit Seller 1 meal
    const editRes = await fetch(`${BASE_URL}/seller/meals/${testMealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller2Token}`
      },
      body: JSON.stringify({
        name: 'Hacked Meal Name',
        base_price: 10
      })
    });
    assert.equal(editRes.status, 403, 'Cross-seller edit must be forbidden with 403');

    // Seller 2 attempts to delete Seller 1 meal
    const delRes = await fetch(`${BASE_URL}/seller/meals/${testMealId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${seller2Token}` }
    });
    assert.equal(delRes.status, 403, 'Cross-seller delete must be forbidden with 403');
  });

  // --- REQUIREMENT 2: DELETE MEALS, DEPENDENCY BLOCKING & RESTORATION ---
  test('Requirement 2: Deleting meal required by scheduled tiffin deliveries is blocked with HTTP 409', async () => {
    // In seed data, meal_006 or meal_007 has active scheduled deliveries
    const scheduledMealId = 'meal_006';
    const res = await fetch(`${BASE_URL}/seller/meals/${scheduledMealId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${seller1Token}` }
    });
    assert.equal(res.status, 409, 'Deleting a meal in active tiffin deliveries must return 409 Conflict');
    const data = await res.json();
    assert.equal(data.blocked, true);
    assert.ok(data.explanation, 'Response must explain dependency');
    assert.ok(data.upcoming_deliveries_count > 0, 'Upcoming deliveries count must be reported');
  });

  test('Requirement 2: Soft delete unblocks without dependencies, excludes meal from catalog', async () => {
    // Delete our test meal (which has no scheduled tiffin deliveries)
    const delRes = await fetch(`${BASE_URL}/seller/meals/${testMealId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${seller1Token}` }
    });
    assert.equal(delRes.status, 200);
    const delData = await delRes.json();
    assert.equal(delData.meal.is_archived, true);
    assert.equal(delData.meal.is_available, false);
    assert.ok(delData.meal.archived_at);

    // Customer catalog MUST now exclude the archived meal
    const catalogRes = await fetch(`${BASE_URL}/catalog/meals/${testMealId}`);
    assert.equal(catalogRes.status, 404, 'Archived meal must return 404 in customer catalog');

    // Active seller menu list excludes archived meal by default
    const activeMealsRes = await fetch(`${BASE_URL}/seller/meals?status=active`, {
      headers: { 'Authorization': `Bearer ${seller1Token}` }
    });
    const activeMeals = await activeMealsRes.json();
    assert.ok(!activeMeals.some(m => m.id === testMealId), 'Archived meal must not appear in active menu');

    // Archived meals list includes it
    const archivedMealsRes = await fetch(`${BASE_URL}/seller/meals?status=archived`, {
      headers: { 'Authorization': `Bearer ${seller1Token}` }
    });
    const archivedMeals = await archivedMealsRes.json();
    assert.ok(archivedMeals.some(m => m.id === testMealId), 'Archived meal must appear in archived list');
  });

  test('Requirement 2: Cart rejects adding archived meals', async () => {
    const addRes = await fetch(`${BASE_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        meal_id: testMealId,
        quantity: 1
      })
    });
    assert.ok(addRes.status >= 400, 'Adding archived meal to cart must be rejected with 400/404');
  });

  test('Requirement 2: Restoring archived meal restores availability and customer catalog access', async () => {
    const restoreRes = await fetch(`${BASE_URL}/seller/meals/${testMealId}/restore`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${seller1Token}` }
    });
    assert.equal(restoreRes.status, 200);
    const restoreData = await restoreRes.json();
    assert.equal(restoreData.meal.is_archived, false);
    assert.equal(restoreData.meal.is_available, true);

    // Catalog can now view it again
    const catalogRes = await fetch(`${BASE_URL}/catalog/meals/${testMealId}`);
    assert.equal(catalogRes.status, 200);
    const catalogData = await catalogRes.json();
    assert.equal(catalogData.id, testMealId);
  });
});
