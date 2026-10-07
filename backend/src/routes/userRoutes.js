import express from 'express';
import { db } from '../db/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// 1. Get user's saved delivery addresses
router.get('/addresses', async (req, res) => {
  try {
    const addresses = await db.find('addresses', { user_id: req.user.id });
    res.json(addresses);
  } catch (err) {
    console.error('Get addresses error:', err);
    res.status(500).json({ error: 'Server error retrieving addresses.' });
  }
});

// 2. Add new address
router.post('/addresses', async (req, res) => {
  try {
    const user = req.user;
    const {
      label = 'Home',
      recipient_name,
      phone,
      street_address,
      landmark,
      area = 'Indiranagar',
      city = 'Bengaluru',
      pincode = '560038',
      is_default = false,
      leave_at_doorstep = false,
      exchange_steel_dabba = false,
      delivery_instructions
    } = req.body;

    if (!recipient_name || !phone || !street_address) {
      return res.status(400).json({ error: 'Recipient name, phone, and street address are required.' });
    }

    if (is_default) {
      // Unmark other defaults
      await db.update('addresses', { user_id: user.id }, { is_default: false });
    }

    const newAddr = await db.insert('addresses', {
      id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: user.id,
      label,
      recipient_name: recipient_name.trim(),
      phone: phone.trim(),
      street_address: street_address.trim(),
      landmark: landmark ? landmark.trim() : null,
      area: area.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      is_default: Boolean(is_default),
      leave_at_doorstep: Boolean(leave_at_doorstep),
      exchange_steel_dabba: Boolean(exchange_steel_dabba),
      delivery_instructions: delivery_instructions ? delivery_instructions.trim() : null
    });

    res.status(201).json({ message: 'Address saved successfully.', address: newAddr });
  } catch (err) {
    console.error('Save address error:', err);
    res.status(500).json({ error: 'Server error saving address.' });
  }
});

// 3. Update customer profile & preferences
router.put('/profile', async (req, res) => {
  try {
    const user = req.user;
    const { full_name, phone, preferences } = req.body;

    if (full_name) {
      await db.update('users', { id: user.id }, { full_name: full_name.trim(), phone });
    }

    if (preferences && user.role === 'customer') {
      const profile = await db.findOne('customer_profiles', { user_id: user.id });
      if (profile) {
        await db.update('customer_preferences', { customer_id: profile.id }, preferences);
      }
    }

    const updatedUser = await db.findOne('users', { id: user.id });
    res.json({ message: 'Profile updated successfully.', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

export default router;
