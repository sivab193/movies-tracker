import React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { OttProviderCatalogProvider } from "@/contexts/ott-provider-context"
import { Footer } from "@/components/footer"
import { BottomNav } from "@/components/bottom-nav"
import RegisterServiceWorker from "@/app/register-service-worker"
import "./globals.css"

export const metadata: Metadata = {
  title: "MediaVerse",
  description:
    "Track your movie watch history, see your stats, and compete on the leaderboard.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.media-verse.in"),
  icons: {
    icon: [
      { url: "/favicon-96x96.png?v=mv-popcorn-1", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg?v=mv-popcorn-1", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico?v=mv-popcorn-1",
    apple: [
      { url: "/apple-touch-icon.png?v=mv-popcorn-1", sizes: "180x180" },
    ],
  },
  appleWebApp: {
    title: "MediaVerse",
  },
  manifest: "/site.webmanifest?v=mv-popcorn-1",
  openGraph: {
    siteName: "MediaVerse",
    title: "MediaVerse",
    description: "Track your movie watch history, see your stats, and compete on the leaderboard.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediaVerse | Log, Analyze & Compete",
    description: "Keep track of every movie you watch, analyze your statistics, and compete for the top spot on the global leaderboard.",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-[100dvh] flex flex-col bg-background">
        <ThemeProvider>
          <AuthProvider>
            <OttProviderCatalogProvider>
            <div className="min-h-screen flex flex-col flex-1 pb-20 md:pb-0">
              {children}
              <Footer />
            </div>
            <BottomNav />
            <Analytics />
            <RegisterServiceWorker />
            </OttProviderCatalogProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
