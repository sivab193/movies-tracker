"use client"

import Link from "next/link"
import { Film, Trophy, List, Share2, ShieldCheck, MessageSquare, Bot, Map, Tv, Sparkles, CreditCard, BarChart3, ListOrdered, LayoutDashboard, Link2, Building2 } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

const mainFeatures = [
  {
    href: "/watch-history",
    icon: List,
    title: "Detailed Watch History",
    description: "Log every movie you watch with dates, theaters, ticket costs, currencies, and optional ticket stub photos.",
  },
  {
    href: "/leaderboard",
    icon: Trophy,
    title: "Global Leaderboard",
    description: "Compete with friends and the world. Real-time rankings calculated from exact runtime seconds.",
  },
  {
    href: "/timer",
    icon: Film,
    title: "TitleCard Timer",
    description: "Know exactly when the title card appears in every movie. Community-submitted precision timing.",
  },
  {
    href: "/series",
    icon: Tv,
    title: "Series Tracking",
    badge: "New",
    description: "Track TV series across streaming platforms. Monitor season progress, episode counts, and total watch time.",
  },
  {
    href: "/watch-orders",
    icon: ListOrdered,
    title: "Curated Watch Orders",
    badge: "New",
    description: "Discover community-curated watch orders that combine movies and series into the perfect viewing sequence.",
  },
  {
    href: "/movies",
    icon: Film,
    title: "Movie Discovery",
    badge: "New",
    description: "Browse the full movie catalog with search, accurate totals, and direct access to title-card timings and credits.",
  },
  {
    href: "/theaters",
    icon: Building2,
    title: "Theater Pages",
    badge: "New",
    description: "Compare each cinema’s screens, projection formats, sound, seating, capacity, amenities, booking links, and community activity.",
  },
  {
    href: "/cards",
    icon: CreditCard,
    title: "Cards & Offers Hub",
    badge: "New",
    description: "Track your credit and debit card cinema offers, log card usage at theaters, and see how much you have saved.",
  },
  {
    href: "/stats",
    icon: BarChart3,
    title: "Community Analytics",
    description: "Explore community-wide cinema habits — total movies tracked, theaters visited, cities explored, and more.",
  },
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    title: "Personal Dashboard",
    description: "Your central hub to manage watch history entries, add new watches, and track your cinematic journey.",
  },
  {
    href: "/settings",
    icon: Share2,
    title: "Public Profiles & Sharing",
    description: "Claim a custom username, share your stats as a beautiful wrapped card, and control your privacy settings.",
  },
  {
    href: "/settings",
    icon: ShieldCheck,
    title: "Privacy First",
    description: "Choose exactly which fields and movies are public. Granular controls for every aspect of your profile.",
  },
  {
    href: "/m/example",
    icon: Link2,
    title: "Instant Short Links",
    description: "Generate and share 6-character short URLs for any movie. Perfect for quick sharing across social platforms.",
  },
]

const upcomingFeatures = [
  {
    icon: Bot,
    title: "Hosted AI MCP Server",
    status: "In Development",
    statusClass: "bg-primary/10 text-primary",
    description:
      "Connect seamlessly with ChatGPT, Claude, and Gemini via Model Context Protocol (MCP). Search movies, log watches, and query your personal stats using natural language directly from your AI assistant.",
  },
  {
    icon: MessageSquare,
    title: "Telegram Bot",
    status: "Coming Soon",
    statusClass: "bg-primary/10 text-primary",
    description:
      "Track your movies directly from Telegram. Quick logging, stats, and notifications without leaving your chat app.",
  },
  {
    icon: Sparkles,
    title: "MediaVerse Wrapped",
    status: "Coming Dec 2026",
    statusClass: "bg-primary/20 text-primary font-semibold",
    special: true,
    description:
      "Get your personalized MediaVerse Wrapped every December! A dynamic, shareable visual showcase highlighting your total minutes watched, top genres, most visited theaters, and cinematic milestones of the year!",
  },
  {
    icon: Map,
    title: "Movie Marathon Planner",
    status: "Planned",
    statusClass: "bg-muted text-muted-foreground",
    description:
      "Plan back-to-back movie sessions effortlessly based on real-time showtimes, runtimes, and driving/transit distances between local cinemas.",
  },
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-28 animate-fade-in">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Now with theater pages, movie discovery & watch orders
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-balance">
                Your Ultimate MediaVerse Tracker
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty">
                Track what you watch, find the right screen, explore movies and series, and keep every cinema memory in one place.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button size="lg" className="rounded-full px-8">
                    {user ? "Go to Dashboard" : "Get Started"}
                  </Button>
                </Link>
                <Link href="/timer" className="text-sm font-semibold leading-6 text-foreground hover:underline">
                  Try TitleCard Timer <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 lg:px-8 bg-muted/30 rounded-3xl mb-12 animate-slide-up">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Features</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Everything you need to track your cinematic journey
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              From detailed watch logging to cinema-screen discovery — 14 features and counting.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-6 gap-y-10 lg:gap-x-8 lg:gap-y-12 lg:max-w-none lg:grid-cols-3">
              {mainFeatures.map((feature) => (
                <Link key={feature.title} href={feature.href} className="group flex flex-col feature-card transition hover:bg-muted/50">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                    <feature.icon className="h-5 w-5 text-primary group-hover:text-foreground" />
                    {feature.title}
                    {('badge' in feature && feature.badge) && (
                      <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {String(feature.badge)}
                      </span>
                    )}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                    <p className="flex-auto text-pretty">{feature.description}</p>
                  </dd>
                </Link>
              ))}
            </dl>
          </div>
        </section>

        {/* Upcoming Features Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 lg:px-8 bg-card border border-border/60 rounded-3xl mb-12 animate-slide-up">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Roadmap</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              What&apos;s Coming Next
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              We are continuously evolving MediaVerse. Here is what is actively in development:
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-6 gap-y-10 lg:gap-x-8 lg:gap-y-12 lg:max-w-none lg:grid-cols-3">
              {upcomingFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`group flex flex-col feature-card transition animate-slide-up rounded-2xl p-6 ${
                    feature.special
                      ? "bg-primary/5 border border-primary/30 hover:bg-primary/10"
                      : "bg-card/80 border border-border/60 hover:bg-card/90"
                  }`}
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  <dt className="flex flex-col items-start gap-y-2 text-base font-semibold leading-7">
                    <span className="self-end">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${feature.statusClass}`}>
                        {feature.status}
                      </span>
                    </span>
                    <span className="flex items-start gap-x-3">
                      <feature.icon className={`h-5 w-5 shrink-0 mt-1 text-primary ${feature.special ? "animate-pulse" : "group-hover:text-foreground"}`} />
                      {feature.title}
                    </span>
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                    <p className="flex-auto text-pretty">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-12 text-center">
              <Link href="/roadmap" className="text-sm font-semibold leading-6 text-primary hover:underline">
                View the full roadmap <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 lg:px-8 mb-12 text-center animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {user ? "Pick up where you left off" : "Ready to start tracking?"}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            {user
              ? "Your dashboard has your latest watches, stats and series progress."
              : "Join cinephiles around the world in documenting their movie journey."}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="rounded-full px-8">
                {user ? "Open Dashboard" : "Get Started for Free"}
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
