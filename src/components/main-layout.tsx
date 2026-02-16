"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useNavMode } from "@/contexts/nav-mode"
import { InlineNav } from "@/components/inline-nav"
import { ContentFooter } from "@/components/content-footer"

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { navMode } = useNavMode()
    const isHomePage = pathname === "/"
    const isInline = navMode === "inline"

    return (
        <main className={cn(
            "flex flex-col w-full",
            isHomePage ? "flex-1" : "min-h-screen",
            // Only add fixed-nav padding when in classic mode
            isInline ? "pt-0 pb-0" : "pt-24 pb-24"
        )}>
            {isInline && (
                <div className="sticky top-0 z-40 w-full bg-gradient-to-b from-background via-background/80 to-transparent">
                    <div className="w-full max-w-[900px] mx-auto px-6 pt-8">
                        <InlineNav />
                    </div>
                </div>
            )}
            {children}
            {isInline && (
                <div className="w-full max-w-[900px] mx-auto px-6 pb-8">
                    <ContentFooter />
                </div>
            )}
        </main>
    )
}
