export const TINT_COLORS = [
    { id: "blue",     label: "Blue",     light: "#2488f2", dark: "#0a84ff" },
    { id: "indigo",   label: "Indigo",   light: "#5856d6", dark: "#5e5ce6" },
    { id: "purple",   label: "Purple",   light: "#9333ea", dark: "#bf5af2" },
    { id: "pink",     label: "Pink",     light: "#ff85bb", dark: "#ff85bb" },
    { id: "red",      label: "Red",      light: "#dc2626", dark: "#ff453a" },
    { id: "orange",   label: "Orange",   light: "#ea580c", dark: "#ff9f0a" },
    { id: "green",    label: "Green",    light: "#16a34a", dark: "#30d158" },
    { id: "teal",     label: "Teal",     light: "#0891b2", dark: "#5ac8fa" },
    { id: "graphite", label: "Graphite", light: "#6b7280", dark: "#8e8e93" },
] as const

export type TintId = typeof TINT_COLORS[number]["id"]
export const DEFAULT_TINT: TintId = "blue"

export function applyTint(id: TintId, isDark: boolean): void {
    const tint = TINT_COLORS.find(t => t.id === id) ?? TINT_COLORS[0]
    document.documentElement.style.setProperty("--primary", isDark ? tint.dark : tint.light)
    localStorage.setItem("tint-color", id)
}

export function getStoredTint(): TintId {
    if (typeof window === "undefined") return DEFAULT_TINT
    const stored = localStorage.getItem("tint-color")
    return (TINT_COLORS.find(t => t.id === stored)?.id ?? DEFAULT_TINT) as TintId
}
