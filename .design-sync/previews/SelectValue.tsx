import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'movies-tracker'

// SelectValue renders whatever the chosen SelectItem's text is — here the currency the
// ticket price is logged in. Open, so you can see the value track the checked item.
export function Open() {
  return (
    <div className="h-80">
      <Select defaultOpen defaultValue="inr">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="inr">₹ INR — Indian Rupee</SelectItem>
          <SelectItem value="usd">$ USD — US Dollar</SelectItem>
          <SelectItem value="eur">€ EUR — Euro</SelectItem>
          <SelectItem value="gbp">£ GBP — Pound Sterling</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

// With no value set, SelectValue falls back to its `placeholder`, rendered in muted text
// via the trigger's `data-placeholder` state.
export function Placeholder() {
  return (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="theater-empty">Theater</Label>
      <Select>
        <SelectTrigger id="theater-empty" className="w-64">
          <SelectValue placeholder="Where did you watch it?" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pvr-icon">PVR ICON — Phoenix Mall</SelectItem>
          <SelectItem value="ags-omr">AGS Cinemas — OMR</SelectItem>
          <SelectItem value="rohini">Rohini Silver Screens</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

// Once chosen, the item's full label shows in the trigger — it line-clamps rather than
// wrapping when the theater name is long.
export function Selected() {
  return (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="theater-picked">Theater</Label>
      <Select defaultValue="rohini">
        <SelectTrigger id="theater-picked" className="w-64">
          <SelectValue placeholder="Where did you watch it?" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pvr-icon">PVR ICON — Phoenix Mall</SelectItem>
          <SelectItem value="ags-omr">AGS Cinemas — OMR</SelectItem>
          <SelectItem value="rohini">Rohini Silver Screens</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
