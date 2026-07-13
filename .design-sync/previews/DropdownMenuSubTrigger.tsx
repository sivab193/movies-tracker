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
import { Download, FileDown, Film, Share2 } from 'lucide-react'

// The sub trigger auto-appends the chevron and takes the accent background while its submenu
// is open — here the "Export ▸" branch of the watch-history menu.
export function Open() {
  return (
    <div className="h-96">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Share2 />
            Watch history
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>128 entries · 2024</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Film />
            Open public profile
          </DropdownMenuItem>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger>
              <Download />
              Export
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuItem>
                <FileDown />
                CSV (spreadsheet)
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileDown />
                JSON (raw entries)
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileDown />
                Letterboxd import
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// `inset` lines the sub trigger up with radio/checkbox items in the same menu.
export function InsetTrigger() {
  return (
    <div className="h-96">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">More</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel inset>Chennai · March</DropdownMenuLabel>
          <DropdownMenuItem inset>Open in Google Maps</DropdownMenuItem>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger inset>Move to theater</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuItem>PVR ICON — Phoenix Mall</DropdownMenuItem>
              <DropdownMenuItem>AGS Cinemas — OMR</DropdownMenuItem>
              <DropdownMenuItem>Rohini Silver Screens</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
