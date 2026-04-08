"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Monitor, Moon, Sun, LogOut, User, ChevronRight, ChevronLeft } from "lucide-react"
import { useAuth, useUser, useClerk, SignIn } from "@clerk/nextjs"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import HeatMap from "@uiw/react-heat-map"

const SPRING_RESIZE = { type: "spring" as const, stiffness: 350, damping: 30, mass: 0.8 }

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
                        <div className="border-b border-white/[0.06] px-3 py-2">
                            <button
                                onClick={() => setView("settings")}
                                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-white/[0.04]"
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
                        <div className="border-b border-white/[0.06] px-3 py-2">
                            {isSignedIn ? (
                                <div className="space-y-0.5">
                                    <Link
                                        href="/profile"
                                        onClick={onClose}
                                        className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.04] dark:hover:bg-white/[0.05]"
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
                                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-destructive/80 transition-colors hover:bg-white/[0.04] dark:hover:bg-white/[0.05]"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setView("signin")}
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.04] dark:hover:bg-white/[0.05]"
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
                        <div className="border-b border-white/[0.06] px-4 py-3">
                            <div className="relative flex rounded-xl bg-white/[0.03] dark:bg-white/[0.02] border border-white/[0.06] p-1">
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
