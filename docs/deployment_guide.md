# FitBite Production Deployment Guide
**Architecture:** React Frontend (Vercel) + Node.js API (Render/Railway) + Java Meal Planner + Managed MySQL + Persistent Storage

---

## 1. System Deployment Architecture

FitBite's architecture decouples static/edge presentation from stateful commerce and microservices:

```
┌────────────────────────────────────────────────────────┐
│               End Users (Web & Mobile)                 │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       HTTPS / Static Assets     HTTPS API / WSS WebSocket
                ▼                        ▼
┌───────────────────────────────┐ ┌───────────────────────────────────────┐
│     Vercel Edge Network       │ │    Node.js Express Backend API        │
│    (React 18 + Vite SPA)      │ │    (Render / Railway / Docker Host)   │
│  - Host: vercel.app           │ │  - Port: 5000                         │
│  - SPA Fallback Rewrites      │ │  - REST Endpoints (/api/*)            │
│  - Immutable Asset Caching    │ │  - Real-Time Socket.IO                │
│  - Strict Security Headers    │ │  - Idempotent Subscription Scheduling │
└───────────────────────────────┘ └───────┬───────────────────────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     │                                         │
                     ▼                                         ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
│   Java Spring Boot Meal Planner       │ │       Managed MySQL 8 Database        │
│   (Render / Railway Docker Service)   │ │  (Railway / PlanetScale / AWS RDS)    │
│  - Port: 8082                         │ │  - Port: 3306                         │
│  - Internal REST Microservice         │ │  - SSL Encrypted                      │
│  - Calorie & Macronutrient Engine     │ │  - Connection Pooling (10 conns)      │
└───────────────────────────────────────┘ └───────────────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────┐
│      Persistent Object Storage        │
│   (Cloudflare R2 / AWS S3 / Volume)   │
│  - Public: Food & Meal Images         │
│  - Private: FSSAI Seller Documents    │
└───────────────────────────────────────┘
```

### Why this infrastructure separation is required:
1. **Frontend on Vercel:** Optimal globally distributed CDN performance, instantaneous Edge invalidation, automatic branch preview deploys, and asset compression.
2. **Backend on a Persistent Host (Render / Railway / Container VPS):** FitBite uses stateful long-lived Socket.IO WebSockets for live rider delivery tracking, continuous background subscription calendar generation, and seller kitchen alerts. Serverless function runtimes cannot sustain persistent bidirectional WebSocket tunnels.
3. **Java Microservice:** Requires a long-running JVM process (Temurin OpenJDK 17) with dedicated heap memory (`JAVA_OPTS=-Xmx384m`).

---

## 2. Environment Variables Specification

### A. Frontend (Vercel Project Settings)
Add these under **Project Settings > Environment Variables** in the Vercel Dashboard:

| Variable Name | Environment | Description | Example Value |
|---|---|---|---|
| `VITE_API_BASE_URL` | Production & Preview | HTTPS base URL for Express backend API | `https://api.fitbite.app/api` or `https://fitbite-api.onrender.com/api` |
| `VITE_SOCKET_URL` | Production & Preview | Hostname for Socket.IO real-time tracking | `https://api.fitbite.app` or `https://fitbite-api.onrender.com` |
| `VITE_MAPS_DEMO_KEY` | Production & Preview | Optional Google Maps key for tracking display | `demo_preview_mode` |

> [!IMPORTANT]
> Never put database credentials, JWT secrets, or payment private keys in the frontend! All `VITE_*` variables are embedded into client bundle JavaScript.

---

### B. Backend API (Render / Railway / Container Host)
Add these under your backend service environment settings:

| Variable Name | Required | Description | Example / Default |
|---|---|---|---|
| `PORT` | Yes | HTTP listening port | `5000` |
| `NODE_ENV` | Yes | Node runtime mode | `production` |
| `CLIENT_URL` | Yes | Primary production frontend URL | `https://fitbite.vercel.app` |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of permitted CORS origins | `https://fitbite.vercel.app,https://fitbite-staging.vercel.app` |
| `DATABASE_URL` | Yes (or discrete) | Connection URI for managed MySQL | `mysql://user:pass@host:3306/fitbite_db?ssl=true` |
| `DB_HOST` | Discrete fallback | Hostname of MySQL database | `mysql.provider.internal` |
| `DB_PORT` | Discrete fallback | MySQL port | `3306` |
| `DB_USER` | Discrete fallback | Database user | `fitbite_app` |
| `DB_PASSWORD` | Discrete fallback | Database password | `StrongSecretPass123` |
| `DB_NAME` | Discrete fallback | Database name | `fitbite_db` |
| `DB_SSL` | Yes | Enforce TLS connection to MySQL | `true` |
| `ENABLE_LOCAL_JSON_FALLBACK` | Yes | Fail-fast if MySQL is down in prod | `false` |
| `JWT_SECRET` | Yes | Cryptographic HMAC secret for auth tokens | Minimum 64-char random hex string |
| `JWT_EXPIRES_IN` | Yes | Token duration | `7d` |
| `JAVA_MEAL_PLANNER_URL` | Yes | Internal or private URL to Java service | `http://fitbite-meal-planner:8082` |
| `STORAGE_PROVIDER` | Yes | File storage provider (`local` or `s3`) | `local` (or `s3`) |
| `UPLOADS_DIR` | If `local` | Path to persistent mounted volume disk | `/var/data/uploads` |
| `S3_BUCKET_NAME` | If `s3` | AWS S3 or Cloudflare R2 bucket name | `fitbite-production-assets` |
| `AWS_ACCESS_KEY_ID` | If `s3` | S3 / R2 access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | If `s3` | S3 / R2 secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_REGION` | If `s3` | AWS Region or `auto` for R2 | `ap-south-1` |
| `STORAGE_PUBLIC_URL` | If `s3` | CDN or public bucket endpoint | `https://cdn.fitbite.app` |
| `PAYMENT_PROVIDER_MODE` | Yes | Payment mode (`demo` or `live`) | `demo` |
| `PAYMENT_GATEWAY_KEY_ID` | If live | Razorpay Key ID / Stripe Key | `rzp_live_...` |
| `PAYMENT_GATEWAY_SECRET` | If live | Razorpay Key Secret / Stripe Secret | `...` |
| `PAYMENT_WEBHOOK_SECRET` | If live | Webhook signature secret | `whsec_...` |

---

### C. Java Meal Planner Microservice
| Variable Name | Required | Description | Example / Default |
|---|---|---|---|
| `PORT` | Yes | Injected by container host | `8082` |
| `JAVA_OPTS` | Recommended | Heap memory ceiling for container | `-Xmx384m -Xms128m` |
| `FITBITE_PLANNER_RULES_ENABLED` | Yes | Enable rule-based meal composition | `true` |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Managed MySQL Database & Schema Migration
1. Provision a managed MySQL 8.0 instance on **Railway**, **PlanetScale**, **AWS RDS**, or **Aiven**.
2. Note the connection URL (e.g. `mysql://user:pass@host:3306/fitbite_db?ssl=true`).
3. Run the schema migrations from your terminal or CI/CD pipeline:
   ```bash
   cd backend
   DATABASE_URL="mysql://user:pass@host:3306/fitbite_db?ssl=true" npm run db:migrate
   ```
4. To populate the production database with the initial 62 meals, 8 kitchens, and demo accounts:
   ```bash
   DATABASE_URL="mysql://user:pass@host:3306/fitbite_db?ssl=true" node src/db/migrate.js --seed
   ```

---

### Step 2: Deploy the Java Meal Planner Service
FitBite includes a preconfigured multi-stage `meal-planner-service/Dockerfile`.

#### On Render:
1. Click **New + > Web Service**.
2. Connect your Git repository.
3. Select Root Directory: `meal-planner-service`.
4. Environment: **Docker**.
5. Set Health Check Path: `/health`.
6. Add environment variable: `PORT=8082`.
7. Once deployed, note the private service URL (e.g., `http://fitbite-meal-planner:8082` if within the same Render Environment Group).

#### On Railway:
1. Click **+ New > GitHub Repo**.
2. In service settings, set Root Directory: `meal-planner-service`.
3. Railway detects the `Dockerfile` automatically. Set port to `8082`.
4. Check health endpoint: `https://<service-url>/health`.

---

### Step 3: Deploy the Node.js Express Backend API

#### Option A: Using the Render Blueprint (`render.yaml`)
1. In your Render Dashboard, click **Blueprints > New Blueprint Instance**.
2. Select your repository. Render automatically reads `render.yaml`.
3. It provisions:
   - `fitbite-api` with persistent disk at `/var/data/uploads` (for food pictures and private FSSAI documents).
   - `fitbite-meal-planner` container.
   - Automatically sets up internal service networking and health checks.

#### Option B: Manual Configuration on Render or Railway
1. **Root Directory:** `backend`
2. **Build Command:** `npm install`
3. **Start Command:** `npm run db:migrate && node src/server.js`
4. **Health Check Path:** `/health`
5. Configure all backend environment variables from Section 2.B.
6. Verify service health by navigating to: `https://<your-backend-host>/health`.
   Expected response:
   ```json
   {
     "status": "UP",
     "service": "fitbite-backend",
     "database_mode": "mysql",
     "uptime_seconds": 12,
     "timestamp": "2026-10-07T12:00:00.000Z"
   }
   ```

---

### Step 4: Deploy the React Frontend on Vercel

FitBite is preconfigured with:
- `frontend/vercel.json` (SPA rewrites, asset caching, security headers).
- `vercel.json` (root directory backup).
- Automatic `window.fetch` interceptor resolving `/api/*` to `VITE_API_BASE_URL` with cross-origin credentials and Bearer token injection.

#### Deployment via Vercel Dashboard:
1. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Import your Git repository.
3. In **Project Configuration**:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `frontend`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://<your-backend-host>/api`
   - `VITE_SOCKET_URL`: `https://<your-backend-host>`
   - `VITE_MAPS_DEMO_KEY`: `demo_preview_mode`
5. Click **Deploy**.
6. When deployment finishes, Vercel assigns a URL (e.g. `https://fitbite.vercel.app`).
7. Update `ALLOWED_ORIGINS` in your backend environment variables to include your new Vercel production URL.

---

## 4. SPA Routing & Nested URL Verification

Vercel static deployments without rewrite configuration fail with 404 when directly opening deep links. FitBite's `frontend/vercel.json` ensures full SPA fallback compatibility:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Verified Deep Route Checklist:
- [x] `/explore` - Restaurant & homestyle tiffin marketplace with dietary filters
- [x] `/build-meal` - Interactive macro calculator with instant portion recalculation
- [x] `/meal-planner` - Health goal wizard integrated with Java Spring Boot recommendations
- [x] `/subscriptions` - Tiffin subscription plans (Student 22-day vs Professional 28-day)
- [x] `/checkout` - Single-kitchen cart checkout with 5% GST and demo payment modal
- [x] `/tracking/ord_demo_01` - Real-time rider GPS tracking and live milestone progression
- [x] `/orders` - Customer order history and active meal status
- [x] `/seller` - Kitchen partner portal, active tickets, and batch delivery manifest
- [x] `/admin` - Platform metrics, revenue GMV, and FSSAI seller verification desk

---

## 5. End-to-End Verification Matrix

| Flow | Verified Action | Expected Outcome |
|---|---|---|
| **Customer Auth** | Sign in with `customer@fitbite.demo` / `FitBite@2026` | JWT issued, stored in `localStorage`, session restored on page refresh |
| **Onboarding Wizard** | Step 1: Goal -> Step 2: Diet -> Step 3: Logistics | Onboarding marked complete, preference profile saved |
| **Custom Meal Builder** | Change base to "Brown Rice" (+₹20), add "Paneer" (+₹45) | Calories (+130 kcal) and price update dynamically in UI and server snapshot |
| **Cart Isolation** | Add item from Kitchen A, then add item from Kitchen B | `CartConflictModal` displays kitchen conflict warning with replace option |
| **Checkout & GST** | Place order with coupon `FITBITE50` | 5% GST calculated accurately, subtotal discounted, order created |
| **Payment Verification** | Complete checkout via Demo Gateway | Idempotent server-side capture, order marked `paid` |
| **Live Tracking** | Open `/tracking/:orderId` | Socket.IO room joined, step milestones animate (Confirmed -> Cooking -> Delivery) |
| **Tiffin Subscription** | Request Skip Day on scheduled lunch | Skip validated against cutoff time; cycle automatically extended by 1 day |
| **Seller Terminal** | Sign in with `seller.tiffin@fitbite.demo` / `FitBite@2026` | Overview stats, incoming tickets, batch delivery manifest generated |
| **Admin Control Plane** | Sign in with `admin@fitbite.demo` / `FitBite@Admin2026` | Platform GMV metrics visible, FSSAI verification approve/reject buttons active |

---

## 6. Production Security & Hardening Summary

1. **Cross-Origin Security (CORS & Cookies):**
   - Backend only accepts configured origins (`ALLOWED_ORIGINS`) and wildcard Vercel preview domains (`*.vercel.app`).
   - Authentication tokens are validated via both `Authorization: Bearer <token>` and `SameSite: None; Secure` cookies.
2. **Object Storage Privacy:**
   - Public meal photos reside under `/uploads/public/` or public S3 prefix.
   - Private seller verification documents (FSSAI licenses, tax documents) reside under `/uploads/private/` and are accessible solely through `/api/upload/documents/:filename` which checks that the requester is an admin or the document's owner.
3. **Database Resilience:**
   - Production mode (`NODE_ENV=production`) enforces connection to managed MySQL and disables silent local JSON fallback unless `ENABLE_LOCAL_JSON_FALLBACK=true` is explicitly provided.
4. **Payment Integrity:**
   - Live payment provider requires real credentials (`PAYMENT_GATEWAY_KEY_ID` & `SECRET`); otherwise defaults safely to labeled `demo_gateway`.
   - Payment webhooks enforce HMAC SHA256 cryptographic signature validation.
