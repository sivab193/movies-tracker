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
import { ArrowUpDown } from 'lucide-react'

// The library sort menu: exactly one option can win, so it's a radio group, not checkboxes.
// `value` pins the current sort — the selected item shows the filled dot indicator.
export function Open() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <ArrowUpDown />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Sort library by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value="recent">
            <DropdownMenuRadioItem value="recent">Recently added</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="rating">Highest rated</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="runtime">Longest runtime</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="logs">Most title-card logs</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Two radio groups in one menu, each with its own label and its own independent selection.
export function TwoGroups() {
  return (
    <div className="h-96">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">View options</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Sort</DropdownMenuLabel>
          <DropdownMenuRadioGroup value="rating">
            <DropdownMenuRadioItem value="recent">Recently added</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="rating">Highest rated</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Order</DropdownMenuLabel>
          <DropdownMenuRadioGroup value="desc">
            <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
