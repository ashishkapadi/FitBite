import express from 'express';
import { db } from '../db/db.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateCustomMeal } from './customMealRoutes.js';

const router = express.Router();

// Helper to get or create cart for user
async function getOrCreateCart(userId) {
  let cart = await db.findOne('carts', { user_id: userId });
  if (!cart) {
    cart = await db.insert('carts', {
      id: `cart_${Date.now()}_${userId}`,
      user_id: userId,
      seller_id: null
    });
  }
  return cart;
}

// 1. Get current cart contents
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const cart = await getOrCreateCart(user.id);

    const items = await db.find('cart_items', { cart_id: cart.id });

    // Enrich items with meal info
    const enrichedItems = [];
    let subtotal = 0;
    let customizationTotal = 0;

    for (const item of items) {
      const meal = await db.findOne('meals', { id: item.meal_id });
      enrichedItems.push({
        ...item,
        meal: meal ? {
          id: meal.id,
          name: meal.name,
          image_url: meal.image_url,
          cuisine: meal.cuisine,
          base_price: meal.base_price,
          dietary_tags: meal.dietary_tags
        } : null
      });
      subtotal += parseFloat(item.total_price);
    }

    let seller = null;
    if (cart.seller_id) {
      seller = await db.findOne('seller_profiles', { id: cart.seller_id });
    }

    res.json({
      cart_id: cart.id,
      seller_id: cart.seller_id,
      seller: seller ? {
        id: seller.id,
        business_name: seller.business_name,
        area: seller.area,
        rating: seller.rating
      } : null,
      items: enrichedItems,
      item_count: enrichedItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: Math.round(subtotal * 100) / 100
    });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Server error retrieving cart.' });
  }
});

// 2. Add item to cart (Single-kitchen rule strictly enforced)
router.post(['/add', '/items'], requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const {
      meal_id,
      quantity = 1,
      portion = 'standard',
      customizations = {},
      special_notes,
      replace_cart_if_conflict = false
    } = req.body;

    if (!meal_id) return res.status(400).json({ error: 'meal_id is required.' });

    const meal = await db.findOne('meals', { id: meal_id });
    if (!meal || !meal.is_available) {
      return res.status(404).json({ error: 'Meal is currently not available.' });
    }

    const targetSeller = await db.findOne('seller_profiles', { id: meal.seller_id });
    const cart = await getOrCreateCart(user.id);

    // Single-kitchen conflict check
    if (cart.seller_id && cart.seller_id !== meal.seller_id) {
      const currentSeller = await db.findOne('seller_profiles', { id: cart.seller_id });
      const currentItems = await db.find('cart_items', { cart_id: cart.id });

      if (currentItems.length > 0) {
        if (!replace_cart_if_conflict) {
          return res.status(409).json({
            conflict: true,
            current_seller: {
              id: currentSeller ? currentSeller.id : cart.seller_id,
              name: currentSeller ? currentSeller.business_name : 'Current Kitchen'
            },
            new_seller: {
              id: targetSeller ? targetSeller.id : meal.seller_id,
              name: targetSeller ? targetSeller.business_name : 'New Kitchen'
            },
            message: `Your cart contains items from "${currentSeller?.business_name || 'another kitchen'}". Would you like to clear your cart and start a new order from "${targetSeller?.business_name || 'this kitchen'}"?`
          });
        }

        // If user confirmed replacement, clear previous cart items
        await db.delete('cart_items', { cart_id: cart.id });
      }
    }

    // Set cart seller
    await db.update('carts', { id: cart.id }, { seller_id: meal.seller_id });

    // Calculate exact price with customizations server-side
    const customResult = await calculateCustomMeal(meal.id, {
      ...customizations,
      portion,
      special_notes
    });

    const itemPrice = customResult.calculated_price;
    const qty = Math.max(1, parseInt(quantity, 10));
    const totalPrice = Math.round(itemPrice * qty * 100) / 100;

    const newItem = await db.insert('cart_items', {
      id: `ci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cart_id: cart.id,
      meal_id: meal.id,
      quantity: qty,
      portion_selected: portion,
      customizations: {
        selections: customizations,
        applied_options: customResult.applied_options,
        removals: customResult.removals,
        estimated_calories: customResult.estimated_calories,
        estimated_protein: customResult.estimated_protein
      },
      item_price: itemPrice,
      total_price: totalPrice,
      special_notes: special_notes ? special_notes.trim() : null
    });

    res.status(201).json({
      message: `Added "${meal.name}" to cart!`,
      cart_item: newItem
    });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: err.message || 'Server error adding item to cart.' });
  }
});

// 3. Update quantity of item in cart
router.put('/items/:id', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const cart = await getOrCreateCart(user.id);
    const { quantity } = req.body;

    const item = await db.findOne('cart_items', { id: req.params.id, cart_id: cart.id });
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    const newQty = parseInt(quantity, 10);
    if (newQty <= 0) {
      await db.delete('cart_items', { id: item.id });
      // If cart empty, reset seller_id
      const remaining = await db.find('cart_items', { cart_id: cart.id });
      if (remaining.length === 0) {
        await db.update('carts', { id: cart.id }, { seller_id: null });
      }
      return res.json({ message: 'Item removed from cart.' });
    }

    const updatedTotal = Math.round(item.item_price * newQty * 100) / 100;
    await db.update('cart_items', { id: item.id }, {
      quantity: newQty,
      total_price: updatedTotal
    });

    res.json({ message: 'Cart updated successfully.' });
  } catch (err) {
    console.error('Update cart item error:', err);
    res.status(500).json({ error: 'Server error updating cart item.' });
  }
});

// 4. Delete item from cart
router.delete('/items/:id', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const cart = await getOrCreateCart(user.id);

    await db.delete('cart_items', { id: req.params.id, cart_id: cart.id });

    // If cart is now empty, clear seller_id
    const remaining = await db.find('cart_items', { cart_id: cart.id });
    if (remaining.length === 0) {
      await db.update('carts', { id: cart.id }, { seller_id: null });
    }

    res.json({ message: 'Item removed from cart.' });
  } catch (err) {
    console.error('Delete cart item error:', err);
    res.status(500).json({ error: 'Server error deleting cart item.' });
  }
});

// 5. Clear entire cart
router.delete('/clear', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const cart = await getOrCreateCart(user.id);

    await db.delete('cart_items', { cart_id: cart.id });
    await db.update('carts', { id: cart.id }, { seller_id: null });

    res.json({ message: 'Cart cleared successfully.' });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ error: 'Server error clearing cart.' });
  }
});

export default router;
