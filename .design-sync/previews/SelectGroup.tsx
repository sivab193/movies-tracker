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

// SelectGroup ties a SelectLabel to the items under it (aria-labelledby), so a long
// theater list reads as "Chennai · these five", not as one flat run of names.
export function Open() {
  return (
    <div className="h-80">
      <Select defaultOpen defaultValue="rohini">
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Where did you watch it?" />
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
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Mumbai</SelectLabel>
            <SelectItem value="regal">Regal Cinema — Colaba</SelectItem>
            <SelectItem value="gaiety">Gaiety Galaxy — Bandra</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

// A group is still worth using with a single section — it names what the list is.
export function Closed() {
  return (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="theater-group">Theater</Label>
      <Select defaultValue="pvr-icon">
        <SelectTrigger id="theater-group" className="w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Recently visited</SelectLabel>
            <SelectItem value="pvr-icon">PVR ICON — Phoenix Mall</SelectItem>
            <SelectItem value="ags-omr">AGS Cinemas — OMR</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
