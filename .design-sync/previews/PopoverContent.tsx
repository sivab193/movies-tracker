import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from 'movies-tracker'
import { SlidersHorizontal } from 'lucide-react'

// The quick-filter panel: PopoverContent is a real form surface (w-72, padded, bordered), not
// just a tooltip. Filters here are the ones the library page actually offers.
export function Open() {
  return (
    <div className="h-96">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <SlidersHorizontal />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <div className="grid gap-4">
            <div className="grid gap-1">
              <span className="text-sm font-medium leading-none">Filter library</span>
              <span className="text-muted-foreground text-xs">
                Narrow the 128 movies you track.
              </span>
            </div>
            <div className="grid gap-3">
              <div className="grid grid-cols-3 items-center gap-3">
                <Label htmlFor="year-from">Year from</Label>
                <Input id="year-from" defaultValue="2019" className="col-span-2 h-8" />
              </div>
              <div className="grid grid-cols-3 items-center gap-3">
                <Label htmlFor="min-rating">Min rating</Label>
                <Input id="min-rating" defaultValue="7.5" className="col-span-2 h-8" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="logged-only">Has a logged title card</Label>
                <Switch id="logged-only" defaultChecked />
              </div>
            </div>
            <Button size="sm">Apply filters</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Content placement: `side="right"` anchors the panel beside the trigger instead of below it.
export function SideRight() {
  return (
    <div className="h-80">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="secondary">Runtime</Button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-64">
          <div className="grid gap-2">
            <span className="text-sm font-medium leading-none">Oppenheimer</span>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Runtime</span>
              <span className="tabular-nums">180 min</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Title card</span>
              <span className="font-mono tabular-nums">6:24</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
