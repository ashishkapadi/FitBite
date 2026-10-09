import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { storageService } from '../src/services/storageService.js';
import { getDbConfig, getSanitizedDbUrl } from '../src/db/migrate.js';
import { SCHEMA_STATEMENTS, REQUIRED_TABLES } from '../src/db/schema.js';
import { SEED_USERS } from '../src/db/seedData.js';

describe('FitBite Production Readiness & Architecture Tests', () => {

  it('1. Database Config Parser supports Aiven MySQL DATABASE_URL with defaultdb and SSL', () => {
    const originalUrl = process.env.DATABASE_URL;
    try {
      process.env.DATABASE_URL = 'mysql://avnadmin:SecretPass123!@mysql-fitbite-aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED';
      const config = getDbConfig();
      assert.equal(config.host, 'mysql-fitbite-aivencloud.com');
      assert.equal(config.port, 12345);
      assert.equal(config.user, 'avnadmin');
      assert.equal(config.password, 'SecretPass123!');
      assert.equal(config.database, 'defaultdb');
      assert.ok(config.ssl, 'Expected SSL to be enabled for Aiven MySQL');
    } finally {
      if (originalUrl) process.env.DATABASE_URL = originalUrl;
      else delete process.env.DATABASE_URL;
    }
  });

  it('2. Secret Sanitization: Logs and telemetry never expose MySQL passwords', () => {
    const rawAivenUrl = 'mysql://avnadmin:SuperSecretAivenPassword99@mysql-service.aivencloud.com:25000/defaultdb?ssl-mode=REQUIRED';
    const sanitized = getSanitizedDbUrl(rawAivenUrl);
    assert.ok(!sanitized.includes('SuperSecretAivenPassword99'), 'Sanitized URL must mask password');
    assert.ok(sanitized.includes('avnadmin:****@'), 'Sanitized URL must show masked auth');
    assert.ok(sanitized.includes('defaultdb'), 'Sanitized URL must show database name');
  });

  it('3. Schema Integrity: All 25 required tables are defined with zero hardcoded database names', () => {
    assert.equal(REQUIRED_TABLES.length, 25);
    assert.equal(SCHEMA_STATEMENTS.length, 25);

    for (const stmt of SCHEMA_STATEMENTS) {
      assert.ok(stmt.includes('CREATE TABLE IF NOT EXISTS'), 'Each DDL statement must use IF NOT EXISTS');
      assert.ok(!stmt.toUpperCase().includes('CREATE DATABASE'), 'Must not contain CREATE DATABASE');
      assert.ok(!stmt.toUpperCase().includes('USE '), 'Must not contain USE database statement');
    }
  });

  it('4. Demo Credentials Integrity: Passwords match authentication hashing', () => {
    const customerUser = SEED_USERS.find(u => u.email === 'customer@fitbite.demo');
    assert.ok(customerUser, 'Customer demo user must exist in seed data');
    assert.ok(bcrypt.compareSync('FitBite@2026', customerUser.password_hash), 'Password FitBite@2026 must match hash');

    const adminUser = SEED_USERS.find(u => u.email === 'admin@fitbite.demo');
    assert.ok(adminUser, 'Admin demo user must exist in seed data');
    assert.ok(bcrypt.compareSync('FitBite@Admin2026', adminUser.password_hash), 'Password FitBite@Admin2026 must match hash');

    const sellerUser = SEED_USERS.find(u => u.email === 'seller.tiffin@fitbite.demo');
    assert.ok(sellerUser, 'Seller demo user must exist in seed data');
    assert.ok(bcrypt.compareSync('FitBite@2026', sellerUser.password_hash), 'Seller password FitBite@2026 must match hash');
  });

  it('5. Storage Service distinguishes public meal images from private compliance documents', async () => {
    const dummyImage = Buffer.from('fake-image-bytes-jpeg');
    const imageResult = await storageService.savePublicImage(dummyImage, 'paneer_tikka.jpg', 'image/jpeg');

    assert.ok(imageResult.url.includes('/uploads/public/'));
    assert.ok(imageResult.filename.startsWith('meal_'));

    const dummyDoc = Buffer.from('fake-pdf-fssai-bytes');
    const docResult = await storageService.savePrivateDocument(dummyDoc, 'fssai_cert.pdf', 'application/pdf', 'seller_01');

    assert.ok(docResult.accessUrl.includes('/api/upload/documents/'));
    assert.ok(docResult.filename.startsWith('doc_seller_01_'));
  });

  it('6. Private documents path resolution guards against path traversal', async () => {
    const maliciousAttempt = await storageService.getPrivateDocumentPath('../../../etc/passwd');
    assert.equal(maliciousAttempt, null);
  });
});
