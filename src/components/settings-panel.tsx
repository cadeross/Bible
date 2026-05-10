"use client"

import { useEffect, useState, useRef, useLayoutEffect } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import HeatMap from "@uiw/react-heat-map"
import { useReadingPreferences, type FontType } from "@/contexts/reading-preferences"
import { TINT_COLORS, type TintId, applyTint, applyCustomTint, getStoredTint, getStoredCustomColor } from "@/lib/tint-colors"
import { CustomColorPicker } from "@/components/custom-color-picker"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { APP_VERSION, APP_VERSION_DATE, LATEST_UPDATE_HIGHLIGHTS } from "@/lib/version"

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

function SlidingHighlight({ containerRef, hoveredIndex }: { containerRef: React.RefObject<HTMLDivElement | null>; hoveredIndex: number | null }) {
    const [rect, setRect] = useState<{ top: number; height: number } | null>(null)

    useEffect(() => {
        if (hoveredIndex === null || !containerRef.current) { setRect(null); return }
        const buttons = containerRef.current.querySelectorAll<HTMLElement>("[data-slide-item]")
        const el = buttons[hoveredIndex]
        if (!el) { setRect(null); return }
        const parentRect = containerRef.current.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        setRect({ top: elRect.top - parentRect.top + containerRef.current.scrollTop, height: elRect.height })
    }, [hoveredIndex, containerRef])

    return (
        <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1 right-1 z-0 rounded-[12px] bg-foreground/[0.05] dark:bg-white/[0.07]"
            initial={false}
            animate={rect ? { opacity: 1, top: rect.top, height: rect.height } : { opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.5 }}
            style={{ position: "absolute" }}
        />
    )
}

interface Translation {
    id: string
    name: string
    abbreviation?: string
}

function VersionsSection() {
    const { bibleVersion, enabledTranslations, setEnabledTranslations } = useReadingPreferences()
    const [translations, setTranslations] = useState<Translation[]>([])
    const [open, setOpen] = useState(false)
    const listRef = useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = useState<number | null>(null)

    useEffect(() => {
        import("@/lib/bible-api").then(({ getAllTranslations }) => {
            getAllTranslations().then(setTranslations)
        })
    }, [])

    const isEnabled = (id: string) => {
        if (enabledTranslations === null) return true
        return enabledTranslations.includes(id)
    }

    const toggle = (id: string) => {
        if (enabledTranslations === null) {
            // Currently all enabled — disable everything except this one... actually deselect one
            const all = translations.map(t => t.id)
            const next = all.filter(tid => tid !== id)
            setEnabledTranslations(next.length === translations.length - 1 ? next : null)
        } else {
            const next = enabledTranslations.includes(id)
                ? enabledTranslations.filter(tid => tid !== id)
                : [...enabledTranslations, id]
            // If all selected, use null (show all)
            setEnabledTranslations(next.length === translations.length ? null : next)
        }
    }

    const enabledCount = enabledTranslations === null ? translations.length : enabledTranslations.length

    return (
        <div className="border-b border-foreground/[0.06]">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-foreground/[0.02]"
            >
                <p className="text-[13px] font-medium text-foreground">Bible Versions</p>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground/50">
                        {translations.length > 0 ? `${enabledCount} of ${translations.length}` : ""}
                    </span>
                    <motion.div
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </motion.div>
                </div>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.8 }}
                        className="overflow-hidden"
                    >
                        <div className="relative">
                            <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 z-10 bg-gradient-to-b from-[var(--popover)] to-transparent" />
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 z-10 bg-gradient-to-t from-[var(--popover)] to-transparent" />
                        <div ref={listRef} className="relative px-3 py-3 max-h-[240px] overflow-y-auto" onPointerLeave={() => setHovered(null)}>
                            {translations.length === 0 ? (
                                <p className="py-3 text-center text-[12px] text-muted-foreground/40">Loading…</p>
                            ) : (
                                <>
                                    <SlidingHighlight containerRef={listRef} hoveredIndex={hovered} />
                                    <div className="flex flex-col gap-0.5">
                                    {translations.map((t, i) => {
                                        const abbrev = (t.abbreviation || t.id).toUpperCase()
                                        const enabled = isEnabled(t.id)
                                        const isCurrent = t.id === bibleVersion
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                data-slide-item
                                                onClick={() => { if (!isCurrent) toggle(t.id) }}
                                                onPointerEnter={() => setHovered(i)}
                                                className={cn(
                                                    "relative z-10 flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left",
                                                    isCurrent ? "cursor-default" : "cursor-pointer"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
                                                    enabled
                                                        ? "border-primary/50 bg-primary/15"
                                                        : "border-foreground/[0.12] bg-transparent"
                                                )}>
                                                    {enabled && <Check className="h-2.5 w-2.5 text-primary" strokeWidth={2.5} />}
                                                </div>
                                                <span className={cn("w-12 shrink-0 text-[11px] font-semibold tabular-nums", enabled ? "text-foreground/80" : "text-muted-foreground/40")}>
                                                    {abbrev}
                                                </span>
                                                <span className={cn("flex-1 truncate text-[12px]", enabled ? "text-foreground/70" : "text-muted-foreground/35")}>
                                                    {t.name}
                                                </span>
                                                {isCurrent && (
                                                    <span className="text-[10px] font-medium text-primary/60 shrink-0">active</span>
                                                )}
                                            </button>
                                        )
                                    })}
                                    </div>
                                </>
                            )}
                        </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─── Reading section helpers (mirrors reading-toolbar's appearance popover) ──

const FONT_OPTIONS: { id: FontType; label: string; family: string }[] = [
    { id: "sans",   label: "Sans",   family: "var(--font-geist-sans), system-ui, sans-serif" },
    { id: "serif",  label: "Serif",  family: "Merriweather, Georgia, serif" },
    { id: "mono",   label: "Mono",   family: "var(--font-geist-mono), monospace" },
    { id: "pixel",  label: "Round",  family: "var(--font-nunito), system-ui, sans-serif" },
    { id: "script", label: "Script", family: 'var(--font-moon-dance), "Brush Script MT", "Lucida Handwriting", cursive' },
]

function GridHighlight({ containerRef, hoveredIndex }: { containerRef: React.RefObject<HTMLDivElement | null>; hoveredIndex: number | null }) {
    const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

    /* eslint-disable react-hooks/set-state-in-effect -- intentional: measure DOM rect for hover overlay */
    useEffect(() => {
        if (hoveredIndex === null || !containerRef.current) { setRect(null); return }
        const buttons = containerRef.current.querySelectorAll<HTMLElement>("[data-slide-item]")
        const el = buttons[hoveredIndex]
        if (!el) { setRect(null); return }
        const parentRect = containerRef.current.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        setRect({ top: elRect.top - parentRect.top, left: elRect.left - parentRect.left, width: elRect.width, height: elRect.height })
    }, [hoveredIndex, containerRef])
    /* eslint-enable react-hooks/set-state-in-effect */

    return (
        <motion.div
            aria-hidden
            className="pointer-events-none absolute z-0 rounded-xl bg-foreground/[0.05] dark:bg-white/[0.07]"
            initial={false}
            animate={rect ? { opacity: 1, top: rect.top, left: rect.left, width: rect.width, height: rect.height } : { opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.5 }}
            style={{ position: "absolute" }}
        />
    )
}

function ToggleRow({
    active,
    onClick,
    label,
    accent = "primary",
}: {
    active: boolean
    onClick: () => void
    label: string
    accent?: "primary" | "red"
}) {
    const checkColor = accent === "red" ? "text-red-500" : "text-primary"

    return (
        <button
            type="button"
            suppressHydrationWarning
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                "flex w-full items-center justify-between rounded-md py-1 text-[12px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground"
            )}
        >
            <span>{label}</span>
            <Check
                aria-hidden
                className={cn(
                    "h-3.5 w-3.5 transition-opacity duration-200",
                    active ? cn("opacity-100", checkColor) : "opacity-40"
                )}
            />
        </button>
    )
}

function StepperRow({
    label,
    value,
    onDecrement,
    onIncrement,
    canDecrement,
    canIncrement,
}: {
    label: string
    value: string
    onDecrement: () => void
    onIncrement: () => void
    canDecrement: boolean
    canIncrement: boolean
}) {
    const btn = "h-5 w-3.5 flex items-center justify-center text-foreground/55 hover:text-foreground transition-colors disabled:opacity-25 disabled:pointer-events-none"
    return (
        <div className="flex w-full items-center justify-between py-1 text-[12px] font-medium text-muted-foreground/70">
            <span>{label}</span>
            <div className="flex items-center gap-1.5">
                <button type="button" onClick={onDecrement} disabled={!canDecrement} className={btn} aria-label={`Decrease ${label.toLowerCase()}`}>
                    <span className="text-[14px] leading-none select-none font-light">−</span>
                </button>
                <span className="w-9 text-center text-[12px] tabular-nums text-foreground select-none" suppressHydrationWarning>{value}</span>
                <button type="button" onClick={onIncrement} disabled={!canIncrement} className={btn} aria-label={`Increase ${label.toLowerCase()}`}>
                    <span className="text-[14px] leading-none select-none font-light">+</span>
                </button>
            </div>
        </div>
    )
}

function ReadingSection() {
    const {
        isLoaded,
        fontFamily, setFontFamily,
        fontSize, setFontSize,
        lineHeight, setLineHeight,
        showVerseNumbers, setShowVerseNumbers,
        redLetters, setRedLetters,
        showTitles, setShowTitles,
    } = useReadingPreferences()

    const [open, setOpen] = useState(true)
    const gridRef = useRef<HTMLDivElement>(null)
    const [hoveredFont, setHoveredFont] = useState<number | null>(null)

    const activeFontSize = isLoaded ? fontSize : 18
    const activeLineHeight = isLoaded ? lineHeight : 1.6
    const currentFontLabel = (FONT_OPTIONS.find(f => f.id === (isLoaded ? fontFamily : "serif"))?.label) ?? "Serif"

    return (
        <div className="border-b border-foreground/[0.06]">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-foreground/[0.02]"
            >
                <p className="text-[13px] font-medium text-foreground">Reading</p>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground/50 tabular-nums" suppressHydrationWarning>
                        {currentFontLabel} · {activeFontSize}px
                    </span>
                    <motion.div
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </motion.div>
                </div>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.8 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-3 pt-1">

                            {/* Typeface grid */}
                            <div
                                ref={gridRef}
                                className="relative grid grid-cols-5 gap-1.5"
                                onPointerLeave={() => setHoveredFont(null)}
                            >
                                <GridHighlight containerRef={gridRef} hoveredIndex={hoveredFont} />
                                {FONT_OPTIONS.map((f, i) => {
                                    const selected = isLoaded ? fontFamily === f.id : f.id === "serif"
                                    return (
                                        <motion.button
                                            key={f.id}
                                            type="button"
                                            suppressHydrationWarning
                                            data-slide-item
                                            onClick={() => setFontFamily(f.id)}
                                            onPointerEnter={() => setHoveredFont(i)}
                                            whileTap={{ scale: 0.93 }}
                                            className={cn(
                                                "relative z-10 flex flex-col items-center gap-0.5 rounded-lg py-1.5 cursor-pointer",
                                                "transition-colors duration-150",
                                                selected ? "bg-foreground/[0.07] dark:bg-white/[0.09]" : ""
                                            )}
                                        >
                                            {selected && (
                                                <motion.div
                                                    layoutId="settings-typeface-ring"
                                                    className="absolute inset-0 rounded-lg ring-1 ring-foreground/[0.14] dark:ring-white/[0.18]"
                                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                                />
                                            )}
                                            <span
                                                className={cn(
                                                    "relative z-10 text-[13px] leading-none transition-colors duration-150",
                                                    selected ? "text-foreground" : "text-foreground/40"
                                                )}
                                                style={{ fontFamily: f.family }}
                                            >
                                                Aa
                                            </span>
                                            <span className={cn(
                                                "relative z-10 text-[9px] font-medium transition-colors duration-150",
                                                selected ? "text-foreground/70" : "text-muted-foreground/35"
                                            )}>
                                                {f.label}
                                            </span>
                                        </motion.button>
                                    )
                                })}
                            </div>

                            <div className="h-px bg-foreground/[0.06] my-3" />

                            {/* Size + Spacing + Display toggles */}
                            <div className="flex flex-col">
                                <StepperRow
                                    label="Size"
                                    value={`${activeFontSize}px`}
                                    onDecrement={() => setFontSize(Math.max(12, fontSize - 2))}
                                    onIncrement={() => setFontSize(Math.min(32, fontSize + 2))}
                                    canDecrement={activeFontSize > 12}
                                    canIncrement={activeFontSize < 32}
                                />
                                <StepperRow
                                    label="Spacing"
                                    value={activeLineHeight.toFixed(1)}
                                    onDecrement={() => setLineHeight(Math.max(1.2, parseFloat((lineHeight - 0.1).toFixed(1))))}
                                    onIncrement={() => setLineHeight(Math.min(2.4, parseFloat((lineHeight + 0.1).toFixed(1))))}
                                    canDecrement={activeLineHeight > 1.2}
                                    canIncrement={activeLineHeight < 2.4}
                                />
                                <ToggleRow
                                    active={!isLoaded || showVerseNumbers}
                                    onClick={() => setShowVerseNumbers(!showVerseNumbers)}
                                    label="Verse Numbers"
                                />
                                <ToggleRow
                                    active={!isLoaded || redLetters}
                                    onClick={() => setRedLetters(!redLetters)}
                                    label="Red Letters"
                                    accent="red"
                                />
                                <ToggleRow
                                    active={isLoaded && showTitles}
                                    onClick={() => setShowTitles(!showTitles)}
                                    label="Headings"
                                />
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

interface TintSectionProps {
    activeTint: TintId
    customColor: string
    onActiveTintChange: (id: TintId) => void
    onCustomColorChange: (hex: string) => void
}

function TintSection({ activeTint, customColor, onActiveTintChange, onCustomColorChange }: TintSectionProps) {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark" || resolvedTheme === "oled" || resolvedTheme === "solarized" || resolvedTheme === "mocha"
    const [pickerOpen, setPickerOpen] = useState(false)

    const handleSelect = (id: TintId) => {
        setPickerOpen(false)
        onActiveTintChange(id)
    }

    const handleRainbowClick = () => {
        if (activeTint !== "custom") {
            onCustomColorChange(customColor)
            setPickerOpen(true)
        } else {
            setPickerOpen(o => !o)
        }
    }

    const isCustomActive = activeTint === "custom"

    return (
        <div className="border-b border-foreground/[0.06]">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-foreground">Tint</p>
                    <div className="flex items-center gap-1.5">
                        {TINT_COLORS.map((tint) => {
                            const color = isDark ? tint.dark : tint.light
                            const isActive = activeTint === tint.id
                            return (
                                <button
                                    key={tint.id}
                                    type="button"
                                    aria-label={tint.label}
                                    onClick={() => handleSelect(tint.id)}
                                    className="relative flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95"
                                    style={{ width: 18, height: 18 }}
                                >
                                    <span
                                        className="rounded-full"
                                        style={{
                                            width: isActive ? 14 : 16,
                                            height: isActive ? 14 : 16,
                                            background: color,
                                            boxShadow: isActive
                                                ? `0 0 0 2px ${color}, 0 0 0 3.5px ${isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)"}`
                                                : "none",
                                            transition: "box-shadow 0.15s, width 0.15s, height 0.15s",
                                        }}
                                    />
                                </button>
                            )
                        })}

                        {/* Custom color swatch — toggles inline picker */}
                        <button
                            type="button"
                            aria-label="Custom color"
                            onClick={handleRainbowClick}
                            className="relative flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95"
                            style={{ width: 18, height: 18 }}
                        >
                            <span
                                className="rounded-full"
                                style={{
                                    width: isCustomActive ? 14 : 16,
                                    height: isCustomActive ? 14 : 16,
                                    background: isCustomActive
                                        ? customColor
                                        : "conic-gradient(#ff453a, #ff9f0a, #ffd60a, #30d158, #5ac8fa, #0a84ff, #bf5af2, #ff375f, #ff453a)",
                                    boxShadow: isCustomActive
                                        ? `0 0 0 2px ${customColor}, 0 0 0 3.5px ${isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)"}`
                                        : "none",
                                    transition: "box-shadow 0.15s, width 0.15s, height 0.15s",
                                }}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Inline custom color picker */}
            <AnimatePresence initial={false}>
                {pickerOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.8 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-3">
                            <CustomColorPicker value={customColor} onChange={onCustomColorChange} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

interface HeatMapValue {
    date: string
    count: number
}

export function SettingsPanel() {
    const { theme, setTheme, resolvedTheme } = useTheme()

    const [heatmapData, setHeatmapData] = useState<HeatMapValue[]>([])
    const [activeTint, setActiveTint] = useState<TintId>("blue")
    const [customColor, setCustomColor] = useState("#2488f2")
    const heatmapContainerRef = useRef<HTMLDivElement | null>(null)
    const [heatmapWidth, setHeatmapWidth] = useState(320)
    const [versionOpen, setVersionOpen] = useState(false)
    const versionCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const cancelVersionClose = () => {
        if (versionCloseTimer.current) {
            clearTimeout(versionCloseTimer.current)
            versionCloseTimer.current = null
        }
    }
    const scheduleVersionClose = () => {
        cancelVersionClose()
        versionCloseTimer.current = setTimeout(() => setVersionOpen(false), 120)
    }
    useEffect(() => () => cancelVersionClose(), [])

    const isDark = resolvedTheme === "dark" || resolvedTheme === "oled" || resolvedTheme === "solarized" || resolvedTheme === "mocha"

    useEffect(() => {
        setActiveTint(getStoredTint())
        setCustomColor(getStoredCustomColor())
    }, [])

    const handleTintSelect = (id: TintId) => {
        setActiveTint(id)
        applyTint(id, isDark)
    }

    const handleThemeChange = (id: string) => {
        type DocWithViewTransition = Document & { startViewTransition?: (cb: () => void) => unknown }
        const doc = document as DocWithViewTransition
        if (typeof doc.startViewTransition === "function") {
            doc.startViewTransition(() => setTheme(id))
        } else {
            setTheme(id)
        }
    }

    const handleCustomColorChange = (hex: string) => {
        setCustomColor(hex)
        setActiveTint("custom")
        applyCustomTint(hex)
    }

    const primaryColor = activeTint === "custom"
        ? customColor
        : (TINT_COLORS.find(t => t.id === activeTint)?.[isDark ? "dark" : "light"] ?? "#2488f2")

    useEffect(() => {
        import("@/lib/persistence").then(({ getHistory }) => {
            getHistory().then((history) => {
                const counts: Record<string, number> = {}
                history.forEach((h) => {
                    const day = h.completed_at.split("T")[0].replace(/-/g, "/")
                    counts[day] = (counts[day] || 0) + 1
                })
                setHeatmapData(Object.entries(counts).map(([date, count]) => ({ date, count })))
            })
        })
    }, [])

    useLayoutEffect(() => {
        const el = heatmapContainerRef.current
        if (!el) return
        const measure = () => setHeatmapWidth(el.clientWidth)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const today = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 4)

    // The lib hardcodes 5px leftPad/topPad when labels are off. We compensate
    // for that in the wrapper padding so the visible cells line up flush to the
    // section's standard 16px / 12px insets.
    const HEATMAP_LEFT_PAD = 5
    const HEATMAP_TOP_PAD = 5
    const space = 3
    const rows = 7

    // Number of week columns spanning the date range (Sunday-aligned start).
    const startSunday = new Date(startDate)
    startSunday.setDate(startSunday.getDate() - startSunday.getDay())
    const cols = Math.max(1, Math.ceil((today.getTime() - startSunday.getTime()) / (7 * 86400000)))

    // Solve cell size to fit cols columns into the available width. The lib
    // computes column count as floor((width - leftPad) / (rectSize + space)),
    // so each column slot must consume slightly less than usableWidth / cols
    // to avoid floor() dropping the last column to fp imprecision.
    const usableWidth = Math.max(0, heatmapWidth - HEATMAP_LEFT_PAD)
    const rectSize = cols > 0 ? Math.max(4, (usableWidth - 0.5) / cols - space) : 12
    const heatmapHeight = HEATMAP_TOP_PAD + rows * rectSize + (rows - 1) * space

    // Hardcoded theme bg/fg pairs — each card must render its own theme's
    // colors regardless of which theme is currently active. Values mirror the
    // tokens in globals.css. Order is light → dark.
    const themePreviews = [
        { id: "light" as const,     label: "Light",  bg: "#fafafa", fg: "#1d1d1f" },
        { id: "sepia" as const,     label: "Sepia",  bg: "#f5e8d0", fg: "#5b4a32" },
        { id: "mocha" as const,     label: "Mocha",  bg: "#14110d", fg: "#d0c4ac" },
        { id: "dark" as const,      label: "Dark",   bg: "#1c1c1e", fg: "#f5f5f7" },
        { id: "solarized" as const, label: "Solar",  bg: "#000b17", fg: "#a3b3b3" },
        { id: "oled" as const,      label: "OLED",   bg: "#000000", fg: "#f5f5f7" },
    ]

    const isFollowSystem = theme === "system"
    // Active card: when following system, highlight whatever the OS resolved to.
    // Fallback to "light" only during the brief SSR/first-paint where resolvedTheme is undefined.
    const displayTheme = isFollowSystem ? (resolvedTheme ?? "light") : theme

    const handleFollowSystemToggle = () => {
        if (isFollowSystem) {
            // Lock to whatever the system was just resolving to.
            handleThemeChange(resolvedTheme ?? "light")
        } else {
            handleThemeChange("system")
        }
    }

    return (
        <div className="w-[340px] overflow-hidden">
            <div>
                        {/* Appearance — three preview cards + match-system row */}
                        <div className="border-b border-foreground/[0.06] px-4 pt-3 pb-3 space-y-2.5">
                            <p className="text-[13px] font-medium text-foreground">Theme</p>
                            <div className="flex gap-1.5">
                                {themePreviews.map(({ id, label, bg, fg }) => {
                                    const isActive = displayTheme === id
                                    return (
                                        <motion.button
                                            key={id}
                                            type="button"
                                            onClick={() => handleThemeChange(id)}
                                            whileTap={{ scale: 0.94 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className="group flex flex-1 flex-col items-center gap-1 min-w-0"
                                            aria-pressed={isActive}
                                            aria-label={`${label} theme`}
                                        >
                                            <div
                                                className={cn(
                                                    "relative w-full overflow-hidden rounded-md border transition-[box-shadow,border-color] duration-200",
                                                    isActive
                                                        ? "border-primary/60 ring-2 ring-primary/30 shadow-[var(--shadow-sm)]"
                                                        : "border-foreground/[0.08] group-hover:border-foreground/[0.18]"
                                                )}
                                                style={{
                                                    backgroundColor: bg,
                                                    color: fg,
                                                    aspectRatio: "4 / 3",
                                                }}
                                            >
                                                <div className="absolute inset-0 flex items-center justify-center font-serif text-[11px] font-semibold tracking-tight">
                                                    Aa
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-[10.5px] font-medium transition-colors",
                                                isActive
                                                    ? "text-primary"
                                                    : "text-muted-foreground/70 group-hover:text-foreground"
                                            )}>
                                                {label}
                                            </span>
                                        </motion.button>
                                    )
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={handleFollowSystemToggle}
                                aria-pressed={isFollowSystem}
                                className={cn(
                                    "flex w-full items-center justify-between rounded-md py-1 text-[12px] font-medium transition-colors",
                                    isFollowSystem
                                        ? "text-primary"
                                        : "text-muted-foreground/70 hover:text-foreground"
                                )}
                            >
                                <span>Match system theme</span>
                                <Check
                                    aria-hidden
                                    className={cn(
                                        "h-3.5 w-3.5 transition-opacity duration-200",
                                        isFollowSystem ? "opacity-100" : "opacity-40"
                                    )}
                                />
                            </button>
                        </div>

                        {/* Tint */}
                        <TintSection
                            activeTint={activeTint}
                            customColor={customColor}
                            onActiveTintChange={handleTintSelect}
                            onCustomColorChange={handleCustomColorChange}
                        />

                        {/* Reading */}
                        <ReadingSection />

                        {/* Versions */}
                        <VersionsSection />

                        {/* Reading Activity */}
                        <div className="pl-[calc(1rem-5px)] pr-4 pt-[calc(0.75rem-5px)] pb-3">
                            <div ref={heatmapContainerRef} className="w-full">
                                <HeatMap
                                    value={heatmapData}
                                    width={heatmapWidth}
                                    height={heatmapHeight}
                                    startDate={startDate}
                                    endDate={today}
                                    rectSize={rectSize}
                                    space={space}
                                    legendCellSize={0}
                                    weekLabels={false}
                                    monthLabels={false}
                                    panelColors={
                                        isDark
                                            ? { 0: "rgba(255,255,255,0.04)", 1: hexToRgba(primaryColor, 0.2), 2: hexToRgba(primaryColor, 0.35), 3: hexToRgba(primaryColor, 0.55), 4: hexToRgba(primaryColor, 0.8) }
                                            : { 0: "rgba(0,0,0,0.04)", 1: hexToRgba(primaryColor, 0.15), 2: hexToRgba(primaryColor, 0.3), 3: hexToRgba(primaryColor, 0.5), 4: hexToRgba(primaryColor, 0.75) }
                                    }
                                    rectRender={(props, data) => {
                                        const count = (data as any).count || 0
                                        return (
                                            <rect
                                                {...props}
                                                rx={2.5}
                                                ry={2.5}
                                            >
                                                {count > 0 && <title>{`${data.date}: ${count} chapter${count !== 1 ? "s" : ""}`}</title>}
                                            </rect>
                                        )
                                    }}
                                />
                            </div>
                            {heatmapData.length === 0 && (
                                <p className="text-center text-[11px] text-muted-foreground/40 py-2">Start reading to see your activity</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-foreground/[0.06] px-4 py-3 text-[11px] text-muted-foreground/50">
                            <div className="flex items-center justify-between">
                                <a
                                    href="https://cadeross.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="transition-colors duration-200 hover:text-foreground"
                                >
                                    Crafted by Cade Ross
                                </a>
                                <Popover open={versionOpen} onOpenChange={setVersionOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            onMouseEnter={() => { cancelVersionClose(); setVersionOpen(true) }}
                                            onMouseLeave={scheduleVersionClose}
                                            onFocus={() => { cancelVersionClose(); setVersionOpen(true) }}
                                            onBlur={scheduleVersionClose}
                                            className="transition-colors duration-200 hover:text-foreground"
                                        >
                                            v{APP_VERSION}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        side="top"
                                        align="end"
                                        sideOffset={8}
                                        onOpenAutoFocus={(e) => e.preventDefault()}
                                        onMouseEnter={cancelVersionClose}
                                        onMouseLeave={scheduleVersionClose}
                                        className="w-[260px] p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[13px] font-semibold text-foreground">v{APP_VERSION}</span>
                                            <span className="text-[11px] text-muted-foreground/60">{APP_VERSION_DATE}</span>
                                        </div>
                                        <ul className="mt-2.5 space-y-1.5">
                                            {LATEST_UPDATE_HIGHLIGHTS.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-[12px] text-foreground/80 leading-relaxed">
                                                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
            </div>
        </div>
    )
}
