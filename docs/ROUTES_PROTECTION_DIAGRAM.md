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
    ├─ GET    /api/binders            (List all published binders)
    ├─ GET    /api/binders/:id        (View published binder)
    └─ GET    /api/users/:username    (View user profile, limited if private)


╔══════════════════════════════════════════════════════════════════════╗
║                   PROTECTED ROUTES (Auth Required)                    ║
║                      🔐 isAuthenticated middleware                    ║
╚══════════════════════════════════════════════════════════════════════╝

    👤 User Profile Management
    ├─ PUT    /api/users/me                      (Update own profile)
    │         └─ Auth: ✅  Curator: ❌  Owner: Self
    │
    └─ POST   /api/users/me/toggle-curator       (Toggle curator mode)
              └─ Auth: ✅  Curator: ❌  Owner: Self

    📚 Reader Routes
    ├─ GET    /api/enrollments                   (Get my enrollments)
    │         └─ Auth: ✅  Curator: ❌  Owner: Self
    │
    ├─ POST   /api/enrollments                   (Enroll in binder)
    │         └─ Auth: ✅  Curator: ❌  Owner: Self + Duplicate check
    │
    └─ PUT    /api/enrollments/:id               (Update enrollment)
              └─ Auth: ✅  Curator: ❌  Owner: enrollment.readerId === username

    ✅ Progress Tracking
    ├─ POST   /api/enrollments/:eId/steps/:sId/complete    (Mark complete)
    │         └─ Auth: ✅  Curator: ❌  Owner: enrollment.readerId === username
    │
    ├─ DELETE /api/enrollments/:eId/steps/:sId/complete    (Mark incomplete)
    │         └─ Auth: ✅  Curator: ❌  Owner: enrollment.readerId === username
    │
    └─ GET    /api/enrollments/:eId/completed-steps        (Get completed)
              └─ Auth: ✅  Curator: ❌  Owner: enrollment.readerId === username

    📝 Submissions
    ├─ POST   /api/submissions                   (Submit exercise)
    │         └─ Auth: ✅  Curator: ❌  Owner: enrollment.readerId === username
    │
    └─ GET    /api/enrollments/:id/submissions   (Get my submissions)
              └─ Auth: ✅  Curator: ❌  Owner: enrollment.readerId === username


╔══════════════════════════════════════════════════════════════════════╗
║              CURATOR ROUTES (Auth + Curator Flag Required)            ║
║           🔐 isAuthenticated + user.isCurator === true               ║
╚══════════════════════════════════════════════════════════════════════╝

    🎨 Binder Management
    ├─ POST   /api/binders                       (Create new binder)
    │         └─ Auth: ✅  Curator: ✅  Owner: N/A
    │
    ├─ PUT    /api/binders/:id                   (Update binder)
    │         └─ Auth: ✅  Curator: ✅  Owner: binder.curatorId === username
    │
    ├─ DELETE /api/binders/:id                   (Delete binder)
    │         └─ Auth: ✅  Curator: ✅  Owner: binder.curatorId === username
    │
    └─ POST   /api/binders/:id/publish           (Publish/unpublish)
              └─ Auth: ✅  Curator: ✅  Owner: binder.curatorId === username

    📊 Curator Dashboard
    ├─ GET    /api/curator/binders               (Get my binders, including drafts)
    │         └─ Auth: ✅  Curator: ✅  Owner: N/A (filtered by username)
    │
    └─ GET    /api/binders/:id/readers           (Get readers for my binder)
              └─ Auth: ✅  Curator: ✅  Owner: binder.curatorId === username

    💬 Feedback & Grading
    └─ PUT    /api/submissions/:id/feedback      (Provide feedback on submission)
              └─ Auth: ✅  Curator: ✅  Owner: Complex chain below
                 ├─ Get submission
                 ├─ Get enrollment from submission
                 ├─ Get binder from enrollment
                 └─ Verify: binder.curatorId === username

    📈 Analytics
    ├─ GET    /api/binders/:id/analytics/completion-rates
    │         └─ Auth: ✅  Curator: ✅  Owner: binder.curatorId === username
    │
    └─ GET    /api/binders/:id/analytics/completion-times
              └─ Auth: ✅  Curator: ✅  Owner: binder.curatorId === username


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
    │ Curator required?   │──── Yes ──▶ Check isCurator ──── No ──▶ 403 Forbidden
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
    🚫 403 Forbidden       - Logged in but not authorized (not curator/owner)
    ❓ 404 Not Found       - Resource doesn't exist
    ⚠️  409 Conflict       - Duplicate enrollment / Resource conflict
    ❌ 500 Server Error    - Internal server error


╔══════════════════════════════════════════════════════════════════════╗
║                         EXAMPLE SCENARIOS                             ║
╚══════════════════════════════════════════════════════════════════════╝

    Scenario 1: Reader marks step complete
    ────────────────────────────────────────
    POST /api/enrollments/123/steps/456/complete

    ✓ Check authentication (session exists)
    ✓ Fetch user from database
    ✓ Verify enrollment #123 belongs to user
    ✓ Mark step #456 complete
    → 200 OK


    Scenario 2: Curator provides feedback
    ──────────────────────────────────────
    PUT /api/submissions/789/feedback

    ✓ Check authentication (session exists)
    ✓ Fetch user from database
    ✓ Check user.isCurator === true
    ✓ Get submission #789
    ✓ Get enrollment from submission
    ✓ Get binder from enrollment
    ✓ Verify binder.curatorId === user.username
    ✓ Update submission feedback
    → 200 OK


    Scenario 3: User tries to edit someone else's binder
    ───────────────────────────────────────────────────────
    PUT /api/binders/10

    ✓ Check authentication (session exists)
    ✓ Fetch user from database
    ✓ Check user.isCurator === true
    ✓ Get binder #10
    ✗ Verify binder.curatorId === user.username (FAILS)
    → 403 Forbidden: "Not binder owner"


    Scenario 4: Non-curator tries to create binder
    ─────────────────────────────────────────────────
    POST /api/binders

    ✓ Check authentication (session exists)
    ✓ Fetch user from database
    ✗ Check user.isCurator === true (FAILS)
    → 403 Forbidden: "Curator access required"


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
         ├─▶ Curator Check ◀─────────────────── Curator routes only
         │
         ├─▶ Ownership Check ◀────────────────── Resource modification only
         │
         └─▶ Route Handler
                │
                ▼
           Response
```
