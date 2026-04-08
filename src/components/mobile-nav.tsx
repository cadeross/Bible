"use client"

import Link from "next/link"
import { Church, BookOpen, Library, Search, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { openCommandMenu } from "@/lib/open-command-menu"

const tabs = [
    { kind: "link" as const, name: "Read", href: "/read", icon: BookOpen },
    { kind: "link" as const, name: "Daily", href: "/daily", icon: Church },
    { kind: "command" as const, name: "Search", icon: Search },
    { kind: "link" as const, name: "Library", href: "/library", icon: Library },
    { kind: "link" as const, name: "Settings", href: "/settings", icon: Settings },
] as const

export function MobileNav() {
    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 flex items-end pb-[env(safe-area-inset-bottom)] md:hidden",
                "border-t border-white/[0.08] glass-nav"
            )}
            aria-label="Primary mobile"
        >
            <div className="flex h-[52px] w-full items-stretch justify-around px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    if (tab.kind === "command") {
                        return (
                            <button
                                key={tab.name}
                                type="button"
                                onClick={() => openCommandMenu()}
                                className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1"
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
                            className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1"
                        >
                            <Icon
                                className="h-[20px] w-[20px] text-muted-foreground"
                                strokeWidth={1.5}
                                aria-hidden
                            />
                            <span className="max-w-full truncate text-[10px] font-medium text-muted-foreground">
                                {tab.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
