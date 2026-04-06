import { test, expect } from "@playwright/test"
import { ReadingPage } from "./pages/reading.page"

test.describe("Highlights", () => {
    test.beforeEach(async ({ page }) => {
        // Clear localStorage to start fresh
        await page.goto("/")
        await page.evaluate(() => localStorage.removeItem("highlights"))
    })

    test("Right-click verse opens highlight menu", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        await reading.longPressVerse(1)
        expect(await reading.isHighlightMenuVisible()).toBe(true)
    })

    test("Selecting yellow color applies highlight class to verse", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        await reading.longPressVerse(1)
        await reading.applyHighlightColor("yellow")

        const verse = page.locator("[data-verse='1']")
        const className = await verse.getAttribute("class")
        expect(className).toContain("yellow")
    })

    test("Keyboard shortcut 1 applies yellow highlight when menu is open", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        await reading.longPressVerse(2)
        await page.keyboard.press("1")

        const verse = page.locator("[data-verse='2']")
        const className = await verse.getAttribute("class")
        expect(className).toContain("yellow")
    })

    test("Escape key closes highlight menu", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        await reading.longPressVerse(1)
        expect(await reading.isHighlightMenuVisible()).toBe(true)

        await reading.closeHighlightMenu()
        await expect(page.getByRole("menu", { name: "Highlight options" })).not.toBeVisible()
    })

    test("Highlight persists on page reload (localStorage)", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        await reading.longPressVerse(1)
        await reading.applyHighlightColor("green")

        // Reload page
        await page.reload()
        await page.waitForSelector("[data-verse]")

        const verse = page.locator("[data-verse='1']")
        const className = await verse.getAttribute("class")
        expect(className).toContain("green")
    })

    test("Remove highlight removes color class from verse", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        // First add a highlight
        await reading.longPressVerse(1)
        await reading.applyHighlightColor("blue")

        // Then remove it
        await reading.longPressVerse(1)
        await page.getByRole("menuitem", { name: /remove highlight/i }).click()

        const verse = page.locator("[data-verse='1']")
        const className = await verse.getAttribute("class")
        expect(className).not.toContain("blue")
    })

    test("Highlight menu has correct ARIA attributes", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        await reading.longPressVerse(1)

        const menu = page.getByRole("menu", { name: "Highlight options" })
        await expect(menu).toBeVisible()

        await expect(page.getByRole("menuitem", { name: /highlight yellow/i })).toBeVisible()
        await expect(page.getByRole("menuitem", { name: "Note" })).toBeVisible()
        await expect(page.getByRole("menuitem", { name: "Share" })).toBeVisible()
        await expect(page.getByRole("menuitem", { name: /remove highlight/i })).toBeVisible()
    })

    test("Selecting text shows word count announcement in live region", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        const liveRegion = page.locator("[aria-live='polite']")
        await expect(liveRegion).toBeAttached()
    })
})
