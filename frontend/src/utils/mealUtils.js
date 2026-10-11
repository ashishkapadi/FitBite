/**
 * FitBite Meal Normalization & Availability Utilities
 */

/**
 * Normalizes availability flag from MySQL (TINYINT 1 vs 0, boolean, or numeric string).
 * Explicit normalization:
 * - 1, '1', true -> true
 * - 0, '0', false, null, undefined -> false
 * Never treats string "0" as available.
 */
export function isMealAvailable(meal) {
  if (!meal) return false;
  const val = meal.is_available;
  if (val === true || val === 1 || val === '1') return true;
  if (val === false || val === 0 || val === '0' || val === null || val === undefined) return false;
  return false;
}

/**
 * Normalizes is_featured flag (1, '1', true).
 */
export function isMealFeatured(meal) {
  if (!meal) return false;
  const val = meal.is_featured;
  return val === true || val === 1 || val === '1';
}

/**
 * Normalizes dietary tags into a clean array of lowercase or original strings.
 */
export function getDietaryTags(meal) {
  if (!meal || !meal.dietary_tags) return [];
  if (Array.isArray(meal.dietary_tags)) return meal.dietary_tags;
  if (typeof meal.dietary_tags === 'string') {
    try {
      const parsed = JSON.parse(meal.dietary_tags);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return meal.dietary_tags.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Safely extracts and normalizes meal properties for rendering without data loss.
 * - Resolves price from base_price or price. Does NOT substitute zero for invalid prices.
 * - Safely converts string rating/protein/calories without crashes.
 */
export function normalizeMealProps(meal) {
  if (!meal) return null;

  // 1. Price resolution
  const rawPrice = meal.base_price !== undefined && meal.base_price !== null
    ? meal.base_price
    : (meal.price !== undefined && meal.price !== null ? meal.price : null);

  const numericPrice = rawPrice !== null && !isNaN(parseFloat(rawPrice))
    ? parseFloat(rawPrice)
    : null;

  // 2. Rating resolution (handles MySQL strings like "4.80" safely)
  const rawRating = meal.rating !== undefined && meal.rating !== null && !isNaN(parseFloat(meal.rating))
    ? parseFloat(meal.rating)
    : 4.7;

  // 3. Nutrition resolution
  const rawCalories = meal.calories !== undefined && meal.calories !== null && !isNaN(parseInt(meal.calories, 10))
    ? parseInt(meal.calories, 10)
    : null;

  const rawProtein = meal.protein_grams !== undefined && meal.protein_grams !== null && !isNaN(parseFloat(meal.protein_grams))
    ? parseFloat(meal.protein_grams)
    : 0;

  // 4. Tags
  const tags = getDietaryTags(meal);
  const isVeg = tags.some(t => ['vegetarian', 'vegan', 'veg'].includes(t.toLowerCase()));
  const isHighProtein = rawProtein >= 20 || tags.some(t => t.toLowerCase().includes('protein'));

  return {
    ...meal,
    base_price: rawPrice,
    numeric_price: numericPrice,
    display_price: numericPrice !== null
      ? (Number.isInteger(numericPrice) ? numericPrice.toString() : numericPrice.toFixed(2).replace(/\.00$/, ''))
      : (rawPrice !== null ? String(rawPrice) : '--'),
    rating: rawRating,
    display_rating: rawRating.toFixed(1),
    calories: rawCalories,
    protein_grams: rawProtein,
    dietary_tags: tags,
    is_veg: isVeg,
    is_high_protein: isHighProtein,
    is_available: isMealAvailable(meal),
    is_featured: isMealFeatured(meal)
  };
}
