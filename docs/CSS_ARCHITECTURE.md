# CSS Architecture

## Overview

The frontend uses a layered CSS approach combining Tailwind utilities with semantic class names for page sections.

## File Structure

```
client/src/
├── index.css              # Tailwind imports, theme variables, base utilities
├── styles/
│   └── sections.css       # Semantic section classes with @apply
├── components/
│   ├── ui/                # Radix-based primitives (Button, Card, etc.)
│   └── sections/          # Reusable page sections (PageHeader, EmptyState)
└── pages/                 # Page components using sections
```

## Styling Layers

### 1. Tailwind Utilities (default)
Use inline utilities for simple, one-off styling:
```tsx
<span className="text-sm text-muted-foreground">4 Weeks</span>
```

### 2. UI Primitives (`components/ui/`)
Pre-built components with consistent styling:
```tsx
<Button variant="outline" size="lg">Click me</Button>
<Badge variant="secondary">Draft</Badge>
```

### 3. Semantic Section Classes (`styles/sections.css`)
Named classes for page-level sections using `@apply`:
```tsx
<div className="syllabus-metadata">
  <div className="metadata-duration">...</div>
</div>
```

### 4. Reusable Section Components (`components/sections/`)
React components for repeated patterns:
```tsx
<PageHeader title="Dashboard" subtitle="Welcome back" />
<EmptyState icon={Award} title="All complete!" />
```

## Naming Conventions

### Section Classes
- Use lowercase with hyphens: `syllabus-metadata`, `creator-header`
- Prefix with context when needed: `auth-form`, `editor-actions`
- Suffix with role: `-section`, `-card`, `-grid`, `-list`

### Item Classes (direct children)
- Prefix with parent context: `metadata-duration`, `metadata-steps`
- Keep names descriptive but concise

## When to Use Each Layer

| Scenario | Use |
|----------|-----|
| Simple text/spacing | Inline Tailwind |
| Interactive elements | UI primitives (Button, Input) |
| Page sections | Semantic classes in sections.css |
| Repeated patterns (3+ uses) | Section components |

## Adding New Sections

1. **Identify the section** in a page file
2. **Choose a semantic name** (e.g., `enrollment-sidebar`)
3. **Add class to sections.css**:
   ```css
   .enrollment-sidebar {
     @apply sticky top-24;
   }
   ```
4. **Update JSX** to use the class:
   ```tsx
   <div className="enrollment-sidebar">
   ```
5. **Add item classes** for direct children if needed

## Section Components

Located in `client/src/components/sections/`:

| Component | Usage |
|-----------|-------|
| `PageHeader` | Page title with optional back button and actions |
| `EmptyState` | Empty state display with icon and action |
| `SearchBar` | Search input with count display |

### Creating New Section Components

1. Create file in `components/sections/`
2. Export from `components/sections/index.ts`
3. Use semantic class names from sections.css
4. Accept `className` prop for customization

```tsx
// components/sections/MySection.tsx
interface MySectionProps {
  title: string;
  className?: string;
}

export function MySection({ title, className = '' }: MySectionProps) {
  return (
    <div className={`my-section ${className}`}>
      <h2>{title}</h2>
    </div>
  );
}
```

## Migration Notes

- Existing pages are being migrated to use semantic classes
- SyllabusOverview is the reference implementation
- Other pages will be updated incrementally
