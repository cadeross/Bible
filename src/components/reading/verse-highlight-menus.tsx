"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, type Transition } from "framer-motion"
import { Check, Copy, Share2, StickyNote, Trash2 } from "lucide-react"
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
    onClear: () => void
    copyDone: boolean
}

const menuSurfaceClass =
    "ow-menu-surface w-56 overflow-visible rounded-lg border border-border bg-popover p-1 font-mono text-popover-foreground shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.55)]"

const colorDotsRowClass =
    "flex flex-row flex-wrap items-center justify-center gap-1 px-0 py-2 -mx-1"

const colorDotItemClass =
    "relative z-0 h-8 w-8 shrink-0 justify-center rounded-full p-0 outline-none transition-colors data-[highlighted]:z-10 data-[highlighted]:bg-accent/40"

/** Subtle springs — small overshoot, smooth handoff when moving between items */
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

function HighlightColorDotVisual({ c, index, hot }: { c: HighlightMenuColor; index: number; hot: boolean }) {
    const tilt = index % 2 === 0 ? -11 : 11
    return (
        <motion.span
            className={cn(
                "block h-5 w-5 rounded-full ring-1 ring-inset ring-black/15 dark:ring-white/20",
                hot
                    ? "shadow-md ring-2 ring-foreground/25 ring-offset-2 ring-offset-[var(--popover)] dark:ring-white/40"
                    : "shadow-sm",
                c.dotClass
            )}
            style={{ transformOrigin: "50% 85%" }}
            animate={
                hot
                    ? { scale: 1.18, y: -4, rotate: tilt }
                    : { scale: 1, y: 0, rotate: 0 }
            }
            transition={hot ? springIn : springOut}
            whileTap={{
                scale: 0.74,
                y: 2,
                rotate: tilt * -0.28,
                transition: springTap,
            }}
        />
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
}) {
    const { onPointerEnter, onFocus } = bindDotItem(c.id)
    return (
        <Item
            aria-label={c.label}
            className={colorDotItemClass}
            onSelect={() => applyColor(c.id)}
            onPointerEnter={onPointerEnter}
            onFocus={onFocus}
        >
            <HighlightColorDotVisual c={c} index={index} hot={hot} />
        </Item>
    )
}

function HighlightColorDotsContext({ applyColor }: { applyColor: (c: string) => void }) {
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
                    />
                ))}
            </div>
        </ContextMenuGroup>
    )
}

function HighlightColorDotsDropdown({ applyColor }: { applyColor: (c: string) => void }) {
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
                    />
                ))}
            </div>
        </DropdownMenuGroup>
    )
}

export function VerseHighlightContextMenuContent({
    handlers,
}: {
    handlers: VerseHighlightMenuHandlers
}) {
    const { applyColor, onNote, onCopy, onShare, onClear, copyDone } = handlers
    return (
        <ContextMenuContent className={menuSurfaceClass} aria-label="Highlight options">
            <HighlightColorDotsContext applyColor={applyColor} />
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={onNote}>
                <StickyNote className="h-3.5 w-3.5" />
                Note
            </ContextMenuItem>
            <ContextMenuItem onSelect={onCopy}>
                {copyDone ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
            </ContextMenuItem>
            <ContextMenuItem onSelect={onShare}>
                <Share2 className="h-3.5 w-3.5" />
                Share
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={onClear} className="text-destructive focus:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Remove highlight
            </ContextMenuItem>
        </ContextMenuContent>
    )
}

export function VerseHighlightDropdownMenuContent({
    handlers,
}: {
    handlers: VerseHighlightMenuHandlers
}) {
    const { applyColor, onNote, onCopy, onShare, onClear, copyDone } = handlers
    return (
        <DropdownMenuContent
            className={menuSurfaceClass}
            align="start"
            sideOffset={4}
            aria-label="Highlight options"
            onCloseAutoFocus={(e) => e.preventDefault()}
        >
            <HighlightColorDotsDropdown applyColor={applyColor} />
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onNote}>
                <StickyNote className="h-3.5 w-3.5" />
                Note
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onCopy}>
                {copyDone ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onShare}>
                <Share2 className="h-3.5 w-3.5" />
                Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onClear} className="text-destructive focus:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                Remove highlight
            </DropdownMenuItem>
        </DropdownMenuContent>
    )
}
