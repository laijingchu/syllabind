# API Routes Protection Diagram

## Visual Guide to Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SYLLABIND API ROUTES                         │
└─────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════╗
║                          PUBLIC ROUTES (No Auth)                      ║
╚══════════════════════════════════════════════════════════════════════╝

    🌐 Authentication Routes
    ├─ POST   /api/auth/register      (Create account)
    ├─ POST   /api/auth/login         (Login)
    ├─ POST   /api/auth/logout        (Logout)
    └─ GET    /api/auth/me            (Get current user, returns null if not logged in)

    🌐 Public Catalog
    ├─ GET    /api/syllabi            (List all published syllabi)
    ├─ GET    /api/syllabi/:id        (View published syllabus)
    └─ GET    /api/users/:username    (View user profile, limited if private)


╔══════════════════════════════════════════════════════════════════════╗
║                   PROTECTED ROUTES (Auth Required)                    ║
║                      🔐 isAuthenticated middleware                    ║
╚══════════════════════════════════════════════════════════════════════╝

    👤 User Profile Management
    ├─ PUT    /api/users/me                      (Update own profile)
    │         └─ Auth: ✅  Creator: ❌  Owner: Self
    │
    └─ POST   /api/users/me/toggle-creator       (Toggle creator mode)
              └─ Auth: ✅  Creator: ❌  Owner: Self

    📚 Learner Routes
    ├─ GET    /api/enrollments                   (Get my enrollments)
    │         └─ Auth: ✅  Creator: ❌  Owner: Self
    │
    ├─ POST   /api/enrollments                   (Enroll in syllabus)
    │         └─ Auth: ✅  Creator: ❌  Owner: Self + Duplicate check
    │
    └─ PUT    /api/enrollments/:id               (Update enrollment)
              └─ Auth: ✅  Creator: ❌  Owner: enrollment.studentId === username

    ✅ Progress Tracking
    ├─ POST   /api/enrollments/:eId/steps/:sId/complete    (Mark complete)
    │         └─ Auth: ✅  Creator: ❌  Owner: enrollment.studentId === username
    │
    ├─ DELETE /api/enrollments/:eId/steps/:sId/complete    (Mark incomplete)
    │         └─ Auth: ✅  Creator: ❌  Owner: enrollment.studentId === username
    │
    └─ GET    /api/enrollments/:eId/completed-steps        (Get completed)
              └─ Auth: ✅  Creator: ❌  Owner: enrollment.studentId === username

    📝 Submissions
    ├─ POST   /api/submissions                   (Submit exercise)
    │         └─ Auth: ✅  Creator: ❌  Owner: enrollment.studentId === username
    │
    └─ GET    /api/enrollments/:id/submissions   (Get my submissions)
              └─ Auth: ✅  Creator: ❌  Owner: enrollment.studentId === username


╔══════════════════════════════════════════════════════════════════════╗
║              CREATOR ROUTES (Auth + Creator Flag Required)            ║
║           🔐 isAuthenticated + user.isCreator === true               ║
╚══════════════════════════════════════════════════════════════════════╝

    🎨 Syllabus Management
    ├─ POST   /api/syllabi                       (Create new syllabus)
    │         └─ Auth: ✅  Creator: ✅  Owner: N/A
    │
    ├─ PUT    /api/syllabi/:id                   (Update syllabus)
    │         └─ Auth: ✅  Creator: ✅  Owner: syllabus.creatorId === username
    │
    ├─ DELETE /api/syllabi/:id                   (Delete syllabus)
    │         └─ Auth: ✅  Creator: ✅  Owner: syllabus.creatorId === username
    │
    └─ POST   /api/syllabi/:id/publish           (Publish/unpublish)
              └─ Auth: ✅  Creator: ✅  Owner: syllabus.creatorId === username

    📊 Creator Dashboard
    ├─ GET    /api/creator/syllabi               (Get my syllabi, including drafts)
    │         └─ Auth: ✅  Creator: ✅  Owner: N/A (filtered by username)
    │
    └─ GET    /api/syllabi/:id/learners          (Get learners for my syllabus)
              └─ Auth: ✅  Creator: ✅  Owner: syllabus.creatorId === username

    💬 Feedback & Grading
    └─ PUT    /api/submissions/:id/feedback      (Provide feedback on submission)
              └─ Auth: ✅  Creator: ✅  Owner: Complex chain below
                 ├─ Get submission
                 ├─ Get enrollment from submission
                 ├─ Get syllabus from enrollment
                 └─ Verify: syllabus.creatorId === username

    📈 Analytics
    ├─ GET    /api/syllabi/:id/analytics/completion-rates
    │         └─ Auth: ✅  Creator: ✅  Owner: syllabus.creatorId === username
    │
    └─ GET    /api/syllabi/:id/analytics/completion-times
              └─ Auth: ✅  Creator: ✅  Owner: syllabus.creatorId === username


╔══════════════════════════════════════════════════════════════════════╗
║                        AUTHORIZATION FLOW                             ║
╚══════════════════════════════════════════════════════════════════════╝

    Request comes in
         │
         ▼
    ┌─────────────────────┐
    │ Session Cookie?     │──── No ──▶ 401 Unauthorized
    └─────────────────────┘
         │ Yes
         ▼
    ┌─────────────────────┐
    │ Fetch user from DB  │──── Not found ──▶ 401 Unauthorized
    └─────────────────────┘
         │ Found
         ▼
    ┌─────────────────────┐
    │ Attach to req.user  │
    └─────────────────────┘
         │
         ▼
    ┌─────────────────────┐
    │ Creator required?   │──── Yes ──▶ Check isCreator ──── No ──▶ 403 Forbidden
    └─────────────────────┘                                  │ Yes
         │ No                                                │
         ▼                                                   ▼
    ┌─────────────────────┐                           ┌─────────────────────┐
    │ Owner check needed? │──── Yes ──▶               │ Verify ownership    │
    └─────────────────────┘                           │ (username match)    │
         │ No                                         └─────────────────────┘
         ▼                                                   │
    ┌─────────────────────┐                                │
    │ Allow request       │◀──── Yes ────────────────────┘
    └─────────────────────┘       │
                                  │ No
                                  ▼
                            403 Forbidden


╔══════════════════════════════════════════════════════════════════════╗
║                      HTTP STATUS CODES USED                           ║
╚══════════════════════════════════════════════════════════════════════╝

    ✅ 200 OK              - Successful request
    ✅ 201 Created         - Resource created successfully
    🔑 401 Unauthorized    - Not logged in / Session expired
    🚫 403 Forbidden       - Logged in but not authorized (not creator/owner)
    ❓ 404 Not Found       - Resource doesn't exist
    ⚠️  409 Conflict       - Duplicate enrollment / Resource conflict
    ❌ 500 Server Error    - Internal server error


╔══════════════════════════════════════════════════════════════════════╗
║                         EXAMPLE SCENARIOS                             ║
╚══════════════════════════════════════════════════════════════════════╝

    Scenario 1: Learner marks step complete
    ────────────────────────────────────────
    POST /api/enrollments/123/steps/456/complete

    ✓ Check authentication (session exists)
    ✓ Fetch user from database
    ✓ Verify enrollment #123 belongs to user
    ✓ Mark step #456 complete
    → 200 OK


    Scenario 2: Creator provides feedback
    ──────────────────────────────────────
    PUT /api/submissions/789/feedback

    ✓ Check authentication (session exists)
    ✓ Fetch user from database
    ✓ Check user.isCreator === true
    ✓ Get submission #789
    ✓ Get enrollment from submission
    ✓ Get syllabus from enrollment
    ✓ Verify syllabus.creatorId === user.username
    ✓ Update submission feedback
    → 200 OK


    Scenario 3: User tries to edit someone else's syllabus
    ───────────────────────────────────────────────────────
    PUT /api/syllabi/10

    ✓ Check authentication (session exists)
    ✓ Fetch user from database
    ✓ Check user.isCreator === true
    ✓ Get syllabus #10
    ✗ Verify syllabus.creatorId === user.username (FAILS)
    → 403 Forbidden: "Not syllabus owner"


    Scenario 4: Non-creator tries to create syllabus
    ─────────────────────────────────────────────────
    POST /api/syllabi

    ✓ Check authentication (session exists)
    ✓ Fetch user from database
    ✗ Check user.isCreator === true (FAILS)
    → 403 Forbidden: "Creator access required"


╔══════════════════════════════════════════════════════════════════════╗
║                    MIDDLEWARE STACK (REQUEST)                         ║
╚══════════════════════════════════════════════════════════════════════╝

    Incoming Request
         │
         ├─▶ Helmet (Security headers)
         │
         ├─▶ Rate Limiter (500 req/15min)
         │
         ├─▶ CORS (Allow frontend origin)
         │
         ├─▶ Body Parser (JSON)
         │
         ├─▶ Cookie Parser (Session cookie)
         │
         ├─▶ XSS Sanitization (Clean inputs)
         │
         ├─▶ Session Middleware (Load session)
         │
         ├─▶ isAuthenticated (Fetch user) ◀─── Protected routes only
         │
         ├─▶ Creator Check ◀─────────────────── Creator routes only
         │
         ├─▶ Ownership Check ◀────────────────── Resource modification only
         │
         └─▶ Route Handler
                │
                ▼
           Response
