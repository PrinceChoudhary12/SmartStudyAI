# SmartStudy AI

SmartStudy AI is a full-stack learning platform concept for student organization, planning, and future AI-assisted study workflows.

## Current milestone

This repository is currently on the v3.0.0 authentication and database foundation milestone.

Implemented in this milestone:

- PostgreSQL + Prisma database foundation for the API
- secure user model with unique email addresses and password hashes
- registration, login, logout, and authenticated user endpoints
- HTTP-only cookie-based session handling with JWTs
- auth middleware for protected API access
- responsive authenticated app shell with login and registration pages
- protected frontend routes using session-backed authentication checks
- local Docker-based Postgres service for development

## Current limitations

The following are intentionally not implemented in this milestone:

- study timers
- quiz gameplay logic
- flashcard study logic
- AI-powered study assistance
- games or multiplayer experiences
- advanced user dashboards beyond the v2 shell
- production deployment or public hosting

## Local development

Requirements:

- Node.js 20+
- pnpm 9+
- Docker Desktop or a local PostgreSQL instance

Setup:

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install
cp .env.example .env
# ensure DATABASE_URL and AUTH_SECRET are set for your local environment
pnpm --dir apps/api exec prisma generate
pnpm --dir apps/api exec prisma migrate dev --name init
pnpm dev
```

Then open:

- frontend: http://localhost:5173
- API health check: http://localhost:5000/api/health
- auth endpoints: http://localhost:5000/api/auth/*

## Authentication and database setup

Environment variables:

```env
APP_NAME=SmartStudy AI
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173
WEB_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartstudy_ai?schema=public
AUTH_SECRET=replace-with-a-long-random-secret-at-least-32-characters
AUTH_COOKIE_NAME=smartstudy_session
VITE_API_BASE_URL=http://localhost:5000/api
```

Prisma commands:

```bash
pnpm --dir apps/api exec prisma validate
pnpm --dir apps/api exec prisma generate
pnpm --dir apps/api exec prisma migrate dev --name init
```

## Auth API endpoints

- `POST /api/auth/register` — create a user account and start a secure session
- `POST /api/auth/login` — sign in with an email/password and create a session cookie
- `POST /api/auth/logout` — clear the auth cookie
- `GET /api/auth/me` — fetch the authenticated user profile
- `GET /api/health` — verify API health and environment metadata

## Frontend routes

The frontend includes the authenticated app shell and these routes:

- `/login` — user sign in
- `/register` — account creation
- `/` — Dashboard
- `/subjects` — Subjects overview
- `/planner` — Study planner
- `/quizzes` — Quiz placeholder
- `/flashcards` — Flashcards placeholder
- `/brain-gym` — Brain gym placeholder
- `/settings` — Settings preview

## Security notes

- passwords are stored only as bcrypt hashes
- authentication tokens are issued server-side and stored in an HTTP-only cookie
- no authentication token is stored in localStorage
- API responses avoid exposing password hashes or stack traces
- no secrets or tokens are committed to the repository

## Scripts

- `pnpm dev` — run the frontend and API together
- `pnpm build` — build all workspace packages
- `pnpm lint` — lint all workspaces
- `pnpm typecheck` — type-check all workspaces
- `pnpm test` — run the API test suite
- `pnpm format` — format the repository with Prettier
- `pnpm format:check` — verify formatting without changing files

## Git workflow

- keep the current feature branch for the active milestone
- review local changes before pushing
- do not push to GitHub without explicit approval
- do not begin the next milestone until the current one is verified and approved

## Notes

This v3.0.0 milestone focuses on authentication and database foundation. It does not include the future v4 study tools or AI-driven workflows.
