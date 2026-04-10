"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { BibleChapter, getChapter } from "@/lib/bible-api"
import { ReadingContent } from "./reading-content"
import { ReadingToolbar } from "./reading-toolbar"
import { ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { useFocusMode } from "@/contexts/focus-mode"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
    canGoNextChapter,
    canGoPrevChapter,
    getAdjacentChapter,
} from "@/lib/chapter-navigation"
import { hapticMedium, hapticSuccess } from "@/lib/haptics"

interface ReadingViewProps {
    chapter: BibleChapter
    book: string
    chapterNum: number
    translation?: string
    sharedVerses?: number[]
    isExplicitTranslation?: boolean
}

export function ReadingView({ chapter: initialChapter, book: initialBook, chapterNum: initialChapterNum, translation: initialTranslation = "dra", sharedVerses = [], isExplicitTranslation = false }: ReadingViewProps) {
    const { isFocusMode, toggleFocusMode } = useFocusMode()
    const reduceMotion = useReducedMotion()
    const { bibleVersion, isLoaded } = useReadingPreferences()

    const [currentBook, setCurrentBook] = useState(initialBook)
    const [currentChapterNum, setCurrentChapterNum] = useState(initialChapterNum)
    const [currentTranslation, setCurrentTranslation] = useState(initialTranslation)
    const [chapter, setChapter] = useState(initialChapter)
    const [isNavigating, setIsNavigating] = useState(false)

    const hasRedirected = useRef(false)
    const navDirection = useRef(0)
    const contentKey = `${currentBook}-${currentChapterNum}-${currentTranslation}`
    const swipeStartRef = useRef<{ x: number; y: number; t: number } | null>(null)
    const SWIPE_MIN_X = 55

    const hasSectionTitles = chapter.verses.some(v => v.heading)
    const prevOk = canGoPrevChapter(currentBook, currentChapterNum)
    const nextOk = canGoNextChapter(currentBook, currentChapterNum)
    const prevChapter = React.useMemo(() => getAdjacentChapter(currentBook, currentChapterNum, -1), [currentBook, currentChapterNum])
    const nextChapter = React.useMemo(() => getAdjacentChapter(currentBook, currentChapterNum, 1), [currentBook, currentChapterNum])

    const navigateTo = useCallback(async (nextBook: string, nextChapter: number, nextTranslation?: string) => {
        const trans = nextTranslation || currentTranslation
        setIsNavigating(true)

        const url = `/read/${encodeURIComponent(nextBook)}/${nextChapter}?translation=${trans}`
        window.history.pushState(null, "", url)

        try {
            const data = await getChapter(nextBook, nextChapter, trans)
            setCurrentBook(nextBook)
            setCurrentChapterNum(nextChapter)
            setCurrentTranslation(trans)
            setChapter(data)
            window.scrollTo({ top: 0, behavior: "smooth" })
        } catch (err) {
            console.error("Failed to load chapter:", err)
        } finally {
            setIsNavigating(false)
        }
    }, [currentTranslation])

    const handleNext = useCallback(() => {
        const next = getAdjacentChapter(currentBook, currentChapterNum, 1)
        if (!next) return
        navDirection.current = 1
        navigateTo(next.book, next.chapter)
    }, [currentBook, currentChapterNum, navigateTo])

    const handlePrev = useCallback(() => {
        const prev = getAdjacentChapter(currentBook, currentChapterNum, -1)
        if (!prev) return
        navDirection.current = -1
        navigateTo(prev.book, prev.chapter)
    }, [currentBook, currentChapterNum, navigateTo])

    useEffect(() => {
        if (!isLoaded) return
        if (!isExplicitTranslation && bibleVersion && bibleVersion !== currentTranslation && !hasRedirected.current) {
            hasRedirected.current = true
            navigateTo(currentBook, currentChapterNum, bibleVersion)
        }
    }, [isExplicitTranslation, isLoaded, bibleVersion, currentTranslation, currentBook, currentChapterNum, navigateTo])

    useEffect(() => {
        const onPopState = () => {
            const match = window.location.pathname.match(/^\/read\/([^/]+)\/(\d+)/)
            if (match) {
                const b = decodeURIComponent(match[1])
                const c = parseInt(match[2], 10)
                const params = new URLSearchParams(window.location.search)
                const t = params.get("translation") || currentTranslation
                navigateTo(b, c, t)
            }
        }
        window.addEventListener("popstate", onPopState)
        return () => window.removeEventListener("popstate", onPopState)
    }, [currentTranslation, navigateTo])

    const handleSwipeTouchStart = useCallback((e: React.TouchEvent) => {
        swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
    }, [])

    const handleSwipeTouchEnd = useCallback((e: React.TouchEvent) => {
        const start = swipeStartRef.current
        if (!start) return
        swipeStartRef.current = null
        const dx = e.changedTouches[0].clientX - start.x
        const dy = e.changedTouches[0].clientY - start.y
        const elapsed = Date.now() - start.t
        // Ignore if too short, too vertical, or held too long (long-press, not a swipe)
        if (Math.abs(dx) < SWIPE_MIN_X || Math.abs(dx) < Math.abs(dy) * 1.4 || elapsed > 450) return
        if (dx < 0 && nextOk) { hapticMedium(); handleNext() }
        else if (dx > 0 && prevOk) { hapticMedium(); handlePrev() }
    }, [handleNext, handlePrev, nextOk, prevOk])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement | null
            if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return
            if (e.key === "ArrowRight") { e.preventDefault(); handleNext() }
            if (e.key === "ArrowLeft") { e.preventDefault(); handlePrev() }
            if (e.altKey && e.code === "KeyF") { e.preventDefault(); toggleFocusMode() }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleNext, handlePrev, toggleFocusMode])

    const slideVariants = {
        enter: () => reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" },
        center: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: () => reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(4px)" },
    }

    const contentTransition = reduceMotion
        ? { duration: 0.15 }
        : { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const }

    return (
        <div
            className="min-h-screen bg-background flex flex-col items-center py-8"
            style={{ touchAction: "pan-y", overscrollBehaviorX: "none" } as React.CSSProperties}
            onTouchStart={handleSwipeTouchStart}
            onTouchEnd={handleSwipeTouchEnd}
        >

            <motion.div
                data-reading-chrome
                animate={isFocusMode ? { opacity: 0.08, y: 0 } : { opacity: 1, y: 0 }}
                whileHover={isFocusMode ? { opacity: 1 } : undefined}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                <ReadingToolbar
                    currentBook={currentBook}
                    currentChapter={currentChapterNum}
                    currentTranslation={currentTranslation}
                    hasSectionTitles={hasSectionTitles}
                    onNavigate={navigateTo}
                />
            </motion.div>

            {!isFocusMode && (
                <>
                    <div className="fixed top-[calc(3.5rem+var(--maintenance-banner-height,0px))] left-0 right-0 h-16 bg-gradient-to-b from-background/75 to-transparent z-30 pointer-events-none hidden max-[1500px]:block" />
                    <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-30 pointer-events-none hidden max-[1500px]:block" />
                </>
            )}

            <main className="flex-1 w-full max-w-4xl relative flex items-start justify-center">

                {/* Side chevrons temporarily removed */}

                <AnimatePresence mode="wait" custom={navDirection.current}>
                    <motion.div
                        key={contentKey}
                        custom={navDirection.current}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={contentTransition}
                        className="w-full"
                    >
                        <ReadingContent chapter={chapter} bookName={currentBook} chapterNum={currentChapterNum} sharedVerses={sharedVerses} />

                        {/* Bottom chapter navigation */}
                        <motion.div
                            animate={isFocusMode ? { opacity: 0 } : { opacity: 1 }}
                            transition={{ duration: 0.25 }}
                            style={{ pointerEvents: isFocusMode ? "none" : "auto" }}
                            className="w-full max-w-[720px] mx-auto px-6 pt-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-20 flex items-center justify-center gap-3"
                        >
                            {prevOk && prevChapter ? (
                                <motion.button
                                    type="button"
                                    onClick={() => { hapticMedium(); handlePrev() }}
                                    whileTap={{ scale: 0.96 }}
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/20 bg-foreground/[0.03] hover:bg-foreground/[0.06] hover:border-border/40 transition-colors duration-200 cursor-pointer"
                                >
                                    <ChevronLeft className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                                    <span className="text-[12px] font-medium text-muted-foreground/55 truncate">{prevChapter.book} {prevChapter.chapter}</span>
                                </motion.button>
                            ) : null}

                            {nextOk && nextChapter ? (
                                <motion.button
                                    type="button"
                                    onClick={() => { hapticMedium(); handleNext() }}
                                    whileTap={{ scale: 0.96 }}
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/20 bg-foreground/[0.03] hover:bg-foreground/[0.06] hover:border-border/40 transition-colors duration-200 cursor-pointer"
                                >
                                    <span className="text-[12px] font-medium text-muted-foreground/55 truncate">{nextChapter.book} {nextChapter.chapter}</span>
                                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                                </motion.button>
                            ) : null}
                        </motion.div>
                    </motion.div>
                </AnimatePresence>

                {/* Side chevrons temporarily removed */}
            </main>

            <motion.button
                type="button"
                onClick={() => { hapticSuccess(); toggleFocusMode() }}
                aria-label={isFocusMode ? "Exit focus mode" : "Enter focus mode"}
                animate={isFocusMode ? { opacity: 1 } : { opacity: 0, pointerEvents: "none" }}
                transition={{ duration: 0.3 }}
                style={{ pointerEvents: isFocusMode ? "auto" : "none" }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                className="fixed right-5 z-50 flex h-9 w-9 items-center justify-center rounded-2xl glass-subtle border border-foreground/[0.10] dark:border-white/[0.08] text-muted-foreground/60 shadow-[var(--shadow-card)] hover:text-foreground hover:shadow-[var(--shadow-elevated)] transition-colors duration-200 top-[calc(4.5rem+var(--maintenance-banner-height,0px))] md:top-[calc(5.5rem+var(--maintenance-banner-height,0px))]"
            >
                <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            </motion.button>
        </div>
    )
}
