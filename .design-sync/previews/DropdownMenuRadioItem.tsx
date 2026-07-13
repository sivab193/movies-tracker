import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'movies-tracker'
import { Timer } from 'lucide-react'

// How title-card times are displayed across the app. The checked radio item renders a small
// filled circle in the left gutter; a disabled item stays indented but dims.
export function Open() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Timer />
            Time format
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Show title-card times as</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value="mmss">
            <DropdownMenuRadioItem value="mmss">6:24 (mm:ss)</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="seconds">384 seconds</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="percent">3.6% of runtime</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="reel" disabled>
              Reel timecode (unavailable)
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// The same item type driving a language filter on the library.
export function Language() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Language</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuRadioGroup value="telugu">
            <DropdownMenuRadioItem value="all">All languages</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="english">English</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="telugu">Telugu</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="tamil">Tamil</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
