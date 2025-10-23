# Week 3 — Risk Assessment Checklist API

Base URL: http://127.0.0.1:5000

Auth: All endpoints require `Authorization: Bearer <token>`.

Source files:
- `week2-api/src/routes/assessments.ts`
- `week2-api/src/models/Assessment.ts`

---

## Data model (server)
- Assessment
  - `userId`: ObjectId
  - `name`: string
  - `owner`: string
  - `framework?`: 'GDPR' | 'HIPAA' | 'CCPA' | 'Other'
  - `status`: 'Draft' | 'In Progress' | 'Completed'
  - `dueDate?`: ISO date
  - `items`: AssessmentItem[]
- AssessmentItem
  - `text`: string
  - `category?`: string
  - `severity`: 'Low' | 'Medium' | 'High' (default 'Medium')
  - `response`: 'Yes' | 'No' | 'N/A' (default 'N/A')
  - `notes?`: string
  - `evidenceUrls?`: string[] (URLs)
  - `createdAt`: Date

---

## Endpoints

### GET /assessments
List assessments with optional filters.

Query params:
- `q` string (name/owner contains)
- `status` 'Draft' | 'In Progress' | 'Completed'
- `framework` 'GDPR' | 'HIPAA' | 'CCPA' | 'Other'
- `dueBefore` ISO date or YYYY-MM-DD

Response:
```json
{ "items": [ /* Assessment documents */ ] }
```

Example:
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://127.0.0.1:5000/assessments?q=security&status=Draft"
```

---

### POST /assessments
Create an assessment.

Body:
```json
{
  "name": "Security Baseline",
  "owner": "Admin",
  "framework": "GDPR",
  "status": "Draft",
  "dueDate": "2025-12-31"
}
```

Response:
```json
{ "id": "<newId>" }
```

Example:
```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Security Baseline","owner":"Admin","status":"Draft"}' \
  http://127.0.0.1:5000/assessments
```

---

### GET /assessments/:id
Fetch a single assessment by id.

Response: full assessment document or 404.

---

### PUT /assessments/:id
Patch assessment fields.

Body (any subset):
```json
{
  "name": "Updated name",
  "owner": "SecOps",
  "framework": "HIPAA",
  "status": "In Progress",
  "dueDate": "2025-11-01"
}
```

Response:
```json
{ "id": "<id>" }
```

---

### POST /assessments/:id/items
Add a checklist item.

Body:
```json
{
  "text": "Encrypt data at rest",
  "category": "Storage",
  "severity": "High"
}
```

Response:
```json
{ "id": "<itemId>" }
```

---

### PUT /assessments/:id/items/:iid
Update a checklist item.

Body (any subset):
```json
{
  "text": "Encrypt data at rest",
  "category": "Storage",
  "severity": "Medium",
  "response": "Yes",
  "notes": "Enabled on all volumes",
  "evidenceUrls": ["https://example.com/proof.pdf"]
}
```

Response:
```json
{ "id": "<itemId>" }
```

---

## Notes
- `dueDate` strings are parsed into dates server-side; invalid values are ignored.
- All list operations are scoped to the authenticated user (`userId`).
- Sorting for lists is most-recently updated first.
