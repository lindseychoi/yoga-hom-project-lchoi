# CLAUDE.md — Project Context for AI Assistants

> This file provides essential context for AI coding assistants working on this project.
> Read `PLAN.md` for the full architectural spec, diagrams, and use cases.

---

## Project: YogiTrack

A MEAN-stack web application for **Yoga H'om Studio** (Pittsburgh, PA) that automates instructor & customer management, class scheduling, package sales, attendance tracking, and reporting.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular (standalone components), Angular Material, TypeScript |
| **Backend** | Express.js, TypeScript, Mongoose ODM |
| **Database** | MongoDB (Atlas free tier in production) |
| **Validation** | `class-validator` (decorator-based — NOT Zod) |
| **Auth** | JWT (`jsonwebtoken` + `bcryptjs`), role-based (Manager / Instructor) |
| **Deployment** | Single Heroku dyno (Express serves Angular dist as static files) |

## Project Structure

```
yoga-hom-project-lchoi/
├── frontend/                # Angular CLI app
│   └── src/
│       ├── app/
│       │   ├── pages/       # Smart/routed components (one per route)
│       │   ├── components/  # Presentational / shared components
│       │   ├── services/    # Angular HTTP services
│       │   ├── state/       # State management
│       │   └── models/      # Frontend-only interfaces
│       ├── styles/          # Global styles, Material theme
│       └── environments/
├── backend/                 # Express + Mongoose API
│   └── src/
│       ├── app/
│       │   ├── routes/      # Express route definitions
│       │   ├── controllers/ # Request handlers
│       │   ├── services/    # Business logic
│       │   └── models/      # Mongoose schemas/models
│       ├── middleware/       # Auth guards, error handler
│       └── environments/
├── PLAN.md                  # Full project spec (ERD, API, use cases, sequences)
├── CLAUDE.md                # This file
├── LICENSE                  # PolyForm Noncommercial 1.0.0
└── README.md
```

## Key Architectural Decisions

1. **Simple two-folder structure** — NO Nx monorepo. Plain `frontend/` and `backend/` folders.
2. **Ultra-Lean frontend** — App shell (sidebar + header) lives in `AppComponent`. All CRUD forms use Angular Material Dialogs, not separate routed pages.
3. **Angular Material** for all UI components — tables, forms, dialogs, nav. Custom monochrome theme (black/white/gray).
4. **No hardcoding** — all business data served dynamically from Express/MongoDB.
5. **ID generation** — server-side via a `Counter` collection: Instructors (`I00XXX`), Customers (`C00XXX`), Packages (`PKG00X`).
6. **API prefix** — all routes under `/api/v1/`.

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| **0 — Planning** | ✅ Done | `PLAN.md`, `README.md`, repo baseline |
| **1 — Scaffold** | 🔜 Next | `frontend/` (Angular CLI) + `backend/` (Express/TS/Mongoose) |
| **2 — Horizontal UI** | ⬜ | All Angular pages with mocked data, no DB |
| **3 — Auth Slice** | ⬜ | MongoDB connection, User model, JWT login |
| **4 — Instructors Slice** | ⬜ | Full-stack Instructor CRUD (assignment requirement) |
| **5 — Remaining Slices** | ⬜ | Customers, Classes, Packages, Sales, Attendance |
| **6 — Reports & Deploy** | ⬜ | Report aggregations, Heroku deployment |

## Conventions

- **TypeScript everywhere** — both frontend and backend.
- **Strict typing** — avoid `any`. Define interfaces/types for all data shapes.
- **Backend pattern**: Route → Controller → Service → Model.
- **Frontend pattern**: Page component → Angular Service (HTTP) → API.
- **Error handling**: Express global error handler middleware; Angular interceptors.
- **Environment variables**: `MONGODB_URI`, `PORT`, `JWT_SECRET` — never committed.

## Running Locally

```bash
# Backend
cd backend
npm install
npm run dev          # nodemon + ts-node

# Frontend
cd frontend
npm install
ng serve             # http://localhost:4200, proxied to backend
```

## Common Commands

```bash
# Generate Angular component
cd frontend && ng generate component pages/dashboard

# Generate Angular service
cd frontend && ng generate service services/instructor

# Run backend tests
cd backend && npm test

# Run frontend tests
cd frontend && ng test
```

## Data Models (Quick Reference)

Six core entities — see `PLAN.md` Section 3 for full ERD:

- **Instructor** — studio teachers (`I`-prefixed ID)
- **Customer** — studio clients (`C`-prefixed ID, has `classBalance`)
- **Class** — scheduled sessions (linked to instructor, has `dayOfWeek`/`time`)
- **Package** — purchasable bundles (1/4/10/unlimited classes)
- **Sale** — transaction linking customer ↔ package
- **AttendanceRecord / AttendanceEntry** — per-class check-ins, decrements `classBalance`

## Actors

| Role | Capabilities |
|------|-------------|
| **Manager** | Full CRUD on all entities, record sales, record attendance, all reports |
| **Instructor** | View own schedule, record attendance for own classes, self-performance report |
