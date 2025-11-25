# Repository Guidelines

This guide summarizes how to work effectively in this codebase. It is tailored to our Next.js + Supabase stack and current tooling.

## ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in .agent/PLANS.md) from design to implementation.

## Project Structure & Module Organization
- `app/` Next.js App Router routes, layouts, and server actions; keep route-specific UI close to its segment.
- `components/` Reusable UI and form widgets; prefer leaf components here and wire them up inside `app/`.
- `lib/` Service helpers (e.g., data access, Supabase clients) and shared logic used across routes.
- `utils/` Small pure helpers; `types/` shared TypeScript definitions.
- `supabase/migrations/` SQL migrations applied through the Supabase CLI; update when schema changes.
- `docs/` Architectural notes and supporting documentation; align new diagrams or ADRs here.

## Setup, Build, Test, and Development Commands
- Use Node `22.5.1` and `pnpm@10.6.2` (see `package.json`/`mise.toml`); install deps with `pnpm install`.
- Local dev server: `pnpm dev` (runs Next.js at http://localhost:3010).
- Production build: `pnpm build`; start a built app with `pnpm start`.
- Type safety: `pnpm typecheck` (tsc noEmit).
- Lint/format: `pnpm lint`, `pnpm format`, or `pnpm check` (Biome; auto-fixes are enabled in scripts).
- Tests: `pnpm test` for a one-off Vitest run, `pnpm test:watch` for TDD.
- Static analysis for dead code: `pnpm knip` (or `pnpm knip:ci` to ignore exit codes during exploration).

## Coding Style & Naming Conventions
- Formatting and linting are enforced by Biome; keep files auto-formatted (2-space indent, semicolons off per default).
- Prefer functional React components with TypeScript types; use PascalCase for components, camelCase for functions/variables, kebab-case for route segment folders.
- Keep Tailwind classes concise; group semantic slices (layout → spacing → color) to minimize churn.
- Place shared UI patterns in `components/`; avoid duplicating logic that belongs in `lib/` or `utils/`.

## Testing Guidelines
- Framework: Vitest with jsdom and @testing-library/react. Co-locate tests as `*.test.tsx`/`*.test.ts` near the module or under `__tests__/`.
- Cover data transforms, server actions, and interactive components; prefer mocking network/Supabase boundaries.
- Run `pnpm test` (or `pnpm test:watch`) before opening a PR; add regression tests for any bug fix.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (see history: `feat: ...`, `fix: ...`, `chore: ...`, etc.); keep scopes small and descriptive.
- PRs should include: concise summary, linked issue/Task ID, screenshots or GIFs for UI changes, and notes for schema/migration impacts.
- Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass locally; call out any follow-up work in the PR body.
- When altering the database, include the new SQL file in `supabase/migrations/` and mention migration implications.
