"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createPost, fetchMyGroups, type Group } from "@/lib/groups";
import { Send } from "lucide-react";

interface ShareToGroupSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    verseRef: string;
    verseText: string;
    verseBook?: string;
    verseChapter?: number;
    verseStart?: number;
    verseEnd?: number;
}

export function ShareToGroupSheet({
    open, onOpenChange, verseRef, verseText, verseBook, verseChapter, verseStart, verseEnd
}: ShareToGroupSheetProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [note, setNote] = useState("");
    const [posting, setPosting] = useState(false);
    const [posted, setPosted] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        const load = async () => {
            setLoading(true);
            const data = await fetchMyGroups();
            setGroups(data);
            setLoading(false);
        };
        load();
    }, [open]);

    const handleShare = async () => {
        if (!selectedGroupId || posting) return;
        setPosting(true);

        const { error } = await createPost({
            group_id: selectedGroupId,
            post_type: "verse_share",
            content: note.trim() || undefined,
            verse_ref: verseRef,
            verse_text: verseText,
            verse_book: verseBook,
            verse_chapter: verseChapter,
            verse_start: verseStart,
            verse_end: verseEnd,
        });

        if (!error) {
            setPosted(selectedGroupId);
            setTimeout(() => {
                setPosted(null);
                setSelectedGroupId(null);
                setNote("");
                onOpenChange(false);
            }, 1500);
        }
        setPosting(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="max-h-[70vh]">
                <SheetHeader className="mb-4">
                    <SheetTitle className="font-mono text-sm">share to group</SheetTitle>
                </SheetHeader>

                {/* Verse preview */}
                <div className="border-l-2 border-primary/40 pl-3 py-1 mb-4">
                    <p className="text-[10px] font-mono text-primary mb-0.5">{verseRef}</p>
                    <p className="text-xs text-foreground/80 italic line-clamp-3">{verseText}</p>
                </div>

                {loading ? (
                    <p className="text-sm text-muted-foreground font-mono">loading groups…</p>
                ) : groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-mono">join a group to share verses</p>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            {groups.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGroupId(g.id === selectedGroupId ? null : g.id)}
                                    className={`text-left px-3 py-2 border rounded text-xs font-mono transition-colors ${
                                        selectedGroupId === g.id
                                            ? "border-primary/50 bg-primary/5 text-primary"
                                            : "border-border/40 hover:border-border"
                                    }`}
                                >
                                    <div className="truncate font-medium">{g.name}</div>
                                    <div className="text-muted-foreground mt-0.5">{g.member_count} members</div>
                                </button>
                            ))}
                        </div>

                        {selectedGroupId && (
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add a thought (optional)…"
                                maxLength={5000}
                                rows={2}
                                className="w-full bg-transparent border border-border/40 rounded px-3 py-2 text-sm font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 resize-none"
                            />
                        )}

                        <button
                            onClick={handleShare}
                            disabled={!selectedGroupId || posting}
                            className="flex items-center justify-center gap-2 w-full py-2 bg-primary text-primary-foreground rounded text-sm font-mono hover:bg-primary/90 disabled:opacity-40 transition-colors"
                        >
                            <Send className="h-3.5 w-3.5" />
                            {posted ? "shared!" : posting ? "sharing…" : "share"}
                        </button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
