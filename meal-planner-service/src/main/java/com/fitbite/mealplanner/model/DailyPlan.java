package com.fitbite.mealplanner.model;

import java.util.List;

public class DailyPlan {
    private int dayNumber;
    private String dayName;
    private List<MealRecommendation> meals;
    private Integer totalCalories;
    private Double totalProteinGrams;
    private Double totalCarbsGrams;
    private Double totalFatGrams;
    private Double totalCost;

    public DailyPlan() {}

    public int getDayNumber() { return dayNumber; }
    public void setDayNumber(int dayNumber) { this.dayNumber = dayNumber; }

    public String getDayName() { return dayName; }
    public void setDayName(String dayName) { this.dayName = dayName; }

    public List<MealRecommendation> getMeals() { return meals; }
    public void setMeals(List<MealRecommendation> meals) { this.meals = meals; }

    public Integer getTotalCalories() { return totalCalories; }
    public void setTotalCalories(Integer totalCalories) { this.totalCalories = totalCalories; }

    public Double getTotalProteinGrams() { return totalProteinGrams; }
    public void setTotalProteinGrams(Double totalProteinGrams) { this.totalProteinGrams = totalProteinGrams; }

    public Double getTotalCarbsGrams() { return totalCarbsGrams; }
    public void setTotalCarbsGrams(Double totalCarbsGrams) { this.totalCarbsGrams = totalCarbsGrams; }

    public Double getTotalFatGrams() { return totalFatGrams; }
    public void setTotalFatGrams(Double totalFatGrams) { this.totalFatGrams = totalFatGrams; }

    public Double getTotalCost() { return totalCost; }
    public void setTotalCost(Double totalCost) { this.totalCost = totalCost; }
}
