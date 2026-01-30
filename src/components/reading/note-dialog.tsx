"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Trash2 } from "lucide-react"

interface NoteDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    verseRef: string // e.g., "John 3:16"
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

    // Reset content when dialog opens/verse changes
    useEffect(() => {
        if (isOpen) {
            setContent(initialContent)
        }
    }, [isOpen, initialContent])

    const handleSave = () => {
        onSave(content)
        onOpenChange(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-mono">note: {verseRef}</DialogTitle>
                    <DialogDescription className="text-xs font-mono text-muted-foreground">
                        add your thoughts or reflections for this verse.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="write your note here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="font-serif italic min-h-[150px] resize-none focus-visible:ring-1"
                        autoFocus
                    />
                </div>
                <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                    {onDelete && initialContent ? (
                        <Button variant="ghost" size="icon" onClick={() => {
                            if (confirm("Delete this note?")) {
                                onDelete()
                                onOpenChange(false)
                            }
                        }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    ) : (
                        <div /> // Spacer
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>cancel</Button>
                        <Button onClick={handleSave}>save note</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
