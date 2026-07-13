import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from 'movies-tracker'
import { Download, Film, LifeBuoy, LogOut, Settings, Ticket } from 'lucide-react'

// Groups bundle related items so a separator reads as a real section break rather than a
// stray rule. Two labelled groups here: what you track, and how the app behaves.
export function Open() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Library</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Movies</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Film />
              Add a movie
              <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Ticket />
              Log a theater visit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download />
              Export watch history
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Settings />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LifeBuoy />
              Report a wrong time
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
