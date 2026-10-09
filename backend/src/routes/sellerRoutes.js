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
    if (!meal) return res.status(404).json({ error: 'Meal not found in your kitchen.' });

    const updates = { ...req.body };
    delete updates.id;
    delete updates.seller_id;

    await db.update('meals', { id: meal.id }, updates);
    const updated = await db.findOne('meals', { id: meal.id });

    res.json({ message: 'Meal updated successfully.', meal: updated });
  } catch (err) {
    console.error('Seller update meal error:', err);
    res.status(500).json({ error: 'Server error updating meal.' });
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

export default router;
