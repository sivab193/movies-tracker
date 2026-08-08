"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, Menu, Compass, Moon, Sun, LogOut, LogIn } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { NavSheet, type SheetSection } from "@/components/nav-sheet"
import {
  COMMUNITY_GROUP,
  DISCOVER_GROUP,
  PERSONAL_GROUP,
  SUPPORT_GROUP,
  TIMER_ITEM,
  isActiveGroup,
  isActiveHref,
  visibleItems,
} from "@/lib/nav"

type SheetId = "discover" | "more"

export function BottomNav() {
  const pathname = usePathname()
  const { user, userProfile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [openSheet, setOpenSheet] = React.useState<SheetId | null>(null)

  const visibility = { isSignedIn: !!user, isAdmin: !!userProfile?.isAdmin }
  const closeSheet = React.useCallback(() => setOpenSheet(null), [])

  const timerActive = isActiveHref(pathname, TIMER_ITEM.href)
  const discoverActive = isActiveGroup(pathname, DISCOVER_GROUP)
  const leaderboardActive = isActiveHref(pathname, "/leaderboard")

  // "More" owns everything the four fixed tabs don't reach, so nothing is unreachable.
  const moreSections: SheetSection[] = [
    { id: "personal", label: PERSONAL_GROUP.label, items: visibleItems(PERSONAL_GROUP, visibility) },
    { id: "community", label: COMMUNITY_GROUP.label, items: visibleItems(COMMUNITY_GROUP, visibility) },
    { id: "discover", label: DISCOVER_GROUP.label, items: visibleItems(DISCOVER_GROUP, visibility) },
    { id: "support", label: SUPPORT_GROUP.label, items: visibleItems(SUPPORT_GROUP, visibility) },
  ].filter((section) => section.items.length > 0)

  const moreActive =
    openSheet === "more" ||
    (!timerActive &&
      !discoverActive &&
      !leaderboardActive &&
      pathname !== "/" &&
      moreSections.some((s) => s.items.some((i) => isActiveHref(pathname, i.href))))

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/98 pb-[env(safe-area-inset-bottom)] shadow-2xl backdrop-blur-md md:hidden">
        <div className="relative flex h-16 items-stretch">
          <TabButton
            href="/"
            label="Home"
            icon={Home}
            active={isActiveHref(pathname, "/")}
          />
          <TabButton
            label="Discover"
            icon={Compass}
            active={discoverActive || openSheet === "discover"}
            onClick={() => setOpenSheet(openSheet === "discover" ? null : "discover")}
            expanded={openSheet === "discover"}
          />

          {/* Spacer that reserves room for the raised Timer button. */}
          <div className="w-20 shrink-0" aria-hidden="true" />

          <TabButton
            href="/leaderboard"
            label="Board"
            icon={Trophy}
            active={leaderboardActive}
          />
          <TabButton
            label="More"
            icon={Menu}
            active={moreActive}
            onClick={() => setOpenSheet(openSheet === "more" ? null : "more")}
            expanded={openSheet === "more"}
          />

          <Link
            href={TIMER_ITEM.href}
            aria-label={TIMER_ITEM.label}
            aria-current={timerActive ? "page" : undefined}
            className="absolute -top-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full border-4 border-background shadow-lg transition-transform active:scale-95 ${
                timerActive
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/40"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <TIMER_ITEM.icon className="h-6 w-6" />
            </span>
            <span
              className={`text-[10px] font-medium ${
                timerActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Timer
            </span>
          </Link>
        </div>
      </nav>

      <NavSheet
        open={openSheet === "discover"}
        onClose={closeSheet}
        title={DISCOVER_GROUP.label}
        sections={[{ id: "discover", items: visibleItems(DISCOVER_GROUP, visibility) }]}
      />

      <NavSheet
        open={openSheet === "more"}
        onClose={closeSheet}
        title="Menu"
        sections={moreSections}
        header={
          user ? (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {user.displayName
                    ? user.displayName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
                    : "U"}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.displayName || "User"}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          ) : (
            <Link
              href="/auth"
              onClick={closeSheet}
              className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              <LogIn className="h-4 w-4" />
              Sign in to track your watches
            </Link>
          )
        }
        footer={
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium active:bg-accent"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            {user && (
              <button
                type="button"
                onClick={() => {
                  closeSheet()
                  signOut()
                }}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-destructive active:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            )}
          </div>
        }
      />
    </>
  )
}

function TabButton({
  href,
  label,
  icon: Icon,
  active,
  onClick,
  expanded,
}: {
  href?: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick?: () => void
  expanded?: boolean
}) {
  const className = `flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
    active ? "text-primary" : "text-muted-foreground active:text-foreground"
  }`

  const content = (
    <>
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-expanded={expanded}>
      {content}
    </button>
  )
}
