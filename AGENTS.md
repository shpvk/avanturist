# Avanturist

## Repository map

- Backend: NestJS and TypeScript in `apps/backend/src`; Prisma schema in `apps/backend/prisma/schema.prisma`.
- Frontend: React, Vinext/Vite and Three.js in `apps/frontend`. Check its package.json before assuming Next.js commands or tooling.
- Use npm and the existing lockfiles. Node must satisfy package.json (currently >=22.13.0).
- Inspect git status before edits and preserve existing user changes.

## Development and verification

Run commands from the repository root:

- Backend dev: `npm run backend`; frontend dev: `npm run frontend`.
- Backend build: `npm run backend:build`.
- Backend tests: `npm run backend:test -- --runInBand`. Jest allows no tests, so a successful exit alone does not prove test coverage. Report whether tests actually ran.
- Frontend tests: `npm run frontend:test`. This already builds the frontend; avoid a duplicate build unless needed after further changes.
- Frontend build only: `npm run frontend:build`.
- Both test suites: `npm test`, when both applications are affected.
- Dota reference data: `npm run dota:sync` regenerates the hero and item catalogs from OpenDota. It overwrites `apps/backend/src/heroes/heroes.data.ts`, `apps/backend/src/items/items.data.ts` and `apps/frontend/app/_lib/dota-items.ts` — edit `scripts/sync-dota-constants.mjs`, never those files.
- Local PostgreSQL: `npm run db:up`, when needed for the task. Inspect docker-compose.yml for other service requirements.

Choose checks based on changed behavior. For UI changes, inspect the rendered page at relevant desktop and mobile sizes when browser tools are available. For documentation or instruction changes, verify their contents and commands without rebuilding the application.

Use `.env.example` to understand required configuration; do not print secrets from `.env`. Inspect database migration and seed commands before running them. Do not reset a database as a routine setup step.

## Work style

Implement ordinary requested changes end to end, with reasonable assumptions for routine details. Interview or grilling workflows in `.claude/skills` apply only when the user requests that workflow; do not turn implementation tasks into interviews.

Before commits, branches or PRs, read `.claude/skills/git-convention/SKILL.md` for the repository convention, subject to higher-priority instructions. Do not include unrelated existing changes in a commit.
