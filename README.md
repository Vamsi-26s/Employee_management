# Employee Attendance Management System (MERN)

Full-stack Employee Attendance Management System built with MongoDB, Express.js, React, and Node.js. Includes JWT auth, role-based access (Employee/Manager), attendance tracking, dashboards, CSV export, and charts.

## Tech Stack
- Frontend: React (Vite), React Router, Redux Toolkit, TailwindCSS, Recharts
- Backend: Node.js, Express.js
- Database: MongoDB Atlas
- Auth: JWT + bcrypt

## Folder Structure
```
attendance/
  backend/        # Express API
  frontend/       # React app (Vite)
  README.md
```

## Environment Variables
Create `backend/.env` using `backend/.env.example`:

```
PORT=5000
JWT_SECRET=supersecretjwt
# Replace with your MongoDB URI or rely on in-memory dev fallback
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
```

Create `frontend/.env` using `frontend/.env.example`:

```
VITE_API_URL=http://localhost:5000
```

## Setup Steps

1) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

2) Seed sample data (1 manager + 5 employees + random attendance)

```bash
cd backend
npm run seed
```

3) Run servers

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

Open the frontend at `http://localhost:5173`.

## Required Pages Mapping

- Employee: `/login`, `/register`, `/dashboard`, `/mark-attendance`, `/attendance-history`, `/profile`
- Manager: `/login` (same page), `/dashboard` (auto-routes to manager view if role = manager), `/employees`, `/team-calendar`, `/reports`

## API Overview

Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- PUT `/api/auth/me` (update profile: name, department, employeeId, profileImage)

Employee Attendance
- POST `/api/attendance/checkin`
- POST `/api/attendance/checkout`
- GET `/api/attendance/my-history`
- GET `/api/attendance/my-summary`
- GET `/api/attendance/today`

Manager
- GET `/api/attendance/all`
- GET `/api/attendance/employee/:id`
- GET `/api/attendance/summary`
- GET `/api/attendance/today-status`
- GET `/api/attendance/export` (CSV)
- POST `/api/attendance/mark-absent` (bulk mark absent)
- PUT `/api/attendance/:id` (edit a record: status, checkInTime, checkOutTime)
- GET `/api/users` (list employees for bulk actions)

Dashboard
- GET `/api/dashboard/employee`
- GET `/api/dashboard/manager`

## Sample Credentials (Dev Bootstrap)

On first run (non-production), the backend seeds:
- Manager: `manager@example.com` / `manager123`
- Employee: `employee@example.com` / `employee123`

## Notes & Features
- Check-in allowed once per day; checkout computes total hours.
- Late defined as check-in after 09:15.
- Employee and Manager see role-specific pages via protected routing.
- Device tracking for check-ins (`mobile`, `web`, `qr`).
- Manager bulk mark absent and inline edit attendance in Employees page.
- Lightweight toast notifications and offline queue for attendance actions.