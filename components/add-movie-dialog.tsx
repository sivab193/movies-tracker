"use client"

import React from "react"

import { useState } from "react"
import { Plus, Loader2, Film } from "lucide-react"
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

interface AddMovieDialogProps {
  onMovieAdded: () => void
}

export function AddMovieDialog({ onMovieAdded }: AddMovieDialogProps) {
  const [open, setOpen] = useState(false)
  const [imdbUrl, setImdbUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractImdbId = (url: string): string | null => {
    // Match IMDb URLs like:
    // https://www.imdb.com/title/tt1234567/
    // https://imdb.com/title/tt1234567
    // tt1234567
    const match = url.match(/tt\d{7,8}/)
    return match ? match[0] : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const imdbId = extractImdbId(imdbUrl)
    if (!imdbId) {
      setError("Please enter a valid IMDb URL or ID (e.g., tt1234567)")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imdbId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add movie")
      }

      setImdbUrl("")
      setOpen(false)
      onMovieAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add movie")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Movie
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Add a Movie
          </DialogTitle>
          <DialogDescription>
            Enter an IMDb URL or ID to add a movie to the database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

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
      </DialogContent>
    </Dialog>
  )
}
