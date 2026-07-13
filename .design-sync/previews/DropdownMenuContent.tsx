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
import { History, LogOut, Settings, User } from 'lucide-react'

// The account menu in the header. `align="end"` pins the content's right edge to the avatar
// button — the standard placement for a trailing trigger.
export function Open() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Account">
            <User />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User />
              Public profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <History />
              Watch history
              <DropdownMenuShortcut>⌘H</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
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

// Content sized to its items: a short menu keeps the 8rem minimum width.
export function Compact() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Theater</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom">
          <DropdownMenuItem>PVR ICON</DropdownMenuItem>
          <DropdownMenuItem>AGS Cinemas</DropdownMenuItem>
          <DropdownMenuItem>Rohini Silver Screens</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
