import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { storageService } from '../src/services/storageService.js';
import { getDbConfig } from '../src/db/migrate.js';

describe('FitBite Production Readiness & Architecture Tests', () => {

  it('1. Database Config Parser supports discrete parameters and DATABASE_URL with SSL', () => {
    // Test with standard DATABASE_URL
    const originalUrl = process.env.DATABASE_URL;
    try {
      process.env.DATABASE_URL = 'mysql://cloud_user:p%40ssword@mysql.railway.app:3307/railway_prod?ssl=true';
      const config = getDbConfig();
      assert.equal(config.host, 'mysql.railway.app');
      assert.equal(config.port, 3307);
      assert.equal(config.user, 'cloud_user');
      assert.equal(config.password, 'p@ssword');
      assert.equal(config.database, 'railway_prod');
      assert.ok(config.ssl);
    } finally {
      if (originalUrl) process.env.DATABASE_URL = originalUrl;
      else delete process.env.DATABASE_URL;
    }
  });

  it('2. Storage Service distinguishes public meal images from private compliance documents', async () => {
    const dummyImage = Buffer.from('fake-image-bytes-jpeg');
    const imageResult = await storageService.savePublicImage(dummyImage, 'paneer_tikka.jpg', 'image/jpeg');

    assert.ok(imageResult.url.includes('/uploads/public/'));
    assert.ok(imageResult.filename.startsWith('meal_'));

    const dummyDoc = Buffer.from('fake-pdf-fssai-bytes');
    const docResult = await storageService.savePrivateDocument(dummyDoc, 'fssai_cert.pdf', 'application/pdf', 'seller_01');

    assert.ok(docResult.accessUrl.includes('/api/upload/documents/'));
    assert.ok(docResult.filename.startsWith('doc_seller_01_'));
  });

  it('3. Private documents path resolution guards against path traversal', async () => {
    const maliciousAttempt = await storageService.getPrivateDocumentPath('../../../etc/passwd');
    assert.equal(maliciousAttempt, null);
  });
});
