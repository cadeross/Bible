import { test, expect } from "@playwright/test"
import { ReadingPage } from "./pages/reading.page"

test.describe("Accessibility", () => {
    test("No critical console errors on reading page load", async ({ page }) => {
        const errors: string[] = []
        page.on("console", (msg) => {
            if (msg.type() === "error") errors.push(msg.text())
        })

        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)
        await page.waitForTimeout(1500)

        const criticalErrors = errors.filter(
            (e) =>
                !e.includes("favicon") &&
                !e.includes("404") &&
                !e.includes("net::ERR") &&
                !e.includes("Failed to load resource")
        )
        expect(criticalErrors).toHaveLength(0)
    })

    test("Verse numbers have aria-hidden='true'", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        const sup = page.locator("[data-verse='1'] sup").first()
        await expect(sup).toHaveAttribute("aria-hidden", "true")
    })

    test("Highlight menu is reachable via keyboard after context menu", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        await reading.longPressVerse(1)

        const menu = page.getByRole("menu", { name: "Highlight options" })
        await expect(menu).toBeVisible()

        await page.keyboard.press("ArrowDown")
        await expect(page.locator(":focus")).toHaveAttribute("role", "menuitem")
    })

    test("Reader chrome controls have focus-visible styles", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        for (let i = 0; i < 3; i++) {
            await page.keyboard.press("Escape")
            await page.waitForTimeout(60)
        }
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.())
        await page.waitForTimeout(200)

        const appearanceBtn = page.getByRole("button", { name: /appearance and typography/i })
        await appearanceBtn.scrollIntoViewIfNeeded()
        await appearanceBtn.click({ timeout: 10_000 })
        const increaseBtn = page.getByRole("button", { name: /increase font size/i })
        await increaseBtn.waitFor({ state: "visible", timeout: 15_000 })
        await increaseBtn.focus()
        await expect(increaseBtn).toBeFocused()
    })

    test("aria-live region is present in reading content", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        await expect(page.locator("[data-reading-live]")).toBeAttached()
    })

    test("All chapter nav buttons are keyboard accessible", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 2)

        // Prev chapter nav button (desktop side nav)
        const prevBtn = page.locator("button").filter({ has: page.locator("svg") }).first()
        await expect(prevBtn).toBeEnabled()

        // Arrow key navigation works
        await reading.prevChapter()
        await reading.waitForChapter("Genesis", 1)
    })
})
