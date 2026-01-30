"use client"

import React from "react"

import { useState } from "react"
import { Clock, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { parseTimeInput } from "@/lib/types"

interface SubmissionFormProps {
  movieId: string
  onSubmitted: () => void
}

export function SubmissionForm({ movieId, onSubmitted }: SubmissionFormProps) {
  const [timeInput, setTimeInput] = useState("")
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const timeSeconds = parseTimeInput(timeInput)
    if (timeSeconds === null) {
      setError("Please enter a valid time (e.g., 12 or 12:35)")
      return
    }

    if (timeSeconds > 60 * 60) {
      setError("Time seems too long. Are you sure that's correct?")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          timeInSeconds: timeSeconds,
          rawInput: timeInput,
          comment: comment.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit")
      }

      setTimeInput("")
      setComment("")
      setSuccess(true)
      onSubmitted()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="time-input" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          When does the title card appear?
        </Label>
        <Input
          id="time-input"
          placeholder="e.g., 12 or 12:35"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          disabled={loading}
          className="text-lg"
        />
        <p className="text-xs text-muted-foreground">
          Enter minutes only (12) or minutes:seconds (12:35)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Optional note</Label>
        <Textarea
          id="comment"
          placeholder="e.g., After the opening action scene"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading}
          rows={2}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Thanks for your submission!
        </p>
      )}

      <Button type="submit" disabled={loading || !timeInput.trim()} className="w-full gap-2">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Title Card Time
          </>
        )}
      </Button>
    </form>
  )
}
