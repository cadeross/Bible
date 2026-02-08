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
import { motion } from "framer-motion"

interface ReadingViewProps {
    chapter: BibleChapter
    book: string
    chapterNum: number
    translation?: string
    sharedVerses?: number[]
}

export function ReadingView({ chapter, book, chapterNum, translation = "dra", sharedVerses = [] }: ReadingViewProps) {
    const router = useRouter()
    const { isFocusMode, toggleFocusMode } = useFocusMode()

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

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") handleNext()
            if (e.key === "ArrowLeft") handlePrev()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [book, chapterNum])

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
                    <Button variant="ghost" size="icon" onClick={handlePrev} disabled={chapterNum <= 1}>
                        <ChevronLeft className="h-8 w-8" />
                    </Button>
                </div>

                <ReadingContent chapter={chapter} bookName={book} chapterNum={chapterNum} sharedVerses={sharedVerses} />

                {/* Right Nav (Desktop) */}
                <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-2 opacity-20 hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={handleNext}>
                        <ChevronRight className="h-8 w-8" />
                    </Button>
                </div>
            </main>

            {/* Footer / Mobile Nav - Removed (Global Fixed Footer is used) */}
        </div>
    )
}
