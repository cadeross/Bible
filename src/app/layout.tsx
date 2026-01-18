import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Merriweather } from "next/font/google"; // Added serif font
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

export const metadata: Metadata = {
  title: "Bible App",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable} antialiased min-h-screen flex flex-col`}
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
                {children}
              </MainLayout>

              <Footer />
              <MobileNav />
              <Toaster />
              <Analytics />
            </FocusProvider>
          </ReadingPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
