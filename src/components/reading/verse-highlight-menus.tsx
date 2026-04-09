"use client"

import React, { useCallback, useRef, useState } from "react"
import { motion } from "framer-motion"
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
    activeHighlightColor: string | null
}

const colorDotsRowClass = "flex flex-row items-center justify-center gap-1 px-2 py-2.5"

type DotMenuItem = typeof ContextMenuItem | typeof DropdownMenuItem

function SlidingHighlight({ containerRef, hoveredIndex }: { containerRef: React.RefObject<HTMLDivElement | null>; hoveredIndex: number | null }) {
    const [rect, setRect] = React.useState<{ top: number; height: number } | null>(null)

    React.useEffect(() => {
        if (hoveredIndex === null || !containerRef.current) {
            setRect(null)
            return
        }
        const items = containerRef.current.querySelectorAll<HTMLElement>("[data-slide-item]")
        const el = items[hoveredIndex]
        if (!el) { setRect(null); return }
        const parentRect = containerRef.current.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        setRect({ top: elRect.top - parentRect.top + containerRef.current.scrollTop, height: elRect.height })
    }, [hoveredIndex, containerRef])

    return (
        <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1 right-1 z-0 rounded-lg bg-foreground/[0.05] dark:bg-white/[0.07]"
            initial={false}
            animate={rect ? { opacity: 1, top: rect.top, height: rect.height } : { opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.5 }}
            style={{ position: "absolute" }}
        />
    )
}

function HighlightDot({ c, hot, isActiveColor }: { c: HighlightMenuColor; hot: boolean; isActiveColor: boolean }) {
    return (
        <motion.span
            className={cn(
                "relative block h-[22px] w-[22px] rounded-full",
                c.dotClass,
                isActiveColor && "ring-2 ring-foreground/20 dark:ring-white/25"
            )}
            animate={hot ? { scale: 1.2 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            whileTap={{ scale: 0.85 }}
        >
            {isActiveColor && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/20 dark:bg-black/30" aria-hidden>
                    <X className="h-3 w-3 text-white" strokeWidth={2.5} />
                </span>
            )}
        </motion.span>
    )
}

function useDotsHover() {
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const rowRef = useRef<HTMLDivElement>(null)
    const onLeave = useCallback(() => setHoveredId(null), [])
    const bind = useCallback((id: string) => ({
        onPointerEnter: () => setHoveredId(id),
        onFocus: () => setHoveredId(id),
    }), [])
    return { rowRef, hoveredId, onLeave, bind }
}

function DotPicker({ Item, applyColor, activeHighlightColor }: { Item: DotMenuItem; applyColor: (c: string) => void; activeHighlightColor: string | null }) {
    const { rowRef, hoveredId, onLeave, bind } = useDotsHover()
    const GroupComp = Item === ContextMenuItem ? ContextMenuGroup : DropdownMenuGroup

    return (
        <GroupComp className="p-0">
            <div ref={rowRef} role="presentation" className={colorDotsRowClass} onPointerLeave={onLeave}>
                {HIGHLIGHT_MENU_COLORS.map((c) => {
                    const { onPointerEnter, onFocus } = bind(c.id)
                    const isActive = activeHighlightColor === c.id
                    return (
                        <Item
                            key={c.id}
                            aria-label={isActive ? c.removeLabel : c.label}
                            className="cursor-pointer relative h-7 w-7 shrink-0 items-center justify-center rounded-full p-0 outline-none !bg-transparent"
                            onSelect={() => applyColor(c.id)}
                            onPointerEnter={onPointerEnter}
                            onFocus={onFocus}
                        >
                            <HighlightDot c={c} hot={hoveredId === c.id} isActiveColor={isActive} />
                        </Item>
                    )
                })}
            </div>
        </GroupComp>
    )
}

function ActionItems({
    Item,
    Separator,
    onNote,
    onCopy,
    onShare,
    copyDone,
}: {
    Item: DotMenuItem
    Separator: React.ComponentType<{ className?: string }>
    onNote: () => void
    onCopy: () => void
    onShare: () => void
    copyDone: boolean
}) {
    const listRef = useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = useState<number | null>(null)

    const actions = [
        { label: "Note", icon: <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />, onSelect: onNote },
        { label: "Copy", icon: copyDone ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />, onSelect: onCopy },
        { label: "Share", icon: <Share2 className="h-3.5 w-3.5 text-muted-foreground" />, onSelect: onShare },
    ]

    return (
        <>
            <Separator className="bg-foreground/[0.06] dark:bg-white/[0.06]" />
            <div ref={listRef} className="relative py-0.5" onPointerLeave={() => setHovered(null)}>
                <SlidingHighlight containerRef={listRef} hoveredIndex={hovered} />
                {actions.map((a, i) => (
                    <Item
                        key={a.label}
                        data-slide-item
                        onSelect={a.onSelect}
                        onPointerEnter={() => setHovered(i)}
                        className="relative z-10 flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium outline-none transition-colors text-popover-foreground !bg-transparent"
                    >
                        {a.icon}
                        {a.label}
                    </Item>
                ))}
            </div>
        </>
    )
}

export function VerseHighlightContextMenuContent({ handlers }: { handlers: VerseHighlightMenuHandlers }) {
    const { applyColor, onNote, onCopy, onShare, copyDone, activeHighlightColor } = handlers
    return (
        <ContextMenuContent className="ow-menu-surface glass w-56 overflow-hidden rounded-2xl p-1 text-popover-foreground" aria-label="Highlight options">
            <DotPicker Item={ContextMenuItem} applyColor={applyColor} activeHighlightColor={activeHighlightColor} />
            <ActionItems Item={ContextMenuItem} Separator={ContextMenuSeparator} onNote={onNote} onCopy={onCopy} onShare={onShare} copyDone={copyDone} />
        </ContextMenuContent>
    )
}

export function VerseHighlightDropdownMenuContent({ handlers }: { handlers: VerseHighlightMenuHandlers }) {
    const { applyColor, onNote, onCopy, onShare, copyDone, activeHighlightColor } = handlers
    return (
        <DropdownMenuContent
            className="ow-menu-surface glass w-56 overflow-hidden rounded-2xl p-1 text-popover-foreground"
            align="start"
            sideOffset={4}
            aria-label="Highlight options"
            onCloseAutoFocus={(e) => e.preventDefault()}
        >
            <DotPicker Item={DropdownMenuItem} applyColor={applyColor} activeHighlightColor={activeHighlightColor} />
            <ActionItems Item={DropdownMenuItem} Separator={DropdownMenuSeparator} onNote={onNote} onCopy={onCopy} onShare={onShare} copyDone={copyDone} />
        </DropdownMenuContent>
    )
}
