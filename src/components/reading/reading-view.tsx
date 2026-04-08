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

    const hasSectionTitles = chapter.verses.some(v => v.heading)
    const prevOk = canGoPrevChapter(currentBook, currentChapterNum)
    const nextOk = canGoNextChapter(currentBook, currentChapterNum)

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
        <div className="min-h-screen bg-background flex flex-col items-center py-8">

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
                    <div className="fixed top-[calc(3.5rem+var(--maintenance-banner-height,0px))] left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-30 pointer-events-none hidden max-[1500px]:block" />
                    <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-30 pointer-events-none hidden max-[1500px]:block" />
                </>
            )}

            <main className="flex-1 w-full max-w-4xl relative flex items-start justify-center">

                <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-2 opacity-15 hover:opacity-80 transition-opacity duration-300">
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={!prevOk}
                        aria-label="Previous chapter"
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-muted-foreground hover:text-primary hover:bg-accent/50 transition-all duration-200 disabled:pointer-events-none disabled:opacity-0 cursor-pointer"
                    >
                        <ChevronLeft className="h-8 w-8" strokeWidth={1.5} />
                    </button>
                </div>

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
                    </motion.div>
                </AnimatePresence>

                <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-2 opacity-15 hover:opacity-80 transition-opacity duration-300">
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!nextOk}
                        aria-label="Next chapter"
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-muted-foreground hover:text-primary hover:bg-accent/50 transition-all duration-200 disabled:pointer-events-none disabled:opacity-0 cursor-pointer"
                    >
                        <ChevronRight className="h-8 w-8" strokeWidth={1.5} />
                    </button>
                </div>
            </main>

            {isFocusMode && (
                <button
                    type="button"
                    onClick={toggleFocusMode}
                    aria-label="Show reading controls"
                    className="fixed right-4 z-50 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.12] dark:border-white/[0.06] glass-subtle text-muted-foreground shadow-[var(--shadow-card)] transition-all duration-200 hover:text-foreground hover:shadow-[var(--shadow-elevated)] top-[calc(5rem+var(--maintenance-banner-height))] md:top-[calc(6rem+var(--maintenance-banner-height))]"
                >
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                </button>
            )}
        </div>
    )
}
