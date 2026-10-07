import express from 'express';
import { db } from '../db/db.js';

const router = express.Router();

// 1. Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.find('categories');
    categories.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Server error retrieving categories.' });
  }
});

// 2. Get approved & listed sellers
router.get('/sellers', async (req, res) => {
  try {
    const { kitchen_type, pincode, area } = req.query;

    let sellers = await db.find('seller_profiles', s => {
      // Security rule: Only approved and listed sellers are visible publicly
      if (s.verification_status !== 'approved' || !s.is_listed) return false;
      if (kitchen_type && s.kitchen_type !== kitchen_type) return false;
      if (area && s.area.toLowerCase() !== area.toLowerCase()) return false;
      if (pincode && s.pincodes_served && Array.isArray(s.pincodes_served) && !s.pincodes_served.includes(pincode)) {
        return false;
      }
      return true;
    });

    res.json(sellers);
  } catch (err) {
    console.error('Get sellers error:', err);
    res.status(500).json({ error: 'Server error retrieving sellers.' });
  }
});

// 3. Get single seller details by id
router.get('/sellers/:id', async (req, res) => {
  try {
    const seller = await db.findOne('seller_profiles', { id: req.params.id });
    if (!seller || seller.verification_status !== 'approved' || !seller.is_listed) {
      return res.status(404).json({ error: 'Kitchen not found or not currently active.' });
    }

    const meals = await db.find('meals', { seller_id: seller.id, is_available: true });

    res.json({
      seller,
      meals
    });
  } catch (err) {
    console.error('Get seller details error:', err);
    res.status(500).json({ error: 'Server error retrieving seller details.' });
  }
});

// 4. Get meals with rich filtering
router.get('/meals', async (req, res) => {
  try {
    const {
      category_id,
      category_slug,
      seller_id,
      cuisine,
      dietary,
      high_protein,
      tiffin_only,
      query,
      min_price,
      max_price,
      limit
    } = req.query;

    // Get list of active approved seller IDs
    const activeSellers = await db.find('seller_profiles', s => s.verification_status === 'approved' && s.is_listed);
    const activeSellerMap = new Map(activeSellers.map(s => [s.id, s]));

    // Resolve category_slug if passed
    let resolvedCategoryId = category_id;
    if (category_slug) {
      const cat = await db.findOne('categories', { slug: category_slug });
      if (cat) resolvedCategoryId = cat.id;
    }

    let meals = await db.find('meals', m => {
      // Must belong to an active, approved seller
      if (!activeSellerMap.has(m.seller_id)) return false;
      if (!m.is_available) return false;

      if (resolvedCategoryId && m.category_id !== resolvedCategoryId) return false;
      if (seller_id && m.seller_id !== seller_id) return false;
      if (cuisine && m.cuisine.toLowerCase() !== cuisine.toLowerCase()) return false;
      if (tiffin_only === 'true' && !m.is_tiffin_eligible) return false;

      if (dietary) {
        const dietLower = dietary.toLowerCase();
        const tags = (m.dietary_tags || []).map(t => t.toLowerCase());
        if (!tags.includes(dietLower)) return false;
      }

      if (high_protein === 'true') {
        if (!m.protein_grams || m.protein_grams < 20) return false;
      }

      if (min_price && m.base_price < parseFloat(min_price)) return false;
      if (max_price && m.base_price > parseFloat(max_price)) return false;

      if (query) {
        const q = query.toLowerCase().trim();
        const matchName = m.name.toLowerCase().includes(q);
        const matchDesc = m.description.toLowerCase().includes(q);
        const matchCuisine = m.cuisine.toLowerCase().includes(q);
        const matchSeller = (activeSellerMap.get(m.seller_id)?.business_name || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCuisine && !matchSeller) return false;
      }

      return true;
    });

    // Attach seller summary
    const enhancedMeals = meals.map(m => {
      const seller = activeSellerMap.get(m.seller_id);
      return {
        ...m,
        seller_name: seller ? seller.business_name : 'FitBite Partner Kitchen',
        seller_area: seller ? seller.area : 'Bengaluru',
        seller_rating: seller ? seller.rating : 4.8
      };
    });

    if (limit) {
      return res.json(enhancedMeals.slice(0, parseInt(limit, 10)));
    }

    res.json(enhancedMeals);
  } catch (err) {
    console.error('Get meals error:', err);
    res.status(500).json({ error: 'Server error retrieving meals.' });
  }
});

// 5. Get single meal details with customization options
router.get('/meals/:id', async (req, res) => {
  try {
    const meal = await db.findOne('meals', { id: req.params.id });
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found.' });
    }

    const seller = await db.findOne('seller_profiles', { id: meal.seller_id });
    const category = await db.findOne('categories', { id: meal.category_id });
    const customizationOptions = await db.find('customization_options');
    customizationOptions.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    res.json({
      ...meal,
      seller,
      category,
      available_customizations: customizationOptions
    });
  } catch (err) {
    console.error('Get meal details error:', err);
    res.status(500).json({ error: 'Server error retrieving meal details.' });
  }
});

// 6. Get all available customization options (Bases, Proteins, Sides, Spices, Sauces, Extras, Removals)
router.get('/customization-options', async (req, res) => {
  try {
    const options = await db.find('customization_options');
    options.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    // Group by group_type
    const grouped = {
      base: options.filter(o => o.group_type === 'base'),
      protein: options.filter(o => o.group_type === 'protein'),
      side: options.filter(o => o.group_type === 'side'),
      spice: options.filter(o => o.group_type === 'spice'),
      sauce: options.filter(o => o.group_type === 'sauce'),
      extra: options.filter(o => o.group_type === 'extra'),
      removal: options.filter(o => o.group_type === 'removal')
    };

    res.json({ options, grouped });
  } catch (err) {
    console.error('Get customization options error:', err);
    res.status(500).json({ error: 'Server error retrieving customization options.' });
  }
});

export default router;
