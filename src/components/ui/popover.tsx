"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                "ow-menu-surface z-50 w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-[0_8px_30px_rgba(0,0,0,0.12)] outline-none dark:shadow-[0_12px_40px_rgba(0,0,0,0.55)]",
                className
            )}
            {...props}
        />
    </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

const PopoverAnchor = PopoverPrimitive.Anchor

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
