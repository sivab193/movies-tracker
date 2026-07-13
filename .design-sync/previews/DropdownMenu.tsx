import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from 'movies-tracker'
import { Clock, Ellipsis, Pencil, Share2, Trash2 } from 'lucide-react'

// The row-actions menu on a movie in the library. `defaultOpen` renders the menu inside
// the card — a closed DropdownMenu is just a button, which shows nothing of the component.
export function Open() {
  return (
    <div className="h-80">
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
            <DropdownMenuShortcut>⌘L</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Pencil />
            Edit entry
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share2 />
            Share link
          </DropdownMenuItem>
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

// How the trigger sits in the product: at the end of a movie row, before it is opened.
export function Closed() {
  return (
    <div className="flex w-72 items-center justify-between rounded-md border p-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium leading-none">RRR</span>
        <span className="text-muted-foreground text-xs">Title card at 8:18 · 63 logs</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Actions for RRR">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Log title card</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
