# AOS - Employee Proportion Tracker

Employee work-hour tracking application with dashboard logging, selected-date summaries, contribution reports, admin management, and Excel import/export.

## Production-Ready Stack

- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend: Node.js, Express.js
- Database: PostgreSQL for production, SQLite only for local development
- ORM: Sequelize
- Hosting target: Render web service + Render Postgres
- Excel import/export: `xlsx` and ExcelJS

## Features

- Add, edit, and delete daily work logs
- Selected-date employee hours summary
- Project-wise and employee-wise contribution reports
- Admin panel for employee and project master data
- Excel export with exactly 2 report sheets
- Excel seed/import command for first-time dataset loading

## Folder Structure

```text
/client
/server
/database
/render.yaml
README.md
.gitignore
.env.example
```

## Render Deployment

This repository is now structured for **Render** using:

- `render.yaml` for Blueprint-based deployment
- Render Postgres as the production database
- Express serving the built frontend
- `DATABASE_URL` support for hosted PostgreSQL
- `preDeployCommand` to prepare the database schema before the app starts

### Render services created by `render.yaml`

- Web service: `aos-tracker-web`
- PostgreSQL database: `aos-tracker-db`

### Important production note

Do **not** use SQLite on Render for real deployment. Render local disk is not suitable as your long-term production database. Use PostgreSQL.

## Render Seed File Strategy

The Excel workbook is intentionally **not committed** to Git.

If you want the first Render deployment to import your dataset automatically, you have two options:

1. Upload the workbook to the Render service as a **secret file**
2. Intentionally add the workbook to the repo yourself

Expected file path inside the service:

```text
./data/AOS_Sample_Dataset_v3_Max_4_Projects(1).xlsx
```

If you use a secret file or another runtime path, set:

```text
SEED_FILE_PATH=./data/AOS_Sample_Dataset_v3_Max_4_Projects(1).xlsx
```

Recommended first deploy behavior:

- set `AUTO_SEED=true`
- deploy once
- confirm data import
- then set `AUTO_SEED=false` to avoid unnecessary seed attempts later

If the seed file is missing, the app skips auto-seeding and still starts normally.

## Environment Variables

### Root `.env.example`

The root example mirrors production-style settings.

### Server

Copy:

```bash
cp server/.env.example server/.env
```

Important variables:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `DB_DIALECT`
- `DB_SSL`
- `SYNC_DATABASE`
- `AUTO_SEED`
- `SEED_FILE_PATH`
- `FRONTEND_DIST`

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

### Production

Use PostgreSQL:

```text
DB_DIALECT=postgres
DATABASE_URL=postgresql://...
DB_SSL=false
SYNC_DATABASE=true
```

### Local Development

Use SQLite only for local testing:

```text
DB_DIALECT=sqlite
DB_STORAGE=./data/aos-tracker.sqlite
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

What it does:

- reads `Work Logs`
- reads `Employees`
- reads `Projects`
- clears old imported/demo rows
- imports employees
- imports projects
- imports work logs
- then the app uses SQL for all operations afterward

## Local Development

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

### Combined root dev

```bash
npm run dev
```

## Production-Style Local Run

```bash
npm run build
npm run db:prepare
npm start
```

Open:

```text
http://localhost:5000
```

## Render Commands

### Build command

```bash
npm install && npm run install:all && npm run build
```

### Pre-deploy command

```bash
npm run db:prepare
```

### Start command

```bash
npm start
```

## Useful Commands

From project root:

```bash
npm run dev
npm run build
npm run db:prepare
npm start
npm run seed
```

From server:

```bash
npm run db:prepare
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

Exports are generated from SQL database data and contain exactly 2 sheets:

1. `Project wise breakdown`
2. `Employee contribution by project`

Note:

- Excel itself limits worksheet names to 31 characters, so the second sheet name may be visually trimmed by Excel clients even though the export logic follows the requested naming intent.

## GitHub Notes

- `.env` files are ignored
- `server/data/.gitkeep` is tracked
- `.xlsx` files are ignored unless you intentionally force-add one
- SQLite files and logs are ignored
- the repo is ready for GitHub and Render deployment
