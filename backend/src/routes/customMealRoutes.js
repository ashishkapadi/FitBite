import express from 'express';
import { db } from '../db/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to recalculate custom meal prices and nutrition server-side
export async function calculateCustomMeal(baseMealId, selections) {
  const meal = await db.findOne('meals', { id: baseMealId });
  if (!meal) throw new Error('Base meal not found.');

  const allOptions = await db.find('customization_options');
  const optionMap = new Map(allOptions.map(o => [o.id, o]));

  let totalPrice = parseFloat(meal.base_price);
  let totalCalories = meal.calories || 450;
  let totalProtein = meal.protein_grams || 15.0;
  let totalCarbs = meal.carbs_grams || 55.0;
  let totalFat = meal.fat_grams || 12.0;

  const appliedOptions = [];
  const selectedOptionIds = [];

  // Portion multiplier
  let portionMultiplier = 1.0;
  const portion = selections.portion || 'standard';
  if (portion === 'large') {
    portionMultiplier = 1.25;
    totalPrice += 40.0;
    totalCalories = Math.round(totalCalories * 1.25);
    totalProtein = Math.round(totalProtein * 1.25 * 10) / 10;
  } else if (portion === 'fitness_mega') {
    portionMultiplier = 1.5;
    totalPrice += 75.0;
    totalCalories = Math.round(totalCalories * 1.5);
    totalProtein = Math.round(totalProtein * 1.5 * 10) / 10;
  }

  // Base
  if (selections.base_id && optionMap.has(selections.base_id)) {
    const opt = optionMap.get(selections.base_id);
    totalPrice += parseFloat(opt.price_delta || 0);
    totalCalories += opt.calorie_delta || 0;
    totalProtein += parseFloat(opt.protein_delta || 0);
    totalCarbs += parseFloat(opt.carbs_delta || 0);
    totalFat += parseFloat(opt.fat_delta || 0);
    appliedOptions.push({ group: 'base', item: opt.item_choice, price_delta: opt.price_delta });
    selectedOptionIds.push(opt.id);
  }

  // Protein Core
  if (selections.protein_id && optionMap.has(selections.protein_id)) {
    const opt = optionMap.get(selections.protein_id);
    totalPrice += parseFloat(opt.price_delta || 0);
    totalCalories += opt.calorie_delta || 0;
    totalProtein += parseFloat(opt.protein_delta || 0);
    totalCarbs += parseFloat(opt.carbs_delta || 0);
    totalFat += parseFloat(opt.fat_delta || 0);
    appliedOptions.push({ group: 'protein', item: opt.item_choice, price_delta: opt.price_delta });
    selectedOptionIds.push(opt.id);
  }

  // Side
  if (selections.side_id && optionMap.has(selections.side_id)) {
    const opt = optionMap.get(selections.side_id);
    totalPrice += parseFloat(opt.price_delta || 0);
    totalCalories += opt.calorie_delta || 0;
    totalProtein += parseFloat(opt.protein_delta || 0);
    totalCarbs += parseFloat(opt.carbs_delta || 0);
    totalFat += parseFloat(opt.fat_delta || 0);
    appliedOptions.push({ group: 'side', item: opt.item_choice, price_delta: opt.price_delta });
    selectedOptionIds.push(opt.id);
  }

  // Spice
  if (selections.spice_id && optionMap.has(selections.spice_id)) {
    const opt = optionMap.get(selections.spice_id);
    totalPrice += parseFloat(opt.price_delta || 0);
    appliedOptions.push({ group: 'spice', item: opt.item_choice, price_delta: opt.price_delta });
    selectedOptionIds.push(opt.id);
  }

  // Sauce
  if (selections.sauce_id && optionMap.has(selections.sauce_id)) {
    const opt = optionMap.get(selections.sauce_id);
    totalPrice += parseFloat(opt.price_delta || 0);
    totalCalories += opt.calorie_delta || 0;
    totalProtein += parseFloat(opt.protein_delta || 0);
    totalCarbs += parseFloat(opt.carbs_delta || 0);
    totalFat += parseFloat(opt.fat_delta || 0);
    appliedOptions.push({ group: 'sauce', item: opt.item_choice, price_delta: opt.price_delta });
    selectedOptionIds.push(opt.id);
  }

  // Extras (Array)
  if (Array.isArray(selections.extra_ids)) {
    for (const extId of selections.extra_ids) {
      if (optionMap.has(extId)) {
        const opt = optionMap.get(extId);
        totalPrice += parseFloat(opt.price_delta || 0);
        totalCalories += opt.calorie_delta || 0;
        totalProtein += parseFloat(opt.protein_delta || 0);
        totalCarbs += parseFloat(opt.carbs_delta || 0);
        totalFat += parseFloat(opt.fat_delta || 0);
        appliedOptions.push({ group: 'extra', item: opt.item_choice, price_delta: opt.price_delta });
        selectedOptionIds.push(opt.id);
      }
    }
  }

  // Removals (Array)
  const removals = [];
  if (Array.isArray(selections.removal_ids)) {
    for (const remId of selections.removal_ids) {
      if (optionMap.has(remId)) {
        const opt = optionMap.get(remId);
        totalCalories += opt.calorie_delta || 0;
        totalFat += parseFloat(opt.fat_delta || 0);
        removals.push(opt.item_choice);
        appliedOptions.push({ group: 'removal', item: opt.item_choice, price_delta: 0 });
        selectedOptionIds.push(opt.id);
      }
    }
  }

  // Allergen conflict warning
  const allergenWarnings = [];
  if (meal.allergens && meal.allergens.length > 0) {
    allergenWarnings.push(...meal.allergens.map(a => `Contains allergen: ${a}`));
  }

  return {
    base_meal: {
      id: meal.id,
      name: meal.name,
      base_price: meal.base_price,
      seller_id: meal.seller_id
    },
    portion,
    calculated_price: Math.max(0, Math.round(totalPrice * 100) / 100),
    estimated_calories: Math.max(50, totalCalories),
    estimated_protein: Math.max(0, Math.round(totalProtein * 10) / 10),
    estimated_carbs: Math.max(0, Math.round(totalCarbs * 10) / 10),
    estimated_fat: Math.max(0, Math.round(totalFat * 10) / 10),
    applied_options: appliedOptions,
    selected_option_ids: selectedOptionIds,
    removals,
    allergen_warnings: allergenWarnings,
    special_notes: selections.special_notes ? selections.special_notes.trim() : null
  };
}

// 1. Calculate live custom meal price and macros (Publicly accessible)
router.post(['/calculate', '/recalculate'], async (req, res) => {
  try {
    const mealId = req.body.meal_id || req.body.base_meal_id || req.body.mealId;
    if (!mealId) return res.status(400).json({ error: 'meal_id is required.' });

    const selections = req.body.selections || req.body || {};
    const result = await calculateCustomMeal(mealId, selections);
    res.json(result);
  } catch (err) {
    console.error('Calculate custom meal error:', err);
    res.status(400).json({ error: err.message || 'Error calculating customization.' });
  }
});

// 2. Save favorite custom meal (Requires customer auth)
router.post('/save', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { meal_id, custom_name, selections } = req.body;

    if (!meal_id || !custom_name) {
      return res.status(400).json({ error: 'meal_id and custom_name are required.' });
    }

    const calculated = await calculateCustomMeal(meal_id, selections || {});

    const savedMeal = await db.insert('saved_custom_meals', {
      id: `saved_${Date.now()}`,
      user_id: user.id,
      base_meal_id: meal_id,
      custom_name: custom_name.trim(),
      portion_selected: calculated.portion,
      customizations: {
        selections,
        applied_options: calculated.applied_options,
        removals: calculated.removals,
        special_notes: calculated.special_notes
      },
      calculated_price: calculated.calculated_price,
      estimated_calories: calculated.estimated_calories,
      estimated_protein: calculated.estimated_protein
    });

    res.status(201).json({
      message: `"${custom_name}" saved to your favorite custom meals!`,
      saved_meal: savedMeal
    });
  } catch (err) {
    console.error('Save custom meal error:', err);
    res.status(500).json({ error: err.message || 'Error saving custom meal.' });
  }
});

// 3. Get user's saved custom meals
router.get('/saved', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const list = await db.find('saved_custom_meals', { user_id: user.id });

    // Fetch base meal details for each
    const enriched = [];
    for (const item of list) {
      const baseMeal = await db.findOne('meals', { id: item.base_meal_id });
      enriched.push({
        ...item,
        base_meal: baseMeal
      });
    }

    res.json(enriched);
  } catch (err) {
    console.error('Get saved custom meals error:', err);
    res.status(500).json({ error: 'Server error retrieving saved custom meals.' });
  }
});

export default router;
