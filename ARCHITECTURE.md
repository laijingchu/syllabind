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

Syllabi are the core learning content created by creators. The entire curriculum structure (weeks and steps) is stored as a JSON object in the `content` field, allowing flexible nested structures without requiring additional database tables. Each syllabus can be saved as a draft or published to make it visible in the catalog.

```typescript
{
  id: integer PRIMARY KEY,
  title: string NOT NULL,
  description: string NOT NULL,
  audienceLevel: enum('Beginner', 'Intermediate', 'Advanced'),
  durationWeeks: integer NOT NULL,
  status: enum('draft', 'published') DEFAULT 'draft',
  content: JSONB,                    // Structured as { weeks: Week[] }
  creatorId: integer FK(users.id),
  createdAt: timestamp DEFAULT now()
}
```

#### Enrollments Table

This table tracks which learners are enrolled in which syllabi and their progress through the curriculum. Each enrollment records the current week index and an array of completed step IDs, allowing flexible progress tracking where learners can complete steps in any order within their current week.

```typescript
{
  id: integer PRIMARY KEY,
  userId: integer FK(users.id),
  syllabusId: integer FK(syllabi.id),
  status: enum('in-progress', 'completed') DEFAULT 'in-progress',
  currentWeekIndex: integer DEFAULT 0,
  completedStepIds: JSONB,           // Array of step IDs
  joinedAt: timestamp DEFAULT now()
}
```

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
  id: string;                        // UUID
  type: 'reading' | 'exercise';
  title: string;
  url?: string;                      // For readings
  note?: string;                     // Optional context
  promptText?: string;               // For exercises
  estimatedMinutes?: number;
  mediaType?: 'Book' | 'Youtube video' | 'Blog/Article' | 'Podcast';
}

interface Week {
  index: number;                     // 0-based week number
  title?: string;
  description?: string;
  steps: Step[];
}

interface Syllabus {
  id: string;
  title: string;
  description: string;
  audienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks: number;
  status: 'draft' | 'published';
  weeks: Week[];
  creatorId: string;
}
```

#### User & Progress Types

User and enrollment models represent the people using the platform and their learning progress. The User interface maps to the database users table, while the Enrollment interface represents a learner's current state within a syllabus, tracking which week they're on and which steps they've completed.

```typescript
interface User {
  id: string;
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
  activeSyllabusId: string | null;
  currentWeekIndex: number;
  completedStepIds: string[];
  completedSyllabusIds: string[];
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
  syllabi: Syllabus[];
  enrollment: Enrollment;
  cohorts: Cohort[];
  userSubmissions: Map<stepId, Submission>;
  allSubmissions: Submission[];        // Mock data for creator view
}
```

**Methods:**

The store provides methods organized by functionality. Authentication methods handle login/logout, learner methods manage enrollment and progress, creator methods handle syllabus creation and feedback, and query methods retrieve computed data like progress percentages.

**Authentication:**

Methods for managing user identity, sessions, and profile updates.


- `login(username, password)` - Authenticate user
- `signup(username, email, name, password)` - Create new account
- `logout()` - Clear session
- `toggleCreatorMode()` - Switch between learner/creator roles
- `updateUser(updates)` - Update user profile

**Learner Actions:**

Methods that learners use to interact with syllabi, track their progress, and submit work.

- `enrollInSyllabus(syllabusId)` - Enroll in syllabus
- `markStepComplete(stepId)` - Mark step as done
- `saveExercise(stepId, answer, isShared)` - Submit exercise

**Creator Actions:**

Methods that creators use to build syllabi, organize learners, and provide feedback on submissions.

- `createSyllabus(syllabus)` - Create new syllabus
- `updateSyllabus(id, updates)` - Update existing syllabus
- `createCohort(name, syllabusId, learnerIds)` - Create learner cohort
- `assignLearnerToCohort(learnerId, cohortId)` - Assign learner
- `provideFeedback(submissionId, feedback, grade, rubricUrl)` - Grade submission

**Query Methods:**

Helper methods that compute derived data from the state, like calculating progress percentages or checking completion status.

- `getActiveSyllabus()` - Get current enrolled syllabus
- `isStepCompleted(stepId)` - Check step completion status
- `getProgressForWeek(weekIndex)` - Calculate week progress
- `getOverallProgress()` - Calculate total progress
- `getSubmissionsForStep(stepId)` - Get all submissions for a step

#### React Query

React Query handles communication with the backend API. It provides automatic caching of server responses, preventing unnecessary network requests. The configuration disables automatic refetching to give the Context Store full control over when data updates happen, ensuring the client-side state and server state stay synchronized.

- Configured for API data fetching
- Settings: No auto-refetch, infinite stale time
- Used for server-side data caching

---

## API Endpoints

The backend exposes RESTful API endpoints that the frontend calls to read and modify data. Endpoints are organized by resource type (authentication, syllabi, enrollments) and follow standard HTTP conventions (GET for reading, POST for creating, PUT for updating, DELETE for removing).

### Authentication

Authentication endpoints handle user login/logout through Replit Auth (OAuth) and provide a way to check the current user's session status.


```
POST   /auth/login       - Replit OAuth login
POST   /auth/logout      - Logout & clear session
GET    /auth/me          - Get current authenticated user
```

### Syllabi

These endpoints provide full CRUD (Create, Read, Update, Delete) operations for syllabi. The GET endpoints are public (for browsing), while modification endpoints require authentication and verify that the user is the syllabus creator.

```
GET    /api/syllabi      - List all syllabi
GET    /api/syllabi/:id  - Get single syllabus
POST   /api/syllabi      - Create new syllabus (auth required)
PUT    /api/syllabi/:id  - Update syllabus (auth required)
DELETE /api/syllabi/:id  - Delete syllabus (auth required)
```

### Enrollments

Enrollment endpoints manage learner participation in syllabi. All enrollment operations require authentication since they're specific to the logged-in user. These endpoints handle joining syllabi and tracking progress through the curriculum.

```
GET    /api/enrollments     - Get user's enrollments (auth required)
POST   /api/enrollments     - Enroll in syllabus (auth required)
PUT    /api/enrollments/:id - Update progress (auth required)
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

The application uses Replit Auth (an OAuth provider) to handle user authentication. This means users don't create passwords in Syllabind - instead, they authenticate through Replit's system. Sessions are stored in PostgreSQL for persistence across page refreshes, and protected routes automatically redirect unauthenticated users to the login page.

1. **Landing**: `/welcome` page with signup CTA
2. **OAuth**: Replit Auth via OpenID Connect
3. **Session**: Express-session backed by PostgreSQL
4. **Protection**: `ProtectedRoute` wrapper redirects unauthorized access
5. **Role Toggle**: Users can switch between learner/creator modes

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

**Last Updated:** 2026-01-26
