import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    lastReadBook: v.optional(v.string()),
    lastReadChapter: v.optional(v.number()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    updatedAt: v.number(),
    onboardingCompletedAt: v.optional(v.number()),
    legacySupabaseId: v.optional(v.string()),
    legacyClerkUserId: v.optional(v.string()),
    bibleVersion: v.optional(v.string()),
    enabledTranslations: v.optional(v.union(v.array(v.string()), v.null())),
  })
    .index("by_clerk", ["clerkUserId"])
    .index("by_username", ["username"])
    .index("by_email", ["email"]),

  highlights: defineTable({
    userId: v.string(),
    book: v.string(),
    chapter: v.number(),
    verse: v.number(),
    color: v.string(),
    content: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_book_chapter", ["userId", "book", "chapter"])
    .index("by_user_verse", ["userId", "book", "chapter", "verse"]),

  savedWisdom: defineTable({
    userId: v.string(),
    content: v.string(),
    source: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  readingHistory: defineTable({
    userId: v.string(),
    book: v.string(),
    chapter: v.number(),
    wordsRead: v.number(),
    durationSeconds: v.number(),
    completedAt: v.string(),
  }).index("by_user", ["userId"]),

  dailyContent: defineTable({
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
    createdAt: v.string(),
  }).index("by_date", ["date"]),

  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    visibility: v.union(
      v.literal("public_open"),
      v.literal("public_gated"),
      v.literal("private")
    ),
    inviteCode: v.string(),
    createdBy: v.string(),
    memberCount: v.number(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_invite", ["inviteCode"])
    .index("by_created", ["createdBy"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("banned")
    ),
    joinedAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_user", ["groupId", "userId"]),

  groupPosts: defineTable({
    groupId: v.id("groups"),
    authorId: v.string(),
    postType: v.union(
      v.literal("text"),
      v.literal("verse_share"),
      v.literal("weekly_content")
    ),
    content: v.optional(v.string()),
    verseRef: v.optional(v.string()),
    verseText: v.optional(v.string()),
    verseBook: v.optional(v.string()),
    verseChapter: v.optional(v.number()),
    verseStart: v.optional(v.number()),
    verseEnd: v.optional(v.number()),
    isPinned: v.boolean(),
    pinnedUntil: v.optional(v.string()),
    reactionCount: v.number(),
    commentCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_author", ["authorId"]),

  groupPostReactions: defineTable({
    postId: v.id("groupPosts"),
    userId: v.string(),
    emoji: v.string(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_post_user", ["postId", "userId"]),

  groupPostComments: defineTable({
    postId: v.id("groupPosts"),
    authorId: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"]),

  groupEvents: defineTable({
    groupId: v.id("groups"),
    createdBy: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    eventDate: v.string(),
    bibleMaterials: v.array(
      v.object({ ref: v.string(), text: v.string() })
    ),
    rsvpYesCount: v.number(),
    rsvpNoCount: v.number(),
    rsvpMaybeCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_created", ["createdBy"]),

  groupEventRsvps: defineTable({
    eventId: v.id("groupEvents"),
    userId: v.string(),
    status: v.union(v.literal("yes"), v.literal("no"), v.literal("maybe")),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user", ["eventId", "userId"]),
});
