"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useNavMode } from "@/contexts/nav-mode"
import { InlineNav } from "@/components/inline-nav"
import { ContentFooter } from "@/components/content-footer"

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { navMode } = useNavMode()
    const isHomePage = pathname === "/" || pathname === "/read" || pathname.startsWith("/read/")
    const isInline = navMode === "inline"

    return (
        <main className={cn(
            "flex flex-col w-full",
            isHomePage ? "flex-1" : "min-h-screen",
            isInline ? "pt-0 pb-0" : "pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+var(--maintenance-banner-height))]"
        )}>
            {isInline && (
                <div className="sticky top-[var(--maintenance-banner-height)] z-40 w-full">
                    <div className="w-full bg-background">
                        <div className="mx-auto w-full max-w-4xl border-b border-border/10 px-6 py-3">
                            <InlineNav />
                        </div>
                    </div>
                    <div className="pointer-events-none h-12 w-full bg-gradient-to-b from-background/80 to-transparent" />
                </div>
            )}
            {children}
            {isInline && (
                <div className="mx-auto w-full max-w-4xl px-6 pb-10">
                    <ContentFooter />
                </div>
            )}
        </main>
    )
}
