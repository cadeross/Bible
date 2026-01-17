"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface QuickSelectorProps {
    value: string
    items: string[] | { id: string; name: string }[]
    onSelect: (value: string) => void
    label?: string
    placeholder?: string
    icon?: React.ReactNode
}

export function QuickSelector({
    value,
    items,
    onSelect,
    label,
    placeholder = "Search...",
    icon,
}: QuickSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [highlightedIndex, setHighlightedIndex] = React.useState(0)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Normalize items to standard format
    const normalizedItems = React.useMemo(() => {
        return items.map(item =>
            typeof item === "string" ? { id: item, name: item } : item
        )
    }, [items])

    // Filter items
    const filteredItems = React.useMemo(() => {
        if (!search) return normalizedItems
        return normalizedItems.filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase())
        )
    }, [normalizedItems, search])

    const displayValue = React.useMemo(() => {
        const found = normalizedItems.find(i => i.id === value)
        return found ? found.name : value
    }, [normalizedItems, value])

    // Focus input on open
    React.useEffect(() => {
        if (open) {
            setSearch("")
            setHighlightedIndex(0)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open])

    // Basic keyboard nav
    const handleKeyDown = (e: React.KeyboardEvent) => {
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
                onSelect(item.id)
                setOpen(false)
            }
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors outline-none select-none group"
                    )}
                >
                    {icon}
                    <span className="group-hover:text-foreground transition-colors">{displayValue}</span>
                    <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[200px] p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden"
                align="start"
                sideOffset={8}
            >
                {/* Search Input */}
                <div className="flex items-center px-3 py-2 border-b border-border/10 bg-muted/20">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        ref={inputRef}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setHighlightedIndex(0) // Reset highlight on search change
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex h-6 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                {/* List */}
                <ScrollArea className="h-[200px] p-1">
                    {filteredItems.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground">
                            No results found.
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {filteredItems.map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onSelect(item.id)
                                        setOpen(false)
                                    }}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={cn(
                                        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                        index === highlightedIndex
                                            ? "bg-primary text-primary-foreground"
                                            : "text-foreground hover:bg-muted/50",
                                        item.id === value && index !== highlightedIndex && "text-primary font-semibold"
                                    )}
                                >
                                    {item.name}
                                    {item.id === value && (
                                        <Check
                                            className={cn(
                                                "ml-auto h-3 w-3",
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
    )
}
