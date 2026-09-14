# Setup Guide

## Prerequisites

- Node.js 20 or later
- pnpm 9.15.4 or later

## Install

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install
cp .env.example .env
```

## Run locally

```bash
pnpm dev
```

This starts the API and web app together.

- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api/health

## Production-style build

```bash
pnpm build
```

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
```
