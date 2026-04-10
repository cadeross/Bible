"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLastReadUrl } from "@/lib/use-last-read-url"
import { cn } from "@/lib/utils"
import { useFocusMode } from "@/contexts/focus-mode"
import { Search, Settings } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SettingsPanel } from "@/components/settings-panel"
import { SearchPanel } from "@/components/search-panel"

function OpenWritLogo({ className }: { className?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 370 370"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="185.062" cy="185.062" r="185.062" fill="currentColor" />
            <rect x="168.955" y="102.397" width="31.9991" height="165.755" rx="7" fill="white" />
            <rect x="102.396" y="168.955" width="165.755" height="31.9991" rx="7" fill="white" />
        </svg>
    )
}

const hoverPillClass = "absolute inset-0 -z-10 rounded-full scale-90 opacity-0 transition-[transform,opacity,background-color,box-shadow,backdrop-filter] duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 group-hover:bg-foreground/[0.05] group-hover:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.15),inset_0_-0.5px_0_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.05)] group-hover:backdrop-blur-xl group-hover:backdrop-saturate-150 dark:group-hover:bg-white/[0.07] dark:group-hover:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.08),inset_0_-0.5px_0_rgba(255,255,255,0.03),0_2px_12px_rgba(0,0,0,0.2)]"

function NavLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="group isolate relative px-3 py-1.5 text-[13px] font-medium tracking-[-0.01em] text-muted-foreground/60 transition-colors duration-200 hover:text-foreground"
        >
            {children}
            <span className={hoverPillClass} />
        </Link>
    )
}

export function InlineNav() {
    const pathname = usePathname() || "/"
    const { isFocusMode } = useFocusMode()
    const isReadPage = pathname.startsWith("/read")
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const lastReadUrl = useLastReadUrl()

    return (
        <nav
            className={cn(
                "w-full transition-opacity duration-500",
                isReadPage && isFocusMode && "pointer-events-none opacity-0"
            )}
            aria-label="Primary"
        >
            <div className="flex items-center justify-between">
                <Link
                    href={lastReadUrl}
                    className="group isolate relative flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-200"
                >
                    <OpenWritLogo className="rounded-[3px] text-muted-foreground/30 transition-colors duration-200 group-hover:text-primary" />
                    <span className="text-[14px] font-semibold tracking-tight text-muted-foreground/50 transition-colors duration-200 group-hover:text-foreground">
                        OpenWrit
                    </span>
                    <span className={hoverPillClass} />
                </Link>

                <div className="flex items-center gap-0.5">
                    <NavLink href={lastReadUrl}>Read</NavLink>
                    <NavLink href="/daily">Daily</NavLink>
                    <NavLink href="/library">Library</NavLink>

                    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                aria-label="Search"
                                className="group isolate relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/50 transition-colors duration-200 hover:text-foreground"
                            >
                                <Search className="h-3.5 w-3.5" />
                                <span className={hoverPillClass} />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" sideOffset={8} className="w-auto p-0 overflow-hidden">
                            <SearchPanel open={searchOpen} onOpenChange={setSearchOpen} />
                        </PopoverContent>
                    </Popover>

                    <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                aria-label="Settings"
                                className="group isolate relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/50 transition-colors duration-200 hover:text-foreground"
                            >
                                <Settings className="h-3.5 w-3.5" />
                                <span className={hoverPillClass} />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" sideOffset={8} className="w-auto p-0 overflow-hidden">
                            <SettingsPanel onClose={() => setSettingsOpen(false)} />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </nav>
    )
}
