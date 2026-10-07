# FitBite — “Your meals, your way.”

FitBite is an end-to-end food delivery web application that seamlessly blends **on-demand restaurant ordering**, **affordable daily tiffin subscriptions**, **personalized 7-day nutrition plans**, and an interactive **Build Your Own Meal** customizer.

---

## 🌟 Core USP & Platform Highlights

- **Build Your Own Meal Customizer:** Select custom base carbs, protein sources, vegetable sides, portion sizes, spice levels, and sauces with real-time server-side price and macro recalculation.
- **Tiffin Subscriptions:**
  - **Working Professional Plan:** 28 consecutive calendar days (daily meals including weekends) with up to 2 skip days that automatically extend the subscription end date.
  - **Student Plan:** Monthly calendar plan delivering Monday to Friday only (weekends automatically excluded; calculates exact eligible weekdays e.g. 21–22 days).
  - Daily rotating 4-week menus with server preparation cutoffs enforced in `Asia/Kolkata` (IST) timezone.
  - Eco-friendly **Steel Dabba Exchange** tracking (pick up yesterday's empty dabba, deliver today's hot meal).
- **Personalized 7-Day Nutrition Planner:** High-precision Mifflin-St Jeor metabolic calculations (BMR/TDEE), daily macro targets (Protein, Carbs, Fats), 7-day rotational schedule, and approved meal swaps.
- **Contextual Authentication & Onboarding:**
  - Guests browse food freely without forced login walls.
  - Clicking customize, add-to-cart, or subscribe opens an accessible modal with an account selector (`Customer` vs `Partner/Seller`) and queues the user's action to resume post-auth.
  - **Living Situation Routing:** Living with family routes directly to the restaurant marketplace with full-size portions and thalis (bypassing bachelor questions). Solo bachelors configure routine and dietary preferences.
- **Role Security & Governance:**
  - Customer, Partner/Seller, Delivery Partner, and Super Admin roles.
  - New kitchens register in `pending_approval` state; only admin-approved kitchens appear in public search and accept orders.
  - Admin verification desk for 14-digit FSSAI validation, rejection reasons, user management, and security audit logs.
- **Real-Time Delivery Milestones:** Confirmed &rarr; Preparing &rarr; Ready for Pickup &rarr; Out for Delivery &rarr; Delivered fresh, broadcast live via Socket.IO with a built-in demo milestone advancement simulator.

---

## 🛠️ Technology Stack

| Layer | Technology | Responsibilities |
|---|---|---|
| **Frontend** | React 18, Vite, React Router v6, Lucide Icons, Socket.IO Client | Public marketplace, customer onboarding wizard, custom meal builder, subscriptions, checkout, tracking, seller & admin terminals |
| **Core Backend** | Node.js, Express, Socket.IO, JWT, BCrypt | Authentication, single-kitchen cart, order snapshots, subscription calendars, payments, seller operations, admin desk |
| **Meal Planning Service** | Java 17, Spring Boot 3.2.5, Maven | Mifflin-St Jeor BMR/TDEE calculator, macro allocation, deterministic 7-day schedule & meal swaps |
| **Database** | MySQL 8.0 Relational Database | 21 normalized tables, foreign keys, 62 seeded meals across 8 kitchens, 28-day rotational menus |

---

## 🚀 Quick Start Guide

### Option 1: Direct Local Execution (Zero-Config Development)

1. **Start the Core Backend (Port 5000):**
   ```powershell
   cd backend
   node src/server.js
   ```
   *The server tests port 3306 for MySQL. If offline, it automatically engages its local persistent relational store (`backend/data/fitbite_store.json`), pre-seeded with 62 meals and 8 kitchens.*

2. **Start the React Frontend (Port 5173):**
   ```powershell
   cd frontend
   npm.cmd run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **(Optional) Start the Java Spring Boot Engine (Port 8082):**
   ```powershell
   cd meal-planner-service
   mvn spring-boot:run
   ```
   *Note: If Java is offline, the Node.js backend automatically runs its high-fidelity deterministic rule engine fallback.*

---

### Option 2: Docker Compose Orchestration

Run all services in isolated containers:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Meal Planner: `http://localhost:8082`
- MySQL: `localhost:3306`

---

## 🔑 Demonstration Accounts

The platform includes pre-configured demo accounts. The Auth Modal also provides **1-Click Demo Login** buttons:

| Role | Email | Password | Access / Features |
|---|---|---|---|
| **Solo Bachelor Customer** | `customer@fitbite.demo` | `FitBite@2026` | Marketplace, Build Meal, Tiffin Subscriptions |
| **Family Customer** | `family@fitbite.demo` | `FitBite@2026` | Restaurant thalis, family combos |
| **Tiffin Kitchen Partner** | `seller.tiffin@fitbite.demo` | `FitBite@2026` | `/seller` (Kitchen tickets, daily batch manifest) |
| **Cloud Kitchen Partner** | `seller.kitchen@fitbite.demo` | `FitBite@2026` | `/seller` (Active orders, menu availability toggle) |
| **System Administrator** | `admin@fitbite.demo` | `FitBite@Admin2026` | `/admin` (FSSAI verification desk, audit logs, refunds) |
| **Delivery Partner** | `delivery@fitbite.demo` | `FitBite@2026` | Real-time milestone tracking, steel dabba pickup |

---

## 🧪 Automated Business Rule Tests

Run the test suite in `backend/`:
```powershell
cd backend
node --test test/businessRules.test.js
```

### Verified Test Results:
✔ **Student Plan Weekend Exclusion:** Mon–Fri delivery dates exclude 100% of Saturdays and Sundays, billing only for scheduled weekdays.  
✔ **Working Professional Plan 28-Day Cycle:** Includes weekends and extends plan end date on skip requests.  
✔ **Order Bill Calculation:** Accurately applies 5% GST, free delivery above ₹499, and coupon discount caps.  
✔ **Build-a-Meal Pricing & Macro Recalculation:** Server-side calculation guarantees accurate item totals.  
✔ **Kitchen Data Isolation:** Ensures sellers cannot inspect or alter orders belonging to another kitchen.

---

## 📁 Repository Structure

```
fitbite/
├── frontend/               # React 18 + Vite SPA with modern glassmorphism design
│   ├── src/
│   │   ├── components/     # Modals (Auth, Onboarding, CartConflict), Navbar, Footer, MealCard
│   │   ├── context/        # AuthContext, CartContext
│   │   ├── pages/          # Home, Explore, BuildMeal, MealPlanner, Subscriptions, Checkout, Tracking, Orders, Seller, Admin
│   │   └── index.css       # Complete design system tokens (Outfit & Inter fonts)
│   ├── nginx.conf          # Nginx reverse proxy & SPA fallback configuration
│   └── Dockerfile          # Production multi-stage container
├── backend/                # Node.js + Express + Socket.IO core commerce engine
│   ├── src/
│   │   ├── db/             # Dual-engine DB (MySQL 8 pool + local relational JSON store)
│   │   ├── middleware/     # JWT authentication & role-based access control
│   │   ├── routes/         # Auth, catalog, custom meals, meal plans, cart, orders, subscriptions, tracking, seller, admin
│   │   └── server.js       # Main entry point with Socket.IO room handling
│   ├── test/               # Business rules test suite
│   └── Dockerfile
├── meal-planner-service/   # Java + Spring Boot 3.2.5 microservice
│   ├── src/main/java/      # Mifflin-St Jeor engine, macro allocation, 7-day schedule, meal swaps
│   ├── pom.xml
│   └── Dockerfile
├── database/               # Relational database assets
│   ├── schema.sql          # 21 normalized MySQL 8 tables with foreign keys and constraints
│   └── seeds/              # 62 meals, 8 kitchens, 20 categories, 28-day menus
├── docs/                   # Architecture, API reference, database schema, and deployment guide
│   └── deployment_guide.md # Vercel (React) + Render/Railway (Node/Java) + MySQL Production Guide
├── render.yaml             # Render Blueprint Infrastructure-as-Code definition
├── railway.json            # Railway deployment configuration
├── vercel.json             # Root Vercel SPA deployment configuration
└── docker-compose.yml      # Orchestration for turnkey local multi-service launch
```

---

## 🌐 Production Deployment (React on Vercel)

FitBite is production-ready for deployment with the **React frontend on Vercel** and long-running services (Node.js API, Java 17 service, and managed MySQL) hosted on Render or Railway:

1. **Frontend on Vercel:** Root directory `frontend`, Framework preset `Vite`, Build command `npm run build`, Output directory `dist`. Handled via [frontend/vercel.json](frontend/vercel.json) with SPA fallback routing. Set `VITE_API_BASE_URL` and `VITE_SOCKET_URL`.
2. **Backend API on Render / Railway:** Node.js Express server running `npm run db:migrate && node src/server.js` with persistent volume disk for uploads and Socket.IO WebSocket support.
3. **Java Meal Planner:** Containerized Java 17 Spring Boot microservice running on port 8082 with dynamic `$PORT` and health checks.
4. **Managed MySQL:** Production database with SSL enforcement and schema migration runner (`npm run db:migrate`).

👉 Read the complete step-by-step guide in [docs/deployment_guide.md](docs/deployment_guide.md).

---

## 🔒 Security & Third-Party Integrations

- **Password Hashing:** BCrypt with 10 salt rounds.
- **Authorization:** Server-side role guards on every protected route. Hiding client buttons is never used as an authorization boundary.
- **Payment Gateway:** Implemented with a Payment Provider Abstraction. Operates in a clearly labeled local sandbox mode by default; ready for Razorpay live activation via environment credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
- **SMS / OTP Provider:** Configurable via Twilio adapter. Simulated phone verification is explicitly prevented when live credentials are absent.
- **Timezone Enforcement:** Daily kitchen preparation cutoffs are strictly computed in `Asia/Kolkata` (IST) to prevent post-prep cancellations or unfulfilled morning orders.
