"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BOOK_LIST } from "@/lib/bible-api"
import { parseReferenceJump } from "@/lib/reference-jump"
import { OPEN_COMMAND_MENU_EVENT } from "@/lib/open-command-menu"
import type { BibleSearchVerse } from "@/app/api/bible-search/route"
import { Search, CornerDownLeft } from "lucide-react"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"

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

    React.useEffect(() => {
        if (open) {
            setInput("")
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

    React.useEffect(() => {
        const onPaletteOpen = (e: Event) => {
            const detail = (e as CustomEvent<{ query?: string }>).detail
            setInput(detail?.query ?? "")
            onOpenChange(true)
        }
        window.addEventListener(OPEN_COMMAND_MENU_EVENT, onPaletteOpen as EventListener)
        return () => window.removeEventListener(OPEN_COMMAND_MENU_EVENT, onPaletteOpen as EventListener)
    }, [onOpenChange])

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
            setInput(e.key)
            onOpenChange(true)
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [close, onOpenChange])

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
            id: b,
            label: b,
            action: () => {
                router.push(`/read/${b}/1?translation=${bibleVersion || "web"}`)
                close()
            },
        }))
    }, [input, router, bibleVersion, close])

    const jumpFromParser = React.useMemo(() => {
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

    const hasJumpRow = Boolean(jumpFromParser)
    const hasBooks = bookItems.length > 0
    const hasVerses = verses.length > 0
    const showEmptyHint = input.trim().length > 0 && !hasJumpRow && !hasBooks && !hasVerses && !searchLoading

    return (
        <div className="w-[340px] max-h-[min(70vh,480px)] overflow-hidden flex flex-col">
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") close()
                    }}
                    placeholder="Book, reference, or search..."
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
                />
                {input && (
                    <kbd className="text-[10px] text-muted-foreground/30 shrink-0">esc</kbd>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {!input.trim() && (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground/40">
                        Type to search · ⌘K
                    </div>
                )}

                {jumpFromParser && (
                    <Section label="Jump">
                        <ResultItem onClick={jumpFromParser.action}>
                            {jumpFromParser.label}
                            <CornerDownLeft className="ml-auto h-3 w-3 shrink-0 text-muted-foreground/30" />
                        </ResultItem>
                    </Section>
                )}

                {hasBooks && (
                    <Section label="Books">
                        {bookItems.slice(0, 8).map((item) => (
                            <ResultItem key={item.id} onClick={item.action}>
                                {item.label}
                            </ResultItem>
                        ))}
                    </Section>
                )}

                {(searchLoading || hasVerses || (searchSource === "no-api-key" && input.trim().length >= 2)) && (
                    <Section label="Verses">
                        {searchLoading && (
                            <div className="px-4 py-3 text-xs text-muted-foreground/50">Searching...</div>
                        )}
                        {!searchLoading && searchSource === "no-api-key" && (
                            <div className="px-4 py-3 text-xs text-muted-foreground/50">Full-text search requires API key</div>
                        )}
                        {!searchLoading && verses.map((v, i) => (
                            <ResultItem
                                key={`${v.reference}-${i}`}
                                onClick={() => {
                                    const j = parseReferenceJump(v.reference)
                                    if (j) {
                                        let url = `/read/${j.book}/${j.chapter}?translation=${bibleVersion || "web"}`
                                        if (j.verse) url += `&v=${j.verse}`
                                        router.push(url)
                                    }
                                    close()
                                }}
                            >
                                <span className="flex min-w-0 flex-col gap-0.5">
                                    <span className="truncate text-[13px] font-medium text-foreground">{v.reference}</span>
                                    <span className="line-clamp-2 text-xs text-muted-foreground/60">{v.text}</span>
                                </span>
                            </ResultItem>
                        ))}
                    </Section>
                )}

                {showEmptyHint && (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground/50">
                        No matches found
                    </div>
                )}
            </div>
        </div>
    )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="border-b border-white/[0.04]">
            <div className="px-4 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/35">
                {label}
            </div>
            <div className="px-1 pb-1">
                {children}
            </div>
        </div>
    )
}

function ResultItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.05] dark:hover:bg-white/[0.07]"
        >
            {children}
        </button>
    )
}
