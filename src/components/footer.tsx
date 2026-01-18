"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
    Github,
    Heart,
    Mail,
    GitBranch,
    Palette,
    Moon,
    Sun,
    Laptop
} from "lucide-react"
import { ChangelogDialog } from "@/components/changelog-dialog"

import { useFocusMode } from "@/contexts/focus-mode"

export function Footer() {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    const { isFocusMode } = useFocusMode()

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const cycleTheme = () => {
        // Simple cycle logic: system -> light -> dark -> sepia -> oled -> system
        const order = ["system", "light", "dark", "sepia", "oled"]
        const currentIndex = order.indexOf(theme || "system")
        const nextIndex = (currentIndex + 1) % order.length
        setTheme(order[nextIndex])
    }

    // Icon map for visual flair
    // ...

    if (!mounted) return null

    return (
        <footer className={cn(
            "w-full p-6 hidden md:flex justify-between items-end z-50 transition-all duration-500",
            "fixed bottom-0 left-0 right-0", // Always fixed
            isFocusMode ? "opacity-0 hover:opacity-100" : "opacity-100"
        )}>
            {/* Left side: Socials & Support */}
            <div className="flex gap-6 text-xs font-mono text-muted-foreground/50">
                <a
                    href="https://github.com/cadeross"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:text-primary transition-colors group"
                >
                    <Github className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="pb-px">github</span>
                </a>
                <a
                    href="https://x.com/cadeccr"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:text-primary transition-colors group"
                >
                    {/* Custom X Logo SVG - reduced size */}
                    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                    </svg>
                    <span className="pb-px">x.com</span>
                </a>
                <a
                    href="#"
                    className="flex items-center gap-2 hover:text-primary transition-colors group"
                >
                    <Heart className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="pb-px">support</span>
                </a>
                <a
                    href="mailto:hello@example.com"
                    className="flex items-center gap-2 hover:text-primary transition-colors group"
                >
                    <Mail className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="pb-px">contact</span>
                </a>
            </div>

            {/* Right side: Theme & Version */}
            <div className="flex gap-6 text-xs font-mono text-muted-foreground/50">
                <button
                    onClick={cycleTheme}
                    className="flex items-center gap-2 hover:text-primary transition-colors group"
                >
                    <Palette className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="opacity-50 group-hover:opacity-100 transition-opacity pb-px">theme:</span>
                    <span className={cn(
                        "font-bold transition-all pb-px",
                        theme === "light" && "text-foreground",
                        theme === "dark" && "text-foreground",
                        theme === "sepia" && "text-amber-700 dark:text-amber-400",
                    )}>
                        {theme}
                    </span>
                </button>

                <ChangelogDialog>
                    <button className="flex items-center gap-2 hover:text-primary transition-colors group cursor-pointer">
                        <GitBranch className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                        <span className="group-hover:underline decoration-dashed underline-offset-4 pb-px">
                            v1.0.0
                        </span>
                    </button>
                </ChangelogDialog>
            </div>
        </footer>
    )
}
