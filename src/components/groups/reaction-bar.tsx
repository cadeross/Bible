"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toggleReaction } from "@/lib/groups";

interface ReactionBarProps {
    postId: string;
    reactionCount: number;
    userReacted: boolean;
    userReactionId: string | null;
    onUpdate: (delta: number, reacted: boolean, reactionId: string | null) => void;
}

export function ReactionBar({ postId, reactionCount, userReacted, userReactionId, onUpdate }: ReactionBarProps) {
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        if (loading) return;
        setLoading(true);

        const wasReacted = userReacted;
        onUpdate(wasReacted ? -1 : 1, !wasReacted, wasReacted ? null : "optimistic");

        const { reacted } = await toggleReaction(postId, userReactionId);
        if (reacted !== !wasReacted) {
            onUpdate(wasReacted ? 1 : -1, wasReacted, userReactionId);
        }
        setLoading(false);
    };

    return (
        <motion.button
            onClick={handleToggle}
            disabled={loading}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 600, damping: 20 }}
            className={cn(
                "flex items-center gap-1.5 text-xs font-mono transition-colors rounded px-2 py-1",
                userReacted
                    ? "text-primary bg-primary/10 hover:bg-primary/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
            aria-label={userReacted ? "Remove reaction" : "Add reaction"}
        >
            <span>👍</span>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={reactionCount}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ type: "spring", stiffness: 600, damping: 25 }}
                >
                    {reactionCount}
                </motion.span>
            </AnimatePresence>
        </motion.button>
    );
}
