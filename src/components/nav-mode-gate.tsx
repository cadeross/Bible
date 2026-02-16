"use client"

import { useNavMode } from "@/contexts/nav-mode"

interface NavModeGateProps {
    mode: "classic" | "inline"
    children: React.ReactNode
}

/**
 * Only renders its children when the current nav mode matches.
 * Used to conditionally show/hide classic header/footer/mobile-nav.
 */
export function NavModeGate({ mode, children }: NavModeGateProps) {
    const { navMode } = useNavMode()
    if (navMode !== mode) return null
    return <>{children}</>
}
