"use client"

import * as React from "react"
import { useReadingPreferences, FontType } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { BOOK_LIST, TRANSLATIONS } from "@/lib/bible-api"
import { BIBLE_BOOKS } from "@/lib/bible-data"
import { Book, Languages, Type, Hash, Palette } from "lucide-react"
import { QuickSelector } from "./quick-selector"

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

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleChapterChange((Math.max(1, currentChapter - 1)).toString())}
                        disabled={currentChapter <= 1}
                        className="text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed px-1"
                    >
                        -
                    </button>

                    <span className="text-xs font-medium text-muted-foreground min-w-[2ch] text-center">
                        {currentChapter}
                    </span>

                    <button
                        onClick={() => handleChapterChange((Math.min(chapterCount, currentChapter + 1)).toString())}
                        disabled={currentChapter >= chapterCount}
                        className="text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed px-1"
                    >
                        +
                    </button>
                </div>

                <div className="h-4 w-[1px] bg-border/50" />

                <QuickSelector
                    value={currentTranslation}
                    items={availableTranslations}
                    onSelect={handleTranslationChange}
                    icon={<Languages className="h-3 w-3" />}
                    placeholder="Ver"
                    displayFormat="id"
                    popoverWidth="w-[160px]"
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
