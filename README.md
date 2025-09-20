## Hospital Scheduling Management

A practical scheduling system for clinics and hospitals. It handles day‑to‑day bookings, avoids conflicts, suggests safe overbooking, works offline, and ships with a simple admin view.

— Updated: September 2025

**What this shows recruiters**
- Real-world calendar UX (drag, resize, details, filters, exports)
- Clear API boundaries and auth flows (JWT + 2FA)
- Live updates with sockets and offline PWA support
- Thoughtful error handling and useful defaults

## Features
- Calendar: drag/resize, quick-create, details dialog, backfill empty slots
- Conflict prevention: blocks overlapping bookings per doctor (±1 hour)
- Overbooking tools: suggestions, Accept/Decline, waitlist invite/confirm
- Filters: department and doctor with URL sync (shareable links)
- Exports: CSV and ICS with safe row caps
- Auth: login/register, 2FA, profile avatar, session management
- PWA: precaching, runtime caching, and offline fallbacks
- Admin: monitored users, activity logs CSV

## Stack
- Frontend: React + TypeScript, Vite, Tailwind + shadcn UI, FullCalendar, Socket.IO client
- Backend: Node.js (Express), PostgreSQL via Sequelize, JWT, Nodemailer, Socket.IO

## Quick Start (Windows PowerShell)
Prereqs: Node 18+, PostgreSQL running locally with a database you can use.

1) Backend
```powershell
cd backend
npm install
# Create .env (see below), then seed demo data
npm run seed
$env:FRONTEND_URL="http://localhost:5173"; npm run dev
```
Server: `http://localhost:5000`

2) Frontend
```powershell
cd ..\frontend
npm install
$env:VITE_API_URL="http://localhost:5000"; npm run dev
```
App: `http://localhost:5173`

Demo logins (after seeding)
- Admin: `admin@example.com` / `password`
- User: `user@example.com` / `password`

## Environment
Backend `.env` (example)
```
PORT=5000
JWT_SECRET=replace-with-long-random-string
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_schedule
DB_USER=postgres
DB_PASSWORD=postgres_password
MAX_EXPORT_ROWS=5000
FRONTEND_URL=http://localhost:5173
# Optional SMTP for real emails
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM="Scheduler <no-reply@example.com>"
```

Frontend `.env`
```
VITE_API_URL=http://localhost:5000
```

## How to Use
- Create: select a slot or use quick-create; 1‑hour default
- Edit: click an event → Edit, Save; or drag/resize on the grid
- Delete: click → Delete (with confirm)
- Backfill: open “Backfill now” to invite the top waitlist match
- Suggestions: faint events → Accept/Decline
- Filters: set department/doctor → Apply (URL updates)
- Export: download CSV/ICS from the calendar actions

## Scheduling Rules
- One appointment per doctor per hour (±1h conflict guard)
- Cancelling can auto‑invite waitlist if Overbooking is enabled

## API Overview (selected)
- Auth: register, login, 2FA setup/verify, password reset, email change verify
- Schedules: CRUD, CSV/ICS export, range‑based fetch
- Overbooking: suggestions, accept/decline, waitlist join, invite, public confirm
- Admin: logs CSV, monitored users

## Repo Layout
```
backend/
  controllers/, models/, routes/, utils/
frontend/
  public/ (sw.js, offline.html, icons, manifest)
  src/ (pages, components, context, services)
```

## Troubleshooting
- Invite failed: often “No candidates” for that slot/filters
- Filters not sticking: click Apply; URL should show `?department=..&doctor=..`
- PWA cache: close tabs, hard refresh, or uninstall the SW in DevTools
- DB connect issues: check `.env` and that Postgres is running

## Deployment
See `DEPLOYMENT.md` for Fly.io (backend) + Neon Postgres + Vercel (frontend) steps. Backend needs `JWT_SECRET`, `DATABASE_URL` (or discrete DB_* vars), `FRONTEND_URL`. Frontend needs `VITE_API_URL` pointing to the Fly domain.

## Notes
- This project is for learning and showcasing full‑stack skills.
- No license specified.

