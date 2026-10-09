import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

async function runStandaloneSeed() {
  console.log('[SeedRunner] Starting standalone database seed runner...');
  try {
    await db.init();
    console.log('[SeedRunner] Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[SeedRunner Critical] Seeding failed:', err.message);
    process.exit(1);
  }
}

runStandaloneSeed();
