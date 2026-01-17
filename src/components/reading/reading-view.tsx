"use client"

import React, { useEffect } from "react"
import { BibleChapter, BOOK_LIST } from "@/lib/bible-api"
import { ReadingContent } from "./reading-content"
import { ReadingToolbar } from "./reading-toolbar"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReadingViewProps {
    chapter: BibleChapter
    book: string
    chapterNum: number
    translation?: string
}

export function ReadingView({ chapter, book, chapterNum, translation = "dra" }: ReadingViewProps) {
    const router = useRouter()

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
            <ReadingToolbar currentBook={book} currentTranslation={translation} />

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-4xl relative flex items-start justify-center">

                {/* Left Nav (Desktop) */}
                <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-2 opacity-20 hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={handlePrev} disabled={chapterNum <= 1}>
                        <ChevronLeft className="h-8 w-8" />
                    </Button>
                </div>

                <ReadingContent chapter={chapter} bookName={book} chapterNum={chapterNum} />

                {/* Right Nav (Desktop) */}
                <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-2 opacity-20 hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={handleNext}>
                        <ChevronRight className="h-8 w-8" />
                    </Button>
                </div>
            </main>

            {/* Footer / Mobile Nav */}
            <footer className="w-full mt-12 py-8 border-t border-border/20 text-center text-muted-foreground text-xs font-mono opacity-50 hover:opacity-100 transition-opacity">
                <div className="flex justify-center gap-8 mb-4 lg:hidden">
                    <Button variant="ghost" size="sm" onClick={handlePrev} disabled={chapterNum <= 1}>
                        Previous
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleNext}>
                        Next
                    </Button>
                </div>
                <p>{chapter.reference} • {chapter.translation_name}</p>
                <p className="mt-2 text-[10px]">Shortcuts: Arrow Keys to Navigate</p>
            </footer>
        </div>
    )
}
