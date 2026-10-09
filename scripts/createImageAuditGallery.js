import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire('C:\\Users\\Ashish Ashok Kapadi\\.gemini\\antigravity-ide\\brain\\4483b271-7677-4b30-a0ef-c1c28fec24a3\\scratch\\package.json');
const puppeteer = require('puppeteer-core');
import { MEAL_IMAGE_MAP } from '../backend/src/db/imageMap.js';
import { SEED_MEALS } from '../backend/src/db/mealsSeed.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\Ashish Ashok Kapadi\\.gemini\\antigravity-ide\\brain\\4483b271-7677-4b30-a0ef-c1c28fec24a3';

async function generateAudit() {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FitBite 62-Meal Visual Audit</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    h1 { text-align: center; color: #10b981; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .card { background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
    .img-wrap { width: 100%; height: 180px; background: #000; overflow: hidden; position: relative; }
    img { width: 100%; height: 100%; object-fit: cover; }
    .info { padding: 12px; }
    .id { font-size: 0.75rem; color: #10b981; font-weight: bold; }
    .name { font-size: 0.95rem; font-weight: bold; margin: 4px 0; color: #fff; line-height: 1.2; height: 38px; overflow: hidden; }
    .meta { font-size: 0.8rem; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>FitBite Full Catalog Visual Audit (62 Meals)</h1>
  <div class="grid">
    ${SEED_MEALS.map(meal => {
      let imgSrc = MEAL_IMAGE_MAP[meal.id] || meal.image_url;
      if (imgSrc.startsWith('/images/')) {
        imgSrc = 'http://localhost:5000' + imgSrc;
      }
      return `
        <div class="card" id="${meal.id}">
          <div class="img-wrap">
            <img src="${imgSrc}" alt="${meal.name}" onerror="this.src='https://placehold.co/400x300?text=Error'" />
          </div>
          <div class="info">
            <div class="id">${meal.id} &bull; ${meal.cuisine}</div>
            <div class="name">${meal.name}</div>
            <div class="meta">${meal.calories} kcal &bull; ${meal.protein_grams}g Protein</div>
          </div>
        </div>
      `;
    }).join('\n')}
  </div>
</body>
</html>`;

  const htmlPath = path.join(ARTIFACTS_DIR, 'scratch', 'meal_audit_gallery.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log('Saved audit HTML to', htmlPath);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,3200']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1200 });
    await page.goto(`file://${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    // Capture in 3 chunks of 20-25 meals
    // Batch 1: meals 1 - 20
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'audit_batch_01.png'),
      clip: { x: 0, y: 0, width: 1600, height: 1600 }
    });
    console.log('Saved audit_batch_01.png');

    // Batch 2: meals 21 - 40
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'audit_batch_02.png'),
      clip: { x: 0, y: 1600, width: 1600, height: 1600 }
    });
    console.log('Saved audit_batch_02.png');

    // Batch 3: meals 41 - 62
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'audit_batch_03.png'),
      clip: { x: 0, y: 3200, width: 1600, height: 1600 }
    });
    console.log('Saved audit_batch_03.png');

  } finally {
    await browser.close();
  }
}

generateAudit().catch(console.error);
