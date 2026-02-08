"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomHeatmapProps {
    data: Record<string, number>; // date "YYYY-MM-DD" -> seconds
}

export function CustomHeatmap({ data }: CustomHeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(0);

    // Update number of columns based on width
    useEffect(() => {
        const updateColumns = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            // box = 10px, gap = 4px (gap-1) -> step = 14px?
            // Let's use 10px box + 2px gap = 12px step.
            // Using gap-1 in tailwind is 0.25rem = 4px.
            // box w-2.5 (10px) + gap-1 (4px) = 14px.
            const boxSize = 10;
            const gap = 3; // minimal gap
            const step = boxSize + gap;

            // Calculate how many columns fit
            const cols = Math.floor(width / step);
            setColumns(Math.max(cols, 10)); // Ensure at least 10 cols
        };

        // Initial
        updateColumns();

        // Resize observer
        const observer = new ResizeObserver(updateColumns);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Generate calendar data
    const weeks = useMemo(() => {
        if (columns === 0) return [];

        const today = new Date();
        const totalDays = columns * 7;
        const days = [];

        // We want the grid to end today.
        // But usually heatmaps are "Week aligned".
        // The last column should contain today.
        // Today's day of week (0=Sun, 6=Sat).
        const dayOfWeek = today.getDay();

        // Strategy:
        // We render 'columns' number of weeks.
        // The last column is the current week.
        // The last displayed day will be Saturday of the current week (even if in future).
        // Or we just stop at "Today"?
        // Contribution graphs usually show the full row/col grid. specific squares are empty if future.
        // Let's generate 'columns' weeks, ending with the week containing today.

        // Find the Saturday of the current week
        const endOfCurrentWeek = new Date(today);
        endOfCurrentWeek.setDate(today.getDate() + (6 - dayOfWeek));

        // Start date is (columns - 1) weeks ago, Sunday.
        const startDate = new Date(endOfCurrentWeek);
        startDate.setDate(startDate.getDate() - (columns * 7) + 1);

        // Generate all days
        for (let i = 0; i < totalDays; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split("T")[0];
            const valueSeconds = data[dateStr] || 0;
            const isFuture = d > today;

            days.push({
                date: d,
                dateStr,
                value: valueSeconds, // seconds
                minutes: Math.round(valueSeconds / 60),
                isFuture
            });
        }
        return days;
    }, [columns, data]);

    // Helper to get color class based on minutes
    const getColor = (minutes: number) => {
        if (minutes === 0) return "bg-primary/[0.02]"; // Empty, ultra faint
        if (minutes < 15) return "bg-primary/20";
        if (minutes < 30) return "bg-primary/40";
        if (minutes < 60) return "bg-primary/70";
        return "bg-primary"; // 60+
    };

    if (columns === 0) {
        return <div ref={containerRef} className="w-full h-[92px] bg-secondary/5 animate-pulse rounded-md" />;
    }

    return (
        <div ref={containerRef} className="w-full overflow-hidden">
            <TooltipProvider delayDuration={0}>
                <div
                    className="grid grid-flow-col gap-[3px]"
                    style={{
                        gridTemplateRows: "repeat(7, 10px)",
                        width: "fit-content" // Let the grid shrink/grow defined by columns
                    }}
                >
                    {weeks.map((day, i) => (
                        <Tooltip key={day.dateStr}>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "w-[10px] h-[10px] rounded-[2px] transition-all duration-200 cursor-default",
                                        "hover:ring-1 hover:ring-ring hover:ring-offset-1 hover:ring-offset-background",
                                        day.isFuture ? "opacity-0 pointer-events-none" : getColor(day.minutes)
                                    )}
                                />
                            </TooltipTrigger>
                            {!day.isFuture && (
                                <TooltipContent
                                    className="min-w-[8rem] flex flex-col items-start gap-1 rounded-lg border border-border/50 bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur-3xl"
                                >
                                    <span className="font-mono text-muted-foreground">
                                        {day.date.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric"
                                        })}
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-mono font-bold text-foreground">
                                            {day.minutes}
                                        </span>
                                        <span className="text-muted-foreground">minutes read</span>
                                    </div>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    ))}
                </div>
            </TooltipProvider>

            {/* Legend */}
            <div className="flex justify-end items-center mt-3 text-[10px] text-muted-foreground font-mono">
                <div className="flex items-center gap-1">
                    <span className="mr-1">Less</span>
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/[0.02]" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/20" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/40" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-primary/70" />
                    <div className="w-[10px] h-[10px] rounded-[2px] bg-primary" />
                    <span className="ml-1">More</span>
                </div>
            </div>
        </div>
    );
}
