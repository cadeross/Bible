"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { getAllHighlights, removeHighlight, type Highlight } from "@/lib/persistence"
import { PenTool, StickyNote, Share2, ArrowRight, Library, Copy, Trash2 } from "lucide-react"
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

type TabId = "highlights" | "notes"

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

// ─── Library toolbar ─────────────────────────────────────────────────────────

interface LibraryToolbarProps {
    activeTab: TabId
    onTabChange: (tab: TabId) => void
    counts: { highlights: number; notes: number }
}

const TABS = [
    { id: "highlights" as const, label: "Highlights", icon: PenTool },
    { id: "notes"      as const, label: "Notes",      icon: StickyNote },
]

function LibraryToolbar({ activeTab, onTabChange, counts }: LibraryToolbarProps) {
    return (
        <div className="w-full max-w-3xl mx-auto mb-8 flex flex-col items-center gap-3">

            {/* Title as plain text */}
            <div className="text-center space-y-0.5">
                <p className="text-[13px] font-medium text-muted-foreground select-none">Library</p>
                {(counts.highlights > 0 || counts.notes > 0) && (
                    <p className="text-[12px] text-muted-foreground/50 select-none">
                        {`You have ${[
                            counts.highlights > 0 ? `${counts.highlights} highlight${counts.highlights !== 1 ? "s" : ""}` : null,
                            counts.notes > 0 ? `${counts.notes} note${counts.notes !== 1 ? "s" : ""}` : null,
                        ].filter(Boolean).join(" and ")}`}
                    </p>
                )}
            </div>

            {/* Tab pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => { hapticLight(); onTabChange(tab.id) }}
                            className={cn(
                                "inline-flex items-center rounded-full border px-3.5 py-1.5 text-[13px] font-medium shadow-[var(--shadow-sm)] transition-[box-shadow,border-color,color] duration-200 cursor-pointer select-none [touch-action:manipulation]",
                                isActive
                                    ? "border-white/[0.2] dark:border-white/[0.12] glass-subtle text-foreground shadow-[var(--shadow-card)]"
                                    : "border-white/[0.12] dark:border-white/[0.06] glass-subtle text-muted-foreground/50 hover:shadow-[var(--shadow-card)] hover:border-white/[0.2] dark:hover:border-white/[0.12] hover:text-muted-foreground"
                            )}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>

        </div>
    )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyTab({ title, hint }: { title: string; hint: string }) {
    return (
        <div className="flex flex-col items-center gap-5 py-20 text-center">
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
            const h = await getAllHighlights()
            setRawHighlights(h)
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

    const handleCopyText = async (content: string) => {
        hapticLight()
        await navigator.clipboard.writeText(content)
    }

    const handleDeleteHighlight = async (h: GroupedHighlight) => {
        hapticMedium()
        setRawHighlights(prev => prev.filter(raw =>
            !(raw.book === h.book && raw.chapter === h.chapter &&
              raw.verse >= h.verse && raw.verse <= h.verseEnd)
        ))
        const removes: Promise<void>[] = []
        for (let v = h.verse; v <= h.verseEnd; v++) {
            removes.push(removeHighlight(h.book, h.chapter, v))
        }
        await Promise.all(removes)
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

    const isEmpty = rawHighlights.length === 0

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
                counts={{ highlights: groupedHighlights.length, notes: notes.length }}
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
                                                        whileHover={{ y: -3, transition: { type: "spring", stiffness: 350, damping: 28, mass: 0.6 } }}
                                                        whileTap={{ y: -1, scale: 0.99, transition: { type: "spring", stiffness: 500, damping: 30 } }}
                                                        transition={{ duration: 0.25, delay: Math.min(idx * 0.035, 0.18), ease: [0.25, 0.1, 0.25, 1] }}
                                                        className="group relative rounded-2xl border border-white/[0.12] dark:border-white/[0.06] glass-subtle shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:border-white/[0.18] dark:hover:border-white/[0.09] transition-[box-shadow,border-color] duration-200 overflow-hidden"
                                                    >
                                                        {/* Color splash — radial light reflection on glass */}
                                                        <div
                                                            className="absolute inset-0 pointer-events-none"
                                                            style={{
                                                                background: `radial-gradient(ellipse at 88% 0%, ${color?.accent ?? "#888"}18 0%, ${color?.accent ?? "#888"}07 42%, transparent 68%)`,
                                                            }}
                                                        />

                                                        <div className="relative px-5 pt-4 pb-4">
                                                            {/* Header: reference chip + date/share */}
                                                            <div className="flex items-center justify-between mb-4 gap-2">
                                                                <Link
                                                                    href={`/read/${encodeURIComponent(h.book)}/${h.chapter}?translation=${bibleVersion}`}
                                                                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] hover:bg-foreground/[0.04] transition-colors duration-150 shrink-0 -ml-1.5"
                                                                >
                                                                    <span
                                                                        className="h-2 w-2 rounded-full shrink-0"
                                                                        style={{ background: color?.accent ?? "#888" }}
                                                                    />
                                                                    <span className="font-semibold text-foreground/75">{h.book}</span>
                                                                    <span className="text-muted-foreground/35 select-none">·</span>
                                                                    <span className="text-muted-foreground/55 tabular-nums">{h.chapter}:{h.verse}{h.verseEnd > h.verse ? `–${h.verseEnd}` : ""}</span>
                                                                </Link>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <span className="text-[11px] text-muted-foreground/30 tabular-nums">
                                                                        {formatDate(h.created_at)}
                                                                    </span>
                                                                    <div className="flex items-center gap-0.5">
                                                                        <button
                                                                            onClick={() => void handleCopyText(h.content)}
                                                                            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-foreground/[0.06] text-muted-foreground/40 hover:text-foreground transition-colors duration-100"
                                                                        >
                                                                            <Copy className="h-3 w-3" />
                                                                            <span className="sr-only">Copy text</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const ref = `${h.book} ${h.chapter}:${h.verse}`
                                                                                const url = `${window.location.origin}/share?ref=${encodeURIComponent(ref)}&text=${encodeURIComponent(h.content)}`
                                                                                void handleShare(`Highlight — ${ref}`, h.content, url)
                                                                            }}
                                                                            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-foreground/[0.06] text-muted-foreground/40 hover:text-foreground transition-colors duration-100"
                                                                        >
                                                                            <Share2 className="h-3 w-3" />
                                                                            <span className="sr-only">Share link</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => void handleDeleteHighlight(h)}
                                                                            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors duration-100"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                            <span className="sr-only">Remove</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Verse text with colored quote marks */}
                                                            <p className={cn("text-[15px] leading-relaxed text-foreground/80", fontClass)}>
                                                                <span
                                                                    className="text-[22px] font-serif leading-[0] relative top-2 mr-0.5 select-none"
                                                                    style={{ color: `${color?.accent ?? "#888"}70` }}
                                                                >&ldquo;</span>
                                                                {h.content}
                                                                <span
                                                                    className="text-[22px] font-serif leading-[0] relative top-2 ml-0.5 select-none"
                                                                    style={{ color: `${color?.accent ?? "#888"}70` }}
                                                                >&rdquo;</span>
                                                            </p>

                                                            {/* Inline note preview */}
                                                            {h.note && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditNote(h)}
                                                                    className="mt-4 pt-3.5 border-t border-foreground/[0.06] w-full flex items-start gap-2 text-left hover:opacity-75 transition-opacity duration-150"
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


                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>
        </div>
    )
}
