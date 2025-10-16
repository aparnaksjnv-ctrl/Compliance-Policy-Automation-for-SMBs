# Week 1 Scratchpad

- **Scope**
  - React frontend: `week1/`
  - API: `week1-api/`

- **Local run (two terminals)**
  - API (`week1-api/`)
    ```bash
    cd "/Users/sreenivasb/Desktop/Windsurf project/week1-api"
    cat > .env << 'EOF'
    PORT=4000
    USE_INMEMORY_DB=true
    JWT_SECRET=dev-secret
    CORS_ORIGIN=http://localhost:5173
    # Optional:
    # MONGO_URI=mongodb://...
    EOF
    npm ci
    npm run dev
    # Health: curl -i http://127.0.0.1:4000/health
    ```
  - Frontend (`week1/`)
    ```bash
    cd "/Users/sreenivasb/Desktop/Windsurf project/week1"
    echo 'VITE_API_BASE_URL=http://localhost:4000' > .env.local
    npm ci
    npm run dev # default 5173
    # Open http://localhost:5173
    ```

- **Key files**
  - Frontend scripts: `week1/package.json` (`dev`, `build`, `preview`)
  - API config: `week1-api/src/config.ts` (ports, CORS, in-memory DB)
  - API server: `week1-api/src/server.ts` (listens on `0.0.0.0`)

- **Endpoints (week1-api)**
  - `GET /health` – liveness
  - `POST /auth/register` – returns `{ token }`
  - `POST /auth/login` – returns `{ token }`
  - `GET /company` / `POST /company` – company profile (per existing routes)

- **Env vars (`week1-api/.env`)**
  - `PORT=4000`
  - `USE_INMEMORY_DB=true` (set to `false` with `MONGO_URI` to use Mongo)
  - `JWT_SECRET=dev-secret`
  - `CORS_ORIGIN=http://localhost:5173`
  - `MONGO_URI` (optional)

- **Verification**
  - API: `curl -i http://127.0.0.1:4000/health`
  - Frontend opens on `http://localhost:5173` and communicates with API on `4000`.
