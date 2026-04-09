"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BOOK_LIST } from "@/lib/bible-api"
import { parseReferenceJump } from "@/lib/reference-jump"
import { OPEN_COMMAND_MENU_EVENT } from "@/lib/open-command-menu"
import type { BibleSearchVerse } from "@/app/api/bible-search/route"
import { Search, CornerDownLeft, BookOpen } from "lucide-react"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

// ─── Helpers ────────────────────────────────────────────────────────────────

function isTypingInField(el: EventTarget | null): boolean {
    if (!el || !(el instanceof HTMLElement)) return false
    if (el.isContentEditable) return true
    const tag = el.tagName
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
}

function isPrintableKey(e: KeyboardEvent): boolean {
    if (e.metaKey || e.ctrlKey || e.altKey) return false
    if (e.key.length !== 1) return false
    const c = e.key.charCodeAt(0)
    return c >= 32 && c !== 127
}

// ─── Spring sliding highlight ────────────────────────────────────────────────

function SlidingHighlight({
    containerRef,
    hoveredIndex,
}: {
    containerRef: React.RefObject<HTMLDivElement | null>
    hoveredIndex: number | null
}) {
    const [rect, setRect] = React.useState<{ top: number; height: number } | null>(null)

    React.useEffect(() => {
        if (hoveredIndex === null || !containerRef.current) { setRect(null); return }
        const items = containerRef.current.querySelectorAll<HTMLElement>("[data-result-item]")
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

// ─── Result group (section body with shared sliding highlight) ───────────────

function ResultGroup({
    items,
}: {
    items: Array<{ key: string; content: React.ReactNode; onClick: () => void }>
}) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = React.useState<number | null>(null)

    return (
        <div
            ref={containerRef}
            className="relative px-1 pb-1"
            onPointerLeave={() => setHovered(null)}
        >
            <SlidingHighlight containerRef={containerRef} hoveredIndex={hovered} />
            {items.map((item, i) => (
                <button
                    key={item.key}
                    type="button"
                    data-result-item
                    onClick={item.onClick}
                    onPointerEnter={() => setHovered(i)}
                    className="relative z-10 w-full cursor-pointer text-left rounded-lg"
                >
                    {item.content}
                </button>
            ))}
        </div>
    )
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/35 select-none">
                {label}
            </div>
            {children}
        </div>
    )
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function SearchPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [input, setInput] = React.useState("")
    const [verses, setVerses] = React.useState<BibleSearchVerse[]>([])
    const [searchLoading, setSearchLoading] = React.useState(false)
    const [searchSource, setSearchSource] = React.useState<string | null>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const openRef = React.useRef(open)
    const router = useRouter()
    const { bibleVersion, isLoaded } = useReadingPreferences()

    React.useEffect(() => { openRef.current = open }, [open])

    // When the panel opens: focus the input but do NOT clear it —
    // the keyboard handler may have already pre-filled it with the trigger key.
    React.useEffect(() => {
        if (open) {
            setVerses([])
            setSearchSource(null)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open])

    const close = React.useCallback(() => {
        onOpenChange(false)
        setInput("")
        setVerses([])
        setSearchSource(null)
        setSearchLoading(false)
    }, [onOpenChange])

    // Custom event (e.g. from nav button)
    React.useEffect(() => {
        const onPaletteOpen = (e: Event) => {
            const detail = (e as CustomEvent<{ query?: string }>).detail
            setInput(detail?.query ?? "")
            onOpenChange(true)
        }
        window.addEventListener(OPEN_COMMAND_MENU_EVENT, onPaletteOpen as EventListener)
        return () => window.removeEventListener(OPEN_COMMAND_MENU_EVENT, onPaletteOpen as EventListener)
    }, [onOpenChange])

    // Global keydown: ⌘K or any printable char opens the panel
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLElement | null

            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                if (openRef.current) { close(); return }
                if (isTypingInField(el)) return
                setInput("")
                onOpenChange(true)
                return
            }

            if (openRef.current) return
            if (isTypingInField(el)) return
            if (!isPrintableKey(e)) return

            e.preventDefault()
            setInput(e.key)   // pre-fill with the trigger key
            onOpenChange(true)
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [close, onOpenChange])

    // Debounced full-text search
    React.useEffect(() => {
        const q = input.trim()
        if (q.length < 2) {
            setVerses([])
            setSearchSource(null)
            setSearchLoading(false)
            return
        }
        setSearchLoading(true)
        const id = window.setTimeout(async () => {
            try {
                const params = new URLSearchParams({ q })
                if (isLoaded && bibleVersion) params.set("translation", bibleVersion)
                const res = await fetch(`/api/bible-search?${params}`)
                const data = await res.json()
                setVerses(data.verses ?? [])
                setSearchSource(data.source ?? null)
            } catch {
                setVerses([])
                setSearchSource("error")
            } finally {
                setSearchLoading(false)
            }
        }, 280)
        return () => window.clearTimeout(id)
    }, [input, bibleVersion, isLoaded])

    const jumpTarget = React.useMemo(() => parseReferenceJump(input), [input])

    const bookItems = React.useMemo(() => {
        if (!input.trim()) return []
        const lower = input.toLowerCase()
        return BOOK_LIST.filter((b) => b.toLowerCase().includes(lower)).map((b) => ({
            key: b,
            label: b,
            action: () => { router.push(`/read/${b}/1?translation=${bibleVersion || "web"}`); close() },
        }))
    }, [input, router, bibleVersion, close])

    const jumpItem = React.useMemo(() => {
        if (!jumpTarget || !input.trim()) return null
        const { book, chapter, verse } = jumpTarget
        const refLabel = verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`
        return {
            label: `Open ${refLabel}`,
            action: () => {
                let url = `/read/${book}/${chapter}?translation=${bibleVersion || "web"}`
                if (verse) url += `&v=${verse}`
                router.push(url)
                close()
            },
        }
    }, [jumpTarget, input, router, bibleVersion, close])

    const hasJump   = Boolean(jumpItem)
    const hasBooks  = bookItems.length > 0
    const hasVerses = verses.length > 0
    const showEmpty = input.trim().length > 0 && !hasJump && !hasBooks && !hasVerses && !searchLoading

    return (
        <div className="w-[360px] max-h-[min(70vh,480px)] overflow-hidden flex flex-col">

            {/* ── Input row ── */}
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-2.5">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") close() }}
                    placeholder="Book, reference, or search…"
                    className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/35"
                />
                {input ? (
                    <kbd className="text-[10px] text-muted-foreground/30 shrink-0">esc</kbd>
                ) : (
                    <kbd className="text-[10px] text-muted-foreground/25 shrink-0 border border-muted-foreground/15 rounded px-1 py-0.5">⌘K</kbd>
                )}
            </div>

            {/* ── Results ── */}
            <div className="flex-1 overflow-y-auto">

                {/* Idle state */}
                {!input.trim() && (
                    <div className="px-3 py-8 text-center text-xs text-muted-foreground/35 select-none">
                        Type to search scripture
                    </div>
                )}

                {/* Jump to reference */}
                {hasJump && jumpItem && (
                    <Section label="Jump to">
                        <ResultGroup items={[{
                            key: "jump",
                            onClick: jumpItem.action,
                            content: (
                                <div className="flex items-center gap-2.5 px-3 py-2">
                                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                                    <span className="text-[13px] font-medium text-foreground">{jumpItem.label}</span>
                                </div>
                            ),
                        }]} />
                    </Section>
                )}

                {/* Books */}
                {hasBooks && (
                    <Section label="Books">
                        <ResultGroup items={bookItems.slice(0, 8).map((item) => ({
                            key: item.key,
                            onClick: item.action,
                            content: (
                                <div className="flex items-center gap-2.5 px-3 py-2">
                                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                                    <span className="text-[13px] font-medium text-foreground">{item.label}</span>
                                </div>
                            ),
                        }))} />
                    </Section>
                )}

                {/* Verses */}
                {(searchLoading || hasVerses || searchSource === "no-api-key") && (
                    <Section label="Verses">
                        {searchLoading && (
                            <div className="px-4 py-3 text-[12px] text-muted-foreground/40">
                                Searching…
                            </div>
                        )}
                        {!searchLoading && searchSource === "no-api-key" && (
                            <div className="px-4 py-3 text-[12px] text-muted-foreground/40">
                                Full-text search requires an API key
                            </div>
                        )}
                        {!searchLoading && hasVerses && (
                            <ResultGroup items={verses.map((v, i) => ({
                                key: `${v.reference}-${i}`,
                                onClick: () => {
                                    const j = parseReferenceJump(v.reference)
                                    if (j) {
                                        let url = `/read/${j.book}/${j.chapter}?translation=${bibleVersion || "web"}`
                                        if (j.verse) url += `&v=${j.verse}`
                                        router.push(url)
                                    }
                                    close()
                                },
                                content: (
                                    <div className="flex flex-col gap-0.5 px-3 py-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[12px] font-semibold text-foreground/70 tabular-nums">
                                                {v.reference}
                                            </span>
                                            <CornerDownLeft className="h-3 w-3 shrink-0 text-muted-foreground/25" />
                                        </div>
                                        <span className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/60">
                                            {v.text}
                                        </span>
                                    </div>
                                ),
                            }))} />
                        )}
                    </Section>
                )}

                {/* No results */}
                {showEmpty && (
                    <div className="px-4 py-8 text-center text-[13px] text-muted-foreground/40">
                        No matches found
                    </div>
                )}
            </div>
        </div>
    )
}
