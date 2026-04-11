"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Monitor, Moon, Sun, LogOut, User, ChevronRight, ChevronLeft, Globe, ChevronDown, Check } from "lucide-react"
import { useAuth, useUser, useClerk, SignIn } from "@clerk/nextjs"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import HeatMap from "@uiw/react-heat-map"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { TINT_COLORS, type TintId, applyTint, applyCustomTint, getStoredTint, getStoredCustomColor } from "@/lib/tint-colors"
import { CustomColorPicker } from "@/components/custom-color-picker"

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

interface TintSectionProps {
    activeTint: TintId
    customColor: string
    onActiveTintChange: (id: TintId) => void
    onCustomColorChange: (hex: string) => void
}

function TintSection({ activeTint, customColor, onActiveTintChange, onCustomColorChange }: TintSectionProps) {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"
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

type PanelView = "settings" | "signin"

interface HeatMapValue {
    date: string
    count: number
}

export function SettingsPanel({ onClose }: { onClose?: () => void }) {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const { isSignedIn } = useAuth()
    const { user } = useUser()
    const clerk = useClerk()

    const [view, setView] = useState<PanelView>("settings")
    const [heatmapData, setHeatmapData] = useState<HeatMapValue[]>([])
    const [activeTint, setActiveTint] = useState<TintId>("blue")
    const [customColor, setCustomColor] = useState("#2488f2")

    const isDark = resolvedTheme === "dark"

    useEffect(() => {
        setActiveTint(getStoredTint())
        setCustomColor(getStoredCustomColor())
    }, [])

    const handleTintSelect = (id: TintId) => {
        setActiveTint(id)
        applyTint(id, isDark)
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

    const streak = useMemo(() => {
        if (heatmapData.length === 0) return 0
        const dateSet = new Set(heatmapData.map(d => d.date))
        const fmt = (d: Date) => {
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, "0")
            const day = String(d.getDate()).padStart(2, "0")
            return `${y}/${m}/${day}`
        }
        const check = new Date()
        check.setHours(0, 0, 0, 0)
        if (!dateSet.has(fmt(check))) {
            check.setDate(check.getDate() - 1)
            if (!dateSet.has(fmt(check))) return 0
        }
        let count = 0
        while (dateSet.has(fmt(check))) {
            count++
            check.setDate(check.getDate() - 1)
        }
        return count
    }, [heatmapData])

    const longestStreak = useMemo(() => {
        if (heatmapData.length === 0) return 0
        const dates = heatmapData.map(d => d.date.replace(/\//g, "-")).sort()
        let longest = 1
        let current = 1
        for (let i = 1; i < dates.length; i++) {
            const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000
            current = diff === 1 ? current + 1 : 1
            if (current > longest) longest = current
        }
        return longest
    }, [heatmapData])

    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 4)

    const themeOptions = [
        { id: "light" as const, label: "Light", Icon: Sun },
        { id: "dark" as const, label: "Dark", Icon: Moon },
        { id: "system" as const, label: "Auto", Icon: Monitor },
    ]

    const activeThemeIndex = themeOptions.findIndex(t => t.id === theme)

    return (
        <div className="w-[340px] overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
                {view === "signin" ? (
                    <motion.div
                        key="signin"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <div className="border-b border-foreground/[0.06] px-3 py-2">
                            <button
                                onClick={() => setView("settings")}
                                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-foreground/[0.04]"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                Back
                            </button>
                        </div>
                        <div className="flex justify-center">
                            <SignIn
                                routing="hash"
                                forceRedirectUrl="/"
                                fallbackRedirectUrl="/"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full max-w-[320px]",
                                        card: { boxShadow: "none", border: "none", background: "transparent", width: "100%", padding: "0.75rem" },
                                        cardBox: { boxShadow: "none", width: "100%" },
                                        footer: { background: "transparent" },
                                    },
                                }}
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {/* Account */}
                        <div className="border-b border-foreground/[0.06] px-3 py-2">
                            {isSignedIn ? (
                                <div className="space-y-0.5">
                                    <Link
                                        href="/profile"
                                        onClick={onClose}
                                        className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-foreground/[0.04]"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <User className="h-3.5 w-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-medium text-foreground">{user?.fullName || user?.username || "Profile"}</p>
                                                <p className="text-[11px] text-muted-foreground/60">{user?.primaryEmailAddress?.emailAddress}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/25" />
                                    </Link>
                                    <button
                                        onClick={() => { clerk.signOut(); onClose?.() }}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-destructive/80 transition-colors hover:bg-foreground/[0.04]"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setView("signin")}
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-foreground/[0.04]"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <User className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[13px] font-medium text-foreground">Sign in</p>
                                            <p className="text-[11px] text-muted-foreground/60">Sync across devices</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/25" />
                                </button>
                            )}
                        </div>

                        {/* Theme - elegant toggle */}
                        <div className="border-b border-foreground/[0.06] px-4 py-3">
                            <div className="relative flex rounded-xl bg-foreground/[0.04] border border-foreground/[0.06] p-1">
                                <motion.div
                                    className="absolute top-1 bottom-1 rounded-[10px] bg-primary/[0.1] ring-1 ring-primary/25 dark:bg-primary/[0.18]"
                                    layout
                                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                                    style={{
                                        width: `calc(${100 / 3}% - 3px)`,
                                        left: `calc(${(activeThemeIndex >= 0 ? activeThemeIndex : 2) * (100 / 3)}% + 1.5px)`,
                                    }}
                                />
                                {themeOptions.map(({ id, label, Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setTheme(id)}
                                        className={cn(
                                            "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-[12px] font-medium transition-colors duration-200",
                                            theme === id ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Language */}
                        <div className="border-b border-foreground/[0.06] px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-medium text-foreground">Language</p>
                                    <span className="text-[9px] font-semibold uppercase tracking-wider bg-primary/10 text-primary/60 px-1.5 py-0.5 rounded-full select-none">Coming soon</span>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-foreground/[0.04] border border-foreground/[0.07] opacity-50 cursor-not-allowed select-none">
                                    <Globe className="h-3 w-3 text-muted-foreground/50" />
                                    <span className="text-[12px] text-muted-foreground/60">English</span>
                                    <ChevronDown className="h-3 w-3 text-muted-foreground/30" />
                                </div>
                            </div>
                        </div>

                        {/* Tint */}
                        <TintSection
                            activeTint={activeTint}
                            customColor={customColor}
                            onActiveTintChange={handleTintSelect}
                            onCustomColorChange={handleCustomColorChange}
                        />

                        {/* Versions */}
                        <VersionsSection />

                        {/* Reading Activity */}
                        <div className="px-4 py-3">
                            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">Reading Activity</p>

                            {/* Streak */}
                            <div className="mb-3 flex items-baseline justify-between">
                                <p className="text-[13px] font-medium text-foreground">
                                    {streak > 0 ? `${streak} day streak` : "No streak yet"}
                                </p>
                                {streak > 0 && (
                                    <p className="text-[11px] text-muted-foreground/40">
                                        Best: {longestStreak} day{longestStreak !== 1 ? "s" : ""}
                                    </p>
                                )}
                            </div>
                            <div className="overflow-x-auto -mx-1">
                                <HeatMap
                                    value={heatmapData}
                                    width={312}
                                    startDate={startDate}
                                    endDate={new Date()}
                                    rectSize={10}
                                    space={3}
                                    legendCellSize={0}
                                    style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)" }}
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
                                    weekLabels={["", "Mon", "", "Wed", "", "Fri", ""]}
                                    monthLabels={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
                                />
                            </div>
                            {heatmapData.length === 0 && (
                                <p className="text-center text-[11px] text-muted-foreground/40 py-2">Start reading to see your activity</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
