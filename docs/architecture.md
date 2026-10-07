# FitBite System Architecture

FitBite is an end-to-end food delivery, subscription, and personalized nutrition web application built around the core USP: **“Your meals, your way.”**

```
               +-------------------------------------------------------+
               |                  React + Vite SPA                     |
               |       (Modern Glassmorphic UI / Emerald & Amber)      |
               +---------------------------+---------------------------+
                                           | HTTP / REST + Socket.IO
                                           v
               +-------------------------------------------------------+
               |                 Node.js + Express                     |
               |                Core Commerce Engine                   |
               |  - Authentication (JWT, Role Guards)                  |
               |  - Catalog & Single-Kitchen Cart                      |
               |  - Orders & Delivery Milestones                       |
               |  - Subscriptions & 4-Week Rotating Menus              |
               |  - Payment Abstraction (Demo & Live Adapters)         |
               |  - Seller Operations & Admin Verification Desk        |
               +-------------+---------------------------+-------------+
                             |                           |
             HTTP POST /api  |                           | SQL / Relational
             /meal-plans     |                           | ORM Query Pool
                             v                           v
+------------------------------------+  +-------------------------------------+
|         Java + Spring Boot         |  |               MySQL 8               |
|        Meal Planning Engine        |  |          Relational Database        |
|  - Mifflin-St Jeor BMR/TDEE Engine |  |  - 21 Normalized Tables             |
|  - Macro Allocation (P/C/F)        |  |  - Foreign Key Constraints          |
|  - 7-Day Rotational Schedule       |  |  - Seed Data: 62 Meals, 8 Kitchens  |
|  - Deterministic Swap Logic        |  |  - Dual Engine: MySQL + Local JSON  |
+------------------------------------+  +-------------------------------------+
```

---

## 1. Service Responsibilities & Boundaries

### A. Frontend (`/frontend`)
- **Technology:** React 18, Vite, React Router v6, Lucide Icons, Socket.IO Client.
- **Responsibilities:**
  - Public food browsing without forced barriers.
  - Contextual authentication modal resuming guest intended actions.
  - 5-step customer onboarding wizard (Living Situation: Solo vs Family bypass).
  - Interactive **Build Your Own Meal** customizer with live macro and price recalculation.
  - Personalized 7-Day diet scheduler with meal swaps.
  - Tiffin subscription calculator (Working Professional 28-day vs Student Mon–Fri).
  - Single-kitchen checkout with 5% GST, coupon discounts, and delivery preferences (doorstep, steel dabba exchange).
  - Real-time milestone delivery tracking with Socket.IO.
  - Kitchen partner operations terminal and administrator verification desk.

### B. Core Backend (`/backend`)
- **Technology:** Node.js, Express, Socket.IO, JSON Web Tokens (JWT), BCrypt.
- **Port:** `5000`
- **Responsibilities:**
  - Authentication, password hashing, session tokens, and strict role guards (`customer`, `seller`, `admin`, `delivery_partner`).
  - Single-kitchen cart enforcement with conflict confirmation prompt.
  - Immutable order item snapshots and tax calculations.
  - Subscription schedule calculation with eligible weekday counting and skip-day extensions.
  - Kitchen preparation cutoffs strictly enforced in `Asia/Kolkata` (IST) timezone.
  - Kitchen ticket generation with customer customization options and ingredient omission warnings.
  - Dual-mode database layer: Seamlessly queries MySQL 8 on port 3306, with automatic zero-configuration fallback to local atomic JSON storage if MySQL is offline.

### C. Meal Planning Service (`/meal-planner-service`)
- **Technology:** Java 17, Spring Boot 3.2.5, Maven.
- **Port:** `8082`
- **Responsibilities:**
  - High-precision Mifflin-St Jeor Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) estimation.
  - Macronutrient partitioning (Protein, Carbs, Fats) based on fitness goals (`BALANCED`, `WEIGHT_LOSS`, `MUSCLE_GAIN`, `CONVENIENCE`).
  - Deterministic 7-day varied rotational meal generation adhering to dietary preferences, allergen exclusions, and spice tolerance.
  - Meal swap generator providing nutritionally equivalent alternatives from the active catalog.
  - *Resilience:* If the Java service is starting or unreachable, Express gracefully executes its built-in local deterministic rule engine equivalent.

### D. Relational Database (`/database`)
- **Technology:** MySQL 8.0 Community Server.
- **Port:** `3306`
- **Responsibilities:**
  - 21 normalized relational tables with foreign keys and strict constraints.
  - 62 distinct chef meals across 8 verified cloud kitchens and mess providers.
  - 28-day rotating daily tiffin menus for lunch and dinner.
  - Audit logs tracking admin verification actions, user status toggles, and refunds.

---

## 2. Key Business Workflows

### 1. Guest Browsing & Deferred Login
1. Guest visits `/` or `/explore` and views photos, descriptions, ratings, prices, and badges.
2. Clicking "Customize Meal", "Add to Cart", or "Subscribe" triggers `AuthModal`.
3. The guest's intended action (e.g. adding meal #12 to cart) is queued in `AuthContext`.
4. Upon authentication, if the customer is new, onboarding opens; once completed, the queued action is automatically executed.

### 2. Multi-Step Onboarding Routing
- **Step 1:** "Who do you live with?"
  - **With Family:** Immediately sets profile to family mode and navigates straight to the restaurant marketplace with full-size portions and thalis. Bachelor questions are completely bypassed.
  - **Living Solo / Bachelor:** Continues to Step 2 (Routine: Gym/Wellness vs Chill/Convenient), Step 3 (Interest: Tiffin Subscriptions vs Regular Meals), Step 4 (Tiffin Schedule), and Step 5 (Dietary preferences).

### 3. Tiffin Subscription Scheduling & Skip-Day Extension
- **Working Professional Plan:** 28 consecutive calendar days (including weekends). Allows up to 2 skip requests. Each skip request extends the subscription end date by 1 day so purchased meal entitlements are never lost.
- **Student Plan:** Monthly calendar plan delivering Monday to Friday only. Saturdays and Sundays are automatically excluded. Exact eligible weekdays (e.g. 21–22 days) are dynamically calculated so students pay strictly for scheduled meals.
- **Timezone Cutoffs:** Modifications require submission before 8:30 AM IST for lunch and 4:00 PM IST for dinner.

### 4. Single-Kitchen Cart Rule
- Food delivery carts enforce items from a single kitchen to guarantee timely thermal delivery.
- If a customer adds food from Kitchen B while having items from Kitchen A, a 409 conflict modal opens explaining the rule and asking confirmation before replacing the cart.

### 5. Seller Onboarding & Approval Lifecycle
- New sellers register and are placed in `pending_approval` status.
- Unapproved kitchens cannot appear in public searches or accept orders.
- Platform administrators review the 14-digit FSSAI number, kitchen type, address, and license before approving.
- Once approved, the kitchen becomes discoverable, can publish daily rotating menus, and receives real-time preparation tickets.
