import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from 'movies-tracker'

// SelectScrollUpButton only mounts once the viewport has been scrolled away from the top —
// the chevron pinned to the top edge of an overflowing listbox. SelectContent renders it
// for you; you never place it by hand.
//
// To make it appear: a list long enough to overflow (`max-h-56`) with the selected item
// near the bottom. Radix scrolls the checked item into view on open, which pushes the
// list past its top edge and mounts the button.
const CHENNAI = [
  ['pvr-icon', 'PVR ICON — Phoenix Mall'],
  ['ags-omr', 'AGS Cinemas — OMR'],
  ['rohini', 'Rohini Silver Screens'],
  ['sathyam', 'Sathyam Cinemas — Royapettah'],
  ['luxe', 'Luxe Cinemas — Phoenix Market City'],
  ['kasi', 'Kasi Theatre — Ashok Nagar'],
  ['jazz', 'Jazz Cinemas LUXE — Chennai'],
  ['inox-citi', 'INOX — Chennai Citi Centre'],
  ['vetri', 'Vetri Theatre — Chromepet'],
  ['devi', 'Devi Cineplex — Mount Road'],
  ['escape', 'Escape Cinemas — Express Avenue'],
  ['palazzo', 'Palazzo — Forum Vijaya Mall'],
]

const MUMBAI = [
  ['regal', 'Regal Cinema — Colaba'],
  ['gaiety', 'Gaiety Galaxy — Bandra'],
  ['pvr-infiniti', 'PVR ICON — Infiniti Mall'],
  ['inox-nariman', 'INOX — Nariman Point'],
  ['maratha', 'Maratha Mandir — Mumbai Central'],
  ['cinepolis-andheri', 'Cinepolis — Andheri West'],
]

export function Open() {
  return (
    <div className="h-96">
      <Select defaultOpen defaultValue="cinepolis-andheri">
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Where did you watch it?" />
        </SelectTrigger>
        <SelectContent className="max-h-56">
          <SelectGroup>
            <SelectLabel>Chennai</SelectLabel>
            {CHENNAI.map(([value, name]) => (
              <SelectItem key={value} value={value}>
                {name}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Mumbai</SelectLabel>
            {MUMBAI.map(([value, name]) => (
              <SelectItem key={value} value={value}>
                {name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

// Selected item in the middle of a long flat list: both scroll buttons mount, top and
// bottom.
export function BothButtons() {
  const years = Array.from({ length: 16 }, (_, i) => String(2024 - i))
  return (
    <div className="h-96">
      <Select defaultOpen defaultValue="2016">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Release year" />
        </SelectTrigger>
        <SelectContent className="max-h-56">
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
