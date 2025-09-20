<!-- Multi-platform free deployment guide (Render removed) -->
# Deployment (Backend: Fly.io + Postgres | Frontend: Vercel)

Simple, reliable, free (within limits):
- Backend API & websockets: Fly.io (Docker container)
- PostgreSQL: Neon (serverless) free tier
- Frontend (static React build): Vercel

---
## 1. Prerequisites
Install: `flyctl`, `node 18+`, `git`. Create accounts: Fly.io, Neon, Vercel.

Local quick test (optional):
```bash
cd backend
npm install
npm run dev
curl http://localhost:5000/health
```

---
## 2. Create Postgres (Neon)
Create a Neon project → copy the connection string (standard format `postgres://user:pass@host:port/db?sslmode=require`). Keep `DATABASE_URL` ready.

---
## 3. Fly.io Backend Deploy
Create the app (interactive) OR edit existing `backend/fly.toml`:
```bash
cd backend
fly launch --name hospital-backend-<yourid> --no-deploy --copy-config
```
If you already added `fly.toml` you can skip generating a new one. Adjust `app` and `primary_region` fields.

Set secrets (only DATABASE_URL OR DB_* set):
```bash
fly secrets set \
  NODE_ENV=production \
  PORT=5000 \
  JWT_SECRET=<long-random> \
  DATABASE_URL="postgres://user:pass@host:5432/db" \
  FRONTEND_URL=https://<your-frontend>.vercel.app \
  EMAIL_USER=<optional-smtp-user> \
  EMAIL_PASS=<optional-smtp-pass>
```

Deploy:
```bash
fly deploy --build-only # (optional warm build)
fly deploy
```
Logs & health:
```bash
fly logs
curl https://hospital-backend-<yourid>.fly.dev/health
```

### 3.1 Database Migrations / Sync & Seed
Sequelize `sync({ alter: true })` runs automatically. To seed sample data:
```bash
fly ssh console -C "node seedDatabase.js"
```

---
## 4. Frontend (Vercel)
1. Import GitHub repo in Vercel → set root = `frontend`.
2. Build command: `npm run build`  | Output dir: `dist` | Framework: Vite.
3. Env var:
```
VITE_API_URL=https://hospital-backend-<yourid>.fly.dev
```
4. Deploy → note final Vercel URL.
5. (Optional) Custom domain → add in Vercel; then update Fly secret `FRONTEND_URL` to new domain:
```bash
fly secrets set FRONTEND_URL=https://mydomain.com
fly deploy --strategy immediate
```

---
## 5. Environment Variables Recap
Backend (Fly secrets):
```
NODE_ENV=production
PORT=5000
JWT_SECRET=********
DATABASE_URL=postgres://...
FRONTEND_URL=https://your-frontend.vercel.app
```
Frontend (Vercel):
```
VITE_API_URL=https://hospital-backend-<yourid>.fly.dev
```

---
## 6. Functional Verification
1. Visit frontend → register/login.
2. Create & drag an event; open second browser window to verify realtime (Socket.IO via Fly).
3. Export CSV/ICS.
4. Overbooking suggestion flow (if triggered) works.
5. 2FA enable / verify cycle works.

---
## 7. Rolling Updates / Redeploy
Code change:
```bash
git commit -am "feat: something" && git push
cd backend && fly deploy
```
Frontend changes auto-deploy via Vercel on push (unless you disabled it). If backend URL changes (rare), update `VITE_API_URL` and redeploy front.

---
## 8. Rollback
Fly: `fly releases` → note version → `fly deploy --image <previous-image>` or `fly restore <version>` if enabled.
Vercel: Go to Deployments tab → Promote previous deployment.

---
## 9. Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| 502 on Fly | App boot slow / crash | `fly logs`; check DB URL & env vars |
| CORS error | FRONTEND_URL mismatch | Reset secret & redeploy |
| WebSocket not connecting | Mixed http/https or origin mismatch | Use https everywhere, correct FRONTEND_URL |
| DB auth fail | Wrong password / host | Recopy Neon credentials |
| Seed fails | DB not reachable yet | Wait, retry seed command |

---
## 10. Security Quick Wins
1. Keep JWT_SECRET long; rotate only with downtime.
2. Add rate limiting (e.g. express-rate-limit) later.
3. Use Fly private volumes only if you add persistence outside Postgres (not needed now).

---
## 11. Final Checklist
```
[ ] Fly deploy green
[ ] /health returns ok
[ ] Tables created
[ ] Seed (optional) executed
[ ] Frontend served on Vercel
[ ] Realtime calendar updates
[ ] Exports working
[ ] CORS locked (correct FRONTEND_URL)
[ ] Custom domains (optional) mapped
```

## 12. Quick Command Reference (PowerShell friendly)
```powershell
cd backend
fly auth login
fly launch --name hospital-backend-<yourid> --no-deploy --copy-config
fly secrets set NODE_ENV=production PORT=5000 JWT_SECRET=<rand> DATABASE_URL="postgres://..." FRONTEND_URL=https://<vercel-url>
fly deploy
curl https://hospital-backend-<yourid>.fly.dev/health
fly ssh console -C "node seedDatabase.js"
```

Deployment complete (Fly.io + Vercel).
