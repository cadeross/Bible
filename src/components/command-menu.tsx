"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BOOK_LIST } from "@/lib/bible-api"
import { parseReferenceJump } from "@/lib/reference-jump"
import { OPEN_COMMAND_MENU_EVENT } from "@/lib/open-command-menu"
import type { BibleSearchVerse } from "@/app/api/bible-search/route"
import { CornerDownLeft } from "lucide-react"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import {
    CommandDialog,
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

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

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const [input, setInput] = React.useState("")
    const [verses, setVerses] = React.useState<BibleSearchVerse[]>([])
    const [searchLoading, setSearchLoading] = React.useState(false)
    const [searchSource, setSearchSource] = React.useState<string | null>(null)
    const openRef = React.useRef(open)
    const router = useRouter()
    const { bibleVersion, isLoaded } = useReadingPreferences()

    React.useEffect(() => {
        openRef.current = open
    }, [open])

    const handleOpenChange = React.useCallback((next: boolean) => {
        setOpen(next)
        if (!next) {
            setInput("")
            setVerses([])
            setSearchSource(null)
            setSearchLoading(false)
        }
    }, [])

    React.useEffect(() => {
        const onPaletteOpen = (e: Event) => {
            const detail = (e as CustomEvent<{ query?: string }>).detail
            setInput(detail?.query ?? "")
            setOpen(true)
        }
        window.addEventListener(OPEN_COMMAND_MENU_EVENT, onPaletteOpen as EventListener)
        return () => window.removeEventListener(OPEN_COMMAND_MENU_EVENT, onPaletteOpen as EventListener)
    }, [])

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLElement | null
            const inPaletteInput = el?.dataset?.openwritCommand === "input"

            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                if (inPaletteInput) {
                    handleOpenChange(false)
                    return
                }
                if (isTypingInField(el)) return
                const willOpen = !openRef.current
                if (willOpen) setInput("")
                handleOpenChange(willOpen)
                return
            }

            if (openRef.current) return

            if (isTypingInField(el)) return

            if (!isPrintableKey(e)) return

            e.preventDefault()
            setInput(e.key)
            handleOpenChange(true)
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [handleOpenChange])

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
                handleOpenChange(false)
            },
        }))
    }, [input, router, bibleVersion, handleOpenChange])

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
                handleOpenChange(false)
            },
        }
    }, [jumpTarget, input, router, bibleVersion, handleOpenChange])

    const hasJumpRow = Boolean(jumpFromParser)
    const hasBooks = bookItems.length > 0
    const hasVerses = verses.length > 0
    const showEmptyHint =
        input.trim().length > 0 &&
        !hasJumpRow &&
        !hasBooks &&
        !hasVerses &&
        !searchLoading

    return (
        <CommandDialog open={open} onOpenChange={handleOpenChange} hideClose>
            <Command shouldFilter={false} value={input} onValueChange={setInput} loop>
                <CommandInput placeholder="Book, reference, search text, or command…" />
                <CommandList>
                    {jumpFromParser && (
                        <CommandGroup heading="Jump">
                            <CommandItem value="__jump-parser" onSelect={jumpFromParser.action}>
                                {jumpFromParser.label}
                                <CornerDownLeft className="ml-auto h-3 w-3 shrink-0 opacity-50" aria-hidden />
                            </CommandItem>
                        </CommandGroup>
                    )}

                    {hasBooks && (
                        <CommandGroup heading="Books">
                            {bookItems.map((item) => (
                                <CommandItem key={item.id} value={`book-${item.id}`} onSelect={item.action}>
                                    {item.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {(searchLoading || hasVerses || (searchSource === "no-api-key" && input.trim().length >= 2)) && (
                        <CommandGroup heading="Verse text">
                            {searchLoading && (
                                <CommandItem value="__loading" disabled>
                                    Searching…
                                </CommandItem>
                            )}
                            {!searchLoading && searchSource === "no-api-key" && (
                                <CommandItem value="__no-key" disabled>
                                    Add API_BIBLE_KEY for full-text search; jump and books still work.
                                </CommandItem>
                            )}
                            {!searchLoading &&
                                verses.map((v, i) => (
                                    <CommandItem
                                        key={`${v.reference}-${i}`}
                                        value={`verse-${i}-${v.reference}`}
                                        onSelect={() => {
                                            const j = parseReferenceJump(v.reference)
                                            if (j) {
                                                let url = `/read/${j.book}/${j.chapter}?translation=${bibleVersion || "web"}`
                                                if (j.verse) url += `&v=${j.verse}`
                                                router.push(url)
                                            }
                                            handleOpenChange(false)
                                        }}
                                    >
                                        <span className="flex min-w-0 flex-col gap-0.5 text-left">
                                            <span className="truncate font-medium text-primary">{v.reference}</span>
                                            <span className="line-clamp-2 text-muted-foreground">{v.text}</span>
                                        </span>
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    )}

                    {showEmptyHint && <CommandEmpty>No matches. Try a book name or reference (e.g. John 3:16).</CommandEmpty>}

                    {!input.trim() && (
                        <div className="border-t border-border/30 bg-muted/15 px-3 py-2.5 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                            <div>Type anywhere to search · ⌘K</div>
                            <div className="mt-1 normal-case tracking-normal text-muted-foreground/50">
                                Jump · full-text (with API key)
                            </div>
                        </div>
                    )}
                </CommandList>
            </Command>
        </CommandDialog>
    )
}
