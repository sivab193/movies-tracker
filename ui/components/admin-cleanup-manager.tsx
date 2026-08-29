"use client"

import { useState } from "react"
import { Database, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMovieDuplicates, getTheaterDuplicates, mergeMovieDuplicates, mergeTheaterDuplicates } from "@/services/api"

export function AdminCleanupManager() {
  const [movieGroups, setMovieGroups] = useState<any[]>([])
  const [theaterGroups, setTheaterGroups] = useState<any[]>([])
  const [movieCount, setMovieCount] = useState(0)
  const [theaterCount, setTheaterCount] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [merging, setMerging] = useState<"movies" | "theaters" | null>(null)
  const scan = async () => { setScanning(true); try { const [movies, theaters] = await Promise.all([getMovieDuplicates(), getTheaterDuplicates()]); setMovieGroups(movies.duplicateGroups || []); setMovieCount(movies.totalDuplicatesCount || 0); setTheaterGroups(theaters.duplicateGroups || []); setTheaterCount(theaters.totalDuplicatesCount || 0) } finally { setScanning(false) } }
  const merge = async (type: "movies" | "theaters") => { const count = type === "movies" ? movieCount : theaterCount; if (!count || !confirm(`Merge all ${count} duplicate ${type}? References in watch history will be moved to the kept records.`)) return; setMerging(type); try { if (type === "movies") await mergeMovieDuplicates(); else await mergeTheaterDuplicates(); await scan() } catch (error) { alert(error instanceof Error ? error.message : "Merge failed") } finally { setMerging(null) } }
  return <Card className="border-amber-500/30"><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-amber-500" />Duplicate scanner</CardTitle><p className="mt-1 text-sm text-muted-foreground">Find duplicates before merging them and repointing dependent records.</p></div><Button onClick={scan} disabled={scanning}>{scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Scan</Button></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><DuplicateGroup title="Movies" count={movieCount} groups={movieGroups} describe={(group) => `Keep ${group.kept.title} (${group.kept.year || "—"}); merge ${group.duplicates.length}`} onMerge={() => merge("movies")} loading={merging === "movies"} /><DuplicateGroup title="Theaters" count={theaterCount} groups={theaterGroups} describe={(group) => `Keep ${group.kept.name} (${group.kept.location || "—"}); merge ${group.duplicates.length}`} onMerge={() => merge("theaters")} loading={merging === "theaters"} /></CardContent></Card>
}

function DuplicateGroup({ title, count, groups, describe, onMerge, loading }: { title: string; count: number; groups: any[]; describe: (group: any) => string; onMerge: () => void; loading: boolean }) { return <div className="flex flex-col rounded-xl border p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Duplicate {title}</h2><span className={`rounded-full px-2 py-1 text-xs font-bold ${count ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"}`}>{count} found</span></div><div className="mb-4 max-h-72 flex-1 space-y-2 overflow-y-auto">{groups.length ? groups.map((group, index) => <div key={index} className="rounded-lg bg-muted/40 p-2 text-xs">{describe(group)}</div>) : <p className="text-sm text-muted-foreground">Run a scan to inspect this collection.</p>}</div><Button onClick={onMerge} disabled={!count || loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Merge {count || ""} {title}</Button></div> }
