import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'movies-tracker'
import { Columns3 } from 'lucide-react'

// The column-toggle menu above the library table. Checked items show the check indicator in
// the reserved left gutter; unchecked items keep the same indent.
export function Open() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Columns3 />
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Show columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>Poster</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked>Title-card time</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked>IMDb rating</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Runtime</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Language</DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked disabled>
            Movie title
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Same control used as a filter: which entries appear in the watch history.
export function Filters() {
  return (
    <div className="h-80">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Filter history</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Include</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>Theater visits</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked>Home rewatches</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Entries with no logged time</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
