const WATCH_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function watchDateValue(value?: string | null): string | null {
  if (!value) return null
  const match = value.match(WATCH_DATE_PATTERN)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const candidate = new Date(Date.UTC(year, month - 1, day))
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) return null

  return `${match[1]}-${match[2]}-${match[3]}`
}

export function entryWatchDate(entry: { watchDate?: string | null; timestamp?: string | null; createdAt?: string | null }): string | null {
  return watchDateValue(entry.watchDate) || watchDateValue(entry.timestamp) || watchDateValue(entry.createdAt)
}

export function formatWatchDate(value?: string | null, fallback = "Unknown Date"): string {
  const date = watchDateValue(value)
  if (!date) return fallback
  const [year, month, day] = date.split("-").map(Number)
  return `${MONTHS_SHORT[month - 1]} ${day}, ${year}`
}

export function watchSortValue(
  entry: { watchDate?: string | null; timestamp?: string | null; createdAt?: string | null; showTime?: string | null }
): number {
  const date = entryWatchDate(entry)
  if (!date) return 0
  const dayValue = Number(date.replaceAll("-", "")) * 10_000
  const time = (entry.showTime || "").match(/^(\d{2}):(\d{2})$/)
  if (!time) return dayValue
  return dayValue + Number(time[1]) * 100 + Number(time[2])
}

export function localToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
