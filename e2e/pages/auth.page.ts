import { Page, expect } from "@playwright/test"

export class AuthPage {
    constructor(private page: Page) {}

    async gotoLogin() {
        await this.page.goto("/auth/login")
    }

    async gotoSignup() {
        await this.page.goto("/auth/signup")
    }

    async login(email: string, password: string) {
        await this.gotoLogin()
        await this.page.getByLabel(/email/i).fill(email)
        await this.page.getByLabel(/password/i).fill(password)
        await this.page.getByRole("button", { name: /sign in|log in/i }).click()
    }

    async signup(email: string, password: string) {
        await this.gotoSignup()
        await this.page.getByLabel(/email/i).fill(email)
        await this.page.getByLabel(/password/i).fill(password)
        await this.page.getByRole("button", { name: /sign up|create/i }).click()
    }

    async logout() {
        await this.page.getByRole("button", { name: /sign out|log out/i }).click()
    }

    async isLoggedIn() {
        return this.page.url().includes("/profile") || this.page.url().includes("/onboarding")
    }
}
