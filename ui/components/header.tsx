"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Film, Moon, Sun, LogOut, Settings, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { CommandPalette, useCommandPalette } from "@/components/command-palette"
import {
  PRIMARY_GROUPS,
  PERSONAL_GROUP,
  SUPPORT_GROUP,
  TIMER_ITEM,
  isActiveGroup,
  isActiveHref,
  visibleItems,
  type NavGroup,
} from "@/lib/nav"

export function Header() {
  const { user, userProfile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette()

  const visibility = { isSignedIn: !!user, isAdmin: !!userProfile?.isAdmin }
  const personalItems = visibleItems(PERSONAL_GROUP, visibility)
  const supportItems = visibleItems(SUPPORT_GROUP, visibility)
  const timerActive = isActiveHref(pathname, TIMER_ITEM.href)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">MediaVerse</span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            <Link
              href={TIMER_ITEM.href}
              className={`rounded-md px-3 py-2 transition-colors ${
                timerActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              Timer
            </Link>

            {PRIMARY_GROUPS.map((group) => (
              <NavGroupMenu
                key={group.id}
                group={group}
                pathname={pathname}
                items={visibleItems(group, visibility)}
              />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop: a real search affordance beats a hidden shortcut. */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:flex"
            aria-label="Search pages and actions"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="ml-2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPaletteOpen(true)}
            className="lg:hidden"
            aria-label="Search pages and actions"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {user.displayName
                        ? user.displayName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
                        : "U"}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.displayName || "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>

                {personalItems.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      {PERSONAL_GROUP.label}
                    </DropdownMenuLabel>
                    {personalItems.map(({ href, label, icon: Icon }) => (
                      <DropdownMenuItem key={href} asChild>
                        <Link
                          href={href}
                          className={`flex items-center gap-2 ${
                            isActiveHref(pathname, href) ? "font-semibold text-primary" : ""
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                {supportItems.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {supportItems.map(({ href, label, icon: Icon }) => (
                      <DropdownMenuItem key={href} asChild>
                        <Link
                          href={href}
                          className={`flex items-center gap-2 ${
                            isActiveHref(pathname, href) ? "font-semibold text-primary" : ""
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="More links">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {supportItems.map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/auth">
                <Button variant="default" size="sm">
                  Sign in
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  )
}

function NavGroupMenu({
  group,
  pathname,
  items,
}: {
  group: NavGroup
  pathname: string
  items: ReturnType<typeof visibleItems>
}) {
  if (items.length === 0) return null
  const active = isActiveGroup(pathname, group)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`group flex items-center gap-1 rounded-md px-3 py-2 transition-colors ${
            active
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          }`}
        >
          {group.label}
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {items.map(({ href, label, description, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href} className="flex items-start gap-3 py-2">
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  isActiveHref(pathname, href) ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span className="flex flex-col gap-0.5">
                <span
                  className={`text-sm font-medium ${
                    isActiveHref(pathname, href) ? "text-primary" : ""
                  }`}
                >
                  {label}
                </span>
                {description && (
                  <span className="text-xs leading-snug text-muted-foreground">{description}</span>
                )}
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
