"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { BOOK_LIST } from "@/lib/bible-api"
import { Search, CornerDownLeft, PanelTop } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavMode } from "@/contexts/nav-mode"

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const [input, setInput] = React.useState("")
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const router = useRouter()
    const { navMode, toggleNavMode } = useNavMode()

    React.useEffect(() => {
        const handleOpen = () => {
            setOpen(true)
            setInput("")
            setSelectedIndex(0)
        }
        window.addEventListener("open-command-menu", handleOpen as EventListener)
        return () => window.removeEventListener("open-command-menu", handleOpen as EventListener)
    }, [])

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            // Ignore if input/textarea is focused
            if (
                document.activeElement?.tagName === "INPUT" ||
                document.activeElement?.tagName === "TEXTAREA" ||
                (document.activeElement as HTMLElement).isContentEditable
            ) {
                return
            }

            // Check if key is a single character letter/number/symbol and no modifiers
            if (e.key && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
                if (!e.key.match(/^[a-zA-Z0-9]$/)) return;

                e.preventDefault()
                setOpen(true)
                setInput((prev) => open ? prev : e.key)
                if (!open) setInput(e.key)
            }

            // Allow Esc to close
            if (e.key === "Escape") {
                setOpen(false)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [open])

    const suggestions = React.useMemo(() => {
        if (!input) return []
        const lower = input.toLowerCase()

        // Check for "Book Chapter" pattern (e.g. "John 3" or "lev 4")
        const parts = lower.split(" ")
        const firstPart = parts[0]

        // 1. Literal Book Matches (search anywhere in string)
        const bookMatches = BOOK_LIST.filter(b => b.toLowerCase().includes(lower))

        // 2. Smart Jump Logic
        let jumpSuggestion = null

        // Find if input starts with a book name (e.g. "lev" matches "Leviticus")
        const matchedBook = BOOK_LIST.find(b => b.toLowerCase().startsWith(firstPart))

        if (matchedBook) {
            // Check for chapter number in second part
            const secondPart = parts[1]
            if (secondPart && secondPart.match(/^\d+(:?\d*)?$/)) {
                jumpSuggestion = {
                    id: "jump",
                    label: `Go to ${matchedBook} ${secondPart}`,
                    action: () => {
                        const [chapter, verse] = secondPart.split(":")
                        let url = `/read/${matchedBook}/${chapter}`
                        if (verse) url += `#verse-${verse}`
                        router.push(url)
                        setOpen(false)
                    }
                }
            } else if (!secondPart && !bookMatches.includes(matchedBook)) {
                // If matchedBook is not in bookMatches
            }
        }

        const list = bookMatches.map(b => ({
            id: b,
            label: b,
            action: () => {
                router.push(`/read/${b}/1`)
                setOpen(false)
            }
        }))

        if (jumpSuggestion) {
            return [jumpSuggestion, ...list]
        }
        return list
    }, [input, router])

    // System commands (always available, filtered by input)
    const systemCommands = React.useMemo(() => {
        const commands = [
            {
                id: "toggle-nav",
                label: navMode === "classic" ? "Switch to inline navigation" : "Switch to classic navigation",
                action: () => {
                    toggleNavMode()
                    setOpen(false)
                }
            }
        ]
        if (!input) return commands
        return commands.filter(c => c.label.toLowerCase().includes(input.toLowerCase()))
    }, [input, navMode, toggleNavMode])

    const allSuggestions = React.useMemo(() => {
        return [...suggestions, ...systemCommands]
    }, [suggestions, systemCommands])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedIndex(i => Math.min(allSuggestions.length - 1, i + 1))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedIndex(i => Math.max(0, i - 1))
        } else if (e.key === "Tab") {
            e.preventDefault()
            const item = allSuggestions[selectedIndex]
            if (item && item.id !== "jump") {
                setInput(item.label + " ")
            }
        } else if (e.key === "Enter") {
            e.preventDefault()
            const item = allSuggestions[selectedIndex]
            if (item) {
                item.action()
            }
        }
    }

    // Reset selection on input change
    React.useEffect(() => {
        setSelectedIndex(0)
    }, [input])

    return (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Portal>
                {/* Subtle Overlay with minimal blur */}
                <DialogPrimitive.Overlay
                    className="fixed inset-0 z-50 bg-background/20 backdrop-blur-[1px] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                />

                {/* Content Container */}
                <DialogPrimitive.Content
                    className={cn(
                        "fixed left-[50%] top-[20%] z-50 w-full max-w-lg translate-x-[-50%] outline-none",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                        "data-[state=closed]:slide-out-to-top-[18%] data-[state=open]:slide-in-from-top-[18%]",
                        "duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    )}
                >
                    <DialogPrimitive.Title className="sr-only">Command Menu</DialogPrimitive.Title>
                    {/* Monkeytype Style: Solid/Flat, Monospace, Sharp corners */}
                    <div className="bg-background border border-border/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2px] overflow-hidden">
                        <div className="flex items-center px-4 py-1">
                            <Search className="mr-3 h-4 w-4 opacity-40" />
                            <input
                                className="flex h-12 w-full rounded-[2px] bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground/30 disabled:cursor-not-allowed disabled:opacity-50 font-mono tracking-wide"
                                placeholder="type to jump..."
                                value={input}
                                autoFocus
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            {/* Visual Hint */}
                            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-medium text-muted-foreground/30 border border-primary/10 rounded px-1.5 py-0.5">
                                ESC
                            </div>
                        </div>

                        {allSuggestions.length > 0 && (
                            <div className="max-h-[300px] overflow-y-auto border-t border-primary/5">
                                {allSuggestions.map((item, index) => (
                                    <button
                                        key={item.id}
                                        onClick={() => item.action()}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={cn(
                                            "flex w-full items-center justify-between px-4 py-2 text-sm outline-none transition-all duration-75 font-mono",
                                            index === selectedIndex
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <span className={cn("truncate", index === selectedIndex ? "font-bold" : "font-medium")}>
                                            {item.label}
                                        </span>
                                        {index === selectedIndex && (
                                            <CornerDownLeft className="h-3 w-3 opacity-70" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {allSuggestions.length === 0 && input && (
                            <div className="p-4 text-center text-xs font-mono text-muted-foreground/60">
                                No results.
                            </div>
                        )}
                        {!input && (
                            <div className="p-2 bg-muted/20 text-[10px] text-center text-muted-foreground/40 font-mono tracking-widest uppercase border-t border-dashed border-primary/5">
                                command palette
                            </div>
                        )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
