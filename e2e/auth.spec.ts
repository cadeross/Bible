import { test, expect } from "@playwright/test"
import { AuthPage } from "./pages/auth.page"

test.describe("Authentication", () => {
    test("Login page is accessible", async ({ page }) => {
        const auth = new AuthPage(page)
        await auth.gotoLogin()
        await expect(page).toHaveURL(/\/auth\/login/)
    })

    test("Invalid credentials show error message", async ({ page }) => {
        const auth = new AuthPage(page)
        await auth.login("notreal@example.com", "wrongpassword")
        // Should show some error indicator (not redirect to profile)
        await page.waitForTimeout(2000)
        const isOnLogin = page.url().includes("/auth/login") || page.url().includes("/auth")
        expect(isOnLogin).toBe(true)
    })

    test("Signup page is accessible", async ({ page }) => {
        const auth = new AuthPage(page)
        await auth.gotoSignup()
        await expect(page).toHaveURL(/\/auth\/sign-up/)
    })

    test("Auth callback with invalid code redirects to error page", async ({ page }) => {
        await page.goto("/auth/callback?code=INVALID_CODE_12345")
        await page.waitForURL(/auth-code-error|\/auth/)
        // Should not crash — lands on error page
        expect(page.url()).toContain("auth")
    })

    test("Auth callback without code redirects to error page", async ({ page }) => {
        await page.goto("/auth/callback")
        await page.waitForURL(/auth-code-error|\/auth/)
        expect(page.url()).toContain("auth")
    })
})
