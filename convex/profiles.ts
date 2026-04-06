import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib";

export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", userId))
      .unique();
    if (existing) return existing._id;
    const now = Date.now();
    return await ctx.db.insert("profiles", {
      clerkUserId: userId,
      updatedAt: now,
    });
  },
});

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
  },
});

export const isUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const u = username.toLowerCase();
    const row = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", u))
      .unique();
    return row === null;
  },
});

export const updateLastRead = mutation({
  args: {
    book: v.string(),
    chapter: v.number(),
  },
  handler: async (ctx, { book, chapter }) => {
    const userId = await requireUserId(ctx);
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", userId))
      .unique();
    const now = Date.now();
    if (!profile) {
      await ctx.db.insert("profiles", {
        clerkUserId: userId,
        lastReadBook: book,
        lastReadChapter: chapter,
        updatedAt: now,
      });
      return;
    }
    await ctx.db.patch(profile._id, {
      lastReadBook: book,
      lastReadChapter: chapter,
      updatedAt: now,
    });
  },
});

export const completeOnboarding = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const userId = await requireUserId(ctx);
    const normalized = username.toLowerCase();
    const taken = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .unique();
    if (taken && taken.clerkUserId !== userId) {
      throw new Error("Username already taken");
    }
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", userId))
      .unique();
    const now = Date.now();
    if (!profile) {
      await ctx.db.insert("profiles", {
        clerkUserId: userId,
        username: normalized,
        onboardingCompletedAt: now,
        updatedAt: now,
      });
      return;
    }
    await ctx.db.patch(profile._id, {
      username: normalized,
      onboardingCompletedAt: now,
      updatedAt: now,
    });
  },
});

export const updateUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const userId = await requireUserId(ctx);
    const normalized = username.toLowerCase();
    const taken = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .unique();
    if (taken && taken.clerkUserId !== userId) {
      throw new Error("Username already taken");
    }
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", userId))
      .unique();
    const now = Date.now();
    if (!profile) {
      await ctx.db.insert("profiles", {
        clerkUserId: userId,
        username: normalized,
        updatedAt: now,
      });
      return;
    }
    await ctx.db.patch(profile._id, {
      username: normalized,
      updatedAt: now,
    });
  },
});

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const setAvatarFromStorage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await requireUserId(ctx);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Invalid storage file");
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", userId))
      .unique();
    const now = Date.now();
    const avatarUrl = `${url}?t=${now}`;
    if (!profile) {
      await ctx.db.insert("profiles", {
        clerkUserId: userId,
        avatarUrl,
        avatarStorageId: storageId,
        updatedAt: now,
      });
      return avatarUrl;
    }
    await ctx.db.patch(profile._id, {
      avatarUrl,
      avatarStorageId: storageId,
      updatedAt: now,
    });
    return avatarUrl;
  },
});
