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

### Database Schema

#### Users Table
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
```typescript
{
  sid: string PRIMARY KEY,
  sess: JSONB,                       // Session data
  expire: timestamp
}
```

---

### TypeScript Domain Models

#### Core Learning Types
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

### Page Structure

#### Public Pages
| Route | Component | Purpose |
|-------|-----------|---------|
| `/welcome` | `Marketing.tsx` | Landing page with signup CTA |
| `/login` | `Login.tsx` | Authentication entry (signup/login modes) |
| `/catalog` | `Catalog.tsx` | Browse all published syllabi |
| `/syllabus/:id` | `SyllabusOverview.tsx` | Syllabus detail with week breakdown |

#### Learner Pages (Auth Required)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Dashboard.tsx` | Home - active syllabus progress or catalog |
| `/syllabus/:id/week/:index` | `WeekView.tsx` | Main learning interface with readings & exercises |
| `/syllabus/:id/completed` | `Completion.tsx` | Celebration screen post-completion |
| `/profile` | `Profile.tsx` | Edit bio, social links, preferences |

#### Creator Pages (Auth + Creator Flag Required)
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

#### Feature Components
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
**50+ Radix UI-based components organized by category:**

**Form Inputs:**
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
- `navigation-menu.tsx` - Navigation menu
- `breadcrumb.tsx` - Breadcrumb navigation
- `pagination.tsx` - Pagination controls

**Data Display:**
- `table.tsx` - Table component
- `badge.tsx` - Status badge
- `avatar.tsx` - User avatar
- `progress.tsx` - Progress bar
- `skeleton.tsx` - Loading skeleton
- `spinner.tsx` - Loading spinner
- `empty.tsx` - Empty state placeholder
- `chart.tsx` - Recharts wrapper

**Feedback:**
- `toast.tsx` - Toast notification
- `sonner.tsx` - Sonner toast integration
- `alert.tsx` - Alert message

**Rich Content:**
- `rich-text-editor.tsx` - TipTap editor integration
- `calendar.tsx` - Date picker calendar

**Utility:**
- `label.tsx` - Form label
- `field.tsx` - Form field wrapper
- `item.tsx` - Generic item component
- `kbd.tsx` - Keyboard shortcut display

---

### State Management

#### Context Store (`client/src/lib/store.tsx`)

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

**Authentication:**
- `login(username, password)` - Authenticate user
- `signup(username, email, name, password)` - Create new account
- `logout()` - Clear session
- `toggleCreatorMode()` - Switch between learner/creator roles
- `updateUser(updates)` - Update user profile

**Learner Actions:**
- `enrollInSyllabus(syllabusId)` - Enroll in syllabus
- `markStepComplete(stepId)` - Mark step as done
- `saveExercise(stepId, answer, isShared)` - Submit exercise

**Creator Actions:**
- `createSyllabus(syllabus)` - Create new syllabus
- `updateSyllabus(id, updates)` - Update existing syllabus
- `createCohort(name, syllabusId, learnerIds)` - Create learner cohort
- `assignLearnerToCohort(learnerId, cohortId)` - Assign learner
- `provideFeedback(submissionId, feedback, grade, rubricUrl)` - Grade submission

**Query Methods:**
- `getActiveSyllabus()` - Get current enrolled syllabus
- `isStepCompleted(stepId)` - Check step completion status
- `getProgressForWeek(weekIndex)` - Calculate week progress
- `getOverallProgress()` - Calculate total progress
- `getSubmissionsForStep(stepId)` - Get all submissions for a step

#### React Query
- Configured for API data fetching
- Settings: No auto-refetch, infinite stale time
- Used for server-side data caching

---

## API Endpoints

### Authentication
```
POST   /auth/login       - Replit OAuth login
POST   /auth/logout      - Logout & clear session
GET    /auth/me          - Get current authenticated user
```

### Syllabi
```
GET    /api/syllabi      - List all syllabi
GET    /api/syllabi/:id  - Get single syllabus
POST   /api/syllabi      - Create new syllabus (auth required)
PUT    /api/syllabi/:id  - Update syllabus (auth required)
DELETE /api/syllabi/:id  - Delete syllabus (auth required)
```

### Enrollments
```
GET    /api/enrollments     - Get user's enrollments (auth required)
POST   /api/enrollments     - Enroll in syllabus (auth required)
PUT    /api/enrollments/:id - Update progress (auth required)
```

---

## Key Features

### Learner Experience
- **Browse & Enroll**: Discover published syllabi in catalog
- **Week-by-week Progress**: Structured learning path with locked weeks
- **Step Tracking**: Mark readings/exercises as complete
- **Exercise Submission**: Submit URLs or text answers
- **Profile Sharing**: Opt-in to be featured on creator's learner list
- **Completion Celebration**: Confetti animation + completion badge

### Creator Experience
- **Rich Editor**: TipTap-powered syllabus builder with drag-and-drop
- **Auto-save**: Drafts save automatically
- **Publish Control**: Draft vs. Published status
- **Analytics Dashboard**: Learner progress visualization with charts
- **Cohort Management**: Group learners into cohorts
- **Feedback System**: Grade submissions with rubrics
- **Creator Profile**: Showcase expertise and social links

### UI/UX Features
- Framer Motion animations for smooth transitions
- Canvas Confetti for celebrations
- Progress bars and percentage displays
- Responsive design (mobile/desktop)
- Toast notifications for user actions
- Loading skeletons for async content

---

## Authentication Flow

1. **Landing**: `/welcome` page with signup CTA
2. **OAuth**: Replit Auth via OpenID Connect
3. **Session**: Express-session backed by PostgreSQL
4. **Protection**: `ProtectedRoute` wrapper redirects unauthorized access
5. **Role Toggle**: Users can switch between learner/creator modes

---

## File Structure

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
