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
  season: "season",
  seasonnumber: "season",
  season_number: "season",
  s: "season",
  episode: "episode",
  episodenumber: "episode",
  episode_number: "episode",
  ep: "episode",
  e: "episode",
  title: "title",
  name: "title",
  episodetitle: "title",
  episode_title: "title",
  duration: "duration",
  runtime: "duration",
  runtimeminutes: "duration",
  runtime_minutes: "duration",
  watchurl: "watchUrl",
  watch_url: "watchUrl",
  link: "watchUrl",
  url: "watchUrl",
  provider: "provider",
  ott: "provider",
  platform: "provider",
  airdate: "airDate",
  air_date: "airDate",
  released: "airDate",
  rating: "rating",
  imdbrating: "rating",
  imdb_rating: "rating",
  episodeimdb: "episodeImdbId",
  episode_imdb: "episodeImdbId",
  episodeimdbid: "episodeImdbId",
  imdbid: "episodeImdbId",
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
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (char === delimiter && !quoted) {
      values.push(current.trim())
      current = ""
      continue
    }
    current += char
  }
  values.push(current.trim())
  return values
}

function parseTable(text: string): SeriesTableRow[] {
  const lines = text.replace(/\r/g, "").split("\n").filter((line) => line.trim())
  if (lines.length < 2) throw new Error("Paste a header row and at least one episode row")
  const delimiter = lines[0].includes("\t") ? "\t" : ","
  const rawHeaders = splitDelimitedLine(lines[0], delimiter)
  const headers = rawHeaders.map((header) => HEADER_ALIASES[normalizeHeader(header)] || normalizeHeader(header))

  for (const required of ["season", "episode", "title"]) {
    if (!headers.includes(required)) throw new Error(`Missing required column: ${required}`)
  }

  return lines.slice(1).map((line, index) => {
    const values = splitDelimitedLine(line, delimiter)
    const raw: Record<string, string> = {}
    headers.forEach((header, column) => {
      raw[header] = values[column] ?? ""
    })
    const season = Number.parseInt(raw.season, 10)
    const episode = Number.parseInt(raw.episode, 10)
    if (!Number.isFinite(season) || !Number.isFinite(episode)) {
      throw new Error(`Row ${index + 2}: season and episode must be numbers`)
    }
    return {
      season,
      episode,
      title: raw.title,
      duration: raw.duration,
      watchUrl: raw.watchUrl,
      provider: raw.provider,
      airDate: raw.airDate,
      rating: raw.rating,
      episodeImdbId: raw.episodeImdbId,
    }
  })
}

export function AdminSeriesTableImport() {
  const [imdbId, setImdbId] = useState("")
  const [provider, setProvider] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [tableText, setTableText] = useState("")
  const [rows, setRows] = useState<SeriesTableRow[]>([])
  const [preview, setPreview] = useState<any | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const seasonCount = useMemo(() => new Set(rows.map((row) => row.season)).size, [rows])

  const handlePreview = async () => {
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const parsed = parseTable(tableText)
      setRows(parsed)
      const result = await previewSeriesTableImport({
        imdbId,
        provider: provider || undefined,
        apiKey: apiKey || undefined,
        rows: parsed,
      })
      setPreview(result)
    } catch (err) {
      setPreview(null)
      setError(err instanceof Error ? err.message : "Could not parse table")
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async () => {
    if (!preview || rows.length === 0) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await importSeriesTable({
        imdbId,
        provider: provider || undefined,
        apiKey: apiKey || undefined,
        rows,
      })
      setSuccess(result.message || "Series imported")
      setPreview(null)
      setRows([])
      setTableText("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <CollapsibleSection
      defaultOpen
      title={<><FileSpreadsheet className="h-5 w-5 text-primary" /> Import series from table/CSV</>}
      description="Paste episode data when IMDb/OMDb does not have the season or episode details you need."
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="series-table-imdb">Series IMDb link or ID *</Label>
            <Input
              id="series-table-imdb"
              value={imdbId}
              onChange={(e) => setImdbId(e.target.value)}
              placeholder="https://www.imdb.com/title/tt1234567/"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="series-table-provider">Default OTT/provider</Label>
            <Input
              id="series-table-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Hotstar"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="series-table-data">CSV or spreadsheet table</Label>
          <textarea
            id="series-table-data"
            value={tableText}
            onChange={(e) => setTableText(e.target.value)}
            className="min-h-44 w-full rounded-md border bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={'season,episode,title,duration,watch_url\n1,1,Episode One,42 min,https://...\n1,2,Episode Two,00:39:30,https://...'}
          />
          <p className="text-xs text-muted-foreground">
            Required: season, episode, title. Optional: duration/runtime, watch_url/link, provider/ott, air_date, rating, episode_imdb. CSV and tab-separated spreadsheet paste are both accepted.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="series-table-key">OMDb key override (optional)</Label>
            <Input
              id="series-table-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-56"
              placeholder="Uses server key"
            />
          </div>
          <Button onClick={handlePreview} disabled={busy || !imdbId.trim() || !tableText.trim()}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Parse & preview
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 whitespace-pre-line rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {preview && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">{preview.title} {preview.year ? `(${preview.year})` : ""}</h3>
                <p className="text-sm text-muted-foreground">
                  {rows.length} episodes · {seasonCount} season{seasonCount === 1 ? "" : "s"} · {preview.totalRuntimeMinutes || 0} min total runtime
                </p>
              </div>
              <Button onClick={handleImport} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import into MediaVerse
              </Button>
            </div>

            <div className="max-h-80 overflow-auto rounded-md border">
              <table className="w-full min-w-[780px] text-xs">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-2 py-2 text-left">Season</th>
                    <th className="px-2 py-2 text-left">Episode</th>
                    <th className="px-2 py-2 text-left">Title</th>
                    <th className="px-2 py-2 text-left">Duration</th>
                    <th className="px-2 py-2 text-left">Provider</th>
                    <th className="px-2 py-2 text-left">Watch link</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.season}-${row.episode}-${index}`} className="border-t">
                      <td className="px-2 py-2">{row.season}</td>
                      <td className="px-2 py-2">{row.episode}</td>
                      <td className="px-2 py-2 font-medium">{row.title}</td>
                      <td className="px-2 py-2">{row.duration || "—"}</td>
                      <td className="px-2 py-2">{row.provider || provider || "—"}</td>
                      <td className="max-w-56 truncate px-2 py-2" title={row.watchUrl}>{row.watchUrl || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}
