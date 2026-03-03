import type { Transition } from "framer-motion"

export const SPRING_CONFIG: Transition = {
    type: "spring",
    stiffness: 400,
    damping: 30,
}

export const SPRING_FAST: Transition = {
    type: "spring",
    stiffness: 500,
    damping: 30,
}
