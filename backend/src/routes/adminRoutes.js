import express from 'express';
import { db } from '../db/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin'));

// 1. Platform Metrics & Revenue Overview
router.get('/metrics', async (req, res) => {
  try {
    const users = await db.find('users');
    const sellers = await db.find('seller_profiles');
    const orders = await db.find('orders');
    const subscriptions = await db.find('subscriptions');

    const pendingSellers = sellers.filter(s => s.verification_status === 'pending_approval');
    const approvedSellers = sellers.filter(s => s.verification_status === 'approved');

    const completedOrders = orders.filter(o => o.status === 'delivered');
    const orderGMV = completedOrders.reduce((sum, o) => sum + parseFloat(o.grand_total || 0), 0);
    const subGMV = subscriptions.reduce((sum, s) => sum + parseFloat(s.grand_total || 0), 0);

    res.json({
      total_users_count: users.length,
      customer_count: users.filter(u => u.role === 'customer').length,
      seller_count: sellers.length,
      pending_verification_sellers: pendingSellers.length,
      approved_sellers_count: approvedSellers.length,
      total_orders_count: orders.length,
      active_subscriptions_count: subscriptions.filter(s => s.status === 'active').length,
      platform_gross_merchandise_value_inr: Math.round((orderGMV + subGMV) * 100) / 100
    });
  } catch (err) {
    console.error('Admin metrics error:', err);
    res.status(500).json({ error: 'Server error retrieving admin metrics.' });
  }
});

// 2. Seller Verification Desk (Review pending, approved, rejected, suspended sellers)
router.get('/sellers', async (req, res) => {
  try {
    const { status } = req.query;
    let sellers = await db.find('seller_profiles');
    if (status) {
      sellers = sellers.filter(s => s.verification_status === status);
    }
    res.json(sellers);
  } catch (err) {
    console.error('Admin get sellers error:', err);
    res.status(500).json({ error: 'Server error retrieving sellers.' });
  }
});

// 3. Update Seller Verification Status (Approve, Reject with reason, Suspend, Reactivate)
router.post('/sellers/:id/verify', async (req, res) => {
  try {
    const { action, rejection_reason } = req.body;
    // action: 'approve' | 'reject' | 'suspend' | 'reactivate'

    const seller = await db.findOne('seller_profiles', { id: req.params.id });
    if (!seller) return res.status(404).json({ error: 'Seller profile not found.' });

    let newStatus = seller.verification_status;
    let isListed = seller.is_listed;
    let reason = seller.rejection_reason;

    if (action === 'approve') {
      newStatus = 'approved';
      isListed = true;
      reason = null;
    } else if (action === 'reject') {
      newStatus = 'rejected';
      isListed = false;
      reason = rejection_reason || 'Incomplete compliance documentation or FSSAI verification failure.';
    } else if (action === 'suspend') {
      newStatus = 'suspended';
      isListed = false;
      reason = rejection_reason || 'Compliance suspension.';
    } else if (action === 'reactivate') {
      newStatus = 'approved';
      isListed = true;
      reason = null;
    } else {
      return res.status(400).json({ error: 'Invalid action. Must be approve, reject, suspend, or reactivate.' });
    }

    await db.update('seller_profiles', { id: seller.id }, {
      verification_status: newStatus,
      is_listed: isListed,
      rejection_reason: reason
    });

    // Record audit log
    await db.insert('audit_logs', {
      id: `audit_${Date.now()}`,
      actor_id: req.user.id,
      actor_email: req.user.email,
      action: `SELLER_STATUS_${action.toUpperCase()}`,
      entity_type: 'seller_profile',
      entity_id: seller.id,
      details: {
        business_name: seller.business_name,
        previous_status: seller.verification_status,
        new_status: newStatus,
        reason
      }
    });

    res.json({
      message: `Seller "${seller.business_name}" status updated to ${newStatus}.`,
      seller_id: seller.id,
      status: newStatus,
      is_listed: isListed
    });
  } catch (err) {
    console.error('Verify seller error:', err);
    res.status(500).json({ error: 'Server error updating seller verification.' });
  }
});

// 4. User Management
router.get('/users', async (req, res) => {
  try {
    const users = await db.find('users');
    const safeUsers = users.map(u => {
      const { password_hash, ...safe } = u;
      return safe;
    });
    res.json(safeUsers);
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ error: 'Server error retrieving users.' });
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    const { is_active } = req.body;
    const targetUser = await db.findOne('users', { id: req.params.id });
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    // Protect super admin from deactivation
    if (targetUser.email === 'admin@fitbite.demo' && !is_active) {
      return res.status(400).json({ error: 'The primary system admin account cannot be deactivated.' });
    }

    await db.update('users', { id: targetUser.id }, { is_active: Boolean(is_active) });

    await db.insert('audit_logs', {
      id: `audit_${Date.now()}`,
      actor_id: req.user.id,
      actor_email: req.user.email,
      action: is_active ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
      entity_type: 'user',
      entity_id: targetUser.id,
      details: { target_email: targetUser.email, is_active }
    });

    res.json({ message: `User account ${is_active ? 'activated' : 'suspended'}.` });
  } catch (err) {
    console.error('Update user status error:', err);
    res.status(500).json({ error: 'Server error updating user status.' });
  }
});

// 5. Order & Refund Oversight
router.get('/orders', async (req, res) => {
  try {
    const orders = await db.find('orders');
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(orders);
  } catch (err) {
    console.error('Admin get orders error:', err);
    res.status(500).json({ error: 'Server error retrieving orders.' });
  }
});

router.post('/orders/:id/refund', async (req, res) => {
  try {
    const { reason, amount } = req.body;
    const order = await db.findOne('orders', { id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const refundAmount = amount ? parseFloat(amount) : parseFloat(order.grand_total);

    const refundId = `ref_${Date.now()}`;
    await db.insert('refunds', {
      id: refundId,
      payment_id: order.payment_transaction_id || `pay_${order.id}`,
      order_id: order.id,
      refund_amount: refundAmount,
      reason: reason || 'Admin initiated customer refund',
      status: 'completed',
      processed_by: req.user.id
    });

    await db.update('orders', { id: order.id }, { payment_status: 'refunded' });

    await db.insert('audit_logs', {
      id: `audit_${Date.now()}`,
      actor_id: req.user.id,
      actor_email: req.user.email,
      action: 'ORDER_REFUND_ISSUED',
      entity_type: 'order',
      entity_id: order.id,
      details: { refund_amount: refundAmount, reason }
    });

    res.json({ message: `Refund of ₹${refundAmount} processed for order #${order.order_number}.`, refund_id: refundId });
  } catch (err) {
    console.error('Admin refund error:', err);
    res.status(500).json({ error: 'Server error processing refund.' });
  }
});

// 6. Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db.find('audit_logs');
    logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(logs.slice(0, 100));
  } catch (err) {
    console.error('Admin audit logs error:', err);
    res.status(500).json({ error: 'Server error retrieving audit logs.' });
  }
});

// 7. Coupons Management
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await db.find('coupons');
    res.json(coupons);
  } catch (err) {
    console.error('Admin get coupons error:', err);
    res.status(500).json({ error: 'Server error retrieving coupons.' });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const { code, description, discount_type, discount_value, max_discount_cap, min_order_amount } = req.body;
    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ error: 'Code, discount type, and value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await db.findOne('coupons', { code: cleanCode });
    if (existing) {
      return res.status(409).json({ error: 'Coupon code already exists.' });
    }

    const newCoupon = await db.insert('coupons', {
      id: `cpn_${Date.now()}`,
      code: cleanCode,
      description: description ? description.trim() : 'Special FitBite discount coupon',
      discount_type,
      discount_value: parseFloat(discount_value),
      max_discount_cap: max_discount_cap ? parseFloat(max_discount_cap) : null,
      min_order_amount: min_order_amount ? parseFloat(min_order_amount) : 0.0,
      valid_from: '2026-01-01 00:00:00',
      valid_until: '2026-12-31 23:59:59',
      usage_limit_total: 1000,
      usage_limit_per_user: 3,
      is_active: true
    });

    res.status(201).json({ message: 'Coupon created successfully.', coupon: newCoupon });
  } catch (err) {
    console.error('Admin create coupon error:', err);
    res.status(500).json({ error: 'Server error creating coupon.' });
  }
});

export default router;
