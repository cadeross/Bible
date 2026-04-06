"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { DailyReadingsData } from "@/lib/daily-readings"
import { BookOpen, ChevronRight, Check, ExternalLink, AlertTriangle } from "lucide-react"
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
    const [retryKey, setRetryKey] = useState(0)

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

        const controller = new AbortController()
        const signal = controller.signal

        setLoading(true)
        setFetchError(false)

        getChapter(parsed.book, parsed.chapter, bibleVersion, signal)
            .then(fullChapter => {
                if (signal.aborted) return

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
                if (signal.aborted) return
                console.warn(`Failed to fetch chapter for ${activeSection.data!.reference}:`, err)
                setLoading(false)
                setFetchError(true)
            })

        return () => {
            controller.abort()
        }
    }, [activeSection, bibleVersion, chapterCache, getCacheKey, retryKey])

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
        <div className="w-full max-w-[720px] mx-auto space-y-2">
            {/* Header Row: Centered Progress & Title + Navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-border/5">
                {/* Back Button */}
                <div className="w-24 flex justify-start">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        disabled={isFirst}
                        className={cn(
                            "gap-2 font-mono text-xs uppercase tracking-widest px-3 transition-all h-8 rounded-md text-muted-foreground/80",
                            isFirst ? "opacity-0 pointer-events-none" : "hover:text-foreground hover:bg-secondary/40 hover:-translate-x-0.5"
                        )}
                    >
                        <ChevronRight className="h-3 w-3 rotate-180" />
                        Back
                    </Button>
                </div>

                <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] font-mono uppercase tracking-[0.3em] select-none">
                        <span>Daily</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-border/40" />
                        <span className="text-muted-foreground/80 font-medium">{activeSection?.label || "Reading"}</span>
                    </div>

                    {/* Progress Indicator - Subtle */}
                    <div className="flex items-center gap-2 px-2">
                        {sections.map((section, idx) => {
                            const isActive = idx === currentIndex;
                            const isPast = idx < currentIndex;

                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setCurrentIndex(idx)}
                                    className="group relative outline-none focus-visible:ring-0 flex items-center justify-center h-4 px-0.5"
                                    aria-label={section.label}
                                >
                                    <div
                                        className={cn(
                                            "h-1 rounded-full transition-all duration-500 ease-out",
                                            isActive
                                                ? "w-4 bg-foreground/60"
                                                : isPast
                                                    ? "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                                                    : "w-1.5 bg-border/30 hover:bg-border/60"
                                        )}
                                    />

                                    {/* Tooltip */}
                                    <div className={cn(
                                        "absolute top-full mt-3 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-popover border border-border text-popover-foreground text-[10px] font-mono whitespace-nowrap opacity-0 transition-all duration-200 pointer-events-none z-50 shadow-[0_6px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.5)] translate-y-1 group-hover:translate-y-0",
                                        "group-hover:opacity-100"
                                    )}>
                                        {section.label}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Next Button */}
                <div className="w-24 flex justify-end">
                    <Button
                        onClick={handleNext}
                        disabled={isLast}
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "gap-2 font-mono text-xs uppercase tracking-widest px-3 transition-all h-8 rounded-md text-muted-foreground/80",
                            isLast
                                ? "opacity-0 pointer-events-none"
                                : "hover:text-foreground hover:bg-secondary/40 hover:translate-x-0.5"
                        )}
                    >
                        {isLast ? (
                            <>
                                Done <Check className="h-3 w-3" />
                            </>
                        ) : (
                            <>
                                Next <ChevronRight className="h-3 w-3" />
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="w-full">
                {/* Loading State */}
                {loading && !activeChapter && (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <div className="flex items-center gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-foreground/30"
                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: i * 0.2,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {fetchError && !activeChapter && !loading && (
                    <div className="flex flex-col items-center justify-center min-h-[200px] gap-2 text-muted-foreground/60">
                        <AlertTriangle className="h-5 w-5 opacity-50" />
                        <span className="text-xs">Failed to load reading</span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setRetryKey(k => k + 1)}
                            >
                                Retry
                            </Button>
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {activeChapter && activeSection && (
                        <motion.div
                            key={activeSection.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="space-y-8"
                        >
                            <div className="min-h-[200px]">
                                <ReadingContent
                                    mode="minimal"
                                    chapter={activeChapter}
                                    bookName={bookName}
                                    chapterNum={chapterNum}
                                    disableHighlighting={!cachedChapter}
                                />
                            </div>

                            {/* Reference Center */}
                            <div className="flex justify-center pt-6 border-t border-border/10">
                                {activeSection.data?.reference && parsed && (
                                    <Link
                                        href={`/read/${encodeURIComponent(parsed.book)}/${parsed.chapter}?translation=${bibleVersion}`}
                                        className="group/ref flex flex-col items-center gap-0.5 hover:opacity-100 transition-opacity"
                                    >
                                        <div className="flex items-center gap-1.5 text-xs font-mono text-foreground/50 group-hover/ref:text-foreground transition-colors">
                                            <BookOpen className="h-3 w-3 opacity-70" />
                                            <span>{activeSection.data.reference}</span>
                                            <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/ref:opacity-60 transition-opacity" />
                                        </div>
                                        {cachedChapter && (
                                            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase">
                                                {cachedChapter.translation_name}
                                            </span>
                                        )}
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
