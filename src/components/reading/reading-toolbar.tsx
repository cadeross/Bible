"use client"

import * as React from "react"
import { useReadingPreferences, FontType } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { BOOK_LIST, TRANSLATIONS } from "@/lib/bible-api"
import { BIBLE_BOOKS } from "@/lib/bible-data"
import { ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, Hash, Palette, Heading } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { canGoNextChapter, canGoPrevChapter, getAdjacentChapter } from "@/lib/chapter-navigation"
import { hapticLight } from "@/lib/haptics"

// ─── Sliding highlight used in list menus ──────────────────────────────────

function SlidingHighlight({ containerRef, hoveredIndex }: { containerRef: React.RefObject<HTMLDivElement | null>; hoveredIndex: number | null }) {
    const [rect, setRect] = React.useState<{ top: number; height: number } | null>(null)

    React.useEffect(() => {
        if (hoveredIndex === null || !containerRef.current) { setRect(null); return }
        const buttons = containerRef.current.querySelectorAll<HTMLElement>("[data-slide-item]")
        const el = buttons[hoveredIndex]
        if (!el) { setRect(null); return }
        const parentRect = containerRef.current.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        setRect({ top: elRect.top - parentRect.top + containerRef.current.scrollTop, height: elRect.height })
    }, [hoveredIndex, containerRef])

    return (
        <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1 right-1 z-0 rounded-[12px] bg-foreground/[0.05] dark:bg-white/[0.07]"
            initial={false}
            animate={rect ? { opacity: 1, top: rect.top, height: rect.height } : { opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.5 }}
            style={{ position: "absolute" }}
        />
    )
}

// ─── Sliding highlight for 2D grids (typeface selector) ─────────────────────

function GridHighlight({ containerRef, hoveredIndex }: { containerRef: React.RefObject<HTMLDivElement | null>; hoveredIndex: number | null }) {
    const [rect, setRect] = React.useState<{ top: number; left: number; width: number; height: number } | null>(null)

    React.useEffect(() => {
        if (hoveredIndex === null || !containerRef.current) { setRect(null); return }
        const buttons = containerRef.current.querySelectorAll<HTMLElement>("[data-slide-item]")
        const el = buttons[hoveredIndex]
        if (!el) { setRect(null); return }
        const parentRect = containerRef.current.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        setRect({ top: elRect.top - parentRect.top, left: elRect.left - parentRect.left, width: elRect.width, height: elRect.height })
    }, [hoveredIndex, containerRef])

    return (
        <motion.div
            aria-hidden
            className="pointer-events-none absolute z-0 rounded-xl bg-foreground/[0.05] dark:bg-white/[0.07]"
            initial={false}
            animate={rect ? { opacity: 1, top: rect.top, left: rect.left, width: rect.width, height: rect.height } : { opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.5 }}
            style={{ position: "absolute" }}
        />
    )
}

// ─── Book list ──────────────────────────────────────────────────────────────

function BookList({ books, currentBook, onSelect }: { books: { id: string; name: string }[]; currentBook: string; onSelect: (id: string) => void }) {
    const listRef = React.useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = React.useState<number | null>(null)

    if (books.length === 0) {
        return <div className="py-6 text-center text-sm text-muted-foreground">No results</div>
    }

    return (
        <div ref={listRef} className="relative max-h-[320px] overflow-y-auto p-1" onPointerLeave={() => setHovered(null)}>
            <SlidingHighlight containerRef={listRef} hoveredIndex={hovered} />
            {books.map((book, i) => (
                <button
                    key={book.id}
                    type="button"
                    data-slide-item
                    onClick={() => onSelect(book.id)}
                    onPointerEnter={() => setHovered(i)}
                    className={cn(
                        "relative z-10 flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                        book.id === currentBook ? "text-foreground" : "text-foreground/70"
                    )}
                >
                    {book.name}
                </button>
            ))}
        </div>
    )
}

// ─── Translation list ───────────────────────────────────────────────────────

function TranslationList({
    translations,
    currentTranslation,
    onSelect,
    search,
    setSearch,
    inputRef,
}: {
    translations: { id: string; name: string; abbreviation?: string }[]
    currentTranslation: string
    onSelect: (id: string) => void
    search: string
    setSearch: (s: string) => void
    inputRef: React.RefObject<HTMLInputElement | null>
}) {
    const listRef = React.useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = React.useState<number | null>(null)

    const filtered = React.useMemo(() => {
        if (!search) return translations
        const q = search.toLowerCase()
        return translations.filter(t => {
            const abbrev = ((t as any).abbreviation || t.id).toLowerCase()
            return abbrev.includes(q) || t.name.toLowerCase().includes(q)
        })
    }, [translations, search])

    return (
        <>
            <div className="border-b border-border/20 px-3 py-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search versions..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && filtered.length > 0) { onSelect(filtered[0].id); setSearch("") }
                        if (e.key === "Escape") { setSearch("") }
                    }}
                />
            </div>
            <div ref={listRef} className="relative max-h-[320px] overflow-y-auto p-1" onPointerLeave={() => setHovered(null)}>
                {filtered.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">No results</div>
                ) : (
                    <>
                        <SlidingHighlight containerRef={listRef} hoveredIndex={hovered} />
                        {filtered.map((t, i) => {
                            const abbrev = ((t as any).abbreviation || t.id).toUpperCase()
                            const selected = t.id === currentTranslation
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    data-slide-item
                                    onClick={() => { onSelect(t.id); setSearch("") }}
                                    onPointerEnter={() => setHovered(i)}
                                    className="relative z-10 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
                                >
                                    <span className={cn("w-14 shrink-0 text-xs font-semibold tabular-nums", selected ? "text-foreground" : "text-muted-foreground")}>
                                        {abbrev}
                                    </span>
                                    <span className={cn("text-[13px] font-medium truncate", selected ? "text-foreground" : "text-foreground/70")}>
                                        {t.name}
                                    </span>
                                </button>
                            )
                        })}
                    </>
                )}
            </div>
        </>
    )
}

// ─── Chapter input ──────────────────────────────────────────────────────────

const ChapterInput = ({ currentChapter, maxChapters, onChange }: { currentChapter: number; maxChapters: number; onChange: (val: number) => void }) => {
    const [isEditing, setIsEditing] = React.useState(false)
    const [value, setValue] = React.useState(currentChapter.toString())
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => { setValue(currentChapter.toString()) }, [currentChapter])
    React.useEffect(() => {
        if (isEditing && inputRef.current) { inputRef.current.focus(); inputRef.current.select() }
    }, [isEditing])

    const handleSubmit = () => {
        setIsEditing(false)
        const num = parseInt(value, 10)
        if (!isNaN(num) && num >= 1 && num <= maxChapters && num !== currentChapter) {
            onChange(num)
        } else {
            setValue(currentChapter.toString())
        }
    }

    return (
        <span className="inline-flex w-7 items-center justify-end">
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleSubmit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") { handleSubmit(); inputRef.current?.blur() }
                        if (e.key === "Escape") { setIsEditing(false); setValue(currentChapter.toString()) }
                    }}
                    className="w-full text-center text-[13px] font-semibold bg-transparent outline-none text-foreground tabular-nums"
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full cursor-pointer text-center text-[13px] font-semibold text-foreground tabular-nums transition-colors hover:text-foreground/70"
                >
                    {currentChapter}
                </button>
            )}
        </span>
    )
}

// ─── Animated pill (book / translation labels) ──────────────────────────────

const SPRING_LAYOUT = { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 }
const PILL_WIDTH_CACHE = new Map<string, number>()

function AnimatedPill({ text, icon, className: extraClassName }: { text: string; icon?: React.ReactNode; className?: string }) {
    const [displayText, setDisplayText] = React.useState(text)
    const cachedWidth = PILL_WIDTH_CACHE.get(text)
    const [width, setWidth] = React.useState<number>(cachedWidth ?? 0)
    const [ready, setReady] = React.useState(cachedWidth != null)
    const sizerRef = React.useRef<HTMLSpanElement>(null)

    React.useLayoutEffect(() => {
        if (!sizerRef.current) return
        const measured = sizerRef.current.offsetWidth
        PILL_WIDTH_CACHE.set(text, measured)
        setWidth(measured)
        setReady(true)
    }, [text])

    React.useEffect(() => {
        if (text === displayText) return
        const t = setTimeout(() => setDisplayText(text), 100)
        return () => clearTimeout(t)
    }, [text, displayText])

    return (
        <span className={cn(
            "relative inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] dark:border-white/[0.06] glass-subtle px-3.5 py-1.5 text-[13px] font-medium shadow-[var(--shadow-sm)] cursor-pointer select-none transition-[box-shadow,border-color] duration-200 hover:shadow-[var(--shadow-card)] hover:border-white/[0.2] active:scale-[0.97] [touch-action:manipulation]",
            extraClassName
        )}>
            <span className="absolute left-0 top-0 opacity-0 pointer-events-none whitespace-nowrap text-[13px] font-medium" ref={sizerRef} aria-hidden>{text}</span>
            <motion.span className="inline-block overflow-hidden whitespace-nowrap" initial={false} animate={{ width: ready ? width : undefined }} transition={SPRING_LAYOUT}>
                <span className={cn("inline-block transition-[opacity,filter] duration-150", displayText !== text ? "opacity-0 blur-[3px]" : "opacity-100 blur-0")}>
                    {displayText}
                </span>
            </motion.span>
            {icon}
        </span>
    )
}

function ToolbarPill({ children, onClick, className: extraClassName }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.12] dark:border-white/[0.06] glass-subtle px-3.5 py-1.5 text-[13px] font-medium shadow-[var(--shadow-sm)] transition-[box-shadow,border-color] duration-200 hover:shadow-[var(--shadow-card)] hover:border-white/[0.2] active:scale-[0.97] [touch-action:manipulation]",
                extraClassName
            )}
        >
            {children}
        </button>
    )
}

// ─── Appearance panel components ────────────────────────────────────────────

const FONT_OPTIONS: { id: FontType; label: string; family: string }[] = [
    { id: "sans",  label: "Sans",  family: "var(--font-geist-sans), system-ui, sans-serif" },
    { id: "serif", label: "Serif", family: "Merriweather, Georgia, serif" },
    { id: "mono",  label: "Mono",  family: "var(--font-geist-mono), monospace" },
    { id: "pixel", label: "Round", family: "var(--font-nunito), system-ui, sans-serif" },
]

/** A standalone glass-surface toggle row. Used inside the Appearance panel. */
function ToggleRow({
    active,
    onClick,
    icon,
    label,
    accent = "primary",
}: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
    accent?: "primary" | "red"
}) {
    const trackOn = accent === "red"
        ? "bg-red-500/75 dark:bg-red-500/65"
        : "bg-foreground/[0.5] dark:bg-white/[0.5]"
    const iconColor = accent === "red"
        ? (active ? "text-red-500" : "text-muted-foreground/50")
        : (active ? "text-foreground" : "text-muted-foreground/50")

    return (
        <motion.button
            type="button"
            suppressHydrationWarning
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            className="relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer
                       border border-black/[0.06] dark:border-white/[0.09]
                       transition-all duration-150"
            style={{
                background: "color-mix(in srgb, var(--popover) 60%, transparent)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.1), inset 0 -0.5px 0 rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.05)",
            }}
        >
            {/* Bare icon — no badge container */}
            <span className={cn("shrink-0 transition-colors duration-150", iconColor)}>
                {icon}
            </span>

            {/* Label */}
            <span className={cn(
                "flex-1 text-left text-[13px] font-medium transition-colors duration-150",
                active ? "text-foreground" : "text-foreground/55"
            )}>
                {label}
            </span>

            {/* Glass toggle switch */}
            <div
                className={cn(
                    "relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200",
                    active ? trackOn : "bg-foreground/[0.08] dark:bg-white/[0.07]"
                )}
                style={{ boxShadow: "inset 0 1.5px 3px rgba(0,0,0,0.2), inset 0 0 0 0.5px rgba(0,0,0,0.06)" }}
            >
                <motion.div
                    className="absolute top-[3px] h-4 w-4 rounded-full bg-white"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.3), inset 0 0.5px 0 rgba(255,255,255,0.95)" }}
                    animate={{ x: active ? 17 : 3 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </div>
        </motion.button>
    )
}

/** Thin divider between panel sections. */
function PanelDivider() {
    return <div className="h-px bg-foreground/[0.06]" />
}

// ─── Animated stepper value ─────────────────────────────────────────────────

function StepperValue({ value }: { value: string }) {
    return (
        <div className="relative w-11 overflow-hidden flex items-center justify-center" style={{ height: "1.125rem" }}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={value}
                    initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                    transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute text-[12px] font-semibold tabular-nums text-foreground select-none"
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </div>
    )
}

// ─── Main toolbar ───────────────────────────────────────────────────────────

interface ReadingToolbarProps {
    currentBook?: string
    currentChapter?: number
    currentTranslation?: string
    hasSectionTitles?: boolean
    onNavigate?: (book: string, chapter: number, translation?: string) => void
}

export function ReadingToolbar({
    currentBook = "Genesis",
    currentChapter = 1,
    currentTranslation = "dra",
    hasSectionTitles = false,
    onNavigate,
}: ReadingToolbarProps) {
    const router = useRouter()
    const {
        isLoaded, fontFamily, setFontFamily, fontSize, setFontSize,
        lineHeight, setLineHeight,
        showVerseNumbers, setShowVerseNumbers, redLetters, setRedLetters,
        showTitles, setShowTitles, setBibleVersion, enabledTranslations,
    } = useReadingPreferences()

    const [allTranslations, setAllTranslations] = React.useState(TRANSLATIONS)
    const [translationsLoaded, setTranslationsLoaded] = React.useState(false)

    // Load cached translations before first paint so the label is correct without a flash.
    // useLayoutEffect is intentionally used here: it runs synchronously after hydration but
    // before the browser paints, so the user never sees the raw API Bible ID.
    React.useLayoutEffect(() => {
        try {
            const cached = localStorage.getItem("cached-translations")
            if (cached) setAllTranslations(JSON.parse(cached))
        } catch {}
    }, [])
    const [bookOpen, setBookOpen] = React.useState(false)
    const [bookSearch, setBookSearch] = React.useState("")
    const bookInputRef = React.useRef<HTMLInputElement>(null)
    const [translationOpen, setTranslationOpen] = React.useState(false)
    const [translationSearch, setTranslationSearch] = React.useState("")
    const translationInputRef = React.useRef<HTMLInputElement>(null)

    const chapterCount = React.useMemo(() => {
        const bookData = BIBLE_BOOKS.find(b => b.name === currentBook)
        return bookData ? bookData.chapters : 150
    }, [currentBook])

    React.useEffect(() => {
        import("@/lib/bible-api").then(({ getAllTranslations }) => {
            getAllTranslations().then((ts) => {
                setAllTranslations(ts)
                setTranslationsLoaded(true)
                try { localStorage.setItem("cached-translations", JSON.stringify(ts)) } catch {}
            })
        })
    }, [])

    const availableTranslations = React.useMemo(() => {
        if (enabledTranslations === null) return allTranslations
        // Always include current translation even if not in enabled list
        return allTranslations.filter(t => enabledTranslations.includes(t.id) || t.id === currentTranslation)
    }, [allTranslations, enabledTranslations, currentTranslation])

    const nav = React.useCallback((book: string, chapter: number, translation?: string) => {
        if (onNavigate) {
            onNavigate(book, chapter, translation)
        } else {
            router.push(`/read/${encodeURIComponent(book)}/${chapter}?translation=${translation || currentTranslation}`)
        }
    }, [onNavigate, router, currentTranslation])

    const handleBookChange = (book: string) => { hapticLight(); nav(book, 1); setBookOpen(false) }
    const handleChapterChange = (chapter: string) => { nav(currentBook, parseInt(chapter, 10)) }
    const handleTranslationChange = (translationId: string) => { hapticLight(); setBibleVersion(translationId); nav(currentBook, currentChapter, translationId); setTranslationOpen(false) }

    const prevNav = getAdjacentChapter(currentBook, currentChapter, -1)
    const nextNav = getAdjacentChapter(currentBook, currentChapter, 1)
    const prevOk  = canGoPrevChapter(currentBook, currentChapter)
    const nextOk  = canGoNextChapter(currentBook, currentChapter)

    const normalizedBooks = React.useMemo(() =>
        BOOK_LIST.map(b => typeof b === "string" ? { id: b, name: b } : b), [])

    const filteredBooks = React.useMemo(() => {
        if (!bookSearch) return normalizedBooks
        const q = bookSearch.toLowerCase()
        return normalizedBooks.filter(b => b.name.toLowerCase().includes(q))
    }, [normalizedBooks, bookSearch])

    const translationLabel = React.useMemo(() => {
        const t = availableTranslations.find(t => t.id === currentTranslation)
        return t ? ((t as any).abbreviation || t.id).toUpperCase() : currentTranslation.toUpperCase()
    }, [availableTranslations, currentTranslation])

    const activeFontSize = isLoaded ? fontSize : 18
    const activeLineHeight = isLoaded ? lineHeight : 1.6

    const gridRef = React.useRef<HTMLDivElement>(null)
    const [hoveredFont, setHoveredFont] = React.useState<number | null>(null)

    return (
        <div className="w-full max-w-3xl mx-auto mb-8">
            <div className="flex items-center justify-center gap-2 flex-wrap">

                {/* ── Book Selector ── */}
                <Popover open={bookOpen} onOpenChange={(o) => { setBookOpen(o); if (o) setTimeout(() => bookInputRef.current?.focus(), 50) }}>
                    <PopoverTrigger asChild>
                        <button type="button">
                            <AnimatedPill
                                text={currentBook}
                                icon={<ChevronDown className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                                className="text-foreground"
                            />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-[220px] p-0">
                        <div className="border-b border-border/20 px-3 py-2">
                            <input
                                ref={bookInputRef}
                                type="text"
                                value={bookSearch}
                                onChange={(e) => setBookSearch(e.target.value)}
                                placeholder="Search books..."
                                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && filteredBooks.length > 0) { handleBookChange(filteredBooks[0].id); setBookSearch("") }
                                    if (e.key === "Escape") { setBookOpen(false); setBookSearch("") }
                                }}
                            />
                        </div>
                        <BookList books={filteredBooks} currentBook={currentBook} onSelect={(id) => { handleBookChange(id); setBookSearch("") }} />
                    </PopoverContent>
                </Popover>

                {/* ── Chapter Nav ── */}
                <div className="flex items-center gap-0 rounded-full border border-white/[0.12] dark:border-white/[0.06] glass-subtle px-1 py-0.5 shadow-[var(--shadow-sm)]">
                    <button
                        type="button"
                        onClick={() => { if (prevNav) nav(prevNav.book, prevNav.chapter) }}
                        disabled={!prevOk}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground disabled:opacity-20 disabled:pointer-events-none disabled:cursor-default"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex items-baseline gap-0 px-1">
                        <ChapterInput currentChapter={currentChapter} maxChapters={chapterCount} onChange={(v) => handleChapterChange(v.toString())} />
                        <span className="text-[11px] font-medium text-muted-foreground/35 tabular-nums leading-none">/{chapterCount}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => { if (nextNav) nav(nextNav.book, nextNav.chapter) }}
                        disabled={!nextOk}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground disabled:opacity-20 disabled:pointer-events-none disabled:cursor-default"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* ── Translation Selector ── */}
                <Popover
                    open={translationOpen}
                    onOpenChange={(o) => {
                        setTranslationOpen(o)
                        if (o) setTimeout(() => translationInputRef.current?.focus(), 50)
                        else setTranslationSearch("")
                    }}
                >
                    <PopoverTrigger asChild>
                        <button type="button">
                            <AnimatedPill
                                text={translationLabel}
                                icon={<ChevronDown className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                                className="text-muted-foreground"
                            />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-[300px] p-0">
                        <TranslationList
                            translations={availableTranslations}
                            currentTranslation={currentTranslation}
                            onSelect={handleTranslationChange}
                            search={translationSearch}
                            setSearch={setTranslationSearch}
                            inputRef={translationInputRef}
                        />
                    </PopoverContent>
                </Popover>

                {/* ── Appearance ── */}
                <Popover>
                    <PopoverTrigger asChild>
                        <div>
                            <ToolbarPill className="text-muted-foreground">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                            </ToolbarPill>
                        </div>
                    </PopoverTrigger>

                    <PopoverContent align="center" className="w-[min(100vw-2rem,17rem)] p-0 overflow-hidden">

                        {/* ── Typeface ── */}
                        <div className="p-3">
                            <div
                                ref={gridRef}
                                className="relative grid grid-cols-4 gap-1.5"
                                onPointerLeave={() => setHoveredFont(null)}
                            >
                                <GridHighlight containerRef={gridRef} hoveredIndex={hoveredFont} />
                                {FONT_OPTIONS.map((f, i) => {
                                    const selected = isLoaded ? fontFamily === f.id : f.id === "serif"
                                    return (
                                        <motion.button
                                            key={f.id}
                                            type="button"
                                            suppressHydrationWarning
                                            data-slide-item
                                            onClick={() => setFontFamily(f.id)}
                                            onPointerEnter={() => setHoveredFont(i)}
                                            whileTap={{ scale: 0.93 }}
                                            className={cn(
                                                "relative z-10 flex flex-col items-center gap-1 rounded-xl py-2.5 cursor-pointer",
                                                "transition-colors duration-150",
                                                selected ? "bg-foreground/[0.07] dark:bg-white/[0.09]" : ""
                                            )}
                                        >
                                            {selected && (
                                                <motion.div
                                                    layoutId="typeface-ring"
                                                    className="absolute inset-0 rounded-xl ring-1 ring-foreground/[0.14] dark:ring-white/[0.18]"
                                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                                />
                                            )}
                                            <span
                                                className={cn(
                                                    "relative z-10 text-[17px] leading-none transition-colors duration-150",
                                                    selected ? "text-foreground" : "text-foreground/40"
                                                )}
                                                style={{ fontFamily: f.family }}
                                            >
                                                Aa
                                            </span>
                                            <span className={cn(
                                                "relative z-10 text-[10px] font-medium transition-colors duration-150",
                                                selected ? "text-foreground/70" : "text-muted-foreground/35"
                                            )}>
                                                {f.label}
                                            </span>
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </div>

                        <PanelDivider />

                        {/* ── Font size + Line height ── */}
                        <div className="flex items-center justify-around gap-2 px-3 py-2.5">

                            {/* Font size */}
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Size</span>
                                <div className="flex items-center gap-0 rounded-full bg-foreground/[0.05] dark:bg-white/[0.05] p-0.5">
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.82 }}
                                        onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                                        disabled={activeFontSize <= 12}
                                        className="h-7 w-7 flex items-center justify-center rounded-full text-foreground/55 hover:bg-foreground/[0.08] dark:hover:bg-white/[0.09] hover:text-foreground transition-colors duration-150 disabled:opacity-25 disabled:pointer-events-none"
                                    >
                                        <span className="text-[16px] leading-none select-none font-light">−</span>
                                    </motion.button>
                                    <StepperValue value={`${activeFontSize}px`} />
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.82 }}
                                        onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                                        disabled={activeFontSize >= 32}
                                        className="h-7 w-7 flex items-center justify-center rounded-full text-foreground/55 hover:bg-foreground/[0.08] dark:hover:bg-white/[0.09] hover:text-foreground transition-colors duration-150 disabled:opacity-25 disabled:pointer-events-none"
                                    >
                                        <span className="text-[16px] leading-none select-none font-light">+</span>
                                    </motion.button>
                                </div>
                            </div>

                            <div className="w-px self-stretch bg-foreground/[0.06]" />

                            {/* Line height */}
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Spacing</span>
                                <div className="flex items-center gap-0 rounded-full bg-foreground/[0.05] dark:bg-white/[0.05] p-0.5">
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.82 }}
                                        onClick={() => setLineHeight(Math.max(1.2, parseFloat((lineHeight - 0.1).toFixed(1))))}
                                        disabled={activeLineHeight <= 1.2}
                                        className="h-7 w-7 flex items-center justify-center rounded-full text-foreground/55 hover:bg-foreground/[0.08] dark:hover:bg-white/[0.09] hover:text-foreground transition-colors duration-150 disabled:opacity-25 disabled:pointer-events-none"
                                    >
                                        <span className="text-[16px] leading-none select-none font-light">−</span>
                                    </motion.button>
                                    <StepperValue value={activeLineHeight.toFixed(1)} />
                                    <motion.button
                                        type="button"
                                        whileTap={{ scale: 0.82 }}
                                        onClick={() => setLineHeight(Math.min(2.4, parseFloat((lineHeight + 0.1).toFixed(1))))}
                                        disabled={activeLineHeight >= 2.4}
                                        className="h-7 w-7 flex items-center justify-center rounded-full text-foreground/55 hover:bg-foreground/[0.08] dark:hover:bg-white/[0.09] hover:text-foreground transition-colors duration-150 disabled:opacity-25 disabled:pointer-events-none"
                                    >
                                        <span className="text-[16px] leading-none select-none font-light">+</span>
                                    </motion.button>
                                </div>
                            </div>

                        </div>

                        <PanelDivider />

                        {/* ── Display toggles — each is its own glass surface ── */}
                        <div className="flex flex-col gap-1.5 p-3">
                            <ToggleRow
                                active={!isLoaded || showVerseNumbers}
                                onClick={() => setShowVerseNumbers(!showVerseNumbers)}
                                icon={<Hash className="h-3.5 w-3.5" />}
                                label="Verse Numbers"
                            />
                            <ToggleRow
                                active={!isLoaded || redLetters}
                                onClick={() => setRedLetters(!redLetters)}
                                icon={<Palette className="h-3.5 w-3.5" />}
                                label="Red Letters"
                                accent="red"
                            />
                            {hasSectionTitles && (
                                <ToggleRow
                                    active={isLoaded && showTitles}
                                    onClick={() => setShowTitles(!showTitles)}
                                    icon={<Heading className="h-3.5 w-3.5" />}
                                    label="Headings"
                                />
                            )}
                        </div>

                    </PopoverContent>
                </Popover>

            </div>
        </div>
    )
}
