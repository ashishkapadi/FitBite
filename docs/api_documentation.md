# FitBite REST API Reference

All backend endpoints are prefixed with `/api`. Authenticated requests require the HTTP Header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication & Session (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register/customer` | Public | Register new customer account |
| `POST` | `/api/auth/register/seller` | Public | Register partner kitchen (starts in `pending_approval`) |
| `POST` | `/api/auth/login` | Public | Authenticate email & password, returns JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current session profile and role |
| `POST` | `/api/auth/logout` | Authenticated | Invalidate local session |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset token |

---

## 2. Customer Onboarding (`/api/onboarding`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/onboarding/status` | Customer | Fetch current saved onboarding step and answers |
| `POST` | `/api/onboarding/step` | Customer | Save answers for a specific step (1 to 5) |
| `POST` | `/api/onboarding/complete` | Customer | Finalize onboarding and activate personalized recommendations |

---

## 3. Catalog & Search (`/api/catalog`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/catalog/categories` | Public | List food categories |
| `GET` | `/api/catalog/sellers` | Public | List approved and listed cloud kitchens |
| `GET` | `/api/catalog/sellers/:id` | Public | Get single kitchen profile and operating hours |
| `GET` | `/api/catalog/meals` | Public | Query meals with filters (`category`, `dietary`, `seller_id`, `high_protein`, `max_price`) |
| `GET` | `/api/catalog/meals/:id` | Public | Get single meal detail with nutrition estimates |
| `GET` | `/api/catalog/meals/:id/customizations` | Public | Get seller-supported customization options |

---

## 4. Build Your Own Meal Customizer (`/api/custom-meals`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/custom-meals/recalculate` | Public | Server-side calculation of price, calories, protein, carbs, and fat |
| `POST` | `/api/custom-meals/save` | Customer | Save favorite custom meal configuration |
| `GET` | `/api/custom-meals/my` | Customer | Retrieve customer's saved custom meal configurations |

---

## 5. Personalized Diet & Meal Planning (`/api/meal-plans`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/meal-plans/generate` | Public | Calls Java Spring Boot engine to generate 7-day schedule with macros and swaps |
| `GET` | `/api/meal-plans/health` | Public | Healthcheck for Java Spring Boot engine |

---

## 6. Single-Kitchen Cart (`/api/cart`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/cart` | Customer | Fetch active cart, items, and kitchen details |
| `POST` | `/api/cart/items` | Customer | Add meal to cart (returns `409 Conflict` if from different kitchen) |
| `PUT` | `/api/cart/items/:id` | Customer | Update cart item quantity or portion |
| `DELETE` | `/api/cart/items/:id` | Customer | Remove item from cart |
| `DELETE` | `/api/cart` | Customer | Clear active cart |

---

## 7. Orders & Checkout (`/api/orders`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders/calculate` | Customer | Validate coupon code and calculate bill (Subtotal, 5% GST, Delivery Fee, Total) |
| `POST` | `/api/orders/checkout` | Customer | Place order with address, delivery preferences, and payment method |
| `GET` | `/api/orders/my` | Customer | Fetch order history |
| `GET` | `/api/orders/:id` | Customer / Seller | Get order details with immutable snapshots |
| `POST` | `/api/orders/:id/cancel` | Customer | Cancel order (eligible only while in `confirmed` status) |
| `POST` | `/api/orders/:id/review` | Customer | Submit 1–5 star rating and comment for delivered order |

---

## 8. Tiffin Subscriptions (`/api/subscriptions`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/subscriptions/plans` | Public | List available subscription plans (Professional & Student) |
| `POST` | `/api/subscriptions/calculate` | Public | Calculate exact eligible dates, meal count, price, discounts, and skip policy |
| `POST` | `/api/subscriptions/create` | Customer | Activate subscription and generate scheduled deliveries |
| `GET` | `/api/subscriptions/my` | Customer | Fetch customer's active and past subscriptions |
| `GET` | `/api/subscriptions/:id/calendar` | Customer / Seller | Get 4-week rotating menu calendar with preparation cutoff statuses |
| `POST` | `/api/subscriptions/:id/skip` | Customer | Request skip for scheduled meal (extends subscription end date by 1 day) |
| `POST` | `/api/subscriptions/:id/swap` | Customer | Swap scheduled meal with approved alternative dish |

---

## 9. Live Delivery Tracking (`/api/tracking`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tracking/:order_id` | Customer / Partner | Get milestone timeline, assigned rider details, and steel dabba exchange status |
| `POST` | `/api/tracking/simulate-step` | Authenticated | Advance order milestone (`CONFIRMED` -> `PREPARING` -> `READY_FOR_PICKUP` -> `OUT_FOR_DELIVERY` -> `DELIVERED`) with Socket.IO broadcast |

---

## 10. Partner Kitchen Terminal (`/api/seller`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/seller/overview` | Seller | Kitchen metrics, GMV, subscriber count, today's meal counts |
| `GET` | `/api/seller/meals` | Seller | List kitchen dishes with availability status |
| `POST` | `/api/seller/meals` | Seller | Add new dish to kitchen menu |
| `PUT` | `/api/seller/meals/:id` | Seller | Update dish pricing, stock availability, or ingredients |
| `GET` | `/api/seller/orders` | Seller | Active kitchen tickets with customer customizations |
| `PUT` | `/api/seller/orders/:id/status` | Seller | Advance kitchen preparation milestone |
| `GET` | `/api/seller/batch-manifest` | Seller | Fixed-route dispatch manifest grouped by area and slot |

---

## 11. Administrator Operations (`/api/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/metrics` | Admin | Platform-wide GMV, orders, subscribers, and seller counts |
| `GET` | `/api/admin/sellers` | Admin | List all sellers with verification status filter |
| `POST` | `/api/admin/sellers/:id/verify` | Admin | Approve, reject with reason, suspend, or reactivate kitchen |
| `GET` | `/api/admin/users` | Admin | List all registered users |
| `PUT` | `/api/admin/users/:id/status` | Admin | Activate or suspend user account |
| `GET` | `/api/admin/orders` | Admin | Platform order oversight |
| `POST` | `/api/admin/orders/:id/refund` | Admin | Issue customer refund with custom reason |
| `GET` | `/api/admin/audit-logs` | Admin | Inspect operations audit trail |
