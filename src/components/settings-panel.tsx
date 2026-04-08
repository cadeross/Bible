"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useTheme } from "next-themes"
import { useReadingPreferences, FontType } from "@/contexts/reading-preferences"
import { cn } from "@/lib/utils"
import { Monitor, Moon, Sun, Hash, Palette, RotateCcw, Heading, Minus, Plus, LogOut, User, ChevronRight, ChevronLeft } from "lucide-react"
import { getAllTranslations } from "@/lib/bible-api"
import { HIGHLIGHT_MENU_COLORS } from "@/lib/highlight-menu"
import { useAuth, useUser, useClerk, SignIn } from "@clerk/nextjs"
import { toast } from "sonner"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

const HIGHLIGHT_COLORS = HIGHLIGHT_MENU_COLORS.map((c) => ({
    id: c.id,
    dotClass: c.dotClass,
}))

const FONT_OPTIONS: { id: FontType; label: string; family: string }[] = [
    { id: "sans", label: "Sans", family: "var(--font-geist-sans), system-ui, sans-serif" },
    { id: "serif", label: "Serif", family: "Merriweather, Georgia, serif" },
    { id: "mono", label: "Mono", family: "var(--font-geist-mono), monospace" },
    { id: "pixel", label: "Round", family: "var(--font-nunito), system-ui, sans-serif" },
]

const SPRING_RESIZE = { type: "spring" as const, stiffness: 350, damping: 30, mass: 0.8 }

type PanelView = "settings" | "signin"

export function SettingsPanel({ onClose }: { onClose?: () => void }) {
    const { theme, setTheme } = useTheme()
    const { isSignedIn } = useAuth()
    const { user } = useUser()
    const clerk = useClerk()
    const {
        fontFamily, setFontFamily, fontSize, setFontSize,
        showVerseNumbers, setShowVerseNumbers, redLetters, setRedLetters,
        showTitles, setShowTitles, defaultHighlightColor, setDefaultHighlightColor,
        bibleVersion, setBibleVersion, resetPreferences,
    } = useReadingPreferences()

    const [translations, setTranslations] = useState<{ id: string; name: string; abbreviation?: string }[]>([])
    const [versionOpen, setVersionOpen] = useState(false)
    const [view, setView] = useState<PanelView>("settings")
    const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)
    const settingsRef = useRef<HTMLDivElement>(null)
    const signinRef = useRef<HTMLDivElement>(null)

    useEffect(() => { getAllTranslations().then(setTranslations) }, [])

    const currentTranslationName = translations.find(t => t.id === bibleVersion)?.name || bibleVersion

    const measureHeight = useCallback(() => {
        const ref = view === "settings" ? settingsRef : signinRef
        if (ref.current) {
            setContentHeight(ref.current.scrollHeight)
        }
    }, [view])

    useEffect(() => {
        measureHeight()
        const timer = setTimeout(measureHeight, 100)
        return () => clearTimeout(timer)
    }, [view, measureHeight, versionOpen, isSignedIn])

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
                        <div className="px-2 py-3 flex justify-center [&_.cl-card]:!shadow-none [&_.cl-card]:!border-0 [&_.cl-card]:!bg-transparent [&_.cl-internal-b3fm6y]:!bg-transparent [&_.cl-rootBox]:!w-full [&_.cl-card]:!w-full [&_.cl-footer]:!bg-transparent">
                            <SignIn
                                routing="hash"
                                forceRedirectUrl="/"
                                fallbackRedirectUrl="/"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full",
                                        card: "shadow-none border-0 bg-transparent w-full",
                                        cardBox: "shadow-none w-full",
                                        footer: "bg-transparent",
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

                        {/* Theme */}
                        <div className="border-b border-white/[0.06] px-3 py-3">
                            <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">Theme</p>
                            <div className="grid grid-cols-3 gap-1 px-1">
                                {([
                                    { id: "light" as const, label: "Light", Icon: Sun },
                                    { id: "dark" as const, label: "Dark", Icon: Moon },
                                    { id: "system" as const, label: "Auto", Icon: Monitor },
                                ]).map(({ id, label, Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setTheme(id)}
                                        className={cn(
                                            "flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-medium transition-all duration-200",
                                            theme === id
                                                ? "bg-primary/[0.08] text-primary dark:bg-primary/[0.15]"
                                                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] dark:hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Translation */}
                        <div className="border-b border-white/[0.06] px-3 py-3">
                            <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">Translation</p>
                            <button
                                onClick={() => setVersionOpen(!versionOpen)}
                                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.04] dark:hover:bg-white/[0.05]"
                            >
                                <span className="truncate">{currentTranslationName}</span>
                                <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/25 transition-transform duration-200", versionOpen && "rotate-90")} />
                            </button>
                            {versionOpen && (
                                <div className="mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-white/[0.04] bg-white/[0.02] dark:bg-white/[0.01]">
                                    {translations.map((t) => {
                                        const abbrev = ((t as any).abbreviation || t.id).toUpperCase()
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => { setBibleVersion(t.id); setVersionOpen(false) }}
                                                className={cn(
                                                    "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                                                    t.id === bibleVersion
                                                        ? "bg-primary/[0.06] dark:bg-primary/[0.1]"
                                                        : "hover:bg-white/[0.04] dark:hover:bg-white/[0.03]"
                                                )}
                                            >
                                                <span className={cn("w-12 shrink-0 text-[11px] font-semibold", t.id === bibleVersion ? "text-primary" : "text-muted-foreground/60")}>{abbrev}</span>
                                                <span className={cn("text-[13px] truncate", t.id === bibleVersion ? "text-foreground font-medium" : "text-foreground/70")}>{t.name}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Font */}
                        <div className="border-b border-white/[0.06] px-3 py-3">
                            <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">Font</p>
                            <div className="grid grid-cols-4 gap-1 px-1">
                                {FONT_OPTIONS.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFontFamily(f.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-0.5 rounded-lg py-2 transition-all duration-200",
                                            fontFamily === f.id
                                                ? "bg-primary/[0.08] dark:bg-primary/[0.15]"
                                                : "hover:bg-white/[0.04] dark:hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <span className={cn("text-[15px]", fontFamily === f.id ? "text-primary" : "text-foreground/50")} style={{ fontFamily: f.family }}>Aa</span>
                                        <span className={cn("text-[10px] font-medium", fontFamily === f.id ? "text-primary/80" : "text-muted-foreground/50")}>{f.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Size */}
                        <div className="border-b border-white/[0.06] px-3 py-3">
                            <div className="flex items-center justify-between px-2">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">Size</p>
                                <div className="flex items-center gap-2.5">
                                    <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:text-foreground hover:bg-white/[0.06]">
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-6 text-center text-[13px] font-semibold tabular-nums text-foreground">{fontSize}</span>
                                    <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:text-foreground hover:bg-white/[0.06]">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Display toggles */}
                        <div className="border-b border-white/[0.06] px-3 py-3">
                            <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">Display</p>
                            <div className="flex flex-wrap gap-1.5 px-1">
                                {[
                                    { active: showVerseNumbers, toggle: () => setShowVerseNumbers(!showVerseNumbers), icon: Hash, label: "Numbers" },
                                    { active: redLetters, toggle: () => setRedLetters(!redLetters), icon: Palette, label: "Red Letters", activeClass: "bg-red-500/10 text-red-500 ring-red-500/20" },
                                    { active: showTitles, toggle: () => setShowTitles(!showTitles), icon: Heading, label: "Titles" },
                                ].map((t) => (
                                    <button
                                        key={t.label}
                                        onClick={t.toggle}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ring-1 ring-transparent transition-all duration-200",
                                            t.active
                                                ? t.activeClass || "bg-primary/[0.08] text-primary ring-primary/20 dark:bg-primary/[0.15]"
                                                : "text-muted-foreground hover:bg-white/[0.04] dark:hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <t.icon className="h-3 w-3" />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Highlight color */}
                        <div className="border-b border-white/[0.06] px-3 py-3">
                            <div className="flex items-center justify-between px-2">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">Highlight</p>
                                <div className="flex items-center gap-1.5">
                                    {HIGHLIGHT_COLORS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setDefaultHighlightColor(c.id)}
                                            className={cn(
                                                "h-5 w-5 rounded-full transition-all duration-200 hover:scale-110",
                                                c.dotClass,
                                                defaultHighlightColor === c.id && "ring-2 ring-primary ring-offset-1 ring-offset-transparent scale-110"
                                            )}
                                            aria-label={`Select ${c.id}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Reset */}
                        <div className="px-3 py-2">
                            <button
                                onClick={() => { resetPreferences(); toast.success("Settings reset") }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-destructive/70 transition-colors hover:bg-white/[0.04] dark:hover:bg-white/[0.05]"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset all settings
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
