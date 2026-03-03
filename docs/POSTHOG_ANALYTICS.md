# PostHog Analytics

Syllabind uses [PostHog](https://posthog.com) for product analytics. This document covers setup, autocapture behavior, custom events, and how to extend tracking.

## Setup

**Packages:** `posthog-js`, `@posthog/react`

**Environment Variables (Replit Secrets):**

| Variable | Description |
|----------|-------------|
| `VITE_POSTHOG_KEY` | PostHog project API key |
| `VITE_POSTHOG_HOST` | PostHog instance URL (e.g., `https://us.i.posthog.com`) |

Both are `VITE_`-prefixed so Vite exposes them to the client at build time via `import.meta.env`.

**Provider:** The `PostHogProvider` from `@posthog/react` wraps the entire app in `client/src/main.tsx`:

```tsx
<PostHogProvider apiKey={import.meta.env.VITE_POSTHOG_KEY} options={options}>
  <App />
</PostHogProvider>
```

## Autocapture

PostHog's autocapture is enabled by default and automatically tracks:

- **Pageviews** — every route change
- **Clicks** — on buttons, links, and interactive elements
- **Form submissions** — input changes and form submits
- **Rage clicks** — rapid repeated clicks (indicates frustration)
- **Session recordings** — if enabled in the PostHog dashboard (not on by default)

Autocapture attaches element metadata (tag name, classes, text content, href) so events are identifiable in the PostHog dashboard without code changes.

**What autocapture does NOT cover well:**
- Business-specific actions (enrolling, completing a step) — these are generic "click" events in autocapture. Custom events provide meaningful names and properties.
- Server-side actions — PostHog JS only runs in the browser.
- Background/async operations — only user-initiated DOM interactions are captured.

## User Identification

Handled in `client/src/lib/store.tsx`:

**On login** (when `isAuthenticated` becomes true):
```tsx
posthog.identify(user.username, {
  email: user.email,
  name: user.name,
  is_curator: user.isCurator,
});
```

**On logout** (when `isAuthenticated` becomes false):
```tsx
posthog.reset();
```

This ensures:
- All events from a logged-in session are attributed to the correct user
- Anonymous events before login are linked via PostHog's identity merge
- After logout, a new anonymous ID is generated so sessions don't bleed into each other

## Custom Events

All custom events fire **after successful actions** (not optimistically), so they reflect real completions.

### Reader Events

| Event | File | Trigger | Properties |
|-------|------|---------|------------|
| `enrolled_in_binder` | `store.tsx` | Successful enrollment API response | `binder_id: number` |
| `step_completed` | `store.tsx` | Step marked complete via API | `step_id: number`, `binder_id: number` |
| `binder_completed` | `store.tsx` | Enrollment status set to "completed" | `binder_id: number` |
| `exercise_submitted` | `store.tsx` | Exercise submission saved via API | `step_id: number`, `binder_id: number` |

### Curator Events

| Event | File | Trigger | Properties |
|-------|------|---------|------------|
| `binder_published` | `BinderEditor.tsx` | Curator clicks "Publish" | `binder_id: number`, `title: string` |

### Engagement Events

| Event | File | Trigger | Properties |
|-------|------|---------|------------|
| `link_shared` | `ShareDialog.tsx` | User copies share link | `url: string` |
| `link_shared` | `BinderEditor.tsx` | Curator copies draft preview link | `url: string`, `type: 'draft_preview'` |

## Suggested Funnels

These events enable key product funnels in the PostHog dashboard:

1. **Enrollment Funnel:** Pageview (catalog) → Pageview (binder overview) → `enrolled_in_binder`
2. **Completion Funnel:** `enrolled_in_binder` → `step_completed` → `binder_completed`
3. **Curator Funnel:** Pageview (editor) → `binder_published` → `link_shared`
4. **Engagement Depth:** `enrolled_in_binder` → count of `step_completed` per user

## Adding New Custom Events

To track a new event:

1. Import the hook in your component:
   ```tsx
   import { usePostHog } from '@posthog/react';
   ```

2. Call the hook inside your component:
   ```tsx
   const posthog = usePostHog();
   ```

3. Capture the event after the action succeeds:
   ```tsx
   posthog?.capture('event_name', { property: value });
   ```

**Conventions:**
- Use `snake_case` for event names
- Use `snake_case` for property keys
- Fire events after the action succeeds (not optimistically)
- Use optional chaining (`posthog?.capture`) so the app works without PostHog configured
- Include the relevant entity ID (`binder_id`, `step_id`) for easy filtering

## Privacy

- `person_profiles: 'identified_only'` is not currently set — PostHog creates person profiles for all visitors. To limit this to logged-in users only, add `person_profiles: 'identified_only'` to the options in `main.tsx`.
- No sensitive data (passwords, tokens) is sent to PostHog.
- User properties sent on identify: `email`, `name`, `is_curator` — all non-sensitive profile data.
- PostHog's autocapture may capture text content of clicked elements. If this is a concern, configure `autocapture: { css_selector_allowlist: [...] }` in the PostHog options.
