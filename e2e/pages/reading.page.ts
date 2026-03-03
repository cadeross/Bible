import { Page, expect } from "@playwright/test"

export class ReadingPage {
    constructor(private page: Page) {}

    async goto(book: string, chapter: number, translation = "dra") {
        await this.page.goto(`/read/${encodeURIComponent(book)}/${chapter}?translation=${translation}`)
        await this.page.waitForSelector("[data-verse]", { timeout: 10000 })
    }

    async getVerseText(verseNum: number) {
        return this.page.locator(`[data-verse="${verseNum}"]`).innerText()
    }

    async selectVerse(verseNum: number) {
        await this.page.locator(`[data-verse="${verseNum}"]`).click()
    }

    async longPressVerse(verseNum: number) {
        const verse = this.page.locator(`[data-verse="${verseNum}"]`)
        await verse.dispatchEvent("contextmenu")
        await this.page.waitForSelector('[role="toolbar"][aria-label="Highlight options"]')
    }

    async applyHighlightColor(color: "yellow" | "green" | "blue" | "pink" | "purple") {
        await this.page.getByRole("button", { name: `Highlight ${color}` }).click()
    }

    async nextChapter() {
        await this.page.keyboard.press("ArrowRight")
    }

    async prevChapter() {
        await this.page.keyboard.press("ArrowLeft")
    }

    async waitForChapter(book: string, chapter: number) {
        await expect(this.page).toHaveURL(new RegExp(`/read/${encodeURIComponent(book)}/${chapter}`))
        await this.page.waitForSelector("[data-verse]", { timeout: 10000 })
    }

    async isHighlightMenuVisible() {
        return this.page.locator('[role="toolbar"][aria-label="Highlight options"]').isVisible()
    }

    async closeHighlightMenu() {
        await this.page.keyboard.press("Escape")
    }
}
