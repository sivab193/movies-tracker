"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { resolveApiUrl } from "@/lib/types"

export function RequestTitleDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imdbLink, setImdbLink] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    
    if (!imdbLink.trim()) {
      setError("Please enter an IMDB link")
      return
    }

    if (!user) {
      setError("You must be logged in to request titles")
      return
    }

    setLoading(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(resolveApiUrl("/api/requests"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imdb_link: imdbLink }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request")
      }

      setSuccess(true)
      setImdbLink("")
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Request Title
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request a Movie or Series</DialogTitle>
            <DialogDescription>
              Submit an IMDB link and an admin will review it to add it to the database.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="imdb_link">IMDB Link</Label>
              <Input
                id="imdb_link"
                placeholder="https://www.imdb.com/title/tt1234567/"
                value={imdbLink}
                onChange={(e) => setImdbLink(e.target.value)}
                disabled={loading || success}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Request submitted successfully!
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || success}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : success ? (
                "Submitted!"
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
