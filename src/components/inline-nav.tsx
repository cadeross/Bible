"use client"

import type { MouseEvent, ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useFocusMode } from "@/contexts/focus-mode"
import { useNavMode } from "@/contexts/nav-mode"
import { useAuth, useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Search, Command, Settings, BookOpen, Library, User, Home } from "lucide-react"
import { openCommandMenu } from "@/lib/open-command-menu"

export function InlineNav() {
    const pathname = usePathname() || "/"
    const { inlineNavLayout } = useNavMode()
    const { isFocusMode } = useFocusMode()
    const isReadPage = pathname.startsWith("/read")
    const { isSignedIn } = useAuth()
    const { user } = useUser()
    const profile = useQuery(
        api.profiles.getMyProfile,
        isSignedIn ? {} : "skip"
    )
    const username =
        profile?.username ?? user?.username ?? user?.firstName ?? null

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/"
        return pathname.startsWith(href)
    }

    const profileLabel = username || "Profile"

    const navShell = (children: ReactNode) => (
        <nav
            className={cn(
                "w-full transition-opacity duration-500",
                isReadPage && isFocusMode && "pointer-events-none opacity-0"
            )}
            aria-label="Primary"
        >
            {children}
        </nav>
    )

    if (inlineNavLayout === "minimal") {
        return navShell(
            <div className="pb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href="/"
                        className={cn(
                            "inline-flex shrink-0 items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-primary",
                            pathname === "/" && "text-primary"
                        )}
                    >
                        <span className="h-px w-8 shrink-0 bg-border" />
                        <span className="tracking-[0.45em]">openwrit</span>
                    </Link>

                    <div className="flex min-w-0 flex-wrap items-center gap-3 md:gap-5 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                        <Link
                            href="/read"
                            className={cn(
                                "transition-colors hover:text-primary whitespace-nowrap",
                                isActive("/read") && "text-primary"
                            )}
                        >
                            read
                        </Link>
                        <span className="text-muted-foreground/45">·</span>
                        <Link
                            href="/library"
                            className={cn(
                                "transition-colors hover:text-primary whitespace-nowrap",
                                isActive("/library") && "text-primary"
                            )}
                        >
                            library
                        </Link>
                        <span className="text-muted-foreground/45">·</span>
                        <button
                            type="button"
                            aria-label="Open search palette"
                            onClick={() => openCommandMenu()}
                            className="flex items-center justify-center p-1 transition-colors hover:text-primary"
                        >
                            <Search className="h-3.5 w-3.5 opacity-80" strokeWidth={1.5} />
                        </button>
                        <span className="text-muted-foreground/45">·</span>
                        <Link
                            href="/profile"
                            aria-label={profileLabel}
                            className={cn(
                                "flex items-center justify-center p-1 transition-colors hover:text-primary",
                                isActive("/profile") && "text-primary"
                            )}
                        >
                            <User className="h-3.5 w-3.5 opacity-80" strokeWidth={1.5} />
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const primaryLinks = [
        { kind: "route" as const, name: "home", href: "/", icon: Home },
        { kind: "route" as const, name: "read", href: "/read", icon: BookOpen },
        { kind: "route" as const, name: "library", href: "/library", icon: Library },
        { kind: "palette" as const, name: "search", icon: Search },
    ] as const

    const utilityLinks = [
        { name: "command", href: "#", icon: Command, onClick: (e: MouseEvent) => { e.preventDefault(); openCommandMenu() } },
        { name: "settings", href: "/settings", icon: Settings },
    ] as const

    return navShell(
        <div className="flex flex-col gap-4 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                    href="/"
                    className={cn(
                        "inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-muted-foreground transition-colors hover:text-primary",
                        pathname === "/" && "text-primary"
                    )}
                >
                    <span className="h-px w-6 shrink-0 bg-border" />
                    <span className="whitespace-nowrap">openwrit</span>
                </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-border/15 pb-3">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-0.5 gap-y-1 sm:gap-x-1">
                    {primaryLinks.map((link) => {
                        const Icon = link.icon
                        if (link.kind === "palette") {
                            return (
                                <button
                                    key={link.name}
                                    type="button"
                                    onClick={() => openCommandMenu()}
                                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.5} />
                                    <span>{link.name}</span>
                                </button>
                            )
                        }
                        const active = isActive(link.href)
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors",
                                    active
                                        ? "bg-muted/60 text-foreground"
                                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.5} />
                                <span>{link.name}</span>
                            </Link>
                        )
                    })}
                    <Link
                        href="/profile"
                        aria-label={profileLabel}
                        className={cn(
                            "inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
                            isActive("/profile") && "bg-muted/60 text-foreground"
                        )}
                    >
                        <User className="h-3.5 w-3.5 opacity-70" strokeWidth={1.5} />
                    </Link>
                </div>
                <div className="flex flex-wrap items-center gap-x-0.5 border-t border-border/10 pt-2 sm:border-t-0 sm:pt-0">
                    {utilityLinks.map((link) => {
                        const Icon = link.icon
                        if (link.name === "command") {
                            return (
                                <button
                                    key={link.name}
                                    type="button"
                                    onClick={link.onClick}
                                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.5} />
                                    <span className="hidden sm:inline">⌘K</span>
                                </button>
                            )
                        }
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors",
                                    isActive(link.href)
                                        ? "bg-muted/60 text-foreground"
                                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.5} />
                                <span>{link.name}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
