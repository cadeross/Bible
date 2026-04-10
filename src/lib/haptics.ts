import type { WebHaptics as WebHapticsType } from "web-haptics"

let _instance: WebHapticsType | null = null

function h(): WebHapticsType | null {
    if (typeof window === "undefined") return null
    if (!_instance) {
        // Dynamic require keeps this out of the SSR bundle
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { WebHaptics } = require("web-haptics") as { WebHaptics: new () => WebHapticsType }
        _instance = new WebHaptics()
    }
    return _instance
}

/** 30ms — verse tap, nav tab */
export const hapticLight   = () => { h()?.trigger(30) }
/** nudge preset — chapter navigation */
export const hapticMedium  = () => { h()?.trigger("nudge") }
/** 80ms — long-press menu open */
export const hapticHeavy   = () => { h()?.trigger(80) }
/** success preset — focus mode toggle */
export const hapticSuccess = () => { h()?.trigger("success") }
