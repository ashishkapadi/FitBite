import express from 'express';
import { db } from '../db/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to compute Indian Standard Time (Asia/Kolkata)
function getNowInKolkata() {
  const now = new Date();
  // Format in Asia/Kolkata timezone
  const kolkataTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(kolkataTimeStr);
}

// Calculate eligible delivery dates based on plan type
// Calculate eligible delivery dates based on plan type
export function calculateDeliveryDates({ planType, startDateStr, cycleDays = 28 }) {
  const dates = [];
  const start = new Date(startDateStr);
  const windowDays = parseInt(cycleDays, 10) || 28;

  if (planType === 'student') {
    // Student: Deliveries Monday to Friday only.
    // Dynamically counts eligible weekdays over the subscription window (28 calendar days / 4 weeks).
    // Saturdays and Sundays are strictly excluded with zero billing and zero deliveries.
    let current = new Date(start);
    for (let i = 0; i < windowDays; i++) {
      const dayOfWeek = current.getDay(); // 0 is Sun, 6 is Sat
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }
  } else {
    // Working professional: exactly windowDays consecutive calendar days (including weekends)
    let current = new Date(start);
    for (let i = 0; i < windowDays; i++) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  }

  return dates;
}

// Check cutoff enforcement in Asia/Kolkata timezone
function checkCutoffEnforcement(deliveryDateStr, slot, seller) {
  const nowKolkata = getNowInKolkata();
  const todayKolkataStr = nowKolkata.toISOString().split('T')[0];

  // If delivery date is in the past
  if (deliveryDateStr < todayKolkataStr) {
    return { allowed: false, reason: 'This meal delivery date has already passed.' };
  }

  // If delivery date is in the future (> today), modifications are permitted
  if (deliveryDateStr > todayKolkataStr) {
    return { allowed: true };
  }

  // If delivery date is TODAY: check time cutoff
  const currentHours = nowKolkata.getHours();
  const currentMinutes = nowKolkata.getMinutes();
  const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}:00`;

  const cutoffTime = slot === 'lunch'
    ? (seller.preparation_cutoff_lunch_time || '08:30:00')
    : (seller.preparation_cutoff_dinner_time || '16:00:00');

  if (currentTimeStr > cutoffTime) {
    return {
      allowed: false,
      reason: `Preparation cutoff time for today's ${slot} was ${cutoffTime} (IST). Changes cannot be made once kitchen prep has started.`
    };
  }

  return { allowed: true };
}

// 1. Get all available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const allPlans = await db.find('subscription_plans');
    const enriched = [];

    // Use tomorrow in IST as reference start date for dynamic previews
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    for (const plan of allPlans) {
      if (!Boolean(plan.is_active)) continue;

      const seller = await db.findOne('seller_profiles', { id: plan.seller_id });
      // Only include plans from verified and active sellers (exclude pending sellers like seller_pending)
      if (!seller || seller.verification_status !== 'approved' || seller.is_listed === false) {
        continue;
      }

      // Fetch 2-3 sample meals from this kitchen for preview
      let sampleMeals = [];
      try {
        const sellerMeals = await db.find('meals', { seller_id: seller.id });
        const availableMeals = sellerMeals.filter(m => Boolean(m.is_available));
        sampleMeals = availableMeals.slice(0, 3).map(m => ({
          id: m.id,
          name: m.name,
          image_url: m.image_url,
          base_price: parseFloat(m.base_price),
          cuisine: m.cuisine,
          dietary_tags: m.dietary_tags || []
        }));
      } catch (err) {
        console.warn('Could not fetch sample meals for seller:', seller.id, err.message);
      }

      // Parse supported slots
      let supportedSlots = ['lunch', 'dinner', 'both'];
      if (typeof plan.supported_slots === 'string') {
        try {
          supportedSlots = JSON.parse(plan.supported_slots);
        } catch {
          supportedSlots = ['lunch', 'dinner', 'both'];
        }
      } else if (Array.isArray(plan.supported_slots)) {
        supportedSlots = plan.supported_slots;
      }

      const basePrice = parseFloat(plan.base_price_per_meal);
      const discountPercent = parseFloat(plan.plan_discount_percent || 0);
      const discountedPrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;

      // Dynamically calculate delivery dates and exact weekday count
      const previewDates = calculateDeliveryDates({
        planType: plan.plan_type,
        startDateStr: tomorrowStr,
        cycleDays: plan.cycle_days || 28
      });

      // Rotating menu preview from daily_tiffin_menus or seller meals
      let menuPreview = [];
      try {
        const dailyMenus = await db.find('daily_tiffin_menus', { seller_id: seller.id });
        if (dailyMenus && dailyMenus.length > 0) {
          dailyMenus.sort((a, b) => (a.menu_date || '').localeCompare(b.menu_date || ''));
          for (const dm of dailyMenus.slice(0, 5)) {
            const mealObj = await db.findOne('meals', { id: dm.meal_id });
            menuPreview.push({
              date: dm.menu_date,
              day: dm.day_of_week || 'Weekday',
              meal_name: mealObj ? mealObj.name : 'Chef Special Thali',
              slot: dm.slot || 'lunch'
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch daily menus for seller:', seller.id, err.message);
      }

      // If no explicit daily menu rows, generate preview from seller's meals
      if (menuPreview.length === 0 && sampleMeals.length > 0) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        menuPreview = days.map((day, idx) => ({
          day,
          meal_name: sampleMeals[idx % sampleMeals.length]?.name || 'Homestyle Special Thali',
          slot: 'lunch'
        }));
      }

      // Fallback menu preview if no meals yet
      if (menuPreview.length === 0) {
        menuPreview = [
          { day: 'Monday', meal_name: 'Dal Tadka, Seasonal Subzi & Phulkas', slot: 'lunch' },
          { day: 'Tuesday', meal_name: 'Paneer Bhurji with Jeera Rice', slot: 'lunch' },
          { day: 'Wednesday', meal_name: 'Chole Masala with Steamed Basmati', slot: 'lunch' },
          { day: 'Thursday', meal_name: 'Rajma Rasila with Salad Bowl', slot: 'lunch' },
          { day: 'Friday', meal_name: 'Special Festive Thali & Kheer', slot: 'lunch' }
        ];
      }

      // Determine dietary type and portion info based on plan name and kitchen
      const isHighProtein = plan.name.toLowerCase().includes('high-protein');
      const isVeg = !isHighProtein || plan.name.toLowerCase().includes('veg');
      const dietaryType = isHighProtein ? 'High-Protein Fitness' : 'Pure Homestyle Vegetarian';
      const portionInfo = plan.plan_type === 'working_professional'
        ? (isHighProtein ? '30g+ protein portion: 200g paneer/tofu/chicken breast + quinoa/brown rice + lentil bowl + greens' : 'Hearty Executive Thali: 4 Phulkas, Basmati Rice, Dal Tadka, 2 Seasonal Subzis, Salad')
        : (isHighProtein ? 'Student High-Protein Bowl: Soya/paneer/egg mash, steamed rice/phulka, dal, and sprout salad' : 'Budget Student Thali: 3 Phulkas, Steamed Rice, Dal, Seasonal Subzi, Kachumber');

      enriched.push({
        ...plan,
        is_active: true,
        base_price_per_meal: basePrice,
        plan_discount_percent: discountPercent,
        per_meal_cost: discountedPrice,
        price_per_delivery: discountedPrice,
        delivery_days_count: previewDates.length,
        total_meal_deliveries: previewDates.length * (supportedSlots.includes('both') && supportedSlots[0] === 'both' ? 2 : 1),
        supported_slots: supportedSlots,
        dietary_type: dietaryType,
        portion_info: portionInfo,
        kitchen_name: seller.business_name,
        seller: {
          id: seller.id,
          business_name: seller.business_name,
          area: seller.area,
          rating: seller.rating,
          rating_count: seller.rating_count,
          preparation_cutoff_lunch_time: seller.preparation_cutoff_lunch_time || '08:30:00',
          preparation_cutoff_dinner_time: seller.preparation_cutoff_dinner_time || '16:00:00'
        },
        sample_meals: sampleMeals,
        menu_preview: menuPreview,
        customization_options: [
          'Low Spice / Medium / Spicy',
          'All-Phulka (No Rice) or Extra Rice Swap',
          'Zero Onion & Garlic option upon request',
          'Eco-friendly Steel Dabba swap (₹0 waste)'
        ],
        skip_cutoff: `Lunch: ${seller.preparation_cutoff_lunch_time || '08:30 AM'} IST | Dinner: ${seller.preparation_cutoff_dinner_time || '04:00 PM'} IST`,
        skip_policy: plan.plan_type === 'working_professional'
          ? 'Up to 2 skip days per 28-day cycle with cutoff notice. Each skipped delivery automatically extends your plan end date by 1 day with zero wasted meals.'
          : 'Monday–Friday deliveries only. Weekends are completely excluded from billing. 1 emergency skip day permitted per monthly term.',
        credit_policy: 'Skipped deliveries are fully credited and extend your subscription cycle by 1 calendar delivery day.',
        cancellation_policy: 'Flexible cancellation anytime. Unused deliveries are fully refunded with zero hidden exit penalties.',
        schedule_details: plan.plan_type === 'working_professional'
          ? '28 consecutive calendar days, including Saturdays & Sundays.'
          : `Monday to Friday deliveries only (${previewDates.length} billable college weekdays). Weekends strictly excluded from charges.`
      });
    }

    res.json(enriched);
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Server error retrieving subscription plans.', details: err.message });
  }
});

// 2. Pre-purchase calculation endpoint: shows exact dates, meal count, price, discounts
router.post('/calculate', async (req, res) => {
  try {
    const { plan_id, slot, start_date } = req.body;
    if (!plan_id || !slot) {
      return res.status(400).json({ error: 'plan_id and slot are required.' });
    }

    const plan = await db.findOne('subscription_plans', { id: plan_id });
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found.' });

    const seller = await db.findOne('seller_profiles', { id: plan.seller_id });

    const effectiveStartDate = start_date || new Date().toISOString().split('T')[0];
    const deliveryDates = calculateDeliveryDates({
      planType: plan.plan_type,
      startDateStr: effectiveStartDate,
      cycleDays: plan.cycle_days
    });

    const mealsPerDay = slot === 'both' ? 2 : 1;
    const totalMealsPurchased = deliveryDates.length * mealsPerDay;

    const basePricePerMeal = parseFloat(plan.base_price_per_meal);
    const discountPercent = parseFloat(plan.plan_discount_percent || 0);
    const discountedPricePerMeal = Math.round(basePricePerMeal * (1 - discountPercent / 100) * 100) / 100;

    const subtotal = Math.round(basePricePerMeal * totalMealsPurchased * 100) / 100;
    const discountAmount = Math.round((subtotal - (discountedPricePerMeal * totalMealsPurchased)) * 100) / 100;
    const deliveryFee = 0.00; // Free delivery for tiffin subscribers
    const taxAmount = Math.round((discountedPricePerMeal * totalMealsPurchased) * 0.05 * 100) / 100;
    const grandTotal = Math.round(((discountedPricePerMeal * totalMealsPurchased) + taxAmount) * 100) / 100;

    const endDate = deliveryDates[deliveryDates.length - 1];

    res.json({
      plan,
      seller: seller ? { business_name: seller.business_name, area: seller.area } : null,
      slot,
      start_date: effectiveStartDate,
      end_date: endDate,
      delivery_days_count: deliveryDates.length,
      meals_per_day: mealsPerDay,
      total_meals_purchased: totalMealsPurchased,
      base_price_per_meal: basePricePerMeal,
      discount_percent: discountPercent,
      effective_price_per_meal: discountedPricePerMeal,
      subtotal,
      discount_amount: discountAmount,
      delivery_fee: deliveryFee,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      max_skips_allowed: plan.max_skips_allowed,
      skip_policy: plan.plan_type === 'working_professional'
        ? 'Up to 2 skip-days permitted per cycle. Each skip extends your end date by 1 day so no purchased meal is lost.'
        : 'Student plan excludes Saturdays and Sundays automatically. 1 emergency skip permitted per month.',
      delivery_dates_preview: deliveryDates
    });
  } catch (err) {
    console.error('Calculate subscription error:', err);
    res.status(500).json({ error: 'Server error calculating subscription.' });
  }
});

// 3. Create & Activate Subscription
router.post('/create', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const {
      plan_id,
      address_id,
      slot = 'both',
      start_date,
      payment_method = 'demo_upi'
    } = req.body;

    if (!plan_id || !address_id) {
      return res.status(400).json({ error: 'plan_id and address_id are required.' });
    }

    const plan = await db.findOne('subscription_plans', { id: plan_id });
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    const address = await db.findOne('addresses', { id: address_id, user_id: user.id });
    if (!address) return res.status(400).json({ error: 'Address not found.' });

    const seller = await db.findOne('seller_profiles', { id: plan.seller_id });
    if (!seller || seller.verification_status !== 'approved') {
      return res.status(400).json({ error: 'Seller is not currently active.' });
    }

    const effectiveStartDate = start_date || new Date().toISOString().split('T')[0];
    const deliveryDates = calculateDeliveryDates({
      planType: plan.plan_type,
      startDateStr: effectiveStartDate,
      cycleDays: plan.cycle_days
    });

    const mealsPerDay = slot === 'both' ? 2 : 1;
    const totalMealsPurchased = deliveryDates.length * mealsPerDay;

    const basePricePerMeal = parseFloat(plan.base_price_per_meal);
    const discountPercent = parseFloat(plan.plan_discount_percent || 0);
    const discountedPricePerMeal = Math.round(basePricePerMeal * (1 - discountPercent / 100) * 100) / 100;

    const subtotal = Math.round(basePricePerMeal * totalMealsPurchased * 100) / 100;
    const discountAmount = Math.round((subtotal - (discountedPricePerMeal * totalMealsPurchased)) * 100) / 100;
    const taxAmount = Math.round((discountedPricePerMeal * totalMealsPurchased) * 0.05 * 100) / 100;
    const grandTotal = Math.round(((discountedPricePerMeal * totalMealsPurchased) + taxAmount) * 100) / 100;

    const originalEndDate = deliveryDates[deliveryDates.length - 1];

    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const subNumber = `SUB-${Math.floor(100000 + Math.random() * 900000)}`;

    const newSub = await db.insert('subscriptions', {
      id: subId,
      subscription_number: subNumber,
      customer_id: user.id,
      seller_id: seller.id,
      plan_id: plan.id,
      address_id: address.id,
      slot,
      start_date: effectiveStartDate,
      original_end_date: originalEndDate,
      revised_end_date: originalEndDate,
      total_meals_purchased: totalMealsPurchased,
      meals_delivered_count: 0,
      meals_skipped_count: 0,
      max_skips_allowed: plan.max_skips_allowed || 2,
      price_per_meal: discountedPricePerMeal,
      subtotal,
      discount_amount: discountAmount,
      delivery_fee: 0.00,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      status: 'active',
      payment_status: 'paid'
    });

    // Idempotently generate scheduled delivery records for all dates
    const sellerMeals = await db.find('meals', { seller_id: seller.id, is_tiffin_eligible: true });
    const fallbackMeals = await db.find('meals', { is_tiffin_eligible: true });
    const mealPool = sellerMeals.length > 0 ? sellerMeals : fallbackMeals;

    const slotsToGenerate = slot === 'both' ? ['lunch', 'dinner'] : [slot];

    for (let dayIndex = 0; dayIndex < deliveryDates.length; dayIndex++) {
      const dStr = deliveryDates[dayIndex];
      for (let sIndex = 0; sIndex < slotsToGenerate.length; sIndex++) {
        const slotName = slotsToGenerate[sIndex];
        const meal = mealPool[(dayIndex * 2 + sIndex) % mealPool.length];

        const schedId = `sched_${subId}_${dStr}_${slotName}`;
        const existingSched = await db.findOne('scheduled_deliveries', { id: schedId });
        if (!existingSched) {
          await db.insert('scheduled_deliveries', {
            id: schedId,
            subscription_id: subId,
            delivery_date: dStr,
            slot: slotName,
            scheduled_meal_id: meal.id,
            chosen_meal_id: meal.id,
            customizations: { base: 'Basmati Rice', spice: 'Medium' },
            status: 'scheduled',
            is_skipped: false,
            skip_reason: null
          });
        }
      }
    }

    res.status(201).json({
      message: 'Subscription created and activated successfully!',
      subscription: newSub
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(500).json({ error: 'Server error creating subscription.' });
  }
});

// 4. Get customer's subscriptions
router.get('/my', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const subs = await db.find('subscriptions', { customer_id: user.id });
    subs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const enriched = [];
    for (const sub of subs) {
      const plan = await db.findOne('subscription_plans', { id: sub.plan_id });
      const seller = await db.findOne('seller_profiles', { id: sub.seller_id });
      enriched.push({
        ...sub,
        plan,
        seller: seller ? { business_name: seller.business_name, area: seller.area } : null
      });
    }

    res.json(enriched);
  } catch (err) {
    console.error('Get my subscriptions error:', err);
    res.status(500).json({ error: 'Server error retrieving subscriptions.' });
  }
});

// 5. Get subscription calendar with rotating meals, cutoffs & skip states
router.get('/:id/calendar', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const sub = await db.findOne('subscriptions', { id: req.params.id });
    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    // Authorization
    if (user.role === 'customer' && sub.customer_id !== user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const seller = await db.findOne('seller_profiles', { id: sub.seller_id });
    const plan = await db.findOne('subscription_plans', { id: sub.plan_id });
    const deliveries = await db.find('scheduled_deliveries', { subscription_id: sub.id });
    deliveries.sort((a, b) => (a.delivery_date + a.slot).localeCompare(b.delivery_date + b.slot));

    // Enrich deliveries with meal details & cutoff status
    const enrichedDeliveries = [];
    for (const d of deliveries) {
      const scheduledMeal = await db.findOne('meals', { id: d.scheduled_meal_id });
      const chosenMeal = await db.findOne('meals', { id: d.chosen_meal_id });
      const cutoffCheck = checkCutoffEnforcement(d.delivery_date, d.slot, seller || {});

      enrichedDeliveries.push({
        ...d,
        scheduled_meal: scheduledMeal ? { id: scheduledMeal.id, name: scheduledMeal.name, image_url: scheduledMeal.image_url } : null,
        chosen_meal: chosenMeal ? { id: chosenMeal.id, name: chosenMeal.name, image_url: chosenMeal.image_url } : null,
        can_modify: cutoffCheck.allowed,
        cutoff_message: cutoffCheck.allowed ? null : cutoffCheck.reason
      });
    }

    res.json({
      subscription: sub,
      plan,
      seller,
      deliveries: enrichedDeliveries
    });
  } catch (err) {
    console.error('Get calendar error:', err);
    res.status(500).json({ error: 'Server error retrieving subscription calendar.' });
  }
});

// 6. Skip scheduled delivery (Extends plan cycle end date for professional plan!)
router.post('/:id/skip', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { delivery_id, reason } = req.body;
    const sub = await db.findOne('subscriptions', { id: req.params.id, customer_id: user.id });

    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });
    if (sub.status !== 'active') return res.status(400).json({ error: 'Subscription is not active.' });

    const delivery = await db.findOne('scheduled_deliveries', { id: delivery_id, subscription_id: sub.id });
    if (!delivery) return res.status(404).json({ error: 'Delivery record not found.' });

    if (delivery.is_skipped) {
      return res.status(400).json({ error: 'This delivery has already been skipped.' });
    }

    const seller = await db.findOne('seller_profiles', { id: sub.seller_id });
    const cutoffCheck = checkCutoffEnforcement(delivery.delivery_date, delivery.slot, seller || {});
    if (!cutoffCheck.allowed) {
      return res.status(400).json({ error: cutoffCheck.reason });
    }

    // Check maximum skips quota
    if (sub.meals_skipped_count >= sub.max_skips_allowed) {
      return res.status(400).json({
        error: `Skip limit reached. Your plan allows a maximum of ${sub.max_skips_allowed} skips per cycle.`
      });
    }

    // Mark delivery as skipped
    await db.update('scheduled_deliveries', { id: delivery.id }, {
      is_skipped: true,
      status: 'skipped',
      skip_reason: reason || 'Customer requested skip',
      skipped_at: new Date().toISOString()
    });

    // Extend the subscription revised end date by 1 calendar day
    const revisedEndObj = new Date(sub.revised_end_date);
    revisedEndObj.setDate(revisedEndObj.getDate() + 1);
    const newRevisedEndDate = revisedEndObj.toISOString().split('T')[0];

    const newSkipCount = sub.meals_skipped_count + 1;
    await db.update('subscriptions', { id: sub.id }, {
      revised_end_date: newRevisedEndDate,
      meals_skipped_count: newSkipCount
    });

    // Add replacement scheduled delivery on the extended date to ensure purchased entitlements are fulfilled!
    const fallbackMeals = await db.find('meals', { is_tiffin_eligible: true });
    const replMeal = fallbackMeals[0] || { id: delivery.scheduled_meal_id };

    const extensionSchedId = `sched_${sub.id}_${newRevisedEndDate}_${delivery.slot}`;
    await db.insert('scheduled_deliveries', {
      id: extensionSchedId,
      subscription_id: sub.id,
      delivery_date: newRevisedEndDate,
      slot: delivery.slot,
      scheduled_meal_id: replMeal.id,
      chosen_meal_id: replMeal.id,
      customizations: delivery.customizations,
      status: 'scheduled',
      is_skipped: false,
      skip_reason: null
    });

    res.json({
      message: `Delivery on ${delivery.delivery_date} skipped. Your plan end date has been extended to ${newRevisedEndDate} to protect your paid meals!`,
      revised_end_date: newRevisedEndDate,
      remaining_skips: sub.max_skips_allowed - newSkipCount
    });
  } catch (err) {
    console.error('Skip delivery error:', err);
    res.status(500).json({ error: 'Server error processing skip request.' });
  }
});

// 7. Swap scheduled dish for approved alternative before cutoff
router.post('/:id/swap-meal', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { delivery_id, new_meal_id, customizations } = req.body;
    const sub = await db.findOne('subscriptions', { id: req.params.id, customer_id: user.id });

    if (!sub) return res.status(404).json({ error: 'Subscription not found.' });

    const delivery = await db.findOne('scheduled_deliveries', { id: delivery_id, subscription_id: sub.id });
    if (!delivery) return res.status(404).json({ error: 'Delivery record not found.' });

    const seller = await db.findOne('seller_profiles', { id: sub.seller_id });
    const cutoffCheck = checkCutoffEnforcement(delivery.delivery_date, delivery.slot, seller || {});
    if (!cutoffCheck.allowed) {
      return res.status(400).json({ error: cutoffCheck.reason });
    }

    const newMeal = await db.findOne('meals', { id: new_meal_id, is_available: true });
    if (!newMeal) return res.status(404).json({ error: 'Selected alternative meal is not available.' });

    await db.update('scheduled_deliveries', { id: delivery.id }, {
      chosen_meal_id: newMeal.id,
      customizations: customizations || delivery.customizations
    });

    res.json({
      message: `Meal for ${delivery.delivery_date} (${delivery.slot}) swapped to "${newMeal.name}"!`,
      new_meal: newMeal
    });
  } catch (err) {
    console.error('Swap meal error:', err);
    res.status(500).json({ error: 'Server error swapping meal.' });
  }
});

export default router;
