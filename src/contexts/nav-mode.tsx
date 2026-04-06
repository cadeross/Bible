"use client"

import React, { createContext, useContext, useEffect } from "react"

type NavMode = "classic" | "inline"

/** Full = multi-row inline nav; minimal = compact read · library · search row */
export type InlineNavLayout = "full" | "minimal"

/**
 * Change these in code to preview other layouts. Classic header/footer/mobile-nav
 * and full inline nav remain implemented; they are not exposed in the UI.
 */
export const DEFAULT_NAV_MODE: NavMode = "inline"
export const DEFAULT_INLINE_NAV_LAYOUT: InlineNavLayout = "minimal"

interface NavModeContextType {
    navMode: NavMode
    inlineNavLayout: InlineNavLayout
}

const NavModeContext = createContext<NavModeContextType | undefined>(undefined)

function clearLegacyNavStorage() {
    if (typeof window === "undefined") return
    try {
        localStorage.removeItem("openwrit-nav-mode")
        localStorage.removeItem("openwrit-nav-mode-v2")
        localStorage.removeItem("openwrit-inline-nav-layout")
        localStorage.removeItem("openwrit-inline-nav-layout-v2")
    } catch {
        /* ignore */
    }
}

export function NavModeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        clearLegacyNavStorage()
    }, [])

    const value: NavModeContextType = {
        navMode: DEFAULT_NAV_MODE,
        inlineNavLayout: DEFAULT_INLINE_NAV_LAYOUT,
    }

    return <NavModeContext.Provider value={value}>{children}</NavModeContext.Provider>
}

export function useNavMode() {
    const context = useContext(NavModeContext)
    if (context === undefined) {
        throw new Error("useNavMode must be used within a NavModeProvider")
    }
    return context
}
