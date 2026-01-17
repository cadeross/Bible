"use client"

import { useEffect, useState } from "react"

export function Greeting() {
    const [date, setDate] = useState<string>("")

    useEffect(() => {
        setDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toLowerCase())
    }, [])

    return (
        <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-mono font-bold text-primary tracking-tight">
                welcome, cadeross
            </h1>
            <p className="font-mono text-sm text-muted-foreground/50">
                {date || "..."}
            </p>
        </div>
    )
}
