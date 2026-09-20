# YogiTrack

A MEAN-stack web application for **Yoga H'om Studio** (Pittsburgh, PA). It replaces paper record-keeping with instructor and customer management, class scheduling, package sales, attendance tracking, and reports.

Users are studio **Managers** and **Instructors** only. Customers are records, not accounts.

See [`PLAN.md`](PLAN.md) for the full spec (data models, use cases, API, flows).

## Tech Stack

- **Frontend:** Angular (standalone components), Angular Material, TypeScript
- **Backend:** Express.js, TypeScript, Mongoose
- **Database:** MongoDB (Atlas free tier in production)
- **Auth:** JWT, role-based (Manager / Instructor)
- **Deployment:** single Heroku dyno; Express serves the built Angular app

## Structure

```
frontend/   Angular app
backend/    Express + Mongoose API (routes → controllers → services → models)
```

## Prerequisites

- Node.js and npm
- A MongoDB instance: local, or a MongoDB Atlas connection string

## Run Locally

### Backend

```bash
cd backend
npm install
cp .env.example .env    # then set MONGODB_URI, PORT, JWT_SECRET
npm run dev             # API on http://localhost:3000/api/v1
```

### Frontend

```bash
cd frontend
npm install
ng serve                # http://localhost:4200
```

## Environment Variables

Set in `backend/.env` (never committed):

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `PORT` | API port |
| `JWT_SECRET` | Token signing key |

## Tests

```bash
cd backend && npm test
cd frontend && ng test
```

## License

[PolyForm Noncommercial 1.0.0](LICENSE)
