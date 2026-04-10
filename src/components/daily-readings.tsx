"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { hapticLight } from "@/lib/haptics"
import { cn } from "@/lib/utils"
import type { DailyReadingsData } from "@/lib/daily-readings"
import { BookOpen, ExternalLink, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { ReadingContent } from "@/components/reading/reading-content"
import { getChapter, BibleChapter } from "@/lib/bible-api"
import { parseReadingReference } from "@/lib/reading-reference-parser"

interface DailyReadingsProps {
    data: DailyReadingsData
}

export function DailyReadings({ data }: DailyReadingsProps) {
    const { bibleVersion } = useReadingPreferences()

    const sections = [
        { id: "reading1", label: "Reading I",  data: data.readings.reading1 },
        { id: "psalm",    label: "Psalm",       data: data.readings.psalm    },
        { id: "reading2", label: "Reading II",  data: data.readings.reading2 },
        { id: "gospel",   label: "Gospel",      data: data.readings.gospel   },
    ].filter(s => s.data)

    const [currentIndex, setCurrentIndex] = useState(0)
    const activeSection = sections[currentIndex]

    const [chapterCache, setChapterCache] = useState<Record<string, BibleChapter>>({})
    const [loading, setLoading] = useState(false)
    const [fetchError, setFetchError] = useState(false)
    const [retryKey, setRetryKey] = useState(0)

    const today = new Date()
    const dateNum = parseInt(today.toISOString().slice(0, 10).replace(/-/g, ""))

    const getCacheKey = useCallback(
        (sectionId: string) => `${sectionId}:${bibleVersion}`,
        [bibleVersion]
    )

    useEffect(() => {
        if (!activeSection?.data?.reference) return
        const cacheKey = getCacheKey(activeSection.id)
        if (chapterCache[cacheKey]) return

        const parsed = parseReadingReference(activeSection.data.reference)
        if (!parsed) { setFetchError(true); return }

        const controller = new AbortController()
        setLoading(true)
        setFetchError(false)

        getChapter(parsed.book, parsed.chapter, bibleVersion, controller.signal)
            .then(fullChapter => {
                if (controller.signal.aborted) return
                const filteredVerses = fullChapter.verses.filter(v => parsed.verses.includes(v.verse))
                setChapterCache(prev => ({
                    ...prev,
                    [cacheKey]: {
                        ...fullChapter,
                        reference: activeSection.data!.reference,
                        verses: filteredVerses.length > 0 ? filteredVerses : fullChapter.verses,
                        text: filteredVerses.map(v => v.text).join(" "),
                    },
                }))
                setLoading(false)
            })
            .catch(() => {
                if (controller.signal.aborted) return
                setLoading(false)
                setFetchError(true)
            })

        return () => controller.abort()
    }, [activeSection, bibleVersion, chapterCache, getCacheKey, retryKey])

    const cacheKey = activeSection ? getCacheKey(activeSection.id) : ""
    const cachedChapter = chapterCache[cacheKey]

    const fallbackChapter: BibleChapter | null = activeSection?.data
        ? {
              reference: activeSection.data.reference,
              translation_id: "usccb",
              translation_name: "USCCB",
              translation_note: "Readings via USCCB",
              text: activeSection.data.text,
              verses: activeSection.data.text
                  .split("\n")
                  .filter(p => p.trim())
                  .map((para, i) => ({
                      book_id: "DAILY",
                      book_name: "DailyReadings",
                      chapter: dateNum,
                      verse: i + 1,
                      text: para,
                  })),
          }
        : null

    const activeChapter = cachedChapter || (!loading ? fallbackChapter : null)
    const parsed = activeSection?.data?.reference
        ? parseReadingReference(activeSection.data.reference)
        : null
    const bookName = parsed?.book || "DailyReadings"
    const chapterNum = parsed?.chapter || dateNum

    return (
        <div className="w-full flex flex-col gap-3">

            {/* ── Segmented Tab Control ── */}
            <div className="relative flex rounded-2xl border border-white/[0.12] dark:border-white/[0.06] glass-subtle p-1 shadow-[var(--shadow-sm)]">
                {/* Spring sliding indicator */}
                <motion.div
                    className="absolute top-1 bottom-1 rounded-xl bg-foreground/[0.07] dark:bg-white/[0.07] pointer-events-none"
                    animate={{
                        width: `calc(${100 / sections.length}% - 4px)`,
                        left: `calc(${currentIndex * (100 / sections.length)}% + 2px)`,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.5 }}
                />
                {sections.map((section, i) => (
                    <button
                        key={section.id}
                        type="button"
                        onClick={() => { hapticLight(); setCurrentIndex(i) }}
                        className={cn(
                            "relative z-10 flex-1 py-2 text-[12px] font-medium rounded-xl transition-colors duration-200 select-none [touch-action:manipulation]",
                            i === currentIndex
                                ? "text-foreground"
                                : "text-muted-foreground/40 hover:text-muted-foreground/70"
                        )}
                    >
                        {section.label}
                    </button>
                ))}
            </div>

            {/* ── Content Card ── */}
            <div className="rounded-2xl border border-white/[0.12] dark:border-white/[0.06] glass-subtle shadow-[var(--shadow-card)] overflow-hidden min-h-[280px] flex flex-col">

                {/* Loading */}
                {loading && !activeChapter && (
                    <div className="flex-1 flex items-center justify-center min-h-[240px]">
                        <div className="flex items-center gap-1.5">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-foreground/25"
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

                {/* Error */}
                {fetchError && !activeChapter && !loading && (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[240px] gap-3">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground/30" />
                        <span className="text-[12px] text-muted-foreground/40">Failed to load reading</span>
                        <button
                            type="button"
                            onClick={() => setRetryKey(k => k + 1)}
                            className="text-[12px] text-primary/60 hover:text-primary transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeChapter && activeSection && (
                        <motion.div
                            key={`${activeSection.id}-${retryKey}`}
                            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                            className="flex flex-col px-6 pt-7 pb-6"
                        >
                            <ReadingContent
                                mode="minimal"
                                chapter={activeChapter}
                                bookName={bookName}
                                chapterNum={chapterNum}
                                disableHighlighting={!cachedChapter}
                            />

                            {/* Reference link */}
                            {activeSection.data?.reference && parsed && (
                                <div className="flex justify-center mt-8 pt-5 border-t border-foreground/[0.06]">
                                    <Link
                                        href={`/read/${encodeURIComponent(parsed.book)}/${parsed.chapter}?translation=${bibleVersion}`}
                                        className="group/ref flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/35 hover:text-muted-foreground/70 transition-colors"
                                    >
                                        <BookOpen className="h-3 w-3" />
                                        <span>{activeSection.data.reference}</span>
                                        <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/ref:opacity-60 transition-opacity" />
                                        {cachedChapter && (
                                            <span className="text-muted-foreground/25 ml-0.5">
                                                · {cachedChapter.translation_name}
                                            </span>
                                        )}
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
