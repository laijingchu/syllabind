# Syllabind

## Overview

Syllabind is a full-stack learning platform that connects content curators who build multi-week syllabinds with learners seeking structured educational experiences. The platform emphasizes a calm, focused approach to learning—one syllabind at a time.

**Core Purpose:** Transform scattered online resources (articles, videos, podcasts) into cohesive 4-week learning journeys that learners can actually complete.

**Key User Roles:**
- **Learners** - Enroll in syllabinds, track progress week-by-week, complete readings and exercises
- **Creators/Curators** - Build and publish syllabinds, view analytics, manage learner cohorts

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 19 with TypeScript, bundled via Vite
- **Routing:** Wouter (lightweight React router)
- **State Management:** React Query for server state, React Context for local app state
- **UI Components:** Radix UI primitives with shadcn/ui component library
- **Styling:** TailwindCSS 4 with custom CSS variables for theming (calm, warm color palette)
- **Rich Text:** TipTap editor for content creation

**Key Design Decisions:**
- Component library uses path aliases (`@/components`, `@/lib`) for clean imports
- Shared types between client and server via `@shared` path alias
- Mock data layer (`client/src/lib/mockData.ts`) enables frontend development independent of backend

### Backend Architecture
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript (ESM modules)
- **API Style:** RESTful JSON endpoints under `/api/*`
- **Build:** esbuild for production bundling, tsx for development

**Key Design Decisions:**
- Single entry point (`server/index.ts`) registers routes and serves static files
- Storage layer abstraction (`IStorage` interface) separates data access from business logic
- Vite dev server middleware integrated for hot module replacement during development

### Data Storage
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM with drizzle-kit for migrations
- **Schema Location:** `shared/schema.ts` (shared between client types and server)

**Core Tables:**
- `users` - User profiles with creator flag and social links
- `syllabi` - Syllabinds: course content with weeks/steps structure
- `enrollments` - Learner progress tracking per syllabind
- `sessions` - Required for Replit Auth session management

### Authentication
- **Provider:** Replit Auth (OpenID Connect)
- **Session Storage:** PostgreSQL via connect-pg-simple
- **Implementation:** Passport.js with custom OIDC strategy

**Key Files:**
- `server/replit_integrations/auth/` - Auth setup, routes, and user storage
- Session table must exist in database for auth to function

## External Dependencies

### Third-Party Services
- **Replit Auth** - Primary authentication provider via OIDC
- **PostgreSQL** - Database (provisioned via Replit)

### Key npm Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Server state management
- `@radix-ui/*` - Accessible UI primitives
- `@tiptap/*` - Rich text editor
- `passport` / `openid-client` - Authentication
- `express-session` / `connect-pg-simple` - Session management
- `recharts` - Analytics charts
- `canvas-confetti` - Completion celebrations
- `framer-motion` - Animations

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `ISSUER_URL` - Replit OIDC issuer (defaults to https://replit.com/oidc)
- `REPL_ID` - Replit environment identifier