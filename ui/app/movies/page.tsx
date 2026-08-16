"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Film, Loader2, Search, SlidersHorizontal, Tv } from "lucide-react"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getMovies } from "@/services/api"
import { resolveApiUrl, type Movie } from "@/lib/types"
import { OttMark } from "@/components/ott-provider"

const PAGE_SIZE = 24

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [search, setSearch] = useState("")
  const [language, setLanguage] = useState("all")
  const [watchAvailable, setWatchAvailable] = useState(false)
  const [sort, setSort] = useState("latest")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await getMovies(skip, PAGE_SIZE, language, search, "", false, "", "", watchAvailable, sort)
        setMovies(data.movies || [])
        setTotal(data.total || 0)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [skip, search, language, watchAvailable, sort])

  const toggleWatchAvailable = () => {
    setWatchAvailable((current) => !current)
    setSkip(0)
  }

  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-7xl px-4 py-8">
    <div className="mb-6"><h1 className="flex items-center gap-2 text-3xl font-bold"><Film className="text-primary" /> Movies</h1><p className="mt-2 text-muted-foreground">{total} movie{total === 1 ? "" : "s"}{watchAvailable ? " with watch-online links" : " in the catalog"}.</p></div>
    <div className="mb-7 flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setSkip(0) }} className="pl-9" placeholder="Search movies" /></div>
      <Select value={language} onValueChange={(value) => { setLanguage(value); setSkip(0) }}><SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Language" /></SelectTrigger><SelectContent><SelectItem value="all">All languages</SelectItem><SelectItem value="Tamil">Tamil</SelectItem><SelectItem value="English">English</SelectItem><SelectItem value="Hindi">Hindi</SelectItem><SelectItem value="Malayalam">Malayalam</SelectItem><SelectItem value="Telugu">Telugu</SelectItem><SelectItem value="Kannada">Kannada</SelectItem></SelectContent></Select>
      <Button type="button" variant={watchAvailable ? "default" : "outline"} onClick={toggleWatchAvailable} className="gap-2 whitespace-nowrap"><Tv className="h-4 w-4" />Watch online{watchAvailable ? " ✓" : ""}</Button>
      <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" /><Select value={sort} onValueChange={(value) => { setSort(value); setSkip(0) }}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="latest">Newest releases</SelectItem><SelectItem value="oldest">Oldest releases</SelectItem><SelectItem value="title_asc">Title: A–Z</SelectItem><SelectItem value="title_desc">Title: Z–A</SelectItem><SelectItem value="rating">Highest rated</SelectItem></SelectContent></Select></div>
    </div>
    {loading ? <div className="flex h-52 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> : <>
      {movies.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{movies.map((movie) => <Link key={movie.id} href={`/movie/${movie.id}`} className="group"><div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted">{movie.posterUrl ? <img src={resolveApiUrl(movie.posterUrl)} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Film /></div>}{movie.watchProviders?.length ? <div className="absolute right-2 top-2"><OttMark name={movie.watchProviders[0].name} className="h-7 w-7 rounded-md text-[8px]" /></div> : null}</div><p className="mt-2 line-clamp-2 text-sm font-medium">{movie.title}</p><p className="text-xs text-muted-foreground">{movie.year}</p></Link>)}</div> : <div className="rounded-xl border border-dashed py-16 text-center"><Tv className="mx-auto mb-3 h-7 w-7 text-muted-foreground" /><p className="font-medium">No movies match these filters.</p><p className="mt-1 text-sm text-muted-foreground">Try clearing the Watch online filter or changing your search.</p></div>}
      <div className="mt-7 flex items-center justify-between"><span className="text-sm text-muted-foreground">Showing {movies.length ? skip + 1 : 0}–{Math.min(skip + PAGE_SIZE, total)} of {total}</span><div className="flex gap-2"><Button variant="outline" disabled={!skip} onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}>Previous</Button><Button variant="outline" disabled={skip + PAGE_SIZE >= total} onClick={() => setSkip(skip + PAGE_SIZE)}>Next</Button></div></div>
    </>}</main></div>
}
