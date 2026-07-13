import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'movies-tracker'
import { Clock, Ellipsis, Users } from 'lucide-react'

// `DropdownMenuContent` already portals itself; the exported Portal exists for the pieces
// that don't — a `SubContent` wrapped in it escapes the parent panel's `overflow-hidden`
// instead of being clipped by it. Same menu, portalled submenu.
export function Open() {
  return (
    <div className="h-96">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Actions for Guardians of the Galaxy Vol. 3">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Guardians Vol. 3</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Clock />
            Log title card
          </DropdownMenuItem>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger>
              <Users />
              Reported by
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuLabel>8 submissions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>4:11 · 5 people</DropdownMenuItem>
                <DropdownMenuItem>4:14 · 2 people</DropdownMenuItem>
                <DropdownMenuItem>4:22 · 1 person</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
