import { getAuthUserId } from "@convex-dev/auth/server";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Returns the canonical user identifier string for the calling client.
 *
 * Resolution order:
 *   1. Convex Auth (web): the user's `_id` from the auth `users` table.
 *   2. Clerk JWT (legacy / iOS): `identity.subject`.
 *
 * The two formats are distinct and never collide, so callers can store either
 * value in a `userId: v.string()` column without ambiguity.
 */
export async function requireUserId(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string> {
  const convexAuthId = await getAuthUserId(ctx);
  if (convexAuthId) return convexAuthId;

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity.subject;
}

export async function getUserIdOrNull(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string | null> {
  const convexAuthId = await getAuthUserId(ctx);
  if (convexAuthId) return convexAuthId;
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;
}

export async function getAuthEmail(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string | null> {
  const convexAuthId = await getAuthUserId(ctx);
  if (convexAuthId) {
    const user = await (ctx as QueryCtx | MutationCtx).db.get(convexAuthId);
    if (user && "email" in user && typeof user.email === "string") {
      return user.email.toLowerCase();
    }
  }
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.email) return identity.email.toLowerCase();
  return null;
}
