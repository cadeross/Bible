<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

---

# OpenWrit — Bible App

A modern Catholic Bible reading app built on Next.js 16 (App Router), Convex, and Clerk.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 |
| Backend | Convex (serverless DB + functions) |
| Auth | Clerk (`@clerk/nextjs`) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Animation | Framer Motion |
| UI Primitives | shadcn/ui (Radix UI) |
| Icons | Lucide React |
| Toasts | Sonner |
| Charts | Recharts |
| Calendar | Romcal (liturgical) |
| Mobile | Capacitor |
| Testing | Playwright (e2e) |

## Running the App

Two terminals required:

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — Convex backend watcher
npm run convex:dev
```

Other commands:
```bash
npm run build        # Production build
npm run lint         # ESLint 9
npm run test:e2e     # Playwright tests
npm run test:e2e:ui  # Playwright interactive UI
```

## Project Structure

```
convex/               # Backend: schema, queries, mutations
src/
  app/                # Next.js App Router pages
    read/             # Main reading interface
    library/          # Highlights & notes library
    calendar/         # Liturgical calendar
    daily/            # Daily readings
    groups/           # Community groups
    search/           # Scripture search
    settings/         # User preferences
    profile/          # User stats
    auth/             # Clerk auth pages
    api/              # Route handlers (cron, search)
  components/
    reading/          # Core reading UX components
    groups/           # Community feature components
    ui/               # shadcn/ui primitives
    layout/           # Header, nav, footer
  contexts/           # React Context providers
  lib/                # Utilities, API clients, helpers
  hooks/              # Custom React hooks
  types/              # TypeScript type declarations
e2e/                  # Playwright tests
```

## Database Schema (Convex)

| Table | Purpose |
|-------|---------|
| `profiles` | User metadata, reading position, preferences |
| `highlights` | Verse highlights with color and optional notes |
| `savedWisdom` | User-saved quotes |
| `readingHistory` | Session tracking (words read, duration) |
| `dailyContent` | Daily readings seeded nightly by cron |
| `groups` | Community groups (public/private/gated) |
| `groupMembers` | Group membership and roles |
| `groupPosts` | Posts: text, verse shares, weekly content |
| `groupPostReactions` | Emoji reactions on posts |
| `groupPostComments` | Comments on posts |
| `groupEvents` | Group events with Bible materials |
| `groupEventRsvps` | Event RSVPs (yes/no/maybe) |

## Authentication

Clerk handles auth; Convex verifies Clerk JWTs.

- `convex/auth.config.ts` — Clerk JWT issuer config
- `convex/lib.ts` — `requireUserId()` helper (use in all mutations that need a user)
- `src/components/convex-client-provider.tsx` — `ConvexProviderWithClerk`, syncs HTTP client auth, calls `ensureProfile()` on first sign-in

Auth pages live at `/auth/login`, `/auth/sign-up`, `/auth/reset-password`.

## Bible Data

**API chain (fallback order):**
1. **API.bible** (`src/lib/api-bible.ts`) — primary source, structured verse objects with HTML
2. **bolls.life** (`src/lib/bolls-api.ts`) — fallback, used for NRSVCE and CNBB
3. **bible-api.com** — legacy last-resort fallback

All sources normalize to `{ number: string, text: string }[]` before rendering. Strip HTML from API.bible output when displaying as plain text.

**Supported translations:** WEB, KJV, ASV, BBE, DARBY, DRA, NRSVCE, CNBB (+ others via API.bible)

**Catholic canon:** Includes deuterocanonical books (Tobit, Judith, Wisdom, Sirach, 1–2 Maccabees, etc.)

## State Management

Context API only — no Redux or Zustand.

| Context | File | Purpose |
|---------|------|---------|
| `ReadingPreferencesContext` | `contexts/reading-preferences.tsx` | Font, version, layout prefs |
| `FocusProvider` | `contexts/focus-mode.tsx` | Focus/distraction-free mode |
| `NavModeProvider` | `contexts/nav-mode.tsx` | Nav visibility |
| `GroupContext` | `contexts/group-context.tsx` | Group-scoped state |

## Persistence Pattern

Users have two persistence modes:

- **Anonymous:** `localStorage` (keys: `highlights`, `reading-history`, etc.)
- **Authenticated:** Convex tables

On sign-in, cloud preferences win — they overwrite local state during hydration. The `persistenceCloud.ready` flag indicates cloud state is loaded.

Always check `persistenceCloud.ready` before writing preferences, and sync to both stores for authenticated users.

## Styling Conventions

- **Tailwind v4** — utility-first; no inline styles
- **CSS custom properties** defined in `src/app/globals.css` under `@theme`
- **Theme:** Light/dark via `data-theme` attribute (next-themes)
- **Tint colors:** `--primary` CSS var drives accent color; options defined in `src/lib/tint-colors.ts`
- **shadcn/ui:** Add new components with `npx shadcn add <component>`

## Glass Style System

All frosted-glass surfaces are defined in `src/app/globals.css`. There are three variants — use them consistently; never roll your own backdrop-filter.

### Variants

| Class | Blur | Use for |
|-------|------|---------|
| `.glass` | `blur(28px) saturate(1.8)` | Menus, dialogs, sheets, popovers, auth cards |
| `.glass-subtle` | `blur(20px) saturate(1.5)` | Cards, toolbar chips, filter pills, icon wells |
| `.glass-nav` | `blur(32px) saturate(1.8)` | Header and mobile nav bar |

### Rules

1. **Always pair glass with a translucent border.** The standard border is:
   ```
   border border-white/[0.12] dark:border-white/[0.06]
   ```
   `.glass` overrides `border-color` internally, so on `.glass` surfaces add the border class but let the class control the color.

2. **Match shadow to variant:**
   - `.glass` → `shadow-[var(--shadow-elevated)]`
   - `.glass-subtle` → `shadow-[var(--shadow-card)]` (hover to `shadow-[var(--shadow-elevated)]`)
   - `.glass-nav` → no extra shadow needed

3. **Rounding:** Use `rounded-2xl` for cards/dialogs, `rounded-xl` for menus, `rounded-full` for chips/pills.

4. **shadcn/ui primitives already use glass.** `Dialog`, `Popover`, `DropdownMenu`, `ContextMenu`, `Sheet`, and `Command` all apply `.glass` by default — don't re-apply it in consuming code.

### Example usage

```tsx
{/* Card surface */}
<div className="rounded-2xl border border-white/[0.12] dark:border-white/[0.06] glass-subtle shadow-[var(--shadow-card)]">

{/* Toolbar chip / pill button */}
<button className="rounded-full border border-white/[0.12] dark:border-white/[0.06] glass-subtle px-3.5 py-1.5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)]">

{/* Full glass dialog (usually handled by shadcn Dialog) */}
<div className="glass border rounded-2xl overflow-hidden shadow-[var(--shadow-dialog)]">
```

## Component Conventions

- Server Components by default; `'use client'` only when needed (event handlers, hooks, browser APIs)
- Suspense boundaries with fallbacks for async data
- Error handling: `try/catch` + Sonner toasts
- Animations: Framer Motion `motion.div` with variants; use `SPRING_FAST` preset from `src/lib/animation.ts`
- Haptics: `src/lib/haptics.ts` for mobile tactile feedback

## Key Files to Know

| File | What it does |
|------|-------------|
| `convex/schema.ts` | Source of truth for all DB tables and indexes |
| `src/lib/bible-api.ts` | Top-level Bible fetch with API chain + normalization |
| `src/lib/bible-data.ts` | Static book list + chapter counts |
| `src/lib/chapter-navigation.ts` | Next/prev chapter logic (handles book boundaries) |
| `src/lib/reference-jump.ts` | Parse freeform references ("John 3:16") + navigate |
| `src/lib/persistence.ts` | localStorage + Convex write bridge |
| `src/lib/tint-colors.ts` | Accent color definitions |
| `src/components/reading/reading-view.tsx` | Core reading shell (navigation, swipe, URL state) |
| `src/components/reading/reading-content.tsx` | Verse rendering + highlight interaction |
| `src/components/convex-client-provider.tsx` | Clerk + Convex auth wiring |

## Environment Variables

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=          # Convex deployment URL
CONVEX_DEPLOYMENT=               # e.g. dev:quixotic-wolf-423

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=         # e.g. https://your-app.clerk.accounts.dev

# Bible API
API_BIBLE_KEY=                   # api.scripture.api.bible key

# Optional
NEXT_PUBLIC_SITE_URL=            # For SEO metadata
RESEND_API_KEY=                  # Transactional email
NEXT_PUBLIC_DATABASE_MAINTENANCE_BANNER=true  # Maintenance notice
```

## Common Patterns

**Adding a new Convex query/mutation:**
1. Read `convex/_generated/ai/guidelines.md` first
2. Add function to the relevant `convex/*.ts` file
3. Use `requireUserId(ctx)` from `convex/lib.ts` for auth
4. Run `npm run convex:dev` — types auto-generate

**Adding a new page:**
1. Create `src/app/<route>/page.tsx`
2. Default to Server Component; add `'use client'` only if needed
3. Wrap async data with `<Suspense>`

**Adding a new shadcn/ui component:**
```bash
npx shadcn add <component-name>
```

**Adding a highlight color or tint:**
- Highlight colors: `src/components/reading/reading-content.tsx`
- Accent tint colors: `src/lib/tint-colors.ts` + `src/components/settings-panel.tsx`
