"use client"

import React, { useState } from "react"
import { addMovie, searchMovies } from "@/services/api"
import { Plus, Loader2, Film, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AddMovieDialogProps {
  onMovieAdded: () => void
}

export function AddMovieDialog({ onMovieAdded }: AddMovieDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"search" | "imdb">("search")
  
  // Search tab states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  
  // IMDb tab states
  const [imdbUrl, setImdbUrl] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractImdbId = (url: string): string | null => {
    const match = url.match(/tt\d{7,8}/)
    return match ? match[0] : null
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setError(null)
    try {
      const data = await searchMovies(searchQuery)
      if (data.Response === "True") {
        setSearchResults(data.Search?.slice(0, 5) || [])
      } else {
        setSearchResults([])
        setError(data.Error || "No movies found")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setSearching(false)
    }
  }

  const handleAddMovie = async (imdbId: string) => {
    setLoading(true)
    setError(null)
    try {
      await addMovie(imdbId)
      setOpen(false)
      setSearchQuery("")
      setSearchResults([])
      setImdbUrl("")
      onMovieAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add movie")
    } finally {
      setLoading(false)
    }
  }

  const handleImdbSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const imdbId = extractImdbId(imdbUrl)
    if (!imdbId) {
      setError("Please enter a valid IMDb URL or ID (e.g., tt1234567)")
      return
    }
    await handleAddMovie(imdbId)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) {
        setError(null)
        setSearchQuery("")
        setSearchResults([])
        setImdbUrl("")
      }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Movie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Add Movie
          </DialogTitle>
          <DialogDescription>
            Search by title or enter an IMDb ID to add a movie.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-md">{error}</p>
        )}

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setError(null); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Title</TabsTrigger>
            <TabsTrigger value="imdb">IMDb URL/ID</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 pt-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search movie title... (e.g. Inception)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={searching || loading}
              />
              <Button type="submit" size="icon" disabled={searching || loading || !searchQuery.trim()} aria-label="Search movie" title="Search movie">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {searchResults.map((m) => (
                <div key={m.imdbID} className="flex items-center gap-3 p-2 border rounded-lg bg-card">
                  <div className="h-12 w-8 bg-muted rounded overflow-hidden flex-shrink-0">
                    {m.Poster && m.Poster !== "N/A" ? (
                      <img src={m.Poster} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Film className="h-4 w-4 m-auto opacity-35" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{m.Title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.Year}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={loading || m.exists}
                    onClick={() => handleAddMovie(m.imdbID)}
                    className="h-8 shrink-0"
                  >
                    {m.exists ? "Added" : "Add"}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="imdb" className="space-y-4 pt-2">
            <form onSubmit={handleImdbSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imdb-url">IMDb URL or ID</Label>
                <Input
                  id="imdb-url"
                  placeholder="https://www.imdb.com/title/tt1234567/"
                  value={imdbUrl}
                  onChange={(e) => setImdbUrl(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Paste the full IMDb URL or just the ID (e.g., tt1234567)
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !imdbUrl.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding movie...
                  </>
                ) : (
                  "Add Movie"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
