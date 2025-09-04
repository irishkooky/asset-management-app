# Project Structure

## Root Directory
```
├── app/                    # Next.js App Router pages
├── components/             # Shared UI components
├── lib/                    # Shared libraries and utilities
├── supabase/              # Database migrations and config
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions and Supabase clients
├── package.json           # Dependencies and scripts
├── CLAUDE.md             # Project instructions for Claude
├── biome.json            # Linting and formatting config
├── tsconfig.json         # TypeScript configuration
└── tailwind.config.ts    # TailwindCSS configuration
```

## App Directory Structure (Next.js App Router)
```
app/
├── (protected)/          # Protected routes requiring authentication
│   ├── accounts/         # Bank account management
│   ├── dashboard/        # Main dashboard
│   ├── summary/          # Monthly financial summaries
│   ├── transactions/     # Transaction management
│   │   ├── one-time/     # One-time transactions
│   │   └── recurring/    # Recurring transactions
│   ├── resident-tax/     # Resident tax management
│   └── _components/      # Shared components for protected pages
├── auth/                 # Authentication routes
├── _components/          # Shared components for public pages
├── layout.tsx           # Root layout
├── page.tsx             # Landing page
└── globals.css          # Global styles
```

## Key File Patterns
- `page.tsx` - Page components (Server Components by default)
- `layout.tsx` - Layout components
- `actions.ts` - Server Actions for form handling
- `loading.tsx` - Loading UI
- `_components/` - Page-specific components

## Utils Directory
```
utils/
├── supabase/            # Database operation utilities
│   ├── server.ts        # Server-side Supabase client
│   ├── client.ts        # Client-side Supabase client
│   ├── accounts.ts      # Account-related operations
│   ├── recurring-transactions.ts
│   ├── one-time-transactions.ts
│   └── processed-transactions.ts
├── validators/          # Valibot validation schemas
└── utils.ts            # General utility functions
```

## Database Structure (Supabase)
- `accounts` - User bank accounts with balances
- `recurring_transactions` - Monthly recurring income/expenses
- `one_time_transactions` - One-time transactions
- `processed_transactions` - Processed recurring transactions
- `monthly_account_balances` - Monthly balance snapshots
- `resident_tax_settings` - Resident tax configuration
- `resident_tax_periods` - Tax payment periods

## Component Organization Principles
1. **Page-specific components**: Store in `_components/` within each route
2. **Shared components**: Store in root `components/` directory
3. **One component per file**: Each component gets its own file
4. **Kebab-case naming**: Use hyphens for component file names
5. **Server Components default**: Use `"use client"` only when needed