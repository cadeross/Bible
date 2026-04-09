"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SPRING_FAST } from "@/lib/animation";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CustomHeatmapProps {
    data: Record<string, number>; // date "YYYY-MM-DD" -> seconds
}

const CELL = 12; // px
const GAP = 3;   // px
const STEP = CELL + GAP;

const COLOR_STEPS = [
    "bg-foreground/[0.07]",
    "bg-primary/25",
    "bg-primary/50",
    "bg-primary/75",
    "bg-primary",
] as const;

function getColorClass(minutes: number) {
    if (minutes === 0) return COLOR_STEPS[0];
    if (minutes < 15) return COLOR_STEPS[1];
    if (minutes < 30) return COLOR_STEPS[2];
    if (minutes < 60) return COLOR_STEPS[3];
    return COLOR_STEPS[4];
}

export function CustomHeatmap({ data }: CustomHeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(0);
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);

    useEffect(() => {
        const updateColumns = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const cols = Math.floor((width + GAP) / STEP);
            setColumns(Math.max(cols, 10));
        };

        updateColumns();
        const observer = new ResizeObserver(updateColumns);
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const days = useMemo(() => {
        if (columns === 0) return [];

        const today = new Date();
        const totalDays = columns * 7;
        const dayOfWeek = today.getDay();

        const endOfCurrentWeek = new Date(today);
        endOfCurrentWeek.setDate(today.getDate() + (6 - dayOfWeek));

        const startDate = new Date(endOfCurrentWeek);
        startDate.setDate(startDate.getDate() - totalDays + 1);

        return Array.from({ length: totalDays }, (_, i) => {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split("T")[0];
            return {
                date: d,
                dateStr,
                minutes: Math.round((data[dateStr] ?? 0) / 60),
                isFuture: d > today,
            };
        });
    }, [columns, data]);

    if (columns === 0) {
        return (
            <div
                ref={containerRef}
                className="w-full h-[106px] rounded-lg animate-pulse bg-muted/20"
            />
        );
    }

    return (
        <div ref={containerRef} className="w-full">
            <TooltipProvider delayDuration={0}>
                {/*
                 * overflow-x: clip clips horizontal overflow without forcing overflow-y: auto,
                 * so the vertical pop of the scale animation is visible.
                 * py-2 / -my-2 creates vertical breathing room for scale overflow.
                 */}
                <div className="py-2 -my-2" style={{ overflowX: "clip" }}>
                    <div
                        className="grid grid-flow-col"
                        style={{
                            gridTemplateRows: `repeat(7, ${CELL}px)`,
                            gap: `${GAP}px`,
                        }}
                    >
                        {days.map((day) => {
                            const isHovered = hoveredDate === day.dateStr;
                            return (
                                <Tooltip key={day.dateStr}>
                                    <TooltipTrigger asChild>
                                        <div
                                            onMouseEnter={() =>
                                                !day.isFuture && setHoveredDate(day.dateStr)
                                            }
                                            onMouseLeave={() => setHoveredDate(null)}
                                            style={{
                                                width: CELL,
                                                height: CELL,
                                                position: "relative",
                                                // z-index on a positioned grid item stacks it above siblings
                                                zIndex: isHovered ? 10 : 0,
                                            }}
                                            className={
                                                day.isFuture ? "pointer-events-none" : "cursor-default"
                                            }
                                        >
                                            <motion.div
                                                animate={{ scale: isHovered ? 1.5 : 1 }}
                                                transition={SPRING_FAST}
                                                className={cn(
                                                    "absolute inset-0 rounded-[2px]",
                                                    day.isFuture
                                                        ? "opacity-0"
                                                        : getColorClass(day.minutes)
                                                )}
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    {!day.isFuture && (
                                        <TooltipContent
                                            side="top"
                                            sideOffset={6}
                                            className="ow-menu-surface glass rounded-xl border border-white/[0.12] dark:border-white/[0.06] px-3 py-2 shadow-[var(--shadow-elevated)]"
                                        >
                                            <p className="text-[11px] font-medium text-muted-foreground">
                                                {day.date.toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-[13px] font-semibold mt-0.5",
                                                    day.minutes > 0
                                                        ? "text-foreground"
                                                        : "text-muted-foreground/50"
                                                )}
                                            >
                                                {day.minutes > 0
                                                    ? `${day.minutes} min read`
                                                    : "No reading"}
                                            </p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>
            </TooltipProvider>

            <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground/50 select-none">
                <span>Less</span>
                {COLOR_STEPS.map((cls, i) => (
                    <div
                        key={i}
                        className={cn("rounded-[2px]", cls)}
                        style={{ width: CELL, height: CELL }}
                    />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
