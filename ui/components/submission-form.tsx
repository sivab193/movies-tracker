"use client"

import React from "react"

import { useState } from "react"
import { Clock, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { parseTimeInput } from "@/lib/types"
import { addSubmission } from "@/services/api"

interface SubmissionFormProps {
  movieId: string
  runtimeMinutes?: number // Movie runtime in minutes for validation
  onSubmitted: () => void
  compact?: boolean
}

export function SubmissionForm({ movieId, runtimeMinutes, onSubmitted, compact = false }: SubmissionFormProps) {
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

    // Validate against movie runtime if available
    const maxSeconds = runtimeMinutes ? runtimeMinutes * 60 : 60 * 60
    if (timeSeconds > maxSeconds) {
      setError(`Time cannot exceed movie runtime (${runtimeMinutes || 60} minutes)`)
      return
    }

    setLoading(true)

    try {
      await addSubmission({
        movieId,
        timeInSeconds: timeSeconds,
        rawInput: timeInput,
        comment: comment.trim() || undefined,
      })

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
    <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "space-y-4"}>
      <div className={compact ? "space-y-1.5" : "space-y-2"}>
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
          className={compact ? "h-9" : "text-lg"}
        />
        {!compact && <p className="text-xs text-muted-foreground">
          Enter minutes only (12) or minutes:seconds (12:35)
        </p>}
      </div>

      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        <Label htmlFor="comment">Optional note</Label>
        <Textarea
          id="comment"
          placeholder="e.g., After the opening action scene"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading}
          rows={compact ? 1 : 2}
          className={compact ? "min-h-9 resize-none" : undefined}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Thanks for your submission!
        </p>
      )}

      <Button type="submit" disabled={loading || !timeInput.trim()} size={compact ? "sm" : "default"} className="w-full gap-2">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {compact ? "Submit time" : "Submit Title Card Time"}
          </>
        )}
      </Button>
    </form>
  )
}
