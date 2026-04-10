"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { getAllHighlights, getAllWisdom, type Highlight, type SavedWisdom } from "@/lib/persistence"
import { PenTool, StickyNote, Share2, ArrowRight, Library, Quote, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { NotePanel } from "@/components/reading/note-dialog"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { BIBLE_BOOKS } from "@/lib/bible-data"
import Loading from "../loading"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { useAuth } from "@clerk/nextjs"
import { HIGHLIGHT_MENU_COLORS } from "@/lib/highlight-menu"
import { hapticLight, hapticMedium } from "@/lib/haptics"

// ─── Types ──────────────────────────────────────────────────────────────────

interface GroupedHighlight extends Highlight {
    verseEnd: number
}

type TabId = "highlights" | "notes" | "wisdom"

// ─── Color map ───────────────────────────────────────────────────────────────

const HIGHLIGHT_COLOR: Record<string, { dot: string; accent: string }> = {
    yellow:  { dot: "bg-[#FFCC00]",                       accent: "#FFCC00" },
    green:   { dot: "bg-[#34C759]",                       accent: "#34C759" },
    blue:    { dot: "bg-[#007AFF] dark:bg-[#0A84FF]",     accent: "#007AFF" },
    pink:    { dot: "bg-[#FF2D55]",                       accent: "#FF2D55" },
    purple:  { dot: "bg-[#AF52DE] dark:bg-[#BF5AF2]",     accent: "#AF52DE" },
    orange:  { dot: "bg-[#FF9500] dark:bg-[#FF9F0A]",     accent: "#FF9500" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(isoString: string) {
    const date = new Date(isoString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ─── Pill button (mirrors ToolbarPill from reading-toolbar) ──────────────────

function Pill({
    children,
    active,
    onClick,
    className,
}: {
    children: React.ReactNode
    active?: boolean
    onClick?: () => void
    className?: string
}) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            whileTap={{ scale: 0.96 }}
            className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full border glass-subtle px-3.5 py-1.5 text-[13px] font-medium shadow-[var(--shadow-sm)] transition-[box-shadow,border-color] duration-200 hover:shadow-[var(--shadow-card)] active:scale-[0.97] [touch-action:manipulation]",
                active
                    ? "border-white/[0.25] dark:border-white/[0.15] text-foreground"
                    : "border-white/[0.12] dark:border-white/[0.06] text-muted-foreground hover:border-white/[0.2]",
                className
            )}
        >
            {children}
        </motion.button>
    )
}

// ─── Library toolbar ─────────────────────────────────────────────────────────

interface LibraryToolbarProps {
    activeTab: TabId
    onTabChange: (tab: TabId) => void
    counts: { highlights: number; notes: number; wisdom: number }
}

const TABS = [
    { id: "highlights" as const, label: "Highlights", icon: PenTool },
    { id: "notes"      as const, label: "Notes",      icon: StickyNote },
    { id: "wisdom"     as const, label: "Wisdom",     icon: Quote },
]

function LibraryToolbar({ activeTab, onTabChange, counts }: LibraryToolbarProps) {
    return (
        <div className="w-full max-w-3xl mx-auto mb-8">
            <div className="flex items-center justify-center gap-2 flex-wrap">
                {/* Title pill – non-interactive */}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] dark:border-white/[0.06] glass-subtle px-3.5 py-1.5 text-[13px] font-semibold text-foreground shadow-[var(--shadow-sm)] select-none">
                    Library
                </span>

                {/* Tab pills */}
                {TABS.map((tab) => {
                    const count = counts[tab.id]
                    return (
                        <Pill
                            key={tab.id}
                            active={activeTab === tab.id}
                            onClick={() => { hapticLight(); onTabChange(tab.id) }}
                        >
                            <tab.icon className="h-3.5 w-3.5 shrink-0" />
                            {tab.label}
                            {count > 0 && (
                                <span className="tabular-nums text-[11px] opacity-50">{count}</span>
                            )}
                        </Pill>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyTab({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint: string }) {
    return (
        <div className="flex flex-col items-center gap-5 py-20 text-center">
            <div className="h-12 w-12 rounded-2xl glass-subtle border border-white/[0.12] dark:border-white/[0.06] flex items-center justify-center shadow-[var(--shadow-card)]">
                <Icon className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground/60">{title}</p>
                <p className="text-xs text-muted-foreground/45 max-w-[220px] leading-relaxed">{hint}</p>
            </div>
            <Link
                href="/read"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] dark:border-white/[0.06] glass-subtle px-4 py-2 text-[13px] font-medium text-foreground/70 shadow-[var(--shadow-sm)] transition-[box-shadow] duration-200 hover:shadow-[var(--shadow-card)] hover:text-foreground"
            >
                Start reading <ArrowRight className="h-3.5 w-3.5" />
            </Link>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
    const { isLoaded: authLoaded, isSignedIn } = useAuth()
    const { fontFamily, bibleVersion, isLoaded: prefsLoaded } = useReadingPreferences()
    const reduceMotion = useReducedMotion()

    const [rawHighlights, setRawHighlights] = useState<Highlight[]>([])
    const [wisdom, setWisdom] = useState<SavedWisdom[]>([])
    const [loading, setLoading] = useState(true)
    const [isGuest, setIsGuest] = useState(false)
    const [activeTab, setActiveTab] = useState<TabId>("highlights")

    // Note editor state
    const [editingNote, setEditingNote] = useState<Highlight | null>(null)
    const [isNoteOpen, setIsNoteOpen] = useState(false)
    const [noteSaveStatus, setNoteSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
    const noteSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!authLoaded) return
        void (async () => {
            setIsGuest(!isSignedIn)
            const [h, w] = await Promise.all([getAllHighlights(), getAllWisdom()])
            setRawHighlights(h)
            setWisdom(w)
            setLoading(false)
        })()
    }, [authLoaded, isSignedIn])

    const fontClass = useMemo(() => {
        if (!prefsLoaded) return "font-serif"
        return { sans: "font-sans", serif: "font-serif", mono: "font-mono", pixel: "font-pixel" }[fontFamily] ?? "font-serif"
    }, [prefsLoaded, fontFamily])

    // Group consecutive same-color verses in the same chapter
    const groupedHighlights = useMemo<GroupedHighlight[]>(() => {
        if (!rawHighlights.length) return []
        const sorted = [...rawHighlights].sort((a, b) => {
            const bookA = BIBLE_BOOKS.findIndex(bk => bk.name === a.book)
            const bookB = BIBLE_BOOKS.findIndex(bk => bk.name === b.book)
            if (bookA !== bookB) return bookA - bookB
            if (a.chapter !== b.chapter) return a.chapter - b.chapter
            return a.verse - b.verse
        })
        const groups: GroupedHighlight[] = []
        let cur: GroupedHighlight | null = null
        for (const h of sorted) {
            if (!cur) { cur = { ...h, verseEnd: h.verse }; continue }
            if (h.book === cur.book && h.chapter === cur.chapter && h.verse === cur.verseEnd + 1 && h.color === cur.color) {
                cur.verseEnd = h.verse
                cur.content = `${cur.content} ${h.content}`
                if (new Date(h.created_at) > new Date(cur.created_at)) cur.created_at = h.created_at
            } else {
                groups.push(cur)
                cur = { ...h, verseEnd: h.verse }
            }
        }
        if (cur) groups.push(cur)
        return groups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }, [rawHighlights])

    const notes = useMemo(() =>
        rawHighlights
            .filter(h => h.note && h.note.trim())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        [rawHighlights]
    )

    // Note editing
    const handleEditNote = (h: Highlight) => {
        hapticLight()
        setEditingNote(h)
        setNoteSaveStatus("idle")
        setIsNoteOpen(true)
    }

    const handleNoteContentChange = (content: string) => {
        if (!editingNote) return
        setNoteSaveStatus("saving")
        if (noteSaveTimeout.current) clearTimeout(noteSaveTimeout.current)
        noteSaveTimeout.current = setTimeout(async () => {
            const { saveHighlight } = await import("@/lib/persistence")
            const noteValue = content.trim() ? content : undefined
            setRawHighlights(prev => prev.map(h => h.id === editingNote.id ? { ...h, note: noteValue } : h))
            await saveHighlight({ ...editingNote, note: noteValue })
            setNoteSaveStatus("saved")
        }, 600)
    }

    const handleDeleteNote = async () => {
        if (!editingNote) return
        const { saveHighlight } = await import("@/lib/persistence")
        setRawHighlights(prev => prev.map(h => h.id === editingNote.id ? { ...h, note: undefined } : h))
        await saveHighlight({ ...editingNote, note: undefined })
        setIsNoteOpen(false)
        setEditingNote(null)
    }

    const handleShare = async (title: string, text: string, url: string) => {
        hapticLight()
        if (navigator.share) {
            try { await navigator.share({ title, url }) } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(url)
        }
    }

    // Animation variants — same as reading-view.tsx
    const slideVariants = {
        enter: () => reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" },
        center: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit:  () => reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(4px)" },
    } as const
    const contentTransition = reduceMotion
        ? { duration: 0.15 }
        : { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const }

    if (loading) return <Loading />

    const isEmpty = rawHighlights.length === 0 && wisdom.length === 0

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-8">

            {/* ── Gradient fades — same as reading page ─────────────── */}
            <div className="fixed top-[calc(3.5rem+var(--maintenance-banner-height,0px))] left-0 right-0 h-16 bg-gradient-to-b from-background/75 to-transparent z-30 pointer-events-none hidden max-[1500px]:block" />
            <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-30 pointer-events-none hidden max-[1500px]:block" />

            {/* ── Note editor dialog ─────────────────────────────────── */}
            <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
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
                                initialContent={editingNote.note ?? ""}
                                saveStatus={noteSaveStatus}
                                fontClass={fontClass}
                                onContentChange={handleNoteContentChange}
                                onDelete={handleDeleteNote}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Toolbar ───────────────────────────────────────────── */}
            <LibraryToolbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={{ highlights: groupedHighlights.length, notes: notes.length, wisdom: wisdom.length }}
            />

            {/* ── Content ───────────────────────────────────────────── */}
            <main className="flex-1 w-full max-w-4xl relative flex items-start justify-center">
                {isEmpty ? (
                    /* Global empty state */
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        className="w-full max-w-[720px] mx-auto px-6 flex flex-col items-center justify-center py-24 text-center gap-6"
                    >
                        <div className="h-14 w-14 rounded-2xl glass-subtle border border-white/[0.12] dark:border-white/[0.06] flex items-center justify-center shadow-[var(--shadow-card)]">
                            <Library className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-semibold tracking-tight">Library is empty</h1>
                            <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mx-auto">
                                {isGuest
                                    ? "Items saved locally until you sign in to sync across devices."
                                    : "Start reading to highlight verses, add notes, and save daily wisdom."}
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-3 pt-1">
                            <Link
                                href="/read"
                                className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] dark:border-white/[0.06] glass-subtle px-5 py-2.5 text-sm font-medium text-foreground shadow-[var(--shadow-sm)] transition-[box-shadow] hover:shadow-[var(--shadow-card)]"
                            >
                                Start reading <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            {isGuest && (
                                <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    Sign in to sync
                                </Link>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={contentTransition}
                            className="w-full"
                        >
                            <div className="w-full max-w-[720px] mx-auto px-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-20">

                                {/* Guest banner */}
                                {isGuest && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-white/[0.12] dark:border-white/[0.06] glass-subtle shadow-[var(--shadow-sm)] px-4 py-3"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80 animate-pulse shrink-0" />
                                            <p className="text-xs text-muted-foreground leading-snug">
                                                <span className="font-medium text-foreground/80">Local only</span> · sign in to sync across devices
                                            </p>
                                        </div>
                                        <Link href="/profile" className="text-xs font-medium text-primary shrink-0 transition-colors hover:text-foreground">
                                            Sign in
                                        </Link>
                                    </motion.div>
                                )}

                                {/* ── Highlights tab ─────────────────────────── */}
                                {activeTab === "highlights" && (
                                    groupedHighlights.length === 0 ? (
                                        <EmptyTab
                                            icon={PenTool}
                                            title="No highlights yet"
                                            hint="Long-press any verse while reading to highlight it"
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            {groupedHighlights.map((h, idx) => {
                                                const color = HIGHLIGHT_COLOR[h.color]
                                                return (
                                                    <motion.div
                                                        key={h.id ?? idx}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.25, delay: Math.min(idx * 0.035, 0.18), ease: [0.25, 0.1, 0.25, 1] }}
                                                        className="group relative rounded-2xl border border-white/[0.12] dark:border-white/[0.06] glass-subtle shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-white/[0.22] dark:hover:border-white/[0.12] transition-[box-shadow,border-color] duration-200 overflow-hidden"
                                                    >
                                                        {/* Color accent bar */}
                                                        <div
                                                            className="absolute left-0 inset-y-0 w-[3px]"
                                                            style={{ background: color?.accent ?? "#888" }}
                                                        />

                                                        <div className="pl-5 pr-4 py-4">
                                                            {/* Header */}
                                                            <div className="flex items-center justify-between mb-3">
                                                                <Link
                                                                    href={`/read/${encodeURIComponent(h.book)}/${h.chapter}?translation=${bibleVersion}`}
                                                                    className="flex items-center gap-2 text-xs font-semibold text-primary/75 hover:text-primary transition-colors"
                                                                >
                                                                    <span className={cn("h-2 w-2 shrink-0 rounded-full", color?.dot ?? "bg-muted-foreground")} />
                                                                    {h.book} {h.chapter}:{h.verse}{h.verseEnd > h.verse ? `–${h.verseEnd}` : ""}
                                                                </Link>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[11px] text-muted-foreground/35 mr-1 tabular-nums">
                                                                        {formatDate(h.created_at)}
                                                                    </span>
                                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                                        <button
                                                                            onClick={() => {
                                                                                const ref = `${h.book} ${h.chapter}:${h.verse}`
                                                                                const url = `${window.location.origin}/share?ref=${encodeURIComponent(ref)}&text=${encodeURIComponent(h.content)}`
                                                                                void handleShare(`Highlight — ${ref}`, h.content, url)
                                                                            }}
                                                                            className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-foreground/[0.06] text-muted-foreground/50 hover:text-foreground transition-colors"
                                                                        >
                                                                            <Share2 className="h-3.5 w-3.5" />
                                                                            <span className="sr-only">Share</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Verse text */}
                                                            <p className={cn("text-[15px] leading-relaxed text-foreground/80 italic line-clamp-4", fontClass)}>
                                                                &ldquo;{h.content}&rdquo;
                                                            </p>

                                                            {/* Inline note preview */}
                                                            {h.note && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditNote(h)}
                                                                    className="mt-3 pt-3 border-t border-foreground/[0.06] w-full flex items-start gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity"
                                                                >
                                                                    <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/35" />
                                                                    <p className="text-xs text-muted-foreground/60 line-clamp-2 leading-relaxed">{h.note}</p>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    )
                                )}

                                {/* ── Notes tab ──────────────────────────────── */}
                                {activeTab === "notes" && (
                                    notes.length === 0 ? (
                                        <EmptyTab
                                            icon={StickyNote}
                                            title="No notes yet"
                                            hint="Long-press a verse and tap the note icon to add a reflection"
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            {notes.map((n, idx) => (
                                                <motion.div
                                                    key={n.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.25, delay: Math.min(idx * 0.035, 0.18), ease: [0.25, 0.1, 0.25, 1] }}
                                                    onClick={() => handleEditNote(n)}
                                                    className="group relative rounded-2xl border border-white/[0.12] dark:border-white/[0.06] glass-subtle shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-white/[0.22] dark:hover:border-white/[0.12] transition-[box-shadow,border-color] duration-200 cursor-pointer overflow-hidden px-5 py-4"
                                                >
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/70">
                                                            <StickyNote className="h-3.5 w-3.5 shrink-0" />
                                                            {n.book} {n.chapter}:{n.verse}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[11px] text-muted-foreground/35 tabular-nums mr-1">{formatDate(n.created_at)}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    const ref = `${n.book} ${n.chapter}:${n.verse}`
                                                                    const url = `${window.location.origin}/share?ref=${encodeURIComponent(ref)}&text=${encodeURIComponent(n.content)}&note=${encodeURIComponent(n.note ?? "")}`
                                                                    void handleShare(`Note — ${ref}`, n.content, url)
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-full hover:bg-foreground/[0.06] text-muted-foreground/50 hover:text-foreground transition-all duration-200"
                                                            >
                                                                <Share2 className="h-3.5 w-3.5" />
                                                                <span className="sr-only">Share</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Note body */}
                                                    <p className="text-[15px] leading-relaxed text-foreground/85 line-clamp-3">{n.note}</p>

                                                    {/* Verse quote */}
                                                    <p className={cn("mt-3 pt-3 border-t border-foreground/[0.06] text-xs text-muted-foreground/45 italic line-clamp-1", fontClass)}>
                                                        &ldquo;{n.content}&rdquo;
                                                    </p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )
                                )}

                                {/* ── Wisdom tab ─────────────────────────────── */}
                                {activeTab === "wisdom" && (
                                    wisdom.length === 0 ? (
                                        <EmptyTab
                                            icon={Quote}
                                            title="No saved wisdom"
                                            hint="Save quotes from the Daily section to find them here"
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            {wisdom.map((w, idx) => (
                                                <motion.div
                                                    key={w.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.25, delay: Math.min(idx * 0.035, 0.18), ease: [0.25, 0.1, 0.25, 1] }}
                                                    className="group relative rounded-2xl border border-white/[0.12] dark:border-white/[0.06] glass-subtle shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-white/[0.22] dark:hover:border-white/[0.12] transition-[box-shadow,border-color] duration-200 overflow-hidden px-5 py-4"
                                                >
                                                    {/* Header */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        {w.source ? (
                                                            <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/70">
                                                                <Quote className="h-3.5 w-3.5 shrink-0" />
                                                                {w.source}
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-2 text-xs text-muted-foreground/40">
                                                                <Quote className="h-3.5 w-3.5 shrink-0" />
                                                                Daily Wisdom
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[11px] text-muted-foreground/35 tabular-nums mr-1">{formatDate(w.created_at)}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const ref = w.source ?? "Daily Wisdom"
                                                                    const url = `${window.location.origin}/share?ref=${encodeURIComponent(ref)}&text=${encodeURIComponent(w.content)}`
                                                                    void handleShare(`Wisdom — ${ref}`, w.content, url)
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-full hover:bg-foreground/[0.06] text-muted-foreground/50 hover:text-foreground transition-all duration-200"
                                                            >
                                                                <Share2 className="h-3.5 w-3.5" />
                                                                <span className="sr-only">Share</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Quote */}
                                                    <p className={cn("text-[15px] leading-relaxed text-foreground/80 italic", fontClass)}>
                                                        &ldquo;{w.content}&rdquo;
                                                    </p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )
                                )}

                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    )
}
