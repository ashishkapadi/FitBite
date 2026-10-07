import express from 'express';
import { db } from '../db/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to calculate bill breakdown on backend
export async function calculateBill({ subtotal, couponCode, userOrderCount = 0 }) {
  let discountAmount = 0.00;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await db.findOne('coupons', { code: couponCode.trim().toUpperCase(), is_active: true });
    if (coupon) {
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = new Date(coupon.valid_until);

      if (now >= validFrom && now <= validUntil && subtotal >= parseFloat(coupon.min_order_amount)) {
        if (coupon.discount_type === 'percentage') {
          let calc = (subtotal * parseFloat(coupon.discount_value)) / 100;
          if (coupon.max_discount_cap && calc > parseFloat(coupon.max_discount_cap)) {
            calc = parseFloat(coupon.max_discount_cap);
          }
          discountAmount = calc;
        } else {
          discountAmount = Math.min(subtotal, parseFloat(coupon.discount_value));
        }
        appliedCoupon = coupon;
      }
    }
  }

  // Delivery fee logic: ₹35 flat, Free above ₹499
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const deliveryFee = discountedSubtotal >= 499.00 ? 0.00 : 35.00;

  // 5% GST on prepared food in India
  const taxAmount = Math.round(discountedSubtotal * 0.05 * 100) / 100;
  const grandTotal = Math.round((discountedSubtotal + deliveryFee + taxAmount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    coupon: appliedCoupon ? { code: appliedCoupon.code, description: appliedCoupon.description } : null,
    delivery_fee: deliveryFee,
    tax_amount: taxAmount,
    grand_total: grandTotal
  };
}

// 1. Calculate live order estimate
router.post('/calculate', requireAuth, async (req, res) => {
  try {
    const { subtotal = 0, coupon_code } = req.body;
    const bill = await calculateBill({
      subtotal: parseFloat(subtotal),
      couponCode: coupon_code
    });
    res.json(bill);
  } catch (err) {
    console.error('Calculate bill error:', err);
    res.status(500).json({ error: 'Error calculating bill total.' });
  }
});

// 2. Checkout Order
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const {
      address_id,
      payment_method, // 'demo_upi', 'demo_card', 'demo_netbanking', 'cash_on_delivery'
      coupon_code,
      delivery_slot,
      leave_at_doorstep = false,
      exchange_steel_dabba = false,
      delivery_instructions
    } = req.body;

    if (!address_id || !payment_method) {
      return res.status(400).json({ error: 'Delivery address and payment method are required.' });
    }

    const address = await db.findOne('addresses', { id: address_id, user_id: user.id });
    if (!address) {
      return res.status(400).json({ error: 'Selected delivery address does not exist.' });
    }

    const cart = await db.findOne('carts', { user_id: user.id });
    if (!cart || !cart.seller_id) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    const cartItems = await db.find('cart_items', { cart_id: cart.id });
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    const seller = await db.findOne('seller_profiles', { id: cart.seller_id });
    if (!seller || seller.verification_status !== 'approved' || !seller.is_listed) {
      return res.status(400).json({ error: 'Selected kitchen is currently not accepting orders.' });
    }

    // Compute backend subtotal
    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += parseFloat(item.total_price);
    }

    const bill = await calculateBill({ subtotal, couponCode: coupon_code });

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const orderNumber = `FB-${Math.floor(100000 + Math.random() * 900000)}`;

    const isCOD = payment_method === 'cash_on_delivery';
    const isPaid = !isCOD; // Demo payments marked paid upon checkout verification

    const newOrder = await db.insert('orders', {
      id: orderId,
      order_number: orderNumber,
      customer_id: user.id,
      seller_id: seller.id,
      address_id: address.id,
      order_type: 'instant_restaurant',
      status: 'confirmed',
      subtotal: bill.subtotal,
      customization_total: 0.00,
      discount_amount: bill.discount_amount,
      coupon_code: bill.coupon?.code || null,
      delivery_fee: bill.delivery_fee,
      tax_amount: bill.tax_amount,
      grand_total: bill.grand_total,
      payment_status: isPaid ? 'paid' : 'pending',
      payment_method: payment_method,
      payment_transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      delivery_slot: delivery_slot || 'Instant Delivery (30-40 mins)',
      leave_at_doorstep: Boolean(leave_at_doorstep),
      exchange_steel_dabba: Boolean(exchange_steel_dabba),
      delivery_instructions: delivery_instructions ? delivery_instructions.trim() : null
    });

    // Create immutable order item snapshots
    for (const item of cartItems) {
      const meal = await db.findOne('meals', { id: item.meal_id });
      await db.insert('order_items', {
        id: `oi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        order_id: orderId,
        meal_id: item.meal_id,
        meal_name_snapshot: meal ? meal.name : 'Custom Meal',
        meal_image_snapshot: meal ? meal.image_url : '',
        quantity: item.quantity,
        portion_snapshot: item.portion_selected || 'standard',
        unit_base_price: item.item_price,
        customizations_snapshot: item.customizations,
        unit_final_price: item.item_price,
        item_total_price: item.total_price,
        special_notes: item.special_notes
      });
    }

    // Create initial delivery tracking milestones
    await db.insert('delivery_tracking_events', {
      id: `track_${Date.now()}_1`,
      order_id: orderId,
      event_status: 'confirmed',
      title: 'Order Confirmed',
      description: `${seller.business_name} has accepted your order and sent it to the kitchen counter.`,
      latitude: 12.9716,
      longitude: 77.5946
    });

    // Clear cart items
    await db.delete('cart_items', { cart_id: cart.id });
    await db.update('carts', { id: cart.id }, { seller_id: null });

    // Emit live event via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(`seller_${seller.id}`).emit('new_order', { order: newOrder });
    }

    res.status(201).json({
      message: 'Order placed successfully!',
      order: newOrder
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Server error creating order.' });
  }
});

// 3. Get customer order history
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const orders = await db.find('orders', { customer_id: user.id });
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Enrich with seller and items
    const enriched = [];
    for (const order of orders) {
      const seller = await db.findOne('seller_profiles', { id: order.seller_id });
      const items = await db.find('order_items', { order_id: order.id });
      enriched.push({
        ...order,
        seller: seller ? {
          id: seller.id,
          business_name: seller.business_name,
          area: seller.area
        } : null,
        items
      });
    }

    res.json(enriched);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Server error retrieving orders.' });
  }
});

// 4. Get order details by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const order = await db.findOne('orders', { id: req.params.id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Role ownership check
    if (user.role === 'customer' && order.customer_id !== user.id) {
      return res.status(403).json({ error: 'Access denied to this order.' });
    }
    if (user.role === 'seller') {
      const seller = await db.findOne('seller_profiles', { user_id: user.id });
      if (!seller || order.seller_id !== seller.id) {
        return res.status(403).json({ error: 'Access denied to this order.' });
      }
    }

    const seller = await db.findOne('seller_profiles', { id: order.seller_id });
    const address = await db.findOne('addresses', { id: order.address_id });
    const items = await db.find('order_items', { order_id: order.id });
    const trackingEvents = await db.find('delivery_tracking_events', { order_id: order.id });
    trackingEvents.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

    const review = await db.findOne('reviews', { order_id: order.id });

    res.json({
      order,
      seller,
      address,
      items,
      tracking_events: trackingEvents,
      review
    });
  } catch (err) {
    console.error('Get order details error:', err);
    res.status(500).json({ error: 'Server error retrieving order details.' });
  }
});

// 5. Cancel order (eligible only before food prep starts)
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { reason } = req.body;
    const order = await db.findOne('orders', { id: req.params.id, customer_id: user.id });

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (order.status !== 'confirmed') {
      return res.status(400).json({
        error: `Cancellation not permitted. Order is already in status "${order.status}". Meals can only be cancelled while in "confirmed" state before preparation begins.`
      });
    }

    await db.update('orders', { id: order.id }, {
      status: 'cancelled',
      cancellation_reason: reason || 'Cancelled by customer',
      payment_status: order.payment_status === 'paid' ? 'refunded' : 'cancelled'
    });

    await db.insert('delivery_tracking_events', {
      id: `track_${Date.now()}_cancel`,
      order_id: order.id,
      event_status: 'cancelled',
      title: 'Order Cancelled',
      description: `Order was cancelled. Reason: ${reason || 'Customer request'}.`
    });

    res.json({ message: 'Order has been cancelled successfully.' });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ error: 'Server error cancelling order.' });
  }
});

// 6. Review order
router.post('/:id/review', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { rating, comment } = req.body;
    const order = await db.findOne('orders', { id: req.params.id, customer_id: user.id });

    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed, delivered orders.' });
    }

    const existingReview = await db.findOne('reviews', { order_id: order.id });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this order.' });
    }

    const cleanRating = Math.max(1, Math.min(5, parseInt(rating, 10)));
    const review = await db.insert('reviews', {
      id: `rev_${Date.now()}`,
      order_id: order.id,
      customer_id: user.id,
      seller_id: order.seller_id,
      rating: cleanRating,
      comment: comment ? comment.trim() : null
    });

    res.status(201).json({ message: 'Review submitted. Thank you for your feedback!', review });
  } catch (err) {
    console.error('Review order error:', err);
    res.status(500).json({ error: 'Server error submitting review.' });
  }
});

export default router;
