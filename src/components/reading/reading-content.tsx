import React from "react"
import { BibleChapter } from "@/lib/bible-api"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { isRedLetterVerse } from "@/lib/red-letter-data"
import { Highlight } from "@/lib/persistence"
import { Trash2, StickyNote, Share2 } from "lucide-react"
import { NotePanel } from "@/components/reading/note-dialog"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { SPRING_FAST } from "@/lib/animation"

interface ReadingContentProps {
    chapter: BibleChapter
    bookName: string
    chapterNum: number
    nextChapterLink?: string
    sharedVerses?: number[]
    mode?: 'default' | 'minimal'
    disableHighlighting?: boolean
}

const HIGHLIGHT_COLORS = [
    { id: "yellow", label: "Highlight yellow", class: "bg-yellow-500/40 dark:bg-yellow-500/30", border: "border-yellow-500/50" },
    { id: "green", label: "Highlight green", class: "bg-green-500/40 dark:bg-green-500/30", border: "border-green-500/50" },
    { id: "blue", label: "Highlight blue", class: "bg-blue-500/40 dark:bg-blue-500/30", border: "border-blue-500/50" },
    { id: "pink", label: "Highlight pink", class: "bg-pink-500/40 dark:bg-pink-500/30", border: "border-pink-500/50" },
    { id: "purple", label: "Highlight purple", class: "bg-purple-500/40 dark:bg-purple-500/30", border: "border-purple-500/50" },
]

export function ReadingContent({ chapter, bookName, chapterNum, sharedVerses = [], mode = 'default', disableHighlighting = false }: ReadingContentProps) {
    const { isLoaded, fontSize, fontFamily, lineHeight, showVerseNumbers, redLetters, showTitles, defaultHighlightColor } = useReadingPreferences()
    const [highlights, setHighlights] = React.useState<Highlight[]>([])

    // Track which verses are being highlighted from share link (for pulse animation)
    const [pulsingVerses, setPulsingVerses] = React.useState<number[]>([])

    // Floating Menu State
    const [menuOpen, setMenuOpen] = React.useState(false)
    const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
    const [selectedVerses, setSelectedVerses] = React.useState<number[]>([])
    const [liveAnnouncement, setLiveAnnouncement] = React.useState("")

    // Ref for the container to limit selection scope
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Log Reading History
    // Log Reading History (Time Tracking)
    const startTimeRef = React.useRef(Date.now());

    React.useEffect(() => {
        if (mode === 'minimal') return

        startTimeRef.current = Date.now();

        // Save last read position
        import("@/lib/persistence").then(({ updateLastRead }) => {
            updateLastRead(bookName, chapterNum);
        });

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
    }, [bookName, chapterNum, chapter, mode]);

    // ... (rest of imports/logic same until render) ...

    // Load highlights on mount
    React.useEffect(() => {
        import("@/lib/persistence").then(({ getHighlights }) => {
            getHighlights(bookName, chapterNum).then(data => {
                setHighlights(data)
            })
        })
    }, [bookName, chapterNum])

    // Handle shared verses - pulse animation and scroll
    React.useEffect(() => {
        if (sharedVerses.length === 0) return

        // Start pulse animation
        setPulsingVerses(sharedVerses)

        // Scroll to first shared verse after a short delay (to let content render)
        const scrollTimeout = setTimeout(() => {
            const firstVerseEl = containerRef.current?.querySelector(`[data-verse="${sharedVerses[0]}"]`)
            if (firstVerseEl) {
                firstVerseEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }, 100)

        // Stop pulse animation after 3 seconds
        const pulseTimeout = setTimeout(() => {
            setPulsingVerses([])
        }, 3000)

        return () => {
            clearTimeout(scrollTimeout)
            clearTimeout(pulseTimeout)
        }
    }, [sharedVerses])

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
                        setMenuOpen(true)
                        const wordCount = sel.toString().trim().split(/\s+/).length
                        setLiveAnnouncement(`${wordCount} word${wordCount !== 1 ? 's' : ''} selected. Choose a highlight color or press 1–5.`)
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



    // Keyboard shortcuts for highlight menu: 1–5 apply colors, Escape closes
    React.useEffect(() => {
        if (!menuOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMenuOpen(false)
                window.getSelection()?.removeAllRanges()
                return
            }
            const colorIndex = parseInt(e.key, 10) - 1
            if (colorIndex >= 0 && colorIndex < HIGHLIGHT_COLORS.length) {
                e.preventDefault()
                applyColor(HIGHLIGHT_COLORS[colorIndex].id)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [menuOpen, selectedVerses])

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


    const [noteOpen, setNoteOpen] = React.useState(false)
    const [noteContent, setNoteContent] = React.useState("")
    const [noteTouched, setNoteTouched] = React.useState(false)
    const [noteStatus, setNoteStatus] = React.useState<"idle" | "saving" | "saved">("idle")
    const noteSaveTimeout = React.useRef<NodeJS.Timeout | null>(null)

    const selectedHighlightColor = React.useMemo(() => {
        if (selectedVerses.length === 0) return undefined
        const h = highlights.find(h => h.verse === selectedVerses[0])
        return h?.color
    }, [selectedVerses, highlights])

    // ... (existing handlers)

    const handleOpenNote = () => {
        setMenuOpen(false)
        setNoteContent(getInitialNoteContent())
        setNoteTouched(false)
        setNoteStatus("idle")
        setNoteOpen(true)
    }

    const persistNoteContent = async (content: string) => {
        if (selectedVerses.length === 0) return
        const noteValue = content.length > 0 ? content : undefined
        const newHighlights = [...highlights]
        const persistence = await import("@/lib/persistence")

        // If no color selected for these verses yet, use default
        // If color exists, keep it.
        const targetColor = defaultHighlightColor

        for (const vId of selectedVerses) {
            const existingIdx = newHighlights.findIndex(h => h.verse === vId)
            let colorToKeep = existingIdx !== -1 ? newHighlights[existingIdx].color : targetColor
            let idToKeep = existingIdx !== -1 ? newHighlights[existingIdx].id : undefined

            if (existingIdx !== -1) newHighlights.splice(existingIdx, 1)

            const verseData = chapter.verses.find(v => v.verse === vId)
            if (verseData) {
                const h: Highlight = {
                    id: idToKeep,
                    book: bookName,
                    chapter: chapterNum,
                    verse: vId,
                    color: colorToKeep,
                    content: verseData.text,
                    note: noteValue, // Update note
                    created_at: new Date().toISOString()
                }
                newHighlights.push(h)
                await persistence.saveHighlight(h)
            }
        }
        setHighlights(newHighlights)
    }

    const handleDeleteNote = async () => {
        // Just clear the note field, keep highlight
        await persistNoteContent("")
        setNoteContent("")
        setNoteTouched(false)
        setNoteStatus("saved")
    }

    const handleShareSelection = async () => {
        // Gather content
        const versesToShare = chapter.verses.filter(v => selectedVerses.includes(v.verse))
            .sort((a, b) => a.verse - b.verse)

        if (versesToShare.length === 0) return

        const textContent = versesToShare.map(v => v.text).join(' ')

        // Build verse parameter (single: v=16, range: v=16-18)
        const firstVerse = versesToShare[0].verse
        const lastVerse = versesToShare[versesToShare.length - 1].verse
        const verseParam = firstVerse === lastVerse ? `${firstVerse}` : `${firstVerse}-${lastVerse}`

        // Build reference for share title
        const ref = `${bookName} ${chapterNum}:${verseParam}`

        // Direct link to verse(s)
        const url = `${window.location.origin}/read/${encodeURIComponent(bookName)}/${chapterNum}?v=${verseParam}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: ref,
                    text: `"${textContent}" — ${ref}`,
                    url: url
                })
            } catch (e) { console.error(e) }
        } else {
            navigator.clipboard.writeText(url)
            alert("Link copied to clipboard!")
        }
        setMenuOpen(false)
        window.getSelection()?.removeAllRanges()
    }

    // Helper to get initial note content
    const getInitialNoteContent = () => {
        if (selectedVerses.length === 0) return ""
        const h = highlights.find(h => h.verse === selectedVerses[0])
        return h?.note || ""
    }

    const verseLabel = React.useMemo(() => {
        if (selectedVerses.length === 0) return `${bookName} ${chapterNum}`
        const sorted = [...selectedVerses].sort((a, b) => a - b)
        const isContiguous = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1)
        const range = isContiguous
            ? `${sorted[0]}${sorted.length > 1 ? `-${sorted[sorted.length - 1]}` : ""}`
            : sorted.join(",")
        return `${bookName} ${chapterNum}:${range}`
    }, [selectedVerses, bookName, chapterNum])

    const versePreview = React.useMemo(() => {
        if (selectedVerses.length === 0) return ""
        const selected = chapter.verses
            .filter(v => selectedVerses.includes(v.verse))
            .sort((a, b) => a.verse - b.verse)
            .slice(0, 3)
            .map(v => `${v.verse}. ${v.text}`)
            .join(" ")
        const more = selectedVerses.length > 3 ? " …" : ""
        return `${selected}${more}`
    }, [selectedVerses, chapter.verses])

    React.useEffect(() => {
        if (!noteOpen || !noteTouched) return
        setNoteStatus("saving")
        if (noteSaveTimeout.current) clearTimeout(noteSaveTimeout.current)
        noteSaveTimeout.current = setTimeout(async () => {
            await persistNoteContent(noteContent.trim())
            setNoteStatus("saved")
        }, 600)
        return () => {
            if (noteSaveTimeout.current) clearTimeout(noteSaveTimeout.current)
        }
    }, [noteContent, noteOpen, noteTouched, selectedVerses])

    const getFontClass = () => {
        if (!isLoaded) return "font-serif"
        switch (fontFamily) {
            case "sans": return "font-sans"
            case "mono": return "font-mono"
            case "pixel": return "font-pixel"
            case "serif":
            default: return "font-serif"
        }
    }

    const fontFamilyStyle = (() => {
        const fc = isLoaded ? fontFamily : "serif"
        switch (fc) {
            case "sans": return "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
            case "mono": return "var(--font-geist-mono), ui-monospace, monospace"
            case "pixel": return "var(--font-nunito), ui-rounded, sans-serif"
            case "serif":
            default: return "Merriweather, Georgia, ui-serif, serif"
        }
    })()

    // Imperatively apply styles after preferences load — React's suppressHydrationWarning
    // can cause the initial server-rendered style to persist through reconciliation
    React.useEffect(() => {
        if (containerRef.current && isLoaded) {
            containerRef.current.style.fontFamily = fontFamilyStyle
            containerRef.current.style.fontSize = `${fontSize}px`
            containerRef.current.style.lineHeight = `${lineHeight}`
        }
    }, [isLoaded, fontFamily, fontSize, lineHeight, fontFamilyStyle])

    return (
        <div
            suppressHydrationWarning
            ref={containerRef}
            className={cn(
                "w-full transition-all duration-300 ease-in-out relative",
                mode === 'default' ? "max-w-[720px] mx-auto px-6 py-8" : "px-0 py-2",
            )}
            style={{
                fontSize: `${isLoaded ? fontSize : 18}px`,
                lineHeight: isLoaded ? lineHeight : 1.6,
                fontFamily: fontFamilyStyle,
            }}
        >
            <Dialog
                open={noteOpen}
                onOpenChange={(open) => {
                    if (!open && noteTouched) {
                        persistNoteContent(noteContent.trim())
                    }
                    setNoteOpen(open)
                }}
            >
                <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden bg-background">
                    <DialogTitle className="sr-only">Note for {verseLabel}</DialogTitle>
                    <div className="p-6 md:p-8">
                        <NotePanel
                            verseLabel={verseLabel}
                            versePreview={versePreview}
                            highlightColor={selectedHighlightColor}
                            initialContent={getInitialNoteContent()}
                            saveStatus={noteStatus}
                            fontClass={getFontClass()}
                            onContentChange={(val) => {
                                setNoteContent(val)
                                setNoteTouched(true)
                            }}
                            onDelete={handleDeleteNote}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Screen reader live region for selection feedback */}
            <div aria-live="polite" className="sr-only">{liveAnnouncement}</div>

            {/* Elegant Floating Highlight Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        role="toolbar"
                        aria-label="Highlight options"
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={SPRING_FAST}
                        className="fixed z-50 flex items-center gap-2 p-1.5 bg-background border border-border/30 shadow-[0_4px_16px_rgba(0,0,0,0.08)] rounded-[2px]"
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
                                aria-label={c.label}
                                className={cn(
                                    "w-5 h-5 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary",
                                    c.class
                                )}
                            />
                        ))}

                        <div className="w-[1px] h-4 bg-border/50 mx-1" />

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleOpenNote}
                            aria-label="Add note"
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary rounded-sm"
                        >
                            <StickyNote className="h-4 w-4" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleShareSelection}
                            aria-label="Share verse"
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary rounded-sm"
                        >
                            <Share2 className="h-4 w-4" />
                        </motion.button>

                        <div className="w-[1px] h-5 bg-border mx-1" />

                        <motion.button
                            whileHover={{ scale: 1.1, color: "var(--destructive)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={clearSelection}
                            aria-label="Remove highlight"
                            className="p-1.5 text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary rounded-sm"
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
            {/* Chapter Header - Static, not animated */}
            {mode === 'default' && (
                <div className="text-center mb-12 opacity-50 hover:opacity-100 transition-opacity">
                    <h1 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                        {chapter.reference}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{chapter.translation_name}</p>
                </div>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${bookName}-${chapterNum}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={SPRING_FAST}
                >
                    {/* Verses */}
                    <div className="prose dark:prose-invert max-w-none">
                        {chapter.verses.length === 0 ? (
                            <div className="text-center text-muted-foreground italic my-12">
                                {chapter.text}
                            </div>
                        ) : disableHighlighting ? (
                            // Non-Scripture fallback: render as block paragraphs, no highlighting
                            <div className="space-y-4">
                                {chapter.verses.map((verse, i) => (
                                    <React.Fragment key={verse.verse}>
                                        {verse.heading && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="w-full mt-10 mb-4 flex justify-center"
                                            >
                                                <h3 className="text-lg md:text-xl font-bold font-sans text-foreground/90 tracking-tight leading-tight text-center max-w-[80%]">
                                                    {verse.heading}
                                                </h3>
                                            </motion.div>
                                        )}
                                        <motion.p
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.002, duration: 0.2 }}
                                            className="leading-relaxed"
                                        >
                                            {verse.text}
                                        </motion.p>
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            chapter.verses.map((verse, i) => {
                                const highlight = highlights.find(h => h.verse === verse.verse)
                                const colorConfig = highlight ? HIGHLIGHT_COLORS.find(c => c.id === highlight.color) : null
                                const bgClass = colorConfig ? colorConfig.class : ""

                                return (
                                    <React.Fragment key={verse.verse}>
                                        {verse.heading && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                suppressHydrationWarning
                                                className={cn(
                                                    "w-full mt-10 mb-4 flex justify-center",
                                                    isLoaded && !showTitles && "hidden"
                                                )}
                                            >
                                                <h3 className="text-lg md:text-xl font-bold font-sans text-foreground/90 tracking-tight leading-tight text-center max-w-[80%]">
                                                    {verse.heading}
                                                </h3>
                                            </motion.div>
                                        )}
                                        <motion.span
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.002, duration: 0.2 }}
                                            data-verse={verse.verse}
                                            className={cn(
                                                "inline cursor-pointer transition-colors duration-200 rounded px-[2px] -mx-[2px] relative",
                                                bgClass || "hover:bg-primary/5",
                                                // Pulse animation for shared verses — use highlight color if present
                                                pulsingVerses.includes(verse.verse) && (
                                                    highlight?.color === 'green' ? "animate-verse-pulse-green" :
                                                    highlight?.color === 'blue' ? "animate-verse-pulse-blue" :
                                                    highlight?.color === 'pink' ? "animate-verse-pulse-pink" :
                                                    highlight?.color === 'purple' ? "animate-verse-pulse-purple" :
                                                    "animate-verse-pulse"
                                                ),
                                                // Show indicator if there's a note but no color
                                                highlight?.note && !bgClass && "underline decoration-dotted decoration-primary/50"
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
                                            <motion.sup
                                                aria-hidden="true"
                                                animate={{ opacity: isLoaded && !showVerseNumbers ? 0 : 1 }}
                                                transition={{ duration: 0.2 }}
                                                className={cn(
                                                "mr-1 text-[0.6em] text-muted-foreground/60 select-none font-mono inline-flex items-center gap-0.5",
                                                isLoaded && !showVerseNumbers && "w-0 mr-0 overflow-hidden"
                                            )}>
                                                <span>{verse.verse}</span>
                                                {highlight?.note && (
                                                    <StickyNote className="h-2 w-2 text-primary/70" />
                                                )}
                                            </motion.sup>
                                            <span className={cn(
                                                "transition-colors duration-200",
                                                isLoaded && redLetters && isRedLetterVerse(bookName, chapterNum, verse.verse) && "text-red-700 dark:text-red-400"
                                            )}>
                                                {verse.text}
                                            </span>
                                        </motion.span>
                                        {" "}
                                    </React.Fragment>
                                )
                            })
                        )}
                    </div>

                    {/* Citation / Copyright */}
                    {mode === 'default' && chapter.translation_note && (
                        <div className="mt-12 text-center opacity-60 hover:opacity-80 transition-opacity">
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
