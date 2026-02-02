"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverAnchor,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface QuickSelectorProps {
    value: string
    items: string[] | { id: string; name: string; abbreviation?: string }[]
    onSelect: (value: string) => void
    label?: string
    placeholder?: string
    icon?: React.ReactNode
    displayFormat?: 'name' | 'id' | 'text'
    popoverWidth?: string
    className?: string
}

export function QuickSelector({
    value,
    items,
    onSelect,
    label,
    placeholder = "Search...",
    icon,
    displayFormat = 'name',
    popoverWidth = "w-[200px]",
    className,
}: QuickSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [highlightedIndex, setHighlightedIndex] = React.useState(0)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Normalize items to standard format
    const normalizedItems = React.useMemo(() => {
        return items.map(item =>
            typeof item === "string" ? { id: item, name: item, abbreviation: item } : item
        )
    }, [items])

    const displayValue = React.useMemo(() => {
        const found = normalizedItems.find(i => i.id === value)
        if (!found) return value

        if (displayFormat === 'id') {
            return (found.abbreviation || found.id).toUpperCase()
        }
        if (displayFormat === 'text') {
            return found.id
        }
        return found.name
    }, [normalizedItems, value, displayFormat])

    // Sync search with display value when closed
    React.useEffect(() => {
        if (!open) {
            setSearch(displayValue)
        }
    }, [open, displayValue])

    // Filter items based on search input
    const filteredItems = React.useMemo(() => {
        if (!search || search === displayValue) return normalizedItems
        return normalizedItems.filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.id.toLowerCase().includes(search.toLowerCase()) ||
            (item.abbreviation && item.abbreviation.toLowerCase().includes(search.toLowerCase()))
        )
    }, [normalizedItems, search, displayValue])

    const handleSelect = (id: string, name: string) => {
        onSelect(id)
        // Reset search to correct display value logic
        const found = normalizedItems.find(i => i.id === id)
        let display = name
        if (displayFormat === 'id') display = (found?.abbreviation || id).toUpperCase()
        if (displayFormat === 'text') display = id
        setSearch(display)
        setOpen(false)
        inputRef.current?.blur()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === "ArrowDown" || e.key === "Enter") {
                e.preventDefault()
                setOpen(true)
            }
            return
        }

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setHighlightedIndex(i => Math.min(filteredItems.length - 1, i + 1))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setHighlightedIndex(i => Math.max(0, i - 1))
        } else if (e.key === "Enter") {
            e.preventDefault()
            const item = filteredItems[highlightedIndex]
            if (item) {
                handleSelect(item.id, item.name)
            }
        } else if (e.key === "Escape") {
            setOpen(false)
            inputRef.current?.blur()
        }
    }

    return (
        <div className="relative group">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors relative">
                <div className="shrink-0 text-muted-foreground/70 group-hover:text-primary transition-colors">
                    {icon}
                </div>

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverAnchor asChild>
                        <div className={cn("relative inline-grid grid-cols-[1fr]", className)}>
                            {/* Ghost span for auto-width */}
                            <span className="invisible col-start-1 row-start-1 whitespace-pre px-0 py-0 font-medium overflow-hidden text-ellipsis">
                                {search || placeholder}
                            </span>

                            <input
                                ref={inputRef}
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setOpen(true)
                                    setHighlightedIndex(0)
                                }}
                                onFocus={(e) => {
                                    setOpen(true)
                                    e.target.select()
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                className={cn(
                                    "col-start-1 row-start-1 w-full min-w-[10px] bg-transparent outline-none cursor-text placeholder:text-muted-foreground/50 transition-colors p-0 border-none font-medium text-left truncate",
                                    open ? "text-foreground" : "text-muted-foreground group-hover:text-primary",
                                    (displayFormat === 'id') && "uppercase"
                                )}
                            />
                        </div>
                    </PopoverAnchor>
                    <PopoverContent
                        className={cn(
                            "p-0 bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden mt-1",
                            popoverWidth
                        )}
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <ScrollArea className="h-[400px] p-1">
                            {filteredItems.length === 0 ? (
                                <div className="py-6 text-center text-xs text-muted-foreground">
                                    No results found.
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    {filteredItems.map((item, index) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item.id, item.name)}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                            className={cn(
                                                "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors",
                                                index === highlightedIndex
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-foreground hover:bg-muted/50",
                                                item.id === value && index !== highlightedIndex && "text-primary font-semibold"
                                            )}
                                        >
                                            <span className="flex-1 min-w-0 flex items-center gap-2 text-left [mask-image:linear-gradient(to_right,black_90%,transparent_100%)] overflow-hidden">
                                                {displayFormat === 'id' && (
                                                    <span className="font-mono text-[10px] opacity-70 w-16 uppercase shrink-0 text-left">
                                                        {item.abbreviation || item.id}
                                                    </span>
                                                )}
                                                <span className="whitespace-nowrap font-medium pr-4">
                                                    {item.name}
                                                </span>
                                            </span>
                                            {item.id === value && (
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-3 w-3 shrink-0",
                                                        index === highlightedIndex ? "text-primary-foreground" : "text-primary"
                                                    )}
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </PopoverContent>
                </Popover>

                <ChevronDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
        </div>
    )
}
