"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Command, Book, BookOpen, User, Settings, Home } from "lucide-react"

import { useFocusMode } from "@/contexts/focus-mode"

export function Header() {
    const pathname = usePathname()
    const { isFocusMode } = useFocusMode()
    const [username, setUsername] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.username) {
                setUsername(user.user_metadata.username)
            }
        }
        getUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user?.user_metadata?.username) {
                setUsername(session.user.user_metadata.username)
            } else if (event === 'SIGNED_OUT') {
                setUsername(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase])

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
        <header className={cn(
            "w-full p-6 hidden md:flex justify-between items-start z-50 transition-all duration-500",
            "fixed top-0 left-0 right-0", // Always fixed
            isFocusMode ? "opacity-0 hover:opacity-100" : "opacity-100"
        )}>
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
                            className="flex items-center gap-2 transition-colors group"
                        >
                            <Icon className={cn(
                                "h-3 w-3 transition-opacity",
                                active ? "text-primary opacity-100" : "opacity-60 group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-white"
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
            <div className="flex gap-6 text-xs font-mono text-muted-foreground/50">
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
                                active ? "text-primary opacity-100" : "opacity-60 group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-white"
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
