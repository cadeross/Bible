import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib";

export const listForChapter = query({
  args: {
    book: v.string(),
    chapter: v.number(),
  },
  handler: async (ctx, { book, chapter }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rows = await ctx.db
      .query("highlights")
      .withIndex("by_user_book_chapter", (q) =>
        q.eq("userId", identity.subject).eq("book", book).eq("chapter", chapter)
      )
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rows = await ctx.db
      .query("highlights")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const save = mutation({
  args: {
    book: v.string(),
    chapter: v.number(),
    verse: v.number(),
    color: v.string(),
    content: v.string(),
    note: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = args.createdAt ?? Date.now();
    const matches = await ctx.db
      .query("highlights")
      .withIndex("by_user_verse", (q) =>
        q
          .eq("userId", userId)
          .eq("book", args.book)
          .eq("chapter", args.chapter)
          .eq("verse", args.verse)
      )
      .collect();
    const existing = matches.sort((a, b) => b.createdAt - a.createdAt)[0];
    if (existing) {
      await ctx.db.patch(existing._id, {
        color: args.color,
        note: args.note,
        content: args.content,
        createdAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("highlights", {
      userId,
      book: args.book,
      chapter: args.chapter,
      verse: args.verse,
      color: args.color,
      content: args.content,
      note: args.note,
      createdAt: now,
    });
  },
});

export const remove = mutation({
  args: {
    book: v.string(),
    chapter: v.number(),
    verse: v.number(),
  },
  handler: async (ctx, { book, chapter, verse }) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("highlights")
      .withIndex("by_user_verse", (q) =>
        q.eq("userId", userId).eq("book", book).eq("chapter", chapter).eq("verse", verse)
      )
      .collect();
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
  },
});
