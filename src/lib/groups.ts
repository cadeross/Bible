"use client";

import { createClient } from "./supabase/client";

// ─── Enums / Types ────────────────────────────────────────────────────────────

export type GroupVisibility = "public_open" | "public_gated" | "private";
export type GroupMemberRole = "admin" | "member";
export type GroupMemberStatus = "active" | "pending" | "banned";
export type GroupPostType = "text" | "verse_share" | "weekly_content";
export type RsvpStatus = "yes" | "no" | "maybe";

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
    // joined via profile join
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
    // joined via profile
    author_username?: string | null;
    author_avatar?: string | null;
    // local: whether current user has reacted
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

// ─── Discovery ────────────────────────────────────────────────────────────────

export async function fetchPublicGroups(): Promise<Group[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("groups")
        .select("id, name, description, visibility, invite_code, created_by, member_count, avatar_url, created_at, updated_at")
        .in("visibility", ["public_open", "public_gated"])
        .order("created_at", { ascending: false });

    if (error) {
        console.error("fetchPublicGroups", error);
        return [];
    }
    return data ?? [];
}

export async function fetchMyGroups(): Promise<Group[]> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
        .from("group_members")
        .select("group_id, groups!inner(id, name, description, visibility, invite_code, created_by, member_count, avatar_url, created_at, updated_at)")
        .eq("user_id", session.user.id)
        .eq("status", "active");

    if (error) {
        console.error("fetchMyGroups", error);
        return [];
    }

    return (data ?? []).map((row: { groups: unknown }) => row.groups as Group);
}

export async function fetchGroupByInviteCode(code: string): Promise<Group | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("groups")
        .select("id, name, description, visibility, invite_code, created_by, member_count, avatar_url, created_at, updated_at")
        .eq("invite_code", code)
        .single();

    if (error) return null;
    return data;
}

export async function fetchGroup(groupId: string): Promise<Group | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("groups")
        .select("id, name, description, visibility, invite_code, created_by, member_count, avatar_url, created_at, updated_at")
        .eq("id", groupId)
        .single();

    if (error) return null;
    return data;
}

// ─── Membership ───────────────────────────────────────────────────────────────

export async function fetchMyMembership(groupId: string): Promise<GroupMember | null> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from("group_members")
        .select("id, group_id, user_id, role, status, joined_at")
        .eq("group_id", groupId)
        .eq("user_id", session.user.id)
        .single();

    if (error) return null;
    return data;
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("group_members")
        .select("id, group_id, user_id, role, status, joined_at, profiles(username, avatar_url)")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });

    if (error) {
        console.error("fetchGroupMembers", error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
        id: row.id as string,
        group_id: row.group_id as string,
        user_id: row.user_id as string,
        role: row.role as GroupMemberRole,
        status: row.status as GroupMemberStatus,
        joined_at: row.joined_at as string,
        username: (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles)?.username ?? null,
        avatar_url: (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles)?.avatar_url ?? null,
    }));
}

export async function joinGroup(groupId: string, visibility: GroupVisibility, inviteCode?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: "Sign in to join groups." };

    let status: GroupMemberStatus = "active";
    if (visibility === "public_gated") status = "pending";
    if (visibility === "private") {
        // Private groups: validate invite code matches
        if (!inviteCode) return { success: false, error: "Invite code required." };
        const group = await fetchGroup(groupId);
        if (!group || group.invite_code !== inviteCode) return { success: false, error: "Invalid invite code." };
        status = "active";
    }

    const { error } = await supabase.from("group_members").insert([{
        group_id: groupId,
        user_id: session.user.id,
        role: "member",
        status,
    }]);

    if (error) {
        if (error.code === "23505") return { success: false, error: "Already a member." };
        return { success: false, error: error.message };
    }
    return { success: true };
}

export async function leaveGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: "Not signed in." };

    const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", session.user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function updateMemberStatus(memberId: string, status: GroupMemberStatus): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
        .from("group_members")
        .update({ status })
        .eq("id", memberId);
    return !error;
}

// ─── Groups CRUD ─────────────────────────────────────────────────────────────

export async function createGroup(input: {
    name: string;
    description: string;
    visibility: GroupVisibility;
}): Promise<{ group?: Group; error?: string }> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: "Sign in to create a group." };

    const { data, error } = await supabase
        .from("groups")
        .insert([{ ...input, created_by: session.user.id }])
        .select("id, name, description, visibility, invite_code, created_by, member_count, avatar_url, created_at, updated_at")
        .single();

    if (error) return { error: error.message };

    // Creator becomes admin member
    await supabase.from("group_members").insert([{
        group_id: data.id,
        user_id: session.user.id,
        role: "admin",
        status: "active",
    }]);

    return { group: data };
}

export async function updateGroup(groupId: string, updates: Partial<Pick<Group, "name" | "description" | "visibility">>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase
        .from("groups")
        .update(updates)
        .eq("id", groupId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function regenerateInviteCode(groupId: string): Promise<string | null> {
    const supabase = createClient();
    // Generate a new random code client-side via Supabase RPC or just update with DB default
    const { data, error } = await supabase
        .from("groups")
        .update({ invite_code: btoa(String.fromCharCode(...Array.from(crypto.getRandomValues(new Uint8Array(12))))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' }[c] ?? c)) })
        .eq("id", groupId)
        .select("invite_code")
        .single();
    if (error) return null;
    return data.invite_code;
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export async function fetchGroupFeed(groupId: string): Promise<GroupPost[]> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Run posts and reactions queries in parallel
    const [postsResult, reactionsResult] = await Promise.all([
        supabase
            .from("group_posts")
            .select("id, group_id, author_id, post_type, content, verse_ref, verse_text, verse_book, verse_chapter, verse_start, verse_end, is_pinned, pinned_until, reaction_count, comment_count, created_at, updated_at, profiles(username, avatar_url)")
            .eq("group_id", groupId)
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false }),
        session
            ? supabase
                .from("group_post_reactions")
                .select("id, post_id")
                .eq("user_id", session.user.id)
            : Promise.resolve({ data: null, error: null }),
    ]);

    if (postsResult.error) {
        console.error("fetchGroupFeed", postsResult.error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts = (postsResult.data ?? []).map((row: any) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
            id: row.id,
            group_id: row.group_id,
            author_id: row.author_id,
            post_type: row.post_type as GroupPostType,
            content: row.content,
            verse_ref: row.verse_ref,
            verse_text: row.verse_text,
            verse_book: row.verse_book,
            verse_chapter: row.verse_chapter,
            verse_start: row.verse_start,
            verse_end: row.verse_end,
            is_pinned: row.is_pinned,
            pinned_until: row.pinned_until,
            reaction_count: row.reaction_count,
            comment_count: row.comment_count,
            created_at: row.created_at,
            updated_at: row.updated_at,
            author_username: profile?.username ?? null,
            author_avatar: profile?.avatar_url ?? null,
            user_reacted: false,
            user_reaction_id: null,
        };
    }) as GroupPost[];

    // Overlay current user's reactions (filter in memory to the posts we fetched)
    if (reactionsResult.data) {
        const postIdSet = new Set(posts.map((p) => p.id));
        const reactionMap = new Map(
            (reactionsResult.data as { id: string; post_id: string }[])
                .filter((r) => postIdSet.has(r.post_id))
                .map((r) => [r.post_id, r.id])
        );
        posts.forEach((p) => {
            if (reactionMap.has(p.id)) {
                p.user_reacted = true;
                p.user_reaction_id = reactionMap.get(p.id) ?? null;
            }
        });
    }

    return posts;
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
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: "Sign in to post." };

    const { data, error } = await supabase
        .from("group_posts")
        .insert([{ ...input, author_id: session.user.id }])
        .select("id, group_id, author_id, post_type, content, verse_ref, verse_text, verse_book, verse_chapter, verse_start, verse_end, is_pinned, pinned_until, reaction_count, comment_count, created_at, updated_at")
        .single();

    if (error) return { error: error.message };
    return { post: data as GroupPost };
}

export async function deletePost(postId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from("group_posts").delete().eq("id", postId);
    return !error;
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function toggleReaction(postId: string, existingReactionId: string | null): Promise<{ reacted: boolean }> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { reacted: false };

    if (existingReactionId) {
        await supabase.from("group_post_reactions").delete().eq("id", existingReactionId);
        return { reacted: false };
    } else {
        const { error } = await supabase.from("group_post_reactions").insert([{
            post_id: postId,
            user_id: session.user.id,
            emoji: "👍",
        }]);
        return { reacted: !error };
    }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function fetchComments(postId: string): Promise<GroupPostComment[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("group_post_comments")
        .select("id, post_id, author_id, content, created_at, profiles(username, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

    if (error) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return {
            id: row.id as string,
            post_id: row.post_id as string,
            author_id: row.author_id as string,
            content: row.content as string,
            created_at: row.created_at as string,
            author_username: profile?.username ?? null,
            author_avatar: profile?.avatar_url ?? null,
        };
    });
}

export async function addComment(postId: string, content: string): Promise<{ comment?: GroupPostComment; error?: string }> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: "Sign in to comment." };

    const { data, error } = await supabase
        .from("group_post_comments")
        .insert([{ post_id: postId, author_id: session.user.id, content }])
        .select("id, post_id, author_id, content, created_at")
        .single();

    if (error) return { error: error.message };
    return { comment: data as GroupPostComment };
}

export async function deleteComment(commentId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from("group_post_comments").delete().eq("id", commentId);
    return !error;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function fetchGroupEvents(groupId: string): Promise<GroupEvent[]> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase
        .from("group_events")
        .select("id, group_id, created_by, title, description, event_date, bible_materials, rsvp_yes_count, rsvp_no_count, rsvp_maybe_count, created_at")
        .eq("group_id", groupId)
        .order("event_date", { ascending: true });

    if (error) return [];

    const events = (data ?? []) as GroupEvent[];

    if (session) {
        const eventIds = events.map((e) => e.id);
        const { data: rsvps } = await supabase
            .from("group_event_rsvps")
            .select("id, event_id, status")
            .eq("user_id", session.user.id)
            .in("event_id", eventIds);

        if (rsvps) {
            const rsvpMap = new Map(rsvps.map((r: { id: string; event_id: string; status: RsvpStatus }) => [r.event_id, { id: r.id, status: r.status }]));
            events.forEach((e) => {
                const rsvp = rsvpMap.get(e.id);
                e.user_rsvp = rsvp?.status ?? null;
                e.user_rsvp_id = rsvp?.id ?? null;
            });
        }
    }

    return events;
}

export async function createEvent(input: {
    group_id: string;
    title: string;
    description?: string;
    event_date: string;
    bible_materials?: BibleMaterial[];
}): Promise<{ event?: GroupEvent; error?: string }> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: "Sign in to create events." };

    const { data, error } = await supabase
        .from("group_events")
        .insert([{ ...input, created_by: session.user.id, bible_materials: input.bible_materials ?? [] }])
        .select("id, group_id, created_by, title, description, event_date, bible_materials, rsvp_yes_count, rsvp_no_count, rsvp_maybe_count, created_at")
        .single();

    if (error) return { error: error.message };
    return { event: data as GroupEvent };
}

export async function upsertRsvp(eventId: string, newStatus: RsvpStatus, existingRsvpId: string | null, currentStatus: RsvpStatus | null | undefined): Promise<{ status: RsvpStatus | null }> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { status: null };

    // Same status click → cancel
    if (existingRsvpId && currentStatus === newStatus) {
        await supabase.from("group_event_rsvps").delete().eq("id", existingRsvpId);
        return { status: null };
    }

    const { error } = await supabase.from("group_event_rsvps").upsert(
        [{ event_id: eventId, user_id: session.user.id, status: newStatus }],
        { onConflict: "event_id,user_id" }
    );

    if (error) return { status: currentStatus ?? null };
    return { status: newStatus };
}
