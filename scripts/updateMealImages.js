import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MEAL_IMAGE_MAP } from '../backend/src/db/imageMap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Update mealsSeed.js
const mealsSeedPath = path.join(rootDir, 'backend/src/db/mealsSeed.js');
let seedContent = fs.readFileSync(mealsSeedPath, 'utf8');

let seedCount = 0;
for (const [mealId, newUrl] of Object.entries(MEAL_IMAGE_MAP)) {
  const mealRegex = new RegExp(`(id:\\s*'${mealId}'[\\s\\S]*?image_url:\\s*')[^']+(\\')`);
  if (mealRegex.test(seedContent)) {
    seedContent = seedContent.replace(mealRegex, `$1${newUrl}$2`);
    seedCount++;
  } else {
    console.warn(`[mealsSeed] Meal ${mealId} not found`);
  }
}
fs.writeFileSync(mealsSeedPath, seedContent, 'utf8');
console.log(`[mealsSeed.js] Successfully updated ${seedCount} meal images.`);

// 2. Update backend/data/fitbite_store.json
const storePath = path.join(rootDir, 'backend/data/fitbite_store.json');
if (fs.existsSync(storePath)) {
  const storeData = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  if (Array.isArray(storeData.meals)) {
    let storeCount = 0;
    storeData.meals = storeData.meals.map(meal => {
      if (MEAL_IMAGE_MAP[meal.id]) {
        meal.image_url = MEAL_IMAGE_MAP[meal.id];
        storeCount++;
      }
      return meal;
    });
    fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2), 'utf8');
    console.log(`[fitbite_store.json] Successfully updated ${storeCount} meal records.`);
  }
}

// 3. Update sellerRoutes.js default image if needed
const sellerRoutesPath = path.join(rootDir, 'backend/src/routes/sellerRoutes.js');
if (fs.existsSync(sellerRoutesPath)) {
  let sellerContent = fs.readFileSync(sellerRoutesPath, 'utf8');
  sellerContent = sellerContent.replace(
    /image_url:\s*image_url\s*\|\|\s*'https:\/\/images\.unsplash\.com\/photo-1546833999-b9f581a1996d\?auto=format&fit=crop&w=800&q=80'/,
    "image_url: image_url || '/images/meals/meal_006.jpg'"
  );
  fs.writeFileSync(sellerRoutesPath, sellerContent, 'utf8');
  console.log('[sellerRoutes.js] Updated default image fallback.');
}

console.log('Database and seed image update complete!');
