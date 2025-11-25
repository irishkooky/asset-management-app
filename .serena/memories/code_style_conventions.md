# Code Style & Conventions (MANDATORY)

## CRITICAL RULES - NO EXCEPTIONS

### 1. ALWAYS use early returns
- Exit functions as soon as possible when conditions are met
- Handle error cases and edge cases FIRST
- NEVER have deeply nested if-else chains

### 2. NEVER nest more than 2 levels deep
- Extract helper functions for complex logic
- Use guard clauses to reduce nesting

### 3. LIMIT functions to 20 lines
- If a function exceeds 20 lines, it's doing too much
- Extract logical chunks into separate functions

### 4. ONE responsibility per function
- Single Purpose Principle is MANDATORY
- Function names must clearly indicate their single purpose

### 5. GUARD clauses at the top
- All validation and edge cases handled first
- Early returns for invalid states
- Main logic at the bottom, unindented

### 6. NO else after return
- Once you return, no else is needed

### 7. Extract complex expressions
- No inline complex calculations
- Use descriptive variable names

## Formatting Standards (Biome Config)
- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for strings
- **Imports**: Auto-organized
- **Self-closing elements**: Required for JSX
- **No unused**: Variables, imports, function parameters

## TypeScript Conventions
- **Strict mode**: Enabled
- **Type inference**: Preferred over explicit types when clear
- **Path aliases**: Use `@/` prefixes for imports
  - `@/lib/*` - Library utilities
  - `@/components/*` - Shared components
  - `@/utils/*` - Utility functions
  - `@/types/*` - Type definitions

## React/Next.js Patterns
- **Server Components**: Default for pages
- **Client Components**: Use `"use client"` directive only when needed
- **Server Actions**: For form submissions (files named `actions.ts`)
- **File naming**: 
  - Pages: `page.tsx`
  - Layouts: `layout.tsx`
  - Components: kebab-case (e.g., `account-form.tsx`)
  - Actions: `actions.ts`

## Component Organization
- Page-specific components in `_components/` directories
- Shared components in root `components/` directory
- One component per file
- Export default for main component

## Database & API Patterns
- Utility functions in `/utils/supabase/` for database operations
- Server-side: Use `/utils/supabase/server.ts`
- Client-side: Use `/utils/supabase/client.ts`
- All database operations use Row Level Security (RLS)