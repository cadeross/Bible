"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { cn } from "@/lib/utils"
import { Book, BookOpen, User, Settings, Home, Search } from "lucide-react"

import { useFocusMode } from "@/contexts/focus-mode"
import { openCommandMenu } from "@/lib/open-command-menu"

export function Header() {
    const pathname = usePathname()
    const { isFocusMode } = useFocusMode()
    const { isSignedIn } = useAuth()
    const { user } = useUser()
    const profile = useQuery(
        api.profiles.getMyProfile,
        isSignedIn ? {} : "skip"
    )

    const username =
        profile?.username ??
        user?.username ??
        user?.firstName ??
        null

    const navItems = [
        { kind: "link" as const, name: "home", href: "/", icon: Home },
        { kind: "link" as const, name: "read", href: "/read", icon: Book },
        { kind: "link" as const, name: "library", href: "/library", icon: BookOpen },
        { kind: "palette" as const, name: "search", icon: Search },
    ] as const

    const rightItems = [
        {
            name: username || "profile",
            href: "/profile",
            icon: User
        },
        {
            name: "settings",
            href: "/settings",
            icon: Settings
        }
    ]

    // Helper for active state
    const isActiveLink = (href: string) => {
        if (href === "/") return pathname === "/"
        return pathname?.startsWith(href)
    }

    return (
        <header
            className={cn(
                "w-full p-6 hidden md:flex justify-between items-start z-50 transition-all duration-500",
                "fixed left-0 right-0 top-[var(--maintenance-banner-height)]",
                isFocusMode ? "opacity-0 hover:opacity-100" : "opacity-100"
            )}
        >
            {/* Left side: Logo & Main Nav */}
            <div className="flex gap-6 text-xs font-mono text-muted-foreground">
                {/* Logo Removed */}

                {navItems.map((item) => {
                    const Icon = item.icon
                    if (item.kind === "palette") {
                        return (
                            <button
                                key={item.name}
                                type="button"
                                onClick={() => openCommandMenu()}
                                className="flex items-center gap-2 transition-colors group"
                            >
                                <Icon className="h-3 w-3 opacity-85 transition-opacity group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-white" />
                                <span className="pb-px group-hover:text-foreground dark:group-hover:text-white">
                                    {item.name}
                                </span>
                            </button>
                        )
                    }
                    const active = isActiveLink(item.href)
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-2 transition-colors group"
                        >
                            <Icon className={cn(
                                "h-3 w-3 transition-opacity",
                                active ? "text-primary opacity-100" : "opacity-85 group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-white"
                            )} />
                            <span className={cn(
                                "pb-px",
                                active ? "text-foreground dark:text-white" : "group-hover:text-foreground dark:group-hover:text-white"
                            )}>{item.name}</span>
                        </Link>
                    )
                })}
            </div>

            {/* Right side: User Tools */}
            <div className="flex gap-6 text-xs font-mono text-muted-foreground">
                {rightItems.map((item) => {
                    const active = isActiveLink(item.href)
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-2 transition-colors group"
                        >
                            <Icon className={cn(
                                "h-3 w-3 transition-opacity",
                                active ? "text-primary opacity-100" : "opacity-85 group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-white"
                            )} />
                            <span className={cn(
                                "pb-px",
                                active ? "text-foreground dark:text-white" : "group-hover:text-foreground dark:group-hover:text-white"
                            )}>{item.name}</span>
                        </Link>
                    )
                })}
            </div>
        </header>
    )
}
