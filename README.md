# Society Maintenance Tracker

Full-stack app for apartment societies to track maintenance complaints, priorities, overdue issues, a notice board, and email updates.

**Stack:** React (Vite) + Node/Express + Prisma + SQLite (dev) / PostgreSQL (prod)

This project is configured to run **locally with zero external accounts** — SQLite for the DB, local disk storage for photos, and console-logged emails. Swap in Postgres / Cloudinary / SMTP any time for production (see below).

---

## 1. Prerequisites

- Node.js 18+ and npm
- That's it for local dev (no Postgres/Docker/Cloudinary account needed)

---

## 2. Setup & Run (local)

### Backend

```bash
cd backend
npm install
cp .env.example .env        # already pre-filled with working local defaults
npx prisma generate
npx prisma migrate dev --name init
npm run seed                 # creates admin + sample resident + categories
npm run dev                  # starts API on http://localhost:5000
```

### Frontend (in a second terminal)

```bash
cd frontend
npm install
cp .env.example .env         # points to http://localhost:5000/api
npm run dev                  # starts app on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

### Demo logins (created by `npm run seed`)

| Role     | Email                | Password      |
|----------|-----------------------|---------------|
| Admin    | admin@society.com     | Admin@123     |
| Resident | resident@society.com  | Resident@123  |

You can also register new residents from the Register page.

---

## 3. How each requirement is implemented

| Requirement | Where |
|---|---|
| Resident register/login, raise complaint w/ category+description+photo | `authController.js`, `complaintController.createComplaint`, `RaiseComplaint.jsx` |
| Resident views own complaints + full history | `complaintController.myComplaints`, `MyComplaints.jsx` + `StatusTimeline.jsx` |
| Admin filters by category/status/date, sets priority | `complaintController.allComplaints`, `AllComplaints.jsx` |
| Status updates recorded with timestamp + actor + note | `complaintHistory` table, `historyService.js` |
| Resolved = closed (no further edits) | Enforced in `updateStatus` (409 if already Resolved) |
| Overdue flagging (configurable threshold), surfaced at top | `overdueService.js`, sorting logic in `allComplaints` |
| Notice board with pinned important notices | `noticeController.js`, `ManageNotices.jsx`, `NoticeBoard.jsx` |
| Email on status change + important notice | `emailService.js` (console mode by default, SMTP-ready) |
| Admin dashboard: totals by status/category/overdue | `dashboardController.summary`, `Dashboard.jsx` (recharts) |

---

## 4. Database Schema

See `backend/prisma/schema.prisma` for the full Prisma schema. Summary:

- **User** — id, name, email, passwordHash, role (resident/admin), flatNumber
- **Category** — id, name (Plumbing, Electrical, Cleaning, Security, etc.)
- **Complaint** — id, residentId, categoryId, description, photoUrl, status, priority, createdAt, resolvedAt
- **ComplaintHistory** — id, complaintId, actorId, oldStatus, newStatus, note, changedAt *(append-only audit log — this is the core of the "history" feature)*
- **Notice** — id, title, content, isImportant, postedById, createdAt
- **Setting** — key/value store, used for the configurable overdue threshold

**Why a separate history table instead of just a `status` column?** Because the requirement explicitly asks for a *recorded history of every change* (timestamp, actor, note) — a single `status` field can't answer "who changed this and when." The `Complaint.status` column is just a cached "current state" for fast filtering; `ComplaintHistory` is the source of truth for the timeline.

---

## 5. API Documentation

Base URL: `http://localhost:5000/api`. All routes except register/login require `Authorization: Bearer <token>`.

### Auth
| Method | Route | Access | Body |
|---|---|---|---|
| POST | `/auth/register` | public | `{ name, email, password, flatNumber }` |
| POST | `/auth/login` | public | `{ email, password }` |
| GET | `/auth/me` | authenticated | - |

### Complaints
| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/complaints/categories` | authenticated | list categories |
| POST | `/complaints` | resident | multipart form: `categoryId, description, photo?` |
| GET | `/complaints/mine` | resident | own complaints + history |
| GET | `/complaints` | admin | query: `?category=&status=&from=&to=` |
| GET | `/complaints/:id/history` | resident (own) / admin | full timeline |
| PATCH | `/complaints/:id/status` | admin | `{ status, note? }` — Open → InProgress → Resolved |
| PATCH | `/complaints/:id/priority` | admin | `{ priority }` — Low/Medium/High |

### Notices
| Method | Route | Access |
|---|---|---|
| GET | `/notices` | authenticated |
| POST | `/notices` | admin — `{ title, content, isImportant }` |

### Dashboard
| Method | Route | Access |
|---|---|---|
| GET | `/dashboard/summary` | admin — totals by status/category + overdue count |

### Settings
| Method | Route | Access |
|---|---|---|
| GET | `/settings/overdue-threshold` | admin |
| PATCH | `/settings/overdue-threshold` | admin — `{ days }` |

---

## 6. Switching to production services

**Postgres:** in `backend/prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`, set `DATABASE_URL` in `.env` to your Postgres connection string, then re-run `npx prisma migrate dev`.

**Cloudinary (photo uploads):** set `UPLOAD_STRATEGY=cloudinary` and fill `CLOUDINARY_*` vars in `.env`. (Currently photos save to `backend/uploads/` and are served at `/uploads/<filename>` — works out of the box, no account needed.)

**Real email (SMTP):** set `EMAIL_STRATEGY=smtp` and fill `SMTP_*` vars (Gmail SMTP with an App Password works on the free tier). By default `EMAIL_STRATEGY=console` just logs the email to the backend terminal so you can verify the notification flow without any account.

---

## 7. Deployment

- **Frontend → Vercel:** import the `frontend/` folder, set env var `VITE_API_URL=https://your-backend-url/api`.
- **Backend → Render/Railway:** import `backend/`, set start command `npm start`, add a Postgres addon, set all `.env` vars (see `.env.example`) in the dashboard, then run `npx prisma migrate deploy && npm run seed` once via the shell.

---

## 8. Project Structure

```
society-maintenance-tracker/
├── backend/          # Express API + Prisma + SQLite
├── frontend/         # React (Vite) SPA
├── README.md
└── SYSTEM_DESIGN.md  # 800-word design write-up
```
