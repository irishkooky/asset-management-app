# Task Completion Checklist

## MANDATORY STEPS AFTER ANY CODE CHANGES

### 1. Code Quality (REQUIRED)
```bash
pnpm check        # MUST run - lints and formats code
pnpm typecheck    # MUST run - ensures type safety
```

### 2. Testing (when applicable)
```bash
pnpm test         # Run tests if they exist for changed areas
```

### 3. Verification Steps
- [ ] All TypeScript errors resolved
- [ ] All linting errors resolved
- [ ] Code follows the mandatory style rules (early returns, <20 lines, etc.)
- [ ] No unused imports or variables
- [ ] Proper error handling implemented
- [ ] Server Actions use proper validation

### 4. Branch Management
- [ ] Verify you're on the correct branch (`git branch --show-current`)
- [ ] Branch name matches the work being done
- [ ] Create new branch if current branch doesn't match feature

### 5. Before Committing
- [ ] All mandatory code quality checks passed
- [ ] No console.log statements left in production code
- [ ] Environment variables not hardcoded
- [ ] Database operations use proper RLS patterns

### 6. Testing Considerations
- [ ] Server Components tested by navigating to pages
- [ ] Form submissions work correctly
- [ ] Error states handled gracefully
- [ ] Authentication flows work as expected

## NEVER SKIP THESE STEPS
The code quality checks (`pnpm check` and `pnpm typecheck`) are NON-NEGOTIABLE and must be run after every code change. This ensures consistency and prevents issues in production.

## Additional Checks for Specific Changes
- **Database changes**: Test with actual Supabase connection
- **UI changes**: Verify responsive design and HeroUI component usage
- **Authentication**: Test protected route behavior
- **Forms**: Verify Server Action validation works correctly