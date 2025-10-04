# Week 1 Deployment Guide (Frontend + Backend)

This guide deploys the Week 1 deliverables:
- Frontend (Vite + React + TS) in `week1/`
- Backend API (Node/Express + TS) in `week1-api/`
- Database: MongoDB Atlas

Both can be deployed independently and configured via environment variables.

## 1) Repository layout
- `week1/` – Frontend app
- `week1-api/` – Backend API
- `bitbucket-pipelines.yml` – CI for both

## 2) Prerequisites
- Bitbucket repo connected (already pushed).
- Accounts on:
  - Vercel (frontend hosting) or Netlify
  - Render (backend hosting) or Railway/EC2
  - MongoDB Atlas (managed MongoDB)

## 3) MongoDB Atlas (production DB)
1. Create a free/shared cluster.
2. Create a DB user (username/password) with readWrite.
3. Network Access → allow your backend’s outbound IPs (or 0.0.0.0/0 for testing).
4. Get the Connection String (SRV):
   - Example: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/compliance_week1?retryWrites=true&w=majority`
5. Keep this value for the backend `MONGO_URI`.

## 4) Deploy Backend (Render)
Render settings:
- Service type: Web Service
- Repo: this Bitbucket repo
- Root Directory: `week1-api/`
- Runtime: Node 18+
- Build Command: `npm install && npm run build`
- Start Command: `node dist/server.js`

Environment variables (Render → Environment):
- `PORT` – Render sets automatically. Our server reads `process.env.PORT` (fallback 4000).
- `MONGO_URI` – Atlas connection string (see step 3).
- `JWT_SECRET` – Strong random secret, e.g. `openssl rand -base64 32`.
- `FIELD_ENCRYPTION_KEY` – Base64-encoded 32-byte key, e.g. `openssl rand -base64 32`.
- `CORS_ORIGIN` – Your frontend URL (e.g., `https://your-frontend.vercel.app`).
- (Do NOT set `USE_INMEMORY_DB` in production.)

After deploy, note the backend URL, e.g. `https://your-api.onrender.com`.

Health check:
- `GET /health` should return `{ "status": "ok" }`.

## 5) Deploy Frontend (Vercel)
Vercel settings:
- Import Project → Bitbucket → this repo
- Root Directory: `week1/`
- Build command: `npm run build`
- Output directory: `dist`

Environment variables (Vercel → Settings → Environment Variables):
- `VITE_API_BASE_URL` – your backend URL (e.g., `https://your-api.onrender.com`).

Redeploy after setting env vars. Once live, open the Vercel URL and verify the app.

## 6) Post-deploy checks
- Frontend loads and shows dashboard.
- Register/Login works (token issued by backend).
- Company Profile save succeeds; refresh loads saved values.
- No CORS errors in browser devtools (if seen, recheck `CORS_ORIGIN` on backend and `VITE_API_BASE_URL` on frontend).

## 7) Branch protections
In Bitbucket (Repository settings → Branch permissions):
- Protect `main`.
- Disable force-push.
- Require at least 1 approval for PRs.

## 8) Secrets and security
- Keep `JWT_SECRET` private and strong.
- `FIELD_ENCRYPTION_KEY` must decode to exactly 32 bytes.
- Rotate secrets periodically.
- Prefer IP allowlists on Mongo Atlas instead of 0.0.0.0/0.

## 9) Troubleshooting
- 401 Unauthorized: Ensure you’re logged in and token is sent as `Authorization: Bearer <token>`.
- 403/Blocked by CORS: Backend `CORS_ORIGIN` must match frontend origin exactly.
- 500/Encryption errors: Confirm `FIELD_ENCRYPTION_KEY` is valid base64 of 32 bytes.
- Mongo connectivity: Check Atlas IP allowlist, user credentials, and `MONGO_URI` formatting.

## 10) Local development (quick reference)
Backend with in-memory DB (no Docker):
```
cd week1-api
cp ENV.EXAMPLE .env  # if not present
# Set: USE_INMEMORY_DB=true, JWT_SECRET, FIELD_ENCRYPTION_KEY, CORS_ORIGIN=http://localhost:5173
npm install
npm run dev  # http://localhost:4000
```
Frontend:
```
cd week1
echo 'VITE_API_BASE_URL=http://localhost:4000' > .env.local
npm install
npm run dev  # http://localhost:5173
```
