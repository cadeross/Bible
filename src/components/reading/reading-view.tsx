"use client"

import React, { useEffect } from "react"
import { BibleChapter, BOOK_LIST } from "@/lib/bible-api"
import { ReadingContent } from "./reading-content"
import { ReadingToolbar } from "./reading-toolbar"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFocusMode } from "@/contexts/focus-mode"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { motion } from "framer-motion"

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
    const { bibleVersion } = useReadingPreferences()

    // Navigation Logic
    const handleNext = () => {
        // Simple logic: increment chapter
        // If last chapter of book, go to next book (not fully implemented for brevity without book metadata about max chapters)
        // For now, just increment chapter.
        router.push(`/read/${book}/${chapterNum + 1}?translation=${translation}`)
    }

    const handlePrev = () => {
        if (chapterNum > 1) {
            router.push(`/read/${book}/${chapterNum - 1}?translation=${translation}`)
        }
    }

    // Sync with user's preferred translation if not explicitly set in URL
    useEffect(() => {
        if (!isExplicitTranslation && bibleVersion && bibleVersion !== translation) {
            // Force a hard navigation to ensure server-side props update correctly
            // router.replace() was causing an infinite loop due to soft navigation issues with searchParams
            window.location.replace(`/read/${book}/${chapterNum}?translation=${bibleVersion}`)
        }
    }, [isExplicitTranslation, bibleVersion, translation, book, chapterNum])

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") handleNext()
            if (e.key === "ArrowLeft") handlePrev()
            // Toggle focus mode with Option+F (Alt+F)
            // Use e.code === "KeyF" because on Mac Option+F produces "ƒ" so e.key would be "ƒ"
            if (e.altKey && e.code === "KeyF") {
                e.preventDefault()
                toggleFocusMode()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [book, chapterNum, handleNext, handlePrev, toggleFocusMode])

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-8">

            {/* Top Controls */}
            <div className={cn("transition-opacity duration-500", isFocusMode ? "opacity-0 hover:opacity-100" : "opacity-100")}>
                <ReadingToolbar currentBook={book} currentChapter={chapterNum} currentTranslation={translation} />
            </div>

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
                        onClick={handlePrev}
                        disabled={chapterNum <= 1}
                        className="p-2 text-muted-foreground/50 hover:text-primary transition-colors disabled:opacity-0 cursor-pointer"
                    >
                        <ChevronLeft className="h-10 w-10" strokeWidth={1.5} />
                    </button>
                </div>

                <ReadingContent chapter={chapter} bookName={book} chapterNum={chapterNum} sharedVerses={sharedVerses} />

                {/* Right Nav (Desktop) */}
                <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-2 opacity-20 hover:opacity-100 transition-opacity">
                    <button onClick={handleNext} className="p-2 text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer">
                        <ChevronRight className="h-10 w-10" strokeWidth={1.5} />
                    </button>
                </div>
            </main>

            {/* Footer / Mobile Nav - Removed (Global Fixed Footer is used) */}
        </div>
    )
}
