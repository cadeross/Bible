/**
 * Verse highlight palette — tints aligned with Apple system marker colors
 * (Yellow, Green, Blue, Pink, Purple, Orange) at soft opacities on text.
 */
export const HIGHLIGHT_MENU_COLORS = [
    {
        id: "yellow",
        label: "Highlight yellow",
        removeLabel: "Remove yellow highlight",
        class: "bg-[rgba(255,204,0,0.28)] dark:bg-[rgba(255,204,0,0.2)]",
        dotClass: "bg-[#FFCC00]",
        settingsBorder: "border-[#CCAA00]/55",
    },
    {
        id: "green",
        label: "Highlight green",
        removeLabel: "Remove green highlight",
        class: "bg-[rgba(52,199,89,0.26)] dark:bg-[rgba(52,199,89,0.2)]",
        dotClass: "bg-[#34C759]",
        settingsBorder: "border-[#28A745]/55",
    },
    {
        id: "blue",
        label: "Highlight blue",
        removeLabel: "Remove blue highlight",
        class: "bg-[rgba(0,122,255,0.22)] dark:bg-[rgba(10,132,255,0.22)]",
        dotClass: "bg-[#007AFF] dark:bg-[#0A84FF]",
        settingsBorder: "border-[#0066DD]/55",
    },
    {
        id: "pink",
        label: "Highlight pink",
        removeLabel: "Remove pink highlight",
        class: "bg-[rgba(255,45,85,0.2)] dark:bg-[rgba(255,55,95,0.2)]",
        dotClass: "bg-[#FF2D55]",
        settingsBorder: "border-[#CC2444]/55",
    },
    {
        id: "purple",
        label: "Highlight purple",
        removeLabel: "Remove purple highlight",
        class: "bg-[rgba(175,82,222,0.22)] dark:bg-[rgba(191,90,242,0.22)]",
        dotClass: "bg-[#AF52DE] dark:bg-[#BF5AF2]",
        settingsBorder: "border-[#8E44AD]/55",
    },
    {
        id: "orange",
        label: "Highlight orange",
        removeLabel: "Remove orange highlight",
        class: "bg-[rgba(255,149,0,0.26)] dark:bg-[rgba(255,159,10,0.22)]",
        dotClass: "bg-[#FF9500] dark:bg-[#FF9F0A]",
        settingsBorder: "border-[#CC7700]/55",
    },
] as const

export type HighlightColorId = (typeof HIGHLIGHT_MENU_COLORS)[number]["id"]
