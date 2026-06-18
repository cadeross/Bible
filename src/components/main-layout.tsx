"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useNavMode } from "@/contexts/nav-mode"
import { useFocusMode } from "@/contexts/focus-mode"
import { InlineNav } from "@/components/inline-nav"

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { navMode } = useNavMode()
    const { isFocusMode } = useFocusMode()
    const isHomePage = pathname === "/" || pathname === "/read" || pathname.startsWith("/read/")
    const isReadPage = pathname === "/read" || pathname.startsWith("/read/")
    const isInline = navMode === "inline"
    const hideInlineNav = isInline && isReadPage && isFocusMode

    return (
        <main className={cn(
            "flex flex-col w-full",
            isHomePage ? "flex-1" : "min-h-screen",
            isInline ? "pt-0 pb-0" : "pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+var(--maintenance-banner-height))]"
        )}>
            {isInline && (
                <div
                    className={cn(
                        "sticky top-[var(--maintenance-banner-height)] z-40 w-full overflow-hidden transition-opacity duration-[850ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                        hideInlineNav
                            ? "opacity-0 pointer-events-none"
                            : "opacity-100"
                    )}
                    aria-hidden={hideInlineNav}
                >
                    <div className="w-full bg-background transition-colors duration-[850ms]">
                        <div className="mx-auto w-full max-w-4xl border-b border-border/10 px-6 py-3">
                            <InlineNav />
                        </div>
                    </div>
                    <div className="pointer-events-none h-12 w-full bg-gradient-to-b from-background/80 to-transparent" />
                </div>
            )}
            {children}
        </main>
    )
}
