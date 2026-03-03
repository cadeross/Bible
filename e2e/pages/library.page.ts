import { Page } from "@playwright/test"

export class LibraryPage {
    constructor(private page: Page) {}

    async goto() {
        await this.page.goto("/library")
        await this.page.waitForLoadState("networkidle")
    }

    async getHighlights() {
        return this.page.locator("[data-highlight-item]").all()
    }

    async deleteHighlight(index: number) {
        const items = await this.getHighlights()
        const deleteBtn = items[index].getByRole("button", { name: /delete|remove/i })
        await deleteBtn.click()
    }
}
