"use client"

import { useLayoutEffect } from "react"
import { useTheme } from "next-themes"

export function ThemeFavicon() {
    const { resolvedTheme } = useTheme()

    useLayoutEffect(() => {
        const update = () => {
            const primary = (resolvedTheme === "dark" || resolvedTheme === "oled" || resolvedTheme === "solarized") ? "#0a84ff" : "#2488f2"

            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 370 370"><circle cx="185" cy="185" r="185" fill="${primary}"/><rect x="169" y="102" width="32" height="166" rx="7" fill="white"/><rect x="102" y="169" width="166" height="32" rx="7" fill="white"/></svg>`
            const href = `data:image/svg+xml;base64,${btoa(svg)}`

            const existing = document.querySelectorAll("link[rel*='icon']")
            if (existing.length > 0) {
                existing.forEach((el) => { (el as HTMLLinkElement).href = href })
            } else {
                const link = document.createElement("link")
                link.rel = "icon"
                link.type = "image/svg+xml"
                link.href = href
                document.head.appendChild(link)
            }
        }

        setTimeout(update, 50)
    }, [resolvedTheme])

    return null
}
