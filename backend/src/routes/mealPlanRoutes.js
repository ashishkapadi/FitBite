import express from 'express';
import axios from 'axios';
import { db } from '../db/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const JAVA_SERVICE_URL = process.env.MEAL_PLANNER_SERVICE_URL || 'http://localhost:8082';

// Local deterministic rule engine fallback if Java service is offline
function generateLocalDeterministicMealPlan(request) {
  const goal = (request.goal || 'balanced_eating').toLowerCase();
  const dietPref = (request.dietaryPreference || 'vegetarian').toLowerCase();
  const available = request.availableMeals || [];

  // Filter based on dietary preference
  let eligible = available.filter(m => {
    const tags = (m.dietaryTags || []).map(t => t.toLowerCase());
    if (dietPref === 'vegan') return tags.includes('vegan');
    if (dietPref === 'vegetarian') return tags.includes('vegetarian') || tags.includes('vegan') || tags.includes('veg');
    if (dietPref === 'eggetarian') return tags.includes('vegetarian') || tags.includes('vegan') || tags.includes('egg');
    return true;
  });

  if (eligible.length === 0) eligible = available;

  const breakfastPool = eligible.filter(m => (m.categoryName || '').toLowerCase().includes('breakfast'));
  const mainPool = eligible.filter(m => !(m.categoryName || '').toLowerCase().includes('breakfast'));

  const bfList = breakfastPool.length > 0 ? breakfastPool : eligible;
  const mainList = mainPool.length > 0 ? mainPool : eligible;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sevenDays = [];
  let totalCostSum = 0;

  for (let i = 0; i < 7; i++) {
    const bfMeal = bfList[i % bfList.length];
    const lunchMeal = mainList[(i * 2) % mainList.length];
    const dinnerMeal = mainList[(i * 2 + 1) % mainList.length];

    const meals = [];

    const getReason = (m, slot) => {
      if (goal === 'muscle_gain') return `Rich in lean protein (${m.proteinGrams || 20}g) to support workout recovery and muscle synthesis.`;
      if (goal === 'weight_management') return `Nutrient dense at only ${m.calories || 450} kcal, keeping you satiated with complex carbs.`;
      if (goal === 'convenience') return `Wholesome, hassle-free homestyle staple prepared fresh daily.`;
      return `Balanced macronutrient profile with vitamins and fiber for sustained vitality.`;
    };

    if (bfMeal) {
      meals.push({
        mealId: bfMeal.id,
        name: bfMeal.name,
        slot: 'Breakfast',
        cuisine: bfMeal.cuisine,
        price: bfMeal.basePrice,
        calories: bfMeal.calories,
        proteinGrams: bfMeal.proteinGrams,
        carbsGrams: bfMeal.carbsGrams,
        fatGrams: bfMeal.fatGrams,
        reason: getReason(bfMeal, 'Breakfast'),
        portion: 'Standard',
        imageUrl: bfMeal.imageUrl,
        swapOptions: bfList.filter(m => m.id !== bfMeal.id).slice(0, 2)
      });
    }

    if (lunchMeal) {
      meals.push({
        mealId: lunchMeal.id,
        name: lunchMeal.name,
        slot: 'Lunch',
        cuisine: lunchMeal.cuisine,
        price: lunchMeal.basePrice,
        calories: lunchMeal.calories,
        proteinGrams: lunchMeal.proteinGrams,
        carbsGrams: lunchMeal.carbsGrams,
        fatGrams: lunchMeal.fatGrams,
        reason: getReason(lunchMeal, 'Lunch'),
        portion: 'Standard',
        imageUrl: lunchMeal.imageUrl,
        swapOptions: mainList.filter(m => m.id !== lunchMeal.id).slice(0, 2)
      });
    }

    if (dinnerMeal) {
      meals.push({
        mealId: dinnerMeal.id,
        name: dinnerMeal.name,
        slot: 'Dinner',
        cuisine: dinnerMeal.cuisine,
        price: dinnerMeal.basePrice,
        calories: dinnerMeal.calories,
        proteinGrams: dinnerMeal.proteinGrams,
        carbsGrams: dinnerMeal.carbsGrams,
        fatGrams: dinnerMeal.fatGrams,
        reason: getReason(dinnerMeal, 'Dinner'),
        portion: 'Standard',
        imageUrl: dinnerMeal.imageUrl,
        swapOptions: mainList.filter(m => m.id !== dinnerMeal.id).slice(0, 2)
      });
    }

    const dayCal = meals.reduce((acc, m) => acc + (m.calories || 0), 0);
    const dayProt = Math.round(meals.reduce((acc, m) => acc + (m.proteinGrams || 0), 0) * 10) / 10;
    const dayCarbs = Math.round(meals.reduce((acc, m) => acc + (m.carbsGrams || 0), 0) * 10) / 10;
    const dayFat = Math.round(meals.reduce((acc, m) => acc + (m.fatGrams || 0), 0) * 10) / 10;
    const dayCost = Math.round(meals.reduce((acc, m) => acc + (m.price || 0), 0) * 100) / 100;

    totalCostSum += dayCost;

    sevenDays.push({
      dayNumber: i + 1,
      dayName: daysOfWeek[i],
      meals,
      totalCalories: dayCal,
      totalProteinGrams: dayProt,
      totalCarbsGrams: dayCarbs,
      totalFatGrams: dayFat,
      totalCost: dayCost
    });
  }

  let targetCal = 2050;
  let targetProt = 75.0;
  if (goal === 'muscle_gain') { targetCal = 2400; targetProt = 120.0; }
  else if (goal === 'weight_management') { targetCal = 1750; targetProt = 90.0; }

  return {
    planTitle: goal === 'muscle_gain' ? 'High-Protein Muscle Synthesis 7-Day Plan'
             : goal === 'weight_management' ? 'Calorie-Conscious Metabolism Reset 7-Day Plan'
             : 'Optimal Nutritional Balance 7-Day Plan',
    summary: `Tailored plan targeting ~${targetCal} kcal and ${targetProt}g protein daily using fresh homestyle rotational meals.`,
    targetGoal: goal,
    targetDailyCalories: targetCal,
    targetDailyProteinGrams: targetProt,
    targetDailyCarbsGrams: Math.round(((targetCal * 0.45) / 4) * 10) / 10,
    targetDailyFatGrams: Math.round(((targetCal * 0.25) / 9) * 10) / 10,
    estimatedAverageDailyCost: Math.round((totalCostSum / 7) * 100) / 100,
    sevenDayPlan: sevenDays,
    healthDisclaimer: 'Treat recommendations as general wellness guidance. Not intended to diagnose, cure, or treat medical conditions.',
    nutritionalGuidelines: [
      'Drink 2.5 - 3 liters of fresh water across the day.',
      'Maintain regular meal timings for optimum metabolic digestion.',
      'Use FitBite Build Your Own Meal to personalize ingredients or portions.'
    ],
    engine: 'fitbite_rule_engine'
  };
}

// 1. Generate Personalized 7-Day Meal Plan (Express calls Java Service with fallback)
router.post('/generate', async (req, res) => {
  try {
    let preferences = req.body.preferences || {};
    let userId = req.body.userId;

    // If customer is signed in, fetch saved customer preferences
    if (!preferences.goal && userId) {
      const profile = await db.findOne('customer_profiles', { user_id: userId });
      if (profile) {
        const savedPref = await db.findOne('customer_preferences', { customer_id: profile.id });
        if (savedPref) {
          preferences = { ...savedPref, ...preferences };
        }
      }
    }

    // Fetch active catalog meals to pass to Java service
    const activeMeals = await db.find('meals', m => m.is_available);
    const categories = await db.find('categories');
    const catMap = new Map(categories.map(c => [c.id, c.name]));

    const catalogMealDtos = activeMeals.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      cuisine: m.cuisine,
      categoryName: catMap.get(m.category_id) || 'General',
      basePrice: parseFloat(m.base_price),
      dietaryTags: m.dietary_tags || [],
      allergens: m.allergens || [],
      ingredients: m.ingredients || [],
      calories: m.calories,
      proteinGrams: m.protein_grams,
      carbsGrams: m.carbs_grams,
      fatGrams: m.fat_grams,
      imageUrl: m.image_url
    }));

    const javaPayload = {
      goal: preferences.goal || 'balanced_eating',
      dietaryPreference: preferences.dietary_preference || 'vegetarian',
      allergies: preferences.allergies || [],
      avoidIngredients: preferences.avoid_ingredients || [],
      preferredCuisines: preferences.preferred_cuisines || [],
      spicePreference: preferences.spice_preference || 'medium',
      budgetPerMeal: preferences.budget_per_meal ? parseFloat(preferences.budget_per_meal) : 150.0,
      preferredPortion: preferences.preferred_portion || 'standard',
      age: preferences.age,
      heightCm: preferences.height_cm,
      weightKg: preferences.weight_kg,
      activityLevel: preferences.activity_level,
      routineType: preferences.routine_type,
      availableMeals: catalogMealDtos
    };

    // Try calling Java Spring Boot service first
    try {
      const javaResponse = await axios.post(`${JAVA_SERVICE_URL}/api/meal-plans/generate`, javaPayload, {
        timeout: 3000
      });
      if (javaResponse.status === 200 && javaResponse.data) {
        return res.json({
          ...javaResponse.data,
          source_service: 'java_spring_boot_service'
        });
      }
    } catch (javaErr) {
      // Graceful fallback to deterministic local engine so frontend NEVER fails
      console.log(`[MealPlan] Notice: Java service at ${JAVA_SERVICE_URL} not responding (${javaErr.message}). Using local deterministic rule engine.`);
    }

    const localPlan = generateLocalDeterministicMealPlan(javaPayload);
    return res.json({
      ...localPlan,
      source_service: 'local_deterministic_engine'
    });
  } catch (err) {
    console.error('Generate meal plan error:', err);
    res.status(500).json({ error: 'Server error generating personalized meal plan.' });
  }
});

// 2. Quick recommendations based on goals
router.get('/recommendations', async (req, res) => {
  try {
    const { goal, dietary } = req.query;
    const targetGoal = goal || 'balanced_eating';

    const activeMeals = await db.find('meals', m => {
      if (!m.is_available) return false;
      if (dietary && !m.dietary_tags.map(t => t.toLowerCase()).includes(dietary.toLowerCase())) {
        return false;
      }
      return true;
    });

    let recommended = [];
    if (targetGoal === 'muscle_gain') {
      recommended = activeMeals.filter(m => (m.protein_grams || 0) >= 20);
    } else if (targetGoal === 'weight_management') {
      recommended = activeMeals.filter(m => (m.calories || 500) <= 450);
    } else {
      recommended = activeMeals.filter(m => m.is_featured);
    }

    res.json(recommended.slice(0, 8));
  } catch (err) {
    console.error('Get recommendations error:', err);
    res.status(500).json({ error: 'Server error retrieving recommendations.' });
  }
});

export default router;
