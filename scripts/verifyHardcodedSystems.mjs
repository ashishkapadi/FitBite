import assert from 'node:assert';
import {
  HARDCODED_DEMO_ACCOUNTS,
  getFallbackAuthSession
} from '../frontend/src/utils/demoAuthFallback.js';
import {
  FALLBACK_CATEGORIES,
  FALLBACK_SELLERS,
  FALLBACK_MEALS,
  FALLBACK_SUBSCRIPTION_PLANS,
  FALLBACK_ORDERS,
  FALLBACK_SELLER_DASHBOARD,
  FALLBACK_ADMIN_DASHBOARD,
  getFallbackApiResponse
} from '../frontend/src/utils/demoCatalogFallback.js';

console.log('--- Verifying FitBite Hardcoded Zero-API-Key Systems ---');

// 1. Verify Hardcoded Auth Personas
const customerSession = getFallbackAuthSession('rahul@fitbite.demo', 'customer');
assert.strictEqual(customerSession.user.role, 'customer', 'Customer role must match');
assert.strictEqual(customerSession.user.full_name, 'Rahul Sharma', 'Customer name must match');
assert.ok(customerSession.token, 'Customer must have hardcoded token');
console.log('✔ Customer Persona (Rahul Sharma) verified');

const sellerSession = getFallbackAuthSession('seller@fitbite.demo', 'seller');
assert.strictEqual(sellerSession.user.role, 'seller', 'Seller role must match');
assert.strictEqual(sellerSession.sellerProfile.business_name, 'Annapurna Homestyle Tiffin Ghar', 'Kitchen name must match');
assert.ok(sellerSession.token, 'Seller must have hardcoded token');
console.log('✔ Kitchen Partner Persona (Annapurna Homestyle Tiffin Ghar) verified');

const adminSession = getFallbackAuthSession('admin@fitbite.demo', 'admin');
assert.strictEqual(adminSession.user.role, 'admin', 'Admin role must match');
assert.ok(adminSession.token, 'Admin must have hardcoded token');
console.log('✔ Platform Admin Persona verified');

// 2. Verify Dynamic Fallback for arbitrary emails
const customSession = getFallbackAuthSession('developer@test.local', 'seller');
assert.strictEqual(customSession.user.email, 'developer@test.local');
assert.strictEqual(customSession.user.role, 'seller');
console.log('✔ Arbitrary input synthesis verified');

// 3. Verify Offline Endpoint Fallbacks
const routesToTest = [
  { path: '/api/catalog/categories', check: data => Array.isArray(data) && data.length >= 10 },
  { path: '/api/catalog/sellers', check: data => Array.isArray(data) && data.length >= 5 },
  { path: '/api/catalog/meals', check: data => Array.isArray(data) && data.length >= 8 },
  { path: '/api/catalog/customization-options', check: data => Boolean(data?.grouped?.bases) },
  { path: '/api/subscriptions/plans', check: data => Array.isArray(data) && data.length >= 3 },
  { path: '/api/orders/my', check: data => Array.isArray(data) && data.length >= 2 },
  { path: '/api/seller/overview', check: data => data.today_orders_count > 0 },
  { path: '/api/seller/orders', check: data => Array.isArray(data) && data.length > 0 },
  { path: '/api/seller/meals', check: data => Array.isArray(data) && data.length > 0 },
  { path: '/api/seller/plans', check: data => Array.isArray(data) && data.length > 0 },
  { path: '/api/seller/batch-manifest', check: data => Boolean(data?.delivery_batches) },
  { path: '/api/seller/earnings', check: data => data.total_revenue > 0 },
  { path: '/api/admin/metrics', check: data => data.total_users > 0 },
  { path: '/api/admin/sellers', check: data => Array.isArray(data) && data.length > 0 },
  { path: '/api/admin/users', check: data => Array.isArray(data) && data.length > 0 },
  { path: '/api/admin/orders', check: data => Array.isArray(data) && data.length > 0 },
  { path: '/api/admin/audit-logs', check: data => Array.isArray(data) && data.length > 0 },
  { path: '/api/users/addresses', check: data => Array.isArray(data) && data.length > 0 }
];

for (const { path, check } of routesToTest) {
  const resp = getFallbackApiResponse(path);
  assert.ok(resp, `Response for ${path} must not be null`);
  assert.ok(check(resp), `Check failed for ${path}`);
  console.log(`✔ Endpoint fallback verified: ${path}`);
}

console.log('\nAll hardcoded zero-API key system checks PASSED successfully!');
