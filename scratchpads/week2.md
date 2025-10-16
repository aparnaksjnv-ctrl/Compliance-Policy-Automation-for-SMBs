# Week 2 Scratchpad

- **Scope**
  - Frontend: `week2/`
  - API: `week2-api/`

- **Local run (two terminals)**
  - API (`week2-api/`)
    ```bash
    cd "/Users/sreenivasb/Desktop/Windsurf project/week2-api"
    cat > .env << 'EOF'
    PORT=5001
    USE_INMEMORY_DB=true
    JWT_SECRET=dev-secret
    CORS_ORIGIN=http://localhost:5174
    # Optional for export to S3
    # AWS_S3_BUCKET=your-bucket
    # AWS_REGION=us-east-1
    # AWS_ACCESS_KEY_ID=...
    # AWS_SECRET_ACCESS_KEY=...
    EOF
    npm ci
    npm run dev
    # Health: curl -i http://127.0.0.1:5001/health
    ```
  - Frontend (`week2/`)
    ```bash
    cd "/Users/sreenivasb/Desktop/Windsurf project/week2"
    echo 'VITE_API_BASE_URL=http://localhost:5001' > .env.local
    npm ci
    npm run dev -- --port 5174
    # Open http://localhost:5174
    ```

- **Key files**
  - Quill included via CDN: `week2/index.html`
  - API client: `week2/src/api.ts`
  - Pages: `Dashboard.tsx`, `Policies.tsx`, `PolicyDetail.tsx` (editor + templates + review + versions + diff)
  - Backend routes: `week2-api/src/routes/policies.ts`
  - Backend model: `week2-api/src/models/Policy.ts` (framework, company, variables, versions)

- **Endpoints (week2-api)**
  - CRUD:
    - `GET /policies?q=&status=&framework=`
    - `POST /policies` (creates; if `content` present, seeds `versions`)
    - `GET /policies/:id`
    - `PUT /policies/:id` (partial; if `content` set, appends to `versions` with optional `note`)
    - `DELETE /policies/:id`
  - Templates:
    - `POST /policies/generate` with `{ template: 'GDPR'|'HIPAA'|'CCPA', company?, existingContent? }` → `{ content }`
  - Workflow:
    - `POST /policies/:id/submit-review`
    - `POST /policies/:id/approve` (admin only)
    - `GET /policies/:id/versions` → `{ versions: [{content, note?, createdAt}] }`
  - Export:
    - `POST /policies/:id/export` → `{ ok, url? | content? }`

- **Frontend UX (Policy detail)**
  - Framework and Company fields stored on the policy.
  - Rich Text Editor (Quill) for `content` with sanitize preview and diff against last version.
  - Generate (template) with company JSON upload; Save appends a new version.
  - Submit for Review / Approve (admin); Export to S3 or download.

- **Env vars**
  - `week2/.env.local`: `VITE_API_BASE_URL=http://localhost:5001`
  - `week2-api/.env`: `PORT`, `USE_INMEMORY_DB`, `JWT_SECRET`, `CORS_ORIGIN`, optional AWS vars.

- **Verification**
  - Policies list loads, search/filter by status and framework works.
  - Policy detail: Generate from template (GDPR/HIPAA/CCPA) using uploaded company JSON, edit in Quill, Save, see Versions and Diff, Submit/Approve, Export.
