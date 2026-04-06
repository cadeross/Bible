export const OPEN_COMMAND_MENU_EVENT = "open-command-menu"

export type OpenCommandMenuDetail = {
    /** Pre-fill the palette query (e.g. first typed character). */
    query?: string
}

export function openCommandMenu(query = "") {
    if (typeof window === "undefined") return
    window.dispatchEvent(
        new CustomEvent<OpenCommandMenuDetail>(OPEN_COMMAND_MENU_EVENT, {
            detail: { query },
        })
    )
}
