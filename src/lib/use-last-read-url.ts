"use client"

import { useState, useEffect } from "react"
import { getStoredBibleVersion } from "@/contexts/reading-preferences"

export function useLastReadUrl(): string {
    const [url, setUrl] = useState("/read/Genesis/1")

    useEffect(() => {
        try {
            const raw = localStorage.getItem("last-read")
            if (raw) {
                const { book, chapter } = JSON.parse(raw) as { book: string; chapter: number }
                const version = getStoredBibleVersion()
                setUrl(`/read/${encodeURIComponent(book)}/${chapter}?translation=${version}`)
            } else {
                const version = getStoredBibleVersion()
                setUrl(`/read/Genesis/1?translation=${version}`)
            }
        } catch {
            // ignore parse errors
        }
    }, [])

    return url
}
