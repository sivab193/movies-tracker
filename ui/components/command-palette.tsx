"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Command } from "cmdk"
import { Search, Moon, Sun, LogOut, LogIn, Film, Tv, MapPin, User, CircleUserRound, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { ALL_GROUPS, HOME_ITEM, TIMER_ITEM, visibleItems } from "@/lib/nav"
import { searchGlobal, type GlobalSearchResults } from "@/services/search-service"

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userProfile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const visibility = { isSignedIn: !!user, isAdmin: !!userProfile?.isAdmin }

  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<GlobalSearchResults | null>(null)
  const [searching, setSearching] = React.useState(false)
  const searchSeq = React.useRef(0)

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        setQuery("")
        setResults(null)
        setSearching(false)
      }
      onOpenChange(next)
    },
    [onOpenChange],
  )

  // Close on route change so a selection never leaves the palette hanging open.
  React.useEffect(() => {
    handleOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Debounced global search; the sequence guard drops stale responses so a
  // slow earlier query never overwrites a newer one. Results are only
  // rendered while they belong to the current query (see visibleResults).
  React.useEffect(() => {
    const trimmed = query.trim()
    const seq = ++searchSeq.current
    if (!open || trimmed.length < 2) return
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const data = await searchGlobal(trimmed)
        if (searchSeq.current === seq) setResults(data)
      } catch {
        if (searchSeq.current === seq) setResults(null)
      } finally {
        if (searchSeq.current === seq) setSearching(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query, open])

  const run = React.useCallback(
    (action: () => void) => {
      handleOpenChange(false)
      action()
    },
    [handleOpenChange],
  )

  const jumpItems = [HOME_ITEM, TIMER_ITEM]
  const visibleResults = results && results.query === query.trim() ? results : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-xl top-[20%] translate-y-0 gap-0"
      >
        <DialogTitle className="sr-only">Search MediaVerse</DialogTitle>
        <DialogDescription className="sr-only">
          Search movies, series, theatres, people, and members, jump to any page, or run a quick action.
        </DialogDescription>
        <Command
          loop
          className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search movies, pages, and actions..."
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {searching && query.trim().length >= 2 && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching…</span>
              </div>
            )}

            {visibleResults && visibleResults.movies.length > 0 && (
              <Command.Group heading="Movies">
                {visibleResults.movies.map((movie) => (
                  <SearchResultItem
                    key={movie.id}
                    value={`search movie ${movie.title}`}
                    label={movie.title}
                    detail={movie.year ? String(movie.year) : undefined}
                    posterUrl={movie.posterUrl}
                    icon={Film}
                    onSelect={() => run(() => router.push(`/movie/${movie.id}`))}
                  />
                ))}
              </Command.Group>
            )}

            {visibleResults && visibleResults.series.length > 0 && (
              <Command.Group heading="Series">
                {visibleResults.series.map((item) => (
                  <SearchResultItem
                    key={item.id}
                    value={`search series ${item.title}`}
                    label={item.title}
                    detail={item.year ? String(item.year) : undefined}
                    posterUrl={item.posterUrl}
                    icon={Tv}
                    onSelect={() => run(() => router.push(`/series/${item.id}`))}
                  />
                ))}
              </Command.Group>
            )}

            {visibleResults && visibleResults.theatres.length > 0 && (
              <Command.Group heading="Theatres">
                {visibleResults.theatres.map((theatre) => (
                  <SearchResultItem
                    key={theatre.id}
                    value={`search theatre ${theatre.name}`}
                    label={theatre.name}
                    detail={theatre.location || undefined}
                    icon={MapPin}
                    onSelect={() => run(() => router.push(`/theaters/${theatre.id}`))}
                  />
                ))}
              </Command.Group>
            )}

            {visibleResults && visibleResults.people.length > 0 && (
              <Command.Group heading="People">
                {visibleResults.people.map((person) => (
                  <SearchResultItem
                    key={person.slug}
                    value={`search person ${person.name}`}
                    label={person.name}
                    icon={User}
                    onSelect={() => run(() => router.push(`/people/${person.slug}`))}
                  />
                ))}
              </Command.Group>
            )}

            {visibleResults && visibleResults.users.length > 0 && (
              <Command.Group heading="Members">
                {visibleResults.users.map((member) => (
                  <SearchResultItem
                    key={member.username}
                    value={`search member ${member.displayName} ${member.username}`}
                    label={member.displayName}
                    detail={`@${member.username}`}
                    posterUrl={member.photoURL}
                    posterClassName="h-7 w-7 rounded-full"
                    icon={CircleUserRound}
                    onSelect={() => run(() => router.push(`/u/${member.username}`))}
                  />
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Jump to">
              {jumpItems.map((item) => (
                <PaletteItem
                  key={item.href}
                  item={item}
                  onSelect={() => run(() => router.push(item.href))}
                />
              ))}
            </Command.Group>

            {ALL_GROUPS.map((group) => {
              const items = visibleItems(group, visibility)
              if (items.length === 0) return null
              return (
                <Command.Group key={group.id} heading={group.label}>
                  {items.map((item) => (
                    <PaletteItem
                      key={item.href}
                      item={item}
                      onSelect={() => run(() => router.push(item.href))}
                    />
                  ))}
                </Command.Group>
              )
            })}

            <Command.Group heading="Actions">
              <Command.Item
                value="toggle theme dark light appearance"
                onSelect={() => run(toggleTheme)}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>Switch to {theme === "dark" ? "light" : "dark"} mode</span>
              </Command.Item>
              {user ? (
                <Command.Item
                  value="sign out log out logout"
                  onSelect={() => run(signOut)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive data-[selected=true]:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </Command.Item>
              ) : (
                <Command.Item
                  value="sign in log in login account"
                  onSelect={() => run(() => router.push("/auth"))}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign in</span>
                </Command.Item>
              )}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function PaletteItem({
  item,
  onSelect,
}: {
  item: { href: string; label: string; description?: string; icon: React.ComponentType<{ className?: string }>; keywords?: string[] }
  onSelect: () => void
}) {
  const Icon = item.icon
  return (
    <Command.Item
      value={`${item.label} ${item.href} ${(item.keywords || []).join(" ")}`}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="font-medium">{item.label}</span>
      {item.description && (
        <span className="ml-auto hidden truncate text-xs text-muted-foreground sm:inline">
          {item.description}
        </span>
      )}
    </Command.Item>
  )
}

function SearchResultItem({
  value,
  label,
  detail,
  posterUrl,
  posterClassName = "h-9 w-7 rounded",
  icon: Icon,
  onSelect,
}: {
  value: string
  label: string
  detail?: string
  posterUrl?: string | null
  posterClassName?: string
  icon: React.ComponentType<{ className?: string }>
  onSelect: () => void
}) {
  const showPoster = posterUrl && posterUrl !== "N/A"
  return (
    <Command.Item
      forceMount
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
    >
      {showPoster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterUrl} alt="" className={`${posterClassName} shrink-0 object-cover`} loading="lazy" />
      ) : (
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate font-medium">{label}</span>
      {detail && (
        <span className="ml-auto hidden shrink-0 truncate text-xs text-muted-foreground sm:inline">
          {detail}
        </span>
      )}
    </Command.Item>
  )
}

/** Registers the global ⌘K / Ctrl+K shortcut and owns palette open state. */
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return { open, setOpen }
}
