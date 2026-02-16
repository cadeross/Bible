"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type NavMode = "classic" | "inline"

interface NavModeContextType {
    navMode: NavMode
    toggleNavMode: () => void
    setNavMode: (mode: NavMode) => void
}

const NavModeContext = createContext<NavModeContextType | undefined>(undefined)

const STORAGE_KEY = "openwrit-nav-mode"

export function NavModeProvider({ children }: { children: React.ReactNode }) {
    const [navMode, setNavModeState] = useState<NavMode>("classic")
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved === "classic" || saved === "inline") {
                setNavModeState(saved)
            }
            setIsLoaded(true)
        }
    }, [])

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, navMode)
        }
    }, [navMode, isLoaded])

    const toggleNavMode = () => {
        setNavModeState(prev => prev === "classic" ? "inline" : "classic")
    }

    const setNavMode = (mode: NavMode) => setNavModeState(mode)

    return (
        <NavModeContext.Provider value={{ navMode, toggleNavMode, setNavMode }}>
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
