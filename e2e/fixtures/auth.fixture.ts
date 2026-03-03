import { test as base, Page } from "@playwright/test"
import path from "path"

// Re-use stored auth state for authenticated tests
export const AUTH_FILE = path.join(__dirname, "../.auth/user.json")

export const test = base.extend<{ authenticatedPage: Page }>({
    authenticatedPage: async ({ browser }, use) => {
        const context = await browser.newContext({ storageState: AUTH_FILE })
        const page = await context.newPage()
        await use(page)
        await context.close()
    },
})

export { expect } from "@playwright/test"
