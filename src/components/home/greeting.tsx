"use client"

import { useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"

export function Greeting() {
    const [date, setDate] = useState<string>("")
    const [username, setUsername] = useState<string>("guest")

    useEffect(() => {
        setDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toLowerCase())

        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.username) {
                setUsername(user.user_metadata.username)
            }
        }
        getUser()
    }, [])

    return (
        <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-mono font-bold text-primary tracking-tight">
                welcome, {username}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
                {date || "..."}
            </p>
        </div>
    )
}
