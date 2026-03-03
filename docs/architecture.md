# Architecture

## Database Tables

### Core tables
- **users** — User accounts (curators and readers)
- **binders** — Binders with title, description, status, visibility, category
- **weeks** — Weekly structure within binders
- **steps** — Individual learning activities within weeks
- **enrollments** — Reader participation and progress
- **completed_steps** — Junction table tracking step completion
- **submissions** — Reader exercise submissions with feedback
- **cohorts** / **cohort_members** — Social learning groups
- **sessions** — Express-session storage (required for auth)
- **subscriptions** — Stripe subscription records

### Discovery tables (visibility, categories, tags)
- **categories** — Admin-managed categories (Philosophy, Design, Technology, etc.). Binders have optional `category_id` FK.
- **tags** — Free-form curator tags. Name + slug, deduplicated by slug.
- **binder_tags** — Junction table linking binders to tags (composite PK: `binder_id`, `tag_id`). Max 5 tags per binder enforced at API layer.

### Full-text search
- `binders.search_vector` — PostgreSQL `tsvector` column with GIN index
- Maintained by DB trigger on INSERT/UPDATE of title/description
- Application-level refresh (`storage.refreshSearchVector`) after week content or tag changes
- Weighted: title (A), description (B), week content (C), tag names (D)

## Visibility Model

Binders have two orthogonal flags:
- **status**: `draft` | `published` | `generating` — controls whether content is ready
- **visibility**: `public` | `unlisted` | `private` — controls who can see published binders

| Visibility | In catalog? | Accessible by link? | Who can view? |
|-----------|-------------|---------------------|---------------|
| public    | Yes         | Yes                 | Everyone      |
| unlisted  | No          | Yes                 | Anyone with link |
| private   | No          | No                  | Curator only  |

Enrollment is blocked on private binders for non-curators. Catalog search (`searchCatalog`) only returns `status=published AND visibility=public`.

## Key API Endpoints

### Discovery
- `GET /api/categories` — List all categories (public)
- `GET /api/tags?q=...` — List/search tags (public, for autocomplete)
- `GET /api/binders?catalog=true&q=&category=&level=&sort=&limit=&offset=` — Server-side catalog search

### Tags management
- `PUT /api/binders/:id/tags` — Set tags (curator only, max 5)

### Visibility
- `POST /api/binders/:id/publish` — Accepts `{ visibility }` in body
- `GET /api/binders/:id` — Enforces visibility (private → 404 for non-curator)
- `POST /api/enrollments` — Blocks enrollment on private binders for non-curators

## Storage Methods (new)

| Method | Purpose |
|--------|---------|
| `listCategories()` | All categories sorted by displayOrder |
| `listTags(query?)` | Tags optionally filtered by name |
| `getTagsByBinderId(id)` | Tags for a binder |
| `findOrCreateTag(name)` | Upsert tag by slug |
| `setBinderTags(id, tagNames)` | Replace binder's tags |
| `searchCatalog(params)` | Full catalog query with filters, sort, pagination |
| `refreshSearchVector(id)` | Rebuild tsvector for a binder |

## Frontend Catalog

The catalog page (`client/src/pages/Catalog.tsx`) uses server-side search:
- Debounced search input (300ms)
- Category pills from API
- Audience level toggle buttons
- Sort: Newest, Most Popular, Relevance
- Pagination via "Load More" (page size 12)
- URL query params sync for bookmarkable searches
