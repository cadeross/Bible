"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Command, Book, BookOpen, User, Settings, Home } from "lucide-react"

export function Header() {
    const pathname = usePathname()

    const navItems = [
        {
            name: "home",
            href: "/",
            icon: Home
        },
        {
            name: "read",
            href: "/read",
            icon: Book
        },
        {
            name: "library",
            href: "/library",
            icon: BookOpen
        },
    ]

    const rightItems = [
        {
            name: "profile",
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
        <header className="w-full p-6 hidden md:flex justify-between items-start z-40">
            {/* Left side: Logo & Main Nav */}
            <div className="flex gap-6 text-xs font-mono text-muted-foreground/50">
                {/* Logo Removed */}

                {navItems.map((item) => {
                    const active = isActiveLink(item.href)
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 transition-colors group",
                                active ? "text-primary" : "hover:text-primary"
                            )}
                        >
                            <Icon className={cn(
                                "h-3 w-3 transition-opacity",
                                active ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                            )} />
                            <span className="pb-px">{item.name}</span>
                        </Link>
                    )
                })}
            </div>

            {/* Right side: User Tools */}
            <div className="flex gap-6 text-xs font-mono text-muted-foreground/50">
                {rightItems.map((item) => {
                    const active = isActiveLink(item.href)
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 transition-colors group",
                                active ? "text-primary" : "hover:text-primary"
                            )}
                        >
                            <Icon className={cn(
                                "h-3 w-3 transition-opacity",
                                active ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                            )} />
                            <span className="pb-px">{item.name}</span>
                        </Link>
                    )
                })}
            </div>
        </header>
    )
}
