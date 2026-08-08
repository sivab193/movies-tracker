"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { isActiveHref, type NavItem } from "@/lib/nav"

export type SheetSection = {
  id: string
  label?: string
  items: NavItem[]
}

type NavSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  sections: SheetSection[]
  /** Rendered above the sections — used for the account block. */
  header?: React.ReactNode
  /** Rendered below the sections — used for theme toggle / sign out. */
  footer?: React.ReactNode
}

/** Bottom sheet used by the mobile nav. Closes on route change, backdrop tap and Escape. */
export function NavSheet({ open, onClose, title, sections, header, footer }: NavSheetProps) {
  const pathname = usePathname()

  React.useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-[60] md:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-background shadow-2xl transition-transform duration-200 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 pt-3 pb-2 backdrop-blur-md">
          <div className="absolute inset-x-0 top-1.5 mx-auto h-1 w-10 rounded-full bg-muted-foreground/30" />
          <h2 className="pt-2 text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="mt-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
          {header}

          {sections.map((section) => (
            <div key={section.id} className="mb-4">
              {section.label && (
                <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {section.label}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {section.items.map(({ href, label, description, icon: Icon }) => {
                  const active = isActiveHref(pathname, href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={`flex flex-col gap-1 rounded-xl border p-3 transition-colors ${
                        active
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-card active:bg-accent"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${active ? "text-primary" : ""}`}>
                        {label}
                      </span>
                      {description && (
                        <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                          {description}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {footer}
        </div>
      </div>
    </div>
  )
}
