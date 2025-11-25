# Essential Commands

## Development
```bash
pnpm dev          # Start Next.js development server (http://localhost:3000)
pnpm build        # Build for production
pnpm start        # Start production server
```

## Code Quality (MANDATORY AFTER CHANGES)
```bash
pnpm check        # Run both lint and format (ALWAYS run this after code changes)
pnpm typecheck    # Run TypeScript type checking (ALWAYS run this when testing)
pnpm lint         # Run Biome linter with auto-fix
pnpm format       # Run Biome formatter
```

## Testing
```bash
pnpm test         # Run Vitest tests once
pnpm test:watch   # Run tests in watch mode
```

## Dead Code Detection
```bash
pnpm knip         # Check for unused exports and dependencies
pnpm knip:ci      # CI version without exit codes
```

## Environment Setup
```bash
# Option 1: Use Vercel (recommended)
npx vercel link
npx vercel pull

# Option 2: Manual setup
cp .env.example .env.local
# Then fill in Supabase credentials
```

## Git Workflow
```bash
git branch --show-current  # Check current branch
git log --oneline -5       # Check recent commits
git checkout -b feature/[name]  # Create new feature branch
```

## System Commands (macOS)
```bash
ls              # List directory contents
find            # Search for files
grep            # Search text patterns
cd              # Change directory
git             # Version control
```

## CRITICAL WORKFLOW
1. Make code changes
2. **ALWAYS run `pnpm check`** - formats and lints code
3. **ALWAYS run `pnpm typecheck`** - ensures type safety
4. Run tests if applicable with `pnpm test`
5. Only then commit changes