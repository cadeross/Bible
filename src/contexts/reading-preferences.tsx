"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type FontType = "sans" | "serif" | "mono" | "pixel"
export type PaletteType = "standard" | "terminal" | "solarized" | "sepia" | "midnight" | "lavender" | "rose" | "oled" | "things"

export interface ReadingPreferences {
    fontSize: number
    fontFamily: FontType
    lineHeight: number
    showVerseNumbers: boolean
    redLetters: boolean
    showTitles: boolean
    defaultHighlightColor: string
    palette: PaletteType
    bibleVersion: string
}

interface ReadingPreferencesContextType extends ReadingPreferences {
    isLoaded: boolean
    setFontSize: (size: number) => void
    setFontFamily: (font: FontType) => void
    setLineHeight: (height: number) => void
    setShowVerseNumbers: (show: boolean) => void
    setRedLetters: (show: boolean) => void
    setShowTitles: (show: boolean) => void
    setDefaultHighlightColor: (color: string) => void
    setPalette: (palette: PaletteType) => void
    setBibleVersion: (version: string) => void
    resetPreferences: () => void
}

const defaultPreferences: ReadingPreferences = {
    fontSize: 18,
    fontFamily: "serif",
    lineHeight: 1.6,
    showVerseNumbers: true,
    redLetters: true,
    showTitles: true,
    defaultHighlightColor: "yellow",
    palette: "things",
    bibleVersion: "nrsvce",
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

                    // Validate palette (migration for legacy/removed themes like 'forest')
                    const validPalettes: PaletteType[] = ["standard", "terminal", "solarized", "sepia", "midnight", "lavender", "rose", "oled", "things"];
                    if (parsed.palette && !validPalettes.includes(parsed.palette)) {
                        parsed.palette = "standard";
                    }

                    // Default bibleVersion if missing
                    if (!parsed.bibleVersion) {
                        parsed.bibleVersion = "nrsvce";
                    }

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

            // Sync palette to document attribute for CSS targeting
            document.documentElement.setAttribute('data-palette', preferences.palette)
        }
    }, [preferences, isLoaded])

    const setFontSize = (fontSize: number) => setPreferences((prev) => ({ ...prev, fontSize }))
    const setFontFamily = (fontFamily: FontType) => setPreferences((prev) => ({ ...prev, fontFamily }))
    const setLineHeight = (lineHeight: number) => setPreferences((prev) => ({ ...prev, lineHeight }))
    const setShowVerseNumbers = (showVerseNumbers: boolean) => setPreferences((prev) => ({ ...prev, showVerseNumbers }))
    const setRedLetters = (redLetters: boolean) => setPreferences((prev) => ({ ...prev, redLetters }))
    const setShowTitles = (showTitles: boolean) => setPreferences((prev) => ({ ...prev, showTitles }))
    const setDefaultHighlightColor = (defaultHighlightColor: string) => setPreferences((prev) => ({ ...prev, defaultHighlightColor }))
    const setPalette = (palette: PaletteType) => setPreferences((prev) => ({ ...prev, palette }))
    const setBibleVersion = (bibleVersion: string) => setPreferences((prev) => ({ ...prev, bibleVersion }))
    const resetPreferences = () => setPreferences(defaultPreferences)

    const value = {
        ...preferences,
        isLoaded,
        setFontSize,
        setFontFamily,
        setLineHeight,
        setShowVerseNumbers,
        setRedLetters,
        setShowTitles,
        setDefaultHighlightColor,
        setPalette,
        setBibleVersion,
        resetPreferences,
    }

    return (
        <ReadingPreferencesContext.Provider value={value}>
            {children}
        </ReadingPreferencesContext.Provider>
    )
}

// Synchronous helper to read bibleVersion from localStorage before React renders.
// Use this in navigation handlers where the context may not yet be available.
export function getStoredBibleVersion(): string {
    if (typeof window === "undefined") return defaultPreferences.bibleVersion
    try {
        const saved = localStorage.getItem("reading-preferences")
        if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed.bibleVersion) return parsed.bibleVersion
        }
    } catch {}
    return defaultPreferences.bibleVersion
}

export function useReadingPreferences() {
    const context = useContext(ReadingPreferencesContext)
    if (context === undefined) {
        throw new Error("useReadingPreferences must be used within a ReadingPreferencesProvider")
    }
    return context
}
