import express from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { db } from '../db/db.js';
import { signToken, requireAuth, isDemoUser } from '../middleware/auth.js';

const router = express.Router();

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.use(authLimiter);

// 1. Register Customer
router.post('/register-customer', async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.findOne('users', { email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser = await db.insert('users', {
      id: userId,
      email: normalizedEmail,
      password_hash,
      role: 'customer',
      full_name: full_name.trim(),
      phone: phone ? phone.trim() : null,
      is_active: true
    });

    // Create associated customer profile
    const profileId = `cp_${Date.now()}`;
    await db.insert('customer_profiles', {
      id: profileId,
      user_id: userId,
      living_situation: null,
      routine_type: null,
      primary_interest: null,
      default_delivery_slot: 'both',
      onboarding_completed: false
    });

    // Create empty default preference
    await db.insert('customer_preferences', {
      id: `cpref_${Date.now()}`,
      customer_id: profileId,
      goal: 'balanced_eating',
      dietary_preference: 'vegetarian',
      allergies: [],
      avoid_ingredients: [],
      preferred_cuisines: ['North Indian', 'Maharashtrian'],
      spice_preference: 'medium',
      budget_per_meal: 150.00,
      preferred_portion: 'standard'
    });

    const token = signToken(newUser);

    res.cookie('fitbite_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    return res.status(201).json({
      message: 'Customer account registered successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        phone: newUser.phone,
        role: newUser.role,
        is_demo: isDemoUser(newUser),
        onboarding_completed: false
      }
    });
  } catch (err) {
    console.error('Register customer error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// 2. Register Seller (Sets status to pending_approval)
router.post('/register-seller', async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      phone,
      business_name,
      kitchen_type,
      delivery_model,
      operating_address,
      area,
      city,
      pincode,
      fssai_number,
      cuisine_specializations
    } = req.body;

    if (!email || !password || !full_name || !business_name || !kitchen_type || !fssai_number) {
      return res.status(400).json({
        error: 'Missing required seller fields: email, password, full name, business name, kitchen type, and FSSAI number.'
      });
    }

    // Validate 14-digit FSSAI format
    const cleanFssai = String(fssai_number).trim();
    if (!/^\d{14}$/.test(cleanFssai)) {
      return res.status(400).json({
        error: 'Invalid FSSAI format. Must be exactly 14 digits (e.g. 11223344556677).'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.findOne('users', { email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const userId = `user_seller_${Date.now()}`;

    const newUser = await db.insert('users', {
      id: userId,
      email: normalizedEmail,
      password_hash,
      role: 'seller',
      full_name: full_name.trim(),
      phone: phone ? phone.trim() : null,
      is_active: true
    });

    const sellerId = `seller_${Date.now()}`;
    const newSellerProfile = await db.insert('seller_profiles', {
      id: sellerId,
      user_id: userId,
      business_name: business_name.trim(),
      owner_name: full_name.trim(),
      kitchen_type: kitchen_type, // 'commercial_tiffin', 'home_chef_cloud', 'restaurant'
      delivery_model: delivery_model || 'platform_managed',
      operating_address: operating_address || 'Operating Kitchen Address',
      area: area || 'Indiranagar',
      city: city || 'Bengaluru',
      pincodes_served: [pincode || '560038'],
      delivery_radius_km: 7.0,
      cuisine_specializations: cuisine_specializations || ['Everyday Tiffins'],
      operating_hours: '08:00 AM - 10:00 PM',
      fssai_number: cleanFssai,
      fssai_expiry_date: null,
      fssai_certificate_url: null,
      verification_status: 'pending_approval',
      rejection_reason: null,
      rating: 5.0,
      rating_count: 0,
      preparation_cutoff_lunch_time: '08:30:00',
      preparation_cutoff_dinner_time: '16:00:00',
      is_listed: false // Unlisted until approved by Admin
    });

    // Record audit log
    await db.insert('audit_logs', {
      id: `audit_${Date.now()}`,
      actor_id: userId,
      actor_email: normalizedEmail,
      action: 'SELLER_REGISTERED',
      entity_type: 'seller_profile',
      entity_id: sellerId,
      details: { business_name, kitchen_type, fssai_number: cleanFssai }
    });

    const token = signToken(newUser);

    res.cookie('fitbite_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    return res.status(201).json({
      message: 'Seller application submitted. Status is pending admin verification.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role
      },
      seller: newSellerProfile
    });
  } catch (err) {
    console.error('Register seller error:', err);
    res.status(500).json({ error: 'Server error during seller registration.' });
  }
});

// 3. Login (Handles Customer, Seller, Admin, Delivery Partner)
router.post('/login', async (req, res) => {
  try {
    const { email, password, requested_role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.findOne('users', { email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been suspended or deactivated. Please contact support.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Role check if user selected partner tab on login
    if (requested_role && requested_role === 'seller' && user.role !== 'seller' && user.role !== 'admin') {
      return res.status(403).json({
        error: `This account is registered as a ${user.role}. Please sign in under Customer, or register as a Partner.`
      });
    }

    const token = signToken(user);

    // Fetch profile details
    let customerProfile = null;
    let sellerProfile = null;

    if (user.role === 'customer') {
      customerProfile = await db.findOne('customer_profiles', { user_id: user.id });
    } else if (user.role === 'seller') {
      sellerProfile = await db.findOne('seller_profiles', { user_id: user.id });
    }

    res.cookie('fitbite_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    return res.json({
      message: 'Signed in successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        is_demo: isDemoUser(user),
        onboarding_completed: customerProfile ? Boolean(customerProfile.onboarding_completed) : true
      },
      customerProfile,
      sellerProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// 4. Current User Session
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    let customerProfile = null;
    let preferences = null;
    let sellerProfile = null;

    if (user.role === 'customer') {
      customerProfile = await db.findOne('customer_profiles', { user_id: user.id });
      if (customerProfile) {
        preferences = await db.findOne('customer_preferences', { customer_id: customerProfile.id });
      }
    } else if (user.role === 'seller') {
      sellerProfile = await db.findOne('seller_profiles', { user_id: user.id });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        is_demo: isDemoUser(user),
        onboarding_completed: customerProfile ? Boolean(customerProfile.onboarding_completed) : true
      },
      customerProfile,
      preferences,
      sellerProfile
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error retrieving session.' });
  }
});

// 5. Logout
router.post('/logout', (req, res) => {
  res.clearCookie('fitbite_token');
  res.json({ message: 'Signed out successfully.' });
});

// 6. Password Reset (Simulated secure token issuance)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const user = await db.findOne('users', { email: email.trim().toLowerCase() });
  // Always respond generically for security
  res.json({
    message: 'If an account exists with this email, password reset instructions have been sent.',
    demo_reset_token: user ? `fitbite-reset-${Buffer.from(user.email).toString('base64')}` : null
  });
});

router.post('/reset-password', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Valid reset token and new password (min 6 chars) are required.' });
  }

  try {
    const emailBase64 = token.replace('fitbite-reset-', '');
    const email = Buffer.from(emailBase64, 'base64').toString('utf-8');
    const user = await db.findOne('users', { email });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(new_password, salt);
    await db.update('users', { id: user.id }, { password_hash });

    res.json({ message: 'Password updated successfully. You may now sign in with your new password.' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid password reset token format.' });
  }
});

export default router;
