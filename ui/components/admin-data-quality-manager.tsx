"use client"

import { useState } from "react"
import Link from "next/link"
import { ClipboardList, ExternalLink, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMovieDataQuality } from "@/services/api"

export function AdminDataQualityManager() {
  const [report, setReport] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const scan = async () => { setLoading(true); try { setReport(await getMovieDataQuality()) } catch (error) { alert(error instanceof Error ? error.message : "Scan failed") } finally { setLoading(false) } }
  const groups = [{ title: "Missing runtime", items: report?.noRuntime || [] }, { title: "Missing cover art", items: report?.noPoster || [] }, { title: "Missing title-card time", items: report?.noTitleCard || [] }]
  return <Card className="border-sky-500/30"><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-sky-500" />Movie data quality</CardTitle><p className="mt-1 text-sm text-muted-foreground">Find incomplete movie records and open them directly for correction.</p></div><Button onClick={scan} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Scan</Button></CardHeader><CardContent className="grid gap-4 md:grid-cols-3">{groups.map((group) => <div key={group.title} className="rounded-xl border p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{group.title}</h2><span className={`rounded-full px-2 py-1 text-xs font-bold ${group.items.length ? "bg-amber-500/10 text-amber-600" : "bg-green-500/10 text-green-600"}`}>{group.items.length}</span></div>{report ? group.items.length ? <div className="max-h-96 space-y-1 overflow-y-auto">{group.items.map((movie: any) => <Link key={movie.id} href={`/admin/movies?search=${encodeURIComponent(movie.title)}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"><span className="truncate">{movie.title} {movie.year ? `(${movie.year})` : ""}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" /></Link>)}</div> : <p className="text-sm text-muted-foreground">Everything is complete.</p> : <p className="text-sm text-muted-foreground">Run a scan to see results.</p>}</div>)}</CardContent></Card>
}
