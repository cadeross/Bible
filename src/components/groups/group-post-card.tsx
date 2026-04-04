"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Pin, Trash2 } from "lucide-react";
import { deletePost, type GroupPost } from "@/lib/groups";
import { ReactionBar } from "./reaction-bar";
import { CommentThread } from "./comment-thread";

interface GroupPostCardProps {
    post: GroupPost;
    currentUserId: string | null;
    isAdmin: boolean;
    onDelete: (postId: string) => void;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
}

export function GroupPostCard({ post, currentUserId, isAdmin, onDelete }: GroupPostCardProps) {
    const [reactionCount, setReactionCount] = useState(post.reaction_count);
    const [userReacted, setUserReacted] = useState(post.user_reacted ?? false);
    const [userReactionId, setUserReactionId] = useState(post.user_reaction_id ?? null);
    const [commentCount, setCommentCount] = useState(post.comment_count);

    const canDelete = currentUserId === post.author_id || isAdmin;

    const handleDelete = () => {
        // Optimistic: remove immediately, then fire request
        onDelete(post.id);
        deletePost(post.id);
    };

    const handleReactionUpdate = (delta: number, reacted: boolean, reactionId: string | null) => {
        setReactionCount((c) => Math.max(0, c + delta));
        setUserReacted(reacted);
        setUserReactionId(reactionId);
    };

    return (
        <div
            className={cn(
                "border border-border/40 rounded p-4 space-y-3",
                post.is_pinned && "border-primary/30 bg-primary/5"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    {post.author_avatar ? (
                        <img src={post.author_avatar} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <div className="h-7 w-7 rounded-full bg-muted flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                        <span className="text-xs font-mono font-medium">
                            {post.author_username ?? "member"}
                        </span>
                        <span className="text-xs text-muted-foreground/60 font-mono ml-2">
                            {timeAgo(post.created_at)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {post.is_pinned && (
                        <span className="flex items-center gap-0.5 text-[10px] font-mono text-primary px-1.5 py-0.5 border border-primary/30 rounded">
                            <Pin className="h-2.5 w-2.5" />
                            pinned
                        </span>
                    )}
                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            className="p-1 text-muted-foreground/40 hover:text-red-500 transition-colors rounded"
                            aria-label="Delete post"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Verse block */}
            {post.verse_ref && (
                <div className="border-l-2 border-primary/40 pl-3 py-1 space-y-1">
                    <p className="text-[10px] font-mono text-primary">{post.verse_ref}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed italic">{post.verse_text}</p>
                </div>
            )}

            {/* Text content */}
            {post.content && (
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            )}

            {/* Footer: reactions + comments */}
            <div className="flex items-center gap-2 pt-1 border-t border-border/20">
                <ReactionBar
                    postId={post.id}
                    reactionCount={reactionCount}
                    userReacted={userReacted}
                    userReactionId={userReactionId}
                    onUpdate={handleReactionUpdate}
                />
                <CommentThread
                    postId={post.id}
                    commentCount={commentCount}
                    onCountChange={(d) => setCommentCount((c) => Math.max(0, c + d))}
                />
            </div>
        </div>
    );
}
