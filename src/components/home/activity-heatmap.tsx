"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Flame } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type DayData = {
    date: string;
    intensity: number;
    displayDate: string;
}

export function ActivityHeatmap() {
    const [data, setData] = useState<DayData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Generate mock data for the last 365 days
        // Done in useEffect to avoid hydration mismatch (Date/Math.random)
        const days = []
        const now = new Date()
        for (let i = 0; i < 365; i++) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)

            // Random intensity 0-4
            // Bias towards 0 for realism, but some streaks
            const rand = Math.random()
            let intensity = 0
            if (rand > 0.8) intensity = 1
            if (rand > 0.9) intensity = 2
            if (rand > 0.95) intensity = 3
            if (rand > 0.98) intensity = 4

            days.unshift({
                date: date.toISOString().split('T')[0],
                intensity,
                displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            })
        }
        setData(days)
        setLoading(false)
    }, [])

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary/40 text-xs font-mono">
                    <Flame className="h-4 w-4" />
                    <span>activity</span>
                </div>
                <div className="text-xs font-mono text-muted-foreground/50">
                    365 days
                </div>
            </div>

            {/* Heatmap Grid */}
            <TooltipProvider>
                <div className="w-full overflow-hidden">
                    <div className="flex flex-wrap gap-1 md:gap-[3px] justify-center md:justify-start">
                        {loading
                            ? Array.from({ length: 365 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-2 h-2 md:w-3 md:h-3 rounded-[2px] bg-muted/10 animate-pulse"
                                />
                            ))
                            : data.map((day, i) => (
                                <Tooltip key={i} delayDuration={50}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={cn(
                                                "w-2 h-2 md:w-3 md:h-3 rounded-[2px] transition-colors cursor-alias",
                                                // Empty state: slightly darker than before for contrast
                                                day.intensity === 0 && "bg-muted/20 hover:ring-2 hover:ring-muted-foreground/30 hover:z-10",
                                                day.intensity === 1 && "bg-primary/30 hover:ring-2 hover:ring-primary/50 hover:z-10",
                                                day.intensity === 2 && "bg-primary/50 hover:ring-2 hover:ring-primary/60 hover:z-10",
                                                day.intensity === 3 && "bg-primary/70 hover:ring-2 hover:ring-primary/80 hover:z-10",
                                                day.intensity === 4 && "bg-primary hover:ring-2 hover:ring-primary/90 hover:z-10"
                                            )}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="font-mono text-xs">
                                        <p>{day.displayDate}</p>
                                        <p className="text-muted-foreground">Reading Level: {day.intensity}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))
                        }
                    </div>
                </div>
            </TooltipProvider>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-muted-foreground/40 mt-2">
                <span>less</span>
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted/20 rounded-[1px]" />
                    <div className="w-2 h-2 bg-primary/30 rounded-[1px]" />
                    <div className="w-2 h-2 bg-primary/50 rounded-[1px]" />
                    <div className="w-2 h-2 bg-primary/70 rounded-[1px]" />
                    <div className="w-2 h-2 bg-primary rounded-[1px]" />
                </div>
                <span>more</span>
            </div>
        </div>
    )
}
