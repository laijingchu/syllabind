# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Syllabind is a full-stack learning platform connecting creators who build curated multi-week syllabi with learners seeking structured educational experiences.

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite
- UI: Radix UI + TailwindCSS 4
- Backend: Express.js + Node.js
- Database: PostgreSQL + Drizzle ORM
- Auth: Custom authentication with Passport.js (supports Replit Auth, email/password, and OAuth)

## Development Commands

### Running the Application

```bash
# Start development (runs both client and server)
npm run dev              # Server on port 5000 (default)
npm run dev:client       # Client only (if needed separately)

# Build for production
npm run build            # Builds server + client

# Start production server
npm start                # Runs built server
```

### Database Commands

```bash
# Push schema changes to database (development)
npm run db:push

# Seed database with test data (development only)
npm run db:seed

# Database migrations are in migrations/ directory
# Apply migration manually:
psql "$DATABASE_URL" -f migrations/<migration-file>.sql

# Migration script (for complex migrations):
tsx server/migrate-jsonb-to-normalized.ts
```

### Type Checking

```bash
npm run check            # Run TypeScript compiler check
```

### Testing

```bash
# Run all backend tests (sequential, low CPU usage)
npm test

# Run tests in parallel (faster, more CPU intensive)
npm run test:parallel

# Run tests without coverage analysis (faster)
npm run test:quick

# Run a specific test file
npm run test:single server/__tests__/storage.test.ts

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

**Test Organization:**
- Backend tests only: `server/__tests__/`
- Test setup: `jest.setup.js`, `jest.afterEnv.js`
- Mock utilities: `server/__tests__/setup/mocks.ts`
- Focus: Business logic, API routes, storage layer

**After Making Changes:**
1. After any non-trivial code change, run `npm test`
2. If tests fail, fix the code and re-run tests until they pass
3. Always write or update tests for new features
4. Update existing tests when changing functionality

**Test Coverage Thresholds:**
- Branches: 60%
- Functions: 65%
- Lines: 70%
- Statements: 70%

## Architecture Overview

### Monorepo Structure

The codebase is organized as a monorepo with three main directories:

- **`client/`** - React SPA frontend
- **`server/`** - Express backend API
- **`shared/`** - Shared code (database schema, types, validation)

### Path Aliases

Vite is configured with the following path aliases:

- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

### Database Schema Design

The database uses a fully normalized relational schema with **username-based foreign keys** for better debugging and logging:

**Foreign Key Strategy:**
- `syllabi.creator_id` → `users.username` (with CASCADE updates, SET NULL on delete)
- `enrollments.student_id` → `users.username` (with CASCADE updates and deletes)
- `cohorts.creator_id` → `users.username`
- `cohort_members.student_id` → `users.username`

**Key Tables:**
1. **users** - User accounts with creator flag, profile info, social links
2. **syllabi** - Learning content metadata (title, description, status, creator)
3. **weeks** - Weekly structure within each syllabus (normalized)
4. **steps** - Individual learning activities (readings/exercises) within weeks (normalized)
5. **enrollments** - Learner participation in syllabi with progress tracking
6. **completed_steps** - Junction table tracking step completion (replaces JSONB arrays)
7. **submissions** - Learner exercise submissions with creator feedback
8. **cohorts** - Groups of learners for social learning
9. **cohort_members** - Junction table for cohort membership
10. **sessions** - Express-session storage (required for auth)

**JSONB Usage:** The schema is fully normalized. Only `sessions.sess` uses JSONB (required by express-session).

### Frontend State Management

**Context Store (`client/src/lib/store.tsx`):**
- Central state management using React Context API
- Provides user auth state, enrollment data, syllabi list
- Methods for login/logout, enrollment, progress tracking, and creator actions

**React Query:**
- Handles API data fetching and caching
- Configured with no auto-refetch for Context Store control
- Used for server-side data synchronization

### API Conventions

**Authentication:**
- Custom auth using Passport.js
- Session-based authentication stored in PostgreSQL
- `isAuthenticated` middleware protects routes
- User object available as `req.user` with `username` field

**Authorization Pattern:**
```typescript
// Creator authorization example
const username = (req.user as any).username;
const syllabus = await storage.getSyllabus(id);
if (syllabus.creatorId !== username) {
  return res.status(403).json({ error: "Forbidden" });
}
```

**ID Types:**
- Syllabi, enrollments, steps, weeks: `integer` (serial primary keys)
- Users: `varchar` (UUID)
- Foreign keys to users: `text` (username)

### Component Organization

**Pages:** 14 main pages in `client/src/pages/`
- Public: Marketing, Login, Catalog, SyllabusOverview
- Learner: Dashboard, WeekView, Completion, Profile
- Creator: CreatorDashboard, CreatorEditor, CreatorAnalytics, CreatorLearners, CreatorProfile

**UI Primitives:** 50+ reusable components in `client/src/components/ui/`
- Built on Radix UI with TailwindCSS styling
- Categories: Form Inputs, Layout, Overlays, Navigation, Data Display, Feedback, Rich Content

## Key Technical Patterns

### Database Migrations

The project has undergone significant schema migrations:

1. **Username-based Foreign Keys** (2026-01-26)
   - Replaced UUID foreign keys with username references
   - Benefits: Better logging, easier debugging
   - Migration: `migrations/manual_username_migration.sql`

2. **JSONB to Normalized Tables** (2026-01-26)
   - Migrated syllabus content from JSONB to `weeks` and `steps` tables
   - Changed step IDs from string UUIDs to integer serials
   - Migration script: `server/migrate-jsonb-to-normalized.ts`

3. **Completion Tracking Normalization** (2026-01-26)
   - Replaced JSONB array with `completed_steps` junction table
   - Enables efficient queries and time-based analytics
   - Migration: `migrations/0001_normalize_completed_steps.sql`

### Authentication Flow

1. User logs in via custom auth (Replit Auth, email/password, or OAuth)
2. Passport.js serializes full user object (including username) to session
3. Session stored in PostgreSQL `sessions` table
4. Protected routes check `req.user.username` for authorization

### Creator vs Learner Roles

- Users toggle between roles via `isCreator` flag
- Same user can be both creator and learner
- Creator routes check authorization using `username` matching
- Learner enrollment tracks progress per user per syllabus

## Common Development Workflows

### Seeding the Database

After pushing the schema or resetting the database, populate it with test data:

```bash
npm run db:seed
```

**What gets created:**
- 1 creator account (janesmith)
- 5 learner accounts (various enrollment states)
- 2 published syllabi (Digital Minimalism, Systems Thinking 101)
- 5 enrollments with realistic progress
- Multiple completed steps for testing

**All test accounts use password:** `password123`

See `SEEDING_GUIDE.md` for detailed documentation on test accounts, data structure, and customization options.

**⚠️ Important:** The seed script should only be run in development. All mock data has been removed from the frontend, so seeding is required to test the application.

### Adding a New Database Table

1. Define table in `shared/schema.ts` using Drizzle ORM
2. Export insert schema with `createInsertSchema()`
3. Run `npm run db:push` to sync schema
4. Add storage methods in `server/storage.ts`
5. Add API routes in `server/routes.ts`
6. Update TypeScript types in `client/src/lib/types.ts` if needed

### Creating a New Page

1. Add page component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation links in `client/src/components/Layout.tsx` if needed
4. Use Context Store methods to fetch/update data
5. Use UI primitives from `client/src/components/ui/` for consistency

### Adding an API Endpoint

1. Define route in `server/routes.ts`
2. Use `isAuthenticated` middleware for protected routes
3. Validate input with Zod schemas from `shared/schema.ts`
4. Call storage methods from `server/storage.ts`
5. Return JSON responses with appropriate status codes
6. Add authorization checks for creator-only actions

## Important Notes

### Sessions Table

The `sessions` table is **mandatory** for authentication. Do not drop or modify it. It's required by express-session and Replit Auth integration.

### Foreign Key Cascading

The schema uses cascading deletes and updates:
- Deleting a syllabus cascades to weeks, steps, enrollments, submissions, completed_steps
- Deleting a user cascades to enrollments, submissions, cohort_members
- Updating a username cascades to all foreign key references

### Step IDs

Step IDs are integers (serial), not UUIDs. Historical migrations changed this from string UUIDs. When working with steps, use `parseInt()` on route parameters.

### Port Configuration

The server **must** run on the port specified in `process.env.PORT` (default 5000). Other ports are firewalled in the Replit environment. The single port serves both API and client.

### Development vs Production

- **Development:** Vite dev server proxies to Express backend
- **Production:** Express serves static files from `dist/public/`
- Vite setup is conditional on `NODE_ENV`

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - development | production
- Authentication provider credentials (depending on provider used)

## Code Style Notes

- TypeScript strict mode enabled
- Use Zod schemas for validation at API boundaries
- Prefer async/await over promises
- Use Drizzle ORM query builder (not raw SQL)
- Component props destructuring at function signature
- TailwindCSS utility classes for styling (no CSS modules)
- 
## Instructions
1. Always keep `architecture.md` updated whenever a change is made.
2. In databases, Avoid the use of JSONB Column and use normalized schema by default. Explicitly ask for permission if JSONB is determined to be a superior solution for a given problem.
3. Keep commented out dev notes consolidated and readable. Do not spell out entire thought process.
4. No need to keep asking for permission for reading files or running commands
5. **Testing Protocol:**
   - After making any non-trivial change to backend code, run `npm test`
   - If tests fail, fix the code and re-run tests until they pass
   - Always write or update tests for new features or modified functionality
   - Test files should cover: storage operations, API routes, auth workflows, and business logic