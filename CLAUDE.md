# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Syllabind is a full-stack learning platform connecting curators who build curated multi-week binders with readers seeking structured educational experiences.

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
npm run dev              # Server on port 3000 (default)
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
- `binders.curator_id` → `users.username` (with CASCADE updates, SET NULL on delete)
- `enrollments.reader_id` → `users.username` (with CASCADE updates and deletes)
- `cohorts.curator_id` → `users.username`
- `cohort_members.reader_id` → `users.username`

**Key Tables:**
1. **users** - User accounts with curator flag, profile info, social links
2. **binders** - Learning content metadata (title, description, status, curator)
3. **weeks** - Weekly structure within each binder (normalized)
4. **steps** - Individual learning activities (readings/exercises) within weeks (normalized)
5. **enrollments** - Reader participation in binders with progress tracking
6. **completed_steps** - Junction table tracking step completion (replaces JSONB arrays)
7. **submissions** - Reader exercise submissions with curator feedback
8. **cohorts** - Groups of readers for social learning
9. **cohort_members** - Junction table for cohort membership
10. **sessions** - Express-session storage (required for auth)

**JSONB Usage:** The schema is fully normalized. Only `sessions.sess` uses JSONB (required by express-session).

### Frontend State Management

**Context Store (`client/src/lib/store.tsx`):**
- Central state management using React Context API
- Provides user auth state, enrollment data, binders list
- Methods for login/logout, enrollment, progress tracking, and curator actions

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
// Curator authorization example
const username = (req.user as any).username;
const binder = await storage.getBinder(id);
if (binder.curatorId !== username) {
  return res.status(403).json({ error: "Forbidden" });
}
```

**ID Types:**
- Binders, enrollments, steps, weeks: `integer` (serial primary keys)
- Users: `varchar` (UUID)
- Foreign keys to users: `text` (username)

### Component Organization

**Pages:** 14 main pages in `client/src/pages/`
- Public: Marketing, Login, Catalog, BinderOverview
- Reader: Dashboard, WeekView, Completion, Profile
- Curator: CuratorDashboard, BinderEditor, BinderAnalytics, BinderReaders, CuratorProfile

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
   - Migrated binder content from JSONB to `weeks` and `steps` tables
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

### Curator vs Reader Roles

- Users toggle between roles via `isCurator` flag
- Same user can be both curator and reader
- Curator routes check authorization using `username` matching
- Reader enrollment tracks progress per user per binder

## Common Development Workflows

### Seeding the Database

After pushing the schema or resetting the database, populate it with test data:

```bash
npm run db:seed
```

**What gets created:**
- 1 curator account (janesmith)
- 5 reader accounts (various enrollment states)
- 2 published binders (Digital Minimalism, Systems Thinking 101)
- 5 enrollments with realistic progress
- Multiple completed steps for testing

**All test accounts use password:** `password123`

See `docs/SEEDING_GUIDE.md` for detailed documentation on test accounts, data structure, and customization options.

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
6. Add authorization checks for curator-only actions

## Important Notes

### Sessions Table

The `sessions` table is **mandatory** for authentication. Do not drop or modify it. It's required by express-session and Replit Auth integration.

### Foreign Key Cascading

The schema uses cascading deletes and updates:
- Deleting a binder cascades to weeks, steps, enrollments, submissions, completed_steps
- Deleting a user cascades to enrollments, submissions, cohort_members
- Updating a username cascades to all foreign key references

### Step IDs

Step IDs are integers (serial), not UUIDs. Historical migrations changed this from string UUIDs. When working with steps, use `parseInt()` on route parameters.

### Port Configuration

The server **must** run on the port specified in `process.env.PORT` (default 3000). The single port serves both API and client.

### Development vs Production

- **Development:** Vite dev server proxies to Express backend
- **Production:** Express serves static files from `dist/public/`
- Vite setup is conditional on `NODE_ENV`

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - development | production
- Authentication provider credentials (depending on provider used)

## Code Style Notes

- TypeScript strict mode enabled
- Use Zod schemas for validation at API boundaries
- Prefer async/await over promises
- Use Drizzle ORM query builder (not raw SQL)
- Component props destructuring at function signature
- TailwindCSS utility classes for styling (no CSS modules)

### Semantic Class Names

Page sections include semantic class names alongside Tailwind utilities for easy identification in prompts and debugging. The semantic name comes first, followed by Tailwind utilities.

**Pattern:**
```tsx
<div className="binder-metadata flex flex-wrap gap-6 text-sm">
  <div className="metadata-duration flex items-center gap-2">...</div>
  <div className="metadata-steps flex items-center gap-2">...</div>
</div>
```

**BinderOverview semantic classes:**
- `preview-banner` - Draft preview warning
- `binder-header` - Title, badge, description
- `binder-metadata` - Duration/steps/date row
  - `metadata-duration`, `metadata-steps`, `metadata-date`
- `binder-section` - Week accordion
- `classmates-section` - Reader avatars
  - `classmates-header`, `classmates-grid`, `classmates-group`, `classmates-avatars`
- `enrollment-sidebar` - Sticky CTA card
  - `enrollment-card`, `enrollment-cta`, `enrollment-status`, `enrollment-visibility`
- `curator-card` - Curator profile
  - `curator-info`

### Reusable Section Components

Located in `client/src/components/sections/`:
- `PageHeader` - Page title with optional back button and actions
- `EmptyState` - Empty state display with icon and action
- `SearchBar` - Search input with count display

Use for patterns repeated across multiple pages.

### Naming Conventions

- The branded term for a course is "Binder" (singular) / "Binders" (plural)
- The database table is named `binders` (PostgreSQL), and the Drizzle ORM export is `binders`
- Content creators are called "curators", content consumers are called "readers"
- The curator dashboard is called "Binder Builder"

## Instructions
1. Always update `architecture.md` after any non-trivial change.
2. In databases, Avoid the use of JSONB Column and use normalized schema by default. Explicitly ask for permission if JSONB is determined to be a superior solution for a given problem.
3. Keep commented out dev notes consolidated and readable. Do not spell out entire thought process.
4. No need to keep asking for permission for reading files or running commands
5. **Design System:**
   - Whenever a new UI component is created or an existing unused component is first used in the app, add a corresponding documentation page to the design system site (`client/src/pages/design-system/`). Follow the existing page template: description, when to use, live demo, states, design tokens, code snippet, accessibility notes, and usage in the product.
   - **Single source of truth:** The design system is the centralized control center for the entire Syllabind frontend. All UI components (`client/src/components/ui/`) and components (`client/src/components/` + pages) must use shared design tokens, component variants, and patterns defined in the design system. When modifying a component's default styles, variants, or behavior, the change must be made in the component source file itself — not overridden per-page. This ensures that tweaking an element in the design system automatically applies the same change across the entire platform. Never duplicate styling decisions; always trace visual choices back to tokens or component defaults.
6. **Testing Protocol:**
   - After making any non-trivial change to backend code, run `npm test`
   - If tests fail, fix the code and re-run tests until they pass
   - Always write or update tests for new features or modified functionality
   - Test files should cover: storage operations, API routes, auth workflows, and business logic