# Week 5 — Audit Logs, PDF Reporting, and Stripe Billing Scaffolding

This document summarizes the Week 5 additions across the backend and frontend: the audit trail (activities), client-side PDF export, and Stripe subscription scaffolding with optional feature gating.

---

## 1) Overview
- Audit Trail (Activities) model + API and UI (Settings → Audit Logs)
- Client-side PDF export for Policies, Audits, Assessments (html2pdf.js)
- Stripe billing scaffolding (status, checkout, portal) + webhook + optional gating

---

## 2) Backend

Base URL (Dev): `http://127.0.0.1:5000`
All endpoints require `Authorization: Bearer <token>` unless stated.

### 2.1 Activities (Audit Trail)
- Model: `week2-api/src/models/Activity.ts`
- Logger: `week2-api/src/utils/activity.ts`
- Route: `week2-api/src/routes/activities.ts` (mounted in `app.ts`)
  - `GET /activities` — query params (all optional):
    - `entityType`: `Policy | Audit | Assessment | Vendor`
    - `action`: `create | update | delete | status_change | export | generate`
    - `entityId`: string
    - `limit`: number (default 200, max 500)
  - Returns: `{ items: Activity[] }`

- Logging integrated into:
  - Policies: `week2-api/src/routes/policies.ts`
    - `create, update, delete, status_change, export, generate`
  - Audits: `week2-api/src/routes/audits.ts`
    - `create, update, status_change, add_finding, update_finding`
  - Assessments: `week2-api/src/routes/assessments.ts`
    - `create, update, status_change, add_item, update_item`
  - Vendors: `week2-api/src/routes/vendors.ts`
    - `create, update, delete, bulk CSV upsert/export/template`

### 2.2 Stripe Billing
- User model fields: `week2-api/src/models/User.ts`
  - `stripeCustomerId?`, `stripeSubscriptionId?`, `subscriptionStatus?`
- Routes: `week2-api/src/routes/billing.ts`
  - `GET /billing/status` → `{ status, stripeCustomerId?, stripeSubscriptionId?, publishableKey? }`
  - `POST /billing/create-checkout` → `{ url }` (opens Stripe Checkout for subscription)
  - `POST /billing/portal` → `{ url }` (opens Stripe Billing Portal)
- Webhook: `POST /billing/webhook` in `week2-api/src/app.ts`
  - Uses `express.raw` before `express.json`. Updates subscription fields on events.
  - Derives `userId` from subscription metadata or the customer metadata.
- Optional Gating: `week2-api/src/middleware/subscription.ts`
  - Apply to premium endpoints. Enabled via env `SUBSCRIPTION_REQUIRED=true`.
  - Applied to: `POST /policies/:id/generate`, `POST /policies/:id/export`.

### 2.3 Seeding (Dev Convenience)
- Auto-seed default admin on startup: `week2-api/src/seed.ts`, called from `week2-api/src/server.ts`.
  - If using in-memory DB and no env provided:
    - Email: `admin@local.test`, Password: `password1234`
  - Or override via env:
    - `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`

---

## 3) Frontend

Base URL (Dev): Vite on `http://localhost:5174`.
API base is `VITE_API_BASE_URL` (default `http://127.0.0.1:5000`).

### 3.1 Audit Logs UI
- Page: `week2/src/pages/Settings.tsx`
  - Section "Audit Logs" with filters for entity, action, entityId, limit.
  - Uses `api.listActivities()`; gracefully handles 404 → shows empty list.
- Client types + API: `week2/src/api.ts`
  - `listActivities(token, { entityType?, action?, entityId?, limit? })`

### 3.2 PDF Export (Client-side)
- Utility: `week2/src/utils/pdf.ts` using `html2pdf.js` bundle import
  - Import: `'html2pdf.js/dist/html2pdf.bundle.min.js'`
  - TS shim: `week2/src/types/html2pdf.bundle.d.ts`
- Pages with "Export PDF" button:
  - Policies: `week2/src/pages/PolicyDetail.tsx`
  - Audits: `week2/src/pages/AuditDetail.tsx`
  - Assessments: `week2/src/pages/AssessmentDetail.tsx`

### 3.3 Billing UI
- Page: `week2/src/pages/Settings.tsx` ("Billing" section)
- API client methods: `week2/src/api.ts`
  - `getBillingStatus(token)`
  - `createCheckout(token, priceId?)` → redirects to Stripe Checkout
  - `openBillingPortal(token)` → redirects to Stripe Billing Portal

---

## 4) Environment Variables

Backend (`week2-api/.env`):
```
# Server
PORT=5000
CORS_ORIGIN=http://localhost:5174
JWT_SECRET=dev-secret

# DB
MONGO_URI=                     # leave empty to use in-memory
USE_INMEMORY_DB=true           # or set false with a valid MONGO_URI

# Stripe (optional until keys available)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
STRIPE_SUCCESS_URL=http://localhost:5174/?billing=success
STRIPE_CANCEL_URL=http://localhost:5174/?billing=cancel
STRIPE_PORTAL_RETURN_URL=http://localhost:5174/settings

# Subscription gating
SUBSCRIPTION_REQUIRED=false

# Seed (optional overrides)
DEFAULT_ADMIN_EMAIL=admin@local.test
DEFAULT_ADMIN_PASSWORD=password1234
```

Frontend (`week2/.env`):
```
VITE_API_BASE_URL=http://127.0.0.1:5000
# Optional: VITE_REQUIRE_SUBSCRIPTION=true (if adding UI-level gating)
```

---

## 5) How to Test (Dev)
1. Start API (`week2-api/`):
   - `npm install`
   - `npm run build && npm start` (auto-seeds admin if in-memory)
2. Start Frontend (`week2/`):
   - `npm install`
   - `npm run dev` → open `http://localhost:5174/login`
3. Login (in-memory default):
   - Email: `admin@local.test`, Password: `password1234`
4. Actions to generate activity logs:
   - Create/update/delete policy; submit for review; approve; export; generate
   - Add/update audit findings; add/update assessment items
   - Vendor CSV upload/export/template
5. Check `Settings → Audit Logs`: use filters and Refresh.
6. Test PDF exports on Policy/Audit/Assessment detail pages.
7. (When Stripe keys ready) Settings → Billing → Start/Manage Subscription and Billing Portal.

---

## 6) Deployment Notes
- Webhook requires raw body; ensure any reverse proxy preserves the payload and headers.
- Set `SUBSCRIPTION_REQUIRED=false` in environments without Stripe keys to avoid blocking premium actions.
- For persistence, configure `MONGO_URI` and set `USE_INMEMORY_DB=false`.

---

## 7) Files Changed Summary (Week 5)
- Backend
  - `week2-api/src/models/Activity.ts`
  - `week2-api/src/utils/activity.ts`
  - `week2-api/src/routes/activities.ts`, mounted in `week2-api/src/app.ts`
  - `week2-api/src/routes/policies.ts` (added logs + gating)
  - `week2-api/src/routes/audits.ts`, `week2-api/src/routes/assessments.ts` (added logs)
  - `week2-api/src/routes/vendors.ts` (added logs)
  - `week2-api/src/routes/billing.ts` + webhook in `app.ts`
  - `week2-api/src/middleware/subscription.ts`
  - `week2-api/src/models/User.ts` (Stripe fields)
  - `week2-api/src/seed.ts` + `week2-api/src/server.ts` (auto-seed)
  - `week2-api/package.json` (added `stripe`)
- Frontend
  - `week2/src/pages/Settings.tsx` (Billing + Audit Logs)
  - `week2/src/api.ts` (activities + billing clients)
  - `week2/src/utils/pdf.ts` + `week2/src/types/html2pdf.bundle.d.ts`
  - `week2/src/pages/AuditDetail.tsx`, `week2/src/pages/AssessmentDetail.tsx`, `week2/src/pages/PolicyDetail.tsx` (PDF export buttons)
