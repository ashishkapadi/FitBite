package com.fitbite.mealplanner.controller;

import com.fitbite.mealplanner.model.MealPlanRequest;
import com.fitbite.mealplanner.model.MealPlanResponse;
import com.fitbite.mealplanner.service.MealPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/meal-plans")
@CrossOrigin(origins = "*")
public class MealPlanController {

    private final MealPlanService mealPlanService;

    @Autowired
    public MealPlanController(MealPlanService mealPlanService) {
        this.mealPlanService = mealPlanService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "fitbite-meal-planner");
        status.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(status);
    }

    @PostMapping("/generate")
    public ResponseEntity<MealPlanResponse> generateMealPlan(@RequestBody MealPlanRequest request) {
        MealPlanResponse response = mealPlanService.generatePlan(request);
        return ResponseEntity.ok(response);
    }
}
