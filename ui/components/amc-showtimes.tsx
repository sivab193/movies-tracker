"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, ExternalLink, Loader2, LocateFixed, MapPin, RefreshCw, Ticket } from "lucide-react"
import { addDays, format, formatDistanceToNow } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAMCShowtimes, type AMCShowtime, type AMCShowtimesResponse } from "@/services/amc-service"

const WEST_LAFAYETTE = { lat: 40.4259, lon: -86.9081, label: "West Lafayette, IN" }

function languageLine(showtime: AMCShowtime) {
  const values = []
  if (showtime.languages.spoken) values.push(`${showtime.languages.spoken} audio`)
  if (showtime.languages.dubbedOver) values.push(`dubbed in ${showtime.languages.dubbedOver}`)
  if (showtime.languages.subtitle) values.push(`${showtime.languages.subtitle} subtitles`)
  return values.join(" · ")
}

function priceLine(showtime: AMCShowtime) {
  const adult = showtime.ticketPrices.find((price) => price.type?.toUpperCase() === "ADULT") || showtime.ticketPrices[0]
  if (!adult) return null
  const fees = showtime.estimatedFees.reduce((sum, fee) => sum + fee.priceCents, 0)
  return `from $${((adult.priceCents + fees) / 100).toFixed(2)}`
}

function badges(showtime: AMCShowtime) {
  const values = [showtime.premiumFormat, ...showtime.attributes.map((attribute) => attribute.name || attribute.code)]
  return [...new Set(values.filter(Boolean))] as string[]
}

export function AMCShowtimes({ movieId, compact = false }: { movieId?: string; compact?: boolean }) {
  const [coordinates, setCoordinates] = useState(WEST_LAFAYETTE)
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [formatFilter, setFormatFilter] = useState("all")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [data, setData] = useState<AMCShowtimesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [locationMessage, setLocationMessage] = useState(`Showing distances from ${WEST_LAFAYETTE.label}`)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setData(await getAMCShowtimes({ lat: coordinates.lat, lon: coordinates.lon, date, movieId }))
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : "AMC showtimes are unavailable")
    } finally {
      setLoading(false)
    }
  }, [coordinates.lat, coordinates.lon, date, movieId])

  useEffect(() => { void load() }, [load])

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser")
      return
    }
    setLocationMessage("Finding your location…")
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ lat: coords.latitude, lon: coords.longitude, label: "your current location" })
        setLocationMessage("Showing distances from your current location")
      },
      () => setLocationMessage(`Location permission was not granted. Using ${WEST_LAFAYETTE.label}.`),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  const groups = useMemo(() => (data?.groups || []).map((group) => ({
    ...group,
    showtimes: group.showtimes.filter((showtime) => {
      const showtimeBadges = badges(showtime).join(" ").toLowerCase()
      const showtimeLanguages = languageLine(showtime).toLowerCase()
      const hour = showtime.showDateTimeLocal ? new Date(showtime.showDateTimeLocal).getHours() : 0
      return (formatFilter === "all" || showtimeBadges.includes(formatFilter))
        && (languageFilter === "all" || showtimeLanguages.includes(languageFilter))
        && (timeFilter === "all" || (timeFilter === "matinee" ? hour < 17 : hour >= 17))
    }),
  })).filter((group) => group.showtimes.length > 0), [data, formatFilter, languageFilter, timeFilter])

  return (
    <section aria-labelledby={movieId ? "movie-showtimes-heading" : "showtimes-heading"}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={movieId ? "movie-showtimes-heading" : "showtimes-heading"} className={compact ? "text-lg font-bold" : "text-2xl font-bold"}>
            {movieId ? "Now showing" : "Showtimes near me"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{locationMessage}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor={`showtime-date-${movieId || "all"}`} className="text-xs">Date</Label>
            <Input
              id={`showtime-date-${movieId || "all"}`}
              type="date"
              value={date}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), 7), "yyyy-MM-dd")}
              onChange={(event) => setDate(event.target.value)}
              className="h-9 w-40"
            />
          </div>
          <Button variant="outline" size="sm" onClick={useMyLocation} className="gap-1.5"><LocateFixed className="h-4 w-4" />Use my location</Button>
          <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Refresh showtimes"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {!compact && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Filter label="Format" value={formatFilter} onChange={setFormatFilter} options={[["all", "All formats"], ["imax", "IMAX"], ["dolby", "Dolby Cinema"], ["3d", "3D"]]} />
          <Filter label="Language" value={languageFilter} onChange={setLanguageFilter} options={[["all", "All languages"], ["tamil", "Tamil"], ["telugu", "Telugu"], ["hindi", "Hindi"], ["malayalam", "Malayalam"]]} />
          <Filter label="Time" value={timeFilter} onChange={setTimeFilter} options={[["all", "Any time"], ["matinee", "Before 5 PM"], ["evening", "5 PM or later"]]} />
        </div>
      )}

      {loading && <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading AMC showtimes…</div>}
      {!loading && error && (
        <Card><CardContent className="flex items-start gap-3 py-5"><AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Showtimes are unavailable</p><p className="text-sm text-muted-foreground">{error}. The rest of MediaVerse is still available.</p></div></CardContent></Card>
      )}
      {!loading && !error && data && groups.length === 0 && (
        <Card><CardContent className="py-7 text-center"><Ticket className="mx-auto mb-2 h-6 w-6 text-muted-foreground" /><p className="font-medium">No matching AMC showtimes</p><p className="mt-1 text-sm text-muted-foreground">Try another day or broaden the filters. AMC theatres may be a substantial drive from your location.</p></CardContent></Card>
      )}
      <div className="space-y-4">
        {groups.map((group) => (
          <Card key={String(group.theatre.id)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-col justify-between gap-1 text-base sm:flex-row sm:items-center">
                <span>{group.theatre.name || `AMC Theatre ${group.theatre.id}`}</span>
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{group.distanceMiles == null ? "Distance unavailable" : `${group.distanceMiles.toFixed(1)} mi away`}</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{[group.theatre.location?.address, group.theatre.location?.city, group.theatre.location?.state].filter(Boolean).join(", ")}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.showtimes.map((showtime) => {
                const disabled = showtime.isSoldOut || showtime.isCanceled || !showtime.purchaseUrl
                return (
                  <div key={showtime.id} className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      {!movieId && <p className="mb-1 truncate text-sm font-semibold">{showtime.movieName}</p>}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-base font-bold">{showtime.showDateTimeLocal ? format(new Date(showtime.showDateTimeLocal), "h:mm a") : "Time unavailable"}</span>
                        {badges(showtime).slice(0, 4).map((badge) => <Badge key={badge} variant="secondary" className="text-[10px]">{badge}</Badge>)}
                        {showtime.isDiscountMatineePriced && <Badge className="text-[10px]">{showtime.discountMatineeMessage || "Matinee"}</Badge>}
                        {showtime.isAlmostSoldOut && <Badge variant="destructive" className="text-[10px]">Almost sold out</Badge>}
                        {showtime.isSoldOut && <Badge variant="destructive" className="text-[10px]">Sold out</Badge>}
                        {showtime.isCanceled && <Badge variant="destructive" className="text-[10px]">Canceled</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{[languageLine(showtime), priceLine(showtime)].filter(Boolean).join(" · ")}</p>
                    </div>
                    <Button asChild={!disabled} disabled={disabled} size="sm" className="shrink-0 gap-1.5">
                      {disabled ? <span>Unavailable</span> : <a href={showtime.purchaseUrl} target="_blank" rel="noreferrer">Buy on AMC<ExternalLink className="h-3.5 w-3.5" /></a>}
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
      {data && !loading && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{data.attribution}. Prices and availability are confirmed on AMC at purchase.</span>
          {data.fetchedAtUtc && <span>{data.stale ? "Cached data · " : "Updated "}{formatDistanceToNow(new Date(data.fetchedAtUtc), { addSuffix: true })}</span>}
        </div>
      )}
      {!movieId && <p className="mt-3 text-xs text-muted-foreground">Looking for a title first? <Link href="/movies" className="underline underline-offset-4">Browse the MediaVerse catalog</Link>.</p>}
    </section>
  )
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map(([optionValue, text]) => <SelectItem key={optionValue} value={optionValue}>{text}</SelectItem>)}</SelectContent></Select></div>
}
