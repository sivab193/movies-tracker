"use client"

import Link from "next/link"
import { Film, Trophy, List, Share2, ShieldCheck, MessageSquare, Bot, Map, Users, Bell } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-28 animate-fade-in">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-balance">
                Your Ultimate Movie Watch Tracker
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty">
                Keep track of every movie you watch, analyze your statistics, and compete for the top spot on the global leaderboard.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/auth">
                  <Button size="lg" className="rounded-full px-8">
                    Get Started
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
        <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 bg-muted/30 rounded-3xl mb-12 animate-slide-up">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Features</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Everything you need to track your cinematic journey
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-3">
              {/* Telegram Bot - Coming Soon (FIRST) */}
              <Link href="/contact" className="group flex flex-col feature-card transition hover:bg-muted/80">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <MessageSquare className="h-5 w-5 text-primary group-hover:text-foreground" />
                  Telegram Bot
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                  <p className="flex-auto text-pretty">Track your movies directly from Telegram. Quick logging, stats, and notifications.</p>
                  <div className="mt-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      Coming Soon
                    </span>
                  </div>
                </dd>
              </Link>

              {/* Detailed Watch History */}
              <Link href="/watch-history" className="group flex flex-col feature-card transition hover:bg-muted/80">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <List className="h-5 w-5 text-primary group-hover:text-foreground" />
                  Detailed Watch History
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                  <p className="flex-auto text-pretty">Log every movie you watch with dates, ratings, and detailed technical and theater information.</p>
                </dd>
              </Link>

              {/* Global Leaderboard */}
              <Link href="/leaderboard" className="group flex flex-col feature-card transition hover:bg-muted/80">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <Trophy className="h-5 w-5 text-primary group-hover:text-foreground" />
                  Global Leaderboard
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                  <p className="flex-auto text-pretty">Compete with friends and the world. See who has the most total watch time.</p>
                </dd>
              </Link>

              {/* TitleCard Timer */}
              <Link href="/timer" className="group flex flex-col feature-card transition hover:bg-muted/80">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <Film className="h-5 w-5 text-primary group-hover:text-foreground" />
                  TitleCard Timer
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                  <p className="flex-auto text-pretty">Know exactly when the title card appears in every movie you watch.</p>
                </dd>
              </Link>

              {/* Public Profiles */}
              <Link href="/settings" className="group flex flex-col feature-card transition hover:bg-muted/80">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <Share2 className="h-5 w-5 text-primary group-hover:text-foreground" />
                  Public Profiles
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                  <p className="flex-auto text-pretty">Share your movie taste with the world or keep it private with granular controls.</p>
                </dd>
              </Link>

              {/* Privacy First */}
              <Link href="/settings" className="group flex flex-col feature-card transition hover:bg-muted/80">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <ShieldCheck className="h-5 w-5 text-primary group-hover:text-foreground" />
                  Privacy First
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                  <p className="flex-auto text-pretty">Choose exactly which fields and movies are public. Your data, your rules.</p>
                </dd>
              </Link>
            </dl>
          </div>
        </section>

        {/* Upcoming Features Section */}
        <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 bg-card border border-border/60 rounded-3xl mb-12 animate-slide-up">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Roadmap</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Upcoming Features & AI Integration
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              We are continuously evolving Movies Tracker. Here is what is actively in development:
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-2">
              {/* Hosted MCP Server */}
              <div className="group flex flex-col feature-card transition hover:bg-muted/50 border border-primary/20">
                <dt className="flex items-center justify-between text-base font-semibold leading-7">
                  <div className="flex items-center gap-x-3">
                    <Bot className="h-5 w-5 text-primary group-hover:text-foreground" />
                    Hosted AI MCP Server
                  </div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    In Development
                  </span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                  <p className="flex-auto text-pretty">
                    Connect seamlessly with ChatGPT, Claude, and Gemini via Model Context Protocol (MCP). Search movies, log watches, and query your personal stats using natural language directly from your AI assistant.
                  </p>
                </dd>
              </div>

              {/* Movie Marathon Planner */}
              <div className="group flex flex-col feature-card transition hover:bg-muted/50">
                <dt className="flex items-center justify-between text-base font-semibold leading-7">
                  <div className="flex items-center gap-x-3">
                    <Map className="h-5 w-5 text-primary group-hover:text-foreground" />
                    Movie Marathon Planner
                  </div>
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Planned
                  </span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                  <p className="flex-auto text-pretty">
                    Plan back-to-back movie sessions effortlessly based on real-time showtimes, runtimes, and driving/transit distances between local cinemas.
                  </p>
                </dd>
              </div>

              {/* Community Discussions & Group Events */}
              <div className="group flex flex-col feature-card transition hover:bg-muted/50">
                <dt className="flex items-center justify-between text-base font-semibold leading-7">
                  <div className="flex items-center gap-x-3">
                    <Users className="h-5 w-5 text-primary group-hover:text-foreground" />
                    Community Forums & Group Events
                  </div>
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Planned
                  </span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                  <p className="flex-auto text-pretty">
                    Engage in dedicated discussions about new releases, share deep-dive reviews, and coordinate group theater outings with local cinephiles.
                  </p>
                </dd>
              </div>

              {/* Ticket Alerts */}
              <div className="group flex flex-col feature-card transition hover:bg-muted/50">
                <dt className="flex items-center justify-between text-base font-semibold leading-7">
                  <div className="flex items-center gap-x-3">
                    <Bell className="h-5 w-5 text-primary group-hover:text-foreground" />
                    Ticket Opening Alerts
                  </div>
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Planned
                  </span>
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground group-hover:text-foreground">
                  <p className="flex-auto text-pretty">
                    Never miss opening day again. Get instant push notifications or Telegram alerts the moment bookings open for blockbuster releases at your favorite theaters.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 mb-12 text-center animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to start tracking?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Join cinephiles around the world in documenting their movie journey.
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
