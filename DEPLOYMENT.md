<!-- Render-specific deployment guide -->
# Deployment (Render Platform Only)

Single platform: Render hosts the backend (Node), the frontend (static), and a managed PostgreSQL instance. We use `render.yaml` for reproducible setup.

---
## 1. Prerequisites
Have: GitHub repo pushed (main branch), Render account, Node 18+ locally for sanity tests.

Local quick test (optional):
```bash
cd backend
npm install
npm run dev
curl http://localhost:5000/health
```
Expect `{ "status": "ok" }`.

---
## 2. Commit infra file
Ensure `render.yaml` exists at repo root (already added). If you edited it:
```bash
git add render.yaml
git commit -m "chore: render infra"
git push origin main
```

---
## 3. Create Render PostgreSQL
1. In Render dashboard → New → PostgreSQL.
2. Name it (e.g. `hospital-db`) → Free plan.
3. After creation copy the `External Connection String` (that is your `DATABASE_URL`).
4. (Optional) Set `Force SSL` → then add `DB_SSL=true` env var if required.

---
## 4. Launch services via render.yaml
1. Render → New → Blueprint → point to your repo.
2. It parses `render.yaml` and lists two services:
  - `hospital-backend` (web)
  - `hospital-frontend` (static)
3. Before first deploy, set environment variables (see below). For secrets mark them as such.
4. Click Apply.

### 4.1 Backend environment variables
Set on `hospital-backend`:
```
NODE_ENV=production
PORT=5000
JWT_SECRET=<long-random>
DATABASE_URL=<paste-from-render-postgres>
FRONTEND_URL=https://<placeholder>
```
(You can leave placeholder; will tighten after frontend deploy.)

### 4.2 Frontend environment variables
On `hospital-frontend` static site:
```
VITE_API_URL=https://<backend-host>.onrender.com
```
The backend host appears after first backend deploy (format `<service-name>.onrender.com`). Update and redeploy frontend if needed.

---
## 5. Deployment order
1. First deploy triggers build for backend & frontend.
2. Backend logs should show:
```
✅ Database connection established
🚀 Server running on port 5000
```
3. Visit backend health:
```
curl https://<backend>.onrender.com/health
```
4. After backend URL is known, ensure frontend `VITE_API_URL` matches; if you deployed before setting it, add it and redeploy the static site (Render → Clear build cache & deploy if necessary).

---
## 6. Seed data (optional)
Render Web Service → Shell →
```bash
npm run seed
```
Check logs for confirmation (users/records created).

---
## 7. Lock CORS
Update backend env `FRONTEND_URL` to the exact static site origin (e.g. `https://hospital-frontend.onrender.com`). Redeploy backend (Render redeploy button).

---
## 8. Functional verification
Front to back:
1. Open frontend URL → register / login.
2. Create an event → refresh persists.
3. Open a second browser window; drag/resize event → immediate update (WebSocket).
4. Export CSV / ICS.
5. (Optional) Trigger overbooking suggestions and accept/decline.

---
## 9. Environment variable recap
Backend:
```
NODE_ENV=production
PORT=5000
JWT_SECRET=...
DATABASE_URL=postgres://...
FRONTEND_URL=https://hospital-frontend.onrender.com
```
Frontend:
```
VITE_API_URL=https://hospital-backend.onrender.com
```

Optional:
```
DB_SSL=true   # only if your DB enforces SSL and you want to ensure dialectOptions.ssl
```

---
## 10. Custom domains
Add on each service → provide domain → add DNS (CNAME or A per Render instructions) → wait for certificate → update `FRONTEND_URL` and `VITE_API_URL` accordingly → redeploy frontend then backend.

---
## 11. Rollback
Render → Service → Deploys → select a previous successful deploy → Rollback.
Or revert git commit and push; blueprint redeploys automatically.

---
## 12. Troubleshooting
| Problem | Cause | Fix |
|---------|-------|-----|
| 404 API in browser | Wrong `VITE_API_URL` | Update env, redeploy frontend |
| CORS error | `FRONTEND_URL` mismatch | Set exact origin + redeploy backend |
| DB connect fail | Bad `DATABASE_URL` or DB sleeping | Re-copy connection string / wait for cold start |
| WebSocket failing | Mixed URL or CORS | Confirm both URLs are https & origin matches |
| Seed fails | Tables not synced yet | Wait for initial sync logs then rerun seed |

Logs: Render → each service → Logs (filter for errors).

---
## 13. Security quick wins
1. Keep `JWT_SECRET` long & private.
2. Restrict origin (done via `FRONTEND_URL`).
3. Consider adding rate limiting middleware later.
4. Regular dependency updates.

---
## 14. Final checklist
```
[ ] Backend health OK
[ ] DATABASE_URL valid
[ ] Tables auto-created
[ ] Seed run (optional)
[ ] Frontend loads & talks to API
[ ] Auth + 2FA flows work
[ ] Real-time updates functioning
[ ] Exports (CSV/ICS) download
[ ] CORS locked to frontend
[ ] (Optional) Custom domains working
```

Deployment on Render complete.
