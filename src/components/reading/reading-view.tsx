"use client"

import React, { useCallback, useEffect, useRef } from "react"
import { BibleChapter } from "@/lib/bible-api"
import { ReadingContent } from "./reading-content"
import { ReadingToolbar } from "./reading-toolbar"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { useFocusMode } from "@/contexts/focus-mode"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { SPRING_CONFIG } from "@/lib/animation"
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

export function ReadingView({ chapter, book, chapterNum, translation = "dra", sharedVerses = [], isExplicitTranslation = false }: ReadingViewProps) {
    const router = useRouter()
    const { isFocusMode, toggleFocusMode } = useFocusMode()
    const reduceMotion = useReducedMotion()
    const { bibleVersion, isLoaded } = useReadingPreferences()
    const hasSectionTitles = chapter.verses.some(v => v.heading)
    const prevOk = canGoPrevChapter(book, chapterNum)
    const nextOk = canGoNextChapter(book, chapterNum)
    // Track navigation direction for slide animation: 1 = forward, -1 = backward
    const navDirection = useRef(0)
    // Prevent infinite redirect loop: only redirect once per mount
    const hasRedirected = useRef(false)

    const goTo = useCallback(
        (nextBook: string, nextChapter: number) => {
            router.push(`/read/${nextBook}/${nextChapter}?translation=${translation}`)
        },
        [router, translation]
    )

    const handleNext = useCallback(() => {
        const next = getAdjacentChapter(book, chapterNum, 1)
        if (!next) return
        navDirection.current = 1
        goTo(next.book, next.chapter)
    }, [book, chapterNum, goTo])

    const handlePrev = useCallback(() => {
        const prev = getAdjacentChapter(book, chapterNum, -1)
        if (!prev) return
        navDirection.current = -1
        goTo(prev.book, prev.chapter)
    }, [book, chapterNum, goTo])

    // Sync with user's preferred translation if not explicitly set in URL
    useEffect(() => {
        if (!isLoaded) return
        if (!isExplicitTranslation && bibleVersion && bibleVersion !== translation && !hasRedirected.current) {
            hasRedirected.current = true
            router.replace(`/read/${book}/${chapterNum}?translation=${bibleVersion}`)
        }
    }, [isExplicitTranslation, isLoaded, bibleVersion, translation, book, chapterNum, router])

    // Keyboard Navigation (skip when typing in fields)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement | null
            if (
                el &&
                (el.tagName === "INPUT" ||
                    el.tagName === "TEXTAREA" ||
                    el.tagName === "SELECT" ||
                    el.isContentEditable)
            ) {
                return
            }
            if (e.key === "ArrowRight") {
                e.preventDefault()
                handleNext()
            }
            if (e.key === "ArrowLeft") {
                e.preventDefault()
                handlePrev()
            }
            // Toggle focus mode with Option+F (Alt+F)
            if (e.altKey && e.code === "KeyF") {
                e.preventDefault()
                toggleFocusMode()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleNext, handlePrev, toggleFocusMode])

    const slideVariants = {
        enter: (dir: number) =>
            reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 20 },
        center: { opacity: 1, x: 0 },
        exit: (dir: number) =>
            reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -20 },
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-8">

            {/* Top Controls — animated with Framer Motion */}
            <AnimatePresence mode="wait">
                {!isFocusMode ? (
                    <motion.div
                        key="toolbar-visible"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={SPRING_CONFIG}
                    >
                        <ReadingToolbar currentBook={book} currentChapter={chapterNum} currentTranslation={translation} hasSectionTitles={hasSectionTitles} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="toolbar-focus"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 0.08 }}
                        exit={{ opacity: 0, y: -8 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        transition={SPRING_CONFIG}
                    >
                        <ReadingToolbar currentBook={book} currentChapter={chapterNum} currentTranslation={translation} hasSectionTitles={hasSectionTitles} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Focus Toggle */}
            {/* Focus Toggle - Moved to Footer */}

            {/* Fade Gradients (Visible < 1500px and NOT Focus Mode) */}
            {!isFocusMode && (
                <>
                    <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-40 pointer-events-none hidden max-[1500px]:block" />
                    <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-40 pointer-events-none hidden max-[1500px]:block" />
                </>
            )}

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-4xl relative flex items-start justify-center">

                {/* Left Nav (Desktop) */}
                <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-2 opacity-20 hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={!prevOk}
                        aria-label="Previous chapter"
                        className="p-2 text-muted-foreground/50 hover:text-primary transition-colors disabled:pointer-events-none disabled:opacity-0 cursor-pointer"
                    >
                        <ChevronLeft className="h-10 w-10" strokeWidth={1.5} />
                    </button>
                </div>

                <AnimatePresence mode="wait" custom={navDirection.current}>
                    <motion.div
                        key={`${book}-${chapterNum}`}
                        custom={navDirection.current}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={reduceMotion ? { duration: 0.15 } : SPRING_CONFIG}
                        className="w-full"
                    >
                        <ReadingContent chapter={chapter} bookName={book} chapterNum={chapterNum} sharedVerses={sharedVerses} />
                    </motion.div>
                </AnimatePresence>

                {/* Right Nav (Desktop) */}
                <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-2 opacity-20 hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!nextOk}
                        aria-label="Next chapter"
                        className="p-2 text-muted-foreground/50 hover:text-primary transition-colors disabled:pointer-events-none disabled:opacity-0 cursor-pointer"
                    >
                        <ChevronRight className="h-10 w-10" strokeWidth={1.5} />
                    </button>
                </div>
            </main>

            {isFocusMode && (
                <button
                    type="button"
                    onClick={toggleFocusMode}
                    aria-label="Show reading controls"
                    className="fixed right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm hover:text-foreground top-[calc(5rem+var(--maintenance-banner-height))] md:top-[calc(6rem+var(--maintenance-banner-height))]"
                >
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                </button>
            )}
        </div>
    )
}
