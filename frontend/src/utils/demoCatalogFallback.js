/**
 * FitBite Offline / Hardcoded System Data
 *
 * Provides instant, zero-dependency offline fallback data for:
 * 1. Customer Storefront (Categories, Sellers, Meals, Customizer)
 * 2. Tiffin Subscriptions & Active Plans
 * 3. Kitchen Operations Portal (/seller)
 * 4. Platform Admin Desk (/admin)
 * 5. Customer Orders & Delivery Tracking (/orders)
 */
import { getFallbackAuthSession, getStoredAuthSession } from './demoAuthFallback.js';
export const FALLBACK_CATEGORIES = [
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

export const FALLBACK_SELLERS = [
  {
    id: 'seller_01',
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
    verification_status: 'approved',
    rating: 4.85,
    rating_count: 240,
    is_listed: true
  },
  {
    id: 'seller_02',
    business_name: 'Pind Da Dhaba & Bowls',
    owner_name: 'Chef Harpreet Singh',
    kitchen_type: 'restaurant',
    delivery_model: 'platform_managed',
    operating_address: '102, 100ft Road, Indiranagar',
    area: 'Indiranagar',
    city: 'Bengaluru',
    pincodes_served: ['560038', '560008', '560071'],
    delivery_radius_km: 7.0,
    cuisine_specializations: ['North Indian', 'Rice and Biryani', 'Roti and Sabzi'],
    operating_hours: '11:00 AM - 11:00 PM',
    fssai_number: '11523344556688',
    verification_status: 'approved',
    rating: 4.78,
    rating_count: 310,
    is_listed: true
  },
  {
    id: 'seller_03',
    business_name: 'Swad Sugandh Maharashtrian Kitchen',
    owner_name: 'Sunita Joshi',
    kitchen_type: 'home_chef_cloud',
    delivery_model: 'fixed_route_batch',
    operating_address: '15, 4th Cross, Malleshwaram',
    area: 'Malleshwaram',
    city: 'Bengaluru',
    pincodes_served: ['560003', '560055', '560010'],
    delivery_radius_km: 6.5,
    cuisine_specializations: ['Maharashtrian', 'Everyday Tiffins', 'Snacks'],
    operating_hours: '08:00 AM - 09:00 PM',
    fssai_number: '11823344556699',
    verification_status: 'approved',
    rating: 4.90,
    rating_count: 185,
    is_listed: true
  },
  {
    id: 'seller_04',
    business_name: 'Dakshin Flavors Mess & Tiffins',
    owner_name: 'M. Venkatakrishnan',
    kitchen_type: 'commercial_tiffin',
    delivery_model: 'fixed_route_batch',
    operating_address: '88, CMH Road, Indiranagar',
    area: 'Indiranagar',
    city: 'Bengaluru',
    pincodes_served: ['560038', '560008', '560075'],
    delivery_radius_km: 6.0,
    cuisine_specializations: ['South Indian', 'Everyday Tiffins', 'Breakfast'],
    operating_hours: '07:00 AM - 09:00 PM',
    fssai_number: '11323344556611',
    verification_status: 'approved',
    rating: 4.82,
    rating_count: 290,
    is_listed: true
  },
  {
    id: 'seller_05',
    business_name: 'FitFuel Performance Kitchen',
    owner_name: 'Karan Mehra',
    kitchen_type: 'home_chef_cloud',
    delivery_model: 'platform_managed',
    operating_address: '45, 80ft Road, Koramangala 4th Block',
    area: 'Koramangala',
    city: 'Bengaluru',
    pincodes_served: ['560034', '560095', '560047', '560038'],
    delivery_radius_km: 8.5,
    cuisine_specializations: ['High-Protein Meals', 'Balanced Bowls', 'Salads'],
    operating_hours: '07:30 AM - 10:30 PM',
    fssai_number: '11923344556622',
    verification_status: 'approved',
    rating: 4.88,
    rating_count: 410,
    is_listed: true
  }
];

export const FALLBACK_MEALS = [
  {
    id: 'meal_006',
    seller_id: 'seller_01',
    category_id: 'cat_02',
    name: 'Classic Daily Homestyle Tiffin Dabba',
    slug: 'classic-daily-homestyle-tiffin',
    description: 'Comfort in a dabba: 4 phulkas, comforting yellow dal tadka, seasonal dry sabzi (aloo beans), steamed basmati rice, and homemade salad.',
    cuisine: 'North Indian',
    base_price: 120,
    portion_choices: ['Standard Tiffin', 'Large Tiffin (+₹30)'],
    ingredients: ['Wheat Flour', 'Toor Dal', 'French Beans', 'Potato', 'Basmati Rice', 'Cumin'],
    allergens: ['Gluten'],
    dietary_tags: ['Vegetarian', 'Everyday Tiffins'],
    is_available: true,
    is_featured: true,
    is_tiffin_eligible: true,
    prep_time_minutes: 25,
    calories: 520,
    protein_grams: 16.5,
    carbs_grams: 86,
    fat_grams: 10.5,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    rating_count: 320,
    seller: { id: 'seller_01', business_name: 'Annapurna Homestyle Tiffin Ghar', rating: 4.85 }
  },
  {
    id: 'meal_007',
    seller_id: 'seller_01',
    category_id: 'cat_02',
    name: 'Special Paneer Subzi Tiffin Meal',
    slug: 'special-paneer-tiffin-meal',
    description: '4 ghee phulkas, rich paneer shimla mirch masala, slow-simmered dal fry, jeera rice, fresh cucumber salad, and roasted papad.',
    cuisine: 'North Indian',
    base_price: 155,
    portion_choices: ['Standard (4 Phulkas)', 'Mega (5 Phulkas + Extra Dal)'],
    ingredients: ['Paneer', 'Capsicum', 'Toor Dal', 'Wheat Flour', 'Jeera Rice', 'Ghee'],
    allergens: ['Dairy', 'Gluten'],
    dietary_tags: ['Vegetarian', 'Everyday Tiffins'],
    is_available: true,
    is_featured: true,
    is_tiffin_eligible: true,
    prep_time_minutes: 25,
    calories: 630,
    protein_grams: 22,
    carbs_grams: 88,
    fat_grams: 18.5,
    image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    rating_count: 210,
    seller: { id: 'seller_01', business_name: 'Annapurna Homestyle Tiffin Ghar', rating: 4.85 }
  },
  {
    id: 'meal_020',
    seller_id: 'seller_05',
    category_id: 'cat_06',
    name: 'Grilled Herb Paneer Macro Bowl (32g Protein)',
    slug: 'grilled-paneer-macro-bowl',
    description: 'Pan-seared malai paneer cubes marinated in rosemary, oregano, and olive oil, served over quinoa and steamed broccoli with lemon tahini dressing.',
    cuisine: 'Continental',
    base_price: 219,
    portion_choices: ['Standard (32g Protein)', 'Athlete Mega (42g Protein, +₹50)'],
    ingredients: ['Fresh Paneer (150g)', 'Quinoa', 'Broccoli', 'Bell Peppers', 'Olive Oil', 'Tahini'],
    allergens: ['Dairy'],
    dietary_tags: ['Vegetarian', 'High-Protein', 'Balanced Bowls'],
    is_available: true,
    is_featured: true,
    is_tiffin_eligible: true,
    prep_time_minutes: 25,
    calories: 520,
    protein_grams: 32,
    carbs_grams: 38,
    fat_grams: 22,
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    rating_count: 380,
    seller: { id: 'seller_05', business_name: 'FitFuel Performance Kitchen', rating: 4.88 }
  },
  {
    id: 'meal_021',
    seller_id: 'seller_05',
    category_id: 'cat_06',
    name: 'Tender Grilled Chicken & Brown Rice Bowl (38g Protein)',
    slug: 'grilled-chicken-brown-rice-bowl',
    description: 'Char-grilled chicken breast glazed with smoked paprika and garlic herb marinade, served with brown basmati rice, steamed beans, and charred corn.',
    cuisine: 'Continental',
    base_price: 239,
    portion_choices: ['Standard (38g Protein)', 'Mega (48g Protein, +₹60)'],
    ingredients: ['Chicken Breast (180g)', 'Brown Basmati Rice', 'French Beans', 'Corn', 'Paprika', 'Garlic'],
    allergens: [],
    dietary_tags: ['Chicken and Fish Meals', 'High-Protein', 'Balanced Bowls'],
    is_available: true,
    is_featured: true,
    is_tiffin_eligible: true,
    prep_time_minutes: 25,
    calories: 510,
    protein_grams: 38.5,
    carbs_grams: 48,
    fat_grams: 8.5,
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    rating_count: 420,
    seller: { id: 'seller_05', business_name: 'FitFuel Performance Kitchen', rating: 4.88 }
  },
  {
    id: 'meal_010',
    seller_id: 'seller_02',
    category_id: 'cat_03',
    name: 'Dhaba Style Rajma Masala & Jeera Rice',
    slug: 'rajma-masala-jeera-rice',
    description: 'Overnight soaked Kashmiri rajma simmered in an aromatic onion, ginger, garlic, and tomato reduction. Served over fragrant cumin rice.',
    cuisine: 'North Indian',
    base_price: 135,
    portion_choices: ['Single Bowl (450g)', 'Mega Bowl (650g)'],
    ingredients: ['Red Kidney Beans', 'Basmati Rice', 'Onion', 'Tomato', 'Cumin', 'Ginger', 'Garlic'],
    allergens: [],
    dietary_tags: ['Vegetarian', 'Vegan', 'North Indian'],
    is_available: true,
    is_featured: true,
    is_tiffin_eligible: true,
    prep_time_minutes: 20,
    calories: 490,
    protein_grams: 18,
    carbs_grams: 84,
    fat_grams: 7.5,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    rating_count: 290,
    seller: { id: 'seller_02', business_name: 'Pind Da Dhaba & Bowls', rating: 4.78 }
  },
  {
    id: 'meal_011',
    seller_id: 'seller_02',
    category_id: 'cat_03',
    name: 'Amritsari Chole Chawal with Sirka Onion',
    slug: 'amritsari-chole-chawal',
    description: 'Dark, spice-infused Punjabi kabuli chana simmered with whole spices, dry pomegranate seeds, and fresh coriander. Served with steamed basmati rice.',
    cuisine: 'North Indian',
    base_price: 139,
    portion_choices: ['Standard Box', 'Large Box'],
    ingredients: ['Chickpeas', 'Tea Leaves', 'Anardana', 'Basmati Rice', 'Onion', 'Green Chili'],
    allergens: [],
    dietary_tags: ['Vegetarian', 'Vegan', 'North Indian'],
    is_available: true,
    is_featured: true,
    is_tiffin_eligible: true,
    prep_time_minutes: 20,
    calories: 510,
    protein_grams: 17.5,
    carbs_grams: 86,
    fat_grams: 8.5,
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    rating_count: 245,
    seller: { id: 'seller_02', business_name: 'Pind Da Dhaba & Bowls', rating: 4.78 }
  },
  {
    id: 'meal_018',
    seller_id: 'seller_03',
    category_id: 'cat_05',
    name: 'Pithla Bhakri Thali with Thecha',
    slug: 'pithla-bhakri-thecha',
    description: 'Rustic gram flour curry tempered with garlic and cumin, served with 2 warm jowar bhakris, fiery green chili-garlic thecha, and raw onion rings.',
    cuisine: 'Maharashtrian',
    base_price: 135,
    portion_choices: ['Standard Thali (2 Bhakris)'],
    ingredients: ['Gram Flour (Besan)', 'Jowar Flour', 'Green Chilies', 'Garlic', 'Mustard Seeds'],
    allergens: [],
    dietary_tags: ['Vegetarian', 'Vegan', 'Maharashtrian'],
    is_available: true,
    is_featured: true,
    is_tiffin_eligible: true,
    prep_time_minutes: 25,
    calories: 460,
    protein_grams: 16.5,
    carbs_grams: 78,
    fat_grams: 9,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    rating_count: 155,
    seller: { id: 'seller_03', business_name: 'Swad Sugandh Maharashtrian Kitchen', rating: 4.90 }
  },
  {
    id: 'meal_036',
    seller_id: 'seller_02',
    category_id: 'cat_13',
    name: 'Awadhi Veg Dum Biryani with Burani Raita',
    slug: 'awadhi-veg-dum-biryani',
    description: 'Long grain basmati rice layered with marinated carrots, beans, cauliflower, and paneer cubes, infused with saffron, mint, and fried onions.',
    cuisine: 'North Indian',
    base_price: 179,
    portion_choices: ['Single Portion (500g)', 'Jumbo Pack (900g, +₹130)'],
    ingredients: ['Basmati Rice', 'Paneer', 'Carrot', 'Cauliflower', 'Saffron', 'Mint', 'Curd'],
    allergens: ['Dairy'],
    dietary_tags: ['Vegetarian', 'Rice and Biryani'],
    is_available: true,
    is_featured: true,
    is_tiffin_eligible: true,
    prep_time_minutes: 25,
    calories: 590,
    protein_grams: 18,
    carbs_grams: 88,
    fat_grams: 16,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    rating_count: 320,
    seller: { id: 'seller_02', business_name: 'Pind Da Dhaba & Bowls', rating: 4.78 }
  }
];

export const FALLBACK_CUSTOMIZATION_OPTIONS = {
  bases: [
    { id: 'opt_base_01', name: 'Base Choice', group_type: 'base', item_choice: 'Steamed Basmati Rice', price_delta: 0.00, calorie_delta: 180, protein_delta: 3.5, carbs_delta: 38.0, fat_delta: 0.5, is_default: true, display_order: 1 },
    { id: 'opt_base_02', name: 'Base Choice', group_type: 'base', item_choice: 'Brown Rice', price_delta: 20.00, calorie_delta: 165, protein_delta: 4.0, carbs_delta: 34.0, fat_delta: 1.2, is_default: false, display_order: 2 },
    { id: 'opt_base_03', name: 'Base Choice', group_type: 'base', item_choice: 'Multigrain Phulka (3 Pcs)', price_delta: 15.00, calorie_delta: 195, protein_delta: 6.2, carbs_delta: 36.0, fat_delta: 1.5, is_default: false, display_order: 3 },
    { id: 'opt_base_04', name: 'Base Choice', group_type: 'base', item_choice: 'Foxtail Millet Khichdi', price_delta: 25.00, calorie_delta: 150, protein_delta: 5.0, carbs_delta: 28.0, fat_delta: 1.0, is_default: false, display_order: 4 }
  ],
  proteins: [
    { id: 'opt_prot_01', name: 'Protein Core', group_type: 'protein', item_choice: 'Fresh Malai Paneer Cubes (120g)', price_delta: 45.00, calorie_delta: 260, protein_delta: 18.5, carbs_delta: 4.0, fat_delta: 18.0, is_default: false, display_order: 1 },
    { id: 'opt_prot_02', name: 'Protein Core', group_type: 'protein', item_choice: 'Organic Spiced Tofu (130g)', price_delta: 40.00, calorie_delta: 180, protein_delta: 16.0, carbs_delta: 3.0, fat_delta: 10.0, is_default: false, display_order: 2 },
    { id: 'opt_prot_03', name: 'Protein Core', group_type: 'protein', item_choice: 'Two Farm Boiled Eggs', price_delta: 35.00, calorie_delta: 145, protein_delta: 13.0, carbs_delta: 1.0, fat_delta: 9.5, is_default: false, display_order: 3 },
    { id: 'opt_prot_04', name: 'Protein Core', group_type: 'protein', item_choice: 'Grilled Herb Chicken Breast (140g)', price_delta: 65.00, calorie_delta: 210, protein_delta: 27.0, carbs_delta: 0.0, fat_delta: 4.5, is_default: false, display_order: 4 }
  ],
  sides: [
    { id: 'opt_side_01', name: 'Side Vegetable', group_type: 'side', item_choice: 'Roasted Seasonal Vegetables', price_delta: 0.00, calorie_delta: 75, protein_delta: 2.5, carbs_delta: 11.0, fat_delta: 1.5, is_default: true, display_order: 1 },
    { id: 'opt_side_02', name: 'Side Vegetable', group_type: 'side', item_choice: 'Homestyle Bhindi Masala', price_delta: 15.00, calorie_delta: 85, protein_delta: 2.0, carbs_delta: 10.0, fat_delta: 3.5, is_default: false, display_order: 2 },
    { id: 'opt_side_03', name: 'Side Vegetable', group_type: 'side', item_choice: 'Steamed Broccoli & French Beans', price_delta: 25.00, calorie_delta: 55, protein_delta: 3.5, carbs_delta: 7.0, fat_delta: 0.5, is_default: false, display_order: 3 }
  ],
  spices: [
    { id: 'opt_spc_01', name: 'Spice Level', group_type: 'spice', item_choice: 'Mild (Low Chili, Fragrant)', price_delta: 0.00, calorie_delta: 0, protein_delta: 0.0, carbs_delta: 0.0, fat_delta: 0.0, is_default: false, display_order: 1 },
    { id: 'opt_spc_02', name: 'Spice Level', group_type: 'spice', item_choice: 'Medium (Balanced Indian Spicing)', price_delta: 0.00, calorie_delta: 0, protein_delta: 0.0, carbs_delta: 0.0, fat_delta: 0.0, is_default: true, display_order: 2 },
    { id: 'opt_spc_03', name: 'Spice Level', group_type: 'spice', item_choice: 'Hot (Extra Green Chilies)', price_delta: 0.00, calorie_delta: 5, protein_delta: 0.0, carbs_delta: 1.0, fat_delta: 0.0, is_default: false, display_order: 3 }
  ],
  sauces: [
    { id: 'opt_sau_01', name: 'Curry / Sauce', group_type: 'sauce', item_choice: 'Yellow Tadka Dal', price_delta: 0.00, calorie_delta: 110, protein_delta: 6.0, carbs_delta: 15.0, fat_delta: 2.5, is_default: true, display_order: 1 },
    { id: 'opt_sau_02', name: 'Curry / Sauce', group_type: 'sauce', item_choice: 'Velvety Makhani Gravy', price_delta: 25.00, calorie_delta: 160, protein_delta: 3.5, carbs_delta: 10.0, fat_delta: 11.0, is_default: false, display_order: 2 },
    { id: 'opt_sau_03', name: 'Curry / Sauce', group_type: 'sauce', item_choice: 'Coconut Herb Stew', price_delta: 20.00, calorie_delta: 135, protein_delta: 2.5, carbs_delta: 8.0, fat_delta: 9.5, is_default: false, display_order: 3 }
  ],
  extras: [
    { id: 'opt_ext_01', name: 'Add-on Extra', group_type: 'extra', item_choice: 'Extra Phulka Roti (+1 Pc)', price_delta: 12.00, calorie_delta: 65, protein_delta: 2.0, carbs_delta: 12.0, fat_delta: 0.5, is_default: false, display_order: 1 },
    { id: 'opt_ext_02', name: 'Add-on Extra', group_type: 'extra', item_choice: 'Fresh Thick Curd Bowl (100g)', price_delta: 25.00, calorie_delta: 70, protein_delta: 4.5, carbs_delta: 5.0, fat_delta: 3.0, is_default: false, display_order: 2 },
    { id: 'opt_ext_03', name: 'Add-on Extra', group_type: 'extra', item_choice: 'Roasted Papad & Kachumber Salad', price_delta: 20.00, calorie_delta: 40, protein_delta: 1.5, carbs_delta: 6.0, fat_delta: 0.5, is_default: false, display_order: 3 }
  ],
  removals: [
    { id: 'opt_rem_01', name: 'Ingredient Removal', group_type: 'removal', item_choice: 'No Onion', price_delta: 0.00, calorie_delta: -15, protein_delta: 0.0, carbs_delta: -3.0, fat_delta: 0.0, is_default: false, display_order: 1 },
    { id: 'opt_rem_02', name: 'Ingredient Removal', group_type: 'removal', item_choice: 'No Garlic', price_delta: 0.00, calorie_delta: -5, protein_delta: 0.0, carbs_delta: -1.0, fat_delta: 0.0, is_default: false, display_order: 2 },
    { id: 'opt_rem_03', name: 'Ingredient Removal', group_type: 'removal', item_choice: 'Less Cooking Oil', price_delta: 0.00, calorie_delta: -60, protein_delta: 0.0, carbs_delta: 0.0, fat_delta: -7.0, is_default: false, display_order: 3 }
  ]
};

export const FALLBACK_SUBSCRIPTION_PLANS = [
  {
    id: 'sub_plan_01',
    seller_id: 'seller_01',
    plan_type: 'working_professional',
    name: 'Everyday Veg — 28-Day Plan',
    description: 'Daily fresh homestyle vegetarian meals for 28 consecutive calendar days, including weekends. Features rotating thalis with phulkas, dal tadka, seasonal subzi, and fresh salad.',
    cycle_days: 28,
    delivery_frequency: 'daily',
    supported_slots: ['lunch', 'dinner', 'both'],
    base_price_per_meal: 120.00,
    plan_discount_percent: 15.00,
    max_skips_allowed: 2,
    is_active: true,
    seller: { business_name: 'Annapurna Homestyle Tiffin Ghar' }
  },
  {
    id: 'sub_plan_02',
    seller_id: 'seller_05',
    plan_type: 'working_professional',
    name: 'High-Protein — 28-Day Plan',
    description: 'Macro-balanced fitness meal plan delivering 30g+ protein per meal for 28 consecutive calendar days including weekends. Lean paneer, tofu, grilled chicken, sprouted legumes, and quinoa.',
    cycle_days: 28,
    delivery_frequency: 'daily',
    supported_slots: ['lunch', 'dinner', 'both'],
    base_price_per_meal: 190.00,
    plan_discount_percent: 12.00,
    max_skips_allowed: 2,
    is_active: true,
    seller: { business_name: 'FitFuel Performance Kitchen' }
  },
  {
    id: 'sub_plan_04',
    seller_id: 'seller_01',
    plan_type: 'student',
    name: 'Budget Veg Lunch — Weekday Plan',
    description: 'Pocket-friendly student homestyle lunch delivered Monday to Friday. Saturdays and Sundays are strictly excluded with zero weekend charges.',
    cycle_days: 28,
    delivery_frequency: 'weekdays_only',
    supported_slots: ['lunch'],
    base_price_per_meal: 89.00,
    plan_discount_percent: 20.00,
    max_skips_allowed: 1,
    is_active: true,
    seller: { business_name: 'Annapurna Homestyle Tiffin Ghar' }
  }
];

export const FALLBACK_ORDERS = [
  {
    id: 'ord_demo_101',
    order_number: 'FB-2026-8942',
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'out_for_delivery',
    total_amount: 275.00,
    payment_method: 'upi',
    payment_status: 'paid',
    delivery_slot: 'lunch',
    seller_id: 'seller_01',
    seller: {
      business_name: 'Annapurna Homestyle Tiffin Ghar',
      area: 'Indiranagar'
    },
    items: [
      {
        meal_id: 'meal_006',
        meal_name_snapshot: 'Classic Daily Homestyle Tiffin Dabba',
        meal_image_snapshot: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
        quantity: 2,
        unit_base_price: 120.00,
        portion_snapshot: 'Standard Tiffin'
      }
    ],
    delivery_address: {
      street_address: 'Flat 402, Green Glen Layout, 5th Cross',
      area: 'Indiranagar',
      city: 'Bengaluru'
    }
  },
  {
    id: 'ord_demo_102',
    order_number: 'FB-2026-8819',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
    total_amount: 354.00,
    payment_method: 'upi',
    payment_status: 'paid',
    delivery_slot: 'dinner',
    seller_id: 'seller_01',
    seller: {
      business_name: 'Annapurna Homestyle Tiffin Ghar',
      area: 'Indiranagar'
    },
    items: [
      {
        meal_id: 'meal_007',
        meal_name_snapshot: 'Special Paneer Subzi Tiffin Meal',
        meal_image_snapshot: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
        quantity: 2,
        unit_base_price: 155.00,
        portion_snapshot: 'Standard (4 Phulkas)'
      }
    ],
    delivery_address: {
      street_address: 'Flat 402, Green Glen Layout, 5th Cross',
      area: 'Indiranagar',
      city: 'Bengaluru'
    }
  }
];

export const FALLBACK_SELLER_DASHBOARD = {
  overview: {
    seller: {
      id: 'seller_01',
      business_name: 'Annapurna Homestyle Tiffin Ghar',
      owner_name: 'Savitri Bai Deshmukh',
      kitchen_type: 'commercial_tiffin',
      delivery_model: 'fixed_route_batch',
      operating_address: '24/1, 2nd Main, HAL 2nd Stage, Indiranagar',
      area: 'Indiranagar',
      city: 'Bengaluru',
      pincodes_served: ['560038', '560008', '560075', '560001'],
      delivery_radius_km: 8,
      cuisine_specializations: ['Everyday Tiffins', 'North Indian', 'Maharashtrian'],
      fssai_number: '11223344556677',
      verification_status: 'approved',
      is_listed: true,
      rating: 4.85,
      rating_count: 240
    },
    stats: {
      total_orders_count: 240,
      today_orders_count: 42,
      active_kitchen_tickets: 3,
      active_subscriptions_count: 68,
      today_subscription_lunches: 48,
      today_subscription_dinners: 36,
      total_revenue_inr: 84600.00
    },
    today_orders_count: 42,
    active_subscriptions_count: 68,
    today_revenue: 8460,
    pending_orders_count: 3,
    average_rating: 4.85,
    on_time_delivery_rate: 98.4
  },
  orders: [
    {
      id: 'ord_kitch_01',
      order_number: 'FB-2026-9012',
      customer_name: 'Rahul Sharma',
      status: 'preparing',
      total_amount: 275.00,
      delivery_slot: 'lunch',
      delivery_address: 'Flat 402, Green Glen Layout, Indiranagar',
      packaging_instructions: 'Steel Dabba Exchange requested',
      items: [
        { name: 'Classic Daily Homestyle Tiffin Dabba', quantity: 2, portion: 'Standard Tiffin' }
      ],
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    },
    {
      id: 'ord_kitch_02',
      order_number: 'FB-2026-9015',
      customer_name: 'Pooja Kulkarni',
      status: 'confirmed',
      total_amount: 340.00,
      delivery_slot: 'lunch',
      delivery_address: 'Villa 12, Palm Meadows, Whitefield',
      packaging_instructions: 'Biodegradable meal trays',
      items: [
        { name: 'Special Paneer Subzi Tiffin Meal', quantity: 2, portion: 'Standard (4 Phulkas)' }
      ],
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'ord_kitch_03',
      order_number: 'FB-2026-8998',
      customer_name: 'Amitabh Sengupta',
      status: 'ready_for_pickup',
      total_amount: 155.00,
      delivery_slot: 'lunch',
      delivery_address: '14, 1st Cross, HAL 2nd Stage',
      packaging_instructions: 'Hot bag delivery',
      items: [
        { name: 'Classic Daily Homestyle Tiffin Dabba', quantity: 1, portion: 'Large Tiffin (+₹30)' }
      ],
      created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
    }
  ],
  meals: [
    {
      id: 'meal_006',
      name: 'Classic Daily Homestyle Tiffin Dabba',
      category_id: 'cat_02',
      base_price: 120,
      cuisine: 'North Indian',
      calories: 520,
      protein_grams: 16.5,
      is_available: true,
      is_tiffin_eligible: true
    },
    {
      id: 'meal_007',
      name: 'Special Paneer Subzi Tiffin Meal',
      category_id: 'cat_02',
      base_price: 155,
      cuisine: 'North Indian',
      calories: 630,
      protein_grams: 22,
      is_available: true,
      is_tiffin_eligible: true
    }
  ],
  plans: [
    {
      id: 'sub_plan_01',
      name: 'Everyday Veg — 28-Day Plan',
      plan_type: 'working_professional',
      base_price_per_meal: 120.00,
      plan_discount_percent: 15,
      supported_slots: ['lunch', 'dinner', 'both'],
      cycle_days: 28,
      is_active: true
    },
    {
      id: 'sub_plan_04',
      name: 'Budget Veg Lunch — Weekday Plan',
      plan_type: 'student',
      base_price_per_meal: 89.00,
      plan_discount_percent: 20,
      supported_slots: ['lunch'],
      cycle_days: 28,
      is_active: true
    }
  ],
  manifest: {
    slot: 'lunch',
    date: new Date().toISOString().split('T')[0],
    total_tiffins: 48,
    grouped_by_area: {
      'Indiranagar': [
        {
          customer_name: 'Rahul Sharma',
          subscription_number: 'SUB-2026-8801',
          street_address: 'Flat 402, Green Glen Layout, 5th Cross',
          pincode: '560038',
          meal_name: 'Classic Daily Homestyle Tiffin Dabba',
          quantity: 2,
          delivery_slot: 'lunch',
          special_instructions: 'Steel Dabba Exchange'
        },
        {
          customer_name: 'Amitabh Sengupta',
          subscription_number: 'SUB-2026-8809',
          street_address: '14, 1st Cross, HAL 2nd Stage',
          pincode: '560038',
          meal_name: 'Special Paneer Subzi Tiffin Meal',
          quantity: 1,
          delivery_slot: 'lunch',
          special_instructions: 'Leave at security'
        }
      ],
      'Domlur & EGL': [
        {
          customer_name: 'Sneha Rao',
          subscription_number: 'SUB-2026-8814',
          street_address: 'Tower B, Embassy Golf Links',
          pincode: '560071',
          meal_name: 'Classic Daily Homestyle Tiffin Dabba',
          quantity: 1,
          delivery_slot: 'lunch',
          special_instructions: 'Ring bell twice'
        }
      ]
    },
    delivery_batches: [
      {
        batch_id: 'batch_indiranagar_01',
        route_name: 'Indiranagar Stage 1 & 2',
        driver_name: 'Vikram Jadhav',
        driver_phone: '+91 98765 43225',
        boxes_count: 26,
        status: 'assigned',
        deliveries: [
          { address: 'Flat 402, Green Glen Layout, 5th Cross', recipient: 'Rahul Sharma', meal: 'Classic Tiffin (2)' },
          { address: '14, 1st Cross, HAL 2nd Stage', recipient: 'Amitabh Sengupta', meal: 'Classic Tiffin (1)' }
        ]
      },
      {
        batch_id: 'batch_hal_02',
        route_name: 'Domlur & HAL Old Airport Road',
        driver_name: 'Suresh Patil',
        driver_phone: '+91 98765 43226',
        boxes_count: 22,
        status: 'in_transit',
        deliveries: [
          { address: 'Tower B, Embassy Golf Links', recipient: 'Sneha Rao', meal: 'Special Paneer Tiffin (1)' }
        ]
      }
    ]
  },
  earnings: {
    summary: {
      gross_revenue: 168400,
      platform_fee_percent: 10,
      net_payout: 151560
    },
    total_revenue: 168400,
    platform_commission: 16840,
    net_payout: 151560,
    pending_payout: 18450,
    settlement_status: 'On-schedule (Next cycle tomorrow 10:00 AM)',
    recent_orders: [
      { id: 'ord_kitch_01', order_number: 'FB-2026-9012', grand_total: 275.00, created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
      { id: 'ord_kitch_02', order_number: 'FB-2026-9015', grand_total: 340.00, created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
      { id: 'ord_kitch_03', order_number: 'FB-2026-8998', grand_total: 155.00, created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString() }
    ],
    recent_transactions: [
      { id: 'txn_01', date: '2026-10-10', amount: 8940, type: 'Credit (Daily Batch Settlement)', status: 'settled' },
      { id: 'txn_02', date: '2026-10-09', amount: 8420, type: 'Credit (Daily Batch Settlement)', status: 'settled' },
      { id: 'txn_03', date: '2026-10-08', amount: 9150, type: 'Credit (Daily Batch Settlement)', status: 'settled' }
    ]
  },
  settings: {
    business_name: 'Annapurna Homestyle Tiffin Ghar',
    area: 'Indiranagar',
    operating_hours: '07:00 AM - 10:00 PM',
    operating_address: '24/1, 2nd Main, HAL 2nd Stage, Indiranagar',
    preparation_cutoff_lunch_time: '08:30:00',
    preparation_cutoff_dinner_time: '16:00:00',
    fssai_number: '11223344556677',
    is_accepting_orders: true,
    auto_accept_subscriptions: true
  }
};

export const FALLBACK_ADMIN_DASHBOARD = {
  metrics: {
    platform_gross_merchandise_value_inr: 1894200,
    platform_gmv: 1894200,
    pending_verification_sellers: 2,
    pending_verifications: 2,
    approved_sellers_count: 14,
    active_kitchens: 14,
    total_orders_count: 12480,
    total_orders: 12480,
    active_subscriptions_count: 420,
    active_subscriptions: 420,
    total_users: 1840
  },
  sellers: [
    {
      id: 'seller_01',
      business_name: 'Annapurna Homestyle Tiffin Ghar',
      owner_name: 'Savitri Bai Deshmukh',
      kitchen_type: 'commercial_tiffin',
      area: 'Indiranagar',
      fssai_number: '11223344556677',
      fssai_expiry_date: '2028-12-31',
      verification_status: 'approved',
      rating: 4.85,
      rating_count: 240,
      created_at: '2026-01-15'
    },
    {
      id: 'seller_02',
      business_name: 'Pind Da Dhaba & Bowls',
      owner_name: 'Chef Harpreet Singh',
      kitchen_type: 'restaurant',
      area: 'Indiranagar',
      fssai_number: '11523344556688',
      fssai_expiry_date: '2027-11-20',
      verification_status: 'approved',
      rating: 4.78,
      rating_count: 310,
      created_at: '2026-01-20'
    },
    {
      id: 'seller_pending_01',
      business_name: 'Urban Spices Cloud Kitchen (Pending Review)',
      owner_name: 'Ramesh Patel',
      kitchen_type: 'home_chef_cloud',
      area: 'Marathahalli',
      fssai_number: '11998877665544',
      fssai_expiry_date: '2028-05-20',
      verification_status: 'pending_approval',
      rating: 0.0,
      rating_count: 0,
      created_at: '2026-10-09'
    }
  ],
  users: [
    {
      id: 'user_cust_01',
      full_name: 'Rahul Sharma',
      email: 'rahul@fitbite.demo',
      phone: '+91 98765 43210',
      role: 'customer',
      is_active: true,
      created_at: '2026-01-10'
    },
    {
      id: 'user_cust_family',
      full_name: 'Pooja & Aniket Kulkarni',
      email: 'family@fitbite.demo',
      phone: '+91 98765 43211',
      role: 'customer',
      is_active: true,
      created_at: '2026-01-12'
    },
    {
      id: 'user_sell_01',
      full_name: 'Savitri Bai Deshmukh',
      email: 'seller@fitbite.demo',
      phone: '+91 98765 43212',
      role: 'seller',
      is_active: true,
      created_at: '2026-01-05'
    },
    {
      id: 'user_adm_01',
      full_name: 'FitBite Compliance Desk',
      email: 'admin@fitbite.demo',
      phone: '+91 98765 43299',
      role: 'admin',
      is_active: true,
      created_at: '2026-01-01'
    }
  ],
  orders: [
    {
      id: 'ord_adm_01',
      order_number: 'FB-2026-9012',
      customer_name: 'Rahul Sharma',
      seller_name: 'Annapurna Homestyle Tiffin Ghar',
      status: 'preparing',
      total_amount: 275.00,
      payment_status: 'paid',
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    },
    {
      id: 'ord_adm_02',
      order_number: 'FB-2026-9015',
      customer_name: 'Pooja Kulkarni',
      seller_name: 'Annapurna Homestyle Tiffin Ghar',
      status: 'confirmed',
      total_amount: 340.00,
      payment_status: 'paid',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    }
  ],
  auditLogs: [
    {
      id: 'log_01',
      action: 'seller_verified',
      details: 'Approved Annapurna Homestyle Tiffin Ghar (FSSAI: 11223344556677 verified)',
      performed_by: 'admin@fitbite.demo',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'log_02',
      action: 'system_health_check',
      details: 'All automated dispatch zones operating normally',
      performed_by: 'system_monitor',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  ]
};

/**
 * Resolves a mock fallback response for any route when remote backend is offline
 */
export function getFallbackApiResponse(path, options = {}) {
  const url = path.split('?')[0];

  // --- Offline Authentication Endpoints ---
  if (url.includes('/api/auth/login')) {
    let email = 'customer@fitbite.demo';
    let role = 'customer';
    try {
      if (options.body) {
        const parsed = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        if (parsed.email) email = parsed.email;
        if (parsed.requested_role) role = parsed.requested_role;
      }
    } catch (e) {}
    const session = getFallbackAuthSession(email, role);
    return {
      message: 'Signed in successfully via hardcoded access',
      token: session.token,
      user: session.user,
      customerProfile: session.customerProfile,
      sellerProfile: session.sellerProfile,
      preferences: session.preferences
    };
  }

  if (url.includes('/api/auth/register-customer')) {
    let email = 'customer@fitbite.demo';
    let fullName = 'FitBite Customer';
    let phone = '+91 98765 43210';
    try {
      if (options.body) {
        const parsed = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        if (parsed.email) email = parsed.email;
        if (parsed.full_name) fullName = parsed.full_name;
        if (parsed.phone) phone = parsed.phone;
      }
    } catch (e) {}
    const session = getFallbackAuthSession(email, 'customer');
    session.user.full_name = fullName;
    session.user.phone = phone;
    return {
      message: 'Account created successfully (offline session)',
      token: session.token,
      user: session.user,
      customerProfile: session.customerProfile
    };
  }

  if (url.includes('/api/auth/register-seller')) {
    let email = 'kitchen@fitbite.demo';
    let bizName = 'FitBite Partner Kitchen';
    try {
      if (options.body) {
        const parsed = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        if (parsed.email) email = parsed.email;
        if (parsed.business_name) bizName = parsed.business_name;
      }
    } catch (e) {}
    const session = getFallbackAuthSession(email, 'seller');
    session.sellerProfile.business_name = bizName;
    return {
      message: 'Kitchen registered successfully (offline session)',
      token: session.token,
      user: session.user,
      seller: session.sellerProfile
    };
  }

  if (url.includes('/api/auth/me')) {
    const cached = getStoredAuthSession();
    if (cached) return cached;
    return getFallbackAuthSession('rahul@fitbite.demo', 'customer');
  }

  if (url.includes('/api/auth/logout')) {
    return { message: 'Logged out successfully' };
  }

  if (url.includes('/api/catalog/categories')) {
    return FALLBACK_CATEGORIES;
  }
  if (url.includes('/api/catalog/sellers')) {
    return FALLBACK_SELLERS;
  }
  if (url.includes('/api/catalog/meals')) {
    return FALLBACK_MEALS;
  }
  if (url.includes('/api/catalog/customization-options/calculate')) {
    return {
      price: 185,
      calories: 540,
      protein: 24,
      carbs: 65,
      fat: 14,
      breakdown: { base_price: 120, delta_price: 65 }
    };
  }
  if (url.includes('/api/catalog/customization-options')) {
    return { grouped: FALLBACK_CUSTOMIZATION_OPTIONS };
  }
  if (url.includes('/api/subscriptions/plans')) {
    return FALLBACK_SUBSCRIPTION_PLANS;
  }
  if (url.includes('/api/subscriptions/my')) {
    return [
      {
        id: 'sub_demo_01',
        plan_id: 'sub_plan_01',
        plan: FALLBACK_SUBSCRIPTION_PLANS[0],
        seller: FALLBACK_SELLERS[0],
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        slot: 'lunch',
        meals_remaining: 24,
        total_cycle_days: 28
      }
    ];
  }
  if (url.includes('/api/orders/my')) {
    return FALLBACK_ORDERS;
  }
  if (url.includes('/api/seller/overview')) {
    return FALLBACK_SELLER_DASHBOARD.overview;
  }
  if (url.includes('/api/seller/orders')) {
    return FALLBACK_SELLER_DASHBOARD.orders;
  }
  if (url.includes('/api/seller/meals')) {
    return FALLBACK_SELLER_DASHBOARD.meals;
  }
  if (url.includes('/api/seller/plans')) {
    return FALLBACK_SELLER_DASHBOARD.plans;
  }
  if (url.includes('/api/seller/batch-manifest')) {
    return FALLBACK_SELLER_DASHBOARD.manifest;
  }
  if (url.includes('/api/seller/earnings')) {
    return FALLBACK_SELLER_DASHBOARD.earnings;
  }
  if (url.includes('/api/seller/settings')) {
    return FALLBACK_SELLER_DASHBOARD.settings;
  }
  if (url.includes('/api/admin/metrics')) {
    return FALLBACK_ADMIN_DASHBOARD.metrics;
  }
  if (url.includes('/api/admin/sellers')) {
    return FALLBACK_ADMIN_DASHBOARD.sellers;
  }
  if (url.includes('/api/admin/users')) {
    return FALLBACK_ADMIN_DASHBOARD.users;
  }
  if (url.includes('/api/admin/orders')) {
    return FALLBACK_ADMIN_DASHBOARD.orders;
  }
  if (url.includes('/api/admin/audit-logs')) {
    return FALLBACK_ADMIN_DASHBOARD.auditLogs;
  }
  if (url.includes('/api/users/addresses')) {
    return [
      {
        id: 'addr_01',
        label: 'Apartment',
        recipient_name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        street_address: 'Flat 402, Green Glen Layout, 5th Cross',
        area: 'Indiranagar',
        city: 'Bengaluru',
        pincode: '560038',
        is_default: true,
        exchange_steel_dabba: true
      }
    ];
  }

  return null;
}
