import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'movies-tracker'

// SelectItem is one option: highlighted on focus, with a check on the right when it is
// the chosen one. The listbox is open so both states are visible at once.
export function Open() {
  return (
    <div className="h-80">
      <Select defaultOpen defaultValue="ags-omr">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Where did you watch it?" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pvr-icon">PVR ICON — Phoenix Mall</SelectItem>
          <SelectItem value="ags-omr">AGS Cinemas — OMR</SelectItem>
          <SelectItem value="rohini">Rohini Silver Screens</SelectItem>
          <SelectItem value="sathyam">Sathyam Cinemas — Royapettah</SelectItem>
          <SelectItem value="luxe">Luxe Cinemas — Phoenix Market City</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

// A `disabled` item stays in the list but dims and cannot be picked — this screen is
// sold out, not gone.
export function DisabledItem() {
  return (
    <div className="h-80">
      <Select defaultOpen defaultValue="9-45">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Show time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="9-45">9:45 AM</SelectItem>
          <SelectItem value="1-15" disabled>
            1:15 PM — sold out
          </SelectItem>
          <SelectItem value="4-30">4:30 PM</SelectItem>
          <SelectItem value="7-30">7:30 PM</SelectItem>
          <SelectItem value="10-45" disabled>
            10:45 PM — sold out
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
