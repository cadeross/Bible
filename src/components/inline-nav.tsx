"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useFocusMode } from "@/contexts/focus-mode"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"

// Route-to-breadcrumb mapping
const BREADCRUMBS: Record<string, string> = {
    "/": "",
    "/read": "read",
    "/library": "library",
    "/calendar": "liturgical calendar",
    "/profile": "profile",
    "/settings": "settings",
    "/how-to": "how to",
    "/features": "features",
    "/updates": "updates",
}

function getBreadcrumb(pathname: string): string {
    if (BREADCRUMBS[pathname] !== undefined) return BREADCRUMBS[pathname]
    for (const [route, label] of Object.entries(BREADCRUMBS)) {
        if (route !== "/" && pathname.startsWith(route)) return label
    }
    return ""
}

const navLinks = [
    { name: "read", href: "/read" },
    { name: "library", href: "/library" },
]

const rightLinks = [
    { name: "profile", href: "/profile" },
]

export function InlineNav() {
    const pathname = usePathname()
    const { isFocusMode } = useFocusMode()
    const isReadPage = pathname?.startsWith("/read")
    const breadcrumb = getBreadcrumb(pathname || "/")
    const [username, setUsername] = useState<string | null>(null)
    const [isHovered, setIsHovered] = useState(false)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const supabase = createClient()
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.username) {
                setUsername(user.user_metadata.username)
            }
        }
        getUser()
    }, [])

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/"
        return pathname?.startsWith(href)
    }

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
        setIsHovered(true)
    }

    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false)
        }, 200)
    }

    return (
        <nav className={cn(
            "w-full transition-all duration-500",
            isReadPage && isFocusMode && "opacity-0 pointer-events-none"
        )}>
            <div className="pb-6 mb-2">
                <div className="flex items-center justify-between">
                    {/* Left: OPENWRIT + animated nav links */}
                    <div
                        className="flex items-center gap-3 md:gap-5 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground pr-24"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Link
                            href="/"
                            className={cn(
                                "flex items-center gap-3 transition-colors hover:text-primary tracking-[0.45em] text-muted-foreground",
                                pathname === "/" && "text-primary"
                            )}
                        >
                            <span className="h-px w-8 bg-border" />
                            <span>openwrit</span>
                            <AnimatePresence>
                                {pathname !== "/" && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0, x: -8 }}
                                        animate={{ opacity: 1, width: "auto", x: 0 }}
                                        exit={{ opacity: 0, width: 0, x: -8 }}
                                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className="text-muted-foreground/80 overflow-hidden whitespace-nowrap"
                                    >
                                        &nbsp;/ {breadcrumb}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>

                        <AnimatePresence>
                            {isHovered && navLinks.filter(link => !isActive(link.href)).map((link, i, arr) => (
                                <motion.span
                                    key={link.name}
                                    className="flex items-center gap-3 md:gap-5 overflow-hidden"
                                    initial={{ opacity: 0, width: 0, x: -8 }}
                                    animate={{
                                        opacity: 1,
                                        width: "auto",
                                        x: 0,
                                        transition: {
                                            duration: 0.3,
                                            delay: i * 0.06,
                                            ease: [0.25, 0.46, 0.45, 0.94],
                                        },
                                    }}
                                    exit={{
                                        opacity: 0,
                                        width: 0,
                                        x: -8,
                                        transition: {
                                            duration: 0.2,
                                            delay: (arr.length - 1 - i) * 0.04,
                                            ease: [0.55, 0.06, 0.68, 0.19],
                                        },
                                }}
                            >
                                    <span className="text-muted-foreground/45">·</span>
                                    <Link
                                        href={link.href}
                                        className="transition-colors hover:text-primary whitespace-nowrap"
                                    >
                                        {link.name}
                                    </Link>
                                </motion.span>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Right: utility nav */}
                    <div className="hidden sm:flex items-center gap-3 md:gap-5 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                        {rightLinks.filter(link => !isActive(link.href)).map((link, i) => (
                            <span key={link.name} className="flex items-center gap-3 md:gap-5">
                                {i > 0 && <span className="text-muted-foreground/45">·</span>}
                                <Link
                                    href={link.href}
                                    className="transition-colors hover:text-primary"
                                >
                                    {link.name === "profile" && username ? username : link.name}
                                </Link>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    )
}
