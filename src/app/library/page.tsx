"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllHighlights, getAllWisdom, Highlight, SavedWisdom } from "@/lib/persistence";
import { PenTool, ArrowRight, BookOpen, Heart, Quote, StickyNote, Share2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteDialog } from "@/components/reading/note-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { BIBLE_BOOKS } from "@/lib/bible-data";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Loading from "../loading";

interface GroupedHighlight extends Highlight {
    verseEnd: number;
}

export default function LibraryPage() {
    const [rawHighlights, setRawHighlights] = useState<Highlight[]>([]);
    const [wisdom, setWisdom] = useState<SavedWisdom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const [highlightsData, wisdomData] = await Promise.all([
                getAllHighlights(),
                getAllWisdom()
            ]);
            setRawHighlights(highlightsData);
            setWisdom(wisdomData);
            setLoading(false);
        };

        fetchData();
    }, []);



    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            setIsGuest(!session);

            const [highlightsData, wisdomData] = await Promise.all([
                getAllHighlights(),
                getAllWisdom()
            ]);
            setRawHighlights(highlightsData);
            setWisdom(wisdomData);
            setLoading(false);
        };

        fetchData();
    }, []);



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

    const [activeTab, setActiveTab] = useState<'highlights' | 'wisdom' | 'notes'>('highlights');
    const router = useRouter()

    // Note Editing State
    const [editingNote, setEditingNote] = useState<Highlight | null>(null)
    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
    const [noteToDelete, setNoteToDelete] = useState<Highlight | null>(null)

    const handleEditNote = (note: Highlight) => {
        setEditingNote(note)
        setIsNoteDialogOpen(true)
    }

    const handleSaveEditedNote = async (content: string) => {
        if (!editingNote) return

        const persistence = await import("@/lib/persistence")

        // Optimistic Update
        const updatedHighlights = rawHighlights.map(h => {
            if (h.id === editingNote.id) {
                return { ...h, note: content }
            }
            return h
        })
        setRawHighlights(updatedHighlights)

        // DB Update
        const updatedNote = { ...editingNote, note: content }
        await persistence.saveHighlight(updatedNote)

        setIsNoteDialogOpen(false)
        setEditingNote(null)
    }

    const handleDeleteNote = async (noteToDelete?: Highlight) => {
        const target = noteToDelete || editingNote
        if (!target) return

        const persistence = await import("@/lib/persistence")

        // Optimistic Update
        const updatedHighlights = rawHighlights.map(h => {
            if (h.id === target.id) {
                return { ...h, note: undefined }
            }
            return h
        })
        setRawHighlights(updatedHighlights)

        const updatedNote = { ...target, note: undefined }
        await persistence.saveHighlight(updatedNote)

        setIsNoteDialogOpen(false)
        setEditingNote(null)
        setNoteToDelete(null)
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
            <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 font-mono">
                <div className="text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto text-muted-foreground">
                        <PenTool className="h-8 w-8" />
                    </div>
                    <h1 className="text-xl font-bold text-primary">empty library</h1>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        {isGuest
                            ? "items saved here are on-device only. sign in to sync."
                            : "start reading to highlight verses or save daily wisdom."
                        }
                    </p>
                    <div className="flex flex-col gap-2 items-center">
                        <Link href="/read" className="inline-flex items-center gap-2 text-primary hover:underline underline-offset-4 mt-4 text-xs tracking-wide">
                            start reading <ArrowRight className="h-4 w-4" />
                        </Link>
                        {isGuest && (
                            <Link href="/profile" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                sign in to sync
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
            <NoteDialog
                isOpen={isNoteDialogOpen}
                onOpenChange={setIsNoteDialogOpen}
                verseRef={editingNote ? `${editingNote.book} ${editingNote.chapter}:${editingNote.verse}` : ""}
                initialContent={editingNote?.note || ""}
                onSave={handleSaveEditedNote}
                onDelete={handleDeleteNote}
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/50 pb-8">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight font-mono text-primary">library</h1>
                        <p className="text-muted-foreground text-xs font-mono">
                            your collection of verses and wisdom
                        </p>
                    </div>
                </div>

                {/* Custom Fluid Toggle */}
                <div className="flex p-1 border border-border/60 rounded-lg self-start sm:self-center">
                    {[
                        { id: 'highlights', count: groupedHighlights.length, icon: PenTool },
                        { id: 'wisdom', count: wisdom.length, icon: Heart },
                        { id: 'notes', count: notes.length, icon: StickyNote }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            title={`${tab.id} (${tab.count})`}
                            className={cn(
                                "relative px-3 py-1.5 rounded-sm transition-colors flex items-center justify-center z-10",
                                activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground/80"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary/10 rounded-sm -z-10"
                                    transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                                />
                            )}
                            <tab.icon className="h-4 w-4" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                {/* Guest Banner */}
                {isGuest && (
                    <div className="bg-secondary/10 border border-border/50 rounded-lg p-3 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-yellow-500/50 animate-pulse" />
                            <p className="text-xs font-mono text-muted-foreground">
                                <span className="font-bold text-foreground">local mode:</span> items saved to device only.
                            </p>
                        </div>
                        <Link href="/profile" className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary hover:text-foreground transition-colors hover:underline underline-offset-4">
                            sync now
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
                                    <div className="text-center py-12 text-muted-foreground italic font-mono text-sm">no highlights yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {groupedHighlights.map((highlight, idx) => (
                                            <div
                                                key={highlight.id || idx}
                                                className="group relative block p-4 rounded-md bg-secondary/10 hover:bg-secondary/20 transition-all border border-border/50 hover:border-primary/20"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Link
                                                            href={`/read/${highlight.book}/${highlight.chapter}?translation=dra`}
                                                            className="text-[10px] font-bold uppercase tracking-widest text-primary/70 group-hover:text-primary transition-colors flex items-center gap-2 font-mono"
                                                        >
                                                            <span className={cn(
                                                                "w-1.5 h-1.5 rounded-full",
                                                                highlight.color === "yellow" && "bg-yellow-500",
                                                                highlight.color === "green" && "bg-green-500",
                                                                highlight.color === "blue" && "bg-blue-500",
                                                                highlight.color === "pink" && "bg-pink-500",
                                                                highlight.color === "purple" && "bg-purple-500",
                                                            )} />
                                                            {highlight.book} {highlight.chapter}:{highlight.verse}{highlight.verseEnd > highlight.verse ? `-${highlight.verseEnd}` : ''}
                                                        </Link>
                                                        <span className="text-[10px] text-muted-foreground/50 font-mono">
                                                            {new Date(highlight.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start justify-between gap-4">
                                                        <p className="text-sm leading-relaxed text-foreground/90 font-serif italic line-clamp-3">
                                                            "{highlight.content || "view verse content"}"
                                                        </p>
                                                        <button
                                                            onClick={() => handleShareNote(highlight)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-all shrink-0"
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
                        ) : activeTab === 'notes' ? (
                            <motion.div
                                key="notes"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {notes.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground italic font-mono text-sm">no notes yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {notes.map((note, idx) => (
                                            <div
                                                key={note.id || idx}
                                                onClick={() => router.push(`/read/${note.book}/${note.chapter}?translation=dra`)}
                                                className="group relative block p-4 pb-2 rounded-md bg-secondary/10 border border-border/50 hover:border-primary/20 transition-all cursor-pointer hover:bg-secondary/20"
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 group-hover:text-primary transition-colors flex items-center gap-2 font-mono">
                                                            <StickyNote className="h-3 w-3" />
                                                            {note.book} {note.chapter}:{note.verse}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/50 font-mono">
                                                            {new Date(note.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    {/* Note Content */}
                                                    <div className="pl-4 border-l-2 border-primary/20">
                                                        <p className="text-sm leading-relaxed text-foreground/90 font-serif italic whitespace-pre-wrap">
                                                            {note.note}
                                                        </p>
                                                    </div>

                                                    {/* Verse Context (Dimmed) */}
                                                    <p className="text-xs text-muted-foreground/60 line-clamp-1 italic font-serif px-1">
                                                        "{note.content}"
                                                    </p>

                                                    {/* Actions */}
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setNoteToDelete(note)
                                                            }}
                                                            className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors"
                                                            title="Delete Note"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleShareNote(note)
                                                            }}
                                                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                            title="Share Note"
                                                        >
                                                            <Share2 className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Share</span>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleEditNote(note)
                                                            }}
                                                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                            title="Edit Note"
                                                        >
                                                            <PenTool className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Edit</span>
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
                                key="wisdom"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {wisdom.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground italic font-mono text-sm">no saved wisdom yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {wisdom.map((item, idx) => (
                                            <div
                                                key={item.id || idx}
                                                className="group relative block p-4 rounded-md bg-secondary/10 hover:bg-secondary/20 transition-all border border-border/50 hover:border-primary/20"
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 group-hover:text-primary transition-colors flex items-center gap-2 font-mono">
                                                            <Quote className="h-3 w-3" /> daily wisdom
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/50 font-mono">
                                                            {new Date(item.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors font-serif italic">
                                                        "{item.content}"
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-right flex-1">
                                                            <span className="text-[10px] font-mono text-primary/60">
                                                                — {item.source || "Unknown"}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleShareWisdom(item)}
                                                                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                                title="Share Wisdom"
                                                            >
                                                                <Share2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
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

            <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this note? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDeleteNote(noteToDelete!)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
