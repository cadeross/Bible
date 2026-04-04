"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Send, Type, BookOpen, Pin } from "lucide-react";
import { createPost, type GroupPostType, type GroupPost } from "@/lib/groups";
import { VersePicker } from "./verse-picker";
import { SPRING_FAST } from "@/lib/animation";

interface PostComposerProps {
    groupId: string;
    isAdmin: boolean;
    onPost: (post: GroupPost) => void;
}

type TabType = "text" | "verse_share" | "weekly_content";

const TABS: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }[] = [
    { id: "text", label: "text", icon: Type },
    { id: "verse_share", label: "verse", icon: BookOpen },
    { id: "weekly_content", label: "focus", icon: Pin, adminOnly: true },
];

export function PostComposer({ groupId, isAdmin, onPost }: PostComposerProps) {
    const [tab, setTab] = useState<TabType>("text");
    const [content, setContent] = useState("");
    const [verse, setVerse] = useState<{ ref: string; text: string; book?: string; chapter?: number; startVerse?: number; endVerse?: number } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

    const canSubmit = tab === "verse_share" ? !!verse : content.trim().length > 0;

    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        setError(null);

        const { post, error: err } = await createPost({
            group_id: groupId,
            post_type: tab as GroupPostType,
            content: content.trim() || undefined,
            verse_ref: verse?.ref,
            verse_text: verse?.text,
            verse_book: verse?.book,
            verse_chapter: verse?.chapter,
            verse_start: verse?.startVerse,
            verse_end: verse?.endVerse,
        });

        if (post) {
            onPost(post);
            setContent("");
            setVerse(null);
            setTab("text");
        } else {
            setError(err ?? "Failed to post.");
        }
        setSubmitting(false);
    };

    return (
        <div className="border border-border/40 rounded p-4 space-y-3">
            {/* Tab selector */}
            <div className="flex gap-1">
                {visibleTabs.map((t) => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors",
                                tab === t.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                        >
                            <Icon className="h-3 w-3" />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="popLayout">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="space-y-3"
                >
                    {tab === "verse_share" ? (
                        <VersePicker value={verse} onChange={setVerse} />
                    ) : null}

                    {(tab === "text" || tab === "weekly_content") && (
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={tab === "weekly_content" ? "Write the weekly focus post…" : "Share a thought…"}
                            maxLength={5000}
                            rows={3}
                            className="w-full bg-transparent border border-border/40 rounded px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 resize-none"
                        />
                    )}

                    {tab === "verse_share" && verse && (
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Add a thought (optional)…"
                            maxLength={5000}
                            rows={2}
                            className="w-full bg-transparent border border-border/40 rounded px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 resize-none"
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded text-xs font-mono disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                    <Send className="h-3 w-3" />
                    {submitting ? "posting…" : "post"}
                </button>
            </div>
        </div>
    );
}
