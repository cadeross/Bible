"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { BookOpen, Calendar } from "lucide-react"
import { getDailyContent, DailyContent, FALLBACK_CONTENT } from "@/lib/daily-content"
import { getLiturgicalColorBg } from "@/lib/liturgical-calendar"
import type { LiturgicalDay } from "@/lib/liturgical-calendar"
import { cn } from "@/lib/utils"
import { DailyReadings } from "@/components/daily-readings"
import type { DailyReadingsData } from "@/lib/daily-readings"
import { hapticLight } from "@/lib/haptics"

interface DailyClientProps {
    dailyReadings: DailyReadingsData | null
    liturgicalDay: LiturgicalDay | null
}

export function DailyClient({ dailyReadings, liturgicalDay }: DailyClientProps) {
    const [mounted, setMounted] = useState(false)
    const [todayLabel, setTodayLabel] = useState("")
    const [dailyContent, setDailyContent] = useState<DailyContent>(FALLBACK_CONTENT)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        setMounted(true)
        setTodayLabel(
            new Intl.DateTimeFormat(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
            }).format(new Date())
        )
        getDailyContent().then(setDailyContent).catch(() => {})
    }, [])

    // Liturgical data — prefer romcal (server), fallback to Convex
    const feastName = dailyReadings?.title || dailyContent.feast_name || liturgicalDay?.name
    const season    = liturgicalDay?.season    || dailyContent.liturgical_season || ""
    const rank      = liturgicalDay?.rank      || dailyContent.rank || ""
    const cycle     = liturgicalDay?.cycle     || ""
    const week      = liturgicalDay?.week      || 0
    const colorKey  = liturgicalDay?.colorKey  || (dailyContent.liturgical_color?.toUpperCase() ?? "GREEN")
    const colorDotClass  = getLiturgicalColorBg(colorKey)
    const hasLiturgyStrip = !!(season || (rank && rank !== "Weekday") || cycle || week > 0)

    const sections = dailyReadings ? [
        { id: "reading1", label: "Reading I",  data: dailyReadings.readings.reading1 },
        { id: "psalm",    label: "Psalm",       data: dailyReadings.readings.psalm    },
        { id: "reading2", label: "Reading II",  data: dailyReadings.readings.reading2 },
        { id: "gospel",   label: "Gospel",      data: dailyReadings.readings.gospel   },
    ].filter(s => s.data) : []

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center py-8">
                <div className="w-full max-w-3xl mx-auto mb-8">
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-8 w-16 animate-pulse rounded-full bg-muted/20" />
                        <div className="h-8 w-48 animate-pulse rounded-full bg-muted/15" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-8">

            {/* ── Gradient fades — same as reading page ─────────────── */}
            <div className="fixed top-[calc(3.5rem+var(--maintenance-banner-height,0px))] left-0 right-0 h-16 bg-gradient-to-b from-background/75 to-transparent z-30 pointer-events-none hidden max-[1500px]:block" />
            <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-30 pointer-events-none hidden max-[1500px]:block" />

            {/* ── Toolbar ───────────────────────────────────────────── */}
            <div className="w-full max-w-3xl mx-auto mb-8 flex flex-col items-center gap-3">

                {/* Date + liturgical info as plain text */}
                <div className="text-center space-y-0.5">
                    <p className="text-[13px] font-medium text-muted-foreground select-none">{todayLabel}</p>
                    {hasLiturgyStrip && (
                        <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground/50 select-none">
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0 opacity-80", colorDotClass)} />
                            {[
                                season,
                                week > 0 ? `Week ${week}` : null,
                                rank && rank !== "Weekday" ? rank : null,
                                cycle ? `Year ${cycle}` : null,
                            ].filter(Boolean).join(" · ")}
                        </p>
                    )}
                </div>

                {/* Reading section pills + calendar */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    {sections.map((section, i) => (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() => { hapticLight(); setCurrentIndex(i) }}
                            className={cn(
                                "inline-flex items-center rounded-full border px-3.5 py-1.5 text-[13px] font-medium shadow-[var(--shadow-sm)] transition-[box-shadow,border-color,color] duration-200 cursor-pointer select-none [touch-action:manipulation]",
                                i === currentIndex
                                    ? "border-white/[0.2] dark:border-white/[0.12] glass-subtle text-foreground shadow-[var(--shadow-card)]"
                                    : "border-white/[0.12] dark:border-white/[0.06] glass-subtle text-muted-foreground/50 hover:shadow-[var(--shadow-card)] hover:border-white/[0.2] dark:hover:border-white/[0.12] hover:text-muted-foreground"
                            )}
                        >
                            {section.label}
                        </button>
                    ))}

                    {/* Calendar icon */}
                    <Link href="/calendar">
                        <span className="inline-flex items-center rounded-full border border-white/[0.12] dark:border-white/[0.06] glass-subtle px-3 py-1.5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] hover:border-white/[0.2] dark:hover:border-white/[0.12] transition-[box-shadow,border-color] duration-200 cursor-pointer">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
                        </span>
                    </Link>
                </div>

            </div>

            {/* ── Content ───────────────────────────────────────────── */}
            <main className="flex-1 w-full max-w-4xl relative flex items-start justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    className="w-full max-w-[720px] mx-auto px-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-20"
                >
                    {/* Feast name subtitle */}
                    {feastName && (
                        <p className="text-center text-[13px] text-muted-foreground/50 mb-6 leading-snug">
                            {feastName}
                        </p>
                    )}

                    {/* Readings */}
                    {dailyReadings ? (
                        <DailyReadings data={dailyReadings} currentIndex={currentIndex} onIndexChange={setCurrentIndex} />
                    ) : (
                        <div className="flex flex-col items-center gap-5 py-20 text-center">
                            <div className="h-12 w-12 rounded-2xl glass-subtle border border-white/[0.12] dark:border-white/[0.06] flex items-center justify-center shadow-[var(--shadow-card)]">
                                <BookOpen className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-[13px] font-medium text-foreground/80">Readings unavailable</p>
                                <p className="text-[12px] text-muted-foreground/50 max-w-[280px]">
                                    Today&apos;s readings could not be loaded.
                                </p>
                            </div>
                            <a
                                href="https://bible.usccb.org/daily-bible-reading"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[12px] font-medium text-primary/70 hover:text-primary transition-colors"
                            >
                                Read on usccb.org →
                            </a>
                        </div>
                    )}
                </motion.div>
            </main>

        </div>
    )
}
