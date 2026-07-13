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

// SelectSeparator is the hairline rule between sections of the listbox. It bleeds to the
// content's edges (-mx-1) and is not focusable.
export function Open() {
  return (
    <div className="h-80">
      <Select defaultOpen defaultValue="pvr-icon">
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Where did you watch it?" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Recently visited</SelectLabel>
            <SelectItem value="pvr-icon">PVR ICON — Phoenix Mall</SelectItem>
            <SelectItem value="ags-omr">AGS Cinemas — OMR</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>All theaters in Chennai</SelectLabel>
            <SelectItem value="rohini">Rohini Silver Screens</SelectItem>
            <SelectItem value="sathyam">Sathyam Cinemas — Royapettah</SelectItem>
            <SelectItem value="luxe">Luxe Cinemas — Phoenix Market City</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

// Separators also work without groups — here they fence off the "clear" action at the
// bottom of a sort menu.
export function BetweenSections() {
  return (
    <div className="h-80">
      <Select defaultOpen defaultValue="rating">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Sort movies by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Recently added</SelectItem>
          <SelectItem value="rating">Highest IMDb rating</SelectItem>
          <SelectSeparator />
          <SelectItem value="submissions">Most submissions</SelectItem>
          <SelectItem value="longest">Longest wait for title card</SelectItem>
          <SelectSeparator />
          <SelectItem value="default">Reset to default order</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
