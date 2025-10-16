# Week 3 Scratchpad

- **Scope (planned)**
  - Frontend: `week2/` currently contains UI scaffolding for Dashboard/Audits/Assessments pages.
  - Backend: No Week 3 routes are present under `week2-api/` (no `/audits` or `/assessments` endpoints).

- **Planned Features**
  - Risk Assessment Checklist Builder
    - Pre-set compliance checklist templates (GDPR/HIPAA controls)
    - Dynamic item builder with severity and notes
    - Auto-scoring and dashboard visualization
  - Audits & Findings
    - Track audits, findings, statuses

- **Frontend (present)**
  - Pages: `Dashboard.tsx` shows metrics from mock fallbacks.
  - API client (`week2/src/api.ts`) contains Week 3 client methods with fallback to mocks in `week2/src/mocks/audits` when server routes are missing.

- **Backend (missing)**
  - Add to `week2-api/`:
    - `/audits` (CRUD), `/audits/:id/findings` (CRUD)
    - `/assessments` (CRUD), `/assessments/:id/items` (CRUD)
    - Filters: `q`, `status`, `framework`, `dueBefore`

- **Local run (future)**
  - After adding Week 3 routes, reuse API run instructions.
  - Frontend already calls API and falls back to mocks if server routes are not implemented.

- **Proposed DB models**
  - `Audit { userId, name, owner, status: 'Draft'|'In Progress'|'Closed', dueDate, findings[] }`
  - `Finding { title, description?, severity: 'Low'|'Medium'|'High', status: 'Open'|'Resolved', createdAt }`
  - `Assessment { userId, name, owner, framework?, status: 'Draft'|'In Progress'|'Completed', dueDate?, items[] }`
  - `AssessmentItem { text, category?, severity, response: 'Yes'|'No'|'N/A', notes?, evidenceUrls?, createdAt }`

- **Verification (future)**
  - Dashboard shows audit/assessment metrics from real API.
  - Audits list/details; add/update findings.
  - Assessments list/details; add/update items, compute completion.
