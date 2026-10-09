import express from 'express';
import { db } from '../db/db.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateCustomMeal } from './customMealRoutes.js';

const router = express.Router();

// Helper to get or create cart for user
async function getOrCreateCart(userId) {
  let cart = await db.findOne('carts', { user_id: userId });
  if (!cart) {
    const shortId = `c_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    cart = await db.insert('carts', {
      id: shortId,
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
      }
    }

    // Calculate exact price with customizations server-side
    const customResult = await calculateCustomMeal(meal.id, {
      ...customizations,
      portion,
      special_notes
    });

    const itemPrice = customResult.calculated_price;
    const qty = Math.max(1, parseInt(quantity, 10));
    const totalPrice = Math.round(itemPrice * qty * 100) / 100;

    // Set cart seller and item writes inside a transaction for complete rollback protection
    const txResult = await db.withTransaction(async (trx) => {
      // If user confirmed replacement of conflicting kitchen, clear previous cart items
      if (cart.seller_id && cart.seller_id !== meal.seller_id && replace_cart_if_conflict) {
        await trx.delete('cart_items', { cart_id: cart.id });
      }

      // Set cart seller
      await trx.update('carts', { id: cart.id }, { seller_id: meal.seller_id });

      // Check if identical item already exists in cart to prevent duplicate entries from repeated clicks
      const existingItems = await trx.find('cart_items', { cart_id: cart.id, meal_id: meal.id });
      const matchingItem = existingItems.find(i => {
        const matchPortion = (i.portion_selected || 'standard') === portion;
        const matchNotes = (i.special_notes || '') === (special_notes ? special_notes.trim() : '');
        const matchCustom = JSON.stringify(i.customizations?.selections || {}) === JSON.stringify(customizations || {});
        return matchPortion && matchNotes && matchCustom;
      });

      if (matchingItem) {
        const updatedQty = matchingItem.quantity + qty;
        const updatedTotal = Math.round(matchingItem.item_price * updatedQty * 100) / 100;
        await trx.update('cart_items', { id: matchingItem.id }, {
          quantity: updatedQty,
          total_price: updatedTotal
        });
        const updated = await trx.findOne('cart_items', { id: matchingItem.id });
        return {
          statusCode: 200,
          message: `Updated "${meal.name}" quantity to ${updatedQty}!`,
          cart_item: updated
        };
      }

      const shortItemId = `ci_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const newItem = await trx.insert('cart_items', {
        id: shortItemId,
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
        item_price: parseFloat(itemPrice),
        total_price: parseFloat(totalPrice),
        special_notes: special_notes ? special_notes.trim() : null
      });

      return {
        statusCode: 201,
        message: `Added "${meal.name}" to cart!`,
        cart_item: newItem
      };
    });

    res.status(txResult.statusCode).json({
      message: txResult.message,
      cart_item: txResult.cart_item
    });
  } catch (err) {
    console.error('[Cart Error] Add to cart failed:', {
      error: err.message,
      code: err.code,
      sqlState: err.sqlState,
      userId: req.user?.id,
      mealId: req.body?.meal_id
    });
    res.status(500).json({
      error: 'Unable to add item to your cart right now. Please try again.'
    });
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
    const result = await db.withTransaction(async (trx) => {
      if (newQty <= 0) {
        await trx.delete('cart_items', { id: item.id });
        const remaining = await trx.find('cart_items', { cart_id: cart.id });
        if (remaining.length === 0) {
          await trx.update('carts', { id: cart.id }, { seller_id: null });
        }
        return { deleted: true };
      }

      const updatedTotal = Math.round(item.item_price * newQty * 100) / 100;
      await trx.update('cart_items', { id: item.id }, {
        quantity: newQty,
        total_price: updatedTotal
      });
      const updated = await trx.findOne('cart_items', { id: item.id });
      return { updated };
    });

    if (result.deleted) {
      return res.json({ message: 'Item removed from cart.' });
    }
    res.json({ message: 'Cart updated successfully.', cart_item: result.updated });
  } catch (err) {
    console.error('[Cart Error] Update cart item failed:', {
      error: err.message,
      code: err.code,
      itemId: req.params?.id
    });
    res.status(500).json({ error: 'Server error updating cart item.' });
  }
});

// 4. Clear entire cart
router.delete(['/', '/clear'], requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const cart = await getOrCreateCart(user.id);

    await db.withTransaction(async (trx) => {
      await trx.delete('cart_items', { cart_id: cart.id });
      await trx.update('carts', { id: cart.id }, { seller_id: null });
    });

    res.json({ message: 'Cart cleared successfully.' });
  } catch (err) {
    console.error('[Cart Error] Clear cart failed:', {
      error: err.message,
      code: err.code,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Server error clearing cart.' });
  }
});

// 5. Delete item from cart (Verified customer ownership and variant safety)
router.delete(['/items/:id', '/:id'], requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const cart = await getOrCreateCart(user.id);
    const paramId = req.params.id;

    // 1. First look up by primary cart_item ID belonging to this user's cart
    let targetItem = await db.findOne('cart_items', { id: paramId, cart_id: cart.id });

    // 2. Fallback: If caller sent meal_id, look up items matching this meal in the cart
    if (!targetItem) {
      const matchingMealItems = await db.find('cart_items', { meal_id: paramId, cart_id: cart.id });
      if (matchingMealItems.length === 1) {
        // Unambiguous single variant for this meal
        targetItem = matchingMealItems[0];
      } else if (matchingMealItems.length > 1) {
        // Multiple customized variants exist! Do not delete all; require the specific cart item ID
        return res.status(400).json({
          error: 'Multiple variants of this meal exist in your cart. Please specify the exact variant ID to remove.'
        });
      }
    }

    if (!targetItem) {
      return res.status(404).json({ error: 'Cart item not found in your active cart.' });
    }

    // 3. Atomically remove ONLY this specific cart_item variant
    const deleteResult = await db.withTransaction(async (trx) => {
      await trx.delete('cart_items', { id: targetItem.id, cart_id: cart.id });
      const remaining = await trx.find('cart_items', { cart_id: cart.id });
      if (remaining.length === 0) {
        await trx.update('carts', { id: cart.id }, { seller_id: null });
      }
      const remainingSubtotal = remaining.reduce((sum, item) => sum + parseFloat(item.total_price || (item.item_price * item.quantity)), 0);
      return {
        remainingCount: remaining.reduce((sum, item) => sum + item.quantity, 0),
        remainingSubtotal: Math.round(remainingSubtotal * 100) / 100
      };
    });

    res.json({
      message: 'Item removed from cart.',
      removed_id: targetItem.id,
      meal_id: targetItem.meal_id,
      item_count: deleteResult.remainingCount,
      subtotal: deleteResult.remainingSubtotal
    });
  } catch (err) {
    console.error('[Cart Error] Delete cart item failed:', {
      error: err.message,
      code: err.code,
      itemId: req.params?.id,
      userId: req.user?.id
    });
    res.status(500).json({ error: 'Server error deleting cart item.' });
  }
});

export default router;
