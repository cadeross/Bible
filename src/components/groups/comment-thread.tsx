"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MessageSquare, Send, ChevronDown } from "lucide-react";
import { fetchComments, addComment, type GroupPostComment } from "@/lib/groups";
import { SPRING_FAST } from "@/lib/animation";

interface CommentThreadProps {
    postId: string;
    commentCount: number;
    onCountChange: (delta: number) => void;
}

export function CommentThread({ postId, commentCount, onCountChange }: CommentThreadProps) {
    const [open, setOpen] = useState(false);
    const [comments, setComments] = useState<GroupPostComment[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [input, setInput] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const toggle = async () => {
        if (!open && !loaded) {
            const data = await fetchComments(postId);
            setComments(data);
            setLoaded(true);
        }
        setOpen((v) => !v);
        if (!open) setTimeout(() => inputRef.current?.focus(), 150);
    };

    const submit = async () => {
        const text = input.trim();
        if (!text || submitting) return;
        setSubmitting(true);
        const { comment, error } = await addComment(postId, text);
        if (comment) {
            setComments((prev) => [...prev, comment]);
            onCountChange(1);
            setInput("");
        } else if (error) {
            console.error(error);
        }
        setSubmitting(false);
    };

    return (
        <div>
            <button
                onClick={toggle}
                className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/40"
                aria-expanded={open}
            >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{commentCount}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-150", open && "rotate-180")} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={SPRING_FAST}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 space-y-2 pl-2 border-l border-border/30">
                            {comments.map((c) => (
                                <div key={c.id} className="text-xs">
                                    <span className="font-mono text-muted-foreground mr-1.5">
                                        {c.author_username ?? "anon"}
                                    </span>
                                    <span className="text-foreground/80">{c.content}</span>
                                </div>
                            ))}
                            {comments.length === 0 && loaded && (
                                <p className="text-xs text-muted-foreground/60 font-mono">no comments yet</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && submit()}
                                maxLength={500}
                                placeholder="Add a comment…"
                                className="flex-1 bg-transparent border border-border/40 rounded px-3 py-1.5 text-xs font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/50"
                            />
                            <button
                                onClick={submit}
                                disabled={submitting || !input.trim()}
                                className="p-1.5 rounded text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors"
                                aria-label="Send comment"
                            >
                                <Send className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
