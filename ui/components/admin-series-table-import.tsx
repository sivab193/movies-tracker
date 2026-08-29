"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CollapsibleSection } from "@/components/collapsible-section"
import {
  importSeriesTable,
  previewSeriesTableImport,
  type SeriesTableRow,
} from "@/services/series-table-import-service"

const HEADER_ALIASES: Record<string, string> = {
  season: "season", seasonnumber: "season", season_number: "season", s: "season",
  episode: "episode", episodenumber: "episode", episode_number: "episode", ep: "episode", e: "episode",
  title: "title", name: "title", episodetitle: "title", episode_title: "title",
  duration: "duration", runtime: "duration", runtimeminutes: "duration", runtime_minutes: "duration",
  watchurl: "watchUrl", watch_url: "watchUrl", link: "watchUrl", url: "watchUrl",
  provider: "provider", ott: "provider", platform: "provider",
  airdate: "airDate", air_date: "airDate", released: "airDate", release_date: "airDate",
  rating: "rating", imdbrating: "rating", imdb_rating: "rating",
  episodeimdb: "episodeImdbId", episode_imdb: "episodeImdbId", episodeimdbid: "episodeImdbId", imdbid: "episodeImdbId",
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "")
}

function splitDelimitedLine(line: string, delimiter: string) {
  const values: string[] = []
  let current = ""
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i += 1 } else quoted = !quoted
      continue
    }
    if (char === delimiter && !quoted) { values.push(current.trim()); current = ""; continue }
    current += char
  }
  values.push(current.trim())
  return values
}

function parseTable(text: string): SeriesTableRow[] {
  const lines = text.replace(/\r/g, "").split("\n").filter((line) => line.trim())
  if (lines.length < 2) throw new Error("Paste a header row and at least one episode row")
  const delimiter = lines[0].includes("\t") ? "\t" : ","
  const headers = splitDelimitedLine(lines[0], delimiter).map((header) => HEADER_ALIASES[normalizeHeader(header)] || normalizeHeader(header))
  for (const required of ["season", "episode", "title"]) if (!headers.includes(required)) throw new Error(`Missing required column: ${required}`)
  return lines.slice(1).map((line, index) => {
    const values = splitDelimitedLine(line, delimiter)
    const raw: Record<string, string> = {}
    headers.forEach((header, column) => { raw[header] = values[column] ?? "" })
    const season = Number.parseInt(raw.season, 10)
    const episode = Number.parseInt(raw.episode, 10)
    if (!Number.isFinite(season) || !Number.isFinite(episode)) throw new Error(`Row ${index + 2}: season and episode must be numbers`)
    return { season, episode, title: raw.title, duration: raw.duration, watchUrl: raw.watchUrl, provider: raw.provider, airDate: raw.airDate, rating: raw.rating, episodeImdbId: raw.episodeImdbId }
  })
}

function parseHotstarHtml(html: string): SeriesTableRow[] {
  if (!html.trim()) throw new Error("Paste Hotstar episode-list HTML first")
  const doc = new DOMParser().parseFromString(html, "text/html")
  const cards = Array.from(doc.querySelectorAll("li[data-testid='episode-card']"))
  if (!cards.length) throw new Error("No Hotstar episode cards were found. Paste the HTML containing the episode list.")

  const rows = cards.map((card, index) => {
    const title = card.querySelector("h3")?.textContent?.trim() || ""
    const tags = Array.from(card.querySelectorAll("[data-testid='textTag']"))
      .map((node) => node.textContent?.trim() || "")
      .filter(Boolean)
    const seasonEpisode = tags.find((value) => /S\s*\d+\s*E\s*\d+/i.test(value)) || ""
    const match = seasonEpisode.match(/S\s*(\d+)\s*E\s*(\d+)/i)
    if (!match || !title) throw new Error(`Hotstar card ${index + 1}: could not determine season, episode or title`)

    const releaseDate = tags.find((value) => /\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/.test(value)) || ""
    const duration = tags.find((value) => /^\s*\d+(?:\s*h(?:\s*\d+\s*m)?|\s*m)\s*$/i.test(value)) || ""
    const href = card.querySelector("a[data-testid='link']")?.getAttribute("href") || card.querySelector("a[href*='/watch']")?.getAttribute("href") || ""
    const watchUrl = href ? new URL(href, "https://www.hotstar.com").toString() : ""

    return {
      season: Number(match[1]),
      episode: Number(match[2]),
      title,
      duration,
      airDate: releaseDate,
      watchUrl,
      provider: "Hotstar",
    }
  })

  const unique = new Map<string, SeriesTableRow>()
  rows.forEach((row) => unique.set(`${row.season}-${row.episode}`, row))
  return Array.from(unique.values()).sort((a, b) => a.season - b.season || a.episode - b.episode)
}

export function AdminSeriesTableImport() {
  const [imdbId, setImdbId] = useState("")
  const [provider, setProvider] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [inputMode, setInputMode] = useState<"html" | "table">("html")
  const [sourceText, setSourceText] = useState("")
  const [rows, setRows] = useState<SeriesTableRow[]>([])
  const [preview, setPreview] = useState<any | null>(null)
  const [detectedSource, setDetectedSource] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const seasonCount = useMemo(() => new Set(rows.map((row) => row.season)).size, [rows])

  const handlePreview = async () => {
    setBusy(true); setError(null); setSuccess(null)
    try {
      const parsed = inputMode === "html" ? parseHotstarHtml(sourceText) : parseTable(sourceText)
      const source = inputMode === "html" ? "Hotstar HTML" : "CSV / table"
      setDetectedSource(source)
      setRows(parsed)
      const result = await previewSeriesTableImport({ imdbId, provider: inputMode === "html" ? "Hotstar" : (provider || undefined), apiKey: apiKey || undefined, rows: parsed })
      setPreview(result)
    } catch (err) {
      setPreview(null); setRows([]); setDetectedSource(null)
      setError(err instanceof Error ? err.message : "Could not parse episode data")
    } finally { setBusy(false) }
  }

  const handleImport = async () => {
    if (!preview || rows.length === 0) return
    setBusy(true); setError(null); setSuccess(null)
    try {
      const result = await importSeriesTable({ imdbId, provider: inputMode === "html" ? "Hotstar" : (provider || undefined), apiKey: apiKey || undefined, rows })
      setSuccess(result.message || "Series imported"); setPreview(null); setRows([]); setSourceText(""); setDetectedSource(null)
    } catch (err) { setError(err instanceof Error ? err.message : "Import failed") } finally { setBusy(false) }
  }

  return (
    <CollapsibleSection defaultOpen title={<><FileSpreadsheet className="h-5 w-5 text-primary" /> Import series episodes</>} description="Paste Hotstar HTML and MediaVerse will extract the episode data, show a preview, then import only after confirmation.">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="series-table-imdb">Series IMDb link or ID *</Label>
            <Input id="series-table-imdb" value={imdbId} onChange={(e) => setImdbId(e.target.value)} placeholder="https://www.imdb.com/title/tt1234567/" />
          </div>
          {inputMode === "table" && <div className="space-y-1.5"><Label htmlFor="series-table-provider">Default OTT/provider</Label><Input id="series-table-provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Hotstar" /></div>}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant={inputMode === "html" ? "default" : "outline"} onClick={() => { setInputMode("html"); setPreview(null); setRows([]) }}>Paste HTML</Button>
          <Button type="button" variant={inputMode === "table" ? "default" : "outline"} onClick={() => { setInputMode("table"); setPreview(null); setRows([]) }}>CSV / Table</Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="series-table-data">{inputMode === "html" ? "Hotstar episode-list HTML" : "CSV or spreadsheet table"}</Label>
          <textarea id="series-table-data" value={sourceText} onChange={(e) => setSourceText(e.target.value)} className="min-h-56 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder={inputMode === "html" ? '<li data-testid="episode-card">...paste Hotstar HTML here...</li>' : 'season,episode,title,duration,release_date,watch_url\n1,1,Episode One,30m,13 Mar 2026,https://...'} />
          <p className="text-xs text-muted-foreground">{inputMode === "html" ? "Currently detects Hotstar episode cards and extracts season, episode, title, duration, release date and direct watch URL. Thumbnail and synopsis are intentionally ignored." : "Required: season, episode, title. Optional: duration/runtime, watch_url/link, provider/ott, air_date/release_date, rating, episode_imdb."}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5"><Label htmlFor="series-table-key">OMDb key override (optional)</Label><Input id="series-table-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-56" placeholder="Uses server key" /></div>
          <Button onClick={handlePreview} disabled={busy || !imdbId.trim() || !sourceText.trim()}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Parse & preview</Button>
        </div>

        {error && <div className="flex items-start gap-2 whitespace-pre-line rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        {success && <div className="flex items-start gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</div>}

        {preview && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h3 className="font-semibold">{preview.title} {preview.year ? `(${preview.year})` : ""}</h3><p className="text-sm text-muted-foreground">{detectedSource} · {rows.length} episodes · {seasonCount} season{seasonCount === 1 ? "" : "s"} · {preview.totalRuntimeMinutes || 0} min total runtime</p></div>
              <Button onClick={handleImport} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Import into MediaVerse</Button>
            </div>
            <div className="max-h-96 overflow-auto rounded-md border">
              <table className="w-full min-w-[960px] text-xs">
                <thead className="sticky top-0 bg-muted"><tr><th className="px-2 py-2 text-left">Season</th><th className="px-2 py-2 text-left">Episode</th><th className="px-2 py-2 text-left">Title</th><th className="px-2 py-2 text-left">Duration</th><th className="px-2 py-2 text-left">Release date</th><th className="px-2 py-2 text-left">Provider</th><th className="px-2 py-2 text-left">Watch link</th></tr></thead>
                <tbody>{rows.map((row, index) => <tr key={`${row.season}-${row.episode}-${index}`} className="border-t"><td className="px-2 py-2">{row.season}</td><td className="px-2 py-2">{row.episode}</td><td className="px-2 py-2 font-medium">{row.title}</td><td className="px-2 py-2">{row.duration || "—"}</td><td className="px-2 py-2">{row.airDate || "—"}</td><td className="px-2 py-2">{row.provider || provider || "—"}</td><td className="max-w-64 truncate px-2 py-2" title={row.watchUrl}>{row.watchUrl || "—"}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}
