"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { DATABASE_MAINTENANCE_BANNER_ENABLED } from "@/lib/database-maintenance"

const DISMISS_STORAGE_KEY = "openwrit-dismiss-db-maintenance-banner"

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
    const [dismissed, setDismissed] = useState(false)

    useEffect(() => {
        if (!enabled) return
        try {
            if (localStorage.getItem(DISMISS_STORAGE_KEY) === "1") setDismissed(true)
        } catch {
            /* ignore */
        }
    }, [enabled])

    const visible = enabled && !dismissed

    useLayoutEffect(() => {
        if (!visible) {
            document.documentElement.style.removeProperty("--maintenance-banner-height")
            return
        }
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
    }, [visible])

    const onDismiss = () => {
        try {
            localStorage.setItem(DISMISS_STORAGE_KEY, "1")
        } catch {
            /* ignore */
        }
        setDismissed(true)
    }

    if (!visible) return null

    return (
        <motion.div
            ref={ref}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            initial={{ y: -28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.85 }}
            className="fixed left-0 right-0 top-0 z-[100] border-b border-orange-500/25 bg-gradient-to-b from-orange-500/12 via-amber-500/10 to-transparent px-3 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] pl-4 text-center shadow-sm backdrop-blur-[2px] dark:from-orange-500/18 dark:via-amber-500/12 sm:px-4"
        >
            <div className="mx-auto flex max-w-3xl items-center gap-2 sm:gap-3">
                <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5 text-xs font-mono leading-snug text-orange-950/90 dark:text-orange-50/95 sm:gap-3 sm:text-sm">
                    <PulsingStatusDot />
                    <p className="text-pretty">
                        <span className="font-semibold">Active database updates in progress.</span>{" "}
                        <span className="text-orange-900/85 dark:text-orange-100/80">
                            Accounts may not work properly at this time.
                        </span>
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="shrink-0 rounded-md p-1.5 text-orange-950/70 transition-colors hover:bg-orange-500/15 hover:text-orange-950 dark:text-orange-50/80 dark:hover:bg-orange-500/20 dark:hover:text-orange-50"
                    aria-label="Dismiss database maintenance notice"
                >
                    <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                </button>
            </div>
        </motion.div>
    )
}
