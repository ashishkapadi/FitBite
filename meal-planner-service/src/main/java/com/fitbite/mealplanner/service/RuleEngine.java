package com.fitbite.mealplanner.service;

import com.fitbite.mealplanner.model.CatalogMealDto;
import com.fitbite.mealplanner.model.MealPlanRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class RuleEngine {

    public boolean isMealEligible(CatalogMealDto meal, MealPlanRequest request) {
        if (meal == null) return false;

        String dietPref = request.getDietaryPreference() != null 
                ? request.getDietaryPreference().toLowerCase() : "vegetarian";

        List<String> tags = meal.getDietaryTags() != null ? meal.getDietaryTags() : new ArrayList<>();
        List<String> lowerTags = new ArrayList<>();
        for (String t : tags) lowerTags.add(t.toLowerCase());

        // Dietary checks
        if ("vegan".equals(dietPref)) {
            if (!lowerTags.contains("vegan")) return false;
        } else if ("vegetarian".equals(dietPref)) {
            if (!lowerTags.contains("vegetarian") && !lowerTags.contains("vegan") && !lowerTags.contains("veg")) {
                return false;
            }
        } else if ("eggetarian".equals(dietPref)) {
            if (!lowerTags.contains("vegetarian") && !lowerTags.contains("vegan") && 
                !lowerTags.contains("veg") && !lowerTags.contains("egg")) {
                return false;
            }
        }

        // Allergen and ingredient avoidance checks
        List<String> allergens = request.getAllergies() != null ? request.getAllergies() : new ArrayList<>();
        List<String> avoid = request.getAvoidIngredients() != null ? request.getAvoidIngredients() : new ArrayList<>();

        if (meal.getAllergens() != null) {
            for (String mealAllergen : meal.getAllergens()) {
                for (String userAllergen : allergens) {
                    if (mealAllergen.equalsIgnoreCase(userAllergen.trim())) {
                        return false;
                    }
                }
            }
        }

        if (meal.getIngredients() != null) {
            for (String ing : meal.getIngredients()) {
                for (String userAvoid : avoid) {
                    if (ing.toLowerCase().contains(userAvoid.toLowerCase().trim())) {
                        return false;
                    }
                }
            }
        }

        // Budget check: allow meals within budget or small tolerance (+25%)
        if (request.getBudgetPerMeal() != null && request.getBudgetPerMeal() > 0) {
            double maxBudget = request.getBudgetPerMeal() * 1.25;
            if (meal.getBasePrice() != null && meal.getBasePrice() > maxBudget) {
                return false;
            }
        }

        return true;
    }

    public String generateReason(CatalogMealDto meal, String slot, String goal) {
        double protein = meal.getProteinGrams() != null ? meal.getProteinGrams() : 15.0;
        int calories = meal.getCalories() != null ? meal.getCalories() : 450;
        String cuisine = meal.getCuisine() != null ? meal.getCuisine() : "homestyle";

        if ("muscle_gain".equals(goal)) {
            return String.format("High protein content (%.1fg) to fuel lean muscle synthesis and recovery.", protein);
        } else if ("weight_management".equals(goal)) {
            return String.format("Nutrient-dense at only %d kcal, providing sustained satiety with balanced macros.", calories);
        } else if ("convenience".equals(goal)) {
            return String.format("Wholesome, hassle-free %s favorite that delivers comforting daily energy.", cuisine);
        } else {
            return String.format("Balanced mix of complex carbs, fiber, and %.1fg protein for sustained daily wellness.", protein);
        }
    }
}
