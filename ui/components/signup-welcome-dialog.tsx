"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export interface WelcomePrefs {
  isPublic: boolean
  displayName?: string
  photoURL?: string
  customUrl?: string
}

interface SignupWelcomeDialogProps {
  open: boolean
  displayName?: string | null
  photoURL?: string | null
  suggestedDisplayName?: string | null
  onComplete: (prefs: WelcomePrefs) => Promise<void>
}

const DEFAULT_PHOTO_URL = "/favicon-96x96.png"

export function SignupWelcomeDialog({
  open,
  displayName,
  photoURL,
  suggestedDisplayName,
  onComplete,
}: SignupWelcomeDialogProps) {
  const [isPublic, setIsPublic] = useState(false)
  const [name, setName] = useState("")
  const [nameTouched, setNameTouched] = useState(false)
  const [photo, setPhoto] = useState(DEFAULT_PHOTO_URL)
  const [customUrl, setCustomUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // (Re)initialize fields whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setIsPublic(false)
      setName(suggestedDisplayName || displayName || "")
      setNameTouched(false)
      setPhoto(photoURL || DEFAULT_PHOTO_URL)
      setCustomUrl("")
      setError(null)
      setSaving(false)
    }
  }, [open])

  // Pick up a suggested name that arrives just after opening.
  useEffect(() => {
    if (open && !nameTouched) {
      setName(suggestedDisplayName || displayName || "")
    }
  }, [open, suggestedDisplayName, displayName, nameTouched])

  async function handleContinue() {
    setSaving(true)
    setError(null)
    try {
      const prefs: WelcomePrefs = { isPublic }
      if (isPublic) {
        if (name.trim()) prefs.displayName = name.trim()
        if (photo.trim()) prefs.photoURL = photo.trim()
        if (customUrl.trim()) prefs.customUrl = customUrl.trim().toLowerCase()
      }
      await onComplete(prefs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome to MediaVerse</DialogTitle>
          <DialogDescription>
            Your account is ready. One quick privacy choice to get started:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
            <div>
              <Label htmlFor="welcome-visibility" className="font-medium">
                {isPublic ? "Public Profile" : "Private Profile"}
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isPublic
                  ? "Anyone can view your profile from the leaderboard, including your watch history. You can hide individual movies anytime in Settings."
                  : `Stay anonymous as ${displayName || "MV #"}\u2014 only your movie count and total runtime appear on the leaderboard.`}
              </p>
            </div>
            <Switch
              id="welcome-visibility"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {!isPublic && (
            <div className="rounded-xl border p-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Preview &mdash; how you&apos;ll appear on the leaderboard
              </p>
              <div className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">
                  #
                </span>
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                  {photoURL || photo ? (
                    <img
                      src={photoURL || photo}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {displayName || "MV #"}
                  </p>
                  <p className="text-xs text-muted-foreground">Private profile</p>
                </div>
                <div className="ml-auto shrink-0 text-right">
                  <p className="text-sm font-bold">128 movies</p>
                  <p className="text-xs text-muted-foreground">342h runtime</p>
                </div>
              </div>
            </div>
          )}

          {isPublic && (
            <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="welcome-name" className="text-xs font-medium">
                  Display name
                </Label>
                <Input
                  id="welcome-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameTouched(true)
                  }}
                  placeholder="e.g. MV #128"
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="welcome-photo" className="text-xs font-medium">
                  Profile picture
                </Label>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
                    {photo ? (
                      <img src={photo} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <Input
                    id="welcome-photo"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    placeholder="https://\u2026 image URL"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="welcome-url" className="text-xs font-medium">
                  Custom profile URL
                </Label>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm text-muted-foreground">/u/</span>
                  <Input
                    id="welcome-url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="myname (5\u201310 chars)"
                    maxLength={10}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleContinue} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
