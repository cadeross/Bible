"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Monitor, Moon, Sun, LogOut, User, ChevronRight, ChevronLeft, Globe, ChevronDown, Check } from "lucide-react"
import { useAuth, useUser, useClerk, SignIn } from "@clerk/nextjs"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import HeatMap from "@uiw/react-heat-map"
import { useReadingPreferences } from "@/contexts/reading-preferences"

const SPRING_RESIZE = { type: "spring" as const, stiffness: 350, damping: 30, mass: 0.8 }

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
    const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)
    const [heatmapData, setHeatmapData] = useState<HeatMapValue[]>([])
    const settingsRef = useRef<HTMLDivElement>(null)
    const signinRef = useRef<HTMLDivElement>(null)

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

    const measureHeight = useCallback(() => {
        const ref = view === "settings" ? settingsRef : signinRef
        if (ref.current) {
            setContentHeight(ref.current.scrollHeight)
        }
    }, [view])

    useEffect(() => {
        measureHeight()
        const timer = setTimeout(measureHeight, 150)
        return () => clearTimeout(timer)
    }, [view, measureHeight, isSignedIn])

    // Re-measure whenever the active content div resizes (e.g. accordion open/close)
    useEffect(() => {
        const ref = view === "settings" ? settingsRef : signinRef
        if (!ref.current) return
        const observer = new ResizeObserver(() => {
            if (ref.current) setContentHeight(ref.current.scrollHeight)
        })
        observer.observe(ref.current)
        return () => observer.disconnect()
    }, [view])

    const isDark = resolvedTheme === "dark"

    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 4)

    const themeOptions = [
        { id: "light" as const, label: "Light", Icon: Sun },
        { id: "dark" as const, label: "Dark", Icon: Moon },
        { id: "system" as const, label: "Auto", Icon: Monitor },
    ]

    const activeThemeIndex = themeOptions.findIndex(t => t.id === theme)

    return (
        <motion.div
            className="w-[340px] overflow-hidden"
            animate={{ height: contentHeight }}
            transition={SPRING_RESIZE}
            style={{ height: contentHeight }}
        >
            <AnimatePresence mode="wait" initial={false}>
                {view === "signin" ? (
                    <motion.div
                        key="signin"
                        ref={signinRef}
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
                        <div className="flex justify-center overflow-hidden [&_.cl-card]:!shadow-none [&_.cl-card]:!border-0 [&_.cl-card]:!bg-transparent [&_.cl-internal-b3fm6y]:!bg-transparent [&_.cl-rootBox]:!w-full [&_.cl-card]:!w-full [&_.cl-cardBox]:!shadow-none [&_.cl-cardBox]:!w-full [&_.cl-footer]:!bg-transparent [&_.cl-formButtonPrimary]:!rounded-xl [&_.cl-formFieldInput]:!rounded-xl">
                            <SignIn
                                routing="hash"
                                forceRedirectUrl="/"
                                fallbackRedirectUrl="/"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full max-w-[320px]",
                                        card: "shadow-none border-0 bg-transparent w-full p-3",
                                        cardBox: "shadow-none w-full",
                                        footer: "bg-transparent",
                                        formButtonPrimary: "rounded-xl",
                                        formFieldInput: "rounded-xl",
                                    }
                                }}
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="settings"
                        ref={settingsRef}
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

                        {/* Versions */}
                        <VersionsSection />

                        {/* Reading Heatmap */}
                        <div className="px-4 py-3">
                            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">Reading Activity</p>
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
                                            ? { 0: "rgba(255,255,255,0.04)", 1: "rgba(10,132,255,0.2)", 2: "rgba(10,132,255,0.35)", 3: "rgba(10,132,255,0.55)", 4: "rgba(10,132,255,0.8)" }
                                            : { 0: "rgba(0,0,0,0.04)", 1: "rgba(36,136,242,0.15)", 2: "rgba(36,136,242,0.3)", 3: "rgba(36,136,242,0.5)", 4: "rgba(36,136,242,0.75)" }
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
        </motion.div>
    )
}
