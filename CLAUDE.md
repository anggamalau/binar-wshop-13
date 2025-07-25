# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 workshop application designed for teaching refactoring and performance optimization. The codebase intentionally contains suboptimal patterns for educational purposes.

## Essential Commands

### Development
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm start` - Run production build

### Testing
- `npm test` - Run Jest unit tests
- `npm test -- --testPathPattern=<pattern>` - Run specific test file
- `npm run test:e2e` - Run all Playwright E2E tests
- `npm run test:e2e:performance` - Run performance E2E tests (20 iterations)
- `npm run test:api-stability` - Test API stability (100 requests)
- `npx playwright test --ui` - Run Playwright with UI mode
- `npx playwright test --headed` - Run with browser visible
- `npx playwright test --debug` - Debug specific test
- `npm run test:api-stability:run` - Run API stability with detailed logging

### Database
- `npm run db-create` - Create and seed database with 10,000 users
- `npm run db-reset` - Drop and recreate database
- `npm run db-drop` - Drop database completely
- `npm run db-create-render` - Create database for Render deployment (100 users)

### Code Quality
- `npm run lint` - Run ESLint

### Performance Monitoring
- `npm run generate-react-data` - Generate React performance metrics (30 min)
- `npm run generate-db-metrics` - Generate database performance metrics
- `npm run generate-api-metrics` - Generate API performance metrics

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Database**: PostgreSQL with raw SQL queries
- **Authentication**: JWT tokens with bcrypt
- **Monitoring**: Prometheus + Grafana Cloud
- **Testing**: Jest (unit), Playwright (E2E)

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
  - `api/` - API route handlers
  - `login/`, `profile/`, `users/` - Page components
- `src/lib/` - Core utilities
  - `auth-utils.ts` - Authentication helpers
  - `database.ts` - Database connection and utilities
  - `bad-queries.ts` - Intentionally inefficient queries
  - `metrics.ts` - Prometheus metrics collection
  - `jwt.ts` - JWT token management
- `src/hooks/` - Custom React hooks
  - `useAuth.ts` - Authentication state management
  - `useTokenExpiration.ts` - Token expiration monitoring
  - `usePerformanceMonitor.ts` - React performance metrics
- `src/components/` - Shared React components
  - `Navbar.tsx` - Navigation with auth state
  - `SessionTimer.tsx` - Token expiration display
  - `TokenExpirationWarning.tsx` - Expiration warning modal
- `__tests__/` - Jest unit tests
- `e2e/` - Playwright E2E tests
- `scripts/` - Database and metrics generation scripts

### Database Schema
Five normalized tables:
- `auth` - User authentication (email, password hash)
- `users` - User profiles (full_name, username, bio, address, phone)
- `user_roles` - Role assignments (user_id, role)
- `user_logs` - Activity logging (user_id, action, timestamp)
- `user_divisions` - Department assignments (user_id, division_name)

### API Endpoints
- `POST /api/login` - Authentication (returns JWT token)
- `POST /api/password` - Update password
- `GET /api/users` - List users (supports ?division=Tech filter)
- `GET /api/user/[id]` - Get single user by ID
- `GET /api/profile` - Get current user profile (requires auth)
- `PUT /api/profile` - Update profile (requires auth)
- `DELETE /api/profile` - Delete profile (requires auth)
- `GET /api/metrics` - Prometheus metrics endpoint
- `POST /api/metrics/record` - Record custom metrics

### Authentication Flow
1. JWT tokens stored in httpOnly cookies (`authToken`)
2. Middleware (`src/middleware.ts`) protects routes requiring auth
3. Token expiration monitoring with visual countdown
4. Automatic redirect to `/login` on expiration
5. `useTokenExpiration` hook manages warning modal and auto-logout

### Intentional Performance Issues
This codebase contains deliberate anti-patterns for workshop purposes:
- Nested SQL subqueries in `lib/bad-queries.ts`
- No database indexes on frequently queried columns
- Missing pagination (loads all users at once)
- Inefficient state management (multiple useState calls)
- Complex unnecessary JOINs in user queries
- No query result caching
- Direct API calls without debouncing

When refactoring, focus on:
- Adding proper indexes (user_divisions.division_name, users.username)
- Implementing pagination (limit/offset)
- Simplifying queries (remove unnecessary subqueries)
- Optimizing React re-renders (useMemo, useCallback)
- Adding caching strategies (SWR or React Query)
- Implementing search/filter debouncing

## Test Credentials
Fixed accounts for testing:
- `aku123@gmail.com` / `password123` (recommended for automation)
- `kamu123@yopmail.com` / `password123`
- `user123@test.com` / `password123`

All other seeded users use password: `User123@`

## Environment Setup
Required `.env.local` variables:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=workshop_db
DB_PASSWORD=admin123
DB_PORT=5432
JWT_SECRET=your-super-secret-jwt-key
```

## Testing Configuration
- **Jest**: Uses jsdom environment, 30s timeout, coverage enabled
- **Playwright**: 1-hour timeout for performance tests, Chrome browser, auto-starts dev server
- **Coverage**: Reports in multiple formats (json, lcov, text, clover)