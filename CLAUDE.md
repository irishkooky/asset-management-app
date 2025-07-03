# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev          # Start Next.js development server (http://localhost:3000)
```

### Setup
Environment variables are required for Supabase connection:
- Copy `.env.example` to `.env.local` and fill in Supabase credentials
- Or use `npx vercel link` and `npx vercel pull` to sync from Vercel

### Code Quality
```bash
pnpm lint         # Run Biome linter with auto-fix
pnpm format       # Run Biome formatter
pnpm check        # Run both lint and format
pnpm typecheck    # Run TypeScript type checking
```

**IMPORTANT**: Always run `pnpm check` after making code changes to ensure code quality.

### Testing
```bash
pnpm test         # Run Vitest tests once
pnpm test:watch   # Run tests in watch mode
```

**IMPORTANT**: Always run both `pnpm typecheck` and `pnpm check` when testing to ensure type safety and code quality.

### Build & Production
```bash
pnpm build        # Build for production
pnpm start        # Start production server
```

### Dead Code Detection
```bash
pnpm knip         # Check for unused exports and dependencies
```

## Architecture Overview

This is a Next.js 15 application using App Router with the following architecture:

### Tech Stack
- **Frontend**: Next.js 15 with React 19, TypeScript, Server Components
- **Database**: Supabase (PostgreSQL with RLS)
- **Styling**: TailwindCSS + HeroUI components
- **Forms**: Server Actions with Valibot validation
- **State**: React hooks, no global state management

### Key Patterns

1. **Authentication Flow**
   - Middleware (`middleware.ts`) protects routes under `/(protected)`
   - Unauthenticated users redirected to landing page
   - Auth handled via Supabase client

2. **Server Components & Actions**
   - Pages use Server Components by default
   - Form submissions use Server Actions (files named `actions.ts`)
   - Client interactivity added with `"use client"` directive

3. **Database Access**
   - Utility functions in `/utils/supabase/` handle all database operations
   - Server-side uses `createClient()` from `/utils/supabase/server.ts`
   - Client-side uses `createClient()` from `/utils/supabase/client.ts`

4. **Type Safety**
   - Database types generated in `/types/database.ts`
   - Strict TypeScript configuration
   - Valibot schemas for runtime validation

### Project Structure

- `app/(protected)/` - Authenticated routes
  - `accounts/` - Bank account management (CRUD)
  - `dashboard/` - Main dashboard
  - `summary/` - Monthly financial summaries
  - `transactions/` - Transaction management
    - `one-time/` - One-time transactions
    - `recurring/` - Recurring transactions
  - `_components/` - Shared components for protected pages

- `components/` - Shared UI components
- `utils/` - Utility functions and Supabase clients
- `supabase/migrations/` - Database schema migrations

Note: Page-specific components are stored in `_components/` directories within each route. Server actions should be stored in `actions.ts` files within each route (migration to this pattern is in progress)

### Database Schema

- `accounts` - User bank accounts with balances and sort order
- `recurring_transactions` - Monthly recurring income/expenses
- `one_time_transactions` - One-time transactions
- `processed_transactions` - Processed recurring transactions
- `monthly_account_balances` - Monthly balance snapshots

All tables use Row Level Security (RLS) scoped to authenticated users.

## Git Workflow & Branch Management

**IMPORTANT**: Before implementing any feature:
1. **Check current branch**: Always verify you're on the correct branch using `git branch --show-current`
2. **Check branch purpose**: Review recent commits with `git log --oneline -5` to ensure the branch name matches the intended work
3. **Create new branch if needed**: If the current branch name doesn't match the feature you're about to implement, create a new branch:
   ```bash
   git checkout -b feature/[descriptive-name]
   ```
   
**Branch Naming Convention**:
- `feature/` - New features
- `fix/` - Bug fixes
- `chore/` - Maintenance tasks
- `refactor/` - Code refactoring

**Example**: If on `feature/recurring-transfers` but implementing month selection, create `feature/month-selector` instead.