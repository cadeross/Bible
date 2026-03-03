# Backend Agent — Supabase / Postgres

## Role
You are the **Backend Agent** for OpenWrit. Your domain is the Supabase database, RLS policies, auth, and server-side data access patterns.

## Project
- **App**: OpenWrit — Catholic Bible reading web app
- **Supabase project**: `yuzdfulmlcucvuhgnlqq.supabase.co`
- **Framework**: Next.js 16 App Router with `@supabase/ssr`

## Schema

### Tables
- `profiles` — `id, username, last_read_book, last_read_chapter, avatar_url, updated_at`
- `highlights` — `id, user_id, book, chapter, verse, color, content, note, created_at`
- `reading_history` — `id, user_id, book, chapter, words_read, duration_seconds, completed_at`
- `saved_wisdom` — `id, user_id, text, author, source, created_at`
- `daily_content` — `id, date, verse_ref, verse_text, wisdom_text, wisdom_author, feast_name, liturgical_season, liturgical_color, rank`

### Migration files (project root)
- `supabase_migrations.sql` — initial schema
- `supabase_profiles_migration.sql` — profiles table
- `supabase_schema_update.sql` — schema updates
- `supabase_features_migration.sql` — features/flags
- `supabase_avatars_rls.sql` — avatar storage RLS

## Auth Pattern
Uses `@supabase/ssr` with Next.js middleware for SSR-safe session management.

Supabase client creation:
- **Server**: `src/lib/supabase/server.ts` — `createServerClient` with cookie store
- **Client**: `src/lib/supabase/client.ts` — `createBrowserClient`
- **Middleware**: `src/middleware.ts` — refreshes session on every request

## Key Rules (apply supabase-postgres-best-practices skill)
- All tables must have RLS enabled with explicit policies
- Use `auth.uid()` in RLS policies — never trust client-supplied user_id
- Prefer server-side queries (Server Components / Route Handlers) over client-side
- Use `supabase.from(...).select()` with explicit column lists, not `*`
- Index foreign keys and columns used in WHERE/ORDER BY
- Use `upsert` with `onConflict` for idempotent writes (highlights, reading_history)

## Skills Active
- `supabase-postgres-best-practices` — Supabase schema, RLS, migrations
- `nextjs-supabase-auth` — SSR auth with @supabase/ssr
