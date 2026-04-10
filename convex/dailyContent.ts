import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    return await ctx.db
      .query("dailyContent")
      .withIndex("by_date", (q) => q.eq("date", date))
      .unique();
  },
});

/** Upsert daily content for a given date. Called by the nightly seed cron via the API route. */
export const upsertForDate = mutation({
  args: {
    date: v.string(),
    verseRef: v.string(),
    verseText: v.string(),
    verseSource: v.string(),
    wisdomText: v.string(),
    wisdomAuthor: v.string(),
    feastName: v.optional(v.string()),
    liturgicalSeason: v.optional(v.string()),
    rank: v.optional(v.string()),
    liturgicalColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyContent")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        verseRef: args.verseRef,
        verseText: args.verseText,
        verseSource: args.verseSource,
        wisdomText: args.wisdomText,
        wisdomAuthor: args.wisdomAuthor,
        feastName: args.feastName,
        liturgicalSeason: args.liturgicalSeason,
        rank: args.rank,
        liturgicalColor: args.liturgicalColor,
      });
      return existing._id;
    }

    return await ctx.db.insert("dailyContent", { ...args, createdAt: now });
  },
});
