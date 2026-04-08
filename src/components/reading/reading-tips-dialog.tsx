"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const STORAGE_KEY = "openwrit-reading-tips-seen"

const TIPS: { keys: string; desc: string }[] = [
    { keys: "← / →", desc: "Previous or next chapter (when not typing in a field)" },
    { keys: "⌥ F (Alt+F)", desc: "Toggle focus mode for distraction-free reading" },
    { keys: "⌘ K / Ctrl+K", desc: "Command palette: jump to a reference and search verse text" },
    { keys: "Type", desc: "Start typing on most pages to open the palette with that letter" },
    { keys: "Select text", desc: "Drag or double-click verses to highlight, copy, or share" },
]

export function ReadingTipsDialog({ trigger }: { trigger: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const seen = localStorage.getItem(STORAGE_KEY)
        if (!seen) {
            setOpen(true)
        }
    }, [])

    const markSeen = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, "1")
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (!next) markSeen()
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-md border-border/40 font-mono sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-sm font-normal uppercase tracking-[0.2em] text-muted-foreground">
                        Reading tips
                    </DialogTitle>
                </DialogHeader>
                <ul className="mt-2 space-y-4 text-sm text-foreground">
                    {TIPS.map((row) => (
                        <li key={row.keys} className="flex flex-col gap-1 border-b border-border/20 pb-3 last:border-0 last:pb-0">
                            <kbd className="text-xs font-medium text-primary">{row.keys}</kbd>
                            <span className="text-muted-foreground">{row.desc}</span>
                        </li>
                    ))}
                </ul>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    Appearance and reading options live in Settings.
                </p>
            </DialogContent>
        </Dialog>
    )
}
