import { Page, type Locator } from "@playwright/test"

/** Clerk may render in the main document or inside a child iframe depending on version / keys. */
async function findAcrossFrames(page: Page, selector: string): Promise<Locator | null> {
    const onMain = page.locator(selector).first()
    if ((await onMain.count()) > 0) return onMain

    for (const frame of page.frames()) {
        if (frame === page.mainFrame()) continue
        const inner = frame.locator(selector).first()
        if ((await inner.count()) > 0) return inner
    }
    return null
}

const CLERK_IDENTIFIER_SELECTORS = [
    'input[name="identifier"]',
    'input[name="emailAddress"]',
    'input[type="email"]',
    'input[autocomplete="email"]',
]

async function findClerkIdentifier(page: Page): Promise<Locator | null> {
    for (const sel of CLERK_IDENTIFIER_SELECTORS) {
        const loc = await findAcrossFrames(page, sel)
        if (loc) return loc
    }
    return null
}

export class AuthPage {
    constructor(private page: Page) {}

    async gotoLogin() {
        await this.page.goto("/auth/login")
        await this.page.waitForLoadState("domcontentloaded")
        await this.waitForClerkIdentifierField()
    }

    async gotoSignup() {
        await this.page.goto("/auth/sign-up")
        await this.page.waitForLoadState("domcontentloaded")
        await this.waitForClerkIdentifierField()
    }

    private async waitForClerkIdentifierField() {
        for (let attempt = 0; attempt < 3; attempt++) {
            if (attempt > 0) {
                await this.page.reload({ waitUntil: "domcontentloaded" })
            }
            const deadline = Date.now() + 12_000
            while (Date.now() < deadline) {
                const loc = await findClerkIdentifier(this.page)
                if (loc) {
                    await loc.waitFor({ state: "visible", timeout: 5000 }).catch(() => {})
                    return
                }
                await this.page.waitForTimeout(250)
            }
        }
        throw new Error("Timed out waiting for Clerk email / identifier field")
    }

    async login(email: string, password: string) {
        await this.gotoLogin()

        const identifier = await findClerkIdentifier(this.page)
        if (!identifier) throw new Error("identifier input not found")
        await identifier.fill(email)

        let passwordInput = await findAcrossFrames(this.page, 'input[name="password"]')
        if (!passwordInput) {
            const continueBtn = await findAcrossFramesButton(this.page, /continue/i)
            if (continueBtn) await continueBtn.click()
            passwordInput = await findAcrossFrames(this.page, 'input[name="password"]')
        }
        if (!passwordInput) throw new Error("password input not found")
        await passwordInput.fill(password)

        const submit = await findAcrossFramesButton(this.page, /sign in|continue/i)
        if (submit) await submit.click()
    }

    async signup(email: string, password: string) {
        await this.gotoSignup()

        const identifier = await findClerkIdentifier(this.page)
        if (!identifier) throw new Error("identifier input not found")
        await identifier.fill(email)

        let passwordInput = await findAcrossFrames(this.page, 'input[name="password"]')
        if (!passwordInput) {
            const continueBtn = await findAcrossFramesButton(this.page, /continue/i)
            if (continueBtn) await continueBtn.click()
            passwordInput = await findAcrossFrames(this.page, 'input[name="password"]')
        }
        if (!passwordInput) throw new Error("password input not found")
        await passwordInput.fill(password)

        const submit = await findAcrossFramesButton(this.page, /sign up|continue|create/i)
        if (submit) await submit.click()
    }

    async logout() {
        await this.page.getByRole("button", { name: /sign out|log out/i }).click()
    }

    async isLoggedIn() {
        return this.page.url().includes("/profile") || this.page.url().includes("/onboarding")
    }
}

async function findAcrossFramesButton(page: Page, name: RegExp): Promise<Locator | null> {
    const onMain = page.getByRole("button", { name })
    if ((await onMain.count()) > 0) return onMain.first()

    for (const frame of page.frames()) {
        if (frame === page.mainFrame()) continue
        const inner = frame.getByRole("button", { name })
        if ((await inner.count()) > 0) return inner.first()
    }
    return null
}
