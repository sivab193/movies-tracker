"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Film, Loader2, Search } from "lucide-react"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getMovies } from "@/services/api"
import { resolveApiUrl, type Movie } from "@/lib/types"

const PAGE_SIZE = 24
export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]); const [total, setTotal] = useState(0); const [skip, setSkip] = useState(0); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true)
  useEffect(() => { const timer = setTimeout(async () => { setLoading(true); try { const data = await getMovies(skip, PAGE_SIZE, "", search); setMovies(data.movies || []); setTotal(data.total || 0) } finally { setLoading(false) } }, 300); return () => clearTimeout(timer) }, [skip, search])
  return <div className="min-h-screen bg-background"><Header /><main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6"><h1 className="flex items-center gap-2 text-3xl font-bold"><Film className="text-primary" /> Movies</h1><p className="mt-2 text-muted-foreground">{total} movies in the catalog.</p></div><div className="relative mb-6 max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setSkip(0) }} className="pl-9" placeholder="Search movies" /></div>{loading ? <div className="flex h-52 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> : <><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{movies.map((movie) => <Link key={movie.id} href={`/movie/${movie.id}`} className="group"><div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted">{movie.posterUrl ? <img src={resolveApiUrl(movie.posterUrl)} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Film /></div>}</div><p className="mt-2 line-clamp-2 text-sm font-medium">{movie.title}</p><p className="text-xs text-muted-foreground">{movie.year}</p></Link>)}</div><div className="mt-7 flex items-center justify-between"><span className="text-sm text-muted-foreground">Showing {movies.length ? skip + 1 : 0}–{Math.min(skip + PAGE_SIZE, total)} of {total}</span><div className="flex gap-2"><Button variant="outline" disabled={!skip} onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}>Previous</Button><Button variant="outline" disabled={skip + PAGE_SIZE >= total} onClick={() => setSkip(skip + PAGE_SIZE)}>Next</Button></div></div></>}</main></div>
}
