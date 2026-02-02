"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Save, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface NoteDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    verseRef: string
    initialContent?: string
    onSave: (content: string) => void
    onDelete?: () => void
}

export function NoteDialog({
    isOpen,
    onOpenChange,
    verseRef,
    initialContent = "",
    onSave,
    onDelete
}: NoteDialogProps) {
    const [content, setContent] = useState(initialContent)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (isOpen) {
            setContent(initialContent)
            // Focus hack to ensure keyboard is ready
            setTimeout(() => textareaRef.current?.focus(), 100)
        }
    }, [isOpen, initialContent])

    const handleSave = () => {
        onSave(content)
        onOpenChange(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            handleSave()
        }
        if (e.key === 'Escape') {
            onOpenChange(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 z-50 bg-background/60 backdrop-blur-md"
                    />

                    {/* Dialog Container */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                            className="w-full max-w-lg pointer-events-auto"
                        >
                            <div className="relative overflow-hidden rounded-xl bg-card border border-border shadow-2xl">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                                    <h2 className="text-sm font-medium text-muted-foreground font-mono tracking-tight">
                                        {verseRef}
                                    </h2>
                                    <div className="flex items-center gap-1">
                                        {onDelete && initialContent && (
                                            <button
                                                onClick={onDelete}
                                                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-muted"
                                                title="Delete Note"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onOpenChange(false)}
                                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Editor */}
                                <div className="p-4">
                                    <textarea
                                        ref={textareaRef}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="type your note..."
                                        className="w-full h-48 bg-transparent border-0 resize-none focus:ring-0 p-0 text-base text-card-foreground placeholder:text-muted-foreground/50 font-sans leading-relaxed selection:bg-primary/20"
                                        spellCheck={false}
                                    />
                                </div>

                                {/* Footer / Actions */}
                                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
                                    <div className="text-xs text-muted-foreground font-mono">
                                        <span className="hidden sm:inline">CMD + ENTER to save</span>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 active:scale-95 transition-all rounded-md shadow-sm"
                                    >
                                        <Save className="w-3 h-3" />
                                        SAVE
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
