"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotePanelProps {
    verseLabel: string
    versePreview?: string
    highlightColor?: string
    initialContent?: string
    onContentChange: (content: string) => void
    onDelete?: () => void
    saveStatus?: "idle" | "saving" | "saved"
    fontClass?: string
}

const COLOR_ACCENTS: Record<string, string> = {
    yellow: "border-l-yellow-500/50 bg-yellow-500/5 text-yellow-500/80",
    green: "border-l-green-500/50 bg-green-500/5 text-green-500/80",
    blue: "border-l-blue-500/50 bg-blue-500/5 text-blue-500/80",
    pink: "border-l-pink-500/50 bg-pink-500/5 text-pink-500/80",
    purple: "border-l-purple-500/50 bg-purple-500/5 text-purple-500/80",
}

export function NotePanel({
    verseLabel,
    versePreview,
    highlightColor,
    initialContent = "",
    onContentChange,
    onDelete,
    saveStatus = "idle",
    fontClass = "font-serif",
}: NotePanelProps) {
    const [content, setContent] = useState(initialContent)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Sync initial content on open
    useEffect(() => {
        setContent(initialContent)
        setConfirmDelete(false)
    }, [initialContent])

    // Auto-focus textarea on mount
    useEffect(() => {
        const t = setTimeout(() => textareaRef.current?.focus(), 150)
        return () => clearTimeout(t)
    }, [])

    // Auto-expand textarea
    const autoResize = useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = "auto"
        el.style.height = `${Math.max(el.scrollHeight, 120)}px`
    }, [])

    useEffect(() => {
        autoResize()
    }, [content, autoResize])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setContent(val)
        onContentChange(val)
    }

    const handleDeleteClick = () => {
        if (!confirmDelete) {
            setConfirmDelete(true)
            // Auto-reset after 3 seconds
            deleteTimeoutRef.current = setTimeout(() => setConfirmDelete(false), 3000)
        } else {
            if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current)
            setConfirmDelete(false)
            onDelete?.()
        }
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current)
        }
    }, [])

    const wordCount = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length
    const accentClass = highlightColor ? COLOR_ACCENTS[highlightColor] : "border-l-primary/30"

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col h-full gap-8 px-1"
        >
            {/* Header / Verse Info */}
            <div className="space-y-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60">
                    note
                </p>
                <h2 className={cn("text-xl text-foreground tracking-tight", fontClass)}>
                    {verseLabel}
                </h2>

                {/* Verse Preview with color accent */}
                {versePreview && (
                    <div
                        className={cn(
                            "border-l border-primary/20 pl-4 py-3 pr-3 rounded-r-md transition-colors duration-500",
                            accentClass
                        )}
                    >
                        <p className={cn("text-[13px] leading-relaxed italic line-clamp-4 opacity-80", fontClass)}>
                            "{versePreview}"
                        </p>
                    </div>
                )}
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0 pt-2">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleChange}
                    placeholder="Write your thoughts…"
                    className={cn(
                        "w-full h-full bg-transparent border-0 resize-none py-2",
                        "text-base md:text-lg text-foreground/90 placeholder:text-muted-foreground/40",
                        "leading-loose",
                        fontClass,
                        "focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none focus:outline-0",
                        "selection:bg-primary/20",
                        "min-h-[200px]"
                    )}
                    style={{ minHeight: 120, outline: 'none', boxShadow: 'none' }}
                    spellCheck={false}
                />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground/50 pb-2">
                {/* Left: Save status / word count */}
                <div className="flex items-center gap-4">
                    <div className="w-16 flex items-center">
                        <AnimatePresence mode="wait">
                            {saveStatus === "saving" && (
                                <motion.span
                                    key="saving"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <Loader2 className="h-3 w-3 animate-spin opacity-50" />
                                    saving
                                </motion.span>
                            )}
                            {saveStatus === "saved" && (
                                <motion.span
                                    key="saved"
                                    initial={{ opacity: 0, y: 2 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-1.5 text-muted-foreground/60"
                                >
                                    <motion.span
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <Check className="h-3 w-3" />
                                    </motion.span>
                                    saved
                                </motion.span>
                            )}
                            {saveStatus === "idle" && (
                                <motion.span
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    &nbsp;
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {wordCount > 0 && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-muted-foreground/50 hidden sm:inline-block"
                            >
                                {wordCount} {wordCount === 1 ? "word" : "words"}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Delete */}
                {onDelete && content.trim().length > 0 && (
                    <motion.button
                        onClick={handleDeleteClick}
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer",
                            confirmDelete
                                ? "text-destructive bg-destructive/10"
                                : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50"
                        )}
                        layout
                    >
                        <Trash2 className="h-3 w-3" />
                        <AnimatePresence mode="wait">
                            {confirmDelete ? (
                                <motion.span
                                    key="confirm"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    confirm?
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="delete"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden whitespace-nowrap"
                                >
                                    delete
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                )}
            </div>
        </motion.div>
    )
}
