"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Church, Calendar, BookOpen } from "lucide-react"
import { getDailyContent, getLiturgicalColorClass, DailyContent, FALLBACK_CONTENT } from "@/lib/daily-content"
import { cn } from "@/lib/utils"
import { DailyReadings } from "@/components/daily-readings"
import { DailyReadingsData } from "@/lib/daily-readings"

interface DailyClientProps {
    dailyReadings: DailyReadingsData | null
}

export function DailyClient({ dailyReadings }: DailyClientProps) {
    const [mounted, setMounted] = useState(false)
    const [todayLabel, setTodayLabel] = useState("")
    const [dailyContent, setDailyContent] = useState<DailyContent>(FALLBACK_CONTENT)

    useEffect(() => {
        setMounted(true)
        setTodayLabel(
            new Intl.DateTimeFormat(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric"
            }).format(new Date())
        )
        getDailyContent().then(setDailyContent).catch(() => {})
    }, [])

    const liturgyLabel = dailyReadings?.title || dailyContent.feast_name || dailyContent.liturgical_season
    const liturgyColorClass = getLiturgicalColorClass(dailyContent.liturgical_color)
    const readingCount = dailyReadings ? [
        dailyReadings.readings.reading1,
        dailyReadings.readings.psalm,
        dailyReadings.readings.reading2,
        dailyReadings.readings.gospel,
    ].filter(Boolean).length : 0

    if (!mounted) {
        return (
            <div className="w-full max-w-[860px] mx-auto px-6 py-16">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-6 w-32 animate-pulse rounded-lg bg-muted-foreground/8" />
                    <div className="h-4 w-48 animate-pulse rounded-lg bg-muted-foreground/6" />
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[860px] mx-auto px-6 py-12 space-y-10"
        >
            {/* Hero */}
            <div className="flex flex-col items-center text-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[11px] font-medium text-primary">
                    Redesign coming soon
                </span>
                <p className="text-sm text-muted-foreground">{todayLabel}</p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Today&apos;s Readings
                </h1>
                {liturgyLabel && (
                    <Link
                        href="/calendar"
                        className={cn(
                            "flex items-center gap-1.5 text-sm transition-colors duration-200 hover:text-foreground",
                            liturgyColorClass || "text-muted-foreground"
                        )}
                    >
                        <Church className="h-3.5 w-3.5" />
                        {liturgyLabel}
                    </Link>
                )}
                {readingCount > 0 && (
                    <p className="text-xs text-muted-foreground/50 mt-1">
                        {readingCount} reading{readingCount !== 1 ? "s" : ""}
                    </p>
                )}
            </div>

            {/* Readings */}
            {dailyReadings ? (
                <DailyReadings data={dailyReadings} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Readings unavailable</p>
                        <p className="text-sm text-muted-foreground max-w-[300px]">
                            Today&apos;s readings could not be loaded. Check back shortly.
                        </p>
                    </div>
                    <a
                        href="https://bible.usccb.org/daily-bible-reading"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        Read on usccb.org →
                    </a>
                </div>
            )}

            {/* Footer link */}
            <div className="flex justify-center pt-4">
                <Link
                    href="/calendar"
                    className="flex items-center gap-2 text-sm text-muted-foreground/50 transition-colors duration-200 hover:text-foreground"
                >
                    <Calendar className="h-3.5 w-3.5" />
                    Full liturgical calendar
                </Link>
            </div>
        </motion.div>
    )
}
