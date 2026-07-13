import { Card, CardContent, CardDescription, CardHeader, CardTitle, DatePicker, Label } from 'movies-tracker'

// DatePicker is a controlled Popover trigger: it takes a `YYYY-MM-DD` string and an
// onChange. The calendar itself lives in a Popover, so the resting state a design
// composes against is the trigger button — shown here in the "Date of watch" form row
// it fills in the Add Watch dialog.

const noop = () => {}

export function DateOfWatch() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Add a watch</CardTitle>
        <CardDescription>Oppenheimer · PVR ICON</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Label htmlFor="watch-date">Date of watch</Label>
        <DatePicker value="2024-03-14" onChange={noop} max="2024-12-31" />
        <p className="text-xs text-muted-foreground">
          Future dates are disabled — you can only log a film you've already seen.
        </p>
      </CardContent>
    </Card>
  )
}

export function Placeholder() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label>Date of watch</Label>
      <DatePicker value="" onChange={noop} placeholder="Pick a date" />
    </div>
  )
}

export function DateRange() {
  return (
    <div className="grid max-w-md gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label>From</Label>
        <DatePicker value="2024-01-01" onChange={noop} max="2024-03-14" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>To</Label>
        <DatePicker value="2024-03-14" onChange={noop} min="2024-01-01" />
      </div>
    </div>
  )
}

export function Disabled() {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label>Date of watch</Label>
      <DatePicker value="2023-07-21" onChange={noop} disabled />
      <p className="text-xs text-muted-foreground">
        Locked — this watch was imported from your ticket history.
      </p>
    </div>
  )
}
