"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { applyTint, getStoredTint } from "@/lib/tint-colors"

export function TintColorApplier() {
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        const id = getStoredTint()
        applyTint(id, resolvedTheme === "dark" || resolvedTheme === "oled" || resolvedTheme === "solarized")
    }, [resolvedTheme])

    return null
}
