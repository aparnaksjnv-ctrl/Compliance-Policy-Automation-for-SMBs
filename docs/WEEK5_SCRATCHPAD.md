# Week 5 Scratchpad — Audit Logs, PDF Export, Billing

This scratchpad records notes, decisions, edge cases, and validation steps for Week 5.

---

## Goals
- Implement audit trail (Activities) across core entities.
- Add client-side PDF export (Policies, Audits, Assessments).
- Scaffold Stripe subscription (status, checkout, portal, webhook) and optional gating.

## Backend Notes
- Activities
  - Model: `week2-api/src/models/Activity.ts`
  - Logger: `week2-api/src/utils/activity.ts`
  - Route: `week2-api/src/routes/activities.ts` (GET with filters)
  - Integrated logs in policies, audits, assessments, vendors.
- Billing
  - Routes: `week2-api/src/routes/billing.ts`
  - Webhook: `/billing/webhook` (raw body before json)
  - Gating: `week2-api/src/middleware/subscription.ts` → applied to policy export/generate.
- Seeding
  - `week2-api/src/seed.ts` run from `src/server.ts` to auto-create admin in memory or via env override.

## Frontend Notes
- PDF
  - `week2/src/utils/pdf.ts` uses `html2pdf.js/dist/html2pdf.bundle.min.js` (lazy import)
  - Pages: `PolicyDetail`, `AuditDetail`, `AssessmentDetail` expose "Export PDF".
- Settings
  - Billing panel (status, checkout, portal)
  - Audit Logs panel with filters; handles 404 → empty list
- API client: `week2/src/api.ts` adds billing + activities.

## Env
- API
  - `SUBSCRIPTION_REQUIRED=false` while keys are missing
  - Stripe vars optional until ready
- Frontend
  - `VITE_API_BASE_URL=http://127.0.0.1:5000`

## Test Steps
1) Login (auto-seeded admin for in-memory): `admin@local.test` / `password1234`.
2) Create/update/approve a policy; export + generate content → Audit Logs.
3) Add audit finding; update it → Audit Logs.
4) Add assessment item; update it → Audit Logs.
5) Vendor CSV upload/export/template → Audit Logs.
6) Verify Settings → Audit Logs reflects actions with filters.
7) Export PDFs on Policy/Audit/Assessment detail pages; confirm files.
8) When Stripe keys are ready, test Checkout + Portal + webhook status updates.

## Follow-ups
- Optional UI gating for PDF/export buttons with `VITE_REQUIRE_SUBSCRIPTION`.
- Persist DB (`MONGO_URI`) for real data; disable in-memory.
