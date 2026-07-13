import { Button, Popover, PopoverContent, PopoverTrigger } from 'movies-tracker'
import { Clock } from 'lucide-react'

const REPORTS = [
  { time: '6:19', count: 6 },
  { time: '6:24', count: 28 },
  { time: '6:31', count: 8 },
]

// The title-card breakdown: click the logged time on a movie and the popover explains where
// that average came from. `defaultOpen` renders the panel inside the card.
export function Open() {
  return (
    <div className="h-96">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">
            <Clock />
            Title card 6:24
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <div className="grid gap-3">
            <div className="grid gap-1">
              <span className="text-sm font-medium leading-none">Oppenheimer</span>
              <span className="text-muted-foreground text-xs">
                Average of 42 submissions
              </span>
            </div>
            <div className="grid gap-2">
              {REPORTS.map((r) => (
                <div key={r.time} className="grid gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono tabular-nums">{r.time}</span>
                    <span className="text-muted-foreground">{r.count}</span>
                  </div>
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.round((r.count / 42) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Closed: in the product the trigger is a quiet inline affordance on the movie card.
export function Closed() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Clock />
          Title card 8:18 · 63 logs
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <span className="text-sm">Reported by 63 people watching RRR.</span>
      </PopoverContent>
    </Popover>
  )
}
