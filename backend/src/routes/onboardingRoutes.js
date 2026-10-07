import express from 'express';
import { db } from '../db/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. Get current onboarding state
router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'customer') {
      return res.json({ onboarding_completed: true, role: user.role });
    }

    let profile = await db.findOne('customer_profiles', { user_id: user.id });
    if (!profile) {
      profile = await db.insert('customer_profiles', {
        id: `cp_${Date.now()}`,
        user_id: user.id,
        living_situation: null,
        routine_type: null,
        primary_interest: null,
        default_delivery_slot: 'both',
        onboarding_completed: false
      });
    }

    let preferences = await db.findOne('customer_preferences', { customer_id: profile.id });

    return res.json({
      onboarding_completed: Boolean(profile.onboarding_completed),
      profile,
      preferences
    });
  } catch (err) {
    console.error('Onboarding status error:', err);
    res.status(500).json({ error: 'Server error retrieving onboarding state.' });
  }
});

// 2. Save partial progress
router.post(['/save-step', '/step'], requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const {
      living_situation,
      routine_type,
      primary_interest,
      default_delivery_slot,
      preferences
    } = req.body;

    let profile = await db.findOne('customer_profiles', { user_id: user.id });
    if (!profile) {
      profile = await db.insert('customer_profiles', {
        id: `cp_${Date.now()}`,
        user_id: user.id,
        living_situation,
        routine_type,
        primary_interest,
        default_delivery_slot: default_delivery_slot || 'both',
        onboarding_completed: false
      });
    } else {
      const profileUpdates = {};
      if (living_situation !== undefined) profileUpdates.living_situation = living_situation;
      if (routine_type !== undefined) profileUpdates.routine_type = routine_type;
      if (primary_interest !== undefined) profileUpdates.primary_interest = primary_interest;
      if (default_delivery_slot !== undefined) profileUpdates.default_delivery_slot = default_delivery_slot;

      await db.update('customer_profiles', { id: profile.id }, profileUpdates);
    }

    if (preferences) {
      let prefRecord = await db.findOne('customer_preferences', { customer_id: profile.id });
      if (!prefRecord) {
        await db.insert('customer_preferences', {
          id: `cpref_${Date.now()}`,
          customer_id: profile.id,
          ...preferences
        });
      } else {
        await db.update('customer_preferences', { customer_id: profile.id }, preferences);
      }
    }

    const updatedProfile = await db.findOne('customer_profiles', { id: profile.id });
    const updatedPrefs = await db.findOne('customer_preferences', { customer_id: profile.id });

    return res.json({
      message: 'Onboarding step progress saved successfully.',
      profile: updatedProfile,
      preferences: updatedPrefs
    });
  } catch (err) {
    console.error('Save onboarding step error:', err);
    res.status(500).json({ error: 'Server error saving onboarding step.' });
  }
});

// 3. Complete onboarding
router.post('/complete', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const {
      living_situation,
      routine_type,
      primary_interest,
      default_delivery_slot,
      preferences
    } = req.body;

    let profile = await db.findOne('customer_profiles', { user_id: user.id });
    if (!profile) {
      profile = await db.insert('customer_profiles', {
        id: `cp_${Date.now()}`,
        user_id: user.id,
        living_situation: living_situation || 'solo_bachelor',
        routine_type: routine_type || 'wellness_focused',
        primary_interest: primary_interest || 'tiffin_subscriptions',
        default_delivery_slot: default_delivery_slot || 'both',
        onboarding_completed: true
      });
    } else {
      await db.update('customer_profiles', { id: profile.id }, {
        living_situation: living_situation || profile.living_situation || 'solo_bachelor',
        routine_type: routine_type || profile.routine_type || 'wellness_focused',
        primary_interest: primary_interest || profile.primary_interest || 'tiffin_subscriptions',
        default_delivery_slot: default_delivery_slot || profile.default_delivery_slot || 'both',
        onboarding_completed: true
      });
    }

    if (preferences) {
      let prefRecord = await db.findOne('customer_preferences', { customer_id: profile.id });
      if (!prefRecord) {
        await db.insert('customer_preferences', {
          id: `cpref_${Date.now()}`,
          customer_id: profile.id,
          ...preferences
        });
      } else {
        await db.update('customer_preferences', { customer_id: profile.id }, preferences);
      }
    }

    const finalProfile = await db.findOne('customer_profiles', { id: profile.id });
    const finalPrefs = await db.findOne('customer_preferences', { customer_id: profile.id });

    return res.json({
      message: 'Onboarding completed successfully!',
      onboarding_completed: true,
      profile: finalProfile,
      preferences: finalPrefs
    });
  } catch (err) {
    console.error('Complete onboarding error:', err);
    res.status(500).json({ error: 'Server error completing onboarding.' });
  }
});

export default router;
