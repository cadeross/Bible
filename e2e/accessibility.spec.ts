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

        const toolbar = page.locator('[role="toolbar"][aria-label="Highlight options"]')
        await expect(toolbar).toBeVisible()

        // Tab into the toolbar — first focusable element is the yellow color button
        await page.keyboard.press("Tab")
        const focused = page.locator(":focus")
        await expect(focused).toBeVisible()
    })

    test("All interactive elements in toolbar have focus-visible styles", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        // Check that toolbar buttons can receive focus
        const increaseBtn = page.getByRole("button", { name: /increase font size/i })
        await increaseBtn.focus()
        const outline = await increaseBtn.evaluate((el) => getComputedStyle(el).outlineStyle)
        // focus-visible:ring-2 produces a visible outline
        expect(outline).not.toBe("none")
    })

    test("aria-live region is present in reading content", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        const liveRegion = page.locator("[aria-live='polite']")
        await expect(liveRegion).toBeAttached()
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
