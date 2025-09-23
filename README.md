<div align="center">

# Hospital Scheduling Management

Modern scheduling & resource coordination for clinics and hospitals.

_Efficient bookings • Conflict prevention • Smart overbooking • Realtime updates • Offline‑capable PWA_

</div>

---

## Overview
This project implements a full scheduling workflow used in small/medium healthcare settings: creating and adjusting appointments, preventing time conflicts, safely handling controlled overbooking (with waitlist + suggestions), and monitoring activity. It exposes a clean API, uses realtime websockets for live calendar changes, and supports offline operation through a Progressive Web App layer.

The frontend is a Vite + React + TypeScript application styled with Tailwind and shadcn UI components; the backend is an Express / PostgreSQL service deployed as a container on Fly.io with Neon as the managed Postgres provider. Socket.IO powers realtime collaboration.

---

## Key Features
**Scheduling UX**
- Drag, resize, quick-create, and inline edit interactions
- Details dialog with participant & department metadata
- One‑click backfill of gaps

**Conflict & Capacity Guardrails**
- Per‑doctor overlap blocking (±1 hour window)
- Deterministic validation on server (cannot bypass via client)

**Overbooking & Waitlist**
- Suggestion overlay (soft events) – Accept or Decline
- Waitlist join & invite flow; invite generates confirmation window

**Filtering & Navigation**
- Department & doctor filters persisted in URL (shareable views)
- Lightweight pagination & range fetch for large calendars

**Exports & Data Access**
- CSV & ICS generation with row safeguard
- Activity log export for audit / analytics

**Authentication & Security**
- Registration, login, JWT session handling
- Optional Two‑Factor (TOTP) enrollment & verification flow
- Avatar upload & profile management
- Basic monitoring thread surfaces suspicious rapid activity

**Realtime & Offline**
- Socket.IO push for newly created / updated / removed schedules
- PWA: precache shell + runtime caching; usable when offline

**Admin & Insight**
- Monitored user list + recent action log
- Simple CSV extraction for reporting

---

## Architecture at a Glance
| Layer | Tech | Notes |
|-------|------|-------|
| UI | React 18, TypeScript, Tailwind, shadcn UI, FullCalendar | Interactive calendar + modular UI primitives |
| State / Data | React Query, Context, WebSockets | Cache + live sync |
| Backend | Node.js (Express), Socket.IO | REST + realtime events |
| Persistence | PostgreSQL (Neon) via Sequelize | Connection via `DATABASE_URL` |
| Auth | JWT + optional TOTP (speakeasy) | Token cookies / headers supported |
| Email | Nodemailer (pluggable SMTP) | For 2FA or notifications (optional) |
| Deployment | Fly.io (API), Vercel (frontend), Neon (DB) | Separation of concerns |

---

## Project Structure
```
backend/
  controllers/   # Route handlers
  models/        # Sequelize models & associations
  routes/        # Express route modules
  middleware/    # auth, security hooks
  utils/         # monitoring, helpers
  config/        # database config
frontend/
  src/
    components/  # UI primitives & composite widgets
    pages/       # Route-level views (auth, calendar, admin, profile)
    context/     # Auth, schedule, offline contexts
    services/    # API abstraction
    hooks/       # Reusable logic
    lib/         # Utility helpers
  public/        # Manifest, service worker assets
```

---

## Quick Start (Local)
Requirements: Node 18+, a running PostgreSQL instance (or a Neon dev DB), and Git.

### 1. Backend
```powershell
cd backend
npm install
copy ..\.env.example .env   # or manually create; adjust DB values
# (Optional) seed: npm run seed   # WARNING: force sync & large insert – dev only
$env:FRONTEND_URL="http://localhost:5173"; npm run dev
```
Service: http://localhost:5000

### 2. Frontend
```powershell
cd ../frontend
npm install
$env:VITE_API_URL="http://localhost:5000"; npm run dev
```
App: http://localhost:5173

### Demo Credentials (after dev seed)
```
Admin: admin@example.com / password
User : user@example.com  / password
```

---

## Environment Variables
Backend (`.env` or Fly secrets)
```
PORT=5000
JWT_SECRET=replace-with-long-random-string
# Either DATABASE_URL OR discrete values below
DATABASE_URL=postgres://user:pass@host:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_schedule
DB_USER=postgres
DB_PASSWORD=postgres_password
FRONTEND_URL=http://localhost:5173
MAX_EXPORT_ROWS=5000
# Optional email (2FA / notifications)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM="Scheduler <no-reply@example.com>"
# Admin bootstrap & invite (first user auto-admin; subsequent admin creation requires this code if set)
ADMIN_INVITE_CODE=optional-secret-code
```

Frontend (`frontend/.env` or Vercel project settings)
```
VITE_API_URL=http://localhost:5000
# VITE_SOCKET_URL=http://localhost:5000  # optional override
```

---

## Core Flows
| Flow | Summary |
|------|---------|
| Create Booking | Click empty slot or quick-create → modal → save → broadcast via socket |
| Edit / Resize | Drag edges or open details modal → update persists & emits update |
| Conflict Check | Server rejects overlapping doctor/time window – UI shows toast |
| Overbooking Suggestion | Soft placeholder events; user Accept converts to real schedule |
| Waitlist Invite | Admin/authorized user invites; patient confirms within time window |
| Export | Button triggers CSV/ICS generation respecting `MAX_EXPORT_ROWS` |
| 2FA | User enrolls → QR & secret → verifies TOTP code → flag stored |
| Admin Creation | First registered account becomes ADMIN automatically. Later admins require valid `ADMIN_INVITE_CODE`. |
| Offline | PWA caches shell; schedule view works read-only until back online |

---

## API Surface (Selected Endpoints)
```
POST   /auth/register
POST   /auth/login
POST   /auth/2fa/setup
POST   /auth/2fa/verify
GET    /schedules?from=ISO&to=ISO
POST   /schedules
PATCH  /schedules/:id
DELETE /schedules/:id
GET    /schedules/export.csv
GET    /schedules/export.ics
GET    /admin/logs.csv
```

Socket Events (conceptual):
```
schedule:created
schedule:updated
schedule:deleted
monitoredUser:new
```

---

## Deployment Summary
| Component | Platform | Notes |
|-----------|----------|-------|
| Backend API | Fly.io | Docker image w/ Node 18; secrets for DB & JWT |
| Database | Neon | Serverless Postgres (SSL required) |
| Frontend | Vercel | Vite static export → CDN cache |

See `DEPLOYMENT.md` for the exact step‑by‑step commands.

---

## Performance Notes
- Batch inserts for seed script to avoid memory pressure.
- Basic indexing on doctor, department, date for schedule searches.
- Socket layer keeps calendar responsive without polling.

---

## Troubleshooting Quick Reference
| Symptom | Likely Cause | Resolution |
|---------|--------------|-----------|
| 404 API / Network error | Wrong `VITE_API_URL` | Correct env & rebuild frontend |
| CORS error | `FRONTEND_URL` mismatch | Update secret & restart backend |
| Sockets not connecting | Mixed http/https | Use https for both origins |
| Large export slow | Too many rows | Adjust filters or raise `MAX_EXPORT_ROWS` |
| 2FA fail | Desync clock | Re-sync device time or re-enroll |

---

## At a Glance
| Metric | Value |
|--------|-------|
| Primary Language | TypeScript / JavaScript |
| Realtime | Socket.IO |
| Auth | JWT + optional TOTP |
| Offline | PWA (service worker + precache) |
| DB | PostgreSQL (Neon) |
| Deployment | Fly.io + Vercel |

---

Thanks for reading. Explore the code, run it locally, and feel free to build on the ideas here.

