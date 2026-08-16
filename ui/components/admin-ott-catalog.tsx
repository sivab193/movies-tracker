"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ExternalLink, Loader2, Tv } from "lucide-react"
import { CollapsibleSection } from "@/components/collapsible-section"
import { OttMark } from "@/components/ott-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getMovies } from "@/services/api"
import { getAllSeries } from "@/services/series-service"

type CatalogItem = { id: string; type: "movie" | "series"; title: string; year?: number; url: string; regions: string[]; provider: string }

export function AdminOttCatalog() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState("")
  const [partialError, setPartialError] = useState("")

  useEffect(() => {
    Promise.allSettled([getMovies(0, 500, "", "", "", undefined, undefined, undefined, true), getAllSeries(undefined, undefined, undefined, true)]).then(([movieResult, seriesResult]) => {
      const toItems = (titles: any[], type: "movie" | "series") => titles.flatMap((title) =>
        (title.watchProviders || []).map((provider: any) => ({ id: title.id, type, title: title.title, year: title.year, url: provider.url, regions: provider.regions || [], provider: provider.name }))
      )
      const catalog = [
        ...(movieResult.status === "fulfilled" ? toItems(movieResult.value.movies || [], "movie") : []),
        ...(seriesResult.status === "fulfilled" ? toItems(seriesResult.value, "series") : []),
      ]
      setItems(catalog)
      setSelected(catalog[0]?.provider || "")
      if (movieResult.status === "rejected" || seriesResult.status === "rejected") {
        console.error("Some OTT catalog data could not be loaded", { movieResult, seriesResult })
        setPartialError("Some catalog data could not be loaded. Available titles are still shown below.")
      }
    }).finally(() => setLoading(false))
  }, [])

  const providers = useMemo(() => Array.from(new Set(items.map((item) => item.provider))).sort(), [items])
  const providerItems = items.filter((item) => item.provider === selected)

  return <CollapsibleSection title={<><Tv className="h-5 w-5 text-primary" />OTT catalog</>} description="Browse every title linked to each streaming service">
    {loading ? <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading availability…</div> : providers.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No OTT links have been added yet.</p> : <div className="space-y-4">
      {partialError && <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">{partialError}</p>}
      <Select value={selected} onValueChange={setSelected}><SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Select an OTT" /></SelectTrigger><SelectContent>{providers.map((provider) => <SelectItem key={provider} value={provider}><span className="flex items-center gap-2"><OttMark name={provider} className="h-5 w-5 rounded text-[7px]" />{provider}</span></SelectItem>)}</SelectContent></Select>
      <div className="rounded-lg border">
        <div className="border-b bg-muted/30 px-3 py-2 text-sm font-medium">{providerItems.length} linked title{providerItems.length === 1 ? "" : "s"}</div>
        <div className="divide-y">{providerItems.map((item) => <div key={`${item.type}-${item.id}-${item.url}`} className="flex items-center gap-3 p-3 text-sm"><OttMark name={selected} /><div className="min-w-0 flex-1"><Link href={`/${item.type === "movie" ? "movie" : "series"}/${item.id}`} className="font-medium hover:text-primary hover:underline">{item.title}{item.year ? ` (${item.year})` : ""}</Link><p className="text-xs text-muted-foreground">{item.type === "movie" ? "Movie" : "Series"} · {item.regions.join(", ") || "Region not set"}</p></div><a href={item.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" aria-label={`Open ${item.title} on ${selected}`}><ExternalLink className="h-4 w-4" /></a></div>)}</div>
      </div>
    </div>}
  </CollapsibleSection>
}
