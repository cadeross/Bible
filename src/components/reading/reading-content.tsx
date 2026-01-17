"use client"

import React from "react"
import { BibleChapter } from "@/lib/bible-api"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { isRedLetterVerse } from "@/lib/red-letter-data"

interface ReadingContentProps {
    chapter: BibleChapter
    bookName: string
    chapterNum: number
    nextChapterLink?: string
}

export function ReadingContent({ chapter, bookName, chapterNum }: ReadingContentProps) {
    const { fontSize, fontFamily, lineHeight, showVerseNumbers, redLetters } = useReadingPreferences()
    const [highlights, setHighlights] = React.useState<number[]>([])

    // Load highlights on mount
    React.useEffect(() => {
        // We'll just load from local storage wrapper for now for speed/simplicity
        // In a real app with SSR, we might want to fetch initially or handle hydration carefully.
        import("@/lib/persistence").then(({ getHighlights }) => {
            getHighlights(bookName, chapterNum).then(data => {
                setHighlights(data.map(h => h.verse))
            })
        })
    }, [bookName, chapterNum])

    const toggleHighlight = async (verseNum: number) => {
        const isHighlighted = highlights.includes(verseNum)
        const newHighlights = isHighlighted
            ? highlights.filter(h => h !== verseNum)
            : [...highlights, verseNum]

        setHighlights(newHighlights)

        // Persist
        const { saveHighlight, removeHighlight } = await import("@/lib/persistence")
        if (isHighlighted) {
            await removeHighlight(bookName, chapterNum, verseNum)
        } else {
            await saveHighlight({
                book: bookName,
                chapter: chapterNum,
                verse: verseNum,
                color: "yellow", // Default for now
                created_at: new Date().toISOString()
            })
        }
    }

    const getFontClass = () => {
        switch (fontFamily) {
            case "sans": return "font-sans"
            case "mono": return "font-mono"
            case "serif":
            default: return "font-serif"
        }
    }

    return (
        <div
            className={cn(
                "max-w-3xl mx-auto px-6 py-8 transition-all duration-300 ease-in-out",
                getFontClass()
            )}
            style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
            }}
        >
            <div className="space-y-4">
                {/* Chapter Header */}
                <div className="text-center mb-12 opacity-50 hover:opacity-100 transition-opacity">
                    <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                        {chapter.reference}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{chapter.translation_name}</p>
                </div>

                {/* Verses */}
                <div className="prose dark:prose-invert max-w-none">
                    {chapter.verses.map((verse, i) => {
                        const isHighlighted = highlights.includes(verse.verse)
                        return (
                            <React.Fragment key={verse.verse}>
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.002, duration: 0.2 }}
                                    className={cn(
                                        "inline cursor-pointer transition-colors duration-200 hover:bg-primary/10 rounded px-[2px] -mx-[2px]",
                                        isHighlighted && "bg-primary/20 text-foreground"
                                    )}
                                    onClick={() => toggleHighlight(verse.verse)}
                                >
                                    {showVerseNumbers && (
                                        <sup className="mr-1 text-[0.6em] text-muted-foreground/50 select-none font-mono">
                                            {verse.verse}
                                        </sup>
                                    )}
                                    <span className={cn(
                                        "transition-colors duration-200",
                                        redLetters && isRedLetterVerse(bookName, chapterNum, verse.verse) && "text-red-700 dark:text-red-400"
                                    )}>
                                        {verse.text}
                                    </span>
                                </motion.span>
                                {" "}
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
