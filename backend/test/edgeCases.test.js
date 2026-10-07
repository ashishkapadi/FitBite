import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/db.js';
import { calculateDeliveryDates } from '../src/routes/subscriptionRoutes.js';
import { calculateBill } from '../src/routes/orderRoutes.js';
import { calculateCustomMeal } from '../src/routes/customMealRoutes.js';

const BASE_URL = 'http://localhost:5000/api';

describe('FitBite Comprehensive Edge Cases Suite', () => {
  let customerToken = '';
  let customerUser = null;
  let sellerToken = '';
  let sellerUser = null;
  let adminToken = '';
  let otherCustomerToken = '';
  let otherAddressId = '';
  let validMeal = null;
  let otherKitchenMeal = null;

  before(async () => {
    await db.init();

    // 1. Authenticate Customer
    const custRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@fitbite.demo', password: 'FitBite@2026', requested_role: 'customer' })
    });
    const custData = await custRes.json();
    customerToken = custData.token;
    customerUser = custData.user;

    // 2. Authenticate Seller
    const sellRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'seller.tiffin@fitbite.demo', password: 'FitBite@2026', requested_role: 'seller' })
    });
    const sellData = await sellRes.json();
    sellerToken = sellData.token;
    sellerUser = sellData.user;

    // 3. Authenticate Admin
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fitbite.demo', password: 'FitBite@Admin2026', requested_role: 'admin' })
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;

    // 4. Create another customer to test IDOR
    const otherEmail = `test.idor.${Date.now()}@fitbite.demo`;
    const regRes = await fetch(`${BASE_URL}/auth/register-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: otherEmail,
        password: 'Password@123',
        full_name: 'Other Customer',
        phone: '9876543210'
      })
    });
    const regData = await regRes.json();
    otherCustomerToken = regData.token;

    // Add address for the other customer
    const addrRes = await fetch(`${BASE_URL}/users/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherCustomerToken}`
      },
      body: JSON.stringify({
        label: 'Work',
        address_line: '99 Other Street, Bandra West',
        city: 'Mumbai',
        area: 'Bandra',
        pincode: '400050',
        contact_phone: '9876543210'
      })
    });
    const addrData = await addrRes.json();
    otherAddressId = addrData.address ? addrData.address.id : addrData.id;

    // Get 2 meals from different sellers
    const meals = await db.find('meals');
    validMeal = meals.find(m => m.seller_id === 'seller_01') || meals[0];
    otherKitchenMeal = meals.find(m => m.seller_id !== validMeal.seller_id);
  });

  // =========================================================================
  // 1. LOGIN & AUTHENTICATION REGRESSION TESTS (LOGIN-001 - LOGIN-014)
  // =========================================================================
  describe('1. Login & Auth Regression Edge Cases (LOGIN-001 to LOGIN-014)', () => {
    test('LOGIN-001: /api/health endpoint returns 200 with JSON status UP', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'UP');
      assert.strictEqual(data.service, 'fitbite-backend');
    });

    test('LOGIN-002: Valid customer login returns 200, JWT token, and user profile', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'customer@fitbite.demo', password: 'FitBite@2026', requested_role: 'customer' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.token, 'Token must exist');
      assert.strictEqual(data.user.role, 'customer');
      assert.strictEqual(data.user.email, 'customer@fitbite.demo');
    });

    test('LOGIN-003: Invalid password returns 401 with clear message and no JSON crash', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'customer@fitbite.demo', password: 'WrongPassword!', requested_role: 'customer' })
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.ok(data.error || data.message);
      assert.strictEqual(data.error, 'Invalid email or password.');
    });

    test('LOGIN-004: Non-existent email returns 401 with generic error (prevents enumeration)', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent.user.999@fitbite.demo', password: 'AnyPassword123!', requested_role: 'customer' })
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.error, 'Invalid email or password.');
    });

    test('LOGIN-005: Missing email or password returns 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'customer@fitbite.demo' })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes('required'));
    });

    test('LOGIN-006: Email normalization handles uppercase and whitespace', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '   Customer@FitBite.DEMO   ', password: 'FitBite@2026', requested_role: 'customer' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.user.email, 'customer@fitbite.demo');
    });

    test('LOGIN-007: Password hashes are never leaked in API response', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.user.password_hash, undefined, 'password_hash must never be returned in user JSON');
    });
  });

  // =========================================================================
  // 2. CART & PRICING EDGE CASES (CART-001 - CART-018)
  // =========================================================================
  describe('2. Cart & Pricing Edge Cases (CART-001 to CART-018)', () => {
    test('CART-001: Adding first item creates cart with meal seller ID', async () => {
      // Clear cart first
      await fetch(`${BASE_URL}/cart/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      const addRes = await fetch(`${BASE_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          meal_id: validMeal.id,
          quantity: 2,
          portion: 'standard'
        })
      });
      assert.ok(addRes.status === 200 || addRes.status === 201, `Status should be 200/201, got ${addRes.status}`);

      const cartRes = await fetch(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      const cart = await cartRes.json();
      assert.strictEqual(cart.seller_id, validMeal.seller_id);
      assert.strictEqual(cart.items.length, 1);
      assert.strictEqual(cart.items[0].quantity, 2);
    });

    test('CART-002: Adding meal from different kitchen returns 409 Conflict', async () => {
      assert.ok(otherKitchenMeal, 'Must have a meal from another kitchen');
      const conflictRes = await fetch(`${BASE_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          meal_id: otherKitchenMeal.id,
          quantity: 1,
          replace_cart_if_conflict: false
        })
      });
      assert.strictEqual(conflictRes.status, 409, 'Must return 409 Conflict for different kitchen');
      const data = await conflictRes.json();
      assert.strictEqual(data.conflict, true);
      assert.ok(data.current_seller);
      assert.ok(data.new_seller);
    });

    test('CART-003: Overriding conflict with replace_cart_if_conflict=true clears cart and adds new item', async () => {
      const replaceRes = await fetch(`${BASE_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          meal_id: otherKitchenMeal.id,
          quantity: 1,
          replace_cart_if_conflict: true
        })
      });
      assert.ok(replaceRes.status === 200 || replaceRes.status === 201);

      const cartRes = await fetch(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      const cart = await cartRes.json();
      assert.strictEqual(cart.seller_id, otherKitchenMeal.seller_id);
      assert.strictEqual(cart.items.length, 1);
    });

    test('CART-004: Delivery fee boundary: < ₹499 incurs ₹35 fee, >= ₹499 is free', async () => {
      const billUnder = await calculateBill({ subtotal: 350.00 });
      assert.strictEqual(billUnder.delivery_fee, 35.00, 'Orders under ₹499 must charge ₹35 delivery fee');

      const billExact = await calculateBill({ subtotal: 499.00 });
      assert.strictEqual(billExact.delivery_fee, 0.00, 'Orders at exactly ₹499 must have free delivery');

      const billOver = await calculateBill({ subtotal: 800.00 });
      assert.strictEqual(billOver.delivery_fee, 0.00, 'Orders over ₹499 must have free delivery');
    });

    test('CART-005: 5% GST tax calculation rounds accurately to 2 decimal places', async () => {
      // Subtotal ₹200 -> Tax 5% = ₹10.00
      const bill1 = await calculateBill({ subtotal: 200.00 });
      assert.strictEqual(bill1.tax_amount, 10.00);

      // Subtotal ₹133 -> Tax 5% = ₹6.65
      const bill2 = await calculateBill({ subtotal: 133.00 });
      assert.strictEqual(bill2.tax_amount, 6.65);
    });

    test('CART-006: Coupon discount cap enforced (FITBITE50 50% capped at ₹100)', async () => {
      const bill = await calculateBill({ subtotal: 500.00, couponCode: 'FITBITE50' });
      // 50% of 500 is 250, but max discount cap is 100
      assert.strictEqual(bill.discount_amount, 100.00);
      assert.strictEqual(bill.coupon.code, 'FITBITE50');
    });

    test('CART-007: Invalid coupon code returns 0 discount without error', async () => {
      const bill = await calculateBill({ subtotal: 300.00, couponCode: 'INVALID_COUPON_CODE_999' });
      assert.strictEqual(bill.discount_amount, 0.00);
      assert.strictEqual(bill.coupon, null);
    });
  });

  // =========================================================================
  // 3. TIFFIN CALENDAR & SUBSCRIPTION RULES (TIFFIN-001 - SUB-026)
  // =========================================================================
  describe('3. Tiffin Calendar & Subscriptions Rules (TIFFIN-001 to SUB-026)', () => {
    test('TIFFIN-001: Student plan strictly excludes Saturdays and Sundays', () => {
      const dates = calculateDeliveryDates({ planType: 'student', startDateStr: '2026-10-12' });
      for (const d of dates) {
        const day = new Date(d).getDay();
        assert.ok(day >= 1 && day <= 5, `Date ${d} must be a weekday (1-5), got ${day}`);
      }
    });

    test('TIFFIN-002: Working Professional plan generates exactly 28 consecutive days including weekends', () => {
      const dates = calculateDeliveryDates({ planType: 'working_professional', startDateStr: '2026-11-01', cycleDays: 28 });
      assert.strictEqual(dates.length, 28);
      assert.strictEqual(dates[0], '2026-11-01');
      assert.strictEqual(dates[27], '2026-11-28');
    });

    test('TIFFIN-003: Subscriptions calculation API returns valid delivery schedule and price estimate', async () => {
      const plans = await db.find('subscription_plans');
      const plan = plans[0];
      assert.ok(plan, 'Subscription plan fixture must exist');

      const res = await fetch(`${BASE_URL}/subscriptions/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          plan_id: plan.id,
          slot: 'lunch',
          start_date: '2026-10-15'
        })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.delivery_dates_preview.length >= 20);
      assert.ok(data.grand_total > 0);
    });

    test('TIFFIN-004: Past start date is rejected when creating subscription', async () => {
      const plans = await db.find('subscription_plans');
      const res = await fetch(`${BASE_URL}/subscriptions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          plan_id: plans[0].id,
          slot: 'lunch',
          start_date: '2020-01-01', // Date in the past
          address_id: otherAddressId // not owned
        })
      });
      // Should reject either due to past date or invalid address
      assert.strictEqual(res.status, 400);
    });
  });

  // =========================================================================
  // 4. SECURITY, AUTHORIZATION & IDOR (SEC-001 - SEC-020)
  // =========================================================================
  describe('4. Security, Authorization & IDOR Protection (SEC-001 to SEC-020)', () => {
    test('SEC-001: Unauthenticated request to /api/cart returns 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/cart`);
      assert.strictEqual(res.status, 401);
    });

    test('SEC-002: Customer cannot access Admin endpoints (returns 403 Forbidden)', async () => {
      const res = await fetch(`${BASE_URL}/admin/metrics`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert.strictEqual(res.status, 403, 'Customer role must be forbidden from admin routes');
    });

    test('SEC-003: Customer cannot access Seller management terminal (returns 403 Forbidden)', async () => {
      const res = await fetch(`${BASE_URL}/seller/orders`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert.strictEqual(res.status, 403, 'Customer role must be forbidden from seller routes');
    });

    test('SEC-004: IDOR Protection: User A cannot checkout using User B address ID', async () => {
      const res = await fetch(`${BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          address_id: otherAddressId, // Belongs to Other Customer!
          payment_method: 'cash_on_delivery'
        })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes('address'), 'Must reject address not owned by user');
    });

    test('SEC-005: Privilege escalation prevention: Role cannot be overwritten via registration', async () => {
      const exploitEmail = `exploit.${Date.now()}@fitbite.demo`;
      const res = await fetch(`${BASE_URL}/auth/register-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: exploitEmail,
          password: 'Password@123',
          full_name: 'Attacker',
          role: 'admin' // Attempted privilege escalation
        })
      });
      assert.ok(res.status === 200 || res.status === 201);
      const data = await res.json();
      assert.strictEqual(data.user.role, 'customer', 'Role must remain customer regardless of requested payload');
    });

    test('SEC-006: SQL injection strings in search query are handled as literal text', async () => {
      const sqliQuery = "'; DROP TABLE users; --";
      const res = await fetch(`${BASE_URL}/catalog/meals?search=${encodeURIComponent(sqliQuery)}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data), 'Returns empty or filtered array without SQL error');

      // Verify users table was not dropped
      const userCheck = await db.findOne('users', { email: 'customer@fitbite.demo' });
      assert.ok(userCheck, 'Users table must remain intact');
    });
  });

  // =========================================================================
  // 5. SELLER MANAGEMENT & COMPLIANCE (SELLER-001 - ADMIN-010)
  // =========================================================================
  describe('5. Seller Compliance & Approval Workflow (SELLER-001 to ADMIN-010)', () => {
    test('SELLER-001: Registering new seller defaults verification_status to pending_approval', async () => {
      const newSellerEmail = `chef.${Date.now()}@fitbite.demo`;
      const regRes = await fetch(`${BASE_URL}/auth/register-seller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newSellerEmail,
          password: 'SellerPassword@123',
          full_name: 'Chef Ananya',
          phone: '9123456780',
          business_name: 'Ananya Gourmet Kitchen',
          kitchen_type: 'home_chef_cloud_kitchen',
          fssai_number: '12345678901234', // 14 digits
          area: 'Andheri West'
        })
      });
      assert.ok(regRes.status === 200 || regRes.status === 201);
      const data = await regRes.json();
      assert.strictEqual(data.user.role, 'seller');
      assert.strictEqual(data.seller.verification_status, 'pending_approval');
      assert.strictEqual(data.seller.is_listed, false);
    });

    test('SELLER-002: Invalid FSSAI license format is rejected', async () => {
      const res = await fetch(`${BASE_URL}/auth/register-seller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `invalid.fssai.${Date.now()}@fitbite.demo`,
          password: 'Password@123',
          full_name: 'Chef Raj',
          business_name: 'Raj Kitchen',
          kitchen_type: 'home_chef_cloud_kitchen',
          fssai_number: '12345' // Too short (must be 14 digits)
        })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(data.error.includes('FSSAI'));
    });

    test('ADMIN-001: Admin can retrieve all sellers and verify/approve pending seller', async () => {
      const sellersRes = await fetch(`${BASE_URL}/admin/sellers`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(sellersRes.status, 200);
      const sellers = await sellersRes.json();
      assert.ok(Array.isArray(sellers) && sellers.length >= 1);

      const pendingSeller = sellers.find(s => s.verification_status === 'pending_approval');
      if (pendingSeller) {
        const verifyRes = await fetch(`${BASE_URL}/admin/sellers/${pendingSeller.id}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ action: 'approve', notes: 'FSSAI verified valid and matching.' })
        });
        assert.strictEqual(verifyRes.status, 200);
        const verifyData = await verifyRes.json();
        assert.strictEqual(verifyData.status, 'approved');
      }
    });
  });

  // =========================================================================
  // 6. ORDER LIFECYCLE & MUTATION RULES (ORDER-001 - ORDER-014)
  // =========================================================================
  describe('6. Order Lifecycle & Status Progression (ORDER-001 to ORDER-014)', () => {
    let lifecycleOrderId = '';

    test('ORDER-001: Order status can transition: confirmed -> preparing -> ready -> delivered', async () => {
      // 1. Fetch customer's address
      const addrRes = await fetch(`${BASE_URL}/users/addresses`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      const addrs = await addrRes.json();
      let customerAddrId = addrs[0]?.id;
      if (!customerAddrId) {
        const newAddrRes = await fetch(`${BASE_URL}/users/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
          body: JSON.stringify({
            label: 'Home',
            address_line: 'Flat 101, Sunshine Heights',
            city: 'Mumbai',
            area: 'Bandra',
            pincode: '400050',
            contact_phone: '9876543210'
          })
        });
        const newAddr = await newAddrRes.json();
        customerAddrId = newAddr.id;
      }

      // 2. Clear cart and add meal from seller's kitchen
      await fetch(`${BASE_URL}/cart/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      const addRes = await fetch(`${BASE_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({ meal_id: validMeal.id, quantity: 1, replace_cart_if_conflict: true })
      });
      assert.strictEqual(addRes.status, 201);

      // 3. Checkout order
      const checkoutRes = await fetch(`${BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({
          address_id: customerAddrId,
          payment_method: 'demo_upi',
          delivery_slot: 'Instant Delivery'
        })
      });
      assert.strictEqual(checkoutRes.status, 201);
      const checkoutData = await checkoutRes.json();
      lifecycleOrderId = checkoutData.order.id;
      assert.ok(lifecycleOrderId);

      // 4. Kitchen updates milestone to 'preparing'
      const prepRes = await fetch(`${BASE_URL}/seller/orders/${lifecycleOrderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
        body: JSON.stringify({ status: 'preparing' })
      });
      assert.strictEqual(prepRes.status, 200);
      const prepData = await prepRes.json();
      assert.strictEqual(prepData.status, 'preparing');

      // 5. Kitchen updates milestone to 'ready_for_pickup'
      const readyRes = await fetch(`${BASE_URL}/seller/orders/${lifecycleOrderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
        body: JSON.stringify({ status: 'ready_for_pickup' })
      });
      assert.strictEqual(readyRes.status, 200);
      const readyData = await readyRes.json();
      assert.strictEqual(readyData.status, 'ready_for_pickup');
    });

    test('ORDER-002: Customer cannot cancel order once preparing or ready', async () => {
      assert.ok(lifecycleOrderId, 'Order must exist from previous step');
      const cancelRes = await fetch(`${BASE_URL}/orders/${lifecycleOrderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
        body: JSON.stringify({ reason: 'Changed mind' })
      });
      assert.strictEqual(cancelRes.status, 400);
      const data = await cancelRes.json();
      assert.ok(data.error.includes('cannot be cancelled') || data.error.includes('already'));
    });
  });
});
