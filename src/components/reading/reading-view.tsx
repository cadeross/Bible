"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { BibleChapter, getChapter } from "@/lib/bible-api"
import { ReadingContent } from "./reading-content"
import { ReadingToolbar } from "./reading-toolbar"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useFocusMode } from "@/contexts/focus-mode"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
    canGoNextChapter,
    canGoPrevChapter,
    getAdjacentChapter,
} from "@/lib/chapter-navigation"
import { hapticMedium } from "@/lib/haptics"
import { cn } from "@/lib/utils"

interface ReadingViewProps {
    chapter: BibleChapter
    book: string
    chapterNum: number
    translation?: string
    sharedVerses?: number[]
    isExplicitTranslation?: boolean
}

export function ReadingView({ chapter: initialChapter, book: initialBook, chapterNum: initialChapterNum, translation: initialTranslation = "dra", sharedVerses = [], isExplicitTranslation = false }: ReadingViewProps) {
    const { isFocusMode, setFocusMode } = useFocusMode()
    const reduceMotion = useReducedMotion()
    const { bibleVersion, isLoaded } = useReadingPreferences()

    const [currentBook, setCurrentBook] = useState(initialBook)
    const [currentChapterNum, setCurrentChapterNum] = useState(initialChapterNum)
    const [currentTranslation, setCurrentTranslation] = useState(initialTranslation)
    const [chapter, setChapter] = useState(initialChapter)
    const [isNavigating, setIsNavigating] = useState(false)
    const [hasScrolled, setHasScrolled] = useState(false)

    const hasRedirected = useRef(false)
    const navDirection = useRef(0)
    const contentKey = `${currentBook}-${currentChapterNum}-${currentTranslation}`
    const swipeStartRef = useRef<{ x: number; y: number; t: number } | null>(null)
    const isFocusModeRef = useRef(isFocusMode)
    const autoFocusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const focusEnabledAtRef = useRef(0)
    const focusEnabledYRef = useRef(0)
    const SWIPE_MIN_X = 55

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
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleNext, handlePrev])

    useEffect(() => {
        const updateScrollState = () => setHasScrolled(window.scrollY > 24)
        updateScrollState()
        window.addEventListener("scroll", updateScrollState, { passive: true })
        return () => window.removeEventListener("scroll", updateScrollState)
    }, [])

    const slideVariants = {
        enter: () => reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" },
        center: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: () => reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: "blur(4px)" },
    }

    const contentTransition = reduceMotion
        ? { duration: 0.15 }
        : { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const }

    useEffect(() => {
        isFocusModeRef.current = isFocusMode
        if (isFocusMode && focusEnabledAtRef.current === 0) {
            focusEnabledAtRef.current = Date.now()
            focusEnabledYRef.current = window.scrollY
        }
        if (!isFocusMode) {
            focusEnabledAtRef.current = 0
            focusEnabledYRef.current = 0
        }
    }, [isFocusMode])

    useEffect(() => {
        let lastY = window.scrollY
        let downDistance = 0
        let upDistance = 0
        const enableThreshold = 64
        const disableThreshold = 36
        const topThreshold = 32
        const armDelay = 90

        const clearAutoFocusTimer = () => {
            if (autoFocusTimerRef.current) {
                clearTimeout(autoFocusTimerRef.current)
                autoFocusTimerRef.current = null
            }
        }

        const onScroll = () => {
            const y = Math.max(0, window.scrollY)
            const delta = y - lastY
            lastY = y

            if (y <= topThreshold) {
                downDistance = 0
                upDistance = 0
                clearAutoFocusTimer()
                if (isFocusModeRef.current) setFocusMode(false)
                return
            }

            if (Math.abs(delta) < 1) return

            if (delta > 0) {
                downDistance += delta
                upDistance = 0
                if (!isFocusModeRef.current && y > enableThreshold && downDistance > 44 && !autoFocusTimerRef.current) {
                    autoFocusTimerRef.current = setTimeout(() => {
                        autoFocusTimerRef.current = null
                        if (!isFocusModeRef.current && window.scrollY > enableThreshold) {
                            focusEnabledAtRef.current = Date.now()
                            focusEnabledYRef.current = window.scrollY
                            setFocusMode(true)
                        }
                    }, armDelay)
                }
                return
            }

            upDistance += Math.abs(delta)
            downDistance = 0
            clearAutoFocusTimer()
            if (Date.now() - focusEnabledAtRef.current < 520) {
                upDistance = 0
                return
            }
            if (isFocusModeRef.current && upDistance > disableThreshold && y < focusEnabledYRef.current - 12) {
                setFocusMode(false)
            }
        }

        window.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            clearAutoFocusTimer()
            window.removeEventListener("scroll", onScroll)
            setFocusMode(false)
        }
    }, [setFocusMode])

    return (
        <div
            className="min-h-screen bg-background flex flex-col items-center py-8"
            style={{ touchAction: "pan-y", overscrollBehaviorX: "none" } as React.CSSProperties}
            onTouchStart={handleSwipeTouchStart}
            onTouchEnd={handleSwipeTouchEnd}
        >

            <div
                aria-hidden
                className={cn(
                    "pointer-events-none fixed inset-x-0 top-[var(--maintenance-banner-height,0px)] h-36 bg-gradient-to-b from-background via-background/95 to-transparent transition-opacity ease-out",
                    isFocusMode ? "z-[45]" : "z-30",
                    hasScrolled ? "opacity-100 duration-150" : "opacity-0 duration-300"
                )}
            />

            <motion.div
                data-reading-chrome
                className={cn(
                    "sticky z-50 w-full will-change-[top,padding] transition-[top,padding] duration-[850ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                    isFocusMode
                        ? "top-[calc(var(--maintenance-banner-height,0px)+1.25rem)] px-4"
                        : "top-[calc(var(--maintenance-banner-height,0px)+5.75rem)] px-0"
                )}
            >
                <div className="relative z-10 mx-auto w-full">
                    <ReadingToolbar
                        currentBook={currentBook}
                        currentChapter={currentChapterNum}
                        currentTranslation={currentTranslation}
                        onNavigate={navigateTo}
                        compact={false}
                    />
                </div>
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
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25 }}
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
        </div>
    )
}
