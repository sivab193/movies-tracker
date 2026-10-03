"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

interface TimePickerProps {
  value: string // "HH:MM" 24h, or ""
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const FACE = 248
const CX = FACE / 2
const CY = FACE / 2
const OUTER_R = 92
const INNER_R = 56
const RING_CUTOFF = (OUTER_R + INNER_R) / 2 // drag radius deciding outer vs inner ring

function parse24h(value: string): { h: number; min: number } | null {
  const m = (value || "").match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return { h, min }
}

function format24h(h: number, min: number): string {
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}

function posFor(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) }
}

// Outer ring: 00 at top, then 13..23 clockwise. Inner ring: 12 at top, then 1..11.
const OUTER_HOURS = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
const INNER_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

export function TimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select time",
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"hour" | "minute">("hour")
  const parsed = parse24h(value)

  const [hour24, setHour24] = React.useState<number | null>(null)
  const [minute, setMinute] = React.useState<number | null>(null)

  const faceRef = React.useRef<HTMLDivElement>(null)
  const dragState = React.useRef<{ dragging: boolean; moved: boolean; sx: number; sy: number }>({
    dragging: false,
    moved: false,
    sx: 0,
    sy: 0,
  })

  // Seed the picker from the current value each time it opens.
  React.useEffect(() => {
    if (open) {
      setMode("hour")
      if (parsed) {
        setHour24(parsed.h)
        setMinute(Math.round(parsed.min / 5) * 5 % 60)
      } else {
        setHour24(null)
        setMinute(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const commit = (h: number | null, m: number | null) => {
    if (h == null || m == null) return
    onChange(format24h(h, m))
  }

  const angleToValue = (clientX: number, clientY: number) => {
    const el = faceRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clientX - (rect.left + rect.width / 2)
    const y = clientY - (rect.top + rect.height / 2)
    let deg = (Math.atan2(x, -y) * 180) / Math.PI
    if (deg < 0) deg += 360
    if (mode === "hour") {
      const idx = Math.round(deg / 30) % 12
      const dist = Math.hypot(x, y)
      // Scale-independent: compare against the rendered ring radii.
      const scale = rect.width / FACE
      const nh = dist > RING_CUTOFF * scale ? OUTER_HOURS[idx] : INNER_HOURS[idx]
      setHour24(nh)
      commit(nh, minute)
    } else {
      const raw = Math.round(deg / 6) % 60
      const nm = (Math.round(raw / 5) * 5) % 60
      setMinute(nm)
      commit(hour24, nm)
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    dragState.current = { dragging: true, moved: false, sx: e.clientX, sy: e.clientY }
    angleToValue(e.clientX, e.clientY)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragState.current
    if (!d.dragging) return
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true
    angleToValue(e.clientX, e.clientY)
  }

  const endDrag = () => {
    const d = dragState.current
    // A clean tap on an hour jumps straight to minute selection.
    if (d.dragging && !d.moved && mode === "hour" && hour24 != null) {
      setMode("minute")
    }
    d.dragging = false
    d.moved = false
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowUp" || e.key === "ArrowRight" ? 1 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    e.preventDefault()
    if (mode === "hour") {
      const nh = ((hour24 ?? 0) + step + 24) % 24
      setHour24(nh)
      commit(nh, minute)
    } else {
      const nm = ((minute ?? 0) + step * 5 + 60) % 60
      setMinute(nm)
      commit(hour24, nm)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    onChange("")
    setOpen(false)
  }

  // Hand position for the current selection
  const hand =
    mode === "hour"
      ? hour24 == null
        ? null
        : (() => {
            const outer = OUTER_HOURS.includes(hour24)
            const list = outer ? OUTER_HOURS : INNER_HOURS
            return { end: posFor(list.indexOf(hour24) * 30, outer ? OUTER_R : INNER_R) }
          })()
      : minute == null
        ? null
        : { end: posFor(minute * 6, OUTER_R) }

  const hourNumbers = [
    ...OUTER_HOURS.map((h, i) => ({
      label: String(h).padStart(2, "0"),
      angle: i * 30,
      r: OUTER_R,
      small: false,
      active: hour24 === h,
    })),
    ...INNER_HOURS.map((h, i) => ({
      label: String(h),
      angle: i * 30,
      r: INNER_R,
      small: true,
      active: hour24 === h,
    })),
  ]

  const minuteNumbers = Array.from({ length: 12 }, (_, i) => ({
    label: String(i * 5).padStart(2, "0"),
    angle: i * 30,
    r: OUTER_R,
    small: false,
    active: minute === i * 5,
  }))

  const numbers = mode === "hour" ? hourNumbers : minuteNumbers

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "hover:bg-accent/10 transition-colors duration-150",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-left truncate tabular-nums">
            {parsed ? format24h(parsed.h, parsed.min) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-border/60 shadow-xl"
        align="start"
        sideOffset={6}
      >
        <div className="p-4 select-none">
          {/* Digital readout — tap hour/minute to switch the dial */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-baseline gap-1 text-3xl font-bold tabular-nums">
              <button
                type="button"
                onClick={() => setMode("hour")}
                className={cn(
                  "rounded px-1.5 py-0.5 transition-colors",
                  mode === "hour" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {hour24 == null ? "--" : String(hour24).padStart(2, "0")}
              </button>
              <span className="text-muted-foreground">:</span>
              <button
                type="button"
                onClick={() => setMode("minute")}
                className={cn(
                  "rounded px-1.5 py-0.5 transition-colors",
                  mode === "minute" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {minute == null ? "--" : String(minute).padStart(2, "0")}
              </button>
            </div>
          </div>

          {/* Clock face — tap or drag */}
          <div
            ref={faceRef}
            role="slider"
            tabIndex={0}
            aria-label={mode === "hour" ? "Select hour (24-hour clock)" : "Select minute"}
            aria-valuetext={
              mode === "hour"
                ? hour24 == null
                  ? "No hour selected"
                  : `Hour ${hour24}`
                : minute == null
                  ? "No minute selected"
                  : `Minute ${minute}`
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onKeyDown}
            className="relative mx-auto rounded-full bg-muted/40 border border-border/60 cursor-pointer touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ width: FACE, height: FACE }}
          >
            {/* minute ticks */}
            {Array.from({ length: 60 }, (_, i) => {
              const p1 = posFor(i * 6, OUTER_R + 20)
              const p2 = posFor(i * 6, OUTER_R + 24)
              return (
                <div
                  key={i}
                  className="absolute bg-muted-foreground/30"
                  style={{
                    left: p1.x,
                    top: p1.y,
                    width: 2,
                    height: Math.hypot(p2.x - p1.x, p2.y - p1.y) + 1,
                    transform: `translate(-50%, -50%) rotate(${i * 6}deg)`,
                    transformOrigin: "center",
                  }}
                />
              )
            })}
            {/* numbers */}
            {numbers.map((n) => {
              const p = posFor(n.angle, n.r)
              return (
                <div
                  key={`${n.r}-${n.label}`}
                  className={cn(
                    "absolute flex items-center justify-center rounded-full font-semibold tabular-nums transition-colors pointer-events-none",
                    n.small ? "text-[13px]" : "text-sm",
                    n.active ? "bg-primary text-primary-foreground" : "text-foreground"
                  )}
                  style={{
                    left: p.x,
                    top: p.y,
                    width: n.small ? 32 : 36,
                    height: n.small ? 32 : 36,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {n.label}
                </div>
              )
            })}
            {/* hand */}
            {hand && (
              <svg className="absolute inset-0 pointer-events-none" width={FACE} height={FACE}>
                <line
                  x1={CX}
                  y1={CY}
                  x2={hand.end.x}
                  y2={hand.end.y}
                  stroke="var(--primary)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.7}
                />
                <circle cx={hand.end.x} cy={hand.end.y} r={5} fill="var(--primary)" opacity={0.9} />
              </svg>
            )}
            {/* center pin */}
            <div
              className="absolute rounded-full bg-primary"
              style={{
                left: CX,
                top: CY,
                width: 10,
                height: 10,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            {mode === "hour"
              ? "Outer ring 13–23 · inner ring 1–12 — tap or drag"
              : "Tap or drag to pick the minutes"}
          </p>

          <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold bg-primary text-primary-foreground rounded-md px-4 py-1.5 hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
