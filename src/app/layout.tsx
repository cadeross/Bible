import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Merriweather, Nunito } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MobileNav } from "@/components/mobile-nav";
import { ReadingPreferencesProvider } from "@/contexts/reading-preferences";
import { Header } from "@/components/header";
import { CommandMenu } from "@/components/command-menu";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import { MainLayout } from "@/components/main-layout";
import { FocusProvider } from "@/contexts/focus-mode";
import { Agentation } from "agentation";
import { Suspense } from "react";
import Loading from "./loading";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-serif",
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenWrit",
  description: "A modern, beautiful Bible reading experience.",
  icons: {
    icon: [
      {
        media: '(prefers-color-scheme: light)',
        url: '/favicon-light.png',
        href: '/favicon-light.png',
      },
      {
        media: '(prefers-color-scheme: dark)',
        url: '/favicon-dark.png',
        href: '/favicon-dark.png',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable} ${nunito.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReadingPreferencesProvider>
            <FocusProvider>
              {/* <MobileHeader /> Removed global header */}
              <Header />
              <CommandMenu />
              <MainLayout>
                <Suspense fallback={<Loading />}>
                  {children}
                </Suspense>
              </MainLayout>

              <Footer />
              <MobileNav />
              <Toaster
                position="bottom-right"
                style={{ zIndex: 9999 }}
                toastOptions={{
                  className: "font-mono text-xs !bg-background text-foreground border-border/60 border shadow-none rounded-lg px-6 py-4 gap-4 opacity-100",
                  descriptionClassName: "text-muted-foreground",
                  actionButtonStyle: {
                    backgroundColor: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "0.75rem",
                    borderRadius: "0.25rem",
                  },
                  cancelButtonStyle: {
                    backgroundColor: "hsl(var(--muted))",
                    color: "hsl(var(--muted-foreground))",
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: "0.75rem",
                    borderRadius: "0.25rem",
                  },
                  style: {
                    backgroundColor: 'var(--background)',
                    border: '1px solid hsl(var(--border), 0.6)',
                    color: 'hsl(var(--foreground))',
                    borderRadius: '0.5rem',
                  },
                }}
              />
              <Analytics />
              <SpeedInsights />
              {/* {process.env.NODE_ENV === "development" && <Agentation />} */}
              <Agentation />
            </FocusProvider>
          </ReadingPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
