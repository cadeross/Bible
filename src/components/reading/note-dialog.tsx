"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

    useEffect(() => {
        if (isOpen) {
            setContent(initialContent)
        }
    }, [isOpen, initialContent])

    const handleSave = () => {
        onSave(content)
        onOpenChange(false)
    }

    const [showDeleteAlert, setShowDeleteAlert] = useState(false)

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl gap-0 sm:rounded-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
                <DialogHeader className="px-6 py-4 border-b border-border/10 bg-muted/20">
                    <DialogTitle className="font-serif italic text-xl font-normal text-muted-foreground">
                        {verseRef}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Edit note for {verseRef}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6">
                    <Textarea
                        placeholder="Write your thoughts..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[200px] resize-none border-none focus-visible:ring-0 px-0 py-0 text-lg leading-relaxed font-serif bg-transparent placeholder:text-muted-foreground/30"
                        autoFocus
                    />
                </div>

                <DialogFooter className="px-6 py-3 bg-muted/20 flex items-center justify-between sm:justify-between border-t border-border/10">
                    <div>
                        {onDelete && initialContent && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeleteAlert(true)}
                                className="text-muted-foreground hover:text-destructive transition-colors h-8 px-2"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                <span className="text-xs">Delete Note</span>
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            size="sm"
                            className="px-6 font-mono text-xs uppercase tracking-wider shadow-lg shadow-primary/20"
                        >
                            Save Note
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this note? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (onDelete) onDelete()
                                setShowDeleteAlert(false)
                                onOpenChange(false)
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    )
}
