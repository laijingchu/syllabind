# Syllabind — Feature-to-Database Mapping

> Temporary reference document for class submission.

---

## Database Tables Overview

| Table | Purpose |
|-------|---------|
| `users` | User accounts (learners & creators), profile info, social links |
| `sessions` | Express-session storage for authentication (JSONB, required) |
| `syllabi` | Learning content metadata (title, description, status, creator) |
| `weeks` | Weekly structure within each syllabus |
| `steps` | Individual learning activities (readings/exercises) within weeks |
| `enrollments` | Learner participation in syllabi with progress & classmates opt-in |
| `completed_steps` | Junction table tracking step completion per enrollment |
| `submissions` | Learner exercise submissions with creator feedback |
| `cohorts` | Groups of learners for social learning (schema only, not yet implemented) |
| `cohort_members` | Junction table for cohort membership (schema only, not yet implemented) |

---

## Public Features (No Authentication)

### 1. Browse Catalog
- **Description**: View all published syllabi
- **Endpoint**: `GET /api/syllabi`
- **Tables**: `syllabi` (READ — filter `status = 'published'`)

### 2. View Syllabus Overview
- **Description**: View a syllabus's full content, creator info, and classmates
- **Endpoints**: `GET /api/syllabi/:id`, `GET /api/users/:username`, `GET /api/syllabi/:id/classmates`
- **Tables**:
  - `syllabi` (READ) — metadata
  - `weeks` (READ) — week structure via `weeks.syllabusId → syllabi.id`
  - `steps` (READ) — step details via `steps.weekId → weeks.id`
  - `users` (READ) — creator profile via `syllabi.creatorId → users.username`
  - `enrollments` (READ) — classmates where `shareProfile = true`, via `enrollments.syllabusId → syllabi.id`
  - `users` (READ) — classmate profiles via `enrollments.studentId → users.username`

### 3. View User Public Profile
- **Description**: View a user's public profile (limited fields if `shareProfile = false`)
- **Endpoint**: `GET /api/users/:username`
- **Tables**: `users` (READ)

---

## Learner Features (Authenticated)

### 4. Register / Login
- **Description**: Create account or authenticate via email/password, Google, or Apple OAuth
- **Endpoints**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Tables**:
  - `users` (CREATE/READ) — insert new user or verify credentials
  - `sessions` (CREATE/UPDATE) — store Passport.js session data

### 5. Dashboard
- **Description**: View active syllabus progress, completed syllabi, and suggestions
- **Endpoints**: `GET /api/enrollments`, `GET /api/syllabi/:id`, `GET /api/enrollments/:id/completed-steps`
- **Tables**:
  - `enrollments` (READ) — user's enrollments via `enrollments.studentId → users.username`
  - `syllabi` (READ) — enrolled syllabus metadata
  - `weeks` (READ) — week structure
  - `steps` (READ) — step details
  - `completed_steps` (READ) — progress via `completed_steps.enrollmentId → enrollments.id`

### 6. Enroll in Syllabus
- **Description**: Start learning a syllabus, with opt-in to share profile with classmates
- **Endpoint**: `POST /api/enrollments` (accepts `shareProfile` boolean)
- **Tables**:
  - `enrollments` (CREATE/READ) — create enrollment, check for duplicates
  - Validates against `users` (studentId FK) and `syllabi` (syllabusId FK)

### 7. View Week & Complete Steps
- **Description**: Work through weekly readings and exercises, mark progress
- **Endpoints**:
  - `GET /api/syllabi/:id` — full syllabus content
  - `POST /api/enrollments/:eId/steps/:sId/complete` — mark step done
  - `DELETE /api/enrollments/:eId/steps/:sId/complete` — unmark step
  - `GET /api/enrollments/:eId/completed-steps` — get completed step IDs
- **Tables**:
  - `syllabi`, `weeks`, `steps` (READ) — content hierarchy
  - `completed_steps` (CREATE/DELETE/READ) — via composite PK `(enrollmentId, stepId)`
  - `enrollments` (READ) — ownership verification

### 8. Submit Exercise Answer
- **Description**: Submit text/URL answer to an exercise, optionally share with creator
- **Endpoints**: `POST /api/submissions`, `GET /api/enrollments/:id/submissions`
- **Tables**:
  - `submissions` (CREATE/READ) — stores `answer`, `isShared`, `submittedAt`
  - Links via `submissions.enrollmentId → enrollments.id` and `submissions.stepId → steps.id`

### 9. Complete Syllabus
- **Description**: Mark syllabus as completed after finishing all steps
- **Endpoint**: `PUT /api/enrollments/:id` with `{ status: 'completed' }`
- **Tables**: `enrollments` (UPDATE) — set `status = 'completed'`

### 10. View Classmates
- **Description**: See other learners in the same syllabus who opted to share their profile
- **Endpoint**: `GET /api/syllabi/:id/classmates`
- **Tables**:
  - `enrollments` (READ) — filter by `syllabusId` AND `shareProfile = true`
  - `users` (READ) — public profile fields for each classmate

### 11. Toggle Classmates Visibility
- **Description**: Per-enrollment opt-in/out of appearing in the classmates list
- **Endpoint**: `PATCH /api/enrollments/:id/share-profile`
- **Tables**: `enrollments` (UPDATE) — toggle `shareProfile` boolean

### 12. Edit Learner Profile
- **Description**: Update name, bio, social links, avatar
- **Endpoints**: `PUT /api/users/me`, `POST /api/upload`
- **Tables**: `users` (UPDATE) — name, bio, linkedin, website, twitter, threads, avatarUrl

### 13. Upload Avatar
- **Description**: Upload profile picture (stored on disk, URL saved in DB)
- **Endpoint**: `POST /api/upload` → returns URL, then `PUT /api/users/me` to save
- **Tables**: `users` (UPDATE) — `avatarUrl` field
- **Disk**: File saved to `/uploads/{timestamp}-{random}.{ext}`

### 14. Toggle Creator Mode
- **Description**: Switch between learner and creator roles
- **Endpoint**: `POST /api/users/me/toggle-creator`
- **Tables**: `users` (UPDATE) — toggle `isCreator` boolean

---

## Creator Features (Authenticated + `isCreator = true`)

### 15. Creator Dashboard
- **Description**: View all syllabi created (drafts + published), learner counts
- **Endpoints**: `GET /api/creator/syllabi`, `GET /api/syllabi/:id/learners`
- **Tables**:
  - `syllabi` (READ) — filter by `creatorId = username`
  - `enrollments` (READ) — count learners per syllabus
  - `users` (READ) — learner profiles

### 16. Create Syllabus
- **Description**: Build a new syllabus with metadata and Syllabind
- **Endpoint**: `POST /api/syllabi`
- **Tables**:
  - `syllabi` (CREATE) — title, description, audienceLevel, durationWeeks, creatorId, status='draft'
  - `weeks` (CREATE) — via `weeks.syllabusId → syllabi.id`
  - `steps` (CREATE) — via `steps.weekId → weeks.id`

### 17. Edit Syllabus
- **Description**: Modify syllabus metadata, add/remove/edit weeks and steps
- **Endpoint**: `PUT /api/syllabi/:id`
- **Tables**:
  - `syllabi` (UPDATE) — metadata fields
  - `weeks` (CREATE/UPDATE/DELETE) — restructure Syllabind
  - `steps` (CREATE/UPDATE/DELETE) — modify learning activities

### 18. Publish / Unpublish Syllabus
- **Description**: Toggle syllabus visibility between draft and published
- **Endpoint**: `POST /api/syllabi/:id/publish`
- **Tables**: `syllabi` (UPDATE) — toggle `status` between `'draft'` and `'published'`

### 19. Delete Syllabus
- **Description**: Permanently remove a syllabus and all related data
- **Endpoint**: `DELETE /api/syllabi/:id`
- **Tables** (all via CASCADE deletion):
  - `syllabi` (DELETE) — primary record
  - `weeks` (CASCADE) — via `weeks.syllabusId → syllabi.id`
  - `steps` (CASCADE) — via `steps.weekId → weeks.id`
  - `enrollments` (CASCADE) — via `enrollments.syllabusId → syllabi.id`
  - `completed_steps` (CASCADE) — via `completed_steps.enrollmentId → enrollments.id`
  - `submissions` (CASCADE) — via `submissions.enrollmentId → enrollments.id`

### 20. View Learners (Creator Only)
- **Description**: See all enrolled learners regardless of shareProfile setting
- **Endpoint**: `GET /api/syllabi/:id/learners` (requires ownership)
- **Tables**:
  - `syllabi` (READ) — ownership check
  - `enrollments` (READ) — all enrollments for syllabus
  - `users` (READ) — full learner profiles

### 21. View & Grade Submissions
- **Description**: Review learner exercise submissions, provide feedback and grades
- **Endpoints**: `GET /api/enrollments/:id/submissions`, `PUT /api/submissions/:id/feedback`
- **Tables**:
  - `submissions` (READ/UPDATE) — read answers, write feedback/grade/rubricUrl
  - `enrollments` (READ) — link submission to syllabus for authorization
  - `syllabi` (READ) — verify creator ownership

### 22. View Analytics
- **Description**: See step completion rates and average completion times
- **Endpoints**: `GET /api/syllabi/:id/analytics/completion-rates`, `GET /api/syllabi/:id/analytics/completion-times`
- **Tables**:
  - `syllabi` (READ) — ownership check
  - `enrollments` (READ) — total enrollment count
  - `completed_steps` (READ) — aggregate completion data
  - `steps` (READ) — step metadata for display

### 23. Edit Creator Profile
- **Description**: Update public creator profile (name, expertise, bio, avatar, social links)
- **Endpoints**: `PUT /api/users/me`, `POST /api/upload`
- **Tables**: `users` (UPDATE) — name, bio, expertise, avatarUrl, linkedin, website, twitter, threads

---

## Table Relationship Summary

```
users
 ├── syllabi          (users.username → syllabi.creatorId)
 ├── enrollments      (users.username → enrollments.studentId)
 ├── cohorts          (users.username → cohorts.creatorId)
 └── cohort_members   (users.username → cohort_members.studentId)

syllabi
 ├── weeks            (syllabi.id → weeks.syllabusId)          CASCADE DELETE
 ├── enrollments      (syllabi.id → enrollments.syllabusId)
 └── cohorts          (syllabi.id → cohorts.syllabusId)        CASCADE DELETE

weeks
 └── steps            (weeks.id → steps.weekId)                CASCADE DELETE

enrollments
 ├── completed_steps  (enrollments.id → completed_steps.enrollmentId)  CASCADE DELETE
 └── submissions      (enrollments.id → submissions.enrollmentId)      CASCADE DELETE

steps
 ├── completed_steps  (steps.id → completed_steps.stepId)      CASCADE DELETE
 └── submissions      (steps.id → submissions.stepId)           CASCADE DELETE

cohorts
 └── cohort_members   (cohorts.id → cohort_members.cohortId)   CASCADE DELETE
```

---

## Feature × Table Matrix

| Feature | users | sessions | syllabi | weeks | steps | enrollments | completed_steps | submissions | cohorts | cohort_members |
|---------|:-----:|:--------:|:-------:|:-----:|:-----:|:-----------:|:---------------:|:-----------:|:-------:|:--------------:|
| Browse Catalog | | | R | | | | | | | |
| View Syllabus | R | | R | R | R | R | | | | |
| Register/Login | W/R | W | | | | | | | | |
| Dashboard | R | | R | R | R | R | R | | | |
| Enroll | | | R | | | W/R | | | | |
| Week View | | | | R | R | R | W/R | W/R | | |
| Classmates | R | | | | | R | | | | |
| Toggle Share | | | | | | W | | | | |
| Profile Edit | W | | | | | | | | | |
| Avatar Upload | W | | | | | | | | | |
| Creator Dashboard | R | | R | | | R | | | | |
| Create Syllabus | | | W | W | W | | | | | |
| Edit Syllabus | | | W | W | W | | | | | |
| Publish | | | W | | | | | | | |
| Delete Syllabus | | | D | D | D | D | D | D | | |
| View Learners | R | | R | | | R | | | | |
| Grade Submissions | | | R | | | R | | W/R | | |
| Analytics | | | R | R | R | R | R | | | |

**Legend**: R = Read, W = Write, W/R = Both, D = Delete (cascade)

---

## Notes

- **Cohorts & Cohort Members**: Schema exists but no API routes or UI implement these yet. Tables are empty.
- **`shareProfile`**: Lives on `enrollments` (per-syllabus), not on `users` (global). Each enrollment has independent visibility.
- **Only JSONB column**: `sessions.sess` (required by express-session). All other data is fully normalized.
- **Foreign key strategy**: Creator/student references use `users.username` (not UUID) for readability in logs and debugging.
- **Cascade deletes**: Deleting a syllabus removes all weeks, steps, enrollments, completions, and submissions automatically.
