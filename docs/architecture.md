# Architecture

## Database Tables

### Core tables
- **users** — User accounts (creators and learners)
- **syllabi** (export: `syllabinds`) — Syllabinds with title, description, status, visibility, category
- **weeks** — Weekly structure within syllabinds
- **steps** — Individual learning activities within weeks
- **enrollments** — Learner participation and progress
- **completed_steps** — Junction table tracking step completion
- **submissions** — Learner exercise submissions with feedback
- **cohorts** / **cohort_members** — Social learning groups
- **sessions** — Express-session storage (required for auth)
- **subscriptions** — Stripe subscription records

### Discovery tables (visibility, categories, tags)
- **categories** — Admin-managed categories (Philosophy, Design, Technology, etc.). Syllabinds have optional `category_id` FK.
- **tags** — Free-form creator tags. Name + slug, deduplicated by slug.
- **syllabind_tags** — Junction table linking syllabinds to tags (composite PK: `syllabus_id`, `tag_id`). Max 5 tags per syllabind enforced at API layer.

### Full-text search
- `syllabi.search_vector` — PostgreSQL `tsvector` column with GIN index
- Maintained by DB trigger on INSERT/UPDATE of title/description
- Application-level refresh (`storage.refreshSearchVector`) after week content or tag changes
- Weighted: title (A), description (B), week content (C), tag names (D)

## Visibility Model

Syllabinds have two orthogonal flags:
- **status**: `draft` | `published` | `generating` — controls whether content is ready
- **visibility**: `public` | `unlisted` | `private` — controls who can see published syllabinds

| Visibility | In catalog? | Accessible by link? | Who can view? |
|-----------|-------------|---------------------|---------------|
| public    | Yes         | Yes                 | Everyone      |
| unlisted  | No          | Yes                 | Anyone with link |
| private   | No          | No                  | Creator only  |

Enrollment is blocked on private syllabinds for non-creators. Catalog search (`searchCatalog`) only returns `status=published AND visibility=public`.

## Key API Endpoints

### Discovery
- `GET /api/categories` — List all categories (public)
- `GET /api/tags?q=...` — List/search tags (public, for autocomplete)
- `GET /api/syllabinds?catalog=true&q=&category=&level=&sort=&limit=&offset=` — Server-side catalog search

### Tags management
- `PUT /api/syllabinds/:id/tags` — Set tags (creator only, max 5)

### Visibility
- `POST /api/syllabinds/:id/publish` — Accepts `{ visibility }` in body
- `GET /api/syllabinds/:id` — Enforces visibility (private → 404 for non-creator)
- `POST /api/enrollments` — Blocks enrollment on private syllabinds for non-creators

## Storage Methods (new)

| Method | Purpose |
|--------|---------|
| `listCategories()` | All categories sorted by displayOrder |
| `listTags(query?)` | Tags optionally filtered by name |
| `getTagsBySyllabindId(id)` | Tags for a syllabind |
| `findOrCreateTag(name)` | Upsert tag by slug |
| `setSyllabindTags(id, tagNames)` | Replace syllabind's tags |
| `searchCatalog(params)` | Full catalog query with filters, sort, pagination |
| `refreshSearchVector(id)` | Rebuild tsvector for a syllabind |

## Frontend Catalog

The catalog page (`client/src/pages/Catalog.tsx`) uses server-side search:
- Debounced search input (300ms)
- Category pills from API
- Audience level toggle buttons
- Sort: Newest, Most Popular, Relevance
- Pagination via "Load More" (page size 12)
- URL query params sync for bookmarkable searches
