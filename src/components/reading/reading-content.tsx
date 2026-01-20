import React from "react"
import { BibleChapter } from "@/lib/bible-api"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { isRedLetterVerse } from "@/lib/red-letter-data"
import { Highlight } from "@/lib/persistence"
import { Trash2 } from "lucide-react"

interface ReadingContentProps {
    chapter: BibleChapter
    bookName: string
    chapterNum: number
    nextChapterLink?: string
}

const HIGHLIGHT_COLORS = [
    { id: "yellow", class: "bg-yellow-500/30 dark:bg-yellow-500/20", border: "border-yellow-500/50" },
    { id: "green", class: "bg-green-500/30 dark:bg-green-500/20", border: "border-green-500/50" },
    { id: "blue", class: "bg-blue-500/30 dark:bg-blue-500/20", border: "border-blue-500/50" },
    { id: "pink", class: "bg-pink-500/30 dark:bg-pink-500/20", border: "border-pink-500/50" },
    { id: "purple", class: "bg-purple-500/30 dark:bg-purple-500/20", border: "border-purple-500/50" },
]

export function ReadingContent({ chapter, bookName, chapterNum }: ReadingContentProps) {
    const { fontSize, fontFamily, lineHeight, showVerseNumbers, redLetters, defaultHighlightColor } = useReadingPreferences()
    const [highlights, setHighlights] = React.useState<Highlight[]>([])

    // Floating Menu State
    const [menuOpen, setMenuOpen] = React.useState(false)
    const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
    const [selectedVerses, setSelectedVerses] = React.useState<number[]>([])

    // Ref for the container to limit selection scope
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Load highlights on mount
    React.useEffect(() => {
        import("@/lib/persistence").then(({ getHighlights }) => {
            getHighlights(bookName, chapterNum).then(data => {
                setHighlights(data)
            })
        })
    }, [bookName, chapterNum])

    // --- Interaction Handlers ---

    // 1. Click -> Toggle Default Highlight
    const handleVerseClick = async (verseNum: number, verseText: string) => {
        // Prevent if selecting text - check selection length
        const sel = window.getSelection()
        if (sel && sel.toString().length > 0) return

        // Prevent if menu is open (interaction might be closing menu)
        if (menuOpen) return

        const existing = highlights.find(h => h.verse === verseNum)
        if (existing) {
            // Remove
            setHighlights(prev => prev.filter(h => h.verse !== verseNum))
            const { removeHighlight } = await import("@/lib/persistence")
            await removeHighlight(bookName, chapterNum, verseNum)
        } else {
            // Add Default
            const newH: Highlight = {
                book: bookName,
                chapter: chapterNum,
                verse: verseNum,
                color: defaultHighlightColor,
                content: verseText,
                created_at: new Date().toISOString()
            }
            setHighlights(prev => [...prev, newH])
            const { saveHighlight } = await import("@/lib/persistence")
            await saveHighlight(newH)
        }
    }

    // 2. Long Press -> Open Menu for Single Verse
    const longPressTimeout = React.useRef<NodeJS.Timeout | null>(null)

    const handleTouchStart = (verseNum: number, e: React.TouchEvent | React.MouseEvent) => {
        // Clear existing
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current)

        longPressTimeout.current = setTimeout(() => {
            // Long press triggered
            const target = e.target as HTMLElement
            const rect = target.getBoundingClientRect()

            // Set position
            setMenuPosition({
                top: rect.top - 60 + window.scrollY,
                left: rect.left + rect.width / 2
            })
            setSelectedVerses([verseNum])
            setMenuOpen(true)

            // Vibration feedback if supported
            if (window.navigator?.vibrate) window.navigator.vibrate(50)
        }, 500) // 500ms hold
    }

    const handleTouchEnd = () => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current)
            longPressTimeout.current = null
        }
    }

    // 3. Text Selection -> Open Menu for Multiple Verses
    React.useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection()
            if (!selection || selection.isCollapsed) {
                return // Don't auto-close here, handled by overlay
            }

            if (!containerRef.current?.contains(selection.anchorNode)) return

            // Wait a tick for selection to stabilize
            setTimeout(() => {
                const sel = window.getSelection()
                if (!sel || sel.isCollapsed) return

                const range = sel.getRangeAt(0)
                const verseNodes = containerRef.current?.querySelectorAll('[data-verse]')
                const selectedIds: number[] = []

                verseNodes?.forEach((node) => {
                    if (sel.containsNode(node, true)) {
                        const id = Number(node.getAttribute('data-verse'))
                        if (id) selectedIds.push(id)
                    }
                })

                if (selectedIds.length > 0) {
                    const rect = range.getBoundingClientRect()
                    // Check bounds sanity
                    if (rect.width > 0 && rect.height > 0) {
                        setMenuPosition({
                            top: rect.top - 60 + window.scrollY,
                            left: rect.left + rect.width / 2
                        })
                        setSelectedVerses(selectedIds)
                        setMenuOpen(true)
                    }
                }
            }, 10)
        }

        // Use mouseup/touchend for finalizing selection instead of selectionchange (too noisy)
        const onMouseUp = () => handleSelection()

        document.addEventListener('mouseup', onMouseUp)
        document.addEventListener('touchend', onMouseUp) // Some mobile browsers need this

        return () => {
            document.removeEventListener('mouseup', onMouseUp)
            document.removeEventListener('touchend', onMouseUp)
        }
    }, [])

    // Apply Color to Selected Verses
    const applyColor = async (color: string) => {
        const newHighlights = [...highlights]
        const persistence = await import("@/lib/persistence")

        for (const vId of selectedVerses) {
            // Remove existing if any
            const existingIdx = newHighlights.findIndex(h => h.verse === vId)
            if (existingIdx !== -1) newHighlights.splice(existingIdx, 1)

            // Find text
            const verseData = chapter.verses.find(v => v.verse === vId)

            if (verseData) {
                const h: Highlight = {
                    book: bookName,
                    chapter: chapterNum,
                    verse: vId,
                    color,
                    content: verseData.text,
                    created_at: new Date().toISOString()
                }
                newHighlights.push(h)
                await persistence.saveHighlight(h)
            }
        }

        setHighlights(newHighlights)
        setMenuOpen(false)
        window.getSelection()?.removeAllRanges()
    }

    const clearSelection = async () => {
        const newHighlights = highlights.filter(h => !selectedVerses.includes(h.verse))
        setHighlights(newHighlights)

        const persistence = await import("@/lib/persistence")
        for (const vId of selectedVerses) {
            await persistence.removeHighlight(bookName, chapterNum, vId)
        }
        setMenuOpen(false)
        window.getSelection()?.removeAllRanges()
    }

    const getFontClass = () => {
        switch (fontFamily) {
            case "sans": return "font-sans"
            case "mono": return "font-mono"
            case "serif":
            default: return "font-serif"
        }
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "w-full max-w-[720px] mx-auto px-6 py-8 transition-all duration-300 ease-in-out relative",
                getFontClass()
            )}
            style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
            }}
        >
            {/* Elegant Floating Highlight Menu */}
            {menuOpen && (
                <div
                    className="fixed z-50 flex items-center gap-2 p-2 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-full animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: menuPosition.top,
                        left: menuPosition.left,
                        transform: 'translate(-50%, -10px)' // Center horizontal, slightly up
                    }}
                >
                    {HIGHLIGHT_COLORS.map(c => (
                        <button
                            key={c.id}
                            onClick={() => applyColor(c.id)}
                            className={cn(
                                "w-8 h-8 rounded-full border transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring",
                                c.class,
                                c.border
                            )}
                        />
                    ))}
                    <div className="w-[1px] h-6 bg-border mx-1" />
                    <button
                        onClick={clearSelection}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Click Overlay to Dismiss Menu */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => {
                        setMenuOpen(false)
                        window.getSelection()?.removeAllRanges()
                    }}
                />
            )}

            <div className="space-y-4">
                {/* Chapter Header */}
                <div className="text-center mb-12 opacity-50 hover:opacity-100 transition-opacity">
                    <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                        {chapter.reference}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{chapter.translation_name}</p>
                </div>

                {/* Verses */}
                <div className="prose dark:prose-invert max-w-none">
                    {chapter.verses.map((verse, i) => {
                        const highlight = highlights.find(h => h.verse === verse.verse)
                        const colorConfig = highlight ? HIGHLIGHT_COLORS.find(c => c.id === highlight.color) : null
                        const bgClass = colorConfig ? colorConfig.class : ""

                        return (
                            <React.Fragment key={verse.verse}>
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.002, duration: 0.2 }}
                                    data-verse={verse.verse}
                                    className={cn(
                                        "inline cursor-pointer transition-colors duration-200 rounded px-[2px] -mx-[2px] relative",
                                        bgClass || "hover:bg-primary/5",
                                    )}
                                    // Click Handler (Default Highlight)
                                    onClick={() => handleVerseClick(verse.verse, verse.text)}
                                    // Long Press Handlers (Menu)
                                    onMouseDown={(e) => handleTouchStart(verse.verse, e)}
                                    onMouseUp={handleTouchEnd}
                                    onMouseLeave={handleTouchEnd}
                                    onTouchStart={(e) => handleTouchStart(verse.verse, e)}
                                    onTouchEnd={handleTouchEnd}
                                >
                                    {showVerseNumbers && (
                                        <sup className="mr-1 text-[0.6em] text-muted-foreground/50 select-none font-mono">
                                            {verse.verse}
                                        </sup>
                                    )}
                                    <span className={cn(
                                        "transition-colors duration-200",
                                        redLetters && isRedLetterVerse(bookName, chapterNum, verse.verse) && "text-red-700 dark:text-red-400"
                                    )}>
                                        {verse.text}
                                    </span>
                                </motion.span>
                                {" "}
                            </React.Fragment>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
