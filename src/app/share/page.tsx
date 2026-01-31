"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Quote, BookOpen, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SharePage() {
    const searchParams = useSearchParams()

    // Extract data from URL
    const ref = searchParams.get("ref")
    const text = searchParams.get("text")
    const note = searchParams.get("note")

    // Parse ref for back-link (e.g. "John 3:16") -> /read/John/3
    // Simple parser assuming "Book Chapter:Verse" format
    const getReadLink = () => {
        if (!ref) return "/"
        try {
            // Split by last space to get Book vs Chapter:Verse
            const lastSpaceIndex = ref.lastIndexOf(" ")
            const bookName = ref.substring(0, lastSpaceIndex)
            const chapterVerse = ref.substring(lastSpaceIndex + 1)
            const chapter = chapterVerse.split(":")[0]
            return `/read/${bookName}/${chapter}`
        } catch (e) {
            return "/read"
        }
    }

    if (!ref || !text) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                <p className="text-muted-foreground font-mono mb-4">invalid or missing content.</p>
                <Link href="/">
                    <Button variant="outline">return home</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6 relative overflow-hidden">

            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full translate-x-[-50%] translate-y-[-50%]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full translate-x-[50%] translate-y-[50%]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[600px] space-y-12"
            >
                {/* Logo / Brand */}
                <div className="flex justify-center mb-8">
                    <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                        <BookOpen className="text-primary-foreground h-5 w-5" />
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-8 md:p-12 shadow-2xl relative group">
                    {/* Decorative Quote Icon */}
                    <Quote className="absolute top-6 left-6 h-8 w-8 text-primary/10 -scale-x-100" />

                    <div className="space-y-8 text-center">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-serif leading-relaxed text-foreground italic">
                                "{text}"
                            </h2>
                            <p className="mt-6 text-sm font-bold tracking-widest uppercase text-muted-foreground font-mono">
                                {ref}
                            </p>
                        </div>

                        {note && (
                            <div className="pt-8 border-t border-border/10">
                                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-wider mb-4">
                                    note
                                </div>
                                <p className="text-foreground/90 font-serif italic whitespace-pre-wrap leading-relaxed">
                                    {note}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Call to Action */}
                <div className="flex justify-center">
                    <Link href={getReadLink()}>
                        <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                            read in context <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
