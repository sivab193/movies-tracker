import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'movies-tracker'
import { ChevronDown, Clock, Ellipsis, Film, Star } from 'lucide-react'

// The trigger is `asChild`-composed onto a Button, so it inherits the DS button styling and
// picks up `data-state=open` while the menu is shown.
export function Open() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Sort: Recently added
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Sort library by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Film />
            Recently added
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Star />
            Highest IMDb rating
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Clock />
            Earliest title card
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// The two trigger shapes the app uses: a labelled button in toolbars, an icon button in rows.
export function TriggerShapes() {
  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            All languages
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Telugu</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More actions">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Export CSV</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
