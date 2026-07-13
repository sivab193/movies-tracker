import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'movies-tracker'

// SelectTrigger is the button that opens the listbox: bordered, chevron on the right,
// placeholder text muted until something is chosen. `defaultOpen` shows it in its open
// state, with the listbox anchored beneath it.
export function Open() {
  return (
    <div className="h-80">
      <Select defaultOpen defaultValue="submissions">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Sort movies by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Recently added</SelectItem>
          <SelectItem value="rating">Highest IMDb rating</SelectItem>
          <SelectItem value="submissions">Most submissions</SelectItem>
          <SelectItem value="longest">Longest wait for title card</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

// Two sizes: `default` (h-9) for forms, `sm` (h-8) for toolbars and filter bars.
export function Sizes() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-64 flex-col gap-2">
        <Label htmlFor="theater">Theater</Label>
        <Select defaultValue="pvr-icon">
          <SelectTrigger id="theater" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pvr-icon">PVR ICON — Phoenix Mall</SelectItem>
            <SelectItem value="ags-omr">AGS Cinemas — OMR</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-64 flex-col gap-2">
        <Label htmlFor="year">Release year</Label>
        <Select defaultValue="2023">
          <SelectTrigger id="year" size="sm" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Nothing to pick from yet — the trigger dims and keeps the placeholder.
export function Disabled() {
  return (
    <Select disabled>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="No theaters saved" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">—</SelectItem>
      </SelectContent>
    </Select>
  )
}
