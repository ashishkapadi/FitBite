package com.fitbite.mealplanner.model;

import java.util.List;

public class MealPlanRequest {
    private String goal; // balanced_eating, weight_management, muscle_gain, convenience
    private String dietaryPreference; // vegetarian, vegan, eggetarian, non_vegetarian
    private List<String> allergies;
    private List<String> avoidIngredients;
    private List<String> preferredCuisines;
    private String spicePreference; // mild, medium, spicy, extra_spicy
    private Double budgetPerMeal;
    private String preferredPortion; // light, standard, hearty
    private Integer age;
    private Double heightCm;
    private Double weightKg;
    private String activityLevel; // sedentary, lightly_active, moderately_active, very_active
    private String routineType; // wellness_focused, chill_convenient
    private List<CatalogMealDto> availableMeals;

    public MealPlanRequest() {}

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public String getDietaryPreference() { return dietaryPreference; }
    public void setDietaryPreference(String dietaryPreference) { this.dietaryPreference = dietaryPreference; }

    public List<String> getAllergies() { return allergies; }
    public void setAllergies(List<String> allergies) { this.allergies = allergies; }

    public List<String> getAvoidIngredients() { return avoidIngredients; }
    public void setAvoidIngredients(List<String> avoidIngredients) { this.avoidIngredients = avoidIngredients; }

    public List<String> getPreferredCuisines() { return preferredCuisines; }
    public void setPreferredCuisines(List<String> preferredCuisines) { this.preferredCuisines = preferredCuisines; }

    public String getSpicePreference() { return spicePreference; }
    public void setSpicePreference(String spicePreference) { this.spicePreference = spicePreference; }

    public Double getBudgetPerMeal() { return budgetPerMeal; }
    public void setBudgetPerMeal(Double budgetPerMeal) { this.budgetPerMeal = budgetPerMeal; }

    public String getPreferredPortion() { return preferredPortion; }
    public void setPreferredPortion(String preferredPortion) { this.preferredPortion = preferredPortion; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public Double getHeightCm() { return heightCm; }
    public void setHeightCm(Double heightCm) { this.heightCm = heightCm; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public String getActivityLevel() { return activityLevel; }
    public void setActivityLevel(String activityLevel) { this.activityLevel = activityLevel; }

    public String getRoutineType() { return routineType; }
    public void setRoutineType(String routineType) { this.routineType = routineType; }

    public List<CatalogMealDto> getAvailableMeals() { return availableMeals; }
    public void setAvailableMeals(List<CatalogMealDto> availableMeals) { this.availableMeals = availableMeals; }
}
