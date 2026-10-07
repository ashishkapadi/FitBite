package com.fitbite.mealplanner.service;

import com.fitbite.mealplanner.model.MealPlanRequest;
import org.springframework.stereotype.Component;

@Component
public class NutritionCalculator {

    public static class MacroTargets {
        public int calories;
        public double proteinGrams;
        public double carbsGrams;
        public double fatGrams;

        public MacroTargets(int calories, double protein, double carbs, double fat) {
            this.calories = calories;
            this.proteinGrams = protein;
            this.carbsGrams = carbs;
            this.fatGrams = fat;
        }
    }

    public MacroTargets calculateTargets(MealPlanRequest request) {
        String goal = request.getGoal() != null ? request.getGoal().toLowerCase() : "balanced_eating";
        
        int baseCalories;
        double proteinRatio;
        double carbsRatio;
        double fatRatio;

        // Check if user provided biometric parameters
        if (request.getWeightKg() != null && request.getHeightCm() != null && request.getAge() != null) {
            double weight = request.getWeightKg();
            double height = request.getHeightCm();
            int age = request.getAge();
            // Mifflin-St Jeor approximation
            double bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
            
            double multiplier = 1.35; // Default lightly active
            if ("sedentary".equalsIgnoreCase(request.getActivityLevel())) multiplier = 1.2;
            else if ("moderately_active".equalsIgnoreCase(request.getActivityLevel())) multiplier = 1.55;
            else if ("very_active".equalsIgnoreCase(request.getActivityLevel())) multiplier = 1.725;

            double tdee = bmr * multiplier;

            if ("muscle_gain".equals(goal)) {
                baseCalories = (int) (tdee + 350);
            } else if ("weight_management".equals(goal)) {
                baseCalories = (int) (tdee - 400);
            } else {
                baseCalories = (int) tdee;
            }
            if (baseCalories < 1300) baseCalories = 1300;
        } else {
            // Sensible goal defaults
            switch (goal) {
                case "muscle_gain":
                    baseCalories = 2400;
                    break;
                case "weight_management":
                    baseCalories = 1750;
                    break;
                case "convenience":
                    baseCalories = 2000;
                    break;
                case "balanced_eating":
                default:
                    baseCalories = 2050;
                    break;
            }
        }

        switch (goal) {
            case "muscle_gain":
                proteinRatio = 0.30;
                carbsRatio = 0.45;
                fatRatio = 0.25;
                break;
            case "weight_management":
                proteinRatio = 0.30;
                carbsRatio = 0.35;
                fatRatio = 0.35;
                break;
            case "convenience":
            case "balanced_eating":
            default:
                proteinRatio = 0.20;
                carbsRatio = 0.50;
                fatRatio = 0.30;
                break;
        }

        double proteinGrams = Math.round(((baseCalories * proteinRatio) / 4.0) * 10.0) / 10.0;
        double carbsGrams = Math.round(((baseCalories * carbsRatio) / 4.0) * 10.0) / 10.0;
        double fatGrams = Math.round(((baseCalories * fatRatio) / 9.0) * 10.0) / 10.0;

        return new MacroTargets(baseCalories, proteinGrams, carbsGrams, fatGrams);
    }
}
