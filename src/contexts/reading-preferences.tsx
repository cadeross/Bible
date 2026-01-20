"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type FontType = "sans" | "serif" | "mono"

export interface ReadingPreferences {
    fontSize: number
    fontFamily: FontType
    lineHeight: number
    showVerseNumbers: boolean
    redLetters: boolean
    defaultHighlightColor: string
}

interface ReadingPreferencesContextType extends ReadingPreferences {
    setFontSize: (size: number) => void
    setFontFamily: (font: FontType) => void
    setLineHeight: (height: number) => void
    setShowVerseNumbers: (show: boolean) => void
    setRedLetters: (show: boolean) => void
    setDefaultHighlightColor: (color: string) => void
    resetPreferences: () => void
}

const defaultPreferences: ReadingPreferences = {
    fontSize: 18,
    fontFamily: "serif",
    lineHeight: 1.6,
    showVerseNumbers: true,
    redLetters: true,
    defaultHighlightColor: "yellow",
}

const ReadingPreferencesContext = createContext<ReadingPreferencesContextType | undefined>(undefined)

export function ReadingPreferencesProvider({ children }: { children: React.ReactNode }) {
    const [preferences, setPreferences] = useState<ReadingPreferences>(defaultPreferences)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load preferences from local storage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("reading-preferences")
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    setPreferences({ ...defaultPreferences, ...parsed })
                } catch (e) {
                    console.error("Failed to parse reading preferences", e)
                }
            }
            setIsLoaded(true)
        }
    }, [])

    // Save preferences to local storage when they change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("reading-preferences", JSON.stringify(preferences))
        }
    }, [preferences, isLoaded])

    const setFontSize = (fontSize: number) => setPreferences((prev) => ({ ...prev, fontSize }))
    const setFontFamily = (fontFamily: FontType) => setPreferences((prev) => ({ ...prev, fontFamily }))
    const setLineHeight = (lineHeight: number) => setPreferences((prev) => ({ ...prev, lineHeight }))
    const setShowVerseNumbers = (showVerseNumbers: boolean) => setPreferences((prev) => ({ ...prev, showVerseNumbers }))
    const setRedLetters = (redLetters: boolean) => setPreferences((prev) => ({ ...prev, redLetters }))
    const setDefaultHighlightColor = (defaultHighlightColor: string) => setPreferences((prev) => ({ ...prev, defaultHighlightColor }))
    const resetPreferences = () => setPreferences(defaultPreferences)

    const value = {
        ...preferences,
        setFontSize,
        setFontFamily,
        setLineHeight,
        setShowVerseNumbers,
        setRedLetters,
        setDefaultHighlightColor,
        resetPreferences,
    }

    return (
        <ReadingPreferencesContext.Provider value={value}>
            {children}
        </ReadingPreferencesContext.Provider>
    )
}

export function useReadingPreferences() {
    const context = useContext(ReadingPreferencesContext)
    if (context === undefined) {
        throw new Error("useReadingPreferences must be used within a ReadingPreferencesProvider")
    }
    return context
}
