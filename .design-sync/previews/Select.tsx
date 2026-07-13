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

// `defaultOpen` renders the listbox inside the card — a closed Select would just be a
// button, which tells you nothing about the component.
export function Open() {
  return (
    <div className="h-80">
      <Select defaultOpen defaultValue="pvr-icon">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Pick a theater" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Chennai</SelectLabel>
            <SelectItem value="pvr-icon">PVR ICON — Phoenix Mall</SelectItem>
            <SelectItem value="ags-omr">AGS Cinemas — OMR</SelectItem>
            <SelectItem value="rohini">Rohini Silver Screens</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Bengaluru</SelectLabel>
            <SelectItem value="pvr-forum">PVR — Forum Mall</SelectItem>
            <SelectItem value="inox-garuda">INOX — Garuda Mall</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export function Closed() {
  return (
    <div className="flex w-64 flex-col gap-2">
      <Label htmlFor="currency">Currency</Label>
      <Select defaultValue="inr">
        <SelectTrigger id="currency">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="inr">₹ INR</SelectItem>
          <SelectItem value="usd">$ USD</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export function Disabled() {
  return (
    <Select disabled>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="No theaters available" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">—</SelectItem>
      </SelectContent>
    </Select>
  )
}
