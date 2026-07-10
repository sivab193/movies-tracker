import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | Movies Tracker",
  description: "Quick access to your recent watch activity and movie tracking stats.",
  openGraph: {
    title: "Movies Tracker Dashboard",
    description: "Quick access to your recent watch activity and movie tracking stats.",
    images: ["/icon.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Movies Tracker Dashboard",
    description: "Quick access to your recent watch activity and movie tracking stats.",
    images: ["/placeholder-logo.png"],
  },
}
