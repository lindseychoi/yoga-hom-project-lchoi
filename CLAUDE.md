# CLAUDE.md — Project Context for AI Assistants

> This file provides essential context for AI coding assistants working on this project.
> Read `PLAN.md` for the full architectural spec, diagrams, and use cases.

---

## Ground Rules (mandatory)

- **Ask before changing anything.** Do not create, edit, delete, or run anything that modifies files or the environment without asking first.
- **Do not change the architecture** the owner has specified (this file and `PLAN.md`) without asking first.
- **Do not add, remove, or upgrade packages** without asking first.
- **Do only what the owner tells you to.** No extra work, refactors, cleanups, or "improvements" beyond the request. If something else seems needed, ask.
- **Be concise.** Short replies, no preamble or recap. Write the least code that is clear: no speculative abstractions, dead code, or comments that restate the code.
- **No hardcoding.** No secrets, URLs, fallback credentials, magic numbers, or business data in source. Use env vars, constants, or the API.
- **Best practices only, otherwise ask.** If something is not standard good practice, ask permission first and explain why.

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
3. **Angular Material** for all UI components — tables, forms, dialogs, nav. Custom theme: photo-led landing page and a five-color palette defined as SCSS variables in `frontend/src/styles/_variables.scss`.
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

Only Managers and Instructors log in. Customers are records the Manager maintains, never user accounts.

## Needs (from PLAN.md)

- Replace paper record-keeping for classes, attendance, and sales.
- Manage instructors (UC1), classes (UC2), packages (UC3), customers (UC4).
- Record sales (UC5) and class attendance (UC6).
- Four reports (UC7): package sales; instructor list + check-ins; customer list + packages (active / future / expired); teacher payment (monthly, `payRate × classes with check-ins`).
- Instructors can view their own schedule (UC8) and their own performance report (UC9).
- Notify instructors and customers via their preferred contact (phone / email) on creation, and send customers a check-in confirmation.
- JWT auth with Manager / Instructor roles.
- All business data served dynamically from Express/MongoDB.
- Deploy as a single Heroku dyno; Mermaid diagrams for architecture, ERD, and flows.

## Business Rules (from PLAN.md)

- **IDs**: generated server-side via the `Counter` collection. Instructor `I00001`, Customer `C00001`, Package `PKG001`.
- **UC1 Add Instructor** (Manager): required fields validated; warn on duplicate name but allow override; server generates `instructorId`; notify via preferred contact.
- **UC2 Add Class** (Manager): needs at least one instructor; only one class per time slot; on conflict return alternative available slots; class is saved as published; confirm to manager and instructor. Fields: instructor, dayOfWeek, time, classType (General/Special), className, payRate.
- **UC3 Add Package** (Manager): packageName, packageCategory (General/Senior), numberOfClasses (1 / 4 / 10 / unlimited = -1), classType (General/Special), price; server generates `packageId`.
- **UC4 Add Customer** (Manager): same rules as UC1 with `C` prefix; `classBalance` starts at 0; notify via preferred contact.
- **UC5 Record Sale** (Manager): pick customer and package; package type and price auto-populate; `amountPaid` must match the package rate; dates must be valid; customer `classBalance` increases by the package's `numberOfClasses`; show the new balance.
- **UC6 Record Attendance** (Instructor or Manager):
  - Instructor picks from their own assigned classes.
  - Date/time default to now and are editable; warn if they do not match the class schedule.
  - Select attending customers; validate each `classBalance`.
  - If a balance is insufficient, warn and allow saving with a negative balance (flagged `negativeBalance`).
  - Decrement each attendee's `classBalance`.
  - Send each customer: `"Hello {firstName}! You are checked-in for a class on {date} at {time}. Your class-balance is {balance}."`
- **UC7 Reports** (Manager): the four reports above. Instructors see only their own performance (UC9).
- **Access**: Manager has full CRUD on all entities, records sales and attendance, and sees all reports. Instructor sees own schedule, records attendance for own classes, and sees own performance report.
