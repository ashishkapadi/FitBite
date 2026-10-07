package com.fitbite.mealplanner.model;

import java.util.List;

public class MealRecommendation {
    private String mealId;
    private String name;
    private String slot; // breakfast, lunch, dinner, snack
    private String cuisine;
    private Double price;
    private Integer calories;
    private Double proteinGrams;
    private Double carbsGrams;
    private Double fatGrams;
    private String reason;
    private String portion;
    private String imageUrl;
    private List<CatalogMealDto> swapOptions;

    public MealRecommendation() {}

    public String getMealId() { return mealId; }
    public void setMealId(String mealId) { this.mealId = mealId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlot() { return slot; }
    public void setSlot(String slot) { this.slot = slot; }

    public String getCuisine() { return cuisine; }
    public void setCuisine(String cuisine) { this.cuisine = cuisine; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Integer getCalories() { return calories; }
    public void setCalories(Integer calories) { this.calories = calories; }

    public Double getProteinGrams() { return proteinGrams; }
    public void setProteinGrams(Double proteinGrams) { this.proteinGrams = proteinGrams; }

    public Double getCarbsGrams() { return carbsGrams; }
    public void setCarbsGrams(Double carbsGrams) { this.carbsGrams = carbsGrams; }

    public Double getFatGrams() { return fatGrams; }
    public void setFatGrams(Double fatGrams) { this.fatGrams = fatGrams; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getPortion() { return portion; }
    public void setPortion(String portion) { this.portion = portion; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public List<CatalogMealDto> getSwapOptions() { return swapOptions; }
    public void setSwapOptions(List<CatalogMealDto> swapOptions) { this.swapOptions = swapOptions; }
}
