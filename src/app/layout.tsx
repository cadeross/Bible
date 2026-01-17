import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Merriweather } from "next/font/google"; // Added serif font
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MobileNav } from "@/components/mobile-nav";
import { ReadingPreferencesProvider } from "@/contexts/reading-preferences";


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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

import { CommandMenu } from "@/components/command-menu";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >

          <ReadingPreferencesProvider>
            {/* <MobileHeader /> Removed global header */}
            <CommandMenu />
            <main className="pb-16 md:pb-0">
              {children}
            </main>
            <MobileNav />
          </ReadingPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
