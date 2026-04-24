# Eastbrook Unified App

This `app/` directory is now the main Eastbrook website. It combines:

- the research analytics story from `dashboard/`
- the intervention workflow from `prototype/`
- the live multi-role product in `app/`

## Stack

- `Vite + React + TypeScript`
- `Express`
- `PostgreSQL` via Neon serverless driver

## What the app includes

- Student portal with live session logging, nudges, training, and progress
- Educator console with roster, alerts, nudges, and cohort trends
- Analyst dashboard with imported Eastbrook dataset analytics, AS-IS vs TO-BE comparison, and KPI views

## Setup

1. Add `DATABASE_URL` and `JWT_SECRET` to `app/.env.local`.
2. Install dependencies:

```bash
npm install
```

3. Initialize the full database:

```bash
npm run db:init
```

This creates the schema, seeds role accounts, seeds `400` student profiles, imports `12,000` dataset rows, and loads the training catalog.

## Run

Start the API:

```bash
npm run server
```

Start the frontend:

```bash
npm run dev
```

## Useful scripts

```bash
npm run db:init
npm run db:seed:students
npm run db:seed:training
npm run db:import:dataset
npm run build
```

## Demo accounts

After `npm run db:init`, the console prints:

- one seeded student email
- `educator@eastbrook.edu`
- `analyst@eastbrook.edu`
- the shared demo password

## Verification

The frontend builds successfully with:

```bash
npm run build
```
