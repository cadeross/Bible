import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";

/**
 * One-shot helper used by `scripts/backfill-clerk-emails.mjs`.
 * Sets `email` on a profile identified by its existing `clerkUserId`.
 * Idempotent.
 */
export const setProfileEmailByClerkId = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { clerkUserId, email }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    const normalized = email.toLowerCase();
    if (!profile) {
      await ctx.db.insert("profiles", {
        clerkUserId,
        email: normalized,
        updatedAt: Date.now(),
      });
      return { created: true };
    }
    if (profile.email === normalized) return { unchanged: true };
    await ctx.db.patch(profile._id, {
      email: normalized,
      updatedAt: Date.now(),
    });
    return { updated: true };
  },
});

/**
 * Rewrites every child row that keys on `userId` (or `authorId`/`createdBy`)
 * from `oldUserId` → `newUserId`. Called by `ensureProfile` the first time a
 * Clerk-era profile is relinked to a Convex Auth user.
 *
 * Bounded by MAX_ROWS per table to stay within transaction limits. If a user
 * exceeds this, run the relink again — patches for already-migrated rows are
 * a no-op because the old userId no longer matches.
 */
const MAX_ROWS = 1024;

export async function relinkChildRows(
  ctx: MutationCtx,
  oldUserId: string,
  newUserId: string
): Promise<void> {
  if (oldUserId === newUserId) return;

  const highlights = await ctx.db
    .query("highlights")
    .withIndex("by_user", (q) => q.eq("userId", oldUserId))
    .take(MAX_ROWS);
  for (const row of highlights) {
    await ctx.db.patch(row._id, { userId: newUserId });
  }

  const wisdom = await ctx.db
    .query("savedWisdom")
    .withIndex("by_user", (q) => q.eq("userId", oldUserId))
    .take(MAX_ROWS);
  for (const row of wisdom) {
    await ctx.db.patch(row._id, { userId: newUserId });
  }

  const history = await ctx.db
    .query("readingHistory")
    .withIndex("by_user", (q) => q.eq("userId", oldUserId))
    .take(MAX_ROWS);
  for (const row of history) {
    await ctx.db.patch(row._id, { userId: newUserId });
  }

  const memberships = await ctx.db
    .query("groupMembers")
    .withIndex("by_user", (q) => q.eq("userId", oldUserId))
    .take(MAX_ROWS);
  for (const row of memberships) {
    await ctx.db.patch(row._id, { userId: newUserId });
  }

  const reactions = await ctx.db
    .query("groupPostReactions")
    .withIndex("by_user", (q) => q.eq("userId", oldUserId))
    .take(MAX_ROWS);
  for (const row of reactions) {
    await ctx.db.patch(row._id, { userId: newUserId });
  }

  const rsvps = await ctx.db
    .query("groupEventRsvps")
    .withIndex("by_user", (q) => q.eq("userId", oldUserId))
    .take(MAX_ROWS);
  for (const row of rsvps) {
    await ctx.db.patch(row._id, { userId: newUserId });
  }

  const posts = await ctx.db
    .query("groupPosts")
    .withIndex("by_author", (q) => q.eq("authorId", oldUserId))
    .take(MAX_ROWS);
  for (const row of posts) {
    await ctx.db.patch(row._id, { authorId: newUserId });
  }

  const comments = await ctx.db
    .query("groupPostComments")
    .withIndex("by_author", (q) => q.eq("authorId", oldUserId))
    .take(MAX_ROWS);
  for (const row of comments) {
    await ctx.db.patch(row._id, { authorId: newUserId });
  }

  const groupsCreated = await ctx.db
    .query("groups")
    .withIndex("by_created", (q) => q.eq("createdBy", oldUserId))
    .take(MAX_ROWS);
  for (const row of groupsCreated) {
    await ctx.db.patch(row._id, { createdBy: newUserId });
  }

  const eventsCreated = await ctx.db
    .query("groupEvents")
    .withIndex("by_created", (q) => q.eq("createdBy", oldUserId))
    .take(MAX_ROWS);
  for (const row of eventsCreated) {
    await ctx.db.patch(row._id, { createdBy: newUserId });
  }
}

/**
 * One-shot backfill: pulls every user from the Clerk Backend API and writes
 * their email to the matching profile (by clerkUserId). Run before cutting
 * over to Convex Auth so the email-based relink in `ensureProfile` has data
 * to match against.
 *
 * Usage:
 *   1. Set `CLERK_SECRET_KEY` in the Convex dashboard env vars.
 *   2. `npx convex run migrations:backfillClerkEmails`
 */
export const backfillClerkEmails = action({
  args: {},
  handler: async (ctx): Promise<{ scanned: number; written: number }> => {
    const secret = process.env.CLERK_SECRET_KEY;
    if (!secret) {
      throw new Error(
        "CLERK_SECRET_KEY is not set in this Convex deployment's env vars."
      );
    }

    let offset = 0;
    const limit = 100;
    let scanned = 0;
    let written = 0;

    while (true) {
      const res = await fetch(
        `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${secret}` } }
      );
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Clerk API ${res.status}: ${body}`);
      }
      const users = (await res.json()) as Array<{
        id: string;
        email_addresses?: Array<{ id: string; email_address: string }>;
        primary_email_address_id?: string | null;
      }>;
      if (users.length === 0) break;

      for (const u of users) {
        scanned++;
        const primary =
          u.email_addresses?.find((e) => e.id === u.primary_email_address_id) ??
          u.email_addresses?.[0];
        if (!primary?.email_address) continue;
        const result = await ctx.runMutation(
          internal.migrations.setProfileEmailByClerkId,
          { clerkUserId: u.id, email: primary.email_address }
        );
        if ("created" in result || "updated" in result) written++;
      }

      if (users.length < limit) break;
      offset += limit;
    }

    return { scanned, written };
  },
});
