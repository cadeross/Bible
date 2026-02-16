"use client"

import { useLayoutEffect } from "react"
import { useReadingPreferences } from "@/contexts/reading-preferences"
import { useTheme } from "next-themes"

export function ThemeFavicon() {
    const { palette } = useReadingPreferences()
    const { resolvedTheme } = useTheme()

    useLayoutEffect(() => {
        const updateFavicon = () => {
            const createIcon = () => {
                const style = getComputedStyle(document.documentElement)
                // We need to read the variable value. If it's not set (e.g. strict mode/server), fallback to black
                const primaryParams = style.getPropertyValue('--primary').trim()

                if (!primaryParams) return

                // Helper to resolve CSS variable to actual color
                const resolveColor = (cssVar: string) => {
                    const temp = document.createElement('div')
                    temp.style.color = `var(${cssVar})`
                    temp.style.display = 'none'
                    document.body.appendChild(temp)
                    const color = getComputedStyle(temp).color
                    document.body.removeChild(temp)
                    return color
                }

                const resolvedPrimary = resolveColor('--primary')
                const resolvedForeground = resolveColor('--primary-foreground')

                // SVG with circle and central cross
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="14" fill="${resolvedPrimary}" />
                        <path d="M16 10 V22 M10 16 H22" stroke="${resolvedForeground}" stroke-width="3" stroke-linecap="round" />
                    </svg>
                `
                const svgDataUri = `data:image/svg+xml;base64,${btoa(svg)}`

                const existingLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement
                if (existingLink) {
                    existingLink.href = svgDataUri
                } else {
                    const newLink = document.createElement("link")
                    newLink.rel = "shortcut icon"
                    newLink.href = svgDataUri
                    document.head.appendChild(newLink)
                }
            }

            // Allow a brief delay for theme-provider to apply classes and CSS variables to settle
            setTimeout(createIcon, 50)
        }

        updateFavicon()

        const observer = new MutationObserver(() => {
            setTimeout(updateFavicon, 50)
        })

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'style', 'data-theme', 'data-palette']
        })

        return () => observer.disconnect()

    }, [palette, resolvedTheme])

    return null
}
