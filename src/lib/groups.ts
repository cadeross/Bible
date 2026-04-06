"use client";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { getConvexHttp } from "@/lib/convex/http";

export type GroupVisibility = "public_open" | "public_gated" | "private";
export type GroupMemberRole = "admin" | "member";
export type GroupMemberStatus = "active" | "pending" | "banned";
export type GroupPostType = "text" | "verse_share" | "weekly_content";
export type RsvpStatus = "yes" | "no" | "maybe";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  visibility: GroupVisibility;
  invite_code: string;
  created_by: string;
  member_count: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joined_at: string;
  username?: string | null;
  avatar_url?: string | null;
}

export interface GroupPost {
  id: string;
  group_id: string;
  author_id: string;
  post_type: GroupPostType;
  content: string | null;
  verse_ref: string | null;
  verse_text: string | null;
  verse_book: string | null;
  verse_chapter: number | null;
  verse_start: number | null;
  verse_end: number | null;
  is_pinned: boolean;
  pinned_until: string | null;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author_username?: string | null;
  author_avatar?: string | null;
  user_reacted?: boolean;
  user_reaction_id?: string | null;
}

export interface GroupPostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_username?: string | null;
  author_avatar?: string | null;
}

export interface BibleMaterial {
  ref: string;
  text: string;
}

export interface GroupEvent {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  event_date: string;
  bible_materials: BibleMaterial[];
  rsvp_yes_count: number;
  rsvp_no_count: number;
  rsvp_maybe_count: number;
  created_at: string;
  user_rsvp?: RsvpStatus | null;
  user_rsvp_id?: string | null;
}

function gid(id: string): Id<"groups"> {
  return id as Id<"groups">;
}

function mapGroup(d: {
  _id: string;
  name: string;
  description?: string;
  visibility: GroupVisibility;
  inviteCode: string;
  createdBy: string;
  memberCount: number;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
}): Group {
  return {
    id: d._id,
    name: d.name,
    description: d.description ?? null,
    visibility: d.visibility,
    invite_code: d.inviteCode,
    created_by: d.createdBy,
    member_count: d.memberCount,
    avatar_url: d.avatarUrl ?? null,
    created_at: new Date(d.createdAt).toISOString(),
    updated_at: new Date(d.updatedAt).toISOString(),
  };
}

export async function fetchPublicGroups(): Promise<Group[]> {
  const client = getConvexHttp();
  const rows = await client.query(api.groups.listPublic, {});
  return rows.map(mapGroup);
}

export async function fetchMyGroups(): Promise<Group[]> {
  const client = getConvexHttp();
  const rows = await client.query(api.groups.listMine, {});
  return rows.map(mapGroup);
}

export async function fetchGroupByInviteCode(code: string): Promise<Group | null> {
  const client = getConvexHttp();
  const row = await client.query(api.groups.getByInviteCode, { code });
  return row ? mapGroup(row as Parameters<typeof mapGroup>[0]) : null;
}

export async function fetchGroup(groupId: string): Promise<Group | null> {
  const client = getConvexHttp();
  const row = await client.query(api.groups.get, { groupId: gid(groupId) });
  return row ? mapGroup(row as Parameters<typeof mapGroup>[0]) : null;
}

export async function fetchMyMembership(
  groupId: string
): Promise<GroupMember | null> {
  const client = getConvexHttp();
  const row = await client.query(api.groups.getMyMembership, {
    groupId: gid(groupId),
  });
  if (!row) return null;
  return {
    id: row._id,
    group_id: row.groupId,
    user_id: row.userId,
    role: row.role,
    status: row.status,
    joined_at: new Date(row.joinedAt).toISOString(),
  };
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
  const client = getConvexHttp();
  const rows = await client.query(api.groups.listMembers, {
    groupId: gid(groupId),
  });
  return rows.map((row: {
    _id: string;
    groupId: string;
    userId: string;
    role: GroupMemberRole;
    status: GroupMemberStatus;
    joinedAt: number;
    username?: string | null;
    avatar_url?: string | null;
  }) => ({
    id: row._id,
    group_id: row.groupId,
    user_id: row.userId,
    role: row.role,
    status: row.status,
    joined_at: new Date(row.joinedAt).toISOString(),
    username: row.username ?? null,
    avatar_url: row.avatar_url ?? null,
  }));
}

export async function joinGroup(
  groupId: string,
  visibility: GroupVisibility,
  inviteCode?: string
): Promise<{ success: boolean; error?: string }> {
  const client = getConvexHttp();
  return await client.mutation(api.groups.join, {
    groupId: gid(groupId),
    inviteCode: visibility === "private" ? inviteCode : undefined,
  });
}

export async function leaveGroup(
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getConvexHttp();
  return await client.mutation(api.groups.leave, { groupId: gid(groupId) });
}

export async function updateMemberStatus(
  memberId: string,
  status: GroupMemberStatus
): Promise<boolean> {
  const client = getConvexHttp();
  return await client.mutation(api.groups.updateMemberStatus, {
    memberId: memberId as Id<"groupMembers">,
    status,
  });
}

export async function createGroup(input: {
  name: string;
  description: string;
  visibility: GroupVisibility;
}): Promise<{ group?: Group; error?: string }> {
  const client = getConvexHttp();
  const res = await client.mutation(api.groups.create, {
    name: input.name,
    description: input.description,
    visibility: input.visibility,
  });
  if (!res.group) return { error: "Failed to create group" };
  return { group: mapGroup(res.group as Parameters<typeof mapGroup>[0]) };
}

export async function updateGroup(
  groupId: string,
  updates: Partial<Pick<Group, "name" | "description" | "visibility">>
): Promise<{ success: boolean; error?: string }> {
  const client = getConvexHttp();
  return await client.mutation(api.groups.updateGroup, {
    groupId: gid(groupId),
    name: updates.name,
    description: updates.description ?? undefined,
    visibility: updates.visibility,
  });
}

export async function regenerateInviteCode(
  groupId: string
): Promise<string | null> {
  const client = getConvexHttp();
  try {
    return await client.mutation(api.groups.regenerateInviteCode, {
      groupId: gid(groupId),
    });
  } catch {
    return null;
  }
}

export async function fetchGroupFeed(groupId: string): Promise<GroupPost[]> {
  const client = getConvexHttp();
  const rows = await client.query(api.groups.fetchFeed, {
    groupId: gid(groupId),
  });
  return rows as GroupPost[];
}

export async function createPost(input: {
  group_id: string;
  post_type: GroupPostType;
  content?: string;
  verse_ref?: string;
  verse_text?: string;
  verse_book?: string;
  verse_chapter?: number;
  verse_start?: number;
  verse_end?: number;
}): Promise<{ post?: GroupPost; error?: string }> {
  const client = getConvexHttp();
  const res = await client.mutation(api.groups.createPost, {
    group_id: gid(input.group_id),
    post_type: input.post_type,
    content: input.content,
    verse_ref: input.verse_ref,
    verse_text: input.verse_text,
    verse_book: input.verse_book,
    verse_chapter: input.verse_chapter,
    verse_start: input.verse_start,
    verse_end: input.verse_end,
  });
  if (!res.post) return { error: "Failed" };
  return { post: res.post as GroupPost };
}

export async function deletePost(postId: string): Promise<boolean> {
  const client = getConvexHttp();
  return await client.mutation(api.groups.deletePost, {
    postId: postId as Id<"groupPosts">,
  });
}

export async function toggleReaction(
  postId: string,
  existingReactionId: string | null
): Promise<{ reacted: boolean }> {
  const client = getConvexHttp();
  return await client.mutation(api.groups.toggleReaction, {
    postId: postId as Id<"groupPosts">,
    existingReactionId: existingReactionId
      ? (existingReactionId as Id<"groupPostReactions">)
      : null,
  });
}

export async function fetchComments(
  postId: string
): Promise<GroupPostComment[]> {
  const client = getConvexHttp();
  const rows = await client.query(api.groups.listComments, {
    postId: postId as Id<"groupPosts">,
  });
  return rows as GroupPostComment[];
}

export async function addComment(
  postId: string,
  content: string
): Promise<{ comment?: GroupPostComment; error?: string }> {
  const client = getConvexHttp();
  const res = await client.mutation(api.groups.addComment, {
    postId: postId as Id<"groupPosts">,
    content,
  });
  if (res.error) return { error: res.error };
  return { comment: res.comment as GroupPostComment | undefined };
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const client = getConvexHttp();
  return await client.mutation(api.groups.deleteComment, {
    commentId: commentId as Id<"groupPostComments">,
  });
}

export async function fetchGroupEvents(groupId: string): Promise<GroupEvent[]> {
  const client = getConvexHttp();
  const rows = await client.query(api.groups.listEvents, {
    groupId: gid(groupId),
  });
  return rows as GroupEvent[];
}

export async function createEvent(input: {
  group_id: string;
  title: string;
  description?: string;
  event_date: string;
  bible_materials?: BibleMaterial[];
}): Promise<{ event?: GroupEvent; error?: string }> {
  const client = getConvexHttp();
  const res = await client.mutation(api.groups.createEvent, {
    group_id: gid(input.group_id),
    title: input.title,
    description: input.description,
    event_date: input.event_date,
    bible_materials: input.bible_materials,
  });
  if (res.error) return { error: res.error };
  if (!res.event) return { error: "Failed" };
  return { event: res.event as GroupEvent };
}

export async function upsertRsvp(
  eventId: string,
  newStatus: RsvpStatus,
  existingRsvpId: string | null,
  currentStatus: RsvpStatus | null | undefined
): Promise<{ status: RsvpStatus | null }> {
  const client = getConvexHttp();
  return await client.mutation(api.groups.upsertRsvp, {
    eventId: eventId as Id<"groupEvents">,
    newStatus,
    existingRsvpId: existingRsvpId
      ? (existingRsvpId as Id<"groupEventRsvps">)
      : null,
    currentStatus: currentStatus ?? null,
  });
}
