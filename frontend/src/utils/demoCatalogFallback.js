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

const fallbackBases = [
  { id: 'opt_base_01', name: 'Base Choice', group_type: 'base', item_choice: 'Steamed Basmati Rice', price_delta: 0.00, calorie_delta: 180, protein_delta: 3.5, carbs_delta: 38.0, fat_delta: 0.5, is_default: true, display_order: 1 },
  { id: 'opt_base_02', name: 'Base Choice', group_type: 'base', item_choice: 'Brown Rice', price_delta: 20.00, calorie_delta: 165, protein_delta: 4.0, carbs_delta: 34.0, fat_delta: 1.2, is_default: false, display_order: 2 },
  { id: 'opt_base_03', name: 'Base Choice', group_type: 'base', item_choice: 'Multigrain Phulka (3 Pcs)', price_delta: 15.00, calorie_delta: 195, protein_delta: 6.2, carbs_delta: 36.0, fat_delta: 1.5, is_default: false, display_order: 3 },
  { id: 'opt_base_04', name: 'Base Choice', group_type: 'base', item_choice: 'Foxtail Millet Khichdi', price_delta: 25.00, calorie_delta: 150, protein_delta: 5.0, carbs_delta: 28.0, fat_delta: 1.0, is_default: false, display_order: 4 }
];

const fallbackProteins = [
  { id: 'opt_prot_01', name: 'Protein Core', group_type: 'protein', item_choice: 'Fresh Malai Paneer Cubes (120g)', price_delta: 45.00, calorie_delta: 260, protein_delta: 18.5, carbs_delta: 4.0, fat_delta: 18.0, is_default: false, display_order: 1 },
  { id: 'opt_prot_02', name: 'Protein Core', group_type: 'protein', item_choice: 'Organic Spiced Tofu (130g)', price_delta: 40.00, calorie_delta: 180, protein_delta: 16.0, carbs_delta: 3.0, fat_delta: 10.0, is_default: false, display_order: 2 },
  { id: 'opt_prot_03', name: 'Protein Core', group_type: 'protein', item_choice: 'Two Farm Boiled Eggs', price_delta: 35.00, calorie_delta: 145, protein_delta: 13.0, carbs_delta: 1.0, fat_delta: 9.5, is_default: false, display_order: 3 },
  { id: 'opt_prot_04', name: 'Protein Core', group_type: 'protein', item_choice: 'Grilled Herb Chicken Breast (140g)', price_delta: 65.00, calorie_delta: 210, protein_delta: 27.0, carbs_delta: 0.0, fat_delta: 4.5, is_default: false, display_order: 4 }
];

const fallbackSides = [
  { id: 'opt_side_01', name: 'Side Vegetable', group_type: 'side', item_choice: 'Roasted Seasonal Vegetables', price_delta: 0.00, calorie_delta: 75, protein_delta: 2.5, carbs_delta: 11.0, fat_delta: 1.5, is_default: true, display_order: 1 },
  { id: 'opt_side_02', name: 'Side Vegetable', group_type: 'side', item_choice: 'Homestyle Bhindi Masala', price_delta: 15.00, calorie_delta: 85, protein_delta: 2.0, carbs_delta: 10.0, fat_delta: 3.5, is_default: false, display_order: 2 },
  { id: 'opt_side_03', name: 'Side Vegetable', group_type: 'side', item_choice: 'Steamed Broccoli & French Beans', price_delta: 25.00, calorie_delta: 55, protein_delta: 3.5, carbs_delta: 7.0, fat_delta: 0.5, is_default: false, display_order: 3 }
];

const fallbackSpices = [
  { id: 'opt_spc_01', name: 'Spice Level', group_type: 'spice', item_choice: 'Mild (Low Chili, Fragrant)', price_delta: 0.00, calorie_delta: 0, protein_delta: 0.0, carbs_delta: 0.0, fat_delta: 0.0, is_default: false, display_order: 1 },
  { id: 'opt_spc_02', name: 'Spice Level', group_type: 'spice', item_choice: 'Medium (Balanced Indian Spicing)', price_delta: 0.00, calorie_delta: 0, protein_delta: 0.0, carbs_delta: 0.0, fat_delta: 0.0, is_default: true, display_order: 2 },
  { id: 'opt_spc_03', name: 'Spice Level', group_type: 'spice', item_choice: 'Hot (Extra Green Chilies)', price_delta: 0.00, calorie_delta: 5, protein_delta: 0.0, carbs_delta: 1.0, fat_delta: 0.0, is_default: false, display_order: 3 }
];

const fallbackSauces = [
  { id: 'opt_sau_01', name: 'Curry / Sauce', group_type: 'sauce', item_choice: 'Yellow Tadka Dal', price_delta: 0.00, calorie_delta: 110, protein_delta: 6.0, carbs_delta: 15.0, fat_delta: 2.5, is_default: true, display_order: 1 },
  { id: 'opt_sau_02', name: 'Curry / Sauce', group_type: 'sauce', item_choice: 'Velvety Makhani Gravy', price_delta: 25.00, calorie_delta: 160, protein_delta: 3.5, carbs_delta: 10.0, fat_delta: 11.0, is_default: false, display_order: 2 },
  { id: 'opt_sau_03', name: 'Curry / Sauce', group_type: 'sauce', item_choice: 'Coconut Herb Stew', price_delta: 20.00, calorie_delta: 135, protein_delta: 2.5, carbs_delta: 8.0, fat_delta: 9.5, is_default: false, display_order: 3 }
];

const fallbackExtras = [
  { id: 'opt_ext_01', name: 'Add-on Extra', group_type: 'extra', item_choice: 'Extra Phulka Roti (+1 Pc)', price_delta: 12.00, calorie_delta: 65, protein_delta: 2.0, carbs_delta: 12.0, fat_delta: 0.5, is_default: false, display_order: 1 },
  { id: 'opt_ext_02', name: 'Add-on Extra', group_type: 'extra', item_choice: 'Fresh Thick Curd Bowl (100g)', price_delta: 25.00, calorie_delta: 70, protein_delta: 4.5, carbs_delta: 5.0, fat_delta: 3.0, is_default: false, display_order: 2 },
  { id: 'opt_ext_03', name: 'Add-on Extra', group_type: 'extra', item_choice: 'Roasted Papad & Kachumber Salad', price_delta: 20.00, calorie_delta: 40, protein_delta: 1.5, carbs_delta: 6.0, fat_delta: 0.5, is_default: false, display_order: 3 }
];

const fallbackRemovals = [
  { id: 'opt_rem_01', name: 'Ingredient Removal', group_type: 'removal', item_choice: 'No Onion', price_delta: 0.00, calorie_delta: -15, protein_delta: 0.0, carbs_delta: -3.0, fat_delta: 0.0, is_default: false, display_order: 1 },
  { id: 'opt_rem_02', name: 'Ingredient Removal', group_type: 'removal', item_choice: 'No Garlic', price_delta: 0.00, calorie_delta: -5, protein_delta: 0.0, carbs_delta: -1.0, fat_delta: 0.0, is_default: false, display_order: 2 },
  { id: 'opt_rem_03', name: 'Ingredient Removal', group_type: 'removal', item_choice: 'Less Cooking Oil', price_delta: 0.00, calorie_delta: -60, protein_delta: 0.0, carbs_delta: 0.0, fat_delta: -7.0, is_default: false, display_order: 3 }
];

export const FALLBACK_CUSTOMIZATION_OPTIONS = {
  bases: fallbackBases,
  base: fallbackBases,
  proteins: fallbackProteins,
  protein: fallbackProteins,
  sides: fallbackSides,
  side: fallbackSides,
  spices: fallbackSpices,
  spice: fallbackSpices,
  sauces: fallbackSauces,
  sauce: fallbackSauces,
  extras: fallbackExtras,
  extra: fallbackExtras,
  removals: fallbackRemovals,
  removal: fallbackRemovals
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


export const FALLBACK_7_DAY_MEAL_PLAN = {
  planTitle: 'Personalized 7-Day Precision Nutrition Plan',
  summary: 'Engineered daily calorie & macronutrient allocations using balanced homestyle rotis, lentils, lean proteins and clean complex grains.',
  targetGoal: 'BALANCED',
  targetProfile: {
    targetCalories: 2050,
    targetProteinGrams: 85,
    targetCarbsGrams: 230,
    targetFatGrams: 52,
    bmr: 1650,
    tdee: 2150,
    goalDescription: 'Sustained daily vitality & balanced metabolic conditioning'
  },
  schedule: [
    {
      dayNumber: 1,
      dayName: 'Monday',
      totalCalories: 2020,
      totalProtein: 86,
      totalCarbs: 226,
      totalFat: 50,
      estimatedCost: 480,
      meals: {
        breakfast: {
          id: 'meal_04',
          name: 'Fluffy Steamed Idli & Medu Vada Combo',
          calories: 420,
          protein_g: 14,
          carbs_g: 65,
          fat_g: 10,
          base_price: 110,
          kitchen_name: 'Dakshin Flavors Mess',
          image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600',
          description: 'Fluffy steamed rice idlis with crispy medu vada, fresh coconut chutney & piping hot sambar.',
          rationale: 'Slow-fermented rice & lentil cakes providing sustained morning glucose and healthy gut flora.',
          swap_options: [{ id: 'meal_05', name: 'Nagpur Tarri Poha with Sprouts', calories: 380, protein_g: 12, carbs_g: 58, fat_g: 8, base_price: 90, kitchen_name: 'Swad Sugandh Kitchen', image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600' }]
        },
        lunch: {
          id: 'meal_01',
          name: 'Deluxe Homestyle North Indian Thali',
          calories: 680,
          protein_g: 28,
          carbs_g: 78,
          fat_g: 18,
          base_price: 180,
          kitchen_name: 'Annapurna Homestyle Tiffin Ghar',
          image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600',
          description: '4 hot whole-wheat phulkas, slow-simmered dal tadka, seasonal subzi, paneer bhurji, basmati rice & salad.',
          rationale: 'Balanced distribution of whole wheat complex carbs and dairy casein protein for afternoon stamina.',
          swap_options: [{ id: 'meal_02', name: 'Dal Makhani & Jeera Rice Bowl', calories: 610, protein_g: 20, carbs_g: 72, fat_g: 16, base_price: 160, kitchen_name: 'Pind Da Dhaba', image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600' }]
        },
        dinner: {
          id: 'meal_06',
          name: 'High-Protein Paneer Bhurji & Multigrain Phulkas',
          calories: 590,
          protein_g: 34,
          carbs_g: 48,
          fat_g: 15,
          base_price: 210,
          kitchen_name: 'FitProtein Kitchens',
          image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600',
          description: 'Fresh cottage cheese scramble with bell peppers, 3 multigrain phulkas & sprout salad.',
          rationale: 'Nighttime slow-digesting protein aiding overnight tissue regeneration and muscle synthesis.',
          swap_options: [{ id: 'meal_03', name: 'Pithla Bhakri with Thecha', calories: 540, protein_g: 16, carbs_g: 65, fat_g: 14, base_price: 150, kitchen_name: 'Swad Sugandh Kitchen', image_url: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?w=600' }]
        },
        snack: {
          id: 'meal_17',
          name: 'Roasted Spiced Makhana & Sprout Bowl',
          calories: 190,
          protein_g: 10,
          carbs_g: 26,
          fat_g: 4,
          base_price: 70,
          kitchen_name: 'FitProtein Kitchens',
          image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
          description: 'Crunchy slow-roasted fox nuts tossed in Himalayan pink salt and roasted cumin.',
          rationale: 'Low-calorie crunchy snack to curb afternoon cravings.'
        }
      }
    },
    {
      dayNumber: 2,
      dayName: 'Tuesday',
      totalCalories: 2060,
      totalProtein: 88,
      totalCarbs: 230,
      totalFat: 51,
      estimatedCost: 490,
      meals: {
        breakfast: {
          id: 'meal_05',
          name: 'Nagpur Tarri Poha with Sprouts',
          calories: 410,
          protein_g: 14,
          carbs_g: 64,
          fat_g: 9,
          base_price: 90,
          kitchen_name: 'Swad Sugandh Kitchen',
          image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600',
          description: 'Flattened rice tossed with roasted peanuts, mustard seeds, curry leaves, topped with crunchy moong sprouts.',
          rationale: 'Iron-rich breakfast with healthy plant fats from roasted peanuts.'
        },
        lunch: {
          id: 'meal_07',
          name: 'Quinoa & Grilled Paneer Power Bowl',
          calories: 640,
          protein_g: 32,
          carbs_g: 70,
          fat_g: 16,
          base_price: 240,
          kitchen_name: 'GreenLeaf Vegan Co.',
          image_url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600',
          description: 'Tri-color organic quinoa, spiced paneer cubes, roasted zucchini, cherry tomatoes & mint tahini.',
          rationale: 'Complete amino-acid profile from ancient grain quinoa and low-fat paneer.'
        },
        dinner: {
          id: 'meal_02',
          name: 'Dal Makhani & Jeera Rice Executive Meal',
          calories: 670,
          protein_g: 26,
          carbs_g: 78,
          fat_g: 18,
          base_price: 170,
          kitchen_name: 'Pind Da Dhaba',
          image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
          description: 'Slow-cooked black lentils overnight with aromatic cumin basmati, 2 whole wheat rotis and pickled onion.',
          rationale: 'Comforting soluble fiber and iron from whole black urad lentils.'
        },
        snack: {
          id: 'meal_19',
          name: 'Chilled Spiced Masala Buttermilk (Chaas)',
          calories: 90,
          protein_g: 6,
          carbs_g: 8,
          fat_g: 2,
          base_price: 40,
          kitchen_name: 'Annapurna Homestyle Tiffin Ghar',
          image_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600',
          description: 'Cultured churning buttermilk with toasted cumin, ginger, mint, and rock salt.',
          rationale: 'Hydrating natural probiotic drink supporting digestive enzymes.'
        }
      }
    },
    {
      dayNumber: 3,
      dayName: 'Wednesday',
      totalCalories: 2010,
      totalProtein: 84,
      totalCarbs: 228,
      totalFat: 48,
      estimatedCost: 470,
      meals: {
        breakfast: {
          id: 'meal_04',
          name: 'Fluffy Steamed Idli & Sambar Bowl',
          calories: 390,
          protein_g: 13,
          carbs_g: 62,
          fat_g: 8,
          base_price: 95,
          kitchen_name: 'Dakshin Flavors Mess',
          image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600',
          description: 'Three steamed idlis soaked in drumstick lentil sambar with coconut chutney.',
          rationale: 'Zero oil steam-cooked breakfast that provides rapid digestion and glycogen replenishment.'
        },
        lunch: {
          id: 'meal_01',
          name: 'Homestyle Rajma Chawal & Phulka Meal',
          calories: 680,
          protein_g: 27,
          carbs_g: 82,
          fat_g: 14,
          base_price: 175,
          kitchen_name: 'Annapurna Homestyle Tiffin Ghar',
          image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600',
          description: 'Kashmiri red kidney beans slow-simmered in ginger-tomato gravy, steamed rice, 2 rotis and kachumber.',
          rationale: 'High dietary fiber and potassium reducing mid-week fatigue.'
        },
        dinner: {
          id: 'meal_08',
          name: 'Tofu Bhurji & Methi Thepla Tiffin',
          calories: 580,
          protein_g: 31,
          carbs_g: 48,
          fat_g: 16,
          base_price: 195,
          kitchen_name: 'GreenLeaf Vegan Co.',
          image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
          description: 'Soya bean paneer scramble with freshly plucked fenugreek leaves, 3 theplas & garlic chutney.',
          rationale: 'Clean vegan protein packed with micronutrients and iron from fresh fenugreek.'
        },
        snack: {
          id: 'meal_17',
          name: 'Roasted Spiced Makhana Bowl',
          calories: 180,
          protein_g: 8,
          carbs_g: 25,
          fat_g: 3,
          base_price: 65,
          kitchen_name: 'FitProtein Kitchens',
          image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
          description: 'Crispy lotus seeds seasoned with Himalayan pink salt.',
          rationale: 'Satisfies evening crunch without unneeded saturated fats.'
        }
      }
    },
    {
      dayNumber: 4,
      dayName: 'Thursday',
      totalCalories: 2040,
      totalProtein: 89,
      totalCarbs: 224,
      totalFat: 50,
      estimatedCost: 485,
      meals: {
        breakfast: {
          id: 'meal_10',
          name: 'Sprouted Moong & Egg White Scramble Box',
          calories: 430,
          protein_g: 26,
          carbs_g: 38,
          fat_g: 10,
          base_price: 130,
          kitchen_name: 'FitProtein Kitchens',
          image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600',
          description: 'Sprouted green gram steamed with coriander, lemon and scrambled farm eggs, served with toasted sourdough.',
          rationale: 'B-complex rich breakfast kicking off high metabolic turnover.'
        },
        lunch: {
          id: 'meal_03',
          name: 'Authentic Maharashtrian Pithla Bhakri Thali',
          calories: 660,
          protein_g: 22,
          carbs_g: 74,
          fat_g: 16,
          base_price: 165,
          kitchen_name: 'Swad Sugandh Kitchen',
          image_url: 'https://images.unsplash.com/photo-1606471191009-63994c53433b?w=600',
          description: 'Traditional gram-flour curry with 2 hot Jowar (sorghum) bhakris, fiery green chilli thecha & raw onion.',
          rationale: 'Gluten-free sorghum millet providing slow-burning energy.'
        },
        dinner: {
          id: 'meal_06',
          name: 'Paneer Tikka & Multigrain Phulka Tiffin',
          calories: 610,
          protein_g: 32,
          carbs_g: 52,
          fat_g: 17,
          base_price: 210,
          kitchen_name: 'FitProtein Kitchens',
          image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600',
          description: 'Clay-oven smoked paneer cubes, tossed capsicum, mint yogurt dip and 3 multigrain phulkas.',
          rationale: 'High calcium and anti-inflammatory curcumin from tandoori marinade.'
        },
        snack: {
          id: 'meal_19',
          name: 'Probiotic Mint Chaas & Roasted Flaxseeds',
          calories: 110,
          protein_g: 6,
          carbs_g: 8,
          fat_g: 3,
          base_price: 45,
          kitchen_name: 'Annapurna Homestyle Tiffin Ghar',
          image_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600',
          description: 'Freshly churned yoghurt chaas with roasted omega-3 flax seeds.',
          rationale: 'Gut-nourishing probiotics paired with essential alpha-linolenic fatty acids.'
        }
      }
    },
    {
      dayNumber: 5,
      dayName: 'Friday',
      totalCalories: 2090,
      totalProtein: 91,
      totalCarbs: 232,
      totalFat: 52,
      estimatedCost: 510,
      meals: {
        breakfast: {
          id: 'meal_05',
          name: 'Indori Poha with Sev & Sprouts',
          calories: 420,
          protein_g: 13,
          carbs_g: 66,
          fat_g: 11,
          base_price: 95,
          kitchen_name: 'Swad Sugandh Kitchen',
          image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600',
          description: 'Steamed flattened rice tossed with jeeravan spices, pomegranate pearls, topped with roasted sprouts.',
          rationale: 'Easy-to-digest carbohydrates to fuel the end of the workweek.'
        },
        lunch: {
          id: 'meal_13',
          name: 'Hyderabadi Soya & Paneer Dum Biryani',
          calories: 690,
          protein_g: 30,
          carbs_g: 78,
          fat_g: 18,
          base_price: 210,
          kitchen_name: 'Pind Da Dhaba',
          image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600',
          description: 'Long grain aged basmati layered with marinated soya chaap, mint, saffron, accompanied with cucumber raita.',
          rationale: 'Celebratory end-of-week homestyle biryani with 30g+ plant protein.'
        },
        dinner: {
          id: 'meal_01',
          name: 'Light Yellow Dal Tadka & Jeera Phulkas',
          calories: 560,
          protein_g: 24,
          carbs_g: 58,
          fat_g: 13,
          base_price: 160,
          kitchen_name: 'Annapurna Homestyle Tiffin Ghar',
          image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600',
          description: 'Comforting split yellow moong dal with cumin-garlic tadka, 3 phulkas, bottle gourd subzi and salad.',
          rationale: 'Light evening meal promoting peaceful sleep without digestive discomfort.'
        },
        snack: {
          id: 'meal_17',
          name: 'Crunchy Roasted Chana & Peanut Mix',
          calories: 190,
          protein_g: 11,
          carbs_g: 20,
          fat_g: 5,
          base_price: 65,
          kitchen_name: 'FitProtein Kitchens',
          image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
          description: 'Dry roasted Bengal gram tossed with rock salt and lemon juice.',
          rationale: 'High dietary fiber and copper for cellular health.'
        }
      }
    },
    {
      dayNumber: 6,
      dayName: 'Saturday',
      totalCalories: 2110,
      totalProtein: 93,
      totalCarbs: 235,
      totalFat: 53,
      estimatedCost: 520,
      meals: {
        breakfast: {
          id: 'meal_04',
          name: 'Onion Uttapam with Mixed Vegetable Sambar',
          calories: 440,
          protein_g: 15,
          carbs_g: 68,
          fat_g: 11,
          base_price: 115,
          kitchen_name: 'Dakshin Flavors Mess',
          image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600',
          description: 'Thick fermented rice & lentil pancake topped with diced onions, tomatoes and curry leaves.',
          rationale: 'Wholesome weekend breakfast rich in vegetable fiber and natural vitamins.'
        },
        lunch: {
          id: 'meal_07',
          name: 'Nutri-Max Paneer Tikka Rice Bowl',
          calories: 670,
          protein_g: 33,
          carbs_g: 72,
          fat_g: 17,
          base_price: 230,
          kitchen_name: 'FitProtein Kitchens',
          image_url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600',
          description: 'Charred paneer cubes on a bed of turmeric brown rice, sautéed greens and light yoghurt gravy.',
          rationale: 'Weekend refuel bowl for active sports, fitness, or weekend recovery.'
        },
        dinner: {
          id: 'meal_02',
          name: 'Chole Masala & Whole Wheat Bhature Swap',
          calories: 680,
          protein_g: 27,
          carbs_g: 82,
          fat_g: 17,
          base_price: 185,
          kitchen_name: 'Pind Da Dhaba',
          image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
          description: 'Spiced Amritsari chickpeas, 3 whole-wheat baked phulkas, carrot pickle and sliced red onion.',
          rationale: 'Clean chickpea dietary fiber for cholesterol control.'
        },
        snack: {
          id: 'meal_19',
          name: 'Cold Pressed Sweet Lime & Mint Refresher',
          calories: 120,
          protein_g: 3,
          carbs_g: 26,
          fat_g: 1,
          base_price: 60,
          kitchen_name: 'GreenLeaf Vegan Co.',
          image_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600',
          description: 'Fresh mosambi juice extracted without added sugar or ice.',
          rationale: 'Vitamin C antioxidant boost to combat metabolic stress.'
        }
      }
    },
    {
      dayNumber: 7,
      dayName: 'Sunday',
      totalCalories: 2040,
      totalProtein: 87,
      totalCarbs: 226,
      totalFat: 50,
      estimatedCost: 495,
      meals: {
        breakfast: {
          id: 'meal_05',
          name: 'Homestyle Methi Thepla & Fresh Curd',
          calories: 410,
          protein_g: 14,
          carbs_g: 60,
          fat_g: 10,
          base_price: 100,
          kitchen_name: 'Swad Sugandh Kitchen',
          image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600',
          description: 'Three thin whole wheat theplas infused with fenugreek greens and spices, served with fresh unflavored curd.',
          rationale: 'Soothing Sunday morning meal that primes the digestive tract.'
        },
        lunch: {
          id: 'meal_01',
          name: 'Sunday Special Homestyle Grand Thali',
          calories: 690,
          protein_g: 29,
          carbs_g: 79,
          fat_g: 18,
          base_price: 195,
          kitchen_name: 'Annapurna Homestyle Tiffin Ghar',
          image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600',
          description: 'Paneer makhani, dal tadka, aloo gobi, 4 soft phulkas, jeera rice, papad, and a warm jaggery gulab jamun.',
          rationale: 'Satisfying Sunday feast with mindful macronutrient ratios.'
        },
        dinner: {
          id: 'meal_06',
          name: 'Light Moong Dal Khichdi & Desi Ghee Drizzle',
          calories: 550,
          protein_g: 22,
          carbs_g: 65,
          fat_g: 12,
          base_price: 140,
          kitchen_name: 'Annapurna Homestyle Tiffin Ghar',
          image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600',
          description: 'A comforting blend of aged rice and split yellow moong, tempered with cumin and a spoonful of A2 cow ghee.',
          rationale: 'Ayurvedic gut-reset dinner preparing the body for the upcoming work week.'
        },
        snack: {
          id: 'meal_17',
          name: 'Roasted Spiced Makhana Bowl',
          calories: 180,
          protein_g: 8,
          carbs_g: 24,
          fat_g: 3,
          base_price: 65,
          kitchen_name: 'FitProtein Kitchens',
          image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600',
          description: 'Crispy lotus seeds with pink salt.',
          rationale: 'Light and mineral-rich evening treat.'
        }
      }
    }
  ]
};

// Fallback cart state holder for offline sessions
let localMemoryCartItems = [];


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
  // 1. Cart endpoints
  if (url.includes('/api/cart/add')) {
    let body = {};
    try {
      if (options && options.body) body = JSON.parse(options.body);
    } catch {}
    const mealId = body.meal_id || body.id || 'meal_01';
    const foundMeal = FALLBACK_MEALS.find(m => m.id === mealId) || FALLBACK_MEALS[0];
    const qty = parseInt(body.quantity, 10) || 1;
    const existingIndex = localMemoryCartItems.findIndex(i => i.meal_id === foundMeal.id);
    if (existingIndex >= 0) {
      localMemoryCartItems[existingIndex].quantity += qty;
      localMemoryCartItems[existingIndex].total_price = localMemoryCartItems[existingIndex].quantity * foundMeal.base_price;
    } else {
      localMemoryCartItems.push({
        id: 'cart_item_' + Date.now(),
        meal_id: foundMeal.id,
        meal_name_snapshot: foundMeal.name,
        meal_image_snapshot: foundMeal.image_url,
        unit_base_price: foundMeal.base_price,
        quantity: qty,
        portion_snapshot: body.portion || 'standard',
        customizations_snapshot: body.customizations || {},
        total_price: foundMeal.base_price * qty
      });
    }
    const subtotal = localMemoryCartItems.reduce((acc, i) => acc + (i.total_price || 0), 0);
    const count = localMemoryCartItems.reduce((acc, i) => acc + (i.quantity || 0), 0);
    return {
      success: true,
      message: 'Meal added to cart successfully',
      cart: {
        id: 'cart_demo',
        seller: FALLBACK_SELLERS[0],
        items: [...localMemoryCartItems],
        subtotal,
        item_count: count
      }
    };
  }

  if (url.includes('/api/cart/items/')) {
    const parts = url.split('/');
    const itemId = parts[parts.length - 1].split('?')[0];
    if (options.method === 'DELETE') {
      localMemoryCartItems = localMemoryCartItems.filter(i => i.id !== itemId && i.meal_id !== itemId);
    } else if (options.method === 'PUT') {
      let body = {};
      try { if (options.body) body = JSON.parse(options.body); } catch {}
      const target = localMemoryCartItems.find(i => i.id === itemId || i.meal_id === itemId);
      if (target) {
        target.quantity = body.quantity;
        target.total_price = target.unit_base_price * body.quantity;
      }
    }
    const subtotal = localMemoryCartItems.reduce((acc, i) => acc + (i.total_price || 0), 0);
    const count = localMemoryCartItems.reduce((acc, i) => acc + (i.quantity || 0), 0);
    return { success: true, items: [...localMemoryCartItems], subtotal, item_count: count };
  }

  if (url.includes('/api/cart/clear')) {
    localMemoryCartItems = [];
    return { success: true, message: 'Cart cleared' };
  }

  if (url.includes('/api/cart')) {
    if (localMemoryCartItems.length === 0) {
      localMemoryCartItems = [
        {
          id: 'cart_item_init_01',
          meal_id: FALLBACK_MEALS[0].id,
          meal_name_snapshot: FALLBACK_MEALS[0].name,
          meal_image_snapshot: FALLBACK_MEALS[0].image_url,
          unit_base_price: FALLBACK_MEALS[0].base_price,
          quantity: 1,
          portion_snapshot: 'standard',
          customizations_snapshot: {},
          total_price: FALLBACK_MEALS[0].base_price
        }
      ];
    }
    const subtotal = localMemoryCartItems.reduce((acc, i) => acc + (i.total_price || 0), 0);
    const count = localMemoryCartItems.reduce((acc, i) => acc + (i.quantity || 0), 0);
    return {
      id: 'cart_demo',
      seller: FALLBACK_SELLERS[0],
      items: [...localMemoryCartItems],
      subtotal,
      item_count: count
    };
  }

  // 2. Custom Meal Builder endpoints
  if (url.includes('/api/custom-meals/calculate') || url.includes('/api/custom-meals/recalculate') || url.includes('/api/catalog/customization-options/calculate')) {
    let body = {};
    try {
      if (options && options.body) body = JSON.parse(options.body);
    } catch {}
    const mealId = body.meal_id || body.base_meal_id || body.mealId || 'meal_01';
    const foundMeal = FALLBACK_MEALS.find(m => m.id === mealId) || FALLBACK_MEALS[0];
    const selections = body.selections || body || {};
    const portion = selections.portion || 'standard';
    let basePrice = parseFloat(foundMeal.base_price || 180);
    let delta = 0;
    if (portion === 'large') delta += 40;
    if (portion === 'fitness_mega') delta += 75;
    if (selections.extra_ids && Array.isArray(selections.extra_ids)) {
      delta += selections.extra_ids.length * 35;
    }
    const finalPrice = basePrice + delta;

    return {
      base_meal: {
        id: foundMeal.id,
        name: foundMeal.name,
        base_price: foundMeal.base_price,
        seller_id: foundMeal.seller_id
      },
      portion,
      calculated_price: finalPrice,
      price: finalPrice,
      estimated_calories: (foundMeal.calories || 520) + (portion === 'large' ? 120 : portion === 'fitness_mega' ? 240 : 40),
      estimated_protein: (foundMeal.protein_grams || 24) + (portion === 'fitness_mega' ? 15 : 6),
      estimated_carbs: (foundMeal.carbs_grams || 65) + 10,
      estimated_fat: (foundMeal.fat_grams || 14) + 4,
      applied_options: [
        { group: 'base', item: 'Organic Brown Rice Swap', price_delta: 20 },
        { group: 'protein', item: 'Fresh Malai Paneer', price_delta: 20 }
      ],
      selected_option_ids: ['opt_base_02', 'opt_prot_02'],
      removals: [],
      allergen_warnings: [],
      special_notes: selections.special_notes || null,
      breakdown: { base_price: basePrice, delta_price: delta }
    };
  }

  if (url.includes('/api/custom-meals/save')) {
    return {
      success: true,
      id: 'saved_custom_' + Date.now(),
      message: 'Custom meal saved to favorites!'
    };
  }

  // 3. Subscription & Tiffin Plans endpoints
  if (url.includes('/api/subscriptions/calculate')) {
    let body = {};
    try {
      if (options && options.body) body = JSON.parse(options.body);
    } catch {}
    const planId = body.plan_id || 'sub_plan_01';
    const slot = body.slot || 'both';
    const startDate = body.start_date || new Date().toISOString().split('T')[0];
    const plan = FALLBACK_SUBSCRIPTION_PLANS.find(p => p.id === planId) || FALLBACK_SUBSCRIPTION_PLANS[0];
    const seller = FALLBACK_SELLERS[0];
    const mealsPerDay = slot === 'both' ? 2 : 1;
    const deliveryDays = plan.cycle_days || 28;
    const totalMeals = deliveryDays * mealsPerDay;
    const basePrice = parseFloat(plan.base_price_per_meal || 160);
    const discountPercent = parseFloat(plan.plan_discount_percent || 15);
    const effectivePrice = Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100;
    const subtotal = Math.round(basePrice * totalMeals);
    const discountAmount = Math.round((subtotal - (effectivePrice * totalMeals)) * 100) / 100;
    const taxAmount = Math.round((effectivePrice * totalMeals) * 0.05 * 100) / 100;
    const grandTotal = Math.round(((effectivePrice * totalMeals) + taxAmount) * 100) / 100;
    const end = new Date(new Date(startDate).getTime() + (deliveryDays * 86400000)).toISOString().split('T')[0];

    return {
      plan,
      seller: { business_name: seller.business_name, area: seller.area },
      slot,
      start_date: startDate,
      end_date: end,
      delivery_days_count: deliveryDays,
      meals_per_day: mealsPerDay,
      total_meals_purchased: totalMeals,
      base_price_per_meal: basePrice,
      discount_percent: discountPercent,
      effective_price_per_meal: effectivePrice,
      subtotal,
      discount_amount: discountAmount,
      delivery_fee: 0,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      max_skips_allowed: plan.max_skips_allowed || 2,
      skip_policy: 'Up to 2 skip-days permitted per cycle. Each skip extends your end date by 1 day so no purchased meal is lost.',
      delivery_dates_preview: []
    };
  }

  if (url.includes('/api/subscriptions/create')) {
    return {
      success: true,
      subscription_id: 'sub_active_' + Date.now(),
      status: 'active',
      message: 'Tiffin subscription activated successfully! Your daily schedule is ready.'
    };
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
        slot: 'both',
        meals_remaining: 52,
        total_cycle_days: 28
      }
    ];
  }

  // 4. Meal Planner Service endpoints
  if (url.includes('/api/meal-plans/generate')) {
    return FALLBACK_7_DAY_MEAL_PLAN;
  }

  if (url.includes('/api/meal-plans/recommendations')) {
    return FALLBACK_MEALS.slice(0, 6);
  }

  // 5. Checkout & Orders endpoints
  if (url.includes('/api/orders/calculate')) {
    let body = {};
    try {
      if (options && options.body) body = JSON.parse(options.body);
    } catch {}
    const subtotal = parseFloat(body.subtotal || 250);
    const coupon = (body.coupon_code || '').toUpperCase();
    let discount = 0;
    let couponInfo = null;
    if (coupon === 'WELCOME50' || coupon === 'FITBITE50') {
      discount = Math.min(50, Math.round(subtotal * 0.2));
      couponInfo = { code: coupon, discount_amount: discount };
    }
    const taxes = Math.round(subtotal * 0.05 * 100) / 100;
    const delivery = 0; // free delivery
    return {
      subtotal,
      discount_amount: discount,
      tax_amount: taxes,
      delivery_fee: delivery,
      grand_total: Math.round((subtotal - discount + taxes + delivery) * 100) / 100,
      coupon: couponInfo
    };
  }

  if (url.includes('/api/orders/checkout')) {
    localMemoryCartItems = [];
    return {
      success: true,
      order_id: 'ord_demo_' + Date.now(),
      status: 'confirmed',
      message: 'Order placed successfully! Kitchen has received your ticket.'
    };
  }

  if (url.includes('/api/orders/my')) {
    return FALLBACK_ORDERS;
  }

  if (url.includes('/api/catalog/customization-options')) {
    return { grouped: FALLBACK_CUSTOMIZATION_OPTIONS };
  }

  // 6. Kitchen Portal (/seller) endpoints
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

  // 7. Admin Portal (/admin) endpoints
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

  // 8. User Addresses
  if (url.includes('/api/users/addresses')) {
    return [
      {
        id: 'addr_01',
        label: 'Apartment',
        recipient_name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        street_address: 'Flat 402, Green Glen Layout, 5th Cross',
        address_line1: 'Flat 402, Green Glen Layout, 5th Cross',
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
