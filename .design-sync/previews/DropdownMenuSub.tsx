import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'movies-tracker'
import { Bookmark, Clock, Ellipsis, ListPlus, Plus, Trash2 } from 'lucide-react'

// "Add to list ▸" — the submenu keeps the list picker out of the top level. The Sub is held
// `open` (not `defaultOpen`): Radix closes a defaulted-open submenu as soon as the parent
// content takes focus on mount, so a static card would show the trigger with no panel.
export function Open() {
  return (
    <div className="h-96">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Actions for Oppenheimer">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Oppenheimer (2023)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Clock />
            Log title card
          </DropdownMenuItem>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger>
              <ListPlus />
              Add to list
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuItem>
                <Bookmark />
                Watchlist
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bookmark />
                Rewatch pile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bookmark />
                Best title cards
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus />
                New list…
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash2 />
            Delete entry
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// The collapsed state: the sub trigger reads as a normal item with a trailing chevron.
export function SubClosed() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Entry</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem>
            <Clock />
            Log title card
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ListPlus />
              Add to list
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Watchlist</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
