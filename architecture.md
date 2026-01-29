# Syllabind Architecture

See `CLAUDE.md` for complete architecture documentation.

## Quick Links

- **CSS/Styling**: `docs/CSS_ARCHITECTURE.md`
- **Database**: See CLAUDE.md "Database Schema Design" section
- **Auth**: `docs/AUTH_IMPLEMENTATION_SUMMARY.md`
- **Testing**: `docs/TESTING_SETUP.md`
- **Seeding**: `docs/SEEDING_GUIDE.md`

## Recent Changes

### CSS Architecture (2026-01-29)
- Added semantic section classes in `client/src/styles/sections.css`
- Created reusable section components in `client/src/components/sections/`
- Pattern: Sections use semantic classes with `@apply`, items get semantic names, lower-level elements use inline Tailwind
