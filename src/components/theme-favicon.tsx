"use client"

import { useLayoutEffect } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"

export function ThemeFavicon() {
    const { resolvedTheme } = useTheme()
    const pathname = usePathname()

    useLayoutEffect(() => {
        const updateFavicon = () => {
            const createIcon = () => {
                const resolveColor = (cssVar: string) => {
                    const temp = document.createElement("div")
                    temp.style.color = `var(${cssVar})`
                    temp.style.display = "none"
                    document.body.appendChild(temp)
                    const color = getComputedStyle(temp).color
                    document.body.removeChild(temp)
                    return color
                }

                const resolvedPrimary = resolveColor("--primary")
                const resolvedForeground = resolveColor("--primary-foreground")

                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="14" fill="${resolvedPrimary}" />
                        <path d="M16 10 V22 M10 16 H22" stroke="${resolvedForeground}" stroke-width="3" stroke-linecap="round" />
                    </svg>
                `
                const svgDataUri = `data:image/svg+xml;base64,${btoa(svg)}`

                const existingLinks = document.querySelectorAll("link[rel*='icon']")
                if (existingLinks.length > 0) {
                    existingLinks.forEach((link) => {
                        ;(link as HTMLLinkElement).href = svgDataUri
                    })
                } else {
                    const newLink = document.createElement("link")
                    newLink.rel = "shortcut icon"
                    newLink.href = svgDataUri
                    document.head.appendChild(newLink)
                }
            }

            setTimeout(createIcon, 50)
        }

        updateFavicon()

        const observer = new MutationObserver(() => {
            setTimeout(updateFavicon, 50)
        })

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "style", "data-theme"],
        })

        return () => observer.disconnect()
    }, [resolvedTheme, pathname])

    return null
}
