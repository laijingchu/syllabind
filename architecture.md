# Syllabind Architecture Documentation

## Overview

Syllabind is a full-stack learning platform that connects curators who build curated multi-week binders with readers who want structured educational experiences.

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite
- UI: Radix UI + TailwindCSS 4
- Backend: Express.js + Node.js
- Database: PostgreSQL + Drizzle ORM
- Auth: Custom authentication with Passport.js (Replit Auth, email/password, Google OAuth, Apple OAuth)
- Analytics: PostHog (autocapture + custom events)

---

## Data Model

The data model uses a fully normalized relational schema. Users can create binders, and other users can enroll in them. Progress tracking is handled through the `completed_steps` junction table (normalized from a previous JSONB design).

### Database Schema

The database schema defines the structure of data stored in PostgreSQL. Each table represents a core entity in the system: users who interact with the platform, binders that contain the learning content, enrollments that track reader progress, and sessions that manage authentication state.

#### Users Table

This table stores all user accounts, whether they're readers or curators. A single user can switch between both roles using the `isCurator` flag. Social links and profile information support curator profiles that showcase their expertise.

```typescript
{
  id: integer PRIMARY KEY,
  replitId: string UNIQUE,           // Replit OAuth identifier
  username: string UNIQUE,
  name: string,
  avatarUrl: string,
  isCurator: boolean DEFAULT false,  // Role flag
  bio: string,
  expertise: string,
  profileTitle: string,                          // LinkedIn-style headline (e.g. "Product Designer at Acme")
  // Social links
  linkedin: string,
  website: string,
  twitter: string,
  threads: string,
  schedulingUrl: string,                        // Calendly/Cal.com link (shown to Pro readers)
  shareProfile: boolean DEFAULT true,
  // Subscription & Credits
  stripeCustomerId: string UNIQUE,              // Stripe customer ID
  subscriptionStatus: string DEFAULT 'free',    // 'free' | 'pro' | 'past_due'
  subscriptionTier: text DEFAULT 'free',        // 'free' | 'pro_monthly' | 'pro_annual' | 'lifetime'
  creditBalance: integer DEFAULT 0,             // Current credit balance
  creditsGrantedAt: timestamp,                  // Deduplication for monthly credit grants
  // Legacy (deprecated — kept for backwards compat, no longer written to)
  generationCount: integer DEFAULT 0,
  lastGeneratedAt: timestamp,
}
```

#### Binders Table (DB: `binders`)

Binders are the core learning content created by curators. The binder structure (weeks and steps) is stored in normalized `weeks` and `steps` tables. Each binder can be saved as a draft or published to make it visible in the catalog. The table tracks engagement metrics including active and completed reader counts. **Note:** `curatorId` references `users.username` (unique) instead of UUID for better logging and readability.

```typescript
{
  id: serial PRIMARY KEY,
  title: text NOT NULL,
  description: text NOT NULL,
  audienceLevel: text NOT NULL,      // 'Beginner', 'Intermediate', 'Advanced'
  durationWeeks: integer NOT NULL,
  status: text DEFAULT 'draft' NOT NULL, // 'draft', 'pending_review', 'published'
  curatorId: text FK(users.username) ON UPDATE CASCADE ON DELETE SET NULL,
  createdAt: timestamp DEFAULT now(),
  updatedAt: timestamp DEFAULT now(), // Last modification timestamp
  submittedAt: timestamp,            // When curator submitted for review
  reviewNote: text,                  // Admin feedback on rejection (cleared on resubmit)
  readerActive: integer DEFAULT 0,   // Number of readers currently enrolled (in-progress)
  readersCompleted: integer DEFAULT 0, // Number of readers who completed the binder
  showSchedulingLink: boolean DEFAULT true, // Per-binder toggle for "Book a Call" button visibility
  mediaPreference: text DEFAULT 'auto',   // Audio/video materials: 'auto', 'yes', 'no'
  isDemo: boolean DEFAULT false,          // Admin-assignable demo content (shown to signed-out visitors)
  isAiGenerated: boolean DEFAULT false,   // Distinguishes AI-generated vs manually-created binders (for free-tier limits)
}
```

**Binder Approval Workflow:**
```
draft ──(curator submits public)──> pending_review ──(admin approves)──> published
  ^                                      │                                    │
  │                                      │ (admin rejects with feedback)      │
  └──────────────────────────────────────┘                                    │
  ^                                                                           │
  │                             (curator unpublishes)                         │
  └───────────────────────────────────────────────────────────────────────────┘

draft ──(curator publishes unlisted/private)──> published (direct, no review)
```
- **Visibility-aware review**: Only `public` visibility requires admin review for non-admin curators. `unlisted` and `private` binders publish directly (they don't appear in the catalog).
- Non-admin curators submitting as `public` get `pending_review` status with a confirmation modal (checkboxes for domain expertise and content vetting)
- Admins can approve (→ `published`) or reject with feedback (→ `draft` with `reviewNote`)
- Admins bypass the review gate and can publish directly for all visibilities
- Pending binders do not appear in the catalog (`searchCatalog` filters `status='published'`)
- The `PUT /api/binders/:id` endpoint strips `status` from non-admin updates to prevent bypassing the review workflow

**Indexes:**
- `binders_curator_id_idx` - Curator dashboard: lookup binders by curator
- `binders_status_idx` - Catalog page: filter published binders
- `binders_pending_review_idx` - Admin review queue: partial index on `status='pending_review'`

#### Review Notification System

Uses a timestamp-comparison approach (no notifications table). Two columns drive the logic:
- `binders.reviewed_at` — set when admin approves or rejects a binder
- `users.notifications_acked_at` — set when user clicks dismiss/mark-as-read

**Curator unread**: any owned binder where `reviewed_at > notifications_acked_at` (or `reviewed_at IS NOT NULL` when `notifications_acked_at IS NULL`). Items include binder id, title, and type (`approved`/`rejected`).

**Admin unread**: count of binders where `status = 'pending_review'` AND (`submitted_at > notifications_acked_at` OR `notifications_acked_at IS NULL`).

**API endpoints:**
- `GET /api/notifications/status` — returns `{ hasUnread, pendingCount, items[] }`
- `POST /api/notifications/acknowledge` — sets `notifications_acked_at = now()` on the current user

**Frontend:**
- Red dot on "Curator Studio" nav link (all users with unread notifications)
- Admin toggle bar in Curator Studio has three tabs: My Binders / Others / Review Queue
- Red dot on "Review Queue" tab when `pendingReviewCount > 0`
- Review queue UI (approve/reject with feedback) rendered inline in Curator Studio
- Green "Approved and published!" banner on binder cards in Curator Studio
- "Dismiss" button in Curator Studio to acknowledge and clear notifications
- "Mark all as read" button in Review Queue tab

#### Weeks Table

This table stores the weekly structure of each binder. Each binder can have multiple weeks, and each week can contain multiple steps (readings and exercises). Weeks are ordered by their index number, allowing curators to structure their binder chronologically.

```typescript
{
  id: serial PRIMARY KEY,
  binderId: integer FK(binders.id) ON DELETE CASCADE NOT NULL,
  index: integer NOT NULL,               // 1-based week number (1, 2, 3, 4...)
  title: text,                           // Optional week title (e.g., "Foundations")
  description: text                      // Optional weekly summary or objectives
}
```

**Key Features:**
- Cascade delete: When a binder is deleted, all its weeks are automatically removed
- Index-based ordering: Weeks are numbered sequentially for easy navigation
- Optional metadata: Titles and descriptions provide context for each week

**Indexes:**
- `weeks_binder_id_idx` - Every binder view joins weeks by binder_id

#### Steps Table

This table stores individual learning activities (readings and exercises) within each week. Steps are ordered by their position within the week, creating a structured learning path. Each step includes metadata like estimated time, author information, and media type to help readers plan their time.

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
- Time estimation: Helps readers plan their schedule

**Step Types:**
- **Reading:** External content (articles, videos, podcasts, books) with URL and metadata
- **Exercise:** Practice activities with prompts that readers respond to via submissions

**Indexes:**
- `steps_week_id_idx` - Every binder view joins steps by week_id

#### Enrollments Table

This table tracks which readers are enrolled in which binders and their progress through the binder. Each enrollment records the current week index. Step completion is tracked in a separate `completed_steps` junction table for efficient querying and analytics. **Note:** `readerId` references `users.username` (unique) instead of UUID for better logging and readability.

```typescript
{
  id: serial PRIMARY KEY,
  readerId: text FK(users.username) ON UPDATE CASCADE ON DELETE CASCADE,
  binderId: integer FK(binders.id),
  status: text('in-progress', 'completed', 'dropped') DEFAULT 'in-progress',
  currentWeekIndex: integer DEFAULT 1,
  shareProfile: boolean DEFAULT false,   // Per-enrollment classmates visibility
  joinedAt: timestamp DEFAULT now()
}
```

**Enrollment Status Values:**
- `in-progress`: User is actively working on this binder (only one per user)
- `completed`: User finished all content in this binder
- `dropped`: User switched to a different binder (automatically set when enrolling in new binder)

**Indexes:**
- `enrollments_reader_binder_idx` (UNIQUE) - Enforces one enrollment per reader per binder + fast lookup
- `enrollments_reader_id_idx` - Reader dashboard: lookup enrollments by reader
- `enrollments_binder_id_idx` - Analytics, classmates, and reader lists by binder

#### Completed Steps Table

This junction table tracks which steps each reader has completed. It replaces the previous JSONB array approach with a fully normalized structure, enabling efficient queries and analytics. The composite primary key ensures each step can only be marked complete once per enrollment.

```typescript
{
  enrollmentId: integer FK(enrollments.id) ON DELETE CASCADE,
  stepId: integer FK(steps.id) ON DELETE CASCADE,
  completedAt: timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY (enrollmentId, stepId)
}
```

**Indexes:**
- `completed_steps_enrollment_idx` - Fast lookup of all steps completed by a reader
- `completed_steps_step_idx` - Fast lookup of all readers who completed a specific step
- `completed_steps_completed_at_idx` - Time-based analytics queries

#### Cohorts Table

This table enables grouping readers into cohorts for social learning and collaborative study. Multiple cohorts can exist for a single binder (e.g., different semesters, study groups). Cohorts are optional - readers can study independently without joining a cohort. **Note:** `binderId` FK establishes that cohorts belong to binders (one binder → many cohorts), NOT the other way around.

```typescript
{
  id: serial PRIMARY KEY,
  name: text NOT NULL,
  binderId: integer FK(binders.id) ON DELETE CASCADE NOT NULL,
  curatorId: text FK(users.username) ON UPDATE CASCADE ON DELETE SET NULL,
  description: text,
  isActive: boolean DEFAULT true NOT NULL,
  createdAt: timestamp DEFAULT now() NOT NULL
}
```

**Key Features:**
- `binderId`: Foreign key to binders table (DB: `binders`) - one binder can have many cohorts
- `curatorId`: Optional owner of the cohort (typically the binder curator)
- `isActive`: Allows archiving old cohorts without deletion
- `description`: Optional context (e.g., "Fall 2024 semester", "Weekend study group")

**Indexes:**
- `cohorts_binder_idx` - Fast lookup of all cohorts for a binder
- `cohorts_curator_idx` - Fast lookup of cohorts created by a user
- `cohorts_active_idx` - Partial index on active cohorts only

#### Cohort Members Table

This junction table tracks which readers belong to which cohorts. The composite primary key ensures each reader can only be a member of a cohort once. Readers can belong to multiple cohorts for different binders, and cohort membership is independent from enrollment (readers can be enrolled without being in any cohort).

```typescript
{
  cohortId: integer FK(cohorts.id) ON DELETE CASCADE NOT NULL,
  readerId: text FK(users.username) ON UPDATE CASCADE ON DELETE CASCADE NOT NULL,
  joinedAt: timestamp DEFAULT now() NOT NULL,
  role: text DEFAULT 'member' NOT NULL,
  PRIMARY KEY (cohortId, readerId)
}
```

**Key Features:**
- Composite primary key: (cohortId, readerId) prevents duplicate membership
- `role`: Supports future features like cohort moderators ('member', 'moderator', etc.)
- `joinedAt`: Tracks when reader joined the cohort
- Cascade deletes: Removing a cohort or user automatically cleans up memberships

**Indexes:**
- `cohort_members_reader_idx` - Fast lookup of all cohorts a reader belongs to
- `cohort_members_role_idx` - Fast filtering by member role

**Relationship to Enrollments:**
- Enrollments track individual progress (readerId, binderId, currentWeekIndex)
- Cohort members track social grouping (cohortId, readerId)
- These are separate: readers can be enrolled without being in a cohort
- Queries can JOIN both to show cohort members' progress

#### Subscriptions Table

Stores Stripe subscription records as an audit trail for Pro subscriptions. Each record mirrors the Stripe subscription lifecycle and is updated via webhook events. The `userId` references `users.id` with CASCADE delete.

```typescript
{
  id: serial PRIMARY KEY,
  userId: varchar FK → users.id,              // CASCADE delete
  stripeSubscriptionId: string UNIQUE,        // Stripe subscription ID
  stripePriceId: string,                      // Stripe price ID
  status: string,                             // Mirrors Stripe status (active, canceled, past_due, etc.)
  currentPeriodStart: timestamp,              // Billing period start
  currentPeriodEnd: timestamp,                // Billing period end
  cancelAtPeriodEnd: boolean DEFAULT false,   // Whether subscription cancels at period end
  createdAt: timestamp DEFAULT now(),
  updatedAt: timestamp DEFAULT now(),
}
```

**Indexes:**
- `subscriptions_user_id_idx` - Fast lookup by user
- `subscriptions_stripe_subscription_id_idx` - Fast lookup by Stripe subscription ID

#### Credit Transactions Table

Stores an audit trail of all credit operations — grants, deductions, refunds, and purchases. Each transaction records the running balance, enabling full credit history reconstruction.

```typescript
{
  id: serial PRIMARY KEY,
  userId: varchar FK → users.id,        // CASCADE delete
  amount: integer NOT NULL,             // Positive = grant, negative = deduction
  balance: integer NOT NULL,            // Running balance after this transaction
  type: text NOT NULL,                  // signup_grant | subscription_grant | package_purchase | generation | week_regen | improve_writing | admin_adjustment | refund
  description: text NOT NULL,           // Human-readable description
  metadata: text,                       // Reference like 'binder:42' or 'stripe:pi_xxx' or 'refund_of:42'
  createdAt: timestamp DEFAULT now(),
}
```

**Indexes:**
- `credit_transactions_user_id_idx` — User credit history lookup
- `credit_transactions_created_at_idx` — Chronological ordering
- `credit_transactions_type_idx` — Filter by transaction type

#### Site Settings Table

Stores admin-configurable key-value pairs for platform-wide settings (e.g., Slack community URL). Admins can update these via `PUT /api/admin/settings`. Public read access via `GET /api/site-settings/:key`.

```typescript
{
  id: serial PRIMARY KEY,
  key: text NOT NULL UNIQUE,         // Setting identifier (e.g., 'slack_community_url')
  value: text,                       // Setting value
  updatedAt: timestamp DEFAULT now(),
}
```

#### Waitlist Table (Deprecated — table retained, code removed)

The `waitlist` table still exists in the database schema for data preservation, but all API routes, storage methods, and admin UI have been removed. Waitlist signups are now handled via an external form (Google Form, Typeform, etc.) whose URL is stored in `site_settings` under the key `waitlist_form_url`. The Login page "Join Waitlist" tab and Marketing page CTA buttons link to this external URL.

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
      "isCurator": boolean,          // Curator role flag

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

**Indexes:**
- `sessions_expire_idx` - Session cleanup: `DELETE WHERE expire < now()`

**Note:** Passport.js is configured to serialize the entire user object (not just the user ID), so all user data and OAuth tokens are stored in the session for quick access without database queries.

---

### TypeScript Domain Models

These TypeScript interfaces define the shape of data used throughout the client application. They provide type safety and documentation for how data flows between components. While the database stores data in tables, these models represent how that data is structured and used in the React frontend.

#### Core Learning Types

The core learning types define the binder structure. A binder contains multiple weeks, each week contains multiple steps, and each step is either a reading (with a URL to external content) or an exercise (with a prompt for readers to respond to).


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
  binderId: number;                  // Foreign key to binders
  index: number;                     // 1-based week number
  title?: string;
  description?: string;
  steps: Step[];
}

interface Binder {
  id: number;                        // Changed from string to number (serial)
  title: string;
  description: string;
  audienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks: number;
  status: 'draft' | 'published';
  weeks: Week[];
  curatorId: string;                 // Username (unique) instead of UUID
}
```

#### User & Progress Types

User and enrollment models represent the people using the platform and their learning progress. The User interface maps to the database users table, while the Enrollment interface represents a reader's current state within a binder, tracking which week they're on and which steps they've completed.

```typescript
interface User {
  id: string;                        // UUID
  username: string;                  // Unique username (used for foreign keys)
  name: string;
  email?: string;
  isCurator: boolean;
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
  activeBinderId: number | null;     // Changed from string to number
  currentWeekIndex: number;          // 1-based
  completedStepIds: number[];        // Changed from string[] to number[]
  completedBinderIds: number[];      // Changed from string[] to number[]
  shareProfile?: boolean;            // Per-enrollment classmates visibility
}
```

#### Creator Feature Types

These types support curator-specific features like reviewing reader submissions, organizing readers into cohorts (groups), and tracking individual reader profiles. Submissions allow curators to see reader work and provide feedback with grades and rubrics. *(Note: `binderId` field names are used for DB compatibility.)*

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
  binderId: string;
  readerIds: string[];
}

interface ReaderProfile {
  user: User;
  status: 'in-progress' | 'completed';
  joinedDate: string;
  cohortId?: string;
}
```

---

## UI Architecture

The UI is built as a single-page application (SPA) using React with client-side routing. Pages are organized into three categories: public pages anyone can access, authenticated reader pages, and curator-only pages that require the curator flag. The application uses a component-based architecture with reusable UI primitives.

### Page Structure

The application has 15 main pages organized by access level. Public pages handle marketing and browsing, reader pages provide the learning experience with progress tracking, and curator pages offer content management and analytics tools.



#### Public Pages

These pages are accessible without authentication, allowing visitors to learn about the platform and browse available binders before signing up.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/welcome` | `Marketing.tsx` | Landing page with hero + real binder card showcase |
| `/login` | `Login.tsx` | Authentication entry (signup/login modes) |
| `/catalog` | `Catalog.tsx` | Browse all published binders |
| `/binder/:id` | `BinderOverview.tsx` | Binder detail with week breakdown |

#### Reader Pages (Auth Required)

These pages provide the core learning experience. Readers see their dashboard, work through weekly content step-by-step, and manage their profile. These pages require users to be logged in.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Dashboard.tsx` | Home - active binder progress or catalog |
| `/binder/:id/week/:index` | `WeekView.tsx` | Main learning interface with readings & exercises |
| `/binder/:id/completed` | `Completion.tsx` | Celebration screen post-completion |
| `/profile` | `Profile.tsx` | Edit bio, social links, preferences |
| `/settings` | `Settings.tsx` | Change password, delete account |
| `/billing` | `Billing.tsx` | Subscription management, credit balance, transaction history |
| `/pricing` | `Pricing.tsx` | Plan comparison, credit costs, credit packages |

#### Curator Pages (Auth + Curator Flag Required)

These pages are only accessible to users who have enabled curator mode. They provide tools for building binders, tracking reader progress, managing cohorts, and providing feedback on submissions.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/curator` | `CuratorDashboard.tsx` | List of created binders with management |
| `/curator/binder/new` | `BinderEditor.tsx` | Build new binder (WYSIWYG editor) |
| `/curator/binder/:id/edit` | `BinderEditor.tsx` | Edit existing binder (auto-save) |
| `/curator/binder/:id/analytics` | `BinderAnalytics.tsx` | Reader progress visualization |
| `/curator/binder/:id/readers` | `BinderReaders.tsx` | Reader list, cohorts, submissions |
| `/curator/profile` | `CuratorProfile.tsx` | Curator bio, expertise, social links |
| `/admin` | `AdminSettings.tsx` | Admin-only: configure Slack URL and site settings |

---

### Component Library

The component library is divided into feature components (application-specific) and UI primitives (reusable, generic components). The UI primitives are built on top of Radix UI, providing accessible, unstyled components that are then styled with TailwindCSS.

#### Feature Components

These components are specific to Syllabind's functionality and compose the UI primitives into meaningful application features.


- **`Layout.tsx`**: Main application header
  - Navigation links (Dashboard/Catalog/Curator Studio)
  - User avatar dropdown (Profile, Creator Mode toggle, Logout)
  - Conditional rendering based on auth state

- **`BinderCard.tsx`**: Reusable binder preview card
  - Displays title, description, level, duration
  - Curator avatar with name; hover tooltip shows bio, expertise, and social links (same pattern as classmates)
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

The application uses React Context API for global state management, providing a centralized store that all components can access. This store holds user authentication state, the current user's enrollment data, available binders, and methods to modify this state. React Query complements this by handling server data fetching and caching.

#### Context Store (`client/src/lib/store.tsx`)

The Context Store is the central state management solution. It provides a single source of truth for application state and exposes methods that components can call to update that state. All state changes flow through this store, making data flow predictable and easy to debug.

**State:**
```typescript
{
  user: User | null;
  isAuthenticated: boolean;
  binders: Binder[];                   // Fetched from /api/binders
  enrollment: Enrollment | null;       // Fetched from /api/enrollments
  completedStepIds: number[];          // Fetched from /api/enrollments/:id/completed-steps
  submissions: Submission[];           // Fetched from /api/enrollments/:id/submissions
  bindersLoading: boolean;             // Loading state for binders
  enrollmentLoading: boolean;          // Loading state for enrollments
}
```

**Methods:**

All methods now make real API calls to the backend. The store provides methods organized by functionality.

**Data Fetching:**
- `refreshBinders()` - Fetch binders from `/api/binders`
- `refreshEnrollments()` - Fetch enrollments from `/api/enrollments`

**Authentication:**
- `toggleCuratorMode()` - POST to `/api/users/me/toggle-curator`
- `updateUser(updates)` - PUT to `/api/users/me`

**Reader Actions:**
- `enrollInBinder(binderId, shareProfile?)` - POST to `/api/enrollments` (accepts optional shareProfile)
- `markStepComplete(stepId)` - POST to `/api/enrollments/:id/steps/:id/complete`
- `markStepIncomplete(stepId)` - DELETE to `/api/enrollments/:id/steps/:id/complete`
- `saveExercise(stepId, answer, isShared)` - POST to `/api/submissions`
- `completeActiveBinder()` - PUT to `/api/enrollments/:id` with status: 'completed'

**Curator Actions:**
- `createBinder(binder)` - POST to `/api/binders`
- `updateBinder(binder)` - PUT to `/api/binders/:id`
- `getReadersForBinder(binderId)` - GET from `/api/binders/:id/classmates` (public, filters by enrollment shareProfile)
- `updateEnrollmentShareProfile(enrollmentId, shareProfile)` - PATCH to `/api/enrollments/:id/share-profile`

**Query Methods:**
- `getActiveBinder()` - Get current enrolled binder from local state
- `getBinderById(id)` - Get binder from local state (basic metadata only, no weeks/steps)
- `isStepCompleted(stepId)` - Check step completion in local state
- `getProgressForWeek(binderId, weekIndex)` - Calculate week progress
- `getOverallProgress(binderId)` - Calculate total progress
- `getSubmission(stepId)` - Get submission from local state

**Important Data Loading Patterns:**
- The cached `binders` list from `/api/binders` contains only basic metadata (no weeks/steps)
- Pages that need full binder data (weeks/steps) must fetch directly from `/api/binders/:id`
- `BinderOverview` and `BinderEditor` both fetch full content via direct API calls
- This prevents loading heavy binder data for catalog browsing

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
PUT    /api/users/me/password       - Change password (auth, email only)
DELETE /api/users/me                - Delete account (auth, password for email)
POST   /api/users/me/toggle-curator - Toggle curator mode (auth)
```

### Site Settings Endpoints

**Public:**
```
GET    /api/site-settings/:key       - Get a site setting value
```

**Admin Only:**
```
PUT    /api/admin/settings           - Upsert a site setting { key, value }
```

### Binder Endpoints

**Public:**
```
GET    /api/binders      - List published binders
GET    /api/binders/:id  - Get binder with content
```

**Protected (Auth + Curator + Ownership):**
```
POST   /api/binders             - Create binder (with weeks/steps)
PUT    /api/binders/:id         - Update binder (syncs weeks/steps)
DELETE /api/binders/:id         - Delete binder
POST   /api/binders/:id/publish - Publish/unpublish binder
GET    /api/curator/binders     - Get curator's binders (including drafts)
GET    /api/binders/:id/readers     - Get all readers for binder (curator only)
```

**Public (Auth Required):**
```
GET    /api/binders/:id/classmates  - Get classmates who opted in (shareProfile=true)
```

### Enrollment Endpoints (Auth Required)

```
GET    /api/enrollments     - Get user's enrollments
POST   /api/enrollments     - Enroll in binder
PUT    /api/enrollments/:id              - Update enrollment progress
PATCH  /api/enrollments/:id/share-profile - Toggle enrollment shareProfile
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
PUT    /api/submissions/:id/feedback    - Provide feedback (curator only)
```

### Analytics Endpoints (Auth + Creator + Ownership)

```
GET    /api/binders/:id/analytics                  - Comprehensive analytics dashboard
GET    /api/binders/:id/analytics/completion-rates - Step completion rates
GET    /api/binders/:id/analytics/completion-times - Average completion times
```

**Comprehensive Analytics Response (`/api/binders/:id/analytics`):**
```typescript
{
  learnersStarted: number;           // Total enrollments
  learnersCompleted: number;         // Enrollments with status='completed'
  completionRate: number;            // Percentage of completers
  averageProgress: number;           // Average % of steps completed
  weekReach: Array<{                 // Learner reach per week
    week: string;                    // "Week 1", "Week 2", etc.
    weekIndex: number;
    percentage: number;              // % of readers who reached this week
    readerCount: number;
    readerNames: string[];           // Names of readers who reached this week
  }>;
  stepDropoff: Array<{               // Step-level dropoff data
    stepId: number;
    weekIndex: number;
    stepTitle: string;
    dropoffRate: number;             // % drop from previous step
    completionCount: number;
  }>;
  topDropoutStep: {                  // Highest dropoff step (or null)
    weekIndex: number;
    stepTitle: string;
    dropoffRate: number;
  } | null;
}
```

### Subscription Endpoints (Auth Required)

```
GET    /api/subscription/status    - Get user's subscription status (free/pro)
GET    /api/subscription/limits    - Get binder creation limits and enrollment gating
POST   /api/create-checkout-session - Create Stripe Checkout session (redirect URL)
POST   /api/create-portal-session   - Create Stripe Customer Portal session
POST   /api/webhook                 - Stripe webhook handler (signature verified)
```

**Subscription Limits Response:**
```typescript
{
  binderCount: number;
  binderLimit: number | null;
  canCreateMore: boolean;
  canEnroll: boolean;
  isPro: boolean;
  creditBalance: number;
  subscriptionTier: string;
  costs: { per_week: 10, improve_writing: 1, auto_fill: 0 };
  enrollmentLimit: number | null;
  activeEnrollmentCount: number;
}
```

**Credit Endpoints (Auth Required):**
```
GET    /api/credits/info     - Credit balance, tier, costs, limits
GET    /api/credits/history  - Paginated credit transaction log
```

**Webhook Events Handled:**
- `checkout.session.completed` → Upgrade user, grant credits based on plan
- `customer.subscription.updated` → Sync subscription status
- `customer.subscription.deleted` → Downgrade user to free, reset tier
- `invoice.payment_succeeded` → Confirm Pro status + grant monthly credits (deduped)
- `invoice.payment_failed` → Log only (Stripe retries automatically)

---

## Key Features

The application provides distinct experiences for readers and curators. Readers get a structured, guided learning path with progress tracking, while curators get tools to build content, monitor engagement, and provide feedback. The UI/UX layer adds polish through animations, responsive design, and thoughtful feedback.

### Reader Experience

The reader journey focuses on structured, progressive learning. Readers browse a catalog of binders, enroll in ones that interest them, and work through content week by week. The system tracks their progress and celebrates milestones to maintain engagement.


- **Browse & Enroll**: Discover published binders in catalog
- **Week-by-week Progress**: Structured learning path with locked weeks
- **Step Tracking**: Mark readings/exercises as complete
- **Exercise Submission**: Submit URLs or text answers
- **Profile Sharing**: Per-enrollment opt-in to appear in classmates list (independent per binder)
- **Completion Celebration**: Confetti animation + completion badge

### Curator Experience

Curators get a full content management system for building and managing binders. The experience emphasizes ease of use (auto-save, drag-and-drop), insight into reader progress (analytics), and tools for providing personalized feedback.

- **Rich Editor**: TipTap-powered binder builder with drag-and-drop
- **Auto-save**: Drafts save automatically
- **Publish Control**: Draft vs. Published status
- **Analytics Dashboard**: Learner progress visualization with charts
- **Cohort Management**: Group readers into cohorts
- **Feedback System**: Grade submissions with rubrics
- **Curator Profile**: Showcase expertise and social links

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
- **Explicit saves in OAuth flows**: All OAuth routes call `session.save()` before redirecting to ensure the session (CSRF state, userId) is persisted to PostgreSQL before the browser follows the redirect. This prevents race conditions where the redirect arrives before the session write completes.

### Auth Middleware: `isAuthenticated`

Located in `/server/auth/index.ts`, this middleware:
1. Checks for `req.session.userId`
2. Fetches user from database
3. Attaches user (without password) to `req.user`
4. Returns 401 if not authenticated

### Authorization Layers

1. **Authentication** - `isAuthenticated` middleware (401 if not logged in)
2. **Curator Check** - Verifies `req.user.isCurator === true` (403 if not curator)
3. **Ownership Check** - Verifies user owns the resource (403 if not owner)
4. **Admin Bypass** - Admins skip ownership and curator checks (see below)

### Admin Access

Admin status is controlled by the `ADMIN_USERNAMES` environment variable (comma-separated usernames). No database changes required.

**Implementation:**
- `server/auth/admin.ts` exports `isAdminUser(username)` — parses the env var on each call
- `isAuthenticated` middleware and `authenticateWebSocket` inject `isAdmin: boolean` into the user object
- Email auth endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`) include `isAdmin` in responses
- All ownership checks in `server/routes.ts` add `&& !isAdmin` to allow admin bypass
- All curator-required checks allow admin access (`!user.isCurator && !user.isAdmin`)
- `GET /api/curator/binders?all=true` returns all binders site-wide (admin only)
- Frontend `CuratorDashboard` shows "My Binders / All Binders" toggle for admin users
- `User` type in `client/src/lib/types.ts` includes optional `isAdmin` field

### Security Middleware

Located at the top of `server/index.ts`:

1. **HTTPS Redirect** (production only) — Checks `X-Forwarded-Proto` header and issues a 301 redirect from HTTP to HTTPS.
2. **HSTS** (production only) — Sends `max-age=31536000; includeSubDomains` header.
3. **Security Headers** (all environments) — Sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

### Rate Limiting

Auth endpoints are rate-limited via `server/utils/rateLimiter.ts` (in-memory sliding-window per IP):

- **Login/Register** (`/api/auth/login`, `/api/auth/register`): 10 requests per 15 minutes
- **OAuth** (`/api/auth/google`, `/api/auth/apple`): 20 requests per 15 minutes

Applied in `server/auth/index.ts` before auth route registration.

### HTML Sanitization

All user-generated HTML rendered via `dangerouslySetInnerHTML` is sanitized through `client/src/lib/sanitize.ts` (DOMPurify wrapper) to prevent XSS. The `chart.tsx` tooltip is excluded as it renders static config, not user content.

### Security Event Logging

`server/lib/audit.ts` provides PostHog-based security event logging (`logSecurity()`) for login failures and rate limit hits. Requires `POSTHOG_API_KEY` env var.

### Error Handler

The global Express error handler in `server/index.ts` logs errors server-side and returns generic messages in production (status 500) to prevent information leakage.

### Protected Routes

All routes except public catalog/binder viewing require authentication. Curator-only routes additionally check `isCurator` flag. Resource modification routes verify ownership (username matching). Admin users bypass both curator and ownership checks.

### Auth Routes

- `POST /api/auth/register` - Email/password registration (rate-limited)
- `POST /api/auth/login` - Email/password login (rate-limited)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Destroy session
- OAuth routes for Google and Apple in respective auth modules (rate-limited)

---

## File Structure

The codebase is organized into three main directories: `client` (React frontend), `server` (Express backend), and `shared` (code used by both). This monorepo structure keeps related code together while maintaining clear boundaries between frontend and backend concerns.

```
/workspace/
├── client/src/
│   ├── main.tsx              - React entry point
│   ├── App.tsx               - Router + auth wrapper
│   ├── pages/                - 15 page components (~3,200 lines)
│   ├── components/
│   │   ├── Layout.tsx        - Main header + footer (legal links)
│   │   ├── BinderCard.tsx     - Binder preview
│   │   ├── UpgradePrompt.tsx - Pro subscription upgrade dialog (with legal links)
│   │   ├── AvatarUpload.tsx  - Image uploader
│   │   └── ui/               - 50+ UI primitives (~5,950 lines)
│   ├── hooks/                - Custom React hooks
│   └── lib/
│       ├── store.tsx         - Context API state
│       ├── types.ts          - TypeScript interfaces
│       ├── queryClient.ts    - React Query config
│       ├── stripe.ts         - Stripe checkout/portal helpers
│       └── utils.ts          - Utility functions
│
├── server/
│   ├── index.ts              - Express server
│   ├── routes.ts             - API endpoints
│   ├── db.ts                 - Drizzle connection
│   ├── storage.ts            - Database operations
│   ├── auth/
│   │   ├── index.ts          - Session setup, isAuthenticated middleware
│   │   ├── admin.ts          - Admin check via ADMIN_USERNAMES env var
│   │   ├── emailAuth.ts      - Email/password auth routes
│   │   ├── googleAuth.ts     - Google OAuth routes
│   │   └── appleAuth.ts      - Apple OAuth routes
│   ├── lib/
│   │   └── stripe.ts         - Stripe client singleton
│   ├── routes/
│   │   ├── stripe.ts         - Subscription & checkout routes
│   │   └── webhook.ts        - Stripe webhook handler
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
- Passport.js (email/password, Google OAuth, Apple OAuth, Replit Auth)
- Express-session, Connect-pg-simple

**Analytics:**
- PostHog (`posthog-js`, `@posthog/react`)

---

## Analytics (PostHog)

PostHog is integrated as the product analytics platform. See `docs/POSTHOG_ANALYTICS.md` for full documentation.

**Setup:** `PostHogProvider` wraps the app in `client/src/main.tsx`, configured via `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` environment variables.

**User Identification:** Users are identified on login (`posthog.identify`) and reset on logout (`posthog.reset`) in `client/src/lib/store.tsx`. Properties sent: `email`, `name`, `is_curator`.

**Custom Events:**

| Event | Trigger | Properties |
|-------|---------|------------|
| `enrolled_in_binder` | Reader enrolls | `binder_id` |
| `step_completed` | Reader completes a step | `step_id`, `binder_id` |
| `binder_completed` | Reader finishes all steps | `binder_id` |
| `exercise_submitted` | Reader submits an exercise | `step_id`, `binder_id` |
| `binder_published` | Curator publishes | `binder_id`, `title` |
| `link_shared` | User copies share link | `url`, `type` (optional) |

---

## Database Migration History

### Username-Based Foreign Keys Migration (2026-01-26)

**Migration:** `migrations/manual_username_migration.sql`

**Objective:** Replace UUID-based foreign keys with username-based foreign keys for improved logging, debugging, and readability across the application.

**Changes Made:**

1. **Binders Table (DB):**
   - Changed `curator_id` column type from `varchar(UUID)` to `text`
   - Updated existing data: converted UUIDs to usernames
   - Replaced foreign key constraint: `binders_curator_id_users_id_fk` → `binders_curator_id_users_username_fk`
   - Added cascading behavior: `ON UPDATE CASCADE ON DELETE SET NULL`

2. **Enrollments Table:**
   - Renamed column: `user_id` → `reader_id` (better semantic clarity)
   - Changed `reader_id` column type from `varchar(UUID)` to `text`
   - Updated existing data: converted UUIDs to usernames
   - Replaced foreign key constraint: `enrollments_user_id_users_id_fk` → `enrollments_reader_id_users_username_fk`
   - Added cascading behavior: `ON UPDATE CASCADE ON DELETE CASCADE`

**Benefits:**
- **Improved Logging:** Database logs now show readable usernames instead of UUIDs
- **Better Debugging:** Easier to trace user actions and identify records
- **Data Integrity:** Cascade updates automatically update foreign keys when username changes
- **Semantic Clarity:** `reader_id` better represents the reader role in enrollments

**Application Code Updates:**
- Updated `shared/schema.ts` to reflect new column types and foreign key references
- Updated `server/storage.ts` to use `readerId` instead of `userId` in enrollment methods
- Updated `server/routes.ts` to use `username` for authorization checks and enrollment creation
- Updated `client/src/lib/types.ts` to add `username` field to User interface

**Migration Execution:**
```bash
psql "$DATABASE_URL" -f migrations/manual_username_migration.sql
```

### JSONB to Normalized Tables Migration (2026-01-26)

**Migration:** `server/migrate-jsonb-to-normalized.ts`

**Objective:** Migrate binder content from JSONB storage to normalized relational tables for better query performance and data integrity.

**Changes Made:**
- Created `weeks` table with foreign key to `binders.id`
- Created `steps` table with foreign key to `weeks.id`
- Migrated all existing binder content from `binders.content` JSONB field to normalized tables
- Step IDs changed from string UUIDs to integer serial primary keys
- Removed `content` JSONB field from `binders` table (2026-01-26)

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
   - `GET /api/binders/:id/analytics/completion-rates` - Step completion analytics
   - `GET /api/binders/:id/analytics/completion-times` - Average completion times

**Benefits:**
- **Efficient Queries:** Direct lookups instead of JSONB array scans
- **Analytics:** Track completion timestamps and patterns
- **Scalability:** Indexed queries scale to large datasets
- **Flexibility:** Easy to add completion metadata (attempts, scores, etc.)

**Final JSONB Status:**
- Only 1 JSONB column remains: `sessions.sess` (required by express-session)
- All application data fully normalized ✅

---

### 4. Performance Indexes (2026-02-09)

**Migration File:** `migrations/0003_add_performance_indexes.sql`
**Schema Definition:** `shared/schema.ts` (Drizzle index definitions)

**Objective:** Add indexes to all tables based on actual query patterns in `storage.ts` to eliminate sequential scans on foreign key columns and frequently-filtered columns.

**Changes Made:**
1. **10 new indexes across 6 tables** — sessions, binders, enrollments, weeks, steps, submissions
2. **Unique index on enrollments** — `(reader_id, binder_id)` enforces one-enrollment-per-reader-per-binder business rule at the database level
3. **Tables already indexed** (no changes): completed_steps (0001), cohorts/cohort_members (0002), users (unique constraints)

**Last Updated:** 2026-02-09

---

## Recent Changes

### Port Cleanup Script Enhancement (2026-02-02)

**Problem:** The `check-port.sh` script failed to clean up port 5000, preventing the dev server from starting. The script relied on `lsof` command which is not available in the Replit environment.

**Solution:** Rewrote `scripts/check-port.sh` with a three-stage progressive cleanup escalation:

1. **Stage 1 (Graceful):** Send SIGTERM, wait 3 seconds for graceful shutdown
2. **Stage 2 (Force):** Send SIGKILL to server processes, wait 2 seconds
3. **Stage 3 (Nuclear):** Kill shell wrappers and orphaned processes, wait 2 seconds

**Key Improvements:**
- Removed dependency on unavailable `lsof` command
- Uses only available utilities (`ps`, `pkill`, `grep`, `awk`, bash built-ins)
- Honors server's 5-second graceful shutdown timeout (server/index.ts:135-138)
- Progressive escalation: graceful first, force as fallback, nuclear as last resort
- Proper wait times: 3s + 2s + 2s = 7 seconds total
- Explicitly handles shell wrapper processes that survive child process termination

**Testing Results:**
- ✅ Clean environment check passes immediately
- ✅ Running server cleaned up gracefully in ~3 seconds (Stage 1)
- ✅ No orphaned processes remain after cleanup
- ✅ Dev server starts successfully after cleanup
- ✅ All backend tests pass (151 total across 14 test suites)

**Files Modified:**
- `scripts/check-port.sh` - Enhanced with three-stage cleanup (lines 8-37)

**Related Files:**
- `scripts/force-kill-server.sh` - Reference for proven cleanup patterns
- `server/index.ts:135-138` - Server graceful shutdown handlers
- `package.json:8` - Integration point for `npm run dev`

**Port Management Scripts:**

**check-port.sh** - Progressive port cleanup
- Stage 1: Graceful SIGTERM shutdown (3s wait)
- Stage 2: Force SIGKILL processes (2s wait)
- Stage 3: Nuclear cleanup of wrappers (2s wait)
- Used by: `npm run dev` pre-flight check

**force-kill-server.sh** - Emergency cleanup
- Nuclear option for stubborn processes
- Three cleanup methods: pkill, PID iteration, shell wrappers
- Use when check-port.sh fails

### Single Active Enrollment (2026-01-28)

Implemented single-active-binder behavior for readers:
- Users can only have one `in-progress` enrollment at a time
- When enrolling in a new binder, previous in-progress enrollments are automatically marked as `dropped`
- Dropped enrollments are excluded from analytics, reader lists, and classmate lists
- Re-enrolling in a previously dropped binder reactivates that enrollment
- Completed enrollments are preserved and not affected by switching

### Real-Time Analytics Dashboard (2026-01-28)

Added comprehensive analytics endpoint that provides real data for the Curator Analytics page:
- **Reader Metrics:** Total enrollments, completions, and completion rate
- **Progress Tracking:** Average progress percentage across all readers
- **Week Reach Chart:** Shows what percentage of readers reached each week
- **Dropout Analysis:** Identifies the step with highest dropoff rate
- **Friction Points:** Lists top steps where readers stop progressing

### AI Token Optimization (2026-02-03)

Reduced token consumption for AI-powered binder generation:

**Model Selection (Hybrid):**
- **Haiku** (`claude-haiku-4-5-20251001` / `CLAUDE_MODEL`): Planning (`planCurriculum`) — simple structured output, cost-efficient
- **Sonnet** (`claude-sonnet-4-5-20250929` / `CLAUDE_MODEL_GENERATION`): Generation batches and week regeneration — needs accurate metadata extraction (title, author, date) from web search results
- **Haiku for URL repair**: `repairMissingUrls()` uses Haiku instead of Sonnet — repair is simple web search + structured output, no curriculum generation
- Both constants exported from `server/utils/claudeClient.ts`
- No user-facing model selector

**Prompt Caching:**
- Enabled `cache_control: { type: 'ephemeral' }` on system prompts
- System prompts are cached for 5 minutes, reducing re-tokenization
- Applied to generation handlers

**Web Search Limits:**
- Generation: 8 searches per batch (~4/week for 2-week batches)
- Repair: `min(missingCount * 2, 10)` — 2 searches per reading, capped at 10
- Per-batch URL repair removed; final sweep handles all missing URLs in one pass

**Files Modified:**
- `server/utils/claudeClient.ts` - `CLAUDE_MODEL` constant (Haiku), shared client with `maxRetries: 0`
- `server/utils/syllabindGenerator.ts` - Prompt caching via `system` parameter, trimmed prompts, exponential backoff with jitter
- `server/utils/requestQueue.ts` - In-memory sliding window rate limiter (40 RPM)

### Binder Generation Structure (2026-02-03)

Enforced strict structure for AI-generated binders:

**Duration Limits:**
- Maximum weeks increased from 4 to 8
- UI updated with options for 1-8 weeks

**Week Structure (enforced in prompt and tool schema):**
- Each week has exactly 4 steps
- 3 readings (positions 1-3)
- 1 exercise (position 4, always last)
- Tool schema includes `minItems: 4, maxItems: 4` constraint

**Files Modified:**
- `client/src/pages/SyllabindEditor.tsx` - Extended duration options to 8 weeks
- `server/utils/SyllabindGenerator.ts` - Updated system prompt with strict structure requirements
- `server/utils/claudeClient.ts` - Added constraints to `finalize_week` tool schema

### Duration Change Week Preservation (2026-02-03)

Fixed issue where changing durationWeeks would lose existing week content:

**Problem:** When user reduced durationWeeks (e.g., 2→1) then increased it back (1→2), Week 2 would reappear empty instead of restoring database content.

**Solution:**
- Added `originalWeeks` state to store weeks fetched from database
- Modified `handleDurationChange` to restore original weeks when duration increases
- Updated generation_complete handler to store generated weeks as new baseline

**UI Change:**
- Changed "Regenerate with AI" button from primary to secondary variant

**Files Modified:**
- `client/src/pages/SyllabindEditor.tsx` - Added originalWeeks state, updated handleDurationChange logic, secondary button variant

### Anthropic API Tier 1 Optimization (2026-02-16)

Optimized API usage for Anthropic Tier 1 (50 RPM) to prevent 429 rate limit errors in production:

**Changes:**
- Hybrid model strategy: Haiku for planning, Sonnet for generation/repair (see AI Token Optimization section)
- Added in-memory request queue (`server/utils/requestQueue.ts`) capping at 40 RPM (10 RPM headroom)
- Replaced simple retry with exponential backoff + jitter (5 retries, 1s→16s base delay, +0-1s random jitter)
- Respects `retry-after` header from API when available (capped at 120s)
- Removed pre-flight rate limit check (`rateLimitCheck.ts` deleted) — wasted an API call, redundant with retry logic
- Trimmed system prompts (~50% reduction) and reduced `max_tokens` from 8192 to 4096
- Moved system prompts to `system` parameter with `cache_control: { type: 'ephemeral' }` for better cache hits
- All API calls (generation, regeneration) go through shared `apiQueue.acquire()` before calling Anthropic

**Files Modified:**
- `server/utils/claudeClient.ts` - `CLAUDE_MODEL` (Haiku) + `CLAUDE_MODEL_GENERATION` (Sonnet), shared client export
- `server/utils/requestQueue.ts` - **NEW** sliding window rate limiter
- `server/utils/syllabindGenerator.ts` - Backoff, trimmed prompts, system param caching, reduced max_tokens
- `server/websocket/generateSyllabind.ts` - Removed pre-flight rate check, removed model param
- `server/routes.ts` - Removed model validation, simplified WebSocket URLs
- `server/index.ts` - Removed model parsing from WebSocket URL
- `client/src/pages/SyllabindEditor.tsx` - Removed model selector dropdown and state

**Files Deleted:**
- `server/utils/rateLimitCheck.ts` - Pre-flight check removed
- `server/__tests__/rateLimitCheck.test.ts` - Corresponding test removed

### Generation Streaming Visual Effect (2026-02-03)

Enhanced visual feedback during AI binder generation to make progress more obvious:

**New State Tracking:**
- `generatingWeeks: Set<number>` - Tracks which weeks are currently being generated
- `completedWeeks: Set<number>` - Tracks which weeks have finished generating
- `erroredWeeks: Set<number>` - Tracks weeks where generation failed (shows warning icon)
- `justCompletedWeek: number | null` - Tracks most recently completed week for animation

**UI Enhancements:**
1. **Week Tabs:** Show spinner icon on generating weeks, checkmark on completed weeks, warning triangle on errored weeks
2. **Progress Card:** Enhanced progress indicator with percentage, progress bar, and colored segment indicators
3. **Skeleton Placeholder:** New `GeneratingWeekPlaceholder` component shows shimmer-animated skeleton while week generates
4. **Step Entrance Animation:** Steps slide in with staggered delay when week completes
5. **Generating Border:** Active week card has pulsing primary-color border

**CSS Animations Added:**
- `animate-shimmer` - Gradient sweep effect for skeleton loading
- `animate-generating` - Pulsing border effect for active generation
- `step-enter`, `step-delay-1` through `step-delay-4` - Staggered slide-in for steps

**Files Modified:**
- `client/src/index.css` - Added animation keyframes and utility classes
- `client/src/pages/SyllabindEditor.tsx` - Added state tracking, updated WebSocket handlers, enhanced UI
- `client/src/components/GeneratingWeekPlaceholder.tsx` - New skeleton placeholder component

### Binder Regeneration Safety (2026-02-03)

Added safeguards when regenerating AI binder after content already exists:

**User Experience:**
- Button text changes from "Autogenerate Binder with AI" to "Regenerate Binder with AI" when content exists
- Confirmation dialog appears before regenerating, warning that existing content will be replaced
- Dialog explains: "All current weeks, steps, and descriptions will be deleted"

**Database Cleanup:**
- New `deleteWeeksByBinderId(binderId)` method in storage layer
- WebSocket handler deletes existing weeks/steps before generating new ones
- Steps are automatically deleted via CASCADE when weeks are deleted
- Prevents orphaned data accumulation from repeated regenerations

**Files Modified:**
- `client/src/pages/SyllabindEditor.tsx` - Added AlertDialog, button text logic, confirmation flow
- `server/storage.ts` - Added `deleteWeeksBySyllabusId` method to IStorage interface and implementation
- `server/websocket/generateSyllabind.ts` - Added cleanup call before generation

### Real-Time Step Streaming (2026-02-03)

Refined the generation streaming effect so that step cards appear one-by-one as they're saved to the database, rather than all 4 appearing together when the week completes.

**Backend Changes:**
- Added `step_completed` WebSocket message sent immediately after each step is saved
- Modified `week_completed` message to only include title/description (steps already streamed)
- Each `step_completed` includes full step data (id, weekId, position, type, title, url, etc.)

**Frontend Changes:**
- Added `step_completed` WebSocket handler to incrementally add steps to week state
- Updated `week_completed` handler to only update title/description (no longer overwrites steps)
- Modified placeholder condition: show while generating AND steps < 4 (not just when no content)
- Pass `currentSteps` prop to `GeneratingWeekPlaceholder` for partial rendering

**GeneratingWeekPlaceholder Enhancements:**
- Now accepts optional `currentSteps` prop showing steps received so far
- Renders real step cards (with `step-appear` animation) for received steps
- Renders skeleton cards only for remaining steps (4 - currentSteps.length)
- Shows step metadata: type badge, title, author (for readings), url, promptText (for exercises)

**CSS Animation:**
- Added `.step-appear` class for single-step slide-in animation (0.3s ease-out)

**Files Modified:**
- `server/utils/syllabindGenerator.ts` - Added `step_completed` message, updated `week_completed`
- `client/src/pages/SyllabindEditor.tsx` - Added `step_completed` handler, updated rendering logic
- `client/src/components/GeneratingWeekPlaceholder.tsx` - Added currentSteps prop, partial rendering
- `client/src/index.css` - Added `.step-appear` animation class

### Regeneration Streaming Fix (2026-02-03)

**Problem:** During regeneration, old step content remained visible until all new steps were generated, then replaced instantly. The streaming placeholder was not shown because:
1. Server deleted weeks from database but client `formData.weeks` was not cleared
2. Old steps remained in React state, making `week.steps.length < 4` condition false
3. New steps were pushed to the existing array (mixing old + new content)

**Solution:** Multiple fixes to create visible streaming effect:

1. **Clear week content on `week_started`:**
   - Reset `steps: []`, `title: ''`, `description: ''` for the week being regenerated
   - This triggers the placeholder to show (since steps.length is now 0)

2. **Auto-switch to generating week's tab:**
   - Changed from uncontrolled Tabs (`defaultValue`) to controlled (`value`/`onValueChange`)
   - Added `activeWeekTab` state
   - When `week_started` fires, automatically switch to `week-${weekIdx}` tab
   - Ensures user sees the streaming placeholder and step-by-step appearance

3. **Add delay between step messages (server-side):**
   - Added 350ms delay between `step_completed` WebSocket messages
   - Without delay, all steps arrived within milliseconds (Claude sends them in one batch)
   - Delay creates visible streaming effect where cards appear one-by-one

4. **Added logging for step count debugging:**
   - Log warning when Claude sends != 4 steps per week
   - Helps diagnose model compliance issues

5. **Fixed week title/description missing after generation:**
   - Issue: Title/description were empty when placeholder transitioned to normal view
   - Cause: `week_completed` handler removed week from `generatingWeeks` (hiding placeholder) BEFORE updating formData with title/description
   - Fix: Reordered state updates - update formData FIRST, then remove from generatingWeeks

6. **Added mock generation mode for testing:**
   - Cmd+click (Mac) or Ctrl+click (Windows) on "Autogenerate" triggers mock mode
   - Sends same WebSocket messages with realistic delays but no API calls
   - Useful for testing streaming UI without using API credits

7. **Week title/description render BEFORE steps:**
   - Added new `week_info` WebSocket message sent immediately after week is created, before steps
   - Client handles `week_info` to populate title/description in formData
   - Updated GeneratingWeekPlaceholder to accept `title` and `description` props
   - Shows actual title/description content (with `step-appear` animation) when available, skeleton when not
   - Result: Title/description appear first, then steps stream in one-by-one

**Files Modified:**
- `client/src/pages/SyllabindEditor.tsx` - Added state reset, controlled tabs, auto-switch, reordered week_completed updates, mock mode support, week_info handler
- `client/src/components/GeneratingWeekPlaceholder.tsx` - Added title/description props, conditional rendering
- `server/utils/syllabindGenerator.ts` - Added delays, logging, week_info message
- `server/websocket/generateSyllabind.ts` - Added mockGenerateSyllabind function with week_info
- `server/index.ts` - Added mock query param support

### Markdown to HTML Conversion for Rich Text Fields (2026-02-03, updated 2026-02-16)

**Problem:** AI-generated exercise prompts and notes contained markdown-style lists (numbered and bullet) that displayed as run-on text in the RichTextEditor (TipTap). Additionally, numbered list items separated by blank lines or bullet sub-items created separate `<ol>` elements, causing numbering to restart at "1." instead of flowing sequentially (1, 2, 3).

**Solution:** Created `server/utils/markdownToHtml.ts` utility with token-based parsing and recursive rendering that converts markdown-style text to proper nested HTML:
- Numbered lists (`1. item`, `2) item`) → `<ol><li><p>...</p></li></ol>`
- Bullet lists (`- item`, `* item`, `• item`) → `<ul><li><p>...</p></li></ul>`
- Plain text → `<p>...</p>`
- Existing HTML → passed through unchanged
- Placeholder brackets like `<topic>` are NOT treated as HTML
- Numbered items separated by blank lines stay in a single `<ol>` (sequential numbering)
- Bullet items between numbered items are nested under the preceding numbered item
- Indentation-based nesting up to 3 levels (2 spaces per level)
- Lazy numbering (all `1.`) handled automatically by HTML `<ol>` auto-increment

**Key Implementation Details:**
- Token-based parser classifies lines as `ol`, `ul`, `text`, or `blank` with indent levels
- Recursive `renderList`/`renderListItem` functions build nested HTML
- Nesting rule: `ol` items nest `ul` sub-items at same indent; `ul` items do NOT nest `ol` items (prevents recursive nesting, keeps separate list sections distinct)
- TipTap requires `<p>` tags inside `<li>` elements for proper list rendering

**Integration Points:**
- `server/utils/syllabindGenerator.ts` - Converts `promptText` and `note` fields before saving

**Files Modified:**
- `server/utils/markdownToHtml.ts` - Conversion utility with nested list support
- `server/__tests__/markdownToHtml.test.ts` - Unit tests (23 tests)
- `client/src/index.css` - Nested list CSS styling (circle/square for deeper bullet levels)
- `client/src/pages/WeekView.tsx` - Added `prose-ol:list-decimal prose-ol:pl-5` classes

### AI creationDate Field Population Fix (2026-02-03)

**Problem:** AI-generated binders rarely included `creationDate` values for reading steps because:
1. The `creationDate` field had no description in the tool schema telling Claude what it's for or what format to use
2. The prompt said "publication dates" but the field was named `creationDate` (terminology mismatch)
3. The prompt instruction was too weak ("Include author names and publication dates when available")

**Solution:**
1. Added description to `creationDate` in `finalize_week` tool schema explaining the dd/mm/yyyy format and purpose
2. Strengthened the generation prompt from "Include author names and publication dates when available" to "ALWAYS extract and include creationDate (publication/creation date) in dd/mm/yyyy format from web search results"

**Files Modified:**
- `server/utils/claudeClient.ts` - Added descriptions to `creationDate` in `finalize_week` tool
- `server/utils/syllabindGenerator.ts` - Strengthened prompt instruction for date extraction

### Regenerate Week Button and Step Deletion Persistence (2026-02-03)

Added ability to regenerate a single week's content while preserving other weeks, and fixed a bug where step deletions were not persisted to the database.

**Part 1: Step Deletion Persistence Fix**

**Problem:** The `removeStep()` function in SyllabindEditor.tsx only updated local React state. Deletions were never persisted to the database because:
- No DELETE API endpoint existed for steps
- The `updateSyllabus()` method explicitly filtered out `weeks` data
- The `storage.deleteStep()` method existed but was never called

**Solution:**
1. Added `DELETE /api/steps/:id` endpoint in routes.ts
2. Added `getStep()` and `getWeek()` helper methods in storage.ts for authorization chain
3. Updated `removeStep()` to call DELETE API for saved steps (positive IDs)
4. Added optimistic UI update with error revert

**Part 2: Regenerate Week Button**

**Architecture:** Mirrors the full binder regeneration flow but scoped to a single week:
- Frontend POSTs to `/api/regenerate-week` with `binderId`, `weekIndex`, `model`
- Backend returns WebSocket URL: `/ws/regenerate-week/{binderId}/{weekIndex}?model=...`
- WebSocket handler deletes only that week's steps and regenerates content
- Sends same events: `week_started`, `week_info`, `step_completed`, `week_completed`, `week_regeneration_complete`

**New API Endpoints:**
```
DELETE /api/steps/:id          - Delete a step (curator only)
POST   /api/regenerate-week    - Start week regeneration
WebSocket /ws/regenerate-week/:binderId/:weekIndex - Stream regeneration
```

**UI Changes:**
- "Regenerate Week" button added below Weekly Summary RichTextEditor
- Uses secondary variant, consistent with full regeneration button
- Shows confirmation dialog if week has existing content
- Supports Cmd/Ctrl+click for mock mode testing
- Disabled during any generation

**Files Modified:**
- `server/storage.ts` - Added `getStep()`, `getWeek()`, `deleteStepsByWeekId()` methods
- `server/routes.ts` - Added DELETE /api/steps/:id and POST /api/regenerate-week endpoints
- `server/index.ts` - Added WebSocket route for /ws/regenerate-week/
- `server/websocket/generateSyllabind.ts` - Added `handleRegenerateWeekWS()` and `mockRegenerateWeek()` functions
- `server/utils/syllabindGenerator.ts` - Added `regenerateWeek()` function
- `client/src/pages/SyllabindEditor.tsx` - Added button, state, handlers, and confirmation dialog

### Backend Test Suite Expansion (2026-02-09)

**Problem:** Test coverage only included ~37% of server features: basic storage operations, auth workflow, a subset of binder routes, and markdownToHtml utility. ~25 API routes and 2 utility modules had zero test coverage.

**Solution:** Added 10 new test files covering all untested API routes and utility modules, expanding from 4 to 14 test suites (41 → 151 tests).

**New Test Files:**
- `server/__tests__/user-routes.test.ts` - GET/PUT user profiles, toggle-curator (9 tests)
- `server/__tests__/curator-routes.test.ts` - Curator binders, delete, batch-delete, publish, classmates, step delete (17 tests)
- `server/__tests__/enrollment-routes.test.ts` - CRUD enrollments, share-profile toggle (13 tests)
- `server/__tests__/completion-routes.test.ts` - Step complete/incomplete, completed-steps list (7 tests)
- `server/__tests__/submission-routes.test.ts` - Create submissions, feedback with ownership chain (8 tests)
- `server/__tests__/analytics-routes.test.ts` - Analytics, completion rates, completion times (7 tests)
- `server/__tests__/ai-generation-routes.test.ts` - Generate binder, regenerate week with validation (14 tests)
- `server/__tests__/rateLimitCheck.test.ts` - Rate limit status checking, 429/529 handling (6 tests)
- `server/__tests__/claudeClient.test.ts` - Model selection, executeToolCall dispatch (10 tests)

**Infrastructure Updates:**
- `jest.setup.js` - Added ~22 missing storage method mocks (getUser, getSyllabus, getEnrollmentById, etc.)
- `server/__tests__/setup/mocks.ts` - Added default return values for all new mocks in resetAllMocks()

**Coverage:** All auth (401), authorization (403), not-found (404), and validation (400) cases covered for each protected route.

### Test Coverage Improvement (2026-02-09)

**Problem:** Despite 151 tests, coverage was only ~6% because route tests recreated logic inline instead of testing real server code, and many untestable files inflated the denominator.

**Solution:** Three-pronged approach:

1. **Excluded irrelevant files from coverage** (`jest.config.cjs`): Dev scripts (`add-test-users.ts`, `import-csv.ts`), legacy code (`replit_integrations/`), config files (`static.ts`, `db.ts`, `vite.ts`), AI streaming modules (`syllabindGenerator.ts`, `websocket/**`), and OAuth providers (`googleAuth.ts`, `appleAuth.ts`).

2. **Enhanced test infrastructure** (`jest.setup.js`): Replaced flat db mock with chainable Proxy that supports any method chain (`.select().from().where().orderBy().limit()` etc.). Added mocks for `multer`, `express-session`, `connect-pg-simple`, and `server/auth` module. Changed storage mock to export under `{ storage: {...} }` matching the real module structure.

3. **Added 6 new integration test files** testing real code paths:
   - `routes-integration.test.ts` — Tests the actual `registerRoutes()` function via supertest (72 tests)
   - `storage-integration.test.ts` — Tests the real `DatabaseStorage` class against mocked db (37 tests)
   - `auth-middleware.test.ts` — Tests real `isAuthenticated` middleware (3 tests)
   - `emailAuth-routes.test.ts` — Tests real email auth route handlers (6 tests)
   - `webSearch.test.ts` — Tests deprecated module throws correctly (2 tests)
   - `schema-validation.test.ts` — Tests all Zod validation schemas (30 tests)

**Other changes:**
- `server/routes.ts` — Renamed `__filename`/`__dirname` to `currentFilePath`/`currentDirPath` to avoid CJS variable collision in tests
- `ts-jest-mock-import-meta` added as dev dependency for `import.meta.url` support in tests
- `jest.config.cjs` — Added `diagnostics: false` and AST transformer for import.meta

**Results:** 20 test suites, 319 tests, all passing. Coverage: statements 79.8%, branches 66.1%, functions 77.2%, lines 80.7% — all above thresholds (70/60/65/70).

### WebSocket Authentication & Authorization (2026-02-09)

**Problem:** WebSocket endpoints (`/ws/generate-binder/`, `/ws/regenerate-week/`) bypassed Express middleware entirely, allowing unauthenticated users to connect and perform destructive operations on any binder by guessing integer IDs.

**Solution:**

1. **WebSocket Authentication Helper** (`server/auth/index.ts`):
   - Added `authenticateWebSocket(req: IncomingMessage)` function
   - Parses `connect.sid` cookie, unsigns with `cookie-signature`, looks up session in PostgreSQL, resolves user
   - Extracted session secret to module-level variable shared between `setupCustomAuth` and `authenticateWebSocket`

2. **Connection-Level Auth + Ownership** (`server/index.ts`):
   - All WebSocket connections now authenticate via session cookie (close code 4401 if unauthenticated)
   - Ownership verified: `binder.curatorId === user.username` (close code 4403 if not owner)
   - Binder existence checked (close code 4404 if not found)

**Files Modified:**
- `server/auth/index.ts` - Added `authenticateWebSocket()`, extracted session secret
- `server/index.ts` - Added auth + ownership checks in WebSocket connection handler
- `jest.setup.js` - Added `authenticateWebSocket` to auth mock

### Fix AI Autogenerate Button Not Working (2026-02-15)

**Problem:** The "Autogenerate with AI" button got stuck at "Starting generation..." with a spinner that never stopped. The POST to `/api/generate-binder` succeeded, but the WebSocket connection never delivered messages.

**Root cause chain:**
1. `authenticateWebSocket()` in `server/auth/index.ts` called `db.execute()` which returns a `pg.QueryResult` object (has `.rows` property), but the code cast it as `any[]` and tried to access `result[0].sess` — this threw `TypeError: Cannot read properties of undefined`
2. The catch block returned `null`, so auth always failed for WebSocket connections
3. The server closed the WebSocket with code 4401, sending no error message payload
4. The frontend had no `ws.onclose` handler, so `isGenerating` was never reset — the UI hung

**Fixes:**

1. **Fixed `authenticateWebSocket` result handling** (`server/auth/index.ts`):
   - Changed `(result as unknown) as any[]` to `(result as any).rows as any[]` to correctly access pg.QueryResult rows

2. **Added `ws.onclose` handlers to frontend** (`client/src/pages/SyllabindEditor.tsx`):
   - Both `handleAutogenerate` and `handleRegenerateWeek` WebSocket connections now have `onclose` handlers
   - Resets `isGenerating`/`generatingWeeks`/`regeneratingWeekIndex` state on unexpected close
   - Shows meaningful error toast based on close code (4401→auth, 4403→forbidden, 4404→not found)

3. **Server sends error messages before closing WebSocket** (`server/index.ts`):
   - All early-close paths (auth failure, missing binderId, not found, forbidden, invalid weekIndex) now send a JSON error message via `ws.send()` before `ws.close()`
   - Error messages use the standard `{ type: 'error', data: { message: '...' } }` format

4. **Reverted `max_tokens` to 8192** (`server/utils/syllabindGenerator.ts`):
   - Previous edit increased from 4000 to 16000; normalized to 8192 as a balance between cost and sufficiency

**Files Modified:**
- `server/auth/index.ts` - Fixed `.rows` access on pg.QueryResult
- `server/index.ts` - Added error messages before WebSocket close on all early-close paths
- `client/src/pages/SyllabindEditor.tsx` - Added `ws.onclose` handlers for both generation flows
- `server/utils/syllabindGenerator.ts` - Set `max_tokens` to 8192

### First-Time Experience Flow Rebuild (2026-02-15)

**Changes:**

1. **Dashboard.tsx — New welcome screen for users with no enrollments:**
   - Replaced the `<Catalog />` early-return with a two-card welcome screen
   - "Build your own course" card (Wand2 icon + AI badge) → links to `/curator/binder/new`
   - "Choose from existing courses" card (BookOpen icon) → links to `/catalog`
   - Uses AnimatedPage/AnimatedCard for entrance animations

2. **Layout.tsx — Curator Studio always visible:**
   - Removed `user?.isCurator` conditional from both desktop and mobile nav
   - "Curator Studio" link now shows for all authenticated users

3. **Layout.tsx — Removed curator/reader toggle:**
   - Removed "Switch to Reader" / "Switch to Curator" dropdown menu item
   - Removed `toggleCuratorMode` and `PenTool` imports

4. **Login.tsx — Removed role selection from signup:**
   - Removed "I am primarily a..." radio group from signup form
   - Removed `role` state and `isCurator: role === 'curator'` from request body
   - Removed `RadioGroup`/`RadioGroupItem` imports

**Files Modified:**
- `client/src/pages/Dashboard.tsx` - Welcome screen with two-card layout
- `client/src/components/Layout.tsx` - Unconditional nav, removed toggle
- `client/src/pages/Login.tsx` - Removed role picker

### Fix Completed Binders Not Showing on Dashboard (2026-02-15)

**Problem:** The "Completed Journeys" section on the Dashboard never displayed any binders because `completedBinderIds` was always `[]` (hardcoded with a `// TODO` comment). Users who completed binders couldn't see them on their dashboard.

**Root cause:** `refreshEnrollments()` in `store.tsx` only tracked the active in-progress enrollment and never extracted completed enrollment data from the API response.

**Fixes:**

1. **`store.tsx` - `refreshEnrollments()`:** Extract `completedSyllabusIds` from enrollments with `status: 'completed'`. Only use in-progress enrollment for active (removed fallback to completed/dropped enrollments).

2. **`store.tsx` - `completeActiveBinder()`:** When a binder is completed, add its ID to `completedBinderIds` and clear `activeBinderId` so the user isn't shown a completed binder as "Current Focus".

3. **`Dashboard.tsx` - Welcome screen guard:** Added `completedBinders.length === 0` check so users with completed binders (but no active enrollment) see the dashboard with "Completed Journeys" instead of the first-time welcome screen.

**Files Modified:**
- `client/src/lib/store.tsx` - Fixed `refreshEnrollments()` and `completeActiveSyllabus()`
- `client/src/pages/Dashboard.tsx` - Updated welcome screen guard

### Ensure Completed Binders Always Show on Dashboard (2026-02-15)

**Problem:** Completed binders only appeared in the "Completed Journeys" section if the enrollment had been explicitly marked as `completed` via a debug dropdown. There was no proper UX flow to transition a 100%-complete binder into the completed state, so the Completed Journeys section was effectively empty for most users.

**Fixes:**

1. **`Completion.tsx` - Auto-complete enrollment:** When the user visits the completion/certificate page, the enrollment is automatically marked as `completed` via `completeActiveBinder()`. Uses a ref to prevent duplicate calls.

2. **`Dashboard.tsx` - "Mark Complete" button:** Added an explicit "Mark Complete" button on the active binder card when progress is 100%, allowing users to finalize completion directly from the Dashboard.

3. **`Dashboard.tsx` - Loading state:** Added enrollment/binders loading check before rendering to prevent the welcome screen from flashing while data loads.

**Files Modified:**
- `client/src/pages/Completion.tsx` - Auto-complete enrollment on mount
- `client/src/pages/Dashboard.tsx` - Loading state, "Mark Complete" button

### Fix Weeks Array Not Expanding During Regeneration (2026-02-16)

**Problem:** When regenerating a binder with more weeks than previously existed (e.g., going from 1 week to 3), the `formData.weeks` array only had slots for the original weeks. All WebSocket handlers used `if (newWeeks[weekIdx])` guards that silently skipped data for weeks beyond the array length. This caused new week tabs to not appear during generation and steps/metadata for new weeks to be silently dropped.

**Root Cause:** `handleAutogenerate()` never resized `formData.weeks` to match `formData.durationWeeks` before starting generation.

**Solution:**
1. **Pre-resize weeks array:** Added `setFormData` call before WebSocket connection in `handleAutogenerate` that expands `formData.weeks` to match `durationWeeks`, creating empty week entries for any missing slots.
2. **Resilient WebSocket handlers:** Changed all 6 handlers (4 in `handleAutogenerate`, 2 in `handleRegenerateWeek`) from silently skipping missing week slots to creating the week entry on-the-fly. Each handler now checks `if (!newWeeks[weekIdx])` and creates a placeholder week before proceeding.

**Handlers Updated:**
- `week_started` — creates week slot before clearing steps
- `week_info` — creates week slot before setting title/description
- `step_completed` — creates week slot before pushing step (both full generation and single-week regeneration)
- `week_completed` — creates week slot before setting final title/description

**Files Modified:**
- `client/src/pages/SyllabindEditor.tsx` — Pre-resize logic + 6 handler resilience fixes

### Rate Limit Retry and Generation Cancellation (2026-02-16)

**Problem:** During AI binder generation, 429 rate limit errors caused silent failures — the Anthropic SDK's built-in retry (`maxRetries: 2`) waited silently, leaving the user seeing generation "stuck" with no feedback. When retries were exhausted mid-generation, partial data was left behind. Additionally, users had no way to cancel a running generation.

**Solution:**

1. **Rate limit retry with user-visible feedback** (`server/utils/syllabindGenerator.ts`):
   - Set `maxRetries: 0` on the Anthropic client to disable SDK's silent retry
   - Created `createMessageWithRateLimitRetry()` wrapper that handles 429 errors explicitly
   - On 429: extracts `resetIn` from response headers, sends `rate_limit_wait` WebSocket message to client, sleeps for the wait period (capped at 90s), then retries (up to 3 times)
   - Non-429 errors pass through immediately
   - Applied to all `client.messages.create()` calls in both `generateSyllabind()` and `regenerateWeek()`

2. **Client-side rate limit display** (`client/src/pages/SyllabindEditor.tsx`):
   - Both WebSocket `onmessage` handlers process `rate_limit_wait` messages
   - Updates generation progress status to "Rate limited — resuming in Xs... (retry N/3)"
   - Generation continues (not treated as failure) — `isGenerating` stays true

3. **Cancel generation button** (client + server):
   - **Client:** WebSocket stored in `useRef` for persistence across renders. Cancel button added to generation progress card. On click: closes WebSocket, resets all generation state, shows confirmation toast.
   - **Server:** `handleGenerateBinderWS` and `handleRegenerateWeekWS` listen for `ws.on('close')` and trigger an `AbortController`. The abort signal is passed to generator functions and Anthropic API calls (`signal` parameter). Before each API call, the signal is checked — if aborted, generation stops cleanly. On cancellation, binder status is set back to `'draft'`.

**Files Modified:**
- `server/utils/syllabindGenerator.ts` - `maxRetries: 0`, `createMessageWithRateLimitRetry()`, abort signal checks in generation loops
- `server/websocket/generateSyllabind.ts` - AbortController wired to `ws.on('close')`, signal passed to generators, safe ws.close() checks
- `client/src/pages/SyllabindEditor.tsx` - `generationWsRef`, `handleCancelGeneration()`, `rate_limit_wait` handler, cancel button UI

### Hybrid Single-Call Binder Generation (2026-02-16)

**Problem:** Generating a 4-week binder required 4+ API calls (one per week), increasing latency and rate limit exposure.

**Solution:** Hybrid approach that asks Claude to generate all weeks in one call, with automatic fallback to per-week if the response is truncated.

**Changes:**
1. **System prompt:** Changed from "generate one week at a time" to "generate ALL N weeks, call finalize_week for each sequentially"
2. **User message:** Changed from "Generate Week 1" to "Generate all N weeks"
3. **max_tokens:** Increased from 4096 to 8192 to accommodate all weeks in one response
4. **Fallback prompt:** Updated to ask for all remaining weeks instead of just the next one
5. **week_started event:** Moved inside finalize_week processing so it fires for each week even when multiple arrive in one response

**How the Hybrid Works:**
- **Best case (1 call):** Claude generates all weeks → loop processes them all, exits
- **Partial case (2 calls):** Claude generates some weeks, hits output limit → loop saves partial progress, prompts for remaining weeks
- **Worst case (N calls):** Falls back to current behavior — one week per call

The existing while loop (`while weekIndex <= durationWeeks`) provides natural fallback — it continues until all weeks are done regardless of how many arrive per response. Partial progress is always saved to the database before the next API call.

**Files Modified:**
- `server/utils/syllabindGenerator.ts` - System prompt, user message, max_tokens, fallback prompt, week_started placement

### Fix Ghost Duplicate Week Tabs (2026-02-16)

**Problem:** The SyllabindEditor week picker could show duplicate "Week N" tabs where one was a non-selectable ghost. This happened because Claude could send duplicate `weekIndex` values in `finalize_week` tool calls, and the server trusted Claude's value (`toolInput.weekIndex || weekIndex`). Duplicate DB rows with the same index caused ghost tabs in the Radix Tabs component (two TabsTriggers with the same `value`).

**Fixes:**

1. **Server: use sequential counter for week index** (`server/utils/syllabindGenerator.ts`):
   - Changed `actualWeekIndex = toolInput.weekIndex || weekIndex` to `actualWeekIndex = weekIndex`
   - The sequential counter guarantees unique, ordered week indexes regardless of what Claude sends

2. **Frontend: deduplicate weeks by index** (`client/src/pages/SyllabindEditor.tsx`):
   - Added `uniqueWeeks` memo that filters `formData.weeks` to keep only the first occurrence of each index
   - Tab triggers and tab content now render from `uniqueWeeks` instead of `formData.weeks`
   - Prevents ghost tabs even if duplicate-index weeks somehow make it into state

**Files Modified:**
- `server/utils/syllabindGenerator.ts` - Use counter-based weekIndex instead of Claude's value
- `client/src/pages/SyllabindEditor.tsx` - Added `useMemo` import, `uniqueWeeks` dedup, render from deduped list

### Improve Generation Link Quality & Content Completeness (2026-02-16)

**Problems:**
1. AI-generated readings sometimes had empty content (no url, note) because the tool schema only required `type` and `title`
2. Haiku hallucinated URLs when it ran out of web searches (5 searches for 12+ readings was insufficient)

**Changes:**

1. **Batched generation** (`server/utils/binderGenerator.ts`): `generateBinder` now processes weeks in batches of 2. Each batch starts a fresh conversation with its own system prompt and search budget, preventing context bloat from accumulated search results. An 8-week binder = 4 batches.
2. **Simplified search budget** (`server/utils/claudeClient.ts`): Replaced static `SYLLABIND_GENERATION_TOOLS` with `getGenerationTools()` returning 10 searches per batch (~5/week). No dynamic scaling needed since batches are always 1-2 weeks.
2. **Added field descriptions to tool schema** (`server/utils/claudeClient.ts`): `url`, `note`, and `promptText` properties now have descriptions emphasizing they are required and URLs must come from search results
3. **Strengthened system prompts** (`server/utils/syllabindGenerator.ts`): Both `generateSyllabind` and `regenerateWeek` prompts now explicitly require every reading to have a URL and note, every exercise to have promptText
4. **Server-side URL validation** (NEW `server/utils/validateUrl.ts`): Lightweight HEAD-request checker with 5s timeout. Invalid URLs are stripped (set to null) rather than blocking the step — the reading is saved with its metadata and the curator can add a working URL later
5. **URL validation integrated** (`server/utils/syllabindGenerator.ts`): Both `generateSyllabind` and `regenerateWeek` validate reading URLs before saving to database. Warnings logged for stripped URLs.

**Files:**
- `server/utils/claudeClient.ts` - Increased `max_uses`, added schema descriptions
- `server/utils/syllabindGenerator.ts` - Stronger prompts, URL validation before step creation
- `server/utils/validateUrl.ts` - New URL validation utility (HEAD request, 5s timeout, follows redirects)

### URL Repair Pass + Rate Limit UX Improvements (2026-02-16)

**Problems:**
1. Haiku often fails to include URLs in readings during complex generation tasks (prompt engineering ceiling reached)
2. When rate limits exhaust all retries, a red "destructive" toast appears and generation fully stops with no auto-recovery

**Part 1: URL Repair Pass**

After each 2-week batch completes, readings without URLs are collected. If any exist, a focused API call asks Claude to search for and provide URLs for those specific readings. This separates "find URLs" (simple, focused task) from "generate curriculum" (complex, multi-step task).

**Architecture:**
- `repairMissingUrls()` function in `syllabindGenerator.ts` takes a list of missing-URL readings
- Uses `provide_urls` tool schema (`claudeClient.ts`) — Claude searches for each reading, calls the tool once with all results
- Search budget: `min(missingCount * 2, 10)` — 2 searches per reading, capped at 10
- Each URL validated via `validateUrl()` before saving via `storage.updateStepUrl()`
- Non-fatal: if repair fails, generation continues with URL-less readings
- Three new WebSocket messages: `url_repair_started`, `step_url_repaired`, `url_repair_complete`

**Part 2: Rate Limit UX**

- Server: `MAX_RETRIES` increased from 5 to 10; max backoff cap from 16s to 60s
- Client: `rate_limit_wait` messages show friendly copy ("Lots of curators are building right now — please hold on!")
- Client: When all retries exhausted (`generation_error` with `isRateLimit: true`), progress card shows countdown and auto-retries after cooldown instead of showing red toast and killing progress
- Cancel button works during rate limit countdown via `rateLimitRetryRef`

**Files Modified:**
- `server/storage.ts` - Added `updateStepUrl(stepId, url)` to `IStorage` interface and `DatabaseStorage`
- `server/utils/claudeClient.ts` - Added `PROVIDE_URLS_TOOL` constant and `getRepairTools(searchBudget)` function
- `server/utils/syllabindGenerator.ts` - Added `repairMissingUrls()`, integrated into `generateSyllabind()` and `regenerateWeek()`, increased MAX_RETRIES to 10, max backoff to 60s
- `client/src/pages/SyllabindEditor.tsx` - 3 new WebSocket message handlers in both generation and regen flows, friendly rate limit copy, auto-retry on rate limit exhaustion, `rateLimitRetryRef`
- `server/__tests__/setup/mocks.ts` - Added `updateStepUrl` mock
- `jest.setup.js` - Added `updateStepUrl` mock

### URL Repair & Validation Robustness (2026-02-16)

**Problem:** URL repair pass was silently failing for later batches (weeks 4-6 of 8 consistently missing links). Three compounding issues:

1. **Token limit too low** (`max_tokens: 2048`): Web search results from Anthropic API include full page snippets. With 6+ readings and 10+ searches, Claude hit the output limit before calling `provide_urls` — the tool was never invoked.
2. **No retry when tool not called**: If Claude ended the turn without calling `provide_urls` (due to token exhaustion or text output), all found URLs were silently lost with no second attempt.
3. **HEAD-only URL validation**: Academic sites (jstor, arxiv, .edu) commonly block HEAD requests or return 403. Valid URLs were being stripped during both generation and repair.

**Fixes:**

1. **URL validation with GET fallback** (`server/utils/validateUrl.ts`):
   - Phase 1: HEAD request (fast). If 200-299, accept. If 403, accept as "exists" (academic paywalls).
   - Phase 2: If HEAD returns 405/406/5xx/network error, fall back to GET request.
   - Quick `new URL()` syntax check before any network calls.

2. **Multi-turn repair with higher limits** (`server/utils/syllabindGenerator.ts`):
   - `max_tokens`: 2048 → 4096 (room for web search results + tool call)
   - Search budget: `min(count * 2, 10)` → `min(count * 3, 20)` (3 searches per missing reading)
   - Multi-turn retry loop (up to 3 turns): if Claude doesn't call `provide_urls`, prompt it again
   - Web search result blocks filtered from conversation history between turns
   - Stronger prompt: explicit instruction to ONLY use tools, no text explanations

3. **Higher generation search budget** (`server/utils/claudeClient.ts`):
   - `max_uses`: 10 → 14 per batch (~7 searches per week instead of ~5)

**Files Modified:**
- `server/utils/validateUrl.ts` - HEAD+GET two-phase validation, 403 accepted
- `server/utils/syllabindGenerator.ts` - Multi-turn repair, 4096 tokens, higher search budget
- `server/utils/claudeClient.ts` - 14 web searches per generation batch

### YouTube oEmbed Validation, Placeholder & Index URL Detection (2026-02-22)

**Problem:**
1. Claude fabricates placeholder YouTube URLs like `?v=example` that pass HEAD/GET (YouTube returns 200 for any `watch?v=` URL)
2. Claude returns profile/channel pages (e.g. `youtube.com/@channel`, `open.spotify.com/show/xxx`) instead of specific videos/episodes — these also pass HEAD/GET since the pages exist

**Fixes:**

1. **Placeholder URL detection** (`server/utils/validateUrl.ts`):
   - Before any HTTP validation, reject URLs containing known hallucination patterns: `example`, `placeholder`, `test`, `sample`, `fake`, `lorem`
   - Uses word-boundary matching (`\b`) so "test" doesn't false-positive on "latest", "greatest", "contest", etc.
   - Video ID placeholder check uses substring matching (correct for opaque ID strings)

2. **YouTube oEmbed validation** (`server/utils/validateUrl.ts`):
   - YouTube/YouTube Music URLs routed through `validateYouTubeUrl()` instead of HEAD/GET
   - Video ID extracted from `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`, `youtube.com/v/`, `music.youtube.com/watch?v=`
   - IDs rejected if they don't match YouTube's 11-character `[a-zA-Z0-9_-]{11}` format
   - oEmbed API confirmation: `https://www.youtube.com/oembed?url=<URL>&format=json`
   - **Fault-tolerant**: only rejects on explicit 404/401; network errors, timeouts, and rate limits (429/5xx) fall back to accepting (format + isIndexUrl already filter hallucinations)

3. **Index/directory URL rejection** (`server/utils/validateUrl.ts`):
   - `isIndexUrl()` uses an allowlist approach for all media platforms — only known specific-resource paths pass, everything else is rejected
   - **Bare domains**: `https://medium.com/` rejected (no meaningful path)
   - **YouTube**: only `/watch`, `/embed/`, `/v/` (channels, profiles, playlists, shorts, live, search all rejected)
   - **YouTube Music**: only `/watch` (artist/playlist/album pages rejected)
   - **Spotify**: only `/episode/`, `/track/` (show, artist, playlist, album, user pages all rejected)
   - **Apple Podcasts**: must have `?i=` episode param (show pages rejected)
   - **Apple Music**: only `/song/`, `/music-video/`, or `?i=` album-track param (artist/album index pages rejected)
   - **SoundCloud**: must have two path segments `/artist/track` (profile pages rejected)
   - **Vimeo**: only numeric video IDs (channels, groups, user pages rejected)
   - Runs before any HTTP call — zero network cost

**Files Modified:**
- `server/utils/validateUrl.ts` - `validateYouTubeUrl()`, `extractYouTubeVideoId()`, `hasPlaceholderPattern()`, `isIndexUrl()`, integrated pre-checks in `validateUrl()`
- `server/__tests__/validateUrl.test.ts` - New test file covering YouTube validation, placeholder detection, index URL rejection, and non-YouTube fallback

### Two-Phase Generation — Coherent Curriculum (2026-02-16)

**Problem:**
When generating 8-week binders, weekly topics were random and duplicated (e.g., "Foundations of AI Evaluation" appearing 3 times). Root cause: weeks are generated in batches of 2, each batch starting a fresh conversation with no knowledge of other batches. For 8 weeks = 4 independent batches independently picking similar topics.

Additionally, regenerating a single week was replacing the title and summary, when users expected only the readings/exercises to change.

**Solution: Two-Phase Generation**

**Phase 1 — Plan Curriculum:** A single API call (no web search) generates all week titles and descriptions as a structured outline using the `plan_curriculum` tool. These are saved to DB and streamed to the client immediately via a `curriculum_planned` WebSocket message.

**Phase 2 — Generate Content:** Each batch receives the full curriculum outline in its system prompt. The prompt instructs Claude to generate only readings and exercises — titles and descriptions are pre-set. The `finalize_week` tool no longer requires `title` in its schema.

**Week Regeneration:** When regenerating a single week, the existing title/description are preserved. The system prompt includes the week's topic and the full outline for context. Only steps (readings/exercises) are regenerated.

**Architecture:**
- `planCurriculum()` in `syllabindGenerator.ts`: Single API call with `plan_curriculum` tool, 2 retries
- `buildOutlineString()`: Formats curriculum for inclusion in batch system prompts
- `generateSyllabind()` Phase 1 saves weeks to DB, sends `curriculum_planned`, then Phase 2 batches reference pre-created weeks
- `regenerateWeek()` accepts `weekTitle`, `weekDescription`, `allWeeksOutline` — preserves title/description, includes outline context
- `handleRegenerateWeekWS()` fetches all weeks and passes outline + existing title/description

**Client Changes:**
- `curriculum_planned` handler populates all week titles/descriptions immediately
- `week_started` clears only `steps`, preserves `title`/`description`
- Week regeneration dialog clarifies that title/summary are preserved

**New WebSocket Messages:**
- `curriculum_planned` — sent after Phase 1 with `{ weeks: [{ weekIndex, title, description }] }`

**Files Modified:**
- `server/utils/claudeClient.ts` — Added `PLAN_CURRICULUM_TOOL`, `getPlanningTools()`, `plan_curriculum` case in `executeToolCall()`, made `title` optional in `FINALIZE_WEEK_TOOL`
- `server/utils/syllabindGenerator.ts` — Added `planCurriculum()`, `buildOutlineString()`, `CurriculumWeek` type, two-phase `generateSyllabind()`, updated `regenerateWeek()` with title preservation
- `server/websocket/generateSyllabind.ts` — Updated mock functions for `curriculum_planned`, preserved titles in mock regen, passed outline/title to `regenerateWeek()`
- `client/src/pages/SyllabindEditor.tsx` — Added `curriculum_planned` handler, preserved titles in `week_started` and regeneration, updated dialog text

### Generation Data Quality — Missing Fields Fix (2026-02-16)

**Problems:**
1. `estimatedMinutes` absent for some weeks — Claude omits the field and it saves as null
2. `creationDate` never displayed — tool schema used `dd/mm/yyyy` format but JS `new Date()` can't parse it
3. URLs missing for later weeks (6/7) — per-batch repair pass doesn't catch all, no cross-batch sweep

**Changes:**

1. **creationDate format fix**: Changed tool schema and prompts from `dd/mm/yyyy` to `YYYY-MM-DD` (ISO format). WeekView now handles both legacy and ISO formats with a parser that detects `dd/mm/yyyy` and converts manually.

2. **estimatedMinutes defaults**: Added `defaultEstimatedMinutes()` helper in `syllabindGenerator.ts` — uses 15 min for readings, 30 min for exercises when Claude omits the value. Applied at all 4 step-save locations.

3. **Stronger prompts**: Both generation and regeneration prompts now explicitly require `estimatedMinutes` on every step and `creationDate` on every reading (with "if unknown, use best estimate").

4. **Final URL sweep**: After all batches complete, `generateBinder()` now queries all weeks/steps from the DB and collects any readings still missing URLs across the entire binder. Runs one final `repairMissingUrls()` pass for cross-batch coverage.

5. **Reader page filtering**: WeekView and BinderOverview hide readings without URLs from readers. Step counts and time estimates only include visible steps. Week locking/progression logic excludes URL-less readings.

**Files Modified:**
- `server/utils/claudeClient.ts` — creationDate description changed to YYYY-MM-DD
- `server/utils/syllabindGenerator.ts` — `defaultEstimatedMinutes()`, stronger prompts, final URL sweep
- `client/src/pages/WeekView.tsx` — Date parsing fix, filter out URL-less readings, adjusted locking logic
- `client/src/pages/SyllabindOverview.tsx` — Filter out URL-less readings from step list and counts

### AI-Powered "Improve Writing" Button (2026-02-16)

Added real AI text improvement to the RichTextEditor's "Improve writing" button (previously a stub).

**How it works:**
- `POST /api/improve-text` — Authenticated endpoint that sends HTML to Haiku for grammar, spelling, and punctuation fixes
- System prompt instructs the model to preserve HTML structure, meaning, and tone
- Frontend replaces editor content with the improved text on success

**Endpoint:** `POST /api/improve-text` (auth required, 50KB limit)

**Files Modified:**
- `server/routes.ts` — Added `POST /api/improve-text` endpoint using `client` and `CLAUDE_MODEL` from `claudeClient.ts`
- `client/src/components/ui/rich-text-editor.tsx` — Replaced stub `handleImproveWriting` with real `fetch` call

### Accurate Generation Progress Status (2026-02-16)

**Problem:** The progress card immediately showed "Generating Week 1 of X" when generation started, but the first phase is actually planning the overall course structure (not generating any week content). This made the status misleading.

**Solution:** Added a `planning_started` WebSocket event and updated the progress card to distinguish between the planning and content generation phases.

**Progress flow now:**
1. "Planning X-week course structure..." — during Phase 1 (curriculum planning)
2. "Course outline ready — generating content..." — when `curriculum_planned` arrives
3. "Generating Week N of X" — during Phase 2 (per-week content generation)

**Changes:**
- Server sends `planning_started` event at start of `generateSyllabind()` before calling `planCurriculum()`
- Client initializes `generatingWeeks` as empty set (no week placeholder shown during planning)
- Progress card header shows "Planning course structure..." when `currentWeek === 0`
- Progress bar shows 5% during planning phase instead of 0%
- Percentage badge hidden during planning phase

**Files Modified:**
- `server/utils/syllabindGenerator.ts` — Added `planning_started` WebSocket event before Phase 1
- `server/websocket/generateSyllabind.ts` — Added `planning_started` event to mock generator
- `client/src/pages/SyllabindEditor.tsx` — Added `planning_started` handler, updated initial state, updated progress card to handle planning phase

### Duplicate Weeks Prevention (2026-02-17)

**Problem:** Concurrent generation requests on the same binder (e.g., double-clicking "Generate") created duplicate week rows (same `binderId` + `index`). The `getBinderWithContent` query returned all duplicates, causing the BinderOverview accordion to show 12 weeks instead of 6.

**Root cause:** No unique constraint on `weeks(binder_id, index)` and no guard against triggering generation while one is already in progress.

**Fixes:**
1. **Concurrent generation guard** — `POST /api/generate-binder` now returns 409 if binder status is already `'generating'`
2. **Week deduplication** — `getBinderWithContent` deduplicates weeks by index, keeping only the highest-ID week per index (most recent generation)
3. **Unique constraint** — Added `uniqueIndex("weeks_binder_id_index_idx")` on `(binderId, index)` in schema + migration to clean up existing duplicates

**Migration:** `migrations/0004_deduplicate_weeks_unique_constraint.sql` — deletes duplicate weeks (keeping latest), then adds unique index.

**Files Modified:**
- `server/routes.ts` — Added 409 guard for concurrent generation
- `server/storage.ts` — Deduplicate weeks by index in `getSyllabusWithContent`
- `shared/schema.ts` — Added unique index on `weeks(binder_id, index)`
- `migrations/0004_deduplicate_weeks_unique_constraint.sql` — New migration

### PostHog Analytics Integration (2026-02-17)

**Objective:** Add product analytics to track user behavior, engagement funnels, and feature adoption.

**Setup:**
- Installed `posthog-js` and `@posthog/react`
- `PostHogProvider` wraps the app in `client/src/main.tsx`
- User identification on login/logout in `client/src/lib/store.tsx`
- 6 custom events instrumented across 3 files

**Files Modified:**
- `client/src/main.tsx` — PostHogProvider setup
- `client/src/lib/store.tsx` — User identification + 4 custom events (enroll, step complete, binder complete, exercise submit)
- `client/src/pages/SyllabindEditor.tsx` — `syllabind_published` and draft `link_shared` events
- `client/src/components/ShareDialog.tsx` — `link_shared` event

### Bug Fixes: WeekView Loading Flash, Exercise Submit, Button Copy (2026-02-17)

**Issues Fixed:**
1. **"Not Found" flash on page load** — WeekView showed "Not found" briefly before binder data loaded. Added a `loading` state that shows a spinner during fetch, only showing "Not found" after loading completes with no data.
2. **Exercise submit didn't update UI** — `handleExerciseSubmit` called `saveExercise` (which updates store state) but never updated `localCompletedStepIds`. Since local state takes priority when non-empty, the step appeared incomplete after submission. Fixed by syncing local state after successful save.
3. **Button copy** — Changed exercise submit button from "Save & Complete" to "Submit".

**Defensive improvement:** `markStepComplete`, `markStepIncomplete`, and `saveExercise` in the store now accept an optional `enrollmentId` parameter, falling back to `enrollment?.id`. WeekView passes its locally-fetched `localEnrollmentId` so operations work correctly even when the global store enrollment doesn't match the viewed binder.

**Files Modified:**
- `client/src/pages/WeekView.tsx` — Loading state, local state sync fix, error toast, enrollmentId pass-through, button copy, exercise checkbox edit, submit loading spinner
- `client/src/lib/store.tsx` — Optional `enrollmentId` param on 3 functions + interface update

### Completion Page: Incomplete Assignments Guard (2026-02-17)

**Issue:** Navigating to `/binder/:id/completed` with missing steps showed "not found" (store's catalog list lacks full week/step data) and auto-completed the enrollment regardless.

**Fix:** Rewrote `Completion.tsx` to fetch full binder data and completed steps independently (same pattern as WeekView). The page now computes overall progress and conditionally renders:

- **Incomplete state (progress < 100%):** Amber warning icon, "Almost There!" heading, remaining assignment count, progress bar with step count, and CTAs for "Back to Last Week" and "Return to Binder Overview"
- **Complete state (100%):** Original celebration with confetti, award icon, congratulations message. Enrollment is only marked as completed in this state.

**Also fixed in WeekView:** `isLastWeek` previously compared `weekIndex` to `binder.durationWeeks` (a metadata field), which could be stale or mismatched with actual week data. Changed to compute `maxWeekIndex` from the actual weeks array. Additionally, if the user navigates to a non-existent week (past the last one), WeekView now redirects to the completion page instead of showing "Not found."

**Files Modified:**
- `client/src/pages/Completion.tsx` — Full rewrite with data fetching, progress computation, and incomplete/complete conditional rendering
- `client/src/pages/WeekView.tsx` — `isLastWeek` uses actual week data; redirect to completion page for non-existent weeks

### Fix: Week Locking Indicators on SyllabindOverview (2026-02-17)

**Issue:** SyllabindOverview showed a lock icon for ANY week that wasn't the current week or 100% complete. This meant past accessible weeks (e.g. Week 1 when user is on Week 3) appeared locked even though they were fully accessible.

**Fix:** Changed the week indicator logic to distinguish four states:
- **Completed** (checkmark): week is 100% done
- **Current** (chevron): the effective current week
- **Accessible** (week number): past weeks that aren't 100% done — shown with the week number instead of a lock
- **Locked** (lock icon): future weeks beyond the effective current week

Also added a "Go to Week N" mobile button for past accessible but incomplete weeks.

**Files Modified:**
- `client/src/pages/SyllabindOverview.tsx` — Week indicator logic + accessible week navigation button

### Fix: 0-Based Week Index Normalization (2026-02-17)

**Issue:** Some binders (e.g. AI-generated ones) stored week indices starting at 0 instead of 1. This caused cascading issues: Week 1 appeared locked, Dashboard's "Continue" button navigated to the wrong week, WeekView's prev/next navigation broke, and "Not found" appeared for non-existent weeks.

**Fix (API normalization):** The `GET /api/binders/:id` endpoint now normalizes week indices to 1-based after fetching from the database. Weeks are sorted by their original index and re-indexed as 1, 2, 3, etc. This fixes all frontend consumers at once.

**Fix (data-driven navigation in WeekView):** Replaced all hardcoded `weekIndex - 1` / `weekIndex + 1` arithmetic with actual prev/next week lookups from the sorted weeks array. `isLastWeek` is now `nextWeek === null`. Locking checks use `prevWeek` data. Navigation links use `prevWeek.index` / `nextWeek.index`.

**Files Modified:**
- `server/routes.ts` — Week index normalization in GET `/api/binders/:id`
- `client/src/pages/WeekView.tsx` — Data-driven prev/next week navigation

---

### Weeks/Steps Persistence Fix (2026-02-19)

**Problem:** The create and update binder routes discarded nested weeks/steps data. `POST /api/binders` only created the base binder row via `insertBinderSchema` (which strips unknown fields). `PUT /api/binders/:id` explicitly filtered out the `weeks` property in `storage.updateBinder()`. This meant the editor could save metadata (title, description, status) but all content (weeks and steps) was never persisted. Preview and overview pages showed empty binders.

**Solution:**
1. Added `saveWeeksAndSteps(binderId, weeksData)` method to storage — deletes existing weeks (steps cascade), then bulk-inserts new weeks and steps
2. Updated `POST /api/binders` to call `saveWeeksAndSteps` after creating the binder when `weeks` data is present
3. Updated `PUT /api/binders/:id` to call `saveWeeksAndSteps` after updating metadata when `weeks` data is present

**Files Modified:**
- `server/storage.ts` — Added `saveWeeksAndSteps` to IStorage interface and DatabaseStorage implementation
- `server/routes.ts` — Updated POST and PUT binder routes to persist weeks/steps

### Stripe Pro Subscription System (2026-02-19)

**Feature:** Added a $9.99/mo "Syllabind Pro" subscription using Stripe Checkout (redirect flow). Two gating rules:
- **Curators:** Free tier limited to 2 binders; Pro unlocks unlimited creation
- **Learners:** All enrollments require a Pro subscription

**Backend:**
- Added `stripeCustomerId` and `subscriptionStatus` columns to `users` table
- Added `subscriptions` table for audit trail (mirrors Stripe subscription lifecycle)
- Stripe client helper with lazy-init singleton (`server/lib/stripe.ts`)
- 5 new storage methods: `getUserByStripeCustomerId`, `getSubscriptionByStripeId`, `upsertSubscription`, `updateSubscriptionByStripeId`, `countBindersByCurator`
- Payment routes (`server/routes/stripe.ts`): subscription status, limits, checkout session, portal session
- Webhook handler (`server/routes/webhook.ts`): handles 5 Stripe event types with signature verification
- Gating in `POST /api/binders` (curator limit) and `POST /api/enrollments` (Pro required)

**Frontend:**
- `UpgradePrompt` dialog component with two variants (`curator-limit`, `enrollment-gate`)
- `returnTo` parameter support — users return to where they were after payment
- Subscription status in store with `isPro`, `subscriptionLimits`, `refreshSubscriptionLimits()`
- Profile page subscription card with "Manage Billing" (Pro) or upgrade CTA (free)
- CuratorDashboard gating at binder creation limit
- BinderOverview enrollment gating with upgrade prompt

**Files Created:**
- `server/lib/stripe.ts` — Stripe client singleton
- `server/routes/stripe.ts` — Payment API routes
- `server/routes/webhook.ts` — Stripe webhook handler
- `client/src/lib/stripe.ts` — Client-side Stripe utilities
- `client/src/components/UpgradePrompt.tsx` — Upgrade prompt dialog
- `server/__tests__/stripe-routes.test.ts` — 12 tests for payment routes
- `server/__tests__/webhook.test.ts` — 11 tests for webhook handling

**Files Modified:**
- `shared/schema.ts` — Added subscription fields and subscriptions table
- `server/storage.ts` — Added 5 new storage methods
- `server/routes.ts` — Wired payment routes, added gating logic
- `client/src/lib/types.ts` — Added subscription types
- `client/src/lib/store.tsx` — Added subscription state management
- `client/src/pages/CreatorDashboard.tsx` — Creation limit gating
- `client/src/pages/SyllabindOverview.tsx` — Enrollment gating
- `client/src/pages/Profile.tsx` — Subscription management card
- `jest.setup.js` — Added Stripe and subscription mocks
- `server/__tests__/setup/mocks.ts` — Added Pro user mocks
- `server/__tests__/routes-integration.test.ts` — Updated enrollment tests for Pro gating

### Fix: Audio/Video Materials Toggle (2026-02-22)

**Problem:** The Audio/Video Materials toggle ("Auto"/"Yes"/"No") wasn't affecting generation output, and the selection reset to "Auto" after clicking generate.

**Root Causes:**
1. `mediaPreference` was missing from the initial `formData` state (started as `undefined`), creating fragile data flow
2. After generation completed, `setFormData(updated)` replaced the full state with the DB response without preserving the user's selection
3. The generation prompt's media instruction was too weak — "MUST include at least 1" buried in a long rules list, easily ignored by the model

**Fixes:**
1. Added `mediaPreference: 'auto'` to initial formData state to prevent undefined-related issues
2. After generation completes, preserve `mediaPreference` from local state when refetching: `updated.mediaPreference || prev.mediaPreference || 'auto'`
3. Strengthened generation prompts — "Yes" mode now uses `IMPORTANT:` prefix, specifies search strategies ("topic YouTube", "topic podcast episode"), and labels it "a hard requirement from the curator"
4. Added server-side logging of `mediaPreference` value when generation starts

**Files Modified:**
- `client/src/pages/SyllabindEditor.tsx` — Initial state, generation_complete handler, pre-generation logging
- `server/utils/syllabindGenerator.ts` — Stronger media instructions in both `generateSyllabind` and `regenerateWeek`
- `server/websocket/generateSyllabind.ts` — Logging of mediaPreference before generation

### Media Preference: API Limitation Acknowledged (2026-02-22)

**Problem:** Despite `media_preference: 'yes'`, Claude (Sonnet 4.5) cannot reliably produce working YouTube/podcast URLs. It pulls video titles from training data but fabricates URLs with fake video IDs instead of extracting them from web search results. oEmbed validation correctly catches the fakes → URL stripped → reading saved with mediaType but no URL.

Multiple approaches were tried and abandoned:
1. **Stronger prompt wording** — Listing specific platforms, URL patterns, "MUST"/"CRITICAL" language. Claude ignores it.
2. **Post-generation media repair** — Dedicated API call with focused prompt + web search to find real URLs. Same fabrication problem; extra API calls with no improvement.

**Current approach:** The media instruction is kept short and best-effort. `mediaPreference: 'yes'` adds a soft instruction ("should include") rather than a hard requirement. The `'no'` preference is reliable (text-only constraint is easy to follow). The `'auto'` preference emits no instruction at all.

**Known limitation:** The Audio/Video Materials toggle is best-effort when set to "Yes". Claude may or may not include working media URLs. This is an API-level limitation with web search + URL generation that cannot be solved through prompt engineering alone.

**New storage method** (`storage.ts`): `updateStep(stepId, updates)` — general-purpose partial step update (added during this work, kept as a useful utility).

**Files Modified:**
- `server/utils/syllabindGenerator.ts` — Simplified media instructions (shorter, best-effort)
- `server/storage.ts` — `updateStep()` interface + implementation

### YouTube API Integration for Media URLs (2026-02-22)

**Problem:** Claude (Sonnet 4.5) cannot reliably produce working YouTube URLs. It fabricates video IDs from training data; oEmbed validation catches the fakes. Prompt engineering and LLM-based repair loops both failed.

**Solution:** Bypass the LLM entirely. After URL repair passes, use the YouTube Data API v3 to search for real videos by week topic when `mediaPreference === 'yes'`.

**Architecture:**

1. **`searchYouTube(query)`** (`server/utils/youtubeSearch.ts`): Calls `GET youtube/v3/search` with `part=snippet&type=video&maxResults=1`. Returns `{ videoId, title, channelTitle, publishedAt }` or null. 5s timeout. Graceful no-op if `YOUTUBE_API_KEY` not set.

2. **`ensureMediaUrl(weekId, weekTopic, ws)`** (`server/utils/syllabindGenerator.ts`): Post-repair pass that checks if a week already has a media reading with a verified URL. For `mediaType: 'Youtube video'`, verifies the URL is an actual YouTube URL using `extractYouTubeVideoId()` (Claude often sets this mediaType on non-YouTube websites that embed videos). If no verified media exists, calls `searchYouTube(weekTopic)` and updates a candidate reading via `storage.updateStep()`. Candidate selection prioritizes: (1) readings marked as YouTube with non-YouTube URLs, (2) readings without URLs and non-academic types, (3) any reading without a URL, (4) any non-academic reading. Sends `step_url_repaired` WebSocket event.

3. **Integration points:**
   - `generateSyllabind()` — after batch URL repair, loops through batch weeks calling `ensureMediaUrl()`
   - `regenerateWeek()` — after URL repair, calls `ensureMediaUrl()` using hoisted `regenWeekId`/`regenWeekTopic`

**No-op conditions** (no YouTube API call made):
- `YOUTUBE_API_KEY` env var not set
- `mediaPreference !== 'yes'`
- Week already has a working media reading (YouTube video with a verified `youtube.com` URL, or Podcast with any URL)
- No readings exist in the week

**Environment:** Requires `YOUTUBE_API_KEY` env var (YouTube Data API v3 key).

**Files Modified:**
- `server/utils/youtubeSearch.ts` — **NEW** YouTube Data API v3 search utility
- `server/utils/syllabindGenerator.ts` — Added `ensureMediaUrl()`, integrated into both `generateSyllabind()` and `regenerateWeek()` flows
- `server/__tests__/youtubeSearch.test.ts` — **NEW** Tests for search utility (success, missing key, API errors, empty results, timeouts)

### Generation Cost Reduction (~25-35%) (2026-02-22)

**Problem:** Generating a 4-week binder cost ~$0.75-1.00 in Claude API usage. Sonnet must stay for generation (Haiku produced fake URLs). Batch size is now tier-dependent: free users get `BATCH_SIZE = 3` (fewer API calls, ~33% cost reduction), Pro/admin users keep `BATCH_SIZE = 2` (higher quality). `isProUser` flag is threaded from WebSocket auth through `handleGenerateBinderWS` → `generateBinder` → `GenerationContext`.

**Changes:**
1. **Reduced web search budget** (`claudeClient.ts`): `max_uses` 14 → 8 per batch (~4 searches/week). Prompt already says "~2-3 searches per week" — 14 was excessive.
2. **Removed per-batch URL repair** (`syllabindGenerator.ts`): Repair ran after each batch AND as a final sweep. Final sweep catches everything in one pass — fewer API calls, smarter search allocation.
3. **Reduced repair search budget** (`syllabindGenerator.ts`): `min(count * 3, 20)` → `min(count * 2, 10)` — 2 searches per missing reading instead of 3.
4. **Haiku for URL repair** (`syllabindGenerator.ts`): `repairMissingUrls()` now uses `CLAUDE_MODEL` (Haiku) instead of `CLAUDE_MODEL_GENERATION` (Sonnet). Repair is simple: search for a title, return the URL.
5. **Reduced generation max_tokens** (`syllabindGenerator.ts`): 8192 → 4096. Actual output is ~2-3K tokens; no cost savings but faster responses.

**Files Modified:**
- `server/utils/claudeClient.ts` — Web search budget 14 → 8
- `server/utils/syllabindGenerator.ts` — Removed per-batch repair, reduced repair budget, Haiku for repair, lower max_tokens

### Account Settings Page (2026-02-23)

Added a Settings page for password change and account deletion, accessible from the profile dropdown.

**New endpoints:**
- `PUT /api/users/me/password` — Change password (email auth only). Validates current password, applies `passwordSchema` to new password.
- `DELETE /api/users/me` — Delete account. Email users must confirm with password; OAuth users just confirm. Destroys session on success.

**Storage:**
- Added `deleteUser(id)` to `IStorage` interface and `DatabaseStorage`. FK cascades handle related data.

**Frontend:**
- `Settings.tsx` — Password change form (email users only) + danger zone with AlertDialog for account deletion.
- Route at `/settings`, protected by auth.
- Nav links added to both desktop dropdown and mobile sheet in `Layout.tsx`.

**Files Created:**
- `client/src/pages/Settings.tsx`
- `server/__tests__/account-settings.test.ts`

**Files Modified:**
- `server/storage.ts` — `deleteUser` method
- `server/routes.ts` — Two new endpoints, imported `hashPassword`/`comparePassword`/`passwordSchema`
- `client/src/App.tsx` — Settings route
- `client/src/components/Layout.tsx` — Nav links
- `jest.setup.js` — `deleteUser` mock
- `server/__tests__/setup/mocks.ts` — `deleteUser` reset

### Billing Page (2026-02-23)

Moved the Subscription card from Profile page to a dedicated Billing page, accessible from the profile dropdown.

**Changes:**
- Created `client/src/pages/Billing.tsx` — Subscription card with Pro badge, manage billing (Pro) or upgrade CTA (free), handles `?subscription=success` redirect
- Removed subscription card, related imports (`Crown`, `Badge`, `redirectToCheckout`, `redirectToPortal`), and `?subscription=success` handler from `client/src/pages/Profile.tsx`
- Added `/billing` route in `client/src/App.tsx`
- Added Billing link (CreditCard icon) in profile dropdown and mobile menu in `client/src/components/Layout.tsx`

### Marketing Page — Single Page Decision (2026-02-24)

The marketing page (`Marketing.tsx`) has 8 sections: Hero, Two Pathways, Build Your Own (card showcase), Expert-Curated (card showcase), Plans & Pricing, Comparison Chart, About, and FAQ. Evaluated whether to split into multiple pages.

**Decision: Keep as single page.** The content follows a standard landing page narrative that would break across separate routes. Content is concise (placeholder pricing, 5 FAQs, 2-paragraph about), and fewer routes means fewer conversion drop-off points.

**Revisit when:**
- Pricing needs real tiers, feature matrix, or enterprise plans → own page
- FAQ grows past ~10-15 questions → own page
- About adds team bios, press, or mission statement → own page
- Curator and Reader audiences need separate funnels → separate landing pages

### Free vs Pro Guardrails in Binder Editor (2026-02-28)

Added free-tier guardrails to the Binder Editor to prevent abuse of AI generation features. Pro features are shown with a "Pro" badge and trigger an upgrade dialog when clicked by free-tier users (guest or signed-in non-Pro).

**Free vs Pro Feature Matrix:**
| Feature | Free | Pro |
|---------|------|-----|
| Duration | 1-4 weeks | 1-8 weeks |
| Initial "Autogenerate with AI" | Free | Free |
| "Regenerate with AI" (full re-gen) | Blocked | Allowed |
| Per-week "Regenerate Week" | Blocked | Allowed |

**Client-side (`BinderEditor.tsx`):**
- `isFreeTier = isGuestMode || !isPro` determines gating
- Duration dropdown shows Pro badge on weeks 5-8, triggers UpgradePrompt on selection
- "Regenerate with AI" button shows Pro badge and triggers UpgradePrompt for free-tier
- Per-week "Regenerate Week" buttons show Pro badge and trigger UpgradePrompt for free-tier
- Uses existing `UpgradePrompt` component with `variant="pro-feature"`

**Server-side (`server/routes.ts`):**
- `POST /api/generate-binder`: reserves credits (10 per week), returns 403 if binder exceeds tier's max weeks
- `POST /api/regenerate-week`: reserves 10 credits, available to all users with sufficient credits
- `POST /api/improve-text`: reserves 1 credit, refunds on API error
- `POST /api/binders`: free users limited to 3 manual (non-AI) binders
- `POST /api/enrollments`: free users limited to 1 active enrollment
- `POST /api/binders/:id/publish`: free users can only publish unlisted/private (not public)

### Anti-Abuse, Demo Experience & Generation Limits (2026-02-28)

Three workstreams to manage AI generation costs (~$0.5-1 per generation) and convert signed-out visitors.

#### A. Signed-Out Demo Experience

**Demo Binders (`isDemo` flag):** Admins can mark any binder as demo content via a toggle in the Binder Editor. Demo binders are served via `GET /api/demo-binders` (public, no auth) as full `BinderWithContent[]` and displayed as clickable topic chips on the guest `/create` page.

**Simulated Generation:** Clicking a demo chip triggers a simulated generation that mirrors the signed-in experience: progress bar with "Planning..." status, week-by-week skeleton placeholders (`GeneratingWeekPlaceholder`), and tab auto-switching. Demo week data populates into `formData.weeks` sequentially with staggered delays (~1.2s per week). The end state is the normal Binder editor section with all form fields populated (week titles, descriptions, steps with URLs/authors/media types/exercises). No separate preview UI — identical to the post-generation state for signed-in users.

**Guest Preview (`/create/preview`):** After a demo generation completes, a "Preview" button appears in the editor header. Clicking it stores `formData` in `sessionStorage` under `guestBinderPreview` and navigates to `/create/preview`. The `BinderOverview` component detects this route, reads binder data from sessionStorage (skipping all API fetches), and renders a read-only preview with a "Demo Preview" banner and "Back to Editor" / "Sign up to Start" CTAs.

**Form Reset ("Start Over"):** A "Start Over" ghost button appears in the header when `isGuestMode && hasBinderContent && !isGenerating`. It resets `formData` to empty defaults, clears `isDemoMode`, and returns to `week-1` — causing demo topic chips to reappear so the user can try another demo.

**Autogenerate in Guest Mode:** The "Autogenerate with AI" button calls `requireAuth()` which redirects to `/login?mode=signup&redirect=/curator/binder/new?title=...`, preserving the user's typed topic. After signup, they land on the authenticated editor with their title pre-filled and can generate immediately. The waitlist popup is retained for the "Sign up" header button and duration > 3 weeks selector.

**Storage:**
- `getDemoBinders()`: Returns `BinderWithContent[]` — full binder data with weeks and steps via `getBinderWithContent()`.

#### B. Weighted Credit System (replaces generation limits)

All AI features are now gated by a credit system. The old generation count/cooldown system (`generationCount`, `lastGeneratedAt`, `incrementGenerationCount`) is deprecated — columns kept in DB but no longer written to.

**Credit Costs:**
| Feature | Credits | Notes |
|---------|---------|-------|
| Binder generation | 10 per week | 4-week = 40, 6-week = 60 |
| Week regeneration | 10 | Same as 1 week of generation |
| Improve writing | 1 | Same cost for all plans |
| Auto-fill from URL | 0 | Free for all |

**Credit Grants:**
| Plan | Credits | Cadence |
|------|---------|---------|
| Free | 100 | One-time at signup |
| Pro Monthly ($14.99) | 130 | Monthly (deduped via `creditsGrantedAt`) |
| Pro Annual ($150) | 130 | Monthly |
| Lifetime ($500) | 5,000 | One-time at purchase |

**Credit Packages (Pro only):** 100 credits/$4.99, 250/$9.99, 500/$19.99

**Reserve + Refund Pattern:** All credit operations use atomic reserve-upfront, refund-on-failure:
1. `reserveCredits()` — atomically deducts via SQL CTE (`UPDATE ... WHERE credit_balance >= amount`). Returns `INSUFFICIENT_CREDITS` if balance too low.
2. On API success — no action (credits already reserved)
3. On API failure/cancel — `refundCredits()` logs a positive `refund` transaction

**Credit Service (`server/utils/creditService.ts`):** Constants, `reserveCredits`, `refundCredits`, `canAfford`, `grantSubscriptionCredits`, `grantSignupCredits`, `getGenerationCost`, `getMaxWeeks`, `isProTier`

**API:**
- `GET /api/generation-info` — Returns `{ creditBalance, isPro, maxWeeks, costPerWeek, cooldownRemaining: 0 }`
- `GET /api/credits/info` — Returns `{ creditBalance, subscriptionTier, costs, limits }`
- `GET /api/credits/history` — Paginated transaction log

**Free-Tier Limits:**
- 100 credits lifetime (enough for ~2 × 4-week binders + improve-writing)
- 1 active enrollment
- 3 manual (non-AI) binders
- Max 4-week AI binders
- No public binder submission (unlisted/private only)

#### C. Duration Hard Cap (6 weeks)

- Client: Duration selector options changed from `[1-8]` to `[1-6]`
- Server: `durationWeeks > maxWeeks` → 403 (free = 4 weeks max, Pro = 6 weeks max)

**Updated Feature Matrix:**
| Feature | Free | Pro Monthly | Pro Annual | Lifetime |
|---------|------|-------------|------------|----------|
| Credits | 100 (lifetime) | 130/month | 130/month | 5,000 upfront |
| Max AI binder weeks | 4 | 6 | 6 | 6 |
| Active enrollments | 1 | Unlimited | Unlimited | Unlimited |
| Manual binders | 3 | Unlimited | Unlimited | Unlimited |
| Public submission | No | Yes | Yes | Yes |
| Credit packages | No | Yes | Yes | Yes |

**Migrations:**
- `migrations/0009_add_generation_tracking.sql` — original generation count fields + `is_demo`
- `migrations/0012_add_credit_system.sql` — `credit_balance`, `subscription_tier`, `credits_granted_at` on users; `is_ai_generated` on binders; `credit_transactions` table
