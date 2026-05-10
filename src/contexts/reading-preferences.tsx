"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type FontType = "sans" | "serif" | "mono" | "pixel" | "script"

export interface ReadingPreferences {
    fontSize: number
    fontFamily: FontType
    lineHeight: number
    showVerseNumbers: boolean
    redLetters: boolean
    showTitles: boolean
    defaultHighlightColor: string
    bibleVersion: string
    /** null = all translations shown; string[] = only these IDs shown */
    enabledTranslations: string[] | null
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
    setBibleVersion: (version: string) => void
    setEnabledTranslations: (ids: string[] | null) => void
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
    bibleVersion: "nrsvce",
    enabledTranslations: null,
}

const ReadingPreferencesContext = createContext<ReadingPreferencesContextType | undefined>(undefined)

/** Drop removed keys (e.g. legacy `palette`) from persisted preferences. */
function sanitizeStoredPreferences(raw: Record<string, unknown>): Partial<ReadingPreferences> {
    const next = { ...raw }
    delete next.palette
    return next as Partial<ReadingPreferences>
}

export function ReadingPreferencesProvider({ children }: { children: React.ReactNode }) {
    const [preferences, setPreferences] = useState<ReadingPreferences>(defaultPreferences)
    const [isLoaded, setIsLoaded] = useState(false)

    // Account system temporarily disabled — preferences live only in localStorage.
    // The Convex hydrate/sync effects were removed alongside auth.

    // Merge persisted preferences after mount so server and first client paint match (no localStorage on SSR).
    useEffect(() => {
        document.documentElement.removeAttribute("data-palette")
        const saved = localStorage.getItem("reading-preferences")
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as Record<string, unknown>
                const cleaned = sanitizeStoredPreferences(parsed)
                if (!cleaned.bibleVersion) cleaned.bibleVersion = "nrsvce"
                // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: hydrate from localStorage once after mount
                setPreferences({ ...defaultPreferences, ...cleaned })
            } catch (e) {
                console.error("Failed to parse reading preferences", e)
            }
        }
        setIsLoaded(true)
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
    const setShowTitles = (showTitles: boolean) => setPreferences((prev) => ({ ...prev, showTitles }))
    const setDefaultHighlightColor = (defaultHighlightColor: string) =>
        setPreferences((prev) => ({ ...prev, defaultHighlightColor }))
    const setBibleVersion = (bibleVersion: string) => setPreferences((prev) => ({ ...prev, bibleVersion }))
    const setEnabledTranslations = (enabledTranslations: string[] | null) => setPreferences((prev) => ({ ...prev, enabledTranslations }))
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
        setBibleVersion,
        setEnabledTranslations,
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
            const parsed = JSON.parse(saved) as { bibleVersion?: string }
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
