"use client"

/**
 * OpenWrit combobox primitives: Popover + Command (shadcn pattern).
 * Prefer importing Popover + Command* directly for custom layouts (e.g. QuickSelector).
 */

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface ComboboxOption {
    value: string
    label: string
}

interface ComboboxProps {
    options: ComboboxOption[]
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    className?: string
    buttonClassName?: string
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = "Select…",
    searchPlaceholder = "Search…",
    emptyText = "No results.",
    className,
    buttonClassName,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)

    const selected = options.find((o) => o.value === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "h-9 justify-between rounded-md border-border/40 font-mono text-xs font-normal",
                        buttonClassName
                    )}
                >
                    {selected ? selected.label : placeholder}
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0", className)} align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} className="h-9" />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.value} ${option.label}`}
                                    onSelect={() => {
                                        onValueChange(option.value)
                                        setOpen(false)
                                    }}
                                >
                                    {option.label}
                                    <Check
                                        className={cn(
                                            "ml-auto h-3.5 w-3.5",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
