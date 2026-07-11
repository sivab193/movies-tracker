"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isAfter,
  isBefore,
  parse,
} from "date-fns"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"

interface DatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  disabled?: boolean
  max?: string // YYYY-MM-DD
  min?: string // YYYY-MM-DD
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  max,
  min,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : null
  const [viewDate, setViewDate] = React.useState(
    selectedDate || new Date()
  )

  const maxDate = max ? parse(max, "yyyy-MM-dd", new Date()) : undefined
  const minDate = min ? parse(min, "yyyy-MM-dd", new Date()) : undefined

  // Reset view when opening
  React.useEffect(() => {
    if (open) {
      setViewDate(selectedDate || new Date())
    }
  }, [open])

  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const handleSelect = (day: Date) => {
    onChange(format(day, "yyyy-MM-dd"))
    setOpen(false)
  }

  const isDayDisabled = (day: Date) => {
    if (maxDate && isAfter(day, maxDate)) return true
    if (minDate && isBefore(day, minDate)) return true
    return false
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    setViewDate(subMonths(viewDate, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault()
    setViewDate(addMonths(viewDate, 1))
  }

  const handleToday = (e: React.MouseEvent) => {
    e.preventDefault()
    const today = new Date()
    if (!isDayDisabled(today)) {
      handleSelect(today)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    onChange("")
    setOpen(false)
  }

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
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-left truncate">
            {selectedDate ? format(selectedDate, "MMM dd, yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-border/60 shadow-xl"
        align="start"
        sideOffset={6}
      >
        <div className="p-3 select-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handlePrevMonth}
              className="hover:bg-accent/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold tracking-wide">
              {format(viewDate, "MMMM yyyy")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleNextMonth}
              className="hover:bg-accent/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, viewDate)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              const isDisabled = isDayDisabled(day)

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "h-8 w-8 rounded-md text-sm flex items-center justify-center transition-all duration-150 relative",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    // Base state
                    !isCurrentMonth && "text-muted-foreground/40",
                    isCurrentMonth && !isSelected && !isDisabled && "text-foreground hover:bg-accent/20",
                    // Selected state
                    isSelected &&
                      "bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90",
                    // Today indicator (not selected)
                    isToday && !isSelected && "font-bold",
                    // Disabled
                    isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent",
                  )}
                >
                  {format(day, "d")}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent/10"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded hover:bg-primary/10"
            >
              Today
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
