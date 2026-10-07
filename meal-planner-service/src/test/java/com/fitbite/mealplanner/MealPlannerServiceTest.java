package com.fitbite.mealplanner;

import com.fitbite.mealplanner.model.CatalogMealDto;
import com.fitbite.mealplanner.model.MealPlanRequest;
import com.fitbite.mealplanner.model.MealPlanResponse;
import com.fitbite.mealplanner.service.MealPlanService;
import com.fitbite.mealplanner.service.NutritionCalculator;
import com.fitbite.mealplanner.service.RuleEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class MealPlannerServiceTest {

    private MealPlanService mealPlanService;

    @BeforeEach
    public void setup() {
        NutritionCalculator calculator = new NutritionCalculator();
        RuleEngine ruleEngine = new RuleEngine();
        mealPlanService = new MealPlanService(calculator, ruleEngine);
    }

    @Test
    public void testGenerateMealPlanWithCustomGoal() {
        MealPlanRequest req = new MealPlanRequest();
        req.setGoal("muscle_gain");
        req.setDietaryPreference("vegetarian");
        req.setBudgetPerMeal(200.0);

        List<CatalogMealDto> meals = new ArrayList<>();
        
        CatalogMealDto m1 = new CatalogMealDto();
        m1.setId("m1");
        m1.setName("Paneer Bhurji & Multigrain Roti");
        m1.setCategoryName("Breakfast");
        m1.setBasePrice(120.0);
        m1.setCalories(420);
        m1.setProteinGrams(24.0);
        m1.setDietaryTags(Arrays.asList("Vegetarian", "High-Protein"));
        meals.add(m1);

        CatalogMealDto m2 = new CatalogMealDto();
        m2.setId("m2");
        m2.setName("High Protein Dal Makhani & Brown Rice");
        m2.setCategoryName("Balanced Bowls");
        m2.setBasePrice(160.0);
        m2.setCalories(540);
        m2.setProteinGrams(26.0);
        m2.setDietaryTags(Arrays.asList("Vegetarian", "High-Protein"));
        meals.add(m2);

        req.setAvailableMeals(meals);

        MealPlanResponse resp = mealPlanService.generatePlan(req);

        assertNotNull(resp);
        assertEquals("muscle_gain", resp.getTargetGoal());
        assertEquals(7, resp.getSevenDayPlan().size());
        assertTrue(resp.getTargetDailyProteinGrams() > 100);
        assertNotNull(resp.getHealthDisclaimer());
    }
}
