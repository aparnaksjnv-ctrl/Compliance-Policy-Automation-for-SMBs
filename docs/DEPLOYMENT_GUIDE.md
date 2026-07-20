# Deployment Guide — Week 4 (Compliance Command Center)

Covers the week 4 stack: the Express/Mongoose API in `week4-api/` and the
React/Vite frontend in `week4/`. Target: API on Railway, frontend on Netlify.

Everything below was verified against this codebase on 2026-07-18. Where a
setting is read from a file, the file and line are named so it can be
re-checked rather than trusted.

---

## 0. Live environments

| | URL |
|---|---|
| Frontend (Netlify) | https://compliance-command-centre.netlify.app |
| API (Railway) | https://week4-api-production.up.railway.app |

Railway project `compliance-week4-api`, service `week4-api`, environment
`production`. Netlify site `compliance-command-centre`
(id `c19b96f6-7626-4bd0-9c35-4d622bb1f737`).

Deployed and verified end to end on 2026-07-19 following §7.

---

## 1. Architecture

| Piece | Path | Local port | Deploy target |
|---|---|---|---|
| API | `week4-api/` | 5000 | Railway |
| Frontend | `week4/` | 5176 | Netlify |
| Database | MongoDB Atlas | — | Atlas (already hosted) |

The API is stateless apart from Atlas. The frontend is a static SPA build.

---

## 2. Local development

```bash
# terminal 1 — API
cd week4-api
npm install
npm run dev          # PORT=5000, CORS_ORIGIN=http://localhost:5176

# terminal 2 — frontend
cd week4
npm install
npm run dev          # port 5176, VITE_API_BASE_URL=http://127.0.0.1:5000
```

Both ports are hardcoded in the `dev` scripts in each `package.json`, via
`cross-env`. `week4-api/.env` must exist (see §5); `db.ts` throws
`MONGO_URI not set in .env` without it.

### Local gotcha: stale watcher processes

`ts-node-dev --respawn` restarts the API after a crash, so a killed shell can
leave an orphan still holding port 5000. A new `npm run dev` then fails with
`EADDRINUSE` and **you keep talking to the old build** — changes appear not to
take effect. Check before debugging anything else:

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*week4-api*' } |
  Select-Object ProcessId

# kill all of them
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*week4-api*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

### Local gotcha: two checkouts of this repo

This repo exists twice on the dev machine, both pointed at the same GitHub
remote. `C:\Users\aparn\CascadeProjects\Compliance-Policy-Automation-for-SMBs`
is the live one that gets run and edited. Confirm which copy you are in before
editing or deploying.

---

## 3. Build commands

Verified by running them:

| Service | Build | Start |
|---|---|---|
| `week4-api` | `npm install && npm run build` | `npm run start` |
| `week4` | `npm run build` | static — publish `dist` |

- `week4-api` build is `tsc -b`, emitting to `dist/` (`tsconfig.json`
  `outDir: "dist"`, `rootDir: "src"`). `npm run start` is
  `node dist/server.js`, so **the build must run before start** or the file
  will not exist.
- `week4/netlify.toml` already declares `command = "npm run build"` and
  `publish = "dist"`, plus an SPA fallback redirect (`/*` → `/index.html`,
  200). Netlify picks these up automatically; only the **base directory**
  (`week4`) needs setting in the site config, since the toml does not set it.

### Railway compatibility

`week4-api/src/server.ts` binds `parseInt(process.env.PORT || '5000', 10)` on
host `0.0.0.0`. That is what Railway requires — it injects `PORT` and expects
the process to bind all interfaces. No change needed.

---

## 4. The CORS gotcha

This is the failure most likely to bite after deploying, and it is not
obvious from the error in the browser.

`week4-api/src/app.ts` builds its allowlist as:

```ts
const allowedOrigins = new Set([config.corsOrigin, 'http://localhost:5176', 'http://127.0.0.1:5176'])
const loopbackOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/
```

Consequences:

1. **`CORS_ORIGIN` must match the deployed frontend origin exactly** — scheme
   included, **no trailing slash**, no path. `https://foo.netlify.app/` (with
   slash) will not match `https://foo.netlify.app`, because the check is a
   `Set` membership test on the raw `Origin` header, not a normalised compare.
2. **Any loopback origin is allowed on any port.** So CORS problems are
   invisible locally — the regex lets `http://localhost:<anything>` through
   regardless of `CORS_ORIGIN`. The first time the setting actually matters is
   in production.
3. **Netlify deploy previews will be blocked.** Previews get their own
   subdomain (`deploy-preview-N--site.netlify.app`), which is not in the
   allowlist. Only the production URL will work unless the allowlist is
   widened.
4. A rejected origin surfaces as a **500** from the error middleware, not a
   clean 403 — the `cors` option calls `callback(new Error(...))`, which lands
   in `errorHandler`. So a 500 on a cross-origin request is a likely CORS
   symptom, not necessarily a server bug.

Because of (2), always verify CORS against the **deployed** frontend URL, never
against localhost.

---

## 5. Environment variables

### API (Railway)

| Var | Required | Notes |
|---|---|---|
| `MONGO_URI` | **yes** | Atlas connection string. `db.ts` throws without it. Contains a password — set via dashboard/CLI only. |
| `JWT_SECRET` | **yes** | Falls back to the literal `'dev-secret'` (`config.ts:17`) if unset. Must be set in production. |
| `CORS_ORIGIN` | **yes** | Exact frontend origin, no trailing slash. See §4. Defaults to `http://localhost:5173` (`config.ts:18`) — note that default does not even match the local dev port. |
| `PORT` | no | Railway injects it. Do not hardcode. |
| `FIELD_ENCRYPTION_KEY` | no | Read into `config.fieldEncryptionKey`, defaults to `''`. Safe to leave unset. |
| `USE_INMEMORY_DB` | no | **Not referenced anywhere in `week4-api/src`.** It has no effect in this codebase. Listed here only because it appears in older instructions. |

Atlas must also allow inbound connections from Railway — Railway does not
publish static egress IPs on all plans, so the Atlas Network Access list may
need `0.0.0.0/0` or a Railway-provided range. **Check this before assuming the
app is broken**; a blocked Atlas connection looks like a hung or 500ing API.

### Frontend (Netlify)

| Var | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | **yes** | Railway API URL, no trailing slash. Falls back to `http://127.0.0.1:5000` (`api.ts:1`), which silently fails in production. |
| `VITE_USE_MOCKS` | no | Leave unset. See §6. |

Vite inlines `VITE_*` at **build time**, not runtime. Changing
`VITE_API_BASE_URL` requires a **rebuild**, not just a redeploy of existing
artifacts.

### Secrets rule

Never commit real values. `.gitignore` covers `.env` and `.env.*` (with
`!.env.example`); no `.env` has ever been committed to this repo. Set secrets
through the Railway/Netlify dashboards or CLI only.

---

## 6. Mock data flag

`week4/src/api.ts` can serve fixture data from `src/mocks/audits.ts` when audit
requests fail. This is gated behind `VITE_USE_MOCKS` and is **off unless the
flag is exactly `"true"`**.

Leave it unset in every deployed environment. When enabled it makes a dead
backend render as a normal, populated audits page — which previously disguised
a full API outage as a working app. With the flag off, failures surface to the
caller; when on, each fallback logs a warning naming the flag.

---

## 7. Deploy order

The two services reference each other, so this ordering avoids a chicken-and-egg:

1. Deploy the API to Railway with `CORS_ORIGIN` set to a placeholder.
2. Note the Railway URL. Verify: `curl <railway-url>/health` → `200`.
3. Deploy the frontend to Netlify with `VITE_API_BASE_URL` = Railway URL.
4. Note the Netlify URL.
5. Update `CORS_ORIGIN` on Railway to the exact Netlify URL, then redeploy the
   API (env change requires a restart to take effect).
6. Verify end-to-end against the Netlify URL — log in, watch the browser
   console for CORS errors.

---

## 8. Post-deploy verification

```bash
curl -i <railway-url>/health          # expect 200
curl -i <railway-url>/auth/me         # expect 401 (route alive, auth enforced)

# CORS preflight from the real frontend origin
curl -i -X OPTIONS <railway-url>/policies \
  -H "Origin: <netlify-url>" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization"
# expect 204 with access-control-allow-origin echoing <netlify-url>
```

A `500` on the preflight, or a missing `access-control-allow-origin` header,
means `CORS_ORIGIN` does not match — re-read §4.

Then in the browser: load the Netlify URL, log in, and confirm the console is
free of CORS errors and that Settings shows your real email and role.

Confirmed in production: a **rejected origin returns 500, not 403** (§4.4). The
preflight from the correct origin returns `204` with
`access-control-allow-origin` echoing it exactly.

---

## 9. Renaming a deployment URL

Renaming either side breaks the other until its counterpart is updated.

### Frontend (Netlify subdomain)

Netlify CLI 26.x has **no `sites:update` command** — only create/delete/list/
search. Rename via the dashboard (Site configuration → Site details) or the API
passthrough:

```bash
netlify api updateSite --data '{"site_id":"<id>","body":{"name":"<newname>"}}'
```

The site id is in `week4/.netlify/state.json`.

**Then immediately update the API**, or every request fails as a 500:

```bash
cd week4-api
railway variable set "CORS_ORIGIN=https://<newname>.netlify.app" --service week4-api
```

Railway redeploys on a variable change; wait for it before re-testing. No
frontend rebuild is needed for this direction — only the frontend's own address
changed, and `VITE_API_BASE_URL` still points at the same API.

### Checking whether a subdomain is free

`*.netlify.app` has **wildcard DNS**, so `nslookup` resolves for every name and
is useless as an availability test. Use the HTTP status instead:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<name>.netlify.app
# 404 = available; anything else (200/401/403) = taken by another account
```

An `updateSite` call with a taken name fails as `Unprocessable Entity`, which
does not say the name is the problem — check availability first.

### API (Railway domain)

```bash
railway domain update            # edit the generated service domain
railway domain your-api.com      # attach a custom domain; returns DNS records
```

Changing the API URL **does** require a frontend rebuild, because Vite inlines
`VITE_API_BASE_URL` at build time (§5):

```bash
cd week4
netlify env:set VITE_API_BASE_URL "https://<new-api-url>"
netlify deploy --build --prod
```

### Custom domains

Dropping `.netlify.app` requires a registered domain. A custom domain is a new
origin, so `CORS_ORIGIN` must be updated to match it or the app fails with the
same misleading 500s.
