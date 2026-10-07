package com.fitbite.mealplanner.service;

import com.fitbite.mealplanner.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MealPlanService {

    private final NutritionCalculator nutritionCalculator;
    private final RuleEngine ruleEngine;

    private static final String[] DAYS_OF_WEEK = {
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    };

    @Autowired
    public MealPlanService(NutritionCalculator nutritionCalculator, RuleEngine ruleEngine) {
        this.nutritionCalculator = nutritionCalculator;
        this.ruleEngine = ruleEngine;
    }

    public MealPlanResponse generatePlan(MealPlanRequest request) {
        NutritionCalculator.MacroTargets targets = nutritionCalculator.calculateTargets(request);

        List<CatalogMealDto> available = request.getAvailableMeals() != null 
                ? request.getAvailableMeals() : new ArrayList<>();

        // Filter eligible meals using rules
        List<CatalogMealDto> eligibleMeals = available.stream()
                .filter(m -> ruleEngine.isMealEligible(m, request))
                .collect(Collectors.toList());

        // Fallback to all available if filtering was too strict
        if (eligibleMeals.isEmpty()) {
            eligibleMeals = available;
        }

        List<CatalogMealDto> breakfastPool = eligibleMeals.stream()
                .filter(m -> m.getCategoryName() != null && 
                        (m.getCategoryName().toLowerCase().contains("breakfast") || 
                         m.getCategoryName().toLowerCase().contains("snack")))
                .collect(Collectors.toList());
        if (breakfastPool.isEmpty()) breakfastPool = eligibleMeals;

        List<CatalogMealDto> mainMealPool = eligibleMeals.stream()
                .filter(m -> m.getCategoryName() == null || 
                        (!m.getCategoryName().toLowerCase().contains("breakfast") && 
                         !m.getCategoryName().toLowerCase().contains("beverage") &&
                         !m.getCategoryName().toLowerCase().contains("dessert")))
                .collect(Collectors.toList());
        if (mainMealPool.isEmpty()) mainMealPool = eligibleMeals;

        List<DailyPlan> sevenDays = new ArrayList<>();
        double runningWeeklyCost = 0.0;
        String goal = request.getGoal() != null ? request.getGoal() : "balanced_eating";

        for (int i = 0; i < 7; i++) {
            DailyPlan dailyPlan = new DailyPlan();
            dailyPlan.setDayNumber(i + 1);
            dailyPlan.setDayName(DAYS_OF_WEEK[i]);

            List<MealRecommendation> dayMeals = new ArrayList<>();

            // 1. Breakfast
            CatalogMealDto bfMeal = selectMealWithOffset(breakfastPool, i);
            if (bfMeal != null) {
                dayMeals.add(createRecommendation(bfMeal, "Breakfast", goal, breakfastPool));
            }

            // 2. Lunch
            CatalogMealDto lunchMeal = selectMealWithOffset(mainMealPool, i * 2);
            if (lunchMeal != null) {
                dayMeals.add(createRecommendation(lunchMeal, "Lunch", goal, mainMealPool));
            }

            // 3. Dinner
            CatalogMealDto dinnerMeal = selectMealWithOffset(mainMealPool, (i * 2) + 1);
            if (dinnerMeal != null) {
                dayMeals.add(createRecommendation(dinnerMeal, "Dinner", goal, mainMealPool));
            }

            int dayCal = 0;
            double dayProt = 0.0;
            double dayCarbs = 0.0;
            double dayFat = 0.0;
            double dayCost = 0.0;

            for (MealRecommendation rec : dayMeals) {
                if (rec.getCalories() != null) dayCal += rec.getCalories();
                if (rec.getProteinGrams() != null) dayProt += rec.getProteinGrams();
                if (rec.getCarbsGrams() != null) dayCarbs += rec.getCarbsGrams();
                if (rec.getFatGrams() != null) dayFat += rec.getFatGrams();
                if (rec.getPrice() != null) dayCost += rec.getPrice();
            }

            dailyPlan.setMeals(dayMeals);
            dailyPlan.setTotalCalories(dayCal);
            dailyPlan.setTotalProteinGrams(Math.round(dayProt * 10.0) / 10.0);
            dailyPlan.setTotalCarbsGrams(Math.round(dayCarbs * 10.0) / 10.0);
            dailyPlan.setTotalFatGrams(Math.round(dayFat * 10.0) / 10.0);
            dailyPlan.setTotalCost(Math.round(dayCost * 100.0) / 100.0);

            runningWeeklyCost += dayCost;
            sevenDays.add(dailyPlan);
        }

        MealPlanResponse response = new MealPlanResponse();
        response.setPlanTitle(formatPlanTitle(goal));
        response.setSummary(formatSummary(goal, targets));
        response.setTargetGoal(goal);
        response.setTargetDailyCalories(targets.calories);
        response.setTargetDailyProteinGrams(targets.proteinGrams);
        response.setTargetDailyCarbsGrams(targets.carbsGrams);
        response.setTargetDailyFatGrams(targets.fatGrams);
        response.setEstimatedAverageDailyCost(Math.round((runningWeeklyCost / 7.0) * 100.0) / 100.0);
        response.setSevenDayPlan(sevenDays);
        response.setHealthDisclaimer("Treat recommendations as general wellness guidance. Not intended to diagnose, cure, or treat medical conditions.");

        List<String> guidelines = new ArrayList<>();
        guidelines.add("Stay hydrated with at least 2.5 to 3 liters of water throughout the day.");
        guidelines.add("Eat meals at regular timings and finish dinner at least 2 hours before bedtime.");
        guidelines.add("Use FitBite Build Your Own Meal to tune portion sizes and swap ingredients.");
        response.setNutritionalGuidelines(guidelines);

        return response;
    }

    private CatalogMealDto selectMealWithOffset(List<CatalogMealDto> pool, int index) {
        if (pool == null || pool.isEmpty()) return null;
        return pool.get(index % pool.size());
    }

    private MealRecommendation createRecommendation(CatalogMealDto meal, String slot, String goal, List<CatalogMealDto> pool) {
        MealRecommendation rec = new MealRecommendation();
        rec.setMealId(meal.getId());
        rec.setName(meal.getName());
        rec.setSlot(slot);
        rec.setCuisine(meal.getCuisine());
        rec.setPrice(meal.getBasePrice());
        rec.setCalories(meal.getCalories());
        rec.setProteinGrams(meal.getProteinGrams());
        rec.setCarbsGrams(meal.getCarbsGrams());
        rec.setFatGrams(meal.getFatGrams());
        rec.setReason(ruleEngine.generateReason(meal, slot, goal));
        rec.setPortion("Standard");
        rec.setImageUrl(meal.getImageUrl());

        // Find up to 2 approved swap alternatives from the same pool
        List<CatalogMealDto> swaps = pool.stream()
                .filter(m -> !m.getId().equals(meal.getId()))
                .limit(2)
                .collect(Collectors.toList());
        rec.setSwapOptions(swaps);

        return rec;
    }

    private String formatPlanTitle(String goal) {
        switch (goal.toLowerCase()) {
            case "muscle_gain": return "High-Protein Muscle Synthesis 7-Day Plan";
            case "weight_management": return "Calorie-Conscious Metabolism Reset 7-Day Plan";
            case "convenience": return "Hassle-Free Wholesome Daily Eats Plan";
            default: return "Optimal Nutritional Balance 7-Day Plan";
        }
    }

    private String formatSummary(String goal, NutritionCalculator.MacroTargets targets) {
        return String.format(
            "Tailored for your routine. Targeting ~%d calories with %.0fg protein per day using fresh, rotational homestyle meals.",
            targets.calories, targets.proteinGrams
        );
    }
}
