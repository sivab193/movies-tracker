import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Leaderboard | Movies Tracker",
  description: "See who is leading the community in total movie watch runtime.",
  openGraph: {
    title: "Movies Tracker Leaderboard",
    description: "See who is leading the community in total movie watch runtime.",
    images: ["/icon.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Movies Tracker Leaderboard",
    description: "See who is leading the community in total movie watch runtime.",
    images: ["/placeholder-logo.png"],
  },
}
