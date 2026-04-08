"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { motion, type Transition } from "framer-motion"
import { Check, Copy, Share2, StickyNote, X } from "lucide-react"
import {
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuSeparator,
} from "@/components/ui/context-menu"
import {
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { HIGHLIGHT_MENU_COLORS } from "@/lib/highlight-menu"

type HighlightMenuColor = (typeof HIGHLIGHT_MENU_COLORS)[number]

export interface VerseHighlightMenuHandlers {
    applyColor: (color: string) => void
    onNote: () => void
    onCopy: () => void
    onShare: () => void
    copyDone: boolean
    /** When every selected verse uses this color, that swatch shows an X and removes on click. */
    activeHighlightColor: string | null
}

const menuSurfaceClass =
    "ow-menu-surface glass w-56 overflow-visible rounded-xl border border-white/[0.15] bg-foreground/90 p-1 text-background shadow-[var(--shadow-elevated)] dark:border-white/[0.08] dark:bg-muted/90 dark:text-foreground/85"

/** Tight strip: closer to menu left/right edges */
const colorDotsRowClass =
    "flex flex-row flex-wrap items-center justify-center gap-0.5 px-0 py-1.5 -mx-1.5"

const menuSeparatorClass = "bg-white/12 dark:bg-border/40"

const colorDotItemClass =
    "cursor-pointer relative z-0 h-8 w-8 shrink-0 justify-center rounded-full p-0 outline-none transition-colors data-[highlighted]:z-10 data-[highlighted]:bg-white/12 dark:data-[highlighted]:bg-white/10"

const menuActionItemClass =
    "cursor-pointer text-background focus:bg-white/12 focus:text-background data-[highlighted]:bg-white/12 data-[highlighted]:text-background dark:text-foreground/90 dark:focus:bg-accent/50 dark:focus:text-accent-foreground dark:data-[highlighted]:bg-accent/50 dark:data-[highlighted]:text-accent-foreground"

const springIn: Transition = {
    type: "spring",
    stiffness: 320,
    damping: 22,
    mass: 0.48,
    bounce: 0.22,
}

const springOut: Transition = {
    type: "spring",
    stiffness: 240,
    damping: 26,
    mass: 0.55,
    bounce: 0.16,
}

const springTap: Transition = {
    type: "spring",
    stiffness: 480,
    damping: 16,
    mass: 0.42,
    bounce: 0.2,
}

type DotMenuItem = typeof ContextMenuItem | typeof DropdownMenuItem

function HighlightColorDotVisual({
    c,
    index,
    hot,
    isActiveColor,
}: {
    c: HighlightMenuColor
    index: number
    hot: boolean
    isActiveColor: boolean
}) {
    return (
        <motion.span
            className={cn(
                "relative block h-5 w-5 rounded-full",
                c.dotClass,
                isActiveColor && "ring-2 ring-white/50 dark:ring-white/30"
            )}
            animate={hot ? { scale: 1.25 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            whileTap={{ scale: 0.85 }}
        >
            {isActiveColor && (
                <span
                    className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/25 dark:bg-black/35"
                    aria-hidden
                >
                    <X className="h-3 w-3 text-white drop-shadow-sm" strokeWidth={2.5} />
                </span>
            )}
        </motion.span>
    )
}

function useHighlightColorDotsRowState() {
    const [pointerInRow, setPointerInRow] = useState(false)
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const [focusedId, setFocusedId] = useState<string | null>(null)

    const leaveRowIfOutside = useCallback((current: EventTarget | null, related: EventTarget | null) => {
        const el = current as HTMLElement | null
        const next = related as Node | null
        if (!el) return true
        if (next && el.contains(next)) return false
        return true
    }, [])

    const onRowPointerLeave = useCallback(
        (e: React.PointerEvent<HTMLElement>) => {
            if (!leaveRowIfOutside(e.currentTarget, e.relatedTarget)) return
            setPointerInRow(false)
            setHoveredId(null)
        },
        [leaveRowIfOutside]
    )

    const rowRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = rowRef.current
        if (!el) return
        const onFocusOut = (e: FocusEvent) => {
            if (!leaveRowIfOutside(e.currentTarget, e.relatedTarget)) return
            setFocusedId(null)
        }
        el.addEventListener("focusout", onFocusOut)
        return () => el.removeEventListener("focusout", onFocusOut)
    }, [leaveRowIfOutside])

    const isHot = useCallback(
        (id: string) => (pointerInRow ? hoveredId === id : focusedId === id),
        [pointerInRow, hoveredId, focusedId]
    )

    const bindDotItem = useCallback((id: string) => ({
        onPointerEnter: () => {
            setPointerInRow(true)
            setHoveredId(id)
        },
        onFocus: () => setFocusedId(id),
    }), [])

    return { rowRef, onRowPointerLeave, isHot, bindDotItem }
}

function HighlightColorPickItem({
    Item,
    c,
    index,
    applyColor,
    hot,
    bindDotItem,
    activeHighlightColor,
}: {
    Item: DotMenuItem
    c: HighlightMenuColor
    index: number
    applyColor: (id: string) => void
    hot: boolean
    bindDotItem: (id: string) => {
        onPointerEnter: () => void
        onFocus: () => void
    }
    activeHighlightColor: string | null
}) {
    const { onPointerEnter, onFocus } = bindDotItem(c.id)
    const isActiveColor = activeHighlightColor === c.id
    return (
        <Item
            aria-label={isActiveColor ? c.removeLabel : c.label}
            className={colorDotItemClass}
            onSelect={() => applyColor(c.id)}
            onPointerEnter={onPointerEnter}
            onFocus={onFocus}
        >
            <HighlightColorDotVisual
                c={c}
                index={index}
                hot={hot}
                isActiveColor={isActiveColor}
            />
        </Item>
    )
}

function HighlightColorDotsContext({
    applyColor,
    activeHighlightColor,
}: {
    applyColor: (c: string) => void
    activeHighlightColor: string | null
}) {
    const { rowRef, onRowPointerLeave, isHot, bindDotItem } = useHighlightColorDotsRowState()
    return (
        <ContextMenuGroup className="p-0">
            <div
                ref={rowRef}
                role="presentation"
                className={colorDotsRowClass}
                onPointerLeave={onRowPointerLeave}
            >
                {HIGHLIGHT_MENU_COLORS.map((c, index) => (
                    <HighlightColorPickItem
                        key={c.id}
                        Item={ContextMenuItem}
                        c={c}
                        index={index}
                        applyColor={applyColor}
                        hot={isHot(c.id)}
                        bindDotItem={bindDotItem}
                        activeHighlightColor={activeHighlightColor}
                    />
                ))}
            </div>
        </ContextMenuGroup>
    )
}

function HighlightColorDotsDropdown({
    applyColor,
    activeHighlightColor,
}: {
    applyColor: (c: string) => void
    activeHighlightColor: string | null
}) {
    const { rowRef, onRowPointerLeave, isHot, bindDotItem } = useHighlightColorDotsRowState()
    return (
        <DropdownMenuGroup className="p-0">
            <div
                ref={rowRef}
                role="presentation"
                className={colorDotsRowClass}
                onPointerLeave={onRowPointerLeave}
            >
                {HIGHLIGHT_MENU_COLORS.map((c, index) => (
                    <HighlightColorPickItem
                        key={c.id}
                        Item={DropdownMenuItem}
                        c={c}
                        index={index}
                        applyColor={applyColor}
                        hot={isHot(c.id)}
                        bindDotItem={bindDotItem}
                        activeHighlightColor={activeHighlightColor}
                    />
                ))}
            </div>
        </DropdownMenuGroup>
    )
}

/** Sliding highlight behind Note / Copy / Share as pointer or focus moves. */
function FluidMenuActionShell({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dims, setDims] = useState<{ top: number; height: number } | null>(null)

    const showFor = useCallback((target: EventTarget | null) => {
        const el = target as HTMLElement | null
        const parent = containerRef.current
        if (!el || !parent) return
        const pr = parent.getBoundingClientRect()
        const er = el.getBoundingClientRect()
        setDims({ top: er.top - pr.top + parent.scrollTop, height: er.height })
    }, [])

    const clearIfLeaving = useCallback((e: React.PointerEvent) => {
        const next = e.relatedTarget as Node | null
        if (next && containerRef.current?.contains(next)) return
        setDims(null)
    }, [])

    return (
        <div
            ref={containerRef}
            className="relative py-0.5"
            onPointerLeave={clearIfLeaving}
        >
            <motion.div
                aria-hidden
                className="pointer-events-none absolute left-0.5 right-0.5 z-0 rounded-md bg-white/12 dark:bg-white/10"
                initial={false}
                animate={
                    dims && dims.height > 0
                        ? { opacity: 1, top: dims.top, height: dims.height }
                        : { opacity: 0, top: 0, height: 0 }
                }
                transition={{ type: "spring", stiffness: 520, damping: 36, mass: 0.55 }}
                style={{ position: "absolute" }}
            />
            {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child
                const el = child as React.ReactElement<{
                    className?: string
                    onPointerEnter?: React.PointerEventHandler
                    onPointerLeave?: React.PointerEventHandler
                    onFocus?: React.FocusEventHandler
                }>
                return React.cloneElement(el, {
                    className: cn(
                        "relative z-[1] bg-transparent data-[highlighted]:bg-transparent focus-visible:bg-transparent",
                        el.props.className
                    ),
                    onPointerEnter: (e) => {
                        showFor(e.currentTarget)
                        el.props.onPointerEnter?.(e)
                    },
                    onFocus: (e) => {
                        showFor(e.currentTarget)
                        el.props.onFocus?.(e)
                    },
                })
            })}
        </div>
    )
}

export function VerseHighlightContextMenuContent({
    handlers,
}: {
    handlers: VerseHighlightMenuHandlers
}) {
    const { applyColor, onNote, onCopy, onShare, copyDone, activeHighlightColor } = handlers
    return (
        <ContextMenuContent className={menuSurfaceClass} aria-label="Highlight options">
            <HighlightColorDotsContext applyColor={applyColor} activeHighlightColor={activeHighlightColor} />
            <ContextMenuSeparator className={menuSeparatorClass} />
            <FluidMenuActionShell>
                <ContextMenuItem className={menuActionItemClass} onSelect={onNote}>
                    <StickyNote className="h-3.5 w-3.5" />
                    Note
                </ContextMenuItem>
                <ContextMenuItem className={menuActionItemClass} onSelect={onCopy}>
                    {copyDone ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy
                </ContextMenuItem>
                <ContextMenuItem className={menuActionItemClass} onSelect={onShare}>
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                </ContextMenuItem>
            </FluidMenuActionShell>
        </ContextMenuContent>
    )
}

export function VerseHighlightDropdownMenuContent({
    handlers,
}: {
    handlers: VerseHighlightMenuHandlers
}) {
    const { applyColor, onNote, onCopy, onShare, copyDone, activeHighlightColor } = handlers
    return (
        <DropdownMenuContent
            className={menuSurfaceClass}
            align="start"
            sideOffset={4}
            aria-label="Highlight options"
            onCloseAutoFocus={(e) => e.preventDefault()}
        >
            <HighlightColorDotsDropdown applyColor={applyColor} activeHighlightColor={activeHighlightColor} />
            <DropdownMenuSeparator className={menuSeparatorClass} />
            <FluidMenuActionShell>
                <DropdownMenuItem className={menuActionItemClass} onSelect={onNote}>
                    <StickyNote className="h-3.5 w-3.5" />
                    Note
                </DropdownMenuItem>
                <DropdownMenuItem className={menuActionItemClass} onSelect={onCopy}>
                    {copyDone ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy
                </DropdownMenuItem>
                <DropdownMenuItem className={menuActionItemClass} onSelect={onShare}>
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                </DropdownMenuItem>
            </FluidMenuActionShell>
        </DropdownMenuContent>
    )
}
