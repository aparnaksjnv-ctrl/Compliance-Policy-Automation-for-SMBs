# Week 4 — Vendor Compliance Tracker API

Base URL: http://127.0.0.1:5000

Auth: All endpoints require `Authorization: Bearer <token>`.

Source files:
- `week2-api/src/routes/vendors.ts`
- `week2-api/src/models/Vendor.ts`
- `week2-api/src/store/vendorsStore.ts`

---

## Data model (server)
- Vendor
  - `id`: string
  - `userId`: string
  - `name`: string
  - `serviceType?`: string
  - `standards?`: string[] (e.g., `['SOC2', 'ISO27001']`)
  - `riskLevel?`: 'Low' | 'Medium' | 'High'
  - `status?`: 'Compliant' | 'Pending' | 'Not Compliant'
  - `lastAuditDate?`: YYYY-MM-DD
  - `notes?`: string
  - `createdAt`: string (ISO)
  - `updatedAt`: string (ISO)

---

## Endpoints

### GET /vendors
List vendors with filters.

Query params:
- `q` string — matches name or serviceType (case-insensitive)
- `risk` 'Low' | 'Medium' | 'High'
- `status` 'Compliant' | 'Pending' | 'Not Compliant'
- `framework` string — matches entries in `standards` (case-sensitive)

Response:
```json
{ "items": [ /* Vendor */ ] }
```

---

### POST /vendors
Create a vendor.

Body:
```json
{
  "name": "Acme Cloud",
  "serviceType": "Storage",
  "standards": ["ISO27001"],
  "riskLevel": "Medium",
  "status": "Pending",
  "lastAuditDate": "2025-10-01",
  "notes": "SOC2 in progress"
}
```

Response:
```json
{ "id": "<newId>" }
```

---

### PUT /vendors/:id
Update vendor (partial).

Body (any subset of fields above). Response:
```json
{ "id": "<id>" }
```

---

### DELETE /vendors/:id
Delete a vendor.

Response:
```json
{ "ok": true }
```

---

### POST /vendors/upload
Upload vendors in CSV (multipart/form-data, field `file`).

- Accepts `.csv` only, up to 2MB.
- Recognized headers (case-insensitive):
  - `Vendor Name`, `Service Type`, `Compliance Standards`, `Risk Level`, `Status`, `Last Audit Date`, `Notes`
- `standards` can be separated by `;` or `,`.
- Risk/status normalization:
  - `risk`: low/medium/high
  - `status`: compliant/pending/not compliant

Response:
```json
{ "created": number, "updated": number, "failed": number }
```

Example:
```bash
curl -H "Authorization: Bearer $TOKEN" -F file=@vendors.csv http://127.0.0.1:5000/vendors/upload
```

---

### GET /vendors/export
Export vendors to CSV.

Response: `text/csv` download.

---

### GET /vendors/template
Download CSV template with headers.

Response: `text/csv` download.

---

## Notes
- All vendor operations are scoped to the authenticated user.
- Backing store is JSON via `week2-api/src/store/vendorsStore.ts` plus in-memory cache.
- CSV import attempts to validate and skips invalid rows; result counts returned.
