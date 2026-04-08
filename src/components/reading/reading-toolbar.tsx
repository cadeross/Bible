"use client"

import * as React from "react"
import { useReadingPreferences, FontType } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { BOOK_LIST, TRANSLATIONS } from "@/lib/bible-api"
import { BIBLE_BOOKS } from "@/lib/bible-data"
import { ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, Hash, Palette, Heading, Minus, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { canGoNextChapter, canGoPrevChapter, getAdjacentChapter } from "@/lib/chapter-navigation"

const ChapterInput = ({ currentChapter, maxChapters, onChange }: { currentChapter: number, maxChapters: number, onChange: (val: number) => void }) => {
    const [isEditing, setIsEditing] = React.useState(false)
    const [value, setValue] = React.useState(currentChapter.toString())
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => { setValue(currentChapter.toString()) }, [currentChapter])
    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
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

    if (isEditing) {
        return (
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
                className="w-8 text-center text-[13px] font-semibold bg-transparent outline-none text-foreground tabular-nums"
            />
        )
    }

    return (
        <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="min-w-[1.5rem] text-center text-[13px] font-semibold text-foreground tabular-nums transition-colors hover:text-primary"
        >
            {currentChapter}
        </button>
    )
}

const SPRING_LAYOUT = { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 }

const PILL_WIDTH_CACHE = new Map<string, number>()

function AnimatedPill({
    text,
    icon,
    className: extraClassName,
}: {
    text: string
    icon?: React.ReactNode
    className?: string
}) {
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
        <span
            className={cn(
                "relative inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] dark:border-white/[0.06] glass-subtle px-3.5 py-1.5 text-[13px] font-medium shadow-[var(--shadow-sm)] cursor-pointer select-none transition-[box-shadow,border-color] duration-200 hover:shadow-[var(--shadow-card)] hover:border-white/[0.2] active:scale-[0.97]",
                extraClassName
            )}
        >
            <span className="absolute left-0 top-0 opacity-0 pointer-events-none whitespace-nowrap text-[13px] font-medium" ref={sizerRef} aria-hidden>{text}</span>
            <motion.span
                className="inline-block overflow-hidden whitespace-nowrap"
                initial={false}
                animate={{ width: ready ? width : undefined }}
                transition={SPRING_LAYOUT}
            >
                <span className={cn(
                    "inline-block transition-[opacity,filter] duration-150",
                    displayText !== text ? "opacity-0 blur-[3px]" : "opacity-100 blur-0"
                )}>
                    {displayText}
                </span>
            </motion.span>
            {icon}
        </span>
    )
}

function ToolbarPill({
    children,
    onClick,
    className: extraClassName,
}: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex items-center gap-1.5 rounded-full border border-white/[0.12] dark:border-white/[0.06] glass-subtle px-3.5 py-1.5 text-[13px] font-medium shadow-[var(--shadow-sm)] transition-[box-shadow,border-color] duration-200 hover:shadow-[var(--shadow-card)] hover:border-white/[0.2] active:scale-[0.97]",
                extraClassName
            )}
        >
            {children}
        </button>
    )
}

const FONT_OPTIONS: { id: FontType; label: string; preview: string; family: string }[] = [
    { id: "sans", label: "Sans", preview: "Aa", family: "var(--font-geist-sans), system-ui, sans-serif" },
    { id: "serif", label: "Serif", preview: "Aa", family: "Merriweather, Georgia, serif" },
    { id: "mono", label: "Mono", preview: "Aa", family: "var(--font-geist-mono), monospace" },
    { id: "pixel", label: "Round", preview: "Aa", family: "var(--font-nunito), system-ui, sans-serif" },
]

const PREVIEW_TEXT = "\u201CThe Lord is my shepherd; I shall not want.\u201D"

interface ReadingToolbarProps {
    currentBook?: string
    currentChapter?: number
    currentTranslation?: string
    hasSectionTitles?: boolean
    onNavigate?: (book: string, chapter: number, translation?: string) => void
}

export function ReadingToolbar({ currentBook = "Genesis", currentChapter = 1, currentTranslation = "dra", hasSectionTitles = false, onNavigate }: ReadingToolbarProps) {
    const router = useRouter()
    const {
        isLoaded, fontFamily, setFontFamily, fontSize, setFontSize,
        showVerseNumbers, setShowVerseNumbers, redLetters, setRedLetters,
        showTitles, setShowTitles, setBibleVersion,
    } = useReadingPreferences()

    const [availableTranslations, setAvailableTranslations] = React.useState(TRANSLATIONS)
    const [bookOpen, setBookOpen] = React.useState(false)
    const [bookSearch, setBookSearch] = React.useState("")
    const bookInputRef = React.useRef<HTMLInputElement>(null)

    const chapterCount = React.useMemo(() => {
        const bookData = BIBLE_BOOKS.find(b => b.name === currentBook)
        return bookData ? bookData.chapters : 150
    }, [currentBook])

    React.useEffect(() => {
        import("@/lib/bible-api").then(({ getAllTranslations }) => {
            getAllTranslations().then(setAvailableTranslations)
        })
    }, [])

    const nav = React.useCallback((book: string, chapter: number, translation?: string) => {
        if (onNavigate) {
            onNavigate(book, chapter, translation)
        } else {
            router.push(`/read/${encodeURIComponent(book)}/${chapter}?translation=${translation || currentTranslation}`)
        }
    }, [onNavigate, router, currentTranslation])

    const handleBookChange = (book: string) => {
        nav(book, 1)
        setBookOpen(false)
    }
    const handleChapterChange = (chapter: string) => {
        nav(currentBook, parseInt(chapter, 10))
    }
    const handleTranslationChange = (translationId: string) => {
        setBibleVersion(translationId)
        nav(currentBook, currentChapter, translationId)
    }

    const prevNav = getAdjacentChapter(currentBook, currentChapter, -1)
    const nextNav = getAdjacentChapter(currentBook, currentChapter, 1)
    const prevOk = canGoPrevChapter(currentBook, currentChapter)
    const nextOk = canGoNextChapter(currentBook, currentChapter)

    const normalizedBooks = React.useMemo(() =>
        BOOK_LIST.map(b => typeof b === "string" ? { id: b, name: b } : b),
        []
    )

    const filteredBooks = React.useMemo(() => {
        if (!bookSearch) return normalizedBooks
        const q = bookSearch.toLowerCase()
        return normalizedBooks.filter(b => b.name.toLowerCase().includes(q))
    }, [normalizedBooks, bookSearch])

    const translationLabel = React.useMemo(() => {
        const t = availableTranslations.find(t => t.id === currentTranslation)
        return t ? ((t as any).abbreviation || t.id).toUpperCase() : currentTranslation.toUpperCase()
    }, [availableTranslations, currentTranslation])

    const currentFontFamily = React.useMemo(() => {
        return FONT_OPTIONS.find(f => f.id === (isLoaded ? fontFamily : "serif"))?.family || "serif"
    }, [isLoaded, fontFamily])

    return (
        <div className="w-full max-w-3xl mx-auto mb-8">
            <div className="flex items-center justify-center gap-2 flex-wrap">
                {/* Book Selector */}
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
                                    if (e.key === "Enter" && filteredBooks.length > 0) {
                                        handleBookChange(filteredBooks[0].id)
                                        setBookSearch("")
                                    }
                                    if (e.key === "Escape") { setBookOpen(false); setBookSearch("") }
                                }}
                            />
                        </div>
                        <div className="max-h-[320px] overflow-y-auto p-1">
                            {filteredBooks.map((book) => (
                                <button
                                    key={book.id}
                                    type="button"
                                    onClick={() => { handleBookChange(book.id); setBookSearch("") }}
                                    className={cn(
                                        "flex w-full items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                                        book.id === currentBook
                                            ? "bg-primary/[0.07] text-primary dark:bg-primary/[0.12]"
                                            : "text-foreground/80 hover:bg-muted/50"
                                    )}
                                >
                                    {book.name}
                                </button>
                            ))}
                            {filteredBooks.length === 0 && (
                                <div className="py-6 text-center text-sm text-muted-foreground">No results</div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Chapter Nav */}
                <div className="flex items-center gap-0 rounded-full border border-white/[0.12] dark:border-white/[0.06] glass-subtle px-1 py-0.5 shadow-[var(--shadow-sm)]">
                    <button
                        type="button"
                        onClick={() => { if (prevNav) nav(prevNav.book, prevNav.chapter) }}
                        disabled={!prevOk}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground disabled:opacity-20 disabled:pointer-events-none"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex items-baseline gap-0.5 px-1">
                        <ChapterInput currentChapter={currentChapter} maxChapters={chapterCount} onChange={(v) => handleChapterChange(v.toString())} />
                        <span className="text-[11px] text-muted-foreground/40 tabular-nums">/{chapterCount}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => { if (nextNav) nav(nextNav.book, nextNav.chapter) }}
                        disabled={!nextOk}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground disabled:opacity-20 disabled:pointer-events-none"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Translation Selector */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button type="button">
                            <AnimatedPill
                                text={translationLabel}
                                icon={<ChevronDown className="h-3 w-3 text-muted-foreground/50 shrink-0" />}
                                className="text-muted-foreground"
                            />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-[300px] p-1">
                        <div className="max-h-[360px] overflow-y-auto">
                            {availableTranslations.map((t) => {
                                const abbrev = ((t as any).abbreviation || t.id).toUpperCase()
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => handleTranslationChange(t.id)}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                                            t.id === currentTranslation
                                                ? "bg-primary/[0.07] dark:bg-primary/[0.12]"
                                                : "hover:bg-muted/50"
                                        )}
                                    >
                                        <span className={cn(
                                            "w-14 shrink-0 text-xs font-semibold tabular-nums",
                                            t.id === currentTranslation ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {abbrev}
                                        </span>
                                        <span className={cn(
                                            "text-[13px] font-medium truncate",
                                            t.id === currentTranslation ? "text-foreground" : "text-foreground/70"
                                        )}>
                                            {t.name}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Appearance */}
                <Popover>
                    <PopoverTrigger asChild>
                        <div>
                            <ToolbarPill className="text-muted-foreground">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                            </ToolbarPill>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-[min(100vw-2rem,22rem)] p-0 overflow-hidden">
                        <div className="p-4 space-y-5">
                            {/* Font Family */}
                            <div className="relative grid grid-cols-4 rounded-xl border border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.02] p-1 gap-0">
                                {/* Sliding indicator */}
                                <motion.div
                                    className="absolute top-1 bottom-1 rounded-[10px] bg-primary/[0.1] ring-1 ring-primary/25 dark:bg-primary/[0.18]"
                                    layout
                                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                                    style={{
                                        width: `calc(25% - 2px)`,
                                        left: `calc(${FONT_OPTIONS.findIndex(f => f.id === (isLoaded ? fontFamily : "serif")) * 25}% + 1px)`,
                                    }}
                                />
                                {FONT_OPTIONS.map((f) => {
                                    const selected = isLoaded && fontFamily === f.id
                                    return (
                                        <motion.button
                                            key={f.id}
                                            type="button"
                                            suppressHydrationWarning
                                            onClick={() => setFontFamily(f.id)}
                                            whileTap={{ scale: 0.95 }}
                                            className="relative z-10 flex flex-col items-center gap-0.5 rounded-[10px] py-2 transition-colors duration-200"
                                        >
                                            <span
                                                className={cn(
                                                    "text-[17px] transition-colors duration-200",
                                                    selected ? "text-primary" : "text-foreground/50"
                                                )}
                                                style={{ fontFamily: f.family }}
                                            >
                                                Aa
                                            </span>
                                            <span className={cn(
                                                "text-[10px] font-medium transition-colors duration-200",
                                                selected ? "text-primary/80" : "text-muted-foreground/50"
                                            )}>
                                                {f.label}
                                            </span>
                                        </motion.button>
                                    )
                                })}
                            </div>

                            {/* Font Size */}
                            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] dark:bg-white/[0.02] px-1.5 py-1.5">
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:text-foreground hover:bg-white/[0.06]"
                                >
                                    <span className="text-sm font-medium leading-none">A</span>
                                </motion.button>
                                <div className="flex items-center gap-2 px-2">
                                    <span className="text-[10px] text-muted-foreground/30 select-none">small</span>
                                    <div className="flex items-center gap-[3px]">
                                        {[12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32].map((size) => {
                                            const active = (isLoaded ? fontSize : 18) === size
                                            return (
                                                <motion.button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => setFontSize(size)}
                                                    className="relative flex items-end justify-center w-[10px]"
                                                    whileTap={{ scale: 0.8 }}
                                                >
                                                    <motion.div
                                                        className={cn(
                                                            "w-[3px] rounded-full transition-colors duration-200",
                                                            active ? "bg-primary" : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                                                        )}
                                                        animate={{ height: active ? 14 : 4 + ((size - 12) / 20) * 10 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    />
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/30 select-none">large</span>
                                </div>
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:text-foreground hover:bg-white/[0.06]"
                                >
                                    <span className="text-base font-medium leading-none">A</span>
                                </motion.button>
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-wrap gap-1.5">
                                <ToggleChip
                                    active={!isLoaded || showVerseNumbers}
                                    onClick={() => setShowVerseNumbers(!showVerseNumbers)}
                                    icon={<Hash className="h-3 w-3" />}
                                    label="Numbers"
                                />
                                <ToggleChip
                                    active={!isLoaded || redLetters}
                                    onClick={() => setRedLetters(!redLetters)}
                                    icon={<Palette className="h-3 w-3" />}
                                    label="Red Letters"
                                    activeColor="text-red-500 bg-red-500/10 ring-red-500/20"
                                />
                                {hasSectionTitles && (
                                    <ToggleChip
                                        active={isLoaded && showTitles}
                                        onClick={() => setShowTitles(!showTitles)}
                                        icon={<Heading className="h-3 w-3" />}
                                        label="Titles"
                                    />
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

function ToggleChip({
    active,
    onClick,
    icon,
    label,
    activeColor,
}: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
    activeColor?: string
}) {
    return (
        <motion.button
            type="button"
            suppressHydrationWarning
            onClick={onClick}
            whileTap={{ scale: 0.94 }}
            className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-200 ring-1 ring-transparent",
                active
                    ? activeColor || "text-primary bg-primary/[0.08] ring-primary/20 dark:bg-primary/[0.15]"
                    : "text-muted-foreground bg-transparent hover:bg-muted/40"
            )}
        >
            {icon}
            {label}
        </motion.button>
    )
}
