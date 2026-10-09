import express from 'express';
import { db } from '../db/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Middleware ensuring authenticated user owns a seller profile
async function requireSellerKitchen(req, res, next) {
  try {
    const seller = await db.findOne('seller_profiles', { user_id: req.user.id });
    if (!seller) {
      return res.status(403).json({ error: 'No kitchen profile associated with this account.' });
    }
    req.seller = seller;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Error validating seller account.' });
  }
}

router.use(requireAuth);
router.use(requireRole('seller', 'admin'));
router.use(requireSellerKitchen);

// 1. Seller Overview Dashboard Stats
router.get('/overview', async (req, res) => {
  try {
    const seller = req.seller;

    const allOrders = await db.find('orders', { seller_id: seller.id });
    const todayStr = new Date().toISOString().split('T')[0];

    const todayOrders = allOrders.filter(o => o.created_at && o.created_at.startsWith(todayStr));
    const activeOrders = allOrders.filter(o => ['confirmed', 'preparing', 'ready_for_pickup'].includes(o.status));

    const completedOrders = allOrders.filter(o => o.status === 'delivered');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.grand_total || 0), 0);

    const activeSubs = await db.find('subscriptions', { seller_id: seller.id, status: 'active' });

    // Today's scheduled subscription deliveries
    const todaySched = await db.find('scheduled_deliveries', d => {
      return d.delivery_date === todayStr && !d.is_skipped;
    });

    const todayLunchCount = todaySched.filter(d => d.slot === 'lunch').length;
    const todayDinnerCount = todaySched.filter(d => d.slot === 'dinner').length;

    res.json({
      seller: {
        id: seller.id,
        business_name: seller.business_name,
        verification_status: seller.verification_status,
        rejection_reason: seller.rejection_reason,
        fssai_number: seller.fssai_number,
        is_listed: seller.is_listed,
        rating: seller.rating,
        rating_count: seller.rating_count
      },
      stats: {
        total_orders_count: allOrders.length,
        today_orders_count: todayOrders.length,
        active_kitchen_tickets: activeOrders.length,
        active_subscriptions_count: activeSubs.length,
        today_subscription_lunches: todayLunchCount,
        today_subscription_dinners: todayDinnerCount,
        total_revenue_inr: Math.round(totalRevenue * 100) / 100
      }
    });
  } catch (err) {
    console.error('Seller overview error:', err);
    res.status(500).json({ error: 'Server error retrieving seller overview.' });
  }
});

// 2. Menu Management (Meals)
router.get('/meals', async (req, res) => {
  try {
    const meals = await db.find('meals', { seller_id: req.seller.id });
    res.json(meals);
  } catch (err) {
    console.error('Seller get meals error:', err);
    res.status(500).json({ error: 'Server error retrieving meals.' });
  }
});

router.post('/meals', async (req, res) => {
  try {
    const seller = req.seller;
    const {
      name,
      category_id,
      description,
      cuisine,
      base_price,
      portion_choices,
      ingredients,
      allergens,
      dietary_tags,
      calories,
      protein_grams,
      carbs_grams,
      fat_grams,
      image_url,
      is_tiffin_eligible = true
    } = req.body;

    if (!name || !category_id || !base_price) {
      return res.status(400).json({ error: 'Meal name, category, and base price are required.' });
    }

    const mealId = `meal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newMeal = await db.insert('meals', {
      id: mealId,
      seller_id: seller.id,
      category_id,
      name: name.trim(),
      slug,
      description: description ? description.trim() : 'Fresh homestyle meal',
      cuisine: cuisine || 'North Indian',
      base_price: parseFloat(base_price),
      portion_choices: portion_choices || ['Standard Portion'],
      ingredients: ingredients || [],
      allergens: allergens || [],
      dietary_tags: dietary_tags || ['Vegetarian'],
      is_available: true,
      is_featured: false,
      is_tiffin_eligible: Boolean(is_tiffin_eligible),
      prep_time_minutes: 20,
      calories: calories ? parseInt(calories, 10) : 450,
      protein_grams: protein_grams ? parseFloat(protein_grams) : 15.0,
      carbs_grams: carbs_grams ? parseFloat(carbs_grams) : 60.0,
      fat_grams: fat_grams ? parseFloat(fat_grams) : 12.0,
      image_url: image_url || '/images/meals/meal_006.jpg',
      rating: 5.0,
      rating_count: 0
    });

    res.status(201).json({ message: 'Meal added to menu successfully!', meal: newMeal });
  } catch (err) {
    console.error('Seller add meal error:', err);
    res.status(500).json({ error: 'Server error adding meal.' });
  }
});

router.put('/meals/:id', async (req, res) => {
  try {
    const meal = await db.findOne('meals', { id: req.params.id, seller_id: req.seller.id });
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found in your kitchen catalog.' });
    }

    const {
      name,
      description,
      category_id,
      cuisine,
      base_price,
      portion_choices,
      ingredients,
      allergens,
      dietary_tags,
      is_available,
      is_tiffin_eligible,
      prep_time_minutes,
      calories,
      protein_grams,
      carbs_grams,
      fat_grams,
      image_url,
      client_last_updated
    } = req.body;

    // Stale edit check if client provided previous timestamp
    if (client_last_updated && meal.updated_at) {
      const clientTime = new Date(client_last_updated).getTime();
      const serverTime = new Date(meal.updated_at).getTime();
      if (serverTime - clientTime > 5000) {
        return res.status(409).json({
          error: 'This meal was modified by another session. Please refresh to load the latest changes before saving.'
        });
      }
    }

    // Validation
    const updates = {};

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Dish name cannot be empty.' });
      }
      updates.name = name.trim();
      updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    if (description !== undefined) {
      updates.description = description.trim();
    }

    if (category_id !== undefined) {
      updates.category_id = category_id;
    }

    if (cuisine !== undefined) {
      updates.cuisine = cuisine.trim();
    }

    if (base_price !== undefined) {
      const parsedPrice = parseFloat(base_price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ error: 'Base price must be a valid positive amount in ₹.' });
      }
      updates.base_price = Math.round(parsedPrice * 100) / 100;
    }

    if (portion_choices !== undefined) {
      updates.portion_choices = Array.isArray(portion_choices) ? portion_choices : [portion_choices];
    }

    if (ingredients !== undefined) {
      updates.ingredients = Array.isArray(ingredients) ? ingredients : [];
    }

    if (allergens !== undefined) {
      updates.allergens = Array.isArray(allergens) ? allergens : [];
    }

    if (dietary_tags !== undefined) {
      updates.dietary_tags = Array.isArray(dietary_tags) ? dietary_tags : ['Vegetarian'];
    }

    if (is_available !== undefined) {
      updates.is_available = Boolean(is_available);
    }

    if (is_tiffin_eligible !== undefined) {
      updates.is_tiffin_eligible = Boolean(is_tiffin_eligible);
    }

    if (prep_time_minutes !== undefined) {
      const parsedPrep = parseInt(prep_time_minutes, 10);
      updates.prep_time_minutes = isNaN(parsedPrep) || parsedPrep < 5 ? 25 : parsedPrep;
    }

    if (calories !== undefined) {
      updates.calories = calories ? parseInt(calories, 10) : null;
    }

    if (protein_grams !== undefined) {
      updates.protein_grams = protein_grams ? parseFloat(protein_grams) : null;
    }

    if (carbs_grams !== undefined) {
      updates.carbs_grams = carbs_grams ? parseFloat(carbs_grams) : null;
    }

    if (fat_grams !== undefined) {
      updates.fat_grams = fat_grams ? parseFloat(fat_grams) : null;
    }

    if (image_url !== undefined && image_url.trim()) {
      updates.image_url = image_url.trim();
    }

    await db.update('meals', { id: meal.id }, updates);
    const updated = await db.findOne('meals', { id: meal.id });

    res.json({
      message: `"${updated.name}" updated successfully.`,
      meal: updated
    });
  } catch (err) {
    console.error('Seller update meal error:', err);
    res.status(500).json({ error: 'Server error updating meal. Please check inputs and try again.' });
  }
});

// 3. Active Orders & Kitchen Preparation Tickets (shows customizations)
router.get('/orders', async (req, res) => {
  try {
    const orders = await db.find('orders', { seller_id: req.seller.id });
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const enriched = [];
    for (const order of orders) {
      const items = await db.find('order_items', { order_id: order.id });
      const address = await db.findOne('addresses', { id: order.address_id });
      enriched.push({
        ...order,
        items,
        address
      });
    }

    res.json(enriched);
  } catch (err) {
    console.error('Seller orders error:', err);
    res.status(500).json({ error: 'Server error retrieving kitchen orders.' });
  }
});

// 4. Update Order Milestone from Kitchen (Confirmed -> Preparing -> Ready for Pickup -> Out for Delivery -> Delivered)
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, title, description } = req.body;
    const validStatuses = ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status milestone. Must be one of: [${validStatuses.join(', ')}]` });
    }

    const order = await db.findOne('orders', { id: req.params.id, seller_id: req.seller.id });
    if (!order) return res.status(404).json({ error: 'Order not found in your kitchen.' });

    await db.update('orders', { id: order.id }, { status });

    // Insert tracking event
    const trackEvent = await db.insert('delivery_tracking_events', {
      id: `track_${Date.now()}`,
      order_id: order.id,
      event_status: status,
      title: title || `Order ${status.replace(/_/g, ' ').toUpperCase()}`,
      description: description || `Kitchen marked status as ${status.replace(/_/g, ' ')}.`
    });

    // Push live update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order.id}`).emit('tracking_update', {
        order_id: order.id,
        status,
        event: trackEvent
      });
    }

    res.json({ message: `Order status updated to ${status}.`, order_id: order.id, status });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Server error updating order status.' });
  }
});

// 5. Batch Delivery Manifest (grouped by area & delivery slot)
router.get('/batch-manifest', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const { date = todayStr, slot = 'lunch' } = req.query;

    const deliveries = await db.find('scheduled_deliveries', d => {
      return d.delivery_date === date && d.slot === slot && !d.is_skipped;
    });

    // Enrich with customer, address, and meal
    const manifestItems = [];
    for (const d of deliveries) {
      const sub = await db.findOne('subscriptions', { id: d.subscription_id, seller_id: req.seller.id });
      if (sub) {
        const address = await db.findOne('addresses', { id: sub.address_id });
        const meal = await db.findOne('meals', { id: d.chosen_meal_id });
        const user = await db.findOne('users', { id: sub.customer_id });

        manifestItems.push({
          scheduled_delivery_id: d.id,
          subscription_number: sub.subscription_number,
          customer_name: user ? user.full_name : 'Valued Customer',
          customer_phone: user ? user.phone : '',
          area: address ? address.area : 'Local Area',
          street_address: address ? address.street_address : '',
          pincode: address ? address.pincode : '',
          leave_at_doorstep: address ? address.leave_at_doorstep : false,
          exchange_steel_dabba: address ? address.exchange_steel_dabba : false,
          delivery_instructions: address ? address.delivery_instructions : '',
          meal_name: meal ? meal.name : 'Daily Special Tiffin',
          customizations: d.customizations,
          status: d.status
        });
      }
    }

    // Group by area
    const groupedByArea = {};
    for (const item of manifestItems) {
      const areaKey = item.area || 'General';
      if (!groupedByArea[areaKey]) groupedByArea[areaKey] = [];
      groupedByArea[areaKey].push(item);
    }

    res.json({
      manifest_date: date,
      slot,
      total_deliveries: manifestItems.length,
      grouped_by_area: groupedByArea
    });
  } catch (err) {
    console.error('Batch manifest error:', err);
    res.status(500).json({ error: 'Server error generating batch manifest.' });
  }
});

// 6. Daily Tiffin Menu Calendar for this Seller
router.get('/menus', async (req, res) => {
  try {
    const menus = await db.find('daily_tiffin_menus', { seller_id: req.seller.id });
    menus.sort((a, b) => a.menu_date.localeCompare(b.menu_date));

    const enriched = [];
    for (const m of menus) {
      const meal = await db.findOne('meals', { id: m.meal_id });
      const altMeal = m.alternative_meal_id ? await db.findOne('meals', { id: m.alternative_meal_id }) : null;
      enriched.push({
        ...m,
        meal: meal ? { id: meal.id, name: meal.name, image_url: meal.image_url } : null,
        alternative_meal: altMeal ? { id: altMeal.id, name: altMeal.name } : null
      });
    }

    res.json(enriched);
  } catch (err) {
    console.error('Seller menus error:', err);
    res.status(500).json({ error: 'Server error retrieving tiffin menus.' });
  }
});

// 7. Manage Tiffin Plans for this Kitchen
router.get('/plans', async (req, res) => {
  try {
    const plans = await db.find('subscription_plans', { seller_id: req.seller.id });
    const formatted = plans.map(p => ({
      ...p,
      is_active: Boolean(p.is_active),
      base_price_per_meal: parseFloat(p.base_price_per_meal),
      plan_discount_percent: parseFloat(p.plan_discount_percent || 0),
      supported_slots: typeof p.supported_slots === 'string' ? JSON.parse(p.supported_slots) : (p.supported_slots || ['lunch', 'dinner', 'both'])
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Seller get plans error:', err);
    res.status(500).json({ error: 'Server error retrieving plans.' });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const {
      name,
      plan_type = 'working_professional',
      description,
      supported_slots = ['lunch', 'dinner', 'both'],
      dietary_type = 'vegetarian',
      base_price_per_meal,
      plan_discount_percent = 15,
      cycle_days = 28,
      max_skips_allowed = 2
    } = req.body;

    if (!name || !base_price_per_meal) {
      return res.status(400).json({ error: 'Plan name and base price per meal are required.' });
    }

    const planId = `sub_plan_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newPlan = await db.insert('subscription_plans', {
      id: planId,
      seller_id: req.seller.id,
      name: name.trim(),
      plan_type,
      description: description ? description.trim() : 'Daily home-cooked meal plan',
      supported_slots: Array.isArray(supported_slots) ? supported_slots : ['lunch', 'dinner', 'both'],
      dietary_type,
      base_price_per_meal: parseFloat(base_price_per_meal),
      plan_discount_percent: parseFloat(plan_discount_percent || 0),
      cycle_days: parseInt(cycle_days, 10) || (plan_type === 'student' ? 30 : 28),
      max_skips_allowed: parseInt(max_skips_allowed, 10) || 2,
      is_active: true
    });

    res.status(201).json({ message: 'Tiffin plan created successfully!', plan: newPlan });
  } catch (err) {
    console.error('Seller create plan error:', err);
    res.status(500).json({ error: 'Server error creating plan.' });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await db.findOne('subscription_plans', { id: req.params.id, seller_id: req.seller.id });
    if (!plan) return res.status(404).json({ error: 'Subscription plan not found in your kitchen.' });

    const updates = { ...req.body };
    delete updates.id;
    delete updates.seller_id;

    if (updates.base_price_per_meal !== undefined) updates.base_price_per_meal = parseFloat(updates.base_price_per_meal);
    if (updates.plan_discount_percent !== undefined) updates.plan_discount_percent = parseFloat(updates.plan_discount_percent);
    if (updates.is_active !== undefined) updates.is_active = Boolean(updates.is_active);

    await db.update('subscription_plans', { id: plan.id }, updates);
    const updated = await db.findOne('subscription_plans', { id: plan.id });

    res.json({ message: 'Plan updated successfully.', plan: updated });
  } catch (err) {
    console.error('Seller update plan error:', err);
    res.status(500).json({ error: 'Server error updating plan.' });
  }
});

// 8. Earnings & Revenue Breakdown
router.get('/earnings', async (req, res) => {
  try {
    const seller = req.seller;
    const orders = await db.find('orders', { seller_id: seller.id });
    const deliveredOrders = orders.filter(o => o.status === 'delivered');

    const orderRevenue = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.grand_total || 0), 0);
    const subscriptions = await db.find('subscriptions', { seller_id: seller.id });
    const activeSubs = subscriptions.filter(s => s.status === 'active');
    const completedSubs = subscriptions.filter(s => s.status === 'completed');

    const subscriptionRevenue = [...activeSubs, ...completedSubs].reduce((sum, s) => sum + parseFloat(s.total_amount_paid || 0), 0);
    const grossTotal = Math.round((orderRevenue + subscriptionRevenue) * 100) / 100;
    const platformCommissionPercent = 10;
    const netPayout = Math.round((grossTotal * (1 - platformCommissionPercent / 100)) * 100) / 100;

    res.json({
      seller_id: seller.id,
      business_name: seller.business_name,
      summary: {
        gross_revenue: grossTotal,
        net_payout: netPayout,
        platform_fee_percent: platformCommissionPercent,
        orders_revenue: Math.round(orderRevenue * 100) / 100,
        subscriptions_revenue: Math.round(subscriptionRevenue * 100) / 100,
        total_delivered_orders: deliveredOrders.length,
        total_active_subscriptions: activeSubs.length
      },
      recent_orders: deliveredOrders.slice(-5).reverse()
    });
  } catch (err) {
    console.error('Seller earnings error:', err);
    res.status(500).json({ error: 'Server error retrieving earnings.' });
  }
});

// 9. Kitchen Settings
router.get('/settings', async (req, res) => {
  try {
    const seller = await db.findOne('seller_profiles', { id: req.seller.id });
    res.json(seller);
  } catch (err) {
    console.error('Seller get settings error:', err);
    res.status(500).json({ error: 'Server error retrieving kitchen settings.' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const allowedFields = [
      'business_name',
      'operating_address',
      'area',
      'operating_hours',
      'fssai_number',
      'preparation_cutoff_lunch_time',
      'preparation_cutoff_dinner_time',
      'delivery_radius_km'
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    await db.update('seller_profiles', { id: req.seller.id }, updates);
    const updated = await db.findOne('seller_profiles', { id: req.seller.id });
    res.json({ message: 'Kitchen settings updated successfully.', seller: updated });
  } catch (err) {
    console.error('Seller update settings error:', err);
    res.status(500).json({ error: 'Server error updating settings.' });
  }
});

export default router;
