import { Page } from "@playwright/test"

export class SettingsPage {
    constructor(private page: Page) {}

    async goto() {
        await this.page.goto("/settings")
        await this.page.waitForLoadState("networkidle")
    }

    async increaseFontSize() {
        await this.page.getByRole("button", { name: /increase font size/i }).click()
    }

    async decreaseFontSize() {
        await this.page.getByRole("button", { name: /decrease font size/i }).click()
    }

    async toggleFocusMode() {
        await this.page.keyboard.press("Alt+f")
    }
}
