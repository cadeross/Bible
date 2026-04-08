"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllHighlights, getAllWisdom, Highlight, SavedWisdom } from "@/lib/persistence";
import { PenTool, ArrowRight, BookOpen, Heart, Quote, StickyNote, Share2, Trash2, Pencil, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotePanel } from "@/components/reading/note-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { BIBLE_BOOKS } from "@/lib/bible-data";
import Loading from "../loading";
import { useReadingPreferences } from "@/contexts/reading-preferences";
import { useAuth } from "@clerk/nextjs";
import { HIGHLIGHT_MENU_COLORS } from "@/lib/highlight-menu";

const HIGHLIGHT_DOT_CLASS: Record<string, string> = Object.fromEntries(
    HIGHLIGHT_MENU_COLORS.map((c) => [c.id, c.dotClass])
) as Record<string, string>;

interface GroupedHighlight extends Highlight {
    verseEnd: number;
}

export default function LibraryPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const [rawHighlights, setRawHighlights] = useState<Highlight[]>([]);
    const [wisdom, setWisdom] = useState<SavedWisdom[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;
        const fetchData = async () => {
            setIsGuest(!isSignedIn);
            const [highlightsData, wisdomData] = await Promise.all([
                getAllHighlights(),
                getAllWisdom()
            ]);
            setRawHighlights(highlightsData);
            setWisdom(wisdomData);
            setLoading(false);
        };

        void fetchData();
    }, [isLoaded, isSignedIn]);

    const { fontFamily, bibleVersion, isLoaded: preferencesLoaded } = useReadingPreferences();
    const getFontClass = () => {
        if (!preferencesLoaded) return "font-serif";
        switch (fontFamily) {
            case "sans": return "font-sans";
            case "mono": return "font-mono";
            case "pixel": return "font-pixel";
            case "serif":
            default: return "font-serif";
        }
    };



    const groupedHighlights = useMemo(() => {
        if (rawHighlights.length === 0) return [];
        // ... (sorting remains same)
        const sorted = [...rawHighlights].sort((a, b) => {
            const bookA = BIBLE_BOOKS.findIndex(book => book.name === a.book);
            const bookB = BIBLE_BOOKS.findIndex(book => book.name === b.book);

            if (bookA !== bookB) return bookA - bookB;
            if (a.chapter !== b.chapter) return a.chapter - b.chapter;
            return a.verse - b.verse;
        });

        const grouped: GroupedHighlight[] = [];
        let currentGroup: GroupedHighlight | null = null;

        sorted.forEach((h) => {
            // ... (grouping logic remains same)
            if (!currentGroup) {
                currentGroup = { ...h, verseEnd: h.verse };
                return;
            }
            const isNextVerse = h.verse === currentGroup.verseEnd + 1;
            const isSameBook = h.book === currentGroup.book;
            const isSameChapter = h.chapter === currentGroup.chapter;
            const isSameColor = h.color === currentGroup.color;

            if (isSameBook && isSameChapter && isNextVerse && isSameColor) {
                currentGroup.verseEnd = h.verse;
                currentGroup.content = `${currentGroup.content} ${h.content}`;
                if (new Date(h.created_at) > new Date(currentGroup.created_at)) {
                    currentGroup.created_at = h.created_at;
                }
            } else {
                grouped.push(currentGroup);
                currentGroup = { ...h, verseEnd: h.verse };
            }
        });

        if (currentGroup) {
            grouped.push(currentGroup);
        }

        return grouped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    }, [rawHighlights]);

    const notes = useMemo(() => {
        return rawHighlights
            .filter(h => h.note && h.note.trim().length > 0)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }, [rawHighlights])

    const [activeTab, setActiveTab] = useState<'highlights' | 'notes'>('highlights');
    const router = useRouter()

    // Note Editing State
    const [editingNote, setEditingNote] = useState<Highlight | null>(null)
    const [isNoteSheetOpen, setIsNoteSheetOpen] = useState(false)
    const [noteSaveStatus, setNoteSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
    const noteSaveTimeout = useRef<NodeJS.Timeout | null>(null)

    const handleEditNote = (note: Highlight) => {
        setEditingNote(note)
        setNoteSaveStatus("idle")
        setIsNoteSheetOpen(true)
    }

    const handleNoteContentChange = (content: string) => {
        if (!editingNote) return
        setNoteSaveStatus("saving")
        if (noteSaveTimeout.current) clearTimeout(noteSaveTimeout.current)
        noteSaveTimeout.current = setTimeout(async () => {
            const persistence = await import("@/lib/persistence")
            const noteValue = content.trim().length > 0 ? content : undefined

            // Optimistic Update
            const updatedHighlights = rawHighlights.map(h => {
                if (h.id === editingNote.id) {
                    return { ...h, note: noteValue }
                }
                return h
            })
            setRawHighlights(updatedHighlights)

            // DB Update
            const updatedNote = { ...editingNote, note: noteValue }
            await persistence.saveHighlight(updatedNote)
            setNoteSaveStatus("saved")
        }, 600)
    }

    const handleDeleteNote = async () => {
        if (!editingNote) return

        const persistence = await import("@/lib/persistence")

        // Optimistic Update
        const updatedHighlights = rawHighlights.map(h => {
            if (h.id === editingNote.id) {
                return { ...h, note: undefined }
            }
            return h
        })
        setRawHighlights(updatedHighlights)

        const updatedNote = { ...editingNote, note: undefined }
        await persistence.saveHighlight(updatedNote)

        setIsNoteSheetOpen(false)
        setEditingNote(null)
    }

    const handleShareNote = async (h: Highlight) => {
        const ref = `${h.book} ${h.chapter}:${h.verse}`
        const url = `${window.location.origin}/share?ref=${encodeURIComponent(ref)}&text=${encodeURIComponent(h.content)}&note=${encodeURIComponent(h.note || "")}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Note on ${ref}`,
                    url
                })
            } catch (e) { console.error(e) }
        } else {
            navigator.clipboard.writeText(url)
            // simplified toast or alert checking
            alert("Deep link copied to clipboard")
        }
    }

    const handleShareWisdom = async (w: SavedWisdom) => {
        const ref = w.source || "Daily Wisdom"
        const url = `${window.location.origin}/share?ref=${encodeURIComponent(ref)}&text=${encodeURIComponent(w.content)}&note=${encodeURIComponent("")}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Wisdom from ${ref}`,
                    url
                })
            } catch (e) { console.error(e) }
        } else {
            navigator.clipboard.writeText(url)
            alert("Deep link copied to clipboard")
        }
    }

    if (loading) {
        return <Loading />
    }

    if (rawHighlights.length === 0 && wisdom.length === 0) {
        // ... (Empty state remains same)
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center p-6">
                <div className="text-center space-y-5">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <Library className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">Library is empty</h1>
                        <p className="mx-auto max-w-[280px] text-sm text-muted-foreground leading-relaxed">
                            {isGuest
                                ? "Saved items stay on this device until you sign in to sync."
                                : "Start reading to highlight verses or save daily wisdom."
                            }
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 items-center pt-2">
                        <Link href="/read" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-sm)] transition-all duration-200 hover:opacity-90 active:scale-[0.98]">
                            Start reading <ArrowRight className="h-4 w-4" />
                        </Link>
                        {isGuest && (
                            <Link href="/profile" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                                Sign in to sync
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
            className="w-full max-w-[720px] mx-auto px-6 py-12 space-y-12"
        >
            <Dialog open={isNoteSheetOpen} onOpenChange={setIsNoteSheetOpen}>
                <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden bg-background">
                    <DialogTitle className="sr-only">
                        Note for {editingNote ? `${editingNote.book} ${editingNote.chapter}:${editingNote.verse}` : ""}
                    </DialogTitle>
                    {editingNote && (
                        <div className="p-6 md:p-8">
                            <NotePanel
                                verseLabel={`${editingNote.book} ${editingNote.chapter}:${editingNote.verse}`}
                                versePreview={editingNote.content}
                                highlightColor={editingNote.color}
                                initialContent={editingNote.note || ""}
                                saveStatus={noteSaveStatus}
                                fontClass={getFontClass()}
                                onContentChange={handleNoteContentChange}
                                onDelete={handleDeleteNote}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="mb-10 space-y-5">
                <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[11px] font-medium text-primary">
                        Redesign coming soon
                    </span>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Library
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Verses, highlights, and notes
                    </p>
                </div>

                <div className="flex rounded-xl border border-border/30 bg-muted/30 p-1">
                    {[
                        { id: 'highlights', label: 'Highlights', count: groupedHighlights.length, icon: PenTool },
                        { id: 'notes', label: 'Notes', count: notes.length, icon: StickyNote }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as "highlights" | "notes")}
                            className={cn(
                                "relative z-10 flex items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-medium transition-colors duration-200",
                                activeTab === tab.id
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 -z-10 rounded-[10px] bg-primary/[0.07] dark:bg-primary/[0.12]"
                                    transition={{ type: "spring", bounce: 0.12, duration: 0.45 }}
                                />
                            )}
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                            <span className="text-xs text-muted-foreground/60 tabular-nums">{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                {/* Guest Banner */}
                {isGuest && (
                    <div className="flex animate-in items-center justify-between gap-4 rounded-[length:var(--radius)] border border-border/40 bg-nav p-3 fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500/70" />
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Local only:</span> highlights stay on this device until you sync.
                            </p>
                        </div>
                        <Link href="/profile" className="text-xs font-medium text-primary transition-colors hover:text-foreground hover:underline underline-offset-4">
                            Sign in
                        </Link>
                    </div>
                )}

                {/* Content */}
                <div className="min-h-[200px]">

                    <AnimatePresence mode="wait">
                        {activeTab === 'highlights' ? (
                            <motion.div
                                key="highlights"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {groupedHighlights.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-muted-foreground">No highlights yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {groupedHighlights.map((highlight, idx) => (
                                            <div
                                                key={highlight.id || idx}
                                                className="group relative block rounded-2xl border border-border/25 bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-elevated)] hover:border-border/40"
                                            >
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <Link
                                                            href={`/read/${highlight.book}/${highlight.chapter}?translation=${bibleVersion}`}
                                                            className="text-xs font-semibold text-primary/80 group-hover:text-primary transition-colors flex items-center gap-2"
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "h-2 w-2 shrink-0 rounded-full",
                                                                    HIGHLIGHT_DOT_CLASS[highlight.color] ?? "bg-muted-foreground"
                                                                )}
                                                            />
                                                            {highlight.book} {highlight.chapter}:{highlight.verse}{highlight.verseEnd > highlight.verse ? `-${highlight.verseEnd}` : ''}
                                                        </Link>
                                                        <span className="text-xs text-muted-foreground/50">
                                                            {new Date(highlight.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <p className="text-sm leading-relaxed text-foreground/80 font-serif italic line-clamp-3">
                                                            &ldquo;{highlight.content || "view verse content"}&rdquo;
                                                        </p>
                                                        <button
                                                            onClick={() => handleShareNote(highlight)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200 shrink-0"
                                                            title="Share Highlight"
                                                        >
                                                            <Share2 className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Share</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="notes"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {notes.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-muted-foreground">No notes yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {notes.map((note) => (
                                            <div
                                                key={note.id}
                                                className="group relative block p-5 rounded-2xl border border-border/25 bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-elevated)] hover:border-border/40 cursor-pointer"
                                                onClick={() => handleEditNote(note)}
                                            >
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-primary/80 group-hover:text-primary transition-colors flex items-center gap-2">
                                                            <StickyNote className="h-3.5 w-3.5" />
                                                            {note.book} {note.chapter}:{note.verse}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground/50">
                                                            {new Date(note.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">
                                                        {note.note}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/50 font-serif italic line-clamp-1">
                                                        &ldquo;{note.content}&rdquo;
                                                    </p>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleShareNote(note) }}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200"
                                                            title="Share Note"
                                                        >
                                                            <Share2 className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Share</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>


        </motion.div>
    );
}
