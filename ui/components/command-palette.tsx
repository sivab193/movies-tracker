"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Command } from "cmdk"
import { Search, Moon, Sun, LogOut, LogIn } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { ALL_GROUPS, HOME_ITEM, TIMER_ITEM, visibleItems } from "@/lib/nav"

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

  // Close on route change so a selection never leaves the palette hanging open.
  React.useEffect(() => {
    onOpenChange(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const run = React.useCallback(
    (action: () => void) => {
      onOpenChange(false)
      action()
    },
    [onOpenChange],
  )

  const jumpItems = [HOME_ITEM, TIMER_ITEM]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden p-0 sm:max-w-xl top-[20%] translate-y-0 gap-0"
      >
        <DialogTitle className="sr-only">Search MediaVerse</DialogTitle>
        <DialogDescription className="sr-only">
          Jump to any page or run a quick action.
        </DialogDescription>
        <Command
          loop
          className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              placeholder="Search pages and actions..."
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
