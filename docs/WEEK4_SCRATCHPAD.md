# Week 4 Scratchpad — Vendors CSV and UI

This scratchpad captures quick notes, decisions, and test steps for Week 4 (Vendors).

---

## Goals
- Vendors CRUD UI (filter/search)
- CSV import (upsert by name), CSV export, template download
- Basic validations and error handling

## Backend
- Routes: `week4-api` (historical) and `week2-api` (current active)
  - Active store/routes: `week2-api/src/store/vendorsStore.ts`, `week2-api/src/routes/vendors.ts`
- CSV import
  - Accept `.csv` file under `file` field; limit 2MB; mimetype enforced
  - Upsert key: `name`
  - Returns `{ created, updated, failed }`
- CSV export
  - Returns a CSV with fields: name, serviceType, standards, riskLevel, status, lastAuditDate, notes
- Template
  - Static CSV with header row only

## Frontend
- Page: `week2/src/pages/Vendors.tsx`
- Features
  - Filters: keyword, risk, status, framework
  - CRUD modal for add/edit
  - CSV: upload, download template, download full list

## Test Steps
1) Create a few vendors manually.
2) Export CSV; verify columns & values.
3) Download template; confirm header format.
4) Import a CSV that updates existing rows (by name) and creates new ones.
5) Confirm counts `{created, updated, failed}` and list renders updated data.

## Notes / Follow-ups
- Add robust MIME sniffing in API (future library) and AV scan; currently basic checks.
- Consider pagination for large vendor lists.
