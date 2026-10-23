import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/db.js';

const BASE_URL = 'http://localhost:5000/api';

describe('Role Verification, Authentication & API Security Suite', () => {
  let customerToken = '';
  let sellerToken = '';
  let adminToken = '';
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

    // 1. Authenticate customer
    const custRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul@fitbite.demo', password: 'FitBite@123', requested_role: 'customer' })
    });
    const custData = await custRes.json();
    assert.strictEqual(custRes.status, 200, 'Customer login should succeed');
    assert.strictEqual(custData.user.role, 'customer');
    customerToken = custData.token;

    // 2. Authenticate seller
    const sellRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'seller@fitbite.demo', password: 'FitBite@123', requested_role: 'seller' })
    });
    const sellData = await sellRes.json();
    assert.strictEqual(sellRes.status, 200, 'Seller login should succeed');
    assert.strictEqual(sellData.user.role, 'seller');
    sellerToken = sellData.token;

    // 3. Authenticate admin
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fitbite.demo', password: 'FitBite@Admin2026', requested_role: 'admin' })
    });
    const adminData = await adminRes.json();
    assert.strictEqual(adminRes.status, 200, 'Admin login should succeed');
    assert.strictEqual(adminData.user.role, 'admin');
    adminToken = adminData.token;
  });

  after(async () => {
    if (serverInstance && serverInstance.close) {
      await new Promise(resolve => serverInstance.close(resolve));
    }
  });

  test('SECURITY-001: Unauthenticated visitor cannot access admin APIs (401 Unauthorized)', async () => {
    const res = await fetch(`${BASE_URL}/admin/metrics`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('authentication required') || body.error.toLowerCase().includes('sign in'));
  });

  test('SECURITY-002: Unauthenticated visitor cannot access seller APIs (401 Unauthorized)', async () => {
    const res = await fetch(`${BASE_URL}/seller/overview`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('authentication required') || body.error.toLowerCase().includes('sign in'));
  });

  test('SECURITY-003: Forged demo tokens bypass is rejected (401 Unauthorized)', async () => {
    const res = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: { 'Authorization': 'Bearer fitbite_demo_token_admin' }
    });
    assert.strictEqual(res.status, 401);
  });

  test('SECURITY-004: Customer account cannot access admin APIs (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.includes('Access denied'));
  });

  test('SECURITY-005: Customer account cannot access seller APIs (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/seller/overview`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.includes('Access denied'));
  });

  test('SECURITY-006: Customer cannot escalate to admin via requested_role (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul@fitbite.demo', password: 'FitBite@123', requested_role: 'admin' })
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.includes('Administrator privileges required'));
  });

  test('SECURITY-007: Seller cannot access admin APIs (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/admin/sellers`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.includes('Access denied'));
  });

  test('SECURITY-008: Authorized admin can access admin dashboard APIs (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const metrics = await res.json();
    assert.ok(metrics.total_users_count !== undefined);
    assert.ok(metrics.platform_gross_merchandise_value_inr !== undefined);
  });

  test('SECURITY-009: Authorized seller can access seller dashboard APIs (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/seller/overview`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });
    assert.strictEqual(res.status, 200);
    const overview = await res.json();
    assert.ok(overview.seller !== undefined);
  });
});
