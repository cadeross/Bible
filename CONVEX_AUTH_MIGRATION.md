# Convex Auth Migration — Follow-up Steps

This file documents what's left after the Clerk → Convex Auth migration on the
web side. The code is in place and the build is green; what remains is
deployment-time configuration and a one-shot data backfill.

## Status snapshot

- **Web**: fully migrated to `@convex-dev/auth` (Password provider).
- **iOS**: still on Clerk SDK. Convex backend accepts both JWTs, so it keeps
  working until you migrate iOS too.
- **Convex schema**: `authTables` added, `profiles.email` + `by_email` index
  added, plus missing `by_user` / `by_author` / `by_created` indexes used by
  the relink path.

## 1. Set Convex deployment env vars (required)

These must be set in the Convex deployment **before** Convex Auth will work
end-to-end. Both commands write to the Convex dashboard, not to `.env.local`.

```bash
# So the one-shot email backfill action can talk to Clerk
npx convex env set CLERK_SECRET_KEY "<your existing sk_test_… from .env.local>"

# Generates JWT_PRIVATE_KEY, JWKS, and SITE_URL in the dashboard.
# Run this once; it's the official Convex Auth setup CLI.
npx @convex-dev/auth
```

`auth.config.ts` is already wired to read `CONVEX_SITE_URL` and
`CLERK_JWT_ISSUER_DOMAIN`, so once `npx @convex-dev/auth` finishes, the
backend will validate JWTs from both providers.

## 2. Backfill emails from Clerk (one-shot, before any user signs in via Convex Auth)

The relink in `ensureProfile` matches existing profiles to new Convex Auth
users by email. Profiles don't currently have an `email` field, so we pull
them from Clerk's Backend API in one pass:

```bash
npx convex run migrations:backfillClerkEmails
```

This calls `convex/migrations.ts:backfillClerkEmails`, which paginates through
every Clerk user and patches `profiles.email`. It's idempotent — safe to re-run.

It returns `{ scanned, written }`. If `written` is 0 on a re-run, you're done.

## 3. Verify locally

Two terminals:

```bash
# Terminal 1
npm run convex:dev

# Terminal 2
npm run dev
```

Smoke test:

1. Visit `/auth/sign-up` and create a fresh account.
2. Sign out (settings panel → "Sign out").
3. Sign back in at `/auth/login`.
4. If you had a Clerk-era profile under the same email, the first sign-in
   should relink your highlights, saved wisdom, reading history, and group
   memberships automatically. (Check `convex` logs — `relinkChildRows` runs
   inside `ensureProfile`.)

## 4. iOS — still on Clerk

The iOS app continues to authenticate against Clerk and pass a Clerk JWT to
Convex. The backend's `auth.config.ts` accepts both issuers, so nothing
breaks in the meantime.

To migrate iOS later, the plan is to:

- Write a small `ConvexAuthClient` in Swift that calls Convex Auth's HTTP
  endpoints (`/api/auth/signIn`) for sign-in/sign-up/refresh, stores the JWT
  in Keychain, and feeds it to `ConvexService` as the Bearer token.
- Remove the `clerk-ios` SPM dep from `iOS/project.yml`.
- Strip `import ClerkKit` / `ClerkKitUI` from `BibleApp.swift`,
  `AuthService.swift`, `ReadingViewModel.swift`, `SettingsTab.swift`.
- Remove the Clerk entry from `convex/auth.config.ts` once iOS is off Clerk.
- Drop `CLERK_JWT_ISSUER_DOMAIN` from the Convex deployment env.

## 5. Env var cleanup

Once you've verified web works:

- **Drop now from `.env.local`**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` —
  nothing on the web reads it anymore.
- **Keep until iOS is migrated**: `CLERK_SECRET_KEY` (only needed for the
  backfill action — can drop from Convex env after you've run the backfill
  successfully) and `CLERK_JWT_ISSUER_DOMAIN` (still needed for iOS JWT
  validation).

## File map (for future reference)

Backend
- `convex/auth.ts` — Convex Auth Password provider.
- `convex/http.ts` — registers Convex Auth's HTTP routes.
- `convex/auth.config.ts` — dual provider (Convex Auth + Clerk).
- `convex/lib.ts` — `requireUserId` resolves Convex Auth first, Clerk fallback.
- `convex/profiles.ts` — `ensureProfile` does email-based relink.
- `convex/users.ts` — `me` query for the auth user document.
- `convex/migrations.ts` — backfill action + `relinkChildRows` helper.
- `convex/schema.ts` — `authTables` + email index + relink indexes.

Frontend
- `src/proxy.ts` — `convexAuthNextjsMiddleware()`.
- `src/components/convex-client-provider.tsx` — server-side `ConvexAuthNextjsServerProvider` wrapper.
- `src/components/convex-auth-client.tsx` — client-side `ConvexAuthNextjsProvider` + HTTP token sync + `ensureProfile` call.
- `src/lib/auth.ts` — Clerk-shaped `useAuth` / `useUser` / `useClerk` shim
  backed by Convex Auth, so consumer components only swapped import paths.
- `src/app/auth/login`, `sign-up`, `reset-password` — native forms calling
  `useAuthActions().signIn("password", ...)`.
- `src/components/settings-panel.tsx` — embedded SignIn replaced by a link
  to `/auth/login`.

## Rollback plan

If anything goes wrong before you delete the Clerk env vars:

1. `git revert` the migration commit (keeps history clean).
2. Re-run `npm install`.
3. Restore the three Clerk env vars on Convex (`CLERK_JWT_ISSUER_DOMAIN`)
   and Vercel/local (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`).

The `profiles.email` field added in this migration is harmless to keep
post-rollback — it's optional and pre-existing rows ignore it.
