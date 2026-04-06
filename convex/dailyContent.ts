import { v } from "convex/values";
import { query } from "./_generated/server";

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    return await ctx.db
      .query("dailyContent")
      .withIndex("by_date", (q) => q.eq("date", date))
      .unique();
  },
});
