/**
 * FitBite Hardcoded Offline & Demo Authentication Fallback
 * 
 * Provides instant, zero-latency authentication without requiring external API keys
 * or a live remote backend server. Unlocks the main platform systems immediately.
 */

export const HARDCODED_DEMO_ACCOUNTS = {
  // 1. Solo Bachelor Customer (Rahul Sharma)
  'rahul@fitbite.demo': {
    user: {
      id: 'user_cust_01',
      email: 'rahul@fitbite.demo',
      role: 'customer',
      full_name: 'Rahul Sharma',
      phone: '+91 98765 43210',
      is_active: true,
      is_demo: true,
      onboarding_completed: true
    },
    customerProfile: {
      id: 'cp_01',
      user_id: 'user_cust_01',
      living_situation: 'solo_bachelor',
      routine_type: 'wellness_focused',
      primary_interest: 'tiffin_subscriptions',
      default_delivery_slot: 'both',
      onboarding_completed: true
    },
    sellerProfile: null,
    preferences: {
      id: 'cpref_01',
      customer_id: 'cp_01',
      caloric_target: 2200,
      dietary_preference: 'Vegetarian',
      allergens: [],
      preferred_cuisines: ['North Indian', 'Maharashtrian'],
      spice_preference: 'medium',
      budget_per_meal: 150
    },
    token: 'fitbite_demo_token_customer_rahul'
  },
  'customer@fitbite.demo': {
    user: {
      id: 'user_cust_01',
      email: 'customer@fitbite.demo',
      role: 'customer',
      full_name: 'Rahul Sharma',
      phone: '+91 98765 43210',
      is_active: true,
      is_demo: true,
      onboarding_completed: true
    },
    customerProfile: {
      id: 'cp_01',
      user_id: 'user_cust_01',
      living_situation: 'solo_bachelor',
      routine_type: 'wellness_focused',
      primary_interest: 'tiffin_subscriptions',
      default_delivery_slot: 'both',
      onboarding_completed: true
    },
    sellerProfile: null,
    preferences: {
      id: 'cpref_01',
      customer_id: 'cp_01',
      caloric_target: 2200,
      dietary_preference: 'Vegetarian',
      allergens: [],
      preferred_cuisines: ['North Indian', 'Maharashtrian'],
      spice_preference: 'medium',
      budget_per_meal: 150
    },
    token: 'fitbite_demo_token_customer_rahul'
  },

  // 2. Family Customer (Pooja & Aniket Kulkarni)
  'family@fitbite.demo': {
    user: {
      id: 'user_cust_family',
      email: 'family@fitbite.demo',
      role: 'customer',
      full_name: 'Pooja & Aniket Kulkarni',
      phone: '+91 98765 43211',
      is_active: true,
      is_demo: true,
      onboarding_completed: true
    },
    customerProfile: {
      id: 'cp_family',
      user_id: 'user_cust_family',
      living_situation: 'family',
      routine_type: 'chill_convenient',
      primary_interest: 'regular_meals',
      default_delivery_slot: 'dinner',
      onboarding_completed: true
    },
    sellerProfile: null,
    preferences: {
      id: 'cpref_family',
      customer_id: 'cp_family',
      caloric_target: 2500,
      dietary_preference: 'Vegetarian',
      allergens: [],
      preferred_cuisines: ['North Indian', 'Maharashtrian', 'Family Combos'],
      spice_preference: 'mild',
      budget_per_meal: 250
    },
    token: 'fitbite_demo_token_customer_family'
  },

  // 3. Tiffin Seller (Annapurna Homestyle Tiffin Ghar)
  'seller@fitbite.demo': {
    user: {
      id: 'user_sell_01',
      email: 'seller@fitbite.demo',
      role: 'seller',
      full_name: 'Savitri Bai Deshmukh',
      phone: '+91 98765 43212',
      is_active: true,
      is_demo: true,
      onboarding_completed: true
    },
    customerProfile: null,
    sellerProfile: {
      id: 'seller_01',
      user_id: 'user_sell_01',
      business_name: 'Annapurna Homestyle Tiffin Ghar',
      owner_name: 'Savitri Bai Deshmukh',
      kitchen_type: 'commercial_tiffin',
      delivery_model: 'fixed_route_batch',
      operating_address: '24/1, 2nd Main, HAL 2nd Stage, Indiranagar',
      area: 'Indiranagar',
      city: 'Bengaluru',
      pincodes_served: ['560038', '560008', '560075', '560001'],
      delivery_radius_km: 8.0,
      cuisine_specializations: ['Everyday Tiffins', 'North Indian', 'Maharashtrian'],
      fssai_number: '11223344556677',
      verification_status: 'approved',
      is_listed: true,
      rating: 4.85,
      rating_count: 240
    },
    preferences: null,
    token: 'fitbite_demo_token_seller_tiffin'
  },
  'seller.tiffin@fitbite.demo': {
    user: {
      id: 'user_sell_01',
      email: 'seller.tiffin@fitbite.demo',
      role: 'seller',
      full_name: 'Savitri Bai Deshmukh',
      phone: '+91 98765 43212',
      is_active: true,
      is_demo: true,
      onboarding_completed: true
    },
    customerProfile: null,
    sellerProfile: {
      id: 'seller_01',
      user_id: 'user_sell_01',
      business_name: 'Annapurna Homestyle Tiffin Ghar',
      owner_name: 'Savitri Bai Deshmukh',
      kitchen_type: 'commercial_tiffin',
      delivery_model: 'fixed_route_batch',
      operating_address: '24/1, 2nd Main, HAL 2nd Stage, Indiranagar',
      area: 'Indiranagar',
      city: 'Bengaluru',
      pincodes_served: ['560038', '560008', '560075', '560001'],
      delivery_radius_km: 8.0,
      cuisine_specializations: ['Everyday Tiffins', 'North Indian', 'Maharashtrian'],
      fssai_number: '11223344556677',
      verification_status: 'approved',
      is_listed: true,
      rating: 4.85,
      rating_count: 240
    },
    preferences: null,
    token: 'fitbite_demo_token_seller_tiffin'
  },

  // 4. Cloud Kitchen (The Protein Kitchen)
  'kitchen@fitbite.demo': {
    user: {
      id: 'user_sell_02',
      email: 'kitchen@fitbite.demo',
      role: 'seller',
      full_name: 'Chef Harpreet Singh',
      phone: '+91 98765 43213',
      is_active: true,
      is_demo: true,
      onboarding_completed: true
    },
    customerProfile: null,
    sellerProfile: {
      id: 'seller_02',
      user_id: 'user_sell_02',
      business_name: 'The Protein Kitchen',
      owner_name: 'Chef Harpreet Singh',
      kitchen_type: 'cloud_kitchen',
      delivery_model: 'on_demand_point_to_point',
      operating_address: '102, 5th Block, Koramangala',
      area: 'Koramangala',
      city: 'Bengaluru',
      pincodes_served: ['560095', '560034', '560047', '560068'],
      delivery_radius_km: 10.0,
      cuisine_specializations: ['High-Protein Bowls', 'Salads', 'Keto Meals'],
      fssai_number: '22334455667788',
      verification_status: 'approved',
      is_listed: true,
      rating: 4.90,
      rating_count: 310
    },
    preferences: null,
    token: 'fitbite_demo_token_seller_kitchen'
  },
  'seller.kitchen@fitbite.demo': {
    user: {
      id: 'user_sell_02',
      email: 'seller.kitchen@fitbite.demo',
      role: 'seller',
      full_name: 'Chef Harpreet Singh',
      phone: '+91 98765 43213',
      is_active: true,
      is_demo: true,
      onboarding_completed: true
    },
    customerProfile: null,
    sellerProfile: {
      id: 'seller_02',
      user_id: 'user_sell_02',
      business_name: 'The Protein Kitchen',
      owner_name: 'Chef Harpreet Singh',
      kitchen_type: 'cloud_kitchen',
      delivery_model: 'on_demand_point_to_point',
      operating_address: '102, 5th Block, Koramangala',
      area: 'Koramangala',
      city: 'Bengaluru',
      pincodes_served: ['560095', '560034', '560047', '560068'],
      delivery_radius_km: 10.0,
      cuisine_specializations: ['High-Protein Bowls', 'Salads', 'Keto Meals'],
      fssai_number: '22334455667788',
      verification_status: 'approved',
      is_listed: true,
      rating: 4.90,
      rating_count: 310
    },
    preferences: null,
    token: 'fitbite_demo_token_seller_kitchen'
  },

  // 5. Platform Admin (Compliance & Operations Desk)
  'admin@fitbite.demo': {
    user: {
      id: 'user_admin_01',
      email: 'admin@fitbite.demo',
      role: 'admin',
      full_name: 'FitBite Platform Compliance',
      phone: '+91 80000 12345',
      is_active: true,
      is_demo: true,
      onboarding_completed: true
    },
    customerProfile: null,
    sellerProfile: null,
    preferences: null,
    token: 'fitbite_demo_token_admin'
  },

  // 6. Delivery Partner (Vikram Jadhav)
  'delivery@fitbite.demo': {
    user: {
      id: 'user_deliv_01',
      email: 'delivery@fitbite.demo',
      role: 'delivery_partner',
      full_name: 'Vikram Jadhav',
      phone: '+91 98765 43214',
      is_active: true,
      is_demo: true,
      onboarding_completed: true
    },
    customerProfile: null,
    sellerProfile: null,
    preferences: null,
    token: 'fitbite_demo_token_delivery'
  }
};

/**
 * Returns a complete, valid authentication payload for any given email / role.
 * If the email matches a seeded demo account, returns their official profile.
 * Otherwise, synthesizes a functional offline profile based on the requested role.
 */
export function getFallbackAuthSession(email = '', requestedRole = 'customer') {
  const normEmail = (email || '').trim().toLowerCase();
  if (HARDCODED_DEMO_ACCOUNTS[normEmail]) {
    return JSON.parse(JSON.stringify(HARDCODED_DEMO_ACCOUNTS[normEmail]));
  }

  // Derive a friendly display name from the email
  const namePart = normEmail.split('@')[0] || 'User';
  const cleanName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, ' ');

  const userId = `user_${Date.now()}`;
  const effectiveRole = requestedRole === 'seller' ? 'seller' : (requestedRole === 'admin' ? 'admin' : 'customer');

  const session = {
    user: {
      id: userId,
      email: normEmail || `user_${Date.now()}@fitbite.local`,
      role: effectiveRole,
      full_name: cleanName,
      phone: '+91 98765 00000',
      is_active: true,
      is_demo: true,
      onboarding_completed: true
    },
    customerProfile: effectiveRole === 'customer' ? {
      id: `cp_${Date.now()}`,
      user_id: userId,
      living_situation: 'solo_bachelor',
      routine_type: 'wellness_focused',
      primary_interest: 'tiffin_subscriptions',
      default_delivery_slot: 'both',
      onboarding_completed: true
    } : null,
    sellerProfile: effectiveRole === 'seller' ? {
      id: `seller_${Date.now()}`,
      user_id: userId,
      business_name: `${cleanName}'s Kitchen`,
      owner_name: cleanName,
      kitchen_type: 'commercial_tiffin',
      delivery_model: 'fixed_route_batch',
      operating_address: '12/4 MG Road, Bengaluru',
      area: 'Indiranagar',
      city: 'Bengaluru',
      pincodes_served: ['560038', '560008'],
      delivery_radius_km: 8.0,
      fssai_number: '12345678901234',
      verification_status: 'approved',
      is_listed: true,
      rating: 4.8,
      rating_count: 50
    } : null,
    preferences: effectiveRole === 'customer' ? {
      caloric_target: 2100,
      dietary_preference: 'Vegetarian',
      allergens: [],
      preferred_cuisines: ['North Indian', 'Balanced Bowls'],
      spice_preference: 'medium',
      budget_per_meal: 160
    } : null,
    token: `fitbite_fallback_token_${userId}`
  };

  return session;
}

/**
 * Persists fallback authentication state in browser localStorage
 */
export function saveAuthSessionToStorage(sessionData) {
  if (typeof window === 'undefined') return;
  if (!sessionData) return;
  if (sessionData.token) {
    localStorage.setItem('fitbite_token', sessionData.token);
  }
  localStorage.setItem('fitbite_cached_session', JSON.stringify(sessionData));
}

/**
 * Retrieves persisted authentication state from browser localStorage
 */
export function getStoredAuthSession() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('fitbite_cached_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Clears stored authentication session
 */
export function clearStoredAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('fitbite_token');
  localStorage.removeItem('fitbite_cached_session');
  localStorage.removeItem('fitbite_active_address_id');
}

/**
 * Safely determines if a user object corresponds to a demo account
 */
export function isDemoAccount(user) {
  if (!user) return false;
  if (user.is_demo === true || user.is_demo === 1 || user.is_demo === 'true') return true;
  if (typeof user.email === 'string' && user.email.toLowerCase().endsWith('@fitbite.demo')) return true;
  const demoIds = new Set([
    'user_cust_01',
    'user_cust_family',
    'user_sell_01',
    'user_sell_02',
    'user_sell_03',
    'user_sell_04',
    'user_sell_05',
    'user_sell_06',
    'user_sell_07',
    'user_sell_08',
    'user_sell_pending',
    'user_admin_01',
    'user_deliv_01'
  ]);
  return demoIds.has(user.id);
}
