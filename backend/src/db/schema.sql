-- =====================================================================
-- FitBite Relational Database Schema (MySQL 8.0 Compatible)
-- "Your meals, your way" - Core Commerce, Subscriptions & Customization
-- =====================================================================

-- 1. Users (Shared Identity Table)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'seller', 'admin', 'delivery_partner') NOT NULL DEFAULT 'customer',
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- 2. Customer Profiles & Onboarding State
CREATE TABLE IF NOT EXISTS customer_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    living_situation ENUM('solo_bachelor', 'family') NULL,
    routine_type ENUM('wellness_focused', 'chill_convenient') NULL,
    primary_interest ENUM('tiffin_subscriptions', 'regular_meals') NULL,
    default_delivery_slot ENUM('lunch', 'dinner', 'both') DEFAULT 'both',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Customer Personalization Preferences
CREATE TABLE IF NOT EXISTS customer_preferences (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL UNIQUE,
    goal ENUM('balanced_eating', 'weight_management', 'muscle_gain', 'convenience') DEFAULT 'balanced_eating',
    dietary_preference ENUM('vegetarian', 'vegan', 'eggetarian', 'non_vegetarian') DEFAULT 'vegetarian',
    allergies JSON NULL,
    avoid_ingredients JSON NULL,
    preferred_cuisines JSON NULL,
    spice_preference ENUM('mild', 'medium', 'spicy', 'extra_spicy') DEFAULT 'medium',
    budget_per_meal DECIMAL(10, 2) DEFAULT 150.00,
    preferred_portion ENUM('light', 'standard', 'hearty') DEFAULT 'standard',
    age INT NULL,
    height_cm DECIMAL(5, 2) NULL,
    weight_kg DECIMAL(5, 2) NULL,
    activity_level ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active') NULL,
    notes TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Addresses
CREATE TABLE IF NOT EXISTS addresses (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    label VARCHAR(50) DEFAULT 'Home',
    recipient_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    street_address TEXT NOT NULL,
    landmark VARCHAR(120) NULL,
    area VARCHAR(100) NOT NULL,
    city VARCHAR(80) NOT NULL DEFAULT 'Bengaluru',
    pincode VARCHAR(10) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    leave_at_doorstep BOOLEAN NOT NULL DEFAULT FALSE,
    exchange_steel_dabba BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_instructions TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_addr_user (user_id)
) ENGINE=InnoDB;

-- 5. Seller Profiles & Kitchens
CREATE TABLE IF NOT EXISTS seller_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    business_name VARCHAR(160) NOT NULL,
    owner_name VARCHAR(120) NOT NULL,
    kitchen_type ENUM('commercial_tiffin', 'home_chef_cloud', 'restaurant') NOT NULL,
    delivery_model ENUM('platform_managed', 'kitchen_managed', 'fixed_route_batch') NOT NULL DEFAULT 'platform_managed',
    operating_address TEXT NOT NULL,
    area VARCHAR(100) NOT NULL,
    city VARCHAR(80) NOT NULL DEFAULT 'Bengaluru',
    pincodes_served JSON NOT NULL,
    delivery_radius_km DECIMAL(4, 1) DEFAULT 7.5,
    cuisine_specializations JSON NOT NULL,
    operating_hours VARCHAR(100) DEFAULT '08:00 AM - 10:00 PM',
    fssai_number VARCHAR(14) NOT NULL,
    fssai_expiry_date DATE NULL,
    fssai_certificate_url VARCHAR(255) NULL,
    verification_status ENUM('pending_approval', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending_approval',
    rejection_reason TEXT NULL,
    rating DECIMAL(3, 2) DEFAULT 4.5,
    rating_count INT DEFAULT 0,
    preparation_cutoff_lunch_time VARCHAR(8) DEFAULT '08:00:00',
    preparation_cutoff_dinner_time VARCHAR(8) DEFAULT '16:00:00',
    is_listed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_seller_status (verification_status),
    INDEX idx_seller_listed (is_listed)
) ENGINE=InnoDB;

-- 6. Verification Documents
CREATE TABLE IF NOT EXISTS seller_verification_documents (
    id VARCHAR(36) PRIMARY KEY,
    seller_id VARCHAR(36) NOT NULL,
    document_type ENUM('fssai_license', 'gst_certificate', 'identity_proof', 'kitchen_photos') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    review_notes TEXT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Categories
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    slug VARCHAR(80) NOT NULL UNIQUE,
    description TEXT NULL,
    icon_name VARCHAR(50) NULL,
    image_url VARCHAR(255) NULL,
    display_order INT DEFAULT 0
) ENGINE=InnoDB;

-- 8. Meals / Menu Items
CREATE TABLE IF NOT EXISTS meals (
    id VARCHAR(36) PRIMARY KEY,
    seller_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(140) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    cuisine VARCHAR(60) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    portion_choices JSON NOT NULL,
    ingredients JSON NOT NULL,
    allergens JSON NULL,
    dietary_tags JSON NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_tiffin_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    prep_time_minutes INT DEFAULT 25,
    calories INT NULL,
    protein_grams DECIMAL(5, 1) NULL,
    carbs_grams DECIMAL(5, 1) NULL,
    fat_grams DECIMAL(5, 1) NULL,
    image_url VARCHAR(255) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 4.6,
    rating_count INT DEFAULT 18,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_meals_seller (seller_id),
    INDEX idx_meals_category (category_id),
    INDEX idx_meals_available (is_available)
) ENGINE=InnoDB;

-- 9. Customization Options (Build Your Own Meal)
CREATE TABLE IF NOT EXISTS customization_options (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    group_type ENUM('base', 'protein', 'side', 'spice', 'sauce', 'extra', 'removal') NOT NULL,
    item_choice VARCHAR(100) NOT NULL,
    price_delta DECIMAL(10, 2) DEFAULT 0.00,
    calorie_delta INT DEFAULT 0,
    protein_delta DECIMAL(5, 1) DEFAULT 0.0,
    carbs_delta DECIMAL(5, 1) DEFAULT 0.0,
    fat_delta DECIMAL(5, 1) DEFAULT 0.0,
    is_default BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0
) ENGINE=InnoDB;

-- 10. Meal Customization Mappings
CREATE TABLE IF NOT EXISTS meal_customization_mappings (
    id VARCHAR(36) PRIMARY KEY,
    meal_id VARCHAR(36) NOT NULL,
    customization_option_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (customization_option_id) REFERENCES customization_options(id) ON DELETE CASCADE,
    UNIQUE KEY uk_meal_cust (meal_id, customization_option_id)
) ENGINE=InnoDB;

-- 11. Carts & Cart Items (Single Kitchen Enforced)
CREATE TABLE IF NOT EXISTS carts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    seller_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
    id VARCHAR(36) PRIMARY KEY,
    cart_id VARCHAR(36) NOT NULL,
    meal_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    portion_selected VARCHAR(50) DEFAULT 'standard',
    customizations JSON NULL,
    item_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    special_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Coupons
CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    discount_type ENUM('percentage', 'flat') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    max_discount_cap DECIMAL(10, 2) NULL,
    min_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    usage_limit_total INT DEFAULT 1000,
    usage_limit_per_user INT DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 13. Orders & Order Items
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(24) NOT NULL UNIQUE,
    customer_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,
    address_id VARCHAR(36) NOT NULL,
    order_type ENUM('instant_restaurant', 'tiffin_delivery') DEFAULT 'instant_restaurant',
    status ENUM('confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'confirmed',
    subtotal DECIMAL(10, 2) NOT NULL,
    customization_total DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    coupon_code VARCHAR(30) NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 35.00,
    tax_amount DECIMAL(10, 2) NOT NULL,
    grand_total DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    payment_method ENUM('demo_card', 'demo_upi', 'demo_netbanking', 'cash_on_delivery', 'razorpay') NOT NULL,
    payment_transaction_id VARCHAR(100) NULL,
    delivery_slot VARCHAR(50) NULL,
    leave_at_doorstep BOOLEAN DEFAULT FALSE,
    exchange_steel_dabba BOOLEAN DEFAULT FALSE,
    delivery_instructions TEXT NULL,
    cancellation_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id),
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_seller (seller_id),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    meal_id VARCHAR(36) NOT NULL,
    meal_name_snapshot VARCHAR(160) NOT NULL,
    meal_image_snapshot VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    portion_snapshot VARCHAR(50) NOT NULL,
    unit_base_price DECIMAL(10, 2) NOT NULL,
    customizations_snapshot JSON NULL,
    unit_final_price DECIMAL(10, 2) NOT NULL,
    item_total_price DECIMAL(10, 2) NOT NULL,
    special_notes TEXT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- 14. Payments & Refunds
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    provider ENUM('demo_gateway', 'razorpay', 'stripe', 'cash_on_delivery') NOT NULL,
    transaction_reference VARCHAR(120) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'INR',
    status ENUM('initiated', 'captured', 'failed', 'refunded') NOT NULL,
    raw_payload JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refunds (
    id VARCHAR(36) PRIMARY KEY,
    payment_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(36) NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    processed_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

-- 15. Tiffin Subscription Plans & Subscriptions
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(36) PRIMARY KEY,
    seller_id VARCHAR(36) NOT NULL,
    plan_type ENUM('working_professional', 'student') NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    cycle_days INT NOT NULL,
    delivery_frequency ENUM('daily', 'weekdays_only') NOT NULL,
    supported_slots JSON NOT NULL,
    base_price_per_meal DECIMAL(10, 2) NOT NULL,
    plan_discount_percent DECIMAL(5, 2) DEFAULT 15.00,
    max_skips_allowed INT DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    subscription_number VARCHAR(24) NOT NULL UNIQUE,
    customer_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,
    plan_id VARCHAR(36) NOT NULL,
    address_id VARCHAR(36) NOT NULL,
    slot ENUM('lunch', 'dinner', 'both') NOT NULL,
    start_date DATE NOT NULL,
    original_end_date DATE NOT NULL,
    revised_end_date DATE NOT NULL,
    total_meals_purchased INT NOT NULL,
    meals_delivered_count INT NOT NULL DEFAULT 0,
    meals_skipped_count INT NOT NULL DEFAULT 0,
    max_skips_allowed INT NOT NULL DEFAULT 2,
    price_per_meal DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL,
    grand_total DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
    payment_status ENUM('paid', 'pending', 'refunded') NOT NULL DEFAULT 'paid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(id),
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id)
) ENGINE=InnoDB;

-- 16. Daily Rotating Menus (4-Week Rotation)
CREATE TABLE IF NOT EXISTS daily_tiffin_menus (
    id VARCHAR(36) PRIMARY KEY,
    seller_id VARCHAR(36) NOT NULL,
    menu_date DATE NOT NULL,
    slot ENUM('lunch', 'dinner') NOT NULL,
    meal_id VARCHAR(36) NOT NULL,
    alternative_meal_id VARCHAR(36) NULL,
    notes VARCHAR(255) NULL,
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (alternative_meal_id) REFERENCES meals(id) ON DELETE SET NULL,
    UNIQUE KEY uk_seller_date_slot (seller_id, menu_date, slot)
) ENGINE=InnoDB;

-- 17. Scheduled Subscription Deliveries
CREATE TABLE IF NOT EXISTS scheduled_deliveries (
    id VARCHAR(36) PRIMARY KEY,
    subscription_id VARCHAR(36) NOT NULL,
    delivery_date DATE NOT NULL,
    slot ENUM('lunch', 'dinner') NOT NULL,
    scheduled_meal_id VARCHAR(36) NOT NULL,
    chosen_meal_id VARCHAR(36) NOT NULL,
    customizations JSON NULL,
    status ENUM('scheduled', 'preparing', 'out_for_delivery', 'delivered', 'skipped', 'cancelled') NOT NULL DEFAULT 'scheduled',
    is_skipped BOOLEAN NOT NULL DEFAULT FALSE,
    skip_reason VARCHAR(255) NULL,
    skipped_at DATETIME NULL,
    delivered_at DATETIME NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (scheduled_meal_id) REFERENCES meals(id),
    FOREIGN KEY (chosen_meal_id) REFERENCES meals(id),
    UNIQUE KEY uk_sub_date_slot (subscription_id, delivery_date, slot)
) ENGINE=InnoDB;

-- 18. Saved Custom Meals
CREATE TABLE IF NOT EXISTS saved_custom_meals (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    base_meal_id VARCHAR(36) NOT NULL,
    custom_name VARCHAR(120) NOT NULL,
    portion_selected VARCHAR(50) NOT NULL,
    customizations JSON NOT NULL,
    calculated_price DECIMAL(10, 2) NOT NULL,
    estimated_calories INT NULL,
    estimated_protein DECIMAL(5, 1) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (base_meal_id) REFERENCES meals(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 19. Delivery Tracking Events
CREATE TABLE IF NOT EXISTS delivery_tracking_events (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NULL,
    scheduled_delivery_id VARCHAR(36) NULL,
    event_status ENUM('confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL,
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_track_order (order_id),
    INDEX idx_track_sched (scheduled_delivery_id)
) ENGINE=InnoDB;

-- 20. Reviews & Ratings
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL UNIQUE,
    customer_id VARCHAR(36) NOT NULL,
    seller_id VARCHAR(36) NOT NULL,
    meal_id VARCHAR(36) NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES seller_profiles(id)
) ENGINE=InnoDB;

-- 21. Audit Logs (Admin & Sensitive Security Actions)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    actor_id VARCHAR(36) NOT NULL,
    actor_email VARCHAR(191) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_action (action),
    INDEX idx_audit_actor (actor_id)
) ENGINE=InnoDB;
