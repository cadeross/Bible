import { Page, expect } from "@playwright/test"

const readingTipsSeeded = new WeakMap<Page, boolean>()

const HIGHLIGHT_COLOR_KEYS: Record<
    "yellow" | "green" | "blue" | "pink" | "purple" | "orange",
    string
> = {
    yellow: "1",
    green: "2",
    blue: "3",
    pink: "4",
    purple: "5",
    orange: "6",
}

export class ReadingPage {
    constructor(private page: Page) {}

    /** Close only the command palette if it is open (blocks verse clicks). */
    private async dismissCommandPaletteIfOpen() {
        const cmd = this.page.locator("[data-openwrit-command=\"input\"]")
        for (let i = 0; i < 6; i++) {
            if ((await cmd.count()) === 0) return
            await this.page.keyboard.press("Escape")
            await this.page.waitForTimeout(80)
        }
    }

    async goto(book: string, chapter: number, translation = "dra") {
        if (!readingTipsSeeded.get(this.page)) {
            await this.page.addInitScript(() => {
                localStorage.setItem("openwrit-reading-tips-seen", "1")
            })
            readingTipsSeeded.set(this.page, true)
        }
        await this.page.goto(`/read/${encodeURIComponent(book)}/${chapter}?translation=${translation}`)
        await this.page.waitForSelector("[data-verse]", { timeout: 30_000 })
    }

    async getVerseText(verseNum: number) {
        return this.page.locator(`[data-verse="${verseNum}"]`).innerText()
    }

    async selectVerse(verseNum: number) {
        await this.page.locator(`[data-verse="${verseNum}"]`).click()
    }

    async longPressVerse(verseNum: number) {
        await this.dismissCommandPaletteIfOpen()
        const verse = this.page.locator(`[data-verse="${verseNum}"]`)
        await verse.dispatchEvent("contextmenu")
        await this.page.getByRole("menu", { name: "Highlight options" }).waitFor({ state: "visible", timeout: 15_000 })
    }

    async applyHighlightColor(
        color: "yellow" | "green" | "blue" | "pink" | "purple" | "orange"
    ) {
        // Prefer shortcuts: color swatches can sit outside the viewport in headless layout.
        await this.page.keyboard.press(HIGHLIGHT_COLOR_KEYS[color])
    }

    async removeHighlightViaActiveSwatch(color: "yellow" | "green" | "blue" | "pink" | "purple" | "orange") {
        await this.page.keyboard.press(HIGHLIGHT_COLOR_KEYS[color])
    }

    async nextChapter() {
        await this.page.evaluate(() => {
            document.querySelectorAll<HTMLElement>("input, textarea, select").forEach((el) => el.blur())
            window.getSelection()?.removeAllRanges()
        })
        await this.page.waitForTimeout(100)
        await this.page.evaluate(() => {
            window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight", bubbles: true })
            )
        })
    }

    async prevChapter() {
        await this.page.evaluate(() => {
            document.querySelectorAll<HTMLElement>("input, textarea, select").forEach((el) => el.blur())
            window.getSelection()?.removeAllRanges()
        })
        await this.page.waitForTimeout(100)
        await this.page.evaluate(() => {
            window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowLeft", code: "ArrowLeft", bubbles: true })
            )
        })
    }

    async waitForChapter(book: string, chapter: number) {
        await expect(this.page).toHaveURL(new RegExp(`/read/${encodeURIComponent(book)}/${chapter}`), {
            timeout: 15_000,
        })
        await this.page.waitForSelector("[data-verse]", { timeout: 10000 })
    }

    async isHighlightMenuVisible() {
        return this.page.getByRole("menu", { name: "Highlight options" }).isVisible()
    }

    async closeHighlightMenu() {
        await this.page.keyboard.press("Escape")
    }
}
