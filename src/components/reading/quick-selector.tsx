"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"

interface QuickSelectorProps {
    value: string
    items: string[] | { id: string; name: string; abbreviation?: string }[]
    onSelect: (value: string) => void
    label?: string
    placeholder?: string
    icon?: React.ReactNode
    displayFormat?: "name" | "id" | "text"
    popoverWidth?: string
    className?: string
}

export function QuickSelector({
    value,
    items,
    onSelect,
    placeholder = "Search...",
    icon,
    displayFormat = "name",
    popoverWidth = "w-[200px]",
    className,
}: QuickSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [activeIndex, setActiveIndex] = React.useState(0)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLDivElement>(null)
    const listboxId = React.useId().replace(/:/g, "")

    const normalizedItems = React.useMemo(() => {
        return items.map((item) =>
            typeof item === "string" ? { id: item, name: item, abbreviation: item } : item
        )
    }, [items])

    const displayValue = React.useMemo(() => {
        const found = normalizedItems.find((i) => i.id === value)
        if (!found) return value

        if (displayFormat === "id") {
            return (found.abbreviation || found.id).toUpperCase()
        }
        if (displayFormat === "text") {
            return found.id
        }
        return found.name
    }, [normalizedItems, value, displayFormat])

    React.useEffect(() => {
        if (!open) {
            setSearch(displayValue)
        }
    }, [open, displayValue])

    const filteredItems = React.useMemo(() => {
        if (!search || search === displayValue) return normalizedItems
        return normalizedItems.filter(
            (item) =>
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.id.toLowerCase().includes(search.toLowerCase()) ||
                (item.abbreviation && item.abbreviation.toLowerCase().includes(search.toLowerCase()))
        )
    }, [normalizedItems, search, displayValue])

    React.useEffect(() => {
        setActiveIndex(0)
    }, [open, filteredItems.length, search])

    React.useEffect(() => {
        if (!open || filteredItems.length === 0) return
        const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-qs-index="${activeIndex}"]`)
        el?.scrollIntoView({ block: "nearest" })
    }, [activeIndex, open, filteredItems.length])

    const handleSelect = (id: string, name: string) => {
        onSelect(id)
        const found = normalizedItems.find((i) => i.id === id)
        let display = name
        if (displayFormat === "id") display = (found?.abbreviation || id).toUpperCase()
        if (displayFormat === "text") display = id
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

        if (e.key === "Escape") {
            setOpen(false)
            inputRef.current?.blur()
            return
        }

        if (filteredItems.length === 0) return

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setActiveIndex((i) => Math.min(i + 1, filteredItems.length - 1))
            return
        }
        if (e.key === "ArrowUp") {
            e.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
            return
        }
        if (e.key === "Enter") {
            e.preventDefault()
            const item = filteredItems[activeIndex]
            if (item) handleSelect(item.id, item.name)
        }
    }

    return (
        <div className="group relative">
            <div className="relative flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors">
                <div className="shrink-0 text-muted-foreground/70 transition-colors group-hover:text-primary">
                    {icon}
                </div>

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverAnchor asChild>
                        <div className={cn("relative inline-grid grid-cols-[1fr]", className)}>
                            <span className="invisible col-start-1 row-start-1 overflow-hidden text-ellipsis whitespace-pre px-0 py-0 font-medium">
                                {search || placeholder}
                            </span>

                            <input
                                ref={inputRef}
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setOpen(true)
                                }}
                                onFocus={(e) => {
                                    setOpen(true)
                                    e.target.select()
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={placeholder}
                                aria-expanded={open}
                                aria-haspopup="listbox"
                                aria-controls={open ? listboxId : undefined}
                                autoComplete="off"
                                className={cn(
                                    "col-start-1 row-start-1 w-full min-w-[10px] cursor-text truncate border-none bg-transparent p-0 text-left font-medium outline-none transition-colors placeholder:text-muted-foreground/50",
                                    open ? "text-foreground" : "text-muted-foreground group-hover:text-primary",
                                    displayFormat === "id" && "uppercase"
                                )}
                            />
                        </div>
                    </PopoverAnchor>
                    <PopoverContent
                        className={cn("z-[100] p-0", popoverWidth)}
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <div
                            ref={listRef}
                            id={listboxId}
                            role="listbox"
                            aria-activedescendant={
                                open && filteredItems[activeIndex]
                                    ? `${listboxId}-opt-${filteredItems[activeIndex].id}`
                                    : undefined
                            }
                            className="max-h-[400px] overflow-y-auto overflow-x-hidden p-1"
                        >
                            {filteredItems.length === 0 ? (
                                <div className="py-6 text-center text-xs font-mono text-muted-foreground">
                                    No results found.
                                </div>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        id={`${listboxId}-opt-${item.id}`}
                                        role="option"
                                        data-qs-index={index}
                                        aria-selected={item.id === value}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSelect(item.id, item.name)}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        className={cn(
                                            "flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-mono outline-none transition-colors",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            "focus-visible:bg-accent focus-visible:text-accent-foreground",
                                            index === activeIndex && "bg-accent text-accent-foreground",
                                            item.id === value && "text-primary"
                                        )}
                                    >
                                        <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-left">
                                            {displayFormat === "id" && (
                                                <span className="w-16 shrink-0 text-left font-mono text-[10px] uppercase opacity-70">
                                                    {item.abbreviation || item.id}
                                                </span>
                                            )}
                                            <span className="truncate pr-4 font-medium">{item.name}</span>
                                        </span>
                                        {item.id === value && (
                                            <Check className="ml-auto h-3 w-3 shrink-0 text-primary" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <ChevronDown className="pointer-events-none h-3 w-3 opacity-30 transition-opacity group-hover:opacity-100" />
            </div>
        </div>
    )
}
