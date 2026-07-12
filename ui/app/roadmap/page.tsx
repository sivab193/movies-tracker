"use client"

import Link from "next/link"
import { Bot, Map, Users, Bell, Tv, Volume2, Sparkles, CreditCard, MessageSquare } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"

type RoadmapFeature = {
  icon: typeof Bot
  title: string
  status: string
  statusClass: string
  description: string
  special?: boolean
}

const roadmapSections: { title: string; subtitle: string; features: RoadmapFeature[] }[] = [
  {
    title: "In Development",
    subtitle: "Actively being built right now",
    features: [
      {
        icon: Bot,
        title: "Hosted AI MCP Server",
        status: "In Development",
        statusClass: "bg-primary/10 text-primary",
        description:
          "Connect seamlessly with ChatGPT, Claude, and Gemini via Model Context Protocol (MCP). Search movies, log watches, and query your personal stats using natural language directly from your AI assistant.",
      },
      {
        icon: Tv,
        title: "OTT & Series Watch History",
        status: "In Development",
        statusClass: "bg-primary/10 text-primary",
        description:
          "Log and track your streaming watches across platforms (Netflix, Prime Video, Disney+, Apple TV+). Track full TV series, season progress, individual episodes, and binge-watching streaks right alongside your theater history!",
      },
      {
        icon: MessageSquare,
        title: "Telegram Bot",
        status: "Coming Soon",
        statusClass: "bg-primary/10 text-primary",
        description:
          "Track your movies directly from Telegram. Quick logging, stats, and notifications without ever leaving your chat app.",
      },
    ],
  },
  {
    title: "Coming Dec 2026",
    subtitle: "The end-of-year signature experience",
    features: [
      {
        icon: Sparkles,
        title: "MediaVerse Wrapped",
        status: "Coming Dec 2026",
        statusClass: "bg-primary/20 text-primary font-semibold",
        special: true,
        description:
          "Get your personalized MediaVerse Wrapped every December! A dynamic, shareable visual showcase highlighting your total minutes watched, top genres, most visited theaters, ticket cost breakdowns, and cinematic milestones of the year!",
      },
    ],
  },
  {
    title: "Planned",
    subtitle: "On the horizon for 2027",
    features: [
      {
        icon: Map,
        title: "Movie Marathon Planner",
        status: "Planned",
        statusClass: "bg-muted text-muted-foreground",
        description:
          "Plan back-to-back movie sessions effortlessly based on real-time showtimes, runtimes, and driving/transit distances between local cinemas.",
      },
      {
        icon: CreditCard,
        title: "Card Offers & Savings Hub",
        status: "Planned",
        statusClass: "bg-muted text-muted-foreground",
        description:
          "Discover and share community-verified ticket hacks, credit/debit card 1+1 offers, loyalty reward codes, and discount tips for major cinema chains (BookMyShow, PVR INOX, AMC, Regal) so everyone saves on their theater outings!",
      },
      {
        icon: Users,
        title: "Community Forums & Group Events",
        status: "Planned",
        statusClass: "bg-muted text-muted-foreground",
        description:
          "Engage in dedicated discussions about new releases, share deep-dive reviews, and coordinate group theater outings with local cinephiles.",
      },
      {
        icon: Bell,
        title: "Ticket Opening Alerts",
        status: "Planned",
        statusClass: "bg-muted text-muted-foreground",
        description:
          "Never miss opening day again. Get instant push notifications or Telegram alerts the moment bookings open for blockbuster releases at your favorite theaters.",
      },
      {
        icon: Volume2,
        title: "Cinema Specs & Sound Audit",
        status: "Planned",
        statusClass: "bg-muted text-muted-foreground",
        description:
          "Rate and discover theater screens by their exact technical specifications: IMAX 70mm vs Dual Laser, Dolby Cinema, 64-channel Atmos audio, screen dimensions, projection brightness, and seat comfort ratings.",
      },
    ],
  },
]

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24 animate-fade-in">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-semibold leading-7 text-primary">Roadmap</h2>
              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl text-balance">
                Where MediaVerse is headed
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty">
                The full picture of everything we are building — from features shipping soon to long-term ideas. Have a suggestion? We would love to hear it.
              </p>
              <div className="mt-8 flex items-center justify-center gap-x-6">
                <Link href="/contact">
                  <Button size="lg" className="rounded-full px-8">
                    Suggest a Feature
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Sections */}
        {roadmapSections.map((section, sectionIndex) => (
          <section
            key={section.title}
            className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 lg:px-8 bg-card border border-border/60 rounded-3xl mb-12 animate-slide-up"
            style={{ animationDelay: `${0.2 + sectionIndex * 0.15}s` }}
          >
            <div className="mx-auto max-w-2xl lg:text-center">
              <p className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">{section.title}</p>
              <p className="mt-3 text-lg text-muted-foreground">{section.subtitle}</p>
            </div>
            <div className="mx-auto mt-10 max-w-2xl sm:mt-12 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-6 gap-y-10 lg:gap-x-8 lg:gap-y-12 lg:max-w-none lg:grid-cols-3">
                {section.features.map((feature) => (
                  <div
                    key={feature.title}
                    className={`group flex flex-col feature-card transition rounded-2xl p-6 ${
                      feature.special
                        ? "bg-primary/5 border border-primary/30 hover:bg-primary/10"
                        : "bg-card/80 border border-border/60 hover:bg-card/90"
                    }`}
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
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20 lg:px-8 mb-12 text-center animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Do not want to wait?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Start tracking your movies today — every new feature lands in your existing account automatically.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/auth">
              <Button size="lg" className="rounded-full px-8">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
