"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverAnchor,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

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
    const inputRef = React.useRef<HTMLInputElement>(null)

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
                                className={cn(
                                    "col-start-1 row-start-1 w-full min-w-[10px] cursor-text truncate border-none bg-transparent p-0 text-left font-medium outline-none transition-colors placeholder:text-muted-foreground/50",
                                    open ? "text-foreground" : "text-muted-foreground group-hover:text-primary",
                                    displayFormat === "id" && "uppercase"
                                )}
                            />
                        </div>
                    </PopoverAnchor>
                    <PopoverContent
                        className={cn("p-0", popoverWidth)}
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <Command shouldFilter={false}>
                            <CommandList className="max-h-[400px]">
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup>
                                    {filteredItems.map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={`${item.id}\u200b${item.name}`}
                                            onSelect={() => handleSelect(item.id, item.name)}
                                            className={cn(
                                                "font-mono text-xs",
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
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <ChevronDown className="pointer-events-none h-3 w-3 opacity-30 transition-opacity group-hover:opacity-100" />
            </div>
        </div>
    )
}
