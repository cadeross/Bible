"use client"

import * as React from "react"
import { useReadingPreferences, FontType } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { BOOK_LIST, TRANSLATIONS } from "@/lib/bible-api"
import { BIBLE_BOOKS } from "@/lib/bible-data"
import { Book, Languages, Type, Hash, Palette, ChevronLeft, ChevronRight, Heading, CircleHelp } from "lucide-react"
import { motion } from "framer-motion"
import { QuickSelector } from "./quick-selector"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ReadingTipsDialog } from "./reading-tips-dialog"
import { canGoNextChapter, canGoPrevChapter, getAdjacentChapter } from "@/lib/chapter-navigation"


// Internal component for editable chapter
const ChapterInput = ({ currentChapter, maxChapters, onChange }: { currentChapter: number, maxChapters: number, onChange: (val: number) => void }) => {
    const [isEditing, setIsEditing] = React.useState(false)
    const [value, setValue] = React.useState(currentChapter.toString())
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        setValue(currentChapter.toString())
    }, [currentChapter])

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleSubmit = () => {
        setIsEditing(false)
        const num = parseInt(value, 10)
        if (!isNaN(num) && num >= 1 && num <= maxChapters) {
            if (num !== currentChapter) {
                onChange(num)
            }
        } else {
            setValue(currentChapter.toString()) // Reset on invalid
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit()
            inputRef.current?.blur()
        }
        if (e.key === "Escape") {
            setIsEditing(false)
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
                onKeyDown={handleKeyDown}
                className="min-w-[1.25rem] max-w-[2.5rem] text-xs font-medium text-center bg-transparent border-none outline-none text-foreground p-0 m-0"
            />
        )
    }

    return (
        <span
            onClick={() => setIsEditing(true)}
            className="min-w-[1.25rem] inline-block text-xs font-medium text-muted-foreground text-center cursor-pointer hover:text-foreground transition-colors tabular-nums"
        >
            {currentChapter}
        </span>
    )
}

interface ReadingToolbarProps {
    currentBook?: string
    currentChapter?: number
    currentTranslation?: string
    hasSectionTitles?: boolean
}

export function ReadingToolbar({ currentBook = "Genesis", currentChapter = 1, currentTranslation = "dra", hasSectionTitles = false }: ReadingToolbarProps) {
    const router = useRouter()
    const {
        isLoaded,
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        showVerseNumbers,
        setShowVerseNumbers,
        redLetters,
        setRedLetters,
        showTitles,
        setShowTitles,
        setBibleVersion,
    } = useReadingPreferences()

    const [availableTranslations, setAvailableTranslations] = React.useState(TRANSLATIONS)

    // Calculate max chapters
    const chapterCount = React.useMemo(() => {
        const bookData = BIBLE_BOOKS.find(b => b.name === currentBook);
        return bookData ? bookData.chapters : 150; // default to 150 (Psalms) if not found, safe fallback
    }, [currentBook]);

    React.useEffect(() => {
        import("@/lib/bible-api").then(({ getAllTranslations }) => {
            getAllTranslations().then(setAvailableTranslations)
        })
    }, [])

    const handleBookChange = (book: string) => {
        router.push(`/read/${book}/1?translation=${currentTranslation}`)
    }

    const handleChapterChange = (chapter: string) => {
        router.push(`/read/${currentBook}/${chapter}?translation=${currentTranslation}`)
    }

    const handleTranslationChange = (translationId: string) => {
        // Save preference globally (persists to localStorage)
        setBibleVersion(translationId)

        // Update URL for current view
        const url = new URL(window.location.href)
        url.searchParams.set("translation", translationId)
        router.push(url.pathname + url.search)
    }

    const prevChapterNav = getAdjacentChapter(currentBook, currentChapter, -1)
    const nextChapterNav = getAdjacentChapter(currentBook, currentChapter, 1)
    const toolbarPrevOk = canGoPrevChapter(currentBook, currentChapter)
    const toolbarNextOk = canGoNextChapter(currentBook, currentChapter)

    // ... FontButton helper ...
    const FontButton = ({ font, label }: { font: FontType; label: string }) => (
        <button
            suppressHydrationWarning
            onClick={() => setFontFamily(font)}
            className={cn(
                "px-3 py-1 text-xs transition-colors hover:text-foreground/80 cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                isLoaded && fontFamily === font ? "text-primary font-bold" : "text-muted-foreground"
            )}
        >
            {label}
        </button>
    )

    return (
        <div className="w-full max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-700 space-y-4">

            {/* Navigation Bar (Book & Version) */}
            <div className="flex items-center justify-center gap-4">
                <QuickSelector
                    value={currentBook}
                    items={BOOK_LIST}
                    onSelect={handleBookChange}
                    icon={<Book className="h-3 w-3" />}
                    placeholder="Book"
                    popoverWidth="w-[160px]"
                    className="max-w-[80px]"
                />

                <div className="h-4 w-[1px] bg-border/50" />

                <div className="flex items-center gap-0">
                    <motion.button
                        type="button"
                        onClick={() => {
                            if (!prevChapterNav) return
                            router.push(
                                `/read/${prevChapterNav.book}/${prevChapterNav.chapter}?translation=${currentTranslation}`
                            )
                        }}
                        disabled={!toolbarPrevOk}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
                    >
                        <ChevronLeft className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </motion.button>

                    <div className="flex items-baseline gap-1 tabular-nums">
                        <ChapterInput
                            currentChapter={currentChapter}
                            maxChapters={chapterCount}
                            onChange={(val) => handleChapterChange(val.toString())}
                        />
                        <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
                            /{chapterCount}
                        </span>
                    </div>

                    <motion.button
                        type="button"
                        onClick={() => {
                            if (!nextChapterNav) return
                            router.push(
                                `/read/${nextChapterNav.book}/${nextChapterNav.chapter}?translation=${currentTranslation}`
                            )
                        }}
                        disabled={!toolbarNextOk}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
                    >
                        <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                </div>

                <div className="h-4 w-[1px] bg-border/50" />

                <QuickSelector
                    value={currentTranslation}
                    items={availableTranslations}
                    onSelect={handleTranslationChange}
                    icon={<Languages className="h-3 w-3" />}
                    placeholder="Ver"
                    displayFormat="id"
                    popoverWidth="w-[320px]"
                    className="max-w-[80px]"
                />

                <div className="h-4 w-[1px] bg-border/50" />

                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            aria-label="Appearance and typography"
                            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                        >
                            <Type className="h-3 w-3" />
                            <span className="hidden sm:inline">type</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        align="center"
                        className="w-[min(100vw-2rem,22rem)] p-4"
                    >
                        <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            appearance
                        </p>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-2 border-b border-border/30 pb-3">
                                <span className="w-full text-[10px] font-mono text-muted-foreground">font</span>
                                <FontButton font="sans" label="sans" />
                                <FontButton font="serif" label="serif" />
                                <FontButton font="mono" label="mono" />
                                <FontButton font="pixel" label="round" />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                <button
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => setShowVerseNumbers(!showVerseNumbers)}
                                    className={cn(
                                        "flex items-center gap-1 transition-colors hover:text-foreground cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                                        !isLoaded || showVerseNumbers ? "text-primary" : "text-muted-foreground/60"
                                    )}
                                >
                                    <Hash className="h-3 w-3" />
                                    <span>numbers</span>
                                </button>
                                <button
                                    type="button"
                                    suppressHydrationWarning
                                    onClick={() => setRedLetters(!redLetters)}
                                    className={cn(
                                        "flex items-center gap-1 transition-colors hover:text-foreground cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                                        !isLoaded || redLetters ? "text-red-500" : "text-muted-foreground/60"
                                    )}
                                >
                                    <Palette className="h-3 w-3" />
                                    <span>red letters</span>
                                </button>
                                {hasSectionTitles && (
                                    <button
                                        type="button"
                                        suppressHydrationWarning
                                        onClick={() => setShowTitles(!showTitles)}
                                        className={cn(
                                            "flex items-center gap-1 transition-colors hover:text-foreground cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                                            isLoaded && showTitles ? "text-primary" : "text-muted-foreground/60"
                                        )}
                                    >
                                        <Heading className="h-3 w-3" />
                                        <span>titles</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 border-t border-border/30 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                                    aria-label="Decrease font size"
                                    className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                                >
                                    −
                                </button>
                                <span
                                    suppressHydrationWarning
                                    className="min-w-[2.5rem] text-center text-xs text-muted-foreground tabular-nums"
                                >
                                    {isLoaded ? fontSize : 18}px
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                                    aria-label="Increase font size"
                                    className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <ReadingTipsDialog
                    trigger={
                        <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                            aria-label="Reading tips and shortcuts"
                        >
                            <CircleHelp className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                    }
                />
            </div>
        </div>
    )
}
