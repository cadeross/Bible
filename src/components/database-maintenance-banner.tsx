"use client"

import { useLayoutEffect, useRef } from "react"
import { motion } from "framer-motion"
import { DATABASE_MAINTENANCE_BANNER_ENABLED } from "@/lib/database-maintenance"

function PulsingStatusDot() {
    return (
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
            <motion.span
                className="absolute inset-0 rounded-full bg-orange-500 opacity-60"
                animate={{ scale: [1, 2.1, 1], opacity: [0.45, 0, 0.45] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
                className="relative block h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.85)]"
                animate={{ scale: [1, 1.12, 1], opacity: [1, 0.72, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
        </span>
    )
}

export function DatabaseMaintenanceBanner() {
    const ref = useRef<HTMLDivElement>(null)
    const enabled = DATABASE_MAINTENANCE_BANNER_ENABLED

    useLayoutEffect(() => {
        if (!enabled) return
        const el = ref.current
        if (!el) return
        const sync = () => {
            document.documentElement.style.setProperty(
                "--maintenance-banner-height",
                `${el.offsetHeight}px`
            )
        }
        sync()
        const ro = new ResizeObserver(sync)
        ro.observe(el)
        return () => {
            ro.disconnect()
            document.documentElement.style.removeProperty("--maintenance-banner-height")
        }
    }, [enabled])

    if (!enabled) return null

    return (
        <motion.div
            ref={ref}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            initial={{ y: -28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.85 }}
            className="fixed left-0 right-0 top-0 z-[100] border-b border-orange-500/25 bg-gradient-to-b from-orange-500/12 via-amber-500/10 to-transparent px-4 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] text-center shadow-sm backdrop-blur-[2px] dark:from-orange-500/18 dark:via-amber-500/12"
        >
            <div className="mx-auto flex max-w-3xl items-center justify-center gap-2.5 text-xs font-mono leading-snug text-orange-950/90 dark:text-orange-50/95 sm:text-sm sm:gap-3">
                <PulsingStatusDot />
                <p>
                    <span className="font-semibold">Active database updates in progress.</span>{" "}
                    <span className="text-orange-900/85 dark:text-orange-100/80">
                        Accounts may not work properly at this time.
                    </span>
                </p>
            </div>
        </motion.div>
    )
}
