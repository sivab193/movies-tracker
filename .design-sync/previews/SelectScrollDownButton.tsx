import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from 'movies-tracker'

// SelectScrollDownButton only mounts when the viewport can still scroll down — it is the
// chevron pinned to the bottom edge of an overflowing listbox. SelectContent renders it
// for you; you never place it by hand.
//
// To make it appear: a list long enough to overflow (`max-h-56`), with the selected item
// near the top, so there is more list below the fold.
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

const BENGALURU = [
  ['pvr-forum', 'PVR — Forum Mall'],
  ['inox-garuda', 'INOX — Garuda Mall'],
  ['cinepolis', 'Cinepolis — Binnypet'],
  ['urvashi', 'Urvashi Theatre — Lalbagh Road'],
  ['rockline', 'Rockline Cinemas — Kalasipalya'],
  ['pvr-orion', 'PVR — Orion Mall'],
]

export function Open() {
  return (
    <div className="h-96">
      <Select defaultOpen defaultValue="ags-omr">
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
            <SelectLabel>Bengaluru</SelectLabel>
            {BENGALURU.map(([value, name]) => (
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

// Same mechanism on a flat list: every show time for Oppenheimer this weekend. The first
// slot is selected, so the chevron sits under the last visible row.
export function ShowTimes() {
  const times = [
    '6:45 AM',
    '9:15 AM',
    '10:00 AM',
    '11:45 AM',
    '1:15 PM',
    '2:30 PM',
    '4:30 PM',
    '6:00 PM',
    '7:30 PM',
    '9:00 PM',
    '10:45 PM',
    '11:59 PM',
  ]
  return (
    <div className="h-96">
      <Select defaultOpen defaultValue={times[0]}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Show time" />
        </SelectTrigger>
        <SelectContent className="max-h-56">
          {times.map((time) => (
            <SelectItem key={time} value={time}>
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
