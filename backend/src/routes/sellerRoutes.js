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

    // Filter genuine eligible orders belonging to this seller (exclude artificial demo seed order)
    const allOrders = await db.find('orders', o => o.seller_id === seller.id && !o.id?.startsWith('ord_demo_'));
    const todayStr = new Date().toISOString().split('T')[0];

    const todayOrders = allOrders.filter(o => o.created_at && o.created_at.startsWith(todayStr));
    const activeOrders = allOrders.filter(o => ['confirmed', 'preparing', 'ready_for_pickup'].includes(o.status));

    const activeSubs = await db.find('subscriptions', { seller_id: seller.id, status: 'active' });
    const subIds = new Set(activeSubs.map(s => s.id));

    // Today's scheduled subscription deliveries for this seller's active subscriptions
    const todaySched = await db.find('scheduled_deliveries', d => {
      return d.delivery_date === todayStr && !d.is_skipped && subIds.has(d.subscription_id);
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
        // The overview is an operational dashboard, not a settlement statement.
        // Keep this deliberately at zero until a separate approved revenue metric is introduced.
        total_revenue_inr: 0
      }
    });
  } catch (err) {
    console.error('Seller overview error:', err);
    res.status(500).json({ error: 'Server error retrieving seller overview.' });
  }
});

// 2. Active subscribers for the seller's own tiffin plans
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await db.find('subscriptions', subscription => (
      subscription.seller_id === req.seller.id && subscription.status === 'active'
    ));

    const enriched = await Promise.all(subscriptions.map(async subscription => {
      const [customer, plan, address] = await Promise.all([
        db.findOne('users', { id: subscription.customer_id }),
        db.findOne('subscription_plans', { id: subscription.plan_id, seller_id: req.seller.id }),
        db.findOne('addresses', { id: subscription.address_id, user_id: subscription.customer_id })
      ]);

      return {
        id: subscription.id,
        subscription_number: subscription.subscription_number,
        status: subscription.status,
        slot: subscription.slot,
        start_date: subscription.start_date,
        revised_end_date: subscription.revised_end_date,
        meals_delivered_count: subscription.meals_delivered_count || 0,
        total_meals_purchased: subscription.total_meals_purchased || 0,
        customer: customer ? {
          full_name: customer.full_name,
          phone: customer.phone || '',
          email: customer.email || ''
        } : null,
        plan: plan ? {
          id: plan.id,
          name: plan.name,
          plan_type: plan.plan_type,
          cycle_days: plan.cycle_days
        } : null,
        delivery_address: address ? {
          recipient_name: address.recipient_name || customer?.full_name || '',
          phone: address.phone || customer?.phone || '',
          street_address: address.street_address || '',
          landmark: address.landmark || '',
          area: address.area || '',
          city: address.city || '',
          pincode: address.pincode || ''
        } : null
      };
    }));

    enriched.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
    res.json(enriched);
  } catch (err) {
    console.error('Seller active subscribers error:', err);
    res.status(500).json({ error: 'Server error retrieving active subscribers.' });
  }
});

// 3. Menu Management (Meals)
router.get('/meals', async (req, res) => {
  try {
    const { status } = req.query; // 'active' | 'archived' | 'all'
    const meals = await db.find('meals', m => {
      if (m.seller_id !== req.seller.id) return false;
      if (status === 'archived') return Boolean(m.is_archived);
      if (status === 'all') return true;
      // Default: active dishes only
      return !m.is_archived;
    });

    // Enrich with customization option IDs
    const enriched = await Promise.all(meals.map(async (m) => {
      const mappings = await db.find('meal_customization_mappings', { meal_id: m.id });
      return {
        ...m,
        is_archived: Boolean(m.is_archived),
        customization_option_ids: mappings.map(mp => mp.customization_option_id)
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Seller get meals error:', err);
    res.status(500).json({ error: 'Server error retrieving meals.' });
  }
});

router.get('/meals/:id', async (req, res) => {
  try {
    const meal = await db.findOne('meals', { id: req.params.id });
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found in kitchen catalog.' });
    }
    if (meal.seller_id !== req.seller.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this meal.' });
    }
    const mappings = await db.find('meal_customization_mappings', { meal_id: meal.id });
    res.json({
      ...meal,
      is_archived: Boolean(meal.is_archived),
      customization_option_ids: mappings.map(mp => mp.customization_option_id)
    });
  } catch (err) {
    console.error('Seller get meal error:', err);
    res.status(500).json({ error: 'Server error retrieving meal.' });
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
    const meal = await db.findOne('meals', { id: req.params.id });
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found in kitchen catalog.' });
    }
    if (meal.seller_id !== req.seller.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this meal.' });
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
      customization_option_ids,
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
      updates.description = description ? description.trim() : '';
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
      updates.portion_choices = Array.isArray(portion_choices)
        ? portion_choices
        : (typeof portion_choices === 'string' ? portion_choices.split(',').map(s => s.trim()).filter(Boolean) : ['Standard Portion']);
    }

    if (ingredients !== undefined) {
      updates.ingredients = Array.isArray(ingredients)
        ? ingredients
        : (typeof ingredients === 'string' ? ingredients.split(',').map(s => s.trim()).filter(Boolean) : []);
    }

    if (allergens !== undefined) {
      updates.allergens = Array.isArray(allergens)
        ? allergens
        : (typeof allergens === 'string' ? allergens.split(',').map(s => s.trim()).filter(Boolean) : []);
    }

    if (dietary_tags !== undefined) {
      updates.dietary_tags = Array.isArray(dietary_tags)
        ? dietary_tags
        : (typeof dietary_tags === 'string' ? dietary_tags.split(',').map(s => s.trim()).filter(Boolean) : ['Vegetarian']);
    }

    if (is_available !== undefined) {
      updates.is_available = Boolean(is_available);
    }

    if (is_tiffin_eligible !== undefined) {
      updates.is_tiffin_eligible = Boolean(is_tiffin_eligible);
    }

    if (prep_time_minutes !== undefined) {
      const parsedPrep = parseInt(prep_time_minutes, 10);
      if (isNaN(parsedPrep) || parsedPrep < 5) {
        return res.status(400).json({ error: 'Preparation time must be at least 5 minutes.' });
      }
      updates.prep_time_minutes = parsedPrep;
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

    // Update customization option mappings if provided
    if (Array.isArray(customization_option_ids)) {
      await db.delete('meal_customization_mappings', { meal_id: meal.id });
      for (const optId of customization_option_ids) {
        if (!optId) continue;
        await db.insert('meal_customization_mappings', {
          id: `mcm_${meal.id.slice(-6)}_${optId.slice(-6)}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          meal_id: meal.id,
          customization_option_id: optId
        });
      }
    }

    const updated = await db.findOne('meals', { id: meal.id });
    const currentMappings = await db.find('meal_customization_mappings', { meal_id: meal.id });

    res.json({
      message: `"${updated.name}" updated successfully.`,
      meal: {
        ...updated,
        is_archived: Boolean(updated.is_archived),
        customization_option_ids: currentMappings.map(m => m.customization_option_id)
      }
    });
  } catch (err) {
    console.error('Seller update meal error:', err);
    res.status(500).json({ error: 'Server error updating meal. Please check inputs and try again.' });
  }
});

// Delete/Archive Meal (Soft delete with dependency verification)
router.delete('/meals/:id', async (req, res) => {
  try {
    const meal = await db.findOne('meals', { id: req.params.id });
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found in kitchen catalog.' });
    }
    if (meal.seller_id !== req.seller.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this meal.' });
    }

    if (meal.is_archived) {
      return res.status(400).json({ error: 'This meal is already archived.' });
    }

    // Dependency Check: Check upcoming tiffin deliveries or active subscriptions
    const todayStr = new Date().toISOString().split('T')[0];

    const upcomingDeliveries = await db.find('scheduled_deliveries', d => {
      const isThisMeal = (d.scheduled_meal_id === meal.id || d.chosen_meal_id === meal.id);
      const isUpcoming = d.delivery_date >= todayStr;
      const isPending = ['scheduled', 'preparing'].includes(d.status);
      return isThisMeal && isUpcoming && isPending && !d.is_skipped;
    });

    const activeDependencies = [];
    for (const d of upcomingDeliveries) {
      const sub = await db.findOne('subscriptions', { id: d.subscription_id });
      if (sub && sub.status === 'active') {
        activeDependencies.push({ delivery: d, subscription: sub });
      }
    }

    const activeSubIds = new Set(activeDependencies.map(d => d.subscription.id));

    // Check upcoming daily tiffin menus
    const upcomingMenus = await db.find('daily_tiffin_menus', m => {
      const isThisMeal = (m.meal_id === meal.id || m.alternative_meal_id === meal.id);
      return isThisMeal && m.seller_id === req.seller.id && m.menu_date >= todayStr;
    });

    if (activeDependencies.length > 0 || upcomingMenus.length > 0) {
      const allDates = [
        ...activeDependencies.map(d => d.delivery.delivery_date),
        ...upcomingMenus.map(m => m.menu_date)
      ].sort();
      const nextDate = allDates[0] || todayStr;
      const explanation = `This meal is currently assigned to ${activeDependencies.length} upcoming scheduled tiffin delivery(ies) across ${activeSubIds.size} active subscription(s) (next scheduled: ${nextDate}) and ${upcomingMenus.length} upcoming daily menu(s). Please reassign an alternative meal in your Tiffin Menus or wait until the scheduled delivery cycle concludes before removing this meal.`;

      return res.status(409).json({
        error: `Cannot remove "${meal.name}" from your menu: It is required by upcoming tiffin deliveries or active subscriptions.`,
        blocked: true,
        upcoming_deliveries_count: activeDependencies.length,
        active_subscriptions_count: activeSubIds.size,
        upcoming_menu_days_count: upcomingMenus.length,
        next_delivery_date: nextDate,
        explanation,
        dependencies: {
          upcoming_deliveries_count: activeDependencies.length,
          active_subscriptions_count: activeSubIds.size,
          upcoming_menu_days_count: upcomingMenus.length,
          next_delivery_date: nextDate,
          explanation
        }
      });
    }

    // Perform safe soft-deletion / archiving
    // Preserves historical orders, purchased prices, and meal snapshots in order_items
    await db.update('meals', { id: meal.id }, {
      is_archived: true,
      is_available: false,
      archived_at: new Date().toISOString()
    });

    const archivedMeal = await db.findOne('meals', { id: meal.id });

    res.json({
      message: `"${meal.name}" has been removed from your active menu and archived. Historical orders remain intact.`,
      meal: archivedMeal
    });
  } catch (err) {
    console.error('Seller delete/archive meal error:', err);
    res.status(500).json({ error: 'Server error archiving meal.' });
  }
});

// Restore Archived Meal
router.put('/meals/:id/restore', async (req, res) => {
  try {
    const meal = await db.findOne('meals', { id: req.params.id });
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found in kitchen catalog.' });
    }
    if (meal.seller_id !== req.seller.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this meal.' });
    }

    if (!meal.is_archived) {
      return res.status(400).json({ error: 'This meal is already active on your menu.' });
    }

    // Restore meal to active status
    await db.update('meals', { id: meal.id }, {
      is_archived: false,
      is_available: true,
      archived_at: null
    });

    const restoredMeal = await db.findOne('meals', { id: meal.id });

    res.json({
      message: `"${restoredMeal.name}" has been restored to your active kitchen menu.`,
      meal: restoredMeal
    });
  } catch (err) {
    console.error('Seller restore meal error:', err);
    res.status(500).json({ error: 'Server error restoring meal.' });
  }
});

// Customization options catalog for kitchen dish configuration
router.get('/customization-options', async (req, res) => {
  try {
    const options = await db.find('customization_options');
    options.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    res.json(options);
  } catch (err) {
    console.error('Seller customization options error:', err);
    res.status(500).json({ error: 'Server error retrieving customization options.' });
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

    // Qualifying eligible orders belonging to this seller (excluding demo seed test orders)
    const orders = await db.find('orders', o => o.seller_id === seller.id && !o.id?.startsWith('ord_demo_'));
    const deliveredOrders = orders.filter(o => o.status === 'delivered' && o.payment_status === 'paid');

    const orderRevenue = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.grand_total || 0), 0);
    const subscriptions = await db.find('subscriptions', { seller_id: seller.id });
    const activeSubs = subscriptions.filter(s => s.status === 'active' && s.payment_status === 'paid');
    const completedSubs = subscriptions.filter(s => s.status === 'completed' && s.payment_status === 'paid');

    const subscriptionRevenue = [...activeSubs, ...completedSubs].reduce((sum, s) => sum + parseFloat(s.total_amount_paid || 0), 0);

    // Subtract completed refunds for this seller's orders
    const allOrderIds = new Set(orders.map(o => o.id));
    const refunds = await db.find('refunds', r => allOrderIds.has(r.order_id) && r.status === 'completed');
    const totalRefunds = refunds.reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0);

    // Today's earnings
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDeliveredOrders = deliveredOrders.filter(o => o.created_at && o.created_at.startsWith(todayStr));
    const todayOrdersRev = todayDeliveredOrders.reduce((sum, o) => sum + parseFloat(o.grand_total || 0), 0);

    const grossTotal = Math.max(0, Math.round((orderRevenue + subscriptionRevenue - totalRefunds) * 100) / 100);
    const platformCommissionPercent = 10;
    const platformFee = Math.round(grossTotal * (platformCommissionPercent / 100) * 100) / 100;
    const netPayout = Math.max(0, Math.round((grossTotal - platformFee) * 100) / 100);
    const todayEarnings = Math.max(0, Math.round(todayOrdersRev * (1 - platformCommissionPercent / 100) * 100) / 100);

    // Available Balance is the net payout ready for next scheduled disbursement
    const availableBalance = netPayout;
    const pendingPayouts = 0.00;

    res.json({
      seller_id: seller.id,
      business_name: seller.business_name,
      summary: {
        gross_revenue: grossTotal,
        today_earnings: todayEarnings,
        net_payout: netPayout,
        available_balance: availableBalance,
        pending_payouts: pendingPayouts,
        platform_fee_percent: platformCommissionPercent,
        platform_fee_amount: platformFee,
        refunds_amount: Math.round(totalRefunds * 100) / 100,
        orders_revenue: Math.round(orderRevenue * 100) / 100,
        subscriptions_revenue: Math.round(subscriptionRevenue * 100) / 100,
        total_delivered_orders: deliveredOrders.length,
        total_active_subscriptions: activeSubs.length
      },
      settlement_status: grossTotal > 0 ? 'On-schedule (Next cycle tomorrow 10:00 AM)' : 'No pending disbursements',
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
