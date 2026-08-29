"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, ExternalLink, Loader2, Pencil, Plus, Tv } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { WatchProvider } from "@/lib/types"
import { reportMovieWatchLink, suggestMovieWatchLinks } from "@/services/api"
import { OttMark } from "@/components/ott-provider"
import { WatchProviderEditor } from "@/components/watch-provider-editor"

type Props = {
  providers?: WatchProvider[]
  className?: string
  movieId?: string
  canReport?: boolean
  isAdmin?: boolean
  onSaveProviders?: (providers: WatchProvider[]) => Promise<void>
  compact?: boolean
}

export function WatchOnlineSection({ providers = [], className, movieId, canReport, isAdmin, onSaveProviders, compact = false }: Props) {
  const [reportProvider, setReportProvider] = useState<WatchProvider | null>(null)
  const [reason, setReason] = useState<"not_working" | "expired">("not_working")
  const [reporting, setReporting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [draftProviders, setDraftProviders] = useState<WatchProvider[]>(providers)
  const [saving, setSaving] = useState(false)
  const [suggestionOpen, setSuggestionOpen] = useState(false)
  const [suggestedProviders, setSuggestedProviders] = useState<WatchProvider[]>([])
  const [suggesting, setSuggesting] = useState(false)

  const submitReport = async () => {
    if (!movieId || !reportProvider) return
    setReporting(true)
    setFeedback("")
    try {
      const result = await reportMovieWatchLink(movieId, reportProvider, reason)
      setFeedback(result.message || "Report submitted")
      setReportProvider(null)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not submit report")
    } finally {
      setReporting(false)
    }
  }

  const openEditor = () => {
    setDraftProviders(providers)
    setFeedback("")
    setEditorOpen(true)
  }

  const saveProviders = async () => {
    if (!onSaveProviders) return
    setSaving(true)
    try {
      await onSaveProviders(draftProviders)
      setEditorOpen(false)
      setFeedback("Watch links updated")
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not update watch links")
    } finally {
      setSaving(false)
    }
  }

  const submitSuggestions = async () => {
    if (!movieId || !suggestedProviders.length) return
    setSuggesting(true)
    setFeedback("")
    try {
      const result = await suggestMovieWatchLinks(movieId, suggestedProviders)
      setFeedback(result.message || "Watch link sent for approval")
      setSuggestedProviders([])
      setSuggestionOpen(false)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not submit watch link")
    } finally {
      setSuggesting(false)
    }
  }

  return (
    <section className={className}>
      <Card className={compact ? "gap-0 py-3" : undefined}>
        <CardHeader className={`flex flex-row items-center justify-between gap-3 space-y-0 ${compact ? "px-3 pb-2" : "pb-3"}`}>
          <CardTitle className={`flex items-center gap-2 ${compact ? "text-sm" : "text-lg"}`}>
            <Tv className="h-5 w-5 text-primary" />
            Watch online
          </CardTitle>
          {isAdmin && onSaveProviders && (
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={openEditor}>
              <Pencil className="h-3.5 w-3.5" /> Edit links
            </Button>
          )}
          {!isAdmin && movieId && (canReport ? (
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 px-2 text-xs" onClick={() => { setSuggestedProviders([]); setFeedback(""); setSuggestionOpen(true) }}>
              <Plus className="h-3.5 w-3.5" /> Suggest link
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="h-8 px-2 text-xs"><Link href="/auth">Sign in to suggest</Link></Button>
          ))}
        </CardHeader>
        <CardContent className={compact ? "px-3" : undefined}>
          {providers.length ? (
            <div className="space-y-2">
              {providers.map((provider) => (
                <div key={`${provider.name}-${provider.url}`} className={`flex items-center gap-2 rounded-xl border transition-colors hover:border-primary/40 hover:bg-muted/40 ${compact ? "p-2" : "p-2.5"}`}>
                  <a href={provider.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-3" aria-label={`Watch on ${provider.name}`}>
                    <OttMark name={provider.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{provider.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(provider.regions?.length ? provider.regions : ["Region not specified"]).map((region) => <Badge key={region} variant="secondary" className="font-normal">{region}</Badge>)}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </a>
                  {!isAdmin && movieId && (
                    canReport ? (
                      <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={() => { setReason("not_working"); setFeedback(""); setReportProvider(provider) }}>
                        Report
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" size="sm" className="h-8 shrink-0 px-2 text-xs text-muted-foreground"><Link href="/auth">Sign in to report</Link></Button>
                    )
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No watch links have been added yet.</p>}
          {feedback && <p className="mt-3 text-xs font-medium text-muted-foreground" role="status">{feedback}</p>}
        </CardContent>
      </Card>

      <Dialog open={Boolean(reportProvider)} onOpenChange={(open) => !open && setReportProvider(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Report watch link</DialogTitle>
            <DialogDescription>What is wrong with the {reportProvider?.name} link for this movie?</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-2">
            <Button type="button" variant={reason === "not_working" ? "default" : "outline"} onClick={() => setReason("not_working")}>Not working</Button>
            <Button type="button" variant={reason === "expired" ? "default" : "outline"} onClick={() => setReason("expired")}>Expired</Button>
          </div>
          {feedback && <p className="text-sm text-destructive" role="alert">{feedback}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReportProvider(null)}>Cancel</Button>
            <Button type="button" onClick={submitReport} disabled={reporting}>{reporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit watch links</DialogTitle>
            <DialogDescription>Changes are published immediately on this movie page.</DialogDescription>
          </DialogHeader>
          <WatchProviderEditor providers={draftProviders} onChange={setDraftProviders} />
          {feedback && <p className="text-sm text-destructive" role="alert">{feedback}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button type="button" onClick={saveProviders} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save links</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suggestionOpen} onOpenChange={setSuggestionOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Suggest a watch link</DialogTitle>
            <DialogDescription>Add the direct movie link and region. It will only appear publicly after an admin approves it.</DialogDescription>
          </DialogHeader>
          <WatchProviderEditor providers={suggestedProviders} onChange={setSuggestedProviders} />
          {feedback && <p className="text-sm text-destructive" role="alert">{feedback}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSuggestionOpen(false)}>Cancel</Button>
            <Button type="button" onClick={submitSuggestions} disabled={suggesting || !suggestedProviders.length}>
              {suggesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send for approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
