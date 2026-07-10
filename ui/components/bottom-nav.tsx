"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Film, Trophy, Clock, BarChart3 } from "lucide-react"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/timer", label: "Timer", icon: Film },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/watch-history", label: "History", icon: Clock },
  { href: "/stats", label: "Stats", icon: BarChart3 },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/98 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom)] shadow-2xl">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
