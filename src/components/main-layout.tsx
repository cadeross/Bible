"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isHomePage = pathname === "/"

    return (
        <main className={cn(
            "flex flex-col w-full",
            // On Home: flex-1 allows natural height (footer shows if content is short)
            // On Others: min-h-screen extends to push footer down (though fixed footer overlays anyway, min-h ensures scroll space)
            isHomePage ? "flex-1" : "min-h-screen",
            // Add padding to account for Fixed Header and Footer
            "pt-24 pb-24"
        )}>
            {children}
        </main>
    )
}
