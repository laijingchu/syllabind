# Syllabind — Feature-to-Database Mapping

> Temporary reference document for class submission.

---

## Database Tables Overview

| Table | Purpose |
|-------|---------|
| `users` | User accounts (readers & curators), profile info, social links |
| `sessions` | Express-session storage for authentication (JSONB, required) |
| `binders` | Learning content metadata (title, description, status, curator) |
| `weeks` | Weekly structure within each binder |
| `steps` | Individual learning activities (readings/exercises) within weeks |
| `enrollments` | Reader participation in binders with progress & classmates opt-in |
| `completed_steps` | Junction table tracking step completion per enrollment |
| `submissions` | Reader exercise submissions with curator feedback |
| `cohorts` | Groups of readers for social learning (schema only, not yet implemented) |
| `cohort_members` | Junction table for cohort membership (schema only, not yet implemented) |

---

## Public Features (No Authentication)

### 1. Browse Catalog
- **Description**: View all published binders
- **Endpoint**: `GET /api/binders`
- **Tables**: `binders` (READ — filter `status = 'published'`)

### 2. View Binder Overview
- **Description**: View a binder's full content, curator info, and classmates
- **Endpoints**: `GET /api/binders/:id`, `GET /api/users/:username`, `GET /api/binders/:id/classmates`
- **Tables**:
  - `binders` (READ) — metadata
  - `weeks` (READ) — week structure via `weeks.binderId → binders.id`
  - `steps` (READ) — step details via `steps.weekId → weeks.id`
  - `users` (READ) — curator profile via `binders.curatorId → users.username`
  - `enrollments` (READ) — classmates where `shareProfile = true`, via `enrollments.binderId → binders.id`
  - `users` (READ) — classmate profiles via `enrollments.readerId → users.username`

### 3. View User Public Profile
- **Description**: View a user's public profile (limited fields if `shareProfile = false`)
- **Endpoint**: `GET /api/users/:username`
- **Tables**: `users` (READ)

---

## Reader Features (Authenticated)

### 4. Register / Login
- **Description**: Create account or authenticate via email/password, Google, or Apple OAuth
- **Endpoints**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Tables**:
  - `users` (CREATE/READ) — insert new user or verify credentials
  - `sessions` (CREATE/UPDATE) — store Passport.js session data

### 5. Dashboard
- **Description**: View active binder progress, completed binders, and suggestions
- **Endpoints**: `GET /api/enrollments`, `GET /api/binders/:id`, `GET /api/enrollments/:id/completed-steps`
- **Tables**:
  - `enrollments` (READ) — user's enrollments via `enrollments.readerId → users.username`
  - `binders` (READ) — enrolled binder metadata
  - `weeks` (READ) — week structure
  - `steps` (READ) — step details
  - `completed_steps` (READ) — progress via `completed_steps.enrollmentId → enrollments.id`

### 6. Enroll in Binder
- **Description**: Start learning a binder, with opt-in to share profile with classmates
- **Endpoint**: `POST /api/enrollments` (accepts `shareProfile` boolean)
- **Tables**:
  - `enrollments` (CREATE/READ) — create enrollment, check for duplicates
  - Validates against `users` (readerId FK) and `binders` (binderId FK)

### 7. View Week & Complete Steps
- **Description**: Work through weekly readings and exercises, mark progress
- **Endpoints**:
  - `GET /api/binders/:id` — full binder content
  - `POST /api/enrollments/:eId/steps/:sId/complete` — mark step done
  - `DELETE /api/enrollments/:eId/steps/:sId/complete` — unmark step
  - `GET /api/enrollments/:eId/completed-steps` — get completed step IDs
- **Tables**:
  - `binders`, `weeks`, `steps` (READ) — content hierarchy
  - `completed_steps` (CREATE/DELETE/READ) — via composite PK `(enrollmentId, stepId)`
  - `enrollments` (READ) — ownership verification

### 8. Submit Exercise Answer
- **Description**: Submit text/URL answer to an exercise, optionally share with curator
- **Endpoints**: `POST /api/submissions`, `GET /api/enrollments/:id/submissions`
- **Tables**:
  - `submissions` (CREATE/READ) — stores `answer`, `isShared`, `submittedAt`
  - Links via `submissions.enrollmentId → enrollments.id` and `submissions.stepId → steps.id`

### 9. Complete Binder
- **Description**: Mark binder as completed after finishing all steps
- **Endpoint**: `PUT /api/enrollments/:id` with `{ status: 'completed' }`
- **Tables**: `enrollments` (UPDATE) — set `status = 'completed'`

### 10. View Classmates
- **Description**: See other readers in the same binder who opted to share their profile
- **Endpoint**: `GET /api/binders/:id/classmates`
- **Tables**:
  - `enrollments` (READ) — filter by `binderId` AND `shareProfile = true`
  - `users` (READ) — public profile fields for each classmate

### 11. Toggle Classmates Visibility
- **Description**: Per-enrollment opt-in/out of appearing in the classmates list
- **Endpoint**: `PATCH /api/enrollments/:id/share-profile`
- **Tables**: `enrollments` (UPDATE) — toggle `shareProfile` boolean

### 12. Edit Reader Profile
- **Description**: Update name, bio, social links, avatar
- **Endpoints**: `PUT /api/users/me`, `POST /api/upload`
- **Tables**: `users` (UPDATE) — name, bio, linkedin, website, twitter, threads, avatarUrl

### 13. Upload Avatar
- **Description**: Upload profile picture (stored on disk, URL saved in DB)
- **Endpoint**: `POST /api/upload` → returns URL, then `PUT /api/users/me` to save
- **Tables**: `users` (UPDATE) — `avatarUrl` field
- **Disk**: File saved to `/uploads/{timestamp}-{random}.{ext}`

### 14. Toggle Curator Mode
- **Description**: Switch between reader and curator roles
- **Endpoint**: `POST /api/users/me/toggle-curator`
- **Tables**: `users` (UPDATE) — toggle `isCurator` boolean

---

## Curator Features (Authenticated + `isCurator = true`)

### 15. Curator Dashboard
- **Description**: View all binders created (drafts + published), reader counts
- **Endpoints**: `GET /api/curator/binders`, `GET /api/binders/:id/readers`
- **Tables**:
  - `binders` (READ) — filter by `curatorId = username`
  - `enrollments` (READ) — count readers per binder
  - `users` (READ) — reader profiles

### 16. Create Binder
- **Description**: Build a new binder with metadata and content
- **Endpoint**: `POST /api/binders`
- **Tables**:
  - `binders` (CREATE) — title, description, audienceLevel, durationWeeks, curatorId, status='draft'
  - `weeks` (CREATE) — via `weeks.binderId → binders.id`
  - `steps` (CREATE) — via `steps.weekId → weeks.id`

### 17. Edit Binder
- **Description**: Modify binder metadata, add/remove/edit weeks and steps
- **Endpoint**: `PUT /api/binders/:id`
- **Tables**:
  - `binders` (UPDATE) — metadata fields
  - `weeks` (CREATE/UPDATE/DELETE) — restructure content
  - `steps` (CREATE/UPDATE/DELETE) — modify learning activities

### 18. Publish / Unpublish Binder
- **Description**: Toggle binder visibility between draft and published
- **Endpoint**: `POST /api/binders/:id/publish`
- **Tables**: `binders` (UPDATE) — toggle `status` between `'draft'` and `'published'`

### 19. Delete Binder
- **Description**: Permanently remove a binder and all related data
- **Endpoint**: `DELETE /api/binders/:id`
- **Tables** (all via CASCADE deletion):
  - `binders` (DELETE) — primary record
  - `weeks` (CASCADE) — via `weeks.binderId → binders.id`
  - `steps` (CASCADE) — via `steps.weekId → weeks.id`
  - `enrollments` (CASCADE) — via `enrollments.binderId → binders.id`
  - `completed_steps` (CASCADE) — via `completed_steps.enrollmentId → enrollments.id`
  - `submissions` (CASCADE) — via `submissions.enrollmentId → enrollments.id`

### 20. View Readers (Curator Only)
- **Description**: See all enrolled readers regardless of shareProfile setting
- **Endpoint**: `GET /api/binders/:id/readers` (requires ownership)
- **Tables**:
  - `binders` (READ) — ownership check
  - `enrollments` (READ) — all enrollments for binder
  - `users` (READ) — full reader profiles

### 21. View & Grade Submissions
- **Description**: Review reader exercise submissions, provide feedback and grades
- **Endpoints**: `GET /api/enrollments/:id/submissions`, `PUT /api/submissions/:id/feedback`
- **Tables**:
  - `submissions` (READ/UPDATE) — read answers, write feedback/grade/rubricUrl
  - `enrollments` (READ) — link submission to binder for authorization
  - `binders` (READ) — verify curator ownership

### 22. View Analytics
- **Description**: See step completion rates and average completion times
- **Endpoints**: `GET /api/binders/:id/analytics/completion-rates`, `GET /api/binders/:id/analytics/completion-times`
- **Tables**:
  - `binders` (READ) — ownership check
  - `enrollments` (READ) — total enrollment count
  - `completed_steps` (READ) — aggregate completion data
  - `steps` (READ) — step metadata for display

### 23. Edit Curator Profile
- **Description**: Update public curator profile (name, expertise, bio, avatar, social links)
- **Endpoints**: `PUT /api/users/me`, `POST /api/upload`
- **Tables**: `users` (UPDATE) — name, bio, expertise, avatarUrl, linkedin, website, twitter, threads

---

## Table Relationship Summary

```
users
 ├── binders          (users.username → binders.curatorId)
 ├── enrollments      (users.username → enrollments.readerId)
 ├── cohorts          (users.username → cohorts.curatorId)
 └── cohort_members   (users.username → cohort_members.readerId)

binders
 ├── weeks            (binders.id → weeks.binderId)          CASCADE DELETE
 ├── enrollments      (binders.id → enrollments.binderId)
 └── cohorts          (binders.id → cohorts.binderId)        CASCADE DELETE

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

## Feature x Table Matrix

| Feature | users | sessions | binders | weeks | steps | enrollments | completed_steps | submissions | cohorts | cohort_members |
|---------|:-----:|:--------:|:-------:|:-----:|:-----:|:-----------:|:---------------:|:-----------:|:-------:|:--------------:|
| Browse Catalog | | | R | | | | | | | |
| View Binder | R | | R | R | R | R | | | | |
| Register/Login | W/R | W | | | | | | | | |
| Dashboard | R | | R | R | R | R | R | | | |
| Enroll | | | R | | | W/R | | | | |
| Week View | | | | R | R | R | W/R | W/R | | |
| Classmates | R | | | | | R | | | | |
| Toggle Share | | | | | | W | | | | |
| Profile Edit | W | | | | | | | | | |
| Avatar Upload | W | | | | | | | | | |
| Curator Dashboard | R | | R | | | R | | | | |
| Create Binder | | | W | W | W | | | | | |
| Edit Binder | | | W | W | W | | | | | |
| Publish | | | W | | | | | | | |
| Delete Binder | | | D | D | D | D | D | D | | |
| View Readers | R | | R | | | R | | | | |
| Grade Submissions | | | R | | | R | | W/R | | |
| Analytics | | | R | R | R | R | R | | | |

**Legend**: R = Read, W = Write, W/R = Both, D = Delete (cascade)

---

## Notes

- **Cohorts & Cohort Members**: Schema exists but no API routes or UI implement these yet. Tables are empty.
- **`shareProfile`**: Lives on `enrollments` (per-binder), not on `users` (global). Each enrollment has independent visibility.
- **Only JSONB column**: `sessions.sess` (required by express-session). All other data is fully normalized.
- **Foreign key strategy**: Curator/reader references use `users.username` (not UUID) for readability in logs and debugging.
- **Cascade deletes**: Deleting a binder removes all weeks, steps, enrollments, completions, and submissions automatically.
