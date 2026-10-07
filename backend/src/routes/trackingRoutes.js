import express from 'express';
import { db } from '../db/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. Get Live Tracking Details for an Order
router.get('/:order_id', requireAuth, async (req, res) => {
  try {
    const order = await db.findOne('orders', { id: req.params.order_id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const seller = await db.findOne('seller_profiles', { id: order.seller_id });
    const address = await db.findOne('addresses', { id: order.address_id });
    const events = await db.find('delivery_tracking_events', { order_id: order.id });
    events.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

    // Simulated / assigned delivery partner info
    const deliveryPartner = {
      name: 'Vikram Jadhav',
      phone: '+91 98765 43214',
      vehicle_number: 'KA-05-FB-4021',
      rating: 4.9,
      is_steel_dabba_carrier: true
    };

    res.json({
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      delivery_slot: order.delivery_slot,
      leave_at_doorstep: order.leave_at_doorstep,
      exchange_steel_dabba: order.exchange_steel_dabba,
      delivery_instructions: order.delivery_instructions,
      seller: seller ? { business_name: seller.business_name, area: seller.area } : null,
      address,
      delivery_partner: deliveryPartner,
      events,
      estimated_delivery_minutes: order.status === 'delivered' ? 0 : 25
    });
  } catch (err) {
    console.error('Get tracking error:', err);
    res.status(500).json({ error: 'Server error retrieving tracking details.' });
  }
});

// 2. Advance Milestone / Partner location simulation for live demo testing
router.post('/simulate-step', requireAuth, async (req, res) => {
  try {
    const { order_id } = req.body;
    const order = await db.findOne('orders', { id: order_id });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const milestones = ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'];
    const currentIndex = milestones.indexOf(order.status);
    if (currentIndex === -1 || currentIndex >= milestones.length - 1) {
      return res.json({ message: `Order is already in final state: ${order.status}`, status: order.status });
    }

    const nextStatus = milestones[currentIndex + 1];

    await db.update('orders', { id: order.id }, { status: nextStatus });

    const descriptions = {
      preparing: 'Chef started preparing your hot meal with selected customizations.',
      ready_for_pickup: 'Meal packed in thermal container and ready at kitchen counter.',
      out_for_delivery: 'Rider Vikram Jadhav has picked up your dabba and is heading to your address.',
      delivered: 'Order delivered fresh at your doorstep. Enjoy your meal!'
    };

    const newEvent = await db.insert('delivery_tracking_events', {
      id: `track_${Date.now()}`,
      order_id: order.id,
      event_status: nextStatus,
      title: `Order ${nextStatus.replace(/_/g, ' ').toUpperCase()}`,
      description: descriptions[nextStatus] || `Status updated to ${nextStatus}.`,
      latitude: 12.9716 + (currentIndex * 0.005),
      longitude: 77.5946 + (currentIndex * 0.005)
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order.id}`).emit('tracking_update', {
        order_id: order.id,
        status: nextStatus,
        event: newEvent
      });
    }

    res.json({
      message: `Simulated milestone advanced to ${nextStatus}.`,
      status: nextStatus,
      event: newEvent
    });
  } catch (err) {
    console.error('Simulate step error:', err);
    res.status(500).json({ error: 'Server error advancing milestone.' });
  }
});

export default router;
