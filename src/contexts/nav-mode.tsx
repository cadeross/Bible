"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type NavMode = "classic" | "inline"

/** Full = current multi-row inline nav; minimal = earlier style, read/library/search on the right only */
export type InlineNavLayout = "full" | "minimal"

interface NavModeContextType {
    navMode: NavMode
    toggleNavMode: () => void
    setNavMode: (mode: NavMode) => void
    inlineNavLayout: InlineNavLayout
    setInlineNavLayout: (layout: InlineNavLayout) => void
    toggleInlineNavLayout: () => void
}

const NavModeContext = createContext<NavModeContextType | undefined>(undefined)

const STORAGE_KEY = "openwrit-nav-mode"
const INLINE_LAYOUT_KEY = "openwrit-inline-nav-layout"

export function NavModeProvider({ children }: { children: React.ReactNode }) {
    const [navMode, setNavModeState] = useState<NavMode>("inline")
    const [inlineNavLayout, setInlineNavLayoutState] = useState<InlineNavLayout>("full")
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved === "classic" || saved === "inline") {
                setNavModeState(saved)
            }
            const savedLayout = localStorage.getItem(INLINE_LAYOUT_KEY)
            if (savedLayout === "full" || savedLayout === "minimal") {
                setInlineNavLayoutState(savedLayout)
            }
            setIsLoaded(true)
        }
    }, [])

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, navMode)
        }
    }, [navMode, isLoaded])

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(INLINE_LAYOUT_KEY, inlineNavLayout)
        }
    }, [inlineNavLayout, isLoaded])

    const toggleNavMode = () => {
        setNavModeState(prev => prev === "classic" ? "inline" : "classic")
    }

    const setNavMode = (mode: NavMode) => setNavModeState(mode)

    const setInlineNavLayout = (layout: InlineNavLayout) => setInlineNavLayoutState(layout)

    const toggleInlineNavLayout = () => {
        setInlineNavLayoutState((prev) => (prev === "full" ? "minimal" : "full"))
    }

    return (
        <NavModeContext.Provider
            value={{
                navMode,
                toggleNavMode,
                setNavMode,
                inlineNavLayout,
                setInlineNavLayout,
                toggleInlineNavLayout,
            }}
        >
            {children}
        </NavModeContext.Provider>
    )
}

export function useNavMode() {
    const context = useContext(NavModeContext)
    if (context === undefined) {
        throw new Error("useNavMode must be used within a NavModeProvider")
    }
    return context
}
