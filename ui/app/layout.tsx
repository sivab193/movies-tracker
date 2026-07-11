import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { Footer } from "@/components/footer"
import { BottomNav } from "@/components/bottom-nav"
import RegisterServiceWorker from "@/app/register-service-worker"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "MediaVerse",
  description:
    "Track your movie watch history, see your stats, and compete on the leaderboard.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://mv.siv19.dev"),
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  appleWebApp: {
    title: "MediaVerse",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "MediaVerse",
    description: "Track your movie watch history, see your stats, and compete on the leaderboard.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MediaVerse",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediaVerse | Log, Analyze & Compete",
    description: "Keep track of every movie you watch, analyze your statistics, and compete for the top spot on the global leaderboard.",
    images: ["/opengraph-image"],
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
      <body className={`${inter.variable} font-sans antialiased min-h-[100dvh] flex flex-col bg-background`}>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col flex-1 pb-20 md:pb-0">
              {children}
              <Footer />
            </div>
            <BottomNav />
            <Analytics />
            <RegisterServiceWorker />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
