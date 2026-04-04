"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GroupPostCard } from "./group-post-card";
import { PostComposer } from "./post-composer";
import type { GroupPost } from "@/lib/groups";
import { SPRING_FAST } from "@/lib/animation";

interface GroupFeedProps {
    groupId: string;
    initialPosts: GroupPost[];
    currentUserId: string | null;
    isAdmin: boolean;
}

export function GroupFeed({ groupId, initialPosts, currentUserId, isAdmin }: GroupFeedProps) {
    const [posts, setPosts] = useState<GroupPost[]>(initialPosts);

    const handlePost = (newPost: GroupPost) => {
        setPosts((prev) => {
            if (newPost.is_pinned) return [newPost, ...prev];
            const firstNonPinned = prev.findIndex((p) => !p.is_pinned);
            if (firstNonPinned === -1) return [newPost, ...prev];
            return [...prev.slice(0, firstNonPinned), newPost, ...prev.slice(firstNonPinned)];
        });
    };

    const handleDelete = (postId: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
    };

    return (
        <div className="space-y-3">
            {currentUserId && (
                <PostComposer groupId={groupId} isAdmin={isAdmin} onPost={handlePost} />
            )}

            <AnimatePresence initial={false}>
                {posts.map((post, i) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ ...SPRING_FAST, delay: i < 5 ? i * 0.03 : 0 }}
                    >
                        <GroupPostCard
                            post={post}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            onDelete={handleDelete}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {posts.length === 0 && (
                <p className="text-center text-sm text-muted-foreground font-mono py-12">
                    no posts yet
                </p>
            )}
        </div>
    );
}
