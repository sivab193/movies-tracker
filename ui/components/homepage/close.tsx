"use client"

import { useState } from "react"
import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** Act 7, the close. Username claim, then the mission line. */
export function Close() {
  const [username, setUsername] = useState("")

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8" aria-label="Claim your username">
      <BrandLogo variant="logo" className="mx-auto h-28 w-28" />
      <p className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.3em] text-primary">
        Auditorium Entrance
      </p>
      <h2 className="mt-3 text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        Take your seat.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-muted-foreground text-pretty">
        Lock in your handle. Never lose track of which auditorium gave you proper bass response.
      </p>

      <div className="mx-auto mt-10 max-w-md border border-border bg-card p-5 text-left sm:p-6">
        <label
          htmlFor="homepage-username"
          className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
        >
          Claim your username
        </label>
        <div className="relative mt-3">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          >
            @
          </span>
          <Input
            id="homepage-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="filmmaker"
            autoComplete="off"
            className="pl-8"
          />
        </div>
        <Button asChild size="lg" className="mt-4 w-full rounded-none text-base font-bold uppercase tracking-wide">
          <Link href="/settings">Claim your username</Link>
        </Button>
        <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Free · No ads · Granular privacy controls
        </p>
      </div>

      <p className="mx-auto mt-12 max-w-xl text-lg font-medium leading-8 text-pretty">
        No ads. No reviews. Built by two brothers who love the movies.
      </p>
    </section>
  )
}
