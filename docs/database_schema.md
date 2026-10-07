# FitBite Relational Database Schema

The FitBite database utilizes a 3rd-normal-form relational schema designed in MySQL 8.0 with foreign keys, ON DELETE cascades, unique indexes, and audit logging.

---

## Normalized Entity-Relationship Summary

### 1. Identity & Profiles
- `users`: Shared authentication entity with BCrypt password hash, email, phone, role (`customer`, `seller`, `admin`, `delivery_partner`), and active status.
- `customer_profiles`: Customer metadata, living situation (`solo_bachelor`, `family`), routine type, default delivery preferences.
- `customer_preferences`: Caloric targets, dietary preference, avoided allergens, preferred cuisines, spice level, budget.
- `onboarding_progress`: Current step (1 to 5), completion boolean, and JSON answers snapshot.
- `addresses`: Multi-address book per user with `address_type`, latitude, longitude, and default flag.

### 2. Sellers & Governance
- `seller_profiles`: Kitchen business name, slug, kitchen type (`commercial_tiffin`, `cloud_kitchen`, `restaurant`), operating hours, 14-digit FSSAI number, service radius, preparation cutoffs (`lunch_cutoff: 08:30:00`, `dinner_cutoff: 16:00:00`), verification status (`pending_approval`, `approved`, `rejected`, `suspended`), rejection reason, and public listing toggle (`is_listed`).
- `seller_verification_documents`: Private document storage for FSSAI registration certificates, GST certificates, and identity documents.

### 3. Food Catalog & Customizations
- `categories`: Food taxonomies (Breakfast, Everyday Tiffins, High-Protein, North Indian, Bowls, Family Combos, etc.).
- `meals`: Distinct dishes with base price, description, cuisine, dietary tags, portion choices, allergens, macronutrients (calories, protein, carbs, fats), tiffin eligibility, and rating.
- `customization_options`: Seller-supported modular choices categorized into `base`, `protein`, `veggie`, `portion`, `spice_level`, `sauce`, `extra`. Includes incremental price and macro adjustments.
- `meal_customization_mappings`: Association table linking which meals support which customization choices.
- `saved_custom_meals`: Customer's bookmarked custom meal creations for quick reordering.

### 4. Commerce & Ordering
- `carts`: User active cart bound to a single kitchen (`seller_id`).
- `cart_items`: Items in cart with portion choice, quantity, item price, customizations JSON, and special instructions.
- `orders`: Confirmed orders with unique order number (`FB-XXXXXX`), customer, seller, address, grand total, 5% GST tax amount, coupon discount, delivery slot, doorstep delivery flag, steel dabba exchange flag, and order status (`confirmed`, `preparing`, `ready_for_pickup`, `out_for_delivery`, `delivered`, `cancelled`).
- `order_items`: Immutable snapshots of meals at the time of purchase including meal name, portion, unit price, and customizations.
- `delivery_tracking_events`: Chronological milestone events with title, description, timestamp, and coordinates.

### 5. Subscriptions & Rotating Menus
- `subscription_plans`: Plan configurations (Working Professional 28-day cycle vs Student Mon-Fri monthly plan, discount percentage, skip limit).
- `subscriptions`: Active subscriptions tracking original end date, revised end date (extended on skips), meals purchased, meals delivered, meals skipped, and status (`active`, `paused`, `completed`, `cancelled`).
- `daily_tiffin_menus`: Date-specific rotational recipes published by kitchens for lunch and dinner.
- `scheduled_deliveries`: Idempotently generated delivery records for every single scheduled day, tracking scheduled meal, customer-swapped meal, customizations, delivery status, and skip status.

### 6. Audit & Platform Operations
- `coupons`: Promotional codes with validity date ranges, minimum order thresholds, discount percentage or flat amount, and maximum discount caps.
- `reviews`: Customer reviews and star ratings (1 to 5) linked strictly to completed orders.
- `refunds`: Refund records tracking refunded amount, payment ID, reason, and admin actor ID.
- `audit_logs`: Immutable operations log capturing actor ID, actor email, action type, entity type, entity ID, and JSON change details.
