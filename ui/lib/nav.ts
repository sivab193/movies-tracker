import type { LucideIcon } from "lucide-react"
import {
  Home,
  Film,
  Tv,
  ListOrdered,
  Trophy,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Settings,
  Mail,
  Map,
  Compass,
  Users,
  Tv2,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  /** Shown in dropdowns, the mobile sheet and the command palette. */
  description?: string
  icon: LucideIcon
  /** Hidden until the user is signed in. */
  authOnly?: boolean
  /** Hidden unless the user is an admin. */
  adminOnly?: boolean
  /** Extra terms the command palette should match on. */
  keywords?: string[]
}

export type NavGroup = {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

/** Standalone entry that sits at the top level of every surface. */
export const TIMER_ITEM: NavItem = {
  href: "/timer",
  label: "TitleCard Timer",
  description: "Know exactly when the title card drops",
  icon: Film,
  keywords: ["titlecard", "title card", "stopwatch", "runtime"],
}

export const HOME_ITEM: NavItem = {
  href: "/",
  label: "Home",
  description: "Back to the start",
  icon: Home,
}

export const DISCOVER_GROUP: NavGroup = {
  id: "discover",
  label: "Discover",
  icon: Compass,
  items: [
    {
      href: "/movies",
      label: "Movies",
      description: "Browse the movie catalog and title-card timings",
      icon: Film,
      keywords: ["films", "cinema", "catalog"],
    },
    {
      href: "/series",
      label: "Series",
      description: "Browse tracked shows and franchises",
      icon: Tv,
      keywords: ["shows", "tv", "seasons", "episodes"],
    },
    {
      href: "/watch-orders",
      label: "Watch Orders",
      description: "Curated viewing orders for big franchises",
      icon: ListOrdered,
      keywords: ["chronological", "release order", "franchise"],
    },
    {
      href: "/theaters",
      label: "Theaters",
      description: "Compare cinema screens, formats, and amenities",
      icon: Map,
      keywords: ["cinema", "imax", "dolby", "screens"],
    },
  ],
}

export const COMMUNITY_GROUP: NavGroup = {
  id: "community",
  label: "Community",
  icon: Users,
  items: [
    {
      href: "/leaderboard",
      label: "Leaderboard",
      description: "Global runtime rankings for the season",
      icon: Trophy,
      keywords: ["rankings", "board", "compete", "top"],
    },
    {
      href: "/stats",
      label: "Community Stats",
      description: "What everyone is watching right now",
      icon: BarChart3,
      keywords: ["analytics", "insights", "numbers", "charts"],
    },
  ],
}

/** Personal destinations — live under the avatar on desktop, in the sheet on mobile. */
export const PERSONAL_GROUP: NavGroup = {
  id: "personal",
  label: "Your library",
  icon: LayoutDashboard,
  items: [
    {
      href: "/dashboard",
      label: "Dashboard",
      description: "Your complete cinematic journey",
      icon: LayoutDashboard,
      authOnly: true,
      keywords: ["overview", "history", "log", "diary", "tickets", "theaters", "me", "profile"],
    },
    {
      href: "/series-history",
      label: "Series History",
      description: "Seasons you have watched, and how often",
      icon: Tv2,
      authOnly: true,
      keywords: ["shows", "seasons", "rewatch", "progress", "tracking"],
    },
    {
      href: "/cards",
      label: "Cards",
      description: "Card offers and booking perks",
      icon: CreditCard,
      authOnly: true,
      keywords: ["offers", "discount", "bookmyshow", "credit"],
    },
  ],
}

/** Low-frequency destinations — avatar menu on desktop, bottom of the sheet on mobile. */
export const SUPPORT_GROUP: NavGroup = {
  id: "support",
  label: "More",
  icon: Settings,
  items: [
    {
      href: "/admin",
      label: "Admin",
      description: "Manage users, keys and content",
      icon: LayoutDashboard,
      authOnly: true,
      adminOnly: true,
    },
    {
      href: "/settings",
      label: "Settings",
      description: "Username, preferences and account",
      icon: Settings,
      authOnly: true,
      keywords: ["preferences", "account", "username"],
    },
    {
      href: "/roadmap",
      label: "Roadmap",
      description: "What shipped and what is next",
      icon: Map,
      keywords: ["changelog", "upcoming", "features"],
    },
    {
      href: "/contact",
      label: "Contact Us",
      description: "Questions, bugs and feedback",
      icon: Mail,
      keywords: ["support", "help", "feedback", "email"],
    },
  ],
}

/** Groups shown as dropdowns in the desktop header, in order. */
export const PRIMARY_GROUPS: NavGroup[] = [DISCOVER_GROUP, COMMUNITY_GROUP]

/** Every group, used by the command palette and the mobile sheet. */
export const ALL_GROUPS: NavGroup[] = [
  DISCOVER_GROUP,
  COMMUNITY_GROUP,
  PERSONAL_GROUP,
  SUPPORT_GROUP,
]

type Visibility = { isSignedIn: boolean; isAdmin: boolean }

export function isVisible(item: NavItem, { isSignedIn, isAdmin }: Visibility): boolean {
  if (item.authOnly && !isSignedIn) return false
  if (item.adminOnly && !isAdmin) return false
  return true
}

export function visibleItems(group: NavGroup, visibility: Visibility): NavItem[] {
  return group.items.filter((item) => isVisible(item, visibility))
}

/** Exact match for the root route, prefix match everywhere else. */
export function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isActiveGroup(pathname: string, group: NavGroup): boolean {
  return group.items.some((item) => isActiveHref(pathname, item.href))
}
