import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rows = await ctx.db
      .query("readingHistory")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    return rows.sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  },
});

export const add = mutation({
  args: {
    book: v.string(),
    chapter: v.number(),
    wordsRead: v.number(),
    durationSeconds: v.optional(v.number()),
    completedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await ctx.db.insert("readingHistory", {
      userId,
      book: args.book,
      chapter: args.chapter,
      wordsRead: args.wordsRead,
      durationSeconds: args.durationSeconds ?? 0,
      completedAt: args.completedAt,
    });
  },
});
