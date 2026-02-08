"use client"

import * as React from "react"
import { useReadingPreferences, FontType } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { BOOK_LIST, TRANSLATIONS } from "@/lib/bible-api"
import { BIBLE_BOOKS } from "@/lib/bible-data"
import { Book, Languages, Type, Hash, Palette, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { QuickSelector } from "./quick-selector"


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
                className="w-[20px] text-xs font-medium text-center bg-transparent border-none outline-none text-foreground p-0 m-0"
            />
        )
    }

    return (
        <span
            onClick={() => setIsEditing(true)}
            className="w-[20px] inline-block text-xs font-medium text-muted-foreground text-center cursor-pointer hover:text-foreground transition-colors"
        >
            {currentChapter}
        </span>
    )
}

interface ReadingToolbarProps {
    currentBook?: string
    currentChapter?: number
    currentTranslation?: string
}

export function ReadingToolbar({ currentBook = "Genesis", currentChapter = 1, currentTranslation = "dra" }: ReadingToolbarProps) {
    const router = useRouter()
    // ... prefs ...
    const {
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        showVerseNumbers,
        setShowVerseNumbers,
        redLetters,
        setRedLetters,
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

    // ... FontButton helper ...
    const FontButton = ({ font, label }: { font: FontType; label: string }) => (
        <button
            onClick={() => setFontFamily(font)}
            className={cn(
                "px-3 py-1 text-xs transition-colors hover:text-foreground/80 cursor-pointer",
                fontFamily === font ? "text-primary font-bold" : "text-muted-foreground"
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
                        onClick={() => handleChapterChange((Math.max(1, currentChapter - 1)).toString())}
                        disabled={currentChapter <= 1}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
                    >
                        <ChevronLeft className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </motion.button>

                    <ChapterInput
                        currentChapter={currentChapter}
                        maxChapters={chapterCount}
                        onChange={(val) => handleChapterChange(val.toString())}
                    />

                    <motion.button
                        onClick={() => handleChapterChange((Math.min(chapterCount, currentChapter + 1)).toString())}
                        disabled={currentChapter >= chapterCount}
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
            </div>

            {/* Appearance Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 py-2 px-6 rounded-lg bg-secondary/30 backdrop-blur-sm mx-4">



                {/* Font Family Group */}
                <div className="flex items-center border-r border-border/50 pr-4 gap-1">
                    <Type className="h-3 w-3 text-muted-foreground mr-1" />
                    <FontButton font="sans" label="sans" />
                    <FontButton font="serif" label="serif" />
                    <FontButton font="mono" label="mono" />
                    <FontButton font="pixel" label="round" />
                </div>

                {/* View toggles */}
                <div className="flex items-center gap-4 text-xs">
                    <button
                        onClick={() => setShowVerseNumbers(!showVerseNumbers)}
                        className={cn(
                            "flex items-center gap-1 transition-colors hover:text-foreground cursor-pointer",
                            showVerseNumbers ? "text-primary" : "text-muted-foreground/50"
                        )}
                    >
                        <Hash className="h-3 w-3" />
                        <span>numbers</span>
                    </button>

                    <button
                        onClick={() => setRedLetters(!redLetters)}
                        className={cn(
                            "flex items-center gap-1 transition-colors hover:text-foreground cursor-pointer",
                            redLetters ? "text-red-500" : "text-muted-foreground/50"
                        )}
                    >
                        <Palette className="h-3 w-3" />
                        <span>red letters</span>
                    </button>
                </div>

                {/* Size Slider (simplified as stepped controls for now) */}
                <div className="flex items-center gap-2 pl-4 border-l border-border/50">
                    <button
                        onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                        -
                    </button>
                    <span className="text-xs w-8 text-center text-muted-foreground">{fontSize}px</span>
                    <button
                        onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    )
}
