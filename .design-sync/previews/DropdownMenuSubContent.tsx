import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'movies-tracker'
import { MapPin, Star, Ticket } from 'lucide-react'

// The sub content is its own popover panel — heavier shadow than the parent, and it may hold
// a full composition of its own (labels, items, separators, shortcuts).
export function Open() {
  return (
    <div className="h-96">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Ticket />
            Watch entry
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Oppenheimer · 14 Mar</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Star />
            Rate this watch
          </DropdownMenuItem>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger>
              <MapPin />
              Theater
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              <DropdownMenuLabel>Chennai</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                PVR ICON
                <DropdownMenuShortcut>₹320</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                AGS Cinemas — OMR
                <DropdownMenuShortcut>₹240</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Rohini Silver Screens
                <DropdownMenuShortcut>₹190</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
