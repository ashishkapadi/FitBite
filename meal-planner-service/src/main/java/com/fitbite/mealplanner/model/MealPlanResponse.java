package com.fitbite.mealplanner.model;

import java.util.List;

public class MealPlanResponse {
    private String planTitle;
    private String summary;
    private String targetGoal;
    private Integer targetDailyCalories;
    private Double targetDailyProteinGrams;
    private Double targetDailyCarbsGrams;
    private Double targetDailyFatGrams;
    private Double estimatedAverageDailyCost;
    private List<DailyPlan> sevenDayPlan;
    private String healthDisclaimer;
    private List<String> nutritionalGuidelines;

    public MealPlanResponse() {}

    public String getPlanTitle() { return planTitle; }
    public void setPlanTitle(String planTitle) { this.planTitle = planTitle; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getTargetGoal() { return targetGoal; }
    public void setTargetGoal(String targetGoal) { this.targetGoal = targetGoal; }

    public Integer getTargetDailyCalories() { return targetDailyCalories; }
    public void setTargetDailyCalories(Integer targetDailyCalories) { this.targetDailyCalories = targetDailyCalories; }

    public Double getTargetDailyProteinGrams() { return targetDailyProteinGrams; }
    public void setTargetDailyProteinGrams(Double targetDailyProteinGrams) { this.targetDailyProteinGrams = targetDailyProteinGrams; }

    public Double getTargetDailyCarbsGrams() { return targetDailyCarbsGrams; }
    public void setTargetDailyCarbsGrams(Double targetDailyCarbsGrams) { this.targetDailyCarbsGrams = targetDailyCarbsGrams; }

    public Double getTargetDailyFatGrams() { return targetDailyFatGrams; }
    public void setTargetDailyFatGrams(Double targetDailyFatGrams) { this.targetDailyFatGrams = targetDailyFatGrams; }

    public Double getEstimatedAverageDailyCost() { return estimatedAverageDailyCost; }
    public void setEstimatedAverageDailyCost(Double estimatedAverageDailyCost) { this.estimatedAverageDailyCost = estimatedAverageDailyCost; }

    public List<DailyPlan> getSevenDayPlan() { return sevenDayPlan; }
    public void setSevenDayPlan(List<DailyPlan> sevenDayPlan) { this.sevenDayPlan = sevenDayPlan; }

    public String getHealthDisclaimer() { return healthDisclaimer; }
    public void setHealthDisclaimer(String healthDisclaimer) { this.healthDisclaimer = healthDisclaimer; }

    public List<String> getNutritionalGuidelines() { return nutritionalGuidelines; }
    public void setNutritionalGuidelines(List<String> nutritionalGuidelines) { this.nutritionalGuidelines = nutritionalGuidelines; }
}
