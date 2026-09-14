# SmartStudy AI

SmartStudy AI is a full-stack learning platform designed to help students organize study sessions, track progress, and stay motivated with AI-assisted support.

## Current milestone

This repository is currently at v1.0.0 foundation and includes:

- a pnpm monorepo
- a React + TypeScript frontend in `apps/web`
- an Express + TypeScript backend in `apps/api`
- shared packages for configuration, UI, and common types
- environment examples and documentation
- linting, formatting, type-checking, and build scripts
- a basic health-check endpoint

## Requirements

- Node.js 20+
- pnpm 9+

## Setup

1. Install pnpm if it is not already available:

   ```bash
   corepack enable
   corepack prepare pnpm@9.15.4 --activate
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

4. Start the project in development mode:

   ```bash
   pnpm dev
   ```

5. Open the frontend at http://localhost:5173 and the API at http://localhost:5000/api/health.

## Scripts

- `pnpm dev` — run frontend and backend together
- `pnpm build` — build all workspace packages
- `pnpm lint` — lint all workspaces
- `pnpm typecheck` — type-check all workspaces
- `pnpm test` — run API tests
- `pnpm format` — format the project with Prettier

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

## Notes

This foundation does not yet include authentication, AI integrations, database models, study features, games, or multiplayer functionality.
