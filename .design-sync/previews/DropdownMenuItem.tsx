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
import { Copy, Ellipsis, Eye, Timer, Trash2 } from 'lucide-react'

// Every item state the DS ships, in one real menu: default, with icon + shortcut, disabled
// (you can't re-log a title card you already logged), and the destructive variant.
export function Open() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Entry actions">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Spider-Verse · 2:02</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Eye />
            View submissions
            <DropdownMenuShortcut>⌘↵</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy />
            Copy title-card time
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Timer />
            Log title card (already logged)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash2 />
            Remove from library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// `inset` aligns label-less items with items that carry a leading indicator.
export function Inset() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Title-card time</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel inset>Reported times</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem inset>6:24 — average of 42 logs</DropdownMenuItem>
          <DropdownMenuItem inset>6:19 — earliest report</DropdownMenuItem>
          <DropdownMenuItem inset>6:31 — latest report</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
