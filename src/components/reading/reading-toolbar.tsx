"use client"

import * as React from "react"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { BOOK_LIST, TRANSLATIONS } from "@/lib/bible-api"
import { BIBLE_BOOKS } from "@/lib/bible-data"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
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

// ─── Main toolbar ───────────────────────────────────────────────────────────

interface ReadingToolbarProps {
    currentBook?: string
    currentChapter?: number
    currentTranslation?: string
    onNavigate?: (book: string, chapter: number, translation?: string) => void
}

export function ReadingToolbar({
    currentBook = "Genesis",
    currentChapter = 1,
    currentTranslation = "dra",
    onNavigate,
}: ReadingToolbarProps) {
    const router = useRouter()
    const { setBibleVersion, enabledTranslations } = useReadingPreferences()

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

    return (
        <div className="w-full max-w-3xl mx-auto mb-8">
            <div className="flex items-center justify-center gap-2 flex-wrap">

                {/* ── Book Selector ── */}
                <Popover open={bookOpen} onOpenChange={(o) => { setBookOpen(o); if (o) { hapticLight(); setTimeout(() => bookInputRef.current?.focus(), 50) } }}>
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
                        onClick={() => { if (prevNav) { hapticLight(); nav(prevNav.book, prevNav.chapter) } }}
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
                        onClick={() => { if (nextNav) { hapticLight(); nav(nextNav.book, nextNav.chapter) } }}
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
                        if (o) { hapticLight(); setTimeout(() => translationInputRef.current?.focus(), 50) }
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

            </div>
        </div>
    )
}
