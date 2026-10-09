// Generates 28 days of rotational lunch and dinner menus for active tiffin sellers

export function generateDailyTiffinMenus(sellerIds, mealsList) {
  const menus = [];
  const tiffinMeals = mealsList.filter(m => m.is_tiffin_eligible);

  // Generate 28 dates starting from current day
  const today = new Date();
  
  for (const sellerId of sellerIds) {
    const sellerMeals = tiffinMeals.filter(m => m.seller_id === sellerId);
    const pool = sellerMeals.length > 0 ? sellerMeals : tiffinMeals;

    for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
      const dateObj = new Date(today);
      dateObj.setDate(today.getDate() + dayOffset);
      const dateStr = dateObj.toISOString().split('T')[0];

      if (pool.length === 0) continue;

      // Lunch
      const lunchMeal = pool[(dayOffset * 2) % pool.length];
      const altLunchMeal = pool[(dayOffset * 2 + 1) % pool.length] || lunchMeal;

      menus.push({
        id: `dtm_${sellerId}_${dateStr}_lunch`,
        seller_id: sellerId,
        menu_date: dateStr,
        slot: 'lunch',
        meal_id: lunchMeal.id,
        alternative_meal_id: altLunchMeal.id,
        notes: `Freshly cooked lunch for ${dateStr}`
      });

      // Dinner
      const dinnerMeal = pool[(dayOffset * 2 + 2) % pool.length];
      const altDinnerMeal = pool[(dayOffset * 2 + 3) % pool.length];

      menus.push({
        id: `dtm_${sellerId}_${dateStr}_dinner`,
        seller_id: sellerId,
        menu_date: dateStr,
        slot: 'dinner',
        meal_id: dinnerMeal.id,
        alternative_meal_id: altDinnerMeal.id,
        notes: `Homestyle evening dinner for ${dateStr}`
      });
    }
  }

  return menus;
}
