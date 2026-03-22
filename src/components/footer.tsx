"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { cn } from "@/lib/utils"
import {
    Heart,
    Mail,
    GitBranch,
    Palette,
    Moon,
    Sun,
    Laptop,
    Eye,
    EyeOff,
    HelpCircle,
    Lightbulb,
    Info,
    Church
} from "lucide-react"

import { HowToDialog } from "@/components/how-to-dialog"

import { useFocusMode } from "@/contexts/focus-mode"

export function Footer() {
    const pathname = usePathname()
    const [mounted, setMounted] = React.useState(false)
    const { isFocusMode, toggleFocusMode } = useFocusMode()

    React.useEffect(() => {
        setMounted(true)
    }, [])


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
                    href="https://x.com/cadeross"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 transition-colors group"
                >
                    {/* Custom X Logo SVG - reduced size */}
                    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-white transition-opacity">
                        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                    </svg>
                    <span className="pb-px group-hover:text-foreground dark:group-hover:text-white transition-colors">x.com</span>
                </a>
                {/* <a
                    href="#"
                    className="flex items-center gap-2 hover:text-primary transition-colors group"
                >
                    <Heart className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="pb-px">support</span>
                </a> */}
                <a
                    href="https://form.typeform.com/to/b26fjWPA"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 transition-colors group"
                >
                    <Mail className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-white transition-opacity" />
                    <span className="pb-px group-hover:text-foreground dark:group-hover:text-white transition-colors">contact</span>
                </a>

            </div>

            {/* Right side: Theme & Version */}
            <div className="flex gap-6 text-xs font-mono text-muted-foreground/50">
                {pathname?.startsWith("/read") && (
                    <button
                        onClick={toggleFocusMode}
                        className="flex items-center gap-2 transition-colors group"
                    >
                        {isFocusMode ? (
                            <EyeOff className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-white transition-opacity" />
                        ) : (
                            <Eye className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-white transition-opacity" />
                        )}
                        <span className="group-hover:text-foreground dark:group-hover:text-white transition-colors pb-px">focus</span>
                    </button>
                )}

                <Link href="/how-to" className="flex items-center gap-2 transition-colors group">
                    <HelpCircle className={cn("h-3 w-3 transition-opacity", pathname === "/how-to" ? "text-primary opacity-100" : "opacity-60 group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-white")} />
                    <span className={cn("pb-px", pathname === "/how-to" ? "text-foreground dark:text-white" : "group-hover:text-foreground dark:group-hover:text-white")}>how to</span>
                </Link>

                <Link href="/updates" className="flex items-center gap-2 transition-colors group">
                    <GitBranch className={cn("h-3 w-3 transition-opacity", pathname === "/updates" ? "text-primary opacity-100" : "opacity-60 group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-white")} />
                    <span className={cn("pb-px", pathname === "/updates" ? "text-foreground dark:text-white" : "group-hover:text-foreground dark:group-hover:text-white")}>v1.0.2</span>
                </Link>
            </div>
        </footer>
    )
}
