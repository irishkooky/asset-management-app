# Asset Management App - Project Overview

## Purpose
A full-stack web application built for managing personal assets and financial resources. The app provides:
- Asset management and tracking
- Bank account management with CRUD operations
- Transaction management (one-time and recurring)
- Financial summaries and monthly reports
- Resident tax management
- Real-time balance updates

## Current Status
- Work in progress (as indicated by project status badge)
- Currently on `feature/recurring-transactions-heroui` branch
- Recent work focused on converting components to use HeroUI instead of custom components

## Key Features
1. User authentication with Supabase Auth
2. Protected routes with middleware-based authentication
3. Bank account management with balances and sort order
4. One-time and recurring transaction management
5. Monthly account balance snapshots
6. Resident tax payment tracking
7. Real-time updates and responsive design

## Architecture
- Next.js 15 App Router with Server Components
- React 19 with TypeScript
- Supabase for database and authentication
- HeroUI component library with TailwindCSS
- Server Actions for form handling with Valibot validation
- No global state management - uses React hooks