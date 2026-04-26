# AOS - Employee Proportion Tracker

Employee work-hour tracking application with dashboard logging, employee contribution reporting, admin management, and Excel-based initial data import.

## Features

- Dashboard with daily entry form, selected-date employee summary, and editable log table
- Admin panel for employees and projects
- Project-wise and employee-wise contribution reports
- Excel export with exactly two sheets
- SQL-backed CRUD after import
- Excel dataset import command for first-time database seeding

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend: Node.js, Express.js
- Database: PostgreSQL or SQLite
- ORM: Sequelize
- Excel import/export: `xlsx` and ExcelJS

## Folder Structure

```text
/client
/server
/database
README.md
.gitignore
.env.example
```

## Dataset Placement

Place the source workbook inside:

```text
/server/data/AOS_Sample_Dataset_v3_Max_4_Projects(1).xlsx
```

The repository keeps `server/data/.gitkeep` so the folder exists in Git without forcing private Excel files into version control.

## Environment Setup

### Server

Copy:

```bash
cp server/.env.example server/.env
```

Important variables:

- `DB_DIALECT=postgres` for hosted databases, or `sqlite` for quick local setup
- `DB_STORAGE=./data/aos-tracker.sqlite` for local SQLite
- `AUTO_SEED=true` only if you want the backend to auto-import the workbook into an empty database on startup
- `SEED_FILE_PATH=./data/AOS_Sample_Dataset_v3_Max_4_Projects(1).xlsx`

### Client

Copy:

```bash
cp client/.env.example client/.env
```

Set:

```text
VITE_API_URL=http://localhost:5000/api
```

## Database Setup

### SQLite local setup

Set this in `server/.env`:

```text
DB_DIALECT=sqlite
```

Then the backend will create `server/data/aos-tracker.sqlite`.

### PostgreSQL setup

Update these values in `server/.env`:

```text
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aos_tracker
DB_USER=postgres
DB_PASSWORD=your_password
```

### SQL Schema

Reference schema:

```text
database/schema.sql
```

## Install Dependencies

From the project root:

```bash
npm install
npm run install:all
```

Or separately:

```bash
cd server
npm install
```

```bash
cd client
npm install
```

## Import Excel Data

After placing the workbook in `server/data`, run:

```bash
cd server
npm run seed
```

or from the project root:

```bash
npm run seed
```

What the seed command does:

- reads the `Work Logs`, `Employees`, and `Projects` sheets
- clears old imported/demo rows
- imports employees
- imports projects
- imports work logs
- stores everything in the SQL database

After import, the app uses only the SQL database for dashboard, admin, reports, edits, deletes, and exports.

## Start Backend

```bash
cd server
npm run dev
```

## Start Frontend

```bash
cd client
npm run dev
```

## Production-Style Local Run

Build the frontend and serve it from Express:

```bash
npm run build
npm start
```

Open:

```text
http://localhost:5000
```

## Useful Commands

From project root:

```bash
npm run dev
npm run build
npm start
npm run seed
```

From server:

```bash
npm run seed
npm run import-excel
npm run dev
```

## API Summary

- `POST /api/logs`
- `GET /api/logs?date=YYYY-MM-DD`
- `PUT /api/logs/:id`
- `DELETE /api/logs/:id`
- `GET /api/report`
- `GET /api/export`
- `GET /api/employees`
- `POST /api/employees`
- `DELETE /api/employees/:id`
- `GET /api/projects`
- `POST /api/projects`
- `DELETE /api/projects/:id`

## Report Formula

```text
Employee Contribution % = Employee Project Hours / Total Project Hours * 100
```

## Excel Export

Exports are generated from SQL database data and contain exactly two sheets:

1. `Project wise breakdown`
2. `Employee contribution by project`

Each export includes:

- selected date range metadata
- bold headers
- frozen header row
- filters
- readable column widths

## GitHub Notes

- `.env` files are ignored
- `server/data/.gitkeep` is tracked
- `.xlsx` files are ignored unless intentionally force-added
- the project is ready to push once your local `.env` stays uncommitted
