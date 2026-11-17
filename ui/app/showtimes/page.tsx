import type { Metadata } from "next"
import { Header } from "@/components/header"
import { AMCShowtimes } from "@/components/amc-showtimes"

export const metadata: Metadata = {
  title: "Showtimes near me | MediaVerse",
  description: "Find AMC showtimes by date, format, language, price, and distance.",
}

export default function ShowtimesPage() {
  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-6xl px-4 py-8"><div className="mb-7 max-w-2xl"><h1 className="text-3xl font-bold tracking-tight">Find a screening worth the drive</h1><p className="mt-2 text-muted-foreground">Live AMC programming with honest distance, format, language, and ticket details. Booking always happens on AMC.</p></div><AMCShowtimes /></main></div>
}
