# SmartStudy AI

SmartStudy AI is a full-stack learning platform for student organization, study tracking, quiz and flashcard review, and future AI-assisted workflows.

## Current status

The repository has verified v4.0.0 study-management functionality and is actively working through the v5.0.0 quiz and flashcard engine on the `feature/v5-quiz-flashcards` branch.

### Verified completion

- v1.0.0 foundation: monorepo, app shell, health route, shared config
- v2.0.0 UI foundation: dashboard, routing, responsive app shell, authenticated view flow
- v3.0.0 auth and database foundation: Prisma + Postgres, secure auth, JWT cookies, middleware
- v4.0.0 study management: subjects, chapters, notes, study sessions, mood tracking

### v5.0.0 in progress

Implemented and validated in the current branch:

- quiz CRUD endpoints
- multiple-choice and true/false question validation
- server-side scoring and answer grading
- attempt records with ownership checks
- flashcard deck and card CRUD
- review tracking and spaced-repeat progress updates
- v5 regression tests for ownership, malformed answers, and grading safeguards

This milestone is not declared complete until all checks pass in the feature branch and the branch is safely pushed and verified on GitHub.

## Local development

Requirements:

- Node.js 20+
- pnpm 9+
- PostgreSQL 16 or a local compatible PostgreSQL instance

Setup:

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install
cp .env.example .env
# set DATABASE_URL and AUTH_SECRET in your local environment before running Prisma
pnpm --dir apps/api exec prisma generate
pnpm --dir apps/api exec prisma migrate dev --name add_v5_quiz_flashcard_engine
pnpm dev
```

Then open:

- frontend: http://localhost:5173
- API health check: http://localhost:5000/api/health
- auth endpoints: http://localhost:5000/api/auth/*

## Environment configuration

```env
APP_NAME=SmartStudy AI
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173
WEB_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres@localhost:5432/smartstudy_ai?schema=public
AUTH_SECRET=replace-with-a-long-random-secret-at-least-32-characters
AUTH_COOKIE_NAME=smartstudy_session
VITE_API_BASE_URL=http://localhost:5000/api
```

## Prisma commands

```bash
pnpm --dir apps/api exec prisma validate
pnpm --dir apps/api exec prisma generate
pnpm --dir apps/api exec prisma migrate dev --name add_v5_quiz_flashcard_engine
pnpm --dir apps/api exec prisma migrate status
```

## API endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Study tools

- `GET /api/subjects`
- `POST /api/subjects`
- `GET /api/study-sessions`
- `POST /api/study-sessions`
- `GET /api/moods`
- `POST /api/moods`

### v5 quiz and flashcard tools

- `GET /api/quizzes`
- `POST /api/quizzes`
- `GET /api/quizzes/:id`
- `PATCH /api/quizzes/:id`
- `DELETE /api/quizzes/:id`
- `POST /api/quizzes/:quizId/attempts`
- `GET /api/quizzes/:quizId/attempts`
- `GET /api/quiz-attempts/:id`
- `GET /api/flashcard-decks`
- `POST /api/flashcard-decks`
- `GET /api/flashcard-decks/:id`
- `POST /api/flashcards/:id/review`
- `GET /api/flashcards/:id/progress`

## Security notes

- passwords are stored only as bcrypt hashes
- authentication tokens are issued server-side and stored in HTTP-only cookies
- no auth token is stored in localStorage
- quiz answers are scored server-side and correct answers are not exposed before or after submission via public quiz payloads
- ownership checks protect quizzes, decks, cards, and attempts

## Quality checks

```bash
pnpm install
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir apps/api exec prisma validate
pnpm --dir apps/api exec prisma migrate status
```

## Git workflow

- keep the current feature branch for the active milestone
- do not merge into `main` until the branch has passed validation
- do not create tags or releases until checks and integration are verified
- v6 features remain blocked until v5 is verified and safely pushed
