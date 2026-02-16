"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Church, Calendar, X } from "lucide-react"
import Link from "next/link"
import { useNavMode } from "@/contexts/nav-mode"

// ─── Types ───────────────────────────────────────────────────────────────────

interface LiturgicalDay {
    date: string
    name: string
    type: string
    rank: string
    season: string
    seasonKey: string
    color: string
    colorHex: string
    colorKey: string
    cycle: string
    week: number
    key: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const RANK_PRIORITY: Record<string, number> = {
    'SOLEMNITY': 5,
    'FEAST': 4,
    'MEMORIAL': 3,
    'OPT_MEMORIAL': 2,
    'COMMEMORATION': 1,
    'FERIA': 0,
}

const COLOR_DOT_BG: Record<string, string> = {
    'WHITE': 'bg-foreground/30',
    'GREEN': 'bg-green-500',
    'RED': 'bg-red-500',
    'VIOLET': 'bg-purple-500',
    'PURPLE': 'bg-purple-500',
    'ROSE': 'bg-pink-400',
    'PINK': 'bg-pink-400',
    'GOLD': 'bg-yellow-500',
    'BLACK': 'bg-foreground',
}

const COLOR_RING: Record<string, string> = {
    'WHITE': 'ring-foreground/20',
    'GREEN': 'ring-green-500/40',
    'RED': 'ring-red-500/40',
    'VIOLET': 'ring-purple-500/40',
    'PURPLE': 'ring-purple-500/40',
    'ROSE': 'ring-pink-400/40',
    'PINK': 'ring-pink-400/40',
    'GOLD': 'ring-yellow-500/40',
    'BLACK': 'ring-foreground/40',
}

const COLOR_TEXT: Record<string, string> = {
    'WHITE': 'text-foreground/70',
    'GREEN': 'text-green-500',
    'RED': 'text-red-500',
    'VIOLET': 'text-purple-500',
    'PURPLE': 'text-purple-500',
    'ROSE': 'text-pink-400',
    'PINK': 'text-pink-400',
    'GOLD': 'text-yellow-500',
    'BLACK': 'text-foreground',
}

const SEASON_COLORS: Record<string, string> = {
    'Christmastide': 'text-foreground/70',
    'OrdinaryTime': 'text-green-500',
    'Lent': 'text-purple-500',
    'EasterTriduum': 'text-red-500',
    'Eastertide': 'text-foreground/70',
    'Advent': 'text-purple-500',
}

const SEASON_BG: Record<string, string> = {
    'Christmastide': 'bg-foreground/5',
    'OrdinaryTime': 'bg-green-500/5',
    'Lent': 'bg-purple-500/5',
    'EasterTriduum': 'bg-red-500/5',
    'Eastertide': 'bg-foreground/5',
    'Advent': 'bg-purple-500/5',
}

// ─── Animation variants ─────────────────────────────────────────────────────

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.02, delayChildren: 0.05 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 500, damping: 30 }
    }
}

const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
}

const sectionVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 400, damping: 25 }
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayStr(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month - 1, 1).getDay()
}

// ─── Day Detail Panel ────────────────────────────────────────────────────────

function DayDetail({ day, onClose }: { day: LiturgicalDay; onClose: () => void }) {
    const colorDot = COLOR_DOT_BG[day.colorKey] || 'bg-green-500'
    const colorText = COLOR_TEXT[day.colorKey] || 'text-green-500'
    const rankPriority = RANK_PRIORITY[day.type] || 0

    const dateObj = new Date(day.date + 'T12:00:00')
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="border border-border/40 rounded-lg p-6 space-y-5 bg-card/50 backdrop-blur-sm"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/50">
                        {formattedDate}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground/90 leading-snug">
                        {day.name}
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground/50 hover:text-muted-foreground shrink-0"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Rank */}
                <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">
                        Rank
                    </div>
                    <div className="text-sm text-foreground/80">
                        {rankPriority >= 4 ? (
                            <span className="font-semibold">{day.rank}</span>
                        ) : (
                            day.rank
                        )}
                    </div>
                </div>

                {/* Color */}
                <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">
                        Liturgical Color
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={cn("w-2.5 h-2.5 rounded-full", colorDot)} />
                        <span className={cn("text-sm", colorText)}>{day.color}</span>
                    </div>
                </div>

                {/* Season */}
                <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">
                        Season
                    </div>
                    <div className="text-sm text-foreground/80">
                        {day.season}
                    </div>
                </div>

                {/* Cycle */}
                <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">
                        Cycle
                    </div>
                    <div className="text-sm text-foreground/80">
                        {day.cycle || '—'}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                <Link
                    href="/"
                    className="text-xs font-mono text-muted-foreground/60 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                    <Church className="h-3 w-3" />
                    daily readings
                </Link>
            </div>
        </motion.div>
    )
}

// ─── Calendar Day Cell ───────────────────────────────────────────────────────

function CalendarDayCell({
    dayNum,
    day,
    isToday,
    isSelected,
    isCurrentMonth,
    onClick,
}: {
    dayNum: number
    day: LiturgicalDay | null
    isToday: boolean
    isSelected: boolean
    isCurrentMonth: boolean
    onClick: () => void
}) {
    const colorDot = day ? (COLOR_DOT_BG[day.colorKey] || 'bg-green-500') : 'bg-muted-foreground/20'
    const colorRing = day ? (COLOR_RING[day.colorKey] || 'ring-green-500/40') : ''
    const rankPriority = day ? (RANK_PRIORITY[day.type] || 0) : 0

    return (
        <motion.button
            variants={itemVariants}
            onClick={onClick}
            className={cn(
                "group relative flex flex-col items-start p-2 md:p-3 rounded-lg transition-all duration-200 text-left min-h-[60px] md:min-h-[90px] w-full border",
                isCurrentMonth ? "hover:bg-foreground/[0.04] border-foreground/[0.08]" : "opacity-30 border-transparent",
                isSelected && "!border-primary/40 ring-1 ring-primary/30",
                isToday && !isSelected && "!border-primary/50 ring-2 ring-primary/30",
            )}
        >
            {/* Day Number + Color Dot */}
            <div className="flex items-center gap-1.5 w-full">
                <span className={cn(
                    "text-xs font-mono tabular-nums",
                    isToday
                        ? "text-primary font-bold"
                        : isCurrentMonth
                            ? "text-foreground/80"
                            : "text-muted-foreground/40",
                )}>
                    {dayNum}
                </span>
                <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200",
                    colorDot,
                    isSelected && "scale-150"
                )} />
                {rankPriority >= 4 && isCurrentMonth && (
                    <span className={cn(
                        "ml-auto text-[8px] font-mono uppercase tracking-wider px-1 py-0.5 rounded",
                        rankPriority >= 5
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground/50"
                    )}>
                        {rankPriority >= 5 ? 'Sol' : 'Feast'}
                    </span>
                )}
            </div>

            {/* Celebration Name */}
            {day && isCurrentMonth && (
                <span className={cn(
                    "text-[10px] md:text-[11px] leading-tight mt-1 transition-colors duration-200",
                    rankPriority >= 4
                        ? "text-foreground/80 font-medium"
                        : rankPriority >= 3
                            ? "text-foreground/70"
                            : "text-muted-foreground/60 group-hover:text-muted-foreground/80"
                )}>
                    {day.name}
                </span>
            )}
        </motion.button>
    )
}

// ─── Mobile List Item ────────────────────────────────────────────────────────

function MobileListItem({
    day,
    isToday,
    isSelected,
    onClick,
}: {
    day: LiturgicalDay
    isToday: boolean
    isSelected: boolean
    onClick: () => void
}) {
    const colorDot = COLOR_DOT_BG[day.colorKey] || 'bg-green-500'
    const rankPriority = RANK_PRIORITY[day.type] || 0
    const dateObj = new Date(day.date + 'T12:00:00')
    const dayNum = dateObj.getDate()
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })

    return (
        <motion.button
            variants={itemVariants}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 text-left",
                "hover:bg-muted/40",
                isSelected && "bg-muted/60 ring-1 ring-primary/30",
                isToday && !isSelected && "ring-1 ring-primary/50",
            )}
        >
            {/* Date Column */}
            <div className="flex flex-col items-center w-10 shrink-0">
                <span className="text-[9px] font-mono uppercase text-muted-foreground/50">
                    {dayName}
                </span>
                <span className={cn(
                    "text-lg font-mono tabular-nums",
                    isToday ? "text-primary font-bold" : "text-foreground/70"
                )}>
                    {dayNum}
                </span>
            </div>

            {/* Color Dot */}
            <span className={cn("w-2 h-2 rounded-full shrink-0", colorDot)} />

            {/* Name & Rank */}
            <div className="min-w-0 flex-1">
                <div className={cn(
                    "text-sm leading-snug",
                    rankPriority >= 4
                        ? "text-foreground/80 font-medium"
                        : "text-foreground/70"
                )}>
                    {day.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground/40">
                        {day.rank}
                    </span>
                    {day.season && (
                        <>
                            <span className="text-muted-foreground/20">·</span>
                            <span className="text-[10px] font-mono text-muted-foreground/40">
                                {day.season}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Chevron */}
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
        </motion.button>
    )
}

// ─── Main Calendar Page ──────────────────────────────────────────────────────

export default function CalendarPage() {
    const today = new Date()
    const todayStr = getTodayStr()
    const { navMode } = useNavMode()

    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
    const [calendarData, setCalendarData] = useState<LiturgicalDay[]>([])
    const [selectedDay, setSelectedDay] = useState<LiturgicalDay | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Fetch month data
    const fetchMonth = useCallback(async (year: number, month: number) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/calendar?year=${year}&month=${month}`)
            if (res.ok) {
                const data = await res.json()
                setCalendarData(data)
            }
        } catch (err) {
            console.error('Failed to fetch calendar:', err)
        }
        setIsLoading(false)
    }, [])

    useEffect(() => {
        fetchMonth(currentYear, currentMonth)
    }, [currentYear, currentMonth, fetchMonth])

    // Navigation
    const goToPrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12)
            setCurrentYear(y => y - 1)
        } else {
            setCurrentMonth(m => m - 1)
        }
        setSelectedDay(null)
    }

    const goToNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1)
            setCurrentYear(y => y + 1)
        } else {
            setCurrentMonth(m => m + 1)
        }
        setSelectedDay(null)
    }

    const goToToday = () => {
        setCurrentYear(today.getFullYear())
        setCurrentMonth(today.getMonth() + 1)
        setSelectedDay(null)
    }

    // Build lookup map for the month
    const dayLookup = new Map<number, LiturgicalDay>()
    calendarData.forEach(d => {
        const dayNum = parseInt(d.date.split('-')[2], 10)
        dayLookup.set(dayNum, d)
    })

    // Calendar grid setup
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

    // Previous month padding
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

    const paddingBefore = firstDay
    const totalCells = paddingBefore + daysInMonth
    const paddingAfter = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)

    // Determine season for the current month (use middle of month)
    const midDay = dayLookup.get(15) || dayLookup.get(1)
    const currentSeason = midDay?.season || ''
    const currentSeasonKey = midDay?.seasonKey || 'OrdinaryTime'

    const isCurrentMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1

    return (
        <motion.div
            className="w-full max-w-[900px] mx-auto px-6 py-12 space-y-10"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <motion.div variants={sectionVariants} className="space-y-5 border-b border-border/50 pb-8">
                {navMode === 'classic' && (
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.45em] text-muted-foreground/60">
                        <span className="h-px w-8 bg-border" />
                        <Link href="/" className="hover:text-primary transition-colors">openwrit</Link>
                        <span className="text-muted-foreground/30">/</span>
                        <span>liturgical calendar</span>
                    </div>
                )}

                {/* Month Navigation */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-5xl font-mono font-bold text-primary tracking-tight">
                            {MONTH_NAMES[currentMonth - 1]}
                        </h1>
                        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground/60">
                            <span>{currentYear}</span>
                            {currentSeason && (
                                <>
                                    <span className="text-muted-foreground/30">·</span>
                                    <span className={cn(
                                        "flex items-center gap-1.5",
                                        SEASON_COLORS[currentSeasonKey] || 'text-muted-foreground/60'
                                    )}>
                                        <Church className="h-3 w-3" />
                                        {currentSeason}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {!isCurrentMonth && (
                            <button
                                onClick={goToToday}
                                className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50 hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-muted/40"
                            >
                                Today
                            </button>
                        )}
                        <button
                            onClick={goToPrevMonth}
                            className="p-2 rounded-md hover:bg-muted/40 transition-colors text-muted-foreground/50 hover:text-primary"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 rounded-md hover:bg-muted/40 transition-colors text-muted-foreground/50 hover:text-primary"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
                </div>
            )}

            {!isLoading && (
                <>
                    {/* Desktop: Calendar Grid */}
                    <motion.div
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        className="hidden md:block"
                    >
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {DAY_LABELS.map(label => (
                                <div
                                    key={label}
                                    className="text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40 py-2"
                                >
                                    {label}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Cells */}
                        <motion.div
                            className="grid grid-cols-7 gap-1"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            key={`${currentYear}-${currentMonth}`}
                        >
                            {/* Padding: previous month */}
                            {Array.from({ length: paddingBefore }).map((_, i) => {
                                const d = daysInPrevMonth - paddingBefore + i + 1
                                return (
                                    <CalendarDayCell
                                        key={`prev-${i}`}
                                        dayNum={d}
                                        day={null}
                                        isToday={false}
                                        isSelected={false}
                                        isCurrentMonth={false}
                                        onClick={() => { }}
                                    />
                                )
                            })}

                            {/* Current month days */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const d = i + 1
                                const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                const day = dayLookup.get(d) || null
                                const isToday = dateStr === todayStr
                                const isSelected = selectedDay?.date === dateStr

                                return (
                                    <CalendarDayCell
                                        key={d}
                                        dayNum={d}
                                        day={day}
                                        isToday={isToday}
                                        isSelected={isSelected}
                                        isCurrentMonth={true}
                                        onClick={() => setSelectedDay(isSelected ? null : (day || null))}
                                    />
                                )
                            })}

                            {/* Padding: next month */}
                            {Array.from({ length: paddingAfter }).map((_, i) => (
                                <CalendarDayCell
                                    key={`next-${i}`}
                                    dayNum={i + 1}
                                    day={null}
                                    isToday={false}
                                    isSelected={false}
                                    isCurrentMonth={false}
                                    onClick={() => { }}
                                />
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Mobile: List View */}
                    <motion.div
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                        className="md:hidden space-y-1"
                    >
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            key={`${currentYear}-${currentMonth}-list`}
                            className="space-y-0.5"
                        >
                            {calendarData.map(day => {
                                const isToday = day.date === todayStr
                                const isSelected = selectedDay?.date === day.date

                                return (
                                    <MobileListItem
                                        key={day.date}
                                        day={day}
                                        isToday={isToday}
                                        isSelected={isSelected}
                                        onClick={() => setSelectedDay(isSelected ? null : day)}
                                    />
                                )
                            })}
                        </motion.div>
                    </motion.div>

                    {/* Selected Day Detail */}
                    <AnimatePresence mode="wait">
                        {selectedDay && (
                            <DayDetail
                                key={selectedDay.date}
                                day={selectedDay}
                                onClose={() => setSelectedDay(null)}
                            />
                        )}
                    </AnimatePresence>

                    {/* Season Legend */}
                    <motion.div variants={sectionVariants} initial="hidden" animate="visible">
                        <div className="space-y-4">
                            <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                Liturgical Colors
                            </h2>
                            <div className="pl-4 border-l border-border/40">
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                    {[
                                        { key: 'GREEN', label: 'Green', desc: 'Ordinary Time' },
                                        { key: 'VIOLET', label: 'Violet', desc: 'Advent & Lent' },
                                        { key: 'WHITE', label: 'White', desc: 'Christmas & Easter' },
                                        { key: 'RED', label: 'Red', desc: 'Martyrs & Pentecost' },
                                        { key: 'ROSE', label: 'Rose', desc: 'Gaudete & Laetare' },
                                    ].map(c => (
                                        <div key={c.key} className="flex items-center gap-2 text-xs">
                                            <span className={cn("w-2 h-2 rounded-full", COLOR_DOT_BG[c.key])} />
                                            <span className="font-mono text-muted-foreground/60">{c.label}</span>
                                            <span className="text-muted-foreground/30 hidden sm:inline">—</span>
                                            <span className="text-muted-foreground/40 hidden sm:inline">{c.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Rank Legend */}
                    <motion.div variants={sectionVariants} initial="hidden" animate="visible">
                        <div className="space-y-4">
                            <h2 className="text-muted-foreground text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                Celebration Ranks
                            </h2>
                            <div className="pl-4 border-l border-border/40">
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                    {[
                                        { label: 'Solemnity', desc: 'Highest rank — e.g., Easter, Christmas' },
                                        { label: 'Feast', desc: 'Major celebrations — e.g., apostles' },
                                        { label: 'Memorial', desc: 'Saints and special commemorations' },
                                        { label: 'Weekday', desc: 'Ordinary ferial days' },
                                    ].map(r => (
                                        <div key={r.label} className="flex items-center gap-2 text-xs">
                                            <span className="font-mono text-muted-foreground/60">{r.label}</span>
                                            <span className="text-muted-foreground/30 hidden sm:inline">—</span>
                                            <span className="text-muted-foreground/40 hidden sm:inline">{r.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </motion.div>
    )
}
