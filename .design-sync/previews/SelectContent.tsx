import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from 'movies-tracker'

// SelectContent is the popover surface: bordered, shadowed, portalled, and anchored to
// the trigger. `defaultOpen` renders it inside the card, where it can actually be seen.
export function Open() {
  return (
    <div className="h-80">
      <Select defaultOpen defaultValue="tamil">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Filter by language" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Indian languages</SelectLabel>
            <SelectItem value="tamil">Tamil</SelectItem>
            <SelectItem value="telugu">Telugu</SelectItem>
            <SelectItem value="hindi">Hindi</SelectItem>
            <SelectItem value="malayalam">Malayalam</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Other</SelectLabel>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="korean">Korean</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

// The content is at least `min-w-32` but stretches to the trigger's width — a wide
// trigger gives a wide listbox.
export function WideTrigger() {
  return (
    <div className="h-80">
      <Select defaultOpen defaultValue="longest">
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Sort movies by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Recently added</SelectItem>
          <SelectItem value="rating">Highest IMDb rating</SelectItem>
          <SelectItem value="submissions">Most submissions</SelectItem>
          <SelectItem value="longest">Longest wait for title card</SelectItem>
          <SelectItem value="shortest">Shortest wait for title card</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
