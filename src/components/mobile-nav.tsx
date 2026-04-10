"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Church, BookOpen, Library, Search, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { openCommandMenu } from "@/lib/open-command-menu"
import { useFocusMode } from "@/contexts/focus-mode"
import { hapticLight } from "@/lib/haptics"
import { motion } from "framer-motion"

const tabs = [
    { kind: "link" as const, name: "Read", href: "/read", icon: BookOpen },
    { kind: "link" as const, name: "Daily", href: "/daily", icon: Church },
    { kind: "command" as const, name: "Search", icon: Search },
    { kind: "link" as const, name: "Library", href: "/library", icon: Library },
    { kind: "link" as const, name: "Settings", href: "/settings", icon: Settings },
] as const

export function MobileNav() {
    const { isFocusMode } = useFocusMode()
    const pathname = usePathname()

    return (
        <motion.nav
            animate={isFocusMode ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ pointerEvents: isFocusMode ? "none" : "auto" }}
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 flex items-end pb-[env(safe-area-inset-bottom)] md:hidden",
                "border-t border-foreground/[0.07] glass-nav"
            )}
            aria-label="Primary mobile"
        >
            <div className="flex h-[52px] w-full items-stretch justify-around px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = tab.kind === "link" && (
                        tab.href === "/read"
                            ? pathname === "/read" || pathname.startsWith("/read/")
                            : pathname === tab.href || pathname.startsWith(tab.href + "/")
                    )

                    if (tab.kind === "command") {
                        return (
                            <button
                                key={tab.name}
                                type="button"
                                onClick={() => { hapticLight(); openCommandMenu() }}
                                style={{ touchAction: "manipulation" }}
                                className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 min-h-[44px]"
                            >
                                <Icon
                                    className="h-[20px] w-[20px] text-muted-foreground"
                                    strokeWidth={1.5}
                                    aria-hidden
                                />
                                <span className="max-w-full truncate text-[10px] font-medium text-muted-foreground">
                                    {tab.name}
                                </span>
                            </button>
                        )
                    }

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            onClick={() => hapticLight()}
                            style={{ touchAction: "manipulation" }}
                            className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 min-h-[44px]"
                        >
                            {isActive && (
                                <span aria-hidden className="absolute top-1 h-7 w-11 rounded-full bg-primary/[0.12] dark:bg-primary/[0.18]" />
                            )}
                            <Icon
                                className={cn(
                                    "relative h-[20px] w-[20px] transition-colors duration-100",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}
                                strokeWidth={isActive ? 2 : 1.5}
                                aria-hidden
                            />
                            <span className={cn(
                                "relative max-w-full truncate text-[10px] font-medium transition-colors duration-100",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                {tab.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </motion.nav>
    )
}
