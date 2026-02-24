"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type FocusContextType = {
    isFocusMode: boolean
    toggleFocusMode: () => void
    setFocusMode: (value: boolean) => void
}

const defaultContext: FocusContextType = {
    isFocusMode: false,
    toggleFocusMode: () => { },
    setFocusMode: () => { }
}

const FocusContext = createContext<FocusContextType>(defaultContext)

export function FocusProvider({ children }: { children: React.ReactNode }) {
    const [isFocusMode, setIsFocusMode] = useState(false)

    // Optional: Persist focus mode or reset on navigation? 
    // For now, let's keep it per-session or reset on nav if desired.
    // User asked for a toggle on Read page, implying it might be specific to reading but the requirement is "hide nav/footer".

    const toggleFocusMode = () => setIsFocusMode((prev) => !prev)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }
            if (e.altKey && e.key === 'f') {
                e.preventDefault() // Prevent default browser behavior (e.g. typing special char)
                toggleFocusMode()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <FocusContext.Provider value={{ isFocusMode, toggleFocusMode, setFocusMode: setIsFocusMode }}>
            {children}
        </FocusContext.Provider>
    )
}

export function useFocusMode() {
    return useContext(FocusContext)
}
