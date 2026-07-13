import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from 'movies-tracker'

// SelectLabel is the small muted heading inside the listbox — the section name, never a
// clickable option. (The form label above the trigger is the separate `Label` component.)
export function Open() {
  return (
    <div className="h-80">
      <Select defaultOpen defaultValue="telugu">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Filter by language" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>South Indian</SelectLabel>
            <SelectItem value="tamil">Tamil</SelectItem>
            <SelectItem value="telugu">Telugu</SelectItem>
            <SelectItem value="malayalam">Malayalam</SelectItem>
            <SelectItem value="kannada">Kannada</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>International</SelectLabel>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="korean">Korean</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

// The two labels side by side: `Label` labels the field, `SelectLabel` labels a section
// of the list.
export function WithFieldLabel() {
  return (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="currency-field">Ticket currency</Label>
      <Select defaultValue="inr">
        <SelectTrigger id="currency-field" className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Common</SelectLabel>
            <SelectItem value="inr">₹ INR</SelectItem>
            <SelectItem value="usd">$ USD</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Used for every ticket and snack cost you log.
      </p>
    </div>
  )
}
