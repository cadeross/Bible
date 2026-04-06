import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireUserId } from "./lib";

function randomInviteCode(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function profileForUser(ctx: QueryCtx | MutationCtx, clerkUserId: string) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_clerk", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

async function getMembership(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
  userId: string
) {
  return await ctx.db
    .query("groupMembers")
    .withIndex("by_group_user", (q) =>
      q.eq("groupId", groupId).eq("userId", userId)
    )
    .unique();
}

async function assertAdmin(
  ctx: MutationCtx,
  groupId: Id<"groups">,
  userId: string
) {
  const m = await getMembership(ctx, groupId, userId);
  if (!m || m.status !== "active" || m.role !== "admin") {
    throw new Error("Admin only");
  }
  return m;
}

function serializePost(p: {
  _id: Id<"groupPosts">;
  groupId: Id<"groups">;
  authorId: string;
  postType: "text" | "verse_share" | "weekly_content";
  content?: string;
  verseRef?: string;
  verseText?: string;
  verseBook?: string;
  verseChapter?: number;
  verseStart?: number;
  verseEnd?: number;
  isPinned: boolean;
  pinnedUntil?: string;
  reactionCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: p._id,
    group_id: p.groupId,
    author_id: p.authorId,
    post_type: p.postType,
    content: p.content ?? null,
    verse_ref: p.verseRef ?? null,
    verse_text: p.verseText ?? null,
    verse_book: p.verseBook ?? null,
    verse_chapter: p.verseChapter ?? null,
    verse_start: p.verseStart ?? null,
    verse_end: p.verseEnd ?? null,
    is_pinned: p.isPinned,
    pinned_until: p.pinnedUntil ?? null,
    reaction_count: p.reactionCount,
    comment_count: p.commentCount,
    created_at: new Date(p.createdAt).toISOString(),
    updated_at: new Date(p.updatedAt).toISOString(),
  };
}

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("groups").collect();
    return all
      .filter(
        (g) =>
          g.visibility === "public_open" || g.visibility === "public_gated"
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const links = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    const groups = [];
    for (const link of links) {
      const g = await ctx.db.get(link.groupId);
      if (g) groups.push(g);
    }
    return groups.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getByInviteCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return await ctx.db
      .query("groups")
      .withIndex("by_invite", (q) => q.eq("inviteCode", code))
      .unique();
  },
});

export const get = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    return await ctx.db.get(groupId);
  },
});

export const getMyMembership = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await getMembership(ctx, groupId, identity.subject);
  },
});

export const listMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const rows = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    rows.sort((a, b) => a.joinedAt - b.joinedAt);
    const out = [];
    for (const row of rows) {
      const p = await profileForUser(ctx, row.userId);
      out.push({
        ...row,
        username: p?.username ?? null,
        avatar_url: p?.avatarUrl ?? null,
      });
    }
    return out;
  },
});

export const join = mutation({
  args: {
    groupId: v.id("groups"),
    inviteCode: v.optional(v.string()),
  },
  handler: async (ctx, { groupId, inviteCode }) => {
    const userId = await requireUserId(ctx);
    const group = await ctx.db.get(groupId);
    if (!group) return { success: false as const, error: "Group not found." };

    let status: "active" | "pending" = "active";
    if (group.visibility === "public_gated") status = "pending";
    if (group.visibility === "private") {
      if (!inviteCode || inviteCode !== group.inviteCode) {
        return { success: false as const, error: "Invalid invite code." };
      }
    }

    const existing = await getMembership(ctx, groupId, userId);
    if (existing) {
      return { success: false as const, error: "Already a member." };
    }

    const now = Date.now();
    await ctx.db.insert("groupMembers", {
      groupId,
      userId,
      role: "member",
      status,
      joinedAt: now,
    });
    await ctx.db.patch(groupId, {
      memberCount: group.memberCount + 1,
      updatedAt: now,
    });
    return { success: true as const };
  },
});

export const leave = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await requireUserId(ctx);
    const m = await getMembership(ctx, groupId, userId);
    if (!m) return { success: false as const, error: "Not a member." };
    const group = await ctx.db.get(groupId);
    await ctx.db.delete(m._id);
    if (group && group.memberCount > 0) {
      await ctx.db.patch(groupId, {
        memberCount: group.memberCount - 1,
        updatedAt: Date.now(),
      });
    }
    return { success: true as const };
  },
});

export const updateMemberStatus = mutation({
  args: {
    memberId: v.id("groupMembers"),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("banned")
    ),
  },
  handler: async (ctx, { memberId, status }) => {
    const userId = await requireUserId(ctx);
    const row = await ctx.db.get(memberId);
    if (!row) return false;
    await assertAdmin(ctx, row.groupId, userId);
    await ctx.db.patch(memberId, { status });
    return true;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    visibility: v.union(
      v.literal("public_open"),
      v.literal("public_gated"),
      v.literal("private")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      description: args.description,
      visibility: args.visibility,
      inviteCode: randomInviteCode(),
      createdBy: userId,
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("groupMembers", {
      groupId,
      userId,
      role: "admin",
      status: "active",
      joinedAt: now,
    });
    const g = await ctx.db.get(groupId);
    return { group: g };
  },
});

export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    visibility: v.optional(
      v.union(
        v.literal("public_open"),
        v.literal("public_gated"),
        v.literal("private")
      )
    ),
  },
  handler: async (ctx, { groupId, ...patch }) => {
    const userId = await requireUserId(ctx);
    await assertAdmin(ctx, groupId, userId);
    const clean: Record<string, unknown> = { updatedAt: Date.now() };
    if (patch.name !== undefined) clean.name = patch.name;
    if (patch.description !== undefined) clean.description = patch.description;
    if (patch.visibility !== undefined) clean.visibility = patch.visibility;
    await ctx.db.patch(groupId, clean);
    return { success: true as const };
  },
});

export const regenerateInviteCode = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await requireUserId(ctx);
    await assertAdmin(ctx, groupId, userId);
    const code = randomInviteCode();
    await ctx.db.patch(groupId, {
      inviteCode: code,
      updatedAt: Date.now(),
    });
    return code;
  },
});

export const fetchFeed = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const identity = await ctx.auth.getUserIdentity();
    const posts = await ctx.db
      .query("groupPosts")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    posts.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });

    const postIds = new Set(posts.map((p) => p._id));
    const reactionMap = new Map<
      Id<"groupPosts">,
      Id<"groupPostReactions">
    >();
    if (identity) {
      const allUserReactions = await ctx.db
        .query("groupPostReactions")
        .collect();
      for (const r of allUserReactions) {
        if (r.userId === identity.subject && postIds.has(r.postId)) {
          reactionMap.set(r.postId, r._id);
        }
      }
    }

    const out = [];
    for (const p of posts) {
      const prof = await profileForUser(ctx, p.authorId);
      out.push({
        ...serializePost(p),
        author_username: prof?.username ?? null,
        author_avatar: prof?.avatarUrl ?? null,
        user_reacted: reactionMap.has(p._id),
        user_reaction_id: reactionMap.get(p._id) ?? null,
      });
    }
    return out;
  },
});

export const createPost = mutation({
  args: {
    group_id: v.id("groups"),
    post_type: v.union(
      v.literal("text"),
      v.literal("verse_share"),
      v.literal("weekly_content")
    ),
    content: v.optional(v.string()),
    verse_ref: v.optional(v.string()),
    verse_text: v.optional(v.string()),
    verse_book: v.optional(v.string()),
    verse_chapter: v.optional(v.number()),
    verse_start: v.optional(v.number()),
    verse_end: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const m = await getMembership(ctx, args.group_id, userId);
    if (!m || m.status !== "active") throw new Error("Not a member");
    const now = Date.now();
    const postId = await ctx.db.insert("groupPosts", {
      groupId: args.group_id,
      authorId: userId,
      postType: args.post_type,
      content: args.content,
      verseRef: args.verse_ref,
      verseText: args.verse_text,
      verseBook: args.verse_book,
      verseChapter: args.verse_chapter,
      verseStart: args.verse_start,
      verseEnd: args.verse_end,
      isPinned: false,
      reactionCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    const row = await ctx.db.get(postId);
    if (!row) throw new Error("Failed to create post");
    return { post: serializePost(row) };
  },
});

export const deletePost = mutation({
  args: { postId: v.id("groupPosts") },
  handler: async (ctx, { postId }) => {
    const userId = await requireUserId(ctx);
    const post = await ctx.db.get(postId);
    if (!post) return false;
    const isAuthor = post.authorId === userId;
    let isAdminUser = false;
    try {
      await assertAdmin(ctx, post.groupId, userId);
      isAdminUser = true;
    } catch {
      isAdminUser = false;
    }
    if (!isAuthor && !isAdminUser) return false;

    const reactions = await ctx.db
      .query("groupPostReactions")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
    for (const r of reactions) await ctx.db.delete(r._id);

    const comments = await ctx.db
      .query("groupPostComments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);

    await ctx.db.delete(postId);
    return true;
  },
});

export const toggleReaction = mutation({
  args: {
    postId: v.id("groupPosts"),
    existingReactionId: v.union(v.id("groupPostReactions"), v.null()),
  },
  handler: async (ctx, { postId, existingReactionId }) => {
    const userId = await requireUserId(ctx);
    const post = await ctx.db.get(postId);
    if (!post) return { reacted: false };

    if (existingReactionId) {
      const r = await ctx.db.get(existingReactionId);
      if (r && r.userId === userId) {
        await ctx.db.delete(existingReactionId);
        await ctx.db.patch(postId, {
          reactionCount: Math.max(0, post.reactionCount - 1),
          updatedAt: Date.now(),
        });
      }
      return { reacted: false };
    }

    const dup = await ctx.db
      .query("groupPostReactions")
      .withIndex("by_post_user", (q) =>
        q.eq("postId", postId).eq("userId", userId)
      )
      .unique();
    if (dup) {
      return { reacted: true };
    }

    await ctx.db.insert("groupPostReactions", {
      postId,
      userId,
      emoji: "👍",
    });
    await ctx.db.patch(postId, {
      reactionCount: post.reactionCount + 1,
      updatedAt: Date.now(),
    });
    return { reacted: true };
  },
});

export const listComments = query({
  args: { postId: v.id("groupPosts") },
  handler: async (ctx, { postId }) => {
    const rows = await ctx.db
      .query("groupPostComments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
    rows.sort((a, b) => a.createdAt - b.createdAt);
    const out = [];
    for (const row of rows) {
      const p = await profileForUser(ctx, row.authorId);
      out.push({
        id: row._id,
        post_id: row.postId,
        author_id: row.authorId,
        content: row.content,
        created_at: new Date(row.createdAt).toISOString(),
        author_username: p?.username ?? null,
        author_avatar: p?.avatarUrl ?? null,
      });
    }
    return out;
  },
});

export const addComment = mutation({
  args: { postId: v.id("groupPosts"), content: v.string() },
  handler: async (ctx, { postId, content }) => {
    const userId = await requireUserId(ctx);
    const post = await ctx.db.get(postId);
    if (!post) return { error: "Post not found" };
    const now = Date.now();
    const id = await ctx.db.insert("groupPostComments", {
      postId,
      authorId: userId,
      content,
      createdAt: now,
    });
    await ctx.db.patch(postId, {
      commentCount: post.commentCount + 1,
      updatedAt: now,
    });
    const row = await ctx.db.get(id);
    return {
      comment: row
        ? {
            id: row._id,
            post_id: row.postId,
            author_id: row.authorId,
            content: row.content,
            created_at: new Date(row.createdAt).toISOString(),
          }
        : undefined,
    };
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("groupPostComments") },
  handler: async (ctx, { commentId }) => {
    const userId = await requireUserId(ctx);
    const c = await ctx.db.get(commentId);
    if (!c) return false;
    const post = await ctx.db.get(c.postId);
    if (!post) return false;
    const isAuthor = c.authorId === userId;
    let isAdminUser = false;
    try {
      await assertAdmin(ctx, post.groupId, userId);
      isAdminUser = true;
    } catch {
      isAdminUser = false;
    }
    if (!isAuthor && !isAdminUser) return false;

    await ctx.db.delete(commentId);
    await ctx.db.patch(post._id, {
      commentCount: Math.max(0, post.commentCount - 1),
      updatedAt: Date.now(),
    });
    return true;
  },
});

async function recalcRsvpCounts(ctx: MutationCtx, eventId: Id<"groupEvents">) {
  const rsvps = await ctx.db
    .query("groupEventRsvps")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();
  let yes = 0,
    no = 0,
    maybe = 0;
  for (const r of rsvps) {
    if (r.status === "yes") yes++;
    else if (r.status === "no") no++;
    else maybe++;
  }
  await ctx.db.patch(eventId, {
    rsvpYesCount: yes,
    rsvpNoCount: no,
    rsvpMaybeCount: maybe,
  });
}

export const listEvents = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const identity = await ctx.auth.getUserIdentity();
    const rows = await ctx.db
      .query("groupEvents")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    rows.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    const events = rows.map((e) => ({
      id: e._id,
      group_id: e.groupId,
      created_by: e.createdBy,
      title: e.title,
      description: e.description ?? null,
      event_date: e.eventDate,
      bible_materials: e.bibleMaterials,
      rsvp_yes_count: e.rsvpYesCount,
      rsvp_no_count: e.rsvpNoCount,
      rsvp_maybe_count: e.rsvpMaybeCount,
      created_at: new Date(e.createdAt).toISOString(),
      user_rsvp: null as "yes" | "no" | "maybe" | null,
      user_rsvp_id: null as Id<"groupEventRsvps"> | null,
    }));

    if (identity) {
      const ids = rows.map((e) => e._id);
      const allRsvps = await ctx.db.query("groupEventRsvps").collect();
      const mine = allRsvps.filter(
        (r) => r.userId === identity.subject && ids.includes(r.eventId)
      );
      const map = new Map(mine.map((r) => [r.eventId, r]));
      for (const ev of events) {
        const r = map.get(ev.id as Id<"groupEvents">);
        if (r) {
          ev.user_rsvp = r.status;
          ev.user_rsvp_id = r._id;
        }
      }
    }
    return events;
  },
});

export const createEvent = mutation({
  args: {
    group_id: v.id("groups"),
    title: v.string(),
    description: v.optional(v.string()),
    event_date: v.string(),
    bible_materials: v.optional(
      v.array(v.object({ ref: v.string(), text: v.string() }))
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const m = await getMembership(ctx, args.group_id, userId);
    if (!m || m.status !== "active") return { error: "Not a member" };
    const now = Date.now();
    const eventId = await ctx.db.insert("groupEvents", {
      groupId: args.group_id,
      createdBy: userId,
      title: args.title,
      description: args.description,
      eventDate: args.event_date,
      bibleMaterials: args.bible_materials ?? [],
      rsvpYesCount: 0,
      rsvpNoCount: 0,
      rsvpMaybeCount: 0,
      createdAt: now,
    });
    const row = await ctx.db.get(eventId);
    if (!row) return { error: "Failed" };
    return {
      event: {
        id: row._id,
        group_id: row.groupId,
        created_by: row.createdBy,
        title: row.title,
        description: row.description ?? null,
        event_date: row.eventDate,
        bible_materials: row.bibleMaterials,
        rsvp_yes_count: row.rsvpYesCount,
        rsvp_no_count: row.rsvpNoCount,
        rsvp_maybe_count: row.rsvpMaybeCount,
        created_at: new Date(row.createdAt).toISOString(),
      },
    };
  },
});

export const upsertRsvp = mutation({
  args: {
    eventId: v.id("groupEvents"),
    newStatus: v.union(v.literal("yes"), v.literal("no"), v.literal("maybe")),
    existingRsvpId: v.union(v.id("groupEventRsvps"), v.null()),
    currentStatus: v.union(
      v.literal("yes"),
      v.literal("no"),
      v.literal("maybe"),
      v.null()
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    if (args.existingRsvpId && args.currentStatus === args.newStatus) {
      await ctx.db.delete(args.existingRsvpId);
      await recalcRsvpCounts(ctx, args.eventId);
      return { status: null };
    }

    const existing = await ctx.db
      .query("groupEventRsvps")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", userId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { status: args.newStatus });
    } else {
      await ctx.db.insert("groupEventRsvps", {
        eventId: args.eventId,
        userId,
        status: args.newStatus,
      });
    }
    await recalcRsvpCounts(ctx, args.eventId);
    return { status: args.newStatus };
  },
});
