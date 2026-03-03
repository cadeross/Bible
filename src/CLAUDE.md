# Web Agent — Next.js / React

## Role
You are the **Web Agent** for OpenWrit. Your domain is all Next.js App Router code, UI components, data fetching, and client-side state.

## Stack
- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, `globals.css` CSS custom properties
- **UI primitives**: Radix UI (via shadcn/ui — `components.json`)
- **Animation**: Framer Motion
- **Charts**: Recharts (reading stats)
- **Auth**: Supabase SSR (`@supabase/ssr`)

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (fonts, providers, nav)
│   ├── page.tsx            # Home / landing
│   ├── read/               # Book → chapter reading flow
│   ├── library/            # Highlights list
│   ├── profile/            # User stats + settings
│   ├── calendar/           # Liturgical calendar
│   ├── search/             # Scripture search
│   ├── settings/           # Reading preferences
│   └── api/                # Route handlers
├── components/
│   ├── reading/            # reading-view, reading-content, reading-toolbar, note-dialog
│   ├── home/               # Home page sections
│   ├── ui/                 # shadcn/ui primitives
│   ├── auth/               # Auth forms
│   └── layout/             # Header, nav, footer
├── contexts/
│   ├── focus-mode.tsx      # Focus mode toggle
│   ├── nav-mode.tsx        # Nav visibility
│   └── reading-preferences.tsx  # Font size, line height, version
├── lib/
│   ├── supabase/           # server.ts + client.ts
│   ├── bible-api.ts        # API chain orchestration
│   ├── api-bible.ts        # API.bible (primary)
│   ├── bolls-api.ts        # bolls.life (NRSVCE/CNBB fallback)
│   ├── bible-data.ts       # Book lists, chapter counts
│   ├── liturgical-calendar.ts
│   └── persistence.ts      # LocalStorage helpers
└── types/                  # Shared TypeScript types
```

## Bible API Chain
1. **API.bible** (`api.scripture.api.bible`) — primary; key in `.env.local` as `API_BIBLE_KEY`
2. **bolls.life** — NRSVCE and CNBB translations
3. **bible-api.com** — legacy fallback

## Key Rules (apply vercel-react-best-practices skill)
- Use Server Components for data fetching by default; `'use client'` only when needed
- Reading preferences stored in localStorage via `reading-preferences.tsx` context
- Use Framer Motion for page transitions and interactive animations (apply framer-motion-animator skill)
- Tailwind v4: use `@theme` in `globals.css`; CSS vars via `var(--color-*)` pattern
- shadcn/ui components live in `src/components/ui/` — add via `npx shadcn add`
- Recharts for all data visualization (reading streaks, history charts)

## Skills Active
- `vercel-react-best-practices` — React/Next.js performance patterns
- `framer-motion-animator` — animation consistency
- `accessibility-compliance` — WCAG audit for reading screen, palettes, text sizing
- `playwright-e2e-testing` — e2e tests for reading flow and auth
