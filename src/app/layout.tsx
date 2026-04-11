import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Merriweather, Nunito } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MobileNav } from "@/components/mobile-nav";
import { ReadingPreferencesProvider } from "@/contexts/reading-preferences";
import { Header } from "@/components/header";

import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import { MainLayout } from "@/components/main-layout";
import { FocusProvider } from "@/contexts/focus-mode";
import { NavModeProvider } from "@/contexts/nav-mode";
import { NavModeGate } from "@/components/nav-mode-gate";
import { Agentation } from "agentation";
import { Suspense, type CSSProperties } from "react";
import Loading from "./loading";
import { PageGradients } from "@/components/ui/page-gradients";
import { ThemeFavicon } from "@/components/theme-favicon";
import { SiteStructuredData } from "@/components/seo/site-structured-data";
import { BRAND_NAME, SITE_DESCRIPTION, getSiteUrl } from "@/lib/seo";
import { AppConvexProvider } from "@/components/convex-client-provider";
import { DatabaseMaintenanceBanner } from "@/components/database-maintenance-banner";
import { TintColorApplier } from "@/components/tint-color-applier";
import { DATABASE_MAINTENANCE_BANNER_ENABLED } from "@/lib/database-maintenance";

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
        url: "/OW1.svg",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${BRAND_NAME} | Bible Reading App`,
    description: SITE_DESCRIPTION,
    images: ["/OW1.svg"],
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
  // Safari Start Page / favorites tile: raster apple-touch-icon from app/apple-icon.png
  icons: {
    icon: "/OW1.svg",
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
    <html
      lang="en"
      suppressHydrationWarning
      style={
        DATABASE_MAINTENANCE_BANNER_ENABLED
          ? ({
              // Reserve space before the client measures the real banner height (avoids header covering the strip).
              ["--maintenance-banner-height"]: "3.25rem",
            } as CSSProperties)
          : undefined
      }
    >
      <head>
        {/* Apply tint color before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t={"blue":{"l":"#2488f2","d":"#0a84ff"},"indigo":{"l":"#5856d6","d":"#5e5ce6"},"purple":{"l":"#9333ea","d":"#bf5af2"},"pink":{"l":"#db2777","d":"#ff375f"},"red":{"l":"#dc2626","d":"#ff453a"},"orange":{"l":"#ea580c","d":"#ff9f0a"},"green":{"l":"#16a34a","d":"#30d158"},"teal":{"l":"#0891b2","d":"#5ac8fa"},"graphite":{"l":"#6b7280","d":"#8e8e93"}};var id=localStorage.getItem("tint-color");if(id&&t[id]){var dk=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.style.setProperty("--primary",dk?t[id].d:t[id].l);}}catch(e){}})();` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable} ${nunito.variable} antialiased min-h-screen flex flex-col`}
      >
        <AppConvexProvider>
        <SiteStructuredData />
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
        >
          <TintColorApplier />
          <DatabaseMaintenanceBanner />
          <ReadingPreferencesProvider>
            <NavModeProvider>
              <ThemeFavicon />
              <FocusProvider>
                <NavModeGate mode="classic">
                  <Header />
                </NavModeGate>
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
                    className: "text-xs !bg-background text-foreground border-border/40 border shadow-[var(--shadow-elevated)] rounded-[length:var(--radius)] px-5 py-4 gap-3 opacity-100 tracking-tight",
                    descriptionClassName: "text-muted-foreground",
                    actionButtonStyle: {
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                      fontFamily: "var(--font-geist-sans)",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      borderRadius: "var(--radius)",
                    },
                    cancelButtonStyle: {
                      backgroundColor: "var(--muted)",
                      color: "var(--muted-foreground)",
                      fontFamily: "var(--font-geist-sans)",
                      fontSize: "0.75rem",
                      borderRadius: "var(--radius)",
                    },
                    style: {
                      backgroundColor: "var(--background)",
                      border: "1px solid color-mix(in srgb, var(--border) 85%, transparent)",
                      color: "var(--foreground)",
                      borderRadius: "var(--radius)",
                    },
                  }}
                />
                <Analytics />
                <SpeedInsights />
                {process.env.NODE_ENV === "development" && <Agentation />}
              </FocusProvider>
            </NavModeProvider>
          </ReadingPreferencesProvider>
        </ThemeProvider>
        </AppConvexProvider>
      </body>
    </html>
  );
}
