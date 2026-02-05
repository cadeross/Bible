"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useReadingPreferences, PaletteType } from "@/contexts/reading-preferences";

interface CalHeatmapWrapperProps {
    data: Record<string, number>; // { 'YYYY-MM-DD': seconds }
}

// Theme-aware color palettes for the heatmap
// Each palette has: empty color, and 4 levels of activity (matching bg-primary/10, /25, /50, /75)
const HEATMAP_COLORS: Record<PaletteType, Record<'light' | 'dark', { empty: string; levels: string[] }>> = {
    standard: {
        light: {
            empty: 'rgba(244, 244, 245, 0.6)',
            levels: ['rgba(26, 26, 26, 0.15)', 'rgba(26, 26, 26, 0.30)', 'rgba(26, 26, 26, 0.55)', 'rgba(26, 26, 26, 0.80)']
        },
        dark: {
            empty: 'rgba(38, 38, 38, 0.6)',
            levels: ['rgba(237, 237, 237, 0.15)', 'rgba(237, 237, 237, 0.30)', 'rgba(237, 237, 237, 0.55)', 'rgba(237, 237, 237, 0.80)']
        }
    },
    solarized: {
        light: {
            empty: 'rgba(238, 232, 213, 0.6)',
            levels: ['rgba(181, 137, 0, 0.15)', 'rgba(181, 137, 0, 0.30)', 'rgba(181, 137, 0, 0.55)', 'rgba(181, 137, 0, 0.80)']
        },
        dark: {
            empty: 'rgba(7, 54, 66, 0.6)',
            levels: ['rgba(181, 137, 0, 0.15)', 'rgba(181, 137, 0, 0.30)', 'rgba(181, 137, 0, 0.55)', 'rgba(181, 137, 0, 0.80)']
        }
    },
    sepia: {
        light: {
            empty: 'rgba(239, 234, 221, 0.6)',
            levels: ['rgba(67, 52, 34, 0.15)', 'rgba(67, 52, 34, 0.30)', 'rgba(67, 52, 34, 0.55)', 'rgba(67, 52, 34, 0.80)']
        },
        dark: {
            empty: 'rgba(44, 34, 26, 0.6)',
            levels: ['rgba(212, 197, 176, 0.15)', 'rgba(212, 197, 176, 0.30)', 'rgba(212, 197, 176, 0.55)', 'rgba(212, 197, 176, 0.80)']
        }
    },
    terminal: {
        light: {
            empty: 'rgba(230, 255, 230, 0.6)',
            levels: ['rgba(0, 136, 0, 0.15)', 'rgba(0, 136, 0, 0.30)', 'rgba(0, 136, 0, 0.55)', 'rgba(0, 136, 0, 0.80)']
        },
        dark: {
            empty: 'rgba(0, 26, 5, 0.6)',
            levels: ['rgba(0, 255, 65, 0.15)', 'rgba(0, 255, 65, 0.30)', 'rgba(0, 255, 65, 0.55)', 'rgba(0, 255, 65, 0.80)']
        }
    },
    midnight: {
        light: {
            empty: 'rgba(226, 232, 240, 0.6)',
            levels: ['rgba(15, 23, 42, 0.15)', 'rgba(15, 23, 42, 0.30)', 'rgba(15, 23, 42, 0.55)', 'rgba(15, 23, 42, 0.80)']
        },
        dark: {
            empty: 'rgba(30, 41, 59, 0.6)',
            levels: ['rgba(56, 189, 248, 0.15)', 'rgba(56, 189, 248, 0.30)', 'rgba(56, 189, 248, 0.55)', 'rgba(56, 189, 248, 0.80)']
        }
    },
    lavender: {
        light: {
            empty: 'rgba(233, 213, 255, 0.6)',
            levels: ['rgba(147, 51, 234, 0.15)', 'rgba(147, 51, 234, 0.30)', 'rgba(147, 51, 234, 0.55)', 'rgba(147, 51, 234, 0.80)']
        },
        dark: {
            empty: 'rgba(59, 7, 100, 0.5)',
            levels: ['rgba(192, 132, 252, 0.15)', 'rgba(192, 132, 252, 0.35)', 'rgba(192, 132, 252, 0.55)', 'rgba(192, 132, 252, 0.80)']
        }
    },
    rose: {
        light: {
            empty: 'rgba(255, 228, 230, 0.6)',
            levels: ['rgba(190, 18, 60, 0.15)', 'rgba(190, 18, 60, 0.30)', 'rgba(190, 18, 60, 0.55)', 'rgba(190, 18, 60, 0.80)']
        },
        dark: {
            empty: 'rgba(74, 4, 24, 0.6)',
            levels: ['rgba(251, 113, 133, 0.15)', 'rgba(251, 113, 133, 0.35)', 'rgba(251, 113, 133, 0.55)', 'rgba(251, 113, 133, 0.80)']
        }
    },
    oled: {
        light: {
            empty: 'rgba(244, 244, 245, 0.6)',
            levels: ['rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0.30)', 'rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.80)']
        },
        dark: {
            empty: 'rgba(26, 26, 26, 0.6)',
            levels: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.55)', 'rgba(255, 255, 255, 0.80)']
        }
    }
};

// Unique ID for this component's style tag
const STYLE_ID = 'cal-heatmap-theme-styles';

export function CalHeatmapWrapper({ data }: CalHeatmapWrapperProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const calRef = useRef<any>(null);
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const { palette } = useReadingPreferences();

    // Only render on client
    useEffect(() => {
        setMounted(true);
    }, []);

    // Inject dynamic CSS for theme colors
    useEffect(() => {
        if (!mounted) return;

        const themeMode = resolvedTheme === 'dark' ? 'dark' : 'light';
        const colors = HEATMAP_COLORS[palette]?.[themeMode] || HEATMAP_COLORS.standard[themeMode];

        // Remove existing style if present
        const existing = document.getElementById(STYLE_ID);
        if (existing) {
            existing.remove();
        }

        // Create new style tag with CSS overrides
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            /* Override cal-heatmap default colors for theme */
            #cal-heatmap-container .ch-subdomain-bg,
            [data-theme="dark"] #cal-heatmap-container .ch-subdomain-bg,
            [data-theme="light"] #cal-heatmap-container .ch-subdomain-bg {
                fill: ${colors.empty} !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            const styleToRemove = document.getElementById(STYLE_ID);
            if (styleToRemove) {
                styleToRemove.remove();
            }
        };
    }, [mounted, resolvedTheme, palette]);

    const paintHeatmap = useCallback(() => {
        if (!mounted || !containerRef.current) return;

        // Clear container before painting
        containerRef.current.innerHTML = '';

        // Calculate how many months fit based on container width
        const containerWidth = containerRef.current.clientWidth;
        const avgMonthWidth = 64;
        const monthsThatFit = Math.max(3, Math.floor(containerWidth / avgMonthWidth) + 1);
        const range = Math.min(monthsThatFit, 12);

        // Get colors from our palette mapping
        const themeMode = resolvedTheme === 'dark' ? 'dark' : 'light';
        const colors = HEATMAP_COLORS[palette]?.[themeMode] || HEATMAP_COLORS.standard[themeMode];

        // Build color range: [empty, level1, level2, level3, level4]
        const colorRange = [colors.empty, ...colors.levels];

        // Dynamic import to avoid SSR issues
        import('cal-heatmap').then((CalHeatmapModule) => {
            import('cal-heatmap/cal-heatmap.css');

            const CalHeatmap = CalHeatmapModule.default;

            // Convert data format: { 'YYYY-MM-DD': seconds } -> [{ date: timestamp, value: minutes }]
            const formattedData = Object.entries(data).map(([dateStr, seconds]) => ({
                date: new Date(dateStr).getTime(),
                value: Math.round(seconds / 60)
            }));

            // Calculate start date based on range
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - (range - 1));
            startDate.setDate(1);

            // Destroy previous instance if exists
            if (calRef.current) {
                calRef.current.destroy();
            }

            // Initialize CalHeatmap
            const cal = new CalHeatmap();
            calRef.current = cal;

            cal.paint({
                itemSelector: containerRef.current!,
                range: range,
                domain: {
                    type: "month",
                    gutter: 4,
                    label: {
                        text: "MMM",
                        position: "top",
                        textAlign: "start"
                    }
                },
                subDomain: {
                    type: "ghDay",
                    radius: 2,
                    width: 11,
                    height: 11,
                    gutter: 3,
                    color: colors.empty
                },
                date: {
                    start: startDate
                },
                data: {
                    source: formattedData,
                    x: (d: any) => d.date,
                    y: (d: any) => d.value,
                    defaultValue: 0
                },
                scale: {
                    color: {
                        type: "threshold",
                        range: colorRange,
                        domain: [1, 5, 15, 30]
                    }
                }
            });
        });
    }, [data, mounted, resolvedTheme, palette]);

    useEffect(() => {
        paintHeatmap();

        // Debounced resize handler
        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(paintHeatmap, 150);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
            if (calRef.current) {
                calRef.current.destroy();
                calRef.current = null;
            }
        };
    }, [paintHeatmap]);

    if (!mounted) {
        return <div className="h-[150px] animate-pulse bg-muted/20 rounded" />;
    }

    return (
        <div
            id="cal-heatmap-container"
            ref={containerRef}
            className="w-full [&_.ch-domain-text]:fill-muted-foreground [&_.ch-domain-text]:font-mono [&_.ch-domain-text]:text-[10px]"
        />
    );
}
