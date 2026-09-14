# SmartStudy AI

SmartStudy AI is a full-stack learning platform concept designed to help students organize study sessions, track progress, and stay motivated with future AI-assisted workflows.

## Current milestone

This repository is currently on the v2.0.0 UI foundation milestone.

Implemented in this milestone:

- a responsive application shell with sidebar and top navigation
- light and dark themes with a working theme toggle
- mobile-responsive navigation behavior
- static dashboard and placeholder pages for subjects, planner, quizzes, flashcards, brain gym, and settings
- accessible, demo-labeled UI blocks for future roadmap features
- URL-based route handling for the core dashboard shell experience

## Current limitations

The following are intentionally not implemented in this milestone:

- authentication
- database access or Prisma models
- AI features or API integrations
- quiz gameplay logic
- flashcard study logic
- games or multiplayer experiences
- real user accounts or persistent data

## Available routes

The frontend provides the following supported routes:

- `/` — Dashboard
- `/subjects` — Subjects overview placeholder
- `/planner` — Study planner placeholder
- `/quizzes` — Quiz placeholder
- `/flashcards` — Flashcards placeholder
- `/brain-gym` — Brain gym placeholder
- `/settings` — Settings UI preview

## Local development

Requirements:

- Node.js 20+
- pnpm 9+

Setup:

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install
cp .env.example .env
pnpm dev
```

Then open:

- frontend: http://localhost:5173
- API health check: http://localhost:5000/api/health

## Scripts

- `pnpm dev` — run the frontend and API together
- `pnpm build` — build all workspace packages
- `pnpm lint` — lint all workspaces
- `pnpm typecheck` — type-check all workspaces
- `pnpm test` — run API tests and workspace builds
- `pnpm format` — format the repository with Prettier
- `pnpm format:check` — verify formatting without changing files

## Project structure

```text
SmartStudyAI/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── shared/
│   ├── config/
│   └── ui/
├── docs/
├── .github/
│   └── workflows/
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── README.md
├── docker-compose.yml
└── docs/
```

## Git workflow

- keep the current feature branch for the active milestone
- review local changes before pushing
- do not push to GitHub without explicit approval

## Notes

This v2.0.0 milestone intentionally focuses on the UI foundation only. Future milestones will add real student workflows, persistent data, and AI-powered learning tools.
