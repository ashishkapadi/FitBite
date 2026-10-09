// Seed data for FitBite - 8 demo kitchens, 65+ meals, 20 categories, customization options, and demo users

export const DEMO_HASH_USER = '$2a$10$zGQP9/BqjBqYgEBm/aGuQeJGCZ3zw2T4.YaDVgq0CJPTNOAtE6GEa'; // FitBite@2026
export const DEMO_HASH_ADMIN = '$2a$10$hD1xtcEobxNfts8T1H7J0ew.avdoHQ5QN.YVPxV8BeTZWj8NrKhbW'; // FitBite@Admin2026

export const SEED_USERS = [
  {
    id: 'user_cust_01',
    email: 'customer@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'customer',
    full_name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    is_active: true
  },
  {
    id: 'user_cust_family',
    email: 'family@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'customer',
    full_name: 'Pooja & Aniket Kulkarni',
    phone: '+91 98765 43211',
    is_active: true
  },
  {
    id: 'user_sell_01',
    email: 'seller.tiffin@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'seller',
    full_name: 'Savitri Bai Deshmukh',
    phone: '+91 98765 43212',
    is_active: true
  },
  {
    id: 'user_sell_02',
    email: 'seller.kitchen@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'seller',
    full_name: 'Chef Harpreet Singh',
    phone: '+91 98765 43213',
    is_active: true
  },
  {
    id: 'user_sell_03',
    email: 'seller.swad@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'seller',
    full_name: 'Sunita Joshi',
    phone: '+91 98765 43215',
    is_active: true
  },
  {
    id: 'user_sell_04',
    email: 'seller.dakshin@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'seller',
    full_name: 'M. Venkatakrishnan',
    phone: '+91 98765 43216',
    is_active: true
  },
  {
    id: 'user_sell_05',
    email: 'seller.fitfuel@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'seller',
    full_name: 'Karan Mehra',
    phone: '+91 98765 43217',
    is_active: true
  },
  {
    id: 'user_sell_06',
    email: 'seller.greenharvest@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'seller',
    full_name: 'Shantilal Shah',
    phone: '+91 98765 43218',
    is_active: true
  },
  {
    id: 'user_sell_07',
    email: 'seller.rasoi@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'seller',
    full_name: 'Dinesh Agarwal',
    phone: '+91 98765 43219',
    is_active: true
  },
  {
    id: 'user_sell_08',
    email: 'seller.freshbite@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'seller',
    full_name: 'Ananya Roy',
    phone: '+91 98765 43220',
    is_active: true
  },
  {
    id: 'user_sell_pending',
    email: 'seller.pending@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'seller',
    full_name: 'Ramesh Patel',
    phone: '+91 98765 43221',
    is_active: true
  },
  {
    id: 'user_admin_01',
    email: 'admin@fitbite.demo',
    password_hash: DEMO_HASH_ADMIN,
    role: 'admin',
    full_name: 'FitBite Platform Compliance',
    phone: '+91 80000 12345',
    is_active: true
  },
  {
    id: 'user_deliv_01',
    email: 'delivery@fitbite.demo',
    password_hash: DEMO_HASH_USER,
    role: 'delivery_partner',
    full_name: 'Vikram Jadhav',
    phone: '+91 98765 43214',
    is_active: true
  }
];

export const SEED_CUSTOMER_PROFILES = [
  {
    id: 'cp_01',
    user_id: 'user_cust_01',
    living_situation: 'solo_bachelor',
    routine_type: 'wellness_focused',
    primary_interest: 'tiffin_subscriptions',
    default_delivery_slot: 'both',
    onboarding_completed: true
  },
  {
    id: 'cp_family',
    user_id: 'user_cust_family',
    living_situation: 'family',
    routine_type: 'chill_convenient',
    primary_interest: 'regular_meals',
    default_delivery_slot: 'dinner',
    onboarding_completed: true
  }
];

export const SEED_CUSTOMER_PREFERENCES = [
  {
    id: 'cpref_01',
    customer_id: 'cp_01',
    goal: 'muscle_gain',
    dietary_preference: 'vegetarian',
    allergies: ['Peanuts'],
    avoid_ingredients: ['Refined Sugar', 'Excess Oil'],
    preferred_cuisines: ['North Indian', 'Maharashtrian', 'Balanced Bowls'],
    spice_preference: 'medium',
    budget_per_meal: 180.00,
    preferred_portion: 'hearty',
    age: 26,
    height_cm: 178.0,
    weight_kg: 74.0,
    activity_level: 'very_active',
    notes: 'Prioritizing protein retention for workout recovery.'
  },
  {
    id: 'cpref_family',
    customer_id: 'cp_family',
    goal: 'balanced_eating',
    dietary_preference: 'vegetarian',
    allergies: [],
    avoid_ingredients: [],
    preferred_cuisines: ['North Indian', 'South Indian', 'Maharashtrian'],
    spice_preference: 'mild',
    budget_per_meal: 350.00,
    preferred_portion: 'hearty',
    age: 34,
    height_cm: 168.0,
    weight_kg: 68.0,
    activity_level: 'moderately_active',
    notes: 'Family combo preferences for home dinners.'
  }
];

export const SEED_ADDRESSES = [
  {
    id: 'addr_01',
    user_id: 'user_cust_01',
    label: 'Apartment',
    recipient_name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    street_address: 'Flat 402, Green Glen Layout, 5th Cross',
    landmark: 'Behind Sobha Silicon Oasis',
    area: 'Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    is_default: true,
    leave_at_doorstep: false,
    exchange_steel_dabba: true,
    delivery_instructions: 'Ring bell once. Please place tiffin box on the doorstep hook.'
  },
  {
    id: 'addr_family',
    user_id: 'user_cust_family',
    label: 'Home',
    recipient_name: 'Pooja Kulkarni',
    phone: '+91 98765 43211',
    street_address: 'Villa 12, Palm Meadows, Ramagondanahalli',
    landmark: 'Near Forum Shantiniketan',
    area: 'Whitefield',
    city: 'Bengaluru',
    pincode: '560066',
    is_default: true,
    leave_at_doorstep: true,
    exchange_steel_dabba: false,
    delivery_instructions: 'Security gate pass pre-approved.'
  }
];

export const SEED_SELLERS = [
  {
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
    operating_hours: '07:30 AM - 09:30 PM',
    fssai_number: '11223344556677',
    fssai_expiry_date: '2028-12-31',
    fssai_certificate_url: '/uploads/fssai_annapurna.pdf',
    verification_status: 'approved',
    rating: 4.85,
    rating_count: 240,
    preparation_cutoff_lunch_time: '08:30:00',
    preparation_cutoff_dinner_time: '16:00:00',
    is_listed: true
  },
  {
    id: 'seller_02',
    user_id: 'user_sell_02',
    business_name: 'Pind Da Dhaba & Bowls',
    owner_name: 'Chef Harpreet Singh',
    kitchen_type: 'restaurant',
    delivery_model: 'platform_managed',
    operating_address: 'Plot 88, 14th Main, Sector 4, HSR Layout',
    area: 'HSR Layout',
    city: 'Bengaluru',
    pincodes_served: ['560102', '560034', '560068'],
    delivery_radius_km: 7.0,
    cuisine_specializations: ['North Indian', 'Rice and Biryani', 'Roti and Sabzi'],
    operating_hours: '11:00 AM - 11:00 PM',
    fssai_number: '11523344556699',
    fssai_expiry_date: '2027-08-15',
    fssai_certificate_url: '/uploads/fssai_pind.pdf',
    verification_status: 'approved',
    rating: 4.72,
    rating_count: 310,
    preparation_cutoff_lunch_time: '10:30:00',
    preparation_cutoff_dinner_time: '18:00:00',
    is_listed: true
  },
  {
    id: 'seller_03',
    user_id: 'user_sell_03',
    business_name: 'Swad Maharashtrian Cloud Kitchen',
    owner_name: 'Sunita Joshi',
    kitchen_type: 'home_chef_cloud',
    delivery_model: 'kitchen_managed',
    operating_address: '4th Block, 17th Cross, Koramangala',
    area: 'Koramangala',
    city: 'Bengaluru',
    pincodes_served: ['560034', '560095', '560047'],
    delivery_radius_km: 6.5,
    cuisine_specializations: ['Maharashtrian', 'Breakfast', 'Balanced Bowls'],
    operating_hours: '08:00 AM - 09:30 PM',
    fssai_number: '21223344556688',
    fssai_expiry_date: '2027-11-20',
    fssai_certificate_url: '/uploads/fssai_swad.pdf',
    verification_status: 'approved',
    rating: 4.90,
    rating_count: 180,
    preparation_cutoff_lunch_time: '08:00:00',
    preparation_cutoff_dinner_time: '15:30:00',
    is_listed: true
  },
  {
    id: 'seller_04',
    user_id: 'user_sell_04',
    business_name: 'Dakshin Daily Meals & Tiffin',
    owner_name: 'M. Venkatakrishnan',
    kitchen_type: 'commercial_tiffin',
    delivery_model: 'fixed_route_batch',
    operating_address: '2nd Stage, Outer Ring Road, BTM Layout',
    area: 'BTM Layout',
    city: 'Bengaluru',
    pincodes_served: ['560076', '560068', '560029'],
    delivery_radius_km: 8.0,
    cuisine_specializations: ['South Indian', 'Breakfast', 'Everyday Tiffins'],
    operating_hours: '07:00 AM - 09:00 PM',
    fssai_number: '11823344556611',
    fssai_expiry_date: '2028-04-10',
    fssai_certificate_url: '/uploads/fssai_dakshin.pdf',
    verification_status: 'approved',
    rating: 4.80,
    rating_count: 220,
    preparation_cutoff_lunch_time: '08:00:00',
    preparation_cutoff_dinner_time: '16:00:00',
    is_listed: true
  },
  {
    id: 'seller_05',
    user_id: 'user_sell_05',
    business_name: 'FitFuel Macro Bowls & Grills',
    owner_name: 'Karan Mehra',
    kitchen_type: 'home_chef_cloud',
    delivery_model: 'platform_managed',
    operating_address: '100 Feet Road, HAL 2nd Stage, Indiranagar',
    area: 'Indiranagar',
    city: 'Bengaluru',
    pincodes_served: ['560038', '560008', '560075'],
    delivery_radius_km: 7.0,
    cuisine_specializations: ['High-Protein Meals', 'Balanced Bowls', 'Salads'],
    operating_hours: '10:00 AM - 10:30 PM',
    fssai_number: '11923344556622',
    fssai_expiry_date: '2028-09-01',
    fssai_certificate_url: '/uploads/fssai_fitfuel.pdf',
    verification_status: 'approved',
    rating: 4.88,
    rating_count: 410,
    preparation_cutoff_lunch_time: '09:00:00',
    preparation_cutoff_dinner_time: '17:00:00',
    is_listed: true
  },
  {
    id: 'seller_06',
    user_id: 'user_sell_06',
    business_name: 'Green Harvest Vegan & Jain Kitchen',
    owner_name: 'Shantilal Shah',
    kitchen_type: 'restaurant',
    delivery_model: 'platform_managed',
    operating_address: '9th Main, 4th Block, Jayanagar',
    area: 'Jayanagar',
    city: 'Bengaluru',
    pincodes_served: ['560011', '560041', '560069'],
    delivery_radius_km: 7.5,
    cuisine_specializations: ['Vegan', 'Jain-Friendly Options', 'Vegetarian'],
    operating_hours: '09:00 AM - 10:00 PM',
    fssai_number: '11423344556633',
    fssai_expiry_date: '2027-06-30',
    fssai_certificate_url: '/uploads/fssai_greenharvest.pdf',
    verification_status: 'approved',
    rating: 4.79,
    rating_count: 195,
    preparation_cutoff_lunch_time: '09:00:00',
    preparation_cutoff_dinner_time: '17:00:00',
    is_listed: true
  },
  {
    id: 'seller_07',
    user_id: 'user_sell_07',
    business_name: 'Rasoi Ghar Family Combos & Thalis',
    owner_name: 'Dinesh Agarwal',
    kitchen_type: 'restaurant',
    delivery_model: 'platform_managed',
    operating_address: 'Whitefield Main Road, Near ITPL, Whitefield',
    area: 'Whitefield',
    city: 'Bengaluru',
    pincodes_served: ['560066', '560048', '560037'],
    delivery_radius_km: 9.0,
    cuisine_specializations: ['Family Combos', 'North Indian', 'Roti and Sabzi'],
    operating_hours: '11:00 AM - 10:30 PM',
    fssai_number: '11623344556644',
    fssai_expiry_date: '2028-02-14',
    fssai_certificate_url: '/uploads/fssai_rasoighar.pdf',
    verification_status: 'approved',
    rating: 4.82,
    rating_count: 340,
    preparation_cutoff_lunch_time: '10:00:00',
    preparation_cutoff_dinner_time: '18:00:00',
    is_listed: true
  },
  {
    id: 'seller_08',
    user_id: 'user_sell_08',
    business_name: 'FreshBite Daily Salads, Wraps & Subs',
    owner_name: 'Ananya Roy',
    kitchen_type: 'home_chef_cloud',
    delivery_model: 'platform_managed',
    operating_address: 'Green Glen Layout, Bellandur',
    area: 'Bellandur',
    city: 'Bengaluru',
    pincodes_served: ['560103', '560037', '560102'],
    delivery_radius_km: 6.0,
    cuisine_specializations: ['Salads', 'Wraps and Sandwiches', 'Beverages'],
    operating_hours: '08:30 AM - 10:00 PM',
    fssai_number: '11723344556655',
    fssai_expiry_date: '2027-10-18',
    fssai_certificate_url: '/uploads/fssai_freshbite.pdf',
    verification_status: 'approved',
    rating: 4.76,
    rating_count: 275,
    preparation_cutoff_lunch_time: '09:00:00',
    preparation_cutoff_dinner_time: '17:00:00',
    is_listed: true
  },
  {
    id: 'seller_pending_01',
    user_id: 'user_sell_pending',
    business_name: 'Urban Spices Cloud Kitchen (Pending Review)',
    owner_name: 'Ramesh Patel',
    kitchen_type: 'home_chef_cloud',
    delivery_model: 'kitchen_managed',
    operating_address: '12, 1st Cross, Marathahalli',
    area: 'Marathahalli',
    city: 'Bengaluru',
    pincodes_served: ['560037'],
    delivery_radius_km: 5.0,
    cuisine_specializations: ['North Indian', 'Snacks'],
    operating_hours: '10:00 AM - 09:00 PM',
    fssai_number: '11998877665544',
    fssai_expiry_date: '2028-05-20',
    fssai_certificate_url: '/uploads/fssai_urbanspices.pdf',
    verification_status: 'pending_approval',
    rejection_reason: null,
    rating: 0.0,
    rating_count: 0,
    preparation_cutoff_lunch_time: '08:30:00',
    preparation_cutoff_dinner_time: '16:00:00',
    is_listed: false
  }
];

export const SEED_CATEGORIES = [
  { id: 'cat_01', name: 'Breakfast', slug: 'breakfast', description: 'Energizing morning staples, poha, idlis, and wholesome grain bowls', icon_name: 'Coffee', display_order: 1 },
  { id: 'cat_02', name: 'Everyday Tiffins', slug: 'everyday-tiffins', description: 'Reliable homestyle dabbas with hot rotis, dal, sabzi, and rice', icon_name: 'Box', display_order: 2 },
  { id: 'cat_03', name: 'North Indian', slug: 'north-indian', description: 'Slow-cooked rajma, paneer gravies, chole, and butter-soft parathas', icon_name: 'Utensils', display_order: 3 },
  { id: 'cat_04', name: 'South Indian', slug: 'south-indian', description: 'Crispy dosas, fluffy idlis, curd rice, and aromatic sambar', icon_name: 'Sun', display_order: 4 },
  { id: 'cat_05', name: 'Maharashtrian', slug: 'maharashtrian', description: 'Pithla bhakri, misal pav, puran poli, and comforting varan bhat', icon_name: 'Flame', display_order: 5 },
  { id: 'cat_06', name: 'High-Protein Meals', slug: 'high-protein-meals', description: 'Fitness-forward bowls packed with 25g+ clean protein', icon_name: 'Dumbbell', display_order: 6 },
  { id: 'cat_07', name: 'Balanced Bowls', slug: 'balanced-bowls', description: 'Wholesome one-bowl meals combining grains, greens, and proteins', icon_name: 'Soup', display_order: 7 },
  { id: 'cat_08', name: 'Vegetarian', slug: 'vegetarian', description: '100% pure vegetarian homestyle curries, dals, and vegetable stir-fries', icon_name: 'Leaf', display_order: 8 },
  { id: 'cat_09', name: 'Vegan', slug: 'vegan', description: 'Plant-powered dairy-free meals with tofu, millets, and fresh greens', icon_name: 'Sprout', display_order: 9 },
  { id: 'cat_10', name: 'Egg Meals', slug: 'egg-meals', description: 'Farm egg bhurji, boiled egg curries, and protein scramble boxes', icon_name: 'Egg', display_order: 10 },
  { id: 'cat_11', name: 'Chicken and Fish Meals', slug: 'chicken-and-fish-meals', description: 'Lean grilled chicken breasts, coastal fish curries, and egg combos', icon_name: 'Fish', display_order: 11 },
  { id: 'cat_12', name: 'Jain-Friendly Options', slug: 'jain-friendly-options', description: 'Prepared strictly without root vegetables, onion, or garlic', icon_name: 'ShieldCheck', display_order: 12 },
  { id: 'cat_13', name: 'Rice and Biryani', slug: 'rice-and-biryani', description: 'Aromatic dum biryanis, jeera rice, and comforting vegetable khichdi', icon_name: 'Wheat', display_order: 13 },
  { id: 'cat_14', name: 'Roti and Sabzi', slug: 'roti-and-sabzi', description: 'Phulkas, whole-wheat chapati boxes, and dry homestyle sabzis', icon_name: 'Disc', display_order: 14 },
  { id: 'cat_15', name: 'Salads', slug: 'salads', description: 'Fresh, crunchy sprout salads, quinoa crunch, and garden veggie bowls', icon_name: 'Salad', display_order: 15 },
  { id: 'cat_16', name: 'Wraps and Sandwiches', slug: 'wraps-and-sandwiches', description: 'Whole-wheat paneer wraps, grilled sandwiches, and roll combos', icon_name: 'Sandwich', display_order: 16 },
  { id: 'cat_17', name: 'Snacks', slug: 'snacks', description: 'Nutritious evening bites, roasted makhana, and light savory treats', icon_name: 'Cookie', display_order: 17 },
  { id: 'cat_18', name: 'Family Combos', slug: 'family-combos', description: 'Grand family thalis and 3 to 4 person meal bundles', icon_name: 'Users', display_order: 18 },
  { id: 'cat_19', name: 'Beverages', slug: 'beverages', description: 'Cold-pressed juices, buttermilk (chaas), and tender coconut water', icon_name: 'CupSoda', display_order: 19 },
  { id: 'cat_20', name: 'Desserts', slug: 'desserts', description: 'Low-guilt sweet treats, dry fruit kheer, and jaggery delicacies', icon_name: 'Cake', display_order: 20 }
];

export const SEED_CUSTOMIZATION_OPTIONS = [
  // Bases
  { id: 'opt_base_01', name: 'Base Choice', group_type: 'base', item_choice: 'Steamed Basmati Rice', price_delta: 0.00, calorie_delta: 180, protein_delta: 3.5, carbs_delta: 38.0, fat_delta: 0.5, is_default: true, display_order: 1 },
  { id: 'opt_base_02', name: 'Base Choice', group_type: 'base', item_choice: 'Brown Rice', price_delta: 20.00, calorie_delta: 165, protein_delta: 4.0, carbs_delta: 34.0, fat_delta: 1.2, is_default: false, display_order: 2 },
  { id: 'opt_base_03', name: 'Base Choice', group_type: 'base', item_choice: 'Multigrain Phulka (3 Pcs)', price_delta: 15.00, calorie_delta: 195, protein_delta: 6.2, carbs_delta: 36.0, fat_delta: 1.5, is_default: false, display_order: 3 },
  { id: 'opt_base_04', name: 'Base Choice', group_type: 'base', item_choice: 'Foxtail Millet Khichdi', price_delta: 25.00, calorie_delta: 150, protein_delta: 5.0, carbs_delta: 28.0, fat_delta: 1.0, is_default: false, display_order: 4 },
  { id: 'opt_base_05', name: 'Base Choice', group_type: 'base', item_choice: 'Crunchy Garden Salad Base', price_delta: 30.00, calorie_delta: 85, protein_delta: 3.0, carbs_delta: 12.0, fat_delta: 0.8, is_default: false, display_order: 5 },

  // Proteins
  { id: 'opt_prot_01', name: 'Protein Core', group_type: 'protein', item_choice: 'Fresh Malai Paneer Cubes (120g)', price_delta: 45.00, calorie_delta: 260, protein_delta: 18.5, carbs_delta: 4.0, fat_delta: 18.0, is_default: false, display_order: 1 },
  { id: 'opt_prot_02', name: 'Protein Core', group_type: 'protein', item_choice: 'Organic Spiced Tofu (130g)', price_delta: 40.00, calorie_delta: 180, protein_delta: 16.0, carbs_delta: 3.0, fat_delta: 10.0, is_default: false, display_order: 2 },
  { id: 'opt_prot_03', name: 'Protein Core', group_type: 'protein', item_choice: 'Two Farm Boiled Eggs', price_delta: 35.00, calorie_delta: 145, protein_delta: 13.0, carbs_delta: 1.0, fat_delta: 9.5, is_default: false, display_order: 3 },
  { id: 'opt_prot_04', name: 'Protein Core', group_type: 'protein', item_choice: 'Grilled Herb Chicken Breast (140g)', price_delta: 65.00, calorie_delta: 210, protein_delta: 27.0, carbs_delta: 0.0, fat_delta: 4.5, is_default: false, display_order: 4 },
  { id: 'opt_prot_05', name: 'Protein Core', group_type: 'protein', item_choice: 'Spiced Kala Chana & Sprouts (150g)', price_delta: 25.00, calorie_delta: 160, protein_delta: 11.0, carbs_delta: 26.0, fat_delta: 2.0, is_default: false, display_order: 5 },

  // Sides
  { id: 'opt_side_01', name: 'Side Vegetable', group_type: 'side', item_choice: 'Roasted Seasonal Vegetables', price_delta: 0.00, calorie_delta: 75, protein_delta: 2.5, carbs_delta: 11.0, fat_delta: 1.5, is_default: true, display_order: 1 },
  { id: 'opt_side_02', name: 'Side Vegetable', group_type: 'side', item_choice: 'Homestyle Bhindi Masala', price_delta: 15.00, calorie_delta: 85, protein_delta: 2.0, carbs_delta: 10.0, fat_delta: 3.5, is_default: false, display_order: 2 },
  { id: 'opt_side_03', name: 'Side Vegetable', group_type: 'side', item_choice: 'Steamed Broccoli & French Beans', price_delta: 25.00, calorie_delta: 55, protein_delta: 3.5, carbs_delta: 7.0, fat_delta: 0.5, is_default: false, display_order: 3 },
  { id: 'opt_side_04', name: 'Side Vegetable', group_type: 'side', item_choice: 'Jeera Aloo Methi', price_delta: 15.00, calorie_delta: 110, protein_delta: 2.5, carbs_delta: 18.0, fat_delta: 2.8, is_default: false, display_order: 4 },

  // Spice Levels
  { id: 'opt_spc_01', name: 'Spice Level', group_type: 'spice', item_choice: 'Mild (Low Chili, Fragrant)', price_delta: 0.00, calorie_delta: 0, protein_delta: 0.0, carbs_delta: 0.0, fat_delta: 0.0, is_default: false, display_order: 1 },
  { id: 'opt_spc_02', name: 'Spice Level', group_type: 'spice', item_choice: 'Medium (Balanced Indian Spicing)', price_delta: 0.00, calorie_delta: 0, protein_delta: 0.0, carbs_delta: 0.0, fat_delta: 0.0, is_default: true, display_order: 2 },
  { id: 'opt_spc_03', name: 'Spice Level', group_type: 'spice', item_choice: 'Hot (Extra Green Chilies)', price_delta: 0.00, calorie_delta: 5, protein_delta: 0.0, carbs_delta: 1.0, fat_delta: 0.0, is_default: false, display_order: 3 },
  { id: 'opt_spc_04', name: 'Spice Level', group_type: 'spice', item_choice: 'Fiery Kolhapuri (Authentic Heat)', price_delta: 10.00, calorie_delta: 15, protein_delta: 0.0, carbs_delta: 2.0, fat_delta: 0.5, is_default: false, display_order: 4 },

  // Sauces & Gravies
  { id: 'opt_sau_01', name: 'Curry / Sauce', group_type: 'sauce', item_choice: 'Yellow Tadka Dal', price_delta: 0.00, calorie_delta: 110, protein_delta: 6.0, carbs_delta: 15.0, fat_delta: 2.5, is_default: true, display_order: 1 },
  { id: 'opt_sau_02', name: 'Curry / Sauce', group_type: 'sauce', item_choice: 'Velvety Makhani Gravy', price_delta: 25.00, calorie_delta: 160, protein_delta: 3.5, carbs_delta: 10.0, fat_delta: 11.0, is_default: false, display_order: 2 },
  { id: 'opt_sau_03', name: 'Curry / Sauce', group_type: 'sauce', item_choice: 'Coconut Herb Stew', price_delta: 20.00, calorie_delta: 135, protein_delta: 2.5, carbs_delta: 8.0, fat_delta: 9.5, is_default: false, display_order: 3 },
  { id: 'opt_sau_04', name: 'Curry / Sauce', group_type: 'sauce', item_choice: 'Mint Coriander Yogurt Dip', price_delta: 15.00, calorie_delta: 60, protein_delta: 3.0, carbs_delta: 4.0, fat_delta: 2.0, is_default: false, display_order: 4 },

  // Extras
  { id: 'opt_ext_01', name: 'Add-on Extra', group_type: 'extra', item_choice: 'Extra Phulka Roti (+1 Pc)', price_delta: 12.00, calorie_delta: 65, protein_delta: 2.0, carbs_delta: 12.0, fat_delta: 0.5, is_default: false, display_order: 1 },
  { id: 'opt_ext_02', name: 'Add-on Extra', group_type: 'extra', item_choice: 'Fresh Thick Curd Bowl (100g)', price_delta: 25.00, calorie_delta: 70, protein_delta: 4.5, carbs_delta: 5.0, fat_delta: 3.0, is_default: false, display_order: 2 },
  { id: 'opt_ext_03', name: 'Add-on Extra', group_type: 'extra', item_choice: 'Roasted Papad & Kachumber Salad', price_delta: 20.00, calorie_delta: 40, protein_delta: 1.5, carbs_delta: 6.0, fat_delta: 0.5, is_default: false, display_order: 3 },
  { id: 'opt_ext_04', name: 'Add-on Extra', group_type: 'extra', item_choice: 'Extra Protein Scoop (Paneer/Chicken/Egg)', price_delta: 45.00, calorie_delta: 120, protein_delta: 12.0, carbs_delta: 2.0, fat_delta: 6.0, is_default: false, display_order: 4 },

  // Removals
  { id: 'opt_rem_01', name: 'Ingredient Removal', group_type: 'removal', item_choice: 'No Onion', price_delta: 0.00, calorie_delta: -15, protein_delta: 0.0, carbs_delta: -3.0, fat_delta: 0.0, is_default: false, display_order: 1 },
  { id: 'opt_rem_02', name: 'Ingredient Removal', group_type: 'removal', item_choice: 'No Garlic', price_delta: 0.00, calorie_delta: -5, protein_delta: 0.0, carbs_delta: -1.0, fat_delta: 0.0, is_default: false, display_order: 2 },
  { id: 'opt_rem_03', name: 'Ingredient Removal', group_type: 'removal', item_choice: 'Less Cooking Oil', price_delta: 0.00, calorie_delta: -60, protein_delta: 0.0, carbs_delta: 0.0, fat_delta: -7.0, is_default: false, display_order: 3 },
  { id: 'opt_rem_04', name: 'Ingredient Removal', group_type: 'removal', item_choice: 'Less Salt', price_delta: 0.00, calorie_delta: 0, protein_delta: 0.0, carbs_delta: 0.0, fat_delta: 0.0, is_default: false, display_order: 4 },
  { id: 'opt_rem_05', name: 'Ingredient Removal', group_type: 'removal', item_choice: 'No Fresh Coriander / Cilantro', price_delta: 0.00, calorie_delta: 0, protein_delta: 0.0, carbs_delta: 0.0, fat_delta: 0.0, is_default: false, display_order: 5 }
];

export const SEED_SUBSCRIPTION_PLANS = [
  {
    id: 'sub_plan_01',
    seller_id: 'seller_01',
    plan_type: 'working_professional',
    name: 'Working Professional 28-Day Homestyle Cycle',
    description: 'Daily fresh meals 7 days a week, including weekends. Allows up to 2 flexible skip-days that seamlessly extend your plan end date.',
    cycle_days: 28,
    delivery_frequency: 'daily',
    supported_slots: ['lunch', 'dinner', 'both'],
    base_price_per_meal: 125.00,
    plan_discount_percent: 15.00,
    max_skips_allowed: 2,
    is_active: true
  },
  {
    id: 'sub_plan_02',
    seller_id: 'seller_01',
    plan_type: 'student',
    name: 'Student Pocket Saver Mon-Fri Monthly Plan',
    description: 'Budget-friendly meals delivered Monday to Friday. Saturdays and Sundays are automatically excluded, billing only for scheduled weekdays.',
    cycle_days: 22, // Dynamically computed for current month
    delivery_frequency: 'weekdays_only',
    supported_slots: ['lunch', 'dinner', 'both'],
    base_price_per_meal: 99.00,
    plan_discount_percent: 20.00,
    max_skips_allowed: 1,
    is_active: true
  },
  {
    id: 'sub_plan_03',
    seller_id: 'seller_05',
    plan_type: 'working_professional',
    name: 'FitFuel High-Protein Pro 28-Day Cycle',
    description: 'Chef-crafted high-protein meal plan (30g+ protein per meal) with lean cottage cheese, tofu, grilled chicken, and quinoa.',
    cycle_days: 28,
    delivery_frequency: 'daily',
    supported_slots: ['lunch', 'dinner', 'both'],
    base_price_per_meal: 195.00,
    plan_discount_percent: 12.00,
    max_skips_allowed: 2,
    is_active: true
  },
  {
    id: 'sub_plan_04',
    seller_id: 'seller_04',
    plan_type: 'student',
    name: 'Dakshin Student Express Mon-Fri Monthly Thali',
    description: 'Authentic South Indian student plan with freshly steamed sambar rice, rasam, curd rice, and seasonal kootu. Mon–Fri deliveries only (weekends excluded).',
    cycle_days: 22,
    delivery_frequency: 'weekdays_only',
    supported_slots: ['lunch', 'dinner', 'both'],
    base_price_per_meal: 89.00,
    plan_discount_percent: 25.00,
    max_skips_allowed: 1,
    is_active: true
  },
  {
    id: 'sub_plan_05',
    seller_id: 'seller_04',
    plan_type: 'working_professional',
    name: 'Dakshin Corporate 28-Day Homestyle Feast',
    description: 'Complete 28 consecutive days feast including weekends. Traditional South Indian delicacies prepared with cold-pressed gingelly oil and mild coconut.',
    cycle_days: 28,
    delivery_frequency: 'daily',
    supported_slots: ['lunch', 'dinner', 'both'],
    base_price_per_meal: 119.00,
    plan_discount_percent: 18.00,
    max_skips_allowed: 2,
    is_active: true
  },
  {
    id: 'sub_plan_06',
    seller_id: 'seller_03',
    plan_type: 'working_professional',
    name: 'Sattvik Pure Veg 28-Day Traditional Dabba',
    description: 'Pure vegetarian 28 consecutive day meal cycle with no onion and no garlic options. Gentle on digestion, freshly tossed rotis and seasonal green subzis.',
    cycle_days: 28,
    delivery_frequency: 'daily',
    supported_slots: ['lunch', 'dinner', 'both'],
    base_price_per_meal: 135.00,
    plan_discount_percent: 20.00,
    max_skips_allowed: 2,
    is_active: true
  }
];

export const SEED_COUPONS = [
  {
    id: 'cpn_01',
    code: 'FITBITE50',
    description: '50% off on your first order up to ₹100',
    discount_type: 'percentage',
    discount_value: 50.00,
    max_discount_cap: 100.00,
    min_order_amount: 149.00,
    valid_from: '2026-01-01 00:00:00',
    valid_until: '2026-12-31 23:59:59',
    usage_limit_total: 5000,
    usage_limit_per_user: 1,
    is_active: true
  },
  {
    id: 'cpn_02',
    code: 'HEALTHY100',
    description: 'Flat ₹100 off on healthy orders above ₹399',
    discount_type: 'flat',
    discount_value: 100.00,
    max_discount_cap: 100.00,
    min_order_amount: 399.00,
    valid_from: '2026-01-01 00:00:00',
    valid_until: '2026-12-31 23:59:59',
    usage_limit_total: 2000,
    usage_limit_per_user: 3,
    is_active: true
  },
  {
    id: 'cpn_03',
    code: 'STUDENT20',
    description: '20% off up to ₹75 for student meals',
    discount_type: 'percentage',
    discount_value: 20.00,
    max_discount_cap: 75.00,
    min_order_amount: 120.00,
    valid_from: '2026-01-01 00:00:00',
    valid_until: '2026-12-31 23:59:59',
    usage_limit_total: 1000,
    usage_limit_per_user: 5,
    is_active: true
  }
];
