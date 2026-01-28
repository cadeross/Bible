import React from "react"
import { BibleChapter } from "@/lib/bible-api"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { isRedLetterVerse } from "@/lib/red-letter-data"
import { Highlight } from "@/lib/persistence"
import { Trash2, StickyNote } from "lucide-react"

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

    // Log Reading History
    // Log Reading History (Time Tracking)
    const startTimeRef = React.useRef(Date.now());

    React.useEffect(() => {
        startTimeRef.current = Date.now();

        return () => {
            // Cleanup: Log Duration
            const duration = (Date.now() - startTimeRef.current) / 1000;
            if (duration < 5) return; // Ignore very short visits

            const wordCount = chapter.verses.reduce((acc, v) => acc + v.text.split(/\s+/).length, 0);

            const historyEntry = {
                book: bookName,
                chapter: chapterNum,
                words_read: wordCount,
                duration_seconds: Math.round(duration),
                completed_at: new Date().toISOString()
            };

            import("@/lib/persistence").then(({ saveHistory }) => {
                saveHistory(historyEntry);
            });
        };
    }, [bookName, chapterNum, chapter]);

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
        const sel = window.getSelection()
        if (sel && sel.toString().length > 0) return
        if (menuOpen) return

        const existing = highlights.find(h => h.verse === verseNum)
        if (existing) {
            setHighlights(prev => prev.filter(h => h.verse !== verseNum))
            const { removeHighlight } = await import("@/lib/persistence")
            await removeHighlight(bookName, chapterNum, verseNum)
        } else {
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

    // 2. Long Press -> Open Menu
    const longPressTimeout = React.useRef<NodeJS.Timeout | null>(null)

    const handleTouchStart = (verseNum: number, e: React.TouchEvent | React.MouseEvent) => {
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current)

        longPressTimeout.current = setTimeout(() => {
            openMenu(e.target as HTMLElement, verseNum, 0, 0, true) // Pass standard offset
        }, 500)
    }

    const handleTouchEnd = () => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current)
            longPressTimeout.current = null
        }
    }

    // 3. Right Click (Context Menu) -> Open Menu
    const handleContextMenu = (e: React.MouseEvent, verseNum: number) => {
        e.preventDefault()
        // If native selection exists, let it be (but context menu usually overrides or is blocked).
        // Here we just open our menu at cursor.
        openMenu(e.target as HTMLElement, verseNum, e.clientX, e.clientY, false)
    }

    const openMenu = (target: HTMLElement, verseNum: number, clientX: number, clientY: number, autoPosition: boolean) => {

        let top = 0
        let left = 0

        if (autoPosition) {
            const rect = target.getBoundingClientRect()
            top = rect.top
            left = rect.left + rect.width / 2
        } else {
            // Use pointer position
            top = clientY
            left = clientX
        }

        setMenuPosition({ top, left })
        setSelectedVerses([verseNum])
        setMenuOpen(true)
        if (window.navigator?.vibrate) window.navigator.vibrate(50)
    }

    // 4. Text Selection -> Open Menu
    React.useEffect(() => {
        const handleSelection = () => {
            const selection = window.getSelection()
            if (!selection || selection.isCollapsed) return
            if (!containerRef.current?.contains(selection.anchorNode)) return

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
                    if (rect.width > 0 && rect.height > 0) {
                        setMenuPosition({
                            top: rect.top,
                            left: rect.left + rect.width / 2
                        })
                        setSelectedVerses(selectedIds)
                        // Reset for multi-select
                        setMenuOpen(true)
                    }
                }
            }, 10)
        }

        const onMouseUp = () => handleSelection()
        document.addEventListener('mouseup', onMouseUp)
        document.addEventListener('touchend', onMouseUp)

        return () => {
            document.removeEventListener('mouseup', onMouseUp)
            document.removeEventListener('touchend', onMouseUp)
        }
    }, [])

    const applyColor = async (color: string) => {
        const newHighlights = [...highlights]
        const persistence = await import("@/lib/persistence")

        for (const vId of selectedVerses) {
            const existingIdx = newHighlights.findIndex(h => h.verse === vId)
            let noteToKeep = existingIdx !== -1 ? newHighlights[existingIdx].note : undefined
            let idToKeep = existingIdx !== -1 ? newHighlights[existingIdx].id : undefined // Preserve ID for safe update

            // If we are applying color, remove old entry to replace in local state (logic for display)
            // But we must reuse the ID if we want persistence to UPDATE instead of INSERT (duplicate)
            if (existingIdx !== -1) newHighlights.splice(existingIdx, 1)

            const verseData = chapter.verses.find(v => v.verse === vId)
            if (verseData) {
                const h: Highlight = {
                    id: idToKeep, // PASS ID
                    book: bookName,
                    chapter: chapterNum,
                    verse: vId,
                    color,
                    content: verseData.text,
                    note: noteToKeep, // Preserve note
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
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
        >
            {/* Elegant Floating Highlight Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="fixed z-50 flex items-center gap-2 p-1.5 bg-background border border-border shadow-lg rounded-xl"
                        style={{
                            top: menuPosition.top,
                            left: menuPosition.left,
                            transform: 'translate(10px, -120%)' // Up and to the right
                        }}
                    >
                        {HIGHLIGHT_COLORS.map(c => (
                            <motion.button
                                key={c.id}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => applyColor(c.id)}
                                className={cn(
                                    "w-5 h-5 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 transition-colors focus:outline-none",
                                    c.class
                                )}
                            />
                        ))}

                        <div className="w-[1px] h-4 bg-border/50 mx-1" />

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                // Placeholder for Note functionality
                                console.log("Add note for verses", selectedVerses)
                                alert("Note feature coming soon!")
                                setMenuOpen(false)
                            }}
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                            title="Add Note"
                        >
                            <StickyNote className="h-4 w-4" />
                        </motion.button>

                        <div className="w-[1px] h-5 bg-border mx-1" />

                        <motion.button
                            whileHover={{ scale: 1.1, color: "var(--destructive)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={clearSelection}
                            className="p-1.5 text-muted-foreground transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

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

            {/* Chapter Header - Static, not animated */}
            <div className="text-center mb-12 opacity-50 hover:opacity-100 transition-opacity">
                <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                    {chapter.reference}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">{chapter.translation_name}</p>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${bookName}-${chapterNum}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: "spring" as const, stiffness: 500, damping: 30 }}
                >
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
                                        // Right Click (Context Menu)
                                        onContextMenu={(e) => handleContextMenu(e, verse.verse)}
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

                    {/* Citation / Copyright */}
                    {chapter.translation_note && (
                        <div className="mt-12 text-center opacity-40 hover:opacity-80 transition-opacity">
                            <p className="text-[10px] font-mono leading-relaxed max-w-lg mx-auto">
                                {chapter.translation_note}
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
