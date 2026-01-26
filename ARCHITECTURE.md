# Syllabind Architecture Documentation

## Overview

Syllabind is a full-stack learning platform that connects creators who build curated multi-week syllabi with learners who want structured educational experiences.

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite
- UI: Radix UI + TailwindCSS 4
- Backend: Express.js + Node.js
- Database: PostgreSQL + Drizzle ORM
- Auth: Replit Auth (OpenID Connect)

---

## Data Model

The data model consists of four main database tables that store all application data. The design follows a relational structure where users can create syllabi, and other users can enroll in them. Progress tracking is handled through the enrollments table, which stores completed step IDs as a flexible JSON array.

### Database Schema

The database schema defines the structure of data stored in PostgreSQL. Each table represents a core entity in the system: users who interact with the platform, syllabi that contain the learning content, enrollments that track learner progress, and sessions that manage authentication state.

#### Users Table

This table stores all user accounts, whether they're learners or creators. A single user can switch between both roles using the `isCreator` flag. Social links and profile information support creator profiles that showcase their expertise.

```typescript
{
  id: integer PRIMARY KEY,
  replitId: string UNIQUE,           // Replit OAuth identifier
  username: string UNIQUE,
  name: string,
  avatarUrl: string,
  isCreator: boolean DEFAULT false,  // Role flag
  bio: string,
  expertise: string,
  // Social links
  linkedin: string,
  website: string,
  twitter: string,
  threads: string,
  shareProfile: boolean DEFAULT true
}
```

#### Syllabi Table

Syllabi are the core learning content created by creators. The curriculum structure (weeks and steps) is stored in normalized `weeks` and `steps` tables. Each syllabus can be saved as a draft or published to make it visible in the catalog. The table tracks engagement metrics including active and completed student counts. **Note:** `creatorId` references `users.username` (unique) instead of UUID for better logging and readability.

```typescript
{
  id: serial PRIMARY KEY,
  title: text NOT NULL,
  description: text NOT NULL,
  audienceLevel: text NOT NULL,      // 'Beginner', 'Intermediate', 'Advanced'
  durationWeeks: integer NOT NULL,
  status: text DEFAULT 'draft' NOT NULL, // 'draft', 'published'
  creatorId: text FK(users.username) ON UPDATE CASCADE ON DELETE SET NULL,
  createdAt: timestamp DEFAULT now(),
  updatedAt: timestamp DEFAULT now(), // Last modification timestamp
  studentActive: integer DEFAULT 0,   // Number of students currently enrolled (in-progress)
  studentsCompleted: integer DEFAULT 0 // Number of students who completed the syllabus
}
```

#### Weeks Table

This table stores the weekly structure of each syllabus. Each syllabus can have multiple weeks, and each week can contain multiple steps (readings and exercises). Weeks are ordered by their index number, allowing creators to structure their curriculum chronologically.

```typescript
{
  id: serial PRIMARY KEY,
  syllabusId: integer FK(syllabi.id) ON DELETE CASCADE NOT NULL,
  index: integer NOT NULL,               // 1-based week number (1, 2, 3, 4...)
  title: text,                           // Optional week title (e.g., "Foundations")
  description: text                      // Optional weekly summary or objectives
}
```

**Key Features:**
- Cascade delete: When a syllabus is deleted, all its weeks are automatically removed
- Index-based ordering: Weeks are numbered sequentially for easy navigation
- Optional metadata: Titles and descriptions provide context for each week

#### Steps Table

This table stores individual learning activities (readings and exercises) within each week. Steps are ordered by their position within the week, creating a structured learning path. Each step includes metadata like estimated time, author information, and media type to help learners plan their time.

```typescript
{
  id: serial PRIMARY KEY,
  weekId: integer FK(weeks.id) ON DELETE CASCADE NOT NULL,
  position: integer NOT NULL,            // Order within week (1, 2, 3...)
  type: text NOT NULL,                   // 'reading' or 'exercise'
  title: text NOT NULL,

  // Reading-specific fields
  url: text,                             // External resource URL
  note: text,                            // Context or instructions
  author: text,                          // Content author name
  creationDate: text,                    // Publication or creation date
  mediaType: text,                       // 'Book' | 'Youtube video' | 'Blog/Article' | 'Podcast'

  // Exercise-specific fields
  promptText: text,                      // Exercise instructions or questions

  // Common fields
  estimatedMinutes: integer              // Time estimate for completion
}
```

**Key Features:**
- Cascade delete: When a week is deleted, all its steps are automatically removed
- Position-based ordering: Steps are numbered sequentially within each week
- Type differentiation: Readings link to external content, exercises require user input
- Rich metadata: Author, date, and media type provide context for readings
- Time estimation: Helps learners plan their schedule

**Step Types:**
- **Reading:** External content (articles, videos, podcasts, books) with URL and metadata
- **Exercise:** Practice activities with prompts that learners respond to via submissions

#### Enrollments Table

This table tracks which learners (students) are enrolled in which syllabi and their progress through the curriculum. Each enrollment records the current week index. Step completion is tracked in a separate `completed_steps` junction table for efficient querying and analytics. **Note:** `studentId` references `users.username` (unique) instead of UUID for better logging and readability.

```typescript
{
  id: serial PRIMARY KEY,
  studentId: text FK(users.username) ON UPDATE CASCADE ON DELETE CASCADE,
  syllabusId: integer FK(syllabi.id),
  status: text('in-progress', 'completed') DEFAULT 'in-progress',
  currentWeekIndex: integer DEFAULT 1,
  joinedAt: timestamp DEFAULT now()
}
```

#### Completed Steps Table

This junction table tracks which steps each student has completed. It replaces the previous JSONB array approach with a fully normalized structure, enabling efficient queries and analytics. The composite primary key ensures each step can only be marked complete once per enrollment.

```typescript
{
  enrollmentId: integer FK(enrollments.id) ON DELETE CASCADE,
  stepId: integer FK(steps.id) ON DELETE CASCADE,
  completedAt: timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY (enrollmentId, stepId)
}
```

**Indexes:**
- `completed_steps_enrollment_idx` - Fast lookup of all steps completed by a student
- `completed_steps_step_idx` - Fast lookup of all students who completed a specific step
- `completed_steps_completed_at_idx` - Time-based analytics queries

#### Cohorts Table

This table enables grouping learners into cohorts for social learning and collaborative study. Multiple cohorts can exist for a single syllabus (e.g., different semesters, study groups). Cohorts are optional - students can study independently without joining a cohort. **Note:** `syllabusId` FK establishes that cohorts belong to syllabi (one syllabus → many cohorts), NOT the other way around.

```typescript
{
  id: serial PRIMARY KEY,
  name: text NOT NULL,
  syllabusId: integer FK(syllabi.id) ON DELETE CASCADE NOT NULL,
  creatorId: text FK(users.username) ON UPDATE CASCADE ON DELETE SET NULL,
  description: text,
  isActive: boolean DEFAULT true NOT NULL,
  createdAt: timestamp DEFAULT now() NOT NULL
}
```

**Key Features:**
- `syllabusId`: Foreign key to syllabi - one syllabus can have many cohorts
- `creatorId`: Optional owner of the cohort (typically the syllabus creator)
- `isActive`: Allows archiving old cohorts without deletion
- `description`: Optional context (e.g., "Fall 2024 semester", "Weekend study group")

**Indexes:**
- `cohorts_syllabus_idx` - Fast lookup of all cohorts for a syllabus
- `cohorts_creator_idx` - Fast lookup of cohorts created by a user
- `cohorts_active_idx` - Partial index on active cohorts only

#### Cohort Members Table

This junction table tracks which students belong to which cohorts. The composite primary key ensures each student can only be a member of a cohort once. Students can belong to multiple cohorts for different syllabi, and cohort membership is independent from enrollment (students can be enrolled without being in any cohort).

```typescript
{
  cohortId: integer FK(cohorts.id) ON DELETE CASCADE NOT NULL,
  studentId: text FK(users.username) ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,
  joinedAt: timestamp DEFAULT now() NOT NULL,
  role: text DEFAULT 'member' NOT NULL,
  PRIMARY KEY (cohortId, studentId)
}
```

**Key Features:**
- Composite primary key: (cohortId, studentId) prevents duplicate membership
- `role`: Supports future features like cohort moderators ('member', 'moderator', etc.)
- `joinedAt`: Tracks when student joined the cohort
- Cascade deletes: Removing a cohort or user automatically cleans up memberships

**Indexes:**
- `cohort_members_student_idx` - Fast lookup of all cohorts a student belongs to
- `cohort_members_role_idx` - Fast filtering by member role

**Relationship to Enrollments:**
- Enrollments track individual progress (studentId, syllabusId, currentWeekIndex)
- Cohort members track social grouping (cohortId, studentId)
- These are separate: students can be enrolled without being in a cohort
- Queries can JOIN both to show cohort members' progress

#### Sessions Table

This table is required by Replit Auth and Express-session to store active user sessions. When users log in, their session data is stored here and referenced by a session ID cookie in their browser. The `sess` field stores the complete session state including authentication tokens and user information.

```typescript
{
  sid: string PRIMARY KEY,           // Session identifier (stored in cookie)
  sess: JSONB,                       // Session data object (structure below)
  expire: timestamp                  // Session expiration time
}
```

**Session Object Structure (`sess` field):**
```json
{
  "cookie": {
    "originalMaxAge": 604800000,     // 1 week in milliseconds
    "expires": "2026-02-02T...",     // Cookie expiration timestamp
    "httpOnly": true,                // Prevents client-side JS access
    "secure": true,                  // HTTPS only
    "path": "/"
  },
  "passport": {
    "user": {
      // User identity from database
      "id": "uuid",                  // User's database ID
      "replitId": "string",          // Replit OAuth identifier
      "username": "string",          // Username (unique)
      "name": "string",              // Display name
      "avatarUrl": "string",         // Profile picture URL
      "isCreator": boolean,          // Creator role flag

      // OAuth tokens and claims (added by Replit Auth)
      "claims": {                    // OIDC ID token claims
        "sub": "string",             // Subject (Replit user ID)
        "email": "string",           // User email
        "email_verified": boolean,   // Email verification status
        "name": "string",            // Full name
        "nickname": "string",        // Username
        "first_name": "string",
        "last_name": "string",
        "profile_image_url": "string",
        "exp": number,               // Token expiration (Unix timestamp)
        "iat": number,               // Issued at (Unix timestamp)
        ...                          // Additional OIDC claims
      },
      "access_token": "string",      // OAuth 2.0 access token
      "refresh_token": "string",     // OAuth 2.0 refresh token for renewal
      "expires_at": number           // Token expiration time (Unix timestamp)
    }
  }
}
```

**Note:** Passport.js is configured to serialize the entire user object (not just the user ID), so all user data and OAuth tokens are stored in the session for quick access without database queries.

---

### TypeScript Domain Models

These TypeScript interfaces define the shape of data used throughout the client application. They provide type safety and documentation for how data flows between components. While the database stores data in tables, these models represent how that data is structured and used in the React frontend.

#### Core Learning Types

The core learning types define the curriculum structure. A syllabus contains multiple weeks, each week contains multiple steps, and each step is either a reading (with a URL to external content) or an exercise (with a prompt for learners to respond to).


```typescript
interface Step {
  id: number;                        // Changed to integer (serial) for normalized DB
  weekId: number;                    // Foreign key to weeks table
  position: number;                  // Order within week
  type: 'reading' | 'exercise';
  title: string;
  url?: string;                      // For readings
  note?: string;                     // Optional context
  promptText?: string;               // For exercises
  estimatedMinutes?: number;
  author?: string;
  creationDate?: string;
  mediaType?: 'Book' | 'Youtube video' | 'Blog/Article' | 'Podcast';
}

interface Week {
  id: number;                        // Primary key (serial)
  syllabusId: number;                // Foreign key to syllabi table
  index: number;                     // 1-based week number
  title?: string;
  description?: string;
  steps: Step[];
}

interface Syllabus {
  id: number;                        // Changed from string to number (serial)
  title: string;
  description: string;
  audienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks: number;
  status: 'draft' | 'published';
  weeks: Week[];
  creatorId: string;                 // Username (unique) instead of UUID
}
```

#### User & Progress Types

User and enrollment models represent the people using the platform and their learning progress. The User interface maps to the database users table, while the Enrollment interface represents a learner's current state within a syllabus, tracking which week they're on and which steps they've completed.

```typescript
interface User {
  id: string;                        // UUID
  username: string;                  // Unique username (used for foreign keys)
  name: string;
  email?: string;
  isCreator: boolean;
  bio?: string;
  expertise?: string;
  avatarUrl?: string;
  // Social links
  linkedin?: string;
  website?: string;
  twitter?: string;
  threads?: string;
  shareProfile?: boolean;
}

interface Enrollment {
  id?: number;                       // Enrollment ID
  activeSyllabusId: number | null;   // Changed from string to number
  currentWeekIndex: number;          // 1-based
  completedStepIds: number[];        // Changed from string[] to number[]
  completedSyllabusIds: number[];    // Changed from string[] to number[]
}
```

#### Creator Feature Types

These types support creator-specific features like reviewing learner submissions, organizing learners into cohorts (groups), and tracking individual learner profiles. Submissions allow creators to see learner work and provide feedback with grades and rubrics.

```typescript
interface Submission {
  stepId: string;
  answer: string;                    // URL or text
  submittedAt: string;
  isShared: boolean;
  feedback?: string;
  grade?: string;
  rubricUrl?: string;
}

interface Cohort {
  id: string;
  name: string;
  syllabusId: string;
  learnerIds: string[];
}

interface LearnerProfile {
  user: User;
  status: 'in-progress' | 'completed';
  joinedDate: string;
  cohortId?: string;
}
```

---

## UI Architecture

The UI is built as a single-page application (SPA) using React with client-side routing. Pages are organized into three categories: public pages anyone can access, authenticated learner pages, and creator-only pages that require the creator flag. The application uses a component-based architecture with reusable UI primitives.

### Page Structure

The application has 14 main pages organized by access level. Public pages handle marketing and browsing, learner pages provide the learning experience with progress tracking, and creator pages offer content management and analytics tools.



#### Public Pages

These pages are accessible without authentication, allowing visitors to learn about the platform and browse available syllabi before signing up.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/welcome` | `Marketing.tsx` | Landing page with signup CTA |
| `/login` | `Login.tsx` | Authentication entry (signup/login modes) |
| `/catalog` | `Catalog.tsx` | Browse all published syllabi |
| `/syllabus/:id` | `SyllabusOverview.tsx` | Syllabus detail with week breakdown |

#### Learner Pages (Auth Required)

These pages provide the core learning experience. Learners see their dashboard, work through weekly content step-by-step, and manage their profile. These pages require users to be logged in.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Dashboard.tsx` | Home - active syllabus progress or catalog |
| `/syllabus/:id/week/:index` | `WeekView.tsx` | Main learning interface with readings & exercises |
| `/syllabus/:id/completed` | `Completion.tsx` | Celebration screen post-completion |
| `/profile` | `Profile.tsx` | Edit bio, social links, preferences |

#### Creator Pages (Auth + Creator Flag Required)

These pages are only accessible to users who have enabled creator mode. They provide tools for building syllabi, tracking learner progress, managing cohorts, and providing feedback on submissions.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/creator` | `CreatorDashboard.tsx` | List of created syllabi with management |
| `/creator/syllabus/new` | `CreatorEditor.tsx` | Build new syllabus (WYSIWYG editor) |
| `/creator/syllabus/:id/edit` | `CreatorEditor.tsx` | Edit existing syllabus (auto-save) |
| `/creator/syllabus/:id/analytics` | `CreatorAnalytics.tsx` | Learner progress visualization |
| `/creator/syllabus/:id/learners` | `CreatorLearners.tsx` | Learner list, cohorts, submissions |
| `/creator/profile` | `CreatorProfile.tsx` | Creator bio, expertise, social links |

---

### Component Library

The component library is divided into feature components (application-specific) and UI primitives (reusable, generic components). The UI primitives are built on top of Radix UI, providing accessible, unstyled components that are then styled with TailwindCSS.

#### Feature Components

These components are specific to Syllabind's functionality and compose the UI primitives into meaningful application features.


- **`Layout.tsx`**: Main application header
  - Navigation links (Dashboard/Catalog/Creator Studio)
  - User avatar dropdown (Profile, Creator Mode toggle, Logout)
  - Conditional rendering based on auth state

- **`SyllabusCard.tsx`**: Reusable syllabus preview card
  - Displays title, description, level, duration
  - Shows enrolled/completed status
  - CTA button (Enroll/Resume/View)

- **`AvatarUpload.tsx`**: Profile picture upload component
  - Image preview with remove option
  - File upload handling

#### UI Primitives (`client/src/components/ui/`)

These are generic, reusable components that form the building blocks of the application. They're built on Radix UI primitives and styled with TailwindCSS, providing a consistent design system across all pages. The components are organized into logical categories based on their purpose.

**50+ Radix UI-based components organized by category:**

**Form Inputs:**

All the standard input controls needed for forms, including text fields, dropdowns, checkboxes, and more. These components include built-in validation support and accessible labeling.


- `button.tsx` - Button variants (default, outline, ghost, etc.)
- `input.tsx` - Text input field
- `textarea.tsx` - Multi-line text input
- `select.tsx` - Dropdown select
- `combobox.tsx` - Searchable select
- `checkbox.tsx` - Checkbox input
- `radio-group.tsx` - Radio button group
- `switch.tsx` - Toggle switch
- `toggle.tsx` - Toggle button
- `toggle-group.tsx` - Toggle button group
- `input-otp.tsx` - OTP input
- `form.tsx` - Form wrapper with validation

**Layout:**

Components for structuring page content and organizing information into sections, panels, and collapsible areas.

- `card.tsx` - Card container
- `tabs.tsx` - Tabbed interface
- `accordion.tsx` - Collapsible sections
- `collapsible.tsx` - Expandable content
- `separator.tsx` - Horizontal/vertical divider
- `sidebar.tsx` - Sidebar navigation
- `resizable.tsx` - Resizable panels
- `sheet.tsx` - Slide-out panel
- `aspect-ratio.tsx` - Aspect ratio container
- `scroll-area.tsx` - Styled scrollable area

**Overlays:**

Components that appear on top of other content, like modals, popovers, and tooltips. These handle focus management and accessibility for layered UI elements.

- `dialog.tsx` - Modal dialog
- `drawer.tsx` - Drawer dialog
- `alert-dialog.tsx` - Confirmation dialog
- `popover.tsx` - Popover overlay
- `hover-card.tsx` - Hover tooltip card
- `tooltip.tsx` - Simple tooltip
- `dropdown-menu.tsx` - Dropdown menu
- `context-menu.tsx` - Right-click menu
- `menubar.tsx` - Menu bar

**Navigation:**

Components for helping users move through the application, including menus, breadcrumbs, and pagination controls.

- `navigation-menu.tsx` - Navigation menu
- `breadcrumb.tsx` - Breadcrumb navigation
- `pagination.tsx` - Pagination controls

**Data Display:**

Components for presenting data and information to users, including tables, charts, progress indicators, and loading states.

- `table.tsx` - Table component
- `badge.tsx` - Status badge
- `avatar.tsx` - User avatar
- `progress.tsx` - Progress bar
- `skeleton.tsx` - Loading skeleton
- `spinner.tsx` - Loading spinner
- `empty.tsx` - Empty state placeholder
- `chart.tsx` - Recharts wrapper

**Feedback:**

Components for communicating system status and responses to user actions through notifications and alerts.

- `toast.tsx` - Toast notification
- `sonner.tsx` - Sonner toast integration
- `alert.tsx` - Alert message

**Rich Content:**

Specialized components for handling complex content like rich text editing and date selection.

- `rich-text-editor.tsx` - TipTap editor integration
- `calendar.tsx` - Date picker calendar

**Utility:**

Small helper components that provide supporting functionality for other components, like labels and keyboard shortcut displays.

- `label.tsx` - Form label
- `field.tsx` - Form field wrapper
- `item.tsx` - Generic item component
- `kbd.tsx` - Keyboard shortcut display

---

### State Management

The application uses React Context API for global state management, providing a centralized store that all components can access. This store holds user authentication state, the current user's enrollment data, available syllabi, and methods to modify this state. React Query complements this by handling server data fetching and caching.

#### Context Store (`client/src/lib/store.tsx`)

The Context Store is the central state management solution. It provides a single source of truth for application state and exposes methods that components can call to update that state. All state changes flow through this store, making data flow predictable and easy to debug.

**State:**
```typescript
{
  user: User | null;
  isAuthenticated: boolean;
  syllabi: Syllabus[];                 // Fetched from /api/syllabi
  enrollment: Enrollment | null;       // Fetched from /api/enrollments
  completedStepIds: number[];          // Fetched from /api/enrollments/:id/completed-steps
  submissions: Submission[];           // Fetched from /api/enrollments/:id/submissions
  syllabiLoading: boolean;             // Loading state for syllabi
  enrollmentLoading: boolean;          // Loading state for enrollments
}
```

**Methods:**

All methods now make real API calls to the backend. The store provides methods organized by functionality.

**Data Fetching:**
- `refreshSyllabi()` - Fetch syllabi from `/api/syllabi`
- `refreshEnrollments()` - Fetch enrollments from `/api/enrollments`

**Authentication:**
- `toggleCreatorMode()` - POST to `/api/users/me/toggle-creator`
- `updateUser(updates)` - PUT to `/api/users/me`

**Learner Actions:**
- `enrollInSyllabus(syllabusId)` - POST to `/api/enrollments`
- `markStepComplete(stepId)` - POST to `/api/enrollments/:id/steps/:id/complete`
- `markStepIncomplete(stepId)` - DELETE to `/api/enrollments/:id/steps/:id/complete`
- `saveExercise(stepId, answer, isShared)` - POST to `/api/submissions`
- `completeActiveSyllabus()` - PUT to `/api/enrollments/:id` with status: 'completed'

**Creator Actions:**
- `createSyllabus(syllabus)` - POST to `/api/syllabi`
- `updateSyllabus(syllabus)` - PUT to `/api/syllabi/:id`
- `getLearnersForSyllabus(syllabusId)` - GET from `/api/syllabi/:id/learners`

**Query Methods:**
- `getActiveSyllabus()` - Get current enrolled syllabus from local state
- `getSyllabusById(id)` - Get syllabus from local state
- `isStepCompleted(stepId)` - Check step completion in local state
- `getProgressForWeek(syllabusId, weekIndex)` - Calculate week progress
- `getOverallProgress(syllabusId)` - Calculate total progress
- `getSubmission(stepId)` - Get submission from local state

#### React Query

React Query handles authentication data fetching. It provides automatic caching of the `/api/auth/me` endpoint with a 5-minute stale time.

- Used for authentication state management via `useAuth` hook
- Automatic cache invalidation on login/register
- Credentials included for cookie-based sessions

---

## API Endpoints

The backend exposes RESTful API endpoints organized by resource type. All endpoints follow REST conventions with proper authentication and authorization checks.

### Authentication Endpoints

```
POST   /api/auth/register   - Register with email/password
POST   /api/auth/login      - Login with email/password
GET    /api/auth/me         - Get current authenticated user
POST   /api/auth/logout     - Logout and destroy session
GET    /api/auth/google     - Google OAuth login
GET    /api/auth/apple      - Apple OAuth login
```

### User Management Endpoints

```
GET    /api/users/:username         - Get user profile (public)
PUT    /api/users/me                - Update own profile (auth)
POST   /api/users/me/toggle-creator - Toggle creator mode (auth)
```

### Syllabus Endpoints

**Public:**
```
GET    /api/syllabi      - List published syllabi
GET    /api/syllabi/:id  - Get syllabus with content
```

**Protected (Auth + Creator + Ownership):**
```
POST   /api/syllabi             - Create syllabus
PUT    /api/syllabi/:id         - Update syllabus
DELETE /api/syllabi/:id         - Delete syllabus
POST   /api/syllabi/:id/publish - Publish/unpublish syllabus
GET    /api/creator/syllabi     - Get creator's syllabi (including drafts)
GET    /api/syllabi/:id/learners - Get learners for syllabus
```

### Enrollment Endpoints (Auth Required)

```
GET    /api/enrollments     - Get user's enrollments
POST   /api/enrollments     - Enroll in syllabus
PUT    /api/enrollments/:id - Update enrollment progress
```

### Progress Tracking Endpoints (Auth Required)

```
POST   /api/enrollments/:eId/steps/:sId/complete - Mark step complete
DELETE /api/enrollments/:eId/steps/:sId/complete - Mark step incomplete
GET    /api/enrollments/:eId/completed-steps     - Get completed steps
```

### Submission Endpoints (Auth Required)

```
POST   /api/submissions                - Create submission
GET    /api/enrollments/:id/submissions - Get enrollment submissions
PUT    /api/submissions/:id/feedback    - Provide feedback (creator only)
```

### Analytics Endpoints (Auth + Creator + Ownership)

```
GET    /api/syllabi/:id/analytics/completion-rates - Step completion rates
GET    /api/syllabi/:id/analytics/completion-times - Average completion times
```

---

## Key Features

The application provides distinct experiences for learners and creators. Learners get a structured, guided learning path with progress tracking, while creators get tools to build content, monitor engagement, and provide feedback. The UI/UX layer adds polish through animations, responsive design, and thoughtful feedback.

### Learner Experience

The learner journey focuses on structured, progressive learning. Learners browse a catalog of syllabi, enroll in ones that interest them, and work through content week by week. The system tracks their progress and celebrates milestones to maintain engagement.


- **Browse & Enroll**: Discover published syllabi in catalog
- **Week-by-week Progress**: Structured learning path with locked weeks
- **Step Tracking**: Mark readings/exercises as complete
- **Exercise Submission**: Submit URLs or text answers
- **Profile Sharing**: Opt-in to be featured on creator's learner list
- **Completion Celebration**: Confetti animation + completion badge

### Creator Experience

Creators get a full content management system for building and managing syllabi. The experience emphasizes ease of use (auto-save, drag-and-drop), insight into learner progress (analytics), and tools for providing personalized feedback.

- **Rich Editor**: TipTap-powered syllabus builder with drag-and-drop
- **Auto-save**: Drafts save automatically
- **Publish Control**: Draft vs. Published status
- **Analytics Dashboard**: Learner progress visualization with charts
- **Cohort Management**: Group learners into cohorts
- **Feedback System**: Grade submissions with rubrics
- **Creator Profile**: Showcase expertise and social links

### UI/UX Features

These features enhance the user experience across the application, providing visual feedback, responsiveness, and polish that make the platform feel professional and engaging.

- Framer Motion animations for smooth transitions
- Canvas Confetti for celebrations
- Progress bars and percentage displays
- Responsive design (mobile/desktop)
- Toast notifications for user actions
- Loading skeletons for async content

---

## Authentication Flow

The application uses a custom authentication system with multiple providers (Email/Password, Google OAuth, Apple OAuth). Sessions are stored in PostgreSQL for persistence and scalability.

### Authentication Providers

1. **Email/Password**: Built-in authentication with bcrypt password hashing
2. **Google OAuth**: Social login via Google
3. **Apple OAuth**: Social login via Apple ID
4. **Replit Auth** (legacy): OpenID Connect for Replit environment

### Session Management

- **Storage**: PostgreSQL-backed sessions via `connect-pg-simple`
- **TTL**: 7 days
- **Cookie Security**: HttpOnly, Secure (production), SameSite=lax
- **Session Secret**: Environment variable `SESSION_SECRET`

### Auth Middleware: `isAuthenticated`

Located in `/server/auth/index.ts`, this middleware:
1. Checks for `req.session.userId`
2. Fetches user from database
3. Attaches user (without password) to `req.user`
4. Returns 401 if not authenticated

### Authorization Layers

1. **Authentication** - `isAuthenticated` middleware (401 if not logged in)
2. **Creator Check** - Verifies `req.user.isCreator === true` (403 if not creator)
3. **Ownership Check** - Verifies user owns the resource (403 if not owner)

### Protected Routes

All routes except public catalog/syllabus viewing require authentication. Creator-only routes additionally check `isCreator` flag. Resource modification routes verify ownership (username matching).

### Auth Routes

- `POST /api/auth/register` - Email/password registration
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Destroy session
- OAuth routes for Google and Apple in respective auth modules

---

## File Structure

The codebase is organized into three main directories: `client` (React frontend), `server` (Express backend), and `shared` (code used by both). This monorepo structure keeps related code together while maintaining clear boundaries between frontend and backend concerns.

```
/workspace/
├── client/src/
│   ├── main.tsx              - React entry point
│   ├── App.tsx               - Router + auth wrapper
│   ├── pages/                - 14 page components (~3,100 lines)
│   ├── components/
│   │   ├── Layout.tsx        - Main header
│   │   ├── SyllabusCard.tsx  - Syllabus preview
│   │   ├── AvatarUpload.tsx  - Image uploader
│   │   └── ui/               - 50+ UI primitives (~5,950 lines)
│   ├── hooks/                - Custom React hooks
│   └── lib/
│       ├── store.tsx         - Context API state
│       ├── types.ts          - TypeScript interfaces
│       ├── queryClient.ts    - React Query config
│       └── utils.ts          - Utility functions
│
├── server/
│   ├── index.ts              - Express server
│   ├── routes.ts             - API endpoints
│   ├── db.ts                 - Drizzle connection
│   ├── storage.ts            - Database operations
│   └── replit_integrations/  - Replit Auth setup
│
├── shared/
│   ├── schema.ts             - Drizzle schemas + Zod validation
│   └── models/auth.ts        - Auth models
│
└── Configuration files
```

---

## Dependencies Summary

The application uses modern, well-maintained libraries and frameworks. The frontend stack emphasizes developer experience (TypeScript, Vite) and user experience (React 19, Radix UI for accessibility, Framer Motion for animations). The backend uses proven tools for Node.js web applications, with Drizzle ORM providing type-safe database access.

**Frontend:**
- React 19, TypeScript 5.6.3, Vite
- Radix UI (40+ component packages)
- TailwindCSS 4, Framer Motion
- TanStack React Query, Wouter (routing)
- TipTap (rich text), Lucide (icons)

**Backend:**
- Express 4, Node.js, TypeScript
- Drizzle ORM, PostgreSQL
- Passport.js, Replit Auth
- Express-session, Connect-pg-simple

---

## Database Migration History

### Username-Based Foreign Keys Migration (2026-01-26)

**Migration:** `migrations/manual_username_migration.sql`

**Objective:** Replace UUID-based foreign keys with username-based foreign keys for improved logging, debugging, and readability across the application.

**Changes Made:**

1. **Syllabi Table:**
   - Changed `creator_id` column type from `varchar(UUID)` to `text`
   - Updated existing data: converted UUIDs to usernames
   - Replaced foreign key constraint: `syllabi_creator_id_users_id_fk` → `syllabi_creator_id_users_username_fk`
   - Added cascading behavior: `ON UPDATE CASCADE ON DELETE SET NULL`

2. **Enrollments Table:**
   - Renamed column: `user_id` → `student_id` (better semantic clarity)
   - Changed `student_id` column type from `varchar(UUID)` to `text`
   - Updated existing data: converted UUIDs to usernames
   - Replaced foreign key constraint: `enrollments_user_id_users_id_fk` → `enrollments_student_id_users_username_fk`
   - Added cascading behavior: `ON UPDATE CASCADE ON DELETE CASCADE`

**Benefits:**
- **Improved Logging:** Database logs now show readable usernames instead of UUIDs
- **Better Debugging:** Easier to trace user actions and identify records
- **Data Integrity:** Cascade updates automatically update foreign keys when username changes
- **Semantic Clarity:** `student_id` better represents the learner role in enrollments

**Application Code Updates:**
- Updated `shared/schema.ts` to reflect new column types and foreign key references
- Updated `server/storage.ts` to use `studentId` instead of `userId` in enrollment methods
- Updated `server/routes.ts` to use `username` for authorization checks and enrollment creation
- Updated `client/src/lib/types.ts` to add `username` field to User interface

**Migration Execution:**
```bash
psql "$DATABASE_URL" -f migrations/manual_username_migration.sql
```

### JSONB to Normalized Tables Migration (2026-01-26)

**Migration:** `server/migrate-jsonb-to-normalized.ts`

**Objective:** Migrate syllabus content from JSONB storage to normalized relational tables for better query performance and data integrity.

**Changes Made:**
- Created `weeks` table with foreign key to `syllabi.id`
- Created `steps` table with foreign key to `weeks.id`
- Migrated all existing syllabus content from `syllabi.content` JSONB field to normalized tables
- Step IDs changed from string UUIDs to integer serial primary keys
- Removed `content` JSONB field from `syllabi` table (2026-01-26)

### Completion Tracking Normalization (2026-01-26)

**Migration:** `migrations/0001_normalize_completed_steps.sql`

**Objective:** Replace JSONB array storage with normalized junction table for step completion tracking.

**Changes Made:**
1. **Created `completed_steps` Junction Table:**
   - Composite primary key: (enrollment_id, step_id)
   - Tracks completion timestamp for analytics
   - Cascade deletes on enrollment/step deletion
   - Indexes on enrollment_id, step_id, and completed_at

2. **Removed JSONB Column:**
   - Dropped `enrollments.completed_step_ids` JSONB column
   - Migrated existing completion data to `completed_steps` table

3. **New API Endpoints:**
   - `POST /api/enrollments/:id/steps/:stepId/complete` - Mark step complete
   - `DELETE /api/enrollments/:id/steps/:stepId/complete` - Unmark step
   - `GET /api/enrollments/:id/completed-steps` - Get completed steps
   - `GET /api/syllabi/:id/analytics/completion-rates` - Step completion analytics
   - `GET /api/syllabi/:id/analytics/completion-times` - Average completion times

**Benefits:**
- **Efficient Queries:** Direct lookups instead of JSONB array scans
- **Analytics:** Track completion timestamps and patterns
- **Scalability:** Indexed queries scale to large datasets
- **Flexibility:** Easy to add completion metadata (attempts, scores, etc.)

**Final JSONB Status:**
- Only 1 JSONB column remains: `sessions.sess` (required by express-session)
- All application data fully normalized ✅

---

**Last Updated:** 2026-01-26 21:45:00 UTC
