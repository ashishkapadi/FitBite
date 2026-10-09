package com.fitbite.mealplanner.controller;

import com.fitbite.mealplanner.model.MealPlanRequest;
import com.fitbite.mealplanner.model.MealPlanResponse;
import com.fitbite.mealplanner.service.MealPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/meal-plans")
@CrossOrigin(origins = "*")
public class MealPlanController {

    private final MealPlanService mealPlanService;

    @Value("${planner.shared.secret:${PLANNER_SHARED_SECRET:}}")
    private String sharedSecret;

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
    public ResponseEntity<?> generateMealPlan(
            @RequestHeader(value = "X-Internal-Service-Key", required = false) String serviceKey,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody MealPlanRequest request) {

        // Validate shared secret if configured on server
        if (sharedSecret != null && !sharedSecret.trim().isEmpty()) {
            boolean authorized = false;
            if (serviceKey != null && serviceKey.trim().equals(sharedSecret.trim())) {
                authorized = true;
            } else if (authHeader != null && authHeader.trim().equalsIgnoreCase("Bearer " + sharedSecret.trim())) {
                authorized = true;
            }
            if (!authorized) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "Unauthorized: Valid X-Internal-Service-Key or Authorization header required for planner microservice.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
            }
        }

        MealPlanResponse response = mealPlanService.generatePlan(request);
        return ResponseEntity.ok(response);
    }
}
