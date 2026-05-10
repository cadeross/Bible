import React from "react"
import { hapticLight, hapticHeavy } from "@/lib/haptics"
import { createPortal } from "react-dom"
import { BibleChapter } from "@/lib/bible-api"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { isRedLetterVerse } from "@/lib/red-letter-data"
import { Highlight } from "@/lib/persistence"
import { StickyNote } from "lucide-react"
import { NotePanel } from "@/components/reading/note-dialog"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    VerseHighlightContextMenuContent,
    VerseHighlightDropdownMenuContent,
} from "@/components/reading/verse-highlight-menus"
import { HIGHLIGHT_MENU_COLORS as HIGHLIGHT_COLORS } from "@/lib/highlight-menu"
import { SPRING_FAST } from "@/lib/animation"

function verseSharePulseClass(color: string | undefined): string {
    switch (color) {
        case "green":
            return "animate-verse-pulse-green"
        case "blue":
            return "animate-verse-pulse-blue"
        case "pink":
            return "animate-verse-pulse-pink"
        case "purple":
            return "animate-verse-pulse-purple"
        case "orange":
            return "animate-verse-pulse-orange"
        default:
            return "animate-verse-pulse"
    }
}

interface ReadingContentProps {
    chapter: BibleChapter
    bookName: string
    chapterNum: number
    nextChapterLink?: string
    sharedVerses?: number[]
    mode?: 'default' | 'minimal'
    disableHighlighting?: boolean
}

export function ReadingContent({ chapter, bookName, chapterNum, sharedVerses = [], mode = 'default', disableHighlighting = false }: ReadingContentProps) {
    const { isLoaded, fontSize, fontFamily, lineHeight, showVerseNumbers, redLetters, showTitles, defaultHighlightColor } = useReadingPreferences()
    const [highlights, setHighlights] = React.useState<Highlight[]>([])

    // Track which verses are being highlighted from share link (for pulse animation)
    const [pulsingVerses, setPulsingVerses] = React.useState<number[]>([])

    // Floating Menu State (long-press / drag → dropdown)
    const [menuOpen, setMenuOpen] = React.useState(false)
    const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
    const [anyContextMenuOpen, setAnyContextMenuOpen] = React.useState(false)
    /** Bumping a verse’s key forces its ContextMenu to remount (close) after actions — Radix has no controlled `open`. */
    const [verseMenuEpoch, setVerseMenuEpoch] = React.useState<Record<number, number>>({})

    const bumpVerseContextMenus = React.useCallback((verses: number[]) => {
        if (verses.length === 0) return
        setVerseMenuEpoch((e) => {
            const n = { ...e }
            for (const v of verses) {
                n[v] = (n[v] ?? 0) + 1
            }
            return n
        })
    }, [])
    const [selectedVerses, setSelectedVerses] = React.useState<number[]>([])
    const [liveAnnouncement, setLiveAnnouncement] = React.useState("")

    // Ref for the container to limit selection scope
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Drag-to-select state
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragVerses, setDragVerses] = React.useState<number[]>([])
    const [dragCursorPos, setDragCursorPos] = React.useState({ x: 0, y: 0 })
    const dragStartVerseRef = React.useRef<number | null>(null)
    const dragStartPosRef = React.useRef<{ x: number; y: number } | null>(null)
    const isDraggingRef = React.useRef(false)
    const wasDraggingRef = React.useRef(false)
    const menuClosedAtRef = React.useRef(0)
    const DRAG_THRESHOLD = 8
    const MENU_COOLDOWN = 400

    // Log Reading History
    // Log Reading History (Time Tracking)
    const startTimeRef = React.useRef(Date.now());

    React.useEffect(() => {
        if (mode === 'minimal') return

        startTimeRef.current = Date.now();

        // Save last read position (localStorage for instant nav, cloud for sync)
        if (typeof window !== "undefined") {
            localStorage.setItem("last-read", JSON.stringify({ book: bookName, chapter: chapterNum }))
        }
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

    const cancelDrag = React.useCallback(() => {
        dragStartVerseRef.current = null
        dragStartPosRef.current = null
        isDraggingRef.current = false
        wasDraggingRef.current = false
        setIsDragging(false)
        setDragVerses([])
    }, [])

    React.useEffect(() => {
        if (!menuOpen && !anyContextMenuOpen) {
            menuClosedAtRef.current = Date.now()
        }
    }, [menuOpen, anyContextMenuOpen])

    // 0. Drag-to-select verses (left-click only)
    const startDrag = (verseNum: number, e: React.MouseEvent) => {
        if (e.button !== 0) return
        if (menuOpen || anyContextMenuOpen) return
        if (Date.now() - menuClosedAtRef.current < MENU_COOLDOWN) return
        dragStartVerseRef.current = verseNum
        dragStartPosRef.current = { x: e.clientX, y: e.clientY }
        isDraggingRef.current = false
        setDragVerses([])
    }

    const updateDrag = (verseNum: number, e: React.MouseEvent) => {
        if (dragStartVerseRef.current === null || menuOpen || anyContextMenuOpen) return

        if (!isDraggingRef.current && dragStartPosRef.current) {
            const dx = e.clientX - dragStartPosRef.current.x
            const dy = e.clientY - dragStartPosRef.current.y
            if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return
        }

        if (verseNum === dragStartVerseRef.current && !isDraggingRef.current) return

        if (!isDraggingRef.current) {
            if (longPressTimeout.current) {
                clearTimeout(longPressTimeout.current)
                longPressTimeout.current = null
            }
            isDraggingRef.current = true
            setIsDragging(true)
        }

        window.getSelection()?.removeAllRanges()

        const start = dragStartVerseRef.current
        const allNums = chapter.verses.map(v => v.verse)
        const min = Math.min(start, verseNum)
        const max = Math.max(start, verseNum)
        setDragVerses(allNums.filter(n => n >= min && n <= max))
    }

    const finalizeDrag = (verseNum: number, e: React.MouseEvent) => {
        if (isDraggingRef.current) {
            const start = dragStartVerseRef.current!
            const allNums = chapter.verses.map(v => v.verse)
            const min = Math.min(start, verseNum)
            const max = Math.max(start, verseNum)
            const selected = allNums.filter(n => n >= min && n <= max)

            if (selected.length > 1) {
                wasDraggingRef.current = true
                setSelectedVerses(selected)
                setMenuPosition({ top: e.clientY, left: e.clientX })
                setMenuOpen(true)
                setLiveAnnouncement(`${selected.length} verses selected. Choose a highlight color or press 1–6.`)
            }
        }

        dragStartVerseRef.current = null
        dragStartPosRef.current = null
        isDraggingRef.current = false
        setIsDragging(false)
        setDragVerses([])
    }

    // Escape key cancels drag or closes selection
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return
            if (isDraggingRef.current) {
                e.preventDefault()
                cancelDrag()
                return
            }
            if (menuOpen) {
                setMenuOpen(false)
                window.getSelection()?.removeAllRanges()
            }
        }
        window.addEventListener("keydown", handleEsc)
        return () => window.removeEventListener("keydown", handleEsc)
    }, [menuOpen, cancelDrag])

    // 1. Click -> Toggle Default Highlight
    const handleVerseClick = async (verseNum: number, verseText: string) => {
        // Swallow click if it was the end of a drag-select
        if (wasDraggingRef.current) {
            wasDraggingRef.current = false
            return
        }
        const sel = window.getSelection()
        if (sel && sel.toString().length > 0) return
        if (menuOpen) return

        hapticLight()

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
        if ("button" in e && e.button !== 0) return
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current)

        longPressTimeout.current = setTimeout(() => {
            hapticHeavy()
            openMenu(e.target as HTMLElement, verseNum, 0, 0, true)
        }, 500)
    }

    const handleTouchEnd = () => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current)
            longPressTimeout.current = null
        }
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
    }

    // 4. Track cursor position during drag for the badge
    React.useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (isDraggingRef.current) {
                setDragCursorPos({ x: e.clientX, y: e.clientY })
            }
        }
        document.addEventListener('mousemove', onMouseMove)
        return () => document.removeEventListener('mousemove', onMouseMove)
    }, [])

    const removeHighlightsForVerses = React.useCallback(
        async (verseNums: number[]) => {
            if (verseNums.length === 0) return
            const newHighlights = highlights.filter((h) => !verseNums.includes(h.verse))
            setHighlights(newHighlights)
            const persistence = await import("@/lib/persistence")
            for (const vId of verseNums) {
                await persistence.removeHighlight(bookName, chapterNum, vId)
            }
            setMenuOpen(false)
            bumpVerseContextMenus(verseNums)
            setAnyContextMenuOpen(false)
            window.getSelection()?.removeAllRanges()
        },
        [highlights, bookName, chapterNum, bumpVerseContextMenus]
    )

    const applyColor = React.useCallback(
        async (color: string) => {
            if (selectedVerses.length > 0) {
                const allHaveThisColor = selectedVerses.every(
                    (v) => highlights.find((h) => h.verse === v)?.color === color
                )
                if (allHaveThisColor) {
                    await removeHighlightsForVerses(selectedVerses)
                    return
                }
            }

            const newHighlights = [...highlights]
            const persistence = await import("@/lib/persistence")

            for (const vId of selectedVerses) {
                const existingIdx = newHighlights.findIndex((h) => h.verse === vId)
                const noteToKeep = existingIdx !== -1 ? newHighlights[existingIdx].note : undefined
                const idToKeep = existingIdx !== -1 ? newHighlights[existingIdx].id : undefined

                if (existingIdx !== -1) newHighlights.splice(existingIdx, 1)

                const verseData = chapter.verses.find((v) => v.verse === vId)
                if (verseData) {
                    const h: Highlight = {
                        id: idToKeep,
                        book: bookName,
                        chapter: chapterNum,
                        verse: vId,
                        color,
                        content: verseData.text,
                        note: noteToKeep,
                        created_at: new Date().toISOString(),
                    }
                    newHighlights.push(h)
                    await persistence.saveHighlight(h)
                }
            }

            setHighlights(newHighlights)
            setMenuOpen(false)
            bumpVerseContextMenus(selectedVerses)
            setAnyContextMenuOpen(false)
            window.getSelection()?.removeAllRanges()
        },
        [
            highlights,
            selectedVerses,
            bookName,
            chapterNum,
            chapter.verses,
            bumpVerseContextMenus,
            removeHighlightsForVerses,
        ]
    )

    // Keyboard shortcuts for highlight menu: 1–6 apply colors (or remove if already that color), Escape closes
    React.useEffect(() => {
        if (!menuOpen && !anyContextMenuOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setMenuOpen(false)
                setAnyContextMenuOpen(false)
                window.getSelection()?.removeAllRanges()
                return
            }
            const colorIndex = parseInt(e.key, 10) - 1
            if (colorIndex >= 0 && colorIndex < HIGHLIGHT_COLORS.length) {
                e.preventDefault()
                void applyColor(HIGHLIGHT_COLORS[colorIndex].id)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [menuOpen, anyContextMenuOpen, applyColor])

    const clearSelection = async () => {
        await removeHighlightsForVerses(selectedVerses)
    }


    const [noteOpen, setNoteOpen] = React.useState(false)
    const [noteContent, setNoteContent] = React.useState("")
    const [noteTouched, setNoteTouched] = React.useState(false)
    const [noteStatus, setNoteStatus] = React.useState<"idle" | "saving" | "saved">("idle")
    const noteSaveTimeout = React.useRef<NodeJS.Timeout | null>(null)

    const selectedHighlightColor = React.useMemo(() => {
        if (selectedVerses.length === 0) return undefined
        const h = highlights.find((h) => h.verse === selectedVerses[0])
        return h?.color
    }, [selectedVerses, highlights])

    /** Swatch X + remove-on-click only when every selected verse already uses the same color. */
    const menuActiveHighlightColor = React.useMemo(() => {
        if (selectedVerses.length === 0) return null
        const colors = selectedVerses.map((v) => highlights.find((h) => h.verse === v)?.color)
        if (colors.some((c) => c === undefined)) return null
        const first = colors[0]
        return colors.every((c) => c === first) ? first! : null
    }, [selectedVerses, highlights])

    // ... (existing handlers)

    const handleOpenNote = () => {
        setMenuOpen(false)
        bumpVerseContextMenus(selectedVerses)
        setAnyContextMenuOpen(false)
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
        bumpVerseContextMenus(selectedVerses)
        setAnyContextMenuOpen(false)
        window.getSelection()?.removeAllRanges()
    }

    const [copyDone, setCopyDone] = React.useState(false)

    const handleCopyVerse = async () => {
        const versesToCopy = chapter.verses.filter(v => selectedVerses.includes(v.verse))
            .sort((a, b) => a.verse - b.verse)
        if (versesToCopy.length === 0) return

        const text = versesToCopy.map(v => v.text).join(' ')
        const firstVerse = versesToCopy[0].verse
        const lastVerse = versesToCopy[versesToCopy.length - 1].verse
        const verseRef = firstVerse === lastVerse ? `${firstVerse}` : `${firstVerse}-${lastVerse}`
        const ref = `${bookName} ${chapterNum}:${verseRef}`

        await navigator.clipboard.writeText(`"${text}" — ${ref}`)
        setCopyDone(true)
        setTimeout(() => {
            setCopyDone(false)
            setMenuOpen(false)
            bumpVerseContextMenus(selectedVerses)
            setAnyContextMenuOpen(false)
            window.getSelection()?.removeAllRanges()
        }, 1000)
    }

    const menuHandlers = React.useMemo(
        () => ({
            applyColor: (c: string) => void applyColor(c),
            onNote: () => handleOpenNote(),
            onCopy: () => void handleCopyVerse(),
            onShare: () => void handleShareSelection(),
            copyDone,
            activeHighlightColor: menuActiveHighlightColor,
        }),
        [applyColor, handleOpenNote, handleCopyVerse, handleShareSelection, copyDone, menuActiveHighlightColor]
    )

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
            case "script": return "font-script"
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
            case "script": return 'var(--font-beau-rivage), "Brush Script MT", "Lucida Handwriting", cursive'
            case "serif":
            default: return "Merriweather, Georgia, ui-serif, serif"
        }
    })()

    // Beau Rivage has a small x-height — at the same px size it reads noticeably
    // smaller than the other fonts. Scale up so the user's chosen size lands
    // visually consistent across faces. The chapter-title header gets an extra
    // bump so it still reads as a heading (not flush with body text).
    const isScript = (isLoaded ? fontFamily : "serif") === "script"
    const fontSizeScale = isScript ? 1.3 : 1
    const headerSizeScale = isScript ? 1.6 : 1
    const sectionTitleScale = isScript ? 1.4 : 1

    // Imperatively apply styles after preferences load — React's suppressHydrationWarning
    // can cause the initial server-rendered style to persist through reconciliation
    // Only override fontFamily imperatively — fontSize and lineHeight are owned by the style
    // prop so their CSS transitions fire exactly once per change with no stutter.
    React.useEffect(() => {
        if (containerRef.current && isLoaded) {
            containerRef.current.style.fontFamily = fontFamilyStyle
        }
    }, [isLoaded, fontFamily, fontFamilyStyle])

    return (
        <div
            suppressHydrationWarning
            ref={containerRef}
            className={cn(
                "w-full transition-all duration-300 ease-in-out relative",
                mode === 'default' ? "max-w-[720px] mx-auto px-6 py-8" : "px-0 py-2",
            )}
            style={{
                fontSize: `${(isLoaded ? fontSize : 18) * fontSizeScale}px`,
                lineHeight: isLoaded ? lineHeight : 1.6,
                fontFamily: fontFamilyStyle,
                userSelect: 'none',
                transition: 'line-height 0.35s cubic-bezier(0.25, 0.1, 0.25, 1), font-size 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
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
            <div aria-live="polite" className="sr-only" data-reading-live="">
                {liveAnnouncement}
            </div>

            {/* Drag selection count badge — portaled to body to escape transform containment */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {isDragging && dragVerses.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 500, damping: 28 }}
                            className="fixed z-[9999] pointer-events-none rounded-full"
                            style={{
                                top: dragCursorPos.y + 16,
                                left: dragCursorPos.x + 16,
                                background: "color-mix(in srgb, var(--popover) 82%, transparent)",
                                WebkitBackdropFilter: "blur(60px) saturate(2)",
                                backdropFilter: "blur(60px) saturate(2)",
                                boxShadow: "var(--shadow-elevated), inset 0 0.5px 0 rgba(255,255,255,0.12)",
                            }}
                        >
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground px-3 py-1.5">
                                <span>{dragVerses.length}</span>
                                <span className="text-muted-foreground font-medium">{dragVerses.length === 1 ? 'verse' : 'verses'}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Long-press / drag selection → anchored dropdown menu — portaled trigger */}
            {!disableHighlighting && typeof document !== "undefined" && createPortal(
                <DropdownMenu
                    open={menuOpen}
                    onOpenChange={(open) => {
                        setMenuOpen(open)
                        if (!open) {
                            window.getSelection()?.removeAllRanges()
                        }
                    }}
                >
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-hidden
                            tabIndex={-1}
                            className="pointer-events-none fixed z-40 h-px w-px opacity-0"
                            style={{ left: menuPosition.left, top: menuPosition.top }}
                        />
                    </DropdownMenuTrigger>
                    <VerseHighlightDropdownMenuContent handlers={menuHandlers} />
                </DropdownMenu>,
                document.body
            )}

            {mode === 'default' && (
                <div className="text-center mb-14">
                    <h1
                        className="font-semibold tracking-tight text-foreground"
                        style={{ fontSize: `${18 * headerSizeScale}px` }}
                    >
                        {chapter.reference}
                    </h1>
                    <p
                        className="text-muted-foreground mt-1.5"
                        style={{ fontSize: `${12 * headerSizeScale}px` }}
                    >
                        {chapter.translation_name}
                    </p>
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
                                                <h3
                                                    className={cn(
                                                        "max-w-[90%] text-center font-sans font-semibold leading-snug tracking-wide text-foreground/85",
                                                        !isScript && "text-base md:text-lg"
                                                    )}
                                                    style={isScript ? { fontSize: `${16 * sectionTitleScale}px` } : undefined}
                                                >
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
                                                <h3
                                                    className={cn(
                                                        "max-w-[90%] text-center font-sans font-semibold leading-snug tracking-wide text-foreground/85",
                                                        !isScript && "text-base md:text-lg"
                                                    )}
                                                    style={isScript ? { fontSize: `${16 * sectionTitleScale}px` } : undefined}
                                                >
                                                    {verse.heading}
                                                </h3>
                                            </motion.div>
                                        )}
                                        <ContextMenu
                                            key={`ctx-${verse.verse}-${verseMenuEpoch[verse.verse] ?? 0}`}
                                            onOpenChange={(open) => {
                                                setAnyContextMenuOpen(open)
                                                if (open) {
                                                    setSelectedVerses([verse.verse])
                                                    setLiveAnnouncement(
                                                        `Verse ${verse.verse}. Press 1–6 to highlight, or use the menu.`
                                                    )
                                                }
                                            }}
                                        >
                                            <ContextMenuTrigger asChild>
                                                <motion.span
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.002, duration: 0.2 }}
                                                    data-verse={verse.verse}
                                                    data-highlight-color={highlight?.color}
                                                    className={cn(
                                                        "inline cursor-pointer transition-colors duration-150 rounded px-[2px] -mx-[2px] relative",
                                                        bgClass || "hover:bg-primary/5",
                                                        dragVerses.includes(verse.verse) &&
                                                            "bg-primary/15 ring-1 ring-primary/30 ring-inset",
                                                        !dragVerses.length &&
                                                            (menuOpen || anyContextMenuOpen) &&
                                                            selectedVerses.includes(verse.verse) &&
                                                            (bgClass
                                                                ? "ring-1 ring-primary/40 ring-inset"
                                                                : "bg-primary/10 ring-1 ring-primary/30 ring-inset"),
                                                        pulsingVerses.includes(verse.verse) &&
                                                            verseSharePulseClass(highlight?.color),
                                                        highlight?.note &&
                                                            !bgClass &&
                                                            "underline decoration-dotted decoration-primary/50"
                                                    )}
                                                    style={{ touchAction: "manipulation" }}
                                                    onClick={() => handleVerseClick(verse.verse, verse.text)}
                                                    onContextMenu={(e) => { if ("ontouchstart" in window) e.preventDefault() }}
                                                    onMouseDown={(e) => {
                                                        handleTouchStart(verse.verse, e)
                                                        startDrag(verse.verse, e)
                                                    }}
                                                    onMouseEnter={(e) => updateDrag(verse.verse, e)}
                                                    onMouseUp={(e) => {
                                                        handleTouchEnd()
                                                        finalizeDrag(verse.verse, e)
                                                    }}
                                                    onMouseLeave={handleTouchEnd}
                                                    onTouchStart={(e) => handleTouchStart(verse.verse, e)}
                                                    onTouchEnd={handleTouchEnd}
                                                >
                                                    <motion.sup
                                                        aria-hidden="true"
                                                        animate={{ opacity: isLoaded && !showVerseNumbers ? 0 : 1 }}
                                                        transition={{ duration: 0.2 }}
                                                        className={cn(
                                                            "mr-1 inline-flex items-center gap-0.5 select-none font-mono text-[0.6em] text-muted-foreground/60",
                                                            isLoaded && !showVerseNumbers && "mr-0 w-0 overflow-hidden"
                                                        )}
                                                    >
                                                        <span>{verse.verse}</span>
                                                        {highlight?.note && (
                                                            <StickyNote className="h-2 w-2 text-primary/70" />
                                                        )}
                                                    </motion.sup>
                                                    <span
                                                        className={cn(
                                                            "transition-colors duration-200",
                                                            isLoaded &&
                                                                redLetters &&
                                                                isRedLetterVerse(bookName, chapterNum, verse.verse) &&
                                                                "text-red-700 dark:text-red-400"
                                                        )}
                                                    >
                                                        {verse.text}
                                                    </span>
                                                </motion.span>
                                            </ContextMenuTrigger>
                                            <VerseHighlightContextMenuContent handlers={menuHandlers} />
                                        </ContextMenu>
                                        {" "}
                                    </React.Fragment>
                                )
                            })
                        )}
                    </div>

                    {mode === 'default' && chapter.translation_note && (
                        <div className="mt-16 text-center">
                            <p className="text-xs text-muted-foreground/50 leading-relaxed max-w-lg mx-auto">
                                {chapter.translation_note}
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
