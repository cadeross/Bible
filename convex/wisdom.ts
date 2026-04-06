import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rows = await ctx.db
      .query("savedWisdom")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const save = mutation({
  args: {
    content: v.string(),
    source: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, { content, source, createdAt }) => {
    const userId = await requireUserId(ctx);
    const now = createdAt ?? Date.now();
    const existing = await ctx.db
      .query("savedWisdom")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("content"), content))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("savedWisdom", {
      userId,
      content,
      source,
      createdAt: now,
    });
  },
});
