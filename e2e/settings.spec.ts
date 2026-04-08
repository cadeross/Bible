import { test, expect, type Page } from "@playwright/test"
import { ReadingPage } from "./pages/reading.page"

test.describe("Reading settings", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/")
        await page.evaluate(() => localStorage.removeItem("reading-preferences"))
    })

    async function openAppearancePopover(page: Page) {
        // Dismiss any overlays (command palette, popover already open, etc.)
        for (let i = 0; i < 3; i++) {
            await page.keyboard.press("Escape")
            await page.waitForTimeout(60)
        }
        // Blur any focused inputs (quick-selector) so keyboard events route correctly
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.())
        await page.waitForTimeout(200)

        const btn = page.getByRole("button", { name: /appearance and typography/i })
        await btn.scrollIntoViewIfNeeded()
        await btn.click({ timeout: 10_000 })
        await page.getByRole("button", { name: /increase font size/i }).waitFor({ state: "visible", timeout: 15_000 })
    }

    test("Font size increase button enlarges text", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        // Get current font size
        const container = page.locator("[data-verse]").first().locator("..")
        const before = await container.evaluate((el) =>
            parseFloat(getComputedStyle(el).fontSize)
        )

        await openAppearancePopover(page)
        // Click increase
        await page.getByRole("button", { name: /increase font size/i }).click()

        const after = await container.evaluate((el) =>
            parseFloat(getComputedStyle(el).fontSize)
        )
        expect(after).toBeGreaterThan(before)
    })

    test("Font size decrease button shrinks text", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        await openAppearancePopover(page)
        // First increase to have room to decrease
        await page.getByRole("button", { name: /increase font size/i }).click()

        const container = page.locator("[data-verse]").first().locator("..")
        const before = await container.evaluate((el) =>
            parseFloat(getComputedStyle(el).fontSize)
        )

        await openAppearancePopover(page)
        await page.getByRole("button", { name: /decrease font size/i }).click()

        const after = await container.evaluate((el) =>
            parseFloat(getComputedStyle(el).fontSize)
        )
        // One step down should be strictly smaller; allow tiny float noise.
        expect(after).toBeLessThan(before - 0.05)
    })

    test("Font size preference persists on reload", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        await openAppearancePopover(page)
        await page.getByRole("button", { name: /increase font size/i }).click()
        await openAppearancePopover(page)
        await page.getByRole("button", { name: /increase font size/i }).click()

        await page.reload()
        await page.waitForSelector("[data-verse]")

        // Font should still be enlarged — check localStorage
        const prefs = await page.evaluate(() => localStorage.getItem("reading-preferences"))
        const parsed = JSON.parse(prefs || "{}")
        expect(parsed.fontSize).toBeGreaterThan(18)
    })

    test("Verse numbers toggle hides/shows verse numbers", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        // Verse row animates in; wait until verse numbers are fully opaque.
        await expect(page.locator("[data-verse='1']")).toBeVisible()
        const sup = page.locator("[data-verse='1'] sup").first()
        await expect(async () => {
            const o = await sup.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
            expect(o).toBeGreaterThan(0.9)
        }).toPass({ timeout: 10_000 })

        await openAppearancePopover(page)
        // Click numbers toggle
        await page.getByRole("button", { name: /numbers/i }).click()

        await expect(async () => {
            const o = await sup.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
            expect(o).toBeLessThan(0.5)
        }).toPass({ timeout: 5000 })
    })

    test("Alt+F toggles focus mode", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        const chrome = page.locator("[data-reading-chrome]")
        await expect(async () => {
            const o = parseFloat(await chrome.evaluate((el) => getComputedStyle(el).opacity))
            expect(o).toBeGreaterThan(0.9)
        }).toPass({ timeout: 8000 })

        await page.keyboard.press("Alt+f")
        await expect(async () => {
            const o = parseFloat(await chrome.evaluate((el) => getComputedStyle(el).opacity))
            expect(o).toBeLessThan(0.3)
        }).toPass({ timeout: 5000 })

        expect(page.url()).toContain("/read/")
    })

    test("Settings persist across page reload", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        await openAppearancePopover(page)
        // Change font to mono
        await page.getByRole("button", { name: "mono" }).click()

        await page.reload()
        await page.waitForSelector("[data-verse]")

        const prefs = await page.evaluate(() => localStorage.getItem("reading-preferences"))
        const parsed = JSON.parse(prefs || "{}")
        expect(parsed.fontFamily).toBe("mono")
    })
})
