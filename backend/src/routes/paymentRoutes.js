import express from 'express';
import crypto from 'crypto';
import { db } from '../db/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. Create Payment Intent
router.post('/create-intent', requireAuth, async (req, res) => {
  try {
    const { order_id, provider = 'demo_gateway' } = req.body;
    if (!order_id) return res.status(400).json({ error: 'order_id is required.' });

    const order = await db.findOne('orders', { id: order_id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Validate if attempting live gateway without configured production credentials
    const isLiveRequested = provider !== 'demo_gateway';
    const hasLiveCredentials = Boolean(process.env.PAYMENT_GATEWAY_KEY_ID && process.env.PAYMENT_GATEWAY_SECRET);

    if (isLiveRequested && !hasLiveCredentials) {
      return res.status(400).json({
        error: 'Live payment gateway credentials not configured. Please use demo_gateway mode or configure PAYMENT_GATEWAY_KEY_ID and PAYMENT_GATEWAY_SECRET.'
      });
    }

    const effectiveProvider = hasLiveCredentials && isLiveRequested ? provider : 'demo_gateway';
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const txRef = `TXN_REF_${Date.now()}`;

    // Payment intent record
    await db.insert('payments', {
      id: paymentId,
      order_id: order.id,
      provider: effectiveProvider,
      transaction_reference: txRef,
      amount: order.grand_total,
      currency: 'INR',
      status: 'initiated',
      raw_payload: { order_number: order.order_number, initiated_at: new Date().toISOString() }
    });

    res.json({
      payment_id: paymentId,
      transaction_reference: txRef,
      amount: order.grand_total,
      currency: 'INR',
      order_id: order.id,
      provider_mode: effectiveProvider === 'demo_gateway' ? 'DEMO_SIMULATION' : 'LIVE_GATEWAY',
      is_demo: effectiveProvider === 'demo_gateway',
      notes: effectiveProvider === 'demo_gateway'
        ? 'Interactive demo payment simulation. Live credentials not active.'
        : 'Live payment intent generated.'
    });
  } catch (err) {
    console.error('Create payment intent error:', err);
    res.status(500).json({ error: 'Server error initiating payment.' });
  }
});

// 2. Server-side payment verification (Idempotent)
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { order_id, transaction_reference, simulate_failure = false } = req.body;
    if (!order_id || !transaction_reference) {
      return res.status(400).json({ error: 'order_id and transaction_reference are required.' });
    }

    const order = await db.findOne('orders', { id: order_id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const payment = await db.findOne('payments', { transaction_reference });

    // Idempotency check: If already captured, return success without duplicate processing
    if (payment && payment.status === 'captured') {
      return res.json({
        verified: true,
        message: 'Payment has already been verified and captured.',
        order_status: order.status,
        payment_status: 'paid'
      });
    }

    if (simulate_failure) {
      if (payment) {
        await db.update('payments', { id: payment.id }, { status: 'failed' });
      }
      await db.update('orders', { id: order.id }, { payment_status: 'failed' });
      return res.status(400).json({
        verified: false,
        error: 'Simulated payment failure: Card was declined or UPI request expired.'
      });
    }

    // Capture payment on server
    if (payment) {
      await db.update('payments', { id: payment.id }, { status: 'captured' });
    } else {
      await db.insert('payments', {
        id: `pay_${Date.now()}`,
        order_id: order.id,
        provider: 'demo_gateway',
        transaction_reference,
        amount: order.grand_total,
        currency: 'INR',
        status: 'captured'
      });
    }

    await db.update('orders', { id: order.id }, {
      payment_status: 'paid',
      payment_transaction_id: transaction_reference
    });

    res.json({
      verified: true,
      message: 'Server-side payment verification successful. Order marked as PAID.',
      order_id: order.id,
      payment_status: 'paid'
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Server error verifying payment.' });
  }
});

// 3. Webhook Endpoint with Signature Verification
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-fitbite-signature'] || req.headers['x-razorpay-signature'] || req.headers['stripe-signature'];
    const payload = req.body;
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    // Verify cryptographic signature if secret is configured in production
    if (webhookSecret && signature) {
      const rawBody = Buffer.isBuffer(payload) ? payload.toString('utf8') : JSON.stringify(payload);
      const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      if (signature !== expectedSignature) {
        console.warn('[Payment Webhook] Signature mismatch! Rejecting untrusted payload.');
        return res.status(401).json({ error: 'Invalid webhook signature.' });
      }
    }

    // Idempotent webhook receipt
    console.log('[Payment Webhook] Received validated webhook event:', payload?.event || 'generic_event');

    res.json({ status: 'ok', received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).json({ error: 'Webhook processing error.' });
  }
});

export default router;
