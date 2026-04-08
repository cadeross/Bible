"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Settings, Search } from "lucide-react"

import { useFocusMode } from "@/contexts/focus-mode"
import { openCommandMenu } from "@/lib/open-command-menu"

function OpenWritLogo({ className }: { className?: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 370 370" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="185.062" cy="185.062" r="185.062" fill="currentColor" />
            <rect x="168.955" y="102.397" width="31.9991" height="165.755" rx="7" fill="white" />
            <rect x="102.396" y="168.955" width="165.755" height="31.9991" rx="7" fill="white" />
        </svg>
    )
}

function HeaderLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="group relative px-3 py-1.5 text-[13px] font-medium tracking-[-0.01em] text-muted-foreground/80 transition-colors duration-200 hover:text-foreground"
        >
            {children}
            <span className="absolute inset-0 rounded-full bg-transparent transition-all duration-200 group-hover:bg-foreground/[0.04] group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] dark:group-hover:bg-white/[0.05]" style={{ zIndex: -1 }} />
        </Link>
    )
}

export function Header() {
    const pathname = usePathname()
    const { isFocusMode } = useFocusMode()

    return (
        <header
            className={cn(
                "z-50 hidden w-full transition-all duration-500 md:block",
                "fixed left-0 right-0 top-[var(--maintenance-banner-height)]",
                "border-b border-white/[0.08] glass-nav",
                isFocusMode ? "opacity-0 hover:opacity-100" : "opacity-100"
            )}
        >
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
                <Link
                    href="/read"
                    className="group relative flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-200"
                >
                    <OpenWritLogo className="rounded-[3px] text-muted-foreground/40 transition-colors duration-200 group-hover:text-primary" />
                    <span className="text-[15px] font-semibold tracking-tight text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
                        OpenWrit
                    </span>
                    <span className="absolute inset-0 rounded-full bg-transparent transition-all duration-200 group-hover:bg-foreground/[0.04] dark:group-hover:bg-white/[0.05]" style={{ zIndex: -1 }} />
                </Link>

                <div className="flex items-center gap-0.5">
                    <HeaderLink href="/read">Read</HeaderLink>
                    <HeaderLink href="/daily">Daily</HeaderLink>
                    <HeaderLink href="/library">Library</HeaderLink>

                    <button
                        type="button"
                        onClick={() => openCommandMenu()}
                        className="group relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/80 transition-colors duration-200 hover:text-foreground"
                        aria-label="Search"
                    >
                        <Search className="h-3.5 w-3.5" aria-hidden />
                        <span className="absolute inset-0 rounded-full bg-transparent transition-all duration-200 group-hover:bg-foreground/[0.04] dark:group-hover:bg-white/[0.05]" style={{ zIndex: -1 }} />
                    </button>

                    <HeaderLink href="/settings">
                        <Settings className="h-3.5 w-3.5" aria-hidden />
                    </HeaderLink>
                </div>
            </div>
        </header>
    )
}
