# Week 4 vs Week 5 — Comparison Summary

This document highlights the key differences and improvements from Week 4 (Vendors CSV and UI) to Week 5 (Audit Logs, PDF, Billing).

---

## Scope
- **Week 4**
  - Vendors CRUD, filtering and CSV import/export/template.
  - Focused on supply-chain compliance tracking.
- **Week 5**
  - Cross-entity audit trail (Activities) + UI in Settings.
  - Client-side PDF exports for Policies/Audits/Assessments.
  - Stripe billing scaffolding and optional subscription gating.

---

## Backend
- **Week 4**
  - `vendors.ts` routes and `vendorsStore.ts` data layer.
  - CSV parsing (size caps, mimetype checks), upsert-by-name.
- **Week 5**
  - Activity model/route and light-weight logger util.
  - Billing: status, checkout, portal; webhook; user subscription fields.
  - Subscription gating middleware for premium actions (policy export/generate).

---

## Frontend
- **Week 4**
  - Vendors page with CRUD modal, filters, CSV buttons.
- **Week 5**
  - Settings page: Billing and Audit Logs panels.
  - “Export PDF” buttons across detail pages using html2pdf.js.

---

## Security/UX Notes
- **Week 4**
  - CSV endpoints validate basic MIME and size limits; plan to add AV scan.
- **Week 5**
  - Auditing avoids sensitive content in metadata; allows filtered views.
  - Billing UI gated via env until Stripe keys are ready.

---

## Suggested Next Improvements
- UI polish (modern cards, gradient header, improved focus/hover states).
- Optional UI gating toggles for premium features.
- Persistent DB by default for UAT/Prod with seed overrides.
