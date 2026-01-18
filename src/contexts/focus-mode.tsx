"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type FocusContextType = {
    isFocusMode: boolean
    toggleFocusMode: () => void
    setFocusMode: (value: boolean) => void
}

const FocusContext = createContext<FocusContextType | undefined>(undefined)

export function FocusProvider({ children }: { children: React.ReactNode }) {
    const [isFocusMode, setIsFocusMode] = useState(false)

    // Optional: Persist focus mode or reset on navigation? 
    // For now, let's keep it per-session or reset on nav if desired.
    // User asked for a toggle on Read page, implying it might be specific to reading but the requirement is "hide nav/footer".

    const toggleFocusMode = () => setIsFocusMode((prev) => !prev)

    return (
        <FocusContext.Provider value={{ isFocusMode, toggleFocusMode, setFocusMode: setIsFocusMode }}>
            {children}
        </FocusContext.Provider>
    )
}

export function useFocusMode() {
    const context = useContext(FocusContext)
    if (context === undefined) {
        throw new Error("useFocusMode must be used within a FocusProvider")
    }
    return context
}
