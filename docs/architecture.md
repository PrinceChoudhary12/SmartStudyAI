# Architecture Overview

## Monorepo structure

The project uses a pnpm workspace monorepo to separate concerns while keeping shared code centralized.

- `apps/web` contains the React + TypeScript frontend
- `apps/api` contains the Express + TypeScript backend
- `packages/shared` contains common types and utilities
- `packages/config` contains environment and build-related configuration
- `packages/ui` contains reusable UI foundations for future use

## Frontend

The frontend uses Vite and React. The initial foundation focuses only on a minimal page that confirms the application is running.

## Backend

The backend uses Express with structured middleware and a health-check route. It exposes a small API surface and centralizes error handling.

## Shared layer

The shared package is intentionally minimal and meant for cross-app constants, response shapes, and future reusable contracts.

## Future milestones

This foundation intentionally excludes database, authentication, AI features, quizzes, games, and multiplayer functionality. Those belong to later roadmap milestones.
