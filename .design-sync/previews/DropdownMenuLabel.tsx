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
import { LogOut, Star, User } from 'lucide-react'

// The label is the menu's heading — here the "signed in as" block at the top of the account
// menu. It's non-interactive: no hover, no focus ring.
export function Open() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Account">
            <User />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none">Sivaganesh B</span>
              <span className="text-muted-foreground text-xs font-normal">
                sivaganesh1903@gmail.com
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Star />
            My title-card logs
            <DropdownMenuShortcut>⌘L</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <User />
            Edit profile URL
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// `inset` pads the label to line up with items that have a leading check/radio indicator.
export function Inset() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">View</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel inset>Density</DropdownMenuLabel>
          <DropdownMenuItem inset>Comfortable</DropdownMenuItem>
          <DropdownMenuItem inset>Compact</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel inset>Grouping</DropdownMenuLabel>
          <DropdownMenuItem inset>By theater</DropdownMenuItem>
          <DropdownMenuItem inset>By month watched</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
