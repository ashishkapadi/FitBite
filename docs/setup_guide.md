# FitBite Setup & Run Guide

FitBite can be run either via **Docker Compose** (all-in-one containers) or **Direct Local Development** (zero-config Windows / macOS / Linux).

---

## Method 1: Direct Local Development (Recommended for Development)

### Prerequisites
- Node.js `v18+` (Installed: Node `v26.7.0`)
- Optional: MySQL `8.0` on port `3306` (If MySQL is not running, the application automatically engages its high-performance local relational JSON store, seeded with 62 meals and 8 kitchens!)
- Optional: Java 17+ & Maven for Spring Boot meal planner (The Node.js backend includes a high-fidelity local deterministic Mifflin-St Jeor engine fallback if Java is offline).

### Step 1: Start the Backend (Port 5000)
```powershell
cd "d:\Ashish\projects\1st project\backend"
node src/server.js
```
*The server will boot on `http://localhost:5000` and automatically seed initial data on first launch.*

### Step 2: Start the React Frontend (Port 5173 / 3000)
In a second terminal:
```powershell
cd "d:\Ashish\projects\1st project\frontend"
npm.cmd run dev
```
Open your browser and navigate to:
```
http://localhost:5173
```

### Step 3: (Optional) Run the Java Spring Boot Meal Planner (Port 8082)
In a third terminal:
```powershell
cd "d:\Ashish\projects\1st project\meal-planner-service"
mvn spring-boot:run
```

---

## Method 2: Docker Compose Orchestration

To run all four services (MySQL 8, Java Spring Boot, Node.js Express, and React Nginx SPA) in isolated Docker containers:

```bash
docker-compose up --build
```

Services will be mapped to:
- **Frontend SPA:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`
- **Meal Planner Service:** `http://localhost:8082`
- **MySQL Database:** `localhost:3306`

---

## Demo Accounts & Test Credentials

| Role | Email | Password | Intended Screen |
|---|---|---|---|
| **Solo Bachelor Customer** | `customer@fitbite.demo` | `FitBite@2026` | Marketplace, Build Meal, Tiffin Subscriptions |
| **Family Customer** | `family@fitbite.demo` | `FitBite@2026` | Family Combos & Restaurant Marketplace |
| **Tiffin Kitchen Partner** | `seller.tiffin@fitbite.demo` | `FitBite@2026` | `/seller` (Kitchen Tickets, Daily Manifest) |
| **Cloud Kitchen Partner** | `seller.kitchen@fitbite.demo` | `FitBite@2026` | `/seller` (Restaurant Orders, Menu Manager) |
| **System Administrator** | `admin@fitbite.demo` | `FitBite@Admin2026` | `/admin` (FSSAI Verification Desk, Audit Logs) |
| **Delivery Partner** | `delivery@fitbite.demo` | `FitBite@2026` | Milestone Tracking & Dabba Exchange |

*Note: The Auth Modal includes 1-Click Demo Login buttons for each role so you don't even need to type.*

---

## Automated Verification Tests

To run the business rules test suite:
```powershell
cd "d:\Ashish\projects\1st project\backend"
node --test test/businessRules.test.js
```

### Verified Test Cases:
1. **Student Plan Weekend Exclusion:** Mon–Fri delivery calendar calculation verifies 0 Saturdays and 0 Sundays scheduled, and calculates exact eligible weekdays.
2. **Professional Plan 28-Day Cycle:** Verifies exactly 28 consecutive days with skip extension logic.
3. **Bill Calculation with 5% GST & Coupon:** Verifies accurate discount cap application and 5% food tax.
4. **Build-a-Meal Live Pricing & Macros:** Verifies server-side price recalculation matches client options.
5. **Kitchen Data Isolation:** Confirms sellers can only view orders and menus belonging to their assigned kitchen.
