# The Healing Mat

Monorepo for the Healing Mat storefront, admin dashboard, and API.

| App | Stack | Port |
| --- | --- | --- |
| `frontend` | Next.js | 3000 |
| `admin` | Next.js | 3001 |
| `backend` | Nest.js | 4000 |
| `postgres` | PostgreSQL 16 | 5432 |

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (Docker Compose is included; a local install such as Postgres.app also works)

## Setup

Copy env files if you have not already:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp admin/.env.example admin/.env.local
```

Install dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix admin
```

## Run

1. Start PostgreSQL with Docker:

```bash
docker compose up -d
```

If PostgreSQL is already installed locally instead, create the app database:

```bash
psql -d postgres -c "CREATE ROLE healingmat LOGIN PASSWORD 'healingmat';"
psql -d postgres -c "CREATE DATABASE healingmat OWNER healingmat;"
```

2. Start the API, storefront, and admin (separate terminals):

```bash
npm run start:dev --prefix backend
npm run dev --prefix frontend
npm run dev --prefix admin
```

Or from the repo root after `npm install`:

```bash
npm run db:up
npm run dev
```

Then open:

- Storefront: http://localhost:3000
- Admin: http://localhost:3001
- API health: http://localhost:4000/api/health

TypeORM `synchronize` is enabled outside production so tables can be created while we add entities. Switch to migrations before going live.
