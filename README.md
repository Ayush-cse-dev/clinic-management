# Vela &mdash; Clinic Management System

A complete, full-stack clinic appointment and patient management system.

- **Backend:** FastAPI + SQLAlchemy, SQLite by default (zero setup), JWT auth
  with four roles (admin, receptionist, doctor, patient).
- **Frontend:** React 19 + Vite, a custom-built "Pine & Coral" design system
  (no generic UI kit), role-aware navigation and pages for every module.

## Features

- Patients, doctors, appointments, prescriptions, medical records, billing,
  document uploads, and notifications &mdash; each with a full REST API and
  matching UI.
- Role-based access control: admins and receptionists manage the clinic,
  doctors manage their own appointments/prescriptions/records, and patients
  can book appointments and view their own data.
- Doctor and patient records can optionally get their own portal login,
  properly linked via a `user_id` foreign key (so a doctor's or patient's
  dashboard always shows *their* data, not someone else's).
- File upload/download for patient documents, with type and size validation.

## Project structure

```
clinic-management/
├── backend/
│   ├── app/
│   │   ├── core/          # settings, database, security (JWT/bcrypt)
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── crud/          # database operations
│   │   ├── routers/       # API endpoints
│   │   ├── dependencies/  # auth & role-based access dependencies
│   │   └── main.py        # app entry point
│   ├── tests/              # pytest test suite
│   ├── seed.py             # creates a first admin account
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/            # axios client
    │   ├── components/     # shared UI components
    │   ├── context/        # auth & toast providers
    │   ├── hooks/           # useAuth, useToast
    │   ├── pages/           # one file per screen
    │   └── styles/          # design tokens + component CSS
    └── .env.example
```

## Getting started

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# optional: copy .env.example to .env if you want to change any defaults
cp .env.example .env

# creates admin@clinic.com / Admin@123 as your first login
python seed.py

uvicorn app.main:app --reload --port 8000
```

The API is now running at `http://127.0.0.1:8000`, with interactive docs at
`http://127.0.0.1:8000/docs`. It uses a local SQLite file (`clinic.db`) by
default &mdash; no database server required. To use Postgres instead, set
`DATABASE_URL` in `.env` and uncomment `psycopg2-binary` in
`requirements.txt`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. It talks to the backend at
`http://127.0.0.1:8000` by default; set `VITE_API_URL` in a `.env` file
(see `.env.example`) to point elsewhere.

### 3. Log in

Use the seeded admin account (`admin@clinic.com` / `Admin@123`), or register
a new admin/receptionist account from the Register page. From there:

1. Add doctors and patients (optionally with a portal login) from the
   **Doctors** and **Patients** pages.
2. Book appointments, write prescriptions and medical records, create bills,
   and upload documents from their respective pages.
3. Doctor and patient logins will see their own dashboard and data once
   linked to a profile.

## Running tests

```bash
cd backend
pytest
```

The test suite spins up an isolated SQLite database and exercises the full
flow: registration, login, creating a doctor/patient, booking an
appointment, prescribing, billing, and checking the dashboard.

## Building for production

```bash
cd frontend
npm run build   # outputs static files to frontend/dist
```

Serve `frontend/dist` with any static host, and deploy the backend with
`uvicorn app.main:app --host 0.0.0.0 --port $PORT` behind a real database
(set `DATABASE_URL`) and a strong `SECRET_KEY`.
