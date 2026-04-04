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
import { NavModeProvider } from "@/contexts/nav-mode";
import { NavModeGate } from "@/components/nav-mode-gate";
// import { Agentation } from "agentation";
import { Suspense } from "react";
import Loading from "./loading";
import { PageGradients } from "@/components/ui/page-gradients";
import { ThemeFavicon } from "@/components/theme-favicon";
import { SiteStructuredData } from "@/components/seo/site-structured-data";
import { BRAND_NAME, SITE_DESCRIPTION, getSiteUrl } from "@/lib/seo";

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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${BRAND_NAME} | Bible Reading App`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: BRAND_NAME,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "OpenWrit",
    "Bible reading app",
    "Catholic Bible",
    "daily readings",
    "Bible study",
    "Scripture",
    "liturgical calendar",
  ],
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} | Bible Reading App`,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [
      {
        url: "/favicon-light.png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${BRAND_NAME} | Bible Reading App`,
    description: SITE_DESCRIPTION,
    images: ["/favicon-light.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/favicon-light.png",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/favicon-dark.png",
      },
    ],
    apple: "/favicon-light.png",
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
        <SiteStructuredData />
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReadingPreferencesProvider>
            <NavModeProvider>
              <ThemeFavicon />
              <FocusProvider>
                <NavModeGate mode="classic">
                  <Header />
                </NavModeGate>
                <CommandMenu />
                <MainLayout>
                  <Suspense fallback={<Loading />}>
                    {children}
                  </Suspense>
                </MainLayout>

                <NavModeGate mode="classic">
                  <Footer />
                </NavModeGate>
                <PageGradients />
                <NavModeGate mode="classic">
                  <MobileNav />
                </NavModeGate>
                <Toaster
                  position="bottom-right"
                  style={{ zIndex: 9999 }}
                  toastOptions={{
                    className: "font-mono text-xs !bg-background text-foreground border-border/30 border shadow-[0_4px_16px_rgba(0,0,0,0.08)] rounded-[2px] px-6 py-4 gap-4 opacity-100",
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
                {/* process.env.NODE_ENV === "development" && <Agentation /> */}
              </FocusProvider>
            </NavModeProvider>
          </ReadingPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
