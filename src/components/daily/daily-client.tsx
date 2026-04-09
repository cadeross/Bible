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

interface DailyClientProps {
    dailyReadings: DailyReadingsData | null
    liturgicalDay: LiturgicalDay | null
}

export function DailyClient({ dailyReadings, liturgicalDay }: DailyClientProps) {
    const [mounted, setMounted] = useState(false)
    const [todayLabel, setTodayLabel] = useState("")
    const [dailyContent, setDailyContent] = useState<DailyContent>(FALLBACK_CONTENT)

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
    const season = liturgicalDay?.season || dailyContent.liturgical_season || ""
    const rank = liturgicalDay?.rank || dailyContent.rank || ""
    const cycle = liturgicalDay?.cycle || ""
    const week = liturgicalDay?.week || 0
    const colorKey = liturgicalDay?.colorKey || (dailyContent.liturgical_color?.toUpperCase() ?? "GREEN")
    const colorDotClass = getLiturgicalColorBg(colorKey)
    const hasLiturgyStrip = !!(season || (rank && rank !== "Weekday") || cycle || week > 0)

    if (!mounted) {
        return (
            <div className="w-full max-w-[720px] mx-auto px-6 py-16 flex flex-col items-center gap-3">
                <div className="h-3 w-36 animate-pulse rounded-full bg-muted/20" />
                <div className="h-8 w-56 animate-pulse rounded-full bg-muted/15" />
                <div className="h-3 w-48 animate-pulse rounded-full bg-muted/10 mt-1" />
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-[720px] mx-auto px-6 py-12 flex flex-col gap-8"
        >
            {/* ── Hero ── */}
            <div className="flex flex-col items-center text-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1 text-[11px] font-medium text-primary/80 select-none">
                    Daily Scripture
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/35 select-none mt-0.5">
                    {todayLabel}
                </p>
                <h1 className="text-[30px] font-semibold tracking-tight text-foreground leading-tight">
                    Today&apos;s Readings
                </h1>
                {feastName && (
                    <p className="text-[13px] text-muted-foreground/55 max-w-[420px] leading-snug mt-0.5">
                        {feastName}
                    </p>
                )}
            </div>

            {/* ── Liturgical Strip ── */}
            {hasLiturgyStrip && (
                <div className="flex justify-center">
                    <Link href="/calendar" className="group">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-subtle border border-white/[0.08] dark:border-white/[0.05] hover:border-white/[0.16] dark:hover:border-white/[0.10] transition-all duration-200 cursor-pointer">
                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0 opacity-80", colorDotClass)} />
                            {season && (
                                <span className="text-[12px] font-medium text-foreground/60">{season}</span>
                            )}
                            {week > 0 && (
                                <>
                                    <span className="text-muted-foreground/20 select-none">·</span>
                                    <span className="text-[12px] text-muted-foreground/40">Week {week}</span>
                                </>
                            )}
                            {rank && rank !== "Weekday" && (
                                <>
                                    <span className="text-muted-foreground/20 select-none">·</span>
                                    <span className="text-[12px] text-muted-foreground/40">{rank}</span>
                                </>
                            )}
                            {cycle && (
                                <>
                                    <span className="text-muted-foreground/20 select-none">·</span>
                                    <span className="text-[12px] text-muted-foreground/40">Year {cycle}</span>
                                </>
                            )}
                            <Calendar className="h-3 w-3 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors ml-0.5" />
                        </div>
                    </Link>
                </div>
            )}

            {/* ── Readings ── */}
            {dailyReadings ? (
                <DailyReadings data={dailyReadings} />
            ) : (
                <div className="flex flex-col items-center gap-5 py-20 text-center">
                    <div className="h-12 w-12 rounded-2xl glass-subtle border border-white/[0.08] flex items-center justify-center">
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

            {/* ── Footer ── */}
            <div className="flex justify-center pb-4">
                <Link
                    href="/calendar"
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors duration-200"
                >
                    <Calendar className="h-3 w-3" />
                    View liturgical calendar
                </Link>
            </div>
        </motion.div>
    )
}
