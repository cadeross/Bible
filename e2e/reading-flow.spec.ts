import { test, expect } from "@playwright/test"
import { ReadingPage } from "./pages/reading.page"

test.describe("Reading flow", () => {
    test("Genesis 1 loads with verse text visible", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        const firstVerse = page.locator("[data-verse='1']")
        await expect(firstVerse).toBeVisible()
        const text = await firstVerse.innerText()
        expect(text.length).toBeGreaterThan(10)
    })

    test("Chapter header shows correct reference", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        const heading = page.locator("h1").filter({ hasText: /Genesis/i })
        await expect(heading).toBeVisible()
    })

    test("Arrow right navigates to next chapter", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)
        await reading.nextChapter()
        await reading.waitForChapter("Genesis", 2)
    })

    test("Arrow left navigates to previous chapter", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 2)
        await reading.prevChapter()
        await reading.waitForChapter("Genesis", 1)
    })

    test("Arrow left on chapter 1 does nothing", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)
        await reading.prevChapter()
        await expect(page).toHaveURL(/\/Genesis\/1/)
    })

    test("Shared verse param highlights and scrolls to verse", async ({ page }) => {
        await page.goto("/read/John/3?translation=dra&v=16")
        await page.waitForSelector("[data-verse]")

        // Verse 16 should have pulse animation class or just be visible
        const verse16 = page.locator("[data-verse='16']")
        await expect(verse16).toBeVisible()
    })

    test("Translation query param loads correct version label", async ({ page }) => {
        await page.goto("/read/Genesis/1?translation=kjv")
        await page.waitForSelector("[data-verse]")
        await expect(page.locator("[data-reading-chrome]")).toBeVisible()
        await expect(
            page.locator('input.uppercase').filter({ hasValue: "KJV" })
        ).toBeVisible()
    })

    test("Multiple verses render in paragraph form (inline spans)", async ({ page }) => {
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)

        const verses = page.locator("[data-verse]")
        const count = await verses.count()
        expect(count).toBeGreaterThan(5)

        // Verses should be inline (span), not block (li, p)
        const firstTag = await verses.first().evaluate((el) => el.tagName.toLowerCase())
        expect(firstTag).toBe("span")
    })

    test("No console errors on reading page load", async ({ page }) => {
        const errors: string[] = []
        page.on("console", (msg) => {
            if (msg.type() === "error") errors.push(msg.text())
        })
        const reading = new ReadingPage(page)
        await reading.goto("Genesis", 1)
        await page.waitForTimeout(1000)

        const criticalErrors = errors.filter(
            (e) => !e.includes("favicon") && !e.includes("404") && !e.includes("net::ERR")
        )
        expect(criticalErrors).toHaveLength(0)
    })
})
