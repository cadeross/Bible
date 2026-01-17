"use client"

import { Quote, ScrollText, Pen, Heart } from "lucide-react"
import { toast } from "sonner"

export function DailyContent() {
    const verse = {
        text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
        ref: "John 1:1",
        version: "RSV-CE"
    }

    const quote = {
        text: "Our hearts are restless until they rest in Thee.",
        author: "St. Augustine of Hippo"
    }

    const handleHighlight = () => {
        toast.success("Verse highlighted", {
            description: "Added to your daily highlights."
        })
    }

    const handleSaveQuote = () => {
        toast.success("Quote saved", {
            description: "Added to your collection."
        })
    }

    return (
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 w-full">
            {/* Verse */}
            <div className="flex flex-col gap-4 group">
                <div className="flex items-center justify-between text-primary/40 text-xs font-mono mb-2">
                    <div className="flex items-center gap-2">
                        <ScrollText className="h-4 w-4" />
                        <span>verse of the day</span>
                    </div>
                    <button
                        onClick={handleHighlight}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
                    >
                        <Pen className="h-3 w-3" />
                    </button>
                </div>
                <blockquote className="font-mono text-lg md:text-xl text-foreground/90 leading-relaxed text-balance">
                    "{verse.text}"
                </blockquote>
                <div className="flex items-center gap-3 text-sm font-mono text-primary/60">
                    <span className="text-primary font-bold hover:underline cursor-pointer">
                        {verse.ref}
                    </span>
                    <span className="opacity-30">|</span>
                    <span>{verse.version}</span>
                </div>
            </div>

            {/* Quote */}
            <div className="flex flex-col gap-4 group">
                <div className="flex items-center justify-between text-primary/40 text-xs font-mono mb-2">
                    <div className="flex items-center gap-2">
                        <Quote className="h-4 w-4" />
                        <span>daily wisdom</span>
                    </div>
                    <button
                        onClick={handleSaveQuote}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
                    >
                        <Heart className="h-3 w-3" />
                    </button>
                </div>
                <blockquote className="font-mono text-lg md:text-xl text-foreground/80 leading-relaxed italic text-balance">
                    "{quote.text}"
                </blockquote>
                <div className="text-right">
                    <span className="text-sm font-mono text-primary/60">
                        — {quote.author}
                    </span>
                </div>
            </div>
        </div>
    )
}
