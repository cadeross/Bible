"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { DailyReadingsData } from "@/lib/daily-readings"
import { BookOpen, ChevronRight, Check, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { ReadingContent } from "@/components/reading/reading-content"
import { Button } from "@/components/ui/button"
import { getChapter, BibleChapter } from "@/lib/bible-api"
import { parseReadingReference } from "@/lib/reading-reference-parser"

interface DailyReadingsProps {
    data: DailyReadingsData
}

export function DailyReadings({ data }: DailyReadingsProps) {
    const { bibleVersion } = useReadingPreferences()

    const sections = [
        { id: "reading1", label: "Reading I", data: data.readings.reading1 },
        { id: "psalm", label: "Psalm", data: data.readings.psalm },
        { id: "reading2", label: "Reading II", data: data.readings.reading2 },
        { id: "gospel", label: "Gospel", data: data.readings.gospel },
    ].filter(s => s.data);

    const [currentIndex, setCurrentIndex] = useState(0)
    const activeSection = sections[currentIndex]

    // Cache fetched chapters per section + version
    const [chapterCache, setChapterCache] = useState<Record<string, BibleChapter>>({})
    const [loading, setLoading] = useState(false)
    const [fetchError, setFetchError] = useState(false)

    const handleNext = () => {
        if (currentIndex < sections.length - 1) {
            setCurrentIndex(prev => prev + 1)
        }
    }

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }

    const today = new Date();
    const dateNum = parseInt(today.toISOString().slice(0, 10).replace(/-/g, ''));

    // Build a cache key for a section + version
    const getCacheKey = useCallback((sectionId: string) => {
        return `${sectionId}:${bibleVersion}`
    }, [bibleVersion])

    // Fetch chapter data for the current section
    useEffect(() => {
        if (!activeSection?.data?.reference) return;

        const cacheKey = getCacheKey(activeSection.id)
        if (chapterCache[cacheKey]) return;

        const parsed = parseReadingReference(activeSection.data.reference)
        if (!parsed) {
            console.warn(`Could not parse reference: ${activeSection.data.reference}`)
            setFetchError(true)
            return;
        }

        let cancelled = false;
        setLoading(true)
        setFetchError(false)

        getChapter(parsed.book, parsed.chapter, bibleVersion)
            .then(fullChapter => {
                if (cancelled) return;

                const filteredVerses = fullChapter.verses.filter(v =>
                    parsed.verses.includes(v.verse)
                )

                const chapter: BibleChapter = {
                    ...fullChapter,
                    reference: activeSection.data!.reference,
                    verses: filteredVerses.length > 0 ? filteredVerses : fullChapter.verses,
                    text: filteredVerses.map(v => v.text).join(' ')
                }

                setChapterCache(prev => ({
                    ...prev,
                    [cacheKey]: chapter
                }))
                setLoading(false)
            })
            .catch(err => {
                if (cancelled) return;
                console.error(`Failed to fetch chapter for ${activeSection.data!.reference}:`, err)
                setLoading(false)
                setFetchError(true)
            })

        return () => { cancelled = true }
    }, [activeSection, bibleVersion, chapterCache, getCacheKey])

    // Get the chapter data for the current section (cached or fallback)
    const cacheKey = activeSection ? getCacheKey(activeSection.id) : ''
    const cachedChapter = chapterCache[cacheKey]

    // Fallback: raw USCCB text
    const fallbackChapter: BibleChapter | null = activeSection?.data ? {
        reference: activeSection.data.reference,
        translation_id: 'usccb',
        translation_name: 'USCCB',
        translation_note: 'Readings via USCCB',
        text: activeSection.data.text,
        verses: activeSection.data.text.split('\n').filter(p => p.trim()).map((para, index) => ({
            book_id: 'DAILY',
            book_name: 'DailyReadings',
            chapter: dateNum,
            verse: index + 1,
            text: para
        }))
    } : null;

    const activeChapter = cachedChapter || (!loading ? fallbackChapter : null)

    const parsed = activeSection?.data?.reference
        ? parseReadingReference(activeSection.data.reference)
        : null
    const bookName = parsed?.book || 'DailyReadings'
    const chapterNum = parsed?.chapter || dateNum

    const isLast = currentIndex === sections.length - 1
    const isFirst = currentIndex === 0

    return (
        <div className="space-y-4">
            {/* Header Row: Title + Progress Dots */}
            <div className="flex items-center justify-between">
                <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    Daily Readings
                </h2>

                {/* Progress Dots */}
                <div className="flex items-center gap-1.5">
                    {sections.map((section, idx) => {
                        const isActive = idx === currentIndex;
                        const isPast = idx < currentIndex;

                        return (
                            <button
                                key={section.id}
                                onClick={() => setCurrentIndex(idx)}
                                className="group relative outline-none focus-visible:ring-0"
                                aria-label={section.label}
                            >
                                <div
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-400 ease-in-out",
                                        isActive
                                            ? "w-6 bg-primary"
                                            : isPast
                                                ? "w-1.5 bg-primary/40"
                                                : "w-1.5 bg-border/60 group-hover:bg-primary/20"
                                    )}
                                />

                                {/* Tooltip */}
                                <div className={cn(
                                    "absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-popover border border-border text-[10px] font-mono whitespace-nowrap opacity-0 transition-opacity duration-200 pointer-events-none z-50 shadow-sm",
                                    "group-hover:opacity-100"
                                )}>
                                    {section.label}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Content with static border */}
            <div className="pl-4 border-l border-border/40">
                {/* Loading State */}
                {loading && !activeChapter && (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {activeChapter && activeSection && (
                        <motion.div
                            key={activeSection.id}
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="space-y-8"
                        >
                            <div className="min-h-[200px]">
                                <ReadingContent
                                    mode="minimal"
                                    chapter={activeChapter}
                                    bookName={bookName}
                                    chapterNum={chapterNum}
                                />
                            </div>

                            {/* Footer Controls */}
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-border/40 pt-6">

                                {/* Back Button (Left) */}
                                <div className="justify-self-start">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleBack}
                                        disabled={isFirst}
                                        className={cn(
                                            "gap-2 font-mono text-xs uppercase tracking-wider pl-2 pr-4 transition-all h-8",
                                            isFirst ? "opacity-0 pointer-events-none" : "hover:bg-transparent hover:text-primary hover:-translate-x-1"
                                        )}
                                    >
                                        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                                        Back
                                    </Button>
                                </div>

                                {/* Reference (Center) - links to Read page */}
                                <div className="justify-self-center text-center">
                                    {activeSection.data?.reference && parsed && (
                                        <Link
                                            href={`/read/${encodeURIComponent(parsed.book)}/${parsed.chapter}`}
                                            className="group/ref flex flex-col items-center gap-0.5 hover:opacity-100 transition-opacity"
                                        >
                                            <div className="flex items-center gap-1.5 text-xs font-mono text-primary/80 group-hover/ref:text-primary transition-colors">
                                                <BookOpen className="h-3 w-3 opacity-70" />
                                                <span>{activeSection.data.reference}</span>
                                                <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/ref:opacity-60 transition-opacity" />
                                            </div>
                                            {cachedChapter && (
                                                <span className="text-[9px] font-mono text-muted-foreground/40 uppercase">
                                                    {cachedChapter.translation_name}
                                                </span>
                                            )}
                                        </Link>
                                    )}
                                </div>

                                {/* Next Button (Right) */}
                                <div className="justify-self-end">
                                    <Button
                                        onClick={handleNext}
                                        disabled={isLast}
                                        variant={isLast ? "outline" : "default"}
                                        size="sm"
                                        className={cn(
                                            "gap-2 font-mono text-xs uppercase tracking-wider pl-4 pr-3 transition-all h-8",
                                            isLast ? "opacity-50 cursor-not-allowed" : "hover:pl-5 shadow-sm"
                                        )}
                                    >
                                        {isLast ? (
                                            <>
                                                Finished <Check className="h-3.5 w-3.5" />
                                            </>
                                        ) : (
                                            <>
                                                Next <ChevronRight className="h-3.5 w-3.5" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
