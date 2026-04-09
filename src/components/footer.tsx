"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"
import { useFocusMode } from "@/contexts/focus-mode"
import { motion } from "framer-motion"

export function Footer() {
    const pathname = usePathname()
    const [mounted, setMounted] = React.useState(false)
    const [isPeeking, setIsPeeking] = React.useState(false)
    const { isFocusMode, toggleFocusMode } = useFocusMode()

    React.useEffect(() => { setMounted(true) }, [])
    React.useEffect(() => { if (!isFocusMode) setIsPeeking(false) }, [isFocusMode])

    if (!mounted) return null

    const hidden = isFocusMode && !isPeeking

    return (
        <>
            {isFocusMode && (
                <div
                    className="fixed bottom-0 left-0 right-0 z-[60] h-20 hidden md:block"
                    onMouseEnter={() => setIsPeeking(true)}
                    onMouseLeave={() => setIsPeeking(false)}
                />
            )}
        <motion.footer
            animate={hidden ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ pointerEvents: hidden ? "none" : "auto" }}
            className="w-full p-6 hidden md:flex justify-between items-end z-50 fixed bottom-0 left-0 right-0"
        >
            <div className="flex gap-5 text-xs text-muted-foreground/40">
                <a
                    href="https://x.com/cadeross"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors duration-200 hover:text-foreground"
                >
                    X
                </a>
                <a
                    href="https://form.typeform.com/to/b26fjWPA"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors duration-200 hover:text-foreground"
                >
                    Contact
                </a>
            </div>

            <div className="flex gap-5 text-xs text-muted-foreground/40">
                {pathname?.startsWith("/read") && (
                    <button
                        onClick={toggleFocusMode}
                        className="flex items-center gap-1.5 transition-colors duration-200 hover:text-foreground"
                    >
                        {isFocusMode ? (
                            <EyeOff className="h-3 w-3" />
                        ) : (
                            <Eye className="h-3 w-3" />
                        )}
                        Focus
                    </button>
                )}

                <Link href="/how-to" className={cn("transition-colors duration-200 hover:text-foreground", pathname === "/how-to" && "text-foreground/60")}>
                    Help
                </Link>

                <Link href="/updates" className={cn("transition-colors duration-200 hover:text-foreground", pathname === "/updates" && "text-foreground/60")}>
                    v1.0.2
                </Link>
            </div>
        </motion.footer>
        </>
    )
}
